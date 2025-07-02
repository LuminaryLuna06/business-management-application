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
  writeBatch,
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
  type InspectionBatch,
} from "../types/schedule";
import { type SubLicense } from "../types/licenses";
import type { StaffUser } from "../types/user";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { firebaseConfig } from "./firebaseConfig";
import { type Industry } from "../types/industry";
import { v4 as uuidv4 } from "uuid";

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

/**
 * Xóa doanh nghiệp cùng toàn bộ sub-collection bằng batch
 */
export const deleteBusinessWithBatch = async (
  businessId: string
): Promise<void> => {
  const subCollections = [
    "licenses",
    "employees",
    "inspections",
    "violations",
    "reports",
  ];

  for (const subCol of subCollections) {
    const colRef = collection(db, "businesses", businessId, subCol);
    const snapshot = await getDocs(colRef);

    if (!snapshot.empty) {
      let batch = writeBatch(db);
      let opCount = 0;

      for (const document of snapshot.docs) {
        batch.delete(doc(db, "businesses", businessId, subCol, document.id));
        opCount++;

        if (opCount === 500) {
          await batch.commit();
          batch = writeBatch(db);
          opCount = 0;
        }
      }
      if (opCount > 0) {
        await batch.commit();
      }
    }
  }

  // Xóa document doanh nghiệp chính
  await deleteDoc(doc(db, "businesses", businessId));
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
 * Xóa một lịch kiểm tra và toàn bộ báo cáo, quyết định xử phạt liên quan (theo inspection_id)
 */
export const deleteInspectionAndLinkedData = async (
  businessId: string,
  inspectionId: string,
  inspectionDocId: string
): Promise<void> => {
  // 1. Xóa các report liên quan
  const reportsQuery = query(
    collection(db, "businesses", businessId, "reports"),
    where("inspection_id", "==", inspectionId)
  );
  const reportsSnap = await getDocs(reportsQuery);
  let batch = writeBatch(db);
  let opCount = 0;
  for (const document of reportsSnap.docs) {
    batch.delete(doc(db, "businesses", businessId, "reports", document.id));
    opCount++;
    if (opCount === 500) {
      await batch.commit();
      batch = writeBatch(db);
      opCount = 0;
    }
  }
  if (opCount > 0) await batch.commit();

  // 2. Xóa các violation liên quan
  const violationsQuery = query(
    collection(db, "businesses", businessId, "violations"),
    where("inspection_id", "==", inspectionId)
  );
  const violationsSnap = await getDocs(violationsQuery);
  batch = writeBatch(db);
  opCount = 0;
  for (const document of violationsSnap.docs) {
    batch.delete(doc(db, "businesses", businessId, "violations", document.id));
    opCount++;
    if (opCount === 500) {
      await batch.commit();
      batch = writeBatch(db);
      opCount = 0;
    }
  }
  if (opCount > 0) await batch.commit();

  // 3. Xóa document inspection chính
  await deleteDoc(
    doc(db, "businesses", businessId, "inspections", inspectionDocId)
  );
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

/**
 * Xóa một báo cáo và toàn bộ quyết định xử phạt liên quan (theo report_id)
 */
export const deleteReportAndLinkedViolations = async (
  businessId: string,
  reportId: string,
  reportDocId: string
): Promise<void> => {
  // 1. Xóa các violation liên quan
  const violationsQuery = query(
    collection(db, "businesses", businessId, "violations"),
    where("report_id", "==", reportId)
  );
  const violationsSnap = await getDocs(violationsQuery);
  let batch = writeBatch(db);
  let opCount = 0;
  for (const document of violationsSnap.docs) {
    batch.delete(doc(db, "businesses", businessId, "violations", document.id));
    opCount++;
    if (opCount === 500) {
      await batch.commit();
      batch = writeBatch(db);
      opCount = 0;
    }
  }
  if (opCount > 0) await batch.commit();

  // 2. Xóa document report chính
  await deleteDoc(doc(db, "businesses", businessId, "reports", reportDocId));
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

/**
 * Thêm đợt kiểm tra mới vào collection 'schedule'
 */
export const addSchedule = async (batch: InspectionBatch): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "schedule"), {
      ...batch,
      batch_date: Timestamp.fromDate(new Date(batch.batch_date)),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding schedule:", error);
    throw error;
  }
};

/**
 * Lấy tất cả đợt kiểm tra từ collection 'schedule'
 */
export const getAllSchedules = async (): Promise<
  (InspectionBatch & { id: string })[]
> => {
  try {
    const querySnapshot = await getDocs(collection(db, "schedule"));
    const schedules: (InspectionBatch & { id: string })[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      schedules.push({
        batch_id: data.batch_id,
        batch_name: data.batch_name,
        batch_date: convertTimestamp(data.batch_date),
        business_type: data.business_type,
        province: data.province,
        ward: data.ward,
        status: data.status,
        created_by: data.created_by,
        note: data.note,
        id: doc.id,
      });
    });
    return schedules;
  } catch (error) {
    console.error("Error getting schedules:", error);
    throw error;
  }
};

