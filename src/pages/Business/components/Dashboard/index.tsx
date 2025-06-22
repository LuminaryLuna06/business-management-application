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
  Grid,
  Paper,
  useMantineColorScheme,
  Loader,
  Center,
  Alert,
  Skeleton,
} from "@mantine/core";
import { BarChart, PieChart } from "@mantine/charts";
import {
  IconBuilding,
  IconPhone,
  IconMapPin,
  IconId,
  IconLicense,
  IconAlertTriangle,
  IconCheck,
  IconCalendar,
  IconFileTypePdf,
  IconFileTypeXls,
  IconChevronDown,
  IconChevronUp,
  IconEdit,
  IconAlertCircle,
  IconRefresh,
} from "@tabler/icons-react";
import { MantineReactTable, type MRT_ColumnDef } from "mantine-react-table";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { useGetBusinessById } from "../../../../tanstack/useBusinessQueries";
import { BusinessType } from "../../../../types/business";

// Mock business info
const mockBusiness = {
  business_name: "CÔNG TY THỊNH PHÁT",
  business_code: "010204567",
  business_type: "Công ty Cổ phần",
  address: "12 Lý Thường Kiệt, Q. Hoàn Kiếm",
  phone_number: "0912 345 678",
  email: "info@thinhphat.com",
  website: "www.thinhphat.com",
  fax: "-",
  issue_date: "2015-08-20",
  province: "Hà Nội",
  ward: "Phường Bạch Mai",
};

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

const getBusinessTypeLabel = (businessType: BusinessType) => {
  switch (businessType) {
    case BusinessType.Individual:
      return "Hộ kinh doanh";
    case BusinessType.LLC:
      return "Công ty TNHH";
    case BusinessType.JSC:
      return "Công ty Cổ phần";
    default:
      return "Không xác định";
  }
};

