// File Location: client/src/pages/PointOfSalePage.tsx

import { useState, useEffect, useMemo, JSX } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../services/api';
import { InventoryItem, CartItem } from '../types';
import { LuTrash2, LuCheck } from 'react-icons/lu';
import PrescriptionDetailsModal from '../components/sales/PrescriptionDetailsModal.tsx';
import ReceiptModal from '../components/sales/ReceiptModal.tsx';
import ConfirmSaleModal from '../components/sales/ConfirmSaleModal.tsx';
import { formatCurrency } from '../utils/currency';

const PointOfSalePage = (): JSX.Element => {
  const { t } = useTranslation();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemRequiringPrescription, setItemRequiringPrescription] = useState<InventoryItem | null>(null);
  const [completedSaleId, setCompletedSaleId] = useState<number | null>(null);

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/inventory');
      setInventory(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch inventory', error);
      setInventory([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchInventory(); }, []);

  const filteredInventory = useMemo(() => {
    if (!searchTerm) {
      return inventory;
    }
    const searchLower = searchTerm.toLowerCase();
    return inventory.filter(item =>
      item.name.toLowerCase().includes(searchLower) ||
      (item.brand && item.brand.toLowerCase().includes(searchLower))
    );
  }, [inventory, searchTerm]);

  const addToCart = (item: InventoryItem, prescriptionId?: number) => {
    if (item.quantity_of_packages <= 0) {
      toast.error(t('notifications.itemOutOfStock'));
      return;
    }
    if (item.requires_prescription && !prescriptionId) {
      setItemRequiringPrescription(item);
      setIsPrescriptionModalOpen(true);
      return;
    }
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        if (existingItem.quantityInCart >= item.quantity_of_packages) {
          toast.error(t('notifications.stockLimitError', { quantity: item.quantity_of_packages }));
          return prevCart;
        }
        return prevCart.map(cartItem =>
          cartItem.id === item.id ? { ...cartItem, quantityInCart: cartItem.quantityInCart + 1 } : cartItem
        );
      }
      return [...prevCart, { ...item, quantityInCart: 1, prescriptionId }];
    });
  };

  const handlePrescriptionSuccess = (prescriptionId: number) => {
    if (itemRequiringPrescription) {
      addToCart(itemRequiringPrescription, prescriptionId);
    }
    setIsPrescriptionModalOpen(false);
    setItemRequiringPrescription(null);
  };

  const updateQuantity = (inventoryItemId: number, newQuantity: number) => {
    const stockItem = inventory.find(item => item.id === inventoryItemId);
    if (stockItem && newQuantity > stockItem.quantity_of_packages) {
        toast.error(t('notifications.quantityLimitError', { quantity: stockItem.quantity_of_packages }));
        return;
    }
    if (newQuantity <= 0) {
      setCart(prevCart => prevCart.filter(item => item.id !== inventoryItemId));
    } else {
      setCart(prevCart => prevCart.map(item =>
        item.id === inventoryItemId ? { ...item, quantityInCart: newQuantity } : item
      ));
    }
  };

  const { subtotal, tax, total, totalItems, hasUnassignedPrescription } = useMemo(() => {
    const sub = cart.reduce((sum, item) => sum + Number(item.selling_price) * item.quantityInCart, 0);
    const itemsCount = cart.reduce((sum, item) => sum + item.quantityInCart, 0);
    const taxAmount = sub * 0.10;
    const unassigned = cart.some(item => item.requires_prescription && !item.prescriptionId);
    return { subtotal: sub, tax: taxAmount, total: sub + taxAmount, totalItems: itemsCount, hasUnassignedPrescription: unassigned };
  }, [cart]);

  const handleCompleteSale = async () => {
    if (cart.length === 0 || isProcessing) return;
    setIsProcessing(true);
    setIsConfirmModalOpen(false);
    try {
      const saleData = {
        cart: cart.map(item => ({
            id: item.id,
            quantityInCart: item.quantityInCart,
            selling_price: item.selling_price,
            prescriptionId: item.prescriptionId
        })),
        total_amount: total.toFixed(2),
        tax_amount: tax.toFixed(2),
      };
      const response = await api.post('/sales', saleData);
      setCart([]);
      fetchInventory();
      setCompletedSaleId(response.data.saleId);
    } catch (error: any) {
      toast.error(error.response?.data?.msg || t('notifications.saleFailed'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleHandoff = async () => {
    if (cart.length === 0 || isProcessing) return;
    setIsProcessing(true);
    setIsConfirmModalOpen(false);
    const toastId = toast.loading(t('notifications.sendingToCashier'));
    try {
      await api.post('/sales/handoff', { cart });
      toast.success(t('notifications.sendToCashierSuccess'), { id: toastId });
      setCart([]);
    } catch (error: any) {
      toast.error(error.response?.data?.msg || t('notifications.sendToCashierError'), { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const closeReceiptModal = () => setCompletedSaleId(null);
  const handleRemoveItemFromCheckout = (itemId: number) => { setCart(prevCart => prevCart.filter(item => item.id !== itemId)); };
  const canCheckout = cart.length > 0 && !isProcessing && !hasUnassignedPrescription;

 return (
    <div className="pos-page-container">
      <div className="header"><h1>{t('pointOfSalePage.title')}</h1></div>
      <div className="pos-container">

        <div className="pos-left">
          <div className="pos-search-header">
            {/* ... search input ... */}
          </div>
          <div className="pos-product-grid">
            {isLoading ? <p className="pos-list-placeholder">{/* ... */}</p> :
             filteredInventory.length === 0 ? <p className="pos-list-placeholder">{/* ... */}</p> :
             (
                filteredInventory.map((item: InventoryItem) => (
                  <button key={item.id} className="pos-product-card" onClick={() => addToCart(item)} disabled={item.quantity_of_packages <= 0}>

                    <div className="card-main-info">
                      <span className="product-name">{item.name}</span>
                      <span className="product-stock">
                        Stock: {item.quantity_of_packages}
                        {item.requires_prescription && <span className="rx-badge-inline">Rx</span>}
                      </span>
                    </div>

                    <div className="card-meta-info">
                      {item.quantity_of_packages > 0 ? (
                        <span className="product-price">{formatCurrency(Number(item.selling_price))}</span>
                      ) : (
                        <span className="out-of-stock-text">Out of Stock</span>
                      )}
                    </div>
                  </button>
                ))
            )}
          </div>
        </div>

        <div className="pos-right">
            <div className="cart-container">
                <div className="cart-header">{t('pointOfSalePage.currentSale')}</div>
                <ul className="cart-items">
                    {cart.length === 0 ? <li className="empty-cart-message">{t('pointOfSalePage.emptyCart')}</li> :
                        cart.map((item: CartItem) => (
                            <li className="cart-item" key={item.id}>
                                <div className="cart-item-details">
                                    <span className="item-name">{item.name}{item.prescriptionId && <span className="prescription-badge-sm">Rx</span>}</span>
                                    <span className="item-price">@ {formatCurrency(Number(item.selling_price))}</span>
                                </div>
                                <div className="quantity-stepper">
                                    <button className="btn-stepper minus" onClick={() => updateQuantity(item.id, item.quantityInCart - 1)}>-</button>
                                    {/* --- THIS IS THE FIX --- */}
                                    <input type="number" className="quantity-input" value={item.quantityInCart} onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 0)} />
                                    <button className="btn-stepper plus" onClick={() => updateQuantity(item.id, item.quantityInCart + 1)}>+</button>
                                </div>
                                <span className="cart-item-total">{formatCurrency(Number(item.selling_price) * item.quantityInCart)}</span>
                                <button className="btn-icon btn-icon-danger" onClick={() => updateQuantity(item.id, 0)}><LuTrash2 size={16} /></button>
                            </li>
                        ))
                    }
                </ul>
                <div className="cart-summary">
                    <div className="summary-row"><span>{t('posConfirmModal.totalItems')}</span><span>{totalItems}</span></div>
                    <div className="summary-row"><span>{t('pointOfSalePage.subtotal')}</span><span>{formatCurrency(subtotal)}</span></div>
                    <div className="summary-row"><span>{t('pointOfSalePage.tax')}</span><span>{formatCurrency(tax)}</span></div>
                    <div className="summary-row total"><span>{t('pointOfSalePage.total')}</span><span>{formatCurrency(total)}</span></div>
                </div>
                <div className="pos-actions-footer">
                    <button className="btn-primary btn-complete-sale" onClick={() => setIsConfirmModalOpen(true)} disabled={!canCheckout} title={hasUnassignedPrescription ? t('pointOfSalePage.prescriptionTooltip') : t('pointOfSalePage.checkout')}>
                        <LuCheck size={18} /> {t('pointOfSalePage.checkout')}
                    </button>
                </div>
            </div>
        </div>
      </div>

      <PrescriptionDetailsModal isOpen={isPrescriptionModalOpen} onClose={() => {setIsPrescriptionModalOpen(false); setItemRequiringPrescription(null);}} onSuccess={handlePrescriptionSuccess} item={itemRequiringPrescription} />
      <ReceiptModal isOpen={!!completedSaleId} onClose={closeReceiptModal} saleId={completedSaleId} />

      <ConfirmSaleModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirmSale={handleCompleteSale}
        onHandoff={handleHandoff}
        onRemoveItem={handleRemoveItemFromCheckout}
        isProcessing={isProcessing}
        cartItems={cart}
        subtotal={subtotal}
        tax={tax}
        totalAmount={total}
      />
    </div>
  );
};

export default PointOfSalePage;