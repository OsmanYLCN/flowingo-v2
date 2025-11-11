const API_URL = "http://127.0.0.1:8000";

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");
    const alertBox = document.getElementById("auth-alert");

    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const username = document.getElementById("reg-username").value;
        const email = document.getElementById("reg-email").value;
        const password = document.getElementById("reg-password").value;

        try {
            const response = await fetch(`${API_URL}/api/auth/register/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (response.status === 201) {

                showAlert("Registration successful! Please log in.", "success");
                document.getElementById('login-tab').click();
                document.getElementById("login-username").value = username;
                document.getElementById("login-password").value = password;
            } else {
                const errorMsg = data.username || data.email || "An error occurred.";
                showAlert(errorMsg, "danger");
            }
        } catch (err) {
            showAlert("Could not connect to server.", "danger");
        }
    });

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault(); 

        const username = document.getElementById("login-username").value;
        const password = document.getElementById("login-password").value;

        try {
            const response = await fetch(`${API_URL}/api/auth/login/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.status === 200) {
                const token = data.token;

                localStorage.setItem("flowingo_token", token);

                showAlert("Login successful! Redirecting...", "success");
                window.location.href = "/dashboard/";

            } else {
                showAlert(data.error || "An error occurred.", "danger");
            }
        } catch (err) {
            showAlert("Could not connect to server.", "danger");
        }
    });

    function showAlert(message, type) {
        alertBox.innerHTML = message;
        alertBox.className = `alert alert-${type}`;
    }
});