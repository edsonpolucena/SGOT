export function ping(): string {
  return "backend ok";
}

if (import.meta.main) {
  console.log(ping());
}
