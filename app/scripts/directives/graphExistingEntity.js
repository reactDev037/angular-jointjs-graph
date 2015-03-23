'use strict';
angular.module('angular-jointjs-graph')
  .directive('graphExistingEntity', ['GraphHelpers',
    function(GraphHelpers) {
      return {
        require: '^graphExistingEntities',
        restrict: 'A',
        link: function($scope, $element, $attrs) {
          var entityIdentifier = $attrs.graphExistingEntity,
              modelProperties = GraphHelpers.entityProperties(entityIdentifier),
              liElement = $element[0];

          if (modelProperties) {
            _.each(modelProperties, function(property) {
              liElement.dataset[property] = $scope.entity[property];

              $scope.$watch('entity.' + property, function(value) {
                liElement.dataset[property] = value;
              });
            });
          }

          liElement.dataset.entityIdentifier = entityIdentifier;

          $scope.transcludeEntities($scope, function(clone) {
            $element.append(clone);
          });
        }
      };
    }
  ]);
