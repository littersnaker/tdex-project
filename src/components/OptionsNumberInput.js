import React from 'react';
import PropTypes from 'prop-types';
import PureComponent from '../core/PureComponent';
import Decimal from '../utils/decimal';
import Intl from '../intl';
import Event from "../core/event";

const $ = window.$;

export default class OptionsNumberInput extends PureComponent{
    static defaultProps = {
        disabled: false,
        auto: false,
        isRequire: true
    };

    static propTypes = {
        onChange: PropTypes.func,
        disabled: PropTypes.bool,
        defaultValue: PropTypes.oneOfType([PropTypes.string,PropTypes.number]),
        value: PropTypes.oneOfType([PropTypes.string,PropTypes.number]),
        placeholder: PropTypes.string,
        className: PropTypes.string,
        inputClassName:PropTypes.string,
        style: PropTypes.object,
        unitStyle: PropTypes.object,
        step: PropTypes.oneOfType([PropTypes.string,PropTypes.number]),
        options: PropTypes.array,
        labelFormat: PropTypes.string,
        min: PropTypes.oneOfType([PropTypes.string,PropTypes.number]),
        max: PropTypes.oneOfType([PropTypes.string,PropTypes.number]),
        valuePercent: PropTypes.bool, //值的百分比标识
        unit:PropTypes.string, //数值的单位
        auto: PropTypes.bool, //自动根据填入的值计算上下按钮的步长加减
        isRequire: PropTypes.bool, //是否必须有值

        contrainer:PropTypes.func,
        inputComp:PropTypes.func,
        increaseComp:PropTypes.func,
        decreaseComp:PropTypes.func,
    };

    constructor(props) {
        super(props);

        this.hideAll = this.hideAll.bind(this);
        this.onArrowOut = this.onArrowOut.bind(this);

        this.upDownInterval = 60;
        this.trigInterval = 500;
        this.upDownTimer = 0;
        this.upDownTrigTimer = 0;

        this.regExp = null;
        this.dnum = 0;

        this.isKeyPressUp = false;
        this.isKeyPressDown = false;

        this.upOrDown = 0;

        if (this.props.step){
            var step = this.props.step;
            this.regExp = this.generateRegExp(String(step));
            this.step = step;
            if (this.step){
                this.generateInputStep(this.step);
            }
        }else if(this.props.value){
            this.generateStep(this.props.value);
            this.regExp = this.generateRegExp(String(this.step));
        }

        this.value = this.props.value || this.props.defaultValue || "";
        var msg = this.getRangeValidMsg(this.value, this.props);
        this.state = {
            value:this.value,
            hide: true,
            hideMsg: true,
            valError: msg.length > 0,
            msg
        }
    }

    generateRegExp(num){
        var dnum = Decimal.getDotDigit(num);
        if (dnum > 0){
            this.dnum = dnum;
            return new RegExp("([0-9]+\\.[0-9]{"+dnum+"})[0-9]*", "g");
        }else{
            var tf = String(num).indexOf('e-');
            if (tf!=-1){
                var list = String(num).split('e-');
                var dnum = Number(Decimal.getDotDigit(list[0]))+Number(list[1]);
                this.dnum = dnum;
                return new RegExp("([0-9]+\\.[0-9]{"+dnum+"})[0-9]*", "g");
            }
            this.dnum = 0;
            return new RegExp("([0-9]+)\\.[0-9]*", "g");
        }
    }

    val(){
        if (!this.state.valError) return this.state.value;
    }

    activeInput(e){
        // e.stopPropagation();

        this.setState({hideMsg: false});
    }

    unActiveInput(e){
        this.setState({hideMsg: true});
    }

