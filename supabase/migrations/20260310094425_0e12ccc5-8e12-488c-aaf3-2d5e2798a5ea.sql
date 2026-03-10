
-- Update address and created_by from audit_logs for migrated meeting records
WITH deleted_patients AS (
  SELECT DISTINCT ON (old_data->>'phone')
    old_data->>'phone' as phone,
    old_data->>'address' as address,
    old_data->>'created_by' as created_by
  FROM audit_logs
  WHERE table_name = 'patients' 
    AND action = 'DELETE' 
    AND old_data->>'last_name' IN ('A', 'AA', 'A/B', 'B', 'B/C', 'C')
    AND old_data->>'phone' IS NOT NULL
  ORDER BY old_data->>'phone', created_at DESC
)
UPDATE public.marketer_meetings m
SET 
  address = COALESCE(m.address, dp.address),
  created_by = COALESCE(m.created_by, dp.created_by::uuid)
FROM deleted_patients dp
WHERE m.phone = dp.phone
  AND (m.address IS NULL OR m.created_by IS NULL);
