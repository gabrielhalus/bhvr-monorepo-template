import { afterEach, beforeEach, describe, expect, it, jest, mock } from "bun:test";

import { debounceAsync, debounceSync } from "~shared/lib/debounce";

describe("debounceSync", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("calls the function once after the delay", () => {
    const fn = mock(() => {});
    const debounced = debounceSync(fn, 100);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("resets the timer on repeated calls and only fires once", () => {
    const fn = mock(() => {});
    const debounced = debounceSync(fn, 100);

    debounced();
    jest.advanceTimersByTime(50);
    debounced();
    jest.advanceTimersByTime(50);
    // 100ms total but timer reset at 50ms, only 50ms has passed since reset
    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("passes the correct arguments to the function", () => {
    const fn = mock((_a: string, _b: number) => {});
    const debounced = debounceSync(fn, 50);

    debounced("hello", 42);
    jest.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledWith("hello", 42);
  });

  it("uses the last arguments when called multiple times", () => {
    const fn = mock((_x: number) => {});
    const debounced = debounceSync(fn, 50);

    debounced(1);
    debounced(2);
    debounced(3);
    jest.advanceTimersByTime(50);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(3);
  });

  it("can be called again after the first debounce fires", () => {
    const fn = mock(() => {});
    const debounced = debounceSync(fn, 50);

    debounced();
    jest.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);

    debounced();
    jest.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe("debounceAsync", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("resolves the promise after the delay", async () => {
    const fn = mock(async (x: number) => x * 2);
    const debounced = debounceAsync(fn, 100);

    const promise = debounced(5);
    jest.advanceTimersByTime(100);

    const result = await promise;
    expect(result).toBe(10);
  });

  it("does not call the wrapped function before the delay", () => {
    const fn = mock(async () => "result");
    const debounced = debounceAsync(fn, 100);

    debounced();
    jest.advanceTimersByTime(50);
    expect(fn).not.toHaveBeenCalled();
  });

  it("resets the timer when called again before delay expires", async () => {
    const fn = mock(async (x: number) => x);
    const debounced = debounceAsync(fn, 100);

    debounced(1);
    jest.advanceTimersByTime(50);
    const promise = debounced(2);
    jest.advanceTimersByTime(100);

    const result = await promise;
    expect(result).toBe(2);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("passes arguments correctly to the wrapped async function", async () => {
    const fn = mock(async (a: string, b: string) => `${a}-${b}`);
    const debounced = debounceAsync(fn, 50);

    const promise = debounced("hello", "world");
    jest.advanceTimersByTime(50);

    const result = await promise;
    expect(result).toBe("hello-world");
  });
});
