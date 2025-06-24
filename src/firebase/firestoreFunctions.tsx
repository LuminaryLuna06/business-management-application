import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { type Business } from "../types/business";
import { type License } from "../types/licenses";
import { type Worker } from "../types/worker";
import {
  type InspectionSchedule,
  type InspectionReport,
  type ViolationResult,
} from "../types/schedule";

// Helper function to convert Firestore Timestamp to Date
const convertTimestamp = (timestamp: any): Date => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return timestamp;
};

// Helper function to convert business data from Firestore
const convertBusinessData = (data: any): Business => {
  return {
    ...data,
    issue_date: convertTimestamp(data.issue_date),
    created_at: convertTimestamp(data.created_at),
    updated_at: data.updated_at ? convertTimestamp(data.updated_at) : undefined,
    owner: {
      ...data.owner,
      birthdate: convertTimestamp(data.owner.birthdate),
      license_date: convertTimestamp(data.owner.license_date),
    },
  };
};

// Helper function to convert license data from Firestore
const convertLicenseData = (data: any): License => {
  return {
    ...data,
    issue_date: convertTimestamp(data.issue_date),
    expiration_date: convertTimestamp(data.expiration_date),
  };
};

// Helper function to convert worker data from Firestore
const convertWorkerData = (data: any): Worker => {
  return {
    ...data,
    birth_date: convertTimestamp(data.birth_date),
  };
};

// Helper function to convert inspection data from Firestore
const convertInspectionData = (data: any): InspectionSchedule => {
  return {
    ...data,
    inspection_date: convertTimestamp(data.inspection_date),
  };
};

// Helper function to convert report data from Firestore
const convertReportData = (data: any): InspectionReport => {
  return {
    ...data,
  };
};

// Helper function to convert violation data from Firestore
const convertViolationData = (data: any): ViolationResult => {
  return {
    ...data,
    issue_date: convertTimestamp(data.issue_date),
  };
};

// ===== BUSINESS SERVICES =====

/**
 * Lấy tất cả doanh nghiệp
 */
export const getAllBusinesses = async (): Promise<Business[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "businesses"));
    const businesses: Business[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      businesses.push(convertBusinessData(data));
    });

    return businesses;
  } catch (error) {
    console.error("Error getting businesses:", error);
    throw error;
  }
};

/**
 * Lấy doanh nghiệp theo ID
 */
export const getBusinessById = async (
  businessId: string
): Promise<Business | null> => {
  try {
    const docRef = doc(db, "businesses", businessId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return convertBusinessData(data);
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting business:", error);
    throw error;
  }
};

// ===== LICENSE SERVICES =====

/**
 * Lấy tất cả giấy phép con của một doanh nghiệp
 */
export const getLicensesByBusinessId = async (
  businessId: string
): Promise<License[]> => {
  try {
    const querySnapshot = await getDocs(
      collection(db, "businesses", businessId, "licenses")
    );
    const licenses: License[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      licenses.push(convertLicenseData(data));
    });

    return licenses;
  } catch (error) {
    console.error("Error getting licenses:", error);
    throw error;
  }
};

// ===== EMPLOYEE SERVICES =====

/**
 * Lấy tất cả nhân viên của một doanh nghiệp
 */
export const getEmployeesByBusinessId = async (
  businessId: string
): Promise<Worker[]> => {
  try {
    const querySnapshot = await getDocs(
      collection(db, "businesses", businessId, "employees")
    );
    const employees: Worker[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      employees.push(convertWorkerData(data));
    });

    return employees;
  } catch (error) {
    console.error("Error getting employees:", error);
    throw error;
  }
};

// ===== INSPECTION SERVICES =====

/**
 * Lấy tất cả lịch kiểm tra của một doanh nghiệp
 */
export const getInspectionsByBusinessId = async (
  businessId: string
): Promise<InspectionSchedule[]> => {
  try {
    const querySnapshot = await getDocs(
      collection(db, "businesses", businessId, "inspections")
    );
    const inspections: InspectionSchedule[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      inspections.push(convertInspectionData(data));
    });

    return inspections;
  } catch (error) {
    console.error("Error getting inspections:", error);
    throw error;
  }
};

// ===== REPORT SERVICES =====

/**
 * Lấy tất cả báo cáo kiểm tra của một doanh nghiệp
 */
export const getAllReportsByBusinessId = async (
  businessId: string
): Promise<InspectionReport[]> => {
  try {
    const querySnapshot = await getDocs(
      collection(db, "businesses", businessId, "reports")
    );
    const reports: InspectionReport[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      reports.push(convertReportData(data));
    });
    return reports;
  } catch (error) {
    console.error("Error getting reports:", error);
    throw error;
  }
};

// ===== VIOLATION SERVICES =====

/**
 * Lấy tất cả quyết định xử phạt của một doanh nghiệp
 */
export const getAllViolationsByBusinessId = async (
  businessId: string
): Promise<ViolationResult[]> => {
  try {
    const querySnapshot = await getDocs(
      collection(db, "businesses", businessId, "violations")
    );
    const violations: ViolationResult[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      violations.push(convertViolationData(data));
    });
    return violations;
  } catch (error) {
    console.error("Error getting violations:", error);
    throw error;
  }
};

// ===== REAL-TIME LISTENERS =====

/**
 * Lắng nghe thay đổi dữ liệu doanh nghiệp theo thời gian thực
 */
export const subscribeToBusiness = (
  businessId: string,
  callback: (business: Business | null) => void
) => {
  const docRef = doc(db, "businesses", businessId);

  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      callback(convertBusinessData(data));
    } else {
      callback(null);
    }
  });
};

/**
 * Lắng nghe thay đổi danh sách giấy phép theo thời gian thực
 */
export const subscribeToLicenses = (
  businessId: string,
  callback: (licenses: License[]) => void
) => {
  const collectionRef = collection(db, "businesses", businessId, "licenses");

  return onSnapshot(collectionRef, (querySnapshot) => {
    const licenses: License[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      licenses.push(convertLicenseData(data));
    });
    callback(licenses);
  });
};

/**
 * Lắng nghe thay đổi danh sách nhân viên theo thời gian thực
 */
export const subscribeToEmployees = (
  businessId: string,
  callback: (employees: Worker[]) => void
) => {
  const collectionRef = collection(db, "businesses", businessId, "employees");

  return onSnapshot(collectionRef, (querySnapshot) => {
    const employees: Worker[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      employees.push(convertWorkerData(data));
    });
    callback(employees);
  });
};

/**
 * Lắng nghe thay đổi danh sách lịch kiểm tra theo thời gian thực
 */
export const subscribeToInspections = (
  businessId: string,
  callback: (inspections: InspectionSchedule[]) => void
) => {
  const collectionRef = collection(db, "businesses", businessId, "inspections");

  return onSnapshot(collectionRef, (querySnapshot) => {
    const inspections: InspectionSchedule[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      inspections.push(convertInspectionData(data));
    });
    callback(inspections);
  });
};
