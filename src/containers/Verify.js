import Intl from '../intl';
import React from 'react';
//import { Link } from 'react-router';
import history from '../core/history';

import PureComponent from '../core/PureComponent'
import Net from '../net/net';
import AuthModel from '../model/auth';
import GlobelStore from '../stores'
import {getErrMsg} from '../utils/common';
import SysTime from '../model/system'
import CountDownBtn from '../components/CountDownBtn';
import Event from '../core/event';
import { isMobile } from '../utils/util';

import {IS_SIMULATE_TRADING} from '../config';
import SimulateMask from '../components/SimulateMask';
import PopDialog from "../utils/popDialog";
import {getStorage} from "../utils/util"

//二次验证 谷歌验证或者手机验证
export default class Verify extends PureComponent{
    constructor(props) {
        super(props);

        //是否桌面版
        this.isDesktop = process.env.VER_ENV=='desktop';
		this.isMobile = isMobile();
        this.focusTimer = null;
        this.Agree = {};
        this.datafor = null;
        this.state = {
            activate:false,
            error: '',
            tab:1,
            auth:{},
            mobileCodeSec:0,
            findAuth: false,
            agree: false,
            lang: Intl.getLang()
        }
    }
    componentWillUnmount(){
        this.closeTimer();
        super.componentWillUnmount();
    }
    componentWillMount() {
        Event.addListener(Event.EventName.LANG_SELECT, this.onChangeLang.bind(this), this);
        Event.addListener(Event.EventName.SIMULATE_AWARD, this.onUserAward.bind(this), this);


        // const Token = this.props.location.query.token;
        // Net.httpRequest("user/activate", {Token}, (obj)=>{
        //     var activate = true;
        //
        //     if (obj.Status==0 || obj.Status==10013){
        //         this.setState({activate, error:''});
        //     }else{
        //         if (obj.Data){
        //             this.setState({activate, error: getErrMsg(obj.Error, obj.Data)});
        //         }else{
        //             this.setState({activate, error:obj.Error});
        //         }
        //     }
        // }, this);

        var userInfo = AuthModel.getRegisterData();
        var uInfo = GlobelStore.getUserInfo();

        if(userInfo) {
            var verify = userInfo.Verify, authType = {}, tab;

            if (verify.length && !uInfo.Email) {        // 登陆后，必须使用uInfo来判断; userInfo.Verify不会实时更新,仅用于登陆
                for (var i in verify) {
                    if (verify[i].Type == "ggauth") {
                        authType.ggauth = true;
                    }
                    if (verify[i].Type == "mobile") {
                        authType.mobile = true;
                    }
                }
                tab = authType.ggauth ? 1 : 2;
                this.setState({auth: authType, tab: tab});
                // this.setFocus(tab);
            }else if(uInfo.GgAuth || uInfo.Mobile){
                if (uInfo.GgAuth) {
                    authType.ggauth = true;
                }
                if (uInfo.Mobile) {
                    authType.mobile = true;
                }
                tab = authType.ggauth ? 1 : 2;
                this.setState({auth: authType, tab: tab});
                // this.setFocus(tab);
            }else{
                history.replace('/login');
            }
        }

        var location = this.props.location;
        if(this.props.datafor){
            this.datafor = this.props.datafor;
        }else if(location && location.query){
            this.datafor = location.query.datafor||"";
        }

    }
    closeTimer(){
        clearTimeout(this.focusTimer);
        this.focusTimer = null;
    }
    setFocus(tab){
        this.closeTimer();
        let id = tab==1?"ggCode":"mobileCode";
        this.focusTimer = setTimeout(()=>this.refs[id].focus(),300);
    }
    onChangeLang(){
        this.setState({lang:Intl.getLang()});
    }
    changeTab(tab){
        this.setState({tab:tab});
        if(tab==1) this.setFocus(tab);
    }
    // 接收子组件返回总数
    changeParentCount(count) {
        this.setState({'mobileCodeSec': count})
    }
    sendVerifyCode(evt){
        this.setFocus(this.state.tab);
        if (evt) evt.preventDefault();

        this.onInputError(true);

        var self = this, data="";
        if(this.datafor){
            data = {"For": this.datafor}
        }

        Net.httpRequest("verify/mobile", data, function(data){
            if (data.Status == 0){
                var retCode = data.Data.Code;
                if (retCode){
                    if (!isNaN(retCode)){
                        self.refs["mobileCode"].value = retCode;
                        self.handdleSubmit();
                    }
                }

                var sec = data.Data.NextAvalibleTime - SysTime.getServerTimeStamp();
                self.setState({'mobileCodeSec': (sec>0 ? sec : 0)});
            }
        }, this);
    }
    handdleSubmit=(e)=> {

        e ? e.preventDefault() : null;

        var type, code;
        // if(this.refs['mobileCode']){
        //     code = this.refs['mobileCode'].value;
        //     type = "mobile";
        // }
        // if(this.refs['ggCode']){
        //     code = this.refs['ggCode'].value;
        //     type = "ggauth"
        // }
        if (this.state.tab === 2) {
            code = this.refs['mobileCode'].value;
            type = "mobile";
        }
        if (this.state.tab === 1) {
            code = this.refs['ggCode'].value;
            type = "ggauth"
        }
        if(!code){
            this.setState({error:'form.error.empty'});
            return false;
        }

        if(this.props.verify=="normal"){      // 普通二次验证
            this.props.onChange({"Type": type, "Code": code});
            return;
        }

        // for login
        var self = this;
        AuthModel.secondVerifyAfter({"Type": type, "Code": code}, function(data){
            if (data.Status == 0){
                if(self.props.path){
                    var result = self.simulateActivity();
                    if (!result){
                        self.props.onChange();
                    }else{
                        PopDialog.close();
                    }
                    // self.simulateActivity();
                }else{
                    if (typeof(ElectronExt)=='object' && ElectronExt.showTradeWindow){ //桌面版
                        ElectronExt.showTradeWindow();
                    }else{
                        var result = self.simulateActivity();
                        // self.simulateActivity();
                        if (!result)AuthModel.logedRedirect(self.props.location, window.IS_LOCAL ? '/personal' : '/trade', history.replace);
                    }
                }
            }else{
                if (data.Data){
                    self.setState({error: getErrMsg(data.Error, data.Data)});
                }else if (data.Error){
                    self.setState({error:data.Error});
                }
            }
        }, this);
    };
    onInputError(error){
        if (error){
            this.setState({error:''});
        }
        return false;
    }
    simulateActivity(){
        if(IS_SIMULATE_TRADING){
            let uInfo = AuthModel.getRegisterData();
            if(uInfo && uInfo.Verify){
                let simulateMoney = getStorage("simulateMoney_"+uInfo.Uid, true);
                if (!simulateMoney){
                    //未绑定手机
                    var bindMobile = uInfo.Verify.filter(v=>v.Type=='mobile');
                    if (!bindMobile.length){
                        history.replace("activities/simulatetrade");
                        return true;
                    }
                }
            }
        }
        return false;
    }
    onUserAward(){
        let param = {type:'building', title:Intl.lang("mimic.panel.trading.20",100), btnMsg:Intl.lang("mimic.panel.trading.21"), url:"/asset"};
        PopDialog.open(<SimulateMask {...param} />, 'simulate_panel');
    }
    checkInput(refName){
        let Val = this.refs[refName].value.replace(/\s+/g,"");
        Val = Number(Val);
        if(Val && /^[0-9]{6}$/.test(Val)){
            console.log("pass=>");
        }
        return false;
    }
    findAuth(){
    	this.setState({findAuth: true});
    }
    resetAuth(index){
        var isCheck = this.refs["reset"+index].checked;
        this.Agree[index] = isCheck;

        if(this.Agree[1] && this.Agree[2]){
            this.setState({agree: true});
        }else{
            this.setState({agree: false});
        }
    }

