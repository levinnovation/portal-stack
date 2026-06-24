// Financial metrics: IRR, Cash-on-Cash Return, Equity Multiple, NOI
// Generic — used by any tenant with investment / distribution data.

export interface CashFlow {
  date: Date;
  amount: number;
}

export function xirr(flows: CashFlow[], guess = 0.1): number | null {
  if (!flows || flows.length < 2) return null;
  const hasPos = flows.some((f) => f.amount > 0);
  const hasNeg = flows.some((f) => f.amount < 0);
  if (!hasPos || !hasNeg) return null;

  const sorted = [...flows].sort((a, b) => a.date.getTime() - b.date.getTime());
  const t0 = sorted[0].date.getTime();
  const years = sorted.map((f) => (f.date.getTime() - t0) / (365 * 24 * 3600 * 1000));
  const amounts = sorted.map((f) => f.amount);

  const npv = (rate: number) => {
    if (rate <= -1) return Number.NaN;
    let s = 0;
    for (let i = 0; i < amounts.length; i++) s += amounts[i] / Math.pow(1 + rate, years[i]);
    return s;
  };
  const dnpv = (rate: number) => {
    let s = 0;
    for (let i = 0; i < amounts.length; i++) s += (-years[i] * amounts[i]) / Math.pow(1 + rate, years[i] + 1);
    return s;
  };

  let rate = guess;
  for (let i = 0; i < 80; i++) {
    const v = npv(rate);
    if (!isFinite(v)) break;
    if (Math.abs(v) < 1e-7) return rate;
    const d = dnpv(rate);
    if (!isFinite(d) || d === 0) break;
    const next = rate - v / d;
    if (!isFinite(next)) break;
    if (Math.abs(next - rate) < 1e-9) return next;
    rate = next;
    if (rate <= -0.999) rate = -0.99;
  }

  let lo = -0.9999;
  let hi = 10;
  let vlo = npv(lo);
  let vhi = npv(hi);
  if (!isFinite(vlo) || !isFinite(vhi) || vlo * vhi > 0) return null;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const vm = npv(mid);
    if (!isFinite(vm)) return null;
    if (Math.abs(vm) < 1e-7) return mid;
    if (vlo * vm < 0) {
      hi = mid;
      vhi = vm;
    } else {
      lo = mid;
      vlo = vm;
    }
  }
  return (lo + hi) / 2;
}

export function equityMultiple(invested: number, distributions: number): number {
  if (!invested || invested <= 0) return 0;
  return distributions / invested;
}

export function cashOnCash(invested: number, distributions: { amount: number; distributionDate: string | Date }[]): number {
  if (!invested || invested <= 0) return 0;
  const cutoff = Date.now() - 365 * 24 * 3600 * 1000;
  const last12 = distributions
    .filter((d) => new Date(d.distributionDate).getTime() >= cutoff)
    .reduce((s, d) => s + Number(d.amount || 0), 0);
  return last12 / invested;
}

export function estimateNOI(distributions: { amount: number; distributionDate: string | Date; type?: string }[]): number {
  const cutoff = Date.now() - 365 * 24 * 3600 * 1000;
  return distributions
    .filter((d) => new Date(d.distributionDate).getTime() >= cutoff)
    .filter((d) => {
      const t = String(d.type || "").toLowerCase();
      return t !== "capital_return" && t !== "return_of_capital";
    })
    .reduce((s, d) => s + Number(d.amount || 0), 0);
}

export function buildCashFlows(
  investments: { investmentDate: string | Date; amountInvested: number }[],
  distributions: { distributionDate: string | Date; amount: number }[],
): CashFlow[] {
  const flows: CashFlow[] = [];
  investments.forEach((inv) => {
    if (inv.investmentDate && inv.amountInvested) {
      flows.push({ date: new Date(inv.investmentDate), amount: -Math.abs(Number(inv.amountInvested)) });
    }
  });
  distributions.forEach((d) => {
    if (d.distributionDate && d.amount) {
      flows.push({ date: new Date(d.distributionDate), amount: Math.abs(Number(d.amount)) });
    }
  });
  return flows;
}

export const fmtPct = (n: number, digits = 1) =>
  isFinite(n) ? `${(n * 100).toFixed(digits)}%` : "—";

export const fmtMultiple = (n: number) => (isFinite(n) && n > 0 ? `${n.toFixed(2)}x` : "—");
