import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  Timestamp,
  addDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  limit as limitDocs,
  collectionGroup,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import {
  type Business,
  type BusinessType,
  type Gender,
  type IdentificationType,
} from "../types/business";
import { type License } from "../types/licenses";
import { type Worker } from "../types/worker";
import {
  type InspectionSchedule,
  type InspectionReport,
  type ViolationResult,
} from "../types/schedule";
import { type SubLicense } from "../types/licenses";
import type { StaffUser } from "../types/user";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { firebaseConfig } from "./firebaseConfig";
import { type Industry } from "../types/industry";

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
    business_type: Number(data.business_type) as BusinessType,
    issue_date: convertTimestamp(data.issue_date),
    created_at: convertTimestamp(data.created_at),
    updated_at: data.updated_at ? convertTimestamp(data.updated_at) : undefined,
    owner: {
      ...data.owner,
      gender: Number(data.owner?.gender) as Gender,
      identification_type: Number(
        data.owner?.identification_type
      ) as IdentificationType,
      birthdate: convertTimestamp(data.owner?.birthdate),
      license_date: convertTimestamp(data.owner?.license_date),
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

/**
 * Thêm doanh nghiệp mới
 */
export const addBusiness = async (business: Business): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "businesses"), business);
    return docRef.id;
  } catch (error) {
    console.error("Error adding business:", error);
    throw error;
  }
};

/**
 * Cập nhật doanh nghiệp theo ID
 */
export const updateBusiness = async (
  businessId: string,
  businessData: any
): Promise<void> => {
  try {
    // Ensure enum fields are properly converted
    const processedData = {
      ...businessData,
      business_type: Number(businessData.business_type),
      owner: businessData.owner
        ? {
            ...businessData.owner,
            gender: Number(businessData.owner.gender),
            identification_type: Number(businessData.owner.identification_type),
          }
        : undefined,
    };

    await setDoc(doc(db, "businesses", businessId), processedData, {
      merge: true,
    });
  } catch (error) {
    console.error("Error updating business:", error);
    throw error;
  }
};

/**
 * Xóa doanh nghiệp theo ID
 */
export const deleteBusiness = async (businessId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "businesses", businessId));
  } catch (error) {
    console.error("Error deleting business:", error);
    throw error;
  }
};

// ===== LICENSE SERVICES =====

/**
 * Lấy tất cả giấy phép con của một doanh nghiệp
 */
export const getLicensesByBusinessId = async (
  businessId: string
): Promise<(License & { id: string })[]> => {
  try {
    const querySnapshot = await getDocs(
      collection(db, "businesses", businessId, "licenses")
    );
    const licenses: (License & { id: string })[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      licenses.push({
        ...convertLicenseData(data),
        id: doc.id,
      });
    });

    return licenses;
  } catch (error) {
    console.error("Error getting licenses:", error);
    throw error;
  }
};

/**
 * Lấy tất cả giấy phép con từ collection Licenses
 */
export const getAllSubLicenses = async (): Promise<SubLicense[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "licenses"));
    const licenses: SubLicense[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      licenses.push({
        id: doc.id,
        name: data.name,
        issuing_authority: data.issuing_authority,
        industries: data.industries,
      });
    });
    return licenses;
  } catch (error) {
    console.error("Error getting sub licenses:", error);
    throw error;
  }
};

// ===== EMPLOYEE SERVICES =====

/**
 * Lấy tất cả nhân viên của một doanh nghiệp
 */
export const getEmployeesByBusinessId = async (
  businessId: string
): Promise<(Worker & { id: string })[]> => {
  try {
    const querySnapshot = await getDocs(
      collection(db, "businesses", businessId, "employees")
    );
    const employees: (Worker & { id: string })[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      employees.push({
        ...convertWorkerData(data),
        id: doc.id,
      });
    });

    return employees;
  } catch (error) {
    console.error("Error getting employees:", error);
    throw error;
  }
};

/**
 * Thêm một nhân viên mới cho doanh nghiệp
 */
export const addEmployee = async (
  businessId: string,
  employeeData: Worker
): Promise<string> => {
  try {
    const docRef = await addDoc(
      collection(db, "businesses", businessId, "employees"),
      employeeData
    );
    return docRef.id;
  } catch (error) {
    console.error("Error adding employee:", error);
    throw error;
  }
};

/**
 * Cập nhật nhân viên theo ID
 */
