const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Minimal DOM implementation to avoid external dependencies
class TextNode {
  constructor(text) {
    this.textContent = String(text);
  }
}

class Element {
  constructor(tag) {
    this.tagName = tag.toUpperCase();
    this.childNodes = [];
    this.children = [];
    this.parentNode = null;
    this.attributes = {};
    this.style = {};
    this._class = new Set();
    this.onclick = null;
    this.onkeydown = null;
  }
  appendChild(node) {
    node.parentNode = this;
    this.childNodes.push(node);
    if (node instanceof Element) this.children.push(node);
    if (this._text !== undefined) this._text = undefined;
    return node;
  }
  remove() {
    if (!this.parentNode) return;
    const c = this.parentNode.childNodes.indexOf(this);
    if (c >= 0) this.parentNode.childNodes.splice(c, 1);
    const e = this.parentNode.children.indexOf(this);
    if (e >= 0) this.parentNode.children.splice(e, 1);
    this.parentNode = null;
  }
  setAttribute(name, value) {
    this.attributes[name] = String(value);
    if (name === 'id') {
      this.id = String(value);
      document._byId[this.id] = this;
    }
  }
  getAttribute(name) { return this.attributes[name]; }
  get classList() {
    const el = this;
    return {
      add: (...cls) => cls.forEach(c => el._class.add(c)),
      remove: (...cls) => cls.forEach(c => el._class.delete(c)),
      toggle: (cls, force) => {
        if (force === undefined) {
          if (el._class.has(cls)) { el._class.delete(cls); return false; }
          el._class.add(cls); return true;
        }
        if (force) el._class.add(cls); else el._class.delete(cls);
        return force;
      },
      contains: (cls) => el._class.has(cls)
    };
  }
  get className() { return Array.from(this._class).join(' '); }
  set className(v) { this._class = new Set(String(v).split(/\s+/).filter(Boolean)); }
  get textContent() {
    if (this._text !== undefined) return this._text;
    return this.childNodes.map(n => n.textContent).join('');
  }
  set textContent(v) {
    this._text = String(v);
    this.childNodes = [];
    this.children = [];
  }
  querySelector(sel) {
    if (sel === 'img') {
      const stack = [...this.childNodes];
      while (stack.length) {
        const n = stack.shift();
        if (n instanceof Element) {
          if (n.tagName.toLowerCase() === 'img') return n;
          stack.push(...n.childNodes);
        }
      }
    }
    return null;
  }
  focus() {}
}

class Document {
  constructor() {
    this._byId = {};
    this.body = new Element('body');
  }
  createElement(tag) { return new Element(tag); }
  createTextNode(text) { return new TextNode(text); }
  getElementById(id) { return this._byId[id] || null; }
}

function createEl(tag, id) {
  const el = document.createElement(tag);
  if (id) el.setAttribute('id', id);
  document.body.appendChild(el);
  return el;
}

const document = new Document();

// Create required DOM nodes
const grid = createEl('div', 'grid');
const output = createEl('div', 'output');
['loginBtn','logoutBtn','editarBtn','borrarBtn','exportBtn','importBtn'].forEach(id => createEl('button', id));
createEl('span', 'userInfo');
createEl('div', 'editBackdrop').setAttribute('aria-hidden', 'true');
createEl('input', 'numSel');
createEl('input', 'palabra');
createEl('input', 'imagen');
createEl('button', 'guardarBtn');
createEl('button', 'cancelarBtn');
createEl('div', 'loginBackdrop').setAttribute('aria-hidden', 'true');
createEl('input', 'loginEmail');
createEl('input', 'loginPass');
createEl('button', 'loginSubmit');
createEl('button', 'loginCancel');

// Sandbox for functions extracted from app.js
const sandbox = {
  document,
  console,
  URL,
  location: { href: 'http://localhost/' },
  DOMPurify: { sanitize: s => s },
  speechSynthesis: { cancel(){}, speak(){} },
  alert: () => {},
  confirm: () => true,
  grid,
  output,
  setTimeout,
  clearTimeout
};
sandbox.window = sandbox;

// Extract required functions from app.js
const full = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
const tieneDatos = full.match(/const tieneDatos =[^]*?};\n/)[0];
const actualizarCelda = full.match(/const actualizarCelda =[^]*?};\n/)[0];
const mostrar = full.match(/const mostrar =[^]*?};\n/)[0];

const bootstrap = `let datos = {}; let datosCargados = false; let seleccionado = 1; let configCargada = true; const hablar = ()=>{}; ${tieneDatos} ${actualizarCelda} ${mostrar} window.__mostrar = mostrar;`;
vm.runInNewContext(bootstrap, sandbox);

// Build grid and simulate snapshot data
vm.runInNewContext(`for (let i=1;i<=100;i++){ const cell=document.createElement('button'); cell.className='cell'; cell.textContent=i; grid.appendChild(cell); } datos = {1:{palabra:'hola', imagenUrl:'http://example.com/img.png'}}; actualizarCelda(grid.children[0],1); datosCargados = true;`, sandbox);

// Tests
test('celda preexistente sin clase empty y mostrar agrega palabra e imagen', () => {
  const first = grid.children[0];
  assert.ok(first, 'celda creada');
  assert.strictEqual(first.classList.contains('empty'), false, 'la celda tiene datos');

  output.textContent = '';
  sandbox.__mostrar(1, false);
  assert.ok(/hola/.test(output.textContent), 'palabra mostrada');
  const img = output.querySelector('img');
  assert.ok(img, 'imagen insertada');
  assert.strictEqual(img.src, 'http://example.com/img.png');
});
