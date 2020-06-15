//index.js
//获取应用实例
const app = getApp()
const util = require('../../utils/util.js');
const request = require('../../utils/request.js');
Page({
  data: {
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    categoryList: [], //分类列表
    nowAid: 0, //当前地区ID
    nowCid: 0, //当前分类ID
    pageSize: 3 * 3 * 5, //一页的数量
    toCategory: 'category_0', //分类列表滚动到指定位置
    showCategoryDialog: false, //选择分类弹框
    currentBannerIndex: 0, //当前轮播图索引号
    swiperDataMap: [], //所有漫画列表
    aidSelectMap: [], //存储地区选择
    aidMap: [], //存储所有地区
    scrollTop: [], //列表对应的滚动距离
    viewSize: 40, //scroll-view中最多同时存在40页
    animationDuration: 300,
    stopSwiper: false,
    systemInfo: app.globalData.systemInfo,
    menuRect: null,
    navHeight: 0,
    bgImage: '',
    showScrollBtn: false,
    scrollAnimation: false,
    ifScrollToTop: false,
    stopRefresh: false,
    pageArr: [],
    wrapHeight: 0
  },
  onLoad: function(option) {
    this.itemHeight = 205 * app.globalData.systemInfo.screenWidth / 375;
    this.windowHeight = app.globalData.systemInfo.windowHeight;
    this.loading = {};
    this.getCategory();
    this.getArea();
    this.setData({
      wrapHeight: this.itemHeight * (this.data.pageSize / 3)
    });
    var tmp = [];
    for(var i=1; i<=500; i++) {
      tmp.push(i);
    }
    this.setData({
      pageArr: tmp
    });
    if (option.cid) {
      wx.setStorageSync('nowCid', option.cid);
    }
    if (option.aid) {
      wx.setStorageSync('nowAid', option.aid);
    } else {
      wx.removeStorageSync('nowAid');
    }
  },
  onShareAppMessage: function(res) {
    return {
      title: '漫画分类',
      path: '/pages/subject/index?aid=' + this.data.nowAid + '&cid=' + this.data.nowCid
    }
  },
  onShow() {
    var cid = wx.getStorageSync('nowCid');
    var aid = wx.getStorageSync('nowAid');
    this.stopRequestTask();
    //地区更改
    if (!isNaN(parseInt(aid)) && this.data.nowAid != aid) {
      this.setData({
        [`aidSelectMap[${cid}]`]: aid
      });
    }
    //分类更改
    if (!isNaN(parseInt(cid)) && this.data.nowCid != cid) {
      this.historyCid = cid;
      if (this.data.categoryList.length) {
        this.renderSwiper(cid);
      }
      //地区更改需要刷新列表
    } else if (!isNaN(parseInt(aid)) && this.data.nowAid != aid) {
      this.setData({
        nowAid: aid
      });
      if (this.data.categoryList.length) {
        this.refreshCategory();
      }
    }
    app.getDeviceInfo((deviceInfo)=>{
        this.setData({
            navHeight: deviceInfo.navHeight,
            menuRect: deviceInfo.menuRect
        });
    });
  },
  //顶部下拉刷新
  onRefresh() {
    if(this.refreshing) {
      return;
    }
    this.refreshing = true;
    this.stopRequestTask();
    if (this.data.categoryList.length) {
      this.refreshCategory();
    } else {
      this.getCategory();
    }
  },
  //滚动事件
  onScroll(e) {
    // //避免频繁计算
    // var time = 50;
    // //低端安卓机性能不太好
    // if (this.data.systemInfo.platform == 'android') {
    //   time = 100;
    // }
    // if (!this.scrollTimer) {
    //   this.scrollTimer = setTimeout(() => {
    //     this.scrollCompute(e);
    //     this.scrollTimer = null;
    //   }, time);
    // }
    this.scrollCompute(e);
  },
  scrollCompute(e) {
    var self = this;
    var scrollTop = e.detail.scrollTop;
    var cid = e.currentTarget.dataset.cid;
    _getItemHeight().then((itemHeight) => {
      var pageHeight = (this.data.pageSize / 3) * itemHeight;
      var nowPage = Math.ceil(scrollTop / pageHeight);
      if(this.data.swiperDataMap[this.data.nowAid].nowPage != nowPage) {
        this.setData({
          [`swiperDataMap[${this.data.nowCid}].nowPage`]: nowPage
        });
      }
    });
    //获取item的高度
    function _getItemHeight() {
      if(self.hasGetItemHeight) {
        return Promise.resolve(self.itemHeight);
      }
      return new Promise((resolve)=>{
        var query = wx.createSelectorQuery()
        query.select('.category_item').boundingClientRect()
        query.exec(function(rect) {
          if (rect && rect[0]) {
            self.itemHeight = rect[0].height;
            if(!self.data.wrapHeight) {
              self.setData({
                wrapHeight: self.itemHeight * (self.data.pageSize / 3)
              });
              self.hasGetItemHeight = true;
            }
          }
          resolve(self.itemHeight);
        });
      });
    }
  },
  //加载更多
  onLoadMore(e) {
    var cid = e.currentTarget.dataset.cid;
    if (!this.refreshing) {
      this.loadNext(cid);
    }
  },
  //渲染swiper-item，每次只渲染三个
  renderSwiper(cid) {
    var scrollTop = [];
    if(this.loading[this.data.nowCid]) {
      return;
    }
    if (!this.data.swiperDataMap[cid] || this.data.swiperDataMap[cid].total < 0) {
      if(!this.data.swiperDataMap[cid]) {
        var obj = {
          scrollTop: 0,
          total: -1,
          list: [],
          lastPage: 0,
          sort: 'read_count',
          status: '',
          totalPage: -1,
          nowPage: 1
        }
        this.setData({
          [`swiperDataMap[${cid}]`]: obj
        })
      }
      this.loadNext(cid);
    }
    scrollTop[cid] = this.data.swiperDataMap[cid].scrollTop || 0;
    this.setData({
      nowAid: this.data.aidSelectMap[cid] || 0,
      nowCid: cid,
      scrollTop: scrollTop,
      showCategoryDialog: false,
    });
    this.scrollToCategory(this.data.nowCid);
    wx.setStorageSync('nowCid', this.data.nowCid);
    wx.setStorageSync('nowAid', this.data.nowAid);
  },
  //跳转到搜索页
  gotoSearch(e) {
    wx.navigateTo({
      url: '/pages/search/index'
    });
  },
  //跳转到动漫详情页
  gotoDetail(e) {
    var comic = e.currentTarget.dataset.comic;
    wx.navigateTo({
      url: '/pages/detail/index?comic=' + encodeURIComponent(JSON.stringify(comic))
    });
  },
  //显隐分类弹出框
  gotoSubjectSelect(e) {
    this.data.areaList.length && wx.setStorageSync('areaList', this.data.areaList);
    wx.setStorageSync('categoryList', this.data.categoryList);
    wx.navigateTo({
      url: '/pages/subject_select/index',
    });
  },
  selectCategory(e) {
    var cid = e.currentTarget.dataset.category.cid;
    if(this.data.nowCid != cid) {
      this.renderSwiper(cid);
    }
  },
  selectSort(e) {
    var status = e.currentTarget.dataset.status;
    var sort = e.currentTarget.dataset.sort;
    var cid = e.currentTarget.dataset.cid;
    var swiperData = this.data.swiperDataMap[cid];
    this.stopRequestTask();
    if (status) {
      if (status != swiperData.status) {
        this.setData({
          [`swiperDataMap[${cid}].sort`]: 'update_time',
          [`swiperDataMap[${cid}].status`]: status,
        });
        this.refreshCategory();
      }
    } else if (swiperData.sort != sort || swiperData.status == 1) {
      this.setData({
        [`swiperDataMap[${cid}].sort`]: sort,
        [`swiperDataMap[${cid}].status`]: ''
      });
      this.refreshCategory();
    }
  },
  //导航栏菜单滚动到指定item
  scrollToCategory(cid) {
    //目录滚动到当前按钮的前两个按钮的位置
    for (var i = 0; i < this.data.categoryList.length; i++) {
      var item = this.data.categoryList[i];
      if (item.cid == cid) {
        var index = i - 2 > 0 ? i - 2 : 0;
        this.setData({
          toCategory: 'category_' + this.data.categoryList[index].cid
        });
        break;
      }
    }
  },
  //滚动到顶部
  scrollToTop() {
    this.setData({
      ifScrollToTop: true,
      [`swiperDataMap[${this.data.nowCid}].nowPage`]: 1
    });
  },
  //刷新分类列表
  refreshCategory() {
    var swiperData = this.data.swiperDataMap[this.data.nowCid];
    var obj = {
      scrollTop: 0,
      total: -1,
      totalPage: -1,
      nowPage: 1,
      list: [],
      sort: swiperData.sort,
      status: swiperData.status,
      lastPage: 0
    };
    this.stopRequestTask();
    this.setData({
      [`swiperDataMap[${this.data.nowCid}]`]: obj
    });
    this.renderSwiper(this.data.nowCid);
  },
  //底部加载
  loadNext(cid) {
    var swiperData = this.data.swiperDataMap[cid];
    var self = this;
    if(!swiperData || swiperData.totalPage > -1 && swiperData.lastPage >= swiperData.totalPage) { //最后一页了
      return;
    }
    return this.getComicListByCategory(cid).then((data) => {
      swiperData.list.push(data.list);
      //第一次加载或者刷新
      if (swiperData.total <= 0) {
        swiperData.total = data.size;
        //总页数
        var totalPage = Math.ceil(swiperData.total / this.data.pageSize);
        this.setData({
          [`swiperDataMap[${cid}].totalPage`]: totalPage
        });
      }
      this.setData({
        [`swiperDataMap[${cid}].list`]: swiperData.list.concat([]),
        [`swiperDataMap[${cid}].lastPage`]: swiperData.lastPage + 1,
      });
      //模糊背景
      if (!this.data.bgImage && data.list[0] && data.list[0][0]) {
        this.setData({
          bgImage: data.list[0][0].cover_url
        });
      }
      self.loading[cid] = false;
    }).catch(()=>{});
  },
  //停止正在加载的请求
  stopRequestTask() {
    if(this.loading[this.data.nowCid]) {
      this.loading[this.data.nowCid] = false;
      this.requestTask && this.requestTask.abort();
    }
  },
  //获取所有分类
  getCategory() {
    var self = this;
    wx.showLoading({
      title: '加载中',
      mask: true
    });
    request({
      url: '/category',
      success(res) {
        if (res.statusCode == 200 && res.data && res.data.length) {
          var cids = [];
          var nowCid = self.historyCid || res.data[0].cid;
          var current = 0;
          self.setData({
            categoryList: res.data
          });
          for (var i = 0; i < self.data.categoryList.length; i++) {
            if (self.data.categoryList[i].cid == nowCid) {
              current = i;
              break;
            }
          }
          self.renderSwiper(nowCid);
        }
      },
      fail(err) {
        console.log(err);
        wx.hideLoading();
        self.stopRefreshing();
      }
    });
  },
  //获取地区列表
  getArea() {
    var self = this;
    request({
      url: '/area',
      success(res) {
        if (res.statusCode == 200 && res.data && res.data.length) {
          var map = {};
          res.data.map((item) => {
            map[item.aid] = item.name;
          });
          map[0] = '全部地区';
          self.setData({
            aidMap: map,
            areaList: res.data
          })
          wx.setStorageSync('areaList', res.data);
        }
      }
    });
  },
  //加载漫画列表
  getComicListByCategory(cid) {
    var self = this;
    var swiperData = self.data.swiperDataMap[cid];
    if(this.loading[cid]) {
      return Promise.reject();
    }
    this.loading[cid] = true;
    return new Promise((resolve, reject) => {
      var data = {
        cid: cid,
        page: swiperData.lastPage + 1,
        pageSize: self.data.pageSize,
        sort: swiperData.sort,
        aid: self.data.aidSelectMap[cid] || 0
      }
      if (swiperData.status) {
        data.status = swiperData.status;
      }
      self.requestTask = request({
        url: '/comic',
        data: data,
        success(res) {
          wx.stopPullDownRefresh();
          wx.hideLoading();
          self.stopRefreshing();
          res.data.list.map((item) => {
            item.lastupdatetime = util.formatTime(item.update_time, 'yyyy/MM/dd').slice(2);
          });
          self.requestTask = null;
          resolve(res.data);
        },
        fail(err) {
          console.log(err);
          wx.hideLoading();
          self.stopRefreshing();
          self.loading[cid] = false;
          self.requestTask = null;
          reject(err);
        }
      });
    })
  },
  stopRefreshing() {
    if (this.refreshing) {
      this.setData({
        stopRefresh: true
      });
      this.refreshing = false;
    }
  }
})