CREATE OR REPLACE FUNCTION prevent_activity_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'ActivityLog is append-only. UPDATE and DELETE are not allowed.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_activity_log_update
BEFORE UPDATE ON "ActivityLog"
FOR EACH ROW
EXECUTE FUNCTION prevent_activity_log_modification();

CREATE TRIGGER trg_prevent_activity_log_delete
BEFORE DELETE ON "ActivityLog"
FOR EACH ROW
EXECUTE FUNCTION prevent_activity_log_modification();