/**
 * Tạo đợt kiểm tra mới và tạo hàng loạt lịch kiểm tra cho các doanh nghiệp
 */
export const createInspectionBatchAndSchedules = async (
  batch: Omit<InspectionBatch, "batch_id">,
  businesses: { business_id: string }[]
): Promise<string> => {
  try {
    const batch_id = uuidv4();
    await addSchedule({ ...batch, batch_id, batch_date: batch.batch_date });
    const chunkSize = 500;
    for (let i = 0; i < businesses.length; i += chunkSize) {
      const batchWrite = writeBatch(db);
      const chunk = businesses.slice(i, i + chunkSize);
      chunk.forEach(({ business_id }) => {
        const inspectionRef = doc(
          collection(db, "businesses", business_id, "inspections")
        );
        batchWrite.set(inspectionRef, {
          inspection_id: batch_id,
          business_id,
          inspection_date: Timestamp.fromDate(new Date(batch.batch_date)),
          inspector_status: "pending",
          inspector_description: batch.batch_description || "",
        });
      });
      await batchWrite.commit();
    }
    return batch_id;
  } catch (error) {
    console.error("Error creating inspection batch and schedules:", error);
    throw error;
  }
};

/**
 * Lấy thống kê số lượng hộ và số đã kiểm tra theo inspection_id (batch_id)
 */
export const getInspectionStatsByBatchId = async (
  inspection_id: string
): Promise<{ total: number; checked: number }> => {
  try {
    const q = query(
      collectionGroup(db, "inspections"),
      where("inspection_id", "==", inspection_id)
    );
    const snapshot = await getDocs(q);
    let total = 0;
    let checked = 0;
    snapshot.forEach((doc) => {
      total++;
      const data = doc.data();
      if (data.inspector_status === "completed") checked++;
    });
    return { total, checked };
  } catch (error) {
    console.error("Error getting inspection stats by batch id:", error);
    throw error;
  }
};

/**
 * Lấy thống kê số lượng vi phạm và không vi phạm theo inspection_id (batch_id)
 */
export const getViolationStatsByBatchId = async (
  inspection_id: string
): Promise<{ violated: number; nonViolated: number }> => {
  try {
    // Lấy tất cả violations theo inspection_id
    const violationQuery = query(
      collectionGroup(db, "violations"),
      where("inspection_id", "==", inspection_id)
    );
    const violationSnap = await getDocs(violationQuery);
    const violatedBusinessIds = new Set<string>();
    violationSnap.forEach((doc) => {
      const data = doc.data();
      if (data.business_id) violatedBusinessIds.add(data.business_id);
    });
    // Lấy tất cả inspections theo inspection_id
    const inspectionQuery = query(
      collectionGroup(db, "inspections"),
      where("inspection_id", "==", inspection_id)
    );
    const inspectionSnap = await getDocs(inspectionQuery);
    let total = 0;
    let nonViolated = 0;
    inspectionSnap.forEach((doc) => {
      total++;
      const data = doc.data();
      if (data.business_id && !violatedBusinessIds.has(data.business_id)) {
        nonViolated++;
      }
    });
    return { violated: violatedBusinessIds.size, nonViolated };
  } catch (error) {
    console.error("Error getting violation stats by batch id:", error);
    throw error;
  }
};

