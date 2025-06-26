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
  Skeleton,
  Alert,
} from "@mantine/core";
import { BarChart, PieChart } from "@mantine/charts";
import {
  IconLicense,
  IconAlertTriangle,
  IconCheck,
  IconCalendar,
  IconAlertCircle,
  IconRefresh,
} from "@tabler/icons-react";
import { MantineReactTable, type MRT_ColumnDef } from "mantine-react-table";
import { useParams } from "react-router";
import { useBusinessSubLicenses } from "../../../../tanstack/useLicenseQueries";
import {
  useInspectionSchedules,
  useViolationDecisions,
} from "../../../../tanstack/useInspectionQueries";
import { useMemo } from "react";
import { MRT_Localization_VI } from "mantine-react-table/locales/vi/index.cjs";

const violationColumns: MRT_ColumnDef<any>[] = [
  {
    accessorKey: "issue_date",
    header: "Ngày",
    Cell: ({ cell }): React.ReactNode => {
      const value = cell.getValue();
      if (value) {
        return new Date(value as string | number | Date).toLocaleDateString(
          "vi-VN"
        );
      }
      return "-";
    },
  },
  { accessorKey: "violation_number", header: "Số vi phạm" },
  {
    accessorKey: "violation_status",
    header: "Trạng thái",
    filterVariant: "select",
    mantineFilterSelectProps: {
      data: [
        { value: "pending", label: "Chờ xử lý" },
        { value: "paid", label: "Đã thanh toán" },
        { value: "dismissed", label: "Đã hủy" },
      ],
    },
    Cell: ({ cell }): React.ReactNode => {
      const status = cell.getValue() as string;
      switch (status) {
        case "pending":
          return "Chờ xử lý";
        case "paid":
          return "Đã thanh toán";
        case "dismissed":
          return "Đã hủy";
        default:
          return status;
      }
    },
  },
  {
    accessorKey: "fix_status",
    header: "Khắc phục",
    filterVariant: "select",
    mantineFilterSelectProps: {
      data: [
        { value: "not_fixed", label: "Chưa khắc phục" },
        { value: "fixed", label: "Đã khắc phục" },
        { value: "in_progress", label: "Đang khắc phục" },
      ],
    },
    Cell: ({ cell }): React.ReactNode => {
      const status = cell.getValue() as string;
      switch (status) {
        case "not_fixed":
          return "Chưa khắc phục";
        case "fixed":
          return "Đã khắc phục";
        case "in_progress":
          return "Đang khắc phục";
        default:
          return status;
      }
    },
  },
];

