import React from 'react';
import PureComponent from '../core/PureComponent';
import Intl from '../intl';
import Net from '../net/net';
import history from '../core/history';
import AuthModel from '../model/auth';
import BScroll from 'better-scroll';

export default class ContractTrade extends PureComponent {

    RankScroll = null;

    state = {
        tab: 0,
        isLogin: AuthModel.checkUserAuth(),
        income: "",
        incomeRank: 0,
        yielded: "",
        yieldRank: 0,
        yieldList: [],
        incomeList: [],
        page: 1,
        yieldPageSize: 10,
        incomePageSize: 10,
    };

    componentDidMount() {
        const { tab, isLogin } = this.state;
        this.switchTabFetch(tab);
        this.createRankScroll();
        if(isLogin) {
            this.fetchTradeMatchPersonal();
        }
    }

    componentWillUnmount(){
        this.RankScroll = null;
        this.clipboard = null;
    }

    changeYieldTab = index => {
        if(index==this.state.tab) return;
        if(this.RankScroll) this.RankScroll.destroy();

        this.setState({tab: index});
        this.switchTabFetch(index);
    };

    switchTabFetch = (index) => {
        switch (index) {
            case 0:
                this.fetchTradeMatchYield();
                break;
            case 1:
                this.fetchTradeMatchIncome();
                break;
        }
    };

    linkToContract = type => {
        switch (type) {
            case 'GO_TRADE':
                history.push('/trade/BTCUSD');
                break;
            case 'GO_LOGIN':
                history.push({pathname: '/login', query: {return_to: '/activities/contractTrade'}});
        }
    };

    fetchTradeMatchYield = () => {
        const { yieldPageSize, page } = this.state;
        Net.httpRequest('activity/tradeMatchYield', {PageSize: yieldPageSize, Page: page}, (data) => {
            if (data.Status === 0) {
                const info = data.Data;
                this.setState({yieldList: info.List},()=>{
                    if(this.RankScroll) this.RankScroll.refresh();
                });
            }
        });
    };

    fetchTradeMatchIncome = () => {
        const { incomePageSize, page } = this.state;
        Net.httpRequest('activity/tradeMatchIncome', {PageSize: incomePageSize, Page: page}, (data) => {
            if (data.Status === 0) {
                const info = data.Data;
                this.setState({incomeList: info.List}, () => {
                    if(this.RankScroll) this.RankScroll.refresh();
                });
            }
        });
    };

    fetchTradeMatchPersonal = () => {
        Net.httpRequest('activity/tradeMatchPersonal', null, (data) => {
            if (data.Status === 0) {
                const info = data.Data;
                this.setState({income: info.Income, incomeRank: info.IncomeRank, yielded: info.Yield, yieldRank: info.YieldRank});
            }
        });
    };

    createRankScroll = () => {
        this.RankScroll = new BScroll(this.scrollId, {
            startY: 0,
            scrollbar: true,
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
            const { yieldPageSize, incomePageSize, tab } = this.state;
            switch (tab) {
                case 0:
                    if (yieldPageSize >= 20){this.RankScroll.closePullUp();return false;}
                    const YIELD_PAGE_SIZE = yieldPageSize + 10;
                    this.setState({yieldPageSize: YIELD_PAGE_SIZE}, () => {
                        this.switchTabFetch(tab);
                    });
                    break;
                case 1:
                    if (incomePageSize >= 20) {this.RankScroll.closePullUp();return false;}
                    const INCOME_PAGE_SIZE = incomePageSize + 10;
                    this.setState({incomePageSize: INCOME_PAGE_SIZE}, () => {
                        this.switchTabFetch(tab);
                    });
                    break;
            }
        });
    };

