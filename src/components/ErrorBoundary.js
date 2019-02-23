import React from 'react';
// import AuthModel from '../model/auth';
import Intl from '../intl';
import * as Sentry from '@sentry/browser';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error:''
        };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ hasError: true, error:error});

        if ("development" !== process.env.NODE_ENV) {
            Sentry.withScope(scope => {
                Object.keys(errorInfo).forEach(key => {
                    scope.setExtra(key, errorInfo[key]);
                });
                Sentry.captureException(error);
            });
        }
    }

    render() {
        const {hasError, error} = this.state;

        if (hasError && this.props.showError) {
            // // You can render any custom fallback UI
            return <div><p>{Intl.lang("error.submit")}</p><a onClick={() => Sentry.showReportDialog()}>{Intl.lang("common.submit")}</a></div>
        }else{
            return this.props.children;
        }
    }
}
