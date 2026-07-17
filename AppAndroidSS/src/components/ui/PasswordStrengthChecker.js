import React, { useEffect, useRef } from 'react';
import { View, Text, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withTiming, withSequence, withDelay,
} from 'react-native-reanimated';

const GREEN  = '#10B981';
const GREEN2 = '#34D399';

const STRENGTH_LEVELS = [
  { label: 'Very Weak', color: '#EF4444', icon: 'shield-outline' },
  { label: 'Weak',      color: '#F97316', icon: 'shield-outline' },
  { label: 'Fair',      color: '#EAB308', icon: 'shield-half-outline' },
  { label: 'Good',      color: '#84CC16', icon: 'shield-half' },
  { label: 'Great',     color: '#22C55E', icon: 'shield-half' },
  { label: 'Strong',    color: '#10B981', icon: 'shield-checkmark' },
];

const RULES = [
  { key: 'length',  label: 'At least 8 characters' },
  { key: 'upper',   label: 'One uppercase letter' },
  { key: 'lower',   label: 'One lowercase letter' },
  { key: 'number',  label: 'One number' },
  { key: 'special', label: 'One special character' },
];

const PwCheckItem = ({ passed, label, dimColor }) => {
  const prevPassed   = useRef(false);
  const ring1Scale   = useSharedValue(1);
  const ring1Opacity = useSharedValue(0);
  const ring2Scale   = useSharedValue(1);
  const ring2Opacity = useSharedValue(0);
  const iconScale    = useSharedValue(1);

  useEffect(() => {
    if (!prevPassed.current && passed) {
      ring1Scale.value   = 1;
      ring1Opacity.value = 0.9;
      ring1Scale.value   = withTiming(2.4, { duration: 500 });
      ring1Opacity.value = withTiming(0,   { duration: 500 });

      ring2Scale.value   = 1;
      ring2Opacity.value = 0.55;
      ring2Scale.value   = withDelay(90, withTiming(1.9, { duration: 400 }));
      ring2Opacity.value = withDelay(90, withTiming(0,   { duration: 400 }));

      iconScale.value = withSpring(1.4, { damping: 3, stiffness: 280 }, () => {
        iconScale.value = withSpring(1, { damping: 10 });
      });
    }
    prevPassed.current = passed;
  }, [passed]);

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring1Scale.value }],
    opacity:    ring1Opacity.value,
  }));
  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring2Scale.value }],
    opacity:    ring2Opacity.value,
  }));
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 }}>
      <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={[ring1Style, {
          position: 'absolute', width: 22, height: 22,
          borderRadius: 11, borderWidth: 1.5, borderColor: GREEN,
        }]} />
        <Animated.View style={[ring2Style, {
          position: 'absolute', width: 22, height: 22,
          borderRadius: 11, borderWidth: 1, borderColor: GREEN2,
        }]} />
        <Animated.View style={[iconStyle, {
          width: 20, height: 20, borderRadius: 10,
          backgroundColor: passed ? GREEN : 'transparent',
          borderWidth: passed ? 0 : 1.5,
          borderColor: passed ? GREEN : dimColor,
          alignItems: 'center', justifyContent: 'center',
          ...(passed && Platform.OS !== 'web'
            ? { shadowColor: GREEN, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 5, elevation: 4 }
            : {}),
        }]}>
          {passed && <Icon name="checkmark" size={12} color="#fff" />}
        </Animated.View>
      </View>
      <Text style={{
        fontSize: 13,
        color: passed ? GREEN : dimColor,
        fontWeight: passed ? '600' : '400',
      }}>
        {label}
      </Text>
    </View>
  );
};

const PasswordStrengthChecker = ({ pwChecks, isDark }) => {
  const passedCount = Object.values(pwChecks).filter(Boolean).length;
  const allPassed   = passedCount === 5;
  const { label, color, icon } = STRENGTH_LEVELS[passedCount] || STRENGTH_LEVELS[0];

  const dimColor  = isDark ? 'rgba(255,255,255,0.3)'  : 'rgba(26,26,46,0.3)';
  const boxBg     = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(26,26,46,0.03)';
  const dividerBg = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(26,26,46,0.07)';

  const prevAllPassed = useRef(false);
  const boxScale      = useSharedValue(1);

  useEffect(() => {
    if (!prevAllPassed.current && allPassed) {
      boxScale.value = withSequence(
        withSpring(1.025, { damping: 4, stiffness: 200 }),
        withSpring(1,     { damping: 8 }),
      );
    }
    prevAllPassed.current = allPassed;
  }, [allPassed]);

  const boxStyle = useAnimatedStyle(() => ({
    transform: [{ scale: boxScale.value }],
  }));

  return (
    <Animated.View style={[boxStyle, {
      marginTop: 4,
      marginBottom: 14,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: color,
      backgroundColor: boxBg,
      padding: 14,
      ...(Platform.OS === 'web' ? { boxShadow: `0 0 14px ${color}28` } : {}),
    }]}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <View style={{
            width: 28, height: 28, borderRadius: 8,
            backgroundColor: color + '22',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name={icon} size={16} color={color} />
          </View>
          <Text style={{ fontSize: 12, color: dimColor, fontWeight: '500' }}>Password Strength</Text>
        </View>
        <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, backgroundColor: color + '22' }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color }}>{label}</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: dividerBg, marginBottom: 6 }} />

      {/* Rules */}
      {RULES.map(({ key, label: ruleLabel }) => (
        <PwCheckItem key={key} passed={!!pwChecks[key]} label={ruleLabel} dimColor={dimColor} />
      ))}
    </Animated.View>
  );
};

export default PasswordStrengthChecker;
