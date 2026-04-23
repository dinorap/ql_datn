<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="modal-overlay"
      @click="handleClose"
    >
      <div class="modal-content payment-modal-content" @click.stop>
        <div class="modal-header">
          <!-- Tabs -->
          <div class="payment-tabs">
            <button
              class="payment-tab"
              :class="{ active: activePaymentTab === 'bank' }"
              @click="activePaymentTab = 'bank'"
            >
              <i class="fas fa-building-columns"></i> {{ $t('payment.deposit.bankTab') }}
            </button>
            <button
              class="payment-tab"
              :class="{ active: activePaymentTab === 'paypal' }"
              @click="activePaymentTab = 'paypal'"
            >
              <i class="fab fa-paypal"></i> {{ $t('payment.deposit.paypalTab') }}
            </button>
          </div>
          <div class="header-right">
            <div v-if="qrTimeRemaining > 0" class="qr-time-remaining">
              {{ $t('payment.deposit.expiresIn') }}: {{ formatTimeRemaining(qrTimeRemaining) }}
            </div>
            <button
              v-if="qrData && qrTimeRemaining > 0"
              type="button"
              class="test-payment-btn-header"
              @click="testPayment"
              :disabled="testingPayment"
            >
              <span v-if="testingPayment">{{ $t('payment.deposit.testingPayment') }}</span>
              <span v-else>{{ $t('payment.deposit.testPayment') }}</span>
            </button>
            <button class="modal-close" @click="handleClose">&times;</button>
          </div>
        </div>
        <div class="modal-body payment-modal-body">

          <!-- Bank Transfer Tab -->
          <div id="tab-bank" class="payment-tab-content" :class="{ active: activePaymentTab === 'bank' }">
            <div class="payment-content-grid">
              <!-- Left: QR Image từ file -->
              <div class="payment-qr-section">
                <div class="qr-container">
                  <div class="qr-logo">VIETQR</div>
                  <div class="qr-code-placeholder">
                    <img
                      v-if="qrData && qrTimeRemaining > 0"
                      id="qr-code-image"
                      :src="qrData.qr_url"
                      alt="QR Code"
                    />
                    <div v-else class="qr-placeholder-text">
                      {{ $t('payment.deposit.qrPlaceholder') }}
                    </div>
                  </div>
                  <div class="qr-brands">
                    <span>napas 247</span>
                    <span>VietinBank</span>
                  </div>
                </div>
                <div class="account-info">
                  <div class="account-name">{{ $t('payment.deposit.bank') }}</div>
                  <div class="account-number">{{ $t('payment.deposit.accountNumber') }}</div>
                  <div class="account-amount">
                    {{ $t('payment.deposit.amount') }}: <span id="display-amount">{{ depositAmount ? formatVND(depositAmount) : '100.000' }}</span> VND
                  </div>
                  <p class="qr-instruction">{{ $t('payment.deposit.scanQR') }}</p>
                </div>
              </div>

              <!-- Right: Form -->
              <div class="payment-form-section">
                <div class="form-group">
                  <label for="payment-amount">Số tiền thanh toán (₫)</label>
                  <input
                    type="text"
                    id="payment-amount"
                    name="amount"
                    :value="depositAmountDisplay || '100.000'"
                    inputmode="numeric"
                    autocomplete="off"
                    :placeholder="$t('placeholder.amount')"
                    @input="handleAmountInput"
                    @blur="formatAmount"
                    required
                  />
                </div>

                <div class="quick-amount-buttons">
                  <button
                    class="quick-amount-btn"
                    :class="{ active: depositAmount === 50000 }"
                    @click="selectQuickAmount(50000)"
                  >
                    50.000₫
                  </button>
                  <button
                    class="quick-amount-btn"
                    :class="{ active: depositAmount === 100000 }"
                    @click="selectQuickAmount(100000)"
                  >
                    100.000₫
                  </button>
                  <button
                    class="quick-amount-btn"
                    :class="{ active: depositAmount === 500000 }"
                    @click="selectQuickAmount(500000)"
                  >
                    500.000₫
                  </button>
                  <button
                    class="quick-amount-btn"
                    :class="{ active: depositAmount === 1000000 }"
                    @click="selectQuickAmount(1000000)"
                  >
                    1.000.000₫
                  </button>
                </div>

                <div class="account-details">
                  <div class="detail-row">
                    <span class="detail-label">{{ $t('payment.deposit.accountHolder') }}:</span>
                    <span class="detail-value">ACB</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">{{ $t('payment.deposit.bank') }}</span>
                    <span class="detail-value">ACB - 23766621</span>
                  </div>
                </div>

                <div class="transfer-content">
                  <label>
                    Nội dung chuyển khoản:
                    <span class="required-note">Bắt buộc ghi đúng để nhận điểm tự động</span>
                  </label>
                  <div class="transfer-content-box">
                    <span 
                      id="transfer-content-text"
                      :class="{ 'transfer-placeholder': !qrData || !qrData.memo }"
                    >
                      {{ qrData && qrData.memo ? qrData.memo : $t('payment.deposit.transferContentPlaceholder') }}
                    </span>
                    <button
                      v-if="qrData && qrData.memo"
                      class="btn-copy-content"
                      id="btn-copy-content"
                      @click="copyTransferContent"
                      :title="$t('payment.deposit.copyContent')"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    </button>
                  </div>
                </div>

                <div v-if="error" class="message error" style="margin-top: 1rem;">
                  {{ error }}
                </div>

                <div class="payment-actions">
                  <button
                    type="button"
                    class="confirm-payment-btn"
                    @click="createQR"
                    :disabled="loading || !depositAmount || depositAmount < 10000"
                  >
                    <i class="fas fa-check"></i>
                    <span v-if="loading">Đang tạo...</span>
                    <span v-else>Tạo QR Code</span>
                  </button>
                  
                  <button
                    v-if="qrData && qrTimeRemaining > 0"
                    type="button"
                    class="test-payment-btn"
                    @click="testPayment"
                    :disabled="testingPayment"
                    style="margin-top: 0.75rem;"
                  >
                    <span v-if="testingPayment">{{ $t('payment.deposit.testingPayment') }}</span>
                    <span v-else>{{ $t('payment.deposit.testPaymentFull') }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- PayPal Tab -->
          <div id="tab-paypal" class="payment-tab-content" :class="{ active: activePaymentTab === 'paypal' }">
            <div class="paypal-info">
              <p style="text-align: center; color: #cbd5e1; padding: 40px 20px;">
                {{ $t('payment.deposit.paypalDeveloping') }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onBeforeUnmount } from "vue";
import { useAuthStore } from "~/stores/auth";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "success"]);

