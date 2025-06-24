import {
  Box,
  Text,
  Button,
  Group,
  Modal,
  Badge,
  SimpleGrid,
  Stack,
} from "@mantine/core";
// import { useDisclosure } from "@mantine/hooks";
import { useParams } from "react-router-dom";
import { useState } from "react";
import { useForm, yupResolver } from "@mantine/form";
import * as Yup from "yup";
import {
  useInspectionSchedules,
  useInspectionReports,
  useViolationDecisions,
} from "../../../../tanstack/useInspectionQueries";
import { MantineReactTable, type MRT_ColumnDef } from "mantine-react-table";

const inspectionSchema = Yup.object().shape({
  inspection_date: Yup.date().required("Ngày kiểm tra không được để trống"),
  inspector_description: Yup.string().required("Mô tả không được để trống"),
  inspector_status: Yup.mixed()
    .oneOf(["pending", "completed", "cancelled"])
    .required("Trạng thái không được để trống"),
});

// const resultSchema = Yup.object().shape({
//   result_desc: Yup.string().required("Mô tả kiểm tra không được để trống"),
//   result_status: Yup.mixed()
//     .oneOf(["pending", "confirmed", "cancelled"])
//     .required("Trạng thái kiểm tra không được để trống"),
// });

// const violationSchema = Yup.object().shape({
//   violation_number: Yup.string().required("Số quyết định không được để trống"),
//   issue_date: Yup.date().required("Ngày ban hành không được để trống"),
//   violation_status: Yup.mixed().oneOf(["pending", "paid", "dismissed"]),
//   fix_status: Yup.mixed().oneOf(["not_fixed", "fixed", "in_progress"]),
//   officer_signed: Yup.string().required("Cán bộ ký không được để trống"),
// });

const inspectionStatusOptions = [
  { value: "pending", label: "Chờ kiểm tra" },
  { value: "completed", label: "Đã hoàn thành" },
  { value: "cancelled", label: "Đã hủy" },
];

// useForm cho inspection
const inspectionForm = useForm({
  initialValues: {
    inspection_date: new Date(),
    inspector_description: "",
    inspector_status: "pending" as const,
  },
  validate: yupResolver(inspectionSchema),
});

// // useForm cho violation
// const resultForm = useForm({
//   initialValues: {
//     result_desc: "",
//     result_status: "pending" as const,
//   },
//   validate: yupResolver(violationSchema),
// });

// // useForm cho penalty decision
// const decisionForm = useForm({
//   initialValues: {
//     decision_number: "",
//     issue_date: new Date(),
//     penalty_status: "pending" as const,
//     fix_status: "not_fixed" as const,
//     officer_signed: "",
//   },
//   validate: yupResolver(violationSchema),
// });

