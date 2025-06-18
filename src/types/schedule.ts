export type InspectionSchedule = {
  schedule_id: string;
  business_code: string;
  inspection_date: Date;
  inspector_description?: string;
  inspector_status: "pending" | "completed" | "cancelled";
};

export type InspectionReport = {
  report_id: string;
  schedule_id: string;
  report_description: string;
  report_status: "draft" | "finalized";
};

export type ViolationResult = {
  violation_id: string;
  report_id: string;
  violation_number: string;
  issue_date: Date;
  violation_status: "pending" | "paid" | "dismissed";
  fix_status: "not_fixed" | "fixed" | "in_progress";
  officer_signed: string;
};
