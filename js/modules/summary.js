export function getCurrency() {
    return localStorage.getItem("app_currency") || "CLP";
}

export function formatCurrency(value) {
    const number = Number(value) || 0;
    const currency = getCurrency();
    
    if (currency === "AUD") {
        // Dólar australiano con 2 decimales
        return "$" + number.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else {
        // Peso chileno sin decimales
        return "$" + Math.round(number).toLocaleString("es-CL");
    }
}

export function formatDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("es-CL");
}

export function updateSummaryCards(transactions) {
  let income = 0;
  let expense = 0;
  let savings = 0;
  let availableBalance = 0;

  transactions.forEach(t => {
      const amt = Number(t.amount) || 0;
      if (t.type === "ingreso") {
          income += amt;
          availableBalance += amt;
      } else if (t.type === "egreso") {
          expense += amt;
          availableBalance -= amt;
      } else if (t.type === "ahorro") {
          savings += amt;
          availableBalance -= amt;
      } else if (t.type === "retiro_ahorro") {
          savings -= amt;
          availableBalance += amt;
      } else if (t.type === "deposito_ahorro") {
          savings += amt;
          availableBalance -= amt;
      }
  });

  const totalIncomeEl = document.getElementById("totalIncome");
  const totalExpenseEl = document.getElementById("totalExpense");
  const totalSavingsEl = document.getElementById("totalSavings");
  const balanceEl = document.getElementById("balance");

  if (totalIncomeEl) totalIncomeEl.textContent = formatCurrency(income);
  if (totalExpenseEl) totalExpenseEl.textContent = formatCurrency(expense);
  if (totalSavingsEl) totalSavingsEl.textContent = formatCurrency(savings);
  
  if (balanceEl) {
      balanceEl.textContent = formatCurrency(availableBalance);
      if (availableBalance < 0) {
          balanceEl.style.color = "#ef4444";
      } else {
          balanceEl.style.color = "";
      }
  }
}

export function renderCategorySummary(transactions) {
  const container = document.getElementById("categorySummary");
  if (!container) return;
  container.innerHTML = "";

  const categoryTotals = {};

  transactions
      .filter(t => t.type === "egreso")
      .forEach(t => {
          if (!categoryTotals[t.category]) {
              categoryTotals[t.category] = 0;
          }
          categoryTotals[t.category] += Number(t.amount);
      });

  const values = Object.values(categoryTotals);
  const max = values.length ? Math.max(...values) : 1;

  Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .forEach(([categoryName, total]) => {
          const percentage = (total / max) * 100;
          const element = document.createElement("div");
          element.className = "category-item";

          element.innerHTML = `
              <div class="category-info">
                  <span>${categoryName}</span>
                  <strong>${formatCurrency(total)}</strong>
              </div>
              <div class="progress">
                  <div class="progress-bar" style="width:${percentage}%"></div>
              </div>
          `;

          container.appendChild(element);
      });
}