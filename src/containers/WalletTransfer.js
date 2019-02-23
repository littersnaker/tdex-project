import React from 'react';
import PureComponent from "../core/PureComponent";
import Net from '../net/net';
import { Link } from 'react-router';
import AccountModel from "../model/account";
import Decimal from '../utils/decimal';
import PopDialog from "../utils/popDialog"
import {toast} from "../utils/common"
import {Confirm} from '../components/Common';
import { CONST } from "../public/const";
import Intl from '../intl';
import Event from "../core/event";
import {SingleSelect, SelectOption} from "../components/SingleSelect";
import AssetMenu from '../components/AssetMenu';

class WalletTransfer extends PureComponent {
    constructor(props) {
        super(props);

        //是否桌面版
        this.isDesktop = process.env.VER_ENV=='desktop';

        this.accountList = [CONST.WALLET.TYPE.SPOT, CONST.WALLET.TYPE.FUT, CONST.WALLET.TYPE.CFD];
        this.accountName = {2:Intl.lang('Asset.bit'), 1:Intl.lang('Asset.ff_text'), 4:Intl.lang('Asset.cfd_text')};
        this.direction = {12:1, 21:2, 24:6, 42:5};   // @string key= from + to

        this.query = 0;
        this.CoinsMap = {};         // all coins map
        this.Products = {};         // account coins map
        this.fromAccountTab = (this.props.location && this.props.location.query.hasOwnProperty("tab")) ? this.props.location.query.tab : CONST.WALLET.TYPE.SPOT;
        this.toAccountTab = props.toType?props.toType:this.fromAccountTab==CONST.WALLET.TYPE.SPOT?CONST.WALLET.TYPE.FUT:CONST.WALLET.TYPE.SPOT;
        this.state = {
            fromAccountTab: this.fromAccountTab,
            toAccountTab: this.toAccountTab,

            Codes: "",
            balance: null,
            actNum: 0,
            errData: [''],

            showPro: false,
            showFrom: false,
            showTo:false,
            refreshLog: false,
            showLog:false   // 移动（旧）
        };
    }
    getSubNav(){
        return [
            {pathLink: '/asset',pathIcon: 'icon-wallet', pathName: Intl.lang('NavBar.103')},
            {pathLink: '/recharge',pathIcon: 'icon-recharge', pathName: Intl.lang('account.1_2')},
            {pathLink: '/withdrawals',pathIcon: 'icon-withdrawal', pathName: Intl.lang('account.1_3')},
            {pathLink: '/walletTransfer',pathIcon: 'icon-exchange', pathName: Intl.lang('WalletTransfer.theme')},
            {pathLink: '/transfer',pathIcon: 'icon-transfer', pathName: Intl.lang('Asset.102')},
            {pathLink: '/personal/billlog',pathIcon: 'icon-history', pathName: Intl.lang('Personal.billLog')}
        ];
    }
    componentWillUnmount(){
        super.componentWillUnmount();
    }
    setAccoutnTab(tab){
        this.fromAccountTab = tab;
        this.setState({fromAccountTab:tab});
    }
    queryHandle(){      // 指定账户
        if(this.props.isPop) return false;

        var query = this.props.location.query;
        var currency = query.currency, tab = query.tab;

        if(this.query){
            this.query = currency;
        }
        if(tab){
           this.setAccoutnTab(tab);
        }
    }
    componentWillMount() {
        Event.addListener(Event.EventName.PRODUCT_UPDATE, this.loadCodesList.bind(this), this);

        this.queryHandle();
        this.loadCodesList();
    }
    loadCodesList(){   // 获取 产品列表
        var pList = AccountModel.getProductCoins(), self = this;

        if(pList){
            this.saveProducts(pList);
        }else{
            AccountModel.loadProductCoins(null, function(data){
                if(data){
                    self.saveProducts(data.List);
                }
            }, this);
        }
    }
    getProductWallet(type) {  // 产品余额
        const walletMap = AccountModel.getWalletMap();
        const wMap = walletMap[type] ? walletMap[type] : [];

        return wMap;
    }
    filterProducts(pList){  // 筛选账户from-to可相互转账产品
        let { fromAccountTab } = this.state, filter = {1:0x02, 2:0x01, 4:0x02};    // 4 未定...
        let bit = filter[fromAccountTab];

        if(pList){
            var newPlist = [];
            for(var i in pList){
                if((pList[i].Types & bit) && (pList[i].Op & 0x08)){
                    newPlist.push(pList[i]);
                }
            }
            return newPlist;
        }
    }
    saveProducts(pList){  // 保存from产品列表
        this.CoinsMap = pList;
        this.Products = this.filterProducts(pList);
        if(this.Products && this.Products.length){
            var product = this.Products[0];
            if(this.query){
                product = this.setProduct(this.query);
            }else{
                this.setProduct(product.Id);
            }

            this.getWalletBalance(product.Id); // 获取产品余额data
        }
    }
    setProduct(cid){    // 保存默认选中产品info
        var product = {};
        for(var i in this.Products){
            let id = this.Products[i].Id;
            if(cid==id){
                product = this.Products[i];
                break;
            }
        }
        this.setState({Codes:product});
        return product;
    }
    getWalletBalance(cId, type){  //获取产品余额
        var self = this,
        params={
            Currency:Number(cId),
            Type:type?Number(type):Number(this.state.fromAccountTab)
        };
        Net.httpRequest("wallet/balance", params, (data)=>{
            if (data.Status == 0 && data.Data){
                var Info = data.Data;
                self.setState({balance:Info, showPro: false});
            }else{
                self.setState({balance:null});
            }
        }, this);
    }
    loadAccountAssetInfo(tab){      // 加载账户资产信息
        this.resetData();
        this.Products = this.filterProducts(this.CoinsMap);
        if(this.Products){
            let codeId = this.Products[0].Id;
            this.changeProduct(codeId);
            this.getWalletBalance(codeId, tab);
        }
    }
    swapProducts(){     // 切换调转
        let { fromAccountTab, toAccountTab } = this.state;
        this.setState({fromAccountTab:toAccountTab, toAccountTab:fromAccountTab},()=>{
            this.loadAccountAssetInfo(toAccountTab);  // 加载资产
        });
    }
    selectFromAccount(tab){     // 选择from
        let toTab = this.state.toAccountTab;
        if(tab==CONST.WALLET.TYPE.SPOT){
            for(let i in this.accountList){
                if(this.accountList[i] != tab){
                    toTab = this.accountList[i];
                    break;
                }
            }
        }else{
            toTab = CONST.WALLET.TYPE.SPOT;
        }
        this.setState({fromAccountTab:tab, toAccountTab: toTab},()=>{
            this.loadAccountAssetInfo(tab);  // 加载资产
        });
    }
    selectToAccount(toTab){     // 选择to
        if(this.state.toAccountTab != toTab){
            this.setState({toAccountTab: toTab});
        }
    }
    // 下拉 toggle
    toggleProduct(event){
        event.stopPropagation();

        this.setState({showPro: !this.state.showPro});
    }
    toggleFrom(event){
        event.stopPropagation();
        this.setState({showFrom: !this.state.showFrom});
    }
    toggleTo(event){
        event.stopPropagation();
        this.setState({showTo: !this.state.showTo});
    }
    closeAllSelect(event){
        event.stopPropagation();
        if(this.state.showPro || this.state.showFrom || this.state.showTo){
            this.setState({showPro: false, showFrom: false, showTo: false});
        }
    }
    closeProduct(event){
        event.stopPropagation();

        if(this.state.showPro){
            this.setState({showPro: false});
        }
    }
    showLog(flag){
        this.setState({showLog: flag});
    }