    calcAddOrSub(type, scale=1){
        var val = this.state.value;
        if (isNaN(val)){
            val = 0;
        }
        if (!val){
            if (type=='add' && this.props.hasOwnProperty("min")){
                return this.props.min;
            }else if (type=='sub' && this.props.hasOwnProperty("max")){
                return this.props.max;
            }
        }
        if (this.props.hasOwnProperty("max") && type=='add' && Number(val)>=Number(this.props.max)){
            return this.props.max;
        }
        if (this.props.hasOwnProperty("min") && type=='sub' && Number(val)<=Number(this.props.min)){
            return this.props.min;
        }

        var step = this.step;

        if (scale>1) step = Number(Decimal.accMul(step, scale));
        else{
            if (this.props.auto){
                step = this.generateAutoStep(val, type);
            }
        }

        return type=='add' ? String(Decimal.accAdd(val||0, step)) : String(Decimal.accSubtr(val||0, step));
    }

    calcArrow(type, scale){
        var val = this.calcAddOrSub(type, scale);
        val = this.getValidValueRange(val);
        this.onChange(val, this.props);
    }
    trigLoop(type, scale){
        this.releaseTimer();
        this.upDownTimer = Event.setTimer(()=>{
            this.calcArrow(type, scale);
        }, this.upDownInterval, this);
    }
    timeoutTrigger(type, scale){
        this.releaseTimer();
        this.upDownTrigTimer = Event.setTimer(()=>{
            this.trigLoop(type, scale);
        }, this.trigInterval, this, true);
    }
    releaseTimer(){
        if (this.upDownTrigTimer){
            clearTimeout(this.upDownTrigTimer);
            this.upDownTrigTimer = 0;
        }

        if (this.upDownTimer){
            clearInterval(this.upDownTimer);
            this.upDownTimer = 0;
        }
    }
    onArrowUp(e, scale){
        if (e){
            if (e.cancelable) {
                // 判断默认行为是否已经被禁用
                if (!e.defaultPrevented) {
                    e.preventDefault();
                }
            }
            e.stopPropagation();
        }

        if (this.props.disabled || !this.step) return;

        this.upOrDown = 1;
        this.timeoutTrigger('add', scale);
    }
    onArrowUpOut(e, scale){
        if (e){
            if (e.cancelable) {
                // 判断默认行为是否已经被禁用
                if (!e.defaultPrevented) {
                    e.preventDefault();
                }
            }
            e.stopPropagation();
        }

        if (this.props.disabled || !this.step) return;

        this.upOrDown = 0;
        this.releaseTimer();
        this.calcArrow('add', scale);
    }

    onArrowDown(e, scale){
        if (e){
            if (e.cancelable) {
                // 判断默认行为是否已经被禁用
                if (!e.defaultPrevented) {
                    e.preventDefault();
                }
            }
            e.stopPropagation();
        }

        if (this.props.disabled || !this.step) return;

        this.upOrDown = 2;
        this.timeoutTrigger('sub', scale);
    }

    onArrowDownOut(e, scale){
        if (e){
            if (e.cancelable) {
                // 判断默认行为是否已经被禁用
                if (!e.defaultPrevented) {
                    e.preventDefault();
                }
            }
            e.stopPropagation();
        }

        if (this.props.disabled || !this.step) return;

        this.upOrDown = 0;
        this.releaseTimer();
        this.calcArrow('sub', scale);
    }

    onArrowOut(e){
        if (this.upOrDown==1){
            this.onArrowUpOut(e);
        }else if(this.upOrDown==2){
            this.onArrowDownOut(e);
        }
    }

    componentDidMount() {
        window.addEventListener("click", this.hideAll);
        window.addEventListener("mouseup", this.onArrowOut);
        if (window.isMobile) window.addEventListener("touchend", this.onArrowOut);
    }

    componentWillUnmount() {
        window.removeEventListener("click", this.hideAll);
        window.removeEventListener("mouseup", this.onArrowOut);
        if (window.isMobile) window.removeEventListener("touchend", this.onArrowOut);
    }

