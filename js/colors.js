(function (App) {
  'use strict';
  const COLORS = [
    '#9ec5fe', '#f9b4ab', '#a7e3c1', '#f6d365', '#c4b5fd', '#f7b267',
    '#83d3e2', '#ffafcc', '#b8de6f', '#d8b4fe', '#ffd6a5', '#90dbf4',
    '#bde0fe', '#caffbf', '#fdffb6', '#ffc6ff', '#a0c4ff', '#ffadad'
  ];
  App.colorForIndex = index => COLORS[index % COLORS.length];
})(window.LandAllocation = window.LandAllocation || {});
