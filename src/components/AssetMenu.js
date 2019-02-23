import React from 'react';
import PureComponent from "../core/PureComponent";
import { Link } from 'react-router';

export default class AssetMenu extends PureComponent {

    render(){
        const { path } = this.props;
        const pathName = window.location.pathname;

        return (
            <ul className="asset-header">
                {path && path.map((item, index) => {
                    return <li key={'menu'+index} className={item.pathLink == pathName ? 'current' : ''}>
                        <Link to={item.pathLink}>
                            <i className={"iconfont " + item.pathIcon}/><span>{item.pathName}</span>
                        </Link>
                    </li>
                })}
            </ul>
        )
    }
}