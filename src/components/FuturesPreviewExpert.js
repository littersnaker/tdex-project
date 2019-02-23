import React from 'react';
//订单预览
import Intl from "../intl";
import FutTradeModel from "../model/fut-trade";
import PureComponent from "../core/PureComponent";
import PopDialog from "../utils/popDialog";

import {FutTradeProduct, FutPricePart} from "./FuturesNewOrderExpert"

export class FutPreviewExpert extends PureComponent{
    constructor(props) {
        super(props);

        this.state = {
        }
    }
    componentDidMount() {
        var pn = this.panel.parentNode;
        pn.style.position = 'absolute';
        pn.style.visibility = 'hidden';
        pn.style.top = "-1000px";
        pn.style.left = "-1000px";

        var x,y;
        if (this.props.hasOwnProperty("x") && this.props.hasOwnProperty("y")){
            x = this.props.x;
            y = this.props.y;
        }else{
            const rect = this.panel.getBoundingClientRect();
            x = ($(window).width() - rect.width)/2;
            y = ($(window).height() - rect.height)/2;
        }
        // pn.style.top = `${x}px`;
        // pn.style.left = `${y}px`;

        const { top, left } = this.getPosition(x, y);
        pn.style.top = `${top}px`;
        pn.style.left = `${left}px`;
        pn.style.visibility = 'visible';
    }
    panelRef = (c) => {
        this.panel = c;
    }
    getPosition = (x = 0, y = 0) => {
        let styles = {
            top: y,
            left: x
        };

        if (!this.panel) return styles;

        const { innerWidth, innerHeight } = window;
        const rect = this.panel.getBoundingClientRect();

        if (y + rect.height > innerHeight) {
            styles.top -= rect.height;
        }

        if (x + rect.width > innerWidth) {
            styles.left -= rect.width;
        }

        if (styles.top < 0) {
            styles.top = rect.height < innerHeight ? (innerHeight - rect.height) / 2 : 0;
        }

        if (styles.left < 0) {
            styles.left = rect.width < innerWidth ? (innerWidth - rect.width) / 2 : 0;
        }

        return styles;
    }
    onConfirm(e, confirm){
        e.preventDefault();
        e.stopPropagation();

        this.props.onConfirm(confirm);

        PopDialog.closeByDomID('order-preview');
    }
    getText(data){
        const {action} = this.props;
        if (action=="open"){
            return {title: Intl.lang('trade.preview.order'), head:Intl.lang('trade.order'), confirmTxt: Intl.lang('trade.preview.submit')};
        }else if(action=="close"){
            return {title:Intl.lang(data.tab==3 ? 'trade.preview.cancelOrder' : "trade.preview.closePosition") , head:Intl.lang(data.tab==3 ? 'futures.hist_nav3' : "futures.hist_nav2"), confirmTxt:Intl.lang(data.tab==3 ? 'trade.preview.cancelOrder' : "trade.preview.closePosition")};
        }else if(action=="setting"){
            return {title:Intl.lang("trade.setting.edit") , head:Intl.lang("trade.setting"), confirmTxt:Intl.lang("common.confirm")};
        }
        // else if(action=="modify"){
        //     return {title: "", head:"", confirmTxt:""};
        // }
    }
    parseData(data){
        const {action} = this.props;
        if (action=="open"){
            return this.openOrder(data);
        }else if(action=="close"){
            return this.closeOrder(data);
        }else if(action=="setting"){
            return this.saveSetting(data);
        }
        // else if(action=="modify"){
        //     return this.modifyOrder(data);
        // }
    }
    closeOrder(data){
        var info = data.data;
        var list = [];
        var row = info[0];
        if (row.List){
            list = info.map((v)=>this.getSummaryDesc(v));
        }else{
            list = info.map((v)=>this.getOrderDesc(v));
        }

        return list;
    }
    getSummaryDesc(row){
        return Intl.lang("trade.order.preview_close2", row.CName);
    }
    getOrderDesc(row){
        return Intl.lang("trade.order.preview_close", row.ID, row.SideTxt, row.Volume);
    }
    openOrder(data){
        return FutTradeModel.parseOrderToText(data, true);
    }
    saveSetting(data){
        var list = [];
        if (data.hasOwnProperty("msg")){
            list.push(Intl.lang(data.msg));
        }
        return list;
    }
    // modifyOrder(data){
    //     const {form} = data;
    //
    //     var list = [];
    //     for (var key in form){
    //         var val = form[key];
    //
    //         if (key=='Volume'){
    //             list.push(Intl.lang("trade.order.preview_volume", val));
    //         }else if(key =='Scale'){
    //             list.push(Intl.lang("trade.order.preview_scale", val));
    //         }else if(key=='MarginTotal'){
    //             list.push(Intl.lang("trade.order.preview_margin", val));
    //         }else if(key=='Force'){
    //             list.push(Intl.lang("trade.order.preview_force", val));
    //         }else if(key=='SL.Param'){
    //             list.push(Intl.lang("trade.order.preview_sl", val));
    //         }else if(key=='TP.Param'){
    //             list.push(Intl.lang("trade.order.preview_tp", val));
    //         }else if(key=='Constant'){
    //             list.push(Intl.lang("trade.order.preview_trigPrice", val));
    //         }else if(key=='PriceDistance'){
    //             list.push(Intl.lang("trade.order.preview_priceDistance", val));
    //         }
    //     }
    //     return list;
    // }
    render(){
        const {product, action, data} = this.props;
        const skin = FutTradeModel.getSkin();

        const {title, head, confirmTxt} = this.getText(data);
        const list = this.parseData(data);
        return (
            <section className={"ft-trade-panel shadow-w futures-bg-"+skin} id="order-preview" ref={this.panelRef}>
                <header className="dialog-head tc lh-25">
                    <h3 className="ft-dialog-head fem875 tb"><span>{title}</span></h3>
                    <i className="iconfont icon-close transit fs14" onClick={(e)=>this.onConfirm(e, false)}></i>
                </header>
                <div className="ft-order-box pd010 fs11 pdb-10 border-none">
                    <div className="ft-order-market pdt-1">
                        {action!='setting' &&
                        <div>
                            <FutTradeProduct product={product} isExpert={true}/>
                            <div className="pos-r">
                                <FutPricePart product={product} disable={true}/>
                            </div></div>
                        }
                        {action!='setting' &&
                        <div className="ft-order-preview mt-10" style={{width:"276px"}}>
                            <h3>{head}</h3>
                            {list && list.map((v, i)=>{
                                return <p key={i}>{v}</p>
                            })}
                        </div>}
                        {action=='setting' &&
                        <div className="ft-order-preview mt-10" style={{width:"276px", border:"0px"}}>
                            {list && list.map((v, i)=>{
                                return <p key={i}>{v}</p>
                            })}
                        </div>
                        }
                        <div className="limit-btn-box flex-box flex-jc mt-15">
                            <button className="btn btn-submit w-140" onClick={(e)=>this.onConfirm(e, true)}>{confirmTxt}</button>
                            <button className="btn btn-cancel w-140" onClick={(e)=>this.onConfirm(e, false)}>{Intl.lang('common.cancel')}</button>
                        </div>
                    </div>
                </div>
            </section>
        )
    }
}

