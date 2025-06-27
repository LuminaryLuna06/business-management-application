import { useState } from "react";
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
} from "@mantine/core";
import { MantineReactTable, type MRT_ColumnDef } from "mantine-react-table";
import { useForm, yupResolver } from "@mantine/form";
import * as Yup from "yup";
import industryData from "../../data/industry.json";
import { v4 as uuidv4 } from "uuid";
import { type SubLicense } from "../../types/licenses";
import {
  useGetAllSubLicenses,
  useAddSubLicenseMutation,
} from "../../tanstack/useLicenseQueries";
import { MRT_Localization_VI } from "mantine-react-table/locales/vi/index.cjs";
import { IconDownload } from "@tabler/icons-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const INDUSTRY_OPTIONS = industryData.map((item: any) => ({
  value: item.code,
  label: item.name,
}));

// Thêm schema Yup cho validate
const schema = Yup.object().shape({
  name: Yup.string().required("Tên giấy phép không được để trống"),
  issuing_authority: Yup.string().required("Cơ quan cấp không được để trống"),
  industries: Yup.array().of(Yup.string()).min(1, "Chọn ít nhất 1 ngành nghề"),
});

export default function LicensePage() {
  const [opened, setOpened] = useState(false);
  const { data, isLoading, isError, error } = useGetAllSubLicenses();
  const addMutation = useAddSubLicenseMutation();

  const form = useForm({
    initialValues: {
      name: "",
      issuing_authority: "",
      industries: [] as string[],
    },
    validate: yupResolver(schema),
  });

  const columns: MRT_ColumnDef<SubLicense>[] = [
    { accessorKey: "id", header: "ID" },
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
        data: INDUSTRY_OPTIONS,
      },
      Cell: ({ cell }) =>
        cell
          .getValue<string[]>()
          .map((code) => INDUSTRY_OPTIONS.find((i) => i.value === code)?.label)
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
          .map(
            (code: string) =>
              INDUSTRY_OPTIONS.find((i) => i.value === code)?.label
          )
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
          .map(
            (code: string) =>
              INDUSTRY_OPTIONS.find((i) => i.value === code)?.label
          )
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

  const handleAdd = (values: typeof form.values) => {
    addMutation.mutate({
      id: uuidv4(),
      name: values.name,
      issuing_authority: values.issuing_authority,
      industries: values.industries,
    });
    form.reset();
    setOpened(false);
  };

  return (
    <Box p="md">
      <Text size="xl" fw={700} mb="xs">
        Danh mục giấy phép con
      </Text>
      {isLoading ? (
        <Center my="lg">
          <Loader />
        </Center>
      ) : isError ? (
        <Text color="red">
          Lỗi: {error?.message || "Không tải được dữ liệu"}
        </Text>
      ) : (
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
                  Xuất hàng được chọn
                </Button>
                <Button onClick={() => setOpened(true)}>
                  Thêm giấy phép con
                </Button>
              </Box>
            );
          }}
        />
      )}
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Thêm giấy phép con"
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
            data={INDUSTRY_OPTIONS}
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
    </Box>
  );
}