export const updateEmployee = async (
  businessId: string,
  employeeId: string,
  employeeData: Partial<Worker>
): Promise<void> => {
  try {
    await setDoc(
      doc(db, "businesses", businessId, "employees", employeeId),
      employeeData,
      {
        merge: true,
      }
    );
  } catch (error) {
    console.error("Error updating employee:", error);
    throw error;
  }
};

/**
 * Xóa nhân viên theo ID
 */
export const deleteEmployee = async (
  businessId: string,
  employeeId: string
): Promise<void> => {
  try {
    await deleteDoc(doc(db, "businesses", businessId, "employees", employeeId));
  } catch (error) {
    console.error("Error deleting employee:", error);
    throw error;
  }
};

// ===== INSPECTION SERVICES =====

/**
 * Lấy tất cả lịch kiểm tra của một doanh nghiệp
 */
export const getInspectionsByBusinessId = async (
  businessId: string
): Promise<(InspectionSchedule & { id: string })[]> => {
  try {
    const querySnapshot = await getDocs(
      collection(db, "businesses", businessId, "inspections")
    );
    const inspections: (InspectionSchedule & { id: string })[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      inspections.push({
        ...convertInspectionData(data),
        id: doc.id,
      });
    });
    return inspections;
  } catch (error) {
    console.error("Error getting inspections:", error);
    throw error;
  }
};

/**
 * Thêm một lịch kiểm tra mới cho doanh nghiệp
 */
export const addInspection = async (
  businessId: string,
  inspectionData: InspectionSchedule
): Promise<string> => {
  try {
    const docRef = await addDoc(
      collection(db, "businesses", businessId, "inspections"),
      {
        ...inspectionData,
        inspection_date: Timestamp.fromDate(
          new Date(inspectionData.inspection_date)
        ),
      }
    );
    return docRef.id;
  } catch (error) {
    console.error("Error adding inspection:", error);
    throw error;
  }
};

/**
 * Cập nhật lịch kiểm tra
 */
export const updateInspection = async (
  businessId: string,
  inspectionId: string,
  inspectionData: Partial<InspectionSchedule>
): Promise<void> => {
  try {
    const updateData: any = { ...inspectionData };
    if (inspectionData.inspection_date) {
      updateData.inspection_date = Timestamp.fromDate(
        new Date(inspectionData.inspection_date)
      );
    }
    await setDoc(
      doc(db, "businesses", businessId, "inspections", inspectionId),
      updateData,
      { merge: true }
    );
  } catch (error) {
    console.error("Error updating inspection:", error);
    throw error;
  }
};

/**
 * Xóa lịch kiểm tra
 */
export const deleteInspection = async (
  businessId: string,
  inspectionId: string
): Promise<void> => {
  try {
    await deleteDoc(
      doc(db, "businesses", businessId, "inspections", inspectionId)
    );
  } catch (error) {
    console.error("Error deleting inspection:", error);
    throw error;
  }
};

// ===== REPORT SERVICES =====

/**
 * Lấy tất cả báo cáo kiểm tra của một doanh nghiệp
 */
export const getAllReportsByBusinessId = async (
  businessId: string
): Promise<(InspectionReport & { id: string })[]> => {
  try {
    const querySnapshot = await getDocs(
      collection(db, "businesses", businessId, "reports")
    );
    const reports: (InspectionReport & { id: string })[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      reports.push({
        ...convertReportData(data),
        id: doc.id,
      });
    });
    return reports;
  } catch (error) {
    console.error("Error getting reports:", error);
    throw error;
  }
};

/**
 * Thêm một báo cáo kiểm tra mới cho doanh nghiệp
 */
export const addReport = async (
  businessId: string,
  reportData: InspectionReport
): Promise<string> => {
  try {
    const docRef = await addDoc(
      collection(db, "businesses", businessId, "reports"),
      reportData
    );
    return docRef.id;
  } catch (error) {
    console.error("Error adding report:", error);
    throw error;
  }
};

/**
 * Cập nhật báo cáo kiểm tra
 */
export const updateReport = async (
  businessId: string,
  reportId: string,
  reportData: Partial<InspectionReport>
): Promise<void> => {
  try {
    await setDoc(
      doc(db, "businesses", businessId, "reports", reportId),
      reportData,
      { merge: true }
    );
  } catch (error) {
    console.error("Error updating report:", error);
    throw error;
  }
};

/**
 * Xóa báo cáo kiểm tra
 */
export const deleteReport = async (
  businessId: string,
  reportId: string
): Promise<void> => {
  try {
    await deleteDoc(doc(db, "businesses", businessId, "reports", reportId));
  } catch (error) {
    console.error("Error deleting report:", error);
    throw error;
  }
};

