'use strict';
angular.module('angular-jointjs-graph')
  .factory('JointLinkModel', ['$window', 'JointPaper', 'JointLinkDefaults',
    function($window, JointPaper, JointLinkDefaults) {
      var LinkModel;

      function createModel() {
        if (LinkModel) {
          return LinkModel;
        }

        var linkDefaults = JointLinkDefaults.get();

        LinkModel = $window.joint.dia.Link.extend();
        //Any methods that should be common to all node instances should be prototyped
        //on the new constructor class here.

        LinkModel.prototype.colorLinkAllowed = function() {
          var selector = $window.V(JointPaper.getPaper().findViewByModel(this).el);
          selector.removeClass('forbidden');
          selector.addClass('allowed');
        };

        LinkModel.prototype.colorLinkForbidden = function() {
          var selector = $window.V(JointPaper.getPaper().findViewByModel(this).el);
          selector.removeClass('allowed');
          selector.addClass('forbidden');
        };

        LinkModel.prototype.colorLinkCreated = function() {
          var selector = $window.V(JointPaper.getPaper().findViewByModel(this).el);
          selector.removeClass('allowed');
          selector.removeClass('forbidden');
        };

        LinkModel.prototype.addLinkForbiddenLabel = function() {
          this.set('labels', [linkDefaults.linkForbiddenLabel]);
        };

        LinkModel.prototype.removeLinkLabels = function() {
          this.unset('labels');
        };

        function getSourceAndTargetViews(link) {
          var paper = JointPaper.getPaper(),
            linkView = paper.findViewByModel(link),
            sourceView = linkView.sourceView,
            targetView;

          if (linkView.targetView) {
            targetView = linkView.targetView;
          } else {
            var target = link.get('target');
            targetView = paper.findViewsFromPoint($window.g.point(target.x, target.y))[0];
          }

          return [sourceView, targetView];
        }

        LinkModel.prototype.toggleForbiddenHighlight = function(toggleOn) {
          _.each(getSourceAndTargetViews(this), function(view) {
            if (view) {
              var selector = $window.V(view.el),
                method = toggleOn ? selector.addClass : selector.removeClass;

              method.call(selector, 'nolink');
            }
          });
        };

        LinkModel.prototype.addForbiddenHighlight = function() {
          this.toggleForbiddenHighlight(true);
        };

        LinkModel.prototype.removeForbiddenHighlight = function() {
          this.toggleForbiddenHighlight(false);
        };

        LinkModel.prototype.addLinkMidpoint = function() {
          var linkView =JointPaper.getPaper().findViewByModel(this),
            vertexPoint = $window.g.line(
              $window.g.point(linkView.sourcePoint),
              $window.g.point(linkView.targetPoint)
            ).midpoint();

          this.set('vertices', [{
            x: vertexPoint.x,
            y: vertexPoint.y
          }]);
          this.attr('.marker-vertex/r', '5');
        };

        LinkModel.prototype.allowed = function() {
          if (this.invalidTarget()) {
            return false;
          }

          if (linkDefaults.canCreateLink) {
            return linkDefaults.canCreateLink.apply(null, getSourceAndTargetViews(this));
          } else {
            return true;
          }
        };

        LinkModel.prototype.invalidTarget = function() {
          var endViews = getSourceAndTargetViews(this),
            emptyTarget = !endViews[1],
            sameObject = endViews[0] === endViews[1];

          return emptyTarget || sameObject;
        };

        return LinkModel;
      }

      return {
        getConstructor: createModel
      };
    }
  ]);
