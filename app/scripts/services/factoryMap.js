'use strict';
angular.module('angular-jointjs-graph')
  .factory('FactoryMap', ['$injector',
    function($injector) {
      var factoriesMap = {};

      function registerFactory(factoryName, alias) {
        if ($injector.has(factoryName)) {
          factoriesMap[alias || factoryName] = factoryName;
        } else {
          throw new Error('Factory ' + factoryName + ' is not registered with any loaded module.' );
        }
      }

      return {
        registerFactories: function(configFactoryName) {
          registerFactory(configFactoryName, 'JointGraphConfig');

          var Config = $injector.get(configFactoryName);

          registerFactory(Config.linkFactory, 'LinkFactory');
          registerFactory(Config.entityGraphParamsFactory, 'JointNodeParams');
          registerFactory(Config.linkGraphParamsFactory, 'JointLinkParams');

          _.each(Config.entityFactories, function(value, key) {
            registerFactory(value, key);
          });
        },
        get: function(nameOrAlias) {
          return $injector.get(factoriesMap[nameOrAlias], null);
        }
      };
    }
  ]);
