'use strict';

Bahmni.Clinical.OrderGroup = function(){};

Bahmni.Clinical.OrderGroup.prototype.group = function(orders, groupingParameter) {
    var getGroupingFunction = function (groupingParameter) {
        if (groupingParameter == 'date') {
            return function (order) {
                return order.dateCreated.substring(0, 10);
            };
        }
        return function (order) {
            return order[groupingParameter];
        }
    };

    groupingParameter = groupingParameter || 'date';
    var groupingFunction = getGroupingFunction(groupingParameter);
    var groupedOrders = new Bahmni.Clinical.ResultGrouper().group(orders, groupingFunction, 'orders', groupingParameter);
    if(groupingParameter === 'date'){
        return groupedOrders.map(function(order) {
            var sortedOrders = order.orders.sort(function(first, second) { first.dateCreated < second.dateCreated ? 1 : -1; });
            return {
                date: new Date(order.date),
                orders: sortedOrders
            };
        }).sort(function(first, second) { return first.date < second.date ? 1: -1; });
    }
    return groupedOrders.map(function (order) {
        var returnObj = {};
        returnObj[groupingParameter] = order[groupingParameter];
        returnObj['orders'] = order.orders;
        return returnObj;
    });
};

Bahmni.Clinical.OrderGroup.prototype.create = function (encounterTransactions, ordersName, filterFunction, groupingParameter, allTestAndPanels) {
    var filteredOrders = this.flatten(encounterTransactions, ordersName, filterFunction, allTestAndPanels);
    return this.group(filteredOrders, groupingParameter);
};

Bahmni.Clinical.OrderGroup.prototype.flatten = function (encounterTransactions, ordersName, filterFunction, allTestAndPanels) {
    var allTestsPanelsConcept = new Bahmni.Clinical.AllTestsPanelsConcept(allTestAndPanels)
    filterFunction = filterFunction || function(){return true;}
    var setOrderProvider = function (encounter) { 
        encounter[ordersName].forEach(function(order) {
            order.provider = encounter.providers[0];
            order.accessionUuid = encounter.encounterUuid;
            order.visitUuid = encounter.visitUuid;
        });
    };
    encounterTransactions.forEach(setOrderProvider);
    var flattenedOrders = Bahmni.Common.Util.ArrayUtil.flatten(encounterTransactions, ordersName);
    var filteredOrders = flattenedOrders.filter(filterFunction);
    return allTestsPanelsConcept.sortOrders(filteredOrders);
};