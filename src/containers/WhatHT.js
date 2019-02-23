import React from 'react';
import PureComponent from "../core/PureComponent";

import Intl from '../intl';

class HelpIntroduce extends PureComponent {

	constructor(props) {
		super(props);

		this.state = {
			Tab:0
		};
	}
	componentDidMount() {
		document.documentElement.scrollTop = 0;
	}
	changeTab(tab){
		if(tab!=this.state.Tab){
			this.setState({Tab:tab});
		}
	}
	render() {
		const { Tab } = this.state;
		const TabArr = ["什么是HT", "怎么获取", "HT价值"];
		return(
			<div className="helpIntroduce">
				<div className="bg_pic">
					<h3>TDEx Token</h3>
					<h1>TDEx全球通用积分</h1>
					<h3>与TDEx共同成长</h3>
					<p>基于区块链发展和管理的积分系统</p>
				</div>
				<div className="change">
					<ul className="list_">
						{TabArr.map((v,i)=>{
							return <li key={i} onClick={()=>this.changeTab(i)}><span className={Tab==i?"active":""}>{v}</span></li>
						})}

					</ul>
				</div>
				{Tab==0 ?
					<div className="content_one">
						<div className="trading_scenario">
							<h3>多种使用场景，价值支撑</h3>
							<ul>
								<li>
									<p>VIP手续费</p>
								</li>
								<li>
									<p>VIP手续费</p>
								</li>
								<li>
									<p>VIP手续费</p>
									<p>2018年2月</p>
								</li>
								<li>
									<p>VIP手续费</p>
									<p>2018年2月</p>
								</li>
								<li>
									<p>VIP手续费</p>
									<p>2018年2月</p>
								</li>
								<li>
									<p>VIP手续费</p>
									<p>2018年2月</p>
								</li>
							</ul>
						</div>
						<div className="product_trading">
							<h3>支持TDEx全球业务、全线产品</h3>
							<div className="trading_svg">
								<ul>
									<li></li>
									<li>币币交易</li>
									<li></li>
									<li>法币交易</li>
									<li></li>
								</ul>
								<ul>
									<li>
										<p>TDEx韩国站</p>
										<p>2018年3月</p>
										<p>敬请期待</p>
									</li>
									<li></li>
									<li>
										<p>TDEx日本站</p>
										<p>2018年3月</p>
										<p>敬请期待</p>
									</li>
									<li></li>
									<li>
										<p>TDEx钱包</p>
										<p>2018年3月</p>
										<p>敬请期待</p>
									</li>
								</ul>
								<svg width="903px" height="282px" viewBox="0 0 903 282" version="1.1"
									 xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
									<title>Group 18</title>
									<desc>Created with Sketch.</desc>
									<defs>
										<linearGradient x1="50%" y1="3.23903819%" x2="50%" y2="151.720302%"
														id="linearGradient-1">
											<stop stopColor="#7A98F7" offset="0%"></stop>
											<stop stopColor="#7A98F7" stopOpacity="0" offset="100%"></stop>
										</linearGradient>
									</defs>
									<g id="积分-什么是HGT" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd"
									   transform="translate(-509.000000, -1455.000000)">
										<g id="Group-53" transform="translate(0.000000, 1236.000000)">
											<g id="Group-18" transform="translate(510.000000, 220.000000)">
												<g id="Group-29" transform="translate(180.000000, 0.000000)"
												   stroke="url(#linearGradient-1)" strokeWidth="1.2">
													<rect id="Rectangle-4" x="0" y="0" width="180" height="140"
														  rx="1"></rect>
												</g>
												<g id="Group-28" transform="translate(540.000000, 0.000000)"
												   stroke="url(#linearGradient-1)" strokeWidth="1.2">
													<rect id="Rectangle-4-Copy-3" x="0" y="0" width="180" height="140"
														  rx="1"></rect>
												</g>
												<g id="Group-21" transform="translate(0.000000, 140.000000)">
													<rect id="Rectangle-4-Copy-6" stroke="url(#linearGradient-1)"
														  strokeWidth="1.2" x="0" y="0" width="180" height="140"
														  rx="1"></rect>
													<rect id="Rectangle-6-Copy-3" fill="#7F9DF7" opacity="0.300000012"
														  x="0" y="99" width="180" height="1"></rect>
												</g>
												<g id="Group-25" transform="translate(360.000000, 140.000000)">
													<rect id="Rectangle-4-Copy-5" stroke="url(#linearGradient-1)"
														  strokeWidth="1.2" x="0" y="0" width="180" height="140"
														  rx="1"></rect>
													<rect id="Rectangle-6-Copy" fill="#7F9DF7" opacity="0.300000012"
														  x="0" y="99" width="180" height="1"></rect>
												</g>
												<g id="Group-26" transform="translate(721.000000, 140.000000)">
													<rect id="Rectangle-4-Copy-4" stroke="url(#linearGradient-1)"
														  strokeWidth="1.2" x="0" y="0" width="180" height="140"
														  rx="1"></rect>
													<rect id="Rectangle-6-Copy-2" fill="#7F9DF7" opacity="0.300000012"
														  x="0" y="99" width="180" height="1"></rect>
												</g>
											</g>
										</g>
									</g>
								</svg>

							</div>
						</div>
						<div className="sector_chart">
							<h3>总量恒定、只送不卖</h3>
							<div className="chart_svg">
								<p>20% 用于用户奖励及平台运营共计1亿</p>
								<p>60% 用于购买点卡套餐赠送（每日限量）共计3亿</p>
								<p>20% 用于团队激励，共计1亿，锁定4年，每年发放2500万</p>
								<p>限定总量</p>
								<p>5亿</p>
								<svg width="401px" height="320px" viewBox="0 0 401 320" version="1.1"
									 xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
									<title>Group 40</title>
									<desc>Created with Sketch.</desc>
									<defs></defs>
									<g id="积分-什么是HGT" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd"
									   transform="translate(-765.000000, -2106.000000)">
										<g id="饼图" transform="translate(554.000000, 2106.000000)">
											<g id="Group-40" transform="translate(211.000000, 19.000000)">
												<g id="Group-39" transform="translate(55.000000, 1.000000)">
													<path
														d="M140,0 C77.6270257,0 24.7807802,40.7887745 6.6799673,97.1476197 C2.34233748,110.653301 0,125.053109 0,140 C0,217.319865 62.680135,280 140,280"
														id="Oval-5" stroke="#C7CCE6" strokeWidth="20"
														opacity="0.200000003"></path>
													<path
														d="M140,0 C77.6270257,0 24.7807802,40.7887745 6.6799673,97.1476197"
														id="Oval-5" stroke="#C7CCE6" strokeWidth="20"></path>
													<path
														d="M58,253.515232 C81.0389891,270.178497 109.351656,280 139.958257,280 C217.278122,280 279.958257,217.319865 279.958257,140 C279.958257,62.680135 217.278122,0 139.958257,0"
														id="Oval-3" stroke="#7A98F7" strokeWidth="40"></path>
												</g>
												<polyline id="Path-2-Copy" stroke="#7A98F7"
														  transform="translate(373.500000, 143.000000) scale(-1, 1) translate(-373.500000, -143.000000) "
														  points="346 128 381.301781 128 401 158"></polyline>
												<polyline id="Path-2" stroke="#C7CCE6" opacity="0.600000024"
														  points="36 0 71.3017809 0 91 30"></polyline>
												<polyline id="Path-2" stroke="#C7CCE6" opacity="0.600000024"
														  transform="translate(27.500000, 209.000000) scale(1, -1) translate(-27.500000, -209.000000) "
														  points="0 194 35.3017809 194 55 224"></polyline>
											</g>
										</g>
									</g>
								</svg>
							</div>
						</div>
						<div className="protection_fund">
							<h3>平台回购及TDEx用户保护基金</h3>
							<p>每个季度TDEx全球专业站以固定比例在流通市场回购，回购的HT全部计提TDEx投资者保护基金</p>
							<p>用于平台突发风险时对TDEx用户进行先行赔付，保护投资者权益</p>
						</div>
						<div className="popular_currency">
							<h3>与热门币种交易</h3>
							<p>TDEx积分（HT）可在币币交易市场上兑换成USDT、BTC、ETH</p>
							<div className="btn_">去交易</div>
							<div className="box">
								<div>
									<p>USDT</p>
									<p>
									</p>

								</div>
								<div>
									<p>BTC</p>
									<p>
									</p>
								</div>
								<div>
									<p>ETH</p>
									<p>
									</p>
								</div>
							</div>
						</div>
					</div>
				:Tab==1?
				<div className="content_two">
					<ul>
						<li>
							<div>1</div>
							<h4>手续费折扣</h4>
							<p>持有HT用户的建议对TDEx上币有重大影响</p>
							<p>只针对评级达到TDEx全球专业站上线要求的项目</p>
							<a>查看费率优惠</a>
						</li>
						<li>
							<div>1</div>
							<h4>平台定期回购</h4>
							<p>每个季度TDEx全球专业站以固定比例在流通市场回购</p>
							<p>回购的HT全部计提TDEx投资者保护基金</p>
							<a>查看费率优惠</a>
						</li>
						<li>
							<div>1</div>
							<h4>认证商家保证金</h4>
							<p>持有HT用户的建议对TDEx上币有重大影响</p>
							<p>只针对评级达到TDEx全球专业站上线要求的项目</p>
							<a>查看费率优惠</a>
						</li>
						<li>
							<div>1</div>
							<h4>TDEx积分专享活动</h4>
							<p>持有HT不定期赠送上线TDEx平台的新币</p>
						</li>
						<li>
							<div>1</div>
							<h4>与热门币种交易</h4>
							<p>持有HT用户的建议对TDEx上币有重大影响</p>
							<p>只针对评级达到TDEx全球专业站上线要求的项目</p>
							<a>查看费率优惠</a>
						</li>
						<li>
							<div>1</div>
							<h4>参与TDEx业务</h4>
							<p>持有HT用户的建议对TDEx上币有重大影响</p>
							<p>只针对评级达到TDEx全球专业站上线要求的项目</p>
							<a>查看费率优惠</a>
						</li>
					</ul>
				</div>
				:Tab==2?
				<div className="content_three">
					<ul>
						<li>
							<p>币币交易</p>
							<a>敬请期待</a>
						</li>
						<li>
							<p>TDEx火伴奖励</p>
							<a>敬请期待</a>
						</li>
						<li>
							<p>新用户奖励</p>
							<a>敬请期待</a>
						</li>
						<li>
							<p>老用户特别奖励</p>
							<a>敬请期待</a>
						</li>
						<li>
							<p>产品体验与建议奖励</p>
							<a>敬请期待</a>
						</li>
						<li>
							<p>最新活动奖励</p>
							<a>敬请期待</a>
						</li>
					</ul>
				</div>
					: null
				}
			</div>
		)
	}
}

export default HelpIntroduce;