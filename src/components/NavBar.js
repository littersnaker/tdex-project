import Intl from '../intl';
import React from 'react';
import ReactDOM from 'react-dom';
import { Link } from 'react-router';

import PureComponent from '../core/PureComponent'
import GlobalStore from '../stores';

import TradeModel from '../model/spot-trade';
//import Event from '../core/event';
import Net from '../net/net';
import Cookies from '../utils/cookie'
import AppDownload from './AppDownload'
import {DropDown,Contrainer} from './DropDown';
import AuthModel from '../model/auth';

import {IS_SIMULATE_TRADING} from "../config";

//const $ = window.$;
class NavBar extends PureComponent {
    constructor(props) {
        super(props);

        this.Lang = Intl.getLang();
        this.state = {
            code: TradeModel.getCurrCode(),
            userData: {Uid: 0}
        }
    }
    componentWillMount(){
        //Event.addListener(Event.EventName.PRODUCT_SELECT, this.onSelectProduct.bind(this), this);
    }
    componentDidUpdate(){
        this.getUserData();
    }
    onSelectProduct(code){
        if (this.state.code != code){
            this.setState({code:code});
        }
    }
    turnToOTC(){
        return false;

        var newTab = window.open('about:blank');    // 必须ajax 前打开，否则拦截
        Net.httpRequest("user/redirect", "", function(data){
            if (data.Status == 0 ){
                newTab.location.href = data.Data;
            }
        }, this);
    }

    getUserData(){
        var user = this.state.userData;
        var info = GlobalStore.getUserInfo();

        if(info.Uid != user.Uid){
            this.setState({userData: info});
        }
    }
    turnToHelper(){
        // var hostUrl = window.location.origin;
        // var userInfo = this.state.userData;
        // var lang = Intl.getLang();
        // var helpUrl = "https://support.tdex.com/hc/"+ lang;
        //
        // if(userInfo && userInfo.Uid){
        //     // var ssid = Cookies.get(this.tradeIdKey).mtid;
        //     var ssid = '';
        //     helpUrl = hostUrl+"/server/login?Uid="+ userInfo.Uid +"&Token="+ userInfo.Token +"&Time="+ userInfo.Time +"&SessionId="+ ssid +"&Language="+ lang;
        // }
        return AuthModel.getHelpCenterUrl();
    }
    downLoadApp(){
        var lang = Intl.getLang();
        if(this.loadApp && this.Lang==lang) return false;

        ReactDOM.render(
            <AppDownload/>,
            document.getElementById('AppDownload')
        );
        this.loadApp = true;
        this.Lang = lang;
    }
    setMenuRef(c){
        this.menuRef = c;
    }
    render() {
        //const {code, userData} = this.state;
        //const helpLink = this.turnToHelper();
        const lang = Intl.getLang();
        return (
            <ul className="navbox pos-a r100 border-l">
                <li className="navbox-sub"><Link to="/asset" activeClassName="current" onlyActiveOnIndex={true}>{Intl.lang("NavBar.103")}</Link>
                    <i className="xia"></i>
                    <ul>
                        <li><Link to="/asset">{Intl.lang("Asset.my_assets")}</Link></li>
                        <li><Link to="/recharge">{Intl.lang("account.1_2")}</Link></li>
                        <li><Link to="/withdrawals">{Intl.lang("account.1_3")}</Link></li>
                        {/*<li><Link to="/exchange">{Intl.lang("Asset.exchange")}</Link></li>*/}
                    </ul>
                </li>
                <li><Link to="/personal" activeClassName="current" onlyActiveOnIndex={true}>{Intl.lang("NavBar.104")}</Link></li>
                {!IS_SIMULATE_TRADING && <li><Link to="/activitycenter" activeClassName="current" onlyActiveOnIndex={true}>{Intl.lang("activity.center")}<i className="iconfont icon-hot"></i></Link></li>}
                <li><a href={lang=="en-us"?"https://support.tdex.com/hc/en-us/categories/115000409411-Announcements":"https://support.tdex.com/hc/zh-cn/categories/115000409411-%E5%85%AC%E5%91%8A%E4%B8%AD%E5%BF%83"} target="_blank">{Intl.lang("navbar.announcements")}</a></li>
                {/*<li><a href={helpLink} target="_blank">{Intl.lang("NavBar.helper")}</a></li>
                <li><Link to="/appdownload" activeClassName="current" onlyActiveOnIndex={true}>{Intl.lang("NavBar.app.dow")}</Link></li>
                <li>
                    <div className="appdownload">
                        <DropDown trigger="click" menuRef={()=>this.menuRef} onClick={this.downLoadApp.bind(this)}><i className="iconfont icon-phone fem125 ver-md"></i><span>{Intl.lang("app.download")}</span><i className="iconfont icon-xiala fem75"></i></DropDown>
                        <Contrainer ref={this.setMenuRef.bind(this)}><div id="AppDownload"></div></Contrainer>
                    </div>
                </li>*/}
            </ul>
        );
    }
}

export default NavBar;