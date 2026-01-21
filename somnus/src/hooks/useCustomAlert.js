import { useState, useCallback } from 'react';

export function useCustomAlert() {

  // Estado que controla toda la configuración de la alerta
  const [alertConfig, setAlertConfig] = useState({
    visible: false,   // Muestra u oculta la alerta
    title: '',        // Título del mensaje
    message: '',      // Texto principal
    buttons: [],      // Botones de acción
    type: 'default',  // Tipo de alerta (success, error, warning, etc.)
  });

  // Función para mostrar la alerta
  const showAlert = useCallback(
    (title, message, buttons = [], type = 'default') => {

      // Si no se envían botones, se crea uno por defecto (OK)
      const finalButtons =
        buttons.length === 0
          ? [{ text: 'OK', onPress: () => {} }]
          : buttons;

      // Actualiza el estado y muestra la alerta
      setAlertConfig({
        visible: true,
        title,
        message,
        buttons: finalButtons,
        type,
      });
    },
    []
  );

  // Oculta la alerta sin borrar su configuración
  const hideAlert = useCallback(() => {
    setAlertConfig(prev => ({
      ...prev,
      visible: false,
    }));
  }, []);

  // Se devuelve todo lo necesario para usar el alert
  return {
    alertConfig,
    showAlert,
    hideAlert,
  };
}
