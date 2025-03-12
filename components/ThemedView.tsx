import React from 'react';
import { View, ViewProps } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface ThemedViewProps extends ViewProps {
  variant?: 'default' | 'card';
}

export function ThemedView({ variant = 'default', style, ...props }: ThemedViewProps) {
  const { theme } = useTheme();
  
  const variantStyles = {
    default: { backgroundColor: theme.background },
    card: { 
      backgroundColor: theme.card,
      borderRadius: 10,
      padding: 16,
      marginBottom: 16,
      shadowColor: theme.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3
    },
  };
  
  return <View style={[variantStyles[variant], style]} {...props} />;
}