/* ДЗ1 «Дробь — это количество» — логика 6 механик
   Данные: data.json (Методист). Математику не менять.
   v2-заглушки для живой числовой прямой — помечены /* V2 * /  */

'use strict';

// ── УТИЛИТЫ ──────────────────────────────────────────────────────────────────

function makeFrac(n, d) {
  return `<span class="frac lk-mono"><span class="fn">${n}</span><span class="fd">${d}</span></span>`;
}

function makeMixed(w, n, d) {
  return `<span class="mixed-num lk-mono"><span>${w}</span>${makeFrac(n, d)}</span>`;
}

// Разметка текста от Методиста (мини-маркап). Математику не меняем — только вид.
//   **акцент**  → смысловой акцент (фиолет, .lk-hl)   — макс 1–2 на блок
//   `моно`      → математика моноширинным (.lk-mono)
//   7/4         → двухэтажная дробь (автоматически)
// Порядок: акцент → моно → дроби (дроби внутри акцента/моно тоже становятся красивыми).
function fmtInline(text) {
  if (text == null) return '';
  return String(text)
    .replace(/\*\*(.+?)\*\*/g, (_, s) => `<span class="lk-hl">${s}</span>`)
    .replace(/`([^`]+)`/g,     (_, s) => `<span class="lk-mono">${s}</span>`)
    .replace(/(\d+)\/(\d+)/g,  (_, n, d) => makeFrac(n, d));
}

// Разбор: массив строк или строка с \n → абзацы с воздухом между ними.
function renderFeedback(fb) {
  const parts = Array.isArray(fb) ? fb : String(fb).split('\n');
  return parts
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => `<p class="fb-p">${fmtInline(p)}</p>`)
    .join('');
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── ПРОГРЕСС ─────────────────────────────────────────────────────────────────

let checkedCount = 0;
let firstTryCount = 0;
let DATA = null;

function markChecked(taskId, isFirstTryCorrect) {
  checkedCount++;
  if (isFirstTryCorrect) firstTryCount++;
  document.getElementById(`card-${taskId}`).classList.add('is-done');

  const label = document.getElementById('prog-label');
  const fill  = document.getElementById('prog-fill');
  label.textContent = `${checkedCount} из 6`;
  fill.style.width  = `${(checkedCount / 6) * 100}%`;

  if (checkedCount === 6) {
    setTimeout(() => showFinal(), 700);
  }
}

function showFinal() {
  const el = document.getElementById('final-screen');
  // Уровень результата — мягко, без оценок/двоек
  const tier = firstTryCount === 6 ? '🏆 Идеально, ни одной осечки!'
             : firstTryCount >= 4  ? '💪 Крепко держишь тему!'
             : '🔁 Загляни в разборы выше — и прорешай ещё разок.';
  document.getElementById('final-tier').textContent = tier;
  document.getElementById('final-counter').innerHTML =
    `<b>${firstTryCount}</b> ${DATA.final.counter_label} из 6`;
  el.classList.add('show');
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── МЕХАНИКА А: ВЕРНО / НЕВЕРНО (З1) ─────────────────────────────────────────

function buildTrueFalse(task) {
  return task.items.map(item => `
    <div class="tf-item" id="tfi-${task.id}-${item.id}">
      <div class="tf-text">${fmtInline(item.text)}</div>
      <div class="tf-btns">
        <button class="tf-btn" data-task="${task.id}" data-item="${item.id}" data-val="true">Верно</button>
        <button class="tf-btn" data-task="${task.id}" data-item="${item.id}" data-val="false">Неверно</button>
      </div>
    </div>`).join('');
}

function initTrueFalse(task, card) {
  card.querySelectorAll('.tf-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      card.querySelectorAll(`[data-item="${btn.dataset.item}"]`)
          .forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });
  return {
    check() {
      let allAnswered = true, allCorrect = true;
      task.items.forEach(item => {
        const sel = card.querySelector(`[data-item="${item.id}"].selected`);
        if (!sel) { allAnswered = false; return; }
        const ok = (sel.dataset.val === 'true') === item.answer;
        if (!ok) allCorrect = false;
        const row = card.querySelector(`#tfi-${task.id}-${item.id}`);
        row.classList.add(ok ? 'is-correct' : 'is-wrong');
        card.querySelectorAll(`[data-item="${item.id}"]`).forEach(b => b.disabled = true);
      });
      return { ok: allAnswered, correct: allCorrect };
    }
  };
}

