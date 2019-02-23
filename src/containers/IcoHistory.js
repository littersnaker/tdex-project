import React from 'react'
import PureComponent from '../core/PureComponent'
import Intl from '../intl'
import Net from '../net/net'
import History from '../core/history'

export default class Ico extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      historyRate: [],
      historyApply: [],
      isClick: this.props.location.query.type === 'rate'
    }

  }

  // 切换菜单
  clickTab(bool) {
    if (this.state.isClick !== bool) {
      this.setState({ isClick: bool })
    }
  }

  // 取中签率历史
  fetchHistoryRate() {
    Net.httpRequest('activity/tokenApplyHistory', { Type: 1 }, data => {
      if (!data.Status && data.Data && data.Data.List && data.Data.List.length) {
        const list = data.Data.List
        const historyRate = []
        const historyApply = []
        list.forEach(function (elm) {
          historyRate.push({
            time: elm.Time.replace('T', ' ').substring(0, 19),
            rate: Math.round(elm.Params.Rate * 100) ? Math.round(elm.Params.Rate * 100) + '%' : '--'
          })
          historyApply.push({
            time: elm.Time.replace('T', ' ').substring(0, 19),
            price: '$' + elm.Params.Price.toFixed(3)
          })
        }, this)
        this.setState({ historyRate: historyRate, historyApply: historyApply })
      }
    }, this)
  }


  componentDidMount() {
    this.fetchHistoryRate()
  }

  render() {
    const { historyRate, historyApply, isClick } = this.state

    return <div className="zwb-main-section">
      <div className="container" style={{ padding: "90px 0 90px" }}>
        <div className="container-history">
          <h3>{Intl.lang('ico.exchangeHistory')}</h3>
          <div className="history-menu">
            <a href="javascript:;" className={isClick ? 'menu-active' : ''} onClick={() => this.clickTab(true)}>{Intl.lang('ico.successRate')}</a>
            <a href="javascript:;" className={isClick ? '' : 'menu-active'} onClick={() => this.clickTab(false)}>{Intl.lang('ico.successPrice')}</a>
          </div>
          <div className="history-body">
            {
              isClick
                ? <ul>
                  <li><span>{Intl.lang('ico.date')}</span><span>{Intl.lang('ico.exchangeRate')}</span></li>
                  {
                    historyRate.length
                      ? historyRate.map((elm, i) => {
                        return <li key={i}><span className="border-right">{elm.time}</span><span>{elm.rate}</span></li>
                      })
                      : <li><span>{Intl.lang('ico.noData')}</span></li>
                  }
                </ul>
                : <ul>
                  <li><span>{Intl.lang('ico.date')}</span><span>{Intl.lang('ico.exchangePrice')}</span></li>
                  {
                    historyApply.length
                      ? historyApply.map((elm, i) => {
                        return <li key={i}><span className="border-right">{elm.time}</span><span>{elm.price}</span></li>
                      })
                      : <li><span>{Intl.lang('ico.noData')}</span></li>
                  }
                </ul>
            }
          </div>
        </div>
      </div>
    </div>
  }
}