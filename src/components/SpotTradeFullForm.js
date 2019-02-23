import React from 'react';

import PureComponent from "../core/PureComponent"

import SpotTradeModel from "../model/spot-trade";
import AccountModel from "../model/account";
import AuthModel from "../model/auth";
import Product from '../model/product';
import { Link } from 'react-router';
import Event from '../core/event';
import Decimal from '../utils/decimal';
import {getCurrencySymbol, toast} from "../utils/common"
import {CONST} from "../public/const"
import NumberInput from '../components/NumberInput';
import Net from '../net/net';
import Intl from '../intl';
import PercentBtn from '../components/SpanPercentBtn';
import {Confirm} from './Common';
import PopDialog from "../utils/popDialog";
import MiningRobot from "./MiningRobot";
import {IS_MINING_OPEN} from "../config";
import {SingleSelect, SelectOption} from "./SingleSelect";


const $ = window.$;

class TradeFullForm extends PureComponent {
    constructor(props) {
        super(props);

        this.directionKey = 'trDirect';
        this.orderTypeKey = 'trOT';

        this.code = this.props.code;
        this.isLogin = AuthModel.checkUserAuth();
        // this.percent = 0;
        // this.marketMinAmount = 0.0001;

        // this.balancePriceFixed = 4;

        var state = {
            direction: AuthModel.loadPreference(this.directionKey) || CONST.TRADE.DIRECTION.BID,
            percent: 0,
            orderType: AuthModel.loadPreference(this.orderTypeKey) || 2, //限价委托
            price: '',
            quantity: '',  //限价单 数量
            amount:'',    //市价 数量

            askPrice:'',    // 卖出
            askQuantity:'',
            askAmount:'',
            askPercent:0,
            robotActivityOpen: IS_MINING_OPEN, //挖矿活动是否打开
            vip: null,
            vipProduct: null,
            fromBalance:'',
            toBalance:''
        };
        if (this.props.isSimple){
            state.error = {quantityError:'', priceError:'', amountError:''};
        }
        this.state = state;
    }

    componentWillMount(){
        Event.addListener(Event.EventName.WALLET_UPDATE, this.onUpdateWallet.bind(this), this);
        Event.addListener(Event.EventName.PRICE_SELECT, this.onSelectPrice.bind(this), this);
        Event.addOnce(Event.EventName.PRICE_UPDATE, this.onPriceUpdate.bind(this), this);

        this.onUpdateWallet();
        this.onPriceUpdate();

        if (this.isLogin){
            Product.loadProductVip((data)=>{
                this.setState({vipProduct: data});
            }, this);
            AccountModel.loadUserVip((data)=>{
                this.setState({vip: data});
            }, this);
        }
    }

    componentWillReceiveProps(nextProps){
        var code = nextProps.code;
        if (code != this.code){
            this.onChangeCode(code);
        }
    }

    onPriceUpdate(){
        if (this.state.orderType)this.onUpdatePriceState(this.state.orderType);
    }
    //
    getCurrencyWalletInfo(walletInfo, subCode){
        var winfo;
        if (walletInfo) winfo = walletInfo[CONST.CURRENCY[subCode]];
        return winfo||{};
    }

    onUpdateWallet(){
        var walletMap = AccountModel.getWalletInfo(CONST.WALLET.TYPE.SPOT);
        if (walletMap){
            var product = SpotTradeModel.getProduct(this.code);
            if (product) {
                const {fromCode, toCode} = product;

                var Codes = this.getBalanceCode(fromCode, toCode);
                var balanceCode = Codes.balanceCode;
                var askCode = Codes.askCode;

                var data = {};
                var walletInfo = this.getCurrencyWalletInfo(walletMap, balanceCode);
                if (walletInfo) {
                    var toBalance = walletInfo.canUse;
                    if (this.state.toBalance!=toBalance) data.toBalance = toBalance;
                }
                var askWalletInfo = this.getCurrencyWalletInfo(walletMap, askCode);
                if (askWalletInfo) {
                    var fromBalance = askWalletInfo.canUse;
                    if (this.state.fromBalance!=fromBalance) data.fromBalance = fromBalance;
                }
                if (data.hasOwnProperty("fromBalance") || data.hasOwnProperty("toBalance")){
                    this.setState(data);
                }
            }
        }
    }

    onSelectPrice(data){
        this.onChangeOrderType(2);
        this.onChangePrice(1, data.Price);
        this.onChangePrice(2, data.Price);
    }

    onChangeCode(code){
        this.code = code;

        if (this.state.orderType == 2) {
            this.updatePrice();
        }
        this.onUpdateWallet();

        this.setState({quantity: '', amount:'', percent:0, askQuantity:'', askAmount:'', askPercent:0});
    }

    updatePrice(){
        var price, askPrice;
        var info = SpotTradeModel.getProduct(this.code);
        if (info && info.price){
            if (Number(info.price.ASK)){
                price = info.price.ASK;
                if (this.state.price!=price){
                    this.onChangePrice(1, price);
                }
            }
            if (Number(info.price.BID)){
                askPrice = info.price.BID;
                if (this.state.askPrice!=askPrice){
                    this.onChangePrice(2, askPrice);
                }
            }
        }
    }

