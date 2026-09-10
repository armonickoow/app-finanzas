// views.js

let vistaActual = 'mis_gastos';

export function cambiarVista(nuevaVista, usuarioLogueado, todosLosMovimientos, callbackRender) {
  // Asignar vista por defecto si viene vacía
  vistaActual = nuevaVista || 'mis_gastos';

  // 1. Desactivar todos los botones de pestañas
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

  // 2. Activar el botón correspondiente en el HTML
  const idBoton = `btn-${vistaActual.replace(/_/g, '-')}`;
  const btnActivo = document.getElementById(idBoton);
  if (btnActivo) {
    btnActivo.classList.add('active');
  }

  // 3. Filtrar y renderizar si los datos están disponibles
  if (Array.isArray(todosLosMovimientos) && typeof callbackRender === 'function') {
    const usuarioValido = usuarioLogueado || '';
    const filtrados = filtrarMovimientos(todosLosMovimientos, usuarioValido);
    callbackRender(filtrados);
  }
}

export function filtrarMovimientos(movimientos = [], usuarioLogueado = '') {
  const miUsuario = (usuarioLogueado || '').toString().toLowerCase().trim();

  return movimientos.filter(m => {
    const creador = (m.user_name || m.usuario || m.user || '').toString().toLowerCase().trim();
    const esPrivado = m.es_privado === true;

    if (vistaActual === 'mis_gastos') {
      return creador === miUsuario;
    }
    if (vistaActual === 'pareja') {
      return creador !== miUsuario && !esPrivado;
    }
    if (vistaActual === 'generales') {
      return !esPrivado;
    }
    return true;
  });
}