import {
  Box,
  Text,
  Button,
  Group,
  Modal,
  Badge,
  SimpleGrid,
  Stack,
  TextInput,
  Select,
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
  useAddInspectionMutation,
  useAddReportMutation,
  useAddViolationMutation,
} from "../../../../tanstack/useInspectionQueries";
import { MantineReactTable, type MRT_ColumnDef } from "mantine-react-table";
import { DateInput } from "@mantine/dates";
import { v4 as uuidv4 } from "uuid";

const inspectionSchema = Yup.object().shape({
  inspection_date: Yup.date().required("Ngày kiểm tra không được để trống"),
  inspector_description: Yup.string().required("Mô tả không được để trống"),
  inspector_status: Yup.mixed()
    .oneOf(["pending", "completed", "cancelled"])
    .required("Trạng thái không được để trống"),
});

const inspectionStatusOptions = [
  { value: "pending", label: "Chờ kiểm tra" },
  { value: "completed", label: "Đã hoàn thành" },
  { value: "cancelled", label: "Đã hủy" },
];

const reportSchema = Yup.object().shape({
  report_description: Yup.string().required(
    "Mô tả báo cáo không được để trống"
  ),
  report_status: Yup.mixed()
    .oneOf(["draft", "finalized"])
    .required("Trạng thái không được để trống"),
});

const reportStatusOptions = [
  { value: "draft", label: "Bản nháp" },
  { value: "finalized", label: "Đã xác nhận" },
];

const violationSchema = Yup.object().shape({
  violation_number: Yup.string().required("Số quyết định không được để trống"),
  issue_date: Yup.date().required("Ngày ban hành không được để trống"),
  violation_status: Yup.mixed()
    .oneOf(["pending", "paid", "dismissed"])
    .required("Trạng thái không được để trống"),
  fix_status: Yup.mixed()
    .oneOf(["not_fixed", "fixed", "in_progress"])
    .required("Trạng thái khắc phục không được để trống"),
  officer_signed: Yup.string().required("Cán bộ ký không được để trống"),
});

const violationStatusOptions = [
  { value: "pending", label: "Chờ xử lý" },
  { value: "paid", label: "Đã nộp phạt" },
  { value: "dismissed", label: "Đã miễn" },
];

const fixStatusOptions = [
  { value: "not_fixed", label: "Chưa khắc phục" },
  { value: "fixed", label: "Đã khắc phục" },
  { value: "in_progress", label: "Đang xử lý" },
];

