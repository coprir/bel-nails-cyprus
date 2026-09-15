/* Shared admin shell: session guard, role-aware sidebar, fetch helper.
   Loaded on every /admin page except login.html. The nav items shown here
   are a UX convenience only — every one of these routes is independently
   protected server-side (see api/_lib/auth.js requireAuth), so hiding a
   link here is not what keeps a Deputy out of it. */
(function () {
  'use strict';

  var NAV_ITEMS = [
    { href: 'dashboard.html', label: 'Dashboard', roles: ['MASTER', 'DEPUTY'] },
    { href: 'portfolio.html', label: 'Portfolio', roles: ['MASTER', 'DEPUTY'] },
    { href: 'administrators.html', label: 'Administrators', roles: ['MASTER'], section: 'Master Control' },
    { href: 'activity.html', label: 'Activity Log', roles: ['MASTER'], section: 'Master Control' },
    { href: 'settings.html', label: 'Settings', roles: ['MASTER'], section: 'Master Control' },
    { href: 'profile.html', label: 'My Profile', roles: ['MASTER', 'DEPUTY'], section: 'Account' },
  ];

  async function api(path, options) {
    options = options || {};
    var headers = Object.assign({}, options.headers || {});
    var body = options.body;
    if (body && typeof body === 'object' && !(body instanceof Blob) && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(body);
    }
    var res = await fetch(path, {
      method: options.method || 'GET',
      credentials: 'same-origin',
      headers: headers,
      body: body,
    });

    if (res.status === 401 && !location.pathname.endsWith('/admin/login.html')) {
      location.href = 'login.html?reason=session_expired';
      return new Promise(function () {}); // never resolves — we're navigating away
    }

    var data = null;
    try { data = await res.json(); } catch (e) { /* no body */ }

    if (!res.ok) {
      var message = (data && data.error) || ('Request failed (' + res.status + ')');
      throw new Error(message);
    }
    return data;
  }

  function toast(message, isError) {
    var el = document.getElementById('adminToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'adminToast';
      el.className = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.toggle('is-error', Boolean(isError));
    el.classList.add('is-visible');
    clearTimeout(el._timer);
    el._timer = setTimeout(function () { el.classList.remove('is-visible'); }, 3200);
  }

  function renderShell(user) {
    var page = document.body.dataset.page;
    var isMaster = user.role === 'MASTER';

    var navHtml = '';
    var lastSection = null;
    NAV_ITEMS.forEach(function (item) {
      if (item.roles.indexOf(user.role) === -1) return;
      if (item.section && item.section !== lastSection) {
        navHtml += '<div class="admin-nav__section">' + item.section + '</div>';
        lastSection = item.section;
      }
      var active = item.href.replace('.html', '') === page ? ' is-active' : '';
      navHtml += '<a href="' + item.href + '" class="nav-link' + active + '">' + item.label + '</a>';
    });

    var shell = document.createElement('div');
    shell.className = 'admin-shell';
    shell.innerHTML =
      '<div class="admin-sidebar-overlay" id="sidebarOverlay"></div>' +
      '<aside class="admin-sidebar" id="adminSidebar">' +
        '<div class="admin-sidebar__brand">' +
          '<span class="brand-mark">Bel <strong>N</strong>ails</span>' +
          '<span class="admin-sidebar__role admin-sidebar__role--' + (isMaster ? 'master' : 'deputy') + '">' +
            (isMaster ? 'Master Control' : 'Business Management') +
          '</span>' +
        '</div>' +
        '<nav class="admin-nav">' + navHtml + '</nav>' +
        '<div class="admin-sidebar__footer">' +
          '<button class="btn btn--outline-light btn--sm" id="logoutBtn" type="button">Log Out</button>' +
        '</div>' +
      '</aside>' +
      '<div class="admin-main">' +
        '<header class="admin-topbar">' +
          '<div style="display:flex;align-items:center;gap:.75rem;">' +
            '<button class="admin-topbar__menu-btn" id="menuBtn" type="button" aria-label="Open menu">' +
              '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M3.5 6.5h17M3.5 12h17M3.5 17.5h17"/></svg>' +
            '</button>' +
            '<h1 class="admin-topbar__title" id="pageTitle"></h1>' +
          '</div>' +
          '<div class="admin-topbar__user">' +
            '<span>' + escapeHtml(user.name) + '</span>' +
            '<a href="profile.html">My Profile</a>' +
          '</div>' +
        '</header>' +
        '<main class="admin-content" id="adminContent"></main>' +
      '</div>';

    // Move any page-authored content into #adminContent, then swap it in.
    var pageContent = document.getElementById('pageContent');
    document.body.insertBefore(shell, document.body.firstChild);
    if (pageContent) {
      shell.querySelector('#adminContent').appendChild(pageContent);
      pageContent.hidden = false;
    }

    var titleEl = document.getElementById('pageTitle');
    if (titleEl) titleEl.textContent = document.title.split('|')[0].trim();

    var sidebar = document.getElementById('adminSidebar');
    var overlay = document.getElementById('sidebarOverlay');
    document.getElementById('menuBtn').addEventListener('click', function () {
      sidebar.classList.add('is-open');
      overlay.classList.add('is-open');
    });
    overlay.addEventListener('click', function () {
      sidebar.classList.remove('is-open');
      overlay.classList.remove('is-open');
    });
    document.getElementById('logoutBtn').addEventListener('click', async function () {
      await api('/api/auth/logout', { method: 'POST' }).catch(function () {});
      location.href = 'login.html';
    });
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  /** Call at the top of every protected admin page:
   *  Admin.requireSession(['MASTER']).then(function(user) { ...page code... });
   *  Redirects to login if not authenticated, or to dashboard.html with a
   *  toast if authenticated but the wrong role for this page. */
  async function requireSession(allowedRoles) {
    var data;
    try {
      data = await api('/api/auth/me');
    } catch (e) {
      location.href = 'login.html';
      return new Promise(function () {});
    }
    var user = data.user;
    if (user.mustChangePassword && !location.pathname.endsWith('/admin/profile.html')) {
      location.href = 'profile.html?forcePasswordChange=1';
      return new Promise(function () {});
    }
    if (allowedRoles && allowedRoles.indexOf(user.role) === -1) {
      location.href = 'dashboard.html';
      return new Promise(function () {});
    }
    renderShell(user);
    return user;
  }

  window.Admin = { api: api, toast: toast, requireSession: requireSession, escapeHtml: escapeHtml };
})();
