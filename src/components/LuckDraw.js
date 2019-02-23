import React from 'react';
import PureComponent from "../core/PureComponent";
import Swiper from 'swiper/dist/js/swiper.js';
import 'swiper/dist/css/swiper.min.css';
import BScroll from 'better-scroll';
import history from "../core/history";
import Net from "../net/net";
import Intl from "../intl";
import { checkAgent, isMobile } from "../utils/util";
import BrowserOpen from "./BrowserOpen";
import Clipboard from 'clipboard';
import Icon1 from "../images/icons/mine-share1.png";
import wxIocn from "../images/icons/mine-share-wx.png";
import Icon2 from "../images/icons/mine-share2.png";
import Icon3 from "../images/icons/mine-share3.png";
import Icon4 from "../images/icons/mine-share4.png";
import { toast } from "../utils/common";
import AuthModel from "../model/auth";

export default class LuckDraw extends PureComponent {

    constructor(props) {
        super(props);
        this.clickFlag = true;
        this.swiperTips = null;
        this.RankScroll = null;
        this.isLogin = AuthModel.checkUserAuth();
        this.isMobile = isMobile();
        this.wx = checkAgent().weixin;
        this.state = {
            lang: Intl.getLang(),
            prizeList: [],
            swiperTips: [],
            animation: false,
            turn: false,
            aniRand: 0,
            aniTime: 10000,
            showMask: false,
            maskContent: {},
            count: 0,
            PrizeType: {
                0: {images: '', title: Intl.lang('Luck.draw.text21')},
                1: {images: 'td', title: '111 TD'},
                2: {images: 'td', title: '666 TD'},
                3: {images: 'td', title: '888 TD'},
                4: {images: 'ipad', title: 'ipad'},
                5: {images: 'iphone', title: 'iphone XR'},
                6: {images: 'btc', title: '0.1 BTC'},
            },
            isPrizeing: false,
            pageSize: 15,
            page: 1,
            openNew: false,
            isShare: false,
            noPrize: false
        }
    }

    componentWillReceiveProps(){
        if(this.state.lang !== Intl.getLang()){
            this.setState({lang: Intl.getLang()});
            if(this.swiperTips) this.swiperTips.destroy();
            setTimeout(()=>{this.createSwiperTips()},300);
        }
    }

    componentDidMount() {
        this.fetchAllLuckUid();
        if (this.isLogin) {
            this.fetchLuckDraw(0);
            this.fetchLuckList();
            this.createRankScroll();
        }
        if(this.isMobile){
            this.shareInit();
            this.setClipboard();
        }
    }

    componentWillUnmount(){
        this.swiperTips = null;
        this.RankScroll = null;
        this.clipboard = null;
        clearTimeout(this.setTimer);
        clearTimeout(this.showMask);
    }

    fetchLuckDraw = type => {
        const { PrizeType } = this.state;
        Net.httpRequest('activity/luckdraw', {type: type}, (data) => {
            if (data.Status === 0) {
                const info = data.Data;
                this.setState({
                    count: Number(info.Count),
                    aniRand: info.PrizeType,
                    maskContent: PrizeType[info.PrizeType]
                });
            }
        });
    };

    fetchAllLuckUid = () => {
        Net.httpRequest('activity/luckHistoryNew', null, data => {
            if (data.Status === 0) {
                const info = data.Data;
                this.setState({swiperTips: info.List});
                this.createSwiperTips();
            }
        });
    };

    fetchLuckList = () => {
        const {pageSize, page} = this.state;
        Net.httpRequest('activity/luckHistory', {PageSize: pageSize, Page: page}, (data) => {
            if (data.Status === 0) {
                const info = data.Data;
                this.setState({prizeList: info.List});
                if(this.RankScroll) this.RankScroll.refresh();
            }
        });
    };

    createRankScroll = () => {
        this.RankScroll = new BScroll(this.scrollId, {
            startY:0,
            scrollbar:true,
            pullUpLoad: {
                threshold: -30,
                moreTxt: "Load more",
                noMoreTxt: "There is no more data"
            },
            mouseWheel: {
                speed: 20,
                invert: false,
                easeTime: 300
            }
        });
        this.RankScroll.on('pullingUp', () => {
            if(this.state.pageSize < 50){
                const PageSize = this.state.pageSize + 10;
                this.setState({pageSize: PageSize}, ()=>{
                    this.fetchLuckList();
                    this.RankScroll.finishPullUp();
                });
            }else{
                this.RankScroll.closePullUp();
            }
        });
    };

    createSwiperTips = () => {
        this.swiperTips = new Swiper(this.swiperID, {
            direction: 'vertical',
            autoplay: {
                delay: 5000,
                disableOnInteraction: true,
            },
            loop: true
        });
    };

