const themeToggleBtn = document.getElementById("themeToggleBtn");

function updateMetaThemeColor(isDark) {
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
        metaThemeColor.setAttribute("content", isDark ? "#0f0c29" : "#f8fafc");
    }
}

export function initTheme() {
    // Leer preferencia guardada o verificar si el sistema prefiere modo oscuro
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = savedTheme === "dark" || (!savedTheme && systemPrefersDark);

    if (isDark) {
        document.body.classList.add("dark-mode");
        if (themeToggleBtn) themeToggleBtn.textContent = "☀️";
    } else {
        document.body.classList.remove("dark-mode");
        if (themeToggleBtn) themeToggleBtn.textContent = "🌙";
    }
    
    updateMetaThemeColor(isDark);

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
    
    updateMetaThemeColor(isDark);
}