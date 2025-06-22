import {
  AppShell,
  Burger,
  useMantineColorScheme,
  ActionIcon,
  NavLink,
  Text,
  Alert,
  Loader,
  Center,
  Badge,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconSun,
  IconMoon,
  IconHome2,
  IconChevronRight,
  IconAlertCircle,
} from "@tabler/icons-react";
import { NavLink as RouterNavLink, useNavigate } from "react-router-dom";
import { MantineReactTable } from "mantine-react-table";
import { useMemo } from "react";
import { useGetAllBusinesses } from "../../tanstack/useBusinessQueries";
import { BusinessType } from "../../types/business";

function HomePage() {
  const [opened, { toggle }] = useDisclosure();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const navigate = useNavigate();

  // Sử dụng TanStack Query để lấy dữ liệu doanh nghiệp
  const { data: businesses, isLoading, error, isError } = useGetAllBusinesses();
  console.log("Businesses data:", businesses);

  // Helper function để chuyển đổi BusinessType enum thành label
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
  // Chuyển đổi dữ liệu từ Firebase để phù hợp với bảng
  const tableData = useMemo(() => {
    if (!businesses) return [];

    return businesses.map((business) => ({
      business_id: business.business_id,
      business_code: business.business_code,
      business_name: business.business_name,
      business_type: getBusinessTypeLabel(business.business_type),
      business_address: business.address,
      business_industry: business.industry,
      phone_number: business.phone_number || "-",
      email: business.email || "-",
      issue_date: business.issue_date?.toLocaleDateString("vi-VN") || "-",
      province: business.province,
      ward: business.ward,
      // owner_name: business.owner?.name || "-",
    }));
  }, [businesses]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "business_id",
        header: "Mã ID",
        size: 120,
        enableColumnFilter: false,
      },
      {
        accessorKey: "business_code",
        header: "Mã số",
        size: 150,
      },
      {
        accessorKey: "business_name",
        header: "Tên doanh nghiệp",
        size: 250,
      },
      {
        accessorKey: "business_type",
        header: "Loại hình",
        size: 150,
        Cell: ({ cell }: { cell: any }) => {
          const type = cell.getValue() as string;
          const color =
            type === "Hộ kinh doanh"
              ? "blue"
              : type === "Công ty TNHH"
              ? "green"
              : type === "Công ty Cổ phần"
              ? "violet"
              : "gray";
          return <Badge color={color}>{type}</Badge>;
        },
      },
      {
        accessorKey: "business_address",
        header: "Địa chỉ",
        size: 300,
      },
      {
        accessorKey: "province",
        header: "Tỉnh/Thành phố",
        size: 180,
      },
      { accessorKey: "ward", header: "Xã/Phường", size: 150 },
      {
        accessorKey: "business_industry",
        header: "Ngành nghề",
        size: 200,
      },
      {
        accessorKey: "phone_number",
        header: "Số điện thoại",
        size: 150,
      },
      {
        accessorKey: "email",
        header: "Email",
        size: 200,
      },
      {
        accessorKey: "issue_date",
        header: "Ngày cấp",
        size: 120,
      },
      // {
      //   accessorKey: "owner_name",
      //   header: "Chủ sở hữu",
      //   size: 180,
      // },
    ],
    []
  );

  // Hiển thị trạng thái loading
  if (isLoading) {
    return (
      <AppShell
        header={{ height: 60 }}
        navbar={{
          width: 300,
          breakpoint: "sm",
          collapsed: { mobile: !opened },
        }}
        padding="md"
      >
        <AppShell.Header style={{ display: "flex", alignItems: "center" }}>
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <div
            style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              paddingLeft: "1rem",
            }}
          >
            Quản Lý
          </div>
          <ActionIcon
            variant="default"
            onClick={() => toggleColorScheme()}
            size="lg"
            style={{ marginLeft: "auto", marginRight: "1rem" }}
          >
            {colorScheme === "dark" ? (
              <IconSun size="1.2rem" />
            ) : (
              <IconMoon size="1.2rem" />
            )}
          </ActionIcon>
        </AppShell.Header>

        <AppShell.Navbar p="md">
          <NavLink
            component={RouterNavLink}
            to={"/"}
            label="Hộ kinh doanh / doanh nghiệp"
            leftSection={<IconHome2 size={16} stroke={1.5} />}
            rightSection={
              <IconChevronRight
                size={12}
                stroke={1.5}
                className="mantine-rotate-rtl"
              />
            }
          />
          <NavLink
            component={RouterNavLink}
            to={"/test"}
            label="Test Page"
            leftSection={<IconHome2 size={16} stroke={1.5} />}
            rightSection={
              <IconChevronRight
                size={12}
                stroke={1.5}
                className="mantine-rotate-rtl"
              />
            }
          />
        </AppShell.Navbar>

        <AppShell.Main>
          <Center style={{ height: "50vh" }}>
            <Loader size="lg" />
            <Text ml="md">Đang tải dữ liệu doanh nghiệp...</Text>
          </Center>
        </AppShell.Main>
      </AppShell>
    );
  }

  // Hiển thị lỗi
  if (isError) {
    return (
      <AppShell
        header={{ height: 60 }}
        navbar={{
          width: 300,
          breakpoint: "sm",
          collapsed: { mobile: !opened },
        }}
        padding="md"
      >
        <AppShell.Header style={{ display: "flex", alignItems: "center" }}>
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <div
            style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              paddingLeft: "1rem",
            }}
          >
            Quản Lý
          </div>
          <ActionIcon
            variant="default"
            onClick={() => toggleColorScheme()}
            size="lg"
            style={{ marginLeft: "auto", marginRight: "1rem" }}
          >
            {colorScheme === "dark" ? (
              <IconSun size="1.2rem" />
            ) : (
              <IconMoon size="1.2rem" />
            )}
          </ActionIcon>
        </AppShell.Header>

        <AppShell.Navbar p="md">
          <NavLink
            component={RouterNavLink}
            to={"/"}
            label="Hộ kinh doanh / doanh nghiệp"
            leftSection={<IconHome2 size={16} stroke={1.5} />}
            rightSection={
              <IconChevronRight
                size={12}
                stroke={1.5}
                className="mantine-rotate-rtl"
              />
            }
          />
          <NavLink
            component={RouterNavLink}
            to={"/test"}
            label="Test Page"
            leftSection={<IconHome2 size={16} stroke={1.5} />}
            rightSection={
              <IconChevronRight
                size={12}
                stroke={1.5}
                className="mantine-rotate-rtl"
              />
            }
          />
        </AppShell.Navbar>

        <AppShell.Main>
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Lỗi tải dữ liệu"
            color="red"
          >
            <Text>Không thể tải dữ liệu doanh nghiệp từ Firebase.</Text>
            <Text size="sm" mt="xs">
              Lỗi: {error?.message || "Unknown error"}
            </Text>
          </Alert>
        </AppShell.Main>
      </AppShell>
    );
  }

  // Hiển thị dữ liệu thành công
  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header style={{ display: "flex", alignItems: "center" }}>
        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
        <div
          style={{
            fontSize: "1.5rem",
            fontWeight: "bold",
            paddingLeft: "1rem",
            cursor: "pointer",
          }}
          onClick={() => navigate("/")}
        >
          Quản Lý
        </div>
        <ActionIcon
          variant="default"
          onClick={() => toggleColorScheme()}
          size="lg"
          style={{ marginLeft: "auto", marginRight: "1rem" }}
        >
          {colorScheme === "dark" ? (
            <IconSun size="1.2rem" />
          ) : (
            <IconMoon size="1.2rem" />
          )}
        </ActionIcon>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <NavLink
          component={RouterNavLink}
          to={"/"}
          label="Hộ kinh doanh / doanh nghiệp"
          leftSection={<IconHome2 size={16} stroke={1.5} />}
          rightSection={
            <IconChevronRight
              size={12}
              stroke={1.5}
              className="mantine-rotate-rtl"
            />
          }
        />
        <NavLink
          component={RouterNavLink}
          to={"/test"}
          label="Test Page"
          leftSection={<IconHome2 size={16} stroke={1.5} />}
          rightSection={
            <IconChevronRight
              size={12}
              stroke={1.5}
              className="mantine-rotate-rtl"
            />
          }
        />
      </AppShell.Navbar>

      <AppShell.Main>
        {/* Hiển thị thông tin tổng quan */}
        <div style={{ marginBottom: "1rem" }}>
          <Text size="lg" fw={600} mb="xs">
            Danh sách doanh nghiệp
          </Text>
          <Text size="sm" color="dimmed">
            Tổng số: {businesses?.length || 0} doanh nghiệp
          </Text>
        </div>

        {/* Sử dụng dữ liệu từ Firebase */}
        <MantineReactTable
          columns={columns}
          data={tableData}
          enablePagination
          enableSorting
          enableColumnResizing
          enableDensityToggle={false}
          enableTopToolbar
          columnFilterDisplayMode={"popover"}
          enableColumnFilters
          enableGlobalFilter
          enableStickyHeader
          initialState={{
            pagination: { pageSize: 10, pageIndex: 0 },
            density: "xs",
          }}
          mantineTableProps={{
            striped: true,
            highlightOnHover: true,
          }}
          mantineTableContainerProps={{
            style: { maxHeight: "70vh" },
          }}
          enableRowSelection
          enableSelectAll
          mantineTableBodyRowProps={({ row }) => ({
            onClick: () => {
              // Có thể thêm navigation đến trang chi tiết doanh nghiệp
              const businessId = row.original.business_id;
              console.log("Selected business:", row.original);
              navigate(`/business/${businessId}/dashboard`);
            },
            style: { cursor: "pointer" },
          })}
        />
      </AppShell.Main>
    </AppShell>
  );
}

export default HomePage;
