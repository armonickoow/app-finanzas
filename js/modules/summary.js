export function formatCLP(value) {
  const number = Math.round(Number(value));
  return "$" + number.toLocaleString("es-CL");
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

  transactions.forEach(t => {
      if (t.type === "ingreso") income += Number(t.amount);
      else if (t.type === "egreso") expense += Number(t.amount);
      else if (t.type === "ahorro") savings += Number(t.amount);
  });

  const balance = income - expense - savings;

  document.getElementById("totalIncome").textContent = formatCLP(income);
  document.getElementById("totalExpense").textContent = formatCLP(expense);
  document.getElementById("totalSavings").textContent = formatCLP(savings);
  document.getElementById("balance").textContent = formatCLP(balance);
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
                  <strong>${formatCLP(total)}</strong>
              </div>
              <div class="progress">
                  <div class="progress-bar" style="width:${percentage}%"></div>
              </div>
          `;

          container.appendChild(element);
      });
}