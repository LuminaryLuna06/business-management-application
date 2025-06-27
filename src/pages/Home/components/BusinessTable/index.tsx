import { Alert, Badge, Box, Center, Loader, Text, Button } from "@mantine/core";
import { MantineReactTable, type MRT_ColumnDef } from "mantine-react-table";
import { useNavigate } from "react-router";
import { BusinessType } from "../../../../types/business";
import { useMemo } from "react";
import { useGetAllBusinesses } from "../../../../tanstack/useBusinessQueries";
import { IconAlertCircle, IconDownload } from "@tabler/icons-react";
import industryData from "../../../../data/industry.json";
import treeData from "../../../../data/tree.json";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { MRT_Localization_VI } from "mantine-react-table/locales/vi/index.cjs";

const industryOptions = industryData.map((industry) => ({
  value: industry.code,
  label: industry.name,
}));

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

  const columns = useMemo<MRT_ColumnDef<any>[]>(
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
        columnFilterDisplayMode={"popover"}
        enableColumnFilters
        enableGlobalFilter
        enableStickyHeader
        enableRowSelection
        enableSelectAll
        localization={MRT_Localization_VI}
        initialState={{
          pagination: { pageSize: 10, pageIndex: 0 },
          density: "xs",
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
              <Button onClick={() => navigate("/business/add")}>
                + Thêm doanh nghiệp
              </Button>
            </Box>
          );
        }}
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
