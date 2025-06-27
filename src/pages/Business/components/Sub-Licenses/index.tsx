import { Box, Text, Button, Modal, Group } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useParams } from "react-router-dom";
import { MantineReactTable, type MRT_ColumnDef } from "mantine-react-table";
import { useForm, yupResolver } from "@mantine/form";
import * as Yup from "yup";
import { TextInput, Select } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import {
  useGetAllSubLicenses,
  useBusinessSubLicenses,
  useAddBusinessSublicenseMutation,
} from "../../../../tanstack/useLicenseQueries";
import { type License, type SubLicense } from "../../../../types/licenses";
import { useGetBusinessById } from "../../../../tanstack/useBusinessQueries";
import { IconDownload } from "@tabler/icons-react";
import { MRT_Localization_VI } from "mantine-react-table/locales/vi/index.cjs";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

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

  const columns: MRT_ColumnDef<License>[] = [
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
  ];

  // Form với useForm và Yup
  const form = useForm({
    initialValues: {
      license_id: "",
      license_number: "",
      issue_date: new Date(),
      expiration_date: new Date(),
    },
    validate: yupResolver(schema),
  });

  // Mutation thêm giấy phép con cho doanh nghiệp
  const addMutation = useAddBusinessSublicenseMutation(businessId || "");

  const handleAddLicense = (values: typeof form.values) => {
    addMutation.mutate({
      license_id: values.license_id,
      license_number: values.license_number,
      issue_date: values.issue_date,
      expiration_date: values.expiration_date,
    });
    form.reset();
    close();
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

  return (
    <Box p="md">
      <Text size="xl" fw={700} mb="xs">
        Danh Sách Giấy Phép Con
      </Text>
      <Text size="sm" color="dimmed" mb="md">
        Tổng số giấy phép con: {licenses ? licenses.length : 0}
      </Text>
      <Group mb="md">
        <Button onClick={open}>Thêm giấy phép</Button>
        <Button variant="outline">Import dữ liệu</Button>
      </Group>
      {isLoading ? (
        <Text>Đang tải dữ liệu...</Text>
      ) : isError ? (
        <Text color="red">
          Lỗi: {error?.message || "Không tải được dữ liệu"}
        </Text>
      ) : (
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
              </Box>
            );
          }}
        />
      )}

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
          <Group mt="md" justify="flex-end">
            <Button type="submit" loading={addMutation.isPending}>
              Thêm
            </Button>
          </Group>
        </form>
      </Modal>
    </Box>
  );
}

export default SubLicenses;
