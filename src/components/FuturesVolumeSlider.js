import React from 'react';

import PureComponent from "../core/PureComponent";
import FutTradeModel from "../model/fut-trade";
import Intl from "../intl";
import Decimal from "../utils/decimal";
import OptionsNumberInput from "./OptionsNumberInput"
import Event from "../core/event";
import {CONST} from "../public/const";
import AccountModel from "../model/account";
import {isMobile} from "../utils/common";
// import AuthModel from "../model/auth";

const $ = window.$;

export default class FutVolumeSlider extends PureComponent {
    constructor(props) {
        super(props);

        this.isMobile = isMobile();
        // this.volPercentKey = 'volp';
        this.volOptions = FutTradeModel.formVar.volOptions;

        this.isInitedValue = false;

        this.state = {
            value: this.props.value,
            isWalletUpdate: false,
            percent: 0
        };
    }

    componentWillMount() {
        Event.addListener(Event.EventName.WALLET_UPDATE, this.onForceUpdate.bind(this), this);

        this.onForceUpdate();
    }

    onForceUpdate(){
        if (this.props.product){
            var wallet = AccountModel.getCurrencyWallet(CONST.WALLET.TYPE.FUT, this.props.product.Currency);
            if (wallet){
                if (!this.isInitedValue){
                    const {total, fee} = this.props.getTotalVolume();
                    if (Number(fee)>0){ //如果获取到total
                        this._onChangeVolume(this.state.value);

                        this.isInitedValue = true;
                    }
                }
                // else{
                //     //如果没有变化，强制更新变化百分比
                //     // var result = this._onChangeVolume(this.state.value);
                //     // if (!result) this.forceUpdate();
                //     // this.setState({isWalletUpdate: true});
                // }
            }
        }
    }

    // componentWillUpdate(nextProps, nextState){
    //     //钱包更新时，如果百分比是100的，修改对应value，否则，判断value是否超过范围或者新value对应的百分比是否改变
    //     if (nextState.isWalletUpdate){
    //         if (nextState.percent==100){
    //             this.onPercentChange(nextState.percent);
    //         }else{
    //             const {value} = nextState;
    //             const {total} = this.props.getTotalVolume();
    //             if (Number(total)>0){
    //                 if (Number(value)>Number(total)){
    //                     this.setState({percent:100, value:total});
    //                 }else{
    //                     var percent = this.getPercent(value);
    //                     if (nextState.percent!=percent){
    //                         this.setState({percent});
    //                     }
    //                 }
    //             }
    //         }
    //
    //         this.setState({isWalletUpdate: false});
    //     }
    // }

    onChangeVolume(value){
        if (value!=this.state.value){
            this._onChangeVolume(value);
        }
    }
    _onChangeVolume(value){
        const {total, fee} = this.props.getTotalVolume();
        if (Number(total)<Number(value) && Number(total)>0){
            value = total;
        }
        else if (isNaN(value) || Number(total)==0 && Number(value)>1){
            value = 1;
        }

        if (this.state.value!=value){
            if (fee && Number(fee)>0){
                var percent = this.getPercent(value);
                this.setState({value, percent});
                if (this.props.onChange) this.props.onChange(value);
            }
        }
    }

    onOptionChange(decimal){
        return this.props.onOptionChange(decimal);
    }

    getMousePosition(e){
        return e.pageX;
    }

    onPercentChange(percent){
        var value;
        if (percent>0 && percent<100){
            value = this.onOptionChange(Decimal.accDiv(percent, 100));
        }else if(percent <= 0){
            value = 1;
        }else{
            value = this.onOptionChange(1);
        }
        if (Number(value)<=0) value = 1;

        this.setState({value, percent});
        if (this.props.onChange) this.props.onChange(value);
    }

    onClickBg(event){
        event.preventDefault();
        event.stopPropagation();

        this.sliderInit(event);

        var percent = this.getCurPercent(event);
        this.onPercentChange(percent);
    }

    sliderInit(event){
        if (this.barRef){
            var rect = this.barRef.getBoundingClientRect();
            this.leftX = rect.left;

            this.length = this.barRef.clientWidth - this.sliderRef.clientWidth;
        }
    }

    getCurPercent = (evt)=>{
        var pos = this.getMousePosition(evt);
        var offset = pos - this.leftX;

        var percent = Math.floor(Decimal.accMul(Decimal.accDiv(offset, this.length), 100));
        return Math.max(Math.min(percent, 100), 0);
    }

    onStart(event){
        event.preventDefault();
        event.stopPropagation();

        this.sliderInit(event);

        var onMove = (evt)=>{
            evt.preventDefault();
            evt.stopPropagation();

            if (this.length){
                var percent = this.getCurPercent(evt);
                this.onPercentChange(percent);
            }
        };
        var onStop = (evt)=>{
            evt.preventDefault();
            evt.stopPropagation();

            if (this.length){
                var percent = this.getCurPercent(evt);
                this.onPercentChange(percent);
                // AuthModel.savePreference(this.volPercentKey, percent);
            }

            $(document).off("mousemove", onMove);
            $(document).off("mouseup", onStop);
        };

        $(document).on("mousemove", onMove);
        $(document).on("mouseup", onStop);
    }

    setSliderRef(ref){
        this.sliderRef = ref;
    }

    setBarRef(ref){
        this.barRef = ref;
    }

    getPercent(value){
        var percent = 0;
        const {total} = this.props.getTotalVolume();
        if (value && Number(value)>0){
            percent = total && Number(total)>0 ? Number(Decimal.accMul(Decimal.accDiv(value, total), 100, 0)) : 0;
        }
        return Math.max(Math.min(percent, 100), 0);
    }

    render() {
        const {value, percent} = this.state;

        return (
            <React.Fragment>
                <dl className="mt-10 ft-easy-block">
                    <dt>{Intl.lang("trade.history.Volume")}</dt>
                    <dd className="ft-easy-tab slider-type2">
                        <OptionsNumberInput placeholder={Intl.lang('trade.open.volume')} value={value}
                                            isRequire={false}
                                            options={this.volOptions} min={1} max={FutTradeModel.volumeMax}
                                            valuePercent={true} step={1} auto={true} className="slider-number-box ver-md"
                                            onChange={this.onChangeVolume.bind(this)}
                                            onOptionChange={this.onOptionChange.bind(this)}/>
                    </dd>
                </dl>
                {/*{!this.isMobile &&*/}
                {/*<dl className="mt-20 ft-easy-block">*/}
                    {/*<dt></dt>*/}
                    {/*<dd className="ft-easy-tab">*/}
                        {/*<div className="sliderbox futures-leverage-slider slider-type5" ref={this.setBarRef.bind(this)}>*/}
                            {/*<div className="dragSlider-text">{percent+"%"}</div>*/}
                            {/*<div className="slider-edit" onClick={this.onClickBg.bind(this)}>*/}
                                {/*<div className="slider">*/}
                                    {/*<div className="slider-percent" style={{width: percent+"%"}}></div>*/}
                                {/*</div>*/}
                                {/*<div className="spot-box">*/}
                                    {/*<span style={{left: percent+"%"}} onMouseDown={this.onStart.bind(this)} ref={this.setSliderRef.bind(this)}><a></a><a></a><a></a></span>*/}
                                {/*</div>*/}
                            {/*</div>*/}
                        {/*</div>*/}
                    {/*</dd>*/}
                {/*</dl>}*/}
            </React.Fragment>
        )
    }
}
