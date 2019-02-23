import React from 'react';
import { Link } from 'react-router';
import PureComponent from "../core/PureComponent";
import Intl from '../intl';
import Net from '../net/net';
class ContractDetails extends PureComponent {

	constructor(props) {
		super(props);
		this.state={
			type:'BTCUSD',
			nextTime:'',
			data:''
       }
	}
	componentDidMount() {
		this.getData();
	}
	getData(){
		var setDate = this.state;
		Net.httpRequest("futures/contract", {Symbol:setDate.type}, (data)=>{
            if (data.Status == 0){
            	this.setState(data.Data);
            	//下一个资金费率
				var stringTime = data.Data.FundingTimestamp.replace(/[a-zA-Z]/g," ");
				var timestamp = Date.parse(new Date(stringTime));
				var newTime = timestamp / 1000 ;
				//加上八小时
				var nextRate = Number(newTime + 28800);
				var nextTime = new Date(parseInt(nextRate) * 1000).toLocaleString().replace(/[/]/g, "-");
				this.setState({nextTime:nextTime});
            }
        }, this);
	}
	render() {
		var data = this.state;
		return(
			<div className="content-list-history" style={{paddingTop:'50px'}}>
				<p className="pd15-0"><strong>{Intl.lang("helper.ContractDetails.1")}</strong></p>
				<ul>
					<li><span>{Intl.lang("helper.ContractDetails.2")}</span></li>
					<li><span>{Intl.lang("helper.ContractDetails.3")}</span></li>
					<li><span>{Intl.lang("helper.ContractDetails.4")}</span></li>
					<li><span>{Intl.lang("helper.ContractDetails.5")}</span></li>
					<li><span>{Intl.lang("helper.ContractDetails.6")}</span></li>
					<li><span>{Intl.lang("helper.ContractDetails.7")}</span></li>
					<li><span>{Intl.lang("helper.ContractDetails.8")}</span></li>
					<li><span>{Intl.lang("helper.ContractDetails.9")}</span></li>
					<li><span>{Intl.lang("helper.ContractDetails.10")}</span></li>
					<li><span>{Intl.lang("helper.ContractDetails.11")}</span></li>
					<li><span>{Intl.lang("helper.ContractDetails.12")}</span></li>
					<li><span>{Intl.lang("helper.ContractDetails.13")}</span></li>
					<li><span>{Intl.lang("helper.ContractDetails.14")}</span></li>
					<li><span>{Intl.lang("helper.ContractDetails.15")}</span></li>
					<li><span>{Intl.lang("helper.ContractDetails.16")}</span></li>
					<li><span>{Intl.lang("helper.ContractDetails.17")}</span></li>
					<li><span>{Intl.lang("helper.ContractDetails.18")}</span></li>
					<li><span>{Intl.lang("helper.ContractDetails.19")}</span></li>
					<li><span>{Intl.lang("helper.ContractDetails.20")}</span></li>
					<li><span>{Intl.lang("helper.ContractDetails.21")}</span></li>
					<li><span>{Intl.lang("helper.ContractDetails.22")}</span></li>
					<li><span>{Intl.lang("helper.ContractDetails.22")}</span></li>
					<li><span>{Intl.lang("helper.ContractDetails.23")}</span></li>
					<li><span>{Intl.lang("helper.ContractDetails.24")}</span></li>
					<li><span>{Intl.lang("helper.ContractDetails.25")}</span></li>
					<li><span>{Intl.lang("helper.ContractDetails.26")}</span></li>
					<li><span>{Intl.lang("helper.ContractDetails.27")}</span></li>
					<li><span>{Intl.lang("helper.ContractDetails.28")}</span></li>
					<li><span>{Intl.lang("helper.ContractDetails.29")}</span></li>
				</ul>
				<ul>
					<li><span>{data.type || '--'}</span></li>
					<li><span>{Intl.lang("helper.ContractDetails.30")}</span></li>
					<li><span>{Intl.lang("helper.ContractDetails.31")}</span></li>
					<li><span>{Intl.lang("helper.ContractDetails.32")}</span></li>
					<li><span>{Intl.lang("helper.ContractDetails.33")}</span></li>
					<li><span>{Intl.lang("helper.ContractDetails.34")}</span></li>
					<li><span>{Intl.lang("helper.ContractDetails.35")}</span></li>
					<li><span>{data.FundingRate || '--'}</span></li>
					<li><span>{Intl.lang("helper.ContractDetails.36")}</span></li>
					<li><span>{data.nextTime || '--'}</span></li>
					<li><span>{data.IndicativeFundingRate || '--'}</span></li>
					<li><span>{data.MarkPrice || '--'}</span></li>
					<li><span>{Intl.lang("helper.ContractDetails.37")}</span></li>
					<li><span>{Intl.lang("helper.ContractDetails.44")}</span></li>
					<li><span>{data.FairBasis || '--'}</span></li>
					<li><span>{data.FairBasisRate || '--'}</span></li>
					<li><span>{Intl.lang("helper.ContractDetails.38")}</span></li>
					<li><span>{Intl.lang("helper.ContractDetails.39")}</span></li>
					<li><span>{Intl.lang("helper.ContractDetails.40")}</span></li>
					<li><span>{data.OpenInterest || '--'}</span></li>
					<li><span>{data.Turnover24h || '--'}</span></li>
					<li><span>{Intl.lang("helper.ContractDetails.41")}</span></li>
					<li><span>1 USD</span></li>
					<li><span>{Intl.lang("helper.ContractDetails.42")}</span></li>
					<li><span>{Intl.lang("helper.ContractDetails.43")}</span></li>
					<li><span>1 USD</span></li>
					<li><span>1,000,000</span></li>
					<li><span>1,000,000</span></li>
					<li><span>1</span></li>
				</ul>
			</div>
				
		)
	}
}

export default ContractDetails;