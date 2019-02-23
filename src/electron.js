(function() {
    //清理掉之前用到的保存讯息的localStorage，以免超出大小
    try{
        if (window.localStorage){
            var lStorage = window.localStorage;
            for(var i=0;i<lStorage.length;i++){
                var key=lStorage.key(i);
                if (key.indexOf("tdex_msg_")!=-1){
                    lStorage.removeItem(key);
                }
            }
        }
    }catch (e) {
        console.log(e);
    }
})();

import React from 'react';
import ReactDOM from 'react-dom';

import { Router } from 'react-router';

import history from './core/history';

// import("expose-loader?$!jquery");

import routes from './electron_routes';

import App from './app';

import Event from './core/event';
//注册
import Auth from './model/auth';
if (typeof(ElectronExt)=='object' && ElectronExt.registerModel){
    const Version = {
        message(data){
            Event.dispatch(Event.EventName.VERSION_UPDATE, data[0]);
        }
    };
    ElectronExt.registerModel('version', Version);
    ElectronExt.registerModel('auth', Auth);
}

//css
import './iconfont/iconfont.css';//图标
import './css/companent.css';//
import './css/style.css';//主样式
// import "./css/intlTelInput.css";//TelPhone插件
// import './css/home.css';//首页
import './css/login-register.css';//注册登陆
// import './css/personal.css';//个人中心
// import './less/minetrade.less';//交易挖矿
// import './css/trading-contest.css';//活动
// import './css/subscription.css';//ICO组件
import './css/common.css';//公共样式
import './css/user-modify-verify.css';//绑定验证
import './css/verify.css';//二次验证
// import './css/invite.css';//经纪人系统
import './css/footer.css';//底部
import './css/header.css';//头部
// import './css/home-swiper.css';//轮播图
import './css/spot-trading.css';// 现货
import './css/trading-contest-exchange.css'; //新版cfd交易

window.IS_LOCAL = true;

const render = () => {
    ReactDOM.render(<Router history={history} routes={routes} />, document.getElementById('root'));
};

App.init(render);


