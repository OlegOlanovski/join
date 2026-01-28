let tasks = [];
let nextId = 1;
let currentStatus = "todo";
let currentPrio = "medium";
let subtasks = [];

// INIT

document.addEventListener("DOMContentLoaded", () => {
  initOpenButtons();
  initModalControls();
  initPriorityButtons();
  initSubtasks();
  initFormSubmit();
  initDragAndDrop();
  updateEmptyStates();
});

// OPEN MODAL

function initOpenButtons() {
  // plus icons in columns
  document.addEventListener("click", (e) => {
    const plus = e.target.closest(".add-card-icon");
    if (!plus) return;

    const column = plus.closest(".column");
    currentStatus = column?.dataset.status || "todo";
    openAddTaskModal();
  });

  // top button
  const topBtn = document.querySelector(".add-task-button");
  if (topBtn) {
    topBtn.addEventListener("click", () => {
      currentStatus = "todo";
      openAddTaskModal();
    });
  }
}

function openAddTaskModal() {
  resetAddTaskForm();
  const backdrop = document.getElementById("addTaskBackdrop");
  backdrop.hidden = false;
  document.body.style.overflow = "hidden";
  document.getElementById("taskTitle").focus();
}

function closeAddTaskModal() {
  document.getElementById("addTaskBackdrop").hidden = true;
  document.body.style.overflow = "";
}

// MODAL CONTROLS

function initModalControls() {
  document
    .getElementById("addTaskClose")
    ?.addEventListener("click", closeAddTaskModal);
  document
    .getElementById("addTaskCancel")
    ?.addEventListener("click", closeAddTaskModal);

  document.getElementById("addTaskBackdrop")?.addEventListener("click", (e) => {
    if (e.target.id === "addTaskBackdrop") closeAddTaskModal();
  });
}

// PRIORITY

function initPriorityButtons() {
  document.querySelectorAll(".prio-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".prio-btn")
        .forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      currentPrio = btn.dataset.prio;
    });
  });
}

// SUBTASKS

function initSubtasks() {
  document
    .getElementById("subtaskAddBtn")
    ?.addEventListener("click", addSubtask);

  document.getElementById("taskSubtask")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSubtask();
    }
  });
}

function addSubtask() {
  const input = document.getElementById("taskSubtask");
  const value = input.value.trim();
  if (!value) return;

  subtasks.push({ title: value, done: false });
  input.value = "";
  renderSubtasks();
}

function renderSubtasks() {
  const list = document.getElementById("subtaskList");
  list.innerHTML = "";

  subtasks.forEach((s, i) => {
    const li = document.createElement("li");
    li.className = "subtask-item";
    li.innerHTML = `
      <span>${escapeHtml(s.title)}</span>
      <button type="button" class="subtask-remove" data-i="${i}">✕</button>
    `;
    list.appendChild(li);
  });

  list.querySelectorAll(".subtask-remove").forEach((btn) => {
    btn.addEventListener("click", () => {
      subtasks.splice(btn.dataset.i, 1);
      renderSubtasks();
    });
  });
}

// FORM SUBMIT

function initFormSubmit() {
  document
    .getElementById("addTaskForm")
    ?.addEventListener("submit", onCreateTask);
}

function onCreateTask(e) {
  e.preventDefault();

  const titleEl = document.getElementById("taskTitle");
  const dueEl = document.getElementById("taskDue");
  const catEl = document.getElementById("taskCategory");

  const title = titleEl.value.trim();
  const due = dueEl.value;
  const category = catEl.value;

  if (!validateRequired(titleEl, title)) return;
  if (!validateRequired(dueEl, due)) return;
  if (!validateRequired(catEl, category)) return;

  const task = {
    id: nextId++,
    status: currentStatus,
    title,
    description: document.getElementById("taskDesc").value.trim(),
    prio: currentPrio,
    category,
    assigned: ["AM", "EM", "MB"],
    subtasksDone: 0,
    subtasksTotal: subtasks.length,
  };

  tasks.push(task);
  addCardToDOM(task);
  updateEmptyStates();
  closeAddTaskModal();
}

// RESET FORM

function resetAddTaskForm() {
  subtasks = [];
  renderSubtasks();

  document.getElementById("taskTitle").value = "";
  document.getElementById("taskDesc").value = "";
  document.getElementById("taskDue").value = "";
  document.getElementById("taskAssign").value = "";
  document.getElementById("taskCategory").value = "";

  currentPrio = "medium";
  document
    .querySelectorAll(".prio-btn")
    .forEach((b) => b.classList.remove("is-active"));
  document
    .querySelector('.prio-btn[data-prio="medium"]')
    ?.classList.add("is-active");

  document
    .querySelectorAll(".field")
    .forEach((f) => f.classList.remove("is-invalid"));
}

// CARD RENDER

function addCardToDOM(task) {
  const container = document.querySelector(
    `.column[data-status="${task.status}"] .cards`
  );
  if (!container) return;

  const card = document.createElement("div");
  card.className = "card";
  card.draggable = true;
  card.dataset.id = task.id;

  const label = task.category === "tech" ? "Technical Task" : "User Story";
  const labelClass = task.category === "tech" ? "tech" : "user";

  const prioColor =
    task.prio === "urgent"
      ? "#FF3D00"
      : task.prio === "low"
      ? "#7AE229"
      : "#FFA800";

  card.innerHTML = `
    <div class="label ${labelClass}">${label}</div>
    <div class="title">${escapeHtml(task.title)}</div>
    <div class="desc">${escapeHtml(task.description || "Content...")}</div>

    ${
      task.subtasksTotal
        ? `<div class="progress">
            <div class="bar"><div class="fill" style="width:0%"></div></div>
            <span class="subtasks">0/${task.subtasksTotal} Subtasks</span>
           </div>`
        : ""
    }

    <div class="card-footer">
      <div class="users">
        <div class="user u1">AM</div>
        <div class="user u2">EM</div>
        <div class="user u3">MB</div>
      </div>
      <div class="priority" style="background:${prioColor}"></div>
    </div>
  `;

  container.appendChild(card);
}

// EMPTY STATES

function updateEmptyStates() {
  document.querySelectorAll(".column").forEach((col) => {
    const cards = col.querySelector(".cards");
    const empty = col.querySelector(".empty");
    empty.style.display = cards.children.length ? "none" : "block";
  });
}

// DRAG & DROP

function initDragAndDrop() {
  document.addEventListener("dragstart", (e) => {
    const card = e.target.closest(".card");
    if (!card) return;
    e.dataTransfer.setData("text/plain", card.dataset.id);
    requestAnimationFrame(() => card.classList.add("dragging"));
  });

  document.addEventListener("dragend", (e) => {
    const card = e.target.closest(".card");
    card?.classList.remove("dragging");
    document
      .querySelectorAll(".column")
      .forEach((c) => c.classList.remove("drag-over"));
  });

  document.querySelectorAll(".column .cards").forEach((zone) => {
    zone.addEventListener("dragover", (e) => {
      e.preventDefault();
      zone.closest(".column")?.classList.add("drag-over");
    });

    zone.addEventListener("drop", (e) => {
      e.preventDefault();
      const id = e.dataTransfer.getData("text/plain");
      const card = document.querySelector(`.card[data-id="${id}"]`);
      if (!card) return;

      zone.appendChild(card);
      const task = tasks.find((t) => String(t.id) === id);
      if (task) task.status = zone.closest(".column").dataset.status;

      updateEmptyStates();
    });
  });
}

// HELPERS

function validateRequired(input, ok) {
  input.closest(".field")?.classList.toggle("is-invalid", !ok);
  return ok;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
