//入市中的被动委托 隐藏 有效时间 部分
import React from 'react';

import Intl from "../intl";
import {CONST} from "../public/const";
// import ReactTooltip from "react-tooltip";
import SysTime from "../model/system";
import PureComponent from "../core/PureComponent";
import moment from "moment/moment";

import OptionsNumberInput from "./OptionsNumberInput"
import {SingleSelect, SelectOption} from "./SingleSelect";

import TimerNumberInput from "./TimerNumberInput"
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import ToolTip from "./ToolTip";

export default class DelegrateQtyExpireTimePart extends PureComponent{
    constructor(props) {
        super(props);

        this.expireOptionsMap = {
            "1": "GTC",
            "2": "trade.open.expireOption2",
            "3": "trade.open.expireOption3"
        };
        if (this.props.isSimple) this.expireOptionsMap["1"] = "trade.open.gtcText";
        this.expireOptions = Object.keys(this.expireOptionsMap);

        this.expireType2OptionsMap = {
            "1": "common.min",
            "2": "common.hour"
        }
        this.expireType2Options = Object.keys(this.expireType2OptionsMap);

        var nowTs = SysTime.getServerTimeStamp(true);
        var tzOffsetMin = SysTime.svrTzMin;
        var tzOffsetHour = tzOffsetMin/60;

        var hourOffset = "0"+Math.abs(tzOffsetHour)+"00";
        this.tzOffsetHour = (this.tzOffsetHour<0?"-":"+")+hourOffset.substr(-4);

        this.minDate = moment(nowTs);

        var state = {
            hideDisplayQty: false, //隐藏
            displayQty:"0",           //显示数量
            postOnlyExecInst: false, //被动委托
            expireType: 1, //过期时间类型
            expireType2Type: "1", //过期类型2的选项
            expireType2Time:"10", //过期类型2的时间值
            selectDate: moment(nowTs),
            utcTime:moment(nowTs+30*60*1000).utcOffset(tzOffsetMin).format('HH:mm')+':00'
        };

        if (this.props.order){
            var order = this.props.order;
            Object.assign(state, {
                hideDisplayQty: order.Visible!=-1,
                displayQty: order.Visible!=-1 ? String(order.Visible) : "0",
                postOnlyExecInst: !!order.Passive,
                expireType: order.Timely==CONST.FUT.Timely.GTC ? 1 : (order.Timely==CONST.FUT.Timely.LIFE ? 2 : 3),
                expireType2Type:"1",
                expireType2Time: order.Timely==CONST.FUT.Timely.LIFE ? parseInt(order.TimelyParam/60) : "10",
                isModify: true,
                isTriggerred: order.State>=CONST.FUT.State.TRIGGERRED //订单是否已触发
            });
            if (order.Timely==CONST.FUT.Timely.DEADLINE){
                var sd = moment(order.TimelyParam*1000);
                state.selectDate = sd;
                state.utcTime = sd.utcOffset(tzOffsetMin).format('HH:mm:ss');
            }
        }

        this.state = state;
    }

    minTime(){
        var nowTs = SysTime.getServerTimeStamp(true);
        var tzOffsetMin = SysTime.svrTzMin;
        return moment(nowTs).utcOffset(tzOffsetMin);
    }

