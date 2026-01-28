-- Insert reminders for all future appointments that don't already have a reminder
INSERT INTO public.reminders (
  title,
  reminder_date,
  reminder_type,
  patient_id,
  organization_id,
  created_by,
  notes,
  notify_all_admins,
  status
)
SELECT 
  'Appointment: ' || p.first_name || ' ' || p.last_name,
  a.appointment_date,
  'appointment',
  a.patient_id,
  a.organization_id,
  COALESCE(a.created_by, (SELECT id FROM profiles LIMIT 1)),
  COALESCE(a.notes, 'Scheduled appointment'),
  true,
  'pending'
FROM appointments a
JOIN patients p ON p.id = a.patient_id
WHERE a.appointment_date > NOW()
  AND a.status IN ('scheduled', 'confirmed')
  AND NOT EXISTS (
    SELECT 1 FROM reminders r 
    WHERE r.patient_id = a.patient_id 
      AND r.reminder_type = 'appointment'
      AND DATE(r.reminder_date) = DATE(a.appointment_date)
  );