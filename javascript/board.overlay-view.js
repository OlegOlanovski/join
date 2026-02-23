/**
 * @typedef {Object} Task
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} category
 * @property {string} priority
 * @property {string} dueDate
 * @property {{title:string, done:boolean}[]} subtasks
 */
/**
 * Initializes all event listeners and UI logic for the task overlay.
 * Collects required DOM elements and binds all overlay interactions.
 *
 * @returns {void}
 */
function initOverlayEvents() {
  const els = getOverlayElements();
  if (!els) return;
  toggleOverlayEditState(els, false);
  bindOverlayClose(els);
  bindOverlayBackdrop(els);
  bindOverlayEsc(els);
  bindOverlayDelete(els);
  bindOverlayEdit(els);
  bindOverlaySave(els);
  bindOverlayCancel(els);
  bindOverlayEditForm(els);
  initOverlayEditWidgets();
  bindOverlayOpenByCard();
}
/**
 * Collects and returns all DOM elements used by the task overlay.
 * If required elements are missing the function returns null.
 *
 * @returns {Object|null} Object containing overlay DOM references
 */

function getOverlayElements() {
  const overlay = document.querySelector(".task-overlay");
  const backdrop = document.getElementById("taskOverlayBackdrop");
  const top = document.querySelector(".task-overlay-top");
  const closeBtn = document.getElementById("taskOverlayClose");
  const delBtn = document.getElementById("taskOverlayDelete");
  const editBtn = document.getElementById("taskOverlayEdit");
  const saveBtn = document.getElementById("taskOverlaySave");
  const cancelBtn = document.getElementById("taskOverlayCancel");
  const view = document.getElementById("taskOverlayView");
  const editForm = document.getElementById("taskOverlayEditForm");
  if (!backdrop || !closeBtn) {
    console.warn(
      "Overlay elements not found (taskOverlayBackdrop/taskOverlayClose).",
    );
    return null;
  }
  return {
    overlay: overlay,
    backdrop: backdrop,
    top: top,
    closeBtn: closeBtn,
    delBtn: delBtn,
    editBtn: editBtn,
    saveBtn: saveBtn,
    cancelBtn: cancelBtn,
    view: view,
    editForm: editForm,
  };
}
/**
 * Binds the close button click event to close the overlay.
 *
 * @param {Object} els - Overlay DOM elements
 * @returns {void}
 */
function bindOverlayClose(els) {
  els.closeBtn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    closeTaskOverlay();
  });
}
/**
 * Closes the overlay when the backdrop is clicked.
 *
 * @param {Object} els - Overlay DOM elements
 * @returns {void}
 */
function bindOverlayBackdrop(els) {
  els.backdrop.addEventListener("click", function (e) {
    if (e.target === els.backdrop) closeTaskOverlay();
  });
}
/**
 * Allows closing the overlay using the Escape key.
 *
 * @param {Object} els - Overlay DOM elements
 * @returns {void}
 */
function bindOverlayEsc(els) {
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !els.backdrop.hidden) closeTaskOverlay();
  });
}
/**
 * Binds the delete button and removes the currently opened task.
 *
 * @param {Object} els - Overlay DOM elements
 * @returns {void}
 */
function bindOverlayDelete(els) {
  if (!els.delBtn) return;
  els.delBtn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (!openedTaskId) return;
    deleteTask(openedTaskId);
  });
}
/**
 * Enables edit mode when the edit button is clicked.
 *
 * @param {Object} els - Overlay DOM elements
 * @returns {void}
 */
function bindOverlayEdit(els) {
  if (!els.editBtn) return;
  els.editBtn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (!openedTaskId) return;
    enterOverlayEditMode(openedTaskId, els);
  });
}
/**
 * Saves changes made in the overlay edit mode.
 *
 * @param {Object} els - Overlay DOM elements
 * @returns {void}
 */
function bindOverlaySave(els) {
  if (!els.saveBtn) return;
  els.saveBtn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (!openedTaskId) return;
    saveOverlayEdits(openedTaskId, els);
  });
}
/**
 * Cancels edit mode and restores the normal view mode.
 *
 * @param {Object} els - Overlay DOM elements
 * @returns {void}
 */
