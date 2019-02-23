import Intl from '../intl';
import React from 'react';
import history from '../core/history';

import PureComponent from '../core/PureComponent'
import Net from '../net/net';
import {getErrMsg, md5Pwd} from '../utils/common';
import AuthModel from '../model/auth'

import Geetest from '../components/Geetest';
import FormInput from '../components/FormInput';
import Valiate from '../utils/valiate';

//重置密码
//https://localhost/activate/?token=etDoMh1SIds%
export default class Forget extends PureComponent{
    constructor(props) {
        super(props);

        this.inputsMap = {
            "pwd":{
                placeholder: () => Intl.lang('m.register.1'),
                isRequired: true,
                type:'password',
                validator: (value)=>this.checkPassword(value),
                // icon:<i className="iconfont icon-pw fem15"></i>
                newVersion: true
            },
            "pwd_repeat":{
                placeholder: ()=>Intl.lang('register.password.confirm'),
                isRequired: true,
                type:'password',
                validator: (value)=>this.checkConfirmPassword(value),
                // icon:<i className="iconfont icon-pw fem15"></i>
                newVersion: true
            },
        };

        this.inputs = Object.keys(this.inputsMap);
        this.data = {};
        this.inputValid = {};

        this.state = {
            error: '',
            activate: 0
        }
    }

    componentWillMount(){
         this.activateReset();
    }
    activateReset(){
        const Token = this.props.location.query.token;

        var self = this;
        Net.httpRequest("user/forget", {Token:Token}, (data)=>{
            if (data.Status == 0){
                AuthModel.loginedAfter(data);  console.log(data);
                self.setState({activate: 1})
            }else{
                if (data.Data){
                    this.setState({error: getErrMsg(data.Error, data.Data)});
                }else if (data.Error){
                    this.setState({error:data.Error});
                }
                setTimeout(()=>{
                    history.replace('/login');
                },2000);
            }
        }, this);
    }
    onValidForm(){
        if (!this.inputValid["pwd"] || !this.inputValid["pwd_repeat"] || this.inputValid["pwd"]!=this.inputValid["pwd_repeat"]) return false;

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
    checkPassword(value){
        if (this.data["email"]){
            return true;
        }else{
            return Valiate.password(value);
        }
    }
    checkConfirmPassword(value){
        if (value!=this.data["pwd"]){
            return false;
        }
        return true;
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
    handleSubmit(e){
        e.preventDefault();

        var hasError = false;
        for (var name in this.inputsMap){
            var isValid = this.refs[name].onCheckValid();
            if (!isValid){
                hasError = true;
            }
        }
        if (hasError) return false;

        var form = {
            "NewPWD": md5Pwd(this.data["pwd"]),
            // "GeetestChallenge": gtResult.geetest_challenge,
            // "GeetestValidate": gtResult.geetest_validate,
            // "GeetestSeccode": gtResult.geetest_seccode
        };

        var self = this;
         Net.httpRequest("user/password", form, (data)=>{
             if (data.Status == 0){
                 self.setState({activate: 2})
             }else{
                 if (data.Data){
                     this.setState({error: getErrMsg(data.Error, data.Data)});
                 }else if (data.Error){
                     this.setState({error:data.Error});
                 }
             }
         }, this, 'put');
    }
    render(){
        const {error, disable, activate} = this.state;
        return (
            <div className="login">
                <div className="login-box">
                    <h3>{Intl.lang("reset.title")}</h3>
                    {(activate==2) ?
                        <div className="login-input-box">
                            <div className="land_text pdt-72">
                                <p><span>{Intl.lang("resetPassword.succ")}</span><span className="fem875 gold cursor" onClick={()=>{ history.replace('/login')}}>{Intl.lang("activateSucc.1_6")}</span></p>
                            </div>
                        </div>
                        :
                        <div className="login-input-box">
                            <form onSubmit={this.handleSubmit.bind(this)}>
                                {this.inputs && this.inputs.map((name, i)=> {
                                    var options = this.inputsMap[name];
                                    return <div className="login-input-text" key={i}>
                                        <FormInput onChange={this.onChange.bind(this, name)} onError={this.onInputError.bind(this, name)} {...options} ref={name}/>
                                        {(error&&i==0) &&<p className="input-error"><i className="iconfont icon-tips"></i>{Intl.lang(error)}</p>}
                                    </div>
                                })}

                                <button className={"active"+(disable?" btnDis":"")} type="submit">{Intl.lang("common.confirm")}</button>

                            </form>
                            <div className="register-input-right-text">
                                <div className="register-right-bg"></div>
                                <p>{Intl.lang("reset.tip")}</p>
                            </div>
                        </div>
                    }
                </div>
            </div>
        )
    }
}
