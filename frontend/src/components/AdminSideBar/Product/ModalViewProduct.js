import { Modal, Button, Row, Col, ListGroup } from 'react-bootstrap';
import { Image, Descriptions } from 'antd';
import dayjs from 'dayjs';

const ModalViewProduct = ({ show, setShow, dataView }) => {
    const handleClose = () => setShow(false);
    console.log(dataView)
    return (
        <Modal show={show} onHide={handleClose} size="lg" backdrop="static" centered className='backdrop-product'>
            <Modal.Header closeButton>
                <Modal.Title>🛒 Thông tin sản phẩm</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <ListGroup variant="flush">
                    <ListGroup.Item>
                        <Row>
                            <Col md={4}><strong>Tên sản phẩm:</strong></Col>
                            <Col>{dataView?.name}</Col>
                        </Row>
                    </ListGroup.Item>
                    <ListGroup.Item>
                        <Row>
                            <Col md={4}><strong>Ảnh tổng quan:</strong></Col>
                            <Col>
                                {dataView?.primary_image ? (
                                    <Image
                                        src={`${process.env.REACT_APP_BASE_URL}${dataView.primary_image}`}
                                        alt="primary-img"
                                        className="product-image img-preview"
                                        style={{ maxWidth: 150 }}
                                    />
                                ) : 'Không có ảnh'}
                            </Col>
                        </Row>
                    </ListGroup.Item>

                    <ListGroup.Item>
                        <Row>
                            <Col md={4}><strong>Hãng:</strong></Col>
                            <Col>{dataView?.company_name}</Col>
                        </Row>
                    </ListGroup.Item>
                    <ListGroup.Item>
                        <Row>
                            <Col md={4}><strong>Link:</strong></Col>
                            <Col>{dataView?.link || 'Không có link video'}</Col>
                        </Row>
                    </ListGroup.Item>
                    <ListGroup.Item>
                        <Row>
                            <Col md={4}><strong>Quà:</strong></Col>
                            <Col>{dataView?.description || 'Không có quà'}</Col>
                        </Row>
                    </ListGroup.Item>
                    <ListGroup.Item>
                        <Row>
                            <Col md={4}><strong>Mô tả:</strong></Col>
                            <Col>{dataView?.gift || 'Chưa có mô tả'}</Col>
                        </Row>
                    </ListGroup.Item>
                    <ListGroup.Item>
                        <Row>
                            <Col md={4}><strong> Hỗ trợ trả góp:</strong></Col>
                            <Col>{dataView?.is_installment_available === 0 ? 'Không hỗ trợ' : "Có hỗ trợ" || 'Chưa có mô tả'}</Col>
                        </Row>
                    </ListGroup.Item>
                    <ListGroup.Item>
                        <Row>
                            <Col md={4}><strong>Màn hình:</strong></Col>
                            <Col>{dataView?.screen}</Col>
                        </Row>
                    </ListGroup.Item>
                    <ListGroup.Item>
                        <Row>
                            <Col md={4}><strong>Camera:</strong></Col>
                            <Col>{dataView?.camera}</Col>
                        </Row>
                    </ListGroup.Item>
                    <ListGroup.Item>
                        <Row>
                            <Col md={4}><strong>GPU:</strong></Col>
                            <Col>{dataView?.gpu}</Col>
                        </Row>
                    </ListGroup.Item>
                    <ListGroup.Item>
                        <Row>
                            <Col md={4}><strong>CPU:</strong></Col>
                            <Col>{dataView?.cpu}</Col>
                        </Row>
                    </ListGroup.Item>
                    <ListGroup.Item>
                        <Row>
                            <Col md={4}><strong>Pin:</strong></Col>
                            <Col>{dataView?.battery}</Col>
                        </Row>
                    </ListGroup.Item>
                    <ListGroup.Item>
                        <Row>
                            <Col md={4}><strong>Hệ điều hành:</strong></Col>
                            <Col>{dataView?.operating_system}</Col>
                        </Row>
                    </ListGroup.Item>
                    <ListGroup.Item>
                        <Row>
                            <Col md={4}><strong>Khối lượng:</strong></Col>
                            <Col>{dataView?.weight} gram</Col>
                        </Row>
                    </ListGroup.Item>
                    <ListGroup.Item>
                        <Row>
                            <Col md={4}><strong>Kích thước:</strong></Col>
                            <Col>{dataView?.dimensions}</Col>
                        </Row>
                    </ListGroup.Item>
                    <ListGroup.Item>
                        <Row>
                            <Col md={4}><strong>Chất liệu:</strong></Col>
                            <Col>{dataView?.material}</Col>
                        </Row>
                    </ListGroup.Item>
                    <ListGroup.Item>
                        <Row>
                            <Col md={4}><strong>Tần số quét:</strong></Col>
                            <Col>{dataView?.refresh_rate}</Col>
                        </Row>
                    </ListGroup.Item>
                    <ListGroup.Item>
                        <Row>
                            <Col md={4}><strong>Công nghệ màn hình:</strong></Col>
                            <Col>{dataView?.screen_technology}</Col>
                        </Row>
                    </ListGroup.Item>
                    <ListGroup.Item>
                        <Row>
                            <Col md={4}><strong>Cổng sạc:</strong></Col>
                            <Col>{dataView?.charging_port}</Col>
                        </Row>
                    </ListGroup.Item>
                    <ListGroup.Item>
                        <Row>
                            <Col md={4}><strong>Ngày ra mắt:</strong></Col>
                            <Col>{dataView?.release_date ? dayjs(dataView.release_date).format('YYYY-MM-DD') : ''}</Col>
                        </Row>
                    </ListGroup.Item>
                    <ListGroup.Item>
                        <Row>
                            <Col md={4}><strong>Đánh giá trung bình:</strong></Col>
                            <Col>{dataView?.average_rating || 'Chưa có'} ⭐</Col>
                        </Row>
                    </ListGroup.Item>
                    <ListGroup.Item>
                        <Row>
                            <Col md={4}><strong>Tổng số đánh giá:</strong></Col>
                            <Col>{dataView?.total_reviews || 0}</Col>
                        </Row>
                    </ListGroup.Item>
                    <ListGroup.Item>
                        <Row>
                            <Col md={4}><strong>Trạng thái:</strong></Col>
                            <Col>{dataView?.is_active === 1 ? 'Đang bán' : "Đã ngừng bán"}</Col>
                        </Row>
                    </ListGroup.Item>
                    {dataView?.bundled_products?.length > 0 && (
                        <ListGroup.Item>
                            <strong>Sản phẩm đi kèm:</strong>
                            <ListGroup variant="flush" className="mt-2">
                                {dataView.bundled_products.map((item, index) => (
                                    <ListGroup.Item key={index}>
                                        <Row>

                                            <Col md={4}>
                                                🧩 <strong>{item.bundled_name}</strong>
                                            </Col>
                                            <Col md={4}>
                                                <strong>{`ID: ${item.bundled_product_id}`}</strong>
                                            </Col>
                                            <Col md={4}>
                                                🔻 Giảm: {item.discount_value?.toLocaleString()} VND
                                            </Col>
                                        </Row>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </ListGroup.Item>
                    )}

                </ListGroup>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>Đóng</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ModalViewProduct;
