import { useForm } from "@mantine/form";
import {
  Button,
  TextInput,
  Select,
  Box,
  Group,
  Title,
  NumberInput,
  AppShell,
  Burger,
  useMantineColorScheme,
  ActionIcon,
  NavLink,
  Stack,
  SimpleGrid,
  Divider,
} from "@mantine/core";
import { Timestamp, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../../../../firebase/firebaseConfig";
import { v4 as uuidv4 } from "uuid";
import * as Yup from "yup";
import type { BusinessOwner } from "../../../../../types/business";
import {
  BusinessType,
  Gender,
  IdentificationType,
} from "../../../../../types/business";
import { DateInput } from "@mantine/dates";
import { useDisclosure } from "@mantine/hooks";
import {
  IconSun,
  IconMoon,
  IconHome2,
  IconChevronRight,
} from "@tabler/icons-react";
import { NavLink as RouterNavLink, useNavigate } from "react-router-dom";
import { dantoc } from "../../../../../data/dantoc";
import { quoctich } from "../../../../../data/quoctich";
import tree from "../../../../../data/tree.json";
import { useMemo } from "react";

function TestPage() {
  const [opened, { toggle }] = useDisclosure();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const navigate = useNavigate();

  // Định nghĩa schema validation với Yup
  const schema = Yup.object().shape({
    business_id: Yup.string().required("Mã ID không được để trống"),
    business_code: Yup.string()
      .required("Mã số không được để trống")
      .min(6, "Mã số phải có ít nhất 6 ký tự"),
    business_name: Yup.string()
      .required("Tên doanh nghiệp không được để trống")
      .min(2, "Tên phải có ít nhất 2 ký tự"),
    business_type: Yup.mixed<string>()
      .required("Loại hình không được để trống")
      .oneOf(["1", "2", "3"], "Loại hình không hợp lệ"),
    address: Yup.string()
      .required("Địa chỉ không được để trống")
      .min(5, "Địa chỉ phải có ít nhất 5 ký tự"),
    industry: Yup.string()
      .required("Ngành nghề không được để trống")
      .min(2, "Ngành nghề phải có ít nhất 2 ký tự"),
    issue_date: Yup.date().required("Ngày cấp không được để trống"),
    phone_number: Yup.string().nullable(),
    email: Yup.string().email("Email không hợp lệ").nullable(),
    fax: Yup.string().nullable(),
    website: Yup.string().url("URL không hợp lệ").nullable(),
    owner_name: Yup.string().when("business_type", (businessType, schema) =>
      Number(businessType) === 1
        ? schema
            .required("Tên chủ hộ không được để trống")
            .min(2, "Tên phải có ít nhất 2 ký tự")
        : schema
    ),
    citizen_id: Yup.string().when("business_type", (businessType, schema) =>
      Number(businessType) === 1
        ? schema
            .required("CMND/CCCD không được để trống")
            .matches(/^\d{9,12}$/, "CMND/CCCD phải là 9-12 số")
        : schema
    ),
    registered_capital: Yup.number().when(
      "business_type",
      (businessType, schema) =>
        Number(businessType) === 2 || Number(businessType) === 3
          ? schema
              .required("Vốn đăng ký không được để trống")
              .min(0, "Vốn phải lớn hơn hoặc bằng 0")
          : schema
    ),
    tax_code: Yup.string().when("business_type", (businessType, schema) =>
      Number(businessType) === 2 || Number(businessType) === 3
        ? schema
            .required("Mã số thuế không được để trống")
            .min(10, "Mã số thuế phải có ít nhất 10 ký tự")
        : schema
    ),
    legal_representative: Yup.string().when(
      "business_type",
      (businessType, schema) =>
        Number(businessType) === 2 || Number(businessType) === 3
          ? schema
              .required("Người đại diện không được để trống")
              .min(2, "Tên phải có ít nhất 2 ký tự")
          : schema
    ),
    share_price: Yup.number().when("business_type", (businessType, schema) =>
      Number(businessType) === 3
        ? schema
            .required("Giá cổ phiếu không được để trống")
            .min(0, "Giá phải lớn hơn hoặc bằng 0")
        : schema
    ),
    total_shares: Yup.number().when("business_type", (businessType, schema) =>
      Number(businessType) === 3
        ? schema
            .required("Tổng số cổ phần không được để trống")
            .min(1, "Số cổ phần phải lớn hơn 0")
        : schema
    ),
    owner_id: Yup.string().required("Mã chủ sở hữu không được để trống"),
    owner_name_owner: Yup.string()
      .required("Tên chủ sở hữu không được để trống")
      .min(2, "Tên phải có ít nhất 2 ký tự"),
    gender: Yup.mixed<string>()
      .required("Giới tính không được để trống")
      .oneOf(["1", "2", "3"], "Giới tính không hợp lệ"),
    ethnicity: Yup.string()
      .required("Dân tộc không được để trống")
      .min(2, "Dân tộc phải có ít nhất 2 ký tự"),
    nationality: Yup.string()
      .required("Quốc tịch không được để trống")
      .min(2, "Quốc tịch phải có ít nhất 2 ký tự"),
    birthdate: Yup.date().required("Ngày sinh không được để trống"),
    identification_type: Yup.mixed<string>()
      .required("Loại giấy tờ không được để trống")
      .oneOf(["1", "2", "3"], "Loại giấy tờ không hợp lệ"),
    identification_number: Yup.string()
      .required("Số giấy tờ không được để trống")
      .matches(/^\d{9,12}$/, "Số giấy tờ phải là 9-12 số"),
    license_date: Yup.date().required("Ngày cấp giấy phép không được để trống"),
    place_of_licensing: Yup.string()
      .required("Nơi cấp giấy phép không được để trống")
      .min(2, "Nơi cấp phải có ít nhất 2 ký tự"),
    permanent_residence: Yup.string()
      .required("Hộ khẩu thường trú không được để trống")
      .min(5, "Hộ khẩu phải có ít nhất 5 ký tự"),
    address_owner: Yup.string()
      .required("Địa chỉ không được để trống")
      .min(5, "Địa chỉ phải có ít nhất 5 ký tự"),
    position: Yup.string().when("business_type", (businessType, schema) =>
      Number(businessType) === 2 || Number(businessType) === 3
        ? schema
            .required("Chức vụ không được để trống")
            .min(2, "Chức vụ phải có ít nhất 2 ký tự")
        : schema
    ),
    province: Yup.string().required("Tỉnh/TP không được để trống"),
    ward: Yup.string().required("Xã/Phường không được để trống"),
  });

  // Khởi tạo form với useForm và validate bằng Yup
  const form = useForm({
    initialValues: {
      business_id: uuidv4(),
      business_code: "",
      business_name: "",
      business_type: "" as string, // Sẽ được ép kiểu sau khi chọn
      address: "",
      industry: "",
      issue_date: null as Date | null,
      phone_number: "",
      email: "",
      fax: "",
      website: "",
      owner_name: "",
      citizen_id: "",
      registered_capital: 0,
      tax_code: "",
      legal_representative: "",
      share_price: 0,
      total_shares: 0,
      owner_id: uuidv4(),
      owner_name_owner: "",
      gender: "" as string, // Sẽ được ép kiểu sau khi chọn
      ethnicity: "",
      nationality: "",
      birthdate: null as Date | null,
      identification_type: "" as string, // Sẽ được ép kiểu sau khi chọn
      identification_number: "",
      license_date: null as Date | null,
      place_of_licensing: "",
      permanent_residence: "",
      address_owner: "",
      position: "",
      created_at: Timestamp.fromDate(new Date()),
      updated_at: Timestamp.fromDate(new Date()),
      province: "",
      ward: "",
    },
    validate: (values) => {
      try {
        schema.validateSync(values, { abortEarly: false });
        return {};
      } catch (err) {
        if (err instanceof Yup.ValidationError) {
          return err.inner.reduce(
            (errors: Record<string, string>, error: Yup.ValidationError) => {
              if (error.path) errors[error.path] = error.message;
              return errors;
            },
            {}
          );
        }
        return {};
      }
    },
  });

  // Province/Ward options
  const provinceOptions = useMemo(
    () => tree.map((p) => ({ value: p.name, label: p.name })),
    []
  );
  const selectedProvince = tree.find((p) => p.name === form.values.province);
  const wardOptions = useMemo(
    () =>
      selectedProvince
        ? selectedProvince.wards.map((w) => ({ value: w.name, label: w.name }))
        : [],
    [form.values.province]
  );

  // Hàm xử lý gửi dữ liệu lên Firebase
  const handleSubmit = async (values: typeof form.values) => {
    try {
      const businessData = {
        business_id: values.business_id,
        business_name: values.business_name,
        address: values.address,
        phone_number: values.phone_number || "",
        email: values.email || "",
        fax: values.fax || "",
        website: values.website || "",
        industry: values.industry,
        business_type: values.business_type as unknown as BusinessType,
        issue_date: values.issue_date
          ? Timestamp.fromDate(values.issue_date as unknown as Date)
          : Timestamp.fromDate(new Date()),
        business_code: values.business_code,
        created_at: values.created_at,
        updated_at: values.updated_at,
      };

      if (values.business_type === "1") {
        Object.assign(businessData, {
          owner_name: values.owner_name,
          citizen_id: values.citizen_id,
          registered_capital: values.registered_capital,
        });
      } else if (values.business_type === "2" || values.business_type === "3") {
        Object.assign(businessData, {
          tax_code: values.tax_code,
          registered_capital: Number(values.registered_capital),
          legal_representative: values.legal_representative,
        });
        if (values.business_type === "3") {
          Object.assign(businessData, {
            share_price: values.share_price,
            total_shares: values.total_shares,
          });
        }
      }

      const ownerData: BusinessOwner = {
        id: values.owner_id,
        name: values.owner_name_owner,
        gender: values.gender as unknown as Gender,
        ethnicity: values.ethnicity,
        nationality: values.nationality,
        birthdate: values.birthdate ?? new Date(),
        identification_type:
          values.identification_type as unknown as IdentificationType,
        identification_number: values.identification_number,
        license_date: values.license_date ?? new Date(),
        place_of_licensing: values.place_of_licensing,
        permanent_residence: values.permanent_residence,
        address: values.address_owner,
      };

      if (values.business_type === "2" || values.business_type === "3") {
        Object.assign(ownerData, { position: values.position });
      }

      const businessRef = doc(db, "businesses", values.business_id);
      const docSnap = await getDoc(businessRef);
      if (docSnap.exists()) {
        throw new Error("business_id đã tồn tại!");
      }
      await setDoc(businessRef, {
        ...businessData,
        owner: ownerData,
      });

      alert("Dữ liệu đã được thêm thành công!");
      form.reset();
      form.setFieldValue("business_id", uuidv4());
      form.setFieldValue("owner_id", uuidv4());
    } catch (error) {
      console.error("Lỗi khi thêm dữ liệu: ", error);
      alert("Đã xảy ra lỗi khi thêm dữ liệu!");
    }
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
          to={"/"}
          label="Hộ kinh doanh / doanh nghiệp"
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
          to={"/test"}
          label="Test Page"
          leftSection={<IconHome2 size={16} stroke={1.5} />}
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
        <Box m="md">
          <Stack gap="md">
            <Title order={2} mb="md">
              Thêm Dữ Liệu Doanh Nghiệp
            </Title>
            <Title order={3} mb="md">
              Thông Tin Doanh Nghiệp
            </Title>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
              <TextInput
                label="Mã ID"
                {...form.getInputProps("business_id")}
                disabled
                mb="sm"
              />
              <TextInput
                label="Mã số"
                {...form.getInputProps("business_code")}
                placeholder="Nhập mã số kinh doanh"
                mb="sm"
              />
              <TextInput
                label="Tên doanh nghiệp"
                {...form.getInputProps("business_name")}
                placeholder="Nhập tên doanh nghiệp"
                mb="sm"
              />
              <Select
                label="Loại hình"
                {...form.getInputProps("business_type")}
                data={[
                  { value: "1", label: "Cá nhân" },
                  { value: "2", label: "Công ty TNHH" },
                  { value: "3", label: "Công ty Cổ phần" },
                ]}
                placeholder="Chọn loại hình"
                mb="sm"
                key={`business_type-${form.values.business_type}`}
              />
              <Select
                label="Tỉnh/Thành phố"
                data={provinceOptions}
                placeholder="Chọn tỉnh/thành phố"
                {...form.getInputProps("province")}
                searchable
                clearable
                mb="sm"
              />
              <Select
                label="Xã/Phường"
                data={wardOptions}
                placeholder="Chọn xã/phường"
                {...form.getInputProps("ward")}
                searchable
                clearable
                mb="sm"
                disabled={!form.values.province}
              />
              <TextInput
                label="Địa chỉ"
                {...form.getInputProps("address")}
                placeholder="Nhập địa chỉ"
                mb="sm"
              />
              <TextInput
                label="Ngành nghề"
                {...form.getInputProps("industry")}
                placeholder="Nhập ngành nghề"
                mb="sm"
              />
              <DateInput
                label="Ngày cấp"
                {...form.getInputProps("issue_date")}
                placeholder="Chọn ngày cấp"
                mb="sm"
              />
              <TextInput
                label="Số điện thoại"
                {...form.getInputProps("phone_number")}
                placeholder="Nhập số điện thoại"
                mb="sm"
              />
              <TextInput
                label="Email"
                {...form.getInputProps("email")}
                placeholder="Nhập email"
                mb="sm"
              />
              <TextInput
                label="Fax"
                {...form.getInputProps("fax")}
                placeholder="Nhập số fax"
                mb="sm"
              />
              <TextInput
                label="Website"
                {...form.getInputProps("website")}
                placeholder="Nhập URL website"
                mb="sm"
              />
            </SimpleGrid>

            {/* Dữ liệu theo loại hình */}
            {form.values.business_type === "1" && (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                <TextInput
                  label="Tên chủ hộ"
                  {...form.getInputProps("owner_name")}
                  placeholder="Nhập tên chủ hộ"
                  mb="sm"
                />
                <TextInput
                  label="CMND/CCCD"
                  {...form.getInputProps("citizen_id")}
                  placeholder="Nhập CMND/CCCD (9-12 số)"
                  mb="sm"
                />
                <NumberInput
                  label="Vốn đăng ký"
                  {...form.getInputProps("registered_capital")}
                  placeholder="Nhập vốn đăng ký (VNĐ)"
                  mb="sm"
                />
              </SimpleGrid>
            )}
            {(form.values.business_type === "2" ||
              form.values.business_type === "3") && (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                <TextInput
                  label="Mã số thuế"
                  {...form.getInputProps("tax_code")}
                  placeholder="Nhập mã số thuế"
                  mb="sm"
                />
                <NumberInput
                  label="Vốn đăng ký"
                  {...form.getInputProps("registered_capital")}
                  placeholder="Nhập vốn đăng ký (VNĐ)"
                  mb="sm"
                />
                <TextInput
                  label="Người đại diện pháp luật"
                  {...form.getInputProps("legal_representative")}
                  placeholder="Nhập tên người đại diện"
                  mb="sm"
                />
                {form.values.business_type === "3" && (
                  <>
                    <NumberInput
                      label="Giá cổ phiếu"
                      {...form.getInputProps("share_price")}
                      placeholder="Nhập giá cổ phiếu (VNĐ)"
                      mb="sm"
                    />
                    <NumberInput
                      label="Tổng số cổ phần"
                      {...form.getInputProps("total_shares")}
                      placeholder="Nhập tổng số cổ phần"
                      mb="sm"
                    />
                  </>
                )}
              </SimpleGrid>
            )}

            <Divider my="md" />

            <Title order={3} mb="md">
              Thông Tin Chủ Sở Hữu
            </Title>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
              <TextInput
                label="Mã chủ sở hữu"
                {...form.getInputProps("owner_id")}
                disabled
                mb="sm"
              />
              <TextInput
                label="Tên chủ sở hữu"
                {...form.getInputProps("owner_name_owner")}
                placeholder="Nhập tên chủ sở hữu"
                mb="sm"
              />
              <Select
                label="Giới tính"
                {...form.getInputProps("gender")}
                data={[
                  { value: "1", label: "Nam" },
                  { value: "2", label: "Nữ" },
                  { value: "3", label: "Khác" },
                ]}
                placeholder="Chọn giới tính"
                mb="sm"
                key={`gender-${form.values.gender}`}
              />
              <Select
                label="Dân tộc"
                searchable
                data={dantoc}
                placeholder="Chọn dân tộc"
                {...form.getInputProps("ethnicity")}
                mb="sm"
                key={`ethnicity-${form.values.ethnicity}`}
              />
              <Select
                label="Quốc tịch"
                searchable
                data={quoctich}
                placeholder="Chọn quốc tịch"
                {...form.getInputProps("nationality")}
                mb="sm"
                key={`nationality-${form.values.nationality}`}
              />
              <DateInput
                label="Ngày sinh"
                {...form.getInputProps("birthdate")}
                placeholder="Chọn ngày sinh"
                mb="sm"
              />
              <Select
                label="Loại giấy tờ"
                {...form.getInputProps("identification_type")}
                data={[
                  { value: "1", label: "CMND/CCCD" },
                  { value: "2", label: "Hộ chiếu" },
                  { value: "3", label: "Khác" },
                ]}
                placeholder="Chọn loại giấy tờ"
                mb="sm"
                key={`identification_type-${form.values.identification_type}`}
              />
              <TextInput
                label="Số giấy tờ"
                {...form.getInputProps("identification_number")}
                placeholder="Nhập số CMND/CCCD (9-12 số)"
                mb="sm"
              />
              <DateInput
                label="Ngày cấp giấy phép"
                {...form.getInputProps("license_date")}
                placeholder="Chọn ngày cấp giấy phép"
                mb="sm"
              />
              <TextInput
                label="Nơi cấp giấy phép"
                {...form.getInputProps("place_of_licensing")}
                placeholder="Nhập nơi cấp giấy phép"
                mb="sm"
              />
              <TextInput
                label="Hộ khẩu thường trú"
                {...form.getInputProps("permanent_residence")}
                placeholder="Nhập hộ khẩu thường trú"
                mb="sm"
              />
              <TextInput
                label="Địa chỉ"
                {...form.getInputProps("address_owner")}
                placeholder="Nhập địa chỉ"
                mb="sm"
              />
              {(form.values.business_type === "2" ||
                form.values.business_type === "3") && (
                <TextInput
                  label="Chức vụ"
                  {...form.getInputProps("position")}
                  placeholder="Nhập chức vụ"
                  mb="sm"
                />
              )}
            </SimpleGrid>

            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Group justify="end" mt="md">
                <Button
                  type="submit"
                  onClick={() => {
                    if (form.isValid()) {
                      console.log("Form values:", form.values);
                      navigate(
                        `/business/${form.values.business_id}/dashboard`
                      );
                    }
                  }}
                >
                  Thêm Dữ Liệu
                </Button>
              </Group>
            </form>
          </Stack>
        </Box>
      </AppShell.Main>
    </AppShell>
  );
}

export default TestPage;
