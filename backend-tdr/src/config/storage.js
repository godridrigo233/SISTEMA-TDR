require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  try {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  } catch (err) {
    console.warn('[storage] No se pudo inicializar Supabase:', err.message);
  }
} else {
  console.warn('[storage] ADVERTENCIA: SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configurados');
}

const BUCKET = "documentos";
const SIGNED_URL_TTL_SECONDS = 60 * 15; // 15 minutos

async function uploadDocumento(buffer, storagePath, contentType) {
  if (!supabase) throw new Error("Supabase Storage no está configurado (faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType, upsert: true });
  if (error) throw error;
  return storagePath;
}

async function getSignedUrl(storagePath) {
  if (!storagePath || !supabase) return null;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);
  if (error) return null;
  return data.signedUrl;
}

module.exports = { uploadDocumento, getSignedUrl };
