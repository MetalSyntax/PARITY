import React from 'react';
import { Text, TextStyle, Platform, StyleProp, TextProps } from 'react-native';

interface TypographyProps extends TextProps {
  children: React.ReactNode;
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'small' | 'tiny';
  color?: 'primary' | 'secondary' | 'brand' | 'error' | 'success';
  weight?: 'light' | 'normal' | 'medium' | 'bold' | 'black';
  align?: 'left' | 'center' | 'right';
  style?: StyleProp<TextStyle>;
}

export const Typography: React.FC<TypographyProps> = ({
  children,
  variant = 'body',
  color = 'primary',
  weight,
  align = 'left',
  style,
  ...rest
}) => {
  const getWeight = () => {
    switch (weight) {
      case 'light': return '300';
      case 'normal': return '400';
      case 'medium': return '500';
      case 'bold': return '700';
      case 'black': return '900';
      default: 
        if (variant === 'h1' || variant === 'h2') return '900';
        return '400';
    }
  };

  const getFontSize = () => {
    switch (variant) {
      case 'h1': return 36;
      case 'h2': return 24;
      case 'h3': return 20;
      case 'h4': return 18;
      case 'body': return 16;
      case 'small': return 14;
      case 'tiny': return 12;
      default: return 16;
    }
  };

  const getColor = () => {
    switch (color) {
      case 'primary': return '#FFFFFF';
      case 'secondary': return '#A0A0A0';
      case 'brand': return '#00C853';
      case 'error': return '#FF4444';
      case 'success': return '#00C853';
      default: return '#FFFFFF';
    }
  };

  return (
    <Text
      style={[
        {
          fontFamily: Platform.select({
            ios: 'System',
            android: 'sans-serif',
            default: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          }),
          fontSize: getFontSize(),
          color: getColor(),
          fontWeight: getWeight() as any,
          textAlign: align as any,
          letterSpacing: variant === 'h1' || variant === 'h2' ? -1 : 0,
        },
        style
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
};
