module.exports = {
  presets: [
    'module:metro-react-native-babel-preset',
    '@babel/preset-react',
  ],
  plugins: [
    'react-native-reanimated/plugin',
  ],
  env: {
    web: {
      presets: [
        '@babel/preset-env',
        '@babel/preset-react',
      ],
      plugins: [
        'react-native-reanimated/plugin',
<<<<<<< HEAD
        ['@babel/plugin-transform-class-properties', { loose: true }],
        ['@babel/plugin-transform-private-methods', { loose: true }],
        ['@babel/plugin-transform-private-property-in-object', { loose: true }],
=======
>>>>>>> be3d69ffc72914af79917c25892abfeecfd83821
      ],
    },
  },
};
