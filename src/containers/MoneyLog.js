import React from 'react';
import PureComponent from "../core/PureComponent";
import Intl from '../intl';
class MoneyLog extends PureComponent {

	constructor(props) {
		super(props);
	}

	componentDidMount() {

	}
	
	render() {
		return(
			<div className="withdrawal">
				<h3>{Intl.lang("MoneyLog.1")}</h3>
				<div className="lists-type">
					<span className="type cur">{Intl.lang("MoneyLog.2")}</span>
					<span className="type ">{Intl.lang("MoneyLog.3")}</span>
					<div className="downLoad"><span>{Intl.lang("MoneyLog.4")}<i className="iconfont icon-download"></i></span></div>
				</div>
				<div className="currency-money">
					<div className="trade-order-log border-none">
						<dl className="log-title dl-25 f-clear">
							<dd>{Intl.lang("recharge.1_23")}</dd><dd>{Intl.lang("TradeHistory.103")}</dd><dd>{Intl.lang("tradeHistory.1_9")}</dd><dd>{Intl.lang("accountSafe.1_102")}</dd>
						</dl>
						<div className="log-contain log-list trade-new">
							<p className="mt-30 tc">{Intl.lang("bank.1_27")}</p>
						</div>
					</div>
				</div>

			</div>
				
		)
	}
}

export default MoneyLog;