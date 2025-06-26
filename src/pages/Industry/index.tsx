import { useMemo } from "react";
import { Box, Button, Text } from "@mantine/core";
import { MantineReactTable, type MRT_ColumnDef } from "mantine-react-table";
import industryData from "../../data/industry.json";
import { MRT_Localization_VI } from "mantine-react-table/locales/vi/index.cjs";
import { IconDownload } from "@tabler/icons-react";
import { mkConfig, generateCsv, download } from "export-to-csv";
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

  const csvConfig = mkConfig({
    fieldSeparator: ",",
    decimalSeparator: ".",
    useKeysAsHeaders: true,
    filename: "nganh-nghe",
  });

  // Export helpers
  const handleExportRows = (rows: any[], filename = "nganh-nghe") => {
    if (!rows || rows.length === 0) return;
    const mapped = rows.map((r) => r.original || r);
    const csv = generateCsv({ ...csvConfig, filename })(mapped);
    download({ ...csvConfig, filename })(csv);
  };

  const handleExportAll = (data: any[]) => {
    if (!data || data.length === 0) return;
    const csv = generateCsv(csvConfig)(data);
    download(csvConfig)(csv);
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
                onClick={() => handleExportAll(industryData)}
              >
                Xuất tất cả dữ liệu
              </Button>
              <Button
                leftSection={<IconDownload size={16} />}
                variant="light"
                onClick={() =>
                  handleExportRows(
                    table.getPrePaginationRowModel().rows,
                    "nganh-nghe-filter"
                  )
                }
                disabled={table.getPrePaginationRowModel().rows.length === 0}
              >
                Xuất tất cả hàng (theo filter)
              </Button>
              <Button
                leftSection={<IconDownload size={16} />}
                variant="light"
                onClick={() =>
                  handleExportRows(
                    table.getRowModel().rows,
                    "nganh-nghe-trang-hien-tai"
                  )
                }
                disabled={table.getRowModel().rows.length === 0}
              >
                Xuất các hàng trong trang
              </Button>
              <Button
                leftSection={<IconDownload size={16} />}
                variant="light"
                color="teal"
                onClick={() =>
                  handleExportRows(
                    table.getSelectedRowModel().rows,
                    "nganh-nghe-da-chon"
                  )
                }
                disabled={!hasSelected}
              >
                Xuất hàng được chọn
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