function InspectionSchedulePage() {
  const { businessId } = useParams();
  const [selectedDecision, setSelectedDecision] = useState<any>(null);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addReportModalOpen, setAddReportModalOpen] = useState(false);
  const [addViolationModalOpen, setAddViolationModalOpen] = useState(false);
  const [currentInspectionId, setCurrentInspectionId] = useState<string | null>(
    null
  );
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);
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
    // error: errorViolations,
  } = useViolationDecisions(businessId || "");
  const addInspectionMutation = useAddInspectionMutation(businessId || "");
  const addReportMutation = useAddReportMutation(businessId || "");
  const addViolationMutation = useAddViolationMutation(businessId || "");
  // useForm cho inspection
  const inspectionForm = useForm({
    initialValues: {
      inspection_date: new Date(),
      inspector_description: "",
      inspector_status: "pending" as const,
    },
    validate: yupResolver(inspectionSchema),
  });
  const reportForm = useForm({
    initialValues: {
      report_id: "",
      inspection_id: "",
      report_description: "",
      report_status: "draft",
    },
    validate: yupResolver(reportSchema),
  });
  const violationForm = useForm({
    initialValues: {
      violation_number: "",
      issue_date: new Date(),
      violation_status: "pending",
      fix_status: "not_fixed",
      officer_signed: "",
    },
    validate: yupResolver(violationSchema),
  });

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
              <Group justify="space-between" mb={8}>
                <Text fw={600}>Kết quả kiểm tra</Text>
                <Button
                  size="xs"
                  onClick={() => {
                    setCurrentInspectionId(inspectionId);
                    setAddReportModalOpen(true);
                  }}
                >
                  Thêm kết quả kiểm tra
                </Button>
              </Group>
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md" mt={8}>
                {filteredReports.map((report, idx) => {
                  const filteredViolations = (violations || []).filter(
                    (v) => v.report_id === report.report_id
                  );
                  return (
                    <Box
                      key={idx}
                      mb={8}
                      p={12}
                      style={{
                        border: "1px solid #228be6",
                        borderRadius: 8,
                      }}
                    >
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
                            setCurrentReportId(report.report_id);
                            setAddViolationModalOpen(true);
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
          onSubmit={inspectionForm.onSubmit(async (values) => {
            if (!businessId) return;
            const inspectionData = {
              inspection_id: uuidv4(),
              inspection_date: values.inspection_date,
              inspector_description: values.inspector_description,
              inspector_status: values.inspector_status,
            };
            addInspectionMutation.mutate(inspectionData, {
              onSuccess: () => {
                setAddModalOpen(false);
                inspectionForm.reset();
              },
              // Có thể thêm onError để hiển thị lỗi nếu muốn
            });
          })}
        >
          <Stack>
            <DateInput
              label="Ngày kiểm tra"
              value={inspectionForm.values.inspection_date}
              onChange={(date) =>
                inspectionForm.setFieldValue(
                  "inspection_date",
                  date ?? new Date()
                )
              }
              error={inspectionForm.errors.inspection_date}
              required
              style={{ marginBottom: 8 }}
            />
            <TextInput
              label="Mô tả kiểm tra"
              placeholder="Nhập mô tả"
              {...inspectionForm.getInputProps("inspector_description")}
              error={inspectionForm.errors.inspector_description}
              required
              style={{ marginBottom: 8 }}
            />
            <Select
              label="Trạng thái"
              data={inspectionStatusOptions}
              {...inspectionForm.getInputProps("inspector_status")}
              error={inspectionForm.errors.inspector_status}
              required
              style={{ marginBottom: 8 }}
            />
          </Stack>
          <Group mt="md" justify="flex-end">
            <Button variant="default" onClick={() => setAddModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit">Thêm</Button>
          </Group>
        </form>
      </Modal>
      <Modal
        opened={addReportModalOpen}
        onClose={() => setAddReportModalOpen(false)}
        title="Thêm kết quả kiểm tra mới"
        centered
      >
        <form
          onSubmit={reportForm.onSubmit((values) => {
            if (!businessId || !currentInspectionId) return;
            const reportData = {
              report_id: uuidv4(),
              inspection_id: currentInspectionId,
              report_description: values.report_description,
              report_status: values.report_status,
            };
            addReportMutation.mutate(reportData, {
              onSuccess: () => {
                setAddReportModalOpen(false);
                reportForm.reset();
              },
            });
          })}
        >
          <Stack>
            <TextInput
              label="Mô tả báo cáo"
              placeholder="Nhập mô tả"
              {...reportForm.getInputProps("report_description")}
              error={reportForm.errors.report_description}
              required
              style={{ marginBottom: 8 }}
            />
            <Select
              label="Trạng thái"
              data={reportStatusOptions}
              {...reportForm.getInputProps("report_status")}
              error={reportForm.errors.report_status}
              required
              style={{ marginBottom: 8 }}
            />
          </Stack>
          <Group mt="md" justify="flex-end">
            <Button
              variant="default"
              onClick={() => setAddReportModalOpen(false)}
            >
              Hủy
            </Button>
            <Button type="submit" loading={addReportMutation.isPending}>
              Thêm
            </Button>
          </Group>
        </form>
      </Modal>
      <Modal
        opened={addViolationModalOpen}
        onClose={() => setAddViolationModalOpen(false)}
        title="Thêm quyết định xử phạt mới"
        centered
      >
        <form
          onSubmit={violationForm.onSubmit((values) => {
            if (!businessId || !currentReportId) return;
            const violationData = {
              violation_id: uuidv4(),
              report_id: currentReportId,
              violation_number: values.violation_number,
              issue_date: values.issue_date,
              violation_status: values.violation_status,
              fix_status: values.fix_status,
              officer_signed: values.officer_signed,
            };
            addViolationMutation.mutate(violationData, {
              onSuccess: () => {
                setAddViolationModalOpen(false);
                violationForm.reset();
              },
            });
          })}
        >
          <Stack>
            <TextInput
              label="Số quyết định"
              placeholder="Nhập số quyết định"
              {...violationForm.getInputProps("violation_number")}
              error={violationForm.errors.violation_number}
              required
              style={{ marginBottom: 8 }}
            />
            <DateInput
              label="Ngày ban hành"
              value={violationForm.values.issue_date}
              onChange={(date) =>
                violationForm.setFieldValue("issue_date", date ?? new Date())
              }
              error={violationForm.errors.issue_date}
              required
              style={{ marginBottom: 8 }}
            />
            <Select
              label="Trạng thái"
              data={violationStatusOptions}
              {...violationForm.getInputProps("violation_status")}
              error={violationForm.errors.violation_status}
              required
              style={{ marginBottom: 8 }}
            />
            <Select
              label="Trạng thái khắc phục"
              data={fixStatusOptions}
              {...violationForm.getInputProps("fix_status")}
              error={violationForm.errors.fix_status}
              required
              style={{ marginBottom: 8 }}
            />
            <TextInput
              label="Cán bộ ký"
              placeholder="Nhập tên cán bộ ký"
              {...violationForm.getInputProps("officer_signed")}
              error={violationForm.errors.officer_signed}
              required
              style={{ marginBottom: 8 }}
            />
          </Stack>
          <Group mt="md" justify="flex-end">
            <Button
              variant="default"
              onClick={() => setAddViolationModalOpen(false)}
            >
              Hủy
            </Button>
            <Button type="submit" loading={addViolationMutation.isPending}>
              Thêm
            </Button>
          </Group>
        </form>
      </Modal>
    </Box>
  );
}

export default InspectionSchedulePage;
