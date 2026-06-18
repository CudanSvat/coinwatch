import React, {useState} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import {Colors, Spacing, FontSize, BorderRadius} from '../theme';
import type {ReleaseInfo} from '../hooks/useUpdateChecker';
import {GITHUB_REPO} from '../version';

interface Props {
  release: ReleaseInfo;
  onDismiss: () => void;
}

type Status = 'idle' | 'downloading' | 'done' | 'error';

export function UpdateModal({release, onDismiss}: Props) {
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const downloadAndInstall = async () => {
    if (Platform.OS !== 'android') {
      return;
    }
    setStatus('downloading');
    setProgress(0);

    const dirs = ReactNativeBlobUtil.fs.dirs;
    const destPath = `${dirs.DownloadDir}/coinwatch-${release.tagName}.apk`;

    try {
      await ReactNativeBlobUtil.config({
        fileCache: true,
        path: destPath,
        addAndroidDownloads: {
          useDownloadManager: false,
          notification: false,
        },
      })
        .fetch('GET', release.apkUrl)
        .progress((received, total) => {
          const r = Number(received);
          const t = Number(total);
          if (t > 0) {
            setProgress(Math.round((r / t) * 100));
          }
        });

      setStatus('done');

      // Trigger the Android package installer
      await ReactNativeBlobUtil.android.actionViewIntent(
        destPath,
        'application/vnd.android.package-archive',
      );
    } catch (e: unknown) {
      setStatus('error');
      setErrorMsg(e instanceof Error ? e.message : 'Download failed');
    }
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible
      onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.badge}>NEW VERSION</Text>
          <Text style={styles.title}>CoinWatch {release.tagName}</Text>
          <Text style={styles.subtitle}>
            A new update is available. Install it now to get the latest
            features and fixes.
          </Text>

          {release.releaseNotes ? (
            <View style={styles.notes}>
              <Text style={styles.notesText} numberOfLines={4}>
                {release.releaseNotes}
              </Text>
            </View>
          ) : null}

          {status === 'downloading' && (
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, {width: `${progress}%`}]} />
              </View>
              <Text style={styles.progressText}>Downloading... {progress}%</Text>
            </View>
          )}

          {status === 'error' && (
            <Text style={styles.errorText}>{errorMsg}</Text>
          )}

          {status === 'done' && (
            <Text style={styles.doneText}>
              Download complete — follow the install prompt
            </Text>
          )}

          {(status === 'idle' || status === 'error') && (
            <View style={styles.buttons}>
              <TouchableOpacity style={styles.updateBtn} onPress={downloadAndInstall}>
                <Text style={styles.updateBtnText}>
                  {status === 'error' ? 'Retry' : '⬇  Update Now'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss}>
                <Text style={styles.dismissBtnText}>Later</Text>
              </TouchableOpacity>
            </View>
          )}

          {status === 'downloading' && (
            <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss}>
              <Text style={styles.dismissBtnText}>Continue in background</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.source}>
            Source: github.com/{GITHUB_REPO}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: Spacing.md,
  },
  badge: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: '800',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  notes: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  notesText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    lineHeight: 18,
  },
  progressContainer: {
    gap: Spacing.xs,
  },
  progressTrack: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
  progressText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    textAlign: 'center',
  },
  errorText: {
    color: Colors.negative,
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
  doneText: {
    color: Colors.positive,
    fontSize: FontSize.sm,
    textAlign: 'center',
    fontWeight: '600',
  },
  buttons: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  updateBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  updateBtnText: {
    color: Colors.white,
    fontSize: FontSize.base,
    fontWeight: '700',
  },
  dismissBtn: {
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  dismissBtnText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  source: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textAlign: 'center',
  },
});
