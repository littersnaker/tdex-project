import React from 'react';
import ReactDOM from "react-dom";
import PureComponent from '../core/PureComponent';

import Intl from '../intl';
import CfdTradeModel from '../model/cfd-trade';
import Decimal from '../utils/decimal';
import Event from "../core/event";
import ScrollArea from 'react-scrollbar';
import CFDProductDetail from './CFDProductDetail';
import PopDialog from "../utils/popDialog"
import Notification from '../utils/notification';
import {CONST} from "../public/const";
import CFDNewOrderForm from './CFDNewOrderForm';
import ToolTip from './ToolTip';
import SysTime from "../model/system";
import ContextMenu from './ContextMenu';
import AuthModel from "../model/auth";
import Dragger from '../lib/react-dragger-r/index';
import { isMobile } from '../utils/util';

const $ = window.$;
export default class CFDGroups extends PureComponent{
    constructor(props){
        super(props);

        this.hideContextMenu = this.hideContextMenu.bind(this);

        this.state = {
            groupProducts: {}
        }
    }

    componentWillMount() {
        Event.addListener(Event.EventName.PRODUCT_UPDATE, this.onProductUpdate.bind(this), this);
        Event.addListener(Event.EventName.FAVORITE_UPDATE, this.onFavoriteUpdate.bind(this), this);

        this.onProductUpdate();
    }

    componentDidMount() {
        if (!this.props.isMenu) window.addEventListener("mousedown", this.hideContextMenu);
    }

    hideContextMenu(e){
        if (e && e.target && e.target.className.indexOf("icon-trading-menu")==-1){
            PopDialog.closeByDomID("product-submenu");
        }
    }

    onProductUpdate(){
        this.setState({groupProducts: CfdTradeModel.getGroupProducts()});
    }

    onFavoriteUpdate(){
        this.forceUpdate();
    }

    addFavorite(code, isRemove){
        if (!isRemove){
            CfdTradeModel.addMyFavorite(code);
        }else{
            CfdTradeModel.removeMyFavorite(code);
        }
    }

    filterGroups(groupProducts, filter){
        var newGroupProducts = {};
        for (var group in groupProducts){
            var products = groupProducts[group];
            var newProducts = this.filterProducts(products, filter);
            if (newProducts.length) newGroupProducts[group] = newProducts;
        }
        return newGroupProducts;
    }

    filterProducts(products, filter){
        return products.filter(v=>CfdTradeModel.searchFilter(filter, v));
    }

    resetTransate(index, h){
        var arg = h!==0 ? 'translate(0, '+ h +'px)' : 'none';
        this.nodeList[index].css({'transform': arg});
    }

    onDragStart(group, i, groupSort, e, x, y) {
        e.stopPropagation();

        //计算其他几个的高度
        this.groupsHeight = [];
        this.nodeList = [];
        this.len = groupSort.length;
        groupSort.forEach((v, vi)=>{
            var node = $(ReactDOM.findDOMNode(this.refs["dragger"+vi]));
            var h = node.height();
            this.groupsHeight[vi] = h;
            this.nodeList[vi] = node;
        });
    }

    onMove(group, i, groupSort, e, x, y){
        e.stopPropagation();

        this.targetIndex = i;
        if (y < 0){ //向上移动
            var distY = Math.abs(y);
            var count = i;
            var tH = 0;
            while (count>0){
                count--;
                tH = tH + this.groupsHeight[count];
                if (distY < tH + 20 && distY >= tH - 20){
                    break;
                }else if(distY < tH - 20){
                    count++;
                    break;
                }
            }
            this.targetIndex = count;

            if (this.targetIndex!=i){
                this.resetTransate(count, this.groupsHeight[i]);
            }
            while (count > 0 ){
                count--;
                this.resetTransate(count, 0);
            }
        }else if( y > 0){ //向下移动
            var distY = Math.abs(y);
            var count = i;
            var tH = 0;
            while (count < this.len){
                tH = tH + this.groupsHeight[count];
                count++;
                if (distY < tH + 20 && distY >= tH - 20){
                    break;
                }else if(distY < tH - 20){
                    count--;
                    break;
                }
            }
            this.targetIndex = count;

            if (this.targetIndex!=i){
                this.resetTransate(count, -1*this.groupsHeight[i]);
            }
            while (count < this.len - 1){
                count++;
                this.resetTransate(count, 0);
            }
        }
    }

