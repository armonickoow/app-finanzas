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

let expenseChartInstance = null;

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

  const entries = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  const values = entries.map(e => e[1]);
  const labels = entries.map(e => e[0]);
  const max = values.length ? Math.max(...values) : 1;

  entries.forEach(([categoryName, total]) => {
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

  // Renderizar Gráfico
  renderChart(labels, values);
}

function renderChart(labels, data) {
    const ctx = document.getElementById('expenseChart');
    if (!ctx) return;
    
    if (expenseChartInstance) {
        expenseChartInstance.destroy();
    }

    // Paleta de colores atractiva
    const backgroundColors = [
        'rgba(16, 185, 129, 0.8)', // Emerald
        'rgba(59, 130, 246, 0.8)', // Blue
        'rgba(245, 158, 11, 0.8)', // Amber
        'rgba(139, 92, 246, 0.8)', // Violet
        'rgba(236, 72, 153, 0.8)', // Pink
        'rgba(14, 165, 233, 0.8)', // Sky
        'rgba(244, 63, 94, 0.8)',  // Rose
        'rgba(168, 85, 247, 0.8)'  // Purple
    ];

    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#e2e8f0' : '#334155';

    expenseChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors.slice(0, data.length),
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: textColor, font: { size: 12 } }
                }
            }
        }
    });
}