'use strict';
angular.module('angular-jointjs-graph')
  .factory('JointChartLink', ['$injector', '$q', 'JointLinkDefaults', 'JointResourceModel', 'FactoryMap',
    function($injector, $q, JointLinkDefaults, JointResourceModel, FactoryMap) {
      function getProperties() {
        var Config = FactoryMap.get('JointGraphConfig'),
            modelIdKey = Config.modelIdKey,
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
          var Factory = JointResourceModel.forLink(FactoryMap.get('LinkFactory')),
              backendModelParams = {},
              properties = getProperties();

          _.each(properties, function(prop) {
            backendModelParams[prop] = 'undefined';
          });

          var defaults = {
            backendModelParams: backendModelParams,
            attrs: JointLinkDefaults.newLinkAttributes,
            isChartNode: false
          };

          return Factory.create(angular.extend(defaults, params));
        }
      };
    }
  ]);
