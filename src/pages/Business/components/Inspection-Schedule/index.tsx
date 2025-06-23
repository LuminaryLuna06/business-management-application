import { Box, Text, Button, Group } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useParams } from "react-router-dom";
import { useForm, yupResolver } from "@mantine/form";
import * as Yup from "yup";
import { useInspectionSchedules } from "../../../../tanstack/useInspectionQueries";
import { MantineReactTable, type MRT_ColumnDef } from "mantine-react-table";

const inspectionSchema = Yup.object().shape({
  inspection_date: Yup.date().required("Ngày kiểm tra không được để trống"),
  inspector_description: Yup.string().required("Mô tả không được để trống"),
  inspector_status: Yup.mixed().oneOf(["pending", "completed", "cancelled"]),
});

const resultSchema = Yup.object().shape({
  result_desc: Yup.string().required("Mô tả kiểm tra không được để trống"),
  result_status: Yup.mixed()
    .oneOf(["pending", "confirmed", "cancelled"])
    .required("Trạng thái kiểm tra không được để trống"),
});

const violationSchema = Yup.object().shape({
  violation_number: Yup.string().required("Số quyết định không được để trống"),
  issue_date: Yup.date().required("Ngày ban hành không được để trống"),
  violation_status: Yup.mixed().oneOf(["pending", "paid", "dismissed"]),
  fix_status: Yup.mixed().oneOf(["not_fixed", "fixed", "in_progress"]),
  officer_signed: Yup.string().required("Cán bộ ký không được để trống"),
});

// useForm cho inspection
const inspectionForm = useForm({
  initialValues: {
    inspection_date: new Date(),
    inspector_description: "",
    inspector_status: "pending" as const,
  },
  validate: yupResolver(inspectionSchema),
});

// useForm cho violation
const resultForm = useForm({
  initialValues: {
    result_desc: "",
    result_status: "pending" as const,
  },
  validate: yupResolver(violationSchema),
});

// useForm cho penalty decision
const decisionForm = useForm({
  initialValues: {
    decision_number: "",
    issue_date: new Date(),
    penalty_status: "pending" as const,
    fix_status: "not_fixed" as const,
    officer_signed: "",
  },
  validate: yupResolver(violationSchema),
});

function InspectionSchedulePage() {
  const { businessId } = useParams();
  const [opened, { open, close }] = useDisclosure(false);
  const {
    data: inspections,
    isLoading,
    error,
  } = useInspectionSchedules(businessId || "");

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
        <Button onClick={open}>Thêm lịch kiểm tra</Button>
      </Group>
      <MantineReactTable columns={columns} data={inspections || []} />
    </Box>
  );
}

export default InspectionSchedulePage;
