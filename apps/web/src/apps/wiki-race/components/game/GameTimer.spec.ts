import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import GameTimer from './GameTimer.vue';

describe('GameTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('displays elapsed time in mm:ss when no time limit', async () => {
    const startTime = Date.now();
    const wrapper = mount(GameTimer, {
      props: { startTime, timeLimitSeconds: null },
    });
    // Initially 00:00
    expect(wrapper.text()).toBe('00:00');

    vi.advanceTimersByTime(65_000);
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toBe('01:05');
  });

  it('displays countdown when time limit is set', async () => {
    const startTime = Date.now();
    const wrapper = mount(GameTimer, {
      props: { startTime, timeLimitSeconds: 300 },
    });
    expect(wrapper.text()).toBe('05:00');

    vi.advanceTimersByTime(60_000);
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toBe('04:00');
  });

  it('does not go below 00:00 when countdown expires', async () => {
    const startTime = Date.now();
    const wrapper = mount(GameTimer, {
      props: { startTime, timeLimitSeconds: 10 },
    });

    vi.advanceTimersByTime(30_000);
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toBe('00:00');
  });

  it('applies red pulse class when under 60s remaining', async () => {
    const startTime = Date.now();
    const wrapper = mount(GameTimer, {
      props: { startTime, timeLimitSeconds: 90 },
    });

    // At start: 90s left, no red class
    expect(wrapper.find('.text-red-600').exists()).toBe(false);

    // After 35s: 55s left — should be red
    vi.advanceTimersByTime(35_000);
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.text-red-600').exists()).toBe(true);
  });
});
