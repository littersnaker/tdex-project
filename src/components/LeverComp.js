import React from 'react';

import PureComponent from "../core/PureComponent";
import Intl from "../intl";
import Decimal from "../utils/decimal";
import {isMobile} from "../utils/util";
import OptionsNumberInput from "./OptionsNumberInput"
import ToolTip from "./ToolTip";

const $ = window.$;
//下单的杠杆组件
export default class LeverComp extends PureComponent {
    constructor(props) {
        super(props);

        this.isMobile = isMobile();

        this.leverOptions = this.props.options;
        this.leverWidths = this.props.widths;

        this.state = {
            value: this.props.value,
            leverInputMode:0
        };
    }
    componentWillReceiveProps(nextProps) {
        if (nextProps.options[nextProps.options.length-1]!=this.leverOptions[this.leverOptions.length-1]){
            this.leverOptions = nextProps.options;
            this.leverWidths = nextProps.widths;
            this.setState({value: nextProps.value})
        }
    }
    getLeverWidth(lever){
        //0.01~0.99 11%
        var newLeverOptions = this.leverOptions;
        var leverWidths = this.leverWidths;

        var l = newLeverOptions.length;
        var unitWidth = Decimal.accDiv(100, l-1);

        var prevL = newLeverOptions[0];
        for (var i=1; i<l; i++){
            var iLever = newLeverOptions[i];
            if (lever>=prevL && lever<=iLever){
                if (leverWidths){
                    return String(Decimal.accAdd(Decimal.accMul(Decimal.accDiv(Decimal.accSubtr(leverWidths[i], leverWidths[i-1]), Decimal.accSubtr(iLever, prevL)), Decimal.accSubtr(lever, prevL)), leverWidths[i-1]));
                }else{
                    return String(Decimal.accAdd(Decimal.accMul(unitWidth, i-1), Decimal.accMul(Decimal.accDiv(Decimal.accSubtr(lever, prevL), Decimal.accSubtr(iLever, prevL)), unitWidth)));
                }
            }
            prevL = iLever;
        }
        return leverWidths ? leverWidths[0] : 0;
    }
    onChangeLeverInputMode(e){
        e.preventDefault();
        e.stopPropagation();

        this.sliderLever = this.state.value;
        this.setState({leverInputMode: 1});
    }
    onCancelChangeLever(e){
        e.preventDefault();
        e.stopPropagation();

        this.setState({leverInputMode:0, value:this.sliderLever});
    }
    onConfirmChangeLever(e){
        e.preventDefault();
        e.stopPropagation();

        if (this.state.value>=this.props.min && this.state.value<=this.props.max){
            this.setState({leverInputMode:0});
            if (this.props.onChange) this.props.onChange(this.state.value);
        }
    }
    onChangeLever(val){
        this.setState({value:val});
    }
    onChangeIntLever(val){
        // if (FutTradeModel.isSharedLimit() && val!=20){
        //     Notification.error(Intl.lang("trade.lever.shared", 20));
        // }else{
        //     this.setState({value:val});
        //     if (this.props.onChange) this.props.onChange(val);
        // }
        this.setState({value:val});
        if (this.props.onChange) this.props.onChange(val);
    }

    getHandleCenterPosition(handle) {
        var coords = handle.getBoundingClientRect();
        return coords.left + coords.width;
    }

    getMousePosition(event){
        var pageX;
        if (event.type.indexOf('touch')!=-1) {
            pageX = event.originalEvent.changedTouches[0].pageX;
        } else if (event.type.indexOf('mouse')!=-1) {
            pageX = event.pageX;
        }
        return pageX;
    }

