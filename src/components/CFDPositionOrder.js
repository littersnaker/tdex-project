import React from 'react';

import PureComponent from '../core/PureComponent';

import ScrollArea from 'react-scrollbar';
import PopDialog from "../utils/popDialog";
import CfdOrderPos from "../model/cfd-order-position";

import Event from "../core/event";
import Intl from "../intl";
import {CONST} from "../public/const";

import CFDContextMenu from './CFDContextMenu';
import Net from "../net/net";
import Notification from "../utils/notification";
import CFDHistoryHeaderMenu from "./CFDHistoryHeaderMenu";
import CFDEditOrder from './CFDEditOrder';
import {Confirm} from './Common';
import ToolTip from './ToolTip';
import CfdTradeModel from "../model/cfd-trade";

const $ = window.$;
//持仓和委托
export default class CFDPositionOrder extends PureComponent{
    constructor(props){
        super(props);

        this.hideContextMenu = this.hideContextMenu.bind(this);
        //列表中可以编辑的文本属性对应数值的属性名
        // this.editAttrMap = {
        //     "VolumeDesc": "Volume",
        //     "ScaleTxt": "Scale",
        //     "MarginTotalDesc": "MarginTotal",
        //     "ForceDesc": "Force",
        //     "SLDesc": "SL.Param",
        //     "TPDesc": "TP.Param",
        //     "TriggerPrice":"Constant",
        //     "PriceDistance": "PriceDistance"
        // };
        //可用编辑的列名对应进行操作的右键菜单动作
        this.editColumnOptionMap = {
            [1]:{
                "ScaleTxt":"adjustLever", "MarginTotalDesc":"addDeposit", "ForceDesc":"adjustForce", "SLDesc":"setSL", "TPDesc":"setTP"
            },
            [2]:{

            }
        };

        var tab = this.props.tab;
        var currencys = [];
        var sort = null, isDesc = null;
        this.sort = sort;
        this.isDesc = isDesc;
        var data = this.getData(tab, currencys, sort, isDesc);

        this.initState = {
            data,
            columns: this.getColumns(tab),
            canEditColumns: this.getCanEditColumns(tab),
            currencys,
            selectAll: false,
            selection: []
        };

        this.state = this.initState;
    }

    componentWillMount() {
        Event.addListener(Event.EventName.CFD_ORDER_UPDATE, this.onUpdateOrders.bind(this), this);
    }

