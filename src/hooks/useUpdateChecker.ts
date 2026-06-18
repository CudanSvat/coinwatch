import {useEffect, useState} from 'react';
import {APP_VERSION, GITHUB_REPO} from '../version';

export interface ReleaseInfo {
  tagName: string;
  apkUrl: string;
  releaseNotes: string;
}

function isNewer(latest: string, current: string): boolean {
  // Strip leading 'v' and compare semver numerically
  const parse = (v: string) =>
    v
      .replace(/^v/, '')
      .split('.')
      .map(n => parseInt(n, 10) || 0);
  const l = parse(latest);
  const c = parse(current);
  for (let i = 0; i < 3; i++) {
    if ((l[i] ?? 0) > (c[i] ?? 0)) {
      return true;
    }
    if ((l[i] ?? 0) < (c[i] ?? 0)) {
      return false;
    }
  }
  return false;
}

export function useUpdateChecker() {
  const [update, setUpdate] = useState<ReleaseInfo | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(
          `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
          {headers: {Accept: 'application/vnd.github+json'}},
        );
        if (!res.ok) {
          return;
        }
        const data = await res.json();
        const tagName: string = data.tag_name ?? '';
        if (!isNewer(tagName, APP_VERSION)) {
          return;
        }
        // Find the APK asset
        const apkAsset = (data.assets ?? []).find((a: {name: string}) =>
          a.name.endsWith('.apk'),
        );
        if (!apkAsset) {
          return;
        }
        setUpdate({
          tagName,
          apkUrl: apkAsset.browser_download_url,
          releaseNotes: data.body ?? '',
        });
      } catch {
        // Network failure — silently skip
      }
    };
    // Check after a short delay so app loads first
    const id = setTimeout(check, 3000);
    return () => clearTimeout(id);
  }, []);

  return {update, dismiss: () => setUpdate(null)};
}
