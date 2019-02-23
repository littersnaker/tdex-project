import React from 'react';
import PureComponent from "../core/PureComponent";
import Intl from '../intl';
import Pager from '../components/Pager';
import Net from '../net/net';

class ActivityCenter extends PureComponent {
    constructor(props) {

        super(props);

        this.curLang = "";
        this.state = {
            curPage: 1,
            activityList:[],
            activityData:'',
        }
    }

    componentDidMount() {
        this.curLang = Intl.getLang();
        this.requestActivity();
    }
    componentWillReceiveProps(nextProps){
        let newLang = Intl.getLang();
        if(this.curLang != newLang){
            this.curLang = newLang;
            this.requestActivity();
        }
    }

    requestActivity(page) {
        var curPage = page || this.state.curPage;
        var self = this;
        Net.httpRequest("news/activities", {Page:curPage, PageSize:4}, (data)=>{
            if (data.Status == 0){
                let Info = data.Data;
                let list = Info.List.length ? Info.List.sort((prev, next) => (next.Status - prev.Status)): Info.List;
                self.setState({activityData:Info, activityList:list, curPage:Info.Page});
            }
        });
    }

    setTimeFormat(startdate , endDate){
        if(endDate.indexOf("0000-00-00")!=-1){
            endDate = '';
            return Intl.lang('activity.Status.start',this.setNewDate(startdate));
        }
        if (this.compareDate(startdate , endDate)){
            return this.setNewDate(startdate)+' ~ '+ this.setNewDate(endDate);
        }else{
            return Intl.lang('activity.Status.start',this.setNewDate(startdate));
        }
    }

    setNewDate(date){
        var newTime = date.slice(0,date.indexOf(" "));
        return newTime;
    }

    compareDate(startdate , endDate){
        return((new Date(startdate.replace(/-/g, "\/"))) < (new Date(endDate.replace(/-/g, "\/"))));
    }

    turnPage(page){
        this.requestActivity(page);
    }
    render() {
        const { activityList, activityData } = this.state;
        return (
            <div className="inside-page-web advert-page">
                <div className="advert-flex">
                    {activityList ? activityList.map((item,i)=>{
                        return <div key={i}>
                            <a href={item.Url} target="_blank">
                                <div className="advert-pic">
                                    <div>
                                        <img src={item.ImageLarge}/>
                                    </div>
                                    <div className="advert-mask"></div>
                                    <span className="advert-start ">{Intl.lang('activity.Status'+item.Status)}</span>
                                </div>
                                <h4>{item.Title}</h4>
                                <p>{Intl.lang('activity.time')}{this.setTimeFormat(item.BeginTime,item.EndTime)}</p>
                            </a>
                        </div>
                    }): <div className="no-data">
                        <div>
                            <img src={process.env.PUBLIC_URL + "/images/mining/dig-emojy.png"} />
                        </div>
                        <p className="dig-no-data-p">{Intl.lang("mimic.panel.trading.15")}</p>
                    </div>}
                </div>
                {(activityData.hasOwnProperty("PageCount") && activityData.PageCount > 1) &&
                    <Pager data={activityData} onChange={this.turnPage.bind(this)}/>
                }
            </div>
        )
    }
}

export default ActivityCenter;