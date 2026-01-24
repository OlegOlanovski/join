let email = document.getElementById("mail");
let password = document.getElementById("password");

function validateLoginForm() {
  // Email prüfen
  if (email.value.includes("@") && email.value.length > 0) {
    email.classList.add("isValidate");
    email.classList.remove("isInvaled");
  } else {
    email.classList.add("isInvaled");
    email.classList.remove("isValidate");
  }

  // Password prüfen
  if (password.value.length >= 6) {
    password.classList.add("isValidate");
    password.classList.remove("isInvaled");
  } else {
    password.classList.add("isInvaled");
    password.classList.remove("isValidate");
  }
}
