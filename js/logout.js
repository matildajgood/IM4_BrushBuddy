// logout.js
document.getElementById("logoutBtn").addEventListener("click", async (e) => {
  // Prevent the default button behavior
  e.preventDefault();

  try {
    const response = await fetch("api/logout.php", {
      method: "GET",
      credentials: "include",
    });

    const result = await response.json();

    if (result.status === "success") {
      // Redirect to login page after successful logout
      window.location.href = "login.html";
    } else {
      console.error("Logout failed");
      alert("Abmelden fehlgeschlagen. Bitte erneut versuchen.");
    }
  } catch (error) {
    console.error("Logout error:", error);
    alert("Beim Abmelden ist ein Fehler aufgetreten!");
  }
});
