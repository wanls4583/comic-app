//index.js
//获取应用实例
const app = getApp()

Page({
    data: {
        userInfo: {},
        hasUserInfo: false,
        canIUse: wx.canIUse('button.open-type.getUserInfo'),
        category: [],
        recommend: [],
        nowCategory: {
            cid: 0
        },
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
    slectCategory(e) {
        var category = e.currentTarget.dataset.category;
        this.setData({
            nowCategory: category,
            showCategoryDialog: false
        });
        //目录滚动到当前按钮的前两个按钮的位置
        for (var i = 0; i < this.data.category.length; i++) {
            var item = this.data.category[i];
            if (item.cid == category.cid) {
                var index = i - 2 > 0 ? i - 2 : 0;
                this.setData({
                    toCategory: 'category_' + this.data.category[index].cid
                });
                break;
            }
        }
    },
    //事件处理函数
    bindViewTap: function() {
        wx.navigateTo({
            url: '../logs/logs'
        })
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
            url: 'https://lisong.hn.cn/category',
            success(res) {
                if (res.statusCode == 200 && res.data && res.data.length) {
                    self.setData({
                        category: res.data
                    });
                }
            }
        });
    },
    //获取推荐列表
    getRecommend() {
        var self = this;
        wx.request({
            url: 'https://lisong.hn.cn/recommend',
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