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
  Flex,
  Tooltip,
  Modal,
  TextInput,
  Button,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconSun,
  IconMoon,
  IconHome2,
  IconChevronRight,
  IconLogout,
  IconBuildingStore,
  IconCertificate,
  IconBriefcase,
  IconUsers,
  IconTrash,
  IconFolderPlus,
  IconReportAnalytics,
} from "@tabler/icons-react";
import {
  Outlet,
  NavLink as RouterNavLink,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "../../context/authContext";
import { doSignOut } from "../../firebase/auth";
import { getAccessToken } from "../../googledrive/GoogleDriveUploader";
import { useState } from "react";
import { notifications } from "@mantine/notifications";

function HomePage() {
  const [opened, { toggle }] = useDisclosure();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [folderIdInput, setFolderIdInput] = useState("");

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
        <Text
          style={{
            fontWeight: "bold",
            paddingLeft: "1rem",
            cursor: "pointer",
            fontSize: "1.1rem",
            "@media (minWidth: 600px)": {
              fontSize: "1.3rem",
            },
            "@media (minWidth: 900px)": {
              fontSize: "1.5rem",
            },
          }}
          onClick={() => navigate("/")}
        >
          Hệ thống quản lý Doanh nghiệp/Hộ kinh doanh địa phương
        </Text>

        <Flex
          ml="auto"
          mr="1rem"
          gap="sm"
          align="center"
          wrap="nowrap"
          style={{ minWidth: 90 }}
        >
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
          <Tooltip label="Lấy Google Drive Token" withArrow position="bottom">
            <ActionIcon
              variant="filled"
              color="teal"
              size="lg"
              style={{
                marginLeft: 8,
                border: "1.5px solid #0ca678",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
              onClick={() => {
                getAccessToken((token) => {
                  notifications.show({
                    title: "Lấy token thành công",
                    message: token,
                    color: "teal",
                  });
                });
              }}
            >
              <IconCertificate size="1.2rem" />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Xóa Google Drive Token" withArrow position="bottom">
            <ActionIcon
              variant="filled"
              color="red"
              size="lg"
              style={{
                marginLeft: 8,
                border: "1.5px solid #fa5252",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
              onClick={() => {
                localStorage.removeItem("gdrive_token");
                notifications.show({
                  title: "Thành công",
                  message: "Đã xóa Google Drive Token khỏi localStorage!",
                  color: "green",
                });
              }}
            >
              <IconTrash size="1.2rem" />
            </ActionIcon>
          </Tooltip>
          <Tooltip
            label="Tạo/Sửa Folder Google Drive"
            withArrow
            position="bottom"
          >
            <ActionIcon
              variant="filled"
              color="blue"
              size="lg"
              style={{
                marginLeft: 8,
                border: "1.5px solid #228be6",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
              onClick={() => setFolderModalOpen(true)}
            >
              <IconFolderPlus size="1.2rem" />
            </ActionIcon>
          </Tooltip>

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
        </Flex>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <NavLink
          component={RouterNavLink}
          to={"/"}
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
          to={"/report"}
          label="Báo cáo tổng quan"
          leftSection={<IconReportAnalytics size={16} stroke={1.5} />}
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
          to={"/schedule-management"}
          label="Lịch kiểm tra"
          leftSection={<IconReportAnalytics size={16} stroke={1.5} />}
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
          to={"/business"}
          label="Hộ kinh doanh / doanh nghiệp"
          leftSection={<IconBuildingStore size={16} stroke={1.5} />}
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
          to={"/industry"}
          label="Ngành nghề"
          leftSection={<IconBriefcase size={16} stroke={1.5} />}
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
          to={"/user-management"}
          label="Quản lý người dùng"
          leftSection={<IconUsers size={16} stroke={1.5} />}
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

      <Modal
        opened={folderModalOpen}
        onClose={() => setFolderModalOpen(false)}
        title="Nhập ID folder Google Drive"
        centered
      >
        <TextInput
          label="Folder ID"
          placeholder="Nhập ID folder Google Drive..."
          value={folderIdInput}
          onChange={(e) => setFolderIdInput(e.currentTarget.value)}
          mb="md"
        />
        <Group justify="flex-end">
          <Button
            onClick={() => {
              localStorage.setItem("gdrive_folder_id", folderIdInput.trim());
              setFolderModalOpen(false);
              setFolderIdInput("");
              notifications.show({
                title: "Thành công",
                message: "Đã lưu folder ID vào localStorage!",
                color: "green",
              });
            }}
            disabled={!folderIdInput.trim()}
          >
            Lưu
          </Button>
        </Group>
      </Modal>
    </AppShell>
  );
}

export default HomePage;
