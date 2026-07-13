import { useRef, useCallback } from 'react';
import { findNodeHandle, UIManager } from 'react-native';
import { useSharedValue, useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';

/**
 * useWaveColor — diagonal wave theme transition via Reanimated.
 *
 * Each component:
 *   1. Measures its own screen position (via UIManager or onLayout fallback).
 *   2. Computes a diagonal threshold (0–0.80) from that position.
 *   3. Returns `fadeStyle` — a Reanimated animated style that drives an
 *      absoluteFill overlay from opacity 1 → 0 as the wave front passes.
 *
 * Everything runs on the UI thread (no JS bridge), so animation is smooth
 * and race-condition-free on both native RN and React Native Web.
 */
export const useWaveColor = (viewRef) => {
  const { waveProgress, isTransitioningShared, transitionThemes, screenDiagonal } = useTheme();

  // Per-component threshold stored as a SharedValue so the worklet can read it
  const threshold = useSharedValue(0);

  const measurePosition = useCallback((event) => {
    const diag = screenDiagonal || 1;

    const applyLayoutCoords = () => {
      const layout = event?.nativeEvent?.layout;
      if (layout) {
        const raw = ((layout.x || 0) + (layout.y || 0)) / diag;
        threshold.value = Math.max(0, Math.min(raw, 0.80));
      }
    };

    if (!viewRef?.current) { applyLayoutCoords(); return; }

    try {
      const handle = findNodeHandle(viewRef.current);
      if (handle == null) { applyLayoutCoords(); return; }

      UIManager.measure(handle, (_x, _y, _w, _h, pageX, pageY) => {
        if ((pageX || 0) > 0 || (pageY || 0) > 0) {
          // Native: real absolute page coords → true diagonal wave
          threshold.value = Math.max(0, Math.min((pageX + pageY) / diag, 0.80));
        } else {
          // Web: UIManager returns zeros → use layout-relative coords for stagger
          applyLayoutCoords();
        }
      });
    } catch (_) {
      applyLayoutCoords();
    }
  }, [screenDiagonal]);

  /**
   * Reanimated animated style for the old-colour overlay.
   * Runs on the UI thread — instant, no bridge, no timing race.
   *
   * opacity 1 = old colour fully visible (before wave reaches here)
   * opacity 0 = old colour gone, new theme shows through
   */
  const fadeStyle = useAnimatedStyle(() => {
    'worklet';
    if (isTransitioningShared.value === 0) return { opacity: 0 };

    const t        = threshold.value;
    const tEnd     = Math.min(t + 0.18, 1);
    const safeStart = t >= tEnd ? 0    : t;
    const safeEnd   = t >= tEnd ? 0.18 : tEnd;

    return {
      opacity: interpolate(
        waveProgress.value,
        [safeStart, safeEnd],
        [1, 0],
        Extrapolation.CLAMP,
      ),
    };
  });

  return {
    fadeStyle,
    measurePosition,
    isTransitioning: !!transitionThemes,
  };
};
