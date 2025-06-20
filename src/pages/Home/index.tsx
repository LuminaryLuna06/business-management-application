import {
  AppShell,
  Burger,
  useMantineColorScheme,
  ActionIcon,
  NavLink,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconSun,
  IconMoon,
  IconHome2,
  IconChevronRight,
} from "@tabler/icons-react";
import { NavLink as RouterNavLink } from "react-router-dom";
import { MantineReactTable } from "mantine-react-table";
import { useMemo } from "react";

function HomePage() {
  const [opened, { toggle }] = useDisclosure();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const data = useMemo(
    () => [
      {
        business_id: "business_001",
        business_code: "410803796",
        business_name: "QUÁN BÌNH THANH",
        business_type: "Cá nhân",
        business_address: "649/205 Điện Biên Phủ, Q. Bình Thạnh",
        business_industry: "Kinh doanh ăn uống",
      },
      {
        business_id: "business_002",
        business_code: "031457155",
        business_name: "CÔNG TY TRƯỜNG VẬN",
        business_type: "Công ty TNHH",
        business_address: "175D Nguyễn Thái Học, Q. 1",
        business_industry: "Vận tải hàng hóa",
      },
      {
        business_id: "business_003",
        business_code: "010204567",
        business_name: "CÔNG TY THỊNH PHÁT",
        business_type: "Công ty Cổ phần",
        business_address: "12 Lý Thường Kiệt, Q. Hoàn Kiếm",
        business_industry: "Bán lẻ điện tử",
      },
      {
        business_id: "business_004",
        business_code: "540908123",
        business_name: "QUÁN CƠM NHÀ LÀNH",
        business_type: "Cá nhân",
        business_address: "45 Trần Phú, Q. Hải Châu",
        business_industry: "Kinh doanh ăn uống",
      },
      {
        business_id: "business_005",
        business_code: "081305678",
        business_name: "CÔNG TY XÂY DỰNG AN PHÚ",
        business_type: "Công ty TNHH",
        business_address: "78 Nguyễn Huệ, Q. 1",
        business_industry: "Xây dựng",
      },
      {
        business_id: "business_006",
        business_code: "091406789",
        business_name: "SIÊU THỊ MINH ANH",
        business_type: "Công ty Cổ phần",
        business_address: "101 Hùng Vương, Q. 5",
        business_industry: "Bán lẻ thực phẩm",
      },
      {
        business_id: "business_007",
        business_code: "110507890",
        business_name: "TRUNG TÂM ĐÀO TẠO ABC",
        business_type: "Cá nhân",
        business_address: "23 Lê Lợi, Q. 3",
        business_industry: "Giáo dục",
      },
    ],
    []
  );
  const columns = useMemo(
    () => [
      {
        accessorKey: "business_id",
        header: "Mã ID",
        size: 100,
      },
      {
        accessorKey: "business_code",
        header: "Mã số",
        size: 150,
      },
      {
        accessorKey: "business_name",
        header: "Tên",
        size: 200,
      },
      {
        accessorKey: "business_type",
        header: "Loại hình",
        size: 150,
      },
      {
        accessorKey: "business_address",
        header: "Địa chỉ",
        size: 300,
      },
      {
        accessorKey: "business_industry",
        header: "Ngành nghề",
        size: 200,
      },
    ],
    []
  );
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
        <MantineReactTable
          columns={columns}
          data={data}
          enablePagination
          enableSorting
          enableColumnFilters
          initialState={{ pagination: { pageSize: 10, pageIndex: 0 } }}
          mantineTableProps={{
            striped: true,
            highlightOnHover: true,
          }}
        />
      </AppShell.Main>
    </AppShell>
  );
}

export default HomePage;
