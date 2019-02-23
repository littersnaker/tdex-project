import React from 'react';

import {FutTradeFormExpert} from "./FuturesNewOrderExpert";
import {FutTradeFormSimple} from "./FuturesNewOrderSimple";
import FutTradeModel from "../model/fut-trade";
import Intl from "../intl";
import {CONST} from "../public/const";
import AuthModel from "../model/auth";
import Net from "../net/net";
import Notification from "../utils/notification";
import AccountModel from "../model/account";
import PureComponent from "../core/PureComponent";
import FutSettingMenu from "./FuturesSettingMenu"
import {FutOrderPreview, FutOrderWarning} from './FuturesOrderPreview';
import PopDialog from "../utils/popDialog";
import {Confirm} from './Common';

//下单
export default class FutNewOrder extends PureComponent{
    constructor(props) {
        super(props);

        this.preferenceKey = 'fno';
        this.state = {
            expanded: AuthModel.loadPreference(this.preferenceKey, true),
        }
    }

    toggle() {
        var expanded = !this.state.expanded;
        this.setState({expanded}, ()=>{
            if (this.state.expanded) this.props.onChange("refreshScroll", [this.preferenceKey]);
        });

        AuthModel.savePreference(this.preferenceKey, expanded);
    }
    checkValidFormData = (formData)=>{
        var product = FutTradeModel.getProductByID(formData.CID);
        if (product){
            var wallet = AccountModel.getCurrencyWallet(CONST.WALLET.TYPE.FUT, product.Currency);
            if (wallet) {
                var canUse = wallet.canUse;
                return FutTradeModel.checkFormData(formData, canUse);
            }
        }
        return {ok:false, error:[]};
    }
    submitOrder = (e, formData, callback)=>{
        const {ok, error} = this.checkValidFormData(formData);
        if (ok){
            var x = e.clientX;
            var y = e.clientY;

            var _submitOrder = (x, y)=>{
                var setting = FutTradeModel.setting;
                if (setting.isOneKeyTrade){ //一键交易无弹窗
                    this.openOrder(formData, callback);
                }else{ //订单预览
                    PopDialog.open(<FutOrderPreview product={this.props.product} data={formData} action="open" x={x} y={y} onConfirm={(confirm)=>{
                        if (confirm){
                            this.openOrder(formData, callback);
                        }else{
                            if (callback)callback(false);
                        }
                    }} />, "order-preview", true, FutTradeModel.loadSetting("isExpert") ? false : null);
                }
            }

            if (formData.Price > 0){
                if (this.props.isExpert){
                    if (!FutTradeModel.checkDelegateAvgPrice(formData.Price, this.props.product.price)){
                        PopDialog.open(<FutOrderWarning msg="trade.delegate.avgLimit" confirm="trade.delegate.confirm" cancel="trade.delegate.cancel" onConfirm={(e, result)=>{
                            if (result){
                                _submitOrder(x, y);
                            }else{
                                if (callback)callback(false);
                            }
                        }} />, "order-warning", true);
                        return;
                    }
                }else{
                    if (!FutTradeModel.checkDelegateAvgPrice(formData.Price, this.props.product.price)){
                        PopDialog.open(<Confirm skin="dialog-bg-blue" isExpert={true} title={Intl.lang("Recharge.note")} content={Intl.lang("trade.delegate.avgLimit")}
                                                yestxt={Intl.lang("trade.confirm.newOrder")} notxt={Intl.lang("trade.confirm.cancelOrder")} callback={()=>{
                            _submitOrder(x, y);
                        }} cancel={()=>{
                            if (callback) callback(false);
                        }}/>, "alert_panel");
                        return;
                    }
                }
            }
            _submitOrder(x, y);
        }else{
            error.forEach((v, i)=>{
                Notification.error(v);
            });
            if (callback)callback(false);
        }
    }
    openOrder(formData, callback){
        Net.httpRequest("futures/open", formData, (data)=>{
            if (data.Status == 0){
                // FutTradeModel.loadTradeData();
                if (this.props.showFloatToolbar) this.props.showFloatToolbar()
                Notification.success(Intl.lang('trade.open.ok'));
            }
            if (callback) callback(data.Status == 0);
        }, this);
    }
    closeNewOpen(event){
        event.preventDefault();
        this.props.onChange("close", [this.preferenceKey]);
    }
    render(){
        const {product, open, tradingType, className, isExpert, ind} = this.props, { expanded} = this.state;
        const cls = className||"";

        return (
            <div className={cls}>
                {tradingType ? null : open ?
                    <div className="dialog-head tc lh-25">
                        <h3 className="ft-dialog-head fem875 tb"><span>{Intl.lang("trade.settingMenu.depth")}</span></h3>
                        <i className="iconfont icon-close transit fs14" onClick={(e)=>{this.closeNewOpen(e)}}></i>
                    </div>
                    :
                    <div className="header-title flex-box flex-jc ft-new-deal mt-10"><span className="handle"></span>
                        <h5 className="fs11">{Intl.lang('trade.new_order')}</h5>
                        <div>
                            {product && <FutSettingMenu name="newOrder" code={product ? product.Code : ""} isExpert={isExpert} side={!expanded && ind==3 ? 'top' : 'bottom'} />}
                            <i className={expanded ? "iconfont fs12 icon-hide" : "iconfont fs12 icon-show"} onClick={()=>this.toggle()}></i>
                        </div>
                    </div>
                }
                {expanded && (isExpert ? <FutTradeFormExpert product={product} onSubmit={this.submitOrder} tradingType={tradingType}/> : <FutTradeFormSimple product={product} onSubmit={this.submitOrder} tradingType={tradingType}/>)}
            </div>
        )
    }
}
