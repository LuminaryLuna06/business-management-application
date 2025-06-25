import { useMemo } from "react";
import { Box, Text } from "@mantine/core";
import { MantineReactTable, type MRT_ColumnDef } from "mantine-react-table";
import industryData from "../../data/industry.json";

export default function IndustryPage() {
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

  return (
    <Box p="md">
      <Text size="xl" fw={700} mb="md">
        Danh mục ngành nghề
      </Text>
      <MantineReactTable
        columns={columns}
        data={industryData}
        enableColumnFilters
        enableGlobalFilter
        enablePagination
        initialState={{ pagination: { pageSize: 20, pageIndex: 0 } }}
        mantineTableProps={{ striped: true, highlightOnHover: true }}
        mantineTableContainerProps={{ style: { maxHeight: "70vh" } }}
      />
    </Box>
  );
}
