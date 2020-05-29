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
                if(!this.hasAttached) {
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
                this.getRect().then((res) => {
                    if(!res) {
                        return;
                    }
                    var animation = true;
                    //滚动距离过大时不再使用过度动画
                    if (res.scrollTop > app.globalData.systemInfo.screenHeight * 10) {
                        animation = false;
                    }
                    this.setData({
                        animation: animation
                    }, () => {
                        //滚动到顶部
                        this.setData({
                            _scrollTop: this.properties.topHeight + newVal
                        }, () => {
                            this.setData({
                                animation: true
                            });
                        });
                    });
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
                clearTimeout(this.hideTipTimer);
                //防止频繁刷新，导致画面闪烁
                this.returnTimer = setTimeout(() => {
                    this.setData({
                        _scrollTop: this.data._scrollTop == this.properties.topHeight ? this.properties.topHeight + 1 : this.properties.topHeight
                    });
                }, 500);
                this.hideTipTimer = setTimeout(() => {
                    this.setData({
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
                if(this.properties.fullScreen) {
                    newVal += this.data.statusBarHeight;
                }
                this.properties.topHeight = newVal;
                this.setData({
                    animation: false
                },()=>{
                    this.setData({
                        _scrollTop: this.properties.scrollTop ? this.properties.scrollTop : this.properties.topHeight
                    },()=>{
                        this.setData({
                            animation: true
                        });
                    });
                });
            }
        }
    },
    data: {
        systemInfo: app.globalData.systemInfo,
        statusBarHeight: app.globalData.systemInfo.statusBarHeight,
        _scrollTop: 0,
        animation: true,
        finished: false
    },
    lifetimes: {
        attached() {
            if(this.properties.topHeight == 60 && this.properties.fullScreen) {
                this.properties.topHeight += this.data.statusBarHeight;
            }
            this.setData({
                animation: false
            },()=>{
                this.setData({
                    _scrollTop: this.properties.scrollTop ? this.properties.scrollTop : this.properties.topHeight
                },()=>{
                    this.setData({
                        animation: true
                    });
                });
            });
            this.hasAttached = true;
        }
    },
    attached: function(option) {
        if(this.properties.topHeight == 60 && this.properties.fullScreen) {
            this.properties.topHeight += this.data.statusBarHeight;
        }
        this.setData({
            animation: false
        },()=>{
            this.setData({
                _scrollTop: this.properties.scrollTop ? this.properties.scrollTop : this.properties.topHeight
            },()=>{
                this.setData({
                    animation: true
                });
            });
        });
        this.hasAttached = true;
    },
    methods: {
        onScroll(e) {
            var scrollTop = e.detail.scrollTop;
            this.triggerEvent('scroll', e.detail);
            if (!this.touching && !this.refreshing && !this.readyToRefresh && !this.gettingRect && !this.returnToTop) {
                if (scrollTop < this.properties.topHeight) {
                    this.setData({
                        _scrollTop: this.data._scrollTop == this.properties.topHeight ? this.properties.topHeight + 1 : this.properties.topHeight
                    });
                }
            }
            clearTimeout(this.scrollTimer);
            this.scrollTimer = setTimeout(() => {
                //滚动停止时候执行更新
                if (this.readyToRefresh) {
                    this.refresh();
                    this.readyToRefresh = false;
                }
            }, 500);
            if(this.returnToTop) {
                clearTimeout(this.returnToTopTimer);
                //惯性滚动停止时再滚动到顶部
                this.returnToTopTimer = setTimeout(()=>{
                    this.setData({
                        _scrollTop: this.data._scrollTop == this.properties.topHeight ? this.properties.topHeight + 1 : this.properties.topHeight
                    });
                    this.returnToTop = false;
                }, 50);
            }
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
            if(this.refreshing || this.readyToRefresh) {
                return;
            }
            this.getRect().then((res) => {
                this.touching = false;
                if (!res) {
                    return;
                }
                //时间太短，不触发更新
                if (res.scrollTop <= 0 && !(this.endTime - this.startTime < 200)) {
                    //准备更新
                    this.readyToRefresh = true;
                    //滚动停止时再刷新
                    this.scrollTimer = setTimeout(() => {
                        this.refresh();
                        this.readyToRefresh = false;
                    }, 100);
                } else if (res.scrollTop < this.data.topHeight) {
                    //防止 IOS 回弹怪异现象，惯性滚动停止时再滚动到顶部
                    if(app.globalData.systemInfo.platform == 'ios') {
                        this.returnToTop = true;
                        clearTimeout(this.returnToTopTimer);
                        this.returnToTopTimer = setTimeout(()=>{
                            this.setData({
                                _scrollTop: this.data._scrollTop == this.properties.topHeight ? this.properties.topHeight + 1 : this.properties.topHeight
                            });
                            this.returnToTop = false;
                        }, 100);
                    } else {
                        this.setData({
                            _scrollTop: this.data._scrollTop == this.properties.topHeight ? this.properties.topHeight + 1 : this.properties.topHeight
                        });
                    }
                }
            });
        },
        refresh() {
            this.refreshing = true;
            this.triggerEvent('refresh');
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