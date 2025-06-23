export enum LicenseType {
  FireSafety = 1, // Giấy phép phòng cháy chữa cháy
  FoodSafety = 2, // Giấy chứng nhận an toàn thực phẩm
  PublicOrder = 3, // Giấy chứng nhận an ninh trật tự
  Environmental = 4, // Giấy xác nhận bảo vệ môi trường
  ConstructionSafety = 5, // Giấy phép an toàn xây dựng
  HealthPractice = 6, // Giấy phép hành nghề y tế
  Other = 7, // Loại khác
}

export type License = {
  license_type: LicenseType;
  license_number: string;
  issue_date: Date;
  expiration_date: Date;
};
