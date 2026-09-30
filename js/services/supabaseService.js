import { supabaseClient } from "../config.js";
import { getCurrentUser } from "../modules/auth.js";

export let HOGAR_ID = null;

export async function fetchHogarId() {
    if (HOGAR_ID) return HOGAR_ID;

    const { data, error } = await supabaseClient
        .from("hogares")
        .select("id")
        .limit(1);

    if (error) {
        console.error("Error obteniendo el hogar:", error);
        return null;
    }
    if (data && data.length > 0) {
        HOGAR_ID = data[0].id;
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