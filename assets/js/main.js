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

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => updateFabVisibility());
  }
})(jQuery));