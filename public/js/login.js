document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("login-form").addEventListener("submit", async (event) => {
      event.preventDefault();
  
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
  
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
  
        const result = await response.json();
  
        if (response.ok) {
          localStorage.setItem("token", result.token);
          localStorage.setItem("voterId", result.user ? result.user.voterId : result.userId);
          localStorage.setItem("phoneNumber", result.user ? result.user.phoneNumber : result.phoneNumber);
          window.location.href = "/dashboard.html"; // Direct to dashboard.html
        } else {
          alert(result.error || result.message || "Login failed. Please check your credentials.");
        }
      } catch (error) {
        console.error("Login error:", error);
        alert("Something went wrong. Please try again.");
      }
    });
  });
  