import {
  Card,
  Group,
  Title,
  SimpleGrid,
  Box,
  Divider,
  Select,
  Text,
  Center,
  Loader,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { LineChart, BarChart } from "@mantine/charts";
import { MantineReactTable, type MRT_ColumnDef } from "mantine-react-table";
import { useMemo } from "react";
import { violationTypeLabels } from "../../types/violationTypeLabels";
import tree from "../../data/tree.json";
import { ViolationTypeEnum } from "../../types/schedule";
import { useAllViolationsQuery } from "../../tanstack/useInspectionQueries";
import { useForm } from "@mantine/form";
import { useGetAllBusinesses } from "../../tanstack/useBusinessQueries";
import { useGetAllIndustries } from "../../tanstack/useIndustryQueries";

// Lấy danh sách phường/xã của Hà Nội
const hanoi = Array.isArray(tree)
  ? tree.find((t: any) => t.name === "Hà Nội")
  : null;
const wardOptions =
  hanoi && Array.isArray(hanoi.wards)
    ? hanoi.wards.map((w: any) => ({ value: w.name, label: w.name }))
    : [];

const violationColumns: MRT_ColumnDef<any>[] = [
  {
    accessorKey: "type",
    header: "Loại vi phạm",
    Cell: ({ cell }) =>
      String(
        violationTypeLabels[cell.getValue() as ViolationTypeEnum] ||
          cell.getValue()
      ),
  },
  { accessorKey: "count", header: "Số lần vi phạm" },
  {
    accessorKey: "fixed",
    header: "Số lần khắc phục",
  },
  {
    accessorKey: "fixRate",
    header: "Tỉ lệ khắc phục (%)",
    Cell: ({ row }) =>
      Number(((row.original.fixed / row.original.count) * 100).toFixed(1)),
  },
];

// Custom Tooltip cho Recharts sử dụng Mantine UI

function Report() {
  // Bộ lọc
  const form = useForm({
    initialValues: {
      from: null as Date | null,
      to: null as Date | null,
      industry: null as string | null,
      area: null as string | null,
    },
  });

  const {
    data: violations,
    isLoading: violationsLoading,
    isError: violationsError,
    error: violationsErrorObj,
  } = useAllViolationsQuery();
  const {
    data: businesses,
    isLoading: businessesLoading,
    isError: businessesError,
    error: businessesErrorObj,
  } = useGetAllBusinesses();
  const {
    data: industries,
    isLoading: industriesLoading,
    isError: industriesError,
    error: industriesErrorObj,
  } = useGetAllIndustries();
  const industryOptions = useMemo(
    () => (industries || []).map((i) => ({ value: i.code, label: i.name })),
    [industries]
  );

  // Tính toán top 5 loại vi phạm nhiều nhất (không filter)
  const mostViolated = useMemo(() => {
    if (!violations) return [];
    const stats: Record<string, { count: number; fixed: number }> = {};
    violations.forEach((v) => {
      const type = v.violation_type;
      if (!stats[type]) stats[type] = { count: 0, fixed: 0 };
      stats[type].count += 1;
      if (v.fix_status === "fixed") stats[type].fixed += 1;
    });
    return Object.entries(stats)
      .map(([type, { count, fixed }]) => ({ type, count, fixed }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [violations]);

  // Tính toán top 5 loại vi phạm khắc phục tốt nhất (không filter)
  const bestFixed = useMemo(() => {
    if (!violations) return [];
    const stats: Record<string, { count: number; fixed: number }> = {};
    violations.forEach((v) => {
      const type = v.violation_type;
      if (!stats[type]) stats[type] = { count: 0, fixed: 0 };
      stats[type].count += 1;
      if (v.fix_status === "fixed") stats[type].fixed += 1;
    });
    return Object.entries(stats)
      .filter(([_, { count }]) => count > 0)
      .map(([type, { count, fixed }]) => ({
        type,
        count,
        fixed,
        fixRate: count > 0 ? (fixed / count) * 100 : 0,
      }))
      .sort((a, b) => b.fixRate - a.fixRate || b.count - a.count)
      .slice(0, 5);
  }, [violations]);

  // Ghép violation với business để lấy ward, industry
  const violationWithBusiness = useMemo(() => {
    if (!violations || !businesses) return [];
    const result = violations.map((v) => {
      const b = businesses.find((bus) => bus.business_id === v.business_id);
      let issueDate = v.issue_date;
      if (
        issueDate &&
        typeof issueDate === "object" &&
        typeof issueDate.toDate === "function"
      ) {
        issueDate = issueDate.toDate();
      }
      return {
        ...v,
        issue_date: issueDate,
        ward: b?.ward || null,
        industry: b?.industry || null,
      };
    });
    return result;
  }, [violations, businesses]);

  // Lọc và group dữ liệu cho LineChart
  const filteredTrends = useMemo(() => {
    if (!violationWithBusiness.length) return [];
    // Lọc theo form
    let filtered = violationWithBusiness.filter((v) => {
      // Đảm bảo issue_date hợp lệ
      const d = new Date(v.issue_date);
      return !isNaN(d.getTime());
    });
    if (form.values.area) {
      filtered = filtered.filter((v) => v.ward === form.values.area);
    }
    if (form.values.industry) {
      filtered = filtered.filter((v) => v.industry === form.values.industry);
    }
    // Lọc theo thời gian chỉ khi cả from và to đều có
    if (form.values.from && form.values.to) {
      filtered = filtered.filter((v) => {
        const d = new Date(v.issue_date);
        return d >= form.values.from! && d <= form.values.to!;
      });
    }
    // Group theo tháng
    const stats: Record<
      string,
      { date: string; count: number; fixed: number }
    > = {};
    filtered.forEach((v) => {
      const d = new Date(v.issue_date);
      if (isNaN(d.getTime())) return; // Bỏ qua nếu không hợp lệ
      const month = d.toISOString().slice(0, 7); // YYYY-MM
      if (!stats[month]) stats[month] = { date: month, count: 0, fixed: 0 };
      stats[month].count += 1;
      if (v.fix_status === "fixed") stats[month].fixed += 1;
    });
    // Sắp xếp theo tháng tăng dần
    const result = Object.values(stats).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
    return result;
  }, [violationWithBusiness, form.values]);

  if (industriesLoading || businessesLoading || violationsLoading) {
    return (
      <Center style={{ height: "50vh" }}>
        <Loader size="lg" />
        <Text ml="md">Đang tải dữ liệu giấy phép con...</Text>
      </Center>
    );
  }
  if (industriesError || businessesError || violationsError) {
    return (
      <Text color="red">
        Lỗi tải dữ liệu báo cáo:{" "}
        {industriesErrorObj?.message ||
          businessesErrorObj?.message ||
          violationsErrorObj?.message ||
          "Không xác định"}
      </Text>
    );
  }

  return (
    <Box p="md">
      <Divider label="Thống kê loại vi phạm nhiều nhất" my="md" />
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <Card withBorder>
          <Title order={5} mb="sm">
            Top 5 loại vi phạm nhiều nhất
          </Title>
          <MantineReactTable
            columns={violationColumns}
            data={mostViolated.map((v) => ({
              ...v,
              fixRate: Number(((v.fixed / v.count) * 100).toFixed(1)),
            }))}
            enablePagination={false}
            enableSorting={false}
            enableColumnFilters={false}
            enableGlobalFilter={false}
            enableDensityToggle={false}
            enableTopToolbar={false}
            enableBottomToolbar={false}
            enableStickyHeader={false}
            mantineTableContainerProps={{ style: { maxHeight: 300 } }}
          />
        </Card>
        <Card withBorder>
          <Title order={5} mb="sm">
            Biểu đồ số lần vi phạm
          </Title>
          <BarChart
            h={300}
            data={mostViolated.map((v) => ({
              name: violationTypeLabels[v.type as ViolationTypeEnum],
              count: v.count,
            }))}
            dataKey="name"
            orientation="vertical"
            series={[
              { name: "count", color: "#fa5252", label: "Số lần vi phạm" },
            ]}
            gridAxis="x"
            tickLine="y"
            yAxisProps={{ width: 150 }}
          />
        </Card>
      </SimpleGrid>

      <Divider label="Thống kê loại vi phạm khắc phục tốt nhất" my="md" />
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <Card withBorder>
          <Title order={5} mb="sm">
            Top 5 loại vi phạm khắc phục tốt nhất
          </Title>
          <MantineReactTable
            columns={violationColumns}
            data={bestFixed.map((v) => ({
              ...v,
              fixRate: Number(((v.fixed / v.count) * 100).toFixed(1)),
            }))}
            enablePagination={false}
            enableSorting={false}
            enableColumnFilters={false}
            enableGlobalFilter={false}
            enableDensityToggle={false}
            enableTopToolbar={false}
            enableBottomToolbar={false}
            enableStickyHeader={false}
            mantineTableContainerProps={{ style: { maxHeight: 300 } }}
          />
        </Card>
        <Card withBorder>
          <Title order={5} mb="sm">
            Biểu đồ tỉ lệ khắc phục
          </Title>
          <BarChart
            h={220}
            data={bestFixed.map((v) => ({
              name: violationTypeLabels[v.type as ViolationTypeEnum],
              fixRate: Number(((v.fixed / v.count) * 100).toFixed(1)),
            }))}
            dataKey="name"
            orientation="vertical"
            series={[
              {
                name: "fixRate",
                color: "#40c057",
                label: "Tỉ lệ khắc phục (%)",
              },
            ]}
            gridAxis="x"
            tickLine="y"
            yAxisProps={{ width: 150 }}
          />
        </Card>{" "}
      </SimpleGrid>

      <Divider label="Diễn biến theo thời gian" my="md" />
      <Card withBorder mb="md">
        <Group>
          <DateInput
            label="Từ ngày"
            value={form.values.from}
            onChange={(value) => form.setFieldValue("from", value)}
            clearable
          />
          <DateInput
            label="Đến ngày"
            value={form.values.to}
            onChange={(value) => form.setFieldValue("to", value)}
            clearable
          />
          <Select
            label="Ngành nghề"
            data={industryOptions}
            value={form.values.industry}
            onChange={(value) => form.setFieldValue("industry", value)}
            clearable
            searchable
          />
          <Select
            label="Phường/Xã (Hà Nội)"
            data={wardOptions}
            value={form.values.area}
            onChange={(value) => form.setFieldValue("area", value)}
            clearable
            searchable
          />
        </Group>
      </Card>
      <Card withBorder>
        <Title order={5} mb="sm">
          Diễn biến số vi phạm và khắc phục theo thời gian
        </Title>
        <LineChart
          h={220}
          data={filteredTrends}
          dataKey="date"
          series={[
            { name: "count", color: "#fa5252", label: "Số vi phạm" },
            { name: "fixed", color: "#40c057", label: "Đã khắc phục" },
          ]}
        />
      </Card>
    </Box>
  );
}

export default Report;
