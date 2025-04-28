import React, { useState, useEffect } from "react";
import { TextField, Autocomplete, IconButton } from '@mui/material';

// Hàm kiểm tra số lượng nhập hợp lệ
const isValidQuantity = (inputQty, orderedQty, receivedQty) => {
  const remaining = orderedQty - receivedQty;
  if (remaining <= 0) return false; // Đã nhập đủ hoặc dư
  const maxAllowed = Math.floor(remaining * 1.01);
  const qty = parseInt(inputQty, 10) || 0;
  return qty >= 0 && qty <= maxAllowed; // Cho phép nhập 0
};

const ProductRow = ({ item, index, warehouses, defaultWarehouseCode, currentPage, pageSize, onDataChange }) => {
  const [warehouse, setWarehouse] = useState(defaultWarehouseCode || '');
  const [enteredQuantity, setEnteredQuantity] = useState('');
  const [quantityError, setQuantityError] = useState('');
  const [remainingQuantity, setRemainingQuantity] = useState(0);
  const [warehouseError, setWarehouseError] = useState('');

  useEffect(() => {
    const ordered = item.orderedQuantity ?? item.quantity ?? 0;
    const received = item.receivedQuantity ?? 0;
    const defaultEntered = Math.max(ordered - received, 0);

    if (item.enteredQuantity !== undefined && item.enteredQuantity !== null) {
      setEnteredQuantity(item.enteredQuantity.toString());
    } else {
      setEnteredQuantity(defaultEntered.toString());
    }
  }, [item.enteredQuantity, item.orderedQuantity, item.quantity, item.receivedQuantity]);

  useEffect(() => {
    const ordered = item.orderedQuantity ?? item.quantity ?? 0;
    const received = item.receivedQuantity ?? 0;
    const remaining = ordered - received;
    setRemainingQuantity(remaining > 0 ? remaining : 0);
  }, [item.orderedQuantity, item.quantity, item.receivedQuantity]);

  useEffect(() => {
    setWarehouse(defaultWarehouseCode || '');
  }, [defaultWarehouseCode]);

  const handleWarehouseChange = (value) => {
    setWarehouse(value);

    const warehouseObj = warehouses.find(w => w.warehouseCode === value);
    const warehouseId = warehouseObj ? warehouseObj.warehouseId : null;
    const itemKey = item.materialId || item.productId;

    const warehouseErrorMessage = !value ? "Vui lòng chọn kho nhập!" : "";
    setWarehouseError(warehouseErrorMessage);

    onDataChange(itemKey, {
      warehouse: value,
      warehouseId,
      enteredQuantity: parseInt(enteredQuantity, 10) || 0,
      orderedQuantity: item.orderedQuantity,
      receivedQuantity: item.receivedQuantity,
      remainingQuantity,
      warehouseError: warehouseErrorMessage,
      error: quantityError
    });
  };

  const handleQuantityChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      const entered = value === '' ? '0' : value;
      setEnteredQuantity(entered);
      const ordered = item.orderedQuantity ?? item.quantity ?? 0;
      const received = item.receivedQuantity ?? 0;
      const enteredNum = parseInt(entered, 10) || 0;
      let error = '';

      if (enteredNum < 0) {
        error = 'Số lượng không được âm!';
      } else if (enteredNum > (ordered - received)) {
        error = `Số lượng phải từ 0 đến ${ordered - received}`;
      }
      setQuantityError(error);

      const itemKey = item.materialId || item.productId;
      const warehouseObj = warehouses.find(w => w.warehouseCode === warehouse);
      const warehouseId = warehouseObj ? warehouseObj.warehouseId : null;

      onDataChange(itemKey, {
        warehouse,
        warehouseId,
        enteredQuantity: enteredNum,
        orderedQuantity: ordered,
        receivedQuantity: received,
        remainingQuantity: ordered - received,
        warehouseError: !warehouse ? "Vui lòng chọn kho nhập!" : "",
        error
      });
    } else {
      setQuantityError('Số lượng phải lớn hơn 0!');
    }
  };

  const isFullyReceived = (item.orderedQuantity - item.receivedQuantity) <= 0;

  return (
    <tr className="border-b last:border-b-0 border-[rgba(224,224,224,1)]">
      <td className="px-2 py-2 text-sm text-center text-[#000000DE] w-20 border-r border-[rgba(224,224,224,1)]">{currentPage * pageSize + index + 1}</td>
      <td className="px-2 py-2 text-sm w-36 border-r text-[#000000DE] border-[rgba(224,224,224,1)]">{item.materialCode || item.productCode}</td>
      <td className="px-2 py-2 text-sm w-72 border-r text-[#000000DE] border-[rgba(224,224,224,1)]">{item.materialName || item.productName}</td>
      <td className="px-2 py-2 text-sm w-36 border-r text-[#000000DE] border-[rgba(224,224,224,1)]">{item.unitName || item.unit}</td>

      {isFullyReceived ? (
        <>
          <td className="px-2 py-2 text-sm text-center text-gray-500 border-r border-[rgba(224,224,224,1)]" colSpan={2}>
            Đã nhập đủ
          </td>
          <td className="px-2 py-2 text-sm text-center text-[#000000DE] w-fit border-r border-[rgba(224,224,224,1)]">{item.receivedQuantity}</td>
          <td className="px-2 py-2 text-sm text-center text-[#000000DE] w-fit border-r border-[rgba(224,224,224,1)]">0</td>
        </>
      ) : (
        <>
          <td className="px-2 py-2 text-sm text-[#000000DE] w-60 border-r border-[rgba(224,224,224,1)]">
            <Autocomplete
              options={warehouses}
              noOptionsText="Không có dữ liệu"
              size="small"
              getOptionLabel={(option) => `${option.warehouseCode} - ${option.warehouseName}`}
              value={warehouses.find(w => w.warehouseCode === warehouse) || null}
              onChange={(event, selected) => handleWarehouseChange(selected?.warehouseCode || '')}
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
                <div>
                  <TextField
                    {...params}
                    color="success"
                    hiddenLabel
                    placeholder="Chọn kho nhập"
                    error={!!warehouseError}
                  />
                  {warehouseError && (
                    <p className="text-red-500 text-xs mt-1">{warehouseError}</p>
                  )}
                </div>
              )}
            />
          </td>
          <td className="px-2 py-2 text-sm text-center text-[#000000DE] w-fit border-r border-[rgba(224,224,224,1)]">{item.orderedQuantity ?? 0}</td>
          <td className="px-2 py-2 text-sm text-center text-[#000000DE] w-fit border-r border-[rgba(224,224,224,1)]">{item.receivedQuantity ?? 0}</td>
          <td className="px-2 py-2 text-sm text-center text-[#000000DE] w-fit border-r border-[rgba(224,224,224,1)]">{remainingQuantity}</td>
          <td className="px-2 py-2 text-sm text-[#000000DE] w-40 border-r border-[rgba(224,224,224,1)]">
            <div>
              <TextField
                type="number"
                size="small"
                fullWidth
                value={enteredQuantity}
                onChange={handleQuantityChange}
                slotProps={{
                  input: {
                    inputMode: "numeric",
                  }
                }}
                color="success"
                hiddenLabel
                placeholder="0"
              />
              {quantityError && (
                <p className="text-red-500 text-xs mt-1">{quantityError}</p>
              )}
            </div>
          </td>
        </>
      )}
    </tr>
  );
};

export default ProductRow;