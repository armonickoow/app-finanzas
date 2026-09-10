export async function exportToExcel(transactions) {
  if (!transactions || transactions.length === 0) {
    alert("No existen movimientos para exportar.");
    return;
  }

  // 1. Instancia global de ExcelJS
  const workbook = new window.ExcelJS.Workbook();
  workbook.creator = 'App Finanzas';
  workbook.created = new Date();

  // Colores Hexadecimales (Pasteles Muted)
  const COLOR_VERDE_FILL = 'E2EFDA';   // Activos / Ingresos
  const COLOR_VERDE_TEXT = '274E13';
  
  const COLOR_AMARILLO_FILL = 'FFF2CC';// Deudas / Ahorros
  const COLOR_AMARILLO_TEXT = '7F6000';

  const COLOR_ROJO_FILL = 'FCE4D6';    // Pagos / Egresos
  const COLOR_ROJO_TEXT = 'C65911';

  const COLOR_HEADER_FILL = '366092';  // Encabezado Azul

  // Función Helper para obtener el nombre del usuario de forma segura
  const getUserName = (t) => {
    if (!t) return 'Sin asignar';
    
    // Si viene como string directo
    if (typeof t.user === 'string' && t.user) return t.user;
    if (typeof t.usuario === 'string' && t.usuario) return t.usuario;
    if (typeof t.user_name === 'string' && t.user_name) return t.user_name;
    
    // Si viene como objeto (ej: t.profiles.full_name o t.usuario.nombre)
    if (t.profiles && typeof t.profiles === 'object') {
      return t.profiles.full_name || t.profiles.nombre || t.profiles.email || 'Sin asignar';
    }
    if (t.usuario && typeof t.usuario === 'object') {
      return t.usuario.nombre || t.usuario.full_name || t.usuario.email || 'Sin asignar';
    }
    if (t.user && typeof t.user === 'object') {
      return t.user.full_name || t.user.nombre || t.user.email || 'Sin asignar';
    }

    return 'Sin asignar';
  };

  const columnsConfig = [
    { header: 'ID', key: 'id', width: 12 },
    { header: 'Fecha', key: 'date', width: 14 },
    { header: 'Usuario', key: 'user', width: 16 },
    { header: 'Tipo', key: 'type', width: 14 },
    { header: 'Categoría', key: 'category', width: 18 },
    { header: 'Subcategoría', key: 'subcategory', width: 18 },
    { header: 'Descripción', key: 'description', width: 25 },
    { header: 'Medio de Pago', key: 'payment', width: 18 },
    { header: 'Monto', key: 'amount', width: 15 }
  ];

  // Función para construir cada hoja con formato y colores
  const populateMovementSheet = (sheet, dataList) => {
    sheet.columns = columnsConfig;

    // Formato de Encabezado
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLOR_HEADER_FILL }
    };

    dataList.forEach(t => {
      const nombreUsuario = getUserName(t);
      const row = sheet.addRow({
        id: t.id ?? '',
        date: t.date ?? '',
        user: nombreUsuario,
        type: t.type ?? '',
        category: t.category ?? '',
        subcategory: t.subcategory ?? '',
        description: t.description ?? '',
        payment: t.payment ?? '',
        amount: Number(t.amount) || 0
      });

      // Formato numérico
      row.getCell('amount').numFmt = '$#,##0.00';
      const typeLower = (t.type || '').toLowerCase();

      // Colores de filas por tipo
      if (typeLower === 'ingreso' || typeLower === 'activo') {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_VERDE_FILL } };
        row.font = { color: { argb: COLOR_VERDE_TEXT }, bold: true };
      } else if (typeLower === 'deuda' || typeLower === 'ahorro') {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_AMARILLO_FILL } };
        row.font = { color: { argb: COLOR_AMARILLO_TEXT }, bold: true };
      } else if (typeLower === 'egreso' || typeLower === 'pago') {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_ROJO_FILL } };
        row.font = { color: { argb: COLOR_ROJO_TEXT }, bold: true };
      }
    });
  };

  // 1. Pestaña Principal: Todos los Movimientos
  const sheetGeneral = workbook.addWorksheet('Todos los Movimientos');
  populateMovementSheet(sheetGeneral, transactions);

  // 2. Filtros y Pestañas por Usuario
  const nicoTransactions = transactions.filter(t => {
    const u = getUserName(t).toLowerCase();
    return u.includes('nico');
  });

  const caritoTransactions = transactions.filter(t => {
    const u = getUserName(t).toLowerCase();
    return u.includes('caro') || u.includes('carito');
  });

  if (nicoTransactions.length > 0) {
    const sheetNico = workbook.addWorksheet('Gastos Nico');
    populateMovementSheet(sheetNico, nicoTransactions);
  }

  if (caritoTransactions.length > 0) {
    const sheetCarito = workbook.addWorksheet('Gastos Carito');
    populateMovementSheet(sheetCarito, caritoTransactions);
  }

  // 3. Pestaña de Resumen General
  const sheetResumen = workbook.addWorksheet('Resumen');
  sheetResumen.columns = [
    { header: 'Concepto', key: 'concepto', width: 28 },
    { header: 'Monto', key: 'monto', width: 18 }
  ];

  sheetResumen.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
  sheetResumen.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLOR_HEADER_FILL }
  };

  let income = 0, expense = 0, savings = 0;
  transactions.forEach(t => {
    const val = Number(t.amount) || 0;
    const type = (t.type || '').toLowerCase();
    if (type === "ingreso" || type === "activo") income += val;
    if (type === "egreso" || type === "pago") expense += val;
    if (type === "ahorro" || type === "deuda") savings += val;
  });

  const summaryData = [
    { concepto: "Ingresos Totales (Activos)", monto: income, fill: COLOR_VERDE_FILL, text: COLOR_VERDE_TEXT },
    { concepto: "Deudas / Ahorros Totales", monto: savings, fill: COLOR_AMARILLO_FILL, text: COLOR_AMARILLO_TEXT },
    { concepto: "Egresos Totales (Pagos)", monto: expense, fill: COLOR_ROJO_FILL, text: COLOR_ROJO_TEXT },
    { concepto: "Balance General", monto: income - expense - savings, fill: 'D9D9D9', text: '000000' }
  ];

  summaryData.forEach(item => {
    const row = sheetResumen.addRow({ concepto: item.concepto, monto: item.monto });
    row.getCell('monto').numFmt = '$#,##0.00';
    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: item.fill } };
    row.font = { bold: true, color: { argb: item.text } };
  });

  // 4. Exportación del Archivo Excel
  const today = new Date().toISOString().split("T")[0];
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `finanzas-hogar-${today}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
}