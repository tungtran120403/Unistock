import { useState, useEffect, useCallback } from "react";
import {
  getAllRoles,
  getAllPermissions,
  getRolePermissions,
  updateRole,
  toggleRoleStatus,
  deleteRole,
  addRole,
} from "./roleService";

const API_TO_FE_KEY   = {
  checkProductCode: "manageProduct",
  getProductById: "manageProduct",
  importProducts: "manageProduct",
  updateOrder: "manageSaleOrder",
  createOrder: "manageSaleOrder",
  getOrderDetailPopup: "viewSaleOrder",
  getAllOrders: "viewSaleOrder",
  getOrderById: "viewSaleOrder",
};

const useRole = () => {
  const [roles, setRoles] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const rolesData = await getAllRoles();
        setRoles(rolesData);

        const permsData = await getAllPermissions();
        setAllPermissions(permsData);

        console.log("✅ [useRole] roles + allPermissions:", rolesData, permsData);

        await Promise.all(
          rolesData.map(async (role) => {
            const rolePerms = await getRolePermissions(role.id);
            const feKeys = new Set();
            rolePerms.permissions.forEach((p) => {
              const mappedKey = API_TO_FE_KEY[p.name];
              if (mappedKey) feKeys.add(mappedKey);
            });
            setRoles((prev) =>
              prev.map((r) =>
                r.id === role.id ? { ...r, permissionKeys: Array.from(feKeys) } : r
              )
            );
          })
        );
      } catch (err) {
        console.error("🚨 [useRole] Lỗi khi tải:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const fetchRolePermissions = useCallback(async (roleId) => {
    try {
      const rolePerms = await getRolePermissions(roleId);
      const feKeys = new Set();
      rolePerms.permissions.forEach((p) => {
        const mappedKey = API_TO_FE_KEY[p.name];
        if (mappedKey) feKeys.add(mappedKey);
      });

      const updatedKeys = Array.from(feKeys);
      setRoles((prev) =>
        prev.map((r) =>
          r.id === roleId ? { ...r, permissionKeys: updatedKeys } : r
        )
      );
      setRolePermissions(updatedKeys);
      console.log(`✅ [useRole] Permissions cho Role ID ${roleId}:`, updatedKeys);
    } catch (err) {
      console.error("❌ [useRole] Lỗi fetchRolePermissions:", err);
      setRolePermissions([]);
    }
  }, []);

  const handleSelectRole = useCallback(
    (role) => {
      setSelectedRole(role);
      fetchRolePermissions(role.id);
    },
    [fetchRolePermissions]
  );

  const handleAddRole = useCallback(async (role) => {
    try {
      const newRole = await addRole(role);
      if (newRole) {
        setRoles((prev) => [...prev, { ...newRole, permissionKeys: role.permissionKeys }]);
      }
    } catch (err) {
      console.error("❌ [useRole] Lỗi khi add Role:", err);
      throw err;
    }
  }, []);

  const handleUpdateRole = useCallback(async (id, updatedRole) => {
    try {
      const updated = await updateRole(id, updatedRole);
      if (updated) {
        setRoles((prev) =>
          prev.map((r) =>
            r.id === id
              ? { ...r, ...updated, permissionKeys: updatedRole.permissionKeys }
              : r
          )
        );
        console.log("✅ [useRole] Role updated:", updated);
      }
    } catch (err) {
      console.error("❌ [useRole] Lỗi khi updateRole:", err);
      throw err;
    }
  }, []);

  const updateRolePermissions = useCallback((roleId, permissionKeys) => {
    setRoles((prev) =>
      prev.map((r) =>
        r.id === roleId ? { ...r, permissionKeys } : r
      )
    );
  }, []);

  const handleToggleRoleStatus = useCallback(async (id, currentStatus) => {
    try {
      const updated = await toggleRoleStatus(id, !currentStatus);
      if (updated) {
        setRoles((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, active: !currentStatus } : r
          )
        );
      }
    } catch (err) {
      console.error("❌ [useRole] Lỗi toggle status:", err);
    }
  }, []);

  const handleDeleteRole = useCallback(async (id) => {
    try {
      const success = await deleteRole(id);
      if (success) {
        setRoles((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err) {
      console.error("❌ [useRole] Lỗi deleteRole:", err);
    }
  }, []);

  return {
    roles,
    allPermissions,
    rolePermissions,
    selectedRole,
    loading,
    error,
    handleSelectRole,
    handleAddRole,
    handleUpdateRole,
    handleToggleRoleStatus,
    handleDeleteRole,
    fetchRolePermissions,
    updateRolePermissions, // Đảm bảo hàm này được trả về
  };
};

export default useRole;