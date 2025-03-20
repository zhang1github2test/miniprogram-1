// pages/common/request.js
const BASE_URL = 'http://localhost:8080'; // 替换为你的后端地址
let isRefreshing = false; // 标记是否正在刷新Token
let retryQueue = []; // 用于存储需要重试的请求

// 获取Token
const getStorageToken = () => wx.getStorageSync('token') || '';

// 重新登录函数
const refreshToken = () => {
  return new Promise((resolve, reject) => {
    wx.login({
      success: (res) => {
        if (res.code) {
          wx.request({
            url: `${BASE_URL}/api/login`,
            method: 'POST',
            data: { code: res.code },
            success: (loginRes) => {
              if (loginRes.data.token) {
                wx.setStorageSync('token', loginRes.data.token);
                resolve(loginRes.data.token);
              } else {
                reject(new Error('重新登录失败'));
              }
            },
            fail: (err) => reject(err),
          });
        }
      },
      fail: (err) => reject(err),
    });
  });
};

// 封装请求函数（新增uploadFile支持）
const request = async (url, options = {}) => {
  const token = getStorageToken();
  const config = {
    url: `${BASE_URL}${url}`,
    method: options.method || 'GET',
    data: options.data || {},
    header: {
      'Authorization': `Bearer ${token}`,
    },
    enableChunked: options.enableChunked,
    onChunked: options.onChunked,
  };

  try {
    const res = await new Promise((resolve, reject) => {
      if (options.filePath) {
        config.filePath= options.filePath, // 新增文件路径参数
        config.name=  options.name, // 文件字段名（如 'file'）
        config.formData= options.formData, // 表单数据
        // 处理文件上传
        wx.uploadFile({
          ...config,
          success: (res) => resolve(res),
          fail: (err) => reject(err),
        });
      }else if (options.enableChunked){
        debugger
        config.header['Content-Type'] = 'application/json'
         // 启用流式传输
         const requestTask = wx.request({
          ...config,
          success: (res) => {
            if (res.statusCode === 200) {
              resolve(res);
            } else {
              reject(new Error(`请求失败: ${res.statusCode}`));
            }
          },
          fail: (err) => reject(err),
        });

        // 监听分块数据
        requestTask.onChunkReceived(config.onChunked);
      }else {
        config.header['Content-Type'] = 'application/json'
        // 处理普通请求
        wx.request({
          ...config,
          success: (res) => resolve(res),
          fail: (err) => reject(err),
        });
      }
    });

    if (res.statusCode === 200) {
      return res.data;
    } else if (res.statusCode === 401) {
      return handleUnauthorized(config);
    } else {
      throw new Error(`请求失败: ${res.statusCode}`);
    }
  } catch (error) {
    throw error;
  }
};

// 处理401错误（与之前相同）
const handleUnauthorized = async (config) => {
  if (isRefreshing) {
    // 如果正在刷新，将请求加入队列等待
    return new Promise((resolve, reject) => {
      retryQueue.push({ config, resolve, reject });
    });
  }

  isRefreshing = true;
  let newToken;

  try {
    newToken = await refreshToken();
  } catch (error) {
    isRefreshing = false;
    // 重新登录失败，通知所有等待的请求
    retryQueue.forEach((item) => item.reject(error));
    retryQueue = [];
    throw error;
  }

  // 更新Token并重新发送请求
  config.header.Authorization = `Bearer ${newToken}`;
  const retryPromise = wx.request(config);

  isRefreshing = false;
  retryQueue.forEach((item) => {
    item.config.header.Authorization = `Bearer ${newToken}`;
    item.resolve(wx.request(item.config));
  });
  retryQueue = [];

  return retryPromise.then((res) => res.data);
};

export default request;