// Utility functions for dates and weekend handling

export const WEEKEND_NOTE = '[TATULEBOMBA/ TULEPELAFYE LELO]';

/**
 * Returns true if the provided date string (YYYY-MM-DD) or Date object falls on Saturday or Sunday.
 */
export function isWeekend(dateInput?: string | Date | null): boolean {
  if (!dateInput) return false;
  if (typeof dateInput === 'string') {
    const cleanStr = dateInput.split('T')[0];
    const parts = cleanStr.split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      const day = d.getDay();
      return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
    }
    const d = new Date(dateInput);
    if (!isNaN(d.getTime())) {
      const day = d.getDay();
      return day === 0 || day === 6;
    }
    return false;
  }
  const day = dateInput.getDay();
  return day === 0 || day === 6;
}

/**
 * Returns day name (e.g., "Saturday", "Sunday", "Monday").
 */
export function getDayOfWeekName(dateInput?: string | Date | null): string {
  if (!dateInput) return '';
  if (typeof dateInput === 'string') {
    const cleanStr = dateInput.split('T')[0];
    const parts = cleanStr.split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString('en-US', { weekday: 'long' });
    }
    const d = new Date(dateInput);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', { weekday: 'long' });
    }
    return '';
  }
  return dateInput.toLocaleDateString('en-US', { weekday: 'long' });
}
