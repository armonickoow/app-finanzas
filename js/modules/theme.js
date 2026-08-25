const themeToggleBtn = document.getElementById("themeToggleBtn");

export function initTheme() {
    // Leer preferencia guardada o verificar si el sistema prefiere modo oscuro
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
        document.body.classList.add("dark-mode");
        if (themeToggleBtn) themeToggleBtn.textContent = "☀️";
    } else {
        document.body.classList.remove("dark-mode");
        if (themeToggleBtn) themeToggleBtn.textContent = "🌙";
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener("click", toggleTheme);
    }
}

function toggleTheme() {
    const isDark = document.body.classList.toggle("dark-mode");
    
    if (isDark) {
        localStorage.setItem("theme", "dark");
        if (themeToggleBtn) themeToggleBtn.textContent = "☀️";
    } else {
        localStorage.setItem("theme", "light");
        if (themeToggleBtn) themeToggleBtn.textContent = "🌙";
    }
}