import { subcategories } from "./data/categories.js";
import { fetchHogarId, fetchMovimientos, insertMovimiento, deleteMovimiento } from "./services/supabaseService.js";
import { updateSummaryCards, renderCategorySummary } from "./modules/summary.js";
import { renderTable, populateCategoryFilter } from "./modules/ui.js";
import { exportToExcel } from "./modules/excel.js";
import { loginUser, logoutUser, getCurrentUser, onAuthStateChange } from "./modules/auth.js";
import { initTheme } from "./modules/theme.js";
import { cambiarVista, filtrarMovimientos } from "./modules/views.js";

let transactions = [];
let currentUser = null;

// Elementos Auth
const loginScreen = document.getElementById("loginScreen");
const appContent = document.getElementById("appContent");
const loginForm = document.getElementById("loginForm");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginError = document.getElementById("loginError");
const logoutBtn = document.getElementById("logoutBtn");
const rememberMe = document.getElementById("rememberMe");
const togglePasswordBtn = document.getElementById("togglePasswordBtn");

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

// Botones de Vistas / Pestañas
const btnMisGastos = document.getElementById("btn-mis-gastos");
const btnPareja = document.getElementById("btn-pareja");
const btnGenerales = document.getElementById("btn-generales");

if (date) date.value = new Date().toISOString().split("T")[0];

if (category) category.addEventListener("change", updateSubcategories);
if (filterType) {
    filterType.addEventListener("change", () => {
        const visible = filtrarMovimientos(transactions, currentUser);
        renderTable(visible, handleDeleteTransaction, currentUser ? currentUser.id : null);
    });
}
if (filterCategory) {
    filterCategory.addEventListener("change", () => {
        const visible = filtrarMovimientos(transactions, currentUser);
        renderTable(visible, handleDeleteTransaction, currentUser ? currentUser.id : null);
    });
}
if (exportBtn) exportBtn.addEventListener("click", () => exportToExcel(transactions, currentUser));

// Configuración de Pestañas (Vistas)
if (btnMisGastos) {
    btnMisGastos.addEventListener("click", () => {
        cambiarVista("mis_gastos", currentUser, transactions, () => renderApp());
    });
}

if (btnPareja) {
    btnPareja.addEventListener("click", () => {
        cambiarVista("pareja", currentUser, transactions, () => renderApp());
    });
}

if (btnGenerales) {
    btnGenerales.addEventListener("click", () => {
        cambiarVista("generales", currentUser, transactions, () => renderApp());
    });
}

