//index.js
//获取应用实例
const app = getApp();
const request = require('../../utils/request.js');
Page({
    data: {
        canRead: false,
        categoryList: [{
            name: '求漫画',
            value: '求漫画',
            checked: 'true'
        }, {
            name: '章节/内容问题',
            value: '章节/内容问题'
        }, {
            name: '章节/内容问题',
            value: '章节/内容问题'
        }, {
            name: '加载慢/功能问题',
            value: '加载慢/功能问题'
        }, {
            name: '其他问题',
            value: '其他问题'
        }, ],
        contactList: [
            {
                name: 'QQ',
                value: 'QQ',
                checked: 'true'
            },
            {
                name: '电话',
                value: '电话'
            },
            {
                name: '邮箱',
                value: '邮箱'
            }
        ]
    },
    onLoad: function() {
        this.category = '求漫画';
        this.contactType = 'QQ';
        //设置标题
        wx.setNavigationBarTitle({
            title: '意见反馈'
        });
    },
    onShow() {
        this.setData({
            canRead: app.canRead
        });
    },
    categoryRadioChange(e) {
        this.category = e.detail.value;
    },
    contactRadioChange(e) {
        this.contactType = e.detail.value;
    },
    contentInput(e) {
        this.content = e.detail.value;
    },
    contactInput(e) {
        this.contact = e.detail.value;
    },
    submit() {
        if(!this.content) {
            wx.showToast({
                title: '反馈内容不能为空',
                icon: 'none'
            });
            return;
        }
        request({
            url: '/feedback/add',
            method: 'post',
            data: {
                contactType: this.contactType,
                contact: this.contact || '',
                category: this.category,
                content: this.content
            },
            success: (res)=>{
                if(res.data.status==1) {
                    wx.showToast({
                        title: '反馈成功',
                        duration: 2000
                    });
                    setTimeout(()=>{
                        this.back();
                    }, 1500);
                } else {
                    wx.showToast({
                        title: '反馈失败',
                        icon: 'none'
                    }); 
                }
            },
            fail: (err)=>{
                wx.showToast({
                    title: '反馈失败',
                    icon: 'none'
                }); 
            }
        })
    },
    back() {
        wx.navigateBack({
            delta: 1
        });
    }
})