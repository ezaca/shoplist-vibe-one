/**
 * Dicionário de mapeamento de palavras-chave de produtos em português para emojis.
 */
const PORTUGUESE_PRODUCT_EMOJIS = [
  { keywords: ['outro', 'outra'], emoji: '🛒' },
  { keywords: ['maca', 'macas'], emoji: '🍎' },
  { keywords: ['banana', 'bananas'], emoji: '🍌' },
  { keywords: ['laranja', 'laranjas'], emoji: '🍊' },
  { keywords: ['limao', 'limoes'], emoji: '🍋' },
  { keywords: ['uva', 'uvas'], emoji: '🍇' },
  { keywords: ['morango', 'morangos'], emoji: '🍓' },
  { keywords: ['abacate', 'abacates'], emoji: '🥑' },
  { keywords: ['abacaxi', 'abacaxis'], emoji: '🍍' },
  { keywords: ['melancia', 'melancias'], emoji: '🍉' },
  { keywords: ['pera', 'peras'], emoji: '🍐' },
  { keywords: ['tomate', 'tomates'], emoji: '🍅' },
  { keywords: ['cenoura', 'cenouras'], emoji: '🥕' },
  { keywords: ['batata', 'batatas'], emoji: '🥔' },
  { keywords: ['cebola', 'cebolas'], emoji: '🧅' },
  { keywords: ['alho', 'alhos'], emoji: '🧄' },
  { keywords: ['alface', 'salada', 'couve', 'espinafre', 'rucula'], emoji: '🥬' },
  { keywords: ['milho'], emoji: '🌽' },
  { keywords: ['pao', 'paes', 'torrada', 'bisnaguinha'], emoji: '🍞' },
  { keywords: ['queijo', 'queijos', 'mussarela', 'prato', 'parmesao', 'requeijao'], emoji: '🧀' },
  { keywords: ['leite condensado'], emoji: '🛒' },
  { keywords: ['leite', 'iogurte'], emoji: '🥛' },
  { keywords: ['ovo', 'ovos'], emoji: '🥚' },
  { keywords: ['manteiga', 'margarina'], emoji: '🧈' },
  { keywords: ['arroz'], emoji: '🌾' },
  { keywords: ['feijao', 'feijoes', 'grao'], emoji: '🫘' },
  { keywords: ['macarrao', 'massa', 'espaguete', 'lasanha'], emoji: '🍝' },
  { keywords: ['carne', 'bife', 'picanha', 'alcatra', 'moida'], emoji: '🥩' },
  { keywords: ['frango', 'coxa', 'sobrecoxa', 'peito'], emoji: '🍗' },
  { keywords: ['peixe', 'salmao', 'tilapia', 'sardinha', 'atum'], emoji: '🐟' },
  { keywords: ['camarao'], emoji: '🦐' },
  { keywords: ['cafe'], emoji: '☕' },
  { keywords: ['cha'], emoji: '🫖' },
  { keywords: ['acucar'], emoji: '🍬' },
  { keywords: ['sal'], emoji: '🧂' },
  { keywords: ['oleo', 'azeite'], emoji: '🫒' },
  { keywords: ['agua', 'agua 500ml'], emoji: '💧' },
  { keywords: ['agua 5l', 'agua 20l'], emoji: '🌊' },
  { keywords: ['suco', 'nectar'], emoji: '🧃' },
  { keywords: ['refrigerante', 'coca', 'guarana', 'pepsi', 'soda', 'suco gaseificado'], emoji: '🥤' },
  { keywords: ['cerveja', 'chope'], emoji: '🍺' },
  { keywords: ['vinho', 'espumante'], emoji: '🍷' },
  { keywords: ['chocolate', 'chocolates', 'bombom'], emoji: '🍫' },
  { keywords: ['biscoito', 'bolacha', 'wafer'], emoji: '🍪' },
  { keywords: ['bolo', 'torta'], emoji: '🍰' },
  { keywords: ['pizza'], emoji: '🍕' },
  { keywords: ['hamburguer'], emoji: '🍔' },
  { keywords: ['sabao', 'detergente', 'amaciante'], emoji: '🧼' },
  { keywords: ['desinfetante', 'limpeza', 'shampoo', 'condicionador'], emoji: '🧴' },
  { keywords: ['papel', 'papel higienico', 'papel toalha', 'guardanapo'], emoji: '🧻' },
  { keywords: ['pasta de dente', 'escova', 'creme dental'], emoji: '🪥' },
  { keywords: ['racao', 'racao de gato', 'gato'], emoji: '🐈' },
  { keywords: ['racao', 'racao de cachorro', "racao dog", 'cachorro', 'dog'], emoji: '🐶' },
  { keywords: ['areia'], emoji: '🏜️' },
];

