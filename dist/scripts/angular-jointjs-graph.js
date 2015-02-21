'use strict';
angular.module('angular-jointjs-graph', ['ngResource', 'angular-jointjs-graph/templates']);

angular.module('angular-jointjs-graph/templates', [])
  .run(['$templateCache',
    function($templateCache) {
      $templateCache.put('angular-joints-graph/templates/graph',
        '<div class="organogram">\n' +
          '<section class="chartContainer">\n' +
            '<div class="chartArea" droppable="handleDrop(entityAttributes, dropPoint)"></div>\n' +
            '<div ng-transclude></div>\n' +
          '</section>\n' +
        '</div>'
      );

      $templateCache.put('angular-joints-graph/templates/graphNode',
        '<g class="rotatable">\n' +
          '<g class="scalable">\n' +
            '<rect/>\n' +
          '</g>\n' +
          '<text class="name"/>\n' +
          '<text class="country"/>\n' +
          '<g transform="translate(110, 3)">\n' +
            '<text class="icon beneficiary" style="font-family:ce-icons;fill:#E5EAEF;"/>\n' +
            '<text class="icon company" style="font-family:ce-icons;fill:#E5EAEF;"/>\n' +
          '</g>\n' +
          '<a class="connection-port" xlink:href="">\n' +
            '<path d="M0,0 30,0 30,38 0,38" style="fill:white;fill-opacity:0.0;"/>\n' +
            '<circle class="outer" cx="15" cy="19" r="6"/>\n' +
            '<circle class="inner" cx="15" cy="19" r="2.5"/>\n' +
          '</a>\n' +
          '<a class="remove-element" xlink:href="">\n' +
            '<path d="M220,0 260,0 260,38 220,38" style="fill:white;fill-opacity:0.0;"/>\n' +
            '<path class="cross" transform="translate(235, 15)" opacity="0.4" d="M0,0 L10,10 M10,0 L0,10"/>\n' +
          '</a>\n' +
        '</g>'
      );

      $templateCache.put('angular-joints-graph/templates/graphSidePanelTools',
        '<div class="graph-tools">\n' +
          '<div class="basic">\n' +
            '<div class="intro">Drag to create new</div>\n' +
            '<div class="fabric"></div>\n' +
          '</div>\n' +
          '<a href="" class="switch" ng-click="toggleExtended()">\n' +
            'or choose from existing\n' +
            '<i class="ce-icon-caret-down" ng-class="showExtended ? \'rotated\' : \'\'"></i>\n' +
          '</a>\n' +
          '<div class="extended" ng-show="showExtended">\n' +
            '<ul class="listing"></ul>\n' +
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
        '<li ng-repeat="entity in existingEntities" ng-show="entity.show" draggable graph-existing-entity></li>'
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
  .directive('droppable', ['$window', '$parse',
    function ($window, $parse) {
      return {
        link: function (scope, element, attrs) {
          if (!attrs.droppable) {
            throw new Error('Directive requires a function call expression as argument');
          }

          var dropFunction = $parse(attrs.droppable),
            el = element[0];

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

            dropFunction(scope, { entityAttributes: entityAttributes, dropPoint: dropPoint });
          });
        }
      };
    }
  ]);

'use strict';
angular.module('angular-jointjs-graph')
  .directive('graph', ['JointGraph', 'JointChartNode', 'JointElementView', 'JointNodeModel', 'JointPaper', 'JointGraphConfig', 'JointNodeParams', '$q',
    function(JointGraph, JointChartNode, JointElementView, JointNodeModel, JointPaper, JointGraphConfig, JointNodeParams, $q) {
      return {
        restrict: 'E',
        templateUrl: 'angular-joints-graph/templates/graph',
        transclude: true,
        controller: ['$scope', '$element',
          function($scope, $element) {
            var modelIdKey = JointGraphConfig.modelIdKey || 'id',
              self = this;

            this.entityModelProperties = function() {
              var properties = JointGraphConfig.entityModelProperties;

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

                if ($scope.graph.cells) {
                  _.each($scope.graph.cells, function (element) {
                    if (element.isChartNode) {
                      var properties = {};
                      properties[modelIdKey] = element.backendModelParams[modelIdKey];
                      _.findWhere($scope.existingEntities, properties).show = false;
                    }
                  });

                  JointGraph.addCells($scope.graph.cells);
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

'use strict';
angular.module('angular-jointjs-graph')
  .directive('graphExistingEntities', [
    function() {
      return {
        require: '^graph',
        restrict: 'E',
        templateUrl: 'angular-joints-graph/templates/graphExistingEntities',
        transclude: true,
        controller: ['$attrs', '$transclude',
          function($attrs, $transclude) {
            this.transclude = $transclude;
          }
        ]
      };
    }
  ]);

'use strict';
angular.module('angular-jointjs-graph')
  .directive('graphExistingEntity', [
    function() {
      return {
        require: ['^graph', '^graphExistingEntities'],
        restrict: 'A',
        link: function($scope, $element, $attrs, $controller) {
          var modelProperties = $controller[0].entityModelProperties(),
            liElement = $element[0];

          if (modelProperties) {
            _.each(modelProperties, function(property) {
              liElement.dataset[property] = $scope.entity[property];

              $scope.$watch('entity.' + property, function(value) {
                liElement.dataset[property] = value;
              });
            });
          }

          liElement.dataset.factory = 'JointExistingModel';

          $controller[1].transclude($scope, function(clone) {
            $element.append(clone);
          });
        }
      };
    }
  ]);

'use strict';
angular.module('angular-jointjs-graph')
  .directive('graphNewEntity', ['$compile',
    function($compile) {
      return {
        require: '^graph',
        restrict: 'E',
        templateUrl: 'angular-joints-graph/templates/graphNewEntity',
        transclude: true,
        link: function ($scope, $element, $attrs, $controller, $transclude) {
          var element = $element.find('.instance-template')[0],
            modelProperties = $controller.entityModelProperties();

          if (modelProperties) {
            _.each(modelProperties, function(property) {
              element.dataset[property] = undefined;
            });
          }

          if ($attrs.factory) {
            element.dataset.factory = $attrs.factory;
          }

          $transclude($scope, function (clone) {
            $element.children().first().append(clone);
          });

          return $compile($element.contents())($scope);
        }
      };
    }
  ]);

'use strict';
angular.module('angular-jointjs-graph')
  .directive('graphSidePanelDetails', [
    function() {
      return {
        require: '^graph',
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
                $element.find('ul.listing').append(clone.siblings('graph-existing-entities'));
              });
            }
          };
        }
      };
    }
  ]);

'use strict';
angular.module('angular-jointjs-graph')
  .factory('JointChartLink', ['$injector', '$q', 'JointGraphConfig', 'JointLinkDefaults',
    function($injector, $q, JointGraphConfig, JointLinkDefaults) {
      function getFactory() {
        var factoryName = JointGraphConfig.linkFactory;
        if ($injector.has(factoryName)) {
          return $injector.get(factoryName);
        } else {
          throw new Error('The factory required for creating the link model is not defined');
        }
      }

      function getProperties() {
        var modelIdKey = JointGraphConfig.modelIdKey,
          properties = JointGraphConfig.linkModelProperties;

        if (properties) {
          properties.push(modelIdKey);
          return properties;
        } else {
          return [modelIdKey];
        }
      }

      return {
        create: function(params) {
          var Factory = getFactory(),
            backendModelParams = {};

          _.each(getProperties(), function(prop) {
            backendModelParams[prop] = undefined;
          });

          var defaults = {
            backendModelParams: backendModelParams,
            attrs: JointLinkDefaults.newLinkAttributes,
            isChartNode: false
          };

          return Factory.create(angular.extend(defaults, params));
        }
      };
    }
  ]);

'use strict';
angular.module('angular-jointjs-graph')
  .factory('JointChartNode', ['$injector',
    function($injector) {
      function getFactory(entityAttributes) {
        var factoryName = entityAttributes.factory;
        if ($injector.has(factoryName)) {
          delete entityAttributes.factory;
          return $injector.get(factoryName);
        } else {
          throw new Error('The factory required for creating the entity model is not defined');
        }
      }

      return {
        create: function(entityAttributes, dropPoint) {
          var Factory = getFactory(entityAttributes),
            params = {
              position: { x: dropPoint.x, y: dropPoint.y },
              backendModelParams: entityAttributes,
              options: { interactive: true },
              isChartNode: true
            };

          if ($injector.has('JointNodeParams')) {
            var ModelParams = $injector.get('JointNodeParams');
            angular.extend(params, ModelParams.get(entityAttributes));
          }

          return Factory.create(params);
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
                link.remove({ skipCallbacks: true });
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
              // we short-circuit the allowed function to avoid self-highlighting
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
  .factory('JointExistingModel', ['JointResourceModel',
    function(JointResourceModel) {
      return JointResourceModel.forExistingEntity();
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
  .factory('JointLinkDefaults', ['$injector',
    function($injector) {
      var values = {
        linkConnectionColorAllowed: '#66AC3F',
        linkMarkerColorAllowed: '#66AC3F',
        linkConnectionColorForbidden: '#C4434B',
        linkMarkerColorForbidden: '#C4434B',
        linkConnectionColorCreated: '#AAAAAA',
        linkMarkerColorCreated: '#AAAAAA',
        linkConnectionWidthCreated: 1,
        linkForbiddenCaption: '  Cannot create link to beneficiary  '
      };

      var defaults = {
        newLinkAttributes: {
          '.connection': {
            stroke: values.linkConnectionColorCreated,
            'stroke-width': 3
          },
          '.marker-target': {
            fill: values.linkMarkerColorCreated,
            'stroke-width': 0,
            d: 'M 10 0 L 0 5 L 10 10 z'
          },
          '.marker-source': {display: 'none'},
          '.marker-vertex-remove-area': {display: 'none'},
          '.marker-vertex-remove': {display: 'none'}
        },
        linkForbiddenLabel: {
          position: 0.5,
          attrs: {
            rect: {
              fill: values.linkConnectionColorForbidden,
              stroke: values.linkConnectionColorForbidden,
              'stroke-width': '5'
            },
            text: {
              fill: 'white',
              text: values.linkForbiddenCaption,
              'font-weight': 'normal'
            }
          }
        }
      };

      if ($injector.has('JointLinkParams')) {
        angular.extend(defaults, values, $injector.get('JointLinkParams'));
      }

      return defaults;
    }
  ]);

'use strict';
angular.module('angular-jointjs-graph')
  .factory('JointLinkModel', ['$window', 'JointPaper', 'JointLinkDefaults',
    function($window, JointPaper, JointLinkDefaults) {
      var LinkModel = $window.joint.dia.Link.extend();

      //Any methods that should be common to all node instances should be prototyped
      //on the new constructor class here.

      LinkModel.prototype.colorLinkAllowed = function() {
        this.attr('.connection/stroke', JointLinkDefaults.linkConnectionColorAllowed);
        this.attr('.marker-target/fill', JointLinkDefaults.linkMarkerColorAllowed);
      };

      LinkModel.prototype.colorLinkForbidden = function() {
        this.attr('.connection/stroke', JointLinkDefaults.linkConnectionColorForbidden);
        this.attr('.marker-target/fill', JointLinkDefaults.linkMarkerColorForbidden);
      };

      LinkModel.prototype.colorLinkCreated = function() {
        this.attr('.connection/stroke-width', JointLinkDefaults.linkConnectionWidthCreated);
        this.attr('.connection/stroke', JointLinkDefaults.linkConnectionColorCreated);
        this.attr('.marker-target/fill', JointLinkDefaults.linkMarkerColorCreated);
      };

      LinkModel.prototype.addLinkForbiddenLabel = function() {
        this.set('labels', [JointLinkDefaults.linkForbiddenLabel]);
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
        if (JointLinkDefaults.canCreateLink) {
          return JointLinkDefaults.canCreateLink.apply(null, getSourceAndTargetViews(this));
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

      return {
        getConstructor: function() {
          return LinkModel;
        }
      };
    }
  ]);

'use strict';
angular.module('angular-jointjs-graph')
  .factory('JointNodeModel', ['$window', '$compile', '$templateCache',
    function($window, $compile, $templateCache) {
      var ModelConstructor;

      return {
        init: function($scope) {
          ModelConstructor = $window.joint.shapes.basic.Rect.extend({
            markup: $compile($templateCache.get('angular-joints-graph/templates/graphNode'))($scope)[0].outerHTML,
            defaults: $window.joint.util.deepSupplement({
              // The corresponding html.ElementView is defined
              // in the JointElementView service.
              type: 'html.Element'
            }, $window.joint.shapes.basic.Rect.prototype.defaults)
          });

          //Any methods that should be common to all node instances should be prototyped
          //on the new ModelConstructor class here.

          $window.joint.shapes.html = {
            Element: ModelConstructor
          };
        },
        getConstructor: function() {
          if (_.isUndefined(ModelConstructor)) {
            throw new Error('Factory has not been initialized yet, use init($scope)');
          }

          return ModelConstructor;
        }
      };
    }
  ]);

'use strict';
angular.module('angular-jointjs-graph')
  .service('JointPaper', ['$window', 'JointGraph', 'JointGraphConfig',
    function($window, jointGraph, JointGraphConfig) {
      var paper,
        selectedModelId;

      return {
        init: function($element) {
          paper = new $window.joint.dia.Paper({
            el: $element[0],
            width: '100%',
            height: '100%',
            gridSize: 1,
            model: jointGraph,
            interactive: { vertexAdd: false },
            perpendicularLinks: true
          });
        },
        getPaper: function() {
          return paper;
        },
        clearSelection: function() {
          if (selectedModelId) {
            var cell = jointGraph.getCell(selectedModelId);

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
            modelIdKey = JointGraphConfig.modelIdKey || 'id',
            backendModelId = backendModelParams[modelIdKey];

          return { backendModelId: backendModelId, selectedCellId: selectedModelId, isChartNode: isChartNode };
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

      function createFactoryForExisting(JointModel, Resource, postDataFn, modelUpdateCallback) {
        if (_.isUndefined(Resource)) {
          throw new Error('A $resource class object is mandatory argument');
        }

        var Model = wrapModel(JointModel);
        Model.prototype.createResource = function() {
          var deferred = $q.defer(),
            postData = {},
            self = this;

          if (_.isFunction(postDataFn)) {
            postData = postDataFn(this);
          }

          Resource.save({}, postData, function(response) {
            var params = self.get('backendModelParams');

            _.each(params, function(value, key) {
              if (response.hasOwnProperty(key)) {
                params[key] = response[key];
              }
            });

            if (modelUpdateCallback) {
              modelUpdateCallback(self, response);
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
        forNewEntity: function(Resource, postDataFn, modelUpdateCallback) {
          return createFactoryForExisting(JointNodeModel, Resource, postDataFn, modelUpdateCallback);
        },
        forLink: function(Resource, postDataFn, modelUpdateCallback) {
          return createFactoryForExisting(JointLinkModel, Resource, postDataFn, modelUpdateCallback);
        }
      };
    }
  ]);
