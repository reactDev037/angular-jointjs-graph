'use strict';
angular.module('angular-jointjs-graph')
  .factory('JointChartLink', ['$injector', '$q', 'JointGraphConfig', 'JointLinkDefaults',
    function($injector, $q, JointGraphConfig, JointLinkDefaults) {
      function getFactory() {
        var factoryName = JointGraphConfig.linkFactory;
        if ($injector.has(factoryName)) {
          return $injector.get(factoryName);
        } else {
          throw new Error('The factory required for creating the link model is not defined');
        }
      }

      function getProperties() {
        var modelIdKey = JointGraphConfig.modelIdKey,
          properties = JointGraphConfig.linkModelProperties;

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
