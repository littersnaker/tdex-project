import Intl from '../intl';
import React from 'react';

import ApiPng from '../images/verify/api.png';

export default function ApiEmail(props) {
    const ActivateUrl = props.location.query.ActivateUrl;

    return <div className="okk-trade-contain pos-r">
        <div className="page-api" style={{height:"400px"}}>
            <div className="api"><img src={ApiPng} /></div>
            <p className="fs16 tc pdb-30">{Intl.lang("api.create.title")}</p>
            <div className="land_text send-txt">
                <p dangerouslySetInnerHTML={{__html: Intl.lang("api.sendemail")}}></p>
                {ActivateUrl && <a href={ActivateUrl} target="_blank" className="yellow fs12 cursor">{Intl.lang("register.activation")}</a>}
            </div>
            <div className="email_list_conten" dangerouslySetInnerHTML={{__html: Intl.lang('register.emailVerification.tip')}}></div>
        </div>
        </div>
}