    onDragEnd(group, i, groupSort, e, x, y){
        e.stopPropagation();

        if (this.len && this.targetIndex!=i){
            groupSort.splice(i, 1);
            groupSort.splice(this.targetIndex, 0, group);
            CfdTradeModel.saveMyGroupSort(groupSort);
            this.forceUpdate();

            groupSort.forEach((v, i)=>{
                this.resetTransate(i, 0);
            });

            this.targetIndex = i;
            this.groupsHeight = [];
            this.nodeList = [];
            this.len = 0;
        }
    }

    componentWillUnmount(){
        if (!this.props.isMenu){
            CfdTradeModel.showMenuProduct = null;
        }

        if (!this.props.isMenu) window.removeEventListener("mousedown", this.hideContextMenu);

        super.componentWillUnmount();
    }

    render(){
        const {code, style, className, height, filter, isMenu, visible} = this.props;
        const {groupProducts} = this.state;

        const myFavs = CfdTradeModel.getMyFavProducts();
        const filterMyFavs = filter ? this.filterProducts(myFavs, filter) : myFavs;

        const groupSort = CfdTradeModel.getMyGroupSort();
        const groups = Object.keys(filter ? this.filterGroups(groupProducts, filter) : groupProducts);

        //按顺序显示
        var isExpanded = false;
        var cfdGroups = [];
        groupSort.forEach((v, i)=>{
            if (groups.indexOf(v)!=-1 || (v=="0" && (!filter || (filter && filterMyFavs && !!filterMyFavs.length)))){
                var list = v=="0" ? myFavs : groupProducts[v];
                var expanded = false;
                if (!isExpanded && code){
                    var len = list.filter(v=>v.Code==code).length;
                    if (len){
                        isExpanded = true;
                        expanded = true;
                        // console.log(code, expanded);
                    }
                }
                var content = <CFDGroup key={`cg${v}`} expanded={expanded} group={v} list={list} code={code} filter={filter} addFavorite={this.addFavorite.bind(this)} isMenu={isMenu} visible={visible}/>;
                if (isMenu){
                    cfdGroups.push(content);
                }else{
                    cfdGroups.push(<Dragger key={`drag${v}`} ref={"dragger"+i} hasDraggerHandle={true} allowY={true} bounds="parent" resetXY={true} onDragStart={this.onDragStart.bind(this, v, i, groupSort)} onDragEnd={this.onDragEnd.bind(this, v, i, groupSort)} onMove={this.onMove.bind(this, v, i, groupSort)}>{content}</Dragger>);
                }
            }
        })

        // console.log(this.props);

        return <div className={className} style={style}>
            <ul className="trading-exchange-list-title">
                <li>{Intl.lang("trade.history.CName")}</li>
                <li>{Intl.lang("TradeForm.109")}</li>
                <li>{Intl.lang("TradeForm.108")}</li>
                <li>{Intl.lang("ProductList.wave")}(%)</li>
            </ul>
            <ScrollArea style={{height: height-10-45+'px'}}>
            <ul className="trading-exchange-list-content">
                {cfdGroups}
            </ul>
            </ScrollArea>
        </div>
    }
}

export class CFDGroup extends PureComponent{
    constructor(props){
        super(props);

        this.state = {
            expanded: this.props.expanded,
        }
    }

    componentWillMount() {
        if (this.state.expanded){
            if (!this.props.isMenu || (this.props.isMenu && Number(this.props.visible))){
                if (this.props.list.length) CfdTradeModel.subscribeTicksByGroup(this.props.group, this.props.isMenu);
            }
        }
    }

