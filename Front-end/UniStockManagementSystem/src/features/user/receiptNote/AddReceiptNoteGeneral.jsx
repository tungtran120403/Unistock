import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  CardBody,
  Typography,
  Button,
} from "@material-tailwind/react";
import {
  TextField,
  MenuItem,
  Autocomplete,
  IconButton,
  Button as MuiButton,
} from '@mui/material';
import { useNavigate, useLocation } from "react-router-dom";
import ReactPaginate from "react-paginate";
import { FaPlus, FaTrash, FaArrowLeft, FaSearch } from "react-icons/fa";
import {
  HighlightOffRounded,
  Search
} from '@mui/icons-material';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ListBulletIcon,
} from "@heroicons/react/24/outline";
import { InformationCircleIcon } from "@heroicons/react/24/solid";
import dayjs from "dayjs";
import "dayjs/locale/vi"; // Sử dụng ngôn ngữ Tiếng Việt cho DatePicker
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import PageHeader from '@/components/PageHeader';
import FileUploadBox from '@/components/FileUploadBox';
import TableSearch from '@/components/TableSearch';
import Table from "@/components/Table";
import ProductRow from "./ProductRow";
import ModalChooseOrder from "./ChooseOriginalDocumentModal";

import { fetchPendingOrInProgressOrders, getPurchaseOrderById } from "../purchaseOrder/purchaseOrderService";
import { getWarehouseList } from "../warehouse/warehouseService";
import { getProducts } from "../saleorders/saleOrdersService";
import { getAllActiveMaterials } from "../materials/materialService";
import {
  createReceiptNote,
  uploadPaperEvidence,
  getNextCode
} from "./receiptNoteService";
import { getPartnersByCodePrefix } from "../partner/partnerService";