    getLuckDraw = () => {
        if (gtag) {
            gtag('event', 'select_content', {
                'content_type': 'luckDraw'
            });
        }
        const { count, isPrizeing, PrizeType } = this.state;
        if(this.isLogin === false) {
            history.push({pathname: '/login', query: {return_to: '/activities/luckDraw'}});
        } else {
            if(this.clickFlag){
                this.clickFlag = false;
                if (count === 0) {
                    this.setState({
                        showMask: true,
                        maskContent: PrizeType[0],
                        noPrize: true
                    });
                }
                if ((count === 0) || (isPrizeing === true)) return;
                this.selectPrize();
            }
        }
    };

    changeJump = index => {
        switch (index) {
            case 0: {
                this.clickJump('/recharge');
                break;
            }
            case 1: {
                this.clickJump('/trade/BTCUSD');
                break;
            }
            default: {
                this.clickJump('/activities/luckDraw');
            }
        }
    };

    clickJump = router => {
        history.push({pathname: '/login', query: {return_to: router}});
    };

    closeMask = () => {
        this.fetchLuckList();
        this.setState({
            showMask: false,
            aniRand: 0,
            isPrizeing: false,
            noPrize: false
        });

        this.clickFlag = true;
    };

    selectPrize = () => {
        this.fetchLuckDraw(1);
        this.setState({
            animation: true,
            aniTime: 10000,
            isPrizeing: true
        });

        this.setTimer = setTimeout(() => {
            this.setState({
                animation: false,
                aniTime: 0
            });
            this.showMask = setTimeout(() => {
                this.setState({showMask: true});
            }, 2000);
        }, 10000);
    };

    gotoBrowserOpen = () => {
        if(this.state.openNew){
            this.setState({openNew: false});
        }else {
            this.setState({openNew: true});
        }
    };

    shareContent = () => {
        this.setState({ isShare: !this.state.isShare })
    };

    shareInit = () => {
        window._bd_share_config = {
            common: {
                'bdMini': 2,
                'bdSize': 16,
                "onBeforeClick": () => ({
                    "bdText": Intl.lang('Luck.draw.text22'),
                    "bdUrl": "https://demo.tdex.com/activities/luckDraw"
                })
            },
            'share': {}
        };
        if (window._bd_share_main) {
            window._bd_share_main.init()
        } else {
            $('body').append("<script>with(document)0[(getElementsByTagName('head')[0]||body).appendChild(createElement('script')).src='/static/api/js/share.js?cdnversion='+Date.now()];</script>")
        }
    };

    setClipboard = () => {
        this.clipboard = new Clipboard('.copy-link-share');
        this.clipboard.on('success', () => {
            this.shareContent();
            toast(Intl.lang("Recharge.120"), 0, 1000)
        });
        this.clipboard.on('error', error => {
            console.log(error);
        });
    };

    forEachPrizeId = id => {
        const { PrizeType } = this.state;
        return PrizeType[id].title;
    };

    hideNumber = string => string.toString().substr(0, 3) + '***' + string.toString().substr(6, 8);

