/** @type {string} Base URL for task database */
const DB_TASK_URL =
  window.DB_TASK_URL || "https://join-da53b-default-rtdb.firebaseio.com/";

/** @type {string} URL to the board page */
const BOARD_PAGE_URL = "./board.html";

/** @type {string[]} Month names */
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** @type {HTMLElement|null} Element displaying urgent tasks count */
const urgent_tasks = document.getElementById("todo-status-urgent");
/** @type {HTMLElement|null} Element displaying month of nearest urgent task */
let urgent_tasks_months = document.getElementById("months");
/** @type {HTMLElement|null} Element displaying day of nearest urgent task */
let urgent_tasks_day = document.getElementById("day");
/** @type {HTMLElement|null} Element displaying year of nearest urgent task */
let urgent_tasks_year = document.getElementById("year");

/** @type {string[]} List of urgent task priorities or IDs */
let Todos_urgent = [];
/** @type {Date|null} Date of the nearest urgent task */
let nearestUrgentDate = null;

/**
 * Navigates to the board page.
 */
function goToBoard() {
  window.location.href = BOARD_PAGE_URL;
}

/**
 * Fetches a node from the Firebase database with multiple fallback strategies.
 * @param {string} nodeName - Name of the node to fetch.
 * @returns {Promise<Object|Array|null>} Resolves to the node data or null if not found.
 */
async function fetchDBNode(nodeName) {
  try {
    const resp = await fetch(DB_TASK_URL + nodeName + ".json");
    const data = await resp.json();
    if (data != null) return data;
  } catch (e) {}

  try {
    const r = await fetch(DB_TASK_URL + ".json");
    const root = await r.json();
    if (!root) return null;

    if (Array.isArray(root)) {
      const entry = root.find((e) => e && e.id === nodeName);
      if (entry) {
        const clone = Object.assign({}, entry);
        delete clone.id;
        if (clone.hasOwnProperty(nodeName)) return clone[nodeName];
        const keys = Object.keys(clone);
        if (keys.length) return clone;
      }
    } else if (typeof root === "object") {
      const vals = Object.values(root);
      for (let i = 0; i < vals.length; i++) {
        const e = vals[i];
        if (e && e.id === nodeName) {
          const clone = Object.assign({}, e);
          delete clone.id;
          if (clone.hasOwnProperty(nodeName)) return clone[nodeName];
          const keys = Object.keys(clone);
          if (keys.length) return clone;
        }
      }
      if (root[nodeName] !== undefined) return root[nodeName];
    }
  } catch (e) {}
  return null;
}

/**
 * Syncs tasks from Firebase to IndexedDB (if available) and returns the list of tasks.
 * @returns {Promise<Array<Object>>} List of tasks
 */
async function syncTasksFromDB() {
  try {
    const data = await fetchDBNode("tasks");
    let tasks = [];
    if (!data) tasks = [];
    else if (Array.isArray(data)) tasks = data.filter(Boolean);
    else
      tasks = Object.entries(data).map(([k, v]) => ({
        ...(v || {}),
        id: v && v.id ? v.id : k,
      }));

    if (
      window.idbStorage &&
      typeof window.idbStorage.saveTasks === "function"
    ) {
      try {
        await window.idbStorage.saveTasks(tasks);
        try {
          const local = window.idbStorage.getTasksSync
            ? window.idbStorage.getTasksSync()
            : null;
        } catch (readErr) {
          console.warn(
            "syncTasksFromDB: saved to IDB but failed to read back:",
            readErr,
          );
        }
      } catch (err) {
        console.warn("Failed to save tasks to IDB:", err);
      }
    }

    return tasks;
  } catch (e) {
    console.warn("Failed to sync tasks from DB", e);
    throw e;
  }
}

/**
 * Initializes the dashboard page:
 * - Waits for IndexedDB to be ready
 * - Syncs tasks
 * - Updates greeting and task statistics
 */
async function init() {
  await (window.idbStorage && window.idbStorage.ready
    ? window.idbStorage.ready
    : Promise.resolve());
  try {
    await syncTasksFromDB();
  } catch (e) {
    console.warn("Initial tasks sync failed, continuing with local cache", e);
  }

  getCokkieCheck();
  greetingText();
  getTasksTotal();
  getTasksDone();
  getTasksProgress();
  getAwaitFeedback();
  getUrgrentTodo();
}

/**
 * Updates greeting text based on time of day and logged-in user.
 */
