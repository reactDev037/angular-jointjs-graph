'use strict';
angular.module('angular-jointjs-graph')
  .factory('FactoryMap', ['$injector',
    function($injector) {
      var factoriesMap = {};

      function registerFactory(factoryName, alias) {
        factoriesMap[alias || factoryName] = factoryName;
      }

      return {
        registerFactories: function(configFactoryName) {
          if (configFactoryName) {
            registerFactory(configFactoryName, 'JointGraphConfig');

            // This line is unguarded deliberately. A config factory must be provided by the user
            var Config = $injector.get(configFactoryName);

            registerFactory(Config.linkCreationCallbacks, 'LinkFactory');
            registerFactory(Config.entityMarkupParams, 'JointNodeParams');
            registerFactory(Config.linkMarkupParams, 'JointLinkParams');

            _.each(Config.entityCreationCallbacks, function(value, key) {
              registerFactory(value, key);
            });
          }
        },
        get: function(nameOrAlias) {
          try {
            if (factoriesMap[nameOrAlias]) {
              return $injector.get(factoriesMap[nameOrAlias], null);
            } else {
              return null;
            }
          } catch(e) {
            return null;
          }
        }
      };
    }
  ]);
