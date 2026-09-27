-- Store uploaded file bytes directly in Postgres instead of Google Cloud
-- Storage. GCS required a downloadable service-account key, and the
-- account's GCP org policy blocks creating one. Uploads are already capped
-- at 10MB, well within bytea territory for this app's traffic.
ALTER TABLE documents DROP COLUMN gcs_key;
ALTER TABLE documents ADD COLUMN file_data BYTEA;

ALTER TABLE farmers DROP COLUMN document_path;
ALTER TABLE farmers ADD COLUMN document_data BYTEA;
ALTER TABLE farmers ADD COLUMN document_mimetype TEXT;
