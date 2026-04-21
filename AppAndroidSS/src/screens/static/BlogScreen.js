import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, Platform, TextInput, ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import ThemeToggle from '../../components/ThemeToggle';
import { blogAPI } from '../../services/apiClient';

const ORANGE = '#F68B3C';
const NAVY   = '#1A1A2E';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
};

const BlogScreen = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const c = theme.colors;
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const cardBg     = isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.08)';

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await blogAPI.getPosts();
      if (res.success) setPosts(res.posts || []);
    } catch (e) {
      console.log('Blog fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const featured = posts[0];
  const rest = posts.slice(1);

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />

      <View style={[s.header, { paddingTop: Platform.OS === 'ios' ? 50 : 16 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Icon name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Blog</Text>
        <ThemeToggle iconColor="#FFFFFF" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 50 }}>

        <Text style={[s.intro, { color: c.textSecondary }]}>
          Insights on learning, career growth, AI in education, and platform updates from the SkillSphere team.
        </Text>

        {loading ? (
          <ActivityIndicator color={ORANGE} style={{ marginVertical: 40 }} />
        ) : posts.length === 0 ? (
          <View style={[s.emptyBox, { borderColor: cardBorder }]}>
            <Icon name="newspaper-outline" size={40} color={c.textSecondary} />
            <Text style={[s.emptyText, { color: c.textSecondary }]}>No articles yet. Check back soon!</Text>
          </View>
        ) : (
          <>
            {/* Featured post */}
            {featured && (
              <TouchableOpacity
                style={[s.featuredCard, { backgroundColor: NAVY, borderColor: ORANGE + '30' }]}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('BlogPost', { postId: featured.id })}>
                <View style={[s.featuredTag, { backgroundColor: (featured.tagColor || ORANGE) + '30' }]}>
                  <Icon name={featured.coverIcon || 'newspaper-outline'} size={13} color={featured.tagColor || ORANGE} />
                  <Text style={[s.tagText, { color: featured.tagColor || ORANGE }]}>{featured.tag}</Text>
                </View>
                <Text style={s.featuredTitle}>{featured.title}</Text>
                <Text style={s.featuredExcerpt} numberOfLines={3}>{featured.excerpt}</Text>
                <View style={s.metaRow}>
                  <Icon name="person-circle-outline" size={13} color="rgba(255,255,255,0.5)" />
                  <Text style={s.metaText}>{featured.author}</Text>
                  <View style={s.metaDot} />
                  <Text style={s.metaText}>{formatDate(featured.publishedAt)}</Text>
                  <View style={s.metaDot} />
                  <Text style={s.metaText}>{featured.readTime}</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Post list */}
            {rest.length > 0 && (
              <Text style={[s.sectionLabel, { color: c.textPrimary }]}>Recent Articles</Text>
            )}
            {rest.map(post => (
              <TouchableOpacity key={post.id}
                style={[s.postCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('BlogPost', { postId: post.id })}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
                  <View style={[s.postIconBox, { backgroundColor: (post.tagColor || ORANGE) + '18' }]}>
                    <Icon name={post.coverIcon || 'newspaper-outline'} size={20} color={post.tagColor || ORANGE} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={[s.postTag, { backgroundColor: (post.tagColor || ORANGE) + '18' }]}>
                      <Text style={[s.tagText, { color: post.tagColor || ORANGE }]}>{post.tag}</Text>
                    </View>
                    <Text style={[s.postTitle, { color: c.textPrimary }]}>{post.title}</Text>
                    <Text style={[s.postExcerpt, { color: c.textSecondary }]} numberOfLines={2}>
                      {post.excerpt}
                    </Text>
                    <View style={s.metaRow}>
                      <Text style={[s.metaText, { color: c.textSecondary }]}>{formatDate(post.publishedAt)}</Text>
                      <View style={[s.metaDot, { backgroundColor: c.textSecondary }]} />
                      <Text style={[s.metaText, { color: c.textSecondary }]}>{post.readTime}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Newsletter */}
        <View style={[s.newsletter, {
          backgroundColor: isDark ? 'rgba(246,139,60,0.08)' : 'rgba(246,139,60,0.06)',
          borderColor: ORANGE + '30',
        }]}>
          <Icon name="mail-outline" size={26} color={ORANGE} style={{ marginBottom: 10 }} />
          <Text style={[s.nlTitle, { color: c.textPrimary }]}>Stay in the Loop</Text>
          <Text style={[s.nlSub, { color: c.textSecondary }]}>
            Get new articles, platform updates, and learning tips delivered to your inbox.
          </Text>
          {subscribed ? (
            <View style={s.subscribedBadge}>
              <Icon name="checkmark-circle" size={16} color="#10B981" />
              <Text style={{ color: '#10B981', fontSize: 13, fontWeight: '700', marginLeft: 6 }}>
                You're subscribed!
              </Text>
            </View>
          ) : (
            <View style={s.nlRow}>
              <TextInput
                style={[s.nlInput, {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(26,26,46,0.12)',
                  color: c.textPrimary,
                }]}
                placeholder="your@email.com"
                placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(26,26,46,0.3)'}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={s.nlBtn}
                disabled={subscribing}
                onPress={async () => {
                  if (!email.includes('@')) return;
                  setSubscribing(true);
                  try {
                    await blogAPI.subscribe(email);
                    setSubscribed(true);
                  } catch (e) {
                    setSubscribed(true); // still show success to user
                  } finally {
                    setSubscribing(false);
                  }
                }}>
                <Text style={s.nlBtnText}>Subscribe</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  header: {
    backgroundColor: NAVY, paddingHorizontal: 16, paddingBottom: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  intro: { fontSize: 14, lineHeight: 22, marginBottom: 20 },
  emptyBox: {
    borderWidth: 1, borderRadius: 16, padding: 40,
    alignItems: 'center', marginBottom: 24, gap: 12,
  },
  emptyText: { fontSize: 14, textAlign: 'center' },
  featuredCard: {
    borderRadius: 18, borderWidth: 1, padding: 20, marginBottom: 24,
  },
  featuredTag: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 12,
  },
  tagText: { fontSize: 11, fontWeight: '700' },
  featuredTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', lineHeight: 24, marginBottom: 10 },
  featuredExcerpt: { color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 21, marginBottom: 14 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  metaText: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  metaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.4)' },
  sectionLabel: { fontSize: 16, fontWeight: '800', marginBottom: 14 },
  postCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 12 },
  postIconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', flexShrink: 0, marginTop: 2 },
  postTag: {
    alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 6,
  },
  postTitle: { fontSize: 14, fontWeight: '700', lineHeight: 20, marginBottom: 6 },
  postExcerpt: { fontSize: 13, lineHeight: 19, marginBottom: 8 },
  newsletter: { borderRadius: 18, borderWidth: 1, padding: 20, alignItems: 'center', marginTop: 8 },
  nlTitle: { fontSize: 17, fontWeight: '800', marginBottom: 8 },
  nlSub: { fontSize: 13, lineHeight: 21, textAlign: 'center', marginBottom: 16 },
  nlRow: { flexDirection: 'row', gap: 8, width: '100%' },
  nlInput: {
    flex: 1, borderRadius: 10, borderWidth: 1.5,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 13,
  },
  nlBtn: {
    backgroundColor: ORANGE, borderRadius: 10, paddingHorizontal: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  nlBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  subscribedBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
});

export default BlogScreen;
