const express = require("express");
const { registerUser, loginUser, forgotPassword, resetPassword, refreshToken, logoutUser } = require("../controllers/authController");
const { getAllUsers, deleteUser, updateUser, createUser, getUserWithPaginate, getUserById, updateLocker } = require("../controllers/UserController");
const { getCompanies, getTypeCompanies, getAdvertise, getAdvertiseWithPaginate, getAllAdvertise, deleteAdvertise, createAdvertise, updateAdvertise } = require('../controllers/AdvertiseController')
const { chatBot } = require('../controllers/chatBotController')
const authMiddleware = require("../middleware/authMiddleware"); // Sửa đúng đường dẫn middleware
const { getNews, getAllNews, getNewsWithPaginate, deleteNews, createNews, updateNews } = require("../controllers/NewsController");
const { getAllProductVariantsExpandFormat, deleteProduct, createProduct, updateProduct, createVariant, updateVariant, createOption, updateOption, updateProductActiveStatus, getBundledProductsByMainProductId, checkLowStock } = require("../controllers/ProductsController");
const { getAllReviewsWithPaginate, replyToReview, updateAdminReply, deleteAdminReply, deleteUserReview, updateReviewActiveStatus } = require("../controllers/ReviewController");
const { getAllPromotionTypesWithPaginate, createPromotionType, updatePromotionType, deletePromotionType, getAllPromotionType } = require("../controllers/PromotionController");
const { updateUserProfile, updateUserPassword } = require("../controllers/ProfileController");
const { updateOrderStatus, getAllOrders } = require("../controllers/OrderController");
const { getTopSellingProducts, getDailyRevenue, getRevenueByCategory } = require("../controllers/StatisticsController");
const {
  getUserAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require("../controllers/UserAddressController");

const router = express.Router();

// Public APIs - Không cần xác thực
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/refresh-token", refreshToken);
router.post("/logout", logoutUser);
router.post('/chatbot', chatBot)

// Public APIs - Xem thông tin công khai
router.get('/companies', getCompanies);
router.get('/companies/:type_id', getTypeCompanies);
router.get('/advertise/:banner', getAdvertise);
router.get('/advertise', getAllAdvertise);
router.get('/news/:video', getNews);
router.get('/news', getAllNews);
router.get('/products/paginate', getAllProductVariantsExpandFormat)
router.get('/products/bundled/:mainProductId', getBundledProductsByMainProductId);
router.get('/review/paginate', getAllReviewsWithPaginate)
router.get('/promotion', getAllPromotionType)

// Protected APIs - Cần xác thực (Access Token)
router.put('/user/profile', authMiddleware, updateUserProfile);
router.put('/user/password', authMiddleware, updateUserPassword);
router.get('/user-address/:user_id', authMiddleware, getUserAddresses);
router.post('/user-address', authMiddleware, createAddress);
router.put('/user-address/:id', authMiddleware, updateAddress);
router.delete('/user-address/:id', authMiddleware, deleteAddress);
router.patch('/user-address/:id/default', authMiddleware, setDefaultAddress);

// Admin APIs - Cần xác thực + quyền admin
router.get('/admin/all', authMiddleware, getAllUsers)
router.get('/admin/user ', authMiddleware, getAllUsers);
router.post('/admin/user', authMiddleware, createUser);
router.get('/admin/user/:id', authMiddleware, getUserById);
router.put('/admin/user/:id', authMiddleware, updateUser);
router.delete('/admin/user/:id', authMiddleware, deleteUser);
router.get('/admin/paginate', authMiddleware, getUserWithPaginate);
router.put('/admin/user/locker/:id', authMiddleware, updateLocker);

// Product Management APIs - Cần xác thực
router.delete('/products', authMiddleware, deleteProduct)
router.post('/products', authMiddleware, createProduct);
router.put('/product/:id', authMiddleware, updateProduct);
router.post('/variants', authMiddleware, createVariant);
router.put('/variants/:id', authMiddleware, updateVariant);
router.post('/options', authMiddleware, createOption);
router.put('/options/:id', authMiddleware, updateOption);
router.put('/products', authMiddleware, updateProductActiveStatus);

// Review Management APIs - Cần xác thực
router.post('/review/reply', authMiddleware, replyToReview)
router.put('/review/:id', authMiddleware, updateAdminReply)
router.delete('/review/reply/:id', authMiddleware, deleteAdminReply)
router.delete('/review/:id', authMiddleware, deleteUserReview)
router.put('/review', authMiddleware, updateReviewActiveStatus);

// Promotion Management APIs - Cần xác thực
router.get('/promotion/paginate', authMiddleware, getAllPromotionTypesWithPaginate)
router.post('/promotion', authMiddleware, createPromotionType)
router.put('/promotion/:id', authMiddleware, updatePromotionType)
router.delete('/promotion/:id', authMiddleware, deletePromotionType)

// Advertise Management APIs - Cần xác thực
router.get('/advertises/paginate', authMiddleware, getAdvertiseWithPaginate);
router.delete('/advertise/:id', authMiddleware, deleteAdvertise)
router.post('/advertise', authMiddleware, createAdvertise);
router.put('/advertise/:id', authMiddleware, updateAdvertise);

// News Management APIs - Cần xác thực
router.get('/newspage/paginate', authMiddleware, getNewsWithPaginate);
router.delete('/news/:id', authMiddleware, deleteNews)
router.post('/news', authMiddleware, createNews);
router.put('/news/:id', authMiddleware, updateNews);

// Order Management APIs - Cần xác thực
router.get('/order', authMiddleware, getAllOrders)
router.put("/order/:id", authMiddleware, updateOrderStatus);

// Statistics APIs - Cần xác thực
router.get("/top-products", authMiddleware, getTopSellingProducts);
router.get("/daily-revenue", authMiddleware, getDailyRevenue);
router.get("/revenue-by-product", authMiddleware, getRevenueByCategory);


router.get('/products/low-stock', checkLowStock);

module.exports = router;