import React from 'react';
import PureComponent from "../core/PureComponent";
import Intl from '../intl';
import Net from '../net/net';

import QRCode from 'qrcode.react';
import { checkAgent } from '../utils/util';
import Client1Png from '../images/appdownload/client1.png';
import Client2Png from '../images/appdownload/client2.png';
import MobileHeader from "../components/MobileHeader";
import BrowserOpen from '../components/BrowserOpen';
import { DOWNLOAD_LINK } from '../config';

const $ = window.$;
class AppDownload extends PureComponent {

	constructor(props) {
		super(props);

        this.isMobile = props.isMobile;
        if(props.isMobile){
            this.query = (props.location.query && props.location.query["welcome"]) ? true:false;
        }else{
            this.appLink = window.location.origin + "/appdownload?welcome=qrCode";
        }

        this.state = {
            appLink:"--",
            Agent: "ios",
            mobileSys: "ios",
            dlData: {},
            qrShow: false,

            openNew: false
        }
	}
    componentDidMount(){
       if(this.isMobile){
           let type = this.checkAgent();
           this.getData(type);
       }else{
           this.getData("ios");
           this.getData("android");
       }
    }
    checkAgent(){
        let agent = checkAgent(), name="", type="";
        if (agent.ios) { //判断iPhone|iPad|iPod|iOS
            name = "ios";
            type = "ios";
        } else if (agent.android) {
            name = "android";
            type = "android";
        }
        if(agent.weixin) {
            type = "weixin";
        }
        this.setState({Agent: name, mobileSys:type});

        return name;
    }
    getData(type) {
        let timestamp = Math.round(new Date().getTime()/1000);
        let self = this, origin = window.location.origin, { dlData } = this.state;

        if(origin.indexOf("localhost")!=-1){
           origin = "https://tl.tdex.com";
        }

        $.ajax({
            url: "https://app-1257080242.cos.ap-guangzhou.myqcloud.com/"+ type +"/current.json?r="+ timestamp, //origin +"/download/"+ type +"/current.json?r="+ timestamp,
            success: function (res) {
                if(typeof(res)!='object') return false;
                try{
                    let info = self.isMobile ? res : dlData;
                    if(type=="android" && res.file){
                        info.androidLink = origin +"/app/download?os=android&file="+ res.file;
                    }else if(type=="ios" && res.href){
                        info.iosLink = res.href;
                    }

                    self.setState({dlData: info});
                }catch (e){
                    console.log(e.message);
                }
            },
            fail: function (res) {
                console.log(res.error);
            }
        });
    }
    gotoBrowserOpen(){
	    if(this.state.openNew){
            this.setState({openNew: false});
        }else {
            this.setState({openNew: true});
        }
    }
    qrToggle(flag){
        this.setState({qrShow:flag})
    }
	
