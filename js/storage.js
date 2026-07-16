(function (App) {
  'use strict';
  const KEY = 'landAllocationState.v1';

  App.loadState = function () {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.warn('Lecture du stockage local impossible.', error);
      return null;
    }
  };

  App.saveState = function (state) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch (error) {
      console.warn('Sauvegarde locale impossible.', error);
      return false;
    }
  };

  App.clearState = function () {
    try {
      localStorage.removeItem(KEY);
    } catch (error) {
      console.warn('Suppression du stockage local impossible.', error);
    }
  };
})(window.LandAllocation = window.LandAllocation || {});
