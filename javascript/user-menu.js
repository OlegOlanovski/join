document.addEventListener("DOMContentLoaded", function () {
  // --- populate header initials (works for both the header-user button and legacy .header-guest)
  (function populateHeaderInitials() {
    function cookieToObj() {
      return document.cookie.split(";").reduce((acc, cookie) => {
        const [k, ...rest] = cookie.trim().split("=");
        acc[k] = rest.length ? decodeURIComponent(rest.join("=")) : "";
        return acc;
      }, {});
    }

    function parseLoggedUser() {
      try {
        const s = sessionStorage.getItem('loggedInUser');
        if (s) return JSON.parse(s);
      } catch (e) { /* ignore */ }
      const c = cookieToObj();
      if (c.loggedInUser) {
        try { return JSON.parse(c.loggedInUser); } catch (e) { return { namen: c.loggedInUser }; }
      }
      return null;
    }

    function getInitials(name) {
      if (!name) return 'G';
      const n = String(name).trim();
      if (!n) return 'G';
      const parts = n.split(/\s+/);
      const first = parts[0] ? parts[0][0] : '';
      const last = parts.length > 1 ? (parts[parts.length-1][0] || '') : '';
      return (first + last).toUpperCase();
    }

    const user = parseLoggedUser();
    const displayName = user && (user.namen || user.name || user.fullName || user.mail || user.email) || null;
    const initials = displayName ? getInitials(displayName) : 'G';

    const btnLegacy = document.querySelector('.header-guest');
    if (btnLegacy) {
      btnLegacy.textContent = initials;
      if (displayName) btnLegacy.setAttribute('title', displayName);
    }

    const btn = document.getElementById('headerUserBtn');
    if (btn) {
      btn.textContent = initials;
      if (displayName) btn.setAttribute('title', displayName);
      if (displayName) btn.setAttribute('aria-label', `User menu — ${displayName}`);
    }
  })();

  const btn = document.getElementById("headerUserBtn");
  const menu = document.getElementById("userMenu");
  if (!btn || !menu) return;

  function setOpen(open) {
    menu.classList.toggle("is-open", open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    menu.setAttribute("aria-hidden", open ? "false" : "true");
  }

  btn.addEventListener("click", function (e) {
    e.stopPropagation();
    setOpen(!menu.classList.contains("is-open"));
  });

  menu.addEventListener("click", function (e) {
    e.stopPropagation();
  });

  document.addEventListener("click", function (e) {
    if (!e.target.closest(".header-user-area")) setOpen(false);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setOpen(false);
  });
});
