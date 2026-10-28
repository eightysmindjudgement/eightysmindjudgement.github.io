(() => {
  'use strict';
  const sharing = document.querySelector('.puzzle-sharing');
  const gameUrl = sharing.dataset.shareUrl || 'https://eightysmindjudgement.github.io/emj-puzzle.html';
  const shareTitle = sharing.dataset.shareTitle || 'EMJ PUZZLE';
  const shareText = sharing.dataset.shareText || '無料で遊べるEMJ PUZZLE！ぜひ遊んでみてください。';
  const byId = id => document.getElementById(id);
  const status = byId('puzzle-share-status');
  const field = byId('puzzle-share-url');
  function manualCopy(message) {
    status.textContent = message;
    field.value = window.location.href;
    byId('puzzle-copy-fallback').hidden = false;
    field.focus();
    field.select();
  }
  field.addEventListener('click', () => field.select());
  byId('puzzle-link-copy').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      byId('puzzle-copy-fallback').hidden = true;
      status.textContent = 'リンクをコピーしました';
    } catch (_) {
      manualCopy('コピーできませんでした。下のURLを手動でコピーしてください。');
    }
  });
  byId('puzzle-share').addEventListener('click', async () => {
    if (!navigator.share) {
      status.textContent = 'この環境では共有メニューを利用できません。リンクコピーボタンをご利用ください。';
      return;
    }
    try {
      await navigator.share({ title: shareTitle, text: shareText, url: gameUrl });
      status.textContent = '共有メニューでの操作が完了しました';
    } catch (error) {
      if (error.name !== 'AbortError') status.textContent = '共有できませんでした。リンクコピーボタンをご利用ください。';
    }
  });

  // Local QR encoder: version 4, error correction L, byte mode, mask 0.
  // This fixed version has 80 data bytes and one 20-byte Reed–Solomon block.
  // Only the canonical ASCII URL is encoded; no network or image asset is used.
  function drawQr() {
    const bits = [];
    const append = (value, count) => { for (let i = count - 1; i >= 0; i--) bits.push((value >>> i) & 1); };
    append(4, 4);
    append(gameUrl.length, 8);
    for (const char of gameUrl) append(char.charCodeAt(0), 8);
    append(0, 4);
    while (bits.length % 8) bits.push(0);
    const data = [];
    for (let i = 0; i < bits.length; i += 8) data.push(bits.slice(i, i + 8).reduce((a, b) => a * 2 + b, 0));
    for (let i = 0; data.length < 80; i++) data.push(i % 2 ? 0x11 : 0xec);
    const multiply = (a, b) => {
      let result = 0;
      for (; b; b >>>= 1) {
        if (b & 1) result ^= a;
        a <<= 1;
        if (a & 256) a ^= 0x11d;
      }
      return result;
    };
    let generator = [1], root = 1;
    for (let i = 0; i < 20; i++) {
      const next = Array(generator.length + 1).fill(0);
      generator.forEach((value, j) => { next[j] ^= value; next[j + 1] ^= multiply(value, root); });
      generator = next;
      root = multiply(root, 2);
    }
    const parity = Array(20).fill(0);
    for (const byte of data) {
      const factor = byte ^ parity.shift();
      parity.push(0);
      for (let j = 0; j < 20; j++) parity[j] ^= multiply(generator[j + 1], factor);
    }
    const stream = [];
    for (const byte of data.concat(parity)) for (let i = 7; i >= 0; i--) stream.push((byte >>> i) & 1);
    const size = 33;
    const matrix = Array.from({ length: size }, () => Array(size).fill(null));
    const set = (x, y, value) => { matrix[y][x] = value ? 1 : 0; };
    for (const [cx, cy] of [[3, 3], [29, 3], [3, 29]]) {
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx, y = cy + dy, distance = Math.max(Math.abs(dx), Math.abs(dy));
        if (x >= 0 && y >= 0 && x < size && y < size) set(x, y, distance !== 2 && distance !== 4);
      }
    }
    for (let i = 8; i < size - 8; i++) { set(i, 6, i % 2 === 0); set(6, i, i % 2 === 0); }
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(26 + dx, 26 + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    // L/mask-0 format information, including BCH and format XOR mask.
    const format = 0x77c4;
    const bit = i => (format >>> i) & 1;
    for (let i = 0; i <= 5; i++) set(8, i, bit(i));
    set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
    for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(i));
    set(8, size - 8, 1);
    let index = 0, upward = true;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let row = 0; row < size; row++) {
        const y = upward ? size - 1 - row : row;
        for (let offset = 0; offset < 2; offset++) {
          const x = right - offset;
          if (matrix[y][x] === null) set(x, y, (stream[index++] || 0) ^ ((x + y) % 2 === 0 ? 1 : 0));
        }
      }
      upward = !upward;
    }
    const canvas = byId('puzzle-qr'), context = canvas.getContext('2d');
    context.fillStyle = '#fff'; context.fillRect(0, 0, 246, 246);
    context.fillStyle = '#000';
    matrix.forEach((row, y) => row.forEach((value, x) => { if (value) context.fillRect((x + 4) * 6, (y + 4) * 6, 6, 6); }));
  }
  let qrReady = false;
  const panel = byId('puzzle-qr-panel');
  panel.addEventListener('close', () => byId('puzzle-qr-toggle').setAttribute('aria-expanded', 'false'));
  byId('puzzle-qr-close').addEventListener('click', () => panel.close());
  panel.addEventListener('click', event => {
    const bounds = panel.getBoundingClientRect();
    if (event.target === panel && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) panel.close();
  });
  byId('puzzle-qr-toggle').addEventListener('click', () => {
    try {
      if (!qrReady) { drawQr(); qrReady = true; }
      if (panel.open) panel.close();
      else panel.showModal();
      byId('puzzle-qr-toggle').setAttribute('aria-expanded', String(panel.open));
    } catch (_) {
      status.textContent = 'QRコードを表示できませんでした。リンクコピーボタンをご利用ください。';
    }
  });
})();