    resetData(){
        var initStete = {
            errData: [''],
            actNum:0
        };
        this.refs["tfNum"].value = "";
        this.setState(initStete);
    }
    changeProduct(id){
        if(!id || id==this.state.Codes.Id) return false;

        this.setProduct(id);
        this.getWalletBalance(id);

        this.resetData();
    }
    resetError(){
        this.setState({errData:['']});
    }
    checkMoney(){
        var { balance, errData } = this.state, type=0, txt="";
        var money = this.walletCounts(balance);

        var amount = this.refs['tfNum'].value, Amount = Number(amount);
        if(!amount){
            type = 3;
            txt = Intl.lang("form.error.empty");
        }else if(isNaN(Amount)){
            type = 3;
            txt = Intl.lang("Withdrawals.correct_input");
        }else if(!Amount || Amount<0.0001){
            type = 3;
            txt = Intl.lang("Transfer.error.min","0.0001");
        }else if(Amount > money.canUse){
            type = 3;
            txt = Intl.lang("Withdrawals.error.maxWith");
        }else if(!/^(-?\d+)(\.\d{1,8})?$/.test(Amount)){
            //type = 3;
            //txt = Intl.lang("Withdrawals.error.maxFloat", 8);
            this.setMaxWith(Amount);
        }

        errData[0] = txt;
        this.setState({errData:errData});			// console.log("check amount");
        return type;
    }
    checkHadEmpty(){
        if(this.checkMoney()){
            return true;
        }
        this.resetError();
        return false;
    }
    handleSubmit(event, isFast){
        event.stopPropagation();
        event.preventDefault();

        var { Codes } = this.state;
        if(!Codes){
            toast(Intl.lang("common.not_open"), true);
            return false;
        }

        var isErr = this.checkHadEmpty();
        if(isErr) return false;

        if(isFast){
            this.walletWithdraw();
        }else{
            this.popVerify();
        }
    }
    popVerify(){
        //PopDialog.open(<Verify path="disTips" verify="normal" onChange={(codeType)=>this.popCallback(codeType)} datafor="exchange"/>, 'simple_lang');

        var self = this, { Codes, actNum } = this.state;
        let numTxt = actNum +" "+ Codes.Code;

        PopDialog.open(<Confirm title={Intl.lang("WalletTransfer.theme")} content={Intl.lang("WalletTransfer.confirm", numTxt)} callback={()=>this.walletWithdraw()}/>, "alert_panel");
    }
    popCallback(codeType){
        if(codeType=="close"){
            PopDialog.close("pn_alert_panel");
            return;
        }

        this.walletWithdraw(codeType);
    }
    walletWithdraw(){
        let { Codes, fromAccountTab, toAccountTab, refreshLog } = this.state;
        let params = {}, key = fromAccountTab+""+toAccountTab, dir = this.direction[key];

        params.Currency = Number(Codes.Id);
        params.Direction = Number(dir);
        params.Amount = Number(this.refs['tfNum'].value);

        Net.httpRequest("wallet/switch", params, (data)=>{
            if (data.Status == 0){
                var Info = data.Data;
                this.setState({balance:Info,refreshLog: !refreshLog});
                this.refs["tfNum"].value = "";

                PopDialog.close();
                toast(Intl.lang("WalletTransfer.success"));
            }else{

            }
        }, this);
    }
    setMaxWith(canUse, evt){
        if(evt) evt.stopPropagation();

        this.refs["tfNum"].value = Number(canUse.toString().match(/^\d+(?:\.\d{0,8})?/));
        this.setState({actNum : Number(canUse)});
    }
    // 计算手续费
    setFeeNum(){
        var { Codes } = this.state;
        if(!Codes) return;

        var errType = this.checkMoney();

        if(!errType){
            this.getActual();
        }
    }
    getActual(){
        var withNum = Number(this.refs["tfNum"].value);
        if(!withNum) return false;

        this.setState({actNum : withNum});
    }
    walletCounts(balance){
        var Counts=0, freeze=0, canUse=0;
        if(balance){
            freeze = Number(Decimal.accAdd(balance.Lock,Decimal.accAdd(Decimal.accAdd(balance.Transfer,balance.Deposit),balance.Withdraw)));
            Counts = Number(Decimal.accAdd(freeze, Decimal.accSubtr(balance.Quantity,balance.Unconfirm)));
            canUse = Counts > 0 ? Number(balance.Available) : 0;  // Number(Decimal.accAdd(balance.Lock,balance.Quantity)) : 0;
        }

        return {Counts: Counts, Freeze: freeze, canUse: canUse}
    }
    getToAccount(){ // 筛选toAccount
        const accountList = this.accountList, { fromAccountTab , toAccountTab} = this.state;
        let toAccount = [];

        if(fromAccountTab==CONST.WALLET.TYPE.SPOT){
            for(let i in accountList){
                if(accountList[i] != fromAccountTab && accountList[i] != toAccountTab){
                    toAccount.push(accountList[i]);
                }
            }
        }else{
            toAccount.push(CONST.WALLET.TYPE.SPOT);
        }

        return toAccount;
    }
    render() {
        const { fromAccountTab, toAccountTab, balance, Codes, errData, refreshLog, showLog, showPro, showFrom, showTo } = this.state, { isPop, toType } = this.props;
        var Counts = "0.00000000", canUse="0.00000000", Code="";
        if(Codes){
            Code = Codes.Code;
        }

        if(balance){
            var money = this.walletCounts(balance);
            Counts = Decimal.format(money.Counts,8).toString();
            canUse = Decimal.format(money.canUse,8).toString();
        }
        const toAccount = this.getToAccount(), path=this.getSubNav();

        return(
            !isPop?
                <React.Fragment>
                    <div className="main-content-part" onClick={(e)=>this.closeAllSelect(e)}>
                        <div className="contain asset-section">
                            <AssetMenu path={path} />
                            <div className="asset-theme mt-30">{Intl.lang("WalletTransfer.theme")}</div>
                            <div className="asset-contain mt-10">
                                <div className="asset-contain-main">
                                    <div className="asset-contain-main-l wp-50">
                                        <div className="label-block">
                                            <div className="more-input pos-r wp-100">
                                                <div className="pdr-5"><span>{Intl.lang("WalletTransfer.from")}</span></div>
                                                <div className="select-box wp-50">
                                                    <div className="select" onClick={this.toggleFrom.bind(this)}>
                                                        <div className="currency_text">{this.accountName[fromAccountTab]}</div>
                                                        <div className="pdr-10 point"><i className={"iconfont icon-xiala "+(showFrom?"on":"")}></i></div>
                                                    </div>
                                                    {showFrom &&<div className="select-option">
                                                        <ul>
                                                            {this.accountList.map((item, i)=>{
                                                                return <li key={"from"+i} onClick={()=>this.selectFromAccount(item)}>{this.accountName[item]}</li>
                                                            })}
                                                        </ul>
                                                    </div>}
                                                </div>

                                                <div onClick={this.swapProducts.bind(this)}><i className="iconfont icon-change change-radio"></i></div>
                                                <div className="pdr-5">{Intl.lang("WalletTransfer.to")}</div>

                                                <div className="select-box wp-50">
                                                    <div className="select" onClick={this.toggleTo.bind(this)}>
                                                        <div className="currency_text">{this.accountName[toAccountTab]}</div>
                                                        <div className="pdr-10 point"><i className={"iconfont icon-xiala "+(showTo?"on":"")}></i></div>
                                                    </div>
                                                    {showTo &&<div className="select-option">
                                                        <ul>
                                                            {toAccount.map((item, j)=>{
                                                                return <li key={"to"+j} onClick={()=>this.selectToAccount(item)}>{this.accountName[item]}</li>
                                                            })}
                                                        </ul>
                                                    </div>}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="hor-line-20"></div>

                                        <dl className="label-block mt-15">
                                            <dt>{Intl.lang("Asset.105")}</dt>
                                            <dd className="pos-r wp-80">
                                                <div className="more-input">
                                                    <div className="select-box">
                                                        <div className="select" onClick={(e)=>this.toggleProduct(e)}>
                                                            <div className="currency_text"><h4>{Code}</h4></div>
                                                            <div className="pdr-10 point"><i className={"iconfont icon-xiala "+(showPro?"on":"")}></i></div>
                                                        </div>
                                                        {showPro &&<div className="select-option">
                                                            <ul>
                                                                {this.Products && this.Products.map((item, index)=>{
                                                                    return <li key={"s"+index} onClick={()=>this.changeProduct(item.Id)}>{item.Code}</li>
                                                                })}
                                                                {!this.Products.length && <li className="tc c-8">{Intl.lang("ico.noData")}</li>}
                                                            </ul>
                                                        </div>}
                                                    </div>
                                                </div>
                                            </dd>
                                        </dl>
                                        <form className="label-block mt-20" onSubmit={(e)=>{this.handleSubmit(e, true)}} autoComplete="off">
                                            <dt>{Intl.lang("WalletTransfer.amounts")}</dt>
                                            <dd className="wp-80">
                                                <div className="pos-r">
                                                    <div className={"input-border "+(errData[0]?"bd-err":"")}>
                                                        <input type="text" ref="tfNum" onChange={()=>this.setFeeNum()} placeholder={Intl.lang("recharge.canUse")+" "+canUse} maxLength="15"/>
                                                        <div className="pd010 point code-unit" onClick={(e)=>this.setMaxWith(canUse,e)}>{Intl.lang("WalletTransfer.all")}</div>
                                                    </div>
                                                    {(errData[0]!="") &&<div className="warn-tip"><i className="iconfont icon-tips fs12"></i><span>{errData[0]}</span></div>}
                                                </div>
                                                <div className="commit-box mt-30">
                                                    {/*<button type="submit" className={"btn wp-100 "+((Counts>0)?"":"btnDis")}>{Intl.lang("WalletTransfer.confirmTransfer")}</button>*/}
                                                    <button type="submit" className="btn wp-100">{Intl.lang("WalletTransfer.confirmTransfer")}</button>
                                                </div>
                                            </dd>
                                        </form>
                                    </div>

                                    <div className="ver-line"></div>

                                    <div className="asset-contain-main-r wp-50">
                                        <div className="asset-contain-tips">
                                            <h4>{Intl.lang("Recharge.tips")}</h4>
                                            <ul className="number-li">
                                                <li>
                                                    <p>{Intl.lang("WalletTransfer.tips1")}</p>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <ExchangeHistory product={Codes} coinsMap={this.CoinsMap} refresh={refreshLog}/>
                        </div>
                    </div>
                    {/*
            <div className="inside-page-web hide" onClick={(e)=>this.closeProduct(e)}>
                <div className="inside-web-part">
                    <CrumbsLink pathData={path}/>
                    <div className="withdrawal">
                        <div className="w-head-top m-head-top pc-hide" onClick={this.resetData.bind(this)}>
                            <h3 onClick={()=>this.showLog(false)} className={"fl "+(showLog?"m-under-l":"")}>{Intl.lang("WalletTransfer.theme")}</h3>
                            <h3 onClick={()=>this.showLog(true)} className={"pc-hide fr "+(showLog?"":"m-under-l")}>{Intl.lang("Recharge.log")}</h3>
                        </div>
                        <div className={showLog == false?"currency_left transfer-box":"currency_left transfer-box m-hide"}>

                            <div className="exchange-info">
                                <dl className="wp-33">
                                    <dt>
                                        <div className="select pdl-20">{fromAccountTab==CONST.WALLET.TYPE.SPOT?Intl.lang("Asset.bit"):Intl.lang("Asset.contract")}</div>
                                    </dt>
                                </dl>
                                <div className="wp-33 md-text">
                                    <span className="swap-btn" onClick={this.swapProducts.bind(this)}><i className="iconfont icon-change tb"></i></span>
                                </div>
                                <dl className="wp-33">
                                    <dt>
                                        <div className="select pdl-20">{fromAccountTab==CONST.WALLET.TYPE.FUT?Intl.lang("Asset.bit"):Intl.lang("Asset.contract")}</div>
                                    </dt>
                                </dl>
                            </div>

                            <div className="pos-r">
                                <h5 className="lh-32">{Intl.lang("Asset.105")}</h5>
                                <div className="select" onClick={(e)=>this.toggleProduct(e)}>
                                    <div className="currency_pic"></div>
                                    <div className="currency_text">
                                        <h4>{Code}</h4>
                                    </div>
                                    <div className="triangle">
                                        <i className={showPro==false?'iconfont icon-dropDown c-8':'iconfont icon-dropUp c-8'}></i>
                                    </div>
                                </div>
                                {showPro &&
                                <div className="select_option wp-100" style={{top:70}}>
                                    <ul>
                                        {this.Products && this.Products.map((item, index)=>{
                                            return <li key={index} onClick={()=>this.changeProduct(item.Id)}>
                                                <div className="currency_pic"></div>
                                                <div className="currency_text">
                                                    <h4>{item.Code}</h4>
                                                </div>
                                            </li>
                                        })}
                                        {!this.Products.length && <li className="tc"><div className="currency_text c-8"><h4>{Intl.lang("ico.noData")}</h4></div></li>}
                                    </ul>
                                </div>
                                }
                            </div>
                            <form className="mt-20" onSubmit={(e)=>{this.handleSubmit(e, true)}} autoComplete="off">

                                <div className="input_box2">
                                    <h5 className="lh-32">{Intl.lang("WalletTransfer.amounts")}</h5>
                                    <div className="address f-clear">
                                        <div className={"ipt ipt-box pos-r "+(errData[0]?"bd-err":"")}>
                                            <input type="text" ref="tfNum" onChange={()=>this.setFeeNum()} placeholder={Intl.lang("tradeInfo.2_25")} maxLength="15"/>

                                            <div className="withUse" onClick={(e)=>this.setMaxWith(canUse,e)}>{Intl.lang("Withdrawals.103")}<span>{canUse}</span></div>
                                        </div>
                                        <div className="ipt-box unit-bdl-none transfer-all" onClick={(e)=>this.setMaxWith(canUse,e)}>{Intl.lang("connect.1_1")}</div>
                                    </div>
                                    {(errData[0]!="") && <div className="red2 fem75 mt-5">{errData[0]}</div>}
                                </div>

                                <div className="input_box3">
                                    <button type="submit" className={"mt-20 btn "+((Counts>0)?"":"btnDis")}>{Intl.lang("WalletTransfer.confirmTransfer")}</button>
                                </div>
                            </form>
                        </div>
                        <div className={!showLog == true?"m-hide":"transfer-log-box"}>
                            <ExchangeHistory product={Codes} coinsMap={this.CoinsMap} refresh={refreshLog}/>
                        </div>
                    </div>
                </div>
            </div>
                    */}
                </React.Fragment>
            :
            <section className={"ft-trade-easy-panel shadow-w "+(toType==CONST.WALLET.TYPE.CFD?"ft-cfd":"")} id="pop-transfer" style={{minWidth: "320px"}}>
                <header className="dialog-head tc lh-25">
                    <i className="iconfont icon-close transit fem875" onClick={()=>PopDialog.close()}></i>
                </header>
                <div className="ft-easy-dialog-detail">
                    <div className="tc">
                        <h3>{Intl.lang("WalletTransfer.theme")}</h3>
                        <div className="mt-40 fs18 c-d">
                            <span>{fromAccountTab==CONST.WALLET.TYPE.SPOT?Intl.lang("Asset.bit"):fromAccountTab==CONST.WALLET.TYPE.FUT?Intl.lang("Asset.contract"):Intl.lang("Asset.cfd_text")}</span>
                            <span className="pd010 fs16 cursorLight" onClick={this.swapProducts.bind(this)}><i className="iconfont icon-change"></i></span>
                            <span>{toAccountTab==CONST.WALLET.TYPE.SPOT?Intl.lang("Asset.bit"):toAccountTab==CONST.WALLET.TYPE.FUT?Intl.lang("Asset.contract"):Intl.lang("Asset.cfd_text")}</span>
                        </div>
                    </div>

                    <form className="ft-transfer ft-newOrder-easy ft-calculator-detail" onSubmit={(e)=>{this.handleSubmit(e, true)}} autoComplete="off">
                        <dl className="mt-30 ft-order-box flex-sb lh-28">
                            <dt>{Intl.lang("WalletTransfer.transferCode")}</dt>
                            <dd className="ft-transfer-select">
                                <SingleSelect className="ft-transfer-select cursor-h" value={Codes.Id} onChange={this.changeProduct.bind(this)}>
                                    {this.Products && this.Products.map((item, v)=>{
                                        return <SelectOption className={null} value={item.Id} key={"ty"+v}>{item.Code}</SelectOption>
                                    })}
                                </SingleSelect>
                            </dd>
                        </dl>

                        <div className="pos-r mt-30">
                            {(errData[0]!="") && <dl className="flex-sb errBox"><dt></dt><dd className="errTip fem75"><i className="iconfont icon-tips fs12"></i> {errData[0]}</dd></dl>}
                            <dl className="flex-sb lh-28">
                                <dt>{Intl.lang("WalletTransfer.amounts")}</dt>
                                <dd className={"slider-number-box ver-md "+(errData[0]?"bd-err":"")}>
                                    <div className="ft-transfer-all" onClick={(e)=>this.setMaxWith(canUse,e)}><span>{Intl.lang("WalletTransfer.all")}</span></div>
                                    <input className="wp-100" type="text" ref="tfNum" onChange={()=>this.setFeeNum()} placeholder={Intl.lang("tradeInfo.2_25")} maxLength="15" />
                                </dd>
                            </dl>
                        </div>
                        <div className="mt-10 flex-sb c-8">
                            <p></p>
                            <p><span>{Intl.lang("Withdrawals.103")}</span><span className="c-d">{canUse}</span></p>
                        </div>
                        <div className="easy-dialog-foot mt-50">
                            <button className="btn easy-btn-submit wp-100 fs18">{Intl.lang("WalletTransfer.confirmTransfer")}</button>
                        </div>
                    </form>
                    {!this.isDesktop && <div className="mt-20 tr">
                        <span className="c-8">{Intl.lang("Transfer.tip.enough")}</span><a className="cur-hover" href="/recharge" target="_blank">{Intl.lang("Transfer.tip.recharge")}</a>
                    </div>}
                </div>
            </section>
        )
    }
}
export default WalletTransfer;

