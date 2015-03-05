'use strict';
angular.module('angular-jointjs-graph')
  .directive('graphSidePanelDetails', [
    function() {
      return {
        require: '^graph',
        scope: true,
        restrict: 'E',
        templateUrl: 'angular-joints-graph/templates/graphSidePanelDetails',
        transclude: true
      };
    }
  ]);
