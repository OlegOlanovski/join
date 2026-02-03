const STORAGE_KEY = "join_contacts_v1";

let contacts = [];
let selectedId = null;

function normalize(str) {
  return (str || "").trim().replace(/\s+/g, " ");
}

function generateId() {
  if (crypto && crypto.randomUUID) return crypto.randomUUID();
  return String(Date.now()) + "_" + Math.random().toString(16).slice(2);
}

function hashString(str) {
  let h = 0;
  let s = String(str || "");
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function colorClassFor(seed) {
  return "avatar-color-" + (hashString(seed) % 12);
}

function getInitials(fullName) {
  let n = normalize(fullName);
  if (!n) return "";
  let p = n.split(" ").filter(Boolean);
  let f = (p[0] || "")[0] || "";
  let l = (p.length > 1 ? (p[p.length - 1] || "")[0] : (p[0] || "")[1]) || "";
  return (f + l).toUpperCase();
}

function sortContacts(a, b) {
  return (a.name || "").toLowerCase().localeCompare((b.name || "").toLowerCase());
}

function groupKey(name) {
  let n = normalize(name);
  return (n[0] || "").toUpperCase();
}

function loadContacts() {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    contacts = raw ? JSON.parse(raw) : [];
  } catch {
    contacts = [];
  }
}

function saveContacts() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
  } catch {}
}

function getEl(id) {
  return document.getElementById(id);
}

function removeModalNow() {
  let m = getEl("addContactModal");
  if (m) m.remove();
}

function buildModalData(mode, contact) {
  let d = { id: "", name: "", email: "", phone: "", initials: "", colorClass: "" };
  if (!contact) return d;
  d.id = contact.id;
  d.name = contact.name || "";
  d.email = contact.email || "";
  d.phone = contact.phone || "";
  d.initials = getInitials(contact.name);
  d.colorClass = colorClassFor(contact.email || contact.name);
  return d;
}

function openModal(mode, contact) {
  removeModalNow();
  let data = buildModalData(mode, contact);
  document.body.insertAdjacentHTML("beforeend", contactModalTemplate(mode, data));
  let m = getEl("addContactModal");
  if (!m) return;
  m.classList.remove("d-none");
  m.classList.remove("is-closing");
  requestAnimationFrame(function () {
    m.classList.add("is-open");
  });
}

function closeModal() {
  let m = getEl("addContactModal");
  if (!m) return;

  m.classList.remove("is-open");
  m.classList.add("is-closing");

  let box = m.querySelector(".modal");
  if (!box) return removeModalNow();

  let done = false;
  function finish() {
    if (done) return;
    done = true;
    removeModalNow();
  }

  box.addEventListener("transitionend", finish, { once: true });
  setTimeout(finish, 300);
}

function renderContactsList() {
  let list = getEl("contactsList");
  if (!list) return;

  let sorted = [...contacts].sort(sortContacts);
  let html = "";
  let current = "";

  for (let i = 0; i < sorted.length; i++) {
    let c = sorted[i];
    let g = groupKey(c.name);

    if (g && g !== current) {
      current = g;
      html += `<div class="letter-group">${current}</div>`;
    }

    html += contactListItemTemplate(
      {
        id: c.id,
        name: c.name,
        email: c.email,
        initials: getInitials(c.name),
        colorClass: colorClassFor(c.email || c.name)
      },
      c.id === selectedId
    );
  }

  list.innerHTML = html;
}

function renderDetails() {
  let d = getEl("contactDetails");
  if (!d) return;

  let c = contacts.find(function (x) {
    return x.id === selectedId;
  });

  if (!c) {
    d.innerHTML = "";
    return;
  }

  d.innerHTML = contactDetailsTemplate({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone || "-",
    initials: getInitials(c.name),
    colorClass: colorClassFor(c.email || c.name)
  });
}

function createFromForm() {
  let n = getEl("contactName");
  let e = getEl("contactEmail");
  let p = getEl("contactPhone");

  let name = normalize(n ? n.value : "");
  let email = normalize(e ? e.value : "").toLowerCase();
  let phone = normalize(p ? p.value : "");

  if (!name || !email) return;

  let nc = { id: generateId(), name: name, email: email, phone: phone };
  contacts.push(nc);
  selectedId = nc.id;

  saveContacts();
  renderContactsList();
  renderDetails();
}

function saveEdit(editId) {
  let idx = contacts.findIndex(function (x) {
    return x.id === editId;
  });
  if (idx === -1) return;

  let n = getEl("contactName");
  let e = getEl("contactEmail");
  let p = getEl("contactPhone");

  let name = normalize(n ? n.value : "");
  let email = normalize(e ? e.value : "").toLowerCase();
  let phone = normalize(p ? p.value : "");

  if (!name || !email) return;

  contacts[idx] = { ...contacts[idx], name: name, email: email, phone: phone };
  selectedId = editId;

  saveContacts();
  renderContactsList();
  renderDetails();
}

function deleteContact(id) {
  contacts = contacts.filter(function (c) {
    return c.id !== id;
  });

  selectedId = contacts.length ? contacts[0].id : null;

  saveContacts();
  renderContactsList();
  renderDetails();
}

function handleSecondary(btn) {
  let form = getEl("addContactForm");
  let editId = form ? form.dataset.editId || "" : "";

  if (btn.dataset.action === "cancel") return closeModal();
  if (btn.dataset.action === "delete" && editId) {
    deleteContact(editId);
    closeModal();
  }
}

function handleClick(e) {
  if (e.target.closest("#openAddContact")) return openModal("create", null);

  let item = e.target.closest(".contact-item");
  if (item && item.dataset.id) {
    selectedId = item.dataset.id;
    renderContactsList();
    renderDetails();
    return;
  }

  
  function closeModal(){
    let m = getEl("addContactModal");
    if (!m) return;
  
    m.classList.remove("is-open");
    m.classList.add("is-closing");
  
    let box = m.querySelector(".modal");
    if (!box) return removeModalNow();
  
    box.addEventListener("transitionend", function(ev){
      if (ev.propertyName !== "transform") return;
      removeModalNow();
    }, { once:true });
  }

  

  let act = e.target.closest(".contact-action");
  if (act && act.dataset.action && act.dataset.id) {
    let id = act.dataset.id;
    let a = act.dataset.action;

    if (a === "delete") return deleteContact(id);
    if (a === "edit") {
      let c = contacts.find(function (x) {
        return x.id === id;
      });
      return openModal("edit", c);
    }
  }

  if (e.target.closest("#closeAddContact")) return closeModal();

  let sec = e.target.closest("#modalSecondaryBtn");
  if (sec) return handleSecondary(sec);

  let back = getEl("addContactModal");
  if (back && e.target === back) closeModal();
}

function handleSubmit(e) {
  if (!e.target || e.target.id !== "addContactForm") return;
  e.preventDefault();

  let mode = e.target.dataset.mode || "create";
  let editId = e.target.dataset.editId || "";

  if (mode === "create") createFromForm();
  if (mode === "edit" && editId) saveEdit(editId);

  closeModal();
}

function init() {
  removeModalNow();
  loadContacts();

  if (!selectedId && contacts.length) selectedId = contacts[0].id;

  renderContactsList();
  renderDetails();

  document.addEventListener("click", handleClick);
  document.addEventListener("submit", handleSubmit);
}

document.addEventListener("DOMContentLoaded", init);