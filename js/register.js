// register.js
document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const vorname  = document.getElementById("vorname").value.trim();
  const name     = document.getElementById("name").value.trim();
  const email    = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorEl  = document.getElementById("registerError");
  const successEl = document.getElementById("registerSuccess");

  errorEl.classList.add("hidden");
  successEl.classList.add("hidden");

  try {
    const response = await fetch("api/register.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vorname, name, email, password }),
    });
    const result = await response.json();

    if (result.status === "success") {
      successEl.textContent = "Konto erstellt! Du wirst weitergeleitet…";
      successEl.classList.remove("hidden");
      setTimeout(() => { window.location.href = "login.html"; }, 1500);
    } else {
      errorEl.textContent = result.message || "Registrierung fehlgeschlagen.";
      errorEl.classList.remove("hidden");
    }
  } catch (error) {
    errorEl.textContent = "Etwas ist schiefgelaufen. Bitte erneut versuchen.";
    errorEl.classList.remove("hidden");
  }
});
