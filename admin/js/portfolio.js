(function () {
  'use strict';

  // Mirrors the taxonomy in ../../js/main.js (FACETS / QUIZ_STEPS) exactly,
  // so a design tagged here immediately works with the public Find Your
  // Style configurator and Lookbook filters — no separate mapping step.
  var OPTIONS = {
    style: [
      { value: 'minimal', label: 'Minimal' }, { value: 'glam', label: 'Glam' },
      { value: 'classic', label: 'Classic' }, { value: 'bold', label: 'Bold' },
      { value: 'cute', label: 'Cute' }, { value: 'luxury', label: 'Luxury' },
    ],
    shape: [
      { value: 'almond', label: 'Almond' }, { value: 'oval', label: 'Oval' },
      { value: 'square', label: 'Square' }, { value: 'squoval', label: 'Squoval' },
      { value: 'coffin', label: 'Coffin' }, { value: 'stiletto', label: 'Stiletto' },
    ],
    length: [
      { value: 'short', label: 'Short' }, { value: 'medium', label: 'Medium' },
      { value: 'long', label: 'Long' }, { value: 'extra-long', label: 'Extra Long' },
    ],
    color: [
      { value: 'nude', label: 'Nude' }, { value: 'pink', label: 'Pink' }, { value: 'red', label: 'Red' },
      { value: 'black', label: 'Black' }, { value: 'brown', label: 'Brown' }, { value: 'blue', label: 'Blue' },
      { value: 'purple', label: 'Purple' }, { value: 'green', label: 'Green' }, { value: 'metallic', label: 'Metallic' },
    ],
    finish: [
      { value: 'glossy', label: 'Glossy' }, { value: 'matte', label: 'Matte' }, { value: 'chrome', label: 'Chrome' },
      { value: 'french', label: 'French' }, { value: 'glitter', label: 'Glitter' }, { value: 'pearl', label: 'Pearl' },
      { value: 'metallic', label: 'Metallic' }, { value: 'cat-eye', label: 'Cat Eye' },
    ],
    artStyle: [
      { value: 'french', label: 'French' }, { value: 'minimal', label: 'Minimal' }, { value: 'floral', label: 'Floral' },
      { value: 'abstract', label: 'Abstract' }, { value: 'chrome', label: 'Chrome' }, { value: 'rhinestones', label: 'Rhinestones' },
      { value: '3d', label: '3D' }, { value: 'animal-print', label: 'Animal Print' }, { value: 'line-art', label: 'Line Art' },
      { value: 'no-art', label: 'None' },
    ],
  };

  var state = { user: null, items: [], editingId: null, uploadedImageUrl: null, approvalRequired: true };

  document.addEventListener('DOMContentLoaded', async function () {
    state.user = await Admin.requireSession(['MASTER', 'DEPUTY']);
    buildChipGroups();
    wireFilters();
    wireEditor();
    wireDelete();

    try {
      var settings = await Admin.api('/api/admin/settings');
      state.approvalRequired = settings.settings.deputyContentApproval;
    } catch (e) { /* Deputy without settings access edge case — default stays true */ }

    await loadItems();
    handleQueryParams();
  });

  function handleQueryParams() {
    var params = new URLSearchParams(location.search);
    if (params.get('status')) document.getElementById('filterStatus').value = params.get('status');
    applyFilters();
    if (params.get('action') === 'add') openEditor(null);
    if (params.get('action') === 'import') openEditor(null, { source: 'instagram' });
  }

  // -------------------------------------------------------------------
  // List + filters
  // -------------------------------------------------------------------

  async function loadItems() {
    try {
      var data = await Admin.api('/api/portfolio');
      state.items = data.items;
      applyFilters();
    } catch (err) {
      Admin.toast(err.message, true);
    }
  }

  function wireFilters() {
    ['filterStatus', 'filterSource'].forEach(function (id) {
      document.getElementById(id).addEventListener('change', applyFilters);
    });
    document.getElementById('filterSearch').addEventListener('input', debounce(applyFilters, 200));
  }

  function applyFilters() {
    var status = document.getElementById('filterStatus').value;
    var source = document.getElementById('filterSource').value;
    var q = document.getElementById('filterSearch').value.trim().toLowerCase();

    var filtered = state.items.filter(function (item) {
      if (status && item.status !== status) return false;
      if (source && item.source !== source) return false;
      if (q && item.title.toLowerCase().indexOf(q) === -1) return false;
      return true;
    });

    renderTable(filtered);
  }

  function renderTable(items) {
    var body = document.getElementById('tableBody');
    document.getElementById('emptyState').hidden = items.length > 0;
    body.innerHTML = items.map(renderRow).join('');

    body.querySelectorAll('[data-edit]').forEach(function (btn) {
      btn.addEventListener('click', function () { openEditor(findItem(btn.dataset.edit)); });
    });
    body.querySelectorAll('[data-transition]').forEach(function (btn) {
      btn.addEventListener('click', function () { runTransition(btn.dataset.id, btn.dataset.transition); });
    });
    body.querySelectorAll('[data-delete]').forEach(function (btn) {
      btn.addEventListener('click', function () { openDeleteConfirm(findItem(btn.dataset.delete)); });
    });
  }

  function findItem(id) {
    return state.items.filter(function (i) { return i.id === id; })[0];
  }

  function renderRow(item) {
    var thumb = item.image_url
      ? '<img src="' + item.image_url + '" alt="" style="width:44px;height:44px;object-fit:cover;border-radius:6px">'
      : '<div style="width:44px;height:44px;border-radius:6px;background:var(--champagne-soft)"></div>';

    var tags = [].concat(item.style || [], item.shape || [], item.finish || []).filter(Boolean).slice(0, 3).join(' · ');

    var isOwner = item.created_by === state.user.id;
    var isMaster = state.user.role === 'MASTER';
    var actions = [];

    actions.push('<button class="btn btn--ghost" data-edit="' + item.id + '">Edit</button>');

    if (item.status === 'draft' && (isMaster || isOwner)) {
      actions.push('<button class="btn btn--ghost" data-transition="submit" data-id="' + item.id + '">' + (isMaster ? 'Publish' : 'Submit') + '</button>');
    }
    if (item.status === 'pending_approval' && isMaster) {
      actions.push('<button class="btn btn--ghost" data-transition="approve" data-id="' + item.id + '">Approve</button>');
      actions.push('<button class="btn btn--ghost" data-transition="reject" data-id="' + item.id + '">Reject</button>');
    }
    if (item.status === 'published' && (isMaster || isOwner)) {
      actions.push('<button class="btn btn--ghost" data-transition="unpublish" data-id="' + item.id + '">Unpublish</button>');
    }
    if (isMaster) {
      actions.push('<button class="btn btn--ghost" data-delete="' + item.id + '" style="color:#8a2b2b">Delete</button>');
    }

    return '<tr>' +
      '<td>' + thumb + '</td>' +
      '<td>BN-' + item.reference_number + '</td>' +
      '<td>' + Admin.escapeHtml(item.title) +
        (item.instagram_url ? ' <a href="' + item.instagram_url + '" target="_blank" rel="noopener" class="text-sm">(Instagram)</a>' : '') + '</td>' +
      '<td class="text-sm muted">' + Admin.escapeHtml(tags) + '</td>' +
      '<td class="text-sm">' + (item.source === 'instagram' ? 'Instagram' : 'Manual') + '</td>' +
      '<td><span class="status-pill status-pill--' + item.status + '">' + item.status.replace('_', ' ') + '</span></td>' +
      '<td class="text-sm muted">' + Admin.escapeHtml(item.created_by_name || '—') + '</td>' +
      '<td><div class="table-actions">' + actions.join('') + '</div></td>' +
      '</tr>';
  }

  async function runTransition(id, transition, extra) {
    try {
      await Admin.api('/api/portfolio/' + id, { method: 'PATCH', body: Object.assign({ transition: transition }, extra || {}) });
      Admin.toast('Updated.');
      await loadItems();
    } catch (err) {
      Admin.toast(err.message, true);
    }
  }

  // -------------------------------------------------------------------
  // Add / edit modal
  // -------------------------------------------------------------------

  function buildChipGroups() {
    document.querySelectorAll('.chip-select[data-group]').forEach(function (el) {
      var group = el.dataset.group;
      var multi = el.dataset.multi === 'true';
      OPTIONS[group].forEach(function (opt) {
        var chip = document.createElement('span');
        chip.className = 'chip-toggle';
        chip.textContent = opt.label;
        chip.dataset.value = opt.value;
        chip.addEventListener('click', function () {
          if (multi) {
            chip.classList.toggle('is-selected');
          } else {
            el.querySelectorAll('.chip-toggle').forEach(function (c) { c.classList.remove('is-selected'); });
            chip.classList.add('is-selected');
          }
        });
        el.appendChild(chip);
      });
    });

    // Boolean flag chips (featured/seasonal/trending) toggle independently.
    document.querySelectorAll('.chip-toggle[data-flag]').forEach(function (chip) {
      chip.addEventListener('click', function () { chip.classList.toggle('is-selected'); });
    });
  }

  function wireEditor() {
    document.getElementById('addDesignBtn').addEventListener('click', function () { openEditor(null); });
    document.getElementById('editorClose').addEventListener('click', closeEditor);
    document.getElementById('editorOverlay').addEventListener('click', function (e) {
      if (e.target.id === 'editorOverlay') closeEditor();
    });

    document.querySelectorAll('#sourceToggle .chip-toggle').forEach(function (chip) {
      chip.addEventListener('click', function () {
        document.querySelectorAll('#sourceToggle .chip-toggle').forEach(function (c) { c.classList.remove('is-selected'); });
        chip.classList.add('is-selected');
        document.getElementById('instagramUrlField').hidden = chip.dataset.source !== 'instagram';
      });
    });

    document.getElementById('imageDrop').addEventListener('click', function () { document.getElementById('imageFile').click(); });
    document.getElementById('imageFile').addEventListener('change', handleImageUpload);

    document.getElementById('editorForm').addEventListener('submit', function (e) { e.preventDefault(); });
  }

  function openEditor(item, presets) {
    state.editingId = item ? item.id : null;
    state.uploadedImageUrl = item ? item.image_url : null;
    presets = presets || {};

    document.getElementById('editorTitle').textContent = item ? ('Edit ' + item.title) : 'Add to Bel Nails';
    document.getElementById('title').value = item ? item.title : '';
    document.getElementById('recommendedService').value = item ? (item.recommended_service || '') : '';
    document.getElementById('priceLabel').value = item ? (item.price_label || '') : '';
    document.getElementById('instagramUrl').value = item ? (item.instagram_url || '') : '';

    var source = item ? item.source : (presets.source || 'manual');
    document.querySelectorAll('#sourceToggle .chip-toggle').forEach(function (c) { c.classList.toggle('is-selected', c.dataset.source === source); });
    document.getElementById('instagramUrlField').hidden = source !== 'instagram';
    document.getElementById('sourceToggle').style.pointerEvents = item ? 'none' : ''; // can't change source once created
    document.getElementById('sourceToggle').style.opacity = item ? '0.5' : '1';

    setChipSelection('style', item ? item.style : []);
    setChipSelection('shape', item && item.shape ? [item.shape] : []);
    setChipSelection('length', item && item.length ? [item.length] : []);
    setChipSelection('color', item ? item.color : []);
    setChipSelection('finish', item && item.finish ? [item.finish] : []);
    setChipSelection('artStyle', item && item.art_style ? [item.art_style] : []);

    ['featured', 'seasonal', 'trending'].forEach(function (flag) {
      var chip = document.querySelector('.chip-toggle[data-flag="' + flag + '"]');
      chip.classList.toggle('is-selected', Boolean(item && item[flag]));
    });

    var previewWrap = document.getElementById('imagePreviewWrap');
    previewWrap.innerHTML = state.uploadedImageUrl
      ? '<img src="' + state.uploadedImageUrl + '" alt="">'
      : '<span id="imageDropLabel">Click to upload a JPG, PNG or WebP (max 8MB)</span>';

    var rejectionField = document.getElementById('rejectionNoteField');
    rejectionField.hidden = !(item && item.status === 'pending_approval' && state.user.role === 'MASTER');
    document.getElementById('rejectionNote').value = '';

    renderEditorActions(item);
    document.getElementById('editorOverlay').classList.add('is-open');
  }

  function setChipSelection(group, values) {
    document.querySelectorAll('.chip-select[data-group="' + group + '"] .chip-toggle').forEach(function (chip) {
      chip.classList.toggle('is-selected', values.indexOf(chip.dataset.value) > -1);
    });
  }

  function getChipSelection(group) {
    return Array.prototype.map.call(
      document.querySelectorAll('.chip-select[data-group="' + group + '"] .chip-toggle.is-selected'),
      function (c) { return c.dataset.value; }
    );
  }

  function closeEditor() {
    document.getElementById('editorOverlay').classList.remove('is-open');
  }

  function renderEditorActions(item) {
    var wrap = document.getElementById('editorActions');
    wrap.innerHTML = '';
    var isMaster = state.user.role === 'MASTER';

    if (item && item.status === 'pending_approval' && isMaster) {
      wrap.innerHTML =
        '<button class="btn btn--primary btn--sm" id="btnApprove" type="button">Approve</button>' +
        '<button class="btn btn--outline-ink btn--sm" id="btnReject" type="button">Reject</button>' +
        '<button class="btn btn--ghost" id="btnSaveEdits" type="button">Save Changes</button>';
      document.getElementById('btnApprove').addEventListener('click', function () { submitEditor('approve'); });
      document.getElementById('btnReject').addEventListener('click', function () { submitEditor('reject'); });
      document.getElementById('btnSaveEdits').addEventListener('click', function () { submitEditor(null); });
      return;
    }

    var submitLabel = isMaster ? 'Publish' : (state.approvalRequired ? 'Submit for Approval' : 'Publish');
    wrap.innerHTML =
      '<button class="btn btn--outline-ink btn--sm" id="btnSaveDraft" type="button">Save as Draft</button>' +
      '<button class="btn btn--primary btn--sm" id="btnSubmit" type="button">' + submitLabel + '</button>';
    document.getElementById('btnSaveDraft').addEventListener('click', function () { submitEditor('draft'); });
    document.getElementById('btnSubmit').addEventListener('click', function () { submitEditor('submit'); });
  }

  async function handleImageUpload(e) {
    var file = e.target.files[0];
    if (!file) return;
    var label = document.getElementById('imagePreviewWrap');
    label.innerHTML = '<span>Uploading…</span>';
    try {
      var res = await fetch('/api/uploads/image?filename=' + encodeURIComponent(file.name), {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      var data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed.');
      state.uploadedImageUrl = data.url;
      label.innerHTML = '<img src="' + data.url + '" alt="">';
    } catch (err) {
      Admin.toast(err.message, true);
      label.innerHTML = '<span id="imageDropLabel">Click to upload a JPG, PNG or WebP (max 8MB)</span>';
    }
  }

  async function submitEditor(action) {
    var title = document.getElementById('title').value.trim();
    if (!title) { Admin.toast('Design name is required.', true); return; }

    var source = document.querySelector('#sourceToggle .chip-toggle.is-selected').dataset.source;
    var instagramUrl = document.getElementById('instagramUrl').value.trim();
    if (source === 'instagram' && !instagramUrl && !state.editingId) {
      Admin.toast('An Instagram post URL is required.', true);
      return;
    }

    var payload = {
      title: title,
      style: getChipSelection('style'),
      shape: getChipSelection('shape')[0] || null,
      length: getChipSelection('length')[0] || null,
      color: getChipSelection('color'),
      finish: getChipSelection('finish')[0] || null,
      artStyle: getChipSelection('artStyle')[0] || null,
      recommendedService: document.getElementById('recommendedService').value || null,
      priceLabel: document.getElementById('priceLabel').value.trim() || null,
      imageUrl: state.uploadedImageUrl,
      featured: document.querySelector('.chip-toggle[data-flag="featured"]').classList.contains('is-selected'),
      seasonal: document.querySelector('.chip-toggle[data-flag="seasonal"]').classList.contains('is-selected'),
      trending: document.querySelector('.chip-toggle[data-flag="trending"]').classList.contains('is-selected'),
    };

    try {
      if (state.editingId) {
        if (action === 'approve' || action === 'reject') {
          payload.transition = action;
          if (action === 'reject') payload.rejectionNote = document.getElementById('rejectionNote').value.trim();
        } else if (action) {
          payload.transition = action;
        }
        await Admin.api('/api/portfolio/' + state.editingId, { method: 'PATCH', body: payload });
        Admin.toast('Saved.');
      } else {
        payload.source = source;
        payload.instagramUrl = source === 'instagram' ? instagramUrl : null;
        payload.action = action;
        await Admin.api('/api/portfolio', { method: 'POST', body: payload });
        Admin.toast(action === 'draft' ? 'Saved as draft.' : (state.approvalRequired && state.user.role !== 'MASTER' ? 'Submitted for approval.' : 'Published.'));
      }
      closeEditor();
      await loadItems();
    } catch (err) {
      Admin.toast(err.message, true);
    }
  }

  // -------------------------------------------------------------------
  // Delete (Master only, type-to-confirm)
  // -------------------------------------------------------------------

  var deleteTargetId = null;

  function wireDelete() {
    document.getElementById('deleteCancelBtn').addEventListener('click', function () {
      document.getElementById('deleteOverlay').classList.remove('is-open');
    });
    document.getElementById('deleteConfirmInput').addEventListener('input', function (e) {
      document.getElementById('deleteConfirmBtn').disabled = e.target.value !== 'DELETE';
    });
    document.getElementById('deleteConfirmBtn').addEventListener('click', async function () {
      try {
        await Admin.api('/api/portfolio/' + deleteTargetId, { method: 'DELETE', body: { confirm: true } });
        Admin.toast('Design deleted.');
        document.getElementById('deleteOverlay').classList.remove('is-open');
        await loadItems();
      } catch (err) {
        Admin.toast(err.message, true);
      }
    });
  }

  function openDeleteConfirm(item) {
    deleteTargetId = item.id;
    document.getElementById('deleteTargetLabel').textContent = 'BN-' + item.reference_number + ' — ' + item.title;
    document.getElementById('deleteConfirmInput').value = '';
    document.getElementById('deleteConfirmBtn').disabled = true;
    document.getElementById('deleteOverlay').classList.add('is-open');
  }

  function debounce(fn, ms) {
    var t;
    return function () { clearTimeout(t); var args = arguments; t = setTimeout(function () { fn.apply(null, args); }, ms); };
  }
})();