// ── МЕХАНИКА Б: СОЕДИНИ ПАРЫ (З2) ────────────────────────────────────────────

// Цвета пар — только из violet/magenta/indigo палитры бренда; зелёный зарезервирован под lk-ok
const PAIR_COLORS = ['mp-pair-0', 'mp-pair-1', 'mp-pair-2', 'mp-pair-3'];

function buildMatchPairs(task) {
  const rightShuffled = shuffle(task.pairs.map((p, i) => ({ ...p, origIdx: i })));
  const leftCol = task.pairs.map((p, i) =>
    `<div class="mp-item" data-side="left" data-idx="${i}">${makeFrac(p.left[0], p.left[1])}</div>`
  ).join('');
  const rightCol = rightShuffled.map(p =>
    `<div class="mp-item" data-side="right" data-orig="${p.origIdx}">${makeMixed(p.right[0], p.right[1], p.right[2])}</div>`
  ).join('');
  return `
    <div class="mp-grid">
      <div class="mp-col"><div class="mp-col-label">Неправильная</div>${leftCol}</div>
      <div class="mp-col"><div class="mp-col-label">Смешанная</div>${rightCol}</div>
    </div>`;
}

function initMatchPairs(task, card) {
  const state = { sel: null, pairs: {} }; // pairs: leftIdx → rightOrigIdx

  function applyColors() {
    card.querySelectorAll('.mp-item').forEach(el => {
      PAIR_COLORS.forEach(c => el.classList.remove(c));
      el.classList.remove('mp-selected');
    });
    let ci = 0;
    Object.entries(state.pairs).forEach(([li, ro]) => {
      const lEl = card.querySelector(`[data-side="left"][data-idx="${li}"]`);
      const rEl = card.querySelector(`[data-side="right"][data-orig="${ro}"]`);
      lEl?.classList.add(PAIR_COLORS[ci]);
      rEl?.classList.add(PAIR_COLORS[ci]);
      ci++;
    });
    if (state.sel !== null) {
      card.querySelector(`[data-side="left"][data-idx="${state.sel}"]`)
          ?.classList.add('mp-selected');
    }
  }

  card.querySelectorAll('.mp-item').forEach(item => {
    item.addEventListener('click', () => {
      if (item.classList.contains('is-locked')) return;
      const side = item.dataset.side;
      if (side === 'left') {
        const idx = parseInt(item.dataset.idx);
        state.sel = (state.sel === idx) ? null : idx;
      } else {
        const ro = parseInt(item.dataset.orig);
        if (state.sel !== null) {
          const li = state.sel;
          delete state.pairs[li];
          Object.keys(state.pairs).forEach(k => { if (state.pairs[k] === ro) delete state.pairs[k]; });
          state.pairs[li] = ro;
          state.sel = null;
        } else {
          const found = Object.keys(state.pairs).find(k => state.pairs[k] === ro);
          state.sel = found !== undefined ? parseInt(found) : null;
        }
      }
      applyColors();
    });
  });

  return {
    check() {
      const allPaired = task.pairs.every((_, i) => state.pairs[i] !== undefined);
      if (!allPaired) return { ok: false };
      let allCorrect = true;
      task.pairs.forEach((_, li) => {
        const ro = state.pairs[li];
        const ok = ro === li;
        if (!ok) allCorrect = false;
        const lEl = card.querySelector(`[data-side="left"][data-idx="${li}"]`);
        const rEl = card.querySelector(`[data-side="right"][data-orig="${ro}"]`);
        PAIR_COLORS.forEach(c => { lEl?.classList.remove(c); rEl?.classList.remove(c); });
        lEl?.classList.remove('mp-selected');
        lEl?.classList.add(ok ? 'is-correct' : 'is-wrong', 'is-locked');
        rEl?.classList.add(ok ? 'is-correct' : 'is-wrong', 'is-locked');
      });
      card.querySelectorAll('[data-side="right"]').forEach(el => el.classList.add('is-locked'));
      return { ok: true, correct: allCorrect };
    }
  };
}

