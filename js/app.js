(function (App) {
  'use strict';

  function start() {
    const defaultState = () => ({
      participants: [],
      allocations: {},
      history: [],
      locked: false,
      selectedPlotId: null,
      selectedOwnerId: null
    });

    let state = Object.assign(defaultState(), App.loadState() || {});
    if (!Array.isArray(state.history)) state.history = [];
    state.selectedPlotId = null;
    state.selectedOwnerId = null;

    const $ = selector => document.querySelector(selector);
    const elements = {
      form: $('#participantForm'),
      reference: $('#reference'),
      plotCount: $('#plotCount'),
      formMessage: $('#formMessage'),
      participantsList: $('#participantsList'),
      participantCount: $('#participantCount'),
      emptyParticipants: $('#emptyParticipants'),
      cardTemplate: $('#participantCardTemplate'),
      demandSummary: $('#demandSummary'),
      remainingBadge: $('#remainingBadge'),
      mapContainer: $('#mapContainer'),
      plotInfo: $('#plotInfo'),
      ownerAllocation: $('#ownerAllocation'),
      allocationHistory: $('#allocationHistory'),
      historyCount: $('#historyCount'),
      lockButton: $('#lockButton'),
      lockBadge: $('#lockBadge'),
      printButton: $('#printButton'),
      resetAllocationsButton: $('#resetAllocationsButton'),
      clearButton: $('#clearButton'),
      debugButton: $('#debugButton'),
      debugPanel: $('#debugPanel')
    };

    const missing = Object.entries(elements).filter(([, value]) => !value).map(([key]) => key);
    if (missing.length) {
      console.error('Éléments manquants dans la page :', missing);
      return;
    }

    function persist() {
      const persisted = Object.assign({}, state);
      delete persisted.selectedPlotId;
      delete persisted.selectedOwnerId;
      App.saveState(persisted);
    }

    function availablePlots() {
      return App.ALLOCATABLE_PLOT_IDS.filter(id => !state.allocations[id]);
    }

    function totalDemand() {
      return state.participants.reduce((sum, participant) => sum + participant.requestedPlots, 0);
    }

    function showMessage(message, success) {
      elements.formMessage.textContent = message;
      elements.formMessage.style.color = success ? '#067647' : '#b42318';
    }

    function participantById(id) {
      return state.participants.find(participant => participant.id === id);
    }

    function plotsForParticipant(participantId) {
      return Object.entries(state.allocations)
        .filter(([, ownerId]) => ownerId === participantId)
        .map(([plotId]) => plotId)
        .sort();
    }

    function createId() {
      if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
      return `participant-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    function createParticipant(reference, requestedPlots) {
      return {
        id: createId(),
        reference,
        requestedPlots,
        status: 'pending',
        color: App.colorForIndex(state.participants.length)
      };
    }

    function addParticipant(event) {
      event.preventDefault();
      if (state.locked) return;

      const reference = elements.reference.value.trim();
      const requestedPlots = Number(elements.plotCount.value);

      if (!reference) return showMessage('La référence est obligatoire.', false);
      if (!Number.isInteger(requestedPlots) || requestedPlots < 1 || requestedPlots > 28) {
        return showMessage('Le nombre doit être un entier compris entre 1 et 28.', false);
      }

      state.participants.push(createParticipant(reference, requestedPlots));
      elements.form.reset();
      elements.plotCount.value = '1';
      showMessage('Participant ajouté.', true);
      persist();
      render();
    }

    function deleteParticipant(id) {
      if (state.locked) return;
      const participant = participantById(id);
      if (!participant || participant.status === 'allocated') return;

      const confirmed = window.confirm(
        `Confirmer la suppression de « ${participant.reference} » ?\n\n` +
        `Cette action retire définitivement ce participant de la liste.`
      );
      if (!confirmed) return;

      state.participants = state.participants.filter(item => item.id !== id);
      persist();
      render();
    }

    function allocateParticipant(id) {
      if (state.locked) return;
      const participant = participantById(id);
      if (!participant || participant.status === 'allocated') return;

      const available = availablePlots();
      if (participant.requestedPlots > available.length) {
        window.alert(
          `Attribution impossible : ${participant.requestedPlots} parcelles demandées, ` +
          `mais seulement ${available.length} disponibles.`
        );
        return;
      }

      const confirmed = window.confirm(
        `Confirmer l’attribution pour « ${participant.reference} » ?\n\n` +
        `${participant.requestedPlots} parcelle${participant.requestedPlots > 1 ? 's' : ''} ` +
        `sera${participant.requestedPlots > 1 ? 'ont' : ''} attribuée${participant.requestedPlots > 1 ? 's' : ''} ` +
        `aléatoirement parmi les ${available.length} parcelles disponibles.`
      );
      if (!confirmed) return;

      const result = App.allocatePlots(available, participant.requestedPlots);
      if (!result.ok) {
        window.alert("Aucune attribution valide n'a pu être calculée.");
        return;
      }

      result.plots.forEach(plotId => {
        state.allocations[plotId] = participant.id;
      });
      participant.status = 'allocated';
      participant.components = result.components;

      state.history.push({
        id: `allocation-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        type: 'allocation',
        participantId: participant.id,
        participantReference: participant.reference,
        plots: result.plots.slice().sort(),
        components: result.components,
        timestamp: new Date().toISOString()
      });

      state.selectedOwnerId = participant.id;
      state.selectedPlotId = result.plots[0];
      persist();
      render();
    }

    function handlePlotClick(plotId) {
      state.selectedPlotId = plotId;
      state.selectedOwnerId = state.allocations[plotId] || null;
      renderMapOnly();
      renderPlotInfo();
      renderOwnerAllocation();
    }

    function highlightParticipant(id) {
      state.selectedOwnerId = id;
      state.selectedPlotId = plotsForParticipant(id)[0] || null;
      renderMapOnly();
      renderPlotInfo();
      renderOwnerAllocation();
    }

    function renderParticipants() {
      elements.participantsList.innerHTML = '';
      elements.emptyParticipants.hidden = state.participants.length > 0;
      elements.participantCount.textContent = `${state.participants.length} participant${state.participants.length > 1 ? 's' : ''}`;

      state.participants.forEach(participant => {
        const card = elements.cardTemplate.content.firstElementChild.cloneNode(true);
        const plots = plotsForParticipant(participant.id);
        const allocated = participant.status === 'allocated';

        card.querySelector('.participant-reference').textContent = participant.reference;
        card.querySelector('.participant-count').textContent = participant.requestedPlots;
        card.querySelector('.participant-plots').textContent = plots.length
          ? `Parcelles : ${plots.join(', ')}`
          : 'Aucune parcelle attribuée';
        card.style.setProperty('--participant-color', participant.color || '#98a2b3');

        const status = card.querySelector('.status-badge');
        status.textContent = allocated ? 'Attribué' : 'En attente';
        status.classList.toggle('allocated', allocated);

        const actions = card.querySelector('.participant-actions');
        const allocateButton = document.createElement('button');
        allocateButton.type = 'button';
        allocateButton.textContent = allocated ? '✓ Attribué' : 'Attribuer';
        allocateButton.className = allocated ? 'success' : 'primary';
        allocateButton.disabled = allocated || state.locked;
        allocateButton.addEventListener('click', () => allocateParticipant(participant.id));
        actions.append(allocateButton);

        if (!allocated) {
          const deleteButton = document.createElement('button');
          deleteButton.type = 'button';
          deleteButton.textContent = 'Supprimer';
          deleteButton.className = 'danger';
          deleteButton.disabled = state.locked;
          deleteButton.addEventListener('click', () => deleteParticipant(participant.id));
          actions.append(deleteButton);
        } else {
          const detailsButton = document.createElement('button');
          detailsButton.type = 'button';
          detailsButton.textContent = 'Voir sur le plan';
          detailsButton.className = 'secondary';
          detailsButton.addEventListener('click', () => highlightParticipant(participant.id));
          actions.append(detailsButton);
        }

        elements.participantsList.append(card);
      });
    }

    function renderMapOnly() {
      App.renderMap(elements.mapContainer, {
        allocations: state.allocations,
        participants: state.participants,
        selectedPlotId: state.selectedPlotId,
        selectedOwnerId: state.selectedOwnerId,
        onPlotClick: handlePlotClick
      });
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>'"]/g, character => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
      })[character]);
    }

    function renderPlotInfo() {
      const id = state.selectedPlotId;
      if (!id) {
        elements.plotInfo.textContent = 'Cliquez sur une parcelle.';
        return;
      }

      if (id === App.EXCLUDED_PLOT_ID) {
        elements.plotInfo.innerHTML = `<strong>${id}</strong><br>Statut : Non attribuable`;
        return;
      }

      const ownerId = state.allocations[id];
      if (!ownerId) {
        elements.plotInfo.innerHTML = `<strong>${id}</strong><br>Statut : Disponible`;
        return;
      }

      const owner = participantById(ownerId);
      elements.plotInfo.innerHTML =
        `<strong>${id}</strong><br>` +
        `Statut : Attribuée<br>` +
        `Bénéficiaire : <strong>${escapeHtml(owner ? owner.reference : 'Inconnu')}</strong>`;
    }

    function renderOwnerAllocation() {
      const ownerId = state.selectedOwnerId;
      if (!ownerId) {
        elements.ownerAllocation.innerHTML = '<p class="empty-state">Aucun bénéficiaire sélectionné.</p>';
        return;
      }

      const owner = participantById(ownerId);
      const plots = plotsForParticipant(ownerId);
      if (!owner || !plots.length) {
        elements.ownerAllocation.innerHTML = '<p class="empty-state">Aucune attribution associée.</p>';
        return;
      }

      const components = App.countComponents(plots);
      elements.ownerAllocation.innerHTML =
        `<div class="owner-allocation-card" style="--owner-color:${owner.color}">` +
        `<strong>${escapeHtml(owner.reference)}</strong>` +
        `<div>${plots.length} parcelle${plots.length > 1 ? 's' : ''}</div>` +
        `<div>${plots.join(', ')}</div>` +
        `<div>${components} bloc${components > 1 ? 's' : ''} contigu${components > 1 ? 's' : ''}</div>` +
        `</div>`;
    }

    function formatHistoryDate(isoDate) {
      try {
        return new Intl.DateTimeFormat('fr-FR', {
          dateStyle: 'short',
          timeStyle: 'medium'
        }).format(new Date(isoDate));
      } catch (error) {
        return isoDate || '';
      }
    }

    function renderHistory() {
      const entries = state.history.slice().reverse();
      elements.historyCount.textContent = `${entries.length} opération${entries.length > 1 ? 's' : ''}`;

      if (!entries.length) {
        elements.allocationHistory.innerHTML = '<p class="empty-state">Aucune attribution effectuée.</p>';
        return;
      }

      elements.allocationHistory.innerHTML = '';
      entries.forEach(entry => {
        const participant = participantById(entry.participantId);
        const item = document.createElement('div');
        item.className = 'history-item';
        item.style.setProperty('--owner-color', participant ? participant.color : '#98a2b3');
        item.innerHTML =
          `<strong>${escapeHtml(entry.participantReference || (participant && participant.reference) || 'Participant')}</strong>` +
          `<div>${entry.plots.length} parcelle${entry.plots.length > 1 ? 's' : ''} : ${entry.plots.join(', ')}</div>` +
          `<div>${entry.components} bloc${entry.components > 1 ? 's' : ''} contigu${entry.components > 1 ? 's' : ''}</div>` +
          `<time>${escapeHtml(formatHistoryDate(entry.timestamp))}</time>`;
        item.addEventListener('click', () => highlightParticipant(entry.participantId));
        elements.allocationHistory.append(item);
      });
    }

    function renderDebug() {
      if (elements.debugPanel.hidden) return;
      elements.debugPanel.textContent = JSON.stringify({
        adjacency: App.ADJACENCY,
        availablePlots: availablePlots(),
        allocations: state.allocations,
        history: state.history,
        participants: state.participants.map(participant => Object.assign({}, participant, {
          allocatedPlots: plotsForParticipant(participant.id),
          components: plotsForParticipant(participant.id).length
            ? App.countComponents(plotsForParticipant(participant.id))
            : 0
        }))
      }, null, 2);
    }

    function renderStatus() {
      const available = availablePlots().length;
      elements.remainingBadge.textContent = `${available} disponible${available > 1 ? 's' : ''}`;
      elements.demandSummary.textContent = `${totalDemand()} demandé / 28`;
      elements.demandSummary.style.background = totalDemand() > 28 ? '#fef3f2' : '#eef4ff';
      elements.demandSummary.style.color = totalDemand() > 28 ? '#b42318' : '#3538cd';
      elements.lockBadge.hidden = !state.locked;
      elements.lockButton.disabled = state.locked || Object.keys(state.allocations).length === 0;
      elements.lockButton.textContent = state.locked ? 'Verrouillé' : 'Verrouiller';
      elements.form.querySelectorAll('input, button').forEach(element => {
        element.disabled = state.locked;
      });
    }

    function render() {
      renderParticipants();
      renderMapOnly();
      renderPlotInfo();
      renderOwnerAllocation();
      renderHistory();
      renderStatus();
      renderDebug();
    }

    function resetAllocations() {
      if (!window.confirm('Réinitialiser toutes les attributions tout en conservant les participants ?')) return;
      state.allocations = {};
      state.history = [];
      state.locked = false;
      state.selectedPlotId = null;
      state.selectedOwnerId = null;
      state.participants = state.participants.map(participant => Object.assign({}, participant, {
        status: 'pending',
        components: undefined
      }));
      persist();
      render();
    }

    function clearEverything() {
      if (!window.confirm('Supprimer tous les participants, toutes les attributions et tout l’historique ?')) return;
      state = defaultState();
      App.clearState();
      render();
    }

    function lockAllocations() {
      if (!window.confirm("Verrouiller les attributions ? L'application passera en lecture seule jusqu'à une réinitialisation.")) return;
      state.locked = true;
      persist();
      render();
    }

    function toggleDebug() {
      elements.debugPanel.hidden = !elements.debugPanel.hidden;
      elements.debugButton.textContent = elements.debugPanel.hidden ? 'Débogage' : 'Masquer le débogage';
      renderDebug();
    }

    elements.form.addEventListener('submit', addParticipant);
    elements.resetAllocationsButton.addEventListener('click', resetAllocations);
    elements.clearButton.addEventListener('click', clearEverything);
    elements.lockButton.addEventListener('click', lockAllocations);
    elements.printButton.addEventListener('click', () => window.print());
    elements.debugButton.addEventListener('click', toggleDebug);

    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})(window.LandAllocation = window.LandAllocation || {});
