import React from 'react';

import FutTradeModel from "../model/fut-trade";
import Intl from "../intl";
import AuthModel from "../model/auth";
import Net from "../net/net";
import Event from "../core/event";
import Notification from "../utils/notification";
import PureComponent from "../core/PureComponent";
import {IS_MINING_OPEN} from "../config";
import PopDialog from "../utils/popDialog";
import {DropDown, Menu, SubMenu, MenuItem} from './DropDown';
import {SingleSelect, SelectOption} from "./SingleSelect";
import NumberInput from "./NumberInput";
import FuturesCalculator from "./FuturesCalculator";


export default class FutSettingMenu extends PureComponent{
    constructor(props) {
        super(props);

        var state;
        if (this.props.name!='history'){
            var setting = FutTradeModel.setting;
            var Lang = Intl.getLang();
            state = {
                isOneKeyTrade: setting.isOneKeyTrade,
                colorTheme: setting.colorTheme,
                colorThemeView: setting.colorTheme,
                sizeTheme: setting.sizeTheme,
                quickMktLmt: setting.quickMktLmt,
                postOnlyExecInst: setting.postOnlyExecInst,
                expireParam: setting.expireParam,
                showBg: setting.showBg,
                showVolSum: setting.showVolSum,
                depthColumn: setting.depthColumn,
                Lang:Lang
            };

            this.maxDepth = 10;
            this.sellDepthOptionsMap = {
                "1": "Ask1",
                "2": "Ask1 - Ask2",
                "3": "Ask1 - Ask3",
                "4": "Ask1 - Ask4",
                "5": "Ask1 - Ask5",
                "6": "Ask1 - "
            };

            this.sellDepthOptions = Object.keys(this.sellDepthOptionsMap);

            this.sellDepthOtherOptionsMap = {};
            for (var i=6; i<=this.maxDepth; i++){
                this.sellDepthOtherOptionsMap[i] = "Ask"+i;
            }
            this.sellDepthOtherOptions = Object.keys(this.sellDepthOtherOptionsMap);

            if (setting.sellMDepth >= 6){
                state.sellDepth = 6;
                state.sellDepthOther = setting.sellMDepth - 5;
            }else{
                state.sellDepth = setting.sellMDepth;
                state.sellDepthOther = 0;
            }

            this.buyDepthOptionsMap = {
                "1": "Bid1",
                "2": "Bid1 - Bid2",
                "3": "Bid1 - Bid3",
                "4": "Bid1 - Bid4",
                "5": "Bid1 - Bid5",
                "6": "Bid1 - "
            };

            this.buyDepthOptions = Object.keys(this.buyDepthOptionsMap);

            this.buyDepthOtherOptionsMap = {};
            for (var i=6; i<=this.maxDepth; i++){
                this.buyDepthOtherOptionsMap[i] = "Bid"+i;
            }
            this.buyDepthOtherOptions = Object.keys(this.buyDepthOtherOptionsMap);

            if (setting.buyMDepth >= 6){
                state.buyDepth = 6;
                state.buyDepthOther = setting.buyMDepth - 5;
            }else{
                state.buyDepth = setting.buyMDepth;
                state.buyDepthOther = 0;
            }

            this.colorsOptionsMap = {};
            for (var i=1; i<=4; i++){
                this.colorsOptionsMap[i]= "trade.price.colorOptiongd";
            }
            for (var i=5; i<=7; i++){
                this.colorsOptionsMap[i]= "trade.price.colorOptiondt";
            }
            this.colorsOptions = Object.keys(this.colorsOptionsMap);

            this.expireParams = [0, 5, 30];
            if (this.expireParams.indexOf(state.expireParam)==-1){
                state.expireParamOther = state.expireParam>0 ? state.expireParam : "";
                state.expireParam = -1;
            }else{
                state.expireParamOther = "";
            }

            this.depthCounts = [0, 3, 5, 10];
            this.depthCountOptionsMap = {
                "1": "trade.depth.countOption1",
            };
            for (var i=2; i<=4; i++){
                this.depthCountOptionsMap[i] = "trade.depth.countOption"
            }
            this.depthCountOptions = Object.keys(this.depthCountOptionsMap);
            if (setting.hasOwnProperty("depthCount")){
                state.depthOption = this.depthCounts.indexOf(setting["depthCount"])+1;
            }

            this.tradeCounts = [5,10,15,20];
            if (setting.hasOwnProperty("tradeCount")){
                state.tradeCount = setting["tradeCount"];
            }
        }else{
            state = {
                Shared: false,
                Merged: false
            }
        }

        state.robotActivityOpen = IS_MINING_OPEN //挖矿活动是否打开

        this.state = state;
    }
    componentWillMount() {
        if (AuthModel.checkUserAuth()){
            if (this.props.name=='history'){
                this.loadSetting();
            }

            Event.addListener(Event.EventName.IS_ONEKEY_TRADE, this._onChangeOneKeyTrade.bind(this), this);
        }
    }
    loadSetting(){
        var CID = this.getProductID();
        if (CID){
            FutTradeModel.loadScheme(CID, (data)=>{
                this.setState(data);
            })
        }
    }
    _onChangeOneKeyTrade(isOneKeyTrade){
        this.setState({isOneKeyTrade});

        FutTradeModel.saveSetting("isOneKeyTrade", isOneKeyTrade);
    }
    saveHistorySetting(option, successCallback){
        var CID = this.getProductID();
        var Options = option;
        if (CID) Net.httpRequest("futures/scheme", {CID, Options}, (data)=>{
            if (data.Status==0){
                FutTradeModel.saveScheme(CID, Options);
                if (successCallback) successCallback();
            }
        }, this, 'put');
    }
    getProductID(){
        var product;
        var products = FutTradeModel.getProduct(this.props.code);
        if (products) product = products[0];
        if (product){
            return product.ID;
        }
    }
    onChangeShareValue(e){
        e.stopPropagation();

        if (FutTradeModel.orderList.length>0 || FutTradeModel.positionList.length>0){
            Notification.error(Intl.lang("trade.error.schemeShare"));
            return;
        }

        var data = {Shared: !this.state.Shared};
        var CID = this.getProductID();

        var msg = data.Shared ? "trade.setting.shared1" : "trade.setting.shared0";
        PopDialog.open(<FutOrderPreview product={FutTradeModel.getProductByID(CID)} action="setting" data={{msg}} onConfirm={(result)=>{
            if (result){
                this.saveHistorySetting(data, ()=>{
                    this.setState(data);
                    Event.dispatch(Event.EventName.SET_SHARED, data.Shared);
                });
            }
        }} />, "order-preview", true);
    }
    onChangeMergedValue(e){
        e.stopPropagation();

        var Merged = !this.state.Merged;

        var ne = e.nativeEvent;
        //二次确认
        var data = {Merged};
        var CID = this.getProductID();

        var msg = data.Merged ? "trade.setting.mergeOk" : "trade.setting.mergeCancel";
        PopDialog.open(<FutOrderPreview product={FutTradeModel.getProductByID(CID)} action="setting" data={{msg}} onConfirm={(result)=>{
            if (result){
                this.saveHistorySetting(data, ()=>{
                    this.setState(data);
                    Event.dispatch(Event.EventName.SET_MERGED, data.Merged);
                });
            }
        }} />, "order-preview", true);
    }
    onChangeOneKeyTrade(e){
        e.stopPropagation();

        var isOneKeyTrade = !this.state.isOneKeyTrade;
        this._onChangeOneKeyTrade(isOneKeyTrade);
    }
    onChangeDepth(type, e) {
        // e.stopPropagation();

        var value = e.target.value;
        var data = {};
        data[type==1?"sellDepth":"buyDepth"] = value;
        this.setState(data);

        FutTradeModel.saveSetting(type==1?"sellMDepth":"buyMDepth", Number(value)<6 ? Number(value) : 6);
    }
    onChangeDepthOther(type, value){
        let e = event || window.event;
        e.stopPropagation();

        var data = {};
        data[type==1?"sellDepthOther":"buyDepthOther"] = value;
        this.setState(data);

        FutTradeModel.saveSetting(type==1?"sellMDepth":"buyMDepth", Number(value)+5);
    }
    onChangeDepthColumn(e){
        e.stopPropagation();

        var value = e.target.value;

        var data = {"depthColumn":Number(value)};
        if (value==1) data.showVolSum = false;
        this.setState(data);

        FutTradeModel.saveSetting("depthColumn", Number(value));
    }
    onChangeColorTheme(e){
        e.stopPropagation();

        var value = e.target.value;
        this.setState({colorTheme: value});

        FutTradeModel.saveSetting("colorTheme", Number(value));
    }
    onChangeColorThemeView(value, e){
        e.stopPropagation();

        this.setState({colorThemeView: value});
    }
    onChangeSizeTheme(e){
        e.stopPropagation();

        var value = e.target.value;
        this.setState({sizeTheme: value});

        FutTradeModel.saveSetting("sizeTheme", Number(value));
    }
    onChangeDepthCount(e){
        e.stopPropagation();

        var value = e.target.value;
        this.setState({depthOption: value});

        FutTradeModel.saveSetting("depthCount", this.depthCounts[Number(value)-1]);
    }
    onChangeShowBg(e){
        e.stopPropagation();

        var showBg = !this.state.showBg;
        this.setState({showBg});

        FutTradeModel.saveSetting("showBg", showBg);
    }
    onChangeShowVolSum(e){
        e.stopPropagation();

        var showVolSum = !this.state.showVolSum;
        this.setState({showVolSum});

        FutTradeModel.saveSetting("showVolSum", showVolSum);
    }
    onChangeQuickMktLmt(e){
        e.stopPropagation();

        var quickMktLmt = e.target.value;
        this.setState({quickMktLmt});

        FutTradeModel.saveSetting("quickMktLmt", quickMktLmt);
    }
    onChangeExpireParam(e){
        e.stopPropagation();

        var expireParam = e.target.value;
        this.setState({expireParam});

        FutTradeModel.saveSetting("expireParam", expireParam);
    }
    onChangePostOnlyExecInst(e){
        e.stopPropagation();

        var postOnlyExecInst = !this.state.postOnlyExecInst;
        this.setState({postOnlyExecInst});

        FutTradeModel.saveSetting("postOnlyExecInst", postOnlyExecInst);
    }
    onChangeExpireParamInput(expireParamOther){
        this.setState({expireParam:-1, expireParamOther:expireParamOther});

        FutTradeModel.saveSetting("expireParam", expireParamOther);
    }
    onChangeTradeCount(e){
        e.stopPropagation();

        var value = e.target.value;
        this.setState({tradeCount: value});

        FutTradeModel.saveSetting("tradeCount", Number(value));
    }
    setMenuRef(c){
        this.menuRef = c;
    }
    onMiningRobotConfirm(status, callback){
        var CID = this.getProductID();

        var msg = status ? "mining.confirm.open" : "mining.confirm.close";
        PopDialog.open(<FutOrderPreview product={FutTradeModel.getProductByID(CID)} action="setting" data={{msg}} onConfirm={(result)=>{
            if (callback) callback(result);
        }} />, "order-preview", true);
    }
    openCalculator(){
        var CID = this.getProductID();
        PopDialog.open(<FuturesCalculator product={FutTradeModel.getProductByID(CID)} />, "fut-calc")
    }
    render(){
        const {name, isExpert, side} = this.props;
        const {isOneKeyTrade, sellDepth, sellDepthOther, buyDepth, buyDepthOther, colorTheme, sizeTheme, colorThemeView,depthColumn,
            depthOption, tradeCount, showBg, showVolSum, quickMktLmt, postOnlyExecInst, expireParam, expireParamOther,
            Shared, Merged, robotActivityOpen} = this.state;

        return (
            <span className="order-menu-box">
                {name=="newOrder" && <i className="iconfont icon-calculator fs14 ver-md" onClick={this.openCalculator.bind(this)}></i>}
                <DropDown trigger="click" menuRef={()=>this.menuRef} ref={(c)=>this.dropDownRef=c}>
                <i className="iconfont icon-category pd010 ver-md dis-inb fs12"></i>
                </DropDown>
                {name=="newOrder" &&
                <Menu className="order-menu-setting dire-r lh-25" ref={this.setMenuRef.bind(this)} pnRef={()=>this.dropDownRef} style={{maxWidth:"164px"}} side={side}>
                    {!!robotActivityOpen && <MiningRobot type="futures" code={this.props.code} onConfirm={this.onMiningRobotConfirm.bind(this)}/>}
                    <MenuItem>
                        <label className="custom-checkbox wp-100">
                            <div><input type="checkbox" className="input_check" checked={isOneKeyTrade} onChange={this.onChangeOneKeyTrade.bind(this)}/><i></i></div>
                            <span>{Intl.lang("trade.settingMenu.oneKeyTrade")}</span>
                        </label>
                    </MenuItem>
                    {isExpert &&
                    <MenuItem>
                        <span>{Intl.lang("trade.settingMenu.price")}</span>
                        <span className="pdl-10 c-down"><i
                            className="iconfont icon-dropDown arrowdown fs12"></i></span>
                        <SubMenu className="menu-grade2 drop-child" tags="dl">
                            <MenuItem tags="dd">
                                <span>{Intl.lang("trade.settingMenu.sellDepth")}</span>
                                <span className="next-icon"><i
                                    className="iconfont icon-dropDown arrowdown fs12"></i></span>
                                <SubMenu className="menu-grade3 ft-order-box" style={{width:"112px"}}>
                                    {this.sellDepthOptions.map((v, i)=>{
                                        var select;
                                        if (v == "6"){
                                            var options = this.sellDepthOtherOptions.map((sv, si)=>{
                                                return <SelectOption value={sv} key={si}>{this.sellDepthOtherOptionsMap[sv]}</SelectOption>
                                            });
                                            select = <SingleSelect value={sellDepthOther} onChange={this.onChangeDepthOther.bind(this, 1)}>{options}</SingleSelect>
                                        }
                                        return <MenuItem key={i}>
                                            <label className="custom-label wp-100">
                                                <input className="custom-radio" type="radio" name="sellDepth" value={v} checked={v==sellDepth} onChange={this.onChangeDepth.bind(this, 1)} />
                                                <span className="custom-radioInput"></span><span className="dis-inb">{this.sellDepthOptionsMap[v]}</span><div className="ask-sel">{select}</div>
                                            </label>
                                        </MenuItem>
                                    })}
                                </SubMenu>
                            </MenuItem>
                            <MenuItem tags="dd">
                                <span>{Intl.lang("trade.settingMenu.buyDepth")}</span>
                                <span className="next-icon"><i
                                    className="iconfont icon-dropDown arrowdown fs12"></i></span>
                                <SubMenu className="menu-grade3 ft-order-box" style={{width:"112px"}}>
                                    {this.buyDepthOptions.map((v, i)=>{
                                        var select;
                                        if (v == "6"){
                                            var options = this.buyDepthOtherOptions.map((sv, si)=>{
                                                return <SelectOption value={sv} key={si}>{this.buyDepthOtherOptionsMap[sv]}</SelectOption>
                                            });
                                            select = <SingleSelect value={buyDepthOther} onChange={this.onChangeDepthOther.bind(this, 2)}>{options}</SingleSelect>
                                        }
                                        return <MenuItem key={i}>
                                            <label className="custom-label wp-100">
                                                <input className="custom-radio" type="radio" name="buyDepth" value={v} checked={v==buyDepth} onChange={this.onChangeDepth.bind(this, 2)} />
                                                <span className="custom-radioInput"></span><span className="dis-inb">{this.buyDepthOptionsMap[v]}</span><div className="ask-sel">{select}</div>
                                            </label>
                                        </MenuItem>
                                    })}
                                </SubMenu>
                            </MenuItem>
                            <MenuItem tags="dd">
                                <span>{Intl.lang("trade.price.colorTheme")}</span>
                                <span className="next-icon"><i className="iconfont icon-dropDown arrowdown fs12"></i></span>
                                <SubMenu className="menu-grade3">
                                    {this.colorsOptions.map((v, i)=>{
                                        var text = v < 5 ? Intl.lang(this.colorsOptionsMap[v], v) : Intl.lang(this.colorsOptionsMap[v], Number(v)-4);
                                        return <MenuItem key={i} onMouseOver={this.onChangeColorThemeView.bind(this, v)}>
                                            <label className="custom-label wp-100">
                                                <input className="custom-radio" type="radio" name="colorTheme" value={v} checked={v==colorTheme} onChange={this.onChangeColorTheme.bind(this)}/>
                                                <span className="custom-radioInput"></span><span>{text}</span>
                                            </label>
                                        </MenuItem>
                                    })}
                                    <MenuItem className={"color-scheme color-syle"+colorThemeView}>
                                        <div className="tr"><i className="iconfont icon-down c1"></i><span
                                            className="pd010 tb c1">=</span><i className="iconfont icon-up c2"></i></div>
                                        <div>
                                            <span>{Intl.lang("trade.price.buyColor")}</span>
                                            {(colorThemeView==6 || colorThemeView==7) ? <span className={this.state.Lang=="en-us" ? "tr ver-md ver-md-ml-15" :"tr ver-md ver-md-ml-14" }>
                                            <span className="scheme sc1"></span>
                                            <span className="scheme mg-010">
                                                <span className="sc1"></span>
                                                <span className="sc2"></span>
                                            </span>
                                            <span className="scheme sc2"></span>
                                            </span> : <span className={this.state.Lang=="en-us" ? "tr ver-md ver-md-ml-15" :"tr ver-md ver-md-ml-14" }>
                                            <span className="scheme sc1"></span>
                                            <span className={colorThemeView==5?"scheme sc3 mg-010":"scheme sc1 mg-010"}></span>
                                            <span className={colorThemeView==5?"scheme sc2":"scheme sc1"}></span>
                                            </span>}
                                        </div>
                                        <div>
                                            <span>{Intl.lang("trade.price.sellColor")}</span>
                                            {(colorThemeView==6 || colorThemeView==7) ? <span className="tr ver-md ver-md-ml-14">
                                            <span className="scheme sc1"></span>
                                            <span className="scheme sc2 mg-010">
                                                <span className="sc1"></span>
                                                <span className="sc2"></span>
                                            </span>
                                            <span className="scheme sc2"></span>
                                            </span> : <span className="tr ver-md ver-md-ml-14">
                                            <span className={colorThemeView==5?"scheme sc1":"scheme sc2"}></span>
                                            <span className={colorThemeView==5?"scheme sc3 mg-010":"scheme sc2 mg-010"}></span>
                                            <span className="scheme sc2"></span>
                                            </span>}
                                        </div>
                                    </MenuItem>
                                </SubMenu>
                            </MenuItem>
                            <MenuItem tags="dd">
                                <span>{Intl.lang("trade.price.sizeTheme")}</span>
                                <span className="next-icon"><i
                                    className="iconfont icon-dropDown arrowdown fs12"></i></span>
                                <SubMenu className="menu-grade3 ft-order-box">
                                    {[1, 2, 3].map((v, i)=>{
                                        return <MenuItem key={i}>
                                            <label className="custom-label wp-100">
                                                <input className="custom-radio" type="radio" name="sizeTheme" value={v} checked={v==sizeTheme} onChange={this.onChangeSizeTheme.bind(this)} />
                                                <span className="custom-radioInput"></span><span>{Intl.lang("trade.price.sizeOption", v)}</span>
                                            </label>
                                        </MenuItem>
                                    })}
                                </SubMenu>
                            </MenuItem>
                            <MenuItem className="ft-bd-t" tags="dd">
                                <label className="custom-label wp-100">
                                    <input className="custom-radio" type="radio" name="quickMktLmt" value={0} checked={quickMktLmt==0} onChange={this.onChangeQuickMktLmt.bind(this)}/>
                                    <span className="custom-radioInput"></span><span>{Intl.lang("trade.price.marketTrade")}</span>
                                </label>
                            </MenuItem>
                            <MenuItem tags="dd">
                                <span className="next-icon"><i className="iconfont icon-dropDown arrowdown fs12"></i></span>
                                <label className="custom-label wp-100">
                                    <input className="custom-radio" type="radio" name="quickMktLmt" value={1} checked={quickMktLmt==1} onChange={this.onChangeQuickMktLmt.bind(this)}/>
                                    <span className="custom-radioInput"></span><span>{Intl.lang("trade.price.limitTrade")}</span>
                                </label>
                                <SubMenu className="menu-grade3 ft-order-box">
                                    <MenuItem className="ft-bd-b">
                                        <label className="custom-checkbox wp-100">
                                            <div><input type="checkbox" className="input_check" checked={postOnlyExecInst} onChange={this.onChangePostOnlyExecInst.bind(this)} /><i></i></div>
                                            <span>{Intl.lang("trade.open.beidong")}</span>
                                        </label>
                                    </MenuItem>

                                    {this.expireParams.map((v, i)=>{
                                        return <MenuItem key={i}>
                                            <label className="custom-label wp-100">
                                                <input className="custom-radio" type="radio" name="expireParam" value={v} checked={v==expireParam} onChange={this.onChangeExpireParam.bind(this)}/>
                                                <span className="custom-radioInput"></span><span>{v==0 ? 'GTC' : Intl.lang("trade.price.sec", v)}</span>
                                            </label>
                                        </MenuItem>
                                    })}
                                    <MenuItem>
                                        <label className="custom-label wp-100">
                                            <input className="custom-radio" type="radio" name="expireParam" value={-1} checked={expireParam==-1} onChange={this.onChangeExpireParam.bind(this)} />
                                            <span className="custom-radioInput"></span>
                                            <span><NumberInput className="custom-input w-45" value={expireParamOther} onChange={this.onChangeExpireParamInput.bind(this)} step={1} /><span className="pdl-5">{Intl.lang("common.sec")}</span></span>
                                        </label>
                                    </MenuItem>
                                </SubMenu>
                            </MenuItem>
                        </SubMenu>
                    </MenuItem>}
                </Menu>}
                {name=="depth" &&
                <Menu className="order-menu-setting dire-r lh-25" ref={this.setMenuRef.bind(this)} side={side}>
                    {this.depthCountOptions.map((v, i)=>{
                        var text = v==1 ? Intl.lang(this.depthCountOptionsMap[v]) : Intl.lang(this.depthCountOptionsMap[v], this.depthCounts[Number(v)-1]);
                        return <MenuItem key={i}>
                            <label className="custom-label wp-100">
                                <input className="custom-radio" type="radio" name="depthCount" value={v} checked={v==depthOption} onChange={this.onChangeDepthCount.bind(this)}/>
                                <span className="custom-radioInput"></span><span>{text}</span>
                            </label>
                        </MenuItem>
                    })}
                    <MenuItem>
                        <label className="custom-checkbox wp-100">
                            <div><input type="checkbox" className="input_check" checked={showBg} onChange={this.onChangeShowBg.bind(this)}/><i></i></div>
                            <span>{Intl.lang("trade.depth.showBg")}</span>
                        </label>
                    </MenuItem>
                    <MenuItem>
                        <label className={"custom-checkbox wp-100"+(depthColumn==1?" disable":"")}>
                            <div><input type="checkbox" className="input_check" checked={showVolSum} disabled={depthColumn==1} onChange={this.onChangeShowVolSum.bind(this)}/><i></i></div>
                            <span>{Intl.lang("trade.depth.showVolSum")}</span>
                        </label>
                    </MenuItem>
                    <MenuItem className="ft-bd-t">
                        <label className="custom-label">
                            <input className="custom-radio" type="radio" name="depthColumn" value={1} checked={depthColumn==1} onChange={this.onChangeDepthColumn.bind(this)} />
                            <span className="custom-radioInput"></span><span>{Intl.lang("trade.depth.oneRow")}</span>
                        </label>
                        <label className="custom-label pdl-10">
                            <input className="custom-radio" type="radio" name="depthColumn" value={2} checked={depthColumn==2} onChange={this.onChangeDepthColumn.bind(this)} />
                            <span className="custom-radioInput"></span><span>{Intl.lang("trade.depth.twoRow")}</span>
                        </label>
                    </MenuItem>
                </Menu>}
                {name=="trade" &&
                <Menu className="order-menu-setting dire-r lh-25" ref={this.setMenuRef.bind(this)} side={side}>
                    {this.tradeCounts.map((v, i)=>{
                        return <MenuItem key={i}>
                            <label className="custom-label wp-100">
                                <input className="custom-radio" name="tradeCount" type="radio" value={v} checked={v==tradeCount} onChange={this.onChangeTradeCount.bind(this)}/>
                                <span className="custom-radioInput"></span><span>{Intl.lang("trade.depth.countOption", v)}</span>
                            </label>
                        </MenuItem>
                    })}
                </Menu>}
                {name=="history" &&
                <Menu className="order-menu-setting dire-r lh-25" ref={this.setMenuRef.bind(this)}>
                    <MenuItem>
                        <label className="custom-label wp-100">
                            <input className="custom-radio" type="radio" name="Shared" checked={!Shared} onChange={this.onChangeShareValue.bind(this)}/>
                            <span className="custom-radioInput"></span><span>{Intl.lang('FuturesSeting.shared0')}</span>
                        </label>
                    </MenuItem>
                    <MenuItem className="ft-bd-b">
                        <label className="custom-label wp-100">
                            <input className="custom-radio" type="radio" name="Shared" checked={Shared} onChange={this.onChangeShareValue.bind(this)}/>
                            <span className="custom-radioInput"></span><span>{Intl.lang('FuturesSeting.shared1')}</span>
                        </label>
                    </MenuItem>
                    <MenuItem>
                        <label className="custom-checkbox wp-100">
                            <div><input type="checkbox" className="input_check" checked={Merged} onChange={this.onChangeMergedValue.bind(this)}/><i></i></div>
                            <span>{Intl.lang('FuturesSeting.merge')}</span>
                        </label>
                    </MenuItem>
                </Menu>}
            </span>
        )
    }
}
