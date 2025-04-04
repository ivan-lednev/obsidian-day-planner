export function ellipsis(input: string, limit: number) {
  if (input.length <= limit) {
    return input;
  }
  return input.substring(0, limit) + "…";
}
