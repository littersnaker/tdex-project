import React from 'react';
import PureComponent from "../core/PureComponent";
import history from '../core/history';
import Net from '../net/net';
import { Link } from 'react-router';
import AccountModel from "../model/account";
import Decimal from '../utils/decimal';
import PopDialog from "../utils/popDialog";
import {Confirm} from '../components/Common';
import {toast, getCurrencySymbol} from "../utils/common";
import QRCode from 'qrcode.react';
import Clipboard from 'clipboard';
import { CONST } from "../public/const";
import Intl from '../intl';
import Event from '../core/event';
import AssetMenu from '../components/AssetMenu';

class Recharge extends PureComponent {
	constructor(props) {
		super(props);

		this.query = 0;
		this.Products = [];
		this.state = {
			Codes: "",
			balance: null,
			addressList:[],
			showPro: false,
			showLog:false
		};
	}
	getSubNav(){
		return [
			{pathLink: '/asset',pathIcon: 'icon-wallet', pathName: Intl.lang('NavBar.103')},
			{pathLink: '/recharge',pathIcon: 'icon-recharge', pathName: Intl.lang('account.1_2')},
			{pathLink: '/withdrawals',pathIcon: 'icon-withdrawal', pathName: Intl.lang('account.1_3')},
			{pathLink: '/walletTransfer',pathIcon: 'icon-exchange', pathName: Intl.lang('WalletTransfer.theme')},
			{pathLink: '/transfer',pathIcon: 'icon-transfer', pathName: Intl.lang('Asset.102')},
			{pathLink: '/personal/billlog',pathIcon: 'icon-history', pathName: Intl.lang('Personal.billLog')}
		];
	}
	queryHandle(){
		var query = this.props.location.query;

		var currency = query.currency;
		if(this.query== currency){ return false; }
		this.query = currency;
	}
	componentWillUnmount(){
		super.componentWillUnmount();
	}
	componentWillMount() {
        Event.addListener(Event.EventName.PRODUCT_UPDATE, this.loadCodesList.bind(this), this);

		this.queryHandle();
		this.loadCodesList();
		//Event.addListener(Event.EventName.WALLET_UPDATE, this.onUpdateWallet.bind(this), this);
	}
	loadCodesList(){
		var pList = AccountModel.getProductCoins(), self = this;

		if(pList){
			this.saveProducts(pList);
		}else{
			AccountModel.loadProductCoins(null, function(data){
				if(data){
					self.saveProducts(data.List);
				}
			}, this);
		}
	}
	saveProducts(pList){
		this.Products = AccountModel.filterProducts(pList, 0x01);
		if(this.Products && this.Products.length){
			var product = this.Products[0];
			if(this.query){
				product = this.setProduct(this.query);
			}else{
				this.setProduct(product.Id);
			}
			this.getWalletBalance(product.Id);
		}
	}
	setProduct(cid){
		var product = {};
		for(var i in this.Products){
			let id = this.Products[i].Id;
			if(cid==id){
				product = this.Products[i];
				break;
			}
		}
		this.setState({Codes:product});
		return product;
	}
	getWalletBalance(cId){
		var self = this;
		Net.httpRequest("wallet/balance", {Currency:Number(cId),Type:Number(CONST.WALLET.TYPE.SPOT)}, (data)=>{
			if (data.Status == 0){
				var Info = data.Data;
				self.setState({balance:Info, showPro: false});
			}else{
				self.setState({balance:null});
			}
		}, this);
	}
	changeProduct(id){
		if(id==this.state.Codes.Id) return false;

		this.setProduct(id);
		this.getWalletBalance(id);

		history.replace({pathname:'/recharge',query:{'currency':id}});
	}
	toggleProduct(event){
		event.stopPropagation();

		this.setState({showPro: !this.state.showPro});
	}
	closeProduct(event){
		event.stopPropagation();

		if(this.state.showPro){
			this.setState({showPro: false});
		}
	}
	walletCounts(balance){
		var Counts=0, freeze=0, canUse=0;
		if(balance){
			freeze = Number(Decimal.accAdd(balance.Lock,Decimal.accAdd(Decimal.accAdd(balance.Transfer,balance.Deposit),balance.Withdraw)));
			Counts = Number(Decimal.accAdd(freeze, Decimal.accSubtr(balance.Quantity,balance.Unconfirm)));
			canUse = Counts > 0 ? Number(balance.Quantity) : 0;
		}

		return {Counts: Counts, Freeze: freeze, canUse: canUse}
	}
	showLog(flag){
		this.setState({showLog: flag});
	}
	render() {
		const { balance, Codes, showPro } = this.state;
		var Counts = "0.00000000", Freeze="0.00000000", canUse="0.00000000", Code="";
		if(balance){
			var money = this.walletCounts(balance);
			Counts = Decimal.format(money.Counts,8).toString();
			Freeze = Decimal.format(money.Freeze,8).toString();
			canUse = Decimal.format(money.canUse,8).toString();
		}
		if(Codes) Code = Codes.Code;
		const path = this.getSubNav();
		return(
            <div className="main-content-part">
                <div className="contain asset-section">
                    <AssetMenu path={path} />
                    <div className="asset-theme mt-30">{Intl.lang("account.1_2")}</div>

                    <div className="asset-contain mt-10">
                        <div className="asset-contain-main">

                            <div className="asset-contain-main-l">
                                <div className="select-box">
                                    <div className="select" onClick={(e)=>this.toggleProduct(e)}>
                                        <div className="currency_text"><h4>{Code}</h4></div>
                                        <div className="pd010 point"><i className={"iconfont icon-xiala "+(showPro?"on":"")}></i></div>
                                    </div>
                                    {showPro &&
                                    <div className="select-option">
                                        <ul>
                                            {this.Products && this.Products.map((item, index)=>{
                                                return <li key={"code"+index} onClick={()=>this.changeProduct(item.Id)}>{item.Code}</li>
                                            })}
                                        </ul>
                                    </div>}
                                </div>
                                <ul className="account-block">
                                    <li><span>{Intl.lang("recharge.total")}</span><span>{Counts+" "+Code}</span></li>
                                    <li><span>{Intl.lang("Asset.100")}</span><span>{Freeze+" "+Code}</span></li>
                                    <li><span>{Intl.lang("recharge.canUse")}</span><span>{canUse+" "+Code}</span></li>
                                </ul>
                            </div>

                            <div className="ver-line"></div>

                            <div className="asset-contain-main-r">
                                <RechargeInfo product={Codes}/>
                            </div>
                        </div>
                        <div className="hor-line wp-100"></div>
                        <div className="asset-contain-tips">
                            <h4>{Intl.lang("Recharge.tips")}</h4>
                            <ul className="number-li">
                                <li>{Intl.lang("Recharge.tips_1", Code, Codes.Confirmations||"0")}</li>
                                <li>{Intl.lang("Recharge.tips_3")}</li>
                                <li>{Intl.lang("Recharge.tips_2")}</li>
                            </ul>
                        </div>
                    </div>
                    <RechargeHistory product={Codes} />
                </div>
            </div>
		)
	}
}
export default Recharge;

