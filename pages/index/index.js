//index.js
//获取应用实例
const app = getApp()
const util = require('../../utils/util.js');
const host = require('../../config/index.js').httpHost;
Page({
    data: {
        userInfo: {},
        hasUserInfo: false,
        canIUse: wx.canIUse('button.open-type.getUserInfo'),
        categoryList: [], //分类列表
        recommend: [], //推荐列表
        nowCid: 0, //当前分类ID
        nowCidIndex: 0, //当前滑块的索引
        pageSize: 3 * 3 * 3, //一页的数量
        toCategory: 'category_0', //分类列表滚动到指定位置
        showCategoryDialog: false, //选择分类弹框
        currentBannerIndex: 0, //当前轮播图索引号
        banner: [], //轮播图
        swiperDataMap: [], //所有漫画列表
        renderCids: [], //当前可渲染的列表对应的分类ID
        scrollTop: [], //列表对应的滚动距离
        viewSize: 40, //scroll-view中最多同时存在40页
        overlappingPage: 5, //前后视图交叉的页数
        animationDuration: 300
    },
    onLoad: function() {
        wx.hideTabBar();
        this.itemHeight = 180 * app.globalData.systemInfo.screenWidth / 375;
        this.windowHeight = app.globalData.systemInfo.windowHeight;
        this.loading = {};
        this.getCategory();
        this.getRecommend();
        this.getSwitch();
    },
    //顶部下拉刷新
    onPullDownRefresh() {
        this.getSwitch();
        if (this.data.nowCid) {
            this.refreshCategory();
        } else {
            this.getCategory();
            this.getRecommend();
        }
    },
    //滚动事件
    onScroll(e) {
        var cid = e.currentTarget.dataset.cid;
        var swiperData = this.data.swiperDataMap[cid];
        swiperData.scrollTop = e.detail.scrollTop;
        if (!cid || this.viewRending) {
            return;
        }
        //切换到下一个视图
        if (e.detail.scrollHeight + 3 * this.itemHeight >= this.data.pageSize / 3 * (this.data.viewSize + this.data.overlappingPage) * this.itemHeight && e.detail.scrollHeight - e.detail.scrollTop <= this.windowHeight + 50 && swiperData.nowView < swiperData.viewArr.length - 1) {
            this.viewRending = true;
            this.setData({
                [`swiperDataMap[${cid}].nowView`]: swiperData.nowView + 1
            }, () => {
                this.setData({
                    [`scrollTop[${cid}]`]: this.data.overlappingPage * this.itemHeight * (this.data.pageSize / 3) - this.windowHeight
                }, () => {
                    setTimeout(() => {
                        this.viewRending = false;
                    }, 1000);
                });
            });
        //切换到上一个视图
        } else if (e.detail.scrollTop < 3 * this.itemHeight && swiperData.nowView > 0) {
            this.viewRending = true;
            this.setData({
                [`swiperDataMap[${cid}].nowView`]: swiperData.nowView - 1
            }, () => {
                this.setData({
                    [`scrollTop[${cid}]`]: this.itemHeight * (this.data.pageSize / 3) * this.data.viewSize + 3 * this.itemHeight
                }, () => {
                    setTimeout(() => {
                        this.viewRending = false;
                    }, 1000);
                });
            });
        }
    },
    //加载更多
    onLoadMore(e) {
        var cid = e.currentTarget.dataset.cid;
        if ((this.data.swiperDataMap[cid].nowView + 1) * this.data.viewSize + this.data.overlappingPage + 1 >= this.data.swiperDataMap[cid].renderData.length) {
            this.loadNext(cid);
        }
    },
    //左右滑动切换完成事件
    animationFinish(e) {
        var current = e.detail.current;
        this.renderSwiper(current);
        this.setData({
            animationDuration: 300
        });
    },
    swiperChange(e) {
        this.setData({
            animationDuration: 100
        });
    },
    //渲染swiper-item，每次只渲染三个
    renderSwiper(current) {
        var categoryList = this.data.categoryList;
        var map = [];
        var scrollTop = [];
        if (current == 0) {
            map.push(0);
            current + 1 < categoryList.length && map.push(current + 1);
            current + 2 < categoryList.length && map.push(current + 2);
        } else if (current == categoryList.length - 1) {
            current - 1 > -1 && map.push(current - 1);
            current - 2 > -1 && map.push(current - 2);
            map.push(current);
        } else {
            current - 1 > -1 && map.push(current - 1);
            map.push(current);
            current + 1 < categoryList.length && map.push(current + 1);
        }
        map = map.map((item) => {
            return categoryList[item].cid;
        });
        map.map((item) => {
            if (!this.data.swiperDataMap[item]) {
                this.loadNext(item);
            }
        });
        map.map((item) => {
            scrollTop[item] = this.data.swiperDataMap[item].scrollTop || 0;
        });
        this.setData({
            nowCid: categoryList[current].cid,
            renderCids: map,
            scrollTop: scrollTop
        });
        this.scrollToCategory(this.data.nowCid);
    },
    //跳到搜索页
    gotoSearch() {
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
    //轮播图切换事件
    bannerChang(e) {
        this.setData({
            currentBannerIndex: e.detail.current
        })
    },
    //获取所有分类
    getCategory() {
        var self = this;
        wx.request({
            url: host + '/category',
            success(res) {
                if (res.statusCode == 200 && res.data && res.data.length) {
                    var cids = [];
                    for (var i = 0; i < 3 && i < res.data.length; i++) {
                        cids.push(res.data[i].cid);
                    }
                    self.setData({
                        categoryList: res.data,
                        renderCids: cids
                    });
                    self.renderSwiper(0);
                    self.preLoadData();
                }
            }
        });
    },
    //获取推荐列表
    getRecommend() {
        var self = this;
        wx.showLoading({
            title: '加载中'
        });
        wx.request({
            url: host + '/recommend',
            success(res) {
                wx.stopPullDownRefresh();
                wx.hideLoading();
                if (res.statusCode == 200 && res.data && res.data.length) {
                    var allRec = [];
                    var banner = [];
                    res.data.map((item) => {
                        allRec = allRec.concat(item.list);
                    });
                    allRec.map((item) => {
                        item.lastupdatetime = util.passTime(item.lastupdatets);
                    });
                    self.setData({
                        recommend: res.data
                    });
                    //随机生成四个banner图
                    while (banner.length < 5 && banner.length < allRec.length) {
                        var item = allRec[Math.floor(Math.random() * allRec.length)];
                        if (banner.indexOf(item) == -1) {
                            banner.push(item);
                        }
                    }
                    self.setData({
                        banner: banner
                    });
                }

            }
        })
    },
    //显隐分类弹出框
    toggleCategory(e) {
        this.setData({
            showCategoryDialog: !this.data.showCategoryDialog
        });
    },
    //选择某个分类
    slectCategory(e) {
        var cid = e.currentTarget.dataset.category.cid;
        var index = 0;
        for (var i = 0; i < this.data.categoryList.length; i++) {
            if (this.data.categoryList[i].cid == cid) {
                index = i;
                break;
            }
        }
        this.setData({
            animationDuration: 0
        }, () => {
            this.setData({
                nowCid: this.data.categoryList[index],
                nowCidIndex: index,
                showCategoryDialog: false,
                animationDuration: 300
            });
        });
        this.scrollToCategory(this.data.categoryList[index]);
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
    //刷新分类列表
    refreshCategory() {
        this.data.swiperDataMap[this.data.nowCid] = null;
        this.renderSwiper(this.data.nowCidIndex);
    },
    //底部加载
    loadNext(cid) {
        var swiperData = this.data.swiperDataMap[cid];
        var self = this;
        //每次追加一页数据到底部
        if (swiperData && swiperData.endPage < swiperData.list.length) {
            var key = `swiperDataMap[${cid}].renderData[${swiperData.endPage}]`;
            var endPage = `swiperDataMap[${cid}].endPage`;
            this.setData({
                [key]: swiperData.list[swiperData.endPage],
                [endPage]: swiperData.endPage
            }, () => {
                if (!self.hasGetScrollHeight) {
                    setTimeout(() => {
                        var query = wx.createSelectorQuery()
                        query.select('.category_comic_scroll').boundingClientRect()
                        query.exec(function(rect) {
                            self.windowHeight = rect[0].height;
                        });
                        var query = wx.createSelectorQuery()
                        query.select('.category_item').boundingClientRect()
                        query.exec(function(rect) {
                            self.itemHeight = rect[0].height;
                        });
                    }, 500);
                    self.hasGetScrollHeight = true;
                }
            });
            swiperData.endPage++;
        } else if (!this.loading[cid] && (!swiperData || swiperData.total < 0 || swiperData.list.length < swiperData.total)) {
            if (!swiperData) {
                this.data.swiperDataMap[cid] = {
                    scrollTop: 0,
                    total: -1,
                    page: 1,
                    list: [],
                    renderData: [],
                    startPage: 0,
                    endPage: 0
                }
                swiperData = this.data.swiperDataMap[cid];
            }
            return this.getComicListByCategory(cid).then((data) => {
                swiperData.list.push(data.list);
                if (swiperData.total <= 0) {
                    swiperData.total = data.size;
                    var totalPageKey = `swiperDataMap[${cid}].totalPage`;
                    var viewArrKey = `swiperDataMap[${cid}].viewArr`;
                    //当前视图索引
                    var nowViewKey = `swiperDataMap[${cid}].nowView`
                    //总页数
                    var totalPage = Math.ceil(swiperData.total / this.data.pageSize);
                    //视图数组
                    var viewArr = [];
                    //计算视图的个数
                    for (var i = 0, len = Math.ceil(swiperData.total / this.data.pageSize / this.data.viewSize); i < len; i++) {
                        viewArr.push(i);
                    };
                    this.setData({
                        [totalPageKey]: totalPage,
                        [viewArrKey]: viewArr,
                        [nowViewKey]: 0
                    })
                }
                swiperData.page++;
                this.loadNext(cid);
            });
        }
        return Promise.resolve();
    },
    //加载漫画列表
    getComicListByCategory(cid) {
        var self = this;
        this.loading[cid] = true;
        return new Promise((resolve, reject) => {
            wx.request({
                url: host + '/comic?cid=' + cid + '&page=' + self.data.swiperDataMap[cid].page + '&size=' + this.data.pageSize,
                success(res) {
                    wx.stopPullDownRefresh();
                    self.loading[cid] = false;
                    res.data.list.map((item) => {
                        item.lastupdatetime = util.formatTime(item.lastupdatets, 'yyyy/MM/dd').slice(2);
                    });
                    resolve(res.data);
                },
                fail(err) {
                    console.log(err);
                    self.loading[cid] = false;
                    reject(err);
                }
            });
        })
    },
    getSwitch() {
        var self = this;
        // app.dirMenu = true;
        // wx.showTabBar();
        // return;
        wx.request({
            url: host + '/switch',
            success(res) {
                if (res.statusCode == 200) {
                    app.dirMenu = res.data.switch;
                    if (res.data.switch) {
                        wx.showTabBar();
                    } else {
                        wx.hideTabBar();
                    }
                }
            }
        })
    },
    //预加载列表数据
    preLoadData() {
        var categoryList = this.data.categoryList.slice(3);
        var cid = 0;
        for(var i=0; i<categoryList.length; i++) {
            if (!categoryList[i].loaded) {
                cid = categoryList[i].cid;
                break;
            }
        }
        if(cid) {
            this.loadNext(categoryList[i].cid).then(() => {
                categoryList[i].loaded = true;
                setTimeout(()=>{
                    this.preLoadData();
                }, 100);
            });
        }
    }
})