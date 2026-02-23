/**
 * Hashes a password with a given salt using PBKDF2 + SHA-256.
 * @param {string} password - The password to hash.
 * @param {Array<number>} saltArray - The salt as an array of byte values.
 * @returns {Promise<string>} The resulting hash as a hex string.
 */
async function hashPasswordWithSalt(password, saltArray) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const salt = new Uint8Array(saltArray);

  const key = await crypto.subtle.importKey(
    "raw",
    data,
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );

  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    key,
    256,
  );

  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Sends registration data to the Firebase Realtime Database.
 * - Hashes the password
 * - Validates the signup form (if validateSingUpForm exists)
 * - Sends POST request to database
 * @param {Array<number>} saltArray - The salt for password hashing.
 * @returns {Promise<Object|null>} The server response JSON, or null if error occurs.
 */
async function regData(saltArray) {
  const passwordResult = await hashPasswordWithSalt(password.value, saltArray);

  try {
    validateSingUpForm();
  } catch (e) {
    // Ignore validation errors here
  }

  const db = "https://join-da53b-default-rtdb.firebaseio.com/";

  try {
    const resp = await fetch(db + "register.json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        namen: full_name.value,
        mail: email.value,
        passwort: passwordResult,
      }),
    });

    if (!resp.ok) {
      showRegNotice("Registration failed. Please try again later.", "error");
      return null;
    }

    const result = await resp.json();

    // On success → redirect immediately
    registrationSuccessRedirect();

    return result;
  } catch (err) {
    console.warn("regData error:", err);
    showRegNotice("Network error. Please check your connection.", "error");
    return null;
  }
}

/**
 * Redirects the user to the index page with a success message.
 */
function registrationSuccessRedirect() {
  window.location.href =
    "../index.html?msg=" + encodeURIComponent("You Signed Up successfully.");
}

/**
 * Displays a temporary registration notice.
 * @param {string} message - The message to display.
 * @param {"info"|"error"} [type="info"] - The type of notice.
 * @param {number} [duration=4000] - Duration in milliseconds to show the notice (0 = permanent).
 */
function showRegNotice(message, type = "info", duration = 4000) {
  const el = document.getElementById("reg-notice");
  if (!el) return;

  el.textContent = message;
  el.style.display = "block";
  el.style.backgroundColor = type === "error" ? "rgb(26, 26, 26)" : "#d4edda";
  el.style.width = "80%";
  el.style.height = "55px";
  el.style.position = "relative";
  el.style.top = "-130px";
  el.style.textAlign = "center";
  el.style.color = type === "error" ? "#d32828" : "#ffffff";
  el.style.transition = "opacity 0.4s ease";
  el.style.opacity = "1";

  if (duration > 0) {
    setTimeout(() => {
      el.style.opacity = "0";
      setTimeout(() => {
        el.style.display = "none";
        el.textContent = "";
      }, 400);
    }, duration);
  }
}