function DashboardPage() {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";
  const { businessId } = useParams();

  // Badge variant
  const badgeVariant = isDark ? "filled" : "light";

  // Lấy dữ liệu giấy phép con
  const {
    data: licenses,
    isLoading: isLoadingLicenses,
    error: licensesError,
    isError: isLicensesError,
    refetch: refetchLicenses,
  } = useBusinessSubLicenses(businessId || "");

  // Lấy dữ liệu lịch kiểm tra
  const {
    data: inspections,
    isLoading: isLoadingInspections,
    error: inspectionsError,
    isError: isInspectionsError,
    refetch: refetchInspections,
  } = useInspectionSchedules(businessId || "");

  // Lấy dữ liệu vi phạm
  const {
    data: violations,
    isLoading: isLoadingViolations,
    error: violationsError,
    isError: isViolationsError,
    refetch: refetchViolations,
  } = useViolationDecisions(businessId || "");

  // Tính toán thống kê giấy phép con
  const licenseStats = useMemo(() => {
    if (!licenses) return { valid: 0, expiring: 0, expired: 0, total: 0 };

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    let valid = 0;
    let expiring = 0;
    let expired = 0;

    licenses.forEach((license) => {
      const expirationDate = new Date(license.expiration_date);

      if (expirationDate > now) {
        if (expirationDate <= thirtyDaysFromNow) {
          expiring++;
        } else {
          valid++;
        }
      } else {
        expired++;
      }
    });

    return {
      valid,
      expiring,
      expired,
      total: licenses.length,
    };
  }, [licenses]);

  // Tính toán thống kê lịch kiểm tra
  const inspectionStats = useMemo(() => {
    if (!inspections)
      return { total: 0, completed: 0, pending: 0, cancelled: 0 };

    const currentYear = new Date().getFullYear();
    const yearInspections = inspections.filter((inspection) => {
      const inspectionDate = new Date(inspection.inspection_date);
      return inspectionDate.getFullYear() === currentYear;
    });

    let completed = 0;
    let pending = 0;
    let cancelled = 0;

    yearInspections.forEach((inspection) => {
      switch (inspection.inspector_status) {
        case "completed":
          completed++;
          break;
        case "pending":
          pending++;
          break;
        case "cancelled":
          cancelled++;
          break;
      }
    });

    return {
      total: yearInspections.length,
      completed,
      pending,
      cancelled,
    };
  }, [inspections]);

  // Tính toán thống kê vi phạm
  const violationStats = useMemo(() => {
    if (!violations) return { total: 0, handled: 0, unhandled: 0, fixRate: 0 };

    let handled = 0;
    let unhandled = 0;
    let fixed = 0;

    violations.forEach((violation) => {
      if (
        violation.violation_status === "paid" ||
        violation.violation_status === "dismissed"
      ) {
        handled++;
      } else {
        unhandled++;
      }

      if (violation.fix_status === "fixed") {
        fixed++;
      }
    });

    const fixRate =
      violations.length > 0 ? (fixed / violations.length) * 100 : 0;

    return {
      total: violations.length,
      handled,
      unhandled,
      fixRate: Math.round(fixRate * 10) / 10, // Làm tròn 1 chữ số thập phân
    };
  }, [violations]);

  // Tính toán dữ liệu lịch kiểm tra theo tháng
  const inspectionsPerMonth = useMemo(() => {
    if (!inspections) {
      // Trả về dữ liệu rỗng cho 12 tháng nếu không có dữ liệu
      return Array.from({ length: 12 }, (_, i) => ({
        month: (i + 1).toString(),
        count: 0,
      }));
    }

    const currentYear = new Date().getFullYear();
    const monthCounts = new Array(12).fill(0);

    inspections.forEach((inspection) => {
      const inspectionDate = new Date(inspection.inspection_date);
      if (inspectionDate.getFullYear() === currentYear) {
        const month = inspectionDate.getMonth(); // 0-11
        monthCounts[month]++;
      }
    });

    return monthCounts.map((count, index) => ({
      month: (index + 1).toString(),
      count,
    }));
  }, [inspections]);

  // Dữ liệu cho biểu đồ tròn
  const licenseStatusPie = useMemo(
    () => [
      { name: "Hợp lệ", value: licenseStats.valid, color: "green" },
      { name: "Sắp hết hạn", value: licenseStats.expiring, color: "yellow" },
      { name: "Đã hết hạn", value: licenseStats.expired, color: "red" },
    ],
    [licenseStats]
  );

  // Loading state
  if (isLoadingLicenses || isLoadingInspections || isLoadingViolations) {
    return (
      <Box p="md">
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md" mb="md">
          <Skeleton height={150} />
          <Skeleton height={150} />
          <Skeleton height={150} />
          <Skeleton height={150} />
        </SimpleGrid>
        <Divider my="md" />
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          <Skeleton height={300} />
          <Skeleton height={300} />
        </SimpleGrid>
      </Box>
    );
  }

  // Error state
  if (isLicensesError || isInspectionsError || isViolationsError) {
    const error = licensesError || inspectionsError || violationsError;
    return (
      <Box p="md">
        <Alert
          icon={<IconAlertCircle size={24} />}
          title="Lỗi khi tải dữ liệu"
          color="red"
          mb="md"
        >
          {error?.message || "Đã xảy ra lỗi không xác định."}
          <Group mt="md">
            {isLicensesError && (
              <Button
                leftSection={<IconRefresh size={16} />}
                onClick={() => refetchLicenses()}
                variant="light"
                color="red"
                size="xs"
              >
                Thử lại giấy phép
              </Button>
            )}
            {isInspectionsError && (
              <Button
                leftSection={<IconRefresh size={16} />}
                onClick={() => refetchInspections()}
                variant="light"
                color="red"
                size="xs"
              >
                Thử lại kiểm tra
              </Button>
            )}
            {isViolationsError && (
              <Button
                leftSection={<IconRefresh size={16} />}
                onClick={() => refetchViolations()}
                variant="light"
                color="red"
                size="xs"
              >
                Thử lại vi phạm
              </Button>
            )}
          </Group>
        </Alert>
      </Box>
    );
  }

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
              {licenseStats.total}
            </Text>
            <Text size="sm" c="dimmed" mb={4}>
              Tổng giấy phép con
            </Text>
            <Group gap={4}>
              <Badge color="green" size="sm" variant={badgeVariant}>
                Hợp lệ: {licenseStats.valid}
              </Badge>
              <Badge color="yellow" size="sm" variant={badgeVariant}>
                Sắp hết hạn: {licenseStats.expiring}
              </Badge>
              <Badge color="red" size="sm" variant={badgeVariant}>
                Đã hết hạn: {licenseStats.expired}
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
              {inspectionStats.total}
            </Text>
            <Text size="sm" c="dimmed" mb={4}>
              Lượt kiểm tra trong năm
            </Text>
            <Group gap={4}>
              <Badge color="green" size="sm" variant={badgeVariant}>
                Hoàn thành: {inspectionStats.completed}
              </Badge>
              <Badge color="yellow" size="sm" variant={badgeVariant}>
                Chờ kiểm tra: {inspectionStats.pending}
              </Badge>
              <Badge color="red" size="sm" variant={badgeVariant}>
                Đã hủy: {inspectionStats.cancelled}
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
              {violationStats.total}
            </Text>
            <Text size="sm" c="dimmed" mb={4}>
              Số vi phạm
            </Text>
            <Group gap={4}>
              <Badge color="green" size="sm" variant={badgeVariant}>
                Đã xử lý: {violationStats.handled}
              </Badge>
              <Badge color="red" size="sm" variant={badgeVariant}>
                Chưa xử lý: {violationStats.unhandled}
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
              {violationStats.fixRate}%
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
            Lượt kiểm tra theo tháng ({new Date().getFullYear()})
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
        </Group>
        <MantineReactTable
          columns={violationColumns}
          data={violations || []}
          enablePagination
          enableSorting
          enableDensityToggle={false}
          enableTopToolbar
          columnFilterDisplayMode={"popover"}
          enableColumnFilters
          enableGlobalFilter
          enableStickyHeader
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
        />
      </Card>
    </Box>
  );
}

export default DashboardPage;
