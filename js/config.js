import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

export const SUPABASE_URL = "https://qtiamgjtuzhrebqdrtlq.supabase.co";
export const SUPABASE_KEY = "sb_publishable_v1HijF40ZV6uGd70tThFMg_IbC8zvQI";

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

export const CACHED_PROFILES = {};

export function getUserDisplayName(userOrId) {
    if (!userOrId) return "Sin asignar";
    
    // Si pasamos un objeto (ej. Auth User de Supabase)
    if (typeof userOrId === "object") {
        const id = userOrId.id;
        if (id && CACHED_PROFILES[id]) return CACHED_PROFILES[id].nombre || CACHED_PROFILES[id].email?.split("@")[0];
        return userOrId.user_metadata?.full_name || userOrId.email?.split("@")[0] || "Usuario";
    }

    // Si pasamos un ID en texto
    if (CACHED_PROFILES[userOrId]) {
        return CACHED_PROFILES[userOrId].nombre || CACHED_PROFILES[userOrId].email?.split("@")[0] || "Usuario";
    }

    // Fallback: si es un email
    if (typeof userOrId === "string" && userOrId.includes("@")) {
        return userOrId.split("@")[0];
    }
    
    return "Usuario";
}

export function areInSameCouple(user1, user2) {
    const id1 = typeof user1 === "object" ? user1.id : user1;
    const id2 = typeof user2 === "object" ? user2.id : user2;
    
    // Si soy yo mismo, siempre estoy en mi "pareja"
    if (id1 === id2) return true;

    const perfil1 = CACHED_PROFILES[id1];
    const perfil2 = CACHED_PROFILES[id2];

    if (perfil1 && perfil2 && perfil1.hogar_id && perfil2.hogar_id) {
        return perfil1.hogar_id === perfil2.hogar_id;
    }
    
    return false;
}

export function getPartnerName(userOrId) {
    const id = typeof userOrId === "object" ? userOrId.id : userOrId;
    const miPerfil = CACHED_PROFILES[id];
    
    if (!miPerfil || !miPerfil.hogar_id) return "Pareja";

    // Buscar a alguien ms en mi mismo hogar
    for (const pId in CACHED_PROFILES) {
        if (pId !== id && CACHED_PROFILES[pId].hogar_id === miPerfil.hogar_id) {
            return CACHED_PROFILES[pId].nombre || "Pareja";
        }
    }
    return "Pareja";
}