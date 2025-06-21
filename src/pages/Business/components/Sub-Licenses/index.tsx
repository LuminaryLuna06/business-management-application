import { Box, Text, Button, Modal, Group } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { MantineReactTable, type MRT_ColumnDef } from "mantine-react-table";
import { useForm, yupResolver } from "@mantine/form";
import * as Yup from "yup";
import { LicenseType, type License } from "../../../../types/licenses";
import { TextInput, Select } from "@mantine/core";
import { DateInput } from "@mantine/dates";

const schema = Yup.object().shape({
  license_number: Yup.string()
    .required("Số giấy phép không được để trống")
    .min(5, "Số giấy phép phải có ít nhất 5 ký tự"),
  license_type: Yup.mixed<LicenseType>()
    .required("Loại giấy phép không được để trống")
    .oneOf(
      [
        LicenseType.FireSafety,
        LicenseType.FoodSafety,
        LicenseType.PublicOrder,
        LicenseType.Environmental,
        LicenseType.ConstructionSafety,
        LicenseType.HealthPractice,
        LicenseType.Other,
      ],
      "Loại giấy phép không hợp lệ"
    ),
  issue_date: Yup.date()
    .required("Ngày cấp không được để trống")
    .max(new Date(), "Ngày cấp không được trong tương lai"),
  expiration_date: Yup.date()
    .required("Ngày hết hạn không được để trống")
    .min(Yup.ref("issue_date"), "Ngày hết hạn phải sau ngày cấp"),
});

function SubLicenses() {
  const { businessId } = useParams();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [opened, { open, close }] = useDisclosure(false);

  useEffect(() => {
    const sampleLicenses: License[] = [
      {
        license_id: crypto.randomUUID(),
        business_id: businessId || "",
        license_type: LicenseType.FireSafety,
        license_number: "PCCC-2024-001",
        issue_date: new Date("2024-01-15"),
        expiration_date: new Date("2025-01-15"),
      },
      {
        license_id: crypto.randomUUID(),
        business_id: businessId || "",
        license_type: LicenseType.FoodSafety,
        license_number: "ATTP-2024-002",
        issue_date: new Date("2024-02-20"),
        expiration_date: new Date("2025-02-20"),
      },
      {
        license_id: crypto.randomUUID(),
        business_id: businessId || "",
        license_type: LicenseType.PublicOrder,
        license_number: "ANTT-2024-003",
        issue_date: new Date("2024-03-10"),
        expiration_date: new Date("2025-03-10"),
      },
      {
        license_id: crypto.randomUUID(),
        business_id: businessId || "",
        license_type: LicenseType.Environmental,
        license_number: "BVMT-2024-004",
        issue_date: new Date("2024-04-05"),
        expiration_date: new Date("2025-04-05"),
      },
      {
        license_id: crypto.randomUUID(),
        business_id: businessId || "",
        license_type: LicenseType.ConstructionSafety,
        license_number: "ATXD-2024-005",
        issue_date: new Date("2024-05-12"),
        expiration_date: new Date("2025-05-12"),
      },
    ];
    setLicenses(sampleLicenses);
  }, [businessId]);

  const getLicenseTypeLabel = (type: LicenseType): string => {
    switch (type) {
      case LicenseType.FireSafety:
        return "Giấy phép PCCC";
      case LicenseType.FoodSafety:
        return "Giấy chứng nhận ATTP";
      case LicenseType.PublicOrder:
        return "Giấy chứng nhận ANTT";
      case LicenseType.Environmental:
        return "Giấy xác nhận BVMT";
      case LicenseType.ConstructionSafety:
        return "Giấy phép ATXD";
      case LicenseType.HealthPractice:
        return "Giấy phép hành nghề y tế";
      case LicenseType.Other:
        return "Loại khác";
      default:
        return "Không xác định";
    }
  };

  const columns: MRT_ColumnDef<License>[] = [
    { accessorKey: "license_id", header: "Mã giấy phép" },
    { accessorKey: "license_number", header: "Số giấy phép" },
    {
      accessorKey: "license_type",
      header: "Loại giấy phép",
      Cell: ({ cell }) => getLicenseTypeLabel(cell.getValue<LicenseType>()),
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
      accessorKey: "expiration_date",
      header: "Trạng thái",
      Cell: ({ cell }) => {
        const expirationDate = cell.getValue<Date>();
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
      license_id: crypto.randomUUID(),
      business_id: businessId || "",
      license_number: "",
      license_type: LicenseType.FireSafety,
      issue_date: new Date(),
      expiration_date: new Date(),
    },
    validate: yupResolver(schema),
  });

  const handleAddLicense = (values: typeof form.values) => {
    setLicenses([...licenses, values as License]);
    form.reset();
    form.setFieldValue("license_id", crypto.randomUUID());
    form.setFieldValue("business_id", businessId || "");
    close();
  };

  return (
    <Box p="md">
      <Text size="xl" fw={700} mb="md">
        Danh Sách Giấy Phép Con
      </Text>
      <Button onClick={open} mb="md">
        Thêm giấy phép
      </Button>
      <MantineReactTable
        columns={columns}
        data={licenses}
        enableRowSelection
        enableColumnFilters
        enableGlobalFilter
      />

      <Modal opened={opened} onClose={close} title="Thêm giấy phép">
        <form onSubmit={form.onSubmit(handleAddLicense)}>
          <TextInput
            label="Số giấy phép"
            {...form.getInputProps("license_number")}
            mb="sm"
          />
          <Select
            label="Loại giấy phép"
            {...form.getInputProps("license_type")}
            data={[
              {
                value: LicenseType.FireSafety.toString(),
                label: "Giấy phép PCCC",
              },
              {
                value: LicenseType.FoodSafety.toString(),
                label: "Giấy chứng nhận ATTP",
              },
              {
                value: LicenseType.PublicOrder.toString(),
                label: "Giấy chứng nhận ANTT",
              },
              {
                value: LicenseType.Environmental.toString(),
                label: "Giấy xác nhận BVMT",
              },
              {
                value: LicenseType.ConstructionSafety.toString(),
                label: "Giấy phép ATXD",
              },
              {
                value: LicenseType.HealthPractice.toString(),
                label: "Giấy phép hành nghề y tế",
              },
              { value: LicenseType.Other.toString(), label: "Loại khác" },
            ]}
            mb="sm"
          />
          <DateInput
            label="Ngày cấp"
            {...form.getInputProps("issue_date")}
            mb="sm"
          />
          <DateInput
            label="Ngày hết hạn"
            {...form.getInputProps("expiration_date")}
            mb="sm"
          />
          <Group justify="right">
            <Button type="submit">Lưu</Button>
            <Button onClick={close} variant="outline">
              Hủy
            </Button>
          </Group>
        </form>
      </Modal>
    </Box>
  );
}

export default SubLicenses;
