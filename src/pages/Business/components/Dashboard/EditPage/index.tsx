import { useForm } from "@mantine/form";
import {
  Button,
  TextInput,
  Select,
  Box,
  Group,
  Title,
  NumberInput,
  Stack,
  SimpleGrid,
  Divider,
} from "@mantine/core";
import { Timestamp } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import * as Yup from "yup";
import type { BusinessOwner } from "../../../../../types/business";
import {
  BusinessType,
  Gender,
  IdentificationType,
} from "../../../../../types/business";
import { DateInput } from "@mantine/dates";

import { useNavigate, useParams } from "react-router-dom";
import { dantoc } from "../../../../../data/dantoc";
import { quoctich } from "../../../../../data/quoctich";
import tree from "../../../../../data/tree.json";
import { useMemo, useEffect } from "react";
import {
  useGetBusinessById,
  useUpdateBusiness,
} from "../../../../../tanstack/useBusinessQueries";
import { notifications } from "@mantine/notifications";
import { useGetAllIndustries } from "../../../../../tanstack/useIndustryQueries";

function TestPage() {
  const navigate = useNavigate();
  const { businessId } = useParams();
  const {
    data: businessData,
    isLoading,
    isError,
  } = useGetBusinessById(businessId || "");
  const updateBusinessMutation = useUpdateBusiness();
  const { data: industries } = useGetAllIndustries();

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
      .test("valid-industry", "Ngành nghề không hợp lệ", function (value) {
        if (!value) return false;
        const validIndustryCodes = industries?.map((ind) => ind.code) || [];
        return validIndustryCodes.includes(value);
      }),
    issue_date: Yup.date().required("Ngày cấp không được để trống"),
    phone_number: Yup.string().nullable(),
    email: Yup.string()
      .email("Email không hợp lệ")
      .nullable()
      .test("email-format", "Email không hợp lệ", function (value) {
        if (!value) return true; // Allow empty
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
      }),
    fax: Yup.string().nullable(),
    website: Yup.string()
      .nullable()
      .test("website-format", "URL không hợp lệ", function (value) {
        if (!value) return true; // Allow empty
        try {
          new URL(value.startsWith("http") ? value : `https://${value}`);
          return true;
        } catch {
          return false;
        }
      }),
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
    ward: Yup.string()
      .required("Xã/Phường không được để trống")
      .test(
        "valid-ward",
        "Xã/Phường không hợp lệ với Tỉnh/TP đã chọn",
        function (value) {
          const province = this.parent.province;
          if (!province || !value) return false;
          const selectedProvince = tree.find((p) => p.name === province);
          if (!selectedProvince) return false;
          const validWards = selectedProvince.wards.map((w) => w.name);
          return validWards.includes(value);
        }
      ),
  });

  // Khởi tạo form với useForm và validate bằng Yup
  const form = useForm({
    initialValues: {
      business_id: uuidv4(),
      business_code: "",
      business_name: "",
      business_type: "" as string,
      address: "",
      industry: "",
      issue_date: null as Date | null,
      phone_number: "",
      email: "",
      fax: "",
      website: "",
      citizen_id: "",
      registered_capital: 0,
      tax_code: "",
      legal_representative: "",
      share_price: 0,
      total_shares: 0,
      owner_id: uuidv4(),
      owner_name: "",
      gender: "" as string,
      ethnicity: "",
      nationality: "",
      birthdate: null as Date | null,
      identification_type: "" as string,
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
  console.log("Initial form values:", form.values);
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
  const industryOptions = useMemo(
    () => (industries || []).map((i) => ({ value: i.code, label: i.name })),
    [industries]
  );

  // Reset ward when province changes
  const handleProvinceChange = (value: string | null) => {
    form.setFieldValue("province", value || "");
    form.setFieldValue("ward", "");
  };

  useEffect(() => {
    if (businessData) {
      const data: any = businessData;
      const owner = data.owner;
      form.setValues({
        business_id: data.business_id || "",
        business_code: data.business_code || "",
        business_name: data.business_name || "",
        business_type: data.business_type ? String(data.business_type) : "",
        address: data.address || "",
        industry: data.industry || "",
        issue_date: data.issue_date ? new Date(data.issue_date) : null,
        phone_number: data.phone_number || "",
        email: data.email || "",
        fax: data.fax || "",
        website: data.website || "",
        owner_id: owner ? owner.id || "" : "",
        owner_name: owner ? owner.name || "" : "",
        gender: owner ? String(owner.gender) : "",
        ethnicity: owner ? owner.ethnicity || "" : "",
        nationality: owner ? owner.nationality || "" : "",
        birthdate: owner && owner.birthdate ? new Date(owner.birthdate) : null,
        identification_type: owner ? String(owner.identification_type) : "",
        identification_number: owner ? owner.identification_number || "" : "",
        license_date:
          owner && owner.license_date ? new Date(owner.license_date) : null,
        place_of_licensing: owner ? owner.place_of_licensing || "" : "",
        permanent_residence: owner ? owner.permanent_residence || "" : "",
        address_owner: owner ? owner.address || "" : "",
        position: owner ? owner.position || "" : "",
        registered_capital:
          typeof data.registered_capital === "number"
            ? data.registered_capital
            : 0,
        tax_code: data.tax_code || "",
        legal_representative: data.legal_representative || "",
        share_price:
          typeof data.share_price === "number" ? data.share_price : 0,
        total_shares:
          typeof data.total_shares === "number" ? data.total_shares : 0,
        created_at: data.created_at
          ? typeof data.created_at.toDate === "function"
            ? data.created_at.toDate()
            : new Date(data.created_at)
          : new Date(),
        updated_at: data.updated_at
          ? typeof data.updated_at.toDate === "function"
            ? data.updated_at.toDate()
            : new Date(data.updated_at)
          : new Date(),
        province: data.province || "",
        ward: data.ward || "",
        citizen_id: data.citizen_id || "",
      });
    }
  }, [businessData]);

  if (isLoading) return <Box p="md">Đang tải dữ liệu doanh nghiệp...</Box>;
  if (isError)
    return (
      <Box p="md" c="red">
        Lỗi khi tải dữ liệu doanh nghiệp.
      </Box>
    );

  // Hàm xử lý cập nhật dữ liệu lên Firebase
  const handleSubmit = async (values: typeof form.values) => {
    try {
      const businessData = {
        business_id: values.business_id,
        business_name: values.business_name,
        address: values.address,
        province: values.province,
        ward: values.ward,
        phone_number: values.phone_number || "",
        email: values.email || "",
        fax: values.fax || "",
        website: values.website || "",
        industry: values.industry,
        business_type: Number(values.business_type) as BusinessType,
        issue_date: values.issue_date
          ? Timestamp.fromDate(values.issue_date as unknown as Date)
          : Timestamp.fromDate(new Date()),
        business_code: values.business_code,
        created_at: values.created_at,
        updated_at: Timestamp.fromDate(new Date()), // Cập nhật thời gian sửa đổi
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
        name: values.owner_name,
        gender: Number(values.gender) as Gender,
        ethnicity: values.ethnicity,
        nationality: values.nationality,
        birthdate: values.birthdate ?? new Date(),
        identification_type: Number(
          values.identification_type
        ) as IdentificationType,
        identification_number: values.identification_number,
        license_date: values.license_date ?? new Date(),
        place_of_licensing: values.place_of_licensing,
        permanent_residence: values.permanent_residence,
        address: values.address_owner,
      };

      if (values.business_type === "2" || values.business_type === "3") {
        Object.assign(ownerData, { position: values.position });
      }

      // Sử dụng mutation hook để cập nhật
      await updateBusinessMutation.mutateAsync({
        businessId: values.business_id,
        businessData: {
          ...businessData,
          owner: ownerData,
        } as any,
      });
      notifications.show({
        title: "Thành công",
        message: "Dữ liệu đã được cập nhật thành công!",
        color: "green",
      });

      navigate(`/business`); // Chuyển về trang chi tiết
    } catch (error) {
      console.error("Lỗi khi cập nhật dữ liệu: ", error);
      notifications.show({
        title: "Lỗi",
        message: "Đã xảy ra lỗi khi cập nhật dữ liệu!",
        color: "red",
      });
    }
  };

  return (
    <Box m="md">
      <Stack gap="md">
        <Title order={2} mb="md">
          Sửa Dữ Liệu Doanh Nghiệp
        </Title>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          <TextInput
            label="Mã ID"
            {...form.getInputProps("business_id")}
            disabled
            mb="sm"
            required
          />
          <TextInput
            label="Mã số"
            {...form.getInputProps("business_code")}
            placeholder="Nhập mã số kinh doanh"
            mb="sm"
            required
          />
          <TextInput
            label="Tên doanh nghiệp"
            {...form.getInputProps("business_name")}
            placeholder="Nhập tên doanh nghiệp"
            mb="sm"
            required
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
            required
          />
          <Select
            label="Tỉnh/Thành phố"
            data={provinceOptions}
            placeholder="Chọn tỉnh/thành phố"
            value={form.values.province}
            onChange={handleProvinceChange}
            searchable
            clearable
            mb="sm"
            error={form.errors.province}
            required
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
            required
          />
          <TextInput
            label="Địa chỉ"
            {...form.getInputProps("address")}
            placeholder="Nhập địa chỉ"
            mb="sm"
            required
          />
          <Select
            label="Ngành nghề"
            searchable
            clearable
            data={industryOptions}
            placeholder="Chọn ngành nghề"
            {...form.getInputProps("industry")}
            mb="sm"
            key={`industry-${form.values.industry}`}
            maxDropdownHeight={200}
            required
          />
          <DateInput
            label="Ngày cấp"
            {...form.getInputProps("issue_date")}
            placeholder="Chọn ngày cấp"
            mb="sm"
            required
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
          {/* Dữ liệu theo loại hình */}
          {form.values.business_type === "1" && (
            <NumberInput
              label="Vốn đăng ký"
              {...form.getInputProps("registered_capital")}
              placeholder="Nhập vốn đăng ký (VNĐ)"
              mb="sm"
              required
            />
          )}
          {(form.values.business_type === "2" ||
            form.values.business_type === "3") && (
            <>
              <TextInput
                label="Mã số thuế"
                {...form.getInputProps("tax_code")}
                placeholder="Nhập mã số thuế"
                mb="sm"
                required
              />
              <NumberInput
                label="Vốn đăng ký"
                {...form.getInputProps("registered_capital")}
                placeholder="Nhập vốn đăng ký (VNĐ)"
                mb="sm"
                thousandSeparator
                required
              />
              {form.values.business_type === "3" && (
                <>
                  <NumberInput
                    label="Giá cổ phiếu"
                    {...form.getInputProps("share_price")}
                    placeholder="Nhập giá cổ phiếu (VNĐ)"
                    mb="sm"
                    thousandSeparator
                    required
                  />
                  <NumberInput
                    label="Tổng số cổ phần"
                    {...form.getInputProps("total_shares")}
                    placeholder="Nhập tổng số cổ phần"
                    mb="sm"
                    thousandSeparator
                    required
                  />
                </>
              )}
            </>
          )}
        </SimpleGrid>

        <Divider my="md" />
        {form.values.business_type === "1" && (
          <>
            <Title order={3} mb="md">
              Thông Tin Chủ Sở Hữu
            </Title>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
              <TextInput
                label="Mã chủ sở hữu"
                {...form.getInputProps("owner_id")}
                disabled
                mb="sm"
                required
              />
              <TextInput
                label="Tên chủ sở hữu"
                {...form.getInputProps("owner_name")}
                placeholder="Nhập tên chủ sở hữu"
                mb="sm"
                required
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
                required
              />
              <Select
                label="Dân tộc"
                searchable
                data={dantoc}
                placeholder="Chọn dân tộc"
                {...form.getInputProps("ethnicity")}
                mb="sm"
                key={`ethnicity-${form.values.ethnicity}`}
                required
              />
              <Select
                label="Quốc tịch"
                searchable
                data={quoctich}
                placeholder="Chọn quốc tịch"
                {...form.getInputProps("nationality")}
                mb="sm"
                key={`nationality-${form.values.nationality}`}
                required
              />
              <DateInput
                label="Ngày sinh"
                {...form.getInputProps("birthdate")}
                placeholder="Chọn ngày sinh"
                mb="sm"
                required
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
                required
              />
              <TextInput
                label="Số giấy tờ"
                {...form.getInputProps("identification_number")}
                placeholder="Nhập số CMND/CCCD (9-12 số)"
                mb="sm"
                required
              />
              <DateInput
                label="Ngày cấp giấy phép"
                {...form.getInputProps("license_date")}
                placeholder="Chọn ngày cấp giấy phép"
                mb="sm"
                required
              />
              <TextInput
                label="Nơi cấp giấy phép"
                {...form.getInputProps("place_of_licensing")}
                placeholder="Nhập nơi cấp giấy phép"
                mb="sm"
                required
              />
              <TextInput
                label="Hộ khẩu thường trú"
                {...form.getInputProps("permanent_residence")}
                placeholder="Nhập hộ khẩu thường trú"
                mb="sm"
                required
              />
              <TextInput
                label="Địa chỉ"
                {...form.getInputProps("address_owner")}
                placeholder="Nhập địa chỉ"
                mb="sm"
                required
              />
            </SimpleGrid>
          </>
        )}
        {(form.values.business_type == "2" ||
          form.values.business_type == "3") && (
          <>
            <Title order={3} mb="md">
              Thông Tin Người Đại Diện
            </Title>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
              <TextInput
                label="Mã người đại diện"
                {...form.getInputProps("owner_id")}
                disabled
                mb="sm"
                required
              />
              <TextInput
                label="Tên người đại diện"
                {...form.getInputProps("owner_name")}
                placeholder="Nhập tên người đại diện"
                mb="sm"
                required
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
                required
              />
              <TextInput
                label="Chức danh"
                {...form.getInputProps("position")}
                placeholder="Nhập chức danh"
                mb="sm"
                required
              />
              <Select
                label="Dân tộc"
                searchable
                data={dantoc}
                placeholder="Chọn dân tộc"
                {...form.getInputProps("ethnicity")}
                mb="sm"
                key={`ethnicity-${form.values.ethnicity}`}
                required
              />
              <Select
                label="Quốc tịch"
                searchable
                data={quoctich}
                placeholder="Chọn quốc tịch"
                {...form.getInputProps("nationality")}
                mb="sm"
                key={`nationality-${form.values.nationality}`}
                required
              />
              <DateInput
                label="Ngày sinh"
                {...form.getInputProps("birthdate")}
                placeholder="Chọn ngày sinh"
                mb="sm"
                required
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
                required
              />
              <TextInput
                label="Số giấy tờ"
                {...form.getInputProps("identification_number")}
                placeholder="Nhập số CMND/CCCD (9-12 số)"
                mb="sm"
                required
              />
              <DateInput
                label="Ngày cấp giấy phép"
                {...form.getInputProps("license_date")}
                placeholder="Chọn ngày cấp giấy phép"
                mb="sm"
                required
              />
              <TextInput
                label="Nơi cấp giấy phép"
                {...form.getInputProps("place_of_licensing")}
                placeholder="Nhập nơi cấp giấy phép"
                mb="sm"
                required
              />
              <TextInput
                label="Hộ khẩu thường trú"
                {...form.getInputProps("permanent_residence")}
                placeholder="Nhập hộ khẩu thường trú"
                mb="sm"
                required
              />
              <TextInput
                label="Địa chỉ"
                {...form.getInputProps("address_owner")}
                placeholder="Nhập địa chỉ"
                mb="sm"
                required
              />
            </SimpleGrid>
          </>
        )}

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Group justify="end" mt="md">
            <Button
              type="submit"
              loading={updateBusinessMutation.isPending}
              disabled={!form.isValid()}
            >
              {updateBusinessMutation.isPending
                ? "Đang lưu..."
                : "Lưu thay đổi"}
            </Button>
          </Group>
        </form>
      </Stack>
    </Box>
  );
}

export default TestPage;
