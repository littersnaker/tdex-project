import Intl from '../intl';
import React, {PropTypes} from 'react';

import PureComponent from "../core/PureComponent"
import AccountModel from "../model/account";
import TradeMgr from "../model/trade-mgr";
import Decimal from "../utils/decimal";
import {CONST} from '../public/const';
import Event from '../core/event';
import {getCurrencySymbol} from "../utils/common"
import {DropDown,Contrainer} from './DropDown';

class UserWallet extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            code: TradeMgr.getCurrCode(),
            walletMap: AccountModel.getWalletInfo(),
            walletTotal: AccountModel.getWalletTotal()
        }
    }

    componentWillMount(){
        Event.addListener(Event.EventName.PRODUCT_SELECT, this.onSelectProduct.bind(this), this);
        Event.addListener(Event.EventName.WALLET_UPDATE, this.onUpdateWallet.bind(this), this);
        Event.addListener(Event.EventName.WALLET_TOTAL_UPDATE, this.onUpdateWallet.bind(this), this);
        Event.addListener(Event.EventName.PRICE_UPDATE, this.onUpdateWalletTotal.bind(this), this);
    }

    onUpdateWallet(){
        this.setState({walletMap: AccountModel.getWalletInfo(), walletTotal: AccountModel.getWalletTotal()});
    }

    onUpdateWalletTotal(){
        this.setState({walletTotal: AccountModel.getWalletTotal()});
    }

    onSelectProduct(code){
        if (this.state.code!=code){
            this.setState({code: code});
        }
    }

    redirectPay(currency){
        AccountModel.redirectPay(parseInt(currency));
    }

    setMenuRef(c){
        this.menuRef = c;
    }

    render() {
        const {isExpert, uInfo, loginTip} = this.props;
        const {walletMap, walletTotal, code} = this.state;

        const olist = AccountModel.walletCurrencys;
        var list = [];
        var selectaa = 0, selectcs = {};
        /*
        if (walletMap){
            // var walletInfo = walletMap[CONST.CURRENCY.CNY];
            // if (walletInfo){
            //     cnyta = walletInfo.TA;
            //     cnyna = walletInfo.NA;
            // }

            olist.forEach((v, i)=>{
                var info = walletMap[v];
                var product = TradeMgr.getProduct(code);
                if (!product) return;
                var subcode = product.fromCode;
                if (info){
                    if (v==CONST.CURRENCY[subcode]){
                        selectaa = info.AA;
                        selectcs = getCurrencySymbol(v);
                    }
                }else{
                    info = {Type:v, TA:0, AA:0};
                }
                for (var key in CONST.CURRENCY){
                    if (CONST.CURRENCY[key] == info.Type){
                        info.TypeName = key;
                        break;
                    }
                }
                list.push(info);
            });

        }
        */
        var toCode, tocs, toWalletTotal;
        if (code){
            var product = TradeMgr.getProduct(code);
            if (product){
                toCode = product.toCode
                var toCurrency = CONST.CURRENCY[toCode];
                if (toCurrency){
                    tocs = getCurrencySymbol(toCurrency);
                    toWalletTotal = walletTotal[toCurrency];
                }
            }
        }

        var self = this;
        return (
            <div className="drop-menu drop-menu-right assets-box">
                <DropDown trigger="click" menuRef={()=>this.menuRef} ref={(c)=>this.dropDownRef=c}>
                {!isExpert && <span>{Intl.lang("tradeHistory.2_91")+ (selectcs.sb||'') + Decimal.formatAmount(selectaa, 2)} &nbsp;<i className="iconfont icon-xiala"></i></span>}
                {isExpert && <span>{loginTip} &nbsp;<i className="iconfont icon-xiala"></i></span>}
                </DropDown>
                <Contrainer ref={this.setMenuRef.bind(this)} pnRef={()=>this.dropDownRef}>
                    <ul className="drop-menu-children drop-menu-children-box drop-item-style2">
                        <li className="assets-info f-clear">
                            <div className="fl">
                                <i className="iconfont icon-assets assets-icon"></i>
                                <div className="assets-div">
                                    <h5>{Intl.lang("UserWallet.100")}</h5>
                                    <b>{tocs ? tocs.sb + Decimal.formatAmount(toWalletTotal.AA, 4) : '--'}</b>
                                </div>
                            </div>
                            <div className="fl">
                                <i className="iconfont icon-net-assets assets-icon"></i>
                                <div className="assets-div">
                                    <h5>{Intl.lang("UserWallet.101")}</h5>
                                    <b>{tocs ? tocs.sb + Decimal.formatAmount(toWalletTotal.TA, 4): '--'}</b>
                                </div>
                            </div>
                        </li>
                        {/*
                        {list.map((info, i)=>{
                            var name = info.TypeName;
                            var cs = getCurrencySymbol(info.Type);
                            return <li className="drop-menu-item f-clear" key={"uw"+i}>
                                <i className={"iconfont icon-"+name}></i>
                                <div><h5>{Intl.lang("Asset.114")+name}</h5><b>{cs.sb+Decimal.formatAmount(info.AA||0, 4)}</b></div>
                                <div><h5>{Intl.lang("Asset.100")}</h5><b>{cs.sb+Decimal.formatAmount(info.UA||0, 4)}</b></div>
                                <div>
                                    <button className="btn trade-rech-btn" onClick={this.redirectPay.bind(self, info.Type)}>{Intl.lang("account.1_2")}</button>
                                </div>
                            </li>
                        })}
                         */}
                    </ul>
                </Contrainer>
            </div>
        );
    }
}

export default UserWallet;