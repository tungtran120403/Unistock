import React, { useRef } from "react";
import {
    Button,
    IconButton,
    MenuItem,
    Popover,
    TextField,
} from "@mui/material";
import { Typography } from "@material-tailwind/react";
import { FaAngleDown } from "react-icons/fa";
import ClearIcon from "@mui/icons-material/Clear";
import {
    PiLessThanOrEqualBold,
    PiGreaterThanOrEqualBold,
} from "react-icons/pi";

const QuantityFilterButton = ({
    filters,
    setFilters,
    anchorEl,
    setAnchorEl,
    buttonLabel = "Số lượng",
}) => {
    const open = Boolean(anchorEl && anchorEl.ownerDocument?.body.contains(anchorEl));
    const selectionOrderRef = useRef([]); // Lưu thứ tự lựa chọn

    const hasAnyFilter = Object.values(filters).some(
        (f) => f.min !== null || f.max !== null
    );

    const handleClearAll = () => {
        const reset = {};
        Object.entries(filters).forEach(([key, value]) => {
            reset[key] = { ...value, min: null, max: null };
        });
        setFilters(reset);
        selectionOrderRef.current = [];
    };

    const handleFilterChange = (key, changes) => {
        setFilters((prev) => {
            const updated = {
                ...prev,
                [key]: { ...prev[key], ...changes },
            };
            const isAlreadySelected = selectionOrderRef.current.includes(key);
            const hasValue = updated[key].min !== null || updated[key].max !== null;
            if (hasValue && !isAlreadySelected) {
                selectionOrderRef.current.push(key);
            } else if (!hasValue && isAlreadySelected) {
                selectionOrderRef.current = selectionOrderRef.current.filter((k) => k !== key);
            }
            return updated;
        });
    };

    return (
        <>
            <Button
                onClick={(e) => setAnchorEl(e.currentTarget)}
                variant={hasAnyFilter ? "outlined" : "contained"}
                sx={{
                    height: "36.5px",
                    backgroundColor: hasAnyFilter ? "#ffffff" : "#0ab067",
                    boxShadow: "none",
                    borderColor: "#089456",
                    textTransform: "none",
                    color: hasAnyFilter ? "#089456" : "#ffffff",
                    px: 1.5,
                    "&:hover": {
                        boxShadow: "none",
                        backgroundColor: hasAnyFilter ? "#0894561A" : "#089456",
                        borderColor: "#089456",
                    },
                }}
            >
                {hasAnyFilter ? (
                    <span className="flex items-center gap-[6px]">
                        {selectionOrderRef.current
                            .filter((key) => filters[key].min !== null || filters[key].max !== null)
                            .map((key, index) => {
                                const f = filters[key];
                                let symbol = null;
                                if (f.type === "lt") {
                                    symbol = (
                                        <span className="flex items-center gap-1">
                                            <PiLessThanOrEqualBold className="text-[16px]" /> {f.max}
                                        </span>
                                    );
                                } else if (f.type === "gt") {
                                    symbol = (
                                        <span className="flex items-center gap-1">
                                            <PiGreaterThanOrEqualBold className="text-[16px]" /> {f.min}
                                        </span>
                                    );
                                } else if (f.type === "eq") {
                                    symbol = (
                                        <span className="flex items-center gap-1">= {f.min}</span>
                                    );
                                } else {
                                    symbol = (
                                        <span>{f.min ?? "?"} - {f.max ?? "?"}</span>
                                    );
                                }

                                return (
                                    <span key={key} className="flex items-center gap-[4px]">
                                        {f.label || key}: <span className="font-medium">{symbol}</span>
                                        {index === 0 && selectionOrderRef.current.filter((k) => filters[k].min !== null || filters[k].max !== null).length > 1 && (
                                            <span className="text-xs bg-[#089456] text-white px-2 py-[1px] rounded-xl font-thin">
                                                +{selectionOrderRef.current.filter((k) => filters[k].min !== null || filters[k].max !== null).length - 1}
                                            </span>
                                        )}
                                    </span>
                                );
                            })[0]}
                    </span>
                ) : (
                    <span className="flex items-center gap-[5px]">
                        {buttonLabel} <FaAngleDown className="h-4 w-4" />
                    </span>
                )}
            </Button>

            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            >
                <div
                    className={`px-6 flex flex-col gap-7 w-fit ${hasAnyFilter ? "py-3 pt-6" : "py-6"}`}
                >
                    {Object.entries(filters).map(([key, filter]) => (
                        <div key={key}>
                            <div className="flex items-center justify-between">
                                <Typography variant="h6" className="h-[28px] uppercase">
                                    {filter.label || key}
                                </Typography>
                                {(filter.min !== null || filter.max !== null) && (
                                    <IconButton
                                        size="small"
                                        onClick={() => handleFilterChange(key, { min: null, max: null })}
                                        sx={{
                                            width: "fit-content",
                                            minWidth: 0,
                                            color: "#000000DE",
                                        }}
                                    >
                                        <ClearIcon fontSize="inherit" />
                                    </IconButton>
                                )}
                            </div>
                            <div className="flex gap-5 items-center">
                                <TextField
                                    select
                                    color="success"
                                    hiddenLabel
                                    value={filter.type}
                                    onChange={(e) => handleFilterChange(key, { type: e.target.value, min: null, max: null })}
                                    size="small"
                                    sx={{ width: "fit-content", minWidth: 100 }}
                                >
                                    <MenuItem value="lt">
                                        <span className="flex items-center gap-2">
                                            <PiLessThanOrEqualBold /> (dưới)
                                        </span>
                                    </MenuItem>
                                    <MenuItem value="gt">
                                        <span className="flex items-center gap-2">
                                            <PiGreaterThanOrEqualBold /> (trên)
                                        </span>
                                    </MenuItem>
                                    <MenuItem value="eq">= (bằng)</MenuItem>
                                    <MenuItem value="range">khoảng</MenuItem>
                                </TextField>
                                {filter.type === "range" ? (
                                    <div className="flex gap-1 items-center">
                                        <TextField
                                            hiddenLabel
                                            size="small"
                                            type="number"
                                            placeholder="từ"
                                            color="success"
                                            value={filter.min ?? ""}
                                            onChange={(e) => handleFilterChange(key, { min: Number(e.target.value) || null })}
                                            sx={{ width: 80 }}
                                        />
                                        <div>-</div>
                                        <TextField
                                            hiddenLabel
                                            size="small"
                                            type="number"
                                            placeholder="đến"
                                            color="success"
                                            value={filter.max ?? ""}
                                            onChange={(e) => handleFilterChange(key, { max: Number(e.target.value) || null })}
                                            sx={{ width: 80 }}
                                        />
                                    </div>
                                ) : filter.type === "lt" ? (
                                    <TextField
                                        hiddenLabel
                                        type="number"
                                        size="small"
                                        color="success"
                                        sx={{ width: "100px" }}
                                        placeholder="dưới"
                                        value={filter.max ?? ""}
                                        onChange={(e) => handleFilterChange(key, { max: Number(e.target.value) || null })}
                                    />
                                ) : (
                                    <TextField
                                        hiddenLabel
                                        type="number"
                                        size="small"
                                        color="success"
                                        sx={{ width: "100px" }}
                                        placeholder={filter.type === "gt" ? "trên" : "bằng"}
                                        value={filter.min ?? ""}
                                        onChange={(e) => handleFilterChange(key, { min: Number(e.target.value) || null })}
                                    />
                                )}
                            </div>
                        </div>
                    ))}

                    {hasAnyFilter && (
                        <div className="flex justify-end">
                            <Button
                                variant="text"
                                size="small"
                                onClick={handleClearAll}
                                sx={{
                                    color: "#000000DE",
                                    "&:hover": {
                                        backgroundColor: "transparent",
                                        textDecoration: "underline",
                                    },
                                }}
                            >
                                Xoá lọc
                            </Button>
                        </div>
                    )}
                </div>
            </Popover>
        </>
    );
};

export default QuantityFilterButton;
