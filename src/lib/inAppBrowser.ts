// Facebook/Instagram/Messenger y WebViews genéricos de Android no siempre
// completan la navegación de un <a target="_blank"> hacia un dominio de
// checkout externo (ver Sentry JAVASCRIPT-REACT-8: postMessage a un puente
// nativo ya destruido en el in-app browser de Facebook). En esos navegadores
// hay que evitar abrir una pestaña nueva y ofrecer copiar el link como respaldo.
const IN_APP_BROWSER_PATTERN = /FBAN|FBAV|FB_IAB|Instagram|Line\/|MicroMessenger|; ?wv\)/i

export function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  return IN_APP_BROWSER_PATTERN.test(navigator.userAgent)
}
