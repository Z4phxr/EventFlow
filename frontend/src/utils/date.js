export function parseToDate(value) {
  if (value === null || value === undefined) return null;

  if (typeof value === 'number') {
    const n = Number(value);
    return new Date(n < 1e12 ? n * 1000 : n);
  }

  if (Array.isArray(value)) {
    const [year, month, day, hour = 0, minute = 0, second = 0, nanos = 0] = value;
    const ms = Math.floor((nanos || 0) / 1_000_000);
    return new Date(year, (month || 1) - 1, day || 1, hour, minute, second, ms);
  }

  if (typeof value === 'string') {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d;
    const maybeNum = Number(value);
    if (!isNaN(maybeNum)) return new Date(maybeNum < 1e12 ? maybeNum * 1000 : maybeNum);
  }

  return null;
}

export function formatDateForDisplay(value, options = {}) {
  const d = parseToDate(value);
  if (!d) return '';
  return new Intl.DateTimeFormat(options.locale || 'en-US', options.formatOptions || {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }).format(d);
}
