import React, {useEffect, useRef, useState} from 'react';
import {View, StyleSheet, ActivityIndicator} from 'react-native';
import WebView from 'react-native-webview';
import {CHART_HTML} from '../assets/chartHtml';
import {Colors} from '../theme';
import type {OhlcvCandle} from '../types/dex';

interface Props {
  candles: OhlcvCandle[];
  height?: number;
  loading?: boolean;
}

export function CandlestickChart({candles, height = 320, loading = false}: Props) {
  const webViewRef = useRef<WebView>(null);
  const [ready, setReady] = useState(false);
  const pendingRef = useRef<OhlcvCandle[] | null>(null);

  // When candles change, push data to chart
  useEffect(() => {
    if (candles.length === 0) {
      return;
    }
    if (ready && webViewRef.current) {
      sendCandles(candles);
    } else {
      pendingRef.current = candles;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candles, ready]);

  const sendCandles = (data: OhlcvCandle[]) => {
    const msg = JSON.stringify({type: 'setCandles', candles: data});
    webViewRef.current?.injectJavaScript(
      `(function(){ window.dispatchEvent(new MessageEvent('message', { data: ${JSON.stringify(msg)} })); })();`,
    );
  };

  const onLoad = () => {
    setReady(true);
    if (pendingRef.current && pendingRef.current.length > 0) {
      // Small delay to ensure WebView JS has fully initialized
      setTimeout(() => {
        if (pendingRef.current) {
          sendCandles(pendingRef.current);
          pendingRef.current = null;
        }
      }, 300);
    }
  };

  return (
    <View style={[styles.container, {height}]}>
      <WebView
        ref={webViewRef}
        source={{html: CHART_HTML}}
        style={styles.webview}
        onLoad={onLoad}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        bounces={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        originWhitelist={['*']}
        allowsInlineMediaPlayback
        mixedContentMode="always"
      />
      {(loading || !ready) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: Colors.background,
  },
  webview: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