    render() {
        const checkBtn = [
            {title: Intl.lang('Luck.draw.text1'), btn: Intl.lang('Luck.draw.text2')},
            {title: Intl.lang('Luck.draw.text3'), btn: Intl.lang('Luck.draw.text4')}
        ];
        const ruleList = [
            Intl.lang('Luck.draw.text5'),
            Intl.lang('Luck.draw.text6'),
            Intl.lang('Luck.draw.text7'),
            Intl.lang('Luck.draw.text8'),
            Intl.lang('Luck.draw.text9')
        ];
        const prizeListTitle = [Intl.lang('Luck.draw.text10'), Intl.lang('Luck.draw.text11')];
        const { prizeList, animation, aniRand, aniTime, showMask, maskContent, count, swiperTips, openNew, isShare, noPrize } = this.state;
        return (
            <div className="luck-draw-style-config">
                <div onClick={this.shareContent} className="panel-head-share pc-hide">{Intl.lang("Invite.share")}</div>
                <div className={"luck-draw-banner " + Intl.getLang()}>
                    {this.isMobile ? <p onClick={this.changeJump.bind(this, 1)} className="luck-draw-banner-btn">{Intl.lang('activity.TradingContest.tet7')}</p> : <p className="luck-draw-banner-btn">
                        {checkBtn && checkBtn.map((item, key) => {
                            return <button key={key} onClick={this.changeJump.bind(this, key)}>
                                <p>{item.title}</p>
                                <p>{item.btn}<i className="iconfont icon-arrow-l" /><i className="iconfont icon-arrow-l" /><i className="iconfont icon-arrow-l" /></p>
                            </button>
                        })}
                    </p>}
                </div>
                <div className="luck-draw-content">
                    <div className={"swiper-container luck-draw-content-tips swiper-no-swiping " + Intl.getLang()} ref={self => this.swiperID = self}>
                        <i className="iconfont icon-lingdang" />
                        <div className="swiper-wrapper">
                            {swiperTips && swiperTips.map((item, index) => {
                                return <p className="swiper-slide" key={index}>{Intl.lang('Luck.draw.text15', item.Uid, this.forEachPrizeId(item.PrizeType))}</p>
                            })}
                        </div>
                    </div>
                    <div className="luck-draw-style-flex">
                        <div className="luck-draw-turntable">
                            <div style={{transition: 'all ease-in-out '+ aniTime +'ms'}} className={"luck-draw-circular ani" + aniRand}/>
                            {!this.isMobile && <React.Fragment>
                                <div className={"luck-draw-circular-1 " + (animation === true ? 'active' : null)}/>
                                <div className={"luck-draw-circular-2 " + (animation === true ? 'active' : null)}/>
                            </React.Fragment>}
                            <div style={{cursor: !this.clickFlag && 'no-drop'}} className={"luck-draw-circular-btn " + Intl.getLang()} onClick={this.getLuckDraw} dangerouslySetInnerHTML={{__html: Intl.lang('Luck.draw.text16')}}/>
                        </div>
                        <div className="luck-draw-prize-list">
                            <div className={"luck-draw-prize-list-title " + Intl.getLang()} dangerouslySetInnerHTML={{__html: this.isLogin === true ? Intl.lang('Luck.draw.text17', count) : Intl.lang('Luck.draw.text18')}} />
                            <ul className="prize-list-title">
                                {prizeListTitle && prizeListTitle.map((item, key) => {
                                    return <li key={key}>{item}</li>
                                })}
                            </ul>
                            {this.isLogin === true ? <div className="wrapper" ref={el => this.scrollId = el}  style={{overflow:'hidden', height: 413, width: 270}}>
                                <div className="content">
                                    {prizeList && prizeList.map((item, key) => {
                                        return <ul key={key} className="prize-list-content">
                                            <li>{item.CreateTime}</li>
                                            <li>{this.forEachPrizeId(item.PrizeType)}</li>
                                        </ul>
                                    })}
                                    {prizeList === null ? <div className="prize-list-no-content">{Intl.lang('bank.1_27')}</div> : null}
                                </div>
                            </div>
                            : <div className="luck-draw-prize-nolist" onClick={this.clickJump.bind(this, '/activities/luckDraw')}>{Intl.lang('Luck.draw.text19')}</div>}
                        </div>
                    </div>
                    <div className="luck-draw-rule">
                        <h3>{Intl.lang('mimic.panel.trading.8')}</h3>
                        <ul>
                            {ruleList && ruleList.map((item, key) => {
                                return <li key={key} dangerouslySetInnerHTML={{__html: item}} />
                            })}
                        </ul>
                    </div>
                </div>
                <div className="mine-trade-share" style={{ bottom: isShare ? true : '-350px' }}>
                    <input className="mine-trade-share-input" type="text" id="copy-share-text" defaultValue={window.location.href} />
                    <div className="bdsharebuttonbox">
                        <a href="javascript:;" className="share-item copy-link-share" data-clipboard-action="copy" data-clipboard-target="#copy-share-text">
                            <img src={Icon1} alt="mine-share" />
                            <p>{Intl.lang('activity.registered.btn')}</p>
                        </a>
                        {this.wx && <a href="javascript:;" className="bds_tsina share-item">
                            <img onClick={this.gotoBrowserOpen.bind(this)} src={wxIocn}/>
                            <p>{Intl.lang('trading.dig.wx')}</p>
                        </a>}
                        <a href="javascript:;" className="bds_tsina share-item">
                            <img src={Icon2} alt="mine-share"  data-cmd="tsina"/>
                            <p>{Intl.lang('trading.dig.32')}</p>
                        </a>
                        <a href="javascript:;" className="bds_twi share-item">
                            <img src={Icon3} alt="mine-share"  data-cmd="fbook"/>
                            <p>Twitter</p>
                        </a>
                        <a href="javascript:;" className="bds_fbook share-item">
                            <img src={Icon4} alt="mine-share"  data-cmd="twi"/>
                            <p>Facebook</p>
                        </a>
                    </div>
                    <div className="mine-trade-share-colse" onClick={this.shareContent.bind(this)}>{Intl.lang('mining.status0')}</div>
                </div>
                {openNew && <BrowserOpen closeBrowser={this.gotoBrowserOpen.bind(this)} content={Intl.lang("activity.ActivityTrading.wxShare")} />}
                {showMask && <div className="luck-draw-mask">
                    <div className="luck-draw-mask-content">
                        {noPrize === true ? <p className="no-prize">{maskContent.title}</p> : <React.Fragment>
                                <div className={"luck-draw-mask-pic " + maskContent.images}/>
                                <p> {Intl.lang('Luck.draw.text20')}<span>{maskContent.title}</span></p>
                            </React.Fragment>}
                        <button onClick={this.closeMask}>{Intl.lang('activity.ActivityTrading.popTxt3_2')}</button>
                    </div>
                </div>}
            </div>
        )
    }
}
