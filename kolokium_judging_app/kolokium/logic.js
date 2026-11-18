(function (root) {
  var RATE = { Y: 2, P: 1, N: 0 };
  var STAGES = ['Exploring', 'Testing', 'Piloting', 'Scale'];
  function clean(s) { return String(s || '').replace(/[|\r\n]+/g, ' ').trim().slice(0, 140); }
  function buildLine(judge, pid, r, stage, note) { return ['KOLOKIUM', judge, pid, r.join(','), stage, clean(note)].join('|'); }
  function parse(text) {
    var out = [];
    String(text || '').split(/\r?\n/).forEach(function (line) {
      var i = line.indexOf('KOLOKIUM|'); if (i < 0) return;
      var parts = line.slice(i).replace(/\s+\d{1,2}[:.]\d{2}\s*$/, '').split('|');
      if (parts.length < 5) return;
      var judge = parts[1].trim().toUpperCase(), pid = parts[2].trim().toUpperCase();
      var rs = parts[3].split(',').map(function (x) { return x.trim().toUpperCase(); });
      var stage = parts[4].trim();
      if (rs.length !== 4 || rs.some(function (x) { return !(x in RATE); })) return;
      if (STAGES.indexOf(stage) < 0) return;
      out.push({ judge: judge, pid: pid, r: rs, stage: stage, note: parts.slice(5).join('|').trim() });
    });
    return out;
  }
  function merge(store, entries) { entries.forEach(function (e) { store[e.judge + '|' + e.pid] = e; }); return store; }
  function band(avg) { return avg >= 1.5 ? 'Y' : avg >= 0.75 ? 'P' : 'N'; }
  function summarize(store, pid) {
    var es = Object.keys(store).map(function (k) { return store[k]; }).filter(function (e) { return e.pid === pid; });
    es.sort(function (a, b) { return a.judge < b.judge ? -1 : 1; });
    var crit = [0, 1, 2, 3].map(function (c) {
      var cnt = { Y: 0, P: 0, N: 0 }, sum = 0;
      es.forEach(function (e) { cnt[e.r[c]]++; sum += RATE[e.r[c]]; });
      var avg = es.length ? sum / es.length : null;
      return { cnt: cnt, avg: avg, band: avg === null ? null : band(avg), votes: es.map(function (e) { return e.r[c]; }) };
    });
    var sc = {}; STAGES.forEach(function (s) { sc[s] = 0; });
    es.forEach(function (e) { sc[e.stage]++; });
    var top = null, best = 0;
    STAGES.forEach(function (s) { if (sc[s] > best) { best = sc[s]; top = s; } });
    var green = crit.filter(function (c) { return c.band === 'Y'; }).length;
    return { n: es.length, crit: crit, stages: sc, stage: top, green: green, notes: es.filter(function (e) { return e.note; }).map(function (e) { return { judge: e.judge, note: e.note }; }), judges: es.map(function (e) { return e.judge; }) };
  }
  var api = { RATE: RATE, STAGES: STAGES, clean: clean, buildLine: buildLine, parse: parse, merge: merge, summarize: summarize };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.KLogic = api;
})(typeof window !== 'undefined' ? window : this);
