import Intl from '../intl';
import React from 'react';
import { Link } from 'react-router';
import PureComponent from '../core/PureComponent';

import Event from "../core/event";
import Net from '../net/net';
import history from "../core/history";
import {getCurrencySymbol, toast} from "../utils/common";
import ProductModel from "../model/product";
import Decimal from '../utils/decimal';
import VipRights from './VipRights';
import VipExRate from './VipExRate';
import SecuritySetting from '../components/SecuritySetting';
import AllBillLog from '../components/BillLog';
import TransferConfirm from '../components/TransferConfirm';
import {CONST} from "../public/const";
import {IS_CLOSE_EXCHANGE} from "../config";
import AccountModel from "../model/account";
import AssetMenu from '../components/AssetMenu';

export default function Personal(props) {
    const {uInfo, user, params, location, isMobile} = props;

    if (params && params.name){
        var name = params.name.toLowerCase();
        console.log(name);
        if(name == 'billlog'){
            var t = location.query.t;
            return <AllBillLog t={t}/>
        }else if(name == 'viprights'){
            return <VipRights uInfo={uInfo}/>
        }else if(name == 'exrate'){
            return <VipExRate uInfo={uInfo} isMobile={isMobile}/>
        }else{
            return <SecuritySetting uInfo={uInfo} user={user} pathName={name} />
        }
    }
    return (
        <div className="main-content-part">
            <div className="contain asset-section">
                <AccountInfo uInfo={uInfo}/>
                <BillLog isMobile={isMobile}/>
            </div>
        </div>
        )
}

class AccountInfo extends PureComponent{
    constructor(props) {
        super(props);

        this.openVip = !IS_CLOSE_EXCHANGE;
        this.state = {
            loginInfo: {Time:'--',IP:'--',Area:'--'},
            loginLog: {PageSize:5, Page:1},
            vipData: [],
            curVip: 0,
            tdCounts: 0,

            openPay: false
        };
    }
    getSubNav(){
        return [
            {pathLink: '/personal',pathIcon: 'icon-personal', pathName: Intl.lang("NavBar.104")},
            {pathLink: '/personal/viprights',pathIcon: 'icon-vip', pathName: Intl.lang('Personal.asset.grade')},
            {pathLink: '/personal/securitysetting',pathIcon: 'icon-SecuritySettings', pathName: Intl.lang('Personal.SecuritySetting')},
            {pathLink: '/api',pathIcon: 'icon-api-link', pathName: Intl.lang('personal.api')},
            {pathLink: '/invite',pathIcon: 'icon-gifts', pathName: Intl.lang('new.home.header.4')},
        ];
    }
    componentWillMount() {
        this.getLoginInfo();
        this.getVipMap();
        Event.addListener(Event.EventName.WALLET_UPDATE, this.onUpdateWallet.bind(this), this);
    }
    componentDidMount() {
        this.onUpdateWallet();
        this.getUserVipDetail();
    }
    onUpdateWallet(){
        var spotWallet = AccountModel.getWalletInfo(CONST.WALLET.TYPE.SPOT);
        let tdWallet = null;
        if(spotWallet){
            tdWallet = spotWallet[11];
            if(tdWallet)
                this.setState({tdCounts:tdWallet.canUse});
        }
    }
    getLoginInfo(){
        var self = this;
        Net.httpRequest('user/log',  {Page:this.state.loginLog.Page, PageSize:this.state.loginLog.PageSize}, (data)=>{
            if (data.Status == 0) {
                var info = data.Data;
                if (info.PageCount){
                    let nowData = info.List[0];
                    let ip = nowData.IP;
                    let area = info.IpMap[ip];

                    nowData.Area = area;

                    self.setState({'loginInfo': nowData, 'loginLog':info});
                }
            }
        }, this);
    }
    changePayOffer(){
        let { openPay } = this.state;
        Net.httpRequest("user/offset", {Open:!openPay}, data =>{
            if (data.Status == 0){
                this.setState({openPay:!openPay});
            }
        }, this, 'put');
    }
    getVipMap(){
        ProductModel.loadProductVip((data)=>{
            this.vipMap = data;
            this.getUserVipDetail();
        },this);
    }
    getUserVipDetail(){
        Net.httpRequest("user/vip", null, data =>{
            if (data.Status == 0){
                this.makeVipInfo(data.Data);
            }
        }, this);
    }
    getOffer(vip){        // 1-(等级费率/0.08)
        if(vip==0) return "0.08%";
        let vipInfo = this.vipMap[vip], Offer = "--";

        if(vipInfo){
            //Offer = Decimal.accSubtr(1, Decimal.accDiv(vipInfo.Futures.Tdfeerate*100, 0.08, 4), 3)*100;

            Offer = vipInfo.Futures.Tdfeerate * 10;
        }
        return Offer;
    }
    makeVipInfo(data){
        //data.Vip = 4;
        if(data && this.vipMap){
            let TdOffer1="--",TdOffer2="--", leftBTC="--", leftTD="--";
            let curVip = parseInt(data.Vip), nextVip=curVip+1, nextVipInfo = this.vipMap[nextVip];

            if(curVip<6){
                const { tdCounts } = this.state;
                //let BTCNum = Decimal.accAdd(data.Futuresbtc, data.Spotbtc, 4);
                //leftBTC = Decimal.accSubtr(nextVipInfo.Min, BTCNum, 4);
                leftTD = Decimal.accSubtr(nextVipInfo.Mintd, tdCounts, 2);

                //leftBTC = leftBTC > 0 ? leftBTC : 0;
                leftTD = leftTD > 0 ? leftTD : 0;
            }
            let TdOffer = this.getOffer(curVip);

            let vipInfoMap = [];
            if(curVip==0){
                TdOffer1 = this.getOffer(1);
                TdOffer2 = this.getOffer(2);
                vipInfoMap = [
                    {
                        On: true,
                        Offer: TdOffer,
                        Lever: 0
                    },
                    {
                        LeftBTC: leftBTC,
                        LeftTD: leftTD
                    },
                    {
                        Offer: TdOffer1,
                        Lever: 1
                    },
                    {},
                    {
                        Offer: TdOffer2,
                        Lever: 2
                    }
                ]
            }else if(curVip==6){
                TdOffer1 = this.getOffer(4);
                TdOffer2 = this.getOffer(5);
                vipInfoMap = [
                    {
                        On: true,
                        Offer: TdOffer1,
                        Lever: 4
                    },
                    {},
                    {
                        On: true,
                        Offer: TdOffer2,
                        Lever: 5
                    },
                    {},
                    {
                        On: true,
                        Offer: TdOffer,
                        Lever: 6
                    }
                ]
            }else{
                TdOffer1 = this.getOffer(curVip-1);
                TdOffer2 = this.getOffer(curVip+1);
                vipInfoMap = [
                    {
                        On: true,
                        Offer: TdOffer1,
                        Lever: curVip-1
                    },
                    false,
                    {
                        On: true,
                        Offer: TdOffer,
                        Lever: curVip
                    },
                    {
                        LeftBTC: leftBTC,
                        LeftTD: leftTD
                    },{
                        Offer: TdOffer2,
                        Lever: curVip+1
                    }
                ]
            }

            this.setState({vipData: vipInfoMap, curVip:data.Vip, openPay:data.Offset});
        }
    }

