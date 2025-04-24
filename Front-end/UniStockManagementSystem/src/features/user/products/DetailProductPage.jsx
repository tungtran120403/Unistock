import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Card,
    CardHeader,
    CardBody,
    Typography,
    Button,
    Input,
} from "@material-tailwind/react";
import { TextField, Button as MuiButton, Divider, Autocomplete, IconButton } from '@mui/material';
import { FaEdit, FaArrowLeft, FaSave, FaTimes, FaPlus, FaTrash, FaTimesCircle } from "react-icons/fa";
import { getProductById, updateProduct, fetchProductTypes, checkProductCodeExists } from "./productService";
import { fetchActiveUnits } from "../unit/unitService";
import axios from "axios";
import { ArrowRightIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import { HighlightOffRounded } from '@mui/icons-material';
import ReactPaginate from "react-paginate";
import PageHeader from '@/components/PageHeader';
import TableSearch from '@/components/TableSearch';
import ImageUploadBox from '@/components/ImageUploadBox';
import Table from "@/components/Table";
import SuccessAlert from "@/components/SuccessAlert";

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
    const [materials, setMaterials] = useState([]);
    const [editedProduct, setEditedProduct] = useState(null);
    const [loading, setLoading] = useState(false);
    const [initialValues, setInitialValues] = useState(null);
    const [errors, setErrors] = useState({});
    const [validationErrors, setValidationErrors] = useState({});
    const [productCodeError, setProductCodeError] = useState(""); // State cho lỗi trùng mã
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(5);
    const [previewImage, setPreviewImage] = useState(null);
    const [tableSearchQuery, setTableSearchQuery] = useState("");
    const [currentRow, setCurrentRow] = useState(-1);
    const [quantityErrors, setQuantityErrors] = useState({});
    const [showSuccessAlert, setShowSuccessAlert] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const productData = await getProductById(id);
                console.log("📌 Product Data:", productData);

                const activeProductTypes = await fetchProductTypes();
                const matchingType = activeProductTypes.find(
                    (type) => type.typeName === productData.typeName
                );

                const updatedProductData = {
                    ...productData,
                    typeId: matchingType ? matchingType.typeId : "",
                    typeName: productData.typeName,
                };

                setProduct(updatedProductData);
                setEditedProduct(updatedProductData);
                setInitialValues(updatedProductData);

                const [unitsData, materialsData] = await Promise.all([
                    fetchActiveUnits(),
                    axios.get(`${import.meta.env.VITE_API_URL}/user/materials`, {
                        headers: authHeader(),
                        withCredentials: true,
                    }).then(res => res.data.content || []),
                ]);

                setUnits(unitsData);
                setProductTypes(activeProductTypes);
                setMaterials(materialsData);
            } catch (error) {
                console.error("❌ Error:", error);
            }
        };

        fetchData();
    }, [id]);

    useEffect(() => {
        if (materials.length > 0 && id) {
            fetchProductMaterials(id);
        }
    }, [materials, id]);

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
                const updatedMaterials = response.data.content.map(pm => {
                    const materialData = materials.find(m => m.materialId === pm.materialId);
                    return {
                        materialId: pm.materialId,
                        materialCode: pm.materialCode,
                        materialName: pm.materialName,
                        quantity: pm.quantity,
                    };
                });

                console.log("📌 Updated Materials:", updatedMaterials);

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
            alert("Không thể tải định mức nguyên vật liệu. Vui lòng thử lại!");
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

                const dataToSend = {
                    ...editedProduct,
                    materials: editedProduct.materials.map(material => ({
                        materialId: material.materialId,
                        quantity: material.quantity,
                        materialCode: material.materialCode,
                        materialName: material.materialName,
                    })),
                };

                const updatedProductData = await updateProduct(id, dataToSend);

                const matchingType = productTypes.find(
                    (type) => type.typeName === updatedProductData.typeName
                );
                setProduct({
                    ...updatedProductData,
                    typeId: matchingType ? matchingType.typeId : "",
                    typeName: updatedProductData.typeName,
                });
                setEditedProduct({
                    ...updatedProductData,
                    typeId: matchingType ? matchingType.typeId : "",
                    typeName: updatedProductData.typeName,
                });
                setInitialValues({
                    ...updatedProductData,
                    typeId: matchingType ? matchingType.typeId : "",
                    typeName: updatedProductData.typeName,
                });

                await fetchProductMaterials(id);

                setIsEditing(false);
                setPreviewImage(null);
                setShowSuccessAlert(true);
            } catch (error) {
                console.error("❌ Error:", error.response?.data || error.message);
                alert("Lỗi khi cập nhật sản phẩm: " + (error.response?.data?.message || error.message));
            } finally {
                setLoading(false);
            }
        }
    };

    const handleAddRow = () => {
        setEditedProduct((prev) => ({
            ...prev,
            materials: [
                ...prev.materials,
                { materialId: "", materialCode: "", materialName: "", quantity: 1 },
            ],
        }));
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
        return editedProduct.materials.filter(item => {
            const searchLower = tableSearchQuery.toLowerCase().trim();
            return (
                item.materialCode?.toLowerCase().includes(searchLower) ||
                item.materialName?.toLowerCase().includes(searchLower)
            );
        });
    };

    const getPaginatedData = () => {
        const filteredData = getFilteredMaterials();
        const startIndex = currentPage * pageSize;
        const endIndex = startIndex + pageSize;
        return filteredData.slice(startIndex, endIndex);
    };

    const handlePageChange = (selectedItem) => {
        setCurrentPage(selectedItem.selected);
    };

    const getAvailableMaterials = (currentIndex) => {
        if (!editedProduct?.materials) return materials;

        const selectedMaterialIds = editedProduct.materials
            .filter((_, idx) => idx !== currentIndex)
            .map(m => m.materialId);

        return materials.filter(m => !selectedMaterialIds.includes(m.materialId));
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

    const headerButtons = (
        <div className="flex gap-2">
            <Button
                variant="text"
                color="gray"
                size="sm"
                onClick={() => navigate("/user/products")}
                className="flex items-center gap-2"
            >
                <FaArrowLeft className="h-3 w-3" /> Quay lại
            </Button>
            {!isEditing && (
                <Button
                    variant="gradient"
                    color="blue"
                    size="sm"
                    onClick={handleEdit}
                    className="flex items-center gap-2"
                >
                    <FaEdit className="h-3 w-3" /> Chỉnh sửa
                </Button>
            )}
        </div>
    );

    const getTableData = () => {
        return getPaginatedData().map((item, index) => ({
            ...item,
            id: `${currentPage * pageSize + index + 1}`,
            index: currentPage * pageSize + index + 1,
            materialId: item.materialId,
            materialCode: item.materialCode,
            materialName: item.materialName,
            quantity: item.quantity,
            unitName: materials.find(m => m.materialId === item.materialId)?.unitName || "",
        }));
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
                        options={getAvailableMaterials(params.row.index - 1)}
                        size="small"
                        getOptionLabel={(option) =>
                            `${option.materialCode} - ${option.materialName}`
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
                                handleMaterialChange(params.row.index - 1, selectedMaterial);
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
        { field: 'materialName', headerName: 'Tên NVL', flex: 2, minWidth: 400, editable: false, filterable: false },
        { field: 'unitName', headerName: 'Đơn vị', flex: 1, minWidth: 100, editable: false, filterable: false },
        {
            field: 'quantity',
            headerName: 'Số lượng',
            flex: 1,
            minWidth: 100,
            editable: false,
            filterable: false,
            renderCell: (params) => (
                <div className="w-full py-2">
                    <TextField
                        type="number"
                        size="small"
                        fullWidth
                        disabled={!isEditing}
                        inputProps={{ min: 1 }}
                        value={params.value || ''}
                        onChange={(e) => handleQuantityChange(params.row.index - 1, e.target.value)}
                        color="success"
                        hiddenLabel
                        placeholder="0"
                        sx={{
                            '& .MuiInputBase-root.Mui-disabled': {
                                bgcolor: '#eeeeee',
                                '& .MuiOutlinedInput-notchedOutline': {
                                    border: 'none',
                                },
                            },
                        }}
                    />
                    {isEditing && quantityErrors[params.row.index - 1] && (
                        <div className="text-xs text-red-500 mt-1">
                            {quantityErrors[params.row.index - 1]}
                        </div>
                    )}
                </div>
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
                        onClick={() => handleRemoveRow(params.row.index - 1)}
                    >
                        <HighlightOffRounded />
                    </IconButton>
                )
            ),
        },
    ];

    if (!product) return <div>Loading...</div>;

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
                                    value={
                                        units.find((unit) => unit.unitId === editedProduct?.unitId) || null
                                    }
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
                                    value={
                                        productTypes.find(
                                            (type) => type.typeId === editedProduct?.typeId
                                        ) || null
                                    }
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
                                        Trang {currentPage + 1} / {Math.ceil(getFilteredMaterials().length / pageSize)} •{" "}
                                        {getFilteredMaterials().length} dòng
                                    </Typography>
                                </div>
                                <ReactPaginate
                                    previousLabel={<ArrowLeftIcon strokeWidth={2} className="h-4 w-4" />}
                                    nextLabel={<ArrowRightIcon strokeWidth={2} className="h-4 w-4" />}
                                    breakLabel="..."
                                    pageCount={Math.ceil(getFilteredMaterials().length / pageSize)}
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