    componentWillReceiveProps(nextProps){
        var val = nextProps.value;
        var oldval = val;

        if (nextProps.step && this.step!=nextProps.step){
            var step = nextProps.step;
            this.regExp = this.generateRegExp(String(step));
            this.step = step;
            if (this.step){
                this.generateInputStep(this.step);
            }
        }

        if (val!=this.value){
            val = isNaN(val) ? '' : val;
            if (val){
                if (this.regExp){
                    if (Decimal.getDotDigit(val)>this.dnum){
                        val = String(val).replace(this.regExp, "$1");

                        if (oldval!=val){
                            if (this.props.onChange){
                                this.props.onChange(val);
                            }
                        }
                    }
                }else{
                    this.regExp = this.generateRegExp(String(val));

                    this.generateStep(val);
                }
            }

            if (val && this.step){
                val = this.limitValue(val, this.step, nextProps);
            }

            this.onChange(val, nextProps);
        }else if (nextProps.disabled!=this.props.disabled){
            var msg = this.getRangeValidMsg(this.value, nextProps);
            this.setState({msg, valError:msg.length>0, hideMsg:false});
        }
    }

    limitValue(val, step, props){
        if (Math.abs(Number(val)) < Number(step)){
            if (props.hasOwnProperty("min")){
                if (Number(val)<Number(props.min))return String(props.min);
                else{
                    var remain = (Number(val) - Number(props.min)) % Number(step);
                    if (remain==0){
                        return val;
                    }
                }
            }
            return String(step);
        }
        else{
            val = String(Decimal.accMul(Decimal.round(Decimal.accDiv(val, step)), step));
            return val;
        }
    }

    //计算上下按钮的步长
    generateAutoStep(val, type){
        var valStr = String(val);
        var findex = valStr.indexOf('.');
        var step;
        if (findex!=-1){
            step = 1/Math.pow(10, valStr.length - (findex+1));
        }else{
            step = Math.pow(10, valStr.length - 1);
        }
        if (type=='add'){
            return step;
        }
        else {
            if (Number(step)==Number(val)){
                if (findex!=-1){
                    return 1/Math.pow(10, valStr.length - findex);
                }else{
                    return Math.pow(10, valStr.length - 2);
                }
            }
            return step;
        }
    }

    generateStep(val){
        if (!this.step){
            //最小位数为步长
            var findex = String(val).indexOf('.');
            this.step = findex!=-1 ? 1/Math.pow(10, String(val).length - (findex+1)) : 1;
            this.generateInputStep(this.step);
        }
    }

    //输入时的限制，比如step为5，但输入的限制不能为5，只能为1
    generateInputStep(step){
        var stepStr = parseFloat(step).toString();
        var pointIndex = stepStr.indexOf('.');
        if (pointIndex==-1){
            var pi = stepStr.indexOf('e-'); //科学计算法
            if (pi==-1) this.inputStep = 1;
            else{
                var list = stepStr.split('e-');
                var p = Number(Decimal.getDotDigit(list[0]))+Number(list[1]);
                this.inputStep = Decimal.accDiv(1, Math.pow(10, p));
            }
        }
        else{
            var len = stepStr.length;
            this.inputStep = Decimal.accDiv(1, Math.pow(10, len-1-pointIndex));
        }
    }

    changeNumberInput(e){
        e.preventDefault();

        var val = $(e.target).val();
        if (val==String(this.state.value)) return;

        val = val.replace(/[^\-0-9.]/g, '');
        if (!isNaN(val) || val=='-'){
            if (val!='-'){
                if (this.regExp && Decimal.getDotDigit(val)>this.dnum){
                    val = val.replace(this.regExp, "$1");
                }

                var inputStep = Number(this.inputStep);
                if ((inputStep>=1 || inputStep<1 && Decimal.getDotDigit(val)>=this.dnum) && val && this.inputStep){
                    val = this.limitValue(val, this.inputStep, this.props);
                }
            }

            this.onChange(val, this.props);
        }
    }

