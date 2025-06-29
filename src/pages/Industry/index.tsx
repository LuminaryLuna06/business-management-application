import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Text,
  ActionIcon,
  Tooltip,
  Flex,
  Modal,
  TextInput,
  Switch,
  Group,
  Alert,
  Center,
  Loader,
} from "@mantine/core";
import {
  MantineReactTable,
  type MRT_ColumnDef,
  type MRT_Row,
} from "mantine-react-table";
import { MRT_Localization_VI } from "mantine-react-table/locales/vi/index.cjs";
import {
  IconDownload,
  IconEdit,
  IconTrash,
  IconPlus,
  IconEye,
} from "@tabler/icons-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { notifications } from "@mantine/notifications";
import {
  useGetAllIndustries,
  useAddIndustry,
  useUpdateIndustry,
  useDeleteIndustry,
} from "../../tanstack/useIndustryQueries";
import type { Industry } from "../../types/industry";
import { modals } from "@mantine/modals";

export default function IndustryPage() {
  const { data: industries, isLoading, isError, error } = useGetAllIndustries();
  const addIndustryMutation = useAddIndustry();
  const updateIndustryMutation = useUpdateIndustry();
  const deleteIndustryMutation = useDeleteIndustry();

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<(Industry & { id?: string }) | null>(
    null
  );
  const [form, setForm] = useState<Industry>({
    code: "",
    name: "",
    conditional: false,
  });

  // Mở modal thêm mới
  const openAddModal = () => {
    setEditData(null);
    setForm({ code: "", name: "", conditional: false });
    setModalOpen(true);
  };
  // Mở modal sửa
  const openEditModal = (row: MRT_Row<any>) => {
    setEditData(row.original);
    setForm({
      code: row.original.code,
      name: row.original.name,
      conditional: row.original.conditional,
    });
    setModalOpen(true);
  };
  // Đóng modal
  const closeModal = () => {
    setModalOpen(false);
    setEditData(null);
    setForm({ code: "", name: "", conditional: false });
  };

  // Xử lý submit form
  const handleSubmit = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      notifications.show({
        color: "red",
        message: "Vui lòng nhập đầy đủ thông tin!",
      });
      return;
    }
    try {
      if (editData && editData.id) {
        await updateIndustryMutation.mutateAsync({
          id: editData.id,
          data: form,
        });
        notifications.show({
          color: "green",
          message: "Cập nhật ngành nghề thành công!",
        });
      } else {
        await addIndustryMutation.mutateAsync(form);
        notifications.show({
          color: "green",
          message: "Thêm ngành nghề thành công!",
        });
      }
      closeModal();
    } catch (err: any) {
      notifications.show({
        color: "red",
        message: err.message || "Có lỗi xảy ra!",
      });
    }
  };

  // Xử lý xóa
  const handleDelete = async (row: MRT_Row<any>) => {
    if (!window.confirm(`Xác nhận xóa ngành nghề "${row.original.name}"?`))
      return;
    try {
      await deleteIndustryMutation.mutateAsync(row.original.id);
      notifications.show({ color: "green", message: "Đã xóa ngành nghề!" });
    } catch (err: any) {
      notifications.show({
        color: "red",
        message: err.message || "Có lỗi xảy ra!",
      });
    }
  };

  const columns = useMemo<MRT_ColumnDef<any>[]>(
    () => [
      { accessorKey: "code", header: "Mã ngành", size: 80 },
      { accessorKey: "name", header: "Tên ngành", size: 400 },
      {
        accessorKey: "conditional",
        header: "Có điều kiện?",
        size: 120,
        Cell: ({ cell }) => (cell.getValue() ? "Có" : "Không"),
      },
    ],
    []
  );

  // Export Excel helpers
  const exportRowsToExcel = (rows: any[], filename = "nganh-nghe") => {
    if (!rows || rows.length === 0) return;
    const data = rows.map((row) => row.original || row);
    const mapped = data.map(({ code, name, conditional, ...rest }) => ({
      "Mã ngành": code,
      "Ngành nghề": name,
      "Có điều kiện": conditional ? "Có" : "Không",
      ...rest,
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
    const mapped = data.map(({ code, name, conditional, ...rest }) => ({
      "Mã ngành": code,
      "Ngành nghề": name,
      "Có điều kiện": conditional ? "Có" : "Không",
      ...rest,
    }));
    const worksheet = XLSX.utils.json_to_sheet(mapped);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `nganh-nghe.xlsx`);
  };

  if (isLoading) {
    return (
      <Center style={{ height: "50vh" }}>
        <Loader size="lg" />
        <Text ml="md">Đang tải dữ liệu ngành nghề...</Text>
      </Center>
    );
  }

  if (isError) {
    return (
      <Alert icon={<IconEye size={16} />} title="Lỗi tải dữ liệu" color="red">
        <Text>Không thể tải dữ liệu ngành nghề từ Firestore.</Text>
        <Text size="sm" mt="xs">
          Lỗi: {error?.message || "Unknown error"}
        </Text>
      </Alert>
    );
  }

  return (
    <Box p="md">
      <Text size="xl" fw={700} mb="md">
        Danh mục ngành nghề
      </Text>
      <MantineReactTable
        columns={columns}
        data={industries || []}
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
        localization={MRT_Localization_VI}
        enableColumnPinning
        enableRowActions
        positionActionsColumn="last"
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
                style: { paddingRight: 24, minWidth: 100, textAlign: "center" },
              }
            : {}
        }
        mantineTableHeadCellProps={({ column }) =>
          column.id === "mrt-row-actions"
            ? { style: { minWidth: 100, textAlign: "center" } }
            : {}
        }
        renderRowActions={({ row }) => (
          <Flex gap="md" justify="center">
            <Tooltip label="Sửa">
              <ActionIcon
                color="blue"
                variant="light"
                radius="md"
                onClick={() => openEditModal(row)}
              >
                <IconEdit size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Xóa">
              <ActionIcon
                color="red"
                variant="light"
                radius="md"
                onClick={() => handleDelete(row)}
              >
                <IconTrash size={18} />
              </ActionIcon>
            </Tooltip>
          </Flex>
        )}
        renderTopToolbarCustomActions={({ table }) => {
          const hasSelected = table.getSelectedRowModel().rows.length > 0;
          const selectedRows = table.getSelectedRowModel().rows;
          const handleBulkDelete = async () => {
            if (selectedRows.length === 0) return;
            modals.openConfirmModal({
              title: "Xác nhận xóa nhiều ngành nghề",
              children: (
                <Box>
                  <Text mb="md">
                    Bạn có chắc chắn muốn xóa{" "}
                    <strong>{selectedRows.length} ngành nghề</strong> đã chọn?
                  </Text>
                  <Text size="sm" color="dimmed" mb="md">
                    Hành động này không thể hoàn tác. Tất cả dữ liệu liên quan
                    sẽ bị xóa vĩnh viễn.
                  </Text>
                  <Box style={{ maxHeight: 200, overflowY: "auto" }}>
                    {selectedRows.map((row, idx) => (
                      <Text key={idx} size="sm" color="dimmed">
                        • {row.original.name} ({row.original.code})
                      </Text>
                    ))}
                  </Box>
                </Box>
              ),
              labels: {
                confirm: `Xóa ${selectedRows.length} ngành nghề`,
                cancel: "Hủy",
              },
              confirmProps: { color: "red" },
              onConfirm: async () => {
                try {
                  for (const row of selectedRows) {
                    await deleteIndustryMutation.mutateAsync(row.original.id);
                  }
                  notifications.show({
                    color: "green",
                    message: `Đã xóa ${selectedRows.length} ngành nghề!`,
                  });
                  table.setRowSelection({});
                } catch (err: any) {
                  notifications.show({
                    color: "red",
                    message: err.message || "Có lỗi xảy ra!",
                  });
                }
              },
            });
          };
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
                onClick={openAddModal}
              >
                Thêm ngành nghề
              </Button>
              <Button
                leftSection={<IconDownload size={16} />}
                variant="light"
                onClick={() => exportAllToExcel(industries || [])}
              >
                Xuất tất cả dữ liệu (Excel)
              </Button>
              <Button
                leftSection={<IconDownload size={16} />}
                variant="light"
                onClick={() =>
                  exportRowsToExcel(
                    table.getPrePaginationRowModel().rows,
                    "nganh-nghe-filter"
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
                    "nganh-nghe-trang-hien-tai"
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
                    "nganh-nghe-da-chon"
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
                onClick={handleBulkDelete}
                disabled={!hasSelected}
              >
                Xóa ngành nghề đã chọn ({selectedRows.length})
              </Button>
            </Box>
          );
        }}
      />
      {/* Modal thêm/sửa ngành nghề */}
      <Modal
        opened={modalOpen}
        onClose={closeModal}
        title={editData ? "Sửa ngành nghề" : "Thêm ngành nghề"}
        centered
      >
        <TextInput
          label="Mã ngành"
          value={form.code}
          onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
          required
          mb="sm"
        />
        <TextInput
          label="Tên ngành"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
          mb="sm"
        />
        <Group align="center" mb="md">
          <Switch
            label="Ngành có điều kiện"
            checked={form.conditional}
            onChange={(e) =>
              setForm((f) => ({ ...f, conditional: e.currentTarget.checked }))
            }
          />
        </Group>
        <Group justify="flex-end">
          <Button onClick={handleSubmit}>
            {editData ? "Cập nhật" : "Thêm mới"}
          </Button>
          <Button variant="light" color="gray" onClick={closeModal}>
            Hủy
          </Button>
        </Group>
      </Modal>
    </Box>
  );
}
