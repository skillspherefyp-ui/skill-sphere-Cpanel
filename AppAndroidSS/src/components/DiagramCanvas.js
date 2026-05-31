import React, { useEffect, useRef, useMemo } from 'react';
import { Animated, StyleSheet, View, Text } from 'react-native';
import Svg, { Defs, Marker, Polygon, Path } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const NODE_W = 160;
const NODE_H = 54;
const COL_GAP = 88;
const ROW_GAP = 52;
const PAD = 16;
const NODES_PER_ROW = 3;

// Auto-layout: attempt BFS column assignment, fallback to row wrap
function layoutNodes(nodes, edges) {
  if (!nodes || nodes.length === 0) return [];

  // Build adjacency for BFS
  const inDegree = new Map(nodes.map((n) => [n.id, 0]));
  const adj = new Map(nodes.map((n) => [n.id, []]));
  (edges || []).forEach((e) => {
    if (inDegree.has(e.to)) inDegree.set(e.to, (inDegree.get(e.to) || 0) + 1);
    if (adj.has(e.from)) adj.get(e.from).push(e.to);
  });

  const cols = new Map();
  const sources = nodes.filter((n) => (inDegree.get(n.id) || 0) === 0);

  if (sources.length > 0) {
    const queue = sources.map((n) => ({ id: n.id, col: 0 }));
    const visited = new Set();
    while (queue.length > 0) {
      const { id, col } = queue.shift();
      if (visited.has(id)) continue;
      visited.add(id);
      cols.set(id, Math.max(col, cols.get(id) || 0));
      (adj.get(id) || []).forEach((to) => queue.push({ id: to, col: col + 1 }));
    }
    nodes.forEach((n) => { if (!cols.has(n.id)) cols.set(n.id, 0); });
  } else {
    // Cycle or disconnected — wrap rows
    nodes.forEach((n, i) => cols.set(n.id, i % NODES_PER_ROW));
  }

  // Group by column
  const colGroups = new Map();
  nodes.forEach((n) => {
    const c = cols.get(n.id) || 0;
    if (!colGroups.has(c)) colGroups.set(c, []);
    colGroups.get(c).push(n.id);
  });

  const positions = new Map();
  colGroups.forEach((ids, col) => {
    ids.forEach((id, rowIdx) => {
      const totalRows = ids.length;
      positions.set(id, {
        x: PAD + col * (NODE_W + COL_GAP),
        y: PAD + rowIdx * (NODE_H + ROW_GAP) - ((totalRows - 1) * (NODE_H + ROW_GAP)) / 2,
      });
    });
  });

  const maxCol = Math.max(...Array.from(cols.values()), 0);
  const maxRow = Math.max(...Array.from(positions.values()).map((p) => p.y + NODE_H), 0);

  return nodes.map((n) => ({
    ...n,
    ...positions.get(n.id),
  }));
}

