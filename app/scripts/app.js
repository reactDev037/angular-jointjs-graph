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
        '<li ng-repeat="entity in entities" ng-hide="entity.show == false" draggable graph-existing-entity="{{entityIdentifier}}"></li>'
      );
    }
  ]);
