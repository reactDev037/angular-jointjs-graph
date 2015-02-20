'use strict';
angular.module('angular-jointjs-graph')
  .factory('JointExistingModel', ['JointResourceModel',
    function(JointResourceModel) {
      return JointResourceModel.forExistingEntity();
    }
  ]);