function DashboardPage() {
  const { businessId } = useParams();
  const {
    data: businessData,
    isLoading,
    error,
    isError,
    refetch,
  } = useGetBusinessById(businessId || "");
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";
  // Badge variant
  const badgeVariant = isDark ? "filled" : "light";
  const [showMore, setShowMore] = useState(false);
  const navigate = useNavigate();
  const business = useMemo((): typeof mockBusiness => {
    if (businessData) {
      return {
        business_name: businessData.business_name,
        business_code: businessData.business_code,
        business_type: getBusinessTypeLabel(businessData.business_type),
        address: businessData.address,
        province: businessData.province,
        ward: businessData.ward,
        phone_number: businessData.phone_number || "-",
        email: businessData.email || "-",
        website: businessData.website || "-",
        fax: businessData.fax || "-",
        issue_date: businessData.issue_date
          ? new Date(businessData.issue_date).toLocaleDateString("vi-VN")
          : "-",
      };
    }
    return mockBusiness;
  }, [businessData]);

  // Loading state
  if (isLoading) {
    return (
      <Box p="md">
        <Paper
          shadow="lg"
          radius="xl"
          p={{ base: "md", sm: "xl" }}
          mb="md"
          withBorder
        >
          <Group justify="space-between" align="flex-start" mb={16}>
            <Skeleton height={32} width={300} />
            <Group>
              <Skeleton height={32} width={120} />
              <Skeleton height={32} width={120} />
            </Group>
          </Group>
          <Skeleton height={180} mb="xl" />

          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md" mb="xl">
            <Skeleton height={150} />
            <Skeleton height={150} />
            <Skeleton height={150} />
            <Skeleton height={150} />
          </SimpleGrid>
          <Skeleton height={300} />
        </Paper>
      </Box>
    );
  }

  // Error state
  if (isError) {
    return (
      <Box p="md">
        <Alert
          icon={<IconAlertCircle size={24} />}
          title="Lỗi khi tải dữ liệu doanh nghiệp"
          color="red"
          mb="md"
        >
          {error?.message || "Đã xảy ra lỗi không xác định."}
          <Button
            mt="md"
            leftSection={<IconRefresh size={16} />}
            onClick={() => refetch()}
            variant="light"
            color="red"
            size="xs"
          >
            Thử lại
          </Button>
        </Alert>
      </Box>
    );
  }

  return (
    <Box p="md">
      <Paper
        shadow="lg"
        radius="xl"
        p={{ base: "md", sm: "xl" }}
        mb="md"
        style={{
          transition: "box-shadow 0.2s",
        }}
        withBorder
        onMouseOver={(e) =>
          (e.currentTarget.style.boxShadow = "var(--mantine-shadow-xl)")
        }
        onMouseOut={(e) =>
          (e.currentTarget.style.boxShadow = "var(--mantine-shadow-lg)")
        }
      >
        <Group justify="space-between" align="flex-start" mb={16}>
          <Title order={2} fw={700} c="blue.8" m={0}>
            Tổng quan doanh nghiệp
          </Title>
          <Group gap={8}>
            <Button
              size="xs"
              variant="subtle"
              rightSection={
                showMore ? (
                  <IconChevronUp size={18} />
                ) : (
                  <IconChevronDown size={18} />
                )
              }
              onClick={() => setShowMore((v) => !v)}
              style={{ minWidth: 90 }}
            >
              {showMore ? "Thu gọn" : "Xem thêm"}
            </Button>
            <Button
              size="xs"
              variant="outline"
              leftSection={<IconEdit size={16} />}
              onClick={() => navigate("/test")}
            >
              Sửa dữ liệu
            </Button>
          </Group>
        </Group>
        <Grid align="center" gutter={{ base: 16, sm: 32 }}>
          <Grid.Col
            span={{ base: 12, sm: 3 }}
            style={{ display: "flex", justifyContent: "center" }}
          >
            <Avatar
              size={96}
              radius={96}
              color="blue"
              variant="gradient"
              gradient={{ from: "blue", to: "cyan", deg: 120 }}
              style={{
                border: `4px solid #a5d8ff`,
                boxShadow: "var(--mantine-shadow-md)",
              }}
            >
              <IconBuilding size={56} />
            </Avatar>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 9 }}>
            <Stack gap={8}>
              <Group gap={8} align="center">
                <Title
                  order={2}
                  fw={900}
                  style={{
                    background: `linear-gradient(90deg, #228be6, #15aabf)`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    display: "inline-block",
                  }}
                >
                  {business.business_name}
                </Title>
                <IconBuilding size={28} color="#228be6" />
              </Group>
              <Grid gutter={8}>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Group gap={6} align="center">
                    <IconId size={18} color="#495057" />
                    <Text size="sm" fw={600}>
                      Mã số:
                    </Text>
                    <Text size="sm" fw={500}>
                      {business.business_code}
                    </Text>
                  </Group>
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Group gap={6} align="center">
                    <IconLicense size={18} color="#228be6" />
                    <Text size="sm" fw={600}>
                      Loại hình:
                    </Text>
                    <Badge
                      color="blue"
                      size="md"
                      radius="sm"
                      variant="gradient"
                      gradient={{ from: "blue", to: "cyan", deg: 120 }}
                    >
                      {business.business_type}
                    </Badge>
                  </Group>
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Group gap={6} align="center">
                    <IconMapPin size={18} color="#fab005" />
                    <Text size="sm" fw={600}>
                      Tỉnh/TP:
                    </Text>
                    <Text size="sm" fw={500}>
                      {business.province}
                    </Text>
                  </Group>
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Group gap={6} align="center">
                    <IconMapPin size={18} color="#40c057" />
                    <Text size="sm" fw={600}>
                      Xã/Phường:
                    </Text>
                    <Text size="sm" fw={500}>
                      {business.ward}
                    </Text>
                  </Group>
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Group gap={6} align="center">
                    <IconMapPin size={18} color="#fa5252" />
                    <Text size="sm" fw={600}>
                      Địa chỉ:
                    </Text>
                    <Text size="sm" fw={500}>
                      {business.address}
                    </Text>
                  </Group>
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Group gap={6} align="center">
                    <IconPhone size={18} color="#40c057" />
                    <Text size="sm" fw={600}>
                      Điện thoại:
                    </Text>
                    <Text size="sm" fw={500}>
                      {business.phone_number}
                    </Text>
                  </Group>
                </Grid.Col>
                {showMore && (
                  <>
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <Group gap={6} align="center">
                        <IconId size={18} color="#fab005" />
                        <Text size="sm" fw={600}>
                          Email:
                        </Text>
                        <Text size="sm" fw={500}>
                          {business.email}
                        </Text>
                      </Group>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <Group gap={6} align="center">
                        <IconId size={18} color="#15aabf" />
                        <Text size="sm" fw={600}>
                          Website:
                        </Text>
                        <Text size="sm" fw={500}>
                          {business.website}
                        </Text>
                      </Group>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <Group gap={6} align="center">
                        <IconCalendar size={18} color="#868e96" />
                        <Text size="sm" fw={600}>
                          Ngày thành lập:
                        </Text>
                        <Text size="sm" fw={500}>
                          {business.issue_date}
                        </Text>
                      </Group>
                    </Grid.Col>
                  </>
                )}
              </Grid>
            </Stack>
          </Grid.Col>
        </Grid>
      </Paper>

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
