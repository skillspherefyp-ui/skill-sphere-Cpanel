import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const LANG_COLORS = {
  python:     '#3b82f6',
  javascript: '#f59e0b',
  typescript: '#3b82f6',
  bash:       '#10b981',
  sql:        '#8b5cf6',
  json:       '#f97316',
  yaml:       '#ec4899',
  html:       '#ef4444',
  css:        '#06b6d4',
  text:       '#6b7280',
};

// Very lightweight syntax highlighter — colours keywords/strings/comments
function tokenize(code = '', lang = 'text') {
  if (Platform.OS !== 'web') {
    // On native, just return plain text segments
    return [{ text: code, color: '#e2e8f0' }];
  }

  const tokens = [];
  const lines = code.split('\n');

  const kwMap = {
    python:     /\b(def|class|import|from|return|if|elif|else|for|while|in|not|and|or|True|False|None|with|as|try|except|finally|pass|lambda|yield)\b/g,
    javascript: /\b(const|let|var|function|return|if|else|for|while|of|in|class|import|export|default|new|this|async|await|try|catch|finally|true|false|null|undefined)\b/g,
    typescript: /\b(const|let|var|function|return|if|else|for|while|of|in|class|import|export|default|new|this|async|await|try|catch|finally|true|false|null|undefined|interface|type|enum|readonly|public|private|protected)\b/g,
    bash:       /\b(echo|cd|ls|mkdir|rm|cp|mv|grep|sed|awk|curl|chmod|sudo|export|source|if|then|fi|else|for|do|done|while)\b/g,
    sql:        /\b(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|ON|ORDER BY|GROUP BY|HAVING|INSERT|UPDATE|DELETE|CREATE|TABLE|INDEX|DROP|ALTER|AS|AND|OR|NOT|IN|LIKE|DISTINCT|COUNT|SUM|AVG|MAX|MIN)\b/gi,
  };

  lines.forEach((line, i) => {
    // Comment detection
    const isComment =
      (lang === 'python' || lang === 'bash') ? line.trimStart().startsWith('#') :
      (lang === 'javascript' || lang === 'typescript') ? line.trimStart().startsWith('//') :
      (lang === 'sql') ? line.trimStart().startsWith('--') : false;

    if (isComment) {
      tokens.push({ text: line + (i < lines.length - 1 ? '\n' : ''), color: '#6b7280' });
      return;
    }

    tokens.push({ text: line + (i < lines.length - 1 ? '\n' : ''), color: '#e2e8f0' });
  });

  return tokens;
}

export default function CodePlayground({ snippet = '', language = 'text', explanation = '' }) {
  const [copied, setCopied] = useState(false);
  const langColor = LANG_COLORS[language] || LANG_COLORS.text;
  const tokens = tokenize(snippet, language);

  const handleCopy = async () => {
    if (Platform.OS === 'web' && navigator.clipboard) {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <View style={styles.dots}>
          <View style={[styles.dot, { backgroundColor: '#ef4444' }]} />
          <View style={[styles.dot, { backgroundColor: '#f59e0b' }]} />
          <View style={[styles.dot, { backgroundColor: '#10b981' }]} />
        </View>
        <View style={[styles.langBadge, { borderColor: langColor }]}>
          <Text style={[styles.langText, { color: langColor }]}>{language.toUpperCase()}</Text>
        </View>
        {Platform.OS === 'web' && (
          <TouchableOpacity onPress={handleCopy} style={styles.copyBtn}>
            <Icon name={copied ? 'checkmark' : 'copy-outline'} size={14} color={copied ? '#10b981' : '#9ca3af'} />
            <Text style={[styles.copyText, { color: copied ? '#10b981' : '#9ca3af' }]}>
              {copied ? 'Copied!' : 'Copy'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Code area */}
      <ScrollView style={styles.codeScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.codeInner}>
          {/* Line numbers */}
          <View style={styles.lineNumbers}>
            {snippet.split('\n').map((_, i) => (
              <Text key={i} style={styles.lineNum}>{i + 1}</Text>
            ))}
          </View>
          {/* Code */}
          <View style={styles.codeContent}>
            <Text style={styles.code}>
              {tokens.map((t, i) => (
                <Text key={i} style={{ color: t.color }}>{t.text}</Text>
              ))}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Explanation */}
      {!!explanation && (
        <View style={styles.explanationBar}>
          <Icon name="information-circle-outline" size={14} color='#60a5fa' />
          <Text style={styles.explanationText}>{explanation}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1e293b',
    gap: 8,
  },
  dots: {
    flexDirection: 'row',
    gap: 5,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  langBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  langText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  copyBtn: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  copyText: {
    fontSize: 11,
  },
  codeScroll: {
    maxHeight: 280,
  },
  codeInner: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  lineNumbers: {
    minWidth: 24,
    alignItems: 'flex-end',
  },
  lineNum: {
    color: '#4b5563',
    fontSize: 12,
    lineHeight: 20,
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  codeContent: {
    flex: 1,
  },
  code: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: Platform.OS === 'web' ? "'Fira Code', 'Courier New', monospace" : undefined,
  },
  explanationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(59,130,246,0.08)',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  explanationText: {
    color: '#93c5fd',
    fontSize: 12,
    flex: 1,
  },
});