    redirectPay(currency){
        AccountModel.redirectPay(parseInt(currency));
    }
    // 切换市价、限价
    changeOrderTab(tab, e){
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        this.onChangeOrderType(tab);
    }

    onUpdatePriceState(orderType){
        if (orderType == 2 && !this.state.price){
            this.updatePrice();
        }else if(orderType==1 && this.state.price){
            this.setState({price:''});
        }
    }

    onChangeOrderType(orderType){
        this.setState({orderType, percent:0, amount:'',quantity:'', askPercent:0, askAmount:'', askQuantity:''});

        this.onUpdatePriceState(orderType);

        AuthModel.savePreference(this.orderTypeKey, orderType);
    }

    onChangePrice(side, val){
        if(side==CONST.TRADE.DIRECTION.BID){
            if (this.state.price!=val){
                var info = SpotTradeModel.getProduct(this.code);
                var sVal = String(val)
                var dnum = Decimal.getDotDigit(sVal);
                var data = {price: dnum > info.PriceFixed ? String(Decimal.toFixed(sVal, info.PriceFixed)) : sVal };

                this.setState(data);
            }
        }else{
            if (this.state.askPrice!=val){
                var info = SpotTradeModel.getProduct(this.code);
                var sVal = String(val)
                var dnum = Decimal.getDotDigit(sVal);
                var data = {askPrice: dnum > info.PriceFixed ? String(Decimal.toFixed(sVal, info.PriceFixed)) : sVal };

                this.setState(data);
            }
        }
    }

    onChangeQuantity(direction, val){
        //var Codes = this.getBalanceCode();
        if(direction==CONST.TRADE.DIRECTION.BID){
            if (this.state.quantity!=val){
                var data = {quantity:val};

                this.setState(data);
            }
        }else{
            if (this.state.askQuantity!=val){
                var data = {askQuantity:val};

                this.setState(data);
            }
        }
    }

    onChangeAmount(direction, val){
        if (direction==CONST.TRADE.DIRECTION.BID){
            if (this.state.amount!=val){
                var percent = Number(this.state.toBalance) ? String(Decimal.accMul(Decimal.accDiv(val||0, this.state.toBalance), 100)) : "0";
                percent = Number(Decimal.toFixed(percent, 0));
                if (this.state.percent != percent){
                    this.setState({amount:val, percent});
                }else{
                    this.setState({amount:val});
                }
            }
        }else{
            if (this.state.askAmount!=val){
                var askPercent = Number(this.state.fromBalance) ? String(Decimal.accMul(Decimal.accDiv(val||0, this.state.fromBalance||1), 100)) : "0";
                var askPercent = Number(Decimal.toFixed(askPercent, 0));
                if (this.state.percent != askPercent){
                    this.setState({askAmount:val, askPercent});
                }else{
                    this.setState({askAmount:val});
                }
            }
        }
    }

    onChangePercent(direction, val){
        this.changePercent(val, direction);
    }

    changePercent(val, direction){
        if (!val){
            if (direction==CONST.TRADE.DIRECTION.BID){
                this.setState({percent:val});
            }else{
                this.setState({askPercent:val});
            }
            return;
        }

        var total = direction==CONST.TRADE.DIRECTION.BID? this.state.toBalance : this.state.fromBalance

        if (this.state.orderType == 1){
            var balance = total && Number(total) ? String(Decimal.accMul((val||0)/100, total)) : "0";
            if(direction==CONST.TRADE.DIRECTION.BID){
                this.setState({amount: balance, percent:val});
            }else{
                this.setState({askAmount: balance, askPercent:val});
            }
        }else{
            if (direction==CONST.TRADE.DIRECTION.BID){
                var price = this.state.price;
                if (price > 0)  {
                    var quantity = String(Decimal.accDiv(Decimal.accMul(Decimal.accDiv(total, price), val||0), 100));
                    this.setState({quantity, percent: val});
                }
            }else{
                var askQuantity = String(Decimal.accDiv(Decimal.accMul(total, val||0), 100));
                this.setState({askQuantity, askPercent: val});
            }
        }
    }
    //获取余额的类型
    getBalanceCode(direction, fromCode, toCode){
        if (!fromCode || !toCode){
            var product = SpotTradeModel.getProduct(this.code);
            fromCode = product.fromCode;
            toCode = product.toCode;
        }

        //var balanceCode;
        //if (direction == 1){
        //    balanceCode = toCode;
        //}else{
        //    balanceCode = fromCode;
        //}

        return {balanceCode: toCode, askCode: fromCode};
    }

    onArrowUp(direction, e){
        e.preventDefault();
        e.stopPropagation();

        if (this.state.orderType == 1){
            if(direction==CONST.TRADE.DIRECTION.BID) {
                this.refs.amount.onArrowUp();
            }else{
                this.refs.askAmount.onArrowUp();
            }
        }else{
            if (this.priceRef){
                this.priceRef.onArrowUp();
            }
        }
    }

