import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Typography,
  Button
} from "@material-tailwind/react";
import {
  TextField,
  MenuItem,
  Autocomplete,
  IconButton,
  Button as MuiButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  HighlightOffRounded,
  ClearRounded
} from '@mui/icons-material';
import { useNavigate } from "react-router-dom";
import ReactPaginate from "react-paginate";
import { FaPlus, FaTrash, FaArrowLeft, FaSearch } from "react-icons/fa";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ListBulletIcon
} from "@heroicons/react/24/outline";
import { InformationCircleIcon } from "@heroicons/react/24/solid";

import PageHeader from "@/components/PageHeader";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/vi"; // Import Tiếng Việt

import FileUploadBox from "@/components/FileUploadBox";
import ModalAddPartner from "./ModalAddPartner";
import ModalChooseOrder from "./ModalChooseOrder";
import TableSearch from "@/components/TableSearch";
import CircularProgress from '@mui/material/CircularProgress';
import { getPartnersByType } from "@/features/user/partner/partnerService";
import { getSaleOrders, uploadPaperEvidence } from "./issueNoteService";
import { getTotalQuantityOfMaterial } from "./issueNoteService";
import { getTotalQuantityOfProduct } from "./issueNoteService";
import { getProducts } from "../saleorders/saleOrdersService"; // Giả định có service này để lấy danh sách sản phẩm
import { getWarehouseList } from "../warehouse/warehouseService";
import { getAllActiveMaterials } from '../materials/materialService';

import useIssueNote from "./useIssueNote";
import { useNotifications } from "../notification/useNotifications";


const OUTSOURCE_TYPE_ID = 3;
const SUPPLIER_TYPE_ID = 2;

// 🔄 BEGIN PATCH: buildMaterialRows
/** Gom vật tư từ danh sách orderDetails.
 *  Trả về mảng [{ materialId, materialCode?, materialName?, unitName, orderQty, exportedQty, pendingQty, inStock:[...] }]
 */
const buildMaterialRows = async (materials, orderId) => {
  console.log("[buildMaterialRows] Input materials:", JSON.stringify(materials, null, 2));

  const rowsMap = new Map();

  if (!Array.isArray(materials) || materials.length === 0) {
    console.warn("[buildMaterialRows] Materials is empty or not an array");
    return [];
  }

  for (const m of materials) {
    // Kiểm tra xem material có materialId hợp lệ không
    if (!m.materialId) {
      console.warn("[buildMaterialRows] Skipping material with missing materialId:", JSON.stringify(m, null, 2));
      continue;
    }

    const key = m.materialId;
    const exists = rowsMap.get(key) || {
      id: `m-${key}`,
      materialId: key,
      materialCode: m.materialCode || "",
      materialName: m.materialName || "",
      unitName: m.unitName || "",
      unitId: m.unitId || null,
      orderQuantity: 0,
      exportedQuantity: 0,
      pendingQuantity: 0,
      inStock: []
    };

    exists.orderQuantity += m.requiredQuantity || 0;
    exists.exportedQuantity += m.receivedQuantity || 0;
    exists.pendingQuantity = exists.orderQuantity - exists.exportedQuantity;
    console.log(`[buildMaterialRows] Material: ${m.materialCode} (${m.materialId}) | Required: ${m.requiredQuantity} | Received: ${m.receivedQuantity} | Pending: ${exists.pendingQuantity}`);
    rowsMap.set(key, exists);
  }

  // Kiểm tra nếu không có vật tư hợp lệ
  if (rowsMap.size === 0) {
    console.warn("[buildMaterialRows] No valid materials found");
    return [];
  }

  // 👉 nạp tồn kho từng vật tư
  const promises = Array.from(rowsMap.values()).map(async (row) => {
    try {
      const stock = await getTotalQuantityOfMaterial(row.materialId, orderId);
      row.inStock = stock && stock.length > 0
        ? stock.map(s => ({
          warehouseId: s.warehouseId,
          warehouseName: s.warehouseName || "",
          quantity: s.quantity || 0,
          exportQuantity: 0,
          error: ""
        }))
        : [{
          warehouseId: null,
          warehouseName: " ",
          quantity: 0,
          exportQuantity: 0,
          error: ""
        }];
    } catch (e) {
      console.error("Lỗi lấy tồn kho vật tư:", e);
    }
    return row;
  });

  const result = await Promise.all(promises);
  console.log("[buildMaterialRows] Output rows:", JSON.stringify(result, null, 2));
  return result;
};
// 🔄 END PATCH

