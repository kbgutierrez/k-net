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

  // Force-hide scrollbar via injected style (catches any template overrides)
  const hideScrollbarStyle = document.createElement('style');
  hideScrollbarStyle.textContent = `
    .sidebar .nav.nav-primary::-webkit-scrollbar { width: 0px !important; background: transparent !important; }
    .sidebar .nav.nav-primary { scrollbar-width: none !important; -ms-overflow-style: none !important; }
  `;
  document.head.appendChild(hideScrollbarStyle);

  // Initialize
  closeMobileSidebar();
  closeMobileDrawer();
  updateFabVisibility();
  initActiveAccordion();

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => updateFabVisibility());
  }
})(jQuery));