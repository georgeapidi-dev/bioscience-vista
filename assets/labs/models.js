/* Learnova virtual labs · scientific models (by Learnova)
   Pure functions, no drawing. Each model states its assumptions in the lab's "About the model" panel. */
(function (root) {
  var M = {};

  /* ---------- 1. Enzyme kinetics ----------
     Michaelis–Menten: v = kcat[E][S] / (Km_app + [S]).
     Temperature: Arrhenius rise (Ea ≈ 50 kJ/mol, so roughly ×2 per 10 °C) multiplied by the fraction of enzyme still folded
     (two-state unfolding, a sigmoid around Tm). pH: bell-shaped activity around the optimum (ionisation of active-site groups).
     Inhibitors: competitive raises Km_app = Km(1+[I]/Ki); non-competitive lowers Vmax_app = Vmax/(1+[I]/Ki). */
  M.ENZYMES = {
    amylase: { name: 'Salivary amylase', sub: 'starch', prod: 'maltose', topt: 40, tm: 46, phopt: 6.8, phw: 1.6, km: 5, kcat: 1.0 },
    pepsin:  { name: 'Pepsin (stomach)', sub: 'protein', prod: 'peptides', topt: 40, tm: 48, phopt: 2.0, phw: 1.2, km: 4, kcat: 0.8 },
    catalase:{ name: 'Catalase (potato)', sub: 'hydrogen peroxide', prod: 'water + oxygen', topt: 37, tm: 44, phopt: 7.0, phw: 2.0, km: 25, kcat: 3.0 },
    taq:     { name: 'Thermostable enzyme (from a hot-spring bacterium)', sub: 'substrate', prod: 'product', topt: 75, tm: 82, phopt: 7.5, phw: 1.8, km: 5, kcat: 1.0 }
  };
  M.enzymeFactors = function (e, T, pH) {
    var R = 8.314, Ea = 50000, Tk = T + 273.15, Tref = 310.15;
    var arr = Math.exp(-Ea / R * (1 / Tk - 1 / Tref));
    var folded = 1 / (1 + Math.exp((T - e.tm) / 2.5));
    var fpH = Math.exp(-Math.pow((pH - e.phopt) / e.phw, 2));
    return { arrhenius: arr, folded: folded, ph: fpH, total: arr * folded * fpH };
  };
  M.enzymeRate = function (o) {   // o: enzyme key, T, pH, S (mmol/dm3), E (relative 0-2), inh: none|comp|non, I (mmol/dm3)
    var e = M.ENZYMES[o.enzyme], f = M.enzymeFactors(e, o.T, o.pH), Ki = 2;
    var Vmax = 10 * e.kcat * o.E * f.total, Km = e.km;
    if (o.inh === 'comp') Km = Km * (1 + o.I / Ki); else if (o.inh === 'non') Vmax = Vmax / (1 + o.I / Ki);
    return { v: Vmax * o.S / (Km + o.S), Vmax: Vmax, Km: Km, f: f };
  };
  // time course with substrate depletion (product in mmol/dm3, t in s); Euler steps of 0.5 s
  M.enzymeTimeCourse = function (o, tEnd) {
    var S = o.S, P = 0, out = [{ t: 0, P: 0, S: S }], dt = 0.5;
    for (var t = dt; t <= tEnd + 1e-9; t += dt) {
      var r = M.enzymeRate({ enzyme: o.enzyme, T: o.T, pH: o.pH, S: S, E: o.E, inh: o.inh, I: o.I }).v / 60;   // per second
      var d = Math.min(S, r * dt); S -= d; P += d;
      if (Math.abs(t - Math.round(t)) < 1e-9) out.push({ t: Math.round(t), P: P, S: S });
    }
    return out;
  };

  /* ---------- 2. Osmosis ----------
     Water flux J = Lp·A·(Ψ_outside − Ψ_cell). Ψ (kPa) = pressure potential − solute potential, ψs = −iCRT (van 't Hoff).
     Solutes inside cannot cross the membrane (fixed amount), so ψs inside changes as the volume changes.
     Plant cell: the wall resists stretching, so pressure potential rises above the starting volume (elastic modulus ε).
     Animal cell (red blood cell): no wall, pressure ≈ 0; it bursts (haemolysis) beyond about 1.6× its volume. */
  M.osmosis = function (o) {   // o: cell plant|animal, Cout (mol/dm3 sucrose), perm (0.1-2), T (°C), minutes
    var R = 8.314, Tk = o.T + 273.15;
    var Cin0 = o.cell === 'plant' ? 0.40 : 0.30;     // internal solutes (mol/dm3): plant vacuole sap; red blood cell cytoplasm (≈ 300 mOsm)
    var V0 = 1, V = 1, eps = 3000;                    // kPa, elastic modulus of the plant cell wall (potato tissue is fairly soft)
    var Pw0 = o.cell === 'plant' ? 300 : 0;         // plant cell starts slightly turgid (300 kPa) in its normal state
    var Lp = (o.cell === 'plant' ? 0.00004 : 0.0004) * o.perm * (1 + 0.024 * (o.T - 20));   // water permeability, rises about 2.4 % per °C (lower water viscosity)
    var out = [], dt = 0.05, burst = false, plasmolysed = false, steps = Math.round(o.minutes / dt);
    function state(V) {
      var Cin = Cin0 * (V0 - 0.3) / (V - 0.3), psiS = -Cin * R * Tk;                                  // kPa (C in mol/dm3 × 8.314 × T gives kPa)
      var psiP = 0;
      if (o.cell === 'plant') { var Vw = 1 - Pw0 / eps; psiP = V > Vw ? eps * (V - Vw) / Vw : 0; }   // wall starts resisting at volume Vw
      return { Cin: Cin, psiS: psiS, psiP: psiP, psi: psiS + psiP };
    }
    // in the plant the normal state has Ψ_cell = ψs + ψp; set Cin0 so that a plant cell is in equilibrium with 0.30 M + turgor is realistic
    var psiOut = -o.Cout * R * Tk;
    for (var i = 0; i <= steps; i++) {
      var s = state(V);
      if (i % 2 === 0) out.push({ t: +(i * dt).toFixed(2), V: V, psi: s.psi, psiS: s.psiS, psiP: s.psiP, psiOut: psiOut });
      if (burst) continue;
      var J = Lp * (psiOut - s.psi);
      V = Math.max(0.33, V + J * dt);   // about 30 % of a cell's volume is solid material that does not shrink
      if (o.cell === 'animal' && V > 1.6) { burst = true; V = 1.6; }
      if (o.cell === 'plant' && V < 1 - Pw0 / eps - 0.02) plasmolysed = true;
    }
    var last = out[out.length - 1];
    return { series: out, V: last.V, change: (last.V - 1) * 100, burst: burst, plasmolysed: plasmolysed, psiOut: psiOut };
  };

  /* ---------- 3. Titration ----------
     Exact pH from the charge balance, solved by bisection on log[H+]:
     [H+] + [Na+] + [BH+] = [OH−] + [Cl−] + [A−] (strong acid HCl, weak acid HA, strong base NaOH, weak base B).
     Kw = 1.0×10⁻¹⁴ at 25 °C; activities taken as concentrations (dilute solutions). */
  M.ACIDS = { HCl: { name: 'hydrochloric acid (strong)', Ka: Infinity }, CH3COOH: { name: 'ethanoic acid (weak, pKa 4.76)', Ka: 1.74e-5 } };
  M.BASES = { NaOH: { name: 'sodium hydroxide (strong)', Kb: Infinity }, NH3: { name: 'ammonia (weak, pKb 4.75)', Kb: 1.78e-5 } };
  M.titrationPH = function (acid, Ca, Va, base, Cb, Vb) {   // concentrations mol/dm3, volumes cm3
    var Vt = Va + Vb, na = Ca * Va / Vt, nb = Cb * Vb / Vt, Kw = 1e-14, A = M.ACIDS[acid], B = M.BASES[base];
    function f(h) {
      var oh = Kw / h, pos = h, neg = oh;
      if (A.Ka === Infinity) neg += na; else neg += na * A.Ka / (A.Ka + h);
      if (B.Kb === Infinity) pos += nb; else { var Kab = Kw / B.Kb; pos += nb * h / (h + Kab); }
      return pos - neg;
    }
    var lo = -15, hi = 1;   // log10[H+]
    for (var i = 0; i < 80; i++) { var mid = (lo + hi) / 2; if (f(Math.pow(10, mid)) > 0) hi = mid; else lo = mid; }
    return -(lo + hi) / 2;
  };
  M.INDICATORS = {
    phenolphthalein: { name: 'Phenolphthalein', lo: 8.2, hi: 10.0, c1: [255, 255, 255, 0.05], c2: [214, 51, 132, 0.75] },
    methylorange: { name: 'Methyl orange', lo: 3.1, hi: 4.4, c1: [220, 38, 38, 0.7], c2: [245, 180, 0, 0.7] },
    bromothymol: { name: 'Bromothymol blue', lo: 6.0, hi: 7.6, c1: [234, 179, 8, 0.7], c2: [37, 99, 235, 0.7] },
    none: { name: 'No indicator', lo: 0, hi: 14, c1: [255, 255, 255, 0.05], c2: [255, 255, 255, 0.05] }
  };
  M.indicatorColour = function (key, pH) {
    var d = M.INDICATORS[key], f = Math.max(0, Math.min(1, (pH - d.lo) / (d.hi - d.lo)));
    var c = [0, 1, 2, 3].map(function (i) { return d.c1[i] + (d.c2[i] - d.c1[i]) * f; });
    return 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + c[3].toFixed(2) + ')';
  };

  /* ---------- 4. Left heart (time-varying elastance + two-element Windkessel) ----------
     LV pressure = E(t)·(V − V0). E(t) rises in systole and falls in diastole. Valves are one-way (diodes) with small resistances.
     The left atrium fills from the pulmonary veins; the aorta empties through the systemic resistance into the veins. */
  M.heart = function (o) {   // o: hr (bpm), cond normal|stenosis|regurg|weak, beats
    var hr = o.hr, T = 60 / hr, Ts = 0.16 + 0.2 * T * 0.62, Tr = Ts * 0.45;   // systole shortens less than diastole as HR rises
    if (Ts > 0.85 * T) Ts = 0.85 * T;
    var Emax = o.contract || (o.cond === 'weak' ? 1.2 : 3.0), Emin = 0.08, V0 = 10;
    var Ea_max = 0.25, Ea_min = 0.12, Va0 = 15;
    var Rmv = 0.005, Rav = o.cond === 'stenosis' ? 0.12 : 0.004, Rreg = o.cond === 'regurg' ? 0.35 : Infinity;
    var Rs = 1.0, Ca = 1.3, Rpv = 0.045, Ppv = 12, Pv = 5;
    var Vlv = 120, Vla = 50, Pao = 85, dt = 0.0005, out = [], beats = o.beats || 4;
    var sv = [], vmax = 0, vmin = 1e9, beatStart = 0, aoMax = 0, aoMin = 1e9, lvMax = 0, laMax = 0;
    function elast(t) {
      var tc = t % T, e;
      if (tc < Ts) e = (1 - Math.cos(Math.PI * tc / Ts)) / 2;
      else if (tc < Ts + Tr) e = (1 + Math.cos(Math.PI * (tc - Ts) / Tr)) / 2;
      else e = 0;
      return Emin + (Emax - Emin) * e;
    }
    function aelast(t) {   // atrium contracts late in diastole (about 0.1 s before ventricular systole)
      var tc = (t % T) - (T - 0.12), e = tc >= 0 && tc < 0.1 ? Math.sin(Math.PI * tc / 0.1) : 0;
      return Ea_min + (Ea_max - Ea_min) * e;
    }
    var n = Math.round(beats * T / dt);
    for (var i = 0; i < n; i++) {
      var t = i * dt, Plv = elast(t) * (Vlv - V0), Pla = aelast(t) * (Vla - Va0);
      var Qmv = Pla > Plv ? (Pla - Plv) / Rmv : (Rreg !== Infinity ? (Pla - Plv) / Rreg : 0);
      var Qav = Plv > Pao ? (Plv - Pao) / Rav : 0, Qpv = (Ppv - Pla) / Rpv, Qs = (Pao - Pv) / Rs;
      Vlv += (Qmv - Qav) * dt; Vla += (Qpv - Qmv) * dt; Pao += (Qav - Qs) / Ca * dt;
      var beat = Math.floor(t / T);
      if (beat >= beats - 1) {   // record the last beat (steady state)
        vmax = Math.max(vmax, Vlv); vmin = Math.min(vmin, Vlv); aoMax = Math.max(aoMax, Pao); aoMin = Math.min(aoMin, Pao); lvMax = Math.max(lvMax, Plv); laMax = Math.max(laMax, Pla);
      }
      if (i % 10 === 0) out.push({ t: t, Plv: Plv, Pla: Pla, Pao: Pao, Vlv: Vlv, mitral: Qmv > 0, regurg: Qmv < 0, aortic: Qav > 0, Qav: Qav, Qmv: Qmv });
    }
    var fwd = 0, back = 0;
    out.forEach(function (p) { if (p.t >= (beats - 1) * T) { fwd += p.Qav * dt * 10; if (p.Qmv < 0) back += -p.Qmv * dt * 10; } });
    return { series: out, T: T, Ts: Ts, EDV: vmax, ESV: vmin, SV: fwd, regurgVol: back, CO: fwd * hr / 1000, sys: aoMax, dia: aoMin, lvMax: lvMax, laMax: laMax, EF: (vmax - vmin) / vmax * 100 };
  };

  /* ---------- 5. DNA replication ---------- */
  M.PAIR = { A: 'T', T: 'A', C: 'G', G: 'C' };
  M.randomDNA = function (n, seed) { var s = '', x = seed || 7; for (var i = 0; i < n; i++) { x = (x * 1103515245 + 12345) % 2147483648; s += 'ATCG'[Math.floor(x / 65536) % 4]; } return s; };
  // copy a strand: polymerase error rate (per base), proofreading removes 99 % of errors, mismatch repair 99.9 % of what is left
  M.replicate = function (template, errRate, proof, mmr, rnd) {
    rnd = rnd || Math.random; var copy = '', errs = [], caught = 0, fixed = 0;
    for (var i = 0; i < template.length; i++) {
      var right = M.PAIR[template[i]], b = right;
      if (rnd() < errRate) {
        if (proof && rnd() < 0.99) caught++;
        else if (mmr && rnd() < 0.999) fixed++;
        else { var w = 'ATCG'.replace(right, ''); b = w[Math.floor(rnd() * 3)]; errs.push(i); }
      }
      copy += b;
    }
    return { copy: copy, errors: errs, proofread: caught, repaired: fixed };
  };

  if (typeof module !== 'undefined') module.exports = M; else root.LABM = M;
})(this);
