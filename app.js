/* =========================================================
   Boutique — E-Commerce App
   Fetches products from products.json (simulates a JSON database)
   ========================================================= */

let allProducts = [];
let cartCount = 0;
let selectedCategory = '';

// ── DOM refs ──────────────────────────────────────────────
const productGrid   = document.getElementById('productGrid');
const categoryBar   = document.getElementById('categoryBar');
const emptyState    = document.getElementById('emptyState');
const cartCountEl   = document.getElementById('cartCount');
const hamburgerBtn  = document.getElementById('hamburgerBtn');
const mobileMenu    = document.getElementById('mobileMenu');
const modalOverlay  = document.getElementById('modalOverlay');
const modalBody     = document.getElementById('modalBody');
const modalClose    = document.getElementById('modalClose');
const clearFiltersBtn = document.getElementById('clearFiltersBtn');

// ── Hamburger menu ────────────────────────────────────────
hamburgerBtn.addEventListener('click', toggleMenu);
hamburgerBtn.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMenu(); }
});

function toggleMenu() {
  const isOpen = !mobileMenu.hidden;
  mobileMenu.hidden = isOpen;
  hamburgerBtn.setAttribute('aria-expanded', String(!isOpen));
  hamburgerBtn.querySelector('.icon-menu').hidden = !isOpen;
  hamburgerBtn.querySelector('.icon-close').hidden = isOpen;
}

// Close menu when a mobile nav link is clicked
mobileMenu.querySelectorAll('.mobile-nav-link').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.hidden = true;
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    hamburgerBtn.querySelector('.icon-menu').hidden = false;
    hamburgerBtn.querySelector('.icon-close').hidden = true;
  });
  link.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      link.click();
    }
  });
});

// ── Cart ──────────────────────────────────────────────────
function addToCart() {
  cartCount++;
  cartCountEl.textContent = cartCount;
  cartCountEl.setAttribute('aria-label', `${cartCount} items in cart`);
  cartCountEl.hidden = false;
}

// ── Fetch products from JSON file ─────────────────────────
async function fetchProducts() {
  const res = await fetch('products.json');
  if (!res.ok) throw new Error('Failed to load products');
  return res.json();
}

// ── Render category buttons ───────────────────────────────
function renderCategories(products) {
  const categories = [...new Set(products.map(p => p.category))].sort();

  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'cat-btn';
    btn.dataset.category = cat;
    btn.textContent = cat;
    btn.setAttribute('role', 'button');
    btn.setAttribute('tabindex', '0');
    btn.addEventListener('click', () => selectCategory(cat));
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectCategory(cat); }
    });
    categoryBar.appendChild(btn);
  });

  // Wire up "All Products" button
  const allBtn = categoryBar.querySelector('[data-category=""]');
  allBtn.addEventListener('click', () => selectCategory(''));
  allBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectCategory(''); }
  });
}

function selectCategory(cat) {
  selectedCategory = cat;
  categoryBar.querySelectorAll('.cat-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.category === cat);
  });
  renderProducts();
}

// ── Render product grid ───────────────────────────────────
function renderProducts() {
  const filtered = selectedCategory
    ? allProducts.filter(p => p.category === selectedCategory)
    : allProducts;

  productGrid.innerHTML = '';

  if (filtered.length === 0) {
    productGrid.hidden = true;
    emptyState.hidden = false;
    return;
  }

  productGrid.hidden = false;
  emptyState.hidden = true;

  filtered.forEach(product => {
    const card = createProductCard(product);
    productGrid.appendChild(card);
  });
}

