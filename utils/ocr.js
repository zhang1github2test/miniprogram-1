// utils/ocr.js
async function ocrImage(imageData) {

  return new Promise((resolve, reject) => {
    wx.request({
      url: 'http://localhost:8080/orc/task',
      method: 'POST',
      data: {
        image: imageData,
      },
      header: {
        'Content-Type': 'application/json'
      },
      success: (res) => resolve(res.data),
      fail: (err) => reject(err)
    });
  });
}

module.exports = {
  ocrImage
};



module.exports = {
  ocrImage
};