/**
 * Retorna o emoji correspondente ao nome do produto em português.
 * @param {string} productName
 * @returns {string} Emoji
 */
function detectEmojiForProduct(productName) {
  if (!productName || !productName.trim()) return '🛒';
  const norm = productName.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const entry of PORTUGUESE_PRODUCT_EMOJIS) {
    if (entry.keywords.some(kw => norm.includes(kw))) {
      return entry.emoji;
    }
  }
  return '🛒';
}

/**
 * Monitors online and offline network status and triggers Service Worker update checks when reconnecting.
 */
class NetworkMonitor {
  /**
   * @param {ServiceWorkerManager} swManager
   */
  constructor(swManager) {
    this.swManager = swManager;
    this.badgeElement = document.getElementById('network-status');
    this.init();
  }

  /**
   * Registers network connectivity event listeners.
   */
  init() {
    window.addEventListener('online', () => this.updateStatus(true));
    window.addEventListener('offline', () => this.updateStatus(false));
    this.updateStatus(navigator.onLine);
  }

  /**
   * Updates UI badge and requests SW update check when returning online.
   * @param {boolean} isOnline
   */
  updateStatus(isOnline) {
    if (!this.badgeElement) return;

    if (isOnline) {
      this.badgeElement.className = 'status-badge online';
      this.badgeElement.innerHTML = '<span class="status-dot"></span> Online';
      if (this.swManager) {
        this.swManager.checkForUpdates();
      }
    } else {
      this.badgeElement.className = 'status-badge offline';
      this.badgeElement.innerHTML = '<span class="status-dot"></span> Offline';
    }
  }
}

/**
 * Manages Service Worker lifecycle, registration, and update prompt flow.
 */
class ServiceWorkerManager {
  constructor() {
    this.registration = null;
    this.updateBanner = document.getElementById('update-banner');
    this.updateBtn = document.getElementById('btn-update');
    this.init();
  }

  /**
   * Registers the Service Worker and sets up lifecycle event listeners.
   */
  async init() {
    if (!('serviceWorker' in navigator)) return;

    try {
      this.registration = await navigator.serviceWorker.register('./sw.js');

      this.registration.addEventListener('updatefound', () => {
        const installingWorker = this.registration.installing;
        if (!installingWorker) return;

        installingWorker.addEventListener('statechange', () => {
          if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
            this.showUpdateBanner(installingWorker);
          }
        });
      });

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  /**
   * Triggers explicit registration update check when online.
   */
  async checkForUpdates() {
    if (this.registration) {
      try {
        await this.registration.update();
      } catch (error) {
        console.warn('Unable to check for SW update:', error);
      }
    }
  }

  /**
   * Displays the update banner and configures update action handler.
   * @param {ServiceWorker} worker
   */
  showUpdateBanner(worker) {
    if (!this.updateBanner || !this.updateBtn) return;

    this.updateBanner.classList.remove('hidden');
    this.updateBtn.onclick = () => {
      worker.postMessage({ type: 'SKIP_WAITING' });
    };
  }
}

/**
 * Manages persistence and CRUD operations for Shop Lists in localStorage.
 */
class ShopListStore {
  constructor() {
    this.STORAGE_KEY = 'shop_vibes_lists';
  }

