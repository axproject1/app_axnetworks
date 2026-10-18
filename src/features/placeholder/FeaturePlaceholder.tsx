import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Link } from 'react-router-dom';
import { Clock, ArrowLeft } from 'lucide-react';

interface FeaturePlaceholderProps {
  title: string;
  phase: string;
  description: string;
}

export function FeaturePlaceholder({ title, phase, description }: FeaturePlaceholderProps) {
  return (
    <div className="max-w-xl mx-auto py-12 text-center space-y-4">
      <Card className="p-8">
        <CardContent className="space-y-4 flex flex-col items-center">
          <div className="w-14 h-14 rounded-3xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <Clock className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest">
              {phase}
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{title}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {description}
            </p>
          </div>

          <div className="pt-4 flex items-center gap-3">
            <Link to="/clientes">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Ir a Clientes
              </Button>
            </Link>
            <Link to="/equipos">
              <Button size="sm">Ver Equipos</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
