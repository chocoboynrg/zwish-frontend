import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { EventsService } from '../../events/services/events.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-create-user-event-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="page">
      <div class="hero-card">
        <div>
          <a routerLink="/app/events" class="back-link">← Retour à mes événements</a>
          <span class="eyebrow">Nouvel événement</span>
          <h1>Créer un événement</h1>
          <p class="subtitle">
            Créez un nouvel événement depuis votre espace utilisateur et préparez
            automatiquement sa wishlist.
          </p>
        </div>
      </div>

      <section class="card">
        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="form-group">
            <label for="title">Titre</label>
            <input
              id="title"
              type="text"
              formControlName="title"
              [class.invalid]="isFieldInvalid('title')"
              placeholder="Ex: Mariage de Awa et Karim"
            />

            <small class="field-error" *ngIf="isFieldInvalid('title')">
              Le titre est obligatoire.
            </small>
          </div>

          <div class="form-group">
            <label for="eventDate">Date de l’événement</label>
            <input
              id="eventDate"
              type="datetime-local"
              formControlName="eventDate"
              [class.invalid]="isFieldInvalid('eventDate')"
            />

            <small class="field-error" *ngIf="isFieldInvalid('eventDate')">
              La date de l’événement est obligatoire.
            </small>
          </div>

          <div class="form-group">
            <label for="description">Description</label>
            <textarea
              id="description"
              rows="5"
              formControlName="description"
              placeholder="Décrivez brièvement votre événement"
            ></textarea>
          </div>

          <div class="form-actions">
            <button type="submit" class="primary-btn" [disabled]="loading || form.invalid">
              {{ loading ? 'Création...' : 'Créer mon événement' }}
            </button>

            <a routerLink="/app/events" class="secondary-btn">
              Annuler
            </a>
          </div>
        </form>

        <div class="error-box" *ngIf="errorMessage">
          {{ errorMessage }}
        </div>
      </section>
    </section>
  `,
  styles: [`
    :host {
      display: block;
      background: #fffaf8;
      min-height: 100%;
    }

    .page {
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding: 24px;
    }

    .hero-card,
    .card {
      background: #ffffff;
      border: 1px solid #f0e5df;
      border-radius: 24px;
      box-shadow: 0 18px 50px rgba(17, 24, 39, 0.06);
    }

    .hero-card {
      padding: 28px;
      background:
        radial-gradient(circle at top right, rgba(255, 179, 71, 0.14), transparent 30%),
        linear-gradient(135deg, #fff5f0, #ffffff);
    }

    .back-link {
      display: inline-block;
      margin-bottom: 12px;
      color: #ff7a59;
      text-decoration: none;
      font-weight: 700;
    }

    .eyebrow {
      display: inline-block;
      margin-bottom: 10px;
      padding: 8px 12px;
      border-radius: 999px;
      background: #fff1eb;
      color: #e85d3e;
      font-weight: 700;
      font-size: 0.85rem;
    }

    .hero-card h1 {
      margin: 0 0 8px;
      font-size: 2rem;
      color: #111827;
    }

    .subtitle {
      margin: 0;
      color: #6b7280;
      line-height: 1.7;
      max-width: 760px;
    }

    .card {
      padding: 24px;
      max-width: 760px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
    }

    label {
      font-weight: 700;
      color: #374151;
      font-size: 0.95rem;
    }

    input,
    textarea {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid #e7ddd7;
      border-radius: 14px;
      padding: 12px 14px;
      font: inherit;
      background: white;
      outline: none;
      transition: 0.2s ease;
    }

    input:focus,
    textarea:focus {
      border-color: #ffb8a6;
      box-shadow: 0 0 0 4px rgba(255, 122, 89, 0.10);
    }

    input.invalid,
    textarea.invalid {
      border-color: #fca5a5;
    }

    .field-error {
      color: #b91c1c;
      font-size: 13px;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 8px;
    }

    .primary-btn,
    .secondary-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 12px 18px;
      border-radius: 14px;
      text-decoration: none;
      font-weight: 700;
      border: 1px solid transparent;
      transition: 0.2s ease;
      font: inherit;
      cursor: pointer;
    }

    .primary-btn {
      background: linear-gradient(135deg, #ff7a59, #ffb347);
      color: white;
      box-shadow: 0 10px 25px rgba(255, 122, 89, 0.22);
    }

    .secondary-btn {
      background: white;
      color: #374151;
      border-color: #eadfd9;
    }

    .primary-btn:hover,
    .secondary-btn:hover {
      transform: translateY(-1px);
    }

    .primary-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      transform: none;
    }

    .error-box {
      margin-top: 16px;
      padding: 14px 16px;
      border-radius: 14px;
      background: #fff7f7;
      border: 1px solid #fecaca;
      color: #b91c1c;
      line-height: 1.5;
    }
  `],
})
export class CreateUserEventPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly eventsService = inject(EventsService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  loading = false;
  errorMessage = '';

  readonly form = this.fb.group({
    title: ['', [Validators.required]],
    eventDate: ['', [Validators.required]],
    description: [''],
  });

  submit(): void {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const raw = this.form.getRawValue();

    this.eventsService.createEvent({
      title: raw.title ?? '',
      eventDate: new Date(raw.eventDate ?? '').toISOString(),
      description: raw.description ?? '',
    }).subscribe({
      next: (createdEvent: { id: number }) => {
        this.loading = false;
        this.toastService.success('Événement créé avec succès.');
        this.router.navigate(['/app/events', createdEvent.id]);
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Impossible de créer l’événement.';
      },
    });
  }

  isFieldInvalid(fieldName: 'title' | 'eventDate'): boolean {
    const control = this.form.get(fieldName);
    return !!control && control.invalid && control.touched;
  }
}