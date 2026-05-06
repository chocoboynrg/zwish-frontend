import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ProductRequestsService } from '../services/product-requests.service';
import { ProductRequest, ProductRequestReviewer } from '../models/product-request.model';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

interface AdminStats {
  admin: ProductRequestReviewer;
  activeRequests: ProductRequest[];
  activeCount: number;
  processedCount: number;
  approvedCount: number;
  rejectedCount: number;
  rejectionRate: number;
  avgProcessingMs: number | null;
  lastActivityAt: string | null;
}

@Component({
  selector: 'app-product-requests-assignment-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <div class="breadcrumb">
            <a routerLink="/admin/product-requests" class="breadcrumb-link">Demandes produit</a>
            <span class="breadcrumb-sep">/</span>
            <span>Suivi des affectations</span>
          </div>
          <h1>Suivi des affectations</h1>
          <p class="subtitle">Vue d'ensemble de l'activité de traitement des demandes</p>
        </div>
        <button class="btn-refresh" (click)="loadData()" [disabled]="loading()">
          <svg width="15" height="15" viewBox="0 0 20 20" fill="none" [class.spinning]="loading()">
            <path d="M4 10a6 6 0 016-6 6 6 0 015.66 4M16 4v4h-4M16 10a6 6 0 01-6 6 6 6 0 01-5.66-4M4 16v-4h4"
              stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
          Actualiser
        </button>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          Chargement des données...
        </div>
      }

      @if (loadError()) {
        <div class="error-state">{{ loadError() }}</div>
      }

      @if (!loading() && !loadError()) {

        <!-- KPI Strip -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-icon kpi-total">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M12 3H6a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V7l-3-4z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12 3v4h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="kpi-body">
              <span class="kpi-value">{{ totalCount() }}</span>
              <span class="kpi-label">Total demandes</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon kpi-pending">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.6"/>
                <path d="M10 6v4l2.5 2.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="kpi-body">
              <span class="kpi-value">{{ submittedCount() }}</span>
              <span class="kpi-label">En attente</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon kpi-review">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" stroke-width="1.6"/>
                <path d="M13 13l4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="kpi-body">
              <span class="kpi-value">{{ underReviewCount() }}</span>
              <span class="kpi-label">En cours d'examen</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon kpi-approved">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.6"/>
                <path d="M6.5 10l2.5 2.5 5-5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="kpi-body">
              <span class="kpi-value">{{ approvedCount() }}</span>
              <span class="kpi-label">Approuvées / Publiées</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon kpi-rejected">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.6"/>
                <path d="M7 7l6 6M13 7l-6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="kpi-body">
              <span class="kpi-value">{{ rejectedCount() }}</span>
              <span class="kpi-label">Rejetées</span>
            </div>
            @if (globalRejectionRate() !== null) {
              <span class="kpi-rate kpi-rate-bad">{{ globalRejectionRate() | number:'1.0-0' }}% rejet</span>
            }
          </div>

          <div class="kpi-card">
            <div class="kpi-icon kpi-time">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.6"/>
                <path d="M10 5v5l3 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="kpi-body">
              <span class="kpi-value">{{ formatDuration(globalAvgProcessingMs()) }}</span>
              <span class="kpi-label">Temps moyen de traitement</span>
            </div>
          </div>
        </div>

        <!-- Admin performance table -->
        <div class="section">
          <div class="section-header">
            <h2 class="section-title">Performance par administrateur</h2>
            <span class="section-count">{{ adminStats().length }} admin{{ adminStats().length !== 1 ? 's' : '' }}</span>
          </div>

          @if (adminStats().length === 0) {
            <div class="empty-table">Aucun administrateur trouvé.</div>
          } @else {
            <div class="table-wrap">
              <table class="perf-table">
                <thead>
                  <tr>
                    <th>Administrateur</th>
                    <th class="col-num">En cours</th>
                    <th class="col-num">Traités</th>
                    <th class="col-num">Approuvés</th>
                    <th class="col-num">Rejetés</th>
                    <th class="col-num">Taux rejet</th>
                    <th class="col-num">Temps moyen</th>
                    <th>Dernière activité</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  @for (s of adminStats(); track s.admin.id) {
                    <tr
                      class="perf-row"
                      [class.expanded]="selectedAdminId() === s.admin.id"
                      (click)="toggleAdmin(s.admin.id)"
                    >
                      <td class="td-admin">
                        <div class="admin-cell">
                          <div class="row-avatar">{{ getInitials(s.admin.name) }}</div>
                          <div class="row-info">
                            <span class="row-name">{{ s.admin.name }}</span>
                            <span class="row-role" [class.super]="s.admin.platformRole === 'SUPER_ADMIN'">
                              {{ s.admin.platformRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin' }}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td class="col-num">
                        @if (s.activeCount > 0) {
                          <span class="badge-active">{{ s.activeCount }}</span>
                        } @else {
                          <span class="zero">0</span>
                        }
                      </td>
                      <td class="col-num fw">{{ s.processedCount }}</td>
                      <td class="col-num">
                        <span class="text-approved">{{ s.approvedCount }}</span>
                      </td>
                      <td class="col-num">
                        <span class="text-rejected">{{ s.rejectedCount }}</span>
                      </td>
                      <td class="col-num">
                        @if (s.processedCount > 0) {
                          <span class="rate-pill" [class.rate-high]="s.rejectionRate > 50">
                            {{ s.rejectionRate | number:'1.0-0' }}%
                          </span>
                        } @else {
                          <span class="zero">—</span>
                        }
                      </td>
                      <td class="col-num">{{ formatDuration(s.avgProcessingMs) }}</td>
                      <td class="td-date">
                        @if (s.lastActivityAt) {
                          {{ s.lastActivityAt | date:'dd/MM/yy HH:mm' }}
                        } @else {
                          <span class="zero">—</span>
                        }
                      </td>
                      <td class="td-chevron">
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none"
                          [style.transform]="selectedAdminId() === s.admin.id ? 'rotate(180deg)' : 'rotate(0)'"
                          style="transition:transform 0.2s">
                          <path d="M5 8l5 5 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </td>
                    </tr>

                    <!-- Expanded requests panel -->
                    @if (selectedAdminId() === s.admin.id) {
                      <tr class="expanded-row">
                        <td colspan="9">
                          <div class="expanded-panel">
                            @if (s.activeCount === 0) {
                              <div class="expanded-empty">Aucune demande en cours pour cet administrateur.</div>
                            } @else {
                              <div class="expanded-title">Demandes en cours ({{ s.activeCount }})</div>
                              <div class="req-list">
                                @for (req of s.activeRequests; track req.id) {
                                  <div class="req-item">
                                    <div class="req-main">
                                      <span class="req-name">{{ req.name }}</span>
                                      <div class="req-tags">
                                        <span class="req-tag">{{ req.event?.title }}</span>
                                        <span class="req-tag">{{ req.wishlist?.title }}</span>
                                        <span class="req-age">Prise en charge {{ req.reviewedAt | date:'dd/MM/yy' }}</span>
                                      </div>
                                    </div>
                                    @if (isSuperAdmin()) {
                                      <button class="btn-reassign" (click)="openReassign(req); $event.stopPropagation()">
                                        Réaffecter
                                      </button>
                                    }
                                  </div>
                                }
                              </div>
                            }
                          </div>
                        </td>
                      </tr>
                    }
                  }
                </tbody>
              </table>
            </div>
          }
        </div>

        <!-- Non assigné section -->
        @if (unassignedRequests().length > 0) {
          <div class="section">
            <div class="section-header">
              <h2 class="section-title unassigned-title">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style="flex-shrink:0">
                  <path d="M10 4v8M10 14v.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                  <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.6"/>
                </svg>
                Demandes non assignées
              </h2>
              <span class="section-count warn">{{ unassignedRequests().length }}</span>
            </div>
            <div class="unassigned-list">
              @for (req of unassignedRequests(); track req.id) {
                <div class="unassigned-item">
                  <div class="req-main">
                    <span class="req-name">{{ req.name }}</span>
                    <div class="req-tags">
                      <span class="req-tag">{{ req.event?.title }}</span>
                      <span class="req-tag">{{ req.wishlist?.title }}</span>
                      <span class="req-age">Soumis {{ req.createdAt | date:'dd/MM/yy' }}</span>
                    </div>
                  </div>
                  @if (isSuperAdmin()) {
                    <button class="btn-assign" (click)="openReassign(req)">
                      Assigner
                    </button>
                  }
                </div>
              }
            </div>
          </div>
        }

      }

      <!-- Reassign / Assign modal -->
      @if (reassignTarget()) {
        <div class="modal-backdrop" (click)="closeReassign()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="modal-title-group">
                <span class="modal-title">{{ reassignTarget()!.reviewedBy ? 'Réaffecter la demande' : 'Assigner la demande' }}</span>
                <span class="modal-subtitle">{{ reassignTarget()!.name }}</span>
              </div>
              <button class="modal-close" (click)="closeReassign()">✕</button>
            </div>
            <div class="modal-body">
              @if (reassignTarget()!.reviewedBy) {
                <div class="current-assignee">
                  <span class="ca-label">Actuellement assigné à</span>
                  <div class="ca-admin">
                    <div class="opt-avatar sm">{{ getInitials(reassignTarget()!.reviewedBy!.name) }}</div>
                    <span>{{ reassignTarget()!.reviewedBy!.name }}</span>
                  </div>
                </div>
              }
              <label class="form-label">{{ reassignTarget()!.reviewedBy ? 'Nouvel administrateur' : 'Assigner à' }}</label>
              <div class="admin-options">
                @for (admin of adminsList(); track admin.id) {
                  @if (admin.id !== reassignTarget()!.reviewedBy?.id) {
                    <button
                      class="admin-option"
                      [class.selected]="reassignTo() === admin.id"
                      (click)="reassignTo.set(admin.id)"
                      [disabled]="reassignLoading()"
                    >
                      <div class="opt-avatar">{{ getInitials(admin.name) }}</div>
                      <div class="opt-info">
                        <span class="opt-name">{{ admin.name }}</span>
                        <span class="opt-role">{{ admin.platformRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin' }}</span>
                      </div>
                      @if (reassignTo() === admin.id) {
                        <svg class="opt-check" width="16" height="16" viewBox="0 0 20 20" fill="none">
                          <path d="M4 10l4 4 8-8" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      }
                    </button>
                  }
                }
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-cancel" (click)="closeReassign()" [disabled]="reassignLoading()">Annuler</button>
              <button class="btn-confirm" (click)="doReassign()" [disabled]="!reassignTo() || reassignLoading()">
                @if (reassignLoading()) { Traitement... } @else { Confirmer }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page {
      padding: 28px 32px;
      max-width: 1280px;
      margin: 0 auto;
    }
    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 28px;
    }
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.82rem;
      color: #94a3b8;
      margin-bottom: 6px;
    }
    .breadcrumb-link { color: #6366f1; text-decoration: none; }
    .breadcrumb-link:hover { text-decoration: underline; }
    .breadcrumb-sep { color: #cbd5e1; }
    h1 { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0 0 4px; }
    .subtitle { font-size: 0.88rem; color: #64748b; margin: 0; }
    .btn-refresh {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 9px 16px;
      border: 1.5px solid #e2e8f0;
      border-radius: 9px;
      background: white;
      color: #475569;
      font: inherit;
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
      transition: 0.15s;
    }
    .btn-refresh:hover:not(:disabled) { border-color: #6366f1; color: #6366f1; }
    .btn-refresh:disabled { opacity: 0.6; cursor: not-allowed; }
    .spinning { animation: spin 0.7s linear infinite; }

    .loading-state {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 64px;
      justify-content: center;
      color: #64748b;
      font-size: 0.92rem;
    }
    .spinner {
      width: 22px;
      height: 22px;
      border: 2.5px solid #e2e8f0;
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .error-state {
      padding: 16px 20px;
      background: #fef2f2;
      border: 1px solid #fca5a5;
      border-radius: 10px;
      color: #991b1b;
      font-size: 0.9rem;
    }

    /* KPI grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 14px;
      margin-bottom: 28px;
    }
    .kpi-card {
      background: white;
      border: 1.5px solid #e2e8f0;
      border-radius: 14px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      position: relative;
      overflow: hidden;
    }
    .kpi-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .kpi-total  { background: #f1f5f9; color: #475569; }
    .kpi-pending { background: #dbeafe; color: #1d4ed8; }
    .kpi-review  { background: #fef3c7; color: #92400e; }
    .kpi-approved { background: #dcfce7; color: #166534; }
    .kpi-rejected { background: #fee2e2; color: #991b1b; }
    .kpi-time    { background: #ede9fe; color: #6d28d9; }
    .kpi-body { display: flex; flex-direction: column; gap: 2px; }
    .kpi-value { font-size: 1.6rem; font-weight: 900; color: #0f172a; line-height: 1; }
    .kpi-label { font-size: 0.73rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
    .kpi-rate {
      position: absolute;
      top: 10px;
      right: 10px;
      font-size: 0.68rem;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 999px;
    }
    .kpi-rate-bad { background: #fee2e2; color: #991b1b; }

    /* Sections */
    .section { margin-bottom: 28px; }
    .section-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 14px;
    }
    .section-title {
      font-size: 1rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 7px;
    }
    .unassigned-title { color: #92400e; }
    .section-count {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 3px 9px;
      border-radius: 999px;
      background: #f1f5f9;
      color: #475569;
    }
    .section-count.warn { background: #fef3c7; color: #92400e; }

    /* Performance table */
    .table-wrap {
      background: white;
      border: 1.5px solid #e2e8f0;
      border-radius: 14px;
      overflow: hidden;
    }
    .perf-table {
      width: 100%;
      border-collapse: collapse;
    }
    .perf-table thead tr {
      background: #f8faff;
      border-bottom: 1.5px solid #e2e8f0;
    }
    .perf-table th {
      padding: 11px 16px;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      text-align: left;
      white-space: nowrap;
    }
    .perf-table th.col-num { text-align: center; }
    .perf-row {
      border-bottom: 1px solid #f1f5f9;
      cursor: pointer;
      transition: background 0.12s;
    }
    .perf-row:last-child { border-bottom: none; }
    .perf-row:hover { background: #f8faff; }
    .perf-row.expanded { background: #f0f1ff; }
    .perf-table td {
      padding: 13px 16px;
      font-size: 0.88rem;
      color: #334155;
      vertical-align: middle;
    }
    .col-num { text-align: center; }
    .td-date { font-size: 0.8rem; color: #64748b; white-space: nowrap; }
    .td-chevron { width: 32px; text-align: center; color: #94a3b8; }
    .admin-cell { display: flex; align-items: center; gap: 11px; }
    .row-avatar {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 0.82rem;
      flex-shrink: 0;
    }
    .row-info { display: flex; flex-direction: column; gap: 2px; }
    .row-name { font-size: 0.9rem; font-weight: 700; color: #0f172a; }
    .row-role {
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 1px 6px;
      border-radius: 999px;
      background: #e0e7ff;
      color: #4338ca;
      width: fit-content;
    }
    .row-role.super { background: #fef3c7; color: #92400e; }
    .badge-active {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 24px;
      height: 24px;
      padding: 0 6px;
      border-radius: 7px;
      background: #fef3c7;
      color: #92400e;
      font-size: 0.82rem;
      font-weight: 800;
    }
    .zero { color: #cbd5e1; font-size: 0.85rem; }
    .fw { font-weight: 700; }
    .text-approved { color: #166534; font-weight: 700; }
    .text-rejected { color: #991b1b; font-weight: 700; }
    .rate-pill {
      font-size: 0.78rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 999px;
      background: #dcfce7;
      color: #166534;
    }
    .rate-pill.rate-high { background: #fee2e2; color: #991b1b; }

    /* Expanded row panel */
    .expanded-row td { padding: 0; background: #f8faff; }
    .expanded-panel {
      padding: 16px 20px 20px 20px;
      border-top: 1.5px solid #e0e7ff;
    }
    .expanded-title {
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #6366f1;
      margin-bottom: 12px;
    }
    .expanded-empty { font-size: 0.88rem; color: #94a3b8; padding: 12px 0; }
    .req-list { display: flex; flex-direction: column; gap: 8px; }
    .req-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 12px 16px;
      background: white;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
    }
    .req-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
    .req-name { font-size: 0.9rem; font-weight: 700; color: #0f172a; }
    .req-tags { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .req-tag {
      font-size: 0.73rem;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 999px;
      background: #f1f5f9;
      color: #475569;
    }
    .req-age { font-size: 0.73rem; color: #94a3b8; }

    .btn-reassign {
      padding: 6px 14px;
      border: 1.5px solid #fde68a;
      border-radius: 7px;
      background: #fefce8;
      color: #92400e;
      font: inherit;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      transition: 0.12s;
      flex-shrink: 0;
    }
    .btn-reassign:hover { background: #fef3c7; border-color: #f59e0b; }

    /* Unassigned list */
    .unassigned-list {
      background: white;
      border: 1.5px dashed #fde68a;
      border-radius: 14px;
      overflow: hidden;
    }
    .unassigned-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 14px 20px;
      border-bottom: 1px solid #fef9c3;
    }
    .unassigned-item:last-child { border-bottom: none; }
    .btn-assign {
      padding: 7px 16px;
      border: none;
      border-radius: 8px;
      background: #6366f1;
      color: white;
      font: inherit;
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
      transition: 0.12s;
      flex-shrink: 0;
    }
    .btn-assign:hover { background: #4f46e5; }

    .empty-table {
      padding: 32px;
      text-align: center;
      color: #94a3b8;
      background: white;
      border: 1.5px solid #e2e8f0;
      border-radius: 14px;
      font-size: 0.9rem;
    }

    /* Modal */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15,23,42,0.45);
      backdrop-filter: blur(3px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
    }
    .modal {
      background: white;
      border-radius: 16px;
      width: 460px;
      max-width: calc(100vw - 32px);
      box-shadow: 0 20px 60px rgba(15,23,42,0.18);
      overflow: hidden;
    }
    .modal-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: 18px 20px;
      border-bottom: 1px solid #f1f5f9;
    }
    .modal-title-group { display: flex; flex-direction: column; gap: 2px; }
    .modal-title { font-size: 1rem; font-weight: 800; color: #0f172a; }
    .modal-subtitle { font-size: 0.82rem; color: #6366f1; font-weight: 600; }
    .modal-close {
      border: none; background: none; font-size: 1.1rem;
      color: #94a3b8; cursor: pointer; padding: 2px 7px; border-radius: 6px;
    }
    .modal-close:hover { background: #f1f5f9; }
    .modal-body { padding: 20px; display: flex; flex-direction: column; gap: 14px; }
    .current-assignee {
      padding: 10px 14px;
      background: #f8faff;
      border: 1.5px solid #e0e7ff;
      border-radius: 10px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .ca-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; }
    .ca-admin { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; font-weight: 700; color: #0f172a; }
    .form-label { font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
    .admin-options { display: flex; flex-direction: column; gap: 6px; max-height: 260px; overflow-y: auto; }
    .admin-option {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      background: white;
      cursor: pointer;
      transition: 0.12s;
      text-align: left;
      width: 100%;
    }
    .admin-option:hover:not(:disabled) { border-color: #a5b4fc; background: #f8faff; }
    .admin-option.selected { border-color: #6366f1; background: #f0f1ff; }
    .admin-option:disabled { opacity: 0.5; cursor: not-allowed; }
    .opt-avatar {
      width: 36px; height: 36px; border-radius: 9px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white; display: flex; align-items: center; justify-content: center;
      font-size: 0.8rem; font-weight: 800; flex-shrink: 0;
    }
    .opt-avatar.sm { width: 28px; height: 28px; font-size: 0.7rem; border-radius: 7px; }
    .opt-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
    .opt-name { font-size: 0.88rem; font-weight: 700; color: #0f172a; }
    .opt-role { font-size: 0.72rem; color: #94a3b8; font-weight: 600; }
    .opt-check { margin-left: auto; flex-shrink: 0; }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 14px 20px;
      border-top: 1px solid #f1f5f9;
    }
    .btn-cancel {
      padding: 9px 18px; border: 1.5px solid #e2e8f0; border-radius: 9px;
      background: white; color: #475569; font: inherit; font-size: 0.88rem; font-weight: 600;
      cursor: pointer; transition: 0.12s;
    }
    .btn-cancel:hover:not(:disabled) { border-color: #94a3b8; }
    .btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-confirm {
      padding: 9px 20px; border: none; border-radius: 9px;
      background: #6366f1; color: white; font: inherit;
      font-size: 0.88rem; font-weight: 700; cursor: pointer; transition: 0.15s;
    }
    .btn-confirm:hover:not(:disabled) { background: #4f46e5; }
    .btn-confirm:disabled { opacity: 0.5; cursor: not-allowed; }
  `],
})
export class ProductRequestsAssignmentPageComponent implements OnInit {
  private readonly service = inject(ProductRequestsService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly allRequests = signal<ProductRequest[]>([]);
  readonly adminsList = signal<ProductRequestReviewer[]>([]);
  readonly selectedAdminId = signal<number | null>(null);
  readonly reassignLoading = signal(false);
  readonly reassignTarget = signal<ProductRequest | null>(null);
  readonly reassignTo = signal<number | null>(null);

  readonly currentUser = this.authService.getCurrentUserSnapshot();
  readonly isSuperAdmin = computed(() => this.currentUser?.platformRole === 'SUPER_ADMIN');

  // Global KPIs
  readonly totalCount = computed(() => this.allRequests().length);
  readonly submittedCount = computed(() => this.allRequests().filter((r) => r.status === 'SUBMITTED').length);
  readonly underReviewCount = computed(() => this.allRequests().filter((r) => r.status === 'UNDER_REVIEW').length);
  readonly approvedCount = computed(() => this.allRequests().filter((r) => r.status === 'APPROVED' || r.status === 'PUBLISHED').length);
  readonly rejectedCount = computed(() => this.allRequests().filter((r) => r.status === 'REJECTED').length);

  readonly globalRejectionRate = computed(() => {
    const processed = this.approvedCount() + this.rejectedCount();
    return processed > 0 ? (this.rejectedCount() / processed) * 100 : null;
  });

  readonly globalAvgProcessingMs = computed(() => {
    const processed = this.allRequests().filter(
      (r) => (r.status === 'APPROVED' || r.status === 'REJECTED' || r.status === 'PUBLISHED') && r.reviewedAt,
    );
    if (processed.length === 0) return null;
    const total = processed.reduce((sum, r) => {
      return sum + (new Date(r.reviewedAt!).getTime() - new Date(r.createdAt).getTime());
    }, 0);
    return total / processed.length;
  });

  // Per-admin stats
  readonly adminStats = computed<AdminStats[]>(() => {
    const requests = this.allRequests();
    return this.adminsList().map((admin) => {
      const activeRequests = requests.filter(
        (r) => r.status === 'UNDER_REVIEW' && r.reviewedBy?.id === admin.id,
      );
      const processed = requests.filter(
        (r) =>
          (r.status === 'APPROVED' || r.status === 'REJECTED' || r.status === 'PUBLISHED') &&
          r.reviewedBy?.id === admin.id,
      );
      const approved = processed.filter((r) => r.status === 'APPROVED' || r.status === 'PUBLISHED').length;
      const rejected = processed.filter((r) => r.status === 'REJECTED').length;

      const withTime = processed.filter((r) => r.reviewedAt);
      const avgMs =
        withTime.length > 0
          ? withTime.reduce((s, r) => s + (new Date(r.reviewedAt!).getTime() - new Date(r.createdAt).getTime()), 0) / withTime.length
          : null;

      const allActivity = [...activeRequests, ...processed].filter((r) => r.reviewedAt);
      const lastActivityAt =
        allActivity.length > 0
          ? allActivity.sort((a, b) => new Date(b.reviewedAt!).getTime() - new Date(a.reviewedAt!).getTime())[0].reviewedAt
          : null;

      return {
        admin,
        activeRequests,
        activeCount: activeRequests.length,
        processedCount: processed.length,
        approvedCount: approved,
        rejectedCount: rejected,
        rejectionRate: processed.length > 0 ? (rejected / processed.length) * 100 : 0,
        avgProcessingMs: avgMs,
        lastActivityAt,
      };
    });
  });

  readonly unassignedRequests = computed(() =>
    this.allRequests().filter((r) => r.status === 'UNDER_REVIEW' && !r.reviewedBy),
  );

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.loadError.set(null);

    forkJoin([this.service.getAll(), this.service.getAdminsList()]).subscribe({
      next: ([requests, admins]) => {
        this.allRequests.set(requests);
        this.adminsList.set(admins);
        this.loading.set(false);
      },
      error: (err) => {
        this.loadError.set(err?.error?.message ?? 'Erreur lors du chargement');
        this.loading.set(false);
      },
    });
  }

  toggleAdmin(id: number): void {
    this.selectedAdminId.set(this.selectedAdminId() === id ? null : id);
  }

  openReassign(req: ProductRequest): void {
    this.reassignTarget.set(req);
    this.reassignTo.set(null);
  }

  closeReassign(): void {
    this.reassignTarget.set(null);
    this.reassignTo.set(null);
  }

  doReassign(): void {
    const target = this.reassignTarget();
    const adminId = this.reassignTo();
    if (!target || !adminId) return;

    this.reassignLoading.set(true);
    this.service.reassign(target.id, adminId).subscribe({
      next: () => {
        this.toast.show('success', 'Demande réaffectée avec succès');
        this.closeReassign();
        this.reassignLoading.set(false);
        this.loadData();
      },
      error: (err) => {
        this.toast.show('error', err?.error?.message ?? 'Erreur lors de la réaffectation');
        this.reassignLoading.set(false);
      },
    });
  }

  formatDuration(ms: number | null): string {
    if (ms === null) return '—';
    const totalHours = Math.floor(ms / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    if (days >= 1) return `${days}j ${hours}h`;
    if (totalHours >= 1) return `${totalHours}h`;
    const minutes = Math.floor(ms / (1000 * 60));
    return `${minutes}min`;
  }

  getInitials(name: string): string {
    return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  }
}
