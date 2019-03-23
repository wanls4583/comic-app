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
        categoryList: [],
        recommend: [],
        comicListByCategory: [],
        total: 0,
        nowCategory: {
            cid: 0
        },
        page: 1,
        size: 20,
        toCategory: 'category_0',
        testImg: 'http://mhfm6tel.cdndm5.com/7/6746/20190222150546_480x369_82.jpg',
        showCategoryDialog: false
    },
    //显隐分类弹出框
    toggleCategory(e) {
        this.setData({
            showCategoryDialog: !this.data.showCategoryDialog
        });
    },
    //选择某个分类
    slectCategory(e) {
        var category = e.currentTarget.dataset.category;
        //防止重复点击
        if(this.data.nowCategory.cid == category.cid) {
            return;
        }
        this.setData({
            comicListByCategory: [],
            total: 0,
            nowCategory: category,
            showCategoryDialog: false,
            page: 1
        });
        //目录滚动到当前按钮的前两个按钮的位置
        for (var i = 0; i < this.data.categoryList.length; i++) {
            var item = this.data.categoryList[i];
            if (item.cid == category.cid) {
                var index = i - 2 > 0 ? i - 2 : 0;
                this.setData({
                    toCategory: 'category_' + this.data.categoryList[index].cid
                });
                break;
            }
        }
        if (!this.data.comicListByCategory.length || this.data.comicListByCategory.length < this.data.total) {
            this.getComicListByCategory();
        }
    },
    //跳转到动漫详情页
    gotoDetail(e) {
        var comic = e.currentTarget.dataset.comic;
        wx.navigateTo({
            url: '/pages/detail/index?comic='+JSON.stringify(comic)
        });
    },
    //加载漫画列表
    getComicListByCategory() {
        var self = this;
        if (this.data.comicListByCategory.length && this.data.comicListByCategory.length >= this.data.total) {
            return;
        }
        wx.request({
            url: host + '/comic?cid='+this.data.nowCategory.cid+'&page='+this.data.page+'&size='+this.data.size,
            success(res) {
                if (res.statusCode == 200 && res.data.list && res.data.list.length) {
                    res.data.list.map((item) => {
                        item.lastupdatetime = util.formatTime(item.lastupdatets, 'yyyy/MM/dd').slice(2);
                    });
                    self.setData({
                        comicListByCategory: self.data.page == 1 ? res.data.list : self.data.comicListByCategory.concat(res.data.list),
                        total: res.data.size
                    });
                }
            }
        })
    },
    //加载更多漫画列表
    loadMore() {
        this.setData({
            page: this.data.page+1
        });
        this.getComicListByCategory();
    },
    onLoad: function() {
        if (app.globalData.userInfo) {
            this.setData({
                userInfo: app.globalData.userInfo,
                hasUserInfo: true
            })
        } else if (this.data.canIUse) {
            // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
            // 所以此处加入 callback 以防止这种情况
            app.userInfoReadyCallback = res => {
                this.setData({
                    userInfo: res.userInfo,
                    hasUserInfo: true
                })
            }
        } else {
            // 在没有 open-type=getUserInfo 版本的兼容处理
            wx.getUserInfo({
                success: res => {
                    app.globalData.userInfo = res.userInfo
                    this.setData({
                        userInfo: res.userInfo,
                        hasUserInfo: true
                    })
                }
            })
        }
        this.getCategory();
        this.getRecommend();
    },
    getUserInfo: function(e) {
        console.log(e)
        app.globalData.userInfo = e.detail.userInfo
        this.setData({
            userInfo: e.detail.userInfo,
            hasUserInfo: true
        })
    },
    //获取所有分类
    getCategory() {
        var self = this;
        wx.request({
            url: host + '/category',
            success(res) {
                if (res.statusCode == 200 && res.data && res.data.length) {
                    self.setData({
                        categoryList: res.data
                    });
                }
            }
        });
    },
    //获取推荐列表
    getRecommend() {
        var self = this;
        wx.request({
            url: host + '/recommend',
            success(res) {
                if (res.statusCode == 200 && res.data && res.data.length) {
                    self.setData({
                        recommend: res.data
                    })
                }
            }
        })
    }
})