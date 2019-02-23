import Intl from '../intl';
import React from 'react';

import Store from '../core/store';
import connectToStore from '../core/connect-to-store';
import PureComponent from '../core/PureComponent';
import storeTypes from '../core/storetypes';
import Net from '../net/net'
import Event from '../core/event'
import AccountModel from '../model/account'
import SpotTradeModel from '../model/spot-trade'
import Clipboard from 'clipboard'
import Cookies from '../utils/cookie'

import {CONST} from '../public/const'
import Loader from '../utils/loader'
import {toast} from "../utils/common";
import Valiate from "../utils/valiate";
import PopDialog from "../utils/popDialog"
import NetBank from "../components/NetBank"
import {Confirm} from "../components/Common"

const $ = window.$;

class RechargeRMB extends PureComponent{
    constructor(props){
        super(props);
        this.Channel = "796",       // 充值渠道
        this.maxUSDT = 6000;

        this.amount = 0;
        this.WEIXINID = 250;
        this.ZHIFUBAO = 251;
        this.BANK = 252;
        this.state = {
            sysCardList: null,
            //addressList:{},
            OrderData:{},
            scanOrder:null,
            //RechargeNum:0,
            //rmbTab: 0,
            rmb_pay: 3,

            USDTPice: "--",
            CardNo: ""
        }
    }
    // componentWillUnmount() {
    //     super.componentWillUnmount();
    // }
    componentWillMount(){
        Loader.js("lib/jq/jquery.qrcode-0.12.0.min.js");

        Event.addListener(Event.EventName.PAY_UPDATE, this.payUpdate.bind(this), this);
    }
    componentDidMount(){
        this.setUsdtPrice();

        if(this.state.rmb_pay==3){
            this.rmbPayChange(3)
        }
    }
    componentWillReceiveProps(props){
        if(this.state.scanOrder){
            this.setState({scanOrder:null});
        }
    }
    payUpdate(){
        toast(Intl.lang("Recharge.121"));
    }
    setUsdtPrice(){
        var usdtPrice = SpotTradeModel.forwardMap['USDTCNY'];
        if(this.Channel!="796"){
            this.setState({USDTPice:usdtPrice});
        }else{
            var cardNo = Cookies.get('myCardNo') || "";
            this.setState({USDTPice:usdtPrice, CardNo: cardNo});
        }
    }

    createQrcode(Data){
        if(!Data) return false;

        var id, address, size=200;
        var type = this.Tab;
        var data = Data;
        // console.log(data.Address);

        if (typeof(data.PayCode)=='string'){
            id = 'wxcode';
            address = data.PayCode;
            size = 200;
        }else{
            if (type){
                id = "qrcode_contain";
                address = data.Address;
            }
        }

        if (address){
            this.refs[id].innerHTML = "";

            var params = {text:address,size:size,render:"canvas"};
            $(this.refs[id]).qrcode(params);
        }
    }

