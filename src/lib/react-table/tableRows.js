import React, { Component } from 'react'
import classnames from 'classnames'
import Methods from './methods'
//
import _ from './utils'

export default class TableRows extends Methods(Component) {
    constructor (props) {
        super(props);

        this.state = {
            ...this.props
        }
    }

    componentWillReceiveProps(nextProps) {
        this.setState(nextProps);
    }

    changeState(newState){
        this.setStateWithData(this.getDataModel(newState, true))
    }

    render(){
        const resolvedState = this.state

        const {
            getTrGroupProps,
            getTrProps,
            getTdProps,
            getPaginationProps,
            getNoDataProps,
            showPagination,
            showPaginationTop,
            showPaginationBottom,
            manual,
            noDataText,
            // Pivoting State
            pivotIDKey,
            pivotValKey,
            pivotBy,
            subRowsKey,
            aggregatedKey,
            originalKey,
            indexKey,
            groupedByPivotKey,
            // State
            pageSize,
            page,
            resized,
            expanded,
            pages,
            onExpandedChange,
            // Components

            TrGroupComponent,
            TrComponent,

            TdComponent,

            PaginationComponent,

            SubComponent,
            NoDataComponent,

            ExpanderComponent,
            PivotValueComponent,
            PivotComponent,
            AggregatedComponent,

            PadRowComponent,
            // Data model
            resolvedData,
            allVisibleColumns,
            // Sorted Data
            sortedData,
        } = resolvedState

        // Pagination
        const startRow = pageSize * page
        const endRow = startRow + pageSize
        let pageRows = manual ? resolvedData : sortedData.slice(startRow, endRow)
        const minRows = this.getMinRows()
        const padRows = _.range(Math.max(minRows - pageRows.length, 0))

        const recurseRowsViewIndex = (rows, path = [], index = -1) => ([
                rows.map((row, i) => {
                    index += 1
                    const rowWithViewIndex = {
                        ...row,
                        _viewIndex: index,
                    }
                    const newPath = path.concat([i])
                    if (rowWithViewIndex[subRowsKey] && _.get(expanded, newPath)) {
                        [rowWithViewIndex[subRowsKey], index] = recurseRowsViewIndex(
                            rowWithViewIndex[subRowsKey],
                            newPath,
                            index,
                        )
                    }
                    return rowWithViewIndex
                }),
                index,
            ])
        ;[pageRows] = recurseRowsViewIndex(pageRows)

        const canPrevious = page > 0
        const canNext = page + 1 < pages

        const rowMinWidth = _.sum(
            allVisibleColumns.map(d => {
                const resizedColumn = resized.find(x => x.id === d.id) || {}
                return _.getFirstDefined(resizedColumn.value, d.width, d.minWidth)
            }),
        )

        let rowIndex = -1

        const finalState = {
            ...resolvedState,
            startRow,
            endRow,
            pageRows,
            minRows,
            padRows,
            canPrevious,
            canNext,
            rowMinWidth,
        }

        const noDataProps = getNoDataProps(finalState, undefined, undefined, this)

        const makePagination = () => {
            const paginationProps = _.splitProps(
                getPaginationProps(finalState, undefined, undefined, this),
            )
            return (
                <PaginationComponent
                    {...resolvedState}
                    pages={pages}
                    canPrevious={canPrevious}
                    canNext={canNext}
                    onPageChange={this.onPageChange}
                    onPageSizeChange={this.onPageSizeChange}
                    className={paginationProps.className}
                    style={paginationProps.style}
                    {...paginationProps.rest}
                />
            )
        }

        const makePageRow = (row, i, path = []) => {
            const rowInfo = {
                original: row[originalKey],
                row,
                index: row[indexKey],
                viewIndex: rowIndex += 1,
                pageSize,
                page,
                level: path.length,
                nestingPath: path.concat([i]),
                aggregated: row[aggregatedKey],
                groupedByPivot: row[groupedByPivotKey],
                subRows: row[subRowsKey],
            }
            const isExpanded = _.get(expanded, rowInfo.nestingPath)
            const trGroupProps = getTrGroupProps(finalState, rowInfo, undefined, this)
            const trProps = _.splitProps(
                getTrProps(finalState, rowInfo, undefined, this),
            )
            return (
                <TrGroupComponent key={rowInfo.nestingPath.join('_')} {...trGroupProps}>
                    <TrComponent
                        className={classnames(
                            trProps.className,
                            row._viewIndex % 2 ? '-even' : '-odd',
                        )}
                        style={trProps.style}
                        {...trProps.rest}
                    >
                        {allVisibleColumns.map((column, i2) => {
                            const resizedCol = resized.find(x => x.id === column.id) || {}
                            const show =
                                typeof column.show === 'function' ? column.show() : column.show
                            const width = _.getFirstDefined(
                                resizedCol.value,
                                column.width,
                                column.minWidth,
                            )
                            const maxWidth = _.getFirstDefined(
                                resizedCol.value,
                                column.width,
                                column.maxWidth,
                            )
                            const tdProps = _.splitProps(
                                getTdProps(finalState, rowInfo, column, this),
                            )
                            const columnProps = _.splitProps(
                                column.getProps(finalState, rowInfo, column, this),
                            )

                            const classes = [
                                tdProps.className,
                                column.className,
                                columnProps.className,
                            ]

                            const styles = {
                                ...tdProps.style,
                                ...column.style,
                                ...columnProps.style,
                            }

                            const cellInfo = {
                                ...rowInfo,
                                isExpanded,
                                column: { ...column },
                                value: rowInfo.row[column.id],
                                pivoted: column.pivoted,
                                expander: column.expander,
                                resized,
                                show,
                                width,
                                maxWidth,
                                tdProps,
                                columnProps,
                                classes,
                                styles,
                            }

                            const value = cellInfo.value

                            let useOnExpanderClick
                            let isBranch
                            let isPreview

                            const onExpanderClick = e => {
                                let newExpanded = _.clone(expanded)
                                if (isExpanded) {
                                    newExpanded = _.set(newExpanded, cellInfo.nestingPath, false)
                                } else {
                                    newExpanded = _.set(newExpanded, cellInfo.nestingPath, {})
                                }

                                return this.setStateWithData(
                                    {
                                        expanded: newExpanded,
                                    },
                                    () => (
                                        onExpandedChange &&
                                        onExpandedChange(newExpanded, cellInfo.nestingPath, e)
                                    ),
                                )
                            }

                            // Default to a standard cell
                            let resolvedCell = _.normalizeComponent(
                                column.Cell,
                                cellInfo,
                                value,
                            )

                            // Resolve Renderers
                            const ResolvedAggregatedComponent =
                                column.Aggregated ||
                                (!column.aggregate ? AggregatedComponent : column.Cell)
                            const ResolvedExpanderComponent =
                                column.Expander || ExpanderComponent
                            const ResolvedPivotValueComponent =
                                column.PivotValue || PivotValueComponent
                            const DefaultResolvedPivotComponent =
                                PivotComponent ||
                                (props => (
                                    <div>
                                        <ResolvedExpanderComponent {...props} />
                                        <ResolvedPivotValueComponent {...props} />
                                    </div>
                                ))
                            const ResolvedPivotComponent =
                                column.Pivot || DefaultResolvedPivotComponent

                            // Is this cell expandable?
                            if (cellInfo.pivoted || cellInfo.expander) {
                                // Make it expandable by defualt
                                cellInfo.expandable = true
                                useOnExpanderClick = true
                                // If pivoted, has no subRows, and does not have a subComponent,
                                // do not make expandable
                                if (cellInfo.pivoted && !cellInfo.subRows && !SubComponent) {
                                    cellInfo.expandable = false
                                }
                            }

                            if (cellInfo.pivoted) {
                                // Is this column a branch?
                                isBranch =
                                    rowInfo.row[pivotIDKey] === column.id && cellInfo.subRows
                                // Should this column be blank?
                                isPreview =
                                    pivotBy.indexOf(column.id) >
                                    pivotBy.indexOf(rowInfo.row[pivotIDKey]) && cellInfo.subRows
                                // Pivot Cell Render Override
                                if (isBranch) {
                                    // isPivot
                                    resolvedCell = _.normalizeComponent(
                                        ResolvedPivotComponent,
                                        {
                                            ...cellInfo,
                                            value: row[pivotValKey],
                                        },
                                        row[pivotValKey],
                                    )
                                } else if (isPreview) {
                                    // Show the pivot preview
                                    resolvedCell = _.normalizeComponent(
                                        ResolvedAggregatedComponent,
                                        cellInfo,
                                        value,
                                    )
                                } else {
                                    resolvedCell = null
                                }
                            } else if (cellInfo.aggregated) {
                                resolvedCell = _.normalizeComponent(
                                    ResolvedAggregatedComponent,
                                    cellInfo,
                                    value,
                                )
                            }

                            if (cellInfo.expander) {
                                resolvedCell = _.normalizeComponent(
                                    ResolvedExpanderComponent,
                                    cellInfo,
                                    row[pivotValKey],
                                )
                                if (pivotBy) {
                                    if (cellInfo.groupedByPivot) {
                                        resolvedCell = null
                                    }
                                    if (!cellInfo.subRows && !SubComponent) {
                                        resolvedCell = null
                                    }
                                }
                            }

                            const resolvedOnExpanderClick = useOnExpanderClick
                                ? onExpanderClick
                                : () => {}

                            // If there are multiple onClick events, make sure they don't
                            // override eachother. This should maybe be expanded to handle all
                            // function attributes
                            const interactionProps = {
                                onClick: resolvedOnExpanderClick,
                            }

                            if (tdProps.rest.onClick) {
                                interactionProps.onClick = e => {
                                    tdProps.rest.onClick(e, () => resolvedOnExpanderClick(e))
                                }
                            }

                            if (columnProps.rest.onClick) {
                                interactionProps.onClick = e => {
                                    columnProps.rest.onClick(e, () => resolvedOnExpanderClick(e))
                                }
                            }

                            // Return the cell
                            return (
                                <TdComponent
                                    // eslint-disable-next-line react/no-array-index-key
                                    key={`${i2}-${column.id}`}
                                    className={classnames(
                                        classes,
                                        !show && 'hidden',
                                        cellInfo.expandable && 'rt-expandable',
                                        (isBranch || isPreview) && 'rt-pivot',
                                    )}
                                    style={{
                                        ...styles,
                                        flex: `${width} 0 auto`,
                                        width: _.asPx(width),
                                        maxWidth: _.asPx(maxWidth),
                                    }}
                                    {...tdProps.rest}
                                    {...columnProps.rest}
                                    {...interactionProps}
                                >
                                    {resolvedCell}
                                </TdComponent>
                            )
                        })}
                    </TrComponent>
                    {rowInfo.subRows &&
                    isExpanded &&
                    rowInfo.subRows.map((d, i) =>
                        makePageRow(d, i, rowInfo.nestingPath),
                    )}
                    {SubComponent &&
                    !rowInfo.subRows &&
                    isExpanded &&
                    SubComponent(rowInfo)}
                </TrGroupComponent>
            )
        }

        const makePadColumn = (column, i) => {
            const resizedCol = resized.find(x => x.id === column.id) || {}
            const show =
                typeof column.show === 'function' ? column.show() : column.show
            const width = _.getFirstDefined(
                resizedCol.value,
                column.width,
                column.minWidth,
            )
            const flex = width
            const maxWidth = _.getFirstDefined(
                resizedCol.value,
                column.width,
                column.maxWidth,
            )
            const tdProps = _.splitProps(
                getTdProps(finalState, undefined, column, this),
            )
            const columnProps = _.splitProps(
                column.getProps(finalState, undefined, column, this),
            )

            const classes = [
                tdProps.className,
                column.className,
                columnProps.className,
            ]

            const styles = {
                ...tdProps.style,
                ...column.style,
                ...columnProps.style,
            }

            return (
                <TdComponent
                    key={`${i}-${column.id}`}
                    className={classnames(classes, !show && 'hidden')}
                    style={{
                        ...styles,
                        flex: `${flex} 0 auto`,
                        width: _.asPx(width),
                        maxWidth: _.asPx(maxWidth),
                    }}
                    {...tdProps.rest}
                >
                    {_.normalizeComponent(PadRowComponent)}
                </TdComponent>
            )
        }

        const makePadRow = (row, i) => {
            const trGroupProps = getTrGroupProps(
                finalState,
                undefined,
                undefined,
                this,
            )
            const trProps = _.splitProps(
                getTrProps(finalState, undefined, undefined, this),
            )
            return (
                <TrGroupComponent key={i} {...trGroupProps}>
                    <TrComponent
                        className={classnames(
                            '-padRow',
                            (pageRows.length + i) % 2 ? '-even' : '-odd',
                            trProps.className,
                        )}
                        style={trProps.style || {}}
                    >
                        {allVisibleColumns.map(makePadColumn)}
                    </TrComponent>
                </TrGroupComponent>
            )
        }


        const pagination = makePagination();

        return <div>
            {showPagination && showPaginationTop
                ? <div className="pagination-top">
                    {pagination}
                </div>
                : null}
            {pageRows.map((d, i) => makePageRow(d, i))}
            {padRows.map(makePadRow)}
            {!pageRows.length &&
            <NoDataComponent {...noDataProps}>
                {_.normalizeComponent(noDataText)}
            </NoDataComponent>}
            {showPagination && showPaginationBottom
                ? <div className="pagination-bottom">
                    {pagination}
                </div>
                : null}
        </div>
    }
}