const config = useRuntimeConfig();
const auth = useAuthStore();
const { t } = useI18n();

const depositAmount = ref(100000);
const depositAmountDisplay = ref("100.000");
const qrData = ref(null);
const qrTimeRemaining = ref(0);
const qrExpired = ref(false);
const qrCountdownInterval = ref(null);
const loading = ref(false);
const error = ref("");
const testingPayment = ref(false);
const activePaymentTab = ref('bank');

const formatTimeRemaining = (seconds) => {
  if (seconds <= 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

const startQrCountdown = (expiresInSeconds) => {
  qrTimeRemaining.value = expiresInSeconds;
  qrExpired.value = false;

  if (qrCountdownInterval.value) {
    clearInterval(qrCountdownInterval.value);
  }

  qrCountdownInterval.value = setInterval(() => {
    qrTimeRemaining.value--;

    if (qrTimeRemaining.value <= 0) {
      clearInterval(qrCountdownInterval.value);
      qrCountdownInterval.value = null;
      qrExpired.value = true;
      qrData.value = null;
      error.value = t('payment.deposit.errors.qrExpired');
    }
  }, 1000);
};

const stopQrCountdown = () => {
  if (qrCountdownInterval.value) {
    clearInterval(qrCountdownInterval.value);
    qrCountdownInterval.value = null;
  }
  qrTimeRemaining.value = 0;
  qrExpired.value = false;
};

let paymentEventSource = null;

const stopPaymentPolling = () => {
  if (paymentEventSource) {
    paymentEventSource.close();
    paymentEventSource = null;
  }
};

const startPaymentPolling = async () => {
  stopPaymentPolling();

  if (!qrData.value || !qrData.value.trans_id) {
    return;
  }

  try {
    await $fetch(`${config.public.apiBase}/payment/sync-session`, {
      method: "POST",
      headers: {
        Authorization: auth.token,
      },
      credentials: "include",
    });

    paymentEventSource = new EventSource(
      `${config.public.apiBase}/payment/stream?token=${auth.token}`
    );

    paymentEventSource.addEventListener("payment_success", async (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.trans_id === qrData.value?.trans_id) {
          stopPaymentPolling();
          stopQrCountdown();

          handleClose();
          await auth.fetchUser();
          emit("success", {
            amount: data.actual_amount,
            newCredit: data.new_credit,
          });
        }
      } catch (err) {
        console.error("Error parsing SSE event:", err);
      }
    });

    paymentEventSource.onerror = (error) => {
      // Auto reconnect logic if needed
    };
  } catch (err) {
    console.error("Error setting up SSE connection:", err);
    error.value = t('payment.deposit.errors.sseError');
  }
};

