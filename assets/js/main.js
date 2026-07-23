((($) => {
  const toggleSelector = '.sidebar .nav.nav-primary > .nav-item > a.module-toggle';
  const menuSelector = '.sidebar .nav.nav-primary > .nav-item > .module-submenu';
  const mobileFabSelector = '.mobile-nav-fab';
  const mobileDrawerSelector = '.mobile-nav-drawer';
  const mobileBackdropSelector = '.mobile-nav-backdrop';
  const mobileCloseSelector = '.mobile-nav-close';
  const mobileGroupToggleSelector = '.mobile-nav-group-toggle';
  const mobileGroupListSelector = '.mobile-nav-group-list';
  const MOBILE_BREAKPOINT = 991;
  let lastScrollY = window.scrollY || 0;

  const isMobileView = () => (window.innerWidth || document.documentElement.clientWidth) <= MOBILE_BREAKPOINT;

  const closeMobileSidebar = () => {
    if (!isMobileView()) {
      return;
    }
    $('html').removeClass('nav_open');
    $('.wrapper.overlay-sidebar').removeClass('is-show');
    $('.sidenav-overlay-toggler, .sidenav-toggler').removeClass('toggled');
  };

  const closeMobileDrawer = () => {
    $('html').removeClass('mobile_nav_open');
    updateFabVisibility();
  };

  const openMobileDrawer = () => {
    if (!isMobileView()) {
      return;
    }
    closeMobileSidebar();
    $('html').addClass('mobile_nav_open');
    updateFabVisibility();
  };

  const isKeyboardOpen = () => {
    if (!window.visualViewport) {
      return false;
    }
    return (window.innerHeight - window.visualViewport.height) > 140;
  };

  const hasBlockingOverlay = () => $('.modal.show, .swal2-container.swal2-shown').length > 0;

  const shouldHideFab = () => {
    if (!isMobileView()) {
      return true;
    }
    if ($('html').hasClass('mobile_nav_open')) {
      return true;
    }
    return isKeyboardOpen() || hasBlockingOverlay();
  };

  const updateFabVisibility = (forceHide = null) => {
    const $fab = $(mobileFabSelector);
    if (!$fab.length) {
      return;
    }
    const hideFab = forceHide === null ? shouldHideFab() : forceHide;
    $fab.toggleClass('is-hidden', hideFab);
  };

  // Desktop sidebar accordion helpers
  const closeDesktopAccordion = ($menu, $trigger) => {
    if (!$menu.length || !$menu.hasClass('is-open')) return;
    $trigger.attr('aria-expanded', 'false');
    $menu.find('.module-submenu-link').attr('tabindex', '-1');
    $menu.slideUp(200, function() {
      $(this).removeClass('is-open');
    });
  };

  const openDesktopAccordion = ($menu, $trigger) => {
    if (!$menu.length || $menu.hasClass('is-open')) return;

    // Close all other open menus (accordion behavior)
    $(`${menuSelector}.is-open`).each(function () {
      const thisId = $(this).attr('id');
      if (thisId !== $menu.attr('id')) {
        const $otherTrigger = $(`${toggleSelector}[data-target="${thisId}"]`);
        closeDesktopAccordion($(this), $otherTrigger);
      }
    });

    $trigger.attr('aria-expanded', 'true');
    $menu.find('.module-submenu-link').attr('tabindex', '0');
    $menu.slideDown(200, function() {
      $(this).addClass('is-open');
      // Bring the section you just opened to the top of the visible
      // sidebar area, so it doesn't just vanish below the fold when
      // an earlier section's submenu pushed it down. Scrolled
      // explicitly on the known nav container (not scrollIntoView,
      // which can pick the wrong scrollable ancestor and move the
      // whole page instead of just this list).
      const $navList = $trigger.closest('.nav.nav-primary');
      const $li = $trigger.closest('.nav-item');
      if ($navList.length && $li.length) {
        const targetScrollTop = $navList.scrollTop() + ($li.position().top - $navList.position().top);
        $navList.stop(true).animate({ scrollTop: Math.max(0, targetScrollTop) }, 200);
      }
    });
  };

  // Desktop sidebar accordion toggle
  $(document).on('click', toggleSelector, function (e) {
    e.preventDefault();
    e.stopImmediatePropagation();

    const $trigger = $(this);
    const menuId = $trigger.attr('data-target');
    if (!menuId) return;

    const $menu = $(`${menuSelector}[id="${menuId}"]`);
    if (!$menu.length) return;

    if ($menu.hasClass('is-open')) {
      closeDesktopAccordion($menu, $trigger);
    } else {
      openDesktopAccordion($menu, $trigger);
    }
  });

  // Keyboard navigation for desktop accordion
  $(document).on('keydown', toggleSelector, function (e) {
    const $trigger = $(this);
    const menuId = $trigger.attr('data-target');
    const $menu = $(`${menuSelector}[id="${menuId}"]`);
    const $toggles = $(toggleSelector);
    const idx = $toggles.index($trigger);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = $toggles.eq((idx + 1) % $toggles.length);
      next.focus();
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = $toggles.eq((idx - 1 + $toggles.length) % $toggles.length);
      prev.focus();
      return;
    }

    if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!$menu.hasClass('is-open')) {
        openDesktopAccordion($menu, $trigger);
      }
      // Move focus to first submenu link
      setTimeout(() => $menu.find('.module-submenu-link').first().focus(), 0);
      return;
    }

    if (e.key === 'ArrowLeft' || e.key === 'Escape') {
      e.preventDefault();
      if ($menu.hasClass('is-open')) {
        closeDesktopAccordion($menu, $trigger);
      }
      return;
    }
  });

  $(document).on('keydown', menuSelector, function (e) {
    if (e.key === 'Escape') {
      const menuId = $(this).attr('id');
      const $trigger = $(`${toggleSelector}[data-target="${menuId}"]`);
      closeDesktopAccordion($(this), $trigger);
      $trigger.focus();
    }
  });

  $(document).on('click', '.sidebar .module-submenu-link', function () {
    closeMobileSidebar();
  });

  $(document).on('click', '.sidebar .nav.nav-primary > .nav-item > a:not(.module-toggle)', function () {
    closeMobileSidebar();
  });

  $(document).on('click', mobileFabSelector, function (e) {
    e.preventDefault();
    if ($('html').hasClass('mobile_nav_open')) {
      closeMobileDrawer();
      return;
    }
    openMobileDrawer();
  });

  $(document).on('click', `${mobileBackdropSelector}, ${mobileCloseSelector}`, function () {
    closeMobileDrawer();
  });

  // Mobile accordion
  $(document).on('click', mobileGroupToggleSelector, function () {
    const $toggle = $(this);
    const menuId = $toggle.attr('data-target');
    const $target = $(`${mobileGroupListSelector}[id="${menuId}"]`);
    const isOpen = $target.hasClass('is-open');

    $(`${mobileGroupListSelector}.is-open`).removeClass('is-open');
    $(mobileGroupToggleSelector).attr('aria-expanded', 'false');

    if (!isOpen) {
      $target.addClass('is-open');
      $toggle.attr('aria-expanded', 'true');
    }
  });

  $(document).on('click', '.mobile-nav-home, .mobile-nav-module-link, .mobile-nav-lsbiz', function () {
    closeMobileDrawer();
  });

  $(window).on('scroll', () => {
    if (!isMobileView() || $('html').hasClass('mobile_nav_open')) {
      return;
    }
    const currentY = window.scrollY || 0;
    const delta = currentY - lastScrollY;
    if (delta > 8 && currentY > 40) {
      updateFabVisibility(true);
    } else if (delta < -8) {
      updateFabVisibility(false);
    }
    lastScrollY = currentY;
  });

  $(document).on('focusin', 'input, textarea, select, [contenteditable="true"]', () => {
    if (isMobileView()) {
      updateFabVisibility(true);
    }
  });

  $(document).on('focusout', 'input, textarea, select, [contenteditable="true"]', () => {
    if (isMobileView()) {
      setTimeout(() => updateFabVisibility(), 120);
    }
  });

  $(document).on('keydown', function (e) {
    if (e.key === 'Escape') {
      closeMobileSidebar();
      closeMobileDrawer();
    }
  });

  $(window).on('resize', () => {
    if (isMobileView()) {
      $('.wrapper.overlay-sidebar').removeClass('is-show');
      updateFabVisibility();
    } else {
      closeMobileDrawer();
      $(`${mobileGroupListSelector}.is-open`).removeClass('is-open');
      $(mobileGroupToggleSelector).attr('aria-expanded', 'false');
    }
  });

  // Auto-open accordion for current active page
  const initActiveAccordion = () => {
    const currentHref = window.location.href;
    let opened = false;
    $('.sidebar .module-submenu-link').each(function () {
      const linkHref = $(this).attr('href');
      if (!opened && linkHref && currentHref.indexOf(linkHref) !== -1) {
        const $menu = $(this).closest('.module-submenu');
        const menuId = $menu.attr('id');
        const $trigger = $(`${toggleSelector}[data-target="${menuId}"]`);
        if ($menu.length && $trigger.length && !$menu.hasClass('is-open')) {
          $trigger.attr('aria-expanded', 'true');
          $menu.find('.module-submenu-link').attr('tabindex', '0');
          $menu.addClass('is-open').css('display', 'block');
          opened = true;
        }
      }
    });
  };

  // Header notification bell — a general activity feed (submissions
  // routed to you as an approver, decisions on your own requests,
  // payment advised/released), loaded globally on every page since
  // the bell lives in the shared header. Backed by tbl_notification_log,
  // the same log every notify_event() call across the system already
  // writes to — so this isn't a separate feature to keep in sync, it's
  // just surfacing data that already exists.
  const NOTIF_EVENT_META = {
    TXN_SUBMITTED: { icon: 'fa-paper-plane', cls: 'notif-primary' },
    TXN_STEP_APPROVED: { icon: 'fa-check', cls: 'notif-info' },
    TXN_FULLY_APPROVED: { icon: 'fa-check-circle', cls: 'notif-success' },
    TXN_REJECTED: { icon: 'fa-times-circle', cls: 'notif-danger' },
    PAYMENT_ADVISED: { icon: 'fa-hand-holding-usd', cls: 'notif-warning' },
    PAYMENT_RELEASED: { icon: 'fa-money-bill-wave', cls: 'notif-success' },
  };
  const NOTIF_DEFAULT_META = { icon: 'fa-bell', cls: 'notif-secondary' };

  const escapeHtmlNotif = (value) => String(value === null || value === undefined ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const notifRouteForReference = (referenceNo, isApprover, isPending) => {
    const ref = String(referenceNo || '');

    // Whether THIS user is currently an approver on THIS specific
    // reference decides the destination, not the event type alone —
    // the same event (e.g. fully approved) is sent both to the
    // original requester (no approver rights on their own request —
    // Approvals review returns nothing for them; must use their own
    // module's view page, which checks ownership instead) and, for
    // other events, to approvers further down the chain (who have no
    // ownership row and must use Approvals review instead).
    if (isApprover) {
      const base = `transactions/approvals/review/${encodeURIComponent(ref)}`;
      // Anything other than the live "it's your turn" entry is a
      // decided/historical item — Approvals review needs ?mode=past
      // to load it read-only, same as the Past Approvals tab's own
      // View button does.
      return isPending ? base : `${base}?mode=past`;
    }

    if (ref.startsWith('CA')) return `transactions/cash-advance/view/${encodeURIComponent(ref)}`;
    if (ref.startsWith('RPL')) return `transactions/replenishment/view/${encodeURIComponent(ref)}`;
    if (ref.startsWith('RMB')) return `transactions/reimbursement/view/${encodeURIComponent(ref)}`;
    if (ref.startsWith('LQ')) return `transactions/liquidation/view/${encodeURIComponent(ref)}`;
    return `transactions/approvals/review/${encodeURIComponent(ref)}`;
  };

  const notifRelativeTime = (rawDate) => {
    if (!rawDate) return '';
    const then = new Date(String(rawDate).replace(' ', 'T'));
    if (Number.isNaN(then.getTime())) return '';
    const diffMs = Date.now() - then.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return then.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
  };

  const NOTIF_LAST_SEEN_KEY = 'knet_notif_last_seen';

  const getNotifLastSeen = () => {
    try {
      const raw = window.localStorage.getItem(NOTIF_LAST_SEEN_KEY);
      if (!raw) return null;
      const d = new Date(raw);
      return Number.isNaN(d.getTime()) ? null : d;
    } catch (e) {
      return null;
    }
  };

  const setNotifLastSeen = (isoString) => {
    try {
      window.localStorage.setItem(NOTIF_LAST_SEEN_KEY, isoString);
    } catch (e) {
      // Storage unavailable (private mode, quota, etc.) — badge just
      // won't persist across reloads, not worth failing over.
    }
  };

  let notifState = { rows: [] };

  const renderHeaderNotifications = (rows) => {
    const badge = document.getElementById('notifBadgeCount');
    const titleCount = document.getElementById('notifTitleCount');
    const center = document.getElementById('notif-center');
    if (!center) return;

    notifState.rows = rows;

    const count = rows.length;
    const lastSeen = getNotifLastSeen();
    const unseenCount = lastSeen
      ? rows.filter((row) => {
        const d = new Date(String(row.sent_date || '').replace(' ', 'T'));
        return !Number.isNaN(d.getTime()) && d > lastSeen;
      }).length
      : count;

    if (badge) {
      badge.textContent = String(unseenCount);
      badge.classList.toggle('d-none', unseenCount === 0);
    }
    if (titleCount) {
      titleCount.textContent = String(count);
    }

    if (count === 0) {
      center.innerHTML = '<div class="text-center kna-small text-muted py-3">No recent notifications.</div>';
      return;
    }

    center.innerHTML = rows.map((row) => {
      const meta = NOTIF_EVENT_META[row.event_code] || NOTIF_DEFAULT_META;
      const referenceNo = escapeHtmlNotif(row.reference_no || '');
      const subject = escapeHtmlNotif(row.subject || row.event_code || 'Notification');
      const url = `${base_url}${notifRouteForReference(row.reference_no, Number(row.is_approver) === 1, Number(row.is_pending) === 1)}`;
      return `
        <a href="${url}">
          <div class="notif-icon ${meta.cls}"><i class="fas ${meta.icon}"></i></div>
          <div class="notif-content">
            <span class="block">
              <span class="notif-requester">${subject}</span>
            </span>
            <span class="time">${escapeHtmlNotif(notifRelativeTime(row.sent_date))}</span>
          </div>
        </a>
      `;
    }).join('');
  };

  const loadHeaderNotifications = () => {
    if (typeof ajax_loader !== 'function' || !document.getElementById('notif-center')) {
      return;
    }
    ajax_loader('notifications/api/get/recent', {}).done((response) => {
      const res = (typeof response === 'string') ? JSON.parse(response) : response;
      if (!res || res.status !== 'success') return;
      const rows = Array.isArray(res.data) ? res.data : [];
      renderHeaderNotifications(rows);
    }).fail(() => {});
  };

  // Opening the bell marks everything currently loaded as "seen" —
  // the badge clears immediately and stays cleared on the next visit
  // until a newer notification arrives.
  $(document).on('shown.bs.dropdown', '.nav-item.dropdown:has(#notifDropdown)', () => {
    const latest = notifState.rows.reduce((max, row) => {
      const d = new Date(String(row.sent_date || '').replace(' ', 'T'));
      if (Number.isNaN(d.getTime())) return max;
      return (!max || d > max) ? d : max;
    }, null);
    setNotifLastSeen((latest || new Date()).toISOString());
    const badge = document.getElementById('notifBadgeCount');
    if (badge) {
      badge.textContent = '0';
      badge.classList.add('d-none');
    }
  });

  // Force-hide scrollbar via injected style (catches any template overrides)
  const hideScrollbarStyle = document.createElement('style');
  hideScrollbarStyle.textContent = `
    .sidebar .nav.nav-primary::-webkit-scrollbar { width: 0px !important; background: transparent !important; }
    .sidebar .nav.nav-primary { scrollbar-width: none !important; -ms-overflow-style: none !important; }
  `;
  document.head.appendChild(hideScrollbarStyle);

  const pdfPreviewOverlay = document.getElementById('knetPdfPreviewOverlay');
  const pdfPreviewIframe = document.getElementById('knetPdfPreviewIframe');
  const pdfPreviewClose = document.getElementById('knetPdfPreviewClose');

  const closePdfPreview = () => {
    if (pdfPreviewOverlay) pdfPreviewOverlay.classList.add('d-none');
    if (pdfPreviewIframe) pdfPreviewIframe.src = 'about:blank';
  };

  const buildHiddenForm = (form, actionUrl, params) => {
    form.innerHTML = '';
    form.action = actionUrl;
    Object.keys(params || {}).forEach((key) => {
      const values = Array.isArray(params[key]) ? params[key] : [params[key]];
      values.forEach((value) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });
    });
  };

  window.openPdfPreviewByUrl = (previewUrl) => {
    if (!pdfPreviewOverlay || !pdfPreviewIframe) return;
    pdfPreviewIframe.src = previewUrl;
    pdfPreviewOverlay.classList.remove('d-none');
  };

  window.openPdfPreviewByForm = (actionUrl, params) => {
    if (!pdfPreviewOverlay || !pdfPreviewIframe) return;

    const previewForm = document.createElement('form');
    previewForm.method = 'POST';
    previewForm.target = 'knetPdfPreviewIframe';
    previewForm.classList.add('d-none');
    buildHiddenForm(previewForm, actionUrl, Object.assign({}, params, { preview: 1 }));
    document.body.appendChild(previewForm);
    previewForm.submit();
    previewForm.remove();

    pdfPreviewOverlay.classList.remove('d-none');
  };

  if (pdfPreviewClose) pdfPreviewClose.addEventListener('click', closePdfPreview);
  if (pdfPreviewOverlay) {
    pdfPreviewOverlay.addEventListener('click', (e) => {
      if (e.target === pdfPreviewOverlay) closePdfPreview();
    });
  }

  /* ─── Global Quick Search (navbar) ── */
  const GSEARCH_TYPE_META = {
    CASH_ADVANCE: { icon: 'fa-hand-holding-usd', cls: 'type-cash-advance', label: 'Cash Advance' },
    LIQUIDATION: { icon: 'fa-receipt', cls: 'type-liquidation', label: 'Liquidation' },
    REIMBURSEMENT: { icon: 'fa-wallet', cls: 'type-reimbursement', label: 'Reimbursement' },
    REPLENISHMENT: { icon: 'fa-sync-alt', cls: 'type-replenishment', label: 'Replenishment' },
  };

  let gsearchDebounceTimer = null;
  let gsearchRequestId = 0;

  const gsearchFormatPHP = (amount) =>
    Number(amount || 0).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' });

  const closeGlobalSearchResults = () => {
    const panel = document.getElementById('kna-gsearch-results');
    if (panel) panel.classList.add('d-none');
  };

  /* ─── Favorite modules (Quick Links) — shared cache used by both the
     search dropdown's star toggle and the dashboard's Quick Links card. */
  let favoriteModuleRoutes = new Set();

  const moduleIconFor = (moduleName) => {
    const n = String(moduleName || '').toLowerCase();
    if (n.includes('cash advance')) return 'fa-hand-holding-usd';
    if (n.includes('liquidation')) return 'fa-receipt';
    if (n.includes('reimburs')) return 'fa-wallet';
    if (n.includes('replenish') || n.includes('revolving')) return 'fa-sync-alt';
    if (n.includes('approval')) return 'fa-check-circle';
    if (n.includes('report')) return 'fa-chart-bar';
    if (n.includes('notification')) return 'fa-bell';
    if (n.includes('expense type')) return 'fa-tags';
    return 'fa-th-large';
  };

  const loadFavoriteModules = () => {
    if (typeof ajax_loader !== 'function') return;
    ajax_loader('dashboard/api/favorites/list', {}).done((response) => {
      const res = (typeof response === 'string') ? JSON.parse(response) : response;
      const rows = (res && res.status === 'success' && Array.isArray(res.data)) ? res.data : [];
      favoriteModuleRoutes = new Set(rows.map((r) => r.module_route));
      document.dispatchEvent(new CustomEvent('knet:favorites-loaded', { detail: { rows } }));
    }).fail(() => {});
  };

  const toggleFavoriteModule = (moduleName, moduleRoute, moduleGroup) => {
    if (typeof ajax_loader !== 'function' || !moduleRoute) return;
    ajax_loader('dashboard/api/favorites/toggle', {
      ModuleName: moduleName || '',
      ModuleRoute: moduleRoute,
      ModuleGroup: moduleGroup || '',
    }).done((response) => {
      const res = (typeof response === 'string') ? JSON.parse(response) : response;
      if (!res || res.status !== 'success') return;
      const isFavorite = !!(res.data && res.data.is_favorite);
      if (isFavorite) {
        favoriteModuleRoutes.add(moduleRoute);
      } else {
        favoriteModuleRoutes.delete(moduleRoute);
      }
      document.querySelectorAll('.kna-gsearch-fav-btn').forEach((btn) => {
        if (btn.dataset.route === moduleRoute) {
          btn.classList.toggle('is-favorite', isFavorite);
          btn.querySelector('i').className = isFavorite ? 'fas fa-star' : 'far fa-star';
          btn.title = isFavorite ? 'Remove from Quick Links' : 'Add to Quick Links';
        }
      });
      document.dispatchEvent(new CustomEvent('knet:favorites-updated', {
        detail: { route: moduleRoute, name: moduleName, group: moduleGroup, isFavorite },
      }));
    }).fail(() => {});
  };

  window.knetFavorites = {
    routes: () => favoriteModuleRoutes,
    load: loadFavoriteModules,
    toggle: toggleFavoriteModule,
  };

  const renderGlobalSearchResults = (rows, keyword) => {
    const panel = document.getElementById('kna-gsearch-results');
    if (!panel) return;

    if (!rows.length) {
      panel.innerHTML = `<div class="kna-gsearch-empty">No matches for "${escapeHtmlNotif(keyword)}"</div>`;
      panel.classList.remove('d-none');
      return;
    }

    panel.innerHTML = rows.map((row) => {
      if (row.transaction_type === 'MODULE') {
        const name = row.module_name || row.description || '';
        const route = row.module_route || '';
        const group = row.module_group || row.requester_name || '';
        const isFav = favoriteModuleRoutes.has(route);
        const url = `${base_url}${route}`;
        return `
          <div class="kna-gsearch-item kna-gsearch-module">
            <a href="${url}" class="kna-gsearch-module-link">
              <div class="kna-gsearch-icon-badge type-module"><i class="fas ${moduleIconFor(name)}"></i></div>
              <div class="kna-gsearch-main">
                <div class="kna-gsearch-ref">${escapeHtmlNotif(name)}</div>
                <div class="kna-gsearch-desc">Module · ${escapeHtmlNotif(group)}</div>
              </div>
            </a>
            <button type="button" class="kna-gsearch-fav-btn ${isFav ? 'is-favorite' : ''}" data-route="${escapeHtmlNotif(route)}" data-name="${escapeHtmlNotif(name)}" data-group="${escapeHtmlNotif(group)}" title="${isFav ? 'Remove from Quick Links' : 'Add to Quick Links'}">
              <i class="${isFav ? 'fas' : 'far'} fa-star"></i>
            </button>
          </div>
        `;
      }

      const meta = GSEARCH_TYPE_META[row.transaction_type] || { icon: 'fa-file-invoice', cls: '', label: row.transaction_type };
      const isApprover = Number(row.is_approver) === 1;
      const isPending = Number(row.is_pending) === 1;
      const url = `${base_url}${notifRouteForReference(row.reference_no, isApprover, isPending)}`;
      return `
        <a href="${url}" class="kna-gsearch-item">
          <div class="kna-gsearch-icon-badge ${meta.cls}"><i class="fas ${meta.icon}"></i></div>
          <div class="kna-gsearch-main">
            <div class="kna-gsearch-ref">${escapeHtmlNotif(row.reference_no)}</div>
            <div class="kna-gsearch-desc">${escapeHtmlNotif(meta.label)} · ${escapeHtmlNotif(row.description || row.requester_name || '')}</div>
          </div>
          <div class="kna-gsearch-side">
            <div class="kna-gsearch-amount">${gsearchFormatPHP(row.amount)}</div>
            <div class="kna-gsearch-status">${escapeHtmlNotif(row.status_name || '')}</div>
          </div>
        </a>
      `;
    }).join('');
    panel.classList.remove('d-none');
  };

  const runGlobalSearch = (keyword) => {
    const panel = document.getElementById('kna-gsearch-results');
    if (!panel) return;

    if (keyword.length < 2) {
      panel.innerHTML = '<div class="kna-gsearch-hint">Keep typing… (min. 2 characters)</div>';
      panel.classList.remove('d-none');
      return;
    }

    const requestId = ++gsearchRequestId;
    ajax_loader('dashboard/api/global-search', { Keyword: keyword }).done((response) => {
      if (requestId !== gsearchRequestId) return; // a newer keystroke's request already landed
      const res = (typeof response === 'string') ? JSON.parse(response) : response;
      const rows = (res && res.status === 'success' && Array.isArray(res.data)) ? res.data : [];
      renderGlobalSearchResults(rows, keyword);
    }).fail(() => {
      if (requestId !== gsearchRequestId) return;
      panel.innerHTML = '<div class="kna-gsearch-empty">Search failed. Please try again.</div>';
      panel.classList.remove('d-none');
    });
  };

  const initGlobalSearch = () => {
    const input = document.getElementById('kna-gsearch-input');
    const panel = document.getElementById('kna-gsearch-results');
    if (!input || !panel || typeof ajax_loader !== 'function') return;

    input.addEventListener('input', () => {
      const keyword = input.value.trim();
      clearTimeout(gsearchDebounceTimer);
      if (!keyword) { closeGlobalSearchResults(); return; }
      gsearchDebounceTimer = setTimeout(() => runGlobalSearch(keyword), 300);
    });

    input.addEventListener('focus', () => {
      if (input.value.trim().length >= 2) panel.classList.remove('d-none');
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { closeGlobalSearchResults(); input.blur(); }
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.kna-gsearch-wrap')) closeGlobalSearchResults();
    });

    panel.addEventListener('click', (e) => {
      const favBtn = e.target.closest('.kna-gsearch-fav-btn');
      if (!favBtn) return;
      e.preventDefault();
      e.stopPropagation();
      toggleFavoriteModule(favBtn.dataset.name, favBtn.dataset.route, favBtn.dataset.group);
    });
  };

  // Initialize
  closeMobileSidebar();
  closeMobileDrawer();
  updateFabVisibility();
  initActiveAccordion();

  // Deferred to DOMContentLoaded: helper.ajax.loader.js (defines
  // ajax_loader) is included further down in main.php's body than
  // this script, so it isn't defined yet at this point in main.js's
  // own top-to-bottom execution. By DOMContentLoaded every
  // synchronous script in the page — including that one — has
  // already run.
  document.addEventListener('DOMContentLoaded', loadHeaderNotifications);
  document.addEventListener('DOMContentLoaded', initGlobalSearch);
  document.addEventListener('DOMContentLoaded', loadFavoriteModules);

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => updateFabVisibility());
  }
})(jQuery));