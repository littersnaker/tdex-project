import Intl from '../intl';
import React from 'react';
import history from "../core/history";

// import Store from '../core/store';
// import connectToStore from '../core/connect-to-store';
import PureComponent from '../core/PureComponent';
// import storeTypes from '../core/storetypes';

// import GlobelStore from '../stores'

import Net from '../net/net'
import SysTime from '../model/system'
import Auth from '../model/auth'
import Loader from '../utils/loader'
import Validate from '../utils/valiate'

import PopDialog from  '../utils/popDialog'
// import { CONST } from "../public/const";
import CountDownBtn from '../components/CountDownBtn';
import  { toast, md5Pwd, hideAccount } from '../utils/common'
import '../css/verify.css';
// import Event from '../core/event';
import SimulateMask from '../components/SimulateMask';

const $ = window.$;
// const phoneStore = Store({

// }, storeTypes.BINDPHONE);

class ModifyPhone extends PureComponent{
    constructor(props){
        super(props);
        this.state={
            authMap:{},
            UserInfo:this.props.uInfo,
            area: 86,
            loadedLib: false,

            // step: 1,
            mobileCodeSec: 0,
            // emailCodeSec: 0,
            // error:''
        }
    }

    componentWillReceiveProps(nextProps) {
        if (!this.props.uInfo.Uid && nextProps.uInfo.Uid){
            this.setState({UserInfo:nextProps.uInfo});

            this.onChangeUserInfo(nextProps.uInfo);
        }
    }

    componentDidMount() {
        this.onChangeUserInfo(this.state.UserInfo);
    }

    onChangeUserInfo(userInfo){
        if (userInfo && userInfo.Uid){
            let hadBind = userInfo.Mobile||false;
            if (!hadBind && userInfo && $("#newPhone").length){
                this.loadTelPhone()
            }
        }
    }

    onUserAward(){
        let param = {type:'building', title:Intl.lang("mimic.panel.trading.20",100), btnMsg:Intl.lang("mimic.panel.trading.21"), url:"/asset"};
        PopDialog.open(<SimulateMask {...param} />, 'simulate_panel');
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
        }
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
    getPhoneNumber(){
        if (!this.state.loadedLib) return;

        var areaData = this.phone.intlTelInput('getSelectedCountryData');
        var area = parseInt(areaData.dialCode);
        var mobileData = this.phone.intlTelInput('getNumber');
        var mobile = mobileData.replace('+'+area, '');
        //
        // var area = this.state.area;
        // var mobile = this.refs["newPhone"].value;

        // var fullArea = '000000'+area;
        // var fullPhone = fullArea.slice(-6) + mobile;

        // this.setState({'area':area,'phone':mobile,'fullPhone': fullPhone});
        return {'Area':area,'Mobile':mobile};
    }
    sendVerifyCode(hadBind, evt){
        if (evt)evt.preventDefault();

        var self = this, data= "";
        this.setState({mobileCodeSec:0})

        if(hadBind){
            var loginPw = this.refs["loginPW"].value;
            if(!loginPw){
                toast(Intl.lang("Login.106"), 1);
                return false;
            }
            data = {For:"bind"};
        }else{
            // 绑定新手机
            var isMobile = false;
            data = this.getPhoneNumber();

            // if (!data.Mobile) return;
            //内部测试号特征
            if(data.Mobile.substr(0,3)==='886'){
                isMobile = true;
            }else if (data.Area=="86"){
                isMobile = Validate.mobile(data.Mobile);
            }else{
                isMobile = this.phone.intlTelInput("isValidNumber");
            }

            if (!isMobile) {
                toast(Intl.lang("Login.109"), 1);
                return false;
            }
            data.For = "bind";
        }

        Net.httpRequest("verify/mobile", data, function(data){
            if (data.Status == 0){
                var retCode = data.Data.Code;
                if (retCode){
                    if (!isNaN(retCode)){
                        self.refs["phoneCode"].value = retCode;
                    }
                }

                var sec = data.Data.NextAvalibleTime - SysTime.getServerTimeStamp();

            }
        }, this);
    }
    // 接收子组件返回总数
    changeParentCount(count) {
        this.setState({mobileCodeSec: count});
    }

