// ═══════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════
let products = JSON.parse(localStorage.getItem('db_products') || '[]');
let orders   = JSON.parse(localStorage.getItem('db_orders')   || '[]');
let announcements = JSON.parse(localStorage.getItem('db_anns') || '[]');
let cart     = JSON.parse(localStorage.getItem('db_cart')     || '[]');
let currency = localStorage.getItem('db_currency') || 'USD';
let currentRole = '';
let selectedPayMethod = 'Cash';

const RATES = { USD:1, JMD:156, GBP:0.79, EUR:0.93, CAD:1.37 };
const SYMBOLS = { USD:'$', JMD:'J$', GBP:'£', EUR:'€', CAD:'CA$' };

function save() {
  localStorage.setItem('db_products', JSON.stringify(products));
  localStorage.setItem('db_orders',   JSON.stringify(orders));
  localStorage.setItem('db_anns',     JSON.stringify(announcements));
  localStorage.setItem('db_cart',     JSON.stringify(cart));
  localStorage.setItem('db_currency', currency);
}

function fmt(usd) {
  const v = (parseFloat(usd) * RATES[currency]).toFixed(2);
  return SYMBOLS[currency] + v;
}

// ═══════════════════════════════════════════
//  NAVIGATION
// ═══════════════════════════════════════════
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function enterAs(role) {
  currentRole = role;
  if (role === 'customer') {
    showScreen('screen-customer');
    showCustomerTab('shop');
  } else {
    showScreen('screen-owner');
    showOwnerTab('upload');
    refreshDashStats();
  }
}

function backToLanding() { showScreen('screen-landing'); }

function showCustomerTab(tab) {
  ['shop','sales','cart'].forEach(t => {
    document.getElementById('csub-'+t).style.display = t===tab ? 'block' : 'none';
  });
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const map = { shop:'navShop', sales:'navSales', cart:'navCart' };
  if (map[tab]) document.getElementById(map[tab]).classList.add('active');
  if (tab==='shop')  renderCustomerShop();
  if (tab==='sales') renderAnnouncements();
  if (tab==='cart')  renderCart();
}

function showOwnerTab(tab) {
  ['upload','products','orders','announce','banking'].forEach(t => {
    document.getElementById('oSub-'+t).style.display = t===tab ? 'block' : 'none';
  });
  document.querySelectorAll('.dash-tab').forEach(b => b.classList.remove('active'));
  const id = { upload:'oTabUpload', products:'oTabProducts', orders:'oTabOrders', announce:'oTabAnnounce', banking:'oTabBanking' };
  if (id[tab]) document.getElementById(id[tab]).classList.add('active');
  if (tab==='products') renderOwnerProducts();
  if (tab==='orders')   renderOrders();
  if (tab==='announce') renderOwnerAnnouncements();
  if (tab==='banking')  loadBankDetails();
}

// ═══════════════════════════════════════════
//  CURRENCY
// ═══════════════════════════════════════════
function updateCurrency() {
  currency = document.getElementById(currentRole==='owner'?'ownerCurrency':'custCurrency').value;
  // sync both selects
  document.getElementById('custCurrency').value  = currency;
  document.getElementById('ownerCurrency').value = currency;
  save();
  if (currentRole==='customer') {
    const active = document.querySelector('[id^="csub-"]:not([style*="none"])');
    if (active) {
      const tab = active.id.replace('csub-','');
      showCustomerTab(tab);
    }
  } else {
    refreshDashStats();
  }
}

// ═══════════════════════════════════════════
//  SPARKLES (landing)
// ═══════════════════════════════════════════
(function spawnSparkles() {
  const c = document.getElementById('sparkles');
  for (let i=0; i<40; i++) {
    const s = document.createElement('div');
    s.className = 'spark';
    s.style.left = Math.random()*100+'%';
    s.style.top  = Math.random()*100+'%';
    s.style.animationDelay = (Math.random()*3)+'s';
    s.style.animationDuration = (2+Math.random()*3)+'s';
    c.appendChild(s);
  }
})();

