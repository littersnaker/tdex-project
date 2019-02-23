import React from 'react';
import PureComponent from "../core/PureComponent";
//import Net from '../net/net';
import Intl from '../intl';
//import GlobalStore from '../stores';
//import AccountModel from "../model/account";
//import { CONST } from "../public/const";

//import Verify from '../containers/Verify'
import PopDialog from "../utils/popDialog"
//import {toast} from "../utils/common"
import {getCurrencySymbol} from "../utils/common";

import TransferTrading from './TransferTrading'
import System from '../model/system';


class TransferConfirm extends PureComponent {
    compareTime(cTime){
        let stTime =  Date.parse(new Date(cTime))/1000;
        let nowTime = parseInt(System.getServerTimeStamp());
        let endTime = stTime + 30 * 60;         // 30 min

        let leftTime = endTime - nowTime;
        if(leftTime<1){
            return true;
        }
        return false;
    }
    expiredTime(item){
        let Expired = true;
        if(item.Status==0 && item.Action==8006){
            let cTime = item.CreateTime.replace(/-/g,"/");
            Expired = this.compareTime(cTime);
        }
        return Expired;
    }
    popVerify(item){
        let fromCode = getCurrencySymbol(item.Currency).sn, toCode = getCurrencySymbol(item.Target).sn, Order=item;
        Order.fromCode = fromCode;
        Order.toCode = toCode;
        PopDialog.open(<TransferTrading order={item} onChange={this.props.onChange.bind(this)}/>, 'receive_transfer');
    }

    render(){
        const {order} = this.props;

        let Expired = this.expiredTime(order);

        return (Expired ?
                <span>{Intl.lang({key:"TRANSFER.STATUS."+order.Status, def:"TRANSFER.STATUS.3"})}</span>
                :
                <span className="yellow cursor" onClick={()=>this.popVerify(order)}>{Intl.lang("Transfer.status.confirm")}</span>
        )
    }
}
export default TransferConfirm;
