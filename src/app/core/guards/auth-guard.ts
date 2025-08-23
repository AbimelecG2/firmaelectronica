import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { UsersService } from '../services/users.service';

export const AuthGuard: CanActivateFn = async (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);
  const users = inject(UsersService);

  const user = auth.currentUser;
  if (!user) {
    router.navigate(['/login']);
    return false;
  }
  const profile = await users.getProfile(user.uid);
  if (!profile || profile.active === false) {
    router.navigate(['/login']);
    return false;
  }

  // Si la ruta define roles permitidos, validar
  const roles = route.data?.['roles'] as string[] | undefined;
  if (roles && !roles.includes(profile.role)) {
    router.navigate(['/inicio']); // o una 403
    return false;
  }
  return true;
};
