/**
 * Uppercases the first letter after each start-of-string, whitespace, or newline,
 * without changing following characters.
 */
export function capitalizeWordStarts(value: string): string {
  return value.replace(/(^|[\s\n\r]+)(\S)/gu, (_match, sep: string, ch: string) => {
    const lower = ch.toLocaleLowerCase();
    const upper = ch.toLocaleUpperCase();
    return sep + (ch === lower && upper !== lower ? upper : ch);
  });
}
