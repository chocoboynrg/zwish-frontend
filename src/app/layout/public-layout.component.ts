import { CommonModule } from '@angular/common';
import { Component, HostListener, signal } from '@angular/core';
import { RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { AppNavbarComponent } from '../shared/components/app-navbar/app-navbar.component';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, AppNavbarComponent],
  template: `
    <div class="shell">
      <!-- Navbar custom style realme -->
      <header class="topnav" [class.scrolled]="scrolled()">
        <div class="nav-inner">
          <a routerLink="/" class="nav-brand">
            <span class="brand-z">Z</span>Wish
          </a>

          <nav class="nav-links">
            <a routerLink="/" routerLinkActive="nav-active" [routerLinkActiveOptions]="{exact:true}">Accueil</a>
            <a routerLink="/catalog" routerLinkActive="nav-active">Catalogue</a>
            <a routerLink="/how-it-works" routerLinkActive="nav-active">Comment ça marche</a>
          </nav>

          <div class="nav-actions">
            <a routerLink="/login" class="nav-btn-ghost">Connexion</a>
            <a routerLink="/app/events/new" class="nav-btn-cta">Créer un événement</a>
          </div>

          <!-- Hamburger mobile -->
          <button class="hamburger" (click)="menuOpen.set(!menuOpen())" aria-label="Menu">
            <span [class.open]="menuOpen()"></span>
            <span [class.open]="menuOpen()"></span>
            <span [class.open]="menuOpen()"></span>
          </button>
        </div>

        <!-- Menu mobile -->
        <div class="mobile-menu" [class.open]="menuOpen()">
          <a routerLink="/" (click)="menuOpen.set(false)">Accueil</a>
          <a routerLink="/catalog" (click)="menuOpen.set(false)">Catalogue</a>
          <a routerLink="/how-it-works" (click)="menuOpen.set(false)">Comment ça marche</a>
          <a routerLink="/login" (click)="menuOpen.set(false)">Connexion</a>
          <a routerLink="/app/events/new" class="mobile-cta" (click)="menuOpen.set(false)">Créer un événement</a>
        </div>
      </header>

      <main class="main">
        <router-outlet></router-outlet>
      </main>

      <footer class="footer">
        <div class="footer-top">
          <div class="footer-inner">
            <div class="footer-brand-col">
              <div class="footer-logo"><span class="brand-z">Z</span>Wish</div>
              <p>La plateforme de wishlist événementielle moderne pour organiser vos cadeaux, contributions et réservations.</p>
              <div class="footer-social">
                <a href="#" aria-label="Instagram" class="social-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                <a href="#" aria-label="Twitter" class="social-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
              </div>
            </div>

            <div class="footer-links-col">
              <div class="footer-section">
                <h4>Plateforme</h4>
                <a routerLink="/">Accueil</a>
                <a routerLink="/catalog">Catalogue</a>
                <a routerLink="/how-it-works">Comment ça marche</a>
              </div>
              <div class="footer-section">
                <h4>Mon compte</h4>
                <a routerLink="/login">Connexion</a>
                <a routerLink="/register">Inscription</a>
                <a routerLink="/app">Mon espace</a>
              </div>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <div class="footer-inner">
            <span>© {{ year }} ZWish. Tous droits réservés.</span>
            <span>Fait avec ♥ pour vos moments importants</span>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; background: #fff; color: #111; }
    .shell { min-height: 100vh; display: flex; flex-direction: column; }
    .main { flex: 1; }

    /* NAV */
    .topnav {
      position: fixed; top: 0; left: 0; right: 0; z-index: 100;
      background: rgba(0,0,0,0.92);
      backdrop-filter: blur(16px);
      transition: background 0.3s, box-shadow 0.3s;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .topnav.scrolled { background: rgba(0,0,0,0.98); box-shadow: 0 4px 24px rgba(0,0,0,0.3); }
    .nav-inner {
      max-width: 1280px; margin: 0 auto; padding: 0 24px;
      height: 64px; display: flex; align-items: center; gap: 40px;
    }
    .nav-brand {
      font-size: 1.4rem; font-weight: 900; color: white; text-decoration: none;
      letter-spacing: -0.02em; flex-shrink: 0;
    }
    .brand-z { color: #FFD700; }
    .nav-links {
      display: flex; gap: 32px; flex: 1;
    }
    .nav-links a {
      color: rgba(255,255,255,0.7); text-decoration: none; font-size: 0.88rem;
      font-weight: 500; transition: color 0.2s; letter-spacing: 0.01em;
    }
    .nav-links a:hover, .nav-links a.nav-active { color: white; }
    .nav-actions { display: flex; gap: 12px; align-items: center; }
    .nav-btn-ghost {
      color: rgba(255,255,255,0.8); text-decoration: none; font-size: 0.85rem;
      font-weight: 600; padding: 8px 16px; border: 1px solid rgba(255,255,255,0.2);
      border-radius: 8px; transition: 0.2s;
    }
    .nav-btn-ghost:hover { border-color: white; color: white; }
    .nav-btn-cta {
      background: #FFD700; color: #000; text-decoration: none; font-size: 0.85rem;
      font-weight: 800; padding: 8px 18px; border-radius: 8px; transition: 0.2s;
    }
    .nav-btn-cta:hover { background: #FFC000; }

    .hamburger {
      display: none; flex-direction: column; gap: 5px; background: 0; border: 0; cursor: pointer; padding: 4px;
    }
    .hamburger span {
      display: block; width: 22px; height: 2px; background: white; transition: 0.3s;
    }
    .hamburger span.open:nth-child(1) { transform: translateY(7px) rotate(45deg); }
    .hamburger span.open:nth-child(2) { opacity: 0; }
    .hamburger span.open:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

    .mobile-menu {
      display: none; flex-direction: column; gap: 0; padding: 0;
      background: #000; border-top: 1px solid rgba(255,255,255,0.06);
      max-height: 0; overflow: hidden; transition: max-height 0.3s;
    }
    .mobile-menu.open { max-height: 400px; }
    .mobile-menu a {
      color: rgba(255,255,255,0.8); text-decoration: none; padding: 16px 24px;
      font-size: 0.95rem; font-weight: 500; border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .mobile-menu a:hover { color: white; background: rgba(255,255,255,0.04); }
    .mobile-cta { color: #FFD700 !important; font-weight: 700 !important; }

    @media (max-width: 900px) {
      .nav-links, .nav-actions { display: none; }
      .hamburger { display: flex; margin-left: auto; }
      .mobile-menu { display: flex; }
    }

    /* FOOTER */
    .footer { background: #0a0a0a; color: rgba(255,255,255,0.7); margin-top: 0; }
    .footer-top { padding: 64px 0 48px; border-bottom: 1px solid rgba(255,255,255,0.08); }
    .footer-inner { max-width: 1280px; margin: 0 auto; padding: 0 24px; display: flex; gap: 80px; flex-wrap: wrap; }
    .footer-brand-col { flex: 1; min-width: 260px; max-width: 360px; }
    .footer-logo { font-size: 1.6rem; font-weight: 900; color: white; margin-bottom: 16px; }
    .footer-brand-col p { line-height: 1.7; font-size: 0.88rem; margin: 0 0 24px; }
    .footer-social { display: flex; gap: 12px; }
    .social-icon {
      width: 38px; height: 38px; border: 1px solid rgba(255,255,255,0.15);
      border-radius: 8px; display: flex; align-items: center; justify-content: center;
      color: rgba(255,255,255,0.5); transition: 0.2s;
    }
    .social-icon:hover { border-color: #FFD700; color: #FFD700; }
    .footer-links-col { display: flex; gap: 64px; flex-wrap: wrap; }
    .footer-section { display: flex; flex-direction: column; gap: 14px; }
    .footer-section h4 { color: white; font-size: 0.8rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 6px; }
    .footer-section a { color: rgba(255,255,255,0.55); text-decoration: none; font-size: 0.88rem; transition: color 0.2s; }
    .footer-section a:hover { color: white; }
    .footer-bottom { padding: 20px 0; }
    .footer-bottom .footer-inner { justify-content: space-between; align-items: center; font-size: 0.8rem; flex-wrap: wrap; gap: 8px; }
  `],
})
export class PublicLayoutComponent {
  scrolled = signal(false);
  menuOpen = signal(false);
  readonly year = new Date().getFullYear();

  @HostListener('window:scroll')
  onScroll() {
    this.scrolled.set(window.scrollY > 20);
  }
}