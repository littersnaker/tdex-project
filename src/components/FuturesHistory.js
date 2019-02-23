import Intl from '../intl';
import React from 'react';
import ReactDOM from "react-dom";
import PureComponent from '../core/PureComponent';

import ScrollArea from 'react-scrollbar';
//import ScrollArea from '../lib/react-scrollbar/js/ScrollArea';

// import ReactTooltip from 'react-tooltip'
import ToolTip from './ToolTip';

import PopDialog from "../utils/popDialog"
// import FuturesSetting from "../components/FuturesSeting"
import FuturesEditOrder from "../components/FuturesEditOrder"

import OptionsNumberInput from "./OptionsNumberInput"
import FutTradeModel from '../model/fut-trade';
import {CONST} from "../public/const"
import Decimal from '../utils/decimal';

// import ReactTable from "react-table";
import ReactTable from "../lib/react-table/index";
import "../css/react-table.css";
import {FutOrderPreview, FutOrderWarning} from './FuturesOrderPreview';
import Pager from '../components/Pager'
import Net from '../net/net';
import Event from '../core/event';
import AuthModel from '../model/auth';
import SysTime from "../model/system";
import moment from 'moment';
import StatBar from './DepositStatBar';

import classnames from 'classnames';
import Notification from '../utils/notification';
import ChartModel from '../model/chart';
import {IS_TRADE_V2} from '../config';
import {Confirm} from './Common';
import ContextMenu from './ContextMenu';
//import { isMobile } from '../utils/util'

const $ = window.$;

export class FuturesHistory extends PureComponent {
    constructor(props) {
        super(props);

        var tab = 2;
        const data = this.getData(tab);

        this.selection = [];
        this.selectAll = false;

        this.hideContextMenu = this.hideContextMenu.bind(this)
        this.onKeyPress = this.onKeyPress.bind(this);

        //列表中可以编辑的文本属性对应数值的属性名
        this.editAttrMap = {
            "VolumeDesc": "Volume",
            "ScaleTxt": "Scale",
            "MarginTotalDesc": "MarginTotal",
            "ForceDesc": "Force",
            "SLDesc": "SL.Param",
            "TPDesc": "TP.Param",
            "TriggerPrice":"Constant",
            "PriceDistance": "PriceDistance"
        };

        this.updateCount = 0;
        this.orderUpdateTimer = 0;

        this.isEdit = false; //当处于编辑状态时，不更新数据

        this.state = {
            tab,
            data,
            columns: this.getColumns(tab),
            history:{
                Total:0,
                PageCount:0,
                Page:1,
                PageSize:this.getHistoryPageSize(),
                List:[]
            },
            pHistory:{
                Total:0,
                PageCount:0,
                Page:1,
                PageSize:this.getHistoryPageSize(),
                List:[]
            }
        }
    }

    componentWillMount() {
        Event.addListener(Event.EventName.FUT_ORDER_UPDATE, this.onUpdateOrdersDelay.bind(this), this);
        Event.addListener(Event.EventName.LANG_SELECT, this.onChangeLang.bind(this), this);
        Event.addListener(Event.EventName.SET_MERGED, this.onChangeMerged.bind(this), this);

        Event.addListener(Event.EventName.FUT_ORDERRANK_UPDATE, this.onUpdateOrdersDelay.bind(this), this)

        this.onUpdateOrdersDelay();
        //
        // setTimeout(()=>{
        //     this.onUpdateOrdersDelay();
        // }, 1000);
    }
    onChangeMerged(merged){
        this.forceUpdate();
    }

    onChangeLang(){
        if (this.state.tab==5){
            this.loadHistory(this.state.history.Page);
        }else if(this.state.tab==6){
            this.loadPositionHistory(this.state.pHistory.Page);
        }
    }

