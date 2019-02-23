import React from 'react';
import { Link } from 'react-router';

export default function CrumbsLink(props){
    const { pathData } = props;
    return (
        <div className="crumbs-header-link">
            {pathData && pathData.map((item, i)=>{
                return <Link key={i} to={item.pathLink}>{i !== 0 ?<i className="iconfont icon-arrow-l"></i> : null}{item.pathName}</Link>
            })}
        </div>
    )
}
