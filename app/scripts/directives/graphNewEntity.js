'use strict';
angular.module('angular-jointjs-graph')
  .directive('graphNewEntity', ['GraphHelpers',
    function(GraphHelpers) {
      return {
        require: '^graphSidePanelTools',
        restrict: 'E',
        templateUrl: 'angular-joints-graph/templates/graphNewEntity',
        transclude: true,
        link: function ($scope, $element, $attrs, $controller, $transclude) {
          var element = $element.find('.instance-template'),
              entityIdentifier = $attrs.entityIdentifier,
              modelProperties  = GraphHelpers.entityProperties(entityIdentifier);

          if (modelProperties) {
            _.each(modelProperties, function(property) {
              element[0].dataset[property] = undefined;
            });
          }

          element[0].dataset.entityIdentifier = entityIdentifier;

          $transclude($scope, function (clone) {
            element.append(clone);
          });
        }
      };
    }
  ]);