// 1. Mostrar/Ocultar contraseña (Ojito)
if (togglePasswordBtn && loginPassword) {
    togglePasswordBtn.addEventListener("click", () => {
        const isPassword = loginPassword.getAttribute("type") === "password";
        const newType = isPassword ? "text" : "password";
        loginPassword.setAttribute("type", newType);
        togglePasswordBtn.textContent = newType === "password" ? "👁️" : "🙈";
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

// 3. Evento Único de Submit del Formulario de Login
if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (loginError) loginError.style.display = "none";

        try {
            const data = await loginUser(loginEmail.value, loginPassword.value);

            // Guardar o borrar correo según el checkbox "Recordar"
            if (rememberMe && rememberMe.checked) {
                localStorage.setItem("rememberedEmail", loginEmail.value);
            } else {
                localStorage.removeItem("rememberedEmail");
            }

            if (data?.user) {
                await loadUserData(data.user);
            }
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
        handleUserLoggedOut();
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
    const visibleTransactions = filtrarMovimientos(transactions, currentUser);
    updateSummaryCards(visibleTransactions);
    populateCategoryFilter(visibleTransactions);
    renderTable(visibleTransactions, handleDeleteTransaction, currentUser ? currentUser.id : null);
    renderCategorySummary(visibleTransactions);
}

async function handleDeleteTransaction(id) {
    const confirmation = confirm("¿Quieres eliminar este movimiento?");
    if (!confirmation) return;

    try {
        await deleteMovimiento(id);
        transactions = transactions.filter(t => t.id !== id);
        renderApp();
    } catch (err) {
        alert(err.message || "No se pudo eliminar el movimiento.");
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
            alert(err.message || "Hubo un error al guardar el movimiento.");
        }
    });
}

async function loadUserData(user) {
    currentUser = user;
    if (loginScreen) loginScreen.style.display = "none";
    if (appContent) appContent.style.display = "block";

    await fetchHogarId();
    transactions = await fetchMovimientos();
    renderApp();
}

function handleUserLoggedOut() {
    currentUser = null;
    transactions = [];
    if (loginScreen) loginScreen.style.display = "block";
    if (appContent) appContent.style.display = "none";
}

// ─── MODAL DE AHORROS ───────────────────────────────────────────────────────
const savingsModal        = document.getElementById("savingsModal");
const savingsModalTitle   = document.getElementById("savingsModalTitle");
const savingsModalDesc    = document.getElementById("savingsModalDesc");
const savingsTransferType = document.getElementById("savingsTransferType");
const savingsTransferForm = document.getElementById("savingsTransferForm");
const savingsTransferAmt  = document.getElementById("savingsTransferAmount");
const savingsTransferDesc = document.getElementById("savingsTransferDesc");
const savingsTransferDate = document.getElementById("savingsTransferDate");
const savingsTransferPriv = document.getElementById("savingsTransferPrivado");
const closeSavingsModalBtn = document.getElementById("closeSavingsModal");
const cancelSavingsModalBtn = document.getElementById("cancelSavingsModal");
const btnWithdrawSavings  = document.getElementById("btnWithdrawSavings");
const btnDepositSavings   = document.getElementById("btnDepositSavings");

function openSavingsModal(mode) {
    if (!savingsModal) return;
    if (savingsTransferType) savingsTransferType.value = mode;
    if (savingsTransferDate) savingsTransferDate.value = new Date().toISOString().split("T")[0];
    if (savingsTransferAmt)  savingsTransferAmt.value  = "";
    if (savingsTransferDesc) savingsTransferDesc.value = "";
    if (savingsTransferPriv) savingsTransferPriv.checked = false;

    if (mode === "withdraw") {
        if (savingsModalTitle) savingsModalTitle.textContent = "💸 Retirar dinero del Ahorro";
        if (savingsModalDesc)  savingsModalDesc.textContent  =
            "El dinero retirado se descontará de tu fondo de ahorro y se sumará a tus ingresos operacionales.";
    } else {
        if (savingsModalTitle) savingsModalTitle.textContent = "📥 Depositar en Ahorro";
        if (savingsModalDesc)  savingsModalDesc.textContent  =
            "El monto ingresado se descontará de tu balance operacional y pasará al fondo de ahorro protegido.";
    }
    savingsModal.style.display = "flex";
}

function closeSavingsModalFn() {
    if (savingsModal) savingsModal.style.display = "none";
}

if (btnWithdrawSavings)   btnWithdrawSavings.addEventListener("click",   () => openSavingsModal("withdraw"));
if (btnDepositSavings)    btnDepositSavings.addEventListener("click",    () => openSavingsModal("deposit"));
if (closeSavingsModalBtn) closeSavingsModalBtn.addEventListener("click", closeSavingsModalFn);
if (cancelSavingsModalBtn) cancelSavingsModalBtn.addEventListener("click", closeSavingsModalFn);
if (savingsModal) {
    savingsModal.addEventListener("click", (e) => { if (e.target === savingsModal) closeSavingsModalFn(); });
}

if (savingsTransferForm) {
    savingsTransferForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const mode  = savingsTransferType?.value;
        const monto = Number(savingsTransferAmt?.value);
        const desc  = savingsTransferDesc?.value?.trim();
        const fecha = savingsTransferDate?.value;
        const priv  = savingsTransferPriv?.checked || false;

        if (!monto || monto <= 0 || !desc || !fecha) return;

        const tipoMovimiento = mode === "withdraw" ? "retiro_ahorro" : "deposito_ahorro";

        try {
            const saved = await insertMovimiento({
                type: tipoMovimiento,
                date: fecha,
                category: "Ahorros",
                subcategory: "",
                description: desc,
                payment: "Transferencia",
                amount: monto,
                es_privado: priv
            });
            if (saved) {
                transactions.unshift(saved);
                renderApp();
            }
            closeSavingsModalFn();
        } catch (err) {
            alert(err.message || "Error al registrar la transferencia de ahorro.");
        }
    });
}

// Suscripción al estado de autenticación en Supabase
onAuthStateChange(async (event, session) => {
    if (session?.user) {
        await loadUserData(session.user);
    } else {
        handleUserLoggedOut();
    }
});

// Inicialización de Tema
initTheme();
