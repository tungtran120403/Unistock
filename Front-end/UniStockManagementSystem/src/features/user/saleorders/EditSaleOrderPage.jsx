import { FaSave, FaArrowLeft, FaEdit, FaPlus, FaTrash, FaEye, FaCheck } from "react-icons/fa";
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
  Button,
  Input,
  Textarea,
  Typography,
} from "@material-tailwind/react";
import {
  TextField,
  Button as MuiButton,
  Tab,
  Tabs,
  Autocomplete,
  IconButton,
  Divider,
  MenuItem
} from '@mui/material';
import {
  HighlightOffRounded
} from '@mui/icons-material';
import { ListBulletIcon } from "@heroicons/react/24/outline";
import { InformationCircleIcon, IdentificationIcon } from "@heroicons/react/24/solid";
import Select, { components } from "react-select";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import useSaleOrder from "./useSaleOrder";
import { getPartnersByType, getPartnersByMaterial } from "@/features/user/partner/partnerService";
import {
  getProducts,
  getSaleOrderById,
  getTotalQuantityOfProduct,
  getProductMaterialsByProduct,
  cancelSaleOrder,
  setPreparingStatus,
} from "./saleOrdersService";
import ModalAddCustomer from "./ModalAddCustomer";
import PageHeader from "@/components/PageHeader";
import { canCreatePurchaseRequest } from "@/features/user/purchaseRequest/PurchaseRequestService";
import CancelSaleOrderModal from "./CancelSaleOrderModal";
import { getTotalQuantityOfMaterial } from "@/features/user/issueNote/issueNoteService";
import SuccessAlert from "@/components/SuccessAlert";
import ConfirmDialog from "@/components/ConfirmDialog";

const MODE_VIEW = "view";
const MODE_EDIT = "edit";
const MODE_DINHMUC = "dinhMuc";
const CUSTOMER_TYPE_ID = 1;

const EditSaleOrderPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { updateExistingOrder, updateSaleOrder } = useSaleOrder();

  const [orderCode, setOrderCode] = useState("");
  const [orderDate, setOrderDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [partnerId, setPartnerId] = useState(null);
  const [customerCode, setCustomerCode] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [address, setAddress] = useState("");
  const [contactName, setContactName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [description, setDescription] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  // Mảng dòng sản phẩm
  const [items, setItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [isCreatePartnerPopupOpen, setIsCreatePartnerPopupOpen] = useState(false);
  const [customerError, setCustomerError] = useState("");
  const [globalError, setGlobalError] = useState("");
  const [itemsErrors, setItemsErrors] = useState({});
  const [materialErrors, setMaterialErrors] = useState({});
  const [activeTab, setActiveTab] = useState("info");
  const [originalData, setOriginalData] = useState(null);
  const [mode, setMode] = useState(MODE_VIEW);
  const selectRef = useRef(null);
  const [nextId, setNextId] = useState(1);
  const [showMaterialTable, setShowMaterialTable] = useState(false);
  const [materialRequirements, setMaterialRequirements] = useState([]);
  const [canCreatePurchaseRequestState, setCanCreatePurchaseRequestState] = useState(false);

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Gọi API từ service để kiểm tra khả năng tạo PurchaseRequest
  useEffect(() => {
    const checkCanCreatePurchaseRequest = async () => {
      if (orderId) {
        try {
          const canCreate = await canCreatePurchaseRequest(orderId);
          setCanCreatePurchaseRequestState(canCreate);
        } catch (error) {
          console.error("Lỗi khi kiểm tra khả năng tạo yêu cầu mua vật tư:", error);
          setCanCreatePurchaseRequestState(false);
          setGlobalError("Không thể kiểm tra trạng thái yêu cầu mua vật tư. Vui lòng thử lại sau.");
        }
      }
    };
    checkCanCreatePurchaseRequest();
  }, [orderId]);

  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        const orderData = await getSaleOrderById(orderId);
        setOrderCode(orderData.orderCode || "");
        setOrderDate(
          orderData.orderDate
            ? dayjs(orderData.orderDate).format("YYYY-MM-DD")
            : dayjs().format("YYYY-MM-DD")
        );
        setPartnerId(orderData.partnerId || null);
        setCustomerCode(orderData.partnerCode || "");
        setCustomerName(orderData.partnerName || "");
        setDescription(orderData.note || "");
        setAddress(orderData.address || "");
        setContactName(orderData.contactName || "");
        setPhoneNumber(orderData.phoneNumber || "");

        const loadedItems = await Promise.all(
          (orderData.orderDetails || []).map(async (detail, index) => {
            let totalQuantity = 0;
            try {
              totalQuantity = await getTotalQuantityOfProduct(detail.productId);
            } catch (error) {
              console.warn(`Không lấy được tồn kho cho sản phẩm ${detail.productId}`);
            }
            return {
              id: detail.orderDetailId ?? `loaded-${index + 1}`,
              productId: detail.productId ?? null,
              productCode: detail.productCode,
              productName: detail.productName,
              unitName: detail.unitName,
              quantity: detail.quantity ?? 0,
              inStock: totalQuantity ?? detail.inStock ?? 0,
              usedQuantity: detail.usedQuantity ?? 0,
              exportedQuantity: detail.receivedQuantity ?? 0,
              pendingQuantity: (detail.quantity ?? 0) - (detail.receivedQuantity ?? 0),
              produceQuantity: (detail.quantity ?? 0) - (detail.usedQuantity ?? 0),
            };
          })
        );
        setItems(loadedItems);
        setOriginalData({
          orderCode: orderData.orderCode || "",
          orderDate: orderData.orderDate
            ? dayjs(orderData.orderDate).format("YYYY-MM-DD")
            : dayjs().format("YYYY-MM-DD"),
          partnerId: orderData.partnerId || null,
          partnerCode: orderData.partnerCode || "",
          partnerName: orderData.partnerName || "",
          note: orderData.note || "",
          address: orderData.address || "",
          contactName: orderData.contactName || "",
          phoneNumber: orderData.phoneNumber || "",
          items: JSON.parse(JSON.stringify(loadedItems)),
          rejectionReason: orderData.rejectionReason || "",
          statusLabel: orderData.statusLabel || "Không rõ",
          status: orderData.status || "",
        });
      } catch (error) {
        console.error("Lỗi khi lấy đơn hàng:", error);
        alert("Lỗi khi tải thông tin đơn hàng!");
      }
    };

    if (orderId) {
      fetchOrderDetail();
    }
  }, [orderId]);

  const fetchCustomers = async () => {
    try {
      const res = await getPartnersByType(CUSTOMER_TYPE_ID);
      if (!res || !res.partners) {
        console.error("API không trả về data hợp lệ!");
        setCustomers([]);
        return;
      }
      const mapped = res.partners
        .map((customer) => {
          const ctype = customer.partnerTypes.find(
            (pt) => pt.partnerType.typeId === CUSTOMER_TYPE_ID
          );
          return {
            id: customer.partnerId,
            code: ctype?.partnerCode || "",
            label: `${ctype?.partnerCode || ""} - ${customer.partnerName}`,
            name: customer.partnerName,
            address: customer.address,
            phone: customer.phone,
          };
        })
        .filter((c) => c.code !== "");
      setCustomers(mapped);
    } catch (err) {
      console.error("Lỗi KH:", err);
      setCustomers([]);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    const fetchProductsData = async () => {
      try {
        const response = await getProducts();
        const productOptions = response.content.map((product) => ({
          productId: product.productId,
          value: product.productCode,
          label: `${product.productCode} - ${product.productName}`,
          unit: product.unitName,
        }));
        setProducts(productOptions);
      } catch (err) {
        console.error("Lỗi fetch SP:", err);
      }
    };
    fetchProductsData();
  }, []);

  const handleSetMode = (newMode) => {
    setMode(newMode);
  };

  const handleEdit = () => {
    if (!originalData) return;
    handleSetMode(MODE_EDIT);
  };

  const handleXemDinhMuc = async () => {
    const updatedItems = await Promise.all(
      items.map(async (item) => {
        let details = [];
        try {
          details = await getTotalQuantityOfProduct(item.productId);
          details = details.map((d) => ({
            ...d,
            usedQuantity: details.length === 1 ? item.usedQuantity : 0,
          }));
        } catch (error) {
          console.warn(`Không lấy được tồn kho cho sản phẩm ${item.productId}`);
        }
        const totalUsed = details.reduce((sum, d) => sum + d.usedQuantity, 0);
        return { ...item, inStock: details, produceQuantity: item.quantity - totalUsed };
      })
    );
    setItems(updatedItems);
    handleSetMode(MODE_DINHMUC);
    setShowMaterialTable(true);

    const newMaterialErrors = {};
    await Promise.all(
      updatedItems.map(async (item) => {
        if (item.productId) {
          try {
            const materials = await getProductMaterialsByProduct(item.productId);
            if (!materials || materials.length === 0) {
              newMaterialErrors[item.id] = `Mã SP ${item.productCode} chưa có định mức NVL`;
            }
          } catch (error) {
            console.error("Lỗi khi kiểm tra định mức NVL:", error);
            newMaterialErrors[item.id] = `Mã SP ${item.productCode} chưa có định mức NVL`;
          }
        }
      })
    );
    setMaterialErrors(newMaterialErrors);
  };

  const handleDetailUsedQuantityChange = (itemId, detailIndex, val) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const newUsedInput = Number(val);
          const othersUsed = item.inStock.reduce(
            (sum, d, idx) => (idx === detailIndex ? sum : sum + d.usedQuantity),
            0
          );
          const allowedFromOrder = item.quantity - othersUsed;
          const currentDetail = item.inStock[detailIndex];
          const availableInDetail = currentDetail ? currentDetail.quantity : 0;
          const validUsed = Math.min(newUsedInput, allowedFromOrder, availableInDetail);
          const newDetails = item.inStock.map((d, idx) =>
            idx === detailIndex ? { ...d, usedQuantity: validUsed } : d
          );
          const totalUsed = newDetails.reduce((sum, d) => sum + d.usedQuantity, 0);
          return { ...item, inStock: newDetails, produceQuantity: item.quantity - totalUsed };
        }
        return item;
      })
    );
    setGlobalError("");
  };

  const handleCancelSaleOrder = async (reason) => {
    try {
      await cancelSaleOrder(orderId, reason);
      navigate("/user/sale-orders", {
        state: { successMessage: "Huỷ đơn hàng thành công!" },
      });
    } catch (error) {
      console.error("Lỗi khi hủy đơn hàng:", error);
      alert("Không thể hủy đơn hàng. Vui lòng thử lại sau.");
    }
  };

  const handleCancelEdit = () => {
    if (!originalData) return;
    setOrderCode(originalData.orderCode);
    setOrderDate(originalData.orderDate);
    setPartnerId(originalData.partnerId);
    setCustomerCode(originalData.partnerCode);
    setCustomerName(originalData.partnerName);
    setDescription(originalData.note);
    setAddress(originalData.address);
    setContactName(originalData.contactName);
    setPhoneNumber(originalData.phoneNumber);
    setItems(JSON.parse(JSON.stringify(originalData.items)));
    setGlobalError("");
    setItemsErrors({});
    setCustomerError("");
    setMaterialErrors({});
    handleSetMode(MODE_VIEW);
  };

  const handleCancel = () => {
    if (mode === MODE_EDIT) {
      handleCancelEdit();
    } else if (mode === MODE_DINHMUC) {
      setMaterialErrors({});
      handleSetMode(MODE_VIEW);
    } else {
      navigate("/user/sale-orders");
    }
  };

  const handleCustomerChange = (selectedOption) => {
    setPartnerId(selectedOption?.id || null);
    setCustomerCode(selectedOption?.code || "");
    setCustomerName(selectedOption?.name || "");
    setAddress(selectedOption?.address || "");
    setPhoneNumber(selectedOption?.phone || "");
    if (selectedOption?.code) setCustomerError("");
  };

  const handleAddRow = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `new-${nextId}`,
        productId: null,
        productCode: "",
        productName: "",
        unitName: "",
        quantity: 0,
        inStock: 0,
        usedQuantity: 0,
        exportedQuantity: 0,
        pendingQuantity: 0,
        produceQuantity: 0,
      },
    ]);
    setNextId((id) => id + 1);
    setGlobalError("");
  };

  const handleRemoveAllRows = () => {
    setItems([]);
    setNextId(1);
    setItemsErrors({});
    setMaterialErrors({});
    setGlobalError("");
  };

  const handleDeleteRow = (rowId) => {
    setItems((prev) => prev.filter((r) => r.id !== rowId));
    setMaterialErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[rowId];
      return newErrors;
    });
  };

  const handleSelectProduct = async (rowId, opt) => {
    setItems((prev) =>
      prev.map((r) =>
        r.id === rowId
          ? {
            ...r,
            productId: opt.productId,
            productCode: opt.value,
            productName: opt.label.split(" - ")[1] || "",
            unitName: opt.unit,
            exportedQuantity: 0,
            pendingQuantity: r.quantity,
          }
          : r
      )
    );
    setGlobalError("");

    if (mode === MODE_DINHMUC && opt.productId) {
      try {
        const materials = await getProductMaterialsByProduct(opt.productId);
        setMaterialErrors((prev) => {
          const newErrors = { ...prev };
          if (!materials || materials.length === 0) {
            newErrors[rowId] = `Mã SP ${opt.value} chưa có định mức NVL`;
          } else {
            delete newErrors[rowId];
          }
          return newErrors;
        });
      } catch (error) {
        console.error("Lỗi khi kiểm tra định mức NVL:", error);
        setMaterialErrors((prev) => ({
          ...prev,
          [rowId]: `Mã SP ${opt.value} chưa có định mức NVL`,
        }));
      }
    }
  };

  const handleQuantityChange = (rowId, val) => {
    setItems((prev) =>
      prev.map((r) => {
        if (r.id === rowId) {
          const newQuantity = Number(val);
          let totalUsed = 0;
          if (Array.isArray(r.inStock)) {
            totalUsed = r.inStock.reduce((sum, d) => sum + d.usedQuantity, 0);
          } else {
            totalUsed = r.usedQuantity;
          }
          return {
            ...r,
            quantity: newQuantity,
            pendingQuantity: newQuantity - r.exportedQuantity,
            produceQuantity: newQuantity - totalUsed,
          };
        }
        return r;
      })
    );
    setGlobalError("");
  };

  const handleUsedQuantityChange = (rowId, val) => {
    setItems((prev) =>
      prev.map((r) => {
        if (r.id === rowId && !Array.isArray(r.inStock)) {
          const newUsed = Number(val);
          return {
            ...r,
            usedQuantity: newUsed,
            produceQuantity: r.quantity - newUsed,
          };
        }
        return r;
      })
    );
    setGlobalError("");
  };

  const handleCreatePurchaseRequest = async () => {
    if (!orderId) {
      alert("Không tìm thấy đơn hàng để tạo yêu cầu mua vật tư!");
      return;
    }

    try {
      const materialsToBuy = materialRequirements.filter((mat) => mat.quantityToBuy > 0);

      if (materialsToBuy.length === 0) {
        alert("Không có vật tư nào cần mua từ đơn hàng này!");
        return;
      }

      // Tạo danh sách materials cho mỗi orderDetail
      const materialPromises = items.map(async (item) => {
        if (item.productId && item.produceQuantity > 0) {
          try {
            const materials = await getProductMaterialsByProduct(item.productId);
            console.log(`🔍 Materials for product ${item.productId}:`, materials);
            if (!materials || materials.length === 0) {
              console.warn(`No materials found for product ${item.productId}`);
              return [];
            }
            return materials
              .filter((mat) => mat.materialId != null)
              .map((mat) => {
                if (!mat.materialId) {
                  console.error(`Invalid material data for product ${item.productId}:`, mat);
                }
                return {
                  materialId: mat.materialId,
                  requiredQuantity: mat.quantity * item.produceQuantity,
                  receivedQuantity: 0,
                };
              });
          } catch (error) {
            console.error(`Lỗi khi lấy NVL cho sản phẩm ${item.productId}:`, error);
            return [];
          }
        }
        return [];
      });

      const materialsByItem = await Promise.all(materialPromises);
      console.log("🔍 materialsByItem:", JSON.stringify(materialsByItem, null, 2));

      // Tạo usedMaterialsFromWarehouses
      const usedMaterialsFromWarehouses = await Promise.all(
        materialRequirements
          .filter((req) => req.totalInStock > 0)
          .map(async (req) => {
            try {
              const warehouses = await getTotalQuantityOfMaterial(req.materialId);
              return warehouses
                .filter((w) => w.quantity > 0)
                .map((w) => ({
                  materialId: req.materialId,
                  materialCode: req.materialCode,
                  materialName: req.materialName,
                  unitName: req.unitName,
                  quantity: w.quantity, 
                  warehouseId: w.warehouseId,
                  warehouseName: w.warehouseName,
                }));
            } catch (error) {
              console.error(`Lỗi khi lấy tồn kho cho NVL ${req.materialCode}:`, error);
              return [];
            }
          })
      ).then((results) => results.flat());
      console.log("🔍 usedMaterialsFromWarehouses:", JSON.stringify(usedMaterialsFromWarehouses, null, 2));

      // Tạo payload để cập nhật SaleOrder
      const aggregated = items.reduce((acc, cur) => {
        const ex = acc.find((x) => x.productCode === cur.productCode);
        if (ex) {
          ex.quantity += cur.quantity;
          ex.inStock += cur.inStock;
          ex.usedQuantity += cur.usedQuantity;
          ex.exportedQuantity += cur.exportedQuantity;
          ex.pendingQuantity += cur.pendingQuantity;
          ex.produceQuantity += cur.produceQuantity;
        } else {
          acc.push({ ...cur });
        }
        return acc;
      }, []);

      const payload = {
        orderId: Number(orderId),
        orderCode,
        partnerId,
        partnerCode: customerCode,
        partnerName: customerName,
        address,
        phoneNumber,
        contactName,
        status: "PROCESSING",
        orderDate,
        note: description,
        orderDetails: aggregated.map((it, index) => ({
          orderDetailId: it.orderDetailId || null,
          productId: it.productId || null,
          productCode: it.productCode,
          productName: it.productName,
          quantity: it.quantity,
          unitName: it.unitName,
          inStock: it.inStock,
          usedQuantity: it.usedQuantity,
          receivedQuantity: it.exportedQuantity,
          produceQuantity: it.produceQuantity,
          materials: materialsByItem[index] ? materialsByItem[index].filter(mat => mat.materialId != null) : [],
        })),
      };

      console.log("🔍 Final payload for updateExistingOrder:", JSON.stringify(payload, null, 2));

      // Cập nhật SaleOrder
      await updateExistingOrder(orderId, payload);

      // Chuẩn bị dữ liệu cho PurchaseRequest
      const itemsWithSuppliers = await Promise.all(
        materialsToBuy.map(async (item) => {
          const suppliers = await getPartnersByMaterial(item.materialId);
          console.log(`🔍 Suppliers for material ${item.materialId}:`, suppliers);
          const mappedSuppliers = suppliers.map((supplier) => ({
            value: supplier.partnerId,
            label: supplier.partnerName,
            name: supplier.partnerName,
            code: supplier.partnerCode || "",
          }));

          const defaultSupplier = mappedSuppliers.length > 0 ? mappedSuppliers[0] : null;

          return {
            id: `temp-${item.materialId}`,
            materialId: item.materialId,
            materialCode: item.materialCode,
            materialName: item.materialName,
            unitName: item.unitName,
            quantity: item.quantityToBuy,
            supplierId: defaultSupplier ? defaultSupplier.value : "",
            supplierName: defaultSupplier ? defaultSupplier.name : "",
            suppliers: mappedSuppliers,
            supplierCount: mappedSuppliers.length,
          };
        })
      );

      // Sắp xếp: vật tư có từ 2 nhà cung cấp trở lên lên đầu
      const sortedItems = itemsWithSuppliers.sort((a, b) => {
        if (a.supplierCount >= 2 && b.supplierCount < 2) return -1;
        if (a.supplierCount < 2 && b.supplierCount >= 2) return 1;
        return 0;
      });

      const usedProductsFromWarehouses = items.flatMap((item) =>
        (item.inStock || []).filter(d => d.usedQuantity > 0).map((d) => ({
          productId: item.productId,
          productCode: item.productCode,
          productName: item.productName,
          unitName: item.unitName,
          quantity: d.usedQuantity,
          warehouseId: d.warehouseId,
          warehouseName: d.warehouseName,
        }))
      );

      console.log("🔍 Navigating to purchase request with data:", {
        sortedItems,
        usedProductsFromWarehouses,
        usedMaterialsFromWarehouses,
      });

      navigate("/user/purchase-request/add", {
        state: {
          fromSaleOrder: true,
          saleOrderId: orderId,
          saleOrderCode: orderCode,
          initialItems: sortedItems,
          usedProductsFromWarehouses,
          usedMaterialsFromWarehouses,
        },
      });
    } catch (error) {
      console.error("🔍 Detailed error in handleCreatePurchaseRequest:", {
        message: error.message,
        stack: error.stack,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
        } : null,
      });
      alert("Có lỗi xảy ra khi cập nhật đơn hàng hoặc chuẩn bị dữ liệu yêu cầu mua vật tư!");
    }
  };

  const handleSaveOrder = async () => {
    let hasError = false;
    if (!customerCode) {
      setCustomerError("Vui lòng chọn khách hàng!");
      hasError = true;
    }
    if (items.length === 0) {
      setGlobalError("Vui lòng thêm ít nhất một dòng sản phẩm!");
      return;
    }
    const newItemsErrors = {};
    items.forEach((it) => {
      newItemsErrors[it.id] = {};
      if (!it.productCode) {
        newItemsErrors[it.id].productError = "Chưa chọn sản phẩm!";
        hasError = true;
      }
      if (Number(it.quantity) <= 0) {
        newItemsErrors[it.id].quantityError = "Số lượng > 0!";
        hasError = true;
      }
    });
    setItemsErrors(newItemsErrors);
    if (hasError) return;

    const aggregated = items.reduce((acc, cur) => {
      const ex = acc.find((x) => x.productCode === cur.productCode);
      if (ex) {
        ex.quantity += cur.quantity;
        ex.inStock += cur.inStock;
        ex.usedQuantity += cur.usedQuantity;
        ex.exportedQuantity += cur.exportedQuantity;
        ex.pendingQuantity += cur.pendingQuantity;
        ex.produceQuantity += cur.produceQuantity;
      } else {
        acc.push({ ...cur });
      }
      return acc;
    }, []);

    const payload = {
      orderId: Number(orderId),
      orderCode,
      partnerId,
      partnerCode: customerCode,
      partnerName: customerName,
      address,
      phoneNumber,
      contactName,
      status: "PROCESSING",
      orderDate,
      note: description,
      orderDetails: aggregated.map((it) => ({
        orderDetailId: it.orderDetailId || null,
        productId: it.productId || null,
        productCode: it.productCode,
        productName: it.productName,
        quantity: it.quantity,
        unitName: it.unitName,
        inStock: it.inStock,
        usedQuantity: it.usedQuantity,
        receivedQuantity: it.exportedQuantity,
        produceQuantity: it.produceQuantity,
      })),
    };

    console.log("PUT data:", payload);

    try {
      await updateExistingOrder(orderId, payload);
      handleSetMode(MODE_VIEW);
      navigate("/user/sale-orders", {
        state: { successMessage: "Cập nhật đơn bán hàng thành công!" },
      });
    } catch (err) {
      console.error("Lỗi PUT order:", err);
      alert("Lỗi khi cập nhật đơn hàng!");
    }
  };

  const renderTableRows = () => {
    if (items.length === 0) {
      return (
        <tr>
          <td
            colSpan={mode === MODE_EDIT ? 8 : mode === MODE_DINHMUC ? 9 : 7}
            className="px-4 py-2 text-center text-gray-700"
          >
            Chưa có dòng sản phẩm nào
          </td>
        </tr>
      );
    }
    if (mode === MODE_DINHMUC) {
      return items.flatMap((item, idx) => {
        const details =
          Array.isArray(item.inStock) && item.inStock.length > 0
            ? item.inStock
            : [{ warehouseName: "", quantity: 0, usedQuantity: 0 }];
        const totalUsed = details.reduce((sum, d) => sum + d.usedQuantity, 0);
        return details.map((detail, detailIndex) => (
          <tr key={`${item.id}-${detailIndex}`} className="border-b border-[rgba(224,224,224,1)] last:border-b-0 hover:bg-gray-50">
            {detailIndex === 0 && (
              <>
                <td className="px-4 py-2 text-sm text-[#000000DE] w-10 border-r border-[rgba(224,224,224,1)]" rowSpan={details.length}>
                  {idx + 1}
                </td>
                <td className="px-4 py-2 text-sm border-r border-[rgba(224,224,224,1)] w-80" rowSpan={details.length}>
                  <Autocomplete
                    options={products}
                    size="small"
                    disabled={mode !== MODE_EDIT}
                    getOptionLabel={(option) => option.label}
                    value={products.find((p) => p.value === item.productCode) || null}
                    onChange={(event, selected) => {
                      if (selected) handleSelectProduct(item.id, selected);
                    }}
                    fullWidth
                    slotProps={{
                      paper: {
                        sx: {
                          maxHeight: 300,
                          overflowY: "auto",
                        },
                      },
                    }}
                    sx={{
                      '& .MuiInputBase-root.Mui-disabled': {
                        bgcolor: '#eeeeee',
                        '& .MuiOutlinedInput-notchedOutline': {
                          border: 'none',
                        },
                      },
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        color="success"
                        hiddenLabel
                        placeholder="Chọn sản phẩm"
                      />
                    )}
                  />
                  {itemsErrors[item.id]?.productError && (
                    <Typography color="red" className="text-xs mt-1">
                      {itemsErrors[item.id].productError}
                    </Typography>
                  )}
                  {materialErrors[item.id] && (
                    <Typography color="red" className="text-xs mt-1">
                      {materialErrors[item.id]}
                    </Typography>
                  )}
                </td>
                <td className="px-4 py-2 text-sm border-r w-96 text-[#000000DE] border-[rgba(224,224,224,1)]" rowSpan={details.length}>
                  {item.productName}
                </td>
                <td className="px-4 py-2 text-sm border-r w-36 text-[#000000DE] border-[rgba(224,224,224,1)]" rowSpan={details.length}>
                  {item.unitName}
                </td>
                <td className="px-4 py-2 text-sm border-r w-36 border-[rgba(224,224,224,1)]" rowSpan={details.length}>
                  <TextField
                    type="number"
                    size="small"
                    fullWidth
                    inputProps={{ min: 0 }}
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                    disabled={mode !== MODE_EDIT}
                    color="success"
                    hiddenLabel
                    placeholder="Số lượng"
                    sx={{
                      '& .MuiInputBase-root.Mui-disabled': {
                        bgcolor: '#eeeeee',
                        '& .MuiOutlinedInput-notchedOutline': {
                          border: 'none',
                        },
                      },
                    }}
                  />
                  {itemsErrors[item.id]?.quantityError && (
                    <Typography color="red" className="text-xs mt-1">
                      {itemsErrors[item.id].quantityError}
                    </Typography>
                  )}
                </td>
              </>
            )}
            <td className="px-4 py-2 text-sm border-r text-[#000000DE] border-[rgba(224,224,224,1)]">{detail.warehouseName}</td>
            <td className="px-4 py-2 text-sm border-r text-[#000000DE] border-[rgba(224,224,224,1)]">
              {detail.quantity || 0}
            </td>
            <td className="px-4 py-2 text-sm border-r w-40 border-[rgba(224,224,224,1)]">
              <TextField
                type="number"
                size="small"
                fullWidth
                slotProps={{
                  input: {
                    inputMode: "numeric",
                  }
                }}
                value={detail.usedQuantity === 0 ? "" : detail.usedQuantity}
                onChange={(e) =>
                  handleDetailUsedQuantityChange(item.id, detailIndex, e.target.value)
                }
                color="success"
                hiddenLabel
                placeholder="0"
              />
            </td>
            {detailIndex === 0 && (
              <td className="px-4 py-2 text-sm border-r text-center text-[#000000DE] border-[rgba(224,224,224,1)]" rowSpan={details.length}>
                {item.produceQuantity || 0}
              </td>
            )}
            {detailIndex === 0 && mode === MODE_EDIT && (
              <td className="px-4 py-2 text-sm text-center" rowSpan={details.length}>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDeleteRow(item.id)}
                >
                  <HighlightOffRounded />
                </IconButton>
              </td>
            )}
          </tr>
        ));
      });
    } else {
      return items.map((item, idx) => (
        <tr key={item.id} className="border-b last:border-b-0 hover:bg-gray-50">
          <td className="px-4 py-2 text-sm w-10 text-[#000000DE] border-r border-[rgba(224,224,224,1)]">{idx + 1}</td>
          <td className="px-4 py-2 text-sm border-r border-[rgba(224,224,224,1)] w-96">
            <Autocomplete
              options={products}
              size="small"
              disabled={mode !== MODE_EDIT}
              getOptionLabel={(option) => option.label}
              value={products.find((p) => p.value === item.productCode) || null}
              onChange={(event, selected) => {
                if (selected) handleSelectProduct(item.id, selected);
              }}
              fullWidth
              slotProps={{
                paper: {
                  sx: {
                    maxHeight: 300,
                    overflowY: "auto",
                  },
                },
              }}
              sx={{
                '& .MuiInputBase-root.Mui-disabled': {
                  bgcolor: '#eeeeee',
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none',
                  },
                },
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  color="success"
                  hiddenLabel
                  placeholder="Chọn sản phẩm"
                />
              )}
            />
            {itemsErrors[item.id]?.productError && (
              <Typography color="red" className="text-xs mt-1">
                {itemsErrors[item.id].productError}
              </Typography>
            )}
            {materialErrors[item.id] && mode === MODE_DINHMUC && (
              <Typography color="red" className="text-xs mt-1">
                {materialErrors[item.id]}
              </Typography>
            )}
          </td>
          <td className="px-4 py-2 text-sm border-r border-[rgba(224,224,224,1)]">
            {item.productName}
          </td>
          <td className="px-4 py-2 text-sm border-r w-40 border-[rgba(224,224,224,1)]">
            {item.unitName}
          </td>
          <td className="px-4 py-2 text-sm border-r w-48 border-[rgba(224,224,224,1)]">
            <TextField
              type="number"
              size="small"
              fullWidth
              inputProps={{ min: 0 }}
              value={item.quantity}
              onChange={(e) => handleQuantityChange(item.id, e.target.value)}
              disabled={mode !== MODE_EDIT}
              color="success"
              hiddenLabel
              placeholder="Số lượng"
              sx={{
                '& .MuiInputBase-root.Mui-disabled': {
                  bgcolor: '#eeeeee',
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none',
                  },
                },
              }}
            />
            {itemsErrors[item.id]?.quantityError && (
              <Typography color="red" className="text-xs mt-1">
                {itemsErrors[item.id].quantityError}
              </Typography>
            )}
          </td>
          <td className="px-4 py-2 text-sm border-r text-center border-[rgba(224,224,224,1)]">
            {item.exportedQuantity || 0}
          </td>
          <td className="px-4 py-2 text-sm border-r text-center border-[rgba(224,224,224,1)]">
            {item.pendingQuantity || 0}
          </td>
          {mode === MODE_DINHMUC && (
            <>
              <td className="px-4 py-2 text-sm border-r border-[rgba(224,224,224,1)]">
                {item.inStock || 0}
              </td>
              <td className="px-4 py-2 text-sm border-r border-[rgba(224,224,224,1)]">
                <TextField
                  type="number"
                  size="small"
                  fullWidth
                  slotProps={{
                    input: {
                      inputMode: "numeric",
                    }
                  }}
                  value={item.usedQuantity === 0 ? "" : item.usedQuantity}
                  onChange={(e) => handleUsedQuantityChange(item.id, e.target.value)}
                  color="success"
                  hiddenLabel
                  placeholder="0"
                />
              </td>
              <td className="px-4 py-2 text-sm border-r border-[rgba(224,224,224,1)]">
                {item.produceQuantity || 0}
              </td>
            </>
          )}
          {mode === MODE_EDIT && (
            <td className="px-4 py-2 w-24 text-sm text-center">
              <IconButton
                size="small"
                color="error"
                onClick={() => handleDeleteRow(item.id)}
              >
                <HighlightOffRounded />
              </IconButton>
            </td>
          )}
        </tr>
      ));
    }
  };

  useEffect(() => {
    if (mode === MODE_DINHMUC && showMaterialTable) {
      const recalcMaterialRequirements = async () => {
        const promises = items.map(async (item) => {
          if (item.productId && item.produceQuantity > 0) {
            try {
              const materials = await getProductMaterialsByProduct(item.productId);
              if (!materials || materials.length === 0) {
                setMaterialErrors((prev) => ({
                  ...prev,
                  [item.id]: `Mã SP ${item.productCode} chưa có định mức NVL`,
                }));
                return null;
              }
              return { produceQuantity: item.produceQuantity, materials };
            } catch (error) {
              console.error("Error fetching materials for product", item.productId, error);
              setMaterialErrors((prev) => ({
                ...prev,
                [item.id]: `Mã SP ${item.productCode} chưa có định mức NVL`,
              }));
              return null;
            }
          }
          return null;
        });

        const results = await Promise.all(promises);
        let aggregated = {};

        results.forEach((result) => {
          if (result && result.materials) {
            result.materials.forEach((mat) => {
              const requiredQty = mat.quantity * result.produceQuantity;
              if (aggregated[mat.materialCode]) {
                aggregated[mat.materialCode].requiredQuantity += requiredQty;
              } else {
                aggregated[mat.materialCode] = {
                  materialId: mat.materialId,
                  materialCode: mat.materialCode,
                  materialName: mat.materialName,
                  requiredQuantity: requiredQty,
                  unitName: mat.unitName,
                  totalInStock: 0,
                  quantityToBuy: 0,
                  receivedQuantity: 0,
                };
              }
            });
          }
        });

        const materialPromises = Object.values(aggregated).map(async (mat) => {
          try {
            const warehouses = await getTotalQuantityOfMaterial(mat.materialId);
            const totalInStock = warehouses.reduce((sum, w) => sum + (w.quantity || 0), 0);
            const quantityToBuy = Math.max(mat.requiredQuantity - totalInStock, 0);
            return {
              ...mat,
              totalInStock,
              quantityToBuy,
            };
          } catch (error) {
            console.error(`Lỗi khi lấy tồn kho cho NVL ${mat.materialCode}:`, error);
            return {
              ...mat,
              totalInStock: 0,
              quantityToBuy: mat.requiredQuantity,
            };
          }
        });

        const updatedMaterials = await Promise.all(materialPromises);
        setMaterialRequirements(updatedMaterials);
      };

      recalcMaterialRequirements();
    }
  }, [items, mode, showMaterialTable]);

  return (
    <div className="mb-8 flex flex-col gap-12" style={{ height: "calc(100vh - 180px)" }}>
      <Card className="bg-gray-50 p-7">
        <CardBody className="pb-2 bg-white rounded-xl">
          <PageHeader
            title={`Đơn hàng ${orderCode}`}
            addButtonLabel=""
            showAdd={false}
            showImport={false}
            showExport={false}
          />

          <div className="mb-4 flex border-b">
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              textColor="primary"
              indicatorColor="primary"
            >
              <Tab label="Thông tin đơn hàng" value="info" />
              <Tab label="Danh sách sản phẩm" value="products" />
            </Tabs>
          </div>

          {activeTab === "info" && (
            <div>
              <Typography variant="h6" className="flex items-center mb-4 text-black">
                <InformationCircleIcon className="h-5 w-5 mr-2" />
                Thông tin chung
              </Typography>
              <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-4">
                <div>
                  <Typography variant="medium" className="mb-1 text-black">Mã đơn</Typography>
                  <TextField
                    fullWidth
                    size="small"
                    color="success"
                    variant="outlined"
                    disabled
                    value={orderCode}
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
                  <Typography variant="medium" className="mb-1 text-black">Ngày lập phiếu</Typography>
                  <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
                    <style>
                      {`.MuiPickersCalendarHeader-label { text-transform: capitalize !important; }`}
                    </style>
                    <DatePicker
                      value={orderDate ? dayjs(orderDate) : null}
                      disabled={mode !== MODE_EDIT}
                      onChange={(newValue) => {
                        if (newValue) {
                          setOrderDate(newValue.format("YYYY-MM-DD"));
                        }
                      }}
                      format="DD/MM/YYYY"
                      dayOfWeekFormatter={(weekday) => `${weekday.format("dd")}`}
                      slotProps={{
                        textField: {
                          hiddenLabel: true,
                          fullWidth: true,
                          size: "small",
                          color: "success",
                        },
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
                      }}
                      sx={{
                        '& .MuiInputBase-root.Mui-disabled': {
                          bgcolor: '#eeeeee',
                          '& .MuiOutlinedInput-notchedOutline': {
                            border: 'none',
                          },
                        },
                      }}
                    />
                  </LocalizationProvider>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-4">
                <div>
                  <Typography variant="medium" className="mb-1 text-black">Trạng thái đơn hàng</Typography>
                  <TextField
                    fullWidth
                    size="small"
                    color="success"
                    variant="outlined"
                    disabled
                    value={originalData?.statusLabel || "Không rõ"}
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
              {originalData?.status === "CANCELLED" && (
                <div>
                  <Typography variant="medium" className="mb-1 text-black">Lý do huỷ đơn hàng</Typography>
                  <TextField
                    fullWidth
                    size="small"
                    color="success"
                    variant="outlined"
                    disabled
                    value={originalData?.rejectionReason?.trim() || "Không có"}
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
              )}
              <div className="mb-10">
                <Typography variant="medium" className="mb-1 text-black">Diễn giải nhập kho</Typography>
                <TextField
                  fullWidth
                  size="small"
                  hiddenLabel
                  multiline
                  rows={4}
                  color="success"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={mode !== MODE_EDIT}
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

              <Typography variant="h6" className="flex items-center mb-4 text-black">
                <IdentificationIcon className="h-5 w-5 mr-2" />
                Thông tin khách hàng
              </Typography>
              <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-4">
                <div>
                  <Typography variant="medium" className="mb-1 text-black">Mã khách hàng</Typography>
                  <Autocomplete
                    options={customers}
                    size="small"
                    getOptionLabel={(option) => `${option.code} - ${option.name}`}
                    value={customers.find(o => o.id === partnerId)}
                    onChange={(event, selected) => {
                      handleCustomerChange(selected);
                    }}
                    disabled={mode !== MODE_EDIT}
                    slotProps={{
                      paper: {
                        sx: {
                          maxHeight: 300,
                          overflowY: "auto",
                        },
                      },
                    }}
                    sx={{
                      '& .MuiInputBase-root.Mui-disabled': {
                        bgcolor: '#eeeeee',
                        '& .MuiOutlinedInput-notchedOutline': {
                          border: 'none',
                        },
                      },
                    }}
                    renderInput={(params) => (
                      <TextField
                        color="success"
                        hiddenLabel
                        {...params}
                        placeholder="Chọn khách hàng"
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              <IconButton
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsCreatePartnerPopupOpen(true);
                                }}
                                size="small"
                                disabled={mode !== MODE_EDIT}
                              >
                                <FaPlus fontSize="small" />
                              </IconButton>
                              {params.InputProps.endAdornment}
                            </>
                          )
                        }}
                      />
                    )}
                  />
                  {customerError && (
                    <Typography color="red" className="text-xs mt-1">
                      {customerError}
                    </Typography>
                  )}
                </div>
                <div>
                  <Typography variant="medium" className="mb-1 text-black">Tên khách hàng</Typography>
                  <TextField
                    fullWidth
                    size="small"
                    color="success"
                    variant="outlined"
                    disabled
                    value={customerName}
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
              <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-4">
                <div>
                  <Typography variant="medium" className="mb-1 text-black">Địa chỉ</Typography>
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
                  <Typography variant="medium" className="mb-1 text-black">Số điện thoại</Typography>
                  <TextField
                    fullWidth
                    size="small"
                    color="success"
                    variant="outlined"
                    disabled
                    value={phoneNumber}
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
              <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-4">
                <div>
                  <Typography variant="medium" className="mb-1 text-black">Người liên hệ</Typography>
                  <TextField
                    fullWidth
                    size="small"
                    color="success"
                    variant="outlined"
                    disabled
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
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
            </div>
          )}

          {activeTab === "products" && (
            <div className="mb-4">
              <div className="flex justify-between">
                <Typography variant="h6" className="flex items-center mb-4 text-black">
                  <ListBulletIcon className="h-5 w-5 mr-2" />
                  Danh sách sản phẩm
                </Typography>
                {mode === MODE_VIEW && (
                  <div className="flex justify-end mb-4">
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
                      onClick={handleXemDinhMuc}
                      className="flex items-center gap-2"
                    >
                      <FaEye className="h-3 w-3" /> Xem định mức
                    </MuiButton>
                  </div>
                )}
              </div>
              <div className="border border-gray-200 rounded overflow-x-auto border-[rgba(224,224,224,1)]">
                <table className="w-full text-left min-w-max border-collapse border-[rgba(224,224,224,1)]">
                  <thead className="bg-[#f5f5f5] border-b border-[rgba(224,224,224,1)]">
                    <tr>
                      <th className="px-4 py-2 text-sm font-medium text-[#000000DE] border-r border-[rgba(224,224,224,1)]">STT</th>
                      <th className="px-4 py-2 text-sm font-medium text-[#000000DE] border-r border-[rgba(224,224,224,1)]">Mã hàng</th>
                      <th className="px-4 py-2 text-sm font-medium text-[#000000DE] border-r border-[rgba(224,224,224,1)]">Tên hàng</th>
                      <th className="px-4 py-2 text-sm font-medium text-[#000000DE] border-r border-[rgba(224,224,224,1)]">Đơn vị</th>
                      <th className="px-4 py-2 text-sm font-medium text-[#000000DE] border-r border-[rgba(224,224,224,1)]">Số lượng</th>
                      {mode !== MODE_DINHMUC && (
                        <>
                          <th className="px-4 py-2 text-sm font-medium text-[#000000DE] border-r border-[rgba(224,224,224,1)]">SL đã xuất</th>
                          <th className="px-4 py-2 text-sm font-medium text-[#000000DE] border-r border-[rgba(224,224,224,1)]">SL còn lại</th>
                        </>
                      )}
                      {mode === MODE_DINHMUC && (
                        <>
                          <th className="px-4 py-2 text-sm font-medium text-[#000000DE] border-r border-[rgba(224,224,224,1)]">Tên kho</th>
                          <th className="px-4 py-2 text-sm font-medium text-[#000000DE] border-r border-[rgba(224,224,224,1)]">Tồn kho</th>
                          <th className="px-4 py-2 text-sm font-medium text-[#000000DE] border-r border-[rgba(224,224,224,1)]">SL muốn dùng</th>
                          <th className="px-4 py-2 text-sm font-medium text-[#000000DE] border-r border-[rgba(224,224,224,1)]">SL cần SX</th>
                        </>
                      )}
                      {mode === MODE_EDIT && activeTab === "products" && (
                        <th className="px-4 py-2 text-sm font-medium text-[#000000DE] border-r border-[rgba(224,224,224,1)]">Thao tác</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>{renderTableRows()}</tbody>
                </table>
              </div>

              {globalError && (
                <Typography color="red" className="text-sm mt-2">
                  {globalError}
                </Typography>
              )}
              {mode === MODE_EDIT && activeTab === "products" && (
                <div className="flex gap-2 my-4">
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
                      <span>Xoá hết dòng</span>
                    </div>
                  </MuiButton>
                </div>
              )}
              {mode === MODE_DINHMUC && showMaterialTable && (
                <div className="mt-4">
                  <Typography variant="h6" className="flex items-center mb-4 text-black">
                    <ListBulletIcon className="h-5 w-5 mr-2" />
                    Định mức nguyên vật liệu
                  </Typography>
                  <div className="border border-gray-200 rounded mb-4 overflow-x-auto border-[rgba(224,224,224,1)]">
                    <table className="w-full text-left min-w-max border-collapse border-[rgba(224,224,224,1)]">
                      <thead className="bg-[#f5f5f5] border-b border-[rgba(224,224,224,1)]">
                        <tr>
                          <th className="px-4 py-2 text-sm font-medium text-[#000000DE] border-r border-[rgba(224,224,224,1)]">STT</th>
                          <th className="px-4 py-2 text-sm font-medium text-[#000000DE] border-r border-[rgba(224,224,224,1)]">Mã NVL</th>
                          <th className="px-4 py-2 text-sm font-medium text-[#000000DE] border-r border-[rgba(224,224,224,1)]">Tên NVL</th>
                          <th className="px-4 py-2 text-sm font-medium text-[#000000DE] border-r border-[rgba(224,224,224,1)]">Số lượng</th>
                          <th className="px-4 py-2 text-sm font-medium text-[#000000DE] border-r border-[rgba(224,224,224,1)]">Đơn vị</th>
                          <th className="px-4 py-2 text-sm font-medium text-[#000000DE] border-r border-[rgba(224,224,224,1)]">Tổng tồn kho</th>
                          <th className="px-4 py-2 text-sm font-medium text-[#000000DE] border-r border-[rgba(224,224,224,1)]">Số lượng cần mua</th>
                        </tr>
                      </thead>
                      <tbody>
                        {materialRequirements.length > 0 ? (
                          materialRequirements.map((mat, index) => (
                            <tr key={index} className="border-b last:border-b-0 hover:bg-gray-50">
                              <td className="px-4 py-2 text-sm text-[#000000DE] border-r border-[rgba(224,224,224,1)]">{index + 1}</td>
                              <td className="px-4 py-2 text-sm text-[#000000DE] border-r border-[rgba(224,224,224,1)]">{mat.materialCode}</td>
                              <td className="px-4 py-2 text-sm text-[#000000DE] border-r border-[rgba(224,224,224,1)]">{mat.materialName}</td>
                              <td className="px-4 py-2 text-sm text-[#000000DE] border-r border-[rgba(224,224,224,1)]">{mat.requiredQuantity}</td>
                              <td className="px-4 py-2 text-sm text-[#000000DE] border-r border-[rgba(224,224,224,1)]">{mat.unitName}</td>
                              <td className="px-4 py-2 text-sm text-[#000000DE] border-r border-[rgba(224,224,224,1)]">{mat.totalInStock}</td>
                              <td className="px-4 py-2 text-sm text-[#000000DE] border-r border-[rgba(224,224,224,1)]">{mat.quantityToBuy}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="px-4 py-2 text-sm text-gray-500">
                              Không có nguyên vật liệu nào
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Divider />
            <div className="flex justify-between my-2">
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
                onClick={handleCancel}
                className="flex items-center gap-2"
              >
                <FaArrowLeft className="h-3 w-3" /> Quay lại
              </MuiButton>

              <div className="flex items-center gap-2">
                {mode === MODE_VIEW && originalData?.statusLabel !== "Đã huỷ" && activeTab === "info" && (
                  <MuiButton
                    size="medium"
                    color="error"
                    variant="outlined"
                    onClick={() => setShowCancelModal(true)}
                  >
                    Hủy đơn hàng
                  </MuiButton>
                )}

                {mode === MODE_VIEW && canCreatePurchaseRequestState && originalData?.status !== "CANCELLED" && (
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
                )}
              </div>

              {mode === MODE_EDIT && (
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
                    onClick={handleSaveOrder}
                  >
                    Lưu
                  </Button>
                </div>
              )}

              {canCreatePurchaseRequestState &&
                mode === MODE_DINHMUC &&
                originalData?.status !== "CANCELLED" &&
                originalData?.status === "PROCESSING" &&
                activeTab === "products" &&
                showMaterialTable && (
                  materialRequirements.every((mat) => mat.quantityToBuy === 0) ? (
                    <Button
                      size="lg"
                      color="white"
                      variant="text"
                      className="bg-[#0ab067] hover:bg-[#089456]/90 shadow-none text-white font-medium py-2 px-4 rounded-[4px] transition-all duration-200 ease-in-out"
                      ripple={true}
                      disabled={Object.keys(materialErrors).length > 0}
                      onClick={async () => {
                        try {
                          const usedProductsFromWarehouses = items.flatMap((item) =>
                            (item.inStock || [])
                              .filter((d) => d.usedQuantity > 0)
                              .map((d) => ({
                                productId: item.productId,
                                productCode: item.productCode,
                                productName: item.productName,
                                unitName: item.unitName,
                                quantity: d.usedQuantity,
                                warehouseId: d.warehouseId,
                                warehouseName: d.warehouseName,
                              }))
                          );

                          const usedMaterialsFromWarehouses = materialRequirements
                            .map((req) => ({
                              materialId: req.materialId,
                              quantity: req.requiredQuantity,
                            }))
                            .filter((entry) => entry.quantity > 0);

                          const payload = {
                            saleOrderId: orderId,
                            usedProductsFromWarehouses,
                            usedMaterialsFromWarehouses,
                          };

                          console.log("🔍 Gửi setPreparingStatus với payload:", payload);

                          await setPreparingStatus(payload);
                          alert("Đơn hàng đã được chuyển sang trạng thái 'Đang chuẩn bị'.");
                          navigate("/user/sale-orders");
                        } catch (err) {
                          console.error("Lỗi khi chuyển trạng thái đơn hàng:", err);
                          alert("Không thể chuyển trạng thái đơn hàng.");
                        }
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <FaCheck />
                        <span>Hoàn thành chuẩn bị vật tư</span>
                      </div>
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      color="white"
                      variant="text"
                      className="bg-[#0ab067] hover:bg-[#089456]/90 shadow-none text-white font-medium py-2 px-4 rounded-[4px] transition-all duration-200 ease-in-out"
                      ripple={true}
                      onClick={handleCreatePurchaseRequest}
                    >
                      <div className="flex items-center gap-2">
                        <FaCheck />
                        <span>Tạo yêu cầu mua vật tư</span>
                      </div>
                    </Button>
                  )
                )}
            </div>
          </div>
        </CardBody>
      </Card>

      {showCancelModal && (
        <CancelSaleOrderModal
          open={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          onConfirm={handleCancelSaleOrder}
        />
      )}

      {isCreatePartnerPopupOpen && (
        <ModalAddCustomer
          onClose={() => setIsCreatePartnerPopupOpen(false)}
          onSuccess={() => {
            setIsCreatePartnerPopupOpen(false);
            fetchCustomers();
          }}
        />
      )}

    </div>
  );
};

export default EditSaleOrderPage;