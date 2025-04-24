import { useState } from "react";
import {
  fetchReceiptNotes,
  getReceiptNoteById,
  createReceiptNote,
  updateReceiptNote,
  deleteReceiptNote,
  getNextCode as getNextCodeService,
  uploadPaperEvidence
} from "./receiptNoteService";

const useReceiptNote = () => {
  const [receiptNotes, setReceiptNotes] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch paginated receipt notes
  const fetchPaginatedReceiptNotes = async (page, size, searchTerm = "", categories = [], startDate = null, endDate = null) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchReceiptNotes(page, size, searchTerm, categories, startDate, endDate);
      setReceiptNotes(response.content || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
      return response;
    } catch (error) {
      console.error("Error fetching receipt notes:", error);
      setError(error.message || "Có lỗi xảy ra khi tải dữ liệu");
      return { content: [], totalPages: 0, totalElements: 0 };
    } finally {
      setLoading(false);
    }
  };
  
  // Get a single receipt note by ID
  const getReceiptNote = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getReceiptNoteById(id);
      return response;
    } catch (error) {
      console.error(`Error fetching receipt note with ID ${id}:`, error);
      setError(error.message || `Không thể tải dữ liệu phiếu nhập ID ${id}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Get next receipt code
  const getNextReceiptCode = async () => {
    setLoading(true);
    setError(null);
    try {
      const code = await getNextCodeService();
      return code; 
    } catch (error) {
      console.error("Error getting next receipt code:", error);
      setError(error.message || "Không thể tạo mã phiếu nhập mới");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Add a new receipt note
  const addReceiptNote = async (receiptNote) => {
    setLoading(true);
    setError(null);
    try {
      const response = await createReceiptNote(receiptNote);
      // Refresh the list after adding
      await fetchPaginatedReceiptNotes(0, 10);
      return response;
    } catch (error) {
      console.error("Error creating receipt note:", error);
      setError(error.message || "Không thể tạo phiếu nhập mới");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Edit an existing receipt note
  const editReceiptNote = async (receiptNoteId, updatedReceiptNote) => {
    setLoading(true);
    setError(null);
    try {
      const response = await updateReceiptNote(receiptNoteId, updatedReceiptNote);
      // Refresh the list after editing
      await fetchPaginatedReceiptNotes(0, 10);
      return response;
    } catch (error) {
      console.error("Error updating receipt note:", error);
      setError(error.message || "Không thể cập nhật phiếu nhập");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Delete a receipt note
  const removeReceiptNote = async (receiptNoteId) => {
    setLoading(true);
    setError(null);
    try {
      await deleteReceiptNote(receiptNoteId);
      // Refresh the list after deleting
      await fetchPaginatedReceiptNotes(0, 10);
    } catch (error) {
      console.error("Error deleting receipt note:", error);
      setError(error.message || "Không thể xóa phiếu nhập");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Upload files for receipt notes
  const uploadFiles = async (noteId, noteType, files) => {
    setLoading(true);
    setError(null);
    try {
      const response = await uploadPaperEvidence(noteId, noteType, files);
      return response;
    } catch (error) {
      console.error("Error uploading files:", error);
      setError(error.message || "Không thể tải lên tệp đính kèm");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    receiptNotes,
    totalPages,
    totalElements,
    loading,
    error,
    fetchPaginatedReceiptNotes,
    getReceiptNote,
    addReceiptNote,
    editReceiptNote,
    removeReceiptNote,
    getNextReceiptCode,
    uploadFiles
  };
};

export default useReceiptNote;