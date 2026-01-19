/**
 * Tema claro (Light Theme)
 * ------------------------
 * Define la paleta de colores utilizada cuando la aplicación
 * se encuentra en modo claro.
 * 
 * Este objeto centraliza los colores para facilitar:
 * - Mantenimiento
 * - Reutilización
 * - Cambio dinámico de temas
 */
export const THEME_LIGHT = {
    /**
     * Color de fondo principal de la aplicación
     */
    BACKGROUND_COLOR: '#F8F9FA',

    /**
     * Color principal del texto
     */
    TEXT_COLOR: '#212529',

    /**
     * Color de acento usado en botones, enlaces y elementos destacados
     */
    ACCENT_COLOR: '#6B8AE3',

    /**
     * Color secundario para fondos alternativos, cards o secciones
     */
    SECONDARY_COLOR: '#E0E7FF',

    /**
     * Color utilizado para bordes, separadores o líneas divisorias
     */
    BORDER_COLOR: '#E9ECEF',
};


/**
 * Tema oscuro (Dark Theme)
 * ------------------------
 * Define la paleta de colores utilizada cuando la aplicación
 * se encuentra en modo oscuro.
 * 
 * Diseñado para:
 * - Reducir la fatiga visual
 * - Mejorar la experiencia en ambientes con poca luz
 */
export const THEME_DARK = {
    /**
     * Color de fondo principal de la aplicación
     */
    BACKGROUND_COLOR: '#1A1F26',

    /**
     * Color principal del texto (alto contraste con el fondo)
     */
    TEXT_COLOR: '#F8F9FA',

    /**
     * Color de acento para acciones principales y elementos interactivos
     */
    ACCENT_COLOR: '#7C9EFF',

    /**
     * Color secundario para contenedores, cards o secciones
     */
    SECONDARY_COLOR: '#2D3748',

    /**
     * Color utilizado para bordes y separadores en modo oscuro
     */
    BORDER_COLOR: '#3A4556',
};
