import { useTheme, AppTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Palette, Check } from 'lucide-react';

const THEMES: { id: AppTheme; name: string; description: string; colors: string[] }[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Clean medical blue theme',
    colors: ['hsl(210, 100%, 45%)', 'hsl(180, 70%, 50%)', 'hsl(210, 20%, 98%)'],
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    description: 'Vibrant multi-color theme',
    colors: ['hsl(0, 80%, 55%)', 'hsl(45, 90%, 55%)', 'hsl(120, 60%, 45%)', 'hsl(200, 80%, 50%)', 'hsl(280, 70%, 55%)'],
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Dark mode for low-light environments',
    colors: ['hsl(220, 20%, 15%)', 'hsl(220, 25%, 20%)', 'hsl(210, 100%, 55%)'],
  },
  {
    id: 'missendo',
    name: 'Miss Endo',
    description: 'Purple-focused brand theme',
    colors: ['hsl(270, 70%, 50%)', 'hsl(280, 65%, 60%)', 'hsl(260, 60%, 95%)'],
  },
];

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" />
          Theme Selection
        </CardTitle>
        <CardDescription>
          Choose a visual theme for the application
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`relative flex flex-col items-start p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                theme === t.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {theme === t.id && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
              
              {/* Color preview */}
              <div className="flex gap-1 mb-3">
                {t.colors.map((color, idx) => (
                  <div
                    key={idx}
                    className="w-6 h-6 rounded-full border border-border"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              
              <h3 className="font-semibold text-foreground">{t.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t.description}</p>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
