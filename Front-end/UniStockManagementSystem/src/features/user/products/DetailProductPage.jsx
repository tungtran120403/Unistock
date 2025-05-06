import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Card,
    CardBody,
    Typography,
    Button,
} from "@material-tailwind/react";
import { TextField, Button as MuiButton, Divider, Autocomplete, IconButton } from '@mui/material';
import { FaEdit, FaArrowLeft, FaSave, FaTimes, FaPlus, FaTrash, FaTimesCircle } from "react-icons/fa";
import { getProductById, updateProduct, fetchProductTypes, checkProductCodeExists } from "./productService";
import { fetchActiveUnits } from "../unit/unitService";
import { getAllActiveMaterials, getAllMaterials } from "../materials/materialService";
import axios from "axios";
import { ArrowRightIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import { HighlightOffRounded } from '@mui/icons-material';
import ReactPaginate from "react-paginate";
import PageHeader from '@/components/PageHeader';
import TableSearch from '@/components/TableSearch';
import ImageUploadBox from '@/components/ImageUploadBox';
import Table from "@/components/Table";
import SuccessAlert from "@/components/SuccessAlert";
import CircularProgress from '@mui/material/CircularProgress';

const authHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const DetailProductPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [units, setUnits] = useState([]);
    const [productTypes, setProductTypes] = useState([]);
    const [activeMaterials, setActiveMaterials] = useState([]); // Chỉ vật tư active
    const [allMaterials, setAllMaterials] = useState([]); // Tất cả vật tư (active + deactive)
    const [editedProduct, setEditedProduct] = useState(null);
    const [loading, setLoading] = useState(false);
    const [initialValues, setInitialValues] = useState(null);
    const [errors, setErrors] = useState({});
    const [validationErrors, setValidationErrors] = useState({});
    const [productCodeError, setProductCodeError] = useState("");
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(5);
    const [previewImage, setPreviewImage] = useState(null);
    const [tableSearchQuery, setTableSearchQuery] = useState("");
    const [quantityErrors, setQuantityErrors] = useState({});
    const [showSuccessAlert, setShowSuccessAlert] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const productData = await getProductById(id);
                const activeProductTypes = await fetchProductTypes();
                const activeUnits = await fetchActiveUnits();
                const activeMaterialsData = await getAllActiveMaterials();
                const allMaterialsResponse = await getAllMaterials(0, 1000); // Lấy tất cả vật tư

                console.log("📌 Active Materials Response:", activeMaterialsData);
                console.log("📌 All Materials Response:", allMaterialsResponse);

                const mappedActiveMaterials = Array.isArray(activeMaterialsData)
                    ? activeMaterialsData.map(m => ({
                        materialId: m.materialId,
                        materialCode: m.materialCode,
                        materialName: m.materialName,
                        unitName: m.unitName,
                    }))
                    : [];

                const mappedAllMaterials = Array.isArray(allMaterialsResponse.materials)
                    ? allMaterialsResponse.materials.map(m => ({
                        materialId: m.materialId,
                        materialCode: m.materialCode,
                        materialName: m.materialName,
                        unitName: m.unitName,
                    }))
                    : [];

                mappedAllMaterials.forEach(material => {
                    console.log(`📌 Material ID: ${material.materialId}, Unit Name: ${material.unitName}`);
                });

                const unitExists = activeUnits.some(unit => unit.unitId === productData.unitId);
                if (!unitExists && productData.unitId && productData.unitName) {
                    activeUnits.push({ unitId: productData.unitId, unitName: productData.unitName });
                }

                const typeExists = activeProductTypes.some(type => type.typeId === productData.typeId);
                if (!typeExists && productData.typeId && productData.typeName) {
                    activeProductTypes.push({ typeId: productData.typeId, typeName: productData.typeName });
                }

                setUnits(activeUnits);
                setProductTypes(activeProductTypes);
                setActiveMaterials(mappedActiveMaterials);
                setAllMaterials(mappedAllMaterials);

                const matchingType = activeProductTypes.find(
                    (type) => type.typeId === productData.typeId || type.typeName === productData.typeName
                );

                const updatedProductData = {
                    ...productData,
                    typeId: matchingType ? matchingType.typeId : "",
                    typeName: matchingType ? matchingType.typeName : productData.typeName,
                    materials: [],
                };

                setProduct(updatedProductData);
                setEditedProduct(updatedProductData);
                setInitialValues(updatedProductData);

                await fetchProductMaterials(id);
            } catch (error) {
                console.error("❌ Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    useEffect(() => {
        return () => {
            if (previewImage) {
                URL.revokeObjectURL(previewImage);
            }
        };
    }, [previewImage]);

    const fetchProductMaterials = async (productId) => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/user/products/product-materials/${productId}`,
                { headers: authHeader(), params: { page: 0, size: 1000 } }
            );

            console.log("📌 API Product Materials Response:", response.data);

            if (response.data && Array.isArray(response.data.content)) {
                const updatedMaterials = response.data.content.map(pm => ({
                    materialId: pm.materialId,
                    materialCode: pm.materialCode,
                    materialName: pm.materialName,
                    quantity: pm.quantity,
                }));

                setEditedProduct(prev => ({
                    ...prev,
                    materials: updatedMaterials,
                }));
            } else {
                console.warn("📌 Response data is not an array:", response.data);
                setEditedProduct(prev => ({
                    ...prev,
                    materials: [],
                }));
            }
        } catch (error) {
            console.error("❌ Error fetching product materials:", error.response?.data || error.message);
            setEditedProduct(prev => ({
                ...prev,
                materials: [],
            }));
            console.log("Không thể tải định mức nguyên vật liệu. Vui lòng thử lại!");
        }
    };

    const handleCheckProductCode = async (newCode) => {
        setProductCodeError("");
        setValidationErrors(prev => ({
            ...prev,
            productCode: "",
        }));

        setEditedProduct(prev => ({
            ...prev,
            productCode: newCode || "",
        }));

        if (newCode.trim() && newCode !== product.productCode) {
            try {
                const exists = await checkProductCodeExists(newCode, id);
                if (exists) {
                    setProductCodeError("Mã sản phẩm này đã tồn tại!");
                }
            } catch (error) {
                console.error("❌ Lỗi kiểm tra mã sản phẩm:", error);
                setProductCodeError("Lỗi khi kiểm tra mã sản phẩm!");
            }
        }
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancel = () => {
        setEditedProduct(initialValues);
        setIsEditing(false);
        setValidationErrors({});
        setProductCodeError("");
        setQuantityErrors({});
        setPreviewImage(null);
    };

    const handleSave = async () => {
        const newErrors = {};

        if (!editedProduct.productName || editedProduct.productName.trim() === "") {
            newErrors.productName = "Tên sản phẩm không được để trống!";
        }
        if (!editedProduct.unitId) {
            newErrors.unitId = "Đơn vị không được bỏ trống!";
        }
        if (!editedProduct.typeId) {
            newErrors.typeId = "Dòng sản phẩm không được bỏ trống!";
        }
        if (
            editedProduct.materials.some(
                (item) =>
                    !item.materialId ||
                    !item.materialCode ||
                    !item.materialName ||
                    !item.quantity ||
                    item.quantity <= 0
            )
        ) {
            newErrors.materials = "Vui lòng điền đầy đủ thông tin cho tất cả các dòng nguyên vật liệu!";
        }

        setValidationErrors(newErrors);

        if (Object.keys(newErrors).length === 0 && !productCodeError) {
            try {
                setLoading(true);

                const formData = new FormData();
                formData.append("productCode", editedProduct.productCode);
                formData.append("productName", editedProduct.productName);
                formData.append("description", editedProduct.description || "");
                formData.append("unitId", editedProduct.unitId || "");
                formData.append("typeId", editedProduct.typeId || "");
                formData.append("isProductionActive", editedProduct.isProductionActive ?? true);
                formData.append("materials", JSON.stringify(
                    editedProduct.materials.map(material => ({
                        materialId: material.materialId,
                        quantity: material.quantity,
                        materialCode: material.materialCode,
                        materialName: material.materialName,
                    }))
                ));

                if (previewImage && editedProduct.image) {
                    formData.append("image", editedProduct.image);
                }

                if (!previewImage && !editedProduct.image && !editedProduct.imageUrl) {
                    formData.append("deleteImage", true);
                }

                await axios.put(
                    `${import.meta.env.VITE_API_URL}/user/products/${id}`,
                    formData,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data",
                            ...authHeader()
                        }
                    }
                );

                const updatedProduct = await getProductById(id);
                setProduct(updatedProduct);
                setEditedProduct(updatedProduct);
                setInitialValues(updatedProduct);
                setIsEditing(false);
                setShowSuccessAlert(true);
                setPreviewImage(null);
            } catch (error) {
                console.error("❌ Lỗi lưu sản phẩm:", error);
                console.log("Lỗi khi cập nhật sản phẩm: " + (error.response?.data?.message || error.message));
            } finally {
                setLoading(false);
            }
        }
    };

    const handleAddRow = () => {
        setEditedProduct((prev) => {
            const newMaterials = [
                ...prev.materials,
                { materialId: "", materialCode: "", materialName: "", quantity: 1 },
            ];

            // Tính toán trang cuối để chuyển đến sau khi thêm dòng
            const lastPage = Math.ceil(newMaterials.length / pageSize) - 1;
            setCurrentPage(lastPage);

            return {
                ...prev,
                materials: newMaterials,
            };
        });
    };

    const handleRemoveRow = (index) => {
        setEditedProduct(prev => ({
            ...prev,
            materials: prev.materials.filter((_, i) => i !== index),
        }));
        setQuantityErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[index];
            return newErrors;
        });
    };

    const handleRemoveAllRows = () => {
        setEditedProduct({
            ...editedProduct,
            materials: [],
        });
        setQuantityErrors({});
    };

    const getFilteredMaterials = () => {
        if (!editedProduct?.materials) return [];
        // Nếu không có search query, trả về toàn bộ materials
        if (!tableSearchQuery.trim()) {
            return editedProduct.materials;
        }
        // Nếu có search query, lọc các dòng có materialCode hoặc materialName khớp
        return editedProduct.materials.filter(item => {
            const searchLower = tableSearchQuery.toLowerCase().trim();
            return (
                (item.materialCode && item.materialCode.toLowerCase().includes(searchLower)) ||
                (item.materialName && item.materialName.toLowerCase().includes(searchLower))
            );
        });
    };

    const getPaginatedData = () => {
        // Lấy toàn bộ dữ liệu từ editedProduct.materials thay vì dữ liệu đã lọc
        const allData = editedProduct?.materials || [];
        const startIndex = currentPage * pageSize;
        const endIndex = startIndex + pageSize;
        return allData.slice(startIndex, endIndex);
    };

    const handlePageChange = (selectedItem) => {
        setCurrentPage(selectedItem.selected);
    };

    const getAvailableMaterials = (currentRowIndex) => {
        if (!activeMaterials || activeMaterials.length === 0) return [];
        const selectedMaterialIds = editedProduct?.materials
            ?.filter((item, idx) => idx !== currentRowIndex && item.materialId)
            .map(m => m.materialId) || [];
        return activeMaterials.filter(m => !selectedMaterialIds.includes(m.materialId));
    };


    const handleMaterialChange = (index, selected) => {
        if (!selected) return;

        const updatedMaterials = [...editedProduct.materials];
        updatedMaterials[index] = {
            ...updatedMaterials[index],
            materialId: selected.materialId,
            materialCode: selected.materialCode,
            materialName: selected.materialName,
            quantity: updatedMaterials[index].quantity || 1,
        };
        setEditedProduct(prev => ({
            ...prev,
            materials: updatedMaterials,
        }));
    };

    const handleQuantityChange = (index, value) => {
        const updatedMaterials = [...editedProduct.materials];
        updatedMaterials[index].quantity = Number(value);
        setEditedProduct(prev => ({
            ...prev,
            materials: updatedMaterials,
        }));

        if (!value || value <= 0) {
            setQuantityErrors(prev => ({
                ...prev,
                [index]: "Số lượng phải lớn hơn 0",
            }));
        } else {
            setQuantityErrors(prev => ({
                ...prev,
                [index]: "",
            }));
        }
    };

    const handleRemoveImage = () => {
        setPreviewImage(null);
        setEditedProduct(prev => ({
            ...prev,
            image: null,
            imageUrl: null,
        }));
    };

    const getTableData = () => {
        const paginatedData = getPaginatedData();
        return paginatedData.map((item, index) => {
            // Tính STT dựa trên vị trí trong trang hiện tại
            const pageIndex = currentPage * pageSize + index + 1;

            // Tính actualIndex dựa trên vị trí trong mảng gốc editedProduct.materials
            const actualIndex = (currentPage * pageSize) + index;

            const matchedMaterial = allMaterials.find(m => m.materialId === item.materialId);

            console.log(`📌 Material ID: ${item.materialId}, Matched Material:`, matchedMaterial);

            return {
                ...item,
                id: item.materialId || `new-${actualIndex}`,
                index: pageIndex, // STT hiển thị trong bảng
                actualIndex: actualIndex, // Sử dụng vị trí trong mảng gốc
                materialId: item.materialId,
                materialCode: item.materialCode,
                materialName: item.materialName,
                quantity: item.quantity,
                unitName: matchedMaterial?.unitName || "",
            };
        });
    };

    const columnsConfig = [
        { field: 'index', headerName: 'STT', flex: 0.5, minWidth: 50, filterable: false, editable: false },
        {
            field: 'materialCode',
            headerName: 'Mã NVL',
            flex: 1.5,
            minWidth: 250,
            filterable: false,
            editable: false,
            renderCell: (params) => (
                isEditing ? (
                    <Autocomplete
                        sx={{ width: '100%', paddingY: '0.5rem' }}
                        options={getAvailableMaterials(params.row.actualIndex)}
                        size="small"
                        getOptionLabel={(option) =>
                            option && option.materialCode
                                ? `${option.materialCode} - ${option.materialName}`
                                : ""
                        }
                        isOptionEqualToValue={(option, value) =>
                            option && value ? option.materialId === value.materialId : false
                        }
                        value={
                            params.row.materialId
                                ? {
                                    materialId: params.row.materialId,
                                    materialCode: params.row.materialCode,
                                    materialName: params.row.materialName,
                                }
                                : null
                        }
                        onChange={(event, selectedMaterial) => {
                            if (selectedMaterial) {
                                handleMaterialChange(params.row.actualIndex, selectedMaterial);
                            }
                        }}
                        renderInput={(params) => (
                            <TextField
                                color="success"
                                hiddenLabel
                                {...params}
                                placeholder="Mã nguyên vật liệu"
                            />
                        )}
                    />
                ) : (
                    <div className="px-3">{params.value}</div>
                )
            ),
        },
        {
            field: 'materialName',
            headerName: 'Tên NVL',
            flex: 2,
            minWidth: 400,
            editable: false,
            filterable: false,
            renderCell: (params) => (
                <div className="px-3">{params.value}</div>
            ),
        },
        {
            field: 'unitName',
            headerName: 'Đơn vị',
            flex: 1,
            minWidth: 100,
            editable: false,
            filterable: false,
            renderCell: (params) => (
                <div className="px-3">{params.value}</div>
            ),
        },
        {
            field: 'quantity',
            headerName: 'Số lượng',
            flex: 1,
            minWidth: 100,
            editable: false,
            filterable: false,
            renderCell: (params) => (
                isEditing ? (
                    <div className="w-full py-2">
                        <TextField
                            type="number"
                            size="small"
                            fullWidth
                            inputProps={{ min: 1 }}
                            value={params.value || ''}
                            onChange={(e) => handleQuantityChange(params.row.actualIndex, e.target.value)}
                            color="success"
                            hiddenLabel
                            placeholder="0"
                            sx={{
                                '& .MuiInputBase-root': {
                                    bgcolor: '#ffffff',
                                },
                                '& .MuiOutlinedInput-notchedOutline': {
                                    border: '1px solid #e0e0e0',
                                },
                            }}
                        />
                        {quantityErrors[params.row.actualIndex] && (
                            <div className="text-xs text-red-500 mt-1">
                                {quantityErrors[params.row.actualIndex]}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="px-3 py-2">{params.value || '0'}</div>
                )
            ),
        },
        {
            field: 'actions',
            headerName: 'Thao tác',
            flex: 0.5,
            minWidth: 100,
            editable: false,
            filterable: false,
            renderCell: (params) => (
                isEditing && (
                    <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveRow(params.row.actualIndex)}
                    >
                        <HighlightOffRounded />
                    </IconButton>
                )
            ),
        },
    ];

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
        <div className="mb-8 flex flex-col gap-12" style={{ height: 'calc(100vh-100px)' }}>
            <Card className="bg-gray-50 p-7 rounded-none shadow-none">
                <CardBody className="pb-2 bg-white rounded-xl">
                    <PageHeader
                        title="Chi tiết sản phẩm"
                        showAdd={false}
                        showImport={false}
                        showExport={false}
                    />
                    <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                        <div className="flex flex-col gap-4">
                            <div>
                                <Typography variant="medium" className="mb-1 text-black">
                                    Mã sản phẩm
                                    {isEditing && <span className="text-red-500"> *</span>}
                                </Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    hiddenLabel
                                    placeholder="Mã sản phẩm"
                                    color="success"
                                    value={editedProduct?.productCode || ""}
                                    onChange={(e) => handleCheckProductCode(e.target.value)}
                                    disabled={!isEditing}
                                    error={Boolean(validationErrors.productCode || productCodeError)}
                                    sx={{
                                        '& .MuiInputBase-root.Mui-disabled': {
                                            bgcolor: '#eeeeee',
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                border: 'none',
                                            },
                                        },
                                    }}
                                />
                                {(validationErrors.productCode || productCodeError) && (
                                    <Typography color="red" className="text-xs text-start mt-1">
                                        {validationErrors.productCode || productCodeError}
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
                                    size="small"
                                    getOptionLabel={(option) => option.unitName || ""}
                                    value={units.find((unit) => unit.unitId === editedProduct?.unitId) || null}
                                    onChange={(event, selectedUnit) => {
                                        setEditedProduct({
                                            ...editedProduct,
                                            unitId: selectedUnit ? selectedUnit.unitId : "",
                                        });
                                    }}
                                    disabled={!isEditing}
                                    renderInput={(params) => (
                                        <TextField
                                            color="success"
                                            hiddenLabel
                                            {...params}
                                            placeholder="Đơn vị"
                                            sx={{
                                                '& .MuiInputBase-root.Mui-disabled': {
                                                    bgcolor: '#eeeeee',
                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                        border: 'none',
                                                    },
                                                },
                                            }}
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
                                    value={editedProduct?.description || ""}
                                    onChange={(e) =>
                                        setEditedProduct({ ...editedProduct, description: e.target.value })
                                    }
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
                                    Tên sản phẩm
                                    {isEditing && <span className="text-red-500"> *</span>}
                                </Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    hiddenLabel
                                    placeholder="Tên sản phẩm"
                                    color="success"
                                    value={editedProduct?.productName || ""}
                                    onChange={(e) =>
                                        setEditedProduct({ ...editedProduct, productName: e.target.value })
                                    }
                                    disabled={!isEditing}
                                    error={Boolean(validationErrors.productName || errors.productName)}
                                    sx={{
                                        '& .MuiInputBase-root.Mui-disabled': {
                                            bgcolor: '#eeeeee',
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                border: 'none',
                                            },
                                        },
                                    }}
                                />
                                {(validationErrors.productName || errors.productName) && (
                                    <Typography className="text-xs text-red-500 mt-1">
                                        {validationErrors.productName || errors.productName}
                                    </Typography>
                                )}
                            </div>
                            <div>
                                <Typography variant="medium" className="mb-1 text-black">
                                    Dòng sản phẩm
                                    {isEditing && <span className="text-red-500"> *</span>}
                                </Typography>
                                <Autocomplete
                                    options={productTypes}
                                    size="small"
                                    getOptionLabel={(option) => option.typeName || ""}
                                    value={productTypes.find((type) => type.typeId === editedProduct?.typeId) || null}
                                    onChange={(event, selectedType) => {
                                        setEditedProduct({
                                            ...editedProduct,
                                            typeId: selectedType ? selectedType.typeId : "",
                                            typeName: selectedType ? selectedType.typeName : "",
                                        });
                                    }}
                                    disabled={!isEditing}
                                    renderInput={(params) => (
                                        <TextField
                                            color="success"
                                            hiddenLabel
                                            {...params}
                                            placeholder="Dòng sản phẩm"
                                            sx={{
                                                '& .MuiInputBase-root.Mui-disabled': {
                                                    bgcolor: '#eeeeee',
                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                        border: 'none',
                                                    },
                                                },
                                            }}
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
                                    Hình ảnh sản phẩm
                                </Typography>
                                {isEditing && (
                                    <ImageUploadBox
                                        onFileSelect={(file) => {
                                            const imageUrl = URL.createObjectURL(file);
                                            setPreviewImage(imageUrl);
                                            setEditedProduct((prev) => ({
                                                ...prev,
                                                image: file,
                                                imageUrl: null,
                                            }));
                                        }}
                                    />
                                )}
                                {(previewImage || editedProduct?.imageUrl) && (
                                    <div className="mt-2 relative">
                                        <div className="relative inline-block">
                                            <img
                                                src={previewImage || editedProduct.imageUrl}
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
                    <div className="mt-8">
                        <Typography variant="h6" color="blue-gray" className="mb-4">
                            Định mức nguyên vật liệu
                        </Typography>
                        {validationErrors.materials && (
                            <Typography className="text-xs text-red-500 mb-2">
                                {validationErrors.materials}
                            </Typography>
                        )}
                        <div className="flex items-center justify-between gap-4 mb-4">
                            <div className="flex items-center gap-2">
                                <Typography variant="small" color="blue-gray" className="font-normal">
                                    Hiển thị
                                </Typography>
                                <select
                                    value={pageSize}
                                    onChange={(e) => {
                                        setPageSize(Number(e.target.value));
                                        setCurrentPage(0);
                                    }}
                                    className="border rounded px-2 py-1"
                                >
                                    {[5, 10, 20, 50].map(size => (
                                        <option key={size} value={size}>{size}</option>
                                    ))}
                                </select>
                                <Typography variant="small" color="blue-gray" className="font-normal">
                                    bản ghi mỗi trang
                                </Typography>
                            </div>
                            <TableSearch
                                value={tableSearchQuery}
                                onChange={setTableSearchQuery}
                                onSearch={() => { }}
                                placeholder="Tìm kiếm trong danh sách"
                            />
                        </div>
                        <Table
                            data={getTableData()}
                            columnsConfig={columnsConfig}
                            enableSelection={false}
                        />
                        {editedProduct?.materials?.length > 0 && (
                            <div className="flex items-center justify-between border-t border-blue-gray-50 pt-4 pb-2">
                                <div className="flex items-center gap-2">
                                    <Typography variant="small" color="blue-gray" className="font-normal">
                                        Trang {currentPage + 1} / {Math.ceil((editedProduct?.materials?.length || 0) / pageSize)} •{" "}
                                        {(editedProduct?.materials?.length || 0)} dòng
                                    </Typography>
                                </div>
                                <ReactPaginate
                                    previousLabel={<ArrowLeftIcon strokeWidth={2} className="h-4 w-4" />}
                                    nextLabel={<ArrowRightIcon strokeWidth={2} className="h-4 w-4" />}
                                    breakLabel="..."
                                    pageCount={Math.ceil((editedProduct?.materials?.length || 0) / pageSize)}
                                    marginPagesDisplayed={2}
                                    pageRangeDisplayed={5}
                                    onPageChange={handlePageChange}
                                    containerClassName="flex items-center gap-1"
                                    pageClassName="h-8 min-w-[32px] flex items-center justify-center rounded-md text-xs text-gray-700 border border-gray-300 hover:bg-[#0ab067] hover:text-white"
                                    pageLinkClassName="flex items-center justify-center w-full h-full"
                                    previousClassName="h-8 min-w-[32px] flex items-center justify-center rounded-md text-xs text-gray-700 border border-gray-300 hover:bg-gray-100"
                                    nextClassName="h-8 min-w-[32px] flex items-center justify-center rounded-md text-xs text-gray-700 border border-gray-300 hover:bg-gray-100"
                                    breakClassName="h-8 min-w-[32px] flex items-center justify-center rounded-md text-xs text-gray-700"
                                    activeClassName="bg-[#0ab067] text-white border-[#0ab067] hover:bg-[#0ab067]"
                                    forcePage={currentPage}
                                    disabledClassName="opacity-50 cursor-not-allowed"
                                />
                            </div>
                        )}
                        {isEditing && (
                            <div className="flex gap-2 mb-4 h-8">
                                <MuiButton
                                    size="small"
                                    variant="outlined"
                                    onClick={handleAddRow}
                                >
                                    <div className='flex items-center gap-2'>
                                        <FaPlus className="h-4 w-4" />
                                        <span>Thêm dòng</span>
                                    </div>
                                </MuiButton>
                                <MuiButton
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    onClick={handleRemoveAllRows}
                                >
                                    <div className='flex items-center gap-2'>
                                        <FaTrash className="h-4 w-4" />
                                        <span>Xóa hết dòng</span>
                                    </div>
                                </MuiButton>
                            </div>
                        )}
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
                            onClick={() => navigate("/user/products")}
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
                                    '&:hover': { boxShadow: 'none' },
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
                                    disabled={loading || !!productCodeError}
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
                message="Cập nhật sản phẩm thành công!"
            />
        </div>
    );
};

export default DetailProductPage;