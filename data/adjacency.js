(function (App) {
  'use strict';

  const pairs = [
    ['L1-a','L1-b'],['L1-b','L1-c'],['L1-c','L1-d'],['L1-d','L1-e'],
    ['L1-e','L1-f'],['L1-f','L1-g'],['L1-g','L1-h'],['L1-h','L1-i'],['L1-i','L1-j'],

    ['L2-a','L2-b'],['L2-b','L2-c'],['L2-c','L2-d'],['L2-d','L2-e'],
    ['L2-e','L2-f'],['L2-f','L2-g'],['L2-g','L2-h'],['L2-h','L2-i'],['L2-i','L2-j'],

    ['L2-s','L2-r'],['L2-r','L2-q'],['L2-q','L2-p'],['L2-p','L2-o'],
    ['L2-o','L2-n'],['L2-n','L2-m'],['L2-m','L2-l'],['L2-l','L2-k'],

    ['L2-a','L2-s'],['L2-b','L2-s'],['L2-b','L2-r'],['L2-c','L2-r'],
    ['L2-c','L2-q'],['L2-d','L2-q'],['L2-d','L2-p'],['L2-e','L2-p'],
    ['L2-e','L2-o'],['L2-f','L2-o'],['L2-f','L2-n'],['L2-g','L2-n'],
    ['L2-h','L2-n'],['L2-h','L2-m'],['L2-i','L2-m'],['L2-i','L2-l'],
    ['L2-j','L2-l'],['L2-j','L2-k'],

    // La voie de 10 m s'arrête avant le sommet : connexion provisoire à confirmer.
    ['L1-a','L2-a']
  ];

  App.ADJACENCY = {};
  for (const [a, b] of pairs) {
    App.ADJACENCY[a] = App.ADJACENCY[a] || [];
    App.ADJACENCY[b] = App.ADJACENCY[b] || [];
    if (!App.ADJACENCY[a].includes(b)) App.ADJACENCY[a].push(b);
    if (!App.ADJACENCY[b].includes(a)) App.ADJACENCY[b].push(a);
  }
})(window.LandAllocation = window.LandAllocation || {});
