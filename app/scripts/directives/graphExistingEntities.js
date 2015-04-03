'use strict';
angular.module('angular-jointjs-graph')
  .directive('graphExistingEntities', ['GraphEntities',
    function(GraphEntities) {
      return {
        require: '^graphSidePanelTools',
        restrict: 'E',
        templateUrl: 'angular-joints-graph/templates/graphExistingEntities',
        transclude: true,
        scope: true,
        controller: ['$scope', '$attrs', '$transclude',
          function($scope, $attrs, $transclude) {
            $scope.transcludeEntities = $transclude;

            $scope.entityIdentifier = $attrs.entityIdentifier;

            $scope.$on('graphResourcesLoaded', function() {
              $scope.entities = GraphEntities.getForType($scope.entityIdentifier);
            });

            $scope.removeEntity = function(entity) {
              $scope.$emit('removeEntity', { entity: entity, identifier: $scope.entityIdentifier });
            };
          }
        ]
      };
    }
  ]);
