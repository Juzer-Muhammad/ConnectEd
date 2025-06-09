// script.js

// Toggle between login and register sections
document.addEventListener("DOMContentLoaded", function () {
    const registerBtn = document.getElementById("show-register");
    const loginBtn = document.getElementById("show-login");
    const registerForm = document.getElementById("register-section");
    const loginForm = document.getElementById("login-section");

    if (registerBtn && loginBtn && registerForm && loginForm) {
        registerBtn.addEventListener("click", () => {
            registerForm.style.display = "block";
            loginForm.style.display = "none";
        });

        loginBtn.addEventListener("click", () => {
            loginForm.style.display = "block";
            registerForm.style.display = "none";
        });
    }

    // Example form handlers (these will not connect to backend)
    const registerSubmit = document.getElementById("register-form");
    const loginSubmit = document.getElementById("login-form");

    if (registerSubmit) {
        registerSubmit.addEventListener("submit", function (e) {
            e.preventDefault();
            alert("Registration form submitted! Backend not implemented yet.");
        });
    }

    if (loginSubmit) {
        loginSubmit.addEventListener("submit", function (e) {
            e.preventDefault();
            alert("Login form submitted! Backend not implemented yet.");
        });
    }
});
