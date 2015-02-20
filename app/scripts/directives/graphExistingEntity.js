'use strict';
angular.module('angular-jointjs-graph')
  .directive('graphExistingEntity', [
    function() {
      return {
        require: ['^graph', '^graphExistingEntities'],
        restrict: 'A',
        link: function($scope, $element, $attrs, $controller) {
          var modelProperties = $controller[0].entityModelProperties(),
            liElement = $element[0];

          if (modelProperties) {
            _.each(modelProperties, function(property) {
              liElement.dataset[property] = $scope.entity[property];

              $scope.$watch('entity.' + property, function(value) {
                liElement.dataset[property] = value;
              });
            });
          }

          liElement.dataset.factory = 'JointExistingModel';

          $controller[1].transclude($scope, function(clone) {
            $element.append(clone);
          });
        }
      };
    }
  ]);
