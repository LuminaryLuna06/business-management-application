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
  ActionIcon,
  Tooltip,
  Flex,
  Alert,
  Center,
  Loader,
  FileInput,
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
  useUpdateInspectionMutation,
  useDeleteInspectionMutation,
  useUpdateReportMutation,
  useDeleteReportMutation,
  useUpdateViolationMutation,
  useDeleteViolationMutation,
} from "../../../../tanstack/useInspectionQueries";
import { MantineReactTable, type MRT_ColumnDef } from "mantine-react-table";
import { DateInput } from "@mantine/dates";
import { v4 as uuidv4 } from "uuid";
import { MRT_Localization_VI } from "mantine-react-table/locales/vi/index.cjs";
import {
  IconDownload,
  IconEdit,
  IconTrash,
  IconEye,
  IconPlus,
  IconAlertCircle,
  IconExternalLink,
} from "@tabler/icons-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";
import type {
  InspectionSchedule,
  InspectionReport,
  ViolationResult,
} from "../../../../types/schedule";
import { ViolationTypeEnum } from "../../../../types/schedule";
import { uploadFileToDrive } from "../../../../googledrive/GoogleDriveUploader";
import { violationTypeLabels } from "../../../../types/violationTypeLabels";

const inspectionSchema = Yup.object().shape({
  inspection_date: Yup.date().required("Ngày kiểm tra là bắt buộc"),
  inspector_description: Yup.string().required("Mô tả kiểm tra là bắt buộc"),
  inspector_status: Yup.string().required("Trạng thái kiểm tra là bắt buộc"),
});

const inspectionStatusOptions = [
  { value: "pending", label: "Chờ kiểm tra" },
  { value: "completed", label: "Đã hoàn thành" },
  { value: "cancelled", label: "Đã hủy" },
];

const reportSchema = Yup.object().shape({
  report_description: Yup.string().required("Mô tả báo cáo là bắt buộc"),
  report_status: Yup.string().required("Trạng thái báo cáo là bắt buộc"),
});

const reportStatusOptions = [
  { value: "draft", label: "Bản nháp" },
  { value: "finalized", label: "Đã xác nhận" },
];

const violationSchema = Yup.object().shape({
  violation_number: Yup.string().required("Số quyết định là bắt buộc"),
  issue_date: Yup.date().required("Ngày ban hành là bắt buộc"),
  violation_status: Yup.string().required("Trạng thái là bắt buộc"),
  fix_status: Yup.string().required("Trạng thái khắc phục là bắt buộc"),
  officer_signed: Yup.string().required("Cán bộ ký là bắt buộc"),
});

const violationStatusOptions = [
  { value: "pending", label: "Chờ xử lý" },
  { value: "paid", label: "Đã nộp phạt" },
  { value: "dismissed", label: "Đã miễn" },
];

const fixStatusOptions = [
  { value: "not_fixed", label: "Chưa khắc phục" },
  { value: "in_progress", label: "Đang xử lý" },
  { value: "fixed", label: "Đã khắc phục" },
];

const violationTypeOptions = Object.entries(violationTypeLabels).map(
  ([value, label]) => ({ value, label })
);

