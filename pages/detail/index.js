//获取应用实例
const app = getApp();
const util = require('../../utils/util.js');
const request = require('../../utils/request.js');
const loginUtil = require('../../utils/login.js');
Page({
  data: {
    comic: {},
    chapterList: [],
    loadingStatus: 0,
    historyNum: 0,
    canRead: false,
    nowTab: 0,
    liked: false,
    logined: false,
    menuRect: null,
    systemInfo: app.globalData.systemInfo,
    navHeight: 0,
    expand: false,
    title: '',
    blur: 0,
    reverseOrder: false
  },
  onLoad: function(option) {
    if (!option.comic) {
      return;
    }
    var self = this;
    var comic = JSON.parse(decodeURIComponent(option.comic));
    this.option = option;
    if (comic.status == 1) {
      comic.status = '完结';
    } else if (comic.status == 0) {
      comic.status = '连载中';
    }
    if (typeof comic.author == 'string') {
      comic.author = comic.author.split(',');
    }
    comic.area = '';
    comic.categorys = [];
    comic.publishTime = util.formatTime(comic.publish_time, 'yyyy/MM/dd');
    this.setData({
      comic: comic,
      canRead: app.canRead
    });
    this.getCategoryAndArea();
    this.getLiked();
    this.getChpater();
  },
  onShareAppMessage: function(res) {
    return {
      title: this.data.comic.title,
      path: '/pages/detail/index?comic=' + this.option.comic
    }
  },
  onShow() {
    var self = this;
    loginUtil.checkLogin().then(() => {
      self.setData({
        logined: true
      });
      if (!self.liked) {
        self.getLiked();
      }
    }).catch(() => {
      self.setData({
        logined: false
      });
    });
    app.getDeviceInfo((deviceInfo)=>{
        this.setData({
          navHeight: deviceInfo.navHeight,
          menuRect: deviceInfo.menuRect
        });
    });
    //获取章节观看记录
    wx.getStorage({
      key: 'comic_history',
      success: function(res) {
        var list = res.data;
        for (var i = 0; i < list.length; i++) {
          var obj = list[i];
          //已经有记录了则将该记录移除
          if (obj.comic && obj.comic.comicid == self.data.comic.comicid) {
            self.setData({
              historyNum: obj.chapter.c_order
            });
          }
        }
      }
    })
  },
  onPullDownRefresh() {
    wx.showLoading({
      title: '刷新中',
    });
    this.getCategoryAndArea();
    this.getLiked();
    this.getChpater();
  },
  //滚动事件
  onScroll(e) {
    if (!this.scrollTimer) {
      this.scrollTimer = setTimeout(() => {
        this.scrollCompute(e);
        this.scrollTimer = null;
      }, 50);
    }
  },
  scrollCompute(e) {
    var scrollTop = e.detail.scrollTop;
    var topHeight = this.data.systemInfo.screenWidth / 750 * 400;
    if (scrollTop > topHeight) {
      this.setData({
        title: this.data.comic.title
      });
    } else {
      this.setData({
        title: ''
      });
    }
    var blur = scrollTop / topHeight * 8;
    blur = blur > 8 ? 8 : blur;
    this.setData({
      blur: blur
    });
  },
  //分享
  share() {

  },
  //继续阅读
  continueRead() {
    if (this.data.historyNum < 1) {
      this.gotoFirst();
      return;
    }
    var obj = {}
    obj.chapterList = this.data.chapterList.concat([]).sort((arg1, arg2) => {
      return arg1.c_order - arg2.c_order;
    });
    obj.startChapterOrder = this.data.historyNum;
    obj.comic = this.data.comic;
    wx.setStorageSync('chapterList', obj);
    wx.navigateTo({
      url: '/pages/picture/index'
    });
  },
  gotoPicture(e) {
    var order = e.currentTarget.dataset.order;
    this.gotoPictureByOrder(order);
  },
  //阅读第一话
  gotoFirst() {
    if (this.data.chapterList.length) {
      this.gotoPictureByOrder(1);
    }
  },
  //阅读最后一话
  gotoLast() {
    if (this.data.chapterList.length) {
      this.gotoPictureByOrder(this.data.chapterList.length);
    }
  },
  gotoPictureByOrder(order) {
    var self = this;
    var obj = {};
    obj.chapterList = this.data.chapterList.concat([]).sort((arg1, arg2) => {
      return arg1.c_order - arg2.c_order;
    });
    obj.startChapterOrder = order;
    obj.comic = this.data.comic;
    wx.setStorageSync('chapterList', obj);
    wx.getStorage({
      key: 'comic_history',
      complete: function(res) {
        var list = res.data || [];
        list = list.splice(-100);
        for (var i = 0; i < list.length; i++) {
          var obj = list[i];
          //已经有记录了则将该记录移除
          if (obj.comic.comicid == self.data.comic.comicid) {
            list.splice(i, 1);
            break;
          }
        }
        //添加新纪录
        list.unshift({
          comic: self.data.comic,
          chapter: self.findChpaterByOrder(order)
        });
        wx.setStorage({
          key: 'comic_history',
          data: list
        });
        if (app.historyPage) {
          app.historyPage.setData({
            comicHistory: list
          });
        }
      },
    });
    wx.navigateTo({
      url: '/pages/picture/index'
    });
  },
  //根据顺序返回章节
  findChpaterByOrder(order) {
    var chpater = null;
    for (var i = 0; i < this.data.chapterList.length; i++) {
      if (this.data.chapterList[i].c_order == order) {
        return this.data.chapterList[i];
      }
    }
  },
  //改变章节顺序
  changeOrder() {
    this.setData({
      reverseOrder: !this.data.reverseOrder,
      chapterList: this.data.chapterList.concat([]).reverse()
    });
  },
  toggleTab(e) {
    this.setData({
      nowTab: e.currentTarget.dataset.tab
    })
  },
  //展开或收起内容
  toggleExpand() {
    this.setData({
      expand: !this.data.expand
    });
  },
  getCategoryAndArea() {
    var self = this;
    request({
      url: '/comic/category_area/' + this.data.comic.comicid,
      success(res) {
        if (res.statusCode == 200) {
          self.setData({
            'comic.area': res.data.area,
            'comic.categorys': res.data.categorys
          })
        }
      }
    })
  },
  getChpater() {
    var self = this;
    request({
      url: '/chapter/' + this.data.comic.comicid,
      success(res) {
        wx.stopPullDownRefresh();
        wx.hideLoading();
        if (res.statusCode == 200) {
          self.setData({
            chapterList: res.data.sort((arg1, arg2) => {
              return arg1.c_order - arg2.c_order;
            }),
            loadingStatus: 1
          })
        } else {
          self.setData({
            loadingStatus: -1
          })
        }
      }
    })
  },
  //是否被收藏
  getLiked() {
    var self = this;
    request({
      url: '/like/get?id=' + this.data.comic.id,
      success(res) {
        self.setData({
          liked: res.data.result && res.data.result.length || false
        });
      }
    })
  },
  //添加到收藏
  like() {
    var self = this;
    if (this.changeLike) {
      return;
    }
    this.changeLike = true;
    wx.showLoading({
      title: '收藏中',
    })
    request({
      url: '/like/add',
      method: 'post',
      data: {
        id: this.data.comic.id
      },
      success(res) {
        self.changeLike = false;
        if (res.data.status == 1) {
          wx.showToast({
            title: '收藏成功'
          });
          self.setData({
            liked: true
          });
          wx.setStorageSync('likeChange', true);
        } else if (res.data.status == 403) {
          wx.showToast({
            title: '请先登录'
          });
          self.setData({
            logined: false
          });
        } else {
          wx.showToast({
            title: '添加失败，服务器错误'
          });
        }
      },
      complete() {
        wx.hideLoading();
      }
    })
  },
  //取消收藏
  unLike() {
    var self = this;
    if (this.changeLike) {
      return;
    }
    this.changeLike = true;
    wx.showLoading({
      title: '取消收藏中',
    })
    request({
      url: '/like/del',
      method: 'post',
      data: {
        id: this.data.comic.id
      },
      success(res) {
        self.changeLike = false;
        if (res.data.status == 1) {
          wx.showToast({
            title: '取消收藏成功'
          });
          self.setData({
            liked: false
          });
          wx.setStorageSync('likeChange', true);
        } else if (res.data.status == 403) {
          wx.showToast({
            title: '请先登录'
          });
          self.setData({
            logined: false
          });
        } else {
          wx.showToast({
            title: '添加失败，服务器错误'
          });
        }
      },
      complete() {
        wx.hideLoading();
      }
    })
  },
  getUserInfo: function(e) {
    console.log(e)
    app.globalData.userInfo = e.detail.userInfo;
    wx.setStorageSync('userInfo', e.detail.userInfo);
    this.setData({
      userInfo: e.detail.userInfo
    });
    wx.showLoading({
      title: '登录中',
    });
    loginUtil.login().then(() => {
      wx.hideLoading();
      this.setData({
        logined: true
      })
    }).catch(() => {
      wx.hideLoading();
      wx.showToast({
        title: '登录失败',
        icon: 'none'
      });
    });
  },
})