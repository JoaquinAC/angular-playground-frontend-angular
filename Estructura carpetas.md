# Estructura de migración exacta (didáctica, con árbol)

Este documento define la **ubicación destino exacta de cada archivo actual** dentro de `src`, en formato visual tipo árbol para que sea más fácil ubicar todo.

## 1) Árbol destino completo (`src`)

```text
src/
├── app/
│   ├── app-routing.module.ts
│   ├── app.component.html
│   ├── app.component.scss
│   ├── app.component.spec.ts
│   ├── app.component.ts
│   ├── app.module.ts
│   ├── core/
│   │   ├── auth/
│   │   │   └── auth.service.ts
│   │   ├── core.module.ts
│   │   ├── models/
│   │   │   ├── auth/
│   │   │   │   ├── auth.models.ts
│   │   │   │   └── role.utils.ts
│   │   │   └── users/
│   │   │       └── users.models.ts
│   │   └── storage/
│   │       └── local-storage.service.ts
│   ├── features/
│   │   ├── api/
│   │   │   ├── api-section-routing.module.ts
│   │   │   ├── api-section.module.ts
│   │   │   ├── data/
│   │   │   │   ├── models/
│   │   │   │   │   ├── create-user-request.dto.ts
│   │   │   │   │   └── user-response.dto.ts
│   │   │   │   └── services/
│   │   │   │       └── user.service.ts
│   │   │   └── pages/
│   │   │       └── api/
│   │   │           ├── api-section.component.html
│   │   │           ├── api-section.component.scss
│   │   │           └── api-section.component.ts
│   │   ├── auth/
│   │   │   ├── auth-routing.module.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── components/
│   │   │   │   ├── login/
│   │   │   │   │   ├── login.component.html
│   │   │   │   │   ├── login.component.scss
│   │   │   │   │   ├── login.component.spec.ts
│   │   │   │   │   └── login.component.ts
│   │   │   │   └── modal-register/
│   │   │   │       ├── modal-register.component.html
│   │   │   │       ├── modal-register.component.scss
│   │   │   │       ├── modal-register.component.spec.ts
│   │   │   │       └── modal-register.component.ts
│   │   │   └── pages/
│   │   │       └── auth-wrapper/
│   │   │           ├── auth-wrapper.component.html
│   │   │           ├── auth-wrapper.component.scss
│   │   │           └── auth-wrapper.component.ts
│   │   ├── dashboard/
│   │   │   ├── dashboard-routing.module.ts
│   │   │   ├── dashboard.module.ts
│   │   │   └── pages/
│   │   │       └── home/
│   │   │           ├── home.component.html
│   │   │           ├── home.component.scss
│   │   │           ├── home.component.spec.ts
│   │   │           └── home.component.ts
│   │   ├── guards/
│   │   │   ├── guards/
│   │   │   │   └── role-guard.guard.ts
│   │   │   ├── guards-routing.module.ts
│   │   │   ├── guards.module.ts
│   │   │   └── pages/
│   │   │       ├── admin-dashboard/
│   │   │       │   ├── admin-dashboard-routing.module.ts
│   │   │       │   ├── admin-dashboard.component.html
│   │   │       │   ├── admin-dashboard.component.scss
│   │   │       │   ├── admin-dashboard.component.ts
│   │   │       │   └── admin-dashboard.module.ts
│   │   │       ├── guards-home/
│   │   │       │   ├── guards-section.component.html
│   │   │       │   ├── guards-section.component.scss
│   │   │       │   └── guards-section.component.ts
│   │   │       └── guest-dashboard/
│   │   │           ├── guest-dashboard-routing.module.ts
│   │   │           ├── guest-dashboard.component.html
│   │   │           ├── guest-dashboard.component.scss
│   │   │           ├── guest-dashboard.component.ts
│   │   │           └── guest-dashboard.module.ts
│   │   ├── interceptors-lab/
│   │   │   ├── data/
│   │   │   │   └── services/
│   │   │   │       ├── http-error-adapter.service.ts
│   │   │   │       ├── interceptor-test.service.ts
│   │   │   │       ├── loader.service.ts
│   │   │   │       └── notification.service.ts
│   │   │   ├── interceptors/
│   │   │   │   ├── auth.interceptor.ts
│   │   │   │   ├── cache.interceptor.ts
│   │   │   │   ├── error.interceptor.ts
│   │   │   │   └── loader.interceptor.ts
│   │   │   ├── interceptors-lab-routing.module.ts
│   │   │   ├── interceptors-lab.module.ts
│   │   │   └── pages/
│   │   │       └── interceptors/
│   │   │           ├── interceptors-section.component.html
│   │   │           ├── interceptors-section.component.scss
│   │   │           └── interceptors-section.component.ts
│   │   ├── observables/
│   │   │   ├── components/
│   │   │   │   └── flow-modal/
│   │   │   │       ├── observables-flow-modal.component.html
│   │   │   │       ├── observables-flow-modal.component.scss
│   │   │   │       └── observables-flow-modal.component.ts
│   │   │   ├── data/
│   │   │   │   ├── models/
│   │   │   │   │   ├── LogEvent.model.ts
│   │   │   │   │   ├── ReactiveLogEvent.model.ts
│   │   │   │   │   ├── TimelineStep.model.ts
│   │   │   │   │   └── User.model.ts
│   │   │   │   └── services/
│   │   │   │       └── observables-lab.service.ts
│   │   │   ├── observables-routing.module.ts
│   │   │   ├── observables.module.ts
│   │   │   └── pages/
│   │   │       └── observables/
│   │   │           ├── observables-page.component.html
│   │   │           ├── observables-page.component.scss
│   │   │           └── observables-page.component.ts
│   │   └── unauthorized/
│   │       └── pages/
│   │           └── unauthorized/
│   │               ├── unauthorized.component.html
│   │               ├── unauthorized.component.scss
│   │               ├── unauthorized.component.spec.ts
│   │               └── unauthorized.component.ts
│   └── shared/
│       ├── animations/
│       │   ├── fade.animation.ts
│       │   └── modal-fade-animation.ts
│       └── components/
│           ├── custom-select/
│           │   ├── custom-select.component.html
│           │   ├── custom-select.component.scss
│           │   └── custom-select.component.ts
│           └── loader/
│               ├── loader.component.html
│               ├── loader.component.scss
│               └── loader.component.ts
├── assets/
│   └── .gitkeep
├── environments/
│   ├── environment.prod.ts
│   └── environment.ts
├── favicon.ico
├── index.html
├── main.ts
├── polyfills.ts
├── styles.scss
└── test.ts
```

