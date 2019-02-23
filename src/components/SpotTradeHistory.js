import Intl from '../intl';
import React from 'react';
import {Link} from 'react-router';
import ScrollArea from 'react-scrollbar';

import PureComponent from "../core/PureComponent"

import Net from '../net/net';
import {CONST} from "../public/const"
import Decimal from '../utils/decimal';
import {getCurrencySymbol, Pagination} from "../utils/common"
import Event from '../core/event';
// import moment from 'moment';
import SpotTradeModel from '../model/spot-trade';
import AuthModel from '../model/auth';

import Pager from './Pager';

const $ = window.$;
// const LANG = window.LANG;

class TradeHistory extends PureComponent {
    constructor(props) {
        super(props);

        // if (this.props.user.Uid){
        //     this.loadOrders();
        // }
        this.isLogin = AuthModel.checkUserAuth();
        //是否桌面版
        this.isDesktop = process.env.VER_ENV=='desktop';

        // this.orderPageSize = 200;
        this.historyPageSize = props.isSimple? 5:50;

        this.state = {
            tab: 1,
            orders: {List: []}, //订单记录
            historys: {List: [], PageSize: this.historyPageSize} //最新成交
        };
    }
    componentWillMount(){
        Event.addListener(Event.EventName.ORDER_UPDATE, this.loadAll.bind(this), this);

        this.loadOrders();
    }
    loadAll(){
        this.loadOrders();
        if (this.state.tab==2 && (!this.state.historys.Page || this.state.historys.Page==1)) this.loadHistory(1);
    }

    // componentWillReceiveProps(nextProps){
    //     if (!this.props.user.Uid && nextProps.user.Uid){
    //         this.loadOrders();
    //     }
    // }
    // componentWillUnmount() {
    //     super.componentWillUnmount();
    //
    //     // if (this.timer){
    //     //     clearTimeout(this.timer);
    //     // }
    // }
    //登录后的
    // onUpdateOrders(){
    //     console.log("load orders");
    //     this.loadOrders();
    //     // this.loadHistory(1);
    // }
    // addLoadOrdersTask(){
    //     if (this.timer){
    //         clearTimeout(this.timer);
    //     }
    //
    //     var self = this;
    //     this.timer = setTimeout(()=>{
    //         self.loadOrders();
    //     }, 3000);
    // }
    loadOrders(){
        if (!this.isLogin) return;

        var self = this;
        Net.httpRequest("spot/orders", "", function(data){
            if (data.Status == 0 && data.Data){
                if (data.Data.List!=null){
                    self.pageFunc = Pagination(data.Data.List, self.historyPageSize, false);
                    self.setState({orders: self.pageFunc(1)});
                }
                else self.setState({orders: {List: []}});
            }
            // self.addLoadOrdersTask();
        }, this);
    }
    turnPageOrders(page){
        if (this.pageFunc){
            this.setState({orders:this.pageFunc(page)});
        }
    }
    loadHistory(page){
        if (!this.isLogin) return;

        if (page < 1) return;

        if (this.state && this.state.historys && this.state.historys.PageCount){
            if (page > this.state.historys.PageCount){
                page = this.state.historys.PageCount;
            }
        }

        //"BeginTime":moment().format("YYYY-MM-DD"), "EndTime":moment().format("YYYY-MM-DD")},

        var self = this;
        Net.httpRequest("spot/delegationHistory", {"PageSize":this.historyPageSize, "Page":parseInt(page)}, function(data){
            if (data.Status == 0 && data.Data){
                if (data.Data.List!=null)self.setState({historys: data.Data});
                else self.setState({historys: {List: [], PageSize: self.historyPageSize, Total:0}});
            }
        }, this);
    }

    changeTab(tab){
        if (this.state.tab!=tab){
            this.setState({tab: tab});
            if (tab == 1){
                this.loadOrders();
            }else{
                this.loadHistory(1);
            }
        }
    }
    cancelOrder(item, event){
        event.preventDefault();
        event.stopPropagation();

        var node = $(event.target);
        if (node.hasClass("disable")) return;

        var self = this;
        node.addClass("disable");
        var code = SpotTradeModel.getOrderCode(item.Rid, item.Currency);
        Net.httpRequest("spot/cancel", {"ID":item.Id, "Symbol":code}, function(data){
            node.removeClass("disable");
            // self.loadOrders();

        }, this);
    }

