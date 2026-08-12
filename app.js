/* ========================================
   Universal ID - 商家后台
   ======================================== */

/* ---- 分类映射 ---- */
const CATEGORY_NAMES = {
  'Chips': '薯片',
  'Choco': '巧克力',
  'Drinks': '饮料',
  'Cookies': '饼干',
  'Nuts': '坚果',
};

/* ---- 订单状态映射 ---- */
const STATUS_NAMES = {
  'pending': '待处理',
  'completed': '已完成',
  'cancelled': '已取消',
};

/* ---- 共享数据键（与客户端相同）---- */
const STORAGE_KEY = 'universal_id_products';
const ORDERS_KEY = 'universal_id_orders';

/* ---- 状态 ---- */
let products = [];
let orders = [];
let editingId = null;
let uploadedImage = null;
let selectedColor = '#FFF3D6';
let orderFilter = 'all';

/* ---- DOM ---- */
const productTbody = document.getElementById('product-tbody');
const orderList = document.getElementById('order-list');
const statsGrid = document.getElementById('stats-grid');
const lowStockList = document.getElementById('low-stock-list');
const recentOrdersList = document.getElementById('recent-orders-list');
const navOrderBadge = document.getElementById('nav-order-badge');
const productModal = document.getElementById('product-modal');
const orderModal = document.getElementById('order-modal');
const toast = document.getElementById('m-toast');

/* ---- 数据加载 ---- */
function loadData() {
  const sp = localStorage.getItem(STORAGE_KEY);
  products = sp ? JSON.parse(sp) : [];
  const so = localStorage.getItem(ORDERS_KEY);
  orders = so ? JSON.parse(so) : [];
}

function saveProducts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

function saveOrders() {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

/* ========================================
   Tab 切换
   ======================================== */
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', function() {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    this.classList.add('active');
    const tab = this.dataset.tab;
    document.getElementById('tab-' + tab).classList.add('active');

    if (tab === 'dashboard') renderDashboard();
    if (tab === 'products') renderProductTable();
    if (tab === 'orders') renderOrders();
  });
});

/* ========================================
   仪表盘
   ======================================== */
