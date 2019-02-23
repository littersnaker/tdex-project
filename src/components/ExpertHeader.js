import Intl from '../intl';
import React from 'react';

import PureComponent from "../core/PureComponent"
import history from '../core/history';
import { Link } from 'react-router';

import ProductList from './ProductList'
import ProductItem from './ProductItem'

import LoginBox from './LoginBox';
import ThemeSetting from './FutTradeThemeSetting';

import TradeMgr from '../model/trade-mgr';
import Event from '../core/event';
import {DropDown,Contrainer} from './DropDown';
import PopDialog from "../utils/popDialog"
import {CONST} from "../public/const";

class Header extends PureComponent {
    constructor(props) {
        super(props);

        //是否桌面版
        this.isDesktop = process.env.VER_ENV=='desktop';
        this.isSimple = props.isExpert;

        this.code = this.props.code;
        this.tradeType = this.props.entry;

        this.unmount = false;

        this.state = {
            code: this.code,
            selected: TradeMgr.getProduct(this.code, this.tradeType),

            slang : Intl.getLang(),
            modeTab: this.isSimple || 0
        };
    }

    componentWillMount(){
        Event.addListener(Event.EventName.PRICE_UPDATE, this.onUpdatePrice.bind(this), this);
        Event.addListener(Event.EventName.PRODUCT_UPDATE, this.onUpdateProduct.bind(this), this);
        Event.addListener(Event.EventName.PRODUCT_SELECT, this.onSelectProduct.bind(this), this);

        this.onUpdateProduct();
    }

