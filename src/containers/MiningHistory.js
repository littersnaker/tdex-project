import Intl from '../intl';
import React from 'react'
import PureComponent from '../core/PureComponent';
import Net from '../net/net'
import Moment from 'moment'
import Pager from '../components/Pager'

class MiningHistory extends PureComponent {
    constructor(props) {

        super(props);

        this.state = {
            page: 1,
            size: 10,
            total: 0,
            counts: 0,
            list: []
        }
        this.title = [2, 3, 4, 5, 6, 7, 8]
    }
    componentDidMount() {
        this.getMiningHistory();
    }
    getMiningHistory(page = 1) {
        Net.httpRequest("mining/robotHistory", { Page: page, PageSize: this.state.size }, data => {
            if (data.Data && data.Data.List) {
                this.setMiningHistory(data.Data.List)
                this.setState({
                    total: data.Data.Total,
                    page: data.Data.Page,
                    counts: data.Data.PageCount
                })
            }
        });
    }
    changePage(page) {
        this.getMiningHistory(page);
    }
    setMiningHistory(data) {
        if (!data.length) return
        const list = []
        data.forEach(function (element) {
            list.push({
                BeginTime: element.BeginTime ? Moment(element.BeginTime * 1000).format('YYYY-MM-DD HH:mm:ss') : '--',
                EndTime: element.EndTime ? Moment(element.EndTime * 1000).format('YYYY-MM-DD HH:mm:ss') : '--',
                Symbol: element.Symbol || '--',
                TradeCount: element.TradeCount || '0',
                Commission: element.Commission || '0',
                Amount: element.Amount || '0',
                TotalAmount: element.TotalAmount || '0'
            })
        }, this);
        this.setState({ list: list })
    }
    render() {
        const { page, size, total, counts, list } = this.state;
        return (
            <div className="okk-trade-contain">
                <div className="zwb-mining-wrapper">
                    <h2 className="zwb-mining-title">{Intl.lang("mining.history.1")}</h2>
                </div>
                {
                    list.length ?
                        <div className="zwb-mining-history">
                            <div className="dig-tab-list" style={{ minHeight: '700px' }}>
                                <table className="deform">
                                    <thead>
                                        <tr>
                                            {this.title.map((v, i) => {
                                                return <td key={i}>{Intl.lang(`mining.history.${v}`)}</td>
                                            })}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {
                                            list.map((v, i) => {
                                                return <tr key={i}>
                                                    <td data-label={Intl.lang('mining.history.2')}>{v.BeginTime}</td>
                                                    <td data-label={Intl.lang('mining.history.3')}>{v.EndTime}</td>
                                                    <td data-label={Intl.lang('mining.history.4')}>{v.Symbol}</td>
                                                    <td data-label={Intl.lang('mining.history.5')}>{v.TradeCount}</td>
                                                    <td data-label={Intl.lang('mining.history.6')}>{v.Commission}</td>
                                                    <td data-label={Intl.lang('mining.history.7')}>{v.Amount}</td>
                                                    <td data-label={Intl.lang('mining.history.8')}>{v.TotalAmount}</td>
                                                </tr>
                                            })
                                        }
                                    </tbody>
                                </table>
                            </div>
                            <Pager className="zwb-mining-tabpage" data={{ PageSize: size, Total: total, Page: page, PageCount: counts }} onChange={this.changePage.bind(this)}></Pager>
                        </div>
                        :
                        <div className="zwb-mining-wrapper zwb-mining-wrapper-img">
                            <img src={process.env.PUBLIC_URL + "/images/mining/dig-emojy.png"} />
                            <p className="mt-30 tc">{Intl.lang("bank.1_27")}</p>
                        </div>
                }
            </div>
        )
    }
}

export default MiningHistory;