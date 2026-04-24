import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-public-home-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <!-- HERO -->
    <section class="hero">
      <div class="hero-bg"></div>
      <div class="container">
        <div class="hero-content">
          <div class="hero-kicker">✦ La plateforme wishlist N°1</div>
          <h1 class="hero-title">
            Offrez ce<br/>
            qui compte<br/>
            <span class="hero-accent">vraiment.</span>
          </h1>
          <p class="hero-desc">
            Créez votre liste de vœux pour vos événements. Partagez-la.
            Recevez exactement ce que vous souhaitez.
          </p>
          <div class="hero-actions">
            <a routerLink="/app/events/new" class="btn-hero-primary">
              Créer mon événement
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M4 10h12M10 4l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </a>
            <a routerLink="/catalog" class="btn-hero-ghost">Voir le catalogue</a>
          </div>
          <div class="hero-stats">
            <div class="hero-stat"><strong>500+</strong><span>Événements créés</span></div>
            <div class="hero-stat-sep"></div>
            <div class="hero-stat"><strong>2 400+</strong><span>Contributions</span></div>
            <div class="hero-stat-sep"></div>
            <div class="hero-stat"><strong>98%</strong><span>Satisfaction</span></div>
          </div>
        </div>

        <!-- Visual côté droit -->
        <div class="hero-visual">
          <div class="hero-card-main">
            <div class="event-preview">
              <div class="ep-header">
                <div class="ep-avatar">M</div>
                <div>
                  <div class="ep-name">Mariage de Marie</div>
                  <div class="ep-date">15 juin 2026 · 24 invités</div>
                </div>
                <span class="ep-badge">Live</span>
              </div>
              <div class="ep-items">
                <div class="ep-item">
                  <div class="ep-item-info">
                    <div class="ep-item-name">Robot Pâtissier</div>
                    <div class="ep-item-price">450 000 XOF</div>
                  </div>
                  <div class="ep-progress-wrap">
                    <div class="ep-progress-bar" style="width:78%"></div>
                  </div>
                  <div class="ep-item-pct">78%</div>
                </div>
                <div class="ep-item">
                  <div class="ep-item-info">
                    <div class="ep-item-name">Séjour Balnéaire</div>
                    <div class="ep-item-price">800 000 XOF</div>
                  </div>
                  <div class="ep-progress-wrap">
                    <div class="ep-progress-bar" style="width:45%"></div>
                  </div>
                  <div class="ep-item-pct">45%</div>
                </div>
                <div class="ep-item">
                  <div class="ep-item-info">
                    <div class="ep-item-name">Bijoux Artisanaux</div>
                    <div class="ep-item-price">120 000 XOF</div>
                  </div>
                  <div class="ep-progress-wrap">
                    <div class="ep-progress-bar ep-progress-done" style="width:100%"></div>
                  </div>
                  <div class="ep-item-pct done">✓</div>
                </div>
              </div>
              <a class="ep-btn">Contribuer →</a>
            </div>
          </div>
          <div class="hero-float-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#FFD700"/></svg>
            <span>Réservé !</span>
          </div>
          <div class="hero-float-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#22c55e"/><path d="M8 12l3 3 5-5" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>
            <span>Paiement confirmé</span>
          </div>
        </div>
      </div>
    </section>

    <!-- TRUSTED BY / CHIFFRES -->
    <section class="trust-bar">
      <div class="container">
        <span class="trust-label">Ils nous font confiance</span>
        <div class="trust-items">
          <div class="trust-item">🎂 Anniversaires</div>
          <div class="trust-sep">·</div>
          <div class="trust-item">💍 Mariages</div>
          <div class="trust-sep">·</div>
          <div class="trust-item">👶 Baby Showers</div>
          <div class="trust-sep">·</div>
          <div class="trust-item">🎓 Diplômes</div>
          <div class="trust-sep">·</div>
          <div class="trust-item">🎉 Fêtes</div>
        </div>
      </div>
    </section>

    <!-- FEATURES DARK -->
    <section class="features-dark">
      <div class="container">
        <div class="section-eyebrow">Pourquoi ZWish</div>
        <h2 class="section-title-light">Tout ce dont vous avez besoin,<br/>dans une seule plateforme.</h2>

        <div class="features-grid">
          <div class="feature-card-dark">
            <div class="feature-icon-wrap">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#FFD700" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            <h3>Catalogue riche</h3>
            <p>Des milliers de produits classés par catégorie. Trouvez l'idée parfaite ou proposez la vôtre.</p>
          </div>
          <div class="feature-card-dark featured">
            <div class="feature-badge">★ Populaire</div>
            <div class="feature-icon-wrap">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="#FFD700" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            <h3>Contributions groupées</h3>
            <p>Vos invités contribuent ensemble à l'achat d'un cadeau qui compte vraiment. Transparent et simple.</p>
          </div>
          <div class="feature-card-dark">
            <div class="feature-icon-wrap">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#FFD700" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            <h3>Paiements sécurisés</h3>
            <p>Mobile Money, carte bancaire. Chaque centime est tracé et confirmé en temps réel.</p>
          </div>
          <div class="feature-card-dark">
            <div class="feature-icon-wrap">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="#FFD700" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            <h3>Suivi en temps réel</h3>
            <p>Dashboard complet pour l'organisateur. Visualisez les contributions et l'avancement à chaque instant.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- HOW IT WORKS MINI -->
    <section class="how-mini">
      <div class="container">
        <div class="how-mini-header">
          <div class="section-eyebrow dark">Simple comme bonjour</div>
          <h2 class="section-title-dark">Lancez-vous en 3 étapes</h2>
        </div>
        <div class="steps-row">
          <div class="step-item">
            <div class="step-num">01</div>
            <h3>Créez votre événement</h3>
            <p>Donnez un nom à votre occasion, ajoutez la date et une description. C'est tout.</p>
          </div>
          <div class="step-arrow">→</div>
          <div class="step-item">
            <div class="step-num">02</div>
            <h3>Construisez votre wishlist</h3>
            <p>Ajoutez des produits de notre catalogue ou faites une demande personnalisée.</p>
          </div>
          <div class="step-arrow">→</div>
          <div class="step-item">
            <div class="step-num">03</div>
            <h3>Partagez et recevez</h3>
            <p>Un lien unique. Vos invités contribuent en quelques clics, vous recevez ce qui vous fait vraiment plaisir.</p>
          </div>
        </div>
        <div class="how-mini-cta">
          <a routerLink="/how-it-works" class="btn-outline-dark">En savoir plus</a>
        </div>
      </div>
    </section>

    <!-- CTA FINAL -->
    <section class="cta-final">
      <div class="cta-bg"></div>
      <div class="container">
        <div class="cta-content">
          <h2>Votre prochain événement<br/>mérite le meilleur.</h2>
          <p>Rejoignez des centaines d'organisateurs qui font confiance à ZWish pour leurs moments importants.</p>
          <div class="cta-actions">
            <a routerLink="/app/events/new" class="btn-hero-primary">
              Commencer gratuitement
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M4 10h12M10 4l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            </a>
            <a routerLink="/catalog" class="btn-hero-ghost">Explorer le catalogue</a>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; padding-top: 64px; }
    .container { max-width: 1280px; margin: 0 auto; padding: 0 24px; }

    /* HERO */
    .hero {
      background: #000; min-height: 100vh; position: relative;
      display: flex; align-items: center; overflow: hidden;
    }
    .hero-bg {
      position: absolute; inset: 0;
      background: radial-gradient(ellipse 80% 60% at 70% 50%, rgba(255,215,0,0.08) 0%, transparent 60%),
                  radial-gradient(ellipse 60% 80% at 20% 80%, rgba(255,100,0,0.05) 0%, transparent 50%);
    }
    .hero .container {
      position: relative; z-index: 1;
      display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center;
      padding-top: 80px; padding-bottom: 80px;
    }
    .hero-content { display: flex; flex-direction: column; gap: 28px; }
    .hero-kicker {
      display: inline-flex; color: #FFD700; font-size: 0.82rem; font-weight: 700;
      letter-spacing: 0.1em; text-transform: uppercase;
    }
    .hero-title {
      font-size: clamp(3rem, 6vw, 5rem); font-weight: 900; line-height: 1.0;
      color: white; margin: 0; letter-spacing: -0.03em;
    }
    .hero-accent { color: #FFD700; }
    .hero-desc { color: rgba(255,255,255,0.6); font-size: 1.1rem; line-height: 1.7; margin: 0; max-width: 480px; }
    .hero-actions { display: flex; gap: 14px; flex-wrap: wrap; }

    .btn-hero-primary {
      display: inline-flex; align-items: center; gap: 8px;
      background: #FFD700; color: #000; font-weight: 800; font-size: 0.95rem;
      padding: 14px 28px; border-radius: 12px; text-decoration: none; transition: 0.2s;
    }
    .btn-hero-primary:hover { background: #FFC000; transform: translateY(-1px); }
    .btn-hero-ghost {
      display: inline-flex; align-items: center;
      color: rgba(255,255,255,0.7); font-weight: 600; font-size: 0.95rem;
      padding: 14px 28px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.2);
      text-decoration: none; transition: 0.2s;
    }
    .btn-hero-ghost:hover { border-color: white; color: white; }

    .hero-stats { display: flex; align-items: center; gap: 24px; padding-top: 8px; }
    .hero-stat { display: flex; flex-direction: column; gap: 2px; }
    .hero-stat strong { color: white; font-size: 1.5rem; font-weight: 900; }
    .hero-stat span { color: rgba(255,255,255,0.45); font-size: 0.78rem; }
    .hero-stat-sep { width: 1px; height: 32px; background: rgba(255,255,255,0.1); }

    /* Hero Visual */
    .hero-visual { position: relative; }
    .hero-card-main {
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
      border-radius: 24px; padding: 28px; backdrop-filter: blur(20px);
    }
    .event-preview { display: flex; flex-direction: column; gap: 20px; }
    .ep-header { display: flex; align-items: center; gap: 12px; }
    .ep-avatar {
      width: 42px; height: 42px; border-radius: 50%; background: #FFD700;
      color: #000; font-weight: 900; font-size: 1.1rem;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .ep-name { color: white; font-weight: 700; font-size: 0.95rem; }
    .ep-date { color: rgba(255,255,255,0.45); font-size: 0.78rem; margin-top: 2px; }
    .ep-badge {
      margin-left: auto; background: rgba(34,197,94,0.2); color: #22c55e;
      padding: 3px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 700;
      border: 1px solid rgba(34,197,94,0.3);
    }
    .ep-items { display: flex; flex-direction: column; gap: 16px; }
    .ep-item { display: flex; flex-direction: column; gap: 6px; }
    .ep-item-info { display: flex; justify-content: space-between; align-items: center; }
    .ep-item-name { color: rgba(255,255,255,0.8); font-size: 0.85rem; font-weight: 500; }
    .ep-item-price { color: rgba(255,255,255,0.45); font-size: 0.78rem; }
    .ep-progress-wrap { height: 4px; background: rgba(255,255,255,0.1); border-radius: 999px; overflow: hidden; }
    .ep-progress-bar { height: 100%; background: #FFD700; border-radius: 999px; }
    .ep-progress-done { background: #22c55e; }
    .ep-item-pct { color: #FFD700; font-size: 0.75rem; font-weight: 700; align-self: flex-end; }
    .ep-item-pct.done { color: #22c55e; }
    .ep-btn {
      display: block; text-align: center; background: #FFD700; color: #000;
      font-weight: 800; padding: 12px; border-radius: 12px;
      text-decoration: none; font-size: 0.9rem; margin-top: 4px;
    }

    .hero-float-1, .hero-float-2 {
      position: absolute; display: flex; align-items: center; gap: 8px;
      background: rgba(255,255,255,0.08); backdrop-filter: blur(16px);
      border: 1px solid rgba(255,255,255,0.12); border-radius: 999px;
      padding: 8px 14px; color: white; font-size: 0.8rem; font-weight: 600;
      animation: float 3s ease-in-out infinite;
    }
    .hero-float-1 { top: -20px; right: -20px; animation-delay: 0s; }
    .hero-float-2 { bottom: -16px; left: -16px; animation-delay: 1.5s; }
    @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }

    /* TRUST BAR */
    .trust-bar {
      background: #0a0a0a; border-top: 1px solid rgba(255,255,255,0.06);
      border-bottom: 1px solid rgba(255,255,255,0.06);
      padding: 20px 0;
    }
    .trust-bar .container { display: flex; align-items: center; gap: 32px; flex-wrap: wrap; justify-content: center; }
    .trust-label { color: rgba(255,255,255,0.3); font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.1em; }
    .trust-items { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
    .trust-item { color: rgba(255,255,255,0.55); font-size: 0.88rem; }
    .trust-sep { color: rgba(255,255,255,0.15); }

    /* FEATURES DARK */
    .features-dark { background: #0a0a0a; padding: 100px 0; }
    .section-eyebrow {
      color: #FFD700; font-size: 0.78rem; font-weight: 800; text-transform: uppercase;
      letter-spacing: 0.15em; margin-bottom: 16px;
    }
    .section-title-light {
      color: white; font-size: clamp(2rem, 4vw, 3rem); font-weight: 900;
      line-height: 1.15; letter-spacing: -0.02em; margin: 0 0 64px;
    }
    .features-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }

    .feature-card-dark {
      background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 20px; padding: 32px; display: flex; flex-direction: column; gap: 16px;
      transition: 0.25s; position: relative;
    }
    .feature-card-dark:hover { background: rgba(255,255,255,0.06); border-color: rgba(255,215,0,0.3); transform: translateY(-4px); }
    .feature-card-dark.featured { background: rgba(255,215,0,0.05); border-color: rgba(255,215,0,0.2); }
    .feature-badge {
      position: absolute; top: 20px; right: 20px;
      background: #FFD700; color: #000; font-size: 0.7rem; font-weight: 800;
      padding: 3px 10px; border-radius: 999px;
    }
    .feature-icon-wrap {
      width: 52px; height: 52px; border-radius: 14px;
      background: rgba(255,215,0,0.1); display: flex; align-items: center; justify-content: center;
    }
    .feature-card-dark h3 { color: white; font-size: 1.05rem; font-weight: 700; margin: 0; }
    .feature-card-dark p { color: rgba(255,255,255,0.5); font-size: 0.88rem; line-height: 1.65; margin: 0; }

    /* HOW MINI */
    .how-mini { background: #fff; padding: 100px 0; }
    .how-mini-header { margin-bottom: 64px; }
    .section-eyebrow.dark { color: #FFD700; }
    .section-title-dark {
      color: #111; font-size: clamp(2rem, 4vw, 3rem); font-weight: 900;
      line-height: 1.15; letter-spacing: -0.02em; margin: 0;
    }
    .steps-row { display: flex; align-items: flex-start; gap: 0; }
    .step-item { flex: 1; padding-right: 40px; }
    .step-num {
      font-size: 3.5rem; font-weight: 900; color: #f3f4f6;
      line-height: 1; margin-bottom: 16px; font-family: monospace;
    }
    .step-item h3 { font-size: 1.1rem; font-weight: 800; color: #111; margin: 0 0 10px; }
    .step-item p { color: #6b7280; font-size: 0.9rem; line-height: 1.7; margin: 0; }
    .step-arrow { color: #d1d5db; font-size: 1.5rem; margin-top: 56px; flex-shrink: 0; padding: 0 16px; }
    .how-mini-cta { margin-top: 48px; }
    .btn-outline-dark {
      display: inline-flex; padding: 12px 28px; border: 2px solid #111;
      border-radius: 10px; color: #111; font-weight: 700; text-decoration: none;
      transition: 0.2s;
    }
    .btn-outline-dark:hover { background: #111; color: white; }

    /* CTA FINAL */
    .cta-final { background: #000; padding: 120px 0; position: relative; overflow: hidden; }
    .cta-bg {
      position: absolute; inset: 0;
      background: radial-gradient(ellipse 80% 100% at 50% 100%, rgba(255,215,0,0.1) 0%, transparent 60%);
    }
    .cta-content { position: relative; text-align: center; max-width: 680px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; align-items: center; }
    .cta-content h2 { color: white; font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 900; line-height: 1.1; letter-spacing: -0.03em; margin: 0; }
    .cta-content p { color: rgba(255,255,255,0.55); font-size: 1.05rem; line-height: 1.7; margin: 0; max-width: 480px; }
    .cta-actions { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }

    /* RESPONSIVE */
    @media (max-width: 1100px) {
      .features-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 900px) {
      .hero .container { grid-template-columns: 1fr; gap: 48px; padding-top: 48px; }
      .hero-visual { display: none; }
      .steps-row { flex-direction: column; gap: 32px; }
      .step-arrow { display: none; }
    }
    @media (max-width: 640px) {
      .features-grid { grid-template-columns: 1fr; }
      .hero-stats { flex-wrap: wrap; gap: 16px; }
      .hero-stat-sep { display: none; }
    }
  `],
})
export class PublicHomePageComponent {}