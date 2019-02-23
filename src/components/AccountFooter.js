import Intl from '../intl';
import React from 'react';

function AccountFooter() {
    return (
        <div className="copy hidden-mb">
            <div className="copyp">
                <div>
                    <strong>{Intl.lang("footer.1_32")}</strong><span>{Intl.lang("AccountFooter.100")}</span><br />{Intl.lang("AccountFooter.101")}&nbsp;&nbsp;&nbsp;<a href="#">{Intl.lang("footer.1_34")}</a>&nbsp;|&nbsp;<a href="#">{Intl.lang("footer.1_35")}</a>&nbsp;|&nbsp;<a href="#">{Intl.lang("footer.1_36")}</a>
                </div>
            </div>
        </div>
        );
}

export default AccountFooter;