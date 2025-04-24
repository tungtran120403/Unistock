import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Typography,
  Button,
  Input,
  Textarea,
} from "@material-tailwind/react";
import { useNavigate, useLocation } from "react-router-dom";
import PageHeader from '@/components/PageHeader';
import { ArrowLeftIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { getWarehouseList } from "../warehouse/warehouseService";
import { getProducts } from "../saleorders/saleOrdersService";
import { createReceiptNote, uploadPaperEvidence as uploadPaperEvidenceService, getNextCode } from "./receiptNoteService";
import Select from "react-select";
import { FaPlus, FaTrash } from "react-icons/fa";
import ReactPaginate from "react-paginate";

const customStyles = {
  control: (provided, state) => ({
    ...provided,
    minWidth: 200,
    borderColor: state.isFocused ? "black" : provided.borderColor,
    boxShadow: state.isFocused ? "0 0 0 1px black" : "none",
    "&:hover": {
      borderColor: "black",
    },
  }),
  menuList: (provided) => ({
    ...provided,
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused
      ? "#f3f4f6"
      : state.isSelected
        ? "#e5e7eb"
        : "transparent",
    color: "#000",
    cursor: "pointer",
    "&:active": {
      backgroundColor: "#e5e7eb",
    },
  }),
};

const AddReceiptNoteManually = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [receiptCode, setReceiptCode] = useState("");
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);

  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([]);
  const [nextId, setNextId] = useState(1);
  const [category, setCategory] = useState("");

  const [pageSize, setPageSize] = useState(5);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);


  useEffect(() => {
    const fetchInitData = async () => {
      const resWarehouses = await getWarehouseList();
      setWarehouses(resWarehouses?.data || resWarehouses || []);

      const resProducts = await getProducts();
      const options = resProducts.content.map(p => ({
        value: p.productId,
        label: `${p.productCode} - ${p.productName}`,
        unitId: p.unitId,
        unitName: p.unitName
      }));
      setProducts(options);

      const nextCode = await getNextCode();
      setReceiptCode(nextCode);
    };

    fetchInitData();
  }, []);

  useEffect(() => {
    if (location.state?.category) {
      setCategory(location.state.category);
    }
  }, [location.state]);

  const handleAddRow = () => {
    setItems(prev => [...prev, { id: nextId, product: null, quantity: 1, warehouse: "" }]);
    setNextId(id => id + 1);
  };

  const handleRemoveRow = (id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleChange = (id, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        let updated = { ...item, [field]: value };
  
        if (field === 'product' && !item.warehouse && category) {
          const defaultWarehouse = getDefaultWarehouse(category);
          updated.warehouse = defaultWarehouse;
        }
  
        return updated;
      }
      return item;
    }));
  };
  
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const response = await getWarehouseList();

        console.log("Danh sách kho trả về từ API:", response);
        // Đảm bảo response có dữ liệu đúng định dạng
        if (response && Array.isArray(response.data)) {
          setWarehouses(response.data);
        } else if (Array.isArray(response)) {
          setWarehouses(response);
        } else {
          console.error("Dữ liệu kho không đúng định dạng:", response);
          setWarehouses([]);
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh sách kho:", error);
        setWarehouses([]);
      }
    };

    fetchWarehouses();
  }, []);

  // Xác định kho mặc định dựa trên loại nhập kho
  const getDefaultWarehouse = (warehouseType) => {
    const warehouseTypeMap = {
      "Thành phẩm sản xuất": "KTP", // Mã cho Kho thành phẩm
      "Vật tư mua bán": "KVT", // Mã cho Kho vật tư
      "Hàng hóa gia công": "KVT", // Cũng sử dụng Kho vật tư
      "Hàng hóa trả lại": "KPL" // Mã cho Kho phế liệu
    };
    const warehouseCode = warehouseTypeMap[warehouseType] || "";
    const defaultWarehouse = warehouses.find(w => w.warehouseCode === warehouseCode);
    return defaultWarehouse ? defaultWarehouse.warehouseCode : "";
  };

  // Xử lý khi loại nhập kho thay đổi
  const handleReferenceDocumentChange = (selectedCategory) => {
    setCategory(selectedCategory);
  
    const defaultWarehouseCode = getDefaultWarehouse(selectedCategory);
  
    // Gán lại kho mặc định cho tất cả item chưa có kho
    setItems(prevItems =>
      prevItems.map(item =>
        !item.warehouse ? { ...item, warehouse: defaultWarehouseCode } : item
      )
    );
  };
  
  // Xử lý thay đổi kho cho sản phẩm
  const handleWarehouseChange = (itemId, warehouseCode) => {
    setItemWarehouses(prev => ({
      ...prev,
      [itemId]: warehouseCode
    }));

    // Đánh dấu rằng kho này đã được chọn thủ công
    setManuallySelectedWarehouses(prev => ({
      ...prev,
      [itemId]: true
    }));
  };

  // Xử lý upload file
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validTypes = [
      "application/pdf", "image/png", "image/jpeg",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    const validFiles = selectedFiles.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`File "${file.name}" vượt quá 5MB`);
        return false;
      }
      if (!validTypes.includes(file.type)) {
        alert(`File "${file.name}" không đúng định dạng được hỗ trợ`);
        return false;
      }
      return true;
    });

    const total = files.length + validFiles.length;
    if (total > 3) {
      alert("Chỉ được tải tối đa 3 file");
      return;
    }

    setFiles(prev => [...prev, ...validFiles]);
  };


  const handleRemoveFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Kiểm tra dữ liệu

      const itemsWithMissingData = items.filter(item =>
        !item.product || !item.warehouse || !item.quantity || Number(item.quantity) <= 0
      );

      if (itemsWithMissingData.length > 0) {
        alert("Vui lòng nhập đầy đủ thông tin cho tất cả các dòng.");
        setIsSubmitting(false);
        return;
      }

      const details = items.map(item => ({
        productId: item.product.value,
        warehouseId: warehouses.find(w => w.warehouseCode === item.warehouse)?.warehouseId,
        quantity: Number(item.quantity),
        unitId: item.product.unitId
      }));

      const payload = {
        grnCode: receiptCode,
        receiptDate: new Date().toISOString(),
        description,
        category: category,
        details
      };

      const res = await createReceiptNote(payload);
      if (files.length > 0) {
        await uploadPaperEvidenceService(res.grnId, "GOOD_RECEIPT_NOTE", files);
      }
      alert("Tạo phiếu nhập thành công!");
      navigate("/user/receiptNote");
    } catch (e) {
      console.error(e);
      alert("Đã xảy ra lỗi khi lưu phiếu nhập.");
    }
  };

  const displayedItems = items.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const totalPages = Math.ceil(items.length / pageSize);

  return (
    <div className="mb-8 flex flex-col gap-12">
      <Card className="bg-gray-50 p-7">
        <CardBody className="pb-2 bg-white rounded-xl">
          <PageHeader title={`Phiếu nhập kho ${receiptCode}`} showAdd={false} showImport={false} showExport={false} />

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Typography variant="small">
                Phân loại nhập kho <span className="text-red-500">*</span>
              </Typography>
              {location.state?.category ? (
                <Input
                  value={category}
                  disabled
                  className="!border-t-blue-gray-200 focus:!border-t-gray-900"
                  labelProps={{
                    className: "before:content-none after:content-none",
                  }}
                />
              ) : (
                <Select
                  className="!border-t-blue-gray-200 focus:!border-t-gray-900"
                  labelProps={{
                    className: "before:content-none after:content-none",
                  }}
                  value={category}
                  onChange={(value) => {
                    setCategory(value);
                    handleReferenceDocumentChange(value);
                  }}
                  required
                >
                  <Option value="Thành phẩm sản xuất">Thành phẩm sản xuất</Option>
                  <Option value="Vật tư mua bán">Vật tư mua bán</Option>
                  <Option value="Hàng hóa gia công">Hàng hóa gia công</Option>
                  <Option value="Hàng hóa trả lại">Hàng hóa trả lại</Option>
                </Select>
              )}

              {!category && (
                <Typography variant="small" className="text-red-500 mt-1">
                  Vui lòng chọn phân loại nhập kho
                </Typography>
              )}
            </div>
            <div>
              <Typography variant="small">Ngày tạo phiếu</Typography>
              <Input
                className="!border-t-blue-gray-200 focus:!border-t-gray-900"
                labelProps={{
                  className: "before:content-none after:content-none",
                }}
                type="date"
                value={receiptDate} onChange={(e) => setReceiptDate(e.target.value)} />
            </div>
          </div>

          {/* Diễn giải & Kèm theo */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Typography variant="small">Diễn giải</Typography>
              <Textarea
                className="!border-t-blue-gray-200 focus:!border-t-gray-900"
                labelProps={{
                  className: "before:content-none after:content-none",
                }}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nhập diễn giải cho phiếu nhập kho"
              />
            </div>
            <div>
              <Typography variant="small">Kèm theo</Typography>
              <div className="border border-dashed border-gray-400 p-4 rounded-md text-center">
                <p className="text-gray-500 text-xs">Kéo thả tối đa 3 file, mỗi file không quá 5MB</p>
                <p className="text-xs">Hoặc</p>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.png,.docx,.xlsx"
                  className="mt-2 text-xs"
                />
              </div>
              {/* Hiển thị danh sách file đã chọn */}
              {files.length > 0 && (
                <div className="mt-2">
                  <Typography variant="small" className="font-semibold">
                    File đã chọn ({files.length}/3):
                  </Typography>
                  <div className="grid grid-cols-3 gap-2 mt-1 text-sm text-gray-700">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between border p-1 rounded-md text-xs bg-gray-100"
                      >
                        <span className="truncate max-w-[80px]">{file.name}</span>
                        <Button
                          size="sm"
                          color="red"
                          variant="text"
                          onClick={() => handleRemoveFile(index)}
                          className="p-1 min-w-[20px] h-5"
                        >
                          ✖
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 mb-4">
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
                className="border rounded px-2 py-1 text-sm"
              >
                {[5, 10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <Typography variant="small" color="blue-gray" className="font-normal">
                dòng mỗi trang
              </Typography>
            </div>
          </div>

          {/* Bảng nhập hàng */}
          <div className="border border-gray-200 rounded mb-4">
            <table className="w-full text-left min-w-max border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['STT', 'Hàng hóa', 'Kho lưu hàng', 'Số lượng nhập kho', 'Đơn vị', 'Hành động'].map((head) => (
                    <th
                      key={head}
                      className="px-4 py-2 text-sm font-semibold text-gray-600 border-r last:border-r-0"
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayedItems.length > 0 ? (
                  displayedItems.map((item, index) => (
                    <tr key={item.id} className="border-b last:border-b-0 hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-center text-gray-700 border-r">
                        {currentPage * pageSize + index + 1}
                      </td>
                      <td className="px-4 py-2 text-sm border-r">
                        <Select
                          placeholder="Chọn sản phẩm"
                          isSearchable
                          options={products}
                          styles={customStyles}
                          className="w-full border px-2 py-1 rounded text-sm"
                          value={item.product}
                          onChange={(value) => handleChange(item.id, 'product', value)}
                        />
                      </td>
                      <td className="px-4 py-2 text-sm border-r">
                        <Select
                          placeholder="Chọn kho"
                          isSearchable
                          options={warehouses.map(w => ({
                            value: w.warehouseCode,
                            label: `${w.warehouseCode} - ${w.warehouseName}`
                          }))}
                          styles={customStyles}
                          className="w-full border px-2 py-1 rounded text-sm"
                          value={warehouses.find(w => w.warehouseCode === item.warehouse) ? {
                            value: item.warehouse,
                            label: `${item.warehouse} - ${warehouses.find(w => w.warehouseCode === item.warehouse)?.warehouseName}`
                          } : null}
                          onChange={(option) => handleChange(item.id, 'warehouse', option?.value || '')}
                        />
                      </td>
                      <td className="px-4 py-2 text-sm border-r">
                        <div>
                          <Input
                            type="text"
                            inputMode="numeric"
                            value={item.quantity}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '' || /^\d+$/.test(value)) {
                                handleChange(item.id, 'quantity', value);
                              }
                            }}
                            className={`!border-t-blue-gray-200 focus:!border-t-gray-900 ${item.quantity < 1 || item.quantity > 1000 ? "border-red-t-500" : ""}`}
                            labelProps={{
                              className: "before:content-none after:content-none",
                            }}
                          />
                          {((item.quantity === '' || item.quantity === undefined || item.quantity < 1 || item.quantity > 1000)) && (
                            <p className="text-red-500 text-xs mt-1">Số lượng không hợp lệ</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-sm border-r">
                        {item.product?.unitName || ''}
                      </td>
                      <td className="px-4 py-2 text-sm text-center">
                        <Button variant="text" color="red" size="5px" onClick={() => handleRemoveRow(item.id)}>
                          <XCircleIcon className="h-6 w-6 mr-1" />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-2 text-center text-gray-500">
                      Không có dòng nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Nút thêm dòng */}
          <div className="flex justify-between mt-4">
            <Button variant="outlined" color="blue" onClick={handleAddRow} className="flex items-center gap-2">
              <FaPlus /> Thêm dòng
            </Button>
          </div>

          {/* Phân trang */}
          {items.length > 0 && (
            <div className="flex items-center justify-between border-t border-blue-gray-50 p-4">
              <div className="flex items-center gap-2">
                <Typography variant="small" color="blue-gray" className="font-normal">
                  Trang {currentPage + 1} / {totalPages} • {items.length} dòng
                </Typography>
              </div>
              <ReactPaginate
                previousLabel="<"
                nextLabel=">"
                breakLabel="..."
                pageCount={totalPages}
                onPageChange={({ selected }) => setCurrentPage(selected)}
                containerClassName="flex items-center gap-1"
                pageClassName="h-8 min-w-[32px] flex items-center justify-center rounded-md text-xs text-gray-700 border border-gray-300 hover:bg-gray-100"
                activeClassName="bg-[#0ab067] text-white border-[#0ab067] hover:bg-[#0ab067]"
                previousClassName="h-8 min-w-[32px] flex items-center justify-center rounded-md text-xs text-gray-700 border border-gray-300 hover:bg-gray-100"
                nextClassName="h-8 min-w-[32px] flex items-center justify-center rounded-md text-xs text-gray-700 border border-gray-300 hover:bg-gray-100"
                disabledClassName="opacity-50 cursor-not-allowed"
                forcePage={currentPage}
              />
            </div>
          )}


          {/* Action buttons */}
          <div className="mt-6 border-t pt-4 flex justify-between">
            <div className="flex items-center">
              <Button
                size="sm"
                color="red"
                variant="text"
                onClick={() => navigate("/user/receiptNote")}
                className="mr-4 flex items-center"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Quay lại danh sách
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                color="blue"
                variant="outlined"
                onClick={() => {
                  if (window.confirm("Bạn có chắc muốn hủy thao tác này?")) {
                    navigate("/user/receiptNote");
                  }
                }}
              >
                Hủy
              </Button>
              <Button
                size="sm"
                color="green"
                onClick={handleSave}
                disabled={isSubmitting}
                className="flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang lưu...
                  </>
                ) : (
                  "Lưu phiếu nhập"
                )}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default AddReceiptNoteManually;