// Format VND như store.html: 1.000.000
const formatVND = (num) => {
  const n = Math.max(0, parseInt(num || 0, 10) || 0);
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const parseVND = (str) => {
  const digits = String(str || "").replace(/[^\d]/g, "");
  return parseInt(digits || "0", 10);
};

const handleAmountInput = (event) => {
  const value = event.target.value;
  const num = parseVND(value);
  depositAmount.value = num;
  depositAmountDisplay.value = formatVND(num);
};

const formatAmount = () => {
  if (depositAmount.value) {
    depositAmountDisplay.value = formatVND(depositAmount.value);
  }
};

const selectQuickAmount = (amount) => {
  depositAmount.value = amount;
  depositAmountDisplay.value = formatVND(amount);
};

const copyTransferContent = async () => {
  const memoText = qrData.value?.memo || 'CHUYENKHOAN 100000';
  
  try {
    await navigator.clipboard.writeText(memoText);
  } catch (err) {
    console.error("Failed to copy:", err);
    error.value = t('payment.deposit.errors.copyError');
  }
};

const createQR = async () => {
  if (!depositAmount.value || depositAmount.value < 10000) {
    error.value = t('payment.deposit.errors.minAmount') || "Số tiền tối thiểu là 10,000 VND";
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    const res = await $fetch(`${config.public.apiBase}/payment/qr`, {
      method: "POST",
      headers: {
        Authorization: auth.token,
      },
      body: {
        amount: depositAmount.value,
      },
    });

    if (res.success) {
      qrData.value = res;
      qrExpired.value = false;
      const expiresIn = res.expires_in_seconds || 300;
      startQrCountdown(expiresIn);
      startPaymentPolling();
      await auth.fetchUser();
    }
  } catch (err) {
    if (err.data?.error) {
      error.value = err.data.error;
    } else {
      error.value = t('payment.deposit.errors.createQRError');
    }
  } finally {
    loading.value = false;
  }
};

const handleClose = () => {
  emit("update:modelValue", false);
  stopQrCountdown();
  stopPaymentPolling();
  qrData.value = null;
  qrExpired.value = false;
  depositAmount.value = 100000;
  depositAmountDisplay.value = "100.000";
  error.value = "";
};

const testPayment = async () => {
  if (!qrData.value || !qrData.value.trans_id) {
    error.value = t('payment.deposit.errors.noTransactionId');
    return;
  }

  if (qrExpired.value || qrTimeRemaining.value <= 0) {
    error.value = t('payment.deposit.errors.qrExpiredShort');
    return;
  }

  testingPayment.value = true;
  error.value = "";

  try {
    const res = await $fetch(
      `${config.public.apiBase}/payment/test/simulate-payment`,
      {
        method: "POST",
        headers: {
          Authorization: auth.token,
        },
        body: {
          trans_id: qrData.value.trans_id,
        },
      }
    );

    if (res.success) {
      stopQrCountdown();
      qrData.value = null;
      handleClose();
      await auth.fetchUser();
      emit("success", {
        amount: res.actual_amount || res.amount,
        newCredit: res.new_credit,
      });
    }
  } catch (err) {
    if (err.data?.error) {
      error.value = err.data.error;
      if (
        err.data.error.includes("hết hạn") ||
        err.data.error.includes("expired")
      ) {
        qrExpired.value = true;
        stopQrCountdown();
      }
    } else {
      error.value = t('payment.deposit.errors.testPaymentError');
    }
  } finally {
    testingPayment.value = false;
  }
};

onBeforeUnmount(() => {
  stopQrCountdown();
  stopPaymentPolling();
});
</script>

<style scoped>
/* Payment Modal Styles - From dashboard.vue */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(3px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease-out;
}

.modal-content {
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  max-width: 100%;
  width: min(780px, 92vw);
  height: min(720px, 90vh);
  overflow: hidden;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.22);
  animation: slideIn 0.35s ease-out;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.qr-time-remaining {
  color: #f59e0b;
  font-weight: 600;
  font-size: 0.9rem;
  white-space: nowrap;
}

.test-payment-btn-header {
  padding: 0.5rem 0.75rem;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.test-payment-btn-header:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 5px 15px rgba(245, 158, 11, 0.3);
}

.test-payment-btn-header:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.modal-close {
  background: none;
  border: none;
  font-size: 2rem;
  color: #9ca3af;
  cursor: pointer;
  padding: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.modal-close:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.modal-body {
  padding: 1.25rem 1.5rem 1.5rem;
  height: calc(100% - 72px);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow: hidden;
}

/* Payment Tabs */
.payment-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 0;
}

.payment-tab {
  padding: 0.7rem 1rem;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  color: #6b7280;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.payment-tab.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
}

.payment-tab-content {
  display: none;
}

.payment-tab-content.active {
  display: block;
}

/* Payment Content Grid */
.payment-content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  align-items: start;
  flex: 1;
  min-height: 0;
}

