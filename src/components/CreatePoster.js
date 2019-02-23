import React from 'react';
import PureComponent from '../core/PureComponent'

import QRCode from 'qrcode.react';
import AuthModel from '../model/auth';
import Intl from "../intl";

export default class CreatePoster extends PureComponent {
    constructor(props) {
        super(props);

        this.posterLink = window.location.origin + "/register";
        this.state = {};
    }
    componentWillMount() {
        let Uid = this.props.uid || AuthModel.getRegisterData().Uid;
        if(Uid){
            this.posterLink = this.props.link;
        }
    }

    componentDidMount() {
        var introduceCanvas = document.getElementById('introduce-canvas');
        var qrWrap = document.getElementById('qr-wrap-canvas');
        var wW = document.body.clientWidth;
        var wH = document.body.clientHeight;
        introduceCanvas["width"] = wW * 2;
        introduceCanvas["height"] = wH * 2;
        introduceCanvas.style.width = wW;
        introduceCanvas.style.height = wH;
        var bg = document.getElementById('c-bg');
        var qrCode = document.getElementById('qrCode');
        var wrapW = qrCode.clientWidth;
        var wrapH = qrCode.clientHeight;
//      console.log(wrapW, wrapH)
        qrWrap["width"] = wrapW + 20;
        qrWrap["height"] = wrapH + 20;
//      console.log(bg, qrCode)
        var ctx = introduceCanvas.getContext('2d');
        var wrap_ctx = qrWrap.getContext('2d');
        wrap_ctx.fillStyle = '#fff';
        wrap_ctx.fillRect(0,0,wrapW+20,wrapH+20);

        wrap_ctx.drawImage(qrCode, 10, 10, wrapW, wrapH);

        bg.onload = function() {
            var qrWidth = Math.round((document.body.clientWidth / 3.763));
            var qrHeight = Math.round((document.body.clientHeight / 3.345));
            // console.log(qrWidth, qrHeight);
            ctx.drawImage(bg, 0, 0, wW * 2, wH * 2);
         // ctx.drawImage(qrCode, wW - qrWidth, wH * 2 - qrWidth * 2 - qrHeight, qrWidth * 2, qrWidth * 2);
            ctx.drawImage(qrWrap, (wW - qrWidth) * 1.8, wH * 2 - qrHeight - ((qrWidth - 10) * 2), qrWidth * 2, qrWidth * 2);
            var ImageSrc = introduceCanvas.toDataURL('image/png');
            var cImg = document.getElementById('c-img');
            cImg.src = ImageSrc;
            cImg.style.width = '100%';
        }
    }
    close(){
        this.props.onClick();
    }
    render() {
        const { className } = this.props;
        return(
            <div className={className}>
                <QRCode value={this.posterLink} size={Math.round((document.body.clientWidth/3.763))} id="qrCode" style={{opacity: 0,position:'absolute'}} />
                <img src={window.location.origin+"/images/invite/share-" + Intl.getLang() + ".jpg?"+Math.random()} id="c-bg" style={{display: 'none'}} />
                <canvas id="introduce-canvas" style={{display: 'none'}}></canvas>
                <canvas id="qr-wrap-canvas" style={{opacity: 0,position:'absolute'}}></canvas>
                <img id="c-img" />

                <div className="poster-close" onClick={()=>this.close()}><i className="iconfont icon-close fem15"></i></div>
                <div className="poster-tip">{Intl.lang("activity.registered.posters2")}</div>
            </div>
        );
    }
}