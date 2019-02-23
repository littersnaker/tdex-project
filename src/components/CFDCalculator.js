import React from 'react';
import PureComponent from "../core/PureComponent";
import Intl from '../intl';

import PopDialog from "../utils/popDialog"
import {CONST} from "../public/const";
import AuthModel from "../model/auth";
import Decimal from "../utils/decimal";
import OptionsNumberInput from "./OptionsNumberInput"
import CfdTradeModel from "../model/cfd-trade";
import Notification from "../utils/notification";
import AccountModel from "../model/account";
import Net from "../net/net";

export default class CFDCalculator extends PureComponent {
    constructor(props) {
        super(props);

        const {code} = this.props;
        var product = CfdTradeModel.getProduct(code);
        this.leverOptions = CfdTradeModel.getLeverOptions(product);
        var currency = CfdTradeModel.getCurrency();
        var contract = CfdTradeModel.getProductContract(product, currency);
        this.state = {
            product: product,
            contract: contract,
            currency: currency,
            tab: 1,
            side:CONST.FUT.Side.BUY,
            lever: this.leverOptions[this.leverOptions.length-1],
            price:'',                //开仓价
            forceClosePrice:'',      //平仓价
            targetProfit:'',
            volume:'',
            isCalced: false
        }
    }

    onChangeTab(tab){
        if (this.state.tab!=tab){
            this.setState({tab});
        }
    }

    onChangeSide(side){
        if (this.state.side!=side){
            this.setState({side});
        }
    }

    onChangeLever(val){
        if (this.state.lever!=val){
            this.setState({lever:val});
        }
    }

    onChangePrice(price){
        if (this.state.price!=price){
            this.setState({price});
        }
    }

    onChangeForceClosePrice(forceClosePrice){
        if (this.state.forceClosePrice!=forceClosePrice){
            this.setState({forceClosePrice});
        }
    }

    onChangeTargetProfit(targetProfit){
        if (this.state.targetProfit!=targetProfit){
            this.setState({targetProfit});
        }
    }

    onChangeVolume(volume){
        if (this.state.volume!=volume){
            this.setState({volume});
        }
    }

    onChangeIsCalc(){
        this.setState({isCalced:true});
    }

    calculate(){
        const {product, contract, currency, tab, side, lever, forceClosePrice, price, targetProfit, volume} = this.state;
        var retn = {};
        try{
            if (tab==1){
                retn.delegateValue = CfdTradeModel.formula.delegateValue(contract.RealMultiplier, price, volume, contract.CalcFixed);
                retn.plVal = CfdTradeModel.formula.plVal(side, price, forceClosePrice, volume, contract.Multiplier, contract.CalcFixed);
            }else if(tab==2){
                //multiplier, marginPips, volume
                // var deposit = CfdTradeModel.formula.deposit(contract.Multiplier, CfdTradeModel.formula.marginPips(price, lever, product.Pip), volume);
                //side, avgPrice, addDeposit=0, volume, multiplier, marginPip, feePip, swapPip, swapDay, pip
                var marginPip = CfdTradeModel.formula.marginPips(price, lever, product.Pip);
                retn.forceClosePrice = CfdTradeModel.formula.getForceClosePrice(side, price, 0, volume, contract.Multiplier, marginPip, product.Fee, product.Swap, 0, product.Pip);
            }else{
                //盈亏*初始点/(数量 * 合约规模1)=(买卖价 - 均价)
                var param1 = side==CONST.FUT.Side.BUY?1:-1;
                retn.closePrice = Decimal.accAdd(Decimal.accDiv(Decimal.accMul(targetProfit, product.Pip), Decimal.accMul(volume, contract.Multiplier)), Decimal.accMul(price, param1), product.PriceFixed);
            }
            return retn;
        }catch(e){
            console.log(e);
            return retn;
        }
    }

