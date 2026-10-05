/**
 * Gerenciamento de Persistência Local (localStorage) e Histórico de Preços
 * Arquitetura limpa e princípio KISS
 */

const STORAGE_KEYS = {
  LISTS: 'shoplist_lists_v1',
  PRICE_HISTORY: 'shoplist_price_history_v1',
  STORES: 'shoplist_stores_v1',
  SETTINGS: 'shoplist_settings_v1'
};

// Lojas populares padrão no Brasil para sugestão rápida
export const DEFAULT_STORES = [
  'Assaí Atacadista',
  'Atacadão',
  'Carrefour',
  'Pão de Açúcar',
  'Extra',
  'Supermercado BH',
  'Prezunic',
  'Muffato',
  'Guanabara',
  'Mercado Local'
];

/**
 * Normaliza o nome do item para buscas e histórico consistente
 */
export function normalizeItemKey(name) {
  return (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Formata um valor numérico para a moeda brasileira Real (R$)
 */
export function formatCurrency(value) {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(num);
}

/**
 * Formata data no formato brasileiro (DD/MM/AAAA)
 */
export function formatDateBR(dateStringOrTimestamp) {
  if (!dateStringOrTimestamp) return '';
  const date = new Date(dateStringOrTimestamp);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

/**
 * Retorna a data de hoje no formato YYYY-MM-DD para inputs do tipo date
 */
export function getTodayDateISO() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export class ShoplistStorage {
  constructor() {
    this.init();
  }

  init() {
    try {
      if (!localStorage.getItem(STORAGE_KEYS.STORES)) {
        localStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(DEFAULT_STORES));
      }

      if (!localStorage.getItem(STORAGE_KEYS.LISTS)) {
        // Criar uma lista inicial de boas-vindas com a data de hoje
        const seedList = this.createSeedList();
        localStorage.setItem(STORAGE_KEYS.LISTS, JSON.stringify([seedList]));
        
        // Registrar histórico inicial para os itens da semente
        this.seedInitialPriceHistory();
      }
    } catch (e) {
      console.warn('Erro ao inicializar localStorage:', e);
    }
  }

  createSeedList() {
    const today = new Date();
    const todayFormatted = formatDateBR(today);
    return {
      id: 'list_' + Date.now(),
      title: `Compras - ${todayFormatted}`,
      store: 'Supermercado',
      date: getTodayDateISO(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      items: [
        {
          id: 'item_1',
          name: 'Arroz 5kg',
          emoji: '🍚',
          purchased: true,
          unitPrice: 26.90,
          quantity: 1,
          unit: 'un',
          totalPrice: 26.90,
          previousPrice: 24.50,
          store: 'Supermercado'
        },
        {
          id: 'item_2',
          name: 'Leite Integral 1L',
          emoji: '🥛',
          purchased: true,
          unitPrice: 4.89,
          quantity: 4,
          unit: 'un',
          totalPrice: 19.56,
          previousPrice: 5.29,
          store: 'Supermercado'
        },
        {
          id: 'item_3',
          name: 'Banana Prata',
          emoji: '🍌',
          purchased: false,
          unitPrice: 7.99,
          quantity: 1.5,
          unit: 'kg',
          totalPrice: 11.99,
          previousPrice: 6.99,
          store: 'Supermercado'
        },
        {
          id: 'item_4',
          name: 'Café Torrado 500g',
          emoji: '☕',
          purchased: false,
          unitPrice: 18.50,
          quantity: 1,
          unit: 'un',
          totalPrice: 18.50,
          previousPrice: 17.90,
          store: 'Supermercado'
        }
      ]
    };
  }

  seedInitialPriceHistory() {
    const initialHistory = {
      'arroz 5kg': [
        { price: 24.50, unitPrice: 24.50, quantity: 1, unit: 'un', store: 'Mercado Anterior', date: '2026-09-15' }
      ],
      'leite integral 1l': [
        { price: 21.16, unitPrice: 5.29, quantity: 4, unit: 'un', store: 'Mercado Anterior', date: '2026-09-20' }
      ],
      'banana prata': [
        { price: 6.99, unitPrice: 6.99, quantity: 1, unit: 'kg', store: 'Mercado Anterior', date: '2026-09-28' }
      ],
      'cafe torrado 500g': [
        { price: 17.90, unitPrice: 17.90, quantity: 1, unit: 'un', store: 'Mercado Anterior', date: '2026-09-10' }
      ]
    };
    try {
      localStorage.setItem(STORAGE_KEYS.PRICE_HISTORY, JSON.stringify(initialHistory));
    } catch (e) {
      console.warn('Erro ao salvar histórico de semente:', e);
    }
  }

  // --- MÉTODOS DE LISTAS ---

  getLists() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LISTS);
      const lists = data ? JSON.parse(data) : [];
      // Ordena por data decrescente (mais recente primeiro)
      return lists.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } catch (e) {
      console.error('Erro ao obter listas:', e);
      return [];
    }
  }

  getListById(id) {
    const lists = this.getLists();
    return lists.find(l => l.id === id) || null;
  }

  saveList(list) {
    const lists = this.getLists();
    const index = lists.findIndex(l => l.id === list.id);
    list.updatedAt = Date.now();

    if (index >= 0) {
      lists[index] = list;
    } else {
      lists.unshift(list);
    }

    try {
      localStorage.setItem(STORAGE_KEYS.LISTS, JSON.stringify(lists));
      return true;
    } catch (e) {
      console.error('Erro ao salvar lista:', e);
      return false;
    }
  }

  createBlankList(customTitle = null, storeName = '') {
    const today = new Date();
    const todayFormatted = formatDateBR(today);
    const title = customTitle && customTitle.trim() !== '' 
      ? customTitle.trim() 
      : `Compras - ${todayFormatted}`;

    const newList = {
      id: 'list_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      title: title,
      store: storeName.trim() || '',
      date: getTodayDateISO(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      items: []
    };

    this.saveList(newList);
    if (storeName.trim()) {
      this.addStoreIfNew(storeName.trim());
    }
    return newList;
  }

  deleteList(id) {
    let lists = this.getLists();
    lists = lists.filter(l => l.id !== id);
    try {
      localStorage.setItem(STORAGE_KEYS.LISTS, JSON.stringify(lists));
      return true;
    } catch (e) {
      console.error('Erro ao deletar lista:', e);
      return false;
    }
  }

  // --- HISTÓRICO DE PREÇOS ENTRE SUPERMERCADOS ---

  getPriceHistoryMap() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRICE_HISTORY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error('Erro ao ler histórico de preços:', e);
      return {};
    }
  }

  /**
   * Obtém o último preço registrado para um item (e opcionalmente loja)
   */
  getLatestPriceForItem(itemName, preferredStore = '') {
    const key = normalizeItemKey(itemName);
    if (!key) return null;

    const historyMap = this.getPriceHistoryMap();
    const records = historyMap[key];

    if (!records || !Array.isArray(records) || records.length === 0) {
      return null;
    }

    // Se uma loja preferida foi especificada, tenta encontrar primeiro nessa loja
    if (preferredStore) {
      const storeMatch = records.find(r => 
        (r.store || '').toLowerCase() === preferredStore.toLowerCase()
      );
      if (storeMatch) return storeMatch;
    }

    // Caso contrário, retorna o registro mais recente (último do array)
    return records[records.length - 1];
  }

  /**
   * Registra um novo preço no histórico para determinado item
   */
  recordPrice(itemName, { unitPrice, totalPrice, quantity, unit, store, date, listId }) {
    const key = normalizeItemKey(itemName);
    if (!key || unitPrice <= 0) return;

    const historyMap = this.getPriceHistoryMap();
    if (!historyMap[key]) {
      historyMap[key] = [];
    }

    const newRecord = {
      unitPrice: Number(unitPrice) || 0,
      totalPrice: Number(totalPrice) || 0,
      quantity: Number(quantity) || 1,
      unit: unit || 'un',
      store: store || '',
      date: date || getTodayDateISO(),
      listId: listId || '',
      recordedAt: Date.now()
    };

    historyMap[key].push(newRecord);

    // Manter no máximo 20 registros por item para economizar espaço
    if (historyMap[key].length > 20) {
      historyMap[key] = historyMap[key].slice(-20);
    }

    try {
      localStorage.setItem(STORAGE_KEYS.PRICE_HISTORY, JSON.stringify(historyMap));
      if (store) {
        this.addStoreIfNew(store);
      }
    } catch (e) {
      console.warn('Erro ao salvar histórico de preço:', e);
    }
  }

  // --- LOJAS E SUPERMERCADOS ---

  getStores() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STORES);
      return data ? JSON.parse(data) : DEFAULT_STORES;
    } catch (e) {
      return DEFAULT_STORES;
    }
  }

  addStoreIfNew(storeName) {
    const clean = storeName.trim();
    if (!clean) return;
    const stores = this.getStores();
    if (!stores.some(s => s.toLowerCase() === clean.toLowerCase())) {
      stores.push(clean);
      try {
        localStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(stores));
      } catch (e) {
        console.warn('Erro ao salvar loja:', e);
      }
    }
  }

  // --- EXPORTAÇÃO E IMPORTAÇÃO (BACKUP) ---

  exportData() {
    return JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      lists: this.getLists(),
      priceHistory: this.getPriceHistoryMap(),
      stores: this.getStores()
    }, null, 2);
  }

  importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data && Array.isArray(data.lists)) {
        localStorage.setItem(STORAGE_KEYS.LISTS, JSON.stringify(data.lists));
        if (data.priceHistory) {
          localStorage.setItem(STORAGE_KEYS.PRICE_HISTORY, JSON.stringify(data.priceHistory));
        }
        if (data.stores) {
          localStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(data.stores));
        }
        return { success: true, count: data.lists.length };
      }
      return { success: false, error: 'Formato de arquivo inválido.' };
    } catch (e) {
      return { success: false, error: 'JSON corrompido ou inválido.' };
    }
  }
}

export const storage = new ShoplistStorage();
