(function (App) {
  'use strict';

  function randomUint32() {
    if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
      const values = new Uint32Array(1);
      window.crypto.getRandomValues(values);
      return values[0];
    }
    return Math.floor(Math.random() * 0x100000000);
  }

  function randomIndex(length) {
    if (!Number.isInteger(length) || length <= 0) return -1;
    const limit = Math.floor(0x100000000 / length) * length;
    let value;
    do value = randomUint32(); while (value >= limit);
    return value % length;
  }

  function chooseRandom(values) {
    const index = randomIndex(values.length);
    return index >= 0 ? values[index] : undefined;
  }

  function shuffle(values) {
    const array = [...values];
    for (let i = array.length - 1; i > 0; i--) {
      const j = randomIndex(i + 1);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function canonical(ids) {
    return [...ids].sort();
  }

  function candidateKey(ids) {
    return canonical(ids).join('|');
  }

  function countInternalEdges(ids) {
    const selected = new Set(ids);
    let doubled = 0;
    for (const id of ids) {
      for (const neighbor of App.ADJACENCY[id] || []) {
        if (selected.has(neighbor)) doubled += 1;
      }
    }
    return doubled / 2;
  }

  function graphDiameter(ids) {
    const selected = new Set(ids);
    let diameter = 0;

    for (const start of ids) {
      const distances = new Map([[start, 0]]);
      const queue = [start];
      for (let cursor = 0; cursor < queue.length; cursor++) {
        const current = queue[cursor];
        for (const neighbor of App.ADJACENCY[current] || []) {
          if (!selected.has(neighbor) || distances.has(neighbor)) continue;
          distances.set(neighbor, distances.get(current) + 1);
          queue.push(neighbor);
        }
      }
      for (const distance of distances.values()) diameter = Math.max(diameter, distance);
    }
    return diameter;
  }

  /*
   * Lexicographic practicality score. Lower values are better.
   *
   * 1. A single continuous lane is preferred whenever possible.
   * 2. Otherwise, reduce vertical and horizontal spread.
   * 3. Reward shapes with more shared internal borders.
   * 4. Reduce the longest path through the selected group.
   *
   * Randomness is preserved because candidates with the exact same best score
   * are selected uniformly using the browser's secure random generator.
   */
  function practicalityScore(ids) {
    const positions = ids
      .map(id => App.PLOT_LAYOUT && App.PLOT_LAYOUT[id])
      .filter(Boolean);

    if (positions.length !== ids.length) {
      return [2, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, 0, graphDiameter(ids)];
    }

    const lanes = positions.map(p => p.lane);
    const rows = positions.map(p => p.row);
    const laneCount = new Set(lanes).size;
    const rowCount = new Set(rows).size;
    const laneSpan = Math.max(...lanes) - Math.min(...lanes);
    const rowSpan = Math.max(...rows) - Math.min(...rows);
    const internalEdges = countInternalEdges(ids);

    // Tier 0: one vertical strip. Tier 1: one horizontal level. Tier 2: block.
    const alignmentTier = laneCount === 1 ? 0 : (rowCount === 1 ? 1 : 2);

    return [
      alignmentTier,
      rowSpan,
      laneSpan,
      -internalEdges,
      graphDiameter(ids),
    ];
  }

  function compareScores(a, b) {
    const length = Math.max(a.length, b.length);
    for (let i = 0; i < length; i++) {
      const av = a[i] ?? 0;
      const bv = b[i] ?? 0;
      if (av < bv) return -1;
      if (av > bv) return 1;
    }
    return 0;
  }

  function bestPracticalCandidates(candidates) {
    let bestScore = null;
    const best = [];

    for (const candidate of candidates) {
      const score = practicalityScore(candidate);
      if (!bestScore || compareScores(score, bestScore) < 0) {
        bestScore = score;
        best.length = 0;
        best.push(candidate);
      } else if (compareScores(score, bestScore) === 0) {
        best.push(candidate);
      }
    }

    return { candidates: best, score: bestScore };
  }

  function enumerateConnectedCandidates(availableIds, requestedCount) {
    const availableSet = new Set(availableIds);
    const completed = new Map();
    const visitedPartial = new Set();
    const MAX_PARTIAL_STATES = 250000;
    let partialStates = 0;
    let truncated = false;

    function expand(currentSet) {
      if (truncated) return;
      const current = canonical(currentSet);
      const stateKey = current.join('|');
      if (visitedPartial.has(stateKey)) return;
      visitedPartial.add(stateKey);

      partialStates += 1;
      if (partialStates > MAX_PARTIAL_STATES) {
        truncated = true;
        return;
      }

      if (current.length === requestedCount) {
        completed.set(stateKey, current);
        return;
      }

      const frontier = new Set();
      for (const id of current) {
        for (const neighbor of App.ADJACENCY[id] || []) {
          if (availableSet.has(neighbor) && !currentSet.has(neighbor)) frontier.add(neighbor);
        }
      }

      for (const next of shuffle(frontier)) {
        const grown = new Set(currentSet);
        grown.add(next);
        expand(grown);
        if (truncated) return;
      }
    }

    for (const start of shuffle(availableIds)) {
      expand(new Set([start]));
      if (truncated) break;
    }

    return {
      candidates: [...completed.values()],
      truncated,
      exploredStates: partialStates,
    };
  }

  function randomConnectedCandidates(availableIds, requestedCount) {
    const availableSet = new Set(availableIds);
    const unique = new Map();
    const attempts = Math.min(120000, Math.max(20000, availableIds.length * requestedCount * 1200));

    for (let attempt = 0; attempt < attempts; attempt++) {
      const start = chooseRandom(availableIds);
      if (!start) break;
      const chosen = [start];
      const chosenSet = new Set(chosen);

      while (chosen.length < requestedCount) {
        const frontier = new Set();
        for (const id of chosen) {
          for (const neighbor of App.ADJACENCY[id] || []) {
            if (availableSet.has(neighbor) && !chosenSet.has(neighbor)) frontier.add(neighbor);
          }
        }
        if (!frontier.size) break;
        const next = chooseRandom([...frontier]);
        chosen.push(next);
        chosenSet.add(next);
      }

      if (chosen.length === requestedCount) {
        const normalized = canonical(chosen);
        unique.set(candidateKey(normalized), normalized);
      }
    }
    return [...unique.values()];
  }

  function fallbackCandidates(availableIds, requestedCount) {
    const uniqueBest = new Map();
    let minimumComponents = Infinity;
    const attempts = Math.min(100000, Math.max(25000, availableIds.length * requestedCount * 800));

    for (let i = 0; i < attempts; i++) {
      const candidate = canonical(shuffle(availableIds).slice(0, requestedCount));
      const components = App.countComponents(candidate);
      if (components < minimumComponents) {
        minimumComponents = components;
        uniqueBest.clear();
      }
      if (components === minimumComponents) uniqueBest.set(candidateKey(candidate), candidate);
    }

    const practical = bestPracticalCandidates([...uniqueBest.values()]);
    return {
      components: minimumComponents,
      candidates: practical.candidates,
      practicalityScore: practical.score,
    };
  }

  App.allocatePlots = function (availableIds, requestedCount) {
    if (requestedCount > availableIds.length) return { ok: false, reason: 'insufficient' };

    if (requestedCount === 1) {
      return { ok: true, plots: [chooseRandom(availableIds)], components: 1 };
    }

    const enumeration = enumerateConnectedCandidates(shuffle(availableIds), requestedCount);
    let connected = enumeration.candidates;

    if (enumeration.truncated) {
      const merged = new Map(connected.map(candidate => [candidateKey(candidate), candidate]));
      for (const candidate of randomConnectedCandidates(availableIds, requestedCount)) {
        merged.set(candidateKey(candidate), candidate);
      }
      connected = [...merged.values()];
    }

    if (connected.length) {
      const practical = bestPracticalCandidates(connected);
      return {
        ok: true,
        plots: chooseRandom(practical.candidates),
        components: 1,
        candidateCount: connected.length,
        bestCandidateCount: practical.candidates.length,
        practicalityScore: practical.score,
      };
    }

    const fallback = fallbackCandidates(shuffle(availableIds), requestedCount);
    const selected = chooseRandom(fallback.candidates);
    return selected
      ? {
          ok: true,
          plots: selected,
          components: fallback.components,
          candidateCount: fallback.candidates.length,
          practicalityScore: fallback.practicalityScore,
        }
      : { ok: false, reason: 'no-solution' };
  };
})(window.LandAllocation = window.LandAllocation || {});
