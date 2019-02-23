import React from 'react';
import PureComponent from "../core/PureComponent";
import history from '../core/history';
import Intl from '../intl';
import Net from '../net/net';
import { Link } from 'react-router';
import AccountModel from "../model/account";
import GlobalStore from '../stores';
import Decimal from '../utils/decimal';
import PopDialog from "../utils/popDialog";
import {Confirm} from '../components/Common';
import {toast, getCurrencySymbol} from "../utils/common";
import Verify from './Verify';
import { CONST } from "../public/const";
import Event from "../core/event";
import AssetMenu from '../components/AssetMenu';
import ResendSpan from '../components/ResendEmailCountDown';

class Withdrawals extends PureComponent {

	constructor(props) {
		super(props);

		this.proid = 4;  // 提现小数
		this.query = 0;
		this.Products =[];
		this.safeBind = true;
		this.state = {
			Codes: "",
			balance: null,
			addressList:[],
			defaultAddress:"",
			FeeNum: 0,
			withCounts:"",

			showPro:false,
			showAdr: false,
			newAdr: false,
			errType:0,			// 1 提现地址 2 新地址备注格式错误 3 新地址 4 提现数量  8 新地址备注为空 10 系统错误
			errTxt:"",
			showWd:true,
			refreshLog: false,
			change:'',
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
	componentDidMount() {
		this.refs["selectAdr"].focus();

		var uInfo = this.props.uInfo;
		if(!uInfo.GgAuth && !uInfo.Mobile){
			this.safeBind = false;
		}
	}
	componentWillUnmount(){
		super.componentWillUnmount();
	}
	componentWillMount() {
        Event.addListener(Event.EventName.PRODUCT_UPDATE, this.loadCodesList.bind(this), this);

		this.queryHandle();
		this.loadCodesList();
	}
	componentWillReceiveProps(nextProps){
		var uInfo = GlobalStore.getUserInfo();
		
		if(!uInfo.GgAuth && !uInfo.Mobile){
			let safe = false;
			if(this.safeBind != safe){
				this.safeBind = false;
				this.setState({safeBind:false});
			}
		}else if(!this.safeBind){
			this.safeBind = true;
			this.setState({safeBind:true});
		}
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
		this.Products = AccountModel.filterProducts(pList, 0x02);
		if(this.Products && this.Products.length){
			var product = this.Products[0];
			if(this.query){
				product = this.setProduct(this.query);
			}else{
				this.setProduct(product.Id);
			}
			this.getWalletBalance(product.Id);
			//this.loadWalletAddress(product.Id);
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
	getWalletBalance(codeId, refreshLog){
		var self = this;
		Net.httpRequest("wallet/balance", {Currency:Number(codeId),Type:Number(CONST.WALLET.TYPE.SPOT)}, (data)=>{
			if (data.Status == 0){
				var Info = data.Data;
				var params = {balance:Info, showPro:false};
				if(refreshLog){
					params.refreshLog = !self.state.refreshLog;
				}
				self.setState(params);
				self.loadWalletAddress(Info.Currency);
			}else{
				self.setState({balance:null});
			}
		}, this);
	}
	loadWalletAddress(codeId){
		var self = this;
		Net.httpRequest("wallet/address", { Type: 2, Currency:Number(codeId)}, (data)=>{
			if (data.Status == 0){
				var List = data.Data.List;
				var address = List ? List : [], defAddress="";

				if(List &&List.length){
					defAddress = List[0].Address;
				}
				self.setState({addressList: address, defaultAddress:defAddress});
			}else{

			}
		}, this);
	}
	deleteAddress(cId, int, evt){
		evt = evt || window.event;
		evt.stopPropagation();

		var self = this;
		PopDialog.open(<Confirm title={Intl.lang("ManageWalletAdd.delete")} content={Intl.lang("ManageWalletAdd.delete_info")} callback={()=>self.removeAddress(cId, int)}/>, "alert_panel");
	}
	removeAddress(cId, int){
		var list = this.state.addressList;

		var self = this;
		Net.httpRequest("wallet/address", { Id:cId}, (data)=>{
			if (data.Status == 0){
				list.splice(int,1);
				self.setState({addressList:list});
			}
		}, this, 'delete');
	}
	resetState(){
		var initStete = {
			showAdr: false,
			newAdr: false,
			errType:0,
			errTxt:"",

			FeeNum:0,
			withCounts:""
		};
		this.refs["selectAdr"].value = "";
		this.refs["withNum"].value = "";
		this.setState(initStete);
	}
	changeProduct(id){
		if(id==this.state.Codes.Id) return false;

		this.setProduct(id);
		this.getWalletBalance(id, 'refreshLog');

		this.resetState();

		history.replace({pathname:'/withdrawals',query:{'currency':id}});
	}
	toggleProduct(event){
		event.stopPropagation();

		this.setState({showPro: !this.state.showPro});
	}
	toggleAddress(event){
		event.stopPropagation();

		this.setState({showAdr:!this.state.showAdr});
	}
	closeProduct(event){
		event.stopPropagation();
		let params = null;

		if(this.state.showPro){
			params = params ? params : {};
			params.showPro = false;
		}
		if(this.state.showAdr){
			params = params ? params : {};
			params.showAdr = false;
		}
		if(params){
			this.setState(params);
		}
	}
	changeAddress(event){
		event.preventDefault();
		event.stopPropagation();
		let val = event.target.value;

		this.setState({defaultAddress:val});
		//this.refs["selectAdr"].value = val;
	}
	addNewAddress(){
		var {newAdr} = this.state;
		if(newAdr){
			this.setState({showAdr:!this.state.showAdr}); return;
		}
		this.setState({newAdr:true, showAdr:!this.state.showAdr, errType:0, errTxt:""});

		this.refs["selectAdr"].value = "";
		this.refs["selectAdr"].placeholder = Intl.lang("Withdrawals.tip.addAddress");
		var self = this;
		this.nextTick(function(){
			self.refs["adrDes"].focus();
		});
	}
	selectAddress(val){
		this.setState({newAdr:false, showAdr:!this.state.showAdr, errType:0, errTxt:"", defaultAddress:val});

		//this.refs["selectAdr"].value = val;
	}
	nextTick(cd){
		setTimeout(()=>{
			if(cd) return cd();
		}, 300);
	}
	checkInputCount(maxAmount, amount){
		let flag = true;

		let maxFloat = Valiate.maxFloat(amount,2);

		return flag;
	}
	// 计算手续费
	setFeeNum(maxAmont){
		var { Codes, balance } = this.state, Counts=0;
		if(!Codes) return;

		let val = this.refs["withNum"].value;
		if(val) val = val.match(/^\d+(?:\.\d{0,4})?/);

		if(Codes.FeeType=="Value"){ // 固定费用
			Counts = Codes.Fee
		}else{
			if(!isNaN(val)){
				Counts = Number(Decimal.accMul(Codes.Fee, Number(val)));
			}
		}
		let params = {FeeNum : Counts, withCounts:val};
		let param = this.checkMoney(Counts);
		Object.assign(params, param);

		this.setState(params);
	}
	setMaxWith(maxNum, evt){
		if(evt) evt.stopPropagation();

		this.refs["withNum"].value = Number(maxNum.toString().match(/^\d+(?:\.\d{0,4})?/));
		this.setFeeNum();
	}
	resetError(){
		this.setState({errType:0, errTxt:""});
	}
	checkMoney(FeeNum){
		const {Codes, balance, errType} = this.state;
		var money = this.walletCounts(balance);

		let val = this.refs["withNum"].value, params={};
		let Amount = Number(val);

		if(val==""){
			params.errType = 4;
			params.errTxt = Intl.lang("form.error.empty");
		}else if(isNaN(Amount)){
			params.errType = 4;
			params.errTxt = Intl.lang("Withdrawals.correct_input");
			params.withCounts = "";
		}else if(Amount<Codes.MinCash){
			params.errType = 4;
			params.errTxt = Intl.lang("Withdrawals.error.lessMin")+ Codes.MinCash;
		}else if(!/^(-?\d+)(\.\d{1,4})?$/.test(Amount)){
			params.errType = 4;
			params.errTxt = Intl.lang("Withdrawals.error.maxFloat", this.proid);
			return {};
		}else if(money.canUse < Amount){
			params.errType = 4;
			params.errTxt = Intl.lang("Withdrawals.error.maxWith");
		}else if(FeeNum && money.canUse < FeeNum){
			params.errType = 4;
			params.errTxt = Intl.lang("Withdrawals.free_less");
		}else if(errType==4){
			this.resetError();
		}
		return params;
	}
	checkDataLegal(event, checkAmont){
		var evt = event || window.event;
		if(evt) evt.stopPropagation();

		var { newAdr, errType} = this.state, type=0, txt="";

		if(checkAmont){
			var withAmount = this.checkMoney();
			if(withAmount.errType){
				type = 4;
				txt = withAmount.errTxt;
			}
		}
		if(newAdr){
			var title = this.refs["adrDes"].value.replace(/\s+/g,"");
			var adr = this.refs["adrNew"].value.replace(/\s+/g,"");
			if(!adr){
				type = 3;
				txt = Intl.lang("form.error.empty");
			}else if(type!=4){
				if(!title){
					type=8;  // 可选项
					txt = Intl.lang("Withdrawals.remark_note");
				}else{
					var flag = /^[A-Za-z0-9]{3,10}$/.test(title);
					if(!flag){
						type=2;
						txt = Intl.lang("Withdrawals.error.label","3-10")
					}
				}
			}
		}else{
			var selAdr = this.refs["selectAdr"].value.replace(/\s+/g,"");
			if(!selAdr){
				type = 1;
				txt = Intl.lang("form.error.empty");
			}
		}

		if(type){
			this.setState({errType:type, errTxt:txt});
			return type==8 ? false : type ;
		}else if(errType){
			this.resetError();
		}
	}
	handleSubmit(event){
		event.stopPropagation();
		event.preventDefault();

		if(!this.safeBind){
			toast(Intl.lang("Withdrawals.119"), true);
			return false;
		}

		var { Codes } = this.state;
		if(!Codes){
			toast(Intl.lang("common.not_open"), true);
			return false;
		}

		var flag = this.checkDataLegal(false, true);
		if(flag) return false;

		this.popVerify();
	}
	popVerify(){
		PopDialog.open(<Verify path="disTips" verify="normal" onChange={(type)=>this.popCallback(type)} datafor="withdraw"/>, 'simple_lang', true);
	}
	popCallback(type){
		if(type=="close"){
			PopDialog.close();
			return false;
		}

		this.walletWithdraw(type);
	}
	walletWithdraw(param){
		var {Codes, newAdr, refreshLog} = this.state;

		param.Currency = Codes.Id;
		param.Target = Codes.Id;
		if(newAdr) {
			param.Label = this.refs["adrDes"].value.replace(/\s+/g,"");
			param.Address = this.refs["adrNew"].value.replace(/\s+/g,"");
		}else{
			param.Address = this.refs['selectAdr'].value.replace(/\s+/g,"");
		}

		param.Amount = Number(this.refs['withNum'].value);

		var self = this;
		Net.httpRequest("wallet/withdraw", param, (data)=>{
			if (data.Status == 0){
				PopDialog.close();

				var Info = data.Data;
				self.setState({balance:Info, refreshLog: !refreshLog});
				toast(Intl.lang("Withdrawals.success"));
				this.refs['withNum'].value = "";
			}else{
				//PopDialog.close();
			}
		}, this);
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
	getActual(canUse, FeeNum){
		var withNum = this.refs["withNum"];
		if(!withNum) return false;

		var amount = Number(withNum.value), actual = 0;
		if(!isNaN(amount)){
			if(amount>canUse){
				return 0;
			}
			actual = Number(Decimal.accSubtr(amount, FeeNum, this.proid, true));
		}
		return actual<0?"0.000":actual;
	}
	showLog(flag){
		this.setState({showLog: flag});
	}
	render() {
		const { addressList, balance, Codes, defaultAddress, withCounts, FeeNum, showPro, showAdr, newAdr, errType, errTxt, refreshLog} = this.state;

		var Counts = "0.00000000", Freeze="0.00000000", canUse="0.00000000", Code="";

		if(balance){
			var money = this.walletCounts(balance);
			Counts = Decimal.format(money.Counts,8);
			Freeze = Decimal.format(money.Freeze,8);
			canUse = Decimal.format(money.canUse,8).toString();
		}
		if(Codes) Code = Codes.Code;
		const actual = this.getActual(canUse, FeeNum), path=this.getSubNav();

		return(
            <React.Fragment>
                <div className="main-content-part" onClick={(e)=>this.closeProduct(e)}>
                    <div className="contain asset-section">
                        <AssetMenu path={path} />
                        <div className="asset-theme mt-30">{Intl.lang("MoneyLog.3")}</div>

                        {(!this.safeBind) &&<div className="asset-safe-tip">
                            <i className="iconfont icon-tips pdr-5"></i>{Intl.lang("Withdrawals.safeVerify")}<span className="pdl-5"><Link to="/personal/securitysetting">{Intl.lang("Withdrawals.safeOpen")}</Link><i className="iconfont icon-more pdl-5 fs12"></i></span>
                        </div>}

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
                                <form className="asset-contain-main-r" onSubmit={(e)=>{this.handleSubmit(e)}} autoComplete="off">
                                    <dl className="label-block">
                                        <dt>{Intl.lang("Withdrawals.with_address")}</dt>
                                        <dd>
                                            <div className="select-box" onClick={(e)=>this.toggleAddress(e)}>
                                                <div className={"select address-txt "+ (errType==1?"bd-err":newAdr?"disable":"")}>
                                                    <input type="text" placeholder={Intl.lang("Withdrawals.input_address")} ref="selectAdr" value={defaultAddress} onChange={(e)=>{this.changeAddress(e)}} readOnly="readonly" />
                                                    <div className="pdr-10 point"><i className={"iconfont icon-xiala "+(showAdr?"on":"")}></i></div>
                                                </div>
                                                {showAdr &&
                                                <div className="select-option">
                                                    <ul>
                                                        <li onClick={()=>this.addNewAddress()}>{Intl.lang("Withdrawals.new_address")}</li>
                                                        {addressList && addressList.map((item, index)=>{
                                                            return <li key={"adr"+index} onClick={()=>this.selectAddress(item.Address)}><span className="pdr-20 dis-inb w-60">{item.Label}</span><span>{item.Address}</span>
                                                                <i className="iconfont icon-close close-red" onClick={(e)=>this.deleteAddress(item.Id, index, e)}></i></li>
                                                        })}
                                                    </ul>
                                                </div>}
                                            </div>
                                            <div className="pos-r">
                                                {newAdr &&
                                                <div className="mt-20 more-input">
                                                    <div className={"input-border "+(errType==2?"bd-err":errType==8?"bd-warn":"")}><input type="text" ref="adrDes" className="w-125" placeholder={Intl.lang("Withdrawals.label")}/></div>
                                                    <div className="pdl-5 c-d">—</div>
                                                    <div className={"input-border "+(errType==3?"bd-err":"")}><input type="text" ref="adrNew" className="w-330" placeholder={Intl.lang("Withdrawals.address")} /></div>
                                                </div>}
                                                {((errType<4) && errTxt) && <div className="warn-tip"><i className="iconfont icon-tips fs12"></i><span>{errTxt}</span></div>}
                                                {(errType==8 && errTxt) && <div className="warn-tip"><span>{errTxt}</span></div>}
                                            </div>
                                        </dd>
                                    </dl>

                                    <dl className="label-block mt-30" onClick={(event)=>this.checkDataLegal(event)}>
                                        <dt>{Intl.lang("Withdrawals.amount")}</dt>
                                        <dd>
                                            <div className="pos-r">
                                                <div className={"input-border "+(errType==4?"bd-err":"")}>
                                                    <input type="text" ref="withNum" onChange={()=>this.setFeeNum(canUse)} placeholder={Intl.lang("recharge.canUse")+" "+canUse} maxLength="15" />
                                                    <span  className="pd010 point code-unit" onClick={(e)=>this.setMaxWith(canUse,e)}>{Intl.lang("Withdrawals.all")}</span>
                                                </div>
                                                {(errType==4 && errTxt) &&<div className="warn-tip"><i className="iconfont icon-tips fs12"></i><span>{errTxt}</span></div>}
                                            </div>
                                            <div className="mt-20 flex-box">
                                                <h4>{Intl.lang("Withdrawals.fee")}<span>{FeeNum}</span></h4><h4 className="ml-20">{Intl.lang("Withdrawals.109")}<span>{actual}</span></h4>
                                            </div>
                                            <div className="commit-box mt-30">
                                                {/*<button type="submit" className={"btn "+((this.safeBind&&Counts>0)?"":"btnDis")}>{Intl.lang("common.submit")}</button>*/}
                                                <button type="submit" className="btn">{Intl.lang("common.submit")}</button>
                                            </div>
                                        </dd>
                                    </dl>
                                </form>
                            </div>
                            <div className="hor-line wp-100"></div>
                            <div className="asset-contain-tips">
                                <h4>{Intl.lang("Recharge.tips")}</h4>
                                <ul className="number-li">
									<li>{Intl.lang("Withdrawals.with_min")}{Codes.MinCash} {Codes.Code}</li>
                                    <li>{Intl.lang("Withdrawals.tips_1")}</li>
                                    <li>{Intl.lang("Withdrawals.tips_2")}</li>
                                    <li>{Intl.lang("Withdrawals.tips_3"," 9:00 "," 0:00 ")}</li>
                                    <li>{Intl.lang("Recharge.tips_2")}</li>
                                </ul>
                            </div>
                        </div>

                        <WithdrawalsHistory product={Codes} refresh={refreshLog}/>
                    </div>
                </div>
                {/*
			<div className="inside-page-web hide" onClick={(e)=>this.closeProduct(e)}>
				<div className="inside-web-part">
					<CrumbsLink pathData={path}/>
					<div className="withdrawal">
						<div className="w-head-top m-head-top pc-hide">
							<h3 onClick={()=>this.showLog(false)} className={"fl "+(showLog?"m-under-l":"")}>{Intl.lang("account.1_3")}</h3>
							<h3 onClick={()=>this.showLog(true)} className={"pc-hide fr "+(showLog?"":"m-under-l")}>{Intl.lang("Recharge.log")}</h3>
						</div>
						<div className={showLog == false?"currency_left":"currency_left m-hide"}>
							<div className="select" onClick={(e)=>this.toggleProduct(e)}>
								<div className="currency_pic">
								</div>
								<div className="currency_text">
									<h4>{Code}</h4>
								</div>
								<div className="triangle">
									<i className={showPro==false?'iconfont icon-dropDown c-8':'iconfont icon-dropUp c-8'}></i>
								</div>
							</div>
							{showPro &&
							<div className="select_option">
								<ul>
									<li className="h-50 tc hide">
										<div className="select_option_ipt">
											<input type="text" name="" id="" value="" placeholder=""/>
										</div>
									</li>
									{this.Products && this.Products.map((item, index)=>{
										return <li key={index} onClick={()=>this.changeProduct(item.Id)}>
											<div className="currency_pic">
											</div>
											<div className="currency_text">
												<h4>{item.Code}</h4>
											</div>
										</li>
									})}
									{!this.Products.length && <li className="tc"><div className="currency_text c-8"><h4>{Intl.lang("common.not_open")}</h4></div></li>}
								</ul>
							</div>
							}
							<div className="calculate">
								<ul>
									<li>
										<p>{Intl.lang("recharge.total")}</p>
									</li>
									<li>
										<p>{Intl.lang("Asset.100")}</p>
									</li>
									<li>
										<p>{Intl.lang("recharge.canUse")}</p>
									</li>
								</ul>
								<ul>
									<li className="calculate_text">
										<p>{Counts+" "+Code}</p>
									</li>
									<li className="calculate_text">
										<p>{Freeze+" "+Code}</p>
									</li>
									<li className="calculate_text">
										<p>{canUse+" "+Code}</p>
									</li>
								</ul>
							</div>
							<form className="Withdrawal_form" onSubmit={(e)=>{this.handleSubmit(e)}} autoComplete="off">
								<h4>{Intl.lang("Recharge.note")}</h4>
								<ul>
									<li>
										<p>{Intl.lang("Withdrawals.with_min")}{Codes.MinCash} {Codes.Code}</p>
									</li>
									<li>
										<p>{Intl.lang("ManageWalletAdd.105")}</p>
									</li>
								</ul>
								<div className="input_box mt-10">
									<h5>{Codes.Code} {Intl.lang("Withdrawals.with_address")}</h5>
									<div className="address pos-r f-clear">
										<div onClick={(e)=>this.toggleAddress(e)}>
											<div className={"ipt ipt-box "+ (errType==1?"bd-err":newAdr?"ipt-disable":"")}>
												<input type="text" ref="selectAdr" value={defaultAddress} onChange={(e)=>{this.changeAddress(e)}} />
											</div>
											<div className="btn ipt-box">
												<i className={showAdr==false?'iconfont icon-dropDown c-8':'iconfont icon-dropUp c-8'}></i>
											</div>
										</div>
										{showAdr &&
										<div className="address-box">
											<dl className="address-list">
												<dt onClick={()=>this.addNewAddress()}><i className="iconfont icon-add-bg fem125 ver-md"></i><span className="pdl-5">{Intl.lang("Withdrawals.new_address")}</span></dt>
												{addressList && addressList.map((item, index)=>{
													return <dd key={index} onClick={()=>this.selectAddress(item.Address)}><span className="pdr-20 dis-inb w-60">{item.Label}</span><span>{item.Address}</span>
														<i className="iconfont icon-close close-red" onClick={(e)=>this.deleteAddress(item.Id, index, e)}></i></dd>
												})}
											</dl>
										</div>}
									</div>
								</div>

								{newAdr &&
								<div className="mt-10 addressAdd">
									<i className="iconfont icon-question pdr-5" title={Intl.lang("Withdrawals.labelTip")}></i>
									<input type="text" ref="adrDes" className={"w-125 "+(errType==2?"bd-err":errType==8?"bd-warn":"")} placeholder={Intl.lang("Withdrawals.label")} />
									<span className="pd05 gray">—</span>
									<input type="text" ref="adrNew" className={errType==3?"w-330 bd-err":"w-330"} placeholder={Intl.lang("Withdrawals.address")} />
								</div>}
								{((errType<4) && errTxt) && <div className="fem75 mt-5 red2 pdl-20">{errTxt}</div>}
								{(errType==8 && errTxt) && <div className="fem75 mt-5 warn pdl-20">{errTxt}</div>}

								<div className="input_box2" onClick={(event)=>this.checkDataLegal(event)}>
									<div className="f-clear">
										<h5>{Intl.lang("Withdrawals.amount")}</h5>
										<h5 className="hide">{Intl.lang("withdrawal.quota","24h")} <span>--</span></h5>
									</div>
									<div className="address f-clear">
										<div className={"ipt ipt-box pos-r "+(errType==4?"bd-err":"")}>
											<input type="text" ref="withNum" onChange={()=>this.setFeeNum(canUse)} value={withCounts} maxLength="15"/>

											<div className="withUse" onClick={(e)=>this.setMaxWith(canUse,e)}>{Intl.lang("Withdrawals.103")}<span>{canUse}</span></div>
										</div>
										<div className="ipt-box unit-bdl-none">
											{Code}
										</div>
									</div>
									{(errType==4 && errTxt) && <div className="red2 fem75 mt-5">{errTxt}</div>}
								</div>

								<div className="input_box3">
									<h5>{Intl.lang("Withdrawals.fee")}<span>{FeeNum}</span></h5>
									<h5>{Intl.lang("Withdrawals.109")}<span>{actual}</span></h5>

									<button type="submit" className={"btn "+((this.safeBind&&Counts>0)?"":"btnDis")}>{Intl.lang("common.submit")}</button>
								</div>

								{(!this.safeBind) && <div className="fem75 mt-15">
									<Link className="green4 fs14 cursor pdl-20 warn" to="/personal/securitysetting">{Intl.lang("Withdrawals.119")}</Link>
								</div>}
							</form>
							<div className="attention">
								<h4>{Intl.lang("Recharge.tips")}</h4>
								<ul>
									<li>
										<p>{Intl.lang("Withdrawals.tips_1"," 9:00 "," 0:00 ")}</p>
										<p dangerouslySetInnerHTML={{__html:Intl.lang("Recharge.tips_2")}}></p>
									</li>
								</ul>
							</div>
						</div>
						<div className={!showLog == true?"m-hide":null}>
							<WithdrawalsHistory product={Codes} refresh={refreshLog}/>
						</div>
					</div>
				</div>
			</div>
                */}
            </React.Fragment>
		)
	}
}
export default Withdrawals;


class WithdrawalsHistory extends PureComponent{
	constructor(props) {
		super(props);

		this.product = null;
		this.refresh = false;
		this.state = {
			curPage: 1,
			historyList:{List: [], PageSize: 10}, //最新成交
		};
	}
	componentDidMount() {

	}
	getHistory(page){
		var curPage = page || this.state.curPage;
		//const cId = this.product.Id;
		//if(!cId) return false;

		var self = this;
		Net.httpRequest("wallet/orders", {Type:2, Page:curPage, PageSize:5}, (data)=>{
			if (data.Status == 0){
				var Info = data.Data;
				self.setState({historyList:Info, curPage:Info.Page});
			}else{

			}
		}, this);
	}
	componentWillReceiveProps(nextProps){
		var update = nextProps.refresh;
		if(!this.product){
			this.product = nextProps.product;
			this.getHistory();
		}
		if(this.refresh != update){
			this.product = nextProps.product;
			this.refresh = update;
			this.getHistory();
		}
	}
	turnPage(page){
		this.getHistory(page);
	}
	cancelWith(dataId){
		if(!dataId) return false;

		Net.httpRequest("wallet/cancel", {Id:dataId}, (data)=>{
			if (data.Status == 0){
				this.getHistory();
				toast(Intl.lang("activity.Status2"));
			}
		}, this);
	}
	render(){
		const {historyList} = this.state, {product} = this.props;

		var self = this;
		return (
			<React.Fragment>
				<div className="record-lists mt-10">
					<div className="lists-header">
						<h3>{Intl.lang("Recharge.log")}</h3><Link to='/personal/billlog?t=2'>{Intl.lang("common.viewMore")}<i className="iconfont icon-arrow-l"></i></Link>
					</div>
					<div className="log-list-overflow">
                        <div className="lists-content ov-w-rows8">
                            <ul className="lists-theme">
                                <li style={{width:"15%"}}>{Intl.lang("accountSafe.1_102")}</li>
                                <li style={{width:"13%"}}>{Intl.lang("Asset.105")}</li>
                                <li style={{width:"13%"}}>{Intl.lang("tradeHistory.1_9")}</li>
                                <li style={{width:"31%"}}>{Intl.lang("Withdrawals.address")}</li>
                                <li style={{width:"13%"}}>{Intl.lang("recharge.1_23")}</li>
                                <li style={{width:"13%"}}>{Intl.lang( "accountSafe.1_99")}</li>
                            </ul>
                            {(historyList.hasOwnProperty("Total") && historyList.Total > 0) && historyList.List.map((item, index) => {
								var cs = getCurrencySymbol(item.Currency);
                                return <ul className="lists-list" key={"w"+index}>
                                    <li style={{width:"15%"}}>{(item.CreateTime).substring(0, 16)}</li>
                                    <li style={{width:"13%"}}>{cs.sn}</li>
                                    <li style={{width:"13%"}}>{item.Amount}</li>
                                    <li style={{width:"31%"}}>{item.Address}</li>
                                    <li style={{width:"13%"}}>{Intl.lang("EXCHANGE.STATUS." + item.Status)}</li>
                                    <li style={{width:"13%"}} className="oprate">
										{item.Status == 9 && <span onClick={()=>this.cancelWith(item.Id)}>{Intl.lang("common.cancel")}</span>}
										{item.Status == 9 && <ResendSpan dataId={item.Id} type={1} />}
                                    </li>
                                </ul>
                            })}
                            {(!historyList.List || !historyList.List.length) && <div className="no-list-data show-5">
                                <div className="no-list-data-pic"></div>
                                <p>{Intl.lang("bank.1_27")}</p>
                            </div>}
                        </div>
                    </div>
				</div>
			</React.Fragment>
		)
	}
}