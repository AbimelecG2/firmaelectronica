import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideFirebaseApp(() =>
      initializeApp({
        projectId: 'firmaelectronica-e478d',
        appId: '1:38702492309:web:66407cd306ebdba35e099c',
        storageBucket: 'firmaelectronica-e478d.firebasestorage.app',
        apiKey: 'AIzaSyDxARkBEI0_iaSnibxKXaZvTA3V7YHA6fI',
        authDomain: 'firmaelectronica-e478d.firebaseapp.com',
        messagingSenderId: '38702492309',
      })
    ),
    provideFirestore(() => getFirestore()),
  ],
};