    render() {
        const {isExpert, user, uInfo, isMobile, isSimple} = this.props;
        const {orders, historys, tab} = this.state;

        var self = this;
        var bd = isExpert ? "":" border-l";
        var hasOrders = orders.List[0]!=null;
        return (
            isSimple?
                <div className="spot-trading-history-config">
                    <ul className="spot-trading-tab-config">
                        <li className={tab==1 ?"active":""} onClick={this.changeTab.bind(self, 1)}><span>{Intl.lang("TradeHistory.101")+' ('+(orders.Total ? orders.Total : orders.List.length)+')'}</span></li>
                        <li className={tab==2 ?"active":""} onClick={this.changeTab.bind(self, 2)}><span>{Intl.lang("TradeHistory.log")}</span></li>
                    </ul>
                    {tab==1 &&
                    <div className="spot-trading-history-list">
                        <ul className="list-config-title">
                            <li>ID</li><li>{Intl.lang("accountSafe.1_102")}</li><li>{Intl.lang("TradeHistory.103")}</li><li>{Intl.lang("TradeHistory.104")}</li><li>{Intl.lang("TradeHistory.105")}</li><li>{Intl.lang("TradeHistory.quan")}</li><li>{Intl.lang("TradeHistory.106")}</li><li className="tc">{Intl.lang("accountSafe.1_99")}</li>
                        </ul>
                        {hasOrders && orders.List.map((item, index)=>{
                            var cs = getCurrencySymbol(item.Currency);
                            var code = SpotTradeModel.getOrderCode(item.Rid, item.Currency);
                            var priceInfo = SpotTradeModel.getProduct(code);
                            if (!priceInfo) return;
                            var total = Decimal.accMul(item.Price, item.Quantity, priceInfo.PriceFixed);
                            return <ul className="list-config-content" key={'wt'+index}>
                                <li>{item.Id}</li><li>{(item.CreateTime).substring(0, 19)}</li><li>{item.Rid?priceInfo.Name:''}</li><li className={item.Direction==CONST.TRADE.DIRECTION.BID?'spot-color-81a417':'spot-color-b50a5c'}>{item.Direction==CONST.TRADE.DIRECTION.BID?Intl.lang("TradeForm.108"):Intl.lang("TradeForm.109")}</li><li>{Decimal.toFixed(item.Price, priceInfo.PriceFixed)}</li><li>{Decimal.toFixed(item.Completed, priceInfo.VolFixed)+"/"+Decimal.toFixed(item.Quantity, priceInfo.VolFixed)}</li><li>{cs.sb+total}</li><li className="tc"><a href="javascript:;" className="white1 cursor" onClick={(e)=>self.cancelOrder(item, e)}>{Intl.lang("tradeHistory.1_18")}</a></li>
                            </ul>})}

                        {!hasOrders &&<div className="no-list-data back show-5"><div className="no-list-data-pic"></div><p>{Intl.lang("bank.1_27")}</p></div>}
                        {(orders.hasOwnProperty("PageCount") && orders.PageCount > 1) &&
                        <Pager className="spot-trading-pager-config" data={orders} onChange={this.turnPageOrders.bind(this)}/>
                        }
                    </div>}
                    {tab==2 &&
                    <div className="spot-trading-history-list">
                        <ul className="list-config-title">
                            <li>ID</li>
                            <li style={{width:"120%"}}>{Intl.lang("accountSafe.1_102")}</li>
                            <li>{Intl.lang("TradeHistory.103")}</li>
                            <li>{Intl.lang("TradeHistory.104")}</li>
                            <li>{Intl.lang("TradeHistory.105")}</li>
                            <li style={Intl.getLang() === 'en-us' ? ({width: '155%'}) : null}>{Intl.lang("TradeHistory.quan")}</li>
                            <li>{Intl.lang("TradeHistory.Reality")}</li>
                            <li>{Intl.lang("tradeHistory.2_69")}</li>
                            <li>{Intl.lang("TradeHistory.Amount")}</li>
                            <li>{Intl.lang("recharge.1_23")}</li>
                        </ul>
                        {(historys.hasOwnProperty("Total") && historys.Total > 0) && historys.List.map((item, index)=>{
                            var cs = getCurrencySymbol(item.Mid);
                            var rcs = getCurrencySymbol(item.Rid);
                            var code = SpotTradeModel.getOrderCode(item.Rid, item.Mid);
                            var priceInfo = SpotTradeModel.getProduct(code);
                            if (!priceInfo) return;
                            var total = Decimal.toFixed(item.Deposit, priceInfo.PriceFixed);
                            var comm = Decimal.toFixed(item.Commission, priceInfo.PriceFixed);
                            return <ul className="list-config-content" key={"hist"+index}>
                                <li>{item.Id}</li>
                                <li style={{width:"120%"}}>{(item.CreateTime).substring(0, 19)}</li>
                                <li>{item.Rid?priceInfo.Name:''}</li>
                                <li>{item.Direction==CONST.TRADE.DIRECTION.BID?<span className="spot-color-81a417">{Intl.lang("TradeForm.108")}</span>:<span className="spot-color-b50a5c">{Intl.lang("TradeForm.109")}</span>}</li>
                                <li>{Number(item.Price)==0 ? Intl.lang("trade.order.Strategy00") : Decimal.toFixed(item.Price, priceInfo.PriceFixed)}</li>
                                <li>{Decimal.toFixed(item.Completed, priceInfo.VolFixed)+"/"+Decimal.toFixed(item.Quantity, priceInfo.VolFixed)}</li>
                                <li>{Decimal.toFixed(item.Reality, priceInfo.PriceFixed)}</li>
                                <li>{(item.Direction==CONST.TRADE.DIRECTION.BID?rcs.sb:cs.sb)+comm}</li>
                                <li>{cs.sb+total}</li>
                                <li>{Intl.lang("SORDER.STATE."+item.State)}</li>
                            </ul>})}

                        {(!self.isLogin || historys.hasOwnProperty("Total") && historys.Total==0) && <div className="no-list-data back show-5"><div className="no-list-data-pic"></div><p>{Intl.lang("bank.1_27")}</p></div>}
                        {(historys.hasOwnProperty("PageCount") && historys.PageCount > 1) &&
                        <Pager className="spot-trading-pager-config" data={historys} onChange={this.loadHistory.bind(this)}/>
                        }
                    </div>}
                </div>
                :
            <div className={!isExpert?"trade-history-box trade-log pos-r mt-30 pdb-50":"trade-full-log"} style={isMobile?null:isExpert?{position:"absolute", right:"520px", bottom: 0, height: "300px", marginLeft: "5px", width: "calc(100% - 520px)", overflow: "hidden", backgroundColor: "#272d33"}:null}>
                <div className="trade-history-box trade-log">
                        {!(this.isDesktop || isMobile) && <div className="trade-history-log-btn tc"><Link to="/history" target="_blank">{Intl.lang("TradeHistory.100")}</Link></div>}
                        <ul className={isExpert?"trade-order-head head-border-full f-clear":"trade-full-order-head f-clear"}>
                            <li className="his-li" onClick={this.changeTab.bind(self, 1)}><span className={tab==1 ? "his-box current"+bd : "his-box"}>{Intl.lang("TradeHistory.101")+' ('+orders.List.length+')'}</span></li>
                            <li className="his-li" onClick={this.changeTab.bind(self, 2)}><span className={tab==2 ? "his-box current" : "his-box"}>{Intl.lang("TradeHistory.log")}</span></li>
                        </ul>
                        {tab==1 &&
                        <div className="trade-order-log">
                            <dl className="f-clear">
                                <dd>{Intl.lang("accountSafe.1_102")}</dd><dd>{Intl.lang("TradeHistory.103")}</dd><dd>{Intl.lang("TradeHistory.104")}</dd><dd>{Intl.lang("TradeHistory.105")}</dd><dd>{Intl.lang("TradeHistory.quan")}</dd><dd>{Intl.lang("TradeHistory.106")}</dd><dd className="tc">{Intl.lang("accountSafe.1_99")}</dd>
                            </dl>
                            <ScrollArea className={isExpert ?"log-contain t2-sa-f":"log-contain log-list t2-sa"} contentClassName="order-content">
                                {!hasOrders && <p className="mt-30 tc">{Intl.lang("bank.1_27")}</p>}
                                {hasOrders && orders.List.map((item, index)=>{
                                    var cs = getCurrencySymbol(item.Currency);
                                    var code = SpotTradeModel.getOrderCode(item.Rid, item.Currency);
                                    var priceInfo = SpotTradeModel.getProduct(code);
                                    if (!priceInfo) return;
                                    var total = Decimal.accMul(item.Price, item.Quantity, priceInfo.PriceFixed);
                                    return <dl className="f-clear" key={index}>
                                        <dd>{(item.CreateTime).substring(0, 19)}</dd><dd>{item.Rid?priceInfo.Name:''}</dd><dd>{item.Direction==CONST.TRADE.DIRECTION.BID?Intl.lang("TradeForm.108"):Intl.lang("TradeForm.109")}</dd><dd>{Decimal.toFixed(item.Price, priceInfo.PriceFixed)}</dd><dd>{Decimal.toFixed(item.Completed, priceInfo.VolFixed)+"/"+Decimal.toFixed(item.Quantity, priceInfo.VolFixed)}</dd><dd>{cs.sb+total}</dd><dd className="tc"><a href="javascript:;" className="white1 cursor" onClick={(e)=>self.cancelOrder(item, e)}>{Intl.lang("tradeHistory.1_18")}</a></dd>
                                    </dl>})}
                            </ScrollArea>
                        </div>}

                        {tab==2 && <div className="trade-order-log">
                            <dl className="trade-new f-clear">
                                <dd style={{width:""}}>{Intl.lang("accountSafe.1_102")}</dd>
                                <dd>{Intl.lang("TradeHistory.103")}</dd>
                                <dd>{Intl.lang("TradeHistory.104")}</dd>
                                <dd>{Intl.lang("TradeHistory.105")}</dd>
                                <dd>{Intl.lang("TradeHistory.delegateQuan")}</dd>
                                <dd>{Intl.lang("TradeHistory.Reality")}</dd>
                                <dd>{Intl.lang("TradeHistory.Completed")}</dd>
                                <dd>{Intl.lang("TradeHistory.Amount")}</dd>
                                <dd>{Intl.lang("tradeHistory.2_69")}</dd>
                                <dd>{Intl.lang("recharge.1_23")}</dd>
                            </dl>
                            <ScrollArea className={"log-contain log-list trade-new " + isExpert ?"t2-sa-f":"t2-sa"} contentClassName="order-content">
                                {(historys.hasOwnProperty("Total") && historys.Total==0) && <p className="mt-30 tc">{Intl.lang("bank.1_27")}</p>}
                                {(historys.hasOwnProperty("Total") && historys.Total > 0) && historys.List.map((item, index)=>{
                                    var cs = getCurrencySymbol(item.Mid);
                                    var code = SpotTradeModel.getOrderCode(item.Rid, item.Mid);
                                    var priceInfo = SpotTradeModel.getProduct(code);
                                    if (!priceInfo) return;
                                    var total = Decimal.accMul(item.Reality, item.Completed, priceInfo.PriceFixed);
                                    var comm = Decimal.toFixed(item.Commission, priceInfo.PriceFixed);
                                    return <dl className="trade-new f-clear" key={index}>
                                        <dd>{(item.CreateTime).substring(0, 19)}</dd>
                                        <dd>{item.Rid?priceInfo.Name:''}</dd>
                                        <dd>{item.Direction==CONST.TRADE.DIRECTION.BID?Intl.lang("TradeForm.108"):Intl.lang("TradeForm.109")}</dd>
                                        <dd>{Number(item.Price)==0 ? Intl.lang("trade.order.Strategy00") : Decimal.toFixed(item.Price, priceInfo.PriceFixed)}</dd>
                                        <dd>{Decimal.toFixed(item.Quantity, priceInfo.VolFixed)}</dd>
                                        <dd>{Decimal.toFixed(item.Reality, priceInfo.PriceFixed)}</dd>
                                        <dd>{Decimal.toFixed(item.Completed, priceInfo.VolFixed)}</dd>
                                        <dd>{cs.sb+total}</dd>
                                        <dd>{cs.sb+comm}</dd>
                                        <dd>{Intl.lang("SORDER.STATE."+item.State)}</dd>
                                    </dl>})}
                            </ScrollArea>
                        </div>}
                    </div>
                </div>
        );
    }
}

export default TradeHistory;
