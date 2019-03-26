//index.js
//获取应用实例
const app = getApp()
const util = require('../../utils/util.js');
Page({
    data: {
        comicHistory: []
    },
    onShow: function() {
        var self = this;
        wx.getStorage({
            key: 'comic_history',
            success: function(res) {
                var comicHistory = JSON.parse(res.data);
                comicHistory.map((item)=>{
                    item.comic.author = item.comic.author.join(',');
                    item.comic.lastupdatetime = util.formatTime(item.comic.lastupdatets, 'yyyy/MM/dd').slice(2);
                });
                self.setData({
                    comicHistory: comicHistory
                });
            },
        })
    },
    //跳转到动漫详情页
    gotoDetail(e) {
        var comic = e.currentTarget.dataset.comic;
        wx.navigateTo({
            url: '/pages/detail/index?comic=' + encodeURIComponent(JSON.stringify(comic))
        });
    },
    //清除历史记录
    clearHistory() {
        var self = this;
        wx.showModal({
            title: '删除',
            content: '确认删除历史记录？',
            success(res) {
                if (res.confirm) {
                    wx.removeStorageSync('comic_history');
                    wx.removeStorageSync('chapter_history');
                    self.setData({
                        comicHistory: []
                    });
                }
            }
        })
    }
})