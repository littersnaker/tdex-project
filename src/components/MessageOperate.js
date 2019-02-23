import React from 'react';
import PureComponent from "../core/PureComponent";
import Net from '../net/net';
import Event from "../core/event";
import Intl from '../intl';
import history from '../core/history';

import {getCurrencySymbol} from "../utils/common";
import PopDialog from "../utils/popDialog"
import {toast} from "../utils/common"

import TransferTrading from './TransferTrading'

export default {
    orderId: null,

    readOne(v, callback, source){
        if(v.Id==this.orderId){
            return false;
        }else{
            this.orderId=v.Id;
            setTimeout(()=>{this.orderId=null;}, 1000);
        }

        if(v.New){
            Net.httpRequest("mailbox/ReadOne", {Id:v.Id}, (data)=>{
                if(callback) callback(data);
                Event.dispatch(Event.EventName.MESSAGE_REMARK, {Id:v.Id, Src: source});
            }, this);
        }

        this.doSomething(v);
    },

    doSomething(v){
        if(v.Type==1){                              // 1 抽奖; 2 TD转账
            history.replace('/activities/luckDraw');
        }else if(v.Type==2 && v.Params){
            let item = JSON.parse(v.Params);
            this.loadTransferOrder(item);
        }
    },
    loadTransferOrder(item){
        if(item.OrderId){
            Net.httpRequest("wallet/orders", {Type:8, Id:item.OrderId}, (data)=>{
                if (data.Status == 0){
                    let info = data.Data.List[0];

                    if(info.Status==0){         // 0 未处理, 1 已完成, 2 已取消, 3 处理中, 4 确认中
                        this.popVerify(info);
                    }else if(info.Status==1){
                        toast(Intl.lang("Transfer.order.complete"), true);
                    }else{
                        toast(Intl.lang("Transfer.order.expired"), true);
                    }
                }
            }, this);
        }
    },
    popVerify(item){
        let fromCode = getCurrencySymbol(item.Currency).sn, toCode = getCurrencySymbol(item.Target).sn, Order=item;
        Order.fromCode = fromCode;
        Order.toCode = toCode;
        PopDialog.open(<TransferTrading order={item} onChange={()=>{this.refreshListen()}}/>, 'receive_transfer');
    },
    refreshListen(){
        Event.dispatch(Event.EventName.MSG_TRANSFER_OVER, {});
    }


}