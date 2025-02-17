const app = getApp();
const ocr = require('../../utils/ocr.js');

Page({
  data: {
    imageSrc: '',
    recognizedText: '',
    recitationInProgress: false,
    feedbackText: '',
  },
  // 点击图片时调用
  previewImage: function () {
    wx.previewImage({
      current: this.data.imageSrc, // 当前显示图片的http链接
      urls: [this.data.imageSrc]    // 需要预览的图片http链接列表
    });
  },
  // 选择图片
  chooseImage() {
    wx.chooseImage({
      count: 1,
      success: (res) => {
        const imagePath = res.tempFilePaths[0];
        this.setData({ imageSrc: imagePath });

        wx.getFileSystemManager().readFile({
          filePath: imagePath,
          encoding: 'base64',
          success: (res) => {
            // OCR识别
            ocr.ocrImage(res.data).then((response) => {
              const text = response.words_result.map(item => item.words).join('\n');
              this.setData({ recognizedText: text });
              console.info(text)
            }).catch((error) => {
              this.setData({ imageSrc: "" });
              wx.showToast({ title: '文字识别失败', icon: 'none' });
            });
          }
        });
      }
    });
  },

  // 开始背诵
  startRecitation() {
    this.setData({ recitationInProgress: true, feedbackText: '' });
    wx.startRecord({
      success: (res) => {
        const tempFilePath = res.tempFilePath;
        this.checkRecitation(tempFilePath);
      },
      fail: () => {
        wx.showToast({ title: '录音失败', icon: 'none' });
      }
    });
  },

  // 停止背诵
  stopRecitation() {
    this.setData({ recitationInProgress: false });
    wx.stopRecord();
  },

  // 检查背诵内容
  checkRecitation(tempFilePath) {
    wx.uploadFile({
      url: 'https://api.example.com/recitation_check', // 假设有一个 API 检查背诵
      filePath: tempFilePath,
      name: 'file',
      formData: {
        recognizedText: this.data.recognizedText
      },
      success: (res) => {
        const data = JSON.parse(res.data);
        if (data.success) {
          this.setData({ feedbackText: '背诵正确！' });
        } else {
          this.setData({ feedbackText: '有错误，继续加油！' });
        }
      },
      fail: () => {
        wx.showToast({ title: '检查失败', icon: 'none' });
      }
    });
  }
});
