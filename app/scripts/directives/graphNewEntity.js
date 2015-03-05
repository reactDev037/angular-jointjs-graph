'use strict';
angular.module('angular-jointjs-graph')
  .directive('graphNewEntity', ['$compile',
    function($compile) {
      return {
        require: '^graph',
        restrict: 'E',
        templateUrl: 'angular-joints-graph/templates/graphNewEntity',
        transclude: true,
        link: function ($scope, $element, $attrs, $controller, $transclude) {
          var element = $element.find('.instance-template')[0],
            modelProperties = $controller.entityModelProperties();

          if (modelProperties) {
            _.each(modelProperties, function(property) {
              element.dataset[property] = undefined;
            });
          }

          element.dataset.entityIdentifier = $attrs.entityIdentifier;

          $transclude($scope, function (clone) {
            $element.children().first().append(clone);
          });

          return $compile($element.contents())($scope);
        }
      };
    }
  ]);
