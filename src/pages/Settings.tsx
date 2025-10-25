import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings as SettingsIcon, Stethoscope, Car, Hotel } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Settings() {
  const settingsCards = [
    {
      title: 'Treatments',
      description: 'Manage dental treatments and services',
      icon: Stethoscope,
      link: '/treatments',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Transfer Services',
      description: 'Manage transportation providers and pricing',
      icon: Car,
      link: '/transfers',
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: 'Hotels',
      description: 'Manage accommodation options for patients',
      icon: Hotel,
      link: '/hotels',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your organization's services and configurations</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {settingsCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.link} to={card.link}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg ${card.bgColor} flex items-center justify-center mb-4`}>
                      <Icon className={`w-6 h-6 ${card.color}`} />
                    </div>
                    <CardTitle>{card.title}</CardTitle>
                    <CardDescription>{card.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      Manage {card.title}
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5" />
              General Settings
            </CardTitle>
            <CardDescription>
              Organization settings and API integrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Additional settings like API integrations (WhatsApp, Ad platforms) will be available here.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