function renderDashboard() {
  const totalProducts = products.length;
  const totalStock = products.reduce((s, p) => s + (p.stock || 0), 0);
  const stockValue = products.reduce((s, p) => s + (p.price * (p.stock || 0)), 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const totalRevenue = orders.filter(o => o.status === 'completed').reduce((s, o) => s + o.total, 0);

  statsGrid.innerHTML = `
    <div class="stat-card">
      <div class="stat-card-header">
        <div class="stat-icon purple">📦</div>
      </div>
      <div class="stat-label">商品总数</div>
      <div class="stat-value">${totalProducts}</div>
      <div class="stat-trend">总库存 ${totalStock} 件</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-header">
        <div class="stat-icon yellow">💰</div>
      </div>
      <div class="stat-label">库存价值</div>
      <div class="stat-value">$${stockValue.toFixed(0)}</div>
      <div class="stat-trend">库存总金额</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-header">
        <div class="stat-icon green">🛒</div>
      </div>
      <div class="stat-label">订单总数</div>
      <div class="stat-value">${orders.length}</div>
      <div class="stat-trend">${pendingOrders} 笔待处理</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-header">
        <div class="stat-icon red">📈</div>
      </div>
      <div class="stat-label">营业收入</div>
      <div class="stat-value">$${totalRevenue.toFixed(0)}</div>
      <div class="stat-trend">已完成订单收入</div>
    </div>
  `;

  /* 低库存列表 */
  const lowStock = products.filter(p => p.stock <= 10).sort((a, b) => a.stock - b.stock);
  if (lowStock.length === 0) {
    lowStockList.innerHTML = '<div class="empty"><div class="empty-text">库存充足</div></div>';
  } else {
    lowStockList.innerHTML = lowStock.map(p => `
      <div class="stock-item">
        <div class="stock-item-img" style="background:${p.bg || '#f0f0f3'}">
          ${p.image ? `<img src="${p.image}">` : miniBagHTML(p)}
        </div>
        <div class="stock-item-info">
          <div class="stock-item-name">${p.name}</div>
          <div class="stock-item-stock ${p.stock <= 0 ? 'warn' : ''}">
            ${p.stock <= 0 ? '已售罄' : `剩余 ${p.stock}`}
          </div>
        </div>
        <button class="stock-restock-btn" onclick="restockProduct(${p.id})">补货 +10</button>
      </div>
    `).join('');
  }

  /* 最近订单 */
  const recent = [...orders].reverse().slice(0, 5);
  if (recent.length === 0) {
    recentOrdersList.innerHTML = '<div class="empty"><div class="empty-text">暂无订单</div></div>';
  } else {
    recentOrdersList.innerHTML = recent.map(o => `
      <div class="order-item" onclick="openOrderModal('${o.id}')">
        <div>
          <div class="order-item-id">${o.id}</div>
          <div class="order-item-time">${formatDate(o.timestamp)}</div>
        </div>
        <span class="order-status ${o.status}">${STATUS_NAMES[o.status] || o.status}</span>
        <div class="order-item-total">$${o.total.toFixed(0)}</div>
      </div>
    `).join('');
  }

  /* 更新订单徽章 */
  updateOrderBadge();
}

/* ========================================
   商品管理表格
   ======================================== */
function renderProductTable() {
  if (products.length === 0) {
    productTbody.innerHTML = `
      <tr><td colspan="6">
        <div class="empty">
          <div class="empty-icon">📦</div>
          <div class="empty-text">暂无商品</div>
          <div class="empty-sub">点击"添加商品"创建第一个</div>
        </div>
      </td></tr>
    `;
    return;
  }

  productTbody.innerHTML = products.map(p => {
    const soldOut = p.stock <= 0;
    const lowStock = p.stock > 0 && p.stock <= 10;
    const statusClass = soldOut ? 'out-stock' : lowStock ? 'low-stock' : 'in-stock';
    const statusText = soldOut ? '已售罄' : lowStock ? '库存不足' : '有货';

    return `
      <tr>
        <td>
          <div class="cell-product">
            <div class="cell-product-img" style="background:${p.bg || '#f0f0f3'}">
              ${p.image ? `<img src="${p.image}">` : miniBagHTML(p)}
            </div>
            <div>
              <div class="cell-product-name">${p.name}</div>
              <div class="cell-product-brand">${p.brand || '—'}</div>
            </div>
          </div>
        </td>
        <td>${CATEGORY_NAMES[p.cat] || p.cat || '—'}</td>
        <td class="cell-price">$${p.price.toFixed(2)}</td>
        <td>
          <div class="stock-adjust">
            <button onclick="adjustStock(${p.id}, -1)">−</button>
            <span class="cell-stock ${soldOut ? 'out' : lowStock ? 'low' : ''}">${p.stock}</span>
            <button onclick="adjustStock(${p.id}, 1)">+</button>
          </div>
        </td>
        <td>
          <span class="status-badge ${statusClass}">
            <span class="status-dot"></span>
            ${statusText}
          </span>
        </td>
        <td>
          <div class="cell-actions">
            <button class="action-btn edit" onclick="editProductForm(${p.id})" title="编辑">
              <svg width="14" height="14" viewBox="0 0 14 14"><path d="M10 2l2 2-7 7H3V9l7-7z" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linejoin="round"/></svg>
            </button>
            <button class="action-btn delete" onclick="deleteProduct(${p.id})" title="删除">
              <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 4h8M5 4V2h4v2M4 4l1 8h4l1-8" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/* 快速调整库存 */
function adjustStock(id, delta) {
  const product = products.find(p => p.id === id);
  if (!product) return;
  product.stock = Math.max(0, product.stock + delta);
  saveProducts();
  renderProductTable();
  if (delta > 0) showToast(`${product.name} +1`);
}

/* 一键补货 */
function restockProduct(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;
  product.stock += 10;
  saveProducts();
  renderDashboard();
  showToast(`${product.name} 补货 +10`);
}

/* ========================================
   商品表单（添加/编辑）
   ======================================== */
function showProductForm() {
  editingId = null;
  uploadedImage = null;
  selectedColor = '#FFF3D6';
  document.getElementById('modal-title').textContent = '添加商品';
  document.getElementById('m-save-btn').textContent = '保存商品';
  document.getElementById('m-name').value = '';
  document.getElementById('m-brand').value = '';
  document.getElementById('m-price').value = '';
  document.getElementById('m-stock').value = '';
  document.getElementById('m-category').value = 'Chips';
  document.getElementById('m-img-preview').style.display = 'none';
  document.getElementById('m-img-placeholder').style.display = 'flex';
  document.querySelectorAll('.color-opt').forEach(opt => {
    opt.classList.toggle('selected', opt.dataset.color === selectedColor);
  });
  productModal.classList.add('active');
}

function editProductForm(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;
  editingId = id;
  uploadedImage = product.image || null;
  selectedColor = product.bg || '#FFF3D6';
  document.getElementById('modal-title').textContent = '编辑商品';
  document.getElementById('m-save-btn').textContent = '更新商品';
  document.getElementById('m-name').value = product.name || '';
  document.getElementById('m-brand').value = product.brand || '';
  document.getElementById('m-price').value = product.price || '';
  document.getElementById('m-stock').value = product.stock !== undefined ? product.stock : '';
  document.getElementById('m-category').value = product.cat || 'Chips';

  if (product.image) {
    const preview = document.getElementById('m-img-preview');
    preview.src = product.image;
    preview.style.display = 'block';
    document.getElementById('m-img-placeholder').style.display = 'none';
  } else {
    document.getElementById('m-img-preview').style.display = 'none';
    document.getElementById('m-img-placeholder').style.display = 'flex';
  }

  document.querySelectorAll('.color-opt').forEach(opt => {
    opt.classList.toggle('selected', opt.dataset.color === selectedColor);
  });

  productModal.classList.add('active');
}

function closeProductForm() {
  productModal.classList.remove('active');
}

/* 图片上传 */
document.getElementById('m-image').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    showToast('图片过大（最大 2MB）');
    return;
  }
  const reader = new FileReader();
  reader.onload = function(event) {
    uploadedImage = event.target.result;
    const preview = document.getElementById('m-img-preview');
    preview.src = uploadedImage;
    preview.style.display = 'block';
    document.getElementById('m-img-placeholder').style.display = 'none';
  };
  reader.readAsDataURL(file);
});

/* 颜色选择 */
document.getElementById('m-color-picker').addEventListener('click', function(e) {
  const opt = e.target.closest('.color-opt');
  if (!opt) return;
  document.querySelectorAll('.color-opt').forEach(o => o.classList.remove('selected'));
  opt.classList.add('selected');
  selectedColor = opt.dataset.color;
});

/* 保存商品 */
function saveProductForm() {
  const name = document.getElementById('m-name').value.trim();
  const brand = document.getElementById('m-brand').value.trim();
  const price = parseFloat(document.getElementById('m-price').value);
  const stock = parseInt(document.getElementById('m-stock').value) || 0;
  const category = document.getElementById('m-category').value;

  if (!name) { showToast('请输入商品名称'); return; }
  if (isNaN(price) || price < 0) { showToast('请输入有效价格'); return; }

  if (editingId !== null) {
    const product = products.find(p => p.id === editingId);
    if (product) {
      Object.assign(product, {
        name, brand, price, stock, cat: category, bg: selectedColor,
        image: uploadedImage !== null ? uploadedImage : product.image,
      });
      if (!uploadedImage && !product.bagBg) {
        product.bagBg = generateBagColor(category);
        product.bagText = (brand || name).toUpperCase().substring(0, 10);
        product.bagSub = category;
      }
      showToast('商品已更新');
    }
  } else {
    const newProduct = {
      id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
      name, brand, price, stock, cat: category, bg: selectedColor,
      image: uploadedImage,
      bagBg: uploadedImage ? null : generateBagColor(category),
      bagText: uploadedImage ? null : (brand || name).toUpperCase().substring(0, 10),
      bagSub: uploadedImage ? null : category,
    };
    products.push(newProduct);
    showToast('商品已添加');
  }

  saveProducts();
  renderProductTable();
  closeProductForm();
}

/* 删除商品 */
function deleteProduct(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;
  if (!confirm(`确认删除"${product.name}"？`)) return;
  products = products.filter(p => p.id !== id);
  saveProducts();
  renderProductTable();
  showToast('商品已删除');
}

/* ========================================
   订单管理
   ======================================== */
function renderOrders() {
  updateOrderBadge();
  const filtered = orderFilter === 'all'
    ? orders
    : orders.filter(o => o.status === orderFilter);

  if (filtered.length === 0) {
    const filterText = orderFilter === 'all' ? '' : STATUS_NAMES[orderFilter] || orderFilter;
    orderList.innerHTML = `
      <div class="empty">
        <div class="empty-icon">🛒</div>
        <div class="empty-text">暂无${filterText}订单</div>
        <div class="empty-sub">客户端的订单会自动同步到这里</div>
      </div>
    `;
    return;
  }

  orderList.innerHTML = [...filtered].reverse().map(o => `
    <div class="order-card" onclick="openOrderModal('${o.id}')">
      <div class="order-card-top">
        <div>
          <div class="order-card-id">${o.id}</div>
          <div class="order-card-time">${formatDate(o.timestamp)}</div>
        </div>
        <span class="order-status ${o.status}">${STATUS_NAMES[o.status] || o.status}</span>
      </div>
      <div class="order-card-items">
        ${o.items.map(i => `
          <div class="order-card-item">
            ${i.name}
            <span class="order-card-item-qty">x${i.qty}</span>
          </div>
        `).join('')}
      </div>
      <div class="order-card-bottom">
        <div class="order-card-total">$${o.total.toFixed(2)}</div>
        <div class="order-card-actions">
          ${o.status === 'pending' ? `
            <button class="btn-primary" onclick="event.stopPropagation(); updateOrderStatus('${o.id}', 'completed')">完成</button>
            <button class="btn-secondary" onclick="event.stopPropagation(); updateOrderStatus('${o.id}', 'cancelled')">取消</button>
          ` : ''}
        </div>
      </div>
    </div>
  `).join('');
}

/* 订单筛选 */
document.querySelectorAll('.filter-tab').forEach(tab => {
  tab.addEventListener('click', function() {
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    this.classList.add('active');
    orderFilter = this.dataset.filter;
    renderOrders();
  });
});

/* 打开订单详情 */
function openOrderModal(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;

  document.getElementById('order-modal-body').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <div>
        <div style="font-size:15px;font-weight:700">${order.id}</div>
        <div style="font-size:12px;color:#999">${formatDate(order.timestamp)}</div>
      </div>
      <span class="order-status ${order.status}">${STATUS_NAMES[order.status] || order.status}</span>
    </div>
    ${order.items.map(i => `
      <div class="order-detail-row">
        <div>
          <div class="order-detail-name">${i.name}</div>
          <div class="order-detail-qty">${i.brand || ''} · 数量 ${i.qty}</div>
        </div>
        <div class="order-detail-price">$${(i.price * i.qty).toFixed(2)}</div>
      </div>
    `).join('')}
    <div class="order-detail-summary">
      <div class="order-detail-total-row">
        <span class="order-detail-total-label">合计</span>
        <span class="order-detail-total-value">$${order.total.toFixed(2)}</span>
      </div>
    </div>
  `;

  const footer = document.getElementById('order-modal-footer');
  if (order.status === 'pending') {
    footer.innerHTML = `
      <button class="btn-secondary" onclick="updateOrderStatus('${order.id}', 'cancelled')">取消订单</button>
      <button class="btn-primary" onclick="updateOrderStatus('${order.id}', 'completed')">标记完成</button>
    `;
  } else {
    footer.innerHTML = `
      <button class="btn-secondary" onclick="closeOrderModal()">关闭</button>
      ${order.status !== 'pending' ? `<button class="btn-primary" onclick="updateOrderStatus('${order.id}', 'pending')">重新打开</button>` : ''}
    `;
  }

  orderModal.classList.add('active');
}

function closeOrderModal() {
  orderModal.classList.remove('active');
}

/* 更新订单状态 */
function updateOrderStatus(orderId, status) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  order.status = status;
  saveOrders();
  renderOrders();
  closeOrderModal();
  showToast(`订单已${STATUS_NAMES[status] || status}`);
}

/* 更新订单徽章 */
function updateOrderBadge() {
  const pending = orders.filter(o => o.status === 'pending').length;
  if (pending > 0) {
    navOrderBadge.textContent = pending;
    navOrderBadge.style.display = 'flex';
  } else {
    navOrderBadge.style.display = 'none';
  }
}

/* ========================================
   辅助函数
   ======================================== */
function miniBagHTML(product) {
  return `<div class="bag" style="background:${product.bagBg || '#666'}">
    <span>${(product.bagText || product.brand || '').substring(0, 6)}</span>
  </div>`;
}

function generateBagColor(category) {
  const colors = {
    'Chips': '#E8650C', 'Choco': '#5B3A1A', 'Drinks': '#1A5B9E',
    'Cookies': '#C01A1A', 'Nuts': '#1A8A4E',
  };
  return colors[category] || '#666';
}

function formatDate(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
  return d.toLocaleDateString('zh-CN') + ' ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

let toastTimer = null;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
}

/* 关闭弹窗：点击遮罩 */
productModal.addEventListener('click', function(e) {
  if (e.target === this) closeProductForm();
});
orderModal.addEventListener('click', function(e) {
  if (e.target === this) closeOrderModal();
});

/* ========================================
   初始化
   ======================================== */
loadData();
renderDashboard();

/* 每5秒刷新数据（模拟实时同步） */
setInterval(() => {
  loadData();
  const activeTab = document.querySelector('.nav-item.active').dataset.tab;
  if (activeTab === 'dashboard') renderDashboard();
  if (activeTab === 'products') renderProductTable();
  if (activeTab === 'orders') renderOrders();
}, 5000);
