// ---------------- Delete confirm ----------------

/**
 * Initializes the delete confirmation dialog
 * and binds all required event listeners.
 */
function initDeleteConfirm() {
  const els = getDeleteConfirmEls();
  if (!els) return;

  bindDeleteConfirmOk(els);
  bindDeleteConfirmCancel(els);
  bindDeleteConfirmBackdrop(els);
  bindDeleteConfirmEsc(els);
}

/**
 * Retrieves all DOM elements used by the delete confirmation dialog.
 *
 * @returns {{backdrop: HTMLElement, okBtn: HTMLElement, cancelBtn: HTMLElement, textEl: HTMLElement} | null}
 */
function getDeleteConfirmEls() {
  const backdrop = document.getElementById("deleteConfirmBackdrop");
  const okBtn = document.getElementById("deleteConfirmOk");
  const cancelBtn = document.getElementById("deleteConfirmCancel");
  const textEl = document.getElementById("deleteConfirmText");

  if (!backdrop || !okBtn || !cancelBtn || !textEl) {
    console.warn("Delete confirm elements not found.");
    return null;
  }

  return {
    backdrop: backdrop,
    okBtn: okBtn,
    cancelBtn: cancelBtn,
    textEl: textEl,
  };
}

/**
 * Binds the confirmation button for deleting a task.
 *
 * @param {Object} els
 */
function bindDeleteConfirmOk(els) {
  els.okBtn.addEventListener("click", function () {
    handleDeleteConfirmOk();
  });
}

/**
 * Binds the cancel button.
 *
 * @param {Object} els
 */
function bindDeleteConfirmCancel(els) {
  els.cancelBtn.addEventListener("click", function () {
    handleDeleteConfirmCancel();
  });
}

/**
 * Closes the dialog when clicking outside the modal.
 *
 * @param {Object} els
 */
function bindDeleteConfirmBackdrop(els) {
  els.backdrop.addEventListener("click", function (e) {
    if (e.target === els.backdrop) closeDeleteConfirm();
  });
}

/**
 * Allows closing the dialog via the Escape key.
 *
 * @param {Object} els
 */
function bindDeleteConfirmEsc(els) {
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !els.backdrop.hidden) closeDeleteConfirm();
  });
}

/**
 * Opens the delete confirmation dialog for a specific task.
 *
 * @param {string|number} id
 */
function openDeleteConfirm(id) {
  const task = findTaskById(id);
  if (!task) return;

  pendingDeleteId = String(id);
  setDeleteConfirmText(task);
  showDeleteConfirm();
}

/**
 * Updates the confirmation message.
 *
 * @param {Object} task
 */
function setDeleteConfirmText(task) {
  const el = document.getElementById("deleteConfirmText");
  if (!el) return;

  el.textContent = 'Delete task "' + task.title + '"?';
}

/**
 * Displays the confirmation dialog.
 */
function showDeleteConfirm() {
  const backdrop = document.getElementById("deleteConfirmBackdrop");
  if (!backdrop) return;

  backdrop.hidden = false;
}

/**
 * Closes the confirmation dialog.
 */
function closeDeleteConfirm() {
  const backdrop = document.getElementById("deleteConfirmBackdrop");
  if (!backdrop) return;

  backdrop.hidden = true;
  pendingDeleteId = null;
}

/**
 * Executes the deletion after confirmation.
 */
function handleDeleteConfirmOk() {
  if (!pendingDeleteId) return closeDeleteConfirm();

  removeTaskById(pendingDeleteId);
  closeDeleteConfirm();
  closeTaskOverlay();
  renderBoardFromStorage();
}

/**
 * Cancels the delete process.
 */
function handleDeleteConfirmCancel() {
  closeDeleteConfirm();
}

// ---------------- Delete / Edit ----------------

/**
 * Starts the delete flow for a task.
 *
 * @param {string|number} id
 */
function deleteTask(id) {
  openDeleteConfirm(id);
}

/**
 * Removes a task from storage by ID.
 *
 * @param {string|number} id
 */
