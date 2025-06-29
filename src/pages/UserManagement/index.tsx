import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Badge,
  Loader,
  Center,
  Text,
  Alert,
  Modal,
  Group,
  TextInput,
  PasswordInput,
  Select,
  ActionIcon,
  Tooltip,
  Flex,
} from "@mantine/core";
import { MantineReactTable, type MRT_ColumnDef } from "mantine-react-table";
import {
  IconDownload,
  IconPlus,
  IconAlertCircle,
  IconEye,
  IconEdit,
  IconTrash,
} from "@tabler/icons-react";
import { MRT_Localization_VI } from "mantine-react-table/locales/vi/index.cjs";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import type { StaffUser, UserRole } from "../../types/user";
import {
  useUsersQuery,
  useAddUserWithAuthMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} from "../../tanstack/useUserQueries";
import { useForm, yupResolver } from "@mantine/form";
import * as Yup from "yup";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";

const userSchema = Yup.object().shape({
  name: Yup.string().required("Họ tên không được để trống"),
  email: Yup.string()
    .email("Email không hợp lệ")
    .required("Email không được để trống"),
  password: Yup.string()
    .min(6, "Mật khẩu ít nhất 6 ký tự")
    .required("Mật khẩu không được để trống"),
  phone: Yup.string().nullable(),
  role: Yup.string().oneOf(["admin", "staff"]).required("Chọn vai trò"),
});

const editUserSchema = Yup.object().shape({
  name: Yup.string().required("Họ tên không được để trống"),
  phone: Yup.string().nullable(),
  role: Yup.string().oneOf(["admin", "staff"]).required("Chọn vai trò"),
  isActive: Yup.string()
    .oneOf(["active", "inactive"])
    .required("Chọn trạng thái"),
});