    onUpdateOrdersDelay(data){
        const {tab} = this.state;

        this.updateCount++;

        if (!this.orderUpdateTimer){
            this.orderUpdateTimer = Event.setTimer(()=>{
                this.onUpdateOrders();
            }, 100, this);
        }
    }
    onUpdateOrders(){
        const {tab} = this.state;

        if (this.updateCount && !this.isEdit){
            if ([1,2,3].indexOf(tab)!=-1){
                this.setState({data: this.getData(tab)});
            }else{
                this.forceUpdate();
            }
            this.updateCount = 0;

            this.showKlineArrow();
        }
    }
    getData(tab){
        // var list = [];
        if (tab == 1){
            return FutTradeModel.posSummaryList;
        }else if (tab == 2){
            // FutTradeModel.loadPosition();
            return FutTradeModel.positionList;
        }else if (tab == 3){
            // FutTradeModel.loadOrders();
            return FutTradeModel.orderList;
        }else if(tab == 5){
            this.loadHistory(1, this.getHistoryPageSize());
        }else if(tab == 6){
            this.loadPositionHistory(1, this.getHistoryPageSize());
        }
    }
    loadHistory(page, pageSize){
        if (!AuthModel.checkUserAuth()) return;

        if (!pageSize) pageSize = this.state.history.PageSize

        FutTradeModel.loadHistory(page, pageSize, this, (history)=>{
            this.setState({history});
        });
    }
    loadPositionHistory(page, pageSize){
        if (!AuthModel.checkUserAuth()) return;

        if (!pageSize) pageSize = this.state.pHistory.PageSize;

        FutTradeModel.loadPositionHistory(page, pageSize, "", this, (pHistory)=>{
            this.setState({pHistory});
        });
    }
    getHistoryPageSize(){
        var pageSize = parseInt((this.props.height-53-36)/19);
        return pageSize>0 ? pageSize : 1;
    }
    moveHeightEnd(){
        if (this.state.tab==5){
            this.loadHistory(1, this.getHistoryPageSize());
        }else if(this.state.tab==6){
            this.loadPositionHistory(1, this.getHistoryPageSize());
        }
    }
    getColumns(tab){
        var columns = [];

        // const getHeader = (tab, i)=>()=>Intl.lang('trade.history.tab'+tab+'_t'+(i+1));

        if (IS_TRADE_V2){
            if (tab == 1){
                var dataKeys = ["CName", "SideTxt", "BVOL_AVOL", "Volume", "delegateValueDesc", "ScaleTxt", "MarginTotalDesc", "Price", "ProfitLossDesc", "FundFeeDesc", "ChargeFeeDesc"];
                columns = this._getColumns(tab, dataKeys, [], [], [], true, this.delRecord);
            }else if(tab == 2){
                var dataKeys = ["ID", "CName", "SideTxt", "ScaleTxt", "Volume", "delegateValueDesc", "PriceDesc", "MarginTotalDesc", "SLDesc", "TPDesc", "ProfitLossDesc", "FundFeeDesc", "ChargeFeeDesc", "ForceDesc", "Index", "Notes"];
                var canEditNumbers = ["ScaleTxt", "MarginTotalDesc", "ForceDesc", "SLDesc", "TPDesc"]; //可编辑数字
                var canEditTexts = ["Notes"]; //文字
                columns = this._getColumns(tab, dataKeys, canEditNumbers, canEditTexts, [], true, this.delRecord);
            }else if(tab == 3){
                var dataKeys = ["CreatedAt", "PID", "CName", "SideTxt", "ScaleTxt", "VolumeDesc", "delegateValueDesc", "TypeDesc", "OrderPrice", "DealPrice", "TimelyDesc", "StateTxt", "Notes"];
                var canEditNumbers = ["TriggerPrice"]; //可编辑数字
                // var canEditPopUp = [];  //可通过弹出窗口编辑
                var canEditTexts = ["Notes"]; //文字

                columns = this._getColumns(tab, dataKeys, canEditNumbers, canEditTexts, [], true, this.delRecord);
            }
        }else{
            if (tab == 1){
                var dataKeys = ["CName", "SideTxt", "BVOL_AVOL", "Volume", "ScaleTxt", "MarginTotalDesc", "Price", "Mark", "ProfitLossDesc", "FeeDesc"];
                columns = this._getColumns(tab, dataKeys, [], [], [], true, this.delRecord);
            }else if(tab == 2){
                var dataKeys = ["ID", "CName", "SideTxt", "Volume", "ScaleTxt", "MarginTotalDesc", "PriceDesc", "Mark", "ForceDesc", "SLDesc", "TPDesc", "ProfitLossDesc", "FeeDesc", "Notes"];
                var canEditNumbers = ["ScaleTxt", "MarginTotalDesc", "ForceDesc", "SLDesc", "TPDesc"]; //可编辑数字
                var canEditTexts = ["Notes"]; //文字
                columns = this._getColumns(tab, dataKeys, canEditNumbers, canEditTexts, [], true, this.delRecord);
            }else if(tab == 3){
                var dataKeys = ["CreatedAt", "PID", "ID", "CName", "AttemptName", "SideTxt", "VolumeDesc", "ScaleTxt", "TriggerPrice", "PriceDistance", "PriceTxt", "TypeDesc", "StateTxt", "TimelyDesc", "Notes"];
                var canEditNumbers = ["TriggerPrice"]; //可编辑数字
                // var canEditPopUp = [];  //可通过弹出窗口编辑
                var canEditTexts = ["Notes"]; //文字

                columns = this._getColumns(tab, dataKeys, canEditNumbers, canEditTexts, [], true, this.delRecord);
            }
        }

        return columns;
    }
    _getColumns(tab, dataKeys, canEditNumbers, canEditTexts, canEditPopUp, hasSelector, delHandler){

        const getHeader = (tab, tabKey)=>{
            return (props)=>{
                return tabKey ? <ToolTip title={Intl.lang(tabKey)}><span className="cur-hover">{Intl.lang('trade.history.'+props.column.id+(tab==3?'_O':''))}</span></ToolTip> : <span>{Intl.lang('trade.history.'+props.column.id+(tab==3?'_O':''))}</span>
            }
        }

        const headerAddTip = (setting, tab, i, tabKey)=>{
            setting.Header = props => {
                return <React.Fragment>{getHeader(tab, tabKey)(props)}<ToolTip title={Intl.lang(tabKey)}><i className="iconfont icon-question fem75 pos-a r0"></i></ToolTip></React.Fragment>
            };
        }

        var columns = [];

        if (hasSelector){ //是否有选项
            const select = {
                id: '_selector',
                accessor: ()=>'x', // this value is not important
                Header: this.selectInputHeadSelector.bind(this), //全选
                Cell: (row) => { return this.selectInputRowSelector.bind(this)(row.original); },
                width: 25,
                filterable: false,
                sortable: false,
                resizable: false,
                style: { textAlign: 'center' },
            };
            columns.push(select);
        }

        for (var i=0,l=dataKeys.length; i<l; i++){
            var keyName = dataKeys[i];
            //列名
            // var columnTextFunc = getHeader(tab, i);
            var setting = {
                minWidth:30,
                accessor: keyName, //对应数据的key
                Header: getHeader(tab),
                className: 'column-body'
            };

            if (canEditNumbers.indexOf(keyName)!=-1){
                setting.id = keyName;
                setting.accessor = (d)=>d;
                setting.Cell = (row)=> {
                    //全仓模式不允许编辑
                    if (FutTradeModel.isMergedByCid(row.original.CID) && ["SLDesc", "TPDesc"].indexOf(row.column.id)!=-1){
                        return <div></div>;
                    }
                    var numColumnId = this.editAttrMap[row.column.id];
                    var num = this.getAttrValue(row.value, numColumnId); //要修改的数值
                    var min = ['Volume'].indexOf(numColumnId)!=-1 ? 1 : ('Scale'==numColumnId? (Decimal.getDotDigit(num)>2 ? 0.000001 : 0.01) : ('MarginTotal'==numColumnId ? 0 : 0)) ;
                    var max = numColumnId=='Scale' ? 20 : FutTradeModel.priceMax;
                    if (numColumnId=='SL.Param'){
                        //多仓的追踪止损<0
                        if (row.value.Side==CONST.FUT.Side.BUY && row.value.SLorder && row.value.SLorder.Strategy==CONST.FUT.Strategy.Trail){
                            min = FutTradeModel.priceMax*-1;
                            max = 0;
                        }
                    }
                    var product = FutTradeModel.getProductByID(row.original.CID);

                    var step = numColumnId=='Scale'?0.01:(numColumnId=='Volume' ? 1 : ('MarginTotal'==numColumnId ? (product ? Decimal.digit2Decimal(product.CalcFixed) : 0.00000001) : 0));
                    return <EditDiv value={row.value[row.column.id]} disabled={this.isSelected(row.value["ID"]) || row.original.PID && (!FutTradeModel.checkCanModify(row.original, numColumnId) || !num)} isRequire={["SLDesc", "TPDesc"].indexOf(row.column.id)==-1} step={step} min={Number(min)} max={max} num={num} type="number" rows={[row.original]} onConfirm={this.onConfirmEditDiv.bind(this, numColumnId, row.value["ID"])} onFocusBlur={this.onChangeEdit.bind(this)} onClick={this.onClickEditDiv.bind(this, numColumnId, row.value["ID"], row.original)} onWaitClick={this.onWaitClickEditDiv.bind(this, numColumnId, row.value["ID"], row.original)} />
                }
            }else if(canEditTexts.indexOf(keyName)!=-1){
                setting.id = keyName;
                setting.accessor = (d)=>d;
                setting.Cell = (row)=> {
                    return <EditDiv value={row.value[row.column.id]} type="text" rows={[row.original]} maxLength={30} onConfirm={this.onConfirmEditDiv.bind(this, row.column.id, row.value["ID"])} onFocusBlur={this.onChangeEdit.bind(this)}/>
                }
            }else if(canEditPopUp.indexOf(keyName)!=-1){
                setting.id = keyName;
                setting.accessor = (d)=>d;
                setting.Cell = (row)=> {
                    return <EditDiv value={row.value[row.column.id]} type="popup" rows={[row.original]} column={row.column.id} onFocusBlur={this.onChangeEdit.bind(this)}/>
                }
            }else if(keyName=='SideTxt'){
                setting.id = keyName;
                setting.accessor = (d)=>d;
                setting.Cell = (row)=> {
                    return <span className={row.original["Side"]==CONST.FUT.Side.BUY ? "buy" : (row.original["Side"]==CONST.FUT.Side.SELL ? "sell":"")}>{row.value[row.column.id]}</span>
                }
            }else if(keyName=='ProfitLossDesc'){
                setting.id = keyName;
                headerAddTip(setting, 2, 11, "trade.order.pl.tip");
                setting.accessor = (d)=>d;
                setting.Cell = (row)=> {
                    return <OverChangeDiv value={row.original["ProfitLoss"]} text={row.value[row.column.id]} overValue={row.original["ProfitLossMark"]} overText={row.original["ProfitLossMarkDesc"]} />
                    // return <span className={row.original["ProfitLoss"]>0 ? "buy" : (row.original["ProfitLoss"]<0 ? "sell":"")}>{row.value[row.column.id]}</span>
                }
            }else if(keyName=='VolumeDesc'){
                setting.id = keyName;
                headerAddTip(setting, 3, 6, "trade.order.volume.tip");
                setting.accessor = (d)=>d;
                setting.Cell = (row)=> {
                    return <OverChangeDiv value={row.original["VolumeDesc"]} text={row.value[row.column.id]} overValue={row.original["VolumeHide"]} overText={row.original["VolumeHide"]} />
                    // return <span className={row.original["ProfitLoss"]>0 ? "buy" : (row.original["ProfitLoss"]<0 ? "sell":"")}>{row.value[row.column.id]}</span>
                }
            }else if(keyName=='FundFeeDesc'){
                headerAddTip(setting, 2, 11, "trade.order.fee.tip");
            }else if(keyName=='Index'){
                headerAddTip(setting, 2, 14, "trade.open.deleverageIndicatorTip");
                setting.Cell = (row)=>{
                    const ranks = [0,1,2,3,4];
                    const rank = row.original.Index;
                    return <span className="futures-product-li">{ranks.map((v,i)=><span className={rank >= v ? "on" : ""} key={i}></span>)}</span>
                }
            }else if (keyName=='ChargeFeeDesc'){
                setting.id = keyName;
                setting.accessor = (d)=>d;
                setting.Cell = (row)=> {
                    return row.original['ChargeFeeOriginDesc'] ? <React.Fragment><span className="trade-order-head-unline c-8">{row.original['ChargeFeeOriginDesc']}</span><span>{" "+row.original['ChargeFeeDesc']+" "+row.original['ChargeFeeUnit']}</span></React.Fragment> : <span>{row.original['ChargeFeeDesc']+" "+row.original['ChargeFeeUnit']}</span>
                }
            }

            if(['CreatedAt', 'TriggerPrice', 'TimelyDesc', 'ProfitLossDesc', 'ChargeFeeDesc'].indexOf(keyName)!=-1){
                setting.minWidth = 36;
            }else if(["CName", "SideTxt", "Volume", "ScaleTxt", "AttemptName"].indexOf(keyName)!=-1){
                setting.minWidth = 20;
            }

            columns.push(setting);
        }
        //删掉项
        if (delHandler){
            columns.push({
                Header: "",
                accessor: "ID",
                width:38,
                Cell: row => {
                    if(tab==3){
                        return <ToolTip title={Intl.lang("trade.contextMenu.cancelOrder")}><i className="iconfont icon-close" onClick={delHandler.bind(this, row.value, row.original)}></i></ToolTip>
                    }else{
                        return <span><ToolTip title={Intl.lang("trade.order.close.tip")}><i className="iconfont icon-close" onClick={delHandler.bind(this, row.value, row.original)}></i></ToolTip>
                            <ToolTip title={Intl.lang("trade.order.edit.tip")}><i className="iconfont icon-new-order1" onClick={this.onContextMenuRow.bind(this, row.original, 'contextMenu')}></i></ToolTip></span>
                    }
                }

            })
        }
        return columns;
    }
    onChangeEdit(isEdit){
        this.isEdit = isEdit;

        if (!isEdit && this.updateCount){
            this.setState({data:this.getData(this.state.tab)});
            this.updateCount = 0;
        }
    }
    getAttrValue(row, attrName){
        if (attrName.indexOf(".")!=-1){
            var nl = attrName.split('.');
            var subOrder = row[nl[0]];
            if (subOrder)return subOrder[nl[1]];
            else{
                return this.getPLDefaultValue(row, nl[0]);
            }
        }else{
            return row[attrName];
        }
    }
    getPLDefaultValue(row, type){
        var product = FutTradeModel.getProductByID(row.CID);
        var step = FutTradeModel.getPriceOnePointValue(product.UnitPrice);


        if (type=='SL'){
            var rangePoint = FutTradeModel.rangeTriggerPricePoint;
            var range = step<1 ? Number(Decimal.accMul(step, rangePoint)) : step*rangePoint;

            if (row.Side==CONST.TRADE.DIRECTION.BID) { //买单 止损<最新价
                range = -1*range;
            }
        }else{
            var rangePoint = FutTradeModel.rangePricePoint;
            var range = step<1 ? Number(Decimal.accMul(step, rangePoint)) : step*rangePoint;

            if (row.Side==CONST.TRADE.DIRECTION.ASK) { //买单 止损<最新价
                range = -1*range;
            }
        }
        return Number(Decimal.accAdd(product.price.LAST, range));
    }
    showKlineArrow() {
        // console.log(' >> :', FutTradeModel.positions)
        ChartModel.showAllPosition(FutTradeModel.positions, this.delRecord.bind(this, null));
    }
    componentDidMount() {
        window.addEventListener("mousedown", this.hideContextMenu);
        window.addEventListener("keydown", this.onKeyPress);

        // this.showKlineArrow();  此时还获取不到widget对象

        // this.rebuildTimerId = setTimeout(()=>{
        //     ReactTooltip.rebuild();
        // }, 400);
    }
    // componentDidUpdate(prevProps, prevState) {
    //
    //     // console.log(' >> :', prevState.data, this.state.data)
    //     // if (prevState.data && this.state.data && this.state.data.length){
    //     //     if (prevState.data.length !== this.state.data.length) {
    //     //         !prevState.data.length ? this.showKlineArrow(this.state.data) : this.showKlineArrow([this.state.data[0]])
    //     //     } else if (prevState.data.length === this.state.data.length && !ChartModel.executionShapeList.length) {
    //     //         this.showKlineArrow(this.state.data)
    //     //     }
    //     // }
    // }
    componentWillUnmount(){
        // if (this.rebuildTimerId){
        //     clearTimeout(this.rebuildTimerId);
        //     this.rebuildTimerId = 0;
        // }
        ChartModel.posLines = {};  // 清空绘制记录
        ChartModel.arrowList = {};  // 清空绘制记录
        window.removeEventListener("mousedown", this.hideContextMenu);
        window.removeEventListener("keydown", this.onKeyPress);
        this.hideContextMenu();
        PopDialog.closeAll();
        super.componentWillUnmount();
    }
    onKeyPress(event){
        var e = event || window.event || arguments.callee.caller.arguments[0];

        if((this.state.tab==3 || this.state.tab==2 || this.state.tab==1) && this.selection[0] && e && e.keyCode==67) { //ctrl+c
            e.stopPropagation();
            e.preventDefault();

            try{
                var textList = [];
                $(".rt-tr-group.current").each((i, e)=>{
                    textList.push(e.innerText.replace(/[\n]/g, "\t"));
                });
                var text = textList.join("\r\n");

                $(document.body).append("<textarea id='clipboardTxt' style='position: absolute;left: -1000px;top: -1000px;'/>");
                $("#clipboardTxt").val(text).select();
                document.execCommand('copy', false, null);

                $("#clipboardTxt").remove();
            }catch(e){
            }
        }
    }
    selectInputRowSelector(row){
        var keyField = "ID";
        if(!row || !row.hasOwnProperty(keyField)) return null;
        const isChecked = ()=>this.isSelected(row[keyField]);
        const inputProps =
            {
                isChecked,
                onChange: this.toggleSelection.bind(this),
                id: row[keyField],
                row,
            }

        return <SelectTable {...inputProps} />
    }
    selectInputHeadSelector(row) {
        const isChecked = ()=>this.selectAll;

        const inputProps =
            {
                isChecked,
                onChange: this.toggleAll.bind(this),
            }

            return <SelectTable {...inputProps} />
    }
    onConfirmEditDiv(columnName, posId, rows, value, callback){
        // console.log(value);

        var data = {};

        var row = rows[0];
        if (["Notes"].indexOf(columnName)!=-1){
            data[columnName] = value;
            this.submitModify(row, data, callback);
        }else{
            var form = {};
            form[columnName] = value==="" ? value : Number(value);
            this.modifyStructData(row, form, callback);

            // data["row"] = row;
            // data["form"] = form;

            // PopDialog.open(<FutOrderPreview product={FutTradeModel.getProductByID(row.CID)} action="modify" data={data} x={e.clientX} y={e.clientY} onConfirm={(result)=>{
            //     if (result) this.modifyStructData(row, form);
            //     if (callback) callback(result);
            // }} />, "order-preview", true, false);
        }
    }
    onWaitClickEditDiv(columnName, posId, row, isEdit){
        if (this.selection.indexOf(posId)==-1) {
            this.isEdit = isEdit;
        }
    }
    //单击可快捷编辑项，弹出对话框
    onClickEditDiv(columnName, posId, row){
        //没有选中
        if (this.selection.indexOf(posId)==-1){
            // console.log("onClickEditDiv"+columnName);
            //case 'conditionClose': //有条件平仓
            //             case 'splitPosition': //拆分仓位
            //             case 'adjustLever': //调整杠杆
            //             case 'addDeposit': //增加保证金
            //             case 'adjustForce': //调整强平价
            //             case 'setSL': //设置止损
            //             case 'editSL'://编辑止损
            //             case 'setTP'://设置获利
            //             case 'editTP': //编辑获利
            //             case 'editOrder'://编辑订单
            var isSimple = !FutTradeModel.loadSetting("isExpert");
            switch (columnName){
                case "Scale":
                    PopDialog.open(<FuturesEditOrder option="adjustLever" data={[row]} isSimple={isSimple} />, "order-edit", true);
                    break;
                case "MarginTotal":
                    PopDialog.open(<FuturesEditOrder option="addDeposit" data={[row]} isSimple={isSimple} />, "order-edit", true);
                    break;
                case "Force":
                    PopDialog.open(<FuturesEditOrder option="adjustForce" data={[row]} isSimple={isSimple} />, "order-edit", true);
                    break;
                case "SL.Param":
                    PopDialog.open(<FuturesEditOrder option={row.SL ? 'editSL' : 'setSL'} data={[row]} isSimple={isSimple} />, "order-edit", true);
                    break;
                case "TP.Param":
                    PopDialog.open(<FuturesEditOrder option={row.TP ? 'editTP' : 'setTP'} data={[row]} isSimple={isSimple} />, "order-edit", true);
                    break;
            }
        }

    }
    //快捷修改
    modifyStructData(order, data, callback){
        var newOrder = order;
        var newData = {};
        for (var key in data){
            var val = data[key];

            if (["Notes", "SL.Param", "TP.Param"].indexOf(key)==-1 && (!val || (!isNaN(val) && Number(val)<=0))){
                var newKey = key;
                newKey = newKey=='MarginTotal' ? 'Margin' : (newKey=='TriggerPrice' ? 'Constant': newKey);
                Notification.error(Intl.lang("trade.openError."+newKey));
                return;
            }

            if (key=='MarginTotal'){
                // var addDeposit = String(Decimal.accSubtr(order.Margin, order.Deposit));
                // var addDeposit = Decimal.accSubtr(val, order.MarginTotal);
                // newData["Margin"] = Number(Decimal.accAdd(Decimal.accDiv(addDeposit, order.Volume), order.MarginUnit));
                newData["Margin"] = IS_TRADE_V2 ? Number(val) : Number(Decimal.accDiv(val, order.Volume));
            }else if(key=='Force'){
                // var err = FutTradeModel.checkPosAttrRange(order, data);
                // // console.log(limitForce);
                // if (err.length > 0){
                //     Notification.error(err.join(" "));
                //     return;
                // }
                newData["Force"] = Number(val);
                // var abc = FutTradeModel.checkPosAttrRange(order, data);
                // var lever = FutTradeModel.formula.forcePrice2Lever(FutTradeModel.getCon(order.CID), order.Volume, order.Side, order.Price, val, Decimal.accSubtr(order.Margin, order.Deposit), order.Repay, order.Fee, FutTradeModel.getRisks(order.CID));
                // newData["Scale"] = Number(lever);
                // var addDeposit = FutTradeModel.formula.forcePrice2AddDeposit(FutTradeModel.getCon(order.CID), order.Volume, order.Price, val, order.Deposit, order.Repay, order.Fee, FutTradeModel.getRisks(order.CID));
                // newData["Margin"] = Number(Decimal.accAdd(Decimal.accDiv(addDeposit, order.Volume), order.MarginUnit));
            }
            else if(key=='SL.Param'){
                if (order.SL){
                    var row = order.SLorder;
                    if (row && val===""){
                        this.cancelOrders([row]);
                        return;
                    }

                    if (order.Side==CONST.FUT.Side.BUY){
                        if (row.Strategy==CONST.FUT.Strategy.Line && (Number(val)>=order.Product.price.LAST || Number(val)<=0)){
                            Notification.error(Intl.lang("trade.openError.SLParam.sl"));
                            return;
                        }
                        if (row.Strategy==CONST.FUT.Strategy.Trail && Number(val)>=0){
                            Notification.error(Intl.lang("trade.openError.SLParam.sz"));
                            return;
                        }
                    }else if (order.Side==CONST.FUT.Side.SELL){
                        if (row.Strategy==CONST.FUT.Strategy.Line && Number(val)<=order.Product.price.LAST){
                            Notification.error(Intl.lang("trade.openError.SLParam.bl"));
                            return;
                        }
                        if (row.Strategy==CONST.FUT.Strategy.Trail && Number(val)<=0){
                            Notification.error(Intl.lang("trade.openError.SLParam.bz"));
                            return;
                        }
                    }


                    var options = {
                        Constant: val,
                    };
                    newData = options;
                    newOrder = row;

                }else{
                    if (order.Side==CONST.FUT.Side.BUY){
                        if (Number(val)>=order.Product.price.LAST || Number(val)<=0){
                            Notification.error(Intl.lang("trade.openError.SLParam.sl"));
                            return;
                        }
                    }else if (order.Side==CONST.FUT.Side.SELL){
                        if (Number(val)<=order.Product.price.LAST){
                            Notification.error(Intl.lang("trade.openError.SLParam.bl"));
                            return;
                        }
                    }

                    var options = {
                        Strategy: CONST.FUT.Strategy.Line,
                        Variable: CONST.FUT.Variable.LastPrice,
                        Constant: val
                    };

                    newData.CID = order.CID;
                    newData.ID = order.ID; //仓位ID
                    newData.Visible = -1;

                    Object.assign(newData, options)
                    Net.httpRequest("futures/setsl", newData, (data)=>{
                        if (data.Status==0){
                            // FutTradeModel.loadTradeData();
                        }
                    }, this);

                    return;
                }
            }else if(key=='TP.Param'){
                if (order.TP && val===""){
                    this.cancelOrders([order.TPorder]);
                    return;
                }

                if (order.Side==CONST.FUT.Side.BUY){
                    if (Number(val)<=order.Product.price.LAST){
                        Notification.error(Intl.lang("trade.openError.TPParam.bl"));
                        return;
                    }
                }else if (order.Side==CONST.FUT.Side.SELL){
                    if (Number(val)>=order.Product.price.LAST || Number(val)<=0){
                        Notification.error(Intl.lang("trade.openError.TPParam.sl"));
                        return;
                    }
                }

                if (order.TP){
                    var row = order.TPorder;

                    var options = {
                        Price: val,
                        Relative: false
                    };
                    newData = options;
                    newOrder = row;
                }else{
                    newData.CID = order.CID;
                    newData.ID = order.ID; //仓位ID
                    // newData.Price = val;
                    // newData.Visible = -1;preview_margin

                    newData.Visible = -1;
                    newData.Strategy = CONST.FUT.Strategy.Immediate;
                    // newData.Variable = CONST.FUT.Variable.LastPrice;
                    newData.Price = val;
                    newData.Relative = false;


                    Net.httpRequest("futures/settp", newData, (data)=>{
                        if (data.Status==0){
                            // FutTradeModel.loadTradeData();
                        }
                    }, this);

                    return;
                }
            }else if(key=='TriggerPrice'){
                var options = {
                    Constant: val,
                };
                newData = options;
            }
            // else if(key=='PriceDistance'){
            //
            // }
            else{
                newData[key] = val;
            }
        }
        this.submitModify(newOrder, newData, callback);
    }
    submitModify(order, data, callback){
        if (order && data){
            var formData = {
                CID: Number(order.CID),
                ID: order.ID,
                Target:order.PID ? CONST.FUT.Target.ORDER : CONST.FUT.Target.POSITION,
                Options: data
            }

            Net.httpRequest("futures/setup", formData, (data)=>{
                var isOk = data.Status==0;
                if (callback) callback(isOk);

                if (isOk){
                    var tab = this.state.tab;
                    // if (tab==1 || tab==2){
                    //     FutTradeModel.loadPosition();
                    // }else{
                    //     FutTradeModel.loadOrders();
                    // }
                }
            }, this);
        }
    }

