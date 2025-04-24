import React from 'react';
import { BiSearch } from 'react-icons/bi';

const TableSearch = ({ value, onChange, onSearch, placeholder = "Search" }) => {
    return (
        <div className="w-full max-w-sm min-w-[200px]">
            <div className="relative flex items-center">
                <BiSearch className="absolute w-5 h-5 top-2.5 left-2.5 text-slate-600" />
                <input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full bg-transparent placeholder:text-slate-400 text-slate-700 text-sm border border-gray-500 rounded-md pl-10 pr-3 py-2 duration-300 ease focus:outline-[#089456] focus:border-slate-400 hover:border-slate-300 transition-colors"
                    placeholder={placeholder}
                />
                
            </div>
        </div>
    );
};

export default TableSearch;