    // onArrowUpOut(direction, e){
    //     e.preventDefault();
    //     e.stopPropagation();
    //
    //     if (this.state.orderType == 1){
    //         if(direction==1) {
    //             this.refs.amount.onArrowUpOut();
    //         }else{
    //             this.refs.askAmount.onArrowUpOut();
    //         }
    //     }else{
    //         if(direction==1) {
    //             this.refs.price.onArrowUpOut();
    //         }else{
    //             this.refs.askPrice.onArrowUpOut();
    //         }
    //     }
    // }

    onArrowDown(direction, e){
        e.preventDefault();
        e.stopPropagation();

        if (this.state.orderType == 1) {
            if(direction==CONST.TRADE.DIRECTION.BID) {
                this.refs.amount.onArrowDown();
            }else{
                this.refs.askAmount.onArrowDown();
            }
        }else{
            if (this.priceRef){
                this.priceRef.onArrowDown();
            }
        }
    }

    // onArrowDownOut(direction, e){
    //     e.preventDefault();
    //     e.stopPropagation();
    //
    //     if (this.state.orderType == 1) {
    //         if(direction==1) {
    //             this.refs.amount.onArrowDownOut();
    //         }else{
    //             this.refs.askAmount.onArrowDownOut();
    //         }
    //     }else{
    //         if(direction==1) {
    //             this.refs.price.onArrowDownOut();
    //         }else{
    //             this.refs.askPrice.onArrowDownOut();
    //         }
    //     }
    // }

    onTrade(direction, e){
        e.preventDefault();
        e.stopPropagation();

        if (!AuthModel.checkUserAuth()){
            AuthModel.redirectLogin();
            return;
        }

        var node = $(e.target);
        if (node.hasClass("bg-gray")) return;

        var product = SpotTradeModel.getProduct(this.code);
        const fromCode = product.fromCode;
        const toCode = product.toCode;

        var amount = 0;
        var minQuan = SpotTradeModel.getMinQuantity(fromCode);

        var rid = CONST.CURRENCY[fromCode];
        var currency = CONST.CURRENCY[toCode];

        const isSimple = this.props.isSimple;
        var error = {quantityError:[], priceError:[], amountError:[]};

        var self = this;
        //市价买卖
        // var product = SpotTradeModel.getProduct(this.code);
        if (this.state.orderType == 1){
            if (direction == CONST.TRADE.DIRECTION.BID){
                var amount = this.state.amount;
                if (!amount){
                    if (isSimple){
                        error.amountError.push(Intl.lang("TradeForm.110"));
                    }else{
                        toast(Intl.lang("TradeForm.110"), true);
                        return;
                    }
                }

                if (product && product.price && product.price.ASK){
                    //市价买按usdt最小数量计
                    minQuan = SpotTradeModel.getMinQuantity(toCode);
                    // var dp = minQuan >= 1 ? 0 : String(String(minQuan).split('.')[1]).length;
                    // var quantity = Decimal.accDiv(amount, product.price.ASK, dp);
                    if (amount < minQuan){
                        if (isSimple){
                            error.quantityError.push(Intl.lang("TradeForm.error.marketBuy"));
                        }else{
                            toast(Intl.lang("TradeForm.error.marketBuy", minQuan, toCode), true);
                            return;
                        }
                    }
                }
            }else{
                var amount = this.state.askAmount;
                if (!amount){
                    if (isSimple){
                        error.quantityError.push(Intl.lang("TradeForm.112"));
                    }else{
                        toast(Intl.lang("TradeForm.112"), true);
                        return;
                    }
                }

                if (amount < minQuan ){
                    var msg = fromCode + Intl.lang("TradeForm.111") + minQuan;
                    if (isSimple){
                        error.quantityError.push(msg);
                    }else {
                        toast(msg, true);
                        return;
                    }
                }
            }

            if (isSimple){
                this.setState({error});
                for (var key in error){
                    if (error[key].length){
                        return;
                    }
                }
            }

            node.addClass("bg-gray");

            Net.httpRequest(direction == CONST.TRADE.DIRECTION.BID ?"spot/buy":"spot/sell", {"Rid": rid, "Amount":parseFloat(amount), "Price":0, "Currency":currency}, function(data){
                node.removeClass("bg-gray");

                if (data.Status == 0){
                    self.placeOrderSuccess();
                }
            }, this);
        }else{
            var quantity;
            if (direction == CONST.TRADE.DIRECTION.BID) {
                quantity = this.state.quantity;
                var price = this.state.price;
            }else{
                quantity = this.state.askQuantity;
                var price = this.state.askPrice;
            }
            //限价
            if (!price || Number(price)<=0){
                if (isSimple){
                    error.priceError.push(Intl.lang("tradeHistory.2_113"));
                }else {
                    toast(Intl.lang("tradeHistory.2_113"), true);
                    return;
                }
            }
            if (!quantity){
                if (isSimple){
                    error.quantityError.push(Intl.lang("tradeInfo.2_25"));
                }else {
                    toast(Intl.lang("tradeInfo.2_25"), true);
                    return;
                }
            }

            if (Number(quantity) < minQuan ){
                var msg = fromCode + Intl.lang("TradeForm.111") + minQuan;
                if (isSimple){
                    error.quantityError.push(msg);
                }else {
                    toast(msg, true);
                    return;
                }
            }

            if (isSimple){
                this.setState({error});
                for (var key in error){
                    if (error[key].length){
                        return;
                    }
                }
            }

            const _submitLimitOrder = ()=>{
                node.addClass("bg-gray");

                Net.httpRequest(direction == CONST.TRADE.DIRECTION.BID ?"spot/buy":"spot/sell", {"Rid": rid, "Amount":parseFloat(quantity), "Price":parseFloat(price), "Currency":currency}, function(data){
                    node.removeClass("bg-gray");

                    if (data.Status == 0){
                        self.placeOrderSuccess();
                    }
                }, this);
            };

            if (!SpotTradeModel.checkDelegateAvgPrice(price, product.price)){
                PopDialog.open(<Confirm skin="dialog-bg-blue" isExpert={true} title={Intl.lang("Recharge.note")} content={Intl.lang("trade.delegate.avgLimit")}
                                        yestxt={Intl.lang("trade.confirm.newOrder")} notxt={Intl.lang("trade.confirm.cancelOrder")} callback={()=>{
                    _submitLimitOrder();
                }}/>, "alert_panel");
            }else{
                _submitLimitOrder();
            }
        }
    }