    componentDidMount() {
        window.addEventListener("mousedown", this.hideContextMenu);
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.tab!=nextProps.tab){
            this.onChangeTab(nextProps.tab);
        }
    }

    componentWillUnmount(){
        window.removeEventListener("mousedown", this.hideContextMenu);

        super.componentWillUnmount();
    }

    onUpdateOrders(){
        var tab = this.props.tab;
        if (tab==1 || tab==2){
            this.setState({data:this.getData(tab, this.state.currencys, this.sort, this.isDesc)});
        }
    }

    onChangeTab(tab){
        var state = Object.assign({}, this.initState, {columns:this.getColumns(tab), canEditColumns: this.getCanEditColumns(tab)});
        state.data = this.getData(tab, this.state.currencys, null, null);
        this.setState(state);
    }

    getTabData(tab){
        var data;
        if (tab == 1){
            data = CfdOrderPos.positionList;
        }else if(tab == 2){
            data = CfdOrderPos.orderList;
        }
        return data;
    }

    getData(tab, currencys, sort, isDesc){
        var data = this.getTabData(tab);
        if (data) return this.filterData(data, currencys, sort, isDesc);
    }

    getColumns(tab){
        var columns = [];
        if (tab==1){
            columns = ["ID", "CName", "CurrencyTxt", "SideTxt", "ScaleTxt", "Volume", "delegateValueDesc", "PriceDesc", "MarginTotalDesc", "SLDesc", "TPDesc", "ProfitLossDesc", "ChargeFeeDesc", "Swap", "ForceDesc", "Operate"];
        }else if(tab==2){
            columns = ["CreatedAt", "PID", "CName", "CurrencyTxt", "SideTxt", "ScaleTxt", "VolumeDesc", "delegateValueDesc", "TypeDesc", "OrderPrice", "DealPrice", "TimelyDesc", "StateTxt", "Operate"];
        }
        return columns;
    }

    getCanEditColumns(tab){
        var map = this.editColumnOptionMap[tab];
        return Object.keys(map);
    }

    onChangeSelectAll(e){
        e.stopPropagation();

        var checked = e.target.checked;
        var data = {selectAll: checked};
        if (checked){
            data.selection = this.state.data.map(v=>v.ID);
        }else{
            data.selection = [];
        }
        this.setState(data);

        if (checked){
            var x = e.clientX, y = e.clientY, target = e.target.parentNode.parentNode.parentNode
            var rows = [];
            this.state.data.forEach((v)=>{
                rows.push(v);
            });
            this.showContextMenu(rows, 'click', x, y, target);
        }
    }

    // onChangeSelect(e){
    //     e.stopPropagation();
    //     // var checked = e.target.checked;
    //     var value = e.target.value;
    //     this.onSelectRow(value, e, 'input');
    // }

    onSelectRow(ID, e){
        // console.log("onSelectRow");
        e.stopPropagation();
        if (this.props.tab==2) return;

        var selection = this.state.selection;
        const keyIndex = selection.indexOf(ID);
        const isSelected = keyIndex>=0;
        if (isSelected){
            selection.splice(keyIndex, 1);
        }else{
            selection.push(ID);
        }

        var x = e.clientX, y = e.clientY, target = $(e.target).parents('ul.item-content');
        this.setState({selection});
        if (!isSelected){
            var rows = [];
            this.state.data.forEach((v)=>{
                if (selection.indexOf(v.ID)!=-1){
                    rows.push(v);
                }
            });
            this.showContextMenu(rows, 'click', x, y, target);
        }
    }

    onChangeCurrency(currencys){
        this.setState({currencys, data:this.getData(this.props.tab, currencys, this.sort, this.isDesc)})
    }

    sortColumn(sort, e){
        if (this.sort!=sort){
            this.sort = sort;
            this.isDesc = false;
        }else{
            this.isDesc = !this.isDesc;
        }
        this.setState({data:this.getData(this.props.tab, this.state.currencys, this.sort, this.isDesc)});
    }

    filterData(data, currencys, sort, isDesc){
        var newData;
        if (!currencys.length){
            newData = data;
        }else{
            newData = data.filter((v)=>currencys.indexOf(String(v.Currency))!=-1);
        }
        if (isDesc){
            newData.sort((a, b)=>a[sort]>b[sort]?-1:1);
        }else{
            newData.sort((a, b)=>a[sort]<b[sort]?-1:1)
        }

        return newData;
    }

    getAttrValue(row, attrName){
        if (attrName.indexOf(".")!=-1){
            var nl = attrName.split('.');
            var subOrder = row[nl[0]];
            if (subOrder)return subOrder[nl[1]];
        }else{
            return row[attrName];
        }
    }

    editData(column, row, e){
        e.stopPropagation();

        var map = this.editColumnOptionMap[this.props.tab];
        var option = map[column];
        //有值的时候改为编辑
        if (option=='setSL' && row[column]){
            option == 'editSL';
        }else if(option=='setTP' && row[column]){
            option == 'editTP';
        }
        this.selectMenuOption(option, [row]);
    }

    selectMenuOption(option, rows){
        PopDialog.open(<CFDEditOrder option={option} data={rows} pn={this}/>, "order-edit", true);
    }

    delRecords(rows, e){
        e.stopPropagation();

        if (rows.length){
            var row = rows[0];
            if (row.orderType=='position'){
                this.closePositions(rows);
            }else{
                this.cancelOrders(rows);
            }
        }
    }

    mergePosition(data, hasTS){
        var _processMerge = ()=>{
            var row = data[0];
            if (row && row.List){
                data.forEach(v=>{
                    var CID = Number(v.CID);
                    var List = v.List.map(v=>v.ID);
                    Net.httpRequest("cfd/merge", {CID,List}, (data)=>{
                        if (data.Status==0){
                            // FutTradeModel.loadPosition();
                        }
                    }, this);
                });
            }else{
                var CID = Number(row.CID);
                var List = data.map((v)=>v.ID);

                Net.httpRequest("cfd/merge", {CID,List}, (data)=>{
                    if (data.Status==0){
                        // FutTradeModel.loadPosition();
                    }
                }, this);
            }
        };

        if (hasTS){
            PopDialog.open(<Confirm skin="dialog-bg-blue" isExpert={true} title={Intl.lang("Recharge.note")} content={Intl.lang("trade.merge.confirm")}
                                    yestxt={Intl.lang("trade.editOrder.confirm")} notxt={Intl.lang("common.cancel")} callback={()=>{
                _processMerge();
            }} cancel={()=>{
            }}/>, "alert_panel");
        }else{
            _processMerge();
        }
    }

    closePositions(rows){
        var List = rows.map(v=>{
            return {CID:Number(v.CID), ID:v.ID}
        });

        Net.httpRequest("cfd/close", {List}, (data)=>{
            if (data.Status==0 && data.Data && data.Data.Result){
                var Result = data.Data.Result;

                // var errs = [];
                for (var pid in Result){
                    var info = Result[pid];
                    if (info && info.Code>0){
                        Notification.error((info.Error && "production" !== process.env.NODE_ENV ? info.Error+ ' -- ' : '') + Intl.lang("trade.error.closePosition", pid, Intl.lang("server.status."+info.Code)));
                    }
                }
            }
        }, this);
    }

    cancelOrders(rows, callback){
        var List = rows.map(v=>{
            return {CID:Number(v.CID), ID:v.ID}
        });

        Net.httpRequest("cfd/cancel", {List}, (data)=>{
            if (data.Status==0){
                if (callback) callback();
            }
        }, this);
    }

    onContextMenuRow = (row, eventType, e) =>{
        e.preventDefault();
        e.stopPropagation();

        if (this.state.selection.length>1){
            var rows = [];
            this.state.data.forEach((v)=>{
                if (this.state.selection.indexOf(v.ID)!=-1){
                    rows.push(v);
                }
            });
            this.showContextMenu(rows, eventType, e.clientX, e.clientY, e.target);
        }else{
            this.showContextMenu([row], eventType, e.clientX, e.clientY, e.target);
        }
    }

    showContextMenu(rows, eventType, x, y, target){
        if (rows.length>0){
            var props = {};
            if (eventType=='click'){
                props.bottom = $(target).offset().top + $(target).height();
            }

            PopDialog.open(<CFDContextMenu rows={rows} tab={this.props.tab} x={x+15} y={y} pnComponent={this} eventType={eventType} {...props} />, "context-menu", false, false, false);
        }
    }

    hideContextMenu(e){
        if (e && !$(e.target).parents(".menu-list").length){
            PopDialog.closeByDomID("context-menu");
        }
    }

    selectCode(product, e){
        if (!product.Hide) CfdTradeModel.mgr().btnSelectProduct(product);
    }

    // getHistoryPageSize(){
    //     var pageSize = parseInt((this.props.height-53-36)/19);
    //     return pageSize>0 ? pageSize : 1;
    // }
    moveHeightEnd(){
        // if (this.state.tab==3){
        //     this.loadHistory(1, this.getHistoryPageSize());
        // }else if(this.state.tab==4){
        //     this.loadPositionHistory(1, this.getHistoryPageSize());
        // }
    }

    render(){
        const {style, className, code, height, tab} = this.props;
        const dataHeight = height - 32 - 10;
        const {data, columns, currencys,  canEditColumns, selectAll, selection} = this.state;

        var noData = !data || !data.length;

        var colLen = columns.length;
        return <React.Fragment>
            <ul className="item-title">
                {tab==1 && <li className="input"><label className="custom-checkbox">
                    <div>
                        <input type="checkbox" className="input_check" checked={selectAll} onClick={this.onChangeSelectAll.bind(this)}/>
                        <i></i>
                    </div>
                </label></li>}
                {columns && columns.map((name, i)=>{

                    var style;
                    if (tab==2){
                        if (name=='CreatedAt'){
                            style = {width:"12%"}
                        }else{
                            style = {width:"8%"}
                        }
                    }

                    var columnTxt = Intl.lang("trade.history."+(tab==1?name:`${name}_O`));
                    if (name=='CurrencyTxt'){
                        return <CFDHistoryHeaderMenu key={"cl"+name} name={columnTxt} value={currencys} onChange={this.onChangeCurrency.bind(this)} style={style} />
                    }else if(name=='VolumeDesc'){
                        return <li onClick={this.sortColumn.bind(this, name)} key={"cl"+name} style={style}><ToolTip title={Intl.lang("cfd.tip.orderVolume")}><span>{columnTxt}</span></ToolTip></li>
                    }

                    return <li onClick={this.sortColumn.bind(this, name)} key={"cl"+name} style={style}>{columnTxt}</li>
                })}
            </ul>
            <ScrollArea className="tab-content-auto" style={{height:dataHeight+'px'}}>
                {!noData ? data.map((v, i)=>{
                    var checked = selection.indexOf(v.ID)!=-1;
                    var product = v.Product;
                    // console.log(v.ID, checked);
                    return <ul className={"item-content"+(checked?" on":"")} key={"cc"+i} onMouseUp={this.onSelectRow.bind(this, v.ID)}>
                            {tab==1 && <li className="input">
                            <label className="custom-checkbox">
                                <div>
                                    <input type="checkbox" className="input_check" value={v.ID} checked={checked} />
                                    <i></i>
                                </div>
                            </label>
                        </li>}
                        {columns && columns.map((name, ci)=>{
                            // var numColumnId = this.editAttrMap[name];
                            var text;
                            var key = "ca"+name;
                            // if (numColumnId){
                            //     text = this.getAttrValue(v, numColumnId)
                            // }else{
                                text = v[name];
                            // }

                            var style;
                            if (tab==2){
                                if (name=='CreatedAt'){
                                    style = {width:"12%"}
                                }else{
                                    style = {width:"8%"}
                                }
                            }

                            if (name=="SideTxt"){
                                return <li key={key} className={v.Side===CONST.FUT.Side.BUY ? "exchange-green":"exchange-red"} style={style}>{text}</li>
                            }else if(name=="ProfitLossDesc"){
                                return <li key={key} className={Number(v.ProfitLoss)>0 ? "exchange-green":(Number(v.ProfitLoss)<0?"exchange-red":"")} style={style}>{text}</li>
                            }else if(name=='Operate'){
                                if (tab==1) return <li key={key} style={style}><ToolTip title={Intl.lang("trade.order.close.tip")}><i className="iconfont icon-close exchange-red point" onMouseUp={this.delRecords.bind(this, [v])}/></ToolTip><ToolTip title={Intl.lang("trade.order.edit.tip")}><i className="iconfont icon-new-order1 point" style={{paddingLeft:"5px"}} onMouseUp={this.onContextMenuRow.bind(this, v, 'contextMenu')}/></ToolTip></li>;
                                else if(tab==2) return <li key={key} style={style}><ToolTip title={Intl.lang("trade.preview.cancelOrder")}><i className="iconfont icon-close exchange-red point" onMouseUp={this.delRecords.bind(this, [v])}/></ToolTip></li>
                            }else if(name=='CName'){
                                return <li key={key} style={style} className={product && !product.Hide ? "cursor":""} onClick={this.selectCode.bind(this, product)}>{text}</li>
                            }

                            if (canEditColumns.indexOf(name)!=-1){
                                return <li key={key} style={style}><ToolTip title={Intl.lang("cfd.tip.edit")}><span className="under-line" onMouseUp={this.editData.bind(this, name, v)}>{text ? text : <React.Fragment>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</React.Fragment>}</span></ToolTip></li>
                            }
                            return <li key={key} style={style}>{text}</li>
                        })}
                    </ul>
                }) :
                    <div className="no-list-data mt-50">
                        <div className="no-list-data-pic"></div>
                        <p className="mt-10 c-8">{Intl.lang("bank.1_27")}</p>
                    </div>
                }
            </ScrollArea>
        </React.Fragment>
    }
}
