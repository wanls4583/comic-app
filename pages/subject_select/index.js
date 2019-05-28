//index.js
//获取应用实例
const app = getApp();
const request = require('../../utils/request.js');
Page({
    data: {
        categoryList: [],
        areaList: [],
        nowAid: 0,
        nowCid: 0
    },
    onLoad() {
        var categoryList = wx.getStorageSync('categoryList');
        var areaList = wx.getStorageSync('areaList');
        var cid = wx.getStorageSync('nowCid');
        var aid = wx.getStorageSync('nowAid');
        if(aid && aid != 0) {
            this.setData({
                nowAid: aid
            });
        }
        if (cid && cid != 0) {
            this.setData({
                nowCid: cid
            });
        }
        if(categoryList) {
            this.setData({
                categoryList: categoryList
            });
        }
        if(areaList) {
            this.setData({
                areaList: areaList
            });
        } else {
            this.getArea();
        }
    },
    onShareAppMessage: function (res) {
      return {
        title: 'M画大全',
        path: '/pages/index/index'
      }
    },
    //选择某个分类
    slectCategory(e) {
        var cid = e.currentTarget.dataset.category.cid;
        wx.setStorageSync('nowCid', cid);
        wx.navigateBack({
            delta: 1
        });
    },
    //选择某个地区
    selectArea(e) {
        var cid = e.currentTarget.dataset.area.aid;
        wx.setStorageSync('nowAid', cid);
        wx.navigateBack({
            delta: 1
        });
    },
    //获取地区列表
    getArea() {
        var self = this;
        request({
            url: '/area',
            success(res) {
                if (res.statusCode == 200 && res.data && res.data.length) {
                    self.setData({
                        areaList: res.data
                    });
                    wx.setStorageSync('areaList', res.data);
                }
            }
        });
    }
})