// ── МЕХАНИКА В: ВВОД СМЕШАННОЙ (З3) ──────────────────────────────────────────

function buildInputMixed(task) {
  return task.items.map(item => `
    <div class="input-row" id="ir-${item.id}">
      <div class="input-src">${makeFrac(item.frac[0], item.frac[1])}</div>
      <div class="input-arrow">→</div>
      <div class="input-mixed">
        <input class="input-field" type="number" inputmode="numeric"
               id="iw-${item.id}" min="0" max="99" placeholder="?">
        <div class="input-frac-col">
          <div class="input-num-wrap">
            <input class="input-field" type="number" inputmode="numeric"
                   id="in-${item.id}" min="0" max="99" placeholder="?">
          </div>
          <div class="input-den">${item.den}</div>
        </div>
      </div>
    </div>`).join('');
}

function checkInputMixed(task, card) {
  let allFilled = true, allCorrect = true;
  task.items.forEach(item => {
    const wv = parseInt(card.querySelector(`#iw-${item.id}`).value);
    const nv = parseInt(card.querySelector(`#in-${item.id}`).value);
    if (isNaN(wv) || isNaN(nv)) { allFilled = false; return; }
    const ok = wv === item.whole && nv === item.num;
    if (!ok) allCorrect = false;
    card.querySelector(`#ir-${item.id}`).classList.add(ok ? 'is-correct' : 'is-wrong');
    card.querySelector(`#iw-${item.id}`).disabled = true;
    card.querySelector(`#in-${item.id}`).disabled = true;
  });
  return { ok: allFilled, correct: allCorrect };
}

// ── МЕХАНИКА Б/Г: УПОРЯДОЧИ (З4) — v1 стрелки + drag ────────────────────────
/* V2-заглушка: в v2 эту механику заменит компонент живой числовой прямой (0…2).
   Ученик перетаскивает плитки и бросает на прямую — дробь снапится в свою точку.
   Разместить как: <div id="number-line-t4" class="v2-placeholder"></div>
   Данные (правильные позиции): task.fracs + task.correct_order — те же. */

function initSortFracs(task, card) {
  // Шаффл, гарантирующий неправильный стартовый порядок
  let order;
  do { order = shuffle(task.fracs.map((_, i) => i)); }
  while (order.every((v, i) => v === task.correct_order[i]));

  const list = card.querySelector('.sort-list');

  function render() {
    list.innerHTML = order.map((fi, pos) => {
      const [n, d] = task.fracs[fi];
      return `
        <div class="sort-item" draggable="true" data-pos="${pos}" data-fi="${fi}">
          <div class="sort-arrows">
            <button class="sort-arrow" data-dir="up"   data-pos="${pos}" ${pos === 0 ? 'disabled' : ''}>▲</button>
            <button class="sort-arrow" data-dir="down" data-pos="${pos}" ${pos === order.length - 1 ? 'disabled' : ''}>▼</button>
          </div>
          <div class="sort-frac">${makeFrac(n, d)}</div>
        </div>`;
    }).join('');

    // Стрелки
    list.querySelectorAll('.sort-arrow').forEach(btn => {
      btn.addEventListener('click', () => {
        const pos = parseInt(btn.dataset.pos);
        const dir = btn.dataset.dir;
        const to  = dir === 'up' ? pos - 1 : pos + 1;
        if (to >= 0 && to < order.length) {
          [order[pos], order[to]] = [order[to], order[pos]];
          render();
        }
      });
    });

    // Drag-and-drop (десктоп)
    let dragFrom = null;
    list.querySelectorAll('.sort-item').forEach(item => {
      item.addEventListener('dragstart', e => {
        dragFrom = parseInt(item.dataset.pos);
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => item.classList.add('is-dragging'), 0);
      });
      item.addEventListener('dragend', () => {
        item.classList.remove('is-dragging');
        list.querySelectorAll('.sort-item').forEach(i => i.classList.remove('is-drag-over'));
      });
      item.addEventListener('dragover', e => {
        e.preventDefault();
        list.querySelectorAll('.sort-item').forEach(i => i.classList.remove('is-drag-over'));
        item.classList.add('is-drag-over');
      });
      item.addEventListener('drop', e => {
        e.preventDefault();
        const to = parseInt(item.dataset.pos);
        if (dragFrom !== null && dragFrom !== to) {
          const moved = order.splice(dragFrom, 1)[0];
          order.splice(to, 0, moved);
          dragFrom = null;
          render();
        }
      });
    });
  }

  render();

  return {
    check() {
      const allCorrect = order.every((fi, i) => fi === task.correct_order[i]);
      list.querySelectorAll('.sort-item').forEach((item, pos) => {
        const ok = order[pos] === task.correct_order[pos];
        item.classList.add(ok ? 'is-correct' : 'is-wrong');
        item.setAttribute('draggable', 'false');
        item.querySelectorAll('.sort-arrow').forEach(b => b.disabled = true);
      });
      return { ok: true, correct: allCorrect };
    }
  };
}

