import React from 'react';
import { Link } from 'react-router';
import history from '../core/history';
import PureComponent from '../core/PureComponent';
import {APP_URL, IS_SIMULATE_TRADING} from '../config';

import Net from '../net/net';
import Intl from '../intl';
import {getErrMsg, md5Pwd} from '../utils/common';
import AuthModel from '../model/auth';
import Valiate from '../utils/valiate';
import Geetest from '../components/Geetest';
import FormInput from '../components/FormInput';
import PopDialog from '../utils/popDialog'
import Verify from './Verify'
import { toast } from '../utils/common'

export default class Login extends PureComponent{
    constructor(props) {
        super(props);

        //是否桌面版
        this.isDesktop = process.env.VER_ENV=='desktop';

        this.inputsMap = {
            "email": {
                placeholder: () => Intl.lang('Login.105'),
                isRequired: true,
                validator: (value)=>Valiate.email(value),
                newVersion: true
            },
            "pwd": {
                placeholder: () => Intl.lang('Login.106'),
                isRequired: true,
                type: 'password',
                newVersion: true
            }
        };

        this.inputs = Object.keys(this.inputsMap);
        this.data = {};
        this.inputValid = {};

        // this.turnTo = '';
        this.state = {
            error: '',
            disable: false,
            inputType: false,
            errorData: {},
        }
    }

    componentDidMount() {
        document.documentElement.scrollTop = 0;
        if(this.props.location && this.props.location.query&&this.props.location.query.return_to){
            this.turnTo = encodeURIComponent(this.props.location.query.return_to);
        }
    }
    componentWillUnmount(){
        super.componentWillUnmount();
    }
    onChange(name, value, isValid){
        this.data[name] = value;
        if (this.inputValid[name]!=isValid){
            this.inputValid[name] = isValid;

            if(!window.IS_LOCAL){
                return false;
            }
            var disable = !this.onValidForm();
            if (disable!=this.state.disable){
                this.setState({disable});
            }
        }
    }

    onValidForm(){
        if (!this.inputValid["email"] || !this.inputValid["pwd"]) return false;

        return true;
    }

    onInputError(name, error){
        const {errorData} = this.state;

        if (error){
            if (error=='empty'){
                errorData[name] = `error.${name}.empty`;
            }else{
                errorData[name] = 'error.' + name + '.' + error;
            }
            this.setState({errorData:errorData});
        }else{
            if (errorData[name]){
                errorData[name] = "";
                this.setState({errorData:errorData});
            }
        }
    }

