# 06. Frontend Application Structure

This document describes the architecture, routing, and component organization of the TERRITORY (PropIt) frontend application.

## Overview

The frontend is a single-page application (SPA) built with React 18, TypeScript, and Vite. It utilizes Tailwind CSS v4 for styling and Framer Motion for complex animations (like the initial splash screen).

## 1. Routing Architecture (`App.tsx`)

Routing is handled by `react-router-dom` v6. The application is broadly divided into public routes, protected user/buyer routes, protected seller routes, and admin routes.

```mermaid
graph TD
    App[App.tsx]
    Layout[Layout Component]
    SecureViewer[SecureViewer Component (Fullscreen)]
    
    App --> Splash[SplashAnimation]
    App --> Router[BrowserRouter]
    
    Router --> Layout
    Router --> SecureViewer
    
    Layout --> PublicRoutes(Public: /, /browse, /login, /map)
    Layout --> ProtectedBuyer(Protected: /wishlist, /payment/:id, /dashboard/buyer)
    Layout --> ProtectedSeller(Protected: /dashboard/seller, /dashboard/seller/upload, /dashboard/seller/edit/:id)
    Layout --> ProtectedAdmin(Protected: /dashboard/admin)
```

### Route Protection
The `ProtectedRoute.tsx` component is a High-Order Component (HOC) that wraps private routes. 
* It checks `localStorage` for a valid Firebase token.
* If a `requiredRole` is passed (e.g., `"ADMIN"` or `"BUYER"`), it validates the locally cached role.
* If validation fails, it redirects the user to the `/login` page.

### The Splash Screen
`App.tsx` contains a stateful `SplashAnimation` component that plays once per session. State is managed via `sessionStorage` (`propit_splash_shown`) and user preferences in `localStorage` (`propit_animation_setting`). 

## 2. Global State & Context

While Redux/Zustand is not used, the application relies heavily on React Context for cross-cutting concerns:

* **Auth State**: Handled primarily via `localStorage` and custom events (`window.dispatchEvent(new Event('local-auth-changed'))`) defined in `src/lib/api.ts`.
* **LanguageContext**: Manages Google Translate integration. The `<TranslationRouteObserver />` inside `App.tsx` forces the Google Translate DOM mutation observer to re-trigger when navigating between virtual routes in the SPA if Tamil (`ta`) is selected.

## 3. Directory Structure

```text
frontend/src/
├── components/          # Reusable UI components
│   ├── layout/          # Navbar, Footer, Layout wrapper
│   ├── ui/              # Buttons, inputs, modals, toasts (if applicable)
│   ├── SplashAnimation/ # Intro animation
│   └── ProtectedRoute/  # Route guard HOC
├── pages/               # Top-level route components
│   ├── admin/           # Admin Dashboard (Stats, User Management, Approvals)
│   ├── auth/            # Login, Signup
│   ├── buyer/           # Home, Browse, PropertyDetails, UnifiedDashboard, SecureViewer
│   ├── seller/          # UploadProperty, EditProperty
│   └── ...              # Contact, Help, Settings, NotFound
├── lib/                 # Utilities and constants
│   ├── api.ts           # Axios instance, interceptors, token helpers
│   ├── types.ts         # TypeScript interfaces (Property, User, etc.)
│   └── utils.ts         # Formatting helpers (formatPrice, formatArea)
├── assets/              # Static images, SVGs
└── index.css            # Tailwind entry point and vanilla CSS overrides
```

## 4. Key Implementation Details

### Axios Interceptors (`lib/api.ts`)
* **Request Interceptor**: Synchronously grabs the token from `localStorage` and attaches it to the `Authorization: Bearer <token>` header. It is synchronous to prevent rendering bottlenecks.
* **Response Interceptor**: Globally catches `401 Unauthorized` responses. If the request was not to an auth endpoint, it clears local storage and forces a hard redirect to `/login`.

### Type Definitions (`lib/types.ts`)
The `types.ts` file acts as the single source of truth for frontend data shapes. It includes:
* `Property` and `User` interfaces (which directly map to the backend Pydantic models).
* Constants like `LAND_TYPES`, `SOIL_TYPES`, and `WATER_SOURCES` used to populate dropdowns and filter panels consistently across the app.
* Helper functions like `getPropertyImageUrl` to normalize image paths (handling both relative `/uploads` paths from the backend and absolute URLs from unsplash mocks).

### Secure Document Viewer
The `/viewer/:propertyId/:docIndex` route intentionally renders outside of the main `<Layout />` (no Navbar or Footer). This provides a fullscreen, distraction-free environment for viewing sensitive property documents. The viewer component includes anti-copy measures (disabling right-click) and dynamic watermarking logic.
