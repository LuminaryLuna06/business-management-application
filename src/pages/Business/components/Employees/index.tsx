import {
  Box,
  Text,
  Button,
  Modal,
  Group,
  Card,
  SimpleGrid,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { MantineReactTable, type MRT_ColumnDef } from "mantine-react-table";
import { useForm, yupResolver } from "@mantine/form";
import * as Yup from "yup";
import { Gender, type Worker } from "../../../../types/worker"; // Giả định file chứa enum Gender
import { TextInput, Select } from "@mantine/core";
import { DateInput } from "@mantine/dates";

const schema = Yup.object().shape({
  worker_name: Yup.string()
    .required("Tên nhân viên không được để trống")
    .min(2, "Tên phải có ít nhất 2 ký tự"),
  birth_date: Yup.date()
    .required("Ngày sinh không được để trống")
    .max(new Date(), "Ngày sinh không được trong tương lai"),
  gender: Yup.mixed<Gender>()
    .required("Giới tính không được để trống")
    .oneOf([Gender.Male, Gender.Female], "Giới tính không hợp lệ"),
  insurance_status: Yup.boolean(),
  fire_safety_training: Yup.boolean(),
  food_safety_training: Yup.boolean(),
});

function Employees() {
  const { businessId } = useParams();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [opened, { open, close }] = useDisclosure(false);

  useEffect(() => {
    const sampleWorkers: Worker[] = [
      {
        worker_id: crypto.randomUUID(),
        business_id: businessId || "",
        worker_name: "Nguyen Van A",
        birth_date: new Date("1990-05-15"),
        gender: Gender.Male,
        insurance_status: true,
        fire_safety_training: true,
        food_safety_training: false,
      },
      {
        worker_id: crypto.randomUUID(),
        business_id: businessId || "",
        worker_name: "Tran Thi B",
        birth_date: new Date("1992-08-22"),
        gender: Gender.Female,
        insurance_status: true,
        fire_safety_training: false,
        food_safety_training: true,
      },
      {
        worker_id: crypto.randomUUID(),
        business_id: businessId || "",
        worker_name: "Le Van C",
        birth_date: new Date("1985-03-10"),
        gender: Gender.Male,
        insurance_status: false,
        fire_safety_training: true,
        food_safety_training: true,
      },
      {
        worker_id: crypto.randomUUID(),
        business_id: businessId || "",
        worker_name: "Pham Thi D",
        birth_date: new Date("1995-11-30"),
        gender: Gender.Female,
        insurance_status: true,
        fire_safety_training: false,
        food_safety_training: false,
      },
      {
        worker_id: crypto.randomUUID(),
        business_id: businessId || "",
        worker_name: "Hoang Van E",
        birth_date: new Date("1988-07-05"),
        gender: Gender.Male,
        insurance_status: false,
        fire_safety_training: true,
        food_safety_training: true,
      },
    ];
    setWorkers(sampleWorkers);
  }, [businessId]);

  const columns: MRT_ColumnDef<Worker>[] = [
    { accessorKey: "worker_id", header: "Mã nhân viên" },
    { accessorKey: "worker_name", header: "Tên nhân viên" },
    {
      accessorKey: "birth_date",
      header: "Ngày sinh",
      Cell: ({ cell }) => cell.getValue<Date>()?.toLocaleDateString() || "",
    },
    {
      accessorKey: "gender",
      header: "Giới tính",
      Cell: ({ cell }) =>
        cell.getValue<Gender>() === Gender.Male ? "Nam" : "Nữ",
    },
    {
      accessorKey: "insurance_status",
      header: "Bảo hiểm",
      Cell: ({ cell }) => (cell.getValue<boolean>() ? "Đã đóng" : "Chưa đóng"),
    },
    {
      accessorKey: "fire_safety_training",
      header: "Đào tạo PCCC",
      Cell: ({ cell }) => (cell.getValue<boolean>() ? "Có" : "Không"),
    },
    {
      accessorKey: "food_safety_training",
      header: "Đào tạo ATTP",
      Cell: ({ cell }) => (cell.getValue<boolean>() ? "Có" : "Không"),
    },
  ];

  // Form với useForm và Yup
  const form = useForm({
    initialValues: {
      worker_id: crypto.randomUUID(),
      business_id: businessId || "",
      worker_name: "",
      birth_date: new Date(),
      gender: Gender.Male,
      insurance_status: false,
      fire_safety_training: false,
      food_safety_training: false,
    },
    validate: yupResolver(schema),
  });

  const handleAddWorker = (values: typeof form.values) => {
    setWorkers([...workers, values as Worker]);
    form.reset();
    form.setFieldValue("worker_id", crypto.randomUUID());
    form.setFieldValue("business_id", businessId || "");
    close();
  };

  // Thống kê số lượng
  const insuranceCount = workers.filter((w) => w.insurance_status).length;
  const foodSafetyCount = workers.filter((w) => w.food_safety_training).length;
  const fireSafetyCount = workers.filter((w) => w.fire_safety_training).length;

  return (
    <Box p="md">
      <Text size="xl" fw={700} mb="md">
        Danh Sách Nhân Sự
      </Text>
      {/* Thống kê nhanh */}
      <SimpleGrid cols={{ base: 1, sm: 4 }} mb="md">
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Text size="lg" fw={500}>
            Tổng số nhân sự
          </Text>
          <Text size="2rem" fw={700} color="violet" mt="xs">
            {workers.length}
          </Text>
        </Card>
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Text size="lg" fw={500}>
            Đã đóng bảo hiểm
          </Text>
          <Text size="2rem" fw={700} color="blue" mt="xs">
            {insuranceCount}
          </Text>
        </Card>
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Text size="lg" fw={500}>
            Đào tạo ATTP
          </Text>
          <Text size="2rem" fw={700} color="green" mt="xs">
            {foodSafetyCount}
          </Text>
        </Card>
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Text size="lg" fw={500}>
            Đào tạo PCCC
          </Text>
          <Text size="2rem" fw={700} color="red" mt="xs">
            {fireSafetyCount}
          </Text>
        </Card>
      </SimpleGrid>
      <Group mb="md">
        <Button onClick={open}>Thêm nhân viên</Button>
        <Button variant="outline">Import dữ liệu</Button>
      </Group>
      <MantineReactTable
        columns={columns}
        data={workers}
        enableRowSelection
        enableColumnFilters
        enableGlobalFilter
      />

      <Modal opened={opened} onClose={close} title="Thêm nhân viên">
        <form onSubmit={form.onSubmit(handleAddWorker)}>
          <TextInput
            label="Tên nhân viên"
            {...form.getInputProps("worker_name")}
            mb="sm"
          />
          <DateInput
            label="Ngày sinh"
            {...form.getInputProps("birth_date")}
            mb="sm"
          />
          <Select
            label="Giới tính"
            {...form.getInputProps("gender")}
            data={[
              { value: Gender.Male.toString(), label: "Nam" },
              { value: Gender.Female.toString(), label: "Nữ" },
            ]}
            mb="sm"
          />
          <Select
            label="Bảo hiểm"
            {...form.getInputProps("insurance_status")}
            data={[
              { value: "true", label: "Có" },
              { value: "false", label: "Không" },
            ]}
            mb="sm"
          />
          <Select
            label="Đào tạo PCCC"
            {...form.getInputProps("fire_safety_training")}
            data={[
              { value: "true", label: "Có" },
              { value: "false", label: "Không" },
            ]}
            mb="sm"
          />
          <Select
            label="Đào tạo ATTP"
            {...form.getInputProps("food_safety_training")}
            data={[
              { value: "true", label: "Có" },
              { value: "false", label: "Không" },
            ]}
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

export default Employees;