function bindOverlayCancel(els) {
  if (!els.cancelBtn) return;
  els.cancelBtn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    exitOverlayEditMode(els);
  });
}
/**
 * Prevents default submit behaviour of the edit form.
 *
 * @param {Object} els - Overlay DOM elements
 * @returns {void}
 */
function bindOverlayEditForm(els) {
  if (!els.editForm) return;
  els.editForm.addEventListener("submit", function (e) {
    e.preventDefault();
  });
}
/**
 * Opens the task overlay when a task card is clicked.
 * Ignores clicks during drag operations.
 *
 * @returns {void}
 */
function bindOverlayOpenByCard() {
  document.addEventListener("click", function (e) {
    if (isDragging) return;
    if (e.target.closest(".task-overlay")) return;
    const card = e.target.closest(".card");
    if (!card) return;
    openTaskOverlay(card.dataset.id);
  });
}

// ---------------- Open / Close overlay ----------------
/**
 * Opens the overlay for a specific task and renders its data.
 *
 * @param {string|number} id - Task identifier
 * @returns {void}
 */
function openTaskOverlay(id) {
  const task = findTaskById(id);
  if (!task) return;
  openedTaskId = String(id);
  resetOverlayEditMode();
  setOverlayCategory(task);
  setOverlayTexts(task);
  setOverlayPriority(task);
  renderOverlayAssigned(task);
  renderOverlaySubtasks(task);
  showOverlay(task);
}
/**
 * Searches for a task by its id.
 *
 * @param {string|number} id
 * @returns {Object|null} Found task or null
 */
function findTaskById(id) {
  const tasks = getTasks();
  for (let i = 0; i < tasks.length; i++) {
    if (String(tasks[i].id) === String(id)) return tasks[i];
  }
  return null;
}
/**
 * Updates the category label in the overlay.
 *
 * @param {Object} task
 * @returns {void}
 */
function setOverlayCategory(task) {
  const chip = document.getElementById("taskOverlayCategory");
  if (!chip) return;
  const isTech = task.category === "tech";
  chip.textContent = isTech ? "Technical Task" : "User Story";
  chip.classList.remove("user", "tech");
  chip.classList.add(isTech ? "tech" : "user");
}
/**
 * Renders title, description and due date in the overlay.
 *
 * @param {Object} task
 * @returns {void}
 */
function setOverlayTexts(task) {
  setText("taskOverlayTitle", task.title || "");
  setText("taskOverlayDesc", task.description || "");
  setText("taskOverlayDue", formatDate(task.dueDate || task.due || ""));
}
/**
 * Displays the priority label and icon.
 *
 * @param {Object} task
 * @returns {void}
 */
function setOverlayPriority(task) {
  const prioEl = document.getElementById("taskOverlayPrio");

  if (!prioEl) return;
  const pr = String(task.priority || task.prio || "medium").toLowerCase();
  prioEl.textContent = "";
  prioEl.classList.remove("urgent", "medium", "low");
  prioEl.classList.add(pr);

  const text = document.createElement("span");
  text.textContent = capitalize(pr);
  prioEl.appendChild(text);

  const icon = getPriorityIcon(task);
  if (icon) {
    const img = document.createElement("img");
    img.src = icon;
    img.alt = "Priority " + pr;
    img.className = "task-overlay-prio-icon";
    prioEl.appendChild(img);
  }
}
/**
 * Renders all assigned contacts in the overlay.
 *
 * @param {Object} task
 * @returns {void}
 */
function renderOverlayAssigned(task) {
  const assignedWrap = document.getElementById("taskOverlayAssigned");
  if (!assignedWrap) return;
  assignedWrap.innerHTML = "";
  const list = getAssignedList(task);
  for (let i = 0; i < list.length; i++) {
    assignedWrap.appendChild(createPersonRow(list[i], i));
  }
}
/**
 * Returns the assigned contact list for a task.
 *
 * @param {Object} task
 * @returns {Array}
 */
function getAssignedList(task) {
  if (typeof resolveAssignedContacts === "function")
    return resolveAssignedContacts(task);
  const list = resolveAssignedList(task);
  return list.map(function (name) {
    const s = String(name || "");
    return { id: s, name: s };
  });
}
/**
 * Creates a DOM row representing one assigned person.
 *
 * @param {Object|string} item
 * @param {number} index
 * @returns {HTMLElement}
 */
