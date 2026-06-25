import React, { useState, useEffect } from 'react';
import { View, Text, Image, Platform } from 'react-native';

const UserAvatar = ({ user, size = 36, style, fontSize, borderColor }) => {
  const initial = (user?.name || 'U').trim().charAt(0).toUpperCase();
  const letterSize = fontSize || Math.round(size * 0.42);
  const pic = user?.profilePicture;

  // Track broken images — reset whenever the URL changes
  const [imgError, setImgError] = useState(false);
  useEffect(() => { setImgError(false); }, [pic]);

  const showImage = !!pic && typeof pic === 'string' && pic.trim().length > 0
    && pic !== 'null' && pic !== 'undefined'
    && (pic.startsWith('http') || pic.startsWith('data:'))
    && !imgError;

  const border = borderColor ? `2px solid ${borderColor}` : 'none';

  // ── Web ───────────────────────────────────────────────────────────────────
  if (Platform.OS === 'web') {
    if (showImage) {
      return (
        <img
          src={pic}
          onError={() => setImgError(true)}
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            objectFit: 'cover',
            border,
            flexShrink: 0,
            display: 'block',
          }}
        />
      );
    }
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          backgroundColor: '#FF8C42',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border,
          flexShrink: 0,
          boxSizing: 'border-box',
          color: '#FFFFFF',
          fontSize: letterSize,
          fontWeight: 800,
          userSelect: 'none',
          lineHeight: `${size}px`,
        }}
      >
        {initial}
      </div>
    );
  }

  // ── Native ────────────────────────────────────────────────────────────────
  const radius = size / 2;
  if (showImage) {
    return (
      <Image
        source={{ uri: pic }}
        onError={() => setImgError(true)}
        style={[
          { width: size, height: size, borderRadius: radius },
          borderColor ? { borderWidth: 2, borderColor } : null,
          style,
        ]}
        resizeMode="cover"
      />
    );
  }

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: '#FF8C42',
          alignItems: 'center',
          justifyContent: 'center',
        },
        borderColor ? { borderWidth: 2, borderColor } : null,
        style,
      ]}
    >
      <Text
        style={{
          color: '#FFFFFF',
          fontSize: letterSize,
          fontWeight: '800',
          lineHeight: size,
          textAlign: 'center',
        }}
      >
        {initial}
      </Text>
    </View>
  );
};

export default UserAvatar;
