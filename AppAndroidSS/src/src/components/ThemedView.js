import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const ThemedView = ({ colorKey = 'background', style, children, ...rest }) => {
  const { theme } = useTheme();
  return (
    <View style={[style, { backgroundColor: theme.colors[colorKey] }]} {...rest}>
      {children}
    </View>
  );
};

export default ThemedView;
