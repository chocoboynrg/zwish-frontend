import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { GlobalLoaderComponent } from './shared/ui/global-loader.component';
import { ToastContainerComponent } from './shared/ui/toast-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, GlobalLoaderComponent, ToastContainerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('wishlist-admin');
}