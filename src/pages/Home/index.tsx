import {
  AppShell,
  Burger,
  useMantineColorScheme,
  ActionIcon,
  NavLink,
  Group,
  Avatar,
  Menu,
  Text,
  Divider,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconSun,
  IconMoon,
  IconHome2,
  IconChevronRight,
  // IconUser,
  IconLogout,
  // IconSettings,
} from "@tabler/icons-react";
import {
  Outlet,
  NavLink as RouterNavLink,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "../../context/authContext";
import { doSignOut } from "../../firebase/auth";

function HomePage() {
  const [opened, { toggle }] = useDisclosure();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleLogout = async () => {
    try {
      await doSignOut();
      navigate("/login");
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
    }
  };

  const getUserInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

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
          onClick={() => navigate("/business")}
        >
          Hệ thống quản lý Doanh nghiệp/Hộ kinh doanh địa phương
        </div>

        <Group style={{ marginLeft: "auto", marginRight: "1rem" }} gap="sm">
          <ActionIcon
            variant="default"
            onClick={() => toggleColorScheme()}
            size="lg"
          >
            {colorScheme === "dark" ? (
              <IconSun size="1.2rem" />
            ) : (
              <IconMoon size="1.2rem" />
            )}
          </ActionIcon>

          {currentUser && (
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <ActionIcon variant="default" size="lg">
                  <Avatar
                    size="sm"
                    radius="xl"
                    color="blue"
                    variant="gradient"
                    gradient={{ from: "blue", to: "cyan" }}
                  >
                    {getUserInitials(currentUser.email || "U")}
                  </Avatar>
                </ActionIcon>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>
                  <Group gap="sm">
                    <Avatar
                      size="md"
                      radius="xl"
                      color="blue"
                      variant="gradient"
                      gradient={{ from: "blue", to: "cyan" }}
                    >
                      {getUserInitials(currentUser.email || "U")}
                    </Avatar>
                    <div>
                      <Text size="sm" fw={500}>
                        {currentUser.displayName || "Người dùng"}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {currentUser.email}
                      </Text>
                    </div>
                  </Group>
                </Menu.Label>

                <Divider />

                {/* <Menu.Item
                  leftSection={<IconUser size={14} />}
                  onClick={() => navigate("/profile")}
                >
                  Thông tin cá nhân
                </Menu.Item>

                <Menu.Item
                  leftSection={<IconSettings size={14} />}
                  onClick={() => navigate("/settings")}
                >
                  Cài đặt
                </Menu.Item> */}

                <Divider />

                <Menu.Item
                  leftSection={<IconLogout size={14} />}
                  color="red"
                  onClick={handleLogout}
                >
                  Đăng xuất
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <NavLink
          component={RouterNavLink}
          to={"/business"}
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
          to={"/licenses"}
          label="Giấy phép con"
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
          to={"/industry"}
          label="Ngành nghề"
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
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}

export default HomePage;
