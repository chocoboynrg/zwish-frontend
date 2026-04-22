import { Routes } from '@angular/router';
import { LoginPageComponent } from './features/auth/login-page.component';
import { RegisterPageComponent } from './features/auth/register-page.component';
import { CheckEmailPageComponent } from './features/auth/check-email-page.component';
import { VerifyEmailPageComponent } from './features/auth/verify-email-page.component';

import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { AdminDashboardPageComponent } from './features/dashboard/admin-dashboard-page.component';
import { CatalogAdminPageComponent } from './features/catalog/pages/catalog-admin-page.component';
import { ProductRequestsAdminPageComponent } from './features/product-requests/pages/product-requests-admin-page.component';
import { NotificationsPageComponent } from './features/notifications/pages/notifications-page.component';
import { EventsAdminPageComponent } from './features/events/pages/events-admin-page.component';
import { EventDetailAdminPageComponent } from './features/events/pages/event-detail-admin-page.component';

import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

import { MyDashboardPageComponent } from './features/account/pages/my-dashboard-page.component';
import { MyContributionsPageComponent } from './features/account/pages/my-contributions-page.component';
import { MyPaymentsPageComponent } from './features/account/pages/my-payments-page.component';
import { JoinEventPageComponent } from './features/events/pages/join-event-page.component';
import { UserLayoutComponent } from './layout/user-layout.component';
import { MyEventsPageComponent } from './features/account/pages/my-events-page.component';
import { EventUserDetailPageComponent } from './features/account/pages/event-user-detail-page.component';
import { CreateUserEventPageComponent } from './features/account/pages/create-user-event-page.component';
import { PaymentDetailPageComponent } from './features/account/pages/payment-detail-page.component';

import { PublicLayoutComponent } from './layout/public-layout.component';
import { PublicHomePageComponent } from './features/public/pages/public-home-page.component';
import { HowItWorksPageComponent } from './features/public/pages/how-it-works-page.component';
import { PublicCatalogPageComponent } from './features/public/pages/public-catalog-page.component';
import { ProductRequestsPageComponent } from './features/product-requests/pages/product-requests-page.component';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      {
        path: '',
        component: PublicHomePageComponent,
      },
      {
        path: 'how-it-works',
        component: HowItWorksPageComponent,
      },
      {
        path: 'catalog',
        component: PublicCatalogPageComponent,
      },
      {
        path: 'login',
        component: LoginPageComponent,
      },
      {
        path: 'register',
        component: RegisterPageComponent,
      },
      {
        path: 'check-email',
        component: CheckEmailPageComponent,
      },
      {
        path: 'verify-email',
        component: VerifyEmailPageComponent,
      },
      {
        path: 'join/:shareToken',
        component: JoinEventPageComponent,
      },
    ],
  },
  {
    path: 'app',
    component: UserLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: MyDashboardPageComponent,
      },
      {
        path: 'contributions',
        component: MyContributionsPageComponent,
      },
      {
        path: 'payments',
        component: MyPaymentsPageComponent,
      },
      {
        path: 'payments/:id',
        component: PaymentDetailPageComponent,
      },
      {
        path: 'notifications',
        component: NotificationsPageComponent,
      },
      {
        path: 'product-requests',
        component: ProductRequestsPageComponent,
      },
      {
        path: 'events',
        component: MyEventsPageComponent,
      },
      {
        path: 'events/new',
        component: CreateUserEventPageComponent,
      },
      {
        path: 'events/:id',
        component: EventUserDetailPageComponent,
      },
    ],
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard, adminGuard],
    children: [
      {
        path: '',
        component: AdminDashboardPageComponent,
      },
      {
        path: 'events',
        component: EventsAdminPageComponent,
      },
      {
        path: 'events/:id',
        component: EventDetailAdminPageComponent,
      },
      {
        path: 'catalog',
        component: CatalogAdminPageComponent,
      },
      {
        path: 'product-requests',
        component: ProductRequestsAdminPageComponent,
      },
      {
        path: 'notifications',
        component: NotificationsPageComponent,
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
