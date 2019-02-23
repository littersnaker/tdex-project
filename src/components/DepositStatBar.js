import React from 'react';
//统计保证金等信息
import PureComponent from "../core/PureComponent";
import FutTradeModel from "../model/fut-trade";
import Decimal from "../utils/decimal";
import {CONST} from "../public/const";
import {IS_TRADE_V2} from "../config";
import {getCurrencySymbol} from "../utils/common";
import AuthModel from "../model/auth";
import Event from "../core/event";
import Intl from "../intl";
import AccountModel from "../model/account";
import Product from "../model/product";
import PopDialog from "../utils/popDialog"

import WalletTransfer from "../containers/WalletTransfer"
import FutSettingMenu from './FuturesSettingMenu';
import {IS_ENGINE_TRADING} from "../config";

export default class DepositStatBar extends PureComponent{
    constructor(props) {
        super(props);

        //是否桌面版
        this.isDesktop = process.env.VER_ENV=='desktop';
        //this.isMobile = isMobile();

        this.state = {
            assetBox: false,
            robotActivityOpen: true, //挖矿活动是否打开
        };
    }
    componentWillMount() {
        Event.addListener(Event.EventName.WALLET_UPDATE, this.onWalletUpdate.bind(this), this);
        Event.addListener(Event.EventName.WALLET_TOTAL_UPDATE, this.onWalletUpdate.bind(this), this);
    }

    onWalletUpdate(){
        this.forceUpdate();
    }
    // popSetting(){
    //     PopDialog.open(<FuturesSetting code={this.props.code} />, "futures-setting");
    // }

    openTransfer(){
        PopDialog.open(<WalletTransfer isPop={true} toType={CONST.WALLET.TYPE.FUT} />, "pop-transfer")
    }

    toggleAsset(){
        let { assetBox } = this.state;
        this.setState({assetBox:!assetBox});
    }
    hideMobileLog(){
        this.props.onChange();
    }
    render(){
        const {code, showIcon, hideAssetIcon, isSimple} = this.props, { assetBox,robotActivityOpen } = this.state;
        // console.log("DepositStatBar,"+code+","+String(isSimple));
        if (code){
            const products = FutTradeModel.getProduct(code);
            if (products){
                const product = products[0];
                const currency = product.Currency;
                const sb = getCurrencySymbol(currency);

                const walletMap = AccountModel.getWalletInfo(CONST.WALLET.TYPE.FUT);
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
                return !isSimple ? (<div className="ff-history-nav-r fr lh-25">
                    {!hideAssetIcon&&<span className="cursorLight asset-icon" onClick={()=>this.toggleAsset()}>{Intl.lang("futures.accountAsset")}</span>}

                    <div className={"sm-asset-box "+(assetBox?"asShow":"asHide")}>
                        {/*{!robotActivityOpen && <span>{Intl.lang("tradeHistory.2_69") + ': '}Taker (<span className="trade-order-head-unline">0.10%</span> 0.00%)<span className="trade-order-head-span"></span>Maker (<span className="trade-order-head-unline">0.10%</span> 0.00%)</span>}*/}
                        <span>{Intl.lang("futures.quantity") + ': '+ sb.sb + ta}</span><span>{Intl.lang("futures.asset") + ': '+ sb.sb + na}</span><span>{Intl.lang("futures.can_use") + ': '+ sb.sb + aa}</span><span>{Intl.lang("futures.float") + ': '+ sb.sb + yk}</span>{isLogined && <span className="cursorLight" onClick={()=>this.openTransfer()}>{Intl.lang("WalletTransfer.theme")}</span>}
                    </div>
                    {/*<span onClick={()=>this.popSetting()}><i className="iconfont icon-system point"></i></span>*/}
                    {!IS_TRADE_V2 && <span>{product && <FutSettingMenu code={this.props.code} name="history" />}</span>}

                    {showIcon &&<p className="iconfont icon-down mb-icon-down" onClick={()=>this.hideMobileLog()}></p>}
                </div>) :
                    (
                        <div className="flex-sb mt-10"><span>{Intl.lang("futures.can_use") + ': '}</span><span>{aa+" "+sb.sn}</span></div>
                    )
            }
        }
        return <div className="ff-history-nav-r fr lh-25"></div>
    }
}
