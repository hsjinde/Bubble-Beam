// Generate reference QR matrices with an INDEPENDENT implementation.
//
// Uses the Kazuhiko Arase QRCode library that ships vendored inside npm
// (qrcode-terminal). Nothing here shares code with our Python encoder, so a
// module-for-module match proves our data placement, mask functions, format
// information layout, block interleaving and Reed-Solomon encoding are all
// standard rather than merely self-consistent.
//
// Output: JSONL on stdout, one record per (version, ecLevel, mask).

const path = require('path');
const crypto = require('crypto');

const VENDOR = path.join(
  process.execPath.replace(/\/bin\/node$/, ''),
  'lib/node_modules/npm/node_modules/qrcode-terminal/vendor/QRCode'
);

// The vendored copy has one typo: its version 15 / level H row is
// [11, 36, 12], which sums to 396 codewords, but a version 15 matrix holds 655.
// The missing second group is [7, 37, 13]. Every other row in the 40x4 table
// agrees with the geometric codeword count, so this is patched rather than
// treated as a disagreement. Must be done before index.js is required, so the
// encoder picks up the corrected function from the module cache.
const QRRSBlock = require(VENDOR + '/QRRSBlock.js');
const _origGetRSBlocks = QRRSBlock.getRSBlocks;
QRRSBlock.getRSBlocks = function (typeNumber, errorCorrectLevel) {
  if (typeNumber === 15 && errorCorrectLevel === 2 /* H */) {
    const blocks = [];
    for (let i = 0; i < 11; i++) blocks.push({ totalCount: 36, dataCount: 12 });
    for (let i = 0; i < 7; i++) blocks.push({ totalCount: 37, dataCount: 13 });
    return blocks;
  }
  return _origGetRSBlocks.call(this, typeNumber, errorCorrectLevel);
};

const QRCode = require(VENDOR + '/index.js');
const QRUtil = require(VENDOR + '/QRUtil.js');
const QRMode = require(VENDOR + '/QRMode.js');

const EC_LEVELS = { L: 1, M: 0, Q: 3, H: 2 };

// Deterministic payload generator so Python can be re-run against the same data.
function lcg(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s;
  };
}

function makePayload(len, seed) {
  const rnd = lcg(seed);
  // Printable ASCII keeps charCodeAt() == byte value in the vendored library.
  let out = '';
  for (let i = 0; i < len; i++) out += String.fromCharCode(32 + (rnd() % 95));
  return out;
}

function capacityBytes(version, ecName) {
  const blocks = QRRSBlock.getRSBlocks(version, EC_LEVELS[ecName]);
  let totalData = 0;
  for (const b of blocks) totalData += b.dataCount;
  const cc = QRUtil.getLengthInBits(QRMode.MODE_8BIT_BYTE, version);
  return Math.floor((totalData * 8 - 4 - cc) / 8);
}

const versions = process.argv[2]
  ? process.argv[2].split(',').map(Number)
  : Array.from({ length: 40 }, (_, i) => i + 1);

for (const version of versions) {
  for (const ecName of ['L', 'M', 'Q', 'H']) {
    const cap = capacityBytes(version, ecName);
    // Three payload sizes: full, roughly half, and short (exercises padding).
    const lengths = [cap, Math.max(1, Math.floor(cap / 2)), Math.min(cap, 3)];
    for (let li = 0; li < lengths.length; li++) {
      const len = lengths[li];
      const payload = makePayload(len, version * 10007 + ecName.charCodeAt(0) * 101 + li);
      for (let mask = 0; mask < 8; mask++) {
        const qr = new QRCode(version, EC_LEVELS[ecName]);
        qr.addData(payload);
        qr.makeImpl(false, mask);
        const n = qr.getModuleCount();
        const rows = [];
        for (let r = 0; r < n; r++) {
          let row = '';
          for (let c = 0; c < n; c++) row += qr.isDark(r, c) ? '1' : '0';
          rows.push(row);
        }
        const digest = crypto
          .createHash('sha256')
          .update(rows.join('\n'))
          .digest('hex');
        process.stdout.write(
          JSON.stringify({
            version,
            ec: ecName,
            mask,
            size: n,
            payload_hex: Buffer.from(payload, 'latin1').toString('hex'),
            sha256: digest,
          }) + '\n'
        );
      }
    }
  }
}
