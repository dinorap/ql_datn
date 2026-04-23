
import { getAllStoreLocations } from '../../services/apiCartService';
import { getNews } from '../../services/apiNewsService';
import './Other.scss'
import React from "react";
import { useState, useEffect } from 'react';

const TinTuc = () => {
    const [newsData, setNewsData] = useState([]);
    const [newsDataNews, setNewsDataNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedItems, setExpandedItems] = useState({});

    const getTimeAgo = (createdAt) => {
        if (!createdAt) return "Vừa xong";

        const createdDate = new Date(createdAt);
        const now = new Date();
        const seconds = Math.floor((now - createdDate) / 1000);

        let interval = Math.floor(seconds / 31536000);
        if (interval >= 1) return `${interval} năm trước`;

        interval = Math.floor(seconds / 2592000);
        if (interval >= 1) return `${interval} tháng trước`;

        interval = Math.floor(seconds / 86400);
        if (interval >= 1) return `${interval} ngày trước`;

        interval = Math.floor(seconds / 3600);
        if (interval >= 1) return `${interval} giờ trước`;

        interval = Math.floor(seconds / 60);
        if (interval >= 1) return `${interval} phút trước`;

        return "Vừa xong";
    };

    const truncateText = (text, maxLength) => {
        if (!text) return "";
        if (text.length <= maxLength) return text;
        return `${text.slice(0, maxLength).trim()}...`;
    };

    const toggleExpand = (key) => {
        setExpandedItems((prev) => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const renderDescription = (text, maxLength, expandKey) => {
        if (!text) return "Đang cập nhật nội dung";
        const isLong = text.length > maxLength;
        const isExpanded = !!expandedItems[expandKey];

        if (!isLong) return text;

        return (
            <>
                {isExpanded ? text : truncateText(text, maxLength)}
                <button
                    type="button"
                    className="read-more-btn"
                    onClick={() => toggleExpand(expandKey)}
                >
                    {isExpanded ? " Thu gọn" : " Xem thêm"}
                </button>
            </>
        );
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await getNews(1);
                const response1 = await getNews(0)
                if (response) {
                    setNewsData(response.data);
                }
                if (response1) {
                    setNewsDataNews(response1.data)
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);


    const featuredNews = newsDataNews[0];
    const secondaryNews = newsDataNews.slice(1);

    if (error) return <div className="news-status">Lỗi: {error}</div>;
    if (loading) return <div className="news-status">Đang tải tin tức...</div>;
    if (newsData.length === 0 && newsDataNews.length === 0) return <div className="news-status">Không có dữ liệu</div>;

    return (
        <div className="news-page">
            <section className="news-hero">
                <div className="news-heading">
                    <p className="news-kicker">Thế giới công nghệ Magazine</p>
                    <h1>Toàn Cảnh Tin Tức Công Nghệ</h1>
                    <span className="news-subtitle">Cập nhật xu hướng mới, đánh giá chuyên sâu và điểm nóng thị trường mỗi ngày</span>
                </div>
            </section>

            <section className="news-editorial">
                {featuredNews && (
                    <article className="news-featured">
                        <a href={featuredNews.link} target="_blank" rel="noopener noreferrer">
                            <img src={`${process.env.REACT_APP_BASE_URL}${featuredNews.image}`} alt="tin tức nổi bật" />
                        </a>
                        <div className="featured-content">
                            <div className="featured-meta">
                                <span>{featuredNews.author || "Ban biên tập"}</span>
                                <span>{getTimeAgo(featuredNews.update_at)}</span>
                            </div>
                            <a href={featuredNews.link} target="_blank" rel="noopener noreferrer">
                                <h2>{featuredNews.name}</h2>
                            </a>
                            <p>
                                {renderDescription(featuredNews.description, 180, "featured")}
                            </p>
                        </div>
                    </article>
                )}

                <div className="news-spotlight">
                    <h3>Bản tin nổi bật</h3>
                    {newsData.map((newsItem, index) => (
                        <article key={index} className="spotlight-item">
                            <div className="spotlight-video">
                                {newsItem.linkvideo ? (
                                    <iframe
                                        width="560"
                                        height="315"
                                        src={newsItem.linkvideo}
                                        title="YouTube video player"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowFullScreen
                                    ></iframe>
                                ) : (
                                    <div className="spotlight-empty">Chưa có video</div>
                                )}
                            </div>
                            <div className="spotlight-content">
                                <a href={newsItem.link || "#"} target="_blank" rel="noopener noreferrer">
                                    <h4>{newsItem.name}</h4>
                                </a>
                                <p>
                                    {renderDescription(newsItem.description, 210, `spotlight-${index}`)}
                                </p>
                                <div className="spotlight-meta">
                                    <span>{newsItem.author || "Ban biên tập"}</span>
                                    <span>{getTimeAgo(newsItem.update_at)}</span>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            <section className="news-grid">
                <div className="news-grid-title">
                    <h3>Tin mới cập nhật</h3>
                </div>
                <div className="news-grid-list" id="body-tintuc">
                    {secondaryNews.map((newsItem, index) => (
                        <article key={`news-${index}`} className="news-card">
                            <a href={newsItem.link} target="_blank" rel="noopener noreferrer">
                                <img src={`${process.env.REACT_APP_BASE_URL}${newsItem.image}`} alt="tin tức" />
                            </a>
                            <div className="news-card-content">
                                <a href={newsItem.link} target="_blank" rel="noopener noreferrer">
                                    <h4>{newsItem.name}</h4>
                                </a>
                                <div className="news-card-meta">
                                    <span>{newsItem.author || "Ban biên tập"}</span>
                                    <span>{getTimeAgo(newsItem.update_at)}</span>
                                </div>
                                <p>
                                    {renderDescription(newsItem.description, 110, `card-${index}`)}
                                </p>
                            </div>
                        </article>
                    ))}
                    {secondaryNews.length === 0 && (
                        <div className="news-status">Chưa có thêm bài viết khác</div>
                    )}
                </div>
            </section>
        </div>
    );
};

const TuyenDung = () => {
    return (

        <div className='tuyendung'>
            <div className="body-tuyendung">
                <div className="tuyendung-header">Tuyển dụng</div>
                <div className="tuyendung-info">
                    <div className="tuyendung-highlight">
                        <p className="highlight-label">Vị trí đang mở</p>
                        <h2>Chuyên viên Nội dung Sản phẩm (Full-time)</h2>
                        <p className="highlight-desc">
                            Trực tiếp xây dựng nội dung mô tả sản phẩm, kịch bản livestream và
                            chiến dịch truyền thông ngắn hạn cho các đợt ra mắt thiết bị mới.
                        </p>
                        <div className="highlight-meta">
                            <span>Thu nhập: 12 - 18 triệu/tháng + thưởng hiệu quả</span>
                            <span>Địa điểm: Hybrid (2 ngày remote/tuần)</span>
                            <span>Số lượng: 03</span>
                        </div>
                    </div>
                    <h1 className="tieude"><b>CHUYÊN VIÊN NỘI DUNG SẢN PHẨM</b></h1>

                    <b>1.MÔ TẢ</b>
                    <ul className="tuyendung-noidung">
                        <li>
                            Viết nội dung cho landing page, bài social và kịch bản video ngắn
                            theo từng nhóm sản phẩm.
                        </li>
                        <li>
                            Phối hợp với đội Media quay review nhanh, unbox và clip so sánh tính năng.
                        </li>
                        <li>
                            Nghiên cứu insight khách hàng để chuyển hóa thành thông điệp bán hàng
                            rõ ràng, dễ hiểu.
                        </li>
                        <li>
                            Cập nhật trend công nghệ hàng tuần và đề xuất mini-campaign phù hợp
                            từng giai đoạn bán hàng.
                        </li>
                        <li>
                            Theo dõi hiệu quả nội dung qua số liệu click, thời gian đọc và tỷ lệ chuyển đổi.
                        </li>
                    </ul>

                    <b>2.THỜI GIAN LÀM VIỆC</b>
                    <ul className="tuyendung-noidung">
                        <li><span>Thứ 2 - Thứ 6: 08:30 - 17:30</span></li>
                        <li><span>Thứ 7 linh hoạt: 09:00 - 12:00 (2 buổi/tháng)</span></li>
                        <li>Nghỉ Chủ nhật và các ngày lễ theo quy định.</li>
                        <li>Áp dụng mô hình Hybrid sau 2 tháng thử việc.</li>
                    </ul>

                    <b>3.ĐỊA ĐIỂM LÀM VIỆC</b>
                    <ul className="tuyendung-noidung">
                        <li>Văn phòng Creative Hub - Khu đô thị Dương Nội, Hà Đông, Hà Nội.</li>
                        <li>Có thể làm việc từ xa 2 ngày/tuần khi đạt KPI ổn định.</li>
                    </ul>

                    <b>4.YÊU CẦU</b>
                    <ul className="tuyendung-noidung">
                        <li>Tốt nghiệp Cao đẳng/Đại học chuyên ngành Marketing, Truyền thông hoặc ngành liên quan.</li>
                        <li>Viết tiếng Việt tốt, có khả năng kể chuyện và trình bày logic.</li>
                        <li>
                            Có tư duy nội dung theo mục tiêu kinh doanh, không chỉ dừng ở viết mô tả.
                        </li>
                        <li>Biết dùng Canva hoặc công cụ chỉnh sửa cơ bản để phối hợp dựng nội dung nhanh.</li>
                        <li>
                            Ưu tiên ứng viên có kinh nghiệm trong lĩnh vực công nghệ, điện tử hoặc thương mại điện tử.
                        </li>
                        <li><span>Số lượng cần tuyển: 03 nhân sự</span></li>
                    </ul>

                    <b>5.KỸ NĂNG ƯU TIÊN</b>
                    <ul className="tuyendung-noidung">
                        <li>Có khả năng viết theo nhiều tone giọng: chuyên gia, gần gũi, bán hàng.</li>
                        <li>Đã từng vận hành nội dung cho TikTok, Facebook Reels hoặc YouTube Shorts.</li>
                        <li>Biết đọc các chỉ số cơ bản trên Meta, Google Analytics là lợi thế.</li>
                        <li>Có portfolio hoặc bài mẫu đính kèm khi ứng tuyển.</li>
                    </ul>

                    <b>6.QUYỀN LỢI</b>
                    <ul className="tuyendung-noidung">
                        <li>Mức lương cứng: <span>12.000.000 - 18.000.000 VNĐ/tháng</span> tùy năng lực.</li>
                        <li>Thưởng KPI theo quý từ 1 - 3 tháng lương.</li>
                        <li>Ngân sách học tập 5.000.000 VNĐ/năm cho các khóa kỹ năng chuyên môn.</li>
                        <li>Trang bị laptop làm việc, phụ cấp gửi xe và ăn trưa.</li>
                        <li>Bảo hiểm đầy đủ, 12 ngày phép/năm và thêm 1 ngày nghỉ sinh nhật.</li>
                        <li>Tham gia team building, workshop công nghệ và ngày Demo nội bộ hàng tháng.</li>
                    </ul>

                    <b>7.QUY TRÌNH ỨNG TUYỂN</b>
                    <ul className="tuyendung-noidung">
                        <li>Gửi CV + portfolio về email tuyển dụng bên dưới.</li>
                        <li>Vòng 1: Screening hồ sơ trong 48 giờ làm việc.</li>
                        <li>Vòng 2: Bài test viết nội dung ngắn (45 phút, online).</li>
                        <li>Vòng 3: Phỏng vấn chuyên môn và trao đổi offer.</li>
                    </ul>

                    <b>8.LIÊN HỆ</b>
                    <ul className="tuyendung-noidung">
                        <li>
                            Nộp hồ sơ nhanh tại form:
                            <a href="https://forms.gle/3k9fV3R9x2MContentLab">
                                <span>Ứng tuyển ngay</span>
                            </a>
                        </li>
                        <li>
                            Email: <b>talent@thegioicongnghe.vn</b> (tiêu đề: [Content] Họ tên)
                        </li>
                        <li>Hotline tuyển dụng: <b>0899 668 225</b> (09:00 - 18:00, Thứ 2 - Thứ 6)</li>
                        <li>Địa chỉ văn phòng: <b>Creative Hub, Hà Đông, Hà Nội</b></li>
                    </ul>
                </div>
            </div>
        </div >

    )
}

const GioiThieu = () => {
    return (
        <div className='gioithieu'>
            <div className="page-gt">
                <h4 className="page-header"><b>Giới thiệu</b></h4>
                <div className="page-info">
                    <p>
                        Chúng tôi xây dựng Thế Giới Công Nghệ như một hệ sinh thái mua sắm
                        thiết bị thông minh dành cho người dùng hiện đại: nhanh, minh bạch
                        và cá nhân hóa theo nhu cầu thực tế.<br />
                        Không chỉ bán sản phẩm, đội ngũ của chúng tôi tập trung vào trải nghiệm
                        trọn vòng đời: tư vấn đúng nhu cầu, hỗ trợ thiết lập ban đầu, bảo hành
                        rõ ràng và đồng hành trong suốt quá trình sử dụng.<br />
                        Mỗi sản phẩm trước khi lên kệ đều được kiểm tra nguồn gốc, chính sách
                        hậu mãi và chất lượng vận hành để đảm bảo khách hàng nhận đúng giá trị
                        đã cam kết.<br />
                        Chúng tôi đầu tư liên tục vào nội dung hướng dẫn, review thực tế và
                        dịch vụ chăm sóc sau bán để khách hàng có thể ra quyết định dễ dàng
                        ngay cả khi chưa am hiểu sâu về công nghệ.<br />
                        Trong giai đoạn phát triển mới, mục tiêu của chúng tôi là trở thành
                        điểm đến tin cậy cho mọi nhu cầu công nghệ cá nhân và gia đình, với
                        chuẩn phục vụ ngày càng chuyên nghiệp, linh hoạt và tử tế.<br />
                        Cảm ơn bạn đã tin tưởng lựa chọn Thế Giới Công Nghệ. Sự hài lòng của
                        bạn là tiêu chuẩn vận hành quan trọng nhất của chúng tôi mỗi ngày.
                    </p>
                </div>
            </div>
        </div>
    )
}

const BaoHanh = () => {
    const [centers, setCenters] = useState([]);

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const res = await getAllStoreLocations();
                if (res?.EC === 0 && Array.isArray(res.data)) {
                    setCenters(res.data);
                }
            } catch (error) {
                console.error('Lỗi khi lấy danh sách trung tâm bảo hành:', error);
            }
        };
        fetchLocations();
    }, []);

    return (
        <div className="baohanh">
            <div className="baohanh-page">

                <table>
                    <thead>
                        <tr>
                            <td colSpan="4" className="header-table">

                                <div className="marquee-title">
                                    HỆ THỐNG TRUNG TÂM HỖ TRỢ & BẢO HÀNH THẾ GIỚI CÔNG NGHỆ
                                </div>
                            </td>
                        </tr>
                        <tr style={{ height: "40px" }}>
                            <th>STT</th>
                            <th>Trung tâm / Địa chỉ</th>
                            <th>Hotline hỗ trợ</th>
                            <th>Giờ tiếp nhận</th>
                        </tr>
                    </thead>
                    {centers.map((center, index) => (
                        <tr key={index}>
                            <td>{index + 1}</td>
                            <td>
                                <a
                                    href={`https://maps.google.com/maps?q=${encodeURIComponent(center.address)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {center.address}
                                </a>
                            </td>
                            <td>{center.phone}</td>
                            <td>
                                {center.open_time && center.close_time
                                    ? `${center.open_time} - ${center.close_time}`
                                    : '08:30 - 17:30'}
                            </td>
                        </tr>
                    ))}
                </table>
            </div>
        </div>
    );
};

const LienHe = () => {
    return (
        <div>
            <GioiThieu />
            <BaoHanh />
            <div className='lienhe'>
                <div className="body-lienhe">
                    <div className="lienhe-header">Liên hệ</div>
                    <div className="lienhe-info">
                    <div className="info-left">
                        <h2> <b>CÔNG TY CỔ PHẦN THẾ GIỚI CÔNG NGHỆ</b> </h2><br />
                        <p>
                            <b>Trụ sở chính:</b> Tòa nhà FreeLand Hub, KĐT Dương Nội, Hà Đông, Hà Nội<br />
                            <b>Điện thoại:</b> 024 7108 8899<br />
                            <b>Hotline bán hàng:</b> 0899 668 225<br />
                            <b>Hotline CSKH:</b> 1900 63 66 82<br />
                            <b>Website:</b> <a href="https://freelandtech.vn">freelandtech.vn</a> <br />
                            <b>E-mail:</b> hello@freelandtech.vn<br />
                            <b>Mã số thuế:</b> 0109 888 321<br />
                            <b>Tài khoản ngân hàng:</b><br />
                            <b>Số TK:</b> 0888668225 <br />
                            <b>Tại Ngân hàng:</b> MB Bank - CN Hà Đông <br /><br />
                            Bạn có thể gửi phản hồi, góp ý hoặc đề xuất hợp tác qua <a href="https://forms.gle/Za9sXhY8Q9fR4vQG7"
                            >
                                <b>biểu mẫu liên hệ trực tuyến</b>
                            </a> . Chúng tôi
                            sẽ phản hồi trong vòng 24 giờ làm việc qua email hoặc số điện thoại bạn để lại.
                            Thế giới công nghệ luôn trân trọng mọi góp ý để cải thiện sản phẩm và dịch vụ mỗi ngày.
                        </p>
                    </div>
                    <div className="info-right">
                        <iframe width="100%" height="450" title="Map"
                            src="https://maps.google.com/maps?width=100%&amp;height=450&amp;hl=vi&amp;q=Khu%20%C4%91%C3%B4%20th%E1%BB%8B%20D%C6%B0%C6%A1ng%20N%E1%BB%99i,%20H%C3%A0%20%C4%90%C3%B4ng,%20H%C3%A0%20N%E1%BB%99i&amp;ie=UTF8&amp;t=&amp;z=15&amp;iwloc=B&amp;output=embed"
                            frameBorder="0" scrolling="no" marginHeight="0" marginWidth="0">
                            <a href="https://www.maps.ie/create-google-map/">Embed Google Map</a>
                        </iframe>
                        <br />
                    </div>
                </div>
            </div>
        </div>
        </div>
    )
}
export {
    TinTuc, TuyenDung, LienHe, BaoHanh, GioiThieu
}