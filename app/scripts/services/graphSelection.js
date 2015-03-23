'use strict';
angular.module('angular-jointjs-graph')
  .factory('GraphSelection', ['JointGraph', 'JointPaper', 'GraphHelpers', 'GraphEntities', 'GraphLinks', 'FactoryMap',
    function(JointGraph, JointPaper, GraphHelpers, GraphEntities, GraphLinks, FactoryMap) {
      var selection,
          selectionChangeCallback;

      function updateSelectedEntity() {
        var cell = JointGraph.getCell(selection.selectedCellId);

        if (cell) {
          var entityIdentifier = cell.get('backendModelParams').entityIdentifier,
            modelValues = {};

          _.each(GraphHelpers.entityProperties(entityIdentifier), function(propertyKey) {
            modelValues[propertyKey] = selection.selectedResource[propertyKey];
          });

          cell.attr(FactoryMap.get('JointNodeParams').get(modelValues).attrs);
        }
      }

      function notifySelectionChange() {
        if (_.isFunction(selectionChangeCallback)) {
          selectionChangeCallback(selection);
        }
      }

      return {
        onSelectionChange: function(callback) {
          selectionChangeCallback = callback;
        },
        select: function(selectedIds) {
          this.revertSelection();

          if (selectedIds) {
            var cell = JointGraph.getCell(selectedIds.selectedCellId),
                entity = selectedIds.isChartNode ?
                  GraphEntities.getSingle(cell) :
                  GraphLinks.getSingle(cell);

            selection = {
              isChartNode: selectedIds.isChartNode,
              selectedResource: entity,
              selectedCellId: selectedIds.selectedCellId,
              masterResource: angular.copy(entity)
            };
          } else {
            selection = null;
          }

          notifySelectionChange();
        },
        selectEntity: function(entity, identifier) {
          this.select({
            backendModelId: entity[GraphHelpers.getModelIdKey()],
            selectedCellId: GraphEntities.jointModelId(identifier, entity),
            isChartNode: true,
            entityIdentifier: identifier
          });
        },
        getSelectedEntity: function() {
          return selection ? selection.selectedResource : null;
        },
        revertSelection: function() {
          if (selection) {
            angular.copy(selection.masterResource, selection.selectedResource);
            updateSelectedEntity();
            notifySelectionChange();
          }
        },
        syncSelection: function() {
          if (selection) {
            angular.copy(selection.selectedResource, selection.masterResource);
            updateSelectedEntity();
            notifySelectionChange();
          }
        },
        clear: function() {
          JointPaper.clearSelection();
          selection = null;
          notifySelectionChange();
        },
        clearAndRevert: function() {
          JointPaper.clearSelection();
          if (selection) {
            angular.copy(selection.masterResource, selection.selectedResource);
            updateSelectedEntity();
          }
          selection = null;
          notifySelectionChange();
        }
      };
    }
  ]);
