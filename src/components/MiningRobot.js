import Intl from '../intl';
import React from 'react';
import {Link} from 'react-router';

import PureComponent from "../core/PureComponent"
import {DropDown, Contrainer, SubMenu, MenuItem} from './DropDown';
import Net from "../net/net";
import Decimal from '../utils/decimal';
import PropTypes from "prop-types";
import NumberInput from "./NumberInput";
import AccountModel from "../model/account";
import {CONST} from "../public/const"
import TradeMgr from "../model/trade-mgr";
import AuthModel from "../model/auth";
import Event from '../core/event';
import Notification from '../utils/notification';
import {getCurrencySymbol} from '../utils/common';

//挖矿精灵设置
export default class MiningRobot extends PureComponent {
    static defaultProps = {
        type: "futures",
        onConfirm: () => {
        }
    };

    static propTypes = {
        type: PropTypes.string.isRequired,
        onConfirm: PropTypes.func.isRequired
    };

    constructor(props) {
        super(props);

        var type = this.props.type;
        if (type == 'futures') {
            this.sides = ['buy', 'sell', 'random'];
            this.percents = [0.2, 0.4, 0.6, 0.8, 1];
            // this.volRange = [1, 100000];

            this.levers = [1, 2, 5, 10, 15, 20];
            this.intervals = [5, 10, 20, 30, 60, 300];
        } else {
            this.sides = ['buy', 'sell'];
            this.percents = [0.25, 0.50, 0.75, 1];
            // this.volRange = [0.0001, 100000];
            this.intervals = [5, 10, 20, 30, 60, 300];
        }
        this.code = this.props.code;

        this.product = TradeMgr.getProduct(this.code);
        if (this.product){
            this.toSB = 'TD';
            this.toFixed = 2;
            if (type=='futures'){
                var info = getCurrencySymbol(this.product.Currency);
                if (info) this.fromSB = info.sn;
            }else{
                // var fromInfo = getCurrencySymbol(CONST.CURRENCY[this.product.fromCode]);
                // if (fromInfo) this.fromSB = fromInfo.sn;
                //
                var toInfo = getCurrencySymbol(CONST.CURRENCY[this.product.toCode]);
                if (toInfo) this.fromSB = toInfo.sn;
            }
        }

        this.state = {
            FirstSide: "buy",
            Amount: '',
            Percent: this.percents[0],
            Scale: this.levers ? this.levers[0] : '',
            Interval: this.intervals[0],
            Status: 0,
            Commission: 0,
            Expect: 0,
        };
    }

    componentWillMount() {
        Event.addOnce(Event.EventName.WALLET_UPDATE, this.onUpdateWallet.bind(this), this);
        Event.addListener(Event.EventName.MINING_UPDATE, this.onMiningUpdate.bind(this), this);

        if (AuthModel.checkUserAuth()){
            this.onUpdateWallet();
            this.loadMiningRobot();
        }
    }
    onMiningUpdate(data){
        if (['open', 'close'].indexOf(data.Event)!=-1){
            Notification.success(Intl.lang("mining.msg."+data.Event, data.Msg));
        }else{
            this.loadMiningRobot();
            Notification.error(Intl.lang("mining.msg."+data.Event, data.Msg));
        }
    }

    onUpdateWallet(){
        if (!this.state.Amount && this.state.Percent){
            this.onUpdateAmount(this.state.Percent, this.state.FirstSide, this.state.Scale);
        }
    }

    //加载挖矿助手信息
    loadMiningRobot() {
        Net.httpRequest("mining/robot", {Type: this.props.type}, (data) => {
            if (data.Status == 0) {
                var info = data.Data;
                if (info.Status) this.setState(info);
                else if (info.Amount>0){ //如果设置过，按上次设置的
                    // delete info.Amount;
                    this.setState(info);
                    // this.onUpdateAmount(info.Percent, info.FirstSide, info.Scale);
                }
            }
        }, this);
    }

