import React, { useCallback, useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Checkbox,
  Input,
  Switch,
  Button,
} from "@material-tailwind/react";
import { Button as MuiButton } from "@mui/material";
import { FaPlus, FaEdit } from "react-icons/fa";
import useRole from "./useRole";
import PageHeader from '@/components/PageHeader';
import TableSearch from '@/components/TableSearch';

export const PERMISSION_CATEGORIES = {
  "Sản phẩm": ["viewProduct", "manageProduct"],
  "Đối tác": ["viewPartner", "managePartner"],
  "Kho": ["viewWarehouse", "manageWarehouse"],
  "Nguyên vật liệu": ["viewMaterial", "manageMaterial"],
  "Đơn hàng": ["viewSaleOrder", "manageSaleOrder"],
};

export const PERMISSION_LABELS = {
  viewProduct: "Xem",
  manageProduct: "Quản lý",
  viewPartner: "Xem",
  managePartner: "Quản lý",
  viewWarehouse: "Xem",
  manageWarehouse: "Quản lý",
  viewMaterial: "Xem",
  manageMaterial: "Quản lý",
  viewSaleOrder: "Xem",
  manageSaleOrder: "Quản lý",
};

function findCategoryByPermission(perm) {
  for (const [catName, perms] of Object.entries(PERMISSION_CATEGORIES)) {
    if (perms.includes(perm)) {
      return catName;
    }
  }
  return null;
}

function getTdClassName(isLast) {
  return `py-3 px-5 ${isLast ? "" : "border-b border-blue-gray-50"}`;
}

