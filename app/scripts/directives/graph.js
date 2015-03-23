'use strict';
angular.module('angular-jointjs-graph')
  .directive('graph', ['JointGraph', 'JointChartNode', 'JointElementView', 'JointNodeModel', 'JointPaper', '$q', 'GraphHelpers', 'GraphEntities', 'GraphLinks', 'GraphSelection', 'FactoryMap',
    function(JointGraph, JointChartNode, JointElementView, JointNodeModel, JointPaper, $q, GraphHelpers, GraphEntities, GraphLinks, GraphSelection, FactoryMap) {
      return {
        restrict: 'E',
        templateUrl: 'angular-joints-graph/templates/graph',
        transclude: true,
        controller: ['$scope', '$element', '$attrs',
          function($scope, $element, $attrs) {
            $scope.$on('graphResources', function(event, data) {
              var GraphClass = data.graph,
                  graphResource = new GraphClass();

              graphResource.$get().then(function(graph) {
                $scope.graph = graph;
                return $q.all(_.object(_.map(data.entities, function(resource, identifier) {
                  return [identifier, GraphHelpers.queryResource(resource)];
                })));
              }).then(function(entitiesMap) {
                GraphEntities.set(entitiesMap);
                $scope.$broadcast('graphEntitiesLoaded', entitiesMap);
                return GraphHelpers.queryResource(data.entityRelations);
              }).then(function(entityRelations) {
                GraphLinks.set(entityRelations);
                $scope.$broadcast('graphLinksLoaded', entityRelations);
              }).then(function() {
                $scope.$broadcast('graphResourcesLoaded');
                initGraph();
              }, function(error) {
                $scope.$emit('applicationError', { errData: error });
              });
            });

            function initGraph() {
              JointNodeModel.init($element.find('.graph-node-template')[0].outerHTML);
              JointElementView.init($element.find('.chartContainer'));
              JointPaper.init($element.find('.chartArea'));
              JointPaper.onSelectionChange(function (ids) {
                GraphSelection.select(ids);
                $scope.$digest();
              });
              JointPaper.onCellPositionChange(function () {
                $scope.saveGraph();
              });

              JointGraph.on('add', function (cell) {
                if (cell.get('isChartNode')) {
                  cell.on('createLinkStart', createLinkStart);
                  cell.on('createLinkEnd', createLinkEnd);
                  cell.on('nodeRemoved', nodeRemoved);
                } else {
                  cell.on('remove', linkRemoved);
                }
              });

              addGraphCells();
            }

            function addGraphCells() {
              var graphContent = JSON.parse($scope.graph.content) || {};

              if (graphContent.cells) {
                _.each(graphContent.cells, function (element) {
                  if (element.isChartNode) {
                    GraphEntities.markPresentOnGraph(element);
                  }
                });

                JointGraph.addCells(graphContent.cells);
              }
            }

            $scope.clearCellSelectionAndRevert = function() {
              GraphSelection.clearAndRevert();
            };

            $scope.revertEntity = function() {
              GraphSelection.revertSelection();
            };

            $scope.syncEntity = function() {
              GraphSelection.syncSelection();
            };

            $scope.selectEntity = function(entity, identifier) {
              GraphSelection.selectEntity(entity, identifier);
            };

            $scope.saveGraph = function() {
              setTimeout(function() {
                $scope.graph.content = JSON.stringify(JointGraph.toJSON());
                $scope.graph.$update().catch(function(data) {
                  $scope.$emit('applicationError', { errData: data });
                });
              }, 0);
            };

            function createLinkStart() {
              $scope.$apply(function() {
                GraphSelection.clearAndRevert();
              });
            }

            function createLinkEnd(linkId) {
              var link = JointGraph.getCell(linkId);

              $scope.$apply(function() {
                link.createResource().then(function(linkEntity) {
                  GraphLinks.addSingle(linkEntity);
                  $scope.saveGraph();
                }, function(data) {
                  $scope.$emit('applicationError', { errData: data });
                  link.remove({ skipCallbacks: true });
                });
              });
            }

            function nodeRemoved(event, model) {
              event.preventDefault();

              $scope.$apply(function() {
                var resource = GraphEntities.getSingle(model),
                    selectedResource = GraphSelection.getSelectedEntity();

                if (resource) {
                  resource.$remove().then(function() {
                    if (resource === selectedResource) {
                      GraphSelection.clear();
                    }

                    GraphEntities.markRemovedFromGraph(model);
                    $scope.saveGraph();
                  }, function(errData) {
                    $scope.$emit('applicationError', { errData: errData });
                  });
                }
              });
            }

            function linkRemoved(cell, models, options) {
              if (options && options.skipCallbacks) {
                //Link is removed because of invalid target or removed source/target
              } else {
                var linkResource = GraphLinks.getSingle(cell);

                if (linkResource) {
                  linkResource.$remove().then(function() {
                    GraphLinks.remove(cell);
                    $scope.saveGraph();
                  }, function(errData) {
                    $scope.$emit('applicationError', { errData: errData });
                  });
                }
              }
            }

            function updateResourceList(cellModel) {
              var deferred = $q.defer(),
                  modelId = cellModel.get('backendModelParams')[GraphHelpers.getModelIdKey()];

              if (modelId === 'undefined') {
                cellModel.createResource().then(function(resource) {
                  GraphEntities.addSingle(cellModel, resource);
                  deferred.resolve({ newNode: true });
                }, function(errData) {
                  deferred.reject(errData);
                });
              } else {
                GraphEntities.markPresentOnGraph(cellModel);
                deferred.resolve({ newNode: false });
              }

              return deferred.promise;
            }

            function highlightCell(cellModel) {
              var cellView = JointPaper.getPaper().findViewByModel(cellModel);
              JointPaper.clearSelection();
              GraphSelection.select(JointPaper.selectCell(cellView));
            }

            FactoryMap.registerFactories($attrs.configFactory);
            GraphSelection.onSelectionChange(function(selection) {
              $scope.$broadcast('graphSelection', selection);
            });

            $scope.handleDrop = function(entityAttributes, dropPoint) {
              $scope.$apply(function() {
                var rect = JointChartNode.create(entityAttributes, dropPoint);
                JointGraph.addCell(rect);
                updateResourceList(rect).then(function(data) {
                    if(data.newNode) {
                      highlightCell(rect);
                    }

                    $scope.saveGraph();
                  },
                  function(data) {
                    $scope.$emit('applicationError', { errData: data });
                    rect.remove();
                  });
              });
            };
          }
        ]
      };
    }
  ]);
