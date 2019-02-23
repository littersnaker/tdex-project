import React from 'react'
import PureComponent from "../core/PureComponent"
import Intl from '../intl'
import History from '../core/history'
import { checkAgent, isMobile } from '../utils/util'
import '../less/minetrade.less'
import AuthModel from '../model/auth'
import Icon1 from '../images/icons/mine-share1.png'
import Icon2 from '../images/icons/mine-share2.png'
import Icon3 from '../images/icons/mine-share3.png'
import Icon4 from '../images/icons/mine-share4.png'
import Clipboard from 'clipboard'
import { toast } from "../utils/common"
import wxIocn from "../images/icons/mine-share-wx.png";
import BrowserOpen from "../components/BrowserOpen";

class MineTrade extends PureComponent {

    constructor(props) {
        super(props)
        this.wx = checkAgent().weixin;
        this.state = {
            title: 'NavBar.tradingdig.1',
            isShare: false,
            openNew: false
        }
    }

    // 加载组件
    componentDidMount() {
        this.shareInit()
        window.addEventListener('resize', this.onResize.bind(this))
        window.addEventListener('message', this.onMessage.bind(this))
        this.refs.mine.addEventListener('load', this.onLoadIframe.bind(this))
        const clipboard = new Clipboard('.copy-link-share')
        clipboard.on('success', e => {
            this.shareContent()
            toast(Intl.lang("Recharge.120"), 0, 1000)
        })
        clipboard.on('error', function (e) {
            console.log(e)
        })
        this.clipboard = clipboard
    }
    // 卸载组件
    componentWillUnmount() {
        window.removeEventListener('resize', this.onResize)
        window.removeEventListener('message', this.onMessage)
        this.refs.mine.removeEventListener('load', this.onLoadIframe)
        this.clipboard.destroy()
        super.componentWillUnmount()
    }
    // 监听页面变化
    onResize() {
        if (!isMobile()) History.push('/mining')
    }
    // 加载 iframe 
    onLoadIframe() {
        const params = {
            type: 'init',
            data: {
                device: 'web',
                cookie: AuthModel.checkUserAuth(),
                time: AuthModel.getTokenTime(),
                token: AuthModel.getToken()
            }
        }
        this.refs.mine.contentWindow.postMessage(params, '*')
    }
    // 导航跳转
    navJump() {
        this.refs.mine.contentWindow.postMessage({ type: 'jump' }, '*')
    }
    // 监听 Message
    onMessage(event) {
        console.log(event.data)
        const info = event.data
        if (!info.type) return
        switch (info.type) {
            case 'platform':
                this.setState({ title: 'trading.dig.1' })
                break
            case 'user':
                this.setState({ title: 'trading.dig.2' })
                break
            case 'exit':
                window.history.back()
                break
            case 'trading':
                this.setState({ title: 'NavBar.tradingdig.1' })
                break
            case 'login':
                History.push({ pathname: '/login', query: { return_to: '/minetrade' } })
                break
            case 'help':
                this.setState({ title: 'NavBar.tradingdig.1' })
                break
        }
    }
    // 分享
    shareInit() {
        window._bd_share_config = {
            common: {
                'bdMini': 2,
                'bdSize': 16,
                "onBeforeClick": function (cmd, config) {
                    return {
                        "bdText": Intl.lang('trading.dig.33'),
                        "bdUrl": window.location.origin
                    }
                }
            },
            'share': {}
        }
        if (window._bd_share_main) {
            window._bd_share_main.init()
        } else {
            $('body').append("<script>with(document)0[(getElementsByTagName('head')[0]||body).appendChild(createElement('script')).src='/static/api/js/share.js?cdnversion='+Date.now()];</script>")
        }
    }
    // 分享
    shareContent() {
        if (this.state.isShare) {
            this.setState({ isShare: false })
        } else {
            this.setState({ isShare: true })
        }
    }
    gotoBrowserOpen() {
        if (this.state.openNew) {
            this.setState({ openNew: false });
        } else {
            this.setState({ openNew: true });
        }
    }

    render() {
        let link = `mine.html?lang=${Intl.getLang()}`
        if (window.location.search.indexOf('debug') !== -1) {
            link += '&debug=1'
        }
        const { title, isShare, openNew } = this.state

        return (
            <div className="mine-trade">
                <div className="mine-trade-header">
                    <div className="mine-trade-header-left">
                        <div className="mine-trade-header-back" onClick={this.navJump.bind(this)}></div>
                    </div>
                    <div className="mine-trade-header-center">{Intl.lang(title)}</div>
                    <div className="mine-trade-header-right" onClick={this.shareContent.bind(this)}>{Intl.lang('Invite.share')}</div>
                </div>

                <div className="mine-trade-iframe">
                    <iframe ref="mine" src={link} frameBorder="0"></iframe>
                </div>

                <div className="mine-trade-share" style={{ bottom: isShare ? '0' : '-300px' }}>
                    <input className="mine-trade-share-input" type="text" id="copy-share-text" defaultValue={window.location.href} />
                    <div className="bdsharebuttonbox">
                        <a href="javascript:;" className="share-item copy-link-share" data-clipboard-action="copy" data-clipboard-target="#copy-share-text">
                            <img src={Icon1} alt="mine-share" />
                            <p>{Intl.lang('activity.registered.btn')}</p>
                        </a>
                        {this.wx && <a href="javascript:;" className="bds_tsina share-item">
                            <img onClick={this.gotoBrowserOpen.bind(this)} src={wxIocn} />
                            <p>{Intl.lang('trading.dig.wx')}</p>
                        </a>}
                        <a href="javascript:;" className="bds_tsina share-item">
                            <img src={Icon2} alt="mine-share" data-cmd="tsina" />
                            <p>{Intl.lang('trading.dig.32')}</p>
                        </a>
                        <a href="javascript:;" className="bds_twi share-item">
                            <img src={Icon3} alt="mine-share" data-cmd="fbook" />
                            <p>Twitter</p>
                        </a>
                        <a href="javascript:;" className="bds_fbook share-item">
                            <img src={Icon4} alt="mine-share" data-cmd="twi" />
                            <p>Facebook</p>
                        </a>
                    </div>
                    <div className="mine-trade-share-colse" onClick={this.shareContent.bind(this)}>{Intl.lang('mining.status0')}</div>
                </div>
                {openNew && <BrowserOpen closeBrowser={this.gotoBrowserOpen.bind(this)} />}
            </div>
        )
    }
}

export default MineTrade