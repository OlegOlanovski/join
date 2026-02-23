/** @type {number} */
const MOBILE_BP = 680;

/**
 * Determines whether the viewport is considered mobile.
 * @returns {boolean}
 */
window.isMobile = function () {
  return (
    window.matchMedia &&
    window.matchMedia(`(max-width: ${MOBILE_BP}px)`).matches
  );
};

/**
 * Shortcut to get an element by ID.
 * @param {string} id
 * @returns {HTMLElement|null}
 */
function el(id) {
  return document.getElementById(id);
}

/** @returns {HTMLElement|null} */
function menuEl() {
  return el("mobileActionsMenu");
}

/** @returns {HTMLElement|null} */
function btnEl() {
  return el("mobileMenuBtn");
}

/**
 * Returns the currently selected contact ID.
 * @returns {string}
 */
function getSelectedId() {
  try {
    return typeof selectedId !== "undefined" ? selectedId : "";
  } catch {
    return "";
  }
}

/**
 * Syncs the edit and delete buttons with the currently selected ID.
 */
function syncMenuIds() {
  const menu = menuEl();
  if (!menu) return;

  const editBtn = menu.querySelector('[data-action="edit"]');
  const delBtn = menu.querySelector('[data-action="delete"]');
  const id = getSelectedId();

  if (editBtn) editBtn.dataset.id = id || "";
  if (delBtn) delBtn.dataset.id = id || "";
}

/**
 * Shows the mobile contact details view.
 */
window.showMobileDetails = function () {
  if (!window.isMobile()) return;

  document.body.classList.add("show-contact-details");

  const btn = btnEl();
  if (btn) btn.classList.remove("d-none");

  syncMenuIds();
  window.closeMobileMenu();
};

/**
 * Shows the mobile contacts list view.
 */
window.showMobileList = function () {
  document.body.classList.remove("show-contact-details");

  const btn = btnEl();
  if (btn) btn.classList.add("d-none");

  window.closeMobileMenu();
};

/**
 * Toggles the mobile actions menu open/closed.
 */
window.toggleMobileMenu = function () {
  const menu = menuEl();
  if (!menu) return;

  syncMenuIds();

  if (menu.classList.contains("is-open")) {
    window.closeMobileMenu();
  } else {
    menu.classList.remove("d-none");
    menu.classList.add("is-open");
  }
};

/**
 * Closes the mobile actions menu.
 */
window.closeMobileMenu = function () {
  const menu = menuEl();
  if (!menu) return;
  menu.classList.remove("is-open");
  menu.classList.add("d-none");
};

/**
 * Handles clicks outside the mobile menu to close it.
 * @param {MouseEvent} e
 */
window.handleOutsideMobileMenuClick = function (e) {
  if (!window.isMobile()) return;

  const menu = menuEl();
  if (!menu || !menu.classList.contains("is-open")) return;

  const insideMenu = e.target.closest("#mobileActionsMenu");
  const onBtn = e.target.closest("#mobileMenuBtn");

  if (!insideMenu && !onBtn) window.closeMobileMenu();
};

/**
 * Handles clicks on mobile-specific buttons (back and menu).
 * @param {MouseEvent} e
 */
function handleMobileButtonsClick(e) {
  if (!window.isMobile()) return;

  if (e.target.closest("#mobileBackBtn")) {
    e.preventDefault();
    window.showMobileList();
    return;
  }

  if (e.target.closest("#mobileMenuBtn")) {
    e.preventDefault();
    window.toggleMobileMenu();
    return;
  }
}

/** Global click listener for mobile buttons and outside menu clicks */
document.addEventListener("click", function (e) {
  handleMobileButtonsClick(e);
  window.handleOutsideMobileMenuClick && window.handleOutsideMobileMenuClick(e);
});

/** Adjust UI on window resize */
window.addEventListener("resize", () => {
  if (!window.isMobile()) window.showMobileList();
});

/** Initial DOM setup */
document.addEventListener("DOMContentLoaded", () => {
  const menu = menuEl();
  if (menu) menu.classList.add("d-none");

  if (window.isMobile()) window.showMobileList();
  else {
    const btn = btnEl();
    if (btn) btn.classList.add("d-none");
  }

  syncMenuIds();
});

/**
 * Overrides renderDetails to also sync menu IDs and show details in mobile.
 */
(function () {
  if (typeof window.renderDetails !== "function") return;

  const _renderDetails = window.renderDetails;
  window.renderDetails = function () {
    _renderDetails();
    syncMenuIds();
    if (window.isMobile()) window.showMobileDetails();
  };
})();

/** User menu toggle logic */
document.addEventListener("DOMContentLoaded", () => {
  const guest = document.querySelector(".header-guest");
  const menu = document.getElementById("userMenu");
  if (!guest || !menu) return;

  /** Closes the user menu */
  function closeMenu() {
    menu.classList.add("d-none");
  }

  /** Toggles the user menu */
  function toggleMenu() {
    menu.classList.toggle("d-none");
  }

  guest.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  document.addEventListener("click", (e) => {
    if (!menu.contains(e.target) && !guest.contains(e.target)) {
      closeMenu();
    }
  });

  window.addEventListener("resize", closeMenu);
});

/** Highlights active menu link based on current page */
document.addEventListener("DOMContentLoaded", () => {
  const links = document.querySelectorAll(".menu a[href]");
  const current = location.pathname.split("/").pop();

  links.forEach((a) => {
    const target = new URL(a.getAttribute("href"), location.href).pathname
      .split("/")
      .pop();
    a.classList.toggle("active", target === current);
  });

  links.forEach((a) => {
    a.addEventListener("click", () => {
      links.forEach((x) => x.classList.remove("active"));
      a.classList.add("active");
    });
  });
});
