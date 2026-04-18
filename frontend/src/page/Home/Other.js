
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


    if (error) return <div>Lỗi: {error}</div>;
    if (newsData.length === 0) return <div>Không có dữ liệu</div>;

    return (
        <div >
            <div className='tin-tuc' >
                <div className="tintuc-header">Tin Tức</div>
            </div>
            <div className='tin-tuc' >
                <div className='tin-tuc-s' style={{ marginBottom: "20px" }}>
                    {newsData.map((newsItem, index) => (
                        <div key={index} className="video">
                            {newsItem.linkvideo && (
                                <div className="video-1">
                                    <iframe
                                        width="560"
                                        height="315"
                                        src={newsItem.linkvideo}
                                        title="YouTube video player"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowFullScreen
                                    ></iframe>
                                </div>
                            )}

                            <div className="video-2">
                                <div className='video-3'>
                                    <a href={newsItem.link || "#"}>
                                        <h2 style={{ marginBottom: "10px", fontSize: "25px", fontWeight: 'bold' }}>{newsItem.name}</h2>
                                    </a>

                                    <div className="category" style={{ marginBottom: "10px" }}>
                                        <span className="time">{getTimeAgo(newsItem.update_at)}</span>
                                    </div>

                                    <p style={{ marginBottom: "15px", lineHeight: "1.5" }}>
                                        {newsItem.description}
                                    </p>
                                    <div style={{ textAlign: "right" }}>
                                        <p>
                                            <b>
                                                {newsItem.author}
                                            </b>
                                        </p>
                                    </div>
                                </div>
                                <div className="related" style={{ marginTop: "40px" }}>
                                    <a href="a"><button>Số hóa</button></a>
                                    <a href="a"><button>Điện thoại</button></a>
                                    <a href="a"><button>Iphone</button></a>

                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className='tin-tuc'>
                <div className='tin-tuc-s'>
                    <div className="body-tintuc" id="body-tintuc">
                        {newsDataNews.map((newsItem, index) => (
                            <div key={`news-${index}`} className="tintuc-info">
                                <a href={newsItem.link} target="_blank" rel="noopener noreferrer">
                                    <img src={`${process.env.REACT_APP_BASE_URL}${newsItem.image}`} alt="tin tuc" />
                                    <h2 style={{ marginBottom: "10px", fontSize: "25px", fontWeight: 'bold' }}>{newsItem.name}</h2>
                                </a>
                                <div className="category" style={{ marginBottom: "5px" }}>
                                    <span className="time">{newsItem.author}&nbsp;&nbsp;&nbsp;-&nbsp;&nbsp;&nbsp;{getTimeAgo(newsItem.update_at)}</span>
                                </div>
                                <p>{newsItem.description}</p>


                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div >
    );
};

const TuyenDung = () => {
    return (

        <div className='tuyendung'>
            <div className="body-tuyendung">
                <div className="tuyendung-header">Tuyển dụng</div>
                <div className="tuyendung-info">
                    <h1 className="tieude"><b>NHÂN VIÊN BÁN HÀNG</b></h1>

                    <b>1.MÔ TẢ</b>
                    <ul className="tuyendung-noidung">
                        <li>Vui vẻ, lịch sự chào đón khi khách vào cửa hàng.</li>
                        <li>
                            Tìm hiểu nhu cầu, tư vấn các thông tin về: Sản phẩm, dịch vụ,
                            chương trình khuyến mãi, hậu mãi cho khách hàng.
                        </li>
                        <li>
                            Sắp xếp sản phẩm gọn gàng, hợp lý, vệ sinh cửa hàng khi hết ca làm
                            việc.
                        </li>
                        <li>
                            Nắm bắt, cập nhật thông tin, tính năng của sản phẩm mới: form sản
                            phẩm, chất liệu, màu sắc, kiểu dáng...
                        </li>
                    </ul>

                    <b>2.THỜI GIAN LÀM VIỆC</b>
                    <ul className="tuyendung-noidung">
                        <li><span>Từ 18h – 21h30 các ngày trong tuần</span></li>
                        <li>Nghỉ 3 ngày/ tháng</li>
                    </ul>

                    <b>3.ĐỊA ĐIỂM LÀM VIỆC</b>
                    <ul className="tuyendung-noidung">
                        <span>P. Nguyễn Trác, Yên Nghĩa, Hà Đông, Hà Nội</span>
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
                        <li><span>Số lượng cần tuyển: 02</span></li>
                    </ul>

                    <b>5.QUYỀN LỢI</b>
                    <ul className="tuyendung-noidung">
                        <li>Thu nhập: <span>5.000.000 - 7.000.000 VNĐ/tháng.</span></li>
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

                    <b>6.LIÊN HỆ</b>
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
                        <li>Hoặc gửi CV qua email:<b> dminhphuong97@gmail.com</b></li>
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
                        <h2> <b>CÔNG TY CỔ PHẦN TECHWORLD</b> </h2><br />
                        <p>
                            <b>Địa chỉ:</b> P. Nguyễn Trác, Yên Nghĩa, Hà Đông, Hà Nội<br />
                            <b>Telephone:</b> 0123456789<br />
                            <b>Hotline:</b> 0123456789 - CSKH: 0123456789<br />
                            <b>Website:</b> <a href="https://github.com/dinorap">Github</a> <br />
                            <b>E-mail:</b> dminhphuong97@gmail.com<br />
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