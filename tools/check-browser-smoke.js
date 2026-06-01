// Browser-order smoke test for LifeCity client modules.
// It executes the same script order from public/index.html inside a tiny DOM/canvas stub
// and calls draw() once. This catches errors that node --check cannot catch.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(root, 'public', 'index.html'), 'utf8');
const scripts = [...indexHtml.matchAll(/<script\s+src="js\/([^"]+\.js)"><\/script>/g)].map(m => m[1]);

if (!scripts.length) {
  console.error('[browser-smoke] No browser scripts found in public/index.html');
  process.exit(1);
}

const gradient = () => ({ addColorStop() {} });
const ctxStub = new Proxy({}, {
  get(target, prop) {
    if (prop === 'createRadialGradient' || prop === 'createLinearGradient') return gradient;
    if (prop === 'measureText') return (text) => ({ width: String(text || '').length * 8 });
    if (prop === 'canvas') return { width: 1280, height: 720 };
    return () => {};
  },
  set() { return true; }
});

function makeElement(id = '') {
  const el = {
    id,
    style: {},
    dataset: {},
    children: [],
    value: '',
    checked: false,
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    appendChild(child) { this.children.push(child); child.parentNode = this; },
    remove() {},
    addEventListener() {},
    setAttribute() {},
    removeAttribute() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
    closest() { return null; },
    focus() {},
    getContext() { return ctxStub; }
  };
  return el;
}

const elements = { game: Object.assign(makeElement('game'), { width: 1280, height: 720 }) };
const documentStub = {
  body: makeElement('body'),
  readyState: 'complete',
  getElementById(id) { return elements[id] || null; },
  createElement(tag) { return makeElement(tag); },
  querySelectorAll() { return []; },
  addEventListener() {}
};
const socketStub = { on() {}, emit() {} };
const windowStub = {
  innerWidth: 1280,
  innerHeight: 720,
  addEventListener() {},
  localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} }
};

const sandbox = {
  console,
  window: windowStub,
  document: documentStub,
  localStorage: windowStub.localStorage,
  io: () => socketStub,
  requestAnimationFrame() {},
  performance: { now: () => 0 },
  Date,
  Math,
  setTimeout() {},
  setInterval() {},
  clearTimeout() {},
  clearInterval() {}
};
sandbox.global = sandbox;
vm.createContext(sandbox);

try {
  for (const file of scripts) {
    const full = path.join(root, 'public', 'js', file);
    vm.runInContext(fs.readFileSync(full, 'utf8'), sandbox, { filename: file });
  }
  vm.runInContext('if (typeof updateAuthCameraFlight === "function") updateAuthCameraFlight(); if (typeof draw === "function") draw();', sandbox);
  console.log(`[browser-smoke] OK: ${scripts.length} browser modules loaded and draw() executed`);
} catch (err) {
  console.error('[browser-smoke] FAILED:', err && err.stack ? err.stack : err);
  process.exit(1);
}
