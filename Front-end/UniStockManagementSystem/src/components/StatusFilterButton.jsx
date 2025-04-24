import React from "react";
import { Button, Menu, MenuItem, Checkbox, ListItemText } from "@mui/material";
import { FaAngleDown } from "react-icons/fa";

const StatusFilterButton = ({
    anchorEl,
    setAnchorEl,
    selectedStatuses,
    setSelectedStatuses,
    allStatuses,
    buttonLabel = "Trạng thái",
    setCurrentPage,
}) => {
    const open = Boolean(anchorEl);

    const handleToggleStatus = (status) => {
        const exists = selectedStatuses.find((s) => s.value === status.value);
        if (exists) {
            setSelectedStatuses((prev) => prev.filter((s) => s.value !== status.value));
            setCurrentPage?.(0);
        } else {
            setSelectedStatuses((prev) => [...prev, status]);
            setCurrentPage?.(0);
        }
    };

    const firstStatus = selectedStatuses[0];
    const summary = firstStatus ? (
        <span className="inline-flex items-center gap-[5px]">
            <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${firstStatus.className}`}
            >
                {firstStatus.label}
            </span>
            {selectedStatuses.length > 1 && (
                <span className="text-xs bg-[#089456] text-white px-2 py-[1px] rounded-xl font-thin">
                    +{selectedStatuses.length - 1}
                </span>
            )}
        </span>
    ) : (
        <span className="flex items-center gap-[5px]">
            {buttonLabel} <FaAngleDown className="h-4 w-4" />
        </span>
    );

    return (
        <>
            <Button
                onClick={(e) => setAnchorEl(e.currentTarget)}
                variant={selectedStatuses.length > 0 ? "outlined" : "contained"}
                sx={{
                    backgroundColor: selectedStatuses.length > 0 ? "#ffffff" : "#0ab067",
                    boxShadow: "none",
                    borderColor: "#089456",
                    textTransform: "none",
                    color: selectedStatuses.length > 0 ? "#089456" : "#ffffff",
                    px: 1.5,
                    height: 36,
                    "&:hover": {
                        backgroundColor: selectedStatuses.length > 0 ? "#0894561A" : "#089456",
                        borderColor: "#089456",
                        boxShadow: "none",
                    },
                }}
            >
                {summary}
            </Button>

            <Menu
                open={open}
                anchorEl={anchorEl}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            >
                {allStatuses.map((status) => (
                    <MenuItem
                        key={String(status.value)}
                        onClick={() => handleToggleStatus(status)}
                        sx={{ paddingLeft: "7px", minWidth: "150px" }}
                    >
                        <Checkbox
                            color="success"
                            size="small"
                            checked={selectedStatuses.some((s) => s.value === status.value)}
                        />
                        <ListItemText
                            primary={
                                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
                                    {status.label}
                                </div>
                            }
                        />
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
};

export default StatusFilterButton;
