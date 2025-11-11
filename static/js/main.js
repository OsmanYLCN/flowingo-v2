document.addEventListener("DOMContentLoaded", () => {

    const navCenterLinks = document.getElementById("nav-center-links");
    const navLoginLink = document.getElementById("nav-login-link");
    const navLogoutLink = document.getElementById("nav-logout-link");
    const logoutButton = document.getElementById("logout-button");

    const token = localStorage.getItem("flowingo_token");

    if (token) {

        if (navCenterLinks) navCenterLinks.style.display = "block"; 
        
        if (navLoginLink) navLoginLink.style.display = "none";
        
        if (navLogoutLink) navLogoutLink.style.display = "block"; 

    } else {
        
        if (navCenterLinks) navCenterLinks.style.display = "none";     

        if (navLoginLink) navLoginLink.style.display = "block";  

        if (navLogoutLink) navLogoutLink.style.display = "none";     
    }

    if (logoutButton) {
        logoutButton.addEventListener("click", (e) => {
            e.preventDefault();

            localStorage.removeItem("flowingo_token");

            window.location.href = "/auth/";
        });
    }
});