import Intl from '../intl';
import React from 'react';
import { Link } from 'react-router';
import history from '../core/history';

// import Store from '../core/store';
// import connectToStore from '../core/connect-to-store';

import PureComponent from '../core/PureComponent'
import Net from '../net/net';
import { getErrMsg, md5Pwd, formatStr, toast } from '../utils/common';
import AuthModel from '../model/auth';
import Valiate from '../utils/valiate';
// import storeTypes from '../core/storetypes';
// import SysTime from '../model/systime';
import Geetest from '../components/Geetest';
import FormInput from '../components/FormInput';
// import '../lib/jq/polygonizr.min';
import { isMobile } from '../utils/util';

// const $ = window.$;

// 用 {几个字母}.{4个数字}.t@tdex.com 注册的号码，自动成为测试号
// 测试号享有自动填充激活码、自动获取激活链接的特权（无需进入邮箱）
// 比如: tdex.1001.t@tdex.com, tony.1008.t@tdex.com 注册的邮箱自动成为测试号
//
// 886 开头的手机号码也是测试号码，享有自动填充手机验证码的特权
export default class Register extends PureComponent {
    constructor(props) {
        super(props);

        this.isMobile = isMobile();
        this.inputsMap = {
            "email": {
                placeholder: () => Intl.lang("Login.105"),
                isRequired: true,
                validator: (value) => Valiate.email(value),
                newVersion: true
            },
            "pwd": {
                placeholder: () => Intl.lang('m.register.1'),
                isRequired: true,
                type: 'password',
                validator: (value) => this.checkPassword(value),
                unFill: true,
                newVersion: true
            },
            "pwd_repeat": {
                placeholder: () => Intl.lang('m.register.2'),
                isRequired: true,
                type: 'password',
                validator: (value) => this.checkConfirmPassword(value),
                unFill: true,
                newVersion: true
            },
            "agent": {
                placeholder: () => Intl.lang('m.register.4'),
                match: "^[a-zA-Z0-9]{6}$",
                value: this.getAgentId(),
                inputClassName: "hide",
                newVersion: true
            }
        };
        this.inputs = Object.keys(this.inputsMap);

        this.data = { "agree": false };
        this.errors = {};
        this.lastErrName = '';
        this.inputValid = {};

        this.state = {
            error: '',
            errorData: {},
            disable: !this.onValidForm(),
            actRegisterSuc: false,
            showActivate: true,
            activateCode: "",

            showPWdLimit: false,
            pwPass:{1:'',2:'',3:''},

            showAgent: false
        };
    }
    componentDidMount() {
        document.documentElement.scrollTop = 0;
        let aid = this.getActivityId();
        console.log(aid)
    }
    getUrlParams(name){
        const reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)")
        const r = window.location.search.substr(1).match(reg)
        if (r !== null) {
            return decodeURIComponent(r[2])
        }
    }
    getAgentId() {
        const sId = this.getUrlParams('ref');
        return sId ? sId : '';
        // var search = window.location.search, sId = "";
        // if (search && search.indexOf("=") != -1) {
        //     if (search.indexOf("&") != -1) {
        //         var sObj = search.split('=')[1];
        //         sId = sObj.split('&')[0];
        //     } else {
        //         sId = search.split('=')[1];
        //     }
        // }
        // return sId;
    }
    getActivityId(){
        const ActivityId = this.getUrlParams('activityId');
        return ActivityId ? ActivityId : ''
    }
    onChangeAgree(e) {
        e.stopPropagation();

        var agree = e.target.checked;
        this.data["agree"] = agree;

        var disable = !this.onValidForm();
        if (!disable && agree) this.setState({ disable });
        else this.setState({disable: true})
    }
    onValidForm() {
        if (!this.inputValid["email"] || !this.inputValid["pwd"] || !this.inputValid["pwd_repeat"] || !this.data["agree"] || this.inputValid["pwd"] != this.inputValid["pwd_repeat"]) return false;

        return true;
    }
    onInputError(name, error) {

        this.errors[name] = error;

        this.onInputErrorData(name, error);
        return;


        const showError = (error, name)=>{
            if (error == 'empty') {
                this.setState({ error: `error.${name}.empty` });
            } else {
                this.setState({ error: 'error.' + name + '.' + error });
            }
        }

        if (error) {
            showError(error, name);
            this.lastErrName = name;
        } else {
            if (this.errors[this.lastErrName]) return;

            for (var name in this.errors){
                if (this.errors[name]){
                    showError(this.errors[name], name);
                    return;
                }
            }
            this.setState({ error: '' });
        }
    }
    onInputErrorData(name, error){
        const {errorData} = this.state;

        const showError = (error, name)=>{
            if (error == 'empty') {
                errorData[name] = `error.${name}.empty`;
            } else {
                errorData[name] = 'error.' + name + '.' + error;
            }
            this.setState({errorData:errorData});
        }

        if (error) {
            showError(error, name);
            this.lastErrName = name;
        } else {
            if (errorData[name]){
                errorData[name] = "";
                this.setState({errorData:errorData});
            }
        }
    }
    checkPasswordValue(value){
        let kg = /\s+/g.test(value);
        let num = value.length;
        let pwFlag = /^(?![^A-Z]+$)(?!\D+$)/g.test(value);
        let types = {1:'',2:'',3:''};
        if(!kg){
            types[1] = true;
        }
        if(num>7&&num<25){
            types[2] = true;
        }
        if(pwFlag){
            types[3] = true;
        }
        this.setState({pwPass:types});
    }
    checkOnFocus(name){
        if(!this.state.showPWdLimit) this.setState({showPWdLimit:true})
    }
    checkPassword(value) {
        if (this.data["email"] && AuthModel.isTestAcount(this.data["email"])) {
            return true;
        } else {
            return Valiate.password(value);
        }
    }
    checkConfirmPassword(value) {
        if (value != this.data["pwd"]) {
            return false;
        }
        return true;
    }
    onChange(name, value, isValid, isFocus) {
        this.data[name] = value;
        if(name=="pwd"){
            if(isFocus){
                this.checkOnFocus(name);
                return false;
            }
            if(value){
                this.checkPasswordValue(value)
            }
        }
        if (this.inputValid[name] != isValid) {
            this.inputValid[name] = isValid;

            var disable = !this.onValidForm();
            if (disable != this.state.disable) {
                this.setState({ disable });
            }
        }
    }
    handleSubmit(gtResult, callback) {
        var hasError = false;
        for (var name in this.inputsMap) {
            var isValid = this.refs[name].onCheckValid();
            if (!isValid) {
                this.refs[name].focusInput();
                if (callback) callback(false);
                return;
            }
        }

        if (!this.data["agree"]){
            return;
        }

        var form = {
            "Email": this.data["email"],
            "Password": md5Pwd(this.data["pwd"]),
            "AgentUid": this.data["agent"],
            "GeetestChallenge": gtResult.geetest_challenge,
            "GeetestValidate": gtResult.geetest_validate,
            "GeetestSeccode": gtResult.geetest_seccode
        };
        if (this.props.isActivity) {
            form.Channel = "activity";
        }else{
            //读取cookie保存的渠道信息
            var channel = AuthModel.getChannel();
            if (channel) form.Channel = channel;
        }
        if (this.isMobile) {
            form.IsMobile = true;
        }

        let activityId = this.getActivityId();
        if(activityId){
            form.ActivityId = Number(activityId);
        }
        //alert("success");
        //return false;

        var self = this;
        Net.httpRequest("user/register", form, (data) => {
            if (data.Status == 0) {
                var info = data.Data;
                info.Email = this.data["email"];

                if (callback) callback(true);

                AuthModel.registerAfter(data);
                toast(Intl.lang('register.emailVerification.send'));

                if (info.ActivateCode) {
                    self.setState({ actRegisterSuc: true, activateCode: info.ActivateCode });
                } else if (self.props.isActivity) {
                    self.setState({ actRegisterSuc: true });
                } else {
                    history.replace({
                        pathname: '/emailVerification'
                    });
                }
            } else {
                if (callback) callback(false);
                if (data.Data) {
                    self.setState({ error: getErrMsg(data.Error, data.Data), errorData: {'email':getErrMsg(data.Error, data.Data)}});
                } else if (data.Error) {
                    if(data.Status==10128){
                        self.setState({ error: data.Error, errorData: {'agent':data.Error}});
                    }else{
                        self.setState({ error: data.Error, errorData: {'email':data.Error}});
                    }
                }
            }
        }, this);
    }
    showAgent(){
        let { showAgent } = this.state;

        this.inputsMap['agent'].inputClassName = showAgent?"hide":"";
        this.setState({showAgent: !showAgent});
    }
    closeVerify() {
        this.setState({ actRegisterSuc: false });
    }
    render() {
        const { error, errorData, disable, actRegisterSuc, activateCode, showPWdLimit, pwPass, showAgent } = this.state, { isMobile } = this.props;
        return (
            <div className="register">
                <div className="register-box">
                    <h3>{Intl.lang("header.1_10")}</h3>
                    <div className="register-input-box">
                        <form>
                            {this.inputs && this.inputs.map((name, i) => {
                                var options = this.inputsMap[name];
                                if (name == 'agent') options.maxLength = 6;

                                return <div className="register-input-text" key={i}>
                                    {name=="agent" && <div className={"referee-text"+(showAgent?"":" agentHide")} onClick={this.showAgent.bind(this)}><p><i className="iconfont icon-dropDown"></i>{Intl.lang("register.agent")}</p></div>}
                                    <FormInput ref={name} onChange={this.onChange.bind(this, name)} onError={this.onInputError.bind(this, name)} {...options} />
                                    {(name!="pwd" && errorData[name]) && <p className="input-error"><i className="iconfont icon-tips"></i>{Intl.lang(errorData[name])}</p>}

                                    {(name=="pwd" && showPWdLimit) &&<div className="register-error-text">
                                        <p><i className={pwPass[1]?"iconfont icon-true":"iconfont icon-tips"}></i>{Intl.lang("register.pwd.1")}</p>
                                        <p><i className={pwPass[2]?"iconfont icon-true":"iconfont icon-tips"}></i>{Intl.lang("register.pwd.2",8,24)}</p>
                                        <p><i className={pwPass[3]?"iconfont icon-true":"iconfont icon-tips"}></i>{Intl.lang("register.pwd.3")}</p>
                                    </div>

                                    }
                                </div>
                            })}
                            <p className="agree-clause-text">
                                <label><span><input className="input-agree" type="checkbox" defaultChecked={this.data["agree"]} onChange={this.onChangeAgree.bind(this)} /><span></span></span>
                                <span>{Intl.lang('register.agreement.agree')}</span></label>
                                <Link to="/clause" target="_blank">{Intl.lang('register.agreement')}</Link>
                            </p>
                            <Geetest onSuccess={this.handleSubmit.bind(this)} onValidForm={this.onValidForm.bind(this)} width="100%" disable={disable} type="register">
                                <button type="submit" className="active">{Intl.lang('header.1_10')}</button>
                            </Geetest>
                        </form>
                        <div className="register-input-right-text">
                            <div className="register-right-bg"></div>
                            <p>{Intl.lang("register.tips.1")}</p>
                            <p>{Intl.lang("register.tips.2")}</p>
                            <p>{Intl.lang("register.tips.3")}</p>
                            <div className="pos-rz">{Intl.lang("Register.100")}<Link to="/login" className="text-action">{Intl.lang("activateSucc.1_6")}</Link></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}