    delRecord(posId, row, e, callback){
        if (e){
            e.stopPropagation();
        }
        this.delRecords([row], e, callback);
    }

    //关闭仓位
    delRecords(rows, e, callback){
        if (!rows[0]) return;

        var row = rows[0];
        var CID = row.CID;
        // var isSummary = false;
        // if (row.List){//仓位概要的
        //     // row = row.List;
        //     isSummary = true;
        // }
        var isSummary = !!row.List;

        var data = {tab: this.state.tab, data:rows};

        var setting = FutTradeModel.setting;
        if (setting.isOneKeyTrade) { //一键交易无弹窗
            if (row.orderType=='order'){
                this.cancelOrders(rows);
            }else{
                this.closePositions(rows, isSummary);
            }
        }else{
            var props = {};
            if (e){
                props.x = e.clientX;
                props.y = e.clientY;
            }
            PopDialog.open(<FutOrderPreview product={FutTradeModel.getProductByID(CID)} action="close" data={data} {...props} onConfirm={(result)=>{
                if (result){
                    if (row.orderType=='order'){
                        this.cancelOrders(rows);
                    }else{
                        this.closePositions(rows, isSummary);
                    }
                }
                if (callback && typeof(callback)=='function') callback(result);
            }} />, "order-preview", true, FutTradeModel.loadSetting("isExpert") ? false : null);
        }
    }
    //右键菜单调用
    cancelOrders(data){
        FutTradeModel.cancelOrders(data);
    }
    //右键菜单调用
    closePositions(data, isSummary){
        var List = [];
        if (!isSummary){
            var oList = data;
            List = oList.map((v,i)=>{
                return {CID:Number(v.CID), ID:v.ID,
                    // Distance:v.Distance, Price:v.Price, Timely:v.Timely,
                    // TimelyParam:v.TimelyParam, Strategy:v.Strategy, Variable:v.Variable, Constant:v.Constant, Passive:v.Passive,
                    // Visible:v.Visible, Better:v.Better
                };
            });
            // if (data.CID){
            //     List.push({CID:Number(data.CID), ID:Number(data.ID),
            //         // Distance:data.Distance, Price:data.Price, Timely:data.Timely,
            //         // TimelyParam:data.TimelyParam, Strategy:data.Strategy, Variable:data.Variable, Constant:data.Constant, Passive:data.Passive,
            //         // Visible:data.Visible, Better:data.Better
            //     });
            // }else{
            //     // var oList = [];
            //     // if (data[0] && data[0].List){ //仓位概要的
            //     //     data.forEach((v)=>{
            //     //         oList = oList.concat(v.List);
            //     //     });
            //     // }else{
            //     //     oList = data;
            //     // }
            //
            // }

            Net.httpRequest("futures/close", {List}, (data)=>{
                //data = {"Status":0,"Data":{"Result":{"58518994945":{"Code":1003,"Error":"eeeeeeeeeeeeee"},"58586103809":{"Code":1002,"Error":""}}}};
                if (data.Status==0){
                    var Result = data.Data.Result;

                    // var errs = [];
                    if (Result){
                        for (var pid in Result){
                            var info = Result[pid];
                            if (info && info.Code>0){
                                Notification.error((info.Error && "production" !== process.env.NODE_ENV ? info.Error+ ' -- ' : '') + Intl.lang("trade.error.closePosition", pid, Intl.lang("server.status."+info.Code)));
                                // errs.push(Intl.lang("trade.error.closePosition", pid, Intl.lang("server.status."+info.Code)+ (info.Error && "production" !== process.env.NODE_ENV ? ','+info.Error : '')))
                            }
                        }
                    }

                    // if (errs[0]) Notification.error(errs.join(";\n"));
                    // FutTradeModel.loadPosition();
                }
            }, this);
        }else{
            //全部平仓
            // if (data.CID) {
            //     List.push(Number(data.CID));
            // }else{
                // var ids = [];

            // }
            var oList = data;
            oList.forEach((v, i)=>{
                if (List.indexOf(Number(v.CID))==-1){
                    List.push(Number(v.CID));
                    // List.push({CID:Number(v.CID)});
                }
            });

            Net.httpRequest("futures/closeAll", {List}, (data)=>{
                //data = {"Status":0,"Data":{"Result":{"58518994945":{"Code":1003,"Error":"eeeeeeeeeeeeee"},"58586103809":{"Code":1002,"Error":""}}}};
                if (data.Status==0){
                    var Result = data.Data.Result;

                    // var errs = [];
                    for (var cid in Result){
                        var info = Result[cid];
                        if (info && info.Code>0){
                            var product = FutTradeModel.getProductByID(cid);
                            Notification.error((info.Error && "production" !== process.env.NODE_ENV ? info.Error+' -- ' : '') + Intl.lang("trade.error.closePositionAll", product.Code, Intl.lang("server.status."+info.Code)));
                        }
                    }
                }
            }, this);
        }
    }
    //右键菜单调用
    mergePosition(data, hasTS){
        var _processMerge = ()=>{
            var row = data[0];
            if (row && row.List){
                data.forEach(v=>{
                    var CID = Number(v.CID);
                    var List = v.List.map(v=>v.ID);
                    Net.httpRequest("futures/merge", {CID,List}, (data)=>{
                        if (data.Status==0){
                            // FutTradeModel.loadPosition();
                        }
                    }, this);
                })
            }else{
                var CID = Number(row.CID);
                var List = data.map((v)=>v.ID);

                Net.httpRequest("futures/merge", {CID,List}, (data)=>{
                    if (data.Status==0){
                        // FutTradeModel.loadPosition();
                    }
                }, this);
            }
        };

        if (hasTS){
            if (this.props.isExpert){
                PopDialog.open(<FutOrderWarning msg="trade.merge.confirm" confirm="common.confirm" cancel="common.cancel" onConfirm={(e, result)=>{
                    if (result){
                        _processMerge();
                    }
                }} />, "order-warning", true);
            }else{
                PopDialog.open(<Confirm skin="dialog-bg-blue" isExpert={true} title={Intl.lang("Recharge.note")} content={Intl.lang("trade.merge.confirm")}
                                        yestxt={Intl.lang("trade.editOrder.confirm")} notxt={Intl.lang("common.cancel")} callback={()=>{
                    _processMerge();
                }} cancel={()=>{
                }}/>, "alert_panel");
            }
        }else{
            _processMerge();
        }
    }
    changeTab(tab){
        if (tab != this.state.tab){
            this.updateCount = 0;
            this.isEdit = false;

            this.selection = [];
            this.selectAll = false;

            this.setState({tab, columns:this.getColumns(tab), data:this.getData(tab)});
        }
    }
    changeInput(evt){
        evt.stopPropagation();
        evt.preventDefault();

        // console.log(123);
    }
    toggleSelection = (key) => {
        let selection = this.selection;
        const keyIndex = selection.indexOf(key);
        // check to see if the key exists
        if (keyIndex >= 0) {
            selection.splice(keyIndex, 1);
        } else {
            // it does not exist so add it
            selection.push(key);
        }

        this.refs.reactTable.tableRowsUpdate();
    }
    toggleAll = () => {
        const selectAll = this.selectAll ? false : true;
        const selection = [];
        if (selectAll) {
            // we need to get at the internals of ReactTable
            const wrappedInstance = this.refs.reactTable;
            // the 'sortedData' property contains the currently accessible records based on the filter and sort
            const currentRecords = wrappedInstance.getResolvedState().sortedData;
            // we just push all the IDs onto the selection array
            currentRecords.forEach((item) => {
                selection.push(item._original.ID);
            })
        }
        this.selectAll = selectAll;
        this.selection = selection;

        this.refs.reactTable.forceUpdate();
        // this.setState({ selectAll, selection })
    }
    isSelected = (key) => {
        return this.selection.includes(key);
    }
    onContextMenuRow = (row, eventType, e) =>{
        e.preventDefault();
        e.stopPropagation();

        var key = row.ID;
        if (!this.isSelected(key)){
            this.selectOneRow(key);
        }
        PopDialog.closeByDomID("context-menu");

        if ([4, 5].indexOf(this.state.tab)==-1){
            var rows = [];
            this.state.data.forEach((v)=>{
                if (this.isSelected(v.ID)){
                    rows.push(v);
                }
            });
            if (rows.length>0){
                var props = {};
                if (eventType=='click'){
                    var node = e.target;
                    props.bottom = $(node).offset().top + $(node).height();
                }

                PopDialog.open(<FuturesContextMenu rows={rows} tab={this.state.tab} x={e.clientX} y={e.clientY} pnComponent={this} eventType={eventType} {...props} />, "context-menu", false, false);
            }
        }
    }
    hideContextMenu(){
        PopDialog.closeByDomID("context-menu");
    }
    selectOneRow(key){
        this.selectAll = false;
        this.selection = [key];

        this.refs.reactTable.tableRowsUpdate();
    }
    selectRowColumn = (state, rowInfo, column, instance, e)=>{
        e.preventDefault();
        // e.stopPropagation();

        if (column){
            var key = rowInfo.original.ID;
            this.toggleSelection(key);

            if (this.isSelected(key)) this.onContextMenuRow(rowInfo.original, 'click', e);
            // if (column.id!='_selector'){
            //     //改成只能点击选择框选中
            //     // this.selectOneRow(key);
            // }else{
            //     this.toggleSelection(key);
            // }
        }
    }
    checkDataEqual = (newState, oldState)=>{
        // console.log("checkDataEqual");
        //返回data数据相等时，不是数据变化，其他属性变化，整个渲染
        if (newState.style.height!=oldState.style.height){
            return true;
        }
        return false;
    }
    closeMobileLog(){
        this.props.onChange();
    }
    setThread(tRef){
        if (tRef){
            // ReactTooltip.rebuild();
        }
    }
    // setScrollAreaRef(c){
    //     this.scrollAreaRef = c;
    // }
    // handleScroll(scrollData){
    //     if (scrollData && scrollData.hasOwnProperty("topPosition")){
    //         this.scrollAreaTop = scrollData.topPosition;
    //     }
    // }
    render() {
        const {style, className, code, height, hideStatBar, showIcon, hideAssetIcon} = this.props, sLang = Intl.getLang();
        const {tab, data, columns, history, pHistory} = this.state;

        // console.log("history render");
        var msgCount = 0;
        FutTradeModel.msgs.forEach((v,i)=>{
            msgCount += v.m.length;
        });
        var self = this;
        return (
            <div className={className} style={style ? style.history : {}} onContextMenu={(e)=>{e.preventDefault();e.stopPropagation();}}>
                <div className={"ff-history-nav fs11 f-clear asset-"+ sLang}>
                    <div className="ff-history-nav-l fl f-clear">
                        <ToolTip title={Intl.lang("futures.nav1_tip")}><span className={tab==1?"cur-hover current":"cur-hover"} onClick={()=>this.changeTab(1)}>{Intl.lang("futures.hist_nav1") + Intl.lang("common.bracket", FutTradeModel.posSummaryList.length)}<i className="iconfont icon-question fem75"></i></span></ToolTip>
                        <ToolTip title={Intl.lang("futures.nav2_tip")}><span className={tab==2?"cur-hover current":"cur-hover"} onClick={()=>this.changeTab(2)}>{Intl.lang("futures.hist_nav2") + Intl.lang("common.bracket", FutTradeModel.positionList.length)}<i className="iconfont icon-question fem75"></i></span></ToolTip>
                        <ToolTip title={Intl.lang("futures.nav3_tip")}><span className={tab==3?"cur-hover current":"cur-hover"} onClick={()=>this.changeTab(3)}>{Intl.lang("TradeHistory.101") + Intl.lang("common.bracket", FutTradeModel.orderList.length)}<i className="iconfont icon-question fem75"></i></span></ToolTip>
                        {!IS_TRADE_V2 && <span className={tab==4?"current":null} onClick={()=>this.changeTab(4)}>{Intl.lang("futures.hist_nav4") + Intl.lang("common.bracket", msgCount)}</span>}
                        <span className={tab==5?"current":null} onClick={()=>this.changeTab(5)}>{Intl.lang("TradeHistory.log")}</span>
                        {IS_TRADE_V2 && <ToolTip title={Intl.lang("futures.nav6_tip")}><span className={tab==6?"cur-hover current":"cur-hover"} onClick={()=>this.changeTab(6)}>{Intl.lang("futures.hist_nav6")}<i className="iconfont icon-question fem75"></i></span></ToolTip>}
                    </div>

                    {!hideStatBar && <StatBar code={code} showIcon={showIcon} hideAssetIcon={hideAssetIcon} onChange={()=>this.closeMobileLog()}/>}
                </div>
                <div className="futures-fullTrade-history-detail fs11 pos-rz">
                    {(tab==1 || tab==2 || tab==3) &&
                    <ReactTable
                        ref="reactTable"
                        data={data}
                        equalData={this.checkDataEqual}
                        tabIndex={String(tab)}
                        columns={columns}
                        className={"ft-order-log ft-log-w1 ft-log-opt "+("log-mb-type"+tab)}
                        showPagination={false}
                        showPageJump={false}
                        minRows={data.length}
                        pageSize={data.length}
                        style={{height: (height - 30)+"px", marginTop: -1}}
                        getTrGroupProps={(state, rowInfo, column) => {
                            var selectCn = this.isSelected(rowInfo.original.ID) ? 'current' : '';
                            var disabled = !selectCn && (rowInfo.original.hasOwnProperty("Attempt") && rowInfo.original.Attempt != CONST.FUT.Action.OPEN
                                || rowInfo.original.hasOwnProperty("Bankrupt") && rowInfo.original.Bankrupt>0);
                            return {
                                className: classnames(selectCn, disabled ? 'disable' : ''),
                                onContextMenu: this.onContextMenuRow.bind(this, rowInfo.original, 'contextMenu')
                            };
                        }}
                        getTdProps={(state, rowInfo, column, instance) => {
                            return {
                                onClick: this.selectRowColumn.bind(this, state, rowInfo, column, instance)
                            }
                        }}
                        TbodyComponent={({children, className, ...rest}) => {
                            if (rest){
                                var desc = Object.getOwnPropertyDescriptor(rest.style, "height");
                                if (!desc || desc.writable) rest.style.height = (height-53)+"px";
                            }
                            return <ScrollArea className={classnames("log-list", "ft-can-edit", className)} contentClassName="order-content" {...rest}>{children}</ScrollArea>
                        }
                        }
                        TheadComponent={({ children, className, ...rest }) => (
                            <dl className={classnames("rt-thead", "ft-log-theme", "f-clear", className)} {...rest} ref={this.setThread.bind(this)}>{children}</dl>
                            )}
                        ThComponent={({ toggleSort, className, children, ...rest }) => (
                            <dd className={classnames('rt-th', className)} onClick={e => ( toggleSort && toggleSort(e) )} role="columnheader" tabIndex="-1" {...rest}>{children}</dd>
                        )}
                        TrGroupComponent={({ children, className, ...rest }) => {
                            return (
                            <dl className={classnames('rt-tr-group', 'f-clear', className)} role="rowgroup" {...rest}>{children}</dl>
                        )}}
                        TdComponent={({ toggleSort, className, children, ...rest })=>{
                            return (
                                <dd className={classnames('rt-td', className)} role="gridcell" {...rest}>{children}</dd>
                            )
                        }}
                        NoDataComponent={({ children, className, ...rest }) => {
                            return <div className={classnames("rt-noData", "ft-log-theme", "f-clear", "log-contain", className)}><p className="mt-30 tc">{Intl.lang("bank.1_27")}</p></div>
                        }}
                    />
                    }
                    {tab==4 && <FutOrderEvent height={height} />}
                    {tab==5 && <FutOrderHistory {...history} height={height} onChange={this.loadHistory.bind(this)}/>}
                    {tab==6 && <FutPositionHistory  {...pHistory} height={height} onChange={this.loadPositionHistory.bind(this)} />}
                </div>
            </div>
        )
    }
}

