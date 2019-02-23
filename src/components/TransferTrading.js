import React from 'react';
import PureComponent from "../core/PureComponent";
import Net from '../net/net';
import Intl from '../intl';
import GlobalStore from '../stores';
import AccountModel from "../model/account";
import { CONST } from "../public/const";

import Verify from '../containers/Verify'
import PopDialog from "../utils/popDialog"
import {toast} from "../utils/common"



export default class TransferTrading extends PureComponent {
    constructor(props) {
        super(props);

        this.leftTimer = null;
        this.state = {
            Expired: false,
            hasBind: false,

            lessMoney: false
        };
    }
    componentWillUnmount(){
        this.clearTimer();
        super.componentWillUnmount();
    }
    componentWillMount(){
        if(this.state.hasBind) return true;

        let uInfo = GlobalStore.getUserInfo();
        if(uInfo.GgAuth || uInfo.Mobile){
            this.setState({hasBind: true});
        }
        this.compareWallet();
    }
    compareWallet() {
        const info = this.props.order;
        const walletMap = AccountModel.getWalletMap();
        const wMap = walletMap[CONST.WALLET.TYPE.SPOT];
        const money = wMap[info.Currency];
        if(info.Amount > money){
            this.setState({lessMoney: true});
        }
    }
    componentDidMount(){
        this.compareTime();
    }
    compareTime(){
        const { order } = this.props;

        let cTime = order.CreateTime.replace(/-/g,"/");
        let stTime =  Date.parse(new Date(cTime))/1000;
        let nowTime = parseInt(new Date().getTime()/1000);
        let endTime = stTime + 30 * 60;         // 30 min

        let leftTime = endTime - nowTime;
        if(leftTime<1){
            this.orderExpired();
            return false;
        }

        this.leftTimer = setInterval(()=>{
            this.countDown(leftTime, this);
            leftTime --;
        },1000);
        this.countDown(leftTime, this);
    }
    countDown(leftTime, self){
        var checkTime = function (i){
            if (i < 10) {
                i = "0" + i;
            }
            return i;
        };
        if (leftTime<1){
            self.orderExpired(true);
            self.clearTimer();
            return;
        }
        var mm = parseInt(leftTime / 60 % 60, 10);    //计算剩余的分钟数
        var ss = parseInt(leftTime % 60, 10);         //计算剩余的秒数

        mm = checkTime(mm);
        ss = checkTime(ss);

        self.refs["limit-time"].innerHTML = Intl.lang("Transfer.expire_time",mm,ss);
    }
    orderExpired(isClose){
        this.refs["limit-time"].innerHTML = "";
        this.setState({Expired:true});
        if(isClose){
            setTimeout(()=>{
                this.props.onChange();
                this.closeConfirm();
            },1000);
        }
    }
    clearTimer(){
        clearInterval(this.leftTimer);
        this.leftTimer = null;
    }
    popVerify(event){
        event.stopPropagation();
        event.preventDefault();

        PopDialog.open(<Verify path="disTips" verify="normal" onChange={(codeType)=>this.popCallback(codeType)} datafor="transfer"/>, 'simple_lang');
    }
    popCallback(codeType){
        if(codeType=="close"){
            PopDialog.close("pn_simple_lang");
            return;
        }

        this.acceptTransfer(codeType);
    }
    acceptTransfer(params){
        params.Id = this.props.order.Id;

        Net.httpRequest("wallet/transferAccept", params, (data)=>{
            if (data.Status == 0){
                if(this.props.onChange) this.props.onChange();

                PopDialog.closeAll();
                toast(Intl.lang("Transfer.receive_success"));
            }
        }, this);
    }
    closeConfirm(){
        PopDialog.close();
    }

    render(){
        const { order } = this.props, { Expired, hasBind, lessMoney } = this.state;
        let payTxt = order.Amount+" "+order.fromCode, getTxt = order.TargetAmount+" TD";
        return (
            <div className="normal-head" id="receive_transfer">
                <div className="transfer-confirm-con">
                    <div className="transfer-confirm-header">
                        <div className="w-60">&nbsp;</div>
                        <div>{Intl.lang("Transfer.status.confirm")}</div>
                        <div onClick={this.closeConfirm.bind(this)} className="iconfont icon-close transit"></div>
                    </div>
                    <div className="pd-10 tc blue1"><span ref="limit-time"></span></div>

                    <ul className="transfer-confirm-header transfer-confirm-content">
                        <li>{Intl.lang("Recharge.orderNum")}{Intl.lang("common.symbol.colon")}</li>
                        <li>{order.Id}</li>
                    </ul>

                    <ul className="transfer-confirm-header transfer-confirm-content">
                        <li>{Intl.lang("Transfer.order.targetUid")}{Intl.lang("common.symbol.colon")}</li>
                        <li>{order.TargetUid}</li>
                    </ul>
                    <ul className="transfer-confirm-header transfer-confirm-content">
                        <li>{Intl.lang("Transfer.order.targetEmail")}{Intl.lang("common.symbol.colon")}</li>
                        <li>{order.TargetEmail}</li>
                    </ul>
                    <ul className="transfer-confirm-header transfer-confirm-content">
                        <li>{Intl.lang("Transfer.order.pay_num")}{Intl.lang("common.symbol.colon")}</li>
                        <li>{payTxt}</li>
                    </ul>
                    <ul className="transfer-confirm-header transfer-confirm-content">
                        <li>{Intl.lang("Transfer.order.get_num")}{Intl.lang("common.symbol.colon")}</li>
                        <li>{getTxt}</li>
                    </ul>
                    {Expired ?
                        <div className="transfer-confirm-btn btnDis">{Intl.lang("Transfer.order.expired")}</div>
                        :
                        hasBind?
                            lessMoney?
                                <div className="transfer-confirm-btn btnDis">{Intl.lang("server.status.1010")}{" ( "+order.fromCode+" ) "}</div>
                                :
                                <div className="transfer-confirm-btn" onClick={this.popVerify.bind(this)}>{Intl.lang("Transfer.status.confirm")}</div>
                            :
                            <div className="transfer-confirm-btn btnDis">{Intl.lang("Transfer.status.confirm")}</div>
                    }
                    <div className="transfer-confirm-tips mt-20">
                        <span>{Intl.lang("Recharge.tips")}{Intl.lang("common.symbol.colon")}</span>
                        <span className="lh-22">{Intl.lang("Transfer.order.tips", order.TargetEmail, getTxt, payTxt, "30")}</span>
                    </div>
                    {!hasBind &&<div className="tc mt-20">
                        <a href="/personal/securitysetting" className="green4 fs14 cursor pdl-20">{Intl.lang("Withdrawals.119")}</a>
                    </div>}
                </div>
            </div>
        )
    }

}