(function (App) {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  function svgEl(name, attrs = {}) {
    const el = document.createElementNS(SVG_NS, name);
    for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, String(value));
    return el;
  }

  function rectPlot(id, x, y, w, h, label, skew = 0) {
    const points = skew
      ? `${x},${y} ${x+w},${y+skew} ${x+w},${y+h+skew} ${x},${y+h}`
      : `${x},${y} ${x+w},${y} ${x+w},${y+h} ${x},${y+h}`;
    return { id, points, cx: x + w / 2, cy: y + h / 2 + skew / 2, label };
  }

  function createGeometry() {
    const plots = [];
    const leftY = [72,132,192,252,312,372,432,492,552,612];
    leftY.forEach((y, i) => plots.push(rectPlot(`L1-${String.fromCharCode(97+i)}`, 56, y, 190, 56, String.fromCharCode(97+i), i < 2 ? -4 : 0)));

    const midY = [66,126,186,246,306,366,426,486,546,606];
    midY.forEach((y, i) => plots.push(rectPlot(`L2-${String.fromCharCode(97+i)}`, 296, y, 190, 56, String.fromCharCode(97+i), i < 5 ? 3 : 0)));

    const rightIds = ['s','r','q','p','o','n','m','l','k'];
    const rightY = [74,139,204,269,334,399,477,555,633];
    rightIds.forEach((letter, i) => {
      const h = i >= 5 ? 72 : 61;
      plots.push(rectPlot(`L2-${letter}`, 512, rightY[i], 185, h, letter, i < 5 ? -7 : 0));
    });
    return plots;
  }

  App.renderMap = function (container, options) {
    const { allocations, participants, selectedPlotId, selectedOwnerId, onPlotClick } = options;
    container.innerHTML = '';
    const svg = svgEl('svg', { viewBox: '0 0 760 760', role: 'img', 'aria-label': 'Plan interactif des parcelles' });

    svg.append(svgEl('path', { d: 'M42 46 L708 46 L725 720 L42 720 Z', fill: '#fff', stroke: '#667085', 'stroke-width': '3' }));
    svg.append(svgEl('rect', { x: 252, y: 180, width: 34, height: 500, class: 'road' }));
    const roadText = svgEl('text', { x: 270, y: 455, class: 'map-note', transform: 'rotate(-90 270 455)' });
    roadText.textContent = 'Voie de 10 mètres';
    svg.append(roadText);

    for (const plot of createGeometry()) {
      const ownerId = allocations[plot.id] || null;
      const owner = participants.find(p => p.id === ownerId);
      const isReserved = App.PRE_RESERVED_PLOT_IDS.includes(plot.id);
      const classes = ['plot'];
      if (isReserved) classes.push('reserved');
      if (selectedPlotId === plot.id) classes.push('selected');
      if (selectedOwnerId && ownerId === selectedOwnerId) classes.push('same-owner');

      const polygon = svgEl('polygon', {
        id: `plot-${plot.id}`,
        class: classes.join(' '),
        points: plot.points,
        fill: isReserved ? '#b8bcc4' : (owner ? owner.color : '#ffffff'),
        'data-plot-id': plot.id,
        tabindex: '0',
        role: 'button',
        'aria-label': `${plot.id}${isReserved ? `, pré-réservée à ${owner ? owner.reference : App.PRE_RESERVED_OWNER.reference}` : owner ? `, attribuée à ${owner.reference}` : ', disponible'}`
      });
      polygon.addEventListener('click', () => onPlotClick(plot.id));
      polygon.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onPlotClick(plot.id);
        }
      });
      svg.append(polygon);

      const label = svgEl('text', { x: plot.cx, y: plot.cy, class: 'plot-label' });
      label.textContent = plot.label;
      svg.append(label);
    }

    const lot1 = svgEl('text', { x: 150, y: 705, class: 'map-note', 'text-anchor': 'middle' });
    lot1.textContent = 'LOT 1';
    svg.append(lot1);
    const lot2 = svgEl('text', { x: 505, y: 705, class: 'map-note', 'text-anchor': 'middle' });
    lot2.textContent = 'LOT 2';
    svg.append(lot2);
    container.append(svg);
  };
})(window.LandAllocation = window.LandAllocation || {});
