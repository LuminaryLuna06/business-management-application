export enum Gender {
  Male = 1,
  Female = 2,
  Other = 3,
}
export enum IdentificationType {
  CitizenID = 1,
  Passport = 2,
  Other = 3,
}
export enum BusinessType {
  Individual = 1,
  LLC = 2,
  JSC = 3,
}

export type BaseBusiness = {
  business_id: string;
  business_code: string;
  business_name: string;
  business_type: BusinessType;
  industry: string;
  issue_date: Date;
  address: string;
  province: string;
  ward: string;
  phone_number?: string;
  email?: string;
  fax?: string;
  website?: string;
  created_at: Date;
  updated_at?: Date;
};

export type IndividualBusiness = BaseBusiness & {
  business_type: BusinessType.Individual;
  owner_name: string;
  citizen_id: string;
  registered_capital: number;
};

export type OrganizationBusiness = BaseBusiness & {
  business_type: BusinessType.LLC;
  tax_code: string;
  registered_capital: BigInt;
  legal_representative: string;
};

export type JointStockCompany = OrganizationBusiness & {
  business_type: BusinessType.JSC;
  share_price: number;
  total_shares: number;
};

export type Business =
  | IndividualBusiness
  | OrganizationBusiness
  | JointStockCompany;

export type BaseBusinessOwner = {
  id: string;
  name: string;
  gender: Gender;
  ethnicity: string;
  nationality: string;
  birthdate: Date;
  identification_type: IdentificationType;
  identification_number: string;
  license_date: Date;
  place_of_licensing: string;
  permanent_residence: string;
  address: string;
};
export type BusinessCompanyOwner = BaseBusinessOwner & {
  position: string;
};
export type BusinessOwner = BaseBusinessOwner | BusinessCompanyOwner;
