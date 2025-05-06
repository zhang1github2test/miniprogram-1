// app.js

const BASE_URL = 'https://hdsw.top:8443/syx-service'
App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
        if (res.code) {
          wx.request({
              url: `${BASE_URL}/api/login`,
              method: 'POST',
              data: {
                  code: res.code
              },
              success: (res) => {
                  if (res.data.token) {
                      wx.setStorageSync('token', res.data.token);
                      wx.showToast({
                          title: '登录成功',
                      });
                  }
              },
              fail: (err) => {
                  console.error('请求失败', err);
              }
          });
      }

      }
    })
  },
  globalData: {
    userInfo: null,
    baiDuAccessToken:""
  }
})
