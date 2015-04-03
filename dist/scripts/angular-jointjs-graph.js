'use strict';
angular.module('angular-jointjs-graph', ['ngResource', 'angular-jointjs-graph/templates']);

angular.module('angular-jointjs-graph/templates', [])
  .run(['$templateCache',
    function($templateCache) {
      $templateCache.put('angular-joints-graph/templates/graph',
        '<div class="organogram">\n' +
          '<section class="chartContainer">\n' +
            '<div class="chartArea" droppable></div>\n' +
            '<div ng-transclude></div>\n' +
          '</section>\n' +
        '</div>'
      );

      $templateCache.put('angular-joints-graph/templates/graphNode',
        '<g class="graph-node-template">\n' +
          '<rect width="260" height="38"/>\n' +
          '<g ng-transclude></g>\n' +
          '<g class="connection-port">\n' +
            '<circle class="outer" cx="15" cy="19" r="6"/>\n' +
            '<circle class="inner" cx="15" cy="19" r="2.5"/>\n' +
          '</g>\n' +
          '<g class="remove-element">\n' +
            '<path class="cross" transform="translate(235, 15)" opacity="0.4" d="M0,0 L10,10 M10,0 L0,10"/>\n' +
          '</g>\n' +
        '</g>'
      );

      $templateCache.put('angular-joints-graph/templates/graphSidePanelTools',
        '<div class="graph-tools">\n' +
          '<div class="basic">\n' +
            '<div class="intro">Drag to create new</div>\n' +
            '<div class="fabric"></div>\n' +
          '</div>\n' +
          '<div class="switch-container" ng-click="toggleExtended()" extended="{{showExtended}}">\n' +
            '<div class="switch">\n' +
              'or choose from existing\n' +
              '<span ng-class="showExtended ? \'up\' : \'down\'"></span>\n' +
            '</div>\n' +
          '</div>' +
          '<div class="listing" ng-show="showExtended">\n' +
            '<ul></ul>\n' +
          '</div>\n' +
        '</div>'
      );

      $templateCache.put('angular-joints-graph/templates/graphSidePanelDetails',
        '<div ng-transclude></div>'
      );

      $templateCache.put('angular-joints-graph/templates/graphNewEntity',
        '<div class="instance-template" draggable></div>'
      );

      $templateCache.put('angular-joints-graph/templates/graphExistingEntities',
        '<li ng-repeat="entity in entities" ng-hide="entity.show == false" draggable graph-existing-entity="{{entityIdentifier}}">\n' +
          '<div class="remove-entity" ng-click="removeEntity(entity)">&times;</div>\n' +
        '</li>'
      );
    }
  ]);

'use strict';
angular.module('angular-jointjs-graph')
  .directive('draggable', ['$window',
    function ($window) {
      return function (scope, element) {
        var el = element[0];
        el.draggable = true;

        el.addEventListener('dragstart', function (e) {
          e.dataTransfer.effectAllowed = 'copy';
          e.dataTransfer.setData('entity-attributes', JSON.stringify(el.dataset));

          this.classList.add('drag');

          // We need to keep the pointer position relative to the element
          // being dragged in order to place it correctly on canvas.
          // The bounding rectangle takes page scroll position into account.
          var left = e.clientX - e.target.getBoundingClientRect().left,
            top  = e.clientY - e.target.getBoundingClientRect().top,
            offsetPoint = $window.g.point(left, top);
          e.dataTransfer.setData('pointer-offset', offsetPoint);
        });

        el.addEventListener('dragend', function () {
          this.classList.remove('drag');
        });
      };
    }
  ]);

'use strict';
angular.module('angular-jointjs-graph')
  .directive('droppable', ['$window',
    function ($window) {
      return {
        link: function (scope, element) {
          var el = element[0];

          el.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
          });

          el.addEventListener('drop', function(e) {
            e.stopPropagation();

            /*
             * This offset represents position of mouse pointer relative to the
             * element being dragged. We set its value when drag starts and keep
             * it in the event object. This offset is used to correctly position
             * newly created element – it should be right below the dragged element.
             */
            var pointerOffset = $window.g.point(e.dataTransfer.getData('pointer-offset')),
              elementOffset = element[0].getBoundingClientRect(),
              left = Math.floor(e.clientX - elementOffset.left - pointerOffset.x),
              top  = Math.floor(e.clientY - elementOffset.top - pointerOffset.y),
              dropPoint = $window.g.point(left, top),
              entityAttributes = JSON.parse(e.dataTransfer.getData('entity-attributes'));

            scope.$emit('graphDropEvent', { entityAttributes: entityAttributes, dropPoint: dropPoint });
          });
        }
      };
    }
  ]);

