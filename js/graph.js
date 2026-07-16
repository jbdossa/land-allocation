(function (App) {
  'use strict';

  App.connectedComponents = function (plotIds) {
    const allowed = new Set(plotIds);
    const seen = new Set();
    const components = [];

    for (const start of allowed) {
      if (seen.has(start)) continue;
      const stack = [start];
      const component = [];
      seen.add(start);

      while (stack.length) {
        const current = stack.pop();
        component.push(current);
        for (const neighbor of App.ADJACENCY[current] || []) {
          if (allowed.has(neighbor) && !seen.has(neighbor)) {
            seen.add(neighbor);
            stack.push(neighbor);
          }
        }
      }
      components.push(component);
    }
    return components;
  };

  App.countComponents = plotIds => App.connectedComponents(plotIds).length;
  App.isConnected = plotIds => plotIds.length <= 1 || App.countComponents(plotIds) === 1;
})(window.LandAllocation = window.LandAllocation || {});
