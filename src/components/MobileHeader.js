import React from 'react';
import { Link } from 'react-router';
import PureComponent from "../core/PureComponent";


class MobileHeader extends PureComponent {

    constructor(props) {

        super(props);

        this.state = {}
    }
    componentDidMount(){

    }
    render() {
        return (
            <div className="mobile-header-g">
                <div>
                    <Link to={'/personal'}><div className="mobile-header-icon iconfont icon-arrow-r"></div></Link>
                    <div className="mobile-header-title">{this.props.title}</div>
                    <div></div>
                </div>
            </div>

        )
    }
}

export default MobileHeader;