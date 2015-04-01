'use strict';
angular.module('angular-jointjs-graph')
  .directive('droppable', ['$window',
    function ($window) {
      return {
        link: function (scope, element) {
          var el = element[0];

          el.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
          });

          el.addEventListener('drop', function(e) {
            e.stopPropagation();

            /*
             * This offset represents position of mouse pointer relative to the
             * element being dragged. We set its value when drag starts and keep
             * it in the event object. This offset is used to correctly position
             * newly created element – it should be right below the dragged element.
             */
            var pointerOffset = $window.g.point(e.dataTransfer.getData('pointer-offset')),
              elementOffset = element[0].getBoundingClientRect(),
              left = Math.floor(e.clientX - elementOffset.left - pointerOffset.x),
              top  = Math.floor(e.clientY - elementOffset.top - pointerOffset.y),
              dropPoint = $window.g.point(left, top),
              entityAttributes = JSON.parse(e.dataTransfer.getData('entity-attributes'));

            scope.$emit('graphDropEvent', { entityAttributes: entityAttributes, dropPoint: dropPoint });
          });
        }
      };
    }
  ]);
