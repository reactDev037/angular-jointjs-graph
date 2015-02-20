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
