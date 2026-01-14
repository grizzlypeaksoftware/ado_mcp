// Mock for uuid module
let counter = 0;

export function v4(): string {
  counter++;
  return `mock-uuid-${counter}-${Date.now()}`;
}

export function reset(): void {
  counter = 0;
}
