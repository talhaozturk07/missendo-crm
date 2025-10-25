import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings as SettingsIcon, Key, MessageSquare, TrendingUp, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';

export default function Settings() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [orgData, setOrgData] = useState({
    ad_api_key: '',
    whatsapp_api_key: '',
  });

  useEffect(() => {
    loadOrganizationSettings();
  }, [profile]);

  const loadOrganizationSettings = async () => {
    if (!profile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('ad_api_key, whatsapp_api_key')
        .eq('id', profile.organization_id)
        .single();

      if (error) throw error;
      
      if (data) {
        setOrgData({
          ad_api_key: data.ad_api_key || '',
          whatsapp_api_key: data.whatsapp_api_key || '',
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSave = async () => {
    if (!profile?.organization_id) {
      toast({
        title: "Error",
        description: "You must be assigned to an organization",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          ad_api_key: orgData.ad_api_key || null,
          whatsapp_api_key: orgData.whatsapp_api_key || null,
        })
        .eq('id', profile.organization_id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Settings saved successfully",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure API integrations and organization settings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ad Platform Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Ad Platform API
              </CardTitle>
              <CardDescription>
                Connect your advertising platforms to automatically import leads
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ad_api_key">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    API Key
                  </div>
                </Label>
                <Input
                  id="ad_api_key"
                  type="password"
                  placeholder="Enter your ad platform API key"
                  value={orgData.ad_api_key}
                  onChange={(e) => setOrgData({ ...orgData, ad_api_key: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Used to automatically fetch leads from Facebook Ads, Google Ads, etc.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* WhatsApp Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-success" />
                WhatsApp Business API
              </CardTitle>
              <CardDescription>
                Enable WhatsApp messaging for patient communication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="whatsapp_api_key">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    API Key
                  </div>
                </Label>
                <Input
                  id="whatsapp_api_key"
                  type="password"
                  placeholder="Enter your WhatsApp API key"
                  value={orgData.whatsapp_api_key}
                  onChange={(e) => setOrgData({ ...orgData, whatsapp_api_key: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Send appointment reminders and communicate with patients via WhatsApp
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* General Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5" />
              General Information
            </CardTitle>
            <CardDescription>
              Your organization and user information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">User Name</p>
                <p className="font-medium">{profile?.first_name} {profile?.last_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{profile?.email}</p>
              </div>
              {profile?.phone && (
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">{profile.phone}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={loading} size="lg">
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
