import { useState, useMemo } from "react";
import {
  Box,
  Text,
  Button,
  Modal,
  Group,
  TextInput,
  MultiSelect,
  Loader,
  Center,
  ActionIcon,
  Tooltip,
  Flex,
  Alert,
} from "@mantine/core";
import { MantineReactTable, type MRT_ColumnDef } from "mantine-react-table";
import { useForm, yupResolver } from "@mantine/form";
import * as Yup from "yup";
import { type SubLicense } from "../../types/licenses";
import {
  useGetAllSubLicenses,
  useAddSubLicenseMutation,
  useUpdateSubLicenseMutation,
  useDeleteSubLicenseMutation,
} from "../../tanstack/useLicenseQueries";
import { MRT_Localization_VI } from "mantine-react-table/locales/vi/index.cjs";
import {
  IconDownload,
  IconEdit,
  IconTrash,
  IconEye,
  IconPlus,
} from "@tabler/icons-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";
import { useGetAllIndustries } from "../../tanstack/useIndustryQueries";

// Thêm schema Yup cho validate
const schema = Yup.object().shape({
  name: Yup.string().required("Tên giấy phép không được để trống"),
  issuing_authority: Yup.string().required("Cơ quan cấp không được để trống"),
  industries: Yup.array().of(Yup.string()).min(1, "Chọn ít nhất 1 ngành nghề"),
});

