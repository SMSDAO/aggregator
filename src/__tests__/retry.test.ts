import { fetchWithRetry } from "@/lib/retry";

// Mock global fetch for retry tests
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe("fetchWithRetry", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("returns response on first successful call", async () => {
    const mockResponse = { ok: true, status: 200 } as Response;
    mockFetch.mockResolvedValueOnce(mockResponse);

    const result = await fetchWithRetry("https://example.com/api", {}, { attempts: 3, baseDelayMs: 0 });
    expect(result).toBe(mockResponse);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("retries on failure and succeeds on second attempt", async () => {
    const mockResponse = { ok: true, status: 200 } as Response;
    mockFetch
      .mockRejectedValueOnce(new Error("network error"))
      .mockResolvedValueOnce(mockResponse);

    const result = await fetchWithRetry("https://example.com/api", {}, { attempts: 3, baseDelayMs: 0 });
    expect(result).toBe(mockResponse);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("throws after exhausting all attempts", async () => {
    mockFetch.mockRejectedValue(new Error("persistent failure"));

    await expect(
      fetchWithRetry("https://example.com/api", {}, { attempts: 2, baseDelayMs: 0 })
    ).rejects.toThrow("persistent failure");
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("uses minimum of 1 attempt even if 0 is passed", async () => {
    const mockResponse = { ok: true, status: 200 } as Response;
    mockFetch.mockResolvedValueOnce(mockResponse);

    const result = await fetchWithRetry("https://example.com/api", {}, { attempts: 0, baseDelayMs: 0 });
    expect(result).toBe(mockResponse);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
