// useIssueNote.js
import { useState, useEffect, useCallback } from "react";
import { createIssueNote, getIssueNote, getIssueNotes, getNextCode, getSaleOrders, getMaterials, getProducts, getPendingOrInProgressReceiveOutsources } from "./issueNoteService";

const useIssueNote = (page = 0, size = 10) => {
  const [saleOrders, setSaleOrders] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Hàm lấy danh sách Sale Orders
  const fetchSaleOrders = async () => {
    setLoading(true);
    try {
      const data = await getSaleOrders(page, size);
      console.log("Dữ liệu sale orders:", data);
      setSaleOrders(data.content || []);
    } catch (err) {
      console.error("Lỗi khi lấy Sale Orders:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Hàm lấy danh sách Materials
  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const data = await getMaterials(page, 100000);
      console.log("Dữ liệu vật tư:", data);
      setMaterials(data.content || []);
    } catch (err) {
      console.error("Lỗi khi lấy vật tưtư:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await getProducts(page, 100000);
      console.log("Dữ liệu sản phẩm:", data);
      setMaterials(data.content || []);
    } catch (err) {
      console.error("Lỗi khi lấy sản phẩm:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Memoize hàm fetchIssueNoteDetail để tránh thay đổi tham chiếu mỗi lần render
  const fetchIssueNoteDetail = useCallback(async (id) => {
    setLoading(true);
    try {
      const data = await getIssueNote(id);
      return data;
    } catch (err) {
      console.error("Lỗi khi lấy chi tiết Issue Note:", err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Các hàm khác...
  const fetchIssueNotes = async () => {
    setLoading(true);
    try {
      const data = await getIssueNotes(page, size);
      console.log("Dữ liệu issue notes:", data);
      // Giả sử các state setIssueNotes, setTotalPages, setTotalElements đã được khai báo
      setIssueNotes(data.content || []);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err) {
      console.error("Lỗi khi lấy Issue Notes:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const addIssueNote = async (noteData) => {
    try {
      const result = await createIssueNote(noteData);
      return result;
    } catch (err) {
      throw err;
    }
  };

  const fetchNextCode = async () => {
    try {
      const result = await getNextCode();
      return result;
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchSaleOrders();
    fetchMaterials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size]);

  const fetchPendingReceiveOutsources = async () => {
    setLoading(true);
    try {
      const data = await getPendingOrInProgressReceiveOutsources();
      return data;
    } catch (err) {
      console.error("Lỗi khi lấy danh sách nhận gia công:", err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { 
    saleOrders, 
    materials,     
    loading, 
    error, 
    fetchSaleOrders, 
    fetchMaterials, 
    fetchProducts,
    addIssueNote, 
    fetchNextCode, 
    fetchIssueNotes, 
    fetchIssueNoteDetail,
    fetchPendingReceiveOutsources
  };
};

export default useIssueNote;