    handdleSubmit=(e)=> {
        e.preventDefault();

        const {UserInfo} = this.state, hadBind = UserInfo.Mobile?true:false;
        var item = {}, gCode, passWord;

        if (!hadBind){
            var data = this.getPhoneNumber()
            if(!data || data.Mobile && !data.Mobile){
                toast(Intl.lang("accountSafe.2_149"), true);
                return false;
            }
            item = data;
        }

        var phoneCode = this.refs['phoneCode'].value;
        if(!phoneCode){
            toast(Intl.lang("accountSafe.2_124"), true);
            return false;
        }

        if(this.refs['gg_code']){
            gCode = this.refs['gg_code'].value;
            if(!gCode){
                toast(Intl.lang("BindGoogleAuth.106"), true);
                return false;
            }
            item.GgAuth = gCode;
        }
        if(hadBind){
            passWord = this.refs['loginPW'].value;
            if(!passWord){
                toast(Intl.lang("Login.106"), true);
                return false;
            }
            item.Password = md5Pwd(passWord);
        }

        item.Code = phoneCode;

        Auth.onBindAuthItem("mobile",item, hadBind,(userInfo)=>this.refreshUerInfo(userInfo));
    };
    // 刷新 用户信息
    refreshUerInfo(userInfo){
        //this.setState({UserInfo: userInfo});
        //this.refs["phoneCode"].value = "";
        history.replace("/personal/securitysetting");
    }

    render(){
        const { UserInfo, area, mobileCodeSec } = this.state;
        var phone="--", hadBind = UserInfo.Mobile?true:false;

        if (UserInfo.Mobile) {
            phone = hideAccount(UserInfo.Mobile.substring(6));
        }

        return(
            <div className="verify-inside-page">
                <div className="verify-box">
                    <h3>{hadBind?Intl.lang("ModifyPhone.107"):Intl.lang("accountSafe.1_11")}</h3>
                    <div className="verify-input-box">
                        <form onSubmit={this.handdleSubmit} autoComplete="off">
                            <div className={"verify-input-text "+(hadBind?"":"hide")}>
                                <input className="fem" type="password" ref="loginPW" placeholder={Intl.lang("Login.106")} autoComplete="off" />
                                <div className="mt-10"><span>{Intl.lang("ModifyPhone.100")}</span><span className="pdr-5">{"+"+area}</span><span>{phone}</span></div>
                            </div>
                            <div className={"verify-input-text "+(hadBind?"hide":"")}>
                                <input type="tel" id="newPhone" ref="newPhone" placeholder={Intl.lang("accountSafe.2_149")} autoComplete="off"/>
                            </div>
                            <div className="verify-input-text verify-input-tab">
                                <input className="fem wp-100" type="text" name="phoneCode" ref="phoneCode" placeholder={Intl.lang("accountSafe.2_124")} autoComplete="off"/>
                                <CountDownBtn changeParentCount={this.changeParentCount.bind(this)} onClick={(e)=>this.sendVerifyCode(hadBind, e)} count={mobileCodeSec} />
                            </div>
                            {!hadBind && UserInfo.GgAuth ?
                                <div className="verify-input-text">
                                    <input className="fem" type="text" ref="gg_code" placeholder={Intl.lang("BindGoogleAuth.106")} autoComplete="off"/>
                                </div>
                                :
                                null
                            }
                            <button className="active">{hadBind ?Intl.lang("BindGoogleAuth.109"):Intl.lang("accountSafe.2_153")}</button>
                        </form>
                        <div className="input-right-text">
                            <p>{Intl.lang("BindBank.104")}</p>
                            {hadBind ?
                                <p>{Intl.lang("ModifyPhone.101")}</p>
                                :
                                <p>{Intl.lang("ModifyPhone.102")}</p>
                            }
                            <p>{Intl.lang("ModifyPhone.103")}</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default ModifyPhone;
