import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Card,
    CardBody,
    Button,
    Typography,
} from "@material-tailwind/react";
import { TextField, Button as MuiButton, Autocomplete, IconButton, Divider } from '@mui/material';
import {
    HighlightOffRounded,
    ClearRounded
} from '@mui/icons-material';
import { FaSave, FaArrowLeft, FaPlus, FaTrash } from "react-icons/fa";
import { checkProductCodeExists, createProduct, fetchProductTypes } from "./productService";
import { checkMaterialCodeExists, getAllActiveMaterials } from "../materials/materialService";
import { fetchActiveUnits } from "../unit/unitService";
import CircularProgress from '@mui/material/CircularProgress';
import axios from "axios";
import { ArrowRightIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import ReactPaginate from "react-paginate";
import PageHeader from '@/components/PageHeader';
import TableSearch from "@/components/TableSearch";
import ImageUploadBox from '@/components/ImageUploadBox';
import Table from "@/components/Table";

const authHeader = () => {
    const token = localStorage.getItem("token");
    if (!token) {
        console.warn("No token found");
        return null;
    }
    return {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    };
};

const AddProductPage = () => {
    const navigate = useNavigate();

    const [newProduct, setNewProduct] = useState({
        productCode: "",
        productName: "",
        description: "",
        unitId: "",
        productTypeId: "",
        isProductionActive: "true",
    });
    const [loading, setLoading] = useState(false);
    const [productCodeError, setProductCodeError] = useState("");
    const [validationErrors, setValidationErrors] = useState({});
    const [materials, setMaterials] = useState([]);
    const [materialSearchQuery, setMaterialSearchQuery] = useState("");
    const [filteredMaterials, setFilteredMaterials] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [nextId, setNextId] = useState(1);
    const [productMaterials, setProductMaterials] = useState([]);
    const [filteredMaterialsByField, setFilteredMaterialsByField] = useState({});
    const [showSuggestionsByField, setShowSuggestionsByField] = useState({});
    const [materialErrors, setMaterialErrors] = useState({});
    const [billOfMaterialsError, setBillOfMaterialsError] = useState("");
    const [tableSearchQuery, setTableSearchQuery] = useState("");
    const [units, setUnits] = useState([]);
    const [productTypes, setProductTypes] = useState([]);
    const [errors, setErrors] = useState({});
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(5);
    const [previewImage, setPreviewImage] = useState(null); // Thêm state cho preview
    const [quantityErrors, setQuantityErrors] = useState({}); // Thêm state cho lỗi số lượng

    useEffect(() => {
        fetchMaterials();
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            const unitsData = await fetchActiveUnits();
            const productTypesData = await fetchProductTypes();
            setUnits(unitsData);
            setProductTypes(productTypesData);
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu ban đầu:", error);
            setErrors({ message: error.message });
        }
    };

    const fetchMaterials = async () => {
        try {
            const materialsData = await getAllActiveMaterials();
            if (materialsData && Array.isArray(materialsData)) {
                console.log("Số lượng materials nhận được:", materialsData.length);
                setMaterials(materialsData);
            }
        } catch (error) {
            console.error("Lỗi khi lấy danh sách nguyên vật liệu:", error);
            setErrors({ message: error.message });
        }
    };

    const isEmptyOrWhitespace = (str) => !str || /^\s*$/.test(str);

    const handleCheckProductCode = async (newCode) => {
        // Reset cả 2 loại lỗi khi người dùng nhập
        setProductCodeError("");
        setValidationErrors(prev => ({
            ...prev,
            productCode: ""
        }));

        // Cập nhật giá trị
        setNewProduct((prev) => ({
            ...prev,
            productCode: newCode || ""
        }));

        if (newCode.trim()) {
            try {
                const exists = await checkProductCodeExists(newCode);
                if (exists) {
                    setProductCodeError("Mã sản phẩm này đã tồn tại!");
                }
            } catch (error) {
                console.error("❌ Lỗi kiểm tra mã sản phẩm:", error);
                setProductCodeError("Lỗi khi kiểm tra mã sản phẩm!");
            }
        }
    };

    const handleAddRow = () => {
        setProductMaterials((prev) => {
            const newMaterials = [
                ...prev,
                {
                    id: nextId,
                    materialId: "",
                    materialCode: "",
                    materialName: "",
                    unitName: "",
                    quantity: 1,
                }
            ];
            // ✨ Sau khi thêm dòng ➔ tính trang mới
            const totalRecords = newMaterials.length;
            const newPage = Math.floor((totalRecords - 1) / pageSize);
            setCurrentPage(newPage);

            return newMaterials;
        });
        setNextId((prev) => prev + 1);
        setBillOfMaterialsError(""); // Reset lỗi nếu có
    };


    const handleRemoveAllRows = () => {
        setProductMaterials([]);
        setNextId(1);
        setCurrentPage(0);
    };

    const validateMaterial = async (value, index) => {
        try {
            const exists = await checkMaterialCodeExists(value);
            if (!exists) {
                setMaterialErrors((prev) => ({
                    ...prev,
                    [index]: "Mã nguyên vật liệu không tồn tại!",
                }));
                return false;
            }

            const isDuplicate = productMaterials.some(
                (item, idx) => idx !== index && item.materialCode?.toLowerCase() === value?.toLowerCase()
            );

            if (isDuplicate) {
                setMaterialErrors((prev) => ({
                    ...prev,
                    [index]: "Nguyên vật liệu này đã được thêm vào danh sách!",
                }));
                return false;
            }

            setMaterialErrors((prev) => ({
                ...prev,
                [index]: "",
            }));
            return true;
        } catch (error) {
            console.error("Lỗi khi kiểm tra mã NVL:", error);
            return false;
        }
    };

    const handleSelectSuggestion = async (index, material) => {
        const isValid = await validateMaterial(material.materialCode, index);
        if (!isValid) return;

        const updatedMaterials = [...productMaterials];
        updatedMaterials[index] = {
            ...updatedMaterials[index],
            materialId: material.materialId,
            materialCode: material.materialCode,
            materialName: material.materialName,
            unitName: material.unitName,
        };
        setProductMaterials(updatedMaterials);
    };

    useEffect(() => {
        // Chỉ kiểm tra các dòng đã được chọn vật tư
        const materialsToValidate = productMaterials.filter(item => item.materialId);

        if (materialsToValidate.length === 0) {
            setBillOfMaterialsError(""); // Không hiện lỗi nếu chưa có dòng nào được chọn
            return;
        }

        const hasIncompleteRow = materialsToValidate.some(
            (item) => !item.quantity || item.quantity <= 0
        );

        if (hasIncompleteRow) {
            setBillOfMaterialsError("Vui lòng điền đầy đủ số lượng cho các dòng đã chọn!");
        } else {
            setBillOfMaterialsError("");
        }
    }, [productMaterials]);

    const handleCreateProduct = async () => {
        const newErrors = {};

        if (isEmptyOrWhitespace(newProduct.productCode)) {
            newErrors.productCode = "Mã sản phẩm không được để trống hoặc chỉ chứa khoảng trắng!";
        }
        if (isEmptyOrWhitespace(newProduct.productName)) {
            newErrors.productName = "Tên sản phẩm không được để trống hoặc chỉ chứa khoảng trắng!";
        }
        if (!newProduct.unitId) {
            newErrors.unitId = "Đơn vị không được bỏ trống!";
        }
        if (!newProduct.productTypeId) {
            newErrors.productTypeId = "Dòng sản phẩm không được bỏ trống!";
        }

        setValidationErrors(newErrors);

        // Kiểm tra toàn bộ form trước khi submit
        const hasEmptyRows = productMaterials.some(
            (item) => !item.materialId || !item.materialCode || !item.materialName || !item.quantity || item.quantity <= 0
        );

        if (hasEmptyRows) {
            setBillOfMaterialsError("Vui lòng điền đầy đủ thông tin cho tất cả các dòng vật tư!");
            return;
        }

        if (
            Object.keys(newErrors).length === 0 &&
            !productCodeError &&
            !billOfMaterialsError // Vẫn giữ check billOfMaterialsError
        ) {
            try {
                setLoading(true);

                const headers = authHeader();
                if (!headers) {
                    setErrors({ message: "Vui lòng đăng nhập lại để thực hiện thao tác này" });
                    return;
                }

                const formData = new FormData();
                formData.append("productCode", newProduct.productCode.trim());
                formData.append("productName", newProduct.productName.trim());
                formData.append("description", newProduct.description?.trim() || "");
                formData.append("unitId", newProduct.unitId || "");
                formData.append("typeId", newProduct.productTypeId || "");
                formData.append("isProductionActive", newProduct.isProductionActive === "true" || true);
                if (newProduct.image) {
                    formData.append("image", newProduct.image);
                }

                const materialsData = productMaterials.map((item) => ({
                    materialId: item.materialId,
                    materialCode: item.materialCode,
                    materialName: item.materialName,
                    quantity: item.quantity,
                }));
                formData.append("materials", JSON.stringify(materialsData));

                for (const [key, value] of formData.entries()) {
                    console.log(`[FormData] ${key}:`, value);
                }

                const response = await axios.post(
                    `${import.meta.env.VITE_API_URL}/user/products/create`,
                    formData,
                    {
                        headers: {
                            Authorization: headers.Authorization,
                        },
                        withCredentials: true,
                    }
                );

                if (response.data) {
                    navigate("/user/products", { state: { successMessage: "Tạo sản phẩm thành công!" } });
                }
            } catch (error) {
                console.error("Create product error:", error);
                setErrors({
                    message: `Có lỗi xảy ra: ${error.response?.data?.message || error.message}`,
                });
            } finally {
                setLoading(false);
            }
        }
    };

    const isCreateDisabled = () => {
        return loading || !!productCodeError;
    };

    const isFieldValid = (value) => {
        return value && !isEmptyOrWhitespace(value);
    };

    const getFilteredMaterials = () => {
        return productMaterials.filter(item => {
            const searchLower = tableSearchQuery.toLowerCase().trim();
            return item.materialCode?.toLowerCase().includes(searchLower) ||
                item.materialName?.toLowerCase().includes(searchLower);
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

    useEffect(() => {
        return () => {
            if (previewImage) {
                URL.revokeObjectURL(previewImage);
            }
        };
    }, [previewImage]);

    // Thêm hàm xử lý reset lỗi khi nhập
    const handleInputChange = (field, value) => {
        // Reset lỗi cho trường tương ứng
        setValidationErrors(prev => ({
            ...prev,
            [field]: "" // Xóa lỗi khi người dùng nhập
        }));

        // Cập nhật giá trị cho form
        setNewProduct(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Thêm hàm xử lý khi chọn đơn vị
    const handleUnitChange = (selectedOption) => {
        // Reset lỗi
        setValidationErrors(prev => ({
            ...prev,
            unitId: ""
        }));

        // Cập nhật giá trị
        setNewProduct(prev => ({
            ...prev,
            unitId: selectedOption ? selectedOption.unitId : ""
        }));
    };

    // Thêm hàm xử lý khi chọn dòng sản phẩm  
    const handleProductTypeChange = (selectedOption) => {
        // Reset lỗi
        setValidationErrors(prev => ({
            ...prev,
            productTypeId: ""
        }));

        // Cập nhật giá trị
        setNewProduct(prev => ({
            ...prev,
            productTypeId: selectedOption ? selectedOption.typeId : ""
        }));
    };

    // Thêm hàm lọc materials để loại bỏ những cái đã chọn
    const getAvailableMaterials = () => {
        const selectedMaterialIds = productMaterials.map(pm => pm.materialId);
        return materials.filter(m => !selectedMaterialIds.includes(m.materialId));
    };

    // Lấy danh sách đã lọc
    const filteredTableMaterials = getFilteredMaterials();

    // Sửa lại hàm validate khi thay đổi số lượng
    const handleQuantityChange = (index, value) => {
        // Chuyển đổi value thành số và đảm bảo giá trị hợp lệ
        const numValue = value === '' ? '' : Number(value);

        const updatedMaterials = [...productMaterials];
        const actualIndex = index; // Không cần tính toán với currentPage vì index đã đúng

        updatedMaterials[actualIndex] = {
            ...updatedMaterials[actualIndex],
            quantity: numValue
        };

        setProductMaterials(updatedMaterials);

        // Validate số lượng
        if (!numValue || numValue <= 0) {
            setQuantityErrors(prev => ({
                ...prev,
                [actualIndex]: "Số lượng phải lớn hơn 0"
            }));
        } else {
            setQuantityErrors(prev => ({
                ...prev,
                [actualIndex]: ""
            }));
        }
    };

    // Thêm hàm filter mới
    const filterMaterials = (inputValue) => {
        return getAvailableMaterials().filter(material =>
            material.materialCode.toLowerCase().includes(inputValue.toLowerCase()) ||
            material.materialName.toLowerCase().includes(inputValue.toLowerCase())
        );
    };

    // Thêm hàm handleRemoveRow
    const handleRemoveRow = (index) => {
        setProductMaterials(prev => prev.filter((_, i) => i !== index));
        // Reset error nếu có
        setMaterialErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[index];
            return newErrors;
        });
        setQuantityErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[index];
            return newErrors;
        });
    };

    const columnsConfig = [
        { field: 'index', headerName: 'STT', flex: 0.5, minWidth: 30, editable: false, filterable: false },
        {
            field: 'materialCode',
            headerName: 'Mã vật tư',
            flex: 1.5,
            minWidth: 250,
            editable: false,
            filterable: false,
            renderCell: (params) => (
                <Autocomplete
                    sx={{ width: '100%', paddingY: '0.5rem' }}
                    options={getAvailableMaterials()}
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
                            handleSelectSuggestion(params.row.index - 1, selectedMaterial);
                        }
                    }}
                    renderInput={(params) => (
                        <TextField
                            color="success"
                            hiddenLabel
                            {...params}
                            placeholder="Mã vật tư"
                        />
                    )}
                />
            ),
        },
        {
            field: 'materialName',
            headerName: 'Tên vật tư',
            flex: 2,
            minWidth: 400,
            editable: false,
            filterable: false,
        },
        {
            field: 'unitName',
            headerName: 'Đơn vị',
            flex: 1,
            minWidth: 50,
            editable: false,
            filterable: false,
        },
        {
            field: 'quantity',
            headerName: 'Số lượng',
            flex: 1,
            minWidth: 100,
            editable: false,
            filterable: false,
            renderCell: (params) => (
                <div className="w-full">
                    <TextField
                        type="number"
                        size="small"
                        color="success"
                        inputProps={{ min: 1 }}
                        value={params.row.quantity || ''}
                        onChange={(e) => handleQuantityChange(params.row.index - 1, e.target.value)}
                        style={{ width: '100%' }}
                    />
                    {quantityErrors[params.row.index - 1] && (
                        <div className="text-xs text-red-500 mt-1">
                            {quantityErrors[params.row.index - 1]}
                        </div>
                    )}
                </div>
            ),
        },
        {
            field: 'actions',
            headerName: 'Hành động',
            flex: 0.5,
            minWidth: 100,
            editable: false,
            filterable: false,
            renderCell: (params) => (
                <div className="flex justify-center w-full">
                    <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                            e.stopPropagation(); // Ngăn sự kiện bubble
                            handleRemoveRow(params.row.index - 1);
                        }}
                    >
                        <HighlightOffRounded />
                    </IconButton>
                </div>
            ),
        },
    ];


    const data = productMaterials.map((item, index) => ({
        id: index + 1,  // DataGrid cần `id`
        index: index + 1,
        materialId: item.materialId,
        materialCode: item.materialCode,
        materialName: item.materialName,
        unitName: item.unitName,
        quantity: item.quantity,
    }));

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
                        title={"Tạo sản phẩm mới"}
                        addButtonLabel=""
                        onAdd={() => { }}
                        onImport={() => {/* Xử lý import nếu có */ }}
                        onExport={() => {/* Xử lý export file ở đây nếu có */ }}
                        showAdd={false}
                        showImport={false} // Ẩn nút import nếu không dùng
                        showExport={false} // Ẩn xuất file nếu không dùng
                    />
                    {errors.message && (
                        <Typography className="text-red-500 mb-4">{errors.message}</Typography>
                    )}

                    <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                        <div className="flex flex-col gap-4">
                            <div>
                                <Typography variant="medium" className="mb-1 text-black">
                                    Mã sản phẩm
                                    <span className="text-red-500"> *</span>
                                </Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    hiddenLabel
                                    placeholder="Mã sản phẩm"
                                    color="success"
                                    value={newProduct.productCode || ""}
                                    onChange={(e) => handleCheckProductCode(e.target.value)}
                                    error={Boolean(
                                        errors.productCode ||
                                        productCodeError ||
                                        (validationErrors.productCode && !isFieldValid(newProduct.productCode))
                                    )}
                                />
                                {(productCodeError || validationErrors.productCode || errors.productCode) && (
                                    <Typography color="red" className="text-xs text-start mt-1">
                                        {productCodeError || validationErrors.productCode || errors.productCode}
                                    </Typography>
                                )}
                            </div>

                            <div>
                                <Typography variant="medium" className="mb-1 text-black">
                                    Đơn vị
                                    <span className="text-red-500"> *</span>
                                </Typography>
                                <Autocomplete
                                    options={units}
                                    size="small"
                                    getOptionLabel={(option) => option.unitName || ""}
                                    value={
                                        units.find((unit) => unit.unitId === newProduct.unitId) || null
                                    }
                                    onChange={(event, selectedUnit) => {
                                        handleUnitChange(selectedUnit);
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
                                    value={newProduct.description || ""}
                                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div>
                                <Typography variant="medium" className="mb-1 text-black">
                                    Tên sản phẩm
                                    <span className="text-red-500"> *</span>
                                </Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    hiddenLabel
                                    placeholder="Tên sản phẩm"
                                    color="success"
                                    value={newProduct.productName || ""}
                                    onChange={(e) => handleInputChange("productName", e.target.value)}
                                    error={Boolean(errors.productName ||
                                        (validationErrors.productName && !isFieldValid(newProduct.productName)))}
                                />
                                {(validationErrors.productName || errors.productName) && (
                                    <Typography color="red" className="text-xs text-start mt-1">
                                        {validationErrors.productName || errors.productName}
                                    </Typography>
                                )}
                            </div>

                            <div>
                                <Typography variant="medium" className="mb-1 text-black">
                                    Dòng sản phẩm
                                    <span className="text-red-500"> *</span>
                                </Typography>
                                <Autocomplete
                                    options={productTypes}
                                    size="small"
                                    getOptionLabel={(option) => option.typeName || ""}
                                    value={
                                        productTypes.find(
                                            (type) => type.typeId === newProduct.productTypeId
                                        ) || null
                                    }
                                    onChange={(event, selectedType) => {
                                        handleProductTypeChange(selectedType);
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            color="success"
                                            hiddenLabel
                                            {...params}
                                            placeholder="Dòng sản phẩm"
                                        />
                                    )}
                                />
                                {validationErrors.productTypeId && (
                                    <Typography className="text-xs text-red-500 mt-1">
                                        {validationErrors.productTypeId}
                                    </Typography>
                                )}
                            </div>

                            <div>
                                <Typography variant="medium" className="mb-1 text-black">
                                    Hình ảnh sản phẩm
                                </Typography>
                                <ImageUploadBox
                                    onFileSelect={(file) => {
                                        const imageUrl = URL.createObjectURL(file);
                                        setPreviewImage(imageUrl);
                                        setNewProduct((prev) => ({
                                            ...prev,
                                            image: file
                                        }));
                                    }}
                                />
                                {/* Hiển thị ảnh preview */}
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

                    <div className="mt-8">
                        <Typography variant="h6" color="blue-gray" className="mb-4">
                            Định mức vật tư
                        </Typography>

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

                        {billOfMaterialsError && (
                            <Typography className="text-xs text-red-500 mb-2">
                                {billOfMaterialsError}
                            </Typography>
                        )}

                        <Table data={getPaginatedData().map((item, index) => ({
                            ...item,
                            index: currentPage * pageSize + index + 1 // Cập nhật lại STT
                        }))} columnsConfig={columnsConfig} enableSelection={false} />

                        {filteredTableMaterials.length > 0 && (
                            <div className="flex items-center justify-between border-t border-blue-gray-50 pt-4">
                                <div className="flex items-center gap-2">
                                    <Typography variant="small" color="blue-gray" className="font-normal">
                                        Trang {currentPage + 1} / {Math.ceil(filteredTableMaterials.length / pageSize)} •{" "}
                                        {filteredTableMaterials.length} bản ghi
                                    </Typography>
                                </div>
                                <ReactPaginate
                                    previousLabel={<ArrowLeftIcon strokeWidth={2} className="h-4 w-4" />}
                                    nextLabel={<ArrowRightIcon strokeWidth={2} className="h-4 w-4" />}
                                    breakLabel="..."
                                    pageCount={Math.ceil(filteredTableMaterials.length / pageSize)}
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

                        <div className="flex gap-2 my-4 h-8">
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
                    </div>
                    <Divider />
                    <div className="my-4 flex justify-between">
                        <MuiButton
                            color="info"
                            size="medium"
                            variant="outlined"
                            sx={{
                                height: '36px',
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
                        <div className="flex justify-end gap-2">
                            <MuiButton
                                size="medium"
                                color="error"
                                variant="outlined"
                                onClick={() => navigate("/user/products")}
                            >
                                Hủy
                            </MuiButton>
                            <Button
                                size="lg"
                                color="white"
                                variant="text"
                                className="bg-[#0ab067] hover:bg-[#089456]/90 shadow-none text-white font-medium py-2 px-4 ml-2 rounded-[4px] transition-all duration-200 ease-in-out"
                                ripple={true}
                                onClick={handleCreateProduct}
                                disabled={isCreateDisabled()}
                            >
                                Lưu
                            </Button>
                        </div>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
};

export default AddProductPage;