export default function LicensePage() {
  const [opened, setOpened] = useState(false);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [editingLicense, setEditingLicense] = useState<SubLicense | null>(null);
  const { data, isLoading, isError, error } = useGetAllSubLicenses();
  const addMutation = useAddSubLicenseMutation();
  const updateMutation = useUpdateSubLicenseMutation();
  const deleteMutation = useDeleteSubLicenseMutation();
  const { data: industries } = useGetAllIndustries();
  const industryOptions = useMemo(
    () => (industries || []).map((i) => ({ value: i.code, label: i.name })),
    [industries]
  );
  const getIndustryName = (code: string) => {
    const found = (industries || []).find((i) => i.code === code);
    return found ? found.name : code;
  };

  const form = useForm({
    initialValues: {
      name: "",
      issuing_authority: "",
      industries: [] as string[],
    },
    validate: yupResolver(schema),
  });

  const editForm = useForm({
    initialValues: {
      name: "",
      issuing_authority: "",
      industries: [] as string[],
    },
    validate: yupResolver(schema),
  });

  // Action handlers
  const handleViewLicense = (license: SubLicense) => {
    notifications.show({
      title: "Thông tin giấy phép",
      message: `${license.name} - ${license.issuing_authority}`,
      color: "blue",
    });
  };

  const handleEditLicense = (license: SubLicense) => {
    setEditingLicense(license);
    editForm.setValues({
      name: license.name,
      issuing_authority: license.issuing_authority,
      industries: license.industries,
    });
    setEditModalOpened(true);
  };

  const handleDeleteLicense = (license: SubLicense) => {
    modals.openConfirmModal({
      title: "Xác nhận xóa giấy phép",
      children: (
        <Text>
          Bạn có chắc chắn muốn xóa giấy phép <strong>"{license.name}"</strong>?
        </Text>
      ),
      labels: { confirm: "Xóa", cancel: "Hủy" },
      confirmProps: { color: "red" },
      onConfirm: () => {
        deleteMutation.mutate(license.id);
      },
    });
  };

  const handleAdd = (values: typeof form.values) => {
    addMutation.mutate({
      name: values.name,
      issuing_authority: values.issuing_authority,
      industries: values.industries,
    });
    form.reset();
    setOpened(false);
    notifications.show({
      title: "Thành công",
      message: "Đã thêm giấy phép con thành công!",
      color: "green",
    });
  };

  const handleEdit = (values: typeof editForm.values) => {
    if (!editingLicense) return;
    updateMutation.mutate({
      licenseId: editingLicense.id,
      licenseData: {
        name: values.name,
        issuing_authority: values.issuing_authority,
        industries: values.industries,
      },
    });
    setEditModalOpened(false);
    editForm.reset();
    setEditingLicense(null);
    notifications.show({
      title: "Thành công",
      message: "Đã cập nhật giấy phép con thành công!",
      color: "green",
    });
  };

  const columns: MRT_ColumnDef<SubLicense>[] = [
    {
      accessorKey: "name",
      header: "Tên giấy phép",
      filterVariant: "multi-select",
      mantineFilterMultiSelectProps: {
        data: Array.from(new Set((data || []).map((item) => item.name))).map(
          (name) => ({ value: name, label: name })
        ),
      },
    },
    { accessorKey: "issuing_authority", header: "Cơ quan cấp" },
    {
      accessorKey: "industries",
      header: "Ngành liên quan",
      filterVariant: "multi-select",
      mantineFilterMultiSelectProps: {
        data: industryOptions,
      },
      Cell: ({ cell }) =>
        cell
          .getValue<string[]>()
          .map((code) => getIndustryName(code))
          .filter(Boolean)
          .join(", ") || "",
    },
  ];

  // Export Excel helpers
  const exportRowsToExcel = (rows: any[], filename = "giay-phep-con") => {
    if (!rows || rows.length === 0) return;
    const data = rows.map((row) => row.original || row);
    const mapped = data.map(
      ({ id, name, issuing_authority, industries, ...rest }) => ({
        ID: id,
        "Tên giấy phép": name,
        "Cơ quan cấp": issuing_authority,
        "Ngành liên quan": (industries || [])
          .map((code: string) => getIndustryName(code))
          .filter(Boolean)
          .join(", "),
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
      ({ id, name, issuing_authority, industries, ...rest }) => ({
        ID: id,
        "Tên giấy phép": name,
        "Cơ quan cấp": issuing_authority,
        "Ngành liên quan": (industries || [])
          .map((code: string) => getIndustryName(code))
          .filter(Boolean)
          .join(", "),
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
    saveAs(blob, `giay-phep-con.xlsx`);
  };

  if (isLoading) {
    return (
      <Center style={{ height: "50vh" }}>
        <Loader size="lg" />
        <Text ml="md">Đang tải dữ liệu giấy phép con...</Text>
      </Center>
    );
  }

  if (isError) {
    return (
      <Alert icon={<IconEye size={16} />} title="Lỗi tải dữ liệu" color="red">
        <Text>Không thể tải dữ liệu giấy phép con từ Firestore.</Text>
        <Text size="sm" mt="xs">
          Lỗi: {error?.message || "Unknown error"}
        </Text>
      </Alert>
    );
  }

  return (
    <Box p="md">
      <Text size="xl" fw={700} mb="xs">
        Danh mục giấy phép con
      </Text>
      <MantineReactTable
        columns={columns}
        data={data || []}
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
                  handleViewLicense(row.original);
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
                  handleEditLicense(row.original);
                }}
              >
                <IconEdit size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Xóa giấy phép">
              <ActionIcon
                color="red"
                variant="light"
                radius="md"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteLicense(row.original);
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
                onClick={() => setOpened(true)}
              >
                Thêm giấy phép con
              </Button>
              <Button
                leftSection={<IconDownload size={16} />}
                variant="light"
                onClick={() => exportAllToExcel(data || [])}
              >
                Xuất tất cả dữ liệu (Excel)
              </Button>
              <Button
                leftSection={<IconDownload size={16} />}
                variant="light"
                onClick={() =>
                  exportRowsToExcel(
                    table.getPrePaginationRowModel().rows,
                    "giay-phep-con-filter"
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
                    "giay-phep-con-trang-hien-tai"
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
                    "giay-phep-con-da-chon"
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
                    title: "Xác nhận xóa giấy phép",
                    children: (
                      <Text>
                        Bạn có chắc chắn muốn xóa {selected.length} giấy phép đã
                        chọn?
                      </Text>
                    ),
                    labels: { confirm: "Xóa tất cả", cancel: "Hủy" },
                    confirmProps: { color: "red" },
                    onConfirm: async () => {
                      for (const row of selected) {
                        await deleteMutation.mutateAsync(row.original.id);
                      }
                      // Clear table selection after bulk delete
                      table.setRowSelection({});
                      notifications.show({
                        title: "Thành công",
                        message: `Đã xóa ${selected.length} giấy phép thành công!`,
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

      {/* Add Modal */}
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Thêm giấy phép con"
        centered
      >
        <form onSubmit={form.onSubmit(handleAdd)}>
          <TextInput
            label="Tên giấy phép"
            {...form.getInputProps("name")}
            mb="sm"
          />
          <TextInput
            label="Cơ quan cấp"
            {...form.getInputProps("issuing_authority")}
            mb="sm"
          />
          <MultiSelect
            label="Ngành liên quan"
            data={industryOptions}
            {...form.getInputProps("industries")}
            mb="sm"
            searchable
          />
          <Group mt="md" justify="flex-end">
            <Button type="submit" loading={addMutation.isPending}>
              Thêm
            </Button>
          </Group>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        opened={editModalOpened}
        onClose={() => setEditModalOpened(false)}
        title="Sửa giấy phép con"
        centered
      >
        <form onSubmit={editForm.onSubmit(handleEdit)}>
          <TextInput
            label="Tên giấy phép"
            {...editForm.getInputProps("name")}
            mb="sm"
          />
          <TextInput
            label="Cơ quan cấp"
            {...editForm.getInputProps("issuing_authority")}
            mb="sm"
          />
          <MultiSelect
            label="Ngành liên quan"
            data={industryOptions}
            {...editForm.getInputProps("industries")}
            mb="sm"
            searchable
          />
          <Group mt="md" justify="flex-end">
            <Button type="submit" loading={updateMutation.isPending}>
              Cập nhật
            </Button>
          </Group>
        </form>
      </Modal>
    </Box>
  );
}
