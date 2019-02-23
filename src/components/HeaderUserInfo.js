import React from 'react';

import PureComponent from "../core/PureComponent"

import ProductList from './ProductList'
import ProductItem from './ProductItem'
import LoginBox from './LoginBox';
import TradeMgr from '../model/trade-mgr';
import Event from '../core/event';
import {DropDown,Contrainer} from './DropDown';

class HeaderUserInfo extends PureComponent{
    constructor(props) {
        super(props);

        this.code = TradeMgr.getCurrCode();

        this.state = {
            code: this.code,
            selected: TradeMgr.getSelectedProduct(this.productList, this.code)
        };
    }
    componentWillMount(){
        Event.addListener(Event.EventName.PRICE_UPDATE, this.onUpdatePrice.bind(this), this);
        Event.addListener(Event.EventName.PRODUCT_UPDATE, this.onUpdatePrice.bind(this), this);
        Event.addListener(Event.EventName.PRODUCT_SELECT, this.onSelectProduct.bind(this), this);
    }
    onUpdatePrice(info){
        this.productList = TradeMgr.getProductList();
        var data = {productList: this.productList};

        if (!this.code){
            this.code = TradeMgr.getCurrCode();
            data.code = this.code;
        }

        if (!info || info[this.code]){
            data.selected = TradeMgr.getSelectedProduct(this.productList, this.code);
        }
        this.setState(data);
    }
    onSelectProduct(code){
        this.code = code;
        this.setState({code: code, selected:TradeMgr.getSelectedProduct(this.productList, this.code)});
    }
    setMenuRef(c){
        this.menuRef = c;
    }
    render() {
        const {user, uInfo} = this.props;
        const {code, selected} = this.state;

        // console.log("selected", JSON.stringify(selected));
        return (
            <div className="login-box f-clear">
                <div className="drop-menu drop-menu-horizontal symbol-box fl">
                    <DropDown trigger="click" menuRef={()=>this.menuRef} ref={(c)=>this.dropDownRef=c}><span>{selected ? selected.Name : '--'}</span><i className="iconfont icon-xiala"></i></DropDown>
                    <Contrainer ref={this.setMenuRef.bind(this)} pnRef={()=>this.dropDownRef}>
                    <ProductList className="drop-menu-children drop-menu-children-box drop-item-style1" code={code} />
                    </Contrainer>
                </div>
                 <ProductItem data={selected} inMenu={false}/>
                <LoginBox user={user} uInfo={uInfo} />

            </div>
        );
    }
}

export default HeaderUserInfo;
