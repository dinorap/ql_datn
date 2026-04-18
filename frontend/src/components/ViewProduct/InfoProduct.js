import React, { useEffect } from 'react';
import dayjs from 'dayjs';
import './InfoProduct.scss';
import { FaCartPlus } from "react-icons/fa";
import { addToCart } from '../../services/apiCartService';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { IoWarningOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import { setCartCount } from '../../redux/slices/userSlice';
import { getCartCount } from '../../services/apiCartService';
import { getLocalCartCount } from './count';
const InfoProduct = ({
  product,
  variants,
  selectedVariant,
  selectedOption,
  selectedRam,
  selectedRom,
  onSelectVariant,
  onSelectRam,
  onSelectRom,
  setShowDetail,
  scrollToReview,
  setSelectedOption
}) => {

  const isAuthenticated = useSelector(state => state.user.isAuthenticated);
  const account = useSelector(state => state.user.account);
  const navigate = useNavigate();
  const dispatch = useDispatch();


  const matchedOption = selectedVariant?.options?.find(
    opt => opt.ram === selectedRam && opt.rom === selectedRom
  );
  const isOutOfStock = matchedOption?.stock_quantity === 0;
  useEffect(() => {
    if (selectedVariant?.options && selectedRam && selectedRom) {
      const option = selectedVariant.options.find(
        (opt) => opt.ram === selectedRam && opt.rom === selectedRom
      );
      setSelectedOption(option || null);
    }
  }, [selectedVariant, selectedRam, selectedRom]);


  useEffect(() => {
    if (selectedVariant) {
      const allRams = [...new Set(selectedVariant.options.map(opt => opt.ram))];
      if (!allRams.includes(selectedRam)) {
        onSelectRam(allRams[0]);
      }
      const allRoms = [...new Set(selectedVariant.options.map(opt => opt.rom))];
      if (!allRoms.includes(selectedRom)) {
        onSelectRom(allRoms[0]);
      }
    }
  }, [selectedVariant]);
  const saveToLocalCart = (optionId, quantity = 1) => {
    let localCart = JSON.parse(localStorage.getItem("temp_cart")) || [];

    const existing = localCart.find(item => item.option_id === optionId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      const maxId = localCart.reduce((max, item) => {
        return item.cart_item_id > max ? item.cart_item_id : max;
      }, 0);

      const newItem = {
        option_id: optionId,
        quantity,
        cart_item_id: maxId + 1,
      };
      localCart.push(newItem);
    }

    localStorage.setItem("temp_cart", JSON.stringify(localCart));
  };


  const handleAddToCart = async () => {
    try {
      if (!isAuthenticated) {
        saveToLocalCart(matchedOption.id, 1);
        const count = getLocalCartCount();
        dispatch(setCartCount(count));
        toast.info("Bạn chưa đăng nhập, sản phẩm đã được lưu tạm vào giỏ hàng");
        return;
      }
      if (!matchedOption) {
        toast.warning('Vui lòng chọn đầy đủ thông tin sản phẩm');
        return;
      }
      const data = {
        user_id: account?.id,
        option_id: matchedOption.id,
        quantity: 1
      };
      const response = await addToCart(data);
      if (response.EC === 0) {
        toast.success('Thêm vào giỏ hàng thành công');
        let res = await getCartCount(account?.id);
        if (res && res.count && res.EC === 0) {
          dispatch(setCartCount(Number(res.count)));
        } else {
          dispatch(setCartCount(0));
        }
      } else {
        toast.error(response.EM || 'Có lỗi xảy ra');
      }
    } catch (error) {


    }
  };

  const handleBuyNow = async () => {
    try {
      if (!isAuthenticated) {
        saveToLocalCart(matchedOption.id, 1);
        const count = getLocalCartCount();
        dispatch(setCartCount(count));
        toast.info("Bạn chưa đăng nhập, sản phẩm đã được lưu tạm vào giỏ hàng");
        navigate('/cart');
        return;
      }
      if (!matchedOption) {
        toast.warning('Vui lòng chọn đầy đủ thông tin sản phẩm');
        return;
      }
      const data = {
        user_id: account?.id,
        option_id: matchedOption.id,
        quantity: 1
      };
      const response = await addToCart(data);
      if (response.EC === 0) {
        let res = await getCartCount(account?.id);
        if (res && res.count && res.EC === 0) {
          dispatch(setCartCount(Number(res.count)));
        } else {
          dispatch(setCartCount(0));
        }
        navigate('/cart');
      } else {
        toast.error(response.EM || 'Có lỗi xảy ra');
      }
    } catch (error) {

    }
  };

  const handleSelectRam = (ram) => {
    onSelectRam(ram);
    const romsForRam = selectedVariant?.options
      .filter(opt => opt.ram === ram)
      .map(opt => opt.rom);
    if (!romsForRam.includes(selectedRom)) {
      onSelectRom(romsForRam[0]);
    }
  };

  const handleSelectRom = (rom) => {
    onSelectRom(rom);
    const ramsForRom = selectedVariant?.options
      .filter(opt => opt.rom === rom)
      .map(opt => opt.ram);
    if (!ramsForRom.includes(selectedRam)) {
      onSelectRam(ramsForRom[0]);
    }
  };

  const filteredRams = React.useMemo(() => {
    if (!selectedVariant) return [];
    return [...new Set(selectedVariant.options.map(opt => opt.ram))];
  }, [selectedVariant]);

  const filteredRoms = React.useMemo(() => {
    if (!selectedVariant || !selectedRam) return [];
    return [
      ...new Set(
        selectedVariant.options
          .filter(opt => opt.ram === selectedRam)
          .map(opt => opt.rom)
      ),
    ];
  }, [selectedVariant, selectedRam]);

  return (
    <>
      <div className="variant-option-wrapper">
        <div className='product-name'>
          {product.name + " " + selectedVariant.color + " " + selectedRam + " " + selectedRom}
        </div>
        <div className='product-info'>
          <div className="product">{product.product_code}</div>
          <div className="evaluate">
            <span className="star">★</span>
            <span className="score">{product.average_rating}</span>
            <span className="count" onClick={scrollToReview}>{product.total_reviews} Đánh giá</span>
            <span className="specifications" onClick={() => setShowDetail(true)}>Thông số kỹ thuật</span>
          </div>
        </div>
        <div className="variant-selector">
          <div className='title-selector'><p>Màu sắc</p></div>
          <div className='selector'>
            {variants.map((variant) => (
              <button
                key={variant.id}
                className={`toggle-button-group${variant.id === selectedVariant?.id ? ' active' : ''} color`}
                onClick={() => onSelectVariant(variant)}
              >
                <div>
                  <img className="img-color" src={`${process.env.REACT_APP_BASE_URL}${variant?.images[0]}`} alt={variant.color} />{variant.color}
                </div>
              </button>
            ))}
          </div>
        </div>
        {selectedVariant && (
          <>
            <div className="variant-selector">
              <div className='title-selector'><p>Ram</p></div>
              <div className='selector'>
                {filteredRams.map((ram, index) => (
                  <button
                    key={index}
                    className={`toggle-button-group${ram === selectedRam ? ' active' : ''}`}
                    onClick={() => handleSelectRam(ram)}
                  >
                    {ram}
                  </button>
                ))}
              </div>
            </div>

            <div className="variant-selector">
              <div className='title-selector'><p>Dung lượng</p></div>
              <div className='selector'>
                {filteredRoms.map((rom, index) => (
                  <button
                    key={index}
                    className={`toggle-button-group${rom === selectedRom ? ' active' : ''}`}
                    onClick={() => handleSelectRom(rom)}
                  >
                    {rom}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="variant-price">
        <div className="price_installment">
          {product.is_installment_available === 1 ? (
            <>
              <div className="price">
                <div className="final_price">{selectedOption?.final_price?.toLocaleString()}₫
                  {selectedVariant?.promotion?.promotion_code === 'custom_price' && ' - Giá HOT'}
                </div>
                {selectedVariant?.promotion && (
                  <div className="base_price">
                    <span className="base-price-small">{selectedOption?.base_option_price.toLocaleString()}₫</span>
                    {selectedVariant?.promotion?.promotion_code !== 'custom_price' && (
                      <span className="discount">
                        - {parseFloat(selectedVariant.promotion.discount_value).toLocaleString()}
                        {selectedVariant.promotion.promotion_code === 'fixed_amount' ? '₫' : '%'}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="price">Hoặc</div>
              <div className="price">
                <div className="installment">Trả góp</div>
                <div className="installment_price">
                  <b>{Math.floor(selectedOption?.final_price / 6).toLocaleString()}₫</b> /Tháng
                </div>
              </div>
            </>
          ) : (
            <div className="price">
              <div className="final_price">{selectedOption?.final_price?.toLocaleString()}₫
                {selectedVariant?.promotion?.promotion_code === 'custom_price' && ' - Giá HOT'}
              </div>
              {selectedVariant?.promotion && (
                <div className="base_price">
                  <span className="base-price-small">{selectedOption?.base_option_price.toLocaleString()}₫</span>
                  {selectedVariant?.promotion?.promotion_code !== 'custom_price' && (
                    <span className="discount">
                      - {parseFloat(selectedVariant.promotion.discount_value).toLocaleString()}
                      {selectedVariant.promotion.promotion_code === 'fixed_amount' ? '₫' : '%'}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        {(selectedVariant?.promotion || product.is_installment_available === 1 || product.description) && (
          <div className="avertise">
            <div className="discount-badge">
              <p className='promotion-name'>Khuyến mãi & ưu đãi được hưởng</p>
            </div>
            <div className='content'>
              {selectedVariant?.promotion && (
                <p>
                  • Giảm ngay {parseFloat(selectedVariant.promotion.discount_value).toLocaleString()}
                  {selectedVariant.promotion.promotion_code === 'fixed_amount' ? '₫' : '%'}
                  &nbsp;áp dụng đến&nbsp;
                  {dayjs(selectedVariant.promotion.end_date).format("DD/MM/YYYY")}
                </p>
              )}
              {product.is_installment_available === 1 && (
                <p>• Trả góp 0% lãi suất, 6 tháng qua thẻ tín dụng </p>
              )}
              {product.description &&
                product.description
                  .split(';')
                  .filter(sentence => sentence.trim() !== '').map((sentence, index) => (
                    <p key={index}>• {sentence.trim()}.</p>
                  ))}

              <p>• Liên hệ trực tiếp với chúng tôi để được tư vấn tốt nhất </p>
            </div>
          </div>
        )}
      </div>

      {matchedOption && isOutOfStock ? (
        <div className="button out-of-stock-msg">
          <IoWarningOutline className='sold-out' />Phiên bản này tạm hết hàng
        </div>
      ) : (
        <div className="button">
          <div className="cart" onClick={handleAddToCart}><FaCartPlus /></div>
          <div className="buy-now" onClick={handleBuyNow}><b>Mua ngay</b></div>
          {product.is_installment_available === 1 && (
            <div className="buy-installment" onClick={handleBuyNow}>
              <b>Trả góp</b>
              <p>Chỉ từ {Math.floor(selectedOption?.final_price / 6).toLocaleString()}₫</p>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default InfoProduct;
