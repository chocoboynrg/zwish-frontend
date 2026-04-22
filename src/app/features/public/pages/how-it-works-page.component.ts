import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-how-it-works-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="hero">
      <div class="container">
        <div class="hero-card">
          <span class="kicker">Comment ça marche</span>
          <h1>Le fonctionnement de ZWish</h1>
          <p>
            ZWish permet de créer une wishlist événementielle, d’ajouter des
            produits, de partager un lien avec ses invités et de suivre les
            contributions simplement.
          </p>
        </div>
      </div>
    </section>

    <section class="page-section">
      <div class="container">
        <div class="timeline">
          <article class="timeline-card">
            <div class="timeline-number">1</div>
            <div>
              <h2>Créer un événement</h2>
              <p>
                L’organisateur crée son événement avec un titre, une date, une
                description et une image.
              </p>
            </div>
          </article>

          <article class="timeline-card">
            <div class="timeline-number">2</div>
            <div>
              <h2>Préparer la wishlist</h2>
              <p>
                Il ajoute des produits du catalogue ou fait une demande pour un
                produit personnalisé.
              </p>
            </div>
          </article>

          <article class="timeline-card">
            <div class="timeline-number">3</div>
            <div>
              <h2>Partager avec les invités</h2>
              <p>
                L’événement peut être partagé par lien pour permettre la
                consultation et la participation.
              </p>
            </div>
          </article>

          <article class="timeline-card">
            <div class="timeline-number">4</div>
            <div>
              <h2>Réserver ou contribuer</h2>
              <p>
                Les invités peuvent réserver un item ou contribuer à son
                financement selon les règles définies.
              </p>
            </div>
          </article>

          <article class="timeline-card">
            <div class="timeline-number">5</div>
            <div>
              <h2>Suivre les paiements</h2>
              <p>
                L’organisateur visualise les contributions et l’avancement de
                chaque item en temps réel.
              </p>
            </div>
          </article>
        </div>

        <div class="cta-card">
          <div>
            <span class="kicker small">Démarrer</span>
            <h2>Prêt à créer votre premier événement ?</h2>
            <p>
              Passez de l’idée au partage en quelques étapes simples, avec une
              expérience pensée pour les organisateurs comme pour les invités.
            </p>
          </div>

          <div class="cta-actions">
            <a routerLink="/app/events/new" class="btn btn-primary">
              Créer un événement
            </a>
            <a routerLink="/catalog" class="btn btn-secondary">
              Voir le catalogue
            </a>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host {
      display: block;
      background: #fffaf8;
    }

    .container {
      width: min(980px, calc(100% - 32px));
      margin: 0 auto;
    }

    .hero {
      padding: 40px 0 12px;
      background:
        radial-gradient(circle at top right, rgba(255, 179, 71, 0.16), transparent 28%),
        radial-gradient(circle at bottom left, rgba(255, 122, 89, 0.1), transparent 30%);
    }

    .hero-card,
    .timeline-card,
    .cta-card {
      background: white;
      border: 1px solid #f0e5df;
      border-radius: 24px;
      box-shadow: 0 18px 50px rgba(17, 24, 39, 0.06);
    }

    .hero-card {
      padding: 28px;
    }

    .page-section {
      padding: 20px 0 56px;
    }

    .kicker {
      display: inline-block;
      margin-bottom: 12px;
      padding: 8px 12px;
      border-radius: 999px;
      background: #fff1eb;
      color: #e85d3e;
      font-weight: 700;
      font-size: 0.9rem;
    }

    .kicker.small {
      margin-bottom: 8px;
      font-size: 0.82rem;
    }

    .hero-card h1 {
      margin: 0 0 14px;
      font-size: clamp(2rem, 4vw, 3.2rem);
      color: #111827;
      line-height: 1.08;
    }

    .hero-card p {
      margin: 0;
      max-width: 760px;
      color: #6b7280;
      line-height: 1.75;
      font-size: 1.02rem;
    }

    .timeline {
      display: grid;
      gap: 16px;
      margin-bottom: 24px;
    }

    .timeline-card {
      display: grid;
      grid-template-columns: 64px 1fr;
      gap: 18px;
      padding: 24px;
    }

    .timeline-number {
      width: 52px;
      height: 52px;
      border-radius: 16px;
      display: grid;
      place-items: center;
      background: linear-gradient(135deg, #ff7a59, #ffb347);
      color: white;
      font-weight: 800;
      font-size: 1.1rem;
    }

    .timeline-card h2 {
      margin: 0 0 8px;
      color: #111827;
      font-size: 1.15rem;
    }

    .timeline-card p {
      margin: 0;
      color: #6b7280;
      line-height: 1.7;
    }

    .cta-card {
      padding: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
      background: linear-gradient(135deg, #fff5f0, #ffffff);
    }

    .cta-card h2 {
      margin: 0 0 8px;
      color: #111827;
    }

    .cta-card p {
      margin: 0;
      color: #6b7280;
      line-height: 1.7;
      max-width: 620px;
    }

    .cta-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 12px 18px;
      border-radius: 14px;
      text-decoration: none;
      font-weight: 700;
      border: 1px solid transparent;
      transition: 0.2s ease;
    }

    .btn-primary {
      background: linear-gradient(135deg, #ff7a59, #ffb347);
      color: white;
      box-shadow: 0 10px 25px rgba(255, 122, 89, 0.22);
    }

    .btn-secondary {
      background: #111827;
      color: white;
    }

    .btn-primary:hover,
    .btn-secondary:hover {
      transform: translateY(-1px);
    }

    @media (max-width: 760px) {
      .timeline-card {
        grid-template-columns: 1fr;
      }

      .cta-card {
        flex-direction: column;
        align-items: flex-start;
      }

      .cta-actions {
        width: 100%;
        flex-direction: column;
      }

      .btn {
        width: 100%;
      }
    }
  `],
})
export class HowItWorksPageComponent {}