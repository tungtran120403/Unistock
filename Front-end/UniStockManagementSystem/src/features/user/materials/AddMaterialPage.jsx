import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Card,
    CardBody,
    Button,
    Typography,
} from "@material-tailwind/react";
import { TextField, Button as MuiButton, Autocomplete, IconButton, Divider } from '@mui/material';
import { checkMaterialCodeExists, createMaterial } from "./materialService";
import { fetchActiveUnits } from "../unit/unitService";
import PageHeader from '@/components/PageHeader';
import ImageUploadBox from '@/components/ImageUploadBox';
import { getPartnersByType } from "../partner/partnerService";
import { fetchActiveMaterialTypes } from "../materialType/materialTypeService";
import CircularProgress from '@mui/material/CircularProgress';

const SUPPLIER_TYPE_ID = 2;

const AddMaterialPage = () => {
    const navigate = useNavigate();
    const [newMaterial, setNewMaterial] = useState({
        materialCode: '',
        materialName: '',
        description: '',
        unitId: '',
        typeId: '',
        isActive: 'true',
        supplierIds: [],
        image: null,
        imageUrl: null,
        lowStockThreshold: '',
    });

    const [loading, setLoading] = useState(false);
    const [materialCodeError, setMaterialCodeError] = useState("");
    const [validationErrors, setValidationErrors] = useState({});
    const [supplierError, setSupplierError] = useState("");
    const [units, setUnits] = useState([]);
    const [materialCategories, setMaterialCategories] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [errors, setErrors] = useState({});
    const [previewImage, setPreviewImage] = useState(null);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [unitsData, activeCategoriesData, suppliersData] = await Promise.all([
                    fetchActiveUnits(),
                    fetchActiveMaterialTypes(),
                    getPartnersByType(SUPPLIER_TYPE_ID)
                ]);

                setUnits(Array.isArray(unitsData) ? unitsData : []);
                setMaterialCategories(activeCategoriesData || []);

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
            } catch (error) {
                console.error("❌ Lỗi khi tải dữ liệu ban đầu:", error);
                setErrors({ message: "Lỗi khi tải dữ liệu ban đầu" });
                setUnits([]);
            }
        };

        loadInitialData();
    }, []);

    const isEmptyOrWhitespace = (str) => !str || /^\s*$/.test(str);

    const handleCheckMaterialCode = async (newCode) => {
        setMaterialCodeError("");
        setValidationErrors(prev => ({
            ...prev,
            materialCode: ""
        }));

        setNewMaterial(prev => ({
            ...prev,
            materialCode: newCode || ''
        }));

        if (newCode.trim()) {
            try {
                const exists = await checkMaterialCodeExists(newCode);
                if (exists) {
                    setMaterialCodeError("Mã vật tư này đã tồn tại!");
                }
            } catch (error) {
                console.error("❌ Lỗi kiểm tra mã vật tư:", error);
                setMaterialCodeError("Lỗi khi kiểm tra mã vật tư!");
            }
        }
    };

    const handleSupplierChange = (selectedOptions) => {
        const selectedIds = selectedOptions.map(option => option.value);
        setNewMaterial(prev => ({
            ...prev,
            supplierIds: selectedIds
        }));
        if (selectedIds.length > 0) {
            setValidationErrors(prev => ({
                ...prev,
                supplierIds: ""
            }));
        }
    };

    const handleCreateMaterial = async () => {
        const newErrors = {};

        if (isEmptyOrWhitespace(newMaterial.materialCode)) {
            newErrors.materialCode = "Mã vật tư không được để trống hoặc chỉ chứa khoảng trắng!";
        }
        if (isEmptyOrWhitespace(newMaterial.materialName)) {
            newErrors.materialName = "Tên vật tư không được để trống hoặc chỉ chứa khoảng trắng!";
        }
        if (!newMaterial.unitId) {
            newErrors.unitId = "Vui lòng chọn đơn vị!";
        }
        if (!newMaterial.typeId) {
            newErrors.typeId = "Vui lòng chọn danh mục!";
        }
        if (!newMaterial.supplierIds || newMaterial.supplierIds.length === 0) {
            newErrors.supplierIds = "Vui lòng chọn ít nhất một nhà cung cấp!";
        }

        setValidationErrors(newErrors);

        if (Object.keys(newErrors).length === 0 && !materialCodeError) {
            try {
                setLoading(true);
                const formData = new FormData();
                formData.append("materialCode", newMaterial.materialCode.trim());
                formData.append("materialName", newMaterial.materialName.trim());
                formData.append("description", newMaterial.description?.trim() || "");
                formData.append("unitId", parseInt(newMaterial.unitId));
                formData.append("typeId", parseInt(newMaterial.typeId));
                formData.append("isUsingActive", newMaterial.isActive === 'true');

                // Chỉ gửi lowStockThreshold nếu giá trị > 0
                const lowStockThresholdValue = parseFloat(newMaterial.lowStockThreshold);
                if (lowStockThresholdValue > 0) {
                    formData.append("lowStockThreshold", lowStockThresholdValue);
                }

                newMaterial.supplierIds.forEach(id => {
                    formData.append("supplierIds", id);
                });

                if (newMaterial.image) {
                    formData.append("image", newMaterial.image);
                }

                await createMaterial(formData);

                navigate("/user/materials", { state: { successMessage: "Tạo vật tư thành công!" } });
            } catch (error) {
                console.error("Create material error:", error);
                setErrors({
                    message: `Có lỗi xảy ra: ${error.response?.data?.message || error.message}`,
                });
            } finally {
                setLoading(false);
            }
        }
    };

    const isCreateDisabled = () => {
        return loading || !!materialCodeError;
    };

    const [dotCount, setDotCount] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => {
            setDotCount((prev) => (prev < 3 ? prev + 1 : 0));
        }, 500);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center" style={{ height: '60vh' }}>
                <div className="flex flex-col items-center">
                    <CircularProgress size={50} thickness={4} sx={{ mb: 2, color: '#0ab067' }} />
                    <Typography variant="body1">
                        Đang tải{'.'.repeat(dotCount)}
                    </Typography>
                </div>
            </div>
        );
    }

    return (
        <div className="mb-8 flex flex-col gap-12">
            <Card className="bg-gray-50 p-7 rounded-none shadow-none">
                <CardBody className="pb-2 bg-white rounded-xl">
                    <PageHeader
                        title="Tạo vật tư mới"
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
                                    Mã vật tư
                                    <span className="text-red-500"> *</span>
                                </Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    hiddenLabel
                                    placeholder="Mã vật tư"
                                    color="success"
                                    value={newMaterial.materialCode}
                                    onChange={(e) => handleCheckMaterialCode(e.target.value)}
                                    error={Boolean(materialCodeError || validationErrors.materialCode)}
                                />
                                {(materialCodeError || validationErrors.materialCode) && (
                                    <Typography color="red" className="text-xs text-start mt-1">
                                        {materialCodeError || validationErrors.materialCode}
                                    </Typography>
                                )}
                            </div>

                            <div>
                                <Typography variant="medium" className="mb-1 text-black">
                                    Đơn vị
                                    <span className="text-red-500"> *</span>
                                </Typography>
                                <Autocomplete
                                    options={Array.isArray(units) ? units : []}
                                    size="small"
                                    getOptionLabel={(option) => option.unitName || ""}
                                    value={
                                        Array.isArray(units) && newMaterial.unitId
                                            ? units.find((unit) => unit.unitId === newMaterial.unitId) || null
                                            : null
                                    }
                                    onChange={(event, selectedUnit) => {
                                        setNewMaterial(prev => ({ ...prev, unitId: selectedUnit ? selectedUnit.unitId : "" }));
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
                                />
                                {validationErrors.unitId && (
                                    <Typography className="text-xs text-red-500 mt-1">
                                        {validationErrors.unitId}
                                    </Typography>
                                )}
                            </div>

                            <div>
                                <Typography variant="medium" className="mb-1 text-black">
                                    Ngưỡng tồn kho thấp
                                </Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    hiddenLabel
                                    type="number"
                                    color="success"
                                    value={newMaterial.lowStockThreshold}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        // Không cho phép nhập số âm
                                        if (value === '' || parseFloat(value) >= 0) {
                                            setNewMaterial({ ...newMaterial, lowStockThreshold: value });
                                        }
                                    }}
                                    inputProps={{ min: 0 }} // Đặt giá trị tối thiểu là 0
                                />
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
                                    value={newMaterial.description}
                                    onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                                />
                            </div>


                        </div>

                        <div className="flex flex-col gap-4">
                            <div>
                                <Typography variant="medium" className="mb-1 text-black">
                                    Tên vật tư
                                    <span className="text-red-500"> *</span>
                                </Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    hiddenLabel
                                    placeholder="Tên vật tư"
                                    color="success"
                                    value={newMaterial.materialName}
                                    onChange={(e) => {
                                        setNewMaterial({ ...newMaterial, materialName: e.target.value });
                                        setValidationErrors(prev => ({ ...prev, materialName: "" }));
                                    }}
                                    error={Boolean(validationErrors.materialName)}
                                />
                                {validationErrors.materialName && (
                                    <Typography color="red" className="text-xs text-start mt-1">
                                        {validationErrors.materialName}
                                    </Typography>
                                )}
                            </div>

                            <div>
                                <Typography variant="medium" className="mb-1 text-black">
                                    Danh mục
                                    <span className="text-red-500"> *</span>
                                </Typography>
                                <Autocomplete
                                    options={materialCategories}
                                    size="small"
                                    getOptionLabel={(option) => option.name || ""}
                                    value={
                                        materialCategories.find(
                                            (type) => type.materialTypeId === newMaterial.typeId
                                        ) || null
                                    }
                                    onChange={(event, selectedType) => {
                                        setNewMaterial(prev => ({ ...prev, typeId: selectedType ? selectedType.materialTypeId : "" }));
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
                                />
                                {validationErrors.typeId && (
                                    <Typography className="text-xs text-red-500 mt-1">
                                        {validationErrors.typeId}
                                    </Typography>
                                )}
                            </div>

                            <div>
                                <Typography variant="medium" className="mb-1 text-black">
                                    Nhà cung cấp
                                    <span className="text-red-500"> *</span>
                                </Typography>
                                <Autocomplete
                                    multiple
                                    options={suppliers}
                                    size="small"
                                    getOptionLabel={(option) => `${option.partnerCode} - ${option.label}`}
                                    value={
                                        suppliers.filter((s) =>
                                            newMaterial.supplierIds.includes(s.value)
                                        )
                                    }
                                    onChange={(event, selectedOptions) => {
                                        handleSupplierChange(selectedOptions);
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            color="success"
                                            hiddenLabel
                                            {...params}
                                            placeholder="Chọn nhà cung cấp"
                                            error={Boolean(validationErrors.supplierIds)}
                                        />
                                    )}
                                />
                                {validationErrors.supplierIds && (
                                    <Typography className="text-xs text-red-500 mt-1">
                                        {validationErrors.supplierIds}
                                    </Typography>
                                )}
                            </div>

                            <div>
                                <Typography variant="medium" className="mb-1 text-black">
                                    Hình ảnh vật tư
                                </Typography>
                                <ImageUploadBox
                                    onFileSelect={(file) => {
                                        const imageUrl = URL.createObjectURL(file);
                                        setPreviewImage(imageUrl);
                                        setNewMaterial((prev) => ({
                                            ...prev,
                                            image: file,
                                        }));
                                    }}
                                />
                                {previewImage && (
                                    <div className="mt-2 relative">
                                        <img
                                            src={previewImage}
                                            alt="Preview"
                                            className="w-32 h-32 object-cover rounded-lg"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'path_to_default_image.jpg';
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <Divider sx={{ marginY: '16px' }} />
                    <div className="flex justify-end gap-2 pb-2">
                        <MuiButton
                            size="medium"
                            color="error"
                            variant="outlined"
                            onClick={() => navigate("/user/materials")}
                        >
                            Hủy
                        </MuiButton>
                        <Button
                            size="lg"
                            color="white"
                            variant="text"
                            className="bg-[#0ab067] hover:bg-[#089456]/90 shadow-none text-white font-medium py-2 px-4 ml-2 rounded-[4px] transition-all duration-200 ease-in-out"
                            ripple={true}
                            onClick={handleCreateMaterial}
                            disabled={isCreateDisabled()}
                        >
                            Lưu
                        </Button>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
};

export default AddMaterialPage;