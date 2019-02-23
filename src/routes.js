// These are the pages you can go to.
// They are all wrapped in the App component, which should contain the navbar etc
// See http://blog.mxstbr.com/2016/01/react-apps-with-pages for more information
// about the code splitting business
import AuthModel from './model/auth';
import { IS_DEMO_PATH } from './config'
import history from "./core/history";
import { isMobile } from './utils/util';

const errorLoading = (err) => {
	console.error('Dynamic page loading failed', err); // eslint-disable-line no-console
};

const loadModule = (cb) => (componentModule) => {
	cb(null, componentModule.default);
};

const redirectToDashboard = (nextState, replace, next) => {
	if (AuthModel.checkUserAuth()) {
		AuthModel.logedRedirect(nextState.location, '/', replace);
	}
	if (IS_DEMO_PATH) {
		if (nextState.location.pathname == "login") {
			replace("/trade");
		}
	}
	next();
};

const getUrlParams = (location, name) => {
	const reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)")
	const r = location.substr(1).match(reg)
	if (r !== null) {
		return decodeURIComponent(r[2])
	}
}

const redirectToLogin = (nextState, replace, next) => {
	const lt = nextState.location
	if (lt.pathname.indexOf('invite') !== -1 && lt.hash.indexOf('return_to') !== -1) {
		const uid = getUrlParams(lt.hash, 'uid')
		const channel = getUrlParams(lt.hash, 'channel')
		// console.log(' >> :', uid, channel)
		replace({
			pathname: '/register',
			query: {
				ref: uid,
				channel: channel
			}
		})
	}
	if (!AuthModel.checkUserAuth()) {
		var location = nextState.location;
		replace({
			pathname: '/login',
			query: {
				return_to: location.basename + location.pathname + location.search
			}
		});
	}
	next();
};

const redirectToRegister = (nextState, replace, next) => {
	const lt = nextState.location
	if (lt.hash.indexOf('return_to') !== -1) {
		const uid = getUrlParams(decodeURIComponent(lt.hash), 'uid')
		const channel = getUrlParams(decodeURIComponent(lt.hash), 'channel')
		// console.log(' >> :', uid, channel)
		replace({
			pathname: '/register',
			query: {
				ref: uid,
				channel: channel
			}
		})
	}
	next();
}

const redirectToMineTrade = (nextState, replace, next) => {
	if (isMobile()) {
		replace('/minetrade');
	}
	next();
}

const redirectToMining = (nextState, replace, next) => {
	if (!isMobile()) {
		replace('/mining');
	}
	next();
}

const selectToHome = (nextState, replace, next) => {
	var query = nextState.location.query;
	var q = {};
	if (query && (query.chnid || query.hmsr)){
		q.channel = query.chnid || query.hmsr;
	}
	if (!AuthModel.checkUserAuth()) {
		replace({
            pathname: "/home",
            query: q
        });
	} else if (IS_DEMO_PATH) {
		replace("/trade");
	}
	next();
};

const redirect404 = (nextState, replace, next) => {
	replace("/404");
	next();
};

