//index.js
//获取应用实例
const app = getApp()
const util = require('../../utils/util.js');
const host = require('../../config/index.js').httpHost;
Page({
    data: {
        searchKey: '',
        comicList: [],
        total: -1,
        page: 1,
        size: 20,
        showPlace: false,
        showCancel: false,
        focus: false
    },
    onLoad: function() {
        this.setData({
            focus: true
        });
    },
    //跳转到动漫详情页
    gotoDetail(e) {
        var comic = e.currentTarget.dataset.comic;
        wx.navigateTo({
            url: '/pages/detail/index?comic=' + encodeURIComponent(JSON.stringify(comic))
        });
    },
    clickSearch() {
        this.setData({
            showPlace: false
        })
    },
    searchConfirm(e) {
        this.setData({
            searchKey: e.detail.value,
            comicList: [],
            total: -1,
            page: 1,
            showCancel: true
        });
        this.getComicList();
    },
    searchCancel() {
        this.setData({
            searchKey: '',
            comicList: [],
            total: -1,
            page: 1,
            showCancel: false
        });
    },
    searchBlur() {
        setTimeout(() => {
            if (!this.data.searchKey) {
                this.setData({
                    showPlace: true
                });
            }
        }, 100);
    },
    loadMore() {
        if (this.data.comicList.length && this.data.comicList.length >= this.data.total) {
            return;
        } else if (this.data.total != -1) {
            this.setData({
                page: this.data.page + 1
            })
        }
        this.getComicList();
    },
    getComicList() {
        var self = this;
        wx.request({
            url: host + '/comic?search=' + this.data.searchKey + '&page=' + this.data.page + '&size=' + this.data.size,
            success(res) {
                wx.stopPullDownRefresh();
                if (res.statusCode == 200 && res.data.list) {
                    res.data.list.map((item) => {
                        item.lastupdatetime = util.formatTime(item.lastupdatets, 'yyyy/MM/dd').slice(2);
                    });
                    self.setData({
                        comicList: self.data.page == 1 ? res.data.list : self.data.comicList.concat(res.data.list),
                        total: res.data.size
                    });
                }
            }
        })
    },
})