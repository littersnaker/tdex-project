import React from 'react';
//订单预览
import Intl from "../intl";
import FutTradeModel from "../model/fut-trade";
import PureComponent from "../core/PureComponent";
import PopDialog from "../utils/popDialog";
import {CONST} from "../public/const"
import Decimal from "../utils/decimal";
import Event from '../core/event';

export class FutPreviewSimple extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            isOneKeyTrade: false
        }
    }

    onConfirm(e, confirm) {
        e.preventDefault();
        e.stopPropagation();

        this.props.onConfirm(confirm);

        PopDialog.closeByDomID('order-preview');
    }

    getOrderItemSubTitle(data, product, isShowID, i){
        //为了方便翻译，用替换的形式
        var buySell, triggerDesc, colorName;
        if (data.Side==CONST.FUT.Side.BUY){
            colorName =  'pbuy';
            buySell = Intl.lang("trade.buy");
            if (data.Constant && data.Constant>0) triggerDesc = Intl.lang(data.Variable==CONST.FUT.Variable.LastPrice? "trade.open.lastPrice" : "trade.history.Mark")+Intl.lang("common.symbol.ge")+data.Constant;
        }else{
            colorName =  'psell';
            buySell = Intl.lang("trade.sell");
            if (data.Constant && data.Constant>0) triggerDesc = Intl.lang(data.Variable==CONST.FUT.Variable.LastPrice? "trade.open.lastPrice" : "trade.history.Mark")+Intl.lang("common.symbol.le")+data.Constant;
        }
        var subTitle1 = Intl.lang("trade.preview.open1", `<span>${isShowID?(data.PID ? "#"+data.PID:""):""}</span><span class="txt">${buySell}</span>`, `<span class="txt">${data.Price>0?data.Price:Intl.lang("trade.order.Strategy00")}</span><span> ${data.Price>0?product.toCode:""}</span>`, `<span class="txt"> ${data.Volume}</span>`, product.DisplayName);
        if (triggerDesc) subTitle1 = Intl.lang("trade.preview.open2", `<span class="txt">${triggerDesc+" "}</span>`, subTitle1);

        return  <p className="c-d" dangerouslySetInnerHTML={{__html:subTitle1}} className={colorName} key={"fps"+i}></p>
    }

    render() {
        const {product, action, data} = this.props;
        const skin = FutTradeModel.getSkin();

        var title, content = "", btns, btnClass = "";
        if (action == 'open') {
            var colorName = "", buySell = "", buySellBtn = "";
            if (data.Side==CONST.FUT.Side.BUY){
                colorName =  'pbuy';
                buySell = Intl.lang("trade.buy");
                buySellBtn = Intl.lang("trade.buyTxt");
                btnClass = "btn-buy";
            }else{
                colorName =  'psell';
                buySell = Intl.lang("trade.sell");
                buySellBtn = Intl.lang("trade.sellTxt");
                btnClass = "btn-sell";
            }

            var tradeType = data.Price==0 ?
                (data.Strategy==CONST.FUT.Strategy.Immediate ? Intl.lang("trade.order.Strategy00") : Intl.lang("trade.order.Strategy01"))
                :
                (data.Strategy==CONST.FUT.Strategy.Immediate ? Intl.lang("trade.order.Strategy10") : Intl.lang("trade.order.Strategy11"))

            var delegateValue = FutTradeModel.formula.delegateValue(product.Scale, data.Price>0?data.Price:(data.Constant ? data.Constant : (data.Side==CONST.FUT.Side.BUY?product.price.ASK:product.price.BID)), data.Volume, product.ShowFixed);
            var {deposit, repay, takerFee} = FutTradeModel.formula.unitOrderFee(data.Price>0, data.Side, product.Scale, data.Scale, product.price, data.Price, product.TakerFee, false);
            var unitDeposit = Decimal.accAdd(Decimal.accAdd(deposit, repay), takerFee);
            var depositTotal = Decimal.accMul(unitDeposit, data.Volume, product.ShowFixed);

            var expectForce;
            var price = data.Side==CONST.FUT.Side.BUY ? product.price.ASK : product.price.BID;
            var stat = FutTradeModel.getProductPosStat(data.CID);
            if (stat){
                var posTotalVolume = stat.volume + data.Volume;
                expectForce = FutTradeModel.formula.expectForce(data.Side, product.Scale, data.Price, price, data.Volume, data.Scale, product.price.MARK, product.TakerFee, posTotalVolume, product.Risks, product.AvgPriceFixed);
            }


            title = (<div className={"tc "+colorName}>
                <h3>{Intl.lang("trade.preview.open0")}</h3>
                <h5></h5>
                <div className="mt-20 lh-22">
                    <p className="fs16"><span className="txt">{tradeType+ " "+ buySell}</span><span>{Intl.lang("trade.preview.open3")}</span></p>
                    {this.getOrderItemSubTitle(data, product)}
                </div>
            </div>);
            content = (<div className="mt-20 easy-dialog-center lh-25">
                <p><span>{Intl.lang("trade.history.delegateValueDesc_O")}</span><span>{`${delegateValue}(${product.fromCode})`}</span></p>
                <p><span>{Intl.lang("trade.history.ScaleTxt")}</span><span>{Intl.lang("trade.preview.lever", data.Scale)}</span></p>
                <p><span>{Intl.lang("trade.preview.deposit")}</span><span>{`${depositTotal}(${product.fromCode})`}</span></p>
                <p><span>{Intl.lang("trade.preview.expectForce")}</span><span>{`${expectForce}(${product.toCode})`}</span></p>
                <p><span>{Intl.lang("trade.preview.volume")}</span><span>{Intl.lang("trade.preview.volumeDesc", data.Volume)}</span></p>
                {data.Passive && <p><span>{Intl.lang("trade.open.beidong")}</span></p>}
                {data.Visible>=0 && <p><span>{Intl.lang("trade.open.hideDelegate")}</span><span>{data.Visible+'/'+data.Volume}</span></p>}
                {data.SL && <p><span>{Intl.lang("trade.open.loss") + " " +Intl.lang(data.SL.Distance?"trade.open.lossProfitOption1":"trade.open.lossProfitOption2")}</span><span>{data.SL.Param}</span></p>}
                {data.TP && <p><span>{Intl.lang("trade.order.Action0") + " " +Intl.lang(data.TP.Distance?"trade.open.lossProfitOption1":"trade.open.lossProfitOption2")}</span><span>{data.TP.Param}</span></p>}
            </div>);
            btns = <div className="easy-dialog-foot flex-sb mt-10">
                <button className="btn easy-btn-cancel" onClick={(e)=>this.onConfirm(e, false)}>{Intl.lang("common.cancel")}</button>
                <button className={"btn "+btnClass} onClick={(e)=>this.onConfirm(e, true)}>{buySellBtn}</button>
            </div>
        }else if(action=='close'){ //市价平仓 取消订单
            var len = data.data.length;
            var isCancelOrder = data.tab==3;
            var btn = Intl.lang(isCancelOrder ? "trade.preview.cancelOrder" : "trade.history.pOperate1");

            var btnClass = "";
            if (len==1){
                var colorName = "", tradeType = "";
                var row = data.data[0];
                var isSummary = !!row.List;
                var buySell = "";
                //平仓方向相反
                if (!isSummary){
                    var side = isCancelOrder ? row.Side : row.Side==CONST.FUT.Side.BUY ? CONST.FUT.Side.SELL : CONST.FUT.Side.BUY;
                    if (side==CONST.FUT.Side.SELL){
                        colorName =  'psell';
                        tradeType = Intl.lang("futures.tab2_btn2")+Intl.lang("trade.order.Action2")
                        buySell = Intl.lang("trade.sell");
                        btnClass = "btn-sell";
                    }else{
                        colorName =  'pbuy';
                        tradeType = Intl.lang("futures.tab2_btn1")+Intl.lang("trade.order.Action2")
                        buySell = Intl.lang("trade.buy");
                        btnClass = "btn-buy";
                    }
                }

                var subTitle1;
                if (!isSummary){
                    subTitle1 = Intl.lang("trade.preview.open1", `<span class="txt">${buySell}</span>`, `<span class="txt">${Intl.lang("trade.order.Strategy00")}</span>`, `<span class="txt"> ${row.Volume}</span>`, product.DisplayName);
                }else{
                    subTitle1 = `<span class="txt">${Intl.lang("trade.order.preview_close2", product.DisplayName)}</span>`;
                }

                title = <div className={"tc "+colorName}>
                    <h3>{btn}</h3>
                    <h5>{len==1 && !isSummary ?`#${!isCancelOrder ? row.ID : row.PID}`:""}</h5>
                    <div className="mt-20 lh-22">
                        <p className="fs16">{!isCancelOrder && !isSummary && <span className="txt">{tradeType}</span>}</p>
                        <p className="c-d" dangerouslySetInnerHTML={{__html:subTitle1}}></p>
                    </div>
                </div>
            }else{

                var list = data.data.map((v, i)=>{
                    var product = FutTradeModel.getProductByID(v.CID);
                    if (!isCancelOrder){
                        var colorName = v.Side==CONST.FUT.Side.BUY ? 'psell' : 'pbuy';
                        var buySell = v.Side==CONST.FUT.Side.BUY ? Intl.lang("trade.sell") : Intl.lang("trade.buy");
                        var subTitle1 = Intl.lang("trade.preview.open1", `<span>#${v.ID} </span></span><span class="txt">${buySell}</span>`, `<span class="txt">${Intl.lang("trade.order.Strategy00")}</span>`, `<span class="txt"> ${v.Volume}</span>`, product.DisplayName);
                        return <p className="c-d" dangerouslySetInnerHTML={{__html:subTitle1}} className={colorName} key={"fps"+i}></p>
                    }else{
                        return this.getOrderItemSubTitle(v, product, true, i);
                    }
                });
                title = <div className={"tc"}>
                    <h3>{btn}</h3>
                    <div className="mt-20 lh-22">
                        {list}
                    </div>
                </div>
            }

            btns = <div className="easy-dialog-foot flex-sb mt-10">
                <button className="btn easy-btn-cancel" onClick={(e)=>this.onConfirm(e, false)}>{Intl.lang("common.cancel")}</button>
                <button className={"btn "+btnClass} onClick={(e)=>this.onConfirm(e, true)}>{btn}</button>
            </div>
        }

        return (
            <section className={"ft-trade-easy-panel shadow-w futures-bg-"+skin} id="order-preview" style={{minWidth: "320px"}}>
                <header className="dialog-head tc lh-25">
                    <i className="iconfont icon-close transit fem875" onClick={(e) => this.onConfirm(e, false)}></i>
                </header>
                <div className="ft-easy-dialog-detail">
                    {title}
                    {content}
                    <NotShowDialogCheckbox />
                    {btns}
                </div>
            </section>
        )
    }
}

export class NotShowDialogCheckbox extends PureComponent{
    constructor(props) {
        super(props);

        this.state = {
            isOneKeyTrade: false
        }
    }

    onChangeOneKeyTrade(e){
        var isOneKeyTrade = e.target.checked;
        if (this.state.isOneKeyTrade!=isOneKeyTrade){
            this.setState({isOneKeyTrade});
            Event.dispatch(Event.EventName.IS_ONEKEY_TRADE, isOneKeyTrade);
        }
    }

    render(){
        const {isOneKeyTrade} = this.state;

        return (
            <div className="easy-dialog-show">
                <label className="custom-checkbox">
                    <div className="mr-10">
                        <input type="checkbox" className="input_check" checked={isOneKeyTrade} onChange={this.onChangeOneKeyTrade.bind(this)} />
                        <i></i>
                    </div>
                    <span>{Intl.lang("common.dialog.notShow")}</span>
                </label>
            </div>
        )
    }
}

