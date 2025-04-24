import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
  Button,
  Input,
  Typography,
} from "@material-tailwind/react";
import { TextField, Button as MuiButton, Autocomplete, IconButton, Divider } from '@mui/material';
import { FaEdit, FaArrowLeft, FaSave, FaTimes, FaTimesCircle } from "react-icons/fa";
import { fetchMaterialCategories, getMaterialById, updateMaterial, checkMaterialCodeExists } from "./materialService";
import { fetchActiveUnits } from "../unit/unitService";
import { getPartnersByType } from "../partner/partnerService";
import PageHeader from '@/components/PageHeader';
import SuccessAlert from "@/components/SuccessAlert";
import ImageUploadBox from '@/components/ImageUploadBox';

const SUPPLIER_TYPE_ID = 2;

const DetailMaterialPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [material, setMaterial] = useState(null);
  const [editedMaterial, setEditedMaterial] = useState(null);
  const [loading, setLoading] = useState(false);
  const [units, setUnits] = useState([]);
  const [materialCategories, setMaterialCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [errors, setErrors] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [materialCodeError, setMaterialCodeError] = useState(""); // Thêm state cho lỗi trùng mã
  const [previewImage, setPreviewImage] = useState(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [materialData, unitsData, categoriesData, suppliersData] = await Promise.all([
          getMaterialById(id),
          fetchActiveUnits(),
          fetchMaterialCategories(),
          getPartnersByType(SUPPLIER_TYPE_ID)
        ]);

        const mappedSuppliers = (suppliersData?.partners || [])
          .map((s) => {
            const t = s.partnerTypes.find(
              (pt) => pt.partnerType.typeId === SUPPLIER_TYPE_ID
            );
            return {
              value: s.partnerId,
              label: s.partnerName,
              partnerCode: t?.partnerCode || "",
              address: s.address,
              phone: s.phone,
              contactName: s.contactName,
            };
          })
          .filter((s) => s.partnerCode !== "");

        setSuppliers(mappedSuppliers);

        const mappedMaterial = {
          ...materialData,
          supplierIds: materialData.supplierIds || []
        };

        setMaterial(mappedMaterial);
        setEditedMaterial(mappedMaterial);
        setUnits(unitsData);
        setMaterialCategories(categoriesData?.content || []);

      } catch (error) {
        console.error("Error loading material details:", error);
        setErrors({ message: "Không thể tải thông tin nguyên vật liệu" });
      }
    };
    loadData();
  }, [id]);

  // Hàm kiểm tra trùng mã vật tư
  const handleCheckMaterialCode = async (newCode) => {
    setMaterialCodeError("");
    setValidationErrors(prev => ({
      ...prev,
      materialCode: ""
    }));

    setEditedMaterial(prev => ({
      ...prev,
      materialCode: newCode || ''
    }));

    if (newCode.trim() && newCode !== material.materialCode) {
      try {
        const exists = await checkMaterialCodeExists(newCode, id);
        if (exists) {
          setMaterialCodeError("Mã nguyên vật liệu này đã tồn tại!");
        }
      } catch (error) {
        console.error("❌ Lỗi kiểm tra mã nguyên vật liệu:", error);
        setMaterialCodeError("Lỗi khi kiểm tra mã nguyên vật liệu!");
      }
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedMaterial(material);
    setIsEditing(false);
    setValidationErrors({});
    setMaterialCodeError(""); // Reset lỗi trùng mã
    setPreviewImage(null);
  };

  const handleSave = async () => {
    const newErrors = {};

    if (!editedMaterial.materialCode || editedMaterial.materialCode.trim() === "") {
      newErrors.materialCode = "Mã nguyên vật liệu không được để trống!";
    }
    if (!editedMaterial.materialName || editedMaterial.materialName.trim() === "") {
      newErrors.materialName = "Tên nguyên vật liệu không được để trống!";
    }
    if (!editedMaterial.unitId) {
      newErrors.unitId = "Vui lòng chọn đơn vị!";
    }
    if (!editedMaterial.typeId) {
      newErrors.typeId = "Vui lòng chọn danh mục!";
    }
    if (!editedMaterial.supplierIds || editedMaterial.supplierIds.length === 0) {
      newErrors.supplierIds = "Vui lòng chọn ít nhất một nhà cung cấp!";
    }

    setValidationErrors(newErrors);

    // Kiểm tra lỗi trùng mã
    if (editedMaterial.materialCode !== material.materialCode) {
      const codeExists = await checkMaterialCodeExists(editedMaterial.materialCode, id);
      if (codeExists) {
        setMaterialCodeError("Mã nguyên vật liệu đã tồn tại!");
        newErrors.materialCode = "Mã nguyên vật liệu đã tồn tại!";
      }
    }

    if (Object.keys(newErrors).length === 0 && !materialCodeError) {
      try {
        setLoading(true);
        const formData = new FormData();
        formData.append("materialCode", editedMaterial.materialCode.trim());
        formData.append("materialName", editedMaterial.materialName.trim());
        formData.append("description", editedMaterial.description?.trim() || "");
        formData.append("unitId", parseInt(editedMaterial.unitId));
        formData.append("typeId", parseInt(editedMaterial.typeId));
        if (editedMaterial.supplierIds && editedMaterial.supplierIds.length > 0) {
          editedMaterial.supplierIds.forEach(id => formData.append("supplierIds", id));
        }
        if (editedMaterial.image) {
          formData.append("image", editedMaterial.image);
        }

        await updateMaterial(id, formData);

        setIsEditing(false);
        const updatedMaterial = await getMaterialById(id);
        setShowSuccessAlert(true);
        setMaterial({
          ...updatedMaterial,
          supplierIds: updatedMaterial.supplierIds || []
        });
        setEditedMaterial({
          ...updatedMaterial,
          supplierIds: updatedMaterial.supplierIds || []
        });
        setPreviewImage(null);
      } catch (error) {
        setErrors({
          message: `Có lỗi xảy ra: ${error.response?.data?.message || error.message}`,
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRemoveImage = () => {
    setPreviewImage(null);
    setEditedMaterial(prev => ({
      ...prev,
      image: null,
      imageUrl: null
    }));
  };

  if (!material || !editedMaterial) return <div>Loading...</div>;

  return (
    <div className="mb-8 flex flex-col gap-12">
      <Card className="bg-gray-50 p-7 rounded-none shadow-none">
        <CardBody className="pb-2 bg-white rounded-xl">
          <PageHeader
            title="Chi tiết nguyên vật liệu"
            showAdd={false}
            showImport={false}
            showExport={false}
          />

          {errors.message && (
            <Typography className="text-red-500 mb-4">{errors.message}</Typography>
          )}

          <div className="grid grid-cols-2 gap-x-12 gap-y-4">
            <div className="flex flex-col gap-4">
              <div>
                <Typography variant="medium" className="mb-1 text-black">
                  Mã nguyên vật liệu
                  {isEditing && <span className="text-red-500"> *</span>}
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  hiddenLabel
                  placeholder="Mã nguyên vật liệu"
                  color="success"
                  value={editedMaterial?.materialCode || ""}
                  onChange={(e) => handleCheckMaterialCode(e.target.value)}
                  disabled={!isEditing}
                  error={Boolean(validationErrors.materialCode || materialCodeError)}
                  sx={{
                    '& .MuiInputBase-root.Mui-disabled': {
                      bgcolor: '#eeeeee',
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: 'none',
                      },
                    },
                  }}
                />
                {(validationErrors.materialCode || materialCodeError) && (
                  <Typography color="red" className="text-xs text-start mt-1">
                    {validationErrors.materialCode || materialCodeError}
                  </Typography>
                )}
              </div>

              <div>
                <Typography variant="medium" className="mb-1 text-black">
                  Đơn vị
                  {isEditing && <span className="text-red-500"> *</span>}
                </Typography>
                <Autocomplete
                  options={units}
                  disabled={!isEditing}
                  size="small"
                  getOptionLabel={(option) => option.unitName || ""}
                  value={
                    units.find((unit) => unit.unitId === editedMaterial.unitId) || null
                  }
                  onChange={(event, selectedUnit) => {
                    setEditedMaterial(prev => ({ ...prev, unitId: selectedUnit ? selectedUnit.unitId : "" }));
                    setValidationErrors(prev => ({ ...prev, unitId: "" }));
                  }}
                  renderInput={(params) => (
                    <TextField
                      color="success"
                      hiddenLabel
                      {...params}
                      placeholder="Đơn vị"
                    />
                  )}
                  sx={{
                    '& .MuiInputBase-root.Mui-disabled': {
                      bgcolor: '#eeeeee',
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: 'none',
                      },
                    },
                  }}
                />
                {validationErrors.unitId && (
                  <Typography className="text-xs text-red-500 mt-1">{validationErrors.unitId}</Typography>
                )}
              </div>

              <div>
                <Typography variant="medium" className="mb-1 text-black">
                  Mô tả
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  hiddenLabel
                  placeholder="Mô tả"
                  multiline
                  rows={4}
                  color="success"
                  value={editedMaterial?.description || ""}
                  onChange={(e) => {
                    if (isEditing) {
                      setEditedMaterial(prev => ({
                        ...prev,
                        description: e.target.value
                      }));
                    }
                  }}
                  disabled={!isEditing}
                  sx={{
                    '& .MuiInputBase-root.Mui-disabled': {
                      bgcolor: '#eeeeee',
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: 'none',
                      },
                    },
                  }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <Typography variant="medium" className="mb-1 text-black">
                  Tên nguyên vật liệu
                  {isEditing && <span className="text-red-500"> *</span>}
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  hiddenLabel
                  placeholder="Tên nguyên vật liệu"
                  color="success"
                  value={editedMaterial?.materialName || ""}
                  onChange={(e) => {
                    if (isEditing) {
                      setEditedMaterial(prev => ({
                        ...prev,
                        materialName: e.target.value
                      }));
                      setValidationErrors(prev => ({ ...prev, materialName: "" }));
                    }
                  }}
                  disabled={!isEditing}
                  error={Boolean(validationErrors.materialName)}
                  sx={{
                    '& .MuiInputBase-root.Mui-disabled': {
                      bgcolor: '#eeeeee',
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: 'none',
                      },
                    },
                  }}
                />
                {validationErrors.materialName && (
                  <Typography className="text-xs text-red-500 mt-1">{validationErrors.materialName}</Typography>
                )}
              </div>

              <div>
                <Typography variant="medium" className="mb-1 text-black">
                  Danh mục
                  {isEditing && <span className="text-red-500"> *</span>}
                </Typography>
                <Autocomplete
                  options={materialCategories}
                  disabled={!isEditing}
                  size="small"
                  getOptionLabel={(option) => option.name || ""}
                  value={
                    materialCategories.find(
                      (type) => type.materialTypeId === editedMaterial.typeId
                    ) || null
                  }
                  onChange={(event, selectedType) => {
                    setEditedMaterial(prev => ({ ...prev, typeId: selectedType ? selectedType.materialTypeId : "" }));
                    setValidationErrors(prev => ({ ...prev, typeId: "" }));
                  }}
                  renderInput={(params) => (
                    <TextField
                      color="success"
                      hiddenLabel
                      {...params}
                      placeholder="Danh mục"
                    />
                  )}
                  sx={{
                    '& .MuiInputBase-root.Mui-disabled': {
                      bgcolor: '#eeeeee',
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: 'none',
                      },
                    },
                  }}
                />
                {validationErrors.typeId && (
                  <Typography className="text-xs text-red-500 mt-1">{validationErrors.typeId}</Typography>
                )}
              </div>

              <div>
                <Typography variant="medium" className="mb-1 text-black">
                  Nhà cung cấp
                  {isEditing && <span className="text-red-500"> *</span>}
                </Typography>
                <Autocomplete
                  multiple
                  disabled={!isEditing}
                  options={suppliers}
                  size="small"
                  getOptionLabel={(option) => `${option.partnerCode} - ${option.label}`}
                  value={
                    suppliers.filter((s) =>
                      editedMaterial.supplierIds.includes(s.value)
                    )
                  }
                  onChange={(event, selectedOptions) => {
                    if (isEditing) {
                      const selectedIds = selectedOptions ? selectedOptions.map(option => option.value) : [];
                      setEditedMaterial(prev => ({
                        ...prev,
                        supplierIds: selectedIds
                      }));
                      setValidationErrors(prev => ({ ...prev, supplierIds: "" }));
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      color="success"
                      hiddenLabel
                      {...params}
                      placeholder="Chọn nhà cung cấp"
                    />
                  )}
                  sx={{
                    '& .MuiInputBase-root.Mui-disabled': {
                      bgcolor: '#eeeeee',
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: 'none',
                      },
                    },
                  }}
                />
                {validationErrors.supplierIds && (
                  <Typography className="text-xs text-red-500 mt-1">{validationErrors.supplierIds}</Typography>
                )}
              </div>
              <div>
                <Typography variant="medium" className="mb-1 text-black">
                  Hình ảnh nguyên vật liệu
                </Typography>
                {isEditing && (
                  <ImageUploadBox
                    onFileSelect={(file) => {
                      const imageUrl = URL.createObjectURL(file);
                      setPreviewImage(imageUrl);
                      setEditedMaterial((prev) => ({
                        ...prev,
                        image: file,
                        imageUrl: null
                      }));
                    }}
                  />
                )}
                {(previewImage || editedMaterial?.imageUrl) && (
                  <div className="mt-2 relative">
                    <div className="relative inline-block">
                      <img
                        src={previewImage || editedMaterial.imageUrl}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'path_to_default_image.jpg';
                        }}
                      />
                      {isEditing && (
                        <button
                          onClick={handleRemoveImage}
                          className="absolute -top-2 -right-2 bg-white rounded-full shadow-lg p-1 hover:bg-red-50 transition-colors duration-200 ease-in-out border-2 border-gray-200 group"
                          title="Xóa ảnh"
                        >
                          <FaTimesCircle className="h-4 w-4 text-gray-400 group-hover:text-red-500 transition-colors duration-200 ease-in-out" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <Divider sx={{ mt: 2 }} />
          <div className="flex justify-between my-4">
            <MuiButton
              color="info"
              size="medium"
              variant="outlined"
              sx={{
                color: '#616161',
                borderColor: '#9e9e9e',
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                  borderColor: '#757575',
                },
              }}
              onClick={() => navigate("/user/materials")}
              className="flex items-center gap-2"
            >
              <FaArrowLeft className="h-3 w-3" /> Quay lại
            </MuiButton>
            {!isEditing ? (
              <MuiButton
                variant="contained"
                size="medium"
                onClick={handleEdit}
                sx={{
                  boxShadow: 'none',
                  '&:hover': { boxShadow: 'none' }
                }}
              >
                <div className='flex items-center gap-2'>
                  <FaEdit className="h-4 w-4" />
                  <span>Chỉnh sửa</span>
                </div>
              </MuiButton>
            ) : (
              <div className="flex items-center gap-2">
                <MuiButton
                  size="medium"
                  color="error"
                  variant="outlined"
                  onClick={handleCancel}
                >
                  Hủy
                </MuiButton>
                <Button
                  size="lg"
                  color="white"
                  variant="text"
                  className="bg-[#0ab067] hover:bg-[#089456]/90 shadow-none text-white font-medium py-2 px-4 rounded-[4px] transition-all duration-200 ease-in-out"
                  ripple={true}
                  onClick={handleSave}
                  disabled={loading || !!materialCodeError}
                >
                  Lưu
                </Button>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      <SuccessAlert
        open={showSuccessAlert}
        onClose={() => setShowSuccessAlert(false)}
        message="Cập nhật nguyên vật liệu thành công!" // Sửa message cho phù hợp
      />
    </div>
  );
};

export default DetailMaterialPage;