    quickOpen(retn){
        const {product} = this.props;
        const {tab, side, lever, forceClosePrice, price, targetProfit, volume, isCalced} = this.state;

        var formData;
        if (tab==1){
            if (Number(retn.plVal)<0){
                Notification.error(Intl.lang("trade.calculator.openError"));
                return;
            }
            formData = {
                Distance: false,
                Price: Number(price),
                Timely: CONST.FUT.Timely.GTC,
                TimelyParam: 0,
                Passive: false,
                Visible: -1,
                Strategy: CONST.FUT.Strategy.Immediate,
                Better: false,
            };
            formData.TP = {
                Distance:  false,
                Param: Number(forceClosePrice)
            };
        }else if(tab==2){
            formData = {
                Distance: false,
                Price: Number(price),
                Timely: CONST.FUT.Timely.GTC,
                TimelyParam: 0,
                Passive: false,
                Visible: -1,
                Strategy: CONST.FUT.Strategy.Immediate,
                Better: false,
            };
        }else{
            if (Number(retn.closePrice)<=0){
                Notification.error(Intl.lang("trade.calculator.openError"));
                return;
            }

            formData = {
                Distance: false,
                Price: Number(price),
                Timely: CONST.FUT.Timely.GTC,
                TimelyParam: 0,
                Passive: false,
                Visible: -1,
                Strategy: CONST.FUT.Strategy.Immediate,
                Better: false,
            };
            formData.TP = {
                Distance:  false,
                Param: Number(retn.closePrice)
            };
        }

        formData.CID = product.ID;
        formData.Scale = Number(lever);
        formData.Volume = Number(volume);
        formData.Side = Number(side);

        const {ok, error} = this.checkValidFormData(formData);
        if (ok){
            this.openOrder(formData);
        }else{
            error.forEach((v, i)=>{
                Notification.error(v);
            });
            // if (callback)callback(false);
        }
    }

    checkValidFormData = (formData)=>{
        var wallet = AccountModel.getCurrencyWallet(CONST.WALLET.TYPE.CFD, this.state.currency);
        if (wallet) {
            var canUse = wallet.canUse;
            return CfdTradeModel.checkFormData(formData, canUse);
        }
        return {ok:false, error:[]};
    }

    openOrder(formData, callback){
        Net.httpRequest("cfd/open", formData, (data)=>{
            if (data.Status == 0){
                Notification.success(Intl.lang('trade.open.ok'));
            }
            if (callback) callback(data.Status == 0);
        }, this);
    }

