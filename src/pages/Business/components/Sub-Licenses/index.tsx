import {
  Box,
  Text,
  Button,
  Modal,
  Group,
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
import { TextInput, Select, FileInput } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import {
  useGetAllSubLicenses,
  useBusinessSubLicenses,
  useAddBusinessSublicenseMutation,
  useUpdateBusinessSubLicenseMutation,
  useDeleteBusinessSubLicenseMutation,
} from "../../../../tanstack/useLicenseQueries";
import { type License, type SubLicense } from "../../../../types/licenses";
import { useGetBusinessById } from "../../../../tanstack/useBusinessQueries";
import {
  IconDownload,
  IconEdit,
  IconTrash,
  IconEye,
  IconPlus,
  IconExternalLink,
} from "@tabler/icons-react";
import { MRT_Localization_VI } from "mantine-react-table/locales/vi/index.cjs";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";
import { useState } from "react";
import { uploadFileToDrive } from "../../../../googledrive/GoogleDriveUploader";

const schema = Yup.object().shape({
  license_id: Yup.string().required("Chọn giấy phép con"),
  license_number: Yup.string()
    .required("Số giấy phép không được để trống")
    .min(5, "Số giấy phép phải có ít nhất 5 ký tự"),
  issue_date: Yup.date()
    .required("Ngày cấp không được để trống")
    .max(new Date(), "Ngày cấp không được trong tương lai"),
  expiration_date: Yup.date()
    .required("Ngày hết hạn không được để trống")
    .min(Yup.ref("issue_date"), "Ngày hết hạn phải sau ngày cấp"),
});

function SubLicenses() {
  const { businessId } = useParams();
  const [opened, { open, close }] = useDisclosure(false);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [editingLicense, setEditingLicense] = useState<
    (License & { id: string }) | null
  >(null);
  const [uploading, setUploading] = useState(false);

  // Lấy giấy phép con của doanh nghiệp
  const {
    data: licenses,
    isLoading,
    isError,
    error,
  } = useBusinessSubLicenses(businessId || "");

  const { data: businessData } = useGetBusinessById(businessId || "");

  const businessIndustry = businessData && businessData.industry; // TODO: thay bằng businessData.industry thực tế

  // Lấy tất cả giấy phép con
  const { data: allSubLicenses } = useGetAllSubLicenses();
  const licenseOptions = allSubLicenses?.map((item) => ({
    value: item.id,
    label: item.name,
  }));

  // Lọc giấy phép con phù hợp ngành
  const filteredSubLicenses = (allSubLicenses || []).filter((gpc: SubLicense) =>
    gpc.industries.includes(businessIndustry as string)
  );

  // Chuẩn bị data cho Select
  const subLicenseSelectData = filteredSubLicenses.map((gpc) => ({
    value: gpc.id,
    label: gpc.name,
  }));

  const columns: MRT_ColumnDef<License & { id: string }>[] = [
    { accessorKey: "license_number", header: "Số giấy phép" },
    {
      accessorKey: "license_id",
      header: "Tên giấy phép",
      filterVariant: "multi-select",
      mantineFilterMultiSelectProps: {
        data: licenseOptions,
      },
      Cell: ({ cell }) => {
        const id = cell.getValue<string>();
        const found = (allSubLicenses || []).find((gpc) => gpc.id === id);
        return found ? found.name : id;
      },
    },
    {
      accessorKey: "issue_date",
      header: "Ngày cấp",
      Cell: ({ cell }) => cell.getValue<Date>()?.toLocaleDateString() || "",
    },
    {
      accessorKey: "expiration_date",
      header: "Ngày hết hạn",
      Cell: ({ cell }) => cell.getValue<Date>()?.toLocaleDateString() || "",
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      Cell: ({ row }) => {
        const expirationDate = row.original.expiration_date;
        const today = new Date();
        if (expirationDate < today) {
          return "Hết hạn";
        } else if (
          expirationDate.getTime() - today.getTime() <
          30 * 24 * 60 * 60 * 1000
        ) {
          return "Sắp hết hạn";
        } else {
          return "Còn hiệu lực";
        }
      },
    },
    {
      accessorKey: "file_link",
      header: "File URL",
      Cell: ({ cell }) => {
        const url = cell.getValue<string>();
        return url ? (
          <ActionIcon
            component="a"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            color="blue"
            variant="subtle"
            title="Mở file trong tab mới"
          >
            <IconExternalLink size={18} />
          </ActionIcon>
        ) : null;
      },
    },
  ];

  // Mutations
  const addMutation = useAddBusinessSublicenseMutation(businessId || "");
  const updateMutation = useUpdateBusinessSubLicenseMutation(businessId || "");
  const deleteMutation = useDeleteBusinessSubLicenseMutation(businessId || "");

  // Form với useForm và Yup
  const form = useForm({
    initialValues: {
      license_id: "",
      license_number: "",
      issue_date: new Date(),
      expiration_date: new Date(),
      file_link: "",
    },
    validate: yupResolver(schema),
  });

  const editForm = useForm({
    initialValues: {
      license_id: "",
      license_number: "",
      issue_date: new Date(),
      expiration_date: new Date(),
      file_link: "",
    },
    validate: yupResolver(schema),
  });

  // Action handlers
  const handleViewLicense = (license: License & { id: string }) => {
    const licenseName =
      (allSubLicenses || []).find((gpc) => gpc.id === license.license_id)
        ?.name || license.license_id;
    notifications.show({
      title: "Thông tin giấy phép",
      message: `${licenseName} - ${license.license_number}`,
      color: "blue",
    });
  };

  const handleEditLicense = (values: typeof editForm.values) => {
    if (!editingLicense) return;
    updateMutation.mutate({
      licenseId: editingLicense.id,
      licenseData: {
        license_id: values.license_id,
        license_number: values.license_number,
        issue_date: values.issue_date,
        expiration_date: values.expiration_date,
        file_link: values.file_link || "",
      },
    });
    setEditModalOpened(false);
    editForm.reset();
    setEditingLicense(null);
    notifications.show({
      title: "Thành công",
      message: "Đã cập nhật giấy phép thành công!",
      color: "green",
    });
  };

  const handleDeleteLicense = (license: License & { id: string }) => {
    const licenseName =
      (allSubLicenses || []).find((gpc) => gpc.id === license.license_id)
        ?.name || license.license_id;
    modals.openConfirmModal({
      title: "Xác nhận xóa giấy phép",
      children: (
        <Text>
          Bạn có chắc chắn muốn xóa giấy phép <strong>"{licenseName}"</strong>?
        </Text>
      ),
      labels: { confirm: "Xóa", cancel: "Hủy" },
      confirmProps: { color: "red" },
      onConfirm: () => {
        deleteMutation.mutate(license.id);
        notifications.show({
          title: "Thành công",
          message: "Đã xóa giấy phép thành công!",
          color: "green",
        });
      },
    });
  };

  const openEditModal = (license: License & { id: string }) => {
    setEditingLicense(license);
    editForm.setValues({
      license_id: license.license_id,
      license_number: license.license_number,
      issue_date: license.issue_date,
      expiration_date: license.expiration_date,
    });
    setEditModalOpened(true);
  };

  const handleAddLicense = (values: typeof form.values) => {
    addMutation.mutate({
      license_id: values.license_id,
      license_number: values.license_number,
      issue_date: values.issue_date,
      expiration_date: values.expiration_date,
      file_link: values.file_link as string,
    });
    form.reset();
    close();
    notifications.show({
      title: "Thành công",
      message: "Đã thêm giấy phép thành công!",
      color: "green",
    });
  };

  // Export Excel helpers
  const exportRowsToExcel = (rows: any[], filename = "giay-phep-con") => {
    if (!rows || rows.length === 0) return;
    const data = rows.map((row) => row.original || row);
    const mapped = data.map((row) => {
      const licenseName =
        (allSubLicenses || []).find((gpc) => gpc.id === row.license_id)?.name ||
        row.license_id;
      const today = new Date();
      let status = "";
      if (row.expiration_date < today) status = "Hết hạn";
      else if (
        row.expiration_date.getTime() - today.getTime() <
        30 * 24 * 60 * 60 * 1000
      )
        status = "Sắp hết hạn";
      else status = "Còn hiệu lực";
      return {
        "Số giấy phép": row.license_number,
        "Tên giấy phép": licenseName,
        "Ngày cấp":
          row.issue_date instanceof Date
            ? row.issue_date.toLocaleDateString("vi-VN")
            : row.issue_date,
        "Ngày hết hạn":
          row.expiration_date instanceof Date
            ? row.expiration_date.toLocaleDateString("vi-VN")
            : row.expiration_date,
        "Trạng thái": status,
      };
    });
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
    const mapped = data.map((row) => {
      const licenseName =
        (allSubLicenses || []).find((gpc) => gpc.id === row.license_id)?.name ||
        row.license_id;
      const today = new Date();
      let status = "";
      if (row.expiration_date < today) status = "Hết hạn";
      else if (
        row.expiration_date.getTime() - today.getTime() <
        30 * 24 * 60 * 60 * 1000
      )
        status = "Sắp hết hạn";
      else status = "Còn hiệu lực";
      return {
        "Số giấy phép": row.license_number,
        "Tên giấy phép": licenseName,
        "Ngày cấp":
          row.issue_date instanceof Date
            ? row.issue_date.toLocaleDateString("vi-VN")
            : row.issue_date,
        "Ngày hết hạn":
          row.expiration_date instanceof Date
            ? row.expiration_date.toLocaleDateString("vi-VN")
            : row.expiration_date,
        "Trạng thái": status,
      };
    });
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
        <Text ml="md">Đang tải dữ liệu giấy phép...</Text>
      </Center>
    );
  }

  if (isError) {
    return (
      <Alert icon={<IconEye size={16} />} title="Lỗi tải dữ liệu" color="red">
        <Text>Không thể tải dữ liệu giấy phép từ Firestore.</Text>
        <Text size="sm" mt="xs">
          Lỗi: {error?.message || "Unknown error"}
        </Text>
      </Alert>
    );
  }

  return (
    <Box p="md">
      <Text size="xl" fw={700} mb="xs">
        Danh Sách Giấy Phép Con
      </Text>
      <Text size="sm" color="dimmed" mb="md">
        Tổng số giấy phép con: {licenses ? licenses.length : 0}
      </Text>

      <MantineReactTable
        columns={columns}
        data={licenses || []}
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
                  openEditModal(row.original);
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
              <Button leftSection={<IconPlus size={16} />} onClick={open}>
                Thêm giấy phép
              </Button>
              <Button
                leftSection={<IconDownload size={16} />}
                variant="light"
                onClick={() => exportAllToExcel(licenses || [])}
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

      <Modal opened={opened} onClose={close} title="Thêm giấy phép">
        <form onSubmit={form.onSubmit(handleAddLicense)}>
          <Select
            label="Giấy phép con"
            data={subLicenseSelectData}
            {...form.getInputProps("license_id")}
            mb="sm"
            required
          />
          <TextInput
            label="Số giấy phép"
            {...form.getInputProps("license_number")}
            mb="sm"
            required
          />
          <DateInput
            label="Ngày cấp"
            {...form.getInputProps("issue_date")}
            mb="sm"
            required
          />
          <DateInput
            label="Ngày hết hạn"
            {...form.getInputProps("expiration_date")}
            mb="sm"
            required
          />
          <FileInput
            label="Tệp giấy phép (ảnh hoặc PDF)"
            accept="image/*,application/pdf"
            onChange={async (file) => {
              if (!file) return;
              setUploading(true);
              try {
                const folderId = localStorage.getItem("gdrive_folder_id");
                if (!folderId) {
                  notifications.show({
                    title: "Lỗi",
                    message:
                      "Chưa có folder Google Drive. Vui lòng nhập folder ID!",
                    color: "red",
                  });
                  setUploading(false);
                  return;
                }
                const link = await uploadFileToDrive({ file, folderId });
                form.setFieldValue("file_link", link);
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
                form.setFieldValue("file_link", "");
              } finally {
                setUploading(false);
              }
            }}
            mb="sm"
            disabled={uploading}
          />
          {uploading && (
            <Text size="sm" color="blue">
              Đang upload file...
            </Text>
          )}
          {form.values.file_link && (
            <Text size="sm" color="teal" style={{ wordBreak: "break-all" }}>
              Đã upload:{" "}
              <a
                href={form.values.file_link}
                target="_blank"
                rel="noopener noreferrer"
              >
                {form.values.file_link}
              </a>
            </Text>
          )}
          <Group mt="md" justify="flex-end">
            <Button type="submit" loading={addMutation.isPending}>
              Thêm
            </Button>
          </Group>
        </form>
      </Modal>

      <Modal
        opened={editModalOpened}
        onClose={() => {
          setEditModalOpened(false);
          setEditingLicense(null);
          editForm.reset();
        }}
        title="Sửa giấy phép"
      >
        <form onSubmit={editForm.onSubmit(handleEditLicense)}>
          <Select
            label="Giấy phép con"
            data={subLicenseSelectData}
            {...editForm.getInputProps("license_id")}
            mb="sm"
            required
          />
          <TextInput
            label="Số giấy phép"
            {...editForm.getInputProps("license_number")}
            mb="sm"
            required
          />
          <DateInput
            label="Ngày cấp"
            {...editForm.getInputProps("issue_date")}
            mb="sm"
            required
          />
          <DateInput
            label="Ngày hết hạn"
            {...editForm.getInputProps("expiration_date")}
            mb="sm"
            required
          />
          <FileInput
            label="Tệp giấy phép (ảnh hoặc PDF)"
            accept="image/*,application/pdf"
            onChange={async (file) => {
              if (!file) return;
              setUploading(true);
              try {
                const folderId = localStorage.getItem("gdrive_folder_id");
                if (!folderId) {
                  notifications.show({
                    title: "Lỗi",
                    message:
                      "Chưa có folder Google Drive. Vui lòng nhập folder ID!",
                    color: "red",
                  });
                  setUploading(false);
                  return;
                }
                const link = await uploadFileToDrive({ file, folderId });
                editForm.setFieldValue("file_link", link);
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
                editForm.setFieldValue("file_link", "");
              } finally {
                setUploading(false);
              }
            }}
            mb="sm"
            disabled={uploading}
          />
          {uploading && (
            <Text size="sm" color="blue">
              Đang upload file...
            </Text>
          )}
          {editForm.values.file_link && (
            <Text size="sm" color="teal" style={{ wordBreak: "break-all" }}>
              Đã upload:{" "}
              <a
                href={editForm.values.file_link}
                target="_blank"
                rel="noopener noreferrer"
              >
                {editForm.values.file_link}
              </a>
            </Text>
          )}
          <Group mt="md" justify="flex-end">
            <Button
              variant="outline"
              onClick={() => {
                setEditModalOpened(false);
                setEditingLicense(null);
                editForm.reset();
              }}
            >
              Hủy
            </Button>
            <Button type="submit" loading={updateMutation.isPending}>
              Cập nhật
            </Button>
          </Group>
        </form>
      </Modal>
    </Box>
  );
}

export default SubLicenses;