function InspectionSchedulePage() {
  const { businessId } = useParams();
  // const [opened, { open, close }] = useDisclosure(false);
  const [selectedDecision, setSelectedDecision] = useState<any>(null);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const {
    data: inspections,
    isLoading,
    error,
  } = useInspectionSchedules(businessId || "");
  const {
    data: reports,
    isLoading: loadingReports,
    error: errorReports,
  } = useInspectionReports(businessId || "");
  const {
    data: violations,
    isLoading: loadingViolations,
    error: errorViolations,
  } = useViolationDecisions(businessId || "");

  const columns: MRT_ColumnDef<any>[] = [
    {
      accessorKey: "inspection_date",
      header: "Ngày kiểm tra",
      Cell: ({ cell }) => cell.getValue<Date>()?.toLocaleDateString() || "",
    },
    {
      accessorKey: "inspector_description",
      header: "Mô tả kiểm tra",
    },
    {
      accessorKey: "inspector_status",
      header: "Trạng thái",
      Cell: ({ cell }) => {
        const status = cell.getValue<string>();
        if (status === "pending") return "Chờ kiểm tra";
        if (status === "completed") return "Đã hoàn thành";
        if (status === "cancelled") return "Đã hủy";
        return status;
      },
    },
  ];

  if (isLoading) return <Text>Đang tải dữ liệu...</Text>;
  if (error) return <Text color="red">Lỗi tải dữ liệu lịch kiểm tra</Text>;

  return (
    <Box p="md">
      <Text size="xl" fw={700} mb="xs">
        Quản lý lịch kiểm tra & vi phạm
      </Text>
      <Text size="sm" color="dimmed" mb="md">
        Quản lý lịch kiểm tra định kỳ, ghi nhận kết quả kiểm tra, lỗi vi phạm,
        quyết định xử phạt và cán bộ thực hiện.
      </Text>
      <Group mb="md">
        <Button onClick={() => setAddModalOpen(true)}>
          Thêm lịch kiểm tra
        </Button>
      </Group>
      <MantineReactTable
        columns={columns}
        data={inspections || []}
        renderDetailPanel={({ row }) => {
          const inspectionId = row.original.inspection_id;
          if (loadingReports) return <Text>Đang tải kết quả kiểm tra...</Text>;
          if (errorReports)
            return <Text color="red">Lỗi tải kết quả kiểm tra</Text>;
          const filteredReports = (reports || []).filter(
            (r) => r.inspection_id === inspectionId
          );
          if (!filteredReports.length)
            return <Text>Chưa có kết quả kiểm tra</Text>;
          return (
            <Box>
              <Text fw={600} mb={4}>
                Kết quả kiểm tra:
              </Text>
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md" mt={8}>
                {filteredReports.map((report, idx) => {
                  const filteredViolations = (violations || []).filter(
                    (v) => v.report_id === report.report_id
                  );
                  return (
                    <Box key={idx} mb={8} p={8} style={{ borderRadius: 4 }}>
                      <Text>Mô tả: {report.report_description}</Text>
                      <Group gap={8} mb={4}>
                        <Text>Trạng thái: </Text>
                        {report.report_status === "finalized" ? (
                          <Badge color="green" variant="filled">
                            Đã xác nhận
                          </Badge>
                        ) : report.report_status === "draft" ? (
                          <Badge color="orange" variant="filled">
                            Bản nháp
                          </Badge>
                        ) : (
                          <Badge>{report.report_status}</Badge>
                        )}
                      </Group>
                      {loadingViolations ? (
                        <Text size="sm">
                          Đang kiểm tra quyết định xử phạt...
                        </Text>
                      ) : filteredViolations.length > 0 ? (
                        <Button
                          size="xs"
                          mt={8}
                          onClick={() => {
                            setSelectedDecision(filteredViolations[0]);
                            setDecisionModalOpen(true);
                          }}
                        >
                          Xem chi tiết quyết định xử phạt
                        </Button>
                      ) : (
                        <Button
                          size="xs"
                          mt={8}
                          variant="outline"
                          color="green"
                          onClick={() => {
                            setSelectedDecision({ reportId: report.report_id });
                            setDecisionModalOpen(true);
                          }}
                        >
                          Thêm quyết định xử phạt
                        </Button>
                      )}
                    </Box>
                  );
                })}
              </SimpleGrid>
            </Box>
          );
        }}
      />
      {/* Modal hiển thị hoặc thêm quyết định xử phạt (dùng Mantine Modal) */}
      <Modal
        opened={decisionModalOpen}
        onClose={() => setDecisionModalOpen(false)}
        title="Quyết định xử phạt"
        centered
      >
        {selectedDecision && selectedDecision.violation_number ? (
          <>
            <Text>Số quyết định: {selectedDecision.violation_number}</Text>
            <Text>
              Ngày ban hành:{" "}
              {selectedDecision.issue_date
                ? new Date(selectedDecision.issue_date).toLocaleDateString()
                : ""}
            </Text>
            <Group gap={8} mb={4}>
              <Text>Trạng thái: </Text>
              {selectedDecision.violation_status === "paid" ? (
                <Badge color="green" variant="filled">
                  Đã nộp phạt
                </Badge>
              ) : selectedDecision.violation_status === "pending" ? (
                <Badge color="orange" variant="filled">
                  Chờ xử lý
                </Badge>
              ) : selectedDecision.violation_status === "dismissed" ? (
                <Badge color="gray" variant="filled">
                  Đã miễn
                </Badge>
              ) : (
                <Badge>{selectedDecision.violation_status}</Badge>
              )}
            </Group>
            <Group gap={8} mb={4}>
              <Text>Trạng thái khắc phục: </Text>
              {selectedDecision.fix_status === "fixed" ? (
                <Badge color="green" variant="filled">
                  Đã khắc phục
                </Badge>
              ) : selectedDecision.fix_status === "not_fixed" ? (
                <Badge color="red" variant="filled">
                  Chưa khắc phục
                </Badge>
              ) : selectedDecision.fix_status === "in_progress" ? (
                <Badge color="orange" variant="filled">
                  Đang xử lý
                </Badge>
              ) : (
                <Badge>{selectedDecision.fix_status}</Badge>
              )}
            </Group>
            <Text>Cán bộ ký: {selectedDecision.officer_signed}</Text>
          </>
        ) : (
          <Text>Form thêm quyết định xử phạt (chưa triển khai)</Text>
        )}
      </Modal>
      {/* Modal thêm lịch kiểm tra */}
      <Modal
        opened={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Thêm lịch kiểm tra mới"
        centered
      >
        <form
          onSubmit={inspectionForm.onSubmit(() => {
            // TODO: Gọi API thêm inspection vào Firestore
            setAddModalOpen(false);
            inspectionForm.reset();
          })}
        >
          <Stack>
            <label>
              Ngày kiểm tra
              <input
                type="date"
                {...inspectionForm.getInputProps("inspection_date")}
                style={{ width: "100%", marginBottom: 8 }}
              />
              {inspectionForm.errors.inspection_date && (
                <Text color="red" size="xs">
                  {inspectionForm.errors.inspection_date}
                </Text>
              )}
            </label>
            <label>
              Mô tả kiểm tra
              <input
                type="text"
                placeholder="Nhập mô tả"
                {...inspectionForm.getInputProps("inspector_description")}
                style={{ width: "100%", marginBottom: 8 }}
              />
              {inspectionForm.errors.inspector_description && (
                <Text color="red" size="xs">
                  {inspectionForm.errors.inspector_description}
                </Text>
              )}
            </label>
            <label>
              Trạng thái
              <select
                {...inspectionForm.getInputProps("inspector_status")}
                style={{ width: "100%", marginBottom: 8 }}
              >
                {inspectionStatusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {inspectionForm.errors.inspector_status && (
                <Text color="red" size="xs">
                  {inspectionForm.errors.inspector_status}
                </Text>
              )}
            </label>
          </Stack>
          <Group mt="md" justify="flex-end">
            <Button variant="default" onClick={() => setAddModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit">Thêm</Button>
          </Group>
        </form>
      </Modal>
    </Box>
  );
}

export default InspectionSchedulePage;
