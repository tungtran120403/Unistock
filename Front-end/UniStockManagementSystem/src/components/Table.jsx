import * as React from 'react';
import { DataGrid, GridCellModes } from '@mui/x-data-grid';
import { Stack, Button } from '@mui/material';

const SingleClickEditing = ({ data, columnsConfig, enableSelection, columnVisibilityModel, onColumnVisibilityModelChange, headerHeight }) => {
    const [cellModesModel, setCellModesModel] = React.useState({});
    const [selectedRows, setSelectedRows] = React.useState([]);

    const columns = columnsConfig.map(column => ({
        field: column.field,
        headerName: column.headerName,
        minWidth: column.minWidth,
        flex: column.width ? undefined : 1,
        editable: column.editable,
        renderCell: column.renderCell || ((params) => params.value),
        filterable: column.filterable,
    }));

    const rows = data.map((row, index) => ({ id: index, ...row }));

    const handleCellClick = React.useCallback((params, event) => {
        if (!params.isEditable) return;
        if (event.target.nodeType === 1 && !event.currentTarget.contains(event.target)) return;

        setCellModesModel((prevModel) => {
            return {
                ...Object.keys(prevModel).reduce(
                    (acc, id) => ({
                        ...acc,
                        [id]: Object.keys(prevModel[id]).reduce(
                            (acc2, field) => ({ ...acc2, [field]: { mode: GridCellModes.View } }),
                            {}
                        ),
                    }),
                    {}
                ),
                [params.id]: {
                    ...Object.keys(prevModel[params.id] || {}).reduce(
                        (acc, field) => ({ ...acc, [field]: { mode: GridCellModes.View } }),
                        {}
                    ),
                    [params.field]: { mode: GridCellModes.Edit },
                },
            };
        });
    }, []);

    const handleCellModesModelChange = React.useCallback((newModel) => {
        setCellModesModel(newModel);
    }, []);

    return (
        <div style={{ height: '100%', width: '100%' }}>
            <DataGrid
                rows={rows}
                columns={columns}
                cellModesModel={cellModesModel}
                onCellModesModelChange={handleCellModesModelChange}
                onCellClick={handleCellClick}
                columnVisibilityModel={columnVisibilityModel}
                onColumnVisibilityModelChange={onColumnVisibilityModelChange}
                columnHeaderHeight={headerHeight ?? 40}
                getRowHeight={() => 'auto'}
                hideFooter={true}
                checkboxSelection={enableSelection}
                autoHeight
                localeText={{
                    columnMenuSortAsc: 'Sắp xếp tăng dần',
                    columnMenuSortDesc: 'Sắp xếp giảm dần',
                    columnMenuUnsort: 'Huỷ sắp xếp',
                    columnMenuHideColumn: 'Ẩn cột',
                    columnMenuManageColumns: 'Tuỳ chỉnh',
                    columnsManagementSearchTitle: 'Tìm kiếm',
                    columnsManagementShowHideAllText: 'Hiển thị/Ẩn tất cả cột',
                    columnsManagementReset: 'Đặt lại',
                    noRowsLabel: 'Không có dữ liệu',
                }}
                sx={{
                    fontFamily: 'Roboto, sans-serif',
                    overflow: 'hidden',    
                    '& .MuiDataGrid-row': {
                        minHeight: '40px !important', // Đảm bảo hàng không thấp hơn 40px
                    },
                    '& .MuiDataGrid-row.Mui-selected, & .MuiDataGrid-cell.Mui-selected': {
                        backgroundColor: 'var(--joy-palette-neutral-100, #F0F4F8) !important', // Không có màu nền khi chọn hàng
                    },
                    '& .MuiDataGrid-cell': {
                        whiteSpace: 'pre-wrap !important', // Cho phép xuống dòng khi gặp \n
                        display: 'flex',
                        outline: 'none !important',
                        alignItems: 'center',
                        borderTop: 0,
                        border: '0.5px solid rgba(224, 224, 224, 1)', // Đường viền ô
                    },
                    '& .MuiDataGrid-cell--editing:focus': {
                        outline: 'none !important',
                    },
                    ' & .MuiDataGrid-cell--editing:focus-within': {
                        outline: 'none !important',
                        border: '2px solid #089456 !important',
                    },
                    '& .MuiDataGrid-columnHeader': {
                        border: '0.5px solid rgba(224, 224, 224, 1)',
                        borderTop: 0,
                        backgroundColor: '#f5f5f5', // Màu nền header
                    },
                    '& .MuiDataGrid-columnHeaderTitle': {
                        whiteSpace: 'normal',
                        textAlign: 'center',
                    },
                    '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': {
                        outline: 'none'
                    },
                    '& .MuiDataGrid-columnSeparator': {
                        display: 'none'
                    },
                }}
            />
        </div>
    );
};

export default SingleClickEditing;
