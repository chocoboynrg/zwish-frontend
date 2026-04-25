import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { EventsService } from '../../events/services/events.service';
import { ToastService } from '../../../core/services/toast.service';

const EVENT_TYPES = [
  { emoji: '💍', label: 'Mariage', value: 'Mariage' },
  { emoji: '🎂', label: 'Anniversaire', value: 'Anniversaire' },
  { emoji: '👶', label: 'Baby Shower', value: 'Baby Shower' },
  { emoji: '🎓', label: 'Diplôme', value: 'Diplôme' },
  { emoji: '🎉', label: 'Fête', value: 'Fête' },
  { emoji: '✨', label: 'Autre', value: '' },
];

@Component({
  selector: 'app-create-user-event-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="page-wrap">

      <!-- Hero -->
      <div class="page-hero">
        <div class="page-hero-inner">
          <a routerLink="/app/events" class="back-link">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M12 4L6 10l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            Mes événements
          </a>
          <div class="hero-text">
            <div class="hero-eyebrow">Nouvel événement</div>
            <h1>Créez votre moment.</h1>
            <p>Choisissez le type d'occasion, donnez-lui un nom et une date. Votre wishlist sera prête en quelques secondes.</p>
          </div>
        </div>
      </div>

      <div class="page-body">
        <div class="layout">

          <!-- FORMULAIRE -->
          <div class="form-col">
            <form [formGroup]="form" (ngSubmit)="submit()" novalidate>

              <!-- Étape 1 : Type d'occasion -->
              <div class="form-section">
                <div class="section-num">01</div>
                <div class="section-content">
                  <h2>Quel type d'occasion ?</h2>
                  <p class="section-desc">Sélectionnez le type qui correspond le mieux à votre événement. Cela aide vos invités à comprendre le contexte.</p>
                  <div class="type-grid">
                    <button
                      *ngFor="let t of eventTypes"
                      type="button"
                      class="type-btn"
                      [class.selected]="selectedType() === t.value"
                      (click)="selectType(t)"
                    >
                      <span class="type-emoji">{{ t.emoji }}</span>
                      <span class="type-label">{{ t.label }}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div class="section-divider"></div>

              <!-- Étape 2 : Nom -->
              <div class="form-section">
                <div class="section-num">02</div>
                <div class="section-content">
                  <h2>Donnez-lui un nom</h2>
                  <p class="section-desc">Le titre sera visible par vos invités. Soyez précis et festif !</p>
                  <div class="field">
                    <div class="input-wrap">
                      <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
                      <input
                        type="text"
                        formControlName="title"
                        placeholder="Ex : Mariage de Marie et Julien"
                        [class.invalid]="isInvalid('title')"
                        autocomplete="off"
                        maxlength="100"
                      />
                    </div>
                    <div class="field-footer">
                      <span class="field-err" *ngIf="isInvalid('title')">Le titre est obligatoire.</span>
                      <span class="char-count" [class.warn]="(form.get('title')?.value?.length ?? 0) > 80">
                        {{ form.get('title')?.value?.length ?? 0 }}/100
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="section-divider"></div>

              <!-- Étape 3 : Date -->
              <div class="form-section">
                <div class="section-num">03</div>
                <div class="section-content">
                  <h2>Quelle est la date ?</h2>
                  <p class="section-desc">La date est indicative — elle aide vos invités à planifier leur contribution.</p>
                  <div class="field">
                    <div class="date-input-wrap">
                      <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M8 2v4M16 2v4M3 10h18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
                      <input
                        type="datetime-local"
                        formControlName="eventDate"
                        [class.invalid]="isInvalid('eventDate')"
                        [min]="minDate"
                      />
                    </div>
                    <div class="field-footer">
                      <span class="field-err" *ngIf="isInvalid('eventDate')">La date est obligatoire.</span>
                      <span class="date-hint">Date et heure de l'événement</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="section-divider"></div>

              <!-- Étape 4 : Description -->
              <div class="form-section">
                <div class="section-num">04</div>
                <div class="section-content">
                  <h2>Un message pour vos invités <span class="optional">— optionnel</span></h2>
                  <p class="section-desc">Décrivez l'ambiance, les attentes ou tout ce qui vous semble important.</p>
                  <div class="field">
                    <textarea
                      formControlName="description"
                      rows="4"
                      placeholder="Ex : Nous célébrons 10 ans d'amour ! Votre présence est le plus beau des cadeaux, mais si vous souhaitez contribuer..."
                      maxlength="500"
                    ></textarea>
                    <div class="field-footer justify-end">
                      <span class="char-count" [class.warn]="(form.get('description')?.value?.length ?? 0) > 400">
                        {{ form.get('description')?.value?.length ?? 0 }}/500
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Alerte erreur -->
              <div class="alert-error" *ngIf="errorMessage()">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5"/><path d="M10 6v5M10 13.5v.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
                {{ errorMessage() }}
              </div>

              <!-- Submit -->
              <div class="form-footer">
                <a routerLink="/app/events" class="btn-ghost">Annuler</a>
                <button type="submit" class="btn-submit" [disabled]="loading()">
                  <span *ngIf="!loading()">
                    Créer mon événement
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M4 10h12M10 4l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                  </span>
                  <span *ngIf="loading()" class="loading-dots">
                    <span></span><span></span><span></span>
                  </span>
                </button>
              </div>

            </form>
          </div>

          <!-- COLONNE DROITE : Aperçu + Tips -->
          <div class="side-col">

            <!-- Aperçu live -->
            <div class="preview-card">
              <div class="preview-label">Aperçu</div>
              <div class="preview-body">
                <div class="preview-emoji">{{ previewEmoji() }}</div>
                <div class="preview-title">{{ previewTitle() }}</div>
                <div class="preview-date" *ngIf="previewDate()">
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><rect x="2" y="4" width="16" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M6 2v4M14 2v4M2 9h16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                  {{ previewDate() }}
                </div>
                <div class="preview-desc" *ngIf="form.get('description')?.value?.trim()">
                  {{ form.get('description')?.value | slice:0:100 }}{{ (form.get('description')?.value?.length ?? 0) > 100 ? '…' : '' }}
                </div>
                <div class="preview-wishlist">
                  <div class="preview-wishlist-icon">🎁</div>
                  <div class="preview-wishlist-text">
                    <div class="pwt-title">Wishlist créée automatiquement</div>
                    <div class="pwt-sub">Ajoutez des produits après la création</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tips -->
            <div class="tips-card">
              <div class="tips-title">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="#FFD700" stroke-width="1.5"/><path d="M10 6v5M10 13.5v.5" stroke="#FFD700" stroke-width="1.8" stroke-linecap="round"/></svg>
                Bons à savoir
              </div>
              <div class="tip-item">
                <div class="tip-dot"></div>
                <span>Une <strong>wishlist vide</strong> est créée automatiquement. Ajoutez vos produits depuis le catalogue juste après.</span>
              </div>
              <div class="tip-item">
                <div class="tip-dot"></div>
                <span>Un <strong>lien de partage unique</strong> est généré pour que vos invités accèdent à votre wishlist.</span>
              </div>
              <div class="tip-item">
                <div class="tip-dot"></div>
                <span>Vous pouvez <strong>modifier</strong> le titre, la date et la description à tout moment.</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page-wrap { background: #f9fafb; min-height: calc(100vh - 64px); }

    /* HERO */
    .page-hero { background: #000; padding: 40px 0 48px; }
    .page-hero-inner { max-width: 1280px; margin: 0 auto; padding: 0 24px; display: flex; flex-direction: column; gap: 20px; }
    .back-link { display: inline-flex; align-items: center; gap: 6px; color: rgba(255,255,255,0.5); font-size: 0.85rem; font-weight: 600; text-decoration: none; transition: color 0.2s; }
    .back-link:hover { color: white; }
    .hero-eyebrow { color: #FFD700; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 10px; }
    h1 { font-size: clamp(2rem, 4vw, 2.8rem); font-weight: 900; color: white; margin: 0 0 12px; letter-spacing: -0.03em; }
    .hero-text p { color: rgba(255,255,255,0.5); margin: 0; font-size: 0.95rem; line-height: 1.7; max-width: 560px; }

    /* BODY */
    .page-body { max-width: 1280px; margin: 0 auto; padding: 40px 24px; }
    .layout { display: grid; grid-template-columns: 1fr 360px; gap: 32px; align-items: start; }

    /* FORM COL */
    .form-col { background: white; border: 1.5px solid #f3f4f6; border-radius: 24px; overflow: hidden; }

    .form-section { display: grid; grid-template-columns: 48px 1fr; gap: 24px; padding: 32px; }
    .section-num { font-size: 2rem; font-weight: 900; color: #f3f4f6; font-family: monospace; line-height: 1; padding-top: 4px; }
    .section-content { display: flex; flex-direction: column; gap: 14px; }
    .section-content h2 { font-size: 1.1rem; font-weight: 800; color: #111; margin: 0; }
    .section-desc { color: #9ca3af; font-size: 0.85rem; line-height: 1.6; margin: 0; }
    .optional { color: #d1d5db; font-weight: 500; font-size: 0.85rem; }
    .section-divider { height: 1px; background: #f9fafb; margin: 0; }

    /* Type grid */
    .type-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .type-btn {
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      padding: 14px 10px; border: 1.5px solid #e5e7eb; border-radius: 14px;
      background: white; cursor: pointer; transition: 0.15s; font: inherit;
    }
    .type-btn:hover { border-color: #111; background: #f9fafb; }
    .type-btn.selected { border-color: #111; background: #111; }
    .type-btn.selected .type-label { color: white; }
    .type-emoji { font-size: 1.5rem; }
    .type-label { font-size: 0.78rem; font-weight: 700; color: #374151; }

    /* Fields */
    .field { display: flex; flex-direction: column; gap: 6px; }
    .input-wrap { position: relative; }
    .input-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #9ca3af; pointer-events: none; }
    input[type=text], input[type=datetime-local] {
      width: 100%; box-sizing: border-box; padding: 13px 16px 13px 44px;
      border: 1.5px solid #e5e7eb; border-radius: 12px; font: inherit;
      font-size: 0.95rem; background: #f9fafb; outline: 0; transition: 0.2s;
    }
    .date-input-wrap { position: relative; }
    .date-input-wrap .input-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #9ca3af; pointer-events: none; z-index: 1; }
    .date-input-wrap input[type=datetime-local] {
      padding-left: 44px; padding-right: 12px;
      min-width: 0; width: 100%;
      /* Assure que date + heure sont visibles */
      font-variant-numeric: tabular-nums;
    }
    .date-hint { font-size: 0.75rem; color: #9ca3af; }
    input:focus { border-color: #111; background: white; }
    input.invalid { border-color: #ef4444; }
    textarea {
      width: 100%; box-sizing: border-box; padding: 13px 16px;
      border: 1.5px solid #e5e7eb; border-radius: 12px; font: inherit;
      font-size: 0.92rem; background: #f9fafb; outline: 0; resize: vertical; transition: 0.2s;
    }
    textarea:focus { border-color: #111; background: white; }
    .field-footer { display: flex; align-items: center; justify-content: space-between; }
    .justify-end { justify-content: flex-end; }
    .field-err { font-size: 0.78rem; color: #ef4444; }
    .char-count { font-size: 0.75rem; color: #9ca3af; }
    .char-count.warn { color: #f59e0b; }

    /* Alert */
    .alert-error { display: flex; align-items: flex-start; gap: 10px; padding: 14px 32px; background: #fef2f2; border-top: 1px solid #fecaca; color: #991b1b; font-size: 0.88rem; }

    /* Footer */
    .form-footer {
      display: flex; align-items: center; justify-content: flex-end; gap: 12px;
      padding: 24px 32px; border-top: 1px solid #f3f4f6;
    }
    .btn-ghost { color: #6b7280; text-decoration: none; font-weight: 600; padding: 12px 20px; border: 1.5px solid #e5e7eb; border-radius: 12px; font-size: 0.9rem; transition: 0.2s; }
    .btn-ghost:hover { border-color: #111; color: #111; }
    .btn-submit {
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      padding: 13px 28px; border: 0; border-radius: 12px;
      background: #FFD700; color: #000; font: inherit; font-size: 0.95rem; font-weight: 800;
      cursor: pointer; transition: 0.2s; min-width: 200px;
    }
    .btn-submit:hover:not(:disabled) { background: #FFC000; transform: translateY(-1px); }
    .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
    .loading-dots { display: flex; align-items: center; gap: 5px; }
    .loading-dots span { width: 6px; height: 6px; border-radius: 50%; background: #000; animation: bounce 1.2s infinite; }
    .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
    .loading-dots span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes bounce { 0%,80%,100%{transform:scale(0.7);opacity:0.5}40%{transform:scale(1.2);opacity:1} }

    /* SIDE COL */
    .side-col { display: flex; flex-direction: column; gap: 16px; position: sticky; top: 88px; }

    .preview-card { background: #000; border-radius: 20px; padding: 24px; display: flex; flex-direction: column; gap: 16px; }
    .preview-label { font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.3); }
    .preview-body { display: flex; flex-direction: column; gap: 12px; }
    .preview-emoji { font-size: 2.5rem; }
    .preview-title { font-size: 1.1rem; font-weight: 900; color: white; line-height: 1.2; min-height: 28px; }
    .preview-title:empty::after { content: "Nom de l'événement"; color: rgba(255,255,255,0.2); font-weight: 400; font-size: 0.95rem; }
    .preview-date { display: flex; align-items: center; gap: 6px; color: rgba(255,255,255,0.45); font-size: 0.82rem; }
    .preview-desc { color: rgba(255,255,255,0.4); font-size: 0.82rem; line-height: 1.5; }
    .preview-wishlist { display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 12px; }
    .preview-wishlist-icon { font-size: 1.2rem; }
    .pwt-title { color: white; font-size: 0.82rem; font-weight: 700; }
    .pwt-sub { color: rgba(255,255,255,0.35); font-size: 0.72rem; margin-top: 2px; }

    .tips-card { background: white; border: 1.5px solid #f3f4f6; border-radius: 20px; padding: 20px; display: flex; flex-direction: column; gap: 14px; }
    .tips-title { display: flex; align-items: center; gap: 8px; font-size: 0.82rem; font-weight: 800; color: #374151; text-transform: uppercase; letter-spacing: 0.06em; }
    .tip-item { display: flex; align-items: flex-start; gap: 10px; font-size: 0.85rem; color: #6b7280; line-height: 1.6; }
    .tip-dot { width: 6px; height: 6px; border-radius: 50%; background: #FFD700; flex-shrink: 0; margin-top: 7px; }
    .tip-item strong { color: #111; }

    @media (max-width: 900px) {
      .layout { grid-template-columns: 1fr; }
      .side-col { position: static; }
    }
    @media (max-width: 600px) {
      .form-section { grid-template-columns: 1fr; }
      .section-num { display: none; }
      .type-grid { grid-template-columns: repeat(3, 1fr); }
    }
  `],
})
export class CreateUserEventPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly eventsService = inject(EventsService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly selectedType = signal('');

  readonly eventTypes = EVENT_TYPES;

  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(100)]],
    eventDate: ['', [Validators.required]],
    description: ['', [Validators.maxLength(500)]],
  });

  // Date min = aujourd'hui
  readonly minDate = new Date().toISOString().slice(0, 16);

  selectType(t: typeof EVENT_TYPES[0]): void {
    this.selectedType.set(t.value);
    if (!t.value) return; // "Autre" → on ne touche pas au titre

    const current = this.form.get('title')?.value ?? '';
    const newPrefix = t.value + ' de ';

    // Trouver si le titre commence par un préfixe connu (ex: "Anniversaire de ")
    const matchedPrefix = EVENT_TYPES
      .filter(e => e.value)
      .map(e => e.value + ' de ')
      .find(p => current.startsWith(p));

    if (matchedPrefix) {
      // Remplacer seulement le préfixe, garder la suite (ex: "Marie")
      const suffix = current.slice(matchedPrefix.length);
      this.form.patchValue({ title: newPrefix + suffix });
    } else if (!current.trim()) {
      // Titre vide → juste le préfixe
      this.form.patchValue({ title: newPrefix });
    }
    // Titre personnalisé sans préfixe connu → on ne touche pas

    setTimeout(() => {
      const input = document.querySelector('input[formControlName="title"]') as HTMLInputElement;
      if (input) { input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
    }, 50);
  }

  previewEmoji(): string {
    const t = EVENT_TYPES.find(e => e.value === this.selectedType());
    return t?.emoji ?? '✨';
  }

  previewTitle(): string {
    return this.form.get('title')?.value?.trim() ?? '';
  }

  previewDate(): string {
    const raw = this.form.get('eventDate')?.value;
    if (!raw) return '';
    const d = new Date(raw);
    const date = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return `${date} à ${time}`;
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c.touched);
  }

  submit(): void {
    if (this.form.invalid || this.loading()) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.errorMessage.set('');
    const raw = this.form.getRawValue();

    // Préfixer le titre avec le type si sélectionné et non déjà présent
    let title = raw.title?.trim() ?? '';

    this.eventsService.createEvent({
      title,
      eventDate: new Date(raw.eventDate ?? '').toISOString(),
      description: raw.description?.trim() ?? '',
    }).subscribe({
      next: (created) => {
        this.loading.set(false);
        this.toast.success('Événement créé avec succès ! Ajoutez maintenant vos produits.');
        this.router.navigate(['/app/events', created.id]);
      },
      error: (err: any) => {
        this.loading.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Impossible de créer l\'événement.');
      },
    });
  }
}