class FutOrderEvent extends PureComponent{
    constructor(props) {
        super(props);

        this.state = {
            list: FutTradeModel.msgs
        };
    }
    parseData(list){
        var newList = [];
        for (var a=0,al=list.length; a<al; a++){
            var v = list[a];
            if (!v) continue;

            var slist = v.m;
            for (var b=0,bl=slist.length; b<bl; b++){
                var sv = slist[b];
                var msg;
                if (sv.Type=='Order'){
                    if (sv.Event=='Create'){
                        var textList = FutTradeModel.parseOrderToText(sv);
                        msg = Intl.lang('trade.event.order_create', sv.ID, textList.join(" "));
                    }else if(sv.Event=='Update'){
                        var textList = [];
                        var order = sv.full;
                        for (var key in sv){
                            var val = sv[key];
                            if (key=="Filled"){
                                textList.push(Intl.lang("trade.event.orderFilled", Number(val)));
                            }else if(key=="Kind"){
                                // var data = FutTradeModel.getOrder(sv.ID);
                                if (order){
                                    if (order.Kind==CONST.FUT.Kind.LMT){
                                        if ((order.Attempt==CONST.FUT.Action.TP || order.Attempt==CONST.FUT.Action.SL) && order.Strategy!=CONST.FUT.Strategy.Trail){
                                            textList.push(Intl.lang("trade.order.Strategy10"));
                                        }else{
                                            textList.push(order.Strategy==CONST.FUT.Strategy.Immediate?Intl.lang('trade.order.Strategy10'):Intl.lang(order.Strategy==CONST.FUT.Strategy.Line?'trade.order.Strategy11':'trade.order.Strategy12'));
                                        }
                                        textList.push(Intl.lang("trade.event.Price", Number(order.Price)));
                                    }else{
                                        if ((order.Attempt==CONST.FUT.Action.TP || order.Attempt==CONST.FUT.Action.SL) && order.Strategy!=CONST.FUT.Strategy.Trail){
                                            textList.push(Intl.lang("trade.order.Strategy00"));
                                        }else{
                                            textList.push(order.Strategy==CONST.FUT.Strategy.Immediate?Intl.lang('trade.order.Strategy00'):Intl.lang(order.Strategy==CONST.FUT.Strategy.Line?'trade.order.Strategy01':'trade.order.Strategy02'));
                                        }
                                    }
                                }
                            }else if(key=='Constant'){
                                if (order) {
                                    var gl = (order.Side == CONST.FUT.Side.BUY && order.Attempt != CONST.FUT.Action.TP || order.Side == CONST.FUT.Side.SELL && order.Attempt == CONST.FUT.Action.TP) ? "common.symbol.ge" : "common.symbol.le";
                                    textList.push(Intl.lang("trade.event.Constant", FutTradeModel.VariableTxtMap[order.Variable] + Intl.lang(gl) + Number(order.Constant) + (order.Relative ? Intl.lang("trade.open.delegateOption2") : '')));
                                }
                            }
                            else if(key=="State"){
                                // var order = FutTradeModel.getOrder(sv.ID);
                                if (order) {
                                    textList.push(Intl.lang("trade.event.orderState", FutTradeModel.getOrderStateTxt(order)));
                                }
                            }else if(key=='Timely'){
                                if (order) {
                                    textList.push(Intl.lang("trade.event.Timely", order.Timely == CONST.FUT.Timely.GTC ? 'GTC' : (order.Timely == CONST.FUT.Timely.LIFE ? moment.unix(moment(order.CreatedAt).unix() + order.TimelyParam).format("MM-DD HH:mm:ss") : SysTime.ts2Server(order.TimelyParam, "MM-DD HH:mm:ss"))));
                                }
                            }else if(["FinalPrice", "XVolume", "Fee", "Scale", "Volume", "Notes"].indexOf(key)!=-1){
                                textList.push(Intl.lang("trade.event."+key, !isNaN(val)?Decimal.toFixed(Number(val)):val));
                            }else if(key=='Visible'){
                                if (order){
                                    if (order.Visible>=0){
                                        textList.push(Intl.lang(order.Visible==0?"trade.order.preview_hideDelegate":"trade.order.preview_showDelegate", Number(order.Visible)))
                                    }else{
                                        textList.push(Intl.lang("trade.event.Visiblelq0"));
                                    }
                                }
                            }else if(key=='Passive'){
                                if (order){
                                    if (order.Passive){
                                        textList.push(Intl.lang("trade.open.beidong"));
                                    }
                                }
                            }
                            else if(key=="Reason"){
                                textList.push(Intl.lang("trade.event.orderReason", FutTradeModel.getOrderReason(sv)));
                            }
                        }
                        msg = Intl.lang("trade.event.order_update", sv.ID, textList.join(" "));
                    }else if(sv.Event=='Delete'){
                        msg = Intl.lang("trade.event.order_delete", sv.ID);
                    }
                }else if (sv.Type=='Position'){
                    if (sv.Event=='Create'){
                        var textList = FutTradeModel.parsePositionToText(sv);
                        msg = Intl.lang('trade.event.position_create', sv.ID, textList.join(" "));
                    }else if(sv.Event=='Update'){
                        var textList = [];
                        for (var key in sv){
                            var val = sv[key];

                            if(["Scale", "Margin", "Repay", "Force", "Notes" ].indexOf(key)!=-1){
                                textList.push(Intl.lang("trade.event."+key, !isNaN(val)?Number(val):val));
                            }
                        }
                        msg = Intl.lang("trade.event.position_update", sv.ID, textList.join(" "));
                    }else if(sv.Event=='Delete'){
                        msg = Intl.lang("trade.event.position_delete", sv.ID);
                    }
                }else if(sv.Type=='Rank'){
                    msg = Intl.lang("trade.event.rank", sv.ID, Number(sv.Rank));
                }else if(sv.Type=='Mining'){
                    msg = Intl.lang("mining.msg."+sv.Event, sv.Msg);
                }
                newList.unshift({t:v.t, m:msg});
            }
        }

        return newList;
    }
    componentWillMount() {
        Event.addListener(Event.EventName.TRADE_EVENT_UPDATE, this.onUpdateEvent.bind(this), this);
    }
    onUpdateEvent(data){
        var list = this.state.list;
        var existed = list.filter((v,i)=>v.ID==data.ID);
        if (!existed[0]){
            list.unshift(data);
            this.setState({list});
        }
    }
    render(){
        const {list} = this.state;
        var newList = this.parseData(list);
        const height = this.props.height;
        return (
            <div className="ft-order-log ft-log-w4 log-mb-type4" style={{"height":(height-30)+"px"}}>
                <dl className="ft-log-theme f-clear">
                    <dd style={{width:"10%"}}>{Intl.lang('trade.history.CreatedAt_O')}</dd><dd style={{width:"90%"}}>{Intl.lang('trade.history.tab4_t2')}</dd>
                </dl>
                <ScrollArea className={classnames("log-list", "ft-can-edit")} contentClassName="order-content" style={{"height": (height-53)+"px"}}>
                    <div className="log-list ft-can-edit">
                        {newList && newList.map((v,i)=>{
                            return <dl className="f-clear" key={i}>
                                <dd style={{width:"10%"}}>{v.t}</dd><dd style={{width:"90%",paddingLeft:"10px"}} className="tl">{v.m}</dd>
                            </dl>
                        })}
                    </div>
                </ScrollArea>
            </div>
        )
    }
}

