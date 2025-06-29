import { useState } from "react";
import {
  Box,
  Text,
  Button,
  Modal,
  Group,
  Card,
  SimpleGrid,
  ActionIcon,
  Tooltip,
  Flex,
  Alert,
  Center,
  Loader,
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
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
} from "../../../../tanstack/useEmployeeQueries";
import { MRT_Localization_VI } from "mantine-react-table/locales/vi/index.cjs";
import {
  IconEdit,
  IconTrash,
  IconEye,
  IconPlus,
  IconDownload,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

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
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<
    (Worker & { id: string }) | null
  >(null);
  const {
    data: employees,
    isLoading,
    error,
  } = useEmployeesQuery(businessId || "");
  const addEmployeeMutation = useAddEmployeeMutation(businessId || "");
  const updateEmployeeMutation = useUpdateEmployeeMutation(businessId || "");
  const deleteEmployeeMutation = useDeleteEmployeeMutation(businessId || "");

  const columns: MRT_ColumnDef<Worker & { id: string }>[] = [
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

  const editForm = useForm({
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
        notifications.show({
          title: "Thành công",
          message: "Đã thêm nhân viên thành công!",
          color: "green",
        });
      },
    });
  };

  const handleEditWorker = (values: typeof editForm.values) => {
    if (!editingEmployee) return;
    updateEmployeeMutation.mutate({
      employeeId: editingEmployee.id,
      employeeData: {
        worker_name: values.worker_name,
        birth_date: values.birth_date,
        gender: values.gender,
        insurance_status: values.insurance_status,
        fire_safety_training: values.fire_safety_training,
        food_safety_training: values.food_safety_training,
      },
    });
    setEditModalOpened(false);
    editForm.reset();
    setEditingEmployee(null);
    notifications.show({
      title: "Thành công",
      message: "Đã cập nhật nhân viên thành công!",
      color: "green",
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

  // Export Excel helpers
  const exportRowsToExcel = (rows: any[], filename = "nhan-vien") => {
    if (!rows || rows.length === 0) return;
    const data = rows.map((row) => row.original || row);
    const mapped = data.map(
      ({
        id,
        worker_name,
        birth_date,
        gender,
        insurance_status,
        fire_safety_training,
        food_safety_training,
        ...rest
      }) => ({
        ID: id,
        "Tên nhân viên": worker_name,
        "Ngày sinh":
          birth_date instanceof Date
            ? birth_date.toLocaleDateString()
            : birth_date,
        "Giới tính": gender === Gender.Male ? "Nam" : "Nữ",
        "Bảo hiểm": insurance_status ? "Đã đóng" : "Chưa đóng",
        "Đào tạo PCCC": fire_safety_training ? "Có" : "Không",
        "Đào tạo ATTP": food_safety_training ? "Có" : "Không",
        ...rest,
      })
    );
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
    const mapped = data.map(
      ({
        id,
        worker_name,
        birth_date,
        gender,
        insurance_status,
        fire_safety_training,
        food_safety_training,
        ...rest
      }) => ({
        ID: id,
        "Tên nhân viên": worker_name,
        "Ngày sinh":
          birth_date instanceof Date
            ? birth_date.toLocaleDateString()
            : birth_date,
        "Giới tính": gender === Gender.Male ? "Nam" : "Nữ",
        "Bảo hiểm": insurance_status ? "Đã đóng" : "Chưa đóng",
        "Đào tạo PCCC": fire_safety_training ? "Có" : "Không",
        "Đào tạo ATTP": food_safety_training ? "Có" : "Không",
        ...rest,
      })
    );
    const worksheet = XLSX.utils.json_to_sheet(mapped);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `nhan-vien.xlsx`);
  };

  // Action handlers
  const handleViewEmployee = (employee: Worker & { id: string }) => {
    notifications.show({
      title: "Thông tin nhân viên",
      message: `${employee.worker_name} - ${
        employee.gender === Gender.Male ? "Nam" : "Nữ"
      }`,
      color: "blue",
    });
  };

  const handleEditEmployee = (employee: Worker & { id: string }) => {
    setEditingEmployee(employee);
    editForm.setValues({
      worker_name: employee.worker_name,
      birth_date: employee.birth_date,
      gender: employee.gender,
      insurance_status: employee.insurance_status,
      fire_safety_training: employee.fire_safety_training,
      food_safety_training: employee.food_safety_training,
    });
    setEditModalOpened(true);
  };

  const handleDeleteEmployee = (employee: Worker & { id: string }) => {
    modals.openConfirmModal({
      title: "Xác nhận xóa nhân viên",
      children: (
        <Text>
          Bạn có chắc chắn muốn xóa nhân viên{" "}
          <strong>"{employee.worker_name}"</strong>?
        </Text>
      ),
      labels: { confirm: "Xóa", cancel: "Hủy" },
      confirmProps: { color: "red" },
      onConfirm: () => {
        deleteEmployeeMutation.mutate(employee.id);
        notifications.show({
          title: "Thành công",
          message: "Đã xóa nhân viên thành công!",
          color: "green",
        });
      },
    });
  };

  if (isLoading) {
    return (
      <Center style={{ height: "50vh" }}>
        <Loader size="lg" />
        <Text ml="md">Đang tải dữ liệu nhân viên...</Text>
      </Center>
    );
  }

  if (error) {
    return (
      <Alert icon={<IconEye size={16} />} title="Lỗi tải dữ liệu" color="red">
        <Text>Không thể tải dữ liệu nhân viên từ Firestore.</Text>
        <Text size="sm" mt="xs">
          Lỗi: {error?.message || "Unknown error"}
        </Text>
      </Alert>
    );
  }

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
                style: { paddingRight: 24, minWidth: 140, textAlign: "center" },
              }
            : {}
        }
        mantineTableHeadCellProps={({ column }) =>
          column.id === "mrt-row-actions"
            ? { style: { minWidth: 140, textAlign: "center" } }
            : {}
        }
        renderRowActions={({ row }) => (
          <Flex gap="md" justify="center">
            <Tooltip label="Xem thông tin">
              <ActionIcon
                color="green"
                variant="light"
                radius="md"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewEmployee(row.original as Worker & { id: string });
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
                  handleEditEmployee(row.original as Worker & { id: string });
                }}
              >
                <IconEdit size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Xóa nhân viên">
              <ActionIcon
                color="red"
                variant="light"
                radius="md"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteEmployee(row.original as Worker & { id: string });
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
              <Button leftSection={<IconPlus size={16} />} onClick={open}>
                Thêm nhân viên
              </Button>
              <Button
                leftSection={<IconDownload size={16} />}
                variant="light"
                onClick={() => exportAllToExcel(employees || [])}
              >
                Xuất tất cả dữ liệu (Excel)
              </Button>
              <Button
                leftSection={<IconDownload size={16} />}
                variant="light"
                onClick={() =>
                  exportRowsToExcel(
                    table.getPrePaginationRowModel().rows,
                    "nhan-vien-filter"
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
                    "nhan-vien-trang-hien-tai"
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
                    "nhan-vien-da-chon"
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
                    title: "Xác nhận xóa nhân viên",
                    children: (
                      <Text>
                        Bạn có chắc chắn muốn xóa {selected.length} nhân viên đã
                        chọn?
                      </Text>
                    ),
                    labels: { confirm: "Xóa tất cả", cancel: "Hủy" },
                    confirmProps: { color: "red" },
                    onConfirm: async () => {
                      for (const row of selected) {
                        await deleteEmployeeMutation.mutateAsync(
                          (row.original as Worker & { id: string }).id
                        );
                      }
                      // Clear table selection after bulk delete
                      table.setRowSelection({});
                      notifications.show({
                        title: "Thành công",
                        message: `Đã xóa ${selected.length} nhân viên thành công!`,
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

      {/* Edit Modal */}
      <Modal
        opened={editModalOpened}
        onClose={() => setEditModalOpened(false)}
        title="Sửa nhân viên"
        centered
      >
        <form onSubmit={editForm.onSubmit(handleEditWorker)}>
          <TextInput
            label="Tên nhân viên"
            {...editForm.getInputProps("worker_name")}
            mb="sm"
            required
          />
          <DateInput
            label="Ngày sinh"
            {...editForm.getInputProps("birth_date")}
            mb="sm"
            required
          />
          <Select
            label="Giới tính"
            data={[
              { value: Gender.Male.toString(), label: "Nam" },
              { value: Gender.Female.toString(), label: "Nữ" },
            ]}
            value={editForm.values.gender.toString()}
            onChange={(val) =>
              editForm.setFieldValue(
                "gender",
                val === "1" ? Gender.Male : Gender.Female
              )
            }
            mb="sm"
            required
          />
          <Select
            label="Bảo hiểm"
            {...editForm.getInputProps("insurance_status")}
            data={[
              { value: "true", label: "Có" },
              { value: "false", label: "Không" },
            ]}
            mb="sm"
            required
          />
          <Select
            label="Đào tạo PCCC"
            {...editForm.getInputProps("fire_safety_training")}
            data={[
              { value: "true", label: "Có" },
              { value: "false", label: "Không" },
            ]}
            mb="sm"
            required
          />
          <Select
            label="Đào tạo ATTP"
            {...editForm.getInputProps("food_safety_training")}
            data={[
              { value: "true", label: "Có" },
              { value: "false", label: "Không" },
            ]}
            mb="sm"
            required
          />
          <Group justify="right">
            <Button type="submit" loading={updateEmployeeMutation.isPending}>
              Cập nhật
            </Button>
            <Button onClick={() => setEditModalOpened(false)} variant="outline">
              Hủy
            </Button>
          </Group>
        </form>
      </Modal>
    </Box>
  );
}

export default Employees;
