import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EventsService } from '../services/events.service';
import { CreateEventPayload } from '../models/event.model';
import { ToastService } from '../../../core/services/toast.service';

type AdminEventItem = {
  id: number;
  title: string;
  eventDate: string;
  description: string | null;
  organizer?: {
    id: number;
    name: string;
    email?: string | null;
  } | null;
  shareToken?: string | null;
};

@Component({
  selector: 'app-events-admin-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Événements</h1>
          <p>Création et gestion des événements</p>
        </div>

        <button type="button" (click)="loadEvents()">Actualiser</button>
      </div>

      <section class="card">
        <h2>Créer un événement</h2>

        <form [formGroup]="eventForm" (ngSubmit)="submitEvent()">
          <div class="form-group">
            <label>Titre</label>
            <input type="text" formControlName="title" />
          </div>

          <div class="form-group">
            <label>Date événement</label>
            <input type="datetime-local" formControlName="eventDate" />
          </div>

          <div class="form-group">
            <label>Description</label>
            <textarea rows="3" formControlName="description"></textarea>
          </div>

          <button type="submit" [disabled]="createLoading">
            {{ createLoading ? 'Création...' : 'Créer l’événement' }}
          </button>
        </form>

        <p class="success" *ngIf="createSuccess">{{ createSuccess }}</p>
        <p class="error" *ngIf="createError">{{ createError }}</p>
      </section>

      <p class="error" *ngIf="errorMessage()">{{ errorMessage() }}</p>
      <p *ngIf="loading()">Chargement...</p>

      <section class="card" *ngIf="!loading()">
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Titre</th>
                <th>Date</th>
                <th>Organisateur</th>
                <th>Description</th>
                <th>Share token</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let event of events()">
                <td>{{ event.id }}</td>
                <td>{{ event.title }}</td>
                <td>{{ event.eventDate | date:'medium' }}</td>
                <td>{{ event.organizer?.name || '—' }}</td>
                <td>{{ event.description || '—' }}</td>
                <td>{{ event.shareToken || '—' }}</td>
                <td>
                  <a [routerLink]="['/admin/events', event.id]">Voir détail</a>
                </td>
              </tr>

              <tr *ngIf="events().length === 0">
                <td colspan="7">Aucun événement</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      .page {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
      }

      .page-header h1 {
        margin: 0 0 6px;
      }

      .page-header p {
        margin: 0;
        color: #6b7280;
      }

      .card {
        background: white;
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-bottom: 14px;
      }

      input,
      textarea,
      button {
        font: inherit;
      }

      input,
      textarea {
        width: 100%;
        box-sizing: border-box;
        border: 1px solid #d1d5db;
        border-radius: 10px;
        padding: 10px 12px;
      }

      button {
        border: 0;
        border-radius: 10px;
        padding: 10px 14px;
        background: #1d4ed8;
        color: white;
        cursor: pointer;
      }

      button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }

      .table-wrapper {
        overflow-x: auto;
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      th,
      td {
        padding: 12px 10px;
        border-bottom: 1px solid #e5e7eb;
        text-align: left;
        vertical-align: top;
      }

      th {
        color: #6b7280;
        font-size: 13px;
      }

      a {
        color: #1d4ed8;
        text-decoration: none;
        font-weight: 600;
      }

      .success {
        color: #15803d;
      }

      .error {
        color: #b91c1c;
      }
    `,
  ],
})
export class EventsAdminPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly eventsService = inject(EventsService);
  private readonly toastService = inject(ToastService);

  readonly events = signal<AdminEventItem[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  createLoading = false;
  createSuccess = '';
  createError = '';

  readonly eventForm = this.fb.group({
    title: ['', [Validators.required]],
    eventDate: ['', [Validators.required]],
    description: [''],
  });

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.eventsService.getEvents().subscribe({
      next: (events) => {
        const normalized: AdminEventItem[] = events.map((event) => ({
          id: event.id,
          title: event.title,
          eventDate: event.eventDate,
          description: event.description ?? null,
          organizer: event.organizer ?? null,
          shareToken: event.shareToken ?? null,
        }));

        this.events.set(normalized);
        this.loading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(
          error?.error?.message || 'Impossible de charger les événements',
        );
        this.loading.set(false);
      },
    });
  }

  submitEvent(): void {
    if (this.eventForm.invalid || this.createLoading) {
      this.eventForm.markAllAsTouched();
      return;
    }

    this.createLoading = true;
    this.createSuccess = '';
    this.createError = '';

    const raw = this.eventForm.getRawValue();

    const payload: CreateEventPayload = {
      title: raw.title ?? '',
      eventDate: this.toIsoDate(raw.eventDate ?? ''),
      description: raw.description ?? '',
    };

    this.eventsService.createEvent(payload).subscribe({
      next: () => {
        this.createLoading = false;
        this.createSuccess = 'Événement créé avec succès';
        this.toastService.success('Événement créé.');
        this.eventForm.reset({
          title: '',
          eventDate: '',
          description: '',
        });
        this.loadEvents();
      },
      error: (error) => {
        this.createLoading = false;
        this.createError =
          error?.error?.message || 'Impossible de créer l’événement';
      },
    });
  }

  private toIsoDate(value: string): string {
    const date = new Date(value);
    return date.toISOString();
  }
}
