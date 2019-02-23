import Intl from '../intl'
import React from 'react'
import PureComponent from '../core/PureComponent'
import { Link } from 'react-router'
import GlobelStore from '../stores'
import AuthModel from '../model/auth'
import TdexLogo from '../images/logo.png'
import { isMobile } from '../utils/util'
import {
    IS_MINING_OPEN,
    IS_SIMULATE_TRADING,
    IS_CLOSE_EXCHANGE,
    IS_ENGINE_TRADING
} from '../config'
// import TradeMgr from "../model/trade-mgr";

class MobileMenu extends PureComponent {
    constructor(props) {
        super(props)
        this.isMobile = isMobile()
        this.state = {
            showMenu: false,
            uInfo: GlobelStore.getUserInfo()
        }
    }

    componentWillReceiveProps(nextProps) {
        if (this.state.uInfo != GlobelStore.getUserInfo()) {
            this.setState({uInfo: GlobelStore.getUserInfo()})
        }
    }

    showMenu() {
        this.setState({showMenu: !this.state.showMenu})
    }

    changeLangue(lang) {
        if (lang && lang != Intl.getLang()) {
            Intl.setLang(lang)
        }
    }

    logout(evt) {
        evt.preventDefault()
        AuthModel.logout()
    }

    render() {
        const {showMenu, uInfo} = this.state
        const listName = window.location.pathname
        const hideheader = location.pathname.indexOf('register') != -1
        let langTxt = {'zh-cn': Intl.lang('lang.lang_zh-cn'), 'en-us': 'English'}
        const pathName = window.location.pathname;

        var redirect;
        if (pathName.indexOf("/trade")!=-1 || pathName.indexOf("/cfd")!=-1){
            redirect = pathName;
        }
        var loginTo = { pathname: '/login', query: redirect ? { return_to: redirect } : {}};

        // var fCodes = TradeMgr.getTypeCodes('fut');
        // var sCodes = TradeMgr.getTypeCodes('spot');
        //
        // var fcode = fCodes && fCodes[0] ? fCodes[0] : "BTCUSD";
        // var scode = sCodes && sCodes[0] ? sCodes[0] : "TDBTC";

        return (
            <header id="header" className={pathName == '/' ? 'header-top' : 'header-down'}>
                <div className="f-clear">
                    <div className="header-logo-box f-clear point">
                        <Link to="/" className="header-logo fl m-header-logo"/>
                    </div>
                    {!uInfo.Email && (
                        <div className="header-logo-register">
                            <Link to={loginTo}>{Intl.lang('LoginBox.100')}</Link>
                            <Link to="/register">{Intl.lang('header.1_10')}</Link>
                        </div>
                    )}
                    <div className="mediaIcon pc-hide" onClick={() => this.showMenu()}>
                        <span/>
                        <span/>
                        <span/>
                    </div>
                    {showMenu ? (
                        <div className={'mobile-menu-conten ' + (showMenu == true ? 'fadeIn' : 'fadeOut')}>
                            <div className={'m-menu-l fl ' + (showMenu == true ? 'slideInLeft' : '')}>
                                <div className="m-menu-logo">
                                    <div className="m-logo-pic">
                                        <Link to="/">
                                            <img src={TdexLogo}/>
                                        </Link>
                                    </div>
                                </div>

                                <ul className="m-list">
                                    <li className={Intl.getLang() + (listName.indexOf('/cfd')!=-1 ? " activation" : '')}>
                                        <Link to={'/cfd'}>
                                            <p>{Intl.lang('cfd.name')}</p>
                                        </Link>
                                    </li>
                                    <li className={Intl.getLang() + (listName.indexOf("/trade")!=-1 ? ' activation' : '')}>
                                        <Link to={"/trade"}>
                                            <p>{Intl.lang('fut.type.7')}</p>
                                        </Link>
                                    </li>
                                    {!IS_CLOSE_EXCHANGE && (
                                        <li className={Intl.getLang() + (listName.indexOf("/exchange")!=-1 ? ' activation' : '')}>
                                            <Link to={"/exchange"}>
                                                <p>{Intl.lang('new.home.header.2')}</p>
                                            </Link>
                                        </li>
                                    )}
                                    {!IS_ENGINE_TRADING && (
                                        <li className={Intl.getLang() + (listName.indexOf("/partner")!=-1 ? ' activation' : '')}>
                                        <Link to={'/partner'}><p>{Intl.lang('Personal.super.text')}</p></Link>
                                    </li>
                                    )}

                                    {uInfo.Email ? (
                                        <React.Fragment>
                                            <li className={ Intl.getLang() + (listName == '/asset' ? ' activation' : '')}>
                                                <Link to="/asset">
                                                    <p>{Intl.lang('NavBar.103')}</p>
                                                </Link>
                                            </li>
                                            <li className={ Intl.getLang() + (listName == '/personal' || listName == '/' ? ' activation' : '')}>
                                                <Link to="/personal">
                                                    <p>{Intl.lang('NavBar.104')}</p>
                                                </Link>
                                            </li>
                                        </React.Fragment>
                                    ) : (
                                        <React.Fragment>
                                            <li className={Intl.getLang() + (listName == '/register' ? ' activation' : '')}>
                                                <Link to="/register">
                                                    <p>{Intl.lang('register.title')}</p>
                                                </Link>
                                            </li>
                                            <li className={Intl.getLang() + (listName == '/login' ? ' activation' : '')}>
                                                <Link to="/login">
                                                    <p>{Intl.lang('activateSucc.1_6')}</p>
                                                </Link>
                                            </li>
                                        </React.Fragment>
                                        )}
                                </ul>

                                {uInfo.Email && (
                                    <div className="m-menu-exit">
                                        <a href="javascript:;" className="pd010 c-8" onClick={this.logout}>
                                            {Intl.lang('header.1_2')}
                                        </a>
                                    </div>
                                )}
                                <div className="m-change-lang">
                                    {Intl.getLang() == 'en-us' ? (
                                        <span onClick={() => this.changeLangue('zh-cn')}><i className="iconfont icon-change"/>{langTxt['zh-cn']}</span>
                                    ) : (
                                        <span onClick={() => this.changeLangue('en-us')}><i className="iconfont icon-change"/>{langTxt['en-us']}</span>
                                    )}
                                </div>
                            </div>
                            <div className="m-menu-r fl" onClick={() => this.showMenu()}/>
                        </div>
                    ) : null}
                </div>
            </header>
        )
    }
}

export default MobileMenu
