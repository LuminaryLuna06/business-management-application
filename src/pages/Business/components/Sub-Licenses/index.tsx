import { Box, Text, Button, Modal, Group } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useParams } from "react-router-dom";
import { MantineReactTable, type MRT_ColumnDef } from "mantine-react-table";
import { useForm, yupResolver } from "@mantine/form";
import * as Yup from "yup";
import { TextInput, Select } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import {
  useGetAllSubLicenses,
  useBusinessSubLicenses,
  useAddBusinessSublicenseMutation,
} from "../../../../tanstack/useLicenseQueries";
import { type License, type SubLicense } from "../../../../types/licenses";
import { useGetBusinessById } from "../../../../tanstack/useBusinessQueries";

const schema = Yup.object().shape({
  license_id: Yup.string().required("Chọn giấy phép con"),
  license_number: Yup.string()
    .required("Số giấy phép không được để trống")
    .min(5, "Số giấy phép phải có ít nhất 5 ký tự"),
  issue_date: Yup.date()
    .required("Ngày cấp không được để trống")
    .max(new Date(), "Ngày cấp không được trong tương lai"),
  expiration_date: Yup.date()
    .required("Ngày hết hạn không được để trống")
    .min(Yup.ref("issue_date"), "Ngày hết hạn phải sau ngày cấp"),
});

function SubLicenses() {
  const { businessId } = useParams();
  const [opened, { open, close }] = useDisclosure(false);

  // Lấy giấy phép con của doanh nghiệp
  const {
    data: licenses,
    isLoading,
    isError,
    error,
  } = useBusinessSubLicenses(businessId || "");

  const { data: businessData } = useGetBusinessById(businessId || "");

  const businessIndustry = businessData && businessData.industry; // TODO: thay bằng businessData.industry thực tế

  // Lấy tất cả giấy phép con
  const { data: allSubLicenses } = useGetAllSubLicenses();

  // Lọc giấy phép con phù hợp ngành
  const filteredSubLicenses = (allSubLicenses || []).filter((gpc: SubLicense) =>
    gpc.industries.includes(businessIndustry as string)
  );

  // Chuẩn bị data cho Select
  const subLicenseSelectData = filteredSubLicenses.map((gpc) => ({
    value: gpc.id,
    label: gpc.name,
  }));

  const columns: MRT_ColumnDef<License>[] = [
    { accessorKey: "license_number", header: "Số giấy phép" },
    {
      accessorKey: "license_id",
      header: "Tên giấy phép",
      Cell: ({ cell }) => {
        const id = cell.getValue<string>();
        const found = (allSubLicenses || []).find((gpc) => gpc.id === id);
        return found ? found.name : id;
      },
    },
    {
      accessorKey: "issue_date",
      header: "Ngày cấp",
      Cell: ({ cell }) => cell.getValue<Date>()?.toLocaleDateString() || "",
    },
    {
      accessorKey: "expiration_date",
      header: "Ngày hết hạn",
      Cell: ({ cell }) => cell.getValue<Date>()?.toLocaleDateString() || "",
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      Cell: ({ row }) => {
        const expirationDate = row.original.expiration_date;
        const today = new Date();
        if (expirationDate < today) {
          return "Hết hạn";
        } else if (
          expirationDate.getTime() - today.getTime() <
          30 * 24 * 60 * 60 * 1000
        ) {
          return "Sắp hết hạn";
        } else {
          return "Còn hiệu lực";
        }
      },
    },
  ];

  // Form với useForm và Yup
  const form = useForm({
    initialValues: {
      license_id: "",
      license_number: "",
      issue_date: new Date(),
      expiration_date: new Date(),
    },
    validate: yupResolver(schema),
  });

  // Mutation thêm giấy phép con cho doanh nghiệp
  const addMutation = useAddBusinessSublicenseMutation(businessId || "");

  const handleAddLicense = (values: typeof form.values) => {
    addMutation.mutate({
      license_id: values.license_id,
      license_number: values.license_number,
      issue_date: values.issue_date,
      expiration_date: values.expiration_date,
    });
    form.reset();
    close();
  };

  return (
    <Box p="md">
      <Text size="xl" fw={700} mb="xs">
        Danh Sách Giấy Phép Con
      </Text>
      <Text size="sm" color="dimmed" mb="md">
        Tổng số giấy phép con: {licenses ? licenses.length : 0}
      </Text>
      <Group mb="md">
        <Button onClick={open}>Thêm giấy phép</Button>
        <Button variant="outline">Import dữ liệu</Button>
      </Group>
      {isLoading ? (
        <Text>Đang tải dữ liệu...</Text>
      ) : isError ? (
        <Text color="red">
          Lỗi: {error?.message || "Không tải được dữ liệu"}
        </Text>
      ) : (
        <MantineReactTable
          columns={columns}
          data={licenses || []}
          enableRowSelection
          enableColumnFilters
          enableGlobalFilter
        />
      )}

      <Modal opened={opened} onClose={close} title="Thêm giấy phép">
        <form onSubmit={form.onSubmit(handleAddLicense)}>
          <Select
            label="Giấy phép con"
            data={subLicenseSelectData}
            {...form.getInputProps("license_id")}
            mb="sm"
            required
          />
          <TextInput
            label="Số giấy phép"
            {...form.getInputProps("license_number")}
            mb="sm"
            required
          />
          <DateInput
            label="Ngày cấp"
            {...form.getInputProps("issue_date")}
            mb="sm"
            required
          />
          <DateInput
            label="Ngày hết hạn"
            {...form.getInputProps("expiration_date")}
            mb="sm"
            required
          />
          <Group mt="md" justify="flex-end">
            <Button type="submit" loading={addMutation.isPending}>
              Thêm
            </Button>
          </Group>
        </form>
      </Modal>
    </Box>
  );
}

export default SubLicenses;
