import React from 'react';
import PureComponent from '../core/PureComponent'
// import TradeMgr from '../model/trade-mgr';
import { isMobile } from '../utils/util';
import Event from "../core/event";
import CFDTrade from "../components/CFDTrade";
import CFDTradeMobile from "../components/CFDTradeMobile";
import CfdTradeModel from '../model/cfd-trade';
import AuthModel from '../model/auth';

export default class CFD extends PureComponent {
    constructor(props) {
        super(props);

        this.isMobile = isMobile();
        // const routeName = this.props.route.name;

        this.state = {

        }
    }

    componentWillMount(){
        Event.addListener(Event.EventName.PRODUCT_UPDATE, this.onProductUpdate.bind(this), this);
        Event.addListener(Event.EventName.FAVORITE_UPDATE, this.onFavoriteUpdate.bind(this), this);

        if (!AuthModel.checkUserAuth() || this.props.params.name)this.onProductUpdate();
        else{
            if (CfdTradeModel.isLoadedMyFav()){
                this.onFavoriteUpdate(0);
            }
        }
    }

    //登录后的，必须等加载完收藏夹数据才选择code
    onFavoriteUpdate(status){
        if (status===0 && !this.props.params.name){
            this.onProductUpdate(true);
        }
    }

    onProductUpdate(isFav){
        var list = CfdTradeModel.getProductList();
        if (list.length){
            var name = this.props.params.name;
            if (name){
                var code = this.getValidCode(name);
                if (code){
                    this.onChangeCode(code);
                    return;
                }
            }

            // //没有设置code的，必须没有登录或者登录后加载了收藏夹数据才选中code
            var isAuth = AuthModel.checkUserAuth();
            if (!isAuth || isAuth && isFav){
                //console.log("CFD", isFav, this.getDefaultCode(isFav));
                this.onChangeCode(this.getDefaultCode(isFav));
            }
        }
    }
    //获取未过期的正确的code;
    getValidCode(code){
        var codeList = CfdTradeModel.getCodeList();
        if (codeList.length){
            if (codeList.indexOf(code)!=-1){
                return code;
            }else{
                var symbol = code.split("_")[0];
                var products = CfdTradeModel.getSymbolProducts(symbol);
                if (products && products.length){
                    for (var i=0,l=products.length; i<l; i++){
                        var item = products[i];
                        if (!item.Hide){
                            return item.Code;
                        }
                    }
                }else{
                    return this.getDefaultCode();
                }
            }
        }
    }

    getDefaultCode(isFav){
        if (isFav){
            var codes = CfdTradeModel.getMyFavCodes();
            if (codes.length){
                return codes[0];
            }
        }
        var groups = CfdTradeModel.getMyGroupSort();
        for (var i=0,l=groups.length; i<l; i++){
            var group = groups[i];
            if (group!="0"){
                var list = CfdTradeModel.getProductsByGroup(group);
                return list && list[0] ? list[0].Code : ""
            }
        }
    }

    componentWillReceiveProps(nextProps){
        var code = nextProps.params.name;
        if (code!=this.props.params.name){
            if (!code) code = this.getDefaultCode();
        }
        //如果获取产品列表延时时，没有赋值，重新赋值
        if (this.state.code != code && code) this.onChangeCode(code);
    }

    onChangeCode(code){
        if (code && this.state.code!=code){
            CfdTradeModel.selectCode(code, true);

            this.setState({code: code});
        }
    }

    componentWillUnmount(){
        CfdTradeModel.unselectCode();

        super.componentWillUnmount();
    }

    render() {
        const {user, uInfo} = this.props;
        const {code} = this.state;

        if(this.isMobile){
            return <CFDTradeMobile code={code} user={user} uInfo={uInfo} />;
        }
        return <CFDTrade code={code} user={user} uInfo={uInfo} />
    }
}
