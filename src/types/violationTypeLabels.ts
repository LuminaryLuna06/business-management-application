import { ViolationTypeEnum } from "./schedule";

export const violationTypeLabels: Record<ViolationTypeEnum, string> = {
  [ViolationTypeEnum.FalseTaxDeclaration]:
    "Kê khai thuế không trung thực/đầy đủ",
  [ViolationTypeEnum.LateTaxPayment]: "Nộp thuế chậm",
  [ViolationTypeEnum.IllegalInvoiceUsage]: "Sử dụng hóa đơn bất hợp pháp",
  [ViolationTypeEnum.UnregisteredTax]: "Không đăng ký thuế",
  [ViolationTypeEnum.IncorrectFinancialReport]: "Báo cáo tài chính không đúng",
  [ViolationTypeEnum.FraudulentFinancialReport]: "Gian lận báo cáo tài chính",
  [ViolationTypeEnum.NoAccountingRecords]: "Không lưu giữ sổ sách kế toán",
  [ViolationTypeEnum.UnregisteredLabor]: "Không đăng ký lao động",
  [ViolationTypeEnum.LaborContractViolation]: "Vi phạm hợp đồng lao động",
  [ViolationTypeEnum.UnsafeLaborConditions]: "Không đảm bảo an toàn lao động",
  [ViolationTypeEnum.FoodSafetyViolation]: "Vi phạm an toàn thực phẩm",
  [ViolationTypeEnum.FireSafetyViolation]: "Vi phạm phòng cháy chữa cháy",
  [ViolationTypeEnum.UnregisteredBusiness]: "Không đăng ký kinh doanh",
  [ViolationTypeEnum.IllegalBusinessActivity]:
    "Kinh doanh ngành nghề không phép",
  [ViolationTypeEnum.EnvironmentalViolation]: "Vi phạm bảo vệ môi trường",
  [ViolationTypeEnum.Other]: "Khác",
};
