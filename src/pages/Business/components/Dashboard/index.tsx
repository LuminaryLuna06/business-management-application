import {
  Card,
  Group,
  Stack,
  Title,
  Text,
  SimpleGrid,
  Box,
  Divider,
  Badge,
  Button,
  Avatar,
  Paper,
  useMantineColorScheme,
} from "@mantine/core";
import { BarChart, PieChart } from "@mantine/charts";
import {
  IconLicense,
  IconAlertTriangle,
  IconCheck,
  IconCalendar,
  IconFileTypePdf,
  IconFileTypeXls,
} from "@tabler/icons-react";
import { MantineReactTable, type MRT_ColumnDef } from "mantine-react-table";

// Mock stats
const stats = {
  licenses: { valid: 3, expiring: 1, expired: 1 },
  inspections: 12,
  violations: { handled: 2, unhandled: 1 },
  fixRate: 66.7, // %
};

// Mock chart data
const inspectionsPerMonth = [
  { month: "1", count: 1 },
  { month: "2", count: 2 },
  { month: "3", count: 1 },
  { month: "4", count: 2 },
  { month: "5", count: 1 },
  { month: "6", count: 2 },
  { month: "7", count: 1 },
  { month: "8", count: 1 },
  { month: "9", count: 1 },
  { month: "10", count: 0 },
  { month: "11", count: 1 },
  { month: "12", count: 0 },
];
const licenseStatusPie = [
  { name: "Hợp lệ", value: stats.licenses.valid, color: "green" },
  { name: "Sắp hết hạn", value: stats.licenses.expiring, color: "yellow" },
  { name: "Đã hết hạn", value: stats.licenses.expired, color: "red" },
];

// Mock violation history
const violationHistory = [
  {
    id: 1,
    object: "Cơ sở",
    date: "2024-03-10",
    content: "Không đảm bảo PCCC",
    status: "Đã xử lý",
    fix: "Đã khắc phục",
  },
  {
    id: 2,
    object: "Nhân viên",
    date: "2024-05-12",
    content: "Không đeo găng tay",
    status: "Chưa xử lý",
    fix: "Chưa khắc phục",
  },
  {
    id: 3,
    object: "Cơ sở",
    date: "2024-06-01",
    content: "Không có giấy phép ATTP",
    status: "Đã xử lý",
    fix: "Đã khắc phục",
  },
];

const violationColumns: MRT_ColumnDef<(typeof violationHistory)[0]>[] = [
  { accessorKey: "object", header: "Đối tượng" },
  { accessorKey: "date", header: "Ngày" },
  { accessorKey: "content", header: "Nội dung" },
  { accessorKey: "status", header: "Trạng thái" },
  { accessorKey: "fix", header: "Khắc phục" },
];

