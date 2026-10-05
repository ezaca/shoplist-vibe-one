/**
 * Aplicação Principal SPA - Shoplist
 * Arquitetura limpa, código legível e princípio KISS
 */

import { storage, formatCurrency, formatDateBR, getTodayDateISO, normalizeItemKey } from './storage.js';
import { detectEmoji, QUICK_CATEGORIES, DEFAULT_EMOJI } from './emoji-catalog.js';

class ShoplistApp {
  constructor() {
    this.currentListId = null;
    this.activeItemForPriceModal = null;
    this.selectedNewItemEmoji = DEFAULT_EMOJI;
    this.customEmojiTarget = 'new-item'; // 'new-item' ou itemId
    this.draggedItemIndex = null;

    this.cacheDOMElements();
    this.bindEvents();
    this.initPWA();
    this.populateStoreDatalists();
    this.renderScreen();
  }

  cacheDOMElements() {
    // Telas
    this.screenLists = document.getElementById('screen-lists');
    this.screenDetail = document.getElementById('screen-detail');

    // Elementos da Tela 1 (Listas)
    this.listsContainer = document.getElementById('lists-container');
    this.listsEmptyState = document.getElementById('lists-empty');
    this.inputSearchLists = document.getElementById('input-search-lists');
    this.btnCreateListQuick = document.getElementById('btn-create-list-quick');
    this.btnEmptyNewList = document.getElementById('btn-empty-new-list');

    // Elementos da Tela 2 (Detalhes da Lista)
    this.btnBackToLists = document.getElementById('btn-back-to-lists');
    this.detailListTitle = document.getElementById('detail-list-title');
    this.detailListDate = document.getElementById('detail-list-date');
    this.detailStoreName = document.getElementById('detail-store-name');
    this.btnChangeStore = document.getElementById('btn-change-store');
    this.btnEditCurrentList = document.getElementById('btn-edit-current-list');
    this.btnDeleteCurrentList = document.getElementById('btn-delete-current-list');

    // Resumo
    this.summaryTotalSpent = document.getElementById('summary-total-spent');
    this.summaryTotalAll = document.getElementById('summary-total-all');
    this.summaryItemsCount = document.getElementById('summary-items-count');
    this.summarySavingsTag = document.getElementById('summary-savings-tag');

    // Adição de Item
    this.formAddItem = document.getElementById('form-add-item');
    this.inputItemName = document.getElementById('input-item-name');
    this.btnQuickEmoji = document.getElementById('btn-quick-emoji');
    this.hintPreviousPrice = document.getElementById('hint-previous-price');
    this.historyDatalist = document.getElementById('history-datalist');
    this.itemsContainer = document.getElementById('items-container');
    this.itemsEmptyState = document.getElementById('items-empty');

    // Diálogos / Modais
    this.dialogNewList = document.getElementById('dialog-new-list');
    this.formNewList = document.getElementById('form-new-list');
    this.newListTitle = document.getElementById('new-list-title');
    this.newListStore = document.getElementById('new-list-store');
    this.newListDate = document.getElementById('new-list-date');

    this.dialogPriceQty = document.getElementById('dialog-price-qty');
    this.formPriceQty = document.getElementById('form-price-qty');
    this.priceModalEmoji = document.getElementById('price-modal-emoji');
    this.priceModalItemName = document.getElementById('price-modal-item-name');
    this.inputEditQuantity = document.getElementById('input-edit-quantity');
    this.selectEditUnit = document.getElementById('select-edit-unit');
    this.inputEditUnitPrice = document.getElementById('input-edit-unit-price');
    this.computedItemTotal = document.getElementById('computed-item-total');
    this.inputEditItemStore = document.getElementById('input-edit-item-store');
    this.priceHistoryInfo = document.getElementById('price-history-info');
    this.priceHistoryDiff = document.getElementById('price-history-diff');
    this.priceHistoryDetails = document.getElementById('price-history-details');

    this.dialogEmojiPicker = document.getElementById('dialog-emoji-picker');
    this.emojiPickerContainer = document.getElementById('emoji-picker-container');
    this.customEmojiInput = document.getElementById('custom-emoji-input');
    this.btnApplyCustomEmoji = document.getElementById('btn-apply-custom-emoji');

    this.dialogEditList = document.getElementById('dialog-edit-list');
    this.formEditList = document.getElementById('form-edit-list');
    this.editListTitle = document.getElementById('edit-list-title');
    this.editListStore = document.getElementById('edit-list-store');
    this.editListDate = document.getElementById('edit-list-date');

    this.dialogBackup = document.getElementById('dialog-backup');
    this.btnOpenBackup = document.getElementById('btn-open-backup');
    this.btnExportJson = document.getElementById('btn-export-json');
    this.inputImportJson = document.getElementById('input-import-json');

    this.toastContainer = document.getElementById('toast-container');
    this.networkStatusText = document.getElementById('network-status-text');
  }

