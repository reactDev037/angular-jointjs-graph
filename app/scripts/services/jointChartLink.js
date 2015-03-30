'use strict';
angular.module('angular-jointjs-graph')
  .factory('JointChartLink', ['$q', 'JointLinkDefaults', 'JointResourceModel', 'FactoryMap', 'GraphHelpers', 'JointGraphResources',
    function($q, JointLinkDefaults, JointResourceModel, FactoryMap, GraphHelpers, JointGraphResources) {
      return {
        create: function(params) {
          var configObject = FactoryMap.get('LinkFactory') || {};
          configObject.resource = JointGraphResources.get().entityRelations;

          var Factory = JointResourceModel.forLink(configObject),
              backendModelParams = {},
              properties = GraphHelpers.linkProperties();

          _.each(properties, function(prop) {
            backendModelParams[prop] = 'undefined';
          });

          var defaults = {
            backendModelParams: backendModelParams,
            attrs: JointLinkDefaults.get(backendModelParams).attrs,
            isChartNode: false
          };

          return Factory.create(angular.extend(defaults, params));
        }
      };
    }
  ]);