    rmbPayChange(type) {
        this.setState({'rmb_pay': type});

        if(type==4){
            this.setSysCardList();
        }else if(type==3){
            this.showBankNetMap();
        }else{
            if(this.state.scanOrder){
                this.setState({scanOrder:null});
            }
        }
    }
    showBankNetMap(){
        const netbank = Valiate.netBankMap(1);
        var bankMap = [];
        for(let i in netbank){
            let item = {
                Name : i,
                Id: netbank[i]
            };
            bankMap.push(item)
        }

        if(bankMap.length){
            this.setState({netBank: bankMap});
        }
    }
    // 银行卡转帐地址
    setSysCardList(){
        let cardList = AccountModel.getSystemCard();
        if(cardList)
            var cardInfo = cardList.split(',');
        this.setState({sysCardList: cardInfo});
    }
// 银行卡转帐
    bankPay = (e)=>{
        e.preventDefault();
        var amount = parseFloat(this.refs.bankPay.value) || this.amount;

        if(!amount || amount<100){
            toast(Intl.lang("Recharge.122"), true);
            return false;
        }
        let connect = this.refs["connectPhone"].value || "";

        this.toExchange(amount, this.BANK, connect, CONST.CURRENCY.USDT, true);
    };
    // 微信支付
    wxPay =(e)=>{
        e.preventDefault();

        var amount = parseFloat(this.refs.wxPay.value) || this.amount;
        if(!amount || amount<100){
            toast(Intl.lang("Recharge.122"), true);
            return false;
        }
        const { rmb_pay } = this.state;
        const payId = rmb_pay==1? this.WEIXINID : this.ZHIFUBAO;
        this.toExchange(amount, payId, false, CONST.CURRENCY.USDT);
    };
    // 网银 选择
    changeRadio(e){
        var value = e.target.value;
        this.setState({bankId: value});
    }
    // 796方式网银充值( bankMap 列表)
    netBankPay= (e)=>{
        e.preventDefault();

        var amount = parseFloat(this.refs.netPay.value) || this.amount;
        if(!amount || amount<100){
            toast(Intl.lang("Recharge.122"), true);
            return false;
        }
        var bankId = this.state.bankId;
        if(!bankId){
            toast(Intl.lang("Recharge.sel_bank"), true);
            return false;
        }
        this.toExchange(amount, bankId, false, CONST.CURRENCY.USDT, true);
    };

