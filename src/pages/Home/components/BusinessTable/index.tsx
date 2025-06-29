import {
  Alert,
  Badge,
  Box,
  Center,
  Loader,
  Text,
  Button,
  ActionIcon,
  Tooltip,
  Flex,
} from "@mantine/core";
import {
  MantineReactTable,
  type MRT_ColumnDef,
  type MRT_Row,
} from "mantine-react-table";
import { useNavigate } from "react-router";
import { BusinessType } from "../../../../types/business";
import { useMemo } from "react";
import {
  useGetAllBusinesses,
  useDeleteBusiness,
} from "../../../../tanstack/useBusinessQueries";
import {
  IconAlertCircle,
  IconDownload,
  IconEdit,
  IconTrash,
  IconEye,
} from "@tabler/icons-react";
import treeData from "../../../../data/tree.json";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { MRT_Localization_VI } from "mantine-react-table/locales/vi/index.cjs";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";
import { useGetAllIndustries } from "../../../../tanstack/useIndustryQueries";

function BusinessTable() {
  const navigate = useNavigate();

  // Sử dụng TanStack Query để lấy dữ liệu doanh nghiệp
  const { data: businesses, isLoading, error, isError } = useGetAllBusinesses();
  const deleteBusinessMutation = useDeleteBusiness();

  // Lấy dữ liệu ngành nghề từ Firestore
  const { data: industries } = useGetAllIndustries();

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

  // Tạo industryOptions và getIndustryName từ dữ liệu Firestore
  const industryOptions = useMemo(
    () =>
      (industries || []).map((industry) => ({
        value: industry.code,
        label: industry.name,
      })),
    [industries]
  );
  const getIndustryName = (code: string) => {
    const found = (industries || []).find((item) => item.code === code);
    return found ? found.name : code;
  };

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
      issue_date: business.issue_date ? new Date(business.issue_date) : null,
      province: business.province,
      ward: business.ward,
    }));
  }, [businesses]);

  const hanoiWards = useMemo(() => {
    const hanoi = (treeData as any[]).find((item) => item.name === "Hà Nội");
    if (!hanoi) return [];
    return hanoi.wards.map((w: any) => w.name);
  }, []);

  // DELETE action - Single delete
  const openDeleteConfirmModal = (row: MRT_Row<any>) => {
    modals.openConfirmModal({
      title: "Xác nhận xóa doanh nghiệp",
      children: (
        <Text>
          Bạn có chắc chắn muốn xóa doanh nghiệp{" "}
          <strong>"{row.original.business_name}"</strong>? Hành động này không
          thể hoàn tác.
        </Text>
      ),
      labels: { confirm: "Xóa doanh nghiệp", cancel: "Hủy" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await deleteBusinessMutation.mutateAsync(row.original.business_id);
          notifications.show({
            title: "Thành công",
            message: `Đã xóa doanh nghiệp "${row.original.business_name}"`,
            color: "green",
          });
        } catch (error) {
          notifications.show({
            title: "Lỗi",
            message: "Không thể xóa doanh nghiệp. Vui lòng thử lại.",
            color: "red",
          });
        }
      },
    });
  };

  // DELETE action - Bulk delete
  const openBulkDeleteConfirmModal = (businesses: any[], table: any) => {
    modals.openConfirmModal({
      title: "Xác nhận xóa nhiều doanh nghiệp",
      children: (
        <Box>
          <Text mb="md">
            Bạn có chắc chắn muốn xóa{" "}
            <strong>{businesses.length} doanh nghiệp</strong> đã chọn?
          </Text>
          <Text size="sm" color="dimmed" mb="md">
            Hành động này không thể hoàn tác. Tất cả dữ liệu liên quan sẽ bị xóa
            vĩnh viễn.
          </Text>
          <Box>
            <Text size="sm" fw={500} mb="xs">
              Danh sách doanh nghiệp sẽ bị xóa:
            </Text>
            <Box style={{ maxHeight: "200px", overflowY: "auto" }}>
              {businesses.map((business, index) => (
                <Text key={index} size="sm" color="dimmed">
                  • {business.business_name} ({business.business_code})
                </Text>
              ))}
            </Box>
          </Box>
        </Box>
      ),
      labels: {
        confirm: `Xóa ${businesses.length} doanh nghiệp`,
        cancel: "Hủy",
      },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          // Xóa từng doanh nghiệp một cách tuần tự
          for (const business of businesses) {
            await deleteBusinessMutation.mutateAsync(business.business_id);
          }

          // Clear table selection
          table.setRowSelection({});

          notifications.show({
            title: "Thành công",
            message: `Đã xóa ${businesses.length} doanh nghiệp`,
            color: "green",
          });
        } catch (error) {
          notifications.show({
            title: "Lỗi",
            message: "Có lỗi xảy ra khi xóa doanh nghiệp. Vui lòng thử lại.",
            color: "red",
          });
        }
      },
    });
  };

  const columns = useMemo<MRT_ColumnDef<any>[]>(
    () => [
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
        filterVariant: "multi-select",
        mantineFilterMultiSelectProps: {
          data: ["Hộ kinh doanh", "Công ty TNHH", "Công ty Cổ phần"],
        },
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
        accessorKey: "business_industry",
        header: "Ngành nghề",
        size: 200,
        filterVariant: "multi-select",
        mantineFilterMultiSelectProps: {
          data: industryOptions,
        },
        Cell: ({ cell }: { cell: any }) => getIndustryName(cell.getValue()),
      },
      {
        accessorKey: "province",
        header: "Tỉnh/Thành phố",
        size: 180,
        filterVariant: "multi-select",
        mantineFilterMultiSelectProps: {
          data: ["Hà Nội"],
        },
      },
      {
        accessorKey: "ward",
        header: "Xã/Phường",
        size: 150,
        filterVariant: "multi-select",
        mantineFilterMultiSelectProps: {
          data: hanoiWards,
        },
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
        filterVariant: "date-range",
        sortingFn: "datetime",
        Cell: ({ cell }) => cell.getValue<Date>()?.toLocaleDateString(),
      },
    ],
    []
  );

  // Export Excel helpers
  const exportRowsToExcel = (rows: any[], filename = "doanh-nghiep") => {
    if (!rows || rows.length === 0) return;
    const data = rows.map((row) => row.original || row);
    const mapped = data.map(
      ({
        business_id,
        business_code,
        business_name,
        business_type,
        business_address,
        business_industry,
        phone_number,
        email,
        issue_date,
        province,
        ward,
        ...rest
      }) => ({
        ID: business_id,
        "Mã số doanh nghiệp": business_code,
        "Tên doanh nghiệp": business_name,
        "Loại hình": business_type,
        "Địa chỉ": business_address,
        "Ngành nghề": getIndustryName(business_industry),
        "Số điện thoại": phone_number,
        Email: email,
        "Ngày cấp":
          issue_date instanceof Date
            ? issue_date.toLocaleDateString()
            : issue_date,
        "Tỉnh/Thành phố": province,
        "Xã/Phường": ward,
        ...rest,
      })
    );
    const worksheet = XLSX.utils.json_to_sheet(mapped);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `${filename}.xlsx`);
  };

  const exportAllToExcel = (data: any[]) => {
    if (!data || data.length === 0) return;
    const mapped = data.map(
      ({
        business_id,
        business_code,
        business_name,
        business_type,
        business_address,
        business_industry,
        phone_number,
        email,
        issue_date,
        province,
        ward,
        ...rest
      }) => ({
        ID: business_id,
        "Mã số doanh nghiệp": business_code,
        "Tên doanh nghiệp": business_name,
        "Loại hình": business_type,
        "Địa chỉ": business_address,
        "Ngành nghề": getIndustryName(business_industry),
        "Số điện thoại": phone_number,
        Email: email,
        "Ngày cấp":
          issue_date instanceof Date
            ? issue_date.toLocaleDateString()
            : issue_date,
        "Tỉnh/Thành phố": province,
        "Xã/Phường": ward,
        ...rest,
      })
    );
    const worksheet = XLSX.utils.json_to_sheet(mapped);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `doanh-nghiep.xlsx`);
  };

  if (isLoading) {
    return (
      <Center style={{ height: "50vh" }}>
        <Loader size="lg" />
        <Text ml="md">Đang tải dữ liệu doanh nghiệp...</Text>
      </Center>
    );
  }
  // Hiển thị lỗi
  if (isError) {
    return (
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
    );
  }
  return (
    <Box p="md">
      {/* Hiển thị thông tin tổng quan */}
      <Box
        style={{
          marginBottom: "1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <Text size="xl" fw={700} mb="xs">
            Danh sách doanh nghiệp
          </Text>
          <Text size="sm" color="dimmed">
            Tổng số: {businesses?.length || 0} doanh nghiệp
          </Text>
        </div>
      </Box>

      {/* Sử dụng dữ liệu từ Firebase */}
      <MantineReactTable
        columns={columns}
        data={tableData}
        enablePagination
        enableSorting
        enableColumnResizing
        enableDensityToggle={false}
        enableTopToolbar
        enableColumnFilters
        enableGlobalFilter
        enableStickyHeader
        enableRowSelection
        enableSelectAll
        localization={MRT_Localization_VI}
        enableColumnPinning
        enableRowActions
        positionActionsColumn="last"
        initialState={{
          pagination: { pageSize: 10, pageIndex: 0 },
          density: "xs",
          columnPinning: { right: ["mrt-row-actions"] },
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
        mantineTableBodyCellProps={({ column }) =>
          column.id === "mrt-row-actions"
            ? {
                style: { paddingRight: 24, minWidth: 140, textAlign: "center" },
              }
            : {}
        }
        mantineTableHeadCellProps={({ column }) =>
          column.id === "mrt-row-actions"
            ? { style: { minWidth: 140, textAlign: "center" } }
            : {}
        }
        renderRowActions={({ row }) => (
          <Flex gap="md" justify="center">
            <Tooltip label="View">
              <ActionIcon
                color="green"
                variant="light"
                radius="md"
                onClick={(e) => {
                  e.stopPropagation();
                  const businessId = row.original.business_id;
                  navigate(`/business/${businessId}`);
                }}
              >
                <IconEye size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Edit">
              <ActionIcon
                color="blue"
                variant="light"
                radius="md"
                onClick={(e) => {
                  e.stopPropagation();
                  const businessId = row.original.business_id;
                  navigate(`/business/${businessId}/edit`);
                }}
              >
                <IconEdit size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Delete">
              <ActionIcon
                color="red"
                variant="light"
                radius="md"
                onClick={(e) => {
                  e.stopPropagation();
                  openDeleteConfirmModal(row);
                }}
              >
                <IconTrash size={18} />
              </ActionIcon>
            </Tooltip>
          </Flex>
        )}
        renderTopToolbarCustomActions={({ table }) => {
          const hasSelected = table.getSelectedRowModel().rows.length > 0;
          return (
            <Box
              style={{
                display: "flex",
                justifyContent: "flex-start",
                gap: 8,
                padding: 8,
                flexWrap: "wrap",
              }}
            >
              <Button onClick={() => navigate("/business/add")}>
                + Thêm doanh nghiệp
              </Button>
              <Button
                leftSection={<IconDownload size={16} />}
                variant="light"
                onClick={() => exportAllToExcel(tableData)}
              >
                Xuất tất cả dữ liệu (Excel)
              </Button>
              <Button
                leftSection={<IconDownload size={16} />}
                variant="light"
                onClick={() =>
                  exportRowsToExcel(
                    table.getPrePaginationRowModel().rows,
                    "doanh-nghiep-filter"
                  )
                }
                disabled={table.getPrePaginationRowModel().rows.length === 0}
              >
                Xuất tất cả hàng (theo filter, Excel)
              </Button>
              <Button
                leftSection={<IconDownload size={16} />}
                variant="light"
                onClick={() =>
                  exportRowsToExcel(
                    table.getRowModel().rows,
                    "doanh-nghiep-trang-hien-tai"
                  )
                }
                disabled={table.getRowModel().rows.length === 0}
              >
                Xuất các hàng trong trang (Excel)
              </Button>
              <Button
                leftSection={<IconDownload size={16} />}
                variant="light"
                color="teal"
                onClick={() =>
                  exportRowsToExcel(
                    table.getSelectedRowModel().rows,
                    "doanh-nghiep-da-chon"
                  )
                }
                disabled={!hasSelected}
              >
                Xuất hàng được chọn (Excel)
              </Button>
              <Button
                leftSection={<IconTrash size={16} />}
                variant="light"
                color="red"
                onClick={() =>
                  openBulkDeleteConfirmModal(
                    table.getSelectedRowModel().rows.map((row) => row.original),
                    table
                  )
                }
                disabled={!hasSelected}
              >
                Xóa doanh nghiệp đã chọn (
                {table.getSelectedRowModel().rows.length})
              </Button>
            </Box>
          );
        }}
      />
    </Box>
  );
}

export default BusinessTable;
