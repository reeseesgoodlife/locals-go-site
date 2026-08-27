import React, { useState, useMemo } from "react";
import {
  Plus,
  Minus,
  Trash2,
  Banknote,
  Smartphone,
  Landmark,
  X,
  Check,
  ShoppingCart,
  RotateCcw,
  History,
  PlusCircle,
} from "lucide-react";

const BRAND = {
  bg: "#0B0D0F",
  card: "#15181B",
  cardBorder: "#23282c",
  lime: "#B4FF39",
  purple: "#8B2FE0",
  purpleText: "#c397f5",
  ink: "#F2F3EE",
  inkDim: "#8B9198",
};

const DEFAULT_MENU = [
  // Menu Items
  { id: "m1", name: "Assorted Chips", price: 2.25, category: "Menu Items" },
  { id: "m2", name: "Little Bites Muffins", price: 3.75, category: "Menu Items" },
  { id: "m3", name: "Hostess Big Bag Donuts", price: 6.0, category: "Menu Items" },
  { id: "m4", name: "Oats/Honey Snack Bar", price: 1.5, category: "Menu Items" },
  { id: "m5", name: "Shortbread Cookies", price: 4.25, category: "Menu Items" },
  { id: "m6", name: "Crackers Cheese/Peanut Butter", price: 1.5, category: "Menu Items" },
  { id: "m7", name: "Powdered Donuts", price: 3.75, category: "Menu Items" },
  { id: "m8", name: "Banana Nut Muffins", price: 3.75, category: "Menu Items" },
  { id: "m9", name: "Small Hostess Snacks", price: 2.22, category: "Menu Items" },
  // Drinks
  { id: "d1", name: "Water (Reg)", price: 2.0, category: "Drinks" },
  { id: "d2", name: "Alkaline Water", price: 4.5, category: "Drinks" },
  { id: "d3", name: "Kool-Aid Soda", price: 2.25, category: "Drinks" },
  { id: "d4", name: "Mini Sodas", price: 1.25, category: "Drinks" },
  { id: "d5", name: "Mini Juices", price: 1.5, category: "Drinks" },
  { id: "d6", name: "Can Soda", price: 2.0, category: "Drinks" },
];

const CASHAPP_TAG = "$SSC28";

const TAX_RATE = 0; // set e.g. 0.0875 if your event location requires sales tax

function money(n) {
  return `$${n.toFixed(2)}`;
}

