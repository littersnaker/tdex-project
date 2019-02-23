import React from 'react';
import PureComponent from "../core/PureComponent";
import Intl from '../intl';
import { isMobile } from "../utils/util";

const $ = window.$;

class HomeTips extends PureComponent {

    constructor(props) {

        super(props);

        this.mounted = true;

        this.HTTP_URL = 'https://support.tdex.com/';
        this.isMobile = isMobile();
        this.state = {
            lang: Intl.getLang(),
            noticeList: []
        }
    }
    componentWillUnmount(){
        this.mounted = false;
    }

    componentDidMount() {
        this.fetchSectionsId();
    }

    componentWillReceiveProps(nextProps){
        if(this.state.lang !== Intl.getLang()){
            this.setState({lang: Intl.getLang()});
            this.fetchSectionsId();
        }
    }

    fetchNoticeData(sectionsId) {
        const {lang} = this.state;
        $.ajax({
            url: this.HTTP_URL + 'api/v2/help_center/' + lang + '/sections/' + sectionsId + '/articles.json',
            success: res => {
                if(!res || !this.mounted) return;
                const noticeList = res.articles;
                this.isMobile ? noticeList.length = 1 : noticeList.length = 2;
                this.setState({noticeList: noticeList});

            }
        });
    }

    fetchSectionsId(){
        const {lang} = this.state;
        $.ajax({
            url: this.HTTP_URL + 'api/v2/help_center/' + lang + '/sections.json',
            success: res => {
                if(!res || !this.mounted) return;
                const sectionsId = res.sections[0].id;
                this.fetchNoticeData(sectionsId);
            }
        });
    }

    render() {
        const {lang, noticeList} = this.state;
        return (
            <div className="home-tips">
                <div>
                    <i className="iconfont icon-lingdang"></i>
                    <div className="tips-list">
                        {noticeList && noticeList.map((item, index) => {
                            return <a key={index} href={item.html_url} target="_blank">{item.name}</a>
                        })}
                    </div>
                    <a className="more-btn m-hide" href={"https://support.tdex.com/hc/"+lang+"/categories/115000409411"} target="_blank">{Intl.lang('new.home.home.tips.3')}<i className="iconfont icon-arrow-l"></i></a>
                </div>
            </div>
        )
    }
}

export default HomeTips;
