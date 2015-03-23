'use strict';
angular.module('angular-jointjs-graph')
  .factory('JointNodeModel', ['$window',
    function($window) {
      var ModelConstructor;

      return {
        init: function(markup) {
          ModelConstructor = $window.joint.shapes.basic.Rect.extend({
            markup: markup,
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
          return ModelConstructor;
        }
      };
    }
  ]);
