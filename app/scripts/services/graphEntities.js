'use strict';
angular.module('angular-jointjs-graph')
  .factory('GraphEntities', ['GraphHelpers',
    function(GraphHelpers) {
      var entities = {},
          entityToJointModelMap = {};

      function getIdHash(uniqueId) {
        var properties = {},
            modelIdKey = GraphHelpers.getModelIdKey();

        properties[modelIdKey] = uniqueId;
        return properties;
      }

      function getIdentifiers(graphModel) {
        var backendModelParams = graphModel.backendModelParams || graphModel.get('backendModelParams'),
            typeIdentifier = backendModelParams.entityIdentifier,
            modelIdKey = GraphHelpers.getModelIdKey(),
            uniqueId = backendModelParams[modelIdKey];

        return { typeIdentifier: typeIdentifier, uniqueId: uniqueId };
      }

      return {
        set: function(entitiesMap) {
          _.each(entitiesMap, function(value, identifier) {
            entities[identifier] = value;
            entityToJointModelMap[identifier] = {};
          });
        },
        addSingle: function(graphElement, entity) {
          var ids = getIdentifiers(graphElement);

          entity.show = false;
          entityToJointModelMap[ids.typeIdentifier][ids.uniqueId] = graphElement.id;
          entities[ids.typeIdentifier].unshift(entity);
        },
        getSingle: function(graphElement) {
          var ids = getIdentifiers(graphElement);
          return _.findWhere(entities[ids.typeIdentifier], getIdHash(ids.uniqueId));
        },
        getForType: function(identifier) {
          return entities[identifier];
        },
        markPresentOnGraph: function(graphElement) {
          var ids = getIdentifiers(graphElement);

          entityToJointModelMap[ids.typeIdentifier][ids.uniqueId] = graphElement.id;
          _.findWhere(entities[ids.typeIdentifier], getIdHash(ids.uniqueId)).show = false;
        },
        markRemovedFromGraph: function(graphElement) {
          var ids = getIdentifiers(graphElement);

          delete entityToJointModelMap[ids.typeIdentifier][ids.uniqueId];
          _.findWhere(entities[ids.typeIdentifier], getIdHash(ids.uniqueId)).show = true;
        },
        jointModelId: function(typeIdentifier, entity) {
          return entityToJointModelMap[typeIdentifier][entity[GraphHelpers.getModelIdKey()]];
        }
      };
    }
  ]);