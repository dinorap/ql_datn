import React, { useState } from 'react';
import { Modal, Rate, Input, Button, message } from 'antd';
import './ReviewSection.scss';
const { TextArea } = Input;

const RatingModal = ({ visible, onClose, onSubmit, product_id, name, primary_image }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');

    const handleOk = () => {
        if (!rating || comment.trim().length < 5) {
            return message.warning("Bạn cần chọn sao và nhập ít nhất 5 ký tự.");
        }
        onSubmit({
            product_id,
            rating,
            comment,
        });

        setRating(0);
        setComment('');
        onClose();
    };

    return (
        <Modal
            title={<span style={{ fontWeight: 'bold', fontSize: 22 }}>Đánh giá & nhận xét</span>}
            open={visible}
            onOk={handleOk}
            onCancel={onClose}
            okText={<span style={{ fontWeight: 'bold' }}>GỬI ĐÁNH GIÁ</span>}
            cancelText="Hủy"
            centered
            styles={{ body: { paddingTop: 16, paddingBottom: 8 } }}
        >
            <h3 style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12, textAlign: 'center' }}>{name}</h3>
            {primary_image && (
                <div style={{ textAlign: 'center', marginBottom: 12 }}>
                    <img src={`${process.env.REACT_APP_BASE_URL}${primary_image}`} alt={name} className='img_rating' />
                </div>
            )}
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <Rate value={rating} onChange={setRating} style={{ fontSize: 32, color: '#f7de1d', marginBottom: 10 }} />
            </div>
            <TextArea
                placeholder="Xin mời chia sẻ cảm nhận (nhập tối thiểu 15 ký tự)"
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                style={{ borderRadius: 8, fontSize: 15, marginBottom: 12 }}
            />
        </Modal>
    );
};

export default RatingModal;