// ═══════════════════════════════════════════
//  TOAST
// ═══════════════════════════════════════════
function toast(title, msg, color='var(--hot-pink)') {
  const c = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = 'toast';
  t.style.borderLeftColor = color;
  t.innerHTML = `<div class="toast-title">${title}</div><div>${msg}</div>`;
  c.appendChild(t);
  setTimeout(() => {
    t.classList.add('fade-out');
    setTimeout(() => t.remove(), 300);
  }, 3500);
}

// ═══════════════════════════════════════════
//  CUSTOMER — SHOP
// ═══════════════════════════════════════════
function renderCustomerShop() {
  const grid = document.getElementById('customerProductGrid');
  grid.innerHTML = '';

  // sale banner
  const saleProd = products.find(p=>p.salePrice);
  const banner = document.getElementById('heroBanner');
  if (saleProd) {
    banner.style.display = 'inline-block';
    banner.textContent = `🔥 SALE ON NOW — Up to ${Math.round((1-saleProd.salePrice/saleProd.price)*100)}% OFF selected items!`;
  } else { banner.style.display = 'none'; }

  if (!products.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="emoji">👗</div><p>New pieces dropping soon. Stay tuned!</p></div>`;
    return;
  }

  products.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';
    const displayPrice = p.salePrice || p.price;
    card.innerHTML = `
      <div class="product-img-wrap">
        ${p.image
          ? `<img src="${p.image}" alt="${p.name}" loading="lazy"/>`
          : `<div class="product-img-placeholder">👗<span>${p.category}</span></div>`}
        ${p.outOfStock ? '<div class="out-of-stock-overlay">OUT OF STOCK</div>' : ''}
        ${p.salePrice  ? `<div class="sale-tag">SALE</div>` : ''}
      </div>
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div>
          <span class="product-price">${fmt(displayPrice)}</span>
          ${p.salePrice ? `<span class="product-orig-price">${fmt(p.price)}</span>` : ''}
        </div>
        <div class="product-actions">
          ${!p.outOfStock
            ? `<button class="btn-primary" onclick="openProductModal('${p.id}')">Select & Buy</button>
               <button class="btn-secondary" title="Add to cart" onclick="quickAddCart('${p.id}')">🛒</button>`
            : `<button class="btn-secondary" disabled style="opacity:.5;flex:1">Out of Stock</button>`}
        </div>
      </div>`;
    grid.appendChild(card);
  });
}

// ═══════════════════════════════════════════
//  PRODUCT MODAL
// ═══════════════════════════════════════════
let modalState = {};

function openProductModal(pid) {
  const p = products.find(x=>x.id===pid);
  if (!p || p.outOfStock) return;
  modalState = { pid, qty:1, size:'', color:'' };

  const content = document.getElementById('modalContent');
  content.innerHTML = `
    <h2>${p.name}</h2>
    ${p.image
      ? `<img class="modal-img" src="${p.image}" alt="${p.name}"/>`
      : `<div class="modal-img-placeholder">👗</div>`}
    <p style="color:var(--text);opacity:0.7;font-size:0.95rem;line-height:1.6">${p.description||''}</p>

    ${p.sizes&&p.sizes.length ? `
      <span class="option-label">Select Size</span>
      <div class="size-grid">
        ${p.sizes.map(s=>`<button class="size-chip" onclick="selectModalSize(this,'${s}')">${s}</button>`).join('')}
      </div>` : ''}

    ${p.colors&&p.colors.length ? `
      <span class="option-label">Select Color</span>
      <div class="color-grid">
        ${p.colors.map(c=>`<div class="color-chip" style="background:${c.hex}" title="${c.name}" onclick="selectModalColor(this,'${c.name}')"></div>`).join('')}
      </div>` : ''}

    <div class="qty-row">
      <span class="option-label" style="margin:0">Quantity</span>
      <button class="qty-btn" onclick="changeQty(-1)">−</button>
      <span class="qty-val" id="modalQty">1</span>
      <button class="qty-btn" onclick="changeQty(1)">+</button>
    </div>

    <div class="modal-price" id="modalPrice">${fmt((p.salePrice||p.price))}</div>

    <div class="modal-actions">
      <button class="btn-primary" onclick="addToCartFromModal()">🛒 Add to Cart</button>
      <button class="btn-primary" style="background:linear-gradient(135deg,var(--coral),var(--deep-pink))" onclick="buyNow()">⚡ Buy Now</button>
    </div>`;

  document.getElementById('productModal').classList.add('open');
}

function selectModalSize(el, s) {
  el.closest('.size-grid').querySelectorAll('.size-chip').forEach(c=>c.classList.remove('selected'));
  el.classList.add('selected');
  modalState.size = s;
}
function selectModalColor(el, name) {
  el.closest('.color-grid').querySelectorAll('.color-chip').forEach(c=>c.classList.remove('selected'));
  el.classList.add('selected');
  modalState.color = name;
}
function changeQty(delta) {
  modalState.qty = Math.max(1, modalState.qty + delta);
  document.getElementById('modalQty').textContent = modalState.qty;
  const p = products.find(x=>x.id===modalState.pid);
  const unit = p.salePrice||p.price;
  document.getElementById('modalPrice').textContent = fmt(unit * modalState.qty);
}
function closeModal() { document.getElementById('productModal').classList.remove('open'); }

function addToCartFromModal() {
  const p = products.find(x=>x.id===modalState.pid);
  const sizes = p.sizes||[];
  if (sizes.length && !modalState.size) { toast('Pick a size','Please select your size ✨','var(--coral)'); return; }
  const colors = p.colors||[];
  if (colors.length && !modalState.color) { toast('Pick a color','Please select a color 🎨','var(--coral)'); return; }
  for (let i=0; i<modalState.qty; i++) {
    cart.push({ pid:p.id, name:p.name, price:p.salePrice||p.price, size:modalState.size, color:modalState.color, image:p.image||'' });
  }
  save();
  updateCartBadge();
  closeModal();
  toast('Added to cart!', `${p.name} is in your cart 🛍`, 'var(--hot-pink)');
}

function buyNow() {
  addToCartFromModal();
  closeModal();
  showCustomerTab('cart');
}

function quickAddCart(pid) {
  const p = products.find(x=>x.id===pid);
  if (!p||p.outOfStock) return;
  if ((p.sizes&&p.sizes.length)||(p.colors&&p.colors.length)) {
    openProductModal(pid); return;
  }
  cart.push({ pid:p.id, name:p.name, price:p.salePrice||p.price, size:'', color:'', image:p.image||'' });
  save();
  updateCartBadge();
  toast('Added!', p.name+' added to cart 🛒', 'var(--hot-pink)');
}

function updateCartBadge() {
  document.getElementById('cartBadge').textContent = cart.length;
}

// ═══════════════════════════════════════════
//  CART
// ═══════════════════════════════════════════
function renderCart() {
  const con = document.getElementById('cartItemsContainer');
  const sumCon = document.getElementById('cartSummaryContainer');
  con.innerHTML = ''; sumCon.innerHTML = '';

  if (!cart.length) {
    con.innerHTML = `<div class="empty-state"><div class="emoji">🛒</div><p>Your cart is empty. Go treat yourself!</p></div>`;
    return;
  }

  cart.forEach((item, idx) => {
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      ${item.image
        ? `<img class="cart-item-img" src="${item.image}" alt="${item.name}"/>`
        : `<div class="cart-item-img">👗</div>`}
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-meta">
          ${item.size ? 'Size: '+item.size : ''}
          ${item.color ? ' · Color: '+item.color : ''}
        </div>
        <div class="cart-item-price">${fmt(item.price)}</div>
      </div>
      <button class="cart-remove" onclick="removeCartItem(${idx})">🗑</button>`;
    con.appendChild(div);
  });

  const total = cart.reduce((s,i)=>s+parseFloat(i.price),0);
  sumCon.innerHTML = `
    <div class="cart-summary">
      <h3>Order Summary</h3>
      <div class="summary-row"><span>Items (${cart.length})</span><span>${fmt(total)}</span></div>
      <div class="summary-row"><span>Shipping</span><span>TBD</span></div>
      <div class="summary-row summary-total"><span>Total</span><span>${fmt(total)}</span></div>
      <button class="checkout-btn" style="margin-top:1.5rem" onclick="openCheckout()">CHECKOUT ✦</button>
    </div>`;
}