    render() {
        const {product, currency, contract, tab, side, lever, forceClosePrice, price, targetProfit, volume, isCalced} = this.state;

        var btnDisable = false;
        if (tab==1) btnDisable = !lever || !price || !volume || !forceClosePrice;
        else if (tab==2) btnDisable = !lever || !price || !volume;
        else if (tab==3) btnDisable = !targetProfit || !lever || !price || !volume;

        var fromMin, priceMin;
        if (product){
            fromMin = String(Decimal.digit2Decimal(contract.CalcFixed));
            priceMin = String(Decimal.digit2Decimal(product.PriceFixed));
        }

        var showResult = isCalced && !btnDisable;

        var retn;
        if (showResult){
            retn = this.calculate();
        }

        const isLogined = AuthModel.checkUserAuth();

        return (
            <section className={"ft-trade-easy-panel shadow-w futures-bg-primary"} style={{minWidth: "320px"}}>
                <header className="dialog-head tc lh-25">
                    <i className="iconfont icon-close transit fem875" onClick={()=>this.props.close()}></i>
                </header>
                <div className="ft-calculator-section">
                    <div className="calc-head">
                        <h3>{Intl.lang("trade.calculator.theme")}</h3>
                        <p className="mt-10">{(product?product.Code:"")+" ("+(contract ? contract.Coin : "")+")"}</p>
                        <div className="calc-sub-title mt-40 flex-sb fs16">
                            <span className={tab==1?"current":""} onClick={this.onChangeTab.bind(this, 1)}>{Intl.lang("trade.calculator.type1")}</span>
                            <span className={tab==2?"current":""} onClick={this.onChangeTab.bind(this, 2)}>{Intl.lang("trade.calculator.type2")}</span>
                            <span className={tab==3?"current":""} onClick={this.onChangeTab.bind(this, 3)}>{Intl.lang("trade.calculator.type3")}</span>
                        </div>
                    </div>
                    <div className="ft-newOrder-easy ft-calculator-detail">
                        <dl className="mt-30 ft-easy-block">
                            <dt>{Intl.lang("trade.calculator.side")}</dt>
                            <dd className="calc-dir">
                                <span className={side==CONST.FUT.Side.BUY?"current":""} onClick={this.onChangeSide.bind(this, CONST.FUT.Side.BUY)}>{Intl.lang("trade.side.LONG")}</span>
                                <span className={side==CONST.FUT.Side.SELL?"current":""} onClick={this.onChangeSide.bind(this, CONST.FUT.Side.SELL)}>{Intl.lang("trade.side.SHORT")}</span>
                            </dd>
                        </dl>
                        {tab==3 &&
                        <dl className="mt-20 ft-easy-block">
                            <dt>{Intl.lang("trade.calculator.profit")}</dt>
                            <dd className="ft-easy-tab slider-type3 slider-panel-h30">
                                <OptionsNumberInput value={targetProfit} isRequire={false} unit={product ? product.fromCode : ''} min={fromMin} step={fromMin} className="slider-number-box ver-md" onChange={this.onChangeTargetProfit.bind(this)}/>
                            </dd>
                        </dl>}
                        <dl className="mt-20 ft-easy-block">
                            <dt>{Intl.lang("trade.open.lever")}</dt>
                            <dd className="ft-easy-tab slider-type2 slider-panel-h30 fs11">
                                <OptionsNumberInput value={lever} options={this.leverOptions} labelFormat="%sx" step={1} unit="x" className="slider-number-box ver-md" min={this.leverOptions[0]} max={this.leverOptions[this.leverOptions.length-1]} onChange={this.onChangeLever.bind(this)}/>
                            </dd>
                        </dl>
                        <dl className="mt-20 ft-easy-block">
                            <dt>{Intl.lang("trade.calculator.volume")}</dt>
                            <dd className="ft-easy-tab slider-type3 slider-panel-h30">
                                <OptionsNumberInput value={volume} isRequire={false} unit={Intl.lang("trade.preview.volumeDesc", "")} min={1} max={contract ? contract.VolumeMax:1000000}
                                                    step={1} className="slider-number-box ver-md"
                                                    onChange={this.onChangeVolume.bind(this)}/>
                            </dd>
                        </dl>
                        <dl className="mt-20 ft-easy-block">
                            <dt>{Intl.lang("trade.calculator.price")}</dt>
                            <dd className="ft-easy-tab slider-type3 slider-panel-h30">
                                <OptionsNumberInput value={price} isRequire={false} unit="USD" min={priceMin} max={product.PriceMax} step={product.UnitPrice} className="slider-number-box ver-md" onChange={this.onChangePrice.bind(this)}/>
                            </dd>
                        </dl>
                        {tab==1 && <dl className="mt-20 ft-easy-block">
                            <dt>{Intl.lang("trade.editOrder.closePosPrice")}</dt>
                            <dd className="ft-easy-tab slider-type3 slider-panel-h30">
                                <OptionsNumberInput value={forceClosePrice} isRequire={false} unit="USD" min={priceMin} max={product.PriceMax} step={product.UnitPrice} className="slider-number-box ver-md" onChange={this.onChangeForceClosePrice.bind(this)}/>
                            </dd>
                        </dl>}
                        <div className="easy-dialog-foot mt-30">
                            <button className={"btn easy-btn-submit calc-btn"+(btnDisable ? " btnDis":"")} onClick={()=>{if (!btnDisable) this.onChangeIsCalc()}}>{Intl.lang("trade.calculator.calc")}</button>
                        </div>

                        {showResult &&
                        <div className="mt-10 flex-sb c-8">
                            <p className="c-d w-100">{Intl.lang("trade.calculator.result")+Intl.lang("common.symbol.colon")}</p>
                            {tab==1 && <div>
                                <p><span>{Intl.lang("trade.calculator.delegateValue")+Intl.lang("common.symbol.colon")}</span><span className="c-d">{retn.delegateValue+" "+ contract.Coin}</span></p>
                                <p><span>{Intl.lang("trade.calculator.pl")+Intl.lang("common.symbol.colon")}</span><span className="c-d">{retn.plVal+" "+ contract.Coin}</span></p>
                            </div>}
                            {tab==2 && <div>
                                <p><span>{Intl.lang("trade.history.ForceDesc")+Intl.lang("common.symbol.colon")}</span><span className="c-d">{retn.forceClosePrice+" USD"}</span></p>
                            </div>}
                            {tab==3 && <div>
                                {retn.closePrice && Number(retn.closePrice) > 0 ?
                                    (<p>
                                        <span>{Intl.lang("trade.calculator.closePrice") + Intl.lang("common.symbol.colon")}</span><span
                                        className="c-d">{retn.closePrice + " USD"}</span></p>)
                                    :
                                    (<p>
                                        <span>{Intl.lang("trade.calculator.closePriceError")}</span></p>)
                                }
                            </div>}
                        </div>}
                        <div className="mt-10 c-6 fs11">
                            {Intl.lang("trade.calculator.note")}
                        </div>
                        {isLogined && <div className="mt-20 gold fs12 tc">
                            <span className={"cursorLight"+(btnDisable ? " disable":"")} onClick={()=>{if(!btnDisable){this.quickOpen(retn)}}}>{Intl.lang("trade.calculator.quickOpen")}</span>
                        </div>}
                    </div>
                </div>
            </section>
        )
    }
}