function createPersonRow(item, index) {
  const contact = normalizeOverlayContact(item);
  const row = document.createElement("div");
  row.className = "task-overlay-person";
  row.appendChild(createPersonBadge(contact, index));
  row.appendChild(createPersonText(contact));
  return row;
}
/**
 * Creates the avatar badge for a contact.
 *
 * @param {Object} contact
 * @param {number} index
 * @returns {HTMLElement}
 */
function createPersonBadge(contact, index) {
  const badge = document.createElement("div");
  const colorClass = getOverlayViewContactColorClass(contact, index);
  badge.className = "task-overlay-badge " + colorClass;
  badge.textContent = getInitials(String(contact.name || contact.id || ""));
  return badge;
}
/**
 * Creates the text node for a contact name.
 *
 * @param {Object} contact
 * @returns {HTMLElement}
 */
function createPersonText(contact) {
  const text = document.createElement("div");
  text.textContent = String(contact.name || contact.id || "");
  return text;
}
/**
 * Generates a hash value from a string.
 * Used for stable avatar color assignment.
 *
 * @param {string} str
 * @returns {number}
 */
function normalizeOverlayContact(item) {
  if (item && typeof item === "object") return item;
  const s = String(item || "");
  return { id: s, name: s };
}
/**
 * Renders all subtasks of a task inside the overlay.
 *
 * @param {Object} task
 * @returns {void}
 */
function getOverlayViewContactColorClass(contact, index) {
  if (typeof getContactColorClass === "function")
    return getContactColorClass(contact);
  if (contact && contact.colorClass) return contact.colorClass;
  const seed =
    contact?.id || contact?.email || contact?.name || String(index || "");
  return "avatar-color-" + (overlayViewHashString(seed) % 12);
}
/**
 * Displays a fallback message when no subtasks exist.
 *
 * @param {HTMLElement} wrap
 * @returns {void}
 */