class FutOrderHistory extends PureComponent{
    constructor(props) {
        super(props);

        this.state = {};
    }
    render(){
        const {List, onChange, height} = this.props;

        var newList = List;
        const hasData = !!newList && !!newList[0];
        //["CreatedAt", "PID", "ID", "CName", "AttemptName", "SideTxt", "VolumeDesc", "ScaleTxt", "TriggerPrice", "PriceDistance", "PriceTxt", "TypeDesc", "StateTxt", "TimelyDesc", "Notes"]
        return (
            <div className="ft-order-log ft-log-w5 log-mb-type5" style={{"height":(height-30)+"px"}}>
                <dl className="ft-log-theme f-clear">
                    <dd style={{width:"14%"}}>{Intl.lang('trade.history.CreatedAt_O')}</dd><dd>{Intl.lang('trade.history.PID_O')}</dd><dd>{Intl.lang('trade.history.CName_O')}</dd>
                    <dd>{Intl.lang('trade.history.SideTxt_O')}</dd><dd>{Intl.lang('trade.history.ScaleTxt_O')}</dd>
                    <dd style={{width:"9%"}}>{Intl.lang('trade.history.VolumeDesc_O')}</dd>
                    <dd>{Intl.lang('trade.history.TypeDesc_O')}</dd>
                    <dd>{Intl.lang('trade.history.OrderPrice_O')}</dd>
                    <dd>{Intl.lang('trade.history.DealPrice_O')}</dd>
                    <dd>{Intl.lang("trade.history.TimelyDesc_O")}</dd>
                    <dd>{Intl.lang('trade.history.StateTxt_O')}</dd>
                    <dd>{Intl.lang('trade.history.Notes')}</dd>
                </dl>
                <div className="log-list ft-can-edit" style={{"height": (height-53)+"px"}}>
                    {hasData && newList.map((v,i)=>{
                        var product = FutTradeModel.getProductByID(v.CID);
                        return <dl className="f-clear" key={i}>
                            <dd style={{width:"14%"}}>{v.CreatedAt}</dd><dd>{v.PID}</dd><dd>{v.CName}</dd>
                            <dd className={v.Side==CONST.FUT.Side.BUY ? "buy" : "sell"}>{v.SideTxt}</dd>
                            <dd>{v.ScaleTxt}</dd>
                            <dd style={{width:"9%"}}>{v.VolumeDesc}</dd>
                            <dd>{v.TypeDesc}</dd>
                            <dd>{v.OrderPrice}</dd>
                            <dd>{v.DealPrice}</dd>
                            <dd>{v.TimelyDesc}</dd>
                            <dd>{v.StateTxt}</dd>
                            <dd>{v.Notes}</dd>
                        </dl>
                    })}
                    {hasData && <Pager data={this.props} onChange={onChange}/>}
                    {!hasData && <dl className="f-clear" key="h_no_data" style={{"height": (height-53)+"px"}}><dd style={{width:"100%"}} className="pd-30 border-none">{Intl.lang("bank.1_27")}</dd></dl>}
                </div>
            </div>
        )
    }
}