    render() {
        const { tab, isLogin, income, incomeRank, yielded, yieldRank, yieldList, incomeList } = this.state;
        const rankingTitle = [Intl.lang('Contract.Trade.text.1'), Intl.lang('Contract.Trade.text.2')];
        const prizeWinningTitle = [Intl.lang('mimic.panel.trading.1'), Intl.lang('Contract.Trade.text.3')];
        const prizeWinningContent = [
            {ranking: Intl.lang('Contract.Trade.text.4', '1'), prize: '3BTC'},
            {ranking: Intl.lang('Contract.Trade.text.4', '2'), prize: '1.5BTC'},
            {ranking: Intl.lang('Contract.Trade.text.4', '3'), prize: '0.5BTC'},
            {ranking: Intl.lang('Contract.Trade.text.4', '4'), prize: '800TD'},
            {ranking: Intl.lang('Contract.Trade.text.4', '5'), prize: '500TD'},
            {ranking: Intl.lang('Contract.Trade.text.4', '6-10'), prize: '300TD'},
            {ranking: Intl.lang('Contract.Trade.text.4', '11-20'), prize: Intl.lang('Contract.Trade.text.5')}
        ];
        const yieldTitle = [Intl.lang('Contract.Trade.text.6'), Intl.lang('Contract.Trade.text.7')];
        const returnRateRank = [Intl.lang('mimic.panel.trading.1'), Intl.lang('activity.TradingContest.uid'), Intl.lang('Contract.Trade.text.8')];
        const revenueRanking = [Intl.lang('mimic.panel.trading.1'), Intl.lang('activity.TradingContest.uid'), Intl.lang('Contract.Trade.text.9')];
        const logoingLink = [
            'www.bizhijia.com',
            'http://8btc.com',
            'https://bihu.com',
            'https://www.jianshu.com',
            'www.7234.cn',
            'www.jiamiquan.ne',
            'www.chainwhy.com',
            'www.blockcircles.cn',
            'https://www.zdpvt.com',
            'http://www.queding.cn',
            'http://www.tanuonline.com',
            'www.tuoluocaijing.cn',
            'www.weilaicaijing.com',
            'https://xueqiu.com',
            'www.yikuaiyingbi.com',
            'www.zilian8.com'
        ];
        const rule = [
            Intl.lang('Contract.Trade.text.10'),
            Intl.lang('Contract.Trade.text.11'),
            Intl.lang('Contract.Trade.text.12'),
            Intl.lang('Contract.Trade.text.13'),
            Intl.lang('Contract.Trade.text.14'),
            Intl.lang('Contract.Trade.text.15'),
            Intl.lang('Contract.Trade.text.16')
        ];

        return (
            <div className="contract-trade-config">
                <div className="contract-trade-banner">
                    <div className="contract-trade-banner-title">
                        <p>{Intl.lang('Contract.Trade.text.17')}</p>
                        <button className="contract-trade-btn" onClick={this.linkToContract.bind(this, 'GO_TRADE')}>{Intl.lang('activity.TradingContest.tet7')}</button>
                    </div>
                </div>
                <div className="contract-trade-content">
                    <div className="contract-trade-ranking">
                        {isLogin ? <React.Fragment>
                            <ul className="contract-trade-ranking-title">
                            {rankingTitle && rankingTitle.map((item, key) => {
                                return <li key={key}>{item}</li>
                            })}
                            </ul>
                            <ul className="contract-trade-ranking-content">
                                <li>
                                    <p className="num-title">{yieldRank}</p>
                                    <p>{Intl.lang('Contract.Trade.text.18')}<span>{yielded || '--'}</span></p>
                                </li>
                                <li>
                                    <p className="num-title">{incomeRank}</p>
                                    <p>{Intl.lang('Contract.Trade.text.19')}<span>{income || '--'}</span></p>
                                </li>
                            </ul>
                        </React.Fragment>
                        : <button className="contract-trade-btn" onClick={this.linkToContract.bind(this, 'GO_LOGIN')}>{Intl.lang('trading.dig.26')}</button>}
                    </div>
                    <div className="contract-trade-section">
                        <h3>{Intl.lang('Contract.Trade.text.20')}</h3>
                        <div className="contract-trade-section-list">
                            <ul className="contract-trade-section-list-title">
                                {prizeWinningTitle && prizeWinningTitle.map((item, key) => {
                                    return <li key={key}>{item}</li>
                                })}
                            </ul>
                            {prizeWinningContent && prizeWinningContent.map((item, key) => {
                                return <ul key={key} className="contract-trade-section-list-content">
                                    <li>{item.ranking}</li>
                                    <li>{item.prize}</li>
                                </ul>
                            })}
                        </div>
                    </div>
                    <div className="contract-trade-section">
                        <ul className="contract-trade-section-list-tab">
                            {yieldTitle && yieldTitle.map((item, key) => {
                                return <li key={key} className={tab === key ? 'active' : null} onClick={this.changeYieldTab.bind(this, key)}>{item}</li>
                            })}
                            <p className="contract-trade-section-list-tab-tips">{Intl.lang('Contract.Trade.text.21')}</p>
                        </ul>
                        {tab === 0 ? <div className="contract-trade-section-list m-list">
                            <ul className="contract-trade-section-list-title">
                                {returnRateRank && returnRateRank.map((item, key) => {
                                    return <li key={key}>{item}</li>
                                })}
                            </ul>
                            <div className="wrapper" ref={el => this.scrollId = el}  style={{height: 300, overflow: 'hidden'}}>
                                <div>
                                    {yieldList && yieldList.map((item, key) => {
                                        return <ul key={key} className="contract-trade-section-list-content">
                                            <li>{item.Rank}</li>
                                            <li>{item.Uid}</li>
                                            <li>{item.Yield}</li>
                                        </ul>
                                    })}
                                </div>
                                {yieldList === null ? <div className="contract-trade-section-list-no-data">{Intl.lang('bank.1_27')}</div> : null}
                            </div>
                        </div>
                        : tab === 1 ? <div className="contract-trade-section-list m-list">
                            <ul className="contract-trade-section-list-title">
                                {revenueRanking && revenueRanking.map((item, key) => {
                                    return <li key={key}>{item}</li>
                                })}
                            </ul>
                            <div className="wrapper" ref={el => this.scrollId = el}  style={{height: 300, overflow: 'hidden'}}>
                                <div>
                                    {incomeList && incomeList.map((item, key) => {
                                        return <ul key={key} className="contract-trade-section-list-content">
                                            <li>{item.Rank}</li>
                                            <li>{item.Uid}</li>
                                            <li>{item.Income}</li>
                                        </ul>
                                    })}
                                </div>
                                {yieldList === null ? <div className="contract-trade-section-list-no-data">{Intl.lang('bank.1_27')}</div> : null}
                            </div>
                        </div>
                        : null}
                    </div>
                    <div className="contract-trade-section">
                        <h3>{Intl.lang('activity.TradingContest.media')}</h3>
                        <div className="section-link-list">
                            {logoingLink && logoingLink.map((item, key) => {
                                return <a key={key} href={item} target="_blank" />
                            })}
                        </div>
                    </div>
                    <div className="contract-trade-section">
                        <h3>{Intl.lang('mimic.panel.trading.8')}</h3>
                        <ul className="section-rule-list">
                            {rule && rule.map((item, key) => {
                                return <li key={key} dangerouslySetInnerHTML={{__html: item}} />
                            })}
                        </ul>
                    </div>
                </div>
            </div>
        )
    }
}