  /**
   * Helper to get local date as YYYY-MM-DD string without UTC shift.
   * @param {Date} [date=new Date()]
   * @returns {string}
   */
  getLocalDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Retrieves all shop lists from localStorage.
   * @returns {Array<{id: string, name: string, date: string, createdAt: string, items: Array}>}
   */
  getAll() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading shop lists from localStorage:', error);
      return [];
    }
  }

  /**
   * Saves shop lists array to localStorage.
   * @param {Array} lists
   */
  saveAll(lists) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(lists));
    } catch (error) {
      console.error('Error saving shop lists to localStorage:', error);
    }
  }

  /**
   * Adds a new shop list with a grocery store name and custom date.
   * @param {string} storeName
   * @param {string} customDate - YYYY-MM-DD date string
   * @returns {Object} The created shop list object
   */
  addList(storeName, customDate) {
    const lists = this.getAll();
    const newList = {
      id: Date.now().toString(),
      name: storeName.trim(),
      date: customDate || this.getLocalDateString(),
      createdAt: new Date().toISOString(),
      items: []
    };
    lists.push(newList);
    this.saveAll(lists);
    return newList;
  }

  /**
   * Updates an existing shop list name and date.
   * @param {string} id
   * @param {string} storeName
   * @param {string} customDate
   */
  updateList(id, storeName, customDate) {
    const lists = this.getAll();
    const listIndex = lists.findIndex(list => list.id === id);
    if (listIndex !== -1) {
      lists[listIndex].name = storeName.trim();
      lists[listIndex].date = customDate;
      this.saveAll(lists);
    }
  }

  /**
   * Removes a shop list by its unique ID.
   * @param {string} id
   */
  deleteList(id) {
    const lists = this.getAll().filter(list => list.id !== id);
    this.saveAll(lists);
  }

  /**
   * Retrieves a single shop list by its ID.
   * @param {string} id
   * @returns {Object|null}
   */
  getListById(id) {
    const lists = this.getAll();
    return lists.find(list => list.id === id) || null;
  }

  /**
   * Adds a new item to a specific shop list.
   * @param {string} listId
   * @param {Object} itemData
   * @returns {Object|null}
   */
  addItem(listId, itemData) {
    const lists = this.getAll();
    const listIndex = lists.findIndex(l => l.id === listId);
    if (listIndex !== -1) {
      if (!lists[listIndex].items) {
        lists[listIndex].items = [];
      }
      const newItem = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
        checked: itemData.checked || false,
        emoji: itemData.emoji || detectEmojiForProduct(itemData.name),
        name: (itemData.name || '').trim(),
        price: typeof itemData.price === 'number' ? itemData.price : (parseFloat(itemData.price) || 0),
        quantity: typeof itemData.quantity === 'number' ? itemData.quantity : (parseFloat(itemData.quantity) || 1)
      };
      lists[listIndex].items.push(newItem);
      this.saveAll(lists);
      return newItem;
    }
    return null;
  }

  /**
   * Updates properties of an item in a specific shop list.
   * @param {string} listId
   * @param {string} itemId
   * @param {Object} updatedFields
   */
  updateItem(listId, itemId, updatedFields) {
    const lists = this.getAll();
    const list = lists.find(l => l.id === listId);
    if (list && list.items) {
      const item = list.items.find(i => i.id === itemId);
      if (item) {
        Object.assign(item, updatedFields);
        this.saveAll(lists);
      }
    }
  }

  /**
   * Removes an item from a shop list by ID.
   * @param {string} listId
   * @param {string} itemId
   */
  deleteItem(listId, itemId) {
    const lists = this.getAll();
    const list = lists.find(l => l.id === listId);
    if (list && list.items) {
      list.items = list.items.filter(i => i.id !== itemId);
      this.saveAll(lists);
    }
  }

  /**
   * Reorders items within a shop list.
   * @param {string} listId
   * @param {number} fromIndex
   * @param {number} toIndex
   */
  reorderItems(listId, fromIndex, toIndex) {
    const lists = this.getAll();
    const list = lists.find(l => l.id === listId);
    if (list && list.items && fromIndex >= 0 && toIndex >= 0 && fromIndex < list.items.length && toIndex < list.items.length) {
      const [movedItem] = list.items.splice(fromIndex, 1);
      list.items.splice(toIndex, 0, movedItem);
      this.saveAll(lists);
    }
  }

  /**
   * Finds previous purchase price for a product across other shop lists.
   * @param {string} productName
   * @param {string} currentListId
   * @returns {{price: number}|null}
   */
  getPreviousItemPrice(productName, currentListId) {
    if (!productName || !productName.trim()) return null;
    const normalizedTarget = productName.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const lists = this.getAll();
    const otherLists = lists
      .filter(l => l.id !== currentListId && l.items && l.items.length > 0)
      .sort((a, b) => {
        const dateA = a.date || a.createdAt || '';
        const dateB = b.date || b.createdAt || '';
        return dateB.localeCompare(dateA);
      });

    for (const list of otherLists) {
      const match = list.items.find(item => {
        if (!item.name) return false;
        const norm = item.name.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return norm === normalizedTarget && item.price > 0;
      });
      if (match) {
        return {
          price: match.price
        };
      }
    }
    return null;
  }
}