    render(){
        const { uInfo } = this.props;
        const {loginInfo, loginLog, vipData, curVip, openPay} = this.state;

        const userPhoto = '', lang = Intl.getLang(), path = this.getSubNav();
        return(
            <React.Fragment>
                <AssetMenu path={path} />
            <div className="user-info-data wp-100 mt-30">
                <div className="user-info-l">
                    <div className="user-photo">
                        {userPhoto ? <img src={process.env.PUBLIC_URL + userPhoto} alt=""/>
                            : <img src={process.env.PUBLIC_URL + '/images/user-info/no-user-info-photo.png'} alt=""/>}
                    </div>
                    <div className="user-data">
                        <p><span className="">{uInfo.Email}</span>{(this.openVip&&curVip>0)&&<i className="vip-grade">{"VIP"+curVip}</i>}</p>
                        <p>{"UID"+Intl.lang("common.symbol.colon")}<span>{uInfo.AccountId}</span></p>
                        <p>{Intl.lang("Vip.detail.td_fee","TD","25%")}<span className={"ver-md mining-open-btn "+(openPay?"on":"")} onClick={this.changePayOffer.bind(this)}><i></i></span></p>
                    </div>
                </div>
                {this.openVip &&
                <div className="user-vip-rights">
                    <div className="vip-rights-top">
                        <div className={"vip-current " + lang}>
                            {vipData.map((item, i)=>{
                                if(item.Offer){
                                    let feeRateTxt = "--";
                                    if(item.Lever==0){
                                        feeRateTxt = Intl.lang("personal.vip.normal_offer", item.Offer)
                                    }else if(lang=="zh-cn"){
                                        feeRateTxt = Intl.lang("personal.vip.offer","TD", item.Offer);
                                    }else{
                                        let Offer = Decimal.toPercent(Decimal.accSubtr(1, (item.Offer/10)),0);
                                        feeRateTxt = Intl.lang("personal.vip.offer","TD", Offer);
                                    }
                                    return <div key={"a"+i} className="vip-item">
                                        <p className={item.On?"on":""}>{item.Lever==0?Intl.lang("Vip.grade.normal"):("V"+item.Lever)}</p>
                                        <h5 dangerouslySetInnerHTML={{__html: feeRateTxt }} />
                                    </div>
                                }else if(item.LeftBTC){
                                    return <div key={"b"+i}>
                                        <dl>
                                            <dd>{Intl.lang("Vip.detail.next_need", item.LeftTD)}</dd>
                                            {/*<dd>{Intl.lang("Vip.detail.need_btc")}{item.LeftBTC} BTC</dd>*/}
                                            {(lang!="en-us")&&<dd>{item.LeftTD} TD</dd>}
                                        </dl>
                                    </div>
                                }else {
                                    return <div key={"c"+i}></div>
                                }
                            })
                            }
                        </div>
                    </div>
                </div>
                }
                <div className="vip-rights-link">
                    <p><Link to="/personal/viprights">{Intl.lang("personal.vip.view")}<i className="iconfont icon-arrow-l fs12"></i></Link></p>
                </div>
            </div>
            <LoginLog loginLog={loginLog}/>
            </React.Fragment>
        )
    }
}

