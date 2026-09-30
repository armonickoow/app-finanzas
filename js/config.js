import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

export const SUPABASE_URL = "https://qtiamgjtuzhrebqdrtlq.supabase.co";
export const SUPABASE_KEY = "sb_publishable_v1HijF40ZV6uGd70tThFMg_IbC8zvQI";

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

export const PAREJAS = {
    pareja_1: {
        id: "pareja_1",
        nombre: "Pareja 1 (Nico y Carito)",
        members: [
            "4846826b-4e34-40e8-8bb3-15aa5a8bfa2a",
            "eb4deb19-c320-404f-a8ad-1592acf1ddc1",
            "nicomo19@gmail.com",
            "caritogonzalez97@gmail.com",
            "caritogonzalez97@hotmail.com"
        ]
    },
    pareja_2: {
        id: "pareja_2",
        nombre: "Pareja 2",
        members: [
            // Aquí se agregan los correos o UUIDs de los 2 integrantes de la Pareja 2
        ]
    }
};

export const USER_PROFILES = {
    "4846826b-4e34-40e8-8bb3-15aa5a8bfa2a": { name: "Nico", email: "nicomo19@gmail.com", pareja: "pareja_1", rol: "admin" },
    "eb4deb19-c320-404f-a8ad-1592acf1ddc1": { name: "Carito", email: "caritogonzalez97@gmail.com", pareja: "pareja_1", rol: "usuario" },
    "nicomo19@gmail.com": { name: "Nico", email: "nicomo19@gmail.com", pareja: "pareja_1", rol: "admin" },
    "caritogonzalez97@gmail.com": { name: "Carito", email: "caritogonzalez97@gmail.com", pareja: "pareja_1", rol: "usuario" },
    "caritogonzalez97@hotmail.com": { name: "Carito", email: "caritogonzalez97@gmail.com", pareja: "pareja_1", rol: "usuario" }
};

export function getUserDisplayName(userOrId) {
    if (!userOrId) return "Sin asignar";
    if (typeof userOrId === "object") {
        const id = userOrId.id;
        const email = userOrId.email;
        if (id && USER_PROFILES[id]) return USER_PROFILES[id].name;
        if (email && USER_PROFILES[email]) return USER_PROFILES[email].name;
        return userOrId.user_metadata?.full_name || email?.split("@")[0] || "Usuario";
    }
    if (USER_PROFILES[userOrId]) return USER_PROFILES[userOrId].name;
    if (typeof userOrId === "string" && userOrId.includes("@")) {
        return userOrId.split("@")[0];
    }
    return userOrId;
}

export function getParejaId(userOrId) {
    if (!userOrId) return null;
    const key = typeof userOrId === "object" ? (userOrId.id || userOrId.email) : userOrId;
    if (USER_PROFILES[key]?.pareja) return USER_PROFILES[key].pareja;
    for (const [parejaId, data] of Object.entries(PAREJAS)) {
        if (data.members.includes(key)) return parejaId;
    }
    return null;
}

export function areInSameCouple(user1, user2) {
    const p1 = getParejaId(user1);
    const p2 = getParejaId(user2);
    return Boolean(p1 && p2 && p1 === p2);
}

export function getPartnerName(userOrId) {
    const pId = getParejaId(userOrId);
    if (!pId) return "Pareja";
    if (pId === "pareja_1") {
        const myName = getUserDisplayName(userOrId);
        return myName === "Nico" ? "Carito" : "Nico";
    }
    return "Pareja";
}