const app = getApp();
const ocr = require('../../utils/ocr.js');
const speech = require('../../utils/speech.js');

import request from '../../utils/request';
Page({
  data: {
    imageSrc: '',
    // 识别到的文字
    recognizedText: '',
    recitationInProgress: false,
    formattedText: '',
    audioSrc:'',
    successFileName: '',
    parentPath: '',
    result: '',
    markdownText:'',
    // 大模型识别到背诵情况分析
    llmRespText:'',
    currentMode:'query',
    units: ['第一单元', '第二单元'],
    selectedUnit: '',
    types: ['好词','课文'],
    selectType: '',
    notes:'',
    grade:'',
    page: 1
  },
  selectUnit(e) {
    this.setData({ selectedUnit: this.data.units[e.detail.value] });
  },
  selectType(e) {
    this.setData({ selectType: this.data.types[e.detail.value] });
  },
    // 切换模式
  switchMode(e) {
    const mode = e.currentTarget.dataset.mode;
      this.setData({
        currentMode: mode,
        // 重置其他模式数据（避免残留）
        recognizedText: '',
        reciteContent: null
      });
    },
    // 查询背诵内容
    queryContent(){
        request("/v1/recite-content/query",{
          "method":"POST",
          "data":{
            "grade":this.data.grade,
            "notes":this.data.notes,
            "unitName": this.data.selectedUnit,
            "type":this.data.selectType,
            "page":this.data.page,
          }
        }).then((res) => {
          if(res.code != 200) {
            wx.showToast({
              title: '查询要背诵的内容失败',
            })
          }
          console.log(res.data)
          const mergedText = res.data.items.map((item, index) => {
            return `${index + 1}. ${item.word}: ${item.definition} 例句：${item.example}`;
          }).join('<br>');
          this.setData({
            formattedText: mergedText
          })
          console.log(mergedText);
        }).catch((err) => {
          console.info("查询要背诵的内容发生异常!",err)
        })
    },
    handlePageInput(e) {
      const inputValue = e.detail.value;
      var pageValue =  parseInt(inputValue)
      // 更新 page 数据
      this.setData({
        page: pageValue
        });
    },
    handleGradeInput(e){
      const inputValue = e.detail.value;
         // 更新 recognizedText 数据
    this.setData({
      grade: inputValue
      });
    },
    handleNoteInput(e){
      const inputValue = e.detail.value;
         // 更新 recognizedText 数据
    this.setData({
      note: inputValue
      });
    },

  // 处理输入变化的函数
  onInputChange: function (event) {
    // 获取输入框中的内容
    const inputValue = event.detail.value;
    
    // 更新 recognizedText 数据
    this.setData({
      recognizedText: inputValue
    });
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
        audioSrc: res.tempFilePath  // 设置录音路径
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
        duration: 600000,  // 设置录音最大时长，单位毫秒
        sampleRate: 16000,  // 设置采样率
        numberOfChannels: 1,  // 设置录音的声道数
        encodeBitRate: 48000,  // 设置编码码率
        format: 'aac',  // 设置录音文件格式
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
      this.setData({
        duration: 0,  // 重置时长
      });
      clearInterval(this.timer);  // 清除定时器
    },
    // 上传录音文件到后台
    uploadRecording(filePath) {
    request("/upload",{
        "filePath": filePath,
        "name": 'file',  // 这个参数是后台接收文件时的字段名
        "method":"POST",
        "formData": {
          "user": 'example',  // 你可以根据需要传递其他参数
          "duration": this.data.duration,
        },
      }).then((data) => {
        console.log('上传成功', data);
        data = JSON.parse(data);
        this.setData({
          successFileName: data.fileName,
          parentPath: data.parentPath,
        })
      }).catch((err) => {
         console.error('上传失败', err);
          wx.showToast({
            title: '上传失败，请重试',
            icon: 'none',
          });
      })
      // wx.uploadFile({
      //   url: 'https://hdsw.top:8443/syx-service/upload',  // 替换成你的后台上传接口
      //   filePath: filePath,
      //   name: 'file',  // 这个参数是后台接收文件时的字段名
      //   formData: {
      //     user: 'example',  // 你可以根据需要传递其他参数
      //     duration: this.data.duration,
      //   },
      //   success: (res) => {
      //     const data = res.data;
      //     console.log('上传成功', data);
      //   // 判断是否为字符串
      //     var data2= {}
      //     try {
      //             // 尝试将字符串解析为 JSON
      //           data2 = JSON.parse(data);
      //         } catch (error) {
      //             console.error("Invalid JSON string:", error);
      //             return null;
      //         }
         
   
      //     this.setData({
      //       successFileName: data2.fileName,
      //       parentPath: data2.parentPath,
      //     })
     
      //     // 根据需要处理服务器返回的结果
      //   },
      //   fail:(err)=> {
      //     console.error('上传失败', err);
      //     wx.showToast({
      //       title: '上传失败，请重试',
      //       icon: 'none',
      //     });
      //   }
      // });
    },
  // 点击图片时调用
  previewImage: function () {
    wx.previewImage({
      current: this.data.imageSrc, // 当前显示图片的http链接
      urls: [this.data.imageSrc]    // 需要预览的图片http链接列表
    });
  },
  // 选择图片
  async chooseImage() {
    wx.chooseImage({
      count: 1,
      success: (res) => {
        const imagePath = res.tempFilePaths[0];
        this.setData({ imageSrc: imagePath });

        wx.getFileSystemManager().readFile({
          filePath: imagePath,
          encoding: 'base64',
          success: (res) => {
            try {
             request("/orc/task", {
                "method":"POST",
                "data":{
                  "image": res.data,
                }
              }).then((response) => {
                const text = response.words_result.map(item => item.words).join('\n');
                this.setData({ recognizedText: text });
                console.info(text)
              }).catch((error) => {
                this.setData({ imageSrc: "" });
                wx.showToast({ title: '文字识别失败', icon: 'none' });
              });
            }catch (error){
              this.setData({ imageSrc: "" });
              wx.showToast({ title: '文字识别失败', icon: 'none' });
            }
          }
        });
      }
    });
  },
  createTask(){
    console.info("开始创建任务时的",this.data)
    console.info("successFileName", this.data.successFileName, "parentPath", this.data.parentPath)
    speech.createTask(this.data.successFileName, this.data.parentPath).then((data) => {
      const { task_id } = data;
      this.startTaskPolling(task_id);  // 开始定时查询任务状态
    }).catch((err) => {
      wx.setStorageSync('result', '创建任务失败');
    });
  },
  // 通过 setInterval 来定时查询任务状态
  startTaskPolling(taskId) {
    const intervalId = setInterval(() => {
      speech.queryTaskStatus(taskId).then((taskInfo) => {
        console.info(taskInfo)
        const { task_status, task_result } = taskInfo;
        if (task_status === 'Success') {
          // 任务成功，回显识别内容
          this.setData({ result: task_result.result[0] });
          clearInterval(intervalId); // 结束定时查询
        } else if (task_status === 'Failure') {
          // 任务失败，回显错误信息
          this.setData({ result: "语音识别失败!" });
          clearInterval(intervalId); // 结束定时查询
        }
        // 其他状态继续查询
      }).catch((err) => {
        clearInterval(intervalId); // 结束定时查询
        wx.setStorageSync('result', '查询失败');
      });
    }, 2000); // 每秒查询一次
  },

 arrayBufferToString(arr){
    if(typeof arr === 'string') {
        return arr;
    }
    var dataview=new DataView(arr.data);
    var ints=new Uint8Array(arr.data.byteLength);
    for(var i=0;i<ints.length;i++){
      ints[i]=dataview.getUint8(i);
    }
    arr=ints;
    var str = '',
        _arr = arr;
    for(var i = 0; i < _arr.length; i++) {
        var one = _arr[i].toString(2),
            v = one.match(/^1+?(?=0)/);
        if(v && one.length == 8) {
            var bytesLength = v[0].length;
            var store = _arr[i].toString(2).slice(7 - bytesLength);
            for(var st = 1; st < bytesLength; st++) {
                store += _arr[st + i].toString(2).slice(2);
            }
            str += String.fromCharCode(parseInt(store, 2));
            i += bytesLength - 1;
        } else {
            str += String.fromCharCode(_arr[i]);
        }
    }
    return str;
},


// 将背诵的原文和 语音识别到文字进行结果校验
checkReciteByLLM(){
  const that = this;
  that.setData({llmRespText:''})
   // 调用封装后的 request，传递 onChunk 回调
   request('/check/task', {
    method: 'POST',
    enableChunked: true, // 启用流式传输
    onChunked: (chunk) => {
      debugger
      // 处理分块数据
      const data = that.arrayBufferToString(chunk);
      if (data.includes('[DONE]')) return;

      const jsonString = data.replace(/^data:\s*/, '');
      try {
        const jsonData = JSON.parse(jsonString);
        console.log(jsonData)
        if (jsonData.choices?.[0]?.delta?.content) {
          const newText = that.data.llmRespText + jsonData.choices[0].delta.content;
          that.setData({ llmRespText: newText });
        }
      } catch (e) {
        console.error('解析分块数据失败:', e);
      }
    },
    data: {
      sourceTxt: that.data.recognizedText,
      checkTxt: that.data.result,
    },
  })
  .then((finalResponse) => {
    // 最终响应处理（如完成后操作）
    console.log('最终响应:', finalResponse);
  })
  .catch((error) => {
    console.error('请求失败:', error);
  });


  // var requestTask = wx.request({
  //   url: 'https://hdsw.top:8443/syx-service/check/task', // 替换为实际的流式接口
  //   method: 'POST',
  //   header: {
  //     'Content-Type': 'application/json',
  //   },
  //   data: {
  //         "sourceTxt":that.data.recognizedText,
  //         "checkTxt": that.data.result
  //       },
  //   enableChunked: true, // 启用流式数据输出
  //   success:(res) => {
    
  //   },
  //   fail:(err) => {
  //     console.error('请求失败:', err);
  //   },
  // });

  // const listener = function (res) {
  //    var data = that.arrayBufferToString(res)
  //    if (data.indexOf("[DONE]") > -1 ) {
  //      return
  //    }
  //    // 去掉前缀 'data: '
  //   let jsonString = data.replace(/^data:\s*/, '');

  //   // 解析为 JSON 数据
  //   let jsonData = JSON.parse(jsonString);
  //   console.info(jsonData)
  //   if (jsonData.choices[0].delta.content) {
  //       var newText = that.data.llmRespText + jsonData.choices[0].delta.content
  //       that.setData({llmRespText:newText})
  //   }
  //   }

  // requestTask.onChunkReceived(listener)
},




});
