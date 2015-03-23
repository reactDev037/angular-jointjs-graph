'use strict';
angular.module('angular-jointjs-graph')
  .factory('GraphLinks', ['GraphHelpers',
    function(GraphHelpers) {
      var links = [];

      function getIdHash(graphModel) {
        var backendModelParams = graphModel.get('backendModelParams'),
            properties = {},
            modelIdKey = GraphHelpers.getModelIdKey();

        properties[modelIdKey] = backendModelParams[modelIdKey];
        return properties;
      }

      return {
        set: function(linksArray) {
          links = linksArray;
        },
        addSingle: function(entity) {
          links.push(entity);
        },
        getSingle: function(graphElement) {
          return _.findWhere(links, getIdHash(graphElement));
        },
        remove: function(graphElement) {
          _.remove(links, getIdHash(graphElement));
        }
      };
    }
  ]);