    onChange(val, props){
        if (String(this.state.value)!=val){
            var msg = this.getRangeValidMsg(val, props);

            var valError;
            if (msg.length>0){ //数据不合法
                if (props.hasOwnProperty("max") && Number(val)>props.max){ //最大值不对，用回之前的值
                    val = this.value>props.max ? props.max : this.value;
                    this.value = val;
                    valError = false;
                }else{
                    this.value = val;
                    valError = true;
                }
            }else{
                this.value = val;
                valError = false;
            }

            this.setState({value: val, valError, msg, hideMsg:false});

            if (props.onChange){
                props.onChange(val);
            }
        }
    }
    showOptions(e){
        e.preventDefault();
        e.stopPropagation();

        this.setState({hide: !this.state.hide});
    }

    hideAll(){
        if (!this.state.hide){
            this.setState({hide:true});
        }
        // if (!this.state.hideError){
        //     this.setState({hideError:true});
        // }
    }

    handleKeyPress(event){
        if (this.props.disabled) return;

        var e = event || window.event || arguments.callee.caller.arguments[0];
        if(e && (e.keyCode==38 || e.keyCode==33)) { // up
            if (!this.isKeyPressUp){
                this.isKeyPressUp = true;
                this.onArrowUp(null, e.keyCode==33?10:1);
            }
            e.preventDefault();
        }else if(e && (e.keyCode==40 || e.keyCode==34)){ // down
            if (!this.isKeyPressDown){
                this.isKeyPressDown = true
                this.onArrowDown(null, e.keyCode==34?10:1);
            }
            e.preventDefault();
        }

        return false;
    }
    handleKeyRelease(event){
        if (this.props.disabled) return;

        var e = event || window.event || arguments.callee.caller.arguments[0];
        if(e && (e.keyCode==38 || e.keyCode==33)) { // up
            this.onArrowUpOut(null, e.keyCode==33?10:1);
            this.isKeyPressUp = false;
            e.preventDefault();
        }else if(e && (e.keyCode==40 || e.keyCode==34)){ // down
            this.onArrowDownOut(null, e.keyCode==34?10:1);
            this.isKeyPressDown = false;
            e.preventDefault();
        }

        return false;
    }

    valToLabel(val){
        if (val && this.props.labelFormat){
            return this.props.labelFormat.replace("%s", String(val));
        }else if(val && this.props.valuePercent){
            return String(100*val)+"%";
        }else{
            return val;
        }
    }

    getValidValueRange(val){
        if (this.props.hasOwnProperty("max") && Number(val)>this.props.max){
            val = this.props.max;
        }else if(this.props.hasOwnProperty("min") && Number(val)<this.props.min){
            val = this.props.min;
        }
        return val;
    }

    onClickOption(value){
        if (this.props.valuePercent){
            if (this.props.onOptionChange){

                var val = this.props.onOptionChange(value);
                val = this.getValidValueRange(val);
                this.onChange(val, this.props);
            }else{
                if (this.state.value) this.onChange(String(Decimal.accMul(value, this.state.value, 0)), this.props);
            }
        }else{
            this.onChange(value, this.props);
        }
    }

    getRangeValidMsg(val, props){
        var msg = [];
        if (!props.disabled){
            if (!props.isRequire && val===""){

            }else{
                if (props.hasOwnProperty("min") && (!val || val=='-' || Number(val)<props.min)){
                    msg.push(Intl.lang("trade.tip.min", props.min));
                }
                if (props.hasOwnProperty("max") && (!val || val=='-' || Number(val)>props.max)){
                    msg.push(Intl.lang("trade.tip.max", props.max));
                }
            }
        }
        return msg;
    }

