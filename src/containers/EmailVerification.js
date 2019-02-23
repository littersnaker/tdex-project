import Intl from '../intl';
import React from 'react';
import { Link } from 'react-router';
import history from '../core/history';

import PureComponent from '../core/PureComponent'

import Net from '../net/net';
import AuthModel from '../model/auth';
import {getErrMsg, toast, formatStr} from '../utils/common'

export default class EmailVerification extends PureComponent{
    constructor(props) {
        super(props);

        this.isMobile = this.props.isMobile;
        this.sendTimer = null;
        this.timeCount = 120;       // 倒计时间
        this.unitTxt = Intl.lang("trade.price.sec");

        this.state = AuthModel.getRegisterData();
    }
    componentWillMount(){
        if(this.isMobile){
            this.setState({text:Intl.lang("register.emailVerification.resend")});
        }
    }
    componentWillUnmount(){
        clearInterval(this.sendTimer);
    }
    freeTime(){
        if (this.sendTimer){
            clearInterval(this.sendTimer);
        }
        var sec = this.timeCount, self = this;
        this.sendTimer = setInterval(() => {
            sec--;
            if (sec <=0 ){
                clearInterval(self.sendTimer);
                self.sendTimer = 0;
                self.setState({text:Intl.lang("register.emailVerification.resend"), timer:false});
                return;
            }
            self.setState({ text: formatStr(this.unitTxt, sec), timer: true});
        }, 1000);
    }

    activateRegister(){
        const { Email } = this.state;
        var code = this.refs['activateCode'].value;

        if(!Email) return false;
        if(!code || !/^[0-9]{6}$/.test(code)){
            this.setState({error:Intl.lang("activate.input")});
            return false;
        }
        var params = {Email:Email, Code:code};

        Net.httpRequest("user/activate", params, (obj)=>{
            var activate = true;

            if (obj.Status==0 || obj.Status==10013){
                this.userInfo = obj.Data;
                AuthModel.registerAfter(obj);

                history.replace("/activate");
            }else{
                if (obj.Data){
                    this.setState({activate, error: getErrMsg(obj.Error, obj.Data)});
                }else{
                    this.setState({activate, error:obj.Error});
                }
            }
        }, this);
    }

    resendEmail = (e)=>{
        e.preventDefault();
        e.stopPropagation();

        let param = "";
        if(this.isMobile){
            if(this.sendTimer){
                return false;
            }
            param = {IsMobile:true};
        }

        Net.httpRequest("user/activate", param, (data)=>{
            if (data.Status==0){
            	console.log(data);
                toast(Intl.lang('register.emailVerification.sendok'));
                if(data.Data && data.Data.ActivateUrl) {
                	this.setState({ActivateUrl: data.Data.ActivateUrl});
                }
                if(data.Data && data.Data.ActivateCode) {
                    this.setState({ActivateCode: data.Data.ActivateCode});
                }
                if(this.isMobile){
                    this.freeTime();
                }
            }else{
                toast(data.Error, true);
            }
        }, this, 'put');
    };

    render(){
        const {Uid, Email, ActivateUrl, Verify, error, ActivateCode, text, timer} = this.state, { isMobile } = this.props;
        const textLang = Uid ? (!Verify ? "register.emailVerification.sended" : "login.unactivate") : "forgot.resetPassword.sended";

        return (
            isMobile?
                <div className="activity-mask">
                    <div className="activity-verify">
                        <h4>{Intl.lang('register.emailVerification')}</h4>
                        <p>{Intl.lang("activate.sendCode")}<span className="warn pd05">{Email}</span></p>
                        <p className="test-error">{error?error:""}</p>
                        <p className="verify-ipt wp-100">
                            <input type="text" ref="activateCode" placeholder={Intl.lang("activate.input")}/>
                            <button className={timer?"btnDis":""} onClick={this.resendEmail.bind(this)}>{text}</button>
                        </p>
                        <button onClick={()=>this.activateRegister()}>{Intl.lang("activate.complete")}</button>
                    </div>
                </div>
                :
            <div className="register-contain pos-r">
                <div className="contain pdt-72">
                    <form className="login-web email-regist-box mt-80">
                        <div className="emailVerification_web">
                            <div className="emailVerification">
                                <div className="tc fem-175 login-title"><span className="logo"></span><span className="pdl-10">{Intl.lang("register.emailVerification")}</span></div>

                                <div className="land_text send-txt">
                                    <p dangerouslySetInnerHTML={{__html: Intl.lang(textLang, Email)}}></p>
                                    {ActivateUrl && <a href={ActivateUrl} target="_blank" className="yellow fs12 cursor">{Intl.lang("register.activation")}</a>}
                                    {Uid && <p><a href="javascrpt::" className="yellow fs12 current" onClick={this.resendEmail}>{Intl.lang('register.emailVerification.resend')}</a></p>}
                                </div>
                                <div className="email_list_conten" dangerouslySetInnerHTML={{__html: Intl.lang('register.emailVerification.tip')}}></div>
                            </div>
                            <div className="w-300 mg-md pdb-50 fs12 f-clear">
                                <Link to="/login" className="gold cursor fr">{Intl.lang("activateSucc.1_6")}</Link>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        )
    }
};