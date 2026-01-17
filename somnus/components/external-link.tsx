/**
 * ExternalLink component
 * --------------------------------------------------
 * Componente reutilizable para abrir enlaces externos.
 *
 * - En web: abre normalmente en una nueva pestaña.
 * - En móvil (Android / iOS): abre el enlace dentro
 *   de un navegador interno usando expo-web-browser.
 */

import { Href, Link } from 'expo-router';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import { type ComponentProps } from 'react';

/**
 * Props del componente:
 * - Hereda todas las props del componente Link
 * - Excepto "href", que se redefine con tipado estricto
 */
type Props = Omit<ComponentProps<typeof Link>, 'href'> & {
  href: Href & string;
};

export function ExternalLink({ href, ...rest }: Props) {
  return (
    <Link
      // Abre el enlace en una nueva pestaña (web)
      target="_blank"
      {...rest}
      href={href}
      onPress={async (event) => {
        /**
         * En plataformas nativas:
         * - Se evita el comportamiento por defecto
         * - Se abre un navegador interno (in-app browser)
         */
        if (process.env.EXPO_OS !== 'web') {
          // Evita abrir el navegador externo del sistema
          event.preventDefault();

          // Abre el enlace dentro de la app
          await openBrowserAsync(href, {
            presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
          });
        }
      }}
    />
  );
}