## 2) Reglas para mover sin romper

1. Mover por feature (un commit por bloque: `auth`, `api`, etc.).
2. Corregir imports con refactor del IDE.
3. Validar con `npm run lint`, `npm run build`, `npm run test`.

## 3) Código guía para módulos (después de mover carpetas)

> Esta sección responde al caso que mencionaste (`interceptors-lab`): además del árbol, aquí tienes **plantillas reales de código** para que al mover archivos no se rompan imports, rutas lazy ni providers.

### 3.1 `src/app/features/interceptors-lab/interceptors-lab.module.ts`

```ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { InterceptorsLabRoutingModule } from './interceptors-lab-routing.module';
import { InterceptorsSectionComponent } from './pages/interceptors/interceptors-section.component';

@NgModule({
  declarations: [InterceptorsSectionComponent],
  imports: [CommonModule, RouterModule, InterceptorsLabRoutingModule],
})
export class InterceptorsLabModule {}
```

### 3.2 `src/app/features/interceptors-lab/interceptors-lab-routing.module.ts`

```ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { InterceptorsSectionComponent } from './pages/interceptors/interceptors-section.component';

const routes: Routes = [
  {
    path: '',
    component: InterceptorsSectionComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InterceptorsLabRoutingModule {}
```

### 3.3 `src/app/app-routing.module.ts` (lazy loading con nuevas rutas)

```ts
const routes: Routes = [
  {
    path: 'interceptors',
    loadChildren: () =>
      import('./features/interceptors-lab/interceptors-lab.module').then(
        m => m.InterceptorsLabModule,
      ),
  },
  {
    path: 'api-section',
    loadChildren: () =>
      import('./features/api/api-section.module').then(m => m.ApiSectionModule),
  },
  {
    path: 'observables',
    loadChildren: () =>
      import('./features/observables/observables.module').then(
        m => m.ObservablesModule,
      ),
  },
  {
    path: 'guards',
    loadChildren: () =>
      import('./features/guards/guards.module').then(m => m.GuardsModule),
  },
];
```

### 3.4 `src/app/app.module.ts` (providers de interceptors ya movidos)

