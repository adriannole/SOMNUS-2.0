import { ReactNode } from 'react';

interface AnimatedBackgroundProps {
  isDark: boolean;
  theme: {
    BACKGROUND_COLOR: string;
    TEXT_COLOR: string;
    ACCENT_COLOR: string;
    SECONDARY_COLOR: string;
    BORDER_COLOR: string;
  };
}

export function AnimatedBackground(props: AnimatedBackgroundProps): ReactNode;
