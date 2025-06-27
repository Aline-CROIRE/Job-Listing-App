
import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

const Placeholder = ({ width, height, style }) => {
  const animatedValue = new Animated.Value(0);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1], // Pulsing from 50% to 100% opacity
  });

  return (
    <Animated.View style={[{ width, height, backgroundColor: '#222', borderRadius: 8 }, style, { opacity }]} />
  );
};

// This is the main component that lays out the skeleton screen
export default function ProfileSkeleton() {
  return (
    <View style={styles.container}>
      {/* Avatar */}
      <View style={styles.avatar} />

      {/* Name and Email */}
      <Placeholder width="60%" height={28} style={{ marginTop: 20 }} />
      <Placeholder width="75%" height={18} style={{ marginTop: 10 }} />

      {/* Buttons */}
      <View style={styles.buttonRow}>
        <Placeholder width={140} height={40} style={{ borderRadius: 20 }} />
        <Placeholder width={140} height={40} style={{ borderRadius: 20 }} />
      </View>

      {/* Details Section */}
      <View style={styles.detailsContainer}>
        {/* Bio */}
        <Placeholder width={60} height={14} />
        <Placeholder width="95%" height={16} style={{ marginTop: 8 }} />
        <Placeholder width="80%" height={16} style={{ marginTop: 6 }} />

        {/* Section Header (e.g., Skills) */}
        <Placeholder width={120} height={22} style={{ marginTop: 30, borderRadius: 4 }} />

        {/* Tags */}
        <View style={styles.tagWrap}>
          <Placeholder width={80} height={32} style={{ borderRadius: 16 }} />
          <Placeholder width={100} height={32} style={{ borderRadius: 16 }} />
          <Placeholder width={70} height={32} style={{ borderRadius: 16 }} />
        </View>

        {/* Section Header (e.g., Experience) */}
        <Placeholder width={150} height={22} style={{ marginTop: 30, borderRadius: 4 }} />

        {/* Card */}
        <View style={styles.card}>
            <Placeholder width="70%" height={20} />
            <Placeholder width="50%" height={16} style={{ marginTop: 6 }} />
            <Placeholder width="90%" height={14} style={{ marginTop: 12 }} />
            <Placeholder width="85%" height={14} style={{ marginTop: 6 }} />
        </View>
      </View>
    </View>
  );
}

// Styles designed to match your main profile screen's layout
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    padding: 20,
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#1a1a1a',
    marginTop: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 30,
    marginBottom: 30,
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: '#222',
    paddingVertical: 15,
  },
  detailsContainer: {
    width: '100%',
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 15,
    gap: 10,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 15,
    marginTop: 15,
    width: '100%',
    gap: 5,
  },
});