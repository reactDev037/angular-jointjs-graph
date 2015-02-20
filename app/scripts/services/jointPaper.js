'use strict';
angular.module('angular-jointjs-graph')
  .service('JointPaper', ['$window', 'JointGraph', 'JointGraphConfig',
    function($window, jointGraph, JointGraphConfig) {
      var paper,
        selectedModelId;

      return {
        init: function($element) {
          paper = new $window.joint.dia.Paper({
            el: $element[0],
            width: '100%',
            height: '100%',
            gridSize: 1,
            model: jointGraph,
            interactive: { vertexAdd: false },
            perpendicularLinks: true
          });
        },
        getPaper: function() {
          return paper;
        },
        clearSelection: function() {
          if (selectedModelId) {
            var cell = jointGraph.getCell(selectedModelId);

            if (cell) {
              var view = paper.findViewByModel(cell);
              $window.V(view.el).removeClass('selected');
            }

            selectedModelId = null;
          }
        },
        selectCell: function(cellView) {
          $window.V(cellView.el).addClass('selected');
          selectedModelId = cellView.model.get('id');

          var backendModelParams = cellView.model.get('backendModelParams'),
            isChartNode = cellView.model.get('isChartNode') ? true : false,
            modelIdKey = JointGraphConfig.modelIdKey || 'id',
            backendModelId = backendModelParams[modelIdKey];

          return { backendModelId: backendModelId, selectedCellId: selectedModelId, isChartNode: isChartNode };
        },
        onSelectionChange: function(callback) {
          var self = this;

          paper.on('blank:pointerdown', function() {
            self.clearSelection();
            callback(null);
          });

          paper.on('cell:pointerclick', function(cellView) {
            self.clearSelection();
            callback(self.selectCell(cellView));
          });
        },
        onCellPositionChange: function(callback) {
          var downX, downY;

          paper.on('cell:pointerdown', function(cell, x, y) {
            downX = x;
            downY = y;
          });

          paper.on('cell:pointerup', function(cell, x, y) {
            if (downX && downY) {
              var deltaX = Math.abs(downX - x),
                deltaY = Math.abs(downY - y);

              if (deltaX > 10 || deltaY > 10) {
                callback();
              }

              downX = null;
              downY = null;
            }
          });
        }
      };
    }
  ]);
