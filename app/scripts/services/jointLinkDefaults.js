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
