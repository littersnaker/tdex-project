import React from 'react';
import PureComponent from "../core/PureComponent";
import Intl from "../intl";
import history from '../core/history';
import AuthModel from '../model/auth';
import PopDialog from "../utils/popDialog";
import {setStorage} from "../utils/util"
import Auth from '../model/auth'
import Net from '../net/net'

class SimulateMask  extends PureComponent{
    constructor(props) {

        super(props);
        this.state = {}
    }
    componentDidMount(){
        let {type} = this.props;
        if(type=="building"){
            //this.saveSimulateMoney();
        }
    }
    saveSimulateMoney(){
        var uInfo = AuthModel.getRegisterData();
        setStorage('simulateMoney_'+uInfo.Uid, 100, true);
    }
    jumpToPath(){
        if(this.props.isClose){
            PopDialog.close();
        }else if(this.props.url){
            history.replace(this.props.url);
            PopDialog.close();
        }
        if(this.props.onChange){
            this.props.onChange();
        }
    }
    closeConfirm(){
        if(this.props.closeMask){
            this.props.closeMask();
        }else{
            PopDialog.close();
        }
    }

    // vip3 券
    getUserItem(){
        const items = this.props.items;
        if(items){
            for(var i in items){
                if(items[i].Name=="vip3"){
                    return items[i];
                }
            }
        }
    }
    getUserClaim(){
        const item = this.getUserItem();
        if(item){
            Net.httpRequest("user/claim", {Name:item.Name}, (data)=>{
                if (data.Status == 0){
                    Auth.refreshUerInfo();
                    PopDialog.close();
                }
            }, this);
        }
    }
    render() {
        const { type, btnMsg, title, mode } = this.props;
        return (
            mode=="vip3" ?
            <div className="luck-draw-mask">
                <div className="vipVoucherPop">
                    <span className="iconfont icon-cancel" onClick={this.closeConfirm.bind(this)}></span>
                    <div className="voucher-header">{Intl.lang("activity.vipVoucher.popHead")}</div>
                    <div className="voucher-title">{Intl.lang("activity.vipVoucher.popTitle")}</div>
                    <div className="voucher-pop-bg"></div>
                    <div className="voucher-pop-btn" onClick={this.getUserClaim.bind(this)}>{Intl.lang("activity.buy_1")}</div>
                </div>
            </div>
                :
            <div className="mask mock-mask tc" id="simulate_panel">
                <div className={"mock-mask-conten "+Intl.getLang()}>
                    <i onClick={this.closeConfirm.bind(this)} className="iconfont icon-cancel"></i>
                    <div className={"mock-mask-img mock-mask-"+type}></div>
                    <p>{title}</p>
                    <div onClick={this.jumpToPath.bind(this)} className="mock-mask-btn">{btnMsg}</div>
                </div>
            </div>
        )
    }
}
export default SimulateMask;