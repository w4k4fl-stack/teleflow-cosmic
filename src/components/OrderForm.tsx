import { useState } from 'react';
import type { CartItem } from '../types';

interface OrderFormProps {
  cart: CartItem[];
  total: number;
  onClose: () => void;
  onSubmit: () => void;
  onHover: () => void;
  onClick: () => void;
}

export function OrderForm({ cart, total, onClose, onSubmit, onHover, onClick }: OrderFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [telegram, setTelegram] = useState('');
  const [comment, setComment] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    onClick();

    const order = {
      id: `ORD-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      telegram: telegram.trim(),
      comment: comment.trim(),
      items: cart.map((item) => ({
        name: item.product.name,
        size: item.size,
        quantity: item.quantity,
        price: item.product.price,
      })),
      total,
      createdAt: new Date().toISOString(),
    };

    const existing = JSON.parse(localStorage.getItem('decent-orders') || '[]');
    existing.push(order);
    localStorage.setItem('decent-orders', JSON.stringify(existing));

    setSent(true);
    setTimeout(() => {
      onSubmit();
      onClose();
    }, 2000);
  };

  const formatTotal = (value: number) => `₽${value.toLocaleString('ru-RU')}`;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/70 transition-opacity duration-300 opacity-100 pointer-events-auto"
        onClick={onClose}
      />
      <aside className="product-drawer fixed top-0 right-0 z-50 h-full w-full max-w-full md:max-w-md bg-tunnel border-l-4 border-sludge shadow-[0_0_40px_rgba(57,255,20,0.4)] flex flex-col p-4 md:p-6 translate-x-0">
        <button
          onClick={onClose}
          onMouseEnter={onHover}
          className="self-end arcade-btn text-sm mb-4 px-4 py-3 md:py-2"
        >
          [ X ]
        </button>

        {sent ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="font-glitch text-3xl text-sludge mb-4">ЗАЯВКА ОТПРАВЛЕНА</div>
            <div className="font-pixel text-lg text-fluorescent/80">
              Менеджер свяжется с вами для подтверждения заказа
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-y-auto">
            <h2 className="font-glitch text-2xl md:text-3xl text-sludge mb-2">ОФОРМЛЕНИЕ ЗАКАЗА</h2>
            <div className="font-pixel text-xl text-warning mb-6">{formatTotal(total)}</div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block font-pixel text-sm text-sludge mb-1">[ ИМЯ ]</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-tunnel border-2 border-sludge p-3 font-mono text-fluorescent focus:outline-none focus:shadow-[0_0_12px_rgba(57,255,20,0.5)]"
                  placeholder="Как к вам обращаться"
                />
              </div>

              <div>
                <label className="block font-pixel text-sm text-sludge mb-1">[ ТЕЛЕФОН ]</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full bg-tunnel border-2 border-sludge p-3 font-mono text-fluorescent focus:outline-none focus:shadow-[0_0_12px_rgba(57,255,20,0.5)]"
                  placeholder="+7 (999) 000-00-00"
                />
              </div>

              <div>
                <label className="block font-pixel text-sm text-sludge mb-1">[ TELEGRAM ]</label>
                <input
                  type="text"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  className="w-full bg-tunnel border-2 border-sludge p-3 font-mono text-fluorescent focus:outline-none focus:shadow-[0_0_12px_rgba(57,255,20,0.5)]"
                  placeholder="@username"
                />
              </div>

              <div>
                <label className="block font-pixel text-sm text-sludge mb-1">[ КОММЕНТАРИЙ ]</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className="w-full bg-tunnel border-2 border-sludge p-3 font-mono text-fluorescent focus:outline-none focus:shadow-[0_0_12px_rgba(57,255,20,0.5)] resize-none"
                  placeholder="Размеры, адрес доставки, пожелания"
                />
              </div>
            </div>

            <div className="border-2 border-sludge bg-concrete/20 p-3 mb-6">
              <div className="font-pixel text-sludge mb-2 text-sm">[ СОСТАВ ЗАКАЗА ]</div>
              {cart.map((item, idx) => (
                <div key={idx} className="flex justify-between font-mono text-xs text-fluorescent mb-1">
                  <span>
                    {item.product.name} / {item.size}
                  </span>
                  <span>x{item.quantity}</span>
                </div>
              ))}
            </div>

            <button
              type="submit"
              onMouseEnter={onHover}
              disabled={!name.trim() || !phone.trim()}
              className="arcade-btn w-full text-lg py-4 md:py-3 disabled:opacity-30 disabled:cursor-not-allowed mt-auto"
            >
              [ ОТПРАВИТЬ ЗАЯВКУ ]
            </button>
          </form>
        )}
      </aside>
    </>
  );
}