'use strict';
angular.module('angular-jointjs-graph')
  .directive('graph', ['JointGraph', 'JointChartNode', 'JointElementView', 'JointNodeModel', 'JointPaper', '$q', 'GraphHelpers', 'GraphEntities', 'GraphLinks', 'GraphSelection', 'FactoryMap', 'JointGraphResources',
    function(JointGraph, JointChartNode, JointElementView, JointNodeModel, JointPaper, $q, GraphHelpers, GraphEntities, GraphLinks, GraphSelection, FactoryMap, JointGraphResources) {
      return {
        restrict: 'E',
        templateUrl: 'angular-joints-graph/templates/graph',
        transclude: true,
        controller: ['$scope', '$element', '$attrs',
          function($scope, $element, $attrs) {
            $scope.$on('graphResources', function(event, data) {
              JointGraphResources.set(data);

              data.graph.$get().then(function(graph) {
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
                $scope.$broadcast('graphEntityRelationsLoaded', entityRelations);
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
              var graphContent = $scope.graph.content ?
                    JSON.parse($scope.graph.content) : {};

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

            $scope.revertSelection = function() {
              GraphSelection.revertSelection();
            };

            $scope.syncSelection = function() {
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
                  if (resource === selectedResource) {
                    GraphSelection.clear();
                  }

                  GraphEntities.markRemovedFromGraph(model);
                  $scope.saveGraph();
                }
              });
            }

            $scope.$on('removeEntity', function(event, data) {
              event.stopPropagation();
              data.entity.$remove().then(function() {
                GraphEntities.remove(data.entity, data.identifier);
              }, function(errData) {
                $scope.$emit('applicationError', { errData: errData });
              });
            });

            function linkRemoved(cell, models, options) {
              if (options && options.skipCallbacks) {
                //Link is removed because of invalid target
              } else {
                var linkResource = GraphLinks.getSingle(cell);

                if (linkResource) {
                  linkResource.$remove().then(function() {
                    GraphLinks.remove(cell);
                    if (options && options.skipGraphSave) {
                      //When removing a node, the nodeRemoved callback saves the graph
                    } else {
                      $scope.saveGraph();
                    }
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

            $scope.$on('graphDropEvent', function(event, data) {
              event.stopPropagation();
              $scope.$apply(function() {
                var rect = JointChartNode.create(data.entityAttributes, data.dropPoint);
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
            });
          }
        ]
      };
    }
  ]);

'use strict';
angular.module('angular-jointjs-graph')
  .directive('graphExistingEntities', ['GraphEntities',
    function(GraphEntities) {
      return {
        require: '^graphSidePanelTools',
        restrict: 'E',
        templateUrl: 'angular-joints-graph/templates/graphExistingEntities',
        transclude: true,
        scope: true,
        controller: ['$scope', '$attrs', '$transclude',
          function($scope, $attrs, $transclude) {
            $scope.transcludeEntities = $transclude;

            $scope.entityIdentifier = $attrs.entityIdentifier;

            $scope.$on('graphResourcesLoaded', function() {
              $scope.entities = GraphEntities.getForType($scope.entityIdentifier);
            });

            $scope.removeEntity = function(entity) {
              $scope.$emit('removeEntity', { entity: entity, identifier: $scope.entityIdentifier });
            };
          }
        ]
      };
    }
  ]);

'use strict';
angular.module('angular-jointjs-graph')
  .directive('graphExistingEntity', ['GraphHelpers',
    function(GraphHelpers) {
      return {
        require: '^graphExistingEntities',
        restrict: 'A',
        link: function($scope, $element, $attrs) {
          var entityIdentifier = $attrs.graphExistingEntity,
              modelProperties = GraphHelpers.entityProperties(entityIdentifier),
              liElement = $element[0];

          _.each(modelProperties, function(property) {
            liElement.dataset[property] = $scope.entity[property];

            $scope.$watch('entity.' + property, function(value) {
              liElement.dataset[property] = value;
            });
          });

          liElement.dataset.entityIdentifier = entityIdentifier;

          $scope.transcludeEntities($scope, function(clone) {
            $element.append(clone);
          });
        }
      };
    }
  ]);

'use strict';
angular.module('angular-jointjs-graph')
  .directive('graphNewEntity', ['GraphHelpers',
    function(GraphHelpers) {
      return {
        require: '^graphSidePanelTools',
        restrict: 'E',
        templateUrl: 'angular-joints-graph/templates/graphNewEntity',
        transclude: true,
        link: function ($scope, $element, $attrs, $controller, $transclude) {
          var element = $element.find('.instance-template'),
              entityIdentifier = $attrs.entityIdentifier,
              modelProperties  = GraphHelpers.entityProperties(entityIdentifier);

          if (modelProperties) {
            _.each(modelProperties, function(property) {
              element[0].dataset[property] = undefined;
            });
          }

          element[0].dataset.entityIdentifier = entityIdentifier;

          $transclude($scope, function (clone) {
            element.append(clone);
          });
        }
      };
    }
  ]);

'use strict';
angular.module('angular-jointjs-graph')
  .directive('graphNode', [
    function() {
      return {
        templateUrl: 'angular-joints-graph/templates/graphNode',
        templateNamespace: 'svg',
        restrict: 'E',
        transclude: true
      };
    }
  ]);

'use strict';
angular.module('angular-jointjs-graph')
  .directive('graphSidePanelDetails', [
    function() {
      return {
        require: '^graph',
        scope: true,
        restrict: 'E',
        templateUrl: 'angular-joints-graph/templates/graphSidePanelDetails',
        transclude: true
      };
    }
  ]);

'use strict';
angular.module('angular-jointjs-graph')
  .directive('graphSidePanelTools', [
    function() {
      return {
        require: '^graph',
        restrict: 'E',
        templateUrl: 'angular-joints-graph/templates/graphSidePanelTools',
        transclude: true,
        controller: ['$scope', function($scope) {
          $scope.showExtended = false;

          $scope.toggleExtended = function() {
            $scope.showExtended = !$scope.showExtended;
          };
        }],
        compile: function() {
          return {
            post: function($scope, $element, $attrs, $controller, $transclude) {
              $transclude($scope, function(clone) {
                $element.find('div.fabric').append(clone.siblings('graph-new-entity').addBack());
                $element.find('ul').append(clone.siblings('graph-existing-entities'));
              });
            }
          };
        }
      };
    }
  ]);

'use strict';
angular.module('angular-jointjs-graph')
  .factory('FactoryMap', ['$injector',
    function($injector) {
      var factoriesMap = {};

      function registerFactory(factoryName, alias) {
        factoriesMap[alias || factoryName] = factoryName;
      }

      return {
        registerFactories: function(configFactoryName) {
          if (configFactoryName) {
            registerFactory(configFactoryName, 'JointGraphConfig');

            // This line is unguarded deliberately. A config factory must be provided by the user
            var Config = $injector.get(configFactoryName);

            registerFactory(Config.linkCreationCallbacks, 'LinkFactory');
            registerFactory(Config.entityMarkupParams, 'JointNodeParams');
            registerFactory(Config.linkMarkupParams, 'JointLinkParams');

            _.each(Config.entityCreationCallbacks, function(value, key) {
              registerFactory(value, key);
            });
          }
        },
        get: function(nameOrAlias) {
          try {
            if (factoriesMap[nameOrAlias]) {
              return $injector.get(factoriesMap[nameOrAlias], null);
            } else {
              return null;
            }
          } catch(e) {
            return null;
          }
        }
      };
    }
  ]);

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
          var entity = _.findWhere(entities[ids.typeIdentifier], getIdHash(ids.uniqueId));

          if (entity) {
            entity.show = false;
          }
        },
        markRemovedFromGraph: function(graphElement) {
          var ids = getIdentifiers(graphElement);

          delete entityToJointModelMap[ids.typeIdentifier][ids.uniqueId];
          var entity = _.findWhere(entities[ids.typeIdentifier], getIdHash(ids.uniqueId));

          if (entity) {
            entity.show = true;
          }
        },
        jointModelId: function(typeIdentifier, entity) {
          return entityToJointModelMap[typeIdentifier][entity[GraphHelpers.getModelIdKey()]];
        },
        remove: function(entity, identifier) {
          var entityId = entity[GraphHelpers.getModelIdKey()],
              entityIndex = entities[identifier].indexOf(entity);

          delete entityToJointModelMap[identifier][entityId];
          entities[identifier].splice(entityIndex, 1);
        }
      };
    }
  ]);

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

'use strict';
angular.module('angular-jointjs-graph')
  .factory('GraphSelection', ['JointGraph', 'JointPaper', 'GraphHelpers', 'GraphEntities', 'GraphLinks', 'FactoryMap',
    function(JointGraph, JointPaper, GraphHelpers, GraphEntities, GraphLinks, FactoryMap) {
      var selection,
          selectionChangeCallback;

      function updateSelection() {
        var cell = JointGraph.getCell(selection.selectedCellId);

        if (cell) {
          var modelValues = {},
              isChartNode = cell.get('isChartNode'),
              paramsFactory = isChartNode ?
                FactoryMap.get('JointNodeParams') :
                FactoryMap.get('JointLinkParams');

          if (paramsFactory) {
            var properties = isChartNode ?
                GraphHelpers.entityProperties(selection.entityIdentifier) :
                GraphHelpers.linkProperties();

            _.each(properties, function(propertyKey) {
              modelValues[propertyKey] = selection.selectedResource[propertyKey];
            });

            var attributes = paramsFactory.get(modelValues).attrs;

            if (attributes) {
              cell.attr(attributes);
            }
          }
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
              masterResource: angular.copy(entity),
              entityIdentifier: selectedIds.entityIdentifier
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
            updateSelection();
            notifySelectionChange();
          }
        },
        syncSelection: function() {
          if (selection) {
            angular.copy(selection.selectedResource, selection.masterResource);
            updateSelection();
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
            updateSelection();
          }
          selection = null;
          notifySelectionChange();
        }
      };
    }
  ]);

'use strict';
angular.module('angular-jointjs-graph')
  .factory('JointChartLink', ['$q', 'JointLinkDefaults', 'JointResourceModel', 'FactoryMap', 'GraphHelpers', 'JointGraphResources',
    function($q, JointLinkDefaults, JointResourceModel, FactoryMap, GraphHelpers, JointGraphResources) {
      return {
        create: function(params) {
          var configObject = FactoryMap.get('LinkFactory') || {};
          configObject.resource = JointGraphResources.get().entityRelations;

          var Factory = JointResourceModel.forLink(configObject),
              backendModelParams = {},
              properties = GraphHelpers.linkProperties();

          _.each(properties, function(prop) {
            backendModelParams[prop] = 'undefined';
          });

          var defaults = {
            backendModelParams: backendModelParams,
            attrs: JointLinkDefaults.get(backendModelParams).attrs,
            isChartNode: false
          };

          return Factory.create(angular.extend(defaults, params));
        }
      };
    }
  ]);

'use strict';
angular.module('angular-jointjs-graph')
  .factory('JointChartNode', ['JointResourceModel', 'FactoryMap', 'GraphHelpers', 'JointGraphResources',
    function(JointResourceModel, FactoryMap, GraphHelpers, JointGraphResources) {
      function getFactory(entityAttributes) {
        if (entityAttributes[GraphHelpers.getModelIdKey()] === 'undefined') {
          var entityIdentifier = entityAttributes.entityIdentifier,
              configObject = FactoryMap.get(entityIdentifier) || {};

          configObject.resource = JointGraphResources.get().entities[entityIdentifier];
          return JointResourceModel.forNewEntity(configObject);
        } else {
          return JointResourceModel.forExistingEntity();
        }
      }

      return {
        create: function(entityAttributes, dropPoint) {
          var EntityFactory = getFactory(entityAttributes),
              ParamsFactory = FactoryMap.get('JointNodeParams'),
              params = {
                position: { x: dropPoint.x, y: dropPoint.y },
                backendModelParams: entityAttributes,
                options: { interactive: true },
                isChartNode: true
              };

          if (ParamsFactory) {
            angular.extend(params, ParamsFactory.get(entityAttributes));
          }

          return EntityFactory.create(params);
        }
      };
    }
  ]);

'use strict';
angular.module('angular-jointjs-graph')
  .factory('JointElementView', ['$window', 'JointChartLink',
    function($window, JointChartLink) {
      function initElementView($container) {
        $window.joint.shapes.html.ElementView = $window.joint.dia.ElementView.extend({
          link: null,
          canUpdateLink: false,
          initialize: function () {
            $window.joint.dia.ElementView.prototype.initialize.apply(this, arguments);
          },
          render: function () {
            $window.joint.dia.ElementView.prototype.render.apply(this, arguments);

            this.findBySelector('.connection-port').on('mousedown', this.createLink.bind(this));

            var removeElementView = this.findBySelector('.remove-element');
            var self = this;

            removeElementView.on('mousedown', function(event) {
              // Prevent drag
              event.stopPropagation();
            });

            removeElementView.on('click', function(event) {
              _.each(self.paper.model.getConnectedLinks(self.model), function(link) {
                link.remove({ skipGraphSave: true });
              });
              self.model.remove();
              self.model.trigger('nodeRemoved', event, self.model);
            });
            removeElementView.on('mouseenter', function() { $(this).find('.cross').get(0).setAttribute('opacity', 1.0); });
            removeElementView.on('mouseleave', function() { $(this).find('.cross').get(0).setAttribute('opacity', 0.4); });

            this.paper.$el.mousemove(this.onMouseMove.bind(this));
            this.paper.$el.mouseup(this.onMouseUp.bind(this));
            return this;
          },
          createLink: function (evt) {
            var paperOffset = this.paper.$el.offset(),
              targetOffset = $(evt.target).offset(),
              x = targetOffset.left - paperOffset.left,
              y = targetOffset.top  - paperOffset.top;

            evt.stopPropagation();
            $window.V(this.el).addClass('source-view');

            this.model.trigger('createLinkStart');

            this.link = JointChartLink.create({
              source: {
                id: this.model.get('id')
              },
              target: $window.g.point(x, y)
            });
            this.paper.model.addCell(this.link);

            this.linkView = this.paper.findViewByModel(this.link);
            this.linkView.startArrowheadMove('target');

            this.link.on('change:target', function (link) {
              // we short-circuit the allowed function to avoid highlighting self as forbidden
              if (link.invalidTarget() || link.allowed()) {
                link.colorLinkAllowed();
                link.removeLinkLabels();
                link.removeForbiddenHighlight();
              } else {
                link.colorLinkForbidden();
                link.addLinkForbiddenLabel();
                link.addForbiddenHighlight();
              }
            });

            this.canUpdateLink = true;
          },
          onMouseUp: function (evt) {
            if (this.linkView) {
              this.link.addLinkMidpoint();

              $window.V(this.el).removeClass('source-view');

              // let the linkview deal with this event
              this.linkView.pointerup(evt, evt.clientX, evt.clientY);

              this.link.colorLinkCreated();

              this.link.removeForbiddenHighlight();

              if (this.link.allowed()) {
                this.model.trigger('createLinkEnd', this.link.id, this.link.get('target').id);
              } else {
                this.link.remove({ skipCallbacks: true });
              }

              delete this.linkView;
              this.model.trigger('batch:stop');
            }

            this.canUpdateLink = false;
            this.paper.$el.find('.component').css('z-index', 1);
          },
          onMouseMove: function (evt) {
            if (!this.link || !this.canUpdateLink || evt.clientX <= 10) {
              return;
            }

            if (this.linkView) {
              // let the linkview deal with this event
              this.linkView.pointermove(evt, evt.clientX, evt.clientY);
            }

            var containerOffset = $container[0].getBoundingClientRect();
            this.link.set('target', $window.g.point(evt.clientX - containerOffset.left,
                evt.clientY - containerOffset.top));
          }
        });
      }

      return {
        init: function($container) {
          initElementView($container);
        }
      };
    }
  ]);

'use strict';
angular.module('angular-jointjs-graph')
  .factory('JointGraph', ['$window',
    function($window) {
      return new $window.joint.dia.Graph();
    }
  ]);

'use strict';
angular.module('angular-jointjs-graph')
  .factory('JointGraphResources', [
    function() {
      var resources;

      return {
        set: function(resourcesObj) {
          resources = resourcesObj;
        },
        get: function() {
          return resources;
        }
      };
    }
  ]);

'use strict';
angular.module('angular-jointjs-graph')
  .factory('JointLinkDefaults', ['FactoryMap',
    function(FactoryMap) {
      var defaults = {
        attrs: {
          '.marker-target': {
            d: 'M 10 0 L 0 5 L 10 10 z'
          },
          '.marker-source': {display: 'none'},
          '.marker-vertex-remove-area': {display: 'none'},
          '.marker-vertex-remove': {display: 'none'}
        },
        linkForbiddenLabel: {
          position: 0.5,
          attrs: {
            text: {
              text: '  Link not allowed  '
            }
          }
        }
      };

      return {
        get: function(backendModelParams) {
          var paramsFactory = FactoryMap.get('JointLinkParams');

          if (paramsFactory) {
            angular.extend(defaults, paramsFactory.get(backendModelParams));
          }

          return defaults;
        }
      };
    }
  ]);

'use strict';
angular.module('angular-jointjs-graph')
  .factory('JointLinkModel', ['$window', 'JointPaper', 'JointLinkDefaults',
    function($window, JointPaper, JointLinkDefaults) {
      var LinkModel;

      function createModel() {
        if (LinkModel) {
          return LinkModel;
        }

        var linkDefaults = JointLinkDefaults.get();

        LinkModel = $window.joint.dia.Link.extend();
        //Any methods that should be common to all node instances should be prototyped
        //on the new constructor class here.

        LinkModel.prototype.colorLinkAllowed = function() {
          var selector = $window.V(JointPaper.getPaper().findViewByModel(this).el);
          selector.removeClass('forbidden');
          selector.addClass('allowed');
        };

        LinkModel.prototype.colorLinkForbidden = function() {
          var selector = $window.V(JointPaper.getPaper().findViewByModel(this).el);
          selector.removeClass('allowed');
          selector.addClass('forbidden');
        };

        LinkModel.prototype.colorLinkCreated = function() {
          var selector = $window.V(JointPaper.getPaper().findViewByModel(this).el);
          selector.removeClass('allowed');
          selector.removeClass('forbidden');
        };

        LinkModel.prototype.addLinkForbiddenLabel = function() {
          this.set('labels', [linkDefaults.linkForbiddenLabel]);
        };

        LinkModel.prototype.removeLinkLabels = function() {
          this.unset('labels');
        };

        function getSourceAndTargetViews(link) {
          var paper = JointPaper.getPaper(),
            linkView = paper.findViewByModel(link),
            sourceView = linkView.sourceView,
            targetView;

          if (linkView.targetView) {
            targetView = linkView.targetView;
          } else {
            var target = link.get('target');
            targetView = paper.findViewsFromPoint($window.g.point(target.x, target.y))[0];
          }

          return [sourceView, targetView];
        }

        LinkModel.prototype.toggleForbiddenHighlight = function(toggleOn) {
          _.each(getSourceAndTargetViews(this), function(view) {
            if (view) {
              var selector = $window.V(view.el),
                method = toggleOn ? selector.addClass : selector.removeClass;

              method.call(selector, 'nolink');
            }
          });
        };

        LinkModel.prototype.addForbiddenHighlight = function() {
          this.toggleForbiddenHighlight(true);
        };

        LinkModel.prototype.removeForbiddenHighlight = function() {
          this.toggleForbiddenHighlight(false);
        };

        LinkModel.prototype.addLinkMidpoint = function() {
          var linkView =JointPaper.getPaper().findViewByModel(this),
            vertexPoint = $window.g.line(
              $window.g.point(linkView.sourcePoint),
              $window.g.point(linkView.targetPoint)
            ).midpoint();

          this.set('vertices', [{
            x: vertexPoint.x,
            y: vertexPoint.y
          }]);
          this.attr('.marker-vertex/r', '5');
        };

        LinkModel.prototype.allowed = function() {
          if (this.invalidTarget()) {
            return false;
          }

          if (linkDefaults.canCreateLink) {
            return linkDefaults.canCreateLink.apply(null, getSourceAndTargetViews(this));
          } else {
            return true;
          }
        };

        LinkModel.prototype.invalidTarget = function() {
          var endViews = getSourceAndTargetViews(this),
            emptyTarget = !endViews[1],
            sameObject = endViews[0] === endViews[1];

          return emptyTarget || sameObject;
        };

        return LinkModel;
      }

      return {
        getConstructor: createModel
      };
    }
  ]);

'use strict';
angular.module('angular-jointjs-graph')
  .factory('JointNodeModel', ['$window',
    function($window) {
      var ModelConstructor;

      return {
        init: function(markup) {
          ModelConstructor = $window.joint.shapes.basic.Rect.extend({
            markup: markup,
            defaults: {
              // The corresponding html.ElementView is defined
              // in the JointElementView service.
              type: 'html.Element'
            }
          });

          //Any methods that should be common to all node instances should be prototyped
          //on the new ModelConstructor class here.

          $window.joint.shapes.html = {
            Element: ModelConstructor
          };
        },
        getConstructor: function() {
          return ModelConstructor;
        }
      };
    }
  ]);

'use strict';
angular.module('angular-jointjs-graph')
  .factory('JointPaper', ['$window', 'JointGraph', 'GraphHelpers',
    function($window, JointGraph, GraphHelpers) {
      var paper,
          selectedModelId;

      return {
        init: function($element) {
          paper = new $window.joint.dia.Paper({
            el: $element[0],
            width: '100%',
            height: '100%',
            gridSize: 1,
            model: JointGraph,
            interactive: { vertexAdd: false },
            perpendicularLinks: true
          });
        },
        getPaper: function() {
          return paper;
        },
        clearSelection: function() {
          if (selectedModelId) {
            var cell = JointGraph.getCell(selectedModelId);

            if (cell) {
              var view = paper.findViewByModel(cell);
              $window.V(view.el).removeClass('selected');
            }

            selectedModelId = null;
          }
        },
        selectCell: function(cellView) {
          $window.V(cellView.el).addClass('selected');
          selectedModelId = cellView.model.get('id');

          var backendModelParams = cellView.model.get('backendModelParams'),
            isChartNode = cellView.model.get('isChartNode') ? true : false,
            modelIdKey = GraphHelpers.getModelIdKey(),
            backendModelId = backendModelParams[modelIdKey],
            identifier = backendModelParams.entityIdentifier;

          return {
            backendModelId: backendModelId,
            selectedCellId: selectedModelId,
            isChartNode: isChartNode,
            entityIdentifier: identifier
          };
        },
        onSelectionChange: function(callback) {
          var self = this;

          paper.on('blank:pointerdown', function() {
            self.clearSelection();
            callback(null);
          });

          paper.on('cell:pointerclick', function(cellView) {
            self.clearSelection();
            callback(self.selectCell(cellView));
          });
        },
        onCellPositionChange: function(callback) {
          var downX, downY;

          paper.on('cell:pointerdown', function(cell, x, y) {
            downX = x;
            downY = y;
          });

          paper.on('cell:pointerup', function(cell, x, y) {
            if (downX && downY) {
              var deltaX = Math.abs(downX - x),
                deltaY = Math.abs(downY - y);

              if (deltaX > 10 || deltaY > 10) {
                callback();
              }

              downX = null;
              downY = null;
            }
          });
        }
      };
    }
  ]);

'use strict';
angular.module('angular-jointjs-graph')
  .factory('JointResourceModel', ['JointNodeModel', 'JointLinkModel', '$q',
    function(JointNodeModel, JointLinkModel, $q) {
      function wrapModel(JointModel) {
        var ModelConstructor = JointModel.getConstructor();

        //We need a wrapper model around the original constructor since we are going to conditionally
        //prototype methods on it that shouldn't be available on all model instances.
        function Model(params) {
          ModelConstructor.call(this, params);
        }

        Model.prototype = Object.create(ModelConstructor.prototype);
        Model.prototype.constructor = ModelConstructor;
        return Model;
      }

      function Factory(Model) {
        return {
          create: function(params) {
            return new Model(params);
          }
        };
      }

      function createFactoryForExisting(JointModel, configObject) {
        var Model = wrapModel(JointModel);
        Model.prototype.createResource = function() {
          var deferred = $q.defer(),
            postData = {},
            self = this;

          if (_.isFunction(configObject.postDataFn)) {
            postData = configObject.postDataFn(this);
          }

          configObject.resource.save({}, postData, function(response) {
            var params = self.get('backendModelParams');

            _.each(params, function(value, key) {
              if (response.hasOwnProperty(key)) {
                params[key] = response[key];
              }
            });

            if (_.isFunction(configObject.modelUpdateCallback)) {
              configObject.modelUpdateCallback(self, response);
            }

            deferred.resolve(response);
          }, function(errData) {
            deferred.reject(errData);
          });

          return deferred.promise;
        };

        return new Factory(Model);
      }

      return {
        forExistingEntity: function() {
          return new Factory(wrapModel(JointNodeModel));
        },
        forNewEntity: function(configObject) {
          return createFactoryForExisting(JointNodeModel, configObject);
        },
        forLink: function(configObject) {
          return createFactoryForExisting(JointLinkModel, configObject);
        }
      };
    }
  ]);
