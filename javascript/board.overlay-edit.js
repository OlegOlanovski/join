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
