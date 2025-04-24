import React, { useState, useEffect } from "react";
import { TextField, Autocomplete, IconButton } from '@mui/material';

// Hàm kiểm tra số lượng nhập hợp lệ
const isValidQuantity = (inputQty, orderedQty, receivedQty) => {
  const remaining = orderedQty - receivedQty;
  if (remaining <= 0) return false; // Đã nhập đủ hoặc dư
  const maxAllowed = Math.floor(remaining * 1.01);
  const qty = parseInt(inputQty, 10) || 0;
  return qty >= 1 && qty <= maxAllowed;
};

const ProductRow = ({ item, index, warehouses, defaultWarehouseCode, currentPage, pageSize, onDataChange }) => {
  const [warehouse, setWarehouse] = useState(defaultWarehouseCode || '');
  const [quantity, setQuantity] = useState('');
  const [quantityError, setQuantityError] = useState('');
  const [remainingQuantity, setRemainingQuantity] = useState(0);

  useEffect(() => {
    if (item.quantity !== undefined && item.quantity !== null) {
      setQuantity(item.quantity.toString());
    }
  }, [item.quantity]);


  useEffect(() => {
    setWarehouse(defaultWarehouseCode);
  }, [defaultWarehouseCode]);

  const updateRemainingQuantity = (inputQty) => {
    const numInputQty = parseInt(inputQty, 10) || 0;
    const remaining = Math.max(0, item.orderedQuantity - item.receivedQuantity - numInputQty);
    setRemainingQuantity(remaining);
    return remaining;
  };

  const handleWarehouseChange = (value) => {
    setWarehouse(value);
    const warehouseObj = warehouses.find(w => w.warehouseCode === value);
    const warehouseId = warehouseObj ? warehouseObj.warehouseId : null;

    const itemKey = item.materialId || item.productId;
    onDataChange(itemKey, {
      warehouse: value,
      warehouseId,
      quantity,
      orderedQuantity: item.orderedQuantity,
      receivedQuantity: item.receivedQuantity,
      remainingQuantity,
      error: quantityError
    });
  };

  const handleQuantityChange = (e) => {
    const value = e.target.value;

    if (value === '' || /^\d+$/.test(value)) {
      setQuantity(value);
      const ordered = item.orderedQuantity || 0;
      const received = item.receivedQuantity || 0;
      const remaining = ordered - received;

      let error = '';
      if (remaining <= 0) {
        error = 'Đã nhập đủ số lượng';
      } else if (value === '') {
        error = 'Số lượng nhập không được để trống';
      } else if (!isValidQuantity(value, ordered, received)) {
        const max = Math.floor((ordered - received) * 1.01);
        error = `Số lượng phải từ 1 đến tối đa ${max}`;
      }

      setQuantityError(error);
      const remainingQty = updateRemainingQuantity(value);

      const itemKey = item.materialId || item.productId;
      const warehouseObj = warehouses.find(w => w.warehouseCode === warehouse);
      const warehouseId = warehouseObj ? warehouseObj.warehouseId : null;

      onDataChange(itemKey, {
        warehouse,
        warehouseId,
        quantity: value,
        orderedQuantity: ordered,
        receivedQuantity: received,
        remainingQuantity: remainingQty,
        error
      });
    }
  };

  const isFullyReceived = (item.orderedQuantity - item.receivedQuantity) <= 0;

  return (
    <tr className="border-b last:border-b-0 border-[rgba(224,224,224,1)]">
      <td className="px-2 py-2 text-sm text-center text-[#000000DE] w-20 border-r border-[rgba(224,224,224,1)]">{currentPage * pageSize + index + 1}</td>
      <td className="px-2 py-2 text-sm w-36 border-r text-[#000000DE] border-[rgba(224,224,224,1)]">{item.materialCode || item.productCode}</td>
      <td className="px-2 py-2 text-sm w-72 border-r text-[#000000DE] border-[rgba(224,224,224,1)]">{item.materialName || item.productName}</td>
      <td className="px-2 py-2 text-sm w-36 border-r text-[#000000DE] border-[rgba(224,224,224,1)]">{item.unit}</td>

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
              value={
                warehouses.find(w => w.warehouseCode === warehouse) || null
              }
              onChange={(event, selected) =>
                handleWarehouseChange(selected?.warehouseCode || '')
              }
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
                  placeholder="Chọn kho nhập"
                />
              )}
            />
          </td>
          <td className="px-2 py-2 text-sm text-center text-[#000000DE] w-fit border-r border-[rgba(224,224,224,1)]">{item.orderedQuantity}</td>
          <td className="px-2 py-2 text-sm text-center text-[#000000DE] w-fit border-r border-[rgba(224,224,224,1)]">{item.receivedQuantity}</td>
          <td className="px-2 py-2 text-sm text-center text-[#000000DE] w-fit border-r border-[rgba(224,224,224,1)]">{remainingQuantity}</td>
          <td className="px-2 py-2 text-sm text-center text-[#000000DE] w-40 border-r border-[rgba(224,224,224,1)]">
            <div>
              <TextField
                type="number"
                size="small"
                fullWidth
                value={quantity}
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
