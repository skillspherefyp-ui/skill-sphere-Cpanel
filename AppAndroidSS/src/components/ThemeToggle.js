import React from 'react';
import { TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = ({ style, size = 'md' }) => {
  const { theme, toggleTheme, isDark } = useTheme();
  const isWeb = Platform.OS === 'web';

  const sizeConfig = {
    sm: { buttonSize: 36, iconSize: 18 },
    md: { buttonSize: 40, iconSize: 20 },
    lg: { buttonSize: 44, iconSize: 24 },
  };
  const currentSize = sizeConfig[size] || sizeConfig.md;

  const handlePress = (event) => {
    // Use the touch coordinates directly — always in viewport/screen space,
    // no async measure() call needed, works on both native and web.
    const { pageX, pageY } = event.nativeEvent;
    toggleTheme(pageX, pageY);
  };

  return (
    <TouchableOpacity
      style={[
        styles.toggleButton,
        {
          backgroundColor: theme.colors.surface,
          width: currentSize.buttonSize,
          height: currentSize.buttonSize,
          borderRadius: currentSize.buttonSize / 2,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        theme.shadows.sm,
        isWeb && { cursor: 'pointer', transition: 'all 0.2s ease-in-out' },
        style,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Icon
        name={isDark ? 'sunny' : 'moon'}
        size={currentSize.iconSize}
        color={theme.colors.primary}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  toggleButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ThemeToggle;
