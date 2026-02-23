/**
 * Initializes the drag and drop system for task cards.
 * Binds drag start, drag end and drop zone handlers.
 */
function initDragAndDrop() {
  bindDragStart();
  bindDragEnd();
  bindDropZones();
}

/**
 * Registers the global dragstart event for cards.
 * Adds dragging styles and transfers the card id.
 */
function bindDragStart() {
  document.addEventListener("dragstart", function (e) {
    const card = e.target.closest(".card");
    if (!card) return;

    isDragging = true;
    card.classList.add("dragging");

    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", card.dataset.id || "");
  });
}

/**
 * Registers the global dragend event.
 * Cleans up dragging state and styles.
 */
function bindDragEnd() {
  document.addEventListener("dragend", function (e) {
    const card = e.target.closest(".card");
    if (card) card.classList.remove("dragging");

    isDragging = false;
    clearDragOverClasses();
  });
}

/**
 * Removes drag-over styles from all columns.
 */
function clearDragOverClasses() {
  const columns = document.querySelectorAll(".column");

  for (let i = 0; i < columns.length; i++) {
    columns[i].classList.remove("drag-over");
  }
}

/**
 * Attaches drag and drop events to all drop zones.
 */
function bindDropZones() {
  const zones = document.querySelectorAll(".column .cards");

  for (let i = 0; i < zones.length; i++) {
    attachZoneEvents(zones[i]);
  }
}

/**
 * Attaches all drag handlers to a specific zone.
 *
 * @param {HTMLElement} zone
 */
function attachZoneEvents(zone) {
  addDragOverHandler(zone);
  addDragLeaveHandler(zone);
  addDropHandler(zone);
}

/**
 * Handles the dragover event for a drop zone.
 * Enables dropping and highlights the column.
 *
 * @param {HTMLElement} zone
 */
function addDragOverHandler(zone) {
  zone.addEventListener("dragover", function (e) {
    e.preventDefault();

    const col = zone.closest(".column");
    if (col) col.classList.add("drag-over");

    e.dataTransfer.dropEffect = "move";
  });
}

/**
 * Handles the dragleave event and removes highlight styles.
 *
 * @param {HTMLElement} zone
 */
function addDragLeaveHandler(zone) {
  zone.addEventListener("dragleave", function () {
    const col = zone.closest(".column");
    if (col) col.classList.remove("drag-over");
  });
}

/**
 * Registers the drop event handler for a zone.
 *
 * @param {HTMLElement} zone
 */
function addDropHandler(zone) {
  zone.addEventListener("drop", function (e) {
    handleDrop(zone, e);
  });
}

/**
 * Handles the drop action of a dragged card.
 * Moves the card and updates its task status.
 *
 * @param {HTMLElement} zone
 * @param {DragEvent} e
 */
function handleDrop(zone, e) {
  e.preventDefault();

  const col = zone.closest(".column");
  if (col) col.classList.remove("drag-over");

  const id = e.dataTransfer.getData("text/plain");
  const card = getDraggedCard(id);
  if (!card) return;

  zone.appendChild(card);

  updateStatusAfterDrop(col, id);
  updateEmptyStates();
}

/**
 * Returns the currently dragged card.
 *
 * @param {string} id
 * @returns {HTMLElement|null}
 */
function getDraggedCard(id) {
  if (id) {
    return document.querySelector(
      '.card[data-id="' + CSS.escape(String(id)) + '"]',
    );
  }

  return document.querySelector(".card.dragging");
}

/**
 * Updates the task status after dropping into a column.
 *
 * @param {HTMLElement|null} col
 * @param {string} id
 */
function updateStatusAfterDrop(col, id) {
  const newStatus = col && col.dataset ? col.dataset.status : null;

  if (newStatus) updateTaskStatus(id, newStatus);
}

/**
 * Updates the stored status of a task.
 *
 * @param {string} id
 * @param {string} status
 */
function updateTaskStatus(id, status) {
  const tasks = getTasks();
  const idx = findTaskIndexById(id, tasks);

  if (idx === -1) return;

  tasks[idx].status = status;
  saveTasks(tasks);
}

// ---------------- Empty placeholders ----------------

/**
 * Updates empty column placeholders.
 */
function updateEmptyStates() {
  const columns = document.querySelectorAll(".column");

  for (let i = 0; i < columns.length; i++) {
    setEmptyStateForColumn(columns[i]);
  }
}

/**
 * Shows or hides the empty placeholder of a column.
 *
 * @param {HTMLElement} col
 */
function setEmptyStateForColumn(col) {
  const cards = col.querySelector(".cards");
  const empty = col.querySelector(".empty");

  if (!cards || !empty) return;

  empty.style.display = cards.children.length ? "none" : "block";
}

// ---------------- Utils ----------------

/**
 * Sets text content for an element by id.
 *
 * @param {string} id
 * @param {string} value
 */
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

/**
 * Sets the value of an input field.
 *
 * @param {string} id
 * @param {string} value
 */
function setInputValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

/**
 * Gets the value of an input field.
 *
 * @param {string} id
 * @returns {string}
 */
function getInputValue(id) {
  const el = document.getElementById(id);
  return el ? el.value : "";
}

/**
 * Updates body scroll lock when overlays are open.
 */
function updateBodyScrollLock() {
  const addTaskOpen = isBackdropOpen("addTaskOverlayBackdrop");
  const taskOpen = isBackdropOpen("taskOverlayBackdrop");

  document.body.classList.toggle("no-scroll", addTaskOpen || taskOpen);
}

/**
 * Checks whether a backdrop element is currently open.
 *
 * @param {string} id
 * @returns {boolean}
 */
function isBackdropOpen(id) {
  const el = document.getElementById(id);
  return !!(el && !el.hidden);
}

/**
 * Formats a date string from YYYY-MM-DD to DD/MM/YYYY.
 *
 * @param {string} value
 * @returns {string}
 */
function formatDate(value) {
  if (!value) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parts = value.split("-");
    const y = parts[0];
    const m = parts[1];
    const d = parts[2];

    return d + "/" + m + "/" + y;
  }

  return value;
}

/**
 * Generates initials from a full name.
 *
 * @param {string} name
 * @returns {string}
 */
function getInitials(name) {
  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Generates a consistent avatar color based on a seed.
 *
 * @param {string} seed
 * @returns {string}
 */
function getAvatarColor(seed) {
  const colors = ["#00BEE8", "#6E52FF", "#FF7A00", "#FF5EB3", "#1FD7C1"];

  let sum = 0;
  for (let i = 0; i < seed.length; i++) sum += seed.charCodeAt(i);

  return colors[sum % colors.length];
}

/**
 * Capitalizes the first letter of a string.
 *
 * @param {string} s
 * @returns {string}
 */
function capitalize(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

/**
 * Escapes HTML characters to prevent injection.
 *
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
