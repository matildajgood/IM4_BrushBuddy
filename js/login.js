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
