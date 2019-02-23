// These are the pages you can go to.
// They are all wrapped in the App component, which should contain the navbar etc
// See http://blog.mxstbr.com/2016/01/react-apps-with-pages for more information
// about the code splitting business
import AuthModel from './model/auth';
// import {IS_DEMO_PATH} from './config'
import history from "./core/history";

const errorLoading = (err) => {
    console.error('Dynamic page loading failed', err); // eslint-disable-line no-console
};

const loadModule = (cb) => (componentModule) => {
    cb(null, componentModule.default);
};

const redirectToDashboard = (nextState, replace, next) => {
    if (AuthModel.checkUserAuth()) {
        AuthModel.logedRedirect(nextState.location, '/trade', replace);
    }
    next();
};

const redirectToLogin = (nextState, replace, next) => {
    if (!AuthModel.checkUserAuth()) {
        var location = nextState.location;
        replace({
            pathname: '/login',
            query: {
                return_to: location.basename +location.pathname + location.search
            }
        });
    }
    next();
};

const redirect404 =  (nextState, replace, next) => {
    replace("/404");
    next();
};

export default {
    path: '/',
    getComponent: (nextState, cb) => {
        import('./containers/ElectronApp')
            .then(loadModule(cb))
            .catch(errorLoading);
    },
    indexRoute: {
        getComponent: (nextState, cb) => {
            import('./containers/Version')
                .then(loadModule(cb))
                .catch(errorLoading);
        }
    },
    childRoutes: [
        { path: "404",
            name:"404",
            getComponent: (nextState, cb) => {
                import('./containers/404')
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
        { path: "trade(/:name)",
            name:"trade",
            getComponent: (nextState, cb) => {
                import('./containers/TradeExpert')
                    .then(loadModule(cb))
                    .catch(errorLoading);
            }
        },
        { path: "exchange(/:name)",
            name:"exchange",
            getComponent: (nextState, cb) => {
                import('./containers/TradeExpert')
                    .then(loadModule(cb))
                    .catch(errorLoading);
            }
        },
        { path: "verify",
            name:"verify",
            getComponent: (nextState, cb) => {
                import('./containers/Verify')
                    .then(loadModule(cb))
                    .catch(errorLoading);
            }
        },
        {
            onEnter: redirectToDashboard,
            childRoutes: [
                {
                    path: 'login',
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
        { path: "*",
            name:"notfound",
            onEnter: redirect404,
            getComponent: (nextState, cb) => {
                import('./containers/404')
                    .then(loadModule(cb))
                    .catch(errorLoading);
            }
        }
    ]
}
