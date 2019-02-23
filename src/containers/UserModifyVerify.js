import React from 'react';
import PureComponent from "../core/PureComponent";
import ModifyPassword from "../components/ModifyPassword";
import ModifyPhone from "../components/BindPhone";
import {Link} from 'react-router';
import Intl from "../intl";
import GlobelStore from "../stores";
import Net from "../net/net";
import PopDialog from "../utils/popDialog";
import {toast} from "../utils/common";
import Auth from "../model/auth";
import history from "../core/history";
import BindGoogle from "../components/BindGoogleAuth";
class UserModifyVerify extends PureComponent {

    constructor(props) {

        super(props);
        this.state = {}
    }

    componentDidMount() {

    }
    onBindAuthItem(type, item, hadBind){
        console.log(type, item, hadBind);
        var name="", method=hadBind?'delete':undefined;
        if(type=="mobile"){
            name = "user/mobile";

        }else if(type=="google"){
            name = "user/ggauth";

        }
        var that = this;
        Net.httpRequest(name, item, function(data){
            if (data.Status == 0){
                that.refreshUerInfo();
                PopDialog.close();

                method ? toast(Intl.lang("Personal.112")):toast(Intl.lang("Personal.111"));
                history.push("/personal");
            }else{
                //toast(data.Error, data.Status);
            }
        }, this, method);
    }
    // 刷新 用户信息
    refreshUerInfo(){
        // var self = this;
        Auth.loadUserInfo();
        //this.checkSysAuth(true);
    }
    render() {
        const path = window.location.pathname;
        return (
            <div className="user-modify-verify">
                <div className="modify-verify-title">
                    <h3><Link to={'/personal'}>个人中心</Link><span>修改登录密码</span></h3>
                </div>
                {path == '/usermodify/modifypassword' && <ModifyPassword/>}
                {path == '/usermodify/modifyphone' && <ModifyPhone onChange={(type,item,hadBind)=>this.onBindAuthItem(type,item,hadBind)}/>}
                {path == '/usermodify/bindgoogle' && <BindGoogle onChange={(type,item,hadBind)=>this.onBindAuthItem(type,item,hadBind)}/>}
            </div>

        )
    }
}

export default UserModifyVerify;