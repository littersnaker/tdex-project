import Intl from '../intl';
import React from 'react';
import { Link } from 'react-router';

import PureComponent from '../core/PureComponent'

import TradeMgr from '../model/trade-mgr';
import Event from '../core/event';
import {IS_MINING_OPEN, IS_SIMULATE_TRADING } from "../config";

class NavbarTrade extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            code: TradeMgr.getCurrCode()||"",
        }
    }

    componentWillMount(){
        Event.addListener(Event.EventName.PRODUCT_UPDATE, this.onDefaultProduct.bind(this), this);
        Event.addListener(Event.EventName.PRODUCT_SELECT, this.onSelectProduct.bind(this), this);
    }
    onDefaultProduct(){
        this.setState({code:TradeMgr.getCurrCode()||""});
    }

    onSelectProduct(code){
        if (this.state.code != code){
            this.setState({code:code});
        }
    }
    render() {
        const {code} = this.state;
        // const isFut = code ? TradeMgr.isFut(code) : false;
        //桌面版
        const isDesktopVersion = "desktop" === process.env.VER_ENV;
        const rest = !isDesktopVersion ? {target:"_blank"} : {};
        const path = window.location.pathname;
        return (
            <div className="fl border-r m-hide head-nav-current">
                {IS_MINING_OPEN && <Link to="/mining" className={"header-nav tc fl border-r "+(path == '/Mining'? 'current' : null)}>
                    <i className="iconfont icon-mining fem125 pdr-5 ver-md"></i>{Intl.lang("NavBar.tradingdig.1")}
                </Link>}
                {!IS_SIMULATE_TRADING ?
                    <a href={"https://"+process.env.REACT_APP_SIMULATE_DOMAIN+"/activities/simulatetrade"} className="header-nav tc fl border-r" target="_blank"><i className="iconfont icon-simulated fem125 pdr-5 ver-md"></i>{Intl.lang("mimic.panel.trading.24")}</a>
                    :
                    <Link to={"/activities/simulatetrade"} className="header-nav tc fl"><i className="iconfont icon-simulated fem125 pdr-5 ver-md"></i>{Intl.lang("mimic.panel.trading.24")}</Link>
                }
                {!IS_SIMULATE_TRADING &&
                <Link to={"/trade/"+code} {...rest} className="header-nav tc fl">
                    <i className="iconfont icon-trading fem15 pdr-5 ver-md"></i>{Intl.lang("NavBar.trade")}
                </Link>
                }
                {/*
                {!isFut && <div className="header-tx tc fl pd020"><Link to={"/trade/"+code}>{Intl.lang("NavBar.normal")}</Link></div>}
                 */}
            </div>
        );
    }
}

export default NavbarTrade;