    toExchange(amount, bankId, mobile, currency, openTab){
        var self = this;
        var type = 1;

        var data = {Amount:parseFloat(amount), Type: parseInt(type)};
        //if (bankId > 0) data.BankId = parseInt(bankId);

        if(bankId==this.WEIXINID){
            data.PayChannel = "biyyo|WEIXIN";
        }else if(bankId==this.ZHIFUBAO){
            data.PayChannel = "biyyo|ALIPAY";
        }else{
            //data.PayChannel = "ymepay|1021|";
            data.PayChannel = "woonet|"+ bankId;
        }
        if(mobile){
            data.Mobile = mobile;
        }
        if(currency){
            data.Currency = currency;
        }

        //if(openTab) var newTab = window.open('about:blank');
        Net.httpRequest("bank/exchange", data, function(data){
            if (data.Status == 0 ){
                if (data.Data.PayCode) {
                    self.setWeiXinPayOrder(data.Data);
                }else if(data.Data.PayHTML){
                    self.showNetBankFrame(data.Data);
                }else if(data.Data.PayUrl){
                    //newTab.location.href = data.Data.PayUrl;
                    self.openNewTab(data.Data.PayUrl);
                }else{
                    toast(Intl.lang("Recharge.123"));
                    self.redirectPay(data.Data);
                }
            }
        }, this);
    }
    redirectPay(order){
        this.setState({OrderData:order});
    }
    setWeiXinPayOrder(data){
        if(data){
            this.setState({scanOrder: data});
            this.createQrcode(data);
        }
    }
    goback(){
        if(this.state.scanOrder){
            this.setState({scanOrder:null});
        }
    }
    showNetBankFrame(data){
        PopDialog.open(<NetBank data={data}/>, 'net_bank')
    }
    ranNum(min, max){
        const value = min + Math.floor(Math.random() * (max - min + 1));
        return value < 10 ? value*10 : value;
    }


/***************** channel new *******************************************/
    // 网银充值
    newNetBankPay= (e)=>{
        e.preventDefault();     //this.openNewTab("https://www.baidu.com"); return false;

        var amount = parseFloat(this.refs.netPay.value) || this.amount;
        if(!amount || amount<100){
            toast(Intl.lang("Recharge.122"), true);
            return false;
        }
        // var bankId = this.state.bankId;
        // var type = 1;
        var carNo = this.refs["cardNo"].value;
        if(!carNo){
            toast(Intl.lang("bindAuth.2_57"), true);
            return false;
        }

        var self = this;
        var data = {Amount:parseFloat(amount), Type: 1, PayChannel: "ymepay|1021|"+ carNo, Currency:9};
        //var newTab = window.open('about:blank');
        Net.httpRequest("bank/exchange", data, function(data){
            if (data.Status == 0 && data.Data){
                if (data.Data.PayCode) {
                    self.setWeiXinPayOrder(data.Data);
                }else if(data.Data.PayUrl){
                    // self.showNetBankFrame(data.Data);
                    //newTab.location.href = data.Data.PayUrl;
                    self.openNewTab(data.Data.PayUrl);
                    Cookies.set('myCardNo', carNo);
                }else{
                    toast(Intl.lang("Recharge.123"));
                    self.redirectPay(data.Data);
                }
            }
        }, this);
    };
    checkAmount(e){
        if(e.target.value==""){
            return false;
        }
        var value = parseInt(e.target.value);
        if(!value || value>this.maxUSDT){
            value = this.maxUSDT;
        }
        this.refs["netPay"].value = value;
    }
    openNewTab(url){
        if(!url) return false;

        var callback = function(url){
            window.open(url);
        };

        PopDialog.open(<Confirm title={Intl.lang("NetBank.100")} content={Intl.lang("NetBank.pay")} callback={()=>callback(url)}/>, "alert_panel")
    }
    render(){
        const {rmb_pay} = this.state;
        var oinfo = this.state.scanOrder;

        return (
            this.Channel != "796" ?
                <div className="rech-rmb-box wp-50 lh-50 pdb-50">
                    <ul className="pay-type-box">
                        <li className="current">{Intl.lang("NetBank.100")}</li>
                    </ul>
                    <form className="" onSubmit={this.newNetBankPay}>
                        <dl className="form-box f-clear mt-50">
                            <dt className="lh-50">{Intl.lang("Recharge.assess","USDT ")}：</dt>
                            <dd>￥{this.state.USDTPice}</dd>
                        </dl>
                        <dl className="form-box f-clear mt-10">
                            <dt className="lh-50">{Intl.lang("Recharge.109")}</dt>
                            <dd className="trade-tc-number">
                                <div className="numberBox">
                                    <input type="text" name="netPay" ref="netPay"
                                           placeholder={"100 - "+ this.maxUSDT} onChange={this.checkAmount.bind(this)}/>
                                    <div className="number-title w-100">CNY</div>
                                </div>
                            </dd>
                        </dl>
                        <dl className="form-box f-clear mt-30">
                            <dt>{Intl.lang("BindBank.102")}</dt>
                            <dd>
                                <div className="numberBox w350-h50"><input
                                    className="w350-h50 fem875" type="text" ref="cardNo" defaultValue={this.state.CardNo}
                                    placeholder={Intl.lang("BindBank.106")}/></div>
                                <p className="form-tips green3">{Intl.lang("BindBank.105")}</p>
                            </dd>
                        </dl>
                        <div className="mt-40 tc">
                            <button type="submit" className="btn btn-green w350-h50">
                                <span className="pdl-10 fem125">{Intl.lang("NetBank.100")}</span>
                            </button>
                        </div>
                    </form>
                </div>
                :
                <div className="rech-rmb-box wp-50 lh-50 pdb-50">
                {this.Channel != "796" ?
                    <ul className="pay-type-box flex-box flex-jc">
                        <li className="current">{Intl.lang("Recharge.100")}</li>
                    </ul>
                        :
                    <ul className="pay-type-box flex-box flex-jc">
                        {/*<li className={rmb_pay == 4 ? "current" : false}
                            onClick={() => this.rmbPayChange(4)}>{Intl.lang("Recharge.108")}</li>
                        <li className={rmb_pay == 1 ? "current" : false}
                            onClick={() => this.rmbPayChange(1)}>{Intl.lang("recharge.2_71")}</li>
                        <li className={rmb_pay == 2 ? "current" : false}
                            onClick={() => this.rmbPayChange(2)}>{Intl.lang("Recharge.107")}</li>
                         */}
                        <li className={rmb_pay == 3 ? "current" : false}
                            onClick={() => this.rmbPayChange(3)}>{Intl.lang("NetBank.100")}</li>

                    </ul>
                }
                {rmb_pay < 3 ?
                    <div>
                        {oinfo ?
                            <div>
                                <p className="f-clear border-bt pd010"><span
                                    className="fl fem875">{Intl.lang('Recharge.orderNum')}：{oinfo.OrderId}</span><span
                                    className="fr red2 fem125">￥{oinfo.SrcAmount}</span></p>
                                <div className="ecode-box mg-md mt-30" ref="wxcode"></div>
                                <div className="scan-box mg-md mt-20 f-clear">
                                    <i className="iconfont icon-scan-code icon-scan"></i>
                                    {rmb_pay == 1 ?
                                        <p className="mt-20">{Intl.lang("recharge.use_wx")}</p>
                                        :
                                        <p className="mt-20">{Intl.lang("recharge.use_zfb")}</p>
                                    }
                                    <p>{Intl.lang("recharge.scan_qrcode")}</p>
                                </div>
                                <div className="pdr-20 lh-32 tr">
                                    <a href="javascript:;" className="btn btn-normal"
                                       onClick={() => this.goback()}>{Intl.lang("connect.1_9")}</a>
                                </div>
                            </div>
                            :
                            <form className="" onSubmit={this.wxPay}>
                                <dl className="form-box f-clear mt-20">
                                    <dt className="lh-50">{Intl.lang("Recharge.assess","USDT")}：</dt>
                                    <dd>￥{this.state.USDTPice}</dd>
                                </dl>
                                <dl className="form-box f-clear mt-10">
                                    <dt className="lh-50">{Intl.lang("Recharge.109")}</dt>
                                    <dd className="trade-tc-number">
                                        <div className="numberBox">
                                            <input type="text" name="" ref="wxPay"
                                                   placeholder={Intl.lang("Recharge.118")}/>
                                            <div className="number-title w-100">CNY</div>
                                        </div>
                                    </dd>
                                </dl>
                                <div className="mt-40 tc">
                                    {rmb_pay == 1 ?
                                        <button type="submit" className="btn btn-green w350-h50"><i
                                            className="iconfont icon-wx-pay fem-175"></i><span
                                            className="pdl-10 fem125">{Intl.lang("recharge.scan_wx")}</span>
                                        </button>
                                        :
                                        <button type="submit" className="btn btn-green w350-h50"><i
                                            className="iconfont icon-ali fem-175"></i><span
                                            className="pdl-10 fem125">{Intl.lang("recharge.scan_zfb")}</span>
                                        </button>
                                    }
                                </div>
                            </form>}
                    </div>
                    :
                    rmb_pay == 4 ?
                        this.Channel == "old"?
                            <form className="" onSubmit={this.bankPay}>
                            <dl className="form-box f-clear mt-20">
                                <dt className="lh-50">{Intl.lang("Recharge.assess","USDT")}：</dt>
                                <dd>￥{this.state.USDTPice}</dd>
                            </dl>
                            <dl className="form-box f-clear mt-10">
                                <dt className="lh-50">{Intl.lang("Recharge.109")}</dt>
                                <dd className="trade-tc-number">
                                    <div className="numberBox">
                                        <input type="text" name="bankPay" ref="bankPay"
                                               placeholder={Intl.lang("Recharge.118")}/>
                                        <div className="number-title w-100">CNY</div>
                                    </div>
                                    <span className="pdl-10 fem125">.{this.ranNum(1, 100)}</span>
                                    <p className="form-tips">{Intl.lang("Recharge.110")}</p>
                                </dd>
                            </dl>
                            <dl className="form-box f-clear mt-20">
                                <dt>{Intl.lang("Recharge.111")}</dt>
                                {this.state.sysCardList ?
                                    <dd className="with-address-box fem875 tl">
                                        <p>{Intl.lang("Recharge.112")}<span
                                            className="green1">{this.state.sysCardList[1]}</span>
                                        </p>
                                        <p>{Intl.lang("Recharge.113")}<span
                                            className="green1">{this.state.sysCardList[0]}</span>
                                        </p>
                                        <p>{Intl.lang("Recharge.114")}<span
                                            className="green1">{this.state.sysCardList[2]}{this.state.sysCardList[3]}</span>
                                        </p>
                                    </dd>
                                    :
                                    <dd>---</dd>
                                }
                            </dl>
                            <dl className="form-box f-clear mt-30">
                                <dt>{Intl.lang("Recharge.115")}</dt>
                                <dd>
                                    <div className="numberBox w350-h50"><input
                                        className="w350-h50 fem875" type="text" ref="connectPhone"
                                        placeholder={Intl.lang("Recharge.119")}/></div>
                                    <p className="form-tips">{Intl.lang("Recharge.116")}</p>
                                </dd>
                            </dl>
                            <div className="mt-40 tc">
                                <button type="submit" className="btn btn-blue w350-h50"><i
                                    className="iconfont icon-bank-pay fem-175"></i><span
                                    className="pdl-10 fem125">{Intl.lang("Recharge.117")}</span>
                                </button>
                            </div>
                        </form>
                            :
                            <form className="" onSubmit={this.newNetBankPay}>
                                <dl className="form-box f-clear mt-50">
                                    <dt className="lh-50">{Intl.lang("Recharge.assess","USDT ")}：</dt>
                                    <dd>￥{this.state.USDTPice}</dd>
                                </dl>
                                <dl className="form-box f-clear mt-10">
                                    <dt className="lh-50">{Intl.lang("Recharge.109")}</dt>
                                    <dd className="trade-tc-number">
                                        <div className="numberBox">
                                            <input type="text" name="netPay" ref="netPay"
                                                   placeholder={"100 - "+ this.maxUSDT} onChange={this.checkAmount.bind(this)}/>
                                            <div className="number-title w-100">CNY</div>
                                        </div>
                                    </dd>
                                </dl>
                                <dl className="form-box f-clear mt-30">
                                    <dt>{Intl.lang("BindBank.102")}</dt>
                                    <dd>
                                        <div className="numberBox w350-h50"><input
                                            className="w350-h50 fem875" type="text" ref="cardNo" defaultValue={this.state.CardNo}
                                            placeholder={Intl.lang("BindBank.106")}/></div>
                                        <p className="form-tips green3">{Intl.lang("BindBank.105")}</p>
                                    </dd>
                                </dl>
                                <div className="mt-40 tc">
                                    <button type="submit" className="btn btn-green w350-h50">
                                        <span className="pdl-10 fem125">{Intl.lang("NetBank.100")}</span>
                                    </button>
                                </div>
                            </form>
                        :
                        <form onSubmit={this.netBankPay}>
                            <dl className="form-box f-clear mt-20">
                                <dt className="lh-50">{Intl.lang("Recharge.assess","USDT")}：</dt>
                                <dd>￥{this.state.USDTPice}</dd>
                            </dl>
                            <dl className="form-box f-clear mt-10">
                                <dt className="lh-50">{Intl.lang("Recharge.109")}</dt>
                                <dd className="trade-tc-number">
                                    <div className="numberBox">
                                        <input type="text" name="netPay" ref="netPay"
                                               placeholder={"100 - "+ this.maxUSDT} onChange={this.checkAmount.bind(this)}/>
                                        <div className="number-title w-100">CNY</div>
                                    </div>
                                </dd>
                            </dl>
                            <ul className="netbank-box mt-20 f-clear">
                                {this.state.netBank && this.state.netBank.map((item, index) => {
                                    var bankInfo = Valiate.getBankInfo(item.Name);
                                    return <li key={index}><label><input type="radio"
                                                                         name="bank-name"
                                                                         value={item.Id}
                                                                         onChange={this.changeRadio.bind(this)}/><i
                                        className="bank-icon" style={{backgroundPosition: bankInfo}}
                                        title={item.Name}></i></label></li>
                                })}
                            </ul>
                            <div className="mt-40 tc">
                                <button type="submit" className="btn btn-blue w350-h50"><i
                                    className="iconfont icon-bank-pay fem-175"></i><span
                                    className="pdl-10 fem125">{Intl.lang("Recharge.117")}</span>
                                </button>
                            </div>
                        </form>
                }
                </div>

        )
    }
}

export default RechargeRMB;