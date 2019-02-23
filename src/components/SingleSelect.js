import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from "react-dom";
import PureComponent from '../core/PureComponent';

import {DropDown, Contrainer } from './DropDown';

import classnames from 'classnames';

const $ = window.$;

export class SingleSelect extends PureComponent{
    static defaultProps = {
        className: "",
        style:{},
        defaultValue: "",
        disabled: false,
        value:"",
        onChange: ()=>{}
    }

    static propTypes = {
        className: PropTypes.string,
        style: PropTypes.object,
        defaultValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        disabled: PropTypes.bool,
        value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        onChange: PropTypes.func,
        tag: PropTypes.string,  //当前的tag
        ddClassName: PropTypes.string, //dropdown部分的className
        textClassName: PropTypes.string, //文字的className
        icon: PropTypes.element, //下拉的icon
    }

    constructor(props) {
        super(props);

        this.state = {
            value: this.props.defaultValue||this.props.value,
            width: 0
        };
    }

    componentDidMount() {
        this.minWidth();
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.hasOwnProperty("value") && nextProps.value!=this.state.value){
            this.setState({value:nextProps.value});
        }
    }

    minWidth(){
        if (this.divRef){
            var node = ReactDOM.findDOMNode(this.divRef);
            if (node){
                var width = $(node).width();
                this.setState({width});
            }
        }
    }

    checkMinWidth(){
        if (!this.state.width){
            this.minWidth();
        }
    }

    onSelect(value){
        if (this.selectRef){
            this.selectRef.hide();
        }

        this.setState({value});

        if (this.props.onChange){
            this.props.onChange(value);
        }
    }

    setSelectRef(c){
        this.selectRef = c;
    }

    setDivRef(c){
        this.divRef = c;
    }

    render(){
        const {disabled, className, style, tag, ddClassName, icon, textClassName, menuClassName, menuTag} = this.props;

        var value = this.state.value;
        const width = this.state.width;

        this.options = {};

        const children = React.Children.map(this.props.children, (child, i) =>{
            if (!child) return;
            var childVal = child.props.value;
            var text = child.props.children;
            this.options[childVal] = text;

            if (!value && i==0){
                value = childVal;
            }

            return React.cloneElement(child, {
                value: text,
                active:value==childVal,
                onClick: this.onSelect.bind(this, childVal),
                children: null
            })
        });



        const text = this.options[value];

        const ddChild = icon && textClassName ?
            <div onMouseOver={this.checkMinWidth.bind(this)} className={ddClassName}><span className={textClassName ? textClassName: "f-tof"}>{text}</span>{icon}</div>
            :
            <div className="val-bg" onMouseOver={this.checkMinWidth.bind(this)}><div className="vval"><span className={textClassName ? textClassName: "f-tof"}>{text}</span></div></div>

        const contrChild = React.createElement(
            menuTag||'div',
            {
                className: classnames(menuClassName, menuTag?null:"option"),
                style: {minWidth: width?width+'px':null}
            },
            children
        );

        const selectChildren = [
            <DropDown trigger="click" menuRef={()=>this.selectRef} disabled={disabled} ref={(c)=>this.dropDownRef=c} key="sc1">
                {ddChild}
            </DropDown>,
            <Contrainer ref={this.setSelectRef.bind(this)} pnRef={()=>this.dropDownRef} key="sc2">
                {contrChild}
        </Contrainer>];

        return React.createElement(tag||'div', {
                className: classnames("select", className, disabled?'disable':'selection'),
                style: style,
                ref: this.setDivRef.bind(this)
            }, selectChildren);
    }
}

export function SelectOption(props) {
    const {value, active, onClick, className, tag} = props;
    return React.createElement(
        tag||'div',
        {
            classnames: classnames(active?"active":"", "f-tof", className),
            onClick: onClick,

        },
        value
    );
}

