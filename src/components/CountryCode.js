import React from 'react'
import PureComponent from '../core/PureComponent';
import Loader from '../utils/loader'
import { getRndInt } from "../utils/common";

const $ = window.$;
class CountryCode extends PureComponent{
    constructor(props){
        super(props);
        this.selectId = getRndInt(1, 10000);
        this.changeHandler = this.props.onChange;
        this.state = {
            dialCode: this.props.defaultValue || '86',
            hide: true
        }
    }
    componentWillMount(){
        Loader.js("lib/telphone/utils.js");
    }
    componentDidMount(){
        var self = this;
        //Loader.css("css/intlTelInput.css");

        //Loader.js("lib/telphone/intlTelInput.min.js", function(){
        // get the country data from the plugin
        var countryData = $.fn.intlTelInput.getCountryData();
        self.setState({countryData: countryData});
        countryData.map(function(item){
            if (item.dialCode == self.state.dialCode){
                if (self.changeHandler)self.changeHandler(item.dialCode);
                self.setState({name: item.name, code:item.iso2});
                return false;

            }
        });
        self.isUpdate = true;
        // populate the country dropdown
        //$.each(countryData, function(i, country) {
        //    addressDropdown.append($("<option></option>").attr("value", country.iso2).text(country.name));
        //});
        //});
    }
    componentDidUpdate(prevProps, prevState){
        if (this.isUpdate){
            var scrollTop = $('#ccoption'+this.selectId+this.state.code).offset().top - $('#ccselect'+this.selectId).offset().top + $('#ccselect'+this.selectId).scrollTop();
            $('#ccselect'+this.selectId).scrollTop(scrollTop);

            this.isUpdate = false;
        }
    }
    onChange(name, value, code){
        this.setState({name:name, dialCode:value, code:code});

        if (this.changeHandler){
            this.changeHandler(value);
        }
        this.setState({hide: !this.state.hide});
    }
    render() {
        var self = this;
        return (
            <div className="intl-tel-input allow-dropdown" style={this.props.style}>
                <div className="hide"><input type="tel" id="phone" /></div>
                {this.state.countryData &&
                <div className="flag-container country-box">
                    <div className="selected-flag" title={this.state.name} onClick={()=>this.setState({hide: !this.state.hide})}>
                        <div className={"iti-flag "+this.state.code}></div>
                        <div className="iti-arrow"></div>
                    </div>
                    <div className="country-namebox"><span className="country-name">{this.state.name}</span></div>
                    <ul className={this.state.hide ? "country-list hide" : "country-list"} id={"ccselect"+self.selectId}>
                        {this.state.countryData.map(function(item, index){
                            return  <li className={self.state.code==item.iso2 ? "country active highlight" : "country"} key={index} onClick={()=>self.onChange(item.name, item.dialCode, item.iso2)} id={"ccoption"+self.selectId+item.iso2 }>
                                <div className="flag-box">
                                    <div className={"iti-flag "+item.iso2}></div>
                                </div>
                                <span className="country-name">{item.name}</span>
                            </li>
                        })}
                    </ul>
                </div>}
            </div>
        )
    }
}
export default CountryCode;