import {
  Box,
  Text,
  Button,
  Modal,
  Group,
  Card,
  SimpleGrid,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useParams } from "react-router-dom";
import { MantineReactTable, type MRT_ColumnDef } from "mantine-react-table";
import { useForm, yupResolver } from "@mantine/form";
import * as Yup from "yup";
import { Gender, type Worker } from "../../../../types/worker"; // Giả định file chứa enum Gender
import { TextInput, Select } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import {
  useEmployeesQuery,
  useAddEmployeeMutation,
} from "../../../../tanstack/useEmployeeQueries";
import { MRT_Localization_VI } from "mantine-react-table/locales/vi/index.cjs";

const schema = Yup.object().shape({
  worker_name: Yup.string()
    .required("Tên nhân viên không được để trống")
    .min(2, "Tên phải có ít nhất 2 ký tự"),
  birth_date: Yup.date()
    .required("Ngày sinh không được để trống")
    .max(new Date(), "Ngày sinh không được trong tương lai"),
  gender: Yup.mixed<Gender>()
    .required("Giới tính không được để trống")
    .oneOf([Gender.Male, Gender.Female], "Giới tính không hợp lệ"),
  insurance_status: Yup.boolean(),
  fire_safety_training: Yup.boolean(),
  food_safety_training: Yup.boolean(),
});