// ===== VIOLATION SERVICES =====

/**
 * Lấy tất cả quyết định xử phạt của một doanh nghiệp
 */
export const getAllViolationsByBusinessId = async (
  businessId: string
): Promise<(ViolationResult & { id: string })[]> => {
  try {
    const querySnapshot = await getDocs(
      collection(db, "businesses", businessId, "violations")
    );
    const violations: (ViolationResult & { id: string })[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      violations.push({
        ...convertViolationData(data),
        id: doc.id,
      });
    });
    return violations;
  } catch (error) {
    console.error("Error getting violations:", error);
    throw error;
  }
};

/**
 * Thêm một quyết định xử phạt mới cho doanh nghiệp
 */
export const addViolation = async (
  businessId: string,
  violationData: ViolationResult
): Promise<string> => {
  try {
    const docRef = await addDoc(
      collection(db, "businesses", businessId, "violations"),
      violationData
    );
    return docRef.id;
  } catch (error) {
    console.error("Error adding violation:", error);
    throw error;
  }
};

/**
 * Cập nhật quyết định xử phạt
 */
export const updateViolation = async (
  businessId: string,
  violationId: string,
  violationData: Partial<ViolationResult>
): Promise<void> => {
  try {
    const updateData: any = { ...violationData };
    if (violationData.issue_date) {
      updateData.issue_date = Timestamp.fromDate(
        new Date(violationData.issue_date)
      );
    }
    await setDoc(
      doc(db, "businesses", businessId, "violations", violationId),
      updateData,
      { merge: true }
    );
  } catch (error) {
    console.error("Error updating violation:", error);
    throw error;
  }
};

/**
 * Xóa quyết định xử phạt
 */
export const deleteViolation = async (
  businessId: string,
  violationId: string
): Promise<void> => {
  try {
    await deleteDoc(
      doc(db, "businesses", businessId, "violations", violationId)
    );
  } catch (error) {
    console.error("Error deleting violation:", error);
    throw error;
  }
};

/**
 * Thêm một giấy phép con vào collection Licenses (tên, cơ quan cấp, ngành liên quan)
 */
export const addSubLicense = async (
  subLicense: Omit<SubLicense, "id">
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "licenses"), {
      name: subLicense.name,
      issuing_authority: subLicense.issuing_authority,
      industries: subLicense.industries,
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding sub license:", error);
    throw error;
  }
};

/**
 * Cập nhật giấy phép con theo ID
 */
export const updateSubLicense = async (
  licenseId: string,
  licenseData: Partial<SubLicense>
): Promise<void> => {
  try {
    await setDoc(doc(db, "licenses", licenseId), licenseData, {
      merge: true,
    });
  } catch (error) {
    console.error("Error updating sub license:", error);
    throw error;
  }
};

/**
 * Xóa giấy phép con theo ID
 */
export const deleteSubLicense = async (licenseId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "licenses", licenseId));
  } catch (error) {
    console.error("Error deleting sub license:", error);
    throw error;
  }
};

/**
 * Thêm giấy phép con cho doanh nghiệp vào businesses/{businessId}/licenses
 */
export const addBusinessSubLicense = async (
  businessId: string,
  license: {
    license_id: string;
    license_number: string;
    issue_date: Date;
    expiration_date: Date;
  }
): Promise<string> => {
  try {
    const docRef = await addDoc(
      collection(db, "businesses", businessId, "licenses"),
      {
        ...license,
        issue_date: Timestamp.fromDate(new Date(license.issue_date)),
        expiration_date: Timestamp.fromDate(new Date(license.expiration_date)),
      }
    );
    return docRef.id;
  } catch (error) {
    console.error("Error adding business sub license:", error);
    throw error;
  }
};

/**
 * Cập nhật giấy phép con của doanh nghiệp
 */
