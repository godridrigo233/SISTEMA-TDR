require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKET = "documentos";
const SIGNED_URL_TTL_SECONDS = 60 * 15; // 15 minutos

async function uploadDocumento(buffer, storagePath, contentType) {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType, upsert: true });
  if (error) throw error;
  return storagePath;
}

async function getSignedUrl(storagePath) {
  if (!storagePath) return null;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);
  if (error) return null;
  return data.signedUrl;
}

module.exports = { uploadDocumento, getSignedUrl };
