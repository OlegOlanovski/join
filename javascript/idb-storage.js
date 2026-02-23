(function () {
  // Simple IndexedDB wrapper for tasks and contacts with an in-memory cache.
  // Exposes: window.idbStorage.ready (Promise), getTasksSync(), saveTasks(tasks), getContactsSync(), saveContacts(list)

  /** @type {string} */
  const DB_NAME = "join_db_v1";
  /** @type {number} */
  const DB_VERSION = 1;
  /** @type {string} */
  const TASK_STORE = "tasks";
  /** @type {string} */
  const CONTACT_STORE = "contacts";

  /** @type {IDBDatabase|null} */
  let db = null;

  /** @type {{tasks: Task[], contacts: Contact[]}} */
  let cache = { tasks: [], contacts: [] };

  /**
   * @typedef {Object} Task
   * @property {string} id
   * @property {string} title
   * @property {string} [description]
   * @property {boolean} [completed]
   */

  /**
   * @typedef {Object} Contact
   * @property {string} id
   * @property {string} name
   * @property {string} email
   * @property {string} phone
   */

  /**
   * Opens the IndexedDB database and creates object stores if needed.
   * @returns {Promise<IDBDatabase>}
   */
  function openDb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = function (e) {
        const d = e.target.result;
        if (!d.objectStoreNames.contains(TASK_STORE)) {
          d.createObjectStore(TASK_STORE, { keyPath: "id" });
        }
        if (!d.objectStoreNames.contains(CONTACT_STORE)) {
          d.createObjectStore(CONTACT_STORE, { keyPath: "id" });
        }
      };

      req.onsuccess = function () {
        db = req.result;
        resolve(db);
      };

      req.onerror = function (e) {
        reject(e);
      };
    });
  }

  /**
   * Reads all items from the given store.
   * @param {string} storeName
   * @returns {Promise<Array<any>>}
   */
  function readAll(storeName) {
    return new Promise((resolve, reject) => {
      if (!db) return resolve([]);
      const tx = db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const req = store.getAll();

      req.onsuccess = function () {
        resolve(req.result || []);
      };

      req.onerror = function (e) {
        reject(e);
      };
    });
  }

  /**
   * Clears all items from a store.
   * @param {string} storeName
   * @returns {Promise<void>}
   */
  function clearStore(storeName) {
    return new Promise((resolve, reject) => {
      if (!db) return resolve();
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const req = store.clear();

      req.onsuccess = function () {
        resolve();
      };

      req.onerror = function (e) {
        reject(e);
      };
    });
  }

  /**
   * Puts multiple items into a store.
   * @param {string} storeName
   * @param {Array<any>} items
   * @returns {Promise<void>}
   */
  function putMany(storeName, items) {
    return new Promise((resolve, reject) => {
      if (!db) return resolve();
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      let pending = items.length;
      if (!pending) return resolve();

      for (let i = 0; i < items.length; i++) {
        const r = store.put(items[i]);
        r.onsuccess = function () {
          pending--;
          if (!pending) resolve();
        };
        r.onerror = function (e) {
          reject(e);
        };
      }
    });
  }

  /**
   * Initializes the database and loads cached tasks and contacts.
   * @returns {Promise<void>}
   */
  async function init() {
    try {
      await openDb();
      cache.tasks = await readAll(TASK_STORE);
      cache.contacts = await readAll(CONTACT_STORE);
    } catch (e) {
      console.error("idb-storage init error:", e);
      cache = { tasks: [], contacts: [] };
    }
  }

  /** @type {Promise<void>} */
  const ready = init();

  /**
   * Returns a copy of tasks from the in-memory cache.
   * @returns {Task[]}
   */
  function getTasksSync() {
    return Array.isArray(cache.tasks) ? cache.tasks.slice() : [];
  }

  /**
   * Returns a copy of contacts from the in-memory cache.
   * @returns {Contact[]}
   */
  function getContactsSync() {
    return Array.isArray(cache.contacts) ? cache.contacts.slice() : [];
  }

  /**
   * Saves tasks to IndexedDB and updates the in-memory cache.
   * @param {Task[]} tasks
   * @returns {Promise<void>}
   */
  async function saveTasks(tasks) {
    await ready;
    try {
      await clearStore(TASK_STORE);
      if (Array.isArray(tasks) && tasks.length)
        await putMany(TASK_STORE, tasks);
      cache.tasks = Array.isArray(tasks) ? tasks.slice() : [];
    } catch (e) {
      console.error("saveTasks error:", e);
      throw e;
    }
  }

  /**
   * Saves contacts to IndexedDB and updates the in-memory cache.
   * @param {Contact[]} list
   * @returns {Promise<void>}
   */
  async function saveContacts(list) {
    await ready;
    try {
      await clearStore(CONTACT_STORE);
      if (Array.isArray(list) && list.length)
        await putMany(CONTACT_STORE, list);
      cache.contacts = Array.isArray(list) ? list.slice() : [];
    } catch (e) {
      console.error("saveContacts error:", e);
      throw e;
    }
  }

  /**
   * Public API exposed on window.idbStorage
   */
  window.idbStorage = {
    /** @type {Promise<void>} */
    ready: ready,
    /** @returns {Task[]} */
    getTasksSync: getTasksSync,
    /** @param {Task[]} tasks */
    saveTasks: saveTasks,
    /** @returns {Contact[]} */
    getContactsSync: getContactsSync,
    /** @param {Contact[]} list */
    saveContacts: saveContacts,
    /** @returns {Promise<Task[]>} */
    loadTasks: async function () {
      await ready;
      return getTasksSync();
    },
    /** @returns {Promise<Contact[]>} */
    loadContacts: async function () {
      await ready;
      return getContactsSync();
    },
  };
})();
