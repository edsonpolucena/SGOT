export function ping(): string {
  return "frontend ok";
}

if (import.meta.main) {
  console.log(ping());
}
