import { formatCLP, formatDate } from "./summary.js";

const table = document.getElementById("transactionsTable");
const filterType = document.getElementById("filterType");
const filterCategory = document.getElementById("filterCategory");

export function renderTable(transactions, onDeleteCallback) {
    if (!table) return;
    table.innerHTML = "";
    let filtered = [...transactions];

    const selectedType = filterType.value;
    const selectedCategory = filterCategory.value;

    if (selectedType !== "todos") {
        filtered = filtered.filter(t => t.type === selectedType);
    }

    if (selectedCategory !== "todos") {
        filtered = filtered.filter(t => t.category === selectedCategory);
    }

    filtered.forEach(transaction => {
        const row = document.createElement("tr");

        let typeText = "";
        let typeClass = "";

        if (transaction.type === "ingreso") {
            typeText = "💵 Ingreso";
            typeClass = "income-text";
        } else if (transaction.type === "egreso") {
            typeText = "🔴 Egreso";
            typeClass = "expense-text";
        } else {
            typeText = "💰 Ahorro";
            typeClass = "saving-text";
        }

        row.innerHTML = `
            <td>${formatDate(transaction.date)}</td>
            <td class="${typeClass}">${typeText}</td>
            <td>${transaction.category}</td>
            <td>${transaction.subcategory || "-"}</td>
            <td>${transaction.description}</td>
            <td>${transaction.payment}</td>
            <td class="${typeClass}">${formatCLP(transaction.amount)}</td>
            <td>
                <button class="delete-btn" data-id="${transaction.id}">🗑️</button>
            </td>
        `;

        const deleteBtn = row.querySelector(".delete-btn");
        deleteBtn.addEventListener("click", () => onDeleteCallback(transaction.id));

        table.appendChild(row);
    });
}

export function populateCategoryFilter(transactions) {
    if (!filterCategory) return;
    const currentSelected = filterCategory.value;
    const categories = [...new Set(transactions.map(t => t.category))];

    filterCategory.innerHTML = `<option value="todos">Todas las categorías</option>`;

    categories.forEach(categoryName => {
        if (!categoryName) return;
        const option = document.createElement("option");
        option.value = categoryName;
        option.textContent = categoryName;
        filterCategory.appendChild(option);
    });

    filterCategory.value = currentSelected;
}