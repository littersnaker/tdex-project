import Intl from '../intl';
import React from 'react';
import {Link} from 'react-router';

import PureComponent from "../core/PureComponent"
import UserWallet from "./UserWallet"
import AuthModel from '../model/auth';

class LoginBox extends PureComponent {
    sayHello(){
        var hour = new Date().getHours();
        if(hour < 6) return Intl.lang("LoginBox.101");
        else if (hour < 9) return Intl.lang("LoginBox.102");
        else if (hour < 12) return Intl.lang("LoginBox.103");
        else if (hour < 14)return Intl.lang("LoginBox.104");
        else if (hour < 17)return Intl.lang("LoginBox.105");
        else if (hour < 19)return Intl.lang("LoginBox.106");
        else if (hour < 24) return Intl.lang("LoginBox.107");
    }
    logout(evt){
        evt.preventDefault();

        AuthModel.logout();
    }
    render() {
        //是否桌面版
        this.isDesktop = process.env.VER_ENV=='desktop';

        const {user, uInfo, isExpert} = this.props;
        const isAuth = user && user.Uid;
        const loginTip = this.sayHello()+ (uInfo.Email||" ");
        const pname = window.location.pathname;
        const isDesktop = process.env.VER_ENV=='desktop';
        var redirect;
        if (pname.indexOf("/trade")!=-1 || pname.indexOf("/cfd")!=-1){
            redirect = pname;
        }
        var loginTo = { pathname: '/login', query: redirect ? { return_to: redirect } : {}};
        //{"/login"+(redirect ? "?return_to="+redirect : "")}
        return (
            !isAuth ?
                <div className={isExpert?"login-bar fl":null}>
                    <Link to={loginTo} className="pd010">{Intl.lang("LoginBox.100")}</Link>
                    <Link to="/register" className="pd010">{Intl.lang("header.1_10")}</Link>
                </div>
                :
                (!isExpert ?
                        <div className="fr login-bar">
                            {!isDesktop && <Link to="/personal" className="pd010 login-user">{loginTip}</Link>}
                            {/*<UserWallet uInfo={uInfo} isExpert={isExpert}/>*/}
                            <a href="javascript:;" className="pd010" onClick={this.logout}>{Intl.lang("header.1_2")}</a>
                        </div>
                        :
                        <React.Fragment>
                            {!isDesktop && <div className="fl head-icon-config pd0">
                                <Link to={"/asset"} className="iconfont icon-wallet"></Link>
                            </div>}
                            <div className="fl head-icon-config pd0">
                                {!isDesktop ? <Link to={"/personal"} className="iconfont icon-personal"></Link> : <a className="iconfont icon-personal" href="javascript:;"></a>}
                                <ul className="head-icon-config-hover">
                                    <li><a href="javascript:;" className="pd010" onClick={this.logout.bind(this)}>{Intl.lang("header.1_2")}</a></li>
                                </ul>
                            </div>
                        </React.Fragment>
                )
        );
    }
}

export default LoginBox;
