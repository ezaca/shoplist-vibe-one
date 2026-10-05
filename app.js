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
   * Retrieves all shop lists from localStorage.
   * Initializes empty array if none exists or if data is invalid.
   * @returns {Array<{id: string, name: string, createdAt: string, items: Array}>}
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
   * Adds a new shop list with a grocery store name and creation date.
   * @param {string} storeName
   * @returns {Object} The created shop list object
   */
  addList(storeName) {
    const lists = this.getAll();
    const newList = {
      id: Date.now().toString(),
      name: storeName.trim(),
      createdAt: new Date().toISOString(),
      items: []
    };
    lists.push(newList);
    this.saveAll(lists);
    return newList;
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
    this.form = document.getElementById('form-new-list');
    this.inputStoreName = document.getElementById('input-store-name');
    this.btnOpenModal = document.getElementById('btn-open-modal');
    this.btnCancelModal = document.getElementById('btn-cancel-modal');

    this.activeListId = null;

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
        if (name && name.trim()) {
          this.store.addList(name);
          this.closeModal();
          if (this.activeListId) {
            this.renderMainList();
          } else {
            this.renderMainList();
          }
        }
      });
    }
  }

  /**
   * Opens the new list modal popup and focuses the input field.
   */
  openModal() {
    if (!this.modal) return;
    this.inputStoreName.value = '';
    this.modal.classList.remove('hidden');
    this.inputStoreName.focus();
  }

  /**
   * Closes the new list modal popup.
   */
  closeModal() {
    if (!this.modal) return;
    this.modal.classList.add('hidden');
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

      const formattedDate = new Date(list.createdAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      card.innerHTML = `
        <div class="shop-list-info">
          <span class="shop-list-title">${this.escapeHtml(list.name)}</span>
          <span class="shop-list-date">Criada em: ${formattedDate}</span>
        </div>
        <button class="btn-delete-list" title="Excluir lista">Excluir</button>
      `;

      // Card click opens items page
      card.addEventListener('click', () => {
        this.renderDetailView(list.id);
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

    const formattedDate = new Date(list.createdAt).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const detailElement = document.createElement('div');
    detailElement.className = 'detail-container';
    detailElement.innerHTML = `
      <button class="btn-back" id="btn-back-main">← Voltar para as listas</button>
      <div class="detail-header">
        <h2 class="detail-title">${this.escapeHtml(list.name)}</h2>
        <div class="detail-subtitle">Criada em: ${formattedDate}</div>
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
