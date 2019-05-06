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
        nowCidIndex: 0, //当前滑块的索引
        pageSize: 3 * 3 * 3, //一页的数量
        toCategory: 'category_0', //分类列表滚动到指定位置
        showCategoryDialog: false, //选择分类弹框
        currentBannerIndex: 0, //当前轮播图索引号
        swiperDataMap: [], //所有漫画列表
        aidSelectMap: [], //存储地区选择
        aidMap: [], //存储所有地区
        renderCids: [], //当前可渲染的列表对应的分类ID
        scrollTop: [], //列表对应的滚动距离
        viewSize: 40, //scroll-view中最多同时存在40页
        overlappingPage: 5, //前后视图交叉的页数
        animationDuration: 300,
        stopSwiper: false,
        systemInfo: app.globalData.systemInfo,
        menuRect: app.globalData.menuRect,
        navHeight: app.globalData.navHeight,
        bgImage: '',
        showScrollBtn: false,
        scrollAnimation: false
    },
    onLoad: function() {
        this.itemHeight = 205 * app.globalData.systemInfo.screenWidth / 375;
        this.windowHeight = app.globalData.systemInfo.windowHeight;
        this.loading = {};
        this.loaded = {};
        this.getCategory();
        this.getArea();
        wx.removeStorageSync('nowAid');
    },
    onShow() {
        var cid = wx.getStorageSync('nowCid');
        var aid = wx.getStorageSync('nowAid');
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
                this.changeCategory(cid);
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
    },
    //顶部下拉刷新
    onPullDownRefresh() {
        if (this.data.nowCid) {
            this.refreshCategory();
        } else {
            this.getCategory();
        }
    },
    //滚动事件
    onScroll(e) {
        //避免频繁计算
        if (!this.scrollTimer) {
            this.scrollTimer = setTimeout(() => {
                this.scrollCompute(e);
                this.scrollTimer = null;
            }, 50);
        }
    },
    scrollCompute(e) {
        var scrollTop = e.detail.scrollTop;
        var cid = e.currentTarget.dataset.cid;
        var swiperData = this.data.swiperDataMap[cid];
        swiperData.scrollTop = scrollTop;
        var preScrollTop = this.preScrollTop || 0;
        this.preScrollTop = scrollTop;
        //显/隐排序栏
        if (scrollTop < app.globalData.systemInfo.screenWidth / 375 * 40) {
            this.setData({
                [`swiperDataMap[${cid}].showSort`]: true
            });
        } else if (preScrollTop - scrollTop < -10) {
            this.setData({
                [`swiperDataMap[${cid}].showSort`]: false
            });
        } else if (preScrollTop - scrollTop > 10) {
            this.setData({
                [`swiperDataMap[${cid}].showSort`]: true
            });
        }
        if (scrollTop > this.data.systemInfo.screenHeight / 2) {
            this.setData({
                showScrollBtn: true
            });
        } else {
            this.setData({
                showScrollBtn: false
            });
        }
        //切换中
        if (this.viewRending) {
            return;
        }
        //切换到下一个视图
        if (e.detail.scrollHeight + 3 * this.itemHeight >= this.data.pageSize / 3 * (this.data.viewSize + this.data.overlappingPage) * this.itemHeight && e.detail.scrollHeight - scrollTop <= this.windowHeight + 50 && swiperData.nowView < swiperData.viewArr.length - 1) {
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
        } else if (scrollTop < 3 * this.itemHeight && swiperData.nowView > 0) {
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
            stopSwiper: false
        });
    },
    swiperChange(e) {
        this.setData({
            stopSwiper: true
        });
    },
    //渲染swiper-item，每次只渲染三个
    renderSwiper(current) {
        var categoryList = this.data.categoryList;
        var map = [];
        var scrollTop = [];
        if (!this.data.swiperDataMap[categoryList[current].cid] || this.data.swiperDataMap[categoryList[current].cid].total < 0) {
            wx.showLoading({
                title: '加载中'
            });
        }
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
            if (!this.data.swiperDataMap[item] || this.data.swiperDataMap[item].total < 0) {
                this.loadNext(item);
            }
        });
        map.map((item) => {
            scrollTop[item] = this.data.swiperDataMap[item].scrollTop || 0;
        });
        this.setData({
            nowAid: this.data.aidSelectMap[categoryList[current].cid] || 0,
            nowCid: categoryList[current].cid,
            nowCidIndex: current,
            renderCids: map,
            scrollTop: scrollTop
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
    slectCategory(e) {
        var cid = e.currentTarget.dataset.category.cid;
        this.changeCategory(cid);
    },
    selectSort(e) {
        var status = e.currentTarget.dataset.status;
        var sort = e.currentTarget.dataset.sort;
        var cid = e.currentTarget.dataset.cid;
        var swiperData = this.data.swiperDataMap[cid];
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
    changeCategory(cid) {
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
                nowCidIndex: index,
                showCategoryDialog: false,
                animationDuration: 300
            });
        });
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
        this.viewRending = true;
        var scrollAnimation = false;
        var swiperData = this.data.swiperDataMap[this.data.nowCid];
        if (swiperData.nowView == 0 && swiperData.scrollTop < this.data.systemInfo.screenHeight * 10) {
            scrollAnimation = true;
        }
        this.setData({
            scrollAnimation: scrollAnimation,
            [`swiperDataMap[${this.data.nowCid}].nowView`]: 0
        }, () => {
            this.setData({
                [`scrollTop[${this.data.nowCid}]`]: 0
            }, () => {
                setTimeout(() => {
                    this.viewRending = false;
                }, 1000);
            });
        });
    },
    //刷新分类列表
    refreshCategory() {
        var swiperData = this.data.swiperDataMap[this.data.nowCid];
        this.data.swiperDataMap[this.data.nowCid] = {
            scrollTop: 0,
            total: -1,
            page: 1,
            list: [],
            renderData: [],
            startPage: 0,
            endPage: 0,
            sort: swiperData.sort,
            status: swiperData.status
        };
        this.setData({
            [`swiperDataMap[${this.data.nowCid}].totalPage`]: -1
        });
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
                            if (rect && rect[0]) {
                                self.windowHeight = rect[0].height;
                            } else {
                                self.hasGetScrollHeight = false;
                            }
                        });
                        var query = wx.createSelectorQuery()
                        query.select('.category_item').boundingClientRect()
                        query.exec(function(rect) {
                            if (rect && rect[0]) {
                                self.itemHeight = rect[0].height;
                            } else {
                                self.hasGetScrollHeight = false;
                            }
                        });
                    }, 500);
                    self.hasGetScrollHeight = true;
                }
            });
            swiperData.endPage++;
        } else if (!this.loading[cid] && (!swiperData || swiperData.total < 0 || swiperData.list.length < swiperData.totalPage)) {
            if (!swiperData) {
                var sortKey = `swiperDataMap[${cid}].sort`;
                var statusKey = `swiperDataMap[${cid}].status`;
                this.data.swiperDataMap[cid] = {
                    scrollTop: 0,
                    total: -1,
                    page: 1,
                    list: [],
                    renderData: [],
                    startPage: 0,
                    endPage: 0
                }
                this.setData({
                    [sortKey]: 'read_count',
                    [statusKey]: ''
                });
                swiperData = this.data.swiperDataMap[cid];
            }
            return this.getComicListByCategory(cid).then((data) => {
                swiperData.list.push(data.list);
                //第一次加载或者刷新
                if (swiperData.total <= 0) {
                    swiperData.total = data.size;
                    var totalPageKey = `swiperDataMap[${cid}].totalPage`;
                    var viewArrKey = `swiperDataMap[${cid}].viewArr`;
                    var showSortKey = `swiperDataMap[${cid}].showSort`;
                    var renderDataKey = `swiperDataMap[${cid}].renderData`;
                    //当前视图索引
                    var nowViewKey = `swiperDataMap[${cid}].nowView`
                    //总页数
                    var totalPage = Math.ceil(swiperData.total / this.data.pageSize);
                    //视图数组
                    var viewArr = [0];
                    //计算视图的个数
                    for (var i = 1, len = Math.ceil(swiperData.total / this.data.pageSize / this.data.viewSize); i < len; i++) {
                        viewArr.push(i);
                    };
                    this.setData({
                        [totalPageKey]: totalPage,
                        [viewArrKey]: viewArr,
                        [nowViewKey]: 0,
                        [showSortKey]: true,
                        [renderDataKey]: []
                    });
                }
                //模糊背景
                if (!this.data.bgImage && data.list[0]) {
                    this.setData({
                        bgImage: data.list[0].cover_url
                    });
                }
                swiperData.page++;
                this.loadNext(cid);
            });
        }
        return Promise.resolve();
    },
    //获取所有分类
    getCategory() {
        var self = this;
        request({
            url: '/category',
            success(res) {
                if (res.statusCode == 200 && res.data && res.data.length) {
                    var cids = [];
                    var nowCid = self.historyCid || res.data[0].cid;
                    var current = 0;
                    for (var i = 0; i < 3 && i < res.data.length; i++) {
                        cids.push(res.data[i].cid);
                    }
                    self.setData({
                        categoryList: res.data,
                        renderCids: cids
                    });
                    // self.preLoadData();
                    for (var i = 0; i < self.data.categoryList.length; i++) {
                        if (self.data.categoryList[i].cid == nowCid) {
                            current = i;
                            break;
                        }
                    }
                    if (current == 0) {
                        self.renderSwiper(current);
                    } else {
                        self.changeCategory(nowCid);
                    }
                }
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
        this.loading[cid] = true;
        return new Promise((resolve, reject) => {
            var data = {
                cid: cid,
                page: self.data.swiperDataMap[cid].page,
                pageSize: self.data.pageSize,
                sort: self.data.swiperDataMap[cid].sort,
                aid: self.data.aidSelectMap[cid] || 0
            }
            if (self.data.swiperDataMap[cid].status) {
                data.status = self.data.swiperDataMap[cid].status;
            }
            request({
                url: '/comic',
                data: data,
                success(res) {
                    wx.stopPullDownRefresh();
                    self.loading[cid] = false;
                    self.loaded[cid] = true;
                    if (cid == self.data.nowCid) {
                        wx.hideLoading();
                    }
                    res.data.list.map((item) => {
                        item.lastupdatetime = util.formatTime(item.update_time, 'yyyy/MM/dd').slice(2);
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
    //预加载列表数据
    preLoadData() {
        var categoryList = this.data.categoryList.slice(3);
        var cid = 0;
        for (var i = 0; i < categoryList.length; i++) {
            if (!this.loaded[categoryList[i].cid]) {
                cid = categoryList[i].cid;
                break;
            }
        }
        if (cid) {
            this.loadNext(categoryList[i].cid).then(() => {
                setTimeout(() => {
                    this.preLoadData();
                }, 100);
            });
        }
    }
})