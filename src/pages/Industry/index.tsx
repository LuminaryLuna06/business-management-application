import { useMemo } from "react";
import { Box, Button, Text } from "@mantine/core";
import { MantineReactTable, type MRT_ColumnDef } from "mantine-react-table";
import industryData from "../../data/industry.json";
import { MRT_Localization_VI } from "mantine-react-table/locales/vi/index.cjs";
import { IconDownload } from "@tabler/icons-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
// import { useNavigate } from "react-router";

export default function IndustryPage() {
  // const navigate = useNavigate();

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

  return (
    <Box p="md">
      <Text size="xl" fw={700} mb="md">
        Danh mục ngành nghề
      </Text>
      <MantineReactTable
        columns={columns}
        data={industryData}
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
                onClick={() => exportAllToExcel(industryData)}
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
              {/* <Button onClick={() => navigate("/business/add")}>
                + Thêm doanh nghiệp
              </Button> */}
            </Box>
          );
        }}
      />
    </Box>
  );
}
