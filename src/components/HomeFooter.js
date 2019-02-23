import Intl from '../intl';
import React from 'react';
import QRCode from 'qrcode.react';
import PureComponent from '../core/PureComponent'
import history from '../core/history';
//import { Link } from 'react-router';
import AuthModel from '../model/auth';
import {toast} from "../utils/common";
import {IS_DEMO_PATH} from '../config';

export default class Footer extends PureComponent {
    constructor(props) {
        super(props);

        this.appLink = window.location.origin + "/appdownload?welcome=qrCode";
        this.state = {}
    }
    turnToHelper(){
        return AuthModel.getHelpCenterUrl();
    }
    turnTo(router){
        if(IS_DEMO_PATH){
            toast(Intl.lang("common.not_open"),true);
        }else{
            history.push(router)
        }
    }

    render(){
    	const helpLink = this.turnToHelper();
        const {style} = this.props;
        return (
            <footer id="footer" style={style} className="m-footer">
                <div className="top">
                    <div className="container">
                        <div className="row hide">
                            <div className="col-xs-12">
                                <ul className="footer-top">
                                    <li className="col-xs-3">
                                        <div className="re">
                                            <a href="javascript:;">{Intl.lang("Footer.106")}</a>
                                        </div>
                                    </li>
                                    <li className="col-xs-3">
                                        <div className="re">
                                            <a href="javascript:;">{Intl.lang("Footer.WhitePaper")}</a>
                                        </div>
                                    </li>
                                    <li className="col-xs-3">
                                        <div className="re">
                                            <a href="javascript:;">{Intl.lang("Footer.ticket")}</a>
                                        </div>
                                    </li>
                                    <li className="col-xs-3">
                                        <div className="re">
                                            <a href="javascript:;">{Intl.lang("Footer.toQQ")}</a>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-sm-4 col-xs-12">
                                <h2 className="block-title foot-main"><span className="logo-bt dis-inb"></span></h2>
                                <div className="tdex-buildin mt-10">
                                    <p>{Intl.lang("Footer.des1", "TDEx")}</p>
                                    <p className="mt-10 hide">{Intl.lang("Footer.des2", "TDEx")}</p>
                                </div>
                            </div>
                            <div className="col-sm-2 col-xs-12">
                                <h2 className="block-title">{Intl.lang("Footer.ConnectUS")}</h2>
                                <div className="phone_number mt-15">
                                    {IS_DEMO_PATH ?
                                        <a href="javascript:;" onClick={()=>this.turnTo("/helper")}><p>{Intl.lang("Footer.ticket")}</p></a>
                                        :
                                        <a href={helpLink} target="_blank"><p>{Intl.lang("Footer.ticket")}</p></a>
                                    }
									<a href="https://t.me/tdexcom" target="_blank"><p>{Intl.lang("Footer.telegram")}</p></a>
	                                <a href="https://t.me/TDEx_comENG" target="_blank"><p>{Intl.lang("Footer.channel.en")}</p></a>
	                                <a href="https://t.me/TDEx_com" target="_blank"><p>{Intl.lang("Footer.channel.cn")}</p></a>
	                                <a href="https://t.me/TDEx_API" target="_blank"><p>{Intl.lang("Footer.channel.api")}</p></a>
	                                <a href="https://twitter.com/TDEx_CEO" target="_blank"><p>{Intl.lang("Footer.twitter.ceo")}</p></a>
                                </div>
                            </div>
                            <div className="col-sm-2 col-xs-12">
                                <h2 className="block-title">API</h2>
                                <div className="phone_number mt-15">
                                    <a href="/doc/restapi/" target="_blank"><p>{Intl.lang("Footer.doc.restapi")}</p></a>
                                    <a href="/doc/wsapi/" target="_blank"><p>{Intl.lang("Footer.doc.wsapi")}</p></a>
                                </div>
                            </div>
                            <div className="col-sm-2 col-xs-12">
                                <h2 className="block-title">{Intl.lang("Footer.Cooperation")}</h2>
                                <div className="phone_number mt-15">
                                    <a href="javascript:;" onClick={()=>this.turnTo("/invite")}><p>{Intl.lang("Footer.invite")}</p></a>
                                    {/*<a href="javascript:;" onClick={()=>this.turnTo("/ico")} target="_blank"><p>{Intl.lang("NavBar.purchase")}</p></a>*/}
                                </div>
                            </div>
                            <div className="col-sm-2 col-xs-12">
                                <h2 className="block-title">{Intl.lang("home.download.client.1")}</h2>
                                <div className="phone_number mt-15">
                                    <a className="home-footer-a" href="javascript:;">
                                        <p>{Intl.lang("home.download.client.2")}</p>
                                        <div className="home-footer-qr">
                                            <QRCode value={this.appLink} size={100} />
                                        </div>
                                    </a>
                                    <a href="https://pc.tdex.com/download/pc-dist/TDEx_setup_0.1.1.dmg"><p>{Intl.lang("home.download.client.3")}</p></a>
                                    <a href="https://pc.tdex.com/download/pc-dist/TDEx_setup_0.1.1.exe"><p>{Intl.lang("home.download.client.4")}</p></a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="buttom">
                    <div className="container">
                        <div className="row">
                            <div className="col-xs-12 important-information">
                                <p style={{paddingTop:15,margin:0}}>{Intl.lang("Footer.109")}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        )
    }
}