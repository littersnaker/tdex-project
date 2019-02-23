import Intl from '../intl';
import React from 'react';
import PureComponent from '../core/PureComponent';


export default class ShareMore extends PureComponent {
    constructor(props) {
        super(props);
        this.userInfo = this.props.userInfo || {};
        this.bdStyle = this.props.styleObject || {};
        this.state = {
            lang: Intl.getLang()
        }
    }
    componentWillMount() {

    }
    componentWillReceiveProps() {
        if (Intl.getLang() !== this.state.lang) {
            this.setState({ lang: Intl.getLang() });
            window.location.hash = 'lang=' + Intl.getLang();
        }
    }
    componentDidMount() {
        var uInfo = this.userInfo;
        if (/MicroMessenger/i.test(navigator.userAgent)) {
            window.location.hash = 'return_to=' + window.location.origin + "/register?ref=" + uInfo.Uid + "&channel=weixin&uid=" + uInfo.Uid;
        } else {
            window.location.hash = 'lang=' + Intl.getLang();
        }
        window._bd_share_config = {
            "common": {
                "bdSnsKey": {},
                "bdText": "",
                "bdMini": "2",
                "bdPic": "",
                "bdStyle": "0",
                "bdSize": "16",
                "onBeforeClick": function (cmd, config) {
                    if (cmd === 'fbook') {
                        $('meta[name="description"]').attr('content', Intl.lang('bdshare.content'));
                    }
                    return {
                        "bdText": Intl.lang('bdshare.content'),
                        "bdUrl": window.location.origin + "/register?ref=" + uInfo.Uid + "&channel=" + cmd + "&uid=" + uInfo.Uid
                    }
                }
            },
            "share": {},
            "image": { "viewList": ["qzone", "tsina", "tqq", "renren", "weixin"], "viewText": "", "viewSize": "16" },
            //"selectShare":{"bdContainerClass":null,"bdSelectMiniList":["qzone","tsina","tqq","renren","weixin"]}
        };
        if (window._bd_share_main) {
            window._bd_share_main.init()
        } else {
            $('body').append("<script>with(document)0[(getElementsByTagName('head')[0]||body).appendChild(createElement('script')).src='/static/api/js/share.js?cdnversion='+~(-new Date()/36e5)];</script>");
        }
        // document.documentElement.scrollTop = 0;
    }
    render() {
        return (
            <div className="bdsharebuttonbox" style={this.bdStyle}>
                {/* <a href="javascript:;" className="bds_more" data-cmd="more"></a> */}
                {/* <a href="javascript:;" className="bds_qzone" data-cmd="qzone"></a> */}
                <a href="javascript:;" className="bds_tsina" data-cmd="tsina" title=" "></a>
                {/* <a href="javascript:;" className="bds_tqq" data-cmd="tqq"></a>
                 <a href="javascript:;" className="bds_renren" data-cmd="renren"></a> */}
                <a href="javascript:;" className="bds_weixin" data-cmd="weixin" title=" "></a>
                {/* <a href="javascript:;" className="bds_sqq" data-cmd="sqq" title=" "></a> */}
                <a href="javascript:;" className="bds_fbook" data-cmd="fbook" title=" "></a>
                <a href="javascript:;" className="bds_twi" data-cmd="twi" title=" "></a>
            </div>
        )
    }
}