import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-public-home-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="hero">
      <div class="container hero-grid">
        <div class="hero-copy">
          <span class="eyebrow">Wishlist événementielle moderne</span>
          <h1>
            Organisez vos cadeaux et contributions
            <span>avec élégance</span>
          </h1>
          <p>
            ZWish aide les organisateurs à créer une wishlist claire, à partager
            leur événement avec leurs proches et à suivre les contributions sans
            confusion ni doublons.
          </p>

          <div class="hero-actions">
            <a routerLink="/app/events/new" class="btn btn-primary">
              Créer mon événement
            </a>
            <a routerLink="/catalog" class="btn btn-secondary">
              Explorer le catalogue
            </a>
          </div>

          <div class="hero-stats">
            <div class="stat-card">
              <strong>Wishlist</strong>
              <span>Ajout de produits et demandes personnalisées</span>
            </div>
            <div class="stat-card">
              <strong>Contributions</strong>
              <span>Suivi simple des montants et participations</span>
            </div>
            <div class="stat-card">
              <strong>Partage</strong>
              <span>Lien privé, public ou non listé selon vos besoins</span>
            </div>
          </div>
        </div>

        <div class="hero-visual">
          <div class="mockup-card card-main">
            <div class="mockup-badge">Événement</div>
            <h3>Mariage Awa & Karim</h3>
            <p>
              Une wishlist claire, agréable et facile à partager avec les invités.
            </p>
            <div class="mockup-progress">
              <div class="mockup-progress-bar"></div>
            </div>
            <small>68% des contributions atteintes</small>
          </div>

          <div class="mockup-card card-secondary">
            <h4>Robot mixeur</h4>
            <p>120 000 FCFA</p>
            <button type="button">Ajouter à ma wishlist</button>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-head">
          <span class="section-kicker">Pourquoi ZWish</span>
          <h2>Une expérience pensée pour les organisateurs et les invités</h2>
          <p>
            Plus besoin de gérer les cadeaux par messages dispersés. Tout est
            centralisé, lisible et rassurant.
          </p>
        </div>

        <div class="feature-grid">
          <article class="feature-card">
            <h3>Créez votre événement</h3>
            <p>
              Ajoutez un titre, une date, une description et préparez votre wishlist
              en quelques minutes.
            </p>
          </article>

          <article class="feature-card">
            <h3>Ajoutez des cadeaux</h3>
            <p>
              Choisissez des produits du catalogue ou soumettez une demande
              personnalisée.
            </p>
          </article>

          <article class="feature-card">
            <h3>Partagez facilement</h3>
            <p>
              Diffusez votre événement par lien public, privé ou non listé selon
              vos besoins.
            </p>
          </article>

          <article class="feature-card">
            <h3>Recevez des contributions</h3>
            <p>
              Montant libre, paliers ou financement collectif selon le type d’item.
            </p>
          </article>
        </div>
      </div>
    </section>

    <section class="section alt">
      <div class="container">
        <div class="section-head">
          <span class="section-kicker">Parcours simple</span>
          <h2>Comment ça marche</h2>
          <p>
            Un parcours pensé pour aller vite, comprendre facilement et participer
            sans friction.
          </p>
        </div>

        <div class="steps-grid">
          <article class="step-card">
            <div class="step-number">1</div>
            <h3>Créer l’événement</h3>
            <p>Nom, date, description, visibilité et wishlist liée automatiquement.</p>
          </article>

          <article class="step-card">
            <div class="step-number">2</div>
            <h3>Ajouter les souhaits</h3>
            <p>Produits catalogue, demandes personnalisées ou contributions libres.</p>
          </article>

          <article class="step-card">
            <div class="step-number">3</div>
            <h3>Partager le lien</h3>
            <p>Les invités accèdent rapidement à l’événement et à ses besoins.</p>
          </article>

          <article class="step-card">
            <div class="step-number">4</div>
            <h3>Suivre les contributions</h3>
            <p>Visualisez l’avancement et le reste à financer en temps réel.</p>
          </article>
        </div>
      </div>
    </section>

    <section class="cta-section">
      <div class="container">
        <div class="cta-card">
          <div>
            <span class="section-kicker">Prêt à démarrer ?</span>
            <h2>Créez votre premier événement sur ZWish</h2>
            <p>
              Préparez une wishlist moderne, partagez-la avec vos proches et
              simplifiez la gestion des cadeaux.
            </p>
          </div>

          <a routerLink="/app/events/new" class="btn btn-primary">
            Commencer maintenant
          </a>
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
      width: min(1180px, calc(100% - 32px));
      margin: 0 auto;
    }

    .hero {
      padding: 48px 0 32px;
      background:
        radial-gradient(circle at top right, rgba(255, 179, 71, 0.18), transparent 28%),
        radial-gradient(circle at bottom left, rgba(255, 122, 89, 0.12), transparent 30%);
    }

    .hero-grid {
      display: grid;
      grid-template-columns: 1.1fr 0.9fr;
      gap: 32px;
      align-items: center;
    }

    .eyebrow,
    .section-kicker {
      display: inline-block;
      margin-bottom: 12px;
      padding: 8px 12px;
      border-radius: 999px;
      background: #fff1eb;
      color: #e85d3e;
      font-weight: 700;
      font-size: 0.9rem;
    }

    .hero-copy h1 {
      margin: 0 0 18px;
      font-size: clamp(2.4rem, 5vw, 4.2rem);
      line-height: 1.02;
      color: #111827;
    }

    .hero-copy h1 span {
      color: #ff7a59;
    }

    .hero-copy p {
      margin: 0 0 24px;
      font-size: 1.06rem;
      line-height: 1.75;
      color: #4b5563;
      max-width: 720px;
    }

    .hero-actions {
      display: flex;
      gap: 14px;
      flex-wrap: wrap;
      margin-bottom: 24px;
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

    .btn-primary:hover,
    .btn-secondary:hover {
      transform: translateY(-1px);
    }

    .btn-secondary {
      background: white;
      color: #374151;
      border-color: #eadfd9;
    }

    .hero-stats,
    .feature-grid,
    .steps-grid {
      display: grid;
      gap: 16px;
    }

    .hero-stats {
      grid-template-columns: repeat(3, 1fr);
    }

    .feature-grid,
    .steps-grid {
      grid-template-columns: repeat(4, 1fr);
    }

    .stat-card,
    .feature-card,
    .step-card,
    .mockup-card,
    .cta-card {
      background: white;
      border: 1px solid #f0e5df;
      border-radius: 24px;
      box-shadow: 0 18px 50px rgba(17, 24, 39, 0.06);
    }

    .stat-card,
    .feature-card,
    .step-card {
      padding: 22px;
    }

    .stat-card strong,
    .feature-card h3,
    .step-card h3 {
      color: #111827;
    }

    .stat-card span,
    .feature-card p,
    .step-card p {
      color: #6b7280;
      line-height: 1.6;
    }

    .hero-visual {
      position: relative;
      min-height: 420px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .mockup-card {
      padding: 24px;
    }

    .card-main {
      width: min(100%, 430px);
      transform: rotate(-2deg);
    }

    .card-secondary {
      position: absolute;
      right: 0;
      bottom: 10px;
      width: 230px;
      transform: rotate(6deg);
    }

    .mockup-badge {
      display: inline-block;
      margin-bottom: 14px;
      padding: 6px 10px;
      border-radius: 999px;
      background: #fff1eb;
      color: #e85d3e;
      font-size: 0.85rem;
      font-weight: 700;
    }

    .mockup-card h3,
    .mockup-card h4 {
      margin: 0 0 10px;
      color: #111827;
    }

    .mockup-card p {
      margin: 0 0 14px;
      color: #6b7280;
      line-height: 1.6;
    }

    .mockup-progress {
      height: 12px;
      border-radius: 999px;
      background: #f3f4f6;
      overflow: hidden;
      margin-bottom: 10px;
    }

    .mockup-progress-bar {
      height: 100%;
      width: 68%;
      background: linear-gradient(135deg, #ff7a59, #ffb347);
    }

    .card-secondary button {
      width: 100%;
      border: none;
      border-radius: 14px;
      padding: 12px 14px;
      background: #111827;
      color: white;
      font-weight: 700;
      cursor: pointer;
    }

    .section {
      padding: 64px 0;
    }

    .section.alt {
      padding-top: 8px;
    }

    .section-head {
      max-width: 760px;
      margin-bottom: 28px;
    }

    .section-head h2 {
      margin: 0 0 12px;
      font-size: clamp(1.9rem, 3vw, 2.9rem);
      color: #111827;
    }

    .section-head p {
      margin: 0;
      color: #6b7280;
      line-height: 1.7;
    }

    .step-number {
      width: 44px;
      height: 44px;
      border-radius: 14px;
      display: grid;
      place-items: center;
      background: linear-gradient(135deg, #ff7a59, #ffb347);
      color: white;
      font-weight: 800;
      margin-bottom: 16px;
    }

    .cta-section {
      padding: 0 0 48px;
    }

    .cta-card {
      padding: 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 24px;
      background: linear-gradient(135deg, #fff5f0, #ffffff);
    }

    .cta-card h2 {
      margin: 0 0 10px;
      color: #111827;
    }

    .cta-card p {
      margin: 0;
      color: #6b7280;
      line-height: 1.7;
      max-width: 700px;
    }

    @media (max-width: 1100px) {
      .hero-grid,
      .feature-grid,
      .steps-grid {
        grid-template-columns: 1fr 1fr;
      }

      .hero-stats {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .hero-grid,
      .feature-grid,
      .steps-grid {
        grid-template-columns: 1fr;
      }

      .cta-card {
        flex-direction: column;
        align-items: flex-start;
      }

      .card-secondary {
        position: static;
        width: 100%;
        margin-top: 16px;
        transform: none;
      }

      .card-main {
        transform: none;
      }
    }
  `],
})
export class PublicHomePageComponent {}