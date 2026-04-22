import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
  durationMs: number;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  readonly toasts = signal<ToastItem[]>([]);
  private nextId = 1;

  show(type: ToastType, message: string, durationMs = 3500): void {
    const toast: ToastItem = {
      id: this.nextId++,
      type,
      message,
      durationMs,
    };

    this.toasts.update((items) => [...items, toast]);

    if (durationMs > 0) {
      window.setTimeout(() => {
        this.remove(toast.id);
      }, durationMs);
    }
  }

  success(message: string, durationMs?: number): void {
    this.show('success', message, durationMs);
  }

  error(message: string, durationMs?: number): void {
    this.show('error', message, durationMs);
  }

  info(message: string, durationMs?: number): void {
    this.show('info', message, durationMs);
  }

  warning(message: string, durationMs?: number): void {
    this.show('warning', message, durationMs);
  }

  remove(id: number): void {
    this.toasts.update((items) => items.filter((item) => item.id !== id));
  }

  clear(): void {
    this.toasts.set([]);
  }
}