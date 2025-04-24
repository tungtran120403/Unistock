import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useProduct from "./useProduct";
//import { Button } from "@material-tailwind/react";
import { FaAngleDown } from "react-icons/fa";
import { ArrowRightIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import {
  IconButton,
  Button,
  MenuItem,
  Menu,
  Checkbox,
  ListItemText,
} from '@mui/material';
import {
  VisibilityOutlined,
} from '@mui/icons-material';
import ReactPaginate from "react-paginate";
import ImportProductModal from "./ImportProductModal";
import {
  importExcel,
  exportExcel,
  createProduct,
  previewImport,
  fetchProductTypes,
} from "./productService";
import { fetchActiveUnits } from "../unit/unitService";
import {
  Card,
  CardBody,
  Typography,
  Tooltip,
  Switch,
} from "@material-tailwind/react";
import PageHeader from '@/components/PageHeader';
import TableSearch from '@/components/TableSearch';
import Table from "@/components/Table";
import StatusFilterButton from "@/components/StatusFilterButton";

import SuccessAlert from "@/components/SuccessAlert";
import ConfirmDialog from "@/components/ConfirmDialog";

const ProductPage = () => {
  const navigate = useNavigate();
  // Sử dụng useProduct hook
  const {
    products,
    loading,
    currentPage,
    pageSize,
    totalPages,
    totalElements,
    fetchPaginatedProducts,
    handleToggleStatus,
    handlePageChange,
    handlePageSizeChange
  } = useProduct();

  // Các state trong component
  const [showImportPopup, setShowImportPopup] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewResults, setPreviewResults] = useState([]);
  const [file, setFile] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [units, setUnits] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); // State for search term

  const [statusAnchorEl, setStatusAnchorEl] = useState(null);
  const [selectedStatuses, setSelectedStatuses] = useState([]);

  const [selectedProductTypes, setSelectedProductTypes] = useState([]);
  const [productTypeAnchorEl, setProductTypeAnchorEl] = useState(null);

  const allStatuses = [
    {
      value: true,
      label: "Đang sản xuất",
      className: "bg-green-50 text-green-800",
    },
    {
      value: false,
      label: "Ngừng sản xuất",
      className: "bg-red-50 text-red-800",
    },
  ];

  // Handle search
  const handleSearch = () => {
    // Reset to first page when searching
    setCurrentPage(0);
    fetchPaginatedReceiptNotes(0, pageSize, searchTerm);
  };

  const [newProduct, setNewProduct] = useState({
    productCode: "",
    productName: "",
    description: "",
    unitId: "",
    typeId: "",
    isProductionActive: "true"
  });

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingToggleRow, setPendingToggleRow] = useState(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const location = useLocation();

  useEffect(() => {
    if (location.state?.successMessage) {
      console.log("Component mounted, location.state:", location.state?.successMessage);
      setAlertMessage(location.state.successMessage);
      setShowSuccessAlert(true);
      // Xóa state để không hiển thị lại nếu người dùng refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Fetch unit và product types
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [unitsData, typesData] = await Promise.all([
          fetchActiveUnits(),
          fetchProductTypes()
        ]);

        console.log("Fetched units:", unitsData);
        console.log("Fetched productTypes:", typesData);

        setUnits(Array.isArray(unitsData) ? unitsData : []);
        setProductTypes(Array.isArray(typesData) ? typesData : []);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách đơn vị và dòng sản phẩm:", error);
        setUnits([]);
        setProductTypes([]);
      }
    };
    fetchData();
  }, []);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setLocalLoading(true);
    try {
      const preview = await previewImport(file);
      setPreviewResults(preview);
    } catch (err) {
      console.error("Lỗi preview:", err);
      alert("❌ Lỗi khi kiểm tra file. Vui lòng thử lại.");
    } finally {
      setLocalLoading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    setLocalLoading(true);
    try {
      await importExcel(selectedFile);
      alert("✅ Import thành công!");
      setPreviewResults([]);
      setSelectedFile(null);
      fetchPaginatedProducts();
    } catch (err) {
      alert("❌ Import thất bại: " + (err.response?.data || err.message));
    } finally {
      setLocalLoading(false);
    }
  };

  const handleEdit = (product) => {
    navigate(`/user/products/${product.productId}`);
  };

  const handleUpdateSuccess = () => {
    fetchPaginatedProducts();
  };

  const handlePageChangeWrapper = (selectedItem) => {
    handlePageChange(selectedItem.selected);
  };

  const handleAddProduct = () => {
    navigate("/user/products/add");
  };

  // Hàm xử lý export với xác nhận
  const handleExport = () => {
    const confirmExport = window.confirm("Bạn có muốn xuất danh sách sản phẩm ra file Excel không?");
    if (confirmExport) {
      setLocalLoading(true);
      exportExcel()
        .then((blob) => {
          const url = window.URL.createObjectURL(new Blob([blob]));
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", "products_export.xlsx");
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          alert("✅ Xuất file Excel thành công!");
        })
        .catch((err) => {
          alert("❌ Lỗi khi xuất file Excel: " + (err.message || "Không xác định"));
        })
        .finally(() => {
          setLocalLoading(false);
        });
    }
  };

  const columnsConfig = [
    { field: 'index', headerName: 'STT', flex: 0.5, minWidth: 40, editable: false, filterable: false },
    { field: 'productCode', headerName: 'Mã sản phẩm', flex: 1, minWidth: 150, editable: false, filterable: false },
    { field: 'productName', headerName: 'Tên sản phẩm', flex: 2, minWidth: 200, editable: false, filterable: false },
    {
      field: 'unitName',
      headerName: 'Đơn vị',
      flex: 1,
      minWidth: 40,
      editable: false,
      filterable: false,
    },
    {
      field: 'productTypeName',
      headerName: 'Dòng sản phẩm',
      flex: 1.5,
      minWidth: 120,
      editable: false,
      filterable: false,
    },
    {
      field: 'imageUrl',
      headerName: 'Hình ảnh',
      flex: 1,
      minWidth: 120,
      editable: false,
      filterable: false,
      renderCell: (params) => {
        return params.value ? (
          <img
            src={params.value}
            alt="Hình ảnh sản phẩm"
            className="w-12 h-12 object-cover rounded-lg"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = '-';
            }}
          />
        ) : (
          <Typography className="text-xs text-gray-600">Không có ảnh</Typography>
        );
      },
    },
    {
      field: 'isProductionActive',
      headerName: 'Trạng thái',
      flex: 1,
      minWidth: 200,
      editable: false,
      filterable: false,
      renderCell: (params) => {
        return (
          <div className="flex items-center gap-2">
            <Switch
              color="green"
              checked={params.value}
              onChange={() => {
                setPendingToggleRow(params.row);
                setConfirmDialogOpen(true);
              }}
            />
            <div
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                      ${params.value ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
                }`}
            >
              {params.value ? "Đang sản xuất" : "Ngừng sản xuất"}
            </div>
          </div>
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Hành động',
      flex: 0.5,
      minWidth: 60,
      renderCell: (params) => (
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <Tooltip content="Xem chi tiết">
            <IconButton
              size="small"
              color="primary"
              onClick={() => navigate(`/user/products/${params.row.id}`)}
            >
              <VisibilityOutlined />
            </IconButton>
          </Tooltip>
        </div>
      ),
    },
  ];

  const data = products.map((product, index) => ({
    id: product.productId,
    index: currentPage * pageSize + index + 1,
    productCode: product.productCode || "-",
    productName: product.productName,
    unitName: product.unitName || "-",
    productTypeName: productTypes.find(type => type.typeId === product.typeId)?.typeName || product.typeName || "-",
    imageUrl: product.imageUrl || "-",
    isProductionActive: !!product.isProductionActive,
  }));

  // Add this function
  const filteredProducts = Array.isArray(products)
    ? products.filter(product =>
      product.productCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.productName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    : [];

  const hasInvalidRows = previewResults.some((row) => row.valid === false);

  return (
    <div className="mb-8 flex flex-col gap-12" style={{ height: 'calc(100vh-100px)' }}>
      <Card className="bg-gray-50 p-7 rounded-none shadow-none">
        <CardBody className="pb-2 bg-white rounded-xl">
          <PageHeader
            title="Danh sách sản phẩm"
            addButtonLabel="Thêm sản phẩm"
            onAdd={handleAddProduct}
            onImport={() => setShowImportPopup(true)}
            onExport={handleExport} // Sử dụng hàm handleExport mới
          />
          {/* Phần chọn số items/trang */}
          <div className="py-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Typography variant="small" color="blue-gray" className="font-light">
                Hiển thị
              </Typography>
              <select
                value={pageSize}
                onChange={(e) => {
                  handlePageSizeChange(Number(e.target.value));
                }}
                className="border text-sm rounded px-2 py-1"
              >
                {[5, 10, 20, 50].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <Typography variant="small" color="blue-gray" className="font-normal">
                bản ghi mỗi trang
              </Typography>
            </div>

            <div className="mb-3 flex flex-wrap items-center gap-4">
              {/* Filter by status */}
              <StatusFilterButton
                anchorEl={statusAnchorEl}
                setAnchorEl={setStatusAnchorEl}
                selectedStatuses={selectedStatuses}
                setSelectedStatuses={setSelectedStatuses}
                allStatuses={allStatuses}
                buttonLabel="Trạng thái"
              />

              {/* Filter by product type */}
              <Button
                onClick={(e) => setProductTypeAnchorEl(e.currentTarget)}
                size="sm"
                variant={selectedProductTypes.length > 0 ? "outlined" : "contained"}
                sx={{
                  ...(selectedProductTypes.length > 0
                    ? {
                      backgroundColor: "#ffffff",
                      boxShadow: "none",
                      borderColor: "#089456",
                      textTransform: "none",
                      color: "#089456",
                      px: 1.5,
                      "&:hover": {
                        backgroundColor: "#0894561A",
                        borderColor: "#089456",
                        boxShadow: "none",
                      },
                    }
                    : {
                      backgroundColor: "#0ab067",
                      boxShadow: "none",
                      textTransform: "none",
                      color: "#ffffff",
                      px: 1.5,
                      "&:hover": {
                        backgroundColor: "#089456",
                        borderColor: "#089456",
                        boxShadow: "none",
                      },
                    }),
                }}
              >
                {selectedProductTypes.length > 0 ? (
                  <span className="flex items-center gap-[5px]">
                    {selectedProductTypes[0]?.typeName}
                    {selectedProductTypes.length > 1 && (
                      <span className="text-xs bg-[#089456] text-white p-1 rounded-xl font-thin">+{selectedProductTypes.length - 1}</span>
                    )}
                  </span>
                ) : (
                  <span className="flex items-center gap-[5px]">
                    Dòng sản phẩm <FaAngleDown className="h-4 w-4" />
                  </span>
                )}
              </Button>
              <Menu
                anchorEl={productTypeAnchorEl}
                open={Boolean(productTypeAnchorEl)}
                onClose={() => setProductTypeAnchorEl(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
              >
                {productTypes.map((pt) => (
                  <MenuItem key={pt.typeId}
                    onClick={() => {
                      const updated = selectedProductTypes.includes(pt)
                        ? selectedProductTypes.filter(p => p !== pt)
                        : [...selectedProductTypes, pt];
                      setSelectedProductTypes(updated);
                      setCurrentPage(0);
                    }}
                    sx={{ paddingLeft: "7px", minWidth: "150px" }}
                  >
                    <Checkbox color="success" size="small" checked={selectedProductTypes.some(p => p.typeId === pt.typeId)} />
                    <ListItemText primary={pt.typeName} />
                  </MenuItem>
                ))}
                {selectedProductTypes.length > 0 && (
                  <div className="flex justify-end">
                    <Button
                      variant="text"
                      size="medium"
                      onClick={() => {
                        setSelectedProductTypes([]);
                        setCurrentPage(0);
                      }}
                      sx={{
                        color: "#000000DE",
                        "&:hover": {
                          backgroundColor: "transparent",
                          textDecoration: "underline",
                        },
                      }}
                    >
                      Xóa
                    </Button>
                  </div>
                )}
              </Menu>

              {/* Search input */}
              <div className="w-[250px]">
                <TableSearch
                  value={searchTerm}
                  onChange={setSearchTerm}
                  onSearch={handleSearch}
                  placeholder="Tìm kiếm sản phẩm"
                />
              </div>
            </div>
          </div>
          <Table
            data={data}
            columnsConfig={columnsConfig}
            enableSelection={false}
          />

          <div className="flex items-center justify-between border-t border-blue-gray-50 py-4">
            <div className="flex items-center gap-2">
              <Typography variant="small" color="blue-gray" className="font-normal">
                Trang {currentPage + 1} / {totalPages} • {totalElements} bản ghi
              </Typography>
            </div>
            <ReactPaginate
              previousLabel={<ArrowLeftIcon strokeWidth={2} className="h-4 w-4" />}
              nextLabel={<ArrowRightIcon strokeWidth={2} className="h-4 w-4" />}
              breakLabel="..."
              pageCount={totalPages}
              marginPagesDisplayed={2}
              pageRangeDisplayed={5}
              onPageChange={handlePageChangeWrapper}
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
        </CardBody>
      </Card>

      {showImportPopup && (
        <ImportProductModal
          open={showImportPopup}
          onClose={() => setShowImportPopup(false)}
          onSuccess={fetchPaginatedProducts}
        />
      )}

      <ConfirmDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={() => {
          if (pendingToggleRow) {
            handleToggleStatus(pendingToggleRow.id); // truyền đúng giá trị mới
            setAlertMessage("Cập nhật trạng thái thành công!");
            setShowSuccessAlert(true);
          }
          setConfirmDialogOpen(false);
        }}
        message={`Bạn có chắc chắn muốn ${pendingToggleRow?.isProductionActive ? "ngưng sản xuất" : "sản xuất lại"} sản phẩm này không?`}
        confirmText="Có"
        cancelText="Không"
      />

      <SuccessAlert
        open={showSuccessAlert}
        onClose={() => setShowSuccessAlert(false)}
        message={alertMessage}
      />
    </div>
  );
};

export default ProductPage;