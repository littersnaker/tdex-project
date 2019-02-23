import React from 'react';
import PureComponent from "../core/PureComponent";
import PopDialog from "../utils/popDialog";
import ContextMenu from './ContextMenu';

import Intl from "../intl";
import {CONST} from "../public/const";

export default class CFDContextMenu extends PureComponent{
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
        }else if(tab == 2){
            return this.getTab2Menu(rows);
        }else if(tab == 4){
            return this.getTab4Menu();
        }
    }
    getTab1Menu(rows){
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

        return menu;
    }
    getTab2Menu(rows){
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

        // var isExpert = FutTradeModel.loadSetting("isExpert");
        // if (!isExpert) menu = {"cancelOrder": 1};

        return menu;
    }
    getTab4Menu(){
        return {
            "positionLog": {href:"/history?t=3", target:"_blank"}
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
        // console.log("selectMenu");
        evt.stopPropagation();
        evt.preventDefault();

        if (this.menuRef){
            this.menuRef.close();
        }

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
                pn.mergePosition(this.props.rows, this.hasTS, evt);
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
                pn.selectMenuOption(option, this.props.rows)
                break;
        }
    }

    //防止冒泡被捕获无法触发弹出新页面
    preventEvent(e){
        e.stopPropagation();
        e.preventDefault();
    }
    render(){
        const {rows, tab, eventType} = this.props;
        const {menuMap} = this.state;

        const keys = Object.keys(menuMap);
        // const len = keys.length;
        // var count = 0;
        const rowLen = rows.length;
        // const row = rows[0];
        const manyOptions = ['closePosition','mergePosition','cancelOrder']; //选中多个订单时，这几个选项可用，其他不可用
        return (
            <ContextMenu className="futures-bg-primary" {...this.props} ref={(c)=>this.menuRef=c}>
                {keys.map((v, i)=>{
                    var data = menuMap[v];
                    var tp = typeof(data);
                    if (tp=='number'){
                        var isShow = data;
                        if (v.indexOf('placeholder')!=-1){
                            if (eventType!='click') return <li className="bd-b" key={i}></li>
                        }else{
                            if (eventType!='click' || (eventType=='click' && isShow)) return <li onMouseUp={(e)=>{if(isShow)this.selectMenu(e, v)}} key={i} className={isShow ? '' : 'disable'}>{Intl.lang("trade.contextMenu."+v)+(tab!=1 && rowLen>1 && manyOptions.indexOf(v)!=-1 ? "("+rowLen+")" : "")}</li>
                        }
                    }else if (tp=='object'){
                        if (data.href){
                            return <li key={i} onMouseUp={this.preventEvent.bind(this)}><a href={data.href} target={data.target}>{Intl.lang("trade.contextMenu."+v)}</a></li>
                        }
                    }
                })}
            </ContextMenu>
        )
    }
}
