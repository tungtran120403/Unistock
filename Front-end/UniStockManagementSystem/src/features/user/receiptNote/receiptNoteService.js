import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/user/receiptnote`;

// Helper function to get the authorization header
const authHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Fetch paginated receipt notes
export const fetchReceiptNotes = async (page, size, searchTerm = "", categories = [], startDate = null, endDate = null, prevData = null) => {
  try {
    let url = `${API_URL}?page=${page}&size=${size}`;
    
    if (searchTerm) {
      url += `&search=${encodeURIComponent(searchTerm)}`;
    }
    if (categories && categories.length > 0) {
      url += `&categories=${categories.map(encodeURIComponent).join(',')}`;
    }
    if (startDate) {
      url += `&startDate=${encodeURIComponent(startDate)}`;
    }
    if (endDate) {
      url += `&endDate=${encodeURIComponent(endDate)}`;
    }

    const response = await axios.get(url, { headers: authHeader() });

    if (prevData && JSON.stringify(response.data) === JSON.stringify(prevData)) {
      return prevData;
    }

    return response.data;
  } catch (error) {
    console.error("Error fetching receipt notes:", error);
    throw error;
  }
};

// Get a single receipt note by ID
export const getReceiptNoteById = async (receiptNoteId) => {
  try {
    const response = await axios.get(`${API_URL}/${receiptNoteId}`, {
      headers: authHeader(),
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching receipt note with ID ${receiptNoteId}:`, error);
    throw error;
  }
};

// Create a new receipt note
export const createReceiptNote = async (receiptNote) => {
  try {
    const response = await axios.post(API_URL, receiptNote, {
      headers: { ...authHeader(), "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error) {
    console.error("Error creating receipt note:", error);
    throw error;
  }
};

// Get next code for new receipt note
export const getNextCode = async () => {
  try {
    const response = await axios.get(`${API_URL}/nextcode`, {
      headers: authHeader(),
    });
    return response.data; 
  } catch (error) {
    console.error("Error getting next receipt note code:", error);
    throw error;
  }
};

// Update an existing receipt note
export const updateReceiptNote = async (receiptNoteId, receiptNote) => {
  try {
    const response = await axios.put(`${API_URL}/${receiptNoteId}`, receiptNote, {
      headers: { ...authHeader(), "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error) {
    console.error("Error updating receipt note:", error);
    throw error;
  }
};

// Delete a receipt note
export const deleteReceiptNote = async (receiptNoteId) => {
  try {
    const response = await axios.delete(`${API_URL}/${receiptNoteId}`, {
      headers: authHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting receipt note:", error);
    throw error;
  }
};

// Upload files for receipt notes
export const uploadPaperEvidence = async (noteId, noteType, files) => {
  try {
    const formData = new FormData();
    formData.append("noteId", noteId);
    formData.append("noteType", noteType);
    
    // Append multiple files
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }
    
    const response = await axios.post(`${API_URL}/upload-documents`, formData, {
      headers: { 
        ...authHeader(),
        'Content-Type': 'multipart/form-data'
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error uploading files:", error);
    throw error;
  }
};