	render() {
        const { Agent, mobileSys, dlData, openNew, qrShow } = this.state;
		return(
            !this.isMobile ?
			<div className="okk-trade-contain app-download">
				<div className="app-tdex">
					<h4>{Intl.lang("app.download.1")}</h4>
					<p>{Intl.lang("app.download.2")}</p>
				</div>
				<div className="app-mobile">
					<div className="app-content">
                        <div className="mobile-dow-app">
                            <h4 style={{paddingTop:100}}>{Intl.lang("app.download.3")}</h4>
                            <p> {(dlData.iosLink || dlData.androidLink)?Intl.lang("app.download.4"):Intl.lang("app.download.ready")}</p>
                            <div className="dow-app-btn">
                                <div className="download-btn1">
                                    {dlData.iosLink ?<a href={dlData.iosLink} onMouseOver={()=>this.qrToggle(true)} onMouseOut={()=>this.qrToggle(false)}></a>:<button className="btn btn-normal btnDis w-140 h-40">{Intl.lang("scoreRew.please_wait")}</button>}
                                    {dlData.androidLink ?<a href={dlData.androidLink} className="dl-android mt-20"  onMouseOver={()=>this.qrToggle(true)} onMouseOut={()=>this.qrToggle(false)}></a>:<button className="btn btn-normal btnDis w-140 h-40 mt-20">{Intl.lang("scoreRew.please_wait")}</button>}
                                </div>
                                {qrShow &&
                                    <div className="download-btn2 pdl-20">
                                        <QRCode value={this.appLink} size={80}/>
                                        <p className="mt-5">{Intl.lang("app.download.scanning")}</p>
                                    </div>
                                }
                            </div>
                        </div>
                        <div className="mobile-dow-img"><img src={Client1Png} /></div>
					</div>
				</div>
                    <div className="app-pc">
                        <div className="app-content">
                            <div className="mobile-dow-img"><img src={Client2Png} /></div>
                            <div className="mobile-dow-app">
                                <h4>{Intl.lang("app.download.5")}</h4>
                                <p>{Intl.lang("app.download.6")}</p>
                                <div className="dow-app-btn">
                                    <div className="download-btn1">
                                        <a href={DOWNLOAD_LINK.MAC}></a>
                                    </div>
                                    <div className="download-btn2">
                                        <a href={DOWNLOAD_LINK.WINDOW}></a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                {/*<div className="app-mobile hide">*/}
                    {/*<div className="app-content">*/}
                        {/*<div className="other-desbox tc">*/}
                            {/*<div><img src={process.env.PUBLIC_URL+"/images/gg-unbind.png"} width="100"/></div>*/}
                            {/*<p className="warn">下载谷歌验证器</p>*/}
                            {/*<p>使用环境</p>*/}
                            {/*<p>查看使用教程</p>*/}
                        {/*</div>*/}
                        {/*<div className="other-desbox tc">*/}
                            {/*<div><img src={process.env.PUBLIC_URL+"/images/gg-unbind.png"} width="100"/></div>*/}
                            {/*<p className="warn">下载谷歌验证器</p>*/}
                            {/*<p>使用环境</p>*/}
                            {/*<p>查看使用教程</p>*/}
                        {/*</div>*/}
                    {/*</div>*/}
                {/*</div>*/}
			</div>
            :
            <div className="appDownLoad-box" style={this.query?{height:"100%"}:null}>
                <MobileHeader title={Intl.lang("app.download")}/>
                <div className="m-downLoad-detail m-content-g">
                    <div className="m-downLoad-bg">
                        <img src="../images/appdownload/m-appdown-bg.jpg"/>
                    </div>

                    <div className="m-downLoad-head">
                        <div className="m-downLoad-adv">
                            <h3>TDEx</h3>
                            <h4>{Intl.lang("AdvBox.100")}</h4>
                            <p>{Intl.lang("app.download.text1")}</p>
                            <p>{Intl.lang("app.download.text2")}</p>
                        </div>
                    </div>
                    <div className="m-downLoad-center">
                        <p>{"V"+(dlData.version||"--")}</p>
                        <p>{Intl.lang("app.download.update")}{dlData.updated||"--"}</p>
                        {!dlData.version?
                            <div className="downLoad-btn btnDis">{Intl.lang("scoreRew.please_wait")}</div>
                            :
                            mobileSys=="ios" ?
                            <a href={dlData.iosLink} className="downLoad-btn"><i className="iconfont icon-ios fem-175"></i>{Intl.lang("app.download.btn")}</a>
                            :
                            mobileSys=="android" ?
                            <a href={dlData.androidLink} className="downLoad-btn"><i className="iconfont icon-android fem-175"></i>{Intl.lang("app.download.btn")}</a>
                                :
                                mobileSys=="weixin" ?<div className="downLoad-btn" onClick={this.gotoBrowserOpen.bind(this)}><i className={"iconfont fem-175 icon-"+ mobileSys}></i>{Intl.lang("app.download.btn")}</div>
                                    :
                                    <div className="downLoad-btn btnDis">{Intl.lang("scoreRew.please_wait")}</div>
                        }
                    </div>
                </div>
                {Agent=="ios" &&
                <div className="m-downLoad-help f-clear">
                    <h4>{Intl.lang("app.download.install")}</h4>
                    <p dangerouslySetInnerHTML={{__html:Intl.lang("app.download.help1")}}></p>
                    <div className="ios-install des-bg1"></div>
                    <p dangerouslySetInnerHTML={{__html:Intl.lang("app.download.help2")}}></p>
                    <div className="ios-install des-bg2"></div>
                    <div className="ios-install des-bg3"></div>
                    <div className="ios-install des-bg4"></div>
                    <p dangerouslySetInnerHTML={{__html:Intl.lang("app.download.help3")}}></p>
                    <div className="ios-install des-bg5"></div>
                </div>
                }
                {openNew && <BrowserOpen closeBrowser={this.gotoBrowserOpen.bind(this)} />}
            </div>
				
		)
	}
}

export default AppDownload;