    checkFormValid(formData){
        if (!formData.Amount || Number(formData.Amount)<=0){
            Notification.error(Intl.lang("mining."+(formData.FirstSide == 'buy' && formData.Type=="spot" ? "amount" : "volume")+".empty"));
            return false;
        }

        var range = this.getVolRange(formData.FirstSide);
        if (range){
            var min = range[0], max = range[1];
            if (formData.Amount<min || formData.Amount>max){
                Notification.error(Intl.lang("mining."+(formData.FirstSide == 'buy' && formData.Type=="spot" ? "amount" : "volume")+".range", min, max));
                return false;
            }
        }

        return true;
    }

    getVolRange(side){
        if (this.props.type=="spot"){
            if (side=='buy'){
                return [0.0001, 1000];
            }else{
                return [10, 100000];
            }
        }else{
            return [1, 100000];
        }
    }

    onChangeStatus() {
        var status = this.state.Status == 0 ? 1 : 0;
        var formData = {
            Type: this.props.type,
            FirstSide: this.state.FirstSide,
            Amount: Number(this.state.Amount),
            Percent: Number(this.state.Percent),
            Scale: Number(this.state.Scale),
            Interval: Number(this.state.Interval)
        };
        if (status){
            if (!this.checkFormValid(formData)) return;
        }

        //二次确认
        this.props.onConfirm(status, (result)=>{
            if (result){
                if (status){
                    Net.httpRequest("mining/robotOpen", formData, (data)=>{
                        if (data.Status==0){
                            // this.setState(Object.assign({Status: status}, formData));
                            this.loadMiningRobot();
                        }
                    }, this);
                }else{
                    Net.httpRequest("mining/robotClose", {Type:this.props.type}, (data)=>{
                        if (data.Status==0){
                            this.setState({Status: status});
                        }
                    }, this);
                }
            }
        });

    }

    onChangeFirstSide(e) {
        e.stopPropagation();

        var FirstSide = e.target.value;
        if (FirstSide != this.state.FirstSide) {
            this.setState({FirstSide});

            if (!this.state.Amount){
                this.onUpdateAmount(this.state.Percent, FirstSide, this.state.Scale);
            }
        }

    }

    onChangePercent(e) {
        e.stopPropagation();

        var Percent = e.target.value;
        this.setState({Percent});

        this.onUpdateAmount(Percent, this.state.FirstSide, this.state.Scale);
    }

    onUpdateAmount(percent, side, scale){
        var balance = this.getBalance(side);
        if (balance){
            if (this.props.type=="spot"){
                var Amount = Number(Decimal.accMul(balance, percent, side=='buy'?this.product.PriceFixed:this.product.VolFixed));
                if (Amount) this.setState({Amount});
                return Amount;
            }else{
                //1*5*13*6368
                var Amount = Number(Decimal.accMul(Decimal.accMul(Decimal.accMul(this.product.Scale*scale, balance), this.product.price.LAST), percent, 0));
                if (Amount) this.setState({Amount});
                return Amount;
            }
        }
    }

    getBalance(side){
        if (!AuthModel.checkUserAuth()) return;

        var walletInfo;
        var product = this.product;
        if (this.props.type=='futures'){
            if (product) walletInfo = AccountModel.getCurrencyWallet(CONST.WALLET.TYPE.FUT, product.Coin);
        }else{
            if (product){
                walletInfo = AccountModel.getCurrencyWallet(CONST.WALLET.TYPE.SPOT, CONST.CURRENCY[side=='buy'?product.toCode:product.fromCode]);
            }
        }
        if (walletInfo){
            return walletInfo.canUse;
        }
    }

    onChangeAmount(val) {
        // 自动买卖的数量，BTCUSD为合约张数，可选百分比，数量 = 百分比*可用余额*最新价，数值范围1 - 100000
        // TD/USDT买入时为金额，可选百分比，金额 = 百分比*可用USDT，数值范围等值10 – 100000TD；
        // TD/USDT卖出时为数量，可选百分比，数量 = 百分比*可用TD，数值范围10 – 100000TD
        if (this.state.Amount!=val) this.setState({Amount:val});
    }

    onChangeScale(e) {
        e.stopPropagation();

        var Scale = e.target.value;
        this.setState({Scale});
    }

    onChangeInterval(e) {
        e.stopPropagation();

        var Interval = e.target.value;
        this.setState({Interval});
    }

