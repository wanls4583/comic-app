//index.js
//获取应用实例
const app = getApp()
const util = require('../../utils/util.js');
const host = require('../../config/index.js').httpHost;
Page({
    data: {
        comicHistory: []
    },
    onLoad: function() {
        var self = this;
        wx.getStorage({
            key: 'comic_history',
            success: function(res) {
                var comicHistory = JSON.parse(res.data);
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
    }
})