import React, { useState, useEffect } from 'react';
import { Progress, Rate, Button, Input, Pagination, Avatar } from 'antd';
import { StarFilled, CloseOutlined, InfoCircleOutlined } from '@ant-design/icons';
import './ReviewSection.scss';
import RatingModal from './RatingModal';
import { toast } from "react-toastify";
import { postReview, getProductReviews } from '../../services/apiViewService';
import { useSelector } from 'react-redux';
import { FaReply } from "react-icons/fa";
import { getPurchasedProducts } from '../../services/apiOrderService';
const { TextArea } = Input;

const ReviewSection = ({ product_id, name, primary_image }) => {
    const isAuthenticated = useSelector(state => state.user.isAuthenticated);
    const account = useSelector(state => state.user.account);

    const [showModal, setShowModal] = useState(false);
    const [filterRating, setFilterRating] = useState(null);
    const [newComment, setNewComment] = useState('');
    const [newReply, setNewReply] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyingToUsername, setReplyingToUsername] = useState('');
    const [newRating, setNewRating] = useState(0);
    const [showAllReplies, setShowAllReplies] = useState({});
    const [activeReplyBox, setActiveReplyBox] = useState({});

    const [reviewData, setReviewData] = useState({
        average_rating: 0,
        total_reviews: 0,
        total_reply: 0,
        rating_counts: {},
        reviews: [],
        replies: [],
        ai_summary: null
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(5);
    const [loading, setLoading] = useState(false);
    const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

    const ratingLevels = [5, 4, 3, 2, 1];
    const [canReview, setCanReview] = useState(false);

    useEffect(() => {
        const checkPurchased = async () => {
            if (!account?.id || !product_id) return;

            const res = await getPurchasedProducts(account.id);
            console.log(res)
            if (res.EC === 0) {
                const purchasedProductIds = res.data;
                setCanReview(purchasedProductIds.includes(product_id));
            }
        };

        checkPurchased();
    }, [account?.id, product_id]);
    const fetchReview = async (page = 1, rating = null) => {
        try {
            setLoading(true);
            const res = await getProductReviews(product_id, page, pageSize, rating);
            if (res?.EC === 0) {
                setReviewData(res.data);
            }
        } catch (error) {
            console.error("Error fetching reviews:", error);
            toast.error("Không thể tải đánh giá. Vui lòng thử lại sau.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setCurrentPage(1);
        fetchReview(1, filterRating);
    }, [product_id, filterRating]);

    useEffect(() => {
        setIsSummaryExpanded(false);
    }, [product_id, reviewData.ai_summary?.updated_at]);

    const handlePageChange = (page) => {
        setCurrentPage(page);
        fetchReview(page, filterRating);
    };

    const getPercent = (star) => {
        const count = reviewData.rating_counts?.[star] || 0;
        return reviewData.total_reviews ? Math.round((count / reviewData.total_reviews) * 100) : 0;
    };

    const filteredReviews = reviewData.reviews;
    const aiSummary = reviewData.ai_summary;
    const shortSummary = aiSummary?.summary_text
        ? aiSummary.summary_text.slice(0, 420)
        : "";
    const canExpandSummary = aiSummary?.summary_text && aiSummary.summary_text.length > 420;

    const hasRated = reviewData.reviews.some(
        r => r.user_id === account?.id && r.rating !== null && r.parent_id === null
    );

    const handleSubmitReview = async ({ rating = null, comment, parent_id = null }) => {
        if (!canReview) {
            toast.error("Quý khách vui lòng mua hàng để tham gia đánh giá sản phẩm.");
            return;
        }
        if (!isAuthenticated) {
            toast.warning("Quý khách vui lòng đăng nhập để thực hiện.");
            return;
        }
        try {
            const res = await postReview(
                product_id,
                account?.id,
                rating,
                comment,
                parent_id
            );

            if (res.EC === 0) {
                if (rating === null) {
                    toast.success("Bạn đã bình luận thành công.");
                }
                else {
                    toast.success("Bạn đã đánh giá thành công. Nội dung sẽ được duyệt trong vòng 24 giờ.");
                }
                setShowModal(false);
                setNewComment('');
                setNewReply('')
                setReplyingTo(null);
                setReplyingToUsername('');
                setNewRating(0);

                await fetchReview(currentPage, filterRating);
            } else {
                toast.error(res.EM || "Gửi thất bại!");
            }
        } catch {
            toast.error("Đã xảy ra lỗi! Vui lòng thử lại sau.");
        }
    };

    return (
        <>
            <RatingModal
                visible={showModal}
                onClose={() => setShowModal(false)}
                onSubmit={({ rating, comment }) => handleSubmitReview({ rating, comment })}
                product_id={product_id}
                name={name}
                primary_image={primary_image}
            />
            <div className="review-section">

                <div className="review-title">Đánh giá và bình luận</div>
                <div className="review-header" style={{ alignItems: 'flex-start', gap: 40 }}>
                    <div className="review-header">
                        <div className="review-summary">

                            <div className="review-score">{reviewData.average_rating}</div>
                            <div className="review-count">{reviewData.total_reviews} lượt đánh giá</div>
                            <div className="review-stars">
                                <Rate allowHalf disabled value={Number(reviewData.average_rating)} className="custom-rate" />
                            </div>

                            <Button className="review-button" onClick={() => setShowModal(true)}>
                                Đánh giá sản phẩm
                            </Button>

                        </div>
                    </div>

                    <div className="review-distribution">
                        {ratingLevels.map(star => (
                            <div key={star} className="rating-row">
                                <span className="rating-label">
                                    {star} <StarFilled className="star-icon" />
                                </span>
                                <Progress
                                    percent={getPercent(star)}
                                    showInfo={false}
                                    strokeColor="#f53d2d"
                                    trailColor="#eee"
                                    className="rating-progress"
                                />
                                <span className="rating-count">{reviewData.rating_counts?.[star] || 0}</span>
                            </div>
                        ))}
                    </div>

                </div>

                {aiSummary?.summary_text ? (
                    <div className="ai-review-summary">
                        <div className="ai-summary-headline">
                            <div className="ai-summary-rating-line">
                                <strong>{reviewData.average_rating}</strong>
                                <span className="ai-summary-star">★</span>
                                <span>Đánh Giá Sản Phẩm ({reviewData.total_reviews})</span>
                            </div>
                        </div>

                        <div className="ai-summary-box">
                            <div className="ai-summary-header">
                                <div className="ai-summary-title">Tóm tắt đánh giá sản phẩm ✨</div>
                                <InfoCircleOutlined className="ai-summary-info" />
                            </div>

                            <div className="ai-summary-content">
                                {isSummaryExpanded || !canExpandSummary ? aiSummary.summary_text : `${shortSummary}...`}
                            </div>

                            {Array.isArray(aiSummary.highlights) && aiSummary.highlights.length > 0 && (
                                <div className="ai-summary-highlights">
                                    {aiSummary.highlights.slice(0, 2).map((item, idx) => (
                                        <div key={`${item}-${idx}`} className="ai-highlight-item">• {item}</div>
                                    ))}
                                </div>
                            )}

                            <div className="ai-summary-footer">
                                {canExpandSummary && (
                                    <button
                                        type="button"
                                        className="ai-summary-toggle"
                                        onClick={() => setIsSummaryExpanded((prev) => !prev)}
                                    >
                                        {isSummaryExpanded ? "Thu gọn" : "Xem thêm"}
                                    </button>
                                )}
                                <div className="ai-summary-recommend">
                                    Hữu ích: {aiSummary.recommendation_percent}%
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}


                <div className="review-filter-row">
                    <div className="comment-count">{reviewData.total_reply} Bình luận</div>
                    <div className="review-filter">
                        <Button
                            className={`filter-btn ${!filterRating ? 'active' : ''}`}
                            type={!filterRating ? 'primary' : 'default'}
                            onClick={() => setFilterRating(null)}
                        >
                            Tất cả
                        </Button>
                        {ratingLevels.map(star => (
                            <Button
                                key={star}
                                className={`filter-btn ${filterRating === star ? 'active' : ''}`}
                                type={filterRating === star ? 'primary' : 'default'}
                                onClick={() => setFilterRating(star)}
                            >
                                {star}{' '}
                                <StarFilled
                                    className={`star-icon ${filterRating === star ? 'active' : ''}`}
                                />
                            </Button>
                        ))}
                    </div>
                </div>


                <div className="review-input-section">
                    <TextArea
                        rows={3}
                        maxLength={3000}
                        placeholder="Nhập nội dung bình luận..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="review-textarea"
                    />
                    <div className="review-input-footer">
                        <span className="char-count">{newComment.length}/3000</span>
                        <Button
                            className="submit-comment-btn"
                            type="primary"
                            onClick={() => handleSubmitReview({ rating: null, comment: newComment })}
                            disabled={!newComment.trim()}
                        >
                            Gửi bình luận
                        </Button>
                    </div>
                </div>

                {filteredReviews.length === 0 ? (
                    <div className="no-review">Sản phẩm không có bình luận và đánh giá nào</div>
                ) : (
                    <>
                        <div className="review-comments">

                            {loading ? (
                                <div className="review-loading">

                                </div>
                            ) : (
                                filteredReviews.map(parent => {
                                    const parentReplies = reviewData.replies.filter(r => r.parent_id === parent.id);
                                    const showAll = showAllReplies[parent.id];
                                    const repliesToShow = showAll ? parentReplies : parentReplies.slice(0, 2);
                                    return (
                                        <div className="review-item" key={parent.id}>
                                            <Avatar
                                                src={parent.avatar ? `${process.env.REACT_APP_BASE_URL}${parent.avatar}` : "/avatar.png"}
                                                alt={parent.username}
                                                size={44}
                                                className="review-avatar"
                                            >
                                                {!parent.avatar && parent.username ? parent.username.charAt(0).toUpperCase() : null}
                                            </Avatar>
                                            <div className="review-content">
                                                <div className="review-header-info">
                                                    <strong className="review-username">{parent.username}</strong>
                                                    {parent.role === 'admin' && (
                                                        <span className="review-role">Quản trị viên</span>
                                                    )}
                                                    <span className="review-date">
                                                        {new Date(parent.created_at).toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className='star-dis'>
                                                    {parent.rating && <Rate disabled defaultValue={parent.rating} className="review-rating" />}
                                                </div>
                                                <div className="review-comment">{parent.comment}</div>
                                                <div className="review-actions">

                                                    <Button
                                                        type="link"
                                                        size="small"
                                                        onClick={() => setActiveReplyBox({ parentId: parent.id, replyId: null, username: parent.username })}
                                                    >
                                                        <FaReply />Trả lời
                                                    </Button>
                                                </div>

                                                {activeReplyBox.parentId === parent.id && !activeReplyBox.replyId && (
                                                    <div className="reply-box">
                                                        <div className="reply-box-header">
                                                            <div className='reply-box-header-1'><FaReply /> Đang trả lời: <strong>{activeReplyBox.username}</strong></div>
                                                            <Button
                                                                size="small"
                                                                icon={<CloseOutlined />}
                                                                onClick={() => setActiveReplyBox({})}
                                                                type="text"
                                                                className="close-reply-btn"
                                                            />
                                                        </div>
                                                        <div className='reply-com'>
                                                            <diV>
                                                                <Avatar
                                                                    src={account.avatar ? `${process.env.REACT_APP_BASE_URL}${account.avatar}` : "/avatar.png"}
                                                                    alt={account.username}
                                                                    size={32}
                                                                    className="reply-avatar"
                                                                >
                                                                    {!account.avatar && account.username ? account.username.charAt(0).toUpperCase() : null}
                                                                </Avatar>
                                                            </diV>
                                                            <TextArea
                                                                className='reply-area'
                                                                rows={2}
                                                                maxLength={3000}
                                                                placeholder="Nhập nội dung bình luận..."
                                                                value={newReply}
                                                                onChange={(e) => setNewReply(e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="reply-submit-wrapper">
                                                            <Button
                                                                type="primary"
                                                                onClick={() => {
                                                                    handleSubmitReview({ comment: newReply, parent_id: parent.id });
                                                                    setActiveReplyBox({});
                                                                    setNewReply('');
                                                                }}
                                                                disabled={!newReply.trim()}
                                                            >
                                                                Gửi
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}


                                                {(() => {
                                                    const parentReplies = reviewData.replies.filter(r => r.parent_id === parent.id);
                                                    const showAll = showAllReplies[parent.id];
                                                    const repliesToShow = showAll ? parentReplies : parentReplies.slice(0, 2);
                                                    return (
                                                        <>
                                                            {repliesToShow.map(reply => (
                                                                <div
                                                                    key={reply.id}
                                                                    className={`reply-item ${reply.role === 'admin' ? 'admin' : ''}`}
                                                                >
                                                                    <Avatar
                                                                        src={reply.avatar ? `${process.env.REACT_APP_BASE_URL}${reply.avatar}` : "/avatar.png"}
                                                                        alt={reply.username}
                                                                        size={32}
                                                                        className="reply-avatar"
                                                                    >
                                                                        {!reply.avatar && reply.username ? reply.username.charAt(0).toUpperCase() : null}
                                                                    </Avatar>
                                                                    <div>
                                                                        <div className="reply-header">
                                                                            <strong className="reply-username">{reply.username}</strong>
                                                                            {reply.role === 'admin' && (
                                                                                <span className="reply-role">Quản trị viên</span>
                                                                            )}
                                                                            <span className="reply-date">
                                                                                {new Date(reply.created_at).toLocaleString()}
                                                                            </span>
                                                                        </div>
                                                                        <div className="reply-comment">{reply.comment}</div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {parentReplies.length > 2 && !showAll && (
                                                                <Button
                                                                    type="link"
                                                                    className="reply-toggle-btn"
                                                                    onClick={() => setShowAllReplies(prev => ({ ...prev, [parent.id]: true }))}
                                                                >
                                                                    Xem thêm {parentReplies.length - 2} phản hồi
                                                                </Button>
                                                            )}
                                                            {parentReplies.length > 2 && showAll && (
                                                                <Button
                                                                    type="link"
                                                                    className="reply-toggle-btn"
                                                                    onClick={() => setShowAllReplies(prev => ({ ...prev, [parent.id]: false }))}
                                                                >
                                                                    Ẩn bớt phản hồi
                                                                </Button>
                                                            )}
                                                        </>
                                                    );
                                                })()}

                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>


                    </>)}

            </div>
            <div className="review-pagination-wrapper">
                <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={reviewData.total_parent_reviews}
                    onChange={handlePageChange}
                    showSizeChanger={false}
                />
            </div>
        </>
    );
};

export default ReviewSection;
