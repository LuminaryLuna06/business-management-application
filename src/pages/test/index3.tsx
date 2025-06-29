import { useState } from "react";
import {
  Box,
  Button,
  Text,
  Stack,
  Card,
  Group,
  Badge,
  Progress,
  Title,
} from "@mantine/core";
import {
  IconUpload,
  IconDatabase,
  IconBuilding,
  IconLicense,
  IconUsers,
  IconCalendar,
  IconFileReport,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { doc, setDoc, Timestamp, addDoc, collection } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { v4 as uuidv4 } from "uuid";
import { BusinessType, Gender, IdentificationType } from "../../types/business";
import type {
  InspectionSchedule,
  InspectionReport,
  ViolationResult,
} from "../../types/schedule";
import { ViolationTypeEnum } from "../../types/schedule";
// Mock data generators
// const getRandomIndustry = () => String(Math.floor(Math.random() * 100) + 1);

const generateMockBusinesses = () => [
  // Hộ kinh doanh (IndividualBusiness) - Hà Nội
  {
    business_id: uuidv4(),
    business_code: "010204567",
    business_name: "HỘ KINH DOANH THỊNH PHÁT",
    business_type: BusinessType.Individual,
    industry: "1",
    issue_date: new Date("2015-08-20"),
    address: "Hoàn Kiếm, Hà Nội",
    phone_number: "0912 345 678",
    email: "info@thinhphat.com",
    website: "www.thinhphat.com",
    created_at: Timestamp.fromDate(new Date()),
    updated_at: Timestamp.fromDate(new Date()),
    owner_name: "Nguyễn Văn A",
    citizen_id: "123456789012",
    registered_capital: 50000000,
    province: "Hà Nội",
    ward: "Hoàn Kiếm",
    owner: {
      id: uuidv4(),
      name: "Nguyễn Văn A",
      gender: Gender.Male,
      ethnicity: "Kinh",
      nationality: "Việt Nam",
      birthdate: new Date("1980-05-15"),
      identification_type: IdentificationType.CitizenID,
      identification_number: "123456789012",
      license_date: new Date("2015-08-20"),
      place_of_licensing: "Hà Nội",
      permanent_residence: "Hà Nội",
      address: "Hoàn Kiếm, Hà Nội",
    },
  },

  // Công ty TNHH (OrganizationBusiness) - TP.HCM
  {
    business_id: uuidv4(),
    business_code: "020305678",
    business_name: "CÔNG TY TNHH AN PHÚ",
    business_type: BusinessType.LLC,
    industry: "2",
    issue_date: new Date("2018-03-15"),
    address: "Hoàn Kiếm, Hà Nội",
    phone_number: "0987 654 321",
    email: "contact@anphu.com",
    created_at: Timestamp.fromDate(new Date()),
    updated_at: Timestamp.fromDate(new Date()),
    tax_code: "0312345678",
    registered_capital: 1000000000, // 1 tỷ VND (number)
    legal_representative: "Trần Thị B",
    province: "Hà Nội",
    ward: "Hoàn Kiếm",
    owner: {
      id: uuidv4(),
      name: "Trần Thị B",
      gender: Gender.Female,
      ethnicity: "Kinh",
      nationality: "Việt Nam",
      birthdate: new Date("1985-10-22"),
      identification_type: IdentificationType.CitizenID,
      identification_number: "987654321098",
      license_date: new Date("2018-03-15"),
      place_of_licensing: "TP.HCM",
      permanent_residence: "TP.HCM",
      address: "Hoàn Kiếm, Hà Nội",
      position: "Giám đốc",
    },
  },

  // Công ty Cổ phần (JointStockCompany) - TP.HCM
  {
    business_id: uuidv4(),
    business_code: "030406789",
    business_name: "CÔNG TY CỔ PHẦN MINH ANH",
    business_type: BusinessType.JSC,
    industry: "3",
    issue_date: new Date("2020-12-10"),
    address: "Hoàn Kiếm, Hà Nội",
    phone_number: "0123 456 789",
    email: "info@minhanh.com",
    created_at: Timestamp.fromDate(new Date()),
    updated_at: Timestamp.fromDate(new Date()),
    tax_code: "0312345679",
    registered_capital: 50000000000, // 50 tỷ VND (number)
    legal_representative: "Lê Văn C",
    share_price: 10000, // 10,000 VND/cổ phiếu
    total_shares: 5000000, // 5 triệu cổ phiếu
    province: "Hà Nội",
    ward: "Hoàn Kiếm",
    owner: {
      id: uuidv4(),
      name: "Lê Văn C",
      gender: Gender.Male,
      ethnicity: "Kinh",
      nationality: "Việt Nam",
      birthdate: new Date("1975-03-08"),
      identification_type: IdentificationType.CitizenID,
      identification_number: "456789123456",
      license_date: new Date("2020-12-10"),
      place_of_licensing: "TP.HCM",
      permanent_residence: "TP.HCM",
      address: "Hoàn Kiếm, Hà Nội",
      position: "Chủ tịch HĐQT",
    },
  },

  // Hộ kinh doanh (IndividualBusiness) - Đà Nẵng
  {
    business_id: uuidv4(),
    business_code: "040507890",
    business_name: "HỘ KINH DOANH BÌNH MINH",
    business_type: BusinessType.Individual,
    industry: "4",
    issue_date: new Date("2019-06-15"),
    address: "Hoàn Kiếm, Hà Nội",
    phone_number: "0905 123 456",
    email: "binhminh@gmail.com",
    created_at: Timestamp.fromDate(new Date()),
    updated_at: Timestamp.fromDate(new Date()),
    owner_name: "Phạm Thị D",
    citizen_id: "111222333444",
    registered_capital: 30000000,
    province: "Hà Nội",
    ward: "Hoàn Kiếm",
    owner: {
      id: uuidv4(),
      name: "Phạm Thị D",
      gender: Gender.Female,
      ethnicity: "Kinh",
      nationality: "Việt Nam",
      birthdate: new Date("1988-12-03"),
      identification_type: IdentificationType.CitizenID,
      identification_number: "111222333444",
      license_date: new Date("2019-06-15"),
      place_of_licensing: "Đà Nẵng",
      permanent_residence: "Đà Nẵng",
      address: "Hoàn Kiếm, Hà Nội",
    },
  },

  // Công ty TNHH (OrganizationBusiness) - Cần Thơ
  {
    business_id: uuidv4(),
    business_code: "050608901",
    business_name: "CÔNG TY TNHH THỦY SẢN CẦN THƠ",
    business_type: BusinessType.LLC,
    industry: "5",
    issue_date: new Date("2017-09-20"),
    address: "Hoàn Kiếm, Hà Nội",
    phone_number: "0292 345 678",
    email: "thuysan@cantho.com",
    created_at: Timestamp.fromDate(new Date()),
    updated_at: Timestamp.fromDate(new Date()),
    tax_code: "0312345680",
    registered_capital: 2000000000, // 2 tỷ VND
    legal_representative: "Hoàng Văn E",
    province: "Hà Nội",
    ward: "Hoàn Kiếm",
    owner: {
      id: uuidv4(),
      name: "Hoàng Văn E",
      gender: Gender.Male,
      ethnicity: "Kinh",
      nationality: "Việt Nam",
      birthdate: new Date("1970-07-12"),
      identification_type: IdentificationType.CitizenID,
      identification_number: "222333444555",
      license_date: new Date("2017-09-20"),
      place_of_licensing: "Cần Thơ",
      permanent_residence: "Cần Thơ",
      address: "Hoàn Kiếm, Hà Nội",
      position: "Giám đốc",
    },
  },
];

const generateMockLicenses = () => [
  {
    license_number: "RUOU-2024-001",
    issue_date: new Date("2024-01-10"),
    expiration_date: new Date("2025-01-10"),
    file_link: "",
  },
  {
    license_number: "PCCC-2024-002",
    issue_date: new Date("2024-02-15"),
    expiration_date: new Date("2025-02-15"),
    file_link: "",
  },
  {
    license_number: "ATTP-2024-003",
    issue_date: new Date("2024-03-20"),
    expiration_date: new Date("2025-03-20"),
    file_link: "",
  },
];

const generateMockEmployees = () => [
  {
    worker_name: "Nguyen Van A",
    birth_date: new Date("1990-05-15"),
    gender: Gender.Male,
    insurance_status: true,
    fire_safety_training: true,
    food_safety_training: false,
  },
  {
    worker_name: "Tran Thi B",
    birth_date: new Date("1992-08-22"),
    gender: Gender.Female,
    insurance_status: true,
    fire_safety_training: false,
    food_safety_training: true,
  },
  {
    worker_name: "Le Van C",
    birth_date: new Date("1985-03-10"),
    gender: Gender.Male,
    insurance_status: false,
    fire_safety_training: true,
    food_safety_training: true,
  },
];

const generateMockInspections = (mockBusinesses: any[]) => {
  // Tạo inspections, mỗi inspection gắn business_id theo thứ tự business
  const inspections: InspectionSchedule[] = [
    {
      inspection_id: uuidv4(),
      business_id: mockBusinesses[0]?.business_id,
      inspection_date: new Date("2024-03-15"),
      inspector_description: "Kiểm tra định kỳ quý 1",
      inspector_status: "completed",
    },
    {
      inspection_id: uuidv4(),
      business_id: mockBusinesses[1]?.business_id,
      inspection_date: new Date("2024-06-10"),
      inspector_description: "Kiểm tra đột xuất an toàn thực phẩm",
      inspector_status: "pending",
    },
    {
      inspection_id: uuidv4(),
      business_id: mockBusinesses[2]?.business_id,
      inspection_date: new Date("2024-09-20"),
      inspector_description: "Kiểm tra định kỳ quý 3",
      inspector_status: "completed",
    },
  ];

  // Tạo reports cho từng inspection
  const reports: InspectionReport[] = [
    // Inspection 1
    {
      report_id: uuidv4(),
      inspection_id: inspections[0].inspection_id,
      report_description: "Báo cáo kết quả kiểm tra định kỳ 1",
      report_status: "finalized",
    },
    {
      report_id: uuidv4(),
      inspection_id: inspections[0].inspection_id,
      report_description: "Báo cáo kết quả kiểm tra định kỳ 1 - bổ sung",
      report_status: "draft",
    },
    // Inspection 2
    {
      report_id: uuidv4(),
      inspection_id: inspections[1].inspection_id,
      report_description: "Báo cáo kiểm tra an toàn thực phẩm",
      report_status: "finalized",
    },
    // Inspection 3
    {
      report_id: uuidv4(),
      inspection_id: inspections[2].inspection_id,
      report_description: "Báo cáo kiểm tra quý 3",
      report_status: "draft",
    },
  ];

  // Tạo violations cho từng report
  const violations: ViolationResult[] = [
    // Report 1
    {
      violation_id: uuidv4(),
      report_id: reports[0].report_id,
      business_id:
        inspections.find(
          (ins) => ins.inspection_id === reports[0].inspection_id
        )?.business_id || "",
      violation_number: "QD-2024-001",
      violation_type: ViolationTypeEnum.FalseTaxDeclaration,
      issue_date: new Date("2024-03-16"),
      violation_status: "paid",
      fix_status: "fixed",
      officer_signed: "Nguyen Van A",
      file_link: "",
    },
    // Report 2
    {
      violation_id: uuidv4(),
      report_id: reports[1].report_id,
      business_id:
        inspections.find(
          (ins) => ins.inspection_id === reports[1].inspection_id
        )?.business_id || "",
      violation_number: "QD-2024-002",
      violation_type: ViolationTypeEnum.FalseTaxDeclaration,
      issue_date: new Date("2024-03-17"),
      violation_status: "pending",
      fix_status: "not_fixed",
      officer_signed: "Le Van C",
      file_link: "",
    },
    // Report 3
    {
      violation_id: uuidv4(),
      report_id: reports[2].report_id,
      business_id:
        inspections.find(
          (ins) => ins.inspection_id === reports[2].inspection_id
        )?.business_id || "",
      violation_number: "QD-2024-003",
      violation_type: ViolationTypeEnum.IllegalBusinessActivity,
      issue_date: new Date("2024-06-11"),
      violation_status: "dismissed",
      fix_status: "fixed",
      officer_signed: "Tran Thi B",
      file_link: "",
    },
    // Report 4
    {
      violation_id: uuidv4(),
      report_id: reports[3].report_id,
      business_id:
        inspections.find(
          (ins) => ins.inspection_id === reports[3].inspection_id
        )?.business_id || "",
      violation_number: "QD-2024-004",
      violation_type: ViolationTypeEnum.UnregisteredLabor,
      issue_date: new Date("2024-09-21"),
      violation_status: "pending",
      fix_status: "in_progress",
      officer_signed: "Pham Van D",
      file_link: "",
    },
  ];

  return { inspections, reports, violations };
};

interface UploadStatus {
  businesses: { success: number; error: number; total: number };
  licenses: { success: number; error: number; total: number };
  employees: { success: number; error: number; total: number };
  inspections: { success: number; error: number; total: number };
  reports: { success: number; error: number; total: number };
  violations: { success: number; error: number; total: number };
}

function Index3() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    businesses: { success: 0, error: 0, total: 0 },
    licenses: { success: 0, error: 0, total: 0 },
    employees: { success: 0, error: 0, total: 0 },
    inspections: { success: 0, error: 0, total: 0 },
    reports: { success: 0, error: 0, total: 0 },
    violations: { success: 0, error: 0, total: 0 },
  });
  const [uploadLog, setUploadLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    setUploadLog((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const updateStatus = (collection: keyof UploadStatus, success: boolean) => {
    setUploadStatus((prev) => ({
      ...prev,
      [collection]: {
        ...prev[collection],
        success: prev[collection].success + (success ? 1 : 0),
        error: prev[collection].error + (success ? 0 : 1),
        total: prev[collection].total + 1,
      },
    }));
  };

  const getBusinessTypeLabel = (businessType: BusinessType) => {
    switch (businessType) {
      case BusinessType.Individual:
        return "HỘ KINH DOANH";
      case BusinessType.LLC:
        return "CÔNG TY TNHH";
      case BusinessType.JSC:
        return "CÔNG TY CỔ PHẦN";
      default:
        return "Doanh nghiệp";
    }
  };

  const uploadMockData = async () => {
    setIsUploading(true);
    setUploadLog([]);
    setUploadStatus({
      businesses: { success: 0, error: 0, total: 0 },
      licenses: { success: 0, error: 0, total: 0 },
      employees: { success: 0, error: 0, total: 0 },
      inspections: { success: 0, error: 0, total: 0 },
      reports: { success: 0, error: 0, total: 0 },
      violations: { success: 0, error: 0, total: 0 },
    });

    try {
      addLog("Bắt đầu upload dữ liệu mock...");

      // Generate mock businesses
      const mockBusinesses = generateMockBusinesses();
      addLog(
        `Tạo ${mockBusinesses.length} doanh nghiệp mock với các loại hình khác nhau`
      );

      // Upload businesses
      for (const business of mockBusinesses) {
        try {
          await setDoc(doc(db, "businesses", business.business_id), business);
          updateStatus("businesses", true);
          addLog(
            `✓ Upload ${getBusinessTypeLabel(business.business_type)}: ${
              business.business_name
            }`
          );
        } catch (error) {
          updateStatus("businesses", false);
          addLog(
            `✗ Lỗi upload ${getBusinessTypeLabel(business.business_type)}: ${
              business.business_name
            } - ${error}`
          );
        }
      }

      // Upload subcollections for each business
      for (const business of mockBusinesses) {
        addLog(
          `Upload subcollections cho ${getBusinessTypeLabel(
            business.business_type
          )}: ${business.business_name}`
        );

        // Upload licenses
        const mockLicenses = generateMockLicenses();
        for (const license of mockLicenses) {
          try {
            const licenseData = {
              license_number: license.license_number,
              issue_date: Timestamp.fromDate(license.issue_date),
              expiration_date: Timestamp.fromDate(license.expiration_date),
            };
            await addDoc(
              collection(db, "businesses", business.business_id, "licenses"),
              licenseData
            );
            updateStatus("licenses", true);
            addLog(`  ✓ Upload giấy phép: ${license.license_number}`);
          } catch (error) {
            updateStatus("licenses", false);
            addLog(
              `  ✗ Lỗi upload giấy phép: ${license.license_number} - ${error}`
            );
          }
        }

        // Upload employees
        const mockEmployees = generateMockEmployees();
        for (const employee of mockEmployees) {
          try {
            const employeeData = {
              worker_name: employee.worker_name,
              birth_date: Timestamp.fromDate(employee.birth_date),
              gender: employee.gender,
              insurance_status: employee.insurance_status,
              fire_safety_training: employee.fire_safety_training,
              food_safety_training: employee.food_safety_training,
            };
            await addDoc(
              collection(db, "businesses", business.business_id, "employees"),
              employeeData
            );
            updateStatus("employees", true);
            addLog(`  ✓ Upload nhân viên: ${employee.worker_name}`);
          } catch (error) {
            updateStatus("employees", false);
            addLog(
              `  ✗ Lỗi upload nhân viên: ${employee.worker_name} - ${error}`
            );
          }
        }

        // Upload inspections
        const { inspections, reports, violations } =
          generateMockInspections(mockBusinesses);
        for (const inspection of inspections) {
          try {
            const inspectionData = {
              inspection_id: inspection.inspection_id,
              business_id: business.business_id,
              inspection_date: Timestamp.fromDate(inspection.inspection_date),
              inspector_description: inspection.inspector_description,
              inspector_status: inspection.inspector_status,
            };
            await addDoc(
              collection(db, "businesses", business.business_id, "inspections"),
              inspectionData
            );
            updateStatus("inspections", true);
            addLog(
              `  ✓ Upload lịch kiểm tra: ${inspection.inspector_description}`
            );
          } catch (error) {
            updateStatus("inspections", false);
            addLog(
              `  ✗ Lỗi upload lịch kiểm tra: ${inspection.inspector_description} - ${error}`
            );
          }
        }

        // Upload reports
        for (const report of reports) {
          try {
            const reportData = {
              report_id: report.report_id,
              inspection_id: report.inspection_id,
              report_description: report.report_description,
              report_status: report.report_status,
            };
            await addDoc(
              collection(db, "businesses", business.business_id, "reports"),
              reportData
            );
            updateStatus("reports", true);
            addLog(`    ✓ Upload báo cáo: ${report.report_description}`);
          } catch (error) {
            updateStatus("reports", false);
            addLog(
              `    ✗ Lỗi upload báo cáo: ${report.report_description} - ${error}`
            );
          }
        }

        // Upload violations
        for (const violation of violations) {
          try {
            const violationData = {
              violation_id: violation.violation_id,
              report_id: violation.report_id,
              business_id: violation.business_id,
              violation_number: violation.violation_number,
              violation_type: violation.violation_type,
              issue_date: Timestamp.fromDate(violation.issue_date),
              violation_status: violation.violation_status,
              fix_status: violation.fix_status,
              officer_signed: violation.officer_signed,
            };
            await addDoc(
              collection(db, "businesses", business.business_id, "violations"),
              violationData
            );
            updateStatus("violations", true);
            addLog(
              `      ✓ Upload quyết định xử phạt: ${violation.violation_number}`
            );
          } catch (error) {
            updateStatus("violations", false);
            addLog(
              `      ✗ Lỗi upload quyết định xử phạt: ${violation.violation_number} - ${error}`
            );
          }
        }
      }

      addLog("Hoàn thành upload dữ liệu mock!");
    } catch (error) {
      addLog(`Lỗi tổng quát: ${error}`);
    } finally {
      setIsUploading(false);
    }
  };

  const getProgressPercentage = (status: {
    success: number;
    error: number;
    total: number;
  }) => {
    if (status.total === 0) return 0;
    return Math.round(((status.success + status.error) / status.total) * 100);
  };

  const getStatusColor = (status: {
    success: number;
    error: number;
    total: number;
  }) => {
    if (status.total === 0) return "gray";
    if (status.error === 0) return "green";
    if (status.success === 0) return "red";
    return "yellow";
  };

  return (
    <Box p="md">
      <Title order={2} mb="lg">
        <IconDatabase size={24} style={{ marginRight: 8 }} />
        Upload Dữ Liệu Mock lên Firebase
      </Title>

      <Card withBorder mb="lg">
        <Stack>
          <Text size="lg" fw={600}>
            Chức năng Upload Dữ liệu
          </Text>
          <Text size="sm" color="dimmed">
            Upload dữ liệu mock lên tất cả các collection và subcollection trong
            Firebase Firestore
          </Text>

          <Button
            leftSection={<IconUpload size={20} />}
            size="lg"
            onClick={uploadMockData}
            loading={isUploading}
            disabled={isUploading}
            color="blue"
          >
            {isUploading ? "Đang Upload..." : "Upload Dữ Liệu Mock"}
          </Button>
        </Stack>
      </Card>

      {/* Upload Status */}
      <Card withBorder mb="lg">
        <Title order={4} mb="md">
          Trạng thái Upload
        </Title>

        <Stack gap="md">
          {/* Businesses */}
          <Box>
            <Group justify="space-between" mb="xs">
              <Group>
                <IconBuilding size={16} />
                <Text fw={500}>Doanh nghiệp</Text>
              </Group>
              <Badge color={getStatusColor(uploadStatus.businesses)}>
                {uploadStatus.businesses.success}/
                {uploadStatus.businesses.total} thành công
              </Badge>
            </Group>
            <Progress
              value={getProgressPercentage(uploadStatus.businesses)}
              color={getStatusColor(uploadStatus.businesses)}
              size="sm"
            />
          </Box>

          {/* Licenses */}
          <Box>
            <Group justify="space-between" mb="xs">
              <Group>
                <IconLicense size={16} />
                <Text fw={500}>Giấy phép con</Text>
              </Group>
              <Badge color={getStatusColor(uploadStatus.licenses)}>
                {uploadStatus.licenses.success}/{uploadStatus.licenses.total}{" "}
                thành công
              </Badge>
            </Group>
            <Progress
              value={getProgressPercentage(uploadStatus.licenses)}
              color={getStatusColor(uploadStatus.licenses)}
              size="sm"
            />
          </Box>

          {/* Employees */}
          <Box>
            <Group justify="space-between" mb="xs">
              <Group>
                <IconUsers size={16} />
                <Text fw={500}>Nhân viên</Text>
              </Group>
              <Badge color={getStatusColor(uploadStatus.employees)}>
                {uploadStatus.employees.success}/{uploadStatus.employees.total}{" "}
                thành công
              </Badge>
            </Group>
            <Progress
              value={getProgressPercentage(uploadStatus.employees)}
              color={getStatusColor(uploadStatus.employees)}
              size="sm"
            />
          </Box>

          {/* Inspections */}
          <Box>
            <Group justify="space-between" mb="xs">
              <Group>
                <IconCalendar size={16} />
                <Text fw={500}>Lịch kiểm tra</Text>
              </Group>
              <Badge color={getStatusColor(uploadStatus.inspections)}>
                {uploadStatus.inspections.success}/
                {uploadStatus.inspections.total} thành công
              </Badge>
            </Group>
            <Progress
              value={getProgressPercentage(uploadStatus.inspections)}
              color={getStatusColor(uploadStatus.inspections)}
              size="sm"
            />
          </Box>

          {/* Reports */}
          <Box>
            <Group justify="space-between" mb="xs">
              <Group>
                <IconFileReport size={16} />
                <Text fw={500}>Báo cáo kiểm tra</Text>
              </Group>
              <Badge color={getStatusColor(uploadStatus.reports)}>
                {uploadStatus.reports.success}/{uploadStatus.reports.total}{" "}
                thành công
              </Badge>
            </Group>
            <Progress
              value={getProgressPercentage(uploadStatus.reports)}
              color={getStatusColor(uploadStatus.reports)}
              size="sm"
            />
          </Box>

          {/* Violations */}
          <Box>
            <Group justify="space-between" mb="xs">
              <Group>
                <IconAlertTriangle size={16} />
                <Text fw={500}>Quyết định xử phạt</Text>
              </Group>
              <Badge color={getStatusColor(uploadStatus.violations)}>
                {uploadStatus.violations.success}/
                {uploadStatus.violations.total} thành công
              </Badge>
            </Group>
            <Progress
              value={getProgressPercentage(uploadStatus.violations)}
              color={getStatusColor(uploadStatus.violations)}
              size="sm"
            />
          </Box>
        </Stack>
      </Card>

      {/* Upload Log */}
      <Card withBorder>
        <Title order={4} mb="md">
          Log Upload
        </Title>
        <Box
          style={{
            maxHeight: 300,
            overflowY: "auto",
            padding: "12px",
            borderRadius: "8px",
            fontFamily: "monospace",
            fontSize: "12px",
          }}
        >
          {uploadLog.length === 0 ? (
            <Text color="dimmed">Chưa có log upload...</Text>
          ) : (
            uploadLog.map((log, index) => (
              <Text key={index} style={{ marginBottom: "4px" }}>
                {log}
              </Text>
            ))
          )}
        </Box>
      </Card>
    </Box>
  );
}

export default Index3;
