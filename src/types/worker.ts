export enum Gender {
  Male = 1,
  Female = 2,
  Other = 3,
}

export type Worker = {
  worker_name: string;
  birth_date: Date;
  gender: Gender;
  insurance_status: boolean;
  fire_safety_training: boolean;
  food_safety_training: boolean;
};
