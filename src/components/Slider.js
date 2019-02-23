import React from 'react';
import PropTypes from 'prop-types';
import PureComponent from "../core/PureComponent"
import Decimal from "../utils/decimal";

const $ = window.$;

class Slider extends PureComponent {
    static propTypes = {
        val:PropTypes.number,
        className:PropTypes.string,
        barClassName:PropTypes.string,
        onChange: PropTypes.func,
        // spot: PropTypes.boolean,
    };

    constructor(props) {
        super(props);

        this.className = this.props.className;
        this.barClassName = this.props.barClassName;
        this.val = this.props.value; //0-100
        this.callbackHandler = this.props.onChange;
        this.isSpot = this.props.spot;

        this.state = {
            val: this.val
        };
    }

    componentWillReceiveProps(nextProps){
        var nextValue = nextProps.value;
        if (nextValue!=undefined && (this.val != nextValue)){
            var newVal = nextValue > 100 ? 100 : (nextValue < 0 ? 0 : nextValue);
            if (this.val != newVal){
                this.val = newVal;
                this.setState({val: this.val});
            }

            if (nextValue!=newVal){
                if (this.callbackHandler){
                    this.callbackHandler(Number(this.val));
                }
            }
        }
    }

    getSliderLength() {
        var slider = this.refs.slider;
        if (!slider) {
            return 0;
        }

        return slider.clientWidth;
    }

    getMousePosition(e){
        return e.pageX;
    }

    getHandleCenterPosition(handle) {
        var coords = handle.getBoundingClientRect();
        return coords.left + coords.width;
    }

    getSliderStart() {
        var slider = this.refs.slider;
        var rect = slider.getBoundingClientRect();

        return rect.left;
    }

    onStart(event){
        event.preventDefault();
        event.stopPropagation();

        var position = this.getMousePosition(event);
        var handlePosition = this.getHandleCenterPosition(event.target);
        this.dragOffset = position - handlePosition;
        //this.startX = position;
        this.length = this.getSliderLength();
        this.leftX = this.getSliderStart() + this.dragOffset;

        var self = this;
        var onMove = function(evt){
            evt.preventDefault();
            evt.stopPropagation();

            var pos = self.getMousePosition(evt);
            var offset = pos - self.leftX;
            var val = Number(Decimal.accMul(Decimal.accDiv(offset, self.length), 100, 0));
            if (val > 100) val = 100;
            if (val < 0) val = 0;
            if (self.val != val){
                self.val = val;
                self.setState({val: val});
            }
        };
        var onStop = function(evt){
            evt.preventDefault();
            evt.stopPropagation();

            if (self.callbackHandler){
                self.callbackHandler(Number(self.val));
            }

            $(document).off("mousemove", onMove);
            $(document).off("mouseup", onStop);
        };

        $(document).on("mousemove", onMove);
        $(document).on("mouseup", onStop);
    }
    onBarClick(event){
        event.preventDefault();
        event.stopPropagation();

        var position = this.getMousePosition(event);
        var leftX = this.getSliderStart();
        var length = this.getSliderLength();
        var offset = position - leftX;
        var val = Number(Decimal.accMul(Decimal.accDiv(offset, length), 100, 0));
        if (val > 100) val = 100;
        if (val < 0) val = 0;
        if (this.val != val){
            this.val = val;
            this.setState({val: val});
        }
        if (this.callbackHandler){
            this.callbackHandler(Number(this.val));
        }
    }
    // clickSpot(e, i){
    //     e.preventDefault();
    //     if(!isNaN(i)){
    //         this.setState({val: parseInt(i*25)});
    //     }
    //     if (this.callbackHandler){
    //         this.callbackHandler(parseInt(i*25));
    //     }
    // }
    renderSpot(){
        var num = this.state.val || 0, spotMap = [0,0,0,0,0];
        if(num>0){
            var spot = parseInt(num/25);
            for(let i=0; i<5; i++){
                if(spot>=i){
                    spotMap[i] = true;
                }
            }
        }
        return spotMap;
    }
    render(){
        const self = this, spotMap = this.renderSpot();
        return (
            <div className={this.className} ref="slider">
                <div className="slider" onClick={this.onBarClick.bind(self)}>
                    {this.isSpot &&
                    <div className="spot-box">
                        {spotMap.map((item, i)=>{
                            return <span key={i} className={item?"on":""}></span>
                        })}
                    </div>
                    }
                    <div className={this.barClassName} style={{width: this.state.val+"%"}}></div>
                    <div className="slider-bar" style={{left: this.state.val+"%"}} onMouseDown={this.onStart.bind(self)}></div>
                    <div className="slider-txt">{Decimal.round(this.state.val, 0)+'%'}</div>
                </div>
            </div>
        )
    }
}

export default Slider;