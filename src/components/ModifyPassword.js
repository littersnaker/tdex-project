import Intl from '../intl';
import React from 'react';

import Store from '../core/store';
import connectToStore from '../core/connect-to-store';
import PureComponent from '../core/PureComponent';
import storeTypes from '../core/storetypes';

import Net from '../net/net'
import AuthModel from '../model/auth';
import GlobelStore from '../stores'
import SysTime from '../model/system'
import PopDialog from  '../utils/popDialog'
import  { toast, md5Pwd } from '../utils/common'
import CountDownBtn from '../components/CountDownBtn';
import TradeModel from "../model/spot-trade";
import Valiate from "../utils/valiate";
import Verify from '../containers/Verify'
import '../css/verify.css';
const PwStore = Store({
    tab: 1,
    mobileCodeSec: 0,
    error:''
}, storeTypes.MODIFYPWD);

class ModifyPassword extends PureComponent{
    constructor(props) {
        super(props);

        this.unmount = false;
        this.state = {
        	showPwd:false,
			pwdType:'password'
        }
    }
/*
    changeTab(tab){
        PwStore.cursor().set('tab', tab);
    }
    sendVerifyCode(evt){
        if (evt)evt.preventDefault();

        var self = this;

        PwStore.cursor().set('mobileCodeSec', 0);

        var name = "verify/email";
        Net.httpRequest(name, "", function(data){
            if (data.Status == 0){
                var retCode = data.Data.Code;
                if (retCode){
                    if (!isNaN(retCode)) self.refs["emailCode"].value = retCode;
                }

                var sec = data.Data.NextAvalibleTime - SysTime.getServerTimeStamp();
                PwStore.cursor().set('mobileCodeSec', sec>0 ? sec : 0);
            }
        }, this);
    }
*/
    handleSubmit(event){
        event = event || window.event;
        event.preventDefault();

        //var type = PwStore.cursor().get('tab');
        var data = {};

        //if(type==1){
        //    var emailCode = this.refs["emailCode"].value;
        //    if (!emailCode){
        //        PwStore.cursor().set('error', Intl.lang("BindGoogleAuth.105"));
        //        return;
        //    }
        //    data.VerifyCodes = {4: emailCode};
        //}else{
            var oldPwd = this.refs.old_pwd.value;
            if (!oldPwd){
                PwStore.cursor().set('error', Intl.lang("ModifyPassword.109"));
                return;
            }
            //data.OldPWD = md5Pwd(oldPwd);
        //}
        var newPwd = this.refs.new_pwd.value;
        if (!newPwd){
            PwStore.cursor().set('error', Intl.lang("ModifyPassword.110"));
            return;
        }
        if (!Valiate.password(newPwd)){
            PwStore.cursor().set('error', Intl.lang("error.pwd.match"));
            return;
        }
        var newPwd2 = this.refs.new_pwd2.value;
        if (!newPwd2){
            PwStore.cursor().set('error', Intl.lang("ModifyPassword.111"));
            return;
        }
        if (newPwd != newPwd2){
            PwStore.cursor().set('error', Intl.lang("ModifyPassword.112"));
            return;
        }

        //var userInfo = AuthModel.getRegisterData();
        var uInfo = GlobelStore.getUserInfo();
        if(uInfo.GgAuth || uInfo.Mobile){
            this.popVerify();
        }else{
            this.modifyPWD(data);
        }
    }
    popVerify(){
        PopDialog.open(<Verify path="disTips" verify="normal" onChange={(codeType)=>this.popCallback(codeType)} datafor="password"/>, 'simple_lang');
    }
    popCallback(codeType){
        if(codeType=="close"){
            PopDialog.close("pn_simple_lang");
            return;
        }

        this.modifyPWD(codeType);
    }
    modifyPWD(data){
        var oldPwd = this.refs['old_pwd'].value;
        var newPwd = this.refs['new_pwd'].value;

        data.OldPWD = md5Pwd(oldPwd);
        data.NewPWD = md5Pwd(newPwd);
        var self = this;
        Net.httpRequest("user/password", data, function(data){
            if (data.Status == 0) {
                PopDialog.close("pn_simple_lang");
                toast(Intl.lang("ModifyPassword.113"));
                self.callbackChange();
            }
        }, this);
    }
    callbackChange(){
        setTimeout(()=>{
            if (!this.unmount) AuthModel.logout();
            this.close();
        }, 500);
    }
    close(){
        PopDialog.close();
    }
    componentWillUnmount(){
        this.unmount = true;

        super.componentWillUnmount();
    }
    showPassWord(e){
    	e.stopPropagation();
    	this.setState({showPwd: !this.state.showPwd});
    	this.state.showPwd == true ? this.setState({pwdType:'password'}) : this.setState({pwdType:'text'})
    }
    render(){
        const { tab, error } = this.props, { showPwd ,pwdType } = this.state;
        return(
            <div className="verify-inside-page">
                <div className="verify-box">
                    <h3>{Intl.lang("ModifyPassword.100")}</h3>
                    <div className="verify-input-box">
                        <form onSubmit={e=>this.handleSubmit(e)} autoComplete="off">
                            <div className="verify-input-text">
                                <input type={pwdType} id="old_pwd" ref="old_pwd" name="old_pwd" placeholder={Intl.lang("ModifyPassword.106")} autoComplete="off"/>
                            </div>
                            <div className="verify-input-text">
                                <input type={pwdType} id="new_pwd" ref="new_pwd" name="new_pwd" placeholder={Intl.lang("ModifyPassword.107")} autoComplete="off"/>
                            </div>
                            <div className="verify-input-text">
                                <input type={pwdType} id="new_pwd2" ref="new_pwd2" name="new_pwd2" placeholder={Intl.lang("ModifyPassword.108")} autoComplete="off"/>
                            </div>
                            <div className="inside-error-text">
                                <p className={error?"":"hide"}>{error}</p>
                            </div>
                            <p className="agree-clause-text">
                                <label>
                                    <input className="input-agree light-theme" onChange={(e)=>this.showPassWord(e)} type="checkbox" checked={showPwd}/>
                                    <span></span>
                                    <span>{Intl.lang("register.show_pw")}</span>
                                </label>
                            </p>
                            <button className="active">{Intl.lang("accountSafe.2_167")}</button>
                        </form>
                        <div className="input-right-text">
                            <p>{Intl.lang("BindBank.104")}</p>
                            <p>{Intl.lang("error.pwd.match")}</p>
                            <p>{Intl.lang("ModifyPassword.105")}</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default connectToStore(PwStore)(ModifyPassword);