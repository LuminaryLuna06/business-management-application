export type License = {
  license_id: string;
  license_number: string;
  issue_date: Date;
  expiration_date: Date;
  file_link?: string;
};

export type SubLicense = {
  id: string; // id hệ thống sinh ra
  name: string; // Tên giấy phép
  issuing_authority: string; // Cơ quan cấp
  industries: string[]; // Mã ngành liên quan
};
