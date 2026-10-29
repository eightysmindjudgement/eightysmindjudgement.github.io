(() => {
    'use strict';
    const defaults = { fontSize: 18, fontWeight: '400', lineHeight: 1.6, letterSpacing: 0, textAlign: 'left', color: '#f2f2f2', background: '#20252d', borderColor: '#8795a8', margin: 16, padding: 24, gap: 16, width: 100, height: 340, direction: 'column', justify: 'center', align: 'stretch' };
    let state = { ...defaults };
    const fields = {
        typography: [ ['fontSize', '文字サイズ (px)', 10, 72, 1], ['fontWeight', '文字の太さ', {100:'100',200:'200',300:'300',400:'400 / Regular',500:'500',600:'600',700:'700 / Bold',800:'800',900:'900'}], ['lineHeight', '行間 (倍)', 1, 3, .1], ['letterSpacing', '文字間隔 (px)', -2, 12, .1], ['textAlign', '文字の配置', {left:'左揃え',center:'中央揃え',right:'右揃え'}] ],
        color: [ ['color', '文字色'], ['background', '背景色'], ['borderColor', '枠線色'] ],
        spacing: [ ['margin', '外側の余白 / margin (px)', 0, 80, 1], ['padding', '内側の余白 / padding (px)', 0, 80, 1], ['gap', '部品の間隔 / gap (px)', 0, 80, 1] ],
        layout: [ ['width', '横幅 / 余白を除く領域に対する割合 (%)', 20, 100, 1], ['height', '高さ (px)', 120, 720, 1], ['direction', '並び方向', {row:'横並び / row',column:'縦並び / column'}], ['justify', '主軸の配置 / justify-content', {'flex-start':'先頭','center':'中央','flex-end':'末尾','space-between':'両端に配置','space-around':'均等な余白','space-evenly':'均等な間隔'}], ['align', '交差軸の位置合わせ / align-items', {'stretch':'引き伸ばし','flex-start':'先頭','center':'中央','flex-end':'末尾'}] ]
    };
    const code = document.getElementById('lab-code');
    const frame = document.getElementById('lab-preview');
    const tabs = [...document.querySelectorAll('[data-category]')];
    const copyStatus = document.getElementById('lab-copy-status');
    // An isolated document keeps both shared site CSS and preview CSS out of each other's scope.
    const doc = frame.contentDocument;
    doc.open();
    doc.write('<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>html{background:#dce1e8}body{margin:0;padding:1px;overflow:auto}</style><style id="sample-style"></style></head><body><div class="wdl-sample"><h2 class="wdl-heading">Design your next idea.</h2><p class="wdl-text">文字、色、余白、配置。小さな変化を組み合わせて、あなたらしいデザインへ。</p><button class="wdl-button" type="button">CREATE SOMETHING</button></div></body></html>');
    doc.close();
    const sampleStyle = doc.getElementById('sample-style');
    function generateCSS() {
        return `.wdl-sample {\n  box-sizing: border-box;\n  display: flex;\n  flex-direction: ${state.direction};\n  justify-content: ${state.justify};\n  align-items: ${state.align};\n  width: calc((100% - ${state.margin * 2}px) * ${state.width / 100});\n  height: ${state.height}px;\n  margin: ${state.margin}px;\n  padding: ${state.padding}px;\n  gap: ${state.gap}px;\n  overflow: auto;\n  font-family: Arial, Helvetica, sans-serif;\n  font-size: ${state.fontSize}px;\n  font-weight: ${state.fontWeight};\n  line-height: ${state.lineHeight};\n  letter-spacing: ${state.letterSpacing}px;\n  text-align: ${state.textAlign};\n  color: ${state.color};\n  background-color: ${state.background};\n  border: 2px solid ${state.borderColor};\n}\n\n.wdl-sample > .wdl-heading,\n.wdl-sample > .wdl-text,\n.wdl-sample > .wdl-button {\n  box-sizing: border-box;\n  min-width: 0;\n  flex-shrink: 0;\n  max-width: 100%;\n  margin: 0;\n  font: inherit;\n  letter-spacing: inherit;\n  text-align: inherit;\n  color: inherit;\n  overflow-wrap: anywhere;\n}\n\n.wdl-sample > .wdl-heading {\n  font-size: 1.5em;\n}\n\n.wdl-sample > .wdl-button {\n  padding: 0.6em 1em;\n  background: transparent;\n  border: 1px solid ${state.borderColor};\n  border-radius: 4px;\n  cursor: pointer;\n}`;
    }
    function render() {
        code.textContent = generateCSS();
        sampleStyle.textContent = code.textContent;
        copyStatus.textContent = '';
    }
    function sync(key) {
        document.querySelectorAll(`[data-setting="${key}"]`).forEach(input => { input.value = state[key]; input.setCustomValidity(''); input.removeAttribute('aria-invalid'); });
    }
    Object.entries(fields).forEach(([category, definitions]) => {
        const container = document.querySelector(`[data-fields="${category}"]`);
        definitions.forEach(([key, title, min, max, step]) => {
            const field = document.createElement('div');
            field.className = 'lab-field';
            const label = document.createElement('span');
            label.id = `label-${key}`;
            label.textContent = title;
            field.append(label);
            const row = document.createElement('div');
            row.className = 'lab-input-row';
            const types = typeof min === 'object' ? ['select'] : min === undefined ? ['color', 'text'] : ['range', 'number'];
            types.forEach(type => {
                const input = document.createElement(type === 'select' ? 'select' : 'input');
                input.dataset.setting = key;
                input.id = `${key}-${type}`;
                input.setAttribute('aria-labelledby', label.id);
                if (type === 'select') {
                    row.style.gridTemplateColumns = 'minmax(0, 1fr)';
                    Object.entries(min).forEach(([value, text]) => input.add(new Option(text, value)));
                } else {
                    input.type = type;
                    if (type === 'range' || type === 'number') { input.min = min; input.max = max; input.step = step; }
                    if (type === 'text') { input.maxLength = 7; input.spellcheck = false; input.setAttribute('aria-description', '#から始まる6桁のカラーコード'); }
                }
                input.value = state[key];
                input.addEventListener('input', () => {
                    let value = input.value;
                    if (type === 'text') {
                        if (!/^#[\da-f]{6}$/i.test(value)) { input.setCustomValidity('#から始まる6桁のカラーコードを入力してください'); input.setAttribute('aria-invalid', 'true'); return; }
                        value = value.toLowerCase();
                    }
                    if (type === 'number' || type === 'range') {
                        if (value === '' || !input.validity.valid) return;
                        value = Number(value);
                    }
                    state[key] = value;
                    sync(key);
                    render();
                    document.getElementById('lab-status').textContent = '';
                });
                input.addEventListener('change', () => {
                    if (!input.validity.valid || input.value === '') { sync(key); document.getElementById('lab-status').textContent = '入力範囲・形式を確認してください。最後の有効な値に戻しました。'; }
                });
                row.append(input);
            });
            field.append(row);
            container.append(field);
        });
    });
    function selectCategory(category) {
        if (!Object.hasOwn(fields, category)) category = 'typography';
        tabs.forEach(tab => {
            const active = tab.dataset.category === category;
            tab.setAttribute('aria-selected', String(active));
            tab.tabIndex = active ? 0 : -1;
            document.getElementById(`panel-${tab.dataset.category}`).hidden = !active;
        });
    }
    function activate(tab) {
        selectCategory(tab.dataset.category);
        history.replaceState(null, '', `#${tab.dataset.category}`);
    }
    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => activate(tab));
        tab.addEventListener('keydown', event => {
            const destinations = { ArrowRight: (index + 1) % 4, ArrowLeft: (index + 3) % 4, Home: 0, End: 3 };
            if (!(event.key in destinations)) return;
            event.preventDefault();
            const next = tabs[destinations[event.key]];
            activate(next);
            next.focus();
        });
    });
    window.addEventListener('hashchange', () => selectCategory(location.hash.slice(1)));
    document.getElementById('lab-reset').addEventListener('click', () => {
        state = { ...defaults };
        Object.keys(state).forEach(sync);
        render();
        document.getElementById('lab-status').textContent = 'すべての設定を初期値に戻しました。';
    });
    document.getElementById('lab-copy').addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(code.textContent);
            copyStatus.textContent = 'CSSをコピーしました。';
        } catch {
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(code);
            selection.removeAllRanges();
            selection.addRange(range);
            copyStatus.textContent = 'コピーできませんでした。選択されたCSSを手動でコピーしてください。';
        }
    });
    selectCategory(location.hash.slice(1));
    render();
})();
