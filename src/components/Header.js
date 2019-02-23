import Intl from '../intl';
import React from 'react';
import PureComponent from "../core/PureComponent";
import history from '../core/history';
import { Link } from 'react-router';
import Net from '../net/net';

import AuthModel from '../model/auth';
import MobileMunu from './MobileMenu';
import {isMobile} from "../utils/util";
// import TradeMgr from "../model/trade-mgr";
import Event from '../core/event';
import {IS_MINING_OPEN, IS_SIMULATE_TRADING, IS_ENGINE_TRADING, IS_CLOSE_EXCHANGE} from "../config";
import MessageBox from './HeaderMessage'

class Header extends PureComponent {
    constructor(props) {
        super(props);
        this.isMobile = isMobile();
        this.path = window.location.pathname;
        this.loadMessage = false;
        this.state = {
            showPersonal: false,
            showAsset: false
        }
    }

    componentWillMount() {
        Event.addListener(Event.EventName.PRODUCT_UPDATE, this.reload.bind(this), this);
    }

    reload(){
        this.forceUpdate();
    }

    componentDidMount(){
        if(this.path == "/"){
            this.changeHeaderbg();
        }
    }
    componentWillReceiveProps(nextProps){
        if(!this.scrollRun && window.location.pathname == "/"){
            $(window).off("scroll");

            this.changeHeaderbg();
        }else if(this.scrollRun && window.location.pathname != "/"){
            $(window).off("scroll");
            this.scrollRun = false;
        }
    }
    changeHeaderbg(){
        $(window).scroll(function () {
            var stop = document.documentElement.scrollTop || document.body.scrollTop;
            if(stop<=74){
                document.getElementById("header").className = "header-top";
            }else if(stop>74){
                document.getElementById("header").className = "header-down";
            }
        });
        this.scrollRun = true;
    }

    componentWillUnmount(){
        $(window).off("scroll");
        super.componentWillUnmount();
    }

    showPersonal(type) {
        this.setState({showPersonal: type});
    }

    showAsset(type) {
        this.setState({showAsset: type});
    }

    goHome(){
        history.push('/');
    }
    logout(evt){
        evt.preventDefault();
        AuthModel.logout();
    }

