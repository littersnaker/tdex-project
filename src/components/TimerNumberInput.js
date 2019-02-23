import React from 'react';
import PropTypes from 'prop-types';
import PureComponent from '../core/PureComponent'
import Intl from '../intl';
import Event from "../core/event";

export default class TimerNumberInput extends PureComponent {
    static defaultProps = {
        format: "hh:mm:ss",
        inputClassName: "time-edit tc",
    };

    static propTypes = {
        className: PropTypes.string,
        onChange: PropTypes.func,
        disabled: PropTypes.bool,
        value: PropTypes.string,
        format: PropTypes.string,
        date: PropTypes.object, //其他的
        min: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
        inputClassName: PropTypes.string
        // utc:PropTypes.bool
    };

    constructor(props) {
        super(props);

        var format = this.props.format;
        var showH = format.indexOf("HH")!=-1;
        var showM = format.indexOf("mm")!=-1;
        var showS = format.indexOf("ss")!=-1;

        var value = this.props.value;
        var v = value.split(":");
        value = (showH ? v[0] : '00')+':'+(showM ? v[1] : '00')+':'+(showS ? v[2] : '00');

        this.upDownInterval = 60;
        this.trigInterval = 500;

        this.onMouseUp = this.onMouseUp.bind(this);

        this.state = {
            value,
            focus: "",
            error: [],
            showH,
            showM,
            showS,
            // Tab:0,
            // Tbg:0,
            // Timer: moment().format('hh:mm:ss'),
            // UTC: moment().format('hh:mm:ss'),
        }
    }

    onChangeFocus(focus){
        if (this.state.focus!=focus) this.setState({focus});
    }
    nextFocus(){
        var focus;
        if (this.state.focus=='h'){
            focus = 'm';
        }else if(this.state.focus=='m'){
            focus = 's';
        }
        if (focus && this.refs[focus]){
            this.setCurPos(this.refs[focus], 0);
            this.onChangeFocus(focus);
        }
        return focus;
    }
    prevFocus(){
        if (this.state.focus=='m'){
            this.setCurPos(this.refs['h'], 2);
            this.onChangeFocus('h');
        }else if(this.state.focus=='s'){
            this.setCurPos(this.refs['m'], 2);
            this.onChangeFocus('m');
        }
    }
    handleKeyPress(event){
        var e = event || window.event || arguments.callee.caller.arguments[0];
        if(e && e.keyCode==38) { // up
            this.onArrowUpOrDown(1);
            e.preventDefault();
        }else if(e && e.keyCode==40){ // down
            this.onArrowUpOrDown(-1);
            e.preventDefault();
        }else if(e && e.keyCode == 37){ //left
            var pos = this.getCurPos();
            if (pos==0){
                e.preventDefault();
                this.prevFocus();
            }
        }else if(e && e.keyCode==39){ //right
            var pos = this.getCurPos();
            if (pos==2){
                e.preventDefault();
                this.nextFocus();
            }
        }else if (e && (e.keyCode>=48 && e.keyCode<=57 || e.keyCode>=96 && e.keyCode<=105)){ //数字
            e.preventDefault();
            var pos = this.getCurPos();
            var focus;
            var newPos = pos + 1;
            if (pos==2){
                focus = this.nextFocus();
                pos = 0;
                newPos = 1;
            }
            var focus = focus || this.state.focus;
            this.replaceValue(focus, e.keyCode >= 96 ? e.keyCode-(96-48) : e.keyCode, pos, ()=>{
                if (this.refs[focus])this.setCurPos(this.refs[focus], newPos);
            });
        }else{
            e.preventDefault();
        }

        return false;
    }
    replaceValue(focus, keyCode, pos, callback){
        if (!this.refs[focus]) return;

        var ctrl = this.refs[focus];
        var val = ctrl.value;

        var sFrontPart = val.substr(0, pos);
        var sTailPart = val.substr(pos+1, val.length);
        var newVal = sFrontPart + String.fromCharCode(keyCode) + sTailPart;

        this.onChangeValue(focus, newVal, callback);
    }
    getCurPos(){
        if (this.state.focus){
            var CaretPos = 0;
            var ctrl = this.refs[this.state.focus];
            if (ctrl){
                if (document.selection) { // IE Support
                    ctrl.focus();
                    var Sel = document.selection.createRange();
                    Sel.moveStart('character', -ctrl.value.length);
                    CaretPos = Sel.text.length;
                }else if(ctrl.selectionStart || ctrl.selectionStart == '0'){// Firefox support
                    CaretPos = ctrl.selectionStart;
                }
            }
            return CaretPos;
        }
    }
    setCurPos(ctrl, pos){
        if(ctrl.setSelectionRange){
            ctrl.focus();
            ctrl.setSelectionRange(pos,pos);
        }
        else if (ctrl.createTextRange) {
            var range = ctrl.createTextRange();
            range.collapse(true);
            range.moveEnd('character', pos);
            range.moveStart('character', pos);
            range.select();
        }
    }
    onChangeNum(event, type){
        event.preventDefault();

        var val = event.target.value;
        if(isNaN(val)) return false;

        this.onChangeValue(type, val);
    }
    onChangeValue(type, val, callback){
        var timePart = this.state.value.split(":");
        var error = [];
        if (type == 'h'){
            // if (val.length > 2) val = val.substr(0, 2);
            // if (val > 23) val = 23;
            if (timePart[0]!=val){
                timePart[0] = val;
            }
            if (Number(val)>23){
                error.push(Intl.lang("trade.tip.max", 23));
            }
        }else if(type == 'm'){
            if (Number(val) > 59) val = 59;
            if (timePart[1]!=val){
                timePart[1] = val;
            }
            if (Number(val)>59){
                error.push(Intl.lang("trade.tip.max", 59));
            }
        }else if(type == 's'){
            if (Number(val) > 59) val = 59;
            if (timePart[2]!=val){
                timePart[2] = val;
            }
            if (Number(val)>59){
                error.push(Intl.lang("trade.tip.max", 59));
            }
        }

        var newValue = timePart.join(":");
        this._onChangeValue(newValue, error, callback);
    }
    _onChangeValue(newValue, error=[], callback){
        if (this.state.value!=newValue){
            if (this.props.min){
                var min = typeof(this.props.min)=='function' ? this.props.min() : this.props.min;
                if (this.props.date){
                    var selectDate = this.props.date.format("YYYY-MM-DD");
                    //当选择的年月日小于最小规定的年月日 并且 时分秒
                    if ( selectDate <= min.format('YYYY-MM-DD') && min.format('HH:mm')+':00'>=newValue ){
                        newValue = min.format(this.props.format);
                    }
                }else{
                    var minTime = min.format('HH:mm')+':00'
                    if (minTime>=newValue){
                        newValue = min.format(this.props.format);
                    }
                }
            }

            this.setState({value: newValue, error:error}, ()=>{
                if (callback) callback();
            });

            if (this.props.onChange) this.props.onChange(newValue);
        }
    }
    onArrowUpOrDown(value){
        this.step = 0;
        var focus = this.state.focus||'h';
        var ctrl = this.refs[focus];
        var val = ctrl.value;
        if (!this.state.focus){
            this.onChangeFocus(focus);
        }

        if (value > 0){
            val = Number(val)+1;
            if (Number(val)>23 && focus=='h'){
                val = '00';
            }else if (Number(val)>59){
                val = '00';
            }else{
                val = ('0'+ val).substr(-2);
            }
            this.onChangeValue(focus, val);
        }else{
            val = Number(val)-1;
            if (Number(val)<0){
                if (focus=='h') val = '23';
                else val = '59';
            }else{
                val = ('0'+ val).substr(-2);
            }
            this.onChangeValue(focus, val);
        }
    }

