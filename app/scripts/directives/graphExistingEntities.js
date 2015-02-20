'use strict';
angular.module('angular-jointjs-graph')
  .directive('graphExistingEntities', [
    function() {
      return {
        require: '^graph',
        restrict: 'E',
        templateUrl: 'angular-joints-graph/templates/graphExistingEntities',
        transclude: true,
        controller: ['$attrs', '$transclude',
          function($attrs, $transclude) {
            this.transclude = $transclude;
          }
        ]
      };
    }
  ]);
