import React from 'react';
import { Link } from 'react-router';
import PureComponent from "../core/PureComponent";
import Intl from '../intl';
import Net from '../net/net'
class CapitalRateHistory extends PureComponent {

	constructor(props) {
		super(props);
		this.state={
			Symbol:'BTCUSD',
			PageSize:3,
			Page:1,
			RateList:[]
        }
	}
	componentDidMount() {
		this.getData();
	}
	getData(){
		var setDate = this.state;
		Net.httpRequest("futures/funding", {Symbol:setDate.Symbol,PageSize:setDate.PageSize,Page:setDate.Page}, (data)=>{
            if (data.Status == 0){
            	this.setState({
            		RateList:data.Data.List
            	});
            }
        }, this);
	}
	
	render() {
		var getData = this.state;
		return(
			<div className="content-list-history rate-history-list">
				<p className="pd15-0"><strong>{Intl.lang("trade.instrument.fundingRate")}</strong></p>
				<ul className="bor-0">
					<li>
						
					</li>
					<li>
						{Intl.lang("futures.contracts")}
					</li>
					<li>
						Funding Interval
					</li>
					<li>
						Funding Rate
					</li>
					<li>
						Funding Rate Daily
					</li>
				</ul>
				
				{
					getData.RateList &&  getData.RateList.map((item, i)=>{
						return <ul className="bor-b-1" key={i}>
							<li>
								{item.Action || '--'}
							</li>
							<li>
								{item.ID || '--'}
							</li>
							<li>
								{item.LID || '--'}
							</li>
							<li>
								{item.Activated || '--'}
							</li>
							<li>
								{item.Attempt || '--'}
							</li>
						</ul>
					})
				}
			</div>
				
		)
	}
}

export default CapitalRateHistory;