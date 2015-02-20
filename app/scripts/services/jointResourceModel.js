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
