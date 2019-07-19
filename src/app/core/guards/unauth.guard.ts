import { Injectable } from '@angular/core';
import { CanActivateChild, ActivatedRouteSnapshot, RouterStateSnapshot, CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';

import { AuthService } from '@services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class UnauthGuard implements CanActivateChild, CanActivate {

  constructor(
    private _authService: AuthService,
    private _router: Router,
  ) { }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    return this.canActivate(route, state);
  }

  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {

    await this._authService.waitForInitialization();

    if (!this._authService.isAuthenticated()) {
      return true;
    }

    this._router.navigate(['v1/events']);
    return false;
  }
}
