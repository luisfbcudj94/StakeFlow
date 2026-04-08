import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent) },
  {
    path: '',
    loadComponent: () => import('./shared/layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'wallet', loadComponent: () => import('./wallet/wallet.component').then(m => m.WalletComponent) },
      { path: 'bets/explore', loadComponent: () => import('./bets/explore/explore-bets.component').then(m => m.ExploreBetsComponent) },
      { path: 'bets/create', loadComponent: () => import('./bets/create/create-bet.component').then(m => m.CreateBetComponent) },
      { path: 'bets/my', loadComponent: () => import('./bets/my-bets/my-bets.component').then(m => m.MyBetsComponent) },
      { path: 'bets/:betId', loadComponent: () => import('./bets/detail/bet-detail.component').then(m => m.BetDetailComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