    render() {
        const {type} = this.props;
        const {FirstSide, Amount, Percent, Scale, Interval, Status, Commission, Expect} = this.state;

        const disabled = !!Status, langue = Intl.getLang();

        var fromFixed, PriceFixed,VolFixed;
        if (this.product){
            PriceFixed = this.product.PriceFixed;
            VolFixed = this.product.VolFixed
            fromFixed = type=='futures' ? this.product.ShowFixed : PriceFixed;
        }

        var range = this.getVolRange(FirstSide);
        return type == 'futures' ? (
                <MenuItem>
                    <span>{Intl.lang("mining.robot")}</span>
                    <span className="next-icon"><i className="iconfont icon-dropDown arrowdown fs12"></i></span>
                    <SubMenu className={"mining-setting "+ langue}>
                        <MenuItem tags="div">
                            <dl className="mining-detail">
                                <dt className="tl">{Intl.lang("mining.robot.open")}</dt>
                                <dd><span>{Intl.lang("mining.side")}</span><select className={"w-60 ml-10"+(disabled ? " disable" : "")} value={FirstSide}
                                                                                   onChange={this.onChangeFirstSide.bind(this)}
                                                                                   disabled={disabled}>
                                    {this.sides.map((v, i) => {
                                        return <option value={v} key={"side" + i}>{Intl.lang("mining.side." + v)}</option>
                                    })}
                                </select></dd>
                                <dd><span>{Intl.lang("mining.volume")}</span>
                                    <div className="slider-number-box w-60 ml-10"><NumberInput value={Amount}
                                                                                               onChange={this.onChangeAmount.bind(this)}
                                                                                               step={1}
                                                                                               min={range ? range[0] : 0}
                                                                                               max={range ? range[1] : 100000}
                                                                                               disabled={disabled}/></div>
                                    <select className={"w-60 ml-10"+(disabled ? " disable" : "")} value={Percent}
                                            onChange={this.onChangePercent.bind(this)} disabled={disabled}>
                                        {this.percents.map((v, i) => {
                                            return <option value={v} key={"per" + v}>{Decimal.toPercent(v)}</option>
                                        })}
                                    </select></dd>
                                <dd><span>{Intl.lang("mining.scale")}</span><select className={"w-60 ml-10"+(disabled ? " disable" : "")} value={Scale}
                                                                                    onChange={this.onChangeScale.bind(this)}
                                                                                    disabled={disabled}>
                                    {this.levers.map((v, i) => {
                                        return <option value={v} key={"scale" + v}>{v + 'x'}</option>
                                    })}
                                </select></dd>
                            </dl>
                            <dl className="mining-detail">
                                <dt>{Intl.lang("mining.closePos")}</dt>
                                <dd><span>{Intl.lang("mining.interval")}</span><select className={"w-60 ml-10"+(disabled ? " disable" : "")}
                                                                                       value={Interval}
                                                                                       onChange={this.onChangeInterval.bind(this)}
                                                                                       disabled={disabled}>
                                    {this.intervals.map((v) => {
                                        return <option value={v} key={"inte" + v}>{v + 's'}</option>
                                    })}
                                </select></dd>
                            </dl>
                            <dl className="mining-detail">
                                {disabled && <React.Fragment>
                                    <dt>{Intl.lang("mining.stat")}</dt>
                                    <dd><span>{Intl.lang("mining.commission")}</span><span
                                        className="mining-infoTxt">{String(Decimal.toFixed(Commission, fromFixed))+' '+this.fromSB}</span></dd>
                                    <dd><span>{Intl.lang("mining.expect")}</span><span
                                        className="mining-infoTxt">{String(Decimal.round(Expect, this.toFixed))+' '+this.toSB}</span></dd>
                                </React.Fragment>
                                }
                                <dd><Link to="/miningHistory"
                                          target="_blank">{Intl.lang("mining.log")}&gt;</Link></dd>
                            </dl>
                            <dl className="mining-foot flex-box flex-jc">
                                <span>{Intl.lang("mining.status0")}</span><span
                                className={Status ? "mining-open-btn on" : "mining-open-btn off"}
                                onClick={this.onChangeStatus.bind(this)}><i></i></span><span>{Intl.lang("mining.status1")}</span>
                            </dl>
                        </MenuItem>
                    </SubMenu>
                </MenuItem>
            ) :
            (<React.Fragment>
                <DropDown trigger="click" menuRef={() => this.menuRef} ref={(c) => this.dropDownRef = c}><p
                    className="head-border-full-p"><i className="iconfont icon-dropUp"></i>{Intl.lang("mining.robot")}
                </p></DropDown>
                <Contrainer ref={(c) => this.menuRef = c} pnRef={() => this.dropDownRef}>
                    <div className="mining-setting-box">
                        <dl className="ft-order-box mining-detail">
                            <dt className="tl">{Intl.lang("mining.robot.open")}</dt>
                            <dd><span>{Intl.lang("mining.side")}</span>
                                <select className={"w-60 ml-10"+(disabled?" disable":"")} value={FirstSide}
                                        onChange={this.onChangeFirstSide.bind(this)} disabled={disabled}>
                                    {this.sides.map((v, i) => {
                                        return <option value={v}
                                                       key={"side" + i}>{Intl.lang("mining.side." + v)}</option>
                                    })}
                                </select>
                            </dd>
                            <dd>
                                <span>{FirstSide == 'sell' ? Intl.lang("mining.volume") : Intl.lang("mining.amount")}</span>
                                <div className="slider-number-box w-60 ml-10">{FirstSide=='buy' ? <NumberInput key="spotbuy" value={Amount}
                                                                                           onChange={this.onChangeAmount.bind(this)}
                                                                                           step={1/Math.pow(10, PriceFixed)}
                                                                                           min={range ? range[0] : 0}
                                                                                           max={range ? range[1] : 100000}
                                                                                           disabled={disabled}/>
                                    : <NumberInput key="spotsell" value={Amount}
                                                   onChange={this.onChangeAmount.bind(this)}
                                                   step={1/Math.pow(10, VolFixed)}
                                                   min={range ? range[0] : 0}
                                                   max={range ? range[1] : 100000}
                                                   disabled={disabled}/>}
                                </div>
                                <select className={"w-60 ml-10"+(disabled ? " disable" : "")} value={Percent}
                                        onChange={this.onChangePercent.bind(this)} disabled={disabled}>
                                    {this.percents.map((v, i) => {
                                        return <option value={v} key={"per" + v}>{Decimal.toPercent(v)}</option>
                                    })}
                                </select>
                            </dd>
                        </dl>
                        <dl className="ft-order-box mining-detail">
                            <dt>{Intl.lang("mining.closePos")}</dt>
                            <dd><span>{Intl.lang("mining.interval")}</span><select className={"w-60 ml-10"+(disabled ? " disable" : "")}
                                                                                   value={Interval}
                                                                                   onChange={this.onChangeInterval.bind(this)}
                                                                                   disabled={disabled}>
                                {this.intervals.map((v) => {
                                    return <option value={v} key={"inte" + v}>{v + 's'}</option>
                                })}
                            </select></dd>
                        </dl>
                        <dl className="ft-order-box mining-detail">
                            {disabled && <React.Fragment>
                                <dt>{Intl.lang("mining.stat")}</dt>
                                <dd><span>{Intl.lang("mining.commission")}</span><span
                                    className="mining-infoTxt">{String(Decimal.toFixed(Commission, fromFixed))+' '+(this.fromSB)}</span></dd>
                                <dd><span>{Intl.lang("mining.expect")}</span><span
                                    className="mining-infoTxt">{String(Decimal.round(Expect, this.toFixed))+' '+(this.toSB)}</span></dd>
                            </React.Fragment>}
                            <dd><Link to="/miningHistory"
                                      target="_blank">{Intl.lang("mining.log")}&gt;</Link></dd>
                        </dl>
                        <div className="mining-foot flex-box flex-jc">
                            <span>{Intl.lang("mining.status0")}</span><span onClick={this.onChangeStatus.bind(this)}
                                                                            className={Status ? "mining-open-btn on" : "mining-open-btn off"}><i></i></span><span>{Intl.lang("mining.status1")}</span>
                        </div>
                    </div>
                </Contrainer>
            </React.Fragment>)
    }
}