function InspectionSchedulePage() {
  const { businessId } = useParams();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingInspection, setEditingInspection] = useState<
    (InspectionSchedule & { id: string }) | null
  >(null);
  const [addReportModalOpen, setAddReportModalOpen] = useState(false);
  const [addViolationModalOpen, setAddViolationModalOpen] = useState(false);
  const [editReportModalOpen, setEditReportModalOpen] = useState(false);
  const [editViolationModalOpen, setEditViolationModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<
    (InspectionReport & { id: string }) | null
  >(null);
  const [editingViolation, setEditingViolation] = useState<
    (ViolationResult & { id: string }) | null
  >(null);
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
  const { data: violations, isLoading: loadingViolations } =
    useViolationDecisions(businessId || "");
  const addInspectionMutation = useAddInspectionMutation(businessId || "");
  const updateInspectionMutation = useUpdateInspectionMutation(
    businessId || ""
  );
  const deleteInspectionMutation = useDeleteInspectionMutation(
    businessId || ""
  );
  const addReportMutation = useAddReportMutation(businessId || "");
  const updateReportMutation = useUpdateReportMutation(businessId || "");
  const deleteReportMutation = useDeleteReportMutation(businessId || "");
  const addViolationMutation = useAddViolationMutation(businessId || "");
  const updateViolationMutation = useUpdateViolationMutation(businessId || "");
  const deleteViolationMutation = useDeleteViolationMutation(businessId || "");
  // useForm cho inspection
  const inspectionForm = useForm({
    initialValues: {
      business_id: businessId || "",
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
      report_status: "draft" as const,
    },
    validate: yupResolver(reportSchema),
  });

  const [violationUploading, setViolationUploading] = useState(false);

  const violationForm = useForm({
    initialValues: {
      violation_number: "",
      issue_date: new Date(),
      violation_status: "pending",
      fix_status: "not_fixed",
      officer_signed: "",
      file_link: "",
      violation_type: ViolationTypeEnum.FalseTaxDeclaration,
    },
    validate: yupResolver(violationSchema),
  });

  // Form cho edit inspection
  const editInspectionForm = useForm({
    initialValues: {
      inspection_date: new Date(),
      inspector_description: "",
      inspector_status: "pending" as "pending" | "completed" | "cancelled",
    },
    validate: yupResolver(inspectionSchema),
  });

  // Form cho edit report
  const editReportForm = useForm({
    initialValues: {
      report_description: "",
      report_status: undefined as "draft" | "finalized" | undefined,
    },
    validate: yupResolver(reportSchema),
  });

  // Form cho edit violation
  const editViolationForm = useForm({
    initialValues: {
      violation_number: "",
      issue_date: new Date(),
      violation_status: "pending",
      fix_status: "not_fixed",
      officer_signed: "",
      file_link: "",
      violation_type: ViolationTypeEnum.FalseTaxDeclaration,
    },
    validate: yupResolver(violationSchema),
  });

  const columns: MRT_ColumnDef<any>[] = [
    {
      accessorKey: "inspection_date",
      header: "Ngày kiểm tra",
      filterVariant: "date-range",
      sortingFn: "datetime",
      Cell: ({ cell }) => cell.getValue<Date>()?.toLocaleDateString(),
    },
    {
      accessorKey: "inspector_description",
      header: "Mô tả kiểm tra",
    },
    {
      accessorKey: "inspector_status",
      header: "Trạng thái",
      filterVariant: "multi-select",
      mantineFilterMultiSelectProps: {
        data: [
          { value: "pending", label: "Chờ kiểm tra" },
          { value: "completed", label: "Đã hoàn thành" },
          { value: "cancelled", label: "Đã hủy" },
        ],
      },
      Cell: ({ cell }) => {
        const status = cell.getValue<string>();
        if (status === "pending") return "Chờ kiểm tra";
        if (status === "completed") return "Đã hoàn thành";
        if (status === "cancelled") return "Đã hủy";
        return status;
      },
    },
  ];

  // Action handlers
  const handleViewInspection = (
    inspection: InspectionSchedule & { id: string }
  ) => {
    notifications.show({
      title: "Thông tin lịch kiểm tra",
      message: `${
        inspection.inspector_description
      } - ${inspection.inspection_date.toLocaleDateString()}`,
      color: "blue",
    });
  };

  const handleEditInspection = (
    inspection: InspectionSchedule & { id: string }
  ) => {
    setEditingInspection(inspection);
    editInspectionForm.setValues({
      inspection_date: inspection.inspection_date,
      inspector_description: inspection.inspector_description,
      inspector_status: inspection.inspector_status,
    });
    setEditModalOpen(true);
  };

  const handleDeleteInspection = (
    inspection: InspectionSchedule & { id: string }
  ) => {
    modals.openConfirmModal({
      title: "Xác nhận xóa lịch kiểm tra",
      children: (
        <Text>
          Bạn có chắc chắn muốn xóa lịch kiểm tra{" "}
          <strong>"{inspection.inspector_description}"</strong>?
        </Text>
      ),
      labels: { confirm: "Xóa", cancel: "Hủy" },
      confirmProps: { color: "red" },
      onConfirm: () => {
        deleteInspectionMutation.mutate({
          inspectionId: inspection.inspection_id,
          inspectionDocId: inspection.id,
        });
        notifications.show({
          title: "Thành công",
          message: "Đã xóa lịch kiểm tra thành công!",
          color: "green",
        });
      },
    });
  };

  const handleUpdateInspection = (values: typeof editInspectionForm.values) => {
    if (!editingInspection) return;
    updateInspectionMutation.mutate({
      inspectionId: editingInspection.id,
      inspectionData: {
        inspection_date: values.inspection_date,
        inspector_description: values.inspector_description,
        inspector_status: values.inspector_status,
      },
    });
    setEditModalOpen(false);
    editInspectionForm.reset();
    setEditingInspection(null);
    notifications.show({
      title: "Thành công",
      message: "Đã cập nhật lịch kiểm tra thành công!",
      color: "green",
    });
  };

  // Export Excel helpers
  const exportRowsToExcel = (rows: any[], filename = "lich-kiem-tra") => {
    if (!rows || rows.length === 0) return;
    const data = rows.map((row) => row.original || row);
    const mapped = data.map((row) => ({
      "Ngày kiểm tra":
        row.inspection_date instanceof Date
          ? row.inspection_date.toLocaleDateString("vi-VN")
          : row.inspection_date,
      "Mô tả kiểm tra": row.inspector_description,
      "Trạng thái":
        row.inspector_status === "pending"
          ? "Chờ kiểm tra"
          : row.inspector_status === "completed"
          ? "Đã hoàn thành"
          : row.inspector_status === "cancelled"
          ? "Đã hủy"
          : row.inspector_status,
    }));
    const worksheet = XLSX.utils.json_to_sheet(mapped);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `${filename}.xlsx`);
  };

  const exportAllToExcel = (data: any[]) => {
    if (!data || data.length === 0) return;
    const mapped = data.map((row) => ({
      "Ngày kiểm tra":
        row.inspection_date instanceof Date
          ? row.inspection_date.toLocaleDateString("vi-VN")
          : row.inspection_date,
      "Mô tả kiểm tra": row.inspector_description,
      "Trạng thái":
        row.inspector_status === "pending"
          ? "Chờ kiểm tra"
          : row.inspector_status === "completed"
          ? "Đã hoàn thành"
          : row.inspector_status === "cancelled"
          ? "Đã hủy"
          : row.inspector_status,
    }));
    const worksheet = XLSX.utils.json_to_sheet(mapped);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `lich-kiem-tra.xlsx`);
  };

  if (isLoading) {
    return (
      <Center style={{ height: "50vh" }}>
        <Loader size="lg" />
        <Text ml="md">Đang tải dữ liệu lịch kiểm tra...</Text>
      </Center>
    );
  }

  if (error) {
    return (
      <Alert
        icon={<IconAlertCircle size={16} />}
        title="Lỗi tải dữ liệu"
        color="red"
      >
        <Text>Không thể tải dữ liệu lịch kiểm tra từ Firestore.</Text>
        <Text size="sm" mt="xs">
          Lỗi: {error?.message || "Unknown error"}
        </Text>
      </Alert>
    );
  }

  return (
    <Box p="md">
      <Text size="xl" fw={700} mb="xs">
        Quản lý lịch kiểm tra & vi phạm
      </Text>
      <Text size="sm" color="dimmed" mb="md">
        Quản lý lịch kiểm tra định kỳ, ghi nhận kết quả kiểm tra, lỗi vi phạm,
        quyết định xử phạt và cán bộ thực hiện.
      </Text>
      <MantineReactTable
        columns={columns}
        data={inspections || []}
        enablePagination
        enableSorting
        enableDensityToggle={false}
        enableTopToolbar
        columnFilterDisplayMode={"popover"}
        enableColumnFilters
        enableGlobalFilter
        enableStickyHeader
        enableRowSelection
        enableSelectAll
        enableColumnPinning
        enableRowActions
        positionActionsColumn="last"
        localization={MRT_Localization_VI}
        initialState={{
          pagination: { pageSize: 10, pageIndex: 0 },
          density: "xs",
          columnPinning: { right: ["mrt-row-actions"] },
        }}
        mantineTableProps={{
          striped: true,
          withTableBorder: true,
          highlightOnHover: true,
          withColumnBorders: true,
        }}
        mantineTableContainerProps={{
          style: { maxHeight: "70vh" },
        }}
        mantineTableBodyCellProps={({ column }) =>
          column.id === "mrt-row-actions"
            ? {
                style: { minWidth: 80, textAlign: "center" },
              }
            : {}
        }
        mantineTableHeadCellProps={({ column }) =>
          column.id === "mrt-row-actions"
            ? { style: { minWidth: 80, textAlign: "center" } }
            : {}
        }
        renderDetailPanel={({ row }) => {
          const inspectionId = row.original.inspection_id;
          if (loadingReports) return <Text>Đang tải kết quả kiểm tra...</Text>;
          if (errorReports)
            return <Text color="red">Lỗi tải kết quả kiểm tra</Text>;
          const filteredReports = (reports || []).filter(
            (r) => r.inspection_id === inspectionId
          );
          if (!filteredReports.length)
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
                <Text>Chưa có kết quả kiểm tra</Text>
              </Box>
            );
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
                      <Group justify="space-between" mb={8}>
                        <Text fw={500}>Báo cáo #{idx + 1}</Text>
                        <Group gap={4}>
                          <Tooltip label="Sửa báo cáo">
                            <ActionIcon
                              size="sm"
                              color="blue"
                              variant="light"
                              onClick={() => {
                                setEditingReport(report);
                                editReportForm.setValues({
                                  report_description: report.report_description,
                                  report_status: report.report_status as
                                    | "draft"
                                    | "finalized",
                                });
                                setEditReportModalOpen(true);
                              }}
                            >
                              <IconEdit size={14} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Xóa báo cáo">
                            <ActionIcon
                              size="sm"
                              color="red"
                              variant="light"
                              onClick={() => {
                                modals.openConfirmModal({
                                  title: "Xác nhận xóa báo cáo",
                                  children: (
                                    <Text>
                                      Bạn có chắc chắn muốn xóa báo cáo này?
                                    </Text>
                                  ),
                                  labels: { confirm: "Xóa", cancel: "Hủy" },
                                  confirmProps: { color: "red" },
                                  onConfirm: () => {
                                    deleteReportMutation.mutate({
                                      reportId: report.report_id,
                                      reportDocId: report.id,
                                    });
                                    notifications.show({
                                      title: "Thành công",
                                      message: "Đã xóa báo cáo thành công!",
                                      color: "green",
                                    });
                                  },
                                });
                              }}
                            >
                              <IconTrash size={14} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Group>
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
                        <Box>
                          <Text size="sm" fw={500} mb={4}>
                            Quyết định xử phạt:
                          </Text>
                          {filteredViolations.map((violation, vIdx) => (
                            <Box
                              key={vIdx}
                              p={8}
                              mb={4}
                              style={{
                                border: "1px solid #228be6",
                                borderRadius: 4,
                              }}
                            >
                              <Group justify="space-between" mb={4}>
                                <Text size="sm" fw={500}>
                                  {violation.violation_number}
                                </Text>
                                <Group gap={4}>
                                  <Tooltip label="Sửa quyết định">
                                    <ActionIcon
                                      size="xs"
                                      color="blue"
                                      variant="light"
                                      onClick={() => {
                                        setEditingViolation(violation);
                                        editViolationForm.setValues({
                                          violation_number:
                                            violation.violation_number,
                                          issue_date: violation.issue_date,
                                          violation_status:
                                            violation.violation_status as
                                              | "pending"
                                              | "paid"
                                              | "dismissed",
                                          fix_status: violation.fix_status as
                                            | "not_fixed"
                                            | "fixed"
                                            | "in_progress",
                                          officer_signed:
                                            violation.officer_signed,
                                          file_link: violation.file_link,
                                          violation_type:
                                            violation.violation_type as
                                              | ViolationTypeEnum.FalseTaxDeclaration
                                              | ViolationTypeEnum.Other,
                                        });
                                        setEditViolationModalOpen(true);
                                      }}
                                    >
                                      <IconEdit size={12} />
                                    </ActionIcon>
                                  </Tooltip>
                                  <Tooltip label="Xóa quyết định">
                                    <ActionIcon
                                      size="xs"
                                      color="red"
                                      variant="light"
                                      onClick={() => {
                                        modals.openConfirmModal({
                                          title: "Xác nhận xóa quyết định",
                                          children: (
                                            <Text>
                                              Bạn có chắc chắn muốn xóa quyết
                                              định này?
                                            </Text>
                                          ),
                                          labels: {
                                            confirm: "Xóa",
                                            cancel: "Hủy",
                                          },
                                          confirmProps: { color: "red" },
                                          onConfirm: () => {
                                            deleteViolationMutation.mutate(
                                              violation.id
                                            );
                                            notifications.show({
                                              title: "Thành công",
                                              message:
                                                "Đã xóa quyết định thành công!",
                                              color: "green",
                                            });
                                          },
                                        });
                                      }}
                                    >
                                      <IconTrash size={12} />
                                    </ActionIcon>
                                  </Tooltip>
                                </Group>
                              </Group>
                              <Text size="xs">
                                Loại vi phạm:{" "}
                                {violationTypeLabels[violation.violation_type]}
                              </Text>
                              <Text size="xs">
                                Ngày ban hành:{" "}
                                {violation.issue_date instanceof Date
                                  ? violation.issue_date.toLocaleDateString()
                                  : violation.issue_date}
                              </Text>
                              <Text size="xs">
                                Trạng thái:{" "}
                                {violation.violation_status === "pending"
                                  ? "Chờ xử lý"
                                  : violation.violation_status === "paid"
                                  ? "Đã nộp phạt"
                                  : violation.violation_status === "dismissed"
                                  ? "Đã miễn"
                                  : violation.violation_status}
                              </Text>
                              <Text size="xs">
                                Trạng thái khắc phục:{" "}
                                {violation.fix_status === "not_fixed"
                                  ? "Chưa khắc phục"
                                  : violation.fix_status === "in_progress"
                                  ? "Đang xử lý"
                                  : violation.fix_status === "fixed"
                                  ? "Đã khắc phục"
                                  : violation.fix_status}
                              </Text>
                              <Text size="xs">
                                Cán bộ ký: {violation.officer_signed}
                              </Text>
                              {violation.file_link && (
                                <ActionIcon
                                  component="a"
                                  href={violation.file_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  color="blue"
                                  variant="subtle"
                                  title="Mở file trong tab mới"
                                >
                                  <IconExternalLink size={18} />
                                </ActionIcon>
                              )}
                            </Box>
                          ))}
                        </Box>
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
        renderRowActions={({ row }) => (
          <Flex gap="md" justify="center">
            <Tooltip label="Xem thông tin">
              <ActionIcon
                color="green"
                variant="light"
                radius="md"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewInspection(row.original);
                }}
              >
                <IconEye size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Sửa thông tin">
              <ActionIcon
                color="blue"
                variant="light"
                radius="md"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditInspection(row.original);
                }}
              >
                <IconEdit size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Xóa lịch kiểm tra">
              <ActionIcon
                color="red"
                variant="light"
                radius="md"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteInspection(row.original);
                }}
              >
                <IconTrash size={18} />
              </ActionIcon>
            </Tooltip>
          </Flex>
        )}
        renderTopToolbarCustomActions={({ table }) => {
          const hasSelected = table.getSelectedRowModel().rows.length > 0;
          return (
            <Box
              style={{
                display: "flex",
                justifyContent: "flex-start",
                gap: 8,
                padding: 8,
                flexWrap: "wrap",
              }}
            >
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={() => setAddModalOpen(true)}
              >
                Thêm lịch kiểm tra
              </Button>
              <Button
                leftSection={<IconDownload size={16} />}
                variant="light"
                onClick={() => exportAllToExcel(inspections || [])}
              >
                Xuất tất cả dữ liệu (Excel)
              </Button>
              <Button
                leftSection={<IconDownload size={16} />}
                variant="light"
                onClick={() =>
                  exportRowsToExcel(
                    table.getPrePaginationRowModel().rows,
                    "lich-kiem-tra-filter"
                  )
                }
                disabled={table.getPrePaginationRowModel().rows.length === 0}
              >
                Xuất tất cả hàng (theo filter, Excel)
              </Button>
              <Button
                leftSection={<IconDownload size={16} />}
                variant="light"
                onClick={() =>
                  exportRowsToExcel(
                    table.getRowModel().rows,
                    "lich-kiem-tra-trang-hien-tai"
                  )
                }
                disabled={table.getRowModel().rows.length === 0}
              >
                Xuất các hàng trong trang (Excel)
              </Button>
              <Button
                leftSection={<IconDownload size={16} />}
                variant="light"
                color="teal"
                onClick={() =>
                  exportRowsToExcel(
                    table.getSelectedRowModel().rows,
                    "lich-kiem-tra-da-chon"
                  )
                }
                disabled={!hasSelected}
              >
                Xuất hàng được chọn (Excel)
              </Button>
              <Button
                leftSection={<IconTrash size={16} />}
                variant="light"
                color="red"
                onClick={() => {
                  const selected = table.getSelectedRowModel().rows;
                  if (!selected.length) return;
                  modals.openConfirmModal({
                    title: "Xác nhận xóa lịch kiểm tra",
                    children: (
                      <Text>
                        Bạn có chắc chắn muốn xóa {selected.length} lịch kiểm
                        tra đã chọn?
                      </Text>
                    ),
                    labels: { confirm: "Xóa tất cả", cancel: "Hủy" },
                    confirmProps: { color: "red" },
                    onConfirm: async () => {
                      for (const row of selected) {
                        await deleteInspectionMutation.mutateAsync(
                          row.original.id
                        );
                      }
                      // Clear table selection after bulk delete
                      table.setRowSelection({});
                      notifications.show({
                        title: "Thành công",
                        message: `Đã xóa ${selected.length} lịch kiểm tra thành công!`,
                        color: "green",
                      });
                    },
                  });
                }}
                disabled={!hasSelected}
              >
                Xóa các hàng đã chọn ({table.getSelectedRowModel().rows.length})
              </Button>
            </Box>
          );
        }}
      />
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
              business_id: businessId,
              inspection_date: values.inspection_date,
              inspector_description: values.inspector_description,
              inspector_status: values.inspector_status,
            };
            addInspectionMutation.mutate(inspectionData, {
              onSuccess: () => {
                setAddModalOpen(false);
                inspectionForm.reset();
                notifications.show({
                  title: "Thành công",
                  message: "Đã thêm lịch kiểm tra thành công!",
                  color: "green",
                });
              },
              onError: () => {
                notifications.show({
                  title: "Lỗi",
                  message: "Không thể thêm lịch kiểm tra. Vui lòng thử lại.",
                  color: "red",
                });
              },
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
        opened={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingInspection(null);
          editInspectionForm.reset();
        }}
        title="Sửa lịch kiểm tra"
        centered
      >
        <form onSubmit={editInspectionForm.onSubmit(handleUpdateInspection)}>
          <Stack>
            <DateInput
              label="Ngày kiểm tra"
              value={editInspectionForm.values.inspection_date}
              onChange={(date) =>
                editInspectionForm.setFieldValue(
                  "inspection_date",
                  date ?? new Date()
                )
              }
              error={editInspectionForm.errors.inspection_date}
              required
              style={{ marginBottom: 8 }}
            />
            <TextInput
              label="Mô tả kiểm tra"
              placeholder="Nhập mô tả"
              {...editInspectionForm.getInputProps("inspector_description")}
              error={editInspectionForm.errors.inspector_description}
              required
              style={{ marginBottom: 8 }}
            />
            <Select
              label="Trạng thái"
              data={inspectionStatusOptions}
              {...editInspectionForm.getInputProps("inspector_status")}
              error={editInspectionForm.errors.inspector_status}
              required
              style={{ marginBottom: 8 }}
            />
          </Stack>
          <Group mt="md" justify="flex-end">
            <Button
              variant="default"
              onClick={() => {
                setEditModalOpen(false);
                setEditingInspection(null);
                editInspectionForm.reset();
              }}
            >
              Hủy
            </Button>
            <Button type="submit" loading={updateInspectionMutation.isPending}>
              Cập nhật
            </Button>
          </Group>
        </form>
      </Modal>

      {/* Modal thêm báo cáo */}
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
              report_status: values.report_status as "draft" | "finalized",
            };
            addReportMutation.mutate(reportData, {
              onSuccess: () => {
                setAddReportModalOpen(false);
                reportForm.reset();
                notifications.show({
                  title: "Thành công",
                  message: "Đã thêm báo cáo thành công!",
                  color: "green",
                });
              },
              onError: () => {
                notifications.show({
                  title: "Lỗi",
                  message: "Không thể thêm báo cáo. Vui lòng thử lại.",
                  color: "red",
                });
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

      {/* Modal sửa báo cáo */}
      <Modal
        opened={editReportModalOpen}
        onClose={() => {
          setEditReportModalOpen(false);
          setEditingReport(null);
          editReportForm.reset();
        }}
        title="Sửa báo cáo"
        centered
      >
        <form
          onSubmit={editReportForm.onSubmit((values) => {
            if (!editingReport) return;
            updateReportMutation.mutate({
              reportId: editingReport.id,
              reportData: {
                report_description: values.report_description,
                report_status: values.report_status as "draft" | "finalized",
              },
            });
            setEditReportModalOpen(false);
            editReportForm.reset();
            setEditingReport(null);
            notifications.show({
              title: "Thành công",
              message: "Đã cập nhật báo cáo thành công!",
              color: "green",
            });
          })}
        >
          <Stack>
            <TextInput
              label="Mô tả báo cáo"
              placeholder="Nhập mô tả"
              {...editReportForm.getInputProps("report_description")}
              error={editReportForm.errors.report_description}
              required
              style={{ marginBottom: 8 }}
            />
            <Select
              label="Trạng thái"
              data={reportStatusOptions}
              {...editReportForm.getInputProps("report_status")}
              error={editReportForm.errors.report_status}
              required
              style={{ marginBottom: 8 }}
            />
          </Stack>
          <Group mt="md" justify="flex-end">
            <Button
              variant="default"
              onClick={() => {
                setEditReportModalOpen(false);
                setEditingReport(null);
                editReportForm.reset();
              }}
            >
              Hủy
            </Button>
            <Button type="submit" loading={updateReportMutation.isPending}>
              Cập nhật
            </Button>
          </Group>
        </form>
      </Modal>

      {/* Modal thêm quyết định xử phạt */}
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
              violation_status: values.violation_status as
                | "pending"
                | "paid"
                | "dismissed",
              fix_status: values.fix_status as
                | "not_fixed"
                | "fixed"
                | "in_progress",
              officer_signed: values.officer_signed,
              file_link: values.file_link,
              violation_type: values.violation_type as
                | ViolationTypeEnum.FalseTaxDeclaration
                | ViolationTypeEnum.Other,
            };
            addViolationMutation.mutate(violationData, {
              onSuccess: () => {
                setAddViolationModalOpen(false);
                violationForm.reset();
                notifications.show({
                  title: "Thành công",
                  message: "Đã thêm quyết định xử phạt thành công!",
                  color: "green",
                });
              },
              onError: () => {
                notifications.show({
                  title: "Lỗi",
                  message:
                    "Không thể thêm quyết định xử phạt. Vui lòng thử lại.",
                  color: "red",
                });
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
            <Select
              label="Loại vi phạm"
              data={violationTypeOptions}
              {...violationForm.getInputProps("violation_type")}
              error={violationForm.errors.violation_type}
              required
              style={{ marginBottom: 8 }}
            />
            <FileInput
              label="Tệp quyết định (ảnh hoặc PDF)"
              accept="image/*,application/pdf"
              onChange={async (file) => {
                if (!file) return;
                setViolationUploading(true);
                try {
                  const folderId = localStorage.getItem("gdrive_folder_id");
                  if (!folderId) {
                    notifications.show({
                      title: "Lỗi",
                      message:
                        "Chưa có folder Google Drive. Vui lòng nhập folder ID!",
                      color: "red",
                    });
                    setViolationUploading(false);
                    return;
                  }
                  const link = await uploadFileToDrive({ file, folderId });
                  violationForm.setFieldValue("file_link", link);
                  notifications.show({
                    title: "Upload thành công",
                    message: "Đã upload file lên Google Drive!",
                    color: "green",
                  });
                } catch (err) {
                  notifications.show({
                    title: "Lỗi upload file",
                    message: String(err),
                    color: "red",
                  });
                  violationForm.setFieldValue("file_link", "");
                } finally {
                  setViolationUploading(false);
                }
              }}
              mb="sm"
              disabled={violationUploading}
            />
            {violationUploading && (
              <Text size="sm" color="blue">
                Đang upload file...
              </Text>
            )}
            {violationForm.values.file_link && (
              <Text size="sm" color="teal" style={{ wordBreak: "break-all" }}>
                Đã upload:{" "}
                <a
                  href={violationForm.values.file_link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {violationForm.values.file_link}
                </a>
              </Text>
            )}
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

      {/* Modal sửa quyết định xử phạt */}
      <Modal
        opened={editViolationModalOpen}
        onClose={() => {
          setEditViolationModalOpen(false);
          setEditingViolation(null);
          editViolationForm.reset();
        }}
        title="Sửa quyết định xử phạt"
        centered
      >
        <form
          onSubmit={editViolationForm.onSubmit((values) => {
            if (!editingViolation) return;
            updateViolationMutation.mutate({
              violationId: editingViolation.id,
              violationData: {
                violation_number: values.violation_number,
                issue_date: values.issue_date,
                violation_status: values.violation_status as
                  | "pending"
                  | "paid"
                  | "dismissed",
                fix_status: values.fix_status as
                  | "not_fixed"
                  | "fixed"
                  | "in_progress",
                officer_signed: values.officer_signed,
                file_link: values.file_link,
                violation_type: values.violation_type as
                  | ViolationTypeEnum.FalseTaxDeclaration
                  | ViolationTypeEnum.Other,
              },
            });
            setEditViolationModalOpen(false);
            editViolationForm.reset();
            setEditingViolation(null);
            notifications.show({
              title: "Thành công",
              message: "Đã cập nhật quyết định xử phạt thành công!",
              color: "green",
            });
          })}
        >
          <Stack>
            <TextInput
              label="Số quyết định"
              placeholder="Nhập số quyết định"
              {...editViolationForm.getInputProps("violation_number")}
              error={editViolationForm.errors.violation_number}
              required
              style={{ marginBottom: 8 }}
            />
            <DateInput
              label="Ngày ban hành"
              value={editViolationForm.values.issue_date}
              onChange={(date) =>
                editViolationForm.setFieldValue(
                  "issue_date",
                  date ?? new Date()
                )
              }
              error={editViolationForm.errors.issue_date}
              required
              style={{ marginBottom: 8 }}
            />
            <Select
              label="Trạng thái"
              data={violationStatusOptions}
              {...editViolationForm.getInputProps("violation_status")}
              error={editViolationForm.errors.violation_status}
              required
              style={{ marginBottom: 8 }}
            />
            <Select
              label="Trạng thái khắc phục"
              data={fixStatusOptions}
              {...editViolationForm.getInputProps("fix_status")}
              error={editViolationForm.errors.fix_status}
              required
              style={{ marginBottom: 8 }}
            />
            <TextInput
              label="Cán bộ ký"
              placeholder="Nhập tên cán bộ ký"
              {...editViolationForm.getInputProps("officer_signed")}
              error={editViolationForm.errors.officer_signed}
              required
              style={{ marginBottom: 8 }}
            />
            <Select
              label="Loại vi phạm"
              data={violationTypeOptions}
              {...editViolationForm.getInputProps("violation_type")}
              error={editViolationForm.errors.violation_type}
              required
              style={{ marginBottom: 8 }}
            />
            <FileInput
              label="Tệp quyết định (ảnh hoặc PDF)"
              accept="image/*,application/pdf"
              onChange={async (file) => {
                if (!file) return;
                setViolationUploading(true);
                try {
                  const folderId = localStorage.getItem("gdrive_folder_id");
                  if (!folderId) {
                    notifications.show({
                      title: "Lỗi",
                      message:
                        "Chưa có folder Google Drive. Vui lòng nhập folder ID!",
                      color: "red",
                    });
                    setViolationUploading(false);
                    return;
                  }
                  const link = await uploadFileToDrive({ file, folderId });
                  editViolationForm.setFieldValue("file_link", link);
                  notifications.show({
                    title: "Upload thành công",
                    message: "Đã upload file lên Google Drive!",
                    color: "green",
                  });
                } catch (err) {
                  notifications.show({
                    title: "Lỗi upload file",
                    message: String(err),
                    color: "red",
                  });
                  editViolationForm.setFieldValue("file_link", "");
                } finally {
                  setViolationUploading(false);
                }
              }}
              mb="sm"
              disabled={violationUploading}
            />
            {violationUploading && (
              <Text size="sm" color="blue">
                Đang upload file...
              </Text>
            )}
            {editViolationForm.values.file_link && (
              <Text size="sm" color="teal" style={{ wordBreak: "break-all" }}>
                Đã upload:{" "}
                <a
                  href={editViolationForm.values.file_link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {editViolationForm.values.file_link}
                </a>
              </Text>
            )}
          </Stack>
          <Group mt="md" justify="flex-end">
            <Button
              variant="default"
              onClick={() => {
                setEditViolationModalOpen(false);
                setEditingViolation(null);
                editViolationForm.reset();
              }}
            >
              Hủy
            </Button>
            <Button type="submit" loading={updateViolationMutation.isPending}>
              Cập nhật
            </Button>
          </Group>
        </form>
      </Modal>
    </Box>
  );
}

export default InspectionSchedulePage;