function DashboardPage() {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";
  // Badge variant
  const badgeVariant = isDark ? "filled" : "light";

  return (
    <Box p="md">
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md" mb="md">
        <Paper
          withBorder
          shadow="md"
          radius="lg"
          p="md"
          style={{
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "scale(1.03)";
            e.currentTarget.style.boxShadow =
              "0 8px 32px 0 rgba(33, 150, 243, 0.10)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "var(--mantine-shadow-md)";
          }}
        >
          <Stack align="center" gap={8}>
            <Avatar
              size={44}
              radius={44}
              color="blue"
              variant="gradient"
              gradient={{
                from: isDark ? "blue.7" : "blue",
                to: isDark ? "cyan.7" : "cyan",
                deg: 120,
              }}
            >
              <IconLicense size={28} />
            </Avatar>
            <Text fw={800} size="2rem">
              {stats.licenses.valid +
                stats.licenses.expiring +
                stats.licenses.expired}
            </Text>
            <Text size="sm" c="dimmed" mb={4}>
              Tổng giấy phép con
            </Text>
            <Group gap={4}>
              <Badge color="green" size="sm" variant={badgeVariant}>
                Hợp lệ: {stats.licenses.valid}
              </Badge>
              <Badge color="yellow" size="sm" variant={badgeVariant}>
                Sắp hết hạn: {stats.licenses.expiring}
              </Badge>
              <Badge color="red" size="sm" variant={badgeVariant}>
                Đã hết hạn: {stats.licenses.expired}
              </Badge>
            </Group>
          </Stack>
        </Paper>
        <Paper
          withBorder
          shadow="md"
          radius="lg"
          p="md"
          style={{
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "scale(1.03)";
            e.currentTarget.style.boxShadow =
              "0 8px 32px 0 rgba(34, 197, 94, 0.10)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "var(--mantine-shadow-md)";
          }}
        >
          <Stack align="center" gap={8}>
            <Avatar
              size={44}
              radius={44}
              color="teal"
              variant="gradient"
              gradient={{
                from: isDark ? "teal.7" : "teal",
                to: isDark ? "green.7" : "green",
                deg: 120,
              }}
            >
              <IconCalendar size={28} />
            </Avatar>
            <Text fw={800} size="2rem">
              {stats.inspections}
            </Text>
            <Text size="sm" c="dimmed">
              Lượt kiểm tra trong năm
            </Text>
          </Stack>
        </Paper>
        <Paper
          withBorder
          shadow="md"
          radius="lg"
          p="md"
          style={{
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "scale(1.03)";
            e.currentTarget.style.boxShadow =
              "0 8px 32px 0 rgba(255, 82, 82, 0.10)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "var(--mantine-shadow-md)";
          }}
        >
          <Stack align="center" gap={8}>
            <Avatar
              size={44}
              radius={44}
              color="red"
              variant="gradient"
              gradient={{
                from: isDark ? "red.7" : "red",
                to: isDark ? "pink.7" : "pink",
                deg: 120,
              }}
            >
              <IconAlertTriangle size={28} />
            </Avatar>
            <Text fw={800} size="2rem">
              {stats.violations.handled + stats.violations.unhandled}
            </Text>
            <Text size="sm" c="dimmed" mb={4}>
              Số vi phạm
            </Text>
            <Group gap={4}>
              <Badge color="green" size="sm" variant={badgeVariant}>
                Đã xử lý: {stats.violations.handled}
              </Badge>
              <Badge color="red" size="sm" variant={badgeVariant}>
                Chưa xử lý: {stats.violations.unhandled}
              </Badge>
            </Group>
          </Stack>
        </Paper>
        <Paper
          withBorder
          shadow="md"
          radius="lg"
          p="md"
          style={{
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "scale(1.03)";
            e.currentTarget.style.boxShadow =
              "0 8px 32px 0 rgba(18, 184, 134, 0.10)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "var(--mantine-shadow-md)";
          }}
        >
          <Stack align="center" gap={8}>
            <Avatar
              size={44}
              radius={44}
              color="cyan"
              variant="gradient"
              gradient={{
                from: isDark ? "cyan.7" : "cyan",
                to: isDark ? "blue.7" : "blue",
                deg: 120,
              }}
            >
              <IconCheck size={28} />
            </Avatar>
            <Text fw={800} size="2rem">
              {stats.fixRate}%
            </Text>
            <Text size="sm" c="dimmed">
              Tỷ lệ khắc phục vi phạm
            </Text>
          </Stack>
        </Paper>
      </SimpleGrid>

      <Divider my="md" />

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <Card withBorder>
          <Title order={4} mb="sm">
            Lượt kiểm tra theo tháng
          </Title>
          <BarChart
            h={220}
            data={inspectionsPerMonth}
            dataKey="month"
            series={[
              { name: "count", color: "#228be6", label: "Lượt kiểm tra" },
            ]}
            gridAxis="y"
            tickLine="y"
          />
        </Card>
        <Card withBorder>
          <Title order={4} mb="sm">
            Trạng thái giấy phép con
          </Title>
          <Text
            size="xs"
            c="dimmed"
            mb="xs"
            style={{ display: "flex", alignItems: "center", gap: 4 }}
          >
            <IconAlertTriangle size={14} style={{ marginRight: 4 }} />
            Hợp lệ: còn hạn. Sắp hết hạn: dưới 30 ngày. Đã hết hạn: giấy phép
            không còn hiệu lực.
          </Text>
          <PieChart h={220} data={licenseStatusPie} withLabels />
        </Card>
      </SimpleGrid>

      <Divider my="md" />
      <Card withBorder mb="md">
        <Group justify="space-between" mb="xs">
          <Title order={5}>Lịch sử vi phạm</Title>
          <Group>
            <Button
              leftSection={<IconFileTypeXls size={18} />}
              variant="light"
              size="xs"
            >
              Xuất Excel
            </Button>
            <Button
              leftSection={<IconFileTypePdf size={18} />}
              variant="light"
              size="xs"
              color="red"
            >
              Xuất PDF
            </Button>
          </Group>
        </Group>
        <MantineReactTable
          columns={violationColumns}
          data={violationHistory}
          enablePagination={true}
          enableColumnFilters={true}
          enableSorting={true}
          mantineTableBodyRowProps={{ style: { cursor: "default" } }}
          mantineTableContainerProps={{ style: { maxHeight: 500 } }}
        />
      </Card>
    </Box>
  );
}

export default DashboardPage;