function removeTaskById(id) {
  const tasks = getTasks();
  const next = [];

  for (let i = 0; i < tasks.length; i++) {
    if (String(tasks[i].id) !== String(id)) next.push(tasks[i]);
  }

  saveTasks(next);
}

/**
 * Finds the index of a task by ID.
 *
 * @param {string|number} id
 * @param {Array} tasks
 * @returns {number}
 */
function findTaskIndexById(id, tasks) {
  for (let i = 0; i < tasks.length; i++) {
    if (String(tasks[i].id) === String(id)) return i;
  }

  return -1;
}

/**
 * Fills the overlay edit form with task data.
 *
 * @param {Object} task
 */
function fillOverlayEditForm(task) {
  setInputValue("taskEditTitle", task.title || "");
  setInputValue("taskEditDesc", task.description || "");
  setInputValue("taskEditDue", task.dueDate || task.due || "");

  const pr = String(task.priority || task.prio || "medium").toLowerCase();

  setOverlayPriorityButtons(pr);
  setOverlayAssignedFromTask(task);
  setOverlaySubtasksFromTask(task);
}

/**
 * Saves changes made in the overlay edit form.
 *
 * @param {string|number} id
 * @param {Object} els
 */
async function saveOverlayEdits(id, els) {
  const tasks = getTasks();
  const idx = findTaskIndexById(id, tasks);

  if (idx === -1) return;

  const values = readOverlayEditForm();
  if (!values) return;

  tasks[idx] = buildEditedTaskFromForm(tasks[idx], values);

  await saveTasks(tasks);

  try {
    exitOverlayEditMode(els);
  } catch (e) {}

  const task = tasks[idx];

  if (typeof setOverlayCategory === "function") setOverlayCategory(task);
  if (typeof setOverlayTexts === "function") setOverlayTexts(task);
  if (typeof setOverlayPriority === "function") setOverlayPriority(task);
  if (typeof renderOverlayAssigned === "function") renderOverlayAssigned(task);
  if (typeof renderOverlaySubtasks === "function") renderOverlaySubtasks(task);

  if (typeof renderBoardFromStorage === "function") renderBoardFromStorage();
}

/**
 * Builds an updated task object from the existing task and
 * the values collected from the overlay edit form.
 * Keeps immutable properties like id, status and category
 * but applies the edited fields (title, description, dueDate,
 * priority, assigned contacts and subtasks).
 *
 * @param {Object} task - Existing task object
 * @param {Object} values - Values returned by readOverlayEditForm()
 * @returns {Object} Updated task
 */
function buildEditedTaskFromForm(task, values) {
  const safeSubs = Array.isArray(values.subtasks)
    ? values.subtasks.map(function (s) {
        return {
          title: s && s.title ? s.title : "",
          done: !!(s && s.done),
        };
      })
    : [];

  const safeAssigned = Array.isArray(values.assigned)
    ? values.assigned.map(function (id) {
        return String(id || "");
      }).filter(function (id) {
        return !!id;
      })
    : [];

  return {
    // keep existing meta data (id, status, category, etc.)
    ...task,
    // editable fields from the form
    title: values.title || "",
    description: values.description || "",
    dueDate: values.dueDate || task.dueDate || task.due || "",
    priority:
      (values.priority || "").toLowerCase() ||
      String(task.priority || task.prio || "medium").toLowerCase(),
    assigned: safeAssigned,
    subtasks: safeSubs,
  };
}

/**
 * Reads and validates values from the edit form.
 *
 * @returns {Object|null}
 */
function readOverlayEditForm() {
  const title = getInputValue("taskEditTitle").trim();

  if (!title) {
    alert("Title is required");
    return null;
  }

  return {
    title: title,
    description: getInputValue("taskEditDesc").trim(),
    dueDate: getInputValue("taskEditDue"),
    priority: overlaySelectedPriority || "medium",
    assigned: Array.from(overlaySelectedContacts),
    subtasks: overlayPendingSubtasks.map((s) => ({
      title: s.title,
      done: !!s.done,
    })),
  };
}

