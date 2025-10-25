-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE public.app_role AS ENUM ('super_admin', 'clinic_admin', 'clinic_user');
CREATE TYPE public.lead_status AS ENUM ('new', 'contacted', 'no_contact', 'appointment_scheduled', 'converted', 'rejected');
CREATE TYPE public.appointment_status AS ENUM ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show');
CREATE TYPE public.discount_type AS ENUM ('percentage', 'fixed_amount');

-- Organizations (Clinics) Table
CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    country TEXT DEFAULT 'Turkey',
    is_active BOOLEAN DEFAULT true,
    ad_api_key TEXT,
    whatsapp_api_key TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User Profiles Table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User Roles Table (Separate for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role public.app_role NOT NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, role, organization_id)
);

-- Treatments/Services Table
CREATE TABLE public.treatments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    base_price DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    duration_minutes INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Transfer Services Table
CREATE TABLE public.transfer_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    company_name TEXT NOT NULL,
    service_type TEXT,
    price DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Hotels/Accommodation Table
CREATE TABLE public.hotels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    hotel_name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    price_per_night DECIMAL(10, 2) NOT NULL,
    companion_price DECIMAL(10, 2),
    currency TEXT DEFAULT 'USD',
    amenities TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Leads Table
CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    assigned_by_missendo BOOLEAN DEFAULT false,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    country TEXT,
    source TEXT,
    status public.lead_status DEFAULT 'new',
    contacted_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    rejection_reason TEXT,
    created_by UUID REFERENCES auth.users(id),
    assigned_to UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Patients Table
CREATE TABLE public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    lead_id UUID REFERENCES public.leads(id),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    date_of_birth DATE,
    gender TEXT,
    country TEXT,
    address TEXT,
    photo_url TEXT,
    medical_condition TEXT,
    allergies TEXT,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Appointments Table
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    lead_id UUID REFERENCES public.leads(id),
    appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    status public.appointment_status DEFAULT 'scheduled',
    notes TEXT,
    treatment_id UUID REFERENCES public.treatments(id),
    transfer_id UUID REFERENCES public.transfer_services(id),
    hotel_id UUID REFERENCES public.hotels(id),
    nights_count INTEGER,
    has_companion BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Patient Treatments (Junction table for treatments given to patients)
CREATE TABLE public.patient_treatments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
    treatment_id UUID REFERENCES public.treatments(id) ON DELETE CASCADE NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    discount_type public.discount_type,
    discount_value DECIMAL(10, 2),
    final_price DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    notes TEXT,
    performed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Financial Records Table
CREATE TABLE public.financial_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    appointment_id UUID REFERENCES public.appointments(id),
    treatment_cost DECIMAL(10, 2) DEFAULT 0,
    transfer_cost DECIMAL(10, 2) DEFAULT 0,
    hotel_cost DECIMAL(10, 2) DEFAULT 0,
    companion_cost DECIMAL(10, 2) DEFAULT 0,
    total_discount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    payment_status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;

-- Helper function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
    )
$$;

