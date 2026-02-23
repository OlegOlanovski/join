/**
 * Adds the "loaded" class to the body shortly after the page has finished loading.
 * Used for triggering CSS animations or transitions.
 */
window.addEventListener("load", () => {
  setTimeout(() => {
    document.body.classList.add("loaded");
  }, 100);
});

/**
 * Redirects the user to the signup / registration page.
 *
 * @returns {void}
 */
function goToSignup() {
  window.location.href = "./subpages/regist.html";
}

/**
 * Toggles the open state of a custom select dropdown.
 * Adds or removes the "open" class on the wrapper element.
 *
 * @returns {void}
 */
function selectAnimate() {
  const wrapper = document.querySelector(".select-wrapper");
  if (wrapper) wrapper.classList.toggle("open");
}
