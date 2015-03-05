'use strict';
angular.module('angular-jointjs-graph')
  .factory('FactoryMap', ['$injector',
    function($injector) {
      var factoriesMap = {};

      return {
        register: function(factoryName, alias) {
          if ($injector.has(factoryName)) {
            factoriesMap[alias || factoryName] = factoryName;
          } else {
            throw new Error('Factory ' + factoryName + ' is not registered with any loaded module.' );
          }
        },
        get: function(nameOrAlias) {
          return $injector.get(factoriesMap[nameOrAlias], null);
        }
      };
    }
  ]);
