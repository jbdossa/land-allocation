(function (App) {
  'use strict';

  App.PLOT_IDS = [
    ...Array.from({ length: 10 }, (_, i) => `L1-${String.fromCharCode(97 + i)}`),
    ...Array.from({ length: 19 }, (_, i) => `L2-${String.fromCharCode(97 + i)}`),
  ];

  App.EXCLUDED_PLOT_ID = 'L2-s';
  App.ALLOCATABLE_PLOT_IDS = App.PLOT_IDS.filter(id => id !== App.EXCLUDED_PLOT_ID);
  App.PLOTS = Object.fromEntries(App.PLOT_IDS.map(id => [id, {
    id,
    lot: id.slice(0, 2),
    label: id.split('-')[1],
    allocatable: id !== App.EXCLUDED_PLOT_ID,
  }]));

  /*
   * Logical positions used only to assess how practical an allocation is.
   * "lane" identifies one continuous vertical strip on the plan. "row"
   * represents the approximate vertical level. These values do not control
   * the SVG drawing and can later be refined with the final cadastral trace.
   */
  App.PLOT_LAYOUT = {};

  for (let i = 0; i < 10; i++) {
    const letter = String.fromCharCode(97 + i);
    App.PLOT_LAYOUT[`L1-${letter}`] = { lane: 0, row: i };
    App.PLOT_LAYOUT[`L2-${letter}`] = { lane: 1, row: i };
  }

  const rightRows = {
    s: 0,
    r: 1,
    q: 2,
    p: 3,
    o: 4,
    n: 6,
    m: 7,
    l: 8,
    k: 9,
  };

  for (const [letter, row] of Object.entries(rightRows)) {
    App.PLOT_LAYOUT[`L2-${letter}`] = { lane: 2, row };
  }
})(window.LandAllocation = window.LandAllocation || {});
