
((($) => {
  const toggleSelector = '.sidebar .nav.nav-primary > .nav-item > a.module-toggle';
  const menuSelector = '.sidebar .nav.nav-primary > .nav-item > .module-submenu';
  const mobileFabSelector = '.mobile-nav-fab';
  const desktopFlyoutBackdropSelector = '.desktop-flyout-backdrop';
  const mobileDrawerSelector = '.mobile-nav-drawer';
  const mobileBackdropSelector = '.mobile-nav-backdrop';
  const mobileCloseSelector = '.mobile-nav-close';
  const mobileGroupToggleSelector = '.mobile-nav-group-toggle';
  const mobileGroupListSelector = '.mobile-nav-group-list';
  const MOBILE_BREAKPOINT = 991;
  let lastScrollY = window.scrollY || 0;

  const isMobileView = () => (window.innerWidth || document.documentElement.clientWidth) <= MOBILE_BREAKPOINT;

  const syncDesktopFlyoutState = () => {
    if (isMobileView()) {
      $('html').removeClass('desktop_flyout_open');
      return;
    }

    const hasOpenFlyout = $(`${menuSelector}.is-open`).length > 0;
    $('html').toggleClass('desktop_flyout_open', hasOpenFlyout);
  };

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

  const positionSidebarFlyout = ($trigger, $menu) => {
    if (!$trigger.length || !$menu.length) {
      return;
    }

    const rect = $trigger.get(0).getBoundingClientRect();
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const minWidth = 220;
    const preferredWidth = 270;

    let left = rect.right + 8;
    const availableRight = viewportWidth - left - 12;
    let width = Math.min(preferredWidth, Math.max(minWidth, availableRight));

    if (availableRight < minWidth) {
      width = Math.min(preferredWidth, Math.max(minWidth, rect.left - 20));
      left = Math.max(12, rect.left - width - 8);
    }

    const top = Math.max(10, rect.top - 2);
    const maxHeight = Math.max(180, viewportHeight - top - 16);

    $menu.css({
      top: `${top}px`,
      left: `${left}px`,
      width: `${width}px`,
      maxHeight: `${maxHeight}px`
    });
  };

  const findMenuById = (menuId) => $(`${menuSelector}[id="${menuId}"]`);

  const hideFlyout = ($trigger, $menu) => {
    const menuId = $menu.attr('id');
    $menu.removeClass('is-open').css({ top: '', left: '', width: '', maxHeight: '' });

    if (menuId) {
      $trigger.attr('aria-expanded', 'false');
      $menu.find('.module-submenu-link').attr('tabindex', '-1');
    }

    syncDesktopFlyoutState();
  };

  const showFlyout = ($trigger, $menu) => {
    $menu.addClass('is-open');
    if (!isMobileView()) {
      positionSidebarFlyout($trigger, $menu);
    }
    $trigger.attr('aria-expanded', 'true');
    $menu.find('.module-submenu-link').attr('tabindex', '0');
    syncDesktopFlyoutState();
  };

  const closeOtherFlyouts = (activeId) => {
    $(`${menuSelector}.is-open`).each(function () {
      const thisId = $(this).attr('id');
      if (thisId !== activeId) {
        const $trigger = $(`${toggleSelector}[data-target="${thisId}"]`);
        hideFlyout($trigger, $(this));
      }
    });
  };

  const focusNextToggle = ($current, step) => {
    const $toggles = $(toggleSelector);
    const index = $toggles.index($current);

    if (index < 0) {
      return;
    }

    let nextIndex = index + step;
    if (nextIndex < 0) {
      nextIndex = $toggles.length - 1;
    }
    if (nextIndex >= $toggles.length) {
      nextIndex = 0;
    }

    $toggles.eq(nextIndex).focus();
  };

  $(document).on('click', toggleSelector, function (e) {
    e.preventDefault();
    e.stopImmediatePropagation();

    const $trigger = $(this);
    const menuId = $trigger.attr('data-target');
    if (!menuId) {
      return;
    }

    const $menu = findMenuById(menuId);
    if (!$menu.length) {
      return;
    }

    if ($menu.hasClass('is-open')) {
      hideFlyout($trigger, $menu);
      return;
    }

    closeOtherFlyouts(menuId);
    showFlyout($trigger, $menu);
  });

  $(document).on('keydown', toggleSelector, function (e) {
    const $trigger = $(this);
    const menuId = $trigger.attr('data-target');
    const $menu = findMenuById(menuId);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusNextToggle($trigger, 1);
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusNextToggle($trigger, -1);
      return;
    }

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (!$menu.hasClass('is-open')) {
        closeOtherFlyouts(menuId);
        showFlyout($trigger, $menu);
      }
      $menu.find('.module-submenu-link').first().focus();
      return;
    }

    if (e.key === 'ArrowLeft' || e.key === 'Escape') {
      e.preventDefault();
      hideFlyout($trigger, $menu);
      return;
    }

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      $trigger.trigger('click');
    }
  });

  $(document).on('keydown', menuSelector, function (e) {
    if (e.key === 'Escape') {
      const menuId = $(this).attr('id');
      const $trigger = $(`${toggleSelector}[data-target="${menuId}"]`);
      hideFlyout($trigger, $(this));
      $trigger.focus();
    }
  });

  $(document).on('click', '.sidebar .module-submenu-link', function () {
    const $menu = $(this).closest('.module-submenu');
    const menuId = $menu.attr('id');
    const $trigger = $(`${toggleSelector}[data-target="${menuId}"]`);
    hideFlyout($trigger, $menu);

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

  $(document).on('click', desktopFlyoutBackdropSelector, function () {
    closeOtherFlyouts('__none__');
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
    $(`${menuSelector}.is-open`).each(function () {
      const menuId = $(this).attr('id');
      const $trigger = $(`${toggleSelector}[data-target="${menuId}"]`);
      if (isMobileView()) {
        $(this).css({ top: '', left: '', width: '', maxHeight: '' });
      } else {
        positionSidebarFlyout($trigger, $(this));
      }
    });

    if (isMobileView()) {
      $('.wrapper.overlay-sidebar').removeClass('is-show');
      updateFabVisibility();
    } else {
      closeMobileDrawer();
      $(`${mobileGroupListSelector}.is-open`).removeClass('is-open');
      $(mobileGroupToggleSelector).attr('aria-expanded', 'false');
    }

    syncDesktopFlyoutState();
  });

  $('.sidebar .nav.nav-primary').on('scroll', () => {
    if (isMobileView()) {
      return;
    }

    $(`${menuSelector}.is-open`).each(function () {
      const menuId = $(this).attr('id');
      const $trigger = $(`${toggleSelector}[data-target="${menuId}"]`);
      positionSidebarFlyout($trigger, $(this));
    });
  });

  $(document).on('click', (e) => {
    const clickedInsideItem = $(e.target).closest('.sidebar .nav.nav-primary > .nav-item').length > 0;
    const clickedInsideOpenMenu = $(e.target).closest(`${menuSelector}.is-open`).length > 0;

    if (!clickedInsideItem && !clickedInsideOpenMenu) {
      closeOtherFlyouts('__none__');
    }
  });

  // Start with a fully closed drawer on mobile so no sidebar strip is visible.
  closeMobileSidebar();
  closeMobileDrawer();
  updateFabVisibility();
  syncDesktopFlyoutState();

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => updateFabVisibility());
  }
})(jQuery));
