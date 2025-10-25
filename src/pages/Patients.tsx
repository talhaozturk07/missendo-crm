import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, User, Phone, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string;
  date_of_birth: string | null;
  gender: string | null;
  country: string | null;
  medical_condition: string | null;
  created_at: string;
}

export default function Patients() {
  const { profile, isSuperAdmin } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    country: '',
    address: '',
    medical_condition: '',
    allergies: '',
    notes: '',
  });

  useEffect(() => {
    loadPatients();
  }, [profile]);

  const loadPatients = async () => {
    if (!profile) return;

    try {
      let query = supabase.from('patients').select('*').order('created_at', { ascending: false });

      if (!isSuperAdmin && profile.organization_id) {
        query = query.eq('organization_id', profile.organization_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error loading patients:', error);
      toast({
        title: "Error",
        description: "Failed to load patients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile?.organization_id) {
      toast({
        title: "Error",
        description: "You must be assigned to an organization",
        variant: "destructive",
      });
      return;
    }

    try {
      const patientData = {
        ...formData,
        organization_id: profile.organization_id,
        created_by: profile.id,
        email: formData.email || null,
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender || null,
        country: formData.country || null,
        address: formData.address || null,
        medical_condition: formData.medical_condition || null,
        allergies: formData.allergies || null,
        notes: formData.notes || null,
      };

      if (selectedPatient) {
        const { error } = await supabase
          .from('patients')
          .update(patientData)
          .eq('id', selectedPatient.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Patient updated successfully",
        });
      } else {
        const { error } = await supabase.from('patients').insert([patientData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Patient created successfully",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      loadPatients();
    } catch (error) {
      console.error('Error saving patient:', error);
      toast({
        title: "Error",
        description: "Failed to save patient",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      date_of_birth: '',
      gender: '',
      country: '',
      address: '',
      medical_condition: '',
      allergies: '',
      notes: '',
    });
    setSelectedPatient(null);
  };

  const handleEdit = async (patient: Patient) => {
    setSelectedPatient(patient);
    
    // Fetch full patient details
    const { data } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patient.id)
      .single();

    if (data) {
      setFormData({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email || '',
        phone: data.phone,
        date_of_birth: data.date_of_birth || '',
        gender: data.gender || '',
        country: data.country || '',
        address: data.address || '',
        medical_condition: data.medical_condition || '',
        allergies: data.allergies || '',
        notes: data.notes || '',
      });
    }
    
    setIsDialogOpen(true);
  };

  const filteredPatients = patients.filter(patient =>
    `${patient.first_name} ${patient.last_name} ${patient.email} ${patient.phone}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Patients</h1>
            <p className="text-muted-foreground mt-2">Manage patient records and treatment history</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Add Patient
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{selectedPatient ? 'Edit Patient' : 'Add New Patient'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Input
                      id="gender"
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      placeholder="Male/Female/Other"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medical_condition">Medical Condition</Label>
                  <Textarea
                    id="medical_condition"
                    value={formData.medical_condition}
                    onChange={(e) => setFormData({ ...formData, medical_condition: e.target.value })}
                    rows={2}
                    placeholder="Describe the patient's condition..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allergies">Allergies</Label>
                  <Input
                    id="allergies"
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    placeholder="e.g., Penicillin, Latex"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {selectedPatient ? 'Update' : 'Create'} Patient
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search patients by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="bg-card rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Birth Date</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading patients...
                  </TableCell>
                </TableRow>
              ) : filteredPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No patients found
                  </TableCell>
                </TableRow>
              ) : (
                filteredPatients.map((patient) => (
                  <TableRow key={patient.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleEdit(patient)}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{patient.first_name} {patient.last_name}</div>
                          {patient.gender && (
                            <div className="text-xs text-muted-foreground">{patient.gender}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {patient.email && (
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="w-3 h-3 text-muted-foreground" />
                            <span className="text-muted-foreground">{patient.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{patient.phone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {patient.date_of_birth ? format(new Date(patient.date_of_birth), 'MMM dd, yyyy') : '-'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {patient.country || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(patient.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
}
