const loginForm = document.querySelector("#login-form");
const registerForm = document.querySelector("#register-form");

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const { user } = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(formData(loginForm))
      });
      location.href = user.role === "admin" ? "/admin.html" : "/dashboard.html";
    } catch (error) {
      setMessage(error.message, "error");
    }
  });
}

if (registerForm) {
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(formData(registerForm))
      });
      location.href = "/dashboard.html";
    } catch (error) {
      setMessage(error.message, "error");
    }
  });
}
