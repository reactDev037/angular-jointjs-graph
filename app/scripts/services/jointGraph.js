'use strict';
angular.module('angular-jointjs-graph')
  .factory('JointGraph', ['$window',
    function($window) {
      return new $window.joint.dia.Graph();
    }
  ]);
