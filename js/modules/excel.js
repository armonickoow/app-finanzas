import { getUserDisplayName, areInSameCouple, getPartnerName } from "../config.js";
import { getCurrentUser } from "./auth.js";
import { getCurrency } from "./summary.js";

// Paleta de colores ejecutiva (Estilo Pro)
const C = {
  NAVY_BANNER: "1E293B",     // Fondo oscuro cabecera principal
  SLATE_SECTION: "334155",   // Fondo secciones
  INDIGO_HEADER: "4F46E5",   // Encabezado Categorías
  CYAN_HEADER: "0284C7",     // Encabezado Medios de Pago
  PURPLE_HEADER: "7C3AED",   // Encabezado Aportes Pareja
  GREEN_BG: "D1FAE5",        // Fondo pastel Ingresos
  GREEN_TXT: "065F46",       // Texto verde
  GREEN_BORDER: "10B981",    // Borde verde
  RED_BG: "FEE2E2",          // Fondo pastel Egresos
  RED_TXT: "991B1B",          // Texto rojo
  RED_BORDER: "EF4444",      // Borde rojo
  AMBER_BG: "FEF3C7",        // Fondo pastel Ahorros
  AMBER_TXT: "92400E",        // Texto ámbar
  AMBER_BORDER: "F59E0B",    // Borde ámbar
  BLUE_BG: "DBEAFE",         // Fondo pastel Balance
  BLUE_TXT: "1E40AF",         // Texto azul
  BLUE_BORDER: "3B82F6",     // Borde azul
  WHITE: "FFFFFF",
  ZEBRA: "F8FAFC",
  BORDER_MID: "CBD5E1"
};

const BORDER_BOX = {
  top: { style: 'thin', color: { argb: C.BORDER_MID } },
  left: { style: 'thin', color: { argb: C.BORDER_MID } },
  bottom: { style: 'thin', color: { argb: C.BORDER_MID } },
  right: { style: 'thin', color: { argb: C.BORDER_MID } }
};

const BORDER_TOTAL = {
  top: { style: 'thin', color: { argb: C.NAVY_BANNER } },
  left: { style: 'thin', color: { argb: C.BORDER_MID } },
  bottom: { style: 'double', color: { argb: C.NAVY_BANNER } },
  right: { style: 'thin', color: { argb: C.BORDER_MID } }
};

