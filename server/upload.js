import multer from 'multer';

const ALLOWED_TYPES = new Set(['application/pdf', 'image/png', 'image/jpeg', 'image/webp']);
const fileFilter = (req, file, cb) => {
  if (!ALLOWED_TYPES.has(file.mimetype)) {
    return cb(new Error('Document must be a PDF, PNG, JPG, or WEBP file.'));
  }
  cb(null, true);
};

// Buffered in memory, not written to disk — the route handler saves the
// buffer to the database only after every validation passes, so a rejected
// upload never leaves an orphaned file anywhere to clean up.
export const uploadOwnershipDoc = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter,
});

// Same limits, used by the ongoing /api/documents upload surface (vaccination
// certs, lab results, etc.) rather than just the one-time registration doc.
export const uploadDocument = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter,
});

// Inspectors can attach several evidence photos to one inspection submission.
export const uploadEvidence = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 8 },
  fileFilter,
});
