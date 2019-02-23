import React from 'react';
import ReactDom from 'react-dom';

// import ReactTooltip from 'react-tooltip'

import PureComponent from '../core/PureComponent'
import connectToStore from '../core/connect-to-store';

import Header from '../components/Header';
import HeaderUserInfo from '../components/HeaderUserInfo';
import Footer from '../components/Footer';
import ErrorBoundary from '../components/ErrorBoundary';
// import BrowserSupport from '../components/BrowserSupport';

import GlobalStore from '../stores';
//import {isEmptyObject} from "../utils/util"
import AuthModel from '../model/auth';
import AppModel from '../app';

import Intl from '../intl';
import Notification from '../utils/notification';
import Chat from './Chat';
// import {IS_DEMO_PATH} from '../config'

import Event from '../core/event';

// let _hmt = window._hmt;
export class App extends PureComponent {
    constructor(props){
        super(props);

        this.chatDomId = 'chat_root';

        this.state = {
            slang : Intl.getLang()
        }
    }
    componentWillMount() {
        //刷新界面时重新加载用户信息
        AuthModel.checkUserAuth();

        Event.addListener(Event.EventName.LANG_SELECT, this.onChangeLangue.bind(this), this);
    }
    componentDidMount() {
        Notification.instance();

        Event.setTimer(()=>{
            this.delayInit();
        }, 500, this, true);
    }
    componentWillReceiveProps(nextProps){
        console.log(nextProps.location.pathname);

        Event.setTimer(()=>{
            this.delayInit();
        }, 500, this, true);

        // 添加百度监控
        // if (_hmt) _hmt.push(['_trackPageview', nextProps.location.pathname]);
    }
    onChangeLangue(lang){
        this.setState({slang:lang}); // console.log('slang=>', lang);
        AuthModel.userLang(lang);

        this.delayInit();
    }
    checkOpenChat(){
        var hash = location.hash;
        if (hash == '#/') return false;
        var reg = new RegExp("home|login|register|ico|404|emailVerification|activate|verify|forgotPassword|forget|subscription|icoHistory", 'gi');
        if (!reg.test(location.hash)) return true;

        return false;
    }
    //延时加载聊天,否则会阻塞其他操作
    delayInit(){
        // if (this.checkOpenChat()){
        //     const {user, uInfo} = this.props;
        //     const isExpert = location.hash.indexOf('trade')!=-1;
        //
        //     ReactDom.render(
        //         <Chat user={user} uInfo={uInfo} isTrade={isExpert} key="chat"/>,
        //         document.getElementById(this.chatDomId)
        //     );
        // }
    }

    render() {
        const {children, user, uInfo, location} = this.props;

        let childs = React.Children.map(children, child => {
            return React.cloneElement(child, {
                user,
                uInfo
            })
        });

        AppModel.setCurrentLocation(location);

        const isExpert = location.hash.indexOf('trade')!=-1;

        const nofind = location.hash.indexOf('404')!=-1;

        if (this.checkOpenChat()){
            childs.push(<div id={this.chatDomId} key="chat"></div>);
        }

        return (
            nofind?
                <ErrorBoundary>{childs}</ErrorBoundary>
                :
                    !isExpert ? <ErrorBoundary>
                            {childs}
                            {/*<ReactTooltip className="rt_tooltip"/>*/}
                        </ErrorBoundary>
                        :
                        <ErrorBoundary>
                            {childs}
                            {/*<ReactTooltip className="rt_tooltip"/>*/}
                        </ErrorBoundary>
        )
    }
}

export default connectToStore(GlobalStore.getUserStore(), false)(App);