// ---------------- Overlay edit widgets (priority, contacts, subtasks) ----------------

/**
 * Initializes interactive widgets inside the task overlay edit form.
 * Wires up priority buttons, assigned contacts multi-select,
 * and editable subtasks list.
 */
function initOverlayEditWidgets() {
  initOverlayPriorityButtons();
  initOverlayAssignedDropdown();
  initOverlaySubtasks();
}

// ---- Priority ----

function initOverlayPriorityButtons() {
  const container = document.getElementById("taskEditPriority");
  if (!container) return;

  const buttons = container.querySelectorAll(".priority-btn");
  if (!buttons.length) return;

  buttons.forEach((btn) => {
    btn.addEventListener("click", function () {
      buttons.forEach((b) => b.classList.remove("--selected"));
      btn.classList.add("--selected");
      const val = (btn.dataset.value || btn.textContent || "").toLowerCase();
      overlaySelectedPriority = val || "medium";
    });
  });
}

function setOverlayPriorityButtons(priority) {
  const container = document.getElementById("taskEditPriority");
  if (!container) return;

  const buttons = container.querySelectorAll(".priority-btn");
  const pr = String(priority || "medium").toLowerCase();
  overlaySelectedPriority = pr;

  buttons.forEach((btn) => {
    const val = (btn.dataset.value || btn.textContent || "")
      .toLowerCase()
      .trim();
    if (val === pr) btn.classList.add("--selected");
    else btn.classList.remove("--selected");
  });
}

// ---- Assigned contacts ----

function initOverlayAssignedDropdown() {
  const input = document.getElementById("taskEditAssignedInput");
  const dropdown = document.getElementById("taskEditAssignedDropdown");
  const arrow = document.getElementById("taskEditDropdownArrow");
  if (!input || !dropdown || !arrow) return;

  input.addEventListener("click", function (e) {
    e.stopPropagation();
    dropdown.classList.toggle("hidden");
    arrow.classList.toggle("open");
  });

  document.addEventListener("click", function (e) {
    if (!e.target.closest(".multi-select")) {
      dropdown.classList.add("hidden");
      arrow.classList.remove("open");
    }
  });
}

async function populateOverlayAssignedContacts() {
  const dropdown = document.getElementById("taskEditAssignedDropdown");
  if (!dropdown) return;

  dropdown.innerHTML = "";

  let contacts = [];
  try {
    if (typeof loadContacts === "function") contacts = loadContacts() || [];
    else if (window.idbStorage && window.idbStorage.getContactsSync)
      contacts = window.idbStorage.getContactsSync() || [];
  } catch (e) {
    console.warn("Failed to load contacts for overlay edit:", e);
  }

  const list = Array.isArray(contacts) ? contacts : Object.values(contacts || {});

  for (let i = 0; i < list.length; i++) {
    const c = list[i];
    if (!c || !c.id || !c.name) continue;

    const colorClass =
      typeof getContactColorClass === "function"
        ? getContactColorClass(c)
        : "";
    const row = document.createElement("div");
    row.className = "contact-option";

    const isSelected = overlaySelectedContacts.has(String(c.id));

    row.innerHTML =
      '<div class="contact-avatar ' +
      colorClass +
      '">' +
      (typeof getInitials === "function" ? getInitials(c.name) : "") +
      "</div>" +
      "<span>" +
      c.name +
      "</span>" +
      '<input type="checkbox" ' +
      (isSelected ? "checked" : "") +
      ">";

    row.addEventListener("click", function () {
      toggleOverlayContact(String(c.id));
    });

    dropdown.appendChild(row);
  }
}

function toggleOverlayContact(id) {
  if (overlaySelectedContacts.has(id)) overlaySelectedContacts.delete(id);
  else overlaySelectedContacts.add(id);

  populateOverlayAssignedContacts();
  renderOverlayAssignedSelected();
}

