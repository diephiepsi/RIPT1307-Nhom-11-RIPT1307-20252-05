import type { PropsWithChildren } from 'react';
import { Navigate } from 'react-router-dom';
import type { Role } from '../../types/auth';
import { useAppSelector } from '../../store/hooks';

export function RequireAuth({ children, roles }: PropsWithChildren<{ roles?: Role[] }>) {
  const { token, user } = useAppSelector((s) => s.auth);
  if (!token) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

