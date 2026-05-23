// 12-calc-totals.js
// Pure calculation of financial totals

function calcPeriodTotals(period, ratePercent) {
  const rows = period?.rows || [];
  const rate = clampRate(ratePercent) / 100;

  let gross = 0;
  let net = 0;
  let my = 0;
  let unpaid = 0;

  rows.forEach((r) => {
    const grossRaw = String(r?.gross ?? "").trim();
    const netRaw = String(r?.net ?? "").trim();

    const hasGross = grossRaw !== "";
    const hasNet = netRaw !== "";

    if (!hasGross && !hasNet) return;

    const grossVal = hasGross ? parseMoney(grossRaw) : 0;
    const netVal = hasNet ? parseMoney(netRaw) : 0;

    if (Number.isFinite(grossVal)) gross += grossVal;
    if (Number.isFinite(netVal)) net += netVal;

    if (!hasNet && hasGross && Number.isFinite(grossVal)) {
  unpaid += grossVal * rate;
}

    let base = 0;
    if (hasNet && Number.isFinite(netVal)) {
      base = netVal;
    } else if (hasGross && Number.isFinite(grossVal)) {
      base = grossVal;
    }

    my += base * rate;
  });

  return { gross, net, my, unpaid };
}

function calcEditPeriodMyOnly(period, ratePercent) {
  const rows = period?.rows || [];
  const rate = clampRate(ratePercent) / 100;

  let my = 0;

  rows.forEach((r) => {
    const grossRaw = String(r?.gross ?? "").trim();
    const netRaw = String(r?.net ?? "").trim();

    const hasGross = grossRaw !== "";
    const hasNet = netRaw !== "";

    if (!hasGross && !hasNet) return;

    const grossVal = hasGross ? parseMoney(grossRaw) : 0;
    const netVal = hasNet ? parseMoney(netRaw) : 0;

    let base = 0;
    if (hasNet && Number.isFinite(netVal)) {
      base = netVal;
    } else if (hasGross && Number.isFinite(grossVal)) {
      base = grossVal;
    }

    my += base * rate;
  });

  return my;
}

function rowHasMoneyValue(row, key) {
  const raw = String(row?.[key] ?? "").trim();
  if (!raw) return false;
  return Number.isFinite(parseMoney(raw));
}

function periodHasMoneyValue(period, key) {
  return (period?.rows || []).some((row) => rowHasMoneyValue(row, key));
}

function calcPeriodWeeks(period) {
  const from = parseDateOnly(period?.from);
  const to = parseDateOnly(period?.to);
  if (!from || !to || from > to) return 0;
  return weeksBetweenRounded(from, to);
}

function weeksBetweenRounded(from, to) {
  if (!(from instanceof Date) || !(to instanceof Date) || from > to) return 0;

  const elapsedDays = Math.ceil((startOfDay(to) - startOfDay(from)) / 86400000);
  if (elapsedDays <= 0) return 1;

  return Math.ceil(elapsedDays / 7);
}

function calcCoveredWeeks(periods, shouldIncludePeriod) {
  const ranges = (periods || [])
    .map((p) => {
      if (typeof shouldIncludePeriod === "function" && !shouldIncludePeriod(p)) return null;

      const from = parseDateOnly(p?.from);
      const to = parseDateOnly(p?.to);
      if (!from || !to || from > to) return null;

      return { from: startOfDay(from), to: startOfDay(to) };
    })
    .filter(Boolean)
    .sort((a, b) => a.from - b.from);

  if (!ranges.length) return 0;

  let weeks = 0;
  let currentFrom = ranges[0].from;
  let currentTo = ranges[0].to;

  for (let i = 1; i < ranges.length; i++) {
    const range = ranges[i];
    const nextDayAfterCurrent = new Date(currentTo);
    nextDayAfterCurrent.setDate(nextDayAfterCurrent.getDate() + 1);

    if (range.from <= nextDayAfterCurrent) {
      if (range.to > currentTo) currentTo = range.to;
      continue;
    }

    weeks += weeksBetweenRounded(currentFrom, currentTo);
    currentFrom = range.from;
    currentTo = range.to;
  }

  weeks += weeksBetweenRounded(currentFrom, currentTo);
  return weeks;
}

function calcGroupFinancials(group) {
  const st = group?.data || {};
  const periods = st.periods || [];
  const totals = {
    gross: 0,
    net: 0,
    my: 0,
    unpaid: 0,
    salary: 0,
    salaryAccrued: 0,
    salaryPaid: 0,
    income: 0,
    grossWeeks: 0,
    paidWeeks: 0
  };

  periods.forEach((p) => {
    const t = calcPeriodTotals(p, st.defaultRatePercent);
    totals.gross += t.gross;
    totals.net += t.net;
    totals.my += t.my;
    totals.unpaid += t.unpaid;
  });

  const weeklySalary = normalizeSalaryAmount(st.defaultSalaryPer28Days) / 4;
  totals.grossWeeks = calcCoveredWeeks(periods, (p) => periodHasMoneyValue(p, "gross"));
  totals.paidWeeks = periods.reduce((sum, p) => sum + normalizePaidWeeks(p?.paidWeeks), 0);
  totals.salaryAccrued = weeklySalary * totals.grossWeeks;
  totals.salaryPaid = weeklySalary * Math.min(totals.paidWeeks, totals.grossWeeks);
  totals.salary = Math.max(0, totals.salaryAccrued - totals.salaryPaid);
  totals.income = totals.unpaid - totals.salary;

  return totals;
}

function calcGrandTotalsByMode(mode = appState.grandMode) {
  const grand = {
    gross: 0,
    net: 0,
    my: 0,
    unpaid: 0,
    salary: 0,
    salaryAccrued: 0,
    salaryPaid: 0,
    income: 0,
    grossWeeks: 0,
    paidWeeks: 0
  };
  const groups = getGroupsByMode(mode);

  groups.forEach((gr) => {
    const t = calcGroupFinancials(gr);
    grand.gross += t.gross;
    grand.net += t.net;
    grand.my += t.my;
    grand.unpaid += t.unpaid;
    grand.salary += t.salary;
    grand.salaryAccrued += t.salaryAccrued;
    grand.salaryPaid += t.salaryPaid;
    grand.income += t.income;
    grand.grossWeeks += t.grossWeeks;
    grand.paidWeeks += t.paidWeeks;
  });

  return grand;
}
