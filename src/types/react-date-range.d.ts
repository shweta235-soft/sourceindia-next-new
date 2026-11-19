declare module "react-date-range" {
  import type { ComponentType } from "react";

  type Range = { key: string; startDate: Date; endDate: Date };
  export const DateRangePicker: ComponentType<{
    ranges: Range[];
    onChange: (ranges: Record<string, Partial<Range>>) => void;
    showSelectionPreview?: boolean;
    moveRangeOnFirstSelection?: boolean;
    editableDateInputs?: boolean;
  }>;
}
