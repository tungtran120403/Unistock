package vn.unistock.unistockmanagementsystem.features.admin.permission;

import java.util.*;

public class PermissionHierarchy {

    public static final Map<String, List<String>> PERMISSION_MAP = new HashMap<>();

    static {
        PERMISSION_MAP.put("viewProduct", List.of(
                "getAllProducts",
                "getProductById"
        ));
        // manageProduct = bao gồm mọi API của "Sản phẩm" (kể cả xem)
        PERMISSION_MAP.put("manageProduct", List.of(
                "getAllProducts",
                "getProductById",
                "updateProduct",
                "checkProductCode",
                "toggleProductionStatus",
                "importProducts",
                "createProduct",
                "getAllProductTypes"
        ));

        // ======================
        // 2) ĐỐI TÁC
        // ======================
        PERMISSION_MAP.put("viewPartner", List.of(
                "getAllPartners",
                "getPartnerCode",
                "getPartnersByType"
        ));
        PERMISSION_MAP.put("managePartner", List.of(
                // Gồm quyền xem:
                "getAllPartners",
                "getPartnerCode",
                "getPartnersByType",
                // Thêm quyền quản lý (tạo, sửa, ...):
                "createPartner",
                "createPartnerType",
                "updatePartnerType",
                "updatedPartnerTypeStatus"
        ));

        // ======================
        // 3) KHO
        // ======================
        PERMISSION_MAP.put("viewWarehouse", List.of(
                "getAllWarehouses",
                "getWarehouseById"
        ));
        PERMISSION_MAP.put("manageWarehouse", List.of(
                // Gồm quyền xem:
                "getAllWarehouses",
                "getWarehouseById",
                // Thêm quyền quản lý:
                "addWarehouse",
                "updateWarehouse",
                "updateWarehouseStatus"
        ));

        // ======================
        // 4) NGUYÊN VẬT LIỆU
        // ======================
        PERMISSION_MAP.put("viewMaterial", List.of(
                "getAllMaterials",
                "getMaterialById",
                // Nếu muốn “xem” luôn cả loại vật liệu:
                "getAllMaterialTypes",
                "getMaterialTypeById"
        ));
        PERMISSION_MAP.put("manageMaterial", List.of(
                // Gồm quyền xem:
                "getAllMaterials",
                "getMaterialById",
                "getAllMaterialTypes",
                "getMaterialTypeById",
                // Thêm quyền quản lý:
                "createMaterial",
                "updateMaterial",
                "toggleUsingStatus",
                "createMaterialType",
                "updateMaterialType",
                "toggleStatus"
        ));

        // ======================
        // 5) ĐƠN HÀNG
        // ======================
        PERMISSION_MAP.put("viewSaleOrder", List.of(
                "getAllOrders",
                "getOrderById",
                "getOrderDetailPopup"
        ));
        PERMISSION_MAP.put("manageSaleOrder", List.of(
                "getAllOrders",
                "getOrderById",
                "getOrderDetailPopup",
                "createOrder",
                "updateOrder",
                "deleteOrder"
        ));


    }

    public static Set<String> expandPermissions(List<String> clientKeys) {
        Set<String> finalKeys = new HashSet<>(clientKeys);
        for (String mainKey : clientKeys) {
            List<String> subKeys = PERMISSION_MAP.get(mainKey);
            if (subKeys != null && !subKeys.isEmpty()) {
                finalKeys.addAll(subKeys);
            }
        }
        return finalKeys;
    }
}
