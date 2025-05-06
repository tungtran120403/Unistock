import axios from "axios";

//báo cáo tồn kho
const API_URL_IN_RP = `${import.meta.env.VITE_API_URL}/user/inventory`;

const authHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getInventoryReportPaginated = ({
  page = 0,
  size = 20,
  search = "",
  warehouses = [],
  statuses = [],
  quantityFilters = {},
  itemType = "",
  productTypeIds = [],
  materialTypeIds = [],
}) => {
  const token = localStorage.getItem("token");
  const params = new URLSearchParams();

  params.append("page", page);
  params.append("size", size);
  if (search) params.append("search", search);

  warehouses.forEach((wh) => params.append("warehouseIds", wh.warehouseId));
  statuses.forEach((s) => params.append("statuses", s));
  if (itemType) params.append("itemType", itemType);
  productTypeIds.forEach((id) => params.append("productTypeIds", id));
  materialTypeIds.forEach((id) => params.append("materialTypeIds", id));

  const quantityFields = [
    { key: "itemAvailableQuantity", paramMin: "minAvailable", paramMax: "maxAvailable" },
    { key: "itemReservedQuantity", paramMin: "minReserved", paramMax: "maxReserved" },
    { key: "itemRealQuantity", paramMin: "minTotal", paramMax: "maxTotal" },
  ];

  quantityFields.forEach(({ key, paramMin, paramMax }) => {
    const filter = quantityFilters[key];
    if (filter) {
      if (filter.min !== null) params.append(paramMin, filter.min);
      if (filter.max !== null) params.append(paramMax, filter.max);
    }
  });

  return axios.get(`${API_URL_IN_RP}/report?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

//báo cáo nhập kho
const API_URL_GRN_RP = `${import.meta.env.VITE_API_URL}/user/receiptnote`;
export const getGoodReceiptReportPaginated = ({
  page = 0,
  size = 10,
  search = "",
  startDate = null,
  endDate = null,
  categories = [],
  warehouses = [],
  quantityFilters = {},
  itemType = ""
}) => {
  const token = localStorage.getItem("token");
  const params = new URLSearchParams();

  params.append("page", page);
  params.append("size", size);
  if (search) params.append("search", search);
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  categories.forEach((c) => params.append("categories", c));
  warehouses.forEach((wh) => params.append("warehouseIds", wh.warehouseId));
  if (itemType) params.append("itemType", itemType);
  const { min, max, type } = quantityFilters.itemQuantity || {};
  if (type === "lt" && max != null) params.append("maxQuantity", max);
  else if (type === "gt" && min != null) params.append("minQuantity", min);
  else if (type === "eq" && min != null) {
    params.append("minQuantity", min);
    params.append("maxQuantity", min);
  } else {
    if (min != null) params.append("minQuantity", min);
    if (max != null) params.append("maxQuantity", max);
  }

  return axios.get(`${API_URL_GRN_RP}/report?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

//báo cáo xuất kho
const API_URL_GIN_RP = `${import.meta.env.VITE_API_URL}/user/issuenote`;
export const getGoodIssueReportPaginated = ({
  page = 0,
  size = 10,
  search = "",
  startDate = null,
  endDate = null,
  categories = [],
  warehouses = [],
  quantityFilters = {},
  itemType = ""
}) => {
  const token = localStorage.getItem("token");
  const params = new URLSearchParams();

  params.append("page", page);
  params.append("size", size);
  if (search) params.append("search", search);
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  categories.forEach((c) => params.append("categories", c));
  warehouses.forEach((wh) => params.append("warehouseIds", wh.warehouseId));
  if (itemType) params.append("itemType", itemType);

  const { min, max, type } = quantityFilters.itemQuantity || {};
  if (type === "lt" && max != null) params.append("maxQuantity", max);
  else if (type === "gt" && min != null) params.append("minQuantity", min);
  else if (type === "eq" && min != null) {
    params.append("minQuantity", min);
    params.append("maxQuantity", min);
  } else {
    if (min != null) params.append("minQuantity", min);
    if (max != null) params.append("maxQuantity", max);
  }

  return axios.get(`${API_URL_GIN_RP}/report?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

//báo cáo xuất nhập tồn
const API_URL_SM_RP = `${import.meta.env.VITE_API_URL}/user/stockmovement`;
export const getStockMovementReportPaginated = async ({
  page = 0,
  size = 20,
  search = "",
  startDate = null,
  endDate = null,
  itemType = "",
  hasMovementOnly = null,
  // Thay đổi params
  minBegin = null,
  maxBegin = null,
  minIn = null,
  maxIn = null,
  minOut = null,
  maxOut = null,
  minEnd = null,
  maxEnd = null,
}) => {
  const token = localStorage.getItem("token");
  const params = new URLSearchParams();

  params.append("page", page);
  params.append("size", size);
  if (search) params.append("search", search);
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  if (itemType) params.append("itemType", itemType);
  if (hasMovementOnly !== null) params.append("hasMovementOnly", hasMovementOnly);

  // Thêm các params cho quantity filters
  if (minBegin !== null) params.append("minBegin", minBegin);
  if (maxBegin !== null) params.append("maxBegin", maxBegin);
  if (minIn !== null) params.append("minIn", minIn);
  if (maxIn !== null) params.append("maxIn", maxIn);
  if (minOut !== null) params.append("minOut", minOut);
  if (maxOut !== null) params.append("maxOut", maxOut);
  if (minEnd !== null) params.append("minEnd", minEnd);
  if (maxEnd !== null) params.append("maxEnd", maxEnd);

  try {
    const response = await axios.get(`${API_URL_SM_RP}/report?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error) {
    const errorMessage = error.response?.data?.message || "Không thể tải báo cáo xuất nhập tồn. Vui lòng thử lại.";
    throw new Error(errorMessage);
  }
};