class LoginLog extends PureComponent{
    constructor(props){
        super(props)

        this.state = {
            tab: 1,
            securityLog: {PageSize:5, Page:1}
        }
    }
    onToggleTab(tab){
        if (this.state.tab!=tab){
            this.setState({tab});
            if (tab==2){
                this.loadSecurityLog();
            }
        }
    }

    loadSecurityLog(){
        Net.httpRequest("user/logSecurity", {Page:this.state.securityLog.Page, PageSize:this.state.securityLog.PageSize}, (data)=>{
            if (data.Status==0){
                this.setState({securityLog:data.Data});
            }
        }, this);

    }

    render(){
        const {loginLog} = this.props;
        const {tab, securityLog} = this.state;

        return(
            <React.Fragment>
                <div className="record-lists mt-10">
                    <div className="lists-header">
                        <h3>{Intl.lang("Personal.loginLog")}</h3>
                    </div>
                    <div className="lists-content ">
                        <ul className="lists-theme">
                            <li>{Intl.lang("accountSafe.1_102")}</li>
                            <li>{Intl.lang("Personal.ip")}</li>
                            <li>{Intl.lang("Personal.loginArea")}</li>
                        </ul>
                        {(loginLog.hasOwnProperty("PageCount") && loginLog.PageCount>0) && loginLog.List.map((v,i)=>{
                            let area = loginLog.IpMap[v.IP];
                            return <ul className="lists-list" key={"t"+tab+i}>
                                <li>{v.Time.substring(0,16)}</li>
                                <li>{v.IP}</li>
                                <li>{area||'--'}</li>
                            </ul>
                        })}
                        {(loginLog.hasOwnProperty("PageCount") && loginLog.PageCount==0) && <div className="no-list-data show-5">
                            <div className="no-list-data-pic"></div>
                            <p>{Intl.lang("bank.1_27")}</p></div>}
                    </div>
                </div>
            </React.Fragment>
        )
    }
}

class BillLog extends PureComponent{
    constructor(props){
        super(props)

        this.isMobile = props.isMobile;
        this.state = {
            history:{List: [], PageSize: 5}, //最新成交
        }
    }
    componentWillUnmount(){
        super.componentWillUnmount();
    }
    componentWillMount() {
        this.loadHistory(1);

        Event.addListener(Event.EventName.MSG_TRANSFER_OVER,this.loadHistory.bind(this,1), this);
    }

