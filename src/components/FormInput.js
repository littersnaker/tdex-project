import React from 'react';
import PropTypes from 'prop-types';
import PureComponent from '../core/PureComponent';

import ReactDOM from "react-dom";

export default class FormInput extends PureComponent{
    static defaultProps = {
        type:'text',
        onChange:()=>{},
        onError:()=>{},
        isRequired: false,
        divClassName: 'logo_input',
        inputClassName: 'inp',
        errorClassName: 'bd-err',
        placeholder:()=>{},
    };

    static propTypes = {
        type: PropTypes.string.isRequired,
        onChange:PropTypes.func.isRequired,
        onError:PropTypes.func.isRequired,
        validator:PropTypes.func,
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        divClassName: PropTypes.string,
        inputClassName: PropTypes.string,
        errorClassName: PropTypes.string,
        placeholder: PropTypes.func,
        isRequired: PropTypes.bool,
        match: PropTypes.string,
        icon: PropTypes.object,
        maxLength: PropTypes.number
    };

    constructor(props) {
        super(props);

        this.flag = false;

        if (this.props.match){
            this.regExp = new RegExp(this.props.match);
        }

        // this.isBlur = false;
        // this.isFocused = false; //是否有过焦点

        this.state = {
            value: this.props.value||"",
            isValid: false,
            error: ''
        }
    }

    onChange(e){
        e.preventDefault();
        e.stopPropagation();

        var value =  e.target.value;
        this._change(value);
    }
    _change(value, isBlur){
        if(!window.IS_LOCAL){
            return false;
        }

        var data = this.checkValid(value, isBlur);
        this.setState(data);
        this.props.onChange(data.value, data.isValid);

        if (isBlur) this.props.onError(data.error);
        // else if(!this.isFocused && !data.error) this.props.onError(data.error); //自动填充的情况下 没有错误的话要激活登录按钮

        return data.isValid;
    }
    focusInput(){
        if (this.inputRef){
            var inputNode = ReactDOM.findDOMNode(this.inputRef);
            if (inputNode) inputNode.focus();
        }
    }
    onCheckValid(){
        return this._change(this.state.value, true);
    }
    onFocus(e){
         // e.stopPropagation();
        //this.isFocused = true;
        let isFocus = true;
        this.props.onChange(this.state.value, false, isFocus);
    }
    onBlur(e){
        // e.stopPropagation();

        this._change(this.state.value, true);
    }
    checkValid(value, isShowError){
        const {isRequired, match, validator} = this.props;

        var data = {value, isValid: false, error:''};
        if (isRequired && !value){
            if (isShowError) data.error = 'empty';

            return data;
        }

        if (match && value){
            if (!this.regExp.test(value)){
                if (isShowError) data.error = 'match';

                return data;
            }
        }
        else if (validator){
            if (!validator(value)){
                if (isShowError) data.error = 'match';

                return data;
            }
        }

        if (isShowError) data.error = '';
        data.isValid = true;

        return data;
    }
    setRef(ref){
        this.inputRef = ref;
    }

    render() {
        const {type, inputClassName, placeholder, icon, divClassName, errorClassName, maxLength, isActivity, newVersion, unFill} = this.props;
        const {value, error} = this.state;

        return (
            newVersion?
                <input className={inputClassName} type={type} value={value} maxLength={maxLength} placeholder={placeholder()} onChange={this.onChange.bind(this)} onBlur={this.onBlur.bind(this)} ref={this.setRef.bind(this)} onFocus={this.onFocus.bind(this)} autoComplete={unFill?"new-password":""} />
                :
            isActivity?
            <input type={type} className={error?errorClassName:""} value={value} maxLength={maxLength} placeholder={placeholder()} onChange={this.onChange.bind(this)} onBlur={this.onBlur.bind(this)} ref={this.setRef.bind(this)} autoComplete="new-password" />
                :
            <div className={divClassName+(error ? (divClassName? " ":"")+errorClassName:"")}>
                <span className="icon-sm">{icon}</span><span><input className={inputClassName} type={type} value={value} maxLength={maxLength} placeholder={placeholder()} onChange={this.onChange.bind(this)} onBlur={this.onBlur.bind(this)} ref={this.setRef.bind(this)}/></span>
            </div>
        )
    }
}