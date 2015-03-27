'use strict';
angular.module('angular-jointjs-graph')
  .factory('JointChartLink', ['$q', 'JointLinkDefaults', 'JointResourceModel', 'FactoryMap', 'GraphHelpers', 'JointGraphResources',
    function($q, JointLinkDefaults, JointResourceModel, FactoryMap, GraphHelpers, JointGraphResources) {
      function getProperties() {
        var Config = FactoryMap.get('JointGraphConfig'),
            modelIdKey = GraphHelpers.getModelIdKey(),
            properties = Config.linkModelProperties;

        if (properties) {
          properties.push(modelIdKey);
          return properties;
        } else {
          return [modelIdKey];
        }
      }

      return {
        create: function(params) {
          var configObject = FactoryMap.get('LinkFactory') || {};
          configObject.resource = JointGraphResources.get().entityRelations;

          var Factory = JointResourceModel.forLink(configObject),
              backendModelParams = {},
              properties = getProperties();

          _.each(properties, function(prop) {
            backendModelParams[prop] = 'undefined';
          });

          var defaults = {
            backendModelParams: backendModelParams,
            attrs: JointLinkDefaults.get().newLinkAttributes,
            isChartNode: false
          };

          return Factory.create(angular.extend(defaults, params));
        }
      };
    }
  ]);
