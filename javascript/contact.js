const STORAGE_KEY = "join_contacts_v1";
const dbTask = "https://join-da53b-default-rtdb.firebaseio.com/";

let contacts = [];
let selectedId = null;

/**
 * Checks whether the current view is mobile.
 * Uses a global helper if it exists.
 * @returns {boolean}
 */
function isMobile() {
  return window.isMobile && window.isMobile();
}

/**
 * Shows the contacts list in the mobile layout.
 */
function showMobileList() {
  window.showMobileList && window.showMobileList();
}

/**
 * Shows the contact details view in the mobile layout.
 */
function showMobileDetails() {
  window.showMobileDetails && window.showMobileDetails();
}

document.addEventListener("DOMContentLoaded", async function () {
  await (window.idbStorage && window.idbStorage.ready
    ? window.idbStorage.ready
    : Promise.resolve());
  await init();
});

/**
 * Initializes the application.
 * - Runs cookie check
 * - Removes any existing modal
 * - Loads contacts
 * - Renders UI
 * - Registers event listeners
 */
async function init() {
  getCokkieCheck();
  removeModalNow();
  await loadContacts();
  renderContactsList();
  renderDetails();
  if (isMobile()) showMobileList();
  document.addEventListener("click", handleClick);
  document.addEventListener("submit", handleSubmit);
}

/**
 * Normalizes a string:
 * - Trims whitespace
 * - Collapses multiple spaces into one
 * @param {string} str
 * @returns {string}
 */
function normalize(str) {
  return (str || "").trim().replace(/\s+/g, " ");
}

/**
 * Generates a unique ID for contacts.
 * Uses crypto.randomUUID if available.
 * @returns {string}
 */
function generateId() {
  if (crypto && crypto.randomUUID) return crypto.randomUUID();
  return Date.now() + "_" + Math.random().toString(16).slice(2);
}

/**
 * Creates a simple hash value from a string.
 * Used for color assignment.
 * @param {string} str
 * @returns {number}
 */
function hashString(str) {
  let h = 0,
    s = String(str || "");
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Returns an avatar color class based on a seed.
 * @param {string} seed
 * @returns {string}
 */
function colorClassFor(seed) {
  return "avatar-color-" + (hashString(seed) % 12);
}

/**
 * Picks a unique color class that has not been used yet.
 * @param {string} seed
 * @param {Set<string>} usedSet
 * @returns {string}
 */
function pickUniqueColorClass(seed, usedSet) {
  let start = hashString(seed) % 12;
  for (let i = 0; i < 12; i++) {
    let cls = "avatar-color-" + ((start + i) % 12);
    if (!usedSet.has(cls)) return cls;
  }
  return "avatar-color-" + start;
}

/**
 * Generates initials from a full name.
 * @param {string} fullName
 * @returns {string}
 */
function getInitials(fullName) {
  let n = normalize(fullName);
  if (!n) return "";
  let p = n.split(" ").filter(Boolean);
  let f = (p[0] || "")[0] || "";
  let l = p.length > 1 ? (p[p.length - 1] || "")[0] : (p[0] || "")[1] || "";
  return (f + l).toUpperCase();
}

/**
 * Sort function for contacts by name.
 * @param {Object} a
 * @param {Object} b
 * @returns {number}
 */
function sortContacts(a, b) {
  return (a.name || "")
    .toLowerCase()
    .localeCompare((b.name || "").toLowerCase());
}

/**
 * Returns the alphabetical group key for a name.
 * Used for contact list grouping.
 * @param {string} name
 * @returns {string}
 */
function groupKey(name) {
  return (normalize(name)[0] || "").toUpperCase();
}

/**
 * Loads contacts from Firebase Realtime Database.
 */
async function loadContacts() {
  let data = null;
  try {
    const resp = await fetch(dbTask + "contacts.json");
    data = await resp.json();
  } catch {}

  if (!data) contacts = [];
  else if (Array.isArray(data)) contacts = data.filter(Boolean);
  else
    contacts = Object.entries(data).map(([k, v]) => ({
      ...(v || {}),
      id: v?.id || k,
    }));

  ensureUniqueColors();
}

/**
 * Saves all contacts to the database.
 */
async function saveContacts() {
  const map = {};
  for (let c of contacts) {
    if (!c.id) c.id = generateId();
    map[c.id] = c;
  }

  await fetch(dbTask + "contacts.json", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(map),
  });
}

/**
 * Ensures each contact has a unique color class.
 */
function ensureUniqueColors() {
  let used = new Set();
  for (let c of contacts) {
    let seed = c.id || c.email || c.name || "";
    if (!c.colorClass || used.has(c.colorClass))
      c.colorClass = pickUniqueColorClass(seed, used);
    used.add(c.colorClass);
  }
}

/**
 * Immediately removes the contact modal from the DOM.
 */
function removeModalNow() {
  let m = document.getElementById("addContactModal");
  if (m) m.remove();
}

/**
 * Opens the contact modal.
 * @param {"create"|"edit"} mode
 * @param {Object|null} contact
 */
