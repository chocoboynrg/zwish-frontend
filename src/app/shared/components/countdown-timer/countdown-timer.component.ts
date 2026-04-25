import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, OnDestroy, signal, computed } from '@angular/core';

@Component({
  selector: 'app-countdown-timer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="countdown" [ngClass]="urgencyClass()" *ngIf="visible()">
      <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5"/>
        <path d="M10 6v4l3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      </svg>
      <span>{{ label() }}</span>
    </div>
    <div class="expired" *ngIf="!visible() && showExpired">
      <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5"/>
        <path d="M7 13l6-6M13 13L7 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      </svg>
      Expiré
    </div>
  `,
  styles: [`
    .countdown { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 999px; font-size: 0.72rem; font-weight: 800; }
    .urgent { background: #fee2e2; color: #991b1b; animation: blink 1s infinite; }
    .warning { background: #fef3c7; color: #92400e; }
    .normal { background: #f0fdf4; color: #166534; }
    @keyframes blink { 0%,100%{opacity:1}50%{opacity:0.6} }
    .expired { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 999px; font-size: 0.72rem; font-weight: 800; background: #f3f4f6; color: #9ca3af; }
  `],
})
export class CountdownTimerComponent implements OnInit, OnDestroy {
  @Input({ required: true }) expiresAt!: string | null;
  @Input() showExpired = false;

  private intervalId: ReturnType<typeof setInterval> | null = null;
  private remaining = signal(0);

  readonly visible = computed(() => this.remaining() > 0);

  readonly urgencyClass = computed(() => {
    const s = this.remaining();
    if (s <= 60) return 'countdown urgent';       // < 1 min
    if (s <= 300) return 'countdown warning';     // < 5 min
    return 'countdown normal';
  });

  readonly label = computed(() => {
    const s = this.remaining();
    if (s <= 0) return '';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    if (m >= 60) {
      const h = Math.floor(m / 60);
      return `${h}h${m % 60 > 0 ? String(m % 60).padStart(2, '0') + 'min' : ''}`;
    }
    if (m > 0) return `${m}min ${String(sec).padStart(2, '0')}s`;
    return `${sec}s`;
  });

  ngOnInit(): void {
    this.tick();
    this.intervalId = setInterval(() => this.tick(), 1000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  private tick(): void {
    if (!this.expiresAt) { this.remaining.set(0); return; }
    const diff = Math.max(0, Math.floor((new Date(this.expiresAt).getTime() - Date.now()) / 1000));
    this.remaining.set(diff);
  }
}