class FutPositionHistory extends PureComponent{
    constructor(props) {
        super(props);

        //是否桌面版
        this.isDesktop = process.env.VER_ENV=='desktop';

        this.state = {};
    }
    onContextMenu(e){
        e.preventDefault();
        e.stopPropagation();

        PopDialog.closeByDomID("context-menu");

        if (this.isDesktop) return;

        PopDialog.open(<FuturesContextMenu tab={6} rows={[]} x={e.clientX} y={e.clientY} pnComponent={this} />, "context-menu", false, false, false);
    }
    render(){
        const {List, onChange, height} = this.props;

        var newList = List;
        const hasData = !!newList && !!newList[0];
        //["CreatedAt", "PID", "ID", "CName", "AttemptName", "SideTxt", "VolumeDesc", "ScaleTxt", "TriggerPrice", "PriceDistance", "PriceTxt", "TypeDesc", "StateTxt", "TimelyDesc", "Notes"]
        return (
            <div className="ft-order-log ft-log-w6 log-mb-type6" style={{"height":(height-30)+"px"}}>
                <dl className="ft-log-theme f-clear">
                    <dd>{Intl.lang('trade.history.ID')}</dd><dd>{Intl.lang('trade.history.CName')}</dd><dd>{Intl.lang('trade.history.SideTxt')}</dd>
                    <dd>{Intl.lang('trade.history.ScaleTxt')}</dd><dd>{Intl.lang('trade.history.Volume')}</dd>
                    <dd>{Intl.lang('trade.history.PriceDesc')}</dd><dd>{Intl.lang('trade.history.MarginTotalDesc')}</dd>
                    <dd>{Intl.lang('trade.history.TypeDesc_O')}</dd><dd title={Intl.lang('trade.history.tab5_t11')}>{Intl.lang('trade.history.tab5_t11')}</dd>
                    <dd>{Intl.lang('trade.history.tab5_t14')}</dd>
                    <dd>{Intl.lang('trade.history.FundFeeDesc')}</dd><dd>{Intl.lang('trade.history.ChargeFeeDesc')}</dd><dd>{Intl.lang('trade.history.CreatedAt_O')}</dd>
                    <dd>{Intl.lang('trade.history.Notes')}</dd>
                </dl>
                <div className="log-list ft-can-edit" style={{"height": (height-53)+"px"}}>
                    <div onContextMenu={this.onContextMenu.bind(this)} onClick={this.onContextMenu.bind(this)}>
                    {hasData && newList.map((v,i)=>{
                        var product = FutTradeModel.getProductByID(v.CID);
                        return <dl className="f-clear" key={i}>
                            <dd>{v.ID}</dd><dd>{v.CName}</dd><dd className={v.Side==CONST.FUT.Side.BUY ? "buy" : "sell"}>{v.SideTxt}</dd>
                            <dd>{v.ScaleTxt}</dd><dd>{v.Volume}</dd>
                            <dd>{v.PriceDesc}</dd><dd>{v.MarginTotalDesc}</dd>
                            <dd>{v.OperateDesc}</dd><dd>{v.DealPrice}</dd>
                            <dd className={v.Profit>0 ? "buy" : (v.Profit<0?"sell":"")}>{v.ProfitDesc}</dd>
                            <dd>{v.FundFeeDesc}</dd>
                            <dd>{v.ChargeFeeDesc ? `${v.ChargeFeeDesc} ${v.ChargeFeeUnit}` : ''}</dd>
                            <dd>{v.CreatedAt}</dd>
                            <dd>{v.Notes}</dd>
                        </dl>
                    })}
                    </div>
                    {hasData && <Pager data={this.props} onChange={onChange}/>}
                    {!hasData && <dl className="f-clear" key="h_no_data" style={{"height": (height-53)+"px"}}><dd style={{width:"100%"}} className="pd-30 border-none">{Intl.lang("bank.1_27")}</dd></dl>}
                </div>
            </div>
        )
    }
}

