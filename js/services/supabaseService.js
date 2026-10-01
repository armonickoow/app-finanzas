import { supabaseClient, CACHED_PROFILES } from "../config.js";
import { getCurrentUser } from "../modules/auth.js";

export let HOGAR_ID = null;
export let MI_PERFIL = null;

export async function fetchHogarId() {
    const user = await getCurrentUser();
    if (!user) return null;

    // 1. Intentar obtener el perfil del usuario
    let { data: perfil, error } = await supabaseClient
        .from("perfiles")
        .select("*")
        .eq("id", user.id)
        .single();

    // 2. Si no existe, lo creamos
    if (error || !perfil) {
        const defaultName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuario";
        
        let targetHogarId = null;
        if (user.email === 'nicomo19@gmail.com' || user.email?.startsWith('caritogonzalez97')) {
            const { data: h } = await supabaseClient.from("hogares").select("id").limit(1);
            if (h && h.length > 0) targetHogarId = h[0].id;
        }

        const { data: newPerfil, error: insertError } = await supabaseClient
            .from("perfiles")
            .insert([{ id: user.id, email: user.email, nombre: defaultName, hogar_id: targetHogarId }])
            .select()
            .single();
            
        if (!insertError && newPerfil) {
            perfil = newPerfil;
        }
    } else if (!perfil.hogar_id && (user.email === 'nicomo19@gmail.com' || user.email?.startsWith('caritogonzalez97'))) {
        const { data: h } = await supabaseClient.from("hogares").select("id").limit(1);
        if (h && h.length > 0) {
            await supabaseClient.from("perfiles").update({ hogar_id: h[0].id }).eq("id", user.id);
            perfil.hogar_id = h[0].id;
        }
    }

    if (perfil) {
        MI_PERFIL = perfil;
        HOGAR_ID = perfil.hogar_id;
        CACHED_PROFILES[perfil.id] = perfil;
        
        // 3. Si tiene un hogar, cargamos a los miembros del hogar para los nombres
        if (HOGAR_ID) {
            const { data: miembros } = await supabaseClient
                .from("perfiles")
                .select("*")
                .eq("hogar_id", HOGAR_ID);
                
            if (miembros) {
                miembros.forEach(m => {
                    CACHED_PROFILES[m.id] = m;
                    // También guardamos por email por compatibilidad
                    if (m.email) CACHED_PROFILES[m.email] = m;
                });
            }
        }
        
        return HOGAR_ID;
    }
    return null;
}

export async function fetchMovimientos() {
    const user = await getCurrentUser();
    if (!user) return [];

    if (!HOGAR_ID) {
        await fetchHogarId();
    }

    let query = supabaseClient
        .from("movimientos")
        .select("*");

    if (HOGAR_ID) {
        query = query.eq("hogar_id", HOGAR_ID);
    }

    query = query
        .or(`es_privado.eq.false,and(es_privado.eq.true,user_id.eq.${user.id})`)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
        console.error("Error cargando movimientos:", error);
        return [];
    }
    return data || [];
}

export async function insertMovimiento(transactionData) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Usuario no autenticado");

    if (!HOGAR_ID) {
        await fetchHogarId();
    }
    if (!HOGAR_ID) {
        throw new Error("No se pudo obtener el identificador del hogar para registrar el movimiento.");
    }

    const payload = {
        ...transactionData,
        hogar_id: HOGAR_ID,
        user_id: user.id
    };

    const { data, error } = await supabaseClient
        .from("movimientos")
        .insert([payload])
        .select();

    if (error) {
        console.error("Error insertando movimiento:", error);
        throw error;
    }
    return data ? data[0] : null;
}

export async function deleteMovimiento(id) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Usuario no autenticado");

    const { data, error } = await supabaseClient
        .from("movimientos")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id)
        .select();

    if (error) {
        console.error("Error eliminando movimiento:", error);
        throw error;
    }
    if (!data || data.length === 0) {
        throw new Error("No se pudo eliminar el movimiento. Verifica que seas el creador del registro.");
    }
    return true;
}