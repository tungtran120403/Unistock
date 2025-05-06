import React, { useCallback, useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Typography,
  Button,
} from "@material-tailwind/react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  IconButton,
  TextField,
  Button as MuiButton,
  Paper,
  Box,
} from '@mui/material';
import ModeEditOutlineOutlinedIcon from '@mui/icons-material/ModeEditOutlineOutlined';
import SuccessAlert from "@/components/SuccessAlert";
import CircularProgress from '@mui/material/CircularProgress';
import useRole from "./useRole";
import PageHeader from '@/components/PageHeader';
import { PERMISSION_CATEGORIES, PERMISSION_LABELS } from './permissionConstants';

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

function syncRowHeights() {
  const rows = document.querySelectorAll('.sync-row');
  let maxHeight = 0;

  rows.forEach(row => {
    row.style.minHeight = 'auto'; // Reset chiều cao trước khi tính toán
    const height = row.getBoundingClientRect().height;
    if (height > maxHeight) maxHeight = height;
  });

  rows.forEach(row => {
    row.style.minHeight = `${maxHeight}px`;
  });
}

function RolePage() {
  const {
    roles,
    loading,
    error,
    errorRole,
    errorEditRole,
    setErrorEditRole,
    setErrorRole,
    handleAddRole,
    handleUpdateRole,
    handleToggleRoleStatus,
    updateRolePermissions,
  } = useRole();

  const [tempRoles, setTempRoles] = useState([]);
  const [editingRole, setEditingRole] = useState(null);
  const [editingRoleName, setEditingRoleName] = useState("");
  const [tempPermissions, setTempPermissions] = useState({});
  const [successAlert, setSuccessAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [dotCount, setDotCount] = useState(0);
  const [savingRoleId, setSavingRoleId] = useState(null);

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
      const success = await handleAddRole(newRole);
      if (success) {
        setTempRoles((prev) => prev.filter((r) => r.id !== tempRole.id));
        setAlertMessage('Tạo vai trò thành công!');
        setSuccessAlert(true);
      }
    } catch (err) {
      console.error("Lỗi khi lưu vai trò:", err);
    }
  };

  const handleEditRole = (role) => {
    setEditingRole(role.id);
    setEditingRoleName(role.name);
    setTempPermissions({ [role.id]: [...(role.permissionKeys || [])] });
  };

  const handleSaveEditRole = async (role) => {
    setSavingRoleId(role.id);
    const updatedPermissions = tempPermissions[role.id] || role.permissionKeys;
    const updatedRole = {
      ...role,
      name: editingRoleName,
      permissionKeys: updatedPermissions,
    };
    try {
      const success = await handleUpdateRole(role.id, updatedRole);
      if (success) {
        updateRolePermissions(role.id, updatedPermissions);
        setEditingRole(null);
        setEditingRoleName("");
        setTempPermissions((prev) => {
          const newTemp = { ...prev };
          delete newTemp[role.id];
          return newTemp;
        });
        setAlertMessage('Cập nhật vai trò thành công!');
        setSuccessAlert(true);
      }
      setSavingRoleId(null);
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật vai trò:", err);
    }
  };

  const handleCancelEditRole = () => {
    setEditingRole(null);
    setEditingRoleName("");
    setTempPermissions({});
  };

  const handleTogglePermission = useCallback(
    (role, permissionKey) => {
      if (role.isTemp || editingRole === role.id) {
        const currentPerms = role.isTemp
          ? role.permissionKeys || []
          : tempPermissions[role.id] || role.permissionKeys || [];
        const hasPerm = currentPerms.includes(permissionKey);

        let updatedKeys;
        if (hasPerm) {
          updatedKeys = currentPerms.filter((k) => k !== permissionKey);
        } else {
          updatedKeys = [...currentPerms, permissionKey];
          const catName = findCategoryByPermission(permissionKey);
          if (catName) {
            const [p1, p2] = PERMISSION_CATEGORIES[catName] || [];
            const other = p1 === permissionKey ? p2 : p1;
            if (other) {
              updatedKeys = updatedKeys.filter((k) => k !== other);
            }
          }
        }

        if (role.isTemp) {
          setTempRoles((prev) =>
            prev.map((r) =>
              r.id === role.id ? { ...r, permissionKeys: updatedKeys } : r
            )
          );
        } else {
          setTempPermissions((prev) => ({
            ...prev,
            [role.id]: updatedKeys,
          }));
        }
      }
    },
    [editingRole, tempPermissions]
  );

  const handleTempRoleNameChange = (tempId, value) => {
    setTempRoles((prev) =>
      prev.map((r) => (r.id === tempId ? { ...r, name: value } : r))
    );
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((prev) => (prev < 3 ? prev + 1 : 0));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Đồng bộ chiều cao hàng sau khi allRoles được định nghĩa
  useEffect(() => {
    syncRowHeights();
  }, [roles, tempRoles, editingRole, tempPermissions]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '60vh',
        }}
      >
        <CircularProgress size={50} thickness={4} sx={{ mb: 2, color: '#43a047' }} />
        <Typography variant="body1">
          Đang tải{'.'.repeat(dotCount)}
        </Typography>
      </Box>
    );
  }

  if (error) return <div className="text-red-500">Error: {error}</div>;

  const filteredRoles = roles.filter(
    (r) => r.name !== "ADMIN" && r.name !== "USER"
  );
  const allRoles = [...filteredRoles, ...tempRoles];

  return (
    <div className="mb-8 flex flex-col gap-12">
      <Card className="bg-gray-50 p-7 rounded-none shadow-none">
        <CardBody className="mb-3 bg-white rounded-xl">
          <PageHeader
            title="Danh sách Vai Trò"
            addButtonLabel="Thêm vai trò"
            onAdd={onAddTempRole}
            showImport={false}
            showExport={false}
          />
          <div style={{ display: 'flex' }}>
            {/* Cột cố định */}
            <TableContainer
              component={Paper}
              sx={{
                fontFamily: 'Roboto, sans-serif',
                overflowX: 'auto',
                '& .MuiTableRow-root': {
                  minHeight: '40px',
                },
                '& table': {
                  borderCollapse: 'separate', // sử dụng separate thay vì collapse
                  borderSpacing: 0, // không để khoảng cách
                  width: '100%',
                },
                '& th, & td': {
                  border: '0.5px solid rgba(224, 224, 224, 1)',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                },
                '& th': {
                  backgroundColor: '#f5f5f5',
                  fontWeight: 'semibold',
                },
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        position: 'sticky',
                        left: 0,
                        zIndex: 2,
                        backgroundColor: '#fff',
                        minWidth: 70,
                        fontSize: '14px',
                        textAlign: 'center',
                        borderRight: '1px solid rgba(224, 224, 224, 1)',
                      }}
                      rowSpan={2}
                    >
                      STT
                    </TableCell>
                    <TableCell
                      sx={{
                        position: 'sticky',
                        left: 70,
                        zIndex: 2,
                        backgroundColor: '#fff',
                        minWidth: 200,
                        fontSize: '14px',
                        textAlign: 'center',
                        borderLeft: 'none',
                        borderRight: '1px solid rgba(224, 224, 224, 1)',
                      }}
                      rowSpan={2}
                    >
                      Vai trò
                    </TableCell>
                    {Object.keys(PERMISSION_CATEGORIES).map((cat) => (
                      <TableCell
                        key={cat}
                        align="center"
                        colSpan={PERMISSION_CATEGORIES[cat].length}
                        sx={{ fontSize: '14px', padding: '10px' }}
                      >
                        {cat}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    {Object.values(PERMISSION_CATEGORIES)
                      .flat()
                      .map((perm) => (
                        <TableCell key={perm} align="center" sx={{ fontSize: '12px', padding: '8px' }}>
                          {PERMISSION_LABELS[perm] || perm}
                        </TableCell>
                      ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allRoles.length > 0 ? (
                    allRoles.map((role, idx) => {
                      const currentPerms = role.isTemp
                        ? role.permissionKeys || []
                        : tempPermissions[role.id] || role.permissionKeys || [];
                      return (
                        <React.Fragment key={role.id}>
                          <TableRow>
                            <TableCell sx={{ position: 'sticky', left: 0, zIndex: 1, backgroundColor: '#fff' }}>{idx + 1}</TableCell>
                            <TableCell sx={{ position: 'sticky', left: 70, zIndex: 1, backgroundColor: '#fff' }}>
                              <div className="flex items-center justify-between gap-2">
                                <div>
                                  {editingRole === role.id && !role.isTemp ? (
                                    <div>
                                      <TextField
                                        size="small"
                                        color="success"
                                        value={editingRoleName}
                                        onChange={(e) => {
                                          setEditingRoleName(e.target.value);
                                          setErrorEditRole(null);
                                        }}
                                        placeholder="Nhập tên vai trò"
                                        error={!!errorEditRole}
                                      />
                                      {errorEditRole && (
                                        <Typography color="red" className="text-sm text-left">
                                          {errorEditRole}
                                        </Typography>
                                      )}
                                    </div>
                                  ) : role.isTemp ? (
                                    <div>
                                      <TextField
                                        size="small"
                                        color="success"
                                        value={role.name}
                                        onChange={(e) => {
                                          handleTempRoleNameChange(role.id, e.target.value);
                                          setErrorRole(null);
                                        }}
                                        placeholder="Nhập tên vai trò"
                                        error={!!errorRole}
                                      />
                                      {errorRole && (
                                        <Typography color="red" className="text-sm text-left">
                                          {errorRole}
                                        </Typography>
                                      )}
                                    </div>
                                  ) : (
                                    <Typography variant="body2" fontWeight="bold">
                                      {role.name}
                                    </Typography>
                                  )}

                                </div>
                                {!role.isTemp && (
                                  <IconButton size="small" color="primary" onClick={() => handleEditRole(role)}>
                                    {savingRoleId === role.id ? (
                                      <CircularProgress size={18} color="success" />
                                    ) : (
                                      <ModeEditOutlineOutlinedIcon fontSize="small" />
                                    )}
                                  </IconButton>
                                )}
                              </div>
                            </TableCell>
                            {Object.values(PERMISSION_CATEGORIES)
                              .flat()
                              .map((perm) => (
                                <TableCell key={perm} align="center">
                                  <Checkbox
                                    checked={currentPerms.includes(perm)}
                                    onChange={() => handleTogglePermission(role, perm)}
                                    disabled={!role.isTemp && editingRole !== role.id}
                                    size="small"
                                    sx={{
                                      '&.Mui-checked:not(.Mui-disabled)': {
                                        color: '#0ab048',
                                      },
                                    }}
                                  />
                                </TableCell>
                              ))}
                          </TableRow>
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={Object.values(PERMISSION_CATEGORIES).flat().length + 2} align="center">
                        Không có dữ liệu
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
          {/* Phần nút Huỷ & Lưu luôn hiển thị đầy đủ và cố định dưới bảng */}
          {(editingRole || tempRoles.length > 0) && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <MuiButton
                size="medium"
                color="error"
                variant="outlined"
                onClick={() =>
                  editingRole
                    ? handleCancelEditRole()
                    : tempRoles.length > 0 && onRemoveTempRole(tempRoles[tempRoles.length - 1].id)
                }
              >
                Hủy
              </MuiButton>
              <Button
                size="lg"
                color="white"
                variant="text"
                className="bg-[#0ab067] hover:bg-[#089456]/90 shadow-none text-white font-medium py-2 px-4 ml-3 rounded-[4px] transition-all duration-200 ease-in-out"
                ripple={true}
                onClick={() => {
                  const role = editingRole
                    ? roles.find((r) => r.id === editingRole)
                    : tempRoles[tempRoles.length - 1];
                  if (role) {
                    role.isTemp ? onSaveTempRole(role) : handleSaveEditRole(role);
                  }
                }}
                disabled={savingRoleId !== null}
              >
                {savingRoleId ? (
                  'Đang lưu'
                ) : (
                  'Lưu'
                )}
              </Button>
            </div>
          )}

          <SuccessAlert
            open={successAlert}
            onClose={() => setSuccessAlert(false)}
            message={alertMessage}
          />
          {/* <div className="relative flex">
            <div className="flex flex-col sticky left-0 z-10 bg-white">
              <table className="table-auto">
                <thead>
                  <tr>
                    <th className="border-b border-blue-gray-50 py-3 px-5 text-left w-[68.5px]">
                      <Typography
                        variant="small"
                        className="text-[11px] font-bold uppercase text-blue-gray-400"
                      >
                        STT
                      </Typography>
                    </th>
                    <th className="border-b border-blue-gray-50 py-3 px-5 text-center min-w-[200px]">
                      <Typography
                        variant="small"
                        className="text-[11px] font-bold uppercase text-blue-gray-400"
                      >
                        Vai trò
                      </Typography>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {allRoles.length > 0 ? (
                    allRoles.map((role, idx) => {
                      const isLast = idx === allRoles.length - 1;
                      return (
                        <tr key={role.id} className="sync-row">
                          <td className={`${getTdClassName(isLast)} w-[68.5px]`}>
                            <Typography
                              variant="small"
                              color="blue-gray"
                              className="font-semibold text-left"
                            >
                              {idx + 1}
                            </Typography>
                          </td>
                          <td className={getTdClassName(isLast)}>
                            <div className="flex items-center justify-between min-w-[200px]">
                              <div className="flex flex-col gap-2">
                                {editingRole === role.id && !role.isTemp ? (
                                  <Input
                                    value={editingRoleName}
                                    onChange={(e) =>
                                      setEditingRoleName(e.target.value)
                                    }
                                    placeholder="Nhập tên vai trò"
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
                                  <div className="flex items-center gap-2"> */}
          {/* <Switch
                                      color="green"
                                      checked={!!role.active}
                                      onChange={() =>
                                        handleToggleRoleStatus(role.id, role.active)
                                      }
                                    /> */}
          {/* <Typography className="text-xs font-semibold text-blue-gray-600">
                                      {role.active ? "Hoạt động" : "Vô hiệu hóa"}
                                    </Typography> */}
          {/* </div>
                                )}
                              </div>
                              {!role.isTemp && (
                                <Button
                                  size="sm"
                                  className="p-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white items-center"
                                  onClick={() => handleEditRole(role)}
                                >
                                  <FaEdit />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr className="sync-row">
                      <td
                        colSpan={2}
                        className="border-b border-gray-200 px-3 py-4 text-center text-gray-500"
                      >
                        Không có dữ liệu
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex-1 overflow-x-auto">
              <table className="w-full min-w-[640px] table-auto">
                <thead>
                  <tr>
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
                      const currentPerms = role.isTemp
                        ? role.permissionKeys || []
                        : tempPermissions[role.id] || role.permissionKeys || [];
                      return (
                        <React.Fragment key={role.id}>
                          <tr className="sync-row">
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
                                        disabled={
                                          !role.isTemp && editingRole !== role.id
                                        }
                                      />
                                    </div>
                                  </td>
                                );
                              })}
                          </tr>
                          {(role.isTemp || editingRole === role.id) && (
                            <tr className="sync-row">
                              <td
                                colSpan={Object.values(PERMISSION_CATEGORIES).flat().length}
                              >
                                <div className="flex justify-end py-2 pr-5">
                                  <MuiButton
                                    size="medium"
                                    color="error"
                                    variant="outlined"
                                    onClick={() =>
                                      role.isTemp
                                        ? onRemoveTempRole(role.id)
                                        : handleCancelEditRole()
                                    }
                                  >
                                    Hủy
                                  </MuiButton>
                                  <Button
                                    size="lg"
                                    color="white"
                                    variant="text"
                                    className="bg-[#0ab067] hover:bg-[#089456]/90 shadow-none text-white font-medium py-2 px-4 ml-3 rounded-[4px] transition-all duration-200 ease-in-out"
                                    ripple={true}
                                    onClick={() =>
                                      role.isTemp
                                        ? onSaveTempRole(role)
                                        : handleSaveEditRole(role)
                                    }
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
                    <tr className="sync-row">
                      <td
                        colSpan={Object.values(PERMISSION_CATEGORIES).flat().length}
                        className="border-b border-gray-200 px-3 py-4 text-center text-gray-500"
                      >
                        Không có dữ liệu
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div> */}
        </CardBody>
      </Card>
    </div>
  );
}

export default RolePage;