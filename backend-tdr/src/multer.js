const multer = require("multer");

// Los archivos se suben en memoria y de ahí se envían a Supabase Storage
// (el filesystem del contenedor en Railway es efímero — no sirve como storage persistente).
module.exports = multer({ storage: multer.memoryStorage() });
