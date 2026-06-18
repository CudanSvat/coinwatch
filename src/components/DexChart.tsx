import React, {useState} from 'react';
import {View, StyleSheet, ActivityIndicator, Text} from 'react-native';
import WebView from 'react-native-webview';
import {getDexScreenerEmbedUrl} from '../api/dexscreener';
import {Colors, FontSize} from '../theme';

interface Props {
  chainId: string;
  pairAddress: string;
  height?: number;
}

export function DexChart({chainId, pairAddress, height = 420}: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const embedUrl = getDexScreenerEmbedUrl(chainId, pairAddress);

  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer, {height}]}>
        <Text style={styles.errorText}>Chart unavailable</Text>
        <Text style={styles.errorSub}>Check your internet connection</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, {height}]}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}
      <WebView
        source={{uri: embedUrl}}
        style={styles.webview}
        onLoadStart={() => {
          setLoading(true);
          setError(false);
        }}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        scrollEnabled={false}
        bounces={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        nestedScrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    overflow: 'hidden',
    borderRadius: 0,
  },
  webview: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    zIndex: 10,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    color: Colors.textPrimary,
    fontSize: FontSize.base,
    fontWeight: '600',
  },
  errorSub: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
});
