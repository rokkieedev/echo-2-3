export type TestWithLock = {
  id: string;
  title?: string;
  access_start_at?: string | null;
  access_end_at?: string | null;
  is_locked?: boolean | null;
  duration?: number;
  [key: string]: any;
};

export function getLockStatus(test: TestWithLock, now: Date = new Date()) {
  const start = test.access_start_at ? new Date(test.access_start_at) : null;
  const end = test.access_end_at ? new Date(test.access_end_at) : null;
  const locked = Boolean(test.is_locked);

  let open = true;
  let reason = '';

  if (locked) {
    open = false;
    reason = 'Locked by admin';
  }
  if (start && now < start) {
    open = false;
    reason = `Opens ${formatDateTime(start)}`;
  }
  if (end && now > end) {
    open = false;
    reason = 'Closed';
  }

  return { open, locked, start, end, reason };
}

export function formatDateTime(dt: Date) {
  try {
    return dt.toLocaleString();
  } catch {
    return dt.toISOString();
  }
}