    onDragStart(e){
        // 判断默认行为是否可以被禁用
        if (e.cancelable) {
            // 判断默认行为是否已经被禁用
            if (!e.defaultPrevented) {
                e.preventDefault();
            }
        }
        e.stopPropagation();

        // var position = this.getMousePosition(e);
        // var handlePosition = this.getHandleCenterPosition(e.target);
        // this.dragOffset = position - handlePosition;

        var rect = this.sliderRef.getBoundingClientRect();
        this.leftX = rect.left;
        // this.leftX = rect.left + this.dragOffset;

        this.length = this.sliderRef.clientWidth;
        this.total = this.leverOptions.length - 1;

        const _onChangePos = (evt)=>{
            var pos = self.getMousePosition(evt);
            var offset = pos - self.leftX;

            var ind = Math.round(Decimal.accMul(Decimal.accDiv(offset, self.length), self.total));

            if (ind>=0 && ind<=this.total){
                var value = self.leverOptions[ind];
                if (value!=this.state.value){
                    self.setState({value});
                    return value;
                }
            }
        }

        var self = this;
        var _isMoved = false;
        var onMove = (evt)=>{
            // 判断默认行为是否可以被禁用
            if (evt.cancelable) {
                // 判断默认行为是否已经被禁用
                if (!evt.defaultPrevented) {
                    evt.preventDefault();
                }
            }
            evt.stopPropagation();

            _isMoved = true;
            _onChangePos(evt);
        };
        var onStop = (evt)=>{
            // 判断默认行为是否可以被禁用
            if (evt.cancelable) {
                // 判断默认行为是否已经被禁用
                if (!evt.defaultPrevented) {
                    evt.preventDefault();
                }
            }
            evt.stopPropagation();

            var value = this.state.value;
            if (!_isMoved) {
                var val = _onChangePos(evt);
                if (val) value = val;
            }
            this.onChangeIntLever(value);

            if (!this.isMobile){
                $(document).off("mousemove", onMove);
                $(document).off("mouseup", onStop);
            }else{
                $(document).off("touchmove", onMove);
                $(document).off("touchend", onStop);
                $(document).off("touchcancel", onStop);
            }

            _isMoved = false;
        };

        if (!this.isMobile) {
            $(document).on("mousemove", onMove);
            $(document).on("mouseup", onStop);
        }else{
            $(document).on("touchmove", onMove);
            $(document).on("touchend", onStop);
            $(document).on("touchcancel", onStop);
        }
    }

    setSliderRef(ref){
        this.sliderRef = ref;
    }

    render(){
        const {leverInputMode, value} = this.state;
        const {min, max, step, contrainerComp, sliderComp, spotBoxComp, widths, hideTitle} = this.props;
        const leverMin = min, leverMax = max;

        var width = this.getLeverWidth(value);

        var sliderEvent = {}, sliderBoxEvent = {};
        if (!this.isMobile){
            sliderEvent.onClick = this.onChangeLeverInputMode.bind(this);
            sliderBoxEvent.onMouseDown = this.onDragStart.bind(this);
        }else{
            sliderEvent.onTouchEnd = this.onChangeLeverInputMode.bind(this);
            sliderBoxEvent.onTouchStart = this.onDragStart.bind(this);
        }

        const slider = sliderComp(sliderEvent);
        const spotBoxProps = Object.assign({ref:this.setSliderRef.bind(this), list:this.leverOptions, val:value, width}, sliderBoxEvent);
        const spotBox = spotBoxComp(spotBoxProps);
        const textList = this.leverOptions;

        const contrainer = contrainerComp(slider, spotBox, textList);

        return <React.Fragment>
            {widths &&<div className="mt-5 lever-box leverage-bg pos-r">
                <div className="pos-a" style={{width: "calc(100% - 4px)"}}>
                    <div className="lever-bar" style={{left:width+"%"}}><span className={Number(value)>=1 ? "dir-l":"dir-r"}>{value ? Decimal.toFixed(value, 2)+'x' : ''}</span></div>
                </div>
                <span className="lever-txt" style={{opacity:value==5||value==10?0.1:0.4}}>{Intl.lang("trade.history.ScaleTxt_O")}</span>
                <ToolTip title={Intl.lang("trade.tip.min", leverMin)+' '+ Intl.lang("trade.tip.max", leverMax)}><span className="iconfont icon-warn r-10 cur-hover"></span></ToolTip>
            </div>}
            {!leverInputMode ? contrainer
                :
                (<dl className={(!hideTitle ? "mt-14 ":"")+"ft-easy-block tr f-clear"}>
                    {!hideTitle && <dt className="tl fl">{Intl.lang("trade.history.ScaleTxt_O")}</dt>}
                    <dd className="ft-easy-tab slider-type4">
                        <OptionsNumberInput value={value} options={this.leverOptions} labelFormat="%sx" step={step||0.01}
                                            unit="x" className="slider-number-box ver-md" min={leverMin} max={leverMax}
                                            auto={true} onChange={this.onChangeLever.bind(this)}/>
                        <div className="futures-lever-cfmccl ft-km fs0 opt">
                            <span className="cancel-c" onClick={this.onCancelChangeLever.bind(this)}><i
                                className="iconfont icon-cancel"></i></span>
                            <span className="confirm-c" onClick={this.onConfirmChangeLever.bind(this)}><i
                                className="iconfont icon-confirm"></i></span>
                        </div>
                    </dd>
                </dl>)
            }

        </React.Fragment>
    }
}
