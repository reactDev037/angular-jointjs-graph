'use strict';
angular.module('angular-jointjs-graph')
  .factory('JointChartNode', ['$injector',
    function($injector) {
      function getFactory(entityAttributes) {
        var factoryName = entityAttributes.factory;
        if ($injector.has(factoryName)) {
          delete entityAttributes.factory;
          return $injector.get(factoryName);
        } else {
          throw new Error('The factory required for creating the entity model is not defined');
        }
      }

      return {
        create: function(entityAttributes, dropPoint) {
          var Factory = getFactory(entityAttributes),
            params = {
              position: { x: dropPoint.x, y: dropPoint.y },
              backendModelParams: entityAttributes,
              options: { interactive: true },
              isChartNode: true
            };

          if ($injector.has('JointNodeParams')) {
            var ModelParams = $injector.get('JointNodeParams');
            angular.extend(params, ModelParams.get(entityAttributes));
          }

          return Factory.create(params);
        }
      };
    }
  ]);