    loadHistory(page){
        Net.httpRequest("wallet/orders", {Page:page, PageSize:this.state.history.PageSize}, (data)=>{
            if (data.Status == 0){
                var Info = data.Data;
                this.setState({history:Info});
            }
        }, this);
    }
    getTitle(){
        if(this.isMobile){
            return [Intl.lang("Asset.105"), Intl.lang("Personal.amount"), Intl.lang("recharge.1_23"), Intl.lang("Personal.walletLogType"), Intl.lang("trade.history.CreatedAt_O")];
        }else{
            return [Intl.lang("trade.history.CreatedAt_O"), Intl.lang("Personal.walletLogType"), Intl.lang("Asset.105"), Intl.lang("Personal.amount"), Intl.lang("recharge.1_23")];
        }
    }
    parseData(v, i) {
        var cs = getCurrencySymbol(v.Currency);
        var csName = v.Currency==CONST.CURRENCY["TD-Freeze"] ? "TD ("+ Intl.lang("Asset.gift") +") " : (cs ? cs.sn : "--");
        if(this.isMobile){
            return <ul className="lists-list" key={"bl"+i}>
                <li>{csName}</li>
                <li>{Decimal.toFixed(v.Amount, 8)}</li>
                <li>
                    <TransferConfirm order={v} onChange={this.loadHistory.bind(this,1)}/>
                </li>
                <li>{Intl.lang({key:"billLog.Action.type" + v.Action, def:"Personal.walletLogType9"})}</li>
                <li>{(v.CreateTime).substring(0, 16)}</li>
            </ul>
        }else{
            return <ul className="lists-list" key={"bl"+i}>
                <li>{(v.CreateTime).substring(0, 16)}</li>
                <li>{Intl.lang({key:"billLog.Action.type" + v.Action, def:"Personal.walletLogType9"})}</li>
                <li>{csName}</li>
                <li>{Decimal.toFixed(v.Amount, 8)}</li>
                <li>
                    <TransferConfirm order={v} onChange={this.loadHistory.bind(this,1)}/>
                </li>
            </ul>
        }
    }

    render(){
        const {history} = this.state;
        const Titles = this.getTitle();
        return(
            <React.Fragment>
                <div className="record-lists mt-10">
                    <div className="lists-header">
                        <h3>{Intl.lang("Personal.billLog")}</h3>
                        <Link className="header-path-text" to='/personal/billlog'>{Intl.lang("common.viewMore")}<i className="iconfont icon-arrow-l fs12"></i></Link>
                    </div>

                    <div className="log-list-overflow">
                        <div className="lists-content ov-w-rows6">
                            <ul className="lists-theme">
                                {Titles.map((item, t)=>{
                                    return <li key={"tie"+t}>{item}</li>
                                })}
                            </ul>
                            {(history.hasOwnProperty("PageCount") && history.PageCount > 0) && history.List.map((v, i)=> {
                                return this.parseData(v, i)
                            })}
                            {(history.hasOwnProperty("PageCount") && history.PageCount == 0) && <div className="no-list-data show-5">
                                <div className="no-list-data-pic">
                                </div>
                                <p>{Intl.lang("bank.1_27")}</p>
                            </div>}
                        </div>
                    </div>
                </div>
            </React.Fragment>
        )
    }
}

class EnableApi extends PureComponent{
    constructor(props){
        super(props)

        this.state = {

        }
    }
    showApi(createAPI){
        if(createAPI){
            history.push("/api");
        }else{
            toast(Intl.lang("Withdrawals.119"), true);
        }
    }
    render(){
        const {uInfo} = this.props;
        const createAPI = uInfo ? uInfo.Mobile || uInfo.GgAuth : false;
        return(
            <div className="title-data-list">
                <div className="list-header-text">
                    <h3>{Intl.lang("personal.api")}</h3>
                </div>
                <div className="enable-api">
                    <div className="enable-api-pic"></div>
                    <div className="enable-api-text" dangerouslySetInnerHTML={{__html: Intl.lang("Personal.apiDesc")}}></div>
                    <div className={"enable-api-btn "+(createAPI?"on":"off")} onClick={()=>this.showApi(createAPI)}>{Intl.lang("Personal.apiBtn")}</div>
                </div>
            </div>
        )
    }
}

class Banner extends PureComponent {

    // componentDidMount() {
    //     this.fetchBannerList();
    // }

    // fetchBannerList = () => {
    //     Net.httpRequest('', null, (data)=>{
    //         if (data.Status === 0){
    //             const info = data.Data;
    //             console.log(info);
    //         }
    //     });
    // };

    render() {
        const lang = Intl.getLang();
        const LINK_URL = '/contractonline';
        const IMAGES_URL = lang === 'zh-cn' ? process.env.PUBLIC_URL + '/images/user-info/personal-banner-zh-cn-bg.jpg'
            : lang === 'en-us' ? process.env.PUBLIC_URL + '/images/user-info/personal-banner-en-us-bg.jpg'
            : null;
        return (
            <div className="personal-banner">
                <a href={LINK_URL} target="_blank">
                    <img src={IMAGES_URL} alt=""/>
                </a>
            </div>
        )
    }
}