.payment-content-grid > * {
  min-width: 0;
}

/* QR Section */
.payment-qr-section {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  min-height: 0;
}

.qr-container {
  background: white;
  border-radius: 16px;
  padding: 1rem;
  text-align: center;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.qr-logo {
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.qr-code-placeholder {
  margin: 1rem 0;
  min-height: 190px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-code-placeholder img {
  width: 260px;
  height: 260px;
  border-radius: 12px;
  object-fit: cover;
}

.qr-placeholder-text {
  color: #9ca3af;
  font-size: 0.95rem;
  text-align: center;
  padding: 2rem;
  background: #f8fafc;
  border: 2px dashed #e5e7eb;
  border-radius: 12px;
  width: 260px;
  height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-brands {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
  font-size: 0.8rem;
  color: #6b7280;
}

.account-info {
  background: #f8fafc;
  border-radius: 16px;
  padding: 1rem;
  text-align: center;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.account-name,
.account-number {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.account-amount {
  color: #059669;
  font-weight: 500;
  margin-bottom: 0.2rem;
}

.qr-instruction {
  color: #6b7280;
  font-size: 0.9rem;
  margin: 0;
}

/* Payment Form Section */
.payment-form-section {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  min-height: 0;
}

.payment-form-section input {
  color: black !important;
}

.payment-form-section .form-group {
  margin-bottom: 0;
}

.payment-form-section .form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #374151;
  font-weight: 500;
  font-size: 0.9rem;
}

.payment-form-section input {
  width: 100%;
  padding: 0.9rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  background: white;
  transition: all 0.3s ease;
}

.payment-form-section input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* Quick Amount Buttons */
.quick-amount-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}

.quick-amount-btn {
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: 8px;
  font-weight: 500;
  font-size: 1.05rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.quick-amount-btn:hover {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.05);
}

.quick-amount-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
}

/* Account Details */
.account-details {
  background: #f8fafc;
  border-radius: 12px;
  padding: 1rem;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
}

.detail-row:not(:last-child) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.detail-label {
  color: #6b7280;
  font-size: 0.9rem;
}

.detail-value {
  font-weight: 500;
  color: #1f2937;
}

/* Transfer Content */
.transfer-content {
  background: #f8fafc;
  border-radius: 12px;
  padding: 1rem;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.transfer-content label {
  display: block;
  margin-bottom: 0.5rem;
  color: #374151;
  font-weight: 500;
  font-size: 0.9rem;
}

.required-note {
  color: #ef4444;
  font-size: 0.9rem;
}

.transfer-content-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-family: 'Courier New', monospace;
  font-weight: bold;
  color: #1f2937;
}

.transfer-placeholder {
  color: #9ca3af;
  font-weight: normal;
  font-style: italic;
}

.btn-copy-content {
  background: #667eea;
  border: none;
  border-radius: 6px;
  padding: 0.5rem;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-copy-content:hover {
  background: #5a67d8;
  transform: scale(1.05);
}

/* Payment Actions */
.confirm-payment-btn {
  width: 100%;
  padding: 0.95rem 1rem;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.confirm-payment-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
}

.confirm-payment-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.test-payment-btn {
  width: 100%;
  padding: 0.95rem 1rem;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.test-payment-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(245, 158, 11, 0.3);
}

.test-payment-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

/* PayPal Info */
.paypal-info {
  text-align: center;
  padding: 2rem;
}

.paypal-info p {
  color: #64748b !important;
}

.message.error {
  color: #ef4444;
  font-size: 0.9rem;
  padding: 0.75rem;
  background: #fee2e2;
  border-radius: 8px;
  border: 1px solid #fecaca;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .modal-content {
    width: 94vw;
    height: 92vh;
  }

  .payment-content-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
    overflow: auto;
    padding-bottom: 0.25rem;
  }
}
</style>