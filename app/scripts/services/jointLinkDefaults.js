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
              text: '  Cannot create link to beneficiary  '
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