class RechargeInfo extends PureComponent{
	constructor(props) {
		super(props);

		this.Codes= null;
		this.state = {
			addressList:[],

			qrShow: false
		};
	}
	componentWillMount() {
		var codes = this.props.product;

		if(codes && codes.Id){
			this.Codes = codes;
			this.loadWalletAddress(codes.Id);
		}
	}
	componentDidMount() {
		var clipboard = new Clipboard('.copy_link_btn');
		clipboard.on('success', function(e) {
			toast(Intl.lang("Recharge.120"), 0, 1000);
		});
		clipboard.on('error', function(e) {
			console.log(e);
		});
		this.clipboard = clipboard;
	}

	componentWillReceiveProps(nextProps){
		var product = nextProps.product;

		if(this.Codes != product && product){
			this.Codes = product;
			this.loadWalletAddress(product);
		}
	}
	componentWillUnmount(){
		this.clipboard.destroy();
	}

	loadWalletAddress(type){
		var product = typeof(type)==='object'? type:this.props.product;

		var data={}, method='post';
		if(type){
			data = {Type: 1, Currency:Number(product.Id), Target: Number(product.Id)};
		}else{
			data = {Currency:Number(product.Id), Target: Number(product.Id)};
			method = 'put';
		}

		var self = this;
		Net.httpRequest("wallet/address", data, (data)=>{
			if (data.Status == 0){
				var List = data.Data.List;
				var address = List ? List : [];
				self.setState({addressList: address});
			}else{

			}
		}, this, method);
	}
	getWalletAddress(code){
		if(!code){
			toast(Intl.lang("common.not_open"), true);
			return false;
		}
		var self = this;
		PopDialog.open(<Confirm title={Intl.lang("Recharge.104")} content={Intl.lang("Recharge.recover", 3)} callback={()=>self.loadWalletAddress()}/>, "alert_panel");
	}
	showQrcode(flag){
		this.setState({qrShow:flag});
	}

