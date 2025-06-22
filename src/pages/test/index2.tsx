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
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { v4 as uuidv4 } from "uuid";
import { BusinessType, Gender, IdentificationType } from "../../types/business";
import { LicenseType } from "../../types/licenses";
// Mock data generators
const generateMockBusinesses = () => [
  // Hộ kinh doanh (IndividualBusiness) - Hà Nội
  {
    business_id: uuidv4(),
    business_code: "010204567",
    business_name: "HỘ KINH DOANH THỊNH PHÁT",
    business_type: BusinessType.Individual,
    industry: "Thương mại",
    issue_date: new Date("2015-08-20"),
    address: "12 Lý Thường Kiệt, Q. Hoàn Kiếm, Hà Nội",
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
      address: "12 Lý Thường Kiệt, Q. Hoàn Kiếm, Hà Nội",
    },
  },

  // Công ty TNHH (OrganizationBusiness) - TP.HCM
  {
    business_id: uuidv4(),
    business_code: "020305678",
    business_name: "CÔNG TY TNHH AN PHÚ",
    business_type: BusinessType.LLC,
    industry: "Xây dựng",
    issue_date: new Date("2018-03-15"),
    address: "78 Nguyễn Huệ, Q. 1, TP.HCM",
    phone_number: "0987 654 321",
    email: "contact@anphu.com",
    created_at: Timestamp.fromDate(new Date()),
    updated_at: Timestamp.fromDate(new Date()),
    tax_code: "0312345678",
    registered_capital: 1000000000, // 1 tỷ VND (number)
    legal_representative: "Trần Thị B",
    province: "Hồ Chí Minh",
    ward: "Quận 1",
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
      address: "78 Nguyễn Huệ, Q. 1, TP.HCM",
      position: "Giám đốc",
    },
  },

  // Công ty Cổ phần (JointStockCompany) - TP.HCM
  {
    business_id: uuidv4(),
    business_code: "030406789",
    business_name: "CÔNG TY CỔ PHẦN MINH ANH",
    business_type: BusinessType.JSC,
    industry: "Bán lẻ thực phẩm",
    issue_date: new Date("2020-12-10"),
    address: "101 Hùng Vương, Q. 5, TP.HCM",
    phone_number: "0123 456 789",
    email: "info@minhanh.com",
    created_at: Timestamp.fromDate(new Date()),
    updated_at: Timestamp.fromDate(new Date()),
    tax_code: "0312345679",
    registered_capital: 50000000000, // 50 tỷ VND (number)
    legal_representative: "Lê Văn C",
    share_price: 10000, // 10,000 VND/cổ phiếu
    total_shares: 5000000, // 5 triệu cổ phiếu
    province: "Hồ Chí Minh",
    ward: "Quận 5",
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
      address: "101 Hùng Vương, Q. 5, TP.HCM",
      position: "Chủ tịch HĐQT",
    },
  },

  // Hộ kinh doanh (IndividualBusiness) - Đà Nẵng
  {
    business_id: uuidv4(),
    business_code: "040507890",
    business_name: "HỘ KINH DOANH BÌNH MINH",
    business_type: BusinessType.Individual,
    industry: "Kinh doanh ăn uống",
    issue_date: new Date("2019-06-15"),
    address: "45 Trần Phú, Q. Hải Châu, Đà Nẵng",
    phone_number: "0905 123 456",
    email: "binhminh@gmail.com",
    created_at: Timestamp.fromDate(new Date()),
    updated_at: Timestamp.fromDate(new Date()),
    owner_name: "Phạm Thị D",
    citizen_id: "111222333444",
    registered_capital: 30000000,
    province: "Đà Nẵng",
    ward: "Hải Châu",
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
      address: "45 Trần Phú, Q. Hải Châu, Đà Nẵng",
    },
  },

  // Công ty TNHH (OrganizationBusiness) - Cần Thơ
  {
    business_id: uuidv4(),
    business_code: "050608901",
    business_name: "CÔNG TY TNHH THỦY SẢN CẦN THƠ",
    business_type: BusinessType.LLC,
    industry: "Thủy sản",
    issue_date: new Date("2017-09-20"),
    address: "123 Nguyễn Văn Linh, Q. Ninh Kiều, Cần Thơ",
    phone_number: "0292 345 678",
    email: "thuysan@cantho.com",
    created_at: Timestamp.fromDate(new Date()),
    updated_at: Timestamp.fromDate(new Date()),
    tax_code: "0312345680",
    registered_capital: 2000000000, // 2 tỷ VND
    legal_representative: "Hoàng Văn E",
    province: "Cần Thơ",
    ward: "Ninh Kiều",
    owner: {
      id: uuidv4(),
      name: "Hoàng Văn E",
      gender: Gender.Male,
      ethnicity: "Kinh",
      nationality: "Việt Nam",
      birthdate: new Date("1970-07-12"),
      identification_type: IdentificationType.CitizenID,
      identification_number: "555666777888",
      license_date: new Date("2017-09-20"),
      place_of_licensing: "Cần Thơ",
      permanent_residence: "Cần Thơ",
      address: "123 Nguyễn Văn Linh, Q. Ninh Kiều, Cần Thơ",
      position: "Giám đốc",
    },
  },
];

