import history from '../core/history';

// import * as conf from '../config';
import Net from '../net/net';
import GlobalStore from '../stores';
import Cookies from '../utils/cookie';
import store from 'store';
import AccountModel from './account';
import WsMgr from '../net/WsMgr';
import {toast} from '../utils/common';
import SysTime from './system';
import Intl from '../intl';
import Event from '../core/event';

//保存登录相关的数据及业务内容
const AuthStore = {
    userKey: 'okk-user',
    preferenceKey: 'okk-pref',
    tokenKey: 'token',
    secondVerifyKey: 'secvf',
    // tradeIdKey: 'MyTradeId', //用服务端的key
    //token更新频率
    tokenInterval: "development" === process.env.NODE_ENV ? 60000 : 60000,
    uidKey: 'uid',
    channelKey: 'chn',
    wsTokenTimer: 0,
    AuthMap:null,
    SecurityData:null,
    futTradeModel: null,
    cfdTradeModel:null,
    waitingLogin: false,
    favs: null,

    // getTradeIdValue(){
    //     return Cookies.get(this.tradeIdKey);
    // },
    getToken(){
        var tokenData = Cookies.get(this.tokenKey);
        if (tokenData){
            var info = tokenData.split('|');
            return info[0];
        }
    },
    getTokenTime(){
        var tokenData = Cookies.get(this.tokenKey);
        if (tokenData){
            var info = tokenData.split('|');
            return info[1];
        }
    },
    getUid(){
        var userData = GlobalStore.getUserData();
        if (userData && userData.Uid) {
            return userData.Uid;
        }else{
            return Cookies.get(this.uidKey);
        }
    },
    setChannel(channel){
        Cookies.set(this.channelKey, channel);
    },
    getChannel(){
        return Cookies.get(this.channelKey);
    },
    registerFutTrade(model){
        this.futTradeModel = model;
    },
    registerCfdTrade(model){
        this.cfdTradeModel = model;
    },
    // 用 {几个字母}.{4个数字}.t@tdex.com 注册的号码，自动成为测试号
    // 测试号享有自动填充激活码、自动获取激活链接的特权（无需进入邮箱）
    // 比如: tdex.1001.t@tdex.com, tony.1008.t@tdex.com 注册的邮箱自动成为测试号
    isTestAcount(account){
        return /^[a-z]+\.[0-9]{4}\.t@tdex\.com$/i.test(account);
    },
    //// 886 开头的手机号码也是测试号码，享有自动填充手机验证码的特权
    isTestMobile(mobile){
        return /^886[0-9]+/.test(mobile);
    },
    // loadCaptcha: function(listener, winObj){
    //     if (!this.captchaId){
    //         var self = this;
    //         Net.httpRequest("verify/captcha", "", function(data){
    //             if (data.Status == 0) {
    //                 self.captchaId = data.Data.CaptchaId;
    //                 data.src = self.getCaptchaSrc();
    //             }
    //             if (listener) listener(data);
    //         }, winObj);
    //     }else{
    //         var data = {src: this.getCaptchaSrc(true)};
    //         if (listener) listener(data);
    //     }
    // },
    // getCaptchaSrc(isReload){
    //     return conf.HTTP_API_DOMAIN_URL + 'captcha/' + this.captchaId + '.png' + (isReload ? '?reload='+(new Date()).getTime() : '');
    // },
    registerAfter(data){
        var userData = data.Data;
        var Uid = userData.Uid;
        // GlobalStore.setUserData(userData);

        const {Token, Time} = data.Data;
        Cookies.set(this.uidKey, Uid);
        Cookies.set(this.tokenKey, Token+'|'+Time);

        //持久化保存
        store.set(this.userKey+ Uid, userData);
    },
    getRegisterData(){
        var uid = Cookies.get(this.uidKey);
        if (uid){
            var userData = store.get(this.userKey+uid);
            // GlobalStore.setUserData(userData);
            return userData;
        }
    },
    loginedAfter(data, secondVerifyOk){
        Cookies.set(this.secondVerifyKey, secondVerifyOk);

        var userData = data.Data;
        userData.SecondVerify = secondVerifyOk;

        //登录令牌。获得新令牌后，需要每隔 10 分钟调用 user/token 接口更新令牌
        const {Token, Uid, Time, Lang} = userData;
        Cookies.set(this.uidKey, Uid);
        Cookies.set(this.tokenKey, Token+'|'+Time);

        // var myTradeId = Cookies.get(this.tradeIdKey);

        //持久化保存
        store.set(this.userKey+ Uid, userData);

        if (secondVerifyOk){
            Event.dispatch(Event.EventName.LOGIN_SUCCESS);

            GlobalStore.setUserData(userData);

            if (Lang) Intl.setLang(Lang);
        }
    },
    //二次验证
    secondVerifyAfter(params, cb, that){
        var self = this;
        Net.httpRequest("verify/verify", params, (data)=>{
            if (data.Status==0) {
                self.loginedAfter({Data: this.getRegisterData()}, true);
                self.loadAllData();
            }
            if(cb) cb(data);
        }, that);
    },
    //在前端保存个人喜好
    savePreference(key, value){
        var pData = store.get(this.preferenceKey);
        if (!pData){
            pData = {};
        }
        pData[key] = value;
        store.set(this.preferenceKey, pData);
    },
    loadPreference(key, defaultValue){
        var pData = store.get(this.preferenceKey);
        if (pData && pData.hasOwnProperty(key)){
            return pData[key];
        }
        return defaultValue;
    },
    loadUserInfo(cb){
        var self = this;
        Net.httpRequest("user/info", null, (data)=>{
            if (data.Status == 0){
                // Cookies.set(this.tokenKey, data.Data.Token);
                // this.tokenSvrTime = data.Data.Time;
                //AccountModel.updateWalletInfo(data.Data.WalletMap);
                GlobalStore.setUserInfo(data.Data);
                if(cb) cb();
            }
        });
    },
    loadUserFav(callback){
        if (this.favs){
            if (callback) callback(this.favs);
        }else{
            Net.httpRequest("user/favorite", null, (data)=>{
                if (data.Status == 0){
                    this.favs = data.Data.List;
                    if (callback) callback(this.favs);
                }
            });
        }
    },
    addUserFav(codes){
        Net.httpRequest("user/favorite", {List:codes}, (data)=>{
            if (data.Status == 0){
                this.favs = data.Data.List;
            }
        }, this, 'put');
    },
    removeUserFav(codes){
        Net.httpRequest("user/favorite", {List:codes}, (data)=>{
            if (data.Status == 0){
                this.favs = data.Data.List;
            }
        }, this, 'delete');
    },
    loadAllData(){
        this.loadUserInfo();
        // this.loadUserFav();
        AccountModel.init();

        var userData = GlobalStore.getUserData();
        if (userData && userData.Uid) {
            const {Token, Time, Uid} = userData;
            WsMgr.afterLogined(this, Token, Time, Uid);

            this.scheduleUpdateToken();

            WsMgr.on('online', this.onUpdateOnline.bind(this));
            this.loadTradeData();
        }
    },
    loadTradeData(){
        this.loadFutTradeData();
        this.loadCfdTradeData();
    },
    loadFutTradeData(){
        if (this.futTradeModel) this.futTradeModel.loadTradeData();
        else{
            setTimeout(()=>{
                this.loadFutTradeData();
            }, 30);
        }
    },
    loadCfdTradeData(){
        if (this.cfdTradeModel) this.cfdTradeModel.loadTradeData();
        else{
            setTimeout(()=>{
                this.loadCfdTradeData();
            }, 30);
        }
    },
    //需要每隔 10 分钟调用 user/token 接口更新令牌
    scheduleUpdateToken(){
        if (this.wsTokenTimer){
            clearInterval(this.wsTokenTimer);
        }

        var self = this;
        this.wsTokenTimer = setInterval(()=>{
            self.loadUserToken();
        }, this.tokenInterval);
    },
    getTokenInterval(tokenTime){
        var interval = this.tokenInterval - (SysTime.getServerTimeStamp() - tokenTime)*1000;
        return interval;
    },
    //检查token时间是否过期
    checkTokenExpire(){
        var tokenTime = this.getTokenTime();
        if (this.getTokenInterval(tokenTime)<=0){
            return true;
        }
        return false;
    },
    loadUserToken(){
        var self = this;

        // if (!this.checkTokenExpire()){
        //     return;
        // }

        Net.httpRequest("user/token", null, (data)=>{
            if (data.Status == 0){
                var info = data.Data;
                Cookies.set(self.tokenKey, info.Token+'|'+info.Time);

                var userData = GlobalStore.getUserData();
                if (userData && userData.Uid){
                    userData.Token = info.Token;
                    userData.Time = info.Time;
                    userData.SecondVerify = true;

                    store.set(self.userKey+ userData.Uid, userData);

                    WsMgr.afterLogined(this, info.Token, info.Time, userData.Uid);
                }
            }
        });
    },
    userLang(lang){
        // if (!this.checkUserAuth()) return;
        // var userData = GlobalStore.getUserData();
        // if (userData.Lang!=lang){
        Net.httpRequest("user/lang", {Lang:lang}, (data)=>{

        }, this);
        // }
    },
    checkUserAuth(){
        var user = GlobalStore.getUserData();
        if (user && user.Uid && user.Token && user.Activated && user.SecondVerify) return true;
        else{
            var uid = Cookies.get(this.uidKey);
            if (uid){
                var token = this.getToken();
                if (token){
                    var uData = store.get(this.userKey+uid);
                    if (uData){
                        if (uData.Activated && uData.SecondVerify){
                            GlobalStore.setUserData(uData);
                            // WsMgr.on('online', this.onUpdateOnline.bind(this));
                            this.loadAllData();
                            return true;
                        }
                    }
                    // else{
                    //     //正式服跳到模拟服，无法跨域访问storeage, 重新调用登录接口
                    //     var secondVerify = Cookies.get(this.secondVerifyKey);
                    //     if (secondVerify){
                    //         this.fastLogin();
                    //         return true;
                    //     }
                    // }
                }
            }
        }
        return false;
    },
    fastLogin(){
        if (this.waitingLogin) return;
        var self = this;

        this.waitingLogin = true;

        Net.httpRequest("user/jwt", "", (data)=>{
            if (data.Status==0){
                var token = data.Data.Token;

                this.jwtLogin(token, ()=>{
                    self.waitingLogin = false;
                });
            }
        }, this);
    },
    jwtLogin(token, callback){
        Net.httpRequest("user/login", {Type:2, Token:token}, (data)=>{
            if (data.Status == 0){
                var usrData = data.Data;
                if (usrData.Activated) {
                    this.loginedAfter(data, true);
                    this.loadAllData();
                }
                if (callback) callback();
            }
        });
    },
    resetAuth(){
        if (this.wsTokenTimer){
            clearInterval(this.wsTokenTimer);
            this.wsTokenTimer = 0;
        }

        const uid = Cookies.get(this.uidKey);
        if (uid){
            store.remove(this.userKey+ uid);
        }
        GlobalStore.resetUserStore();
        Cookies.remove(this.uidKey);
        // Cookies.remove(this.tradeIdKey);
        Cookies.remove(this.tokenKey);

        // WsMgr.unsubscribeAccount();
        //TODO: ws处理
        WsMgr.logout();
        AccountModel.clearUserData();

        this.favs = null;
        this.SecurityData = null;
        this.AuthMap = null;
    },
    logout(){
        this.shutDown();

        if (process.env.VER_ENV=='desktop'){
            this.redirectLogin();
            return;
        }

        history.replace('/');
    },
    shutDown(){
        Net.httpRequest("user/logout", "");
        this.resetAuth();
    },
    onUpdateOnline(data){
        if (data.Status.indexOf("kick")!=-1){
            //踢下线
            toast(data.Msg || "您已被踢下线", true);

            var self = this;
            setTimeout(()=>{
                self.logout();
            }, 3000);
        }
    },
    redirectLogin(return_to){
        var url = { pathname: '/login' };
        if (return_to){
            url.query = { return_to };
        }
        history.push(url);

        if (typeof(ElectronExt)=='object' && ElectronExt.logout) ElectronExt.logout();
    },
    getHelpCenterUrl(returnTo=""){
        // if (this.checkUserAuth() && process.env.VER_ENV!='desktop'){
        //     var user = GlobalStore.getUserData();
        //     return "/zendesk/login?Uid="+user.Uid+"&Lang="+Intl.getLang()+"&Token="+this.getToken()+"&Time="+this.getTokenTime()+"&ReturnTo="+returnTo
        // }else{
        //     return "/zendesk/login?Lang="+Intl.getLang()+"&ReturnTo="+returnTo
        // }
        return "https://support.tdex.com/hc/"+Intl.getLang();
    },
    helpUrl(lang, type){
        var url = "https://support.tdex.com/hc/"+lang+"/articles/";
        url += lang=='en-us'? "360004898712": "360004898712";
        url += "#"+type;
        return url;
    },
    //登录后的跳转
    logedRedirect(location, path, replace){
        var return_to;
        if (location){
            return_to = location.query.return_to;
        }
        if (return_to){
            if (return_to.indexOf("support")!=-1){
                window.location.href = this.getHelpCenterUrl(return_to);
            }else{
                replace(return_to);
            }
        }else{
            replace(path);
        }
    },
    checkAuthAndRedirect(return_to){
        if (!this.checkUserAuth()){
            this.redirectLogin(return_to);
            return false;
        }
        return true;
    },
    saveSecurityData: function(data){
        this.SecurityData = data.Data;
        this.AuthMap = data.Data.AuthMap || {};
    },
    securityView(listener, winObj){
        var self = this;
        Net.httpRequest('user/securityView', "", function (data) {
            if (data.Status == 0) {
                self.saveSecurityData(data);
            }
            if(listener) listener(data);
        }, winObj);
    },
    // 绑定、解绑 安全验证
    onBindAuthItem(type, item, hadBind, cb){
        var name="", method=hadBind?'delete':undefined;
        if(type=="mobile"){
            name = "user/mobile";

        }else if(type=="google"){
            name = "user/ggauth";
        }
        var that = this;
        Net.httpRequest(name, item, function(data){
            if (data.Status == 0){
                that.refreshUerInfo(cb);

                method ? toast(Intl.lang("Personal.112")):toast(Intl.lang("Personal.111"));
            }
        }, this, method);
    },
    // 刷新 用户信息
    refreshUerInfo(cb){
        this.loadUserInfo(()=>{
            var userInfo = GlobalStore.getUserInfo();
            if(cb) cb(userInfo);
        });
    }

};

export default AuthStore;