export async function exportToExcel(transactions = [], currentUser = null) {
  if (!transactions || transactions.length === 0) {
    alert("No existen movimientos para exportar.");
    return;
  }

  const NUM_FMT = getCurrency() === "AUD" ? "$#,##0.00" : "$#,##0";

  // 1. Obtener usuario activo
  let user = currentUser;
  if (!user) {
    user = await getCurrentUser();
  }

  const userId = user ? user.id : null;
  const userName = getUserDisplayName(user);
  const partnerName = getPartnerName(user);

  // 2. Filtrar movimientos
  // Mis Gastos: todos los movimientos propios (privados y públicos)
  const misGastos = transactions.filter(t => t.user_id === userId);

  // Gastos de Pareja: movimientos compartidos con su pareja
  // Excluye gastos privados ajenos y excluye gastos de la otra pareja
  const gastosPareja = transactions.filter(t => {
    const esMio = t.user_id === userId;
    const esDeMiPareja = areInSameCouple(userId, t.user_id);
    return esDeMiPareja && (!t.es_privado || esMio);
  });

  // 3. Crear Libro ExcelJS
  const WorkbookClass = (typeof window !== "undefined" && window.ExcelJS)
    ? window.ExcelJS.Workbook
    : (await import("exceljs")).default.Workbook;

  const workbook = new WorkbookClass();
  workbook.creator = "App Finanzas";
  workbook.created = new Date();

  const today = new Date().toISOString().split("T")[0];

  // =============================================================
  // HOJA 1: 📊 Dashboard y Resumen Ejecutivo
  // =============================================================
  const sDash = workbook.addWorksheet("📊 Dashboard y Resumen", { views: [{ showGridLines: true }] });
  sDash.columns = [
    { width: 26 }, // A: Categoría / Concepto
    { width: 18 }, // B: Ingresos
    { width: 18 }, // C: Egresos
    { width: 18 }, // D: Ahorro
    { width: 20 }, // E: Balance Neto
    { width: 18 }  // F: % Participación
  ];

  // Banner Principal
  sDash.mergeCells("A1:F2");
  const bCell = sDash.getCell("A1");
  bCell.value = `FINANZAS PERSONALES Y DE PAREJA\nReporte Personal de: ${userName.toUpperCase()}  |  Fecha: ${today}`;
  bCell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  bCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.NAVY_BANNER } };
  bCell.font = { name: "Calibri", size: 13, bold: true, color: { argb: C.WHITE } };

  // Cálculo de KPIs
  let totInc = 0, totExp = 0, totSav = 0;
  misGastos.forEach(t => {
    const a = Number(t.amount) || 0;
    if (t.type === "ingreso") totInc += a;
    else if (t.type === "egreso") totExp += a;
    else if (t.type === "ahorro") totSav += a;
  });
  const balance = totInc - totExp - totSav;

  // 4 Tarjetas KPI visuales
  const kpis = [
    { title: "MIS INGRESOS TOTALES", val: totInc, bg: C.GREEN_BG, txt: C.GREEN_TXT, cT: "A4:A4", cV: "A5:A6" },
    { title: "MIS EGRESOS TOTALES", val: totExp, bg: C.RED_BG, txt: C.RED_TXT, cT: "B4:C4", cV: "B5:C6" },
    { title: "MIS AHORROS TOTALES", val: totSav, bg: C.AMBER_BG, txt: C.AMBER_TXT, cT: "D4:D4", cV: "D5:D6" },
    { title: "BALANCE PERSONAL", val: balance, bg: C.BLUE_BG, txt: C.BLUE_TXT, cT: "E4:F4", cV: "E5:F6" }
  ];

  for (const k of kpis) {
    if (k.cT.includes(":")) sDash.mergeCells(k.cT);
    if (k.cV.includes(":")) sDash.mergeCells(k.cV);

    const t = sDash.getCell(k.cT.split(":")[0]);
    t.value = k.title;
    t.alignment = { horizontal: "center", vertical: "middle" };
    t.font = { name: "Calibri", size: 9, bold: true, color: { argb: k.txt } };
    t.fill = { type: "pattern", pattern: "solid", fgColor: { argb: k.bg } };

    const v = sDash.getCell(k.cV.split(":")[0]);
    v.value = k.val;
    v.numFmt = NUM_FMT;
    v.alignment = { horizontal: "center", vertical: "middle" };
    v.font = { name: "Calibri", size: 15, bold: true, color: { argb: k.txt } };
    v.fill = { type: "pattern", pattern: "solid", fgColor: { argb: k.bg } };
  }

  // -------------------------------------------------------------
  // TABLA DINÁMICA 1: Resumen por Categorías
  // -------------------------------------------------------------
  sDash.mergeCells("A8:F8");
  const catBanner = sDash.getCell("A8");
  catBanner.value = "📈 RESUMEN POR CATEGORÍAS (TABLA DINÁMICA)";
  catBanner.alignment = { vertical: "middle", indent: 1 };
  catBanner.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.SLATE_SECTION } };
  catBanner.font = { name: "Calibri", size: 11, bold: true, color: { argb: C.WHITE } };

  const catHeaders = ["Categoría", "Ingresos ($)", "Egresos ($)", "Ahorros ($)", "Balance Neto ($)", "% de Gastos"];
  const hRow = sDash.getRow(9);
  catHeaders.forEach((h, idx) => {
    const c = hRow.getCell(idx + 1);
    c.value = h;
    c.alignment = { horizontal: idx === 0 ? "left" : "right", vertical: "middle" };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.INDIGO_HEADER } };
    c.font = { name: "Calibri", size: 10, bold: true, color: { argb: C.WHITE } };
    c.border = BORDER_BOX;
  });

  const catMap = {};
  misGastos.forEach(t => {
    const cat = t.category || "Otros";
    if (!catMap[cat]) catMap[cat] = { inc: 0, exp: 0, sav: 0 };
    const a = Number(t.amount) || 0;
    if (t.type === "ingreso") catMap[cat].inc += a;
    else if (t.type === "egreso") catMap[cat].exp += a;
    else if (t.type === "ahorro") catMap[cat].sav += a;
  });

  let rIdx = 10;
  const startCatRow = rIdx;
  const catEntries = Object.entries(catMap).sort((a, b) => (b[1].exp + b[1].inc) - (a[1].exp + a[1].inc));

  for (const [catName, vals] of catEntries) {
    const r = sDash.getRow(rIdx);
    const fill = { type: "pattern", pattern: "solid", fgColor: { argb: rIdx % 2 === 0 ? C.ZEBRA : C.WHITE } };

    r.getCell(1).value = catName;
    r.getCell(1).fill = fill;
    r.getCell(1).border = BORDER_BOX;

    r.getCell(2).value = vals.inc;
    r.getCell(2).numFmt = NUM_FMT;
    r.getCell(2).fill = fill;
    r.getCell(2).border = BORDER_BOX;

    r.getCell(3).value = vals.exp;
    r.getCell(3).numFmt = NUM_FMT;
    r.getCell(3).fill = fill;
    r.getCell(3).border = BORDER_BOX;

    r.getCell(4).value = vals.sav;
    r.getCell(4).numFmt = NUM_FMT;
    r.getCell(4).fill = fill;
    r.getCell(4).border = BORDER_BOX;

    r.getCell(5).value = { formula: `B${rIdx}-C${rIdx}-D${rIdx}` };
    r.getCell(5).numFmt = NUM_FMT;
    r.getCell(5).fill = fill;
    r.getCell(5).border = BORDER_BOX;

    r.getCell(6).value = totExp > 0 ? vals.exp / totExp : 0;
    r.getCell(6).numFmt = "0.0%";
    r.getCell(6).fill = fill;
    r.getCell(6).border = BORDER_BOX;

    rIdx++;
  }

  const endCatRow = Math.max(rIdx - 1, startCatRow);
  const totCatRow = sDash.getRow(rIdx);
  totCatRow.getCell(1).value = "TOTAL CATEGORÍAS";
  totCatRow.getCell(1).font = { bold: true };
  totCatRow.getCell(1).border = BORDER_TOTAL;

  totCatRow.getCell(2).value = { formula: `SUM(B${startCatRow}:B${endCatRow})` };
  totCatRow.getCell(2).numFmt = NUM_FMT;
  totCatRow.getCell(2).font = { bold: true, color: { argb: C.GREEN_TXT } };
  totCatRow.getCell(2).border = BORDER_TOTAL;

  totCatRow.getCell(3).value = { formula: `SUM(C${startCatRow}:C${endCatRow})` };
  totCatRow.getCell(3).numFmt = NUM_FMT;
  totCatRow.getCell(3).font = { bold: true, color: { argb: C.RED_TXT } };
  totCatRow.getCell(3).border = BORDER_TOTAL;

  totCatRow.getCell(4).value = { formula: `SUM(D${startCatRow}:D${endCatRow})` };
  totCatRow.getCell(4).numFmt = NUM_FMT;
  totCatRow.getCell(4).font = { bold: true, color: { argb: C.AMBER_TXT } };
  totCatRow.getCell(4).border = BORDER_TOTAL;

  totCatRow.getCell(5).value = { formula: `SUM(E${startCatRow}:E${endCatRow})` };
  totCatRow.getCell(5).numFmt = NUM_FMT;
  totCatRow.getCell(5).font = { bold: true, color: { argb: C.BLUE_TXT } };
  totCatRow.getCell(5).border = BORDER_TOTAL;

  totCatRow.getCell(6).value = 1;
  totCatRow.getCell(6).numFmt = "0.0%";
  totCatRow.getCell(6).font = { bold: true };
  totCatRow.getCell(6).border = BORDER_TOTAL;

  // -------------------------------------------------------------
  // TABLA DINÁMICA 2: Resumen por Medio de Pago
  // -------------------------------------------------------------
  rIdx += 2;
  sDash.mergeCells(`A${rIdx}:D${rIdx}`);
  const payBanner = sDash.getCell(`A${rIdx}`);
  payBanner.value = "💳 RESUMEN POR MEDIO DE PAGO";
  payBanner.alignment = { vertical: "middle", indent: 1 };
  payBanner.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.SLATE_SECTION } };
  payBanner.font = { name: "Calibri", size: 11, bold: true, color: { argb: C.WHITE } };

  rIdx++;
  const payHeaders = ["Medio de Pago", "N° Movimientos", "Monto Total ($)", "% Participación"];
  const payHRow = sDash.getRow(rIdx);
  payHeaders.forEach((h, idx) => {
    const c = payHRow.getCell(idx + 1);
    c.value = h;
    c.alignment = { horizontal: idx === 0 ? "left" : "right", vertical: "middle" };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.CYAN_HEADER } };
    c.font = { name: "Calibri", size: 10, bold: true, color: { argb: C.WHITE } };
    c.border = BORDER_BOX;
  });

  const payMap = {};
  misGastos.forEach(t => {
    const p = t.payment || "Otros";
    if (!payMap[p]) payMap[p] = { count: 0, total: 0 };
    payMap[p].count++;
    payMap[p].total += Number(t.amount) || 0;
  });

  rIdx++;
  const startPayRow = rIdx;
  const payTotalAmt = Object.values(payMap).reduce((acc, v) => acc + v.total, 0);

  for (const [pName, pVal] of Object.entries(payMap)) {
    const r = sDash.getRow(rIdx);
    const fill = { type: "pattern", pattern: "solid", fgColor: { argb: rIdx % 2 === 0 ? C.ZEBRA : C.WHITE } };

    r.getCell(1).value = pName;
    r.getCell(1).fill = fill;
    r.getCell(1).border = BORDER_BOX;

    r.getCell(2).value = pVal.count;
    r.getCell(2).alignment = { horizontal: "right" };
    r.getCell(2).fill = fill;
    r.getCell(2).border = BORDER_BOX;

    r.getCell(3).value = pVal.total;
    r.getCell(3).numFmt = NUM_FMT;
    r.getCell(3).fill = fill;
    r.getCell(3).border = BORDER_BOX;

    r.getCell(4).value = payTotalAmt > 0 ? pVal.total / payTotalAmt : 0;
    r.getCell(4).numFmt = "0.0%";
    r.getCell(4).fill = fill;
    r.getCell(4).border = BORDER_BOX;

    rIdx++;
  }

  const endPayRow = Math.max(rIdx - 1, startPayRow);
  const totPayRow = sDash.getRow(rIdx);
  totPayRow.getCell(1).value = "TOTAL MEDIOS DE PAGO";
  totPayRow.getCell(1).font = { bold: true };
  totPayRow.getCell(1).border = BORDER_TOTAL;

  totPayRow.getCell(2).value = { formula: `SUM(B${startPayRow}:B${endPayRow})` };
  totPayRow.getCell(2).font = { bold: true };
  totPayRow.getCell(2).border = BORDER_TOTAL;

  totPayRow.getCell(3).value = { formula: `SUM(C${startPayRow}:C${endPayRow})` };
  totPayRow.getCell(3).numFmt = NUM_FMT;
  totPayRow.getCell(3).font = { bold: true };
  totPayRow.getCell(3).border = BORDER_TOTAL;

  totPayRow.getCell(4).value = 1;
  totPayRow.getCell(4).numFmt = "0.0%";
  totPayRow.getCell(4).font = { bold: true };
  totPayRow.getCell(4).border = BORDER_TOTAL;

  // -------------------------------------------------------------
  // TABLA DINÁMICA 3: Aportes en la Pareja
  // -------------------------------------------------------------
  rIdx += 2;
  sDash.mergeCells(`A${rIdx}:D${rIdx}`);
  const coupleBanner = sDash.getCell(`A${rIdx}`);
  coupleBanner.value = `👥 APORTES EN LA PAREJA (${userName} y ${partnerName})`;
  coupleBanner.alignment = { vertical: "middle", indent: 1 };
  coupleBanner.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.SLATE_SECTION } };
  coupleBanner.font = { name: "Calibri", size: 11, bold: true, color: { argb: C.WHITE } };

  rIdx++;
  const coupleHeaders = ["Integrante", "N° Movimientos", "Aporte Total ($)", "% Aporte Compartido"];
  const cRow = sDash.getRow(rIdx);
  coupleHeaders.forEach((h, idx) => {
    const c = cRow.getCell(idx + 1);
    c.value = h;
    c.alignment = { horizontal: idx === 0 ? "left" : "right", vertical: "middle" };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.PURPLE_HEADER } };
    c.font = { name: "Calibri", size: 10, bold: true, color: { argb: C.WHITE } };
    c.border = BORDER_BOX;
  });

  const coupleUserMap = {};
  coupleUserMap[userName] = { count: 0, total: 0 };
  coupleUserMap[partnerName] = { count: 0, total: 0 };

  gastosPareja.forEach(t => {
    const who = getUserDisplayName(t.user_id);
    if (!coupleUserMap[who]) coupleUserMap[who] = { count: 0, total: 0 };
    coupleUserMap[who].count++;
    coupleUserMap[who].total += Number(t.amount) || 0;
  });

  rIdx++;
  const startCRow = rIdx;
  const totCoupleAporte = Object.values(coupleUserMap).reduce((a, b) => a + b.total, 0);

  for (const [cName, cVal] of Object.entries(coupleUserMap)) {
    const r = sDash.getRow(rIdx);
    const fill = { type: "pattern", pattern: "solid", fgColor: { argb: rIdx % 2 === 0 ? C.ZEBRA : C.WHITE } };

    r.getCell(1).value = cName;
    r.getCell(1).fill = fill;
    r.getCell(1).border = BORDER_BOX;

    r.getCell(2).value = cVal.count;
    r.getCell(2).alignment = { horizontal: "right" };
    r.getCell(2).fill = fill;
    r.getCell(2).border = BORDER_BOX;

    r.getCell(3).value = cVal.total;
    r.getCell(3).numFmt = NUM_FMT;
    r.getCell(3).fill = fill;
    r.getCell(3).border = BORDER_BOX;

    r.getCell(4).value = totCoupleAporte > 0 ? cVal.total / totCoupleAporte : 0;
    r.getCell(4).numFmt = "0.0%";
    r.getCell(4).fill = fill;
    r.getCell(4).border = BORDER_BOX;

    rIdx++;
  }

  const endCRow = Math.max(rIdx - 1, startCRow);
  const totCRow = sDash.getRow(rIdx);
  totCRow.getCell(1).value = "TOTAL COMPARTIDO";
  totCRow.getCell(1).font = { bold: true };
  totCRow.getCell(1).border = BORDER_TOTAL;

  totCRow.getCell(2).value = { formula: `SUM(B${startCRow}:B${endCRow})` };
  totCRow.getCell(2).font = { bold: true };
  totCRow.getCell(2).border = BORDER_TOTAL;

  totCRow.getCell(3).value = { formula: `SUM(C${startCRow}:C${endCRow})` };
  totCRow.getCell(3).numFmt = NUM_FMT;
  totCRow.getCell(3).font = { bold: true };
  totCRow.getCell(3).border = BORDER_TOTAL;

  totCRow.getCell(4).value = 1;
  totCRow.getCell(4).numFmt = "0.0%";
  totCRow.getCell(4).font = { bold: true };
  totCRow.getCell(4).border = BORDER_TOTAL;

  // =============================================================
  // HOJA 2: 👤 Mis Gastos Personales
  // =============================================================
  const sMis = workbook.addWorksheet("👤 Mis Gastos Personales", { views: [{ showGridLines: true }] });
  sMis.columns = [
    { header: "ID", key: "id", width: 10 },
    { header: "Fecha", key: "date", width: 14 },
    { header: "Tipo", key: "type", width: 14 },
    { header: "Categoría", key: "category", width: 20 },
    { header: "Subcategoría", key: "subcategory", width: 20 },
    { header: "Descripción", key: "description", width: 32 },
    { header: "Medio de Pago", key: "payment", width: 18 },
    { header: "Monto", key: "amount", width: 18 },
    { header: "Visibilidad", key: "privacy", width: 16 }
  ];

  const misHRow = sMis.getRow(1);
  misHRow.font = { bold: true, color: { argb: C.WHITE } };
  misHRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.NAVY_BANNER } };

  misGastos.forEach(t => {
    const isPriv = t.es_privado === true;
    const row = sMis.addRow({
      id: t.id ?? "",
      date: t.date ?? "",
      type: t.type === "ingreso" ? "💵 Ingreso" : (t.type === "egreso" ? "🔴 Egreso" : "💰 Ahorro"),
      category: t.category ?? "",
      subcategory: t.subcategory ?? "",
      description: t.description ?? "",
      payment: t.payment ?? "",
      amount: Number(t.amount) || 0,
      privacy: isPriv ? "🔒 Privado" : "🌐 Compartido"
    });

    row.getCell("amount").numFmt = NUM_FMT;
    row.getCell("id").alignment = { horizontal: "center" };
    row.getCell("date").alignment = { horizontal: "center" };
    row.getCell("type").alignment = { horizontal: "center" };
    row.getCell("payment").alignment = { horizontal: "center" };
    row.getCell("privacy").alignment = { horizontal: "center" };

    const typeLower = (t.type || "").toLowerCase();
    if (typeLower === "ingreso") {
      row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "E2EFDA" } };
      row.font = { color: { argb: "14532D" } };
    } else if (typeLower === "egreso") {
      row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FEE2E2" } };
      row.font = { color: { argb: "7F1D1D" } };
    } else {
      row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FEF3C7" } };
      row.font = { color: { argb: "78350F" } };
    }
  });

  if (misGastos.length > 0) {
    const misTotRow = sMis.addRow({
      description: "TOTAL PERSONAL",
      amount: { formula: `SUM(H2:H${misGastos.length + 1})` }
    });
    misTotRow.font = { bold: true };
    misTotRow.getCell("amount").numFmt = NUM_FMT;
    misTotRow.getCell("description").alignment = { horizontal: "right" };
    misTotRow.getCell("amount").border = BORDER_TOTAL;
  }

  // =============================================================
  // HOJA 3: 👥 Gastos de Pareja
  // =============================================================
  const sPareja = workbook.addWorksheet("👥 Gastos Pareja", { views: [{ showGridLines: true }] });
  sPareja.columns = [
    { header: "ID", key: "id", width: 10 },
    { header: "Fecha", key: "date", width: 14 },
    { header: "Pagado Por", key: "user", width: 18 },
    { header: "Tipo", key: "type", width: 14 },
    { header: "Categoría", key: "category", width: 20 },
    { header: "Subcategoría", key: "subcategory", width: 20 },
    { header: "Descripción", key: "description", width: 32 },
    { header: "Medio de Pago", key: "payment", width: 18 },
    { header: "Monto", key: "amount", width: 18 }
  ];

  const parejaHRow = sPareja.getRow(1);
  parejaHRow.font = { bold: true, color: { argb: C.WHITE } };
  parejaHRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.INDIGO_HEADER } };

  gastosPareja.forEach(t => {
    const row = sPareja.addRow({
      id: t.id ?? "",
      date: t.date ?? "",
      user: getUserDisplayName(t.user_id),
      type: t.type === "ingreso" ? "💵 Ingreso" : (t.type === "egreso" ? "🔴 Egreso" : "💰 Ahorro"),
      category: t.category ?? "",
      subcategory: t.subcategory ?? "",
      description: t.description ?? "",
      payment: t.payment ?? "",
      amount: Number(t.amount) || 0
    });

    row.getCell("amount").numFmt = NUM_FMT;
    row.getCell("id").alignment = { horizontal: "center" };
    row.getCell("date").alignment = { horizontal: "center" };
    row.getCell("user").alignment = { horizontal: "center" };
    row.getCell("type").alignment = { horizontal: "center" };
    row.getCell("payment").alignment = { horizontal: "center" };

    const typeLower = (t.type || "").toLowerCase();
    if (typeLower === "ingreso") {
      row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "E2EFDA" } };
      row.font = { color: { argb: "14532D" } };
    } else if (typeLower === "egreso") {
      row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FEE2E2" } };
      row.font = { color: { argb: "7F1D1D" } };
    } else {
      row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FEF3C7" } };
      row.font = { color: { argb: "78350F" } };
    }
  });

  if (gastosPareja.length > 0) {
    const parejaTotRow = sPareja.addRow({
      description: "TOTAL COMPARTIDO",
      amount: { formula: `SUM(I2:I${gastosPareja.length + 1})` }
    });
    parejaTotRow.font = { bold: true };
    parejaTotRow.getCell("amount").numFmt = NUM_FMT;
    parejaTotRow.getCell("description").alignment = { horizontal: "right" };
    parejaTotRow.getCell("amount").border = BORDER_TOTAL;
  }

  // 4. Descarga del Archivo en Navegador
  const buffer = await workbook.xlsx.writeBuffer();
  if (typeof window !== "undefined" && window.URL && document.createElement) {
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const cleanName = userName.replace(/\s+/g, "_");
    a.download = `Finanzas_${cleanName}_${today}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  return buffer;
}