function removeCartItem(idx) {
  cart.splice(idx, 1);
  save();
  updateCartBadge();
  renderCart();
}

// ═══════════════════════════════════════════
//  CHECKOUT
// ═══════════════════════════════════════════
function openCheckout() {
  const total = cart.reduce((s,i)=>s+parseFloat(i.price),0);
  document.getElementById('ckTotal').textContent = fmt(total);
  document.getElementById('checkoutModal').classList.add('open');
}
function closeCheckout() { document.getElementById('checkoutModal').classList.remove('open'); }

function selectPayMethod(el) {
  document.querySelectorAll('.pay-opt').forEach(o=>o.classList.remove('selected'));
  el.classList.add('selected');
  selectedPayMethod = el.dataset.pay;
  document.getElementById('cardFields').style.display = selectedPayMethod==='Card' ? 'block' : 'none';
}

function formatCard(el) {
  let v = el.value.replace(/\D/g,'').substring(0,16);
  el.value = v.replace(/(.{4})/g,'$1 ').trim();
}

function placeOrder() {
  const name    = document.getElementById('ckName').value.trim();
  const email   = document.getElementById('ckEmail').value.trim();
  const address = document.getElementById('ckAddress').value.trim();
  if (!name||!email||!address) { toast('Missing info','Please fill in all required fields','var(--coral)'); return; }

  const total = cart.reduce((s,i)=>s+parseFloat(i.price),0);
  const order = {
    id: 'ORD-' + Date.now(),
    customer: name,
    email,
    phone: document.getElementById('ckPhone').value,
    address,
    items: [...cart],
    total: total.toFixed(2),
    currency,
    payment: selectedPayMethod,
    status: 'pending',
    date: new Date().toLocaleDateString()
  };
  orders.push(order);
  cart = [];
  save();
  updateCartBadge();
  closeCheckout();
  renderCart();
  toast('Order Placed! 🎉', `Thanks ${name}! We'll notify you when it's on its way.`, 'var(--hot-pink)');
  refreshDashStats();
}

