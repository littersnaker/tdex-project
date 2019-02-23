import React from 'react';
import PureComponent from "../core/PureComponent";
import Intl from '../intl';

import PopDialog from "../utils/popDialog"
import {CONST} from "../public/const";
import AuthModel from "../model/auth";
import Decimal from "../utils/decimal";
import OptionsNumberInput from "./OptionsNumberInput"
import FutTradeModel from "../model/fut-trade";
import Notification from "../utils/notification";
import AccountModel from "../model/account";
import Net from "../net/net";

class FuturesCalculator extends PureComponent {
    constructor(props) {
        super(props);

        this.leverOptions = FutTradeModel.leverOptions;
        this.volOptions = FutTradeModel.formVar.volOptions;
        this.skinTheme = FutTradeModel.getSkin();
        this.state = {
            tab: 1,
            side:CONST.FUT.Side.BUY,
            lever: 20,
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
        const {product} = this.props;
        const {tab, side, lever, forceClosePrice, price, targetProfit, volume} = this.state;
        var retn = {};
        if (tab==1){
            retn.delegateValue = FutTradeModel.formula.delegateValue(product.Scale, price, volume, product.CalcFixed);
            retn.plVal = FutTradeModel.formula.plVal(side, price, forceClosePrice, volume, product.Scale, product.CalcFixed);
        }else if(tab==2){
            var depositRate = FutTradeModel.formula.leverToDepositRate(lever);
            var deposit = FutTradeModel.formula.deposit(product.Scale, volume, depositRate, price);
            var repay = product.price.MARK ? FutTradeModel.formula.getRepay(side, product.Scale, volume, price, product.price.MARK) : 0;
            var stat = FutTradeModel.getProductPosStat(product.ID);
            var posTotalVolume = (stat ? stat.volume : 0) + volume;
            var keepDeposit = FutTradeModel.formula.getKeepDeposit(product.Scale, price, volume, posTotalVolume, product.Risks);
            var fundFee = FutTradeModel.formula.fundFee(product.Scale, price, volume, side, product.price.FUND_RATE);

            var depositTotal = Decimal.accAdd(deposit, repay);

            retn.forceClosePrice = FutTradeModel.formula.getForceClosePrice(product.Scale, volume, side, price, depositTotal, keepDeposit, fundFee, product.TakerFee, product.PriceFixed);
        }else{
            var param1 = side==CONST.FUT.Side.BUY?1:-1;
            retn.closePrice = Decimal.accDiv(1, Decimal.accSubtr(Decimal.accDiv(1, price), Decimal.accDiv(targetProfit, product.Scale*volume*param1)), product.PriceFixed);
        }
        return retn;
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
        var product = FutTradeModel.getProductByID(formData.CID);
        if (product){
            var wallet = AccountModel.getCurrencyWallet(CONST.WALLET.TYPE.FUT, product.Currency);
            if (wallet) {
                var canUse = wallet.canUse;
                return FutTradeModel.checkFormData(formData, canUse);
            }
        }
        return {ok:false, error:[]};
    }

    openOrder(formData, callback){
        Net.httpRequest("futures/open", formData, (data)=>{
            if (data.Status == 0){
                Notification.success(Intl.lang('trade.open.ok'));
            }
            if (callback) callback(data.Status == 0);
        }, this);
    }

    render() {
        const {product} = this.props;
        const {tab, side, lever, forceClosePrice, price, targetProfit, volume, isCalced} = this.state;

        var btnDisable = false;
        if (tab==1) btnDisable = !lever || !price || !volume || !forceClosePrice;
        else if (tab==2) btnDisable = !lever || !price || !volume;
        else if (tab==3) btnDisable = !targetProfit || !lever || !price || !volume;

        var fromMin, priceMin;
        if (product){
            fromMin = String(Decimal.digit2Decimal(product.CalcFixed));
            priceMin = String(Decimal.digit2Decimal(product.PriceFixed));
        }

        var showResult = isCalced && !btnDisable;

        var retn;
        if (showResult){
            retn = this.calculate();
        }

        const isLogined = AuthModel.checkUserAuth();

        return (
            <section className={"ft-trade-easy-panel shadow-w futures-bg-"+this.skinTheme} id="fut-calc" style={{minWidth: "320px"}}>
                <header className="dialog-head tc lh-25">
                    <i className="iconfont icon-close transit fem875" onClick={()=>PopDialog.close()}></i>
                </header>
                <div className="ft-calculator-section">
                    <div className="calc-head">
                        <h3>{Intl.lang("trade.calculator.theme")}</h3>
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
                                <OptionsNumberInput value={lever} options={this.leverOptions} labelFormat="%sx" step={0.01} unit="x" className="slider-number-box ver-md" min={Decimal.getDotDigit(lever)>2 ? 0.000001:0.01} max={20} onChange={this.onChangeLever.bind(this)}/>
                            </dd>
                        </dl>
                        <dl className="mt-20 ft-easy-block">
                            <dt>{Intl.lang("trade.calculator.volume")}</dt>
                            <dd className="ft-easy-tab slider-type3 slider-panel-h30">
                                <OptionsNumberInput value={volume} isRequire={false} unit={Intl.lang("trade.preview.volumeDesc", "")} min={1} max={FutTradeModel.volumeMax}
                                                    step={1} className="slider-number-box ver-md"
                                                    onChange={this.onChangeVolume.bind(this)}/>
                            </dd>
                        </dl>
                        <dl className="mt-20 ft-easy-block">
                            <dt>{Intl.lang("trade.calculator.price")}</dt>
                            <dd className="ft-easy-tab slider-type3 slider-panel-h30">
                                <OptionsNumberInput value={price} isRequire={false} unit={product ? product.toCode : ''} min={priceMin} max={FutTradeModel.priceMax} step={priceMin} className="slider-number-box ver-md" onChange={this.onChangePrice.bind(this)}/>
                            </dd>
                        </dl>
                        {tab==1 && <dl className="mt-20 ft-easy-block">
                            <dt>{Intl.lang("trade.editOrder.closePosPrice")}</dt>
                            <dd className="ft-easy-tab slider-type3 slider-panel-h30">
                                <OptionsNumberInput value={forceClosePrice} isRequire={false} unit={product ? product.toCode : ''} min={priceMin} max={FutTradeModel.priceMax} step={priceMin} className="slider-number-box ver-md" onChange={this.onChangeForceClosePrice.bind(this)}/>
                            </dd>
                        </dl>}
                        <div className="easy-dialog-foot mt-30">
                            <button className={"btn easy-btn-submit calc-btn"+(btnDisable ? " btnDis":"")} onClick={()=>{if (!btnDisable) this.onChangeIsCalc()}}>{Intl.lang("trade.calculator.calc")}</button>
                        </div>

                        {showResult &&
                        <div className="mt-10 flex-sb c-8">
                            <p className="c-d w-100">{Intl.lang("trade.calculator.result")+Intl.lang("common.symbol.colon")}</p>
                            {tab==1 && <div>
                                <p><span>{Intl.lang("trade.calculator.delegateValue")+Intl.lang("common.symbol.colon")}</span><span className="c-d">{retn.delegateValue+" "+product.fromCode}</span></p>
                                <p><span>{Intl.lang("trade.calculator.pl")+Intl.lang("common.symbol.colon")}</span><span className="c-d">{retn.plVal+" "+product.fromCode}</span></p>
                            </div>}
                            {tab==2 && <div>
                                <p><span>{Intl.lang("trade.history.ForceDesc")+Intl.lang("common.symbol.colon")}</span><span className="c-d">{retn.forceClosePrice+" "+product.toCode}</span></p>
                            </div>}
                            {tab==3 && <div>
                                {retn.closePrice && Number(retn.closePrice) > 0 ?
                                    (<p>
                                        <span>{Intl.lang("trade.calculator.closePrice") + Intl.lang("common.symbol.colon")}</span><span
                                        className="c-d">{retn.closePrice + " " + product.toCode}</span></p>)
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

export default FuturesCalculator;
