import React, { createContext, useContext, useEffect, useState } from 'react';
import { Perfil, RolUsuario } from '@/types/database';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { MOCK_PERFILES } from '@/lib/mockData';

interface AuthContextType {
  user: Perfil | null;
  role: RolUsuario | null;
  isLoading: boolean;
  isDueno: boolean;
  isTecnico: boolean;
  isRecepcion: boolean;
  canViewFinances: boolean;
  canManageClients: boolean;
  canCreatePayments: boolean;
  signIn: (email: string, password?: string) => Promise<void>;
  signOut: () => Promise<void>;
  switchMockRole: (rol: RolUsuario) => void;
  isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_KEY = 'ax_active_user_v1';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Perfil | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Inicializar sesión
  useEffect(() => {
    async function initAuth() {
      setIsLoading(true);

      // Si Supabase está configurado con claves reales
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { session }, error: sErr } = await supabase.auth.getSession();
          if (sErr) throw sErr;
          if (session?.user) {
            let { data: perfil, error } = await supabase
              .from('perfiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            if (!perfil) {
              const isOwner = session.user.email?.toLowerCase() === 'axmoran1@gmail.com';
              const { data: newP } = await supabase
                .from('perfiles')
                .upsert({
                  id: session.user.id,
                  nombre: isOwner ? 'Alex Morán (Dueño)' : (session.user.email?.split('@')[0] || 'Personal AX'),
                  rol: isOwner ? 'dueno' : 'tecnico',
                  activo: true,
                })
                .select('*')
                .single();
              perfil = newP;
            }

            if (perfil) {
              setUser({ ...perfil, email: session.user.email });
              setIsLoading(false);
              return;
            }
          }

          // Sin sesión activa en Supabase -> No autenticado
          setUser(null);
          setIsLoading(false);
          return;
        } catch (e) {
          console.warn('Verificación de sesión de Supabase:', e);
          setUser(null);
          setIsLoading(false);
          return;
        }
      }

      // Modo local solo si NO hay Supabase configurado
      try {
        const savedId = localStorage.getItem(CURRENT_USER_KEY);
        const initial = MOCK_PERFILES.find((p) => p.id === savedId) || MOCK_PERFILES[0];
        setUser(initial);
      } catch (err) {
        setUser(MOCK_PERFILES[0]);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();

    // Listener para cambios de Supabase Auth si está habilitado
    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      const { data: listener } = client.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          let { data: perfil } = await client
            .from('perfiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
          if (!perfil) {
            const isOwner = session.user.email?.toLowerCase() === 'axmoran1@gmail.com';
            const { data: newP } = await client
              .from('perfiles')
              .upsert({
                id: session.user.id,
                nombre: isOwner ? 'Alex Morán (Dueño)' : (session.user.email?.split('@')[0] || 'Personal AX'),
                rol: isOwner ? 'dueno' : 'tecnico',
                activo: true,
              })
              .select('*')
              .single();
            perfil = newP;
          }
          if (perfil) {
            setUser({ ...perfil, email: session.user.email });
          }
        } else {
          setUser(null);
        }
      });

      return () => {
        listener.subscription.unsubscribe();
      };
    }
  }, []);

  const signIn = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        if (!password) {
          throw new Error('Por favor ingresa tu contraseña de acceso.');
        }
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          throw new Error(
            error.message === 'Invalid login credentials'
              ? 'Correo o contraseña incorrectos. Verifica tus credenciales.'
              : error.message
          );
        }
        if (data.user) {
          let { data: perfil, error: pErr } = await supabase
            .from('perfiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();

          if (!perfil) {
            const isOwner = data.user.email?.toLowerCase() === 'axmoran1@gmail.com';
            const { data: newP } = await supabase
              .from('perfiles')
              .upsert({
                id: data.user.id,
                nombre: isOwner ? 'Alex Morán (Dueño)' : (data.user.email?.split('@')[0] || 'Personal AX'),
                rol: isOwner ? 'dueno' : 'tecnico',
                activo: true,
              })
              .select('*')
              .single();
            perfil = newP;
          }

          if (pErr && !perfil) throw pErr;
          setUser({ ...perfil, email: data.user.email });
          return;
        }
        return;
      }

      // Modo local solo si NO está conectado a Supabase
      const matched = MOCK_PERFILES.find(
        (p) => p.email?.toLowerCase() === email.toLowerCase() || p.nombre.toLowerCase().includes(email.toLowerCase())
      );
      if (matched) {
        setUser(matched);
        localStorage.setItem(CURRENT_USER_KEY, matched.id);
      } else {
        setUser(MOCK_PERFILES[0]);
        localStorage.setItem(CURRENT_USER_KEY, MOCK_PERFILES[0].id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      }
      localStorage.removeItem(CURRENT_USER_KEY);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const switchMockRole = (rol: RolUsuario) => {
    const matched = MOCK_PERFILES.find((p) => p.rol === rol);
    if (matched) {
      setUser(matched);
      localStorage.setItem(CURRENT_USER_KEY, matched.id);
    }
  };

  const role = user?.rol || null;
  const isDueno = role === 'dueno';
  const isTecnico = role === 'tecnico';
  const isRecepcion = role === 'recepcion';

  // Reglas de roles del requerimiento:
  // Dueño: acceso total
  // Recepción: clientes, equipos, órdenes, citas y pagos
  // Técnico: órdenes, diagnóstico, fotos, tickets y citas; NO ve gastos ni reportes financieros
  const canViewFinances = isDueno;
  const canManageClients = isDueno || isRecepcion;
  const canCreatePayments = isDueno || isRecepcion;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isLoading,
        isDueno,
        isTecnico,
        isRecepcion,
        canViewFinances,
        canManageClients,
        canCreatePayments,
        signIn,
        signOut,
        switchMockRole,
        isDemoMode: false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
