import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { registerLocaleData } from '@angular/common'; // 🔑 Importación necesaria
import localeEsCl from '@angular/common/locales/es-CL'; // 🔑 Datos del locale 'es-CL'

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { defineCustomElements } from '@ionic/core/loader';
import { environment } from './environments/environment'; // Si tienes entornos definidos

// 🔑 CORRECCIÓN: Registrar los datos de localización para 'es-CL'
registerLocaleData(localeEsCl, 'es-CL');


bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
  ],
});

defineCustomElements(window, {
  resourcesUrl: '/assets/ionicons/', // Ajusta la ruta si tus iconos están en otro lugar
});