const AddReceiptNoteGeneral = () => {
  // region: Khai báo state và biến
  const navigate = useNavigate();
  const location = useLocation();

  // ====== Các state quản lý form ======
  const [receiptCode, setReceiptCode] = useState("");
  const [category, setCategory] = useState("");                 // Phân loại nhập kho
  const [createdDate, setCreateDate] = useState("");           // Ngày lập phiếu
  const [description, setDescription] = useState("");          // Lý do xuất/ diễn giải
  const [referenceDocument, setReferenceDocument] = useState("");  // Chứng từ tham chiếu
  const isReferenceFlow = (category === "Vật tư mua bán" || category === "Hàng hóa gia công") && !!referenceDocument;

  // Thông tin đối tác
  const [partnerId, setPartnerId] = useState(null);
  const [partnerName, setPartnerName] = useState("");
  const [address, setAddress] = useState("");
  const [contactName, setContactName] = useState("");
  const [partnerPhone, setPartnerPhone] = useState("");

  // Danh sách kho, file, v.v.
  const [warehouses, setWarehouses] = useState([]);
  const [files, setFiles] = useState([]);  // Dùng để upload giấy tờ kèm

  // Danh sách tài liệu gốc (hoá đơn, phiếu xuất, v.v.) cho tham chiếu
  const [availableOrders, setAvailableOrders] = useState([]);       // Dùng cho "Vật tư mua bán"
  const [availableOutsourceDocs, setAvailableOutsourceDocs] = useState([]); // Dùng cho "Hàng hóa gia công"

  // Các danh sách đối tác
  const [customers, setCustomers] = useState([]); // danh sách KH
  const [outsources, setOutsources] = useState([]); // Đối tác Gia công
  const [suppliers, setSuppliers] = useState([]);   // Đối tác Nhà cung cấp

  // Ẩn / Hiện Modal
  const [isChooseDocModalOpen, setIsChooseDocModalOpen] = useState(false);

  // Dữ liệu các dòng sản phẩm
  const [documentItems, setDocumentItems] = useState([]); // Danh sách sản phẩm khi chọn chứng từ
  const [materialList, setMaterialList] = useState([]);
  const [productList, setProductList] = useState([]);
  const [combinedList, setCombinedList] = useState([]);  // Gộp cả products & materials
  const [manualItems, setManualItems] = useState([]);     // Danh sách sản phẩm thêm thủ công

  // Phân trang bảng
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // ----- Trạng thái gọi API, validate, v.v. -----
  const [isSaving, setIsSaving] = useState(false);
  const [quantityErrors, setQuantityErrors] = useState({
    product: {},
    warehouse: {},
    quantity: {}
  });

  // Lưu mã phiếu nhập code tạm (nếu có) từ location
  const initialNextCode = location.state?.nextCode;

  // Ẩn kho KPL khỏi dropdown nếu không phải "Hàng hóa trả lại"
  const isReturnCategory = category === "Hàng hóa trả lại";
  const filteredWarehouses = warehouses.filter(w =>
    isReturnCategory || w.warehouseCode !== "KPL"
  );

  // region: useEffect - gọi data, set default values
  useEffect(() => {
    // Ngày lập phiếu mặc định là ngày hiện tại
    if (!createdDate) {
      const today = dayjs().format("YYYY-MM-DD");
      setCreateDate(today);
    }
  }, []);

  // Gọi API lấy danh sách khách hàng 
  const fetchCustomers = async () => {
    try {
      const response = await getPartnersByCodePrefix("KH");
      console.log("Danh sách khách hàng:", response);
      setCustomers(response || []);
    } catch (err) {
      console.error("Lỗi khi lấy danh sách khách hàng:", err);
    }
  };

  // Gọi API lấy Product, Material
  useEffect(() => {
    const fetchLists = async () => {
      try {
        const [materials, products] = await Promise.all([
          getAllActiveMaterials(),
          getProducts(),
        ]);

        // Giả sử ta chuẩn hoá về dạng:
        const mappedMaterials = (materials || []).map(m => ({
          id: m.materialId,
          code: m.materialCode,
          name: m.materialName,
          unit: m.unitName || "",
          type: "material",
        }));

        // Giả sử getProducts() trả về { content: [...] }
        // Hoặc mảng
        const rawProducts = Array.isArray(products) ? products : products?.content || [];
        const mappedProducts = rawProducts.map(p => ({
          id: p.productId,
          code: p.productCode,
          name: p.productName,
          unit: p.unitName || "",
          type: "product",
        }));

        setMaterialList(mappedMaterials);
        setProductList(mappedProducts);
        setCombinedList([...mappedProducts, ...mappedMaterials]);
      } catch (err) {
        console.error("Lỗi lấy danh sách vật tư / sản phẩm:", err);
      }
    };
    fetchLists();
  }, []);

  useEffect(() => {
    // Lấy danh sách kho, sản phẩm, mã phiếu nhập
    const fetchInitData = async () => {
      try {
        // Lấy danh sách kho
        const resWarehouses = await getWarehouseList();
        setWarehouses(resWarehouses?.data || resWarehouses || []);

        // Lấy danh sách sản phẩm (nếu cần cho việc thêm thủ công)
        const resProducts = await getProducts();
        // Tuỳ biến nếu bạn muốn hiển thị hoặc map data
        // Ở đây ta chỉ demo sẵn sàng cho ProductRow

        // Lấy mã phiếu nhập từ backend
        const nextCode = await getNextCode();
        setReceiptCode(nextCode);
      } catch (err) {
        console.error("Lỗi khi lấy dữ liệu khởi tạo:", err);
      }
    };
    fetchInitData();
  }, []);

  useEffect(() => {
    // Khi thay đổi category (phân loại nhập kho), gọi API lấy danh sách chứng từ tương ứng
    if (category === "Vật tư mua bán") {
      // Lấy danh sách đơn mua (Pending hoặc InProgress)
      fetchPendingOrInProgressOrders().then((orders) => {
        // Map sang định dạng Autocomplete
        const formatted = orders.map((o) => ({
          label: o.poCode,
          value: o.poId,
          poCode: o.poCode,
          orderDate: dayjs(o.orderDate).format("DD/MM/YYYY"),
          supplierName: o.supplierName || "Không xác định",
          details: o.details || o.orderDetails || []
        }));
        setAvailableOrders(formatted);
      });
      // Lấy danh sách đối tác Gia công (nếu cần) hoặc logic khác
      fetchOutsources();
    }

    if (category === "Hàng hóa gia công") {
      // Lấy danh sách phiếu/đơn xuất gia công
      fetchOutsourceDocuments();
      // Lấy danh sách đối tác Gia công
      fetchOutsources();
    }

    if (category === "Hàng hóa trả lại") {
      // Lấy danh sách khách hàng
      fetchCustomers();
    }
  }, [category]);

  /**
   * Lấy danh sách phiếu gia công (Pending hoặc InProgress) 
   */
  const fetchOutsourceDocuments = async () => {
    try {
      // Ở đây demo tạm dùng chung API fetchPendingOrInProgressOrders
      const response = await fetchPendingOrInProgressOrders();
      const formatted = response.map((doc) => ({
        value: doc.id,
        poCode: doc.code,
        orderDate: dayjs(doc.createdDate).format("DD/MM/YYYY"),
        supplierName: doc.partnerName,
        details: doc.details || []
      }));
      setAvailableOutsourceDocs(formatted);
    } catch (err) {
      console.error("Không lấy được danh sách chứng từ gia công:", err);
    }
  };

  /**
   * Lấy danh sách đối tác Gia công
   * (Tuỳ theo API thực tế, ví dụ getPartnersByType(OUTSOURCE_TYPE_ID))
   */
  const fetchOutsources = async () => {
    try {
      // Demo gọi API
      // const response = await getPartnersByType(OUTSOURCE_TYPE_ID);
      // Map data
      // setOutsources(mappedOutsources);
    } catch (error) {
      console.error("Lỗi khi tải danh sách đối tác gia công:", error);
    }
  };


  const getDefaultWarehouse = (category) => {
    const matchedWarehouse = warehouses.find((w) => {
      if (!w.goodCategory) return false;
      const categories = w.goodCategory.split(",").map(c => c.trim());
      return categories.includes(category);
    });
    return matchedWarehouse ? matchedWarehouse.warehouseCode : "";
  };

  // ------------------ Khi chọn chứng từ từ modal => load chi tiết ------------------
  const handleChooseDoc = async (selectedOrder) => {
    setIsChooseDocModalOpen(false);
    if (!selectedOrder) return;
    console.log("Chọn chứng từ:", selectedOrder);
    const { poId } = selectedOrder;
    setReferenceDocument(poId);

    try {
      const po = await getPurchaseOrderById(poId);
      setPartnerId(po.supplierId || null);
      setPartnerName(po.supplierName || "");
      setAddress(po.supplierAddress || "");
      setContactName(po.supplierContactName || "");
      setPartnerPhone(po.supplierPhone || "");

      const defaultWarehouseCode = getDefaultWarehouse(category);//lấy kho mặc định theo category
      const newItems = (po.details || []).map((detail, idx) => {
        const remaining = detail.orderedQuantity - (detail.receivedQuantity || 0);

        return {
          id: idx + 1,
          ...detail, // 👈 giữ nguyên các field như materialCode, productCode, unitName,...
          warehouseCode: defaultWarehouseCode, // Gán kho mặc định
          quantity: remaining > 0 ? remaining : 0,
          remainingQuantity: remaining,
        };
      });

      setDocumentItems(newItems);
    } catch (err) {
      console.error("Không lấy được chi tiết PO:", err);
    }
  };


  // ------------------- Xử lý thay đổi cột quantity / warehouse / etc. -------------------
  const isQuantityValid = (value, maxRemain) => {
    const numValue = Number(value);
    return numValue > 0 && numValue <= maxRemain;
  };

  const handleRowChange = (rowId, field, value) => {
    if (isReferenceFlow) {
      setDocumentItems(prev => prev.map(row => {
        if (row.id === rowId) {
          let newRow = { ...row, [field]: value };

          // Nếu thay đổi quantity => validate
          if (field === "quantity") {
            // Số còn phải nhập
            const maxRemain = row.remainingQuantity || 0;
            const isValid = isQuantityValid(value, maxRemain);
            if (!isValid) {
              setQuantityErrors(prev => ({ ...prev, [rowId]: `Số lượng phải từ 1 đến ${maxRemain}!` }));
            } else {
              setQuantityErrors(prev => {
                const copy = { ...prev };
                delete copy[rowId];
                return copy;
              });
            }
          }
          return newRow;
        }
        return row;
      }));
    } else {
      // Manual items
      setManualItems(prev => prev.map(row => {
        if (row.id === rowId) {
          let newRow = { ...row, [field]: value };
          // Nếu thay đổi quantity => check > 0, v.v.
          if (field === "quantity") {
            // Ở AddReceiptNoteManually, ta cho 1 <= quantity <= 1000 (VD)
            const val = Number(value);
            if (!val || val < 1 || val > 100000) {
              setQuantityErrors(prev => ({ ...prev, [rowId]: "Số lượng không hợp lệ!" }));
            } else {
              setQuantityErrors(prev => {
                const copy = { ...prev };
                delete copy[rowId];
                return copy;
              });
            }
          }
          return newRow;
        }
        return row;
      }));
    }
  };

  // region: Thay đổi dữ liệu bảng thủ công (nếu không có chứng từ tham chiếu)
  const handleAddRow = () => {
    const defaultWarehouseCode = getDefaultWarehouse(category);
    const newItem = {
      id: manualItems.length + 1,
      selected: null,
      warehouse: defaultWarehouseCode,
      quantity: "",
    };
    setManualItems(prev => [...prev, newItem]);
    setQuantityErrors(prev => ({
      ...prev,
      product: {
        ...prev.product,
        [newItem.id]: "Chưa chọn sản phẩm/vật tư!"
      },
      warehouse: {
        ...prev.warehouse,
        ...(defaultWarehouseCode ? {} : { [newItem.id]: "Chưa chọn kho nhập!" })
      }
    }));
  };

  const handleRemoveRow = (id) => {
    setManualItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleRemoveAllRows = () => {
    setManualItems([]);
    setCurrentPage(0);
  };

  // region: Xử lí file upload
  /**
   * Khi user chọn file
   */
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length + files.length > 3) {
      alert("Bạn chỉ được tải lên tối đa 3 file!");
      return;
    }
    setFiles([...files, ...selectedFiles]);
  };

  /**
   * Xoá 1 file đã chọn
   * @param {Number} index - index file trong mảng
   */
  const handleRemoveFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  // region: Phân trang
  /**
   * Hàm xử lí đổi trang
   * @param {Object} param - {selected} do thư viện ReactPaginate
   */
  const handlePageChange = ({ selected }) => {
    setCurrentPage(selected);
  };

  /**
   * Lấy mảng items hiện tại (dựa theo category + referenceDocument)
   */
  const getCurrentItems = () => {
    if ((category === "Vật tư mua bán" || category === "Hàng hóa gia công") && referenceDocument) {
      return documentItems;
    }
    return manualItems;
  };

  //Hàm xử lí lưu phiếu nhập

  const handleSaveReceipt = async () => {

    // Nếu chưa chọn category => return
    if (!category) {
      alert("Vui lòng chọn Phân loại nhập kho!");
      return;
    }
    if (isSaving) {
      return;
    }
    // Kiểm tra xem bảng danh sách có ít nhất 1 sản phẩm không
    const currentItems = isReferenceFlow ? documentItems : manualItems;
    if (currentItems.length === 0) {
      alert("Vui lòng nhập ít nhất một hàng hóa với số lượng nhập hợp lệ!");
      return;
    }

    let localErrors = {
      product: {},
      warehouse: {},
      quantity: {},
      duplicate: {}
    };

    let hasError = false;

    if (isReferenceFlow) {
      documentItems.forEach(row => {
        if (!row.warehouseCode) {
          hasError = true;
          localErrors.warehouse[row.id] = "Chưa chọn kho nhập!";
        }
        if (row.quantity === undefined || row.quantity === null || row.quantity === "" || row.quantity < 0) {
          hasError = true;
          localErrors.quantity[row.id] = "Số lượng không hợp lệ!";
        }
      });
    } else {
      manualItems.forEach(row => {
        if (!row.selected) {
          hasError = true;
          localErrors.product[row.id] = "Chưa chọn sản phẩm/vật tư!";
        }
        if (!row.warehouse) {
          hasError = true;
          localErrors.warehouse[row.id] = "Chưa chọn kho nhập!";
        }
        if (!row.quantity || row.quantity === undefined || row.quantity === null || row.quantity === "" || row.quantity <= 0) {
          hasError = true;
          localErrors.quantity[row.id] = "Số lượng không hợp lệ!";
        }
      });
    }

    if (hasError) {
      setQuantityErrors(localErrors);
      return;
    }

    setIsSaving(true);
    try {
      // Tạo payload theo cấu trúc ReceiptNoteDTO
      const payload = {
        grnCode: receiptCode,
        description: description || "",
        category: category,
        receiptDate: dayjs(createdDate).startOf('day').toDate(),
        poId: isReferenceFlow ? Number(referenceDocument) : null,
        partnerId: partnerId || null,
        details: []
      };

      console.log("Tạo payload", payload);

      // Map dữ liệu chi tiết (details)
      if (isReferenceFlow) {
        payload.details = documentItems
          .filter(row => row.remainingQuantity > 0 && Number(row.quantity) > 0)
          .map(row => {
            const warehouse = warehouses.find(w => w.warehouseCode === row.warehouseCode);
            if (!warehouse) {
              throw new Error(`Không tìm thấy kho với code: ${row.warehouseCode}`);
            }
            return {
              warehouseId: warehouse.warehouseId,
              materialId: row.materialId ? Number(row.materialId) : null,
              productId: row.productId ? Number(row.productId) : null,
              quantity: Number(row.quantity),
              unitId: row.unitId ? Number(row.unitId) : null
            };
          });
      } else {
        payload.details = manualItems.map(row => {
          const warehouse = warehouses.find(w => w.warehouseCode === row.warehouse);
          if (!warehouse) {
            throw new Error(`Không tìm thấy kho với code: ${row.warehouse}`);
          }
          const isMaterial = row.selected?.type === "material";
          return {
            warehouseId: warehouse.warehouseId,
            materialId: isMaterial ? Number(row.selected.id) : null,
            productId: isMaterial ? null : Number(row.selected.id),
            quantity: Number(row.quantity),
            unitId: row.selected?.unitId ? Number(row.selected.unitId) : null
          };
        });
      }

      console.log("Payload hoàn chỉnh", payload);

      // Gọi API tạo phiếu nhập
      const response = await createReceiptNote(payload);
      console.log("Response từ createReceiptNote", response);

      // Upload file đính kèm nếu có
      if (files.length > 0) {
        console.log("Bắt đầu upload file", { files });
        await uploadPaperEvidence(response.grnId, "GOOD_RECEIPT_NOTE", files);
        console.log("Upload file thành công");
      }

      console.log("Lưu thành công");
      navigate("/user/receiptNote", { state: { successMessage: "Tạo phiếu nhập kho thành công!" } });
    } catch (err) {
      console.error("❌ Lỗi khi lưu phiếu nhập:", err);
      let msg = err?.response?.data?.message || err.message || "Lỗi không xác định!";
      alert("Không thể lưu phiếu nhập: " + msg);
    } finally {
      console.log("Kết thúc handleSaveReceipt, reset isSaving");
      setIsSaving(false);
    }
  };
  /**
   * Cấu hình cột bảng (khi hiển thị danh sách manualItems)
   */
  const columnsConfig = [
    {
      field: 'stt',
      headerName: 'STT',
      width: 50,
      editable: false,
      filterable: false,
      renderCell: (params) => params.value ?? "",
    },
    {
      field: 'itemCode',
      headerName: 'Mã hàng',
      minWidth: 300,
      editable: false,
      filterable: false,
      renderCell: (params) => {
        const dropdownList = getDropdownListByCategory();
        const rowError = quantityErrors.product?.[params.id] || (!params.row.selected ? "Chưa chọn sản phẩm/vật tư!" : "");
        return (
          <Autocomplete
            sx={{ width: '100%', paddingY: '0.5rem' }}
            size="small"
            options={dropdownList}
            getOptionLabel={(option) => option?.code + " - " + option?.name}
            value={params.row.selected || null}
            onChange={(e, newValue) => handleChangeSelectedItem(params.row.id, newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                color="success"
                variant="outlined"
                placeholder="Chọn mã hàng"
                size="small"
                error={!!rowError}
                helperText={rowError}
              />
            )}
          />
        );
      }
    },
    {
      field: 'itemName',
      headerName: 'Tên hàng',
      minWidth: 300,
      editable: false,
      filterable: false,
      renderCell: (params) => (
        <span>{params.row.selected?.name || ""}</span>
      )
    },
    {
      field: 'unit',
      headerName: 'Đơn vị',
      editable: false,
      filterable: false,
      minWidth: 100,
      renderCell: (params) => {
        // Hiển thị unit dựa trên params.row.selected
        return (
          <span>{params.row.selected?.unit || ""}</span>
        );
      }
    },
    {
      field: 'warehouse',
      headerName: 'Kho nhập',
      editable: false,
      filterable: false,
      minWidth: 250,
      renderCell: (params) => {
        const rowError = quantityErrors.warehouse?.[params.id];
        return (
          <Autocomplete
            sx={{ width: '100%' }}
            size="small"
            options={filteredWarehouses}
            getOptionLabel={(option) => option?.warehouseCode + " - " + option?.warehouseName}
            value={warehouses.find(wh => wh.warehouseCode === params.row.warehouse) || null}
            onChange={(e, newValue) => {
              const newWarehouseCode = newValue?.warehouseCode || "";
              setManualItems(prev =>
                prev.map(item =>
                  item.id === params.row.id
                    ? { ...item, warehouse: newWarehouseCode }
                    : item
                )
              );
              // Validate kho nhập
              if (!newWarehouseCode) {
                setQuantityErrors(prev => ({
                  ...prev,
                  warehouse: {
                    ...prev.warehouse,
                    [params.row.id]: "Chưa chọn kho nhập!"
                  }
                }));
              } else {
                setQuantityErrors(prev => {
                  const newErrors = { ...prev, warehouse: { ...prev.warehouse } };
                  delete newErrors.warehouse[params.row.id];
                  return newErrors;
                });
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                color="success"
                variant="outlined"
                placeholder="Chọn kho"
                size="small"
                error={!!rowError}
                helperText={rowError}
              />
            )}
          />
        );
      }
    },
    {
      field: 'quantity',
      headerName: 'Số lượng',
      editable: false,
      filterable: false,
      minWidth: 200,
      renderCell: (params) => {
        const rowError = quantityErrors.quantity?.[params.row.id];
        return (
          <div style={{ width: "100%" }}>
            <TextField
              type="number"
              size="small"
              color="success"
              error={!!rowError}
              helperText={rowError}
              value={params.row.quantity}
              placeholder="0"
              onChange={(e) => handleChangeQuantity(params.id, e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        );
      }
    },
    {
      field: 'actions',
      headerName: 'Hành động',
      editable: false,
      filterable: false,
      minWidth: 100,
      renderCell: (params) => (
        <IconButton
          size="small"
          color="error"
          onClick={() => handleRemoveRow(params.row.id)}
        >
          <HighlightOffRounded />
        </IconButton>
      )
    }
  ];


  // region: Render giao diện
  // Tính toán phân trang
  const currentItems = getCurrentItems();
  const totalElements = currentItems.length;
  const totalPages = Math.ceil(totalElements / pageSize);
  const displayedItems = currentItems.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );
  // Gắn index cho mỗi row (để hiển thị STT)
  const displayedItemsWithIndex = displayedItems.map((item, idx) => ({
    ...item,
    index: currentPage * pageSize + idx,
    stt: currentPage * pageSize + idx + 1,
  }));

  // Tuỳ thuộc category để lấy ds chứng từ
  const currentDocuments =
    category === "Hàng hóa gia công" ? availableOutsourceDocs : availableOrders;

  // endregion

  // Trong component AddReceiptNoteGeneral
  const getDropdownListByCategory = () => {
    if (category === "Thành phẩm sản xuất" || category === "Hàng hóa trả lại") {
      return productList || [];
    } else if (category === "Vật tư thừa sau sản xuất") {
      return materialList || [];
    } else if (category === "Khác") {
      return combinedList || [];
    }
    // Trường hợp còn lại (category không rõ ràng) - trả về một danh sách an toàn
    return combinedList || productList || materialList || [];
  };

  //xử lí thay đổi item trong danh sách manualItems
  const handleChangeSelectedItem = (rowId, newValue) => {
    setManualItems(prev =>
      prev.map(item =>
        item.id === rowId
          ? { ...item, selected: newValue }
          : item
      )
    );
    
    // Validate mã hàng
    if (!newValue) {
      setQuantityErrors(prev => ({
        ...prev,
        product: { ...prev.product, [rowId]: "Chưa chọn sản phẩm/vật tư!" }
      }));
    } else {
      setQuantityErrors(prev => {
        const newErrors = { ...prev, product: { ...prev.product } };
        delete newErrors.product[rowId];
        return newErrors;
      });
    }
  };

  const handleChangeQuantity = (rowId, newQty) => {
    const qty = Number(newQty);
    setManualItems(prev =>
      prev.map(item =>
        item.id === rowId
          ? { ...item, quantity: qty }
          : item
      )
    );
    // Validate số lượng
    if (!qty || qty <= 0 || qty > 100000) {
      setQuantityErrors(prev => ({
        ...prev,
        quantity: { ...prev.quantity, [rowId]: "Số lượng không hợp lệ!" }
      }));
    } else {
      setQuantityErrors(prev => {
        const newErrors = { ...prev, quantity: { ...prev.quantity } };
        delete newErrors.quantity[rowId];
        return newErrors;
      });
    }
  };

  return (
    <div className="mb-8 flex flex-col gap-12">
      <Card className="bg-gray-50 p-7 rounded-none shadow-none">
        <CardBody className="pb-2 bg-white rounded-xl">
          {/* Tiêu đề phiếu */}
          <PageHeader
            title={`Phiếu nhập kho ${receiptCode}`}
            showAdd={false}
            showImport={false}
            showExport={false}
          />

          {/* Thông tin chung */}
          <Typography variant="h6" className="flex items-center mb-4 text-black">
            <InformationCircleIcon className="h-5 w-5 mr-2" />
            Thông tin chung
          </Typography>

          {/* Phân loại nhập kho, Chứng từ tham chiếu (nếu có) */}
          <div className={`grid gap-4 mb-4 ${(category === "Vật tư mua bán" || category === "Hàng hóa gia công") ? "grid-cols-3" : "grid-cols-2"}`}>
            {/* Chọn phân loại nhập kho */}
            <div>
              <Typography variant="medium" className="mb-1 text-black">
                Phân loại nhập kho
                <span className="text-red-500"> *</span>
              </Typography>
              <TextField
                select
                hiddenLabel
                color="success"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  // Nếu đổi category => xóa referenceDocument cũ (nếu có)
                  setReferenceDocument(null);
                  setDocumentItems([]);
                  setManualItems([]);
                }}
                fullWidth
                size="small"
              >
                <MenuItem value="Thành phẩm sản xuất">Thành phẩm sản xuất</MenuItem>
                <MenuItem value="Vật tư mua bán">Vật tư mua bán</MenuItem>
                <MenuItem value="Hàng hóa gia công">Hàng hóa gia công</MenuItem>
                <MenuItem value="Hàng hóa trả lại">Hàng hóa trả lại</MenuItem>
                <MenuItem value="Vật tư thừa sau sản xuất">Vật tư thừa sau sản xuất</MenuItem>
                <MenuItem value="Khác">Khác</MenuItem>
              </TextField>
            </div>

            {/* Tham chiếu chứng từ (nếu là Vật tư mua bán / Hàng hóa gia công) */}
            {(category === "Vật tư mua bán" || category === "Hàng hóa gia công") && (
              <div>
                <Typography className="mb-1 text-black">
                  Tham chiếu chứng từ gốc
                  <span className="text-red-500"> *</span>
                </Typography>
                <Autocomplete
                  options={[{ isHeader: true, poCode: 'Mã chứng từ', orderDate: 'Ngày tạo chứng từ' }, ...currentDocuments]}
                  value={currentDocuments.find((doc) => doc.value === referenceDocument) || null}
                  getOptionLabel={(option) => option.poCode || ""}
                  getOptionDisabled={(option) => option.isHeader === true}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <div className={`flex justify-between w-full ${option.isHeader ? 'font-semibold text-gray-900 text-center' : ''}`}>
                        <span>{option.poCode}</span>
                        <span>{option.orderDate}</span>
                      </div>
                    </li>
                  )}
                  onChange={(event, newValue) => {
                    if (newValue) {
                      handleChooseDoc({
                        poId: newValue.value, // poId 
                        ...newValue
                      });
                    } else {
                      setReferenceDocument(null);
                      setPartnerName("");
                      setAddress("");
                      setContactName("");
                      setPartnerPhone("");
                      setDocumentItems([]);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Chọn chứng từ..."
                      hiddenLabel
                      color="success"
                      size="small"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            <IconButton onClick={() => setIsChooseDocModalOpen(true)}
                              size="small">
                              <Search fontSize="20px" />
                            </IconButton>
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  isOptionEqualToValue={(option, value) => option.value === value.value}
                />
              </div>
            )}

            {/* Ngày lập phiếu */}
            <div>
              <Typography variant="medium" className="mb-1 text-black">
                Ngày lập phiếu
              </Typography>
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
                <style>
                  {`.MuiPickersCalendarHeader-label { text-transform: capitalize !important; }`}
                </style>
                <DatePicker
                  value={createdDate ? dayjs(createdDate) : null}
                  onChange={(newValue) => {
                    if (newValue) {
                      setCreateDate(newValue.format("YYYY-MM-DD"));
                    }
                  }}
                  format="DD/MM/YYYY"
                  slotProps={{
                    day: {
                      sx: () => ({
                        "&.Mui-selected": {
                          backgroundColor: "#0ab067 !important",
                          color: "white",
                        },
                        "&.Mui-selected:hover": {
                          backgroundColor: "#089456 !important",
                        },
                        "&:hover": {
                          backgroundColor: "#0894561A !important",
                        },
                      }),
                    },
                    textField: {
                      hiddenLabel: true,
                      fullWidth: true,
                      size: "small",
                      color: "success",
                    },
                  }}
                />
              </LocalizationProvider>
            </div>
          </div>

          {/* Nếu là Vật tư mua bán / Gia công => hiển thị thông tin đối tác */}
          {(category === "Vật tư mua bán" || category === "Hàng hóa gia công") && (
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="col-span-2">
                <Typography variant="medium" className="mb-1 text-black">
                  Tên đối tác
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  color="success"
                  variant="outlined"
                  disabled
                  value={partnerName}
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
              <div>
                <Typography variant="medium" className="mb-1 text-black">
                  Người liên hệ
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  color="success"
                  variant="outlined"
                  disabled
                  value={contactName}
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

              <div className="col-span-2">
                <Typography variant="medium" className="mb-1 text-black">
                  Địa chỉ
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  color="success"
                  variant="outlined"
                  disabled
                  value={address}
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
              <div>
                <Typography variant="medium" className="mb-1 text-black">
                  Số điện thoại
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  color="success"
                  variant="outlined"
                  disabled
                  value={partnerPhone}
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
          )}

          {/* Nếu là Hàng hoá trả lại => hiển thị autocomplete khách hàng */}
          {category === "Hàng hóa trả lại" && (
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="col-span-2">
                <Typography variant="medium" className="mb-1 text-black">
                  Đối tác<span className="text-red-500"> *</span>
                </Typography>
                <Autocomplete
                  options={customers}
                  size="small"
                  getOptionLabel={(option) =>
                    `${option.partnerTypes?.find(pt => pt.partnerCode?.startsWith("KH"))?.partnerCode || ""} - ${option.partnerName || ""}`
                  }
                  isOptionEqualToValue={(option, value) => option.partnerId === value.partnerId} // ✅ thêm dòng này!
                  onChange={(event, selectedOption) => {
                    if (selectedOption) {
                      setPartnerId(selectedOption.partnerId || null);
                      setPartnerName(selectedOption.partnerName || "");
                      setAddress(selectedOption.address || "");
                      setContactName(selectedOption.contactName || "");
                      setPartnerPhone(selectedOption.phone || "");
                    } else {
                      setPartnerId(null);
                      setPartnerName("");
                      setAddress("");
                      setContactName("");
                      setPartnerPhone("");
                    }
                  }}

                  renderOption={(props, option) => (
                    <li {...props}>
                      {option.partnerTypes?.find(pt => pt.partnerCode?.startsWith("KH"))?.partnerCode || ""} - {option.partnerName}
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      color="success"
                      hiddenLabel
                      placeholder="Chọn đối tác"
                      size="small"
                    />
                  )}
                />
              </div>

              <div>
                <Typography variant="medium" className="mb-1 text-black">
                  Người liên hệ
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  color="success"
                  variant="outlined"
                  disabled
                  value={contactName}
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

              <div className="col-span-2">
                <Typography variant="medium" className="mb-1 text-black">
                  Địa chỉ
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  color="success"
                  variant="outlined"
                  disabled
                  value={address}
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
              <div>
                <Typography variant="medium" className="mb-1 text-black">
                  Số điện thoại
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  color="success"
                  variant="outlined"
                  disabled
                  value={partnerPhone}
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
          )}

          {/* Lý do nhập & Kèm theo */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Typography variant="medium" className="mb-1 text-black">
                Diễn giải nhập kho
              </Typography>
              <TextField
                fullWidth
                size="small"
                hiddenLabel
                multiline
                rows={4}
                color="success"
                placeholder="Diễn giải"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div>
              <Typography variant="medium" className="mb-1 text-black">
                Kèm theo
              </Typography>
              {/* Upload tài liệu: sử dụng component FileUploadBox */}
              <FileUploadBox
                files={files}
                setFiles={setFiles}
                maxFiles={3}
              />
            </div>
          </div>

          {/* Danh sách sản phẩm */}
          <Typography variant="h6" className="flex items-center mb-4 text-black">
            <ListBulletIcon className="h-5 w-5 mr-2" />
            Danh sách sản phẩm
          </Typography>

          {/* Bộ phận chọn pageSize & search */}
          <div className="py-2 flex items-center justify-between gap-2">
            {/* Items per page */}
            <div className="flex items-center gap-2">
              <Typography variant="small" color="blue-gray" className="font-light">
                Hiển thị
              </Typography>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(0);
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

            {/* Search input (nếu có nhu cầu) */}
            <TableSearch
              placeholder="Tìm kiếm"
              onSearch={(val) => {
                // Thêm logic tìm kiếm nếu cần
              }}
            />
          </div>

          {/* Hiển thị bảng */}
          {/* Nếu category= Vật tư mua bán / Gia công và đã chọn chứng từ => hiển thị bảng ProductRow */}
          {(category === "Vật tư mua bán" || category === "Hàng hóa gia công") && referenceDocument ? (
            <div className="overflow-auto border rounded">
              <table className="w-full table-auto text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 border">STT</th>
                    <th className="p-2 border">Mã hàng</th>
                    <th className="p-2 border">Tên hàng</th>
                    <th className="p-2 border">Đơn vị</th>
                    <th className="p-2 border">Kho nhập</th>
                    <th className="p-2 border">Số lượng đặt</th>
                    <th className="p-2 border">Đã nhận</th>
                    <th className="p-2 border">Còn lại</th>
                    <th className="p-2 border">Số lượng nhập kho</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedItemsWithIndex.map((item, index) => (
                    <ProductRow
                      key={item.id}
                      rowId={item.id}
                      item={item}
                      index={index}
                      warehouses={warehouses}
                      defaultWarehouseCode={getDefaultWarehouse(category)}
                      currentPage={currentPage}
                      pageSize={pageSize}
                      onDataChange={(itemKey, data) => {
                        setDocumentItems(prevItems => prevItems.map(row => {
                          // Kiểm tra đúng theo productId/materialId để cập nhật
                          if ((row.materialId && row.materialId === itemKey) || (row.productId && row.productId === itemKey)) {
                            return {
                              ...row,
                              quantity: data.quantity,
                              warehouseCode: data.warehouse,
                            };
                          }
                          return row;
                        }));

                        // Thực hiện validate quantity ở đây
                        const targetRow = documentItems.find(row => (row.materialId && row.materialId === itemKey) || (row.productId && row.productId === itemKey));
                        const maxRemain = targetRow?.remainingQuantity || 0;
                        const isValid = Number(data.quantity) > 0 && Number(data.quantity) <= maxRemain;

                        if (!isValid) {
                          setQuantityErrors(prev => ({
                            ...prev,
                            [targetRow.id]: `Số lượng phải từ 1 đến ${maxRemain}!`,
                          }));
                        } else {
                          setQuantityErrors(prev => {
                            const copy = { ...prev };
                            delete copy[targetRow.id];
                            return copy;
                          });
                        }
                      }}
                      errorMessage={quantityErrors[item.id]}
                    />
                  ))}
                </tbody>
              </table>

            </div>
          ) : (
            // Nếu không có chứng từ, hiển thị bảng manualItems
            <Table
              data={displayedItemsWithIndex}
              columnsConfig={columnsConfig}
              enableSelection={false}
            />
          )}

          {/* Phân trang */}
          {totalElements > 0 && (
            <div className="flex items-center justify-between pt-4">
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
                onPageChange={handlePageChange}
                containerClassName="flex items-center gap-1"
                pageClassName="h-8 min-w-[32px] flex items-center justify-center rounded-md text-xs text-gray-700 border border-gray-300 hover:bg-gray-100"
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

          {/* Nếu không dùng chứng từ => hiển thị nút thêm, xóa dòng */}
          {!(category === "Vật tư mua bán" || category === "Hàng hóa gia công") && (
            <div className="flex gap-2 mt-2 mb-4 h-8">
              <MuiButton
                size="small"
                variant="outlined"
                onClick={handleAddRow}
              >
                <div className="flex items-center gap-2">
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
                <div className="flex items-center gap-2">
                  <FaTrash className="h-4 w-4" />
                  <span>Xoá hết dòng</span>
                </div>
              </MuiButton>
            </div>
          )}

          {/* Footer button */}
          <div className="mt-6 border-t pt-4 flex justify-between">
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
              onClick={() => navigate("/user/issueNote")}
              className="flex items-center gap-2"
            >
              <FaArrowLeft className="h-3 w-3" /> Quay lại
            </MuiButton>

            <div className="flex items-center justify-end gap-2 pb-2">
              <MuiButton
                size="medium"
                color="error"
                variant="outlined"
                onClick={() => navigate("/user/receiptNote")} // Hoặc xử lý reset tuỳ ý
              >
                Hủy
              </MuiButton>
              <Button
                size="lg"
                color="white"
                variant="text"
                className="bg-[#0ab067] hover:bg-[#089456]/90 shadow-none text-white font-medium py-2 px-4 rounded-[4px]"
                ripple={true}
                onClick={handleSaveReceipt}
              >
                Lưu
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Modal chọn chứng từ */}
      {isChooseDocModalOpen && (
        <ModalChooseOrder
          onClose={() => setIsChooseDocModalOpen(false)}
          onOrderSelected={handleChooseDoc}
        />
      )}
    </div>
  );
};

export default AddReceiptNoteGeneral;
