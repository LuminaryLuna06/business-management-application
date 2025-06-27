import {
  Box,
  SimpleGrid,
  Card,
  Text,
  Progress,
  Paper,
  Badge,
} from "@mantine/core";
import { BarChart, DonutChart } from "@mantine/charts";
import { MantineReactTable, type MRT_ColumnDef } from "mantine-react-table";
import { MRT_Localization_VI } from "mantine-react-table/locales/vi/index.cjs";
import { IconAlertCircle, IconCircleCheck } from "@tabler/icons-react";
import {
  useViolationStatsQuery,
  useUpcomingInspectionsQuery,
} from "../../tanstack/useDashboardQueries";
import { useGetAllBusinesses } from "../../tanstack/useBusinessQueries";
import industries from "../../data/industry.json";
import { useNavigate } from "react-router-dom";

const inspectionColumns: MRT_ColumnDef<any>[] = [
  {
    accessorKey: "inspection_date",
    header: "Ngày",
    Cell: ({ cell }) => {
      const value = cell.getValue();
      if (value && typeof value === "object" && "seconds" in value) {
        return new Date(
          Number((value as any).seconds) * 1000
        ).toLocaleDateString("vi-VN");
      }
      if (value instanceof Date) {
        return value.toLocaleDateString("vi-VN");
      }
      return value ? String(value) : "-";
    },
  },
  {
    accessorKey: "inspector_description",
    header: "Mô tả",
  },
  {
    accessorKey: "inspector_status",
    header: "Trạng thái",
    Cell: ({ cell }) => {
      const status = String(cell.getValue());
      let color = "gray";
      let label = status;
      if (status === "pending") {
        color = "yellow";
        label = "Chờ kiểm tra";
      } else if (status === "completed") {
        color = "green";
        label = "Đã hoàn thành";
      } else if (status === "cancelled") {
        color = "red";
        label = "Đã hủy";
      }
      return <Badge color={color}>{label}</Badge>;
    },
  },
];

// Map id loại hình sang tên loại hình
const businessTypeMap: Record<string | number, string> = {
  1: "Hộ kinh doanh",
  2: "Công ty TNHH",
  3: "Công ty Cổ phần",
  Khác: "Khác",
};

function getTypeChartData(businesses: any[]) {
  const typeMap: Record<
    string,
    { name: string; value: number; color: string }
  > = {};
  const colors = [
    "#228be6",
    "#40c057",
    "#fab005",
    "#e8590c",
    "#ae3ec9",
    "#12b886",
    "#f59f00",
  ];
  let colorIdx = 0;
  for (const b of businesses) {
    const typeId = b.business_type || "Khác";
    const type = businessTypeMap[typeId] || "Khác";
    if (!typeMap[type]) {
      typeMap[type] = {
        name: type,
        value: 0,
        color: colors[colorIdx % colors.length],
      };
      colorIdx++;
    }
    typeMap[type].value++;
  }
  return Object.values(typeMap);
}

// Hàm group theo ngành nghề
function getIndustryChartData(businesses: any[]) {
  // Tạo map code -> name từ industry.json
  const industryMap = Object.fromEntries(
    industries.map((item: { code: string; name: string }) => [
      item.code,
      item.name,
    ])
  );
  const result: Record<string, { industry: string; value: number }> = {};
  for (const b of businesses) {
    let codes: string[] = [];
    if (Array.isArray(b.industry)) {
      codes = b.industry;
    } else if (typeof b.industry === "string") {
      codes = [b.industry];
    }
    if (codes.length === 0) {
      codes = ["Khác"];
    }
    for (const code of codes) {
      const name = industryMap[code] || "Khác";
      if (!result[name]) {
        result[name] = { industry: name, value: 0 };
      }
      result[name].value++;
    }
  }
  return Object.values(result).sort((a, b) => b.value - a.value);
}

