import React from 'react';
import PureComponent from '../core/PureComponent';
import Intl from "../intl";

import GlobalStore from '../stores';
//import Cookies from '../utils/cookie'
import AuthModel from '../model/auth';
import QRCode from 'qrcode.react';
import { DOWNLOAD_LINK } from '../config';

class Footer extends PureComponent {
    constructor(props) {
        super(props);

        this.appLink = window.location.origin + "/appdownload?welcome=qrCode";
        this.state = {
            userData: {Uid:0},
            showApp:false
        }
    }
    componentDidUpdate(){
        this.getUserData();
    }
    getUserData(){
        var user = this.state.userData;
        var info = GlobalStore.getUserInfo();

        if(info.Uid != user.Uid){
            this.setState({userData: info});
        }
    }
    turnToHelper(){
        return AuthModel.getHelpCenterUrl();
    }
    requestsNew(){
        let helpUrl = AuthModel.getHelpCenterUrl()+"/requests/new";
        return helpUrl;
    }
    changeLangue(lang){
        if (lang && lang!=Intl.getLang()){
            Intl.setLang(lang);
        }
    }


    render() {
        const helpLink = this.turnToHelper(), requestsLink = this.requestsNew();
        const Lang = Intl.getLang();
        const paperUrl = Lang === 'zh-cn' ? 'https://static-1257080242.cos.ap-hongkong.myqcloud.com/book/TDExWhitePaper2.0.pdf'
            : 'https://static-1257080242.cos.ap-hongkong.myqcloud.com/book/TDEx_White_Paper2.0.pdf';
        return (
            <div className="footer m-hide">
                <div>
                    <div className={"footer-left "+Lang}>
                        <ul>
                            <li className="footer-left-title">{Intl.lang("connect.1_4")}</li>
                            <li><a href={paperUrl} target="_blank">{Intl.lang("Footer.WhitePaper")}</a></li>
                            <li><a href={'https://support.tdex.com/hc/' + Lang + '/categories/115000409411'} target="_blank">{Intl.lang("Footer.NewsRelease")}</a></li>
                        </ul>
                        <ul>
                            <li className="footer-left-title">{Intl.lang("Footer.serviceSupport")}</li>
                            <li><a href="https://www.tdex.com/doc/restapi/" target="_blank">{Intl.lang("Footer.103")}</a></li>
                            <li><a href="https://www.tdex.com/doc/wsapi/" target="_blank">{Intl.lang("Footer.doc.wsapi")}</a></li>
                            <li><a href={helpLink} target="_blank">{Intl.lang("NavBar.helper")}</a></li>
                        </ul>
                        <ul>
                            <li className="footer-left-title">{Intl.lang("Footer.ConnectUS")}</li>
                            <li><a href={requestsLink} target="_blank">{Intl.lang("Footer.requests")}</a></li>
                            <li><a href="https://t.me/TDEx_com" target="_blank">{Intl.lang("Footer.channel.cn")}</a></li>
                            <li><a href="https://t.me/TDEx_comENG" target="_blank">{Intl.lang("Footer.channel.en")}</a></li>
                            <li><a href="https://t.me/TDEx_API" target="_blank">{Intl.lang("Footer.channel.api")}</a></li>
                        </ul>
                        <ul>
                            <li className="footer-left-title">{Intl.lang("Footer.download")}</li>
                            <li>
                                <a className="home-footer-a" href="javascript:;">
                                    <span>{Intl.lang('home.download.client.2', Intl.lang("new.home.client.3"))}</span>
                                    <div className="home-footer-qr" style={{width: 100,borderRadius: 6,lineHeight: "26px",padding: 10,top: -133,color:"#17181b",left: 0}}>
                                        {/*<div className="tc">
                                            <div>{Intl.lang("new.home.online")}</div>
                                            <div>{Intl.lang("scoreRew.please_wait")}</div>
                                        </div>*/}
                                        <QRCode value={this.appLink} size={100} />
                                    </div>
                                </a>
                            </li>
                            <li>
                                <a className="home-footer-a" href="javascript:;">
                                    <span>{Intl.lang('home.download.client.2', Intl.lang("new.home.client.5"))}</span>
                                    <div className="home-footer-qr" style={{width: 100,borderRadius: 6,lineHeight: "26px",padding: 10,top: -133,color:"#17181b", left: 0}}>
                                        {/*<div className="tc">*/}
                                            {/*<div>{Intl.lang("new.home.online")}</div>*/}
                                            {/*<div>{Intl.lang("scoreRew.please_wait")}</div>*/}
                                        {/*</div>*/}
                                        <QRCode value={this.appLink} size={100} />
                                    </div>
                                </a>
                            </li>
                            <li><a href={DOWNLOAD_LINK.MAC}><p>{Intl.lang("home.download.client.3")}</p></a></li>
                            <li><a href={DOWNLOAD_LINK.WINDOW}><p>{Intl.lang("home.download.client.4")}</p></a></li>
                        </ul>
                    </div>
                    <div className="footer-right">
                        <div className={"footer-right-logo "+Intl.getLang()}>
                            {Intl.lang('AdvBox.100')}
                        </div>
                        <div className="footer-right-icon">
                            <a href="https://t.me/tdexcom" target="_blank" title={Intl.lang("Footer.telegram")}><i className="iconfont icon-telegram"></i></a>
                            <a href="https://twitter.com/TDEx_CEO" target="_blank" title={Intl.lang("Footer.twitter.ceo")}><i className="iconfont icon-twitter"></i></a>
                            <a href="https://weibo.com/u/6505859926?is_hot=1" target="_blank"><i className="iconfont icon-sina"></i></a>
                            {/*<i className="iconfont icon-facebook"></i>*/}
                        </div>
                        {/*<div className="footer-right-lang">*/}
                            {/*<span onClick={this.changeLangue.bind(this, 'en-us')}>ENGLISH</span>*/}
                            {/*<span onClick={this.changeLangue.bind(this, 'zh-cn')}>简体中文</span>*/}
                        {/*</div>*/}
                        <p className="footer-right-lang-p">{Intl.lang("Footer.109")}</p>
                    </div>
                </div>
                <div className="footer-bottom"></div>
            </div>
        );
    }
}
export default Footer;
