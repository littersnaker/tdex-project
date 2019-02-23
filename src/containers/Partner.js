import React from 'react';
import PureComponent from "../core/PureComponent";
import Intl from '../intl';
import { Link } from 'react-router';
import { getParameterByName } from "../utils/util";
import AuthModel from "../model/auth";

export default class Partner extends PureComponent {
    constructor(props) {
        super(props);

        this.isLogin = AuthModel.checkUserAuth();
        this.state = {
            tab: 2
        };
    }
    changeTab(tab){
        this.setState({tab:tab});
    }
    jumpToTab(tab){
        this.setState({tab:tab}, ()=>{
            const dTtop = document.getElementById('description').offsetTop;
            if(dTtop) document.documentElement.scrollTop = dTtop;
        });
    }
    getSuperTheme(tab){
        const themeData = {
            1:[
                {title: Intl.lang('Partner.text.2'), images: 'bonus', text: Intl.lang('new.Partner.professional.2')},
                {title: Intl.lang('Partner.text.operate'), images: 'operate2', text: Intl.lang('new.Partner.professional.3')},
                {title: Intl.lang('Partner.text.flow'), images: 'flow', text: Intl.lang('new.Partner.professional.4')},
                {title: Intl.lang('Partner.customize.dt5'), images: 'customize', text: Intl.lang("new.Partner.professional.5")},
            ],
            2:[
                {title: Intl.lang('Partner.text.1'), images: 'extension', text: Intl.lang('Partner.text.33')},
                {title: Intl.lang('Partner.text.2'), images: 'bonus', text: Intl.lang('Partner.text.34')},
                {title: Intl.lang('Partner.text.3'), images: 'certificate', text: Intl.lang('Partner.text.35')},
                {title: Intl.lang('Partner.text.4'), images: 'operate', text: Intl.lang('Partner.text.36')}
            ]
        };
        return themeData[tab]||[];
    }
    render() {
        const { tab } = this.state, lang = Intl.getLang();
        const device = getParameterByName('device');
        const welfareList = this.getSuperTheme(tab);
        return (
            <div className="partner-config-style">
                <div style={(device == 'ios') || (device == 'android') ? {marginTop: 0} : null} className={"partner-header-banner " + Intl.getLang()}>
                </div>
                <div className="partner-tab">
                    <ul className={"partner-level "+ lang}>
                        <li onClick={()=>this.jumpToTab(2)}>
                            <h5 className="job2"></h5>
                            <p className="theme">{Intl.lang("Partner.theme.2")}</p>
                            <div className="detail">
                                <p>{Intl.lang("Partner.theme.2.text1")}</p>
                                <p>{Intl.lang("Partner.theme.2.text2")}</p>
                            </div>
                            <p className="viewTxt">{Intl.lang("Partner.theme.view")}</p>
                        </li>
                        <li onClick={()=>this.jumpToTab(3)}>
                            <h5 className="job3"></h5>

                            <p className="theme">{Intl.lang("Partner.theme.3")}</p>
                            <div className="detail">
                                <p>{Intl.lang("Partner.theme.3.text1")}</p>
                            </div>
                            <p className="viewTxt">{Intl.lang("Partner.theme.view")}</p>
                        </li>
                        <li onClick={()=>this.jumpToTab(4)}>
                            <h5 className="job4"></h5>

                            <p className="theme">{Intl.lang("Partner.theme.4")}</p>
                            <div className="detail">
                                <p>{Intl.lang("Partner.theme.4.text1")}</p>
                            </div>
                            <p className="viewTxt">{Intl.lang("Partner.theme.view")}</p>
                        </li>
                        <li onClick={()=>this.jumpToTab(1)}>
                            <h5 className="job1"></h5>
                            <div className="theme">{Intl.lang("Partner.theme.1")}</div>
                            <div className="detail">
                                <p>{Intl.lang("new.Partner.professional.1")}</p>
                            </div>
                            {/*{(this.isLogin && true) && <a className='link-to-admin' href="#">{Intl.lang("Partner.theme.manage")}</a>}*/}
                            <p className="viewTxt">{Intl.lang("Partner.theme.view")}</p>
                        </li>
                    </ul>
                </div>
                <div id="description" className={"partner-item partner-item-welfare " + Intl.getLang()}>
                    <h2>{Intl.lang('Partner.text.37')}</h2>
                    <ul className="tab-data-list">
                        <div className="list-header-text list-header-tab">
                            <h3 className={tab==2?"active":""} onClick={()=>this.changeTab(2)}>{Intl.lang("Partner.theme.2")}</h3>
                            <h3 className={tab==3?"active":""} onClick={()=>this.changeTab(3)}>{Intl.lang("Partner.theme.3")}</h3>
                            <h3 className={tab==4?"active":""} onClick={()=>this.changeTab(4)}>{Intl.lang("Partner.theme.4")}</h3>
                            <h3 className={tab==1?"active":""} onClick={()=>this.changeTab(1)}>{Intl.lang("Partner.theme.1")}</h3>
                        </div>
                    </ul>
                </div>
                {tab == 1 && <div>
                    <div>
                        <div className={"partner-item partner-item-welfare " + Intl.getLang()}>
                            <ul className="partner-item-flex">
                                {welfareList && welfareList.map((item, key) => {
                                    return <li className="welfare-list-item" key={key}>
                                        <div className={'welfare-icon welfare-icon-' + item.images} />
                                        <p className='title'>{item.title}</p>
                                        <p className='text'>{item.text}</p>
                                    </li>
                                })}
                            </ul>
                        </div>
                        {/*<div className='partner-alliance-qr-code' />*/}
                        {/*<p className='partner-alliance-qr-p'>{Intl.lang('new.Partner.professional.6')}</p>*/}
                        <div className="partner-alliance">
                            {/*<div className="partner-alliance-func">*/}
                                {/*<ul className="func-l">*/}
                                    {/*<li><p>{Intl.lang("Partner.customize.dt1")}</p></li>*/}
                                    {/*<li><p>{Intl.lang("Partner.customize.dt2")}</p></li>*/}
                                    {/*<li><p>{Intl.lang("Partner.customize.dt3")}</p></li>*/}
                                    {/*<li><p>{Intl.lang("Partner.customize.dt4")}</p></li>*/}
                                    {/*<li><p>{Intl.lang("Partner.customize.dt5")}</p></li>*/}
                                    {/*<li><p>{Intl.lang("Partner.customize.dt6")}</p></li>*/}
                                {/*</ul>*/}
                                {/*<ul className="func-r">*/}
                                    {/*<li><p>{Intl.lang("Partner.customize.dd1")}</p></li>*/}
                                    {/*<li>*/}
                                        {/*<p>{Intl.lang("Partner.customize.dd2")}</p>*/}
                                        {/*<p>{Intl.lang("Partner.customize.dd3")}</p>*/}
                                        {/*<p>{Intl.lang("Partner.customize.dd4")}</p>*/}
                                    {/*</li>*/}
                                    {/*<li>*/}
                                        {/*<p>{Intl.lang("Partner.customize.dd5")}</p>*/}
                                        {/*<p>{Intl.lang("Partner.customize.dd6")}</p>*/}
                                    {/*</li>*/}
                                    {/*<li>*/}
                                        {/*<p>{Intl.lang("Partner.customize.dd7")}</p>*/}
                                        {/*<p>{Intl.lang("Partner.customize.dd8")}</p>*/}
                                        {/*<p>{Intl.lang("Partner.customize.dd9")}</p>*/}
                                        {/*<p>{Intl.lang("Partner.customize.dd10")}</p>*/}
                                        {/*<p>{Intl.lang("Partner.customize.dd11")}</p>*/}
                                        {/*<p>{Intl.lang("Partner.customize.dd12")}</p>*/}
                                        {/*<p>{Intl.lang("Partner.customize.dd13")}</p>*/}
                                        {/*<p>{Intl.lang("Partner.customize.dd14")}</p>*/}
                                        {/*<p>{Intl.lang("Partner.customize.dd15")}</p>*/}
                                    {/*</li>*/}
                                    {/*<li>*/}
                                        {/*<p>{Intl.lang("Partner.customize.dd16")}</p>*/}
                                    {/*</li>*/}
                                    {/*<li>*/}
                                        {/*<p>{Intl.lang("Partner.customize.dd17")}</p>*/}
                                    {/*</li>*/}
                                {/*</ul>*/}
                            {/*</div>*/}
                            <div className="tc">
                                <a className="applyBtn" href='https://jinshuju.net/f/xizVEg' target='_blank'>{Intl.lang("activity.ActivityTrading.apply")}</a>
                            </div>
                        </div>
                    </div>
                </div>}
                {tab==2 &&
                <div>
                    <div className={"partner-item partner-item-welfare " + Intl.getLang()}>
                        <ul className="partner-item-flex">
                            {welfareList && welfareList.map((item, key) => {
                                return <li className="welfare-list-item" key={key}>
                                    <div className={'welfare-icon welfare-icon-' + item.images} />
                                    <p className='title'>{item.title}</p>
                                    <p className='text'>{item.text}</p>
                                </li>
                            })}
                        </ul>
                    </div>
                    <div className="partner-item partner-item-super-partner">
                        <div className='package-details'>
                            <ul className='item'>
                                <li>{Intl.lang('Partner.text.39')}</li>
                                <li className='bg-1'>
                                    <p className='title'>{Intl.lang('Partner.text.40')}</p>
                                    <p>{Intl.lang('Partner.text.41')}</p>
                                    <p>{Intl.lang('Partner.text.42')}</p>
                                    <p>{Intl.lang('Partner.text.43')}</p>
                                </li>
                                <li className='bg-2'>
                                    <p className='title'>{Intl.lang('Partner.text.44')}</p>
                                    <p>{Intl.lang('Partner.text.45')}</p>
                                    <p>{Intl.lang('Partner.text.46')}</p>
                                    <p>{Intl.lang('Partner.text.47')}</p>
                                </li>
                                <li className='bg-3'>
                                    <p className='title'>{Intl.lang('Partner.text.48')}</p>
                                    <p>{Intl.lang('Partner.text.49')}</p>
                                    <p>{Intl.lang('Partner.text.50')}</p>
                                    <p>{Intl.lang('Partner.text.51')}</p>
                                </li>
                            </ul>
                            <ul className='item'>
                                <li>{Intl.lang('Partner.text.52')}</li>
                                <li>
                                    <ul className='inside-item'>
                                        <li><i></i>{Intl.lang('Partner.text.53')}</li>
                                    </ul>
                                </li>
                                <li>
                                    <ul className='inside-item'>
                                        <li><i></i>{Intl.lang('Partner.text.54')}</li>
                                    </ul>
                                </li>
                                <li>
                                    <ul className='inside-item'>
                                        <li><i></i>{Intl.lang('Partner.text.54')}</li>
                                    </ul>
                                </li>
                            </ul>
                            <ul className='item'>
                                <li>{Intl.lang('Partner.text.55')}</li>
                                <li>
                                    <ul className='inside-item'>
                                        <li><i></i>{Intl.lang('Partner.text.56')}</li>
                                        <li><i></i>{Intl.lang('Partner.text.57')}</li>
                                        <li><i></i>{Intl.lang('Partner.text.58')}</li>
                                    </ul>
                                </li>
                                <li>
                                    <ul className='inside-item'>
                                        <li><i></i>{Intl.lang('Partner.text.56')}</li>
                                        <li><i></i>{Intl.lang('Partner.text.57')}</li>
                                        <li><i></i>{Intl.lang('Partner.text.58')}</li>
                                    </ul>
                                </li>
                                <li>
                                    <ul className='inside-item'>
                                        <li><i></i>{Intl.lang('Partner.text.56')}</li>
                                        <li><i></i>{Intl.lang('Partner.text.57')}</li>
                                        <li><i></i>{Intl.lang('Partner.text.58')}</li>
                                    </ul>
                                </li>
                            </ul>
                            <ul className='item'>
                                <li>{Intl.lang('Partner.text.59')}</li>
                                <li>
                                    <ul className='inside-item'>
                                        <li><i></i>{Intl.lang('Partner.text.60')}</li>
                                        <li><i></i>{Intl.lang('Partner.text.61')}</li>
                                    </ul>
                                </li>
                                <li>
                                    <ul className='inside-item'>
                                        <li><i></i>{Intl.lang('Partner.text.60')}</li>
                                        <li><i></i>{Intl.lang('Partner.text.61')}</li>
                                    </ul>
                                </li>
                                <li>
                                    <ul className='inside-item'>
                                        <li><i></i>{Intl.lang('Partner.text.60')}</li>
                                        <li><i></i>{Intl.lang('Partner.text.61')}</li>
                                    </ul>
                                </li>
                            </ul>
                            <ul className='item'>
                                <li>{Intl.lang('Partner.text.62')}</li>
                                <li>
                                    <ul className='inside-item'>
                                        <li><i></i>{Intl.lang('Partner.text.63')}</li>
                                        <li><i></i>{Intl.lang('Partner.text.64')}</li>
                                        <li><i></i>{Intl.lang('Partner.text.65')}</li>
                                        <li><i></i>{Intl.lang('Partner.text.66')}</li>
                                        <li><i></i>{Intl.lang('Partner.text.67')}</li>
                                        <li><i></i>{Intl.lang('Partner.text.68')}</li>
                                        <li><i></i>{Intl.lang('Partner.text.69')}</li>
                                        <li className='off'><i></i>{Intl.lang('Partner.text.70')}</li>
                                        <li className='off'><i></i>{Intl.lang('Partner.text.71')}</li>
                                    </ul>
                                </li>
                                <li>
                                    <ul className='inside-item'>
                                        <li><i></i>{Intl.lang('Partner.text.63')}</li>
                                        <li><i></i>{Intl.lang('Partner.text.64')}</li>
                                        <li><i></i>{Intl.lang('Partner.text.65')}</li>
                                        <li><i></i>{Intl.lang('Partner.text.66')}</li>
                                        <li><i></i>{Intl.lang('Partner.text.67')}</li>
                                        <li><i></i>{Intl.lang('Partner.text.68')}</li>
                                        <li><i></i>{Intl.lang('Partner.text.69')}</li>
                                        <li className='off'><i></i>{Intl.lang('Partner.text.70')}</li>
                                        <li className='off'><i></i>{Intl.lang('Partner.text.71')}</li>
                                    </ul>
                                </li>
                                <li>
                                    <ul className='inside-item'>
                                        <li><i></i>{Intl.lang('Partner.text.63')}</li>
                                        <li><i></i>{Intl.lang('Partner.text.64')}</li>
                                        <li><i></i>{Intl.lang('Partner.text.65')}</li>
                                        <li><i></i>{Intl.lang('Partner.text.66')}</li>
                                        <li><i></i>{Intl.lang('Partner.text.67')}</li>
                                        <li><i></i>{Intl.lang('Partner.text.68')}</li>
                                        <li><i></i>{Intl.lang('Partner.text.69')}</li>
                                        <li><i></i>{Intl.lang('Partner.text.70')}</li>
                                        <li><i></i>{Intl.lang('Partner.text.71')}</li>
                                    </ul>
                                </li>
                            </ul>
                            <ul className='item'>
                                <li>{Intl.lang('Partner.text.72')}</li>
                                <li>
                                    <ul className='inside-item'>
                                        <li><i></i>{Intl.lang('Partner.text.73', 30)}</li>
                                        <li><i></i>{Intl.lang('Partner.text.74', 20)}</li>
                                    </ul>
                                </li>
                                <li>
                                    <ul className='inside-item'>
                                        <li><i></i>{Intl.lang('Partner.text.73', 50)}</li>
                                        <li><i></i>{Intl.lang('Partner.text.74', 25)}</li>
                                    </ul>
                                </li>
                                <li>
                                    <ul className='inside-item'>
                                        <li><i></i>{Intl.lang('Partner.text.73', 70)}</li>
                                        <li><i></i>{Intl.lang('Partner.text.74', 30)}</li>
                                    </ul>
                                </li>
                            </ul>
                        </div>
                        {/*<div className='partner-alliance-qr-code' />*/}
                        {/*<p className='partner-alliance-qr-p'>{Intl.lang('new.Partner.professional.6')}</p>*/}
                        <div className="tc">
                            <a className="applyBtn" href='https://jinshuju.net/f/I6TqiF' target='_blank'>{Intl.lang("activity.ActivityTrading.apply")}</a>
                        </div>
                    </div>
                    {/*<div className="partner-item partner-item-join-us hide">*/}
                        {/*<p className="title">{Intl.lang('Partner.text.27')}</p>*/}
                        {/*<p className="title color-ffaf3d">{Intl.lang('Partner.text.28')}</p>*/}
                        {/*<a href="https://jinshuju.net/f/I6TqiF" className="partner-header-link" target="_blank">{Intl.lang('Partner.text.22')}</a>*/}
                    {/*</div>*/}
                </div>}
                {tab==3 && <div className="professional-agent">
                    <ul className="rebate">
                        <li>
                            <h5>{Intl.lang("Partner.professional.dd1","30%")}</h5>
                            <p>{Intl.lang("Partner.professional.dd2","100,000")}</p>
                        </li>
                        <li>
                            <h5>{Intl.lang("Partner.professional.dd1","50%")}</h5>
                            <p>{Intl.lang("Partner.professional.dd2","200,000")}</p>
                        </li>
                        <li>
                            <h5>{Intl.lang("Partner.professional.dd1","70%")}</h5>
                            <p>{Intl.lang("Partner.professional.dd2","300,000")}</p>
                        </li>
                    </ul>
                    <div className="partner-item-super-partner mt-40">
                        <dl className='tips-list'>
                            <dt>{Intl.lang('Partner.text.26')}</dt>
                            <dd>{Intl.lang("Partner.professional.note1",'1.')}</dd>
                            <dd>{Intl.lang("Partner.professional.note2",'2.')}</dd>
                            <dd>{Intl.lang("Partner.professional.note3",'3.')}</dd>
                        </dl>
                    </div>
                    {/*<div className='partner-alliance-qr-code' />*/}
                    {/*<p className='partner-alliance-qr-p'>{Intl.lang('new.Partner.professional.6')}</p>*/}
                    <div className="tc">
                        <a className="applyBtn" href='https://jinshuju.net/f/OUqhW3' target='_blank'>{Intl.lang("activity.ActivityTrading.apply")}</a>
                    </div>
                </div>}
                {tab==4 && <div className="professional-agent">
                   <ul className="rebate">
                       <li className="rebate-all">
                           <h5>{Intl.lang("Partner.professional.dd1","20%")}</h5>
                           <p>{Intl.lang("Partner.professional.dd3","20%")}</p>
                       </li>
                   </ul>
                    <div className="partner-item-super-partner mt-40">
                        <dl className='tips-list'>
                            <dt>{Intl.lang('Partner.text.26')}</dt>
                            <dd>{Intl.lang("Partner.professional.note3",'1.')}</dd>
                        </dl>
                    </div>
                    <div className="tc">
                        <Link to="/invite" className="applyBtn active">{Intl.lang("Partner.text.22")}</Link>
                    </div>
                </div>}
            </div>
        )
    }
}