```ts
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { AuthInterceptor } from './features/interceptors-lab/interceptors/auth.interceptor';
import { CacheInterceptor } from './features/interceptors-lab/interceptors/cache.interceptor';
import { LoaderInterceptor } from './features/interceptors-lab/interceptors/loader.interceptor';
import { ErrorInterceptor } from './features/interceptors-lab/interceptors/error.interceptor';

@NgModule({
  // ...
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: CacheInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: LoaderInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
  ],
})
export class AppModule {}
```

### 3.5 Checklist mínima por módulo movido

- Renombra clases de módulo/routing si cambió el nombre de carpeta (ej: `InterceptorsSectionModule` -> `InterceptorsLabModule`).
- Actualiza imports relativos internos (`./component/...` -> `./pages/...`, `./models/...` -> `./data/models/...`).
- Actualiza `loadChildren` en `AppRoutingModule` hacia `./features/...`.
- Si un servicio quedó dentro de `features/<feature>/data/services`, **no** hace falta provider manual si usa `providedIn: 'root'`; si no lo usa, agrégalo en `providers` del módulo feature.
- Verifica compilación tras cada feature movida antes de continuar con la siguiente.

## 4) Mapeo `origen -> destino` (referencia rápida)


> Esta tabla es de apoyo por si necesitas buscar un archivo específico por su ruta actual.

