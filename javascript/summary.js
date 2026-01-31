const greeting = document.getElementById("greeting-text");
const hour = new Date().getHours();

if (hour < 12) {
  greeting.textContent = "Good morning!";
} else if (hour < 18) {
  greeting.textContent = "Good afternoon!";
} else {
  greeting.textContent = "Good evening!";
}

function init() {
  getTasksTotal();
  getTasksDone(); 
}

function getTasksTotal() {
  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  let total_tasks = document.getElementById("todos-total");
  total_tasks.innerText = tasks.length;
}

function getTasksDone() {
  let done_tasks = document.getElementById("todos-done");
  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  let Todos_Done = []
  let status = tasks.status = "done";
  if (status) {
    Todos_Done.push(status);
  }
  done_tasks.innerText = Todos_Done.length;
}


// function getTasksUrgent() {
//   const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  
//   let done_tasks = document.getElementById("todos total");
//   done_tasks.innerText = tasks.length;
//   console.log(tasks.length);
// }