import React from 'react';
import PureComponent from "../core/PureComponent";
import Header from "../components/Header";
import ActivityTrading from "../components/ActivityTrading";
import LuckDraw from "../components/LuckDraw";
import ActivityVipVoucher from "../components/ActivityVipVoucher";
import ContractTrade from "../components/ContractTrade";

class Activities extends PureComponent {

    constructor(props) {
        super(props);

        this.routerParam = props.params.name;
        this.state = {}
    }
    render() {
        const {isMobile, inApp} = this.props;
        return (
            <React.Fragment>
                {!isMobile && !inApp ? <Header {...this.props}/> : null}
                {this.routerParam == "vipVoucher" ?
                    <ActivityVipVoucher {...this.props} />
                : this.routerParam == "activityTrading" ?
                    <ActivityTrading {...this.props} />
                :this.routerParam == "luckDraw" ?
                    <LuckDraw {...this.props} />
                :this.routerParam == "contractTrade" ?
                    <ContractTrade {...this.props} />
                :null}
            </React.Fragment>
        )
    }
}

export default Activities;
