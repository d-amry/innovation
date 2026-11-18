(function (root) {
  var RATE = { Y: 2, P: 1, N: 0 };
  var STAGES = ['Exploring', 'Testing', 'Piloting', 'Scale'];
  function norm(s) { return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim(); }
  function clean(s, n) { return String(s || '').replace(/[|\r\n]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n || 140); }
  function buildLine(ev, ini, title, r, stage, note) { return ['KOLOKIUM', clean(ev, 60), clean(ini, 80), clean(title, 120), r.join(','), stage, clean(note)].join('|'); }
  function parse(text) {
    var out = [];
    String(text || '').split(/\r?\n/).forEach(function (line) {
      var i = line.indexOf('KOLOKIUM|'); if (i < 0) return;
      var parts = line.slice(i).replace(/\s+\d{1,2}[:.]\d{2}\s*$/, '').split('|');
      if (parts.length < 6) return;
      var rs = parts[4].split(',').map(function (x) { return x.trim().toUpperCase(); });
      var stage = parts[5].trim();
      if (rs.length !== 4 || rs.some(function (x) { return !(x in RATE); })) return;
      if (STAGES.indexOf(stage) < 0) return;
      var ev = parts[1].trim(), ini = parts[2].trim();
      if (!ev || !ini) return;
      out.push({ ev: ev, ini: ini, title: parts[3].trim(), r: rs, stage: stage, note: parts.slice(6).join('|').trim() });
    });
    return out;
  }
  function merge(store, entries) { entries.forEach(function (e) { store[norm(e.ev) + '|' + norm(e.ini)] = e; }); return store; }
  function band(avg) { return avg >= 1.5 ? 'Y' : avg >= 0.75 ? 'P' : 'N'; }
  function most(arr) { var c = {}, best = null, n = 0; arr.forEach(function (x) { if (!x) return; c[x] = (c[x] || 0) + 1; if (c[x] > n) { n = c[x]; best = x; } }); return best; }
  function summarize(es) {
    var crit = [0, 1, 2, 3].map(function (c) {
      var sum = 0; es.forEach(function (e) { sum += RATE[e.r[c]]; });
      var avg = es.length ? sum / es.length : null;
      return { avg: avg, band: avg === null ? null : band(avg), votes: es.map(function (e) { return e.r[c]; }) };
    });
    var sc = {}; STAGES.forEach(function (s) { sc[s] = 0; }); es.forEach(function (e) { sc[e.stage]++; });
    var top = null, best = 0; STAGES.forEach(function (s) { if (sc[s] > best) { best = sc[s]; top = s; } });
    return { n: es.length, crit: crit, stage: top, notes: es.filter(function (e) { return e.note; }).map(function (e) { return { ev: e.ev, note: e.note }; }) };
  }
  // Groups entries by initiator (names normalised; aliases merge typos). cfg = optional list of {name,title}.
  function groups(store, aliases, cfg) {
    aliases = aliases || {}; var map = {}, order = [];
    function canon(k) { var g = 0; while (aliases[k] && g++ < 10) k = aliases[k]; return k; }
    function get(k, name, title) { if (!map[k]) { map[k] = { key: k, name: name, title: title || '', entries: [], titles: [] }; order.push(k); } return map[k]; }
    (cfg || []).forEach(function (c) { if (c && c.name) get(canon(norm(c.name)), c.name, c.title); });
    Object.keys(store).sort().forEach(function (sk) { var e = store[sk]; var k = canon(norm(e.ini)); var g = get(k, e.ini, ''); g.entries.push(e); if (e.title) g.titles.push(e.title); });
    return order.map(function (k) { var g = map[k]; var s = summarize(g.entries); s.key = k; s.name = g.name; s.title = most(g.titles) || g.title; s.evaluators = g.entries.map(function (e) { return e.ev; }); return s; });
  }
  var api = { RATE: RATE, STAGES: STAGES, norm: norm, clean: clean, buildLine: buildLine, parse: parse, merge: merge, summarize: summarize, groups: groups };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.KLogic = api;
})(typeof window !== 'undefined' ? window : this);
