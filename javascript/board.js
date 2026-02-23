/** Storage key used for persisting tasks locally */
const STORAGE_KEY = "tasks";

/** Storage key used for persisting contacts */
const CONTACTS_STORAGE_KEY = "join_contacts_v1";

/** Base URL of the Firebase Realtime Database */
const DB_TASK_URL = "https://join-da53b-default-rtdb.firebaseio.com/";

/** Expose DB URL globally so other modules can access it */
window.DB_TASK_URL = DB_TASK_URL;

/** ID of the currently opened task in the overlay */
let openedTaskId = null;

/** Indicates if a card is currently being dragged */
let isDragging = false;

/** ID of a task waiting for deletion confirmation */
let pendingDeleteId = null;

/** Indicates if the overlay is currently in edit mode */
let isEditingOverlay = false;

/** Set of selected contacts in the task overlay */
let overlaySelectedContacts = new Set();

/** Temporary subtasks stored while editing/creating a task */
let overlayPendingSubtasks = [];

/** Currently selected task priority inside the overlay */
let overlaySelectedPriority = "medium";

/** Current search query used to filter tasks */
let activeSearchQuery = "";

/**
 * Initializes the board after the DOM has finished loading.
 * Handles storage initialization, syncing data, and UI setup.
 */
document.addEventListener("DOMContentLoaded", async function () {
  getCokkieCheck();

  // Wait until IndexedDB wrapper is ready
  await (window.idbStorage && window.idbStorage.ready
    ? window.idbStorage.ready
    : Promise.resolve());

  initRedirects();
  initAddTaskOverlay();
  initSearch();

  // Try to sync tasks from the remote database
  try {
    await syncTasksFromDB();
  } catch (e) {
    console.error("Initial sync failed, falling back to local storage", e);
  }

  // Try to sync contacts
  try {
    await syncContactsFromDB();
  } catch (e) {
    console.warn(
      "Initial contacts sync failed, continuing with local cache",
      e,
    );
  }

  renderBoardFromStorage();
  initDragAndDrop();
  initOverlayEvents();
  initDeleteConfirm();
  updateEmptyStates();
});

// ---------------- Redirects ----------------

/**
 * Initializes UI elements that redirect to the task creation overlay.
 */
function initRedirects() {
  bindAddCardIcons();
  bindTopAddButton();
}

/**
 * Adds click listeners to column "+" icons.
 */
function bindAddCardIcons() {
  const icons = document.querySelectorAll(".add-card-icon");
  for (let i = 0; i < icons.length; i++) {
    const icon = icons[i];
    icon.addEventListener("click", function () {
      goToAddTask(getColumnStatus(icon));
    });
  }
}

/**
 * Adds click listener to the main "Add task" button.
 */
function bindTopAddButton() {
  const topBtn = document.querySelector(".add-task-button");
  if (!topBtn) return;

  topBtn.addEventListener("click", function () {
    goToAddTask("todo");
  });
}

/**
 * Returns the status of the column where the add button was clicked.
 *
 * @param {HTMLElement} icon
 * @returns {string}
 */
function getColumnStatus(icon) {
  const col = icon.closest(".column");
  return col && col.dataset ? col.dataset.status : "todo";
}

/**
 * Opens the task creation overlay.
 *
 * @param {string} status
 */
function goToAddTask(status) {
  openAddTaskOverlay(status);
}

// ---------------- Search ----------------

/**
 * Initializes the task search input.
 */
function initSearch() {
  const input = document.querySelector(".search-input");
  if (!input) return;

  const icon = document.querySelector(".search-icon");

  input.addEventListener("input", function () {
    applySearchQuery(input.value);
  });

  input.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;

    input.value = "";
    applySearchQuery("");
  });

  if (icon) {
    icon.addEventListener("click", function () {
      input.focus();
      applySearchQuery(input.value);
    });
  }
}

/**
 * Applies the search filter and re-renders the board.
 *
 * @param {string} value
 */
function applySearchQuery(value) {
  activeSearchQuery = normalizeSearchQuery(value);
  renderBoardFromStorage();
}

/**
 * Normalizes the search string.
 *
 * @param {string} value
 * @returns {string}
 */
function normalizeSearchQuery(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

// ---------------- Add task overlay ----------------

/**
 * Initializes the add-task overlay and related events.
 */
function initAddTaskOverlay() {
  const backdrop = document.getElementById("addTaskOverlayBackdrop");
  if (!backdrop) return;

  const closeBtn = document.getElementById("addTaskOverlayClose");
  if (closeBtn) closeBtn.addEventListener("click", closeAddTaskOverlay);

  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeAddTaskOverlay();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!backdrop.hasAttribute("hidden")) closeAddTaskOverlay();
  });
}

/**
 * Opens the add task overlay.
 *
 * @param {string} status
 */
function openAddTaskOverlay(status) {
  const backdrop = document.getElementById("addTaskOverlayBackdrop");
  if (!backdrop) return;

  backdrop.dataset.status = status || "todo";
  backdrop.hidden = false;

  updateBodyScrollLock();

  if (typeof resetAddTaskForm === "function") resetAddTaskForm();
  else if (typeof clearForm === "function") clearForm();

  const titleInput = document.getElementById("titel");
  if (titleInput) titleInput.focus();
}

/**
 * Closes the add task overlay.
 */
function closeAddTaskOverlay() {
  const backdrop = document.getElementById("addTaskOverlayBackdrop");
  if (!backdrop) return;

  backdrop.hidden = true;
  updateBodyScrollLock();

  if (typeof clearForm === "function") clearForm();
}

// ---------------- Storage ----------------

/**
 * Retrieves all tasks from IndexedDB.
 *
 * @returns {Array}
 */
function getTasks() {
  try {
    return window.idbStorage &&
      typeof window.idbStorage.getTasksSync === "function"
      ? window.idbStorage.getTasksSync()
      : [];
  } catch (e) {
    console.error("Storage access error:", e);
    return [];
  }
}

/**
 * Saves tasks locally and syncs them with the remote database.
 *
 * @param {Array} tasks
 */
async function saveTasks(tasks) {
  if (window.idbStorage && typeof window.idbStorage.saveTasks === "function") {
    try {
      await window.idbStorage.saveTasks(tasks);
    } catch (e) {
      console.error("Failed to save tasks to IDB:", e);
    }
  } else {
    console.warn("idbStorage not available - tasks not persisted");
  }

  // Sync with Firebase
  (async function () {
    try {
      const url =
        (window.DB_TASK_URL ||
          "https://join-da53b-default-rtdb.firebaseio.com/") + "tasks.json";

      const map = {};
      for (const t of tasks || []) {
        const id =
          t && t.id
            ? String(t.id)
            : "tmp_" + Date.now() + "_" + Math.random().toString(16).slice(2);

        map[id] = t;
      }

      await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(map),
      });

      renderBoardFromStorage();
    } catch (err) {
      console.warn("Failed to sync tasks to remote DB:", err);
    }
  })();
}
