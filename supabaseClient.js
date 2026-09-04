// supabaseClient.js

// 1. Reemplazá con tu URL real
const SUPABASE_URL = "https://wpafkizkmnqpnrkocizy.supabase.co"; 

// 2. Reemplazá con tu anon/public key real
const SUPABASE_KEY = "sb_publishable_JrHcJJe8PbZXW-5WZE0aMQ_A8E9Bzud"; 


// Crear el cliente y asignarlo a la variable global 'supabase'
// (removimos 'export' y cambiamos la sintaxis)
window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
//export const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);