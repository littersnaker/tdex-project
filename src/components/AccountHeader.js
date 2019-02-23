import React from 'react';

import PureComponent from "../core/PureComponent"

import NavBar from './NavBar';
import HeaderUserInfo from "./HeaderUserInfo";


class Header extends PureComponent{
    render() {
        return (
            <header className="headerbox border-bt">
                <div className="hidden-mb contain f-clear">
                    <div className="logo-sub ml20 hidden-mb pos-a"></div>
                    <HeaderUserInfo />
                    <span aria-hidden="false" className="nav-toggle Hui-iconfont hidden-pc r10" style={{"padding": "0"}}>  </span>
                    <NavBar />
                </div>

            </header>
        );
    }
}

export default Header;