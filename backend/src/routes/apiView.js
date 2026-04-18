const express = require("express");
const { getFlashSaleProducts, getTopProductsByCategory, searchSuggestions, getAllProductsSearch, getOneProductExpandFormat, getAllProductSpecifications, getSimilarProducts, getProductDetail, getProductReviewsPaginate, getRecommendedProductsByUser, getSuggestCart } = require("../controllers/ViewProductController");
const { createProductReview } = require("../controllers/ViewReview");
const { addToCart, deleteCartItemById, getCartByUserId, updateCartItem, getCartCountByUserId, getAllStoreLocations, getAllPayment, getCartFromLocal, mergeCartFromLocal } = require("../controllers/CartController");
const { createOrder, sendOrderConfirmation, getUserOrderHistory, cancelOrder, getPurchasedProducts } = require("../controllers/OrderController");
const { createVnpayPayment, createPaypalPayment, capturePaypalPayment } = require("../controllers/PaymentController");
const { createRecentlyViewedProduct, getAllRecentlyViewedProducts } = require("../controllers/RecentlyViewed");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Public APIs - Không cần xác thực (xem sản phẩm, tìm kiếm)
router.get('/flashsale', getFlashSaleProducts)
router.get('/top-products', getTopProductsByCategory);
router.get('/search-product', searchSuggestions)
router.get('/products', getAllProductsSearch)
router.get('/products/detail/:productId', getProductDetail);
router.get("/products/specs", getAllProductSpecifications);
router.get("/products/similar/:productId", getSimilarProducts);
router.get('/products/reviews/:productId', getProductReviewsPaginate);
router.get('/store-locations', getAllStoreLocations);
router.get('/payment', getAllPayment);

// Protected APIs - Cần xác thực (Access Token)
// Review APIs
router.post('/review', authMiddleware, createProductReview);

// Cart APIs
router.post("/addcart", authMiddleware, addToCart);
router.delete("/delcart/:id", authMiddleware, deleteCartItemById);
router.get('/cart/:user_id', authMiddleware, getCartByUserId);
router.put('/updatecart', authMiddleware, updateCartItem);
router.get('/cartcount/:user_id', authMiddleware, getCartCountByUserId);

// Order APIs
router.post("/add_order", authMiddleware, createOrder);
router.post("/send_order", authMiddleware, sendOrderConfirmation);
router.get("/order/user/:userId", authMiddleware, getUserOrderHistory);
router.put("/order/cancel/:orderId", authMiddleware, cancelOrder);

// Payment APIs
router.post("/payment/vnpay", authMiddleware, createVnpayPayment);
router.post("/payment/paypal/create", authMiddleware, createPaypalPayment);
router.post("/payment/paypal/capture", authMiddleware, capturePaypalPayment);

// Recently Viewed Products APIs
router.post("/recently-viewed", createRecentlyViewedProduct);
router.get("/recently-viewed/:userId", getAllRecentlyViewedProducts);
router.get("/purchase/:userId", authMiddleware, getPurchasedProducts);

// Cart Local Storage APIs
router.post('/cart/local', authMiddleware, getCartFromLocal);
router.post('/cart/merge', authMiddleware, mergeCartFromLocal);

// Product Recommendation APIs
router.get("/products/suggest/:userId", getRecommendedProductsByUser);
router.post('/product/suggest', getSuggestCart)

module.exports = router;