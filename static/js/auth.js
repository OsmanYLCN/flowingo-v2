const API_URL = "http://127.0.0.1:8000";

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");
    const alertBox = document.getElementById("auth-alert");

    // --- 1. KAYIT İŞLEMİ ---
    if(registerForm) {
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
                    // Kayıt başarılı olunca Login'e tıkla
                    const loginTabBtn = document.getElementById('login-tab');
                    if(loginTabBtn) loginTabBtn.click();
                    
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
    }

    // --- 2. GİRİŞ İŞLEMİ ---
    if(loginForm) {
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
                    showAlert(data.error || "Invalid Credentials", "danger");
                }
            } catch (err) {
                showAlert("Could not connect to server.", "danger");
            }
        });
    }

    // --- 3. LOGOUT FONKSİYONU ---
    window.performLogout = async function() {
        const token = localStorage.getItem("flowingo_token");
        if(token) {
            try {
                await fetch(`${API_URL}/api/auth/logout/`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Token ${token}`
                    }
                });
            } catch (error) { console.log("Logout error", error); }
        }
        localStorage.removeItem("flowingo_token");
        window.location.href = "/";
    };

    function showAlert(message, type) {
        if(alertBox) {
            alertBox.innerHTML = message;
            alertBox.className = `alert alert-${type}`;
            alertBox.classList.remove('d-none');
        }
    }
});