    componentWillReceiveProps(nextProps) {
        if (this.code!=nextProps.code && nextProps.code || this.tradeType!=nextProps.tradeType && nextProps.tradeType){
            this.code = nextProps.code;
            this.tradeType = nextProps.tradeType;
            this.onUpdateProduct();
        }
    }
    onUpdatePrice(info){
        this.onUpdateProduct(info);
        // var isChanged = false;
        // for (var code in info){
        //     var price = info[code];
        //     if (price.LAST_CHANGED){
        //         isChanged = true;
        //         break;
        //     }
        // }
        //
        // if (isChanged){
        //     this.onUpdateProduct(info);
        // }
    }
    onUpdateProduct(info){
        var data = {code: this.code};
        if (!info || info[this.code]){
            data.selected = TradeMgr.getProduct(this.code, this.tradeType);
        }
        this.setState(data);
    }
    onSelectProduct(code){
        this.code = code;
        this.setState({code: code, selected:TradeMgr.getProduct(this.code, this.tradeType)});
    }
    goHome(){
        if (this.isDesktop) return;

        history.replace('/')
    }
    // toggleLang(){
    //     var flag = this.refs["lang-list"].style.display;
    //     if(flag=="block"){
    //         this.refs["lang-list"].style.display = "none";
    //     }else{
    //         this.refs["lang-list"].style.display = "block";
    //     }
    // }
    changeSkin(skin){
        return this.props.onChange(skin, true);
    }
    changeLangue(lang){
        // change lang
        if (lang){
            // this.toggleLang();
            this.langRef.hide();

            var self = this;
            Intl.setLang(lang, function(){
                if (!self.unmount) self.setState({'slang':lang});
            });
        }
    }
    changeExpertMode(isExpert){
        this.setState({modeTab: isExpert});
        return this.props.onChangeExpert(isExpert);
    }
    componentWillUnmount(){
        this.unmount = true;

        super.componentWillUnmount();
    }
    setMenuRef(c){
        this.menuRef = c;
    }
    setLangRef(c){
        this.langRef = c;
    }
    settingTheme(params){
        this.changeExpertMode(params.modeTab);
        this.changeSkin(params.skinTheme);
        PopDialog.close();
    }
    openThemeSetting(){
        PopDialog.open(<ThemeSetting isExpert={this.props.isExpert} onChange={this.settingTheme.bind(this)}/>, "themeSkin-setting")
    }
    render() {
        const {user, uInfo, skinInfo, isTrade, className, loginBoxClassName, entry} = this.props;
        const {code, selected, modeTab} = this.state;

        const pathName = window.location.pathname;

        // var isFut = TradeMgr.isFut(code);
        let langue = Intl.supports;
        let langTxt = {'zh-cn':"简体中文", 'en-us':"English", 'zh-tw':"繁體中文", 'ja-jp': '日本語'};
        let Skins = [];
        if(skinInfo){
            Skins = ['skin-p', 'skin-g', 'skin-w'];
        }

        const isFut = this.tradeType==CONST.TRADE_TYPE.FUT;
        const isCfd = this.tradeType==CONST.TRADE_TYPE.CFG;

        // console.log("ExpertHeader selected", JSON.stringify(selected));
        // console.log("productList", JSON.stringify(productList));

        return (
            <header className={className ? className : "header-box m-hide" + (isFut ? "" : " spot")} style={isFut ? {} : {backgroundColor:"#272d33",borderColor:"#000"}}>
                <div className="tradefull-head-box f-clear">
                    <div className="header-logo-box f-clear">
                        <div className={"point"+(this.isDesktop ? " hide": "")}>
                            <div className="fl">
                                <span className="header-logo fl" onClick={()=>this.goHome()}></span>
                                <span className="header-logo-txt fl">{Intl.lang("AdvBox.100")}</span>
                            </div>
                            <ul className="header-td-nav fl">
                                <li><Link to={'/cfd'} className={pathName.indexOf('/cfd')!=-1 ? "active" : null}>{Intl.lang('Partner.text.64')}</Link></li>
                                <li><Link to={'/trade'} className={pathName.indexOf('/trade')!=-1 ? "active" : null}>{Intl.lang('fut.type.7')}</Link></li>
                                <li><Link to={'/exchange'} className={pathName.indexOf('/exchange')!=-1 ? "active" : null}>{Intl.lang('new.home.header.2')}</Link></li>
                            </ul>
                        </div>
                        <div className="header-product-part">
                            <div className="mr-10"><span>{selected ? (selected.DisplayName ? selected.DisplayName : selected.Name) : '--'}</span></div>
                            {(isFut || isCfd) && <ProductItem data={selected} inMenu={false} isTrade={true} tradeType={this.tradeType}/>}
                        </div>
                    </div>

                    <div className="td-lang-part">
                        <div className={loginBoxClassName ? loginBoxClassName : "login-box futures-h f-clear"}>
                        {window.IS_LOCAL&& <LoginBox user={user} uInfo={uInfo} isExpert={true}/>}
                            {isFut && <div className="fl head-icon-config" onClick={this.openThemeSetting.bind(this)}>
                                <i className="iconfont icon-setting"></i>
                            </div>}
                            {!this.isDesktop && <div className="fl head-icon-config">
                                <i className="iconfont icon-helper"></i>
                                <ul className={"head-icon-config-hover " + Intl.getLang()}>
                                    <li><a href={"https://support.tdex.com/hc/"+Intl.getLang()+"/sections/360000015451"} target="_blank">{Intl.lang("trade.guide")}</a></li>
                                    <li><a href={"https://support.tdex.com/hc/"+Intl.getLang()+"/requests/new"} target="_blank">{Intl.lang("SecondVerification.7")}</a></li>
                                </ul>
                            </div>}
                            </div>
                        <div className="border-l h-50 pdr-20">
                            <div id="langselect" className="ml-20 fem875"><DropDown trigger="click" menuRef={()=>this.langRef} ref={(c)=>this.dropDownRef=c}><cite><span>{langTxt[this.state.slang]}</span></cite></DropDown>
                                <Contrainer ref={this.setLangRef.bind(this)} pnRef={()=>this.dropDownRef}>
                                    <ul className="full-lang">
                                        {langue.map((item, index)=>{
                                            return <li key={index} onClick={()=>this.changeLangue(item)}><a href="javascript:;"><span>{langTxt[item]}</span></a></li>
                                        })}
                                    </ul>
                                </Contrainer>
                            </div>
                        </div>
                    </div>
                    {/*
                    {skinInfo &&
                    <div className="skin-set lh-50">
                        <i className="iconfont icon-skin fs24" onClick={this.openThemeSetting.bind(this)}></i>
                        <div className="skin-box hide">
                            {skinInfo.map((item, index)=> {
                                return <span key={index} className={"iconfont icon-skin "+ Skins[index]} onClick={()=>this.changeSkin(item)}></span>
                            })}
                        </div>
                    </div>
                    }
                    {skinInfo &&
                    <div className="skin-set mode-set lh-50">
                        <i className="iconfont icon-exchange fem125"></i>
                        <div className="mode-box hide">
                            <p className={modeTab?"":"current"} onClick={()=>this.changeExpertMode(0)}><span className="iconfont icon-easy"></span>{Intl.lang("NavBar.normal")}</p>
                            <p className={modeTab?"current":""} onClick={()=>this.changeExpertMode(1)}><span className="iconfont icon-specialty"></span>{Intl.lang("NavBar.major")}</p>
                        </div>
                    </div>}
                     */}
                </div>
            </header>
        );
    }
}

export default Header;
