/**
 * Service Calculator Modal — Quick pricing calculator for each service
 * Opens in popup modal when clicking service cards
 * Uses updated 2026 pricing from P object
 */

const ServiceCalcModal = {
  // Service configurations with pricing options
  configs: {
    kitch: {
      name: 'Kitchen Cabinet Painting',
      icon: '🍳',
      options: [
        { id: 'doorFull', label: 'Full Package (2 sides + box + prep)', price: 155, unit: '/door', qty: 1 },
        { id: 'door2side', label: '2-Side Spray', price: 125, unit: '/door', qty: 1 },
        { id: 'door1side', label: '1-Side Spray', price: 95, unit: '/door', qty: 1 },
        { id: 'doorRoller', label: 'Roller Finish (budget)', price: 45, unit: '/door', qty: 1 },
      ],
      addons: [
        { id: 'drawerSmall', label: 'Drawer Front (small)', price: 65, unit: '/ea' },
        { id: 'drawerLarge', label: 'Drawer Front (large)', price: 75, unit: '/ea' },
        { id: 'endPanel', label: 'End Panel', price: 125, unit: '/ea' },
        { id: 'island', label: 'Island', price: 460, unit: '/each' },
      ],
    },
    furnp: {
      name: 'Furniture Painting',
      icon: '🎨',
      options: [
        { id: 'chair', label: 'Dining Chair', price: 95, unit: '/piece', qty: 1 },
        { id: 'nightstand', label: 'Nightstand / Side Table', price: 145, unit: '/piece', qty: 1 },
        { id: 'dresser', label: 'Dresser / Large Cabinet', price: 450, unit: '/piece', qty: 1 },
        { id: 'diningTable', label: 'Dining Table', price: 395, unit: '/piece', qty: 1 },
      ],
    },
    paint: {
      name: 'Interior Painting',
      icon: '🎨',
      options: [
        { id: 'wall1coat', label: 'Walls — 1 coat (same color)', price: 3.00, unit: '/sq ft', qty: 0 },
        { id: 'wall2coat', label: 'Walls — 2 coats (color change)', price: 4.00, unit: '/sq ft', qty: 0 },
        { id: 'ceilSmooth', label: 'Ceiling — smooth', price: 4.00, unit: '/sq ft', qty: 0 },
        { id: 'ceilText', label: 'Ceiling — textured', price: 4.50, unit: '/sq ft', qty: 0 },
      ],
    },
    floor: {
      name: 'Flooring',
      icon: '🏠',
      options: [
        { id: 'lvp', label: 'LVP / Luxury Vinyl', price: 3.75, unit: '/sq ft', qty: 0 },
        { id: 'laminate', label: 'Laminate Click-Lock', price: 3.50, unit: '/sq ft', qty: 0 },
        { id: 'demo', label: 'Demo Old Floor', price: 2.25, unit: '/sq ft', qty: 0 },
      ],
    },
  },

  init() {
    this.createModal();
    this.attachListeners();
  },

  createModal() {
    const html = `
      <div id="svcCalcModal" style="
        display:none;position:fixed;top:0;left:0;width:100%;height:100%;
        background:rgba(0,0,0,0.6);z-index:9999;align-items:center;justify-content:center;
      ">
        <div style="
          background:#fff;border-radius:16px;padding:32px;max-width:500px;
          width:90%;max-height:85vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3);
        ">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
            <h2 id="svcCalcTitle" style="margin:0;font-size:24px;font-weight:700;color:#1a1410;"></h2>
            <button id="svcCalcClose" style="
              background:none;border:none;font-size:24px;cursor:pointer;color:#999;
            ">&times;</button>
          </div>

          <div id="svcCalcOptions" style="margin-bottom:24px;"></div>

          <div style="
            padding:20px;background:#f5f0e8;border-radius:12px;text-align:center;
            border:1px solid #e8e0d0;
          ">
            <div style="font-size:13px;color:#666;margin-bottom:8px;">ESTIMATED COST</div>
            <div id="svcCalcTotal" style="
              font-size:36px;font-weight:700;color:#b8860b;font-family:var(--fs,'Playfair Display');
            ">$0</div>
            <div style="font-size:12px;color:#999;margin-top:6px;">Materials & taxes not included</div>
          </div>

          <button id="svcCalcWa" style="
            width:100%;margin-top:20px;padding:12px;background:#25d366;color:#fff;
            border:none;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer;
          ">Send via WhatsApp</button>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  attachListeners() {
    const modal = document.getElementById('svcCalcModal');
    const closeBtn = document.getElementById('svcCalcClose');
    const waBtn = document.getElementById('svcCalcWa');

    closeBtn.addEventListener('click', () => this.close());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.close();
    });

    // Service card click handlers (skip image clicks for lightbox)
    document.querySelectorAll('[data-svc-calc]').forEach(card => {
      card.addEventListener('click', (e) => {
        // Skip if clicking on image (let lightbox handle it)
        if (e.target.closest('.sph')) return;
        e.preventDefault();
        const svc = card.getAttribute('data-svc-calc');
        this.open(svc);
      });
    });

    waBtn.addEventListener('click', () => this.sendWhatsApp());
  },

  open(svc) {
    const config = this.configs[svc];
    if (!config) return;

    const modal = document.getElementById('svcCalcModal');
    const title = document.getElementById('svcCalcTitle');
    const optionsDiv = document.getElementById('svcCalcOptions');

    title.textContent = `${config.icon} ${config.name}`;

    optionsDiv.innerHTML = config.options
      .map((opt, i) => `
        <div style="margin-bottom:16px;">
          <label style="
            display:flex;align-items:center;gap:12px;cursor:pointer;
            padding:12px;background:#f9f6f1;border-radius:8px;
          ">
            <input type="number" class="svc-calc-qty" data-opt="${i}" value="${opt.qty || 0}"
              style="width:60px;padding:8px;border:1px solid #d0c5b9;border-radius:4px;font-size:14px;"
              min="0" />
            <span style="flex:1;font-size:14px;font-weight:500;color:#333;">${opt.label}</span>
            <span style="font-weight:600;color:#b8860b;white-space:nowrap;">$${opt.price.toFixed(2)}${opt.unit}</span>
          </label>
        </div>
      `)
      .join('');

    // Attach qty change listeners
    optionsDiv.querySelectorAll('.svc-calc-qty').forEach(input => {
      input.addEventListener('input', () => this.updateTotal(svc));
    });

    this.currentSvc = svc;
    this.updateTotal(svc);
    modal.style.display = 'flex';
  },

  close() {
    document.getElementById('svcCalcModal').style.display = 'none';
  },

  updateTotal(svc) {
    const config = this.configs[svc];
    const optionsDiv = document.getElementById('svcCalcOptions');
    let total = 0;

    optionsDiv.querySelectorAll('.svc-calc-qty').forEach((input, i) => {
      const qty = Math.max(0, parseInt(input.value) || 0);
      const opt = config.options[i];
      total += qty * opt.price;
    });

    document.getElementById('svcCalcTotal').textContent = `$${Math.round(total).toLocaleString()}`;
  },

  sendWhatsApp() {
    const svc = this.currentSvc;
    const config = this.configs[svc];
    const optionsDiv = document.getElementById('svcCalcOptions');
    const total = document.getElementById('svcCalcTotal').textContent;

    let desc = `${config.icon} ${config.name}\n`;
    optionsDiv.querySelectorAll('.svc-calc-qty').forEach((input, i) => {
      const qty = Math.max(0, parseInt(input.value) || 0);
      if (qty > 0) {
        const opt = config.options[i];
        desc += `• ${qty} × ${opt.label} = $${(qty * opt.price).toLocaleString()}\n`;
      }
    });
    desc += `\nTotal: ${total}`;

    const waUrl = `https://wa.me/12133611700?text=${encodeURIComponent(desc)}`;
    window.open(waUrl, '_blank');
  },
};

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ServiceCalcModal.init());
} else {
  ServiceCalcModal.init();
}