function greetingText() {
  const el = document.getElementById("greeting-text");
  if (!el) return;

  const h = new Date().getHours();
  const base =
    h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";

  try {
    let name;
    const cookieMatch = document.cookie
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("loggedInUser="));
    if (cookieMatch) {
      const cookieValue = cookieMatch.split("=")[1];
      name = JSON.parse(decodeURIComponent(cookieValue));
    } else if (sessionStorage.getItem("loggedInUser")) {
      name = JSON.parse(sessionStorage.getItem("loggedInUser"));
    }
    el.textContent = `${base}, ${name}!`;
  } catch (e) {
    el.textContent = base + "!";
  }
}

/**
 * Updates total tasks and "todos" count in the dashboard.
 */
function getTasksTotal() {
  const tasks =
    window.idbStorage && typeof window.idbStorage.getTasksSync === "function"
      ? window.idbStorage.getTasksSync()
      : [];
  const filteredTasks = tasks.filter((task) => task.title !== undefined);

  const tasks_to_board = document.getElementById("task-in-board");
  const todo_tasks = document.getElementById("todos-total");

  let Todos = [];
  for (let i = 0; i < tasks.length; i++) {
    const status = tasks[i].status;
    if (status == "todo") Todos.push(status);
    if (todo_tasks) todo_tasks.innerText = Todos.length;
  }

  if (tasks_to_board) tasks_to_board.innerText = filteredTasks.length;
}

/**
 * Updates "done" tasks count in the dashboard.
 */
function getTasksDone() {
  const tasks =
    window.idbStorage && typeof window.idbStorage.getTasksSync === "function"
      ? window.idbStorage.getTasksSync()
      : [];
  const done_tasks = document.getElementById("todos-done");

  let Todos_Done = [];
  for (let i = 0; i < tasks.length; i++) {
    const status = tasks[i].status;
    if (status == "done") Todos_Done.push(status);
    if (done_tasks) done_tasks.innerText = Todos_Done.length;
  }
}

/**
 * Updates "in progress" tasks count in the dashboard.
 */
function getTasksProgress() {
  const tasks =
    window.idbStorage && typeof window.idbStorage.getTasksSync === "function"
      ? window.idbStorage.getTasksSync()
      : [];
  const progress_tasks = document.getElementById("task-in-pogress");

  let Todos_progress = [];
  for (let i = 0; i < tasks.length; i++) {
    const status = tasks[i].status;
    if (status == "progress") Todos_progress.push(status);
    if (progress_tasks) progress_tasks.innerText = Todos_progress.length;
  }
}

/**
 * Updates "awaiting feedback" tasks count in the dashboard.
 */
function getAwaitFeedback() {
  const tasks =
    window.idbStorage && typeof window.idbStorage.getTasksSync === "function"
      ? window.idbStorage.getTasksSync()
      : [];
  const feedback_tasks = document.getElementById("task-in-feedback");

  let Todos_feedback = [];
  for (let i = 0; i < tasks.length; i++) {
    const status = tasks[i].status;
    if (status == "feedback") Todos_feedback.push(status);
    if (feedback_tasks) feedback_tasks.innerText = Todos_feedback.length;
  }
}

/**
 * Finds all urgent tasks and updates the dashboard section with the nearest urgent task date.
 */
function getUrgrentTodo() {
  const tasks =
    window.idbStorage && typeof window.idbStorage.getTasksSync === "function"
      ? window.idbStorage.getTasksSync()
      : [];

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const priority = String(task.priority || "").toLowerCase();
    const dueDate = task.dueDate || task.due || "";
    const newDueDate = dueDate ? new Date(dueDate) : null;

    if (priority === "urgent") {
      Todos_urgent.push(priority);
      if (newDueDate && !isNaN(newDueDate)) {
        if (!nearestUrgentDate || newDueDate < nearestUrgentDate) {
          nearestUrgentDate = newDueDate;
        }
      }
      if (urgent_tasks) urgent_tasks.innerText = Todos_urgent.length;
    }
  }

  if (nearestUrgentDate) {
    if (urgent_tasks_months)
      urgent_tasks_months.innerText = months[nearestUrgentDate.getMonth()];
    if (urgent_tasks_day)
      urgent_tasks_day.innerText = nearestUrgentDate.getDate();
    if (urgent_tasks_year)
      urgent_tasks_year.innerText = nearestUrgentDate.getFullYear();
  }
}
