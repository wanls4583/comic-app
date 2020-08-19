const app = getApp();
Component({
    externalClasses: ['external-classes'],
    properties: {
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
            value: 0,
            observer: function(newVal, oldVal) {
                this.properties.scrollTop = newVal + 1;
                if (!this.hasAttached) {
                    return;
                }
                //使下次相同的scrollTop能触发observer
                this.setData({
                    _scrollTop: newVal
                });
            }
        },
        scrollToTop: {
            type: Boolean,
            value: false,
            observer: function(newVal, oldVal) {
                //使下次能再触发observer
                this.properties.scrollToTop = false;
                this.setData({
                    _scrollTop: 0
                });
            }
        },
        stopRefresh: {
            type: Boolean,
            value: false,
            observer: function(newVal, oldVal) {
                //使下次能再触发observer
                this.properties.stopRefresh = false;
                this.setData({
                    finished: true
                });
                clearTimeout(this.returnTimer);
                //防止频繁刷新，导致画面闪烁
                this.returnTimer = setTimeout(() => {
                    this.setData({
                        _translateY: -this.properties.topHeight,
                        finished: false
                    });
                    this.refreshing = false;
                }, 1000);
            }
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
            value: 60,
            observer: function(newVal, oldVal) {
                if (this.properties.fullScreen) {
                    newVal += this.data.statusBarHeight;
                }
                this.properties.topHeight = newVal;
                this.setData({
                    _topHeight: newVal,
                    _translateY: -newVal
                });
            }
        }
    },
    data: {
        statusBarHeight: 0,
        _scrollTop: 0,
        _topHeight: 0,
        _translateY: 0,
        animation: true,
        finished: false,
        minHeight: 0
    },
    lifetimes: {
        attached() {
            this._attached();
        }
    },
    attached: function(option) {
        this._attached();
    },
    methods: {
        _attached() {
            var systemInfo = wx.getSystemInfoSync();
            if (this.properties.topHeight == 60 && this.properties.fullScreen) {
                this.properties.topHeight += systemInfo.statusBarHeight;
            }
            this.setData({
                statusBarHeight: systemInfo.statusBarHeight,
                _topHeight: this.properties.topHeight,
                _translateY: -this.properties.topHeight
            });
            this.getRect().then((res) => {
                this.setData({
                    minHeight: res.height + this.properties.topHeight
                }, () => {
                    this.setData({
                        _scrollTop: this.properties.scrollTop || 0,
                    });
                });
            });
            this.hasAttached = true;
        },
        onScroll(e) {
            this.triggerEvent('scroll', e.detail);
        },
        onScrolltolower(e) {
            this.triggerEvent('scrolltolower', e.detail);
        },
        onScrolltoupper(e) {
            this.triggerEvent('scrolltoupper', e.detail);
        },
        touchStart(e) {
            this.touching = true;
            this.startTime = new Date().getTime();
        },
        touchEnd(e) {
            this.endTime = new Date().getTime();
            if (this.refreshing || this.readyToRefresh) {
                return;
            }
            this.getRect().then((res) => {
                this.touching = false;
                if (!res) {
                    return;
                }
                //时间太短，不触发更新
                if (res.scrollTop <= -this.properties.topHeight && !(this.endTime - this.startTime < 200)) {
                    this.refresh();
                }
            });
        },
        refresh() {
            if (this.refreshing) {
                return;
            }
            this.refreshing = true;
            this.triggerEvent('refresh');
            this.setData({
                _translateY: 0
            });
        },
        getRect() {
            clearTimeout(this.rectTimer);
            this.gettingRect = true;
            return new Promise((reslove, reject) => {
                var query = wx.createSelectorQuery().in(this);
                query.select('.scroll_view').fields({
                    size: true,
                    scrollOffset: true,
                }, (res) => {
                    reslove(res);
                    this.rectTimer = setTimeout(() => {
                        this.gettingRect = false;
                    }, 10);
                });
                query.exec();
            });
        }
    }
})