// ── МЕХАНИКА А/Д: НАЙДИ ОШИБКУ (З5) ─────────────────────────────────────────

function buildFindError(task) {
  const opts = task.options.map(o => `
    <button class="lk-opt" data-key="${o.key}">
      <span class="lk-key">${o.key}</span>
      <span>${fmtInline(o.text)}</span>
    </button>`).join('');
  return `
    <div class="shown-work">${fmtInline(task.shown_work)}</div>
    <div class="find-q">${fmtInline(task.question)}</div>
    <div class="lk-opts">${opts}</div>`;
}

function initFindError(task, card) {
  let selected = null;
  card.querySelectorAll('.lk-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('is-locked')) return;
      card.querySelectorAll('.lk-opt').forEach(b => {
        b.style.borderColor = ''; b.style.background = '';
      });
      selected = btn.dataset.key;
      btn.style.borderColor = 'var(--lk-violet)';
      btn.style.background  = 'rgba(168,85,247,.10)';
    });
  });
  return {
    check() {
      if (!selected) return { ok: false };
      const selOpt = task.options.find(o => o.key === selected);
      task.options.forEach(o => {
        const btn = card.querySelector(`[data-key="${o.key}"]`);
        btn.style.borderColor = ''; btn.style.background = '';
        if (o.correct)                      btn.classList.add('is-correct');
        else if (o.key === selected)         btn.classList.add('is-wrong');
        btn.classList.add('is-locked');
      });
      return { ok: true, correct: selOpt?.correct ?? false };
    }
  };
}

// ── МЕХАНИКА Д: ПРЕДСКАЖИ (З6) ───────────────────────────────────────────────
/* V2-заглушка: в v2 заменит компонент «прямая + зоны»:
   ученик бросает дробь в зону <1/=1/>1 на числовой прямой.
   Данные: task.fracs + task.answers — те же.
   Разместить как: <div id="predict-line-t6" class="v2-placeholder"></div> */

const PRED_LABELS = { lt: '< 1', eq: '= 1', gt: '> 1' };
const PRED_VALS   = ['lt', 'eq', 'gt'];

function buildPredict(task) {
  return task.fracs.map((f, i) => `
    <div class="pred-row">
      <div class="pred-frac">${makeFrac(f[0], f[1])}</div>
      <div class="pred-btns">
        ${PRED_VALS.map(v =>
          `<button class="pred-btn" data-fi="${i}" data-val="${v}">${PRED_LABELS[v]}</button>`
        ).join('')}
      </div>
    </div>`).join('');
}

function initPredict(task, card) {
  const answers = {};
  card.querySelectorAll('.pred-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      const fi = btn.dataset.fi;
      answers[fi] = btn.dataset.val;
      card.querySelectorAll(`[data-fi="${fi}"].pred-btn`).forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });
  return {
    check() {
      const allAnswered = task.fracs.every((_, i) => answers[String(i)] !== undefined);
      if (!allAnswered) return { ok: false };
      let allCorrect = true;
      task.fracs.forEach((_, i) => {
        const userVal = answers[String(i)];
        const ok = userVal === task.answers[i];
        if (!ok) allCorrect = false;
        card.querySelectorAll(`[data-fi="${i}"].pred-btn`).forEach(b => {
          b.classList.remove('selected');
          if (b.dataset.val === task.answers[i])            b.classList.add('is-correct');
          else if (b.dataset.val === userVal && !ok)        b.classList.add('is-wrong');
          b.disabled = true;
        });
      });
      return { ok: true, correct: allCorrect };
    }
  };
}

