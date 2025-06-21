import {
  ActionIcon,
  AppShell,
  Burger,
  NavLink,
  useMantineColorScheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconSun,
  IconMoon,
  IconChevronRight,
  IconHome2,
  IconUser,
  IconCertificate,
  IconCalendar,
  // IconAlertTriangle,
} from "@tabler/icons-react";
import { Outlet, useParams } from "react-router";
import { NavLink as RouterNavLink } from "react-router-dom";

export default function BusinessPage() {
  const [opened, { toggle }] = useDisclosure();
  const { businessId } = useParams();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

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
          to={`/business/${businessId}/dashboard`}
          label="Dashboard"
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
          to={`/business/${businessId}/employees`}
          label="Nhân sự"
          leftSection={<IconUser size={16} stroke={1.5} />}
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
          to={`/business/${businessId}/sub-licenses`}
          label="Giấy phép con"
          leftSection={<IconCertificate size={16} stroke={1.5} />}
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
          to={`/business/${businessId}/inspection-schedule`}
          label="Lịch kiểm tra"
          leftSection={<IconCalendar size={16} stroke={1.5} />}
          rightSection={
            <IconChevronRight
              size={12}
              stroke={1.5}
              className="mantine-rotate-rtl"
            />
          }
        />
        {/* <NavLink
          component={RouterNavLink}
          to={`/business/${businessId}/violations`}
          label="Kết quả vi phạm"
          leftSection={<IconAlertTriangle size={16} stroke={1.5} />}
          rightSection={
            <IconChevronRight
              size={12}
              stroke={1.5}
              className="mantine-rotate-rtl"
            />
          }
        /> */}
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
