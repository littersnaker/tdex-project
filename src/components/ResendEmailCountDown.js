import React from 'react';
import PureComponent from "../core/PureComponent";
import Intl from '../intl';
import Net from '../net/net';
import CountDownBtn from '../components/CountDownBtn';
import PopDialog from "../utils/popDialog";
import {Confirm} from '../components/Common';


export default class ResendSpan extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            mobileCodeSec: 0
        };
    }
    // 接收子组件返回总数
    changeParentCount(count) {
        this.setState({'mobileCodeSec': count})
    }
    handleClick(evt){
        evt = evt || window.event;
        evt.stopPropagation();

        this.resendEmail();
    }
    resendEmail(){
        let { dataId } = this.props;
        if(!dataId) return false;

        //console.log(dataId); return;

        Net.httpRequest("wallet/reconfirm", {Id:dataId}, (data)=>{
            if (data.Status == 0){
                this.setState({mobileCodeSec:120});
                this.openTips();
            }
        }, this);
    }
    openTips(){
        const conTxt = this.props.type==1 ? Intl.lang("Withdrawals.apply_txt") : Intl.lang("Transfer.apply_txt");
        PopDialog.open(<Confirm isNew={true} disCancel={true} title={Intl.lang("Withdrawals.sendEmail")} content={conTxt} />, "alert_panel");
    }
    render(){
        const { mobileCodeSec } = this.state, { dataId, text } = this.props;
        let txt = text ? text : Intl.lang("Withdrawals.resend");
        return (
            <CountDownBtn className="span" changeParentCount={this.changeParentCount.bind(this)} onClick={(e)=>this.handleClick(e)} count={mobileCodeSec} text={txt}/>
        )
    }
}