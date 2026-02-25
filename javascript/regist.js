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
    { name: "PBKDF2", salt: salt, iterations: 100000, hash: "SHA-256" },
    key,
    256,
  );

  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function regData(saltArray) {
  const passwordResult = await hashPasswordWithSalt(password.value, saltArray);
  try {
    if (validateSingUpForm()) {
      const db = "https://join-da53b-default-rtdb.firebaseio.com/";
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
        showRegNotice(
          "Registrierung fehlgeschlagen. Bitte versuche es später.",
          "error",
          4000,
        );
        return null;
      }
      const result = await resp.json();
      registrationSuccessRedirect();
      return result;
    } else {
      showRegNotice("Bitte fülle alle Felder korrekt aus.", "error", 4000);
      return null;
    }
  } catch (err) {
    console.warn("regData error:", err);
    showRegNotice(
      "Netzwerkfehler. Bitte überprüfe deine Verbindung.",
      "error",
      4000,
    );
    return null;
  }
}

function registrationSuccessRedirect() {
  window.location.href = "../index.html?msg=" + encodeURIComponent("You Signed Up successfully.");
}

function showRegNotice(message, type = "info", duration = 4000) {
  const el = document.getElementById("reg-notice");
  if (!el) return;
  el.textContent = message;
  el.style.display = "flex";
  el.style.backgroundColor = type === "error" ? "rgb(42, 54, 71)" : "#d4edda";
  el.style.width = "100%";
  el.style.height = "80px";
  el.style.justifyContent = "center";
  el.style.alignItems = "center";
  el.style.borderRadius = "8px";
  el.style.color = type === "error" ? "#d32828" : "#ffffff";
  el.style.transition = "opacity 0.4s ease";
  el.style.opacity = "1";
  if (duration > 0) {
    setTimeout(() => {
      el.style.opacity = "0";
      setTimeout(() => {
        el.style.display = "block";
        el.textContent = "";
      }, 400);
    }, duration);
  }
}
