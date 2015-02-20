'use strict';
angular.module('angular-jointjs-graph')
  .factory('JointLinkModel', ['$window', 'JointPaper', 'JointLinkDefaults',
    function($window, JointPaper, JointLinkDefaults) {
      var LinkModel = $window.joint.dia.Link.extend();

      //Any methods that should be common to all node instances should be prototyped
      //on the new constructor class here.

      LinkModel.prototype.colorLinkAllowed = function() {
        this.attr('.connection/stroke', JointLinkDefaults.linkConnectionColorAllowed);
        this.attr('.marker-target/fill', JointLinkDefaults.linkMarkerColorAllowed);
      };

      LinkModel.prototype.colorLinkForbidden = function() {
        this.attr('.connection/stroke', JointLinkDefaults.linkConnectionColorForbidden);
        this.attr('.marker-target/fill', JointLinkDefaults.linkMarkerColorForbidden);
      };

      LinkModel.prototype.colorLinkCreated = function() {
        this.attr('.connection/stroke-width', JointLinkDefaults.linkConnectionWidthCreated);
        this.attr('.connection/stroke', JointLinkDefaults.linkConnectionColorCreated);
        this.attr('.marker-target/fill', JointLinkDefaults.linkMarkerColorCreated);
      };

      LinkModel.prototype.addLinkForbiddenLabel = function() {
        this.set('labels', [JointLinkDefaults.linkForbiddenLabel]);
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
        if (JointLinkDefaults.canCreateLink) {
          return JointLinkDefaults.canCreateLink.apply(null, getSourceAndTargetViews(this));
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

      return {
        getConstructor: function() {
          return LinkModel;
        }
      };
    }
  ]);
