import React from 'react';
import PureComponent from '../core/PureComponent'
import history from '../core/history';
import Intl from '../intl'
import Net from '../net/net'
import Loader from '../utils/loader'

import PopDialog from "../utils/popDialog"
import {toast} from "../utils/common"
import Verify from './Verify'
import Valiate from '../utils/valiate';
import CountDownBtn from '../components/CountDownBtn';
import SysTime from '../model/system'

const $ = window.$;
export default class Questionnaire extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            mobileCodeSec: 0,

            hadJoin: false,
            hadSend: false,
            verify: false,

            errData: ['','','','',''],
            phoneData: {}
        }
    }
    componentWillMount(){
        this.getQuestion();
    }
    componentDidMount(){
    }
    loadTelPhone(count=0){
        var loaded = {};
        const loadedComplete = ()=>{
            if (loaded["1"] &&  loaded["2"]){
                $("#newPhone").intlTelInput("destroy");

                $("#newPhone").intlTelInput({
                    "autoPlaceholder": false,
                    "preferredCountries": ["cn", "us"]
                });
                $("#newPhone").intlTelInput("setCountry", "cn");
                this.phone = $('#newPhone');
                this.setState({loadedLib: true});
            }
        };
        Loader.js("lib/telphone/intlTelInput.min.js", ()=>{
            loaded["1"] = true;
            loadedComplete();
        }, ()=>{
            if (count<5) this.loadTelPhone(++count);
        });
        Loader.js("lib/telphone/utils.js", ()=>{
            loaded["2"] = true;
            loadedComplete();
        }, ()=>{
            if (count<5) this.loadTelPhone(++count);
        });
    }
    getQuestion(param){
        let method = "post", params= param || false;

        if(param){
            method = "put";
            //console.log(params);  this.setState({hadSend:true,verify:false});  return;
        }

        Net.httpRequest("user/quest", params, (data)=>{
            if (data.Status == 0){
                let flag = data.Data;
                if(!flag){
                    this.loadTelPhone();
                }
                if(param){
                    this.setState({hadSend:flag, verify:false});
                }else{
                    this.setState({hadJoin:flag});
                }
            }
        }, this, method);
    }
    getPhoneNumber(){
        if (!this.state.loadedLib) return;

        var areaData = this.phone.intlTelInput('getSelectedCountryData');
        var area = parseInt(areaData.dialCode);
        var mobileData = this.phone.intlTelInput('getNumber');
        var mobile = mobileData.replace('+'+area, '');

        return {'Area':Number(area),'Mobile':mobile};
    }

    selectCheckBox(name){
        let check_val = [];
        let items = document.getElementsByName(name);
        for (let i=0; i<items.length; i++) {
            if (items[i].checked) {
                if(items[i].value=="other"){
                    check_val.push(this.refs[name].value);
                }else{
                    check_val.push(items[i].value);
                }
            }
        }

        return check_val.join(',');
    }
    getParams(){
        let params = this.getPhoneNumber();

        params.Name = this.refs["userName"].value;
        params.Wechat = this.refs["userWX"].value;
        params.ETH = Number(this.refs["userETH"].value);
        params.TD = Number(this.refs["userTD"].value);

        params.QQ = this.refs["userQQ"].value;
        params.Facebook = this.refs["userFB"].value;
        params.Telegram = this.refs["userTG"].value;

        let join = this.selectCheckBox("likeJoin");
        if(join!=""){
            params.JoinTest = join=="1"?true:false;
        }

        params.Exchanges = this.selectCheckBox("clients");
        params.TradeYears = this.selectCheckBox("experience");
        params.Media = this.selectCheckBox("information");

        params.Idea = this.refs['suggest'].value;
        params.Suggest	= this.refs['improve'].value;

        params.Code = this.refs['mobileCode'].value+"";

        return params;
    }
    resetErrData(){
        let errData = ['','','','',''];
        this.setState({errData:errData});
    }
    checkMobile() {
        let { errData } = this.state;

        let phone = this.getPhoneNumber();
        let isMobile = this.matchMobile(phone);

        if(!phone || !phone.Mobile){
            errData[1] = 1;
        }else if(!isMobile){
            errData[1] = 2;
        }else{
            errData[1] = "";
        }
        this.setState({errData: errData});

    }
    matchMobile(phone){
        let isMobile = true;
        //内部测试号特征
        if(phone.Mobile.substr(0,3)==='886'){
            isMobile = true;
        }else if (phone.Area=="86"){
            isMobile = Valiate.mobile(phone.Mobile);
        }else{
            isMobile = this.phone.intlTelInput("isValidNumber");
        }

        return isMobile;
    }
    handleSubmit(event){
        event.stopPropagation();
        event.preventDefault();

        this.resetErrData();

        let needErr = false, errData={};

        let phone = this.getPhoneNumber();

        let uName = this.refs["userName"].value;
        let wx = this.refs["userWX"].value;

        let ethNum = this.refs["userETH"].value;
        let tdNum = this.refs["userTD"].value;

        if(!uName){
            needErr = true;
            errData[0] = 1;
        }else{ errData[0] = "";}

        if(!phone || !phone.Mobile){
            needErr = true;
            errData[1] = 1;
        }else{ errData[1] = "";}

        if(!wx){
            needErr = true;
            errData[2] = 1;
        }else{ errData[2] = "";}

        if(ethNum===""){
            needErr = true;
            errData[3] = 1;
        }else if(isNaN( Number(ethNum))){
            needErr = true;
            errData[3] = 2
        }else{ errData[3] = "";}

        if(tdNum===""){
            needErr = true;
            errData[4] = 1;
        }else if(isNaN( Number(tdNum))){
            needErr = true;
            errData[4] = 2
        }else{
            errData[4] = "";
        }

        let isMobile = this.matchMobile(phone);
        if (!isMobile) {
            needErr = true;
            errData[1] = 2;
        }

        if(needErr){
            this.setState({errData:errData});
            return false;
        }

        this.setState({verify:true, phoneData: phone});
        this.sendVerifyCode();
    }

    sendVerifyCode(evt){
        if (evt) evt.preventDefault();

        var self = this, data = this.getPhoneNumber();
        data.For = "quest";

        Net.httpRequest("verify/mobile", data, function(data){
            if (data.Status == 0){
                var retCode = data.Data.Code;
                if (retCode){
                    if (!isNaN(retCode)){
                        self.refs["mobileCode"].value = retCode;
                    }
                }

                self.setState({'mobileCodeSec': 120});
            }
        }, this);
    }
    sendQuestionResult(event){
        event.stopPropagation();
        event.preventDefault();

        let params = this.getParams();
        this.getQuestion(params);
    }
    onFocus(tab){
        let { errData } = this.state;
        if(errData[tab]){
            errData[tab] = '';
            this.setState({errData: errData});
        }
    }
    close(){
        this.setState({'verify': false})
    }
    turnToMain(){
        history.replace('/');
    }
    render(){
        const { hadJoin, hadSend, errData, verify, phoneData, mobileCodeSec } = this.state;
        const langType = Intl.getLang();
        return(
            <div className="okk-trade-contain">
                {(!hadJoin&&!hadSend) &&<div className="question-bg tc">
                    <div className="question-title">
                        <div className={"quest-title-"+langType}></div>
                    </div>
                </div>}
                <div className={"contain pdt-1 question-contain media-contain"+((!hadJoin&&!hadSend)?" quest-pos":"")}>
                {hadJoin ?
                    <div className="question-succ pd-10 tc">
                        <div className="succ-icon mt-80"><i className="questionIcon"></i></div>

                        <p className="mt-30 fs26">{Intl.lang("questionnaire.item.24")}</p>

                        <div className="mt-50 tc">
                            <button className="btn question-btn fem125" onClick={this.turnToMain.bind(this)}>{Intl.lang("questionnaire.item.25")}</button>
                        </div>
                    </div>
                    :
                    hadSend ?
                    <div className="question-succ pd-10 tc">
                        <div className="succ-icon mt-80"><i className="iconfont icon-success"></i> </div>

                        <p className="mt-30 fs26">{Intl.lang("questionnaire.item.22")}</p>

                        <p className="mt-20 fs16">{Intl.lang("questionnaire.item.23")}</p>

                        <div className="mt-50 tc">
                            <button className="btn question-btn fem125" onClick={this.turnToMain.bind(this)}>{Intl.lang("TRANSFER.STATUS.1")}</button>
                        </div>
                    </div>
                        :
                    <form className="question-all-box" onSubmit={(e)=>{this.handleSubmit(e)}} autoComplete="off">
                        <div className="question-cross l"></div>
                        <div className="question-cross r"></div>
                        <div className="question-desc">{Intl.lang("questionnaire.desc")}</div>
                        <div className="question-box mt-25">
                            <div className="pos-r">
                                <h5><i className="red1 pdr-5">*</i>{Intl.lang("questionnaire.item.1")}</h5>
                                <div className={"input-normal m-wp-100 w320-h30 "+(errData[0]?"bd-err":"")}><input className="fem" type="text" ref="userName" onFocus={()=>this.onFocus(0)} placeholder={Intl.lang("questionnaire.item.2")}/></div>
                                {(errData[0]) &&<span className="pos-a fem75 red1 pdl-10">{Intl.lang("form.error.empty")}</span>}
                            </div>

                            <div className="pos-r">
                                <h5><i className="red1 pdr-5">*</i>{Intl.lang("Personal.101")}</h5>
                                <div className={"input-normal m-wp-100 w320-h30 "+(errData[1]?"bd-err":"")}><input className="fem" type="text" id="newPhone" ref="newPhone" onFocus={()=>this.onFocus(1)} onBlur={()=>this.checkMobile()} placeholder={Intl.lang("accountSafe.2_149")}/></div>
                                {(errData[1]) &&<span className="pos-a fem75 red1 pdl-10">{errData[1]==2?Intl.lang("Login.109"):Intl.lang("form.error.empty")}</span>}
                            </div>

                            <div className="question-flex">
                                <div className="pos-r">
                                    <h5><i className="red1 pdr-5">*</i>{Intl.lang("questionnaire.item.3")}</h5>
                                    <div className={"input-normal m-wp-100 w320-h30 "+(errData[2]?"bd-err":"")}><input className="fem" type="text" ref="userWX" onFocus={()=>this.onFocus(2)} placeholder={Intl.lang("questionnaire.item.4")}/></div>
                                    {(errData[2]) &&<span className="pos-a fem75 red1 pdl-10">{Intl.lang("form.error.empty")}</span>}
                                </div>
                                <div>
                                    <h5>QQ</h5>
                                    <div className="input-normal m-wp-100 w320-h30"><input className="fem" type="text" ref="userQQ" placeholder={Intl.lang("questionnaire.item.5")}/></div>
                                </div>
                            </div>

                            <div className="question-flex">
                                <div>
                                    <h5>Facebook</h5>
                                    <div className="input-normal m-wp-100 w320-h30"><input className="fem" type="text" ref="userFB" placeholder={Intl.lang("questionnaire.item.6","Facebook")}/></div>
                                </div>
                                <div>
                                    <h5>Telegram</h5>
                                    <div className="input-normal m-wp-100 w320-h30"><input className="fem" type="text" ref="userTG" placeholder={Intl.lang("questionnaire.item.6","Telegram")}/></div>
                                </div>
                            </div>

                            <div className="question-flex">
                                <div className="pos-r">
                                    <h5><i className="red1 pdr-5">*</i>{Intl.lang("questionnaire.item.10")}</h5>
                                    <div className={"input-normal m-wp-100 w320-h30 "+(errData[3]?"bd-err":"")}><input className="fem" type="text" ref="userETH"  onFocus={()=>this.onFocus(3)} placeholder={Intl.lang("questionnaire.item.7","ETH")}/></div>
                                    {(errData[3]) &&<span className="pos-a fem75 red1 pdl-10">{errData[3]==2?Intl.lang("Withdrawals.correct_input"):Intl.lang("form.error.empty")}</span>}
                                </div>
                                <div className="pos-r">
                                    <h5><i className="red1 pdr-5">*</i>{Intl.lang("questionnaire.item.11")}</h5>
                                    <div className={"input-normal m-wp-100 w320-h30 "+(errData[4]?"bd-err":"")}><input className="fem" type="text" ref="userTD" onFocus={()=>this.onFocus(4)} placeholder={Intl.lang("questionnaire.item.7","TD")}/></div>
                                    {(errData[4]) &&<span className="pos-a fem75 red1 pdl-10">{errData[4]==2?Intl.lang("Withdrawals.correct_input"):Intl.lang("form.error.empty")}</span>}
                                </div>
                            </div>

                            <h5>{Intl.lang("questionnaire.item.12")}</h5>
                            <div className="lh-32">
                                <label className="custom-label w-140"><input className="custom-radio" type="radio" name="likeJoin" value="1"/><span className="custom-radioInput"></span><span>{Intl.lang("questionnaire.item.18_1")}</span></label>
                                <label className="custom-label w-140"><input className="custom-radio" type="radio" name="likeJoin" value="0"/><span className="custom-radioInput"></span><span>{Intl.lang("questionnaire.item.18_2")}</span></label>
                            </div>

                            <h5>{Intl.lang("questionnaire.item.14")}</h5>
                            <div className="lh-32">
                                <label className="custom-label w-140">
                                    <input className="custom-radio" type="radio" name="experience" value="0-1"/><span className="custom-radioInput"></span>
                                    <span>{Intl.lang("questionnaire.item.20_1")}</span></label>
                                <label className="custom-label w-140">
                                    <input className="custom-radio" type="radio" name="experience" value="1-3"/><span className="custom-radioInput"></span>
                                    <span>{Intl.lang("questionnaire.item.20_2")}</span></label>
                                <label className="custom-label w-140">
                                    <input className="custom-radio" type="radio" name="experience" value="3-5"/><span className="custom-radioInput"></span>
                                    <span>{Intl.lang("questionnaire.item.20_3")}</span></label>
                                <label className="custom-label w-140">
                                    <input className="custom-radio" type="radio" name="experience" value="5-"/><span className="custom-radioInput"></span>
                                    <span>{Intl.lang("questionnaire.item.20_4")}</span></label>
                            </div>

                            <h5>{Intl.lang("questionnaire.item.13")}</h5>
                            <div className="question-flex lh-32">
                                <label className="custom-checkbox">
                                    <div><input type="checkbox" name="clients" className="input_check" value={Intl.lang("questionnaire.item.19_1")} /><i></i></div>
                                    <span>{Intl.lang("questionnaire.item.19_1")}</span></label>
                                <label className="custom-checkbox">
                                    <div><input type="checkbox" name="clients" className="input_check" value={Intl.lang("questionnaire.item.19_2")} /><i></i></div>
                                    <span>{Intl.lang("questionnaire.item.19_2")}</span></label>
                                <label className="custom-checkbox">
                                    <div><input type="checkbox" name="clients" className="input_check" value={Intl.lang("questionnaire.item.19_3")} /><i></i></div>
                                    <span>{Intl.lang("questionnaire.item.19_3")}</span></label>
                                <label className="custom-checkbox">
                                    <div><input type="checkbox" name="clients" className="input_check" value={Intl.lang("questionnaire.item.19_4")} /><i></i></div>
                                    <span>{Intl.lang("questionnaire.item.19_4")}</span></label>
                                <label className="custom-checkbox">
                                    <div><input type="checkbox" name="clients" className="input_check" value={Intl.lang("questionnaire.item.19_5")} /><i></i></div>
                                    <span>{Intl.lang("questionnaire.item.19_5")}</span></label>
                                <label className="custom-checkbox">
                                    <div><input type="checkbox" name="clients" className="input_check" value="other" /><i></i></div>
                                    <span>{Intl.lang("questionnaire.item.8")}</span>
                                    <input className="checkbox-subTxt" ref="clients" />
                                </label>
                            </div>

                            <h5>{Intl.lang("questionnaire.item.15")}</h5>
                            <div className="question-flex lh-32">
                                <label className="custom-checkbox">
                                    <div><input type="checkbox" name="information" className="input_check" value={Intl.lang("questionnaire.item.21_1")} /><i></i></div>
                                    <span>{Intl.lang("questionnaire.item.21_1")}</span></label>
                                <label className="custom-checkbox">
                                    <div><input type="checkbox" name="information" className="input_check" value={Intl.lang("questionnaire.item.21_2")} /><i></i></div>
                                    <span>{Intl.lang("questionnaire.item.21_2")}</span></label>
                                <label className="custom-checkbox">
                                    <div><input type="checkbox" name="information" className="input_check" value={Intl.lang("questionnaire.item.21_3")} /><i></i></div>
                                    <span>{Intl.lang("questionnaire.item.21_3")}</span></label>
                                <label className="custom-checkbox">
                                    <div><input type="checkbox" name="information" className="input_check" value={Intl.lang("questionnaire.item.21_4")} /><i></i></div>
                                    <span>{Intl.lang("questionnaire.item.21_4")}</span></label>
                                <label className="custom-checkbox">
                                    <div><input type="checkbox" name="information" className="input_check" value={Intl.lang("questionnaire.item.21_5")} /><i></i></div>
                                    <span>{Intl.lang("questionnaire.item.21_5")}</span></label>
                                <label className="custom-checkbox">
                                    <div><input type="checkbox" name="information" className="input_check" value="other" /><i></i></div>
                                    <span>{Intl.lang("questionnaire.item.8")}</span>
                                    <input className="checkbox-subTxt" ref="information"/>
                                </label>
                            </div>

                            <h5>{Intl.lang("questionnaire.item.16")}</h5>
                            <textarea name="suggest" ref="suggest" className="input-normal" maxLength="1000"></textarea>

                            <h5>{Intl.lang("questionnaire.item.17")}</h5>
                            <textarea name="improve" ref="improve" className="input-normal" maxLength="1000"></textarea>

                            <div className="mt-50 tc">
                                <button className="btn question-btn fem125">{Intl.lang("common.submit")}</button>
                            </div>
                        </div>
                        <div>
                            <p className="fs16 lh-40">{Intl.lang("Recharge.tips")}</p>
                            <p>
                                {Intl.lang("questionnaire.item.9")}
                            </p>
                        </div>
                    </form>
                }
                </div>

                {verify &&<div className="mask home-popinner">
                    <form className="regist-box question-pos" onSubmit={(e)=>{this.sendQuestionResult(e)}}>
                        <div className="dialog-close t0 pd-10 point" onClick={this.close.bind(this)}><i className="iconfont icon-close transit"></i></div>
                        <div className="tc fem-175 login-title"><span className="pdl-10">{Intl.lang("login.mobile_verify")}</span></div>
                        <div>
                            <div className="login-txt lh-32 tc h-50">{Intl.lang("questionnaire.item.26")}<span className="tb gray fem125">{phoneData.Mobile}</span></div>
                            <div className="tc">
                                <input type="tel" className="w-160" name="vaildCode" ref="mobileCode" placeholder={Intl.lang("accountSafe.2_124")} maxLength="6" />
                                <CountDownBtn className="reg-btn lh-40 c-8" onClick={(e)=>this.sendVerifyCode(e)} count={mobileCodeSec}/>
                            </div>
                        </div>
                        <div className="tc mt-10 pdb-30 mt-20">
                            <button type="submit" className="btn btn-gold w300-h40 m-w248-h40 fem125 bdRadius-0">{Intl.lang("common.confirm")}</button>
                        </div>
                    </form>
                </div>
                }

            </div>
        )
    }
}