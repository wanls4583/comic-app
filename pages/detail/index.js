//获取应用实例
const app = getApp()
const host = require('../../config/index.js').httpHost;
Page({
    data: {
        showDes: true,
        comic: {},
        chapterList: [],
        loadingStatus: 0
    },
    onLoad: function(option) {
        if (!option.comic) {
            return;
        }
        var comic = JSON.parse(decodeURIComponent(option.comic));
        if (comic.status == 1) {
            comic.status = '完结';
        } else if (comic.status == 0) {
            comic.status = '连载中';
        }
        comic.author = comic.author.split(',');
        comic.area = 'heh';
        comic.categorys = [];
        this.setData({
            comic: comic
        });
        this.getCategoryAndArea();
        this.getChpater();
        
    },
    onPullDownRefresh() {
        this.getCategoryAndArea();
        this.getChpater();
    },
    gotoPicture(e) {
        var index = e.currentTarget.dataset.index;
        var chapterList = this.data.chapterList.slice(index);
        wx.setStorageSync('chapterList', JSON.stringify(chapterList));
        wx.navigateTo({
            url: '/pages/picture/index'
        });
    },
    toggleTab(e) {
        if (e.currentTarget.dataset.tab == 1) {
            this.setData({
                showDes: true
            });
        } else {
            this.setData({
                showDes: false
            });
        }
    },
    getCategoryAndArea() {
        var self = this;
        wx.request({
            url: host + '/comic/category_area/' + this.data.comic.comicid,
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
        wx.request({
            url: host + '/chapter/' + this.data.comic.comicid,
            success(res) {
                wx.stopPullDownRefresh();
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
    }
})