    turnToHelper(){
        return AuthModel.getHelpCenterUrl();
    }
    render() {
        const { showPersonal, showAsset, messageData, newMessage } = this.state, {user, uInfo, isExpert} = this.props;
        const isAuth = user && user.Uid;
        const pathName = window.location.pathname;

        // var fCodes = TradeMgr.getTypeCodes('fut');
        // var sCodes = TradeMgr.getTypeCodes('spot');
        //
        // var fcode = fCodes && fCodes[0] ? fCodes[0] : "BTCUSD";
        // var scode = sCodes && sCodes[0] ? sCodes[0] : "TDBTC";

        var loginPath;
        if (pathName.indexOf('/login')==-1 && pathName.indexOf('/register')==-1
            && pathName.indexOf('/404')==-1 && pathName.indexOf('/activate')==-1
            && pathName.indexOf('/emailVerification')==-1 && pathName.indexOf('verify')==-1
            && pathName.indexOf('/forgotPassword')==-1 && pathName.indexOf('/forget')==-1){
            loginPath = {
                pathname: '/login',
                query: {return_to: pathName}
            };
        }else{
            loginPath = {
                pathname: '/login'
            };
        }

        return (
        !this.isMobile ?
            <div id="header" className={"m-hide "+(pathName == "/"?"header-top":"header-down")} style={isExpert?{background:"#191a1e",height: 60}:null}>
                <ul className="header-left">
                    <li>
                        <div className="header-logo-tdex" onClick={this.goHome.bind(this)}></div>
                    </li>
                    <li><Link to={'/cfd'} className={pathName.indexOf('/cfd')!=-1 ? "active" : null}>{Intl.lang('Partner.text.64')}</Link></li>
                    <li><Link to={'/trade'} className={pathName.indexOf('/trade')!=-1 ? "active" : null}>{Intl.lang('fut.type.7')}</Link></li>
                    {!IS_CLOSE_EXCHANGE && <li><Link to={'/exchange'} className={pathName.indexOf('/exchange')!=-1 ? "active" : null}>{Intl.lang('new.home.header.2')}</Link></li>}

                    {IS_SIMULATE_TRADING &&<li><Link to={'/activities/simulatetrade'} className={pathName == '/activities/simulatetrade' ? "active" : null}>{Intl.lang('new.home.header.3')}</Link></li>}
                    {!IS_ENGINE_TRADING && <li><Link to={'/partner'} className={pathName == '/partner' ? "active" : null}>{Intl.lang('Personal.super.text')}</Link></li>}
                    {/*{!IS_ENGINE_TRADING && <li><Link to={'/activitycenter'} className={pathName == '/activitycenter' ? "active" : null}>{Intl.lang('activity.center')}</Link></li>}*/}

                    {/*!IS_ENGINE_TRADING && <li onMouseOver={this.showActivity.bind(this, true)} onMouseLeave={this.showActivity.bind(this, false)}>
                        <a className={'activeList '+((pathName == '/invite') || (pathName == '/activitycenter') ? "active" : null)}>
                            {Intl.lang('activity.center')}
                            <i className={"iconfont "+(showActivity ? 'icon-shouqi': 'icon-xiala')}></i>
                        </a>
                        {showActivity && <div className="activebox">
                            <p><Link to={'/invite'}>{Intl.lang('new.home.header.4')}</Link></p>
                            <p><Link to={'/activitycenter'}>{Intl.lang('new.home.header.5')}</Link></p>
                        </div>}
                    </li>*/}
                    {IS_MINING_OPEN&&<li><Link to={'/mining'} className={pathName == '/mining' ? "active" : null}>{Intl.lang('new.home.header.6')}</Link></li>}
                    {/*!IS_ENGINE_TRADING && <li><a href="https://demo.tdex.com/activities/activityTrading" target="_blank"><i className="iconfont icon-hot yellow fs18"></i>{Intl.lang("demo.trade.comp")}</a></li>*/}
                </ul>
                <ul className="header-right">
                    {isAuth && <li onMouseOver={this.showAsset.bind(this, true)} onMouseLeave={this.showAsset.bind(this, false)}>
                        <a className={'activeList ' + (
                            (pathName == '/asset') ||
                            (pathName == '/recharge') ||
                            (pathName == '/withdrawals') ||
                            (pathName == '/walletTransfer') ||
                            (pathName == '/transfer') ? "active" : null)}>
                            {Intl.lang('Personal.asset.text')}
                            <i className={"iconfont " + (showAsset ? 'icon-shouqi' : 'icon-xiala')} />
                        </a>
                        {showAsset && <div className={"activebox show-asset " + Intl.getLang()}>
                            <p><Link to="/asset">{Intl.lang('Personal.asset.more')}</Link></p>
                            <p><Link to="/recharge">{Intl.lang("account.1_2")}</Link></p>
                            <p><Link to="/withdrawals">{Intl.lang("account.1_3")}</Link></p>
                            <p><Link to="/walletTransfer">{Intl.lang('Personal.walletLogType3')}</Link></p>
                            <p><Link to="/transfer">{Intl.lang('Asset.102')}</Link></p>
                            <p><Link to="/personal/billlog">{Intl.lang('Personal.billLog')}</Link></p>
                        </div>}
                    </li>}
                    {!isAuth &&<li><Link to={loginPath} className={pathName == '/login' ? "active" : null}>{Intl.lang('LoginBox.100')}</Link></li>}
                    {!isAuth ? <li><Link to="/register" className={pathName == '/register' ? "active" : null}>{Intl.lang('header.1_10')}</Link></li>
                    : <li onMouseOver={this.showPersonal.bind(this, true)} onMouseLeave={this.showPersonal.bind(this, false)}>
                        <a className={'activeList ' + (
                            (pathName == '/personal') ||
                            (pathName == '/personal/viprights') ||
                            (pathName == '/personal/securitysetting') ||
                            (pathName == '/api') ||
                            (pathName == '/invite') ? "active" : null)}>
                            {uInfo.Email}
                            <i className={"iconfont " + (showPersonal ? 'icon-shouqi' : 'icon-xiala')} />
                        </a>
                        {showPersonal && <div className={"activebox show-asset " + Intl.getLang()}>
                            <p><Link to="/personal">{Intl.lang('NavBar.104')}</Link></p>
                            <p><Link to="/personal/viprights">{Intl.lang('Personal.asset.grade')}</Link></p>
                            <p><Link to="/personal/securitysetting">{Intl.lang('Personal.SecuritySetting')}</Link></p>
                            <p><Link to="/api">{Intl.lang('personal.api')}</Link></p>
                            <p><Link to="/invite">{Intl.lang('new.home.header.4')}</Link></p>
                            <p><a href="javascript:;" onClick={this.logout.bind(this)}>{Intl.lang("header.1_2")}</a></p>
                        </div>}
                    </li>}

                    <MessageBox uInfo={uInfo} />
                    <li>
                        <Langues/>
                    </li>
                </ul>
            </div>
            :(pathName == '/invite' || pathName == '/appdownload')? null
            :<MobileMunu />
        );
    }
}