//订单警告
export class FutWarningExpert extends PureComponent{
    constructor(props) {
        super(props);

        this.state = {

        }
    }
    onConfirm(e, confirm){
        e.preventDefault();
        e.stopPropagation();

        this.props.onConfirm(e, confirm);

        PopDialog.closeByDomID('order-warning');
    }
    componentDidMount() {
        var pn = this.panel.parentNode;
        pn.style.position = 'absolute';
        pn.style.visibility = 'hidden';
        pn.style.top = "-1000px";
        pn.style.left = "-1000px";

        var x,y;
        if (this.props.hasOwnProperty("x") && this.props.hasOwnProperty("y")){
            x = this.props.x;
            y = this.props.y;
        }else{
            const rect = this.panel.getBoundingClientRect();
            x = ($(window).width() - rect.width)/2;
            y = ($(window).height() - rect.height)/2;
        }
        // pn.style.top = `${x}px`;
        // pn.style.left = `${y}px`;

        const { top, left } = this.getPosition(x, y);
        pn.style.top = `${top}px`;
        pn.style.left = `${left}px`;
        pn.style.visibility = 'visible';
    }
    panelRef = (c) => {
        this.panel = c;
    }
    getPosition = (x = 0, y = 0) => {
        let styles = {
            top: y,
            left: x
        };

        if (!this.panel) return styles;

        const { innerWidth, innerHeight } = window;
        const rect = this.panel.getBoundingClientRect();

        if (y + rect.height > innerHeight) {
            styles.top -= rect.height;
        }

        if (x + rect.width > innerWidth) {
            styles.left -= rect.width;
        }

        if (styles.top < 0) {
            styles.top = rect.height < innerHeight ? (innerHeight - rect.height) / 2 : 0;
        }

        if (styles.left < 0) {
            styles.left = rect.width < innerWidth ? (innerWidth - rect.width) / 2 : 0;
        }

        return styles;
    }
    render(){
        const {msg, confirm, cancel} = this.props;
        const skin = FutTradeModel.getSkin();

        return (
            <section className={"ft-trade-panel shadow-w futures-bg-"+skin} id="order-warning" ref={this.panelRef}>
                <header className="dialog-head tc lh-25">
                    <h3 className="ft-dialog-head fem875 tb"><span>{Intl.lang("Recharge.note")}</span></h3>
                    <i className="iconfont icon-close transit fs14" onClick={(e)=>this.onConfirm(e, false)}></i>
                </header>
                <div className="ft-order-box pd010 fs11 pdb-10 border-none">
                    <div className="ft-order-market pdt-1">
                        <div className="ft-order-preview mt-10 tc">
                            <strong className="red3 fem125">{Intl.lang("trade.warning")}</strong>
                            {/*<p>立即订单执行存在着风险</p>*/}
                        </div>
                        <div className="ft-order-preview mt-10">
                            <h3>{Intl.lang("trade.detail")}</h3>
                            <p>{Intl.lang(msg)}</p>
                        </div>
                        <div className="limit-btn-box flex-box flex-jc mt-15">
                            <button className="btn btn-submit w-140 mr-20" onClick={(e)=>this.onConfirm(e, true)}>{Intl.lang(confirm)}</button>
                            <button className="btn btn-cancel w-140" onClick={(e)=>this.onConfirm(e, false)}>{Intl.lang(cancel)}</button>
                        </div>
                    </div>
                </div>
            </section>
        )
    }
}
