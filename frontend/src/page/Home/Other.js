
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
                        <h2>Nhân viên bán hàng Part-time</h2>
                        <p className="highlight-desc">
                            Gia nhập đội ngũ Thế giới công nghệ để làm việc trong môi trường năng động,
                            được đào tạo kỹ năng tư vấn và cập nhật sản phẩm công nghệ mới liên tục.
                        </p>
                        <div className="highlight-meta">
                            <span>Thu nhập: 5 - 7 triệu/tháng</span>
                            <span>Khu vực: Hà Đông, Hà Nội</span>
                            <span>Số lượng: 02</span>
                        </div>
                    </div>
                    <h1 className="tieude"><b>NHÂN VIÊN BÁN HÀNG</b></h1>

                    <b>1.MÔ TẢ</b>
                    <ul className="tuyendung-noidung">
                        <li>Đón tiếp khách hàng với thái độ chuyên nghiệp, thân thiện.</li>
                        <li>
                            Tìm hiểu nhu cầu và tư vấn sản phẩm, dịch vụ, chương trình ưu đãi
                            phù hợp với từng khách hàng.
                        </li>
                        <li>
                            Trưng bày sản phẩm gọn gàng, hỗ trợ vệ sinh khu vực bán hàng
                            cuối ca.
                        </li>
                        <li>
                            Cập nhật kiến thức về sản phẩm mới để tư vấn chính xác và tăng trải nghiệm mua sắm.
                        </li>
                    </ul>

                    <b>2.THỜI GIAN LÀM VIỆC</b>
                    <ul className="tuyendung-noidung">
                        <li><span>Từ 18h – 21h30 các ngày trong tuần</span></li>
                        <li>Nghỉ 3 ngày/ tháng</li>
                        <li>Có thể linh hoạt đổi ca theo lịch học/lịch cá nhân (báo trước).</li>
                    </ul>

                    <b>3.ĐỊA ĐIỂM LÀM VIỆC</b>
                    <ul className="tuyendung-noidung">
                        <li>P. Nguyễn Trác, Yên Nghĩa, Hà Đông, Hà Nội</li>
                    </ul>

                    <b>4.YÊU CẦU</b>
                    <ul className="tuyendung-noidung">
                        <li>Nam/Nữ, tuổi từ 18 - 25.</li>
                        <li>Tính cách hòa đồng, thân thiện, niềm nở.</li>
                        <li>
                            Có kỹ năng giao tiếp, thuyết phục, đàm phán tốt với khách hàng.
                        </li>
                        <li>Kiên trì, năng động, trung thực, nhiệt tình.</li>
                        <li>
                            Yêu thích công nghệ, giao tiếp, chăm sóc khách hàng. Ưu tiên các
                            ứng viên đã làm việc tại các shop bán điện thoại, điện máy.
                        </li>
                        <li><span>Số lượng cần tuyển: 02 nhân sự</span></li>
                    </ul>

                    <b>5.KỸ NĂNG ƯU TIÊN</b>
                    <ul className="tuyendung-noidung">
                        <li>Biết sử dụng mạng xã hội cơ bản để hỗ trợ tư vấn và chăm sóc khách.</li>
                        <li>Có khả năng chụp ảnh/quay video sản phẩm là một lợi thế.</li>
                        <li>Ưu tiên ứng viên có thể làm việc ổn định tối thiểu 6 tháng.</li>
                    </ul>

                    <b>6.QUYỀN LỢI</b>
                    <ul className="tuyendung-noidung">
                        <li>Thu nhập: <span>5.000.000 - 7.000.000 VNĐ/tháng</span>.</li>
                        <li>Hoa hồng hưởng theo doanh thu bán hàng của cửa hàng.</li>
                        <li>Thưởng thêm theo tăng trưởng cửa hàng.</li>
                        <li>
                            Phụ cấp, thưởng thêm theo chế độ công ty (Làm thêm, gửi xe, sinh
                            nhật, Lễ tết….)
                        </li>
                        <li>Hưởng đầy đủ các chính sách theo luật lao động.</li>
                        <li>Được đào tạo về chuyên môn & kỹ năng trước khi làm việc.</li>
                        <li>
                            Được tiếp xúc với những sản phẩm công nghệ mới nhất hiện nay.
                        </li>
                    </ul>

                    <b>7.QUY TRÌNH ỨNG TUYỂN</b>
                    <ul className="tuyendung-noidung">
                        <li>Điền biểu mẫu hoặc gửi CV theo thông tin liên hệ bên dưới.</li>
                        <li>Bộ phận tuyển dụng sẽ liên hệ trong vòng 3 - 5 ngày làm việc.</li>
                        <li>Phỏng vấn 1 vòng trực tiếp tại cửa hàng.</li>
                    </ul>

                    <b>8.LIÊN HỆ</b>
                    <ul className="tuyendung-noidung">
                        <li>
                            Ứng viên điền thông tin theo link:
                            <a href="https://docs.google.com/forms/d/e/1FAIpQLSdIYTjN3l4VwkFYiQyNqkhD465Ussl-BTHCzU8p5sd1Ne-7iQ/viewform?usp=sf_link"
                            >
                                <span>Tuyển dụng</span>
                            </a>
                        </li>
                        <li>
                            Hoặc nộp hồ sơ trực tiếp tại
                            <b>P. Nguyễn Trác, Yên Nghĩa, Hà Đông, Hà Nội</b>
                        </li>
                        <li>Hoặc gửi CV qua email: <b>hr@thegioicongnghe.vn</b></li>
                        <li>Hotline tuyển dụng: <b>0123 456 789</b> (08:30 - 17:30)</li>
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
                        Chúng tôi luôn đem lại cho khách hàng sự hài lòng và thỏa mãn với
                        tất cả các sản phẩm của mình.<br />
                        Bên cạnh đó là đội ngũ nhân viên nhiệt tình chu đáo và đầy kinh
                        nghiệm của chúng tôi luôn đưa được ra cho khách hàng những thông tin
                        có giá trị và giúp khách hàng lựa chọn được những sản phẩm phù hợp
                        nhất.<br />
                        Để nâng cao thương hiệu của mình, mục tiêu của chúng tôi trong thời
                        gian tới là cung cấp đến tận tay khách hàng những sản phẩm chính
                        hãng với chất lượng đảm bảo và uy tín cũng như giá cả hợp lý
                        nhất.<br />
                        Chúng tôi mong muốn sự đóng góp của khách hàng sẽ giúp chúng tôi
                        ngày một phát triển để từ đó củng cố thêm lòng tin của khách hàng
                        với chúng tôi. Chúng tôi rất biết ơn sự tin tưởng của khách hàng
                        trong suốt gần 10 năm qua và chúng tôi luôn tâm niệm rằng cần phải
                        cố gắng hơn nữa để xứng đáng với phương châm đề ra “Nếu những gì
                        chúng tôi không có, nghĩa là bạn không cần .<br />
                        Chúng tôi xin chân thành cảm ơn tất cả các khách hàng đã, đang và sẽ
                        ủng hộ chúng tôi.
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
                                    CÁC TRUNG TÂM BẢO HÀNH CỦA THẾ GIỚI CÔNG NGHỆ
                                </div>
                            </td>
                        </tr>
                        <tr style={{ height: "40px" }}>
                            <th>STT</th>
                            <th>Địa chỉ</th>
                            <th>Điện thoại</th>
                            <th>Thời gian làm việc</th>
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
                                    : '8h00 - 17h00'}
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
                            <b>Địa chỉ:</b> P. Nguyễn Trác, Yên Nghĩa, Hà Đông, Hà Nội<br />
                            <b>Telephone:</b> 0123456789<br />
                            <b>Hotline:</b> 0123456789 - CSKH: 0123456789<br />
                            <b>Website:</b> <a href="https://github.com/Linh21010581">Github</a> <br />
                            <b>E-mail:</b> abc@gmail.com<br />
                            <b>Mã số thuế:</b> 99 99 99 99 99<br />
                            <b>Tài khoản ngân hàng :</b><br />
                            <b>Số TK:</b> 000000000000 <br />
                            <b>Tại Ngân hàng:</b> MB bank <br /><br />
                            Quý khách có thể gửi phản hồi hoạc đóng góp tới chúng tôi bằng <a href="https://docs.google.com/forms/d/e/1FAIpQLSdIYTjN3l4VwkFYiQyNqkhD465Ussl-BTHCzU8p5sd1Ne-7iQ/viewform?usp=sf_link"
                            >
                                <b>Biểu mẫu này</b>
                            </a> . Chúng tôi
                            sẽ phản hồi thông tin qua email của quý khách. Hân hạnh phục vụ và chân thành
                            cảm ơn sự quan tâm, đóng góp ý kiến đến Thế giới công nghệ.
                        </p>
                    </div>
                    <div className="info-right">
                        <iframe width="100%" height="450" title="Map"
                            src="https://maps.google.com/maps?width=100%&amp;height=450&amp;hl=en&amp;q=Trường%20đại%20học%20Phenikaa%20P.%20Nguyễn%20Trác,%20Yên%20Nghĩa,%20Hà%20Đông,%20Hà%20Nội&amp;ie=UTF8&amp;t=&amp;z=16&amp;iwloc=B&amp;output=embed"
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