import React from 'react';
import PropTypes from 'prop-types';
import PureComponent from "../core/PureComponent"
import Decimal from "../utils/decimal";

class SpanPercentbtn extends PureComponent {
    static propTypes = {
        dataArr: PropTypes.array,
        className:PropTypes.string,
        onChange: PropTypes.func,
        value:PropTypes.number
    };

    constructor(props) {
        super(props);

        this.dataArr = this.props.dataArr,
        this.className = this.props.className;
        this.changeHandler = this.props.onChange;

        this.state = {
            value: this.props.value
        };
    }

    componentWillReceiveProps(nextProps){
        if (nextProps.value!=this.state.value){
            this.setState({value:nextProps.value});
        }
    }

    onChangePercent(val){
        //选中后再次点击取消选中
        if (val==this.state.value){
            this.setState({value:''});
            if(this.changeHandler){
                this.changeHandler('');
            }
        }else{
            this.setState({value:val});
            if(this.changeHandler){
                this.changeHandler(Number(val));
            }
        }
    }

    render(){
        let value = this.state.value;
        const self = this;
        return (
            <div className={this.className} ref="spanBtn">
                {this.dataArr && this.dataArr.map((v,i)=>{
                    return <span key={i} className={value==v?"on":""} onClick={self.onChangePercent.bind(self, v)}>{v}%</span>
                })}
            </div>
        )
    }
}

export default SpanPercentbtn;