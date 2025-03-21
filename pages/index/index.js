Page({
  data: {
    // 快捷入口按钮数据
    taskButtons: [
      {
        type: 'recite',
        text: '背诵',
        icon: '/icons/recite.svg',
        color: 'blue'
      },
      {
        type: 'dictation',
        text: '默写',
        icon: '/icons/dictation.svg',
        color: 'orange'
      },
      {
        type: 'read',
        text: '朗读',
        icon: '/icons/read.svg',
        color: 'green'
      },
      {
        type: 'voiceover',
        text: '配音',
        icon: '/icons/voiceover.svg',
        color: 'purple'
      },
      {
        type: 'essay',
        text: '作文修改',
        icon: '/icons/essay.svg',
        color: 'red'
      }
    ],
    
    // 模拟已完成任务数据
    completedTasks: [
      {
        id: 1,
        type: 'recite',
        typeIcon: '/icons/recite.svg',
        title: '《静夜思》背诵',
        time: '今天 14:30',
        points: 20,
        badge: '/icons/badge1.png'
      },
      {
        id: 5,
        type: 'recite',
        typeIcon: '/icons/recite.svg',
        title: '《静夜思》背诵',
        time: '今天 14:30',
        points: 20,
        badge: '/icons/badge1.png'
      },
      {
        id: 4,
        type: 'recite',
        typeIcon: '/icons/recite.svg',
        title: '《静夜思》背诵',
        time: '今天 14:30',
        points: 20,
        badge: '/icons/badge1.png'
      },
      {
        id: 2,
        type: 'essay',
        typeIcon: '/icons/essay.svg',
        title: '作文：我的梦想',
        time: '今天 15:00',
        points: 30,
        badge: '/icons/badge2.png'
      }
    ],

  },

  // 跳转任务执行页
  navigateToTask(e) {
    const type = e.currentTarget.dataset.type;
    console.log(type)
    wx.navigateTo({
      url: `/pages/task/${type}/${type}`
    });
  },

  // 查看任务详情
  showTaskDetail(e) {
    const taskId = e.currentTarget.dataset.taskId;
    wx.navigateTo({
      url: `/pages/task/detail/index?id=${taskId}`
    });
  },

  // 按钮样式绑定
  taskBtnStyle(color) {
    return `task-btn-${color}`;
  },

  // 任务卡片背景色绑定
  taskCardStyle(type) {
    const colorMap = {
      recite: 'blue',
      dictation: 'orange',
      read: 'green',
      voiceover: 'purple',
      essay: 'red'
    };
    return `task-card-${colorMap[type]}`;
  }
});