	render() {
		const { addressList, qrShow } = this.state, { product } = this.props;
		var address="", code = "", memo = "";

		if(product) code = product.Code;

		if(addressList.length){
			address = addressList[0].Address;
			memo = addressList[0].Memo;
			//memo = 123456;
		}
		return(
            <React.Fragment>
            <div className="address-block">
                <h4>{Intl.lang("Recharge.103")}</h4>
                {!address ?
                    <div className="address-get lh-22">
						{product.Remark &&<p className="remark-tip"><i className="iconfont icon-tips fs12"></i> {Intl.lang("Recharge.note_2", code)}</p>}
                        <span>{Intl.lang("Recharge.warn_1", code)}</span>
                        <span className="copy-txt" onClick={()=>this.getWalletAddress(code)}>{Intl.lang("Recharge.104")}</span>
                    </div>
                    :
                    <React.Fragment>
                        <div className="address-copy mt-15">
                            <input type="text" value={address} id="copy_invit_text" readOnly="readonly" />
                            <span className="copy-txt copy_link_btn" data-clipboard-action="copy" data-clipboard-target="#copy_invit_text">{Intl.lang("cooperation.1_5")}</span>
                        </div>
						{memo &&
						<div className="mt-20">
							<h4>{Intl.lang("Recharge.remark", code)}</h4>
							<p className="remark-tip fs12"><i className="iconfont icon-tips fs12"></i> {Intl.lang("Recharge.note_2", code)}</p>
							<div className="address-copy">
								<input type="text" value={memo} id="copy_memo_text" readOnly="readonly" />
								<span className="copy-txt copy_link_btn" data-clipboard-action="copy" data-clipboard-target="#copy_memo_text">{Intl.lang("m.Invite.rank.text.3")}</span>
							</div>
						</div>}
                        <div className="scan-qrCode mt-30">
                            <h4>{Intl.lang("Recharge.scan_qrCode")}</h4>
                            <QRCode className="mt-10" value={address} size={120}/>
                        </div>
                    </React.Fragment>
                }
            </div>
           </React.Fragment>
		)
	}
}


class RechargeHistory extends PureComponent{
	constructor(props) {
		super(props);

		this.product = null;
		this.state = {
			curPage: 1,
			historyList:{List: [], PageSize: 5} //最新成交
		};
	}
	getHistory(page){
		var curPage = page || this.state.curPage;
		//const cId = this.product.Id;
		//if(!cId) return false;

		var self = this;		// Type: 1 - 充值, 2 - 提现, 3 - 转账, 4 - 佣金
		Net.httpRequest("wallet/orders", {Type:1, Page:curPage, PageSize:5}, (data)=>{
			if (data.Status == 0){
				var Info = data.Data;
				self.setState({historyList:Info, curPage:Info.Page});
			}else{

			}
		}, this);
	}
	componentWillReceiveProps(nextProps){
		if(!this.product || this.product.Id != nextProps.product.Id){
			this.product = nextProps.product;
			this.getHistory();
		}
	}
	turnPage(page){
		this.getHistory(page);
	}
	render(){
		const {historyList} = this.state, {product} = this.props;
		var self = this;
		return (
		<div className="record-lists mt-10">
			<div className="lists-header">
				<h3>{Intl.lang("Recharge.log")}</h3><Link to='/personal/billlog?t=1'>{Intl.lang("common.viewMore")}<i className="iconfont icon-arrow-l"></i></Link>
			</div>
			<div className="log-list-overflow">
				<div className="lists-content ov-w-rows5">
					<ul className="lists-theme">
						<li>{Intl.lang("accountSafe.1_102")}</li>
						<li>{Intl.lang("Asset.105")}</li>
						<li>{Intl.lang("tradeHistory.1_9")}</li>
						<li>{Intl.lang("recharge.1_23")}</li>
					</ul>
					{(historyList.hasOwnProperty("Total") && historyList.Total > 0) && historyList.List.map((item, index) => {
						var cs = getCurrencySymbol(item.Currency);
						return <ul className="lists-list" key={index}>
							<li>{(item.CreateTime).substring(0, 16)}</li>
							<li>{cs.sn}</li>
							<li>{item.Amount}</li>
							<li>{Intl.lang("EXCHANGE.STATUS." + item.Status)}</li>
						</ul>
					})}
					{(!historyList.List || !historyList.List.length) && <div className="no-list-data show-5">
						<div className="no-list-data-pic"></div>
						<p>{Intl.lang("bank.1_27")}</p>
					</div>}
				</div>
			</div>
		</div>
		)
	}
}