class ExchangeHistory extends PureComponent{
    constructor(props) {
        super(props);

        this.CoinsMap = null;
        this.product = null;
        this.refresh = false;
        this.state = {
            curPage: 1,
            historyList:{List: [], PageSize: 10} //最新成交
        };
    }
    componentWillMount(){
    }
    getHistory(page){
        var curPage = page || this.state.curPage;
        //const cId = this.product.Id;
        //if(!cId) return false;

        var self = this;
        Net.httpRequest("wallet/orders", {Type:3, Page:curPage, PageSize:5}, (data)=>{
            if (data.Status == 0){
                var Info = data.Data;
                self.setState({historyList:Info, curPage:Info.Page});
            }else{

            }
        }, this);
    }
    resetCoinsMap(pList){
        var newPlist = {};
        pList.forEach((item)=>{
            newPlist[item.Id] = item;
        });
        this.CoinsMap = newPlist;
    }
    componentWillReceiveProps(nextProps){
        var update = nextProps.refresh;
        if(!this.product){
            this.product = nextProps.product;
            this.resetCoinsMap(nextProps.coinsMap);
            this.getHistory();
        }
        if(this.refresh != update){
            this.product = nextProps.product;
            this.refresh = update;
            this.getHistory();
        }
    }
    turnPage(page){
        this.getHistory(page);
    }
    // getAccountName(action){
    //     let accountName = {};
    //     if(action==8001){
    //         accountName.FromAccount = Intl.lang("Asset.bit");
    //         accountName.ToAccount = Intl.lang("Asset.contract");
    //     }else if(action==8002){
    //         accountName.FromAccount = Intl.lang("Asset.contract");
    //         accountName.ToAccount = Intl.lang("Asset.bit");
    //     }else{
    //         accountName.FromAccount = "--";
    //         accountName.ToAccount = "--";
    //     }
    //     return accountName;
    // }
    getProductName(id){
        if(this.CoinsMap){
            return this.CoinsMap[id].Code;
        }
    }
    render(){
        const {historyList} = this.state;
        var self = this;
        return (
            <React.Fragment>
                <div className="record-lists mt-10">
                    <div className="lists-header">
                        <h3>{Intl.lang("Recharge.log")}</h3><Link to='/personal/billlog?t=3'>{Intl.lang("common.viewMore")}<i className="iconfont icon-arrow-l"></i></Link>
                    </div>
                    <div className="log-list-overflow">
                        <div className="lists-content ov-w-rows6">
                            <ul className="lists-theme">
                                <li style={{width:"102%"}}>{Intl.lang("accountSafe.1_102")}</li>
                                <li>{Intl.lang("Asset.105")}</li>
                                <li>{Intl.lang( "tradeHistory.1_9")}</li>
                                <li>{Intl.lang("Billlog.transfer.side")}</li>
                                <li>{Intl.lang("recharge.1_23")}</li>
                            </ul>
                            {(historyList.hasOwnProperty("Total") && historyList.Total > 0) && historyList.List.map((item, index) => {
                                let fromCode = self.getProductName(item.Currency);
                                return <ul className="lists-list" key={index}>
                                    <li style={{width:"102%"}}>{(item.CreateTime).substring(0, 16)}</li>
                                    <li>{fromCode}</li>
                                    <li>{Decimal.format(item.Amount,8)}</li>
                                    <li>{Intl.lang("Asset.Action.type"+item.Action)}</li>
                                    <li>{Intl.lang("EXCHANGE.STATUS." + item.Status)}</li>
                                </ul>
                            })}
                            {(!historyList.List || !historyList.List.length) && <div className="no-list-data show-5">
                                <div className="no-list-data-pic"></div>
                                <p>{Intl.lang("bank.1_27")}</p>
                            </div>}
                        </div>
                    </div>
                </div>
            </React.Fragment>
        )
    }
}
