import Intl from '../intl';
import React from 'react';
import PureComponent from '../core/PureComponent';
import history from "../core/history";
import qrcode from 'jquery-qrcode'

import Net from '../net/net'
import Auth from '../model/auth'
// import GlobelStore from '../stores'
import SysTime from '../model/system'

// import PopDialog from  '../utils/popDialog'
// import { CONST } from "../public/const";
// import CountDownBtn from '../components/CountDownBtn';
import  { toast, md5Pwd } from '../utils/common';
import { isMobile } from "../utils/util";
import '../css/verify.css';

const $ = window.$;
class BindGoogleAuth extends PureComponent{
    constructor(props){
        super(props);
        this.isMobile = isMobile();
        this.state= {
            mobileCodeSec: 0,
            authMap: {},
            UserInfo:this.props.uInfo,
            Secret:""
        }
    }

    componentWillReceiveProps(nextProps) {
        if (!this.props.uInfo.Uid && nextProps.uInfo.Uid){
            this.setState({UserInfo:nextProps.uInfo});

            this.onChangeUserInfo(nextProps.uInfo);
        }
    }

    componentDidMount(){
        this.setInputFocus();
        if (this.state.UserInfo && this.state.UserInfo.Uid){
            this.onChangeUserInfo(this.state.UserInfo);
        }
    }

    onChangeUserInfo(userInfo){
        const hadBind = userInfo.GgAuth?true:false;
        if(!hadBind){
            this.getGoogleSecret();
        }
    }

    getGoogleSecret(){
        var self = this;
        Net.httpRequest("user/ggauth", "", function(data){
            if (data.Status == 0){
                var Secret = data.Data.Secret;
                self.createQrcode(Secret);
                self.setState({Secret:Secret});
            }
        }, this, 'put');
    }
    createQrcode(Secret){
        if(!Secret) return false;

        var uInfo = this.state.UserInfo;
        var type = $.browser.msie ? 'div' : 'canvas';
        $(this.refs['qrcode']).qrcode({
            text: 'otpauth://totp/TDEx.com:' + uInfo.Email + '?secret=' + Secret + "&issuer=TDEx.com",
            width:130,
            height:130,
            size:130,
            render: type
        });
    }
    sendVerifyCode(type, evt){
        if (evt)evt.preventDefault();

        var self = this, data={"For":"bind"};
        var name = "verify/mobile";
        if(type==2){
            name = "verify/email";
        }
        Net.httpRequest(name, data, function(data){
            if (data.Status == 0){
                var retCode = data.Data.Code;
                if (retCode){
                    if (!isNaN(retCode)){
                        self.refs["phoneCode"]? self.refs["phoneCode"].value = retCode : self.refs["emailCode"].value = retCode;
                    }
                }

                var sec = data.Data.NextAvalibleTime - SysTime.getServerTimeStamp();
                self.setState({'mobileCodeSec': sec>0 ? sec : 0});
            }
        }, this);
    }

    handdleSubmit=(e)=> {
        e.preventDefault();

        var loginPw = this.refs['loginPW'].value,
        gCode = this.refs['gg_code'].value;
        if(!gCode){
            toast(Intl.lang("BindGoogleAuth.106"), true);
            return false;
        }else if(!loginPw){
            toast(Intl.lang("Login.106"), 1);
            return false;
        }

        const {UserInfo} = this.state, hadBind = UserInfo.GgAuth?true:false;
        var item = {
            GgAuth: gCode,
            Password: md5Pwd(loginPw)
        };

        if(!hadBind){
            item.Secret = this.state.Secret;
        }
        Auth.onBindAuthItem("google",item, hadBind,(userInfo)=>this.refreshUerInfo(userInfo));
    };
    // 刷新 用户信息
    refreshUerInfo(userInfo){
        //this.setState({UserInfo: userInfo});
        //this.refs["loginPW"].value = "";
        //this.refs["gg_code"].value = "";
        //if(userInfo && userInfo.GgAuth){
        //    this.getGoogleSecret();
        //}
        history.replace("/personal/securitysetting");
    }

    setInputFocus = () => {
        this.refs.loginPW.focus();
    }
    render(){
        var { Secret, UserInfo } = this.state;
        var isBind = UserInfo.GgAuth?true:false;

        return(
            <div className="verify-inside-page">
                <div className="verify-box">
                    <h3>{!isBind?Intl.lang("accountSafe.1_22"):Intl.lang("BindGoogleAuth.107")}</h3>
                    <div className="verify-input-box">
                        <form className="gg-verify-box" onSubmit={this.handdleSubmit} autoComplete="off">
                            {!isBind &&
                            <div className="gg-verify-input">
                                <p>{Intl.lang("BindGoogleAuth.100")}</p>
                                <div className="app-store">
                                    <a className="app-down m-app-down" href="https://itunes.apple.com/us/app/google-authenticator/id388497605?mt=8" target="_blank"><i className="iconfont icon-ios fem125"></i><span className="pdl-10">iOS App Store</span></a>
                                    <a className="app-down m-app-down" href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank"><i className="iconfont icon-gg-pay fem125"></i><span className="pdl-10">Google Play</span></a>
                                </div>
                                <p>{Intl.lang("BindGoogleAuth.101")}</p>
                                <div className="gg-verify-qr">
                                    <div className="gg-verify-qr-code" ref="qrcode"></div>
                                    <div className="gg-verify-qr-text">
                                        <p className="">{Intl.lang("BindGoogleAuth.102")}</p>
                                        <p className="">{Secret}</p>
                                        <p className="">{Intl.lang("BindGoogleAuth.record")}</p>
                                    </div>
                                </div>
                                <p>{Intl.lang("BindGoogleAuth.103")}</p>
                            </div>}

                            <div className={"verify-input-text "+(!isBind? "m-t-10":null) }>
                                <input type="password" ref="loginPW" placeholder={Intl.lang("Login.106")}  autoComplete="new-password" />
                            </div>
                            <div className={"verify-input-text "+(!isBind? "m-t-10":null) }>
                                <input type="text" ref="gg_code" placeholder={Intl.lang("BindGoogleAuth.106")} autoComplete="off"/>
                            </div>
                            <button className="active">{!isBind?Intl.lang("BindGoogleAuth.108"):Intl.lang("BindGoogleAuth.109")}</button>
                        </form>
                        <div className="input-right-text">
                            <p>{Intl.lang("BindBank.104")}</p>
                            {isBind ?
                                <p className="">{Intl.lang("BindGoogleAuth.untie")}</p>
                                :
                                <div>
                                    <p>{Intl.lang("BindGoogleAuth.104")}</p>
                                    <p>{Intl.lang("BindGoogleAuth.wait",7)}</p>
                                </div>
                            }
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}
export default BindGoogleAuth;
