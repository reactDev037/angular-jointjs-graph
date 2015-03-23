'use strict';
angular.module('angular-jointjs-graph')
  .factory('GraphHelpers', ['$q', 'FactoryMap',
    function($q, FactoryMap) {
      return {
        queryResource: function(resourceClass) {
          var deferred = $q.defer();

          resourceClass.query(function(response) {
            deferred.resolve(response);
          }, function(error) {
            deferred.reject(error);
          });

          return deferred.promise;
        },
        getModelIdKey: function() {
          return FactoryMap.get('JointGraphConfig').modelIdKey || 'id';
        },
        entityProperties: function(identifier) {
          var Config = FactoryMap.get('JointGraphConfig'),
              modelIdKey = this.getModelIdKey(),
              properties = Config.entityModelProperties[identifier];

          if (properties) {
            properties.push(modelIdKey);
            return properties;
          } else {
            return [modelIdKey];
          }
        }
      };
    }
  ]);
