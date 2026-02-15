window.addEventListener("load", () => {
  setTimeout(() => {
    document.body.classList.add("loaded");
  }, 100);
});

function goToSignup() {
  window.location.href = "./subpages/regist.html";
}

function goToSummary() {
  try { sessionStorage.setItem("guest", "1"); } catch (e) {}
  window.location.href = "./subpages/summary_guest.html";
}


// addTasks.html Select fild Aniemation
function selectAnimate() {
  const wrapper = document.querySelector(".select-wrapper");
  wrapper.classList.toggle("open");
}