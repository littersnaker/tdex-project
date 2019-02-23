import React from 'react';
import { Link } from 'react-router';

import PureComponent from "../core/PureComponent";
import AuthModel from "../model/auth";
import {CONST} from "../public/const";
import Intl from "../intl";
import Decimal from "../utils/decimal";
import SpotTradeModel from "../model/spot-trade";
import {getCurrencySymbol, toast} from "../utils/common";
import {SingleSelect, SelectOption} from "./SingleSelect";
import NumberInput from '../components/NumberInput';
import Product from "../model/product";
import AccountModel from "../model/account";
import Event from "../core/event";
import PercentBtn from '../components/SpanPercentBtn';
// import {Confirm} from './Common';
import Net from "../net/net";
// import PopDialog from "../utils/popDialog";
import {IS_CLOSE_EXCHANGE} from "../config";

export default class SpotTradeSimpleForm extends PureComponent{
    constructor(props) {
        super(props);

        this.directionKey = 'trDirect';
        this.orderTypeKey = 'trOT';

        this.code = this.props.code;

        this.percentData = [25,50,75,100];
        this.submitInterval = 1000; //下单限制1秒以上间隔

        var state = {
            product: SpotTradeModel.getProduct(this.code),
            direction: AuthModel.loadPreference(this.directionKey) || CONST.TRADE.DIRECTION.BID,
            percent: 0,
            orderType: AuthModel.loadPreference(this.orderTypeKey) || 2, //限价委托
            price: '',     //价格
            volume: '',  //数量
            amount: '',  //金额

            vip: null,
            vipProduct: null,
            fromBalance:'',
            toBalance:'',

            isSubmiting: false,
            error:{
                volumeError:[],
                priceError:[],
                amountError:[]
            }
        };

        this.state = state;
    }

    componentWillMount(){
        Event.addListener(Event.EventName.WALLET_UPDATE, this.onUpdateWallet.bind(this), this);
        Event.addListener(Event.EventName.PRICE_SELECT, this.onSelectPrice.bind(this), this);
        Event.addOnce(Event.EventName.PRICE_UPDATE, this.onPriceUpdate.bind(this), this);

        if (AuthModel.checkUserAuth()) this.onUpdateWallet();
        this.onPriceUpdate();

        this.loadVip();
    }

    componentWillReceiveProps(nextProps) {
        if (!this.state.product || nextProps.code!=this.props.code){
            this.code = nextProps.code;
            this.setState({product:SpotTradeModel.getProduct(this.code)});
        }
    }

    componentWillUnmount(){
        if (this.submitTimer){
            clearTimeout(this.submitTimer);
            this.submitTimer = 0;
        }

        super.componentWillUnmount();
    }

    loadVip(){
        if (AuthModel.checkUserAuth()){
            Product.loadProductVip((data)=>{
                this.setState({vipProduct: data});
            }, this);
            AccountModel.loadUserVip((data)=>{
                this.setState({vip: data});
            }, this);
        }
    }

    getCurrencyWalletInfo(walletInfo, subCode){
        var winfo;
        if (walletInfo) winfo = walletInfo[CONST.CURRENCY[subCode]];
        return winfo||{};
    }

