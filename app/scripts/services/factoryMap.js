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
          registerFactory(configFactoryName, 'JointGraphConfig');

          // This line is unguarded deliberately. A config factory must be provided by the user
          var Config = $injector.get(configFactoryName);

          registerFactory(Config.linkFactory, 'LinkFactory');
          registerFactory(Config.entityGraphParamsFactory, 'JointNodeParams');
          registerFactory(Config.linkGraphParamsFactory, 'JointLinkParams');

          _.each(Config.entityFactories, function(value, key) {
            registerFactory(value, key);
          });
        },
        get: function(nameOrAlias) {
          try {
            return $injector.get(factoriesMap[nameOrAlias], null);
          } catch(e) {
            return null;
          }
        }
      };
    }
  ]);