    componentDidMount() {
        // ReactTooltip.rebuild();
    }
    val(){
        var data = this.state;
        var formData = {
            Timely: data.expireType==1 ? CONST.FUT.Timely.GTC : (data.expireType==2 ? CONST.FUT.Timely.LIFE : CONST.FUT.Timely.DEADLINE),
            TimelyParam: data.expireType==1 ? 0 : (data.expireType==2 ? (data.expireType2Time && !isNaN(data.expireType2Time) ? Number(data.expireType2Time)*(data.expireType2Type==1 ? 60 : 3600) : null) : (data.selectDate ? (moment(data.selectDate.format("YYYY-MM-DD")+ ' '+ data.utcTime+ " "+this.tzOffsetHour, "YYYY-MM-DD HH:mm:ss Z").unix()) : null)),
            Passive: data.postOnlyExecInst,
            Visible: !data.hideDisplayQty ? -1 : (data.displayQty && !isNaN(data.displayQty) ? Number(data.displayQty) : null),
        }
        return formData;
    }
    onChangeHideDisplayQty(e){
        e.stopPropagation();

        var value = e.target.checked;
        var data = {hideDisplayQty:value};
        if (value && this.state.postOnlyExecInst){
            data.postOnlyExecInst = false;
        }
        this.setState(data, ()=>{
            // ReactTooltip.rebuild();
        });
    }
    onChangePostOnlyExecInst(e){
        e.stopPropagation();

        var value = e.target.checked;
        var data = {postOnlyExecInst:value};
        if (value && this.state.hideDisplayQty){
            data.hideDisplayQty = false;
        }
        this.setState(data);
    }
    onChangeExpireType(e){
        e.stopPropagation();

        var value = e.target.value;
        this.onChangeExpireTypeValue(value);
    }
    onChangeExpireTypeValue(expireType){
        if (this.state.expireType!=expireType){
            this.setState({expireType});
        }
    }
    onChangeDisplayQty(value){
        this.setState({displayQty: value});
    }
    onChangeExpireType2Type(value){
        // e.stopPropagation();
        //
        // var value = e.target.value;
        this.setState({expireType2Type:value});
    }
    onChangeExpireType2Time(value){
        this.setState({expireType2Time: value});
    }
    startDateChange(date){
        this.setState({selectDate:date});
    }
    onChangeUtcTime(value){
        this.setState({utcTime: value});
    }
    onChangeDate(type, value=1){
        var newDate;
        var selectDate = this.state.selectDate;
        if(type==1){
            newDate = selectDate.add(value, 'days');
        }else{
            var ts =  selectDate.diff(this.minDate);
            if (ts<=0) return;

            newDate = selectDate.subtract(value, 'days');
        }
        this.startDateChange(newDate);
    }
    render(){
        const {quickDisable, volume, isSimple, hideBeidongOption, hideQtyOption} = this.props;
        const {hideDisplayQty,displayQty,postOnlyExecInst,expireType,selectDate, expireType2Type,expireType2Time,utcTime,isModify,isTriggerred} = this.state;

        return !isSimple ? (
            <React.Fragment>
                <div className={"flex-box flex-jc lh-24 pdl-20"+(hideBeidongOption && hideQtyOption ? " hide":"")}>
                    <label className="custom-checkbox"><ToolTip title={Intl.lang("trade.open.beidongTip")}><span className="mr-20 cur-hover">{Intl.lang("trade.open.beidong")}</span></ToolTip>
                        <div><input type="checkbox" className="input_check" disabled={!quickDisable} onChange={this.onChangePostOnlyExecInst.bind(this)} checked={postOnlyExecInst}/><i></i></div>
                    </label>
                    <label className="custom-checkbox"><ToolTip title={Intl.lang("trade.open.hideQtyTip2")}><span className="mr-20 cur-hover">{Intl.lang("trade.open.hideDelegate")}</span></ToolTip>
                        <div><input type="checkbox" className="input_check" disabled={!quickDisable} onChange={this.onChangeHideDisplayQty.bind(this)} checked={hideDisplayQty} /><i></i></div>
                    </label>
                </div>
                {(hideDisplayQty && !postOnlyExecInst) &&
                <div className="mt-3 flex-box flex-end">
                    <ToolTip title={Intl.lang("trade.open.hideQtyTip")}><div className="pos-r pdr-20 lh-24"><span className="cur-hover">{Intl.lang("trade.open.displayQty")}</span><i className="iconfont icon-question fs12"></i></div></ToolTip>
                    <OptionsNumberInput value={displayQty} step={1} className={quickDisable?"slider-number-box":"slider-number-box disable"} disabled={!quickDisable} min={0} max={Number(volume)-1} onChange={this.onChangeDisplayQty.bind(this)} />
                </div>}
                <div className="flex-box flex-jc lh-24">
                    {this.expireOptions && this.expireOptions.map((v, i)=>{
                        var text = v==1 ? <ToolTip title={Intl.lang("trade.open.gtc")}><span className="cur-hover">{this.expireOptionsMap[v]}</span></ToolTip> : <span title={Intl.lang(this.expireOptionsMap[v])}>{Intl.lang(this.expireOptionsMap[v])}</span>;
                        return <label className="custom-label f-tof" key={i} style={i>0?{maxWidth:"130px"}:{}}>
                            <input className="custom-radio" type="radio" name="expire-radio" disabled={!quickDisable} checked={v==expireType} value={v} onChange={this.onChangeExpireType.bind(this)}/>
                            <span className="custom-radioInput"></span>{text}
                        </label>
                    })}
                </div>
                {(expireType==2) &&
                <div className="mt-3 flex-box flex-end">
                    <OptionsNumberInput className="slider-number-box mr-10" inputClassName="limit-min" disabled={!quickDisable} min={1} max={1000000} step={1} value={expireType2Time} onChange={this.onChangeExpireType2Time.bind(this)}/>
                    <SingleSelect className="w-100 sel-cus" disabled={!quickDisable} value={expireType2Type} onChange={this.onChangeExpireType2Type.bind(this)}>
                        {this.expireType2Options && this.expireType2Options.map((v, i)=>{
                            return <SelectOption value={v} key={i}>{Intl.lang(this.expireType2OptionsMap[v])}</SelectOption>
                        })}
                    </SingleSelect>
                </div>}
                {(expireType==3) &&
                <div className="mt-5 flex-box flex-end pos-r">
                    <div className="slider-number-box pos-st">
                        <span className="slider-date">
                            <DatePicker dateFormat="YYYY-MM-DD" className="date-class"
                                        utcOffset={0}
                                        selected={selectDate}
                                        minDate={this.minDate}
                                        onChange={this.startDateChange.bind(this)}>
                            </DatePicker>
                        </span>
                        <div className="arrow-box">
                            <span className={quickDisable?"iconfont icon-dropUp arrowup":"iconfont icon-dropUp arrowup disable"} onClick={()=>this.onChangeDate(1)}></span>
                            <span className={quickDisable?"iconfont icon-dropDown arrowdown":"iconfont icon-dropDown arrowdown disable"} onClick={()=>this.onChangeDate(-1)}></span>
                        </div>
                    </div>
                    <span className="iconfont icon-date pos-r pd010 lh-25">
                        <DatePicker dateFormat="YYYY-MM-DD"
                                    utcOffset={0}
                                    selected={selectDate}
                                    minDate={this.minDate}
                                    onChange={this.startDateChange.bind(this)}>
                        </DatePicker>
                    </span>
                    <TimerNumberInput className="slider-number-box user-select" disabled={!quickDisable} value={utcTime} min={this.minTime} date={selectDate} format="HH:mm" onChange={this.onChangeUtcTime.bind(this)} />
                    <span className="limit-txt lh-25 tc"></span>
                </div>}
            </React.Fragment>
        ) : (
            <React.Fragment>
                <dl className={"mt-10 ft-easy-block"+(hideBeidongOption && hideQtyOption ? " hide":"")}>
                    <dt></dt>
                    <dd className="block-right">
                        <label className="custom-checkbox"><ToolTip title={Intl.lang("trade.open.beidongTip")}><span className="mr-20 cur-hover">{Intl.lang("trade.open.beidong")}</span></ToolTip>
                            <div><input type="checkbox" className="input_check" disabled={!quickDisable } onChange={this.onChangePostOnlyExecInst.bind(this)} checked={postOnlyExecInst}/><i></i></div>
                        </label>
                        <label className="custom-checkbox"><ToolTip title={Intl.lang("trade.open.hideQtyTip2")}><span className="mr-20 cur-hover">{Intl.lang("trade.open.hideDelegate")}</span></ToolTip>
                            <div><input type="checkbox" className="input_check" disabled={!quickDisable } onChange={this.onChangeHideDisplayQty.bind(this)} checked={hideDisplayQty} /><i></i></div>
                        </label>
                    </dd>
                </dl>
                {(!hideQtyOption && hideDisplayQty && !postOnlyExecInst) &&
                <dl className="ft-easy-block">
                    <dt></dt>
                    <dd className="block-right">
                        <div className="mt-3 ft-easy-tab">
                            <ToolTip title={Intl.lang("trade.open.hideQtyTip")}>
                                <div className="pos-r pdr-20 lh-24">
                                    <span className="cur-hover">{Intl.lang("trade.open.displayQty")}</span>
                                    <i className="iconfont icon-question fs12"></i>
                                </div>
                            </ToolTip>
                            <OptionsNumberInput value={displayQty} step={1} className={quickDisable?"slider-number-box":"slider-number-box disable"} disabled={!quickDisable} min={0} max={Number(volume)-1} onChange={this.onChangeDisplayQty.bind(this)} />
                        </div>
                    </dd>
                </dl>}
                <dl className="mt-10 ft-easy-block">
                    <dt></dt>
                    <dd className="block-right">
                        <SingleSelect className="select wp-100 sel-cus fl selection" value={expireType} onChange={this.onChangeExpireTypeValue.bind(this)}>
                            {this.expireOptions && this.expireOptions.map((v, i)=>{
                                return <SelectOption className={this.state.Lang=="en-us" ?"selectOp-font":null} value={v} key={"et"+v}>{Intl.lang(this.expireOptionsMap[v])}</SelectOption>
                            })}
                        </SingleSelect>
                    </dd>
                </dl>
                {(expireType==2) &&
                <dl className="mt-5 ft-easy-block">
                    <dt></dt>
                    <dd className="block-right">
                        <OptionsNumberInput className="slider-number-box mr-10" inputClassName="limit-min" disabled={!quickDisable} min={1} max={1000000} step={1} value={expireType2Time} onChange={this.onChangeExpireType2Time.bind(this)}/>
                        <SingleSelect className="w-100 sel-cus" disabled={!quickDisable} value={expireType2Type} onChange={this.onChangeExpireType2Type.bind(this)}>
                            {this.expireType2Options && this.expireType2Options.map((v, i)=>{
                                return <SelectOption value={v} key={i}>{Intl.lang(this.expireType2OptionsMap[v])}</SelectOption>
                            })}
                        </SingleSelect>
                    </dd>
                </dl>}
                {(expireType==3) &&
                <dl className="mt-5 ft-easy-block">
                    <dt></dt>
                    <dd className="block-right">
                        <div className="slider-number-box">
                            <DatePicker dateFormat="YYYY-MM-DD" className="date-class"
                                        utcOffset={0}
                                        selected={selectDate}
                                        minDate={this.minDate}
                                        onChange={this.startDateChange.bind(this)}>
                            </DatePicker>
                            <div className="arrow-box">
                                <span className={quickDisable?"iconfont icon-dropUp arrowup":"iconfont icon-dropUp arrowup disable"} onClick={()=>this.onChangeDate(1)}></span>
                                <span className={quickDisable?"iconfont icon-dropDown arrowdown":"iconfont icon-dropDown arrowdown disable"} onClick={()=>this.onChangeDate(-1)}></span>
                            </div>
                        </div>
                        <span className="iconfont icon-date pd010">
                            <DatePicker dateFormat="YYYY-MM-DD"
                                        utcOffset={0}
                                        selected={selectDate}
                                        minDate={this.minDate}
                                        onChange={this.startDateChange.bind(this)}>
                            </DatePicker>
                        </span>
                        <TimerNumberInput className="slider-number-box user-select" disabled={!quickDisable} value={utcTime} min={this.minTime} date={selectDate} format="HH:mm" onChange={this.onChangeUtcTime.bind(this)} />
                    </dd>
                </dl>}
            </React.Fragment>
        )
    }
}