export default Header;

class Langues extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            changeLang: false,
            curLang:Intl.getLang()
        }
    }
    showLang(type) {
        this.setState({changeLang: type});
    }
    changeLangue(type, has){
        if (!has) return ;
        if (type && type!=Intl.getLang()){
            Intl.setLang(type);
            this.setState({curLang:type});
        }
    }
    getLangData(){
        let curLang = Intl.getLang();
        const langList = [
            {name: 'English', type: 'en-us', has: false},
            {name: '简体中文', type: 'zh-cn', has: false},
            {name: '繁体中文', type: 'zh-tw', has: false},
            {name: '日本語', type: 'ja-jp', has: false},
            {name: '한국어', type: 'ko-kr', has: false},
            {name: 'Français', type: 'fr-fr', has: false},
            {name: 'Español', type: 'es-es', has: false},
            {name: 'Português', type: 'pt-pt', has: false},
            {name: 'Pусский', type: 'ru-ru', has: false},
            {name: 'Türkiye ', type: 'tr-tr', has: false}
        ];
        langList.forEach((v)=> v.has = Intl.supports.indexOf(v.type)!=-1);
        let curLangInfo = langList[0];
        if(curLang){
            for(var i in langList){
                if(langList[i].type==curLang){
                    curLangInfo = langList[i];
                    break;
                }
            }
        }
        return [langList, curLangInfo];
    }
    render(){
        const { changeLang } = this.state;

        const langData = this.getLangData();
        const langList = langData[0], langTxt = langData[1];

        return (
            <div onMouseOver={this.showLang.bind(this, true)} onMouseLeave={this.showLang.bind(this, false)}>
                <div className="change-lang">
                    <span className={"change-lang-img flag-"+langTxt.type}></span>
                    <span>{langTxt.name}</span>
                    <span className={"iconfont "+(changeLang ? 'icon-shouqi': 'icon-xiala')}></span>
                </div>
                {changeLang && <div className="change-lang-list">
                    <ul>
                        {langList && langList.map((item, i) => {
                            return <li key={i} onClick={this.changeLangue.bind(this, item.type, item.has)}  className={"change-lang " + (!item.has ? 'no-active' : null)}>
                                <span className={"change-lang-img flag-" + item.type}></span><span>{item.name}</span>
                            </li>
                        })}
                    </ul>
                </div>}
            </div>
        )
    }
}