export default {
	path: '/',
	getComponent: (nextState, cb) => {
		import('./containers/App')
			.then(loadModule(cb))
			.catch(errorLoading);
	},
	indexRoute: {
		//onEnter: selectToHome,
		name: "home",
		getComponent: (nextState, cb) => {
			import('./containers/Home')
				.then(loadModule(cb))
				.catch(errorLoading);
		}
	},
	childRoutes: [
		{
			path: "home",
			name: "home",
			onEnter: redirectToDashboard,
			getComponent: (nextState, cb) => {
				import('./containers/Home')
					.then(loadModule(cb))
					.catch(errorLoading);
			}
		},
		{
			path: "404",
			name: "404",
			getComponent: (nextState, cb) => {
				import('./containers/404')
					.then(loadModule(cb))
					.catch(errorLoading);
			}
		},
		{
			path: "trade(/:name)",
			name: "trade",
			getComponent: (nextState, cb) => {
				import('./containers/TradeExpert')
					.then(loadModule(cb))
					.catch(errorLoading);
			}
		},
        {
            path: "exchange(/:name)",
            name: "exchange",
            getComponent: (nextState, cb) => {
                import('./containers/Exchange')
                    .then(loadModule(cb))
                    .catch(errorLoading);
            }
        },
        {
            path: "cfd(/:name)",
            name: "cfd",
            getComponent: (nextState, cb) => {
                import('./containers/CFD')
                    .then(loadModule(cb))
                    .catch(errorLoading);
            }
        },
		{
			path: "usermodify(/:name)",
			name: "usermodify",
			getComponent: (nextState, cb) => {
				import('./containers/UserModifyVerify')
					.then(loadModule(cb))
					.catch(errorLoading);
			}
		},
        {
            path: "activities(/:name)",
            name: "activities",
            getComponent: (nextState, cb) => {
                import('./containers/Activities')
                    .then(loadModule(cb))
                    .catch(errorLoading);
            }
        },
		{
			path: "minetrade",
			name: "mineTrade",
			onEnter: redirectToMining,
			getComponent: (nextState, cb) => {
				import('./containers/MineTrade')
					.then(loadModule(cb))
					.catch(errorLoading);
			}
		},
		{
			path: "clause",
			name: "clause",
			getComponent: (nextState, cb) => {
				import('./containers/Clause')
					.then(loadModule(cb))
					.catch(errorLoading);
			}
		},
		{
			path: "contractonline",
			name: "contractonline",
			getComponent: (nextState, cb) => {
				import('./containers/ContractOnline')
					.then(loadModule(cb))
					.catch(errorLoading);
			}
		},
		{
			path: "guide",
			name: "guide",
			getComponent: (nextState, cb) => {
				import('./containers/Guide')
					.then(loadModule(cb))
					.catch(errorLoading);
			}
		},
		{
			path: "helper(/:name)",
			name: "helper",
			getComponent: (nextState, cb) => {
				import('./containers/Helper')
					.then(loadModule(cb))
					.catch(errorLoading);
			}
		},
		{
			path: "chat",
			name: "chat",
			getComponent: (nextState, cb) => {
				import('./containers/Chat')
					.then(loadModule(cb))
					.catch(errorLoading);
			}
		},
		{
			path: "activitycenter",
			name: "activitycenter",
			getComponent: (nextState, cb) => {
				import('./containers/ActivityCenter')
					.then(loadModule(cb))
					.catch(errorLoading);
			}
		},
		{
			path: "appdownload",
			name: "appdownload",
			getComponent: (nextState, cb) => {
				import('./containers/AppDownload')
					.then(loadModule(cb))
					.catch(errorLoading);
			}
		},
		{
			path: "mining",
			name: "mining",
			onEnter: redirectToMineTrade,
			getComponent: (nextState, cb) => {
				import('./containers/Mining')
					.then(loadModule(cb))
					.catch(errorLoading);
			}
		},
		{
			path: "emailVerification",
			name: "emailVerification",
			getComponent: (nextState, cb) => {
				import('./containers/EmailVerification')
					.then(loadModule(cb))
					.catch(errorLoading);
			}
		},
		{
			path: "activate",
			name: "activate",
			onEnter: redirectToRegister,
			getComponent: (nextState, cb) => {
				import('./containers/Activate')
					.then(loadModule(cb))
					.catch(errorLoading);
			}
		},
		{
			path: "partner",
			name: "partner",
			onEnter: redirectToRegister,
			getComponent: (nextState, cb) => {
				import('./containers/Partner')
					.then(loadModule(cb))
					.catch(errorLoading);
			}
		},
		{
			path: "partnerAdmin",
			name: "partnerAdmin",
			onEnter: redirectToRegister,
			getComponent: (nextState, cb) => {
				import('./containers/PartnerAdmin')
					.then(loadModule(cb))
					.catch(errorLoading);
			}
		},
		{
			path: "verify",
			name: "verify",
			getComponent: (nextState, cb) => {
				import('./containers/Verify')
					.then(loadModule(cb))
					.catch(errorLoading);
			}
		},
		{
			path: "forgotPassword",
			name: "forgotPassword",
			getComponent: (nextState, cb) => {
				import('./containers/ForgotPassword')
					.then(loadModule(cb))
					.catch(errorLoading);
			}
		},
		{
			path: "forget",
			name: "forget",
			getComponent: (nextState, cb) => {
				import('./containers/Forget')
					.then(loadModule(cb))
					.catch(errorLoading);
			}
		},
		{
			path: "createapi",
			name: "createapi",
			getComponent: (nextState, cb) => {
				import('./containers/CreateApi')
					.then(loadModule(cb))
					.catch(errorLoading);
			}
		},
		{
			path: "assetApply",
			name: "assetApply",
			getComponent: (nextState, cb) => {
				import('./containers/AssetApply')
					.then(loadModule(cb))
					.catch(errorLoading);
			}
		},
		{
			onEnter: redirectToDashboard,
			childRoutes: [
				{
					path: 'login(/:name)',
					name: 'login',
					getComponent: (nextState, cb) => {
						import('./containers/Login')
							.then(loadModule(cb))
							.catch(errorLoading);
					}
				},
				{
					path: 'register',
					name: 'register',
					getComponent: (nextState, cb) => {
						import('./containers/Register')
							.then(loadModule(cb))
							.catch(errorLoading);
					}
				}
			]
		},
		{
			onEnter: redirectToLogin,
			childRoutes: [
				{
					path: 'asset',
					name: 'asset',
					getComponent: (nextState, cb) => {
						import('./containers/Asset')
							.then(loadModule(cb))
							.catch(errorLoading);
					}
				},
				{
					path: 'recharge(/:name)',
					name: 'recharge',
					getComponent: (nextState, cb) => {
						import('./containers/Recharge')
							.then(loadModule(cb))
							.catch(errorLoading);
					}
				},
				{
					path: 'transfer(/:name)',
					name: 'transfer',
					getComponent: (nextState, cb) => {
						import('./containers/Transfer')
							.then(loadModule(cb))
							.catch(errorLoading);
					}
				},
				{
					path: 'walletExchange(/:name)',
					name: 'walletExchange',
					getComponent: (nextState, cb) => {
						import('./containers/WalletExchange')
							.then(loadModule(cb))
							.catch(errorLoading);
					}
				},
				{
					path: 'walletTransfer(/:name)',
					name: 'walletTransfer',
					getComponent: (nextState, cb) => {
						import('./containers/WalletTransfer')
							.then(loadModule(cb))
							.catch(errorLoading);
					}
				},
				{
					path: 'moneylog(/:name)',
					name: 'moneylog',
					getComponent: (nextState, cb) => {
						import('./containers/MoneyLog')
							.then(loadModule(cb))
							.catch(errorLoading);
					}
				},
				{
					path: 'withdrawals',
					name: 'withdrawals',
					getComponent: (nextState, cb) => {
						import('./containers/Withdrawals')
							.then(loadModule(cb))
							.catch(errorLoading);
					}
				},
				{
					path: 'personal(/:name)',
					name: 'personal',
					getComponent: (nextState, cb) => {
						import('./containers/Personal')
							.then(loadModule(cb))
							.catch(errorLoading);
					}
				},
				// {
				// 	path: 'vipRights',
				// 	name: 'vipRights',
				// 	getComponent: (nextState, cb) => {
				// 		import('./containers/VipRights')
				// 			.then(loadModule(cb))
				// 			.catch(errorLoading);
				// 	}
				// },
				{
					path: 'history',
					name: 'history',
					getComponent: (nextState, cb) => {
						import('./containers/HistoryLog')
							.then(loadModule(cb))
							.catch(errorLoading);
					}
				},
				{
					path: 'mininghistory',
					name: 'mininghistory',
					getComponent: (nextState, cb) => {
						import('./containers/MiningHistory')
							.then(loadModule(cb))
							.catch(errorLoading);
					}
				},
				{
					path: 'invite',
					name: 'invite',
					getComponent: (nextState, cb) => {
						import('./containers/Invite')
							.then(loadModule(cb))
							.catch(errorLoading);
					}
				},
				{
					path: "subscription",
					name: "subscription",
					getComponent: (nextState, cb) => {
						import('./containers/Subscription')
							.then(loadModule(cb))
							.catch(errorLoading);
					}
				},
				{
					path: "api",
					name: "api",
					getComponent: (nextState, cb) => {
						import('./containers/Api')
							.then(loadModule(cb))
							.catch(errorLoading);
					}
				},
				{
					path: "apiEmail",
					name: "apiEmail",
					getComponent: (nextState, cb) => {
						import('./containers/ApiEmail')
							.then(loadModule(cb))
							.catch(errorLoading);
					}
				},
				{
					path: "questionnaire",
					name: "questionnaire",
					getComponent: (nextState, cb) => {
						import('./containers/Questionnaire')
							.then(loadModule(cb))
							.catch(errorLoading);
					}
				},
				{
					path: "message",
					name: "message",
					getComponent: (nextState, cb) => {
						import('./containers/Message')
							.then(loadModule(cb))
							.catch(errorLoading);
					}
				}
			]
		},
		{
			path: "*",
			name: "notfound",
			onEnter: redirect404,
			getComponent: (nextState, cb) => {
				import('./containers/404')
					.then(loadModule(cb))
					.catch(errorLoading);
			}
		}
	]
}
