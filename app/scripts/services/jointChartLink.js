'use strict';
angular.module('angular-jointjs-graph')
  .factory('JointChartLink', ['$injector', '$q', 'JointLinkDefaults', 'FactoryMap',
    function($injector, $q, JointLinkDefaults, FactoryMap) {
      function getFactory() {
        var factoryName = FactoryMap.get('JointGraphConfig').linkFactory;

        if ($injector.has(factoryName)) {
          return $injector.get(factoryName);
        } else {
          throw new Error('The factory required for creating the link model is not defined');
        }
      }

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
          var Factory = getFactory(),
              backendModelParams = {};

          _.each(getProperties(), function(prop) {
            backendModelParams[prop] = undefined;
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
