import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const AppCard = ({
  children,
  style,
  onPress,
  elevated = false,
  glass = false,
  glow = false,
  padding = 16,
  noBorder = false,
  size = 'medium',
  allowOverflow = false,
}) => {
  const { theme, isDark } = useTheme();
  const isWeb = Platform.OS === 'web';

  const getCardStyle = () => {
    const baseStyle = {
      backgroundColor: glass
        ? (isDark ? 'rgba(15,15,30,0.75)' : 'rgba(255,255,255,0.80)')
        : elevated ? theme.colors.cardElevated : theme.colors.card,
      padding,
      borderRadius: theme.borderRadius['2xl'],
      borderWidth: noBorder ? 0 : 1,
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.08)',
    };

    if (glass) {
      baseStyle.borderColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(26,26,46,0.10)';
      if (isWeb) {
        baseStyle.backdropFilter       = 'blur(16px)';
        baseStyle.WebkitBackdropFilter = 'blur(16px)';
      }
    }

    if (isWeb) {
      baseStyle.transition = 'all 0.2s ease';
      if (onPress) baseStyle.cursor = 'pointer';
    }

    return baseStyle;
  };

  const getShadowStyle = () => {
    if (glow && isDark) return theme.shadows.glow;
    if (elevated)       return theme.shadows.lg;
    return theme.shadows.md;
  };

  const cardStyles = [
    styles.card,
    getCardStyle(),
    getShadowStyle(),
    isWeb && { cursor: onPress ? 'pointer' : 'default', transition: 'all 0.2s ease' },
    allowOverflow && { overflow: 'visible' },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={cardStyles}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyles}>{children}</View>;
};

const styles = StyleSheet.create({
  card: { overflow: 'hidden' },
});

export default AppCard;
