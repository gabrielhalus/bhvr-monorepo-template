export function requireParam(c: { req: { param: (k: string) => string | undefined } }, key: string): string {
  const value = c.req.param(key);
  if (!value) {
    throw new Error(`Missing route param: ${key}`);
  }
  return value;
}
