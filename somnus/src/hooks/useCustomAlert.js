import { useState, useCallback } from 'react';

export function useCustomAlert() {
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: [],
    type: 'default',
  });

  const showAlert = useCallback((title, message, buttons = [], type = 'default') => {
    // Si buttons está vacío o es un array vacío, agregar botón OK por defecto
    const finalButtons = buttons.length === 0 
      ? [{ text: 'OK', onPress: () => {} }]
      : buttons;

    setAlertConfig({
      visible: true,
      title,
      message,
      buttons: finalButtons,
      type,
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  }, []);

  return {
    alertConfig,
    showAlert,
    hideAlert,
  };
}
