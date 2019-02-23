import Cookies from 'js-cookie';
import store from 'store';
import {IS_ENGINE_TRADING} from '../config';

var CookieUtil;
if ("desktop" !== process.env.VER_ENV) {
    CookieUtil = {
        //正式服、模拟服，桌面版正式服都是production
        get(key){
            return Cookies.get(this._getKey(key), this._getOptions());
        },
        set(key, value){
            Cookies.set(this._getKey(key), value, this._getOptions());
        },
        remove(key){
            Cookies.remove(this._getKey(key), this._getOptions());
        },
        _getKey(key){
            return "production" == process.env.NODE_ENV && process.env.REACT_APP_IS_ENGINE_TRADING!=1 ? key : key+'-test'
        },
        _getOptions() {
            return "production" == process.env.NODE_ENV && process.env.REACT_APP_IS_ENGINE_TRADING!=1 ? {domain: '.tdex.com'} : null
        }
    };
}else{ //桌面版，用的是file:方式访问本地文件，直接用store保存cookie，不能用cookie方式
    CookieUtil = {
        init(){
            this.key = 'tdex-ck';
            this.cookies = store.get(this.key)||{};
            // var url = process.env.REACT_APP_URL_ORIGIN;
            // var domain = url.split("://")[1];
            // this.options = { domain};
        },
        get(key){
            return this.cookies[key];
            // var val = Cookies.get(key, this.options);
            // console.log(`cookies:${key}|${val}`);
            // return Cookies.get(key, this.options);
        },
        set(key, value){
            // Cookies.set(key, value, this.options);
            this.cookies[key] = value;
            store.set(this.key, this.cookies);
        },
        remove(key){
            // Cookies.remove(key, this.options);
            delete this.cookies[key];
            store.set(this.key, this.cookies);
        },
    };
    CookieUtil.init();
    // console.log("appCookiesExternal");
    // console.log(appCookiesExternal);
    // if (appCookiesExternal){
    //     const cookiesExternal = appCookiesExternal();
    //     CookieUtil = {
    //         cookies:null,
    //         init(){
    //             console.log("cookie init");
    //             this.options = {url: process.env.REACT_APP_URL_ORIGIN};
    //             cookiesExternal.get(this.options, (error, cookies) => {
    //                 if (!error){
    //                     console.log(cookies);
    //                     this.cookies = cookies;
    //                 }else{
    //                     console.error(error);
    //                 }
    //             })
    //         },
    //         get(key){
    //             console.log(key);
    //             console.log(this.cookies);
    //         },
    //         set(key, value){
    //
    //         },
    //         remove(key){
    //
    //         }
    //     };
    //     CookieUtil.init();
    // }
}

export default CookieUtil;
