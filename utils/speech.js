// wx.request 用于发送 POST 请求创建任务
import request from '../utils/request';
function createTask(filename, date) {
  return new Promise((resolve, reject) => {
  request(`/speech-to-txt/task?filename=${filename}&date=${date}`,{
        "method": 'POST',
    }).then(resp=> {
      console.info(resp)
      if(resp.task_id) {
        resolve(resp)
      }else {
        reject('创建任务失败');
      }
    }).catch((err) => {
      reject(err)
    })
  });
}

// wx.request 用于每秒查询任务状态
function queryTaskStatus(taskId) {
  return new Promise((resolve, reject) => {
    request(`/speech-to-txt/task?taskId=${taskId}`,{
          "method": 'GET',
      }).then(resp=> {
        console.info(resp)
        if(resp.tasks_info.length > 0) {
          resolve(resp.tasks_info[0])
        }else {
          reject('查询任务失败');
        }
      }).catch((err) => {
        reject(err)
      })
    });
}

// 通过 setInterval 来定时查询任务状态
function startTaskPolling(taskId) {
  const intervalId = setInterval(() => {
    queryTaskStatus(taskId).then((taskInfo) => {
      const { task_status, task_result } = taskInfo;
      if (task_status === 'Success') {
        // 任务成功，回显识别内容
        wx.setStorageSync('result', task_result.result[0]);
        clearInterval(intervalId); // 结束定时查询
      } else if (task_status === 'Failure') {
        // 任务失败，回显错误信息
        wx.setStorageSync('result', '语音识别失败');
        clearInterval(intervalId); // 结束定时查询
      }
      // 其他状态继续查询
    }).catch((err) => {
      clearInterval(intervalId); // 结束定时查询
      wx.setStorageSync('result', '查询失败');
    });
  }, 1000); // 每秒查询一次
}
module.exports = {
  createTask,
  startTaskPolling,
  queryTaskStatus
};