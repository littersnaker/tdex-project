import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from "react-dom";
import PureComponent from '../core/PureComponent';

import classnames from 'classnames';
import '../css/tooltip.css';

const $ = window.$;
const ToolTipMgr = {
    _tooltip: null,

    init(contentProps){
        if (!this._tooltip){
            ReactDOM.render(
                <Content ref={this.setToolTip.bind(this)} {...contentProps} />,
                document.getElementById('tooltip')
            );
        }
    },
    setToolTip(r){
        this._tooltip=r
    },
    toolTip(){
        return this._tooltip;
    }
};

export default class ToolTip extends PureComponent{
    static propTypes = {
        prefixCls: PropTypes.string,
        children: PropTypes.any.isRequired,
        className: PropTypes.string,
        title: PropTypes.string.isRequired,
        style: PropTypes.object,
        childOffset: PropTypes.object,
    };

    static defaultProps = {
        prefixCls: '__react_component_tooltip type-dark rt_tooltip',
        className: '',
        placement: 'right'
    };

    constructor(props) {
        // console.log('constructor', props);
        super(props);

        this.onMouseEnter= this.onMouseEnter.bind(this);
        this.onMouseLeave = this.onMouseLeave.bind(this);

        this.state = {};
    }
    onMouseEnter = (e)=>{
        var x = e.pageX;
        var y = e.pageY;

        var style = {
            left: x + 'px',
            top: y +'px'
        };

        if (!ToolTipMgr.toolTip()){
            ToolTipMgr.init({
                className:classnames(this.props.prefixCls, this.props.className),
                style,
                title: this.props.title
            });
        }else{
            ToolTipMgr.toolTip().change(this.props.title, style, classnames(this.props.prefixCls, this.props.className));
        }

        var style;
        if (this.props.childOffset){
            style = this.childPosOffset();
        }else{
            style = this.centerPosition(x, y);
        }

        Object.assign(style, this.props.style);
        ToolTipMgr.toolTip().show(style);
    }

    childPosOffset(){
        if (this.childRef){
            var offset = this.props.childOffset;
            var node = ReactDOM.findDOMNode(this.childRef);
            var pos = $(node).offset();
            var top = pos.top;
            var left = pos.left;
            return {
                left: left +(offset.left||0) + 'px',
                top: top + (offset.top||0) +'px'
            };
        }else{
            return {left:0, top:0}
        }
    }

    centerPosition = (x = 0, y = 0, offset=30) => {
        let menuStyles = {
            top: y,
            left: x
        };

        const tooltip = ToolTipMgr.toolTip();
        const ttNode = ReactDOM.findDOMNode(tooltip);

        const { innerWidth, innerHeight } = window;
        const rect = ttNode.getBoundingClientRect();

        if (y - rect.height-offset < 0) {
            menuStyles.top += offset;
        }else{
            menuStyles.top = y - rect.height-offset;
        }

        if (x - rect.width/2 > innerWidth) {
            menuStyles.left = (innerWidth - rect.width/2);
        }else if (x - rect.width/2 < 0){
            menuStyles.left = 0;
        }else{
            menuStyles.left = x - rect.width/2;
        }

        return {
            left: menuStyles.left + 'px',
            top: menuStyles.top +'px'
        };
    }

    onMouseLeave = (e)=>{
        if (ToolTipMgr.toolTip()){
            ToolTipMgr.toolTip().hide();
        }
    }

    render() {
        const { children,
            prefixCls,
            className,
            title,
            style,
            childOffset,
            ...rest} = this.props;

        var newChildProps = {
            onMouseEnter: this.onMouseEnter,
            onMouseLeave: this.onMouseLeave,
            ref: (c)=>this.childRef=c,
            ...rest
        };

        if (children.length>1){
            return React.createElement('div', newChildProps, children);
        }else{
            return React.cloneElement(React.Children.only(children), newChildProps);
        }
    }
}


class Content extends PureComponent {
    constructor(props) {
        // console.log('constructor', props);
        super(props);

        const {className, style, title} = this.props;

        this.state = {
            baseClassName: className,
            className: className,
            style: style,
            title: title
        };
    }

    hide(){
        this.setState({className: this.state.baseClassName});
    }
    show(style){
        this.setState({style, className: classnames(this.state.baseClassName, 'show')});
    }
    change(title, style, className){
        this.setState({title, style, baseClassName: className});
    }
    render(){
        const {className, style, title} = this.state;

        return <div className={className} style={style} dangerouslySetInnerHTML={{__html:title}}></div>
    }
}
