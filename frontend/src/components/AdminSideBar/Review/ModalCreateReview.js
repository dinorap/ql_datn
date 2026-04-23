import { useEffect, useMemo, useState } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { getAllProductsSearch } from "../../../services/apiViewService";
import { createAdminReview } from "../../../services/apiReviewService";

const ModalCreateReview = ({ show, setShow, fetchListWithPaginate, currentPage }) => {
    const account = useSelector((state) => state.admin.account);
    const [products, setProducts] = useState([]);
    const [productId, setProductId] = useState("");
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const productOptions = useMemo(() => {
        return (products || []).map((p) => ({
            value: p.product_id,
            label: p.product_name,
        }));
    }, [products]);

    const handleClose = () => {
        setShow(false);
        setProductId("");
        setRating(5);
        setComment("");
    };

    useEffect(() => {
        if (!show) return;
        const fetchProducts = async () => {
            setLoadingProducts(true);
            try {
                const res = await getAllProductsSearch({ page: 1, limit: 200 });
                if (res?.EC === 0) {
                    setProducts(res?.data?.products || []);
                } else {
                    toast.error("Không tải được danh sách sản phẩm");
                }
            } catch {
                toast.error("Không tải được danh sách sản phẩm");
            } finally {
                setLoadingProducts(false);
            }
        };
        fetchProducts();
    }, [show]);

    const handleSubmit = async () => {
        if (!productId) {
            toast.error("Vui lòng chọn sản phẩm");
            return;
        }
        if (!comment.trim()) {
            toast.error("Vui lòng nhập nội dung đánh giá");
            return;
        }
        setSubmitting(true);
        try {
            const res = await createAdminReview(productId, Number(rating), comment.trim(), account?.id);
            if (res?.EC === 0) {
                toast.success(res.EM || "Tạo đánh giá thành công");
                handleClose();
                fetchListWithPaginate(currentPage);
                return;
            }
            toast.error(res?.EM || "Tạo đánh giá thất bại");
        } catch {
            toast.error("Tạo đánh giá thất bại");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal show={show} onHide={handleClose} backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>Thêm đánh giá</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form.Group className="mb-3">
                    <Form.Label>Sản phẩm</Form.Label>
                    <Form.Select
                        value={productId}
                        onChange={(e) => setProductId(Number(e.target.value))}
                        disabled={loadingProducts}
                    >
                        <option value="">-- Chọn sản phẩm --</option>
                        {productOptions.map((p) => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                    </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Số sao</Form.Label>
                    <Form.Select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                        <option value={5}>5 sao</option>
                        <option value={4}>4 sao</option>
                        <option value={3}>3 sao</option>
                        <option value={2}>2 sao</option>
                        <option value={1}>1 sao</option>
                    </Form.Select>
                </Form.Group>

                <Form.Group>
                    <Form.Label>Nội dung</Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={4}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Nhập nội dung đánh giá..."
                    />
                </Form.Group>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose} disabled={submitting}>Hủy</Button>
                <Button variant="primary" onClick={handleSubmit} disabled={submitting}>Lưu đánh giá</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ModalCreateReview;