/**
 * Controls application UI rendering, views, and user interactions.
 */
class ShopListApp {
  /**
   * @param {ShopListStore} store
   */
  constructor(store) {
    this.store = store;
    this.appContent = document.getElementById('app-content');
    this.modal = document.getElementById('modal-new-list');
    this.modalTitle = document.getElementById('modal-title');
    this.form = document.getElementById('form-new-list');
    this.inputStoreName = document.getElementById('input-store-name');
    this.inputListDate = document.getElementById('input-list-date');
    this.btnOpenModal = document.getElementById('btn-open-modal');
    this.btnCancelModal = document.getElementById('btn-cancel-modal');

    this.activeListId = null;
    this.editingListId = null;
    this.userEditedAddEmoji = false;

    this.init();
  }

  /**
   * Initializes event listeners and initial view rendering.
   */
  init() {
    this.setupEventListeners();
    this.renderMainList();
  }

  /**
   * Sets up event listeners for modal controls and form submissions.
   */
  setupEventListeners() {
    if (this.btnOpenModal) {
      this.btnOpenModal.addEventListener('click', () => this.openModal());
    }

    if (this.btnCancelModal) {
      this.btnCancelModal.addEventListener('click', () => this.closeModal());
    }

    if (this.modal) {
      this.modal.addEventListener('click', (event) => {
        if (event.target === this.modal) {
          this.closeModal();
        }
      });
    }

    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !this.modal.classList.contains('hidden')) {
        this.closeModal();
      }
    });

    if (this.form) {
      this.form.addEventListener('submit', (event) => {
        event.preventDefault();
        const name = this.inputStoreName.value;
        const date = this.inputListDate.value;

        if (name && name.trim()) {
          if (this.editingListId) {
            this.store.updateList(this.editingListId, name, date);
            const updatedId = this.editingListId;
            this.closeModal();

            if (this.activeListId === updatedId) {
              this.renderDetailView(updatedId);
            } else {
              this.renderMainList();
            }
          } else {
            this.store.addList(name, date);
            this.closeModal();
            this.renderMainList();
          }
        }
      });
    }
  }

  /**
   * Opens the list modal popup pre-filled for editing or empty for creation.
   * @param {Object|null} listToEdit
   */
  openModal(listToEdit = null) {
    if (!this.modal) return;

    if (listToEdit) {
      this.editingListId = listToEdit.id;
      this.modalTitle.textContent = 'Editar Lista de Compras';
      this.inputStoreName.value = listToEdit.name;

      if (listToEdit.date) {
        if (listToEdit.date.includes('T')) {
          this.inputListDate.value = this.store.getLocalDateString(new Date(listToEdit.date));
        } else {
          this.inputListDate.value = listToEdit.date;
        }
      } else if (listToEdit.createdAt) {
        this.inputListDate.value = this.store.getLocalDateString(new Date(listToEdit.createdAt));
      } else {
        this.inputListDate.value = this.store.getLocalDateString();
      }
    } else {
      this.editingListId = null;
      this.modalTitle.textContent = 'Nova Lista de Compras';
      this.inputStoreName.value = '';
      this.inputListDate.value = this.store.getLocalDateString();
    }

    this.modal.classList.remove('hidden');
    this.inputStoreName.focus();
  }

  /**
   * Closes the list modal popup and resets editing state.
   */
  closeModal() {
    if (!this.modal) return;
    this.modal.classList.add('hidden');
    this.editingListId = null;
  }

  /**
   * Formats date string to DD/MM/YYYY using local time.
   * @param {string} dateString
   * @returns {string}
   */
  formatDateOnly(dateString) {
    if (!dateString) return '';
    if (dateString.includes('T')) {
      const d = new Date(dateString);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
    const [year, month, day] = dateString.split('-');
    if (year && month && day) {
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }
    return dateString;
  }

  /**
   * Formats numbers into BRL currency format (e.g., 12.50 -> "12,50").
   * @param {number} value
   * @returns {string}
   */
  formatCurrency(value) {
    const num = parseFloat(value) || 0;
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /**
   * Renders the main view containing the array of shop list cards.
   */
  renderMainList() {
    this.activeListId = null;
    if (this.btnOpenModal) {
      this.btnOpenModal.classList.remove('hidden');
    }

    const lists = this.store.getAll();

    if (lists.length === 0) {
      this.appContent.innerHTML = `
        <div class="empty-state">
          <h3>Nenhuma lista de compras</h3>
          <p>Clique no botão <strong>+</strong> para adicionar sua primeira lista.</p>
        </div>
      `;
      return;
    }

    const container = document.createElement('div');
    container.className = 'shop-lists-container';

    lists.forEach(list => {
      const card = document.createElement('div');
      card.className = 'shop-list-card';

      const formattedDate = this.formatDateOnly(list.date || list.createdAt);
      const itemCount = (list.items || []).length;
      const totalCost = (list.items || []).reduce((acc, item) => acc + ((item.price || 0) * (item.quantity || 1)), 0);

      card.innerHTML = `
        <div class="shop-list-info">
          <span class="shop-list-title">${this.escapeHtml(list.name)}</span>
          <span class="shop-list-date">Data: ${formattedDate} • ${itemCount} ${itemCount === 1 ? 'item' : 'itens'}</span>
          ${totalCost > 0 ? `<span class="shop-list-total">Total: R$ ${this.formatCurrency(totalCost)}</span>` : ''}
        </div>
        <div class="card-actions">
          <button class="btn-icon btn-edit-list" title="Editar lista" aria-label="Editar lista">
            <img src="src/img/icons/edit.svg" alt="Editar lista" width="18" height="18">
          </button>
          <button class="btn-icon btn-delete-list" title="Excluir lista" aria-label="Excluir lista">
            <img src="src/img/icons/trash.svg" alt="Excluir lista" width="18" height="18">
          </button>
        </div>
      `;

      card.addEventListener('click', () => {
        this.renderDetailView(list.id);
      });

      const btnEdit = card.querySelector('.btn-edit-list');
      btnEdit.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openModal(list);
      });

      const btnDelete = card.querySelector('.btn-delete-list');
      btnDelete.addEventListener('click', (e) => {
        e.stopPropagation();
        this.store.deleteList(list.id);
        this.renderMainList();
      });

      container.appendChild(card);
    });

    this.appContent.innerHTML = '';
    this.appContent.appendChild(container);
  }

  /**
   * Renders the item detail page for a specific shop list.
   * @param {string} listId
   */
  renderDetailView(listId) {
    const list = this.store.getListById(listId);
    if (!list) {
      this.renderMainList();
      return;
    }

    this.activeListId = listId;

    if (this.btnOpenModal) {
      this.btnOpenModal.classList.add('hidden');
    }

    const formattedDate = this.formatDateOnly(list.date || list.createdAt);
    const items = list.items || [];
    const totalListPrice = items.reduce((sum, item) => sum + ((parseFloat(item.price) || 0) * (parseFloat(item.quantity) || 1)), 0);

    const detailElement = document.createElement('div');
    detailElement.className = 'detail-container';

    let itemsHtml = '';
    if (items.length > 0) {
      itemsHtml = items.map((item, index) => this.createItemRowHtml(item, index, listId)).join('');
    } else {
      itemsHtml = `
        <div class="blank-items-container">
          <p>Nenhum item adicionado ainda. Adicione o primeiro item abaixo!</p>
        </div>
      `;
    }

    detailElement.innerHTML = `
      <button class="btn-back" id="btn-back-main">← Voltar para as listas</button>
      <div class="detail-header">
        <div class="detail-header-top">
          <h2 class="detail-title">${this.escapeHtml(list.name)}</h2>
          <button class="btn-icon btn-edit-list" id="btn-edit-detail" title="Editar lista" aria-label="Editar lista">
            <img src="src/img/icons/edit.svg" alt="Editar lista" width="18" height="18">
          </button>
        </div>
        <div class="detail-subtitle-row">
          <span class="detail-subtitle">Data: ${formattedDate}</span>
          <span class="detail-total-badge">Total: R$ ${this.formatCurrency(totalListPrice)}</span>
        </div>
      </div>
      
      <div class="shop-items-list" id="shop-items-list">
        ${itemsHtml}
      </div>

      <!-- Add New Item Row (Always at the bottom) -->
      <div class="add-item-card">
        <div class="add-item-row">
          <input type="text" id="add-item-emoji" class="add-item-emoji-input" value="🛒" maxlength="4" title="Emoji do produto">
          <input type="text" id="add-item-name" class="add-item-name-input" placeholder="Novo produto (ex: Maçã, Leite...)" autocomplete="off">
          <button type="button" id="btn-add-item-submit" class="btn-primary btn-add-item-submit" title="Adicionar produto">
            <img src="src/img/icons/plus.svg" alt="Adicionar" width="16" height="16">
            <span>Adicionar</span>
          </button>
        </div>
      </div>
    `;

    this.appContent.innerHTML = '';
    this.appContent.appendChild(detailElement);

    this.setupDetailEvents(detailElement, listId);
  }

  /**
   * Generates HTML string for a single shop list item row.
   * @param {Object} item
   * @param {number} index
   * @param {string} listId
   * @returns {string}
   */
  createItemRowHtml(item, index, listId) {
    const qty = item.quantity !== undefined ? item.quantity : 1;
    const price = item.price !== undefined ? item.price : 0;
    const itemTotal = price * qty;
    const prevPurchase = this.store.getPreviousItemPrice(item.name, listId);

    let prevPriceHtml = '';
    if (prevPurchase) {
      prevPriceHtml = `<div class="item-previous-price" title="Preço pago na compra anterior">Anterior: R$ ${this.formatCurrency(prevPurchase.price)}</div>`;
    }

    return `
      <div class="shop-item-row ${item.checked ? 'purchased' : ''}" data-id="${item.id}" data-index="${index}" draggable="true">
        <div class="item-main-row">
          <div class="item-drag-handle" title="Arrastar para reordenar (mouse ou toque)">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="5" cy="4" r="1.5"/><circle cx="11" cy="4" r="1.5"/>
              <circle cx="5" cy="8" r="1.5"/><circle cx="11" cy="8" r="1.5"/>
              <circle cx="5" cy="12" r="1.5"/><circle cx="11" cy="12" r="1.5"/>
            </svg>
          </div>
          <input type="checkbox" class="item-checkbox" ${item.checked ? 'checked' : ''} title="Marcar como comprado">
          <input type="text" class="item-emoji-input" value="${this.escapeHtml(item.emoji || '🛒')}" maxlength="4" title="Emoji">
          <input type="text" class="item-name-input" value="${this.escapeHtml(item.name)}" placeholder="Produto">
          <button type="button" class="btn-icon btn-delete-item" title="Excluir item" aria-label="Excluir item">
            <img src="src/img/icons/trash.svg" alt="Excluir" width="16" height="16">
          </button>
        </div>
        <div class="item-sub-row">
          <div class="item-inputs-group">
            <span class="currency-symbol">R$</span>
            <input type="number" step="0.01" min="0" class="item-price-input" value="${price > 0 ? price : ''}" placeholder="0,00" title="Preço">
            <span class="sep-multiply">×</span>
            <input type="number" step="0.1" min="0" class="item-qty-input" value="${qty}" placeholder="Qtd" title="Quantidade">
          </div>
          <div class="item-total-group">
            <div class="item-current-total">R$ ${this.formatCurrency(itemTotal)}</div>
            ${prevPriceHtml}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Configures interaction event handlers for detail view and item rows.
   * @param {HTMLElement} detailElement
   * @param {string} listId
   */
  setupDetailEvents(detailElement, listId) {
    const btnBack = detailElement.querySelector('#btn-back-main');
    if (btnBack) {
      btnBack.addEventListener('click', () => this.renderMainList());
    }

    const btnEditDetail = detailElement.querySelector('#btn-edit-detail');
    if (btnEditDetail) {
      const list = this.store.getListById(listId);
      btnEditDetail.addEventListener('click', () => this.openModal(list));
    }

    // Add item form controls
    const addEmojiInput = detailElement.querySelector('#add-item-emoji');
    const addNameInput = detailElement.querySelector('#add-item-name');
    const btnAddSubmit = detailElement.querySelector('#btn-add-item-submit');

    this.userEditedAddEmoji = false;

    if (addEmojiInput) {
      addEmojiInput.addEventListener('input', () => {
        this.userEditedAddEmoji = true;
      });
    }

    if (addNameInput) {
      addNameInput.addEventListener('input', (e) => {
        if (!this.userEditedAddEmoji && addEmojiInput) {
          addEmojiInput.value = detectEmojiForProduct(e.target.value);
        }
      });

      addNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.handleAddNewItem(listId, addEmojiInput.value, addNameInput.value);
        }
      });
    }

    if (btnAddSubmit) {
      btnAddSubmit.addEventListener('click', () => {
        this.handleAddNewItem(listId, addEmojiInput ? addEmojiInput.value : '', addNameInput ? addNameInput.value : '');
      });
    }

    // Attach listeners to each item row
    const itemRows = detailElement.querySelectorAll('.shop-item-row');
    itemRows.forEach(row => {
      const itemId = row.dataset.id;

      // Checkbox
      const checkbox = row.querySelector('.item-checkbox');
      if (checkbox) {
        checkbox.addEventListener('change', (e) => {
          this.store.updateItem(listId, itemId, { checked: e.target.checked });
          if (e.target.checked) {
            row.classList.add('purchased');
          } else {
            row.classList.remove('purchased');
          }
        });
      }

      // Emoji
      const emojiInput = row.querySelector('.item-emoji-input');
      if (emojiInput) {
        emojiInput.addEventListener('change', (e) => {
          this.store.updateItem(listId, itemId, { emoji: e.target.value });
        });
      }

      // Product Name
      const nameInput = row.querySelector('.item-name-input');
      if (nameInput) {
        nameInput.addEventListener('change', (e) => {
          const newName = e.target.value.trim();
          this.store.updateItem(listId, itemId, { name: newName });
          this.renderDetailView(listId);
        });
      }

      // Price & Quantity
      const priceInput = row.querySelector('.item-price-input');
      const qtyInput = row.querySelector('.item-qty-input');

      const updateCalculatedPrice = () => {
        const p = parseFloat(priceInput.value) || 0;
        const q = parseFloat(qtyInput.value) || 0;
        this.store.updateItem(listId, itemId, { price: p, quantity: q });

        // Update row total display without full re-render
        const totalElem = row.querySelector('.item-current-total');
        if (totalElem) {
          totalElem.textContent = `R$ ${this.formatCurrency(p * q)}`;
        }

        // Update header total badge
        const list = this.store.getListById(listId);
        if (list && list.items) {
          const grandTotal = list.items.reduce((acc, it) => acc + ((parseFloat(it.price) || 0) * (parseFloat(it.quantity) || 1)), 0);
          const headerTotal = detailElement.querySelector('.detail-total-badge');
          if (headerTotal) {
            headerTotal.textContent = `Total: R$ ${this.formatCurrency(grandTotal)}`;
          }
        }
      };

      if (priceInput) priceInput.addEventListener('change', updateCalculatedPrice);
      if (qtyInput) qtyInput.addEventListener('change', updateCalculatedPrice);

      // Delete Button
      const btnDelete = row.querySelector('.btn-delete-item');
      if (btnDelete) {
        btnDelete.addEventListener('click', () => {
          this.store.deleteItem(listId, itemId);
          this.renderDetailView(listId);
        });
      }
    });

    // Setup Drag & Drop (Mouse + Touch)
    this.setupDragAndDrop(detailElement, listId);
  }

  /**
   * Handles creation of a new item from the bottom row.
   * @param {string} listId
   * @param {string} emoji
   * @param {string} name
   */
  handleAddNewItem(listId, emoji, name) {
    if (!name || !name.trim()) return;

    this.store.addItem(listId, {
      emoji: emoji || detectEmojiForProduct(name),
      name: name,
      price: 0,
      quantity: 1,
      checked: false
    });

    this.renderDetailView(listId);

    // Re-focus new product input for quick consecutive additions
    setTimeout(() => {
      const newNameInput = document.getElementById('add-item-name');
      if (newNameInput) {
        newNameInput.focus();
      }
    }, 50);
  }

  /**
   * Configures HTML5 Mouse Drag and Touch Screen Drag & Drop reordering.
   * @param {HTMLElement} detailElement
   * @param {string} listId
   */
  setupDragAndDrop(detailElement, listId) {
    const container = detailElement.querySelector('#shop-items-list');
    if (!container) return;

    const rows = container.querySelectorAll('.shop-item-row');
    let draggedIndex = null;
    let touchDraggedRow = null;
    let touchStartIndex = null;
    let currentHoveredRow = null;

    rows.forEach(row => {
      // Prevent drag initiation when typing in inputs or selects
      const interactiveElements = row.querySelectorAll('input, select, button');
      interactiveElements.forEach(el => {
        el.addEventListener('mousedown', (e) => e.stopPropagation());
        el.addEventListener('touchstart', (e) => e.stopPropagation());
      });

      // --- HTML5 Mouse Drag Events ---
      row.addEventListener('dragstart', (e) => {
        draggedIndex = parseInt(row.dataset.index, 10);
        row.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', draggedIndex.toString());
      });

      row.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        row.classList.add('drag-over');
      });

      row.addEventListener('dragleave', () => {
        row.classList.remove('drag-over');
      });

      row.addEventListener('drop', (e) => {
        e.preventDefault();
        row.classList.remove('drag-over');
        const targetIndex = parseInt(row.dataset.index, 10);

        if (draggedIndex !== null && draggedIndex !== targetIndex) {
          this.store.reorderItems(listId, draggedIndex, targetIndex);
          this.renderDetailView(listId);
        }
      });

      row.addEventListener('dragend', () => {
        row.classList.remove('dragging');
        rows.forEach(r => r.classList.remove('drag-over'));
      });

      // --- Touch Screen Drag Events ---
      const handle = row.querySelector('.item-drag-handle');
      if (handle) {
        handle.addEventListener('touchstart', (e) => {
          touchDraggedRow = row;
          touchStartIndex = parseInt(row.dataset.index, 10);
          row.classList.add('dragging');
        }, { passive: true });

        handle.addEventListener('touchmove', (e) => {
          if (!touchDraggedRow) return;
          const touch = e.touches[0];
          const elementAtTouch = document.elementFromPoint(touch.clientX, touch.clientY);
          
          if (elementAtTouch) {
            const hoveredRow = elementAtTouch.closest('.shop-item-row');
            if (currentHoveredRow && currentHoveredRow !== hoveredRow) {
              currentHoveredRow.classList.remove('drag-over');
            }
            if (hoveredRow) {
              hoveredRow.classList.add('drag-over');
              currentHoveredRow = hoveredRow;
            }
          }
        }, { passive: true });

        handle.addEventListener('touchend', () => {
          if (touchDraggedRow && currentHoveredRow) {
            const targetIndex = parseInt(currentHoveredRow.dataset.index, 10);
            if (touchStartIndex !== null && targetIndex !== touchStartIndex) {
              this.store.reorderItems(listId, touchStartIndex, targetIndex);
              this.renderDetailView(listId);
            }
          }

          if (touchDraggedRow) touchDraggedRow.classList.remove('dragging');
          if (currentHoveredRow) currentHoveredRow.classList.remove('drag-over');

          touchDraggedRow = null;
          touchStartIndex = null;
          currentHoveredRow = null;
        });
      }
    });
  }

  /**
   * Helper utility to escape raw text for HTML injection safety.
   * @param {string} str
   * @returns {string}
   */
  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }
}

// Instantiate core modules
const swManager = new ServiceWorkerManager();
const networkMonitor = new NetworkMonitor(swManager);
const shopListStore = new ShopListStore();
const shopListApp = new ShopListApp(shopListStore);

