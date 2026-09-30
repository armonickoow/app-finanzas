import { supabaseClient } from "../config.js";

export async function loginUser(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });
    if (error) throw error;
    return data;
}

export async function logoutUser() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
}

export async function getCurrentUser() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session ? session.user : null;
}

export function onAuthStateChange(callback) {
    return supabaseClient.auth.onAuthStateChange(callback);
}