const generateMockLicenses = (businessId: string) => [
  {
    license_id: uuidv4(),
    business_id: businessId,
    license_type: LicenseType.FireSafety,
    license_number: "PCCC-2024-001",
    issue_date: new Date("2024-01-15"),
    expiration_date: new Date("2025-01-15"),
  },
  {
    license_id: uuidv4(),
    business_id: businessId,
    license_type: LicenseType.FoodSafety,
    license_number: "ATTP-2024-002",
    issue_date: new Date("2024-02-20"),
    expiration_date: new Date("2025-02-20"),
  },
  {
    license_id: uuidv4(),
    business_id: businessId,
    license_type: LicenseType.PublicOrder,
    license_number: "ANTT-2024-003",
    issue_date: new Date("2024-03-10"),
    expiration_date: new Date("2025-03-10"),
  },
];

const generateMockEmployees = (businessId: string) => [
  {
    worker_id: uuidv4(),
    business_id: businessId,
    worker_name: "Nguyen Van A",
    birth_date: new Date("1990-05-15"),
    gender: Gender.Male,
    insurance_status: true,
    fire_safety_training: true,
    food_safety_training: false,
  },
  {
    worker_id: uuidv4(),
    business_id: businessId,
    worker_name: "Tran Thi B",
    birth_date: new Date("1992-08-22"),
    gender: Gender.Female,
    insurance_status: true,
    fire_safety_training: false,
    food_safety_training: true,
  },
  {
    worker_id: uuidv4(),
    business_id: businessId,
    worker_name: "Le Van C",
    birth_date: new Date("1985-03-10"),
    gender: Gender.Male,
    insurance_status: false,
    fire_safety_training: true,
    food_safety_training: true,
  },
];

const generateMockInspections = (businessId: string) => [
  {
    schedule_id: uuidv4(),
    business_code: businessId,
    inspection_date: new Date("2024-03-15"),
    inspector_description: "Kiểm tra định kỳ quý 1",
    inspector_status: "completed" as const,
  },
  {
    schedule_id: uuidv4(),
    business_code: businessId,
    inspection_date: new Date("2024-06-10"),
    inspector_description: "Kiểm tra đột xuất an toàn thực phẩm",
    inspector_status: "pending" as const,
  },
  {
    schedule_id: uuidv4(),
    business_code: businessId,
    inspection_date: new Date("2024-09-20"),
    inspector_description: "Kiểm tra định kỳ quý 3",
    inspector_status: "completed" as const,
  },
];

const generateMockReports = (scheduleId: string) => [
  {
    report_id: uuidv4(),
    schedule_id: scheduleId,
    report_description: "Báo cáo kết quả kiểm tra định kỳ",
    report_status: "finalized" as const,
  },
];

const generateMockViolations = (reportId: string) => [
  {
    violation_id: uuidv4(),
    report_id: reportId,
    violation_number: "QD-2024-001",
    issue_date: new Date("2024-03-16"),
    violation_status: "paid" as const,
    fix_status: "fixed" as const,
    officer_signed: "Nguyen Van A",
  },
  {
    violation_id: uuidv4(),
    report_id: reportId,
    violation_number: "QD-2024-002",
    issue_date: new Date("2024-03-16"),
    violation_status: "pending" as const,
    fix_status: "not_fixed" as const,
    officer_signed: "Le Van C",
  },
];

