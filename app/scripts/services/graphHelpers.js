'use strict';
angular.module('angular-jointjs-graph')
  .factory('GraphHelpers', ['$q', 'FactoryMap',
    function($q, FactoryMap) {
      function getProperties(identifier) {
        var Config = FactoryMap.get('JointGraphConfig'),
            modelIdKey = getModelIdKey(),
            properties = identifier ?
              Config.entityModelProperties[identifier] :
              Config.linkModelProperties;

        if (_.isArray(properties)) {
          properties.push(modelIdKey);
          return properties;
        } else {
          return [modelIdKey];
        }
      }

      function getModelIdKey() {
        return FactoryMap.get('JointGraphConfig').modelIdKey || 'id';
      }

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
        getModelIdKey: getModelIdKey,
        entityProperties: function(identifier) {
          return getProperties(identifier);
        },
        linkProperties: function() {
          return getProperties();
        }
      };
    }
  ]);
