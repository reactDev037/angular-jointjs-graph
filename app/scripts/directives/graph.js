'use strict';
angular.module('angular-jointjs-graph')
  .directive('graph', ['JointGraph', 'JointChartNode', 'JointElementView', 'JointNodeModel', 'JointPaper', 'JointNodeParams', 'FactoryMap', '$q',
    function(JointGraph, JointChartNode, JointElementView, JointNodeModel, JointPaper, JointNodeParams, FactoryMap, $q) {
      return {
        restrict: 'E',
        templateUrl: 'angular-joints-graph/templates/graph',
        transclude: true,
        controller: ['$scope', '$element', '$attrs',
          function($scope, $element, $attrs) {
            FactoryMap.register($attrs.configFactory, 'JointGraphConfig');

            var Config = FactoryMap.get('JointGraphConfig'),
                modelIdKey = Config.modelIdKey || 'id',
                self = this;

            FactoryMap.register(Config.linkFactory, 'LinkFactory');

            _.each(Config.entityFactories, function(value, key) {
              FactoryMap.register(value, key);
            });

            this.entityModelProperties = function() {
              var properties = Config.entityModelProperties;

              if (properties) {
                properties.push(modelIdKey);
                return properties;
              } else {
                return [modelIdKey];
              }
            };

            $scope.$on('graphResources', function(event, data) {
              var GraphClass = data.graph,
                EntitiesClass = data.entities,
                EntityRelationsClass = data.entityRelations,
                graphResource = new GraphClass(),
                successDeferred = $q.defer();

              graphResource.$get().then(function (graph) {
                $scope.graph = graph;
                EntitiesClass.query(function (entities) {
                  $scope.existingEntities = entities;
                  EntityRelationsClass.query(function (entityRelations) {
                    $scope.existingConnections = entityRelations;
                    successDeferred.resolve();
                  }, function (errData) {
                    successDeferred.reject(errData);
                  });
                }, function (errData) {
                  successDeferred.reject(errData);
                });
              }, function (errData) {
                successDeferred.reject(errData);
              });

              successDeferred.promise.then(function () {
                JointNodeModel.init($scope);
                JointElementView.init($element.find('.chartContainer'));
                JointPaper.init($element.find('.chartArea'));
                JointPaper.onSelectionChange(function (ids) {
                  handleSelection(ids);
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

                var graphContent = JSON.parse($scope.graph.content) || {};

                if (graphContent.cells) {
                  _.each(graphContent.cells, function (element) {
                    if (element.isChartNode) {
                      var properties = {};
                      properties[modelIdKey] = element.backendModelParams[modelIdKey];
                      _.findWhere($scope.existingEntities, properties).show = false;
                    }
                  });

                  JointGraph.addCells(graphContent.cells);
                }
              }, function (error) {
                $scope.$emit('applicationError', { errData: error });
              });
            });

            function getEntityModelValues(resource) {
              var values = {};

              _.each(self.entityModelProperties(), function(propertyKey) {
                values[propertyKey] = resource[propertyKey];
              });

              return values;
            }

            function setParamsForSelection() {
              var cell = JointGraph.getCell($scope.selection.selectedCellId),
                modelValues = getEntityModelValues($scope.selection.selectedResource);

              if (cell) {
                cell.attr(JointNodeParams.get(modelValues).attrs);
              }
            }

            _.each(this.entityModelProperties(), function(propertyKey) {
              $scope.$watch('selection.selectedResource.' + propertyKey, function(newValue, oldValue) {
                if (!oldValue || !$scope.selection) {
                  return;
                }

                setParamsForSelection();
              });
            });

            $scope.clearCellSelectionAndRevert = function() {
              JointPaper.clearSelection();
              handleSelection(null);
            };

            $scope.clearCellSelection = function() {
              JointPaper.clearSelection();
              $scope.selection = null;
            };

            $scope.revertEntity = function() {
              if ($scope.selection) {
                angular.copy($scope.selection.masterResource, $scope.selection.selectedResource);
                setParamsForSelection();
              }
            };

            $scope.syncEntity = function() {
              if ($scope.selection) {
                angular.copy($scope.selection.selectedResource, $scope.selection.masterResource);
              }
            };

            function handleSelection(selectedIds) {
              $scope.revertEntity();

              if (selectedIds) {
                var properties = {};
                properties[modelIdKey] = selectedIds.backendModelId;
                var entity = selectedIds.isChartNode ? _.findWhere($scope.existingEntities, properties) :
                  _.findWhere($scope.existingConnections, properties);

                $scope.selection = {
                  isChartNode: selectedIds.isChartNode,
                  selectedResource: entity,
                  selectedCellId: selectedIds.selectedCellId,
                  masterResource: angular.copy(entity)
                };
              } else {
                $scope.selection = null;
              }
            }

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
                $scope.clearCellSelectionAndRevert();
              });
            }

            function createLinkEnd(linkId) {
              var link = JointGraph.getCell(linkId);

              $scope.$apply(function() {
                link.createResource().then(function(linkEntity) {
                  $scope.existingConnections.push(linkEntity);
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
                var properties = {};
                properties[modelIdKey] = model.get('backendModelParams')[modelIdKey];

                var resource = _.findWhere($scope.existingEntities, properties),
                  selectedResource = $scope.selection ? $scope.selection.selectedResource : null;

                if (resource) {
                  resource.$remove().then(function() {
                    if (resource === selectedResource) {
                      $scope.clearCellSelection();
                    }

                    resource.show = true;
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
                var backendModelParams = cell.get('backendModelParams'),
                  properties = {},
                  linkResource;

                properties[modelIdKey] = backendModelParams[modelIdKey];
                linkResource = _.findWhere($scope.existingConnections, properties);

                if (linkResource) {
                  linkResource.$remove().then(function() {
                    _.remove($scope.existingConnections, properties);
                    $scope.saveGraph();
                  }, function(errData) {
                    $scope.$emit('applicationError', { errData: errData });
                  });
                }
              }
            }

            function updateResourceList(cellModel) {
              var deferred = $q.defer(),
                modelId = cellModel.get('backendModelParams')[modelIdKey];

              if (modelId === 'undefined') {
                cellModel.createResource().then(function(resource) {
                  resource.show = false;
                  $scope.existingEntities.unshift(resource);
                  deferred.resolve({ newNode: true });
                }, function(errData) {
                  deferred.reject(errData);
                });
              } else {
                var properties = {};
                properties[modelIdKey] = modelId;

                _.findWhere($scope.existingEntities, properties).show = false;
                deferred.resolve({ newNode: false });
              }

              return deferred.promise;
            }

            function highlightCell(cellModel) {
              var cellView = JointPaper.getPaper().findViewByModel(cellModel);
              JointPaper.clearSelection();
              handleSelection(JointPaper.selectCell(cellView));
            }

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
