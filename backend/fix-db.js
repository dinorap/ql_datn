const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '123456',
      database: process.env.DB_DATABASE || 'mobile'
    });

    console.log("Mở rộng giới hạn ký tự cột link...");
    await connection.execute(`ALTER TABLE news MODIFY COLUMN link TEXT`);
    await connection.execute(`ALTER TABLE news MODIFY COLUMN linkvideo TEXT`);

    console.log("Cập nhật bài viết iPhone 17...");
    const desc = "Ngoài lớp vỏ bằng titanium siêu nhẹ, USB-C tốc độ cao chuẩn mới, iPhone 17 Pro Max còn có camera với zoom quang 10x khác biệt hoàn toàn so với bản iPhone 17 Pro. Chuyên gia Trần Xuân Vinh dự đoán Apple ra mắt model hoàn toàn mới là iPhone 17 Ultra giúp thị trường smartphone cao cấp tiếp tục bùng nổ. Bộ bốn iPhone 17 sẽ sớm chính thức cho phép đặt hàng trước tại Việt Nam với mức giá dự kiến cực hấp dẫn, cao nhất khoảng 45 triệu đồng.";

    await connection.execute(
      "UPDATE news SET `name` = ?, `link` = ?, `video` = '1', `linkvideo` = ?, `author` = 'Xuantuhue', `description` = ? WHERE id = '4'",
      [
        'Review trải nghiệm iPhone 17 - Góc nhìn của một người lần đầu dùng Apple',
        'https://tinhte.vn/thread/review-trai-nghiem-iphone-17-goc-nhin-cua-mot-nguoi-lan-dau-dung-apple.4078855/',
        'https://www.youtube.com/embed/iWHPniNYpFM?si=ZNd_qUOTgFxKFe9d&autoplay=1&mute=1',
        desc
      ]
    );

    console.log("Xong!");
    await connection.end();
  } catch (e) {
    console.error(e);
  }
}

run();