export default function Dashboard() {
  const navigate = useNavigate();

  // Gọi dữ liệu thực
  const {
    data: violationStats,
    isLoading: isLoadingStats,
    isError: isErrorStats,
    error: errorStats,
  } = useViolationStatsQuery();
  const {
    data: upcomingInspections,
    isLoading: isLoadingIns,
    isError: isErrorIns,
    error: errorIns,
  } = useUpcomingInspectionsQuery(20);

  // Gọi dữ liệu doanh nghiệp thực
  const {
    data: businesses,
    isLoading: isLoadingBiz,
    isError: isErrorBiz,
    error: errorBiz,
  } = useGetAllBusinesses();

  // Loading/error cho các stat chính
  if (isLoadingStats || isLoadingIns || isLoadingBiz) {
    return (
      <Box p="md">
        <Text>Đang tải dữ liệu thống kê...</Text>
      </Box>
    );
  }
  if (isErrorStats || isErrorIns || isErrorBiz) {
    return (
      <Box p="md">
        <Text color="red">
          Lỗi tải dữ liệu:{" "}
          {errorStats?.message || errorIns?.message || errorBiz?.message}
        </Text>
      </Box>
    );
  }

  // ... giữ nguyên chartByType, chartByIndustry (mock) ...
  const stats = {
    totalViolations: violationStats?.total ?? 0,
    fixRate:
      violationStats && violationStats.total > 0
        ? Math.round((violationStats.fixed / violationStats.total) * 100)
        : 0,
  };

  const chartByType = getTypeChartData(businesses || []);
  const chartByIndustry = getIndustryChartData(businesses || []);

  return (
    <Box p="md">
      <Text size="xl" fw={700} mb="md">
        Thống kê tổng quan
      </Text>
      <Card mb="md">
        <Text fw={600} mb="xs">
          Số lượng DN/HKD theo ngành nghề
        </Text>
        <BarChart
          h={500}
          data={chartByIndustry}
          dataKey="industry"
          withLegend={false}
          withTooltip
          series={[{ name: "value", color: "#228be6", label: "Số lượng" }]}
          orientation="horizontal"
        />
      </Card>
      <Paper mb="md" p="md" withBorder>
        <SimpleGrid cols={{ base: 1, md: 1, lg: 3 }} spacing="xl">
          <Box
            style={{
              minWidth: 220,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text fw={600} mb="xs">
              Số lượng DN/HKD theo loại hình
            </Text>
            <DonutChart
              data={chartByType}
              paddingAngle={10}
              withLabels
              withLabelsLine
              labelsType="value"
              style={{ maxWidth: 220, margin: "0 auto" }}
            />
          </Box>
          <Card
            shadow="sm"
            p="md"
            style={{
              minWidth: 140,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <IconAlertCircle
              size={36}
              color="#fa5252"
              style={{ marginBottom: 8 }}
            />
            <Text size="lg" fw={700} ta="center">
              {stats.totalViolations}
            </Text>
            <Text size="sm" c="dimmed" ta="center">
              Tổng số vi phạm
            </Text>
          </Card>
          <Card
            shadow="sm"
            p="md"
            style={{
              minWidth: 140,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <IconCircleCheck
              size={36}
              color="#40c057"
              style={{ marginBottom: 8 }}
            />
            <Text size="lg" fw={700} ta="center">
              {stats.fixRate}%
            </Text>
            <Text size="sm" c="dimmed" ta="center">
              Tỷ lệ khắc phục
            </Text>
            <Progress
              value={stats.fixRate}
              color="green"
              mt="xs"
              w="80%"
              mx="auto"
            />
          </Card>
        </SimpleGrid>
      </Paper>

      <Card>
        <Text fw={600} mb="xs">
          Lịch kiểm tra sắp tới
        </Text>
        <MantineReactTable
          columns={inspectionColumns}
          data={upcomingInspections || []}
          enableSorting
          enableDensityToggle={false}
          enableTopToolbar
          columnFilterDisplayMode="popover"
          enableColumnFilters
          enableGlobalFilter
          enableStickyHeader
          enableRowSelection
          enableSelectAll
          initialState={{
            pagination: { pageSize: 10, pageIndex: 0 },
            density: "xs",
          }}
          localization={MRT_Localization_VI}
          mantineTableProps={{
            striped: true,
            withTableBorder: true,
            highlightOnHover: true,
            withColumnBorders: true,
          }}
          mantineTableContainerProps={{
            style: { maxHeight: "50vh" },
          }}
          mantineTableBodyRowProps={({ row }) => ({
            style: { cursor: "pointer" },
            onClick: () => {
              const businessId = row.original.business_id;
              if (businessId) navigate(`/business/${businessId}`);
            },
          })}
        />
      </Card>
    </Box>
  );
}
