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
        '<li ng-repeat="entity in existingEntities" ng-hide="entity.show == false" draggable graph-existing-entity></li>'
      );
    }
  ]);
