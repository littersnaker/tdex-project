import React from 'react';
import PureComponent from '../core/PureComponent'
// import TradeMgr from '../model/trade-mgr';
//import SpotTradeExpert from '../components/SpotTradeExpert';
import SpotTrade from '../components/SpotTrade';
import Event from "../core/event";
import SpotTradeModel from '../model/spot-trade';

export default class Exchange extends PureComponent {
    constructor(props) {
        super(props);

        var code = this.props.params.name;
        // if (!code) code = SpotTradeModel.getCurrCode();

        this.state = {
            code
        }
    }

    componentWillMount(){
        Event.addListener(Event.EventName.PRODUCT_UPDATE, this.onProductUpdate.bind(this), this);

        this.onProductUpdate();
    }

    onProductUpdate(){
        var list = SpotTradeModel.getProductList();
        if (list.length){
            if (!this.state.code){
                this.onChangeCode(this.getDefaultCode(list));
            }else{
                SpotTradeModel.selectCode(this.state.code, true);
                this.forceUpdate();
            }
        }
    }

    getDefaultCode(list){
        return list && list[0] ? list[0].Code : "";
    }

    componentWillReceiveProps(nextProps){
        var code = nextProps.params.name;
        if (code!=this.props.route.name){
            if (!code) code = this.getDefaultCode(SpotTradeModel.getProductList());
        }
        //如果获取产品列表延时时，没有赋值，重新赋值
        if (this.state.code != code && code) this.onChangeCode(code);
    }

    onChangeCode(code){
        if (code && this.state.code!=code){
            SpotTradeModel.selectCode(code, true);

            this.setState({code: code});
        }
    }

    componentWillUnmount(){
        SpotTradeModel.unselectCode();

        super.componentWillUnmount();
    }

    render() {
        const {user, uInfo} = this.props;
        const {code} = this.state;

        return <SpotTrade code={code} user={user} uInfo={uInfo} />;
    }
}
