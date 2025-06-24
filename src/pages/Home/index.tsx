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
import {
  Outlet,
  NavLink as RouterNavLink,
  useNavigate,
} from "react-router-dom";

function HomePage() {
  const [opened, { toggle }] = useDisclosure();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const navigate = useNavigate();
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
        <NavLink
          component={RouterNavLink}
          to={"/test"}
          label="Upload mock"
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
          to={"/test3"}
          label="Upload mock 2"
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
