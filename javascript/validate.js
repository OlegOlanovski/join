let full_name = document.getElementById("name");
let email = document.getElementById("mail");
let password = document.getElementById("password");
let infoPassword = document.getElementById("info-password");
let confirmPassword = document.getElementById("confirm-password");
let infoConfirmPassword = document.getElementById("info-confirm-password");
let isAccept = document.getElementById("accept-id");
let isAcceptPolice = document.getElementById("accept-police");
let singupButton = document.getElementById("singup-button");
let iconImgMail = document.getElementById("email-icon");
let iconImg = document.getElementById("lock-icon");
/**
 * Input  Name prüfen
 */
function validateFullname() {
  const ok = full_name.value.trim() !== "";

  if (ok) {
    full_name.classList.add("isValidate");
    full_name.classList.remove("isInvaled");
  } else {
    full_name.classList.add("isInvaled");
    full_name.classList.remove("isValidate");
  }

  return ok;
}
/**
 * Akzeptiert einen String und gibt true/false zurück
 */
function validateEmailRegEx(emailInput) {
  const value =
    typeof emailInput === "string"
      ? emailInput
      : (emailInput && emailInput.value) || "";
  const pattern =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return pattern.test(String(value).toLowerCase());
}
/**
 * Email prüfen
 */
function validateEmail() {
  const isValid = validateEmailRegEx(email);

  if (!iconImgMail) {
    iconImgMail = document.createElement("img");
    iconImgMail.id = "email-icon";
    email.appendChild(iconImgMail);
  }

  if (isValid) {
    iconImgMail.src = "../assets/icons/check-gray.svg";
    email.classList.remove("isInvaled");
    email.classList.add("isValidate");
  } else {
    email.classList.add("isInvaled");
    email.classList.remove("isValidate");
  }

  return isValid;
}
/**
 * Password prüfen
 */
function updatePasswordIcon() {
  if (password.value.length === 0) {
    if (!iconImg) return;
    iconImg.src = "../assets/icons/lock.png";
    return;
  }
  if (!iconImg) return;
  iconImg.src =
    password.type === "text"
      ? "../assets/icons/visibility.svg"
      : "../assets/icons/visibility_off.svg";
}

// Initial prüfen
(function() {
  toggleIconState();
  password.addEventListener("input", toggleIconState);
  password.addEventListener("click", (e) => {
    if (!password.value) return;
    const clickOnIcon = e.offsetX > password.offsetWidth - 35;
    if (!clickOnIcon) return;
    password.type = password.type === "password" ? "text" : "password";
    password.classList.toggle("show-password");
    updatePasswordIcon();
  });
  if (!confirmPassword) return;
  confirmPassword.addEventListener("input", toggleIconState);
  confirmPassword.addEventListener("click", (e) => {
    if (!confirmPassword.value) return;

    const clickOnIcon = e.offsetX > confirmPassword.offsetWidth - 35;
    if (!clickOnIcon) return;
    const hidden2 = confirmPassword.type === "password";
    confirmPassword.type = hidden2 ? "text" : "password";
    confirmPassword.classList.toggle("show-password", hidden2);
  });

  function toggleIconState() {
    if (password.value.length === 0) {
      password.classList.add("password-empty");
      password.type = "password";
      password.classList.remove("show-password");
    } else {
      password.classList.remove("password-empty");
    }
    updatePasswordIcon();
  }
})();


function validatePassword() {
  const ok = password.value.length > 5;

  if (ok) {
    password.classList.add("isValidate");
    password.classList.add("visibility-off");
    password.classList.remove("isInvaled");
    infoPassword.style.visibility = "hidden";
  } else {
    infoPassword.style.visibility = "visible";
    password.classList.add("isInvaled");
    password.classList.remove("isValidate");
    password.classList.remove("visibility-off");
    if (iconImg) {
      iconImg.src = "../assets/icons/lock.png";
    }

    updatePasswordIcon();
  }

  return ok;
}
/**
 *  Confirm Password prüfen
 */
function validateConfirmPassword() {
  validatePassword();

  const ok = confirmPassword.value !== "" && password.value === confirmPassword.value;

  if (ok) {
    confirmPassword.classList.add("isValidate");
    confirmPassword.classList.remove("isInvaled");
    infoPassword.style.visibility = "hidden";
    infoConfirmPassword.style.visibility = "hidden";
  } else {
    infoPassword.style.visibility = "visible";
    infoConfirmPassword.style.visibility = "visible";
    confirmPassword.classList.add("isInvaled");
    confirmPassword.classList.remove("isValidate");
  }

  return ok;
}

function validateCheckbox() {
  const ok = isAccept.checked;

  if (ok) {
    isAcceptPolice.classList.add("accept-police");
    document.getElementById("singup-button").classList.remove("disebles-singup-button");
  document.getElementById("singup-button").disabled = false;
  } else {
    isAcceptPolice.classList.remove("accept-police");
  }

  return ok;
}
/**
 *  Formular Validierung - Alle Felder prüfen
 *  Gibt true zurück, wenn alle Felder gültig sind
 */
function validateSingUpForm() {
  const okCheckbox = validateCheckbox();
  const okName = validateFullname();
  const okEmail = validateEmail();
  const okPass = validatePassword();
  const okConfirm = validateConfirmPassword();

  const allValid = okCheckbox && okName && okEmail && okPass && okConfirm;

  if (!allValid) {
    document.getElementById("singup-button").disabled = true;
    document.getElementById("singup-button").classList.add("disebles-singup-button");
    return false;
  }
  document.getElementById("singup-button").classList.remove("disebles-singup-button");
  document.getElementById("singup-button").disabled = false;
  isAcceptPolice.classList.add("accept-police");

  return true;
}
