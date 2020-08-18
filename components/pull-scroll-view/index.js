const app = getApp();
Component({
    properties: {
        externalClasses: {
            type: String,
            value: ''
        },
        style: {
            type: String,
            value: ''
        },
        //全屏时适配顶部状态栏
        fullScreen: {
            type: Boolean,
            value: false
        },
        scrollTop: {
            type: Number,
            value: 0
        },
        scrollToTop: {
            type: Boolean,
            value: false
        },
        stopRefresh: {
            type: Boolean,
            value: false
        },
        lowerThreshold: {
            type: String,
            value: '100px',
        },
        upperThreshold: {
            type: String,
            value: '100px',
        },
        topHeight: {
            type: Number,
            value: 60
        }
    },
    data: {
        platform: 'android'
    },
    lifetimes: {
        attached() {
            var self = this;
            wx.getSystemInfo({
                success: function(res) {
                    self.setData({
                        platform: res.platform
                    });
                }
            });
        }
    },
    attached: function(option) {
        var self = this;
        wx.getSystemInfo({
            success: function(res) {
                self.setData({
                    platform: res.platform
                });
            }
        });
    },
    methods: {
        onScroll(e) {
            this.triggerEvent('scroll', e);
        },
        onScrolltolower(e) {
            this.triggerEvent('scrolltolower', e);
        },
        onScrolltoupper(e) {
            this.triggerEvent('scrolltoupper', e);
        },
        onRefresh() {
            this.triggerEvent('refresh');
        }
    }
})