    //下单成功
    placeOrderSuccess(){
        // Event.dispatch(Event.EventName.ORDER_UPDATE);

        toast(Intl.lang('tradeInfo.2_27'));
    }

    onMiningRobotConfirm(status, callback){
        PopDialog.open(<Confirm skin="dialog-bg-blue" isExpert={true} title={Intl.lang("mining.robot")} content={Intl.lang(status?"mining.confirm.open":"mining.confirm.close2")}
                                callback={()=>{
            if (callback)callback(true);
        }}/>, "alert_panel");
    }

    onChangeDirection(direction){
        if (this.state.direction!=direction){
            this.setState({direction});

            AuthModel.savePreference(this.directionKey, direction);
        }
    }

    render() {
        const {code, isMobile, isSimple} = this.props;
        const {direction, percent, orderType, price, quantity, amount, askPrice, askQuantity, askAmount, askPercent, robotActivityOpen, vipProduct,vip, fromBalance, toBalance, error} = this.state;

        const isLogined = AuthModel.checkUserAuth();

        var fromCode = '--', toCode = "--", balanceCode = '--', askCode='--';
        var total = 0, askTotal = 0;
        var product = {};
        var name;
        if (code){
            product = SpotTradeModel.getProduct(code);
            if (product){
                name = product.Name;
                fromCode = product.fromCode;
                toCode = product.toCode;

                var Codes = this.getBalanceCode(fromCode,toCode);
                balanceCode = Codes.balanceCode;
                askCode = Codes.askCode;

                var cs = getCurrencySymbol(CONST.CURRENCY[balanceCode]);
                var askCs = getCurrencySymbol(CONST.CURRENCY[askCode]);

                var minQuantity = SpotTradeModel.getMinQuantity(balanceCode);
                var askMinQuantity = SpotTradeModel.getMinQuantity(askCode);

                var fromMinQuantity = SpotTradeModel.getMinQuantity(fromCode);
                var askFromMinQuantity = SpotTradeModel.getMinQuantity(toCode);

                var amountStep = String(Decimal.toFixed(1/Math.pow(10, product.PriceFixed)));
                var volumeStep = String(Decimal.toFixed(1/Math.pow(10, product.VolFixed)));

                if (price && quantity){
                    total = Decimal.accMul(price, quantity, product.PriceFixed);
                }

                if (askPrice && askQuantity){
                    askTotal = Decimal.accMul(askPrice, askQuantity, product.PriceFixed);
                }

                var max1 = 0,max2 = 0;
                if (price && Number(price)) max1 = Number(Decimal.accDiv(toBalance||0, price, product.VolFixed));
                max2 = Number(fromBalance);

                var takerRt = '--',makerRt = '--';
                // if (IS_MINING_OPEN){
                //     var tradeFee = AccountModel.getDiscountFee();
                //     if (tradeFee){
                //         var taker = tradeFee.taker;
                //         var maker = tradeFee.maker;
                //         if (taker.discount){
                //             takerRt = <React.Fragment><span className="trade-order-head-unline">{taker.base}%</span> {taker.discount}%</React.Fragment>
                //         }else{
                //             takerRt = <React.Fragment>{taker.discount}%</React.Fragment>
                //         }
                //         if (maker.discount){
                //             makerRt = <React.Fragment><span className="trade-order-head-unline">{maker.base}%</span> {maker.discount}%</React.Fragment>
                //         }else{
                //             makerRt = <React.Fragment>{maker.discount}%</React.Fragment>
                //         }
                //     }
                // }
                if (vip && vipProduct){
                    var vipLv = vip.Vip;
                    var isDiscount = vip.Offset;
                    var discountVip = vipProduct[vipLv].Spots;
                    if (isDiscount){
                        takerRt = <React.Fragment><span className="trade-order-head-unline">{Decimal.toPercent(discountVip.Takerfee, 2)}</span> {Decimal.toPercent(discountVip.Tdfeerate, 2)}</React.Fragment>
                        makerRt = <React.Fragment><span className="trade-order-head-unline">{Decimal.toPercent(discountVip.Makerfee, 2)}</span> {Decimal.toPercent(discountVip.Makerfee, 2)}</React.Fragment>
                    }else{
                        takerRt = <React.Fragment>{Decimal.toPercent(discountVip.Takerfee, 2)}</React.Fragment>
                        makerRt = <React.Fragment>{Decimal.toPercent(discountVip.Makerfee, 2)}</React.Fragment>
                    }
                }
            }
        }

        var percentData = [25,50,75,100];
        const self = this;
        return (
            isSimple ?
                <div className="spot-trading-order">
                    <div className="spot-trading-order-header">
                        <h3>{name}</h3>
                        <p>
                            <span className="spot-trading-item">{balanceCode+" "+Intl.lang("TradeForm.115")}<span className="spot-color-f3f3f3">{isLogined && cs ? cs.sb + Decimal.formatAmount(toBalance||0, product.PriceFixed) :'--'}</span></span>
                            <Link className="spot-trading-link" to={'/recharge'}>{Intl.lang('account.1_2')}</Link>
                            <span className="spot-trading-item">{askCode+" "+Intl.lang("TradeForm.115")}<span className="spot-color-f3f3f3">{isLogined && askCs ? askCs.sb + Decimal.formatAmount(fromBalance||0, product.VolFixed) : '--'}</span></span>
                        </p>
                    </div>
                    <div className="spot-trading-order-body">
                        <ul className="spot-trading-tab-config">
                            <li className={direction==CONST.TRADE.DIRECTION.BID?"active":null} onClick={this.onChangeDirection.bind(self, CONST.TRADE.DIRECTION.BID)}>{Intl.lang("mining.side.buy")}</li>
                            <li className={direction==CONST.TRADE.DIRECTION.ASK?"active":null} onClick={this.onChangeDirection.bind(self, CONST.TRADE.DIRECTION.ASK)}>{Intl.lang("mining.side.sell")}</li>
                        </ul>

                        <div className="spot-trading-all-input">
                            <ul className="spot-trading-input-item">
                                <li className="spot-trading-input-title">{Intl.lang("trade.editOrder.delegateType")}</li>
                                <SingleSelect value={orderType} onChange={this.onChangeOrderType.bind(this)} tag="li" textClassName="spot-trading-input-text" icon={<i className="spot-trading-icon-triangle"/>} ddClassName="spot-trading-input-config active" menuClassName="spot-trading-input-drop-down" menuTag="ul">
                                    <SelectOption value={2} key="dt1" tag="li">{Intl.lang("TradeForm.102")}</SelectOption>
                                    <SelectOption value={1} key="dt2" tag="li">{Intl.lang("TradeForm.101")}</SelectOption>
                                </SingleSelect>
                            </ul>

                            <ul className="spot-trading-input-item">
                                <li className="spot-trading-input-title">{Intl.lang("TradeForm.105")}</li>
                                <li className="spot-trading-input-config">
                                    {(orderType == 2) ?
                                    <React.Fragment>
                                        <NumberInput name="price" id="price" value={price} onChange={(val)=>this.onChangePrice(direction, val)} ref={(r)=>this.priceRef=r} step={amountStep} min={amountStep}/>
                                        <p className="spot-trading-icon-up-down">
                                            <i className="spot-trading-icon-triangle up" onMouseDown={(e)=>this.onArrowUp(direction, e)}></i>
                                            <i className="spot-trading-icon-triangle down" onMouseDown={(e)=>this.onArrowDown(direction, e)}></i>
                                        </p>
                                    </React.Fragment>
                                        :
                                        <input value={Intl.lang("futures.trade_title2")} readOnly={true}/>
                                    }
                                    <p>{toCode}</p>
                                </li>
                                {(error && error.priceError[0]) && <p className="spot-trading-input-error"><i className="iconfont icon-tips"></i>{error.priceError[0]}</p>}
                            </ul>


                            {orderType==2 ? (direction==CONST.TRADE.DIRECTION.BID ?
                                (<ul className="spot-trading-input-item">
                                    <li className="spot-trading-input-title">{Intl.lang("TradeForm.106")}</li>
                                    <li className="spot-trading-input-config">
                                        <NumberInput step={volumeStep} value={quantity} onChange={this.onChangeQuantity.bind(self, CONST.TRADE.DIRECTION.BID)} min={fromMinQuantity>max1?max1:fromMinQuantity} max={max1}/>
                                        <p>{fromCode}</p>
                                    </li>
                                    {(error && error.quantityError[0]) && <p className="spot-trading-input-error"><i className="iconfont icon-tips"></i>{error.quantityError[0]}</p>}
                                </ul>)
                                :
                                (<ul className="spot-trading-input-item">
                                    <li className="spot-trading-input-title">{Intl.lang("TradeForm.106")}</li>
                                    <li className="spot-trading-input-config">
                                        <NumberInput step={volumeStep} value={askQuantity} onChange={this.onChangeQuantity.bind(self, CONST.TRADE.DIRECTION.ASK)} min={fromMinQuantity>max2?max2:fromMinQuantity} max={max2}/>
                                        <p>{fromCode}</p>
                                    </li>
                                    {(error && error.quantityError[0]) && <p className="spot-trading-input-error"><i className="iconfont icon-tips"></i>{error.quantityError[0]}</p>}
                                </ul>)
                            ) : (
                                direction==CONST.TRADE.DIRECTION.BID ?
                                    (<ul className="spot-trading-input-item">
                                    <li className="spot-trading-input-title">{Intl.lang("TradeForm.107")}</li>
                                    <li className="spot-trading-input-config">
                                        <NumberInput value={amount} onChange={this.onChangeAmount.bind(self, CONST.TRADE.DIRECTION.BID)} ref="amount" step={amountStep} min={askFromMinQuantity} max={isLogined?(toBalance||0):0}/>
                                        <p>{toCode}</p>
                                    </li>
                                    {(error && error.amountError[0]) && <p className="spot-trading-input-error"><i className="iconfont icon-tips"></i>{error.amountError[0]}</p>}
                                </ul>)
                                    :
                                    (
                                <ul className="spot-trading-input-item">
                                    <li className="spot-trading-input-title">{Intl.lang("TradeForm.106")}</li>
                                    <li className="spot-trading-input-config">
                                        <NumberInput step={volumeStep} value={askAmount} onChange={this.onChangeAmount.bind(self, CONST.TRADE.DIRECTION.ASK)} ref="askAmount" min={minQuantity} max={isLogined ? (fromBalance || 0) : 0}/>
                                        <p>{fromCode}</p>
                                    </li>
                                    {(error && error.quantityError[0]) && <p className="spot-trading-input-error"><i className="iconfont icon-tips"></i>{error.quantityError[0]}</p>}
                                </ul>
                                    )
                            )}

                            <ul className="spot-trading-input-item">
                                <li className="spot-trading-input-config bg-none">
                                    {direction == CONST.TRADE.DIRECTION.BID ?
                                        (<PercentBtn className="spot-trading-span-Percentage" dataArr={percentData}
                                                    value={percent}
                                                    onChange={this.onChangePercent.bind(self, CONST.TRADE.DIRECTION.BID)} key="pb0"/>)
                                        :
                                        (<PercentBtn className="spot-trading-span-Percentage" dataArr={percentData}
                                                    value={percent}
                                                    onChange={this.onChangePercent.bind(self, CONST.TRADE.DIRECTION.ASK)}  key="pb1"/>)
                                    }
                                </li>
                            </ul>
                            {orderType==2 &&
                            <ul className="spot-trading-input-item-text">
                                {Intl.lang("TradeForm.amount")+Intl.lang("common.symbol.colon")}<span>{(direction==CONST.TRADE.DIRECTION.BID?(total||'--'):(askTotal||'--'))+' '+toCode}</span>
                            </ul>}

                            <ul className="spot-trading-input-item-text">
                                {Intl.lang("tradeHistory.2_69")+Intl.lang("common.symbol.colon")}{takerRt} <Link className="link-config-style" to="/personal/viprights" target="_blank">{Intl.lang("common.view")}<i className="iconfont icon-arrow-l"></i></Link>
                            </ul>

                            {this.isLogin ?
                            <button className={"spot-trading-btn-config "+(direction==CONST.TRADE.DIRECTION.BID?'buy':'sell')}  onClick={(e)=>this.onTrade(direction, e)}>
                                <p>{Intl.lang(direction==CONST.TRADE.DIRECTION.BID ? 'TradeForm.108' : 'TradeForm.109')}</p>
                            </button>
                                :
                            <button className="spot-trading-btn-config ">
                                <p dangerouslySetInnerHTML={{__html:Intl.lang("TradeForm.unLogin", "?return_to=/exchange/"+code)}}></p>
                            </button>
                            }
                        </div>
                    </div>
                </div>
                :
            <div style={isMobile?{backgroundColor: "#272d33"}:{position: "absolute",bottom: 0, right:0, width: "516px", backgroundColor: "#272d33"}}>
                <div className="full-trade-sellbox pos-r">
                    <ul className="trade-order-head head-border-full f-clear full-form-border">
                        <li className={orderType==1?"fl current":"fl"} onClick={this.changeOrderTab.bind(self,1)}>{Intl.lang("TradeForm.101")}</li>
                        <li className={orderType==2?"fl current":"fl"} onClick={this.changeOrderTab.bind(self,2)}>{Intl.lang("TradeForm.102")}</li>
                        {!!robotActivityOpen && <MiningRobot type="spot" code={code} onConfirm={this.onMiningRobotConfirm.bind(this)}/>}
                    </ul>
                    <div className="full-trade-offer">{Intl.lang("tradeHistory.2_69") + ': '}{Intl.lang("trade.taker")} ({takerRt})<span className="trade-order-head-span"></span>{Intl.lang("trade.maker")} ({makerRt}) <a className="pd010 viewOffer m-hide" href={"/personal/viprights"} target="_blank">{Intl.lang("common.view")}</a></div>

                    <div className="fem875 f-clear">
                        <div className="flex-box flex-jc">
                            <dl className="form-box wp-50 trade-form-full" style={{position: 'relative'}}>
                                <dt>{balanceCode+" "+Intl.lang("TradeForm.115")}</dt>
                                <dd>
                                    <span className="form-span">{isLogined && cs ? cs.sb + toBalance :'--'}</span>
                                </dd>
                                <Link className="trade-form-full-link" to={'/recharge'}>{Intl.lang('account.1_2')}</Link>
                            </dl>
                            <dl className="form-box wp-50 trade-form-full">
                                <dt style={{paddingLeft: '10px'}}>{askCode+" "+Intl.lang("TradeForm.115")}</dt>
                                <dd>
                                    <span className="form-span">{isLogined && askCs ? askCs.sb + fromBalance : '--'}</span>
                                </dd>
                            </dl>
                        </div>

                        <div className={isMobile?"tc":"flex-box flex-jc pos-r pdr-5 trade-order-head-after"}>
                            <div className="wp-50 mb-spot-buy pc-spot-buy">
                                {(orderType==1) &&
                                <React.Fragment>
                                    <dl className="form-box f-clear mt-10">
                                        <dt className="lh-32">{Intl.lang("TradeForm.buying.price")}</dt>
                                        <dd className="trade-tc-number-full">
                                            <div className="numberBox">
                                                <p style={{textAlign: 'center', lineHeight: '33px', color: '#888'}}>{Intl.lang('futures.trade_title2')}</p>
                                            </div>
                                        </dd>
                                    </dl>
                                    <dl className="form-box f-clear mt-10">
                                        <dt className="lh-32">{Intl.lang("TradeForm.103")}</dt>
                                        <dd className="trade-tc-number-full">
                                            <div className="numberBox">
                                                <NumberInput value={amount} onChange={this.onChangeAmount.bind(self, CONST.TRADE.DIRECTION.BID)} ref="amount" step={amountStep} min={askFromMinQuantity} max={isLogined?(toBalance||0):0}/>
                                                <div className="number-title">{toCode}</div>
                                                <div className="arrow-box">
                                                    <span className="iconfont icon-dropUp arrowup" onMouseDown={this.onArrowUp.bind(self, CONST.TRADE.DIRECTION.BID)}></span>
                                                    <span className="iconfont icon-dropDown arrowdown" onMouseDown={this.onArrowDown.bind(self, CONST.TRADE.DIRECTION.BID)}></span>
                                                </div>
                                            </div>
                                        </dd>
                                    </dl>
                                </React.Fragment>
                                }
                                {orderType==2 &&
                                <dl className="form-box f-clear mt-10">
                                    <dt className="lh-32">{Intl.lang("TradeForm.buying.price")}</dt>
                                    <dd className="trade-tc-number-full">
                                        <div className="numberBox">
                                            <NumberInput name="price" id="price" value={price} onChange={this.onChangePrice.bind(self, CONST.TRADE.DIRECTION.BID)} ref="price" step={amountStep} min={amountStep} />
                                            <div className="number-title">{toCode}</div>
                                            <div className="arrow-box">
                                                <span className="iconfont icon-dropUp arrowup" onMouseDown={this.onArrowUp.bind(self, CONST.TRADE.DIRECTION.BID)}></span>
                                                <span className="iconfont icon-dropDown arrowdown" onMouseDown={this.onArrowDown.bind(self, CONST.TRADE.DIRECTION.BID)}></span>
                                            </div>
                                        </div>
                                    </dd>
                                </dl>}
                                {orderType==2 && <dl className="form-box f-clear mt-10">
                                    <dt className="lh-32">{Intl.lang("TradeForm.buying.quantity")}</dt>
                                    <dd className="trade-tc-number-full">
                                        <div className="numberBox">
                                            <NumberInput className="w-100" step={volumeStep} value={quantity} onChange={this.onChangeQuantity.bind(self, CONST.TRADE.DIRECTION.BID)} min={fromMinQuantity>max1?max1:fromMinQuantity} max={max1}/>
                                            <div className="number-title">{fromCode}</div>
                                        </div>
                                    </dd>
                                </dl>}

                                <dl className="form-box f-clear mt-10">
                                    <dt className="w-66">&nbsp;</dt>
                                    <dd className="trade-full-percent">
                                        <PercentBtn className="trade-full-percent" dataArr={percentData} value={percent} onChange={this.onChangePercent.bind(self, CONST.TRADE.DIRECTION.BID)}/>
                                    </dd>
                                </dl>
                                {orderType==2 && <dl className="form-box mt-10 f-clear">
                                    <dt dangerouslySetInnerHTML={{__html:Intl.lang("TradeForm.107")}}></dt>
                                    <dd>{(total||'--')+' '+toCode}</dd>
                                </dl>}
                                <div style={{marginLeft: '10px'}} className={"trade-tc-number-full "+(orderType === 1 ? 'mt-42' :orderType === 2 ? 'mt-15' : null)}>
                                    <button className="btn btn-green trade-buy" onClick={this.onTrade.bind(self, CONST.TRADE.DIRECTION.BID)}>{Intl.lang("TradeForm.108")}</button>
                                </div>
                            </div>

                            <div className="wp-50 ask">
                                {(orderType == 1) && <React.Fragment>
                                    <dl className="form-box f-clear mt-10">
                                        <dt className="lh-32">{Intl.lang("TradeForm.selling.price")}</dt>
                                        <dd className="trade-tc-number-full">
                                            <div className="numberBox">
                                                <p style={{textAlign: 'center', lineHeight: '33px', color: '#888'}}>{Intl.lang('futures.trade_title2')}</p>
                                            </div>
                                        </dd>
                                    </dl>
                                    <dl className="form-box f-clear mt-10">
                                        <dt className="lh-32">{Intl.lang("TradeForm.104")}</dt>
                                        <dd className="trade-tc-number-full">
                                            <div className="numberBox">
                                                <NumberInput value={askAmount} onChange={this.onChangeAmount.bind(self, CONST.TRADE.DIRECTION.ASK)} ref="askAmount" step={volumeStep} min={minQuantity} max={isLogined ? (fromBalance || 0) : 0}/>
                                                <div className="number-title">{fromCode}</div>
                                                <div className="arrow-box">
                                                    <span className="iconfont icon-dropUp arrowup" onMouseDown={this.onArrowUp.bind(self, CONST.TRADE.DIRECTION.ASK)}></span>
                                                    <span className="iconfont icon-dropDown arrowdown" onMouseDown={this.onArrowDown.bind(self, CONST.TRADE.DIRECTION.ASK)}></span>
                                                </div>
                                            </div>
                                        </dd>
                                    </dl>
                                </React.Fragment>}
                                {orderType==2 &&
                                <dl className="form-box f-clear mt-10">
                                    <dt className="lh-32">{Intl.lang('TradeForm.selling.price')}</dt>
                                    <dd className="trade-tc-number-full">
                                        <div className="numberBox">
                                            <NumberInput name="price" id="price" value={askPrice} onChange={this.onChangePrice.bind(self, CONST.TRADE.DIRECTION.ASK)} ref="askPrice" step={amountStep} min={amountStep}/>
                                            <div className="number-title">{toCode}</div>
                                            <div className="arrow-box">
                                                <span className="iconfont icon-dropUp arrowup" onMouseDown={this.onArrowUp.bind(self, CONST.TRADE.DIRECTION.ASK)}></span>
                                                <span className="iconfont icon-dropDown arrowdown" onMouseDown={this.onArrowDown.bind(self, CONST.TRADE.DIRECTION.ASK)}></span>
                                            </div>
                                        </div>
                                    </dd>
                                </dl>}
                                {orderType==2 && <dl className="form-box f-clear mt-10">
                                    <dt className="lh-32">{Intl.lang('TradeForm.Selling.quantity')}</dt>
                                    <dd className="trade-tc-number-full">
                                        <div className="numberBox">
                                            <NumberInput className="w-100" step={volumeStep} value={askQuantity} onChange={this.onChangeQuantity.bind(self, CONST.TRADE.DIRECTION.ASK)} min={fromMinQuantity>max2?max2:fromMinQuantity} max={max2}/>
                                            <div className="number-title">{fromCode}</div>
                                        </div>
                                    </dd>
                                </dl>}

                                <dl className="form-box f-clear mt-10">
                                    <dt className="w-66">&nbsp;</dt>
                                    <dd className="trade-full-percent">
                                        <PercentBtn className="trade-full-percent" dataArr={percentData} value={askPercent} onChange={this.onChangePercent.bind(self, CONST.TRADE.DIRECTION.ASK)}/>
                                    </dd>
                                </dl>
                                {orderType==2 && <dl className="form-box mt-10 f-clear">
                                    <dt dangerouslySetInnerHTML={{__html:Intl.lang("TradeForm.107")}}></dt>
                                    <dd>{(askTotal||'--')+' '+toCode}</dd>
                                </dl>}
                                <div style={{marginLeft: '10px'}} className={"trade-tc-number-full "+(orderType === 1 ? 'mt-42' :orderType === 2 ? 'mt-15' : null)}>
                                    <button className="btn btn-hotpink trade-buy" onClick={this.onTrade.bind(self, CONST.TRADE.DIRECTION.ASK)}>{Intl.lang("TradeForm.109")}</button>
                                </div>
                            </div>
                        </div>

                    </div>
                    {!this.isLogin &&
                    <div className="unlogin-mask">
                        <div className="orderMask"></div>
                        <div className="maskTxt" dangerouslySetInnerHTML={{__html:Intl.lang("TradeForm.unLogin", "?return_to=/exchange/"+code)}}></div>
                    </div>
                    }
                </div>
            </div>
        );
    }
}

export default TradeFullForm;