// ── РЕНДЕР ЗАДАНИЯ ────────────────────────────────────────────────────────────

function buildTask(task) {
  let body = '';
  if      (task.mechanic === 'true_false')  body = buildTrueFalse(task);
  else if (task.mechanic === 'match_pairs') body = buildMatchPairs(task);
  else if (task.mechanic === 'input_mixed') body = buildInputMixed(task);
  else if (task.mechanic === 'sort_fracs')  body = `<div class="sort-list"></div>`;
  else if (task.mechanic === 'find_error')  body = buildFindError(task);
  else if (task.mechanic === 'predict')     body = buildPredict(task);

  const card = document.createElement('div');
  card.className = 'task-card lk-card lk-screen';
  card.id = `card-${task.id}`;
  card.innerHTML = `
    <div class="task-head">
      <div class="task-label-wrap">
        <span class="task-label">${task.label}</span>
        <span class="task-done-check">✓</span>
      </div>
      <span class="task-diff">${task.difficulty}</span>
    </div>
    <p class="task-intro">${fmtInline(task.intro)}</p>
    <div class="task-body">${body}</div>
    <div class="task-feedback" id="fb-${task.id}">
      <div class="fb-label">Разбор</div>
      ${renderFeedback(task.feedback)}
    </div>
    <button class="lk-btn check-btn" id="btn-${task.id}">Проверить</button>`;
  return card;
}

// ── ИНИЦИАЛИЗАЦИЯ ─────────────────────────────────────────────────────────────

function init(data) {
  DATA = data;

  // ── Старт-обложка ──
  document.getElementById('cv-kicker').textContent = data.meta.kicker;
  document.getElementById('cv-title').textContent  = data.meta.title;
  document.getElementById('cv-lead').textContent   = data.meta.cover_lead || data.meta.subtitle;
  const mins = data.meta.minutes || 10;
  document.getElementById('cv-meta').textContent =
    `${data.tasks.length} заданий · ~${mins} мин`;

  document.getElementById('final-unlock').textContent = data.final.unlock;
  document.getElementById('final-tease').textContent  = data.final.tease;

  // Кнопка «Поехали» → прячем обложку, открываем шапку с прогрессом и задания
  document.getElementById('cv-start').addEventListener('click', () => {
    document.getElementById('cover').hidden          = true;
    document.getElementById('hw-header').hidden       = false;
    document.getElementById('tasks-container').hidden = false;
    window.scrollTo(0, 0);
  });

  const container = document.getElementById('tasks-container');

  data.tasks.forEach(task => {
    const card = buildTask(task);
    container.appendChild(card);

    // Инициализируем интерактивные механики после вставки в DOM
    let checker;
    if      (task.mechanic === 'true_false')  checker = initTrueFalse(task, card);
    else if (task.mechanic === 'match_pairs') checker = initMatchPairs(task, card);
    else if (task.mechanic === 'sort_fracs')  checker = initSortFracs(task, card);
    else if (task.mechanic === 'find_error')  checker = initFindError(task, card);
    else if (task.mechanic === 'predict')     checker = initPredict(task, card);

    // Кнопка «Проверить»
    const btn = document.getElementById(`btn-${task.id}`);
    btn.addEventListener('click', () => {
      let result;
      if      (task.mechanic === 'input_mixed') result = checkInputMixed(task, card);
      else if (checker)                         result = checker.check();

      if (!result || !result.ok) {
        // Не всё заполнено — покачать кнопку
        btn.classList.remove('shake');
        void btn.offsetWidth; // reflow для перезапуска анимации
        btn.classList.add('shake');
        btn.addEventListener('animationend', () => btn.classList.remove('shake'), { once: true });
        return;
      }

      // Показать разбор, заблокировать кнопку
      document.getElementById(`fb-${task.id}`).classList.add('show');
      btn.disabled = true;
      markChecked(task.id, result.correct);
    });
  });
}

// ── СТАРТ ─────────────────────────────────────────────────────────────────────

fetch('data.json')
  .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
  .then(init)
  .catch(() => {
    document.getElementById('tasks-container').innerHTML =
      '<p style="color:var(--lk-bad);padding:20px;font-size:15px">Ошибка загрузки данных. Обновите страницу.</p>';
  });
