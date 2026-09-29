export interface CustomDatePickerProps {
  name?: string;
  /**
   * Supports either "YYYY-MM-DD" (when showTime=false)
   * or "YYYY-MM-DDTHH:mm" (when showTime=true)
   */
  value?: string;
  defaultValue?: string;
  onChange?: (date: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  minDate?: string;
  maxDate?: string;
  className?: string;
  allowClear?: boolean;
  /** Enable time picker (outputs YYYY-MM-DDTHH:mm) */
  showTime?: boolean;
  /** Visual trigger style: standard input or compact composer pill */
  variant?: "default" | "pill";
  /** Contextual quick presets: "future" (Today, Tomorrow, +1w) or "past" (Now/Today, Yesterday, 2d ago) */
  presetMode?: "future" | "past";
}

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const WEEKDAY_NAMES = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
