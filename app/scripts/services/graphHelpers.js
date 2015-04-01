'use strict';
angular.module('angular-jointjs-graph')
  .factory('GraphHelpers', ['$q', 'FactoryMap',
    function($q, FactoryMap) {
      function getProperties(identifier) {
        var Config = FactoryMap.get('JointGraphConfig'),
            modelIdKey,
            properties;

        if (Config) {
          modelIdKey = Config.modelIdKey || 'id';

          if (identifier) {
            properties = Config.entityModelProperties ?
              Config.entityModelProperties[identifier] : null;
          } else {
            properties = Config.linkModelProperties;
          }
        } else {
          modelIdKey = 'id';
          properties = null;
        }

        if (_.isArray(properties)) {
          properties.push(modelIdKey);
          return properties;
        } else {
          return [modelIdKey];
        }
      }

      function getModelIdKey() {
        var Config = FactoryMap.get('JointGraphConfig');
        return (Config && Config.modelIdKey) ? Config.modelIdKey : 'id';
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
