'use strict';
angular.module('angular-jointjs-graph')
  .factory('JointChartNode', ['JointResourceModel', 'FactoryMap', 'GraphHelpers', 'JointGraphResources',
    function(JointResourceModel, FactoryMap, GraphHelpers, JointGraphResources) {
      function getFactory(entityAttributes) {
        if (entityAttributes[GraphHelpers.getModelIdKey()] === 'undefined') {
          var entityIdentifier = entityAttributes.entityIdentifier,
              configObject = FactoryMap.get(entityIdentifier) || {};

          configObject.resource = JointGraphResources.get().entities[entityIdentifier];
          return JointResourceModel.forNewEntity(configObject);
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