    onUpdateWallet(){
        var walletMap = AccountModel.getWalletInfo(CONST.WALLET.TYPE.SPOT);
        if (walletMap){
            var product = this.state.product;
            if (product) {
                const {fromCode, toCode} = product;

                var data = {};
                var walletInfo = this.getCurrencyWalletInfo(walletMap, toCode);
                if (walletInfo && walletInfo.hasOwnProperty("canUse")) {
                    var toBalance = walletInfo.canUse;
                    if (this.state.toBalance!=toBalance) data.toBalance = toBalance;
                }
                var askWalletInfo = this.getCurrencyWalletInfo(walletMap, fromCode);
                if (askWalletInfo && askWalletInfo.hasOwnProperty("canUse")) {
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
        if (data && data.Price){
            this.onChangeOrderType(2);
            this.onChangePrice(data.Price);
        }
    }

    onPriceUpdate(){
        if (this.state.orderType==2){
            this.onChangeDefaultPrice(this.state.direction);
        }else{
            this.onChangePrice('');
        }
    }

    onChangeDefaultPrice(direction, isReset){
        const product = this.state.product;

        if (product){
            if (direction==CONST.TRADE.DIRECTION.BID){
                if (product.price && Number(product.price.ASK)){
                    this.onChangePrice(String(Decimal.toFixed(product.price.ASK, product.PriceFixed)), isReset);
                }else{
                    this.onChangePrice('', isReset);
                }
            }else{
                if (product.price && Number(product.price.BID)){
                    this.onChangePrice(String(Decimal.toFixed(product.price.BID, product.PriceFixed)), isReset);
                }else{
                    this.onChangePrice('', isReset);
                }
            }
        }
    }

    onChangeDirection(direction){
        if (this.state.direction!=direction){
            this.setState({direction, percent:0, volume:'', amount:''});

            if (this.state.orderType==2) this.onChangeDefaultPrice(direction, true);

            AuthModel.savePreference(this.directionKey, direction);
        }
    }

    onChangeOrderType(orderType){
        if (this.state.orderType!=orderType){
            if (orderType==1) this.onChangePrice('');
            else this.onChangeDefaultPrice(this.state.direction);

            this.setState({orderType, percent:0, volume:'', amount:''});

            AuthModel.savePreference(this.orderTypeKey, orderType);
        }
    }

    onChangePrice(price, isReset){
        if (this.state.price!=price){
            var data = {price};
            if (!isReset && this.state.orderType==2 && this.state.direction==CONST.TRADE.DIRECTION.BID && this.state.percent){
                var newData = this.calcPercent(this.state.percent, price);
                Object.assign(data, newData);
            }
            this.setState(data);
        }
    }

    onArrowUp(e){
        e.preventDefault();
        e.stopPropagation();

        if (this.priceRef) this.priceRef.onArrowUp();
    }

    onArrowDown(e){
        e.preventDefault();
        e.stopPropagation();

        if (this.priceRef) this.priceRef.onArrowDown();
    }

    onChangeVolume(volume, e){
        if (this.state.volume!=volume){
            var data = {volume};
            if (e) data.percent = 0;
            this.setState(data);
        }
    }

    onChangeAmount(amount, e){
        if (this.state.amount!=amount){
            var data = {amount};
            if (e) data.percent = 0;
            this.setState(data);
        }
    }

    onChangePercent(percent){
        if (this.state.percent!=percent){
            var data = {percent};
            var newData = this.calcPercent(percent, this.state.price);
            Object.assign(data, newData||{});
            this.setState(data);
        }else{
            this.setState({percent:0});
        }
    }

    calcPercent(percent, price){
        if (percent && Number(percent)){
            const {product, direction, orderType, toBalance, fromBalance, vipProduct, vip} = this.state;
            //限价买单的数量要把总额减去需要用到的手续费
            if (orderType==2 && direction==CONST.TRADE.DIRECTION.BID){
                var discountRate = 0;
                // if (vip && vipProduct){
                //     var vipLv = vip.Vip;
                //     var isDiscount = vip.Offset;
                //     var discountVip = vipProduct[vipLv].Spots;
                //     discountRate = isDiscount ? discountVip.Tdfeerate : discountVip.Takerfee;
                // }

                if (price && Number(price) && toBalance){
                    var volume = Decimal.accMul(Decimal.accDiv(toBalance, price, product.VolFixed, true), Decimal.accSubtr(percent/100, discountRate), product.VolFixed, true);
                    return {volume};
                }
                return {volume:0};
            }else if(orderType==1 && direction==CONST.TRADE.DIRECTION.BID){
                if (toBalance && Number(toBalance)){
                    var amount = Decimal.accMul(toBalance, (percent||0)/100);
                    return {amount};
                }
                return {amount:0};
            }

            if (fromBalance){
                var volume = Decimal.accMul(Number(fromBalance), percent/100);
                return {volume};
            }
            return {volume:0};
        }
    }

    onTrade(e){
        e.preventDefault();
        e.stopPropagation();

        if (!AuthModel.checkUserAuth()){
            AuthModel.redirectLogin();
            return;
        }

        if (this.state.isSubmiting) return;

        const {product, orderType, direction, price, volume, amount, fromBalance, toBalance} = this.state;
        const fromCode = product.fromCode;
        const toCode = product.toCode;

        var minQuan = SpotTradeModel.getMinQuantity(fromCode);
        var rid = CONST.CURRENCY[fromCode];
        var currency = CONST.CURRENCY[toCode];

        var error = {volumeError:[], priceError:[], amountError:[]};

        if (orderType == 1){
            var vAmount;
            if (direction == CONST.TRADE.DIRECTION.BID){
                if (!amount){
                    error.amountError.push(Intl.lang("TradeForm.110"));
                }

                if (product && product.price && product.price.ASK){
                    //市价买按usdt最小数量计
                    minQuan = SpotTradeModel.getMinQuantity(toCode);
                    if (amount < minQuan){
                        error.amountError.push(Intl.lang("TradeForm.error.marketBuy", minQuan, toCode));
                    }
                }
                vAmount = amount;
            }else{
                if (!volume){
                    error.volumeError.push(Intl.lang("TradeForm.112"));
                }

                if (volume < minQuan ){
                    var msg = fromCode + Intl.lang("TradeForm.111") + minQuan;
                    error.volumeError.push(msg);
                }
                vAmount = volume;
            }

            this.setState({error});
            for (var key in error){
                if (error[key].length){
                    return;
                }
            }


            this.forceSubmitInterval();

            Net.httpRequest(direction == CONST.TRADE.DIRECTION.BID ?"spot/buy":"spot/sell", {"Rid": rid, "Amount":parseFloat(vAmount), "Price":0, "Currency":currency}, (data)=>{
                if (new Date().getTime() - this.state.reqTime>=this.submitInterval) this.setState({isSubmiting: false, reqTime:0});
                else this.setState({reqTime:0});

                if (data.Status == 0){
                    toast(Intl.lang('tradeInfo.2_27'));
                }
            }, this);
        }else{
            //限价
            if (!price || Number(price)<=0){
                error.priceError.push(Intl.lang("tradeHistory.2_113"));
            }

            if (!volume){
                error.volumeError.push(Intl.lang("tradeInfo.2_25"));
            }

            if (Number(volume) < minQuan ){
                var msg = fromCode + Intl.lang("TradeForm.111") + minQuan;
                error.volumeError.push(msg);
            }

            this.setState({error});
            for (var key in error){
                if (error[key].length){
                    return;
                }
            }

            const _submitLimitOrder = ()=>{
                this.forceSubmitInterval();

                Net.httpRequest(direction == CONST.TRADE.DIRECTION.BID ?"spot/buy":"spot/sell", {"Rid": rid, "Amount":parseFloat(volume), "Price":parseFloat(price), "Currency":currency}, (data)=>{
                    if (new Date().getTime() - this.state.reqTime>=this.submitInterval) this.setState({isSubmiting: false, reqTime:0});
                    else this.setState({reqTime:0});

                    if (data.Status == 0){
                        toast(Intl.lang('tradeInfo.2_27'));
                    }
                }, this);
            };

            _submitLimitOrder();
            // if (!SpotTradeModel.checkDelegateAvgPrice(price, product.price)){
            //     PopDialog.open(<Confirm skin="dialog-bg-blue" isExpert={true} title={Intl.lang("Recharge.note")} content={Intl.lang("trade.delegate.avgLimit")}
            //                             yestxt={Intl.lang("trade.confirm.newOrder")} notxt={Intl.lang("trade.confirm.cancelOrder")} callback={()=>{
            //         _submitLimitOrder();
            //     }}/>, "alert_panel");
            // }else{
            //     _submitLimitOrder();
            // }
        }
    }
    //强制下单间隔
    forceSubmitInterval(){
        this.setState({isSubmiting: true, reqTime:new Date().getTime()});

        this.submitTimer = setTimeout(()=>{
            if (this.state.reqTime==0) this.setState({isSubmiting: false});

            this.submitTimer = 0;
        }, this.submitInterval);
    }

    render(){
        const {code, isMobile} = this.props;
        const {product, direction, percent, orderType, price, volume, amount, vipProduct, vip, fromBalance, toBalance, error, isSubmiting} = this.state;

        var name = '--', fromCode = '--', toCode = '--', fromCs, toCs,cnycs, total='--';
        var priceStep, volumeStep, volumeMax, amountMax;
        var fromFixed = 0, toFixed = 0;
        const isAmount = orderType==1 && direction==CONST.TRADE.DIRECTION.BID; //是否显示金额
        var minAmount = 0;
        if (product){
            name = product.Name;
            fromCode = product.fromCode;
            toCode = product.toCode;
            fromCs = getCurrencySymbol(CONST.CURRENCY[fromCode]);
            toCs = getCurrencySymbol(CONST.CURRENCY[toCode]);
            cnycs = getCurrencySymbol(CONST.CURRENCY.CNY);

            priceStep = Decimal.digit2Decimal(product.PriceFixed);
            volumeStep = Decimal.digit2Decimal(product.VolFixed);

            minAmount = SpotTradeModel.getMinQuantity(toCode);

            var fromCoinInfo = Product.getCoinInfo(CONST.CURRENCY[fromCode]);
            var toCoinInfo = Product.getCoinInfo(CONST.CURRENCY[toCode]);

            fromFixed = fromCoinInfo.Digits;
            toFixed = toCoinInfo.Digits;

            amountMax = Decimal.formatAmount(toBalance||0, fromFixed);
            if (!isAmount) {
                var newData = this.calcPercent(100, price);
                volumeMax = newData.volume;
            }

            // var takerRt = '--',makerRt = '--';
            // var discountRate = 0;
            // // console.log(vip, vipProduct);
            // if (vip && vipProduct){
            //     var vipLv = vip.Vip;
            //     var isDiscount = vip.Offset;
            //     var discountVip = vipProduct[vipLv].Spots;
            //     if (isDiscount && discountVip && discountVip.Tdfeerate>0){
            //         discountRate = discountVip.Tdfeerate;
            //         takerRt = <React.Fragment><span className="trade-order-head-unline">{Decimal.toPercent(discountVip.Takerfee, 2)}</span> {Decimal.toPercent(discountVip.Tdfeerate, 2)}</React.Fragment>
            //         //makerRt = <React.Fragment><span className="trade-order-head-unline">{Decimal.toPercent(discountVip.Makerfee, 2)}</span> {Decimal.toPercent(discountVip.Tdfeerate, 2)}</React.Fragment>
            //     }else{
            //         discountRate = discountVip.Takerfee;
            //         takerRt = <React.Fragment>{Decimal.toPercent(discountVip.Takerfee, 2)}</React.Fragment>
            //         //makerRt = <React.Fragment>{Decimal.toPercent(discountVip.Makerfee, 2)}</React.Fragment>
            //     }
            // }

            if (orderType==2 && price && volume){
                total = Decimal.accMul(price, volume, fromFixed);
                //限价卖单的交易额要减去手续费
                // if (total && Number(total) && direction==CONST.TRADE.DIRECTION.ASK){
                //     total = Decimal.accSubtr(total, Decimal.accMul(total, discountRate), fromFixed);
                // }
            }
        }

        var isLogined = AuthModel.checkUserAuth();

        var self = this;

        return <div className="spot-trading-order">
            <div className="spot-trading-order-header">
                <h3>{name}</h3>
                <p>
                    <span className="spot-trading-item">{toCode+" "+Intl.lang("TradeForm.115")}<span className="spot-color-f3f3f3">{isLogined && toCs ? amountMax :'--'}</span></span>
                    <Link className="spot-trading-link" to={'/recharge'} target="_blank">{Intl.lang('account.1_2')}</Link>
                    <span className="spot-trading-item">{fromCode+" "+Intl.lang("TradeForm.115")}<span className="spot-color-f3f3f3">{isLogined && fromCs ? Decimal.formatAmount(fromBalance||0, toFixed) : '--'}</span></span>
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
                        <li className="spot-trading-input-title">{Intl.lang("trade.open.price")}</li>
                        <li className="spot-trading-input-config">
                            {(orderType == 2) ?
                                <React.Fragment>
                                    <NumberInput value={price} onChange={this.onChangePrice.bind(self)} step={priceStep} min={priceStep} ref={(r)=>self.priceRef=r}/>
                                    <p className="spot-trading-icon-up-down">
                                        <i className="spot-trading-icon-triangle up" onMouseDown={this.onArrowUp.bind(self)}></i>
                                        <i className="spot-trading-icon-triangle down" onMouseDown={this.onArrowDown.bind(self)}></i>
                                    </p>
                                </React.Fragment>
                                :
                                <input value={Intl.lang("futures.trade_title2")} readOnly={true}/>
                            }
                            <p className="uit">{toCode}</p>
                        </li>
                        {(error && error.priceError[0]) && <p className="spot-trading-input-error"><i className="iconfont icon-tips"></i>{error.priceError[0]}</p>}
                        {orderType == 2 && <p className="c-8 tl mt-10"><ExchangePrice price={price} code={code} /></p>}
                    </ul>

                    {isAmount ?
                        <ul className="spot-trading-input-item">
                            <li className="spot-trading-input-title">{Intl.lang("TradeHistory.106")}</li>
                            <li className="spot-trading-input-config">
                                <NumberInput step={priceStep} value={amount}
                                             onChange={this.onChangeAmount.bind(self)}
                                             min={minAmount}
                                             max={amountMax}
                                             isRtnEvent={true}
                                />
                                <p className="uit">{toCode}</p>
                            </li>
                            {(error && error.amountError[0]) && <p className="spot-trading-input-error"><i
                                className="iconfont icon-tips"></i>{error.amountError[0]}</p>}
                        </ul>
                        :
                        <ul className="spot-trading-input-item">
                            <li className="spot-trading-input-title">{Intl.lang("tradeHistory.1_9")}</li>
                            <li className="spot-trading-input-config">
                                <NumberInput step={volumeStep} value={volume}
                                             onChange={this.onChangeVolume.bind(self)}
                                             min={volumeStep}
                                             max={volumeMax}
                                             isRtnEvent={true}
                                />
                                <p className="uit">{fromCode}</p>
                            </li>
                            {(error && error.volumeError[0]) && <p className="spot-trading-input-error"><i
                                className="iconfont icon-tips"></i>{error.volumeError[0]}</p>}
                        </ul>
                    }

                    <ul className="spot-trading-input-item">
                        <li className="spot-trading-input-config bg-none">
                            <PercentBtn className="spot-trading-span-Percentage" dataArr={self.percentData}
                                        value={Number(percent)}
                                        onChange={this.onChangePercent.bind(self)} />
                        </li>
                    </ul>

                    {orderType==2 &&
                    <ul className="spot-trading-input-item-text">
                        {Intl.lang("TradeForm.amount")+Intl.lang("common.symbol.colon")}<span>{total +' '+toCode}</span>
                    </ul>}
                    {/*{!IS_CLOSE_EXCHANGE &&*/}
                    {/*<ul className="spot-trading-input-item-text">*/}
                        {/*{Intl.lang("tradeHistory.2_69")+Intl.lang("common.symbol.colon")}{takerRt} <Link className="link-config-style" to="/personal/viprights" target="_blank">{Intl.lang("common.view")}<i className="iconfont icon-arrow-l"></i></Link>*/}
                    {/*</ul>*/}
                    {/*}*/}
                    {AuthModel.checkUserAuth() ?
                        <button className={"spot-trading-btn-config "+(direction==CONST.TRADE.DIRECTION.BID?'buy':'sell')+(!isSubmiting ? '' : ' bg-gray')}  onClick={this.onTrade.bind(self)}>
                            <p>{Intl.lang(direction==CONST.TRADE.DIRECTION.BID ? 'TradeForm.108' : 'TradeForm.109')}</p>
                        </button>
                        :
                        <div className="spot-trading-btn-config ">
                            <p dangerouslySetInnerHTML={{__html:Intl.lang("TradeForm.unLogin", "?return_to=/exchange/"+(product ? product.Code : ""))}} className="tc"></p>
                        </div>
                    }
                </div>
            </div>
        </div>
    }
}

class ExchangePrice extends PureComponent{
    componentWillMount() {
        Event.addListener(Event.EventName.EXCHANGERATE_UPDATE, this.onExchangeRate.bind(this), this);
    }
    onExchangeRate(){
        this.forceUpdate();
    }
    render(){
        const {price, code} = this.props;
        var cnycs = getCurrencySymbol(CONST.CURRENCY.CNY);

        return Intl.lang("TradeExpert.100")+" ≈ "+ (price ? SpotTradeModel.calcPriceToCny(code, price) : "--") +" "+cnycs.sn
    }
}