function openModal(mode, contact) {
  removeModalNow();

  let data = buildModalData(mode, contact);
  document.body.insertAdjacentHTML(
    "beforeend",
    contactModalTemplate(mode, data),
  );

  let m = document.getElementById("addContactModal");
  if (!m) return;

  m.setAttribute("data-mode", mode);

  let form = document.getElementById("addContactForm");
  if (form) {
    form.dataset.mode = mode;
    form.dataset.editId = mode === "edit" && contact ? contact.id : "";
  }

  m.classList.remove("d-none");
  requestAnimationFrame(function () {
    m.classList.add("is-open");
  });
}

/**
 * Closes the modal with animation.
 */
function closeModal() {
  let m = document.getElementById("addContactModal");
  if (!m) return;

  m.classList.remove("is-open");

  setTimeout(function () {
    removeModalNow();
  }, 300);
}

/**
 * Builds the data object used by the modal template.
 * @param {string} mode
 * @param {Object} contact
 * @returns {Object}
 */
function buildModalData(mode, contact) {
  if (!contact) return {};
  return {
    id: contact.id,
    name: contact.name || "",
    email: contact.email || "",
    phone: contact.phone || "",
    initials: getInitials(contact.name),
    colorClass: contact.colorClass,
  };
}

/**
 * Renders the contacts list in the sidebar.
 */
function renderContactsList() {
  let list = document.getElementById("contactsList");
  if (!list) return;

  let sorted = [...contacts].sort(sortContacts);
  let html = "",
    current = "";

  for (let c of sorted) {
    let g = groupKey(c.name);
    if (g && g !== current) {
      current = g;
      html += letterGroupTemplate(current);
    }

    html += contactListItemTemplate(
      {
        id: c.id,
        name: c.name,
        email: c.email,
        initials: getInitials(c.name),
        colorClass: c.colorClass,
      },
      c.id === selectedId,
    );
  }

  list.innerHTML = html;
}

/**
 * Renders the selected contact details.
 */
function renderDetails() {
  let d = document.getElementById("contactDetails");
  if (!d) return;

  if (!selectedId) {
    d.innerHTML = "";
    return;
  }

  let c = contacts.find((x) => x.id === selectedId);
  if (!c) return;

  d.innerHTML = contactDetailsTemplate({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone || "-",
    initials: getInitials(c.name),
    colorClass: c.colorClass,
  });

  if (isMobile()) showMobileDetails();
}

/**
 * Creates a new contact from the form input.
 */
function createFromForm() {
  let name = normalize(document.getElementById("contactName")?.value);
  let email = normalize(
    document.getElementById("contactEmail")?.value,
  ).toLowerCase();
  let phone = normalize(document.getElementById("contactPhone")?.value);

  if (!name || !email) return;

  let id = generateId();

  contacts.push({
    id,
    name,
    email,
    phone,
    colorClass: colorClassFor(id),
  });

  selectedId = id;

  saveContacts();
  renderContactsList();
  renderDetails();
  closeModal();
}

/**
 * Saves edits made to an existing contact.
 * @param {string} editId
 */
function saveEdit(editId) {
  let idx = contacts.findIndex((c) => c.id === editId);
  if (idx === -1) return;

  let name = normalize(document.getElementById("contactName")?.value);
  let email = normalize(
    document.getElementById("contactEmail")?.value,
  ).toLowerCase();
  let phone = normalize(document.getElementById("contactPhone")?.value);

  if (!name || !email) return;

  contacts[idx] = { ...contacts[idx], name, email, phone };
  selectedId = editId;

  saveContacts();
  renderContactsList();
  renderDetails();
  closeModal();
}

/**
 * Deletes a contact by ID.
 * @param {string} id
 */
function deleteContact(id) {
  contacts = contacts.filter((c) => c.id !== id);
  selectedId = null;
  saveContacts();
  renderContactsList();
  renderDetails();
}

/**
 * Global click handler for UI actions.
 * @param {MouseEvent} e
 */
function handleClick(e) {
  if (e.target.closest("#openAddContact")) return openModal("create", null);

  let item = e.target.closest(".contact-item");
  if (item?.dataset.id) {
    selectedId = item.dataset.id;
    renderContactsList();
    renderDetails();
    return;
  }

  let act = e.target.closest(".contact-action");
  if (act?.dataset.action === "delete") return deleteContact(act.dataset.id);

  if (act?.dataset.action === "edit") {
    let contact = contacts.find((c) => c.id === act.dataset.id);
    return openModal("edit", contact);
  }

  if (e.target.closest("#closeAddContact")) closeModal();

  let back = document.getElementById("addContactModal");
  if (back && e.target === back) closeModal();
}

/**
 * Global form submit handler.
 * Handles both creating and editing contacts.
 * @param {SubmitEvent} e
 */
function handleSubmit(e) {
  if (e.target.id !== "addContactForm") return;
  e.preventDefault();

  let mode = e.target.dataset.mode || "create";
  let editId = e.target.dataset.editId || "";

  if (mode === "edit" && editId) return saveEdit(editId);
  return createFromForm();
}