function RolePage() {
  const {
    roles,
    loading,
    error,
    handleAddRole,
    handleUpdateRole,
    handleToggleRoleStatus,
    updateRolePermissions,
  } = useRole();

  const [tempRoles, setTempRoles] = useState([]);
  const [editingRole, setEditingRole] = useState(null);
  const [editingRoleName, setEditingRoleName] = useState("");
  const [saveError, setSaveError] = useState(null);

  const onAddTempRole = () => {
    const newTempRole = {
      id: `temp-${Date.now()}`,
      name: "",
      permissionKeys: [],
      active: true,
      isTemp: true,
    };
    setTempRoles((prev) => [...prev, newTempRole]);
  };

  const onRemoveTempRole = (tempId) => {
    setTempRoles((prev) => prev.filter((role) => role.id !== tempId));
  };

  const onSaveTempRole = async (tempRole) => {
    const newRole = {
      name: tempRole.name,
      permissionKeys: tempRole.permissionKeys,
      active: true,
    };
    try {
      await handleAddRole(newRole);
      setTempRoles((prev) => prev.filter((r) => r.id !== tempRole.id));
      setSaveError(null);
    } catch (err) {
      console.error("Lỗi khi lưu vai trò:", err);
      setSaveError("Không thể lưu vai trò. Vui lòng thử lại.");
    }
  };

  const handleTogglePermission = useCallback(
    (role, permissionKey) => {
      const currentPerms = role.permissionKeys || [];
      const hasPerm = currentPerms.includes(permissionKey);

      let updatedKeys;
      if (hasPerm) {
        updatedKeys = currentPerms.filter((k) => k !== permissionKey);
      } else {
        updatedKeys = [...currentPerms, permissionKey];
        const catName = findCategoryByPermission(permissionKey);
        if (catName) {
          const [p1, p2] = PERMISSION_CATEGORIES[catName];
          const other = p1 === permissionKey ? p2 : p1;
          updatedKeys = updatedKeys.filter((k) => k !== other);
        }
      }

      const updatedRole = { ...role, permissionKeys: updatedKeys };

      if (role.isTemp) {
        setTempRoles((prev) =>
          prev.map((r) => (r.id === role.id ? updatedRole : r))
        );
      } else {
        updateRolePermissions(role.id, updatedKeys);
        handleUpdateRole(role.id, updatedRole).catch((err) => {
          updateRolePermissions(role.id, currentPerms);
          console.error("❌ Lỗi khi cập nhật permission:", err);
        });
      }
    },
    [handleUpdateRole, updateRolePermissions]
  );

  const handleTempRoleNameChange = (tempId, value) => {
    setTempRoles((prev) =>
      prev.map((r) => (r.id === tempId ? { ...r, name: value } : r))
    );
  };

  const handleBlurEditRole = (role) => {
    handleUpdateRole(role.id, { ...role, name: editingRoleName });
    setEditingRole(null);
  };

  if (loading) return <div>Loading ...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  const filteredRoles = roles.filter(
    (r) => r.name !== "ADMIN" && r.name !== "USER"
  );
  const allRoles = [...filteredRoles, ...tempRoles];

  return (
    <div className="mb-8 flex flex-col gap-12" style={{ height: 'calc(100vh-100px)' }}>
      <Card className="bg-gray-50 p-7 rounded-none shadow-none">
        <CardBody className="pb-2 bg-white rounded-xl overflow-x-auto">
          <PageHeader
            title="Danh sách Vai Trò"
            addButtonLabel="Thêm vai trò"
            onAdd={onAddTempRole}
            showImport={false}
            showExport={false}
          />
          {saveError && (
            <Typography color="red" className="mb-4 text-center">
              {saveError}
            </Typography>
          )}
          <table className="w-full min-w-[640px] table-auto overflow-x-auto">
            <thead>
              <tr>
                <th className="border-b border-blue-gray-50 py-3 px-5 text-center sticky left-0 bg-white z-10">
                  <Typography
                    variant="small"
                    className="text-[11px] font-bold uppercase text-blue-gray-400"
                  ></Typography>
                </th>
                <th className="border-b border-blue-gray-50 py-3 px-5 text-center sticky left-[68.5px] bg-white z-10">
                  <Typography
                    variant="small"
                    className="text-[11px] font-bold uppercase text-blue-gray-400"
                  >
                    Vai trò
                  </Typography>
                </th>
                {Object.keys(PERMISSION_CATEGORIES).map((cat) => (
                  <th
                    key={cat}
                    colSpan={PERMISSION_CATEGORIES[cat].length}
                    className="border-b border-blue-gray-50 py-3 px-5 text-center"
                  >
                    <Typography
                      variant="small"
                      className="text-[11px] font-bold uppercase text-blue-gray-400"
                    >
                      {cat}
                    </Typography>
                  </th>
                ))}
              </tr>
              <tr>
                <th className="border-b border-blue-gray-50 py-3 px-5 text-left sticky left-0 bg-white z-10">
                  <Typography
                    variant="small"
                    className="text-[11px] font-bold uppercase text-blue-gray-400"
                  >
                    STT
                  </Typography>
                </th>
                <th className="border-b border-blue-gray-50 py-3 px-5 text-center sticky left-[68.5px] bg-white z-10">
                  <Typography
                    variant="small"
                    className="text-[11px] font-bold uppercase text-blue-gray-400"
                  ></Typography>
                </th>
                {Object.values(PERMISSION_CATEGORIES)
                  .flat()
                  .map((perm) => (
                    <th
                      key={perm}
                      className="border-b border-blue-gray-50 py-3 px-5 text-center"
                    >
                      <Typography
                        variant="small"
                        className="text-[11px] font-bold uppercase text-blue-gray-400"
                      >
                        {PERMISSION_LABELS[perm] || perm}
                      </Typography>
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {allRoles.length > 0 ? (
                allRoles.map((role, idx) => {
                  const isLast = idx === allRoles.length - 1;
                  const currentPerms = role.permissionKeys || [];

                  return (
                    <React.Fragment key={role.id}>
                      <tr>
                        <td className={`${getTdClassName(isLast)} sticky left-0 bg-white z-10`}>
                          <Typography
                            variant="small"
                            color="blue-gray"
                            className="font-semibold text-left"
                          >
                            {idx + 1}
                          </Typography>
                        </td>
                        <td className={`${getTdClassName(isLast)} sticky left-[68.5px] bg-white z-10`}>
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-2 min-w-[200px]">
                              {editingRole === role.id && !role.isTemp ? (
                                <Input
                                  value={editingRoleName}
                                  onChange={(e) =>
                                    setEditingRoleName(e.target.value)
                                  }
                                  onBlur={() => handleBlurEditRole(role)}
                                />
                              ) : role.isTemp ? (
                                <Input
                                  value={role.name}
                                  onChange={(e) =>
                                    handleTempRoleNameChange(role.id, e.target.value)
                                  }
                                  placeholder="Nhập tên vai trò"
                                />
                              ) : (
                                <Typography
                                  variant="small"
                                  color="blue-gray"
                                  className="font-semibold"
                                >
                                  {role.name}
                                </Typography>
                              )}
                              {role.active !== undefined && !role.isTemp && (
                                <div className="flex items-center gap-2">
                                  <Switch
                                    color="green"
                                    checked={!!role.active}
                                    onChange={() =>
                                      handleToggleRoleStatus(role.id, role.active)
                                    }
                                  />
                                  <Typography className="text-xs font-semibold text-blue-gray-600">
                                    {role.active ? "Hoạt động" : "Vô hiệu hóa"}
                                  </Typography>
                                </div>
                              )}
                            </div>
                            {!role.isTemp && (
                              <Button
                                size="sm"
                                className="p-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white items-center"
                                onClick={() => {
                                  setEditingRole(role.id);
                                  setEditingRoleName(role.name);
                                }}
                              >
                                <FaEdit />
                              </Button>
                            )}
                          </div>
                        </td>
                        {Object.values(PERMISSION_CATEGORIES)
                          .flat()
                          .map((perm) => {
                            const checked = currentPerms.includes(perm);
                            return (
                              <td key={perm} className={getTdClassName(isLast)}>
                                <div className="flex items-center justify-center">
                                  <Checkbox
                                    checked={checked}
                                    onChange={() =>
                                      handleTogglePermission(role, perm)
                                    }
                                  />
                                </div>
                              </td>
                            );
                          })}
                      </tr>
                      {role.isTemp && (
                        <tr>
                          <td
                            colSpan={
                              2 + Object.values(PERMISSION_CATEGORIES).flat().length
                            }
                          >
                            <div className="flex justify-end py-2 pr-5">
                              <MuiButton
                                size="medium"
                                color="error"
                                variant="outlined"
                                onClick={() => onRemoveTempRole(role.id)}
                              >
                                Hủy
                              </MuiButton>
                              <Button
                                size="lg"
                                color="white"
                                variant="text"
                                className="bg-[#0ab067] hover:bg-[#089456]/90 shadow-none text-white font-medium py-2 px-4 ml-3 rounded-[4px] transition-all duration-200 ease-in-out"
                                ripple={true}
                                onClick={() => onSaveTempRole(role)}
                              >
                                Lưu
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={2 + Object.values(PERMISSION_CATEGORIES).flat().length}
                    className="border-b border-gray-200 px-3 py-4 text-center text-gray-500"
                  >
                    Không có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}

export default RolePage;