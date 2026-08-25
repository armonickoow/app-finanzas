import { supabaseClient } from "../config.js";
import { getCurrentUser } from "../modules/auth.js";

export let HOGAR_ID = null;

export async function fetchHogarId() {
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

    // Consulta: obtiene los movimientos que son públicos O los que son privados del usuario actual
    const { data, error } = await supabaseClient
        .from("movimientos")
        .select("*")
        .or(`es_privado.eq.false,and(es_privado.eq.true,user_id.eq.${user.id})`)
        .order("date", { ascending: false });

    if (error) {
        console.error("Error cargando movimientos:", error);
        return [];
    }
    return data || [];
}

export async function insertMovimiento(transactionData) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Usuario no autenticado");

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
    const { error } = await supabaseClient
        .from("movimientos")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error eliminando movimiento:", error);
        throw error;
    }
    return true;
}