    isChangeInput = tab => {
        const inputId = tab == 1 ? "ggCode" : "mobileCode";
        const inputValue = this.refs[inputId].value;

        if(/^[0-9]{6}$/.test(inputValue)){
            this.handdleSubmit();
        }
    }

    render(){
        const { error, tab, auth, mobileCodeSec, findAuth, agree,lang} = this.state;
        const { path } = this.props;
        let doubleAuth = false;
        if(auth.ggauth && auth.mobile){
            doubleAuth = true;
        }
        var findAuthStyle = {top:'-65px'};
        if(this.isMobile){
        	findAuthStyle = {left:'0px',top:'-65px'};
        }
        return (
            <div className={path?"normal-head ":"register-contain pos-r"} id="simple_lang" style={!this.isDesktop ? (path && findAuth?findAuthStyle:null):{height:"649px"}}>
                {path && <div className="dialog-close">
                    <i className="iconfont icon-close transit" onClick={()=>this.props.onChange("close")} style={{color:"#888"}}></i>
                </div>}
                {!findAuth ?
                    <div className={path?"verify-pop":"verify"}>
                        <div className="verify-box">
                            <h3>{Intl.lang("bindAuth.1_1")}</h3>
                            <div className="verify-input-box">
                                <form onSubmit={this.handdleSubmit}>
                                    {doubleAuth &&
                                    <div className="verify-tab-text">
                                        <div className={tab==1?"active":null} onClick={()=>this.changeTab(1)}>{Intl.lang("accountSafe.1_22")}</div>
                                        <div className={tab==2?"active":null} onClick={()=>this.changeTab(2)}>{Intl.lang("login.mobile_verify")}</div>
                                    </div>}

                                    <div className="verify-input-text" style={{display: tab == 1 ? 'block' : 'none'}}>
                                        {!doubleAuth &&<p className="verify-code-text">{Intl.lang("login.gg_code")}</p>}
                                        <input type="text" onChange={this.isChangeInput.bind(this, tab)} className={error?"gold-err":""} name="vaildCode" ref="ggCode" placeholder={Intl.lang("BindGoogleAuth.106")} maxLength="6" onKeyUp={(error)=>this.onInputError(error)} autoFocus/>
                                        {error &&<p className="input-error"><i className="iconfont icon-tips"></i>{Intl.lang(error)}</p>}
                                    </div>
                                    <div className="verify-input-text verify-input-phone-text" style={{display: tab == 1 ? 'none' : 'block'}}>
                                        {!doubleAuth &&<p className="verify-code-text">{Intl.lang("login.sms_code")}</p>}
                                        <input type="tel" onChange={this.isChangeInput.bind(this, tab)} className={error?"gold-err":""} name="vaildCode" ref="mobileCode" placeholder={Intl.lang("forgetpw.2_17")} maxLength="6" onKeyUp={(error)=>this.onInputError(error)}/>
                                        <CountDownBtn changeParentCount={this.changeParentCount.bind(this)} onClick={(e)=>this.sendVerifyCode(e)} count={mobileCodeSec}/>
                                        {error &&<p className="input-error"><i className="iconfont icon-tips"></i>{Intl.lang(error)}</p>}
                                    </div>

                                    {(path!="disTips" && !this.isDesktop) &&
                                    <p className="forget-password-text">
                                        <a href="javascript:;" onClick={()=>this.findAuth()}>{tab==1?Intl.lang("login.loss_ggauth"):Intl.lang("SecondVerification.8")}</a>
                                    </p>}

                                    <button type="submit" className="active">{Intl.lang("common.confirm")}</button>
                                </form>

                                {!path && <div className="input-right-text">
                                    <div className="verify-right-bg"></div>
                                </div>}
                            </div>
                        </div>
                    </div>
                    :
                    <div className={path?"verify-pop":"verify"}>
	                    <div className="verify-box">
                            <h3>{tab==1?Intl.lang("SecondVerification.1"):Intl.lang("SecondVerification.2")}</h3>
                            <div className="verify-input-box verify-ph-and-gg">
                                <form>
                                    <div className="verify-ph-gg-flex">
                                        <div className="ph-gg-pic"></div>
                                        <div className="ph-gg-text">{tab==1?Intl.lang("SecondVerification.3"):Intl.lang("SecondVerification.4")}</div>
                                    </div>
                                    <label className="ph-gg-terms">
                                        <span className="terms1"><i className="iconfont icon-dun"></i></span>
                                        {tab==1? <span className="terms2">{Intl.lang("SecondVerification.9")}</span>
                                        :<span className="terms2">{Intl.lang("SecondVerification.5")}</span>}
                                        <span className="terms3"><input className="input-agree" type="checkbox" ref="reset1" onChange={()=>this.resetAuth(1)} /><span></span></span>
                                    </label>
                                    <label className="ph-gg-terms">
                                        <span className="terms1"><i className="iconfont icon-dun"></i></span>
                                        <span className="terms2">{Intl.lang("SecondVerification.6")}</span>
                                        <span className="terms3"><input className="input-agree" type="checkbox" ref="reset2" onChange={()=>this.resetAuth(2)} /><span></span></span>
                                    </label>
                                    {agree ? <a href={"https://support.tdex.com/hc/"+ lang + "/requests/new"} target="_blank">{Intl.lang("SecondVerification.7")}</a>
                                    :<span className="btnDis">{Intl.lang("SecondVerification.7")}</span>}
                                </form>
                                <div className="input-right-text">
                                    <div className="verify-right-bg"></div>
                                </div>
                            </div>
	                    </div>
	                </div>
                }
            </div>
        )
    }
}