// ═══════════════════════════════════════════
//  ANNOUNCEMENTS
// ═══════════════════════════════════════════
function renderAnnouncements() {
  const c = document.getElementById('announcementsContainer');
  c.innerHTML = '<div class="section-title" style="padding-top:2rem">Announcements & Sales</div>';
  if (!announcements.length) {
    c.innerHTML += `<div class="empty-state"><div class="emoji">📣</div><p>No announcements yet. Check back soon!</p></div>`;
    return;
  }
  [...announcements].reverse().forEach(a => {
    c.innerHTML += `
      <div class="announcement-card">
        <div class="ann-type">${a.type}</div>
        <div class="ann-title">${a.title}</div>
        <div class="ann-body">${a.body}</div>
        <div class="ann-date">${a.date}</div>
      </div>`;
  });
}

// ═══════════════════════════════════════════
//  OWNER — UPLOAD
// ═══════════════════════════════════════════
let uploadedImageData = '';
let selectedSizes = [];
let productColors = [];

function toggleChip(el, type) {
  el.classList.toggle('selected');
  const val = el.textContent;
  if (type==='size') {
    if (el.classList.contains('selected')) selectedSizes.push(val);
    else selectedSizes = selectedSizes.filter(s=>s!==val);
  }
}

function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    uploadedImageData = ev.target.result;
    document.getElementById('previewImg').src = uploadedImageData;
    document.getElementById('imagePreview').style.display = 'block';
    document.querySelector('.upload-text').textContent = '✔ Image loaded!';
  };
  reader.readAsDataURL(file);
}

function addColorInput() {
  const row = document.getElementById('colorPickerRow');
  const wrap = document.createElement('div');
  wrap.className = 'color-input-chip';
  const colorId = 'clr_'+Date.now();
  const nameId  = 'cname_'+Date.now();
  wrap.innerHTML = `
    <input type="color" id="${colorId}" value="#FDACAC" style="width:24px;height:24px;border:none;cursor:pointer;border-radius:50%;"/>
    <input type="text" id="${nameId}" placeholder="Name" style="border:none;background:transparent;width:80px;font-size:0.8rem;outline:none;"/>
    <span onclick="this.parentElement.remove()" style="cursor:pointer;color:var(--coral)">✕</span>`;
  row.insertBefore(wrap, row.querySelector('.add-color-btn'));
}

