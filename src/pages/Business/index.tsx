import {
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Grid,
  Group,
  Paper,
  SimpleGrid,
  Skeleton,
  Stack,
  Tabs,
  Title,
  Text,
} from "@mantine/core";
import { useMemo, useState } from "react";
import DashboardPage from "./components/Dashboard";
import Employees from "./components/Employees";
import SubLicenses from "./components/Sub-Licenses";
import InspectionSchedulePage from "./components/Inspection-Schedule";
import {
  IconChevronUp,
  IconChevronDown,
  IconEdit,
  IconBuilding,
  IconId,
  IconLicense,
  IconMapPin,
  IconPhone,
  IconCalendar,
  IconAlertCircle,
  IconRefresh,
} from "@tabler/icons-react";
import { useNavigate, useParams } from "react-router";
import { useGetBusinessById } from "../../tanstack/useBusinessQueries";
import { BusinessType } from "../../types/business";
import industryData from "../../data/industry.json";

// Mock business info
const mockBusiness = {
  business_name: "CÔNG TY THỊNH PHÁT",
  business_code: "010204567",
  business_type: "3",
  industry: "1",
  address: "12 Lý Thường Kiệt, Q. Hoàn Kiếm",
  phone_number: "0912 345 678",
  email: "info@thinhphat.com",
  website: "www.thinhphat.com",
  fax: "-",
  issue_date: "2015-08-20",
  province: "Hà Nội",
  ward: "Phường Bạch Mai",
};

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

// Hàm lấy tên ngành từ mã
const getIndustryName = (code: string) => {
  const found = (industryData as any[]).find((item) => item.code === code);
  return found ? found.name : code;
};

export default function BusinessPage() {
  const [activeTab, setActiveTab] = useState<string | null>("first");
  const [showMore, setShowMore] = useState(false);
  const navigate = useNavigate();
  const { businessId } = useParams();

  const {
    data: businessData,
    isLoading,
    error,
    isError,
    refetch,
  } = useGetBusinessById(businessId || "");

  const business = useMemo((): typeof mockBusiness => {
    if (businessData) {
      return {
        business_name: businessData.business_name,
        business_code: businessData.business_code,
        business_type: getBusinessTypeLabel(businessData.business_type),
        industry: businessData.industry,
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
          <Skeleton height={150} mb="xl" />
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
    <Box>
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
              onClick={() => navigate(`/business/${businessId}/edit`)}
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
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Group gap={6} align="center">
                    <IconId size={18} color="#fab005" />
                    <Text size="sm" fw={600}>
                      Ngành nghề:
                    </Text>
                    <Text size="sm" fw={500}>
                      {getIndustryName(business.industry)}
                    </Text>
                  </Group>
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Group gap={6} align="center">
                    <IconId size={18} color="#868e96" />
                    <Text size="sm" fw={600}>
                      Fax:
                    </Text>
                    <Text size="sm" fw={500}>
                      {business.fax}
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
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="first">Dashboard</Tabs.Tab>
          <Tabs.Tab value="second">Nhân viên</Tabs.Tab>
          <Tabs.Tab value="third">Giấy phép con</Tabs.Tab>
          <Tabs.Tab value="fourth">Lịch kiểm tra</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="first">
          <DashboardPage />
        </Tabs.Panel>
        <Tabs.Panel value="second">
          <Employees />
        </Tabs.Panel>
        <Tabs.Panel value="third">
          <SubLicenses />
        </Tabs.Panel>
        <Tabs.Panel value="fourth">
          <InspectionSchedulePage />
        </Tabs.Panel>
      </Tabs>
    </Box>
  );
}
