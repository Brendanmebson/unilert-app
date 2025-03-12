import React from 'react';
import { Text, TextProps } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface ThemedTextProps extends TextProps {
  variant?: 'default' | 'title' | 'subtitle' | 'caption';
}

export function ThemedText({ variant = 'default', style, ...props }: ThemedTextProps) {
  const { theme } = useTheme();
  
  const variantStyles = {
    default: { fontSize: 16, color: theme.text },
    title: { fontSize: 24, fontWeight: 'bold', color: theme.text },
    subtitle: { fontSize: 18, fontWeight: 'bold', color: theme.text },
    caption: { fontSize: 14, color: theme.secondaryText },
  };
  
  return <Text style={[variantStyles[variant], style]} {...props} />;
}