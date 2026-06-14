// Client ID de Google OAuth.
//
// El Client ID es PÚBLICO: viaja al navegador en cualquier app web con login
// de Google. La seguridad la dan los "Orígenes autorizados de JavaScript"
// configurados en Google Cloud (limitados a fairpadel.com), no el secreto.
//
// Se deja como valor por defecto en el código porque el frontend se construye
// con un Dockerfile y las variables de entorno de Railway no llegan a la etapa
// de build de Vite (quedarían vacías). Igual se permite override por
// VITE_GOOGLE_CLIENT_ID si en el futuro se pasa como build arg / otro entorno.
export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '381086845403-s7clgdbodand7p5qlfeok6a2lgmglohq.apps.googleusercontent.com';
