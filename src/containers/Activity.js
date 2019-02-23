import React from 'react';
import PureComponent from "../core/PureComponent";
import Intl from '../intl';


class Activity extends PureComponent {

    constructor(props) {

        super(props);

        this.state = {
            showVerify: true,
            showActivity: true
        }
    }

    componentDidMount() {
        $('body').prepend(`
            <script>
                window._bd_share_config={
                    "common":{"bdSnsKey":{},"bdText":"","bdMini":"2","bdPic":"","bdStyle":"0","bdSize":"16"},
                    "share":{},
                    "image":{"viewList":["qzone","tsina","tqq","renren","weixin"],"viewText":"分享到：","viewSize":"16"},
                    "selectShare":{"bdContainerClass":null,"bdSelectMiniList":["qzone","tsina","tqq","renren","weixin"]}
                };
                with(document)0[(getElementsByTagName('head')[0]||body).appendChild(createElement('script'))
                .src='http://bdimg.share.baidu.com/static/api/js/share.js?v=89860593.js?cdnversion='+~(-new Date()/36e5)];
            </script>
        `)
    }
    closeVerify() {
        this.setState({ showVerify: false })
    }

    render() {
        const { showVerify, showActivity } = this.state;
        return (
            <div className="okk-trade-contain activity-page">
                {showActivity == true ? <div className="activity-successful">
                    <div className="contain">
                        <div className="verify-successful">
                            <i className="iconfont icon-success"></i>
                            <h3>{Intl.lang('activity.registered.1')}</h3>
                            <p>{Intl.lang('activity.registered.2')}</p>
                            <button>{Intl.lang('activity.registered.3')}</button>
                        </div>
                        <div className="activity-recom">
                            <div className="activity-code">
                                <p>{Intl.lang('activity.registered.17')}</p>
                                <p>{Intl.lang('activity.registered.18')}</p>
                                <p dangerouslySetInnerHTML={{ __html: Intl.lang("activity.registered.19", 20) }}></p>
                            </div>
                            <div className="activity-qr">
                                <div className="activity-qr-code">
                                    <div>code</div>
                                    <p>{Intl.lang('activity.registered.4')}</p>
                                </div>
                                <div className="activity-share">
                                    <p>{Intl.lang('activity.registered.5')}</p>
                                    <p className="share-link"><input style={{ width: '50px' }} type="text" value="Fwa7es" /><i className="iconfont icon-copy"></i></p>
                                    <p>{Intl.lang('activity.registered.6')}</p>
                                    <p className="share-link"><input type="text" value="http://tdex.com/register?ref=Fwa7es" /><i className="iconfont icon-copy"></i></p>
                                    {/* <p>{Intl.lang('activity.registered.7')}</p> */}
                                    {/* <p><span className="iconfont icon-qq"></span><span className="iconfont icon-qq"></span><span className="iconfont icon-qq"></span></p> */}
                                    <div className="bdsharebuttonbox">
                                        <a href="javascript:;" className="bds_more" data-cmd="more"></a>
                                        <a href="javascript:;" className="bds_qzone" data-cmd="qzone" title="分享到QQ空间"></a>
                                        <a href="javascript:;" className="bds_tsina" data-cmd="tsina" title="分享到新浪微博"></a>
                                        <a href="javascript:;" className="bds_tqq" data-cmd="tqq" title="分享到腾讯微博"></a>
                                        <a href="javascript:;" className="bds_renren" data-cmd="renren" title="分享到人人网"></a>
                                        <a href="javascript:;" className="bds_weixin" data-cmd="weixin" title="分享到微信"></a>
                                        <a href="javascript:;" className="bds_fbook" data-cmd="fbook" title="分享到Facebook"></a>
                                        <a href="javascript:;" className="bds_twi" data-cmd="twi" title="分享到Twitter"></a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div> : <div>
                        {showVerify == true ?
                            <div className="activity-mask">
                                <div className="activity-verify">
                                    <i onClick={() => this.closeVerify()} className="iconfont icon-close"></i>
                                    <h4>{Intl.lang('register.emailVerification')}</h4>
                                    <p>{Intl.lang('activity.registered.9')}<span>90978888@qq.com</span>，{Intl.lang('activity.registered.10')}</p>
                                    <p>{Intl.lang('register.emailVerification.resend')}</p>
                                </div>
                            </div>
                            : null
                        }

                        <div className="activity-bg"></div>
                        <div className="activity-bg-title">
                            <h1>{Intl.lang('activity.registered.12')}</h1>
                            <h4>{Intl.lang('activity.registered.13')}</h4>
                            <p>{Intl.lang('activity.registered.14')}</p>
                            <p>{Intl.lang('activity.registered.15')}</p>
                            <p>{Intl.lang('activity.registered.16')}</p>
                        </div>
                        <div className="activity-input">
                            <span className="activity-error"><i className="iconfont icon-tips"></i>{Intl.lang('activity.registered.17')}</span>
                            <input type="text" />
                            <input type="password" />
                            <input type="password" />
                            <label className=""><input type="checkbox" />{Intl.lang('activity.registered.18')}</label>
                            <button className="btn">{Intl.lang('activity.registered.19', 20)}</button>
                            <button className="btn">{Intl.lang('activity.registered.20', 20)}</button>
                        </div>
                        <p>{Intl.lang('activity.registered.21')}</p>
                    </div>}

            </div>
        )
    }
}

export default Activity;