-- Helper function to get user organization
CREATE OR REPLACE FUNCTION public.get_user_organization(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT organization_id
    FROM public.profiles
    WHERE id = _user_id
    LIMIT 1
$$;

-- RLS Policies for Organizations
CREATE POLICY "Super admins can view all organizations"
    ON public.organizations FOR SELECT
    USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view their own organization"
    ON public.organizations FOR SELECT
    USING (id = public.get_user_organization(auth.uid()));

CREATE POLICY "Super admins can insert organizations"
    ON public.organizations FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update organizations"
    ON public.organizations FOR UPDATE
    USING (public.has_role(auth.uid(), 'super_admin'));

-- RLS Policies for Profiles
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (id = auth.uid());

CREATE POLICY "Super admins can view all profiles"
    ON public.profiles FOR SELECT
    USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Clinic admins can view profiles in their organization"
    ON public.profiles FOR SELECT
    USING (
        organization_id = public.get_user_organization(auth.uid())
        AND public.has_role(auth.uid(), 'clinic_admin')
    );

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (id = auth.uid());

-- RLS Policies for User Roles
CREATE POLICY "Users can view their own roles"
    ON public.user_roles FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Super admins can manage all roles"
    ON public.user_roles FOR ALL
    USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Clinic admins can manage roles in their organization"
    ON public.user_roles FOR ALL
    USING (
        organization_id = public.get_user_organization(auth.uid())
        AND public.has_role(auth.uid(), 'clinic_admin')
    );

-- RLS Policies for Treatments (Clinic-specific data)
CREATE POLICY "Super admins can view all treatments"
    ON public.treatments FOR SELECT
    USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view their organization's treatments"
    ON public.treatments FOR SELECT
    USING (organization_id = public.get_user_organization(auth.uid()));

CREATE POLICY "Clinic admins can manage their organization's treatments"
    ON public.treatments FOR ALL
    USING (
        organization_id = public.get_user_organization(auth.uid())
        AND public.has_role(auth.uid(), 'clinic_admin')
    );

-- RLS Policies for Transfer Services
CREATE POLICY "Super admins can view all transfers"
    ON public.transfer_services FOR SELECT
    USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view their organization's transfers"
    ON public.transfer_services FOR SELECT
    USING (organization_id = public.get_user_organization(auth.uid()));

CREATE POLICY "Clinic admins can manage their organization's transfers"
    ON public.transfer_services FOR ALL
    USING (
        organization_id = public.get_user_organization(auth.uid())
        AND public.has_role(auth.uid(), 'clinic_admin')
    );

-- RLS Policies for Hotels
CREATE POLICY "Super admins can view all hotels"
    ON public.hotels FOR SELECT
    USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view their organization's hotels"
    ON public.hotels FOR SELECT
    USING (organization_id = public.get_user_organization(auth.uid()));

CREATE POLICY "Clinic admins can manage their organization's hotels"
    ON public.hotels FOR ALL
    USING (
        organization_id = public.get_user_organization(auth.uid())
        AND public.has_role(auth.uid(), 'clinic_admin')
    );

-- RLS Policies for Leads
CREATE POLICY "Super admins can view all leads"
    ON public.leads FOR SELECT
    USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view their organization's leads"
    ON public.leads FOR SELECT
    USING (organization_id = public.get_user_organization(auth.uid()));

CREATE POLICY "Super admins can manage all leads"
    ON public.leads FOR ALL
    USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Clinic users can manage their organization's leads"
    ON public.leads FOR ALL
    USING (organization_id = public.get_user_organization(auth.uid()));

-- RLS Policies for Patients
CREATE POLICY "Super admins can view all patients"
    ON public.patients FOR SELECT
    USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view their organization's patients"
    ON public.patients FOR SELECT
    USING (organization_id = public.get_user_organization(auth.uid()));

CREATE POLICY "Users can manage their organization's patients"
    ON public.patients FOR ALL
    USING (organization_id = public.get_user_organization(auth.uid()));

-- RLS Policies for Appointments
CREATE POLICY "Super admins can view all appointments"
    ON public.appointments FOR SELECT
    USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view their organization's appointments"
    ON public.appointments FOR SELECT
    USING (organization_id = public.get_user_organization(auth.uid()));

CREATE POLICY "Users can manage their organization's appointments"
    ON public.appointments FOR ALL
    USING (organization_id = public.get_user_organization(auth.uid()));

-- RLS Policies for Patient Treatments
CREATE POLICY "Super admins can view all patient treatments"
    ON public.patient_treatments FOR SELECT
    USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view their organization's patient treatments"
    ON public.patient_treatments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.patients
            WHERE patients.id = patient_treatments.patient_id
            AND patients.organization_id = public.get_user_organization(auth.uid())
        )
    );

CREATE POLICY "Users can manage their organization's patient treatments"
    ON public.patient_treatments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.patients
            WHERE patients.id = patient_treatments.patient_id
            AND patients.organization_id = public.get_user_organization(auth.uid())
        )
    );

-- RLS Policies for Financial Records
CREATE POLICY "Super admins can view all financial records"
    ON public.financial_records FOR SELECT
    USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view their organization's financial records"
    ON public.financial_records FOR SELECT
    USING (organization_id = public.get_user_organization(auth.uid()));

CREATE POLICY "Clinic admins can manage their organization's financial records"
    ON public.financial_records FOR ALL
    USING (
        organization_id = public.get_user_organization(auth.uid())
        AND public.has_role(auth.uid(), 'clinic_admin')
    );

-- Trigger function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_treatments_updated_at BEFORE UPDATE ON public.treatments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transfer_services_updated_at BEFORE UPDATE ON public.transfer_services
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hotels_updated_at BEFORE UPDATE ON public.hotels
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patient_treatments_updated_at BEFORE UPDATE ON public.patient_treatments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_financial_records_updated_at BEFORE UPDATE ON public.financial_records
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, first_name, last_name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        NEW.email
    );
    RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();