    componentWillReceiveProps(nextProps) {
        //菜单中的
        if (nextProps.isMenu){
            if (Number(nextProps.visible) && this.state.expanded){
                CfdTradeModel.subscribeTicksByGroup(nextProps.group, nextProps.isMenu);
            }else{
                CfdTradeModel.unsubTicksByGroup(nextProps.group, nextProps.isMenu);
            }
        }else{
            if (this.state.expanded){
                // if (!nextProps.expanded){
                //     //原来展开的，后来获取到code对应的group折叠了
                //     this.setState({expanded: false});
                //     if (this.props.list.length) CfdTradeModel.unsubTicksByGroup(this.props.group, this.props.isMenu);
                // }else{
                    //刷新时之前没有列表，当前有列表的需订阅
                    if (!this.props.list.length && nextProps.list.length) CfdTradeModel.subscribeTicksByGroup(nextProps.group, nextProps.isMenu);
                // }
            }else if(nextProps.expanded){
                if (this.props.code!=nextProps.code || nextProps.group=="0"){
                    this.setState({expanded: true});
                    if (nextProps.list.length)  CfdTradeModel.subscribeTicksByGroup(nextProps.group, nextProps.isMenu);
                }
                // //原来折叠，后来获取到code对应的group展开了
                // this.setState({expanded: true});
                // if (nextProps.list.length)  CfdTradeModel.subscribeTicksByGroup(nextProps.group, nextProps.isMenu);
            }
        }
    }

    toggle(){
        var expanded = !this.state.expanded;
        this.setState({expanded}, ()=>{
            if (expanded){
                CfdTradeModel.subscribeTicksByGroup(this.props.group, this.props.isMenu);
            }else{
                CfdTradeModel.unsubTicksByGroup(this.props.group, this.props.isMenu);
            }
        });
    }

    componentWillUnmount() {
        if (this.state.expanded){
            CfdTradeModel.unsubTicksByGroup(this.props.group, this.props.isMenu);
        }

        super.componentWillUnmount();
    }

    render(){
        let {expanded} = this.state;
        const {code, group, filter, list, addFavorite, isMenu} = this.props;

        var plist = list;
        if (plist){
            if (filter) plist = plist.filter(v=>CfdTradeModel.searchFilter(filter, v))
        }

        return <li className={"f-por item"+ (expanded ? " on" : "")}>
            <div className="item-title" onClick={this.toggle.bind(this)}><i className="iconfont icon-arrow-l"></i><span>{Intl.lang(`cfd.product.group${group}`)+(!!filter?`(${plist.length})`:"")}</span></div>
            {(expanded && !!plist) && <CFDGroupProducts code={code} plist={plist} group={group} addFavorite={addFavorite} isMenu={isMenu}/>}
            <div className="handle"></div>
        </li>
    }
}

export class CFDGroupProducts extends PureComponent{
    constructor(props){
        super(props);

        this.isMobile = isMobile();

        this.state = {

        }
    }

    componentWillMount() {
        Event.addListener(Event.EventName.PRICE_UPDATE, this.onPriceUpdate.bind(this), this);
    }

    onPriceUpdate(){
        this.forceUpdate();
    }


    addFavorite(code, isRemove, e){
        e.stopPropagation();

        if (this.props.addFavorite){
            this.props.addFavorite(code, isRemove);
        }
    }

    showDetail(product, e){
        e.stopPropagation();

        PopDialog.open(<CFDProductDetail product={product}/>, "cfd-pDetail", true, null, true);
    }

    selectProduct(product, e){
        e.stopPropagation();

        CfdTradeModel.mgr().btnSelectProduct(product);
    }

    openNewOrder(side, product, e){
        e.stopPropagation();

        if (!AuthModel.checkAuthAndRedirect(window.location.pathname)) return;

        var currency = CfdTradeModel.getCurrency();
        var isSupport = CfdTradeModel.checkSupportCurrency(product.Code, currency);
        if (!isSupport){
            Notification.error(Intl.lang("trade.openError.currency", product.DisplayName, CfdTradeModel.getCurrencySymbol(currency)));
            return;
        }

        // PopDialog.closeByDomID('cfd-newOrder');

        PopDialog.open(<CFDNewOrderForm code={product.Code} side={side}/>, "", false, (obj)=>{return {top:Math.min(90, obj.top), left:obj.left}}, true);
    }

