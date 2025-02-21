const app = getApp();
const ocr = require('../../utils/ocr.js');
const speech = require('../../utils/speech.js');
Page({
  data: {
    imageSrc: '',
    // 识别到的文字
    recognizedText: '',
    recitationInProgress: false,
    feedbackText: '',
    audioSrc:'',
    successFileName: '16k-48000.m4a',
    parentPath: '20250219',
    result: '',
    markdownText:''
  },
  onLoad() {
    // 示例 Markdown 文本
    const markdown = `# 标题\n**加粗文本**\n- 列表项1\n- 列表项2`;

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
        success: (res) => {
          const data = res.data;
          console.log('上传成功', data);
        // 判断是否为字符串
          try {
                  // 尝试将字符串解析为 JSON
                 var data2 = JSON.parse(data);
              } catch (error) {
                  console.error("Invalid JSON string:", error);
                  return null;
              }
         
   
          this.setData({
            successFileName: data2.fileName,
            parentPath: data2.parentPath,
          })
     
          // 根据需要处理服务器返回的结果
        },
        fail:(err)=> {
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
    }, 1000); // 每秒查询一次
  },
  // 发送请求并处理流式数据
  requestStreamData () {
    const that = this;

    var requestTask = wx.request({
      url: 'https://qianfan.baidubce.com/v2/chat/completions', // 替换为实际的流式接口
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer bce-v3/ALTAK-wiRMPfWdccC0WqpRvN4Hb/1675b38943c09c9f0e2cc729eef70ac206163d96;ZjkyZmQ2YmQxZTQ3NDcyNjk0ZTg1ZjYyYjlkZjNjODB8AAAAABMCAADB6CWu7dnKmTKVyAhO3pF130p3PwbRgb9Z92r1+qucRP4TGXn4xm/Tz2ntqJtdIE3nNobQBmuPto9BO5cUMStYajJQiZiul0cFOysxxAYrZtpdrPYbLanKXjRlUgAq/kK9NBlhS1rDyC6JuX6OLgHNbnf3zx3WKIYcbsgYzlDcGZFcpuXp2ZQPSuDbELLa1tWgfSRm131f/+IM2yF2vGlB78/pxxo45SesNXUC5owWb0CxY/suwPRve3re4uhoCtjSighsLqJAOsQUcXrCYOewowS2bb3boD8OiyTpmnlGvbl5V9HO7ons+N5RqxnFK5gcEjqmkon6I8NjnFvhO+3YUAKPWtpOA8uGdwXbjXJ5An+zcRYJ48OUnvmOF6HduT7j3oA1QT0osTny0MkfgOGzkSOEC1FT1oI+kTQE3AKTwijjSXiuk8bOHO4nHROXDfk='
      },
      data: {"stream":true,"prompt":"请作为一名丈夫撰写一段话用来鼓励怀孕的妻子，妻子有痔疮、手脚肿胀及夜间睡眠不好，要求真情实感，富有高情商，使用口语化的方式进行表达。","messages":[{"role":"user","content":"请作为一名丈夫撰写一段话用来鼓励怀孕的妻子，妻子有痔疮、手脚肿胀及夜间睡眠不好，要求真情实感，富有高情商，使用口语化的方式进行表达。"},{"role":"assistant","content":"\n\n媳妇儿，看你挺着大肚子还要和痔疮较劲，手脚肿得像小馒头似的，夜里翻来覆去睡不踏实，我这心里揪得生疼。但每次瞧你摸着肚子跟咱家小祖宗说悄悄话那劲儿，我就觉得我媳妇儿真是女超人——明明自己难受得要命，却把咱家小宝贝护得暖暖和和的。这段日子你受的罪，我都拿小本本记着呢，等崽子出来了让他天天给你捶腿揉肩！现在起我就当你24小时专属服务员，泡脚水温度我试，半夜腿抽筋我揉，想吃酸的辣的我立马变戏法儿。再咬牙熬过这阵子，咱们三口子就能在太阳底下撒欢儿啦，到时候我左手牵大宝贝右手牵小宝贝，把现在欠你的好觉都补回来！（轻轻摸肚子）崽啊，看看你妈多能耐，长大可得学着点疼人！"},{"role":"user","content":"请作为一名丈夫撰写一段话用来鼓励怀孕的妻子，妻子有痔疮、手脚肿胀及夜间睡眠不好，要求真情实感，富有高情商，使用口语化的方式进行表达。"},{"role":"assistant","content":"\n\n宝贝，看你最近挺着肚子坐也不是、躺也不舒服，痔疮疼得直皱眉，手脚肿得连拖鞋都穿不进去，半夜翻个身都要扶着腰喘口气，我心里跟拧了麻花似的。但你知道吗？你每次摸着肚子说\"宝宝今天踢得可欢了\"的时候，整个人都在发光，比咱们结婚那天的灯光还亮。\n\n这两天我偷偷查了，说把枕头垫在腰下面能好睡点，待会儿我给你搭个\"枕头城堡\"试试。洗脚水我已经兑得不烫不凉了，加了你喜欢的薰衣草泡泡，等会儿给你捏脚丫子时候可不许嫌我手糙啊！对了，昨天跟楼下阿姨学了个痔疮缓解的食疗方子，明天开始我给你当专属小厨神，保准比外卖强。\n\n媳妇儿啊，你肚子里装着咱家的小太阳，自己却忍着这么多难受，这份厉害劲儿我下辈子都学不会。等崽子出来了，我天天让他给你捶背，现在嘛...（轻轻摸肚子）我先替这小子给你当人肉靠垫，二十四小时待命那种！熬过这阵子，咱们带娃去海边，我背着你踩浪花，把现在欠你的舒坦日子都补上！"},{"role":"user","content":"请作为一名丈夫撰写一段话用来鼓励怀孕的妻子，妻子有痔疮、手脚肿胀及夜间睡眠不好，要求真情实感，富有高情商，使用口语化的方式进行表达。"}],"model":"deepseek-v3","temperature":0.8,"top_p":0.8,"penalty_score":1},
      enableChunked: true, // 启用流式数据输出
      success:(res) => {
         console.info(res)
      },
      fail:(err) => {
        console.error('请求失败:', err);
      },
    });

    const listener = function (res) {
       var data = that.arrayBufferToString(res)
       if (data.indexOf("[DONE]") > -1 ) {
         return
       }
      console.info(data)

      // console.info(data)
       // 去掉前缀 'data: '
      let jsonString = data.replace(/^data:\s*/, '');

      // 解析为 JSON 数据
      let jsonData = JSON.parse(jsonString);
      console.info(jsonData)
      if (jsonData.choices[0].delta.content) {
          var newText = that.data.markdownText + jsonData.choices[0].delta.content
          that.setData({markdownText:newText})
      }

     // console.info(jsonData['choices'][0]['delta']['content'])
      }

    requestTask.onChunkReceived(listener)
   // requestTask.offChunkReceived(listener) // 需传入与监听时同一个的函数对象
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




});
