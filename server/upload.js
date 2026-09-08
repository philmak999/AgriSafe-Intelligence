import multer from 'multer';

const ALLOWED_TYPES = new Set(['application/pdf', 'image/png', 'image/jpeg', 'image/webp']);

// Buffered in memory, not written to disk — the route handler uploads the
// buffer to GCS only after every validation passes, so a rejected upload
// never leaves an orphaned file anywhere to clean up.
export const uploadOwnershipDoc = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.has(file.mimetype)) {
      return cb(new Error('Document must be a PDF, PNG, JPG, or WEBP file.'));
    }
    cb(null, true);
  },
});
