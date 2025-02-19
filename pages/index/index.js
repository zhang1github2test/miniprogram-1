const app = getApp();
const ocr = require('../../utils/ocr.js');

Page({
  data: {
    imageSrc: '',
    // 识别到的文字
    recognizedText: '',
    recitationInProgress: false,
    successFileName:'',
    feedbackText: '',
    audioSrc:'',
  },
  onReady() {
    this.recorderManager = wx.getRecorderManager();  // 获取录音管理器
    this.recorderManager.onStart(() => {
      console.log('录音开始');
      this.setData({
        recitationInProgress: true,
      });
    });
    this.recorderManager.onStop((res) => {
      console.log('录音停止', res);
      this.setData({
        recitationInProgress: false,
        audioFile: res.tempFilePath,  // 获取录音文件路径
        duration: Math.floor(res.duration / 1000),  // 获取录音时长（秒）
      });
      this.setData({
        audioSrc: tempFilePath  // 设置录音路径
      })
      // 调用上传文件函数
      this.uploadRecording(res.tempFilePath);
    });
    this.recorderManager.onError((err) => {
      console.error('录音错误', err);
      this.setData({
        recitationInProgress: false,
      });
    });
  },
    // 开始录音
    startRecord() {
      const options = {
        duration: 60000,  // 设置录音最大时长，单位毫秒
        sampleRate: 16000,  // 设置采样率
        numberOfChannels: 1,  // 设置录音的声道数
        encodeBitRate: 96000,  // 设置编码码率
        format: 'mp3',  // 设置录音文件格式
      };
      this.recorderManager.start(options);  // 开始录音
      this.setData({
        duration: 0,  // 重置时长
      });
  
      // 启动定时器更新时长
      this.timer = setInterval(() => {
        this.setData({
          duration: this.data.duration + 1,
        });
      }, 1000);
    },
  
    // 停止录音
    stopRecord() {
      this.recorderManager.stop();  // 停止录音
      clearInterval(this.timer);  // 清除定时器
    },
    // 上传录音文件到后台
    uploadRecording(filePath) {
      wx.uploadFile({
        url: 'https://hdsw.top:8443/syx-service/upload',  // 替换成你的后台上传接口
        filePath: filePath,
        name: 'file',  // 这个参数是后台接收文件时的字段名
        formData: {
          user: 'example',  // 你可以根据需要传递其他参数
          duration: this.data.duration,
        },
        success(res) {
          const data = res.data; 
          console.log('上传成功', data);
          // 根据需要处理服务器返回的结果
        },
        fail(err) {
          console.error('上传失败', err);
          wx.showToast({
            title: '上传失败，请重试',
            icon: 'none',
          });
        }
      });
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


  startCheck(){
    
  }
});
