import React, { useEffect, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import DiagramCanvas from '../DiagramCanvas';
import CodePlayground from './CodePlayground';
import Icon from 'react-native-vector-icons/Ionicons';

// Mermaid.js renderer (web only — loads from CDN)
function MermaidDiagram({ definition }) {
  const containerRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!definition || !containerRef.current) return;

    const render = async () => {
      try {
        if (!window.mermaid) {
          await loadMermaid();
        }
        window.mermaid.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'loose' });
        const id = `mm_${Date.now()}`;
        const { svg } = await window.mermaid.render(id, definition);
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (e) {
        setError('Diagram render failed');
      }
    };

    render();
  }, [definition]);

  if (error) return <Text style={{ color: '#ef4444', fontSize: 12 }}>{error}</Text>;

  return <div ref={containerRef} style={{ width: '100%', overflowX: 'auto' }} />;
}

function loadMermaid() {
  return new Promise((resolve, reject) => {
    if (window.mermaid) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Build a Mermaid flowchart definition from chunk's diagram nodes/edges
function buildMermaidDef(diagram) {
  if (!diagram?.nodes?.length) return null;
  const lines = ['flowchart LR'];
  diagram.nodes.forEach((n) => {
    const shape = n.shape === 'diamond' ? `{${n.label}}` : n.shape === 'oval' ? `((${n.label}))` : `[${n.label}]`;
    lines.push(`  ${n.id}${shape}`);
  });
  (diagram.edges || []).forEach((e) => {
    const label = e.label ? `|${e.label}|` : '';
    lines.push(`  ${e.from} -->${label} ${e.to}`);
  });
  return lines.join('\n');
}

// Slide bullets renderer
function SlideBullets({ bullets = [], title = '' }) {
  return (
    <View style={styles.slideContainer}>
      {!!title && <Text style={styles.slideTitle}>{title}</Text>}
      {bullets.map((b, i) => (
        <View key={i} style={styles.bulletRow}>
          <View style={styles.bulletDot} />
          <Text style={styles.bulletText}>{b}</Text>
        </View>
      ))}
    </View>
  );
}

// Whiteboard header label
function WhiteboardLabel({ label, icon }) {
  return (
    <View style={styles.wbLabel}>
      <Icon name={icon} size={13} color='#60a5fa' />
      <Text style={styles.wbLabelText}>{label}</Text>
    </View>
  );
}

export default function ClassroomWhiteboard({ chunk, style }) {
  if (!chunk) {
    return (
      <View style={[styles.empty, style]}>
        <Icon name="easel-outline" size={40} color='#1e293b' />
        <Text style={styles.emptyText}>Whiteboard</Text>
        <Text style={styles.emptySubText}>Diagrams & code will appear here</Text>
      </View>
    );
  }

  const mode = chunk.visual_mode || chunk.visualMode || 'none';
  const diagram = chunk.diagram;
  const codeEx = chunk.code_example || chunk.codeExample;
  const slideBullets = chunk.slide_bullets || chunk.slideBullets || [];
  const whiteboardText = chunk.whiteboard_explanation || chunk.whiteboardExplanation || '';

  return (
    <ScrollView style={[styles.container, style]} showsVerticalScrollIndicator={false}>

      {/* Code */}
      {(mode === 'code' || codeEx?.snippet) && codeEx && (
        <View style={styles.section}>
          <WhiteboardLabel label="Code Example" icon="code-slash-outline" />
          <CodePlayground
            snippet={codeEx.snippet || ''}
            language={codeEx.language || 'text'}
            explanation={codeEx.explanation || ''}
          />
        </View>
      )}

      {/* Diagram / Flowchart */}
      {(mode === 'diagram' || mode === 'flowchart') && diagram?.nodes?.length > 0 && (
        <View style={styles.section}>
          <WhiteboardLabel label={mode === 'flowchart' ? 'Flowchart' : 'Diagram'} icon="git-network-outline" />
          {Platform.OS === 'web' ? (
            <View style={styles.mermaidWrap}>
              <MermaidDiagram definition={buildMermaidDef(diagram)} />
            </View>
          ) : (
            <DiagramCanvas
              nodes={diagram.nodes}
              edges={diagram.edges}
              steps={diagram.steps}
              activeStep={-1}
              theme="dark"
            />
          )}
        </View>
      )}

      {/* Slide bullets */}
      {(mode === 'slide' || (mode !== 'code' && mode !== 'diagram' && mode !== 'flowchart' && slideBullets.length > 0)) && (
        <View style={styles.section}>
          <WhiteboardLabel label="Key Points" icon="list-outline" />
          <SlideBullets bullets={slideBullets} title={chunk.title || ''} />
        </View>
      )}

      {/* Whiteboard notes */}
      {(mode === 'whiteboard' || (mode !== 'code' && mode !== 'diagram' && mode !== 'flowchart' && mode !== 'slide' && whiteboardText)) && (
        <View style={styles.section}>
          <WhiteboardLabel label="Board Notes" icon="pencil-outline" />
          <View style={styles.boardNotes}>
            <Text style={styles.boardText}>{whiteboardText}</Text>
          </View>
        </View>
      )}

      {/* Key terms */}
      {(chunk.key_terms || chunk.keyTerms || []).length > 0 && (
        <View style={styles.section}>
          <WhiteboardLabel label="Key Terms" icon="bookmark-outline" />
          <View style={styles.termsWrap}>
            {(chunk.key_terms || chunk.keyTerms || []).map((t, i) => (
              <View key={i} style={styles.termChip}>
                <Text style={styles.termText}>{t}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Empty state when no visual content */}
      {mode === 'none' && !codeEx && !diagram?.nodes?.length && !slideBullets.length && !whiteboardText && (
        <View style={styles.emptyInner}>
          <Icon name="chatbubble-ellipses-outline" size={32} color='#334155' />
          <Text style={styles.emptySubText}>Listen to the explanation</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyInner: {
    alignItems: 'center',
    padding: 32,
    gap: 10,
  },
  emptyText: {
    color: '#334155',
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubText: {
    color: '#475569',
    fontSize: 13,
    textAlign: 'center',
  },
  section: {
    marginBottom: 16,
    gap: 8,
  },
  wbLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  wbLabelText: {
    color: '#60a5fa',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  mermaidWrap: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    overflow: 'hidden',
  },
  slideContainer: {
    backgroundColor: 'rgba(30,41,59,0.6)',
    borderRadius: 8,
    padding: 14,
    gap: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  slideTitle: {
    color: '#f1f5f9',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#3b82f6',
    marginTop: 7,
    flexShrink: 0,
  },
  bulletText: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
  },
  boardNotes: {
    backgroundColor: 'rgba(30,41,59,0.6)',
    borderRadius: 8,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#8b5cf6',
  },
  boardText: {
    color: '#e2e8f0',
    fontSize: 13,
    lineHeight: 22,
  },
  termsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  termChip: {
    backgroundColor: 'rgba(99,102,241,0.15)',
    borderWidth: 1,
    borderColor: '#4338ca',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  termText: {
    color: '#a5b4fc',
    fontSize: 12,
    fontWeight: '500',
  },
});
