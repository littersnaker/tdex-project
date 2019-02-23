import React from 'react';
import PureComponent from "../core/PureComponent";
import Net from '../net/net';
import { Link } from 'react-router';
import AccountModel from "../model/account";
import GlobalStore from '../stores';
import Decimal from '../utils/decimal';
import PopDialog from "../utils/popDialog"
import {toast, getCurrencySymbol} from "../utils/common"
import Verify from './Verify'
import Valiate from '../utils/valiate';
import { CONST } from "../public/const";
import Intl from '../intl';
import Event from "../core/event";
import TransferConfirm from '../components/TransferConfirm';
import AssetMenu from '../components/AssetMenu';
import ResendSpan from '../components/ResendEmailCountDown';

class Transfer extends PureComponent {
	constructor(props) {
		super(props);

		this.isMobile = props.isMobile;
        this.askTimer = null;
		this.refer = false;
		this.query = 0;
        this.CoinsMap = {};         // all coins map
		this.Products = [];
		this.digit = 8;       // 小数保留
		this.state = {
			Codes: "",
            recCodes: "",
            cnyRate: null,
            Rate: "--",
			balance: null,
			FeeNum: 0,

			showPro: false,
			errData: ['','','',''],
            safeBind: true,

			refreshLog: false,
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
    componentWillUnmount(){
        this.closeTimer();
        super.componentWillUnmount();
    }
    loadSafeInfo(){
		if(this.state.hasBind) return true;

        let uInfo = GlobalStore.getUserInfo(), hasBind=true;
        if(!uInfo.GgAuth && !uInfo.Mobile){
            this.setState({safeBind: false});
            hasBind = false;
        }
        return hasBind;
    }
	componentDidMount() {
		if(this.refer){
			document.documentElement.scrollTop = document.body.scrollHeight;
		}
        this.changeProductPrice();
	}
	queryHandle(){
		var query = this.props.location.query;

		var currency = query.currency, refer = query.refer;
		if(refer){
			this.refer = refer;
		}

		if(this.query== currency){ return false; }
		this.query = currency;
	}
	componentWillMount() {
        Event.addListener(Event.EventName.PRODUCT_UPDATE, this.loadCodesList.bind(this), this);

		this.queryHandle();
		this.loadCodesList();
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
    resetCoinsMap(pList){
        var newPlist = {};
        pList.forEach((item)=>{
            newPlist[item.Id] = item;
        });
        this.CoinsMap = newPlist;
    }
	saveProducts(pList){
        if(!pList) return [];
        this.resetCoinsMap(pList);

        let newList = [], recCodes={'USDT':1,"BTC":1}, Codes= null;
        pList.forEach((item, i)=>{
            if(recCodes[item.Code]){
                newList.push(item);
            }
            if(item.Code=="TD"){
                this.getWalletBalance(item.Id);
                Codes = item;
            }
        });

		this.Products = newList;
        if(newList[0]){
            this.setState({recCodes: this.Products[0], Codes:Codes});
        }
	}
	getWalletBalance(cId){
		let self = this;
		Net.httpRequest("wallet/balance", {Currency:Number(cId),Type:Number(CONST.WALLET.TYPE.SPOT)}, (data)=>{
			if (data.Status == 0){
				var Info = data.Data;
				self.setState({balance:Info, showPro: false});
			}else{
				self.setState({balance:null});
			}
			this.loadSafeInfo();
		}, this);
	}
    getExchangePrice(){
        var self = this;

        Net.httpRequest("product/price", null, (data)=>{
            if (data.Status == 0){
                var Info = data.Data;
				if(Info){
					let price = Decimal.accMul(Info['BTCUSD'].Price,Info['USDCNY'].Price, this.digit);
                    let cnyRate = {
                        BTC: price,
                        USDT: Info['USDCNY'].Price
                    };
					self.setState({cnyRate:cnyRate});
				}
            }
        }, this);
    }
	afterTradeRefresh(){
		let { Codes } = this.state;
		this.getWalletBalance(Codes.Id);
	}
    changeProductPrice(){
        setTimeout(()=>{
            this.loadPrice();
            this.getExchangePrice();
        },200);
    }
    closeTimer(){
        if(this.askTimer){
            clearInterval(this.askTimer);
            this.askTimer = null;
        }
    }
    loadPrice(){
        this.closeTimer();

        this.askTimer = setInterval(()=>{
            this.getExchangePrice();
        },300000);
    }

	resetData(){
		var initStete = {
			errData: ['','','',''],
			FeeNum:0,
            Rate: "--"
		};
		this.refs["tradeNum"].value = "";
        this.refs["tfNum"].value = "";
		this.setState(initStete);
	}
    changeProduct(id){
        if(!id || id==this.state.recCodes.Id) return false;

        this.Products.forEach((item, i)=>{
            if(id==item.Id){
                this.setState({recCodes:item});
                this.resetData();
            }
        });
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
	resetError(){
		this.setState({errData:['','','','']});
	}
	checkUidErr(isReg){
		var uid = this.refs['tfUid'].value, type=0, txt="", {uInfo} = this.props;
		var { errData } = this.state;

		if(isNaN(uid)){
			type = 1;
			txt = Intl.lang("Withdrawals.correct_input");
		}else if(!uid){
			type = 1;
			txt = Intl.lang("form.error.empty");
		}else if((errData[1] || isReg) && !(/^[0-9]{4,10}$/.test(uid))){
			type = 1;
			txt = Intl.lang("Withdrawals.correct_input");
		}else if(uid==uInfo.AccountId){
			type = 1;
			txt = Intl.lang("Transfer.youSelf");
		}
		errData[1] = txt;
		this.setState({errData:errData});   // console.log("check uid");
		return type;
	}
	checkEmailErr(){
		var email = this.refs['tfEmail'].value;
		var { errData } = this.state, type=0, txt="", {uInfo} = this.props;
		var isEmail = Valiate.email(email);

		if(!email){
			type = 2;
			txt = Intl.lang("form.error.empty");
		}else if(!isEmail){
			type = 2;
			txt = Intl.lang("Withdrawals.correct_input");
		}else if(email==uInfo.Email){
			type = 2;
			txt = Intl.lang("Transfer.youSelf");
		}
		errData[2] = txt;
		this.setState({errData:errData});		// console.log("check email");
		return type;
	}

	checkMoney(mode){
		var { balance, errData } = this.state, type=0, txt="", isTrade=false;
		var money = this.walletCounts(balance);

        let amount = this.refs['tfNum'].value, minVal = 0;
        if(mode==0){
            amount = this.refs['tradeNum'].value;
            minVal = 10;
            isTrade = true;
        }

        let Amount = Number(amount);
		if(!amount){
			type = 3;
			txt = Intl.lang("form.error.empty");
		}else if(isNaN(Amount)){
			type = 3;
			txt = Intl.lang("Withdrawals.correct_input");
		}else if(Amount<minVal){
			type = 3;
			txt = Intl.lang("Transfer.error.min", minVal);
		}else if(isTrade && !(/^\d+$/.test(Amount))){
            type = 3;
            txt = Intl.lang("Transfer.error.float");
        }else if(!/^(-?\d+)(\.\d{1,8})?$/.test(Amount)){
			type = 3;
			txt = Intl.lang("Withdrawals.error.maxFloat", this.digit);
		}else if(isTrade && (money.canUse<Amount)){
			type = 3;
			txt = Intl.lang("Withdrawals.error.maxWith");
		}

		errData[mode] = txt;
		this.setState({errData:errData});			// console.log("check amount");
		return type;
	}
	checkHadEmpty(){
		if(this.checkMoney(0)){
			return true;
		}else if(this.checkUidErr(true)){
            return true;
        }else if(this.checkEmailErr()){
			return true;
		}else if(this.checkMoney(3)){
            return true;
        }
		this.resetError();
		return false;
	}
	handleSubmit(event){
		event.stopPropagation();
		event.preventDefault();

		if(!this.state.safeBind){
			toast(Intl.lang("Withdrawals.119"), true);
			return false;
		}

		var { Codes } = this.state;
		if(!Codes){
			toast(Intl.lang("common.not_open"), true);
			return false;
		}

		var isErr = this.checkHadEmpty();
		if(isErr) return false;

		this.popVerify();
	}
	popVerify(){
		PopDialog.open(<Verify path="disTips" verify="normal" onChange={(codeType)=>this.popCallback(codeType)} datafor="transfer"/>, 'simple_lang');
	}
	popCallback(codeType){
		if(codeType=="close"){
			PopDialog.close();
			return;
		}

		this.walletWithdraw(codeType);
	}
	walletWithdraw(params){
		var {Codes, recCodes, refreshLog} = this.state;

		params.Currency = Number(Codes.Id);
        params.Amount = Number(this.refs['tradeNum'].value);
		params.AccountId = Number(this.refs["tfUid"].value);
		params.Email = this.refs["tfEmail"].value;
        params.Target = Number(recCodes.Id);
        params.TargetAmount = Number(this.refs['tfNum'].value);

		var self = this;
		Net.httpRequest("wallet/transfer", params, (data)=>{
			if (data.Status == 0){
				PopDialog.close();

				var Info = data.Data;
				self.setState({balance:Info,refreshLog: !refreshLog});
				this.refs['tfNum'].value = "";

				toast(Intl.lang("Transfer.success"));
			}else{

			}
		}, this);
	}
    checkTradeVal(mode){
        let isErr = this.checkMoney(mode);
        if(!isErr){
            this.setTdRate();
        }
    }
    setTdRate(){
        let { cnyRate, recCodes } = this.state;
        if(!cnyRate) return false;

        let Code = recCodes.Code;
        let Rate = cnyRate[Code];

        let tdNum = Number(this.refs["tradeNum"].value);
        let changeNum = Number(this.refs["tfNum"].value);
        if(tdNum && changeNum>=0){
            let Price = Decimal.accDiv(Decimal.accMul(changeNum,Rate, this.digit),tdNum, this.digit);
            this.setState({Rate:Price});
        }
    }
    setMaxWith(canUse, evt){
        evt.stopPropagation();

        this.refs["tradeNum"].value = Number(canUse);
    }
	// 计算手续费
	setFeeNum(){
		var { Codes } = this.state, Counts=0;
		if(!Codes) return;

		if(Codes.TransferFee){ // 固定费用
			Counts = Codes.TransferFee
		}
		var errType = this.checkMoney();

		if(!errType){
			this.setState({FeeNum : Counts});
		}
	}
	getActual(canUse, FeeNum){
		var withNum = this.refs["tfNum"];
		if(!withNum) return false;

		var amount = Number(withNum.value), actual = 0;
		if(!isNaN(amount)){
			if(amount>canUse || amount<=FeeNum){
				return 0;
			}
			actual = Number(Decimal.accSubtr(amount, FeeNum));
		}
		return actual;
	}
	walletCounts(balance){
		var Counts=0, freeze=0, canUse=0, transfer=0;
		if(balance){
			//freeze = Number(Decimal.accAdd(balance.Lock,Decimal.accAdd(Decimal.accAdd(balance.Transfer,balance.Deposit),balance.Withdraw)));
			//Counts = Number(Decimal.accAdd(freeze, Decimal.accSubtr(balance.Quantity,balance.Unconfirm)));
			//canUse = Counts > 0 ? Number(balance.Quantity) : 0;
			//canUse = Counts > 0 ? Number(Decimal.accAdd(balance.Lock,balance.Quantity)) : 0;
            canUse = Number(balance.Lock) || 0;
		}

		return {Counts: Counts, Freeze: freeze, canUse: canUse, canTransfer:transfer}
	}
	showLog(flag){
		this.setState({showLog: flag});
	}
	render() {
		const { balance, Codes, recCodes, Rate, showPro, errData, safeBind, refreshLog} = this.state, { uInfo } = this.props;
		var canUse="0.00000000", Code="";
		if(recCodes) Code = recCodes.Code;
		if(balance){
			var money = this.walletCounts(balance);
			canUse = Decimal.format(money.canUse, this.digit).toString();
		}
		const path = this.getSubNav();
		return(
			<React.Fragment>
                <div className="main-content-part">
                    <div className="contain asset-section">
                        <AssetMenu path={path} />
                        <div className="asset-theme mt-30">{Intl.lang("Asset.102")}</div>

                        {(!safeBind) &&<div className="asset-safe-tip">
                            <i className="iconfont icon-tips pdr-5"></i>{Intl.lang("Withdrawals.safeVerify")}<span className="pdl-5"><Link to="/personal/securitysetting">{Intl.lang("Withdrawals.safeOpen")}</Link><i className="iconfont icon-more pdl-5 fs12"></i></span>
                        </div>}

                        <div className="asset-contain mt-10">
                            <div className="asset-contain-main">

                                <form className="asset-contain-main-l w-500" onSubmit={(e)=>{this.handleSubmit(e)}} autoComplete="off">
                                    <dl className="label-block">
                                        <dt className="wp-30">{Intl.lang("Transfer.asset.text3")}</dt>
                                        <dd className="pos-r">
                                            <div className={"input-border"+(errData[0]?" bd-err":"")} >
                                                <input type="text" ref="tradeNum" onChange={()=>this.checkTradeVal(0)} placeholder={Intl.lang("recharge.canUse")+" "+canUse} maxLength="15" />
                                                <span className="pdr-10">TD</span>
                                            </div>
                                            {(errData[0]!="") &&<div className="warn-tip"><i className="iconfont icon-tips fs12"></i><span>{errData[0]}</span></div>}
                                        </dd>
                                    </dl>
                                    <dl className="label-block mt-20">
                                        <dt className="wp-30">{Intl.lang("Transfer.uid")}</dt>
                                        <dd className="pos-r">
                                            <div className={"input-border"+(errData[1]?" bd-err":"")}>
                                                <input type="text" ref="tfUid" onFocus={()=>this.checkMoney(0)} onChange={()=>this.checkUidErr()} placeholder={Intl.lang("Transfer.input_uid")} />
                                            </div>
                                            {(errData[1]!="") &&<div className="warn-tip"><i className="iconfont icon-tips fs12"></i><span>{errData[1]}</span></div>}
                                        </dd>
                                    </dl>
                                    <dl className="label-block mt-20">
                                        <dt className="wp-30">{Intl.lang("Transfer.asset")}</dt>
                                        <dd className="pos-r">
                                            <div className={"input-border"+(errData[2]?" bd-err":"")}>
                                                <input type="text" ref="tfEmail" onFocus={(event)=>this.checkUidErr(event)} onBlur={()=>this.checkEmailErr()} placeholder={Intl.lang("Transfer.input_email")} />
                                            </div>
                                            {(errData[2]!="") &&<div className="warn-tip"><i className="iconfont icon-tips fs12"></i><span>{errData[2]}</span></div>}
                                        </dd>
                                    </dl>
                                    <dl className="label-block mt-20">
                                        <dt className="wp-30">{Intl.lang("Transfer.asset.text6")}</dt>
                                        <dd className="pos-r">
                                            <div className="more-input">
                                                <div className={"input-border"+(errData[3]?" bd-err":"")}>
                                                    <input type="text" ref="tfNum" onFocus={()=>this.checkEmailErr()} onChange={()=>this.checkTradeVal(3)} placeholder={Intl.lang("tradeInfo.2_25")} maxLength="15"/>
                                                </div>
                                                <div className="select-box ml-10 w-140">
                                                    <div className="select" onClick={(e)=>this.toggleProduct(e)}>
                                                        <div className="currency_text"><h4>{Code}</h4></div>
                                                        <div className="pdr-10 point"><i className={"iconfont icon-xiala "+(showPro?"on":"")}></i></div>
                                                    </div>
                                                    {showPro &&
                                                    <div className="select-option">
                                                        <ul>
                                                            {this.Products && this.Products.map((item, index)=>{
                                                                return <li key={'s'+index} onClick={()=>this.changeProduct(item.Id)}>{item.Code}</li>
                                                            })}
                                                            {(!this.Products && !this.Products.length) && <li className="tc">{Intl.lang("bank.1_27")}</li>}
                                                        </ul>
                                                    </div>
                                                    }
                                                </div>
                                            </div>
                                            <div className="rate-txt mt-10 pos-r">
                                                <p><span>{"1TD"}</span><span className="pd-5"> ≈ </span><span ref="ratePrice">{Rate}</span>CNY</p>
                                                {(errData[3]!="") &&<div className="warn-tip"><i className="iconfont icon-tips fs12"></i><span>{errData[3]}</span></div>}
                                            </div>
                                            <div className="commit-box mt-30">
                                                {/*<button className={"btn wp-100 "+((safeBind&&Codes)?"":"btnNotAllow")}>{Intl.lang("Transfer.transfer")}</button>*/}
                                                <button className="btn wp-100">{Intl.lang("Transfer.transfer")}</button>
                                            </div>
                                        </dd>
                                    </dl>
                                </form>

                                <div className="ver-line"></div>

                                <div className="asset-contain-main-r wp-50">
                                    <div className="asset-contain-tips">
                                        <h4>{Intl.lang("Recharge.tips")}</h4>
                                        <ul className="number-li">
                                            <li>
                                                <p>{Intl.lang("Transfer.tips.txt1", "10")}</p>
                                            </li>
											<li>
												<p>{Intl.lang("Transfer.tips.txt2")}</p>
											</li>
                                            <li>
                                                <p>{Intl.lang("Transfer.tips.txt3", "30")}</p>
                                            </li>
                                            <li>
                                                <p>{Intl.lang("Transfer.tips.txt4")}</p>
                                            </li>
											<li>
												<p>{Intl.lang("Transfer.tips.txt5","30")}</p>
											</li>
                                        </ul>
                                    </div>
                                </div>

                            </div>
                        </div>

                        <TransferHistory product={Codes} coinsMap={this.CoinsMap} refresh={refreshLog} onChange={()=>this.afterTradeRefresh()} />
                    </div>
                </div>

                {/*
			<div className="inside-page-web hide" onClick={(e)=>this.closeProduct(e)}>
				<div className="inside-web-part">
					<CrumbsLink pathData={path} />
					<div className="withdrawal">
						<div className="w-head-top m-head-top pc-hide" onClick={this.resetData.bind(this)}>
							<h3 onClick={()=>this.showLog(false)} className={"fl "+(showLog?"m-under-l":"")}>{Intl.lang("Asset.102")}</h3>
							<h3 onClick={()=>this.showLog(true)} className={"pc-hide fr "+(showLog?"":"m-under-l")}>{Intl.lang("Recharge.log")}</h3>
						</div>
						<div className={showLog == false?"currency_left transfer-box":"currency_left transfer-box m-hide"}>
							<form className="manage-address-bos transfer-form wp-100" onSubmit={(e)=>{this.handleSubmit(e)}} autoComplete="off">
								<dl className="form-box f-clear">
									<dt>{Intl.lang("Transfer.accountId")}{Intl.lang("common.symbol.colon")}</dt>
									<dd>
										<span className="c-8">{uInfo.AccountId}</span>
									</dd>
								</dl>
								<dl className="form-box f-clear mt-20 pc-hide">
									<dt>{Intl.lang("Withdrawals.103")}</dt>
									<dd>
										<span className="c-8">{canUse}</span><span className="pdr-10 tb pdl-5">TD</span>
									</dd>
								</dl>
                                <dl className="form-box f-clear mt-20 lh-40 pos-r">
                                    <dt>{Intl.lang("Transfer.asset.text3")}{Intl.lang("common.symbol.colon")}</dt>
                                    <dd className="f-clear">
                                        <div className={"numberBox pos-r w435-h40 m-w100_ "+(errData[0]?"bd-err":"")}>
                                            <input type="text" className="w435-h40 m-w100_  fem" ref="tradeNum" onChange={()=>this.checkTradeVal(0)} placeholder={Intl.lang("tradeInfo.2_25")} maxLength="15"/>

                                            <div className="transfer-money m-hide" onClick={(e)=>this.setMaxWith(canUse,e)}><span className="pdr-10 tb">TD</span>{Intl.lang("Withdrawals.103")}<span>{canUse}</span></div>
                                        </div>
                                    </dd>
                                    <dd>{(errData[0]!="") && <span className="fem75 red1 pdl-10">*{errData[0]}</span>}</dd>
                                </dl>

								<dl className="form-box f-clear mt-20 lh-40">
									<dt>{Intl.lang("Transfer.uid")}{Intl.lang("common.symbol.colon")}</dt>
									<dd>
										<div className={"numberBox  w435-h40 m-w100_  "+(errData[1]?"bd-err":"")}><input className=" w435-h40 m-w100_  fem" type="text" ref="tfUid" onFocus={()=>this.checkMoney(0)} onChange={()=>this.checkUidErr()} placeholder={Intl.lang("Transfer.input_uid")}/></div>
									</dd>
									<dd>{(errData[1]!="") && <span className="fem75 red1 pdl-10">*{errData[1]}</span>}</dd>
								</dl>
								<dl className="form-box f-clear mt-20 lh-40">
									<dt>{Intl.lang("Transfer.asset")}{Intl.lang("common.symbol.colon")}</dt>
									<dd>
										<div className={"numberBox  w435-h40 m-w100_  "+(errData[2]?"bd-err":"")}><input className=" w435-h40 m-w100_  fem" type="text" ref="tfEmail" onFocus={(event)=>this.checkUidErr(event)} onBlur={()=>this.checkEmailErr()} placeholder={Intl.lang("Transfer.input_email")} /></div>
									</dd>
									<dd>{(errData[2]!="") && <span className="fem75 red1 pdl-10">*{errData[2]}</span>}</dd>
								</dl>

								<dl className="form-box f-clear mt-20 lh-40">
									<dt>{Intl.lang("Transfer.asset.text6")}{Intl.lang("common.symbol.colon")}</dt>
									<dd className="w435-h40 f-clear">
                                        <div className={"numberBox fl w300-h40 m-w100_  "+(errData[3]?"bd-err":"")}>
                                            <input className="w300-h40 m-w100_  fem" type="text" ref="tfNum" onFocus={()=>this.checkEmailErr()} onChange={()=>this.checkTradeVal(3)} placeholder={Intl.lang("tradeInfo.2_25")} maxLength="15"/>
                                        </div>
                                        {!this.isMobile &&
                                        <div className="pos-r w-125 fr">
                                            <div className="select numberBox" onClick={(e)=>this.toggleProduct(e)}>
                                                <div className="currency_text">
                                                    <h4>{Code}</h4>
                                                </div>
                                                <div className="triangle">
                                                    <i className={showPro==false?'iconfont icon-dropDown c-8':'iconfont icon-dropUp c-8'}></i>
                                                </div>
                                            </div>
                                            {showPro &&
											<TransferProducts products={this.Products} onChange={(id)=>this.changeProduct(id)} />
                                            }
                                        </div>
                                        }
									</dd>
                                    <dd>{(errData[3]!="") && <span className="fem75 red1 pdl-10">*{errData[3]}</span>}</dd>
								</dl>
                                {this.isMobile &&
                                <dl className="form-box f-clear mt-20 lh-40">
                                    <dt>{Intl.lang("Transfer.asset.text5")}{Intl.lang("common.symbol.colon")}</dt>
                                    <dd className="w435-h40 f-clear">
                                        <div className="pos-r w435-h40 m-w100_ fr">
                                            <div className="select numberBox" onClick={(e)=>this.toggleProduct(e)}>
                                                <div className="currency_text">
                                                    <h4>{Code}</h4>
                                                </div>
                                                <div className="triangle">
                                                    <i className={showPro==false?'iconfont icon-dropDown c-8':'iconfont icon-dropUp c-8'}></i>
                                                </div>
                                            </div>
                                            {showPro &&
                                                <TransferProducts products={this.Products} onChange={(id)=>this.changeProduct(id)} />
                                            }
                                        </div>
                                    </dd>
                                </dl>
                                }
                                <dl className="form-box f-clear mt-10">
                                    <dt>&nbsp;</dt>
                                    <dd className="c-8">
                                        <p><span>{"1TD"}</span><span className="pd-5"> ≈ </span><span ref="ratePrice">{Rate}</span>CNY</p>
                                    </dd>
                                </dl>
								<dl className="form-box f-clear mt-30 mb-30 lh-40">
									<dt>&nbsp;</dt>
									<dd>
										<button className={"btn btn-yellow fem125  w435-h40 m-w100_  "+((safeBind&&Codes)?"":"btnNotAllow")}>{Intl.lang("Transfer.transfer")}</button>
									</dd>
								</dl>
								{(!safeBind) && <dl className="form-box last-form-box f-clear fem75 mt-15">
									<dt>&nbsp;</dt>
									<dd>
										<Link className="green4 fs14 cursor pdl-20 warn" to="/personal/securitysetting">{Intl.lang("Withdrawals.119")}</Link>
									</dd>
								</dl>}
							</form>
							<div className="attention">
								<h4>{Intl.lang("Recharge.tips")}</h4>
								<ul>
									<li>
                                        <p>{Intl.lang("Transfer.tips.txt5")}</p>
									</li>
									<li>
                                        <p>{Intl.lang("Transfer.tips.txt1")}</p>
									</li>
                                    <li>
                                        <p>{Intl.lang("Transfer.tips.txt3", "10 TD")}</p>
                                    </li>
                                    <li>
                                        <p>{Intl.lang("Transfer.tips.txt4", "30")}</p>
                                    </li>
								</ul>
							</div>
						</div>
						<div className={!showLog == true?"m-hide":"transfer-log-box"}>
							<TransferHistory product={Codes} coinsMap={this.CoinsMap} refresh={refreshLog} onChange={()=>this.afterTradeRefresh()} />
						</div>
					</div>
				</div>
			</div>
                */}
			</React.Fragment>
		)
	}
}
export default Transfer;
class TransferProducts extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {};
    }
    changeProduct(id){
        this.props.onChange(id);
    }
    render(){
        const { products } = this.props;
        return(
            <div className="select-option">
                <ul>
                    {products && products.map((item, index)=>{
                        return <li key={'c'+index} onClick={()=>this.changeProduct(item.Id)}>{item.Code}</li>
                    })}
                    {(!products && !products.length) && <li className="tc">{Intl.lang("bank.1_27")}</li>}
                </ul>
            </div>
        )
    }
}
class TransferHistory extends PureComponent{
	constructor(props) {
		super(props);

        this.CoinsMap = null;
		this.refresh = false;
		this.product = null;
		this.state = {
			curPage: 1,
			historyList:{List: [], PageSize: 5}, //最新成交

            detailTab: {},
		};
	}
	componentWillUnmount(){
		super.componentWillUnmount();
	}
    componentWillMount(){
        this.getHistory();

		Event.addListener(Event.EventName.MSG_TRANSFER_OVER,this.getHistory.bind(this,1), this);
    }
	getHistory(page){
		var curPage = page || this.state.curPage;

		var self = this;		// Type: 1 - 充值, 2 - 提现, 8 - 转账, 4 - 佣金
		Net.httpRequest("wallet/orders", {Type:8, Page:curPage, PageSize:5}, (data)=>{
			if (data.Status == 0){
				var Info = data.Data;
				self.setState({historyList:Info, curPage:Info.Page});
			}else{

			}
		}, this);
	}
	componentWillReceiveProps(nextProps){
		var update = nextProps.refresh;
		if(this.refresh != update){
			this.refresh = update;
			this.getHistory();
		}
        if(!this.CoinsMap){
            this.CoinsMap = nextProps.coinsMap;
        }
	}
    getProductName(id){
        if(this.CoinsMap){
            return this.CoinsMap[id].Code;
        }
    }
	turnPage(page){
		this.getHistory(page);
	}
    refreshHistory(){
        this.getHistory();
        this.props.onChange();
    }
    toggleDetail(tab){
        let { detailTab } = this.state;

        detailTab[tab] = !detailTab[tab];
        this.setState({detailTab:detailTab})
    }

	render(){
		const {historyList} = this.state;
		var self = this;
		return (
			<React.Fragment>
                <div className="record-lists mt-10">
                    <div className="lists-header">
                        <h3>{Intl.lang("Recharge.log")}</h3><Link to='/personal/billlog?t=7'>{Intl.lang("common.viewMore")}<i className="iconfont icon-arrow-l"></i></Link>
                    </div>
					<div className="log-list-overflow">
						<div className="lists-content ov-w-rows8">
							<ul className="lists-theme">
								<li>{Intl.lang("Personal.walletLogType")}</li>
								<li>{Intl.lang("accountSafe.1_102")}</li>
								<li>{Intl.lang("Asset.105")}</li>
								<li>{Intl.lang("tradeHistory.1_9")}</li>
								<li>{Intl.lang("recharge.1_23")}</li>
								<li>{Intl.lang("accountSafe.1_99")}</li>
							</ul>
							{(historyList.hasOwnProperty("Total") && historyList.Total > 0) && historyList.List.map((item, index) => {
								let fromCode = self.getProductName(item.Currency), toCode = self.getProductName(item.Target);
								let isShow = this.state.detailTab[index];

								return <React.Fragment key={"vr"+index}>
									<ul className="lists-list" key={"v"+index}>
										<li>{Intl.lang("billLog.Action.type"+item.Action)}</li>
										<li>{(item.CreateTime).substring(0, 16)}</li>
										<li>{fromCode}</li>
										<li>{item.Amount}</li>
										<li>
											<TransferConfirm order={item} onChange={this.refreshHistory.bind(this)}/>
										</li>
										<li className="oprate">
											<span className="cur-hover point" onClick={this.toggleDetail.bind(this, index)}>{Intl.lang("Billlog.table.detail")} <i className={"iconfont fs14 "+ (isShow?"icon-dropUp":"icon-dropDown")}></i></span>
											{item.Status == 9 && <ResendSpan dataId={item.Id}/>}
										</li>
									</ul>
									<ul className={"lists-detail "+ (!isShow?"hide":"")} key={'det'+index}>
										<li><span></span><span></span><span>{Intl.lang("Transfer.uid")}</span><span>{Intl.lang("Transfer.asset.text5")}</span><span>{Intl.lang("Transfer.asset.text6")}</span><span></span></li>
										<li><span></span><span></span><span>{item.TargetUid}</span><span>{toCode}</span><span>{item.TargetAmount}</span><span></span></li>
									</ul>
								</React.Fragment>
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

