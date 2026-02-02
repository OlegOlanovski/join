// ================== ADD TASK → SAVE TO STORAGE ==================

let selectedPriority = null;
let pendingSubtasks = [];
const selectedContacts = new Set();

// ------------------ INIT ------------------
document.addEventListener("DOMContentLoaded", () => {
  populateAssignedContacts();
  initPriorityButtons();
  initSubtasks();
  initAssignedDropdown();

  const createBtn = document.getElementById("createTaskBtn");
  const clearBtn = document.querySelector(".primary-btn.--primary-btn-cancel");

  if (createBtn) createBtn.addEventListener("click", createTask);
  if (clearBtn) clearBtn.addEventListener("click", clearForm);
});

// ------------------ PRIORITY ------------------
function initPriorityButtons() {
  const buttons = document.querySelectorAll(".priority-section .priority-btn");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("--selected"));
      btn.classList.add("--selected");
      selectedPriority = btn.textContent.trim();
    });
  });

  const defaultBtn = document.querySelector(".priority-btn.medium");
  if (defaultBtn) {
    defaultBtn.classList.add("--selected");
    selectedPriority = defaultBtn.textContent.trim();
  }
}

// ------------------ SUBTASKS ------------------
function initSubtasks() {
  const input = document.getElementById("subtasks");
  const btn = document.getElementById("addSubtaskBtn");
  const list = document.getElementById("subtasksList");

  if (btn && input) {
    btn.onclick = addSubtasksFromInput;
    input.onkeydown = (e) => e.key === "Enter" && addSubtasksFromInput();
  }

  if (list) {
    list.onclick = (e) => {
      const remove = e.target.closest(".subtasks-remove");
      if (!remove) return;
      pendingSubtasks.splice(remove.dataset.index, 1);
      renderSubtasks();
    };
  }
}

function addSubtasksFromInput() {
  const input = document.getElementById("subtasks");
  if (!input || !input.value.trim()) return;

  input.value
    .split(/[,\n;]+/)
    .map((t) => t.trim())
    .forEach((title) => {
      if (pendingSubtasks.length < 3) {
        pendingSubtasks.push({ title, done: false });
      }
    });

  input.value = "";
  renderSubtasks();
}

function renderSubtasks() {
  const list = document.getElementById("subtasksList");
  if (!list) return;

  list.innerHTML = "";
  pendingSubtasks.forEach((s, i) => {
    list.innerHTML += `
      <li class="subtasks-item">
        <span>${s.title}</span>
        <button class="subtasks-remove" data-index="${i}">x</button>
      </li>`;
  });
}

// ------------------ CONTACTS / MULTI SELECT ------------------
function populateAssignedContacts() {
  const dropdown = document.getElementById("assignedDropdown");
  if (!dropdown) return;

  dropdown.innerHTML = "";
  loadContactsFromStorage().forEach((c) => {
    if (!c?.id || !c?.name) return;

    const row = document.createElement("div");
    row.className = "contact-option";
    row.innerHTML = `
    <div class="contact-avatar">${getInitials(c.name)}</div>
    <span>${c.name}</span>
    <input type="checkbox" ${selectedContacts.has(c.id) ? "checked" : ""}>
    `;

    row.onclick = () => toggleContact(c.id);
    dropdown.appendChild(row);
  });
}

function toggleContact(id) {
  selectedContacts.has(id)
    ? selectedContacts.delete(id)
    : selectedContacts.add(id);

  populateAssignedContacts();
  renderSelectedContacts();
}

function renderSelectedContacts() {
  const text = document.getElementById("assignedText");

  if (!selectedContacts.size) {
    text.textContent = "Select contacts to assign";
    return;
  }

  text.innerHTML = [...selectedContacts]
    .map((id) => {
      const c = loadContactsFromStorage().find((x) => x.id === id);
      return `<span class="contact-avatar">${getInitials(c.name)}</span>`;
    })
    .join("");
}

function initAssignedDropdown() {
  const input = document.getElementById("assignedInput");
  const dropdown = document.getElementById("assignedDropdown");
  const arrow = document.getElementById("dropdownArrow");

  input.onclick = () => {
    dropdown.classList.toggle("hidden");
    arrow.classList.toggle("open");
  };

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".multi-select")) {
      dropdown.classList.add("hidden");
      arrow.classList.remove("open");
    }
  });
}

// ------------------ TASK CREATE ------------------
function createTask() {
  const title = document.getElementById("titel").value.trim();
  const description = document.getElementById("description").value.trim();
  const dueDate = document.getElementById("date").value;
  const category = document.getElementById("category").value;

  if (!title || !dueDate || !category) {
    openValidationModal();
    return;
  }

  const task = {
    id: Date.now().toString(),
    title,
    description,
    dueDate,
    category,
    priority: selectedPriority,
    status: new URLSearchParams(location.search).get("status") || "todo",
    subtasks: [...pendingSubtasks],
    assigned: [...selectedContacts],
  };

  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  tasks.push(task);
  localStorage.setItem("tasks", JSON.stringify(tasks));

  location.href = "./board.html";
}

// ------------------ STORAGE ------------------
function loadContactsFromStorage() {
  try {
    return JSON.parse(localStorage.getItem("join_contacts_v1")) || [];
  } catch {
    return [];
  }
}

// ------------------ HELPERS ------------------
function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

// ------------------ CLEAR ------------------
function clearForm() {
  const title = document.getElementById("titel");
  const description = document.getElementById("description");
  const dueDate = document.getElementById("date");
  const category = document.getElementById("category");
  const assigned = document.getElementById("assigned");
  const subtaskInput = document.getElementById("subtasks");
  const priorityBtns = document.querySelectorAll(".priority-section li");
  if (title) title.value = "";
  if (description) description.value = "";
  if (dueDate) dueDate.value = "";
  if (category) category.value = "";
  if (assigned) assigned.value = "";
  if (subtaskInput) subtaskInput.value = "";
  if (selectedContacts) selectedContacts.clear(); 
  pendingSubtasks = [];
  renderSubtasks();
  priorityBtns.forEach((btn) => btn.classList.remove("--selected"));
  selectedPriority = null;
}
