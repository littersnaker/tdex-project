import Intl from '../intl';
import React, { PropTypes } from 'react';
import PureComponent from '../core/PureComponent'

export class AdvBox extends PureComponent {
    constructor(props) {
        super(props);

    }
    componentDidMount(){

    }
    render() {
        const lang = Intl.getLang();
        return <div className={"advbox tx-shad "+lang} style={lang=="en-us"?{height:210}:null}>
            <ul className="advert-ul hide">
                <li className="advert-1"></li>
            </ul>
            <div className="contain tc pdt-1 advert-div">
                <div className="adv-theme"  dangerouslySetInnerHTML={{__html: Intl.lang("barNav.theme")}}></div>
                <div className="mt-20 advert-subtxt fem125">{Intl.lang("barNav.subTxt1")}</div>
                <div className="mt-10 advert-subtxt fem125">{Intl.lang("barNav.subTxt2")}</div>
            </div>
        </div>
    }
}

export default AdvBox;