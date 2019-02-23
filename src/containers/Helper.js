import Intl from '../intl';

import React from 'react';
import { Link } from "react-router";

import PureComponent from "../core/PureComponent";
import ContractDetails from "../components/ContractDetails";
import CapitalRateHistory from "../components/CapitalRateHistory";
class Helper extends PureComponent {

	constructor(props) {
 
		super(props);
		this.state={
			
        }
	}
	componentWillMount(){
		this.getZendeskLang();
	}
	getZendeskLang(){
		var url = window.location.href;
		if(url.indexOf('Lang') != -1){
			var getLang = this.getQueryVariable('Lang');
			Intl.setLang(getLang);
		}
	}
	getQueryVariable(variable) {
       var query = window.location.search.substring(1);
       var vars = query.split("&");
       for (var i=0;i<vars.length;i++) {
               var pair = vars[i].split("=");
               if(pair[0] == variable){return pair[1];}
       }
       return(false);
	}
	render() {
		return(
			<div>
				{/*<CapitalRateHistory/>*/}
				<ContractDetails/>
            </div>
		)
	}
}

export default Helper;