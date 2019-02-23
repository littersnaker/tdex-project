import React from 'react';
import PureComponent from "../core/PureComponent";
import Net from '../net/net';
import { Link } from 'react-router';
import AccountModel from "../model/account";
import GlobalStore from '../stores';
import Decimal from '../utils/decimal';
import PopDialog from "../utils/popDialog"
import {toast} from "../utils/common"
import {Confirm} from '../components/Common';
import Pager from '../components/Pager'
//import Verify from './Verify'
import Valiate from '../utils/valiate';

import Intl from '../intl';
import Event from "../core/event";

// const LANG = window.LANG;
class WalletExchange extends PureComponent {
    constructor(props) {
        super(props);

        this.query = 0;
        this.CoinsMap = {};         // all coins map
        this.fromProducts = [];     // can exchange products
        this.safeBind = false;
        this.askTimer = null;
        this.state = {
            Codes: "",
            balance: null,
            FeeNum: 0,
            actNum: 0,

            AskPrice:0,
            toProducts:[],
            toCodes:"",

            showPro: false,
            errData: [''],

            refreshLog: false,
            showLog:false
        };
    }
    componentWillUnmount(){
        this.closeTimer();
        super.componentWillUnmount();
    }

    queryHandle(){
        var query = this.props.location.query;

        var currency = query.currency;
        if(this.query== currency){ return false; }
        this.query = currency;
    }
    componentWillMount() {
        Event.addListener(Event.EventName.PRODUCT_UPDATE, this.loadCodesList.bind(this), this);

        this.queryHandle();
        this.loadCodesList();

        var uInfo = GlobalStore.getUserInfo();
        if(uInfo.GgAuth || uInfo.Mobile){
            this.safeBind = true;
        }
    }
    loadCodesList(){
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
    resetCoinsMap(pList){
        var newPlist = {};
        pList.forEach((item)=>{
            newPlist[item.Id] = item;
        });
        this.CoinsMap = newPlist;
    }
    filterCoins(pList){
        var newPlist = [];
        for(var i in pList){
            if(pList[i].Exchange){
                newPlist.push(pList[i]);
            }
        }
        return newPlist;
    }
    saveProducts(pList){
        this.resetCoinsMap(pList);

        this.fromProducts = this.filterCoins(pList);
        if(this.fromProducts && this.fromProducts.length){
            var product = this.fromProducts[0];
            if(this.query){
                product = this.setProducts(this.query);
            }else{
                this.setProducts(product.Id);
            }

            this.getWalletBalance(product.Id);
            this.changeProductPrice();
        }
    }
    setProducts(cid){
        var product = {}, toProducts = [];
        for(var i in this.fromProducts){
            let id = this.fromProducts[i].Id;
            if(cid==id){
                product = this.fromProducts[i];
                toProducts = this.saveToProducts(product.Exchange["To"]);
                break;
            }
        }
        this.setState({Codes:product, toCodes:toProducts[0], toProducts: toProducts});

        return product;
    }
    saveToProducts(list){
        if(!list || !list.length) return false;

        var newPlist = [];
        for(var i in list){
            let id = list[i];
            if(this.CoinsMap[id]){
                newPlist.push(this.CoinsMap[id]);
            }
        }
        return newPlist;
    }
    setToProducts(toId){
        var {toProducts} = this.state, toCodes = {};
        for(var i in toProducts){
            let id = toProducts[i].Id;
            if(toId==id){
                toCodes = toProducts[i];
                break;
            }
        }

        this.setState({toCodes:toCodes});
        return toCodes;
    }

    getWalletBalance(cId){
        var self = this;
        Net.httpRequest("wallet/balance", {Currency:Number(cId)}, (data)=>{
            if (data.Status == 0 && data.Data){
                var Info = data.Data;
                self.setState({balance:Info, showPro: false});
            }else{
                self.setState({balance:null});
            }
        }, this);
    }
    swapProducts(){
        let {toCodes} = this.state;

        if(toCodes){
            this.resetData();

            this.setProducts(toCodes.Id);
            this.getWalletBalance(toCodes.Id);
            this.changeProductPrice();
        }
    }

    changeProductPrice(){
        setTimeout(()=>{
            this.loadPrice();
            this.getExchangePrice();
        },300);
    }
    closeTimer(){
        if(this.askTimer){
            clearInterval(this.askTimer);
            this.askTimer = null;
        }
    }
    loadPrice(){
        this.closeTimer();

        this.askTimer = setInterval(()=>{
            this.getExchangePrice();
        },1000);
    }
    getExchangePrice(){
        let { Codes, toCodes } = this.state;
        let fromId=Codes.Id, toId=toCodes.Id;

        if(!fromId || !toId || fromId==toId) return false;

        Net.httpRequest("wallet/exchangePrice", {From:Number(fromId), To:Number(toId)}, (data)=>{
            if (data.Status == 0 && data.Data){
                var Info = data.Data;
                this.setState({AskPrice:Info.Price});
            }else{

            }
        }, this);
    }

    resetData(){
        var initStete = {
            errData: [''],
            actNum:0
        };
        this.refs["tfNum"].value = "";
        this.setState(initStete);
    }
    changeProduct(id, dir){
        if(!id || id==this.state.Codes.Id) return false;

        if(dir=="from"){
            this.setProducts(id);
            this.getWalletBalance(id);
        }else{
            this.setToProducts(id);
        }
        this.changeProductPrice();
        this.resetData();
    }

    closeProduct(event){
        event.stopPropagation();

        if(this.state.showPro){
            this.setState({showPro: false});
        }
    }
    resetError(){
        this.setState({errData:['']});
    }
    checkMoney(){
        var { balance, Codes, errData } = this.state, type=0, txt="";
        var money = this.walletCounts(balance);
        let exchange = Codes.Exchange;

        var amount = this.refs['tfNum'].value, Amount = Number(amount);
        if(!amount){
            type = 3;
            txt = Intl.lang("form.error.empty");
        }else if(isNaN(Amount)){
            type = 3;
            txt = Intl.lang("Withdrawals.correct_input");
        }else if(!Amount || Amount<exchange.Min){
            type = 3;
            txt = Intl.lang("Transfer.error.min",exchange.Min);
        }else if(Amount>exchange.Max){
            type = 3;
            txt = Intl.lang("Exchange.error.maxWith");
        }else if(!/^(-?\d+)(\.\d{1,4})?$/.test(Amount)){
            type = 3;
            txt = Intl.lang("Withdrawals.error.maxFloat", 4);
        }else if(money.canUse < Amount){
            type = 3;
            txt = Intl.lang("Withdrawals.error.maxWith");
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
    handleSubmit(event){
        event.stopPropagation();
        event.preventDefault();

        if(!this.safeBind){
            toast(Intl.lang("Withdrawals.119"), true);
            return false;
        }

        var { Codes } = this.state;
        if(!Codes){
            toast(Intl.lang("common.not_open"), true);
            return false;
        }

        var isErr = this.checkHadEmpty();
        if(isErr) return false;

        this.popVerify();
    }
    popVerify(){
        //PopDialog.open(<Verify path="disTips" verify="normal" onChange={(codeType)=>this.popCallback(codeType)} datafor="exchange"/>, 'simple_lang');

        var self = this, { toCodes, actNum } = this.state;
        let numTxt = actNum +" "+ toCodes.Code;

        PopDialog.open(<Confirm title={Intl.lang("Asset.exchange")} content={Intl.lang("Exchange.confirm", numTxt)} callback={()=>this.walletWithdraw()}/>, "alert_panel");
    }
    popCallback(codeType){
        if(codeType=="close"){
            PopDialog.close();
            return;
        }

        this.walletWithdraw(codeType);
    }
    walletWithdraw(){
        let { Codes, toCodes, refreshLog } = this.state;

        let params = {};
        params.From = Number(Codes.Id);
        params.To = Number(toCodes.Id);
        params.Amount = Number(this.refs['tfNum'].value);

        var self = this;
        Net.httpRequest("wallet/exchange", params, (data)=>{
            if (data.Status == 0){
                PopDialog.close();

                var Info = data.Data;
                self.setState({balance:Info,refreshLog: !refreshLog});

                toast(Intl.lang("Exchange.success"));
            }else{

            }
        }, this);
    }
    setMaxWith(canUse, evt){
        evt.stopPropagation();

        var { Codes } = this.state, maxNum=0, minNum=0, actNum=canUse;
        if(Codes.Exchange){
            maxNum = Codes.Exchange.Max;
            minNum = Codes.Exchange.Min;
        }
        if(canUse>maxNum) actNum = maxNum;
        if(canUse<minNum) actNum = minNum;
        if(canUse==0) actNum = 0;

        this.refs["tfNum"].value = Number(actNum);
        this.setFeeNum();
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
        var withNum = this.refs["tfNum"];
        if(!withNum) return false;

        var { AskPrice, Codes } = this.state, amount = Number(withNum.value), actual = 0;

        if(!isNaN(amount)){
            // BTC -> USDT = Amount * Price;  USDT -> BTC = Amount / Price
           if(Codes.Code=="BTC"){
               actual = Number(Decimal.accMul(amount, AskPrice, 4));
           }else if(Codes.Code=="USDT"){
               actual = Number(Decimal.accDiv(amount, AskPrice, 4));
           }
        }

        this.setState({actNum : actual});
    }
    walletCounts(balance){
        var Counts=0, freeze=0, canUse=0;
        if(balance){
            freeze = Number(Decimal.accAdd(balance.Lock,Decimal.accAdd(Decimal.accAdd(balance.Transfer,balance.Deposit),balance.Withdraw)));
            Counts = Number(Decimal.accAdd(freeze, Decimal.accSubtr(balance.Quantity,balance.Unconfirm)));
            canUse = Counts > 0 ? Number(Decimal.accAdd(balance.Lock,balance.Quantity)) : 0;
        }

        return {Counts: Counts, Freeze: freeze, canUse: canUse}
    }
    showLog(flag){
        this.setState({showLog: flag});
    }
    render() {
        const { AskPrice, toProducts, balance, Codes, toCodes, actNum, FeeNum, errData, refreshLog, showLog } = this.state;
        var Counts = "0.0000", canUse="0.0000", Code="", toCode="", minAmount="", maxAmount="";
        if(Codes){
            Code = Codes.Code;
            minAmount = Codes.Exchange.Min;
            maxAmount = Codes.Exchange.Max;
        }
        if(toCodes) toCode = toCodes.Code;

        if(balance){
            var money = this.walletCounts(balance);
            Counts = Decimal.format(money.Counts,4).toString();
            canUse = Decimal.format(money.canUse,4).toString();
        }
        return(
            <div className="okk-trade-contain" onClick={(e)=>this.closeProduct(e)}>
                <div className="contain pdb-50">
                    <div className="withdrawal">
                        <div className="w-head-top m-head-top" onClick={this.resetData.bind(this)}>
                            <h3 onClick={()=>this.showLog(false)} className={"fl "+(showLog?"m-under-l":"")}>{Intl.lang("Asset.exchange")}</h3>
                            <h3 onClick={()=>this.showLog(true)} className={"pc-hide fr "+(showLog?"":"m-under-l")}>{Intl.lang("Recharge.log")}</h3>
                        </div>
                        <div className={showLog == false?"currency_left transfer-box":"currency_left transfer-box m-hide"}>

                            <div className="exchange-info">
                                <dl className="wp-33">
                                    <dt>
                                        <ExchangeProduct products={this.fromProducts} Code={Code} dir="from" onChange={this.changeProduct.bind(this)} />
                                    </dt>
                                </dl>
                                <div className="wp-33 md-text">
                                    <span className="swap-btn" onClick={this.swapProducts.bind(this)}><i className="iconfont icon-change tb"></i></span>
                                </div>
                                <dl className="wp-33">
                                    <dt>
                                        <ExchangeProduct products={toProducts} dir="to" Code={toCode} onChange={this.changeProduct.bind(this)}/>
                                    </dt>
                                </dl>
                            </div>
                            <form className="Withdrawal_form" onSubmit={(e)=>{this.handleSubmit(e)}} autoComplete="off">
                                <h4>{Intl.lang("Recharge.note")}</h4>
                                <ul>
                                    <li>
                                        <p>{Intl.lang("Exchange.note1", Code, minAmount, maxAmount+""+Code)}</p>
                                    </li>
                                    <li>
                                        <p>{Intl.lang("Exchange.note2")}</p>
                                    </li>
                                </ul>
                                <div className="input_box mt-20">
                                    <span className="tb">{Intl.lang("Exchange.price")}{Intl.lang("common.symbol.colon")}</span><span className="c-8">{AskPrice}</span>
                                </div>
                                <div className="input_box2">
                                    <div className="f-clear">
                                        <h5>{Intl.lang("Exchange.amount")}</h5>
                                    </div>
                                    <div className="address f-clear">
                                        <div className={"ipt ipt-box pos-r wp-100 "+(errData[0]?"bd-err":"")}>
                                            <input type="text" ref="tfNum" onChange={()=>this.setFeeNum()} placeholder={Intl.lang("tradeInfo.2_25")} maxLength="15"/>

                                            <div className="withUse" onClick={(e)=>this.setMaxWith(canUse,e)}>{Intl.lang("Withdrawals.103")}<span>{canUse}</span></div>
                                        </div>
                                    </div>
                                    {(errData[0]!="") && <div className="red2 fem75 mt-5">{errData[0]}</div>}
                                </div>

                                <div className="input_box3">
                                    <h5 className="trade-order-head-unline c-8 hide">{Intl.lang("Withdrawals.fee")}<span>{FeeNum}</span></h5>
                                    <h5>{Intl.lang("Exchange.getAmount")}<span>{actNum}</span></h5>

                                    <button type="submit" className={"btn "+((this.safeBind&&Counts>0)?"":"btnDis")}>{Intl.lang("Exchange.exchange")}</button>
                                </div>

                                {(!this.safeBind) && <dl className="form-box last-form-box f-clear fem75 mt-15">
                                    <dd>
                                        <Link className="green4 fs14 cursor warn" to="/personal/securitysetting">{Intl.lang("Withdrawals.119")}</Link>
                                    </dd>
                                </dl>}
                            </form>
                        </div>
                        <div className={!showLog == true?"m-hide":"transfer-log-box"}>
                            <ExchangeHistory coinsMap={this.CoinsMap} refresh={refreshLog}/>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}
export default WalletExchange;

class ExchangeHistory extends PureComponent{
    constructor(props) {
        super(props);

        this.CoinsMap = null;
        this.refresh = false;
        this.state = {
            curPage: 1,
            historyList:{List: [], PageSize: 10} //最新成交
        };
    }
    componentWillMount(){
        this.getHistory();
    }
    getHistory(page){
        var curPage = page || this.state.curPage;

        var self = this;
        Net.httpRequest("wallet/exchangeHistory", {Page:curPage, PageSize:10}, (data)=>{
            if (data.Status == 0){
                var Info = data.Data;
                self.setState({historyList:Info, curPage:Info.Page});
            }else{

            }
        }, this);
    }
    componentWillReceiveProps(nextProps){
        var update = nextProps.refresh;
        if(this.refresh != update){
            this.refresh = update;
            this.getHistory();
        }
        if(!this.CoinsMap){
            this.CoinsMap = nextProps.coinsMap;
        }
    }
    turnPage(page){
        this.getHistory(page);
    }

    getProductName(id){
        if(this.CoinsMap){
            return this.CoinsMap[id].Code;
        }
    }
    render(){
        const {historyList} = this.state;
        var self = this;
        return (
            <div className="record_right pos-r">
                <div className="historical">
                    <h4>{Intl.lang("Recharge.log")}</h4>
                </div>
                <div className="trade-order-log pos-r">
                    <dl className="log-title dl-16 f-clear">
                        <dd>{Intl.lang("accountSafe.1_102")}</dd><dd>{Intl.lang("TradeHistory.103")}</dd><dd>{Intl.lang("tradeHistory.1_9")}</dd><dd>{Intl.lang("Exchange.actual")}</dd><dd>{Intl.lang("Exchange.price")}</dd><dd>{Intl.lang("recharge.1_23")}</dd>
                    </dl>
                    <div className="log-contain log-list">
                        {(!historyList&&!historyList.length) && <p className="mt-30 tc">{Intl.lang("bank.1_27")}</p>}
                        {(historyList.hasOwnProperty("Total") && historyList.Total > 0) && historyList.List.map((item, index)=>{
                            let fromCode = self.getProductName(item.Currency), toCode = self.getProductName(item.Target);
                            return <dl className="dl-16 f-clear" key={index}>
                                <dd>{(item.CreateTime).substring(0, 16)}</dd><dd>{fromCode+'/'+toCode}</dd><dd>{item.Amount}</dd><dd>{item.TargetAmount}</dd><dd>{item.Price}</dd><dd>{Intl.lang("EXCHANGE.STATUS."+item.Status)}</dd>
                            </dl>})}
                        {(historyList.hasOwnProperty("PageCount") && historyList.PageCount > 1) &&
                        <Pager className="pagePos" data={historyList} onChange={this.turnPage.bind(self)} style={{bottom:"-45px"}}/>
                        }
                    </div>
                </div>
            </div>
        )
    }
}

class ExchangeProduct extends PureComponent{
    constructor(props) {
        super(props);

        this.state = {
            showPro:false
        };
    }
    toggleProduct(event){
        event.stopPropagation();

        this.setState({showPro: !this.state.showPro});
    }
    changeProduct(id){
        if(id){
            this.setState({showPro: !this.state.showPro});

            this.props.onChange(id, this.props.dir);
        }
    }
    render(){
        const {showPro} = this.state, {products, Code} = this.props;

        return (
            <div className="pos-r">
                <div className="select" onClick={(e)=>this.toggleProduct(e)}>
                    <div className="currency_text pdl-10">
                        <h4>{Code}</h4>
                    </div>
                    <div className="triangle">
                        <i className={showPro==false?'iconfont icon-dropDown c-8':'iconfont icon-dropUp c-8'}></i>
                    </div>
                </div>
                {showPro &&
                <div className="select_option">
                    <ul>
                    {products && products.map((item, index)=>{
                        return <li key={index} onClick={()=>this.changeProduct(item.Id)}>
                            <span className="pdl-10 tb">{item.Code}</span>
                        </li>
                    })}
                    {!products.length && <li className="tc"><div className="currency_text c-8"><h4>{Intl.lang("common.not_open")}</h4></div></li>}
                    </ul>
                </div>
                }
            </div>
        )
    }
}