/**
 * Xóa sạch một đợt kiểm tra: doc trong 'schedule', toàn bộ inspections, violations, reports liên quan inspection_id (batch_id)
 */
export const deleteInspectionBatchAndAllLinkedData = async (
  batchId: string,
  scheduleDocId?: string
): Promise<void> => {
  // 1. Xóa document đợt kiểm tra trong 'schedule'
  if (scheduleDocId) {
    await deleteDoc(doc(db, "schedule", scheduleDocId));
  } else {
    const q = query(
      collection(db, "schedule"),
      where("batch_id", "==", batchId)
    );
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      await deleteDoc(d.ref);
    }
  }

  // Helper để xóa collectionGroup theo batchId
  const deleteCollectionGroupByBatch = async (colGroup: string) => {
    const q = query(
      collectionGroup(db, colGroup),
      where("inspection_id", "==", batchId)
    );
    const snap = await getDocs(q);
    let batch = writeBatch(db);
    let opCount = 0;
    for (const docSnap of snap.docs) {
      batch.delete(docSnap.ref);
      opCount++;
      if (opCount === 500) {
        await batch.commit();
        batch = writeBatch(db);
        opCount = 0;
      }
    }
    if (opCount > 0) await batch.commit();
  };

  await deleteCollectionGroupByBatch("inspections");
  await deleteCollectionGroupByBatch("reports");
  await deleteCollectionGroupByBatch("violations");
};

/**
 * Cập nhật thông tin đợt kiểm tra trong collection 'schedule'
 */
export const updateInspectionBatch = async (
  scheduleDocId: string,
  batchData: Partial<InspectionBatch>
): Promise<void> => {
  try {
    const updateData: any = { ...batchData };
    if (batchData.batch_date) {
      updateData.batch_date = Timestamp.fromDate(
        new Date(batchData.batch_date)
      );
    }
    await setDoc(doc(db, "schedule", scheduleDocId), updateData, {
      merge: true,
    });
  } catch (error) {
    console.error("Error updating inspection batch:", error);
    throw error;
  }
};

/**
 * Cập nhật thông tin đợt kiểm tra và toàn bộ inspections liên quan
 */
export const updateInspectionBatchAndSchedules = async (
  scheduleDocId: string,
  batchData: Partial<InspectionBatch>
): Promise<void> => {
  try {
    // 1. Cập nhật document đợt kiểm tra
    await updateInspectionBatch(scheduleDocId, batchData);

    // 2. Lấy batch_id từ document đã cập nhật
    const batchDoc = await getDoc(doc(db, "schedule", scheduleDocId));
    const batchId = batchDoc.data()?.batch_id;

    if (batchId) {
      // 3. Cập nhật các trường liên quan trong tất cả inspections có inspection_id = batchId
      const inspectionsQuery = query(
        collectionGroup(db, "inspections"),
        where("inspection_id", "==", batchId)
      );
      const inspectionsSnap = await getDocs(inspectionsQuery);

      let batch = writeBatch(db);
      let opCount = 0;
      for (const docSnap of inspectionsSnap.docs) {
        const updateFields: any = {};
        if (batchData.batch_description !== undefined) {
          updateFields.inspector_description = batchData.batch_description;
        }
        if (batchData.batch_date !== undefined) {
          updateFields.inspection_date = Timestamp.fromDate(
            new Date(batchData.batch_date)
          );
        }
        if (Object.keys(updateFields).length > 0) {
          batch.update(docSnap.ref, updateFields);
          opCount++;
          if (opCount === 500) {
            await batch.commit();
            batch = writeBatch(db);
            opCount = 0;
          }
        }
      }
      if (opCount > 0) await batch.commit();
    }
  } catch (error) {
    console.error("Error updating inspection batch and schedules:", error);
    throw error;
  }
};