  bindEvents() {
    // Navegação e criação de listas
    this.btnCreateListQuick.addEventListener('click', () => this.openNewListModal());
    this.btnEmptyNewList.addEventListener('click', () => this.openNewListModal());
    this.btnBackToLists.addEventListener('click', () => this.navigateToListsScreen());

    this.formNewList.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleCreateNewList();
    });

    // Busca de listas
    this.inputSearchLists.addEventListener('input', () => this.renderLists());

    // Edição e exclusão da lista atual
    this.btnEditCurrentList.addEventListener('click', () => this.openEditListModal());
    this.btnChangeStore.addEventListener('click', () => this.openEditListModal());
    this.formEditList.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSaveListEdit();
    });

    this.btnDeleteCurrentList.addEventListener('click', () => this.handleDeleteCurrentList());

    // Adição de Item
    this.inputItemName.addEventListener('input', () => this.handleItemNameInput());
    this.inputItemName.addEventListener('change', () => this.handleItemNameInput());
    this.formAddItem.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleAddItem();
    });

    // Modal de Preço e Quantidade
    this.inputEditQuantity.addEventListener('input', () => this.updateComputedModalTotal());
    this.inputEditUnitPrice.addEventListener('input', () => this.updateComputedModalTotal());
    this.formPriceQty.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSavePriceQty();
    });

    // Modal de Emoji
    this.btnQuickEmoji.addEventListener('click', () => this.openEmojiPicker('new-item'));
    this.btnApplyCustomEmoji.addEventListener('click', () => this.handleApplyCustomEmoji());
    this.renderEmojiPickerGrid();

    // Backup & Restauração
    this.btnOpenBackup.addEventListener('click', () => this.dialogBackup.showModal());
    this.btnExportJson.addEventListener('click', () => this.handleExportBackup());
    this.inputImportJson.addEventListener('change', (e) => this.handleImportBackup(e));

    // Fechar modais ao clicar em botões [data-close-modal]
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const dialog = e.target.closest('dialog');
        if (dialog) dialog.close();
      });
    });

    // Conectividade
    window.addEventListener('online', () => this.updateNetworkStatus());
    window.addEventListener('offline', () => this.updateNetworkStatus());
  }

  // --- NAVEGAÇÃO SPA ---

  navigateToListsScreen() {
    this.currentListId = null;
    this.screenDetail.classList.remove('active');
    this.screenLists.classList.add('active');
    this.renderLists();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  navigateToListDetail(listId) {
    this.currentListId = listId;
    this.screenLists.classList.remove('active');
    this.screenDetail.classList.add('active');
    this.renderListDetail();
    this.updateItemHistoryDatalist();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  renderScreen() {
    if (this.currentListId) {
      this.renderListDetail();
    } else {
      this.renderLists();
    }
  }

  // --- TELA 1: LISTAS DE COMPRAS ---

  openNewListModal() {
    const today = new Date();
    const todayFormatted = formatDateBR(today);
    this.newListTitle.value = `Compras - ${todayFormatted}`;
    this.newListDate.value = getTodayDateISO();
    this.newListStore.value = '';
    this.dialogNewList.showModal();
    this.newListTitle.select();
  }

  handleCreateNewList() {
    const title = this.newListTitle.value.trim();
    const store = this.newListStore.value.trim();
    const date = this.newListDate.value || getTodayDateISO();

    const newList = storage.createBlankList(title, store);
    newList.date = date;
    storage.saveList(newList);

    this.dialogNewList.close();
    this.showToast('Nova lista criada com sucesso!');
    this.navigateToListDetail(newList.id);
    this.populateStoreDatalists();
  }

  renderLists() {
    const lists = storage.getLists();
    const query = (this.inputSearchLists.value || '').toLowerCase().trim();

    const filtered = lists.filter(list => {
      if (!query) return true;
      const titleMatch = (list.title || '').toLowerCase().includes(query);
      const storeMatch = (list.store || '').toLowerCase().includes(query);
      return titleMatch || storeMatch;
    });

    this.listsContainer.innerHTML = '';

    if (filtered.length === 0) {
      this.listsEmptyState.style.display = 'flex';
      return;
    }
    this.listsEmptyState.style.display = 'none';

    filtered.forEach(list => {
      const items = list.items || [];
      const totalItems = items.length;
      const purchasedItems = items.filter(i => i.purchased).length;
      const totalSpent = items
        .filter(i => i.purchased)
        .reduce((sum, i) => sum + (Number(i.totalPrice) || 0), 0);
      const totalEstimated = items
        .reduce((sum, i) => sum + (Number(i.totalPrice) || 0), 0);

      const progressPercent = totalItems > 0 ? Math.round((purchasedItems / totalItems) * 100) : 0;
      const dateDisplay = formatDateBR(list.date || list.createdAt);

      const card = document.createElement('div');
      card.className = 'list-card';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');

      card.innerHTML = `
        <div class="list-card-header">
          <div>
            <h2 class="list-card-title">${this.escapeHTML(list.title || 'Lista de Compras')}</h2>
            <div class="list-card-date">
              📅 ${dateDisplay}
              ${list.store ? `<span class="list-card-store">🏪 ${this.escapeHTML(list.store)}</span>` : ''}
            </div>
          </div>
        </div>

        <div class="list-progress-bar">
          <div class="list-progress-fill" style="width: ${progressPercent}%;"></div>
        </div>

        <div class="list-card-body">
          <div class="list-card-stats">
            <span class="list-items-count">${purchasedItems} de ${totalItems} itens comprados (${progressPercent}%)</span>
          </div>
          <div class="list-card-total">
            <div class="total-label">Total Gasto</div>
            <div class="total-value">${formatCurrency(totalSpent)}</div>
          </div>
        </div>
      `;

      card.addEventListener('click', () => {
        this.navigateToListDetail(list.id);
      });

      this.listsContainer.appendChild(card);
    });
  }

  // --- TELA 2: ITENS DA LISTA SELECIONADA ---

  renderListDetail() {
    const list = storage.getListById(this.currentListId);
    if (!list) {
      this.navigateToListsScreen();
      return;
    }

    // Atualiza cabeçalho da lista
    this.detailListTitle.textContent = list.title || 'Lista de Compras';
    this.detailListDate.textContent = `📅 ${formatDateBR(list.date || list.createdAt)}`;
    this.detailStoreName.textContent = list.store ? list.store : 'Definir Supermercado';

    // Itens
    const items = list.items || [];
    this.renderItemsList(items);
    this.updateSummary(items);
  }

  renderItemsList(items) {
    this.itemsContainer.innerHTML = '';

    if (items.length === 0) {
      this.itemsEmptyState.style.display = 'flex';
      return;
    }
    this.itemsEmptyState.style.display = 'none';

    items.forEach((item, index) => {
      const li = document.createElement('li');
      li.className = `item-row ${item.purchased ? 'purchased' : ''}`;
      li.draggable = true;
      li.dataset.index = index;
      li.dataset.itemId = item.id;

      // Cálculo de variação de preço em relação ao anterior
      let diffHtml = '';
      if (item.previousPrice && item.unitPrice > 0) {
        const diff = item.unitPrice - item.previousPrice;
        const diffPercent = ((diff / item.previousPrice) * 100).toFixed(0);
        if (diff > 0.01) {
          diffHtml = `<span class="price-diff up" title="Mais caro que na última compra">+${diffPercent}% 🔺</span>`;
        } else if (diff < -0.01) {
          diffHtml = `<span class="price-diff down" title="Mais barato que na última compra">${diffPercent}% 🟢</span>`;
        }
      }

      const prevPriceDisplay = item.previousPrice 
        ? `Anterior: ${formatCurrency(item.previousPrice)} ${diffHtml}`
        : 'Primeiro registro';

      const unitPriceVal = Number(item.unitPrice) || 0;
      const priceTagText = unitPriceVal > 0 
        ? formatCurrency(item.totalPrice || (unitPriceVal * (item.quantity || 1)))
        : 'Definir Preço';

      const isUnpriced = unitPriceVal <= 0;

      li.innerHTML = `
        <!-- Handle para reordenar -->
        <div class="item-drag-handle" title="Arraste para reordenar" aria-label="Reordenar">⋮⋮</div>

        <!-- Checkbox de comprado -->
        <label class="item-checkbox-container" title="Marcar como comprado">
          <input type="checkbox" class="item-checkbox" ${item.purchased ? 'checked' : ''}>
        </label>

        <!-- Emoji do item -->
        <button type="button" class="btn-item-action item-emoji" data-action="change-emoji" title="Trocar emoji">
          ${item.emoji || DEFAULT_EMOJI}
        </button>

        <!-- Nome e Quantidade -->
        <div class="item-info">
          <div class="item-name" title="${this.escapeHTML(item.name)}">${this.escapeHTML(item.name)}</div>
          <div class="item-qty-tag">${item.quantity || 1} ${item.unit || 'un'} ${item.unitPrice > 0 ? `(${formatCurrency(item.unitPrice)}/${item.unit || 'un'})` : ''}</div>
        </div>

        <!-- Preço Atual e Preço Anterior -->
        <div class="item-pricing">
          <button type="button" class="btn-price-tag ${isUnpriced ? 'unpriced' : ''}" data-action="edit-price" title="Clique para definir preço e quantidade">
            ${priceTagText}
          </button>
          <div class="item-prev-price">${prevPriceDisplay}</div>
        </div>

        <!-- Botões de mover para cima/baixo e excluir -->
        <div class="item-actions">
          <div class="reorder-btns">
            <button type="button" class="btn-move" data-action="move-up" title="Mover para cima" ${index === 0 ? 'disabled style="opacity:0.2"' : ''}>▲</button>
            <button type="button" class="btn-move" data-action="move-down" title="Mover para baixo" ${index === items.length - 1 ? 'disabled style="opacity:0.2"' : ''}>▼</button>
          </div>
          <button type="button" class="btn-item-action" data-action="delete-item" title="Remover item da lista" aria-label="Remover">
            ✕
          </button>
        </div>
      `;

      // Eventos dos elementos da linha
      const checkbox = li.querySelector('.item-checkbox');
      checkbox.addEventListener('change', () => {
        this.toggleItemPurchased(item.id, checkbox.checked);
      });

      const btnPrice = li.querySelector('[data-action="edit-price"]');
      btnPrice.addEventListener('click', () => {
        this.openPriceQtyModal(item);
      });

      const btnEmoji = li.querySelector('[data-action="change-emoji"]');
      btnEmoji.addEventListener('click', () => {
        this.openEmojiPicker(item.id);
      });

      const btnDelete = li.querySelector('[data-action="delete-item"]');
      btnDelete.addEventListener('click', () => {
        this.deleteItem(item.id);
      });

      const btnMoveUp = li.querySelector('[data-action="move-up"]');
      btnMoveUp.addEventListener('click', (e) => {
        e.stopPropagation();
        this.moveItem(index, index - 1);
      });

      const btnMoveDown = li.querySelector('[data-action="move-down"]');
      btnMoveDown.addEventListener('click', (e) => {
        e.stopPropagation();
        this.moveItem(index, index + 1);
      });

      // Configuração de Drag and Drop
      this.attachDragAndDropHandlers(li, index);

      this.itemsContainer.appendChild(li);
    });
  }

  // --- REORDENAÇÃO (DRAG & DROP E BOTÕES) ---

  attachDragAndDropHandlers(element, index) {
    element.addEventListener('dragstart', (e) => {
      this.draggedItemIndex = index;
      element.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', index);
    });

    element.addEventListener('dragend', () => {
      element.classList.remove('dragging');
      document.querySelectorAll('.item-row').forEach(row => row.classList.remove('drag-over'));
      this.draggedItemIndex = null;
    });

    element.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      element.classList.add('drag-over');
    });

    element.addEventListener('dragleave', () => {
      element.classList.remove('drag-over');
    });

    element.addEventListener('drop', (e) => {
      e.preventDefault();
      element.classList.remove('drag-over');
      const targetIndex = Number(element.dataset.index);
      if (this.draggedItemIndex !== null && this.draggedItemIndex !== targetIndex) {
        this.moveItem(this.draggedItemIndex, targetIndex);
      }
    });
  }

  moveItem(fromIndex, toIndex) {
    const list = storage.getListById(this.currentListId);
    if (!list || !list.items) return;

    if (toIndex < 0 || toIndex >= list.items.length) return;

    const [movedItem] = list.items.splice(fromIndex, 1);
    list.items.splice(toIndex, 0, movedItem);

    storage.saveList(list);
    this.renderListDetail();
  }

  // --- AÇÕES DO ITEM (ADICIONAR, TOGGLE, REMOVER) ---

  handleItemNameInput() {
    const name = this.inputItemName.value;
    const detected = detectEmoji(name);
    this.selectedNewItemEmoji = detected;
    this.btnQuickEmoji.textContent = detected;

    // Busca histórico de preço deste produto
    const currentList = storage.getListById(this.currentListId);
    const store = currentList ? currentList.store : '';
    const latestPrice = storage.getLatestPriceForItem(name, store);

    if (latestPrice && latestPrice.unitPrice > 0) {
      const storeText = latestPrice.store ? ` no ${latestPrice.store}` : '';
      this.hintPreviousPrice.innerHTML = `
        <span class="hint-last-price">🏷️ Último: ${formatCurrency(latestPrice.unitPrice)}/${latestPrice.unit || 'un'}${storeText}</span>
      `;
    } else {
      this.hintPreviousPrice.innerHTML = '';
    }
  }

  handleAddItem() {
    const name = this.inputItemName.value.trim();
    if (!name) return;

    const list = storage.getListById(this.currentListId);
    if (!list) return;

    // Busca o preço anterior do produto no histórico de preços
    const previousRecord = storage.getLatestPriceForItem(name, list.store);
    const previousPrice = previousRecord ? (previousRecord.unitPrice || 0) : null;
    const defaultUnit = previousRecord ? (previousRecord.unit || 'un') : 'un';

    const newItem = {
      id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: name,
      emoji: this.selectedNewItemEmoji || detectEmoji(name),
      purchased: false, // Inicia desmarcado (ainda a ser comprado)
      unitPrice: 0,
      quantity: 1,
      unit: defaultUnit,
      totalPrice: 0,
      previousPrice: previousPrice,
      store: list.store || ''
    };

    if (!list.items) list.items = [];
    list.items.push(newItem);
    storage.saveList(list);

    // Limpa formulário
    this.inputItemName.value = '';
    this.selectedNewItemEmoji = DEFAULT_EMOJI;
    this.btnQuickEmoji.textContent = DEFAULT_EMOJI;
    this.hintPreviousPrice.innerHTML = '';

    this.renderListDetail();
    this.updateItemHistoryDatalist();
    this.showToast(`"${name}" adicionado à lista.`);
  }

  toggleItemPurchased(itemId, isPurchased) {
    const list = storage.getListById(this.currentListId);
    if (!list || !list.items) return;

    const item = list.items.find(i => i.id === itemId);
    if (item) {
      item.purchased = isPurchased;

      // Se foi marcado como comprado e tem preço definido, registra no histórico da loja
      if (isPurchased && item.unitPrice > 0) {
        storage.recordPrice(item.name, {
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          quantity: item.quantity,
          unit: item.unit,
          store: list.store || item.store,
          date: list.date || getTodayDateISO(),
          listId: list.id
        });
      }

      storage.saveList(list);
      this.renderListDetail();
    }
  }

  deleteItem(itemId) {
    const list = storage.getListById(this.currentListId);
    if (!list || !list.items) return;

    const item = list.items.find(i => i.id === itemId);
    const itemName = item ? item.name : 'Item';

    list.items = list.items.filter(i => i.id !== itemId);
    storage.saveList(list);
    this.renderListDetail();
    this.showToast(`"${itemName}" removido.`);
  }

  // --- MODAL DE DEFINIR PREÇO E QUANTIDADE ---

  openPriceQtyModal(item) {
    this.activeItemForPriceModal = item;
    const list = storage.getListById(this.currentListId);

    this.priceModalEmoji.textContent = item.emoji || DEFAULT_EMOJI;
    this.priceModalItemName.textContent = item.name;

    this.inputEditQuantity.value = item.quantity || 1;
    this.selectEditUnit.value = item.unit || 'un';
    this.inputEditUnitPrice.value = item.unitPrice > 0 ? item.unitPrice : '';
    this.inputEditItemStore.value = item.store || (list ? list.store : '');

    this.updateComputedModalTotal();

    // Carrega histórico de preços anteriores do item
    this.renderItemPriceHistoryInModal(item.name, list ? list.store : '');

    this.dialogPriceQty.showModal();
    this.inputEditUnitPrice.focus();
  }

  updateComputedModalTotal() {
    const qty = parseFloat(this.inputEditQuantity.value) || 0;
    const unitPrice = parseFloat(this.inputEditUnitPrice.value) || 0;
    const total = qty * unitPrice;
    this.computedItemTotal.textContent = formatCurrency(total);
  }

  renderItemPriceHistoryInModal(itemName, currentStore) {
    const key = normalizeItemKey(itemName);
    const historyMap = storage.getPriceHistoryMap();
    const records = historyMap[key] || [];

    if (records.length === 0) {
      this.priceHistoryDiff.textContent = '';
      this.priceHistoryDetails.textContent = 'Este produto ainda não possui compras anteriores registradas.';
      return;
    }

    const latest = records[records.length - 1];
    const dateFormatted = formatDateBR(latest.date);
    const storeName = latest.store ? `no ${latest.store}` : '';

    this.priceHistoryDetails.innerHTML = `
      <strong>${formatCurrency(latest.unitPrice)}/${latest.unit || 'un'}</strong> ${storeName} em ${dateFormatted}
    `;

    // Atualiza badge de comparação se houver preço atual digitado
    const currentPriceInput = parseFloat(this.inputEditUnitPrice.value) || 0;
    if (currentPriceInput > 0 && latest.unitPrice > 0) {
      const diff = currentPriceInput - latest.unitPrice;
      const percent = ((diff / latest.unitPrice) * 100).toFixed(0);
      if (diff > 0.01) {
        this.priceHistoryDiff.innerHTML = `<span class="price-diff up">+${percent}% mais caro 🔺</span>`;
      } else if (diff < -0.01) {
        this.priceHistoryDiff.innerHTML = `<span class="price-diff down">${percent}% economia 🟢</span>`;
      } else {
        this.priceHistoryDiff.innerHTML = `<span style="color:var(--text-muted); font-weight:600;">Mesmo preço =</span>`;
      }
    } else {
      this.priceHistoryDiff.textContent = '';
    }
  }

  handleSavePriceQty() {
    if (!this.activeItemForPriceModal) return;

    const list = storage.getListById(this.currentListId);
    if (!list || !list.items) return;

    const item = list.items.find(i => i.id === this.activeItemForPriceModal.id);
    if (!item) return;

    const quantity = parseFloat(this.inputEditQuantity.value) || 1;
    const unit = this.selectEditUnit.value || 'un';
    const unitPrice = parseFloat(this.inputEditUnitPrice.value) || 0;
    const store = this.inputEditItemStore.value.trim();

    // Atualiza valores do item
    item.quantity = quantity;
    item.unit = unit;
    item.unitPrice = unitPrice;
    item.totalPrice = Number((quantity * unitPrice).toFixed(2));
    if (store) item.store = store;

    // Registra este preço no histórico para futuras referências e acompanhamento entre lojas
    if (unitPrice > 0) {
      storage.recordPrice(item.name, {
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        quantity: item.quantity,
        unit: item.unit,
        store: store || list.store,
        date: list.date || getTodayDateISO(),
        listId: list.id
      });
      if (store) {
        storage.addStoreIfNew(store);
      }
    }

    storage.saveList(list);
    this.dialogPriceQty.close();
    this.renderListDetail();
    this.showToast('Preço e quantidade atualizados!');
  }

  // --- RESUMO DA LISTA (TOTAL GASTO E ESTIMADO) ---

  updateSummary(items) {
    const totalSpent = items
      .filter(i => i.purchased)
      .reduce((sum, i) => sum + (Number(i.totalPrice) || 0), 0);

    const totalAll = items
      .reduce((sum, i) => sum + (Number(i.totalPrice) || 0), 0);

    const totalCount = items.length;
    const purchasedCount = items.filter(i => i.purchased).length;

    this.summaryTotalSpent.textContent = formatCurrency(totalSpent);
    this.summaryTotalAll.textContent = formatCurrency(totalAll);
    this.summaryItemsCount.textContent = `${purchasedCount} de ${totalCount} itens no carrinho`;

    // Variação global vs compras anteriores
    let totalPrevious = 0;
    let itemsWithPrev = 0;
    items.forEach(i => {
      if (i.previousPrice && i.unitPrice > 0) {
        totalPrevious += i.previousPrice * (i.quantity || 1);
        itemsWithPrev++;
      }
    });

    if (itemsWithPrev > 0 && totalPrevious > 0) {
      const diff = totalAll - totalPrevious;
      if (Math.abs(diff) > 0.05) {
        const percent = ((diff / totalPrevious) * 100).toFixed(0);
        if (diff > 0) {
          this.summarySavingsTag.style.display = 'inline';
          this.summarySavingsTag.className = 'price-diff up';
          this.summarySavingsTag.textContent = `🔺 +${formatCurrency(diff)} (+${percent}%) vs anteriores`;
        } else {
          this.summarySavingsTag.style.display = 'inline';
          this.summarySavingsTag.className = 'price-diff down';
          this.summarySavingsTag.textContent = `🟢 Economia: ${formatCurrency(Math.abs(diff))} (${percent}%)`;
        }
      } else {
        this.summarySavingsTag.style.display = 'none';
      }
    } else {
      this.summarySavingsTag.style.display = 'none';
    }
  }

  // --- SELETOR DE EMOJIS ---

  renderEmojiPickerGrid() {
    this.emojiPickerContainer.innerHTML = '';
    QUICK_CATEGORIES.forEach(cat => {
      cat.emojis.forEach(emoji => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-emoji-choice';
        btn.textContent = emoji;
        btn.addEventListener('click', () => {
          this.selectEmoji(emoji);
        });
        this.emojiPickerContainer.appendChild(btn);
      });
    });
  }

  openEmojiPicker(target) {
    this.customEmojiTarget = target;
    this.customEmojiInput.value = '';
    this.dialogEmojiPicker.showModal();
  }

  selectEmoji(emoji) {
    if (this.customEmojiTarget === 'new-item') {
      this.selectedNewItemEmoji = emoji;
      this.btnQuickEmoji.textContent = emoji;
    } else {
      // É o ID de um item existente na lista
      const list = storage.getListById(this.currentListId);
      if (list && list.items) {
        const item = list.items.find(i => i.id === this.customEmojiTarget);
        if (item) {
          item.emoji = emoji;
          storage.saveList(list);
          this.renderListDetail();
        }
      }
    }
    this.dialogEmojiPicker.close();
  }

  handleApplyCustomEmoji() {
    const val = this.customEmojiInput.value.trim();
    if (val) {
      this.selectEmoji(val);
    }
  }

  // --- EDIÇÃO E EXCLUSÃO DA LISTA ---

  openEditListModal() {
    const list = storage.getListById(this.currentListId);
    if (!list) return;

    this.editListTitle.value = list.title || '';
    this.editListStore.value = list.store || '';
    this.editListDate.value = list.date || getTodayDateISO();
    this.dialogEditList.showModal();
    this.editListTitle.focus();
  }

  handleSaveListEdit() {
    const list = storage.getListById(this.currentListId);
    if (!list) return;

    list.title = this.editListTitle.value.trim() || list.title;
    list.store = this.editListStore.value.trim();
    list.date = this.editListDate.value || list.date;

    if (list.store) {
      storage.addStoreIfNew(list.store);
      this.populateStoreDatalists();
    }

    storage.saveList(list);
    this.dialogEditList.close();
    this.renderListDetail();
    this.showToast('Lista atualizada!');
  }

  handleDeleteCurrentList() {
    const list = storage.getListById(this.currentListId);
    if (!list) return;

    const confirmed = window.confirm(`Deseja realmente excluir a lista "${list.title}"?`);
    if (confirmed) {
      storage.deleteList(list.id);
      this.showToast('Lista excluída.');
      this.navigateToListsScreen();
    }
  }

  // --- DATALISTS (AUTOCOMPLETE DE PRODUTOS E SUPERMERCADOS) ---

  populateStoreDatalists() {
    const stores = storage.getStores();
    const html = stores.map(s => `<option value="${this.escapeHTML(s)}"></option>`).join('');

    const lists = [
      document.getElementById('stores-datalist'),
      document.getElementById('stores-datalist-item'),
      document.getElementById('stores-datalist-edit')
    ];

    lists.forEach(dl => {
      if (dl) dl.innerHTML = html;
    });
  }

  updateItemHistoryDatalist() {
    const historyMap = storage.getPriceHistoryMap();
    const keys = Object.keys(historyMap);

    // Coleta também nomes de todos os itens já existentes
    const lists = storage.getLists();
    const namesSet = new Set();
    lists.forEach(l => (l.items || []).forEach(i => namesSet.add(i.name)));
    keys.forEach(k => namesSet.add(k));

    this.historyDatalist.innerHTML = Array.from(namesSet)
      .slice(0, 50)
      .map(name => `<option value="${this.escapeHTML(name)}"></option>`)
      .join('');
  }

  // --- BACKUP & RESTAURAÇÃO (JSON) ---

  handleExportBackup() {
    const json = storage.exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shoplist-backup-${getTodayDateISO()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.showToast('Backup baixado com sucesso!');
  }

  handleImportBackup(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const result = storage.importData(content);
      if (result.success) {
        this.showToast(`Backup restaurado! ${result.count} listas carregadas.`);
        this.dialogBackup.close();
        this.populateStoreDatalists();
        this.renderScreen();
      } else {
        alert('Erro ao restaurar arquivo: ' + result.error);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  // --- PWA E STATUS OFFLINE ---

  initPWA() {
    this.updateNetworkStatus();

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then(() => {
            console.log('Service Worker registrado para funcionamento offline.');
          })
          .catch((err) => {
            console.warn('Registro de Service Worker falhou:', err);
          });
      });
    }
  }

  updateNetworkStatus() {
    if (!this.networkStatusText) return;
    if (navigator.onLine) {
      this.networkStatusText.textContent = 'Offline pronto';
    } else {
      this.networkStatusText.textContent = 'Modo Offline';
    }
  }

  // --- UTILITÁRIOS ---

  showToast(message, duration = 2500) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

// Inicializa a aplicação ao carregar o DOM
document.addEventListener('DOMContentLoaded', () => {
  window.app = new ShoplistApp();
});
