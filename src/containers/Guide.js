import Intl from '../intl';
import React from 'react'

export default function Helper() {
    return (
        <div className="okk-trade-contain">
            <div className="contain pdt-1 pdb-50">
                <div className="personal-box mt-50">
                    <div className="clause-box tc fem-175">{Intl.lang("hellper.100")}</div>
                    <div className="clause-content fem875">
                        <h3>{Intl.lang("hellper.101")}</h3><br/>
                        <div>{Intl.lang("hellper.101_1")}<br/>{Intl.lang("hellper.101_2")}</div><br/><br/>
                        <h3>{Intl.lang("hellper.102")}</h3><br/>
                        <div>{Intl.lang("hellper.102_1")}<br/>{Intl.lang("hellper.102_2")}</div><br/><br/>
                        <h3>{Intl.lang("hellper.103")}</h3><br/>
                        <div>{Intl.lang("hellper.103_1")}</div><br/><br/>
                        <h3>{Intl.lang("hellper.104")}</h3><br/>
                        <div>{Intl.lang("hellper.104_1")}<br/>{Intl.lang("hellper.104_2")}<br/>{Intl.lang("hellper.104_3")}<br/>{Intl.lang("hellper.104_4")}<br/>{Intl.lang("hellper.104_5")}</div><br/><br/>
                        <h3>{Intl.lang("hellper.105")}</h3><br/>
                        <div>{Intl.lang("hellper.105_1")}<br/>{Intl.lang("hellper.105_2")}<br/>{Intl.lang("hellper.105_3")}</div><br/><br/>
                        <h3>{Intl.lang("hellper.106")}</h3><br/>
                        <div>{Intl.lang("hellper.106_1")}<br/>{Intl.lang("hellper.106_2")}<br/>{Intl.lang("hellper.106_3")}<br/>{Intl.lang("hellper.106_4")}<br/></div><br/><br/>
                        <h3>{Intl.lang("hellper.107")}</h3><br/>
                        <div>{Intl.lang("hellper.107_1")}<br/>{Intl.lang("hellper.107_2")}<br/>{Intl.lang("hellper.107_3")}</div>
                    </div>
                </div>
            </div>
        </div>
    )
}