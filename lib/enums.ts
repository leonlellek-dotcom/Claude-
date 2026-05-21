// Konstanten für Felder, die in SQLite als String gespeichert werden.
// Die Werte werden zur Laufzeit validiert (siehe Zod-Schemas).

export const USER_ROLES = ["ADMIN", "SHIFT_LEAD", "EMPLOYEE", "HELPER"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Admin",
  SHIFT_LEAD: "Schichtleitung",
  EMPLOYEE: "Mitarbeiter",
  HELPER: "Aushilfe",
};

export const ASSIGNMENT_STATUSES = [
  "SIGNED_UP",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
] as const;
export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];

export const ASSIGNMENT_STATUS_LABELS: Record<AssignmentStatus, string> = {
  SIGNED_UP: "Eingetragen",
  CONFIRMED: "Bestätigt",
  CANCELLED: "Abgesagt",
  COMPLETED: "Erledigt",
};

export const TASK_STATUSES = ["OPEN", "IN_PROGRESS", "DONE", "CANCELLED"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  OPEN: "Offen",
  IN_PROGRESS: "In Arbeit",
  DONE: "Erledigt",
  CANCELLED: "Abgebrochen",
};

export const TASK_PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: "Niedrig",
  NORMAL: "Normal",
  HIGH: "Hoch",
  URGENT: "Dringend",
};

export const RECURRENCE_TYPES = ["NONE", "DAILY", "WEEKLY", "MONTHLY"] as const;
export type RecurrenceType = (typeof RECURRENCE_TYPES)[number];

export const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  NONE: "Einmalig",
  DAILY: "Täglich",
  WEEKLY: "Wöchentlich",
  MONTHLY: "Monatlich",
};

export const STOCK_MOVEMENT_TYPES = ["RECEIPT", "ISSUE", "ADJUSTMENT", "WASTE"] as const;
export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[number];

export const STOCK_MOVEMENT_LABELS: Record<StockMovementType, string> = {
  RECEIPT: "Wareneingang",
  ISSUE: "Verbrauch/Verkauf",
  ADJUSTMENT: "Inventur",
  WASTE: "Verworfen",
};

export const CASH_TX_TYPES = ["DEPOSIT", "WITHDRAWAL", "CHANGE", "CORRECTION"] as const;
export type CashTxType = (typeof CASH_TX_TYPES)[number];

export const CASH_TX_LABELS: Record<CashTxType, string> = {
  DEPOSIT: "Einlage",
  WITHDRAWAL: "Entnahme",
  CHANGE: "Wechselgeld",
  CORRECTION: "Korrektur",
};
