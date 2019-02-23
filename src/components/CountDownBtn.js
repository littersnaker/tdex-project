import Intl from '../intl';
import React from 'react';
import PropTypes from 'prop-types';
import PureComponent from '../core/PureComponent';
import {formatStr} from '../utils/common'

//倒计时button
class CountDownBtn extends PureComponent{
    static defaultProps = {
        className: "reg-btn lh-40",
        text: "",
        disabled: false,
        count: 0
    };

    static propTypes = {
        onClick: PropTypes.func,
        text: PropTypes.string,       //原来的文字
        count:PropTypes.number,       //计时数
        className: PropTypes.string,
        disabled: PropTypes.bool
    };
// 构造
    constructor(props) {
        super(props);
        // 初始状态

        this.timer = 0;
        this.text = this.props.text;
        this.unitTxt = Intl.lang("trade.price.sec");

        if (this.props.count){
            this.showCountDown(this.props.count, true);
        }else{
            this.state = {
                text: this.text ? this.text : Intl.lang("CountDownBtn.100")
            };
        }
    }

    componentWillReceiveProps(nextProps){
        if (nextProps.count != this.props.count){
            this.showCountDown(nextProps.count);
        }
    }

    showCountDown(count, isInit){
        if (count <= 0) return;

        if (this.timer){
            clearInterval(this.timer);
        }

        var sec = count;
        var text = formatStr(this.unitTxt, sec);
        if (isInit){
            this.state = {
                text: text
            };
        }else{
            this.setState({ text: text});
        }

        var self = this;
        this.timer = setInterval(() => {
            sec--;
            if (sec <=0 ){
                clearInterval(self.timer);
                self.timer = 0;
                self.setState({text:Intl.lang("account.resend")});
                return;
            }
            if (this.props.changeParentCount) {
                // 改变父组件总数 
                this.props.changeParentCount(sec)
            }
            self.setState({ text: formatStr(this.unitTxt, sec)});

        }, 1000);
    }

    handleClick = (e) => {
        e.preventDefault();

        if (this.props.disabled) return;
        // Add click effect
        if (this.timer) return;

        // var sec = this.props.count;
        // this.showCountDown(sec);

        const onClick = this.props.onClick;
        if (onClick) {
            onClick(e);
        }
    }

    componentWillUnmount() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = 0;
        }
    }
    render() {
        const {className} = this.props;
        var {text} = this.state;
        text = text ? text : Intl.lang("CountDownBtn.100");

        return (
            <a href="javascript:;" className={className} onClick={this.handleClick}>{text}</a>
        );
    }
}


export default CountDownBtn;