class SelectTable extends PureComponent{
    constructor(props){
        super(props);

        this.state = {
        }
    }
    render(){
        const checked = this.props.isChecked();
        // if (!this.props.id) console.log(checked);

        return <label className="custom-checkbox"><div style={{margin: '3px 1px'}}><input type='checkbox' className="input_check" checked={checked} onChange={(e)=>{
            // e.preventDefault();
            e.stopPropagation();
            this.props.onChange(this.props.id);
        }} /><i></i></div></label>
    }
}

class EditDiv extends PureComponent{
    constructor(props){
        super(props);

            //+ String(parseInt(Math.random()*10000000));
        // this.optionColumnMap = {
        //     "Price":1  //列名对应的option类型（右键菜单中的）
        // };

        this.isClose = false;
        this.onMouseClick = this.onMouseClick.bind(this);
        this.onKeyPress = this.onKeyPress.bind(this);

        this.clickTimeInfo = {timer:0, t: 0};

        this.state = {
            editMode: false,
            value: this.props.value,      //确认后的值
            inputValue: this.props.value //编辑时文本框的值
        }
    }
    componentWillReceiveProps(nextProps){
        if (nextProps.value!=this.state.value){
            this.setState({value: nextProps.value});
        }
    }
    componentDidMount() {
        window.addEventListener("click", this.onMouseClick);
    }
    onMouseClick = (e)=>{
        if (this.state.editMode){
            e.stopPropagation();

            var elem = ReactDOM.findDOMNode(this);
            if (!$.contains(elem, e.target)){
                this.setState({editMode: false});

                if (this.props.onFocusBlur){
                    this.props.onFocusBlur(false);
                }

                window.removeEventListener("keydown", this.onKeyPress);
            }
        }
    }
    componentWillUnmount() {
        if (this.clickTimeInfo.timer){
            clearTimeout(this.clickTimeInfo.timer);
            this.clickTimeInfo.timer = 0;
        }

        this.isClose = true;
        window.removeEventListener("click", this.onMouseClick);
        window.removeEventListener("keydown", this.onKeyPress);

        super.componentWillUnmount();
    }
    toggle(e){
        e.preventDefault();
        e.stopPropagation();

        const type = this.props.type;
        if (type!='popup'){
            if (!this.state.editMode){
                this.setState({editMode: true, inputValue: type=='number'? this.props.num : this.state.value}, ()=>{
                    var elem = ReactDOM.findDOMNode(this);
                    var inputElem = $(elem).find("input");
                    inputElem.focus();
                });

                if (this.props.onFocusBlur){
                    this.props.onFocusBlur(true);
                }
            }

            window.addEventListener("keydown", this.onKeyPress);
        }else{
            // PopDialog.closeByDomID('order-edit');
            // PopDialog.open(<FuturesEditOrder option={this.optionColumnMap[this.props.column]} data={this.props.rows} />, "order-edit", false);
        }
    }
    onChangeTextValue(e){
        var value = e.target.value;

        this.setState({inputValue: value});
    }
    onChangeNumberValue(value){
        this.setState({inputValue: value});
    }
    onKeyPress(event){
        if (!this.state.editMode) return false;
        // event.stopPropagation();

        var e = event || window.event || arguments.callee.caller.arguments[0];

        if(e && e.keyCode==13) { //enter
            e.stopPropagation();
            e.preventDefault();
            var value = this.state.inputValue;

            var oldVal = this.props.type=='number'? this.props.num : this.props.value

            if (oldVal!=value || (!this.props.value && value==this.props.num)){
                // var oldValue = this.state.value;

                this.setState({value, editMode:false});

                this.props.onConfirm(this.props.rows, value, (result)=>{
                    if (!result && !this.isClose){
                        this.setState({editMode:false, value: this.props.value, inputValue: this.props.value});
                    }
                });
            }else{
                this.setState({
                    editMode: false,
                    value: this.props.value,
                    inputValue: this.props.value
                });
            }

            window.removeEventListener("keydown", this.onKeyPress);

            if (this.props.onFocusBlur){
                this.props.onFocusBlur(false);
            }
        }
    }
    onClick(){
        if (this.props.onClick) this.props.onClick();
    }
    onAutoClick(e){
        e.preventDefault();
        e.stopPropagation();

        // console.log("onAutoClick");

        if (this.state.editMode) return false;
        // console.log("onAutoClick 222");

        var info = this.clickTimeInfo;
        var now = new Date().getTime();
        //双击事件
        if (info.timer){
            clearTimeout(info.timer);
            info.timer = 0;

            if (now - info.t < 500){
                this.toggle(e);
            }

            // console.log("onAutoClick 4444");
        }else{//单击
            var cbTimer = setTimeout(()=>{
                if (info.timer){
                    clearTimeout(info.timer);
                    info.timer = 0;
                }
                this.onClick();
                if (this.props.onWaitClick) this.props.onWaitClick(false);
            }, 500);
            info.timer = cbTimer;
            info.t = now;
            if (this.props.onWaitClick) this.props.onWaitClick(true);
            // console.log("onAutoClick 3333");
        }
    }

    render(){
        const {type, disabled, step, min, max, isRequire, maxLength} = this.props;
        const {editMode, value, inputValue} = this.state;
        var canEdit = !disabled;

        return <div style={{width:'100%', height:'100%'}} onClick={(e)=>{if(canEdit)this.onAutoClick(e)}} className={canEdit?"slider-number-box point":"point"}>{!editMode ? <span>{value}</span> : (type=='text' ? <div className="editDiv"><input type="text" className="wp-100" value={inputValue} maxLength={maxLength} onChange={this.onChangeTextValue.bind(this)}/></div> : <OptionsNumberInput value={inputValue} isRequire={isRequire} step={step} min={min} max={max} className="slider-number-box editDiv" onChange={this.onChangeNumberValue.bind(this)}/>)}</div>

    }
}

class OverChangeDiv extends PureComponent{
    constructor(props){
        super(props);

        this.state = {
            isOver:false,
            value: this.props.value,
            text: this.props.text
        }
    }

    componentWillReceiveProps(nextProps){
        if (this.state.isOver){
            this.setState( {
                value: nextProps.overValue,
                text: nextProps.overText
            })
        }else{
            this.setState( {
                value: nextProps.value,
                text: nextProps.text
            })
        }
    }

    onMouseEnter(e){
        e.stopPropagation();
        this.setState( {
            isOver: true,
            value: this.props.overValue,
            text: this.props.overText
        })
    }
    onMouseLeave(e){
        e.stopPropagation();
        this.setState({
            isOver: false,
            value: this.props.value,
            text: this.props.text
        });
    }

    render(){
        const {className} = this.props;
        const {isOver, value, text} = this.state;
        var num = Number(value);
        return (
            <span className={classnames(num>0 ? "buy" : (num<0 ? "sell":""), "wp-100", isOver?"bg-black":"", className)} onMouseOver={this.onMouseEnter.bind(this)} onMouseOut={this.onMouseLeave.bind(this)}>{text}</span>
        )
    }
}

