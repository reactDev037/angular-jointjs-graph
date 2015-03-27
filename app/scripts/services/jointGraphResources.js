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