function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card';
  card.setAttribute('data-testid', `card-product-${product.id}`);

  card.innerHTML = `
    <div
      class="card-img-wrap"
      role="button"
      tabindex="0"
      aria-label="View details for ${escHtml(product.name)}"
    >
      <!-- imageSmall used here for fast loading (performance optimization) -->
      <img
        src="${escHtml(product.imageSmall)}"
        alt="${escHtml(product.name)}"
        loading="lazy"
        width="400"
        height="400"
      />
      <div class="card-badge">
        <span role="img" aria-label="${escHtml(product.emojiLabel)}">${product.emoji}</span>
        ${escHtml(product.category)}
      </div>
    </div>
    <div class="card-body">
      <div class="card-top">
        <h3 class="card-name">${escHtml(product.name)}</h3>
        <span class="card-price">$${product.price.toFixed(2)}</span>
      </div>
      <div class="card-rating">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
          aria-hidden="true">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
        <span class="card-rating-num">${product.rating.toFixed(1)}</span>
        <span class="card-rating-count">(${product.reviewCount.toLocaleString()} reviews)</span>
      </div>
      <button
        class="btn-add-cart"
        role="button"
        tabindex="0"
        aria-label="Add ${escHtml(product.name)} to cart"
        data-testid="button-add-cart-${product.id}"
      >
        Add to Cart
      </button>
    </div>
  `;

  // Open modal
  const imgWrap = card.querySelector('.card-img-wrap');
  const nameEl  = card.querySelector('.card-name');
  const openModal = () => showModal(product);
  imgWrap.addEventListener('click', openModal);
  nameEl.addEventListener('click', openModal);
  imgWrap.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(); }
  });

  // Add to cart
  const cartBtn = card.querySelector('.btn-add-cart');
  cartBtn.addEventListener('click', (e) => { e.stopPropagation(); addToCart(); });
  cartBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); addToCart(); }
  });

  return card;
}

// ── Product detail modal ──────────────────────────────────
function showModal(product) {
  modalBody.innerHTML = `
    <div class="modal-img-wrap" style="position:relative;">
      <img
        src="${escHtml(product.imageLarge)}"
        alt="${escHtml(product.name)}"
        width="600"
        height="600"
      />
      <div class="modal-img-badge">
        <span role="img" aria-label="${escHtml(product.emojiLabel)}">${product.emoji}</span>
        ${escHtml(product.category)}
      </div>
    </div>
    <div class="modal-info">
      <h2 class="modal-title">${escHtml(product.name)}</h2>
      <div class="modal-rating">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
          aria-hidden="true">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
        <strong>${product.rating.toFixed(1)}</strong>
        <span style="color:var(--text-muted)">(${product.reviewCount.toLocaleString()} reviews)</span>
      </div>
      <p class="modal-desc">${escHtml(product.description)}</p>
      <div class="modal-footer">
        <span class="modal-price">$${product.price.toFixed(2)}</span>
        <button
          class="btn-modal-cart"
          role="button"
          tabindex="0"
          aria-label="Add ${escHtml(product.name)} to cart"
          data-testid="button-modal-add-cart"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round" aria-hidden="true">
            <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
          </svg>
          Add to Cart
        </button>
      </div>
    </div>
  `;

  const modalCartBtn = modalBody.querySelector('.btn-modal-cart');
  modalCartBtn.addEventListener('click', () => { addToCart(); closeModal(); });
  modalCartBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); addToCart(); closeModal(); }
  });

  modalOverlay.hidden = false;
  document.body.style.overflow = 'hidden';
  modalClose.focus();
}

function closeModal() {
  modalOverlay.hidden = true;
  document.body.style.overflow = '';
}

modalClose.addEventListener('click', closeModal);
modalClose.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); closeModal(); }
});
modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

// ── Clear filters ─────────────────────────────────────────
clearFiltersBtn.addEventListener('click', () => selectCategory(''));
clearFiltersBtn.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectCategory(''); }
});

// ── Utility ───────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Boot ──────────────────────────────────────────────────
(async () => {
  try {
    allProducts = await fetchProducts();
    renderCategories(allProducts);
    renderProducts();
  } catch (err) {
    productGrid.innerHTML = `<p style="color:var(--primary);grid-column:1/-1;text-align:center;padding:2rem;">
      Could not load products. Make sure products.json is in the same folder as index.html.
    </p>`;
    console.error(err);
  }
})();
