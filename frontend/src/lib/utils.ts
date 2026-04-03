/**
 * Tiny className join helper mirroring the `cn` helper used in shadcn templates.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
