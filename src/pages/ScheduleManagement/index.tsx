import { useState, useEffect } from "react";
import {
  Card,
  Select,
  Group,
  Title,
  Text,
  Box,
  SimpleGrid,
  Stack,
  Badge,
  Button,
  Modal,
  TextInput,
  MultiSelect,
  Textarea,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import {
  IconReportAnalytics,
  IconUsers,
  IconChecklist,
  IconAlertTriangle,
  IconCheck,
  IconCalendarPlus,
} from "@tabler/icons-react";
import { MantineReactTable } from "mantine-react-table";
import { MRT_Localization_VI } from "mantine-react-table/locales/vi/index.cjs";
import tree from "../../data/tree.json";
import { BusinessType } from "../../types/business";
import { useGetAllBusinesses } from "../../tanstack/useBusinessQueries";
import { useForm, yupResolver } from "@mantine/form";
import * as Yup from "yup";
import { notifications } from "@mantine/notifications";
import {
  useCreateInspectionBatchAndSchedulesMutation,
  useInspectionStatsByBatchId,
  useAllSchedulesQuery,
  useViolationStatsByBatchId,
  useDeleteInspectionBatchAndAllLinkedDataMutation,
  useUpdateInspectionBatchAndSchedulesMutation,
} from "../../tanstack/useInspectionQueries";

const businessTypeOptions = [
  { value: BusinessType.Individual.toString(), label: "Hộ kinh doanh" },
  { value: BusinessType.LLC.toString(), label: "Công ty TNHH" },
  { value: BusinessType.JSC.toString(), label: "Công ty Cổ phần" },
];

// Lấy danh sách phường/xã của Hà Nội
const hanoi = Array.isArray(tree)
  ? tree.find((t: any) => t.name === "Hà Nội")
  : null;
const hanoiWards =
  hanoi && Array.isArray(hanoi.wards)
    ? hanoi.wards.map((w: any) => ({ value: w.name, label: w.name }))
    : [];

const provinces = [{ value: "Hà Nội", label: "Hà Nội" }];
const wards = hanoiWards;

const statusOptions = [
  { value: "scheduled", label: "Đã lên lịch" },
  { value: "ongoing", label: "Đang diễn ra" },
  { value: "completed", label: "Đã hoàn thành" },
];

const scheduleSchema = Yup.object().shape({
  batchName: Yup.string().required("Nhập tên đợt kiểm tra"),
  batch_description: Yup.string().required("Nhập mô tả lịch kiểm tra"),
  createdBy: Yup.string().required("Nhập người tạo"),
  date: Yup.date()
    .typeError("Chọn ngày kiểm tra")
    .required("Chọn ngày kiểm tra"),
  ward: Yup.array().of(Yup.string()).min(1, "Chọn ít nhất 1 phường/xã"),
});

const editSchema = Yup.object().shape({
  batch_name: Yup.string().required("Nhập tên đợt kiểm tra"),
  batch_date: Yup.date()
    .typeError("Chọn ngày kiểm tra")
    .required("Chọn ngày kiểm tra"),
  created_by: Yup.string().required("Nhập người tạo"),
  status: Yup.mixed()
    .oneOf(statusOptions.map((s) => s.value))
    .required("Chọn trạng thái"),
});

export default function ScheduleManagement() {
  const {
    data: schedules,
    isLoading: schedulesLoading,
    isError: schedulesError,
  } = useAllSchedulesQuery();
  const scheduleOptions = (schedules || []).map((b) => ({
    value: b.batch_id || b.id,
    label: b.batch_name,
  }));
  const [selectedBatchId, setSelectedBatchId] = useState(
    scheduleOptions[0]?.value || ""
  );
  const selectedBatch = (schedules || []).find(
    (b) => (b.batch_id || b.id) === selectedBatchId
  );
  const { data: allBusinesses, isLoading, isError } = useGetAllBusinesses();

  const form = useForm({
    initialValues: {
      type: businessTypeOptions[0].value,
      province: "Hà Nội",
      ward: hanoiWards[0]?.value ? [hanoiWards[0].value] : [],
      batchName: "",
      date: null as Date | null,
      batch_description: "",
      batchStatus: statusOptions[0].value,
      createdBy: "",
    },
    validate: yupResolver(scheduleSchema),
  });

  const handleOpenCreateModal = () => {
    setEditModalOpen(true);
  };
  const handleCreateSchedule = () => {
    setEditModalOpen(false);
    setConfirmOpen(true);
  };
  const createBatchMutation = useCreateInspectionBatchAndSchedulesMutation();
  const handleConfirmSchedule = async () => {
    setConfirmOpen(false);
    // Chuẩn bị dữ liệu batch và businesses
    const batch = {
      batch_name: form.values.batchName,
      batch_date: form.values.date!,
      business_type: Number(form.values.type),
      province: form.values.province,
      ward: form.values.ward.join(", "),
      status: form.values.batchStatus as "scheduled" | "ongoing" | "completed",
      created_by: form.values.createdBy,
      batch_description: form.values.batch_description,
    };
    const businesses = filteredBusinesses.map((b) => ({
      business_id: b.business_id,
    }));
    createBatchMutation.mutate(
      { batch, businesses },
      {
        onSuccess: () => {
          notifications.show({
            title: "Thành công",
            message: `Đã tạo lịch kiểm tra cho ${
              filteredBusinesses.length
            } hộ vào ngày ${form.values.date?.toLocaleDateString()}`,
            color: "green",
          });
          form.reset();
        },
        onError: () => {
          notifications.show({
            title: "Lỗi",
            message: "Tạo lịch kiểm tra thất bại",
            color: "red",
          });
        },
      }
    );
  };

  const businessTypeLabel = (type: string | number) => {
    if (String(type) === String(BusinessType.Individual))
      return "Hộ kinh doanh";
    if (String(type) === String(BusinessType.LLC)) return "Công ty TNHH";
    if (String(type) === String(BusinessType.JSC)) return "Công ty Cổ phần";
    return type;
  };

  const columns = [
    { accessorKey: "business_name", header: "Tên hộ" },
    { accessorKey: "business_code", header: "Mã số" },
    { accessorKey: "address", header: "Địa chỉ" },
    {
      accessorKey: "business_type",
      header: "Loại hình",
      Cell: ({ cell }: any) => businessTypeLabel(cell.getValue()),
    },
    { accessorKey: "province", header: "Tỉnh/TP" },
    { accessorKey: "ward", header: "Phường/Xã" },
  ];

  const filteredBusinesses = (allBusinesses || []).filter((b) => {
    const matchType = form.values.type
      ? String(b.business_type) === form.values.type
      : true;
    const matchProvince = form.values.province
      ? b.province === form.values.province
      : true;
    const matchWard =
      form.values.ward && form.values.ward.length > 0
        ? form.values.ward.includes(b.ward)
        : true;
    return matchType && matchProvince && matchWard;
  });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Lấy batch_id nếu có (giả sử selectedBatch có batch_id hoặc id)
  const batchId =
    (selectedBatch as any)?.batch_id || (selectedBatch as any)?.id;
  const { data: inspectionStats, isLoading: statsLoading } =
    useInspectionStatsByBatchId(batchId);
  const { data: violationStats, isLoading: violationStatsLoading } =
    useViolationStatsByBatchId(batchId);

  const deleteBatchMutation =
    useDeleteInspectionBatchAndAllLinkedDataMutation();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Lấy docId của schedule nếu có
  const scheduleDocId = (selectedBatch as any)?.id;

  const updateBatchAndSchedulesMutation =
    useUpdateInspectionBatchAndSchedulesMutation();
  const editForm = useForm({
    initialValues: {
      batch_name: "",
      batch_description: "",
      batch_date: null as Date | null,
      created_by: "",
      status: statusOptions[0].value,
    },
    validate: yupResolver(editSchema),
  });

  // Khi chọn batch mới, cập nhật lại form chỉnh sửa
  useEffect(() => {
    if (selectedBatch) {
      editForm.setValues({
        batch_name: selectedBatch.batch_name || "",
        batch_description: selectedBatch.batch_description || "",
        batch_date:
          selectedBatch.batch_date instanceof Date
            ? selectedBatch.batch_date
            : null,
        created_by: selectedBatch.created_by || "",
        status: selectedBatch.status || statusOptions[0].value,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBatch]);

  if (schedulesLoading)
    return <Box p="md">Đang tải danh sách đợt kiểm tra...</Box>;
  if (schedulesError)
    return (
      <Box p="md" c="red">
        Lỗi tải danh sách đợt kiểm tra!
      </Box>
    );
  if (isLoading) return <Box p="md">Đang tải dữ liệu doanh nghiệp...</Box>;
  if (isError)
    return (
      <Box p="md" c="red">
        Lỗi tải dữ liệu doanh nghiệp!
      </Box>
    );

  return (
    <Box p="md">
      {/* Chọn đợt kiểm tra */}
      <Group mb="md" align="flex-end" justify="space-between">
        <Group>
          <IconReportAnalytics size={32} />
          <Title order={2}>Quản lý đợt kiểm tra</Title>
        </Group>
        <Group>
          <Select
            label="Chọn đợt kiểm tra"
            data={scheduleOptions}
            value={selectedBatchId}
            onChange={(val) => val && setSelectedBatchId(val)}
            w={300}
          />
          {selectedBatch && (
            <>
              <Button variant="default" onClick={() => setEditModalOpen(true)}>
                Chỉnh sửa đợt kiểm tra
              </Button>
              <Button
                color="red"
                variant="outline"
                onClick={() => setDeleteModalOpen(true)}
              >
                Xóa đợt kiểm tra
              </Button>
            </>
          )}
        </Group>
      </Group>

      {/* Thông tin tổng quan */}
      {selectedBatch && (
        <Card withBorder radius="md" mb="lg" shadow="sm">
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
            <Stack gap={0}>
              <Text size="sm" c="dimmed">
                Tên đợt kiểm tra
              </Text>
              <Text fw={600}>{selectedBatch.batch_name}</Text>
            </Stack>
            <Stack gap={0}>
              <Text size="sm" c="dimmed">
                Ngày kiểm tra
              </Text>
              <Text fw={600}>
                {selectedBatch.batch_date instanceof Date
                  ? selectedBatch.batch_date.toLocaleDateString()
                  : ""}
              </Text>
            </Stack>
            <Stack gap={0}>
              <Text size="sm" c="dimmed">
                Loại hình
              </Text>
              <Text fw={600}>
                {businessTypeLabel(selectedBatch.business_type)}
              </Text>
            </Stack>
            <Stack gap={0}>
              <Text size="sm" c="dimmed">
                Tỉnh/Thành phố
              </Text>
              <Text fw={600}>{selectedBatch.province}</Text>
            </Stack>
            <Stack gap={0}>
              <Text size="sm" c="dimmed">
                Phường/Xã
              </Text>
              <Text fw={600}>{selectedBatch.ward}</Text>
            </Stack>
            <Stack gap={0}>
              <Text size="sm" c="dimmed">
                Trạng thái
              </Text>
              <Badge
                color={
                  selectedBatch.status === "ongoing"
                    ? "blue"
                    : selectedBatch.status === "completed"
                    ? "green"
                    : "gray"
                }
                variant="light"
                size="lg"
              >
                {selectedBatch.status === "scheduled"
                  ? "Đã lên lịch"
                  : selectedBatch.status === "ongoing"
                  ? "Đang diễn ra"
                  : selectedBatch.status === "completed"
                  ? "Đã hoàn thành"
                  : selectedBatch.status}
              </Badge>
            </Stack>
            <Stack gap={0}>
              <Text size="sm" c="dimmed">
                Người tạo
              </Text>
              <Text fw={600}>{selectedBatch.created_by}</Text>
            </Stack>
            <Stack gap={0}>
              <Text size="sm" c="dimmed">
                Mô tả lịch kiểm tra
              </Text>
              <Text fw={600}>
                {selectedBatch.batch_description || selectedBatch.note || ""}
              </Text>
            </Stack>
          </SimpleGrid>
        </Card>
      )}

      {/* 4 Card thống kê */}
      {selectedBatch && (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg" mb="xl">
          <Card withBorder radius="md" shadow="xs" p="lg">
            <Group>
              <IconUsers size={32} color="#228be6" />
              <Stack gap={0}>
                <Text size="sm" c="dimmed">
                  Tổng số hộ
                </Text>
                <Text fw={700} size="xl">
                  {batchId && !statsLoading && inspectionStats
                    ? inspectionStats.total
                    : 0}
                </Text>
              </Stack>
            </Group>
          </Card>
          <Card withBorder radius="md" shadow="xs" p="lg">
            <Group>
              <IconChecklist size={32} color="#40c057" />
              <Stack gap={0}>
                <Text size="sm" c="dimmed">
                  Đã kiểm tra
                </Text>
                <Text fw={700} size="xl">
                  {batchId && !statsLoading && inspectionStats
                    ? inspectionStats.checked
                    : 0}
                </Text>
              </Stack>
            </Group>
          </Card>
          <Card withBorder radius="md" shadow="xs" p="lg">
            <Group>
              <IconAlertTriangle size={32} color="#fa5252" />
              <Stack gap={0}>
                <Text size="sm" c="dimmed">
                  Có vi phạm
                </Text>
                <Text fw={700} size="xl">
                  {batchId && !violationStatsLoading && violationStats
                    ? violationStats.violated
                    : 0}
                </Text>
              </Stack>
            </Group>
          </Card>
          <Card withBorder radius="md" shadow="xs" p="lg">
            <Group>
              <IconCheck size={32} color="#12b886" />
              <Stack gap={0}>
                <Text size="sm" c="dimmed">
                  Không vi phạm
                </Text>
                <Text fw={700} size="xl">
                  {batchId && !violationStatsLoading && violationStats
                    ? violationStats.nonViolated
                    : 0}
                </Text>
              </Stack>
            </Group>
          </Card>
        </SimpleGrid>
      )}

      {/* Tạo lịch kiểm tra */}
      <Card withBorder radius="md" mt="xl" shadow="sm" p="lg">
        <Group mb="md">
          <IconCalendarPlus size={28} />
          <Title order={4}>Tạo lịch kiểm tra mới</Title>
        </Group>
        <Group mb="md">
          <Select
            label="Loại hình"
            data={businessTypeOptions}
            value={form.values.type}
            onChange={(val) => val && form.setFieldValue("type", val)}
            w={160}
          />
          <Select
            label="Tỉnh/Thành phố"
            data={provinces}
            value={form.values.province}
            onChange={(val) => val && form.setFieldValue("province", val)}
            w={160}
          />
          <MultiSelect
            label="Phường/Xã"
            data={wards}
            value={form.values.ward}
            onChange={(val) => form.setFieldValue("ward", val)}
            w={220}
            searchable
            error={form.errors.ward}
          />
        </Group>
        <MantineReactTable
          columns={columns}
          data={filteredBusinesses}
          localization={MRT_Localization_VI}
          enableGlobalFilter={false}
          enableDensityToggle={false}
          enableFilters={false}
          mantineTableProps={{
            striped: true,
            withTableBorder: true,
            highlightOnHover: true,
            withColumnBorders: true,
          }}
          mantineTableContainerProps={{ style: { maxHeight: "50vh" } }}
          getRowId={(row) => row.business_code}
        />
        <Group mt="md">
          <Button
            leftSection={<IconCalendarPlus size={18} />}
            onClick={handleOpenCreateModal}
            disabled={filteredBusinesses.length === 0}
          >
            Tạo lịch kiểm tra
          </Button>
        </Group>
        <Modal
          opened={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title="Tạo lịch kiểm tra"
          centered
        >
          <TextInput
            label="Tên đợt kiểm tra"
            {...form.getInputProps("batchName")}
            required
            placeholder="Nhập tên đợt kiểm tra"
            mb="md"
            error={form.errors.batchName}
          />
          <DateInput
            label="Lịch kiểm tra"
            value={form.values.date}
            onChange={(val) => form.setFieldValue("date", val)}
            required
            placeholder="Chọn ngày"
            mb="md"
            error={form.errors.date}
          />
          <Textarea
            label="Mô tả lịch kiểm tra"
            {...form.getInputProps("batch_description")}
            mb="md"
            placeholder="Kiểm tra..."
            error={form.errors.batch_description}
            autosize
            minRows={2}
            maxRows={6}
          />
          <Select
            label="Trạng thái"
            data={statusOptions}
            value={form.values.batchStatus}
            onChange={(val) => val && form.setFieldValue("batchStatus", val)}
            mb="md"
          />
          <TextInput
            label="Người tạo"
            {...form.getInputProps("createdBy")}
            required
            placeholder="Nhập tên người tạo"
            mb="md"
            error={form.errors.createdBy}
          />

          <Group mt="md">
            <Button
              onClick={handleCreateSchedule}
              disabled={
                !form.values.date ||
                !form.values.batchName ||
                !form.values.createdBy
              }
            >
              Tiếp tục
            </Button>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Hủy
            </Button>
          </Group>
        </Modal>
        <Modal
          opened={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          title="Xác nhận tạo lịch kiểm tra"
          centered
        >
          <Text mb="md">
            Bạn chắc chắn muốn tạo lịch kiểm tra cho{" "}
            <b>{filteredBusinesses.length}</b> hộ kinh doanh vào ngày{" "}
            <b>{form.values.date?.toLocaleDateString()}</b>?
          </Text>
          <Group>
            <Button onClick={handleConfirmSchedule}>Xác nhận</Button>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Hủy
            </Button>
          </Group>
        </Modal>
      </Card>

      {/* Modal xác nhận xóa đợt kiểm tra */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Xác nhận xóa đợt kiểm tra"
        centered
      >
        <Text mb="md" c="red">
          Bạn có chắc chắn muốn xóa đợt kiểm tra này? Tất cả lịch kiểm tra, vi
          phạm, báo cáo liên quan sẽ bị xóa vĩnh viễn!
        </Text>
        <Group>
          <Button
            color="red"
            loading={deleteBatchMutation.status === "pending"}
            onClick={async () => {
              deleteBatchMutation.mutate(
                { batchId, scheduleDocId },
                {
                  onSuccess: () => {
                    setDeleteModalOpen(false);
                    notifications.show({
                      title: "Đã xóa đợt kiểm tra",
                      message: "Toàn bộ dữ liệu liên quan đã được xóa.",
                      color: "green",
                    });
                    // Sau khi xóa, chuyển về đợt đầu tiên nếu còn
                    setSelectedBatchId(scheduleOptions[0]?.value || "");
                  },
                  onError: () => {
                    notifications.show({
                      title: "Lỗi xóa đợt kiểm tra",
                      message: "Không thể xóa đợt kiểm tra. Vui lòng thử lại!",
                      color: "red",
                    });
                  },
                }
              );
            }}
          >
            Xác nhận xóa
          </Button>
          <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
            Hủy
          </Button>
        </Group>
      </Modal>

      {/* Modal chỉnh sửa đợt kiểm tra */}
      <Modal
        opened={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Chỉnh sửa đợt kiểm tra"
        centered
      >
        <TextInput
          label="Tên đợt kiểm tra"
          {...editForm.getInputProps("batch_name")}
          mb="md"
          required
          error={editForm.errors.batch_name}
        />
        <DateInput
          label="Ngày kiểm tra"
          value={editForm.values.batch_date}
          onChange={(val) => editForm.setFieldValue("batch_date", val)}
          mb="md"
          required
          error={editForm.errors.batch_date}
        />
        <TextInput
          label="Người tạo"
          {...editForm.getInputProps("created_by")}
          mb="md"
          required
          error={editForm.errors.created_by}
        />
        <Select
          label="Trạng thái"
          data={statusOptions}
          value={editForm.values.status}
          onChange={(val) => val && editForm.setFieldValue("status", val)}
          mb="md"
          required
          error={editForm.errors.status}
        />
        <Textarea
          label="Mô tả lịch kiểm tra"
          {...editForm.getInputProps("batch_description")}
          mb="md"
          autosize
          minRows={2}
          maxRows={6}
          required
          error={editForm.errors.batch_description}
        />
        <Group mt="md">
          <Button
            onClick={() => {
              if (!selectedBatch) return;
              if (!editForm.validate().hasErrors) {
                updateBatchAndSchedulesMutation.mutate(
                  {
                    scheduleDocId: selectedBatch.id,
                    batchData: {
                      batch_name: editForm.values.batch_name,
                      batch_description: editForm.values.batch_description,
                      batch_date: editForm.values.batch_date || undefined,
                      created_by: editForm.values.created_by,
                      status: editForm.values.status as
                        | "scheduled"
                        | "ongoing"
                        | "completed",
                    },
                  },
                  {
                    onSuccess: () => {
                      setEditModalOpen(false);
                      notifications.show({
                        title: "Đã cập nhật đợt kiểm tra",
                        message:
                          "Thông tin và ngày kiểm tra đã được cập nhật cho toàn bộ lịch kiểm tra.",
                        color: "green",
                      });
                    },
                    onError: () => {
                      notifications.show({
                        title: "Lỗi cập nhật",
                        message:
                          "Không thể cập nhật đợt kiểm tra. Vui lòng thử lại!",
                        color: "red",
                      });
                    },
                  }
                );
              }
            }}
            loading={updateBatchAndSchedulesMutation.status === "pending"}
          >
            Lưu thay đổi
          </Button>
          <Button variant="outline" onClick={() => setEditModalOpen(false)}>
            Hủy
          </Button>
        </Group>
      </Modal>
    </Box>
  );
}
