'use strict';
angular.module('angular-jointjs-graph')
  .directive('graphSidePanelTools', [
    function() {
      return {
        require: '^graph',
        restrict: 'E',
        templateUrl: 'angular-joints-graph/templates/graphSidePanelTools',
        transclude: true,
        controller: ['$scope', function($scope) {
          $scope.showExtended = false;

          $scope.toggleExtended = function() {
            $scope.showExtended = !$scope.showExtended;
          };
        }],
        compile: function() {
          return {
            post: function($scope, $element, $attrs, $controller, $transclude) {
              $transclude($scope, function(clone) {
                $element.find('div.fabric').append(clone.siblings('graph-new-entity').addBack());
                $element.find('ul').append(clone.siblings('graph-existing-entities'));
              });
            }
          };
        }
      };
    }
  ]);
