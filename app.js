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
   * Initializes empty array if none exists or if data is invalid.
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
   * Formats date string to DD/MM/YYYY using local time without hours and minutes.
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

      card.innerHTML = `
        <div class="shop-list-info">
          <span class="shop-list-title">${this.escapeHtml(list.name)}</span>
          <span class="shop-list-date">Data: ${formattedDate}</span>
        </div>
        <div class="card-actions">
          <button class="btn-icon btn-edit-list" title="Editar lista" aria-label="Editar lista">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="btn-icon btn-delete-list" title="Excluir lista" aria-label="Excluir lista">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      `;

      // Card click opens items page
      card.addEventListener('click', () => {
        this.renderDetailView(list.id);
      });

      // Edit button click opens edit modal
      const btnEdit = card.querySelector('.btn-edit-list');
      btnEdit.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openModal(list);
      });

      // Delete button click deletes list
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

    const detailElement = document.createElement('div');
    detailElement.className = 'detail-container';
    detailElement.innerHTML = `
      <button class="btn-back" id="btn-back-main">← Voltar para as listas</button>
      <div class="detail-header">
        <div class="detail-header-top">
          <h2 class="detail-title">${this.escapeHtml(list.name)}</h2>
          <button class="btn-icon btn-edit-list" id="btn-edit-detail" title="Editar lista" aria-label="Editar lista">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
        </div>
        <div class="detail-subtitle">Data: ${formattedDate}</div>
      </div>
      <div class="blank-items-container">
        <p>Esta lista está vazia.</p>
      </div>
    `;

    this.appContent.innerHTML = '';
    this.appContent.appendChild(detailElement);

    const btnBack = detailElement.querySelector('#btn-back-main');
    btnBack.addEventListener('click', () => {
      this.renderMainList();
    });

    const btnEditDetail = detailElement.querySelector('#btn-edit-detail');
    btnEditDetail.addEventListener('click', () => {
      this.openModal(list);
    });
  }

  /**
   * Helper utility to escape raw text for HTML injection safety.
   * @param {string} str
   * @returns {string}
   */
  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

// Instantiate core modules
const swManager = new ServiceWorkerManager();
const networkMonitor = new NetworkMonitor(swManager);
const shopListStore = new ShopListStore();
const shopListApp = new ShopListApp(shopListStore);
