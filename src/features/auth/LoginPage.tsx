import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Lock, Mail, Moon, Sun } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email) {
      setError('Por favor ingresa tu correo electrónico corporativo');
      return;
    }
    try {
      setLoading(true);
      await signIn(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err?.message || 'Credenciales incorrectas. Verifica tu correo y contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-slate-50 dark:bg-darkBg relative overflow-hidden transition-colors">
      {/* Background Tech Mesh subtle glow */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Theme Toggle Top Right */}
      <div className="absolute top-5 right-5 z-20">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-2xl bg-white dark:bg-darkBg-card border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 shadow-sm hover:scale-105 transition-all"
          title="Alternar tema"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-white dark:bg-darkBg-card rounded-2xl shadow-elevated border border-slate-200/60 dark:border-slate-800 mb-2">
            <img
              src="/logo.svg"
              alt="AX Network"
              className="w-12 h-12 rounded-xl object-cover"
            />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            AX <span className="text-brand-500">NETWORK</span>
          </h1>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-widest">
            Control Operativo de Servicio Técnico · Panamá
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-elevated border-slate-200/80 dark:border-slate-800">
          <CardContent className="p-6 sm:p-8 space-y-5">
            <div className="text-left">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Iniciar Sesión en el Portal
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Acceso restringido para personal autorizado
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-300">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                label="Correo Electrónico"
                type="email"
                placeholder="ejemplo@axnetwork.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />

              <Input
                label="Contraseña"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />

              <Button type="submit" className="w-full" isLoading={loading}>
                Ingresar al Sistema
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer info */}
        <p className="text-[11px] text-center text-slate-400">
          AX Network Solutions Group · República de Panamá · Soporte IT
        </p>
      </div>
    </div>
  );
}