function uploadProduct() {
  const name  = document.getElementById('pName').value.trim();
  const price = parseFloat(document.getElementById('pPrice').value);
  if (!name || isNaN(price)) { toast('Missing fields','Please fill in name and price','var(--coral)'); return; }

  // gather colors
  const colorChips = document.querySelectorAll('.color-input-chip');
  const colors = [];
  colorChips.forEach(chip => {
    const hex  = chip.querySelector('input[type=color]')?.value;
    const cname = chip.querySelector('input[type=text]')?.value.trim() || hex;
    if (hex) colors.push({ hex, name: cname });
  });

  const saleRaw = parseFloat(document.getElementById('pSalePrice').value);
  const prod = {
    id: 'P_'+Date.now(),
    name,
    price,
    salePrice: isNaN(saleRaw) ? null : saleRaw,
    category: document.getElementById('pCategory').value,
    description: document.getElementById('pDesc').value.trim(),
    sizes: [...selectedSizes],
    colors,
    outOfStock: document.getElementById('pStock').value === 'out',
    image: uploadedImageData,
    date: new Date().toLocaleDateString()
  };

  products.push(prod);
  save();
  refreshDashStats();
  toast('Published! ✦', `"${name}" is now live in the shop.`, 'var(--hot-pink)');

  // reset form
  document.getElementById('pName').value = '';
  document.getElementById('pPrice').value = '';
  document.getElementById('pSalePrice').value = '';
  document.getElementById('pDesc').value = '';
  document.getElementById('pStock').value = 'in';
  document.querySelectorAll('#ownerSizeGrid .size-chip').forEach(c=>c.classList.remove('selected'));
  selectedSizes = [];
  document.querySelectorAll('.color-input-chip').forEach(c=>c.remove());
  uploadedImageData = '';
  document.getElementById('imagePreview').style.display = 'none';
  document.querySelector('.upload-text').textContent = 'Click or drag to upload image';
}

// ═══════════════════════════════════════════
//  OWNER — PRODUCTS LIST
// ═══════════════════════════════════════════
function renderOwnerProducts() {
  const grid = document.getElementById('ownerProductGrid');
  grid.innerHTML = '';
  if (!products.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="emoji">👗</div><p>No products yet. Upload your first design!</p></div>`;
    return;
  }
  products.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-img-wrap">
        ${p.image ? `<img src="${p.image}" alt="${p.name}"/>` : `<div class="product-img-placeholder">👗</div>`}
        ${p.outOfStock ? '<div class="out-of-stock-overlay">OUT OF STOCK</div>' : ''}
        ${p.salePrice  ? '<div class="sale-tag">SALE</div>' : ''}
      </div>
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-price">${fmt(p.salePrice||p.price)}${p.salePrice?` <span class="product-orig-price">${fmt(p.price)}</span>`:''}</div>
        <div style="font-size:0.8rem;color:#888;margin-top:0.3rem">${p.sizes.join(', ')||'No sizes'}</div>
        <div class="product-actions" style="flex-wrap:wrap;gap:0.4rem;margin-top:0.8rem">
          <button class="btn-secondary" onclick="toggleStock('${p.id}')">${p.outOfStock?'Mark In Stock':'Mark Out'}</button>
          <button class="btn-secondary" onclick="deleteProduct('${p.id}')" style="color:var(--coral)">🗑 Delete</button>
        </div>
      </div>`;
    grid.appendChild(card);
  });
}

function toggleStock(pid) {
  const p = products.find(x=>x.id===pid);
  if (!p) return;
  p.outOfStock = !p.outOfStock;
  save();
  renderOwnerProducts();
  toast('Updated', p.name+' is now '+(p.outOfStock?'out of stock':'in stock'), 'var(--coral)');
}
function deleteProduct(pid) {
  if (!confirm('Delete this product?')) return;
  products = products.filter(p=>p.id!==pid);
  save();
  renderOwnerProducts();
  refreshDashStats();
}

