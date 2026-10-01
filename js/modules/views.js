// views.js
import { getUserDisplayName, areInSameCouple } from "../config.js";
import { MI_PERFIL } from "../services/supabaseService.js";

let vistaActual = 'mis_gastos';

export function getVistaActual() {
  return vistaActual;
}

export function cambiarVista(nuevaVista, usuarioLogueado, todosLosMovimientos, callbackRender) {
  // Asignar vista por defecto si viene vacía
  vistaActual = nuevaVista || 'mis_gastos';

  if (typeof document !== 'undefined') {
    // 1. Desactivar todos los botones de pestañas
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    // 2. Activar el botón correspondiente en el HTML
    const idBoton = `btn-${vistaActual.replace(/_/g, '-')}`;
    const btnActivo = document.getElementById(idBoton);
    if (btnActivo) {
      btnActivo.classList.add('active');
    }
  }

  // 3. Filtrar y renderizar si los datos están disponibles
  if (Array.isArray(todosLosMovimientos) && typeof callbackRender === 'function') {
    const filtrados = filtrarMovimientos(todosLosMovimientos, usuarioLogueado);
    callbackRender(filtrados);
  }
}

export function filtrarMovimientos(movimientos = [], usuarioLogueado = '') {
  const currentUserId = typeof usuarioLogueado === 'object' && usuarioLogueado ? usuarioLogueado.id : usuarioLogueado;
  const currentUserName = getUserDisplayName(usuarioLogueado).toLowerCase();

  return movimientos.filter(m => {
    const creatorId = m.user_id || '';
    const creatorName = getUserDisplayName(m.user_id || m.user_name || m.usuario || m.user).toLowerCase();

    // 1. Es propio si coincide el user_id o el nombre mapeado
    const esMio = (currentUserId && creatorId === currentUserId) || 
                  (currentUserName && currentUserName !== 'sin asignar' && creatorName === currentUserName);
    
    // 2. Pertenece a la misma pareja
    const esDeMiPareja = areInSameCouple(currentUserId || usuarioLogueado, creatorId);
    const esPrivado = m.es_privado === true;

    if (vistaActual === 'mis_gastos') {
      return esMio;
    }
    if (vistaActual === 'pareja') {
      if (!esDeMiPareja) return false;
      if (esPrivado && !esMio) return false;
      
      // Si es un movimiento de ahorro y mi configuración dice no compartir, ocultar los ahorros del otro
      const esAhorro = m.type === 'ahorro' || m.type === 'retiro_ahorro' || m.type === 'deposito_ahorro';
      if (esAhorro && !esMio && MI_PERFIL && MI_PERFIL.compartir_ahorros === false) {
          return false;
      }
      
      return true;
    }
    return true;
  });
}