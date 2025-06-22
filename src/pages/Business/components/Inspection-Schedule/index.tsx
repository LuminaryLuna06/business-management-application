import {
  Box,
  Text,
  Button,
  Modal,
  Group,
  TextInput,
  Select,
  Badge,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { MantineReactTable, type MRT_ColumnDef } from "mantine-react-table";
import { useForm, yupResolver } from "@mantine/form";
import * as Yup from "yup";
import { DateInput } from "@mantine/dates";
import type {
  InspectionSchedule,
  ViolationResult,
} from "../../../../types/schedule";

const inspectionSchema = Yup.object().shape({
  inspection_date: Yup.date().required("Ngày kiểm tra không được để trống"),
  inspector_description: Yup.string().required("Mô tả không được để trống"),
  inspector_status: Yup.mixed().oneOf(["pending", "completed", "cancelled"]),
});

const violationSchema = Yup.object().shape({
  violation_number: Yup.string().required("Số quyết định không được để trống"),
  issue_date: Yup.date().required("Ngày ban hành không được để trống"),
  violation_status: Yup.mixed().oneOf(["pending", "paid", "dismissed"]),
  fix_status: Yup.mixed().oneOf(["not_fixed", "fixed", "in_progress"]),
  officer_signed: Yup.string().required("Cán bộ ký không được để trống"),
  officer_executor: Yup.string().required(
    "Cán bộ thực hiện không được để trống"
  ),
  penalty_file: Yup.mixed(),
});

// Đơn giản hóa type cho quyết định xử phạt
type PenaltyDecision = {
  id: string;
  violation_id: string;
  decision_number: string;
  issue_date: Date;
  penalty_status: "pending" | "paid" | "dismissed";
  fix_status: "not_fixed" | "fixed" | "in_progress";
  officer_signed: string;
};

// Đơn giản hóa type cho ViolationResult mở rộng
type ViolationWithDecision = ViolationResult & {
  violation_desc: string;
  penalty_decision?: PenaltyDecision;
};

function InspectionSchedulePage() {
  const { businessId } = useParams();
  const [schedules, setSchedules] = useState<InspectionSchedule[]>([]);
  const [violations, setViolations] = useState<
    Record<string, ViolationWithDecision[]>
  >({});
  const [opened, { open, close }] = useDisclosure(false);
  const [, { close: closeViolation }] = useDisclosure(false);
  const [selectedSchedule, setSelectedSchedule] =
    useState<InspectionSchedule | null>(null);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(
    null
  );
  const [selectedDecision, setSelectedDecision] =
    useState<PenaltyDecision | null>(null);
  const [showAddViolation, setShowAddViolation] = useState(false);
  const [showAddPenalty, setShowAddPenalty] = useState(false);
  const [selectedViolationForPenalty, setSelectedViolationForPenalty] =
    useState<ViolationWithDecision | null>(null);

  // Mock data init
  useEffect(() => {
    const sampleSchedules: InspectionSchedule[] = [
      {
        schedule_id: crypto.randomUUID(),
        business_code: businessId || "BIZ001",
        inspection_date: new Date("2024-03-15"),
        inspector_description: "Kiểm tra định kỳ quý 1",
        inspector_status: "completed",
      },
      {
        schedule_id: crypto.randomUUID(),
        business_code: businessId || "BIZ001",
        inspection_date: new Date("2024-06-10"),
        inspector_description: "Kiểm tra đột xuất an toàn thực phẩm",
        inspector_status: "pending",
      },
    ];
    setSchedules(sampleSchedules);
    setViolations({
      [sampleSchedules[0].schedule_id]: [
        {
          violation_id: crypto.randomUUID(),
          report_id: sampleSchedules[0].schedule_id,
          violation_number: "QD-2024-001",
          issue_date: new Date("2024-03-16"),
          violation_status: "paid",
          fix_status: "fixed",
          officer_signed: "Nguyen Van A",
          violation_desc: "Không đảm bảo vệ sinh khu vực chế biến.",
          penalty_decision: {
            id: crypto.randomUUID(),
            violation_id: "1",
            decision_number: "DEC-2024-001",
            issue_date: new Date("2024-03-17"),
            penalty_status: "paid",
            fix_status: "fixed",
            officer_signed: "Nguyen Van A",
          },
        },
        {
          violation_id: crypto.randomUUID(),
          report_id: sampleSchedules[0].schedule_id,
          violation_number: "QD-2024-002",
          issue_date: new Date("2024-03-16"),
          violation_status: "pending",
          fix_status: "not_fixed",
          officer_signed: "Le Van C",
          violation_desc: "Không có giấy chứng nhận ATTP.",
        },
      ],
    });
  }, [businessId]);

  // Table columns
  const columns: MRT_ColumnDef<InspectionSchedule>[] = [
    {
      accessorKey: "inspection_date",
      header: "Ngày kiểm tra",
      Cell: ({ cell }) => cell.getValue<Date>()?.toLocaleDateString() || "",
    },
    { accessorKey: "inspector_description", header: "Mô tả" },
    {
      accessorKey: "inspector_status",
      header: "Trạng thái",
      Cell: ({ cell }) => {
        const status = cell.getValue<string>();
        if (status === "completed")
          return <Badge color="green">Đã kiểm tra</Badge>;
        if (status === "pending")
          return <Badge color="yellow">Chưa kiểm tra</Badge>;
        if (status === "cancelled") return <Badge color="red">Đã hủy</Badge>;
        return status;
      },
    },
    {
      header: "Hành động",
      Cell: ({ row }) => (
        <Button size="xs" onClick={() => handleViewDetails(row.original)}>
          Chi tiết
        </Button>
      ),
    },
  ];

  // Form for adding inspection
  const form = useForm({
    initialValues: {
      inspection_date: new Date(),
      inspector_description: "",
      inspector_status: "pending" as const,
    },
    validate: yupResolver(inspectionSchema),
  });

  // Form for adding violation
  const violationForm = useForm({
    initialValues: {
      violation_number: "",
      issue_date: new Date(),
      violation_status: "pending" as const,
      fix_status: "not_fixed" as const,
      officer_signed: "",
      violation_desc: "",
    },
    validate: yupResolver(violationSchema),
  });

  // Form for adding penalty decision
  const penaltyForm = useForm({
    initialValues: {
      decision_number: "",
      issue_date: new Date(),
      penalty_status: "pending" as const,
      fix_status: "not_fixed" as const,
      officer_signed: "",
    },
    validate: yupResolver(violationSchema),
  });

  function handleAddInspection(values: typeof form.values) {
    const newSchedule: InspectionSchedule = {
      schedule_id: crypto.randomUUID(),
      business_code: businessId || "BIZ001",
      inspection_date: values.inspection_date,
      inspector_description: values.inspector_description,
      inspector_status: values.inspector_status,
    };
    setSchedules((prev) => [...prev, newSchedule]);
    close();
    form.reset();
  }

  function handleViewDetails(schedule: InspectionSchedule) {
    setSelectedSchedule(schedule);
    setSelectedScheduleId(schedule.schedule_id);
  }

  function handleAddViolation(values: typeof violationForm.values) {
    if (!selectedScheduleId) return;
    const newViolation: ViolationWithDecision = {
      violation_id: crypto.randomUUID(),
      report_id: selectedScheduleId,
      violation_number: values.violation_number,
      issue_date: values.issue_date,
      violation_status: values.violation_status,
      fix_status: values.fix_status,
      officer_signed: values.officer_signed,
      violation_desc: values.violation_desc,
    };
    setViolations((prev) => ({
      ...prev,
      [selectedScheduleId]: [...(prev[selectedScheduleId] || []), newViolation],
    }));
    setShowAddViolation(false);
    violationForm.reset();
    closeViolation();
  }

  function handleAddPenalty(values: typeof penaltyForm.values) {
    if (!selectedViolationForPenalty || !selectedScheduleId) return;

    const newPenalty: PenaltyDecision = {
      id: crypto.randomUUID(),
      violation_id: selectedViolationForPenalty.violation_id,
      decision_number: values.decision_number,
      issue_date: values.issue_date,
      penalty_status: values.penalty_status,
      fix_status: values.fix_status,
      officer_signed: values.officer_signed,
    };

    // Update the violation with the penalty decision
    setViolations((prev) => ({
      ...prev,
      [selectedScheduleId]: prev[selectedScheduleId].map((violation) =>
        violation.violation_id === selectedViolationForPenalty.violation_id
          ? { ...violation, penalty_decision: newPenalty }
          : violation
      ),
    }));

    setShowAddPenalty(false);
    setSelectedViolationForPenalty(null);
    penaltyForm.reset();
  }

  function handleAddPenaltyDecision(violation: ViolationWithDecision) {
    setSelectedViolationForPenalty(violation);
    setShowAddPenalty(true);
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
      <Group mb="md">
        <Button onClick={open}>Thêm lịch kiểm tra</Button>
      </Group>
      <MantineReactTable
        columns={columns}
        data={schedules}
        enableRowSelection
        enableColumnFilters
        enableGlobalFilter
        getRowId={(row) => row.schedule_id}
        onRowSelectionChange={(rowSelection) => {
          const selectedId = Object.keys(rowSelection)[0];
          const found =
            schedules.find((s) => s.schedule_id === selectedId) || null;
          setSelectedSchedule(found);
          setSelectedDecision(null);
        }}
        state={{
          rowSelection: selectedSchedule
            ? { [selectedSchedule.schedule_id]: true }
            : {},
        }}
      />

      {/* Hiển thị bảng vi phạm phía dưới nếu đã chọn lịch kiểm tra */}
      {selectedSchedule && (
        <Box
          mt="xl"
          p="md"
          style={{ border: "1px solid #eee", borderRadius: 8 }}
        >
          <Text fw={600} mb="sm">
            Danh sách vi phạm của lịch kiểm tra ngày{" "}
            {selectedSchedule.inspection_date.toLocaleDateString()}
          </Text>
          <Group mb="sm">
            <Button size="sm" onClick={() => setShowAddViolation(true)}>
              Thêm vi phạm
            </Button>
          </Group>
          <Modal
            opened={showAddViolation}
            onClose={() => setShowAddViolation(false)}
            title="Thêm vi phạm"
          >
            <form onSubmit={violationForm.onSubmit(handleAddViolation)}>
              <TextInput
                label="Số quyết định"
                {...violationForm.getInputProps("violation_number")}
                mb="sm"
              />
              <DateInput
                label="Ngày ban hành"
                {...violationForm.getInputProps("issue_date")}
                mb="sm"
              />
              <TextInput
                label="Mô tả vi phạm"
                {...violationForm.getInputProps("violation_desc")}
                mb="sm"
              />
              <Select
                label="Trạng thái xử phạt"
                {...violationForm.getInputProps("violation_status")}
                data={[
                  { value: "pending", label: "Chưa xử phạt" },
                  { value: "paid", label: "Đã xử phạt" },
                  { value: "dismissed", label: "Đã miễn" },
                ]}
                mb="sm"
              />
              <Select
                label="Trạng thái khắc phục"
                {...violationForm.getInputProps("fix_status")}
                data={[
                  { value: "not_fixed", label: "Chưa khắc phục" },
                  { value: "fixed", label: "Đã khắc phục" },
                  { value: "in_progress", label: "Đang xử lý" },
                ]}
                mb="sm"
              />
              <TextInput
                label="Cán bộ ký"
                {...violationForm.getInputProps("officer_signed")}
                mb="sm"
              />
              <Group justify="right">
                <Button type="submit">Lưu</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddViolation(false)}
                >
                  Hủy
                </Button>
              </Group>
            </form>
          </Modal>
          <MantineReactTable
            columns={[
              { accessorKey: "violation_number", header: "Số quyết định" },
              { accessorKey: "violation_desc", header: "Mô tả vi phạm" },
              {
                accessorKey: "violation_status",
                header: "Trạng thái xử phạt",
                Cell: ({ cell }) => {
                  const status = cell.getValue<string>();
                  if (status === "pending")
                    return <Badge color="yellow">Chưa xử phạt</Badge>;
                  if (status === "paid")
                    return <Badge color="green">Đã xử phạt</Badge>;
                  if (status === "dismissed")
                    return <Badge color="gray">Đã miễn</Badge>;
                  return status;
                },
              },
              {
                accessorKey: "fix_status",
                header: "Trạng thái khắc phục",
                Cell: ({ cell }) => {
                  const status = cell.getValue<string>();
                  if (status === "not_fixed")
                    return <Badge color="red">Chưa khắc phục</Badge>;
                  if (status === "fixed")
                    return <Badge color="green">Đã khắc phục</Badge>;
                  if (status === "in_progress")
                    return <Badge color="blue">Đang xử lý</Badge>;
                  return status;
                },
              },
              {
                header: "Quyết định xử phạt",
                Cell: ({ row }: { row: { original: ViolationWithDecision } }) =>
                  row.original.penalty_decision ? (
                    <Button
                      size="xs"
                      onClick={() =>
                        setSelectedDecision(row.original.penalty_decision!)
                      }
                    >
                      Xem quyết định
                    </Button>
                  ) : (
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => handleAddPenaltyDecision(row.original)}
                    >
                      Thêm quyết định
                    </Button>
                  ),
              },
            ]}
            data={violations[selectedSchedule.schedule_id] || []}
            enablePagination={false}
            enableColumnFilters={false}
            enableGlobalFilter={false}
            getRowId={(row) => row.violation_id}
            onRowSelectionChange={(rowSelection) => {
              const selectedId = Object.keys(rowSelection)[0];
              const found = (
                violations[selectedSchedule.schedule_id] || []
              ).find((v) => v.violation_id === selectedId);
              if (found && found.penalty_decision)
                setSelectedDecision(found.penalty_decision);
              else setSelectedDecision(null);
            }}
            state={{
              rowSelection:
                selectedDecision && selectedDecision.violation_id
                  ? { [selectedDecision.violation_id]: true }
                  : {},
            }}
          />
          {/* Hiển thị chi tiết quyết định xử phạt phía dưới nếu có */}
          {selectedDecision && (
            <Box
              mt="md"
              p="md"
              style={{
                border: "1px solid #ddd",
                borderRadius: 8,
                background: "#fafafa",
              }}
            >
              <Text fw={600} mb="xs">
                Chi tiết quyết định xử phạt
              </Text>
              <Text>
                <b>ID:</b> {selectedDecision.id}
              </Text>
              <Text>
                <b>Số quyết định:</b> {selectedDecision.decision_number}
              </Text>
              <Text>
                <b>Ngày ban hành:</b>{" "}
                {selectedDecision.issue_date.toLocaleDateString()}
              </Text>
              <Text>
                <b>Trạng thái xử phạt:</b>{" "}
                {selectedDecision.penalty_status === "paid"
                  ? "Đã xử phạt"
                  : selectedDecision.penalty_status === "pending"
                  ? "Chưa xử phạt"
                  : "Đã miễn"}
              </Text>
              <Text>
                <b>Trạng thái khắc phục:</b>{" "}
                {selectedDecision.fix_status === "fixed"
                  ? "Đã khắc phục"
                  : selectedDecision.fix_status === "not_fixed"
                  ? "Chưa khắc phục"
                  : "Đang xử lý"}
              </Text>
              <Text>
                <b>Cán bộ ký:</b> {selectedDecision.officer_signed}
              </Text>
            </Box>
          )}
        </Box>
      )}

      {/* Modal thêm lịch kiểm tra giữ nguyên */}
      <Modal opened={opened} onClose={close} title="Thêm lịch kiểm tra">
        <form onSubmit={form.onSubmit(handleAddInspection)}>
          <DateInput
            label="Ngày kiểm tra"
            {...form.getInputProps("inspection_date")}
            mb="sm"
          />
          <TextInput
            label="Mô tả"
            {...form.getInputProps("inspector_description")}
            mb="sm"
          />
          <Select
            label="Trạng thái"
            {...form.getInputProps("inspector_status")}
            data={[
              { value: "pending", label: "Chưa kiểm tra" },
              { value: "completed", label: "Đã kiểm tra" },
              { value: "cancelled", label: "Đã hủy" },
            ]}
            mb="sm"
          />
          <Group justify="right">
            <Button type="submit">Lưu</Button>
            <Button onClick={close} variant="outline">
              Hủy
            </Button>
          </Group>
        </form>
      </Modal>

      {/* Modal thêm quyết định xử phạt */}
      <Modal
        opened={showAddPenalty}
        onClose={() => setShowAddPenalty(false)}
        title="Thêm quyết định xử phạt"
      >
        <form onSubmit={penaltyForm.onSubmit(handleAddPenalty)}>
          <TextInput
            label="Số quyết định"
            {...penaltyForm.getInputProps("decision_number")}
            mb="sm"
          />
          <DateInput
            label="Ngày ban hành"
            {...penaltyForm.getInputProps("issue_date")}
            mb="sm"
          />
          <Select
            label="Trạng thái xử phạt"
            {...penaltyForm.getInputProps("penalty_status")}
            data={[
              { value: "pending", label: "Chưa xử phạt" },
              { value: "paid", label: "Đã xử phạt" },
              { value: "dismissed", label: "Đã miễn" },
            ]}
            mb="sm"
          />
          <Select
            label="Trạng thái khắc phục"
            {...penaltyForm.getInputProps("fix_status")}
            data={[
              { value: "not_fixed", label: "Chưa khắc phục" },
              { value: "fixed", label: "Đã khắc phục" },
              { value: "in_progress", label: "Đang xử lý" },
            ]}
            mb="sm"
          />
          <TextInput
            label="Cán bộ ký"
            {...penaltyForm.getInputProps("officer_signed")}
            mb="sm"
          />
          <Group justify="right">
            <Button type="submit">Lưu</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddPenalty(false)}
            >
              Hủy
            </Button>
          </Group>
        </form>
      </Modal>
    </Box>
  );
}

export default InspectionSchedulePage;
