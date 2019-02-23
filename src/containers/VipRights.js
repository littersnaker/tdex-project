import React from 'react';
import PureComponent from '../core/PureComponent';
import {Link} from 'react-router';
import Intl from '../intl';
import Net from "../net/net";
import ProductModel from "../model/product";
import Decimal from '../utils/decimal';
import {CONST} from "../public/const";
import Event from '../core/event';
import AccountModel from "../model/account";
import AssetMenu from "../components/AssetMenu";

class VipRights extends PureComponent {
    constructor(props) {
        super(props);

        this.vipMap = [];
        this.state = {
            openPay: false,
            vipMap: [],
            vipData: {},
            tdCounts: 0
        }
    }
    getSubNav(){
        return [
            {pathLink: '/personal',pathIcon: 'icon-personal', pathName: Intl.lang("NavBar.104")},
            {pathLink: '/personal/viprights',pathIcon: 'icon-vip', pathName: Intl.lang('Personal.asset.grade')},
            {pathLink: '/personal/securitysetting',pathIcon: 'icon-SecuritySettings', pathName: Intl.lang('Personal.SecuritySetting')},
            {pathLink: '/api',pathIcon: 'icon-api-link', pathName: Intl.lang('personal.api')},
            {pathLink: '/invite',pathIcon: 'icon-gifts', pathName: Intl.lang('new.home.header.4')},
        ];
    }
    componentWillUnmount(){
        super.componentWillUnmount();
    }
    componentWillMount(){
        this.getVipMap();
        Event.addListener(Event.EventName.WALLET_UPDATE, this.onUpdateWallet.bind(this), this);
    }
    componentDidMount(){
        this.onUpdateWallet();
    }
    onUpdateWallet(){
        var spotWallet = AccountModel.getWalletInfo(CONST.WALLET.TYPE.SPOT);
        let tdWallet = null;
        if(spotWallet){
            tdWallet = spotWallet[11];
            if(tdWallet)
            this.setState({tdCounts:tdWallet.canUse});
        }
    }
    getVipMap(){
        ProductModel.loadProductVip((data)=>{
            this.vipMap = data;
            //this.setState({vipMap:this.vipMap})

            this.getUserVipDetail();
        },this);
    }
    getUserVipDetail(){
        Net.httpRequest("user/vip", null, data =>{
            if (data.Status == 0){
                this.makeVipInfo(data.Data);
            }
        }, this);
    }
    getOffer(vip){        // 1-(等级费率/0.08)
        if(vip==0) return "0.08%";
        let vipInfo = this.vipMap[vip], Offer = "--";

        if(vipInfo){
            //Offer = Decimal.accSubtr(1, Decimal.accDiv(vipInfo.Futures.Tdfeerate*100, 0.08, 4), 3)*100;

            Offer = vipInfo.Futures.Tdfeerate*10;
        }
        return Offer;
    }
    makeVipInfo(data){
        if(data && this.vipMap.length) {
            let curVip = parseInt(data.Vip), nextVip=curVip+1, nextVipInfo = this.vipMap[nextVip];

            let info=data;
            let vipInfo = this.vipMap[curVip];
            if (curVip < 6) {
                const { tdCounts } = this.state;
                //info.btcNum = Decimal.accAdd(data.Futuresbtc, data.Spotbtc, 4);
                //let leftBTC = Decimal.accSubtr(nextVipInfo.Min, info.btcNum, 4);
                let leftTD = Decimal.accSubtr(nextVipInfo.Mintd, tdCounts, 2);
                //info.leftBTC = leftBTC > 0 ? leftBTC : 0;
                info.leftTD = leftTD > 0 ? leftTD : 0;

                info.nextVip = curVip + 1;
                info.offer = vipInfo.Futures.Tdfeerate*100;
                //info.tdOffer = this.getOffer(curVip);
            }else{
                //info.btcNum = 0;
                //info.leftBTC = 0;
                info.offer = vipInfo.Futures.Tdfeerate*100;
                //info.tdOffer = this.getOffer(curVip);
            }

            this.setState({vipData:info, openPay:data.Offset});
        }
    }
    changePayOffer(){
        let { openPay } = this.state;
        Net.httpRequest("user/offset", {Open:!openPay}, data =>{
            if (data.Status == 0){
                this.setState({openPay:!openPay});
            }
        }, this, 'put');
    }
    getInitRate(){
        const { vipData } = this.state;
        let Vip = vipData.Vip,  info = {futEatBtcFee:"0.08%", pendBtcFee:"0.0%", spotBtcEat:"0.1%", spotBtcPend:"0.1%"};

        if(vipData.hasOwnProperty("Vip")){
            let futRate = this.vipMap[Vip].Futures;
            let spotsRate = this.vipMap[Vip].Spots;

            info.futEatBtcFee = Decimal.toPercent(futRate.Takerfee, 2);
            info.pendBtcFee = Decimal.toPercent(futRate.Makerfee, 2);

            info.futEatTdFee = Decimal.accMul(futRate.Tdfeerate, 0.08);
            info.pendTdFee = Decimal.toPercent(futRate.Makerfee, 2);

            info.spotBtcEat = Decimal.toPercent(spotsRate.Takerfee, 2);
            info.spotBtcPend = Decimal.toPercent(spotsRate.Takerfee, 2);

            info.spotTdEat = Decimal.toPercent(spotsRate.Tdfeerate, 2);
            info.spotTdPend = Decimal.toPercent(spotsRate.Tdfeerate, 2);
        }
        return info;
    }
    render(){
        const { openPay, vipData, tdCounts } = this.state;

        const initRate = this.getInitRate(), lang = Intl.getLang();
        let timer = "--", vipLevel;
        let vipFeeRate = "--";
        if(vipData.hasOwnProperty("Vip")){
            vipLevel = vipData.Vip;
            timer = vipData.UpdateTime.split(' ')[0];

            if(vipLevel==0){
                vipFeeRate = Intl.lang("Vip.table.unFee")
            }else{
                let vipMapData = this.vipMap[vipLevel]
                if(lang=="zh-cn"){
                    vipFeeRate = Intl.lang("Vip.table.fee",vipMapData.Futures.Tdfeerate*10);
                }else{
                    vipFeeRate = Decimal.toPercent(Decimal.accSubtr(1, vipMapData.Futures.Tdfeerate),0);
                }
            }
        }

        const path = this.getSubNav();



        return(
            <div className="inside-page-web">
                <div className="inside-web-part Vip-rights-section">
                    <AssetMenu path={path} />
                    <div className="Vip-rights-detail mt-30">
                        <div className="tc">
                            <span className="vipIcon">{vipData.Vip==0?Intl.lang("Vip.grade.normal"):"VIP"+vipData.Vip}</span>
                            <p className="myVip">{Intl.lang("Vip.my.grade")}</p>
                            <p className="vipUpdate">{Intl.lang("app.download.update")+(timer)}</p>
                        </div>
                        <dl>
                            <dt>{Intl.lang("Vip.detail.fee_offer")}</dt>
                            <dd className="flex-sb">
                                <dl>
                                    <dt>{Intl.lang("new.home.header.1")}</dt>
                                    <dd>{Intl.lang("Vip.detail.cfd")}{Intl.lang("common.symbol.colon")}{vipFeeRate}</dd>
                                    <dd>{Intl.lang("Vip.detail.eat_order")}{Intl.lang("common.symbol.colon")}{openPay?<span><i>{initRate.futEatBtcFee}</i> {initRate.futEatTdFee+"%"}</span>:<span>{initRate.futEatBtcFee}</span>}</dd>
                                    <dd>{Intl.lang("Vip.detail.pend_order")}{Intl.lang("common.symbol.colon")}{openPay?<span><i>{initRate.pendBtcFee}</i> {initRate.pendTdFee}</span>:<span>{initRate.pendBtcFee}</span>}</dd>
                                    <dd>{Intl.lang("Vip.detail.td_fee","TD","25%")}<p className={"ver-md mining-open-btn "+(openPay?"on":"")} onClick={this.changePayOffer.bind(this)}><i></i></p></dd>
                                </dl>
                                <dl>
                                    <dt>{Intl.lang("new.home.header.2")}</dt>
                                    <dd>{Intl.lang("Vip.detail.eat_order")}{Intl.lang("common.symbol.colon")}<span>{initRate.spotBtcEat}</span></dd>
                                    <dd>{Intl.lang("Vip.detail.pend_order")}{Intl.lang("common.symbol.colon")}<span>{initRate.spotBtcPend}</span></dd>
                                    <dd>{Intl.lang("Vip.detail.td_exRate","TD/BTC")}{Intl.lang("common.symbol.colon")}<Link to="/personal/ExRate"><span>{Decimal.format(vipData.DeductionPrice||0,8)}</span><span className="iconfont icon-arrow-l fs12 pdl-5"></span></Link></dd>
                                </dl>
                            </dd>
                        </dl>
                        <dl>
                            <dt>{Intl.lang("Vip.detail.vip_data")}</dt>
                            <dd>{Intl.lang("Vip.detail.count_td")}{Intl.lang("common.symbol.colon")}{tdCounts} TD</dd>
                            <dd>{Intl.lang("Vip.detail.next_limit")}{Intl.lang("common.symbol.colon")}{Intl.lang("Vip.detail.need_td")} {(vipData.leftTD||" 0")+" TD"}</dd>
                        </dl>
                    </div>
                    <div className="vip-header-title mt-40">{Intl.lang("Vip.table.grade_des")}</div>
                    <table className="vip-table" cellPadding="0" cellSpacing="0">
                        <thead>
                            <tr>
                                <th className="pd010" rowSpan="2">{Intl.lang("Vip.table.grade")}</th><th rowSpan="2">{Intl.lang("Vip.detail.left_num","TD")}</th>
                                <th className="wp-20" colSpan="1">{Intl.lang("Partner.text.64")}</th>
                                <th className="wp-40" colSpan="2">{Intl.lang("new.home.header.1")}</th>
                            </tr>
                            <tr className="list-config-title">
                                <th>{Intl.lang("Vip.detail.fee")}</th>
                                <th>{Intl.lang("Vip.table.pend_fee")}</th><th>{Intl.lang("Vip.table.eat_fee")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {this.vipMap.map((item, i)=>{
                                let feeRate = "--";
                                if(item.Level==0){
                                    feeRate = Intl.lang("Vip.table.unFee")
                                }else if(lang=="zh-cn"){
                                    feeRate = Intl.lang("Vip.table.fee",item.Futures.Tdfeerate*10);
                                }else{ feeRate = Decimal.toPercent(Decimal.accSubtr(1, item.Futures.Tdfeerate),0);}

                                return <tr key={"vip"+i}>
                                    <td>{item.Level==0?Intl.lang("Vip.grade.normal"):("VIP"+item.Level)}</td>
                                    <td>{item.Level<1?("≤"+item.Mintd):("≥"+item.Mintd)}</td>
                                    <td>{feeRate}</td>
                                    <td>{(item.Futures.Makerfee*100)+"%"}</td>
                                    <td>{feeRate}</td>
                                </tr>
                            })
                            }
                        </tbody>
                    </table>
                    <div className="invite-footer-list Vip-rights-rules mt-40">
                        <p>{Intl.lang("BindBank.104")}</p>
                        <ul>
                            <li>{Intl.lang("Vip.rules.1","0.08%")}</li>
                            <li>{Intl.lang("Vip.rules.2","0.08%")}</li>
                            <li>{Intl.lang("Vip.rules.3")}</li>
                            <li>{Intl.lang("Vip.rules.4")}</li>
                            <li>{Intl.lang("Vip.rules.5")}</li>
                            <li>{Intl.lang("Vip.rules.6")}</li>
                        </ul>
                    </div>
                </div>
            </div>
        )
    }
}
export default VipRights



