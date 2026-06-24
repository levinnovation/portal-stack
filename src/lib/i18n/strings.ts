/**
 * Translation strings for the portal frontend.
 *
 * ponytail: only add a key when it actually appears in JSX. Don't pre-translate
 * the whole admin. Start with the most-shown labels; tenants that need
 * more get a follow-up commit.
 */
export const SUPPORTED_LOCALES = ["en", "es"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "es";
export const LOCALE_COOKIE = "ps-locale";

export const dict = {
  en: {
    "nav.dashboard": "Dashboard",
    "nav.notifications": "Notifications",
    "nav.profile": "Profile",
    "nav.signOut": "Sign out",
    "common.search": "Search",
    "common.loading": "Loading…",
    "common.empty": "Nothing to show yet.",
    "common.error": "Something went wrong.",
    "common.retry": "Retry",
    "common.cancel": "Cancel",
    "common.save": "Save",
    "auth.signIn.title": "Sign in",
    "auth.signIn.submit": "Sign in",
    "auth.signIn.signingIn": "Signing in…",
    "auth.signIn.error": "Could not sign in",
    "auth.signIn.help": "Need help? Contact the team at",
    "auth.field.email": "Email",
    "auth.field.password": "Password",
    "lang.en": "English",
    "lang.es": "Español",
    "lang.label": "Language",
  },
  es: {
    "nav.dashboard": "Resumen",
    "nav.notifications": "Notificaciones",
    "nav.profile": "Perfil",
    "nav.signOut": "Cerrar sesión",
    "common.search": "Buscar",
    "common.loading": "Cargando…",
    "common.empty": "Sin datos para mostrar.",
    "common.error": "Algo salió mal.",
    "common.retry": "Reintentar",
    "common.cancel": "Cancelar",
    "common.save": "Guardar",
    "auth.signIn.title": "Acceder al portal",
    "auth.signIn.submit": "Iniciar sesión",
    "auth.signIn.signingIn": "Ingresando…",
    "auth.signIn.error": "No se pudo iniciar sesión",
    "auth.signIn.help": "¿Necesitas ayuda? Contacta al equipo en",
    "auth.field.email": "Email",
    "auth.field.password": "Contraseña",
    "lang.en": "English",
    "lang.es": "Español",
    "lang.label": "Idioma",
  },
} as const;

export type DictKey = keyof typeof dict.en;
