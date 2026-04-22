import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

import { AppNavbarComponent } from '../shared/components/app-navbar/app-navbar.component';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, AppNavbarComponent],
  template: `
    <div class="shell">
      <app-navbar
        [navItems]="navItems"
        [mobileExtraItems]="mobileExtraItems"
      />

      <main class="main">
        <router-outlet></router-outlet>
      </main>

      <footer class="footer">
        <div class="container footer-inner">
          <div>
            <div class="footer-brand">ZWish</div>
            <p class="footer-text">
              Wishlist événementielle moderne pour organiser cadeaux,
              réservations et contributions en toute simplicité.
            </p>
          </div>

          <div class="footer-links">
            <a routerLink="/">Accueil</a>
            <a routerLink="/catalog">Catalogue</a>
            <a routerLink="/how-it-works">Comment ça marche</a>
            <a routerLink="/app">Mon espace</a>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: #fffaf8;
      color: #111827;
    }

    .shell {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .main {
      flex: 1;
    }

    .container {
      width: min(1180px, calc(100% - 32px));
      margin: 0 auto;
    }

    .footer {
      border-top: 1px solid #f1e7e3;
      background: white;
      margin-top: 40px;
    }

    .footer-inner {
      padding: 28px 0;
      display: flex;
      justify-content: space-between;
      gap: 24px;
      flex-wrap: wrap;
    }

    .footer-brand {
      font-size: 1.1rem;
      font-weight: 800;
      margin-bottom: 8px;
    }

    .footer-text {
      margin: 0;
      color: #6b7280;
      max-width: 560px;
      line-height: 1.7;
    }

    .footer-links {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      align-items: center;
    }

    .footer-links a {
      text-decoration: none;
      color: #4b5563;
      font-weight: 600;
    }

    .footer-links a:hover {
      color: #ff7a59;
    }
  `],
})
export class PublicLayoutComponent {
  readonly navItems = [
    { label: 'Accueil', path: '/', exact: true },
    { label: 'Catalogue', path: '/catalog' },
    { label: 'Comment ça marche', path: '/how-it-works' },
  ];

  readonly mobileExtraItems = [
    { label: 'Mon espace', path: '/app' },
  ];
}