/* global AUTH_CONFIG */
import { browserName, locale } from './utils';

async function checkCrypto() {
  try {
    const key = await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 128
      },
      true,
      ['encrypt', 'decrypt']
    );
    await crypto.subtle.exportKey('raw', key);
    await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: crypto.getRandomValues(new Uint8Array(12)),
        tagLength: 128
      },
      key,
      new ArrayBuffer(8)
    );
    await crypto.subtle.importKey(
      'raw',
      crypto.getRandomValues(new Uint8Array(16)),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    await crypto.subtle.importKey(
      'raw',
      crypto.getRandomValues(new Uint8Array(16)),
      'HKDF',
      false,
      ['deriveKey']
    );
    await crypto.subtle.generateKey(
      {
        name: 'ECDH',
        namedCurve: 'P-256'
      },
      true,
      ['deriveBits']
    );
    return true;
  } catch (err) {
    try {
      window.asmCrypto = await import('asmcrypto.js');
      await import('@dannycoates/webcrypto-liner/build/shim');
      return true;
    } catch (e) {
      return false;
    }
  }
}

function checkStreams() {
  try {
    new ReadableStream({
      pull() {}
    });
    return true;
  } catch (e) {
    return false;
  }
}

async function polyfillStreams() {
  try {
    await import('@mattiasbuelens/web-streams-polyfill');
    return true;
  } catch (e) {
    return false;
  }
}

export default async function getCapabilities() {
  const browser = browserName();
  const serviceWorker = 'serviceWorker' in navigator && browser !== 'edge';
  let crypto = await checkCrypto();
  const nativeStreams = checkStreams();
  let polyStreams = false;
  if (!nativeStreams) {
    polyStreams = await polyfillStreams();
  }
  let account = typeof AUTH_CONFIG !== 'undefined';
  try {
    account = account && !!localStorage;
  } catch (e) {
    account = false;
  }
  const share =
    typeof navigator.share === 'function' && locale().startsWith('en'); // en until strings merge

  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    navigator.standalone;

  const mobileFirefox =
    browser === 'firefox' && /mobile/i.test(navigator.userAgent);

  return {
    account,
    crypto,
    serviceWorker,
    streamUpload: nativeStreams || polyStreams,
    streamDownload:
      nativeStreams && serviceWorker && browser !== 'safari' && !mobileFirefox,
    multifile: nativeStreams || polyStreams,
    share,
    standalone
  };
}
