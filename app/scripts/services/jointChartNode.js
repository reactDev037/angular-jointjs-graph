'use strict';
angular.module('angular-jointjs-graph')
  .factory('JointChartNode', ['$injector', 'JointResourceModel', 'FactoryMap',
    function($injector, JointResourceModel, FactoryMap) {
      function getFactory(entityAttributes) {
        if (entityAttributes.entityIdentifier) {
          return JointResourceModel.forNewEntity(FactoryMap.get(entityAttributes.entityIdentifier));
        } else {
          return JointResourceModel.forExistingEntity();
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
