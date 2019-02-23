import React from 'react';
import PureComponent from '../core/PureComponent'
import { Link } from 'react-router';

import Intl from '../intl';
import Net from "../net/net";
import QRCode from 'qrcode.react';
import { DOWNLOAD_LINK } from '../config';
import Event from '../core/event'
import { checkAgent } from '../utils/util';
import Footer from "../components/Footer";
import Header from "../components/Header";
import HomeSwiper from '../components/HomeSwiper';
import TradingKline from '../components/TradingKline';
import HomeTips from '../components/HomeTips';
// import MiningPieChart from '../components/MiningPieChart';

class Home extends PureComponent {
    constructor(props) {
        super(props);
        this.langChange = false;
        this.state = {
            messageData: null,
            checkAgent: checkAgent()
        }
    }
    componentWillMount() {
        Event.addListener(Event.EventName.LANG_SELECT, this.changeLang.bind(this), this);
    }
    componentDidMount() {
        this.fetchBanner();
    }
    changeLang(){
        this.langChange = !this.langChange;
        this.fetchBanner();
    }

    fetchBanner() {
        Net.httpRequest("news/messages", '', (data) => {
            if (data.Status === 0) {
                this.setState({messageData:data.Data});
            }
        }, this);
    }
    render() {
        const { messageData, checkAgent } = this.state, {user, uInfo} = this.props;

        let banner = null;
        if(messageData){
            banner = messageData.Banner;
        }
        return (
            <div className="home">
                <HomeSwiper banner={banner} refresh={this.langChange}/>
                <HomeTips/>
                <TradingKline/>
                {/*<TradeMining />*/}
                <div className="introduce-section">
                    <div>
                        <div className="introduce-section-item">
                            <div className="introduce-section-bg item-bg1"></div>
                            <div className="introduce-section-text">
                                <h4>{Intl.lang('new.home.introduce.1')}</h4>
                                <p>{Intl.lang('new.home.introduce.2')}</p>
                                <p>{Intl.lang('new.home.introduce.3')}</p>
                            </div>
                        </div>
                        <div className="introduce-section-item">
                            <div className="introduce-section-bg item-bg2"></div>
                            <div className="introduce-section-text">
                                <h4>{Intl.lang('new.home.introduce.4')}</h4>
                                <p>{Intl.lang('new.home.introduce.5')}</p>
                                <p>{Intl.lang('new.home.introduce.6')}</p>
                            </div>
                        </div>
                        <div className="introduce-section-item">
                            <div className="introduce-section-bg item-bg4"></div>
                            <div className="introduce-section-text">
                                <h4>{Intl.lang('new.home.introduce.10')}</h4>
                                <p>{Intl.lang('new.home.introduce.11')}</p>
                            </div>
                        </div>
                        <div className="introduce-section-item">
                            <div className="introduce-section-bg item-bg3"></div>
                            <div className="introduce-section-text">
                                <h4>{Intl.lang('new.home.introduce.7')}</h4>
                                <p>{Intl.lang('new.home.introduce.8')}</p>
                                <p>{Intl.lang('new.home.introduce.9')}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <ClientMore />
                {checkAgent.android && <LinkDownload />}
                {!(uInfo && uInfo.Email) && <div className="soon-trading home-section-item m-hide">
                    <h3>{Intl.lang('new.home.soon.trading.1')}</h3>
                    <p>{Intl.lang('new.home.soon.trading.2')}</p>
                    <div>
                        <Link to="/login">{Intl.lang('LoginBox.100')}</Link>
                        <Link to="/register">{Intl.lang('header.1_10')}</Link>
                    </div>
                </div>
                }

            </div>
        )
    }
}
export default Home;

