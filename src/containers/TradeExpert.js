import React from 'react';
import PureComponent from '../core/PureComponent'
// import TradeMgr from '../model/trade-mgr';
import FutTradeExpert from '../components/FutTradeExpert';
import FutTradeMobile from '../components/FutTradeMobile';
import FutTradeModel from '../model/fut-trade';
import { isMobile } from '../utils/util';
import Event from "../core/event";

class TradeExpert extends PureComponent {
    constructor(props) {
        super(props);

        this.isMobile = isMobile();

        var code = this.props.params.name;
        // if (!code) code = FutTradeModel.currCode;

        this.state = {
            code
        }
    }

    componentWillMount(){
        Event.addListener(Event.EventName.PRODUCT_UPDATE, this.onProductUpdate.bind(this), this);

        this.onProductUpdate();
    }

    onProductUpdate(){
        var list = FutTradeModel.getProductList();
        if (list.length){
            if (!this.state.code){
                this.onChangeCode(this.getDefaultCode(list));
            }else{
                FutTradeModel.selectCode(this.state.code, true);
                this.forceUpdate();
            }
        }
    }

    getDefaultCode(list){
        return list && list[0] && list[0][0] ? list[0][0].Code : "";
    }

    componentWillReceiveProps(nextProps){
        var code = nextProps.params.name;
        if (code!=this.props.route.name){
            if (!code) code = this.getDefaultCode(FutTradeModel.getProductList());
        }
        //如果获取产品列表延时时，没有赋值，重新赋值
        if (this.state.code != code && code) this.onChangeCode(code);
    }

    onChangeCode(code){
        if (code && this.state.code!=code){
            FutTradeModel.selectCode(code, true);

            this.setState({code: code});
        }
    }

    componentWillUnmount(){
        FutTradeModel.unselectCode();

        super.componentWillUnmount();
    }

    render() {
        const {user, uInfo} = this.props;
        const {code} = this.state;

        if(this.isMobile){
            return <FutTradeMobile code={code} user={user} uInfo={uInfo} />;
        }
        return <FutTradeExpert code={code} user={user} uInfo={uInfo} />;
    }
}
export default TradeExpert;