export default function EventPOS() {
  const [menu, setMenu] = useState(DEFAULT_MENU);
  const [cart, setCart] = useState({}); // id -> qty
  const [showAddItem, setShowAddItem] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");

  const [payModal, setPayModal] = useState(null); // "cash" | "card" | null
  const [cashGiven, setCashGiven] = useState("");

  const [sales, setSales] = useState([]); // completed orders
  const [showHistory, setShowHistory] = useState(false);
  const [toast, setToast] = useState(null);

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .filter(([, qty]) => qty > 0)
        .map(([id, qty]) => ({ ...menu.find((m) => m.id === id), qty })),
    [cart, menu]
  );

  const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.qty, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;
  const itemCount = cartItems.reduce((sum, i) => sum + i.qty, 0);

  const dayTotal = sales.reduce((sum, s) => sum + s.total, 0);
  const dayCount = sales.reduce((sum, s) => sum + s.itemCount, 0);

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  };

  const addToCart = (id) => {
    setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
  };
  const adjustQty = (id, delta) => {
    setCart((c) => {
      const next = { ...c, [id]: Math.max(0, (c[id] || 0) + delta) };
      return next;
    });
  };
  const removeItem = (id) => {
    setCart((c) => {
      const next = { ...c };
      delete next[id];
      return next;
    });
  };
  const clearCart = () => setCart({});

  const addMenuItem = () => {
    const price = parseFloat(newPrice);
    if (!newName.trim() || isNaN(price) || price <= 0) return;
    setMenu((m) => [
      ...m,
      { id: `m_${Date.now()}`, name: newName.trim(), price, category: "Custom" },
    ]);
    setNewName("");
    setNewPrice("");
    setShowAddItem(false);
  };

  const openPay = (method) => {
    if (itemCount === 0) return;
    setCashGiven("");
    setPayModal(method);
  };

  const completeSale = (method) => {
    setSales((s) => [
      {
        id: Date.now(),
        time: new Date(),
        items: cartItems,
        itemCount,
        subtotal,
        tax,
        total,
        method,
      },
      ...s,
    ]);
    clearCart();
    setPayModal(null);
    flash(`Sale complete · ${money(total)} (${method})`);
  };

  const cashNum = parseFloat(cashGiven);
  const changeDue = !isNaN(cashNum) ? cashNum - total : null;
  const cashSufficient = !isNaN(cashNum) && cashNum >= total;

  const resetDay = () => {
    setSales([]);
    clearCart();
    flash("Day reset");
  };

  const categories = [...new Set(menu.map((m) => m.category))];

  return (
    <div
      className="min-h-screen w-full"
      style={{ background: BRAND.bg, fontFamily: "'Inter', sans-serif", color: BRAND.ink }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-20 px-4 py-3 flex items-center justify-between"
        style={{ background: BRAND.bg, borderBottom: `1px solid ${BRAND.cardBorder}` }}
      >
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase" style={{ color: BRAND.inkDim }}>
            Sound Bite Bar · by DJ Lady Solo
          </p>
          <h1 className="text-lg font-extrabold leading-tight">
            {money(dayTotal)} <span style={{ color: BRAND.inkDim, fontSize: 12, fontWeight: 500 }}>· {dayCount} items sold</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(true)}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ border: `1px solid ${BRAND.cardBorder}`, color: BRAND.inkDim }}
            aria-label="Sales history"
          >
            <History size={15} />
          </button>
          <button
            onClick={resetDay}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ border: `1px solid ${BRAND.cardBorder}`, color: BRAND.inkDim }}
            aria-label="Reset day"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

      <div className="px-4 py-4 pb-40 max-w-lg mx-auto">
        {/* Menu grid */}
        {categories.map((cat) => (
          <div key={cat} className="mb-5">
            <p className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: BRAND.inkDim }}>
              {cat}
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {menu
                .filter((m) => m.category === cat)
                .map((item) => (
                  <button
                    key={item.id}
                    onClick={() => addToCart(item.id)}
                    className="rounded-2xl p-3.5 text-left active:scale-[0.97] transition-transform"
                    style={{ background: BRAND.card, border: `1px solid ${BRAND.cardBorder}` }}
                  >
                    <p className="text-sm font-bold mb-1">{item.name}</p>
                    <p className="text-xs" style={{ color: BRAND.lime, fontWeight: 700 }}>
                      {money(item.price)}
                    </p>
                    {cart[item.id] > 0 && (
                      <span
                        className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(180,255,57,0.15)", color: BRAND.lime }}
                      >
                        {cart[item.id]} in cart
                      </span>
                    )}
                  </button>
                ))}
            </div>
          </div>
        ))}

        <button
          onClick={() => setShowAddItem(true)}
          className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold"
          style={{ border: `1px dashed ${BRAND.cardBorder}`, color: BRAND.purpleText }}
        >
          <PlusCircle size={15} /> Add menu item
        </button>
      </div>

      {/* Cart bar / checkout panel */}
      {itemCount > 0 && (
        <div
          className="fixed bottom-0 left-0 right-0 z-30"
          style={{ background: BRAND.card, borderTop: `1px solid ${BRAND.cardBorder}` }}
        >
          <div className="max-w-lg mx-auto px-4 pt-3 pb-4">
            <div className="max-h-40 overflow-y-auto mb-3 flex flex-col gap-2">
              {cartItems.map((i) => (
                <div key={i.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      onClick={() => removeItem(i.id)}
                      style={{ color: BRAND.inkDim }}
                      aria-label={`Remove ${i.name}`}
                    >
                      <Trash2 size={13} />
                    </button>
                    <span className="truncate">{i.name}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => adjustQty(i.id, -1)}
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ border: `1px solid ${BRAND.cardBorder}` }}
                    >
                      <Minus size={11} />
                    </button>
                    <span className="w-4 text-center font-semibold">{i.qty}</span>
                    <button
                      onClick={() => adjustQty(i.id, 1)}
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ border: `1px solid ${BRAND.cardBorder}` }}
                    >
                      <Plus size={11} />
                    </button>
                    <span className="w-14 text-right font-bold" style={{ color: BRAND.lime }}>
                      {money(i.price * i.qty)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-sm mb-3 pt-2" style={{ borderTop: `1px solid ${BRAND.cardBorder}` }}>
              <span style={{ color: BRAND.inkDim }}>{itemCount} items</span>
              <span className="text-lg font-extrabold">{money(total)}</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => openPay("cash")}
                className="flex-1 flex flex-col items-center justify-center gap-1 rounded-xl py-2.5 font-bold text-xs"
                style={{ background: BRAND.lime, color: "#0B0D0F" }}
              >
                <Banknote size={15} /> Cash
              </button>
              <button
                onClick={() => openPay("cashapp")}
                className="flex-1 flex flex-col items-center justify-center gap-1 rounded-xl py-2.5 font-bold text-xs"
                style={{ background: BRAND.purple, color: "#fff" }}
              >
                <Smartphone size={15} /> CashApp
              </button>
              <button
                onClick={() => openPay("chime")}
                className="flex-1 flex flex-col items-center justify-center gap-1 rounded-xl py-2.5 font-bold text-xs"
                style={{ border: `1px solid ${BRAND.cardBorder}`, color: BRAND.purpleText }}
              >
                <Landmark size={15} /> Chime
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty cart hint */}
      {itemCount === 0 && (
        <div
          className="fixed bottom-0 left-0 right-0 z-30 px-4 py-4 text-center text-xs"
          style={{ background: BRAND.card, borderTop: `1px solid ${BRAND.cardBorder}`, color: BRAND.inkDim }}
        >
          <div className="flex items-center justify-center gap-1.5">
            <ShoppingCart size={13} /> Tap an item above to start an order
          </div>
        </div>
      )}

      {/* Cash payment modal */}
      {payModal === "cash" && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setPayModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-t-3xl p-6"
            style={{ background: BRAND.card, border: `1px solid ${BRAND.cardBorder}` }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold">Cash payment</h2>
              <button onClick={() => setPayModal(null)} style={{ color: BRAND.inkDim }}>
                <X size={18} />
              </button>
            </div>

            <div className="text-center mb-5">
              <p className="text-xs" style={{ color: BRAND.inkDim }}>Total due</p>
              <p className="text-3xl font-extrabold">{money(total)}</p>
            </div>

            <label className="block text-xs font-semibold mb-1.5" style={{ color: BRAND.inkDim }}>
              Cash received
            </label>
            <input
              type="number"
              inputMode="decimal"
              value={cashGiven}
              onChange={(e) => setCashGiven(e.target.value)}
              placeholder="0.00"
              autoFocus
              className="w-full rounded-xl px-4 py-3 text-lg font-bold outline-none mb-3"
              style={{ background: BRAND.bg, border: `1px solid ${BRAND.cardBorder}`, color: BRAND.ink }}
            />

            <div className="grid grid-cols-4 gap-2 mb-4">
              {[5, 10, 20, 50].map((q) => (
                <button
                  key={q}
                  onClick={() => setCashGiven(String(q))}
                  className="rounded-lg py-2 text-xs font-semibold"
                  style={{ border: `1px solid ${BRAND.cardBorder}`, color: BRAND.purpleText }}
                >
                  ${q}
                </button>
              ))}
            </div>

            {cashGiven !== "" && (
              <div
                className="rounded-xl px-4 py-3 mb-4 text-center"
                style={{
                  background: cashSufficient ? "rgba(180,255,57,0.08)" : "rgba(255,107,107,0.08)",
                  border: `1px solid ${cashSufficient ? BRAND.lime : "#ff6b6b"}`,
                }}
              >
                <p className="text-xs" style={{ color: BRAND.inkDim }}>
                  {cashSufficient ? "Change due" : "Still needed"}
                </p>
                <p
                  className="text-2xl font-extrabold"
                  style={{ color: cashSufficient ? BRAND.lime : "#ff9b9b" }}
                >
                  {money(Math.abs(changeDue))}
                </p>
              </div>
            )}

            <button
              onClick={() => completeSale("cash")}
              disabled={!cashSufficient}
              className="w-full rounded-xl py-3.5 font-bold text-sm flex items-center justify-center gap-2"
              style={{
                background: BRAND.lime,
                color: "#0B0D0F",
                opacity: cashSufficient ? 1 : 0.4,
              }}
            >
              <Check size={15} /> Complete sale
            </button>
          </div>
        </div>
      )}

      {/* CashApp payment modal */}
      {payModal === "cashapp" && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setPayModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-t-3xl p-6"
            style={{ background: BRAND.card, border: `1px solid ${BRAND.cardBorder}` }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold">CashApp payment</h2>
              <button onClick={() => setPayModal(null)} style={{ color: BRAND.inkDim }}>
                <X size={18} />
              </button>
            </div>
            <div className="text-center mb-4">
              <p className="text-xs" style={{ color: BRAND.inkDim }}>Send to</p>
              <p className="text-2xl font-extrabold" style={{ color: BRAND.lime }}>{CASHAPP_TAG}</p>
              <p className="text-3xl font-extrabold mt-2">{money(total)}</p>
            </div>
            <p className="text-xs text-center mb-5" style={{ color: BRAND.inkDim }}>
              Have the customer send {money(total)} to {CASHAPP_TAG} on CashApp, then confirm once it lands.
            </p>
            <button
              onClick={() => completeSale("cashapp")}
              className="w-full rounded-xl py-3.5 font-bold text-sm flex items-center justify-center gap-2"
              style={{ background: BRAND.purple, color: "#fff" }}
            >
              <Check size={15} /> Payment received
            </button>
          </div>
        </div>
      )}

      {/* Chime payment modal */}
      {payModal === "chime" && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setPayModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-t-3xl p-6"
            style={{ background: BRAND.card, border: `1px solid ${BRAND.cardBorder}` }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold">Chime payment</h2>
              <button onClick={() => setPayModal(null)} style={{ color: BRAND.inkDim }}>
                <X size={18} />
              </button>
            </div>
            <div className="text-center mb-6">
              <p className="text-xs" style={{ color: BRAND.inkDim }}>Amount due via Chime</p>
              <p className="text-3xl font-extrabold">{money(total)}</p>
            </div>
            <p className="text-xs text-center mb-5" style={{ color: BRAND.inkDim }}>
              Have the customer send {money(total)} through Chime, then confirm once it lands.
            </p>
            <button
              onClick={() => completeSale("chime")}
              className="w-full rounded-xl py-3.5 font-bold text-sm flex items-center justify-center gap-2"
              style={{ background: BRAND.purple, color: "#fff" }}
            >
              <Check size={15} /> Payment received
            </button>
          </div>
        </div>
      )}

      {/* Add menu item modal */}
      {showAddItem && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setShowAddItem(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-t-3xl p-6"
            style={{ background: BRAND.card, border: `1px solid ${BRAND.cardBorder}` }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold">Add menu item</h2>
              <button onClick={() => setShowAddItem(false)} style={{ color: BRAND.inkDim }}>
                <X size={18} />
              </button>
            </div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: BRAND.inkDim }}>
              Item name
            </label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Nachos"
              className="w-full rounded-xl px-3.5 py-2.5 text-sm mb-3 outline-none"
              style={{ background: BRAND.bg, border: `1px solid ${BRAND.cardBorder}`, color: BRAND.ink }}
            />
            <label className="block text-xs font-semibold mb-1.5" style={{ color: BRAND.inkDim }}>
              Price
            </label>
            <input
              type="number"
              inputMode="decimal"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl px-3.5 py-2.5 text-sm mb-4 outline-none"
              style={{ background: BRAND.bg, border: `1px solid ${BRAND.cardBorder}`, color: BRAND.ink }}
            />
            <button
              onClick={addMenuItem}
              className="w-full rounded-xl py-3 font-bold text-sm"
              style={{ background: BRAND.lime, color: "#0B0D0F" }}
            >
              Add to menu
            </button>
          </div>
        </div>
      )}

      {/* Sales history */}
      {showHistory && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setShowHistory(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-t-3xl p-6 max-h-[75vh] overflow-y-auto"
            style={{ background: BRAND.card, border: `1px solid ${BRAND.cardBorder}` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold">Today's sales</h2>
                <p className="text-xs" style={{ color: BRAND.inkDim }}>
                  {money(dayTotal)} across {sales.length} orders
                </p>
              </div>
              <button onClick={() => setShowHistory(false)} style={{ color: BRAND.inkDim }}>
                <X size={18} />
              </button>
            </div>

            {sales.length === 0 ? (
              <p className="text-sm text-center py-10" style={{ color: BRAND.inkDim }}>
                No sales yet.
              </p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {sales.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-xl px-4 py-3"
                    style={{ background: BRAND.bg, border: `1px solid ${BRAND.cardBorder}` }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs" style={{ color: BRAND.inkDim }}>
                        {s.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                        style={{
                          background: s.method === "cash" ? "rgba(180,255,57,0.12)" : "rgba(139,47,224,0.15)",
                          color: s.method === "cash" ? BRAND.lime : BRAND.purpleText,
                        }}
                      >
                        {s.method === "cash" ? <Banknote size={10} /> : s.method === "cashapp" ? <Smartphone size={10} /> : <Landmark size={10} />}
                        {s.method}
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: BRAND.ink }}>
                      {s.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}
                    </p>
                    <p className="text-sm font-bold mt-1" style={{ color: BRAND.lime }}>
                      {money(s.total)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-xs font-semibold"
          style={{ background: BRAND.ink, color: BRAND.bg }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
