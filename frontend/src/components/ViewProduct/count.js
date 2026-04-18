export const getLocalCartCount = () => {
    try {
        const localCart = JSON.parse(localStorage.getItem("temp_cart")) || [];
        const totalCount = localCart.reduce((sum, item) => sum + item.quantity, 0);
        return totalCount;
    } catch (error) {
        console.error("Lỗi đọc local cart:", error);
        return 0;
    }
};