async function renderOverlayAssignedSelected() {
  const text = document.getElementById("taskEditAssignedText");
  const avatars = document.getElementById("taskEditAssignedAvatars");
  if (!text || !avatars) return;

  if (!overlaySelectedContacts.size) {
    text.textContent = "Select contacts to assign";
    avatars.innerHTML = "";
    return;
  }

  let contacts = [];
  try {
    if (typeof loadContacts === "function") contacts = loadContacts() || [];
    else if (window.idbStorage && window.idbStorage.getContactsSync)
      contacts = window.idbStorage.getContactsSync() || [];
  } catch (e) {
    console.warn("Failed to load contacts for overlay avatars:", e);
  }

  const list = Array.isArray(contacts) ? contacts : Object.values(contacts || {});

  avatars.innerHTML = "";

  overlaySelectedContacts.forEach((id) => {
    const c = list.find((x) => String(x.id) === String(id));
    if (!c) return;
    const span = document.createElement("span");
    const colorClass =
      typeof getContactColorClass === "function"
        ? getContactColorClass(c)
        : "";
    span.className = "contact-avatar " + colorClass;
    span.textContent =
      typeof getInitials === "function" ? getInitials(c.name || "") : "";
    avatars.appendChild(span);
  });

  text.textContent = "";
}

function setOverlayAssignedFromTask(task) {
  overlaySelectedContacts = new Set();

  let assigned = [];
  if (Array.isArray(task.assigned)) assigned = task.assigned;
  else if (task.assigned) assigned = [task.assigned];

  for (let i = 0; i < assigned.length; i++) {
    const key = String(assigned[i] || "");
    if (key) overlaySelectedContacts.add(key);
  }

  populateOverlayAssignedContacts();
  renderOverlayAssignedSelected();
}

// ---- Subtasks ----

function initOverlaySubtasks() {
  const input = document.getElementById("taskEditSubtaskInput");
  const btn = document.getElementById("taskEditAddSubtaskBtn");
  const list = document.getElementById("taskEditSubtasksList");

  if (btn && input) {
    btn.addEventListener("click", addOverlaySubtasksFromInput);

    input.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      e.preventDefault();
      addOverlaySubtasksFromInput();
    });
  }

  if (list) {
    list.addEventListener("click", function (e) {
      const remove = e.target.closest(".subtasks-remove");
      if (!remove) return;
      const index = parseInt(remove.dataset.index, 10);
      if (!isNaN(index)) {
        overlayPendingSubtasks.splice(index, 1);
        renderOverlaySubtasksEdit();
      }
    });
  }
}

function addOverlaySubtasksFromInput() {
  const input = document.getElementById("taskEditSubtaskInput");
  if (!input || !input.value.trim()) return;

  input.value
    .split(/[\n,;]+/)
    .map((t) => t.trim())
    .forEach((title) => {
      if (!title) return;
      overlayPendingSubtasks.push({ title: title, done: false });
    });

  input.value = "";
  renderOverlaySubtasksEdit();
}

function renderOverlaySubtasksEdit() {
  const list = document.getElementById("taskEditSubtasksList");
  if (!list) return;

  list.innerHTML = "";

  for (let i = 0; i < overlayPendingSubtasks.length; i++) {
    const s = overlayPendingSubtasks[i];
    const li = document.createElement("li");
    li.className = "subtasks-item";
    li.innerHTML =
      "<span>" +
      (s.title || "") +
      "</span>" +
      '<button class="subtasks-remove" data-index="' +
      i +
      '">x</button>';
    list.appendChild(li);
  }
}

function setOverlaySubtasksFromTask(task) {
  let subs = [];

  if (typeof getTaskSubtasks === "function") {
    subs = getTaskSubtasks(task);
  } else if (Array.isArray(task.subtasks)) {
    subs = task.subtasks;
  }

  overlayPendingSubtasks = subs.map(function (s) {
    if (typeof s === "string") {
      return { title: s, done: false };
    }
    return {
      title: s && s.title ? s.title : "",
      done: !!(s && s.done),
    };
  });

  renderOverlaySubtasksEdit();
}
