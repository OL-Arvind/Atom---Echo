export type CalendarView = "month" | "week" | "agenda";

export interface CalendarEvent {
  id: string;
  type: "content" | "billing" | "tool";
  title: string;
  subtitle?: string;
  date: Date;
  dateString: string; // YYYY-MM-DD
  status?: string;
  clientName: string;
  clientId?: string;
  rawItem: any;
}

export interface CalendarDaySlot {
  date: Date;
  dateString: string;
  isCurrentMonth: boolean;
  isToday: boolean;
}
