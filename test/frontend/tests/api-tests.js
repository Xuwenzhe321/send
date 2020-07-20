/* global DEFAULTS */
import assert from 'assert';
import Archive from '../../../app/archive';
import * as api from '../../../app/api';
import Keychain from '../../../app/keychain';

const encoder = new TextEncoder();
const plaintext = new Archive([new Blob([encoder.encode('hello world!')])]);
const metadata = {
  name: 'test.txt',
  type: 'text/plain'
};

describe('API', function() {
  describe('websocket upload', function() {
    it('returns file info on success', async function() {
      const keychain = new Keychain();
      const enc = await keychain.encryptStream(plaintext.stream);
      const meta = await keychain.encryptMetadata(metadata);
      const verifierB64 = await keychain.authKeyB64();
      const p = function() {};
      const up = api.uploadWs(
        enc,
        meta,
        verifierB64,
        DEFAULTS.EXPIRE_SECONDS,
        1,
        null,
        p
      );

      const result = await up.result;
      assert.ok(result.url);
      assert.ok(result.id);
      assert.ok(result.ownerToken);
    });

    it('can be cancelled', async function() {
      const keychain = new Keychain();
      const enc = await keychain.encryptStream(plaintext.stream);
      const meta = await keychain.encryptMetadata(metadata);
      const verifierB64 = await keychain.authKeyB64();
      const p = function() {};
      const up = api.uploadWs(
        enc,
        meta,
        verifierB64,
        DEFAULTS.EXPIRE_SECONDS,
        null,
        p
      );

      up.cancel();
      try {
        await up.result;
        assert.fail('not cancelled');
      } catch (e) {
        assert.equal(e.message, '0');
      }
    });
  });
});
