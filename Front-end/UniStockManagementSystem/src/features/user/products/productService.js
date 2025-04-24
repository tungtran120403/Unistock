import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/user`;

const authHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getAllProducts = async (page = 0, size = 10) => {
  try {
    const response = await axios.get(`${API_URL}/products`, {
      headers: authHeader(),
      params: {
        page: page,
        size: size,
      },
    });

    console.log("📌 [getAllProducts] API Response:", response.data);

    if (response.data && response.data.content) {
      return {
        products: response.data.content,
        totalPages: response.data.totalPages || 1,
        totalElements: response.data.totalElements || response.data.content.length,
      };
    } else {
      console.warn("⚠️ API không trả về dữ liệu hợp lệ!");
      return {
        products: [],
        totalPages: 1,
        totalElements: 0,
      };
    }
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách sản phẩm:", error.response?.data || error.message);
    throw error;
  }
};

export const getProductById = async (productId) => {
  try {
    const response = await axios.get(`${API_URL}/products/${productId}`, {
      headers: authHeader(),
    });
    console.log("📌 [getProductById] API Response:", response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Lỗi khi lấy sản phẩm có ID ${productId}:`, error.response?.data || error.message);
    throw error;
  }
};

export const createProduct = async (productData) => {
  try {
    const formData = new FormData();

    formData.append("productCode", productData.productCode.trim());
    formData.append("productName", productData.productName.trim());
    formData.append("description", productData.description?.trim() || "");
    formData.append("unitId", parseInt(productData.unitId) || "");
    formData.append("typeId", parseInt(productData.productTypeId) || "");
    formData.append("isProductionActive", productData.isProductionActive === true || productData.isProductionActive === "true");

    if (productData.image) {
      formData.append("image", productData.image);
    }

    formData.append("materials", JSON.stringify(productData.materials || []));

    const response = await axios.post(
      `${API_URL}/products/create`,
      formData,
      {
        headers: {
          ...authHeader(),
          "Content-Type": "multipart/form-data",
        },
      }
    );

    console.log("✅ [createProduct] API Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Lỗi khi tạo sản phẩm:", error.response?.data || error.message);
    throw error;
  }
};

export const updateProduct = async (productId, productData) => {
  try {
    const formData = new FormData();

    formData.append("productCode", productData.productCode?.trim() || "");
    formData.append("productName", productData.productName.trim());
    formData.append("description", productData.description?.trim() || "");
    formData.append("unitId", parseInt(productData.unitId) || "");
    formData.append("typeId", parseInt(productData.typeId) || "");
    formData.append("isProductionActive", productData.isProductionActive === true || productData.isProductionActive === "true");

    if (productData.image) {
      formData.append("image", productData.image);
    }

    const filteredMaterials = (productData.materials || []).map(material => ({
      materialId: material.materialId,
      quantity: material.quantity,
      materialCode: material.materialCode,
      materialName: material.materialName
    }));
    formData.append("materials", JSON.stringify(filteredMaterials));

    const response = await axios.put(
      `${API_URL}/products/${productId}`,
      formData,
      {
        headers: {
          ...authHeader(),
          "Content-Type": "multipart/form-data",
        },
      }
    );

    console.log("✅ [updateProduct] API Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật sản phẩm:", error.response?.data || error.message);
    throw error;
  }
};

export const toggleProductStatus = async (productId) => {
  try {
    const response = await axios.patch(
      `${API_URL}/products/${productId}/toggle-production`,
      {},
      { headers: authHeader() }
    );
    console.log("✅ [toggleProductStatus] API Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Lỗi khi thay đổi trạng thái sản phẩm:", error.response?.data || error.message);
    throw error;
  }
};


export const fetchProductTypes = async () => {
  try {
    const response = await axios.get(`${API_URL}/product-types`, {
      headers: authHeader()
    });

    if (response.data && response.data.content) {
      return response.data.content.filter(type => type.status === true);
    }

    if (Array.isArray(response.data)) {
      return response.data.filter(type => type.status === true);
    }

    console.warn("Unexpected response format:", response.data);
    return [];
  } catch (error) {
    console.error("Error fetching product types:", error);
    throw error;
  }
};

export const checkProductCodeExists = async (productCode, excludeId = null) => {
  try {
    const response = await axios.get(
      `${API_URL}/products/check-product-code/${productCode}`,
      { headers: authHeader(), params: { excludeId } }
    );
    console.log("📌 [checkProductCodeExists] API Response:", response.data);
    return response.data.exists;
  } catch (error) {
    console.error("❌ Lỗi kiểm tra mã sản phẩm:", error.response?.data || error.message);
    throw error;
  }
};

export const importExcel = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post(
      `${API_URL}/products/import`,
      formData,
      {
        headers: {
          ...authHeader(),
          "Content-Type": "multipart/form-data",
        },
      }
    );

    console.log("✅ [importExcel] Nhập dữ liệu thành công:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Lỗi khi nhập dữ liệu:", error.response?.data || error.message);
    throw new Error(error.response?.data || "Lỗi khi nhập dữ liệu từ file");
  }
};

export const exportExcel = async () => {
  try {
    const response = await axios.get(`${API_URL}/products/export`, {
      headers: authHeader(),
      responseType: "blob", // Nhận dữ liệu dưới dạng blob
    });
    console.log("✅ [exportExcel] Xuất file Excel thành công");
    return response.data; // Trả về blob
  } catch (error) {
    console.error("❌ Lỗi khi xuất Excel:", error.response?.data || error.message);
    throw error;
  }
};

export const previewImport = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post(
      `${API_URL}/products/preview-import`,
      formData,
      {
        headers: {
          ...authHeader(),
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data; // Mảng ProductPreviewDTO
  } catch (error) {
    console.error("❌ Lỗi khi kiểm tra file:", error.response?.data || error.message);
    throw error;
  }
};

export const downloadProductTemplate = async () => {
  const response = await axios.get(`${API_URL}/products/template`, {
    responseType: "blob", // để nhận dữ liệu nhị phân
    headers: authHeader(),
  });
  return response.data;
};
