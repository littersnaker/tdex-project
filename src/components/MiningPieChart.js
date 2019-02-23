import React from 'react';
import PureComponent from "../core/PureComponent";

// 引入 ECharts 主模块
import echarts from 'echarts/lib/echarts';
// 引入柱状图
import 'echarts/lib/chart/pie'
// 引入提示框和标题组件
import 'echarts/lib/component/tooltip'
import 'echarts/lib/component/title'

export default class MiningPieChart extends PureComponent {
    componentDidMount() {
        this.initDraw(this.props.data);
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.data!=nextProps.data){
            this.update(nextProps.data);
        }
    }

    update(data){
        if (this.myChart){
            this.myChart.setOption({series:[{name:'pie', data: [{name:'Mined', value:data["Mined"]}, {name:'Remaining', value:data["Remaining"]}]}]});
        }
    }
    componentWillUnmount() {
        if (this.myChart){
            this.myChart.dispose();
        }
    }

    initDraw(data){
        var dom = document.getElementById("index_pie_chart");
        var myChart = echarts.init(dom);
        var option = {
            series : [
                {
                    name:'pie',
                    type:'pie',
                    radius : ['55%', '70%'],
                    center : ['50%', '50%'],
                    roseType : 'radius',
                    data:[
                        {value:data["Mined"], name:'Mined', itemStyle:{
                                shadowBlur: 5,
                                shadowColor: 'rgba(0, 0, 0, 0.5)',
                                color:{
                                    type: 'linear',
                                    x: 0,
                                    y: 0,
                                    x2: 0,
                                    y2: 1,
                                    colorStops: [{
                                        offset: 0, color: '#f2b047' // 0% 处的颜色
                                    }, {
                                        offset: 1, color: '#ec9224' // 100% 处的颜色
                                    }],
                                    globalCoord: false // 缺省为 false
                                }
                            }, label:{formatter: ["{title|已挖矿}","{point|}{content|{b} {c} TD}"].join("\n")}},
                        {value:data["Remaining"], name:'Remaining', itemStyle:{color:'#9fa0a4'}, label:{formatter: ["{title|剩下矿资产}","{point|}{content|{b} {c} TD}"].join("\n")}},
                    ],
                }
            ],
            label: {
                rich: {
                    title: {
                        color: '#999a9e',
                        align: 'left',
                        height: 25,
                        padding: [0,0,0,0],
                        fontSize: 14
                    },
                    point:{

                    },
                    content: {
                        color: '#000',
                        align: 'left',
                        fontSize: 14
                    }
                }
            }
        };
        if (option && typeof option === "object") {
            myChart.setOption(option, true);
            this.myChart = myChart;
        }
    }
    render(){
        return  <div id="index_pie_chart" style={{ width:"100%", height:"100%" }}></div>
    }
}