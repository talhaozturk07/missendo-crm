import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarIcon, Clock, User, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';

interface Appointment {
  id: string;
  appointment_date: string;
  duration_minutes: number;
  status: string;
  notes: string | null;
  patients: {
    first_name: string;
    last_name: string;
  } | null;
  treatments: {
    name: string;
  } | null;
}

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
  completed: 'bg-purple-100 text-purple-800',
  cancelled: 'bg-red-100 text-red-800',
  no_show: 'bg-gray-100 text-gray-800',
};

export default function Appointments() {
  const { profile, isSuperAdmin } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { toast } = useToast();

  useEffect(() => {
    loadAppointments();
  }, [profile, selectedDate]);

  const loadAppointments = async () => {
    if (!profile) return;

    try {
      const startDate = startOfMonth(selectedDate);
      const endDate = endOfMonth(selectedDate);

      let query = supabase
        .from('appointments')
        .select(`
          *,
          patients (first_name, last_name),
          treatments (name)
        `)
        .gte('appointment_date', startDate.toISOString())
        .lte('appointment_date', endDate.toISOString())
        .order('appointment_date');

      if (!isSuperAdmin && profile.organization_id) {
        query = query.eq('organization_id', profile.organization_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
      toast({
        title: "Error",
        description: "Failed to load appointments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    return eachDayOfInterval({ start, end });
  };

  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter(apt => 
      isSameDay(new Date(apt.appointment_date), day)
    );
  };

  const upcomingAppointments = appointments
    .filter(apt => new Date(apt.appointment_date) >= new Date() && apt.status === 'scheduled')
    .slice(0, 5);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Appointments</h1>
          <p className="text-muted-foreground mt-2">Schedule and manage patient appointments</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar View */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  {format(selectedDate, 'MMMM yyyy')}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDate(new Date())}
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}
                  >
                    Next
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12">Loading calendar...</div>
                ) : (
                  <div className="grid grid-cols-7 gap-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                        {day}
                      </div>
                    ))}
                    {getDaysInMonth().map((day, idx) => {
                      const dayAppointments = getAppointmentsForDay(day);
                      const hasAppointments = dayAppointments.length > 0;
                      
                      return (
                        <div
                          key={idx}
                          className={`
                            min-h-[80px] p-2 border rounded-lg cursor-pointer transition-colors
                            ${isToday(day) ? 'border-primary bg-primary/5' : 'border-border'}
                            ${hasAppointments ? 'bg-accent/5' : ''}
                            hover:bg-muted
                          `}
                          onClick={() => setSelectedDate(day)}
                        >
                          <div className={`text-sm font-medium mb-1 ${isToday(day) ? 'text-primary' : ''}`}>
                            {format(day, 'd')}
                          </div>
                          {dayAppointments.slice(0, 2).map((apt, i) => (
                            <div
                              key={i}
                              className="text-xs bg-primary/10 text-primary px-1 py-0.5 rounded mb-1 truncate"
                            >
                              {format(new Date(apt.appointment_date), 'HH:mm')}
                            </div>
                          ))}
                          {dayAppointments.length > 2 && (
                            <div className="text-xs text-muted-foreground">
                              +{dayAppointments.length - 2} more
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Appointments */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Upcoming
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingAppointments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No upcoming appointments
                  </p>
                ) : (
                  <div className="space-y-4">
                    {upcomingAppointments.map((apt) => (
                      <div key={apt.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-primary" />
                            <span className="font-medium text-sm">
                              {apt.patients?.first_name} {apt.patients?.last_name}
                            </span>
                          </div>
                          <Badge className={statusColors[apt.status]}>
                            {apt.status}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="w-3 h-3" />
                            <span>{format(new Date(apt.appointment_date), 'MMM dd, yyyy HH:mm')}</span>
                          </div>
                          {apt.treatments && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span>{apt.treatments.name}</span>
                            </div>
                          )}
                        </div>

                        {apt.notes && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {apt.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">
                {appointments.filter(a => a.status === 'scheduled').length}
              </div>
              <div className="text-sm text-muted-foreground">Scheduled</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {appointments.filter(a => a.status === 'confirmed').length}
              </div>
              <div className="text-sm text-muted-foreground">Confirmed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-purple-600">
                {appointments.filter(a => a.status === 'completed').length}
              </div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">
                {appointments.filter(a => a.status === 'cancelled').length}
              </div>
              <div className="text-sm text-muted-foreground">Cancelled</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
