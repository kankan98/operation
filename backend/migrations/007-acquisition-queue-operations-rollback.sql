DROP INDEX IF EXISTS idx_acquisition_queue_events_product_timestamp;
DROP INDEX IF EXISTS idx_acquisition_queue_events_job_timestamp;
DROP TABLE IF EXISTS acquisition_queue_events;

DROP INDEX IF EXISTS idx_acquisition_provider_limits_status;
DROP TABLE IF EXISTS acquisition_provider_limits;

DROP INDEX IF EXISTS idx_acquisition_queue_workers_backend_status;
DROP INDEX IF EXISTS idx_acquisition_queue_workers_heartbeat;
DROP TABLE IF EXISTS acquisition_queue_workers;
