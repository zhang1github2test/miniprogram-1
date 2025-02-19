// utils/ocr.js
const appId = '你的百度APP_ID';
const app = getApp()
const apiKey = 'KJiWvDqnLAVuQsm3MniM3xwy';
const secretKey = 'NXqO4sbsV7VUmTwqhhCAhFF4pjlluJx6';
async function ocrImage(imageData) {
  var access_token = app.globalData.baiDuAccessToken
  if (!access_token) {
    const tokenData = await getAccessToken(); 
    access_token = tokenData.access_token;
    app.globalData.baiDuAccessToken = access_token
    console.info(tokenData)
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: 'https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token='+ access_token,
      method: 'POST',
      data: {
        image: imageData,
        access_token: access_token
      },
      header: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      success: (res) => resolve(res.data),
      fail: (err) => reject(err)
    });
  });
}

module.exports = {
  ocrImage
};


async function getAccessToken() {
  const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`;
  
  return new Promise((resolve, reject) => {
    wx.request({
      url: url,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      success: (res) => resolve(res.data),
      fail: (err) => reject(err)
    });
  });
}


module.exports = {
  ocrImage
};
