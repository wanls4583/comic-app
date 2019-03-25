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
        showHistory: true,
        autoFocus: false,
        history: []
    },
    onLoad: function() {
        var history = wx.getStorageSync('search_history');
        history = history && JSON.parse(history) || [];
        this.setData({
            autoFocus: true,
            history: history
        });
    },
    //跳转到动漫详情页
    gotoDetail(e) {
        var comic = e.currentTarget.dataset.comic;
        wx.navigateTo({
            url: '/pages/detail/index?comic=' + encodeURIComponent(JSON.stringify(comic))
        });
    },
    //选中搜索历史
    selectHistory(e) {
        var text = e.currentTarget.dataset.text;
        this.setData({
            searchKey: text,
            comicList: [],
            total: -1,
            page: 1,
            showCancel: true,
            showPlace: false,
            showHistory: false
        });
        this.getComicList();
    },
    //清除历史记录
    clearHistory() {
        wx.removeStorageSync('search_history');
        this.setData({
            history: []
        });
    },
    //点击搜索框
    clickSearch() {
        
    },
    //输入内容
    searchInput(e) {
        this.setData({
            searchKey: e.detail.value
        })
    },
    //确认搜索
    searchConfirm(e) {
        this.setData({
            searchKey: e.detail.value,
            comicList: [],
            total: -1,
            page: 1,
            showCancel: true,
            showHistory: false,
        });
        if (this.data.searchKey && this.data.history.indexOf(this.data.searchKey) == -1) {
            this.setData({
                history: this.data.history.concat([this.data.searchKey])
            })
            wx.setStorageSync('search_history', JSON.stringify(this.data.history))
        }
        this.getComicList();
    },
    //取消搜索
    searchCancel() {
        wx.navigateBack({
            delta: 1
        })
    },
    //聚焦
    searchFocus() {
        this.setData({
            showPlace: false,
            showHistory: true
        })
    },
    //失焦
    searchBlur() {
        if (!this.data.searchKey) {
            this.setData({
                showPlace: true
            });
        }
    },
    //加载更多
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
    //加载列表
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