export default function UserManagementPage() {
  const { data: users, isLoading, isError, error } = useUsersQuery();
  const [modalOpened, setModalOpened] = useState(false);

  const addUserMutation = useAddUserWithAuthMutation({
    onSuccess: () => {
      setModalOpened(false);
      form.reset();
      notifications.show({
        title: "Thành công",
        message: "Đã thêm cán bộ mới thành công!",
        color: "green",
      });
    },
  });

  const form = useForm({
    initialValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
      role: "staff",
    },
    validate: yupResolver(userSchema),
  });

  const handleAddUser = (values: typeof form.values) => {
    addUserMutation.mutate({
      name: values.name,
      email: values.email,
      password: values.password,
      phone: values.phone,
      role: values.role,
    });
  };

  const columns = useMemo<MRT_ColumnDef<StaffUser>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Họ tên",
        size: 200,
      },
      {
        accessorKey: "email",
        header: "Email",
        size: 220,
      },
      {
        accessorKey: "phone",
        header: "Số điện thoại",
        size: 140,
      },
      {
        accessorKey: "role",
        header: "Vai trò",
        size: 120,
        filterVariant: "multi-select",
        mantineFilterMultiSelectProps: {
          data: [
            { value: "admin", label: "Quản trị viên" },
            { value: "staff", label: "Cán bộ" },
          ],
        },
        Cell: ({ cell }) => (
          <Badge color={cell.getValue() === "admin" ? "blue" : "gray"}>
            {cell.getValue() === "admin" ? "Quản trị viên" : "Cán bộ"}
          </Badge>
        ),
      },
      {
        accessorKey: "isActive",
        header: "Trạng thái",
        size: 120,
        filterVariant: "multi-select",
        mantineFilterMultiSelectProps: {
          data: [
            { value: "active", label: "Hoạt động" },
            { value: "inactive", label: "Khóa" },
          ],
        },
        Cell: ({ cell }) => {
          const value = cell.getValue<boolean>();
          return (
            <Badge color={value ? "green" : "red"}>
              {value ? "Hoạt động" : "Khóa"}
            </Badge>
          );
        },
        filterFn: (row, id, filterValue) => {
          const isActive = row.getValue<boolean>(id);
          if (!filterValue?.length) return true;
          return filterValue.includes(isActive ? "active" : "inactive");
        },
      },
      {
        accessorKey: "createdAt",
        header: "Ngày tạo",
        size: 140,
        filterVariant: "date-range",
        sortingFn: "datetime",
        Cell: ({ cell }) =>
          new Date(cell.getValue<string>()).toLocaleDateString(),
      },
    ],
    []
  );

  // Export Excel helpers
  const exportRowsToExcel = (rows: any[], filename = "can-bo") => {
    if (!rows || rows.length === 0) return;
    const data = rows.map((row) => row.original || row);
    const mapped = data.map(
      ({
        uid,
        name,
        email,
        phone,
        role,
        isActive,
        createdAt,
        ...rest
      }: StaffUser) => ({
        ID: uid,
        "Họ tên": name,
        Email: email,
        "Số điện thoại": phone,
        "Vai trò": role === "admin" ? "Quản trị viên" : "Cán bộ",
        "Trạng thái": isActive ? "Hoạt động" : "Khóa",
        "Ngày tạo": new Date(createdAt).toLocaleDateString(),
        ...rest,
      })
    );
    const worksheet = XLSX.utils.json_to_sheet(mapped);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "StaffUsers");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `${filename}.xlsx`);
  };

  const updateUserMutation = useUpdateUserMutation({
    onSuccess: () => {
      setEditModalOpened(false);
      editForm.reset();
      notifications.show({
        title: "Thành công",
        message: "Đã cập nhật thông tin cán bộ thành công!",
        color: "green",
      });
    },
  });

  const deleteUserMutation = useDeleteUserMutation({
    onSuccess: () => {
      setEditModalOpened(false);
      editForm.reset();
      notifications.show({
        title: "Thành công",
        message: "Đã xóa cán bộ thành công!",
        color: "green",
      });
    },
  });

  const [editModalOpened, setEditModalOpened] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);
  const editForm = useForm({
    initialValues: {
      uid: "",
      name: "",
      phone: "",
      role: "staff" as UserRole,
      isActive: "active",
    },
    validate: yupResolver(editUserSchema),
  });

  const openEditModal = (user: StaffUser) => {
    setEditingUser(user);
    editForm.setValues({
      uid: user.uid,
      name: user.name,
      phone: user.phone || "",
      role: user.role,
      isActive: user.isActive ? "active" : "inactive",
    });
    setEditModalOpened(true);
  };

  const handleEditUser = (values: typeof editForm.values) => {
    updateUserMutation.mutate({
      uid: values.uid,
      data: {
        name: values.name,
        phone: values.phone,
        role: values.role as UserRole,
        isActive: values.isActive === "active",
      },
    });
  };

  const handleDeleteUser = (uid: string) => {
    modals.openConfirmModal({
      title: "Xác nhận xóa cán bộ",
      children: <Text>Bạn có chắc chắn muốn xóa cán bộ này?</Text>,
      labels: { confirm: "Xóa", cancel: "Hủy" },
      confirmProps: { color: "red" },
      onConfirm: () => {
        deleteUserMutation.mutate(uid);
        notifications.show({
          title: "Thành công",
          message: "Đã xóa cán bộ thành công!",
          color: "green",
        });
      },
    });
  };

  // Action handlers for row actions
  const handleViewUser = (user: StaffUser) => {
    notifications.show({
      title: "Thông tin cán bộ",
      message: `${user.name} - ${user.email}`,
      color: "blue",
    });
  };

  const handleEditUserAction = (user: StaffUser) => {
    openEditModal(user);
  };

  const handleDeleteUserAction = (user: StaffUser) => {
    handleDeleteUser(user.uid);
  };

  if (isLoading) {
    return (
      <Center style={{ height: "50vh" }}>
        <Loader size="lg" />
        <Text ml="md">Đang tải dữ liệu cán bộ...</Text>
      </Center>
    );
  }

  if (isError) {
    return (
      <Alert
        icon={<IconAlertCircle size={16} />}
        title="Lỗi tải dữ liệu"
        color="red"
      >
        <Text>Không thể tải dữ liệu cán bộ từ Firestore.</Text>
        <Text size="sm" mt="xs">
          Lỗi: {error?.message || "Unknown error"}
        </Text>
      </Alert>
    );
  }

  return (
    <Box p="md">
      <Text size="xl" fw={700} mb="xs">
        Quản lý cán bộ vận hành phần mềm
      </Text>
      <MantineReactTable
        columns={columns}
        data={users || []}
        enablePagination
        enableSorting
        enableDensityToggle={false}
        enableTopToolbar
        columnFilterDisplayMode="popover"
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
                  handleViewUser(row.original);
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
                  handleEditUserAction(row.original);
                }}
              >
                <IconEdit size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Xóa cán bộ">
              <ActionIcon
                color="red"
                variant="light"
                radius="md"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteUserAction(row.original);
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
            <Box style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={() => setModalOpened(true)}
              >
                Thêm cán bộ
              </Button>
              <Button
                leftSection={<IconDownload size={16} />}
                variant="light"
                onClick={() => exportRowsToExcel(users || [], "can-bo-tat-ca")}
              >
                Xuất tất cả dữ liệu (Excel)
              </Button>
              <Button
                leftSection={<IconDownload size={16} />}
                variant="light"
                onClick={() =>
                  exportRowsToExcel(
                    table.getPrePaginationRowModel().rows,
                    "can-bo-filter"
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
                    "can-bo-trang-hien-tai"
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
                    "can-bo-da-chon"
                  )
                }
                disabled={!hasSelected}
              >
                Xuất hàng được chọn (Excel)
              </Button>
              <Button
                color="red"
                variant="light"
                disabled={
                  !hasSelected || deleteUserMutation.status === "pending"
                }
                onClick={() => {
                  const selected = table.getSelectedRowModel().rows;
                  if (!selected.length) return;
                  modals.openConfirmModal({
                    title: "Xác nhận xóa cán bộ",
                    children: (
                      <Text>
                        Bạn có chắc chắn muốn xóa tất cả cán bộ đã chọn?
                      </Text>
                    ),
                    labels: { confirm: "Xóa tất cả", cancel: "Hủy" },
                    confirmProps: { color: "red" },
                    onConfirm: async () => {
                      for (const row of selected) {
                        await deleteUserMutation.mutateAsync(row.original.uid);
                      }
                      // Clear table selection after bulk delete
                      table.setRowSelection({});
                      notifications.show({
                        title: "Thành công",
                        message: `Đã xóa ${selected.length} cán bộ thành công!`,
                        color: "green",
                      });
                    },
                  });
                }}
              >
                Xóa các hàng đã chọn
              </Button>
            </Box>
          );
        }}
      />
      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title="Thêm cán bộ mới"
        centered
      >
        <form onSubmit={form.onSubmit(handleAddUser)}>
          <TextInput
            label="Họ tên"
            placeholder="Nhập họ tên"
            {...form.getInputProps("name")}
            required
            mb="sm"
          />
          <TextInput
            label="Email"
            placeholder="Nhập email"
            {...form.getInputProps("email")}
            required
            mb="sm"
          />
          <PasswordInput
            label="Mật khẩu"
            placeholder="Nhập mật khẩu"
            {...form.getInputProps("password")}
            required
            mb="sm"
          />
          <TextInput
            label="Số điện thoại"
            placeholder="Nhập số điện thoại"
            {...form.getInputProps("phone")}
            mb="sm"
          />
          <Select
            label="Vai trò"
            data={[
              { value: "admin", label: "Quản trị viên" },
              { value: "staff", label: "Cán bộ" },
            ]}
            {...form.getInputProps("role")}
            required
            mb="sm"
          />
          <Group justify="end" mt="md">
            <Button
              type="submit"
              loading={addUserMutation.status === "pending"}
            >
              Thêm cán bộ
            </Button>
          </Group>
          {addUserMutation.isError && (
            <Text color="red" mt="sm">
              {addUserMutation.error?.message ||
                "Có lỗi xảy ra khi thêm cán bộ"}
            </Text>
          )}
        </form>
      </Modal>
      <Modal
        opened={editModalOpened}
        onClose={() => setEditModalOpened(false)}
        title="Sửa thông tin cán bộ"
        centered
      >
        <form onSubmit={editForm.onSubmit(handleEditUser)}>
          <TextInput
            label="Họ tên"
            placeholder="Nhập họ tên"
            {...editForm.getInputProps("name")}
            required
            mb="sm"
          />
          <TextInput
            label="Email"
            value={editingUser?.email || ""}
            disabled
            mb="sm"
          />
          <TextInput
            label="Số điện thoại"
            placeholder="Nhập số điện thoại"
            {...editForm.getInputProps("phone")}
            mb="sm"
          />
          <Select
            label="Vai trò"
            data={[
              { value: "admin", label: "Quản trị viên" },
              { value: "staff", label: "Cán bộ" },
            ]}
            {...editForm.getInputProps("role")}
            required
            mb="sm"
          />
          <Select
            label="Trạng thái"
            data={[
              { value: "active", label: "Hoạt động" },
              { value: "inactive", label: "Khóa" },
            ]}
            {...editForm.getInputProps("isActive")}
            required
            mb="sm"
          />
          <Group justify="space-between" mt="md">
            <Button
              color="red"
              variant="light"
              onClick={() => handleDeleteUser(editForm.values.uid)}
              loading={deleteUserMutation.status === "pending"}
            >
              Xóa cán bộ
            </Button>
            <Button
              type="submit"
              loading={updateUserMutation.status === "pending"}
            >
              Lưu thay đổi
            </Button>
          </Group>
          {(updateUserMutation.isError || deleteUserMutation.isError) && (
            <Text color="red" mt="sm">
              {updateUserMutation.error?.message ||
                deleteUserMutation.error?.message ||
                "Có lỗi xảy ra"}
            </Text>
          )}
        </form>
      </Modal>
    </Box>
  );
}
