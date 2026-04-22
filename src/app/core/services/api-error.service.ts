import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ApiErrorService {
  getUserMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'Une erreur technique est survenue.';
    }

    if (error.status === 0) {
      return 'Impossible de joindre le serveur.';
    }

    if (error.status === 401) {
      return 'Votre session a expiré. Veuillez vous reconnecter.';
    }

    if (error.status === 403) {
      return 'Vous n\'avez pas les droits pour effectuer cette action.';
    }

    if (error.status === 404) {
      return 'Ressource introuvable.';
    }

    // ✅ 429 géré explicitement — ne jamais afficher le message brut du throttler
    if (error.status === 429) {
      return 'Trop de requêtes. Veuillez patienter quelques instants.';
    }

    if (error.status >= 500) {
      return 'Erreur serveur. Veuillez réessayer plus tard.';
    }

    const payload = error.error;

    if (!payload) {
      return 'Une erreur inattendue est survenue.';
    }

    if (typeof payload === 'string') {
      return payload;
    }

    if (Array.isArray(payload.message)) {
      return payload.message.join(', ');
    }

    if (typeof payload.message === 'string') {
      return payload.message;
    }

    if (typeof payload.error === 'string') {
      return payload.error;
    }

    return 'Une erreur inattendue est survenue.';
  }
}