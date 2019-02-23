import React from 'react';
import PureComponent from "../core/PureComponent";
import Event from '../core/event'
import Swiper from 'swiper/dist/js/swiper.js';
import 'swiper/dist/css/swiper.min.css';
import { isMobile } from "../utils/util";

class HomeSwiper extends PureComponent {

    constructor(props) {
        super(props);

        this.hasBanner = false;
        this.langChange = false;
        this.isMobile = isMobile();
        this.mySwiper = null;
        this.state = {
            bannerData: []
        }
    }
    componentWillMount() {
        Event.addListener(Event.EventName.LANG_SELECT, this.changeLang.bind(this), this);
    }
    changeLang(){
        if(this.mySwiper) this.mySwiper.destroy();
        this.langChange = !this.langChange;
    }
    componentWillReceiveProps(nextProps){
        if(!this.hasBanner || nextProps.refresh == this.langChange){
            let list = nextProps.banner;
            this.sortBanner(list);
        }
    }
    componentWillUnmount(){
        if(this.mySwiper) this.mySwiper.destroy();
        super.componentWillUnmount();
    }
    createSwiper(loop) {
        this.mySwiper = new Swiper(this.swiperID, {
            pagination: {
                el: this.paginateID,
                clickable: true
            },
            autoplay: {
                delay: 5000,
                disableOnInteraction: true,
            },
            slidesPerView: 1,
            loop: loop
        });
    }
    sortBanner(data) {
        if(data && data.length) {
            this.hasBanner = true;
            const setSort = data.sort((prev, next) => {
                if (this.isMobile) {
                    return prev.SortMobile - next.SortMobile;
                } else {
                    return prev.SortPc - next.SortPc;
                }
            });
            this.setState({bannerData: setSort});
            if (data.length === 1) {
                setTimeout(()=>{this.createSwiper(false);},300);
            } else {
                setTimeout(()=>{this.createSwiper(true);},300);
            }
        }
    }

    setGtag = () => {
        if (gtag) {
            gtag('event', 'select_content', {
                'content_type': 'luckDraw'
            });
        }
    };

    render() {
        const { bannerData } = this.state;
        return (
            <div className="swiper-container home-swiper" ref={self => this.swiperID = self}>
                <div className="swiper-wrapper">
                    {bannerData && bannerData.map((item, index) => {
                        return <div key={index} className="swiper-slide slide-content">
                            {this.isMobile ? <a onClick={this.setGtag} href={item.TargetMobile} target="_blank">
                                <img className="slide-content-bg" src={item.ImageWeb} alt={item.Title}/>
                            </a> : <a onClick={this.setGtag} href={item.TargetPc} target="_blank">
                                <img className="slide-content-bg" src={item.ImagePc} alt={item.Title}/>
                            </a>}
                        </div>
                    })}
                </div>
                <div className="swiper-pagination banner-pagination" ref={self => this.paginateID = self}></div>
            </div>
        )
    }
}

export default HomeSwiper;