    trigLoop(type){
        this.releaseTimer();
        this.upDownTimer = Event.setTimer(()=>{
            this.onArrowUpOrDown(type);
        }, this.upDownInterval, this);
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

    onMouseDown(step){
        this.step = step;

        this.releaseTimer();
        this.upDownTrigTimer = Event.setTimer(()=>{
            this.trigLoop(step);
        }, this.trigInterval, this, true);
    }

    onMouseUp(){
        this.releaseTimer();
        if (this.step){
            this.onArrowUpOrDown(this.step);
        }
    }

    componentDidMount() {
        window.addEventListener("mouseup", this.onMouseUp);
    }

    componentWillUnmount() {
        window.removeEventListener("mouseup", this.onMouseUp);
    }

    render() {
        const isMobile = window.isMobile
        const {className, disabled, inputClassName, contrainer, increaseComp, decreaseComp} = this.props;
        const { value, focus, error, showH, showM, showS } = this.state;
        var timePart = value.split(":");

        var newClassName = className;
        if (error.length > 0){
            newClassName = className ? className + " slider-error": "slider-error"
        }

        const input = <div className={inputClassName}>
            {showH && <input value={timePart[0]} className={focus=='h'?"bgon":""} disabled={disabled} onFocus={()=>{this.onChangeFocus('h')}} ref="h" onKeyDown={this.handleKeyPress.bind(this)} onChange={(event)=>this.onChangeNum(event,'h')}/>}
            {showM && <span>:</span>}
            {showM && <input value={timePart[1]} className={focus=='m'?"bgon":""} disabled={disabled} onFocus={()=>{this.onChangeFocus('m')}} ref="m" onKeyDown={this.handleKeyPress.bind(this)} onChange={(event)=>this.onChangeNum(event,'m')}/>}
            {showS && <span>:</span>}
            {showS && <input value={timePart[2]} className={focus=='s'?"bgon":""} disabled={disabled} onFocus={()=>{this.onChangeFocus('s')}} ref="s" onKeyDown={this.handleKeyPress.bind(this)} onChange={(event)=>this.onChangeNum(event,'s')}/>}
        </div>;

        if (contrainer){
            var increaseBtn = increaseComp(disabled, isMobile ? {
                onTouchStart: (e)=>{if (!disabled)this.onMouseDown(1)}
            } : {
                onMouseDown: (e)=>{if (!disabled)this.onMouseDown(1)}
            });

            var decreaseBtn = decreaseComp(disabled, isMobile ? {
                onTouchStart: (e)=>{if (!disabled)this.onMouseDown(-1)}
            } : {
                onMouseDown: (e)=>{if (!disabled)this.onMouseDown(-1)}
            });

            return contrainer(input, increaseBtn, decreaseBtn);
        }else{
            return (
                <div className={newClassName}>
                    {input}
                    <div className="arrow-box">
                        <span className={!disabled ? "iconfont icon-dropUp arrowup" : "iconfont icon-dropUp arrowup disable"} onMouseDown={()=>{if(!disabled)this.onMouseDown(1)}}></span>
                        <span className={!disabled ? "iconfont icon-dropDown arrowdown" : "iconfont icon-dropDown arrowdown disable"} onMouseDown={()=>{if(!disabled)this.onMouseDown(-1)}}></span>
                    </div>
                </div>
            )
        }
    }
}
