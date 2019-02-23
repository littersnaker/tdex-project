import Intl from '../intl';
import React from 'react';
import history from '../core/history';
import { Link } from 'react-router';

import PureComponent from '../core/PureComponent'

import Net from '../net/net';
import AuthModel from '../model/auth';

import Geetest from '../components/Geetest';
import FormInput from '../components/FormInput';
import {getErrMsg} from '../utils/common';
import Valiate from '../utils/valiate';
export default class ForgotPassword extends PureComponent{
    constructor(props) {
        super(props);

        this.inputsMap = {
            "email": {
                placeholder: () => Intl.lang('accountSafe.2_142'),
                isRequired: true,
                validator: (value)=>Valiate.email(value),
            }
        };

        this.inputs = Object.keys(this.inputsMap);
        this.data = {};
        this.inputValid = {};

        this.state = {
            error: '',
            disable: !this.onValidForm(),
            isSend: false
        }
    }

    onChange(name, value, isValid){
        this.data[name] = value;
        if (this.inputValid[name]!=isValid){
            this.inputValid[name] = isValid;

            var disable = !this.onValidForm();
            if (disable!=this.state.disable){
                this.setState({disable});
            }
        }
    }

    onValidForm(){
        if (!this.inputValid["email"]) return false;

        return true;
    }

    onInputError(name, error){
        if (error){
            if (error=='empty'){
                this.setState({error: 'form.error.empty'});
            }else{
                this.setState({error: 'error.'+name+'.'+error});
            }
        }else{
            this.setState({error:''});
        }
    }

    handleSubmit(gtResult, callback){
        var form = {
            "Email": this.data["email"],
            "GeetestChallenge": gtResult.geetest_challenge,
            "GeetestValidate": gtResult.geetest_validate,
            "GeetestSeccode": gtResult.geetest_seccode
        };
        var self = this;
        Net.httpRequest("user/forget", form, (data)=>{
            if (data.Status == 0){
                if (callback) callback(true);

                self.setState({isSend:true, ActivateUrl: data.Data ? data.Data.ActivateUrl : ""});
                // var usrData = data.Data;
                // if(usrData){
                //     AuthModel.registerAfter(data);
                //
                //     usrData.Email = self.data["email"];
                //     history.replace("/emailVerification");
                // }else{
                //
                // }
            }else{
                if (callback) callback(false);
                if (data.Data){
                    self.setState({error: getErrMsg(data.Error, data.Data)});
                }else if (data.Error){
                    self.setState({error:data.Error});
                }
            }
        }, this, 'put');
    }

    render(){
        const { isSend, error, ActivateUrl} = this.state;

        const disable = !this.onValidForm();

        return (
            !isSend?
            <div className="login">
                <div className="login-box">
                    <h3>{Intl.lang('forgot.title')}</h3>
                    <div className="login-input-box">
                        <form autoComplete="off">
                            {this.inputs && this.inputs.map((name, i)=> {
                                var options = this.inputsMap[name];
                                return <div className="login-input-text" key={i}>
                                    <FormInput key={i} onChange={this.onChange.bind(this, name)} onError={this.onInputError.bind(this, name)} {...options} />
                                    {error &&<p className="input-error"><i className="iconfont icon-tips"></i>{Intl.lang(error)}</p>}
                                </div>
                            })}

                            <Geetest onSuccess={this.handleSubmit.bind(this)} onValidForm={this.onValidForm.bind(this)} width="100%" disable={disable} type="forgotPassword">
                                <button type="submit" className="active">{Intl.lang("common.confirm")}</button>
                            </Geetest>
                        </form>
                        <div className="login-input-right-text">
                            <p>{Intl.lang('login.tips.1')}</p>
                            <p>{Intl.lang('login.tips.2')}</p>

                            <Link to="/login" className="text-action">{Intl.lang("activateSucc.1_6")}</Link>
                            <Link to="/register" className="text-action">{Intl.lang("register.title")}</Link>
                        </div>
                    </div>
                </div>
            </div>
            :
            <div className="login">
                <div className="login-box">
                    <form className="login-web email-regist-box">
                        <div className="tc fem-175 login-title">
                            <span className="logo"></span><span className="pdl-10">{Intl.lang("forgot.title")}</span>
                        </div>
                        <div className="land_text send-txt">
                            <p>{Intl.lang("forgot.resetPassword.sended")}</p>
                            {ActivateUrl && <a href={ActivateUrl} target="_blank" className="yellow fs12 cursor">{Intl.lang("register.activation")}</a>}
                        </div>
                        <div className="email_list_conten" dangerouslySetInnerHTML={{__html: Intl.lang('register.emailVerification.tip')}}></div>
                        <div className="w-300 mg-md pdb-50 fs12 f-clear">
                            <Link to="/login" className="gold cursor fr">{Intl.lang("activateSucc.1_6")}</Link>
                        </div>
                    </form>
                </div>
            </div>
        )
    }
};
