import type { BusinessType } from "./business";

export type InspectionSchedule = {
  inspection_id: string;
  business_id: string;
  inspection_date: Date;
  inspector_description?: string;
  inspector_status: "pending" | "completed" | "cancelled";
};

export type InspectionReport = {
  report_id: string;
  inspection_id: string;
  report_description: string;
  report_status: "draft" | "finalized";
};

export type InspectionBatch = {
  batch_id: string;
  batch_name: string;
  batch_date: Date;
  batch_description?: string;
  business_type: BusinessType;
  province: string;
  ward: string;
  status: "scheduled" | "ongoing" | "completed";
  created_by: string;
  note?: string;
};

export enum ViolationTypeEnum {
  FalseTaxDeclaration = "false_tax_declaration",
  LateTaxPayment = "late_tax_payment",
  IllegalInvoiceUsage = "illegal_invoice_usage",
  UnregisteredTax = "unregistered_tax",
  IncorrectFinancialReport = "incorrect_financial_report",
  FraudulentFinancialReport = "fraudulent_financial_report",
  NoAccountingRecords = "no_accounting_records",
  UnregisteredLabor = "unregistered_labor",
  LaborContractViolation = "labor_contract_violation",
  UnsafeLaborConditions = "unsafe_labor_conditions",
  FoodSafetyViolation = "food_safety_violation",
  FireSafetyViolation = "fire_safety_violation",
  UnregisteredBusiness = "unregistered_business",
  IllegalBusinessActivity = "illegal_business_activity",
  EnvironmentalViolation = "environmental_violation",
  Other = "other",
}

export type ViolationResult = {
  violation_id: string;
  inspection_id: string;
  report_id: string;
  business_id: string;
  violation_number: string;
  issue_date: Date;
  violation_status: "pending" | "paid" | "dismissed";
  fix_status: "not_fixed" | "fixed" | "in_progress";
  officer_signed: string;
  file_link: string;
  violation_type: ViolationTypeEnum;
};