export const updateBusinessSubLicense = async (
  businessId: string,
  licenseId: string,
  licenseData: {
    license_id: string;
    license_number: string;
    issue_date: Date;
    expiration_date: Date;
  }
): Promise<void> => {
  try {
    await setDoc(
      doc(db, "businesses", businessId, "licenses", licenseId),
      {
        ...licenseData,
        issue_date: Timestamp.fromDate(new Date(licenseData.issue_date)),
        expiration_date: Timestamp.fromDate(
          new Date(licenseData.expiration_date)
        ),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Error updating business sub license:", error);
    throw error;
  }
};

/**
 * Xóa giấy phép con của doanh nghiệp
 */
export const deleteBusinessSubLicense = async (
  businessId: string,
  licenseId: string
): Promise<void> => {
  try {
    await deleteDoc(doc(db, "businesses", businessId, "licenses", licenseId));
  } catch (error) {
    console.error("Error deleting business sub license:", error);
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

/**
 * Lấy tất cả người dùng (cán bộ, admin)
 */
export const getAllUsers = async (): Promise<StaffUser[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    const users: StaffUser[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      users.push({
        uid: data.uid || doc.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        isActive: data.isActive,
        createdAt: data.createdAt,
      });
    });
    return users;
  } catch (error) {
    console.error("Error getting users:", error);
    throw error;
  }
};

/**
 * Tạo user trên Firebase Auth và lưu vào Firestore
 */
export const addUserWithAuth = async ({
  email,
  password,
  name,
  role,
  phone,
  isActive = true,
}: {
  email: string;
  password: string;
  name: string;
  role: string;
  phone?: string;
  isActive?: boolean;
}): Promise<string> => {
  // Sử dụng secondary app instance để không ảnh hưởng currentUser
  const secondaryApp = initializeApp(firebaseConfig, "Secondary");
  const secondaryAuth = getAuth(secondaryApp);
  try {
    const userCredential = await createUserWithEmailAndPassword(
      secondaryAuth,
      email,
      password
    );
    const user = userCredential.user;
    const uid = user.uid;
    await setDoc(doc(db, "users", uid), {
      uid,
      name,
      email,
      phone: phone || "",
      role,
      isActive,
      createdAt: new Date().toISOString(),
    });
    return uid;
  } catch (error) {
    console.error("Error creating user with auth:", error);
    throw error;
  } finally {
    await deleteApp(secondaryApp);
  }
};

/**
 * Sửa thông tin cán bộ (StaffUser) theo uid
 */
export const updateUser = async (
  uid: string,
  data: Partial<StaffUser>
): Promise<void> => {
  try {
    await setDoc(doc(db, "users", uid), data, { merge: true });
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

/**
 * Xóa cán bộ theo uid
 */
export const deleteUser = async (uid: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "users", uid));
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

/**
 * Lấy tất cả vi phạm (từ mọi business)
 */
export const getAllViolations = async (): Promise<any[]> => {
  try {
    const q = collectionGroup(db, "violations");
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error getting violations:", error);
    throw error;
  }
};

/**
 * Lấy thống kê vi phạm: tổng số và số đã khắc phục (từ mọi business)
 */
export const getViolationStats = async (): Promise<{
  total: number;
  fixed: number;
}> => {
  try {
    const q = collectionGroup(db, "violations");
    const querySnapshot = await getDocs(q);
    let total = 0;
    let fixed = 0;
    querySnapshot.forEach((doc) => {
      total++;
      const data = doc.data();
      if (data.fix_status === "fixed") fixed++;
    });
    return { total, fixed };
  } catch (error) {
    console.error("Error getting violation stats:", error);
    throw error;
  }
};

/**
 * Lấy top N lịch kiểm tra sắp tới (từ mọi business, mặc định 20)
 */
export const getUpcomingInspections = async (
  top: number = 20
): Promise<any[]> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const q = query(
      collectionGroup(db, "inspections"),
      orderBy("inspection_date", "asc"),
      where("inspection_date", ">=", Timestamp.fromDate(today)),
      limitDocs(top)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => doc.data());
  } catch (error) {
    console.error("Error getting upcoming inspections:", error);
    throw error;
  }
};

/**
 * Lấy tất cả ngành nghề
 */
export const getAllIndustries = async (): Promise<
  (Industry & { id: string })[]
> => {
  try {
    const querySnapshot = await getDocs(collection(db, "industries"));
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Industry),
    }));
  } catch (error) {
    console.error("Error getting industries:", error);
    throw error;
  }
};

/**
 * Thêm ngành nghề mới
 */
export const addIndustry = async (industry: Industry): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "industries"), industry);
    return docRef.id;
  } catch (error) {
    console.error("Error adding industry:", error);
    throw error;
  }
};

/**
 * Sửa ngành nghề theo id
 */
export const updateIndustry = async (
  id: string,
  data: Partial<Industry>
): Promise<void> => {
  try {
    await setDoc(doc(db, "industries", id), data, { merge: true });
  } catch (error) {
    console.error("Error updating industry:", error);
    throw error;
  }
};

/**
 * Xóa ngành nghề theo id
 */
export const deleteIndustry = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "industries", id));
  } catch (error) {
    console.error("Error deleting industry:", error);
    throw error;
  }
};
