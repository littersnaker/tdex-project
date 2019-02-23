import React from 'react';
import ReactDom from 'react-dom';

// import ReactTooltip from 'react-tooltip'

import PureComponent from '../core/PureComponent'
import connectToStore from '../core/connect-to-store';

import Header from '../components/Header';
// import HeaderUserInfo from '../components/HeaderUserInfo';
import Footer from '../components/Footer';
import ErrorBoundary from '../components/ErrorBoundary';
// import BrowserSupport from '../components/BrowserSupport';

import GlobalStore from '../stores';
//import {isEmptyObject} from "../utils/util"
import AuthModel from '../model/auth';
import AppModel from '../app';
import Support from '../components/Support';
import Intl from '../intl';
import Notification from '../utils/notification';
import Chat from './Chat';
import {IS_DEMO_PATH} from '../config'
import { isMobile, getParameterByName } from '../utils/util';
import PopDialog from  '../utils/popDialog'
import SimulateMask from '../components/SimulateMask';

import Event from '../core/event';

let _hmt = window._hmt;
export class App extends PureComponent {
    constructor(props){
        super(props);

        this.chatDomId = 'chat_root';
        this.isMobile = isMobile();

        var isLogined = AuthModel.checkUserAuth();
        this.inApp = this.checkInAppWebview(isLogined);
        //推广的渠道
        this.channel = props.location.query.channel;

        this.state = {
            slang : Intl.getLang()
        }
    }
    //获取在手机app内的信息
    checkInAppWebview(isLogined){
        var device = getParameterByName("device");
        if (device){
            if (!isLogined){
                var token = getParameterByName("apptoken");
                if (token){
                    AuthModel.jwtLogin(token);
                }
            }
        }
        return device;
    }
    componentWillMount() {
        //刷新界面时重新加载用户信息
        AuthModel.checkUserAuth();

        Event.addListener(Event.EventName.LOGIN_SUCCESS, this.onLoginSucess.bind(this), this);
        Event.addListener(Event.EventName.LANG_SELECT, this.onChangeLangue.bind(this), this);
        if(this.isMobile){
            document.body.style.height = window.innerHeight+"px";  //console.log("ismobile");
            window.isMobile = true;
        }
        //cookie保存渠道信息
        if (this.channel){
            AuthModel.setChannel(this.channel);
        }
        // activity
        Event.addListener(Event.EventName.SIMULATE_AWARD, this.onUserNote.bind(this), this);
    }
    componentDidMount() {
        Notification.instance();

        Event.setTimer(()=>{
            this.delayInit();
            //this.onUserNote();
            // this.popVipVoucher();
        }, 500, this, true);
    }
    componentWillReceiveProps(nextProps){
        console.log(nextProps.location.pathname);

        Event.setTimer(()=>{
            this.delayInit();
        }, 500, this, true);

        // 添加百度监控
        if (_hmt) _hmt.push(['_trackPageview', nextProps.location.pathname]);

        // google 跟踪
        if (gtag) gtag('config', 'UA-130499910-1');
    }

    onLoginSucess(){
        this.popVipVoucher();
    }

    onUserNote(){
        Event.setTimer(()=>{
            //const {location} = this.props;
            //if(location.pathname.indexOf('activities')==-1){
                let param = {type:'receive', title:Intl.lang("activity.ActivityTrading.popTxt2_3"), btnMsg:Intl.lang("activity.ActivityTrading.popTxt2_2"), url:"/trade"};
                PopDialog.open(<SimulateMask {...param} />, 'simulate_panel');
            //}
        }, 500, this, true);

    }
    popVipVoucher(){
        Event.setTimer(()=>{
            const {uInfo} = this.props;
            if (uInfo.AccountId){
                if(uInfo.Items){
                    PopDialog.open(<SimulateMask mode="vip3" items={uInfo.Items}/>, 'simulate_panel');
                }
            }else{
                this.popVipVoucher();
            }
        }, 500, this, true);
    }
    onChangeLangue(lang){
        this.setState({slang:lang}); // console.log('slang=>', lang);
        AuthModel.userLang(lang);

        this.delayInit();
    }
    checkPathName(pathName){
        if(pathName.indexOf('activate')!=-1 || pathName.indexOf('register')!=-1 || pathName.indexOf('login')!=-1 || pathName.indexOf('verify')!=-1){
            return true;
        }
        return false;
    }
    checkOpenChat(){
        if (IS_DEMO_PATH) return false;

        var reg = new RegExp("/|home|login|register|ico|404|emailVerification|activate|verify|forgotPassword|forget|subscription|icoHistory|minetrade|minelogs", 'gi');
        if (!reg.test(location.pathname)) return true;

        return false;
    }
    //延时加载聊天,否则会阻塞其他操作
    delayInit(){
        const isActivities = location.pathname.indexOf('activities')!=-1;
        if(this.isMobile || isActivities) return false;
        if (this.checkOpenChat()){
            const {user, uInfo} = this.props;

            ReactDom.render(
                <Chat user={user} uInfo={uInfo} isTrade={true} key="chat"/>,
                document.getElementById(this.chatDomId)
            );
        }
    }

    render() {
        const {children, user, uInfo, location} = this.props;

        let childs = React.Children.map(children, child => {
            return React.cloneElement(child, {
                user,
                uInfo,
                isMobile:this.isMobile,
                isActivity: false,
                inApp: this.inApp
            })
        });

        AppModel.setCurrentLocation(location);

        const isExpert = location.pathname.indexOf('trade')!=-1 || location.pathname.indexOf('exchange')!=-1 || location.pathname.indexOf('minelogs')!=-1 || location.pathname.indexOf('cfd')!=-1;
        //const isHome = location.pathname.indexOf('home')!=-1;
        const isHelper = location.pathname.indexOf('helper')!=-1;
        const isActivities = location.pathname.indexOf('activities')!=-1;

        let isDownLoad = false;
        if(location.pathname.indexOf('appdownload')!=-1 && location.query["welcome"]){
            isDownLoad = true;
        }
        //const notfound = this.check404(children.props);
        //if(notfound){
        //    return false;
        //}

        const nofind = location.pathname.indexOf('404')!=-1;
        //const isRegister = location.pathname.indexOf('register')!=-1;
        window.IS_LOCAL = !IS_DEMO_PATH;
        if(IS_DEMO_PATH){
            // 限制其他 router 跳转
            if(isExpert){

            }else{
                console.log("No Find This Router!");
                return (
                    <div></div>
                )
            }
        }
        childs.push(<div id={this.chatDomId} key="chat"></div>);

        return (
            (isHelper || nofind || isDownLoad || isActivities) ?
                <ErrorBoundary>{childs}</ErrorBoundary>
                :
            !isExpert ? <ErrorBoundary>
                {!this.inApp && <Header isMobile={this.isMobile} user={user} uInfo={uInfo} />}
                 {childs}
                {!this.inApp && <Support />}
                {!this.inApp && <Footer />}
            </ErrorBoundary>
                :
                <ErrorBoundary>
                    {childs}
                </ErrorBoundary>
        )
    }
}

export default connectToStore(GlobalStore.getUserStore(), false)(App);