    handleSubmit(gtResult, callback){
        if(!window.IS_LOCAL){
            toast (Intl.lang("common.not_open"),true);
            return false;
        }

        var hasError = false;
        for (var name in this.inputsMap){
            var isValid = this.refs[name].onCheckValid();
            if (!isValid){
                hasError = true;
                this.refs[name].focusInput();
                if (callback) callback(false);
                return;
            }
        }
        // if (hasError) return;

        var form = {
            "UserName": this.data["email"],
            "Password": md5Pwd(this.data["pwd"]),
            "GeetestChallenge": gtResult.geetest_challenge,
            "GeetestValidate": gtResult.geetest_validate,
            "GeetestSeccode": gtResult.geetest_seccode
        };
        var self = this, path=this.props.path;
        Net.httpRequest("user/login", form, (data)=>{
            if (data.Status == 0){
                if (callback) callback(true);

                var usrData = data.Data;
                if (usrData.Activated){
                    var noSecond = data.Data.Verify.length == 0;
                    AuthModel.loginedAfter(data, noSecond);
                    if (noSecond){
                        AuthModel.loadAllData();
                        if (typeof(ElectronExt)=='object' && ElectronExt.showTradeWindow){ //桌面版
                            ElectronExt.showTradeWindow();
                        }else{
                            if(IS_SIMULATE_TRADING){
                                history.replace("activities/simulatetrade");
                            }else{
                                AuthModel.logedRedirect(self.props.location, window.IS_LOCAL && !this.isDesktop ? '/personal' : '/trade', history.replace);
                            }
                        }
                    }else{
                        if(path){
                            self.popVerify(callback);
                        }else{
                            history.replace('/verify'+"?datafor=login"+ (self.turnTo ? '&return_to='+self.turnTo : ''));
                        }
                    }
                }else{
                    usrData.Email = this.data["email"];

                    AuthModel.registerAfter(data);
                    history.replace("/emailVerification");
                }
            }else{
                if (callback) callback(false);
                if (data.Data){
                    toast(getErrMsg(data.Error, data.Data), true);
                    //self.setState({errorDa: getErrMsg(data.Error, data.Data)});
                }else if (data.Error){
                    //self.setState({error:data.Error});
                    toast(data.Error, true);
                }
            }
        }, this);
    }
    popVerify(callback){
        PopDialog.open(<Verify path={this.props.path} onChange={(type)=>{
            if (callback) callback(false);
            this.popCallback(type);
        }} datafor="login"/>, 'simple_lang');
    }
    popCallback(type){
        PopDialog.close();
        if(type=="close") return;

        var cb = function(){
            //Event.dispatch(Event.EventName.LOGIN_SUCCESS);
            history.replace('/trade');
        };
        AuthModel.loadUserInfo(cb);
    }
    showPassWord(e){
        e.stopPropagation();

        const show = this.state.inputType;
        this.inputsMap['pwd'].type = !show ?'text':"password";
        this.setState({'inputType':!show});
    }
    openNewWin(url){
        if (typeof(ElectronExt)=='object' && ElectronExt.openExternal){
            ElectronExt.openExternal(`${process.env.REACT_APP_URL_ORIGIN}${url}`);
        }
    }
    changeLanguage(lang){
        Intl.setLang(lang);
    }
    render() {
        const { errorData, disable, inputType} = this.state, { path } = this.props;
        // const disable = !this.onValidForm();
        // const isNotFull = path || this.isDesktop;
        return (
            <div className="login">
                <div className="login-box">
                    <h3>{Intl.lang("login.welcome")}</h3>
                    <div className="login-input-box">
                        <form>
                            {this.inputs && this.inputs.map((name, i)=>{
                                var options = this.inputsMap[name];
                                return <div className="login-input-text" key={i}>
                                    <FormInput key={i} ref={name} onChange={this.onChange.bind(this, name)} onError={this.onInputError.bind(this, name)} {...options} ref={name} />
                                    {name=="pwd" &&<i className={"input-icon iconfont "+(inputType?"icon-eye-true":"icon-eye-false")} onClick={this.showPassWord.bind(this)}></i>}
                                    {errorData[name] &&<p className="input-error"><i className="iconfont icon-tips"></i>{Intl.lang(errorData[name])}</p>}
                                </div>
                            })}

                            {!this.isDesktop && <p className="forget-password-text">{window.IS_LOCAL&&<Link to="/forgotPassword">{Intl.lang("login.forget.password")}</Link>}</p>}
                            {this.isDesktop && <p className="forget-password-text"><a href="javascript:;" onClick={this.openNewWin.bind(this, "/forgotPassword")}>{Intl.lang("login.forget.password")}</a></p>}

                            <Geetest onSuccess={this.handleSubmit.bind(this)} onValidForm={this.onValidForm.bind(this)} width="100%" disable={disable} type="login">
                                <button type="submit" className="active">{Intl.lang("login.login")}</button>
                            </Geetest>

                            {this.isDesktop && <div className="langBox pdb-30">
                                <span className="lang-cn" onClick={this.changeLanguage.bind(this, 'zh-cn')}>中文</span>
                                <span className="lang-en" onClick={this.changeLanguage.bind(this, 'en-us')}>English</span>
                            </div>}
                        </form>

                        {!this.isDesktop && <div className="login-input-right-text">
                            <p>{Intl.lang("login.tips.1")}</p>
                            <p>{Intl.lang("login.tips.2")}</p>
                            <div>{Intl.lang("Login.101")}<Link className="text-action" to="/register">{Intl.lang("Login.102")}</Link></div>
                        </div>
                        }
                    </div>
                </div>
            </div>
        );
    }
}


