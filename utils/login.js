const request = require('./request.js');

function checkLogin() {
    return checkSession().then(()=>{
        if (wx.getStorageSync('sessionid') && wx.getStorageSync('userInfo')) {
            return checkLoginStatus().then((result)=>{
                if(!result) {
                    return login();
                }
            });
        } else if (wx.getStorageSync('userInfo')) {
            wx.removeStorageSync('sessionid');
            return login();
        } else {
            return Promise.reject('数据错误');
        }
    }).catch(()=>{
        return checkAuthorize().then(()=>{
            return getUserInfo();
        }).then(()=>{
            return login();
        }).catch((err)=>{
            return Promise.reject(err);
        })
    });
}

//检测后台登录状态
function checkLoginStatus() {
    return new Promise((resolve, reject) => {
        request({
            url: '/users/checkLogin',
            method: 'post',
            success: (res) => {
                resolve(res.data.result);
            },
            fail: (err) => {
                reject(err);
            }
        })
    });
}

//检测session_key是否失效
function checkSession() {
    return new Promise((resolve, reject)=>{
        wx.checkSession({
            success(res) {
                // session_key 未过期，并且在本生命周期一直有效
                resolve(res);
            },
            fail(err) {
                // session_key 已经失效，需要重新执行登录流程
                reject(err);
            }
        });
    });
}

//检测授权状态
function checkAuthorize() {
    return new Promise((resolve, reject)=>{
        // 获取用户信息
        wx.getSetting({
            success: res => {
                if (res.authSetting['scope.userInfo']) {
                    resolve(res);
                } else {
                    reject(res);
                }
            },
            fail: (err)=>{
                reject(err);
            }
        })
    });
}

//获取用户基础信息
function getUserInfo() {
    return new Promise((resolve, reject)=>{
        wx.getUserInfo({
            success: (res)=>{
                resolve(res.userInfo);
                wx.setStorageSync('userInfo', JSON.stringify(res.userInfo));
            },
            fail: (err)=>{
                reject(err);
            }
        })
    });
}

//登录
function login() {
    return new Promise((resolve, reject)=>{
        wx.login({
            success: (res) => {
                resolve(res.code);
            },
            fail: (err)=>{
                reject(err);
            }
        })
    }).then((code)=>{
        return new Promise((resolve, reject)=>{
            var userInfo = wx.getStorageSync('userInfo');
            userInfo = JSON.parse(userInfo);
            userInfo.code = code;
            request({
                url: '/users/login',
                method: 'post',
                data: userInfo,
                success: (res)=>{
                    wx.setStorageSync('sessionid', res.data.sessionid);
                    resolve(res);
                },
                fail: (err)=>{
                    reject(err);
                }
            });
        });
    });
}

module.exports = {
    checkLogin: checkLogin,
    checkSession: checkSession,
    checkAuthorize: checkAuthorize,
    getUserInfo: getUserInfo,
    login: login
}