// ═══════════════════════════════════════════
//  OWNER — ORDERS
// ═══════════════════════════════════════════
function renderOrders() {
  const tbody = document.getElementById('ordersBody');
  const empty = document.getElementById('ordersEmpty');
  tbody.innerHTML = '';

  if (!orders.length) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  [...orders].reverse().forEach(o => {
    const itemNames = o.items.map(i=>i.name+(i.size?' ('+i.size+')':'')).join(', ');
    // show total in current currency — note order.currency might differ
    const totalDisplay = fmt(parseFloat(o.total));
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${o.id}</strong><br/><span style="font-size:0.75rem;color:#888">${o.date}</span></td>
      <td>${o.customer}<br/><span style="font-size:0.75rem;color:#888">${o.email}</span></td>
      <td style="max-width:200px;font-size:0.8rem">${itemNames}</td>
      <td><strong>${totalDisplay}</strong><br/><span style="font-size:0.75rem;color:#888">${o.payment}</span></td>
      <td>${o.payment==='Card'?'💳':'💵'} ${o.payment}</td>
      <td><span class="status-badge status-${o.status}">${o.status.toUpperCase()}</span></td>
      <td>
        ${o.status==='pending'
          ? `<button class="deliver-btn" onclick="markFilled('${o.id}')">Mark Filled</button>`
          : o.status==='filled'
          ? `<button class="deliver-btn" onclick="markDelivered('${o.id}')">Mark Delivered</button>`
          : '✅ Done'}
      </td>`;
    tbody.appendChild(tr);
  });
}

function markFilled(oid) {
  const o = orders.find(x=>x.id===oid);
  if (!o) return;
  o.status = 'filled';
  save();
  renderOrders();
  refreshDashStats();
  toast('Order Filled', o.id+' has been marked as filled ✦', 'var(--hot-pink)');
}

function markDelivered(oid) {
  const o = orders.find(x=>x.id===oid);
  if (!o) return;
  o.status = 'delivered';
  save();
  renderOrders();
  refreshDashStats();
  // Simulate sending customer notification
  toast('📦 Delivered!', `Notification sent to ${o.customer} — order ${o.id} delivered!`, 'var(--hot-pink)');
  setTimeout(()=>{
    toast('✉️ Customer Notified', `Email notification sent to ${o.email}`, 'var(--hot-pink)');
  }, 1200);
}

// ═══════════════════════════════════════════
//  OWNER — ANNOUNCEMENTS
// ═══════════════════════════════════════════
function postAnnouncement() {
  const title = document.getElementById('annTitle').value.trim();
  const body  = document.getElementById('annBody').value.trim();
  const type  = document.getElementById('annType').value;
  if (!title||!body) { toast('Missing info','Please fill in title and message','var(--coral)'); return; }

  announcements.push({ id:'A_'+Date.now(), type, title, body, date: new Date().toLocaleDateString() });
  save();
  document.getElementById('annTitle').value='';
  document.getElementById('annBody').value='';
  renderOwnerAnnouncements();
  toast('Posted! 📣', 'Your announcement is now live.', 'var(--hot-pink)');
}

function renderOwnerAnnouncements() {
  const c = document.getElementById('ownerAnnList');
  c.innerHTML = '';
  if (!announcements.length) { c.innerHTML='<p style="color:#aaa">No announcements yet.</p>'; return; }
  [...announcements].reverse().forEach(a => {
    c.innerHTML += `
      <div class="announcement-card" style="position:relative">
        <div class="ann-type">${a.type}</div>
        <div class="ann-title">${a.title}</div>
        <div class="ann-body">${a.body}</div>
        <div class="ann-date">${a.date}</div>
        <button onclick="deleteAnn('${a.id}')" style="position:absolute;top:1rem;right:1rem;background:none;border:none;color:var(--coral);cursor:pointer;font-size:1.1rem;">✕</button>
      </div>`;
  });
}

function deleteAnn(aid) {
  announcements = announcements.filter(a=>a.id!==aid);
  save();
  renderOwnerAnnouncements();
}

// ═══════════════════════════════════════════
//  DASHBOARD STATS
// ═══════════════════════════════════════════
function refreshDashStats() {
  document.getElementById('statProducts').textContent = products.length;
  document.getElementById('statOrders').textContent   = orders.length;
  const revenue = orders.filter(o=>o.status!=='pending')
    .reduce((s,o)=>s+parseFloat(o.total),0);
  document.getElementById('statRevenue').textContent  = fmt(revenue);
  document.getElementById('statPending').textContent  = orders.filter(o=>o.status==='pending').length;
}

// ═══════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════
updateCartBadge();
document.getElementById('custCurrency').value  = currency;
document.getElementById('ownerCurrency').value = currency;

// ── OWNER PASSWORD GATE ──
function ownerLogin() {
  document.getElementById('ownerPassInput').value = '';
  document.getElementById('passError').style.display = 'none';
  document.getElementById('ownerPassModal').classList.add('open');
  setTimeout(()=>document.getElementById('ownerPassInput').focus(), 100);
}
function closeOwnerPass() {
  document.getElementById('ownerPassModal').classList.remove('open');
}
function togglePassVis() {
  const inp = document.getElementById('ownerPassInput');
  inp.type = inp.type === 'password' ? 'text' : 'password';
}
function checkOwnerPass() {
  const val = document.getElementById('ownerPassInput').value;
  if (val === 'TJsLamea$$') {
    closeOwnerPass();
    enterAs('owner');
  } else {
    document.getElementById('passError').style.display = 'block';
    document.getElementById('ownerPassInput').value = '';
    document.getElementById('ownerPassInput').focus();
    // shake animation
    const inp = document.getElementById('ownerPassInput');
    inp.style.animation = 'shake 0.4s ease';
    setTimeout(()=>inp.style.animation='', 400);
  }
}


// ── animate leopard pattern on SVG ──
(function() {
  let offset = 0;
  function animLeopard() {
    offset = (offset + 0.4) % 300;
    const pat = document.getElementById('leopardPat');
    if (pat) { pat.setAttribute('x', offset); pat.setAttribute('y', offset*0.6); }
    requestAnimationFrame(animLeopard);
  }
  animLeopard();
})();


// ══════════════════════════════════════════
//  BANKING / PAYOUTS
// ══════════════════════════════════════════
let currentAcctType = 'bank';

function selectAcctType(el) {
  document.querySelectorAll('#acctTypeRow .pay-opt').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  currentAcctType = el.dataset.acct;
  document.getElementById('bankFields').style.display      = currentAcctType === 'bank'    ? 'block' : 'none';
  document.getElementById('cardPayoutFields').style.display = currentAcctType === 'card'    ? 'block' : 'none';
  document.getElementById('paypalFields').style.display    = currentAcctType === 'paypal'  ? 'block' : 'none';
  document.getElementById('cashappFields').style.display   = currentAcctType === 'cashapp' ? 'block' : 'none';
}

function fmtCardPayout(el) {
  let v = el.value.replace(/\D/g,'').substring(0,16);
  el.value = v.replace(/(.{4})/g,'$1 ').trim();
}

function saveBankDetails() {
  let details = { type: currentAcctType, currency: document.getElementById('bkCurrency').value, schedule: document.getElementById('bkSchedule').value };

  if (currentAcctType === 'bank') {
    const name    = document.getElementById('bkName').value.trim();
    const bank    = document.getElementById('bkBank').value.trim();
    const acct    = document.getElementById('bkAcct').value.trim();
    const routing = document.getElementById('bkRouting').value.trim();
    if (!name || !bank || !acct || !routing) { toast('Missing fields', 'Please fill in all bank details', 'var(--coral)'); return; }
    details = { ...details, name, bank, acctMasked: '••••' + acct.slice(-4), routing: routing.slice(0,4) + '••••', swift: document.getElementById('bkSwift').value.trim() };
  } else if (currentAcctType === 'card') {
    const cardName = document.getElementById('bkCardName').value.trim();
    const cardNum  = document.getElementById('bkCardNum').value.trim();
    if (!cardName || !cardNum) { toast('Missing fields', 'Please fill in card details', 'var(--coral)'); return; }
    details = { ...details, name: cardName, cardMasked: '•••• •••• •••• ' + cardNum.replace(/\s/g,'').slice(-4) };
  } else if (currentAcctType === 'paypal') {
    const email = document.getElementById('bkPaypal').value.trim();
    if (!email) { toast('Missing email', 'Please enter your PayPal email', 'var(--coral)'); return; }
    details = { ...details, email };
  } else if (currentAcctType === 'cashapp') {
    const tag = document.getElementById('bkCashtag').value.trim();
    if (!tag) { toast('Missing handle', 'Please enter your CashApp/Venmo handle', 'var(--coral)'); return; }
    details = { ...details, tag };
  }

  localStorage.setItem('db_banking', JSON.stringify(details));
  toast('Saved! 💳', 'Your payout details have been saved securely.', 'var(--hot-pink)');
  loadBankDetails();
}

function loadBankDetails() {
  const raw = localStorage.getItem('db_banking');
  const infoBox   = document.getElementById('bankSavedInfo');
  const summaryEl = document.getElementById('bankSavedInfo');

  if (!raw) { infoBox.style.display = 'none'; return; }

  const d = JSON.parse(raw);
  infoBox.style.display = 'block';

  // Build summary
  let rows = '';
  const typeLabels = { bank:'🏦 Bank Account', card:'💳 Card', paypal:'🅿️ PayPal', cashapp:'💚 CashApp/Venmo' };
  rows += summaryRow('Account Type', typeLabels[d.type] || d.type);
  rows += summaryRow('Payout Currency', d.currency);
  rows += summaryRow('Schedule', d.schedule);
  if (d.name)        rows += summaryRow('Name', d.name);
  if (d.bank)        rows += summaryRow('Bank', d.bank);
  if (d.acctMasked)  rows += summaryRow('Account', d.acctMasked);
  if (d.routing)     rows += summaryRow('Routing', d.routing);
  if (d.swift)       rows += summaryRow('SWIFT/IBAN', d.swift);
  if (d.cardMasked)  rows += summaryRow('Card', d.cardMasked);
  if (d.email)       rows += summaryRow('PayPal', d.email);
  if (d.tag)         rows += summaryRow('Handle', d.tag);

  document.getElementById('bankSavedSummary').innerHTML = rows;

  // Transaction history from orders
  const txEl = document.getElementById('txHistory');
  const cardOrders = orders.filter(o => o.payment === 'Card');
  if (!cardOrders.length) {
    txEl.innerHTML = '<p style="color:#888;font-size:0.9rem">No card transactions yet. Cash orders are collected in person.</p>';
    return;
  }
  const totalRevenue = cardOrders.reduce((s,o) => s + parseFloat(o.total), 0);
  let txHTML = `<div style="margin-bottom:1rem;padding:0.8rem 1rem;background:rgba(255,45,135,0.1);border-radius:12px;display:flex;justify-content:space-between;align-items:center">
    <span style="color:var(--blush);font-size:0.85rem">Total Card Revenue</span>
    <span style="color:var(--hot-pink);font-weight:700;font-size:1.3rem">${fmt(totalRevenue)}</span>
  </div>`;
  [...cardOrders].reverse().forEach(o => {
    const statusColor = o.status === 'delivered' ? 'var(--rose)' : o.status === 'filled' ? 'var(--blush)' : 'var(--coral)';
    txHTML += `<div style="display:flex;justify-content:space-between;align-items:center;padding:0.6rem 0;border-bottom:1px solid rgba(255,255,255,0.08);font-size:0.88rem">
      <div>
        <div style="color:var(--cream);font-weight:600">${o.customer}</div>
        <div style="color:#888;font-size:0.78rem">${o.id} · ${o.date}</div>
      </div>
      <div style="text-align:right">
        <div style="color:var(--hot-pink);font-weight:700">${fmt(o.total)}</div>
        <div style="color:${statusColor};font-size:0.75rem;text-transform:uppercase;letter-spacing:1px">${o.status}</div>
      </div>
    </div>`;
  });
  txEl.innerHTML = txHTML;
}

function summaryRow(label, value) {
  return `<div style="display:flex;justify-content:space-between;padding:0.5rem 0;border-bottom:1px solid rgba(255,255,255,0.08);font-size:0.9rem">
    <span style="color:#888;text-transform:uppercase;letter-spacing:1px;font-size:0.78rem">${label}</span>
    <span style="color:var(--cream);font-weight:600">${value}</span>
  </div>`;
}
