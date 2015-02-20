'use strict';
angular.module('angular-jointjs-graph')
  .factory('JointElementView', ['$window', 'JointChartLink',
    function($window, JointChartLink) {
      function initElementView($container) {
        $window.joint.shapes.html.ElementView = $window.joint.dia.ElementView.extend({
          link: null,
          canUpdateLink: false,
          initialize: function () {
            $window.joint.dia.ElementView.prototype.initialize.apply(this, arguments);
          },
          render: function () {
            $window.joint.dia.ElementView.prototype.render.apply(this, arguments);

            this.findBySelector('.connection-port').on('mousedown', this.createLink.bind(this));

            var removeElementView = this.findBySelector('.remove-element');
            var self = this;

            removeElementView.on('mousedown', function(event) {
              // Prevent drag
              event.stopPropagation();
            });

            removeElementView.on('click', function(event) {
              _.each(self.paper.model.getConnectedLinks(self.model), function(link) {
                link.remove({ skipCallbacks: true });
              });
              self.model.remove();
              self.model.trigger('nodeRemoved', event, self.model);
            });
            removeElementView.on('mouseenter', function() { $(this).find('.cross').get(0).setAttribute('opacity', 1.0); });
            removeElementView.on('mouseleave', function() { $(this).find('.cross').get(0).setAttribute('opacity', 0.4); });

            this.paper.$el.mousemove(this.onMouseMove.bind(this));
            this.paper.$el.mouseup(this.onMouseUp.bind(this));
            return this;
          },
          createLink: function (evt) {
            var paperOffset = this.paper.$el.offset(),
              targetOffset = $(evt.target).offset(),
              x = targetOffset.left - paperOffset.left,
              y = targetOffset.top  - paperOffset.top;

            evt.stopPropagation();
            $window.V(this.el).addClass('source-view');

            this.model.trigger('createLinkStart');

            this.link = JointChartLink.create({
              source: {
                id: this.model.get('id')
              },
              target: $window.g.point(x, y)
            });
            this.paper.model.addCell(this.link);

            this.linkView = this.paper.findViewByModel(this.link);
            this.linkView.startArrowheadMove('target');

            this.link.on('change:target', function (link) {
              // we short-circuit the allowed function to avoid self-highlighting
              if (link.invalidTarget() || link.allowed()) {
                link.colorLinkAllowed();
                link.removeLinkLabels();
                link.removeForbiddenHighlight();
              } else {
                link.colorLinkForbidden();
                link.addLinkForbiddenLabel();
                link.addForbiddenHighlight();
              }
            });

            this.canUpdateLink = true;
          },
          onMouseUp: function (evt) {
            if (this.linkView) {
              this.link.addLinkMidpoint();

              $window.V(this.el).removeClass('source-view');

              // let the linkview deal with this event
              this.linkView.pointerup(evt, evt.clientX, evt.clientY);

              this.link.colorLinkCreated();

              this.link.removeForbiddenHighlight();

              if (this.link.allowed()) {
                this.model.trigger('createLinkEnd', this.link.id, this.link.get('target').id);
              } else {
                this.link.remove({ skipCallbacks: true });
              }

              delete this.linkView;
              this.model.trigger('batch:stop');
            }

            this.canUpdateLink = false;
            this.paper.$el.find('.component').css('z-index', 1);
          },
          onMouseMove: function (evt) {
            if (!this.link || !this.canUpdateLink || evt.clientX <= 10) {
              return;
            }

            if (this.linkView) {
              // let the linkview deal with this event
              this.linkView.pointermove(evt, evt.clientX, evt.clientY);
            }

            var containerOffset = $container[0].getBoundingClientRect();
            this.link.set('target', $window.g.point(evt.clientX - containerOffset.left,
                evt.clientY - containerOffset.top));
          }
        });
      }

      return {
        init: function($container) {
          initElementView($container);
        }
      };
    }
  ]);
