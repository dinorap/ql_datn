import React, { useRef, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getCart, updateCartItem, deleteCartItem, getCartCount, getAllStoreLocations, getAllPayment, getCartLocal } from '../../services/apiCartService';
import { setCartCount } from '../../redux/slices/userSlice';
import './CartView.scss';
import { MdKeyboardArrowDown } from "react-icons/md";
import { FaTrash } from "react-icons/fa";
import { IoGiftOutline } from "react-icons/io5";
import { MdKeyboardArrowLeft } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { FaMapMarkedAlt } from "react-icons/fa";
import { createOrder, sendOrder } from '../../services/apiOrderService';
import { toast } from "react-toastify";
import { createPaypalPayment, createVnpayPayment } from '../../services/apiPayment';
import { CurrentlyViewedSlider, SuggestCartSlider } from '../ViewProduct/HomeView';
import { getLocalCartCount } from '../ViewProduct/count';
import { getBundledProducts } from '../../services/apiViewService';
import AddressSelector from '../../page/User/AddressSelector';
import CardPaymentModal from '../Payment/CardPaymentModal';
import MomoPaymentModal from '../Payment/MomoPaymentModal';
const CartView = () => {
  const navigate = useNavigate();

  const account = useSelector(state => state.user.account);
  const isAuthenticated = useSelector(state => state.user.isAuthenticated);
  const dispatch = useDispatch();
  const [cartItems, setCartItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openColorDropdown, setOpenColorDropdown] = useState(null);
  const [showGiftPopup, setShowGiftPopup] = useState(false);
  const [showAddress, setShowAddress] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [showCart, setShowCart] = useState(true);
  const [showDelivery, setShowDelivery] = useState(true);
  const [showPickUp, setShowPickUp] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [paymentMethod, setPaymentMethod] = useState([]);
  const [errors, setErrors] = useState({});
  const [method, setMethod] = useState('delivery'); const [note, setNote] = useState('');
  const maxLength = 128;
  const [storeData, setStoreData] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [pendingStore, setPendingStore] = useState(null);
  const [isReceiverDifferent, setIsReceiverDifferent] = useState(false);
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const selectedStoreInfo = storeData.find(store => store.id === selectedStore);
  const [reloadSuggest, setReloadSuggest] = useState(0);
  const hasLoadedSavedData = useRef(false);
  const [selectedBundles, setSelectedBundles] = useState({});
  const [showCardPaymentModal, setShowCardPaymentModal] = useState(false);
  const [isTestingCardPayment, setIsTestingCardPayment] = useState(false);
  const [pendingCardOrder, setPendingCardOrder] = useState(null);
  const [showMomoPaymentModal, setShowMomoPaymentModal] = useState(false);
  const [isTestingMomoPayment, setIsTestingMomoPayment] = useState(false);
  const [pendingMomoOrder, setPendingMomoOrder] = useState(null);
  const [bundleList, setBundleList] = useState({}); useEffect(() => {
    const hasData = name || phone;
    console.log(selectedBundles)
    if (!hasData) return;

    const data = { name, phone };
    localStorage.setItem("checkout_info", JSON.stringify(data));
  }, [name, phone]);

  useEffect(() => {
    cartItems.forEach(async (item) => {
      if (!bundleList[item.product_id]) {
        const bundles = await getBundledProducts(item.product_id);
        setBundleList(prev => ({ ...prev, [item.product_id]: bundles.data }));

      }
    });
  }, [cartItems]);
  useEffect(() => {
    if (showPay) {

      getAllStoreLocations()
        .then(res => {
          setStoreData(res.data);
        })
        .catch(err => console.error('Lỗi khi tải địa chỉ:', err));
      getAllPayment()
        .then(res => {
          setPaymentMethod(res.data);
        })
        .catch(err => console.error('Lỗi khi tải phương thức thanh toán:', err));

      const savedInfo = localStorage.getItem("checkout_info");
      if (savedInfo) {
        const data = JSON.parse(savedInfo);
        setName(data.name || "");
        setPhone(data.phone || "");
        hasLoadedSavedData.current = true;
      }
    }
  }, [showPay]);




  const handleConfirmStore = () => {
    if (pendingStore) {
      setSelectedStore(pendingStore);
      setShowAddress(false);
    }
  };
  useEffect(() => {
    setPendingStore(selectedStore);
  }, [showAddress]);

  const validateOrder = () => {
    const newErrors = {};
    const phoneRegex = /^0\d{9,10}$/;

    if (method === 'delivery') {
      const selectedAddr = addresses.find((a) => a.id === selectedAddressId);
      if (!selectedAddr) {
        newErrors.address = 'Vui lòng chọn địa chỉ nhận hàng';
      } else {
        if (!selectedAddr.full_name?.trim()) {
          newErrors.address = 'Địa chỉ chưa có họ tên người nhận';
        } else if (!phoneRegex.test(selectedAddr.phone || '')) {
          newErrors.address = 'Số điện thoại trong địa chỉ chưa đúng định dạng';
        }
      }
    }

    if (method === 'pickup') {
      if (!name.trim()) newErrors.name = 'Vui lòng nhập họ và tên';
      if (!phone.trim()) newErrors.phone = 'Vui lòng nhập số điện thoại';
      else if (!phoneRegex.test(phone)) newErrors.phone = 'Vui lòng nhập đúng định dạng số điện thoại';
      if (!selectedStore) {
        newErrors.selectedStore = 'Vui lòng chọn cửa hàng nhận hàng';
      }
    }

    if (!selectedMethod) newErrors.selectedMethod = 'Vui lòng chọn phương thức thanh toán';

    if (isReceiverDifferent) {
      if (!receiverName.trim()) newErrors.receiverName = 'Vui lòng nhập tên người nhận hộ';
      if (!receiverPhone.trim()) newErrors.receiverPhone = 'Vui lòng nhập số điện thoại người nhận hộ';
      else if (!phoneRegex.test(receiverPhone)) newErrors.receiverPhone = 'Vui lòng nhập đúng định dạng số điện thoại';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fetchCart = async () => {
    setLoading(true);
    try {
      let res;
      if (isAuthenticated && account?.id) {
        res = await getCart(account.id);
        if (res?.data) {
          setCartItems(res.data);
          setSelectedItems(res.data.map(item => item.cart_item_id));
        }
      } else {

        const tempCart = JSON.parse(localStorage.getItem("temp_cart")) || [];

        if (tempCart.length === 0) {
          setCartItems([]);
          setSelectedItems([]);
        } else {
          res = await getCartLocal(tempCart);
          if (res?.data) {
            setCartItems(res.data);
            setSelectedItems(res.data.map(item => item.cart_item_id));
          }
        }
      }
    } catch (e) {
      setCartItems([]);
      setSelectedItems([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCart();
  }, [account?.id]);



  if (!cartItems.length) {
    return (
      <>
        <div className="cart-empty">
          <img src="/empty-cart.png" alt="empty cart" />
          <h3>Giỏ hàng của bạn đang trống</h3>
          <p>Hãy thêm sản phẩm vào giỏ để mua sắm nhé!</p>
        </div>
        <CurrentlyViewedSlider />
      </>
    );
  }

  const allSelected = selectedItems.length === cartItems.length;

  const handleSelectAll = () => {
    if (allSelected) setSelectedItems([]);
    else setSelectedItems(cartItems.map(item => item.cart_item_id));
  };


  const handleSelectItem = (id) => {
    console.log(id)
    setSelectedItems(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      } else {
        return [...prev, id];
      }
    });
  };


  const updateCartCount = async () => {
    if (isAuthenticated) {
      let res = await getCartCount(account.id);
      if (res && res.count && res.EC === 0) {
        dispatch(setCartCount(Number(res.count)));
      } else {
        dispatch(setCartCount(0));
      }
    }
    else {
      const count = getLocalCartCount();
      dispatch(setCartCount(count));
    }
  };
  const deleteLocalCartItem = (id) => {
    let localCart = JSON.parse(localStorage.getItem("temp_cart")) || [];
    localCart = localCart.filter(item => item.cart_item_id !== id);
    localStorage.setItem("temp_cart", JSON.stringify(localCart));
  };
  const updateLocalCartItem = (cart_item_id, newOptionId, newQuantity) => {
    let localCart = JSON.parse(localStorage.getItem("temp_cart")) || [];
    const idx = localCart.findIndex(i => i.cart_item_id === cart_item_id);
    if (idx !== -1) {
      localCart[idx].option_id = newOptionId;
      localCart[idx].quantity = newQuantity;
      localStorage.setItem("temp_cart", JSON.stringify(localCart));
    }
  };
  const handleRemove = async (id) => {
    if (isAuthenticated) {
      await deleteCartItem(id);
    } else {
      deleteLocalCartItem(id);
    }
    setReloadSuggest(prev => prev + 1);
    await fetchCart();
    await updateCartCount();
  };


  const handleRemoveAll = async () => {
    if (isAuthenticated) {
      for (const id of selectedItems) {
        await deleteCartItem(id);
      }
    } else {
      let localCart = JSON.parse(localStorage.getItem("temp_cart")) || [];
      localCart = localCart.filter(item => !selectedItems.includes(item.cart_item_id));
      localStorage.setItem("temp_cart", JSON.stringify(localCart));
    }
    await fetchCart();
    await updateCartCount();
  };


  const selectedCartItems = cartItems.filter(item =>
    selectedItems.includes(item.cart_item_id)
  );

  let total = selectedCartItems.reduce((sum, item) => {
    const base = item.current.final_price * item.current.stock_quantity;
    return sum + base;
  }, 0);

  let total_price = selectedCartItems.reduce((sum, item) => {
    const base = item.current.base_option_price * item.current.stock_quantity;
    return sum + base;
  }, 0);

  selectedCartItems.forEach(item => {
    const bundles = bundleList[item.product_id] || [];
    const selected = selectedBundles[item.product_id] || [];

    selected.forEach(bundled_id => {
      const bundle = bundles.find(b => b.bundled_product_id === bundled_id);
      if (bundle) {
        const discounted = (bundle.base_price || 0) - (bundle.discount_value || 0);
        total += discounted;
        total_price += bundle.base_price || 0;
      }
    });
  });


  const handleChangeVariant = async (cartItemId, color) => {
    const item = cartItems.find(i => i.cart_item_id === cartItemId);
    if (!item) return;
    const variant = item.variants.find(v => v.color === color);
    if (!variant || !variant.options.length) {
      alert('Không có option cho màu này!');
      return;
    }

    const firstOption = variant.options[0];
    const existed = cartItems.find(
      i => i.option_id === firstOption.id && i.cart_item_id !== cartItemId
    );

    if (isAuthenticated) {
      if (existed) {
        await updateCartItem({
          cart_item_id: existed.cart_item_id,
          option_id: firstOption.id,
          stock_quantity: existed.current.stock_quantity + item.current.stock_quantity
        });
        await deleteCartItem(cartItemId);
      } else {
        await updateCartItem({
          cart_item_id: cartItemId,
          option_id: firstOption.id,
          stock_quantity: item.current.stock_quantity
        });
      }
    } else {
      if (existed) {
        updateLocalCartItem(existed.cart_item_id, firstOption.id, existed.current.stock_quantity + item.current.stock_quantity);
        deleteLocalCartItem(cartItemId);
      } else {
        updateLocalCartItem(cartItemId, firstOption.id, item.current.stock_quantity);
      }
    }

    setOpenColorDropdown(null);
    await fetchCart();
    await updateCartCount();
  };


  const handleChangeRam = async (cartItemId, ram) => {
    const item = cartItems.find(i => i.cart_item_id === cartItemId);
    if (!item) return;
    const variant = item.variants.find(v => v.color === item.current.color);
    if (!variant) return;

    const romsForRam = variant.options.filter(opt => opt.ram === ram && opt.stock_quantity > 0).map(opt => opt.rom);
    let rom = romsForRam.includes(item.current.rom) ? item.current.rom : romsForRam[0];
    const option = variant.options.find(opt => opt.ram === ram && opt.rom === rom);
    if (!option) return;

    const existed = cartItems.find(
      i => i.option_id === option.id && i.cart_item_id !== cartItemId
    );

    if (isAuthenticated) {
      if (existed) {
        await updateCartItem({
          cart_item_id: existed.cart_item_id,
          option_id: option.id,
          stock_quantity: existed.current.stock_quantity + item.current.stock_quantity
        });
        await deleteCartItem(cartItemId);
      } else {
        await updateCartItem({
          cart_item_id: cartItemId,
          option_id: option.id,
          stock_quantity: item.current.stock_quantity
        });
      }
    } else {
      if (existed) {
        updateLocalCartItem(existed.cart_item_id, option.id, existed.current.stock_quantity + item.current.stock_quantity);
        deleteLocalCartItem(cartItemId);
      } else {
        updateLocalCartItem(cartItemId, option.id, item.current.stock_quantity);
      }
    }

    await fetchCart();
    await updateCartCount();
  };


  const handleChangeRom = async (cartItemId, rom) => {
    const item = cartItems.find(i => i.cart_item_id === cartItemId);
    if (!item) return;
    const variant = item.variants.find(v => v.color === item.current.color);
    if (!variant) return;

    const ramsForRom = variant.options.filter(opt => opt.rom === rom && opt.stock_quantity > 0).map(opt => opt.ram);
    let ram = ramsForRom.includes(item.current.ram) ? item.current.ram : ramsForRom[0];
    const option = variant.options.find(opt => opt.ram === ram && opt.rom === rom);
    if (!option) return;

    const existed = cartItems.find(
      i => i.option_id === option.id && i.cart_item_id !== cartItemId
    );

    if (isAuthenticated) {
      if (existed) {
        await updateCartItem({
          cart_item_id: existed.cart_item_id,
          option_id: option.id,
          stock_quantity: existed.current.stock_quantity + item.current.stock_quantity
        });
        await deleteCartItem(cartItemId);
      } else {
        await updateCartItem({
          cart_item_id: cartItemId,
          option_id: option.id,
          stock_quantity: item.current.stock_quantity
        });
      }
    } else {
      if (existed) {
        updateLocalCartItem(existed.cart_item_id, option.id, existed.current.stock_quantity + item.current.stock_quantity);
        deleteLocalCartItem(cartItemId);
      } else {
        updateLocalCartItem(cartItemId, option.id, item.current.stock_quantity);
      }
    }

    await fetchCart();
    await updateCartCount();
  };


  const handleChangeQuantity = async (cartItemId, delta) => {
    const item = cartItems.find(i => i.cart_item_id === cartItemId);
    if (!item) return;
    let newQuantity = item.current.stock_quantity + delta;
    if (newQuantity < 1) newQuantity = 1;

    if (isAuthenticated) {
      await updateCartItem({
        cart_item_id: cartItemId,
        option_id: item.option_id,
        stock_quantity: newQuantity
      });
    } else {
      updateLocalCartItem(cartItemId, item.option_id, newQuantity);
    }

    await fetchCart();
    await updateCartCount();
  };


  const countUniqueGifts = (cartItems) => {
    const giftSet = new Set();

    cartItems.forEach(item => {
      const rawGifts = (item.product_description || '').split(';');
      rawGifts.forEach(g => {
        const gift = g.trim();
        if (gift) giftSet.add(gift);
      });
    });

    return giftSet.size;
  };

  const isCardPaymentMethod = (methodObj) => {
    if (!methodObj) return false;
    const raw = `${methodObj.code || ""} ${methodObj.name || ""}`.toLowerCase();
    return /the|thẻ|card|visa|master|atm|chuyen khoan|chuyển khoản|bank/.test(raw);
  };

  const isMomoPaymentMethod = (methodObj) => {
    if (!methodObj) return false;
    const raw = `${methodObj.code || ""} ${methodObj.name || ""}`.toLowerCase();
    return /momo/.test(raw);
  };

  const buildOrderDraft = () => {
    let shipping_address = "";
    let address_id = null;
    let selectedAddr = null;
    if (method === 'delivery') {
      selectedAddr = addresses.find((a) => a.id === selectedAddressId);
      if (!selectedAddr) {
        toast.warning("Vui lòng chọn địa chỉ giao hàng!");
        return null;
      }
      shipping_address = `${selectedAddr.detail_address}, ${selectedAddr.ward_name}, ${selectedAddr.district_name}, ${selectedAddr.city_name}`;
      address_id = selectedAddr.id;
    }
    const orderPhone = method === 'delivery' ? selectedAddr?.phone || "" : phone;
    const orderName = method === 'delivery' ? selectedAddr?.full_name || "" : name;

    const cart_items = selectedCartItems.map(item => ({
      product_id: item.product_id,
      option_id: item.option_id,
      cart_item_id: item.cart_item_id,
      name: item.product_name,
      color: item.current.color,
      ram: item.current.ram,
      rom: item.current.rom,
      base_price: item.current.base_option_price,
      final_price: item.current.final_price,
      quantity: item.current.stock_quantity,
      gift: item.product_description || null,
      image: item.current.image
    }));

    const bundleItems = [];
    for (const mainProductId in selectedBundles) {
      const bundleIds = selectedBundles[mainProductId] || [];
      const bundles = bundleList[mainProductId] || [];
      const parentProduct = selectedCartItems.find(p => p.product_id === Number(mainProductId));
      for (const bundleId of bundleIds) {
        const bundle = bundles.find(b => b.bundled_product_id === bundleId);
        if (bundle && parentProduct) {
          bundleItems.push({
            product_id: bundle.bundled_product_id,
            option_id: null,
            cart_item_id: null,
            name: bundle.product_name,
            color: null,
            ram: null,
            rom: null,
            base_price: bundle.base_price,
            final_price: bundle.base_price - bundle.discount_value,
            quantity: 1,
            gift: `Sản phẩm mua kèm của ${parentProduct.product_name}`,
            image: bundle.image
          });
        }
      }
    }
    const allItems = [...cart_items, ...bundleItems];

    return {
      payload: {
        email: account.email,
        user_id: account.id,
        cart_items: allItems,
        total_price: total,
        payment_method_id: Number(selectedMethod),
        delivery_method: method,
        pickup_location_id: method === 'pickup' ? selectedStore : null,
        shipping_address,
        address_id,
        phone: orderPhone,
        customer_name: orderName,
        receiver_name: isReceiverDifferent ? receiverName : null,
        receiver_phone: isReceiverDifferent ? receiverPhone : null,
        note
      },
      allItems,
      orderName
    };
  };

  const finalizeOrderSuccess = async ({ allItems, orderName }) => {
    toast.success("Đơn hàng của bạn đã được đặt");
    handleSendOrderMail({
      email: account.email,
      name: orderName,
      cart_items: allItems,
      total: total
    });

    for (const item of selectedCartItems) {
      await deleteCartItem(item.cart_item_id);
    }
    const resCount = await getCartCount(account?.id);
    dispatch(setCartCount(resCount?.EC === 0 ? Number(resCount.count) : 0));

    await fetchCart();
    setShowPay(false);
    setShowCart(true);
    setShowCardPaymentModal(false);
    setShowMomoPaymentModal(false);
    setPendingCardOrder(null);
    setPendingMomoOrder(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTestCardPayment = async () => {
    if (!pendingCardOrder?.payload) return;
    setIsTestingCardPayment(true);
    try {
      const res = await createOrder(pendingCardOrder.payload);
      if (res && res.EC === 0) {
        await finalizeOrderSuccess({
          allItems: pendingCardOrder.allItems,
          orderName: pendingCardOrder.orderName
        });
      } else {
        toast.error(res?.EM || "Không thể hoàn tất thanh toán thử");
      }
    } catch (error) {
      toast.error(error?.response?.data?.EM || "Lỗi thanh toán thử");
    } finally {
      setIsTestingCardPayment(false);
    }
  };

  const handleTestMomoPayment = async () => {
    if (!pendingMomoOrder?.payload) return;
    setIsTestingMomoPayment(true);
    try {
      const res = await createOrder(pendingMomoOrder.payload);
      if (res && res.EC === 0) {
        await finalizeOrderSuccess({
          allItems: pendingMomoOrder.allItems,
          orderName: pendingMomoOrder.orderName
        });
      } else {
        toast.error(res?.EM || "Không thể hoàn tất thanh toán MoMo thử");
      }
    } catch (error) {
      toast.error(error?.response?.data?.EM || "Lỗi thanh toán MoMo thử");
    } finally {
      setIsTestingMomoPayment(false);
    }
  };

  const handleSubmitOrder = async () => {
    if (!validateOrder()) {
      console.log(errors);
      return;
    }
    const draft = buildOrderDraft();
    if (!draft) return;
    const { payload, allItems, orderName } = draft;
    const selectedMethodObj = paymentMethod.find((m) => Number(m.id) === Number(selectedMethod));

    if (Number(selectedMethod) === 4) {
      const res = await createVnpayPayment(Number(total));
      if (res?.EC === 0 && res.data?.paymentUrl) {
        localStorage.setItem("pendingOrder", JSON.stringify(payload));
        window.location.href = res.data.paymentUrl;
        return;
      } else {
        toast.error("Không tạo được link thanh toán VNPAY");
        return;
      }
    }

    if (Number(selectedMethod) === 5) {
      localStorage.setItem("pendingOrder", JSON.stringify(payload));
      const res = await createPaypalPayment(Number(total));
      if (res?.data?.approval_url) {
        window.location.href = res.data.approval_url;
      } else {
        toast.error("Không tạo được link thanh toán PayPal");
      }
      return;
    }

    if (isMomoPaymentMethod(selectedMethodObj)) {
      setPendingMomoOrder({ payload, allItems, orderName });
      setShowMomoPaymentModal(true);
      return;
    }

    if (isCardPaymentMethod(selectedMethodObj)) {
      setPendingCardOrder({ payload, allItems, orderName });
      setShowCardPaymentModal(true);
      return;
    }

    const res = await createOrder(payload);
    if (res && res.EC === 0) {
      await finalizeOrderSuccess({ allItems, orderName });
    }
  };


  const handleSendOrderMail = async ({ email, name, cart_items, total }) => {
    try {
      const res = await sendOrder({
        email: email,
        customer_name: name,
        cart_items: cart_items.map(item => ({
          name: item.name,
          color: item.color,
          ram: item.ram,
          rom: item.rom,
          quantity: item.quantity
        })),
        total_price: total
      });

      if (res && res.EC === 0) {
        console.log('📩 Email xác nhận đơn hàng đã được gửi.');
      } else {
        console.warn('❗ Gửi email thất bại:', res);
      }
    } catch (error) {
      console.error('❌ Lỗi khi gửi email xác nhận:', error);
    }
  };


  return (
    <>
      {showGiftPopup && (
        <>
          <div className="overlay" onClick={() => setShowGiftPopup(false)}></div>
          <div className="detail-panel gift-show">
            <div className="detail-header gift-header">
              <p>Thông tin quà tặng ({countUniqueGifts(selectedCartItems)})</p>
              <button onClick={() => setShowGiftPopup(false)}>✖</button>
            </div>
            <div className="detail-content">
              {(() => {
                const giftMap = {};

                selectedCartItems.forEach(item => {
                  const quantity = item.current?.stock_quantity || 1;
                  const rawGifts = (item.product_description || '').split(';');
                  rawGifts.forEach(g => {
                    const gift = g.trim();
                    if (!gift) return;
                    if (giftMap[gift]) {
                      giftMap[gift] += quantity;
                    } else {
                      giftMap[gift] = quantity;
                    }
                  });
                });

                return Object.entries(giftMap).map(([gift, count], idx) => (
                  <>
                    <div className='gift-detail'>
                      <p key={idx}>{gift}</p>
                      <div className='count-gift'>
                        x{count}
                      </div>
                    </div>

                  </>

                ));
              })()}
            </div>
          </div>
        </>
      )}
      {showAddress && (
        <>
          <div className="overlay" onClick={() => setShowAddress(false)}></div>
          <div className="detail-panel gift-show">
            <div className="detail-header gift-header">
              <p>Chọn địa chỉ shop ({storeData?.length || 0})</p>
              <button onClick={() => setShowAddress(false)}>✖</button>
            </div>

            <div className="detail-content shop-list">
              {storeData?.length > 0 ? (
                storeData.map((store, idx) => (
                  <label
                    key={store.id}
                    className={`shop-item ${pendingStore === store.id ? 'selected' : ''} `}
                  >
                    <div className="shop-header">{store.name}</div>
                    <div className="shop-body">
                      <div className="shop-address">Địa chỉ: {store.address} </div>
                      <div className="shop-address">SĐT: {store.phone}</div>
                      <div className="shop-actions">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-map"
                        >
                          <FaMapMarkedAlt /> Xem chỉ đường
                        </a>
                      </div>

                    </div>
                    <input
                      type="radio"
                      name="shop"
                      checked={pendingStore === store.id}
                      onChange={() => setPendingStore(store.id)}
                    />

                    <span class="checkmark"></span>
                  </label>
                ))
              ) : (
                <p>Không có cửa hàng nào.</p>
              )}
            </div>

            <div className="footer-btn">
              <button className="confirm-btn" onClick={() => handleConfirmStore()}>
                Xác nhận
              </button>
            </div>
          </div>
        </>
      )}

      <div className="cart-page">
        {showCart && (<div className="cart-left">
          <div className="cart-select-all-bar">
            <div className="cart-select-all">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={handleSelectAll}
              />
              <span style={{ fontSize: "15px" }}>
                {allSelected
                  ? `Bỏ chọn tất cả (${cartItems.length})`
                  : `Chọn tất cả (${cartItems.length})`}
              </span>

            </div>
            <button
              className="cart-remove-all-btn"
              onClick={handleRemoveAll}
              disabled={selectedItems.length === 0}
            >
              <span role="img" aria-label="delete"><FaTrash style={{ marginBottom: "2.5px" }} /> Xóa sản phẩm đã chọn</span>
            </button>
          </div>
          {cartItems.map(item => {

            const currentVariant = item.variants?.find(v => v.color === item.current.color) || null;

            const rams = currentVariant?.options
              ? [...new Set(currentVariant.options.filter(opt => opt.stock_quantity > 0).map(opt => opt.ram))]
              : [];
            const romsForSelectedRam = currentVariant?.options
              ? [...new Set(currentVariant.options.filter(opt => opt.ram === item.current.ram && opt.stock_quantity > 0).map(opt => opt.rom))]
              : [];

            return (
              <div className="cart-item" key={item.cart_item_id}>
                <div className="cart-item-header">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.cart_item_id)}
                    onChange={() => handleSelectItem(item.cart_item_id)}
                  />
                  <img
                    onClick={() => navigate(`/products/${item.product_id}`)}
                    src={
                      item.current.image
                        ? `${process.env.REACT_APP_BASE_URL}${item.current.image}`
                        : '/no-image.png'
                    }
                    alt={item.product_name}
                  />
                  <div className="cart-item-info">
                    <div className="cart-item-title" onClick={() => navigate(`/products/${item.product_id}`)} >{item.product_name + " " + item.current.ram + "-" + item.current.rom + " " + item.current.color}</div>

                    <div className="cart-item-variant-select">
                      <div
                        className="color-dropdown-selected"
                        onClick={() =>
                          setOpenColorDropdown(
                            openColorDropdown === item.cart_item_id ? null : item.cart_item_id
                          )
                        }
                      >
                        Màu: {item.current.color}
                        <span className="dropdown-arrow"><MdKeyboardArrowDown style={{ fontSize: "21px", fontWeight: "1000" }} /></span>
                      </div>
                      {openColorDropdown === item.cart_item_id && (
                        <div className="color-dropdown-list">
                          {item.variants?.filter(v => v.options?.length > 0).map(variant => (
                            <div
                              key={variant.id}
                              className={`color-dropdown-item${variant.color === item.current.color ? ' active' : ''}`}
                              onClick={() => handleChangeVariant(item.cart_item_id, variant.color)}
                            >
                              <img
                                src={
                                  variant.images?.[0]
                                    ? `${process.env.REACT_APP_BASE_URL}${variant.images[0]}`
                                    : '/no-image.png'
                                }
                                alt={variant.color}
                              />
                              <span>{variant.color}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="cart-item-ramrom-select">
                      <select
                        value={item.current.ram}
                        onChange={e => handleChangeRam(item.cart_item_id, e.target.value)}

                      >
                        {rams.map(ram => (
                          <option key={ram} value={ram}>
                            RAM: {ram}
                          </option>
                        ))}
                      </select>

                      <select
                        value={item.current.rom}
                        onChange={e => handleChangeRom(item.cart_item_id, e.target.value)}

                      >
                        {romsForSelectedRam.map(rom => (
                          <option key={rom} value={rom}>
                            ROM: {rom}
                          </option>
                        ))}
                      </select>
                    </div>


                  </div>
                  <div className="cart-item-price">
                    <div>
                      <span className="price">{Number(item.current.final_price).toLocaleString()}₫</span>
                    </div>
                    {item.current.final_price !== item.current.base_option_price &&
                      (<div>
                        <span className="base_price">{Number(item.current.base_option_price).toLocaleString()}₫</span>
                      </div>)}
                  </div>
                  <div className="cart-item-quantity">
                    <button
                      onClick={() => handleChangeQuantity(item.cart_item_id, -1)}
                      disabled={item.current.stock_quantity <= 1}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={item.current.stock_quantity}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') return; const newQuantity = parseInt(value);
                        if (!isNaN(newQuantity)) {
                          handleChangeQuantity(item.cart_item_id, newQuantity - item.current.stock_quantity);
                        }
                      }}
                      onBlur={(e) => {
                        if (e.target.value === '') {
                          handleChangeQuantity(item.cart_item_id, 0);
                        }
                      }}
                      className="quantity-input"
                    />

                    <button onClick={() => handleChangeQuantity(item.cart_item_id, 1)}>+</button>
                  </div>
                  <button className="cart-item-remove" onClick={() => handleRemove(item.cart_item_id)}>
                    <FaTrash />
                  </button>
                </div>
                {bundleList[item.product_id]?.length > 0 && (

                  <div className="cart-item-bundles">
                    <h5><b>🔥 Combo ưu đãi</b></h5>
                    {bundleList[item.product_id].map((bundle, index) => {
                      const originalPrice = bundle.base_price || 0;
                      const discounted = originalPrice - bundle.discount_value;
                      return (
                        <div key={index} className="bundle-item">
                          <input
                            type="checkbox"
                            checked={selectedBundles[item.product_id]?.includes(bundle.bundled_product_id) || false}
                            onChange={() => {
                              setSelectedBundles(prev => {
                                const prevList = prev[item.product_id] || [];
                                const isSelected = prevList.includes(bundle.bundled_product_id);
                                const newList = isSelected
                                  ? prevList.filter(id => id !== bundle.bundled_product_id)
                                  : [...prevList, bundle.bundled_product_id];
                                return { ...prev, [item.product_id]: newList };
                              });
                            }}
                          />
                          <img
                            src={bundle.image ? `${process.env.REACT_APP_BASE_URL}${bundle.image}` : '/no-image.png'}
                            alt={bundle.product_name}
                          />
                          <div className="bundle-info">
                            <div style={{ fontSize: "18px" }}><b>{bundle.product_name}</b></div>
                            <div className="bundle-price">
                              <strong>{discounted.toLocaleString()}₫</strong>{' '}
                              <span className="old-price" style={{ fontSize: "12px" }}>{originalPrice.toLocaleString()}₫</span>
                            </div>
                            <div className="bundle-price">
                              Số lượng : 1
                            </div>
                          </div>
                          <div style={{ color: "green" }}>Tiết kiệm {bundle.discount_value.toLocaleString()}₫</div>
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            )

          })}
        </div>
        )}
        {showPay && (
          <div className="cart-left">
            <div className="cart-select-all-bar pay-title">
              <span onClick={() => { setShowPay(false); setShowCart(true) }}>
                <MdKeyboardArrowLeft style={{ fontSize: "26px" }} /> Quay lại giỏ hàng
              </span>
              <span style={{ color: "black" }}>
                Sản phẩm trong đơn (
                {
                  selectedCartItems.reduce((sum, item) => sum + (item.current?.stock_quantity || 0), 0)
                  +
                  Object.values(selectedBundles).reduce((sum, ids) => sum + ids.length, 0)
                }
                )
              </span>

            </div>

            {selectedCartItems.map(item => {
              const selected = selectedBundles[item.product_id] || [];

              return (
                <div key={item.cart_item_id}>

                  <div className="cart-item">
                    <div className="cart-item-header">
                      <img
                        src={item.current.image ? `${process.env.REACT_APP_BASE_URL}${item.current.image}` : '/no-image.png'}
                        alt={item.product_name}
                      />
                      <div className="cart-item-info">
                        <div className="cart-item-title">
                          {item.product_name + " " + item.current.ram + "-" + item.current.rom + " " + item.current.color}
                        </div>
                        <div className="cart-item-quantity-readonly">
                          Số lượng: {item.current.stock_quantity}
                        </div>
                      </div>
                      <div className="cart-item-price">
                        <div>
                          <span className="price">{Number(item.current.final_price).toLocaleString()}₫</span>
                        </div>
                        {item.current.final_price !== item.current.base_option_price && (
                          <div>
                            <span className="base_price">{Number(item.current.base_option_price).toLocaleString()}₫</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {selected.length > 0 && (
                      <div className="selected-bundles">
                        <h5><b>Sản phẩm mua kèm:</b></h5>
                        <div className="bundle-items">
                          {selected.map(bundleId => {
                            const bundle = bundleList[item.product_id]?.find(b => b.bundled_product_id === bundleId);
                            if (!bundle) return null;

                            const discounted = bundle.base_price - bundle.discount_value;

                            return (
                              <div key={bundleId} className="bundle-item small">
                                <img
                                  src={bundle.image ? `${process.env.REACT_APP_BASE_URL}${bundle.image}` : '/no-image.png'}
                                  alt={bundle.product_name}
                                />
                                <div className="bundle-info">
                                  <div className="bundle-name"><b>{bundle.product_name}</b></div>
                                  <div className="bundle-pricing">
                                    <strong>{discounted.toLocaleString()} ₫</strong>{' '}
                                    <span className="old-price">{bundle.base_price.toLocaleString()} ₫</span>
                                  </div>
                                  <div className="bundle-price">
                                    Số lượng : 1
                                  </div>

                                </div>
                                <div className="bundle-save" style={{ color: 'green' }}>
                                  Tiết kiệm: {bundle.discount_value.toLocaleString()} ₫
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>



                </div>
              );
            })}

            <div className='info-order'>
              <div>
                <p className='title-cus'>Hình thức nhận hàng</p>
                <div className="delivery-method">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="delivery"
                      checked={method === 'delivery'}
                      onChange={() => { setMethod('delivery'); setShowDelivery(true); setShowPickUp(false) }}
                    />
                    <span className="custom-radio" />
                    Giao hàng tận nơi
                  </label>

                  <label className="radio-label">
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="pickup"
                      checked={method === 'pickup'}
                      onChange={() => { setMethod('pickup'); setShowPickUp(true); setShowDelivery(false) }}
                    />
                    <span className="custom-radio" />
                    Nhận tại cửa hàng
                  </label>
                </div>
                {showDelivery && (
                  <>
                    <AddressSelector
                      userId={account?.id}
                      selectedAddressId={selectedAddressId}
                      onSelectAddress={setSelectedAddressId}
                      onAddressesLoaded={setAddresses}
                    />
                    {!selectedAddressId && errors.address && (
                      <span className="error-text" style={{ marginTop: "-10px", marginBottom: "10px" }}>
                        {errors.address}
                      </span>
                    )}
                    <label className="note">Ghi chú (tuỳ chọn)</label>
                    <div className="order-note">
                      <textarea
                        value={note}
                        onChange={(e) => {
                          if (e.target.value.length <= maxLength) {
                            setNote(e.target.value);
                          }
                        }}
                        placeholder="Ghi chú (Ví dụ: Hãy gọi tôi khi chuẩn bị hàng xong)"
                        rows={4}
                      />
                      <div className="char-count">{note.length}/{maxLength}</div>
                    </div>
                    <div className="other-receiver">
                      <label style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                        <input
                          type="checkbox"
                          checked={isReceiverDifferent}
                          onChange={(e) => setIsReceiverDifferent(e.target.checked)}
                        />
                        Nhờ người khác nhận hàng
                      </label>

                      {isReceiverDifferent && (
                        <div className='ok-fine'>
                          <div className={`form-group ${errors.receiverName ? 'has-error' : ''}`}>
                            <input
                              type="text"
                              placeholder="Họ và tên người nhận"
                              value={receiverName}
                              onChange={(e) => {
                                const value = e.target.value;
                                setReceiverName(value);

                                if (value.trim() === '') {
                                  setErrors(prev => ({ ...prev, receiverName: 'Vui lòng nhập tên người nhận hộ' }));
                                } else {
                                  setErrors(prev => ({ ...prev, receiverName: '' }));
                                }
                              }}
                            />
                            {errors.receiverName && <span className="error-text">{errors.receiverName}</span>}
                          </div>

                          <div className={`form-group ${errors.receiverPhone ? 'has-error' : ''}`}>
                            <input
                              type="text"
                              placeholder="Số điện thoại người nhận"
                              value={receiverPhone}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (/^\d*$/.test(value)) {
                                  setReceiverPhone(value);
                                  const phoneRegex = /^0\d{8,11}$/;
                                  if (!phoneRegex.test(value)) {
                                    setErrors(prev => ({ ...prev, receiverPhone: 'Vui lòng nhập đúng định dạng số điện thoại' }));
                                  } else {
                                    setErrors(prev => ({ ...prev, receiverPhone: '' }));
                                  }
                                }
                              }}
                            />
                            {errors.receiverPhone && <span className="error-text">{errors.receiverPhone}</span>}
                          </div>
                        </div>
                      )}
                    </div>


                  </>
                )}

                {showPickUp && (
                  <div className='address-pickup'>
                    <>
                      <label className="note">Thông tin người nhận tại cửa hàng</label>
                      <div className='ok-fine' style={{ marginBottom: 12 }}>
                        <div className={`form-group ${errors.name ? 'has-error' : ''}`}>
                          <input
                            type="text"
                            placeholder="Họ và tên"
                            value={name}
                            onChange={(e) => {
                              const value = e.target.value;
                              setName(value);
                              if (value.trim() === '') {
                                setErrors(prev => ({ ...prev, name: 'Vui lòng nhập họ và tên' }));
                              } else {
                                setErrors(prev => ({ ...prev, name: '' }));
                              }
                            }}
                          />
                          {errors.name && <span className="error-text">{errors.name}</span>}
                        </div>
                        <div className={`form-group ${errors.phone ? 'has-error' : ''}`}>
                          <input
                            type="text"
                            placeholder="Số điện thoại"
                            value={phone}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (/^\d*$/.test(value)) {
                                setPhone(value);
                                const phoneRegex = /^0\d{9,10}$/;
                                if (!phoneRegex.test(value)) {
                                  setErrors(prev => ({ ...prev, phone: 'Vui lòng nhập đúng định dạng số điện thoại' }));
                                } else {
                                  setErrors(prev => ({ ...prev, phone: '' }));
                                }
                              }
                            }}
                          />
                          {errors.phone && <span className="error-text">{errors.phone}</span>}
                        </div>
                      </div>
                      <label className="note">Chọn cửa hàng</label>
                      <div className='adderss-store' >
                        <div className={`shop-select-box ${errors.selectedStore && !selectedStoreInfo ? 'has-error-div' : ''}`} onClick={() => setShowAddress(true)}>
                          <span>
                            {selectedStoreInfo
                              ? <>
                                {selectedStoreInfo.name} - {selectedStoreInfo.address} - {selectedStoreInfo.phone}
                                <div className="shop-actions">
                                  <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedStoreInfo.address)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-map"
                                  >
                                    <FaMapMarkedAlt /> Xem chỉ đường
                                  </a>
                                </div>
                              </>
                              : "Chọn shop có hàng gần nhất"}
                          </span>
                          <span className="arrow"><MdKeyboardArrowDown /></span>
                        </div>

                      </div>
                      {errors.selectedStore && !selectedStoreInfo && <span className="error-text" style={{ marginTop: "-5px", marginBottom: "10px" }}>{errors.selectedStore}</span>}
                      <label className="note">Ghi chú (tuỳ chọn)</label>
                      <div className="order-note">
                        <textarea
                          value={note}
                          onChange={(e) => {
                            if (e.target.value.length <= maxLength) {
                              setNote(e.target.value);
                            }
                          }}
                          placeholder="Ghi chú (Ví dụ: Hãy gọi tôi khi chuẩn bị hàng xong)"
                          rows={4}
                        />
                        <div className="char-count">{note.length}/{maxLength}</div>
                      </div>
                    </>
                  </div>
                )}
              </div>
            </div>

            <div className={`info-order ${errors.selectedMethod && !selectedMethod ? 'has-error-div' : ''}`}>
              <div>
                <p className='title-cus'>Phương thức thanh toán</p>
              </div>
              {errors.selectedMethod && !selectedMethod && <span className="error-text" style={{ marginTop: "-27px", marginBottom: "10px" }}>{errors.selectedMethod}</span>}
              <div className="payment-methods">
                {paymentMethod.map((method) => (
                  <label
                    key={method.code}
                    className={`payment-option ${selectedMethod === method.id ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method.code}
                      checked={selectedMethod === method.id}
                      onChange={() => setSelectedMethod(method.id)}
                    />
                    <img src={`${process.env.REACT_APP_BASE_URL}${method.icon}`} alt={method.code} className="icon" />
                    <span className="label">{method.name}</span>
                  </label>
                ))}
              </div>

            </div>
          </div>
        )}

        <div className="cart-right">
          <div className='gift'>
            <div><IoGiftOutline style={{ fontSize: "22px", marginRight: "5px", marginBottom: "3px" }} />Quà tặng</div>
            <div
              onClick={() => countUniqueGifts(selectedCartItems) > 0 && setShowGiftPopup(true)}
              style={{
                cursor: countUniqueGifts(selectedCartItems) > 0 ? 'pointer' : 'not-allowed',
                color: countUniqueGifts(selectedCartItems) > 0 ? '#d70018' : '#999',
                opacity: countUniqueGifts(selectedCartItems) > 0 ? 1 : 0.6
              }}
            >
              Xem quà {countUniqueGifts(selectedCartItems) > 0 ? `(${countUniqueGifts(selectedCartItems)})` : ""}

            </div>
          </div>
          <div className="cart-summary-box">
            <div className="cart-summary-title">Thông tin đơn hàng</div>
            <div className="cart-summary-row">
              <span>Tổng tiền</span>
              <span><b>{total_price.toLocaleString()}₫</b></span>
            </div>
            <div className="cart-summary-row">
              <span>Tổng khuyến mãi</span>
              <span><b>{(total_price - total).toLocaleString()}₫</b></span>
            </div>
            <div className="cart-summary-row">
              <span>Phí vận chuyển</span>
              <span>Miễn phí</span>
            </div>
            <div className="cart-summary-row">
              <span>Cần thanh toán</span>
              <span className="cart-summary-pay">{total.toLocaleString()}₫</span>
            </div>
            {showCart ? (
              <button
                className="cart-summary-checkout"
                disabled={selectedCartItems.length < 1}
                onClick={() => {
                  if (!isAuthenticated) {
                    toast.info("Vui lòng đăng nhập để xác nhận đơn hàng");
                    return;
                  }
                  setShowPay(true);
                  setShowCart(false);
                }}
              >
                Xác nhận đơn
              </button>

            ) : (
              <>
                <button
                  className="cart-summary-checkout"
                  onClick={handleSubmitOrder}

                  disabled={selectedCartItems.length < 1}
                >
                  Đặt hàng
                </button>
                <p style={{ fontSize: "13px" }}>Bằng việc đặt mua hàng, bạn đồng ý với các Điều khoản dịch vụ và Chính sách xử lý dữ liệu cá nhân
                  của Thế giới công nghệ</p>
              </>
            )}

          </div>
        </div>
      </div >
      <SuggestCartSlider reloadTrigger={reloadSuggest} />
      <CardPaymentModal
        isOpen={showCardPaymentModal}
        amount={pendingCardOrder?.payload?.total_price || total}
        loading={isTestingCardPayment}
        onClose={() => {
          if (isTestingCardPayment) return;
          setShowCardPaymentModal(false);
          setPendingCardOrder(null);
        }}
        onTestPayment={handleTestCardPayment}
      />
      <MomoPaymentModal
        isOpen={showMomoPaymentModal}
        amount={pendingMomoOrder?.payload?.total_price || total}
        loading={isTestingMomoPayment}
        onClose={() => {
          if (isTestingMomoPayment) return;
          setShowMomoPaymentModal(false);
          setPendingMomoOrder(null);
        }}
        onTestPayment={handleTestMomoPayment}
      />
    </>
  );
};

export default CartView;