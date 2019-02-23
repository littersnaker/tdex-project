import React, { Component } from "react";
import PropTypes from "prop-types";
import Download from './Download';

// const headers = [{
//     id: 'first',
//     display: 'First column'
// }, {
//     id: 'second',
//     display: 'Second column'
// }];
//
// const rows = [{
//     first: 'foo',
//     second: 'bar'
// }, {
//     first: 'foobar',
//     second: 'foobar'
// }];
export default class DownloadCsv extends Component {
    static propTypes = {
        children: PropTypes.object.isRequired,
        disabled: PropTypes.bool,
        headers: PropTypes.arrayOf(PropTypes.object),
        filename: PropTypes.string,
        rows: PropTypes.arrayOf(PropTypes.object).isRequired
    };

    /**
     * Format the data for the csv
     * @param {[Object]} csvHeaders the document's headers
     * @param {[Object]} csvRows the document's rows
     * @return {String} Returns the csv data correctly formatted
     *
     */
     formatData (csvHeaders, csvRows) {
        let BOM = '\uFEFF';
        let csvData = BOM;
        let csvDataArray = [];
        const keyList = [];

        // Insert the header ids into the key list
        csvHeaders.forEach(header => {
            keyList.push(header.id);
        });

        // Insert the row keys into the key list
        csvRows.forEach(row => {
            const keys = Object.keys(row);

            keys.forEach(key => {
                if (keyList.indexOf(key) === -1) {
                    keyList.push(key);
                }
            });
        });

        // Insert header ids into the csv
        if (csvHeaders.length > 0) {
            csvDataArray.push(
                csvHeaders.reduce((result, header) => {
                    result.push(header.display || header.id || ' ');

                    return result;
                }, [])
            );
        }

        // Insert row data into the csv
        csvDataArray = csvDataArray.concat(
            csvRows.map(row => {
                return keyList.map(key => {
                    return `"${row[key]}"` || '';
                });
            })
        );

        csvDataArray.forEach((infoArray, index) => {
            const dataString = infoArray.join(',');

            csvData += index < csvRows.length ? `${dataString}\n` : dataString;
        });

        return csvData;
    }

    render(){
         const {children, disabled, headers, filename, rows, className, style} = this.props;

         const content = this.formatData(headers, rows);

         return (
             <Download className={className?className+(disabled?" disabled":""):(disabled?"disabled":"")} style={style} file={`${filename}.csv`} content={content}>{children}</Download>
         )
    }

}