class FuturesContextMenu extends PureComponent{
    constructor(props){
        super(props);

        const tab = this.props.tab;

        this.state = {
            menuMap: this.getMenuMap(tab)
        }
    }
    getMenuMap(tab){
        var rows = this.props.rows;

        //是否有止盈止损
        this.hasTS = false;

        //1和0表示可用和不可用
        if (tab == 1){
            return this.getTab1Menu(rows);
        }else if (tab == 2){
            return this.getTab2Menu(rows);
        }else if(tab == 3){
            return this.getTab3Menu(rows);
        }else if(tab == 6){
            return this.getTab6Menu();
        }
    }
    getTab1Menu(rows){
        var menu = {
            "closePosition": 1,
            "mergePosition": 1,
        };
        //不同产品的或者只有一条数据的
        if (rows[1] || !rows[0].List[1]){
            menu["mergePosition"] = 0;
        }
        return menu;
    }
    getTab2Menu(rows){
        const {eventType} = this.props;
        var menu = {
            "closePosition": 1,
            "conditionClose": 0,
            "splitPosition": 0,
            "mergePosition": 0,

            "placeholder.1": 1, //占位符

            "adjustLever": 0,
            "addDeposit": 0,
            "adjustForce":0,

            "placeholder.2": 1,//占位符

            "setSL": 0,
            "editSL": 0,
            "cancelSL": 1,

            "placeholder.3": 1,//占位符

            "setTP": 0,
            "editTP": 0,
            "cancelTP": 1,
        }
        //>1条
        if (rows[1]){
            var hasTP = false, hasSL = false, hasDiff = false;
            var prev;
            rows.forEach((v)=>{
                if (v.TP){
                    hasTP = true;
                }
                if (v.SL){
                    hasSL = true;
                }
                // if (v.CLOSEorder){
                //     hasClose = true;
                // }
                if (prev && prev.CID!=v.CID){
                    hasDiff = true;
                }
                prev = v;
            });

            if (!hasTP){
                menu["cancelTP"] = 0;
            }
            if (!hasSL){
                menu["cancelSL"] = 0;
            }

            this.hasTS = hasTP || hasSL;
            // if (hasClose){
            //     menu["conditionClose"] = 0;
            // }
            menu["mergePosition"] = !hasDiff ? 1 : 0;
        }else{
            var order = rows[0];

            if (order.CLOSEorder){
                menu["closePosition"] = 0;
            }
            menu["conditionClose"] = 1;

            menu["adjustLever"] = 1;
            menu["addDeposit"] = 1;
            menu["adjustForce"] = 1;

            menu["splitPosition"] = order.Volume>1 ? 1 : 0;
            if (!order.TP){
                menu["setTP"] = 1;
                menu["editTP"] = 0;
                menu["cancelTP"] = 0;
            }else{
                menu["editTP"] = 1;
                menu["cancelTP"] = 1;
            }
            if (!order.SL){
                menu["setSL"] = 1;
                menu["editSL"] = 0;
                menu["cancelSL"] = 0;
            }else{
                menu["editSL"] = 1;
                menu["cancelSL"] = 1;
            }

            this.hasTS = !!order.TP || !!order.SL
        }

        if (this.props.eventType=='click'){
            for (var key in menu){
                if (["closePosition", "conditionClose", "splitPosition", "mergePosition"].indexOf(key)==-1){
                    menu[key] = 0;
                }
            }
        }

        // var isExpert = FutTradeModel.loadSetting("isExpert");
        // if (!isExpert) {
        //     delete menu["setTP"];
        //     delete menu["editTP"];
        // }

        return menu;
    }
    getTab3Menu(rows){
        var groups = this.groupByOrders(rows);
        var opens = groups[CONST.FUT.Action.OPEN];
        var sls = groups[CONST.FUT.Action.SL];
        var tps = groups[CONST.FUT.Action.TP];
        var closes = groups[CONST.FUT.Action.CLOSE];
        var clears = groups[CONST.FUT.Action.CLEAR];

        var menu = {};
        if (opens){
            menu = {
                "cancelOrder": 1,
                "editOrder": 1,

                "placeholder.1": 1, //占位符

                //止损
                "setSL": 1,
                "editSL": 1,
                "cancelSL": 1,

                "placeholder.2": 1, //占位符

                //止盈
                "setTP": 1,
                "editTP": 1,
                "cancelTP": 1,
            }

            //只有一个开仓订单 判断该订单是否存在止盈止损单
            if (opens.length==1){
                var order = opens[0];
                if (order.TP){
                    menu["setTP"] = 0;
                }else{
                    menu["editTP"] = 0;
                    menu["cancelTP"] = 0;
                }
                if (order.SL){
                    menu["setSL"] = 0;
                }else{
                    menu["editSL"] = 0;
                    menu["cancelSL"] = 0;
                }
            }else if (!sls && !tps){//多个单时，而且不存在止盈止损的单时，判断开仓单是否全都不存在止盈止损
                var hasTP = false, hasSL = false;
                for (var i=0,l=opens.length; i<l; i++){
                    var order = opens[i];
                    if (order.TP){
                        hasTP = true;
                    }
                    if (order.SL){
                        hasSL = true;
                    }
                    if (hasTP && hasSL) break;
                }
                if (!hasTP){
                    menu["cancelTP"] = 0;
                }
                if (!hasSL){
                    menu["cancelSL"] = 0;
                }
            }
        }
        if (sls){
            if (menu.hasOwnProperty("cancelSL")){
                menu["cancelSL"] = 1;
            }else{
                menu = {
                    "cancelOrder": 1,
                    "placeholder.1": 1, //占位符
                    "editSL": 1,
                    "cancelSL": 1,
                };
            }
        }
        if (tps){
            if (menu.hasOwnProperty("cancelTP")){
                menu["cancelTP"] = 1;
            }else{
                Object.assign(menu, {
                    "cancelOrder": 1,
                    "placeholder.1": 1, //占位符
                    "editTP": 1,
                    "cancelTP": 1,
                });
            }
        }
        if (closes || clears){
            Object.assign(menu, {
                "cancelOrder": 1,
            });
        }

        if (rows[1]){
            for (var key in menu){
                if (['cancelOrder', 'cancelSL', 'cancelTP'].indexOf(key)==-1 && key.indexOf('placeholder')==-1){
                    menu[key] = 0;
                }
            }
        }

        var isExpert = FutTradeModel.loadSetting("isExpert");
        if (!isExpert) menu = {"cancelOrder": 1};

        return menu;
    }
    getTab6Menu(){
        return {
            "positionLog": {href:"/history?t=2", target:"_blank"}
        }
    }

    groupByOrders(rows){
        var groups = {};
        for (var i=0,l=rows.length; i<l; i++) {
            var order = rows[i];
            var action = order.Attempt;
            if (!groups[action]){
                groups[action] = [];
            }
            groups[action].push(order);
        }
        return groups;
    }
    findFilterOrders(condition){
        var list = [];
        if (["SL", "TP"].indexOf(condition)!=-1){

            this.props.rows.forEach((v)=>{
                if (v.hasOwnProperty("Attempt") && v.Attempt==CONST.FUT.Action[condition]){
                    list.push(v);
                }else if(v[condition+'order']){
                    list.push(v[condition+'order']);
                }
            });
        }
        return list;
    }
    selectMenu(evt, option){
        evt.stopPropagation();
        evt.preventDefault();

        if (this.menuRef) this.menuRef.close();

        var pn = this.props.pnComponent;
        // var tab = this.props.tab;

        switch (option){
            case 'closePosition': //关闭仓位
                // var rows = this.props.rows;
                // pn.closePositions(rows, tab==1);
                pn.delRecords(this.props.rows, evt);
                break;
            case 'cancelOrder'://取消订单
                // pn.cancelOrders(this.props.rows);
                pn.delRecords(this.props.rows, evt);
                break;
            case 'mergePosition'://合并仓位
                // var rows = ;
                pn.mergePosition(this.props.rows, this.hasTS);
                break;
            case 'cancelSL'://取消止损
                pn.cancelOrders(this.findFilterOrders("SL"));
                break;
            case 'cancelTP': //取消获利
                pn.cancelOrders(this.findFilterOrders("TP"));
                break;
            case 'conditionClose': //有条件平仓
            case 'splitPosition': //拆分仓位
            case 'adjustLever': //调整杠杆
            case 'addDeposit': //增加保证金
            case 'adjustForce': //调整强平价
            case 'setSL': //设置止损
            case 'editSL'://编辑止损
            case 'setTP'://设置获利
            case 'editTP': //编辑获利
            case 'editOrder'://编辑订单
                this.popUpDialog(option);
                break;
        }
    }

    popUpDialog(option){
        PopDialog.closeByDomID('order-edit');

        PopDialog.open(<FuturesEditOrder option={option} data={this.props.rows} isSimple={!FutTradeModel.loadSetting("isExpert")} />, "order-edit", true);
    }

    //防止冒泡被捕获无法触发弹出新页面
    preventEvent(e){
        e.stopPropagation();
        e.preventDefault();
    }
    render(){
        const {rows, tab, eventType} = this.props;
        const {menuMap} = this.state;

        const skin = FutTradeModel.getSkin();
        const keys = Object.keys(menuMap);
        // const len = keys.length;
        // var count = 0;
        const rowLen = rows.length;
        // const row = rows[0];
        const manyOptions = ['closePosition','mergePosition','cancelOrder']; //选中多个订单时，这几个选项可用，其他不可用
        return (
            <ContextMenu className={"futures-bg-"+skin} {...this.props} ref={(c)=>this.menuRef=c}>
                {keys.map((v, i)=>{
                    var data = menuMap[v];
                    var tp = typeof(data);
                    if (tp=='number'){
                        var isShow = data;
                        if (v.indexOf('placeholder')!=-1){
                            if (eventType!='click') return <li className="bd-b" key={i}></li>
                        }else{
                            if (eventType!='click' || (eventType=='click' && isShow)) return <li onMouseDown={(e)=>{if(isShow)this.selectMenu(e, v)}} key={i} className={isShow ? '' : 'disable'}>{Intl.lang("trade.contextMenu."+v)+(tab!=1 && rowLen>1 && manyOptions.indexOf(v)!=-1 ? "("+rowLen+")" : "")}</li>
                        }
                    }else if (tp=='object'){
                        if (data.href){
                            return <li key={i} onMouseDown={this.preventEvent.bind(this)}><a href={data.href} target={data.target}>{Intl.lang("trade.contextMenu."+v)}</a></li>
                        }
                    }
                })}
            </ContextMenu>
        )
    }
}
