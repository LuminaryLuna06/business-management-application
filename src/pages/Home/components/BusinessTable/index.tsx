import { Alert, Badge, Box, Center, Loader, Text, Button } from "@mantine/core";
import { MantineReactTable } from "mantine-react-table";
import { useNavigate } from "react-router";
import { BusinessType } from "../../../../types/business";
import { useMemo } from "react";
import { useGetAllBusinesses } from "../../../../tanstack/useBusinessQueries";
import { IconAlertCircle } from "@tabler/icons-react";
import industryData from "../../../../data/industry.json";

function BusinessTable() {
  const navigate = useNavigate();

  // Sử dụng TanStack Query để lấy dữ liệu doanh nghiệp
  const { data: businesses, isLoading, error, isError } = useGetAllBusinesses();

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

  // Hàm lấy tên ngành từ mã
  const getIndustryName = (code: string) => {
    const found = (industryData as any[]).find((item) => item.code === code);
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
      issue_date: business.issue_date?.toLocaleDateString("vi-VN") || "-",
      province: business.province,
      ward: business.ward,
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
        Cell: ({ cell }: { cell: any }) => getIndustryName(cell.getValue()),
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
    <Box>
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
          <Text size="lg" fw={600} mb="xs">
            Danh sách doanh nghiệp
          </Text>
          <Text size="sm" color="dimmed">
            Tổng số: {businesses?.length || 0} doanh nghiệp
          </Text>
        </div>
        <Button onClick={() => navigate("/business/add")}>
          + Thêm doanh nghiệp
        </Button>
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
            const businessId = row.original.business_id;
            navigate(`/business/${businessId}`);
          },
          style: { cursor: "pointer" },
        })}
      />
    </Box>
  );
}

export default BusinessTable;
