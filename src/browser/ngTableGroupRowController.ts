/**
 * ngTable: Table + Angular JS
 *
 * @author Vitalii Savchuk <esvit666@gmail.com>
 * @url https://github.com/esvit/ng-table/
 * @license New BSD License <http://creativecommons.org/licenses/BSD/>
 */

import { IPromise } from 'angular';
import { DataResult, IGroupingFunc, Grouping, GroupSort } from '../core';
import { IColumnDef } from './public-interfaces';
import { ITableScope } from './ngTableController';

/**
 * @private
 */
export interface IScopeExtensions<T> {
    $selGroup: IGroupingFunc<any> | string;
    $selGroupTitle: string;
}


/**
 * Controller for the {@link ngTableGroupRow ngTableGroupRow} directive
 */
export class NgTableGroupRowController<T> {
    static $inject = ['$scope'];
    private groupFns: Array<IGroupingFunc<any> | IColumnDef> = [];
    constructor(private $scope: ITableScope<T> & IScopeExtensions<T>) {
        $scope.$watch<Grouping<any>>('params.group()', (newGrouping) => {
            this.setGroup(newGrouping);
        }, true);
    }

    getGroupables() {
        const groupableCols = this.$scope.$columns.filter($column => !!$column.groupable(this.$scope));
        return this.groupFns.concat(groupableCols);
    }

    getGroupTitle(group: IGroupingFunc<any> | IColumnDef) {
        return this.isGroupingFunc(group) ? group.title : group.title(this.$scope);
    }


    getVisibleColumns() {
        return this.$scope.$columns.filter($column => $column.show(this.$scope))
    }

    groupBy(group: IGroupingFunc<any> | IColumnDef) {
        if (this.isSelectedGroup(group)) {
            this.changeSortDirection();
        } else {
            if (this.isGroupingFunc(group)) {
                this.$scope.params.group(group);
            } else {
                // it's OK, we know that groupable will return a string
                // this is guaranteed by getGroupables returning only
                // columns that return (truthy) strings
                this.$scope.params.group(group.groupable(this.$scope) as string);
            }
        }
    }

    isSelectedGroup(group: IGroupingFunc<any> | IColumnDef) {
        if (this.isGroupingFunc(group)) {
            return group === this.$scope.$selGroup;
        } else {
            return group.groupable(this.$scope) === this.$scope.$selGroup;
        }
    }

    toggleDetail() {
        this.$scope.params.settings().groupOptions.isExpanded = !this.$scope.params.settings().groupOptions.isExpanded;
        return this.$scope.params.reload();
    }

    private changeSortDirection() {
        let newDirection: GroupSort;
        if (this.$scope.params.hasGroup(this.$scope.$selGroup, 'asc')) {
            newDirection = 'desc';
        } else if (this.$scope.params.hasGroup(this.$scope.$selGroup, 'desc')) {
            newDirection = '';
        } else {
            newDirection = 'asc';
        }
        this.$scope.params.group(this.$scope.$selGroup, newDirection);
    }

    private findGroupColumn(groupKey: IGroupingFunc<any> | string) {
        return this.$scope.$columns.filter($column => $column.groupable(this.$scope) === groupKey)[0];
    }

    private isGroupingFunc(val: IColumnDef | Grouping<any>): val is IGroupingFunc<any> {
        return typeof val === 'function';
    }

    private setGroup(grouping: Grouping<any>) {
        const existingGroupCol = this.findGroupColumn(this.$scope.$selGroup);
        if (existingGroupCol && existingGroupCol.show.assign) {
            existingGroupCol.show.assign(this.$scope, true);
        }
        if (this.isGroupingFunc(grouping)) {
            this.groupFns = [grouping];
            this.$scope.$selGroup = grouping;
            this.$scope.$selGroupTitle = grouping.title;
        } else {
            // note: currently only one group is implemented
            const groupKey = Object.keys(grouping || {})[0];
            const groupedColumn = this.findGroupColumn(groupKey);
            if (groupedColumn) {
                this.$scope.$selGroupTitle = groupedColumn.title(this.$scope);
                this.$scope.$selGroup = groupKey;
                if (groupedColumn.show.assign) {
                    groupedColumn.show.assign(this.$scope, false);
                }
            }
        }
    }
}