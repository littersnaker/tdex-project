(function() {
    //ios 12 bug fixed
    function buggy() {
        var a = [1, 2];
        return String(a) === String(a.reverse());
    }
    if(!buggy()) return;
    var r = Array.prototype.reverse;
    Array.prototype.reverse = function reverse() {
        if (Array.isArray(this)) this.length = this.length;
        return r.call(this);
    }

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
import routes from './routes';
import App from './app';
import BrowserSupport from './components/BrowserSupport';
import * as Sentry from '@sentry/browser';

//css
import './iconfont/iconfont.css';// 图标
import './css/companent.css';//
import './css/style.css';// 主样式
import "./css/intlTelInput.css";// TelPhone插件
import './css/home.css';// 首页
import './css/login-register.css';// 注册登陆
import './css/personal.css';// 个人中心
import './less/minetrade.less';// 交易挖矿
import './css/trading-contest.css';// 活动
import './css/subscription.css';// ICO组件
import './css/common.css';// 公共样式
import './css/user-modify-verify.css';// 绑定验证
import './css/verify.css';// 二次验证
import './css/invite.css';// 经纪人系统
import './css/footer.css';// 底部
import './css/header.css';// 头部
import './css/home-swiper.css';// 轮播图
import './css/spot-trading.css';// 现货
import './css/contract-online.css';// 合约上线
import './css/luck-draw.css';// 抽奖转盘
import './css/partner.css';// 合伙人
import './css/partner-admin.css';// 合伙人管理中心
import './css/activity.css';// 活动相关
import './css/trading-contest-exchange.css'; //新版cfd交易
import './css/asset.css'; //新版资金管理相关

if ("development" !== process.env.NODE_ENV) {
    Sentry.init({
        dsn: "https://f37d479e951240f9b6645533dab2b512@sentry.io/1371625"
    });
}
/*
const createOnEnter = (callback) => {
    return (nextState, replace, next)=>{
        var _hmt = window._hmt;
        // 添加百度监控
        _hmt.push(['_trackPageview', nextState.location ? nextState.location.pathname: '/']);

        if (callback) {
            callback(nextState, replace, next)
        } else if (next) {
            next();
        }
    };
};

const iterCreate = (input) => {
    input.onEnter = createOnEnter(input.onEnter);
    if (input.childRoutes)
        input.childRoutes.map((info) => {
            iterCreate(info);
        });
};

iterCreate(routes);
*/
const render = (support) => {
    ReactDOM.render((
        support ? <Router history={history} routes={routes}>
        </Router> : <BrowserSupport />
    ), document.getElementById('root'));
};

App.init(render);