interface UploadStatus {
  businesses: { success: number; error: number; total: number };
  licenses: { success: number; error: number; total: number };
  employees: { success: number; error: number; total: number };
  inspections: { success: number; error: number; total: number };
  reports: { success: number; error: number; total: number };
  violations: { success: number; error: number; total: number };
}

function Index2() {
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
        const mockLicenses = generateMockLicenses(business.business_id);
        for (const license of mockLicenses) {
          try {
            const licenseData = {
              license_id: license.license_id,
              business_id: license.business_id,
              license_type: license.license_type,
              license_number: license.license_number,
              issue_date: Timestamp.fromDate(license.issue_date),
              expiration_date: Timestamp.fromDate(license.expiration_date),
            };

            await setDoc(
              doc(
                db,
                "businesses",
                business.business_id,
                "licenses",
                license.license_id
              ),
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
        const mockEmployees = generateMockEmployees(business.business_id);
        for (const employee of mockEmployees) {
          try {
            const employeeData = {
              worker_id: employee.worker_id,
              business_id: employee.business_id,
              worker_name: employee.worker_name,
              birth_date: Timestamp.fromDate(employee.birth_date),
              gender: employee.gender,
              insurance_status: employee.insurance_status,
              fire_safety_training: employee.fire_safety_training,
              food_safety_training: employee.food_safety_training,
            };

            await setDoc(
              doc(
                db,
                "businesses",
                business.business_id,
                "employees",
                employee.worker_id
              ),
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
        const mockInspections = generateMockInspections(business.business_id);
        for (const inspection of mockInspections) {
          try {
            const inspectionData = {
              schedule_id: inspection.schedule_id,
              business_code: inspection.business_code,
              inspection_date: Timestamp.fromDate(inspection.inspection_date),
              inspector_description: inspection.inspector_description,
              inspector_status: inspection.inspector_status,
            };

            await setDoc(
              doc(
                db,
                "businesses",
                business.business_id,
                "inspections",
                inspection.schedule_id
              ),
              inspectionData
            );
            updateStatus("inspections", true);
            addLog(
              `  ✓ Upload lịch kiểm tra: ${inspection.inspector_description}`
            );

            // Upload reports for this inspection
            const mockReports = generateMockReports(inspection.schedule_id);
            for (const report of mockReports) {
              try {
                const reportData = {
                  report_id: report.report_id,
                  schedule_id: report.schedule_id,
                  report_description: report.report_description,
                  report_status: report.report_status,
                };

                await setDoc(
                  doc(
                    db,
                    "businesses",
                    business.business_id,
                    "inspections",
                    inspection.schedule_id,
                    "reports",
                    report.report_id
                  ),
                  reportData
                );
                updateStatus("reports", true);
                addLog(`    ✓ Upload báo cáo: ${report.report_description}`);

                // Upload violations for this report
                const mockViolations = generateMockViolations(report.report_id);
                for (const violation of mockViolations) {
                  try {
                    const violationData = {
                      violation_id: violation.violation_id,
                      report_id: violation.report_id,
                      violation_number: violation.violation_number,
                      issue_date: Timestamp.fromDate(violation.issue_date),
                      violation_status: violation.violation_status,
                      fix_status: violation.fix_status,
                      officer_signed: violation.officer_signed,
                    };

                    await setDoc(
                      doc(
                        db,
                        "businesses",
                        business.business_id,
                        "inspections",
                        inspection.schedule_id,
                        "reports",
                        report.report_id,
                        "violations",
                        violation.violation_id
                      ),
                      violationData
                    );
                    updateStatus("violations", true);
                    addLog(
                      `      ✓ Upload vi phạm: ${violation.violation_number}`
                    );
                  } catch (error) {
                    updateStatus("violations", false);
                    addLog(
                      `      ✗ Lỗi upload vi phạm: ${violation.violation_number} - ${error}`
                    );
                  }
                }
              } catch (error) {
                updateStatus("reports", false);
                addLog(
                  `    ✗ Lỗi upload báo cáo: ${report.report_description} - ${error}`
                );
              }
            }
          } catch (error) {
            updateStatus("inspections", false);
            addLog(
              `  ✗ Lỗi upload lịch kiểm tra: ${inspection.inspector_description} - ${error}`
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
            backgroundColor: "#f8f9fa",
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

export default Index2;
