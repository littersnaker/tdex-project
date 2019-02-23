import React from 'react';
import PureComponent from '../core/PureComponent';
import {Link} from 'react-router';

import '../css/common.css';
import Intl from '../intl';
import Net from "../net/net";
import {hideAccount} from '../utils/common';
import ModifyPhone from  '../components/BindPhone';
import BindGoogle from '../components/BindGoogleAuth';
import ModifyPassword from "./ModifyPassword";
import AssetMenu from "./AssetMenu";

export default function SecuritySetting(props) {
    const { uInfo, pathName } = props;

    const path = [
        {pathLink: '/personal',pathIcon: 'icon-personal', pathName: Intl.lang("NavBar.104")},
        {pathLink: '/personal/viprights',pathIcon: 'icon-vip', pathName: Intl.lang('Personal.asset.grade')},
        {pathLink: '/personal/securitysetting',pathIcon: 'icon-SecuritySettings', pathName: Intl.lang('Personal.SecuritySetting')},
        {pathLink: '/api',pathIcon: 'icon-api-link', pathName: Intl.lang('personal.api')},
        {pathLink: '/invite',pathIcon: 'icon-gifts', pathName: Intl.lang('new.home.header.4')},
    ];

    return (
        <div className="main-content-part">
            <div className="contain asset-section">
                <AssetMenu path={path} />
                <div className={"asset-theme mt-30 "+(pathName!='securitysetting'?"mb-hide":"")}>{Intl.lang('Personal.SecuritySetting')}</div>
                {pathName == 'securitysetting' ? <SecurityVerify uInfo={uInfo} />
                : pathName == 'modifypassword' ? <ModifyPassword uInfo={uInfo} />
                : pathName == 'modifyphone' ? <ModifyPhone uInfo={uInfo}/>
                : pathName == 'bindgoogle' ? <BindGoogle uInfo={uInfo} />
                :null}
            </div>
        </div>
    )
}

function SecurityVerify(props) {
    const {uInfo} = props;

    return (
        <React.Fragment>
            <div className="security-verify mt-10">
                <div className="any-verify">
                    <div className="any-verify-pic pw-verify"></div>
                    <div className="any-verify-text">
                        <p className="text-title">{Intl.lang("Personal.104")}</p>
                        <p className="text-p">{Intl.lang("SecuritySetting.loginPwdTip")}</p>
                    </div>
                    <Link to={'/personal/modifypassword'} className="any-verify-btn">{Intl.lang("trade.order.StateModify")}</Link>
                </div>
                <div className="any-verify">
                    <div className="any-verify-pic phone-verify"></div>
                    <div className="any-verify-text">
                        <p className="text-title">{Intl.lang("login.mobile_verify")+(uInfo.Mobile ? " ("+hideAccount(uInfo.Mobile.substring(6))+")" : "")}</p>
                        <p className="text-p">{Intl.lang("SecuritySetting.mobileTip")}</p>
                    </div>
                    <Link to={'/personal/modifyphone'} className="any-verify-btn">{Intl.lang(uInfo.Mobile?"SecuritySetting.close":"SecuritySetting.open")}</Link>
                </div>
                <div className="any-verify">
                    <div className="any-verify-pic gg-verify"></div>
                    <div className="any-verify-text">
                        <p className="text-title">{Intl.lang("accountSafe.1_22")}</p>
                        <p className="text-p">{Intl.lang("SecuritySetting.gAuthTip")}</p>
                    </div>
                    <Link to={'/personal/bindgoogle'} className="any-verify-btn">{Intl.lang(uInfo.GgAuth?"SecuritySetting.close":"SecuritySetting.open")}</Link>
                </div>
            </div>
            <SecurityVerifyList />
        </React.Fragment>
    )
}

class SecurityVerifyList extends PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            securityLog: {PageSize: 5, Page: 1}
        }
    }

    componentDidMount() {
        this.loadSecurityLog();
    }

    loadSecurityLog(){
        Net.httpRequest("user/logSecurity", {Page:this.state.securityLog.Page, PageSize:this.state.securityLog.PageSize}, (data)=>{
            if (data.Status==0){
                this.setState({securityLog:data.Data});
            }
        }, this);
    }

    render() {
        const { securityLog } = this.state;

        return <div className="record-lists mt-10">
            <div className="lists-header">
                <h3>{Intl.lang("Personal.securityLog")}</h3>
            </div>
            <div className="log-list-overflow">
                <div className="lists-content ov-w-rows5">
                    <ul className="lists-theme">
                        <li>{Intl.lang("accountSafe.1_102")}</li>
                        <li>{Intl.lang("Personal.ip")}</li>
                        <li>{Intl.lang("Personal.SecuritySetting")}</li>
                    </ul>
                    {(securityLog.hasOwnProperty("PageCount") && securityLog.PageCount>0) && securityLog.List.map((v,i)=>{
                        return <ul className="lists-list"  key={"t"+i}>
                            <li>{v.Time}</li>
                            <li>{v.IP}</li>
                            <li>{Intl.lang("SecuritySetting."+v.Action)}</li>
                        </ul>
                    })}
                    {(securityLog.hasOwnProperty("PageCount") && securityLog.PageCount==0) && <div className="no-list-data show-5">
                        <div className="no-list-data-pic"></div>
                        <p>{Intl.lang("bank.1_27")}</p>
                    </div>}
                </div>
            </div>
        </div>
    }

}
