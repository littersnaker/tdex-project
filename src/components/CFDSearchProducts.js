import React from 'react';
import PureComponent from '../core/PureComponent';
import ProductsComp from './CFDProducts';
import Intl from '../intl';
import CFDCalculator from './CFDCalculator';
import PopDialog from "../utils/popDialog"

export default class CFDSearchProducts extends PureComponent{
    constructor(props){
        super(props);

        this.state = {
            search: ''
        }
    }

    onChangeSearch(e){
        var search = e.target.value;
        if (this.state.search!=search && (!search || search.match(/^[a-zA-Z0-9\u4e00-\u9fa5]{1,}$/))){
            this.setState({search});
        }
    }

    openCalculator(code){
        PopDialog.open(<CFDCalculator code={code} />, 'cfd-calc', true);
    }

    render(){
        const {height, style, isMenu, code, visible} = this.props;
        const {search} = this.state;

        return <React.Fragment>
            <div className="trading-exchange-search" style={style}>
                <i className="iconfont icon-search"></i>
                <input className="fillet-global-config" type="text" placeholder={Intl.lang("cfd.search")} value={search} onChange={this.onChangeSearch.bind(this)}/>
                <i className="iconfont icon-calculator" onClick={this.openCalculator.bind(this, code)}></i>
            </div>

            <ProductsComp className={"trading-exchange-list"+(isMenu ? "": " fillet-global-config")}  style={style} height={height-36} filter={search} isMenu={isMenu} visible={visible} code={code}/>

        </React.Fragment>
    }
}
