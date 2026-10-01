import { calcPlatformFee, getPlatformFeeBps } from "@/lib/platform-fee";

describe("calcPlatformFee", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("calculates fee correctly for default 10 bps", () => {
    delete process.env.PLATFORM_FEE_BPS;
    const fee = calcPlatformFee("1000000000000000000"); // 1 ETH
    expect(fee.feeBps).toBe(10);
    expect(fee.feePercent).toBe(0.1);
    expect(fee.feeAmount).toBe("1000000000000000"); // 0.1%
  });

  it("returns zero fee amount when bps is 0", () => {
    process.env.PLATFORM_FEE_BPS = "0";
    const fee = calcPlatformFee("1000000000000000000");
    expect(fee.feeAmount).toBe("0");
  });

  it("includes recipient when PLATFORM_FEE_RECIPIENT is set", () => {
    process.env.PLATFORM_FEE_RECIPIENT = "0xABC123";
    const fee = calcPlatformFee("1000000");
    expect(fee.recipient).toBe("0xABC123");
  });

  it("returns null recipient when PLATFORM_FEE_RECIPIENT is not set", () => {
    delete process.env.PLATFORM_FEE_RECIPIENT;
    const fee = calcPlatformFee("1000000");
    expect(fee.recipient).toBeNull();
  });
});

describe("getPlatformFeeBps", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns configured bps value", () => {
    process.env.PLATFORM_FEE_BPS = "25";
    expect(getPlatformFeeBps()).toBe(25);
  });

  it("returns default 10 when unset", () => {
    delete process.env.PLATFORM_FEE_BPS;
    expect(getPlatformFeeBps()).toBe(10);
  });
});
