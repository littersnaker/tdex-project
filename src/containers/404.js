import Intl from '../intl';
import React from 'react';
import { Link } from 'react-router';

import PureComponent from '../core/PureComponent'
import {_style404} from "../css/style.404.min"
import HomeFooter from '../components/Footer';
import { isMobile } from '../utils/util';

import TdexLogo from '../images/tdex-logo.png';
import Png404 from '../images/404.png';

//404
export default class NoFindPage extends PureComponent{
    constructor(props) {
        super(props);

        this.isMobile = isMobile();
        this.state = {
        }
    }
    componentWillMount(){
        if (!document.getElementsByTagName('head')[0].querySelector('style[id="notFound-css"]')) {
            var tag = document.createElement('style');
            tag.id = 'notFound-css';
            tag.innerHTML = _style404;
            document.getElementsByTagName('head')[0].appendChild(tag);
        }
    }
    componentWillUnmount(){
        var parent= document.getElementsByTagName('head')[0];
        var child=document.getElementById("notFound-css");
        parent.removeChild(child);

        // super.componentWillUnmount();
    }
    render(){
        return (
            <div id="page" className="m-id-page">
                <header id="header" className="affix">
                    <div className="header-top m-header-top" style={{padding:0,margin:0}}>
                        <div className="container">
                            <div className="row header-inner m-header-inner ">
                                <div className="col-xs-12">
                                    <div className="site-branding m-site-branding">
                                        <Link id="logo" className="logo" to="/" title="TDEx" rel="home">
                                            <img width="118" height="43" src={TdexLogo} className="attachment-full size-full" alt=""/>
                                        </Link>
                                    </div>
                                    <nav id="menu" className="hidden-xs hide">
                                        <div className="main-menu">
                                            <ul>
                                                <li><a id="login-buttom">Log in <span className="icon"></span></a></li>
                                            </ul>
                                            <div className="account-buttom">
                                                <Link to="/register">Open an account</Link>
                                            </div>
                                        </div>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <div id="wrap" className="nofind-box m-nofind-box">
                    <div className="nofind-bg m-nofind-bg">
                        <div className="nofind-bg1"></div>
                        <div className="nofind-bg2"></div>
                    </div>
                    <div className="nofind-img m-nofind-img">
                        <img src={Png404} width="auto" height="auto"/>
                    </div>
                    <div className="nofind-contain m-nofind-contain">
                        <div className="nofind-404 m-nofind-404">404</div>
                        <div className="nofind-txt m-nofind-txt">
                            <p dangerouslySetInnerHTML={{__html:Intl.lang("NoFind.404.txt")}}></p>
                        </div>
                    </div>
                </div>
                {!this.isMobile?<HomeFooter style={{paddingTop:25}}></HomeFooter>:<button className="m-goBack btn"><Link to="/">{Intl.lang("connect.1_9")}</Link></button>}
            </div>

        )
    }
}
