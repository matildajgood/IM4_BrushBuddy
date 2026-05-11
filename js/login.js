// login.js

// Login form
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorEl = document.getElementById("loginError");
  errorEl.classList.add("hidden");

  try {
    const response = await fetch("api/login.php", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const result = await response.json();

    if (result.status === "success") {
      window.location.href = "protected.html";
    } else {
      errorEl.classList.remove("hidden");
    }
  } catch (error) {
    console.error("Error:", error);
    errorEl.classList.remove("hidden");
  }
});

// Passwort vergessen toggle
document.getElementById("forgotToggle").addEventListener("click", () => {
  const section = document.getElementById("forgotSection");
  const isHidden = section.classList.contains("hidden");
  section.classList.toggle("hidden");
  document.getElementById("forgotToggle").textContent = isHidden
    ? "Abbrechen"
    : "Passwort vergessen?";
});

// Passwort vergessen form
document.getElementById("forgotForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("resetEmail").value.trim();
  const errorEl = document.getElementById("forgotError");
  const successEl = document.getElementById("forgotSuccess");
  errorEl.classList.add("hidden");
  successEl.classList.add("hidden");

  try {
    const response = await fetch("api/forgot-password.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const result = await response.json();

    if (result.status === "success") {
      successEl.classList.remove("hidden");
      document.getElementById("resetEmail").value = "";
    } else if (result.message === "email_not_found") {
      errorEl.textContent = "Diese E-Mail-Adresse ist nicht registriert.";
      errorEl.classList.remove("hidden");
    } else if (result.message === "not_available") {
      errorEl.textContent = "Diese Funktion ist zurzeit nicht verfügbar.";
      errorEl.classList.remove("hidden");
    } else {
      errorEl.textContent = "Ein Fehler ist aufgetreten. Bitte versuche es erneut.";
      errorEl.classList.remove("hidden");
    }
  } catch (error) {
    console.error("Error:", error);
    errorEl.textContent = "Ein Fehler ist aufgetreten. Bitte versuche es erneut.";
    errorEl.classList.remove("hidden");
  }
});
