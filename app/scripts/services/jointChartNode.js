'use strict';
angular.module('angular-jointjs-graph')
  .factory('JointChartNode', ['$injector', 'JointResourceModel', 'FactoryMap', 'GraphHelpers',
    function($injector, JointResourceModel, FactoryMap, GraphHelpers) {
      function getFactory(entityAttributes) {
        if (entityAttributes[GraphHelpers.getModelIdKey()] === 'undefined') {
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

          angular.extend(params, FactoryMap.get('JointNodeParams').get(entityAttributes));

          return Factory.create(params);
        }
      };
    }
  ]);