class TradeMining extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
        }
    }

    render(){

        return (
            <div className="mining-section home-section-item">
                <h3>交易即挖矿，持币享分红</h3>
                <p>持TD即享平台交易手续费100%分红</p>
                <a href="#">什么是挖矿交易，收益分红></a>
                <div className="mining-section-flex">
                    <div className="mining-circular">
                        <div className="mining-circular-chart">
                            <MiningPieChart data={{Mined:15827734.0000, Remaining:3387709.0000}} />
                        </div>
                    </div>
                    <div className="mining-data">
                        <ul>
                            <li>
                                <p>
                                    今日待分配收入累计折合（BTC）
                                </p>
                                <p className="mining-share-data">
                                    321,36474658
                                </p>
                            </li>
                            <li>
                                <p>
                                    今日待分配收入累计折合（BTC）
                                </p>
                                <p className="mining-share-data">
                                    321,36474658
                                </p>
                            </li>
                            <li>
                                <p>
                                    昨日挖矿产出（BTC）
                                </p>
                                <p className="mining-share-data">
                                    321,36474658
                                </p>
                            </li>
                        </ul>
                        <ul>
                            <li>
                                <p>
                                    今日每百万TD待分配收入（BTC）
                                </p>
                                <p className="mining-share-data">
                                    321,36474658
                                </p>
                            </li>
                            <li>
                                <p>
                                    昨日每百万TD待分配收入（BTC）
                                </p>
                                <p className="mining-share-data">
                                    321,36474658
                                </p>
                            </li>
                            <li>
                                <p>
                                    总流通量（BTC）
                                </p>
                                <p className="mining-share-data">
                                    321,36474658
                                </p>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        )
    }
}

class ClientMore extends PureComponent {
    constructor(props) {
        super(props);

        this.appLink = window.location.origin + "/appdownload?welcome=qrCode";
        this.state = {
        }
    }

    render(){
        const Lang = Intl.getLang();
        return <div className="client-section home-section-item m-hide">
            <h3>{Intl.lang('new.home.client.1')}</h3>
            <p>{Intl.lang('new.home.client.2')}</p>
            <div>
                <div className="client-section-item">
                    <div className="client-bg-item client-bg-ios"></div>
                    <a href="javascript:;">{Intl.lang('new.home.client.3')}
                        <div className={"client-bg-qr "+Lang}>
                            {/*<p style={{textAlign:"center"}}>{Intl.lang('new.home.online')}</p>
                            <p style={{textAlign:"center"}}>{Intl.lang('common.coming_soon')}</p>
                            */}
                            <p>{Intl.lang('new.home.client.4')}</p>
                            <div>
                                <QRCode value={this.appLink} size={90} />
                            </div>
                        </div>
                    </a>
                </div>
                <div className="client-section-item">
                    <div className="client-bg-item client-bg-android"></div>
                    <a href="javascript:;">{Intl.lang('new.home.client.5')}
                        <div className={"client-bg-qr "+Lang}>
                            {/*<p style={{textAlign:"center"}}>{Intl.lang('new.home.online')}</p>
                            <p style={{textAlign:"center"}}>{Intl.lang('common.coming_soon')}</p>
                             */}
                            <p>{Intl.lang('new.home.client.4')}</p>
                            <div>
                                <QRCode value={this.appLink} size={90} />
                            </div>
                        </div>
                    </a>
                </div>
                <div className="client-section-item">
                    <div className="client-bg-item client-bg-mac"></div>
                    <a href={DOWNLOAD_LINK.MAC}>{Intl.lang('new.home.client.6')}</a>
                </div>
                <div className="client-section-item">
                    <div className="client-bg-item client-bg-win"></div>
                    <a href={DOWNLOAD_LINK.WINDOW}>{Intl.lang('new.home.client.7')}</a>
                </div>
            </div>
        </div>
    }
}

class LinkDownload extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {

        }
    }

    render(){
        return <div className="link-download pc-hide">
            <div className="advert-download-pic"></div>
            <div className="advert-download-text">
                <h3>{Intl.lang('link.download.setion.1')}</h3>
                <p>{Intl.lang('link.download.setion.2')}</p>
            </div>
            <Link to={'/appdownload'} className="advert-download-btn">{Intl.lang('NavBar.app.dow.1')}</Link>
        </div>
    }
}

