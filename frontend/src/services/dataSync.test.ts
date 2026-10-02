import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { notifyDataSync, useDataSync } from './dataSync';

describe('dataSync', () => {
  it('triggers onSync callback when notified with matching domain', () => {
    const callback = vi.fn();
    renderHook(() => useDataSync(['transactions'], callback));

    notifyDataSync(['transactions']);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('triggers onSync when notified with "all"', () => {
    const callback = vi.fn();
    renderHook(() => useDataSync(['accounts'], callback));

    notifyDataSync('all');
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('ignores notifications for unrelated domains', () => {
    const callback = vi.fn();
    renderHook(() => useDataSync(['budgets'], callback));

    notifyDataSync(['creditCards']);
    expect(callback).not.toHaveBeenCalled();
  });

  it('unsubscribes cleanly on hook unmount', () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() => useDataSync(['transactions'], callback));

    unmount();
    notifyDataSync(['transactions']);
    expect(callback).not.toHaveBeenCalled();
  });
});