const AddIssueNote = () => {
  const { fetchNotifications } = useNotifications();
  const navigate = useNavigate();
  const { fetchNextCode, addIssueNote, materials } = useIssueNote();

  // ------------------ STATE: Thông tin chung ------------------
  const [issueNoteCode, setIssueNoteCode] = useState("");
  const [category, setCategory] = useState("");
  const [createdDate, setCreateDate] = useState("");
  const [description, setDescription] = useState("");
  const [referenceDocument, setReferenceDocument] = useState("");
  const [files, setFiles] = useState([]);
  const [contactName, setContactName] = useState("");
  const [address, setAddress] = useState("");
  const [partnerCode, setPartnerCode] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [partnerId, setPartnerId] = useState(null);
  const [soId, setSoId] = useState(null);
  const [isSaving, setIsSaving] = useState(false); // Thêm state cho loading
  const [loading, setLoading] = useState(true);

  //State hiển thị lỗi
  const [issueCategoryError, setIssueCategoryError] = useState("");
  const [issueDateError, setIssueDateError] = useState("");
  const [partnerError, setPartnerError] = useState("");
  const [itemError, setItemsError] = useState("");
  const [referenceDocumentError, setReferenceDocumentError] = useState("");

  // ------------------ STATE: Modal Đơn hàng ------------------
  const [orders, setOrders] = useState([]);
  const [isChooseOrderModalOpen, setIsChooseOrderModalOpen] = useState(false);

  // ------------------ STATE: Đối tác (gia công, NCC) ------------------
  const [outsources, setOutsources] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [isCreatePartnerPopupOpen, setIsCreatePartnerPopupOpen] = useState(false);

  // ------------------ STATE: Danh sách sản phẩm / Nguyên vật liệu ------------------
  const [products, setProducts] = useState([]);
  const [productList, setProductList] = useState([]); // Danh sách sản phẩm

  // ------------------ STATE: Danh sách sản phẩm và Nguyên vật liệu ------------------
  const [itemList, setItemList] = useState([]);

  // ------------------ STATE: Danh sách NVL dự kiến nhận lại (cho Gia công) ------------------
  const [expectedReturns, setExpectedReturns] = useState([]);
  const [warehouses, setWarehouses] = useState([]); // Thêm state cho danh sách kho

  // ------------------ Lấy mã phiếu + đặt ngày mặc định ------------------
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const code = await fetchNextCode();
        setIssueNoteCode(code || "");
      } catch (err) {
        console.error("Lỗi khi fetchNextCode:", err);
      } finally {
        setLoading(false);
      }
    })();
    if (!createdDate) {
      setCreateDate(dayjs().format("YYYY-MM-DD"));
    }
  }, []);

  // ------------------ Lấy danh sách kho ------------------
  const fetchWarehouses = async () => {
    try {
      const response = await getWarehouseList(); // Giả định API trả về danh sách kho
      if (response && response.content) {
        const mapped = response.content.map((wh) => ({
          id: wh.warehouseId,
          name: wh.warehouseName,
        }));
        setWarehouses(mapped);
      } else {
        setWarehouses([]);
      }
    } catch (error) {
      console.error("Lỗi fetchWarehouses:", error);
      setWarehouses([]);
    }
  };

  // ------------------ Lấy DS đơn hàng, nếu category = "Bán hàng" hoặc "Sản xuất" ------------------
  const fetchOrders = async () => {
    try {
      const response = await getSaleOrders();
      if (response && response.content) {
        const mapped = response.content
          .filter(order => ["PREPARING_MATERIAL", "PARTIALLY_ISSUED"].includes(order.status))
          .map((order) => ({
            id: order.orderId,
            orderCode: order.orderCode,
            orderName: order.partnerName,
            partnerCode: order.partnerCode,
            partnerName: order.partnerName,
            orderDate: order.orderDate,
            address: order.address,
            contactName: order.contactName,
            orderDetails: order.orderDetails,
            materials: order.materials,
          }));
        setOrders(mapped);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("Lỗi fetchOrders:", error);
      setOrders([]);
    }
  };

  // Hàm lọc danh sách vật tư/sản phẩm cho gia cong
  const getAvailableMaterialsForExport = () => {
    const selectedMaterialIds = products
      .filter(p => p.materialId)
      .map(p => p.materialId);
    return materials.filter(mat => !selectedMaterialIds.includes(mat.materialId));
  };

  const getAvailableMaterialsForExpectedReturns = () => {
    const selectedReturnIds = expectedReturns
      .filter(p => p.materialId)
      .map(p => p.materialId);
    return materials.filter(mat => !selectedReturnIds.includes(mat.materialId));
  };


  // Hàm lọc danh sách vật tư/sản phẩm cho khac
  const getAvailableItemsForKhac = () => {
    const selectedItemIds = products
      .filter(p => p.itemId)
      .map(p => p.itemId);
    return itemList.filter(item => !selectedItemIds.includes(item.id));
  };

  // ------------------ Lấy DS sản phẩm và vật tư------------------
  const fetchItems = async () => {
    try {
      // Lấy danh sách vật tư từ API
      const materialsData = await getAllActiveMaterials();
      const materialsList = materialsData.map((mat) => ({
        id: `mat-${mat.materialId}`,
        code: mat.materialCode,
        name: mat.materialName,
        unitName: mat.unitName,
        unitId: mat.unitId,
        type: 'material',
      }));

      // Lấy danh sách sản phẩm
      const productsList = await getProducts();
      const mappedProducts = productsList?.content?.map((prod) => ({
        id: `prod-${prod.productId}`,
        code: prod.productCode,
        name: prod.productName,
        unitName: prod.unitName,
        unitId: prod.unitId,
        type: 'product',
      })) || [];

      setItemList([...materialsList, ...mappedProducts]);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách vật tư/sản phẩm:", error);
      setItemList([]);
    }
  };

  // ------------------ Lấy DS sản phẩm ------------------
  const fetchProducts = async () => {
    try {
      const response = await getProducts();
      if (response && response.content) {
        const mapped = response.content.map((prod) => ({
          id: prod.productId,
          code: prod.productCode,
          name: prod.productName,
          unitName: prod.unitName,
          unitId: prod.unitId,
          type: 'product'
        }));
        setProductList(mapped);
      } else {
        setProductList([]);
      }
    } catch (error) {
      console.error("Lỗi fetchProducts:", error);
      setProductList([]);
    }
  };

  // ------------------ Lấy DS gia công, NCC ------------------
  const fetchOutsources = async () => {
    try {
      const res = await getPartnersByType(OUTSOURCE_TYPE_ID);
      if (!res || !res.partners) {
        console.error("API không trả về dữ liệu hợp lệ!");
        setOutsources([]);
        return;
      }
      const mapped = res.partners
        .map((o) => {
          const t = o.partnerTypes.find(
            (pt) => pt.partnerType.typeId === OUTSOURCE_TYPE_ID
          );
          return {
            id: o.partnerId,
            code: t?.partnerCode || "",
            label: `${t?.partnerCode || ""} - ${o.partnerName}`,
            name: o.partnerName,
            address: o.address,
            phone: o.phone,
            contactName: o.contactName,
          };
        })
        .filter((c) => c.code && c.code.toUpperCase().includes("ĐTGC"));
      setOutsources(mapped);
    } catch (err) {
      console.error("Lỗi fetchOutsources:", err);
      setOutsources([]);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await getPartnersByType(SUPPLIER_TYPE_ID);
      if (!res || !res.partners) {
        console.error("API không trả về dữ liệu hợp lệ!");
        setSuppliers([]);
        return;
      }
      const mapped = res.partners
        .map((s) => {
          const t = s.partnerTypes.find(
            (pt) => pt.partnerType.typeId === SUPPLIER_TYPE_ID
          );
          return {
            id: s.partnerId,
            code: t?.partnerCode || "",
            label: `${t?.partnerCode || ""} - ${s.partnerName}`,
            name: s.partnerName,
            address: s.address,
            phone: s.phone,
            contactName: s.contactName,
          };
        })
        .filter((c) => c.code !== "");
      setSuppliers(mapped);
    } catch (err) {
      console.error("Lỗi fetchSuppliers:", err);
      setSuppliers([]);
    }
  };

  // ------------------ Khi đổi category => fetch DS tương ứng ------------------
  useEffect(() => {
    if (category === "Bán hàng" || category === "Sản xuất") {
      fetchOrders();
    }
    if (category === "Gia công") {
      fetchOutsources();
      fetchWarehouses();
      setExpectedReturns([]);
    }
    if (category === "Trả lại hàng mua") {
      fetchSuppliers();
    }
    if (category === "Sản xuất") {
      fetchProducts();
    }
    if (category === "Khác") {
      fetchItems();
      setPartnerCode("");
      setPartnerName("");
      setPartnerId(null);
      setContactName("");
      setAddress("");
    }
    setReferenceDocument("");
    setSoId(null);
    setDescription("");
    setProducts([]);
    setFiles([]);
  }, [category]);

  // ------------------ Handle chọn đơn hàng ------------------
  const handleOpenChooseOrderModal = () => setIsChooseOrderModalOpen(true);
  const handleCloseChooseOrderModal = () => setIsChooseOrderModalOpen(false);

  // ------------------ Handle chọn đơn hàng ------------------
  const handleOrderSelected = async (selectedOrder) => {
    if (!selectedOrder) {
      setReferenceDocument("");
      setSoId(null);
      setPartnerCode("");
      setPartnerName("");
      setPartnerId(null);
      setDescription("");
      setAddress("");
      setContactName("");
      setProducts([]);
      return;
    }

    setReferenceDocument(selectedOrder.orderCode);
    setSoId(selectedOrder.orderId || selectedOrder.id); // Changed from selectedOrder.id to selectedOrder.orderId
    setPartnerCode(selectedOrder.partnerCode);
    setPartnerName(selectedOrder.partnerName);
    setDescription(selectedOrder.orderName || "");
    setAddress(selectedOrder.address || "");
    setContactName(selectedOrder.contactName || "");

    if (category === "Sản xuất") {
      // Kiểm tra materials trước khi gọi buildMaterialRows
      if (!selectedOrder.materials || !Array.isArray(selectedOrder.materials) || selectedOrder.materials.length === 0) {
        console.warn("[handleOrderSelected] No materials found in selected order");
        setProducts([]);
        setItemsError("Đơn hàng không có danh sách vật tư!");
        handleCloseChooseOrderModal();
        return;
      }

      // 👉 Lấy danh sách vật tư từ SalesOrder.materials
      const materialRows = await buildMaterialRows(selectedOrder.materials, selectedOrder.orderId);
      console.log("[handleOrderSelected] Material rows for production:", JSON.stringify(materialRows, null, 2));

      if (materialRows.length === 0) {
        setItemsError("Không tìm thấy vật tư hợp lệ trong đơn hàng!");
      } else {
        setItemsError("");
      }

      setProducts(materialRows);
      handleCloseChooseOrderModal();
      return;
    }
    // Tạo mảng products cho sản phẩm từ đơn hàng
    const newProducts = [];
    for (const detail of selectedOrder.orderDetails) {
      let inStockArr = [];
      try {
        if (detail.productId) {
          inStockArr = await getTotalQuantityOfProduct(detail.productId, selectedOrder.orderId);
        }
      } catch (err) {
        console.error("Lỗi getTotalQuantityOfProduct:", err);
      }

      newProducts.push({
        id: `p-${detail.productId}-${Math.random()}`,
        productId: detail.productId,
        productCode: detail.productCode || "",
        productName: detail.productName || "",
        unitName: detail.unitName || "",
        unitId: detail.unitId,
        orderQuantity: detail.quantity || 0,
        exportedQuantity: detail.receivedQuantity || 0,
        pendingQuantity: (detail.quantity || 0) - (detail.receivedQuantity || 0),
        inStock: inStockArr && inStockArr.length > 0
          ? inStockArr.map((wh) => ({
            warehouseId: wh.warehouseId,
            warehouseName: wh.warehouseName || "",
            quantity: wh.quantity || 0,
            exportQuantity: 0,
            error: ""
          }))
          : [{
            warehouseId: null,
            warehouseName: " ",
            quantity: 0,
            exportQuantity: 0,
            error: ""
          }]
      });

      if (!inStockArr || inStockArr.length === 0) {
        console.warn(`Không có dữ liệu tồn kho cho sản phẩm có ID: ${detail.productId}`);
      }
    }
    console.log("New products set from selected order:", newProducts);
    setProducts(newProducts);
    handleCloseChooseOrderModal();
  };

  // ------------------ Mở popup thêm đối tác ------------------
  const handleOpenCreatePartnerPopup = () => setIsCreatePartnerPopupOpen(true);
  const handleCloseCreatePartnerPopup = () => setIsCreatePartnerPopupOpen(false);

  // ------------------ Thêm/Xoá dòng (cho products) ------------------
  const handleAddRow = () => {
    if (category === "Trả lại hàng mua" || category === "Gia công") {
      setProducts((prev) => [
        ...prev,
        {
          id: `new-${prev.length + 1}`,
          materialId: null,
          materialCode: "",
          materialName: "",
          unitName: "",
          unitId: null,
          inventory: [{
            warehouseId: null,
            warehouseName: "",
            quantity: 0,
            exportQuantity: 0,
            error: ""
          }],
        },
      ]);
    } else if (category === "Sản xuất" || category === "Bán hàng") {
      setProducts((prev) => [
        ...prev,
        {
          id: `new-${prev.length + 1}`,
          productId: null,
          productCode: "",
          productName: "",
          unitName: "",
          unitId: null,
          orderQuantity: 1,
          exportedQuantity: 0,
          pendingQuantity: 1,
          inStock: [{
            warehouseId: null,
            warehouseName: "",
            quantity: 0,
            exportQuantity: 0,
            error: ""
          }],
        },
      ]);
    } else if (category === "Khác") {
      setProducts((prev) => [
        ...prev,
        {
          id: `new-${prev.length + 1}`,
          itemId: null, // Thay vì materialId/productId, dùng itemId chung
          itemCode: "",
          itemName: "",
          unitName: "",
          unitId: null,
          itemType: "", // Loại: material hoặc product
          inventory: [{
            warehouseId: null,
            warehouseName: "",
            quantity: 0,
            exportQuantity: 0,
            error: ""
          }],
        },
      ]);
    }
    setItemsError("");
  };

  const handleRemoveAllRows = () => setProducts([]);

  const handleDeleteRow = (rowId) => {
    setProducts((prev) => prev.filter((p) => p.id !== rowId));
  };

  // ------------------ Thêm/Xoá dòng (cho expectedReturns) ------------------
  const handleAddExpectedReturnRow = () => {
    setExpectedReturns((prev) => [
      ...prev,
      {
        id: `new-${prev.length + 1}`,
        materialId: null,
        materialCode: "",
        materialName: "",
        unitId: null,
        unitName: "",
        expectedQuantity: 0,
        error: "" // Thêm trường error để hiển thị lỗi
      },
    ]);
  };

  const handleRemoveAllExpectedReturnRows = () => setExpectedReturns([]);

  const handleDeleteExpectedReturnRow = (rowId) => {
    setExpectedReturns((prev) => prev.filter((p) => p.id !== rowId));
  };

  // ------------------ Pagination cho sản phẩm/NVL ------------------
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const totalPages = Math.ceil(products.length / pageSize);
  const totalElements = products.length;

  useEffect(() => {
    if (currentPage >= totalPages) {
      setCurrentPage(totalPages > 0 ? totalPages - 1 : 0);
    }
  }, [products, totalPages, currentPage]);

  const handlePageChange = ({ selected }) => {
    setCurrentPage(selected);
  };

  // ------------------ Hàm render bảng thống nhất (products) ------------------
  const renderUnifiedTableBody = () => {
    const displayed = products.slice(
      currentPage * pageSize,
      (currentPage + 1) * pageSize
    );

    if (displayed.length === 0) {
      return (
        <tr>
          <td colSpan={category === "Bán hàng" || category === "Sản xuất" ? 11 : 8} className="h-[104px] px-4 py-2 text-[14px] text-center text-[#000000DE] align-middle">
            Không có dữ liệu
          </td>
        </tr>
      );
    }

    if (category === "Gia công" || category === "Trả lại hàng mua") {
      return displayed.flatMap((nvl, nvlIndex) => {
        const inv = nvl.inventory && nvl.inventory.length > 0
          ? nvl.inventory
          : [{ warehouseId: null, warehouseName: "", quantity: 0, exportQuantity: 0, error: "" }];

        return inv.map((wh, whIndex) => {
          const isFirstRow = whIndex === 0;
          const rowSpan = inv.length;
          return (
            <tr key={`${nvl.id}-wh-${whIndex}`} className="border-b hover:bg-[#0000000A]">
              {isFirstRow && (
                <>
                  <td rowSpan={rowSpan} className="px-2 py-2 text-sm text-[#000000DE] text-center w-10 border-r border-[rgba(224,224,224,1)]">
                    {currentPage * pageSize + nvlIndex + 1}
                  </td>
                  <td rowSpan={rowSpan} className="px-2 py-2 text-sm w-60 border-r border-[rgba(224,224,224,1)]">
                    <Autocomplete
                      options={getAvailableMaterialsForExport() || []}
                      getOptionLabel={(option) =>
                        `${option.materialCode} - ${option.materialName}`
                      }
                      value={materials.find(mat => mat.materialId === nvl.materialId) || null}
                      onChange={async (event, newValue) => {
                        if (newValue) {
                          try {
                            const inventoryData = await getTotalQuantityOfMaterial(newValue.materialId);
                            setProducts((prev) =>
                              prev.map((p) => {
                                if (p.id === nvl.id) {
                                  return {
                                    ...p,
                                    materialId: newValue.materialId,
                                    materialCode: newValue.materialCode,
                                    materialName: newValue.materialName,
                                    unitName: newValue.unitName,
                                    unitId: newValue.unitId,
                                    inventory: inventoryData && inventoryData.length > 0
                                      ? inventoryData.map((i) => ({
                                        warehouseId: i.warehouseId,
                                        warehouseName: i.warehouseName || "",
                                        quantity: i.quantity || 0,
                                        exportQuantity: 0,
                                        error: ""
                                      }))
                                      : [{
                                        warehouseId: null,
                                        warehouseName: " ",
                                        quantity: 0,
                                        exportQuantity: 0,
                                        error: ""
                                      }]
                                  };
                                }
                                return p;
                              })
                            );
                          } catch (error) {
                            console.error("Lỗi khi lấy tồn kho vật tư:", error);
                          }
                        } else {
                          setProducts((prev) =>
                            prev.map((p) => {
                              if (p.id === nvl.id) {
                                return {
                                  ...p,
                                  materialId: null,
                                  materialCode: "",
                                  materialName: "",
                                  unitName: "",
                                  unitId: null,
                                  inventory: [{
                                    warehouseId: null,
                                    warehouseName: " ",
                                    quantity: 0,
                                    exportQuantity: 0,
                                    error: ""
                                  }]
                                };
                              }
                              return p;
                            })
                          );
                        }
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          error={!!wh.error}
                          placeholder="Chọn NVL"
                          variant="outlined"
                          size="small"
                          color="success"
                        />
                      )}
                    />
                    {wh.error && (
                      <Typography className="text-xs text-red-500 mt-1">
                        {wh.error}
                      </Typography>
                    )}
                  </td>
                  <td rowSpan={rowSpan} className="px-2 py-2 text-sm w-60 border-r border-[rgba(224,224,224,1)]">
                    {nvl.materialName}
                  </td>
                  <td rowSpan={rowSpan} className="px-2 py-2 text-sm w-28 border-r border-[rgba(224,224,224,1)]">
                    {nvl.unitName}
                  </td>
                </>
              )}
              <td className="px-2 py-2 text-sm w-52 border-r border-[rgba(224,224,224,1)]">
                {wh.warehouseName || " "}
              </td>
              <td className="px-2 py-2 text-sm text-center w-24 border-r border-[rgba(224,224,224,1)]">{wh.quantity}</td>
              <td className="px-3 py-2 border-r text-sm w-40">
                <div style={{ width: "100%" }}>
                  <TextField
                    type="number"
                    size="small"
                    color="success"
                    error={!!wh.error}
                    value={wh.exportQuantity}
                    placeholder="0"
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const maxAllowed = wh.quantity;
                      if (val > maxAllowed) {
                        setProducts((prev) =>
                          prev.map((p) => {
                            if (p.id === nvl.id) {
                              const newInv = p.inventory.map((invItem, i) => {
                                if (i === whIndex) {
                                  return {
                                    ...invItem,
                                    error: `SL xuất không được vượt quá tồn kho (${maxAllowed}).`
                                  };
                                }
                                return invItem;
                              });
                              return { ...p, inventory: newInv };
                            }
                            return p;
                          })
                        );
                        return;
                      }
                      if (val <= 0) {
                        setProducts((prev) =>
                          prev.map((p) => {
                            if (p.id === nvl.id) {
                              const newInv = p.inventory.map((invItem, i) => {
                                if (i === whIndex) {
                                  return {
                                    ...invItem,
                                    error: "Số lượng phải lớn hơn 0!"
                                  };
                                }
                                return invItem;
                              });
                              return { ...p, inventory: newInv };
                            }
                            return p;
                          })
                        );
                        return;
                      }
                      setProducts((prev) =>
                        prev.map((p) => {
                          if (p.id === nvl.id) {
                            const newInv = p.inventory.map((invItem, i) => {
                              if (i === whIndex) {
                                return {
                                  ...invItem,
                                  exportQuantity: val,
                                  error: ""
                                };
                              }
                              return invItem;
                            });
                            return { ...p, inventory: newInv };
                          }
                          return p;
                        })
                      );
                    }}
                    style={{ width: '100%' }}
                  />
                  {wh.error && (
                    <Typography className="text-xs text-red-500 mt-1">
                      {wh.error}
                    </Typography>
                  )}
                </div>
              </td>
              {isFirstRow && (
                <td rowSpan={rowSpan} className="px-2 py-2 text-center text-sm">
                  <Tooltip title="Xóa">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteRow(nvl.id)}
                    >
                      <HighlightOffRounded />
                    </IconButton>
                  </Tooltip>
                </td>
              )}
            </tr>
          );
        });
      });
    } else if (category === "Sản xuất") {
      return displayed.flatMap((mat, matIndex) => {
        return (mat.inStock || []).map((wh, whIndex) => {
          const isFirstRow = whIndex === 0;
          const rowSpan = mat.inStock ? mat.inStock.length : 1;
          const maxExport = Math.min(wh.quantity, mat.pendingQuantity);

          return (
            <tr key={`${mat.id}-wh-${whIndex}`} className="border-b hover:bg-gray-50">
              {isFirstRow && (
                <>
                  <td rowSpan={rowSpan} className="px-2 py-2 text-sm text-[#000000DE] w-20 border-r border-[rgba(224,224,224,1)]">
                    {currentPage * pageSize + (matIndex + 1)}
                  </td>
                  <td rowSpan={rowSpan} className="px-3 py-2 border-r text-sm">{mat.materialCode}</td>
                  <td rowSpan={rowSpan} className="px-3 py-2 border-r text-sm">{mat.materialName}</td>
                  <td rowSpan={rowSpan} className="px-3 py-2 border-r text-sm">{mat.unitName}</td>
                  <td rowSpan={rowSpan} className="px-3 py-2 border-r text-center text-sm">{mat.orderQuantity}</td>
                  <td rowSpan={rowSpan} className="px-3 py-2 border-r text-center text-sm">{mat.exportedQuantity}</td>
                  <td rowSpan={rowSpan} className="px-3 py-2 border-r text-center text-sm">{mat.pendingQuantity}</td>
                </>
              )}
              <td className="px-3 py-2 border-r text-sm">{wh.warehouseName || " "}</td>
              <td className="px-3 py-2 border-r text-sm text-right">{wh.quantity}</td>
              <td className="px-3 py-2 border-r text-sm w-24">
                <div style={{ width: "100%" }}>
                  <TextField
                    type="number"
                    size="small"
                    color="success"
                    error={!!wh.error}
                    value={wh.exportQuantity || 0}
                    placeholder="0"
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val > maxExport) {
                        setProducts((prev) =>
                          prev.map((p) => {
                            if (p.id === mat.id) {
                              const newInStock = p.inStock.map((ins, i) => {
                                if (i === whIndex) {
                                  return {
                                    ...ins,
                                    error: `Số lượng xuất không được vượt quá Tồn kho (${wh.quantity})!`
                                  };
                                }
                                return ins;
                              });
                              return { ...p, inStock: newInStock };
                            }
                            return p;
                          })
                        );
                        return;
                      }
                      if (val <= 0) {
                        setProducts((prev) =>
                          prev.map((p) => {
                            if (p.id === mat.id) {
                              const newInStock = p.inStock.map((ins, i) => {
                                if (i === whIndex) {
                                  return {
                                    ...ins,
                                    error: "Số lượng phải lớn hơn 0!"
                                  };
                                }
                                return ins;
                              });
                              return { ...p, inStock: newInStock };
                            }
                            return p;
                          })
                        );
                        return;
                      }
                      setProducts(prev => prev.map(p => {
                        if (p.id === mat.id) {
                          const inStock = p.inStock.map((ins, i) => i === whIndex ? { ...ins, exportQuantity: val, error: "" } : ins);
                          return { ...p, inStock };
                        }
                        return p;
                      }));
                    }}
                    style={{ width: '100%' }}
                  />
                  {wh.error && (
                    <Typography className="text-xs text-red-500 mt-1">
                      {wh.error}
                    </Typography>
                  )}
                </div>
              </td>
              {isFirstRow && (
                <td rowSpan={rowSpan} className="px-3 py-2 text-center text-sm">
                  <Tooltip title="Xóa">
                    <IconButton size="small" color="error" onClick={() => handleDeleteRow(mat.id)}>
                      <HighlightOffRounded />
                    </IconButton>
                  </Tooltip>
                </td>
              )}
            </tr>
          );
        });
      });
    } else if (category === "Khác") {
      return displayed.flatMap((item, itemIndex) => {
        const inv = item.inventory && item.inventory.length > 0
          ? item.inventory
          : [{ warehouseId: null, warehouseName: "", quantity: 0, exportQuantity: 0, error: "" }];

        return inv.map((wh, whIndex) => {
          const isFirstRow = whIndex === 0;
          const rowSpan = inv.length;
          return (
            <tr key={`${item.id}-wh-${whIndex}`} className="border-b hover:bg-gray-50">
              {isFirstRow && (
                <>
                  <td rowSpan={rowSpan} className="px-3 py-2 border-r text-center text-sm">
                    {currentPage * pageSize + itemIndex + 1}
                  </td>
                  <td rowSpan={rowSpan} className="px-3 py-2 border-r text-sm">
                    <Autocomplete
                      options={getAvailableItemsForKhac() || []}
                      getOptionLabel={(option) =>
                        `${option.code} - ${option.name} (${option.type === 'material' ? 'Vật tư' : 'Sản phẩm'})`
                      }
                      value={itemList.find(it => it.id === item.itemId) || null}
                      onChange={async (event, newValue) => {
                        if (newValue) {
                          try {
                            // Lấy tồn kho dựa trên loại (material hoặc product)
                            const inventoryData = newValue.type === 'material'
                              ? await getTotalQuantityOfMaterial(newValue.id.split('-')[1])
                              : await getTotalQuantityOfProduct(newValue.id.split('-')[1]);
                            setProducts((prev) =>
                              prev.map((p) => {
                                if (p.id === item.id) {
                                  return {
                                    ...p,
                                    itemId: newValue.id,
                                    itemCode: newValue.code,
                                    itemName: newValue.name,
                                    unitName: newValue.unitName,
                                    unitId: newValue.unitId,
                                    itemType: newValue.type,
                                    inventory: inventoryData && inventoryData.length > 0
                                      ? inventoryData.map((i) => ({
                                        warehouseId: i.warehouseId,
                                        warehouseName: i.warehouseName || "",
                                        quantity: i.quantity || 0,
                                        exportQuantity: 0,
                                        error: ""
                                      }))
                                      : [{
                                        warehouseId: null,
                                        warehouseName: " ",
                                        quantity: 0,
                                        exportQuantity: 0,
                                        error: ""
                                      }]
                                  };
                                }
                                return p;
                              })
                            );
                          } catch (error) {
                            console.error("Lỗi khi lấy tồn kho:", error);
                          }
                        } else {
                          setProducts((prev) =>
                            prev.map((p) => {
                              if (p.id === item.id) {
                                return {
                                  ...p,
                                  itemId: null,
                                  itemCode: "",
                                  itemName: "",
                                  unitName: "",
                                  unitId: null,
                                  itemType: "",
                                  inventory: [{
                                    warehouseId: null,
                                    warehouseName: " ",
                                    quantity: 0,
                                    exportQuantity: 0,
                                    error: ""
                                  }]
                                };
                              }
                              return p;
                            })
                          );
                        }
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          error={!!wh.error}
                          placeholder="Chọn vật tư/sản phẩm"
                          variant="outlined"
                          size="small"
                          color="success"
                        />
                      )}
                    />
                    {wh.error && (
                      <Typography className="text-xs text-red-500 mt-1">
                        {wh.error}
                      </Typography>
                    )}
                  </td>
                  <td rowSpan={rowSpan} className="px-3 py-2 border-r text-sm">
                    {item.itemName}
                  </td>
                  <td rowSpan={rowSpan} className="px-3 py-2 border-r text-sm">
                    {item.unitName}
                  </td>
                </>
              )}
              <td className="px-3 py-2 border-r text-sm">
                {wh.warehouseName || " "}
              </td>
              <td className="px-3 py-2 border-r text-sm text-right">{wh.quantity}</td>
              <td className="px-3 py-2 border-r text-sm w-24">
                <div style={{ width: "100%" }}>
                  <TextField
                    type="number"
                    size="small"
                    color="success"
                    error={!!wh.error}
                    value={wh.exportQuantity}
                    placeholder="0"
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const maxAllowed = wh.quantity;
                      if (val > maxAllowed) {
                        setProducts((prev) =>
                          prev.map((p) => {
                            if (p.id === item.id) {
                              const newInv = p.inventory.map((invItem, i) => {
                                if (i === whIndex) {
                                  return {
                                    ...invItem,
                                    error: `SL xuất không được vượt quá tồn kho (${maxAllowed}).`
                                  };
                                }
                                return invItem;
                              });
                              return { ...p, inventory: newInv };
                            }
                            return p;
                          })
                        );
                        return;
                      }
                      if (val <= 0) {
                        setProducts((prev) =>
                          prev.map((p) => {
                            if (p.id === item.id) {
                              const newInv = p.inventory.map((invItem, i) => {
                                if (i === whIndex) {
                                  return {
                                    ...invItem,
                                    error: "Số lượng phải lớn hơn 0!"
                                  };
                                }
                                return invItem;
                              });
                              return { ...p, inventory: newInv };
                            }
                            return p;
                          })
                        );
                        return;
                      }
                      setProducts((prev) =>
                        prev.map((p) => {
                          if (p.id === item.id) {
                            const newInv = p.inventory.map((invItem, i) => {
                              if (i === whIndex) {
                                return {
                                  ...invItem,
                                  exportQuantity: val,
                                  error: ""
                                };
                              }
                              return invItem;
                            });
                            return { ...p, inventory: newInv };
                          }
                          return p;
                        })
                      );
                    }}
                    style={{ width: '100%' }}
                  />
                  {wh.error && (
                    <Typography className="text-xs text-red-500 mt-1">
                      {wh.error}
                    </Typography>
                  )}
                </div>
              </td>
              {isFirstRow && (
                <td rowSpan={rowSpan} className="px-3 py-2 text-center text-sm">
                  <Tooltip title="Xóa">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteRow(item.id)}
                    >
                      <HighlightOffRounded />
                    </IconButton>
                  </Tooltip>
                </td>
              )}
            </tr>
          );
        });
      });
    } else { // Bán hàng
      return displayed.flatMap((prod, prodIndex) => {
        return (prod.inStock || []).map((wh, whIndex) => {
          const isFirstRow = whIndex === 0;
          const rowSpan = prod.inStock ? prod.inStock.length : 1;
          const maxExport =
            typeof wh.quantity === "number" &&
              typeof prod.pendingQuantity === "number"
              ? Math.min(wh.quantity, prod.pendingQuantity)
              : undefined;

          return (
            <tr key={`${prod.id}-wh-${whIndex}`} className="border-b hover:bg-gray-50">
              {isFirstRow && (
                <>
                  <td rowSpan={rowSpan} className="px-3 py-2 border-r text-center text-sm">
                    {currentPage * pageSize + (prodIndex + 1)}
                  </td>
                  <td rowSpan={rowSpan} className="px-3 py-2 border-r text-sm">
                    {prod.productCode}
                  </td>
                  <td rowSpan={rowSpan} className="px-3 py-2 border-r text-sm">
                    {prod.productName}
                  </td>
                  <td rowSpan={rowSpan} className="px-3 py-2 border-r text-sm">
                    {prod.unitName}
                  </td>
                  <td rowSpan={rowSpan} className="px-3 py-2 border-r text-center text-sm">
                    {prod.orderQuantity}
                  </td>
                  <td rowSpan={rowSpan} className="px-3 py-2 border-r text-center text-sm">
                    {prod.exportedQuantity}
                  </td>
                  <td rowSpan={rowSpan} className="px-3 py-2 border-r text-center text-sm">
                    {prod.pendingQuantity}
                  </td>
                </>
              )}
              <td className="px-3 py-2 border-r text-sm">
                {wh.warehouseName || " "}
              </td>
              <td className="px-3 py-2 border-r text-sm text-right">{wh.quantity}</td>
              <td className="px-3 py-2 border-r text-sm w-24">
                <div style={{ width: "100%" }}>
                  <TextField
                    type="number"
                    size="small"
                    color="success"
                    error={!!wh.error}
                    value={wh.exportQuantity || 0}
                    placeholder="0"
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (maxExport !== undefined && val > maxExport) {
                        setProducts((prev) =>
                          prev.map((p) => {
                            if (p.id === prod.id) {
                              const newInStock = p.inStock.map((ins, i) => {
                                if (i === whIndex) {
                                  return {
                                    ...ins,
                                    error: `Số lượng xuất không được vượt quá Tồn kho (${wh.quantity}) và SL còn phải xuất (${prod.pendingQuantity}).`
                                  };
                                }
                                return ins;
                              });
                              return { ...p, inStock: newInStock };
                            }
                            return p;
                          })
                        );
                        return;
                      }
                      setProducts((prev) =>
                        prev.map((p) => {
                          if (p.id === prod.id) {
                            const newInStock = p.inStock.map((ins, i) => {
                              if (i === whIndex) {
                                return {
                                  ...ins,
                                  exportQuantity: val,
                                  error: ""
                                };
                              }
                              return ins;
                            });
                            return { ...p, inStock: newInStock };
                          }
                          return p;
                        })
                      );
                    }}
                    style={{ width: '100%' }}
                  />
                  {wh.error && (
                    <Typography className="text-xs text-red-500 mt-1">
                      {wh.error}
                    </Typography>
                  )}
                </div>
              </td>
              {isFirstRow && (
                <td rowSpan={rowSpan} className="px-3 py-2 text-center text-sm">
                  <Tooltip title="Xóa">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteRow(prod.id)}
                    >
                      <HighlightOffRounded />
                    </IconButton>
                  </Tooltip>
                </td>
              )}
            </tr>
          );
        });
      });
    }
  };

  // ------------------ Render bảng NVL dự kiến nhận lại ------------------
  const renderExpectedReturnsTable = () => {
    if (expectedReturns.length === 0) {
      return (
        <tr>
          <td colSpan={7} className="h-[104px] px-4 py-2 text-[14px] text-center text-[#000000DE] align-middle">
            Không có dữ liệu
          </td>
        </tr>
      );
    }

    return expectedReturns.map((item, index) => (
      <tr key={item.id} className="border-b hover:bg-gray-50">
        <td className="px-2 py-2 text-sm text-[#000000DE] text-center w-10 border-r border-[rgba(224,224,224,1)]">{index + 1}</td>
        <td className="px-2 py-2 text-sm w-72 border-r border-[rgba(224,224,224,1)]">
          <Autocomplete
            options={getAvailableMaterialsForExpectedReturns() || []}
            getOptionLabel={(option) =>
              `${option.materialCode} - ${option.materialName}`
            }
            value={materials.find((mat) => mat.materialId === item.materialId) || null}
            onChange={(event, newValue) => {
              setExpectedReturns((prev) =>
                prev.map((p) => {
                  if (p.id === item.id) {
                    return {
                      ...p,
                      materialId: newValue ? newValue.materialId : null,
                      materialCode: newValue ? newValue.materialCode : "",
                      materialName: newValue ? newValue.materialName : "",
                      unitId: newValue ? newValue.unitId : null,
                      unitName: newValue ? newValue.unitName : "",
                      error: newValue ? "" : "Vui lòng chọn NVL"
                    };
                  }
                  return p;
                })
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Chọn NVL"
                variant="outlined"
                size="small"
                color="success"
                error={!!item.error && !item.materialId}
                helperText={item.error && !item.materialId ? item.error : ""}
              />
            )}
          />
        </td>
        <td className="px-4 py-2 text-sm w-72 border-r border-[rgba(224,224,224,1)]">{item.materialName}</td>
        <td className="px-4 py-2 text-sm w-36 border-r border-[rgba(224,224,224,1)]">{item.unitName}</td>
        <td className="px-4 py-2 text-sm w-44 border-r border-[rgba(224,224,224,1)]">
          <div>
            <TextField
              type="number"
              size="small"
              color="success"
              error={!!item.error}
              value={item.expectedQuantity || 0}
              placeholder="0"
              onChange={(e) => {
                const val = Number(e.target.value);
                const error = val <= 0 ? "Số lượng phải lớn hơn 0!" : "";
                setExpectedReturns((prev) =>
                  prev.map((p) => {
                    if (p.id === item.id) {
                      return { ...p, expectedQuantity: val, error };
                    }
                    return p;
                  })
                );
              }}
              style={{ width: '100%' }}
            />
            {item.error && item.expectedQuantity <= 0 && (
              <div className="text-red-500 text-xs mt-1">{item.error}</div>
            )}
          </div>
        </td>
        <td className="px-4 py-2 text-center text-sm">
          <Tooltip title="Xóa">
            <IconButton
              size="small"
              color="error"
              onClick={() => handleDeleteExpectedReturnRow(item.id)}
            >
              <HighlightOffRounded />
            </IconButton>
          </Tooltip>
        </td>
      </tr>
    ));
  };

  // ------------------ Xử lý khi ấn Lưu với validate bổ sung ------------------
  const handleSave = async () => {
    if (isSaving) return; // Ngăn gọi API khi đang xử lý
    setIsSaving(true);

    try {
      if (!category) {
        setIssueCategoryError("Vui lòng chọn phân loại xuất kho!");
        return;
      }

      if ((category === "Bán hàng" || category === "Sản xuất") && !referenceDocument) {
        setReferenceDocumentError("Vui lòng chọn một chứng từ tham chiếu!");
        return;
      }

      if ((category === "Gia công" || category === "Trả lại hàng mua") && !partnerId) {
        setPartnerError(category === "Gia công" ? "Vui lòng chọn đối tác gia công!" : "Vui lòng chọn nhà cung cấp!");
        return;
      }

      if (category === "Gia công") {
        const invalidReturns = expectedReturns.some(
          (item) => !item.materialId || item.expectedQuantity <= 0
        );
        if (expectedReturns.length === 0 || invalidReturns) {
          setItemsError("Vui lòng thêm ít nhất một nguyên vật liệu!");
          return;
        }
      }

      const isExportExceed = products.some((prod) => {
        const items = prod.inventory || prod.inStock;
        return items.some((item) => item.exportQuantity > item.quantity);
      });
      if (isExportExceed) {
        console.log("Số lượng xuất không được vượt quá số lượng tồn kho!");
        return;
      }

      let details = [];
      let expectedReturnDetails = [];

      if (category === "Gia công" || category === "Trả lại hàng mua") {
        details = products
          .filter((row) => row.materialId && row.inventory?.length > 0)
          .flatMap((row) =>
            row.inventory
              .filter((wh) => wh.warehouseId && wh.exportQuantity > 0)
              .map((wh) => ({
                warehouseId: wh.warehouseId,
                materialId: row.materialId,
                quantity: wh.exportQuantity,
                unitId: row.unitId || 1,
              }))
          );
        if (category === "Gia công") {
          expectedReturnDetails = expectedReturns
            .filter((row) => row.materialId && row.expectedQuantity > 0)
            .map((row) => ({
              materialId: row.materialId,
              quantity: row.expectedQuantity,
              unitId: row.unitId || 1,
              received_quantity: 0,
            }));
        }
      } else if (category === "Khác") {
        details = products
          .filter((row) => row.itemId && row.inventory?.length > 0)
          .flatMap((row) =>
            row.inventory
              .filter((wh) => wh.warehouseId && wh.exportQuantity > 0)
              .map((wh) => {
                const itemIdParts = row.itemId.split('-');
                const id = itemIdParts[1];
                return {
                  warehouseId: wh.warehouseId,
                  [row.itemType === "material" ? "materialId" : "productId"]: id,
                  quantity: wh.exportQuantity,
                  unitId: row.unitId || 1,
                };
              })
          );
      } else { // Bán hàng hoặc Sản xuất
        details = products
          .filter((row) => (category === "Sản xuất" ? row.materialId : row.productId) && row.inStock?.length > 0)
          .flatMap((row) =>
            row.inStock
              .filter((wh) => wh.warehouseId && wh.exportQuantity > 0)
              .map((wh) => ({
                warehouseId: wh.warehouseId,
                [category === "Sản xuất" ? "materialId" : "productId"]: category === "Sản xuất" ? row.materialId : row.productId,
                quantity: wh.exportQuantity,
                unitId: row.unitId || 1,
              }))
          );
      }

      if (details.length === 0) {
        setItemsError("Vui lòng thêm ít nhất một hàng hoá!");
        return;
      }

      const payload = {
        ginCode: issueNoteCode,
        category,
        partnerId,
        issueDate: `${createdDate}T00:00:00`,
        description,
        details,
        soId,
        createdBy: 1,
        receiver: category === "Sản xuất" ? contactName : null,
        expectedReturns: category === "Gia công" ? expectedReturnDetails : undefined,
      };

      console.log("Sending payload:", JSON.stringify(payload, null, 2));

      const result = await addIssueNote(payload);
      if (result) {
        window.dispatchEvent(new Event("refreshNotifications"));
        if (files && files.length > 0) {
          try {
            const uploadResult = await uploadPaperEvidence(
              result.ginId,
              "GOOD_ISSUE_NOTE",
              files
            );
            console.log("Upload result:", uploadResult);
          } catch (uploadError) {
            console.error("Error uploading paper evidence:", uploadError);
            console.log("Lưu phiếu xuất thành công, nhưng lỗi khi tải file đính kèm!");
          }
        }
        navigate("/user/issueNote", { state: { successMessage: "Tạo phiếu xuất kho thành công!" } });
      }
    } catch (error) {
      console.error("Lỗi khi thêm phiếu xuất:", error);
      let errorMessage = "Đã xảy ra lỗi khi lưu phiếu xuất kho.";
      if (error.response) {
        // Xử lý lỗi từ ResponseStatusException
        if (error.response.status === 400) {
          errorMessage = error.response.data.message || "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.";
        } else if (error.response.status === 404) {
          errorMessage = error.response.data.message || "Không tìm thấy dữ liệu (NVL, kho, đơn vị, ...).";
        } else {
          errorMessage = error.response.data.message || "Lỗi server. Vui lòng thử lại sau.";
        }
      }
      console.log(errorMessage);
    } finally {
      setIsSaving(false);
    }
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
    <div
      className="mb-8 flex flex-col gap-12"
      style={{ height: "calc(100vh - 100px)" }}
    >
      <Card className="bg-gray-50 p-7 rounded-none shadow-none">
        <CardBody className="pb-2 bg-white rounded-xl">
          <PageHeader
            title={"Phiếu xuất kho " + issueNoteCode}
            showAdd={false}
            showImport={false}
            showExport={false}
          />

          <Typography
            variant="h6"
            className="flex items-center mb-4 text-black"
          >
            <InformationCircleIcon className="h-5 w-5 mr-2" />
            Thông tin chung
          </Typography>

          <div className="grid gap-4 mb-4 grid-cols-2">
            <div>
              <Typography variant="medium" className="mb-1 text-black">
                Phân loại xuất kho <span className="text-red-500">*</span>
              </Typography>
              <TextField
                select
                hiddenLabel
                color="success"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setIssueCategoryError("");
                  setPartnerError("");
                  setItemsError("");
                }}
                fullWidth
                size="small"
                error={!!issueCategoryError}
              >
                <MenuItem value="Bán hàng">Bán hàng</MenuItem>
                <MenuItem value="Sản xuất">Sản xuất</MenuItem>
                <MenuItem value="Gia công">Gia công</MenuItem>
                <MenuItem value="Trả lại hàng mua">Trả lại hàng mua</MenuItem>
                <MenuItem value="Khác">Khác</MenuItem>
              </TextField>

              {issueCategoryError && (
                <Typography color="red" className="text-sm pb-4">
                  {issueCategoryError}
                </Typography>
              )}
            </div>

            <div>
              <Typography variant="medium" className="mb-1 text-black">
                Ngày lập phiếu
              </Typography>
              <style>
                {`.MuiPickersCalendarHeader-label { text-transform: capitalize; }`}
              </style>
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
                <DatePicker
                  value={createdDate ? dayjs(createdDate) : null}
                  onChange={(newValue) => {
                    if (newValue) {
                      setIssueDateError("");
                      setCreateDate(newValue.format("YYYY-MM-DD"));
                    } else {
                      setIssueDateError("Vui lòng chọn ngày lập phiếu");
                    }
                  }}
                  onError={(newError) => {
                    if (newError) {
                      setIssueDateError("Ngày lập phiếu không hợp lệ");
                    } else {
                      setIssueDateError("");
                    }
                  }}
                  format="DD/MM/YYYY"
                  dayOfWeekFormatter={(weekday) => `${weekday.format("dd")}`}
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

              {issueDateError && (
                <Typography color="red" className="text-sm pb-4">
                  {issueDateError}
                </Typography>
              )}
            </div>
          </div>

          {(category === "Bán hàng" || category === "Sản xuất") && (
            <div className="grid grid-cols-3 gap-x-12 gap-y-4 mb-4">
              <div>
                <Typography variant="medium" className="mb-1 text-black">
                  Tham chiếu chứng từ gốc
                </Typography>
                <Autocomplete
                  options={orders}
                  disableClearable
                  clearIcon={null}
                  size="small"
                  getOptionLabel={(option) =>
                    `${option.orderCode} - ${option.orderName}`
                  }
                  value={
                    orders.find((o) => o.orderCode === referenceDocument) ||
                    null
                  }
                  onChange={async (event, newValue) => {
                    if (newValue) {
                      await handleOrderSelected(newValue); 
                      console.log("Selected order:", newValue);
                    } else {
                      // reset nếu bỏ chọn
                      setReferenceDocument("");
                      setSoId(null);
                      setProducts([]);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      color="success"
                      hiddenLabel
                      {...params}
                      placeholder="Tham chiếu chứng từ"
                      error={!!referenceDocumentError}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <div className="flex items-center space-x-1">
                            <IconButton
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenChooseOrderModal();
                              }}
                              size="small"
                            >
                              <FaSearch fontSize="small" />
                            </IconButton>
                            {partnerCode && (
                              <IconButton
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOrderSelected(null);
                                }}
                                size="small"
                              >
                                <ClearRounded fontSize="18px" />
                              </IconButton>
                            )}
                            {params.InputProps.endAdornment}
                          </div>
                        ),
                      }}
                    />
                  )}
                />
                {referenceDocumentError && (
                  <Typography color="red" className="text-sm pb-4">
                    {referenceDocumentError}
                  </Typography>
                )}
              </div>
              <div>
                <Typography variant="medium" className="mb-1 text-black">
                  Mã khách hàng
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  color="success"
                  variant="outlined"
                  type="text"
                  value={partnerCode}
                  disabled
                  sx={{
                    "& .MuiInputBase-root.Mui-disabled": {
                      bgcolor: "#eeeeee",
                      "& .MuiOutlinedInput-notchedOutline": {
                        border: "none",
                      },
                    },
                  }}
                />
              </div>
              <div>
                <Typography variant="medium" className="mb-1 text-black">
                  Tên khách hàng
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  color="success"
                  variant="outlined"
                  type="text"
                  value={partnerName}
                  disabled
                  sx={{
                    "& .MuiInputBase-root.Mui-disabled": {
                      bgcolor: "#eeeeee",
                      "& .MuiOutlinedInput-notchedOutline": { border: "none" },
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
                  type="text"
                  value={contactName}
                  disabled
                  sx={{
                    "& .MuiInputBase-root.Mui-disabled": {
                      bgcolor: "#eeeeee",
                      "& .MuiOutlinedInput-notchedOutline": {
                        border: "none",
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
                  type="text"
                  value={address}
                  disabled
                  sx={{
                    "& .MuiInputBase-root.Mui-disabled": {
                      bgcolor: "#eeeeee",
                      "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                    },
                  }}
                />
              </div>
            </div>
          )}

          {category === "Gia công" && (
            <div className="grid grid-cols-3 gap-x-12 gap-y-4 mb-4">
              <div>
                <Typography variant="medium" className="mb-1 text-black">
                  Mã đối tác gia công
                </Typography>
                <Autocomplete
                  options={outsources}
                  disableClearable
                  clearIcon={null}
                  size="small"
                  getOptionLabel={(option) => option.label || ""}
                  value={outsources.find((o) => o.code === partnerCode) || null}
                  onChange={(event, sel) => {
                    if (sel) {
                      setPartnerCode(sel.code);
                      setPartnerName(sel.name);
                      setAddress(sel.address);
                      setContactName(sel.contactName);
                      setPartnerId(sel.id);
                      setPartnerError("")
                    }
                  }}
                  slotProps={{
                    paper: {
                      sx: {
                        maxHeight: 300,
                        overflowY: "auto",
                      },
                    },
                  }}
                  renderInput={(params) => (
                    <TextField
                      color="success"
                      hiddenLabel
                      {...params}
                      placeholder="Mã đối tác gia công"
                      error={!!partnerError}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <div className="flex items-center space-x-1">
                            {/* <IconButton
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenCreatePartnerPopup();
                              }}
                              size="small"
                            >
                              <FaPlus fontSize="small" />
                            </IconButton> */}
                            {partnerCode && (
                              <IconButton
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPartnerCode("");
                                  setPartnerName("");
                                  setAddress("");
                                  setContactName("");
                                  setPartnerId(null);
                                }}
                                size="small"
                              >
                                <ClearRounded fontSize="18px" />
                              </IconButton>
                            )}
                            {params.InputProps.endAdornment}
                          </div>
                        ),
                      }}
                    />
                  )}
                />

                {partnerError && (
                  <Typography className="text-xs text-red-500 mt-1">
                    {partnerError}
                  </Typography>
                )}
              </div>
              <div className="col-span-2">
                <Typography variant="medium" className="mb-1 text-black">
                  Tên đối tác gia công
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  color="success"
                  variant="outlined"
                  value={partnerName}
                  disabled
                  sx={{
                    "& .MuiInputBase-root.Mui-disabled": {
                      bgcolor: "#eeeeee",
                      "& .MuiOutlinedInput-notchedOutline": { border: "none" },
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
                  value={contactName}
                  disabled
                  sx={{
                    "& .MuiInputBase-root.Mui-disabled": {
                      bgcolor: "#eeeeee",
                      "& .MuiOutlinedInput-notchedOutline": {
                        border: "none",
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
                  value={address}
                  disabled
                  sx={{
                    "& .MuiInputBase-root.Mui-disabled": {
                      bgcolor: "#eeeeee",
                      "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                    },
                  }}
                />
              </div>
            </div>
          )}

          {category === "Trả lại hàng mua" && (
            <div className="grid grid-cols-3 gap-x-12 gap-y-4 mb-4">
              <div>
                <Typography variant="medium" className="mb-1 text-black">
                  Mã nhà cung cấp
                </Typography>
                <Autocomplete
                  options={suppliers}
                  size="small"
                  getOptionLabel={(option) => option.label || ""}
                  value={suppliers.find((o) => o.code === partnerCode) || null}
                  onChange={(event, sel) => {
                    if (sel) {
                      setPartnerCode(sel.code);
                      setPartnerName(sel.name);
                      setAddress(sel.address);
                      setContactName(sel.contactName);
                      setPartnerId(sel.id);
                      setPartnerError("")
                    } else {
                      setPartnerCode("");
                      setPartnerName("");
                      setAddress("");
                      setContactName("");
                      setPartnerId("");
                    }
                  }}
                  slotProps={{
                    paper: {
                      sx: {
                        maxHeight: 300,
                        overflowY: "auto",
                      },
                    },
                  }}
                  renderInput={(params) => (
                    <TextField
                      color="success"
                      hiddenLabel
                      {...params}
                      error={!!partnerError}
                      placeholder="Mã nhà cung cấp"
                    />
                  )}
                />

                {partnerError && (
                  <Typography className="text-xs text-red-500 mt-1">
                    {partnerError}
                  </Typography>
                )}
              </div>
              <div className="col-span-2">
                <Typography variant="medium" className="mb-1 text-black">
                  Tên nhà cung cấp
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  color="success"
                  variant="outlined"
                  value={partnerName}
                  disabled
                  sx={{
                    "& .MuiInputBase-root.Mui-disabled": {
                      bgcolor: "#eeeeee",
                      "& .MuiOutlinedInput-notchedOutline": { border: "none" },
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
                  value={contactName}
                  disabled
                  sx={{
                    "& .MuiInputBase-root.Mui-disabled": {
                      bgcolor: "#eeeeee",
                      "& .MuiOutlinedInput-notchedOutline": {
                        border: "none",
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
                  value={address}
                  disabled
                  sx={{
                    "& .MuiInputBase-root.Mui-disabled": {
                      bgcolor: "#eeeeee",
                      "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                    },
                  }}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Typography variant="medium" className="mb-1 text-black">
                Diễn giải xuất kho
              </Typography>
              <TextField
                fullWidth
                size="small"
                hiddenLabel
                placeholder="Diễn giải"
                multiline
                rows={4}
                color="success"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div>
              <Typography variant="medium" className="mb-1 text-black">
                Kèm theo
              </Typography>
              <FileUploadBox files={files} setFiles={setFiles} maxFiles={3} />
            </div>
          </div>

          <Typography
            variant="h6"
            className="flex items-center mb-4 mt-8 text-black"
          >
            <ListBulletIcon className="h-5 w-5 mr-2" />
            Danh sách sản phẩm
          </Typography>
          <div className="py-2 flex items-center justify-between gap-2">
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
                className="border rounded px-2 py-1"
              >
                {[5, 10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <Typography variant="small" color="blue-gray" className="font-normal">
                bản ghi mỗi trang
              </Typography>
            </div>
          </div>

          {category === "Gia công" || category === "Trả lại hàng mua" || category === "Khác" ? (
            <div className="border border-gray-200 rounded mb-4 overflow-x-auto border-[rgba(224,224,224,1)]">
              <table className="w-full min-w-max text-left border-collapse border-[rgba(224,224,224,1)]">
                <thead className="bg-[#f5f5f5] border-b border-[rgba(224,224,224,1)]">
                  <tr>
                    <th className="bg-[#f5f5f5] h-[40px] px-4 py-2 text-sm font-medium text-[#000000DE] border-r border-[rgba(224,224,224,1)]">STT</th>
                    <th className="bg-[#f5f5f5] h-[40px] px-4 py-2 text-sm font-medium text-[#000000DE] border-r border-[rgba(224,224,224,1)]">{category === "Khác" ? "Mã vật tư/sản phẩm" : "Mã NVL"}</th>
                    <th className="bg-[#f5f5f5] h-[40px] px-4 py-2 text-sm font-medium text-[#000000DE] border-r border-[rgba(224,224,224,1)]">{category === "Khác" ? "Tên vật tư/sản phẩm" : "Tên NVL"}</th>
                    <th className="bg-[#f5f5f5] h-[40px] px-4 py-2 text-sm font-medium text-[#000000DE] border-r border-[rgba(224,224,224,1)]">Đơn vị</th>
                    <th className="bg-[#f5f5f5] h-[40px] px-4 py-2 text-sm font-medium text-[#000000DE] border-r border-[rgba(224,224,224,1)]">Kho</th>
                    <th className="bg-[#f5f5f5] h-[40px] px-4 py-2 text-sm font-medium text-[#000000DE] border-r border-[rgba(224,224,224,1)]">Tồn kho</th>
                    <th className="bg-[#f5f5f5] h-[40px] px-4 py-2 text-sm font-medium text-[#000000DE] border-r border-[rgba(224,224,224,1)]">SL xuất</th>
                    <th className="bg-[#f5f5f5] h-[40px] px-4 py-2 text-sm font-medium text-[#000000DE]">Thao tác</th>
                  </tr>
                </thead>
                <tbody>{renderUnifiedTableBody()}</tbody>
              </table>
            </div>
          ) : (
            <div className="border border-gray-200 rounded mb-4 overflow-x-auto border-[rgba(224,224,224,1)]">
              <table className="w-full min-w-max text-left border-collapse border-[rgba(224,224,224,1)]">
                <thead className="bg-[#f5f5f5] border-b border-[rgba(224,224,224,1)]">
                  <tr>
                    <th className="bg-[#f5f5f5] h-[40px] px-4 py-2 text-sm font-medium text-[#000000DE] border-r border-[rgba(224,224,224,1)]">STT</th>
                    <th className="bg-[#f5f5f5] h-[40px] px-4 py-2 text-sm font-medium text-[#000000DE] border-r border-[rgba(224,224,224,1)]">Mã hàng</th>
                    <th className="bg-[#f5f5f5] h-[40px] px-4 py-2 text-sm font-medium text-[#000000DE] border-r border-[rgba(224,224,224,1)]">Tên hàng</th>
                    <th className="bg-[#f5f5f5] h-[40px] px-4 py-2 text-sm font-medium text-[#000000DE] border-r border-[rgba(224,224,224,1)]">Đơn vị</th>
                    <th className="bg-[#f5f5f5] h-[40px] px-4 py-2 text-sm font-medium text-[#000000DE] border-r border-[rgba(224,224,224,1)]">SL Đặt</th>
                    <th className="bg-[#f5f5f5] h-[40px] px-4 py-2 text-sm font-medium text-[#000000DE] border-r border-[rgba(224,224,224,1)]">SL đã xuất</th>
                    <th className="bg-[#f5f5f5] h-[40px] px-4 py-2 text-sm font-medium text-[#000000DE] border-r border-[rgba(224,224,224,1)]">SL còn phải xuất</th>
                    <th className="bg-[#f5f5f5] h-[40px] px-4 py-2 text-sm font-medium text-[#000000DE] border-r border-[rgba(224,224,224,1)]">Kho</th>
                    <th className="bg-[#f5f5f5] h-[40px] px-4 py-2 text-sm font-medium text-[#000000DE] border-r border-[rgba(224,224,224,1)]">Tồn kho</th>
                    <th className="bg-[#f5f5f5] h-[40px] px-4 py-2 text-sm font-medium text-[#000000DE] border-r border-[rgba(224,224,224,1)]">SL xuất</th>
                    <th className="bg-[#f5f5f5] h-[40px] px-4 py-2 text-sm font-medium text-[#000000DE]">Thao tác</th>
                  </tr>
                </thead>
                <tbody>{renderUnifiedTableBody()}</tbody>
              </table>
            </div>
          )}

          {itemError && (
            <Typography color="red" className="text-sm pb-4 pt-1">
              {itemError}
            </Typography>
          )}

          {category !== "Bán hàng" && category !== "Sản xuất" && (
            <div className="flex gap-2 mb-4">
              <MuiButton size="small" variant="outlined" onClick={handleAddRow}>
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

          {category === "Gia công" && (
            <>
              <Typography
                variant="h6"
                className="flex items-center mb-4 mt-8 text-black"
              >
                <ListBulletIcon className="h-5 w-5 mr-2" />
                Danh sách NVL dự kiến nhận lại
              </Typography>
              <div className="border border-gray-200 rounded mb-4 overflow-x-auto border-[rgba(224,224,224,1)]">
                <table className="w-full min-w-max text-left border-collapse border-[rgba(224,224,224,1)]">
                  <thead className="bg-[#f5f5f5] border-b border-[rgba(224,224,224,1)]">
                    <tr>
                      <th className="bg-[#f5f5f5] h-[40px] px-4 py-2 text-sm font-medium text-[#000000DE] border-r border-[rgba(224,224,224,1)]">STT</th>
                      <th className="bg-[#f5f5f5] h-[40px] px-4 py-2 text-sm font-medium text-[#000000DE] border-r border-[rgba(224,224,224,1)]">Mã NVL</th>
                      <th className="bg-[#f5f5f5] h-[40px] px-4 py-2 text-sm font-medium text-[#000000DE] border-r border-[rgba(224,224,224,1)]">Tên NVL</th>
                      <th className="bg-[#f5f5f5] h-[40px] px-4 py-2 text-sm font-medium text-[#000000DE] border-r border-[rgba(224,224,224,1)]">Đơn vị</th>
                      <th className="bg-[#f5f5f5] h-[40px] px-4 py-2 text-sm font-medium text-[#000000DE] border-r border-[rgba(224,224,224,1)]">SL nhận</th>
                      <th className="bg-[#f5f5f5] h-[40px] px-4 py-2 text-sm font-medium text-[#000000DE]">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>{renderExpectedReturnsTable()}</tbody>
                </table>
              </div>

              {itemError && (
                <Typography color="red" className="text-sm pb-4 pt-1">
                  {itemError}
                </Typography>
              )}

              <div className="flex gap-2 mb-4">
                <MuiButton size="small" variant="outlined" onClick={handleAddExpectedReturnRow}>
                  <div className="flex items-center gap-2">
                    <FaPlus className="h-4 w-4" />
                    <span>Thêm dòng</span>
                  </div>
                </MuiButton>
                <MuiButton
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={handleRemoveAllExpectedReturnRows}
                >
                  <div className="flex items-center gap-2">
                    <FaTrash className="h-4 w-4" />
                    <span>Xoá hết dòng</span>
                  </div>
                </MuiButton>
              </div>
            </>
          )}

          {totalElements > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="font-normal"
                >
                  Trang {currentPage + 1} / {totalPages} • {totalElements} {category === "Gia công" ? "nguyên vật liệu" : "sản phẩm"}
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
          <Divider sx={{ marginY: "16px" }} />
          <div className="mt-4 mb-2 flex justify-between">
            <MuiButton
              color="info"
              size="medium"
              variant="outlined"
              sx={{
                height: "36px",
                color: "#616161",
                borderColor: "#9e9e9e",
                "&:hover": { backgroundColor: "#f5f5f5", borderColor: "#757575" },
              }}
              onClick={() => navigate("/user/issueNote")}
              className="flex items-center gap-2"
            >
              <FaArrowLeft className="h-3 w-3" /> Quay lại
            </MuiButton>
            <div className="flex items-center justify-end gap-2">
              <MuiButton
                size="medium"
                color="error"
                variant="outlined"
                onClick={() => navigate("/user/issueNote")}
              >
                Hủy
              </MuiButton>
              <Button
                size="lg"
                color="white"
                variant="text"
                className={`bg-[#0ab067] hover:bg-[#089456]/90 shadow-none text-white font-medium py-2 px-4 rounded-[4px] transition-all duration-200 ease-in-out ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                ripple={true}
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? "Đang lưu..." : "Lưu"}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {isCreatePartnerPopupOpen && (
        <ModalAddPartner
          category={category}
          onClose={handleCloseCreatePartnerPopup}
          onSuccess={() => {
            handleCloseCreatePartnerPopup();
            if (category === "Gia công") fetchOutsources();
            if (category === "Trả lại hàng mua") fetchSuppliers();
          }}
        />
      )}

      {isChooseOrderModalOpen && (
        <ModalChooseOrder
          onClose={handleCloseChooseOrderModal}
          onOrderSelected={handleOrderSelected}
        />
      )}
    </div>
  );
};

export default AddIssueNote;