import Intl from '../intl';
import React from 'react';
import { Link } from 'react-router';

import PureComponent from "../core/PureComponent"

// import New1 from '../images/news/news1.jpg'

class NewsBox extends PureComponent{
    render() {
        return (
            <div className="newsbox">
                <div className="contain pdt-1">
                    <div className="kline-theme-border top-115"></div>
                    <div className="news-theme">{Intl.lang("NewsBox.100")}</div>
                    <div className="news-more"><a href="javascript:;"><span dangerouslySetInnerHTML={{__html:Intl.lang("NewsBox.101")}}></span><i className="iconfont icon-more fem875"></i></a></div>
                    <ul className="news-info-box flex-box flex-jc">
                        <li>
                            <div><img src={process.env.PUBLIC_URL+"/images/news/news1.jpg"} height="159"/></div>
                            <div className="news-des">
                                <h5>{Intl.lang("NewsBox.102")}</h5>
                                <p>{Intl.lang("NewsBox.103")}</p>
                            </div>
                            <div className="news-time">
                                <span>2017-08-18</span><a href="javascript:;" className="read-more"><span dangerouslySetInnerHTML={{__html:Intl.lang("NewsBox.104")}}></span><i className="iconfont icon-more fem875"></i></a>
                            </div>
                        </li>
                        <li>
                            <div><img src={process.env.PUBLIC_URL+"/images/news/news2.jpg"} height="159"/></div>
                            <div className="news-des">
                                <h5>{Intl.lang("NewsBox.102")}</h5>
                                <p>{Intl.lang("NewsBox.103")}</p>
                            </div>
                            <div className="news-time">
                                <span>2017-08-18</span><a href="javascript:;" className="read-more"><span dangerouslySetInnerHTML={{__html:Intl.lang("NewsBox.104")}}></span><i className="iconfont icon-more fem875"></i></a>
                            </div>
                        </li>
                        <li>
                            <div><img src={process.env.PUBLIC_URL+"/images/news/news3.jpg"} height="159"/></div>
                            <div className="news-des">
                                <h5>{Intl.lang("NewsBox.102")}</h5>
                                <p>{Intl.lang("NewsBox.103")}</p>
                            </div>
                            <div className="news-time">
                                <span>2017-08-18</span><a href="javascript:;" className="read-more"><span dangerouslySetInnerHTML={{__html:Intl.lang("NewsBox.104")}}></span><i className="iconfont icon-more fem875"></i></a>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        );
    }
}

export default NewsBox;