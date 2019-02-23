import React from 'react';

import Event from "../core/event";
import Intl from "../intl";
import CfdTradeModel from "../model/cfd-trade";
import PureComponent from "../core/PureComponent";
import {DropDown,Contrainer} from './DropDown';
import ToolTip from './ToolTip';

export default class CFDHistoryHeaderMenu extends PureComponent{
    constructor(props){
        super(props);

        this.state = {
            currencyMap: {},
            currencys: [],
            value: this.props.value,
            selectAll: false
        }
    }

    componentWillMount() {
        Event.addListener(Event.EventName.PRODUCT_UPDATE, this.onProductUpdate.bind(this), this);

        this.onProductUpdate();
    }

    onProductUpdate(){
        var map = CfdTradeModel.getCurrencyMap();
        this.setState({currencyMap:map, currencys: Object.keys(map)});
    }

    onChangeValue(e){
        e.stopPropagation();

        var checked = e.target.checked;
        var key = e.target.value;

        var value = this.state.value;
        if (checked){
            value.push(key);
        }else{
            const keyIndex = value.indexOf(key);
            if (keyIndex >= 0) {
                value.splice(keyIndex, 1);
            }
        }
        this.setState({value});
        if (this.props.onChange){
            this.props.onChange(value);
        }
    }

    onChangeSelectAll(e) {
        e.stopPropagation();

        var selectAll = e.target.checked;
        var data = {selectAll};
        if (selectAll) {
            data.value = [].concat(this.state.currencys);
        }else{
            data.value = [];
        }
        this.setState(data);

        if (this.props.onChange){
            this.props.onChange(data.value);
        }
    }

    onClick(e){
        e.stopPropagation();

        if (this.props.onClick) this.props.onClick(e);
    }

    setMenuRef(c){
        this.menuRef = c;
    }

    onClickText(e){
        e.stopPropagation();
    }

    render(){
        const {name, style, onChange, onClick, ...rest} = this.props;
        const {value, selectAll, currencyMap, currencys} = this.state;

        return <li onClick={this.onClick.bind(this)} style={style} {...rest}>
            <div className="under-line">
                <DropDown trigger="click" menuRef={()=>this.menuRef} ref={(c)=>this.dropDownRef=c} onClick={this.onClickText.bind(this)}><ToolTip title={Intl.lang("cfd.tip.CurrencyTxt")} key={"cl"+name}><span>{name}</span></ToolTip></DropDown>
                <Contrainer ref={this.setMenuRef.bind(this)} pnRef={()=>this.dropDownRef}>
                    <div className="show-line-content">
                        <ul>
                            <li className="input">
                                <label className="custom-checkbox">
                                    <div>
                                        <input type="checkbox" className="input_check" checked={selectAll} onChange={this.onChangeSelectAll.bind(this)}/>
                                        <i></i>
                                    </div>
                                    <span>{Intl.lang("connect.1_1")}</span>
                                </label>
                            </li>
                        </ul>
                        {currencys && currencys.map((v, i)=>{
                            return <ul key={'c'+v}><li className="input">
                                <label className="custom-checkbox">
                                    <div>
                                        <input type="checkbox" className="input_check" value={v} name="currency" checked={value.indexOf(v)!=-1} onChange={this.onChangeValue.bind(this)}/>
                                        <i></i>
                                    </div>
                                    <span>{currencyMap[v]}</span>
                                </label>
                            </li></ul>
                        })}
                    </div>
                </Contrainer>
            </div>
        </li>
    }
}