```text
src/app/api-section/api-section-routing.module.ts -> src/app/features/api/api-section-routing.module.ts
src/app/api-section/api-section.module.ts -> src/app/features/api/api-section.module.ts
src/app/api-section/component/api-section.component.html -> src/app/features/api/pages/api/api-section.component.html
src/app/api-section/component/api-section.component.scss -> src/app/features/api/pages/api/api-section.component.scss
src/app/api-section/component/api-section.component.ts -> src/app/features/api/pages/api/api-section.component.ts
src/app/api-section/models/create-user-request.dto.ts -> src/app/features/api/data/models/create-user-request.dto.ts
src/app/api-section/models/user-response.dto.ts -> src/app/features/api/data/models/user-response.dto.ts
src/app/app-routing.module.ts -> src/app/app-routing.module.ts
src/app/app.component.html -> src/app/app.component.html
src/app/app.component.scss -> src/app/app.component.scss
src/app/app.component.spec.ts -> src/app/app.component.spec.ts
src/app/app.component.ts -> src/app/app.component.ts
src/app/app.module.ts -> src/app/app.module.ts
src/app/auth/auth-routing.module.ts -> src/app/features/auth/auth-routing.module.ts
src/app/auth/auth-wrapper/auth-wrapper.component.html -> src/app/features/auth/pages/auth-wrapper/auth-wrapper.component.html
src/app/auth/auth-wrapper/auth-wrapper.component.scss -> src/app/features/auth/pages/auth-wrapper/auth-wrapper.component.scss
src/app/auth/auth-wrapper/auth-wrapper.component.ts -> src/app/features/auth/pages/auth-wrapper/auth-wrapper.component.ts
src/app/auth/auth.module.ts -> src/app/features/auth/auth.module.ts
src/app/auth/components/login/login.component.html -> src/app/features/auth/components/login/login.component.html
src/app/auth/components/login/login.component.scss -> src/app/features/auth/components/login/login.component.scss
src/app/auth/components/login/login.component.spec.ts -> src/app/features/auth/components/login/login.component.spec.ts
src/app/auth/components/login/login.component.ts -> src/app/features/auth/components/login/login.component.ts
src/app/auth/components/modal-register/modal-register.component.html -> src/app/features/auth/components/modal-register/modal-register.component.html
src/app/auth/components/modal-register/modal-register.component.scss -> src/app/features/auth/components/modal-register/modal-register.component.scss
src/app/auth/components/modal-register/modal-register.component.spec.ts -> src/app/features/auth/components/modal-register/modal-register.component.spec.ts
src/app/auth/components/modal-register/modal-register.component.ts -> src/app/features/auth/components/modal-register/modal-register.component.ts
src/app/core/auth.service.ts -> src/app/core/auth/auth.service.ts
src/app/core/core.module.ts -> src/app/core/core.module.ts
src/app/core/local-storage.service.ts -> src/app/core/storage/local-storage.service.ts
src/app/core/models/auth/auth.models.ts -> src/app/core/models/auth/auth.models.ts
src/app/core/models/auth/role.utils.ts -> src/app/core/models/auth/role.utils.ts
src/app/core/models/users/users.models.ts -> src/app/core/models/users/users.models.ts
src/app/core/services/api-section/user-service.ts -> src/app/features/api/data/services/user.service.ts
src/app/core/services/interceptors-section/http-error-adapter.service.ts -> src/app/features/interceptors-lab/data/services/http-error-adapter.service.ts
src/app/core/services/interceptors-section/interceptor-test.service.ts -> src/app/features/interceptors-lab/data/services/interceptor-test.service.ts
src/app/core/services/interceptors-section/loader.service.ts -> src/app/features/interceptors-lab/data/services/loader.service.ts
src/app/core/services/interceptors-section/notification.service.ts -> src/app/features/interceptors-lab/data/services/notification.service.ts
src/app/core/services/observable-section/observables-lab.service.ts -> src/app/features/observables/data/services/observables-lab.service.ts
src/app/dashboard/components/home/home.component.html -> src/app/features/dashboard/pages/home/home.component.html
src/app/dashboard/components/home/home.component.scss -> src/app/features/dashboard/pages/home/home.component.scss
src/app/dashboard/components/home/home.component.spec.ts -> src/app/features/dashboard/pages/home/home.component.spec.ts
src/app/dashboard/components/home/home.component.ts -> src/app/features/dashboard/pages/home/home.component.ts
src/app/dashboard/dashboard-routing.module.ts -> src/app/features/dashboard/dashboard-routing.module.ts
src/app/dashboard/dashboard.module.ts -> src/app/features/dashboard/dashboard.module.ts
src/app/guards-section/components/admin-dashboard/admin-dashboard-routing.module.ts -> src/app/features/guards/pages/admin-dashboard/admin-dashboard-routing.module.ts
src/app/guards-section/components/admin-dashboard/admin-dashboard.component.html -> src/app/features/guards/pages/admin-dashboard/admin-dashboard.component.html
src/app/guards-section/components/admin-dashboard/admin-dashboard.component.scss -> src/app/features/guards/pages/admin-dashboard/admin-dashboard.component.scss
src/app/guards-section/components/admin-dashboard/admin-dashboard.component.ts -> src/app/features/guards/pages/admin-dashboard/admin-dashboard.component.ts
src/app/guards-section/components/admin-dashboard/admin-dashboard.module.ts -> src/app/features/guards/pages/admin-dashboard/admin-dashboard.module.ts
src/app/guards-section/components/guards-section/guards-section.component.html -> src/app/features/guards/pages/guards-home/guards-section.component.html
src/app/guards-section/components/guards-section/guards-section.component.scss -> src/app/features/guards/pages/guards-home/guards-section.component.scss
src/app/guards-section/components/guards-section/guards-section.component.ts -> src/app/features/guards/pages/guards-home/guards-section.component.ts
src/app/guards-section/components/guest-dashboard/guest-dashboard-routing.module.ts -> src/app/features/guards/pages/guest-dashboard/guest-dashboard-routing.module.ts
src/app/guards-section/components/guest-dashboard/guest-dashboard.component.html -> src/app/features/guards/pages/guest-dashboard/guest-dashboard.component.html
src/app/guards-section/components/guest-dashboard/guest-dashboard.component.scss -> src/app/features/guards/pages/guest-dashboard/guest-dashboard.component.scss
src/app/guards-section/components/guest-dashboard/guest-dashboard.component.ts -> src/app/features/guards/pages/guest-dashboard/guest-dashboard.component.ts
src/app/guards-section/components/guest-dashboard/guest-dashboard.module.ts -> src/app/features/guards/pages/guest-dashboard/guest-dashboard.module.ts
src/app/guards-section/guards-section-routing.module.ts -> src/app/features/guards/guards-routing.module.ts
src/app/guards-section/guards-section.module.ts -> src/app/features/guards/guards.module.ts
src/app/guards-section/role-guard.guard.ts -> src/app/features/guards/guards/role-guard.guard.ts
src/app/interceptors-section/component/interceptors-section.component.html -> src/app/features/interceptors-lab/pages/interceptors/interceptors-section.component.html
src/app/interceptors-section/component/interceptors-section.component.scss -> src/app/features/interceptors-lab/pages/interceptors/interceptors-section.component.scss
src/app/interceptors-section/component/interceptors-section.component.ts -> src/app/features/interceptors-lab/pages/interceptors/interceptors-section.component.ts
src/app/interceptors-section/interceptors/auth.interceptor.ts -> src/app/features/interceptors-lab/interceptors/auth.interceptor.ts
src/app/interceptors-section/interceptors/cache.interceptor.ts -> src/app/features/interceptors-lab/interceptors/cache.interceptor.ts
src/app/interceptors-section/interceptors/error.interceptor.ts -> src/app/features/interceptors-lab/interceptors/error.interceptor.ts
src/app/interceptors-section/interceptors/loader.interceptor.ts -> src/app/features/interceptors-lab/interceptors/loader.interceptor.ts
src/app/interceptors-section/interceptors-section-routing.module.ts -> src/app/features/interceptors-lab/interceptors-lab-routing.module.ts
src/app/interceptors-section/interceptors-section.module.ts -> src/app/features/interceptors-lab/interceptors-lab.module.ts
src/app/observable-section/component/flow-modal/observables-flow-modal.component.html -> src/app/features/observables/components/flow-modal/observables-flow-modal.component.html
src/app/observable-section/component/flow-modal/observables-flow-modal.component.scss -> src/app/features/observables/components/flow-modal/observables-flow-modal.component.scss
src/app/observable-section/component/flow-modal/observables-flow-modal.component.ts -> src/app/features/observables/components/flow-modal/observables-flow-modal.component.ts
src/app/observable-section/component/observables-section.component.html -> src/app/features/observables/pages/observables/observables-page.component.html
src/app/observable-section/component/observables-section.component.scss -> src/app/features/observables/pages/observables/observables-page.component.scss
src/app/observable-section/component/observables-section.component.ts -> src/app/features/observables/pages/observables/observables-page.component.ts
src/app/observable-section/model/LogEvent.model.ts -> src/app/features/observables/data/models/LogEvent.model.ts
src/app/observable-section/model/ReactiveLogEvent.model.ts -> src/app/features/observables/data/models/ReactiveLogEvent.model.ts
src/app/observable-section/model/TimelineStep.model.ts -> src/app/features/observables/data/models/TimelineStep.model.ts
src/app/observable-section/model/User.model.ts -> src/app/features/observables/data/models/User.model.ts
src/app/observable-section/observable-section-routing.module.ts -> src/app/features/observables/observables-routing.module.ts
src/app/observable-section/observable-section.module.ts -> src/app/features/observables/observables.module.ts
src/app/shared/animations/fade.animation.ts -> src/app/shared/animations/fade.animation.ts
src/app/shared/animations/modal-fade-animation.ts -> src/app/shared/animations/modal-fade-animation.ts
src/app/shared/components/custom-select/custom-select.component.html -> src/app/shared/components/custom-select/custom-select.component.html
src/app/shared/components/custom-select/custom-select.component.scss -> src/app/shared/components/custom-select/custom-select.component.scss
src/app/shared/components/custom-select/custom-select.component.ts -> src/app/shared/components/custom-select/custom-select.component.ts
src/app/shared/components/loader/loader.component.html -> src/app/shared/components/loader/loader.component.html
src/app/shared/components/loader/loader.component.scss -> src/app/shared/components/loader/loader.component.scss
src/app/shared/components/loader/loader.component.ts -> src/app/shared/components/loader/loader.component.ts
src/app/unauthorized/unauthorized.component.html -> src/app/features/unauthorized/pages/unauthorized/unauthorized.component.html
src/app/unauthorized/unauthorized.component.scss -> src/app/features/unauthorized/pages/unauthorized/unauthorized.component.scss
src/app/unauthorized/unauthorized.component.spec.ts -> src/app/features/unauthorized/pages/unauthorized/unauthorized.component.spec.ts
src/app/unauthorized/unauthorized.component.ts -> src/app/features/unauthorized/pages/unauthorized/unauthorized.component.ts
src/assets/.gitkeep -> src/assets/.gitkeep
src/environments/environment.prod.ts -> src/environments/environment.prod.ts
src/environments/environment.ts -> src/environments/environment.ts
src/favicon.ico -> src/favicon.ico
src/index.html -> src/index.html
src/main.ts -> src/main.ts
src/polyfills.ts -> src/polyfills.ts
src/styles.scss -> src/styles.scss
src/test.ts -> src/test.ts
```
