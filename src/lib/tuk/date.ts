export function monthKeyOf(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return `${d.getFullYear()}-${d.getMonth() + 1}`;
}

export function monthLabelOf(key: string): string {
  return `${key.split("-")[1]}월`;
}

export function dayLabelOf(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