    showMenu(product, inFavorite, e){
        e.stopPropagation();
        e.preventDefault();

        var sProduct = product.Code+String(inFavorite);
        if (CfdTradeModel.showMenuProduct){
            var isSame = CfdTradeModel.showMenuProduct==sProduct;
            // console.log(sProduct, CfdTradeModel.showMenuProduct, "close");
            PopDialog.closeByDomID("product-submenu");
            if (isSame) return;
        }

        var x = e.clientX, y = e.clientY, target = e.target;
        var props = {bottom: $(target).offset().top + $(target).height(), eventType:'click',
            inFavorite, showDetail:this.showDetail.bind(this, product), addFavorite:this.addFavorite.bind(this, product.Code, inFavorite),
            onClose:()=>{
                // console.log(CfdTradeModel.showMenuProduct, "onClose");
                CfdTradeModel.showMenuProduct = null;
            }};

        PopDialog.open(<ProductMenu x={x+10} y={y} pnComponent={this} {...props} />, "product-submenu", false, false);

        CfdTradeModel.showMenuProduct = sProduct;
        // console.log(CfdTradeModel.showMenuProduct, "open");
    }

    render(){
        const {code, group, plist, isMenu} = this.props;

        return plist.map((v, i)=>{
            var selected = v.Code==code;
            var inFavorite = CfdTradeModel.isMyFavorite(v.Code);
            var color = !v.price || !v.price.change ? "" : (v.price.change>0?" exchange-green":" exchange-red");
            var openInfo = CfdTradeModel.getTradingTimeStatus(v);
            var isOpen = openInfo.status;

            var content = <ul className={"item-content point"+(selected?" on":"")} onClick={this.selectProduct.bind(this, v)} key={`cgp${group}${v.Code}`}>
                {!isMenu && <li className="first-icon" onClick={this.showMenu.bind(this, v, inFavorite)}><i className="iconfont icon-trading-menu"></i></li>}
                {(isMenu && this.isMobile) && <li className="first-icon" onClick={this.addFavorite.bind(this, v.Code, inFavorite)}><i className={"fs14 iconfont"+(inFavorite?" icon-delete":" icon-mark")} style={{color: inFavorite?"#ee4747":"#f3e25c"}}></i></li>}
                <li className="type">{v.DisplayName}</li>
                <li className={"sell"+(isOpen ? " exchange-red":" exchange-white")} onClick={(e)=>{if(isOpen && !isMenu) this.openNewOrder(CONST.FUT.Side.SELL, v, e)}}><span>{v.price && v.price.BID ? Decimal.toFixed(v.price.BID, v.PriceFixed) : "--"}</span></li>
                <li className={"buy"+(isOpen ? " exchange-green":" exchange-white")} onClick={(e)=>{if(isOpen && !isMenu) this.openNewOrder(CONST.FUT.Side.BUY, v, e)}}><span>{v.price && v.price.ASK ? Decimal.toFixed(v.price.ASK, v.PriceFixed) : "--"}</span></li>
                <li className={"change"+color}>{v.price && v.price.ASK ? v.price.chg+"%" : "--"}</li>
                <li className="last-icon"><i className={v.Country?"flag "+v.Country:""}></i></li>
            </ul>

            if (!isOpen){
                var times = openInfo.time;
                var tip = Intl.lang("cfd.tradeClose.tip1") + (times.length ? Intl.lang("cfd.tradeClose.tip2", SysTime.ts2Server(times[0]), SysTime.ts2Server(times[1])) : "");
                return <ToolTip title={tip} style={{width:"351px", height:"24px", }} key={`cgpt${group}${v.Code}`} className="cfd-tooltip" childOffset={{top:-40}}>{content}</ToolTip>
           }else{
                return content
            }
        })
    }
}

class ProductMenu extends PureComponent{
    selectItem(action, e){
        const {showDetail, addFavorite} = this.props;

        if (action=='showDetail'){
            showDetail(e);
        }else if(action=='addFavorite'){
            addFavorite(e);
        }

        if (this.props.close){
            this.props.close();
        }
        // if (this.cmRef){
        //     this.cmRef.close();
        // }
    }

    render(){
        const {inFavorite} = this.props;

        return <ContextMenu {...this.props} contrainer={({children, ...rest})=>{
            return <ul className="icon-menu-list" {...rest}>{children}</ul>
        }}>
            <li onMouseDown={this.selectItem.bind(this, 'showDetail')}><i className="iconfont icon-details"></i>{Intl.lang("cfd.product.detail")}</li>
            <li onMouseDown={this.selectItem.bind(this, 'addFavorite')}><i className={"iconfont"+(inFavorite?" icon-delete":" icon-mark")}></i>{Intl.lang(inFavorite?"cfd.product.removeFav":"cfd.product.addFav")}</li>
        </ContextMenu>
    }
}
