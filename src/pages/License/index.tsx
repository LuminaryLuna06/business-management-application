import { useState } from "react";
import {
  Box,
  Text,
  Button,
  Modal,
  Group,
  TextInput,
  MultiSelect,
  Loader,
  Center,
} from "@mantine/core";
import { MantineReactTable, type MRT_ColumnDef } from "mantine-react-table";
import { useForm, yupResolver } from "@mantine/form";
import * as Yup from "yup";
import industryData from "../../data/industry.json";
import { v4 as uuidv4 } from "uuid";
import { type SubLicense } from "../../types/licenses";
import {
  useGetAllSubLicenses,
  useAddSubLicenseMutation,
} from "../../tanstack/useLicenseQueries";

const INDUSTRY_OPTIONS = industryData.map((item: any) => ({
  value: item.code,
  label: item.name,
}));

// Thêm schema Yup cho validate
const schema = Yup.object().shape({
  name: Yup.string().required("Tên giấy phép không được để trống"),
  issuing_authority: Yup.string().required("Cơ quan cấp không được để trống"),
  industries: Yup.array().of(Yup.string()).min(1, "Chọn ít nhất 1 ngành nghề"),
});

export default function LicensePage() {
  const [opened, setOpened] = useState(false);
  const { data, isLoading, isError, error } = useGetAllSubLicenses();
  const addMutation = useAddSubLicenseMutation();

  const form = useForm({
    initialValues: {
      name: "",
      issuing_authority: "",
      industries: [] as string[],
    },
    validate: yupResolver(schema),
  });

  const columns: MRT_ColumnDef<SubLicense>[] = [
    { accessorKey: "id", header: "ID" },
    { accessorKey: "name", header: "Tên giấy phép" },
    { accessorKey: "issuing_authority", header: "Cơ quan cấp" },
    {
      accessorKey: "industries",
      header: "Ngành liên quan",
      Cell: ({ cell }) =>
        cell
          .getValue<string[]>()
          .map((code) => INDUSTRY_OPTIONS.find((i) => i.value === code)?.label)
          .filter(Boolean)
          .join(", ") || "",
    },
  ];

  const handleAdd = (values: typeof form.values) => {
    addMutation.mutate({
      id: uuidv4(),
      name: values.name,
      issuing_authority: values.issuing_authority,
      industries: values.industries,
    });
    form.reset();
    setOpened(false);
  };

  return (
    <Box p="md">
      <Text size="xl" fw={700} mb="xs">
        Danh mục giấy phép con
      </Text>
      <Group mb="md">
        <Button onClick={() => setOpened(true)}>Thêm giấy phép con</Button>
      </Group>
      {isLoading ? (
        <Center my="lg">
          <Loader />
        </Center>
      ) : isError ? (
        <Text color="red">
          Lỗi: {error?.message || "Không tải được dữ liệu"}
        </Text>
      ) : (
        <MantineReactTable
          columns={columns}
          data={data || []}
          enableColumnFilters
          enableGlobalFilter
        />
      )}
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Thêm giấy phép con"
      >
        <form onSubmit={form.onSubmit(handleAdd)}>
          <TextInput
            label="Tên giấy phép"
            {...form.getInputProps("name")}
            mb="sm"
          />
          <TextInput
            label="Cơ quan cấp"
            {...form.getInputProps("issuing_authority")}
            mb="sm"
          />
          <MultiSelect
            label="Ngành liên quan"
            data={INDUSTRY_OPTIONS}
            {...form.getInputProps("industries")}
            mb="sm"
            searchable
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
