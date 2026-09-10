import { subcategories } from "./data/categories.js";
import { fetchHogarId, fetchMovimientos, insertMovimiento, deleteMovimiento } from "./services/supabaseService.js";
import { updateSummaryCards, renderCategorySummary } from "./modules/summary.js";
import { renderTable, populateCategoryFilter } from "./modules/ui.js";
import { exportToExcel } from "./modules/excel.js";
import { loginUser, logoutUser, getCurrentUser } from "./modules/auth.js";
import { initTheme } from "./modules/theme.js";
import { cambiarVista, filtrarMovimientos } from './modules/views.js';

let transactions = [];

// Elementos Auth
const loginScreen = document.getElementById("loginScreen");
const appContent = document.getElementById("appContent");
const loginForm = document.getElementById("loginForm");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginError = document.getElementById("loginError");
const logoutBtn = document.getElementById("logoutBtn");

// Elementos Formulario Principal
const form = document.getElementById("financeForm");
const type = document.getElementById("type");
const date = document.getElementById("date");
const category = document.getElementById("category");
const subcategory = document.getElementById("subcategory");
const description = document.getElementById("description");
const payment = document.getElementById("payment");
const amount = document.getElementById("amount");
const esPrivado = document.getElementById("esPrivado");
const filterType = document.getElementById("filterType");
const filterCategory = document.getElementById("filterCategory");
const exportBtn = document.getElementById("exportExcel");

if (date) date.value = new Date().toISOString().split("T")[0];

if (category) category.addEventListener("change", updateSubcategories);
if (filterType) filterType.addEventListener("change", () => renderTable(transactions, handleDeleteTransaction));
if (filterCategory) filterCategory.addEventListener("change", () => renderTable(transactions, handleDeleteTransaction));
if (exportBtn) exportBtn.addEventListener("click", () => exportToExcel(transactions));

// Evento Iniciar Sesión
if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (loginError) loginError.style.display = "none";
        try {
            await loginUser(loginEmail.value, loginPassword.value);
            await checkAuthAndLoad();
        } catch (err) {
            if (loginError) {
                loginError.textContent = "Correo o contraseña incorrectos.";
                loginError.style.display = "block";
            }
        }
    });
}

// Evento Cerrar Sesión
if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        await logoutUser();
        checkAuthAndLoad();
    });
}

function updateSubcategories() {
    const selected = category.value;
    subcategory.innerHTML = `<option value="">Seleccionar</option>`;
    if (!selected) return;

    const options = subcategories[selected] || [];
    options.forEach(item => {
        const option = document.createElement("option");
        option.value = item;
        option.textContent = item;
        subcategory.appendChild(option);
    });
}

// Manejo del menú Hamburguesa para vista móvil
const hamburgerBtn = document.getElementById("hamburgerBtn");
const navbarActions = document.getElementById("navbarActions");

if (hamburgerBtn && navbarActions) {
    hamburgerBtn.addEventListener("click", () => {
        navbarActions.classList.toggle("active");
    });
}

function renderApp() {
    updateSummaryCards(transactions);
    populateCategoryFilter(transactions);
    renderTable(transactions, handleDeleteTransaction);
    renderCategorySummary(transactions);
}

async function handleDeleteTransaction(id) {
    const confirmation = confirm("¿Quieres eliminar este movimiento?");
    if (!confirmation) return;

    try {
        await deleteMovimiento(id);
        transactions = transactions.filter(t => t.id !== id);
        renderApp();
    } catch (err) {
        alert("No se pudo eliminar el movimiento.");
    }
}

if (form) {
    form.addEventListener("submit", async function(event) {
        event.preventDefault();

        const newTransaction = {
            type: type.value,
            date: date.value,
            category: category.value,
            subcategory: subcategory.value,
            description: description.value,
            payment: payment.value,
            amount: Number(amount.value),
            es_privado: esPrivado ? esPrivado.checked : false
        };

        try {
            const savedItem = await insertMovimiento(newTransaction);
            if (savedItem) {
                transactions.unshift(savedItem);
                renderApp();
                form.reset();
                if (date) date.value = new Date().toISOString().split("T")[0];
                subcategory.innerHTML = `<option value="">Seleccionar</option>`;
            }
        } catch (err) {
            alert("Hubo un error al guardar el movimiento.");
        }
    });
}

async function checkAuthAndLoad() {
    const user = await getCurrentUser();
    if (user) {
        if (loginScreen) loginScreen.style.display = "none";
        if (appContent) appContent.style.display = "block";
        await fetchHogarId();
        transactions = await fetchMovimientos();
        renderApp();
    } else {
        if (loginScreen) loginScreen.style.display = "block";
        if (appContent) appContent.style.display = "none";
    }
}

// Referencias extra para Login y Ojito
const rememberMe = document.getElementById("rememberMe");
const togglePasswordBtn = document.getElementById("togglePasswordBtn");

// 1. Mostrar/Ocultar contraseña (Ojito)
if (togglePasswordBtn && loginPassword) {
    togglePasswordBtn.addEventListener("click", () => {
        const type = loginPassword.getAttribute("type") === "password" ? "text" : "password";
        loginPassword.setAttribute("type", type);
        togglePasswordBtn.textContent = type === "password" ? "👁️" : "🙈";
    });
}

// 2. Cargar correo recordado si existe
if (loginEmail && rememberMe) {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
        loginEmail.value = savedEmail;
        rememberMe.checked = true;
    }
}

// 3. Evento de Submit del Formulario de Login
if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (loginError) loginError.style.display = "none";

        try {
            await loginUser(loginEmail.value, loginPassword.value);

            // Guardar o borrar correo según el checkbox "Recordar"
            if (rememberMe && rememberMe.checked) {
                localStorage.setItem("rememberedEmail", loginEmail.value);
            } else {
                localStorage.removeItem("rememberedEmail");
            }

            await checkAuthAndLoad();
        } catch (err) {
            if (loginError) {
                loginError.textContent = "Correo o contraseña incorrectos.";
                loginError.style.display = "block";
            }
        }
    });
}

// Inicializar la aplicación
checkAuthAndLoad();
initTheme();
