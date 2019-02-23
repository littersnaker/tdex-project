import React from 'react';
import PureComponent from '../core/PureComponent'
import Intl from '../intl';

export default class BrowserSupport extends PureComponent {
    render(){
        return(
            <section className="browser-support">
                <div className="browser-support-contain">
                    <div className="block">
                        <h3>{Intl.lang("browserSupport.title")}</h3>
                        <p>{Intl.lang("browserSupport.need")}</p>
                    </div>
                    <div className="block block-bg">
                        <p>{Intl.lang("browserSupport.downLoad")}</p>
                        <p className="support-bold"><a href="https://www.google.com/chrome/" target="_blank">Chrome</a><span className="pdl-10">{Intl.lang("browserSupport.recommend")}</span></p>
                        <p><a href="https://www.mozilla.org/en-US/firefox/new/?scene=2" target="_blank">Firefox</a></p>
                        <p><a href="https://www.opera.com/" target="_blank">Opera</a></p>
                    </div>
                    <div className="pd30-0">
                        {/*<a href="javascript:;">{Intl.lang("browserSupport.email")}</a>*/}
                    </div>
                </div>
            </section>
        )
    }
}