function Employees() {
  const { businessId } = useParams();
  const [opened, { open, close }] = useDisclosure(false);
  const {
    data: employees,
    isLoading,
    error,
  } = useEmployeesQuery(businessId || "");
  const addEmployeeMutation = useAddEmployeeMutation(businessId || "");

  const columns: MRT_ColumnDef<Worker>[] = [
    { accessorKey: "worker_name", header: "Tên nhân viên" },
    {
      accessorKey: "birth_date",
      header: "Ngày sinh",
      filterVariant: "date-range",
      sortingFn: "datetime",
      Cell: ({ cell }) => cell.getValue<Date>()?.toLocaleDateString(),
    },
    {
      accessorKey: "gender",
      header: "Giới tính",
      filterVariant: "select",
      mantineFilterSelectProps: {
        data: [
          { value: Gender.Male.toString(), label: "Nam" },
          { value: Gender.Female.toString(), label: "Nữ" },
        ],
      },
      Cell: ({ cell }) =>
        cell.getValue<Gender>() === Gender.Male ? "Nam" : "Nữ",
    },
    {
      accessorKey: "insurance_status",
      header: "Bảo hiểm",
      filterVariant: "select",
      mantineFilterSelectProps: {
        data: [
          { value: "true", label: "Đã đóng" },
          { value: "false", label: "Chưa đóng" },
        ],
      },
      Cell: ({ cell }) => (cell.getValue<boolean>() ? "Đã đóng" : "Chưa đóng"),
    },
    {
      accessorKey: "fire_safety_training",
      header: "Đào tạo PCCC",
      filterVariant: "select",
      mantineFilterSelectProps: {
        data: [
          { value: "true", label: "Có" },
          { value: "false", label: "Không" },
        ],
      },
      Cell: ({ cell }) => (cell.getValue<boolean>() ? "Có" : "Không"),
    },
    {
      accessorKey: "food_safety_training",
      header: "Đào tạo ATTP",
      filterVariant: "select",
      mantineFilterSelectProps: {
        data: [
          { value: "true", label: "Có" },
          { value: "false", label: "Không" },
        ],
      },
      Cell: ({ cell }) => (cell.getValue<boolean>() ? "Có" : "Không"),
    },
  ];

  // Form với useForm và Yup
  const form = useForm({
    initialValues: {
      worker_name: "",
      birth_date: new Date(),
      gender: Gender.Male,
      insurance_status: false,
      fire_safety_training: false,
      food_safety_training: false,
    },
    validate: yupResolver(schema),
  });

  const handleAddWorker = (values: typeof form.values) => {
    if (!businessId) return;
    const employeeData: Worker = {
      worker_name: values.worker_name,
      birth_date: values.birth_date,
      gender: values.gender,
      insurance_status: values.insurance_status,
      fire_safety_training: values.fire_safety_training,
      food_safety_training: values.food_safety_training,
    };
    addEmployeeMutation.mutate(employeeData, {
      onSuccess: () => {
        form.reset();
        close();
      },
    });
  };

  // Thống kê số lượng
  const insuranceCount = (employees || []).filter(
    (w) => w.insurance_status
  ).length;
  const foodSafetyCount = (employees || []).filter(
    (w) => w.food_safety_training
  ).length;
  const fireSafetyCount = (employees || []).filter(
    (w) => w.fire_safety_training
  ).length;

  if (isLoading) return <Text>Đang tải dữ liệu nhân sự...</Text>;
  if (error) return <Text color="red">Lỗi tải dữ liệu nhân sự</Text>;

  return (
    <Box p="md">
      <Text size="xl" fw={700} mb="md">
        Danh Sách Nhân Sự
      </Text>
      {/* Thống kê nhanh */}
      <SimpleGrid cols={{ base: 1, sm: 4 }} mb="md">
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Text size="lg" fw={500}>
            Tổng số nhân sự
          </Text>
          <Text size="2rem" fw={700} color="violet" mt="xs">
            {(employees || []).length}
          </Text>
        </Card>
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Text size="lg" fw={500}>
            Đã đóng bảo hiểm
          </Text>
          <Text size="2rem" fw={700} color="blue" mt="xs">
            {insuranceCount}
          </Text>
        </Card>
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Text size="lg" fw={500}>
            Đào tạo ATTP
          </Text>
          <Text size="2rem" fw={700} color="green" mt="xs">
            {foodSafetyCount}
          </Text>
        </Card>
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Text size="lg" fw={500}>
            Đào tạo PCCC
          </Text>
          <Text size="2rem" fw={700} color="red" mt="xs">
            {fireSafetyCount}
          </Text>
        </Card>
      </SimpleGrid>
      <Group mb="md">
        <Button onClick={open}>Thêm nhân viên</Button>
        <Button variant="outline">Import dữ liệu</Button>
      </Group>
      <MantineReactTable
        columns={columns}
        data={employees || []}
        enablePagination
        enableSorting
        enableDensityToggle={false}
        enableTopToolbar
        columnFilterDisplayMode={"popover"}
        enableColumnFilters
        enableGlobalFilter
        enableStickyHeader
        localization={MRT_Localization_VI}
        initialState={{
          pagination: { pageSize: 10, pageIndex: 0 },
          density: "xs",
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
        enableRowSelection
        enableSelectAll
      />

      <Modal opened={opened} onClose={close} title="Thêm nhân viên">
        <form onSubmit={form.onSubmit(handleAddWorker)}>
          <TextInput
            label="Tên nhân viên"
            {...form.getInputProps("worker_name")}
            mb="sm"
            required
          />
          <DateInput
            label="Ngày sinh"
            {...form.getInputProps("birth_date")}
            mb="sm"
            required
          />
          <Select
            label="Giới tính"
            data={[
              { value: Gender.Male.toString(), label: "Nam" },
              { value: Gender.Female.toString(), label: "Nữ" },
            ]}
            value={form.values.gender.toString()}
            onChange={(val) =>
              form.setFieldValue(
                "gender",
                val === "1" ? Gender.Male : Gender.Female
              )
            }
            mb="sm"
            required
          />
          <Select
            label="Bảo hiểm"
            {...form.getInputProps("insurance_status")}
            data={[
              { value: "true", label: "Có" },
              { value: "false", label: "Không" },
            ]}
            mb="sm"
            required
          />
          <Select
            label="Đào tạo PCCC"
            {...form.getInputProps("fire_safety_training")}
            data={[
              { value: "true", label: "Có" },
              { value: "false", label: "Không" },
            ]}
            mb="sm"
            required
          />
          <Select
            label="Đào tạo ATTP"
            {...form.getInputProps("food_safety_training")}
            data={[
              { value: "true", label: "Có" },
              { value: "false", label: "Không" },
            ]}
            mb="sm"
            required
          />
          <Group justify="right">
            <Button type="submit">Lưu</Button>
            <Button onClick={close} variant="outline">
              Hủy
            </Button>
          </Group>
        </form>
      </Modal>
    </Box>
  );
}

export default Employees;
