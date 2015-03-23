'use strict';
angular.module('angular-jointjs-graph')
  .directive('graphNode', [
    function() {
      return {
        templateUrl: 'angular-joints-graph/templates/graphNode',
        templateNamespace: 'svg',
        restrict: 'E',
        transclude: true
      };
    }
  ]);