function overlayViewHashString(str) {
  let h = 0;
  const s = String(str || "");
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
/**
 * Creates a DOM row for a single subtask.
 *
 * @param {Object} subtask
 * @param {number} index
 * @param {string|number} taskId
 * @returns {HTMLElement}
 */
function renderOverlaySubtasks(task) {
  const subtasksWrap = document.getElementById("taskOverlaySubtasks");
  if (!subtasksWrap) return;
  subtasksWrap.innerHTML = "";
  const subs = Array.isArray(task.subtasks) ? task.subtasks : [];
  if (!subs.length) return showNoSubtasks(subtasksWrap);
  for (let i = 0; i < subs.length; i++) {
    subtasksWrap.appendChild(createSubtaskRow(subs[i], i, task.id));
  }
}
/**
 * Displays a fallback message when no subtasks exist.
 *
 * @param {HTMLElement} wrap
 * @returns {void}
 */
function showNoSubtasks(wrap) {
  wrap.textContent = "No subtasks";
}
/**
 * Creates a DOM row for a single subtask.
 *
 * @param {Object} subtask
 * @param {number} index
 * @param {string|number} taskId
 * @returns {HTMLElement}
 */
function createSubtaskRow(subtask, index, taskId) {
  const row = document.createElement("div");
  row.className = "task-overlay-subtask";
  row.appendChild(createSubtaskCheckbox(subtask, index, taskId));
  row.appendChild(createSubtaskLabel(subtask));
  return row;
}
/**
 * Creates the checkbox used to toggle a subtask state.
 *
 * @param {Object} subtask
 * @param {number} index
 * @param {string|number} taskId
 * @returns {HTMLInputElement}
 */

function createSubtaskCheckbox(subtask, index, taskId) {
  const box = document.createElement("input");
  box.type = "checkbox";
  box.checked = !!subtask.done;
  box.addEventListener("change", function () {
    updateSubtaskDone(taskId, index, box.checked);
  });
  return box;
}
/**
 * Creates the label text for a subtask.
 *
 * @param {Object} subtask
 * @returns {HTMLElement}
 */
function createSubtaskLabel(subtask) {
  const label = document.createElement("span");
  label.textContent = subtask.title || "";
  return label;
}
/**
 * Updates the progress bar displayed on a task card.
 *
 * @param {Object} task
 * @returns {void}
 */
function updateSubtaskDone(taskId, subIndex, done) {
  const tasks = getTasks();
  const idx = findTaskIndexById(taskId, tasks);
  if (idx < 0) return;
  const task = tasks[idx];
  if (!Array.isArray(task.subtasks) || !task.subtasks[subIndex]) return;
  task.subtasks[subIndex].done = !!done;
  saveTasks(tasks);
  updateCardSubtaskProgress(task);
}
/**
 * Shows the task overlay and locks background scrolling.
 *
 * @returns {void}
 */
function updateCardSubtaskProgress(task) {
  const card = document.querySelector('.card[data-id="' + task.id + '"]');
  if (!card) return;
  const subs = Array.isArray(task.subtasks) ? task.subtasks : [];
  const total = subs.length;
  const existing = card.querySelector(".card-progress");
  if (!total) {
    if (existing) existing.remove();
    return;
  }
  const done = countDoneSubtasks(subs);
  const percent = Math.round((done / total) * 100);
  let progress = existing;
  if (!progress) {
    const bottom = card.querySelector(".card-bottom");
    if (!bottom) return;
    progress = document.createElement("div");
    progress.className = "card-progress";
    progress.innerHTML =
      '<div class="card-progress-bar"><div class="card-progress-fill"></div></div>' +
      '<div class="card-progress-text"></div>';
    bottom.insertBefore(progress, bottom.firstChild);
  }
  const fill = progress.querySelector(".card-progress-fill");
  const text = progress.querySelector(".card-progress-text");
  if (fill) fill.style.width = percent + "%";
  if (text) text.textContent = done + "/" + total;
}
/**
 * Closes the task overlay and resets its state.
 *
 * @returns {void}
 */
function showOverlay() {
  const backdrop = document.getElementById("taskOverlayBackdrop");
  if (!backdrop) return;
  backdrop.hidden = false;
  updateBodyScrollLock();
}
/**
 * Resets the overlay edit mode.
 *
 * @returns {void}
 */
function closeTaskOverlay() {
  const backdrop = document.getElementById("taskOverlayBackdrop");
  if (!backdrop) return;
  backdrop.hidden = true;
  updateBodyScrollLock();
  openedTaskId = null;
  resetOverlayEditMode();
}
/**
 * Enters edit mode for the current task.
 *
 * @param {string|number} id
 * @param {Object} els
 * @returns {void}
 */

function resetOverlayEditMode() {
  const els = getOverlayElements();
  if (!els) return;
  isEditingOverlay = false;
  toggleOverlayEditState(els, false);
}
/**
 * Leaves edit mode and returns to the view state.
 *
 * @param {Object} els
 * @returns {void}
 */
function enterOverlayEditMode(id, els) {
  const task = findTaskById(id);
  if (!task) return;
  isEditingOverlay = true;
  toggleOverlayEditState(els, true);
  fillOverlayEditForm(task);
  if (els.overlay) els.overlay.scrollTop = 0;
}
/**
 * Leaves edit mode and returns to the view state.
 *
 * @param {Object} els
 * @returns {void}
 */
function exitOverlayEditMode(els) {
  isEditingOverlay = false;
  toggleOverlayEditState(els, false);
}
/**
 * Toggles the UI between edit and view mode.
 *
 * @param {Object} els
 * @param {boolean} editing
 * @returns {void}
 */
function toggleOverlayEditState(els, editing) {
  if (els.view) els.view.hidden = editing;
  if (els.editForm) els.editForm.hidden = !editing;
  if (els.overlay) {
    editing
      ? els.overlay.classList.add("is-editing")
      : els.overlay.classList.remove("is-editing");
  }
  if (els.editBtn) els.editBtn.hidden = editing;
  if (els.delBtn) els.delBtn.hidden = editing;
  if (els.saveBtn) els.saveBtn.hidden = !editing;
  if (els.cancelBtn) els.cancelBtn.hidden = !editing;
}
