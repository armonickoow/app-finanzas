export function exportToExcel(transactions) {
  if (transactions.length === 0) {
      alert("No existen movimientos para exportar.");
      return;
  }

  const movementData = transactions.map(t => ({
      ID: t.id,
      Fecha: t.date,
      Tipo: t.type,
      Categoría: t.category,
      Subcategoría: t.subcategory,
      Descripción: t.description,
      "Medio de pago": t.payment,
      Monto: t.amount
  }));

  const movementsSheet = XLSX.utils.json_to_sheet(movementData);

  let income = 0;
  let expense = 0;
  let savings = 0;

  transactions.forEach(t => {
      if (t.type === "ingreso") income += Number(t.amount);
      if (t.type === "egreso") expense += Number(t.amount);
      if (t.type === "ahorro") savings += Number(t.amount);
  });

  const summaryData = [
      { Concepto: "Ingresos", Monto: income },
      { Concepto: "Egresos", Monto: expense },
      { Concepto: "Ahorros", Monto: savings },
      { Concepto: "Balance", Monto: income - expense - savings }
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);

  const categoryTotals = {};
  transactions
      .filter(t => t.type === "egreso")
      .forEach(t => {
          if (!categoryTotals[t.category]) categoryTotals[t.category] = 0;
          categoryTotals[t.category] += Number(t.amount);
      });

  const categoryData = Object.entries(categoryTotals).map(([cat, total]) => ({
      Categoría: cat,
      Total: total
  }));

  const categorySheet = XLSX.utils.json_to_sheet(categoryData);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, movementsSheet, "Movimientos");
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Resumen");
  XLSX.utils.book_append_sheet(workbook, categorySheet, "Gastos por categoría");

  const today = new Date().toISOString().split("T")[0];
  XLSX.writeFile(workbook, `finanzas-personales-${today}.xlsx`);
}