    render() {
        const {disabled, placeholder, className, inputClassName, style, unitStyle, options, unit, contrainer, inputComp, increaseComp, decreaseComp} = this.props;
        const {value, hide, msg, hideMsg, valError} = this.state;

        var newClassName = valError ? (className ? className + " slider-error": "slider-error") : className;
        var msgText = "";
        if (msg.length > 0){
            msgText = msg.join(" ");
        }

        // console.log(this.state);

        const self = this, isMobile = window.isMobile;

        if (contrainer){
            var inputProps = isMobile ? {
                type:"number",
                pattern:"\d*"
            } : {
                type: "text"
            };
            var input = inputComp(Object.assign(inputProps, {
                value:value,
                disabled,
                onChange:this.changeNumberInput.bind(self),
                onFocus:this.activeInput.bind(this),
                onBlur:this.unActiveInput.bind(this),
                onKeyDown:this.handleKeyPress.bind(this),
                onKeyUp:this.handleKeyRelease.bind(this)
            }));
            var increaseBtn = increaseComp(disabled, isMobile ? {
                onTouchStart: (e)=>{if (!disabled)this.onArrowUp(e)}
            } : {
                onMouseDown: (e)=>{if (!disabled)this.onArrowUp(e)}
            });

            var decreaseBtn = decreaseComp(disabled, isMobile ? {
                onTouchStart: (e)=>{if (!disabled)this.onArrowDown(e)}
            } : {
                onMouseDown: (e)=>{if (!disabled)this.onArrowDown(e)}
            });

            return contrainer(input, increaseBtn, decreaseBtn, msgText);
        }else{
            return (
                <div className={newClassName + (isMobile?" opt f-clear":"")}>
                    {unit && <div className="slider-unit" style={Object.assign(unitStyle||{}, options ? {right:"40px"}:{})}><span>{unit}</span></div>}
                    {isMobile && <span className={"cancel-c fl "+(disabled?"disable":"")} onTouchStart={(e)=>{if(!disabled)this.onArrowDown(e)}}><i className="iconfont icon-minus fs12"></i></span>}
                    {isMobile ?
                        (<input type="number" pattern="\d*" value={value} className={inputClassName} style={style} placeholder={placeholder} disabled={disabled} onChange={this.changeNumberInput.bind(self)} onFocus={this.activeInput.bind(this)} onBlur={this.unActiveInput.bind(this)} onKeyDown={this.handleKeyPress.bind(this)} onKeyUp={this.handleKeyRelease.bind(this)}/>)
                        :
                        (<input type="text" value={value} className={inputClassName} style={style} placeholder={placeholder} disabled={disabled} onChange={this.changeNumberInput.bind(self)} onFocus={this.activeInput.bind(this)} onBlur={this.unActiveInput.bind(this)} onKeyDown={this.handleKeyPress.bind(this)} onKeyUp={this.handleKeyRelease.bind(this)}/>)
                    }
                    {isMobile && <span className={"confirm-c "+(disabled?"disable":"")} onTouchStart={(e)=>{if (!disabled)this.onArrowUp(e)}}><i className="iconfont icon-add fs12 pd0"></i></span>}
                    {!isMobile &&<div className="arrow-box">
                        <span className={!disabled ? "iconfont icon-dropUp arrowup" : "iconfont icon-dropUp arrowup disable"} onMouseDown={(e)=>{if(!disabled)this.onArrowUp(e)}}></span>
                        <span className={!disabled ? "iconfont icon-dropDown arrowdown" : "iconfont icon-dropDown arrowdown disable"} onMouseDown={(e)=>{if (!disabled)this.onArrowDown(e)}}></span>
                    </div>}
                    {(!hideMsg && msgText) && <div className="slider-tip"><span>{msgText}</span></div>}
                    {options &&
                    <div className="selectMenuBox">
                        <i className="iconfont icon-xiala fem15" onClick={(e)=>{if(!disabled)this.showOptions(e)}}></i>
                        {!hide && <ul className="select-menu">
                            {options.map((v, i)=>{
                                return <li className={!this.props.valuePercent && value==v?"active":""} onClick={this.onClickOption.bind(self, v)} key={i}>{this.valToLabel(v)}</li>
                            })}
                        </ul>}
                    </div>}
                </div>
            )
        }


    }
}