function buildEdgePath(fromNode, toNode) {
  // Start from right edge of from, end at left edge of to
  const x1 = fromNode.x + NODE_W;
  const y1 = fromNode.y + NODE_H / 2;
  const x2 = toNode.x - 2; // leave 2px for arrowhead
  const y2 = toNode.y + NODE_H / 2;

  if (Math.abs(y1 - y2) < 8) {
    return `M ${x1} ${y1} L ${x2} ${y2}`;
  }

  // Curved bezier for vertical offsets
  const cx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`;
}

function hexToRgba(hex, alpha) {
  if (!hex || !hex.startsWith('#') || hex.length < 7) return `rgba(99,102,241,${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function DiagramCanvas({ diagramData, currentStep, isDark, width }) {
  const { nodes = [], edges = [] } = diagramData || {};
  if (nodes.length === 0) return null;

  const canvasWidth = width || 340;

  // currentStep = index of last revealed node (0-based)
  // Reveal nodes one by one: nodes[0..currentStep]
  const revealedNodeIds = useMemo(() => {
    const set = new Set();
    nodes.slice(0, Math.max(0, currentStep + 1)).forEach((n) => set.add(n.id));
    return set;
  }, [nodes, currentStep]);

  // Reveal an edge only when both its source AND target node are visible
  const revealedEdgeSources = useMemo(() => {
    const set = new Set();
    edges.forEach((e) => {
      if (revealedNodeIds.has(e.from) && revealedNodeIds.has(e.to)) {
        set.add(e.from);
      }
    });
    return set;
  }, [edges, revealedNodeIds]);

  const laidOut = useMemo(() => layoutNodes(nodes, edges), [nodes, edges]);
  const nodeMap = useMemo(() => new Map(laidOut.map((n) => [n.id, n])), [laidOut]);

  // Animation values — one opacity+scale per node, one opacity per edge
  const nodeAnims = useRef({});
  laidOut.forEach((n) => {
    if (!nodeAnims.current[n.id]) {
      nodeAnims.current[n.id] = {
        opacity: new Animated.Value(0),
        scale: new Animated.Value(0.6),
      };
    }
  });

  const edgeAnims = useRef([]);
  while (edgeAnims.current.length < edges.length) {
    edgeAnims.current.push(new Animated.Value(0));
  }

  // Trigger animations for newly revealed elements
  useEffect(() => {
    laidOut.forEach((node) => {
      if (revealedNodeIds.has(node.id)) {
        const a = nodeAnims.current[node.id];
        Animated.parallel([
          Animated.timing(a.opacity, { toValue: 1, duration: 320, useNativeDriver: true }),
          Animated.spring(a.scale, { toValue: 1, friction: 7, tension: 90, useNativeDriver: true }),
        ]).start();
      }
    });

    edges.forEach((edge, i) => {
      if (revealedEdgeSources.has(edge.from)) {
        Animated.timing(edgeAnims.current[i], {
          toValue: 1,
          duration: 500,
          useNativeDriver: false,
        }).start();
      }
    });
  }, [currentStep, revealedNodeIds, revealedEdgeSources]);

  // Compute canvas dimensions
  const maxX = laidOut.length > 0 ? Math.max(...laidOut.map((n) => n.x + NODE_W)) + PAD : NODE_W + PAD * 2;
  const rawMaxY = laidOut.length > 0 ? Math.max(...laidOut.map((n) => n.y + NODE_H)) : NODE_H;
  const minY = laidOut.length > 0 ? Math.min(...laidOut.map((n) => n.y)) : 0;
  const canvasH = rawMaxY - minY + PAD * 2;
  const yOffset = minY < PAD ? PAD - minY : 0;

  const scale = Math.min(1, (canvasWidth - 8) / maxX);

  const edgeColor = isDark ? '#64748b' : '#94a3b8';
  const arrowColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <View style={[styles.container, { width: canvasWidth }]}>
      {/* SVG layer for edges */}
      <Svg
        width={maxX * scale}
        height={(canvasH) * scale}
        viewBox={`0 ${minY < PAD ? minY - PAD : 0} ${maxX} ${canvasH}`}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        <Defs>
          <Marker id="arr" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
            <Polygon points="0 0, 7 3.5, 0 7" fill={arrowColor} />
          </Marker>
        </Defs>
        {edges.map((edge, i) => {
          const fromNode = nodeMap.get(edge.from);
          const toNode = nodeMap.get(edge.to);
          if (!fromNode || !toNode) return null;
          return (
            <AnimatedPath
              key={`edge-${i}`}
              d={buildEdgePath(fromNode, toNode)}
              stroke={edgeColor}
              strokeWidth={1.5}
              fill="none"
              markerEnd="url(#arr)"
              opacity={edgeAnims.current[i]}
            />
          );
        })}
      </Svg>

      {/* Edge labels — floated above the gap between nodes, never overlapping node boxes */}
      {edges.map((edge, i) => {
        if (!edge.label) return null;
        const fromNode = nodeMap.get(edge.from);
        const toNode = nodeMap.get(edge.to);
        if (!fromNode || !toNode || !revealedEdgeSources.has(edge.from)) return null;
        const gapLeft = (fromNode.x + NODE_W) * scale;
        const gapRight = toNode.x * scale;
        const gapWidth = Math.max(gapRight - gapLeft, 24);
        const midY = ((fromNode.y + NODE_H / 2 + toNode.y + NODE_H / 2) / 2 - (minY < PAD ? minY - PAD : 0)) * scale;
        return (
          <View key={`elabel-${i}`} style={{ position: 'absolute', left: gapLeft, top: midY - 16, width: gapWidth, alignItems: 'center' }}>
            <Text style={styles.edgeLabel}>{edge.label}</Text>
          </View>
        );
      })}

      {/* Node views — absolutely positioned for RN Animated support */}
      <View style={{ width: maxX * scale, height: canvasH * scale }}>
        {laidOut.map((node) => {
          const anim = nodeAnims.current[node.id];
          const nodeColor = node.color || (node.emphasis === 'primary' ? '#6366f1' : '#3b82f6');
          const nodeBg = isDark
            ? hexToRgba(nodeColor, 0.18)
            : hexToRgba(nodeColor, 0.12);
          const textColor = '#ffffff';
          const borderRadius = node.shape === 'oval' ? NODE_H / 2 : node.shape === 'diamond' ? 6 : 8;

          return (
            <Animated.View
              key={node.id}
              style={[
                styles.node,
                {
                  left: node.x * scale,
                  top: (node.y - (minY < PAD ? minY - PAD : 0)) * scale,
                  width: NODE_W * scale,
                  height: NODE_H * scale,
                  borderRadius: borderRadius * scale,
                  backgroundColor: nodeBg,
                  borderColor: nodeColor,
                  opacity: anim.opacity,
                  transform: [{ scale: anim.scale }],
                },
              ]}
            >
              <View style={[styles.nodeAccent, { backgroundColor: nodeColor, width: 3, borderRadius: 2 }]} />
              <Text
                style={[styles.nodeLabel, { color: textColor, fontSize: Math.max(11, 12 * scale) }]}
                numberOfLines={2}
              >
                {node.label}
              </Text>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  node: {
    position: 'absolute',
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    gap: 5,
  },
  nodeAccent: {
    height: '60%',
    minHeight: 14,
    flexShrink: 0,
  },
  nodeLabel: {
    flex: 1,
    fontWeight: '700',
    lineHeight: 16,
  },
  edgeLabel: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '700',
    textAlign: 'center',
  },
});
