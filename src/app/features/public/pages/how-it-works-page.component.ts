import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-how-it-works-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <!-- HERO -->
    <section class="hero">
      <div class="hero-glow"></div>
      <div class="container">
        <div class="hero-eyebrow">Guide</div>
        <h1>Comment fonctionne<br/><span class="accent">ZWish ?</span></h1>
        <p>De la création à la réception, tout est pensé pour être simple, transparent et agréable.</p>
      </div>
    </section>

    <!-- STEPS TIMELINE -->
    <section class="steps-section">
      <div class="container">
        <div class="steps-timeline">

          <div class="step-row">
            <div class="step-num-col">
              <div class="step-circle">01</div>
              <div class="step-line"></div>
            </div>
            <div class="step-content">
              <div class="step-tag">Organisateur</div>
              <h2>Créez votre événement</h2>
              <p>En quelques clics, configurez votre occasion — anniversaire, mariage, baby shower, diplôme. Donnez-lui un nom, une date, une description.</p>
              <div class="step-detail-grid">
                <div class="step-detail">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
                  <span>Choisissez la date</span>
                </div>
                <div class="step-detail">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
                  <span>Invitez vos proches</span>
                </div>
                <div class="step-detail">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
                  <span>Événement privé et sécurisé</span>
                </div>
              </div>
            </div>
          </div>

          <div class="step-row step-row-alt">
            <div class="step-num-col">
              <div class="step-circle accent">02</div>
              <div class="step-line"></div>
            </div>
            <div class="step-content">
              <div class="step-tag">Organisateur</div>
              <h2>Construisez votre wishlist</h2>
              <p>Parcourez notre catalogue et ajoutez les produits qui vous font envie. Fixez le montant cible, choisissez le mode de contribution (réservation exclusive ou participation collective).</p>
              <div class="wishlist-preview">
                <div class="wp-item">
                  <div class="wp-color" style="background:#6366f1"></div>
                  <div class="wp-info"><div class="wp-name">Robot Pâtissier KitchenAid</div><div class="wp-price">450 000 XOF</div></div>
                  <div class="wp-mode">Contributions</div>
                </div>
                <div class="wp-item">
                  <div class="wp-color" style="background:#FFD700"></div>
                  <div class="wp-info"><div class="wp-name">Séjour Balnéaire 3 nuits</div><div class="wp-price">800 000 XOF</div></div>
                  <div class="wp-mode">Contributions</div>
                </div>
                <div class="wp-item">
                  <div class="wp-color" style="background:#22c55e"></div>
                  <div class="wp-info"><div class="wp-name">Bijoux Artisanaux</div><div class="wp-price">120 000 XOF</div></div>
                  <div class="wp-mode">Réservation</div>
                </div>
              </div>
            </div>
          </div>

          <div class="step-row">
            <div class="step-num-col">
              <div class="step-circle">03</div>
              <div class="step-line"></div>
            </div>
            <div class="step-content">
              <div class="step-tag">Invités</div>
              <h2>Partagez et recevez les contributions</h2>
              <p>Un lien unique est généré. Partagez-le par WhatsApp, email ou réseaux sociaux. Vos invités accèdent à la wishlist, choisissent leur cadeau et paient en toute sécurité.</p>
              <div class="share-visual">
                <div class="share-link">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
                  <span>zwish.app/join/mariage-marie-2026</span>
                </div>
                <div class="share-chips">
                  <span class="chip">📱 WhatsApp</span>
                  <span class="chip">📧 Email</span>
                  <span class="chip">📋 Copier</span>
                </div>
              </div>
            </div>
          </div>

          <div class="step-row step-row-alt">
            <div class="step-num-col">
              <div class="step-circle accent">04</div>
              <div class="step-line"></div>
            </div>
            <div class="step-content">
              <div class="step-tag">Invités</div>
              <h2>Paiement simple et sécurisé</h2>
              <p>Mobile Money, carte bancaire — plusieurs options disponibles. Chaque contribution est confirmée instantanément et visible sur le dashboard de l'organisateur.</p>
              <div class="payment-methods">
                <div class="pay-method">📱 Mobile Money</div>
                <div class="pay-method">💳 Carte bancaire</div>
                <div class="pay-method">🏦 Virement</div>
              </div>
            </div>
          </div>

          <div class="step-row last">
            <div class="step-num-col">
              <div class="step-circle gold">05</div>
            </div>
            <div class="step-content">
              <div class="step-tag">Organisateur</div>
              <h2>Recevez ce que vous voulez vraiment ✨</h2>
              <p>Suivez l'avancement en temps réel. Quand un item est entièrement financé, vous êtes notifié. Plus de cadeaux en double, plus de surprises ratées.</p>
              <div class="finish-visual">
                <div class="finish-card">
                  <div class="finish-emoji">🎉</div>
                  <div>
                    <div class="finish-title">Robot Pâtissier — 100% financé !</div>
                    <div class="finish-sub">7 contributeurs · 450 000 XOF collectés</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="faq-section">
      <div class="container">
        <h2 class="faq-title">Questions fréquentes</h2>
        <div class="faq-grid">
          <div class="faq-item" *ngFor="let q of faqs">
            <div class="faq-q">{{ q.q }}</div>
            <div class="faq-a">{{ q.a }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta-section">
      <div class="container">
        <div class="cta-card">
          <div class="cta-text">
            <h2>Prêt à créer votre événement ?</h2>
            <p>Rejoignez des centaines d'organisateurs qui font confiance à ZWish.</p>
          </div>
          <div class="cta-actions">
            <a routerLink="/app/events/new" class="btn-primary-yellow">Créer un événement gratuit →</a>
            <a routerLink="/catalog" class="btn-ghost-dark">Voir le catalogue</a>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; padding-top: 64px; background: #fff; }
    .container { max-width: 1080px; margin: 0 auto; padding: 0 24px; }

    /* HERO */
    .hero { background: #000; padding: 100px 0 80px; position: relative; overflow: hidden; text-align: center; }
    .hero-glow { position: absolute; inset: 0; background: radial-gradient(ellipse 60% 80% at 50% 100%, rgba(255,215,0,0.12) 0%, transparent 60%); }
    .hero .container { position: relative; z-index: 1; }
    .hero-eyebrow { color: #FFD700; font-size: 0.78rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 20px; }
    .hero h1 { font-size: clamp(2.5rem, 5vw, 4rem); font-weight: 900; color: white; line-height: 1.1; letter-spacing: -0.03em; margin: 0 0 24px; }
    .accent { color: #FFD700; }
    .hero p { color: rgba(255,255,255,0.55); font-size: 1.1rem; line-height: 1.7; max-width: 560px; margin: 0 auto; }

    /* STEPS */
    .steps-section { padding: 80px 0 40px; }
    .steps-timeline { display: flex; flex-direction: column; gap: 0; }

    .step-row { display: grid; grid-template-columns: 80px 1fr; gap: 40px; padding-bottom: 64px; }
    .step-row.last { padding-bottom: 0; }
    .step-row-alt .step-content { order: unset; }

    .step-num-col { display: flex; flex-direction: column; align-items: center; }
    .step-circle {
      width: 56px; height: 56px; border-radius: 50%; background: #f3f4f6;
      color: #6b7280; font-size: 0.85rem; font-weight: 900; font-family: monospace;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      border: 2px solid #e5e7eb;
    }
    .step-circle.accent { background: #111; color: #FFD700; border-color: #111; }
    .step-circle.gold { background: #FFD700; color: #000; border-color: #FFD700; }
    .step-line { flex: 1; width: 2px; background: #f3f4f6; margin: 12px 0; min-height: 40px; }

    .step-content { padding-top: 8px; display: flex; flex-direction: column; gap: 16px; }
    .step-tag { display: inline-flex; padding: 3px 10px; border-radius: 999px; background: #f3f4f6; color: #6b7280; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; align-self: flex-start; }
    .step-content h2 { font-size: 1.6rem; font-weight: 900; color: #111; margin: 0; letter-spacing: -0.02em; }
    .step-content p { color: #6b7280; font-size: 0.95rem; line-height: 1.7; margin: 0; max-width: 560px; }

    .step-detail-grid { display: flex; gap: 24px; flex-wrap: wrap; }
    .step-detail { display: flex; align-items: center; gap: 8px; color: #374151; font-size: 0.85rem; font-weight: 500; }
    .step-detail svg { color: #FFD700; flex-shrink: 0; }

    .wishlist-preview { display: flex; flex-direction: column; gap: 10px; max-width: 480px; }
    .wp-item { display: flex; align-items: center; gap: 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px 16px; }
    .wp-color { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .wp-info { flex: 1; }
    .wp-name { font-size: 0.88rem; font-weight: 600; color: #111; }
    .wp-price { font-size: 0.78rem; color: #9ca3af; margin-top: 2px; }
    .wp-mode { font-size: 0.72rem; font-weight: 700; color: #6366f1; background: #ede9fe; padding: 2px 8px; border-radius: 6px; white-space: nowrap; }

    .share-visual { display: flex; flex-direction: column; gap: 12px; max-width: 400px; }
    .share-link { display: flex; align-items: center; gap: 8px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px 14px; font-size: 0.82rem; color: #6b7280; font-family: monospace; }
    .share-chips { display: flex; gap: 8px; flex-wrap: wrap; }
    .chip { background: #f3f4f6; color: #374151; padding: 6px 12px; border-radius: 8px; font-size: 0.82rem; font-weight: 600; }

    .payment-methods { display: flex; gap: 10px; flex-wrap: wrap; }
    .pay-method { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px 16px; font-size: 0.85rem; font-weight: 600; color: #374151; }

    .finish-visual { max-width: 440px; }
    .finish-card { display: flex; align-items: center; gap: 16px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 14px; padding: 16px 20px; }
    .finish-emoji { font-size: 2rem; }
    .finish-title { font-size: 0.9rem; font-weight: 700; color: #166534; }
    .finish-sub { font-size: 0.78rem; color: #4ade80; margin-top: 3px; }

    /* FAQ */
    .faq-section { background: #f9fafb; padding: 80px 0; margin-top: 40px; }
    .faq-title { font-size: 2rem; font-weight: 900; color: #111; margin: 0 0 48px; text-align: center; letter-spacing: -0.02em; }
    .faq-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .faq-item { background: white; border: 1px solid #e5e7eb; border-radius: 16px; padding: 24px; }
    .faq-q { font-weight: 700; color: #111; margin-bottom: 10px; font-size: 0.95rem; }
    .faq-a { color: #6b7280; font-size: 0.88rem; line-height: 1.7; }

    /* CTA */
    .cta-section { padding: 80px 0; }
    .cta-card {
      background: #000; border-radius: 24px; padding: 56px; display: flex;
      align-items: center; justify-content: space-between; gap: 40px; flex-wrap: wrap;
    }
    .cta-text h2 { color: white; font-size: 1.8rem; font-weight: 900; margin: 0 0 10px; letter-spacing: -0.02em; }
    .cta-text p { color: rgba(255,255,255,0.55); margin: 0; font-size: 0.95rem; }
    .cta-actions { display: flex; flex-direction: column; gap: 12px; align-items: flex-end; }
    .btn-primary-yellow {
      display: inline-flex; background: #FFD700; color: #000; font-weight: 800;
      padding: 14px 24px; border-radius: 12px; text-decoration: none; font-size: 0.92rem; white-space: nowrap;
    }
    .btn-ghost-dark {
      color: rgba(255,255,255,0.6); font-size: 0.88rem; font-weight: 600; text-decoration: none;
      text-align: center;
    }
    .btn-ghost-dark:hover { color: white; }

    @media (max-width: 768px) {
      .faq-grid { grid-template-columns: 1fr; }
      .cta-card { padding: 32px; flex-direction: column; align-items: flex-start; }
      .cta-actions { align-items: flex-start; }
      .step-row { grid-template-columns: 48px 1fr; gap: 20px; }
    }
  `],
})
export class HowItWorksPageComponent {
  faqs = [
    { q: "ZWish est-il gratuit ?", a: "Oui, la création d'événements et de wishlists est totalement gratuite. Des frais de transaction peuvent s'appliquer selon le moyen de paiement utilisé." },
    { q: "Mes invités doivent-ils créer un compte ?", a: "Non, vos invités peuvent accéder à la wishlist et contribuer sans créer de compte, avec le lien de partage unique." },
    { q: "Quels moyens de paiement sont acceptés ?", a: "Nous acceptons le Mobile Money (Orange, MTN, Moov) et les cartes bancaires. D'autres options sont en cours d'intégration." },
    { q: "Que se passe-t-il si l'item n'est pas entièrement financé ?", a: "Les contributions partielles sont conservées. Vous pouvez décider de lancer l'achat avec le montant collecté ou d'attendre que l'item soit entièrement financé." },
    { q: "Est-ce que je peux modifier ma wishlist après publication ?", a: "Oui, vous pouvez ajouter ou modifier des items à tout moment, tant qu'aucune réservation n'a été effectuée dessus." },
    { q: "Comment recevoir les fonds collectés ?", a: "Une fois l'item financé, les fonds vous sont versés directement sur votre compte Mobile Money ou bancaire." },
  ];
}