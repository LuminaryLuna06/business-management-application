import {
  Alert,
  Badge,
  Box,
  Center,
  Loader,
  Text,
  Button,
  MultiSelect,
} from "@mantine/core";
import { MantineReactTable, type MRT_ColumnDef } from "mantine-react-table";
import { useNavigate } from "react-router";
import { BusinessType } from "../../../../types/business";
import { useMemo } from "react";
import { useGetAllBusinesses } from "../../../../tanstack/useBusinessQueries";
import { IconAlertCircle, IconDownload } from "@tabler/icons-react";
import industryData from "../../../../data/industry.json";
import treeData from "../../../../data/tree.json";
import { mkConfig, generateCsv, download } from "export-to-csv";
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
          data: Array.from(
            new Set((treeData as any[]).map((item) => item.name))
          ),
        },
      },
      {
        accessorKey: "ward",
        header: "Xã/Phường",
        size: 150,
        filterVariant: "multi-select",
        // Custom Filter component để lấy danh sách xã/phường theo tỉnh/thành phố đã chọn
        Filter: ({ column, table }) => {
          const provinceFilter = table
            .getColumn("province")
            ?.getFilterValue() as string[] | undefined;
          const wardList = useMemo(() => {
            if (provinceFilter && provinceFilter.length > 0) {
              return Array.from(
                new Set(
                  (treeData as any[])
                    .filter((city) => provinceFilter.includes(city.name))
                    .flatMap(
                      (city) => city.wards?.map((ward: any) => ward.name) || []
                    )
                )
              );
            }
            return Array.from(
              new Set(
                (treeData as any[]).flatMap(
                  (city) => city.wards?.map((ward: any) => ward.name) || []
                )
              )
            );
          }, [provinceFilter]);

          // Loại bỏ các ward không còn hợp lệ khỏi value
          const value = (column.getFilterValue() as string[] | undefined) || [];
          const filteredValue = value.filter((v) => wardList.includes(v));
          if (filteredValue.length !== value.length) {
            column.setFilterValue(filteredValue);
          }

          return (
            <MultiSelect
              key={provinceFilter?.join("-") || "all"}
              data={wardList}
              value={filteredValue}
              onChange={column.setFilterValue}
              placeholder="Chọn xã/phường"
              clearable
              searchable
              nothingFoundMessage="Không có xã/phường"
            />
          );
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

  const csvConfig = mkConfig({
    fieldSeparator: ",",
    decimalSeparator: ".",
    useKeysAsHeaders: true,
    filename: "doanh-nghiep",
  });

  // Export helpers
  const handleExportRows = (rows: any[], filename = "doanh-nghiep") => {
    if (!rows || rows.length === 0) return;
    const mapped = rows.map((r) => {
      const original = r.original || r;
      return {
        ...original,
        business_industry: getIndustryName(original.business_industry),
      };
    });
    const csv = generateCsv({ ...csvConfig, filename })(mapped);
    download({ ...csvConfig, filename })(csv);
  };

  const handleExportAll = (data: any[]) => {
    if (!data || data.length === 0) return;
    const mapped = data.map((original) => ({
      ...original,
      business_industry: getIndustryName(original.business_industry),
    }));
    const csv = generateCsv(csvConfig)(mapped);
    download(csvConfig)(csv);
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
                onClick={() => handleExportAll(tableData)}
              >
                Xuất tất cả dữ liệu
              </Button>
              <Button
                leftSection={<IconDownload size={16} />}
                variant="light"
                onClick={() =>
                  handleExportRows(
                    table.getPrePaginationRowModel().rows,
                    "doanh-nghiep-filter"
                  )
                }
                disabled={table.getPrePaginationRowModel().rows.length === 0}
              >
                Xuất tất cả hàng (theo filter)
              </Button>
              <Button
                leftSection={<IconDownload size={16} />}
                variant="light"
                onClick={() =>
                  handleExportRows(
                    table.getRowModel().rows,
                    "doanh-nghiep-trang-hien-tai"
                  )
                }
                disabled={table.getRowModel().rows.length === 0}
              >
                Xuất các hàng trong trang
              </Button>
              <Button
                leftSection={<IconDownload size={16} />}
                variant="light"
                color="teal"
                onClick={() =>
                  handleExportRows(
                    table.getSelectedRowModel().rows,
                    "doanh-nghiep-da-chon"
                  )
                }
                disabled={!hasSelected}
              >
                Xuất hàng được chọn
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
