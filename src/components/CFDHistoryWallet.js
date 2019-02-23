import React from 'react';
import PureComponent from '../core/PureComponent';

import Event from "../core/event";
import CfdTradeModel from '../model/cfd-trade';
import Intl from '../intl';
import Product from "../model/product";
import AccountModel from "../model/account";
import {CONST} from "../public/const";
import AuthModel from "../model/auth";
import Decimal from "../utils/decimal";
import {DropDown,Contrainer} from './DropDown';
import PopDialog from "../utils/popDialog";
import WalletTransfer from "../containers/WalletTransfer";

export default class CFDHistoryWallet extends PureComponent{
    constructor(props){
        super(props);

        this.state = {
            currencyMap: {},
            currencys: [],
            currency: CfdTradeModel.getCurrency(),
            walletMap:{}
        }
    }

    componentWillMount() {
        Event.addListener(Event.EventName.PRODUCT_UPDATE, this.onProductUpdate.bind(this), this);
        Event.addListener(Event.EventName.WALLET_UPDATE, this.onWalletUpdate.bind(this), this);
        Event.addListener(Event.EventName.WALLET_TOTAL_UPDATE, this.onWalletUpdate.bind(this), this);

        this.onProductUpdate();
        this.onWalletUpdate();
    }

    onProductUpdate(){
        var map = CfdTradeModel.getCurrencyMap();
        this.setState({currencyMap:map, currencys: Object.keys(map)});
    }

    selectCurrency(currency){
        if (this.state.currency!=currency){
            CfdTradeModel.setCurrency(currency);

            this.setState({currency});
        }
        this.menuRef.hide();
    }

    onWalletUpdate(){
        this.setState({walletMap: AccountModel.getWalletInfo(CONST.WALLET.TYPE.CFD)});
    }

    setMenuRef(c){
        this.menuRef = c;
    }
    openTransfer(){
        if (!AuthModel.checkAuthAndRedirect(window.location.pathname)) return;

        PopDialog.open(<WalletTransfer isPop={true} toType={CONST.WALLET.TYPE.CFD} />, "pop-transfer")
    }
    render(){
        const {style} = this.props;
        const {currency, currencyMap, currencys, walletMap} = this.state;

        const sb = (currencyMap[currency]||'--');

        const isLogined = AuthModel.checkUserAuth();
        var ta = '--', na = '--', aa = '--', yk = '--';
        if (isLogined){
            ta = 0, na = 0, aa = 0, yk = 0;
            if (walletMap && walletMap[currency]){
                var walletInfo = walletMap[currency];
                var coinInfo = Product.getCoinInfo(currency);
                var fixed = coinInfo ? coinInfo.ShowDigits:4;
                ta = Decimal.addCommas(Decimal.format(walletInfo.gross, fixed));
                na = Decimal.addCommas(Decimal.format(walletInfo.net, fixed));
                aa = Decimal.addCommas(Decimal.format(walletInfo.canUse, fixed));
                yk = Decimal.addCommas(Decimal.format(walletInfo.PL||0, fixed));
                // console.log("DepositStatBar="+aa+","+String(isSimple));
            }
        }

        return <div className="trading-exchange-product" style={style}>
            <div className="select-the-currency">
                <DropDown trigger="click" menuRef={()=>this.menuRef} ref={(c)=>this.dropDownRef=c}>
                    <p className={"select-the-currency-title"+ " "+sb}><span></span>{sb} <i className="iconfont icon-shouqi"></i></p>
                </DropDown>
                <Contrainer ref={this.setMenuRef.bind(this)} pnRef={()=>this.dropDownRef}>
                <ul className="select-the-currency-conten">
                    {currencys && currencys.map((v, i)=>{
                        return <li key={'c'+v} onClick={this.selectCurrency.bind(this, v)}>{currencyMap[v]}</li>
                    })}
                </ul>
                </Contrainer>
            </div>
            <ul className="list-of-assets">
                <li>{Intl.lang("futures.quantity")+Intl.lang("common.symbol.colon")}<span>{ta+' '+sb}</span></li>
                <li>{Intl.lang("UserWallet.101")+Intl.lang("common.symbol.colon")}<span>{na+' '+sb}</span></li>
                <li>{Intl.lang("cfd.canUse")+Intl.lang("common.symbol.colon")}<span>{aa+' '+sb}</span></li>
                <li>{Intl.lang("cfd.pl")+Intl.lang("common.symbol.colon")}<span>{yk+' '+sb}</span></li>
                <li><a className="link point" onClick={()=>this.openTransfer()}>{Intl.lang("WalletTransfer.theme")}</a></li>
            </ul>
        </div>
    }
}
