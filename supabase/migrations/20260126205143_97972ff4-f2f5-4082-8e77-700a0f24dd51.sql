-- Create reminders table
CREATE TABLE public.reminders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    reminder_type TEXT NOT NULL DEFAULT 'follow_up', -- 'call_back', 'follow_up', 'appointment', 'custom'
    reminder_date TIMESTAMP WITH TIME ZONE NOT NULL,
    title TEXT NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'completed', 'cancelled'
    email_sent_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT reminder_target_check CHECK (patient_id IS NOT NULL OR lead_id IS NOT NULL)
);

-- Enable RLS
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their organization's reminders"
ON public.reminders FOR SELECT
USING (organization_id = get_user_organization(auth.uid()));

CREATE POLICY "Users can manage their organization's reminders"
ON public.reminders FOR ALL
USING (organization_id = get_user_organization(auth.uid()));

CREATE POLICY "Super admins can view all reminders"
ON public.reminders FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_reminders_updated_at
BEFORE UPDATE ON public.reminders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for efficient queries
CREATE INDEX idx_reminders_reminder_date ON public.reminders(reminder_date);
CREATE INDEX idx_reminders_status ON public.reminders(status);
CREATE INDEX idx_reminders_organization_id ON public.reminders(organization_id);