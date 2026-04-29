var CW_MODULE = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/services/database.js
  var database_exports = {};
  __export(database_exports, {
    default: () => database_default
  });
  var DB_NAME, DB_VERSION, ClaimwiseDB, db, database_default;
  var init_database = __esm({
    "src/services/database.js"() {
      DB_NAME = "ClaimwiseOmniscience";
      DB_VERSION = 22;
      ClaimwiseDB = class {
        constructor() {
          this.db = null;
          this.cache = /* @__PURE__ */ new Map();
          this.cacheTTL = 5 * 60 * 1e3;
        }
        /**
         * Initialize the database
         */
        async init() {
          if (this.db) {
            return this.db;
          }
          return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onerror = () => {
              console.error("Database open error:", request.error);
              reject(request.error);
            };
            request.onsuccess = () => {
              this.db = request.result;
              this.db.onerror = (event) => {
                console.error("Database error:", event.target.error);
              };
              resolve(this.db);
            };
            request.onupgradeneeded = (event) => {
              const db2 = event.target.result;
              const oldVersion = event.oldVersion;
              if (oldVersion < 1) {
                if (!db2.objectStoreNames.contains("meta")) {
                  db2.createObjectStore("meta", { keyPath: "id" });
                }
                if (!db2.objectStoreNames.contains("statRegistry")) {
                  db2.createObjectStore("statRegistry", { keyPath: "id" });
                }
                if (!db2.objectStoreNames.contains("skillBank")) {
                  const skillStore = db2.createObjectStore("skillBank", { keyPath: "id" });
                  skillStore.createIndex("type", "type", { unique: false });
                  skillStore.createIndex("name", "name", { unique: false });
                  skillStore.createIndex("tier", "tier", { unique: false });
                  skillStore.createIndex("createdAt", "createdAt", { unique: false });
                }
                if (!db2.objectStoreNames.contains("itemBank")) {
                  const itemStore = db2.createObjectStore("itemBank", { keyPath: "id" });
                  itemStore.createIndex("type", "type", { unique: false });
                  itemStore.createIndex("name", "name", { unique: false });
                  itemStore.createIndex("rarity", "rarity", { unique: false });
                  itemStore.createIndex("createdAt", "createdAt", { unique: false });
                }
                if (!db2.objectStoreNames.contains("actors")) {
                  const actorStore = db2.createObjectStore("actors", { keyPath: "id" });
                  actorStore.createIndex("class", "class", { unique: false });
                  actorStore.createIndex("isFav", "isFav", { unique: false });
                  actorStore.createIndex("name", "name", { unique: false });
                  actorStore.createIndex("createdAt", "createdAt", { unique: false });
                }
                if (!db2.objectStoreNames.contains("books")) {
                  db2.createObjectStore("books", { keyPath: "id" });
                }
                if (!db2.objectStoreNames.contains("relationships")) {
                  const relStore = db2.createObjectStore("relationships", { keyPath: "id" });
                  relStore.createIndex("actors", "actors", { unique: false, multiEntry: true });
                }
                if (!db2.objectStoreNames.contains("wiki")) {
                  const wikiStore = db2.createObjectStore("wiki", { keyPath: "id" });
                  wikiStore.createIndex("type", "type", { unique: false });
                  wikiStore.createIndex("linkedTo", "linkedTo", { unique: false });
                }
                if (!db2.objectStoreNames.contains("skillTrees")) {
                  db2.createObjectStore("skillTrees", { keyPath: "id" });
                }
              }
              if (oldVersion < 4) {
                if (!db2.objectStoreNames.contains("plotThreads")) {
                  const plotThreadStore = db2.createObjectStore("plotThreads", { keyPath: "id" });
                  plotThreadStore.createIndex("status", "status", { unique: false });
                  plotThreadStore.createIndex("completion", "completion", { unique: false });
                }
                if (!db2.objectStoreNames.contains("characterArcs")) {
                  const charArcStore = db2.createObjectStore("characterArcs", { keyPath: "characterId" });
                  charArcStore.createIndex("characterName", "characterName", { unique: false });
                }
                if (!db2.objectStoreNames.contains("consistencyIssues")) {
                  const issueStore = db2.createObjectStore("consistencyIssues", { keyPath: "id" });
                  issueStore.createIndex("type", "type", { unique: false });
                  issueStore.createIndex("severity", "severity", { unique: false });
                  issueStore.createIndex("status", "status", { unique: false });
                }
                if (!db2.objectStoreNames.contains("resolvedIssues")) {
                  db2.createObjectStore("resolvedIssues", { keyPath: "id" });
                }
              }
              if (oldVersion < 5) {
                if (!db2.objectStoreNames.contains("documents")) {
                  const docStore = db2.createObjectStore("documents", { keyPath: "id" });
                  docStore.createIndex("uploadedAt", "uploadedAt", { unique: false });
                  docStore.createIndex("fileType", "fileType", { unique: false });
                }
                if (!db2.objectStoreNames.contains("documentSuggestions")) {
                  const suggStore = db2.createObjectStore("documentSuggestions", { keyPath: "id" });
                  suggStore.createIndex("documentId", "documentId", { unique: false });
                  suggStore.createIndex("type", "type", { unique: false });
                  suggStore.createIndex("status", "status", { unique: false });
                }
              }
              if (oldVersion < 6) {
                if (!db2.objectStoreNames.contains("wikiEntries")) {
                  const wikiStore = db2.createObjectStore("wikiEntries", { keyPath: "id" });
                  wikiStore.createIndex("entityId", "entityId", { unique: false });
                  wikiStore.createIndex("entityType", "entityType", { unique: false });
                  wikiStore.createIndex("updatedAt", "updatedAt", { unique: false });
                }
                if (!db2.objectStoreNames.contains("processingHistory")) {
                  const historyStore = db2.createObjectStore("processingHistory", { keyPath: "id" });
                  historyStore.createIndex("processedAt", "processedAt", { unique: false });
                  historyStore.createIndex("documentId", "documentId", { unique: false });
                }
                if (!db2.objectStoreNames.contains("buzzWords")) {
                  const buzzStore = db2.createObjectStore("buzzWords", { keyPath: "id" });
                  buzzStore.createIndex("tag", "tag", { unique: true });
                  buzzStore.createIndex("type", "type", { unique: false });
                }
                if (!db2.objectStoreNames.contains("manuscriptSuggestions")) {
                  const suggStore = db2.createObjectStore("manuscriptSuggestions", { keyPath: "id" });
                  suggStore.createIndex("documentId", "documentId", { unique: false });
                  suggStore.createIndex("type", "type", { unique: false });
                  suggStore.createIndex("status", "status", { unique: false });
                  suggStore.createIndex("confidence", "confidence", { unique: false });
                }
              }
              if (oldVersion < 8) {
                if (!db2.objectStoreNames.contains("images")) {
                  const imageStore = db2.createObjectStore("images", { keyPath: "id" });
                  imageStore.createIndex("path", "path", { unique: false });
                  imageStore.createIndex("createdAt", "createdAt", { unique: false });
                }
              }
              if (oldVersion < 9) {
                if (!db2.objectStoreNames.contains("storyContextDocuments")) {
                  const contextStore = db2.createObjectStore("storyContextDocuments", { keyPath: "id" });
                  contextStore.createIndex("title", "title", { unique: false });
                  contextStore.createIndex("category", "category", { unique: false });
                  contextStore.createIndex("createdAt", "createdAt", { unique: false });
                  contextStore.createIndex("enabled", "enabled", { unique: false });
                }
              }
              if (oldVersion < 10) {
                if (!db2.objectStoreNames.contains("extractionHistory")) {
                  const historyStore = db2.createObjectStore("extractionHistory", { keyPath: "id" });
                  historyStore.createIndex("extractionId", "extractionId", { unique: false });
                  historyStore.createIndex("timestamp", "timestamp", { unique: false });
                  historyStore.createIndex("chapterId", "chapterId", { unique: false });
                  historyStore.createIndex("entityType", "entityType", { unique: false });
                  historyStore.createIndex("entityId", "entityId", { unique: false });
                  historyStore.createIndex("reverted", "reverted", { unique: false });
                }
                if (!db2.objectStoreNames.contains("extractionSessions")) {
                  const sessionStore = db2.createObjectStore("extractionSessions", { keyPath: "id" });
                  sessionStore.createIndex("timestamp", "timestamp", { unique: false });
                  sessionStore.createIndex("chapterId", "chapterId", { unique: false });
                  sessionStore.createIndex("sourceType", "sourceType", { unique: false });
                }
              }
              if (oldVersion < 11) {
                if (!db2.objectStoreNames.contains("timelineEvents")) {
                  const timelineStore = db2.createObjectStore("timelineEvents", { keyPath: "id" });
                  timelineStore.createIndex("type", "type", { unique: false });
                  timelineStore.createIndex("bookId", "bookId", { unique: false });
                  timelineStore.createIndex("chapterId", "chapterId", { unique: false });
                  timelineStore.createIndex("timestamp", "timestamp", { unique: false });
                  timelineStore.createIndex("entityType", "entityType", { unique: false });
                }
                if (!db2.objectStoreNames.contains("locations")) {
                  const locationStore = db2.createObjectStore("locations", { keyPath: "id" });
                  locationStore.createIndex("name", "name", { unique: false });
                  locationStore.createIndex("type", "type", { unique: false });
                  locationStore.createIndex("createdAt", "createdAt", { unique: false });
                }
                if (!db2.objectStoreNames.contains("characterTravel")) {
                  const travelStore = db2.createObjectStore("characterTravel", { keyPath: "id" });
                  travelStore.createIndex("actorId", "actorId", { unique: false });
                  travelStore.createIndex("actorName", "actorName", { unique: false });
                  travelStore.createIndex("chapterId", "chapterId", { unique: false });
                  travelStore.createIndex("timestamp", "timestamp", { unique: false });
                }
                if (!db2.objectStoreNames.contains("mindMapNodes")) {
                  const nodesStore = db2.createObjectStore("mindMapNodes", { keyPath: "id" });
                  nodesStore.createIndex("entityId", "entityId", { unique: false });
                  nodesStore.createIndex("entityType", "entityType", { unique: false });
                  nodesStore.createIndex("type", "type", { unique: false });
                  nodesStore.createIndex("group", "group", { unique: false });
                }
                if (!db2.objectStoreNames.contains("mindMapEdges")) {
                  const edgesStore = db2.createObjectStore("mindMapEdges", { keyPath: "id" });
                  edgesStore.createIndex("source", "source", { unique: false });
                  edgesStore.createIndex("target", "target", { unique: false });
                  edgesStore.createIndex("type", "type", { unique: false });
                  edgesStore.createIndex("chapterId", "chapterId", { unique: false });
                }
              }
              if (oldVersion < 12) {
                if (!db2.objectStoreNames.contains("storyProfile")) {
                  const profileStore = db2.createObjectStore("storyProfile", { keyPath: "id" });
                  profileStore.createIndex("updatedAt", "updatedAt", { unique: false });
                }
                if (!db2.objectStoreNames.contains("characterVoices")) {
                  const voiceStore = db2.createObjectStore("characterVoices", { keyPath: "id" });
                  voiceStore.createIndex("actorId", "actorId", { unique: true });
                  voiceStore.createIndex("updatedAt", "updatedAt", { unique: false });
                }
                if (!db2.objectStoreNames.contains("plotBeats")) {
                  const beatStore = db2.createObjectStore("plotBeats", { keyPath: "id" });
                  beatStore.createIndex("chapter", "chapter", { unique: false });
                  beatStore.createIndex("completed", "completed", { unique: false });
                  beatStore.createIndex("order", "order", { unique: false });
                }
                if (!db2.objectStoreNames.contains("chapterOverviews")) {
                  const overviewStore = db2.createObjectStore("chapterOverviews", { keyPath: "id" });
                  overviewStore.createIndex("bookId", "bookId", { unique: false });
                  overviewStore.createIndex("chapterNumber", "chapterNumber", { unique: false });
                  overviewStore.createIndex("approvedAt", "approvedAt", { unique: false });
                }
                if (!db2.objectStoreNames.contains("styleEvolution")) {
                  const evolutionStore = db2.createObjectStore("styleEvolution", { keyPath: "id" });
                  evolutionStore.createIndex("reviewedAtChapter", "reviewedAtChapter", { unique: false });
                  evolutionStore.createIndex("approvedAt", "approvedAt", { unique: false });
                }
                if (!db2.objectStoreNames.contains("entityChapterStates")) {
                  const stateStore = db2.createObjectStore("entityChapterStates", { keyPath: "id" });
                  stateStore.createIndex("entityId", "entityId", { unique: false });
                  stateStore.createIndex("entityType", "entityType", { unique: false });
                  stateStore.createIndex("bookId", "bookId", { unique: false });
                  stateStore.createIndex("chapterNumber", "chapterNumber", { unique: false });
                }
                if (!db2.objectStoreNames.contains("onboardingProgress")) {
                  const progressStore = db2.createObjectStore("onboardingProgress", { keyPath: "id" });
                  progressStore.createIndex("completedAt", "completedAt", { unique: false });
                }
              }
              if (oldVersion < 14) {
                if (!db2.objectStoreNames.contains("styleReferences")) {
                  const styleStore = db2.createObjectStore("styleReferences", { keyPath: "id" });
                  styleStore.createIndex("scope", "scope", { unique: false });
                  styleStore.createIndex("projectId", "projectId", { unique: false });
                  styleStore.createIndex("type", "type", { unique: false });
                  styleStore.createIndex("updatedAt", "updatedAt", { unique: false });
                }
                if (!db2.objectStoreNames.contains("stylePatterns")) {
                  const patternStore = db2.createObjectStore("stylePatterns", { keyPath: "id" });
                  patternStore.createIndex("styleId", "styleId", { unique: false });
                  patternStore.createIndex("extractedAt", "extractedAt", { unique: false });
                }
                if (!db2.objectStoreNames.contains("styleVersions")) {
                  const versionStore = db2.createObjectStore("styleVersions", { keyPath: "id" });
                  versionStore.createIndex("styleId", "styleId", { unique: false });
                  versionStore.createIndex("createdAt", "createdAt", { unique: false });
                }
              }
              if (oldVersion < 15) {
                if (!db2.objectStoreNames.contains("styleTestResults")) {
                  const testStore = db2.createObjectStore("styleTestResults", { keyPath: "id" });
                  testStore.createIndex("moodPreset", "moodPreset", { unique: false });
                  testStore.createIndex("rating", "rating", { unique: false });
                  testStore.createIndex("createdAt", "createdAt", { unique: false });
                }
                if (!db2.objectStoreNames.contains("characterTimelines")) {
                  const timelineStore = db2.createObjectStore("characterTimelines", { keyPath: "id" });
                  timelineStore.createIndex("actorId", "actorId", { unique: false });
                  timelineStore.createIndex("chapterId", "chapterId", { unique: false });
                  timelineStore.createIndex("timestamp", "timestamp", { unique: false });
                  timelineStore.createIndex("eventType", "eventType", { unique: false });
                }
                if (!db2.objectStoreNames.contains("sceneContexts")) {
                  const sceneStore = db2.createObjectStore("sceneContexts", { keyPath: "id" });
                  sceneStore.createIndex("chapterId", "chapterId", { unique: false });
                  sceneStore.createIndex("bookId", "bookId", { unique: false });
                  sceneStore.createIndex("position", "position", { unique: false });
                  sceneStore.createIndex("updatedAt", "updatedAt", { unique: false });
                }
                if (!db2.objectStoreNames.contains("negativeExamples")) {
                  const negativeStore = db2.createObjectStore("negativeExamples", { keyPath: "id" });
                  negativeStore.createIndex("tags", "tags", { unique: false, multiEntry: true });
                  negativeStore.createIndex("createdAt", "createdAt", { unique: false });
                  negativeStore.createIndex("moodPreset", "moodPreset", { unique: false });
                }
                if (!db2.objectStoreNames.contains("styleInstructions")) {
                  const instructionStore = db2.createObjectStore("styleInstructions", { keyPath: "id" });
                  instructionStore.createIndex("category", "category", { unique: false });
                  instructionStore.createIndex("priority", "priority", { unique: false });
                  instructionStore.createIndex("enabled", "enabled", { unique: false });
                }
              }
              if (oldVersion < 16) {
                if (!db2.objectStoreNames.contains("voicePreferences")) {
                  const voiceStore = db2.createObjectStore("voicePreferences", { keyPath: "id" });
                  voiceStore.createIndex("characterId", "characterId", { unique: false });
                  voiceStore.createIndex("projectId", "projectId", { unique: false });
                  voiceStore.createIndex("provider", "provider", { unique: false });
                  voiceStore.createIndex("updatedAt", "updatedAt", { unique: false });
                }
              }
              if (oldVersion < 17) {
                if (!db2.objectStoreNames.contains("chapterTemplates")) {
                  const templateStore = db2.createObjectStore("chapterTemplates", { keyPath: "id" });
                  templateStore.createIndex("bookId", "bookId", { unique: false });
                  templateStore.createIndex("createdAt", "createdAt", { unique: false });
                }
              }
              if (oldVersion < 18) {
                if (!db2.objectStoreNames.contains("mindMapState")) {
                  const mindMapStore = db2.createObjectStore("mindMapState", { keyPath: "id" });
                  mindMapStore.createIndex("lastGenerated", "lastGenerated", { unique: false });
                  mindMapStore.createIndex("layoutMode", "layoutMode", { unique: false });
                }
                if (!db2.objectStoreNames.contains("skillTreeLayouts")) {
                  const skillTreeStore = db2.createObjectStore("skillTreeLayouts", { keyPath: "id" });
                  skillTreeStore.createIndex("actorId", "actorId", { unique: true });
                  skillTreeStore.createIndex("updatedAt", "updatedAt", { unique: false });
                }
              }
              if (oldVersion < 19) {
                if (!db2.objectStoreNames.contains("aiSuggestions")) {
                  const suggestionStore = db2.createObjectStore("aiSuggestions", { keyPath: "id" });
                  suggestionStore.createIndex("type", "type", { unique: false });
                  suggestionStore.createIndex("priority", "priority", { unique: false });
                  suggestionStore.createIndex("chapterId", "chapterId", { unique: false });
                  suggestionStore.createIndex("bookId", "bookId", { unique: false });
                  suggestionStore.createIndex("status", "status", { unique: false });
                  suggestionStore.createIndex("createdAt", "createdAt", { unique: false });
                }
                if (!db2.objectStoreNames.contains("suggestionFeedback")) {
                  const feedbackStore = db2.createObjectStore("suggestionFeedback", { keyPath: "id" });
                  feedbackStore.createIndex("suggestionId", "suggestionId", { unique: false });
                  feedbackStore.createIndex("rating", "rating", { unique: false });
                  feedbackStore.createIndex("createdAt", "createdAt", { unique: false });
                }
                if (!db2.objectStoreNames.contains("wizardState")) {
                  const wizardStore = db2.createObjectStore("wizardState", { keyPath: "id" });
                  wizardStore.createIndex("sessionId", "sessionId", { unique: false });
                  wizardStore.createIndex("timestamp", "timestamp", { unique: false });
                  wizardStore.createIndex("status", "status", { unique: false });
                }
                if (!db2.objectStoreNames.contains("storylines")) {
                  const storylineStore = db2.createObjectStore("storylines", { keyPath: "id" });
                  storylineStore.createIndex("status", "status", { unique: false });
                  storylineStore.createIndex("chapterId", "chapterId", { unique: false });
                  storylineStore.createIndex("bookId", "bookId", { unique: false });
                  storylineStore.createIndex("createdAt", "createdAt", { unique: false });
                }
                if (!db2.objectStoreNames.contains("decisions")) {
                  const decisionStore = db2.createObjectStore("decisions", { keyPath: "id" });
                  decisionStore.createIndex("chapterId", "chapterId", { unique: false });
                  decisionStore.createIndex("bookId", "bookId", { unique: false });
                  decisionStore.createIndex("importance", "importance", { unique: false });
                  decisionStore.createIndex("resolved", "resolved", { unique: false });
                  decisionStore.createIndex("createdAt", "createdAt", { unique: false });
                }
                if (!db2.objectStoreNames.contains("callbacks")) {
                  const callbackStore = db2.createObjectStore("callbacks", { keyPath: "id" });
                  callbackStore.createIndex("chapterId", "chapterId", { unique: false });
                  callbackStore.createIndex("bookId", "bookId", { unique: false });
                  callbackStore.createIndex("targetChapter", "targetChapter", { unique: false });
                  callbackStore.createIndex("used", "used", { unique: false });
                  callbackStore.createIndex("importance", "importance", { unique: false });
                  callbackStore.createIndex("createdAt", "createdAt", { unique: false });
                }
                if (!db2.objectStoreNames.contains("memories")) {
                  const memoryStore = db2.createObjectStore("memories", { keyPath: "id" });
                  memoryStore.createIndex("chapterId", "chapterId", { unique: false });
                  memoryStore.createIndex("bookId", "bookId", { unique: false });
                  memoryStore.createIndex("importance", "importance", { unique: false });
                  memoryStore.createIndex("referenced", "referenced", { unique: false });
                  memoryStore.createIndex("createdAt", "createdAt", { unique: false });
                }
              }
              if (oldVersion < 21) {
                if (!db2.objectStoreNames.contains("canonSessions")) {
                  const sessionStore = db2.createObjectStore("canonSessions", { keyPath: "id" });
                  sessionStore.createIndex("chapterId", "chapterId", { unique: false });
                  sessionStore.createIndex("chapterNumber", "chapterNumber", { unique: false });
                  sessionStore.createIndex("status", "status", { unique: false });
                  sessionStore.createIndex("createdAt", "createdAt", { unique: false });
                  sessionStore.createIndex("committedAt", "committedAt", { unique: false });
                }
                if (!db2.objectStoreNames.contains("narrativeReviewQueue")) {
                  const queueStore = db2.createObjectStore("narrativeReviewQueue", { keyPath: "id" });
                  queueStore.createIndex("sessionId", "sessionId", { unique: false });
                  queueStore.createIndex("chapterId", "chapterId", { unique: false });
                  queueStore.createIndex("chapterNumber", "chapterNumber", { unique: false });
                  queueStore.createIndex("domain", "domain", { unique: false });
                  queueStore.createIndex("status", "status", { unique: false });
                  queueStore.createIndex("blocking", "blocking", { unique: false });
                  queueStore.createIndex("confidenceBand", "confidenceBand", { unique: false });
                  queueStore.createIndex("createdAt", "createdAt", { unique: false });
                }
                if (!db2.objectStoreNames.contains("queueAudit")) {
                  const auditStore = db2.createObjectStore("queueAudit", { keyPath: "id" });
                  auditStore.createIndex("queueItemId", "queueItemId", { unique: false });
                  auditStore.createIndex("sessionId", "sessionId", { unique: false });
                  auditStore.createIndex("action", "action", { unique: false });
                  auditStore.createIndex("createdAt", "createdAt", { unique: false });
                }
                if (!db2.objectStoreNames.contains("chapterVersions")) {
                  const versionStore = db2.createObjectStore("chapterVersions", { keyPath: "id" });
                  versionStore.createIndex("chapterId", "chapterId", { unique: false });
                  versionStore.createIndex("chapterNumber", "chapterNumber", { unique: false });
                  versionStore.createIndex("versionNumber", "versionNumber", { unique: false });
                  versionStore.createIndex("createdAt", "createdAt", { unique: false });
                }
                if (!db2.objectStoreNames.contains("chapterChangelog")) {
                  const changelogStore = db2.createObjectStore("chapterChangelog", { keyPath: "id" });
                  changelogStore.createIndex("chapterId", "chapterId", { unique: false });
                  changelogStore.createIndex("fromVersion", "fromVersion", { unique: false });
                  changelogStore.createIndex("toVersion", "toVersion", { unique: false });
                  changelogStore.createIndex("createdAt", "createdAt", { unique: false });
                }
                if (!db2.objectStoreNames.contains("retroImpacts")) {
                  const retroStore = db2.createObjectStore("retroImpacts", { keyPath: "id" });
                  retroStore.createIndex("originChapterId", "originChapterId", { unique: false });
                  retroStore.createIndex("impactedChapterId", "impactedChapterId", { unique: false });
                  retroStore.createIndex("severity", "severity", { unique: false });
                  retroStore.createIndex("status", "status", { unique: false });
                  retroStore.createIndex("blocking", "blocking", { unique: false });
                  retroStore.createIndex("createdAt", "createdAt", { unique: false });
                }
                if (!db2.objectStoreNames.contains("plotQuests")) {
                  const questStore = db2.createObjectStore("plotQuests", { keyPath: "id" });
                  questStore.createIndex("plotThreadId", "plotThreadId", { unique: false });
                  questStore.createIndex("type", "type", { unique: false });
                  questStore.createIndex("status", "status", { unique: false });
                  questStore.createIndex("chapterId", "chapterId", { unique: false });
                  questStore.createIndex("createdAt", "createdAt", { unique: false });
                }
                if (!db2.objectStoreNames.contains("factions")) {
                  const factionStore = db2.createObjectStore("factions", { keyPath: "id" });
                  factionStore.createIndex("name", "name", { unique: false });
                  factionStore.createIndex("type", "type", { unique: false });
                  factionStore.createIndex("status", "status", { unique: false });
                  factionStore.createIndex("chapterId", "chapterId", { unique: false });
                  factionStore.createIndex("createdAt", "createdAt", { unique: false });
                }
                if (!db2.objectStoreNames.contains("extractionFailures")) {
                  const failureStore = db2.createObjectStore("extractionFailures", { keyPath: "id" });
                  failureStore.createIndex("sessionId", "sessionId", { unique: false });
                  failureStore.createIndex("chapterId", "chapterId", { unique: false });
                  failureStore.createIndex("domain", "domain", { unique: false });
                  failureStore.createIndex("createdAt", "createdAt", { unique: false });
                }
                if (!db2.objectStoreNames.contains("canonSettings")) {
                  db2.createObjectStore("canonSettings", { keyPath: "id" });
                }
              }
              if (oldVersion < 17 && oldVersion >= 16) {
                if (!db2.objectStoreNames.contains("chapterTemplates")) {
                  const templateStore = db2.createObjectStore("chapterTemplates", { keyPath: "id" });
                  templateStore.createIndex("name", "name", { unique: false });
                  templateStore.createIndex("createdAt", "createdAt", { unique: false });
                  templateStore.createIndex("isCustom", "isCustom", { unique: false });
                }
              }
              if (oldVersion < 20) {
                if (!db2.objectStoreNames.contains("backups")) {
                  const backupStore = db2.createObjectStore("backups", { keyPath: "id" });
                  backupStore.createIndex("timestamp", "timestamp", { unique: false });
                }
                if (!db2.objectStoreNames.contains("snapshots")) {
                  const snapshotStore = db2.createObjectStore("snapshots", { keyPath: "id" });
                  snapshotStore.createIndex("actorId", "actorId", { unique: false });
                  snapshotStore.createIndex("bookId", "bookId", { unique: false });
                  snapshotStore.createIndex("chapterId", "chapterId", { unique: false });
                  snapshotStore.createIndex("timestamp", "timestamp", { unique: false });
                }
              }
              if (oldVersion < 22) {
                if (!db2.objectStoreNames.contains("chapterMemories")) {
                  const memoryStore = db2.createObjectStore("chapterMemories", { keyPath: "id" });
                  memoryStore.createIndex("bookId", "bookId", { unique: false });
                  memoryStore.createIndex("chapterNumber", "chapterNumber", { unique: false });
                  memoryStore.createIndex("generatedAt", "generatedAt", { unique: false });
                }
              }
            };
          });
        }
        /**
         * Ensure database is initialized
         */
        async ensureInitialized() {
          if (this.db) {
            try {
              if (this.db.objectStoreNames) {
                return;
              }
            } catch (e) {
              this.db = null;
            }
          }
          try {
            await this.init();
            if (!this.db) {
              throw new Error("Database initialization failed - db is null after init");
            }
          } catch (error) {
            console.error("Database initialization error:", error);
            throw new Error(`Database initialization failed: ${error.message}`);
          }
        }
        /**
         * Clear expired cache entries
         */
        _cleanCache() {
          const now = Date.now();
          for (const [key, value] of this.cache.entries()) {
            if (now > value.expires) {
              this.cache.delete(key);
            }
          }
        }
        /**
         * Get cached result if available and not expired
         */
        _getCached(key) {
          this._cleanCache();
          const cached = this.cache.get(key);
          if (cached && Date.now() < cached.expires) {
            return cached.data;
          }
          if (cached) {
            this.cache.delete(key);
          }
          return null;
        }
        /**
         * Set cache entry with TTL
         */
        _setCache(key, data, ttl = null) {
          const expires = Date.now() + (ttl || this.cacheTTL);
          this.cache.set(key, { data, expires });
        }
        /**
         * Clear all cache or specific key
         */
        clearCache(key = null) {
          if (key) {
            this.cache.delete(key);
          } else {
            this.cache.clear();
          }
        }
        /**
         * Generic CRUD operations
         */
        async add(storeName, data) {
          await this.ensureInitialized();
          this._invalidateStoreCache(storeName);
          const transaction = this.db.transaction([storeName], "readwrite");
          const store = transaction.objectStore(storeName);
          return new Promise((resolve, reject) => {
            const request = store.add(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });
        }
        /**
         * Invalidate cache for a specific store
         */
        _invalidateStoreCache(storeName) {
          for (const [key] of this.cache.entries()) {
            if (key.startsWith(`${storeName}:`)) {
              this.cache.delete(key);
            }
          }
        }
        async get(storeName, key, useCache = true) {
          await this.ensureInitialized();
          if (useCache) {
            const cacheKey = `${storeName}:get:${key}`;
            const cached = this._getCached(cacheKey);
            if (cached !== null) {
              return cached;
            }
          }
          const transaction = this.db.transaction([storeName], "readonly");
          const store = transaction.objectStore(storeName);
          return new Promise((resolve, reject) => {
            const request = store.get(key);
            request.onsuccess = () => {
              const result = request.result;
              if (useCache) {
                this._setCache(`${storeName}:get:${key}`, result);
              }
              resolve(result);
            };
            request.onerror = () => reject(request.error);
          });
        }
        async getAll(storeName, useCache = true) {
          await this.ensureInitialized();
          if (useCache) {
            const cacheKey = `${storeName}:getAll`;
            const cached = this._getCached(cacheKey);
            if (cached !== null) {
              return cached;
            }
          }
          const transaction = this.db.transaction([storeName], "readonly");
          const store = transaction.objectStore(storeName);
          return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => {
              const result = request.result;
              if (useCache) {
                this._setCache(`${storeName}:getAll`, result);
              }
              resolve(result);
            };
            request.onerror = () => reject(request.error);
          });
        }
        /**
         * Get paginated results from a store
         * @param {string} storeName - Name of the object store
         * @param {number} page - Page number (1-indexed)
         * @param {number} pageSize - Number of items per page
         * @param {string} indexName - Optional index to sort by
         * @param {string} direction - 'next' or 'prev' for cursor direction
         * @returns {Promise<{items: Array, total: number, page: number, pageSize: number, hasMore: boolean}>}
         */
        async getPaginated(storeName, page = 1, pageSize = 50, indexName = null, direction = "next") {
          await this.ensureInitialized();
          const cacheKey = `${storeName}:paginated:${page}:${pageSize}:${indexName || "none"}:${direction}`;
          const cached = this._getCached(cacheKey);
          if (cached !== null) {
            return cached;
          }
          const transaction = this.db.transaction([storeName], "readonly");
          const store = transaction.objectStore(storeName);
          const countRequest = store.count();
          const total = await new Promise((resolve, reject) => {
            countRequest.onsuccess = () => resolve(countRequest.result);
            countRequest.onerror = () => reject(countRequest.error);
          });
          const offset = (page - 1) * pageSize;
          return new Promise((resolve, reject) => {
            let items = [];
            let itemsProcessed = 0;
            const source = indexName ? store.index(indexName) : store;
            const request = direction === "next" ? source.openCursor(null, "next") : source.openCursor(null, "prev");
            request.onsuccess = (event) => {
              const cursor = event.target.result;
              if (!cursor) {
                const result = {
                  items,
                  total,
                  page,
                  pageSize,
                  hasMore: offset + items.length < total
                };
                this._setCache(cacheKey, result);
                resolve(result);
                return;
              }
              if (itemsProcessed < offset) {
                itemsProcessed++;
                cursor.continue();
                return;
              }
              if (items.length < pageSize) {
                items.push(cursor.value);
                itemsProcessed++;
                cursor.continue();
              } else {
                const result = {
                  items,
                  total,
                  page,
                  pageSize,
                  hasMore: offset + items.length < total
                };
                this._setCache(cacheKey, result);
                resolve(result);
              }
            };
            request.onerror = () => reject(request.error);
          });
        }
        /**
         * Batch read multiple items efficiently
         * @param {string} storeName - Name of the object store
         * @param {Array} keys - Array of keys to retrieve
         * @returns {Promise<Array>} Array of results (null for missing keys)
         */
        async batchGet(storeName, keys) {
          await this.ensureInitialized();
          const cacheKey = `${storeName}:batch:${keys.sort().join(",")}`;
          const cached = this._getCached(cacheKey);
          if (cached !== null) {
            return cached;
          }
          const transaction = this.db.transaction([storeName], "readonly");
          const store = transaction.objectStore(storeName);
          const promises = keys.map((key) => {
            return new Promise((resolve) => {
              const request = store.get(key);
              request.onsuccess = () => resolve(request.result);
              request.onerror = () => resolve(null);
            });
          });
          const results = await Promise.all(promises);
          this._setCache(cacheKey, results);
          return results;
        }
        async update(storeName, data) {
          await this.ensureInitialized();
          this._invalidateStoreCache(storeName);
          if (data && data.id) {
            this.cache.delete(`${storeName}:get:${data.id}`);
          }
          const transaction = this.db.transaction([storeName], "readwrite");
          const store = transaction.objectStore(storeName);
          return new Promise((resolve, reject) => {
            const request = store.put(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });
        }
        async delete(storeName, key) {
          await this.ensureInitialized();
          this._invalidateStoreCache(storeName);
          this.cache.delete(`${storeName}:get:${key}`);
          const transaction = this.db.transaction([storeName], "readwrite");
          const store = transaction.objectStore(storeName);
          return new Promise((resolve, reject) => {
            const request = store.delete(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });
        }
        async clear(storeName) {
          await this.ensureInitialized();
          const transaction = this.db.transaction([storeName], "readwrite");
          const store = transaction.objectStore(storeName);
          return new Promise((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });
        }
        /**
         * Query by index
         */
        async getByIndex(storeName, indexName, value) {
          await this.ensureInitialized();
          const transaction = this.db.transaction([storeName], "readonly");
          const store = transaction.objectStore(storeName);
          const index = store.index(indexName);
          return new Promise((resolve, reject) => {
            const request = index.getAll(value);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });
        }
        /**
         * Bulk operations
         */
        async bulkAdd(storeName, dataArray) {
          await this.ensureInitialized();
          const transaction = this.db.transaction([storeName], "readwrite");
          const store = transaction.objectStore(storeName);
          const promises = dataArray.map((data) => {
            return new Promise((resolve, reject) => {
              const request = store.add(data);
              request.onsuccess = () => resolve(request.result);
              request.onerror = () => reject(request.error);
            });
          });
          return Promise.all(promises);
        }
        async bulkUpdate(storeName, dataArray) {
          await this.ensureInitialized();
          const transaction = this.db.transaction([storeName], "readwrite");
          const store = transaction.objectStore(storeName);
          const promises = dataArray.map((data) => {
            return new Promise((resolve, reject) => {
              const request = store.put(data);
              request.onsuccess = () => resolve(request.result);
              request.onerror = () => reject(request.error);
            });
          });
          return Promise.all(promises);
        }
        /**
         * Execute a custom IndexedDB transaction across one or many stores.
         */
        async executeTransaction(storeNames, mode, operationFn) {
          await this.ensureInitialized();
          const stores = Array.isArray(storeNames) ? storeNames : [storeNames];
          const transaction = this.db.transaction(stores, mode);
          const storeMap = Object.fromEntries(stores.map((name) => [name, transaction.objectStore(name)]));
          return new Promise((resolve, reject) => {
            let settled = false;
            const settleResolve = (value) => {
              if (!settled) {
                settled = true;
                resolve(value);
              }
            };
            const settleReject = (error) => {
              if (!settled) {
                settled = true;
                reject(error);
              }
            };
            let operationResult;
            transaction.oncomplete = () => settleResolve(operationResult);
            transaction.onerror = () => settleReject(transaction.error);
            transaction.onabort = () => settleReject(transaction.error || new Error("Transaction aborted"));
            Promise.resolve().then(() => operationFn({ transaction, stores: storeMap })).then((result) => {
              operationResult = result;
            }).catch((error) => {
              try {
                transaction.abort();
              } catch (abortError) {
                console.warn("Transaction abort warning:", abortError);
              }
              settleReject(error);
            });
          });
        }
        /**
         * Batch upsert with chunking to avoid oversized transactions.
         */
        async batchUpsert(storeName, records, batchSize = 50) {
          await this.ensureInitialized();
          if (!Array.isArray(records) || records.length === 0) {
            return 0;
          }
          const normalizedBatchSize = Math.max(1, Number(batchSize) || 50);
          for (let i = 0; i < records.length; i += normalizedBatchSize) {
            const chunk = records.slice(i, i + normalizedBatchSize);
            await this.executeTransaction(storeName, "readwrite", ({ stores }) => {
              chunk.forEach((record) => {
                stores[storeName].put(record);
              });
            });
          }
          this._invalidateStoreCache(storeName);
          return records.length;
        }
        async getStoreNames() {
          await this.ensureInitialized();
          return Array.from(this.db.objectStoreNames || []);
        }
        getSchemaVersion() {
          return DB_VERSION;
        }
        /**
         * Export all data
         */
        async exportData() {
          const data = {};
          const storeNames = [
            "meta",
            "statRegistry",
            "skillBank",
            "itemBank",
            "actors",
            "books",
            "relationships",
            "wiki",
            "skillTrees",
            // Narrative control stores
            "canonSessions",
            "narrativeReviewQueue",
            "queueAudit",
            "chapterVersions",
            "chapterChangelog",
            "retroImpacts",
            "plotQuests",
            "factions",
            "canonSettings",
            // Visualization & context stores
            "timelineEvents",
            "locations",
            "plotThreads",
            "plotBeats",
            "wikiEntries",
            "characterArcs",
            "extractionHistory",
            "extractionSessions"
          ];
          for (const storeName of storeNames) {
            data[storeName] = await this.getAll(storeName);
          }
          return data;
        }
        /**
         * Import data (replaces existing data)
         */
        async importData(data) {
          const storeNames = Object.keys(data);
          for (const storeName of storeNames) {
            if (this.db.objectStoreNames.contains(storeName)) {
              await this.clear(storeName);
              if (data[storeName] && data[storeName].length > 0) {
                await this.bulkAdd(storeName, data[storeName]);
              }
            }
          }
        }
        /**
         * Create a backup of all data
         */
        async createBackup() {
          try {
            const data = await this.exportData();
            const backup = {
              id: `backup_${Date.now()}`,
              timestamp: Date.now(),
              data
            };
            await this.add("backups", backup);
            return backup;
          } catch (error) {
            console.error("Error creating backup:", error);
            throw new Error("Failed to create backup: " + error.message);
          }
        }
        /**
         * Get backups
         */
        async getBackups(limit = 10) {
          try {
            const transaction = this.db.transaction(["backups"], "readonly");
            const store = transaction.objectStore("backups");
            const index = store.index("timestamp");
            return new Promise((resolve, reject) => {
              const request = index.getAll();
              request.onsuccess = () => {
                const backups = request.result.sort((a, b) => b.timestamp - a.timestamp);
                resolve(backups.slice(0, limit));
              };
              request.onerror = () => {
                console.error("Error getting backups:", request.error);
                reject(request.error);
              };
            });
          } catch (error) {
            console.error("Error getting backups:", error);
            return [];
          }
        }
        /**
         * Restore from backup
         */
        async restoreBackup(backup) {
          if (!backup || !backup.data) {
            throw new Error("Invalid backup data");
          }
          await this.importData(backup.data);
        }
        /**
         * Save actor snapshot
         */
        async saveSnapshot(actorId, bookId, chapterId, snapshotData) {
          try {
            const snapshot = {
              id: `snapshot_${actorId}_${bookId}_${chapterId}_${Date.now()}`,
              actorId,
              bookId,
              chapterId,
              data: snapshotData,
              timestamp: Date.now()
            };
            if (!this.db.objectStoreNames.contains("snapshots")) {
              await this.update("meta", {
                id: `snapshot_${actorId}_${bookId}_${chapterId}`,
                ...snapshot
              });
            } else {
              await this.add("snapshots", snapshot);
            }
            return snapshot;
          } catch (error) {
            console.error("Error saving snapshot:", error);
            try {
              await this.update("meta", {
                id: `snapshot_${actorId}_${bookId}_${chapterId}`,
                actorId,
                bookId,
                chapterId,
                data: snapshotData,
                timestamp: Date.now()
              });
            } catch (e) {
              throw new Error("Failed to save snapshot: " + e.message);
            }
          }
        }
        /**
         * Get snapshot for specific actor, book, and chapter
         */
        async getSnapshot(actorId, bookId, chapterId) {
          try {
            if (this.db.objectStoreNames.contains("snapshots")) {
              const snapshots = await this.getAll("snapshots");
              return snapshots.find(
                (s) => s.actorId === actorId && s.bookId === bookId && s.chapterId === chapterId
              );
            } else {
              return await this.get("meta", `snapshot_${actorId}_${bookId}_${chapterId}`);
            }
          } catch (error) {
            console.error("Error getting snapshot:", error);
            return null;
          }
        }
        /**
         * Get latest snapshots for multiple actors
         */
        async getLatestSnapshotsForActors(actorIds, bookId = null, chapterId = null) {
          try {
            const snapshots = {};
            if (this.db.objectStoreNames.contains("snapshots")) {
              const allSnapshots = await this.getAll("snapshots");
              for (const actorId of actorIds) {
                let actorSnapshots = allSnapshots.filter((s) => s.actorId === actorId);
                if (bookId !== null) {
                  actorSnapshots = actorSnapshots.filter((s) => s.bookId === bookId);
                }
                if (chapterId !== null) {
                  actorSnapshots = actorSnapshots.filter((s) => s.chapterId === chapterId);
                }
                if (actorSnapshots.length > 0) {
                  const latest = actorSnapshots.sort(
                    (a, b) => (b.timestamp || 0) - (a.timestamp || 0)
                  )[0];
                  snapshots[actorId] = latest.data || latest;
                }
              }
            } else {
              for (const actorId of actorIds) {
                try {
                  const metaKey = bookId && chapterId ? `snapshot_${actorId}_${bookId}_${chapterId}` : null;
                  if (metaKey) {
                    const snapshot = await this.get("meta", metaKey);
                    if (snapshot) {
                      snapshots[actorId] = snapshot.data || snapshot;
                      continue;
                    }
                  }
                  const actor = await this.get("actors", actorId);
                  if (actor && actor.snapshots) {
                    const snapshotKeys = Object.keys(actor.snapshots);
                    if (snapshotKeys.length > 0) {
                      const latestKey = snapshotKeys.sort().reverse()[0];
                      snapshots[actorId] = actor.snapshots[latestKey];
                    }
                  }
                } catch (e) {
                  console.warn(`Could not get snapshot for actor ${actorId}:`, e);
                }
              }
            }
            return snapshots;
          } catch (error) {
            console.error("Error getting latest snapshots:", error);
            return {};
          }
        }
      };
      db = new ClaimwiseDB();
      database_default = db;
    }
  });

  // src/services/offlineAIService-shim.js
  var pipeline, env;
  var init_offlineAIService_shim = __esm({
    "src/services/offlineAIService-shim.js"() {
      pipeline = async () => {
        throw new Error("@xenova/transformers is not bundled; load it from a CDN to enable offline AI.");
      };
      env = {
        allowLocalModels: false,
        allowRemoteModels: false,
        backends: {
          onnx: {
            wasm: { proxy: false }
          }
        }
      };
    }
  });

  // src/services/offlineAIService.js
  var OfflineAIService, offlineAIService, offlineAIService_default;
  var init_offlineAIService = __esm({
    "src/services/offlineAIService.js"() {
      init_offlineAIService_shim();
      env.allowLocalModels = false;
      env.allowRemoteModels = true;
      env.backends.onnx.wasm.proxy = false;
      OfflineAIService = class {
        constructor() {
          this.model = null;
          this.tokenizer = null;
          this.isLoading = false;
          this.isReady = false;
          this.modelName = "Xenova/Qwen2.5-0.5B-Instruct";
          this.loadPromise = null;
          this.supportsWebGPU = false;
          this.supportsWASM = false;
          this._checkCapabilities();
        }
        /**
         * Check device capabilities for AI inference
         */
        _checkCapabilities() {
          if (navigator.gpu) {
            this.supportsWebGPU = true;
            console.log("[Offline AI] WebGPU supported");
          } else {
            console.log("[Offline AI] WebGPU not supported, will use WebAssembly");
          }
          if (typeof WebAssembly !== "undefined") {
            this.supportsWASM = true;
            console.log("[Offline AI] WebAssembly supported");
          }
          if (this.supportsWebGPU) {
            env.backends.onnx.wasm.proxy = false;
          }
        }
        /**
         * Check if offline AI is available on this device
         */
        isAvailable() {
          return this.supportsWASM || this.supportsWebGPU;
        }
        /**
         * Load the AI model (downloads on first use)
         */
        async loadModel() {
          if (this.loadPromise) {
            return this.loadPromise;
          }
          if (this.isReady && this.model) {
            return Promise.resolve();
          }
          if (this.isLoading) {
            return this.loadPromise;
          }
          this.isLoading = true;
          console.log("[Offline AI] Loading model:", this.modelName);
          this.loadPromise = (async () => {
            try {
              this.model = await pipeline(
                "text-generation",
                this.modelName,
                {
                  quantized: true,
                  // Use quantized model for smaller size
                  progress_callback: (progress) => {
                    if (progress.status === "progress") {
                      const percent = Math.round(progress.progress / progress.total * 100);
                      console.log(`[Offline AI] Download progress: ${percent}%`);
                    }
                  }
                }
              );
              this.isReady = true;
              this.isLoading = false;
              console.log("[Offline AI] Model loaded successfully");
              return true;
            } catch (error) {
              console.error("[Offline AI] Failed to load model:", error);
              this.isLoading = false;
              this.loadPromise = null;
              throw error;
            }
          })();
          return this.loadPromise;
        }
        /**
         * Generate text using the offline model
         */
        async generate(prompt, systemContext = "", options = {}) {
          var _a, _b;
          const {
            maxLength = 512,
            temperature = 0.7,
            topK = 50,
            topP = 0.9,
            doSample = true
          } = options;
          if (!this.isReady) {
            try {
              await this.loadModel();
            } catch (error) {
              throw new Error(`Offline AI model failed to load: ${error.message}`);
            }
          }
          let fullPrompt = prompt;
          if (systemContext) {
            fullPrompt = `${systemContext}

User: ${prompt}

Assistant:`;
          }
          try {
            console.log("[Offline AI] Generating response...");
            const startTime = Date.now();
            const result = await this.model(fullPrompt, {
              max_new_tokens: maxLength,
              temperature,
              top_k: topK,
              top_p: topP,
              do_sample: doSample,
              return_full_text: false,
              truncation: true
            });
            const endTime = Date.now();
            const duration = endTime - startTime;
            console.log(`[Offline AI] Generated response in ${duration}ms`);
            let generatedText = "";
            if (Array.isArray(result)) {
              generatedText = ((_a = result[0]) == null ? void 0 : _a.generated_text) || ((_b = result[0]) == null ? void 0 : _b.text) || "";
            } else if (result.generated_text) {
              generatedText = result.generated_text;
            } else if (typeof result === "string") {
              generatedText = result;
            }
            if (generatedText.includes(fullPrompt)) {
              generatedText = generatedText.replace(fullPrompt, "").trim();
            }
            generatedText = generatedText.replace(/^User:.*$/gm, "").trim();
            generatedText = generatedText.replace(/^Assistant:/, "").trim();
            return generatedText || "I apologize, but I could not generate a response.";
          } catch (error) {
            console.error("[Offline AI] Generation error:", error);
            throw new Error(`Offline AI generation failed: ${error.message}`);
          }
        }
        /**
         * Check if model is ready
         */
        getReadyState() {
          return {
            isReady: this.isReady,
            isLoading: this.isLoading,
            isAvailable: this.isAvailable(),
            supportsWebGPU: this.supportsWebGPU,
            supportsWASM: this.supportsWASM,
            modelName: this.modelName
          };
        }
        /**
         * Unload the model to free memory
         */
        async unloadModel() {
          if (this.model) {
            this.model = null;
            this.isReady = false;
            console.log("[Offline AI] Model unloaded");
          }
        }
        /**
         * Get model download size estimate
         */
        getModelSize() {
          return {
            estimatedSize: "300-400MB",
            modelName: this.modelName
          };
        }
      };
      offlineAIService = new OfflineAIService();
      offlineAIService_default = offlineAIService;
    }
  });

  // src/services/intelligenceRouter.js
  function analyzeComplexity(prompt, systemContext = "", taskType = "general") {
    let score = 0.5;
    const totalLength = prompt.length + ((systemContext == null ? void 0 : systemContext.length) || 0);
    if (totalLength > 5e3) score += 0.2;
    else if (totalLength > 2e3) score += 0.1;
    else if (totalLength < 200) score -= 0.2;
    let highHits = 0, medHits = 0, lowHits = 0;
    const combinedText = `${prompt} ${systemContext}`;
    for (const pattern of COMPLEXITY_SIGNALS.high) {
      if (pattern.test(combinedText)) highHits++;
    }
    for (const pattern of COMPLEXITY_SIGNALS.medium) {
      if (pattern.test(combinedText)) medHits++;
    }
    for (const pattern of COMPLEXITY_SIGNALS.low) {
      if (pattern.test(combinedText)) lowHits++;
    }
    score += highHits * 0.08;
    score += medHits * 0.03;
    score -= lowHits * 0.05;
    score += TASK_COMPLEXITY_BIAS[taskType] || 0;
    if (/return.*json|json.*format|json.*object/i.test(combinedText)) {
      score += 0.05;
    }
    const listItems = (combinedText.match(/^\s*[-*\d]+[.)]/gm) || []).length;
    if (listItems > 5) score += 0.15;
    else if (listItems > 2) score += 0.05;
    if (/across\s*chapters?|previous\s*chapter|earlier\s*in|continuity/i.test(combinedText)) {
      score += 0.2;
    }
    score = Math.max(0, Math.min(1, score));
    let tier;
    if (score < 0.35) tier = "fast";
    else if (score < 0.65) tier = "balanced";
    else tier = "premium";
    return { score, tier, signals: { highHits, medHits, lowHits, totalLength, taskType } };
  }
  var MODEL_REGISTRY, COMPLEXITY_SIGNALS, TASK_COMPLEXITY_BIAS, TOKEN_STORAGE_KEY, TOKEN_WARNING_THRESHOLDS, TokenUsageTracker, IntelligenceRouter, intelligenceRouter, intelligenceRouter_default;
  var init_intelligenceRouter = __esm({
    "src/services/intelligenceRouter.js"() {
      MODEL_REGISTRY = [
        // === FAST TIER (free or very cheap, good for simple tasks) ===
        {
          id: "groq-llama-3.1-8b",
          provider: "groq",
          model: "llama-3.1-8b-instant",
          tier: "fast",
          capability: 3,
          speed: 10,
          // tokens/sec relative score
          costPer1kTokens: 0,
          maxTokens: 4096,
          temperature: 0.7,
          strengths: ["quick-answers", "simple-generation", "summaries"],
          description: "Ultra-fast free model for simple tasks"
        },
        {
          id: "groq-llama-3.1-70b",
          provider: "groq",
          model: "llama-3.1-70b-versatile",
          tier: "fast",
          capability: 5,
          speed: 8,
          costPer1kTokens: 0,
          maxTokens: 4096,
          temperature: 0.7,
          strengths: ["general", "creative", "analysis"],
          description: "Free high-quality model via Groq"
        },
        {
          id: "gemini-flash",
          provider: "gemini",
          model: "gemini-2.0-flash",
          tier: "fast",
          capability: 6,
          speed: 9,
          costPer1kTokens: 0.0375,
          // very cheap
          maxTokens: 8192,
          temperature: 0.7,
          strengths: ["creative", "general", "structured", "fast-generation"],
          description: "Fast and cheap Gemini model"
        },
        // === BALANCED TIER (good quality, moderate cost) ===
        {
          id: "gemini-2.5-flash-preview",
          provider: "gemini",
          model: "gemini-2.5-flash-preview-04-17",
          tier: "balanced",
          capability: 7,
          speed: 7,
          costPer1kTokens: 0.15,
          maxTokens: 8192,
          temperature: 0.7,
          strengths: ["creative", "analysis", "structured", "reasoning"],
          description: "Latest Gemini Flash with strong reasoning"
        },
        {
          id: "gpt-4o-mini",
          provider: "openai",
          model: "gpt-4o-mini",
          tier: "balanced",
          capability: 7,
          speed: 7,
          costPer1kTokens: 0.15,
          maxTokens: 4096,
          temperature: 0.7,
          strengths: ["structured", "analysis", "creative", "general"],
          description: "Cost-effective OpenAI model"
        },
        {
          id: "claude-haiku",
          provider: "anthropic",
          model: "claude-haiku-4-5-20251001",
          tier: "balanced",
          capability: 7,
          speed: 8,
          costPer1kTokens: 0.25,
          maxTokens: 4096,
          temperature: 0.7,
          strengths: ["analysis", "structured", "creative", "reasoning"],
          description: "Fast and capable Claude model"
        },
        // === PREMIUM TIER (highest quality, for complex/critical tasks) ===
        {
          id: "gpt-4o",
          provider: "openai",
          model: "gpt-4o",
          tier: "premium",
          capability: 9,
          speed: 5,
          costPer1kTokens: 2.5,
          maxTokens: 4096,
          temperature: 0.7,
          strengths: ["creative", "analysis", "structured", "reasoning", "nuance"],
          description: "Top-tier OpenAI model"
        },
        {
          id: "claude-sonnet",
          provider: "anthropic",
          model: "claude-sonnet-4-20250514",
          tier: "premium",
          capability: 9,
          speed: 5,
          costPer1kTokens: 3,
          maxTokens: 4096,
          temperature: 0.7,
          strengths: ["analysis", "reasoning", "creative", "nuance", "consistency"],
          description: "Top-tier Anthropic model"
        },
        {
          id: "claude-opus",
          provider: "anthropic",
          model: "claude-opus-4-20250514",
          tier: "premium",
          capability: 10,
          speed: 3,
          costPer1kTokens: 15,
          maxTokens: 4096,
          temperature: 0.7,
          strengths: ["deep-reasoning", "nuance", "analysis", "creative", "consistency"],
          description: "Most capable AI model - use for critical/complex tasks only"
        }
      ];
      COMPLEXITY_SIGNALS = {
        high: [
          // Deep analysis
          /\b(analyze|analyse|evaluate|critique|compare and contrast|assess)\b/i,
          /\b(consistency|continuity|contradiction|plot\s*hole|timeline)\b/i,
          /\b(character\s*arc|narrative\s*structure|thematic)\b/i,
          // Multi-step reasoning
          /\b(step.by.step|chain\s*of\s*thought|reasoning|logic|deduc)/i,
          /\b(cross.reference|correlat|interconnect|relationship\s*between)\b/i,
          // Complex generation
          /\b(rewrite|improve|enhance|refine|polish)\b/i,
          /\b(world.?build|lore|mythology|magic\s*system)\b/i,
          // JSON with many fields
          /\b(comprehensive|thorough|detailed|in.depth|exhaustive)\b/i
        ],
        medium: [
          /\b(summarize|summarise|outline|overview|describe)\b/i,
          /\b(generate|create|write|draft|compose)\b/i,
          /\b(explain|clarify|elaborate)\b/i,
          /\b(list|categorize|classify|organize)\b/i,
          /\b(suggest|recommend|propose)\b/i,
          /\b(character|scene|dialogue|chapter)\b/i
        ],
        low: [
          /\b(yes|no|true|false|name|title|label)\b/i,
          /\b(short|brief|quick|simple|basic)\b/i,
          /\b(format|convert|translate|extract)\b/i,
          /\b(count|number|how\s*many)\b/i
        ]
      };
      TASK_COMPLEXITY_BIAS = {
        creative: 0.2,
        // Creative tasks often benefit from better models
        analytical: 0.3,
        // Analysis needs strong reasoning
        structured: -0.1,
        // Structured output is easier for most models
        general: 0
      };
      TOKEN_STORAGE_KEY = "claimwise_token_usage";
      TOKEN_WARNING_THRESHOLDS = {
        groq: { daily: 14400, label: "Groq free tier (14,400 req/day)" },
        gemini: { monthly: 15e5, label: "Gemini free tier (~1.5M tokens/month)" },
        openai: { monthly: 5e5, label: "OpenAI budget", warn: true },
        anthropic: { monthly: 5e5, label: "Anthropic budget", warn: true }
      };
      TokenUsageTracker = class {
        constructor() {
          this.usage = this._loadUsage();
        }
        _loadUsage() {
          try {
            const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
            if (stored) {
              const data = JSON.parse(stored);
              const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
              if (data.date !== today) {
                data.daily = {};
                data.date = today;
              }
              const month = (/* @__PURE__ */ new Date()).toISOString().slice(0, 7);
              if (data.month !== month) {
                data.monthly = {};
                data.month = month;
              }
              return data;
            }
          } catch (_) {
          }
          return {
            date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
            month: (/* @__PURE__ */ new Date()).toISOString().slice(0, 7),
            daily: {},
            monthly: {},
            totalRequests: 0,
            totalEstimatedCost: 0
          };
        }
        _saveUsage() {
          try {
            localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(this.usage));
          } catch (_) {
          }
        }
        trackRequest(provider, modelId, estimatedTokens) {
          const cost = this._estimateCost(modelId, estimatedTokens);
          this.usage.daily[provider] = (this.usage.daily[provider] || 0) + 1;
          this.usage.monthly[provider] = (this.usage.monthly[provider] || 0) + estimatedTokens;
          this.usage.totalRequests++;
          this.usage.totalEstimatedCost += cost;
          this._saveUsage();
          return { cost, warning: this._checkWarnings(provider) };
        }
        _estimateCost(modelId, tokens) {
          const model = MODEL_REGISTRY.find((m) => m.id === modelId);
          if (!model) return 0;
          return tokens / 1e3 * model.costPer1kTokens;
        }
        _checkWarnings(provider) {
          const threshold = TOKEN_WARNING_THRESHOLDS[provider];
          if (!threshold) return null;
          if (threshold.daily) {
            const dailyCount = this.usage.daily[provider] || 0;
            const pct = dailyCount / threshold.daily;
            if (pct >= 0.9) {
              return { level: "critical", message: `${threshold.label}: ${Math.round(pct * 100)}% used today` };
            }
            if (pct >= 0.7) {
              return { level: "warning", message: `${threshold.label}: ${Math.round(pct * 100)}% used today` };
            }
          }
          if (threshold.monthly) {
            const monthlyTokens = this.usage.monthly[provider] || 0;
            const pct = monthlyTokens / threshold.monthly;
            if (pct >= 0.9) {
              return { level: "critical", message: `${threshold.label}: ~${Math.round(pct * 100)}% of budget used this month` };
            }
            if (pct >= 0.7) {
              return { level: "warning", message: `${threshold.label}: ~${Math.round(pct * 100)}% of budget used this month` };
            }
          }
          return null;
        }
        getUsageSummary() {
          return {
            today: { ...this.usage.daily },
            thisMonth: { ...this.usage.monthly },
            totalRequests: this.usage.totalRequests,
            estimatedTotalCost: Math.round(this.usage.totalEstimatedCost * 1e3) / 1e3,
            warnings: Object.keys(TOKEN_WARNING_THRESHOLDS).map((p) => ({ provider: p, ...this._checkWarnings(p) })).filter((w) => w.level)
          };
        }
        resetUsage() {
          this.usage = {
            date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
            month: (/* @__PURE__ */ new Date()).toISOString().slice(0, 7),
            daily: {},
            monthly: {},
            totalRequests: 0,
            totalEstimatedCost: 0
          };
          this._saveUsage();
        }
      };
      IntelligenceRouter = class {
        constructor() {
          this.tokenTracker = new TokenUsageTracker();
          this.registry = [...MODEL_REGISTRY];
          this.lastRouting = null;
        }
        /**
         * Get all models available for a set of configured providers.
         * @param {string[]} availableProviders - providers that have keys configured
         * @returns {object[]} filtered model list
         */
        getAvailableModels(availableProviders) {
          return this.registry.filter((m) => availableProviders.includes(m.provider));
        }
        /**
         * Route a request to the best model based on complexity analysis.
         * Returns an ordered list of models to try (primary + fallbacks).
         *
         * @param {string} prompt
         * @param {string} systemContext
         * @param {string} taskType - 'creative' | 'analytical' | 'structured' | 'general'
         * @param {string[]} availableProviders - providers with keys set
         * @param {string} preferredProvider - user's preferred provider or 'auto'
         * @returns {{ primary: object, fallbacks: object[], complexity: object }}
         */
        route(prompt, systemContext = "", taskType = "general", availableProviders = [], preferredProvider = "auto") {
          const complexity = analyzeComplexity(prompt, systemContext, taskType);
          const available = this.getAvailableModels(availableProviders);
          if (available.length === 0) {
            return { primary: null, fallbacks: [], complexity };
          }
          const tierOrder = ["fast", "balanced", "premium"];
          const targetTierIdx = tierOrder.indexOf(complexity.tier);
          const scored = available.map((model) => {
            let modelScore = model.capability;
            const modelTierIdx = tierOrder.indexOf(model.tier);
            if (modelTierIdx === targetTierIdx) modelScore += 3;
            else if (Math.abs(modelTierIdx - targetTierIdx) === 1) modelScore += 1;
            else modelScore -= 2;
            const strengthMatch = model.strengths.filter(
              (s) => s === taskType || s === "general" || s === "reasoning"
            ).length;
            modelScore += strengthMatch * 0.5;
            if (complexity.tier === "fast") {
              modelScore += (10 - model.costPer1kTokens) * 0.3;
            }
            if (complexity.tier === "fast") {
              modelScore += model.speed * 0.2;
            }
            if (preferredProvider !== "auto" && model.provider === preferredProvider) {
              modelScore += 2;
            }
            return { ...model, routingScore: modelScore };
          });
          scored.sort((a, b) => b.routingScore - a.routingScore);
          const primary = scored[0];
          const fallbacks = scored.slice(1);
          this.lastRouting = { primary, fallbacks, complexity, timestamp: Date.now() };
          console.log(
            `[IntelligenceRouter] Complexity: ${complexity.score.toFixed(2)} (${complexity.tier}) -> ${primary.id} (${primary.provider}/${primary.model})`,
            complexity.signals
          );
          return { primary, fallbacks, complexity };
        }
        /**
         * Record that a request was completed and track tokens.
         */
        trackCompletion(modelId, provider, estimatedTokens) {
          return this.tokenTracker.trackRequest(provider, modelId, estimatedTokens);
        }
        /**
         * Get usage summary for display in UI.
         */
        getUsageSummary() {
          return this.tokenTracker.getUsageSummary();
        }
        /**
         * Reset usage tracking.
         */
        resetUsage() {
          this.tokenTracker.resetUsage();
        }
        /**
         * Get the last routing decision (for debugging/display).
         */
        getLastRouting() {
          return this.lastRouting;
        }
        /**
         * Get the full model registry (for settings UI).
         */
        getModelRegistry() {
          return [...this.registry];
        }
        /**
         * Add a model to the registry at runtime (auto-adapts routing).
         */
        addModel(modelDef) {
          if (!modelDef.id || !modelDef.provider || !modelDef.model || !modelDef.tier) {
            throw new Error("Model definition requires id, provider, model, and tier");
          }
          this.registry = this.registry.filter((m) => m.id !== modelDef.id);
          this.registry.push({
            capability: 5,
            speed: 5,
            costPer1kTokens: 0,
            maxTokens: 4096,
            temperature: 0.7,
            strengths: ["general"],
            description: "",
            ...modelDef
          });
        }
        /**
         * Remove a model from the registry.
         */
        removeModel(modelId) {
          this.registry = this.registry.filter((m) => m.id !== modelId);
        }
      };
      intelligenceRouter = new IntelligenceRouter();
      intelligenceRouter_default = intelligenceRouter;
    }
  });

  // src/services/styleGuideService.js
  var styleGuideService_exports = {};
  __export(styleGuideService_exports, {
    default: () => styleGuideService_default
  });
  var StyleGuideService, styleGuideService, styleGuideService_default;
  var init_styleGuideService = __esm({
    "src/services/styleGuideService.js"() {
      init_database();
      StyleGuideService = class {
        constructor() {
          this.cachedGuide = null;
          this.cachedBuzzwords = null;
          this.loadPromise = null;
        }
        /**
         * Load style guide from markdown files or database
         */
        async loadStyleGuide() {
          if (this.cachedGuide) {
            return this.cachedGuide;
          }
          if (this.loadPromise) {
            return this.loadPromise;
          }
          this.loadPromise = this._loadStyleGuideInternal();
          return this.loadPromise;
        }
        async _loadStyleGuideInternal() {
          try {
            const dbOverride = await database_default.get("meta", "styleGuideOverride");
            if (dbOverride && dbOverride.content) {
              this.cachedGuide = {
                full: dbOverride.content,
                source: "database",
                loadedAt: Date.now()
              };
              return this.cachedGuide;
            }
            let fullGuide = await this._loadMarkdownFile("Writing Style Guide.md");
            let overviewGuide = await this._loadMarkdownFile("Overview - Writing Style Guide.md");
            if (!fullGuide) {
              const cached = await database_default.get("meta", "styleGuideCache");
              if (cached && cached.content) {
                fullGuide = cached.content.full || "";
                overviewGuide = cached.content.overview || overviewGuide;
              }
            }
            const combinedGuide = {
              full: fullGuide || "",
              overview: overviewGuide || "",
              source: "markdown",
              loadedAt: Date.now()
            };
            try {
              await database_default.update("meta", {
                id: "styleGuideCache",
                content: combinedGuide,
                cachedAt: Date.now()
              });
            } catch (error) {
              try {
                await database_default.add("meta", {
                  id: "styleGuideCache",
                  content: combinedGuide,
                  cachedAt: Date.now()
                });
              } catch (e) {
                console.warn("Could not cache style guide:", e);
              }
            }
            this.cachedGuide = combinedGuide;
            return this.cachedGuide;
          } catch (error) {
            console.error("Error loading style guide:", error);
            return {
              full: 'You are writing for "The Compliance Run" - a dark comedy horror-RPG series set in bureaucratic apocalypse Britain.',
              overview: "",
              source: "fallback",
              loadedAt: Date.now()
            };
          }
        }
        /**
         * Load markdown file from public directory or workspace root
         */
        async _loadMarkdownFile(filename) {
          try {
            const publicPath = `/data/${filename}`;
            const response = await fetch(publicPath);
            if (response.ok) {
              return await response.text();
            }
          } catch (error) {
            console.warn(`Could not load ${filename} from public directory:`, error);
          }
          try {
            const workspacePath = `../../${filename}`;
            const response = await fetch(workspacePath);
            if (response.ok) {
              return await response.text();
            }
          } catch (error) {
            console.warn(`Could not load ${filename} from workspace root:`, error);
          }
          return null;
        }
        /**
         * Get full system context for AI prompts
         */
        async getSystemContext() {
          const guide = await this.loadStyleGuide();
          if (!guide.full && !guide.overview) {
            return 'You are a creative writing assistant for "The Compliance Run" book series.';
          }
          let systemContext = `You are a creative writing assistant for "The Compliance Run" book series.

CRITICAL: You MUST follow the complete Writing Style Guide provided below. This guide defines the tone, voice, character dynamics, world rules, and all stylistic requirements for the series.

=== WRITING STYLE GUIDE ===

`;
          if (guide.overview) {
            systemContext += `OVERVIEW:
${guide.overview}

`;
          }
          if (guide.full) {
            systemContext += `FULL STYLE GUIDE:
${guide.full}

`;
          }
          systemContext += `=== END STYLE GUIDE ===

When writing chapters, you MUST:
1. Follow the tone and voice guidelines exactly (60% horror/RPG brutality, 40% caustic comedy)
2. Maintain character voices (Grimguff's formal/heroic, Pipkins' sardonic/British slang)
3. Use the specified buzzwords and terminology correctly
4. Follow the pacing and structure patterns
5. Incorporate recurring gags and devices appropriately
6. Use proper formatting (italics for thoughts, bold for UI, etc.)
7. Reference the validation checklist before finalizing output

The style guide is your primary reference - consult it for any questions about tone, character voice, world rules, or stylistic choices.`;
          return systemContext;
        }
        /**
         * Get buzzwords reference section
         */
        async getBuzzwordsReference() {
          if (this.cachedBuzzwords) {
            return this.cachedBuzzwords;
          }
          try {
            const buzzwordsFile = await this._loadMarkdownFile("BUZZWORDS_REFERENCE.md");
            if (buzzwordsFile) {
              this.cachedBuzzwords = buzzwordsFile;
              return this.cachedBuzzwords;
            }
          } catch (error) {
            console.warn("Could not load buzzwords reference file:", error);
          }
          const guide = await this.loadStyleGuide();
          const buzzwordsSection = this._extractSection(guide.full, "Buzzwords, Slang & Syntax");
          this.cachedBuzzwords = buzzwordsSection || "";
          return this.cachedBuzzwords;
        }
        /**
         * Get tone and voice guidelines
         */
        async getToneGuidelines() {
          const guide = await this.loadStyleGuide();
          return this._extractSection(guide.full, "Tone & Voice");
        }
        /**
         * Get character dynamics guidelines
         */
        async getCharacterGuidelines() {
          const guide = await this.loadStyleGuide();
          return this._extractSection(guide.full, "Character Dynamics & Dialogue");
        }
        /**
         * Get world rules section
         */
        async getWorldRules() {
          const guide = await this.loadStyleGuide();
          return this._extractSection(guide.full, "World Rules");
        }
        /**
         * Get validation checklist
         */
        async getValidationChecklist() {
          const guide = await this.loadStyleGuide();
          return this._extractSection(guide.full, "Validation Checklist");
        }
        /**
         * Extract a specific section from markdown text
         */
        _extractSection(text, sectionTitle) {
          if (!text) return "";
          const lines = text.split("\n");
          const sectionStart = lines.findIndex(
            (line) => line.includes(sectionTitle) || line.toLowerCase().includes(sectionTitle.toLowerCase())
          );
          if (sectionStart === -1) return "";
          let sectionEnd = lines.length;
          for (let i = sectionStart + 1; i < lines.length; i++) {
            if (lines[i].match(/^#{1,2}\s/)) {
              sectionEnd = i;
              break;
            }
          }
          return lines.slice(sectionStart, sectionEnd).join("\n");
        }
        /**
         * Clear cache (useful for reloading)
         */
        clearCache() {
          this.cachedGuide = null;
          this.cachedBuzzwords = null;
          this.loadPromise = null;
        }
        /**
         * Set custom style guide override in database
         */
        async setCustomOverride(content) {
          await database_default.update("meta", {
            id: "styleGuideOverride",
            content,
            updatedAt: Date.now()
          });
          this.clearCache();
        }
        /**
         * Remove custom override (revert to markdown)
         */
        async removeCustomOverride() {
          await database_default.delete("meta", "styleGuideOverride");
          this.clearCache();
        }
      };
      styleGuideService = new StyleGuideService();
      styleGuideService_default = styleGuideService;
    }
  });

  // src/services/chapterContextService.js
  var chapterContextService_exports = {};
  __export(chapterContextService_exports, {
    default: () => chapterContextService_default
  });
  var ChapterContextService, chapterContextService, chapterContextService_default;
  var init_chapterContextService = __esm({
    "src/services/chapterContextService.js"() {
      init_aiService();
      init_database();
      ChapterContextService = class {
        constructor() {
          this.relevanceCache = /* @__PURE__ */ new Map();
        }
        /**
         * Analyze chapter content to extract entities and themes
         */
        async analyzeChapterContent(chapter, actors, items, skills) {
          if (!chapter) return { actors: [], items: [], skills: [], themes: [] };
          const text = chapter.script || chapter.desc || "";
          const mentionedActors = actors.filter(
            (a) => text.toLowerCase().includes(a.name.toLowerCase())
          ).map((a) => a.id);
          const mentionedItems = items.filter(
            (i) => text.toLowerCase().includes(i.name.toLowerCase())
          ).map((i) => i.id);
          const mentionedSkills = skills.filter(
            (s) => text.toLowerCase().includes(s.name.toLowerCase())
          ).map((s) => s.id);
          const themes = await this._extractThemes(text);
          return {
            actors: mentionedActors,
            items: mentionedItems,
            skills: mentionedSkills,
            themes,
            wordCount: text.length,
            hasDialogue: text.includes('"') || text.includes("'"),
            hasAction: this._detectActionKeywords(text)
          };
        }
        /**
         * Find relevant chapters using AI-powered analysis
         */
        async findRelevantChapters(currentChapter, allChapters, actors, items, skills, maxSuggestions = 5) {
          if (!currentChapter || !allChapters || allChapters.length === 0) {
            return [];
          }
          const cacheKey = `${currentChapter.id}_${allChapters.length}`;
          if (this.relevanceCache.has(cacheKey)) {
            return this.relevanceCache.get(cacheKey);
          }
          const currentAnalysis = await this.analyzeChapterContent(currentChapter, actors, items, skills);
          const previousChapters = allChapters.filter((ch) => {
            if (ch.id === currentChapter.id) return false;
            if (ch.bookId === currentChapter.bookId && ch.id < currentChapter.id) return true;
            if (ch.bookId < currentChapter.bookId) return true;
            return false;
          });
          if (previousChapters.length === 0) {
            return [];
          }
          const relevantChapters = await this._scoreChapterRelevance(
            currentChapter,
            currentAnalysis,
            previousChapters,
            actors,
            items,
            skills,
            maxSuggestions
          );
          this.relevanceCache.set(cacheKey, relevantChapters);
          try {
            await database_default.update("meta", {
              id: `chapterRelevance_${currentChapter.id}`,
              suggestions: relevantChapters,
              cachedAt: Date.now()
            });
          } catch (error) {
            try {
              await database_default.add("meta", {
                id: `chapterRelevance_${currentChapter.id}`,
                suggestions: relevantChapters,
                cachedAt: Date.now()
              });
            } catch (e) {
              console.warn("Could not cache chapter relevance:", e);
            }
          }
          return relevantChapters;
        }
        /**
         * Use AI to score chapter relevance
         */
        async _scoreChapterRelevance(currentChapter, currentAnalysis, previousChapters, actors, items, skills, maxSuggestions) {
          const systemContext = `You are analyzing chapter relevance for "The Compliance Run" book series.
Your task is to identify which previous chapters are most relevant to the current chapter based on:
- Shared characters/actors
- Shared items or skills
- Thematic connections
- Plot continuity
- Character development arcs

Return a JSON array of chapter suggestions with relevance scores (0.0-1.0), ordered by relevance.`;
          const currentChapterSummary = {
            title: currentChapter.title || "Untitled",
            description: currentChapter.desc || "",
            actors: currentAnalysis.actors.map((id) => {
              const actor = actors.find((a) => a.id === id);
              return actor ? actor.name : id;
            }),
            items: currentAnalysis.items.map((id) => {
              const item = items.find((i) => i.id === id);
              return item ? item.name : id;
            }),
            skills: currentAnalysis.skills.map((id) => {
              const skill = skills.find((s) => s.id === id);
              return skill ? skill.name : id;
            }),
            themes: currentAnalysis.themes
          };
          const previousChaptersSummary = previousChapters.slice(0, 20).map((ch) => ({
            id: ch.id,
            bookId: ch.bookId,
            title: ch.title || "Untitled",
            description: ch.desc || "",
            preview: (ch.script || "").substring(0, 300)
          }));
          const prompt = `Current Chapter:
Title: ${currentChapterSummary.title}
Description: ${currentChapterSummary.description}
Actors: ${currentChapterSummary.actors.join(", ") || "None"}
Items: ${currentChapterSummary.items.join(", ") || "None"}
Skills: ${currentChapterSummary.skills.join(", ") || "None"}
Themes: ${currentChapterSummary.themes.join(", ") || "None"}

Previous Chapters to analyze:
${previousChaptersSummary.map((ch, i) => `
${i + 1}. Chapter ${ch.id} (Book ${ch.bookId}): ${ch.title}
   Description: ${ch.description}
   Preview: ${ch.preview}
`).join("\n")}

Analyze which previous chapters are most relevant to the current chapter. Consider:
1. Direct character/actor connections
2. Item or skill continuity
3. Thematic resonance
4. Plot thread continuation
5. Character development arcs

Return JSON array format:
[
  {
    "chapterId": "chapter_id",
    "bookId": book_id,
    "relevance": 0.85,
    "reason": "Brief explanation of why this chapter is relevant"
  }
]

Return only the top ${maxSuggestions} most relevant chapters, ordered by relevance score (highest first).`;
          try {
            const response = await aiService_default.callAI(prompt, "analytical", systemContext);
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const suggestions = JSON.parse(jsonMatch[0]);
              return suggestions.map((sugg) => {
                const chapter = previousChapters.find(
                  (ch) => ch.id === sugg.chapterId && ch.bookId === sugg.bookId
                );
                if (chapter) {
                  return {
                    ...chapter,
                    relevance: sugg.relevance || 0.5,
                    reason: sugg.reason || "Relevant to current chapter",
                    suggested: true
                  };
                }
                return null;
              }).filter(Boolean).slice(0, maxSuggestions);
            }
          } catch (error) {
            console.error("Error scoring chapter relevance:", error);
          }
          return this._fallbackRelevanceScoring(currentAnalysis, previousChapters, actors, items, skills, maxSuggestions);
        }
        /**
         * Fallback relevance scoring based on entity overlap
         */
        _fallbackRelevanceScoring(currentAnalysis, previousChapters, actors, items, skills, maxSuggestions) {
          const scored = previousChapters.map((ch) => {
            const chText = (ch.script || ch.desc || "").toLowerCase();
            let score = 0;
            let reasons = [];
            currentAnalysis.actors.forEach((actorId) => {
              const actor = actors.find((a) => a.id === actorId);
              if (actor && chText.includes(actor.name.toLowerCase())) {
                score += 0.3;
                reasons.push(`Features ${actor.name}`);
              }
            });
            currentAnalysis.items.forEach((itemId) => {
              const item = items.find((i) => i.id === itemId);
              if (item && chText.includes(item.name.toLowerCase())) {
                score += 0.2;
                reasons.push(`Mentions ${item.name}`);
              }
            });
            currentAnalysis.skills.forEach((skillId) => {
              const skill = skills.find((s) => s.id === skillId);
              if (skill && chText.includes(skill.name.toLowerCase())) {
                score += 0.2;
                reasons.push(`References ${skill.name}`);
              }
            });
            if (ch.bookId === currentAnalysis.bookId) {
              score += 0.1;
            }
            return {
              ...ch,
              relevance: Math.min(score, 1),
              reason: reasons.join(", ") || "Potential relevance",
              suggested: true
            };
          });
          return scored.sort((a, b) => b.relevance - a.relevance).slice(0, maxSuggestions).filter((ch) => ch.relevance > 0.1);
        }
        /**
         * Extract themes from text using AI
         */
        async _extractThemes(text) {
          if (!text || text.length < 100) return [];
          const systemContext = `Extract key themes and concepts from chapter text for "The Compliance Run" series.
Return a simple comma-separated list of themes (e.g., "bureaucracy, survival, friendship, horror").`;
          const prompt = `Extract themes from this chapter text:

${text.substring(0, 2e3)}`;
          try {
            const response = await aiService_default.callAI(prompt, "analytical", systemContext);
            const themes = response.split(",").map((t) => t.trim()).filter((t) => t.length > 0);
            return themes.slice(0, 5);
          } catch (error) {
            console.error("Error extracting themes:", error);
            return [];
          }
        }
        /**
         * Detect action keywords in text
         */
        _detectActionKeywords(text) {
          const actionKeywords = ["fought", "attacked", "ran", "charged", "struck", "defended", "dodged", "blocked", "swung", "threw"];
          const lowerText = text.toLowerCase();
          return actionKeywords.some((keyword) => lowerText.includes(keyword));
        }
        /**
         * Build chapter context from selected chapters
         */
        buildChapterContext(selectedChapters) {
          if (!selectedChapters || selectedChapters.length === 0) {
            return "";
          }
          return selectedChapters.map((ch, index) => {
            const title = ch.title || `Chapter ${ch.id}`;
            const bookRef = ch.bookId ? ` (Book ${ch.bookId})` : "";
            const preview = ch.script ? ch.script.substring(0, 1e3) : ch.desc || "";
            return `Previous Chapter ${index + 1}: ${title}${bookRef}
${ch.desc ? `Description: ${ch.desc}
` : ""}
Content Preview:
${preview}${ch.script && ch.script.length > 1e3 ? "..." : ""}`;
          }).join("\n\n---\n\n");
        }
        /**
         * Clear relevance cache
         */
        clearCache() {
          this.relevanceCache.clear();
        }
      };
      chapterContextService = new ChapterContextService();
      chapterContextService_default = chapterContextService;
    }
  });

  // src/services/storyContextService.js
  var storyContextService_exports = {};
  __export(storyContextService_exports, {
    default: () => storyContextService_default
  });
  var StoryContextService, storyContextService, storyContextService_default;
  var init_storyContextService = __esm({
    "src/services/storyContextService.js"() {
      init_database();
      StoryContextService = class {
        constructor() {
          this.cachedDocuments = null;
        }
        /**
         * Get all story context documents
         */
        async getAllDocuments() {
          if (this.cachedDocuments) {
            return this.cachedDocuments;
          }
          try {
            const documents = await database_default.getAll("storyContextDocuments");
            this.cachedDocuments = documents || [];
            return this.cachedDocuments;
          } catch (error) {
            console.error("Error loading story context documents:", error);
            return [];
          }
        }
        /**
         * Get enabled documents (those that should be included in AI prompts)
         */
        async getEnabledDocuments() {
          const allDocs = await this.getAllDocuments();
          return allDocs.filter((doc) => doc.enabled !== false);
        }
        /**
         * Get documents by category
         */
        async getDocumentsByCategory(category) {
          const allDocs = await this.getAllDocuments();
          return allDocs.filter((doc) => doc.category === category);
        }
        /**
         * Get a single document by ID
         */
        async getDocument(id) {
          try {
            return await database_default.get("storyContextDocuments", id);
          } catch (error) {
            console.error("Error getting story context document:", error);
            return null;
          }
        }
        /**
         * Create a new story context document
         */
        async createDocument(data) {
          try {
            const document = {
              id: data.id || `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              title: data.title || "Untitled Document",
              content: data.content || "",
              category: data.category || "general",
              // 'outline', 'worldbuilding', 'character', 'plot', 'general'
              description: data.description || "",
              enabled: data.enabled !== void 0 ? data.enabled : true,
              createdAt: data.createdAt || Date.now(),
              updatedAt: Date.now(),
              tags: data.tags || []
            };
            await database_default.add("storyContextDocuments", document);
            this.cachedDocuments = null;
            return document;
          } catch (error) {
            console.error("Error creating story context document:", error);
            throw error;
          }
        }
        /**
         * Update an existing document
         */
        async updateDocument(id, updates) {
          try {
            const document = await this.getDocument(id);
            if (!document) {
              throw new Error("Document not found");
            }
            const updated = {
              ...document,
              ...updates,
              updatedAt: Date.now()
            };
            await database_default.update("storyContextDocuments", updated);
            this.cachedDocuments = null;
            return updated;
          } catch (error) {
            console.error("Error updating story context document:", error);
            throw error;
          }
        }
        /**
         * Delete a document
         */
        async deleteDocument(id) {
          try {
            await database_default.delete("storyContextDocuments", id);
            this.cachedDocuments = null;
          } catch (error) {
            console.error("Error deleting story context document:", error);
            throw error;
          }
        }
        /**
         * Toggle document enabled status
         */
        async toggleDocument(id) {
          const document = await this.getDocument(id);
          if (document) {
            return await this.updateDocument(id, { enabled: !document.enabled });
          }
        }
        /**
         * Build context string from enabled documents for AI prompts
         * Also includes uploaded documents from the 'documents' table (Manuscript Intelligence)
         */
        async buildContextString(selectedDocumentIds = null) {
          let documents = [];
          if (selectedDocumentIds && selectedDocumentIds.length > 0) {
            const storyDocs = await Promise.all(
              selectedDocumentIds.map((id) => this.getDocument(id))
            );
            documents = storyDocs.filter((doc) => doc && doc.enabled !== false);
          } else {
            documents = await this.getEnabledDocuments();
          }
          try {
            const uploadedDocs = await database_default.getAll("documents");
            if (uploadedDocs && uploadedDocs.length > 0) {
              const convertedDocs = uploadedDocs.map((doc) => ({
                id: doc.id,
                title: doc.filename || "Uploaded Document",
                content: doc.text || "",
                category: "general",
                description: `Uploaded ${doc.fileType || "document"}`,
                enabled: true,
                createdAt: doc.uploadedAt || Date.now(),
                updatedAt: doc.uploadedAt || Date.now(),
                tags: []
              }));
              documents = [...documents, ...convertedDocs];
            }
          } catch (error) {
            console.warn("Could not load uploaded documents for context:", error);
          }
          if (documents.length === 0) {
            return "";
          }
          documents.sort((a, b) => {
            if (a.category !== b.category) {
              return a.category.localeCompare(b.category);
            }
            return a.title.localeCompare(b.title);
          });
          let contextString = "=== STORY CONTEXT DOCUMENTS ===\n\n";
          let currentCategory = null;
          documents.forEach((doc) => {
            if (currentCategory !== doc.category) {
              if (currentCategory !== null) {
                contextString += "\n";
              }
              contextString += `--- ${doc.category.toUpperCase()} ---

`;
              currentCategory = doc.category;
            }
            contextString += `[${doc.title}]
`;
            if (doc.description) {
              contextString += `${doc.description}

`;
            }
            contextString += `${doc.content}

`;
          });
          contextString += "=== END STORY CONTEXT DOCUMENTS ===\n\n";
          return contextString;
        }
        /**
         * Get Series Bible content (book descriptions and chapter summaries)
         */
        async getSeriesBibleContext(books) {
          if (!books || Object.keys(books).length === 0) {
            return "";
          }
          let context = "=== SERIES BIBLE ===\n\n";
          const booksArray = Array.isArray(books) ? books : Object.values(books);
          booksArray.forEach((book) => {
            context += `BOOK: ${book.title || "Untitled"}
`;
            if (book.description) {
              context += `Description: ${book.description}
`;
            }
            if (book.genre) {
              context += `Genre: ${book.genre}
`;
            }
            if (book.chapters && book.chapters.length > 0) {
              context += `
Chapters:
`;
              book.chapters.forEach((chapter, idx) => {
                const chapterNum = chapter.number || idx + 1;
                const chapterTitle = chapter.title || `Chapter ${chapterNum}`;
                const chapterDesc = chapter.desc || chapter.description || "";
                context += `  ${chapterNum}. ${chapterTitle}`;
                if (chapterDesc) {
                  context += ` - ${chapterDesc}`;
                }
                context += `
`;
              });
            }
            context += `
`;
          });
          context += "=== END SERIES BIBLE ===\n\n";
          return context;
        }
        /**
         * Get Wiki entries context
         */
        async getWikiContext(wikiEntries) {
          if (!wikiEntries || wikiEntries.length === 0) {
            return "";
          }
          let context = "=== WIKI ENTRIES ===\n\n";
          wikiEntries.forEach((entry) => {
            context += `[${entry.title || "Untitled"}]
`;
            if (entry.content) {
              context += `${entry.content}

`;
            }
          });
          context += "=== END WIKI ENTRIES ===\n\n";
          return context;
        }
      };
      storyContextService = new StoryContextService();
      storyContextService_default = storyContextService;
    }
  });

  // src/services/promptTemplates.js
  function aggressiveJsonRepair(text) {
    let result = text;
    result = result.replace(
      /"([^"]*?)([\u201C\u201D][^\u201C\u201D"]*?[\u201C\u201D])([^"]*?)"/g,
      (match, before, smartQuoted, after) => {
        const escaped = smartQuoted.replace(/[\u201C\u201D]/g, '\\"');
        return `"${before}${escaped}${after}"`;
      }
    );
    let changed = true;
    while (changed) {
      const before = result;
      result = result.replace(
        /"([^"]*?)[\u201C\u201D]([^\u201C\u201D"]*?)[\u201C\u201D]([^"]*?)"/g,
        (match, before2, middle, after) => {
          return `"${before2}\\"${middle}\\"${after}"`;
        }
      );
      changed = before !== result;
    }
    result = escapeAllSmartQuotesInStrings(result);
    result = result.replace(/,(\s*[}\]])/g, "$1");
    result = result.replace(/—/g, "-").replace(/–/g, "-").replace(/…/g, "...").replace(/[\u2026]/g, "...");
    result = result.replace(/"([^"]*?)\n([^"]*?)"/g, (match, before, after) => {
      return `"${before}\\n${after}"`;
    });
    result = result.replace(/"([^"]*?)\t([^"]*?)"/g, (match, before, after) => {
      return `"${before}\\t${after}"`;
    });
    return result;
  }
  function escapeAllSmartQuotesInStrings(text) {
    let result = text.replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '\\"');
    result = result.replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "\\'");
    return result;
  }
  function repairJsonString(text) {
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1) return null;
    let json = text.substring(firstBrace, lastBrace + 1);
    json = json.replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '\\"').replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "\\'");
    json = json.replace(/—/g, "-").replace(/–/g, "-").replace(/…/g, "...").replace(/[\u2026]/g, "...");
    json = json.replace(/,(\s*[}\]])/g, "$1");
    return json;
  }
  function extractDataFromBrokenJson(text) {
    var _a, _b;
    const result = {};
    const storyMatch = text.match(/"storyFoundation"\s*:\s*\{([^}]*)\}/s);
    if (storyMatch) {
      result.storyFoundation = {};
      const storyText = storyMatch[1];
      const titleMatch = storyText.match(/"title"\s*:\s*"([^"]*)"/);
      if (titleMatch) result.storyFoundation.title = cleanExtractedValue(titleMatch[1]);
      const genreMatch = storyText.match(/"genre"\s*:\s*"([^"]*)"/);
      if (genreMatch) result.storyFoundation.genre = cleanExtractedValue(genreMatch[1]);
      const premiseMatch = storyText.match(/"premise"\s*:\s*"([^"]*(?:[\u201C\u201D][^"\u201C\u201D]*[\u201C\u201D][^"]*)*)"/s);
      if (premiseMatch) {
        result.storyFoundation.premise = cleanExtractedValue(premiseMatch[1]);
      } else {
        const premiseStart = storyText.indexOf('"premise"');
        if (premiseStart !== -1) {
          const afterColon = storyText.indexOf(":", premiseStart);
          const valueStart = storyText.indexOf('"', afterColon);
          if (valueStart !== -1) {
            let valueEnd = valueStart + 1;
            while (valueEnd < storyText.length && storyText[valueEnd] !== '"' && storyText.charCodeAt(valueEnd) !== 8220 && storyText.charCodeAt(valueEnd) !== 8221) {
              valueEnd++;
            }
            if (valueEnd < storyText.length) {
              const premiseValue = storyText.substring(valueStart + 1, valueEnd);
              result.storyFoundation.premise = cleanExtractedValue(premiseValue);
            }
          }
        }
      }
      ["targetAudience", "comparisons", "tone"].forEach((field) => {
        const match = storyText.match(new RegExp(`"${field}"\\s*:\\s*"([^"]*)"`));
        if (match) result.storyFoundation[field] = cleanExtractedValue(match[1]);
      });
      const subGenresMatch = storyText.match(/"subGenres"\s*:\s*\[(.*?)\]/s);
      if (subGenresMatch) {
        const genres = subGenresMatch[1].match(/"([^"]*)"/g);
        if (genres) {
          result.storyFoundation.subGenres = genres.map((g) => cleanExtractedValue(g.slice(1, -1)));
        }
      }
    }
    const charsStart = text.indexOf('"characters"');
    if (charsStart !== -1) {
      const arrayStart = text.indexOf("[", charsStart);
      if (arrayStart !== -1) {
        let bracketCount = 0;
        let arrayEnd = arrayStart;
        for (let i = arrayStart; i < text.length; i++) {
          if (text[i] === "[") bracketCount++;
          else if (text[i] === "]") {
            bracketCount--;
            if (bracketCount === 0) {
              arrayEnd = i + 1;
              break;
            }
          }
        }
        if (arrayEnd > arrayStart) {
          const charsText = text.substring(arrayStart + 1, arrayEnd - 1);
          const namePattern = /"name"\s*:\s*"([^"]*)"/g;
          result.characters = [];
          let nameMatch;
          while ((nameMatch = namePattern.exec(charsText)) !== null) {
            const nameIndex = nameMatch.index;
            let objStart = charsText.lastIndexOf("{", nameIndex);
            if (objStart === -1) continue;
            let braceCount = 0;
            let objEnd = objStart;
            for (let i = objStart; i < charsText.length; i++) {
              if (charsText[i] === "{") braceCount++;
              else if (charsText[i] === "}") {
                braceCount--;
                if (braceCount === 0) {
                  objEnd = i + 1;
                  break;
                }
              }
            }
            if (objEnd > objStart) {
              const charText = charsText.substring(objStart, objEnd);
              const char = {
                name: cleanExtractedValue(nameMatch[1])
              };
              const roleMatch = charText.match(/"role"\s*:\s*"([^"]*)"/);
              if (roleMatch) char.role = cleanExtractedValue(roleMatch[1]);
              const descMatch = charText.match(/"description"\s*:\s*"((?:[^"\\]|\\.|[\u201C\u201D][^"\u201C\u201D]*[\u201C\u201D])*)"/s);
              if (descMatch) {
                char.description = cleanExtractedValue(descMatch[1]);
              } else {
                const descStart = charText.indexOf('"description"');
                if (descStart !== -1) {
                  const descValueStart = charText.indexOf('"', descStart + 13);
                  if (descValueStart !== -1) {
                    let descValueEnd = descValueStart + 1;
                    while (descValueEnd < charText.length && charText[descValueEnd] !== '"' && charText.charCodeAt(descValueEnd) !== 8220 && charText.charCodeAt(descValueEnd) !== 8221) {
                      descValueEnd++;
                    }
                    if (descValueEnd < charText.length) {
                      char.description = cleanExtractedValue(charText.substring(descValueStart + 1, descValueEnd));
                    }
                  }
                }
              }
              result.characters.push(char);
            }
          }
        }
      }
    }
    const styleMatch = text.match(/"styleProfile"\s*:\s*\{([^}]*)\}/s);
    if (styleMatch) {
      result.styleProfile = {};
    }
    const worldMatch = text.match(/"worldRules"\s*:\s*\{([^}]*)\}/s);
    if (worldMatch) {
      result.worldRules = {};
      const worldText = worldMatch[1];
      const descMatch = worldText.match(/"description"\s*:\s*"((?:[^"\\]|\\.|[\u201C\u201D][^"\u201C\u201D]*[\u201C\u201D])*)"/s);
      if (descMatch) result.worldRules.description = cleanExtractedValue(descMatch[1]);
    }
    const plotStart = text.indexOf('"plotBeats"');
    if (plotStart !== -1) {
      const arrayStart = text.indexOf("[", plotStart);
      if (arrayStart !== -1) {
        let bracketCount = 0;
        let arrayEnd = arrayStart;
        for (let i = arrayStart; i < text.length; i++) {
          if (text[i] === "[") bracketCount++;
          else if (text[i] === "]") {
            bracketCount--;
            if (bracketCount === 0) {
              arrayEnd = i + 1;
              break;
            }
          }
        }
        if (arrayEnd > arrayStart) {
          const beatsText = text.substring(arrayStart, arrayEnd);
          result.plotBeats = [];
          let depth = 0;
          let currentObjStart = -1;
          let inString = false;
          let escapeNext = false;
          for (let i = 0; i < beatsText.length; i++) {
            const char = beatsText[i];
            if (escapeNext) {
              escapeNext = false;
              continue;
            }
            if (char === "\\") {
              escapeNext = true;
              continue;
            }
            if (char === '"' && !escapeNext) {
              inString = !inString;
              continue;
            }
            if (inString) continue;
            if (char === "{") {
              if (depth === 1) {
                currentObjStart = i;
              }
              depth++;
            } else if (char === "}") {
              depth--;
              if (depth === 1 && currentObjStart !== -1) {
                const objText = beatsText.substring(currentObjStart, i + 1);
                const beatTextMatch = objText.match(/"beat"\s*:\s*"((?:[^"\\]|\\.)*)"/);
                if (beatTextMatch) {
                  const beat = {
                    beat: cleanExtractedValue(beatTextMatch[1])
                  };
                  const purposeMatch = objText.match(/"purpose"\s*:\s*"((?:[^"\\]|\\.)*)"/);
                  if (purposeMatch) beat.purpose = cleanExtractedValue(purposeMatch[1]);
                  const chapterMatch = objText.match(/"chapter"\s*:\s*(null|\d+)/);
                  if (chapterMatch) {
                    beat.chapter = chapterMatch[1] === "null" ? null : parseInt(chapterMatch[1]);
                  }
                  const idMatch = objText.match(/"id"\s*:\s*(\d+)/);
                  if (idMatch) beat.id = parseInt(idMatch[1]);
                  const charsMatch = objText.match(/"characters"\s*:\s*\[(.*?)\]/s);
                  if (charsMatch) {
                    const charNames = charsMatch[1].match(/"([^"]*)"/g);
                    if (charNames) {
                      beat.characters = charNames.map((c) => cleanExtractedValue(c.slice(1, -1)));
                    }
                  }
                  const toneMatch = objText.match(/"emotionalTone"\s*:\s*"((?:[^"\\]|\\.)*)"/);
                  if (toneMatch) beat.emotionalTone = cleanExtractedValue(toneMatch[1]);
                  result.plotBeats.push(beat);
                }
                currentObjStart = -1;
              }
            }
          }
          console.log(`[Regex Extractor] Found ${result.plotBeats.length} plot beats`);
          if (result.plotBeats.length > 0) {
            console.log("[Regex Extractor] First beat:", (_a = result.plotBeats[0].beat) == null ? void 0 : _a.substring(0, 50));
            console.log("[Regex Extractor] Last beat:", (_b = result.plotBeats[result.plotBeats.length - 1].beat) == null ? void 0 : _b.substring(0, 50));
          }
        }
      }
    }
    return result;
  }
  function cleanExtractedValue(value) {
    if (!value) return "";
    return value.replace(/[\u201C\u201D\u201E\u201F]/g, '"').replace(/[\u2018\u2019]/g, "'").replace(/—/g, "-").replace(/–/g, "-").replace(/…/g, "...").replace(/\s+/g, " ").trim();
  }
  var promptTemplates, formatForClipboard, parseExternalAIResponse, promptTemplates_default;
  var init_promptTemplates = __esm({
    "src/services/promptTemplates.js"() {
      promptTemplates = {
        /**
         * Style Analysis Prompt - Analyzes a chapter for writing style
         */
        styleAnalysis: (chapterText) => `You are analyzing a writer's style for a writing assistant app.

Read the following chapter and analyze the writing style. Return your analysis EXACTLY in this JSON format (no other text, just the JSON):

{
  "voiceProfile": {
    "narratorTone": "How the narrator 'sounds' - formal, casual, sardonic, detached, intimate, etc.",
    "sentenceStructure": "One of: short, medium, long, varied",
    "vocabularyLevel": "One of: simple, moderate, advanced, mixed",
    "humorStyle": ["Array of humor types used: absurdist, dry, wordplay, situational, dark, slapstick, ironic, satirical, deadpan, etc."],
    "darkElements": ["Array of dark elements: body horror, existential dread, violence, despair, psychological horror, cosmic horror, bureaucratic nightmare, etc."],
    "uniquePatterns": ["Array of distinctive patterns you notice - specific phrases, rhythms, techniques"]
  },
  "comedyRules": {
    "whatMakesItFunny": ["Array of specific things that create humor in this writing"],
    "comedyTiming": "How jokes are delivered - buildup and payoff, subversion, understatement, escalation, etc.",
    "neverDo": ["Types of humor that would NOT fit this style"]
  },
  "toneBalance": {
    "comedyPercent": 60,
    "horrorPercent": 40,
    "emotionalDepthDescription": "How deep do emotional moments go? Surface-level, medium, deeply affecting?"
  },
  "pacing": {
    "sceneLength": "One of: short, medium, long, varied",
    "actionToDialogueRatio": "Percentage estimate, e.g., '40% action, 60% dialogue'",
    "breathingRoom": "Does it give readers time to process heavy moments? Yes/No/Sometimes"
  },
  "worldBuilding": {
    "expositionStyle": "How is world info delivered? Naturally woven, info dumps, character dialogue, etc.",
    "detailDensity": "One of: sparse, moderate, rich, overwhelming"
  },
  "comparisons": ["Array of similar works, authors, or shows this reminds you of"]
}

=== CHAPTER TO ANALYZE ===
${chapterText}`,
        /**
         * Style Analysis from Idea - When user only has an idea, not a chapter
         */
        styleAnalysisFromIdea: (ideaDescription, comparisons) => `You are helping a writer define their style for a writing assistant app.

Based on the story idea and influences below, create a comprehensive style profile. Return EXACTLY in this JSON format (no other text, just the JSON):

{
  "voiceProfile": {
    "narratorTone": "Recommended narrator voice based on the influences",
    "sentenceStructure": "One of: short, medium, long, varied",
    "vocabularyLevel": "One of: simple, moderate, advanced, mixed",
    "humorStyle": ["Array of humor types that would fit: absurdist, dry, wordplay, situational, dark, slapstick, ironic, satirical, deadpan, etc."],
    "darkElements": ["Array of dark elements that fit: body horror, existential dread, violence, despair, psychological horror, cosmic horror, bureaucratic nightmare, etc."],
    "uniquePatterns": ["Array of suggested distinctive techniques based on the influences"]
  },
  "comedyRules": {
    "whatMakesItFunny": ["Array of comedy techniques that would work for this story"],
    "comedyTiming": "Recommended joke delivery style",
    "neverDo": ["Types of humor to avoid based on the tone"]
  },
  "toneBalance": {
    "comedyPercent": 60,
    "horrorPercent": 40,
    "emotionalDepthDescription": "Recommended emotional depth"
  },
  "pacing": {
    "sceneLength": "One of: short, medium, long, varied",
    "actionToDialogueRatio": "Recommended ratio",
    "breathingRoom": "Recommendation for pacing"
  },
  "worldBuilding": {
    "expositionStyle": "Recommended exposition approach",
    "detailDensity": "One of: sparse, moderate, rich"
  },
  "comparisons": ["The influences provided plus any others that fit"]
}

=== STORY IDEA ===
${ideaDescription}

=== INFLUENCES/COMPARISONS ===
${comparisons}`,
        /**
         * Character Voice Analysis - Analyze how a specific character speaks
         */
        characterVoice: (characterName, characterDescription, dialogueSamples) => `You are analyzing a character's voice for a writing assistant app.

Analyze how ${characterName} speaks based on the description and dialogue samples. Return EXACTLY in this JSON format (no other text, just the JSON):

{
  "characterId": "${characterName.toLowerCase().replace(/\s+/g, "_")}",
  "characterName": "${characterName}",
  "voiceProfile": {
    "speechPatterns": "How they construct sentences - formal, fragmented, eloquent, gruff, etc.",
    "vocabularyChoices": ["Array of words/phrases they would use"],
    "vocabularyAvoid": ["Array of words/phrases they would NEVER use"],
    "emotionalRange": "How do they express emotions? Stoic, explosive, passive-aggressive, etc.",
    "quirks": ["Array of verbal quirks - catchphrases, speech impediments, habits"],
    "internalVsExternal": "Do they say what they think, or hide their true feelings?"
  },
  "dialogueStyle": {
    "averageLength": "One of: terse, medium, verbose",
    "formality": "One of: very formal, formal, casual, very casual, varies by situation",
    "humor": "How do they use humor? Never, occasionally, constantly, accidentally funny, etc."
  },
  "exampleDialogue": [
    "Generate 5 example lines this character would say in different situations"
  ],
  "interactionNotes": {
    "withAuthority": "How they speak to authority figures",
    "withFriends": "How they speak to friends/allies", 
    "underStress": "How their speech changes under pressure",
    "whenAngry": "How they express anger verbally"
  }
}

=== CHARACTER DESCRIPTION ===
${characterDescription}

=== DIALOGUE SAMPLES (if available) ===
${dialogueSamples || "No samples provided - please infer from description"}`,
        /**
         * Plot Outline Generation - Create chapter-by-chapter beats
         */
        plotOutline: (premise, genre, chapterCount) => `You are creating a plot outline for a writing assistant app.

Based on the premise below, create a chapter-by-chapter plot outline. Return EXACTLY in this JSON format (no other text, just the JSON):

{
  "title": "Suggested title based on premise",
  "logline": "One-sentence summary of the story",
  "themes": ["Array of main themes"],
  "plotBeats": [
    {
      "id": 1,
      "chapter": 1,
      "beat": "Short description of what happens",
      "purpose": "Why this beat matters to the story",
      "characters": ["Characters involved"],
      "emotionalTone": "The mood of this section",
      "completed": false
    }
  ],
  "arcs": {
    "mainPlot": "Description of the main story arc",
    "subplots": ["Array of subplot descriptions"]
  },
  "keyMoments": {
    "incitingIncident": "What kicks off the story",
    "midpoint": "The major turn in the middle",
    "climax": "The peak of conflict",
    "resolution": "How it ends"
  }
}

=== STORY PREMISE ===
${premise}

=== GENRE ===
${genre}

=== TARGET CHAPTER COUNT ===
${chapterCount || "Suggest appropriate number"}`,
        /**
         * World Rules Definition - Extract world-building rules
         */
        worldRules: (worldDescription, genre) => `You are defining world rules for a writing assistant app.

Based on the world description, extract and organize the rules of this story world. Return EXACTLY in this JSON format (no other text, just the JSON):

{
  "worldName": "Name of the world/setting if mentioned",
  "coreRules": [
    {
      "rule": "A fundamental rule of this world",
      "implications": "What this means for the story",
      "exceptions": "Any known exceptions"
    }
  ],
  "magicOrTech": {
    "exists": true,
    "type": "Magic, technology, both, neither",
    "limitations": ["What it cannot do"],
    "costs": ["What using it costs"],
    "rules": ["Specific rules for how it works"]
  },
  "society": {
    "structure": "How society is organized",
    "conflicts": ["Major societal conflicts"],
    "norms": ["Social norms characters must navigate"]
  },
  "tone": {
    "realism": "One of: grounded, heightened, absurd",
    "consequences": "Are actions consequential? Always, sometimes, rarely",
    "deathRules": "Can main characters die? How is death treated?"
  },
  "doNotBreak": [
    "Rules that should NEVER be broken for story consistency"
  ],
  "canBend": [
    "Rules that can be bent for dramatic effect"
  ]
}

=== WORLD DESCRIPTION ===
${worldDescription}

=== GENRE ===
${genre}`,
        /**
         * Chapter Summary Generation - Summarize a completed chapter
         */
        chapterSummary: (chapterText, chapterNumber, existingCharacters) => `You are summarizing a chapter for a writing assistant app's memory system.

Read this chapter and create a comprehensive summary for future reference. Return EXACTLY in this JSON format (no other text, just the JSON):

{
  "chapterNumber": ${chapterNumber},
  "summary": "2-3 paragraph summary of what happened",
  "keyEvents": [
    {
      "event": "Description of important event",
      "characters": ["Characters involved"],
      "significance": "Why this matters"
    }
  ],
  "characterUpdates": [
    {
      "character": "Character name",
      "stateChange": "How their state changed (mood, inventory, location, relationships)",
      "newInfo": "Any new information revealed about them"
    }
  ],
  "plotBeatsAdvanced": [
    "List any plot points that were advanced or resolved"
  ],
  "newElements": {
    "characters": ["Any new characters introduced"],
    "items": ["Any new items introduced"],
    "locations": ["Any new locations"],
    "concepts": ["Any new world concepts revealed"]
  },
  "openThreads": [
    "Plot threads left open for future chapters"
  ],
  "moodProgression": {
    "startMood": "How the chapter begins emotionally",
    "endMood": "How the chapter ends emotionally",
    "majorShifts": ["Any major emotional shifts during the chapter"]
  },
  "quotableLines": [
    "Any particularly memorable or important lines of dialogue"
  ]
}

=== CHAPTER ${chapterNumber} ===
${chapterText}

=== EXISTING CHARACTERS (for reference) ===
${existingCharacters || "None provided"}`,
        /**
         * Style Evolution Review - Compare recent chapters to original style
         */
        styleEvolution: (originalStyle, recentChapters, reviewNumber) => `You are conducting a style evolution review for a writing assistant app.

Compare the recent chapters to the original style profile and identify how the writer's style has evolved. Return EXACTLY in this JSON format (no other text, just the JSON):

{
  "reviewNumber": ${reviewNumber},
  "overallAssessment": "Has the style evolved, remained consistent, or drifted?",
  "consistentElements": [
    "Elements that have stayed true to the original style"
  ],
  "evolvedElements": [
    {
      "element": "What has changed",
      "original": "How it was originally",
      "current": "How it is now",
      "assessment": "Is this evolution positive, negative, or neutral?"
    }
  ],
  "recommendations": [
    {
      "suggestion": "Specific suggestion for the writer",
      "reason": "Why this would help"
    }
  ],
  "updatedProfile": {
    "voiceProfile": {
      "narratorTone": "Updated if changed",
      "sentenceStructure": "Updated if changed",
      "vocabularyLevel": "Updated if changed",
      "humorStyle": ["Updated array if changed"],
      "darkElements": ["Updated array if changed"],
      "uniquePatterns": ["Updated array - add any new patterns discovered"]
    },
    "comedyRules": {
      "whatMakesItFunny": ["Updated if changed"],
      "comedyTiming": "Updated if changed",
      "neverDo": ["Updated if changed"]
    },
    "toneBalance": {
      "comedyPercent": 60,
      "horrorPercent": 40,
      "emotionalDepthDescription": "Updated if changed"
    }
  },
  "strengthsIdentified": [
    "Writing strengths that have emerged"
  ],
  "areasToWatch": [
    "Areas where the style might be drifting unintentionally"
  ]
}

=== ORIGINAL STYLE PROFILE ===
${JSON.stringify(originalStyle, null, 2)}

=== RECENT CHAPTERS (last 5) ===
${recentChapters}`,
        /**
         * Chapter Planning - Generate chapter plan for Canvas-style editing
         */
        chapterPlan: (chapterNumber, previousChapterSummary, availableCharacters, availableItems, remainingPlotBeats, styleProfile, moodSliders) => `You are planning a chapter for a writing assistant app.

Create a detailed chapter plan that the writer can edit before generation. Return EXACTLY in this JSON format (no other text, just the JSON):

{
  "chapterNumber": ${chapterNumber},
  "suggestedTitle": "A title for this chapter",
  "actorsToUse": [
    {
      "name": "Character name",
      "currentState": "Their state from previous chapter",
      "roleInChapter": "What they'll do in this chapter",
      "isNew": false
    }
  ],
  "suggestedNewActors": [
    {
      "name": "Suggested new character",
      "description": "Brief description",
      "purpose": "Why introduce them now"
    }
  ],
  "plotBeatsToAddress": [
    {
      "beat": "Plot beat from the roadmap",
      "howToAddress": "How this chapter will handle it"
    }
  ],
  "itemsInPlay": [
    {
      "item": "Item name",
      "holder": "Who has it",
      "relevance": "How it might be used"
    }
  ],
  "suggestedMood": {
    "comedy_horror": ${(moodSliders == null ? void 0 : moodSliders.comedy_horror) || 60},
    "action_dialogue": ${(moodSliders == null ? void 0 : moodSliders.action_dialogue) || 50},
    "pacing": ${(moodSliders == null ? void 0 : moodSliders.pacing) || 50},
    "tone": ${(moodSliders == null ? void 0 : moodSliders.tone) || 40},
    "detail": ${(moodSliders == null ? void 0 : moodSliders.detail) || 60},
    "emotional": ${(moodSliders == null ? void 0 : moodSliders.emotional) || 50},
    "despair": ${(moodSliders == null ? void 0 : moodSliders.despair) || 30},
    "tension": ${(moodSliders == null ? void 0 : moodSliders.tension) || 40}
  },
  "chapterOutline": [
    {
      "scene": 1,
      "description": "What happens in this scene",
      "purpose": "Why this scene matters",
      "characters": ["Characters in scene"],
      "mood": "Emotional tone of scene"
    }
  ],
  "connectionToPrevious": "How this chapter connects to the last one",
  "setupForNext": "What this chapter sets up for future chapters",
  "potentialChallenges": [
    "Things to watch out for while writing this chapter"
  ]
}

=== CHAPTER NUMBER ===
${chapterNumber}

=== PREVIOUS CHAPTER SUMMARY ===
${previousChapterSummary || "This is the first chapter"}

=== AVAILABLE CHARACTERS ===
${JSON.stringify(availableCharacters, null, 2)}

=== AVAILABLE ITEMS ===
${JSON.stringify(availableItems, null, 2)}

=== REMAINING PLOT BEATS ===
${JSON.stringify(remainingPlotBeats, null, 2)}

=== STYLE PROFILE ===
${JSON.stringify(styleProfile, null, 2)}`,
        /**
         * Chapter Generation - Actually write the chapter
         */
        chapterGeneration: (chapterPlan, styleProfile, characterVoices, previousChapterFull, chapterOverviews, worldRules, moodSliders) => `You are writing a chapter for a novel. Follow the style guide EXACTLY.

Write Chapter ${chapterPlan.chapterNumber}: "${chapterPlan.suggestedTitle}"

CRITICAL INSTRUCTIONS:
1. Match the style profile EXACTLY - this is the writer's voice
2. Use the character voices for all dialogue
3. Follow the chapter plan's scenes and beats
4. Maintain continuity with previous chapters
5. Apply the mood settings throughout

=== STYLE GUIDE (FOLLOW THIS EXACTLY) ===
${JSON.stringify(styleProfile, null, 2)}

=== CHARACTER VOICES (USE THESE FOR DIALOGUE) ===
${JSON.stringify(characterVoices, null, 2)}

=== CHAPTER PLAN ===
${JSON.stringify(chapterPlan, null, 2)}

=== MOOD SETTINGS ===
Comedy vs Horror: ${(moodSliders == null ? void 0 : moodSliders.comedy_horror) || 60}% comedy
Action vs Dialogue: ${(moodSliders == null ? void 0 : moodSliders.action_dialogue) || 50}% action
Pacing: ${(moodSliders == null ? void 0 : moodSliders.pacing) || 50}% (0=slow, 100=fast)
Tone: ${(moodSliders == null ? void 0 : moodSliders.tone) || 40}% dark
Detail Density: ${(moodSliders == null ? void 0 : moodSliders.detail) || 60}%
Emotional Intensity: ${(moodSliders == null ? void 0 : moodSliders.emotional) || 50}%
Despair Level: ${(moodSliders == null ? void 0 : moodSliders.despair) || 30}%
Tension: ${(moodSliders == null ? void 0 : moodSliders.tension) || 40}%

=== PREVIOUS CHAPTER (for continuity) ===
${previousChapterFull || "This is the first chapter"}

=== STORY SO FAR (chapter summaries) ===
${chapterOverviews || "No previous chapters"}

=== WORLD RULES ===
${worldRules || "No specific rules defined"}

Now write the full chapter. Make it approximately 2000-3000 words. Include all scenes from the plan.`,
        /**
         * Text Expansion - Expand selected text
         */
        textExpansion: (selectedText, surroundingContext, styleProfile, expansionLength) => `You are expanding text for a novel. Match the style EXACTLY.

Expand the selected text into ${expansionLength || "2-3 paragraphs"}. 

CRITICAL: Match the style profile exactly. This must feel like it was written by the same author.

=== STYLE TO MATCH ===
${JSON.stringify(styleProfile, null, 2)}

=== SURROUNDING CONTEXT ===
${surroundingContext}

=== TEXT TO EXPAND ===
${selectedText}

Write the expanded version now. Only output the expanded text, nothing else.`,
        /**
         * Text Rewrite - Rewrite selected text
         */
        textRewrite: (selectedText, surroundingContext, styleProfile, rewriteInstructions) => `You are rewriting text for a novel. Match the style EXACTLY.

Rewrite the selected text${rewriteInstructions ? ` with these instructions: ${rewriteInstructions}` : ""}.

CRITICAL: Match the style profile exactly. This must feel like it was written by the same author.

=== STYLE TO MATCH ===
${JSON.stringify(styleProfile, null, 2)}

=== SURROUNDING CONTEXT ===
${surroundingContext}

=== TEXT TO REWRITE ===
${selectedText}

Write the rewritten version now. Only output the rewritten text, nothing else.`,
        /**
         * MEGA PROMPT: Quick Import - Collects ALL story information at once
         * For users who already have their story set up in ChatGPT
         */
        quickImport: (existingContext = "") => `You are helping a writer set up their story universe in a writing assistant app.

Based on our conversation history and everything you know about my story, create a COMPLETE story profile. Return ONLY valid JSON (no other text, no markdown code blocks, just the raw JSON):

${existingContext ? `ADDITIONAL CONTEXT FROM WRITER:
${existingContext}

` : ""}Return this EXACT structure filled with my story's information:

{
  "storyFoundation": {
    "title": "Story title",
    "genre": "One of: fantasy, rpg-lite, horror, comedy, sci-fi, literary, thriller, romance",
    "subGenres": ["Array of sub-genres that apply"],
    "premise": "2-3 paragraph story premise - what's it about, what makes it unique, main conflicts",
    "targetAudience": "One of: ya, adult, all-ages, mature",
    "comparisons": "It's like X meets Y meets Z",
    "tone": "Brief description of overall tone"
  },
  "styleProfile": {
    "voiceProfile": {
      "narratorTone": "How the narrator sounds - sardonic, intimate, detached, etc.",
      "sentenceStructure": "One of: short, medium, long, varied",
      "vocabularyLevel": "One of: simple, moderate, advanced, mixed",
      "humorStyle": ["Array: absurdist, dry, wordplay, situational, dark, slapstick, ironic, satirical, deadpan"],
      "darkElements": ["Array: body horror, existential dread, violence, despair, psychological, cosmic, bureaucratic"],
      "uniquePatterns": ["Array of distinctive writing patterns, phrases, techniques"]
    },
    "comedyRules": {
      "whatMakesItFunny": ["Array of specific things that create humor"],
      "comedyTiming": "How jokes are delivered",
      "neverDo": ["Types of humor to avoid"]
    },
    "toneBalance": {
      "comedyPercent": 60,
      "horrorPercent": 40,
      "emotionalDepthDescription": "How deep do emotional moments go?"
    },
    "pacing": {
      "sceneLength": "One of: short, medium, long, varied",
      "actionToDialogueRatio": "e.g., 40% action, 60% dialogue",
      "breathingRoom": "Yes/No/Sometimes"
    },
    "comparisons": ["Array of similar works/authors/shows"]
  },
  "characters": [
    {
      "name": "Character name",
      "role": "Protagonist/Antagonist/Sidekick/etc.",
      "description": "Brief character description and personality",
      "voiceProfile": {
        "speechPatterns": "How they construct sentences",
        "vocabularyChoices": ["Words/phrases they use"],
        "vocabularyAvoid": ["Words they'd never use"],
        "emotionalRange": "How they express emotions",
        "quirks": ["Verbal quirks, catchphrases"],
        "internalVsExternal": "Do they say what they think?"
      },
      "exampleDialogue": ["3-5 example lines they would say"]
    }
  ],
  "worldRules": {
    "description": "Overall world description",
    "coreRules": [
      {
        "rule": "A fundamental rule of this world",
        "implications": "What this means for the story"
      }
    ],
    "magicOrTech": {
      "exists": true,
      "type": "Magic/Technology/Both/Neither",
      "limitations": ["What it cannot do"],
      "costs": ["What using it costs"]
    },
    "tone": {
      "realism": "One of: grounded, heightened, absurd",
      "consequences": "Always/Sometimes/Rarely",
      "deathRules": "How is death treated?"
    },
    "doNotBreak": ["Rules that should NEVER be broken"],
    "canBend": ["Rules that can be bent for drama"]
  },
  "plotBeats": [
    {
      "beat": "What happens",
      "chapter": null,
      "purpose": "Why this matters",
      "characters": ["Characters involved"],
      "emotionalTone": "Mood of this beat"
    }
  ],
  "moodDefaults": {
    "comedy_horror": 60,
    "action_dialogue": 50,
    "pacing": 50,
    "tone": 40,
    "detail": 60,
    "emotional": 50,
    "despair": 30,
    "tension": 40
  }
}

Fill in ALL fields based on what you know about my story. Be specific and detailed. Include ALL main characters. Include ALL major plot beats you're aware of. If you don't know something specific, make your best inference based on the genre and tone we've discussed.`
      };
      formatForClipboard = (promptText) => {
        return `--- COPY EVERYTHING BELOW THIS LINE ---

${promptText}

--- COPY EVERYTHING ABOVE THIS LINE ---`;
      };
      parseExternalAIResponse = (responseText) => {
        if (!responseText || typeof responseText !== "string") {
          throw new Error("No response text provided");
        }
        let cleanedText = responseText.trim().replace(/^\uFEFF/, "").replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"').replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'").replace(/[\u2013\u2014]/g, "-").replace(/[\u2026]/g, "...").replace(/[\u00A0]/g, " ").replace(/\\\\"/g, '\\"').replace(/\\\\n/g, "\\n");
        console.log("[JSON Parser] Input preview:", cleanedText.substring(0, 200));
        try {
          return JSON.parse(cleanedText);
        } catch (e1) {
        }
        const codeBlockMatch = cleanedText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlockMatch) {
          try {
            const codeContent = codeBlockMatch[1].trim();
            return JSON.parse(aggressiveJsonRepair(codeContent));
          } catch (e2) {
          }
        }
        const firstBrace = cleanedText.indexOf("{");
        const lastBrace = cleanedText.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          const jsonCandidate = cleanedText.substring(firstBrace, lastBrace + 1);
          const repairStrategies = [
            () => jsonCandidate,
            // Original
            () => jsonCandidate.replace(/,(\s*[}\]])/g, "$1"),
            // Trailing commas
            () => aggressiveJsonRepair(jsonCandidate),
            // Aggressive repair
            () => escapeAllSmartQuotesInStrings(jsonCandidate),
            // Smart quote escape
            () => repairJsonString(jsonCandidate)
            // Full repair
          ];
          for (let i = 0; i < repairStrategies.length; i++) {
            try {
              const repaired = repairStrategies[i]();
              if (repaired) {
                const parsed = JSON.parse(repaired);
                console.log(`JSON parsed successfully using strategy ${i + 1}`, {
                  hasCharacters: Array.isArray(parsed.characters),
                  charactersCount: Array.isArray(parsed.characters) ? parsed.characters.length : 0,
                  hasPlotBeats: Array.isArray(parsed.plotBeats),
                  plotBeatsCount: Array.isArray(parsed.plotBeats) ? parsed.plotBeats.length : 0
                });
                return parsed;
              }
            } catch (e) {
              if (i === repairStrategies.length - 1) {
                console.warn("All repair strategies failed, last error:", e.message);
              }
            }
          }
        }
        try {
          const extracted = extractDataFromBrokenJson(cleanedText);
          if (extracted && Object.keys(extracted).length > 0) {
            console.warn("Used regex extraction fallback - some data may be incomplete");
            return extracted;
          }
        } catch (e) {
        }
        let errorHint = "";
        if (!cleanedText.includes("{")) {
          errorHint = " The response doesn't appear to contain JSON (no { found).";
        } else if (!cleanedText.includes("}")) {
          errorHint = " The JSON appears to be incomplete (no closing } found).";
        } else {
          errorHint = " Could not parse JSON even after multiple repair attempts.";
        }
        throw new Error(`Could not parse JSON from response.${errorHint} Please try copying the JSON again or ask ChatGPT to return it in a code block.`);
      };
      promptTemplates_default = promptTemplates;
    }
  });

  // src/services/contextEngine.js
  var ContextEngine, contextEngine, contextEngine_default;
  var init_contextEngine = __esm({
    "src/services/contextEngine.js"() {
      init_database();
      init_promptTemplates();
      ContextEngine = class {
        constructor() {
          this.cache = {
            styleProfile: null,
            characterVoices: {},
            worldRules: null,
            lastUpdated: null
          };
        }
        /**
         * Clear cached data
         */
        clearCache() {
          this.cache = {
            styleProfile: null,
            characterVoices: {},
            worldRules: null,
            lastUpdated: null
          };
        }
        /**
         * Get the story profile (style, genre, etc.)
         */
        async getStoryProfile() {
          try {
            const profile = await database_default.get("storyProfile", "main_profile");
            return profile || null;
          } catch (error) {
            console.error("Error getting story profile:", error);
            return null;
          }
        }
        /**
         * Save/update story profile
         */
        async saveStoryProfile(profileData) {
          try {
            const profile = {
              id: "main_profile",
              ...profileData,
              updatedAt: Date.now()
            };
            await database_default.update("storyProfile", profile);
            this.cache.styleProfile = profile;
            return profile;
          } catch (error) {
            console.error("Error saving story profile:", error);
            throw error;
          }
        }
        /**
         * Get style profile from story profile
         */
        async getStyleProfile() {
          if (this.cache.styleProfile) {
            return this.cache.styleProfile.styleProfile || this.cache.styleProfile;
          }
          const profile = await this.getStoryProfile();
          if (profile) {
            this.cache.styleProfile = profile;
            return profile.styleProfile || profile;
          }
          return null;
        }
        /**
         * Get character voice profile
         */
        async getCharacterVoice(actorId) {
          if (this.cache.characterVoices[actorId]) {
            return this.cache.characterVoices[actorId];
          }
          try {
            const voices = await database_default.getByIndex("characterVoices", "actorId", actorId);
            if (voices && voices.length > 0) {
              this.cache.characterVoices[actorId] = voices[0];
              return voices[0];
            }
            return null;
          } catch (error) {
            console.error("Error getting character voice:", error);
            return null;
          }
        }
        /**
         * Get all character voices for given actors
         */
        async getCharacterVoices(actorIds) {
          const voices = {};
          for (const actorId of actorIds) {
            const voice = await this.getCharacterVoice(actorId);
            if (voice) {
              voices[actorId] = voice;
            }
          }
          return voices;
        }
        /**
         * Save character voice profile
         */
        async saveCharacterVoice(actorId, voiceData) {
          try {
            const voice = {
              id: `voice_${actorId}`,
              actorId,
              ...voiceData,
              updatedAt: Date.now()
            };
            await database_default.update("characterVoices", voice);
            this.cache.characterVoices[actorId] = voice;
            return voice;
          } catch (error) {
            console.error("Error saving character voice:", error);
            throw error;
          }
        }
        /**
         * Get world rules
         */
        async getWorldRules() {
          if (this.cache.worldRules) {
            return this.cache.worldRules;
          }
          const profile = await this.getStoryProfile();
          if (profile && profile.worldRules) {
            this.cache.worldRules = profile.worldRules;
            return profile.worldRules;
          }
          return null;
        }
        /**
         * Get all plot beats
         */
        async getPlotBeats() {
          try {
            const beats = await database_default.getAll("plotBeats");
            return beats.sort((a, b) => (a.order || 0) - (b.order || 0));
          } catch (error) {
            console.error("Error getting plot beats:", error);
            return [];
          }
        }
        /**
         * Get remaining (incomplete) plot beats
         */
        async getRemainingPlotBeats() {
          const beats = await this.getPlotBeats();
          return beats.filter((b) => !b.completed);
        }
        /**
         * Get plot beats for a specific chapter
         */
        async getPlotBeatsForChapter(chapterNumber) {
          const beats = await this.getPlotBeats();
          return beats.filter((b) => b.targetChapter === chapterNumber || !b.completed && !b.targetChapter);
        }
        /**
         * Mark plot beat as completed
         */
        async completePlotBeat(beatId, chapterNumber) {
          try {
            const beat = await database_default.get("plotBeats", beatId);
            if (beat) {
              beat.completed = true;
              beat.completedInChapter = chapterNumber;
              beat.completedAt = Date.now();
              await database_default.update("plotBeats", beat);
            }
            return beat;
          } catch (error) {
            console.error("Error completing plot beat:", error);
            throw error;
          }
        }
        /**
         * Update plot beat status (toggle complete/incomplete)
         */
        async updatePlotBeatStatus(beatId, completed) {
          try {
            const beat = await database_default.get("plotBeats", beatId);
            if (beat) {
              beat.completed = completed;
              if (completed) {
                beat.completedAt = Date.now();
              } else {
                beat.completedAt = null;
                beat.completedInChapter = null;
              }
              await database_default.update("plotBeats", beat);
            }
            return beat;
          } catch (error) {
            console.error("Error updating plot beat status:", error);
            throw error;
          }
        }
        /**
         * Add new plot beat (uses upsert to avoid duplicate key errors)
         */
        async addPlotBeat(beatData) {
          var _a;
          try {
            const beats = await this.getPlotBeats();
            const maxOrder = beats.reduce((max, b) => Math.max(max, b.order || 0), 0);
            const uniqueId = beatData.id || `beat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const beat = {
              ...beatData,
              id: uniqueId,
              completed: (_a = beatData.completed) != null ? _a : false,
              order: beatData.order || maxOrder + 1,
              createdAt: beatData.createdAt || Date.now()
            };
            await database_default.update("plotBeats", beat);
            return beat;
          } catch (error) {
            console.error("Error adding plot beat:", error);
            throw error;
          }
        }
        /**
         * Save multiple plot beats at once (replaces existing)
         */
        async savePlotBeats(beatsArray) {
          try {
            const beats = await this.getPlotBeats();
            const maxOrder = beats.reduce((max, b) => Math.max(max, b.order || 0), 0);
            const processedBeats = beatsArray.map((beatData, idx) => {
              var _a;
              const uniqueId = beatData.id || `beat_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 9)}`;
              return {
                ...beatData,
                id: uniqueId,
                completed: (_a = beatData.completed) != null ? _a : false,
                order: beatData.order || maxOrder + idx + 1,
                createdAt: beatData.createdAt || Date.now()
              };
            });
            await database_default.bulkUpdate("plotBeats", processedBeats);
            return processedBeats;
          } catch (error) {
            console.error("Error saving plot beats:", error);
            throw error;
          }
        }
        /**
         * Get chapter overview by book and chapter number
         */
        async getChapterOverview(bookId, chapterNumber) {
          try {
            const overviews = await database_default.getByIndex("chapterOverviews", "bookId", bookId);
            return overviews.find((o) => o.chapterNumber === chapterNumber) || null;
          } catch (error) {
            console.error("Error getting chapter overview:", error);
            return null;
          }
        }
        /**
         * Get all chapter overviews up to a specific chapter
         */
        async getAllOverviews(bookId, upToChapter) {
          try {
            const overviews = await database_default.getByIndex("chapterOverviews", "bookId", bookId);
            return overviews.filter((o) => o.chapterNumber < upToChapter).sort((a, b) => a.chapterNumber - b.chapterNumber);
          } catch (error) {
            console.error("Error getting chapter overviews:", error);
            return [];
          }
        }
        /**
         * Save chapter overview
         */
        async saveChapterOverview(bookId, chapterNumber, overviewData) {
          try {
            const overview = {
              id: `overview_${bookId}_${chapterNumber}`,
              bookId,
              chapterNumber,
              ...overviewData,
              updatedAt: Date.now()
            };
            await database_default.update("chapterOverviews", overview);
            return overview;
          } catch (error) {
            console.error("Error saving chapter overview:", error);
            throw error;
          }
        }
        /**
         * Get entity state for a specific chapter
         */
        async getEntityState(entityId, entityType, bookId, chapterNumber) {
          try {
            const states = await database_default.getByIndex("entityChapterStates", "entityId", entityId);
            return states.find(
              (s) => s.entityType === entityType && s.bookId === bookId && s.chapterNumber === chapterNumber
            ) || null;
          } catch (error) {
            console.error("Error getting entity state:", error);
            return null;
          }
        }
        /**
         * Get latest entity state up to a chapter
         */
        async getLatestEntityState(entityId, entityType, bookId, upToChapter) {
          try {
            const states = await database_default.getByIndex("entityChapterStates", "entityId", entityId);
            const relevantStates = states.filter(
              (s) => s.entityType === entityType && s.bookId === bookId && s.chapterNumber <= upToChapter
            ).sort((a, b) => b.chapterNumber - a.chapterNumber);
            return relevantStates[0] || null;
          } catch (error) {
            console.error("Error getting latest entity state:", error);
            return null;
          }
        }
        /**
         * Save entity state for a chapter
         */
        async saveEntityState(entityId, entityType, bookId, chapterNumber, stateData) {
          try {
            const state = {
              id: `state_${entityType}_${entityId}_${bookId}_${chapterNumber}`,
              entityId,
              entityType,
              bookId,
              chapterNumber,
              ...stateData,
              updatedAt: Date.now()
            };
            await database_default.update("entityChapterStates", state);
            return state;
          } catch (error) {
            console.error("Error saving entity state:", error);
            throw error;
          }
        }
        /**
         * Get actor states for chapter context
         */
        async getActorStates(actorIds, bookId, upToChapter) {
          const states = [];
          for (const actorId of actorIds) {
            const state = await this.getLatestEntityState(actorId, "actor", bookId, upToChapter);
            if (state) {
              states.push(state);
            } else {
              try {
                const actor = await database_default.get("actors", actorId);
                if (actor) {
                  states.push({
                    entityId: actorId,
                    entityType: "actor",
                    name: actor.name,
                    baseInfo: true,
                    ...actor
                  });
                }
              } catch (e) {
                console.warn(`Could not get actor ${actorId}`);
              }
            }
          }
          return states;
        }
        /**
         * Get full chapter text
         */
        async getFullChapter(bookId, chapterNumber) {
          try {
            const book = await database_default.get("books", bookId);
            if (book && book.chapters) {
              const chapter = book.chapters.find((c) => c.number === chapterNumber || c.id === `ch_${chapterNumber}`);
              return (chapter == null ? void 0 : chapter.content) || null;
            }
            return null;
          } catch (error) {
            console.error("Error getting full chapter:", error);
            return null;
          }
        }
        /**
         * Get all available items
         */
        async getAvailableItems() {
          try {
            return await database_default.getAll("itemBank");
          } catch (error) {
            console.error("Error getting items:", error);
            return [];
          }
        }
        /**
         * Get all available actors
         */
        async getAvailableActors() {
          try {
            return await database_default.getAll("actors");
          } catch (error) {
            console.error("Error getting actors:", error);
            return [];
          }
        }
        /**
         * MAIN METHOD: Assemble all context for chapter generation
         */
        async assembleChapterContext(bookId, chapterNumber, selectedActorIds = [], selectedItemIds = []) {
          var _a;
          console.log(`[ContextEngine] Assembling context for Book ${bookId}, Chapter ${chapterNumber}`);
          const [
            styleProfile,
            worldRules,
            plotBeats,
            previousChapter,
            chapterOverviews,
            allActors,
            allItems
          ] = await Promise.all([
            this.getStyleProfile(),
            this.getWorldRules(),
            this.getPlotBeatsForChapter(chapterNumber),
            this.getFullChapter(bookId, chapterNumber - 1),
            this.getAllOverviews(bookId, chapterNumber),
            this.getAvailableActors(),
            this.getAvailableItems()
          ]);
          const actorIdsToUse = selectedActorIds.length > 0 ? selectedActorIds : allActors.map((a) => a.id);
          const actorStates = await this.getActorStates(actorIdsToUse, bookId, chapterNumber - 1);
          const characterVoices = await this.getCharacterVoices(actorIdsToUse);
          const itemsInPlay = selectedItemIds.length > 0 ? allItems.filter((i) => selectedItemIds.includes(i.id)) : allItems;
          return {
            // Core profile data
            styleProfile,
            worldRules,
            // Story progress
            plotBeats,
            remainingPlotBeats: plotBeats.filter((b) => !b.completed),
            // Chapter history
            previousChapter,
            chapterOverviews,
            previousChapterSummary: chapterOverviews.length > 0 ? (_a = chapterOverviews[chapterOverviews.length - 1]) == null ? void 0 : _a.summary : null,
            // Entities
            actorStates,
            characterVoices,
            availableActors: allActors,
            availableItems: itemsInPlay,
            // Meta
            bookId,
            chapterNumber,
            contextAssembledAt: Date.now()
          };
        }
        /**
         * Build the mega-prompt for chapter generation
         */
        buildChapterPrompt(context, chapterPlan, moodSliders) {
          var _a;
          return promptTemplates_default.chapterGeneration(
            chapterPlan,
            context.styleProfile,
            context.characterVoices,
            context.previousChapter,
            (_a = context.chapterOverviews) == null ? void 0 : _a.map((o) => o.summary).join("\n\n"),
            context.worldRules,
            moodSliders
          );
        }
        /**
         * Build the chapter planning prompt
         */
        buildPlanningPrompt(context, moodSliders) {
          return promptTemplates_default.chapterPlan(
            context.chapterNumber,
            context.previousChapterSummary,
            context.availableActors,
            context.availableItems,
            context.remainingPlotBeats,
            context.styleProfile,
            moodSliders
          );
        }
        /**
         * Get onboarding progress
         */
        async getOnboardingProgress() {
          try {
            const progress = await database_default.get("onboardingProgress", "main");
            return progress || {
              id: "main",
              currentStep: 1,
              completedSteps: [],
              data: {}
            };
          } catch (error) {
            console.error("Error getting onboarding progress:", error);
            return {
              id: "main",
              currentStep: 1,
              completedSteps: [],
              data: {}
            };
          }
        }
        /**
         * Save onboarding progress
         */
        async saveOnboardingProgress(progress) {
          try {
            await database_default.update("onboardingProgress", {
              id: "main",
              ...progress,
              updatedAt: Date.now()
            });
          } catch (error) {
            console.error("Error saving onboarding progress:", error);
            throw error;
          }
        }
        /**
         * Check if onboarding is complete
         */
        async isOnboardingComplete() {
          const progress = await this.getOnboardingProgress();
          return progress.completedAt != null;
        }
        /**
         * Merge wizard characters into Personnel (actors)
         * Creates new actors or updates existing ones with voice profiles
         */
        async mergeWizardCharactersToPersonnel(characters) {
          const results = {
            created: [],
            updated: [],
            errors: []
          };
          try {
            const existingActors = await database_default.getAll("actors");
            for (const character of characters) {
              try {
                const existingActor = existingActors.find(
                  (a) => a.name.toLowerCase() === character.name.toLowerCase()
                );
                if (existingActor) {
                  const updatedActor = {
                    ...existingActor,
                    role: character.role || existingActor.role,
                    desc: character.description || existingActor.desc,
                    biography: character.description || existingActor.biography,
                    // Add voice profile reference
                    voiceProfileId: `voice_${existingActor.id}`,
                    updatedAt: Date.now()
                  };
                  await database_default.update("actors", updatedActor);
                  results.updated.push({ id: existingActor.id, name: existingActor.name });
                  if (character.voiceProfile) {
                    await this.saveCharacterVoice(existingActor.id, {
                      characterName: character.name,
                      role: character.role,
                      description: character.description,
                      ...character.voiceProfile
                    });
                  }
                } else {
                  const newActorId = `act_wizard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                  const newActor = {
                    id: newActorId,
                    name: character.name,
                    nicknames: [],
                    class: character.role || "Character",
                    role: character.role || "",
                    desc: character.description || "",
                    biography: character.description || "",
                    isFav: false,
                    baseStats: { STR: 10, VIT: 10, INT: 10, DEX: 10 },
                    additionalStats: {},
                    activeSkills: [],
                    inventory: [],
                    snapshots: {},
                    equipment: {
                      helm: null,
                      cape: null,
                      amulet: null,
                      armour: null,
                      gloves: null,
                      belt: null,
                      boots: null,
                      leftHand: null,
                      rightHand: null,
                      rings: [null, null, null, null, null, null, null],
                      charms: [null, null, null, null]
                    },
                    appearances: {},
                    arcMilestones: {},
                    lastConsistencyCheck: null,
                    aiSuggestions: [],
                    voiceProfileId: `voice_${newActorId}`,
                    createdAt: Date.now(),
                    createdFromWizard: true
                  };
                  await database_default.add("actors", newActor);
                  results.created.push({ id: newActorId, name: character.name });
                  if (character.voiceProfile) {
                    await this.saveCharacterVoice(newActorId, {
                      characterName: character.name,
                      role: character.role,
                      description: character.description,
                      ...character.voiceProfile
                    });
                  }
                }
              } catch (charError) {
                console.error(`Error merging character ${character.name}:`, charError);
                results.errors.push({ name: character.name, error: charError.message });
              }
            }
          } catch (error) {
            console.error("Error in mergeWizardCharactersToPersonnel:", error);
            results.errors.push({ name: "batch", error: error.message });
          }
          return results;
        }
        /**
         * Style evolution check - should trigger every 5 chapters
         */
        async shouldTriggerStyleReview(currentChapter) {
          if (currentChapter % 5 !== 0) return false;
          try {
            const evolutions = await database_default.getAll("styleEvolution");
            const lastReview = evolutions.sort((a, b) => (b.reviewedAtChapter || 0) - (a.reviewedAtChapter || 0))[0];
            if (!lastReview) return true;
            return lastReview.reviewedAtChapter < currentChapter;
          } catch (error) {
            console.error("Error checking style review:", error);
            return false;
          }
        }
        /**
         * Save style evolution review
         */
        async saveStyleEvolution(chapterNumber, evolutionData) {
          try {
            const evolution = {
              id: `evolution_${chapterNumber}`,
              reviewedAtChapter: chapterNumber,
              ...evolutionData,
              createdAt: Date.now()
            };
            await database_default.add("styleEvolution", evolution);
            return evolution;
          } catch (error) {
            console.error("Error saving style evolution:", error);
            throw error;
          }
        }
        // ========== CHAPTER COMPLETION TRACKING ==========
        /**
         * Get the current chapter (first incomplete chapter)
         */
        async getCurrentChapter() {
          var _a;
          try {
            const books = await database_default.getAll("books");
            if (!books || books.length === 0) return null;
            for (const book of books) {
              if (!book.chapters) continue;
              for (const chapter of book.chapters) {
                if (!chapter.completed) {
                  return {
                    ...chapter,
                    bookId: book.id,
                    bookTitle: book.title
                  };
                }
              }
            }
            const lastBook = books[books.length - 1];
            const lastChapter = (_a = lastBook == null ? void 0 : lastBook.chapters) == null ? void 0 : _a[lastBook.chapters.length - 1];
            return lastChapter ? { ...lastChapter, bookId: lastBook.id, bookTitle: lastBook.title } : null;
          } catch (error) {
            console.error("Error getting current chapter:", error);
            return null;
          }
        }
        /**
         * Update chapter completion status
         */
        async updateChapterCompletion(bookId, chapterId, completed, wordCount = null) {
          try {
            const book = await database_default.get("books", bookId);
            if (!book) throw new Error("Book not found");
            const chapterIndex = book.chapters.findIndex((c) => c.id === chapterId);
            if (chapterIndex === -1) throw new Error("Chapter not found");
            book.chapters[chapterIndex] = {
              ...book.chapters[chapterIndex],
              completed,
              wordCount: wordCount != null ? wordCount : book.chapters[chapterIndex].wordCount,
              completedAt: completed ? Date.now() : null
            };
            await database_default.update("books", book);
            return book.chapters[chapterIndex];
          } catch (error) {
            console.error("Error updating chapter completion:", error);
            throw error;
          }
        }
        /**
         * Update chapter content
         */
        async updateChapterContent(bookId, chapterId, content, title = null) {
          try {
            const book = await database_default.get("books", bookId);
            if (!book) throw new Error("Book not found");
            const chapterIndex = book.chapters.findIndex((c) => c.id === chapterId);
            if (chapterIndex === -1) throw new Error("Chapter not found");
            const wordCount = content ? content.trim().split(/\s+/).filter((w) => w).length : 0;
            book.chapters[chapterIndex] = {
              ...book.chapters[chapterIndex],
              content,
              script: content,
              // Keep script in sync for compatibility
              wordCount,
              ...title && { title },
              updatedAt: Date.now()
            };
            await database_default.update("books", book);
            return book.chapters[chapterIndex];
          } catch (error) {
            console.error("Error updating chapter content:", error);
            throw error;
          }
        }
        /**
         * Add a new chapter to a book
         */
        async addChapter(bookId, chapterData = {}) {
          try {
            const book = await database_default.get("books", bookId);
            if (!book) throw new Error("Book not found");
            const maxId = book.chapters.reduce((max, c) => Math.max(max, c.id || 0), 0);
            const newChapter = {
              id: maxId + 1,
              number: book.chapters.length + 1,
              title: chapterData.title || `Chapter ${book.chapters.length + 1}`,
              desc: chapterData.desc || "",
              content: chapterData.content || "",
              script: chapterData.content || "",
              completed: false,
              wordCount: 0,
              createdAt: Date.now()
            };
            book.chapters.push(newChapter);
            await database_default.update("books", book);
            return newChapter;
          } catch (error) {
            console.error("Error adding chapter:", error);
            throw error;
          }
        }
        /**
         * AI-powered chapter completion detection
         * Returns true if the chapter appears complete based on structure
         */
        async analyzeChapterCompleteness(content) {
          if (!content) return { isComplete: false, confidence: 0, reason: "No content" };
          const wordCount = content.trim().split(/\s+/).filter((w) => w).length;
          const hasMinWords = wordCount >= 500;
          const hasEnding = /(\.\s*$|\.["']\s*$|\?\s*$|!\s*$)/.test(content.trim());
          const hasParagraphs = (content.match(/\n\n/g) || []).length >= 2;
          let confidence = 0;
          let reasons = [];
          if (hasMinWords) {
            confidence += 40;
            reasons.push(`${wordCount} words (sufficient length)`);
          } else {
            reasons.push(`Only ${wordCount} words (may be incomplete)`);
          }
          if (hasEnding) {
            confidence += 30;
            reasons.push("Proper sentence ending");
          }
          if (hasParagraphs) {
            confidence += 30;
            reasons.push("Multiple paragraphs");
          }
          return {
            isComplete: confidence >= 70,
            confidence,
            wordCount,
            reasons
          };
        }
        /**
         * Get all chapters with completion status
         */
        async getAllChaptersWithStatus() {
          try {
            const books = await database_default.getAll("books");
            const chapters = [];
            for (const book of books) {
              if (!book.chapters) continue;
              for (const chapter of book.chapters) {
                chapters.push({
                  ...chapter,
                  bookId: book.id,
                  bookTitle: book.title,
                  hasContent: (chapter.content || chapter.script || "").length > 0
                });
              }
            }
            return chapters.sort((a, b) => {
              if (a.bookId !== b.bookId) return a.bookId - b.bookId;
              return (a.number || a.id) - (b.number || b.id);
            });
          } catch (error) {
            console.error("Error getting chapters with status:", error);
            return [];
          }
        }
      };
      contextEngine = new ContextEngine();
      contextEngine_default = contextEngine;
    }
  });

  // src/services/chapterDataExtractionService.js
  var ChapterDataExtractionService, chapterDataExtractionService, chapterDataExtractionService_default;
  var init_chapterDataExtractionService = __esm({
    "src/services/chapterDataExtractionService.js"() {
      init_aiService();
      init_database();
      init_contextEngine();
      ChapterDataExtractionService = class {
        constructor() {
          this.cache = /* @__PURE__ */ new Map();
          this.chunkSize = 5e3;
          this.chunkOverlap = 500;
        }
        getTextChunks(chapterText) {
          const text = chapterText || "";
          if (text.length <= this.chunkSize) {
            return [{ index: 0, text }];
          }
          const chunks = [];
          let start = 0;
          let index = 0;
          while (start < text.length) {
            const end = Math.min(text.length, start + this.chunkSize);
            chunks.push({ index, text: text.slice(start, end) });
            if (end >= text.length) break;
            start = end - this.chunkOverlap;
            index += 1;
          }
          return chunks;
        }
        /**
         * Extract plot beats from chapter text
         * @param {string} chapterText - The chapter content
         * @param {number} chapterNumber - Chapter number
         * @param {number} bookId - Book ID
         * @returns {Promise<Array>} Array of extracted beats
         */
        async extractBeatsFromChapter(chapterText, chapterNumber, bookId) {
          if (!chapterText || chapterText.trim().length < 50) {
            return [];
          }
          try {
            const chunks = this.getTextChunks(chapterText);
            const merged = [];
            const seen = /* @__PURE__ */ new Set();
            for (const chunk of chunks) {
              const prompt = `Analyze the following chapter text chunk and extract plot beats (significant story events, conflicts, resolutions, character moments).

Chapter ${chapterNumber}, Chunk ${chunk.index + 1}/${chunks.length}:
${chunk.text}

Return a JSON array of plot beats. Each beat should have:
- beat: A brief description of what happens
- purpose: Why this beat matters to the story
- characters: Array of character names involved
- emotionalTone: The emotional tone
- importance: 1-10 scale
- confidence: 0-1 confidence score`;
              const response = await aiService_default.callAI(prompt, "structured");
              const beats = this._parseBeatsResponse(response, chapterNumber, bookId).map((beat) => {
                var _a;
                return {
                  ...beat,
                  confidence: Number((_a = beat.confidence) != null ? _a : 0.85),
                  sourceChunk: chunk.index,
                  chunkCount: chunks.length,
                  promptVersion: "beats_chunk_v2"
                };
              });
              beats.forEach((beat) => {
                const key = `${(beat.beat || "").toLowerCase().trim()}|${beat.targetChapter}`;
                if (!key || seen.has(key)) return;
                seen.add(key);
                merged.push(beat);
              });
            }
            return merged;
          } catch (error) {
            console.error("Error extracting beats from chapter:", error);
            return [];
          }
        }
        /**
         * Extract events from chapter text (stat changes, skill gains, item acquisitions, etc.)
         * @param {string} chapterText - The chapter content
         * @param {number} chapterId - Chapter ID
         * @param {number} bookId - Book ID
         * @param {Array} actors - Available actors
         * @returns {Promise<Array>} Array of timeline events
         */
        async extractEventsFromChapter(chapterText, chapterId, bookId, actors = []) {
          if (!chapterText || chapterText.trim().length < 50) {
            return [];
          }
          try {
            const chunks = this.getTextChunks(chapterText);
            const actorNames = actors.map((a) => a.name).join(", ");
            const merged = [];
            const seen = /* @__PURE__ */ new Set();
            for (const chunk of chunks) {
              const prompt = `Analyze the following chapter text chunk and extract story events.

Chapter text (chunk ${chunk.index + 1}/${chunks.length}):
${chunk.text}

Available characters: ${actorNames || "None specified"}

Extract events such as:
- Character introductions/appearances
- Stat changes (e.g., "Grimguff gained +2 STR")
- Skill acquisitions (e.g., "Learned Fireball skill")
- Item acquisitions (e.g., "Found Sword of Truth")
- Travel events (e.g., "Traveled from London to Manchester")
- Relationship changes (e.g., "Became friends with Pipkins")

Return JSON array with events. Each event should have:
- title: Brief event title
- description: What happened
- type: One of: character_appearance, stat_change, skill_event, item_event, travel, relationship_change, milestone
- actors: Array of character names involved
- locations: Array of location names (if applicable)
- confidence: 0-1 confidence score

Format: [{"title": "...", "description": "...", "type": "...", "actors": [...], "locations": [...]}]`;
              const response = await aiService_default.callAI(prompt, "structured");
              const events = this._parseEventsResponse(response, chapterId, bookId, actors).map((event) => {
                var _a;
                return {
                  ...event,
                  confidence: Number((_a = event.confidence) != null ? _a : 0.9),
                  sourceChunk: chunk.index,
                  chunkCount: chunks.length,
                  promptVersion: "events_chunk_v2"
                };
              });
              events.forEach((event) => {
                const key = `${(event.title || "").toLowerCase().trim()}|${(event.type || "").toLowerCase()}|${chapterId}|${bookId}`;
                if (!key || seen.has(key)) return;
                seen.add(key);
                merged.push(event);
              });
            }
            return merged;
          } catch (error) {
            console.error("Error extracting events from chapter:", error);
            return [];
          }
        }
        /**
         * Extract locations from chapter text
         * @param {string} chapterText - The chapter content
         * @param {number} chapterId - Chapter ID
         * @param {number} bookId - Book ID
         * @returns {Promise<Array>} Array of location objects
         */
        async extractLocationsFromChapter(chapterText, chapterId, bookId) {
          if (!chapterText || chapterText.trim().length < 50) {
            return [];
          }
          try {
            const chunks = this.getTextChunks(chapterText);
            const merged = [];
            const seen = /* @__PURE__ */ new Set();
            for (const chunk of chunks) {
              const prompt = `Analyze the following chapter text and extract location mentions.

Chapter text (chunk ${chunk.index + 1}/${chunks.length}):
${chunk.text}

Extract all location mentions. For each location, identify:
- name: Location name
- type: city, town, building, landmark, region, etc.
- description: Brief description from context
- isUKCity: true if it's a known UK city/town

Common UK cities: London, Manchester, Birmingham, Liverpool, Leeds, Sheffield, Bristol, Newcastle, Edinburgh, Glasgow, Cardiff, Belfast, Oxford, Cambridge, Brighton, Plymouth, York, Nottingham, Southampton, etc.

Return JSON array: [{"name": "...", "type": "...", "description": "...", "isUKCity": true/false}]`;
              const response = await aiService_default.callAI(prompt, "structured");
              const locations = this._parseLocationsResponse(response, chapterId, bookId).map((location) => {
                var _a;
                return {
                  ...location,
                  confidence: Number((_a = location.confidence) != null ? _a : 0.85),
                  sourceChunk: chunk.index,
                  chunkCount: chunks.length,
                  promptVersion: "locations_chunk_v2"
                };
              });
              locations.forEach((location) => {
                const key = `${(location.name || "").toLowerCase().trim()}|${bookId}`;
                if (!key || seen.has(key)) return;
                seen.add(key);
                merged.push(location);
              });
            }
            return merged;
          } catch (error) {
            console.error("Error extracting locations from chapter:", error);
            return [];
          }
        }
        /**
         * Extract entities (actors, items, skills) from chapter text
         * @param {string} chapterText - The chapter content
         * @param {number} chapterId - Chapter ID
         * @param {number} bookId - Book ID
         * @returns {Promise<Object>} Object with actors, items, skills arrays
         */
        async extractEntitiesFromChapter(chapterText, chapterId, bookId) {
          if (!chapterText || chapterText.trim().length < 50) {
            return { actors: [], items: [], skills: [] };
          }
          try {
            const chunks = this.getTextChunks(chapterText);
            const merged = { actors: [], items: [], skills: [] };
            const seen = /* @__PURE__ */ new Set();
            for (const chunk of chunks) {
              const prompt = `Analyze the following chapter text and extract story entities.

Chapter text (chunk ${chunk.index + 1}/${chunks.length}):
${chunk.text}

Extract:
1. Characters/Actors mentioned (new or existing)
2. Items mentioned (weapons, equipment, objects)
3. Skills mentioned (abilities, powers, techniques)

For each entity, provide:
- name: Entity name
- type: actor, item, or skill
- description: Brief description from context
- isNew: true if this seems like a new entity introduction

Return JSON: {"actors": [{"name": "...", "description": "...", "isNew": true}], "items": [...], "skills": [...]}`;
              const response = await aiService_default.callAI(prompt, "structured");
              const entities = this._parseEntitiesResponse(response);
              ["actors", "items", "skills"].forEach((type) => {
                entities[type].forEach((entry) => {
                  var _a;
                  const key = `${type}|${(entry.name || "").toLowerCase().trim()}`;
                  if (!key || seen.has(key)) return;
                  seen.add(key);
                  merged[type].push({
                    ...entry,
                    confidence: Number((_a = entry.confidence) != null ? _a : 0.8),
                    sourceChunk: chunk.index,
                    chunkCount: chunks.length,
                    promptVersion: "entities_chunk_v2"
                  });
                });
              });
            }
            return merged;
          } catch (error) {
            console.error("Error extracting entities from chapter:", error);
            return { actors: [], items: [], skills: [] };
          }
        }
        /**
         * Extract character appearances and changes from chapter
         * @param {string} chapterText - The chapter content
         * @param {number} chapterId - Chapter ID
         * @param {number} bookId - Book ID
         * @param {Array} actors - Available actors
         * @returns {Promise<Object>} Appearance and change data
         */
        async extractCharacterDataFromChapter(chapterText, chapterId, bookId, actors = []) {
          if (!chapterText || chapterText.trim().length < 50) {
            return { appearances: [], statChanges: [], skillChanges: [], relationshipChanges: [] };
          }
          try {
            const chunks = this.getTextChunks(chapterText);
            const actorNames = actors.map((a) => a.name).join(", ");
            const merged = { appearances: [], statChanges: [], skillChanges: [], relationshipChanges: [] };
            const seen = /* @__PURE__ */ new Set();
            for (const chunk of chunks) {
              const prompt = `Analyze the following chapter text for character data.

Chapter text (chunk ${chunk.index + 1}/${chunks.length}):
${chunk.text}

Available characters: ${actorNames || "None"}

Extract:
1. Character appearances (who appears in this chapter)
2. Stat changes (e.g., "+2 STR", "level up", "gained VIT")
3. Skill changes - CRITICAL: Only extract skills that are EXPLICITLY GAINED, LEARNED, or IMPROVED in this chapter. 
   DO NOT include skills that are merely mentioned, used, or referenced without being gained/learned/improved.
   - "gained", "learned", "just learned", "discovered", "acquired", "unlocked" = action: "gained", level: 1
   - "improved", "better at", "practiced", "leveled up" = action: "improved", level: 2-3
   - "mastered", "perfected", "expert at", "became expert" = action: "mastered", level: 4-5
   - If a skill is only "used" or "mentioned" without being gained/learned/improved, DO NOT include it
   - For each skill, determine the level based on context:
     * "learned", "just learned", "discovered" = level 1
     * "improved", "better at", "practiced" = level 2-3
     * "mastered", "perfected", "expert at" = level 4-5
     * Default if no context = level 1
4. Relationship changes (how relationships between characters change)

Return JSON:
{
  "appearances": [{"character": "...", "firstMention": true/false}],
  "statChanges": [{"character": "...", "changes": {"STR": +2, "VIT": +1}}],
  "skillChanges": [{"character": "...", "action": "gained/improved/mastered", "skill": "...", "level": 1-5, "context": "..."}],
  "relationshipChanges": [{"character1": "...", "character2": "...", "change": "..."}]
}`;
              const response = await aiService_default.callAI(prompt, "structured");
              const data = this._parseCharacterDataResponse(response, chapterId, bookId);
              Object.keys(merged).forEach((type) => {
                (data[type] || []).forEach((entry) => {
                  var _a;
                  const key = `${type}|${JSON.stringify(entry).toLowerCase()}`;
                  if (seen.has(key)) return;
                  seen.add(key);
                  merged[type].push({
                    ...entry,
                    confidence: Number((_a = entry.confidence) != null ? _a : 0.8),
                    sourceChunk: chunk.index,
                    chunkCount: chunks.length,
                    promptVersion: "character_data_chunk_v2"
                  });
                });
              });
            }
            return merged;
          } catch (error) {
            console.error("Error extracting character data from chapter:", error);
            return { appearances: [], statChanges: [], skillChanges: [], relationshipChanges: [] };
          }
        }
        // Private helper methods for parsing AI responses
        _parseBeatsResponse(response, chapterNumber, bookId) {
          try {
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (!jsonMatch) return [];
            const beats = JSON.parse(jsonMatch[0]);
            return beats.map((beat, idx) => ({
              id: `beat_extracted_${Date.now()}_${idx}`,
              beat: beat.beat || "",
              purpose: beat.purpose || "",
              targetChapter: chapterNumber,
              characters: Array.isArray(beat.characters) ? beat.characters : [],
              emotionalTone: beat.emotionalTone || "",
              importance: beat.importance || 5,
              completed: false,
              order: idx + 1,
              createdAt: Date.now(),
              extracted: true
            })).filter((b) => b.beat.trim().length > 0);
          } catch (error) {
            console.error("Error parsing beats response:", error);
            return [];
          }
        }
        _parseEventsResponse(response, chapterId, bookId, actors) {
          try {
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (!jsonMatch) return [];
            const events = JSON.parse(jsonMatch[0]);
            return events.map((event, idx) => {
              const actorIds = [];
              if (Array.isArray(event.actors)) {
                event.actors.forEach((actorName) => {
                  const actor = actors.find(
                    (a) => a.name.toLowerCase() === actorName.toLowerCase() || a.name.toLowerCase().includes(actorName.toLowerCase())
                  );
                  if (actor) actorIds.push(actor.id);
                });
              }
              return {
                id: `evt_extracted_${Date.now()}_${idx}`,
                title: event.title || "Untitled Event",
                description: event.description || "",
                type: event.type || "milestone",
                bookId,
                chapterId,
                actors: event.actors || [],
                actorIds,
                locations: Array.isArray(event.locations) ? event.locations : [],
                timestamp: Date.now(),
                createdAt: Date.now(),
                extracted: true
              };
            }).filter((e) => e.title.trim().length > 0);
          } catch (error) {
            console.error("Error parsing events response:", error);
            return [];
          }
        }
        _parseLocationsResponse(response, chapterId, bookId) {
          try {
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (!jsonMatch) return [];
            const locations = JSON.parse(jsonMatch[0]);
            return locations.map((loc, idx) => ({
              id: `loc_extracted_${Date.now()}_${idx}`,
              name: loc.name || "Unknown Location",
              type: loc.type || "location",
              description: loc.description || "",
              isUKCity: loc.isUKCity || false,
              firstAppearance: {
                bookId,
                chapterId
              },
              createdAt: Date.now(),
              extracted: true
            })).filter((l) => l.name.trim().length > 0);
          } catch (error) {
            console.error("Error parsing locations response:", error);
            return [];
          }
        }
        _parseEntitiesResponse(response) {
          try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) return { actors: [], items: [], skills: [] };
            const data = JSON.parse(jsonMatch[0]);
            return {
              actors: Array.isArray(data.actors) ? data.actors : [],
              items: Array.isArray(data.items) ? data.items : [],
              skills: Array.isArray(data.skills) ? data.skills : []
            };
          } catch (error) {
            console.error("Error parsing entities response:", error);
            return { actors: [], items: [], skills: [] };
          }
        }
        _parseCharacterDataResponse(response, chapterId, bookId) {
          try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
              return { appearances: [], statChanges: [], skillChanges: [], relationshipChanges: [] };
            }
            let jsonString = jsonMatch[0];
            jsonString = jsonString.replace(/:\s*\+(\d+)/g, ": $1");
            const data = JSON.parse(jsonString);
            return {
              appearances: Array.isArray(data.appearances) ? data.appearances.map((a) => ({
                ...a,
                chapterId,
                bookId,
                timestamp: Date.now()
              })) : [],
              statChanges: Array.isArray(data.statChanges) ? data.statChanges.map((s) => ({
                ...s,
                chapterId,
                bookId,
                timestamp: Date.now()
              })) : [],
              skillChanges: Array.isArray(data.skillChanges) ? data.skillChanges.map((s) => ({
                ...s,
                chapterId,
                bookId,
                timestamp: Date.now()
              })) : [],
              relationshipChanges: Array.isArray(data.relationshipChanges) ? data.relationshipChanges.map((r) => ({
                ...r,
                chapterId,
                bookId,
                timestamp: Date.now()
              })) : []
            };
          } catch (error) {
            console.error("Error parsing character data response:", error);
            return { appearances: [], statChanges: [], skillChanges: [], relationshipChanges: [] };
          }
        }
        /**
         * Fuzzy name matching - finds best actor match for a name/nickname
         * @param {string} name - Name to match
         * @param {Array} actors - Available actors
         * @returns {Object|null} { actor, confidence } or null
         */
        _fuzzyMatchActorName(name, actors) {
          if (!name || !actors || actors.length === 0) return null;
          const nameLower = name.toLowerCase().trim();
          let match = actors.find((a) => a.name.toLowerCase() === nameLower);
          if (match) return { actor: match, confidence: 1 };
          for (const actor of actors) {
            if (actor.nicknames && Array.isArray(actor.nicknames)) {
              const nicknameMatch = actor.nicknames.find((n) => n.toLowerCase() === nameLower);
              if (nicknameMatch) return { actor, confidence: 0.95 };
            }
          }
          for (const actor of actors) {
            const actorNameLower = actor.name.toLowerCase();
            if (actorNameLower.includes(nameLower) || nameLower.includes(actorNameLower)) {
              return { actor, confidence: 0.8 };
            }
            if (actor.nicknames && Array.isArray(actor.nicknames)) {
              for (const nickname of actor.nicknames) {
                const nickLower = nickname.toLowerCase();
                if (nickLower.includes(nameLower) || nameLower.includes(nickLower)) {
                  return { actor, confidence: 0.75 };
                }
              }
            }
          }
          const nameWords = nameLower.split(/\s+/);
          for (const actor of actors) {
            const actorWords = actor.name.toLowerCase().split(/\s+/);
            const matchingWords = nameWords.filter((w) => actorWords.some((aw) => aw.includes(w) || w.includes(aw)));
            if (matchingWords.length >= Math.min(2, nameWords.length)) {
              return { actor, confidence: 0.7 };
            }
          }
          return null;
        }
        /**
         * Relationship type mapping with color codes
         */
        _getRelationshipTypeColor(type) {
          const typeMap = {
            "allied": "#22c55e",
            // green
            "hostile": "#ef4444",
            // red
            "romantic": "#ec4899",
            // pink
            "familial": "#a855f7",
            // purple
            "mentor": "#3b82f6",
            // blue
            "neutral": "#64748b",
            // grey
            "business": "#f59e0b",
            // orange
            "rival": "#dc2626",
            // dark red
            "enemy": "#ef4444",
            // red
            "friend": "#22c55e",
            // green
            "lover": "#ec4899",
            // pink
            "parent": "#a855f7",
            // purple
            "sibling": "#a855f7",
            // purple
            "teacher": "#3b82f6",
            // blue
            "student": "#3b82f6",
            // blue
            "partner": "#22c55e",
            // green
            "acquaintance": "#64748b"
            // grey
          };
          return typeMap[type == null ? void 0 : type.toLowerCase()] || "#64748b";
        }
        /**
         * Advanced relationship extraction with hybrid analysis
         * @param {string} chapterText - The chapter content
         * @param {number} chapterId - Chapter ID
         * @param {number} bookId - Book ID
         * @param {Array} actors - Available actors with nicknames
         * @returns {Promise<Array>} Array of relationship objects
         */
        async extractRelationshipsAdvanced(chapterText, chapterId, bookId, actors = []) {
          if (!chapterText || chapterText.trim().length < 50) {
            return [];
          }
          try {
            const actorList = actors.map((a) => {
              const nicknames = a.nicknames && Array.isArray(a.nicknames) ? a.nicknames : [];
              return `${a.name}${nicknames.length > 0 ? ` (also known as: ${nicknames.join(", ")})` : ""}`;
            }).join("\n");
            const prompt = `Analyze this chapter for ALL character relationships. Use a two-pass approach:

PASS 1: Read the entire chapter to understand context and identify all character pairs who interact.

PASS 2: For each pair, analyze their interactions in detail.

For each relationship found, extract:
- character1: Exact name or nickname used in the text
- character2: Exact name or nickname used in the text
- type: One of: allied, hostile, romantic, familial, mentor, rival, neutral, business, enemy, friend, lover, parent, sibling, teacher, student, partner, acquaintance
- strength: 0-100 (0 = no relationship, 100 = strongest possible)
- change: How the relationship changed in this chapter (e.g., "became allies", "betrayed", "grew closer")
- events: Array of specific events/interactions (max 5)
- emotion: Primary emotional tone (trust, betrayal, admiration, fear, love, hate, respect, contempt, etc.)
- context: Background/context of the relationship
- dialogue: Key dialogue quotes that reveal relationship (max 3)
- progression: How it changed (e.g., "enemies \u2192 neutral \u2192 allies")

Available actors with nicknames:
${actorList || "None"}

Chapter text:
${chapterText.substring(0, 8e3)}

Return JSON array of relationships:
[{
  "character1": "...",
  "character2": "...",
  "type": "allied",
  "strength": 75,
  "change": "...",
  "events": ["..."],
  "emotion": "...",
  "context": "...",
  "dialogue": ["..."],
  "progression": "..."
}]`;
            const response = await aiService_default.callAI(prompt, "structured", "", {
              temperature: 0.3,
              maxTokens: 3e3
            });
            const relationships = this._parseRelationshipsResponse(response, chapterId, bookId, actors);
            return relationships;
          } catch (error) {
            console.error("Error extracting relationships (advanced):", error);
            return [];
          }
        }
        /**
         * Parse relationships response and match to actors
         */
        _parseRelationshipsResponse(response, chapterId, bookId, actors) {
          try {
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (!jsonMatch) return [];
            const relationships = JSON.parse(jsonMatch[0]);
            return relationships.map((rel) => {
              const match1 = this._fuzzyMatchActorName(rel.character1, actors);
              const match2 = this._fuzzyMatchActorName(rel.character2, actors);
              if (!match1 || !match2 || match1.actor.id === match2.actor.id) {
                return null;
              }
              const type = this._normalizeRelationshipType(rel.type);
              return {
                character1: rel.character1,
                character2: rel.character2,
                actor1Id: match1.actor.id,
                actor2Id: match2.actor.id,
                type,
                strength: Math.max(0, Math.min(100, parseInt(rel.strength) || 50)),
                change: rel.change || "",
                events: Array.isArray(rel.events) ? rel.events.slice(0, 5) : [],
                emotion: rel.emotion || "",
                context: rel.context || "",
                dialogue: Array.isArray(rel.dialogue) ? rel.dialogue.slice(0, 3) : [],
                progression: rel.progression || "",
                chapterId,
                bookId,
                timestamp: Date.now(),
                confidence: Math.min(match1.confidence, match2.confidence)
              };
            }).filter((rel) => rel !== null);
          } catch (error) {
            console.error("Error parsing relationships response:", error);
            return [];
          }
        }
        /**
         * Determine skill level from context
         */
        _determineSkillLevelFromContext(action, context) {
          if (!action && !context) return 1;
          const text = ((action || "") + " " + (context || "")).toLowerCase();
          if (text.includes("mastered") || text.includes("perfected") || text.includes("expert at") || text.includes("legendary")) {
            return 5;
          }
          if (text.includes("advanced") || text.includes("highly skilled") || text.includes("expert")) {
            return 4;
          }
          if (text.includes("improved") || text.includes("better at") || text.includes("practiced") || text.includes("skilled")) {
            return 3;
          }
          if (text.includes("developing") || text.includes("getting better") || text.includes("intermediate")) {
            return 2;
          }
          return 1;
        }
        /**
         * Normalize relationship type to standard types
         */
        _normalizeRelationshipType(type) {
          if (!type) return "neutral";
          const typeLower = type.toLowerCase();
          if (typeLower.includes("friend") || typeLower.includes("ally") || typeLower.includes("partner")) {
            return "allied";
          }
          if (typeLower.includes("enemy") || typeLower.includes("hostile") || typeLower.includes("foe")) {
            return "hostile";
          }
          if (typeLower.includes("romantic") || typeLower.includes("lover") || typeLower.includes("love")) {
            return "romantic";
          }
          if (typeLower.includes("family") || typeLower.includes("parent") || typeLower.includes("sibling")) {
            return "familial";
          }
          if (typeLower.includes("mentor") || typeLower.includes("teacher") || typeLower.includes("student")) {
            return "mentor";
          }
          if (typeLower.includes("rival") || typeLower.includes("competitor")) {
            return "rival";
          }
          if (typeLower.includes("business") || typeLower.includes("professional")) {
            return "business";
          }
          return typeLower;
        }
      };
      chapterDataExtractionService = new ChapterDataExtractionService();
      chapterDataExtractionService_default = chapterDataExtractionService;
    }
  });

  // src/services/aiSuggestionService.js
  var AISuggestionService, aiSuggestionService, aiSuggestionService_default;
  var init_aiSuggestionService = __esm({
    "src/services/aiSuggestionService.js"() {
      init_aiService();
      init_database();
      AISuggestionService = class {
        constructor() {
          this.cache = /* @__PURE__ */ new Map();
        }
        /**
         * Analyze plot directions and suggest story developments
         * @param {string} chapterText - Chapter content
         * @param {Object} context - Story context
         * @returns {Promise<Array>} Plot direction suggestions
         */
        async analyzePlotDirections(chapterText, context = {}) {
          var _a, _b, _c;
          try {
            const systemContext = `You are an expert story analyst for "The Compliance Run" series.
Analyze the story trajectory and suggest creative plot directions, twists, and developments.
Be autonomous - suggest directions even if not explicitly stated in the text.
Consider: plot twists, character revelations, conflict escalation, resolution paths, story arcs.`;
            const prompt = `Analyze this chapter and suggest plot directions:

Chapter text:
${chapterText.substring(0, 5e3)}

Story context:
- Previous chapters: ${((_a = context.previousChapters) == null ? void 0 : _a.length) || 0}
- Active plot threads: ${((_b = context.activeThreads) == null ? void 0 : _b.length) || 0}
- Characters involved: ${((_c = context.characters) == null ? void 0 : _c.map((c) => c.name).join(", ")) || "None"}

Suggest plot directions including:
1. Immediate next steps for the story
2. Potential plot twists or revelations
3. Conflict escalation opportunities
4. Resolution paths
5. Story arc developments

Return JSON array:
[
  {
    "suggestion": "Plot direction description",
    "type": "plot_direction",
    "priority": "high|medium|low",
    "importance": 1-10,
    "reasoning": "Why this direction makes sense",
    "potentialImpact": "How this could affect the story",
    "charactersInvolved": ["Character 1", "Character 2"],
    "estimatedChapters": "When this should happen",
    "confidence": 0.0-1.0
  }
]`;
            const response = await aiService_default.callAI(prompt, "analytical", systemContext);
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const suggestions = JSON.parse(jsonMatch[0]);
              return suggestions.map((s, idx) => ({
                ...s,
                id: `plot_dir_${Date.now()}_${idx}`,
                createdAt: Date.now(),
                source: "ai_analysis"
              }));
            }
            return [];
          } catch (error) {
            console.error("Error analyzing plot directions:", error);
            return [];
          }
        }
        /**
         * Analyze relationship dynamics deeply
         * @param {string} chapterText - Chapter content
         * @param {Array} characters - Character list
         * @returns {Promise<Array>} Relationship analysis suggestions
         */
        async analyzeRelationshipDynamics(chapterText, characters = []) {
          try {
            const characterNames = characters.map((c) => c.name).join(", ");
            const systemContext = `You are a relationship dynamics expert.
Analyze character relationships with deep psychological insight.
Identify: power dynamics, hidden tensions, emotional states, relationship evolution, comedy potential, conflict potential.
Be autonomous - analyze what's implied, not just what's stated.`;
            const prompt = `Analyze relationship dynamics in this chapter:

Chapter text:
${chapterText.substring(0, 5e3)}

Characters: ${characterNames || "None"}

For each relationship pair, analyze:
1. Current relationship status (good/bad/funny/stupid/complex)
2. Psychological motivations
3. Power dynamics
4. Hidden tensions or subtext
5. Relationship evolution potential
6. Comedy opportunities
7. Conflict potential
8. Emotional depth

Return JSON array:
[
  {
    "character1": "Character name",
    "character2": "Character name",
    "currentStatus": "good|bad|funny|stupid|complex|neutral",
    "psychologicalAnalysis": "Deep psychological insight",
    "powerDynamics": "Who has power and why",
    "hiddenTensions": "Any hidden tensions or subtext",
    "evolutionPotential": "How this relationship could evolve",
    "comedyOpportunities": ["Comedy moment 1", "Comedy moment 2"],
    "conflictPotential": "Potential conflicts",
    "emotionalDepth": "Emotional aspects",
    "suggestions": ["Suggestion 1", "Suggestion 2"],
    "priority": "high|medium|low",
    "confidence": 0.0-1.0
  }
]`;
            const response = await aiService_default.callAI(prompt, "analytical", systemContext);
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const analyses = JSON.parse(jsonMatch[0]);
              return analyses.map((a, idx) => ({
                ...a,
                id: `rel_dyn_${Date.now()}_${idx}`,
                type: "relationship_dynamics",
                createdAt: Date.now(),
                source: "ai_analysis"
              }));
            }
            return [];
          } catch (error) {
            console.error("Error analyzing relationship dynamics:", error);
            return [];
          }
        }
        /**
         * Detect conflict opportunities
         * @param {string} chapterText - Chapter content
         * @param {Object} context - Story context
         * @returns {Promise<Array>} Conflict suggestions
         */
        async detectConflicts(chapterText, context = {}) {
          try {
            const systemContext = `You are a conflict analysis expert.
Identify potential conflicts and tension-building opportunities.
Suggest both explicit conflicts and subtle tensions that could escalate.`;
            const prompt = `Analyze this chapter for conflict opportunities:

Chapter text:
${chapterText.substring(0, 5e3)}

Identify:
1. Existing conflicts
2. Potential conflicts that could arise
3. Tension-building opportunities
4. Conflict resolution paths
5. Escalation possibilities

Return JSON array:
[
  {
    "conflict": "Conflict description",
    "type": "character|plot|internal|external|ideological",
    "characters": ["Character 1", "Character 2"],
    "tensionLevel": 1-10,
    "escalationPotential": "How this could escalate",
    "resolutionPaths": ["Path 1", "Path 2"],
    "suggestions": ["Suggestion 1", "Suggestion 2"],
    "priority": "high|medium|low",
    "confidence": 0.0-1.0
  }
]`;
            const response = await aiService_default.callAI(prompt, "analytical", systemContext);
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const conflicts = JSON.parse(jsonMatch[0]);
              return conflicts.map((c, idx) => ({
                ...c,
                id: `conflict_${Date.now()}_${idx}`,
                type: "conflict",
                createdAt: Date.now(),
                source: "ai_analysis"
              }));
            }
            return [];
          } catch (error) {
            console.error("Error detecting conflicts:", error);
            return [];
          }
        }
        /**
         * Detect callback opportunities
         * @param {string} chapterText - Chapter content
         * @param {Object} context - Story context
         * @returns {Promise<Array>} Callback suggestions
         */
        async detectCallbacks(chapterText, context = {}) {
          try {
            const systemContext = `You are a callback detection expert.
Identify moments, events, or details that should be referenced later.
Look for: memorable moments, setup moments, character moments, world-building details.`;
            const prompt = `Analyze this chapter for callback opportunities:

Chapter text:
${chapterText.substring(0, 5e3)}

Identify moments that:
1. Should be referenced later
2. Set up future plot points
3. Are memorable character moments
4. Create callback opportunities
5. Have emotional significance

Return JSON array:
[
  {
    "event": "Event or moment description",
    "type": "memory|setup|reference|callback|emotional",
    "importance": 1-10,
    "suggestedCallbackChapter": null or chapter number,
    "whyImportant": "Why this should be referenced",
    "callbackType": "How it should be referenced",
    "priority": "high|medium|low",
    "confidence": 0.0-1.0
  }
]`;
            const response = await aiService_default.callAI(prompt, "analytical", systemContext);
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const callbacks = JSON.parse(jsonMatch[0]);
              return callbacks.map((cb, idx) => ({
                ...cb,
                id: `callback_${Date.now()}_${idx}`,
                type: "callback",
                createdAt: Date.now(),
                source: "ai_analysis"
              }));
            }
            return [];
          } catch (error) {
            console.error("Error detecting callbacks:", error);
            return [];
          }
        }
        /**
         * Suggest character growth paths
         * @param {string} chapterText - Chapter content
         * @param {Array} characters - Character list
         * @returns {Promise<Array>} Character growth suggestions
         */
        async suggestCharacterGrowth(chapterText, characters = []) {
          try {
            const characterNames = characters.map((c) => c.name).join(", ");
            const systemContext = `You are a character development expert.
Suggest character growth arcs and development moments.
Consider: emotional growth, skill development, relationship growth, personal revelations, overcoming flaws.`;
            const prompt = `Analyze character growth opportunities:

Chapter text:
${chapterText.substring(0, 5e3)}

Characters: ${characterNames || "None"}

For each character, suggest:
1. Growth moments
2. Development arcs
3. Skills to develop
4. Flaws to overcome
5. Relationships to develop
6. Personal revelations
7. Emotional growth

Return JSON array:
[
  {
    "character": "Character name",
    "growthMoment": "What growth moment could happen",
    "type": "emotional|skill|relationship|personal|overcoming",
    "developmentArc": "How this fits into their arc",
    "suggestions": ["Suggestion 1", "Suggestion 2"],
    "estimatedChapters": "When this should happen",
    "priority": "high|medium|low",
    "confidence": 0.0-1.0
  }
]`;
            const response = await aiService_default.callAI(prompt, "analytical", systemContext);
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const growth = JSON.parse(jsonMatch[0]);
              return growth.map((g, idx) => ({
                ...g,
                id: `growth_${Date.now()}_${idx}`,
                type: "character_growth",
                createdAt: Date.now(),
                source: "ai_analysis"
              }));
            }
            return [];
          } catch (error) {
            console.error("Error suggesting character growth:", error);
            return [];
          }
        }
        /**
         * Suggest world-building connections
         * @param {string} chapterText - Chapter content
         * @param {Object} context - World context
         * @returns {Promise<Array>} World-building suggestions
         */
        async suggestWorldBuilding(chapterText, context = {}) {
          try {
            const systemContext = `You are a world-building expert.
Identify world-building implications and connections.
Suggest: rule implications, location connections, system interactions, world consistency.`;
            const prompt = `Analyze world-building opportunities:

Chapter text:
${chapterText.substring(0, 5e3)}

Identify:
1. World rule implications
2. Location connections
3. System interactions
4. Consistency opportunities
5. World expansion possibilities

Return JSON array:
[
  {
    "connection": "World-building connection",
    "type": "rule|location|system|consistency|expansion",
    "implications": "What this means for the world",
    "suggestions": ["Suggestion 1", "Suggestion 2"],
    "priority": "high|medium|low",
    "confidence": 0.0-1.0
  }
]`;
            const response = await aiService_default.callAI(prompt, "analytical", systemContext);
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const connections = JSON.parse(jsonMatch[0]);
              return connections.map((c, idx) => ({
                ...c,
                id: `world_${Date.now()}_${idx}`,
                type: "world_building",
                createdAt: Date.now(),
                source: "ai_analysis"
              }));
            }
            return [];
          } catch (error) {
            console.error("Error suggesting world-building:", error);
            return [];
          }
        }
        /**
         * Detect comedy opportunities
         * @param {string} chapterText - Chapter content
         * @param {Array} characters - Character list
         * @returns {Promise<Array>} Comedy suggestions
         */
        async detectComedyOpportunities(chapterText, characters = []) {
          try {
            const characterNames = characters.map((c) => c.name).join(", ");
            const systemContext = `You are a comedy analysis expert for "The Compliance Run" - a dark comedy horror-RPG series.
Analyze for ALL comedy elements: setup/payoff, character comedy, situational humor, running gags, callback humor.
The series is 60% horror/RPG brutality, 40% caustic comedy.`;
            const prompt = `Analyze comedy opportunities:

Chapter text:
${chapterText.substring(0, 5e3)}

Characters: ${characterNames || "None"}

Identify:
1. Setup/payoff opportunities
2. Character-specific comedy moments
3. Situational comedy potential
4. Running gag opportunities
5. Callback humor possibilities
6. Comedy timing suggestions

Return JSON array:
[
  {
    "comedyMoment": "Comedy opportunity description",
    "type": "setup_payoff|character|situational|running_gag|callback|timing",
    "characters": ["Character 1", "Character 2"],
    "comedyStyle": "How this should be funny",
    "setup": "What sets this up",
    "payoff": "What the payoff could be",
    "suggestions": ["Suggestion 1", "Suggestion 2"],
    "priority": "high|medium|low",
    "confidence": 0.0-1.0
  }
]`;
            const response = await aiService_default.callAI(prompt, "analytical", systemContext);
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const comedy = JSON.parse(jsonMatch[0]);
              return comedy.map((c, idx) => ({
                ...c,
                id: `comedy_${Date.now()}_${idx}`,
                type: "comedy",
                createdAt: Date.now(),
                source: "ai_analysis"
              }));
            }
            return [];
          } catch (error) {
            console.error("Error detecting comedy opportunities:", error);
            return [];
          }
        }
        /**
         * Suggest dramatic tension
         * @param {string} chapterText - Chapter content
         * @param {Object} context - Story context
         * @returns {Promise<Array>} Dramatic tension suggestions
         */
        async suggestDramaticTension(chapterText, context = {}) {
          try {
            const systemContext = `You are a dramatic tension expert.
Identify emotional beats and dramatic opportunities.
Consider: emotional moments, tension building, dramatic reveals, emotional payoffs.`;
            const prompt = `Analyze dramatic tension opportunities:

Chapter text:
${chapterText.substring(0, 5e3)}

Identify:
1. Emotional beats
2. Tension-building moments
3. Dramatic reveal opportunities
4. Emotional payoff moments
5. Character emotional states

Return JSON array:
[
  {
    "tensionMoment": "Dramatic moment description",
    "type": "emotional|tension|reveal|payoff|character_state",
    "emotionalIntensity": 1-10,
    "characters": ["Character 1", "Character 2"],
    "suggestions": ["Suggestion 1", "Suggestion 2"],
    "priority": "high|medium|low",
    "confidence": 0.0-1.0
  }
]`;
            const response = await aiService_default.callAI(prompt, "analytical", systemContext);
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const tensions = JSON.parse(jsonMatch[0]);
              return tensions.map((t, idx) => ({
                ...t,
                id: `tension_${Date.now()}_${idx}`,
                type: "dramatic_tension",
                createdAt: Date.now(),
                source: "ai_analysis"
              }));
            }
            return [];
          } catch (error) {
            console.error("Error suggesting dramatic tension:", error);
            return [];
          }
        }
        /**
         * Analyze pacing
         * @param {Array} chapters - Chapter array
         * @returns {Promise<Array>} Pacing suggestions
         */
        async analyzePacing(chapters) {
          try {
            const chaptersSummary = chapters.map((ch, idx) => ({
              number: ch.number || idx + 1,
              title: ch.title || "Untitled",
              length: (ch.script || ch.content || "").length,
              keyEvents: ch.keyPlotPoints || []
            }));
            const systemContext = `You are a pacing analysis expert.
Analyze chapter flow and suggest pacing improvements.
Consider: chapter length, action/dialogue balance, tension curves, flow.`;
            const prompt = `Analyze pacing:

Chapters:
${JSON.stringify(chaptersSummary, null, 2)}

Analyze:
1. Chapter flow
2. Pacing issues
3. Action/dialogue balance
4. Tension curves
5. Flow improvements

Return JSON array:
[
  {
    "chapter": "Chapter number or range",
    "issue": "Pacing issue description",
    "suggestion": "How to improve pacing",
    "type": "flow|balance|tension|length|rhythm",
    "priority": "high|medium|low",
    "confidence": 0.0-1.0
  }
]`;
            const response = await aiService_default.callAI(prompt, "analytical", systemContext);
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const pacing = JSON.parse(jsonMatch[0]);
              return pacing.map((p, idx) => ({
                ...p,
                id: `pacing_${Date.now()}_${idx}`,
                type: "pacing",
                createdAt: Date.now(),
                source: "ai_analysis"
              }));
            }
            return [];
          } catch (error) {
            console.error("Error analyzing pacing:", error);
            return [];
          }
        }
        /**
         * Detect foreshadowing opportunities
         * @param {string} chapterText - Chapter content
         * @param {Array} futureChapters - Future chapter summaries
         * @returns {Promise<Array>} Foreshadowing suggestions
         */
        async suggestForeshadowing(chapterText, futureChapters = []) {
          try {
            const futureSummary = futureChapters.map((ch) => ({
              number: ch.number,
              title: ch.title,
              keyEvents: ch.keyPlotPoints || []
            }));
            const systemContext = `You are a foreshadowing expert.
Detect setup moments and suggest payoff opportunities.
Identify: setup moments, payoff connections, subtle hints, dramatic irony.`;
            const prompt = `Analyze foreshadowing opportunities:

Current chapter:
${chapterText.substring(0, 5e3)}

Future chapters:
${JSON.stringify(futureSummary, null, 2)}

Identify:
1. Setup moments in current chapter
2. Potential payoffs in future chapters
3. Foreshadowing opportunities
4. Subtle hints to add
5. Dramatic irony possibilities

Return JSON array:
[
  {
    "setup": "Setup moment description",
    "payoff": "Potential payoff description",
    "payoffChapter": "Chapter number for payoff",
    "type": "setup|payoff|hint|irony",
    "suggestions": ["Suggestion 1", "Suggestion 2"],
    "priority": "high|medium|low",
    "confidence": 0.0-1.0
  }
]`;
            const response = await aiService_default.callAI(prompt, "analytical", systemContext);
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const foreshadowing = JSON.parse(jsonMatch[0]);
              return foreshadowing.map((f, idx) => ({
                ...f,
                id: `foreshadow_${Date.now()}_${idx}`,
                type: "foreshadowing",
                createdAt: Date.now(),
                source: "ai_analysis"
              }));
            }
            return [];
          } catch (error) {
            console.error("Error suggesting foreshadowing:", error);
            return [];
          }
        }
        /**
         * Generate all suggestions for a chapter
         * @param {string} chapterText - Chapter content
         * @param {Object} context - Full story context
         * @returns {Promise<Object>} All suggestions
         */
        async generateAllSuggestions(chapterText, context = {}) {
          try {
            const [
              plotDirections,
              relationshipDynamics,
              conflicts,
              callbacks,
              characterGrowth,
              worldBuilding,
              comedy,
              dramaticTension,
              foreshadowing
            ] = await Promise.all([
              this.analyzePlotDirections(chapterText, context),
              this.analyzeRelationshipDynamics(chapterText, context.characters || []),
              this.detectConflicts(chapterText, context),
              this.detectCallbacks(chapterText, context),
              this.suggestCharacterGrowth(chapterText, context.characters || []),
              this.suggestWorldBuilding(chapterText, context),
              this.detectComedyOpportunities(chapterText, context.characters || []),
              this.suggestDramaticTension(chapterText, context),
              this.suggestForeshadowing(chapterText, context.futureChapters || [])
            ]);
            return {
              plotDirections,
              relationshipDynamics,
              conflicts,
              callbacks,
              characterGrowth,
              worldBuilding,
              comedy,
              dramaticTension,
              foreshadowing,
              all: [
                ...plotDirections,
                ...relationshipDynamics,
                ...conflicts,
                ...callbacks,
                ...characterGrowth,
                ...worldBuilding,
                ...comedy,
                ...dramaticTension,
                ...foreshadowing
              ]
            };
          } catch (error) {
            console.error("Error generating all suggestions:", error);
            return {
              plotDirections: [],
              relationshipDynamics: [],
              conflicts: [],
              callbacks: [],
              characterGrowth: [],
              worldBuilding: [],
              comedy: [],
              dramaticTension: [],
              foreshadowing: [],
              all: []
            };
          }
        }
      };
      aiSuggestionService = new AISuggestionService();
      aiSuggestionService_default = aiSuggestionService;
    }
  });

  // src/services/relationshipAnalysisService.js
  var RelationshipAnalysisService, relationshipAnalysisService, relationshipAnalysisService_default;
  var init_relationshipAnalysisService = __esm({
    "src/services/relationshipAnalysisService.js"() {
      init_aiService();
      init_database();
      RelationshipAnalysisService = class {
        constructor() {
          this.cache = /* @__PURE__ */ new Map();
        }
        /**
         * Psychological relationship mapping
         * @param {string} chapterText - Chapter content
         * @param {Array} characters - Character list
         * @returns {Promise<Array>} Psychological relationship analyses
         */
        async mapPsychologicalRelationships(chapterText, characters = []) {
          try {
            const characterNames = characters.map((c) => `${c.name} (${c.class || "Unknown"})`).join(", ");
            const systemContext = `You are a psychological relationship analyst.
Analyze relationships with deep psychological insight.
Identify: motivations, power dynamics, hidden tensions, emotional subtext, psychological patterns.`;
            const prompt = `Analyze psychological relationships:

Chapter text:
${chapterText.substring(0, 5e3)}

Characters: ${characterNames || "None"}

For each relationship pair, provide deep psychological analysis:
1. Psychological motivations (what drives each character)
2. Power dynamics (who has power, why, how it shifts)
3. Hidden tensions (subtext, unspoken conflicts)
4. Emotional subtext (underlying emotions)
5. Psychological patterns (recurring dynamics)
6. Unconscious dynamics (what's not being said)

Return JSON array:
[
  {
    "character1": "Character name",
    "character2": "Character name",
    "psychologicalMotivations": {
      "character1": "What drives character 1",
      "character2": "What drives character 2"
    },
    "powerDynamics": {
      "currentBalance": "Who has power and why",
      "shifts": "How power shifts",
      "sources": "Sources of power"
    },
    "hiddenTensions": ["Tension 1", "Tension 2"],
    "emotionalSubtext": "Underlying emotions",
    "psychologicalPatterns": ["Pattern 1", "Pattern 2"],
    "unconsciousDynamics": "What's not being said",
    "suggestions": ["Suggestion 1", "Suggestion 2"],
    "priority": "high|medium|low",
    "confidence": 0.0-1.0
  }
]`;
            const response = await aiService_default.callAI(prompt, "analytical", systemContext);
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const analyses = JSON.parse(jsonMatch[0]);
              return analyses.map((a, idx) => ({
                ...a,
                id: `psych_rel_${Date.now()}_${idx}`,
                type: "psychological_relationship",
                createdAt: Date.now(),
                source: "ai_analysis"
              }));
            }
            return [];
          } catch (error) {
            console.error("Error mapping psychological relationships:", error);
            return [];
          }
        }
        /**
         * Track relationship evolution
         * @param {string} chapterText - Chapter content
         * @param {Array} relationshipHistory - Previous relationship states
         * @returns {Promise<Array>} Relationship evolution analysis
         */
        async trackRelationshipEvolution(chapterText, relationshipHistory = []) {
          try {
            const systemContext = `You are a relationship evolution tracker.
Analyze how relationships change over time.
Track: evolution stages, change triggers, relationship health, trajectory.`;
            const prompt = `Analyze relationship evolution:

Current chapter:
${chapterText.substring(0, 5e3)}

Relationship history:
${JSON.stringify(relationshipHistory.slice(-5), null, 2)}

Analyze:
1. How relationships have evolved
2. What triggered changes
3. Relationship health status
4. Future trajectory
5. Evolution stages

Return JSON array:
[
  {
    "character1": "Character name",
    "character2": "Character name",
    "evolution": "How the relationship evolved",
    "stages": ["Stage 1", "Stage 2", "Current stage"],
    "changeTriggers": ["Trigger 1", "Trigger 2"],
    "relationshipHealth": "healthy|strained|broken|developing",
    "trajectory": "Where this is heading",
    "suggestions": ["Suggestion 1", "Suggestion 2"],
    "priority": "high|medium|low",
    "confidence": 0.0-1.0
  }
]`;
            const response = await aiService_default.callAI(prompt, "analytical", systemContext);
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const evolutions = JSON.parse(jsonMatch[0]);
              return evolutions.map((e, idx) => ({
                ...e,
                id: `rel_evol_${Date.now()}_${idx}`,
                type: "relationship_evolution",
                createdAt: Date.now(),
                source: "ai_analysis"
              }));
            }
            return [];
          } catch (error) {
            console.error("Error tracking relationship evolution:", error);
            return [];
          }
        }
        /**
         * Predict relationship conflicts
         * @param {string} chapterText - Chapter content
         * @param {Array} relationships - Current relationships
         * @returns {Promise<Array>} Conflict predictions
         */
        async predictRelationshipConflicts(chapterText, relationships = []) {
          try {
            const systemContext = `You are a conflict prediction expert.
Predict potential relationship conflicts based on dynamics and tensions.
Consider: underlying tensions, incompatible goals, power struggles, emotional triggers.`;
            const prompt = `Predict relationship conflicts:

Chapter text:
${chapterText.substring(0, 5e3)}

Current relationships:
${JSON.stringify(relationships.slice(0, 10), null, 2)}

Predict:
1. Potential conflicts
2. Conflict triggers
3. Conflict severity
4. Conflict resolution paths
5. Prevention strategies

Return JSON array:
[
  {
    "character1": "Character name",
    "character2": "Character name",
    "potentialConflict": "What conflict could arise",
    "triggers": ["Trigger 1", "Trigger 2"],
    "severity": "low|medium|high|critical",
    "likelihood": 1-10,
    "resolutionPaths": ["Path 1", "Path 2"],
    "preventionStrategies": ["Strategy 1", "Strategy 2"],
    "suggestions": ["Suggestion 1", "Suggestion 2"],
    "priority": "high|medium|low",
    "confidence": 0.0-1.0
  }
]`;
            const response = await aiService_default.callAI(prompt, "analytical", systemContext);
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const conflicts = JSON.parse(jsonMatch[0]);
              return conflicts.map((c, idx) => ({
                ...c,
                id: `rel_conflict_${Date.now()}_${idx}`,
                type: "relationship_conflict",
                createdAt: Date.now(),
                source: "ai_analysis"
              }));
            }
            return [];
          } catch (error) {
            console.error("Error predicting relationship conflicts:", error);
            return [];
          }
        }
        /**
         * Analyze relationship comedy
         * @param {string} chapterText - Chapter content
         * @param {Array} characters - Character list
         * @returns {Promise<Array>} Comedy relationship analyses
         */
        async analyzeRelationshipComedy(chapterText, characters = []) {
          try {
            const characterNames = characters.map((c) => c.name).join(", ");
            const systemContext = `You are a comedy relationship analyst for "The Compliance Run" - a dark comedy series.
Identify funny relationship dynamics and comedy opportunities.
The series is 60% horror/RPG brutality, 40% caustic comedy.`;
            const prompt = `Analyze relationship comedy:

Chapter text:
${chapterText.substring(0, 5e3)}

Characters: ${characterNames || "None"}

Identify:
1. Funny relationship dynamics
2. Comedy opportunities in relationships
3. Running gag potential
4. Character comedy moments
5. Situational comedy from relationships

Return JSON array:
[
  {
    "character1": "Character name",
    "character2": "Character name",
    "comedyDynamic": "What makes this relationship funny",
    "comedyMoments": ["Moment 1", "Moment 2"],
    "runningGagPotential": "Potential running gags",
    "comedyStyle": "How this should be funny",
    "suggestions": ["Suggestion 1", "Suggestion 2"],
    "priority": "high|medium|low",
    "confidence": 0.0-1.0
  }
]`;
            const response = await aiService_default.callAI(prompt, "analytical", systemContext);
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const comedy = JSON.parse(jsonMatch[0]);
              return comedy.map((c, idx) => ({
                ...c,
                id: `rel_comedy_${Date.now()}_${idx}`,
                type: "relationship_comedy",
                createdAt: Date.now(),
                source: "ai_analysis"
              }));
            }
            return [];
          } catch (error) {
            console.error("Error analyzing relationship comedy:", error);
            return [];
          }
        }
        /**
         * Comprehensive relationship analysis
         * @param {string} chapterText - Chapter content
         * @param {Array} characters - Character list
         * @param {Array} relationshipHistory - Previous relationship states
         * @returns {Promise<Object>} Complete relationship analysis
         */
        async analyzeRelationshipsComprehensive(chapterText, characters = [], relationshipHistory = []) {
          try {
            const [
              psychological,
              evolution,
              conflicts,
              comedy
            ] = await Promise.all([
              this.mapPsychologicalRelationships(chapterText, characters),
              this.trackRelationshipEvolution(chapterText, relationshipHistory),
              this.predictRelationshipConflicts(chapterText, relationshipHistory),
              this.analyzeRelationshipComedy(chapterText, characters)
            ]);
            return {
              psychological,
              evolution,
              conflicts,
              comedy,
              all: [
                ...psychological,
                ...evolution,
                ...conflicts,
                ...comedy
              ]
            };
          } catch (error) {
            console.error("Error in comprehensive relationship analysis:", error);
            return {
              psychological: [],
              evolution: [],
              conflicts: [],
              comedy: [],
              all: []
            };
          }
        }
      };
      relationshipAnalysisService = new RelationshipAnalysisService();
      relationshipAnalysisService_default = relationshipAnalysisService;
    }
  });

  // src/services/plotThreadingService.js
  var PlotThreadingService, plotThreadingService, plotThreadingService_default;
  var init_plotThreadingService = __esm({
    "src/services/plotThreadingService.js"() {
      init_aiService();
      init_database();
      PlotThreadingService = class {
        constructor() {
          this.cache = /* @__PURE__ */ new Map();
        }
        /**
         * Analyze thread dependencies
         * @param {Array} plotThreads - Plot threads
         * @param {Array} chapters - Chapter array
         * @returns {Promise<Object>} Thread dependency analysis
         */
        async analyzeThreadDependencies(plotThreads, chapters = []) {
          try {
            const systemContext = `You are a plot threading expert.
Analyze which plot threads depend on others.
Identify: dependencies, prerequisites, thread relationships, blocking threads.`;
            const prompt = `Analyze plot thread dependencies:

Plot threads:
${JSON.stringify(plotThreads, null, 2)}

Chapters:
${chapters.map((ch, idx) => `${idx + 1}. ${ch.title || "Untitled"}`).join("\n")}

Analyze:
1. Which threads depend on others
2. Prerequisites for thread resolution
3. Thread relationships
4. Blocking threads (threads that block others)
5. Independent threads

Return JSON:
{
  "dependencies": [
    {
      "threadId": "Thread ID or name",
      "dependsOn": ["Thread ID 1", "Thread ID 2"],
      "prerequisites": ["Prerequisite 1", "Prerequisite 2"],
      "blocks": ["Thread ID that this blocks"],
      "relationship": "depends|blocks|parallel|independent"
    }
  ],
  "dependencyGraph": "Description of dependency structure",
  "suggestions": ["Suggestion 1", "Suggestion 2"]
}`;
            const response = await aiService_default.callAI(prompt, "analytical", systemContext);
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              return JSON.parse(jsonMatch[0]);
            }
            return { dependencies: [], dependencyGraph: "", suggestions: [] };
          } catch (error) {
            console.error("Error analyzing thread dependencies:", error);
            return { dependencies: [], dependencyGraph: "", suggestions: [] };
          }
        }
        /**
         * Detect thread convergence points
         * @param {Array} plotThreads - Plot threads
         * @param {Array} chapters - Chapter array
         * @returns {Promise<Array>} Convergence point suggestions
         */
        async detectThreadConvergence(plotThreads, chapters = []) {
          try {
            const systemContext = `You are a plot convergence expert.
Identify where plot threads should converge.
Consider: natural convergence points, dramatic moments, resolution opportunities.`;
            const prompt = `Detect thread convergence points:

Plot threads:
${JSON.stringify(plotThreads, null, 2)}

Chapters:
${chapters.map((ch, idx) => `${idx + 1}. ${ch.title || "Untitled"}`).join("\n")}

Identify:
1. Natural convergence points
2. Where threads should meet
3. Dramatic convergence moments
4. Resolution opportunities
5. Convergence timing

Return JSON array:
[
  {
    "convergencePoint": "Where threads converge",
    "threads": ["Thread 1", "Thread 2"],
    "suggestedChapter": "Chapter number or range",
    "type": "dramatic|resolution|setup|climax",
    "impact": "Impact of convergence",
    "suggestions": ["Suggestion 1", "Suggestion 2"],
    "priority": "high|medium|low",
    "confidence": 0.0-1.0
  }
]`;
            const response = await aiService_default.callAI(prompt, "analytical", systemContext);
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const convergences = JSON.parse(jsonMatch[0]);
              return convergences.map((c, idx) => ({
                ...c,
                id: `converge_${Date.now()}_${idx}`,
                type: "thread_convergence",
                createdAt: Date.now(),
                source: "ai_analysis"
              }));
            }
            return [];
          } catch (error) {
            console.error("Error detecting thread convergence:", error);
            return [];
          }
        }
        /**
         * Track thread resolution status
         * @param {Array} plotThreads - Plot threads
         * @param {Array} chapters - Chapter array
         * @returns {Promise<Array>} Thread health analysis
         */
        async trackThreadResolution(plotThreads, chapters = []) {
          try {
            const systemContext = `You are a plot thread health analyst.
Track thread resolution status and health.
Assess: completion status, resolution quality, thread health, resolution timing.`;
            const prompt = `Track thread resolution:

Plot threads:
${JSON.stringify(plotThreads, null, 2)}

Chapters:
${chapters.map((ch, idx) => `${idx + 1}. ${ch.title || "Untitled"}`).join("\n")}

For each thread, assess:
1. Resolution status
2. Resolution quality
3. Thread health
4. Resolution timing
5. Issues or problems

Return JSON array:
[
  {
    "threadId": "Thread ID or name",
    "resolutionStatus": "resolved|ongoing|stalled|abandoned",
    "resolutionQuality": "excellent|good|adequate|poor|unresolved",
    "threadHealth": "healthy|concerning|critical",
    "resolutionTiming": "too_early|good|too_late|overdue",
    "issues": ["Issue 1", "Issue 2"],
    "suggestions": ["Suggestion 1", "Suggestion 2"],
    "priority": "high|medium|low",
    "confidence": 0.0-1.0
  }
]`;
            const response = await aiService_default.callAI(prompt, "analytical", systemContext);
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const resolutions = JSON.parse(jsonMatch[0]);
              return resolutions.map((r, idx) => ({
                ...r,
                id: `thread_res_${Date.now()}_${idx}`,
                type: "thread_resolution",
                createdAt: Date.now(),
                source: "ai_analysis"
              }));
            }
            return [];
          } catch (error) {
            console.error("Error tracking thread resolution:", error);
            return [];
          }
        }
        /**
         * Map thread interconnections
         * @param {Array} plotThreads - Plot threads
         * @returns {Promise<Object>} Thread interconnection map
         */
        async mapThreadInterconnections(plotThreads) {
          try {
            const systemContext = `You are a plot interconnection expert.
Map how plot threads interconnect.
Identify: connections, shared elements, cross-thread influences, network structure.`;
            const prompt = `Map thread interconnections:

Plot threads:
${JSON.stringify(plotThreads, null, 2)}

Map:
1. How threads connect
2. Shared elements (characters, locations, themes)
3. Cross-thread influences
4. Network structure
5. Connection strength

Return JSON:
{
  "interconnections": [
    {
      "thread1": "Thread ID or name",
      "thread2": "Thread ID or name",
      "connectionType": "character|location|theme|event|causal",
      "connectionStrength": "strong|moderate|weak",
      "sharedElements": ["Element 1", "Element 2"],
      "influence": "How threads influence each other"
    }
  ],
  "networkStructure": "Description of network",
  "suggestions": ["Suggestion 1", "Suggestion 2"]
}`;
            const response = await aiService_default.callAI(prompt, "analytical", systemContext);
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              return JSON.parse(jsonMatch[0]);
            }
            return { interconnections: [], networkStructure: "", suggestions: [] };
          } catch (error) {
            console.error("Error mapping thread interconnections:", error);
            return { interconnections: [], networkStructure: "", suggestions: [] };
          }
        }
        /**
         * Comprehensive plot threading analysis
         * @param {Array} plotThreads - Plot threads
         * @param {Array} chapters - Chapter array
         * @returns {Promise<Object>} Complete threading analysis
         */
        async analyzePlotThreading(plotThreads, chapters = []) {
          try {
            const [
              dependencies,
              convergences,
              resolutions,
              interconnections
            ] = await Promise.all([
              this.analyzeThreadDependencies(plotThreads, chapters),
              this.detectThreadConvergence(plotThreads, chapters),
              this.trackThreadResolution(plotThreads, chapters),
              this.mapThreadInterconnections(plotThreads)
            ]);
            return {
              dependencies,
              convergences,
              resolutions,
              interconnections,
              all: [
                ...dependencies.dependencies || [],
                ...convergences,
                ...resolutions,
                ...interconnections.interconnections || []
              ]
            };
          } catch (error) {
            console.error("Error in comprehensive plot threading analysis:", error);
            return {
              dependencies: { dependencies: [], dependencyGraph: "", suggestions: [] },
              convergences: [],
              resolutions: [],
              interconnections: { interconnections: [], networkStructure: "", suggestions: [] },
              all: []
            };
          }
        }
      };
      plotThreadingService = new PlotThreadingService();
      plotThreadingService_default = plotThreadingService;
    }
  });

  // src/services/emotionalBeatService.js
  var EmotionalBeatService, emotionalBeatService, emotionalBeatService_default;
  var init_emotionalBeatService = __esm({
    "src/services/emotionalBeatService.js"() {
      init_aiService();
      init_database();
      EmotionalBeatService = class {
        constructor() {
          this.cache = /* @__PURE__ */ new Map();
        }
        /**
         * Map emotional journey
         * @param {string} chapterText - Chapter content
         * @param {Array} characters - Character list
         * @param {Array} previousEmotions - Previous emotional states
         * @returns {Promise<Array>} Emotional journey mapping
         */
        async mapEmotionalJourney(chapterText, characters = [], previousEmotions = []) {
          try {
            const characterNames = characters.map((c) => c.name).join(", ");
            const systemContext = `You are an emotional journey mapping expert.
Map complete emotional arcs and journeys.
Track: emotional states, transitions, emotional depth, character emotional journeys.`;
            const prompt = `Map emotional journey:

Chapter text:
${chapterText.substring(0, 5e3)}

Characters: ${characterNames || "None"}

Previous emotional states:
${JSON.stringify(previousEmotions.slice(-5), null, 2)}

For each character, map:
1. Emotional states in this chapter
2. Emotional transitions
3. Emotional depth
4. Emotional journey progression
5. Emotional arc stage

Return JSON array:
[
  {
    "character": "Character name",
    "emotionalStates": [
      {
        "state": "Emotional state",
        "intensity": 1-10,
        "trigger": "What caused this state",
        "duration": "How long it lasts"
      }
    ],
    "emotionalTransitions": ["Transition 1", "Transition 2"],
    "emotionalDepth": "Depth of emotion",
    "journeyProgression": "How their emotional journey progresses",
    "arcStage": "stage of emotional arc",
    "suggestions": ["Suggestion 1", "Suggestion 2"],
    "priority": "high|medium|low",
    "confidence": 0.0-1.0
  }
]`;
            const response = await aiService_default.callAI(prompt, "analytical", systemContext);
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const journeys = JSON.parse(jsonMatch[0]);
              return journeys.map((j, idx) => ({
                ...j,
                id: `emotion_journey_${Date.now()}_${idx}`,
                type: "emotional_journey",
                createdAt: Date.now(),
                source: "ai_analysis"
              }));
            }
            return [];
          } catch (error) {
            console.error("Error mapping emotional journey:", error);
            return [];
          }
        }
        /**
         * Detect catharsis points
         * @param {string} chapterText - Chapter content
         * @param {Array} characters - Character list
         * @returns {Promise<Array>} Catharsis point detections
         */
        async detectCatharsisPoints(chapterText, characters = []) {
          try {
            const characterNames = characters.map((c) => c.name).join(", ");
            const systemContext = `You are a catharsis detection expert.
Identify emotional release moments and catharsis points.
Look for: emotional release, resolution moments, emotional payoffs, relief moments.`;
            const prompt = `Detect catharsis points:

Chapter text:
${chapterText.substring(0, 5e3)}

Characters: ${characterNames || "None"}

Identify:
1. Emotional release moments
2. Catharsis points
3. Resolution moments
4. Emotional payoffs
5. Relief moments

Return JSON array:
[
  {
    "character": "Character name",
    "catharsisMoment": "What the catharsis moment is",
    "type": "release|resolution|payoff|relief|breakthrough",
    "emotionalIntensity": 1-10,
    "buildUp": "What built up to this",
    "release": "How the release happens",
    "impact": "Impact of this catharsis",
    "suggestions": ["Suggestion 1", "Suggestion 2"],
    "priority": "high|medium|low",
    "confidence": 0.0-1.0
  }
]`;
            const response = await aiService_default.callAI(prompt, "analytical", systemContext);
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const catharsis = JSON.parse(jsonMatch[0]);
              return catharsis.map((c, idx) => ({
                ...c,
                id: `catharsis_${Date.now()}_${idx}`,
                type: "catharsis",
                createdAt: Date.now(),
                source: "ai_analysis"
              }));
            }
            return [];
          } catch (error) {
            console.error("Error detecting catharsis points:", error);
            return [];
          }
        }
        /**
         * Track emotional payoff
         * @param {string} chapterText - Chapter content
         * @param {Array} emotionalSetups - Previous emotional setups
         * @returns {Promise<Array>} Emotional payoff tracking
         */
        async trackEmotionalPayoff(chapterText, emotionalSetups = []) {
          try {
            const systemContext = `You are an emotional payoff tracker.
Track emotional setup and payoff pairs.
Identify: setups that pay off, payoffs that were set up, missing payoffs, payoff quality.`;
            const prompt = `Track emotional payoff:

Chapter text:
${chapterText.substring(0, 5e3)}

Previous emotional setups:
${JSON.stringify(emotionalSetups.slice(-10), null, 2)}

Track:
1. Setups that pay off in this chapter
2. Payoffs that were set up earlier
3. Missing payoffs (setups without payoff)
4. Payoff quality
5. Emotional payoff opportunities

Return JSON array:
[
  {
    "setup": "Emotional setup description",
    "payoff": "Emotional payoff description",
    "setupChapter": "Chapter where setup occurred",
    "payoffChapter": "Chapter where payoff occurs",
    "payoffQuality": "excellent|good|adequate|poor|missing",
    "emotionalImpact": "Impact of the payoff",
    "suggestions": ["Suggestion 1", "Suggestion 2"],
    "priority": "high|medium|low",
    "confidence": 0.0-1.0
  }
]`;
            const response = await aiService_default.callAI(prompt, "analytical", systemContext);
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const payoffs = JSON.parse(jsonMatch[0]);
              return payoffs.map((p, idx) => ({
                ...p,
                id: `emotion_payoff_${Date.now()}_${idx}`,
                type: "emotional_payoff",
                createdAt: Date.now(),
                source: "ai_analysis"
              }));
            }
            return [];
          } catch (error) {
            console.error("Error tracking emotional payoff:", error);
            return [];
          }
        }
        /**
         * Comprehensive emotional beat analysis
         * @param {string} chapterText - Chapter content
         * @param {Array} characters - Character list
         * @param {Array} previousEmotions - Previous emotional states
         * @param {Array} emotionalSetups - Previous emotional setups
         * @returns {Promise<Object>} Complete emotional analysis
         */
        async analyzeEmotionalBeats(chapterText, characters = [], previousEmotions = [], emotionalSetups = []) {
          try {
            const [
              journey,
              catharsis,
              payoffs
            ] = await Promise.all([
              this.mapEmotionalJourney(chapterText, characters, previousEmotions),
              this.detectCatharsisPoints(chapterText, characters),
              this.trackEmotionalPayoff(chapterText, emotionalSetups)
            ]);
            return {
              journey,
              catharsis,
              payoffs,
              all: [
                ...journey,
                ...catharsis,
                ...payoffs
              ]
            };
          } catch (error) {
            console.error("Error in comprehensive emotional beat analysis:", error);
            return {
              journey: [],
              catharsis: [],
              payoffs: [],
              all: []
            };
          }
        }
      };
      emotionalBeatService = new EmotionalBeatService();
      emotionalBeatService_default = emotionalBeatService;
    }
  });

  // src/services/dialogueAnalysisService.js
  var DialogueAnalysisService, dialogueAnalysisService, dialogueAnalysisService_default;
  var init_dialogueAnalysisService = __esm({
    "src/services/dialogueAnalysisService.js"() {
      init_aiService();
      init_database();
      DialogueAnalysisService = class {
        constructor() {
          this.cache = /* @__PURE__ */ new Map();
        }
        /**
         * Analyze dialogue quality
         * @param {string} chapterText - Chapter content
         * @param {Array} characters - Character list
         * @returns {Promise<Array>} Dialogue quality analyses
         */
        async analyzeDialogueQuality(chapterText, characters = []) {
          try {
            const characterNames = characters.map((c) => `${c.name} (${c.class || "Unknown"})`).join(", ");
            const systemContext = `You are a dialogue quality expert.
Analyze dialogue for naturalness, purpose, effectiveness, and quality.
Assess: naturalness, purpose, effectiveness, subtext, impact.`;
            const prompt = `Analyze dialogue quality:

Chapter text:
${chapterText.substring(0, 5e3)}

Characters: ${characterNames || "None"}

For each dialogue exchange, analyze:
1. Naturalness (does it sound natural?)
2. Purpose (what does it accomplish?)
3. Effectiveness (does it achieve its purpose?)
4. Subtext (what's beneath the surface?)
5. Impact (emotional/plot impact)

Return JSON array:
[
  {
    "dialogue": "Dialogue excerpt",
    "character": "Character speaking",
    "naturalness": 1-10,
    "purpose": "What this dialogue accomplishes",
    "effectiveness": 1-10,
    "subtext": "What's beneath the surface",
    "impact": "Emotional/plot impact",
    "suggestions": ["Suggestion 1", "Suggestion 2"],
    "priority": "high|medium|low",
    "confidence": 0.0-1.0
  }
]`;
            const response = await aiService_default.callAI(prompt, "analytical", systemContext);
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const analyses = JSON.parse(jsonMatch[0]);
              return analyses.map((a, idx) => ({
                ...a,
                id: `dialogue_qual_${Date.now()}_${idx}`,
                type: "dialogue_quality",
                createdAt: Date.now(),
                source: "ai_analysis"
              }));
            }
            return [];
          } catch (error) {
            console.error("Error analyzing dialogue quality:", error);
            return [];
          }
        }
        /**
         * Check character voice consistency
         * @param {string} chapterText - Chapter content
         * @param {Array} characters - Character list with voice profiles
         * @returns {Promise<Array>} Voice consistency checks
         */
        async checkCharacterVoiceConsistency(chapterText, characters = []) {
          try {
            const characterVoices = characters.map((c) => ({
              name: c.name,
              voice: c.voiceProfile || c.voice || "Not specified"
            }));
            const systemContext = `You are a character voice consistency expert.
Check if character voices are consistent across dialogue.
Compare: current dialogue vs voice profile, consistency issues, voice quality.`;
            const prompt = `Check character voice consistency:

Chapter text:
${chapterText.substring(0, 5e3)}

Character voice profiles:
${JSON.stringify(characterVoices, null, 2)}

For each character, check:
1. Voice consistency with profile
2. Voice quality
3. Consistency issues
4. Voice improvements needed

Return JSON array:
[
  {
    "character": "Character name",
    "voiceConsistency": "consistent|mostly_consistent|inconsistent",
    "consistencyScore": 1-10,
    "issues": ["Issue 1", "Issue 2"],
    "voiceQuality": "excellent|good|adequate|poor",
    "suggestions": ["Suggestion 1", "Suggestion 2"],
    "priority": "high|medium|low",
    "confidence": 0.0-1.0
  }
]`;
            const response = await aiService_default.callAI(prompt, "analytical", systemContext);
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const checks = JSON.parse(jsonMatch[0]);
              return checks.map((c, idx) => ({
                ...c,
                id: `voice_cons_${Date.now()}_${idx}`,
                type: "voice_consistency",
                createdAt: Date.now(),
                source: "ai_analysis"
              }));
            }
            return [];
          } catch (error) {
            console.error("Error checking character voice consistency:", error);
            return [];
          }
        }
        /**
         * Detect comedy potential in dialogue
         * @param {string} chapterText - Chapter content
         * @param {Array} characters - Character list
         * @returns {Promise<Array>} Comedy dialogue suggestions
         */
        async detectDialogueComedy(chapterText, characters = []) {
          try {
            const characterNames = characters.map((c) => c.name).join(", ");
            const systemContext = `You are a comedy dialogue expert for "The Compliance Run" - a dark comedy series.
Detect comedy opportunities in dialogue.
Consider: wit, timing, character comedy, situational humor, callback humor.`;
            const prompt = `Detect comedy potential in dialogue:

Chapter text:
${chapterText.substring(0, 5e3)}

Characters: ${characterNames || "None"}

Identify:
1. Comedy opportunities in dialogue
2. Wit and wordplay potential
3. Character comedy moments
4. Situational humor in dialogue
5. Callback humor opportunities

Return JSON array:
[
  {
    "dialogue": "Dialogue excerpt",
    "character": "Character speaking",
    "comedyPotential": "What makes this funny",
    "comedyType": "wit|timing|character|situational|callback",
    "suggestions": ["Suggestion 1", "Suggestion 2"],
    "priority": "high|medium|low",
    "confidence": 0.0-1.0
  }
]`;
            const response = await aiService_default.callAI(prompt, "analytical", systemContext);
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const comedy = JSON.parse(jsonMatch[0]);
              return comedy.map((c, idx) => ({
                ...c,
                id: `dialogue_comedy_${Date.now()}_${idx}`,
                type: "dialogue_comedy",
                createdAt: Date.now(),
                source: "ai_analysis"
              }));
            }
            return [];
          } catch (error) {
            console.error("Error detecting dialogue comedy:", error);
            return [];
          }
        }
        /**
         * Comprehensive dialogue analysis
         * @param {string} chapterText - Chapter content
         * @param {Array} characters - Character list
         * @returns {Promise<Object>} Complete dialogue analysis
         */
        async analyzeDialogue(chapterText, characters = []) {
          try {
            const [
              quality,
              voiceConsistency,
              comedy
            ] = await Promise.all([
              this.analyzeDialogueQuality(chapterText, characters),
              this.checkCharacterVoiceConsistency(chapterText, characters),
              this.detectDialogueComedy(chapterText, characters)
            ]);
            return {
              quality,
              voiceConsistency,
              comedy,
              all: [
                ...quality,
                ...voiceConsistency,
                ...comedy
              ]
            };
          } catch (error) {
            console.error("Error in comprehensive dialogue analysis:", error);
            return {
              quality: [],
              voiceConsistency: [],
              comedy: [],
              all: []
            };
          }
        }
      };
      dialogueAnalysisService = new DialogueAnalysisService();
      dialogueAnalysisService_default = dialogueAnalysisService;
    }
  });

  // src/services/worldConsistencyService.js
  var WorldConsistencyService, worldConsistencyService, worldConsistencyService_default;
  var init_worldConsistencyService = __esm({
    "src/services/worldConsistencyService.js"() {
      init_aiService();
      init_database();
      WorldConsistencyService = class {
        constructor() {
          this.cache = /* @__PURE__ */ new Map();
        }
        /**
         * Monitor world rules
         * @param {string} chapterText - Chapter content
         * @param {Object} worldRules - Existing world rules
         * @returns {Promise<Array>} Rule violation checks
         */
        async monitorWorldRules(chapterText, worldRules = {}) {
          try {
            const systemContext = `You are a world consistency expert.
Monitor world rules and magic systems for violations.
Check: rule violations, rule applications, consistency issues.`;
            const prompt = `Monitor world rules:

Chapter text:
${chapterText.substring(0, 5e3)}

World rules:
${JSON.stringify(worldRules, null, 2)}

Check for:
1. Rule violations
2. Rule applications
3. Consistency issues
4. Rule implications
5. New rules that should be established

Return JSON array:
[
  {
    "rule": "World rule being checked",
    "violation": "Violation description or null",
    "application": "How rule is applied",
    "consistency": "consistent|inconsistent|unclear",
    "suggestions": ["Suggestion 1", "Suggestion 2"],
    "priority": "high|medium|low",
    "confidence": 0.0-1.0
  }
]`;
            const response = await aiService_default.callAI(prompt, "analytical", systemContext);
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const checks = JSON.parse(jsonMatch[0]);
              return checks.map((c, idx) => ({
                ...c,
                id: `world_rule_${Date.now()}_${idx}`,
                type: "world_rule",
                createdAt: Date.now(),
                source: "ai_analysis"
              }));
            }
            return [];
          } catch (error) {
            console.error("Error monitoring world rules:", error);
            return [];
          }
        }
        /**
         * Monitor location consistency
         * @param {string} chapterText - Chapter content
         * @param {Array} locations - Existing locations
         * @returns {Promise<Array>} Location consistency checks
         */
        async monitorLocationConsistency(chapterText, locations = []) {
          try {
            const locationNames = locations.map((l) => l.name).join(", ");
            const systemContext = `You are a location consistency expert.
Monitor location and geography consistency.
Check: location descriptions, geography, travel distances, location relationships.`;
            const prompt = `Monitor location consistency:

Chapter text:
${chapterText.substring(0, 5e3)}

Existing locations: ${locationNames || "None"}

Check for:
1. Location description consistency
2. Geography consistency
3. Travel distance consistency
4. Location relationship consistency
5. New locations mentioned

Return JSON array:
[
  {
    "location": "Location name",
    "consistency": "consistent|inconsistent|new",
    "issues": ["Issue 1", "Issue 2"],
    "description": "Location description",
    "geography": "Geographic details",
    "suggestions": ["Suggestion 1", "Suggestion 2"],
    "priority": "high|medium|low",
    "confidence": 0.0-1.0
  }
]`;
            const response = await aiService_default.callAI(prompt, "analytical", systemContext);
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const checks = JSON.parse(jsonMatch[0]);
              return checks.map((c, idx) => ({
                ...c,
                id: `location_cons_${Date.now()}_${idx}`,
                type: "location_consistency",
                createdAt: Date.now(),
                source: "ai_analysis"
              }));
            }
            return [];
          } catch (error) {
            console.error("Error monitoring location consistency:", error);
            return [];
          }
        }
        /**
         * Check timeline consistency
         * @param {string} chapterText - Chapter content
         * @param {Array} timelineEvents - Existing timeline events
         * @returns {Promise<Array>} Timeline consistency checks
         */
        async checkTimelineConsistency(chapterText, timelineEvents = []) {
          try {
            const recentEvents = timelineEvents.slice(-10).map((e) => ({
              title: e.title,
              timestamp: e.timestamp,
              chapterId: e.chapterId
            }));
            const systemContext = `You are a timeline consistency expert.
Check chronological consistency.
Verify: event order, timeline conflicts, chronological accuracy.`;
            const prompt = `Check timeline consistency:

Chapter text:
${chapterText.substring(0, 5e3)}

Recent timeline events:
${JSON.stringify(recentEvents, null, 2)}

Check for:
1. Timeline conflicts
2. Event order issues
3. Chronological accuracy
4. Time gaps or jumps
5. Timeline inconsistencies

Return JSON array:
[
  {
    "event": "Event description",
    "timelineIssue": "Timeline issue or null",
    "conflict": "Conflict with other events or null",
    "chronologicalAccuracy": "accurate|inaccurate|unclear",
    "suggestions": ["Suggestion 1", "Suggestion 2"],
    "priority": "high|medium|low",
    "confidence": 0.0-1.0
  }
]`;
            const response = await aiService_default.callAI(prompt, "analytical", systemContext);
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const checks = JSON.parse(jsonMatch[0]);
              return checks.map((c, idx) => ({
                ...c,
                id: `timeline_cons_${Date.now()}_${idx}`,
                type: "timeline_consistency",
                createdAt: Date.now(),
                source: "ai_analysis"
              }));
            }
            return [];
          } catch (error) {
            console.error("Error checking timeline consistency:", error);
            return [];
          }
        }
        /**
         * Verify character stats consistency
         * @param {string} chapterText - Chapter content
         * @param {Array} characters - Character list with stats
         * @returns {Promise<Array>} Stats consistency checks
         */
        async verifyCharacterStatsConsistency(chapterText, characters = []) {
          try {
            const characterStats = characters.map((c) => ({
              name: c.name,
              stats: c.baseStats || {},
              skills: c.activeSkills || []
            }));
            const systemContext = `You are a character stats consistency expert.
Verify character stats and abilities consistency.
Check: stat changes, ability usage, power level consistency.`;
            const prompt = `Verify character stats consistency:

Chapter text:
${chapterText.substring(0, 5e3)}

Character stats:
${JSON.stringify(characterStats, null, 2)}

Check for:
1. Stat change consistency
2. Ability usage consistency
3. Power level consistency
4. Stat contradictions
5. Ability contradictions

Return JSON array:
[
  {
    "character": "Character name",
    "statIssue": "Stat issue or null",
    "abilityIssue": "Ability issue or null",
    "consistency": "consistent|inconsistent|unclear",
    "issues": ["Issue 1", "Issue 2"],
    "suggestions": ["Suggestion 1", "Suggestion 2"],
    "priority": "high|medium|low",
    "confidence": 0.0-1.0
  }
]`;
            const response = await aiService_default.callAI(prompt, "analytical", systemContext);
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const checks = JSON.parse(jsonMatch[0]);
              return checks.map((c, idx) => ({
                ...c,
                id: `stats_cons_${Date.now()}_${idx}`,
                type: "stats_consistency",
                createdAt: Date.now(),
                source: "ai_analysis"
              }));
            }
            return [];
          } catch (error) {
            console.error("Error verifying character stats consistency:", error);
            return [];
          }
        }
        /**
         * Comprehensive world consistency monitoring
         * @param {string} chapterText - Chapter content
         * @param {Object} worldState - Full world state
         * @returns {Promise<Object>} Complete consistency analysis
         */
        async monitorWorldConsistency(chapterText, worldState = {}) {
          try {
            const [
              rules,
              locations,
              timeline,
              stats
            ] = await Promise.all([
              this.monitorWorldRules(chapterText, worldState.worldRules || {}),
              this.monitorLocationConsistency(chapterText, worldState.locations || []),
              this.checkTimelineConsistency(chapterText, worldState.timelineEvents || []),
              this.verifyCharacterStatsConsistency(chapterText, worldState.actors || [])
            ]);
            return {
              rules,
              locations,
              timeline,
              stats,
              all: [
                ...rules,
                ...locations,
                ...timeline,
                ...stats
              ]
            };
          } catch (error) {
            console.error("Error in comprehensive world consistency monitoring:", error);
            return {
              rules: [],
              locations: [],
              timeline: [],
              stats: [],
              all: []
            };
          }
        }
      };
      worldConsistencyService = new WorldConsistencyService();
      worldConsistencyService_default = worldConsistencyService;
    }
  });

  // src/services/manuscriptIntelligenceService.js
  var manuscriptIntelligenceService_exports = {};
  __export(manuscriptIntelligenceService_exports, {
    default: () => manuscriptIntelligenceService_default
  });
  var ManuscriptIntelligenceService, manuscriptIntelligenceService, manuscriptIntelligenceService_default;
  var init_manuscriptIntelligenceService = __esm({
    "src/services/manuscriptIntelligenceService.js"() {
      init_aiService();
      init_database();
      init_chapterDataExtractionService();
      init_aiSuggestionService();
      init_relationshipAnalysisService();
      init_plotThreadingService();
      init_emotionalBeatService();
      init_dialogueAnalysisService();
      init_worldConsistencyService();
      ManuscriptIntelligenceService = class {
        constructor() {
          this.cache = /* @__PURE__ */ new Map();
          this.defaultBatchSize = 25;
        }
        getBatchSize() {
          const configured = Number(localStorage.getItem("chapter_ingestion_batch_size"));
          return Number.isFinite(configured) && configured > 0 ? configured : this.defaultBatchSize;
        }
        async ingestChapterExtractionTransactional(chapter, extractionPayload = {}) {
          const dedupedTimelineEvents = await this.dedupeTimelineEventsForChapter(
            extractionPayload.timelineEvents || [],
            (chapter == null ? void 0 : chapter.id) || null
          );
          const storePayload = {
            plotBeats: extractionPayload.beats || [],
            timelineEvents: dedupedTimelineEvents,
            storylines: extractionPayload.storylines || [],
            decisions: extractionPayload.decisions || [],
            callbacks: extractionPayload.callbacks || [],
            aiSuggestions: extractionPayload.aiSuggestions || []
          };
          const stores = Object.entries(storePayload).filter(([, records]) => Array.isArray(records) && records.length > 0).map(([storeName]) => storeName);
          if (stores.length === 0) {
            return;
          }
          const batchSize = this.getBatchSize();
          const maxLength = Math.max(...stores.map((name) => storePayload[name].length));
          for (let offset = 0; offset < maxLength; offset += batchSize) {
            await database_default.executeTransaction(stores, "readwrite", ({ stores: txStores }) => {
              stores.forEach((storeName) => {
                const chunk = storePayload[storeName].slice(offset, offset + batchSize);
                chunk.forEach((record) => {
                  txStores[storeName].put({
                    ...record,
                    chapterId: record.chapterId || (chapter == null ? void 0 : chapter.id) || null,
                    chapterNumber: record.chapterNumber || (chapter == null ? void 0 : chapter.number) || null,
                    updatedAt: Date.now()
                  });
                });
              });
            });
          }
        }
        async dedupeTimelineEventsForChapter(events = [], chapterId = null) {
          if (!Array.isArray(events) || events.length === 0) {
            return [];
          }
          const normalized = [];
          const seen = /* @__PURE__ */ new Set();
          const existingEvents = chapterId ? await database_default.getByIndex("timelineEvents", "chapterId", chapterId) : [];
          const existingKeys = new Set(
            existingEvents.map(
              (event) => this.buildTimelineEventDedupKey(
                event.title,
                event.description,
                event.type,
                event.chapterId,
                event.bookId
              )
            )
          );
          events.forEach((event) => {
            const dedupeKey = this.buildTimelineEventDedupKey(
              event.title,
              event.description,
              event.type,
              event.chapterId || chapterId,
              event.bookId
            );
            if (!dedupeKey || seen.has(dedupeKey) || existingKeys.has(dedupeKey)) {
              return;
            }
            seen.add(dedupeKey);
            normalized.push(event);
          });
          return normalized;
        }
        buildTimelineEventDedupKey(title, description, type, chapterId, bookId) {
          const normalize = (value) => (value || "").toString().trim().toLowerCase();
          const normalizedTitle = normalize(title);
          const normalizedDescription = normalize(description).slice(0, 120);
          if (!normalizedTitle && !normalizedDescription) {
            return "";
          }
          return [
            normalizedTitle,
            normalizedDescription,
            normalize(type),
            normalize(chapterId),
            normalize(bookId)
          ].join("|");
        }
        /**
         * Extract book structure from document
         * @param {string} docText - Full document text
         * @param {Array} existingBooks - Existing books for reference
         * @returns {Promise<Object>} Extracted book structure
         */
        async extractBookStructure(docText, existingBooks = []) {
          try {
            const existingTitles = existingBooks.map((b) => b.title || "").filter(Boolean).join(", ");
            const systemContext = `You are analyzing a document for "The Compliance Run" book series.
Extract book structure including title, focus theme, description, and metadata.
Return JSON with this structure:
{
  "book": {
    "title": "Book Title",
    "focus": "Main theme/focus",
    "desc": "Book description",
    "bookNumber": 1,
    "metadata": {
      "genre": "...",
      "tone": "...",
      "setting": "..."
    }
  },
  "confidence": 0.9
}`;
            const prompt = `Analyze this document and extract book structure:

${docText.substring(0, 1e4)}

${existingTitles ? `Existing books: ${existingTitles}` : "No existing books found"}

Extract the book structure. If multiple books are mentioned, extract the primary book or the first one.`;
            const response = await aiService_default.callAI(prompt, "analytical", systemContext);
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              return parsed;
            }
            return { book: null, confidence: 0, raw: response };
          } catch (error) {
            console.error("Error extracting book structure:", error);
            return { book: null, confidence: 0, error: error.message };
          }
        }
        /**
         * Extract chapter flows from document
         * @param {string} docText - Full document text
         * @param {Object} book - Book object to assign chapters to
         * @returns {Promise<Array>} Array of extracted chapters
         */
        async extractChapterFlows(docText, book) {
          try {
            const systemContext = `You are analyzing a document to extract all chapters.
Extract chapters with their titles, descriptions, content, and order.
Return JSON array:
[
  {
    "title": "Chapter Title",
    "desc": "Chapter description",
    "number": 1,
    "content": "Full chapter text if available",
    "keyPlotPoints": ["plot point 1", "plot point 2"],
    "characters": ["Character 1", "Character 2"],
    "order": 1
  }
]`;
            const prompt = `Analyze this document and extract ALL chapters:

${docText}

Book context: ${book ? `Book: ${book.title || "Unknown"}` : "No book context"}

Extract all chapters with their titles, descriptions, and content. Maintain chapter order.`;
            const response = await aiService_default.callAI(prompt, "analytical", systemContext);
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const chapters = JSON.parse(jsonMatch[0]);
              return chapters.map((ch, idx) => ({
                ...ch,
                id: ch.id || `chapter_extracted_${Date.now()}_${idx}`,
                number: ch.number || ch.order || idx + 1,
                bookId: (book == null ? void 0 : book.id) || null,
                script: ch.content || ch.script || "",
                extracted: true,
                createdAt: Date.now()
              }));
            }
            return [];
          } catch (error) {
            console.error("Error extracting chapter flows:", error);
            return [];
          }
        }
        /**
         * Extract complete chapter data including beats, storylines, etc.
         * @param {string} chapterText - Chapter content
         * @param {number} chapterNumber - Chapter number
         * @param {number} bookId - Book ID
         * @param {Array} actors - Available actors
         * @returns {Promise<Object>} Complete chapter data
         */
        async extractCompleteChapterData(chapterText, chapterNumber, bookId, actors = []) {
          if (!chapterText || chapterText.trim().length < 50) {
            return {
              beats: [],
              storylines: [],
              characterArcs: [],
              timelineEvents: [],
              decisions: [],
              callbacks: []
            };
          }
          try {
            const [
              beats,
              events,
              storylines,
              characterArcs,
              decisions,
              callbacks
            ] = await Promise.all([
              chapterDataExtractionService_default.extractBeatsFromChapter(chapterText, chapterNumber, bookId),
              chapterDataExtractionService_default.extractEventsFromChapter(chapterText, null, bookId, actors),
              this.extractStorylines(chapterText, chapterNumber, bookId),
              this.extractCharacterArcMoments(chapterText, chapterNumber, bookId, actors),
              this.extractDecisions(chapterText, chapterNumber, bookId),
              this.extractCallbacks(chapterText, chapterNumber, bookId)
            ]);
            return {
              beats,
              storylines,
              characterArcs,
              timelineEvents: events,
              decisions,
              callbacks
            };
          } catch (error) {
            console.error("Error extracting complete chapter data:", error);
            return {
              beats: [],
              storylines: [],
              characterArcs: [],
              timelineEvents: [],
              decisions: [],
              callbacks: []
            };
          }
        }
        /**
         * Extract storylines from chapter
         * @param {string} chapterText - Chapter content
         * @param {number} chapterNumber - Chapter number
         * @param {number} bookId - Book ID
         * @returns {Promise<Array>} Array of storylines
         */
        async extractStorylines(chapterText, chapterNumber, bookId) {
          try {
            const prompt = `Analyze this chapter and extract storylines/plot threads:

Chapter ${chapterNumber}:
${chapterText.substring(0, 5e3)}

Extract storylines that:
- Span multiple chapters or are part of larger arcs
- Have continuity that should be tracked
- Are important plot threads

Return JSON array:
[
  {
    "title": "Storyline title",
    "description": "What this storyline is about",
    "status": "active|resolved|ongoing",
    "importance": 1-10,
    "relatedChapters": [1, 2, 3],
    "characters": ["Character 1", "Character 2"]
  }
]`;
            const response = await aiService_default.callAI(prompt, "structured");
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const storylines = JSON.parse(jsonMatch[0]);
              return storylines.map((sl, idx) => ({
                ...sl,
                id: `storyline_${Date.now()}_${idx}`,
                chapterNumber,
                bookId,
                createdAt: Date.now(),
                extracted: true
              }));
            }
            return [];
          } catch (error) {
            console.error("Error extracting storylines:", error);
            return [];
          }
        }
        /**
         * Extract character arc moments
         * @param {string} chapterText - Chapter content
         * @param {number} chapterNumber - Chapter number
         * @param {number} bookId - Book ID
         * @param {Array} actors - Available actors
         * @returns {Promise<Array>} Array of character arc moments
         */
        async extractCharacterArcMoments(chapterText, chapterNumber, bookId, actors = []) {
          try {
            const actorNames = actors.map((a) => a.name).join(", ");
            const prompt = `Analyze this chapter for character development moments:

Chapter ${chapterNumber}:
${chapterText.substring(0, 5e3)}

Available characters: ${actorNames || "None"}

Extract character arc moments - significant character development, growth, or change:
- Character milestones
- Emotional development
- Skill/ability growth
- Relationship changes
- Personal revelations

Return JSON array:
[
  {
    "characterName": "Character name",
    "moment": "What happened",
    "type": "growth|revelation|conflict|resolution",
    "importance": 1-10,
    "emotionalState": "...",
    "impact": "How this affects the character"
  }
]`;
            const response = await aiService_default.callAI(prompt, "structured");
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const moments = JSON.parse(jsonMatch[0]);
              return moments.map((m, idx) => ({
                ...m,
                id: `arc_moment_${Date.now()}_${idx}`,
                chapterNumber,
                bookId,
                createdAt: Date.now(),
                extracted: true
              }));
            }
            return [];
          } catch (error) {
            console.error("Error extracting character arc moments:", error);
            return [];
          }
        }
        /**
         * Extract decisions from chapter
         * @param {string} chapterText - Chapter content
         * @param {number} chapterNumber - Chapter number
         * @param {number} bookId - Book ID
         * @returns {Promise<Array>} Array of decisions
         */
        async extractDecisions(chapterText, chapterNumber, bookId) {
          try {
            const prompt = `Analyze this chapter for important decisions:

Chapter ${chapterNumber}:
${chapterText.substring(0, 5e3)}

Extract decisions that:
- Matter for future story development
- Have consequences that should be tracked
- Affect character relationships or plot direction
- Are choices characters make that impact the story

Return JSON array:
[
  {
    "decision": "What decision was made",
    "character": "Who made it",
    "consequences": "What consequences this might have",
    "importance": 1-10,
    "type": "plot|character|relationship|world"
  }
]`;
            const response = await aiService_default.callAI(prompt, "structured");
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const decisions = JSON.parse(jsonMatch[0]);
              return decisions.map((d, idx) => ({
                ...d,
                id: `decision_${Date.now()}_${idx}`,
                chapterNumber,
                bookId,
                createdAt: Date.now(),
                extracted: true
              }));
            }
            return [];
          } catch (error) {
            console.error("Error extracting decisions:", error);
            return [];
          }
        }
        /**
         * Extract callback opportunities
         * @param {string} chapterText - Chapter content
         * @param {number} chapterNumber - Chapter number
         * @param {number} bookId - Book ID
         * @returns {Promise<Array>} Array of callback opportunities
         */
        async extractCallbacks(chapterText, chapterNumber, bookId) {
          try {
            const prompt = `Analyze this chapter for callback opportunities:

Chapter ${chapterNumber}:
${chapterText.substring(0, 5e3)}

Extract events, moments, or details that:
- Should be referenced later in the story
- Set up future plot points
- Are memorable moments that characters might recall
- Create opportunities for callbacks or references

Return JSON array:
[
  {
    "event": "What happened",
    "description": "Details of the event",
    "type": "memory|setup|reference|callback",
    "importance": 1-10,
    "suggestedCallbackChapter": null or chapter number
  }
]`;
            const response = await aiService_default.callAI(prompt, "structured");
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const callbacks = JSON.parse(jsonMatch[0]);
              return callbacks.map((cb, idx) => ({
                ...cb,
                id: `callback_${Date.now()}_${idx}`,
                chapterNumber,
                bookId,
                createdAt: Date.now(),
                extracted: true
              }));
            }
            return [];
          } catch (error) {
            console.error("Error extracting callbacks:", error);
            return [];
          }
        }
        /**
         * Save extraction session to database
         * @param {Object} sessionData - Complete session data
         * @returns {Promise<Object>} Saved session
         */
        async saveExtractionSession(sessionData) {
          try {
            const session = {
              id: sessionData.id || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              timestamp: sessionData.timestamp || Date.now(),
              status: sessionData.status || "active",
              sourceType: sessionData.sourceType || "text",
              sourceName: sessionData.sourceName || "",
              documentText: sessionData.documentText || "",
              suggestions: sessionData.suggestions || [],
              reviewStatus: sessionData.reviewStatus || {},
              appliedActions: sessionData.appliedActions || {},
              wizardState: sessionData.wizardState || {},
              extractionResults: sessionData.extractionResults || {},
              lastSaved: Date.now()
            };
            try {
              await database_default.add("extractionSessions", session);
            } catch (e) {
              await database_default.update("extractionSessions", session);
            }
            return session;
          } catch (error) {
            console.error("Error saving extraction session:", error);
            throw error;
          }
        }
        /**
         * Load extraction session from database
         * @param {string} sessionId - Session ID
         * @returns {Promise<Object>} Session data
         */
        async loadExtractionSession(sessionId) {
          try {
            const session = await database_default.get("extractionSessions", sessionId);
            return session;
          } catch (error) {
            console.error("Error loading extraction session:", error);
            return null;
          }
        }
        /**
         * Get active sessions that can be resumed
         * @returns {Promise<Array>} Array of active sessions
         */
        async getActiveSessions() {
          try {
            const allSessions = await database_default.getAll("extractionSessions");
            return allSessions.filter((s) => s.status === "active" || s.status === "paused").sort((a, b) => (b.lastSaved || b.timestamp) - (a.lastSaved || a.timestamp)).slice(0, 10);
          } catch (error) {
            console.error("Error getting active sessions:", error);
            return [];
          }
        }
        /**
         * Resume a session - restore wizard state
         * @param {string} sessionId - Session ID
         * @returns {Promise<Object>} Session data for restoration
         */
        async resumeSession(sessionId) {
          try {
            const session = await this.loadExtractionSession(sessionId);
            if (!session) {
              throw new Error("Session not found");
            }
            session.status = "active";
            session.lastSaved = Date.now();
            await database_default.update("extractionSessions", session);
            return {
              session,
              suggestions: session.suggestions || [],
              reviewStatus: session.reviewStatus || {},
              appliedActions: session.appliedActions || {},
              wizardState: session.wizardState || {},
              extractionResults: session.extractionResults || {}
            };
          } catch (error) {
            console.error("Error resuming session:", error);
            throw error;
          }
        }
        /**
         * Save processing checkpoint
         * @param {string} sessionId - Session ID
         * @param {number} progress - Progress percentage
         * @param {Object} checkpointData - Data to save
         * @returns {Promise<void>}
         */
        async _saveCheckpoint(sessionId, progress, checkpointData) {
          try {
            const session = await this.loadExtractionSession(sessionId);
            if (session) {
              session.processingCheckpoint = {
                progress: { current: progress, status: "Processing...", liveSuggestions: [] },
                data: checkpointData,
                timestamp: Date.now()
              };
              session.status = "processing";
              await database_default.update("extractionSessions", session);
            }
          } catch (error) {
            console.warn("Error saving checkpoint:", error);
          }
        }
        /**
         * Save wizard state to database
         * @param {string} sessionId - Session ID
         * @param {Object} wizardState - Current wizard state
         * @returns {Promise<void>}
         */
        async saveWizardState(sessionId, wizardState) {
          try {
            const session = await this.loadExtractionSession(sessionId);
            if (session) {
              session.wizardState = wizardState;
              session.lastSaved = Date.now();
              await database_default.update("extractionSessions", session);
            } else {
              await this.saveExtractionSession({
                id: sessionId,
                wizardState,
                status: "active"
              });
            }
          } catch (error) {
            console.error("Error saving wizard state:", error);
          }
        }
        /**
         * Process complete document - extract everything
         * @param {string} docText - Full document text
         * @param {Object} worldState - Current world state
         * @param {Function} onProgress - Progress callback
         * @param {string} sessionId - Optional session ID for persistence
         * @returns {Promise<Object>} Complete extraction results
         */
        async processCompleteDocument(docText, worldState, onProgress = null, sessionId = null) {
          var _a, _b;
          try {
            let checkpoint = null;
            let startFromCheckpoint = false;
            if (sessionId) {
              try {
                const session = await this.loadExtractionSession(sessionId);
                if (session == null ? void 0 : session.processingCheckpoint) {
                  checkpoint = session.processingCheckpoint;
                  startFromCheckpoint = true;
                  if (onProgress && checkpoint.progress) {
                    onProgress(checkpoint.progress);
                  }
                }
              } catch (e) {
                console.warn("Error loading checkpoint:", e);
              }
            }
            if (onProgress && !startFromCheckpoint) {
              onProgress({ current: 5, status: "Extracting book structure..." });
            }
            let bookResult;
            if (startFromCheckpoint && ((_a = checkpoint.data) == null ? void 0 : _a.bookResult)) {
              bookResult = checkpoint.data.bookResult;
            } else {
              const existingBooks2 = worldState.books ? Object.values(worldState.books) : [];
              bookResult = await this.extractBookStructure(docText, existingBooks2);
            }
            if (onProgress && !startFromCheckpoint) {
              onProgress({ current: 15, status: "Extracting chapters..." });
            }
            let book = bookResult.book;
            const existingBooks = worldState.books ? Object.values(worldState.books) : [];
            if (!book && existingBooks.length > 0) {
              book = existingBooks[0];
            }
            let chapters;
            if (startFromCheckpoint && ((_b = checkpoint.data) == null ? void 0 : _b.chapters)) {
              chapters = checkpoint.data.chapters;
            } else {
              chapters = await this.extractChapterFlows(docText, book);
              if (sessionId && onProgress) {
                await this._saveCheckpoint(sessionId, 15, { bookResult, chapters });
              }
            }
            if (onProgress && !startFromCheckpoint) {
              onProgress({ current: 30, status: `Processing ${chapters.length} chapters...` });
            }
            const allBeats = [];
            const allStorylines = [];
            const allCharacterArcs = [];
            const allTimelineEvents = [];
            const allDecisions = [];
            const allCallbacks = [];
            const allAISuggestions = [];
            const actors = worldState.actors || [];
            for (let i = 0; i < chapters.length; i++) {
              const chapter = chapters[i];
              const chapterText = chapter.script || chapter.content || "";
              if (onProgress) {
                const progress = 30 + i / chapters.length * 50;
                onProgress({
                  current: Math.round(progress),
                  status: `Processing chapter ${i + 1}/${chapters.length}: ${chapter.title || "Untitled"}`
                });
              }
              const chapterData = await this.extractCompleteChapterData(
                chapterText,
                chapter.number || i + 1,
                (book == null ? void 0 : book.id) || null,
                actors
              );
              allBeats.push(...chapterData.beats);
              allStorylines.push(...chapterData.storylines);
              allCharacterArcs.push(...chapterData.characterArcs);
              allTimelineEvents.push(...chapterData.timelineEvents);
              allDecisions.push(...chapterData.decisions);
              allCallbacks.push(...chapterData.callbacks);
              if (onProgress) {
                const aiProgress = 80 + i / chapters.length * 15;
                onProgress({
                  current: Math.round(aiProgress),
                  status: `Generating AI suggestions for chapter ${i + 1}/${chapters.length}...`
                });
              }
              try {
                const context = {
                  previousChapters: chapters.slice(0, i),
                  activeThreads: allStorylines,
                  characters: actors,
                  futureChapters: chapters.slice(i + 1)
                };
                const aiSuggestions = await aiSuggestionService_default.generateAllSuggestions(chapterText, context);
                const relationshipAnalysis = await relationshipAnalysisService_default.analyzeRelationshipsComprehensive(
                  chapterText,
                  actors,
                  worldState.relationships || []
                );
                const emotionalAnalysis = await emotionalBeatService_default.analyzeEmotionalBeats(
                  chapterText,
                  actors,
                  [],
                  []
                );
                const dialogueAnalysis = await dialogueAnalysisService_default.analyzeDialogue(chapterText, actors);
                const worldConsistency = await worldConsistencyService_default.monitorWorldConsistency(chapterText, worldState);
                const chapterAISuggestions = [
                  ...aiSuggestions.all,
                  ...relationshipAnalysis.all,
                  ...emotionalAnalysis.all,
                  ...dialogueAnalysis.all,
                  ...worldConsistency.all
                ].map((s) => ({
                  ...s,
                  chapterId: chapter.id,
                  chapterNumber: chapter.number,
                  bookId: book == null ? void 0 : book.id
                }));
                allAISuggestions.push(...chapterAISuggestions);
                const suggestionRecords = chapterAISuggestions.map((suggestion) => ({
                  id: suggestion.id || `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  chapterId: chapter.id,
                  chapterNumber: chapter.number,
                  bookId: (book == null ? void 0 : book.id) || null,
                  type: suggestion.type || "unknown",
                  priority: suggestion.priority || "medium",
                  confidence: suggestion.confidence || 0.5,
                  status: "pending",
                  suggestion: suggestion.suggestion || suggestion.comedyMoment || suggestion.conflict || suggestion.event || suggestion.decision || "",
                  reasoning: suggestion.reasoning || "",
                  suggestions: suggestion.suggestions || [],
                  characters: suggestion.characters || suggestion.character1 ? [suggestion.character1, suggestion.character2].filter(Boolean) : [],
                  data: suggestion,
                  createdAt: Date.now(),
                  source: "manuscript_intelligence"
                }));
                await this.ingestChapterExtractionTransactional(chapter, {
                  beats: chapterData.beats,
                  timelineEvents: chapterData.timelineEvents,
                  storylines: chapterData.storylines,
                  decisions: chapterData.decisions,
                  callbacks: chapterData.callbacks,
                  aiSuggestions: suggestionRecords
                });
              } catch (error) {
                console.warn("Error generating/ingesting chapter AI suggestions:", error);
                await this.ingestChapterExtractionTransactional(chapter, {
                  beats: chapterData.beats,
                  timelineEvents: chapterData.timelineEvents,
                  storylines: chapterData.storylines,
                  decisions: chapterData.decisions,
                  callbacks: chapterData.callbacks
                });
              }
            }
            if (onProgress) {
              onProgress({ current: 95, status: "Analyzing plot threading..." });
            }
            let plotThreadingAnalysis = { all: [] };
            try {
              const plotThreads = await database_default.getAll("plotThreads") || [];
              plotThreadingAnalysis = await plotThreadingService_default.analyzePlotThreading(plotThreads, chapters);
            } catch (error) {
              console.warn("Error analyzing plot threading:", error);
            }
            if (onProgress) {
              onProgress({ current: 95, status: "Finalizing extraction..." });
            }
            const results = {
              book,
              chapters,
              beats: allBeats,
              storylines: allStorylines,
              characterArcs: allCharacterArcs,
              timelineEvents: allTimelineEvents,
              decisions: allDecisions,
              callbacks: allCallbacks,
              aiSuggestions: allAISuggestions,
              plotThreading: plotThreadingAnalysis,
              summary: {
                booksFound: book ? 1 : 0,
                chaptersFound: chapters.length,
                beatsFound: allBeats.length,
                storylinesFound: allStorylines.length,
                characterArcsFound: allCharacterArcs.length,
                timelineEventsFound: allTimelineEvents.length,
                decisionsFound: allDecisions.length,
                callbacksFound: allCallbacks.length,
                aiSuggestionsFound: allAISuggestions.length
              }
            };
            if (sessionId) {
              try {
                const session = await this.loadExtractionSession(sessionId);
                if (session) {
                  session.extractionResults = results;
                  session.status = "completed";
                  session.processingEndTime = Date.now();
                  delete session.processingCheckpoint;
                  await database_default.update("extractionSessions", session);
                } else {
                  await this.saveExtractionSession({
                    id: sessionId,
                    documentText: docText,
                    extractionResults: results,
                    status: "completed",
                    sourceType: "document",
                    sourceName: "Complete Document Extraction",
                    processingEndTime: Date.now()
                  });
                }
              } catch (error) {
                console.warn("Failed to save extraction session:", error);
              }
            }
            return results;
          } catch (error) {
            console.error("Error processing complete document:", error);
            throw error;
          }
        }
      };
      manuscriptIntelligenceService = new ManuscriptIntelligenceService();
      manuscriptIntelligenceService_default = manuscriptIntelligenceService;
    }
  });

  // src/services/aiService.js
  var AIService, aiService, aiService_default;
  var init_aiService = __esm({
    "src/services/aiService.js"() {
      init_offlineAIService();
      init_intelligenceRouter();
      AIService = class {
        constructor() {
          this.requestQueue = [];
          this.isProcessingQueue = false;
          this.maxConcurrentRequests = 2;
          this.activeRequests = 0;
          this.responseCache = /* @__PURE__ */ new Map();
          this.cacheTTL = 10 * 60 * 1e3;
          this.activeRequestControllers = /* @__PURE__ */ new Map();
          this.router = intelligenceRouter_default;
          this.apis = {
            gemini: {
              key: "",
              endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent",
              requiresKey: true,
              free: false
            },
            openai: {
              key: "",
              endpoint: "https://api.openai.com/v1/chat/completions",
              requiresKey: true,
              free: false
            },
            anthropic: {
              key: "",
              endpoint: "https://api.anthropic.com/v1/messages",
              requiresKey: true,
              free: false
            },
            groq: {
              key: "",
              endpoint: "https://api.groq.com/openai/v1/chat/completions",
              requiresKey: true,
              free: true,
              // Free tier: 14,400 requests/day
              model: "llama-3.1-70b-versatile"
            },
            huggingface: {
              key: "",
              endpoint: "https://api-inference.huggingface.co/models/microsoft/Phi-3-mini-4k-instruct",
              requiresKey: false,
              // Can work without key, but better with key
              free: true,
              model: "microsoft/Phi-3-mini-4k-instruct"
              // Faster, smaller model that works well
            }
          };
          this.envKeyMap = {
            gemini: "",
            openai: "",
            anthropic: "",
            groq: "",
            huggingface: ""
          };
          this.runtimeKeys = {};
          this.useServerProxy = false;
          this.preferredProvider = localStorage.getItem("ai_preferred_provider") || "auto";
          this.loadApiKeys();
          this._assertNoHardcodedKeys();
        }
        /**
         * Set preferred AI provider
         */
        setPreferredProvider(provider) {
          this.preferredProvider = provider;
          localStorage.setItem("ai_preferred_provider", provider);
        }
        /**
         * Get preferred provider
         */
        getPreferredProvider() {
          return this.preferredProvider;
        }
        /**
         * Get offline AI status
         */
        getOfflineAIStatus() {
          return offlineAIService_default.getReadyState();
        }
        /**
         * Check if offline AI is available
         */
        isOfflineAIAvailable() {
          return offlineAIService_default.isAvailable();
        }
        /**
         * Preload offline AI model (call this early to download model in background)
         */
        async preloadOfflineAI() {
          if (offlineAIService_default.isAvailable()) {
            try {
              await offlineAIService_default.loadModel();
              console.log("[AI Service] Offline AI preloaded successfully");
              return true;
            } catch (error) {
              console.warn("[AI Service] Failed to preload offline AI:", error);
              return false;
            }
          }
          return false;
        }
        /**
         * Set API key for a specific provider
         */
        setApiKey(provider, key) {
          if (this.apis[provider]) {
            this.apis[provider].key = key;
            this.runtimeKeys[provider] = key;
          }
        }
        getRuntimeKeys() {
          return { ...this.runtimeKeys };
        }
        async setApiKeySecure(provider, key) {
          const response = await fetch("/api/ai/ai-session", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...process.env.REACT_APP_CLAIMWISE_CLIENT_TOKEN ? { "x-claimwise-client": process.env.REACT_APP_CLAIMWISE_CLIENT_TOKEN } : {}
            },
            credentials: "include",
            body: JSON.stringify({ provider, key })
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || "Failed to store API key");
          }
          this.setApiKey(provider, key);
          return data;
        }
        async validateApiKey(provider, key) {
          const response = await fetch("/api/ai/ai-validate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...process.env.REACT_APP_CLAIMWISE_CLIENT_TOKEN ? { "x-claimwise-client": process.env.REACT_APP_CLAIMWISE_CLIENT_TOKEN } : {}
            },
            credentials: "include",
            body: JSON.stringify({ provider, key })
          });
          const data = await response.json();
          return Boolean(response.ok && data.valid);
        }
        /**
         * Load API keys from secure runtime sources (env/session proxy)
         */
        loadApiKeys() {
          Object.keys(this.apis).forEach((provider) => {
            if (this.runtimeKeys[provider]) {
              this.apis[provider].key = this.runtimeKeys[provider];
            } else if (this.envKeyMap[provider]) {
              this.apis[provider].key = this.envKeyMap[provider];
            }
          });
          const preferred = localStorage.getItem("ai_preferred_provider");
          if (preferred) {
            this.preferredProvider = preferred;
          }
        }
        _assertNoHardcodedKeys() {
          const keyPattern = /^(sk-|AIza)/;
          const embedded = Object.entries(this.apis).find(([, config]) => keyPattern.test(config.key || ""));
          if (embedded) {
            throw new Error(`Blocked startup: detected hardcoded API key pattern for provider ${embedded[0]}`);
          }
        }
        async callProviderProxy(provider, payload, abortController = null) {
          const fetchOptions = {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...process.env.REACT_APP_CLAIMWISE_CLIENT_TOKEN ? { "x-claimwise-client": process.env.REACT_APP_CLAIMWISE_CLIENT_TOKEN } : {}
            },
            credentials: "include",
            body: JSON.stringify({ provider, ...payload })
          };
          if (abortController) {
            fetchOptions.signal = abortController.signal;
          }
          const response = await fetch("/api/ai/ai-proxy", fetchOptions);
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || "AI proxy error");
          }
          return data.text || "";
        }
        /**
         * Gemini API call
         */
        async callGemini(prompt, systemContext = "", abortController = null, model = null) {
          var _a, _b, _c, _d, _e, _f;
          const geminiModel = model || "gemini-2.5-flash-preview-04-17";
          if (this.useServerProxy) {
            return this.callProviderProxy("gemini", { prompt, systemContext, model: geminiModel }, abortController);
          }
          const { key } = this.apis.gemini;
          if (!key) {
            throw new Error("Gemini API key not set");
          }
          try {
            const fullPrompt = systemContext ? `${systemContext}

${prompt}` : prompt;
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`;
            const fetchOptions = {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: fullPrompt }] }],
                generationConfig: {
                  temperature: 0.7,
                  maxOutputTokens: 8192
                }
              })
            };
            if (abortController) {
              fetchOptions.signal = abortController.signal;
            }
            const response = await fetch(`${endpoint}?key=${key}`, fetchOptions);
            const data = await response.json();
            if (!response.ok) {
              throw new Error(((_a = data.error) == null ? void 0 : _a.message) || "Gemini API error");
            }
            return ((_f = (_e = (_d = (_c = (_b = data.candidates) == null ? void 0 : _b[0]) == null ? void 0 : _c.content) == null ? void 0 : _d.parts) == null ? void 0 : _e[0]) == null ? void 0 : _f.text) || "Error: No text generated.";
          } catch (error) {
            console.error("Gemini API Error:", error);
            throw error;
          }
        }
        /**
         * ChatGPT (OpenAI) API call
         */
        async callChatGPT(prompt, systemContext = "", model = "gpt-4o", abortController = null) {
          var _a, _b, _c, _d;
          if (this.useServerProxy) {
            return this.callProviderProxy("openai", { prompt, systemContext, model }, abortController);
          }
          const { key, endpoint } = this.apis.openai;
          if (!key) {
            throw new Error("OpenAI API key not set");
          }
          try {
            const messages = [];
            if (systemContext) {
              messages.push({ role: "system", content: systemContext });
            }
            messages.push({ role: "user", content: prompt });
            const fetchOptions = {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${key}`
              },
              body: JSON.stringify({
                model,
                messages,
                temperature: 0.7,
                max_tokens: 4096
              })
            };
            if (abortController) {
              fetchOptions.signal = abortController.signal;
            }
            const response = await fetch(endpoint, fetchOptions);
            const data = await response.json();
            if (!response.ok) {
              throw new Error(((_a = data.error) == null ? void 0 : _a.message) || "OpenAI API error");
            }
            return ((_d = (_c = (_b = data.choices) == null ? void 0 : _b[0]) == null ? void 0 : _c.message) == null ? void 0 : _d.content) || "Error: No text generated.";
          } catch (error) {
            console.error("ChatGPT API Error:", error);
            throw error;
          }
        }
        /**
         * Claude (Anthropic) API call
         */
        async callClaude(prompt, systemContext = "", model = "claude-3-5-sonnet-20241022", abortController = null) {
          var _a, _b, _c;
          if (this.useServerProxy) {
            return this.callProviderProxy("anthropic", { prompt, systemContext, model }, abortController);
          }
          const { key, endpoint } = this.apis.anthropic;
          if (!key) {
            throw new Error("Anthropic API key not set");
          }
          try {
            const fetchOptions = {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-api-key": key,
                "anthropic-version": "2023-06-01"
              },
              body: JSON.stringify({
                model,
                max_tokens: 4096,
                system: systemContext || void 0,
                messages: [
                  { role: "user", content: prompt }
                ]
              })
            };
            if (abortController) {
              fetchOptions.signal = abortController.signal;
            }
            const response = await fetch(endpoint, fetchOptions);
            const data = await response.json();
            if (!response.ok) {
              throw new Error(((_a = data.error) == null ? void 0 : _a.message) || "Anthropic API error");
            }
            return ((_c = (_b = data.content) == null ? void 0 : _b[0]) == null ? void 0 : _c.text) || "Error: No text generated.";
          } catch (error) {
            console.error("Claude API Error:", error);
            throw error;
          }
        }
        /**
         * Groq API call (FREE - 14,400 requests/day)
         * Very fast inference with Llama models
         */
        async callGroq(prompt, systemContext = "", model = "llama-3.1-70b-versatile", abortController = null) {
          var _a, _b, _c, _d;
          if (this.useServerProxy) {
            return this.callProviderProxy("groq", { prompt, systemContext, model }, abortController);
          }
          const { key, endpoint } = this.apis.groq;
          if (!key) {
            throw new Error("Groq API key not set. Get a free key at https://console.groq.com/");
          }
          try {
            const messages = [];
            if (systemContext) {
              messages.push({ role: "system", content: systemContext });
            }
            messages.push({ role: "user", content: prompt });
            const fetchOptions = {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${key}`
              },
              body: JSON.stringify({
                model: model || this.apis.groq.model,
                messages,
                temperature: 0.7,
                max_tokens: 4096
              })
            };
            if (abortController) {
              fetchOptions.signal = abortController.signal;
            }
            const response = await fetch(endpoint, fetchOptions);
            const data = await response.json();
            if (!response.ok) {
              throw new Error(((_a = data.error) == null ? void 0 : _a.message) || "Groq API error");
            }
            return ((_d = (_c = (_b = data.choices) == null ? void 0 : _b[0]) == null ? void 0 : _c.message) == null ? void 0 : _d.content) || "Error: No text generated.";
          } catch (error) {
            console.error("Groq API Error:", error);
            throw error;
          }
        }
        /**
         * Hugging Face API call (FREE - no key required, but better with key)
         * Uses open-source models
         */
        async callHuggingFace(prompt, systemContext = "", abortController = null) {
          var _a, _b;
          if (this.useServerProxy) {
            return this.callProviderProxy("huggingface", { prompt, systemContext }, abortController);
          }
          const { key, endpoint, model } = this.apis.huggingface;
          try {
            const fullPrompt = systemContext ? `<|system|>
${systemContext}
<|user|>
${prompt}
<|assistant|>
` : `<|user|>
${prompt}
<|assistant|>
`;
            const headers = {
              "Content-Type": "application/json"
            };
            if (key) {
              headers["Authorization"] = `Bearer ${key}`;
            }
            const fetchOptions = {
              method: "POST",
              headers,
              body: JSON.stringify({
                inputs: fullPrompt,
                parameters: {
                  max_new_tokens: 2048,
                  temperature: 0.7,
                  return_full_text: false,
                  top_p: 0.9
                }
              })
            };
            if (abortController) {
              fetchOptions.signal = abortController.signal;
            }
            const response = await fetch(endpoint, fetchOptions);
            if (response.status === 503) {
              const waitTime = response.headers.get("Retry-After") || 10;
              throw new Error(`Model is loading. Please wait ${waitTime} seconds and try again.`);
            }
            const data = await response.json();
            if (!response.ok) {
              if (Array.isArray(data) && ((_a = data[0]) == null ? void 0 : _a.error)) {
                throw new Error(data[0].error);
              }
              throw new Error(data.error || `Hugging Face API error: ${response.status}`);
            }
            if (Array.isArray(data) && ((_b = data[0]) == null ? void 0 : _b.generated_text)) {
              return data[0].generated_text.trim();
            }
            if (data.generated_text) {
              return data.generated_text.trim();
            }
            throw new Error("Unexpected response format from Hugging Face");
          } catch (error) {
            console.error("Hugging Face API Error:", error);
            throw error;
          }
        }
        /**
         * Get list of available providers (with keys configured)
         */
        getAvailableProviders() {
          return Object.entries(this.apis).filter(([name, config]) => {
            if (config.requiresKey) {
              return !!config.key;
            }
            return true;
          }).map(([name, config]) => ({
            name,
            free: config.free || false,
            requiresKey: config.requiresKey || false,
            hasKey: !!config.key
          }));
        }
        /**
         * Generate cache key from prompt and context
         */
        _generateCacheKey(prompt, systemContext, task) {
          const crypto = window.crypto || window.msCrypto;
          if (crypto && crypto.subtle) {
            return `${task}:${prompt.substring(0, 100)}:${systemContext.substring(0, 50)}`;
          }
          return `${task}:${prompt.substring(0, 200)}:${systemContext.substring(0, 100)}`;
        }
        /**
         * Get cached response if available
         */
        _getCachedResponse(cacheKey) {
          const cached = this.responseCache.get(cacheKey);
          if (cached && Date.now() < cached.expires) {
            return cached.data;
          }
          if (cached) {
            this.responseCache.delete(cacheKey);
          }
          return null;
        }
        /**
         * Cache response
         */
        _cacheResponse(cacheKey, data) {
          const expires = Date.now() + this.cacheTTL;
          this.responseCache.set(cacheKey, { data, expires });
          if (this.responseCache.size > 100) {
            const firstKey = this.responseCache.keys().next().value;
            this.responseCache.delete(firstKey);
          }
        }
        /**
         * Clear response cache
         */
        clearCache() {
          this.responseCache.clear();
        }
        /**
         * Process request queue
         */
        async _processQueue() {
          if (this.isProcessingQueue || this.requestQueue.length === 0) {
            return;
          }
          if (this.activeRequests >= this.maxConcurrentRequests) {
            return;
          }
          this.isProcessingQueue = true;
          while (this.requestQueue.length > 0 && this.activeRequests < this.maxConcurrentRequests) {
            const request = this.requestQueue.shift();
            this.activeRequests++;
            this._executeRequest(request).finally(() => {
              this.activeRequests--;
              this._processQueue();
            });
          }
          this.isProcessingQueue = false;
        }
        /**
         * Retry with exponential backoff
         */
        async _retryWithBackoff(fn, maxRetries = 3, initialDelay = 1e3) {
          let lastError;
          for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
              return await fn();
            } catch (error) {
              lastError = error;
              if (error.name === "AbortError" || error.message === "Request cancelled" || error.status >= 400 && error.status < 500) {
                throw error;
              }
              if (attempt === maxRetries - 1) {
                break;
              }
              const delay = initialDelay * Math.pow(2, attempt);
              console.log(`[AI Service] Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
              await new Promise((resolve) => setTimeout(resolve, delay));
            }
          }
          throw lastError;
        }
        /**
         * Execute a queued request
         */
        async _executeRequest({ resolve, reject, prompt, task, systemContext, cacheKey, abortController }) {
          try {
            const cached = this._getCachedResponse(cacheKey);
            if (cached !== null) {
              resolve(cached);
              return;
            }
            if (abortController == null ? void 0 : abortController.signal.aborted) {
              reject(new Error("Request cancelled"));
              return;
            }
            const result = await this._retryWithBackoff(
              () => this._callAIInternal(prompt, task, systemContext, abortController),
              3,
              // max retries
              1e3
              // initial delay 1 second
            );
            this._cacheResponse(cacheKey, result);
            resolve(result);
          } catch (error) {
            if (error.name === "AbortError" || error.message === "Request cancelled") {
              reject(new Error("Request cancelled"));
            } else {
              reject(error);
            }
          } finally {
            if (abortController) {
              this.activeRequestControllers.delete(abortController);
            }
          }
        }
        /**
         * Get list of providers that have keys configured
         */
        _getConfiguredProviders() {
          const configured = [];
          for (const [name, config] of Object.entries(this.apis)) {
            if (this.useServerProxy || !config.requiresKey || config.key) {
              configured.push(name);
            }
          }
          return configured;
        }
        /**
         * Internal AI call (without queue/cache)
         * Uses the intelligence router to automatically pick the best model for the request.
         */
        async _callAIInternal(prompt, task, systemContext, abortController) {
          const configuredProviders = this._getConfiguredProviders();
          const { primary, fallbacks, complexity } = this.router.route(
            prompt,
            systemContext,
            task,
            configuredProviders,
            this.preferredProvider
          );
          const modelChain = [];
          if (offlineAIService_default.isAvailable()) {
            modelChain.push({ provider: "offline", model: null, id: "offline" });
          }
          if (primary) {
            modelChain.push(primary);
          }
          modelChain.push(...fallbacks);
          if (!primary) {
            const legacyFallback = ["groq", "gemini", "openai", "anthropic", "huggingface"];
            for (const provider of legacyFallback) {
              const config = this.apis[provider];
              if (config && (this.useServerProxy || !config.requiresKey || config.key)) {
                modelChain.push({ provider, model: null, id: provider });
              }
            }
          }
          let lastError = null;
          for (const modelDef of modelChain) {
            if (abortController == null ? void 0 : abortController.signal.aborted) {
              throw new Error("Request cancelled");
            }
            try {
              const config = this.apis[modelDef.provider];
              if (!config && modelDef.provider !== "offline") continue;
              if (modelDef.provider !== "offline" && !this.useServerProxy && config.requiresKey && !config.key) {
                continue;
              }
              console.log(`[AI Service] Trying: ${modelDef.id} (${modelDef.provider}/${modelDef.model || "default"}) | Complexity: ${complexity.tier} (${complexity.score.toFixed(2)})`);
              const result = await this.callByProvider(
                modelDef.provider,
                prompt,
                systemContext,
                abortController,
                modelDef.model
                // pass the specific model from the registry
              );
              console.log(`[AI Service] Success: ${modelDef.id}`);
              const estimatedTokens = Math.ceil((prompt.length + ((systemContext == null ? void 0 : systemContext.length) || 0) + ((result == null ? void 0 : result.length) || 0)) / 4);
              const tracking = this.router.trackCompletion(modelDef.id, modelDef.provider, estimatedTokens);
              if (tracking.warning) {
                console.warn(`[AI Service] Usage warning: ${tracking.warning.message}`);
              }
              return result;
            } catch (error) {
              if (error.name === "AbortError" || error.message === "Request cancelled") {
                throw error;
              }
              console.warn(`[AI Service] ${modelDef.id} failed:`, error.message);
              lastError = error;
              continue;
            }
          }
          throw lastError || new Error("All AI providers failed. Please check your API keys in Settings.");
        }
        /**
         * Smart AI router - chooses best AI for the task with fallback
         * Now includes request queuing and caching
         */
        async callAI(prompt, task = "general", systemContext = "", options = {}) {
          const {
            useCache = true,
            abortController = null,
            skipQueue = false
          } = options;
          const cacheKey = useCache ? this._generateCacheKey(prompt, systemContext, task) : null;
          if (useCache && cacheKey) {
            const cached = this._getCachedResponse(cacheKey);
            if (cached !== null) {
              console.log("[AI Service] Returning cached response");
              return cached;
            }
          }
          const controller = abortController || new AbortController();
          if (!abortController) {
            this.activeRequestControllers.set(controller, { prompt, task });
          }
          if (skipQueue) {
            try {
              const result = await this._callAIInternal(prompt, task, systemContext, controller);
              if (useCache && cacheKey) {
                this._cacheResponse(cacheKey, result);
              }
              return result;
            } catch (error) {
              if (controller && !abortController) {
                this.activeRequestControllers.delete(controller);
              }
              throw error;
            }
          }
          return new Promise((resolve, reject) => {
            this.requestQueue.push({
              resolve,
              reject,
              prompt,
              task,
              systemContext,
              cacheKey,
              abortController: controller
            });
            this._processQueue();
          });
        }
        /**
         * Cancel a specific request
         */
        cancelRequest(abortController) {
          if (abortController) {
            abortController.abort();
            this.activeRequestControllers.delete(abortController);
          }
        }
        /**
         * Cancel all active requests
         */
        cancelAllRequests() {
          for (const controller of this.activeRequestControllers.keys()) {
            controller.abort();
          }
          this.activeRequestControllers.clear();
          this.requestQueue = [];
        }
        /**
         * Call specific provider with optional model override from intelligence router
         */
        async callByProvider(provider, prompt, systemContext = "", abortController = null, model = null) {
          switch (provider) {
            case "offline":
              if (!offlineAIService_default.isAvailable()) {
                throw new Error("Offline AI is not available on this device");
              }
              return offlineAIService_default.generate(prompt, systemContext, {
                maxLength: 512,
                temperature: 0.7
              });
            case "gemini":
              return this.callGemini(prompt, systemContext, abortController, model);
            case "openai":
              return this.callChatGPT(prompt, systemContext, model || "gpt-4o", abortController);
            case "anthropic":
              return this.callClaude(prompt, systemContext, model || "claude-sonnet-4-20250514", abortController);
            case "groq":
              return this.callGroq(prompt, systemContext, model || "llama-3.1-70b-versatile", abortController);
            case "huggingface":
              return this.callHuggingFace(prompt, systemContext, abortController);
            default:
              throw new Error(`Unknown provider: ${provider}`);
          }
        }
        /**
         * Get the intelligence router instance (for UI access)
         */
        getRouter() {
          return this.router;
        }
        /**
         * Get usage summary from the intelligence router
         */
        getUsageSummary() {
          return this.router.getUsageSummary();
        }
        /**
         * Manuscript parsing - extracts actor updates from text
         */
        async parseManuscript(text, actors, context = {}) {
          const systemContext = `You are an expert at analyzing RPG game text and extracting character progression.
Extract any stat changes, skill acquisitions, level ups, or item gains mentioned in the text.
Return a JSON object with the format:
{
  "updates": [
    {
      "actorId": "actor_id",
      "actorName": "Actor Name",
      "changes": {
        "stats": {"STR": +5, "INT": +2},
        "skills": ["skill_name"],
        "items": ["item_name"],
        "level": 5
      },
      "confidence": 0.9,
      "textEvidence": "quote from text"
    }
  ]
}

Available actors: ${actors.map((a) => `${a.id}: ${a.name}`).join(", ")}`;
          const prompt = `Analyze this manuscript text and extract character progression:

${text}`;
          try {
            const response = await this.callAI(prompt, "analytical", systemContext);
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              return JSON.parse(jsonMatch[0]);
            }
            return { updates: [], raw: response };
          } catch (error) {
            console.error("Manuscript parsing error:", error);
            return { updates: [], error: error.message };
          }
        }
        /**
         * Generate wiki entry (wrapper for generateWiki)
         */
        async generateWikiEntry(entityType, entityData) {
          return await this.generateWiki(entityData, entityType, {});
        }
        /**
         * Auto-generate wiki entry for an item/actor
         */
        async generateWiki(entity, type = "item", context = {}) {
          const systemContext = `You are writing wiki entries for a dark comedy horror-RPG book series called "The Compliance Run".
The series is about bureaucratic fantasy apocalypse where a fallen knight and goblin squire navigate a welfare system with RPG mechanics.
Tone: 60% dark comedy, 40% horror. Think Terry Pratchett meets Dark Souls meets UK welfare system.`;
          const prompt = `Create a comprehensive wiki entry for this ${type}:

Name: ${entity.name}
Type: ${entity.type || type}
Description: ${entity.desc || entity.description || ""}
${type === "item" ? `Stats: ${JSON.stringify(entity.stats || {})}` : ""}
${type === "actor" ? `Class: ${entity.class}, Role: ${entity.role}` : ""}

Context: ${JSON.stringify(context, null, 2)}

Format the wiki entry in markdown with sections for:
- Overview
- ${type === "item" ? "Mechanics" : "Background"}
- ${type === "item" ? "Lore" : "Personality & Traits"}
- ${type === "item" ? "Acquisition" : "Story Arc"}
- Trivia`;
          return this.callAI(prompt, "creative", systemContext);
        }
        /**
         * Generate relationship summary between two actors
         */
        async generateRelationshipSummary(actor1, actor2, chapter, events = []) {
          const systemContext = `Summarize the relationship between two characters in "The Compliance Run" series.
Focus on their interactions, conflicts, alliances, and how their relationship evolves.`;
          const prompt = `Summarize the relationship between ${actor1.name} and ${actor2.name} in Chapter ${chapter}:

${actor1.name} (${actor1.class}): ${actor1.role}
${actor2.name} (${actor2.class}): ${actor2.role}

Events in this chapter:
${events.map((e, i) => `${i + 1}. ${e}`).join("\n")}

Provide a 2-3 sentence summary of their relationship dynamics in this chapter.`;
          return this.callAI(prompt, "analytical", systemContext);
        }
        /**
         * Consistency checking across chapters
         */
        async checkConsistency(data, scope = "chapter") {
          const systemContext = `You are a continuity editor for "The Compliance Run" book series.
Check for inconsistencies in character stats, story events, item possession, and narrative logic.`;
          const prompt = `Analyze this data for consistency issues:

${JSON.stringify(data, null, 2)}

Return a JSON array of issues found:
[
  {
    "type": "stat_mismatch" | "item_conflict" | "story_contradiction" | "character_error",
    "severity": "critical" | "warning" | "minor",
    "description": "Clear description of the issue",
    "location": "Book X, Chapter Y",
    "suggestion": "How to fix it"
  }
]`;
          try {
            const response = await this.callAI(prompt, "analytical", systemContext);
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              return JSON.parse(jsonMatch[0]);
            }
            return [];
          } catch (error) {
            console.error("Consistency check error:", error);
            return [];
          }
        }
        /**
         * Generate Diablo-style item with procedural generation
         */
        async generateDiabloItem(baseType, quality, affixes, context = {}) {
          const systemContext = `You are a Diablo II-style item generator for "The Compliance Run" series.
Generate items that blend bureaucratic horror with RPG mechanics.
Examples: "Council-Tax-Evader" (greatsword), "Bag For Life" (artifact), "Hi-Vis Tabard" (armor)`;
          const prompt = `Generate a ${quality} quality ${baseType} with the following parameters:

Base Type: ${baseType}
Quality: ${quality}
Number of Affixes: ${affixes}
Theme: Bureaucratic Fantasy Apocalypse

Additional Context:
${JSON.stringify(context, null, 2)}

Return JSON format:
{
  "name": "Item Name (creative, fitting the theme)",
  "type": "${baseType}",
  "desc": "Flavor text description",
  "stats": {"STR": 10, "VIT": 5, etc},
  "grantsSkills": ["skill_id"],
  "quests": "Optional upgrade quest description",
  "debuffs": "Optional curse or debuff",
  "rarity": "Common|Uncommon|Rare|Epic|Legendary",
  "lore": "Background story of the item"
}`;
          try {
            const response = await this.callAI(prompt, "structured", systemContext);
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              return JSON.parse(jsonMatch[0]);
            }
            return null;
          } catch (error) {
            console.error("Item generation error:", error);
            return null;
          }
        }
        /**
         * Process book document - extract book structure with chapters
         */
        async processBookDocument(docText, existingBooks = []) {
          const systemContext = `You are analyzing a book document for "The Compliance Run" series.
Extract the book structure including title, focus, and all chapters with their titles and descriptions.
Return JSON:
{
  "book": {
    "title": "Book Title",
    "focus": "Main theme/focus",
    "chapters": [
      {"title": "Chapter Title", "desc": "Chapter description", "synopsis": "..."}
    ]
  },
  "confidence": 0.9
}`;
          const existingTitles = existingBooks.map((b) => b.title).join(", ");
          const prompt = `Analyze this book document and extract the book structure:

${docText}

Existing books: ${existingTitles || "None"}`;
          try {
            const response = await this.callAI(prompt, "analytical", systemContext);
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              return JSON.parse(jsonMatch[0]);
            }
            return { book: null, confidence: 0, raw: response };
          } catch (error) {
            console.error("Book processing error:", error);
            return { book: null, confidence: 0, error: error.message };
          }
        }
        /**
         * Process item batch - extract multiple items from document
         */
        async processItemBatch(docText, existingItems = []) {
          const systemContext = `You are extracting items from a document for "The Compliance Run" series - a dark comedy horror-RPG book series about bureaucratic fantasy apocalypse.

IMPORTANT: Extract EVERY item mentioned in the document, even if details are minimal. Return a JSON object with an "items" array.

For each item, extract:
- name: The item's name (required)
- type: One of: Weapon, Armor, Artifact, Tool, Consumable
- desc: Description of the item
- rarity: One of: common, uncommon, rare, epic, legendary, cursed
- stats: Object with stat modifiers (e.g., {"STR": 10, "VIT": 5})
- grantsSkills: Array of skill names or IDs this item grants
- quests: Any quest text associated with the item
- debuffs: Any negative effects

Example response format:
{
  "items": [
    {
      "name": "Rolling Pin of Judgment",
      "type": "Weapon",
      "desc": "A heavy rolling pin used by bureaucratic enforcers",
      "rarity": "rare",
      "stats": {"STR": 15, "INT": 5},
      "grantsSkills": [],
      "quests": "",
      "debuffs": ""
    }
  ],
  "confidence": 0.9
}

Return ONLY valid JSON. Do not include markdown code blocks or explanatory text.`;
          const existingNames = existingItems.map((i) => i.name).join(", ");
          const prompt = `Extract ALL items from this document. Be thorough - extract every item mentioned, even if some details are missing.

Document text:
${docText.substring(0, 1e4)}${docText.length > 1e4 ? "\n[... document continues ...]" : ""}

Existing items (avoid duplicates): ${existingNames || "None"}

Return JSON with items array:`;
          try {
            const response = await this.callAI(prompt, "structured", systemContext);
            let jsonData = null;
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              try {
                jsonData = JSON.parse(jsonMatch[0]);
              } catch (e) {
                console.warn("JSON parse error, trying alternative methods:", e);
              }
            }
            if (!jsonData || !jsonData.items) {
              const itemsMatch = response.match(/\[[\s\S]*\]/);
              if (itemsMatch) {
                try {
                  const itemsArray = JSON.parse(itemsMatch[0]);
                  jsonData = { items: itemsArray, confidence: 0.8 };
                } catch (e) {
                  console.warn("Alternative JSON parse failed:", e);
                }
              }
            }
            if (jsonData && jsonData.items && Array.isArray(jsonData.items)) {
              const validItems = jsonData.items.filter((item) => item && item.name);
              return {
                items: validItems,
                confidence: jsonData.confidence || 0.8,
                raw: response
              };
            }
            return { items: [], confidence: 0, raw: response, error: "No valid items extracted" };
          } catch (error) {
            console.error("Item batch processing error:", error);
            return { items: [], confidence: 0, error: error.message, raw: null };
          }
        }
        /**
         * Process skill batch - extract multiple skills from document
         */
        async processSkillBatch(docText, existingSkills = []) {
          const systemContext = `You are extracting skills from a document for "The Compliance Run" series - a dark comedy horror-RPG book series about bureaucratic fantasy apocalypse.

IMPORTANT: Extract EVERY skill mentioned in the document, even if details are minimal. Return a JSON object with a "skills" array.

For each skill, extract:
- name: The skill's name (required)
- type: One of: Combat, Passive, Aura, Social, Magic, Utility, Crowd Control
- desc: Description of what the skill does
- statMod: Object with stat modifiers (e.g., {"STR": 5, "INT": 3})
- tier: Skill tier (1-5, where 1 is Novice, 5 is Legendary)
- defaultVal: Default skill level (usually 1)
- requiredLevel: Minimum character level to learn
- maxLevel: Maximum skill level

Example response format:
{
  "skills": [
    {
      "name": "Queue Tolerance",
      "type": "Passive",
      "desc": "Reduces panic in crowded bureaucratic areas",
      "statMod": {"INT": 5, "VIT": 3},
      "tier": 1,
      "defaultVal": 1,
      "requiredLevel": 5,
      "maxLevel": 20
    }
  ],
  "confidence": 0.9
}

Return ONLY valid JSON. Do not include markdown code blocks or explanatory text.`;
          const existingNames = existingSkills.map((s) => s.name).join(", ");
          const prompt = `Extract ALL skills from this document. Be thorough - extract every skill mentioned, even if some details are missing.

Document text:
${docText.substring(0, 1e4)}${docText.length > 1e4 ? "\n[... document continues ...]" : ""}

Existing skills (avoid duplicates): ${existingNames || "None"}

Return JSON with skills array:`;
          try {
            const response = await this.callAI(prompt, "structured", systemContext);
            let jsonData = null;
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              try {
                jsonData = JSON.parse(jsonMatch[0]);
              } catch (e) {
                console.warn("JSON parse error, trying alternative methods:", e);
              }
            }
            if (!jsonData || !jsonData.skills) {
              const skillsMatch = response.match(/\[[\s\S]*\]/);
              if (skillsMatch) {
                try {
                  const skillsArray = JSON.parse(skillsMatch[0]);
                  jsonData = { skills: skillsArray, confidence: 0.8 };
                } catch (e) {
                  console.warn("Alternative JSON parse failed:", e);
                }
              }
            }
            if (jsonData && jsonData.skills && Array.isArray(jsonData.skills)) {
              const validSkills = jsonData.skills.filter((skill) => skill && skill.name);
              return {
                skills: validSkills,
                confidence: jsonData.confidence || 0.8,
                raw: response
              };
            }
            return { skills: [], confidence: 0, raw: response, error: "No valid skills extracted" };
          } catch (error) {
            console.error("Skill batch processing error:", error);
            return { skills: [], confidence: 0, error: error.message, raw: null };
          }
        }
        /**
         * Process relationship batch - extract relationships from document
         */
        async processRelationshipBatch(docText, actors = []) {
          const systemContext = `You are extracting character relationships from a document.
Extract ALL relationships mentioned. Return JSON array:
{
  "relationships": [
    {
      "actor1Id": "actor_id",
      "actor2Id": "actor_id",
      "type": "ally|enemy|neutral|romantic|family",
      "strength": 0.8,
      "description": "Relationship description",
      "events": ["Event 1", "Event 2"]
    }
  ],
  "confidence": 0.9
}`;
          const actorList = actors.map((a) => `${a.id}: ${a.name}`).join(", ");
          const prompt = `Extract all relationships from this document:

${docText}

Available actors: ${actorList || "None"}`;
          try {
            const response = await this.callAI(prompt, "analytical", systemContext);
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              return JSON.parse(jsonMatch[0]);
            }
            return { relationships: [], confidence: 0, raw: response };
          } catch (error) {
            console.error("Relationship batch processing error:", error);
            return { relationships: [], confidence: 0, error: error.message };
          }
        }
        /**
         * Process story map connections - extract chapter connections
         */
        async processStoryMapConnections(docText, chapters = []) {
          const systemContext = `You are analyzing story connections between chapters.
Extract connections and relationships between chapters. Return JSON:
{
  "connections": [
    {
      "fromChapterId": "book_chapter",
      "toChapterId": "book_chapter",
      "type": "plot|character|theme|trope",
      "description": "Connection description"
    }
  ],
  "confidence": 0.9
}`;
          const chapterList = chapters.map((c) => `${c.bookId}_${c.id}: ${c.title}`).join(", ");
          const prompt = `Analyze story connections in this document:

${docText}

Available chapters: ${chapterList || "None"}`;
          try {
            const response = await this.callAI(prompt, "analytical", systemContext);
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              return JSON.parse(jsonMatch[0]);
            }
            return { connections: [], confidence: 0, raw: response };
          } catch (error) {
            console.error("Story map processing error:", error);
            return { connections: [], confidence: 0, error: error.message };
          }
        }
        /**
         * Detect story connections between chapters
         */
        async detectStoryConnections(chapters) {
          const systemContext = `You are analyzing story connections between chapters.
Detect connections based on plot threads, character arcs, themes, and tropes.
Return JSON array:
[
  {
    "chapters": ["chapter_id_1", "chapter_id_2"],
    "type": "plot|character|theme|trope",
    "description": "Connection description",
    "confidence": 0.9
  }
]`;
          const chapterText = chapters.map((c) => `${c.id}: ${c.title} - ${c.desc || ""}`).join("\n");
          const prompt = `Analyze these chapters and detect connections:

${chapterText}`;
          try {
            const response = await this.callAI(prompt, "analytical", systemContext);
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              return JSON.parse(jsonMatch[0]);
            }
            return [];
          } catch (error) {
            console.error("Connection detection error:", error);
            return [];
          }
        }
        /**
         * Enhanced document scanning for batch processing
         */
        async scanDocumentForSuggestions(docText, worldState) {
          var _a, _b, _c;
          const chunkSize = 8e3;
          const chunks = [];
          for (let i = 0; i < docText.length; i += chunkSize) {
            chunks.push(docText.substring(i, i + chunkSize));
          }
          const systemContext = `You are an AI assistant for "The Compliance Run" book series tracker app. Extract ALL entities mentioned in the document text.

IMPORTANT: Extract EVERY entity you find - actors, items, skills, chapters, and actor updates. Be thorough and extract even partial information.

PAY SPECIAL ATTENTION TO:
- Items with stat mentions: Look for patterns like "got an item", "found a", "acquired", "received" followed by stat descriptions like "+2 STR", "+2 VIT", "grants +5 INT", etc.
- Actor state changes: Look for level ups, stat gains, item acquisitions, skill unlocks (e.g., "Grimguff gained +2 STR", "leveled up", "learned a new skill")
- Chapters: Look for chapter titles, chapter numbers, chapter breaks, or narrative sections that could be chapters

Return a JSON object with this EXACT structure:
{
  "suggestions": {
    "newActors": [
      {
        "name": "Actor Name",
        "description": "Description",
        "class": "Class name",
        "stats": {"STR": 10, "VIT": 10, "INT": 10, "DEX": 10}
      }
    ],
    "newItems": [
      {
        "name": "Item Name",
        "description": "Description",
        "type": "Weapon|Armor|Artifact|Tool|Consumable",
        "rarity": "common|uncommon|rare|epic|legendary",
        "stats": {"STR": 2, "VIT": 2},
        "extractedFrom": "Context where item was mentioned"
      }
    ],
    "newSkills": [
      {
        "name": "Skill Name",
        "description": "Description",
        "type": "Combat|Passive|Aura|Social|Magic|Utility",
        "tier": 1,
        "statMod": {"STR": 5}
      }
    ],
    "updatedActors": [
      {
        "actorName": "Actor Name",
        "changes": {
          "stats": {"STR": 2, "VIT": 2},
          "items": ["item_name"],
          "skills": ["skill_name"],
          "level": 5
        },
        "context": "What happened that caused these changes"
      }
    ],
    "newChapters": [
      {
        "title": "Chapter Title",
        "synopsis": "Chapter description/summary",
        "content": "Full chapter text if available"
      }
    ]
  },
  "confidence": 0.8
}

For items, extract ALL stat mentions. If text says "got a sword that gives +2 STR and +2 VIT", create an item with stats: {"STR": 2, "VIT": 2}.

For actor updates, extract ANY stat changes, level ups, or item/skill acquisitions mentioned in the text.

Return ONLY valid JSON. No markdown, no explanations, just the JSON object.`;
          const existingActors = ((_a = worldState.actors) == null ? void 0 : _a.map((a) => a.name).join(", ")) || "None";
          const existingItems = ((_b = worldState.itemBank) == null ? void 0 : _b.map((i) => i.name).join(", ")) || "None";
          const existingSkills = ((_c = worldState.skillBank) == null ? void 0 : _c.map((s) => s.name).join(", ")) || "None";
          try {
            const allSuggestions = {
              newActors: [],
              newItems: [],
              newSkills: [],
              updatedActors: [],
              newChapters: []
            };
            let totalConfidence = 0;
            for (let i = 0; i < chunks.length; i++) {
              const chunk = chunks[i];
              const prompt = `Analyze this document chunk (${i + 1}/${chunks.length}) and extract ALL entities:

Document chunk:
${chunk}

Existing entities (avoid duplicates):
- Actors: ${existingActors}
- Items: ${existingItems}
- Skills: ${existingSkills}

Extract everything you find. Return JSON with suggestions object:`;
              try {
                const response = await this.callAI(prompt, "analytical", systemContext);
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  const parsed = JSON.parse(jsonMatch[0]);
                  if (parsed.suggestions) {
                    if (parsed.suggestions.newActors) allSuggestions.newActors.push(...parsed.suggestions.newActors);
                    if (parsed.suggestions.newItems) allSuggestions.newItems.push(...parsed.suggestions.newItems);
                    if (parsed.suggestions.newSkills) allSuggestions.newSkills.push(...parsed.suggestions.newSkills);
                    if (parsed.suggestions.updatedActors) allSuggestions.updatedActors.push(...parsed.suggestions.updatedActors);
                    if (parsed.suggestions.newChapters) allSuggestions.newChapters.push(...parsed.suggestions.newChapters);
                    totalConfidence += parsed.confidence || 0.8;
                  }
                }
              } catch (chunkError) {
                console.warn(`Error processing chunk ${i + 1}:`, chunkError);
              }
            }
            const uniqueActors = Array.from(new Map(allSuggestions.newActors.map((a) => [a.name, a])).values());
            const uniqueItems = Array.from(new Map(allSuggestions.newItems.map((i) => [i.name, i])).values());
            const uniqueSkills = Array.from(new Map(allSuggestions.newSkills.map((s) => [s.name, s])).values());
            return {
              suggestions: {
                newActors: uniqueActors,
                newItems: uniqueItems,
                newSkills: uniqueSkills,
                updatedActors: allSuggestions.updatedActors,
                newChapters: allSuggestions.newChapters
              },
              confidence: chunks.length > 0 ? totalConfidence / chunks.length : 0.8
            };
          } catch (error) {
            console.error("Document scanning error:", error);
            return { suggestions: {}, error: error.message };
          }
        }
        /**
         * Process manuscript with buzz word detection and intelligent extraction
         */
        async processManuscriptIntelligence(docText, worldState, buzzWords = [], onProgress = null) {
          var _a, _b, _c;
          const defaultBuzzWords = [
            { tag: "[item]", type: "item" },
            { tag: "[book]", type: "book" },
            { tag: "[chapter]", type: "chapter" },
            { tag: "[skill]", type: "skill" },
            { tag: "[stats]", type: "stats" },
            { tag: "[actor]", type: "actor" },
            { tag: "[wiki]", type: "wiki" },
            { tag: "[plot]", type: "plot" },
            { tag: "[relationship]", type: "relationship" },
            { tag: "[location]", type: "location" },
            { tag: "[event]", type: "event" }
          ];
          const allBuzzWords = [...defaultBuzzWords, ...buzzWords];
          const buzzWordTags = allBuzzWords.map((bw) => bw.tag.toLowerCase());
          const buzzWordMatches = [];
          const lines = docText.split("\n");
          lines.forEach((line, lineIndex) => {
            const lowerLine = line.toLowerCase();
            buzzWordTags.forEach((tag) => {
              const index = lowerLine.indexOf(tag);
              if (index !== -1) {
                const buzzWord = allBuzzWords.find((bw) => bw.tag.toLowerCase() === tag);
                buzzWordMatches.push({
                  tag: buzzWord.tag,
                  type: buzzWord.type,
                  line: lineIndex,
                  position: index,
                  context: line.substring(index + tag.length).trim()
                });
              }
            });
          });
          const chunkSize = 8e3;
          const chunks = [];
          for (let i = 0; i < docText.length; i += chunkSize) {
            chunks.push({
              text: docText.substring(i, i + chunkSize),
              startIndex: i,
              buzzWords: buzzWordMatches.filter(
                (bw) => bw.line * 100 >= i && bw.line * 100 < i + chunkSize
              )
            });
          }
          let buzzwordsContext = "";
          try {
            const styleGuideService2 = (await Promise.resolve().then(() => (init_styleGuideService(), styleGuideService_exports))).default;
            const buzzwordsRef = await styleGuideService2.getBuzzwordsReference();
            if (buzzwordsRef) {
              buzzwordsContext = `

BUZZWORDS REFERENCE:
${buzzwordsRef}

`;
            }
          } catch (error) {
            console.warn("Could not load buzzwords reference:", error);
          }
          const systemContext = `You are an AI assistant for "The Compliance Run" book series tracker app. You are processing a manuscript with intelligent extraction capabilities.

BUZZ WORD SYSTEM:
The document may contain buzz words like [item], [book], [chapter], [skill], [actor], etc. These indicate specific content types.
However, you should ALSO proactively detect content even WITHOUT buzz words - be intelligent and anticipate what the user needs!${buzzwordsContext}

CRITICAL EXTRACTION PATTERNS - DETECT THESE AUTOMATICALLY:

1. STAT CHANGES (type: "stat_change"):
   - Look for patterns like: "+10 STR", "gained 15 strength", "STR increased by 5", "lost 3 DEX"
   - Common stats: STR (Strength), VIT (Vitality), INT (Intelligence), DEX (Dexterity), LUCK, DEBT, CAPACITY, DEF, AUTHORITY, GLOOM
   - Extract: actorName, stats (object with stat names and numeric changes)
   - Example: "Grimguff's STR increased by 10" -> { actorName: "Grimguff", stats: { STR: 10 } }

2. INVENTORY CHANGES (type: "inventory"):
   - Look for: "picked up", "found", "received", "dropped", "lost", "equipped", "unequipped"
   - Extract: actorName, itemName, action (pickup/drop/equip)
   - Example: "Pipkins picked up the Grim Helm" -> { actorName: "Pipkins", itemName: "Grim Helm", action: "pickup" }

3. ITEMS (type: "item"):
   - Look for named objects, weapons, armor, artifacts
   - Extract: name, description, type (Weapon/Armor/Accessory/Consumable/Artifact), rarity, stats
   - Stats format: { STR: 10, VIT: 5 } for "+10 STR, +5 VIT"

4. ACTORS/CHARACTERS (type: "actor"):
   - New characters, NPCs, enemies introduced
   - Extract: name, role (Protagonist/Antagonist/NPC/Enemy), class, description, stats
   - Infer stats from context if not explicit (warrior = high STR, mage = high INT)

5. SKILLS (type: "skill"):
   - Abilities learned, used, or mentioned
   - Extract: name, description, type (Combat/Magic/Passive/Utility), tier, statMod, characterName (who has it)

6. LOCATIONS (type: "location"):
   - Places visited, mentioned, traveled to
   - Look for: "arrived at", "traveled to", "entered", "left"
   - Extract: name, description, actorName (who went there)

7. RELATIONSHIPS (type: "relationship"):
   - Connections between characters
   - Look for: "befriended", "betrayed", "allied with", "enemy of", "loves", "hates"
   - Extract: actor1Name, actor2Name, type (ally/enemy/neutral/romantic), description

8. EVENTS/MILESTONES (type: "event"):
   - Significant plot points, achievements, battles
   - Extract: name/title, description, participants (array of actor names)

9. BOOK STRUCTURE (type: "book"):
   - Book titles, focus themes, descriptions
   - Extract: title, focus, desc, bookNumber, metadata

10. CHAPTERS (type: "chapter"):
   - Chapter titles, descriptions, content
   - Extract: title, desc, number, content/script, keyPlotPoints, characters

11. PLOT BEATS (type: "plot_beat"):
   - Significant story events, conflicts, resolutions, character moments
   - Extract: beat (description), purpose, characters, emotionalTone, importance (1-10)

12. STORYLINES (type: "storyline"):
   - Plot threads that span multiple chapters
   - Extract: title, description, status (active/resolved/ongoing), importance, relatedChapters, characters

13. CHARACTER ARC MOMENTS (type: "character_arc_moment"):
   - Character development, growth, or change moments
   - Extract: characterName, moment, type (growth/revelation/conflict/resolution), importance, emotionalState, impact

14. TIMELINE EVENTS (type: "timeline_event"):
   - Chronological events for Master Timeline
   - Extract: title, description, type, actors, locations, timestamp

15. DECISIONS (type: "decision_point"):
   - Important decisions that matter for future callbacks
   - Extract: decision, character, consequences, importance, type (plot/character/relationship/world)

16. CALLBACKS (type: "callback_setup"):
   - Events that should be referenced later
   - Extract: event, description, type (memory/setup/reference/callback), importance, suggestedCallbackChapter

EXTRACTION REQUIREMENTS:
1. Extract ALL entities mentioned - be thorough!
2. For each entity, provide:
   - Type (item, skill, actor, stat_change, inventory, relationship, location, event)
   - Extracted data (all relevant fields)
   - Source context (the exact text where it was found)
   - Confidence score (0.0-1.0)
   - Suggested action options (3-4 multi-choice options: A/B/C/D)

ACTION OPTIONS BY TYPE:
- stat_change: A) Apply stat change to actor, B) Create snapshot, C) Skip
- inventory: A) Add item to actor inventory, B) Remove item from inventory, C) Skip
- item: A) Create item, B) Create and add to inventory, C) Merge with existing, D) Skip
- actor: A) Create new actor, B) Update existing actor, C) Skip
- skill: A) Create skill, B) Create and assign to actor, C) Merge with existing, D) Skip
- location: A) Create wiki entry, B) Update actor location, C) Skip
- relationship: A) Create relationship, B) Update existing, C) Skip
- event: A) Create milestone, B) Add to plot thread, C) Skip
- book: A) Create new book, B) Update existing book, C) Skip
- chapter: A) Create new chapter, B) Update existing chapter, C) Merge with existing, D) Skip
- plot_beat: A) Add to plot timeline, B) Assign to chapter, C) Skip
- storyline: A) Create storyline, B) Update existing storyline, C) Skip
- character_arc_moment: A) Add to character arc, B) Create arc milestone, C) Skip
- timeline_event: A) Add to master timeline, B) Link to chapter, C) Skip
- decision_point: A) Track decision, B) Add to decision log, C) Skip
- callback_setup: A) Register callback, B) Add to memory system, C) Skip

Return JSON with this structure:
{
  "suggestions": [
    {
      "id": "sugg_1",
      "type": "item|skill|actor|stat_change|inventory|relationship|location|event|book|chapter|plot_beat|storyline|character_arc_moment|timeline_event|decision_point|callback_setup",
      "data": { /* extracted entity data with all relevant fields */ },
      "sourceContext": "Exact text from document",
      "confidence": 0.85,
      "actionOptions": [
        {"id": "A", "label": "Action A description", "action": "action_type"},
        {"id": "B", "label": "Action B description", "action": "action_type"},
        {"id": "C", "label": "Skip this", "action": "skip"}
      ],
      "buzzWordUsed": "[item]" // or null if detected without buzzword
    }
  ],
  "processingStats": {
    "totalChunks": 1,
    "entitiesFound": 15,
    "buzzWordsDetected": 8
  }
}`;
          try {
            const allSuggestions = [];
            let processingStats = { totalChunks: chunks.length, entitiesFound: 0, buzzWordsDetected: buzzWordMatches.length };
            for (let i = 0; i < chunks.length; i++) {
              const chunk = chunks[i];
              const chunkProgress = 20 + i / chunks.length * 60;
              if (onProgress) {
                onProgress({
                  current: Math.round(chunkProgress),
                  status: `Processing chunk ${i + 1} of ${chunks.length}...`,
                  liveSuggestions: allSuggestions
                });
              }
              const prompt = `Process this document chunk (${i + 1}/${chunks.length}):

${chunk.text}

${chunk.buzzWords.length > 0 ? `
Buzz words detected in this chunk: ${chunk.buzzWords.map((bw) => bw.tag).join(", ")}` : ""}

Existing entities:
- Actors: ${((_a = worldState.actors) == null ? void 0 : _a.map((a) => a.name).join(", ")) || "None"}
- Items: ${((_b = worldState.itemBank) == null ? void 0 : _b.map((i2) => i2.name).join(", ")) || "None"}
- Skills: ${((_c = worldState.skillBank) == null ? void 0 : _c.map((s) => s.name).join(", ")) || "None"}
- Books: ${worldState.books ? Object.values(worldState.books).map((b) => b.title).join(", ") : "None"}

Extract ALL entities and generate action options. Return JSON:`;
              try {
                const response = await this.callAI(prompt, "analytical", systemContext);
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  const parsed = JSON.parse(jsonMatch[0]);
                  if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
                    parsed.suggestions.forEach((sugg) => {
                      sugg.id = sugg.id || `sugg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                      sugg.chunkIndex = i;
                    });
                    allSuggestions.push(...parsed.suggestions);
                    if (onProgress) {
                      onProgress({
                        current: Math.round(chunkProgress),
                        status: `Found ${allSuggestions.length} entities so far...`,
                        liveSuggestions: allSuggestions
                      });
                    }
                    if (parsed.processingStats) {
                      processingStats.entitiesFound += parsed.processingStats.entitiesFound || 0;
                    }
                  }
                }
              } catch (chunkError) {
                console.error(`Error processing chunk ${i + 1}:`, chunkError);
              }
            }
            if (onProgress) {
              onProgress({
                current: 85,
                status: "Post-processing and deduplicating...",
                liveSuggestions: allSuggestions
              });
            }
            const processedSuggestions = await this.postProcessSuggestions(allSuggestions, worldState);
            processingStats.entitiesFound = processedSuggestions.length;
            if (onProgress) {
              onProgress({
                current: 95,
                status: `Finalizing ${processedSuggestions.length} suggestions...`,
                liveSuggestions: processedSuggestions
              });
            }
            return {
              suggestions: processedSuggestions,
              processingStats,
              buzzWordsDetected: buzzWordMatches
            };
          } catch (error) {
            console.error("Manuscript Intelligence processing error:", error);
            return { suggestions: [], processingStats: {}, error: error.message };
          }
        }
        /**
         * Post-process suggestions: detect duplicates, cross-reference, enhance
         */
        async postProcessSuggestions(suggestions, worldState) {
          return suggestions.map((sugg) => {
            const duplicate = this.detectDuplicates(sugg, worldState);
            if (duplicate) {
              sugg.duplicateWarning = duplicate;
              sugg.actionOptions = [
                ...sugg.actionOptions,
                { id: "E", label: `Merge with existing ${duplicate.name}`, action: "merge" }
              ];
            }
            const crossRefs = this.crossReferenceEntities(sugg, worldState);
            if (crossRefs.length > 0) {
              sugg.crossReferences = crossRefs;
            }
            return sugg;
          });
        }
        /**
         * Detect if suggestion duplicates existing entity
         */
        detectDuplicates(suggestion, worldState) {
          var _a, _b, _c, _d, _e, _f, _g;
          const name = ((_a = suggestion.data) == null ? void 0 : _a.name) || ((_b = suggestion.data) == null ? void 0 : _b.title);
          if (!name) return null;
          const lowerName = name.toLowerCase();
          if (suggestion.type === "item") {
            const existing = (_c = worldState.itemBank) == null ? void 0 : _c.find((i) => i.name.toLowerCase() === lowerName);
            if (existing) return { type: "item", name: existing.name, id: existing.id };
          }
          if (suggestion.type === "skill") {
            const existing = (_d = worldState.skillBank) == null ? void 0 : _d.find((s) => s.name.toLowerCase() === lowerName);
            if (existing) return { type: "skill", name: existing.name, id: existing.id };
          }
          if (suggestion.type === "actor") {
            const existing = (_e = worldState.actors) == null ? void 0 : _e.find((a) => a.name.toLowerCase() === lowerName);
            if (existing) return { type: "actor", name: existing.name, id: existing.id };
          }
          if (suggestion.type === "chapter") {
            const chapterTitle = (_f = suggestion.data) == null ? void 0 : _f.title;
            if (chapterTitle) {
              for (const book of Object.values(worldState.books || {})) {
                const existing = (_g = book.chapters) == null ? void 0 : _g.find((c) => c.title.toLowerCase() === chapterTitle.toLowerCase());
                if (existing) {
                  return { type: "chapter", name: existing.title, id: existing.id, bookId: book.id };
                }
              }
            }
          }
          return null;
        }
        /**
         * Cross-reference entities to find relationships
         */
        crossReferenceEntities(suggestion, worldState) {
          var _a, _b, _c, _d, _e, _f;
          const crossRefs = [];
          const name = ((_a = suggestion.data) == null ? void 0 : _a.name) || ((_b = suggestion.data) == null ? void 0 : _b.title);
          if (!name) return crossRefs;
          const lowerName = name.toLowerCase();
          const context = ((_c = suggestion.sourceContext) == null ? void 0 : _c.toLowerCase()) || "";
          if (suggestion.type === "item" || suggestion.type === "skill") {
            for (const book of Object.values(worldState.books || {})) {
              for (const chapter of book.chapters || []) {
                const chapterText = (chapter.script || chapter.desc || "").toLowerCase();
                if (chapterText.includes(lowerName)) {
                  crossRefs.push({
                    type: "mentioned_in_chapter",
                    entity: { type: "chapter", name: chapter.title, bookId: book.id, chapterId: chapter.id }
                  });
                }
              }
            }
          }
          if (suggestion.type === "item" && ((_d = suggestion.data) == null ? void 0 : _d.grantsSkill)) {
            const skill = (_e = worldState.skillBank) == null ? void 0 : _e.find(
              (s) => s.name.toLowerCase() === suggestion.data.grantsSkill.toLowerCase()
            );
            if (skill) {
              crossRefs.push({
                type: "grants_skill",
                entity: { type: "skill", name: skill.name, id: skill.id }
              });
            }
          }
          if (suggestion.type === "skill" && ((_f = suggestion.data) == null ? void 0 : _f.prerequisites)) {
            const prereqs = suggestion.data.prerequisites;
            if (prereqs.parentSkills) {
              prereqs.parentSkills.forEach((parentId) => {
                var _a2;
                const parent = (_a2 = worldState.skillBank) == null ? void 0 : _a2.find((s) => s.id === parentId);
                if (parent) {
                  crossRefs.push({
                    type: "requires_skill",
                    entity: { type: "skill", name: parent.name, id: parent.id }
                  });
                }
              });
            }
          }
          return crossRefs;
        }
        /**
         * Generate action options for a suggestion
         */
        async generateActionOptions(suggestion, worldState) {
          if (suggestion.actionOptions && suggestion.actionOptions.length > 0) {
            return suggestion.actionOptions;
          }
          const defaultOptions = {
            item: [
              { id: "A", label: "Add to item database and update wiki", action: "add_and_wiki" },
              { id: "B", label: "Add to item database only", action: "add_only" },
              { id: "C", label: "Add and link to character inventory", action: "add_and_link" },
              { id: "D", label: "Skip this item", action: "skip" }
            ],
            chapter: [
              { id: "A", label: "Insert before existing chapter (renumber)", action: "insert_before" },
              { id: "B", label: "Insert after existing chapter (renumber)", action: "insert_after" },
              { id: "C", label: "Replace existing chapter", action: "replace" },
              { id: "D", label: "Create as variant (Chapter Xa)", action: "variant" }
            ],
            skill: [
              { id: "A", label: "Add to skill tree and link prerequisites", action: "add_and_link" },
              { id: "B", label: "Add to skill tree only", action: "add_only" },
              { id: "C", label: "Add and assign to character", action: "add_and_assign" },
              { id: "D", label: "Skip this skill", action: "skip" }
            ]
          };
          return defaultOptions[suggestion.type] || [
            { id: "A", label: "Add to database", action: "add" },
            { id: "B", label: "Skip", action: "skip" }
          ];
        }
        /**
         * Feature 1: Detect new characters in text
         */
        async detectCharactersInText(text, existingActors) {
          const systemContext = `You are analyzing text from a book series to detect new characters.
Extract all character names, descriptions, and dialogue attribution that might represent new characters not yet in the database.
IMPORTANT: Characters may be referred to by nicknames/aliases. Check all known names AND nicknames before marking as new.
Return JSON:
{
  "characters": [
    {
      "name": "Character Name",
      "description": "What we know about them",
      "suggestedRole": "The Fallen Knight",
      "suggestedClass": "Protagonist|Ally|NPC|Threat",
      "suggestedStats": {"STR": 50, "VIT": 60, "INT": 10, "DEX": 20},
      "suggestedNicknames": ["alias1", "alias2"],
      "sourceChapters": ["Book 1, Chapter 2"],
      "confidence": 0.85,
      "textEvidence": "Quote from text",
      "matchedExistingActor": null
    }
  ]
}`;
          const existingNamesWithAliases = existingActors.map((a) => {
            var _a;
            const nicknames = ((_a = a.nicknames) == null ? void 0 : _a.length) > 0 ? ` (aka: ${a.nicknames.join(", ")})` : "";
            return `${a.name}${nicknames}`;
          }).join("; ");
          const prompt = `Analyze this text and detect characters:

${text.substring(0, 1e4)}${text.length > 1e4 ? "\n[... text continues ...]" : ""}

EXISTING ACTORS (with nicknames/aliases):
${existingNamesWithAliases || "None"}

Instructions:
1. Extract ALL character mentions from the text
2. For each character, check if they match an existing actor BY NAME OR NICKNAME
3. If a character is called by a nickname (e.g., "boss", "the knight"), match them to the existing actor
4. Only mark as NEW if they don't match any existing actor's name or nicknames
5. For new characters, suggest nicknames based on how they're referred to in the text

Return JSON with detected characters:`;
          try {
            const response = await this.callAI(prompt, "analytical", systemContext);
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              return JSON.parse(jsonMatch[0]);
            }
            return { characters: [] };
          } catch (error) {
            console.error("Character detection error:", error);
            return { characters: [] };
          }
        }
        /**
         * Feature 2: Extract stat changes from text
         */
        async extractStatChanges(text, actorContext, statRegistry) {
          const systemContext = `You are extracting stat changes from "The Compliance Run" book series text.
Detect when characters gain or lose stats, level up, or have stat modifications.
Return JSON:
{
  "changes": [
    {
      "actorName": "Character Name",
      "actorId": "actor_id_if_known",
      "statChanges": {"STR": +5, "VIT": -2, "INT": +10},
      "confidence": 0.9,
      "textEvidence": "Exact quote from text",
      "chapter": "Book 1, Chapter 2"
    }
  ]
}`;
          const actorList = actorContext.map((a) => `${a.name} (${a.id})`).join(", ");
          const statList = statRegistry.map((s) => s.key).join(", ");
          const prompt = `Extract stat changes from this text:

${text.substring(0, 1e4)}${text.length > 1e4 ? "\n[... text continues ...]" : ""}

Available actors: ${actorList || "None"}
Available stats: ${statList || "None"}

Return JSON with all stat changes detected:`;
          try {
            const response = await this.callAI(prompt, "analytical", systemContext);
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              return JSON.parse(jsonMatch[0]);
            }
            return { changes: [] };
          } catch (error) {
            console.error("Stat extraction error:", error);
            return { changes: [] };
          }
        }
        /**
         * Feature 3: Detect skill and item acquisitions
         */
        async detectSkillItemAcquisitions(text, actorId, itemBank, skillBank) {
          const systemContext = `You are detecting skill and item acquisitions from "The Compliance Run" book series text.
Detect when characters learn skills, acquire items, lose items, or gain/lose abilities.
Return JSON:
{
  "acquisitions": [
    {
      "type": "skill|item",
      "name": "Skill/Item Name",
      "action": "acquired|lost|learned|mastered",
      "actorName": "Character Name",
      "actorId": "actor_id",
      "confidence": 0.85,
      "textEvidence": "Quote from text",
      "matchesExisting": true,
      "existingId": "item_id_if_found"
    }
  ]
}`;
          const itemList = itemBank.map((i) => i.name).join(", ");
          const skillList = skillBank.map((s) => s.name).join(", ");
          const prompt = `Detect skill and item acquisitions in this text:

${text.substring(0, 1e4)}${text.length > 1e4 ? "\n[... text continues ...]" : ""}

Existing items: ${itemList || "None"}
Existing skills: ${skillList || "None"}

Return JSON with all acquisitions detected:`;
          try {
            const response = await this.callAI(prompt, "analytical", systemContext);
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              return JSON.parse(jsonMatch[0]);
            }
            return { acquisitions: [] };
          } catch (error) {
            console.error("Acquisition detection error:", error);
            return { acquisitions: [] };
          }
        }
        /**
         * Feature 4: Generate character biography
         */
        async generateCharacterBiography(actorData, chapterAppearances, worldState) {
          var _a;
          const systemContext = `You are writing comprehensive character biographies for "The Compliance Run" book series.
Create rich, detailed biographies based on how characters appear across chapters.
Format in markdown with sections: Overview, Personality & Traits, Key Relationships, Major Story Moments, Character Arc Summary.`;
          const chapterTexts = chapterAppearances.map(
            (c) => {
              var _a2;
              return `Book ${c.bookId}, Chapter ${c.chapterId}: ${((_a2 = c.text) == null ? void 0 : _a2.substring(0, 500)) || ""}`;
            }
          ).join("\n\n");
          const prompt = `Generate a comprehensive biography for this character:

Name: ${actorData.name}
Class: ${actorData.class}
Role: ${actorData.role}
Current Stats: ${JSON.stringify(actorData.baseStats || {})}
Description: ${actorData.desc || ""}

Chapter Appearances:
${chapterTexts}

Relationships: ${((_a = worldState.actors) == null ? void 0 : _a.filter((a) => a.id !== actorData.id).map((a) => a.name).join(", ")) || "None"}

Create a detailed biography in markdown format:`;
          try {
            return await this.callAI(prompt, "creative", systemContext);
          } catch (error) {
            console.error("Biography generation error:", error);
            return "Error generating biography.";
          }
        }
        /**
         * Feature 5: Suggest actor stats
         */
        async suggestActorStats(actorInfo, statRegistry, existingActors) {
          const systemContext = `You are suggesting appropriate stat values for new characters in "The Compliance Run" book series.
Base suggestions on role, class, and description. Consider existing character patterns.`;
          const statList = statRegistry.map((s) => `${s.key} (${s.name}): ${s.desc}`).join("\n");
          const existingPatterns = existingActors.slice(0, 5).map(
            (a) => `${a.name} (${a.class}): ${JSON.stringify(a.baseStats)}`
          ).join("\n");
          const prompt = `Suggest stat values for this new character:

Name: ${actorInfo.name || ""}
Role: ${actorInfo.role || ""}
Class: ${actorInfo.actorClass || ""}
Description: ${actorInfo.desc || ""}

Available stats:
${statList}

Existing character patterns:
${existingPatterns || "None"}

Return JSON:
{
  "suggestedStats": {"STR": 50, "VIT": 60, "INT": 10, "DEX": 20},
  "reasoning": "Brief explanation of stat choices",
  "confidence": 0.85
}`;
          try {
            const response = await this.callAI(prompt, "structured", systemContext);
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              return JSON.parse(jsonMatch[0]);
            }
            return { suggestedStats: {}, reasoning: "", confidence: 0 };
          } catch (error) {
            console.error("Stat suggestion error:", error);
            return { suggestedStats: {}, reasoning: "", confidence: 0 };
          }
        }
        /**
         * Feature 6: Check character consistency
         */
        async checkCharacterConsistency(actorId, snapshots, chapters) {
          const systemContext = `You are a continuity checker for "The Compliance Run" book series.
Detect inconsistencies in character progression, impossible state transitions, and timeline violations.`;
          const snapshotData = Object.entries(snapshots).map(([key, snap]) => {
            const [bookId, chapterId] = key.split("_");
            return `Book ${bookId}, Chapter ${chapterId}: ${JSON.stringify(snap)}`;
          }).join("\n\n");
          const prompt = `Check consistency for character ${actorId}:

Snapshots:
${snapshotData}

Chapters:
${chapters.map((c) => `Book ${c.bookId}, Chapter ${c.chapterId}: ${c.title}`).join("\n")}

Return JSON array:
[
  {
    "type": "stat_mismatch|item_conflict|timeline_violation|impossible_transition",
    "severity": "critical|warning|minor",
    "description": "Clear description",
    "location": "Book X, Chapter Y",
    "suggestion": "How to fix",
    "snapshot1": "book_chapter",
    "snapshot2": "book_chapter"
  }
]`;
          try {
            const response = await this.callAI(prompt, "analytical", systemContext);
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              return JSON.parse(jsonMatch[0]);
            }
            return [];
          } catch (error) {
            console.error("Consistency check error:", error);
            return [];
          }
        }
        /**
         * Feature 7: Analyze character arc
         */
        async analyzeCharacterArc(actorId, chapters, snapshots) {
          const systemContext = `You are analyzing character arcs for "The Compliance Run" book series.
Detect arc milestones: Introduction, Development, Conflict, Resolution.`;
          const chapterData = chapters.map(
            (c) => {
              var _a;
              return `Book ${c.bookId}, Chapter ${c.chapterId}: ${c.title}
${((_a = c.script) == null ? void 0 : _a.substring(0, 500)) || c.desc || ""}`;
            }
          ).join("\n\n---\n\n");
          const prompt = `Analyze character arc for actor ${actorId}:

Chapters:
${chapterData}

Snapshots:
${JSON.stringify(snapshots, null, 2)}

Return JSON:
{
  "introduction": {"chapter": "book_chapter", "description": "...", "completion": 100},
  "development": {"chapter": "book_chapter", "description": "...", "completion": 75},
  "conflict": {"chapter": "book_chapter", "description": "...", "completion": 50},
  "resolution": {"chapter": "book_chapter", "description": "...", "completion": 0},
  "overallCompletion": 56,
  "milestones": [
    {"type": "introduction|development|conflict|resolution", "chapter": "book_chapter", "description": "..."}
  ]
}`;
          try {
            const response = await this.callAI(prompt, "analytical", systemContext);
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              return JSON.parse(jsonMatch[0]);
            }
            return null;
          } catch (error) {
            console.error("Arc analysis error:", error);
            return null;
          }
        }
        /**
         * Feature 8: Suggest role and class
         */
        async suggestRoleClass(characterData, worldState) {
          var _a;
          const systemContext = `You are suggesting role and class assignments for characters in "The Compliance Run" book series.
Consider character behavior, dialogue, actions, and existing patterns.`;
          const existingPatterns = ((_a = worldState.actors) == null ? void 0 : _a.slice(0, 10).map(
            (a) => `${a.name}: ${a.class} - ${a.role}`
          ).join("\n")) || "None";
          const prompt = `Suggest role and class for this character:

Name: ${characterData.name || ""}
Description: ${characterData.desc || ""}
Actions/Dialogue: ${characterData.actions || characterData.dialogue || ""}

Existing patterns:
${existingPatterns}

Return JSON:
{
  "suggestedRole": "The Fallen Knight",
  "suggestedClass": "Protagonist|Ally|NPC|Threat",
  "confidence": 0.85,
  "reasoning": "Brief explanation"
}`;
          try {
            const response = await this.callAI(prompt, "analytical", systemContext);
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              return JSON.parse(jsonMatch[0]);
            }
            return { suggestedRole: "", suggestedClass: "", confidence: 0, reasoning: "" };
          } catch (error) {
            console.error("Role/Class suggestion error:", error);
            return { suggestedRole: "", suggestedClass: "", confidence: 0, reasoning: "" };
          }
        }
        /**
         * Feature 9: Analyze character appearances
         */
        async analyzeCharacterAppearances(chapterText, actorName) {
          const systemContext = `You are analyzing character appearances in chapters for "The Compliance Run" book series.
Count mentions, dialogue, and determine importance level.`;
          const prompt = `Analyze appearances of "${actorName}" in this chapter text:

${chapterText.substring(0, 5e3)}${chapterText.length > 5e3 ? "\n[... text continues ...]" : ""}

Return JSON:
{
  "mentionCount": 15,
  "dialogueCount": 8,
  "importance": "protagonist|supporting|cameo",
  "firstMention": 42,
  "lastMention": 1250,
  "keyMoments": ["Moment 1", "Moment 2"]
}`;
          try {
            const response = await this.callAI(prompt, "analytical", systemContext);
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              return JSON.parse(jsonMatch[0]);
            }
            return { mentionCount: 0, dialogueCount: 0, importance: "cameo", firstMention: 0, lastMention: 0, keyMoments: [] };
          } catch (error) {
            console.error("Appearance analysis error:", error);
            return { mentionCount: 0, dialogueCount: 0, importance: "cameo", firstMention: 0, lastMention: 0, keyMoments: [] };
          }
        }
        /**
         * Feature 10: Suggest snapshot creation
         */
        async suggestSnapshot(actorId, currentChapter, previousSnapshot, chapterText) {
          const systemContext = `You are analyzing when to create character snapshots in "The Compliance Run" book series.
Suggest snapshots at key moments: significant stat changes, skill acquisitions, major story events.`;
          const prompt = `Should a snapshot be created for actor ${actorId} at ${currentChapter.bookId}_${currentChapter.chapterId}?

Previous snapshot: ${previousSnapshot ? JSON.stringify(previousSnapshot) : "None"}
Current chapter: ${(chapterText == null ? void 0 : chapterText.substring(0, 2e3)) || ""}

Return JSON:
{
  "shouldCreate": true,
  "confidence": 0.9,
  "reason": "Brief explanation of why snapshot is needed",
  "suggestedNote": "AI-generated note summarizing changes",
  "changes": {
    "stats": {"STR": +5},
    "skills": ["new_skill"],
    "items": ["new_item"]
  }
}`;
          try {
            const response = await this.callAI(prompt, "analytical", systemContext);
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              return JSON.parse(jsonMatch[0]);
            }
            return { shouldCreate: false, confidence: 0, reason: "", suggestedNote: "", changes: {} };
          } catch (error) {
            console.error("Snapshot suggestion error:", error);
            return { shouldCreate: false, confidence: 0, reason: "", suggestedNote: "", changes: {} };
          }
        }
        /**
         * Generate chapter outline
         */
        async generateChapterOutline(bookOrContext, chapterOrOptions, contextOrNull) {
          var _a, _b, _c;
          let prompt = "";
          let systemContext = "";
          if (typeof bookOrContext === "string" && chapterOrOptions && typeof chapterOrOptions === "object" && chapterOrOptions.books) {
            const context = bookOrContext;
            const { books, actors } = chapterOrOptions;
            const booksList = Array.isArray(books) ? books : Object.values(books || {});
            const lastChapter = booksList.flatMap((b) => b.chapters || []).slice(-1)[0];
            systemContext = `You are a creative writing assistant. Create detailed chapter outlines based on the provided story context and characters.`;
            prompt = `Generate a chapter outline based on this context:

${context}

Available books: ${booksList.map((b) => `Book ${b.id}: ${b.title || ""}`).join(", ")}
Available characters: ${(actors == null ? void 0 : actors.map((a) => a.name).join(", ")) || "None"}

${lastChapter ? `Last chapter was: ${lastChapter.title} - ${lastChapter.desc || ""}` : "This is the beginning of the story."}

Create a detailed chapter outline with:
- Chapter title
- Brief description
- Key plot points
- Character appearances
- Important events
- Story progression`;
          } else if (bookOrContext && typeof bookOrContext === "object" && chapterOrOptions && typeof chapterOrOptions === "object") {
            const book = bookOrContext;
            const chapter = chapterOrOptions;
            const context = contextOrNull || {};
            const meta = context.meta || {};
            const storyPremise = meta.premise || "";
            const storyTone = meta.tone || "";
            const actorsList = ((_a = context.actors) == null ? void 0 : _a.map((a) => {
              const nicknames = a.nicknames ? ` (aka ${a.nicknames.join(", ")})` : "";
              return `${a.name}${nicknames} - ${a.class || "Unknown"}: ${a.role || "No role defined"}`;
            }).join("\n  ")) || "None defined";
            const itemsList = ((_b = context.items) == null ? void 0 : _b.map((i) => `${i.name} (${i.type || "Unknown"})`).join(", ")) || "None";
            const skillsList = ((_c = context.skills) == null ? void 0 : _c.map((s) => `${s.name} (${s.type || "Unknown"})`).join(", ")) || "None";
            const previousChapters = context.previousChapters || [];
            systemContext = `You are a creative writing assistant for a book series.
${storyPremise ? `STORY PREMISE: ${storyPremise}` : ""}
${storyTone ? `TONE: ${storyTone}` : ""}

IMPORTANT: Only use the characters, items, and settings provided. Do NOT invent new characters or settings. The outline must match the existing story world.`;
            prompt = `Generate a detailed chapter outline for:

BOOK: ${book.title || `Book ${book.id}`} - ${book.focus || ""}
CHAPTER: ${chapter.title || `Chapter ${chapter.id}`}
${chapter.desc ? `CHAPTER DESCRIPTION: ${chapter.desc}` : ""}

AVAILABLE CHARACTERS:
  ${actorsList}

AVAILABLE ITEMS: ${itemsList}
AVAILABLE SKILLS: ${skillsList}

${previousChapters.length > 0 ? `PREVIOUS CHAPTERS CONTEXT:
${previousChapters.map((ch) => `- ${ch.title || "Untitled"}: ${ch.desc || ""}
  ${ch.script ? `Preview: "${ch.script.substring(0, 200)}..."` : ""}`).join("\n")}` : "This is the first chapter."}

Create a comprehensive chapter outline for "${chapter.title || "this chapter"}" that:
- Uses ONLY the characters listed above
- Maintains consistency with previous chapters
- Fits the established tone and premise
- Includes scene breakdown, character interactions, plot progression, dialogue moments, and emotional beats`;
          } else {
            throw new Error("Invalid arguments for generateChapterOutline");
          }
          try {
            const result = await this.callAI(prompt, "creative", systemContext);
            return result;
          } catch (error) {
            console.error("Chapter outline generation error:", error);
            throw error;
          }
        }
        /**
         * Write chapter content with full style guide integration
         */
        async writeChapter(context, selectedChapters, outline, mode = "full", options = {}) {
          var _a;
          const styleGuideService2 = (await Promise.resolve().then(() => (init_styleGuideService(), styleGuideService_exports))).default;
          const chapterContextService2 = (await Promise.resolve().then(() => (init_chapterContextService(), chapterContextService_exports))).default;
          const db2 = (await Promise.resolve().then(() => (init_database(), database_exports))).default;
          const promptConfig = (options == null ? void 0 : options.customPromptConfig) || {
            includeStyleGuide: true,
            includeBuzzwords: true,
            includeSnapshots: true,
            includeChapterContext: true,
            includeActors: true,
            includeItems: true,
            includeSkills: true,
            includeStoryContext: true,
            includeSeriesBible: true,
            includeWiki: true,
            customInstructions: "",
            removedSections: []
          };
          let systemContext = 'You are a creative writing assistant for "The Compliance Run" book series.';
          if (promptConfig.includeStyleGuide) {
            systemContext = await styleGuideService2.getSystemContext();
          }
          let buzzwordsRef = "";
          if (promptConfig.includeBuzzwords) {
            buzzwordsRef = await styleGuideService2.getBuzzwordsReference();
          }
          const writingContext = await this.buildWritingContext(
            context,
            selectedChapters,
            outline,
            mode,
            options,
            styleGuideService2,
            chapterContextService2,
            db2
          );
          const book = context.book || {};
          const chapter = context.chapter || {};
          let prompt = `Write ${mode === "full" ? "a complete chapter" : "suggestions for improving this chapter"} for:

Book: ${book.title || `Book ${book.id}`}
Chapter: ${chapter.title || `Chapter ${chapter.id}`}
${chapter.desc ? `Description: ${chapter.desc}` : ""}

${outline ? `Chapter Outline:
${outline}

` : ""}

${promptConfig.includeChapterContext && writingContext.chapterContext ? `PREVIOUS CHAPTERS CONTEXT:
${writingContext.chapterContext}

` : ""}

${promptConfig.includeActors && writingContext.actorsContext ? `AVAILABLE CHARACTERS:
${writingContext.actorsContext}

` : ""}

${promptConfig.includeSnapshots && writingContext.snapshotsContext ? `CHARACTER CURRENT STATES (from latest snapshots):
${writingContext.snapshotsContext}

` : ""}

${promptConfig.includeItems && writingContext.itemsContext ? `AVAILABLE ITEMS:
${writingContext.itemsContext}

` : ""}

${promptConfig.includeSkills && writingContext.skillsContext ? `AVAILABLE SKILLS:
${writingContext.skillsContext}

` : ""}

${promptConfig.includeStoryContext && writingContext.storyContextDocuments ? writingContext.storyContextDocuments : ""}

${promptConfig.includeSeriesBible && writingContext.seriesBibleContext ? writingContext.seriesBibleContext : ""}

${promptConfig.includeWiki && writingContext.wikiContext ? writingContext.wikiContext : ""}

${promptConfig.includeBuzzwords && buzzwordsRef ? `BUZZWORDS REFERENCE:
${buzzwordsRef}

Use these terms and phrases appropriately in your writing.

` : ""}

${mode === "assist" ? `CURRENT CHAPTER TEXT:
${((_a = context.chapter) == null ? void 0 : _a.script) || ""}

Provide suggestions and improvements:` : "Write the complete chapter content following the Writing Style Guide exactly."}

${promptConfig.customInstructions ? `
ADDITIONAL CUSTOM INSTRUCTIONS:
${promptConfig.customInstructions}

` : ""}

VALIDATION CHECKLIST - Before finalizing, ensure:
- Tone balance is 60% horror/RPG brutality, 40% caustic comedy
- Character voices match guidelines (Grimguff formal/heroic, Pipkins sardonic/British slang)
- Bureaucratic buzzwords used appropriately
- British spelling and slang used correctly
- Formatting follows guide (italics for thoughts, bold for UI, etc.)
- Recurring gags and devices incorporated where appropriate`;
          try {
            const result = await this.callAI(prompt, "creative", systemContext);
            return result;
          } catch (error) {
            console.error("Chapter writing error:", error);
            throw error;
          }
        }
        /**
         * Build comprehensive writing context with style guide, snapshots, and chapters
         */
        async buildWritingContext(context, selectedChapters, outline, mode, options, styleGuideService2, chapterContextService2, db2) {
          const book = context.book || {};
          const chapter = context.chapter || {};
          const actors = context.actors || [];
          const items = context.items || [];
          const skills = context.skills || [];
          const wikiEntries = context.wikiEntries || [];
          const books = context.books || {};
          let chapterContext = "";
          if (selectedChapters && selectedChapters.length > 0) {
            chapterContext = chapterContextService2.buildChapterContext(selectedChapters);
          }
          const actorsList = actors.map((a) => {
            let actorInfo = `${a.name} (${a.class || "Unknown"}): ${a.desc || "No description"}`;
            if (a.baseStats) {
              const stats = Object.entries(a.baseStats).map(([key, val]) => `${key}: ${val}`).join(", ");
              actorInfo += ` | Stats: ${stats}`;
            }
            return actorInfo;
          }).join("\n") || "None";
          const itemsList = items.map((i) => {
            let itemInfo = `${i.name}: ${i.desc || "No description"}`;
            if (i.type) itemInfo += ` | Type: ${i.type}`;
            if (i.rarity) itemInfo += ` | Rarity: ${i.rarity}`;
            if (i.stats) {
              const stats = Object.entries(i.stats).map(([key, val]) => `${key}: ${val}`).join(", ");
              itemInfo += ` | Stats: ${stats}`;
            }
            return itemInfo;
          }).join("\n") || "None";
          const skillsList = skills.map((s) => {
            let skillInfo = `${s.name}: ${s.desc || "No description"}`;
            if (s.type) skillInfo += ` | Type: ${s.type}`;
            if (s.tier) skillInfo += ` | Tier: ${s.tier}`;
            if (s.statMod) {
              const mods = Object.entries(s.statMod).map(([key, val]) => `${key}: ${val}`).join(", ");
              skillInfo += ` | Stat Mods: ${mods}`;
            }
            return skillInfo;
          }).join("\n") || "None";
          let snapshotsContext = "";
          if (options.includeSnapshots !== false && actors.length > 0) {
            try {
              const actorIds = actors.map((a) => a.id);
              const snapshots = await db2.getLatestSnapshotsForActors(
                actorIds,
                book.id || null,
                chapter.id || null
              );
              if (Object.keys(snapshots).length > 0) {
                const snapshotEntries = Object.entries(snapshots).map(([actorId, snapshot]) => {
                  const actor = actors.find((a) => a.id === actorId);
                  const actorName = actor ? actor.name : actorId;
                  let snapshotInfo = `${actorName}'s Current State:
`;
                  if (snapshot.baseStats) {
                    const stats = Object.entries(snapshot.baseStats).map(([key, val]) => `  ${key}: ${val}`).join("\n");
                    snapshotInfo += `  Stats:
${stats}
`;
                  }
                  if (snapshot.activeSkills && snapshot.activeSkills.length > 0) {
                    snapshotInfo += `  Active Skills: ${snapshot.activeSkills.join(", ")}
`;
                  }
                  if (snapshot.inventory && snapshot.inventory.length > 0) {
                    snapshotInfo += `  Inventory Items: ${snapshot.inventory.length} items
`;
                  }
                  if (snapshot.equipment) {
                    const equipped = Object.entries(snapshot.equipment).filter(([_, item]) => item !== null).map(([slot, item]) => `    ${slot}: ${item.name || item}`).join("\n");
                    if (equipped) {
                      snapshotInfo += `  Equipment:
${equipped}
`;
                    }
                  }
                  return snapshotInfo;
                });
                snapshotsContext = snapshotEntries.join("\n---\n\n");
              }
            } catch (error) {
              console.warn("Could not load snapshots:", error);
            }
          }
          let storyContextDocuments = "";
          let seriesBibleContext = "";
          let wikiContext = "";
          try {
            const storyContextService2 = (await Promise.resolve().then(() => (init_storyContextService(), storyContextService_exports))).default;
            if ((options == null ? void 0 : options.includeStoryContext) !== false) {
              const selectedDocIds = (options == null ? void 0 : options.selectedContextDocumentIds) || null;
              storyContextDocuments = await storyContextService2.buildContextString(selectedDocIds);
            }
            if ((options == null ? void 0 : options.includeSeriesBible) !== false && books && Object.keys(books).length > 0) {
              seriesBibleContext = await storyContextService2.getSeriesBibleContext(books);
            }
            if ((options == null ? void 0 : options.includeWiki) !== false && wikiEntries && wikiEntries.length > 0) {
              wikiContext = await storyContextService2.getWikiContext(wikiEntries);
            }
          } catch (error) {
            console.warn("Could not load story context:", error);
          }
          return {
            chapterContext,
            actorsContext: actorsList,
            itemsContext: itemsList,
            skillsContext: skillsList,
            snapshotsContext,
            storyContextDocuments,
            seriesBibleContext,
            wikiContext
          };
        }
        /**
         * Analyze chapter text for consistency and suggestions
         * Used by the autonomous pipeline
         */
        async analyzeChapterText(analysisData) {
          var _a, _b, _c, _d, _e;
          const systemPrompt = `You are a story analysis AI. Analyze chapter text for consistency with established story facts and suggest updates.

You MUST respond with valid JSON in this exact format:
{
  "consistencyIssues": [
    {
      "type": "contradiction|timeline|character|location|item",
      "severity": "critical|warning|info",
      "message": "description of the issue",
      "entityType": "actor|item|skill|location",
      "entityId": "id if known",
      "suggestion": "how to resolve"
    }
  ],
  "suggestions": [
    {
      "type": "stat_change|relationship|event|character_update",
      "message": "what should be updated",
      "entityType": "actor|item|skill",
      "entityId": "id if known",
      "data": { "relevant": "data" }
    }
  ],
  "warnings": [
    {
      "type": "potential_issue|ambiguity|plot_hole",
      "message": "description"
    }
  ],
  "summary": "Brief 2-3 sentence summary of the chapter"
}`;
          const userPrompt = `Analyze this chapter text against the established story context:

CHAPTER TEXT:
${analysisData.chapterText}

KNOWN CHARACTERS:
${JSON.stringify(((_b = (_a = analysisData.context) == null ? void 0 : _a.knownCharacters) == null ? void 0 : _b.slice(0, 20)) || [], null, 2)}

RECENT EVENTS:
${JSON.stringify(((_d = (_c = analysisData.context) == null ? void 0 : _c.recentEvents) == null ? void 0 : _d.slice(0, 10)) || [], null, 2)}

LOCKED ENTITIES (cannot be modified):
${JSON.stringify(((_e = analysisData.context) == null ? void 0 : _e.lockedEntities) || [], null, 2)}

ANALYSIS INSTRUCTIONS:
${analysisData.instructions}

Provide your analysis as JSON.`;
          try {
            const response = await this.callAI(
              userPrompt,
              "analytical",
              systemPrompt
            );
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              return JSON.parse(jsonMatch[0]);
            }
            return {
              consistencyIssues: [],
              suggestions: [],
              warnings: [{ type: "parse_error", message: "Could not parse AI response" }],
              summary: "Analysis could not be completed"
            };
          } catch (error) {
            console.error("Chapter analysis error:", error);
            throw error;
          }
        }
        /**
         * Expand voice notes into full narrative text
         */
        async expandVoiceNotes(transcript, context = {}) {
          const systemPrompt = `You are a creative writing assistant. Expand brief voice notes or dictation into full narrative prose.

Guidelines:
- Maintain the author's voice and style
- Expand abbreviated thoughts into complete sentences
- Add appropriate description and dialogue formatting
- Keep the original intent and meaning
- If context about characters/setting is provided, incorporate it naturally
- Return ONLY the expanded text, no explanations`;
          const userPrompt = `Expand these voice notes into full narrative prose:

VOICE NOTES:
"${transcript}"

${context.characters ? `CHARACTERS MENTIONED: ${context.characters.join(", ")}` : ""}
${context.setting ? `CURRENT SETTING: ${context.setting}` : ""}
${context.previousText ? `PREVIOUS TEXT CONTEXT: ${context.previousText.slice(-500)}` : ""}

Write the expanded narrative:`;
          try {
            const response = await this.callAI(
              userPrompt,
              "creative",
              systemPrompt
            );
            return response;
          } catch (error) {
            console.error("Voice expansion error:", error);
            throw error;
          }
        }
        /**
         * Generate a story bible PDF content
         */
        async generateStoryBibleContent(worldState) {
          var _a, _b, _c, _d, _e;
          const sections = [];
          sections.push({
            type: "title",
            content: "Story Bible",
            subtitle: `Generated ${(/* @__PURE__ */ new Date()).toLocaleDateString()}`
          });
          if (((_a = worldState.actors) == null ? void 0 : _a.length) > 0) {
            sections.push({
              type: "section",
              title: "Characters",
              items: worldState.actors.map((actor) => ({
                name: actor.name,
                role: actor.role || actor.class,
                description: actor.biography || actor.desc || "No description available",
                stats: actor.baseStats
              }))
            });
          }
          if (((_b = worldState.locations) == null ? void 0 : _b.length) > 0) {
            sections.push({
              type: "section",
              title: "Locations",
              items: worldState.locations.map((loc) => ({
                name: loc.name,
                description: loc.description || "No description available"
              }))
            });
          }
          if (((_c = worldState.itemBank) == null ? void 0 : _c.length) > 0) {
            sections.push({
              type: "section",
              title: "Notable Items",
              items: worldState.itemBank.filter((i) => i.rarity !== "Common").map((item) => ({
                name: item.name,
                type: item.type,
                rarity: item.rarity,
                description: item.desc || "No description available"
              }))
            });
          }
          if (((_d = worldState.skillBank) == null ? void 0 : _d.length) > 0) {
            sections.push({
              type: "section",
              title: "Skills & Abilities",
              items: worldState.skillBank.map((skill) => ({
                name: skill.name,
                type: skill.type,
                description: skill.desc || "No description available"
              }))
            });
          }
          if (((_e = worldState.timelineEvents) == null ? void 0 : _e.length) > 0) {
            sections.push({
              type: "section",
              title: "Timeline",
              items: worldState.timelineEvents.slice(0, 50).map((event) => ({
                title: event.title,
                description: event.description
              }))
            });
          }
          if (worldState.books) {
            sections.push({
              type: "section",
              title: "Story Structure",
              items: Object.values(worldState.books).flatMap(
                (book) => {
                  var _a2;
                  return ((_a2 = book.chapters) == null ? void 0 : _a2.map((ch) => ({
                    name: `Book ${book.id}, Chapter ${ch.id}: ${ch.title}`,
                    description: ch.desc || "No synopsis"
                  }))) || [];
                }
              )
            });
          }
          return sections;
        }
        /**
         * Process complete document with enhanced manuscript intelligence
         * Extracts book structure, chapters, beats, storylines, character arcs, timeline events, decisions, and callbacks
         * @param {string} docText - Full document text
         * @param {Object} worldState - Current world state
         * @param {Function} onProgress - Progress callback
         * @returns {Promise<Object>} Complete extraction results
         */
        async processCompleteManuscript(docText, worldState, onProgress = null) {
          try {
            const manuscriptIntelligenceService2 = (await Promise.resolve().then(() => (init_manuscriptIntelligenceService(), manuscriptIntelligenceService_exports))).default;
            return await manuscriptIntelligenceService2.processCompleteDocument(docText, worldState, onProgress);
          } catch (error) {
            console.error("Error processing complete manuscript:", error);
            throw error;
          }
        }
        /**
         * Auto consistency check - wrapper for checkConsistency
         * Used by various components for automated consistency checking
         */
        async checkConsistencyAuto(data, context = {}) {
          let analysisData;
          if (typeof data === "string") {
            analysisData = { text: data, ...context };
          } else {
            analysisData = data;
          }
          const systemContext = `You are a continuity editor analyzing a story for consistency issues.
Check for:
- Character stat inconsistencies
- Timeline contradictions
- Item/inventory errors
- Plot holes
- Character behavior inconsistencies

Return a JSON array of issues found.`;
          const prompt = `Analyze this story data for consistency issues:

${JSON.stringify(analysisData, null, 2).substring(0, 8e3)}

Return JSON array:
[
  {
    "type": "character|item|plot|timeline",
    "severity": "low|medium|high",
    "description": "Description of the issue",
    "location": "Where in the story",
    "suggestion": "How to fix it"
  }
]`;
          try {
            const response = await this.callAI(prompt, "analytical", systemContext);
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              return JSON.parse(jsonMatch[0]);
            }
            return [];
          } catch (error) {
            console.error("Consistency check error:", error);
            return [];
          }
        }
      };
      aiService = new AIService();
      aiService.loadApiKeys();
      aiService_default = aiService;
    }
  });

  // src/services/chapterFlowAnalyzer.js
  var ChapterFlowAnalyzer, chapterFlowAnalyzer, chapterFlowAnalyzer_default;
  var init_chapterFlowAnalyzer = __esm({
    "src/services/chapterFlowAnalyzer.js"() {
      init_aiService();
      init_database();
      ChapterFlowAnalyzer = class {
        constructor() {
          this.cache = /* @__PURE__ */ new Map();
        }
        /**
         * Analyze chapter dependencies
         * @param {Array} chapters - Array of chapters to analyze
         * @param {Object} books - Books object
         * @returns {Promise<Array>} Array of chapter dependencies
         */
        async analyzeChapterDependencies(chapters, books) {
          try {
            const chaptersWithContent = chapters.map((ch) => ({
              id: ch.id,
              title: ch.title,
              number: ch.number,
              bookId: ch.bookId,
              content: (ch.script || ch.content || "").substring(0, 2e3)
              // First 2000 chars for analysis
            }));
            const prompt = `Analyze these chapters and identify dependencies:

${JSON.stringify(chaptersWithContent, null, 2)}

For each chapter, identify:
- Which chapters it references or depends on
- Which chapters reference it
- Chapter order dependencies
- Character appearance patterns

Return JSON:
{
  "dependencies": [
    {
      "chapterId": 1,
      "dependsOn": [2, 3],
      "referencedBy": [4, 5],
      "order": 1,
      "characterAppearances": ["Character 1", "Character 2"]
    }
  ],
  "flow": {
    "linear": true/false,
    "branches": [],
    "parallel": []
  }
}`;
            const response = await aiService_default.callAI(prompt, "analytical");
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              return JSON.parse(jsonMatch[0]);
            }
            return { dependencies: [], flow: { linear: true, branches: [], parallel: [] } };
          } catch (error) {
            console.error("Error analyzing chapter dependencies:", error);
            return { dependencies: [], flow: { linear: true, branches: [], parallel: [] } };
          }
        }
        /**
         * Track character appearances across chapters
         * @param {Array} chapters - Array of chapters
         * @param {Array} actors - Available actors
         * @returns {Promise<Object>} Character appearance map
         */
        async trackCharacterAppearances(chapters, actors) {
          const appearances = {};
          for (const actor of actors) {
            appearances[actor.id] = {
              actorId: actor.id,
              actorName: actor.name,
              chapters: [],
              firstAppearance: null,
              lastAppearance: null,
              appearanceCount: 0
            };
          }
          for (const chapter of chapters) {
            const chapterText = (chapter.script || chapter.content || "").toLowerCase();
            for (const actor of actors) {
              const actorNameLower = actor.name.toLowerCase();
              const nicknames = (actor.nicknames || []).map((n) => n.toLowerCase());
              const appears = chapterText.includes(actorNameLower) || nicknames.some((nick) => chapterText.includes(nick));
              if (appears) {
                appearances[actor.id].chapters.push({
                  chapterId: chapter.id,
                  chapterNumber: chapter.number,
                  bookId: chapter.bookId,
                  chapterTitle: chapter.title
                });
                appearances[actor.id].appearanceCount++;
                if (!appearances[actor.id].firstAppearance) {
                  appearances[actor.id].firstAppearance = {
                    chapterId: chapter.id,
                    chapterNumber: chapter.number,
                    bookId: chapter.bookId
                  };
                }
                appearances[actor.id].lastAppearance = {
                  chapterId: chapter.id,
                  chapterNumber: chapter.number,
                  bookId: chapter.bookId
                };
              }
            }
          }
          return appearances;
        }
        /**
         * Track plot thread continuity
         * @param {Array} chapters - Array of chapters
         * @param {Array} plotBeats - Array of plot beats
         * @returns {Promise<Object>} Plot thread continuity map
         */
        async trackPlotThreadContinuity(chapters, plotBeats) {
          try {
            const threads = {};
            for (const beat of plotBeats) {
              const threadKey = beat.storyline || beat.thread || "general";
              if (!threads[threadKey]) {
                threads[threadKey] = {
                  name: threadKey,
                  beats: [],
                  chapters: [],
                  continuity: []
                };
              }
              threads[threadKey].beats.push(beat);
              if (beat.targetChapter && !threads[threadKey].chapters.includes(beat.targetChapter)) {
                threads[threadKey].chapters.push(beat.targetChapter);
              }
            }
            for (const threadKey in threads) {
              const thread = threads[threadKey];
              thread.chapters.sort((a, b) => a - b);
              const gaps = [];
              for (let i = 0; i < thread.chapters.length - 1; i++) {
                const current = thread.chapters[i];
                const next = thread.chapters[i + 1];
                if (next - current > 1) {
                  gaps.push({ from: current, to: next });
                }
              }
              thread.continuity = {
                isContinuous: gaps.length === 0,
                gaps,
                chapterCount: thread.chapters.length,
                beatCount: thread.beats.length
              };
            }
            return threads;
          } catch (error) {
            console.error("Error tracking plot thread continuity:", error);
            return {};
          }
        }
        /**
         * Ensure correct chapter sequence
         * @param {Array} chapters - Array of chapters
         * @returns {Promise<Object>} Sequence validation result
         */
        async validateChapterSequence(chapters) {
          const issues = [];
          const sortedChapters = [...chapters].sort((a, b) => {
            if (a.bookId !== b.bookId) return a.bookId - b.bookId;
            return (a.number || 0) - (b.number || 0);
          });
          const numberMap = {};
          for (const chapter of sortedChapters) {
            const key = `${chapter.bookId}_${chapter.number}`;
            if (numberMap[key]) {
              issues.push({
                type: "duplicate_number",
                chapterId: chapter.id,
                chapterNumber: chapter.number,
                bookId: chapter.bookId,
                message: `Duplicate chapter number ${chapter.number} in book ${chapter.bookId}`
              });
            }
            numberMap[key] = chapter;
          }
          const bookChapters = {};
          for (const chapter of sortedChapters) {
            if (!bookChapters[chapter.bookId]) {
              bookChapters[chapter.bookId] = [];
            }
            bookChapters[chapter.bookId].push(chapter);
          }
          for (const bookId in bookChapters) {
            const bookChs = bookChapters[bookId].sort((a, b) => (a.number || 0) - (b.number || 0));
            for (let i = 0; i < bookChs.length - 1; i++) {
              const current = bookChs[i].number || 0;
              const next = bookChs[i + 1].number || 0;
              if (next - current > 1) {
                issues.push({
                  type: "sequence_gap",
                  bookId,
                  from: current,
                  to: next,
                  message: `Gap in chapter sequence: ${current} to ${next}`
                });
              }
            }
          }
          return {
            isValid: issues.length === 0,
            issues,
            sortedChapters
          };
        }
        /**
         * Build complete chapter flow analysis
         * @param {Object} books - Books object
         * @param {Array} plotBeats - Plot beats
         * @param {Array} actors - Actors
         * @returns {Promise<Object>} Complete flow analysis
         */
        async buildCompleteFlowAnalysis(books, plotBeats = [], actors = []) {
          try {
            const allChapters = [];
            const booksArray = Array.isArray(books) ? books : Object.values(books || {});
            for (const book of booksArray) {
              if (book.chapters && Array.isArray(book.chapters)) {
                for (const chapter of book.chapters) {
                  allChapters.push({
                    ...chapter,
                    bookId: book.id
                  });
                }
              }
            }
            const [
              dependencies,
              characterAppearances,
              plotContinuity,
              sequenceValidation
            ] = await Promise.all([
              this.analyzeChapterDependencies(allChapters, books),
              this.trackCharacterAppearances(allChapters, actors),
              this.trackPlotThreadContinuity(allChapters, plotBeats),
              this.validateChapterSequence(allChapters)
            ]);
            return {
              dependencies,
              characterAppearances,
              plotContinuity,
              sequenceValidation,
              summary: {
                totalChapters: allChapters.length,
                totalBooks: booksArray.length,
                charactersTracked: actors.length,
                plotThreads: Object.keys(plotContinuity).length,
                sequenceIssues: sequenceValidation.issues.length
              }
            };
          } catch (error) {
            console.error("Error building complete flow analysis:", error);
            throw error;
          }
        }
      };
      chapterFlowAnalyzer = new ChapterFlowAnalyzer();
      chapterFlowAnalyzer_default = chapterFlowAnalyzer;
    }
  });

  // src/services/manuscriptContextEngine.js
  var manuscriptContextEngine_exports = {};
  __export(manuscriptContextEngine_exports, {
    default: () => manuscriptContextEngine_default
  });
  var ManuscriptContextEngine, manuscriptContextEngine, manuscriptContextEngine_default;
  var init_manuscriptContextEngine = __esm({
    "src/services/manuscriptContextEngine.js"() {
      init_database();
      init_contextEngine();
      init_chapterFlowAnalyzer();
      ManuscriptContextEngine = class {
        constructor() {
          this.cache = /* @__PURE__ */ new Map();
          this.cacheTimeout = 6e4;
        }
        /**
         * Build complete manuscript context for a chapter
         * @param {number} bookId - Book ID
         * @param {number} chapterId - Chapter ID
         * @returns {Promise<Object>} Complete manuscript context
         */
        async buildManuscriptContext(bookId, chapterId) {
          try {
            const cacheKey = `manuscript_${bookId}_${chapterId}`;
            const cached = this.cache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
              return cached.data;
            }
            const [
              chapterFlowContext,
              plotBeatContext,
              storylineContext,
              characterArcContext,
              timelineContext,
              decisionContext,
              aiSuggestionContext,
              callbacksContext,
              memoriesContext
            ] = await Promise.all([
              this.getChapterFlowContext(bookId),
              this.getPlotBeatContext(chapterId),
              this.getStorylineContext(chapterId),
              this.getCharacterArcContext(null, chapterId),
              // null = all characters
              this.getTimelineContext(chapterId),
              this.getDecisionContext(chapterId),
              this.getAISuggestionContext(chapterId),
              this.getCallbacksContext(chapterId),
              this.getMemoriesContext(chapterId)
            ]);
            const context = {
              chapterFlow: chapterFlowContext,
              plotBeats: plotBeatContext,
              storylines: storylineContext,
              characterArcs: characterArcContext,
              timeline: timelineContext,
              decisions: decisionContext,
              aiSuggestions: aiSuggestionContext,
              callbacks: callbacksContext,
              memories: memoriesContext,
              generatedAt: Date.now()
            };
            this.cache.set(cacheKey, { data: context, timestamp: Date.now() });
            return context;
          } catch (error) {
            console.error("Error building manuscript context:", error);
            return {
              chapterFlow: {},
              plotBeats: [],
              storylines: [],
              characterArcs: [],
              timeline: [],
              decisions: [],
              aiSuggestions: [],
              callbacks: [],
              memories: [],
              generatedAt: Date.now()
            };
          }
        }
        /**
         * Get AI suggestion context for a chapter
         * @param {number} chapterId - Chapter ID
         * @returns {Promise<Array>} AI suggestions
         */
        async getAISuggestionContext(chapterId) {
          try {
            const cacheKey = `ai_suggestions_${chapterId}`;
            const cached = this.cache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
              return cached.data;
            }
            let suggestions = [];
            try {
              const allSuggestions = await database_default.getAll("aiSuggestions") || [];
              suggestions = allSuggestions.filter(
                (s) => s.chapterId === chapterId && (s.status === "pending" || s.status === "accepted")
              );
            } catch (e) {
              return [];
            }
            const result = suggestions.map((s) => ({
              id: s.id,
              type: s.type,
              priority: s.priority,
              confidence: s.confidence,
              suggestion: s.suggestion,
              reasoning: s.reasoning,
              suggestions: s.suggestions || [],
              characters: s.characters || []
            }));
            this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
            return result;
          } catch (error) {
            console.error("Error getting AI suggestion context:", error);
            return [];
          }
        }
        /**
         * Invalidate AI suggestions cache for a chapter
         * @param {number} chapterId - Chapter ID
         */
        invalidateAISuggestionsCache(chapterId) {
          const cacheKey = `ai_suggestions_${chapterId}`;
          this.cache.delete(cacheKey);
          const manuscriptCacheKey = `manuscript_${chapterId}`;
          this.cache.delete(manuscriptCacheKey);
        }
        /**
         * Get callbacks context for a chapter
         * @param {number} chapterId - Chapter ID
         * @returns {Promise<Array>} Callbacks
         */
        async getCallbacksContext(chapterId) {
          var _a, _b;
          try {
            let callbacks = [];
            try {
              callbacks = await database_default.getAll("callbacks") || [];
            } catch (e) {
              return [];
            }
            const relevantCallbacks = callbacks.filter((cb) => {
              if (cb.chapterId === chapterId) return true;
              if (cb.used) return false;
              if (cb.targetChapter === chapterId) return true;
              return false;
            });
            const book = await this._getBookForChapter(chapterId);
            if (book) {
              const currentChapter = (_a = book.chapters) == null ? void 0 : _a.find((ch) => ch.id === chapterId);
              if (currentChapter) {
                const previousChapters = ((_b = book.chapters) == null ? void 0 : _b.filter(
                  (ch) => ch.number < currentChapter.number
                )) || [];
                const previousChapterIds = previousChapters.map((ch) => ch.id);
                const previousCallbacks = callbacks.filter(
                  (cb) => previousChapterIds.includes(cb.chapterId) && !cb.used
                );
                relevantCallbacks.push(...previousCallbacks.slice(-5));
              }
            }
            return relevantCallbacks.sort((a, b) => (b.importance || 0) - (a.importance || 0));
          } catch (error) {
            console.error("Error getting callbacks context:", error);
            return [];
          }
        }
        /**
         * Get memories context for a chapter
         * @param {number} chapterId - Chapter ID
         * @returns {Promise<Array>} Memories
         */
        async getMemoriesContext(chapterId) {
          var _a, _b;
          try {
            let memories = [];
            try {
              memories = await database_default.getAll("memories") || [];
            } catch (e) {
              return [];
            }
            const book = await this._getBookForChapter(chapterId);
            if (book) {
              const currentChapter = (_a = book.chapters) == null ? void 0 : _a.find((ch) => ch.id === chapterId);
              if (currentChapter) {
                const previousChapters = ((_b = book.chapters) == null ? void 0 : _b.filter(
                  (ch) => ch.number < currentChapter.number
                )) || [];
                const previousChapterIds = previousChapters.map((ch) => ch.id);
                const relevantMemories = memories.filter(
                  (m) => previousChapterIds.includes(m.chapterId) && (m.importance || 0) >= 5
                  // Only important memories
                );
                return relevantMemories.sort((a, b) => (b.importance || 0) - (a.importance || 0)).slice(0, 10);
              }
            }
            return memories.filter((m) => m.chapterId === chapterId);
          } catch (error) {
            console.error("Error getting memories context:", error);
            return [];
          }
        }
        /**
         * Get chapter flow context
         * @param {number} bookId - Book ID
         * @returns {Promise<Object>} Chapter flow context
         */
        async getChapterFlowContext(bookId) {
          try {
            const book = await database_default.get("books", bookId);
            if (!book || !book.chapters) {
              return { chapters: [], flow: null };
            }
            const chapters = book.chapters.map((ch) => ({
              id: ch.id,
              number: ch.number,
              title: ch.title,
              desc: ch.desc,
              hasContent: !!(ch.script || ch.content)
            }));
            const flowAnalysis = await chapterFlowAnalyzer_default.analyzeChapterDependencies(
              book.chapters,
              { [bookId]: book }
            );
            return {
              chapters,
              flow: flowAnalysis.flow,
              dependencies: flowAnalysis.dependencies,
              bookTitle: book.title,
              bookId: book.id
            };
          } catch (error) {
            console.error("Error getting chapter flow context:", error);
            return { chapters: [], flow: null };
          }
        }
        /**
         * Get plot beat context for a chapter
         * @param {number} chapterId - Chapter ID
         * @returns {Promise<Array>} Relevant plot beats
         */
        async getPlotBeatContext(chapterId) {
          var _a, _b;
          try {
            const allBeats = await contextEngine_default.getPlotBeats();
            const relevantBeats = allBeats.filter((beat) => {
              if (beat.targetChapter === chapterId || beat.chapterId === chapterId) {
                return true;
              }
              if (beat.chapters && beat.chapters.includes(chapterId)) {
                return true;
              }
              return false;
            });
            const book = await this._getBookForChapter(chapterId);
            if (book) {
              const currentChapter = (_a = book.chapters) == null ? void 0 : _a.find((ch) => ch.id === chapterId);
              if (currentChapter) {
                const previousChapters = ((_b = book.chapters) == null ? void 0 : _b.filter(
                  (ch) => ch.number < currentChapter.number
                )) || [];
                for (const prevChapter of previousChapters) {
                  const prevBeats = allBeats.filter(
                    (beat) => beat.targetChapter === prevChapter.id || beat.chapterId === prevChapter.id
                  );
                  relevantBeats.push(...prevBeats.slice(-3));
                }
              }
            }
            return relevantBeats;
          } catch (error) {
            console.error("Error getting plot beat context:", error);
            return [];
          }
        }
        /**
         * Get storyline context for a chapter
         * @param {number} chapterId - Chapter ID
         * @returns {Promise<Array>} Active storylines
         */
        async getStorylineContext(chapterId) {
          try {
            let storylines = [];
            try {
              storylines = await database_default.getAll("storylines") || [];
            } catch (e) {
            }
            const activeStorylines = storylines.filter((sl) => {
              if (sl.status === "resolved") return false;
              if (sl.relatedChapters && sl.relatedChapters.includes(chapterId)) return true;
              if (sl.chapterId === chapterId) return true;
              return sl.status === "active" || sl.status === "ongoing";
            });
            return activeStorylines;
          } catch (error) {
            console.error("Error getting storyline context:", error);
            return [];
          }
        }
        /**
         * Get character arc context
         * @param {Array} characterIds - Character IDs (null = all characters)
         * @param {number} chapterId - Chapter ID
         * @returns {Promise<Array>} Character arc data
         */
        async getCharacterArcContext(characterIds, chapterId) {
          try {
            let arcs = [];
            try {
              arcs = await database_default.getAll("characterArcs") || [];
            } catch (e) {
            }
            if (characterIds && Array.isArray(characterIds)) {
              arcs = arcs.filter((arc) => characterIds.includes(arc.characterId));
            }
            const relevantArcs = arcs.map((arc) => {
              const relevantMoments = (arc.timeline || []).filter((moment) => {
                return moment.chapterId === chapterId || moment.bookId === (arc.bookId || null);
              });
              return {
                characterId: arc.characterId,
                characterName: arc.characterName,
                moments: relevantMoments,
                statsHistory: arc.statsHistory || [],
                emotionalStates: arc.emotionalStates || [],
                goals: arc.goals || []
              };
            });
            return relevantArcs;
          } catch (error) {
            console.error("Error getting character arc context:", error);
            return [];
          }
        }
        /**
         * Get timeline context for a chapter
         * @param {number} chapterId - Chapter ID
         * @returns {Promise<Array>} Timeline events
         */
        async getTimelineContext(chapterId) {
          var _a, _b;
          try {
            const events = await database_default.getAll("timelineEvents") || [];
            const chapterEvents = events.filter((evt) => evt.chapterId === chapterId);
            const book = await this._getBookForChapter(chapterId);
            if (book) {
              const currentChapter = (_a = book.chapters) == null ? void 0 : _a.find((ch) => ch.id === chapterId);
              if (currentChapter) {
                const previousChapters = ((_b = book.chapters) == null ? void 0 : _b.filter(
                  (ch) => ch.number < currentChapter.number
                )) || [];
                const previousChapterIds = previousChapters.map((ch) => ch.id);
                const recentEvents = events.filter((evt) => previousChapterIds.includes(evt.chapterId)).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 10);
                return [...chapterEvents, ...recentEvents];
              }
            }
            return chapterEvents;
          } catch (error) {
            console.error("Error getting timeline context:", error);
            return [];
          }
        }
        /**
         * Get decision context for a chapter
         * @param {number} chapterId - Chapter ID
         * @returns {Promise<Array>} Past decisions
         */
        async getDecisionContext(chapterId) {
          var _a, _b;
          try {
            let decisions = [];
            try {
              decisions = await database_default.getAll("decisions") || [];
            } catch (e) {
            }
            const book = await this._getBookForChapter(chapterId);
            if (book) {
              const currentChapter = (_a = book.chapters) == null ? void 0 : _a.find((ch) => ch.id === chapterId);
              if (currentChapter) {
                const previousChapters = ((_b = book.chapters) == null ? void 0 : _b.filter(
                  (ch) => ch.number < currentChapter.number
                )) || [];
                const previousChapterIds = previousChapters.map((ch) => ch.id);
                const relevantDecisions = decisions.filter(
                  (dec) => previousChapterIds.includes(dec.chapterId || dec.chapterNumber)
                );
                return relevantDecisions.sort(
                  (a, b) => (b.importance || 0) - (a.importance || 0)
                );
              }
            }
            return decisions.filter((dec) => dec.chapterId === chapterId);
          } catch (error) {
            console.error("Error getting decision context:", error);
            return [];
          }
        }
        /**
         * Helper: Get book for a chapter
         * @param {number} chapterId - Chapter ID
         * @returns {Promise<Object|null>} Book object
         */
        async _getBookForChapter(chapterId) {
          try {
            const books = await database_default.getAll("books");
            for (const book of books) {
              if (book.chapters && Array.isArray(book.chapters)) {
                const chapter = book.chapters.find((ch) => ch.id === chapterId);
                if (chapter) {
                  return book;
                }
              }
            }
            return null;
          } catch (error) {
            console.error("Error getting book for chapter:", error);
            return null;
          }
        }
        /**
         * Clear cache
         */
        clearCache() {
          this.cache.clear();
        }
      };
      manuscriptContextEngine = new ManuscriptContextEngine();
      manuscriptContextEngine_default = manuscriptContextEngine;
    }
  });

  // src/services/callbackMemoryService.js
  var callbackMemoryService_exports = {};
  __export(callbackMemoryService_exports, {
    default: () => callbackMemoryService_default
  });
  var CallbackMemoryService, callbackMemoryService, callbackMemoryService_default;
  var init_callbackMemoryService = __esm({
    "src/services/callbackMemoryService.js"() {
      init_database();
      CallbackMemoryService = class {
        constructor() {
          this.memoryCache = /* @__PURE__ */ new Map();
        }
        /**
         * Register a callback - mark an event for future reference
         * @param {Object} event - Event to register
         * @param {number} targetChapter - Target chapter ID (optional)
         * @returns {Promise<Object>} Registered callback
         */
        async registerCallback(event, targetChapter = null) {
          try {
            const callback = {
              id: `callback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              event: event.event || event.title || "",
              description: event.description || "",
              type: event.type || "callback",
              importance: event.importance || 5,
              chapterId: event.chapterId || null,
              bookId: event.bookId || null,
              targetChapter,
              characters: event.characters || [],
              createdAt: Date.now(),
              used: false,
              usedIn: []
            };
            try {
              await database_default.add("callbacks", callback);
            } catch (e) {
              await database_default.add("callbacks", callback);
            }
            return callback;
          } catch (error) {
            console.error("Error registering callback:", error);
            throw error;
          }
        }
        /**
         * Get callbacks for a chapter
         * @param {number} chapterId - Chapter ID
         * @returns {Promise<Array>} Callbacks to include
         */
        async getCallbacksForChapter(chapterId) {
          try {
            let callbacks = [];
            try {
              callbacks = await database_default.getAll("callbacks") || [];
            } catch (e) {
              return [];
            }
            const relevantCallbacks = callbacks.filter((cb) => {
              if (cb.targetChapter === chapterId) return true;
              if (cb.used) return false;
              if (cb.importance >= 7) return true;
              return false;
            });
            return relevantCallbacks.sort((a, b) => {
              if (a.importance !== b.importance) {
                return (b.importance || 0) - (a.importance || 0);
              }
              return (b.createdAt || 0) - (a.createdAt || 0);
            });
          } catch (error) {
            console.error("Error getting callbacks for chapter:", error);
            return [];
          }
        }
        /**
         * Store a memory - important event to remember
         * @param {Object} event - Event to store
         * @param {number} importance - Importance level (1-10)
         * @returns {Promise<Object>} Stored memory
         */
        async storeMemory(event, importance = 5) {
          try {
            const memory = {
              id: `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              event: event.event || event.title || "",
              description: event.description || "",
              type: event.type || "memory",
              importance,
              chapterId: event.chapterId || null,
              bookId: event.bookId || null,
              characters: event.characters || [],
              emotionalTone: event.emotionalTone || "",
              createdAt: Date.now(),
              referenced: false,
              referencedIn: []
            };
            try {
              await database_default.add("memories", memory);
            } catch (e) {
              await database_default.add("memories", memory);
            }
            return memory;
          } catch (error) {
            console.error("Error storing memory:", error);
            throw error;
          }
        }
        /**
         * Get relevant memories for a chapter
         * @param {number} chapterId - Chapter ID
         * @returns {Promise<Array>} Relevant memories
         */
        async getRelevantMemories(chapterId) {
          var _a, _b;
          try {
            let memories = [];
            try {
              memories = await database_default.getAll("memories") || [];
            } catch (e) {
              return [];
            }
            const book = await this._getBookForChapter(chapterId);
            if (book) {
              const currentChapter = (_a = book.chapters) == null ? void 0 : _a.find((ch) => ch.id === chapterId);
              if (currentChapter) {
                const previousChapters = ((_b = book.chapters) == null ? void 0 : _b.filter(
                  (ch) => ch.number < currentChapter.number
                )) || [];
                const previousChapterIds = previousChapters.map((ch) => ch.id);
                const relevantMemories = memories.filter(
                  (mem) => previousChapterIds.includes(mem.chapterId) && (mem.importance >= 6 || !mem.referenced)
                );
                return relevantMemories.sort((a, b) => {
                  if (a.importance !== b.importance) {
                    return (b.importance || 0) - (a.importance || 0);
                  }
                  return (b.createdAt || 0) - (a.createdAt || 0);
                }).slice(0, 10);
              }
            }
            return memories.filter((mem) => mem.chapterId === chapterId);
          } catch (error) {
            console.error("Error getting relevant memories:", error);
            return [];
          }
        }
        /**
         * Track a decision
         * @param {Object} decision - Decision to track
         * @param {Array} consequences - Potential consequences
         * @returns {Promise<Object>} Tracked decision
         */
        async trackDecision(decision, consequences = []) {
          try {
            const trackedDecision = {
              id: `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              decision: decision.decision || decision.title || "",
              character: decision.character || "",
              consequences,
              importance: decision.importance || 5,
              type: decision.type || "plot",
              chapterId: decision.chapterId || null,
              bookId: decision.bookId || null,
              createdAt: Date.now(),
              resolved: false,
              resolvedIn: null
            };
            try {
              await database_default.add("decisions", trackedDecision);
            } catch (e) {
              await database_default.add("decisions", trackedDecision);
            }
            return trackedDecision;
          } catch (error) {
            console.error("Error tracking decision:", error);
            throw error;
          }
        }
        /**
         * Get decision context for a chapter
         * @param {number} chapterId - Chapter ID
         * @returns {Promise<Array>} Past decisions
         */
        async getDecisionContext(chapterId) {
          var _a, _b;
          try {
            let decisions = [];
            try {
              decisions = await database_default.getAll("decisions") || [];
            } catch (e) {
              return [];
            }
            const book = await this._getBookForChapter(chapterId);
            if (book) {
              const currentChapter = (_a = book.chapters) == null ? void 0 : _a.find((ch) => ch.id === chapterId);
              if (currentChapter) {
                const previousChapters = ((_b = book.chapters) == null ? void 0 : _b.filter(
                  (ch) => ch.number < currentChapter.number
                )) || [];
                const previousChapterIds = previousChapters.map((ch) => ch.id);
                const relevantDecisions = decisions.filter(
                  (dec) => previousChapterIds.includes(dec.chapterId) && !dec.resolved && dec.importance >= 6
                );
                return relevantDecisions.sort(
                  (a, b) => (b.importance || 0) - (a.importance || 0)
                );
              }
            }
            return decisions.filter((dec) => dec.chapterId === chapterId && !dec.resolved);
          } catch (error) {
            console.error("Error getting decision context:", error);
            return [];
          }
        }
        /**
         * Mark callback as used
         * @param {string} callbackId - Callback ID
         * @param {number} chapterId - Chapter where it was used
         * @returns {Promise<void>}
         */
        async markCallbackUsed(callbackId, chapterId) {
          try {
            const callback = await database_default.get("callbacks", callbackId);
            if (callback) {
              callback.used = true;
              if (!callback.usedIn) callback.usedIn = [];
              callback.usedIn.push(chapterId);
              await database_default.update("callbacks", callback);
            }
          } catch (error) {
            console.error("Error marking callback as used:", error);
          }
        }
        /**
         * Mark memory as referenced
         * @param {string} memoryId - Memory ID
         * @param {number} chapterId - Chapter where it was referenced
         * @returns {Promise<void>}
         */
        async markMemoryReferenced(memoryId, chapterId) {
          try {
            const memory = await database_default.get("memories", memoryId);
            if (memory) {
              memory.referenced = true;
              if (!memory.referencedIn) memory.referencedIn = [];
              memory.referencedIn.push(chapterId);
              await database_default.update("memories", memory);
            }
          } catch (error) {
            console.error("Error marking memory as referenced:", error);
          }
        }
        /**
         * Check continuity - ensure callbacks are properly used
         * @param {number} chapterId - Chapter ID
         * @returns {Promise<Object>} Continuity check result
         */
        async checkContinuity(chapterId) {
          try {
            const callbacks = await this.getCallbacksForChapter(chapterId);
            const memories = await this.getRelevantMemories(chapterId);
            const decisions = await this.getDecisionContext(chapterId);
            return {
              callbacksAvailable: callbacks.length,
              memoriesAvailable: memories.length,
              decisionsPending: decisions.length,
              suggestions: this._generateContinuitySuggestions(callbacks, memories, decisions)
            };
          } catch (error) {
            console.error("Error checking continuity:", error);
            return {
              callbacksAvailable: 0,
              memoriesAvailable: 0,
              decisionsPending: 0,
              suggestions: []
            };
          }
        }
        /**
         * Generate continuity suggestions
         * @param {Array} callbacks - Available callbacks
         * @param {Array} memories - Available memories
         * @param {Array} decisions - Pending decisions
         * @returns {Array} Suggestions
         */
        _generateContinuitySuggestions(callbacks, memories, decisions) {
          const suggestions = [];
          if (callbacks.length > 0) {
            suggestions.push({
              type: "callback",
              message: `Consider referencing ${callbacks.length} callback${callbacks.length > 1 ? "s" : ""} from previous chapters`,
              items: callbacks.slice(0, 3).map((cb) => cb.event)
            });
          }
          if (memories.length > 0) {
            suggestions.push({
              type: "memory",
              message: `Consider referencing ${memories.length} important memory${memories.length > 1 ? "ies" : ""}`,
              items: memories.slice(0, 3).map((mem) => mem.event)
            });
          }
          if (decisions.length > 0) {
            suggestions.push({
              type: "decision",
              message: `Consider addressing ${decisions.length} pending decision${decisions.length > 1 ? "s" : ""}`,
              items: decisions.slice(0, 3).map((dec) => dec.decision)
            });
          }
          return suggestions;
        }
        /**
         * Helper: Get book for a chapter
         * @param {number} chapterId - Chapter ID
         * @returns {Promise<Object|null>} Book object
         */
        async _getBookForChapter(chapterId) {
          try {
            const books = await database_default.getAll("books");
            for (const book of books) {
              if (book.chapters && Array.isArray(book.chapters)) {
                const chapter = book.chapters.find((ch) => ch.id === chapterId);
                if (chapter) {
                  return book;
                }
              }
            }
            return null;
          } catch (error) {
            console.error("Error getting book for chapter:", error);
            return null;
          }
        }
      };
      callbackMemoryService = new CallbackMemoryService();
      callbackMemoryService_default = callbackMemoryService;
    }
  });

  // src/entry.js
  var entry_exports = {};
  __export(entry_exports, {
    default: () => entry_default
  });
  init_database();
  init_aiService();
  init_manuscriptIntelligenceService();

  // src/services/manuscriptProcessingService.js
  init_database();
  init_aiService();
  init_manuscriptIntelligenceService();

  // src/services/extractionHistoryService.js
  init_database();
  var ExtractionHistoryService = class {
    constructor() {
      this.currentSession = null;
    }
    /**
     * Start a new extraction session
     */
    async startSession(chapterId, sourceType = "text", sourceName = "") {
      const session = {
        id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        chapterId,
        sourceType,
        // 'text' | 'file' | 'realtime' | 'document'
        sourceName,
        status: "active",
        entriesCount: 0,
        suggestions: [],
        reviewStatus: {},
        appliedActions: {},
        wizardState: {},
        documentText: "",
        lastSaved: Date.now()
      };
      try {
        await database_default.add("extractionSessions", session);
      } catch (e) {
        await database_default.update("extractionSessions", session);
      }
      this.currentSession = session;
      return session;
    }
    /**
     * Save wizard state to session
     * @param {string} sessionId - Session ID
     * @param {Object} wizardState - Wizard state to save
     */
    async saveWizardState(sessionId, wizardState) {
      try {
        const session = await database_default.get("extractionSessions", sessionId);
        if (session) {
          session.wizardState = wizardState;
          session.lastSaved = Date.now();
          await database_default.update("extractionSessions", session);
        }
      } catch (error) {
        console.error("Error saving wizard state:", error);
      }
    }
    /**
     * Save suggestions to session
     * @param {string} sessionId - Session ID
     * @param {Array} suggestions - Suggestions array
     */
    async saveSuggestions(sessionId, suggestions) {
      try {
        const session = await database_default.get("extractionSessions", sessionId);
        if (session) {
          session.suggestions = suggestions;
          session.lastSaved = Date.now();
          await database_default.update("extractionSessions", session);
        }
      } catch (error) {
        console.error("Error saving suggestions:", error);
      }
    }
    /**
     * Save review status to session
     * @param {string} sessionId - Session ID
     * @param {Object} reviewStatus - Review status object
     */
    async saveReviewStatus(sessionId, reviewStatus) {
      try {
        const session = await database_default.get("extractionSessions", sessionId);
        if (session) {
          session.reviewStatus = reviewStatus;
          session.lastSaved = Date.now();
          await database_default.update("extractionSessions", session);
        }
      } catch (error) {
        console.error("Error saving review status:", error);
      }
    }
    /**
     * Save document text to session
     * @param {string} sessionId - Session ID
     * @param {string} documentText - Document text
     */
    async saveDocumentText(sessionId, documentText) {
      try {
        const session = await database_default.get("extractionSessions", sessionId);
        if (session) {
          session.documentText = documentText;
          session.lastSaved = Date.now();
          await database_default.update("extractionSessions", session);
        }
      } catch (error) {
        console.error("Error saving document text:", error);
      }
    }
    /**
     * Get session with full wizard state
     * @param {string} sessionId - Session ID
     * @returns {Promise<Object>} Session with wizard state
     */
    async getSessionWithState(sessionId) {
      try {
        const session = await database_default.get("extractionSessions", sessionId);
        return session;
      } catch (error) {
        console.error("Error getting session with state:", error);
        return null;
      }
    }
    /**
     * End current session
     */
    async endSession() {
      if (this.currentSession) {
        this.currentSession.status = "completed";
        this.currentSession.completedAt = Date.now();
        await database_default.update("extractionSessions", this.currentSession);
        this.currentSession = null;
      }
    }
    /**
     * Record an extraction action
     */
    async recordExtraction(params) {
      var _a;
      const {
        entityType,
        action,
        // 'create' | 'update' | 'merge' | 'delete' | 'inventory_add' | 'inventory_remove' | 'stat_change'
        entityId,
        entityName,
        previousState,
        newState,
        targetActorId = null,
        targetActorName = null,
        chapterId,
        sourceContext = "",
        confidence = 1
      } = params;
      const entry = {
        id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        extractionId: ((_a = this.currentSession) == null ? void 0 : _a.id) || `standalone_${Date.now()}`,
        timestamp: Date.now(),
        chapterId,
        entityType,
        action,
        entityId,
        entityName,
        previousState: previousState ? JSON.parse(JSON.stringify(previousState)) : null,
        newState: newState ? JSON.parse(JSON.stringify(newState)) : null,
        targetActorId,
        targetActorName,
        sourceContext,
        confidence,
        reverted: false,
        revertedAt: null
      };
      await database_default.add("extractionHistory", entry);
      if (this.currentSession) {
        this.currentSession.entriesCount++;
        await database_default.update("extractionSessions", this.currentSession);
      }
      return entry;
    }
    /**
     * Get extraction history with filters
     */
    async getHistory(filters = {}) {
      const { chapterId, entityType, extractionId, limit = 100, includeReverted = false } = filters;
      let history = await database_default.getAll("extractionHistory");
      if (chapterId) {
        history = history.filter((h) => h.chapterId === chapterId);
      }
      if (entityType) {
        history = history.filter((h) => h.entityType === entityType);
      }
      if (extractionId) {
        history = history.filter((h) => h.extractionId === extractionId);
      }
      if (!includeReverted) {
        history = history.filter((h) => !h.reverted);
      }
      history.sort((a, b) => b.timestamp - a.timestamp);
      return history.slice(0, limit);
    }
    /**
     * Get all extraction sessions
     */
    async getSessions(limit = 50) {
      const sessions = await database_default.getAll("extractionSessions");
      return sessions.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
    }
    /**
     * Revert a single extraction
     */
    async revertExtraction(historyId) {
      const entry = await database_default.get("extractionHistory", historyId);
      if (!entry) {
        throw new Error("History entry not found");
      }
      if (entry.reverted) {
        throw new Error("Entry already reverted");
      }
      await this._performRevert(entry);
      entry.reverted = true;
      entry.revertedAt = Date.now();
      await database_default.update("extractionHistory", entry);
      return entry;
    }
    /**
     * Revert all extractions from a session
     */
    async revertSession(sessionId) {
      const history = await this.getHistory({ extractionId: sessionId, includeReverted: false });
      const results = [];
      for (const entry of history) {
        try {
          await this.revertExtraction(entry.id);
          results.push({ id: entry.id, success: true });
        } catch (error) {
          results.push({ id: entry.id, success: false, error: error.message });
        }
      }
      return results;
    }
    /**
     * Perform the actual revert operation
     */
    async _performRevert(entry) {
      const { entityType, action, entityId, previousState, targetActorId } = entry;
      switch (action) {
        case "create":
          await this._deleteEntity(entityType, entityId);
          break;
        case "update":
        case "merge":
          if (previousState) {
            await this._updateEntity(entityType, entityId, previousState);
          }
          break;
        case "delete":
          if (previousState) {
            await this._createEntity(entityType, previousState);
          }
          break;
        case "inventory_add":
          if (targetActorId && entityId) {
            await this._removeFromInventory(targetActorId, entityId);
          }
          break;
        case "inventory_remove":
          if (targetActorId && entityId) {
            await this._addToInventory(targetActorId, entityId);
          }
          break;
        case "stat_change":
          if (targetActorId && previousState) {
            const actor = await database_default.get("actors", targetActorId);
            if (actor) {
              actor.baseStats = previousState.baseStats || actor.baseStats;
              actor.additionalStats = previousState.additionalStats || actor.additionalStats;
              await database_default.update("actors", actor);
            }
          }
          break;
        case "skill_assign":
          if (targetActorId && entityId) {
            const actor = await database_default.get("actors", targetActorId);
            if (actor) {
              actor.activeSkills = (actor.activeSkills || []).filter((id) => id !== entityId);
              await database_default.update("actors", actor);
            }
          }
          break;
        case "location_update":
          if (targetActorId && (previousState == null ? void 0 : previousState.location)) {
            const actor = await database_default.get("actors", targetActorId);
            if (actor) {
              actor.currentLocation = previousState.location;
              await database_default.update("actors", actor);
            }
          }
          break;
        default:
          console.warn(`Unknown action type for revert: ${action}`);
      }
    }
    async _deleteEntity(entityType, entityId) {
      const storeMap = {
        "item": "itemBank",
        "skill": "skillBank",
        "actor": "actors",
        "relationship": "relationships",
        "wiki": "wikiEntries",
        "location": "wikiEntries",
        "event": "wikiEntries"
      };
      const storeName = storeMap[entityType];
      if (storeName) {
        await database_default.delete(storeName, entityId);
      }
    }
    async _updateEntity(entityType, entityId, data) {
      const storeMap = {
        "item": "itemBank",
        "skill": "skillBank",
        "actor": "actors",
        "relationship": "relationships",
        "wiki": "wikiEntries"
      };
      const storeName = storeMap[entityType];
      if (storeName) {
        await database_default.update(storeName, { ...data, id: entityId });
      }
    }
    async _createEntity(entityType, data) {
      const storeMap = {
        "item": "itemBank",
        "skill": "skillBank",
        "actor": "actors",
        "relationship": "relationships",
        "wiki": "wikiEntries"
      };
      const storeName = storeMap[entityType];
      if (storeName) {
        await database_default.add(storeName, data);
      }
    }
    async _removeFromInventory(actorId, itemId) {
      const actor = await database_default.get("actors", actorId);
      if (actor) {
        actor.inventory = (actor.inventory || []).filter((id) => id !== itemId);
        await database_default.update("actors", actor);
      }
    }
    async _addToInventory(actorId, itemId) {
      const actor = await database_default.get("actors", actorId);
      if (actor) {
        if (!actor.inventory) actor.inventory = [];
        if (!actor.inventory.includes(itemId)) {
          actor.inventory.push(itemId);
        }
        await database_default.update("actors", actor);
      }
    }
    /**
     * Get summary statistics for history
     */
    async getStats() {
      const history = await database_default.getAll("extractionHistory");
      const sessions = await database_default.getAll("extractionSessions");
      const stats = {
        totalExtractions: history.length,
        totalSessions: sessions.length,
        revertedCount: history.filter((h) => h.reverted).length,
        byEntityType: {},
        byAction: {},
        recentSessions: sessions.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5)
      };
      history.forEach((entry) => {
        stats.byEntityType[entry.entityType] = (stats.byEntityType[entry.entityType] || 0) + 1;
        stats.byAction[entry.action] = (stats.byAction[entry.action] || 0) + 1;
      });
      return stats;
    }
    /**
     * Clear old history entries (older than specified days)
     */
    async clearOldHistory(daysOld = 30) {
      const cutoff = Date.now() - daysOld * 24 * 60 * 60 * 1e3;
      const history = await database_default.getAll("extractionHistory");
      const toDelete = history.filter((h) => h.timestamp < cutoff && h.reverted);
      for (const entry of toDelete) {
        await database_default.delete("extractionHistory", entry.id);
      }
      return toDelete.length;
    }
  };
  var extractionHistoryService = new ExtractionHistoryService();
  var extractionHistoryService_default = extractionHistoryService;

  // src/services/backgroundNotificationService.js
  var BackgroundNotificationService = class {
    constructor() {
      this.permission = null;
      this.checkPermission();
    }
    /**
     * Check notification permission
     */
    async checkPermission() {
      if ("Notification" in window) {
        this.permission = Notification.permission;
      }
    }
    /**
     * Request notification permission
     * @returns {Promise<string>} Permission status
     */
    async requestPermission() {
      if (!("Notification" in window)) {
        return "unsupported";
      }
      if (Notification.permission === "default") {
        this.permission = await Notification.requestPermission();
      } else {
        this.permission = Notification.permission;
      }
      return this.permission;
    }
    /**
     * Show notification
     * @param {string} title - Notification title
     * @param {Object} options - Notification options
     * @param {Function} onClick - Click handler
     * @returns {Notification|null} Notification object or null
     */
    showNotification(title, options = {}, onClick = null) {
      if (!("Notification" in window)) {
        console.warn("Notifications not supported");
        return null;
      }
      if (Notification.permission !== "granted") {
        this.requestPermission().then((permission) => {
          if (permission === "granted") {
            this.showNotification(title, options, onClick);
          }
        });
        return null;
      }
      const notification = new Notification(title, {
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: options.tag || "manuscript-intelligence",
        requireInteraction: options.requireInteraction || false,
        ...options
      });
      if (onClick) {
        notification.onclick = (event) => {
          event.preventDefault();
          window.focus();
          onClick(event);
          notification.close();
        };
      } else {
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      }
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 5e3);
      }
      return notification;
    }
    /**
     * Show processing complete notification
     * @param {string} sessionId - Session ID
     * @param {number} suggestionCount - Number of suggestions found
     * @param {Function} onClick - Click handler to restore view
     */
    showProcessingComplete(sessionId, suggestionCount, onClick = null) {
      return this.showNotification(
        "Manuscript Intelligence: Processing Complete!",
        {
          body: `Found ${suggestionCount} suggestions. Click to review.`,
          tag: `manuscript-${sessionId}`,
          requireInteraction: true
        },
        onClick
      );
    }
    /**
     * Show processing progress notification
     * @param {string} sessionId - Session ID
     * @param {number} progress - Progress percentage
     * @param {string} status - Status message
     */
    showProcessingProgress(sessionId, progress, status) {
      if (progress % 25 !== 0 && progress !== 100) {
        return null;
      }
      return this.showNotification(
        "Manuscript Intelligence: Processing...",
        {
          body: `${status} (${progress}%)`,
          tag: `manuscript-${sessionId}-progress`,
          requireInteraction: false
        }
      );
    }
    /**
     * Show processing error notification
     * @param {string} sessionId - Session ID
     * @param {string} error - Error message
     */
    showProcessingError(sessionId, error) {
      return this.showNotification(
        "Manuscript Intelligence: Processing Failed",
        {
          body: error,
          tag: `manuscript-${sessionId}-error`,
          requireInteraction: true
        }
      );
    }
    /**
     * Close all notifications for a session
     * @param {string} sessionId - Session ID
     */
    closeSessionNotifications(sessionId) {
    }
  };
  var backgroundNotificationService = new BackgroundNotificationService();
  var backgroundNotificationService_default = backgroundNotificationService;

  // src/services/manuscriptProcessingService.js
  var ManuscriptProcessingService = class {
    constructor() {
      this.activeProcesses = /* @__PURE__ */ new Map();
      this.eventListeners = /* @__PURE__ */ new Map();
      this.checkpointInterval = null;
    }
    /**
     * Start background processing
     * @param {string} sessionId - Session ID
     * @param {string} docText - Document text to process
     * @param {Object} worldState - World state
     * @param {Object} options - Processing options
     * @returns {Promise<void>}
     */
    async startBackgroundProcessing(sessionId, docText, worldState, options = {}) {
      const {
        buzzWords = [],
        onProgress = null,
        useCompleteDocument = false
      } = options;
      if (this.activeProcesses.has(sessionId)) {
        throw new Error(`Session ${sessionId} is already processing`);
      }
      const processInfo = {
        sessionId,
        status: "processing",
        progress: { current: 0, status: "Initializing...", liveSuggestions: [] },
        startTime: Date.now(),
        lastCheckpoint: 0,
        checkpoint: null,
        error: null
      };
      this.activeProcesses.set(sessionId, processInfo);
      try {
        const session = await extractionHistoryService_default.getSession(sessionId);
        if (session) {
          session.status = "processing";
          session.processingStartTime = Date.now();
          await database_default.update("extractionSessions", session);
        }
      } catch (error) {
        console.warn("Error updating session status:", error);
      }
      this._processInBackground(sessionId, docText, worldState, {
        buzzWords,
        onProgress,
        useCompleteDocument
      }).catch((error) => {
        console.error("Background processing error:", error);
        processInfo.status = "failed";
        processInfo.error = error.message;
        this._emitEvent(sessionId, "error", { error: error.message });
        this.activeProcesses.delete(sessionId);
      });
      return processInfo;
    }
    /**
     * Process in background (async, doesn't block)
     */
    async _processInBackground(sessionId, docText, worldState, options) {
      var _a;
      const processInfo = this.activeProcesses.get(sessionId);
      if (!processInfo) return;
      try {
        const { buzzWords, onProgress, useCompleteDocument } = options;
        const saveCheckpoint = async (progress, checkpointData) => {
          if (progress.current - processInfo.lastCheckpoint >= 10) {
            processInfo.lastCheckpoint = progress.current;
            processInfo.checkpoint = {
              progress,
              data: checkpointData,
              timestamp: Date.now()
            };
            try {
              const session = await extractionHistoryService_default.getSession(sessionId);
              if (session) {
                session.processingCheckpoint = processInfo.checkpoint;
                await database_default.update("extractionSessions", session);
              }
            } catch (error) {
              console.warn("Error saving checkpoint:", error);
            }
          }
        };
        const progressCallback = (progress) => {
          processInfo.progress = progress;
          this._emitEvent(sessionId, "progress", progress);
          if (onProgress) {
            onProgress(progress);
          }
          saveCheckpoint(progress, null);
          if (progress.current % 25 === 0 || progress.current === 100) {
            backgroundNotificationService_default.showProcessingProgress(
              sessionId,
              progress.current,
              progress.status
            );
          }
        };
        let result;
        if (useCompleteDocument) {
          result = await manuscriptIntelligenceService_default.processCompleteDocument(
            docText,
            worldState,
            progressCallback,
            sessionId
          );
        } else {
          result = await aiService_default.processManuscriptIntelligence(
            docText,
            worldState,
            buzzWords,
            progressCallback
          );
        }
        processInfo.status = "completed";
        processInfo.progress = { current: 100, status: "Complete!", liveSuggestions: result.suggestions || [] };
        try {
          const session = await extractionHistoryService_default.getSession(sessionId);
          if (session) {
            session.status = "completed";
            session.processingEndTime = Date.now();
            session.extractionResults = result;
            if (result.suggestions) {
              await extractionHistoryService_default.saveSuggestions(sessionId, result.suggestions);
            }
            await database_default.update("extractionSessions", session);
          }
        } catch (error) {
          console.warn("Error saving final results:", error);
        }
        this._emitEvent(sessionId, "complete", result);
        this.activeProcesses.delete(sessionId);
        this._sendNotification(sessionId, "Processing complete!", {
          body: `Found ${((_a = result.suggestions) == null ? void 0 : _a.length) || 0} suggestions`,
          tag: `manuscript-${sessionId}`
        });
      } catch (error) {
        processInfo.status = "failed";
        processInfo.error = error.message;
        this._emitEvent(sessionId, "error", { error: error.message });
        try {
          const session = await extractionHistoryService_default.getSession(sessionId);
          if (session) {
            session.status = "failed";
            session.error = error.message;
            await database_default.update("extractionSessions", session);
          }
        } catch (e) {
          console.warn("Error updating failed session:", e);
        }
        this.activeProcesses.delete(sessionId);
        throw error;
      }
    }
    /**
     * Get processing status
     * @param {string} sessionId - Session ID
     * @returns {Object|null} Process info or null
     */
    getProcessingStatus(sessionId) {
      return this.activeProcesses.get(sessionId) || null;
    }
    /**
     * Pause processing (not fully implemented - would require worker)
     * @param {string} sessionId - Session ID
     */
    async pauseProcessing(sessionId) {
      const processInfo = this.activeProcesses.get(sessionId);
      if (!processInfo) {
        throw new Error(`No active process for session ${sessionId}`);
      }
      processInfo.status = "paused";
      try {
        const session = await extractionHistoryService_default.getSession(sessionId);
        if (session) {
          session.status = "paused";
          await database_default.update("extractionSessions", session);
        }
      } catch (error) {
        console.warn("Error pausing session:", error);
      }
      this._emitEvent(sessionId, "paused", null);
    }
    /**
     * Resume processing from checkpoint
     * @param {string} sessionId - Session ID
     * @param {string} docText - Document text
     * @param {Object} worldState - World state
     * @param {Object} options - Processing options
     */
    async resumeProcessing(sessionId, docText, worldState, options = {}) {
      try {
        const session = await extractionHistoryService_default.getSession(sessionId);
        if (session == null ? void 0 : session.processingCheckpoint) {
          const checkpoint = session.processingCheckpoint;
          options.startFromCheckpoint = checkpoint;
        }
      } catch (error) {
        console.warn("Error loading checkpoint:", error);
      }
      return this.startBackgroundProcessing(sessionId, docText, worldState, options);
    }
    /**
     * Cancel processing
     * @param {string} sessionId - Session ID
     */
    async cancelProcessing(sessionId) {
      const processInfo = this.activeProcesses.get(sessionId);
      if (!processInfo) {
        return;
      }
      processInfo.status = "cancelled";
      try {
        const session = await extractionHistoryService_default.getSession(sessionId);
        if (session) {
          session.status = "cancelled";
          await database_default.update("extractionSessions", session);
        }
      } catch (error) {
        console.warn("Error cancelling session:", error);
      }
      this.activeProcesses.delete(sessionId);
      this._emitEvent(sessionId, "cancelled", null);
    }
    /**
     * Add event listener for processing events
     * @param {string} sessionId - Session ID
     * @param {Function} listener - Event listener function
     */
    addEventListener(sessionId, listener) {
      if (!this.eventListeners.has(sessionId)) {
        this.eventListeners.set(sessionId, /* @__PURE__ */ new Set());
      }
      this.eventListeners.get(sessionId).add(listener);
    }
    /**
     * Remove event listener
     * @param {string} sessionId - Session ID
     * @param {Function} listener - Event listener function
     */
    removeEventListener(sessionId, listener) {
      const listeners = this.eventListeners.get(sessionId);
      if (listeners) {
        listeners.delete(listener);
      }
    }
    /**
     * Emit event to all listeners
     * @param {string} sessionId - Session ID
     * @param {string} eventType - Event type
     * @param {*} data - Event data
     */
    _emitEvent(sessionId, eventType, data) {
      const listeners = this.eventListeners.get(sessionId);
      if (listeners) {
        listeners.forEach((listener) => {
          try {
            listener({ type: eventType, data, sessionId });
          } catch (error) {
            console.error("Error in event listener:", error);
          }
        });
      }
    }
    /**
     * Get all active processing sessions
     * @returns {Array} Array of active process info
     */
    getActiveProcesses() {
      return Array.from(this.activeProcesses.values());
    }
    /**
     * Restore processing sessions from database on app start
     */
    async restoreActiveSessions() {
      try {
        const sessions = await database_default.getAll("extractionSessions");
        const activeSessions = sessions.filter(
          (s) => s.status === "processing" || s.status === "paused"
        );
        for (const session of activeSessions) {
          session.status = "paused";
          await database_default.update("extractionSessions", session);
        }
        return activeSessions;
      } catch (error) {
        console.error("Error restoring active sessions:", error);
        return [];
      }
    }
  };
  var manuscriptProcessingService = new ManuscriptProcessingService();
  var manuscriptProcessingService_default = manuscriptProcessingService;

  // src/entry.js
  init_chapterDataExtractionService();
  init_chapterContextService();

  // src/services/chapterOverviewService.js
  init_contextEngine();
  init_aiService();
  init_promptTemplates();
  init_database();
  var ChapterOverviewService = class {
    /**
     * Generate an overview for a chapter
     */
    async generateOverview(chapterText, chapterNumber, bookId, existingCharacters = []) {
      try {
        const characterNames = existingCharacters.map((c) => c.name).join(", ") || "No existing characters";
        const summaryPrompt = promptTemplates_default.chapterSummary(
          chapterText,
          chapterNumber,
          characterNames
        );
        const response = await aiService_default.callAI(summaryPrompt, "analytical");
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        return {
          chapterNumber,
          summary: response.slice(0, 1e3),
          keyEvents: [],
          characterUpdates: [],
          newElements: { characters: [], items: [], locations: [], concepts: [] },
          openThreads: [],
          generated: true
        };
      } catch (error) {
        console.error("Error generating overview:", error);
        throw error;
      }
    }
    /**
     * Save a chapter overview (draft or approved)
     */
    async saveOverview(bookId, chapterNumber, overviewData, approved = false) {
      try {
        const overview = {
          id: `overview_${bookId}_${chapterNumber}`,
          bookId,
          chapterNumber,
          ...overviewData,
          approved,
          approvedAt: approved ? Date.now() : null,
          updatedAt: Date.now()
        };
        await database_default.update("chapterOverviews", overview);
        return overview;
      } catch (error) {
        console.error("Error saving overview:", error);
        throw error;
      }
    }
    /**
     * Get overview for a chapter
     */
    async getOverview(bookId, chapterNumber) {
      try {
        return await contextEngine_default.getChapterOverview(bookId, chapterNumber);
      } catch (error) {
        console.error("Error getting overview:", error);
        return null;
      }
    }
    /**
     * Get all overviews for a book
     */
    async getAllOverviews(bookId) {
      try {
        const overviews = await database_default.getByIndex("chapterOverviews", "bookId", bookId);
        return overviews.sort((a, b) => a.chapterNumber - b.chapterNumber);
      } catch (error) {
        console.error("Error getting all overviews:", error);
        return [];
      }
    }
    /**
     * Extract entity state updates from chapter analysis
     */
    async extractEntityStates(overview, bookId, chapterNumber) {
      const states = [];
      if (overview.characterUpdates) {
        for (const update of overview.characterUpdates) {
          const actors = await database_default.getAll("actors");
          const actor = actors.find(
            (a) => {
              var _a;
              return a.name.toLowerCase() === update.character.toLowerCase() || ((_a = a.nicknames) == null ? void 0 : _a.some((n) => n.toLowerCase() === update.character.toLowerCase()));
            }
          );
          if (actor) {
            states.push({
              entityId: actor.id,
              entityType: "actor",
              stateChange: update.stateChange,
              newInfo: update.newInfo,
              extractedFrom: `Chapter ${chapterNumber}`
            });
          }
        }
      }
      return states;
    }
    /**
     * Auto-detect and complete plot beats from chapter
     */
    async detectCompletedPlotBeats(overview, chapterNumber) {
      try {
        const completedBeats = [];
        const plotBeats = await contextEngine_default.getPlotBeats();
        if (overview.plotBeatsAdvanced) {
          for (const advancedBeat of overview.plotBeatsAdvanced) {
            const matchingBeat = plotBeats.find(
              (b) => !b.completed && (b.beat.toLowerCase().includes(advancedBeat.toLowerCase()) || advancedBeat.toLowerCase().includes(b.beat.toLowerCase()))
            );
            if (matchingBeat) {
              completedBeats.push(matchingBeat);
            }
          }
        }
        return completedBeats;
      } catch (error) {
        console.error("Error detecting completed beats:", error);
        return [];
      }
    }
    /**
     * Process chapter after save - generate overview, detect beats, update states
     */
    async processChapterAfterSave(chapterText, chapterNumber, bookId, existingCharacters) {
      const results = {
        overview: null,
        completedBeats: [],
        entityStates: [],
        errors: []
      };
      try {
        results.overview = await this.generateOverview(
          chapterText,
          chapterNumber,
          bookId,
          existingCharacters
        );
        results.completedBeats = await this.detectCompletedPlotBeats(
          results.overview,
          chapterNumber
        );
        results.entityStates = await this.extractEntityStates(
          results.overview,
          bookId,
          chapterNumber
        );
      } catch (error) {
        console.error("Error processing chapter:", error);
        results.errors.push(error.message);
      }
      return results;
    }
    /**
     * Check if style review should be triggered
     */
    async shouldTriggerStyleReview(chapterNumber) {
      return await contextEngine_default.shouldTriggerStyleReview(chapterNumber);
    }
    /**
     * Get recent chapter texts for style review
     */
    async getRecentChaptersForStyleReview(bookId, currentChapter, count = 5) {
      const chapters = [];
      try {
        const book = await database_default.get("books", bookId);
        if (book && book.chapters) {
          const startChapter = Math.max(1, currentChapter - count + 1);
          for (let i = startChapter; i <= currentChapter; i++) {
            const chapter = book.chapters.find(
              (c) => c.number === i || c.id === `ch_${i}`
            );
            if (chapter == null ? void 0 : chapter.content) {
              chapters.push(chapter.content);
            }
          }
        }
      } catch (error) {
        console.error("Error getting recent chapters:", error);
      }
      return chapters;
    }
  };
  var chapterOverviewService = new ChapterOverviewService();
  var chapterOverviewService_default = chapterOverviewService;

  // src/services/chapterNavigationService.js
  var ChapterNavigationService = class {
    constructor() {
      this.navigationCallback = null;
    }
    /**
     * Set the navigation callback function
     * This should be set by App.js to handle actual navigation
     * @param {Function} callback - Function that takes (bookId, chapterId) and navigates
     */
    setNavigationCallback(callback) {
      this.navigationCallback = callback;
    }
    /**
     * Navigate to a specific chapter
     * @param {number|string} bookId - Book ID
     * @param {number|string} chapterId - Chapter ID
     * @param {Object} options - Additional options
     * @param {Function} options.onNavigate - Optional callback after navigation
     */
    navigateToChapter(bookId, chapterId, options = {}) {
      if (!this.navigationCallback) {
        console.warn("[ChapterNavigation] No navigation callback set. Call setNavigationCallback() first.");
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("navigateToChapter", {
            detail: { bookId, chapterId }
          }));
        }
        return;
      }
      try {
        this.navigationCallback(bookId, chapterId);
        if (options.onNavigate) {
          options.onNavigate(bookId, chapterId);
        }
      } catch (error) {
        console.error("[ChapterNavigation] Error navigating to chapter:", error);
      }
    }
    /**
     * Navigate to a chapter by chapter number (finds first matching chapter)
     * @param {number} chapterNumber - Chapter number
     * @param {number} bookId - Optional book ID to limit search
     */
    async navigateToChapterByNumber(chapterNumber, bookId = null) {
      try {
        const db2 = (await Promise.resolve().then(() => (init_database(), database_exports))).default;
        const books = bookId ? [await db2.get("books", bookId)].filter(Boolean) : await db2.getAll("books");
        for (const book of books) {
          if (!book.chapters) continue;
          const chapter = book.chapters.find(
            (ch) => ch.number === chapterNumber || ch.id === chapterNumber
          );
          if (chapter) {
            this.navigateToChapter(book.id, chapter.id);
            return;
          }
        }
        console.warn(`[ChapterNavigation] Chapter ${chapterNumber} not found`);
      } catch (error) {
        console.error("[ChapterNavigation] Error finding chapter by number:", error);
      }
    }
    /**
     * Get chapter URL or identifier for display
     * @param {number|string} bookId - Book ID
     * @param {number|string} chapterId - Chapter ID
     * @returns {string} Display string
     */
    getChapterLabel(bookId, chapterId) {
      return `Book ${bookId}, Chapter ${chapterId}`;
    }
  };
  var chapterNavigationService = new ChapterNavigationService();
  var chapterNavigationService_default = chapterNavigationService;

  // src/services/chapterMemoryService.js
  init_aiService();
  init_database();
  var MEMORY_STORE = "chapterMemories";
  var ChapterMemoryService = class {
    constructor() {
      this.generating = /* @__PURE__ */ new Set();
    }
    /**
     * Generate a compressed memory for a chapter.
     * Called automatically when a chapter is saved.
     */
    async generateMemory(chapterId, chapterText, chapterNumber, bookId, actors = []) {
      const key = `${bookId}_${chapterNumber}`;
      if (this.generating.has(key)) return null;
      this.generating.add(key);
      try {
        if (!chapterText || chapterText.trim().length < 100) return null;
        const characterNames = actors.map((a) => a.name).join(", ");
        const prompt = `Compress this chapter into a concise memory document for a writing assistant. This memory will be used as context when writing FUTURE chapters, so focus on what matters going forward.

CHAPTER ${chapterNumber}:
"""
${chapterText.slice(0, 6e3)}${chapterText.length > 6e3 ? "\n[...chapter continues...]" : ""}
"""

Characters in the story: ${characterNames || "Not specified"}

Return a JSON object:
{
  "summary": "2-3 sentence summary of what happened (max 60 words)",
  "characters": [
    {
      "name": "Character Name",
      "status": "What state they're in at chapter end (emotional, physical, relational)",
      "changed": "How they changed during this chapter (null if unchanged)"
    }
  ],
  "setups": ["Things set up that haven't paid off yet (Chekhov's guns)"],
  "tensions": ["Unresolved conflicts or questions"],
  "decisions": ["Key decisions characters made and their immediate consequences"],
  "worldChanges": ["Any changes to the world/setting/rules"],
  "endingState": "The emotional/narrative state at chapter end (tense, resolved, cliffhanger, etc.)",
  "forwardHooks": ["What the reader is wondering/anticipating after this chapter"]
}`;
        const response = await aiService_default.callAI(prompt, "analytical");
        let memory = null;
        try {
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            memory = JSON.parse(jsonMatch[0]);
          }
        } catch (_) {
        }
        if (!memory) {
          memory = {
            summary: response.slice(0, 200),
            characters: [],
            setups: [],
            tensions: [],
            decisions: [],
            worldChanges: [],
            endingState: "unknown",
            forwardHooks: []
          };
        }
        const record = {
          id: `memory_${bookId}_ch${chapterNumber}`,
          bookId,
          chapterId,
          chapterNumber,
          ...memory,
          wordCount: chapterText.split(/\s+/).length,
          generatedAt: Date.now()
        };
        await this._saveMemory(record);
        return record;
      } catch (error) {
        console.warn("[ChapterMemory] Failed to generate memory:", error);
        return null;
      } finally {
        this.generating.delete(key);
      }
    }
    /**
     * Get the memory for a specific chapter.
     */
    async getMemory(bookId, chapterNumber) {
      try {
        const id = `memory_${bookId}_ch${chapterNumber}`;
        return await database_default.get(MEMORY_STORE, id);
      } catch (_) {
        return null;
      }
    }
    /**
     * Get all memories for a book, ordered by chapter number.
     */
    async getAllMemories(bookId) {
      try {
        const all = await database_default.getAll(MEMORY_STORE);
        return all.filter((m) => m.bookId === bookId).sort((a, b) => a.chapterNumber - b.chapterNumber);
      } catch (_) {
        return [];
      }
    }
    /**
     * Build a compressed "story so far" from all chapter memories.
     * This is what feeds into AI context — a tight summary of the entire story.
     *
     * @param {string} bookId
     * @param {number} upToChapter - only include chapters up to this number
     * @param {number} maxChars - character budget for the output
     * @returns {string} compressed story context
     */
    async buildStorySoFar(bookId, upToChapter = Infinity, maxChars = 3e3) {
      var _a, _b, _c;
      const memories = await this.getAllMemories(bookId);
      const relevant = memories.filter((m) => m.chapterNumber < upToChapter);
      if (relevant.length === 0) return "";
      const parts = ["=== STORY SO FAR (compressed chapter memories) ===\n"];
      let charCount = parts[0].length;
      const allSetups = [];
      const allTensions = [];
      for (const mem of relevant) {
        const chLine = `Ch ${mem.chapterNumber}: ${mem.summary}`;
        if (charCount + chLine.length < maxChars * 0.6) {
          parts.push(chLine);
          charCount += chLine.length;
        }
        if (mem.setups) allSetups.push(...mem.setups);
        if (mem.tensions) allTensions.push(...mem.tensions);
      }
      const lastMem = relevant[relevant.length - 1];
      if (lastMem) {
        parts.push(`
--- LAST CHAPTER (Ch ${lastMem.chapterNumber}) STATE ---`);
        parts.push(`Ending: ${lastMem.endingState || "unknown"}`);
        if (((_a = lastMem.characters) == null ? void 0 : _a.length) > 0) {
          parts.push("Character states:");
          for (const ch of lastMem.characters) {
            parts.push(`  ${ch.name}: ${ch.status}${ch.changed ? ` (changed: ${ch.changed})` : ""}`);
          }
        }
        if (((_b = lastMem.decisions) == null ? void 0 : _b.length) > 0) {
          parts.push("Key decisions: " + lastMem.decisions.join("; "));
        }
        if (((_c = lastMem.forwardHooks) == null ? void 0 : _c.length) > 0) {
          parts.push("Reader is expecting: " + lastMem.forwardHooks.join("; "));
        }
      }
      const unresolvedSetups = this._deduplicateList(allSetups);
      const unresolvedTensions = this._deduplicateList(allTensions);
      if (unresolvedSetups.length > 0) {
        parts.push(`
UNRESOLVED SETUPS (Chekhov's guns): ${unresolvedSetups.slice(0, 8).join("; ")}`);
      }
      if (unresolvedTensions.length > 0) {
        parts.push(`ACTIVE TENSIONS: ${unresolvedTensions.slice(0, 8).join("; ")}`);
      }
      return parts.join("\n");
    }
    /**
     * Get the most recent chapter's character states.
     * Useful for ensuring character consistency.
     */
    async getLatestCharacterStates(bookId, upToChapter = Infinity) {
      const memories = await this.getAllMemories(bookId);
      const relevant = memories.filter((m) => m.chapterNumber < upToChapter);
      const states = {};
      for (const mem of relevant) {
        if (!mem.characters) continue;
        for (const ch of mem.characters) {
          states[ch.name] = {
            ...ch,
            lastSeenChapter: mem.chapterNumber
          };
        }
      }
      return states;
    }
    /**
     * Delete a memory (e.g. when a chapter is significantly rewritten).
     */
    async deleteMemory(bookId, chapterNumber) {
      try {
        const id = `memory_${bookId}_ch${chapterNumber}`;
        await database_default.delete(MEMORY_STORE, id);
      } catch (_) {
      }
    }
    // --- Internal ---
    async _saveMemory(record) {
      try {
        await database_default.update(MEMORY_STORE, record);
      } catch (error) {
        try {
          await database_default.add(MEMORY_STORE, record);
        } catch (_) {
          console.warn("[ChapterMemory] Could not save memory:", error);
        }
      }
    }
    _deduplicateList(items) {
      const seen = /* @__PURE__ */ new Set();
      return items.filter((item) => {
        const key = item.toLowerCase().trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
  };
  var chapterMemoryService = new ChapterMemoryService();
  var chapterMemoryService_default = chapterMemoryService;

  // src/services/canonExtractionPipeline.js
  init_aiService();
  init_database();

  // src/services/entityMatchingService.js
  var EntityMatchingService = class {
    /**
     * Calculate similarity between two strings (0-1)
     */
    calculateSimilarity(str1, str2) {
      if (!str1 || !str2) return 0;
      const s1 = str1.toLowerCase().trim();
      const s2 = str2.toLowerCase().trim();
      if (s1 === s2) return 1;
      if (s1.includes(s2) || s2.includes(s1)) return 0.9;
      const maxLen = Math.max(s1.length, s2.length);
      if (maxLen === 0) return 1;
      const distance = this.levenshteinDistance(s1, s2);
      return 1 - distance / maxLen;
    }
    /**
     * Calculate Levenshtein distance between two strings
     */
    levenshteinDistance(str1, str2) {
      const matrix = [];
      const len1 = str1.length;
      const len2 = str2.length;
      for (let i = 0; i <= len1; i++) {
        matrix[i] = [i];
      }
      for (let j = 0; j <= len2; j++) {
        matrix[0][j] = j;
      }
      for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
          if (str1[i - 1] === str2[j - 1]) {
            matrix[i][j] = matrix[i - 1][j - 1];
          } else {
            matrix[i][j] = Math.min(
              matrix[i - 1][j - 1] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j] + 1
            );
          }
        }
      }
      return matrix[len1][len2];
    }
    /**
     * Find best matching actor
     */
    findMatchingActor(entityName, actors, threshold = 0.7) {
      var _a;
      if (!entityName || !actors || actors.length === 0) return null;
      let bestMatch = null;
      let bestScore = threshold;
      for (const actor of actors) {
        if (((_a = actor.name) == null ? void 0 : _a.toLowerCase()) === entityName.toLowerCase()) {
          return { actor, confidence: 1, matchType: "exact" };
        }
        if (actor.nicknames && Array.isArray(actor.nicknames)) {
          for (const nickname of actor.nicknames) {
            if (nickname.toLowerCase() === entityName.toLowerCase()) {
              return { actor, confidence: 0.95, matchType: "nickname" };
            }
          }
        }
        const score = this.calculateSimilarity(entityName, actor.name);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = { actor, confidence: score, matchType: "fuzzy" };
        }
      }
      return bestMatch;
    }
    /**
     * Find best matching item
     */
    findMatchingItem(entityName, items, threshold = 0.7) {
      var _a;
      if (!entityName || !items || items.length === 0) return null;
      let bestMatch = null;
      let bestScore = threshold;
      for (const item of items) {
        if (((_a = item.name) == null ? void 0 : _a.toLowerCase()) === entityName.toLowerCase()) {
          return { item, confidence: 1, matchType: "exact" };
        }
        const score = this.calculateSimilarity(entityName, item.name);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = { item, confidence: score, matchType: "fuzzy" };
        }
      }
      return bestMatch;
    }
    /**
     * Find best matching skill
     */
    findMatchingSkill(entityName, skills, threshold = 0.7) {
      var _a;
      if (!entityName || !skills || skills.length === 0) return null;
      let bestMatch = null;
      let bestScore = threshold;
      for (const skill of skills) {
        if (((_a = skill.name) == null ? void 0 : _a.toLowerCase()) === entityName.toLowerCase()) {
          return { skill, confidence: 1, matchType: "exact" };
        }
        const score = this.calculateSimilarity(entityName, skill.name);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = { skill, confidence: score, matchType: "fuzzy" };
        }
      }
      return bestMatch;
    }
    /**
     * Find matching stat by key
     */
    findMatchingStat(statKey, stats, threshold = 0.8) {
      var _a;
      if (!statKey || !stats || stats.length === 0) return null;
      const normalizedKey = statKey.toUpperCase().trim();
      for (const stat of stats) {
        if (((_a = stat.key) == null ? void 0 : _a.toUpperCase()) === normalizedKey) {
          return { stat, confidence: 1, matchType: "exact" };
        }
      }
      return null;
    }
    /**
     * Match an entity to existing entities
     * @param {Object} entity - Entity to match {name, type, description}
     * @param {Object} worldState - {actors, items, skills, statRegistry}
     * @returns {Object|null} - {matchedEntity, confidence, matchType, entityType}
     */
    matchEntity(entity, worldState) {
      if (!entity || !entity.name || !entity.type) return null;
      const { actors = [], items = [], skills = [], statRegistry = [] } = worldState;
      const entityName = entity.name.trim();
      switch (entity.type.toLowerCase()) {
        case "actor":
        case "character":
          const actorMatch = this.findMatchingActor(entityName, actors);
          if (actorMatch) {
            return {
              ...actorMatch,
              entityType: "actor",
              matchedEntity: actorMatch.actor
            };
          }
          break;
        case "item":
        case "weapon":
        case "armor":
        case "equipment":
          const itemMatch = this.findMatchingItem(entityName, items);
          if (itemMatch) {
            return {
              ...itemMatch,
              entityType: "item",
              matchedEntity: itemMatch.item
            };
          }
          break;
        case "skill":
        case "ability":
        case "power":
          const skillMatch = this.findMatchingSkill(entityName, skills);
          if (skillMatch) {
            return {
              ...skillMatch,
              entityType: "skill",
              matchedEntity: skillMatch.skill
            };
          }
          break;
        case "stat":
          const statMatch = this.findMatchingStat(entityName, statRegistry);
          if (statMatch) {
            return {
              ...statMatch,
              entityType: "stat",
              matchedEntity: statMatch.stat
            };
          }
          break;
      }
      return null;
    }
    /**
     * Detect if an entity represents an upgrade to an existing entity
     * @param {Object} entity - New entity data
     * @param {Object} existingEntity - Existing entity
     * @returns {Object|null} - Upgrade changes or null
     */
    detectUpgrade(entity, existingEntity) {
      if (!entity || !existingEntity) return null;
      const changes = {};
      let hasChanges = false;
      if (entity.stats && existingEntity.stats) {
        const statChanges = {};
        for (const [stat, value] of Object.entries(entity.stats)) {
          const existingValue = existingEntity.stats[stat] || 0;
          if (value !== existingValue) {
            statChanges[stat] = value - existingValue;
            hasChanges = true;
          }
        }
        if (Object.keys(statChanges).length > 0) {
          changes.stats = statChanges;
        }
      }
      if (entity.description && existingEntity.desc && entity.description.toLowerCase() !== existingEntity.desc.toLowerCase()) {
        changes.description = entity.description;
        hasChanges = true;
      }
      if (entity.type && existingEntity.type && entity.type !== existingEntity.type) {
        changes.type = entity.type;
        hasChanges = true;
      }
      if (entity.rarity && existingEntity.rarity && entity.rarity !== existingEntity.rarity) {
        changes.rarity = entity.rarity;
        hasChanges = true;
      }
      if (entity.tier && existingEntity.tier && entity.tier !== existingEntity.tier) {
        changes.tier = entity.tier;
        hasChanges = true;
      }
      return hasChanges ? changes : null;
    }
  };
  var entityMatchingService_default = new EntityMatchingService();

  // src/services/narrativeReviewQueueService.js
  init_database();

  // src/services/confidencePolicyService.js
  init_database();
  var DEFAULT_THRESHOLDS = {
    red_block: 0.5,
    amber_review: 0.7,
    normal_review: 0.9
  };
  var DEFAULT_SETTINGS = {
    id: "confidence_policy",
    thresholds: { ...DEFAULT_THRESHOLDS },
    autoApplyHighConfidence: true,
    autoApplyMinConfidence: 0.9,
    showExplanations: true
  };
  var BAND_META = {
    red_block: {
      label: "Red Block",
      color: "#ef4444",
      description: "Must resolve manually \u2014 cannot auto-apply",
      blocking: true,
      requiresAction: true
    },
    amber_review: {
      label: "Amber Review",
      color: "#f59e0b",
      description: "Manual review required",
      blocking: false,
      requiresAction: true
    },
    normal_review: {
      label: "Normal Review",
      color: "#3b82f6",
      description: "Standard review queue item",
      blocking: false,
      requiresAction: true
    },
    high_confidence: {
      label: "High Confidence",
      color: "#22c55e",
      description: "Can be auto-applied if enabled",
      blocking: false,
      requiresAction: false
    }
  };
  var ConfidencePolicyService = class {
    constructor() {
      this._settings = null;
    }
    async getSettings() {
      if (this._settings) return this._settings;
      try {
        const stored = await database_default.get("canonSettings", "confidence_policy");
        this._settings = stored || { ...DEFAULT_SETTINGS };
      } catch {
        this._settings = { ...DEFAULT_SETTINGS };
      }
      return this._settings;
    }
    async updateSettings(updates) {
      const current = await this.getSettings();
      const updated = { ...current, ...updates };
      const t = updated.thresholds;
      if (t.red_block >= t.amber_review || t.amber_review >= t.normal_review) {
        throw new Error("Thresholds must be ordered: red_block < amber_review < normal_review");
      }
      if (t.red_block < 0 || t.normal_review > 1) {
        throw new Error("Thresholds must be between 0 and 1");
      }
      await database_default.update("canonSettings", updated);
      this._settings = updated;
      return updated;
    }
    async resetToDefaults() {
      this._settings = null;
      await database_default.update("canonSettings", { ...DEFAULT_SETTINGS });
      return DEFAULT_SETTINGS;
    }
    // ─── Classification ────────────────────────────────────────
    async classify(confidence) {
      const settings = await this.getSettings();
      return this._classifyWithThresholds(confidence, settings.thresholds);
    }
    _classifyWithThresholds(confidence, thresholds) {
      const score = Number(confidence) || 0;
      if (score < thresholds.red_block) return "red_block";
      if (score < thresholds.amber_review) return "amber_review";
      if (score < thresholds.normal_review) return "normal_review";
      return "high_confidence";
    }
    async classifyBatch(items) {
      const settings = await this.getSettings();
      return items.map((item) => ({
        ...item,
        confidenceBand: this._classifyWithThresholds(item.confidence, settings.thresholds)
      }));
    }
    // ─── Auto-Apply Logic ─────────────────────────────────────
    async shouldAutoApply(confidence) {
      const settings = await this.getSettings();
      if (!settings.autoApplyHighConfidence) return false;
      return confidence >= settings.autoApplyMinConfidence;
    }
    async getAutoApplyItems(queueItems) {
      const settings = await this.getSettings();
      if (!settings.autoApplyHighConfidence) return [];
      return queueItems.filter(
        (item) => item.confidence >= settings.autoApplyMinConfidence && item.status === "pending" && item.confidenceBand === "high_confidence"
      );
    }
    // ─── Blocking Logic ────────────────────────────────────────
    isBlocking(confidenceBand) {
      return confidenceBand === "red_block";
    }
    getBlockingItems(queueItems) {
      return queueItems.filter(
        (item) => item.blocking === true || item.confidenceBand === "red_block"
      );
    }
    // ─── Explanation Helpers ───────────────────────────────────
    generateExplanation(confidence, domain, operation, context = {}) {
      const band = this._classifyWithThresholds(confidence, DEFAULT_THRESHOLDS);
      const reasons = [];
      if (confidence < 0.3) {
        reasons.push("Very low extraction confidence \u2014 may be a misinterpretation");
      } else if (confidence < 0.5) {
        reasons.push("Low confidence \u2014 entity reference is ambiguous or incomplete");
      }
      if (operation === "merge") {
        reasons.push("Merge operations require careful review to avoid data loss");
      }
      if (operation === "delete") {
        reasons.push("Deletion is destructive and affects downstream references");
      }
      if (operation === "conflict") {
        reasons.push("Conflicts with existing canon data detected");
      }
      if (context.isAmbiguous) {
        reasons.push(`Multiple possible matches found for "${context.entityLabel || "entity"}"`);
      }
      if (context.hasRetroImpact) {
        reasons.push("This change has downstream impact on later chapters");
      }
      if (context.isNewEntity && confidence < 0.7) {
        reasons.push("New entity with uncertain identification");
      }
      if (reasons.length === 0) {
        if (band === "high_confidence") {
          reasons.push("Strong match with existing canon \u2014 high extraction confidence");
        } else {
          reasons.push("Standard extraction confidence \u2014 review recommended");
        }
      }
      return {
        band,
        reasons,
        summary: reasons[0],
        detailed: reasons.join(". ")
      };
    }
    // ─── Band Metadata ─────────────────────────────────────────
    getBandMeta(band) {
      return BAND_META[band] || BAND_META.normal_review;
    }
    getAllBands() {
      return { ...BAND_META };
    }
    getThresholdBoundaries() {
      return { ...DEFAULT_THRESHOLDS };
    }
  };
  var confidencePolicyService_default = new ConfidencePolicyService();

  // src/services/narrativeReviewQueueService.js
  var NarrativeReviewQueueService = class {
    constructor() {
      this._listeners = /* @__PURE__ */ new Set();
      this._undoStack = [];
      this._maxUndoDepth = 50;
    }
    // ─── Queue Item Creation ───────────────────────────────────
    createQueueItem({
      sessionId,
      chapterId,
      chapterNumber,
      domain,
      operation,
      targetEntityId,
      targetEntityLabel,
      newOrExisting,
      source,
      confidence,
      confidenceReason,
      suggestions,
      disambiguationOptions,
      lastMention,
      blocking
    }) {
      const now = Date.now();
      const band = confidencePolicyService_default._classifyWithThresholds(
        confidence,
        confidencePolicyService_default.getThresholdBoundaries()
      );
      const isBlocking = blocking != null ? blocking : band === "red_block" || domain === "retro_impact";
      return {
        id: `qn_${sessionId}_${domain}_${now}_${Math.random().toString(36).slice(2, 8)}`,
        sessionId,
        chapterId,
        chapterNumber,
        domain,
        operation,
        targetEntityId: targetEntityId || null,
        targetEntityLabel: targetEntityLabel || null,
        newOrExisting: newOrExisting || "ambiguous",
        source: source || { lineStart: 0, lineEnd: 0, snippet: "", chapterRef: "" },
        confidence: Number(confidence) || 0,
        confidenceBand: band,
        confidenceReason: confidenceReason || "",
        suggestions: suggestions || { proposedNode: {} },
        disambiguationOptions: disambiguationOptions || null,
        lastMention: lastMention || null,
        blocking: isBlocking,
        status: "pending",
        createdAt: now,
        updatedAt: now
      };
    }
    // ─── Persistence ───────────────────────────────────────────
    async addItems(items) {
      var _a;
      if (!items || items.length === 0) return [];
      await database_default.batchUpsert("narrativeReviewQueue", items);
      this._emit("itemsAdded", { count: items.length, sessionId: (_a = items[0]) == null ? void 0 : _a.sessionId });
      return items;
    }
    async getSessionItems(sessionId) {
      return await database_default.getByIndex("narrativeReviewQueue", "sessionId", sessionId) || [];
    }
    async getChapterItems(chapterId) {
      return await database_default.getByIndex("narrativeReviewQueue", "chapterId", chapterId) || [];
    }
    async getPendingItems(sessionId) {
      const all = await this.getSessionItems(sessionId);
      return all.filter((item) => item.status === "pending");
    }
    async getUnresolvedCount(sessionId) {
      const pending = await this.getPendingItems(sessionId);
      return pending.length;
    }
    async getBlockingItems(sessionId) {
      const all = await this.getSessionItems(sessionId);
      return all.filter((item) => item.status === "pending" && item.blocking);
    }
    async getBlockingCount(sessionId) {
      const blocking = await this.getBlockingItems(sessionId);
      return blocking.length;
    }
    async getItemsByDomain(sessionId, domain) {
      const all = await this.getSessionItems(sessionId);
      return all.filter((item) => item.domain === domain);
    }
    async getItemsByBand(sessionId, band) {
      const all = await this.getSessionItems(sessionId);
      return all.filter((item) => item.confidenceBand === band);
    }
    // ─── Resolution Actions ────────────────────────────────────
    async resolveItem(id, action, payload = {}) {
      const item = await database_default.get("narrativeReviewQueue", id);
      if (!item) throw new Error(`Queue item ${id} not found`);
      if (item.status !== "pending") {
        throw new Error(`Queue item ${id} is already ${item.status}`);
      }
      const previousState = { ...item };
      const now = Date.now();
      switch (action) {
        case "accept":
          item.status = "accepted";
          break;
        case "reject":
          item.status = "rejected";
          break;
        case "edit":
          item.status = "edited";
          if (payload.editedNode) {
            item.suggestions = { ...item.suggestions, editedNode: payload.editedNode };
          }
          break;
        case "disambiguate":
          item.status = "accepted";
          if (payload.selectedOption) {
            item.disambiguationResolution = payload.selectedOption;
            item.targetEntityId = payload.selectedOption.entityId || item.targetEntityId;
          }
          break;
        case "delete":
          item.status = "deleted";
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }
      item.updatedAt = now;
      item.resolvedAction = action;
      await database_default.update("narrativeReviewQueue", item);
      await this._createAuditEntry(item, action, previousState, payload);
      this._pushUndo({ itemId: id, previousState, action });
      this._emit("itemResolved", { item, action });
      return item;
    }
    // ─── Bulk Actions ──────────────────────────────────────────
    async approveAllForChapter(chapterId, sessionId) {
      const items = await this.getSessionItems(sessionId);
      const pending = items.filter(
        (item) => item.status === "pending" && item.chapterId === chapterId
      );
      return this._bulkResolve(pending, "accept");
    }
    async approveAllWithSuggestedEdits(sessionId) {
      var _a, _b;
      const items = await this.getSessionItems(sessionId);
      const pending = items.filter((item) => item.status === "pending");
      const results = [];
      for (const item of pending) {
        if (((_b = (_a = item.suggestions) == null ? void 0 : _a.guideBasedEdits) == null ? void 0 : _b.length) > 0) {
          results.push(await this.resolveItem(item.id, "edit", {
            editedNode: item.suggestions.guideBasedEdits[0]
          }));
        } else {
          results.push(await this.resolveItem(item.id, "accept"));
        }
      }
      this._emit("bulkResolved", { action: "approveWithEdits", count: results.length });
      return results;
    }
    async denyAllRemaining(sessionId) {
      const pending = await this.getPendingItems(sessionId);
      return this._bulkResolve(pending, "reject");
    }
    async _bulkResolve(items, action) {
      const results = [];
      for (const item of items) {
        results.push(await this.resolveItem(item.id, action));
      }
      this._emit("bulkResolved", { action, count: results.length });
      return results;
    }
    // ─── Undo Operations ──────────────────────────────────────
    async undoLast() {
      const entry = this._undoStack.pop();
      if (!entry) throw new Error("Nothing to undo");
      const item = await database_default.get("narrativeReviewQueue", entry.itemId);
      if (!item) throw new Error("Queue item no longer exists");
      const restored = { ...entry.previousState };
      restored.updatedAt = Date.now();
      await database_default.update("narrativeReviewQueue", restored);
      await this._createAuditEntry(restored, "undo", item, { undoneAction: entry.action });
      this._emit("undone", { item: restored, undoneAction: entry.action });
      return restored;
    }
    async undoAll(sessionId) {
      const undone = [];
      while (this._undoStack.length > 0) {
        const top = this._undoStack[this._undoStack.length - 1];
        if (top.previousState.sessionId !== sessionId) break;
        undone.push(await this.undoLast());
      }
      this._emit("undoAll", { count: undone.length, sessionId });
      return undone;
    }
    getUndoStackSize() {
      return this._undoStack.length;
    }
    // ─── Continue Gate ─────────────────────────────────────────
    async canContinue(sessionId) {
      const unresolved = await this.getUnresolvedCount(sessionId);
      const blocking = await this.getBlockingCount(sessionId);
      return {
        canContinue: unresolved === 0,
        unresolvedCount: unresolved,
        blockingCount: blocking,
        reason: unresolved > 0 ? `${unresolved} unresolved items remain (${blocking} blocking)` : null
      };
    }
    // ─── Auto-Apply ────────────────────────────────────────────
    async autoApplyHighConfidence(sessionId) {
      const items = await this.getPendingItems(sessionId);
      const autoApplyItems = await confidencePolicyService_default.getAutoApplyItems(items);
      if (autoApplyItems.length === 0) return [];
      const results = [];
      for (const item of autoApplyItems) {
        results.push(await this.resolveItem(item.id, "accept"));
      }
      this._emit("autoApplied", { count: results.length, sessionId });
      return results;
    }
    // ─── Stats & Summary ──────────────────────────────────────
    async getSessionSummary(sessionId) {
      const items = await this.getSessionItems(sessionId);
      const byStatus = { pending: 0, accepted: 0, rejected: 0, edited: 0, deleted: 0 };
      const byDomain = {};
      const byBand = { red_block: 0, amber_review: 0, normal_review: 0, high_confidence: 0 };
      for (const item of items) {
        byStatus[item.status] = (byStatus[item.status] || 0) + 1;
        byDomain[item.domain] = (byDomain[item.domain] || 0) + 1;
        byBand[item.confidenceBand] = (byBand[item.confidenceBand] || 0) + 1;
      }
      return {
        total: items.length,
        byStatus,
        byDomain,
        byBand,
        unresolvedCount: byStatus.pending,
        blockingCount: items.filter((i) => i.blocking && i.status === "pending").length
      };
    }
    // ─── Audit Trail ───────────────────────────────────────────
    async _createAuditEntry(item, action, previousState, payload = {}) {
      const entry = {
        id: `qa_${item.id}_${Date.now()}`,
        queueItemId: item.id,
        sessionId: item.sessionId,
        action,
        previousStatus: previousState == null ? void 0 : previousState.status,
        newStatus: item.status,
        confidence: item.confidence,
        confidenceBand: item.confidenceBand,
        domain: item.domain,
        payload,
        createdAt: Date.now()
      };
      await database_default.add("queueAudit", entry);
      return entry;
    }
    async getAuditTrail(queueItemId) {
      return await database_default.getByIndex("queueAudit", "queueItemId", queueItemId) || [];
    }
    async getSessionAuditTrail(sessionId) {
      return await database_default.getByIndex("queueAudit", "sessionId", sessionId) || [];
    }
    // ─── Retry Failed Extraction ──────────────────────────────
    async retryExtractionNode(queueItemId) {
      const item = await database_default.get("narrativeReviewQueue", queueItemId);
      if (!item) throw new Error(`Queue item ${queueItemId} not found`);
      if (item.domain !== "failure") {
        throw new Error("Only failure domain items can be retried");
      }
      item.status = "pending";
      item.domain = item.originalDomain || "character";
      item.updatedAt = Date.now();
      item.retryCount = (item.retryCount || 0) + 1;
      await database_default.update("narrativeReviewQueue", item);
      this._emit("retryRequested", { item });
      return item;
    }
    // ─── Event System ──────────────────────────────────────────
    subscribe(listener) {
      this._listeners.add(listener);
      return () => this._listeners.delete(listener);
    }
    _emit(event, data) {
      for (const listener of this._listeners) {
        try {
          listener(event, data);
        } catch (e) {
          console.error("Queue listener error:", e);
        }
      }
    }
    _pushUndo(entry) {
      this._undoStack.push(entry);
      if (this._undoStack.length > this._maxUndoDepth) {
        this._undoStack.shift();
      }
    }
  };
  var narrativeReviewQueueService_default = new NarrativeReviewQueueService();

  // src/services/canonExtractionPipeline.js
  var CanonExtractionPipeline = class {
    constructor() {
      this.chunkSize = 5e3;
      this.chunkOverlap = 500;
      this._listeners = /* @__PURE__ */ new Set();
    }
    // ─── Main Pipeline ─────────────────────────────────────────
    async runExtraction({
      sessionId,
      chapterId,
      chapterNumber,
      bookId,
      chapterText,
      worldState,
      guidesContext
    }) {
      const results = {
        queueItems: [],
        failures: [],
        stats: { total: 0, byDomain: {} }
      };
      if (!chapterText || chapterText.trim().length < 50) {
        return results;
      }
      const chunks = this._getChunks(chapterText);
      const guidePromptSuffix = this._buildGuideContext(guidesContext);
      this._emit("extractionStarted", { sessionId, chapterId, chunkCount: chunks.length });
      const rawExtractions = {
        characters: [],
        items: [],
        skills: [],
        relationships: [],
        plots: [],
        quests: [],
        timeline: [],
        locations: [],
        factions: [],
        lore: []
      };
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        this._emit("chunkProgress", { sessionId, current: i + 1, total: chunks.length });
        try {
          const chunkResult = await this._extractFromChunk(
            chunk,
            chapterNumber,
            bookId,
            worldState,
            guidePromptSuffix
          );
          Object.keys(rawExtractions).forEach((domain) => {
            if (chunkResult[domain]) {
              rawExtractions[domain].push(...chunkResult[domain]);
            }
          });
        } catch (error) {
          const failureNode = narrativeReviewQueueService_default.createQueueItem({
            sessionId,
            chapterId,
            chapterNumber,
            domain: "failure",
            operation: "conflict",
            source: {
              lineStart: chunk.charStart,
              lineEnd: chunk.charEnd,
              snippet: chunk.text.substring(0, 200),
              chapterRef: `Chapter ${chapterNumber}, chunk ${i + 1}`
            },
            confidence: 0,
            confidenceReason: `Extraction failed for chunk ${i + 1}: ${error.message}`,
            suggestions: {
              proposedNode: { error: error.message, chunkIndex: i },
              manualFallbackPrompt: `Review chunk ${i + 1} of Chapter ${chapterNumber} manually`
            },
            blocking: false
          });
          failureNode.originalDomain = "multi";
          results.failures.push(failureNode);
          results.queueItems.push(failureNode);
          await database_default.add("extractionFailures", {
            id: failureNode.id,
            sessionId,
            chapterId,
            chapterNumber,
            domain: "multi",
            error: error.message,
            chunkIndex: i,
            createdAt: Date.now()
          });
        }
      }
      const deduped = this._deduplicateExtractions(rawExtractions);
      const queueItems = await this._matchAndProduceNodes(
        deduped,
        sessionId,
        chapterId,
        chapterNumber,
        worldState
      );
      results.queueItems.push(...queueItems);
      results.stats.total = results.queueItems.length;
      for (const item of results.queueItems) {
        results.stats.byDomain[item.domain] = (results.stats.byDomain[item.domain] || 0) + 1;
      }
      this._emit("extractionCompleted", {
        sessionId,
        chapterId,
        total: results.stats.total,
        failures: results.failures.length
      });
      return results;
    }
    // ─── Chunk Management ──────────────────────────────────────
    _getChunks(text) {
      if (text.length <= this.chunkSize) {
        return [{ index: 0, text, charStart: 0, charEnd: text.length }];
      }
      const chunks = [];
      let start = 0;
      let index = 0;
      while (start < text.length) {
        const end = Math.min(text.length, start + this.chunkSize);
        chunks.push({ index, text: text.slice(start, end), charStart: start, charEnd: end });
        if (end >= text.length) break;
        start = end - this.chunkOverlap;
        index++;
      }
      return chunks;
    }
    // ─── Per-Chunk Extraction ──────────────────────────────────
    async _extractFromChunk(chunk, chapterNumber, bookId, worldState, guideContext) {
      const actorNames = ((worldState == null ? void 0 : worldState.actors) || []).map((a) => a.name).join(", ");
      const itemNames = ((worldState == null ? void 0 : worldState.items) || []).map((i) => i.name).join(", ");
      const prompt = `You are a canon extraction system for a long-form story. Analyze this chapter chunk and extract ALL narrative elements across every domain.

Chapter ${chapterNumber}, Chunk ${chunk.index + 1}:
---
${chunk.text}
---

Known characters: ${actorNames || "None"}
Known items: ${itemNames || "None"}
${guideContext}

Extract into these categories:
1. characters: [{name, description, isNew, traits, role, confidence}]
2. items: [{name, description, isNew, type, rarity, owner, confidence}]
3. skills: [{name, description, isNew, user, action(gained/improved/mastered), level, confidence}]
4. relationships: [{character1, character2, type, change, strength, confidence}]
5. plots: [{title, description, status(setup/development/climax/resolution), characters, confidence}]
6. quests: [{title, description, type(main/sub), status(active/completed/failed), objectives, confidence}]
7. timeline: [{event, timestamp, characters, significance, confidence}]
8. locations: [{name, type, description, significance, confidence}]
9. factions: [{name, type, members, goals, stance, confidence}]
10. lore: [{title, category, description, significance, confidence}]

For each item, include a confidence score (0-1) indicating extraction certainty.
For existing entities, note them as isNew: false with their current name.

Return valid JSON only:
{"characters":[...],"items":[...],"skills":[...],"relationships":[...],"plots":[...],"quests":[...],"timeline":[...],"locations":[...],"factions":[...],"lore":[...]}`;
      const response = await aiService_default.callAI(prompt, "structured", "", {
        temperature: 0.2,
        maxTokens: 4e3
      });
      return this._parseMultiDomainResponse(response);
    }
    _parseMultiDomainResponse(response) {
      const defaults = {
        characters: [],
        items: [],
        skills: [],
        relationships: [],
        plots: [],
        quests: [],
        timeline: [],
        locations: [],
        factions: [],
        lore: []
      };
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return defaults;
        const data = JSON.parse(jsonMatch[0]);
        const result = {};
        for (const key of Object.keys(defaults)) {
          result[key] = Array.isArray(data[key]) ? data[key] : [];
        }
        return result;
      } catch {
        return defaults;
      }
    }
    // ─── Deduplication ─────────────────────────────────────────
    _deduplicateExtractions(raw) {
      const deduped = {};
      for (const [domain, items] of Object.entries(raw)) {
        const seen = /* @__PURE__ */ new Set();
        deduped[domain] = items.filter((item) => {
          const key = this._dedupeKey(domain, item);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      }
      return deduped;
    }
    _dedupeKey(domain, item) {
      switch (domain) {
        case "characters":
        case "items":
        case "skills":
        case "locations":
        case "factions":
          return `${domain}|${(item.name || "").toLowerCase().trim()}`;
        case "relationships":
          return `rel|${(item.character1 || "").toLowerCase()}|${(item.character2 || "").toLowerCase()}`;
        case "plots":
        case "quests":
          return `${domain}|${(item.title || "").toLowerCase().trim()}`;
        case "timeline":
          return `time|${(item.event || "").toLowerCase().trim()}`;
        case "lore":
          return `lore|${(item.title || "").toLowerCase().trim()}`;
        default:
          return `${domain}|${JSON.stringify(item)}`;
      }
    }
    // ─── Canon Matching & Queue Node Production ────────────────
    async _matchAndProduceNodes(deduped, sessionId, chapterId, chapterNumber, worldState) {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q;
      const queueItems = [];
      for (const char of deduped.characters) {
        const match = (worldState == null ? void 0 : worldState.actors) ? entityMatchingService_default.matchEntity(char, worldState) : null;
        queueItems.push(narrativeReviewQueueService_default.createQueueItem({
          sessionId,
          chapterId,
          chapterNumber,
          domain: "character",
          operation: match ? "update" : "create",
          targetEntityId: (_a = match == null ? void 0 : match.matchedEntity) == null ? void 0 : _a.id,
          targetEntityLabel: char.name,
          newOrExisting: match ? "existing" : char.isNew === false ? "ambiguous" : "new",
          source: { lineStart: 0, lineEnd: 0, snippet: char.description || "", chapterRef: `Ch.${chapterNumber}` },
          confidence: Number((_b = char.confidence) != null ? _b : match ? 0.85 : 0.65),
          confidenceReason: match ? `Matched existing character "${(_c = match.matchedEntity) == null ? void 0 : _c.name}" (score: ${(_d = match.score) == null ? void 0 : _d.toFixed(2)})` : `New character detected: "${char.name}"`,
          suggestions: {
            proposedNode: char,
            sideBySide: match ? { original: match.matchedEntity, suggested: char } : void 0
          },
          lastMention: (match == null ? void 0 : match.matchedEntity) ? await this._findLastMention(match.matchedEntity.id, "actors", chapterNumber) : void 0,
          blocking: false
        }));
      }
      for (const item of deduped.items) {
        const match = (worldState == null ? void 0 : worldState.items) ? entityMatchingService_default.matchEntity(item, worldState) : null;
        queueItems.push(narrativeReviewQueueService_default.createQueueItem({
          sessionId,
          chapterId,
          chapterNumber,
          domain: "item",
          operation: match ? "update" : "create",
          targetEntityId: (_e = match == null ? void 0 : match.matchedEntity) == null ? void 0 : _e.id,
          targetEntityLabel: item.name,
          newOrExisting: match ? "existing" : "new",
          source: { lineStart: 0, lineEnd: 0, snippet: item.description || "", chapterRef: `Ch.${chapterNumber}` },
          confidence: Number((_f = item.confidence) != null ? _f : 0.75),
          confidenceReason: match ? `Matched existing item "${(_g = match.matchedEntity) == null ? void 0 : _g.name}"` : `New item detected: "${item.name}"`,
          suggestions: { proposedNode: item },
          blocking: false
        }));
      }
      for (const skill of deduped.skills) {
        const match = (worldState == null ? void 0 : worldState.skills) ? entityMatchingService_default.matchEntity(skill, worldState) : null;
        queueItems.push(narrativeReviewQueueService_default.createQueueItem({
          sessionId,
          chapterId,
          chapterNumber,
          domain: "skill",
          operation: match ? "update" : "create",
          targetEntityId: (_h = match == null ? void 0 : match.matchedEntity) == null ? void 0 : _h.id,
          targetEntityLabel: skill.name,
          newOrExisting: match ? "existing" : "new",
          source: { lineStart: 0, lineEnd: 0, snippet: skill.description || "", chapterRef: `Ch.${chapterNumber}` },
          confidence: Number((_i = skill.confidence) != null ? _i : 0.75),
          confidenceReason: match ? `Matched existing skill "${(_j = match.matchedEntity) == null ? void 0 : _j.name}"` : `New skill: "${skill.name}" (${skill.action || "detected"})`,
          suggestions: { proposedNode: skill },
          blocking: false
        }));
      }
      for (const rel of deduped.relationships) {
        queueItems.push(narrativeReviewQueueService_default.createQueueItem({
          sessionId,
          chapterId,
          chapterNumber,
          domain: "relationship",
          operation: "create",
          targetEntityLabel: `${rel.character1} \u2194 ${rel.character2}`,
          newOrExisting: "new",
          source: { lineStart: 0, lineEnd: 0, snippet: rel.change || "", chapterRef: `Ch.${chapterNumber}` },
          confidence: Number((_k = rel.confidence) != null ? _k : 0.7),
          confidenceReason: `Relationship detected: ${rel.type} (${rel.character1} \u2194 ${rel.character2})`,
          suggestions: { proposedNode: rel },
          blocking: false
        }));
      }
      for (const plot of deduped.plots) {
        queueItems.push(narrativeReviewQueueService_default.createQueueItem({
          sessionId,
          chapterId,
          chapterNumber,
          domain: "plot",
          operation: "create",
          targetEntityLabel: plot.title,
          newOrExisting: "new",
          source: { lineStart: 0, lineEnd: 0, snippet: plot.description || "", chapterRef: `Ch.${chapterNumber}` },
          confidence: Number((_l = plot.confidence) != null ? _l : 0.7),
          confidenceReason: `Plot point: "${plot.title}" (${plot.status || "detected"})`,
          suggestions: { proposedNode: plot },
          blocking: false
        }));
      }
      for (const quest of deduped.quests) {
        queueItems.push(narrativeReviewQueueService_default.createQueueItem({
          sessionId,
          chapterId,
          chapterNumber,
          domain: "plot",
          operation: "create",
          targetEntityLabel: quest.title,
          newOrExisting: "new",
          source: { lineStart: 0, lineEnd: 0, snippet: quest.description || "", chapterRef: `Ch.${chapterNumber}` },
          confidence: Number((_m = quest.confidence) != null ? _m : 0.7),
          confidenceReason: `Quest detected: "${quest.title}" (${quest.type || "sub"})`,
          suggestions: { proposedNode: { ...quest, isQuest: true } },
          blocking: false
        }));
      }
      for (const event of deduped.timeline) {
        queueItems.push(narrativeReviewQueueService_default.createQueueItem({
          sessionId,
          chapterId,
          chapterNumber,
          domain: "timeline",
          operation: "create",
          targetEntityLabel: event.event,
          newOrExisting: "new",
          source: { lineStart: 0, lineEnd: 0, snippet: event.event || "", chapterRef: `Ch.${chapterNumber}` },
          confidence: Number((_n = event.confidence) != null ? _n : 0.8),
          confidenceReason: `Timeline event: "${event.event}"`,
          suggestions: { proposedNode: event },
          blocking: false
        }));
      }
      for (const loc of deduped.locations) {
        const existingLocs = await database_default.getAll("locations");
        const existingMatch = existingLocs == null ? void 0 : existingLocs.find(
          (l) => {
            var _a2, _b2;
            return ((_a2 = l.name) == null ? void 0 : _a2.toLowerCase()) === ((_b2 = loc.name) == null ? void 0 : _b2.toLowerCase());
          }
        );
        queueItems.push(narrativeReviewQueueService_default.createQueueItem({
          sessionId,
          chapterId,
          chapterNumber,
          domain: "location",
          operation: existingMatch ? "update" : "create",
          targetEntityId: existingMatch == null ? void 0 : existingMatch.id,
          targetEntityLabel: loc.name,
          newOrExisting: existingMatch ? "existing" : "new",
          source: { lineStart: 0, lineEnd: 0, snippet: loc.description || "", chapterRef: `Ch.${chapterNumber}` },
          confidence: Number((_o = loc.confidence) != null ? _o : 0.8),
          confidenceReason: existingMatch ? `Known location: "${loc.name}"` : `New location: "${loc.name}"`,
          suggestions: { proposedNode: loc },
          blocking: false
        }));
      }
      for (const faction of deduped.factions) {
        queueItems.push(narrativeReviewQueueService_default.createQueueItem({
          sessionId,
          chapterId,
          chapterNumber,
          domain: "faction",
          operation: "create",
          targetEntityLabel: faction.name,
          newOrExisting: "new",
          source: { lineStart: 0, lineEnd: 0, snippet: faction.goals || "", chapterRef: `Ch.${chapterNumber}` },
          confidence: Number((_p = faction.confidence) != null ? _p : 0.7),
          confidenceReason: `Faction detected: "${faction.name}"`,
          suggestions: { proposedNode: faction },
          blocking: false
        }));
      }
      for (const loreItem of deduped.lore) {
        queueItems.push(narrativeReviewQueueService_default.createQueueItem({
          sessionId,
          chapterId,
          chapterNumber,
          domain: "lore",
          operation: "create",
          targetEntityLabel: loreItem.title,
          newOrExisting: "new",
          source: { lineStart: 0, lineEnd: 0, snippet: loreItem.description || "", chapterRef: `Ch.${chapterNumber}` },
          confidence: Number((_q = loreItem.confidence) != null ? _q : 0.65),
          confidenceReason: `Lore entry: "${loreItem.title}" (${loreItem.category || "general"})`,
          suggestions: { proposedNode: loreItem },
          blocking: false
        }));
      }
      return queueItems;
    }
    // ─── Guide Context ─────────────────────────────────────────
    _buildGuideContext(guidesContext) {
      if (!guidesContext) return "";
      const parts = [];
      if (guidesContext.styleGuide) {
        parts.push(`Writing Style Guide: ${guidesContext.styleGuide.substring(0, 500)}`);
      }
      if (guidesContext.worldRules) {
        parts.push(`World Rules: ${guidesContext.worldRules.substring(0, 500)}`);
      }
      if (guidesContext.storyArchitecture) {
        parts.push(`Story Architecture: ${guidesContext.storyArchitecture.substring(0, 500)}`);
      }
      return parts.length > 0 ? `

Guide Context:
${parts.join("\n")}` : "";
    }
    // ─── Last Mention Lookup ───────────────────────────────────
    async _findLastMention(entityId, storeName, currentChapter) {
      try {
        const states = await database_default.getByIndex("entityChapterStates", "entityId", entityId);
        if (!states || states.length === 0) return void 0;
        const prior = states.filter((s) => s.chapterNumber < currentChapter).sort((a, b) => b.chapterNumber - a.chapterNumber);
        if (prior.length === 0) return void 0;
        const last = prior[0];
        return {
          chapterNumber: last.chapterNumber,
          lineStart: last.lineStart || 0,
          snippet: last.snippet || `Last seen in Chapter ${last.chapterNumber}`
        };
      } catch {
        return void 0;
      }
    }
    // ─── Event System ──────────────────────────────────────────
    subscribe(listener) {
      this._listeners.add(listener);
      return () => this._listeners.delete(listener);
    }
    _emit(event, data) {
      for (const listener of this._listeners) {
        try {
          listener(event, data);
        } catch (e) {
          console.error("Pipeline listener error:", e);
        }
      }
    }
  };
  var canonExtractionPipeline_default = new CanonExtractionPipeline();

  // src/services/canonLifecycleService.js
  init_database();
  var STATES = {
    DRAFT: "Draft",
    SAVE_PENDING: "SavePending",
    EXTRACTING: "Extracting",
    REVIEW_LOCKED: "ReviewLocked",
    CANON_COMMITTED: "CanonCommitted"
  };
  var TRANSITIONS = {
    [STATES.DRAFT]: [STATES.SAVE_PENDING, STATES.DRAFT],
    [STATES.SAVE_PENDING]: [STATES.EXTRACTING, STATES.DRAFT],
    [STATES.EXTRACTING]: [STATES.REVIEW_LOCKED, STATES.DRAFT],
    [STATES.REVIEW_LOCKED]: [STATES.CANON_COMMITTED, STATES.REVIEW_LOCKED],
    [STATES.CANON_COMMITTED]: [STATES.DRAFT]
  };
  var CanonLifecycleService = class {
    constructor() {
      this._listeners = /* @__PURE__ */ new Set();
      this._sessionCache = /* @__PURE__ */ new Map();
    }
    // ─── State Queries ────────────────────────────────────────
    isValidTransition(from, to) {
      const allowed = TRANSITIONS[from];
      return allowed ? allowed.includes(to) : false;
    }
    canEdit(state) {
      return state === STATES.DRAFT;
    }
    canSaveAndExtract(state) {
      return state === STATES.DRAFT;
    }
    canCloseQueue(unresolvedCount) {
      return unresolvedCount === 0;
    }
    canContinueWriting(state, unresolvedCount, blockingRetroCount) {
      return state === STATES.REVIEW_LOCKED && unresolvedCount === 0 && blockingRetroCount === 0;
    }
    isReadOnlyNav(state) {
      return state === STATES.REVIEW_LOCKED || state === STATES.EXTRACTING || state === STATES.SAVE_PENDING;
    }
    // ─── Session Management ───────────────────────────────────
    async getSession(chapterId) {
      const sessions = await database_default.getByIndex("canonSessions", "chapterId", chapterId);
      if (!sessions || sessions.length === 0) return null;
      return sessions.sort((a, b) => b.createdAt - a.createdAt)[0];
    }
    async getActiveSession(chapterId) {
      const session = await this.getSession(chapterId);
      if (!session) return null;
      if (session.status === STATES.CANON_COMMITTED) return null;
      return session;
    }
    async getChapterState(chapterId) {
      const session = await this.getActiveSession(chapterId);
      return session ? session.status : STATES.DRAFT;
    }
    async createSession(chapterId, chapterNumber, bookId) {
      const now = Date.now();
      const session = {
        id: `cs_${chapterId}_${now}`,
        chapterId,
        chapterNumber,
        bookId,
        status: STATES.DRAFT,
        createdAt: now,
        updatedAt: now,
        committedAt: null,
        extractionStartedAt: null,
        extractionCompletedAt: null,
        snapshotId: null
      };
      await database_default.add("canonSessions", session);
      this._sessionCache.set(chapterId, session);
      this._emit("sessionCreated", session);
      return session;
    }
    async transitionTo(chapterId, newState, metadata = {}) {
      const session = await this.getActiveSession(chapterId);
      if (!session) {
        throw new Error(`No active session for chapter ${chapterId}`);
      }
      if (!this.isValidTransition(session.status, newState)) {
        throw new Error(
          `Invalid transition: ${session.status} \u2192 ${newState} for chapter ${chapterId}`
        );
      }
      const oldState = session.status;
      const now = Date.now();
      session.status = newState;
      session.updatedAt = now;
      if (newState === STATES.EXTRACTING) {
        session.extractionStartedAt = now;
      }
      if (newState === STATES.REVIEW_LOCKED) {
        session.extractionCompletedAt = now;
      }
      if (newState === STATES.CANON_COMMITTED) {
        session.committedAt = now;
      }
      Object.assign(session, metadata);
      await database_default.update("canonSessions", session);
      this._sessionCache.set(chapterId, session);
      this._emit("stateChanged", { chapterId, oldState, newState, session });
      return session;
    }
    // ─── High-Level Lifecycle Actions ──────────────────────────
    async startSaveAndExtract(chapterId, chapterNumber, bookId) {
      let session = await this.getActiveSession(chapterId);
      if (!session) {
        session = await this.createSession(chapterId, chapterNumber, bookId);
      }
      if (session.status !== STATES.DRAFT) {
        throw new Error(`Chapter ${chapterId} is not in Draft state (currently: ${session.status})`);
      }
      await this.transitionTo(chapterId, STATES.SAVE_PENDING);
      return session;
    }
    async beginExtraction(chapterId, snapshotId) {
      return this.transitionTo(chapterId, STATES.EXTRACTING, { snapshotId });
    }
    async completeExtraction(chapterId) {
      return this.transitionTo(chapterId, STATES.REVIEW_LOCKED);
    }
    async commitCanon(chapterId, unresolvedCount, blockingRetroCount) {
      if (unresolvedCount > 0) {
        throw new Error(`Cannot commit: ${unresolvedCount} unresolved queue items remain`);
      }
      if (blockingRetroCount > 0) {
        throw new Error(`Cannot commit: ${blockingRetroCount} blocking retro impacts remain`);
      }
      return this.transitionTo(chapterId, STATES.CANON_COMMITTED);
    }
    async cancelSession(chapterId) {
      const session = await this.getActiveSession(chapterId);
      if (!session) return null;
      if (session.status === STATES.CANON_COMMITTED) {
        throw new Error("Cannot cancel a committed session");
      }
      session.status = STATES.DRAFT;
      session.updatedAt = Date.now();
      session.cancelledAt = Date.now();
      await database_default.update("canonSessions", session);
      this._sessionCache.set(chapterId, session);
      this._emit("sessionCancelled", session);
      return session;
    }
    // ─── Save Draft (separate path from Save & Extract) ───────
    async saveDraft(chapterId, chapterText, bookData) {
      var _a;
      const state = await this.getChapterState(chapterId);
      if (state !== STATES.DRAFT) {
        throw new Error(`Cannot save draft: chapter is in ${state} state`);
      }
      const book = { ...bookData };
      const chapter = (_a = book.chapters) == null ? void 0 : _a.find((c) => c.id === chapterId);
      if (!chapter) throw new Error("Chapter not found in book");
      chapter.script = chapterText;
      chapter.lastUpdated = Date.now();
      chapter.isDraft = true;
      await database_default.update("books", book);
      this._emit("draftSaved", { chapterId, timestamp: Date.now() });
      return chapter;
    }
    // ─── Version Management ────────────────────────────────────
    async createVersionSnapshot(chapterId, chapterNumber, chapterText, entityState) {
      const existingVersions = await database_default.getByIndex("chapterVersions", "chapterId", chapterId);
      const versionNumber = ((existingVersions == null ? void 0 : existingVersions.length) || 0) + 1;
      const now = Date.now();
      const version = {
        id: `cv_${chapterId}_v${versionNumber}_${now}`,
        chapterId,
        chapterNumber,
        versionNumber,
        content: chapterText,
        entityState,
        createdAt: now
      };
      await database_default.add("chapterVersions", version);
      this._emit("versionCreated", version);
      return version;
    }
    async getVersionHistory(chapterId) {
      const versions = await database_default.getByIndex("chapterVersions", "chapterId", chapterId);
      return (versions || []).sort((a, b) => b.versionNumber - a.versionNumber);
    }
    async getVersionDiff(chapterId, fromVersionNum, toVersionNum) {
      const versions = await database_default.getByIndex("chapterVersions", "chapterId", chapterId);
      const fromVer = versions == null ? void 0 : versions.find((v) => v.versionNumber === fromVersionNum);
      const toVer = versions == null ? void 0 : versions.find((v) => v.versionNumber === toVersionNum);
      if (!fromVer || !toVer) {
        throw new Error("One or both version numbers not found");
      }
      return {
        chapterId,
        fromVersion: fromVersionNum,
        toVersion: toVersionNum,
        fromContent: fromVer.content,
        toContent: toVer.content,
        fromEntityState: fromVer.entityState,
        toEntityState: toVer.entityState,
        fromTimestamp: fromVer.createdAt,
        toTimestamp: toVer.createdAt
      };
    }
    async rollbackToVersion(chapterId, versionNumber) {
      const versions = await database_default.getByIndex("chapterVersions", "chapterId", chapterId);
      const targetVersion = versions == null ? void 0 : versions.find((v) => v.versionNumber === versionNumber);
      if (!targetVersion) {
        throw new Error(`Version ${versionNumber} not found for chapter ${chapterId}`);
      }
      const newVersion = await this.createVersionSnapshot(
        chapterId,
        targetVersion.chapterNumber,
        targetVersion.content,
        targetVersion.entityState
      );
      const changelog = {
        id: `cl_${chapterId}_${Date.now()}`,
        chapterId,
        fromVersion: versions.length,
        toVersion: newVersion.versionNumber,
        action: "rollback",
        rollbackTarget: versionNumber,
        createdAt: Date.now()
      };
      await database_default.add("chapterChangelog", changelog);
      this._emit("versionRolledBack", { chapterId, targetVersion: versionNumber, newVersion });
      return newVersion;
    }
    // ─── Event System ──────────────────────────────────────────
    subscribe(listener) {
      this._listeners.add(listener);
      return () => this._listeners.delete(listener);
    }
    _emit(event, data) {
      for (const listener of this._listeners) {
        try {
          listener(event, data);
        } catch (e) {
          console.error("Lifecycle listener error:", e);
        }
      }
    }
  };
  var canonLifecycleService_default = new CanonLifecycleService();

  // src/entry.js
  init_intelligenceRouter();

  // src/services/entityInterjectionService.js
  init_aiService();

  // src/services/smartContextEngine.js
  init_contextEngine();
  init_database();
  init_aiService();

  // src/services/styleReferenceService.js
  init_database();
  init_aiService();
  var STYLE_STORE = "styleReferences";
  var STYLE_PATTERNS_STORE = "stylePatterns";
  var STYLE_VERSIONS_STORE = "styleVersions";
  var initStores = async () => {
    var _a;
    try {
      await database_default.getAll(STYLE_STORE);
    } catch (e) {
      if (e.name === "NotFoundError" || ((_a = e.message) == null ? void 0 : _a.includes("object stores was not found"))) {
        console.warn("Style reference stores not found. They will be created on next page refresh.");
        return false;
      }
      throw e;
    }
    return true;
  };
  var saveStyleReference = async (data) => {
    var _a;
    const storesExist = await initStores();
    if (!storesExist) {
      throw new Error("DATABASE_MIGRATION_NEEDED: Please refresh the page to create the required database stores.");
    }
    const {
      id = `style_${Date.now()}`,
      name = "Style Reference",
      content,
      type = "general",
      // 'general' | 'examples' | 'guide' | 'reference'
      scope = "global",
      // 'global' | 'project'
      projectId = null,
      metadata = {}
    } = data;
    const version = {
      id: `version_${Date.now()}`,
      styleId: id,
      content,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      wordCount: content.split(/\s+/).filter((w) => w).length,
      charCount: content.length
    };
    let styleRef;
    try {
      await database_default.add(STYLE_VERSIONS_STORE, version);
      const existing = await database_default.get(STYLE_STORE, id).catch(() => null);
      styleRef = {
        id,
        name,
        type,
        scope,
        projectId,
        currentVersionId: version.id,
        metadata,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        createdAt: (existing == null ? void 0 : existing.createdAt) || (/* @__PURE__ */ new Date()).toISOString()
      };
      await database_default.update(STYLE_STORE, styleRef);
    } catch (error) {
      if (error.name === "NotFoundError" || ((_a = error.message) == null ? void 0 : _a.includes("object stores was not found"))) {
        throw new Error("DATABASE_MIGRATION_NEEDED: Please refresh the page to run the database migration.");
      }
      throw error;
    }
    try {
      await analyzeStylePatterns(id, content);
    } catch (error) {
      console.warn("Style pattern analysis failed, but reference was saved:", error);
    }
    return { styleRef, version };
  };
  var analyzeStylePatterns = async (styleId, content) => {
    try {
      const words = content.split(/\s+/);
      const analysisText = words.length > 5e3 ? words.slice(0, 5e3).join(" ") + "..." : content;
      const prompt = `Analyze this writing sample and extract key style patterns. Return JSON with:
{
  "tone": "description of overall tone",
  "pacing": "description of pacing (fast/slow/varies)",
  "humorStyle": "description of comedy/humor approach",
  "voice": "description of narrative voice",
  "dialogueStyle": "description of how dialogue is written",
  "descriptionStyle": "description of descriptive passages",
  "sentenceStructure": "description of sentence patterns",
  "vocabulary": "description of word choice and formality",
  "themes": ["theme1", "theme2"],
  "keyPhrases": ["example phrase 1", "example phrase 2"],
  "characterVoicePatterns": "description of how characters speak differently"
}

Text to analyze:
"""
${analysisText}
"""

Return ONLY valid JSON, no markdown or explanation.`;
      const result = await aiService_default.callAI(prompt, "analysis");
      let patterns;
      try {
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          patterns = JSON.parse(jsonMatch[0]);
        } else {
          patterns = JSON.parse(result);
        }
      } catch (e) {
        console.warn("Failed to parse style patterns, using fallback:", e);
        patterns = {
          tone: "Extracted from document",
          pacing: "Variable",
          humorStyle: "Present in text",
          voice: "Narrative voice detected",
          dialogueStyle: "Dialogue patterns found",
          descriptionStyle: "Descriptive writing present",
          sentenceStructure: "Varied",
          vocabulary: "Context-appropriate",
          themes: [],
          keyPhrases: [],
          characterVoicePatterns: "Character voices detected"
        };
      }
      const patternData = {
        id: `pattern_${styleId}`,
        styleId,
        patterns,
        extractedAt: (/* @__PURE__ */ new Date()).toISOString(),
        sourceLength: content.length
      };
      await database_default.update(STYLE_PATTERNS_STORE, patternData);
      return patterns;
    } catch (error) {
      console.error("Error analyzing style patterns:", error);
      return null;
    }
  };
  var getStyleReferences = async (scope = null, projectId = null) => {
    var _a;
    const storesExist = await initStores();
    if (!storesExist) {
      return [];
    }
    try {
      const all = await database_default.getAll(STYLE_STORE) || [];
      if (scope === "global") {
        return all.filter((s) => s.scope === "global");
      } else if (scope === "project" && projectId) {
        return all.filter((s) => s.scope === "project" && s.projectId === projectId);
      }
      return all;
    } catch (error) {
      if (error.name === "NotFoundError" || ((_a = error.message) == null ? void 0 : _a.includes("object stores was not found"))) {
        console.warn("Style reference stores not found. Database migration may be needed. Please refresh the page.");
        return [];
      }
      throw error;
    }
  };
  var getStylePatterns = async (styleId) => {
    await initStores();
    try {
      const patterns = await database_default.get(STYLE_PATTERNS_STORE, `pattern_${styleId}`);
      return (patterns == null ? void 0 : patterns.patterns) || null;
    } catch (e) {
      return null;
    }
  };
  var getAllStylePatterns = async (projectId = null) => {
    await initStores();
    const globalStyles = await getStyleReferences("global");
    const projectStyles = projectId ? await getStyleReferences("project", projectId) : [];
    const allStyles = [...globalStyles, ...projectStyles];
    const allPatterns = [];
    for (const style of allStyles) {
      const patterns = await getStylePatterns(style.id);
      if (patterns) {
        allPatterns.push({
          styleId: style.id,
          styleName: style.name,
          patterns
        });
      }
    }
    return allPatterns;
  };
  var getStyleContext = async (projectId = null, maxWords = 2e3) => {
    var _a;
    const storesExist = await initStores();
    if (!storesExist) {
      return "";
    }
    const globalStyles = await getStyleReferences("global");
    const projectStyles = projectId ? await getStyleReferences("project", projectId) : [];
    const allStyles = [...globalStyles, ...projectStyles];
    const contexts = [];
    for (const style of allStyles) {
      try {
        const version = await database_default.get(STYLE_VERSIONS_STORE, style.currentVersionId);
        if (version == null ? void 0 : version.content) {
          contexts.push({
            name: style.name,
            type: style.type,
            content: version.content
          });
        }
      } catch (e) {
      }
    }
    let combined = contexts.map((c) => `[${c.name} - ${c.type}]
${c.content}`).join("\n\n---\n\n");
    const words = combined.split(/\s+/);
    if (words.length > maxWords) {
      const examples = contexts.filter((c) => c.type === "examples");
      const others = contexts.filter((c) => c.type !== "examples");
      let truncated = "";
      if (examples.length > 0) {
        const exampleText = examples.map((c) => c.content).join("\n\n");
        const exampleWords = exampleText.split(/\s+/);
        if (exampleWords.length <= maxWords * 0.7) {
          truncated = exampleText + "\n\n";
          const remaining = maxWords - exampleWords.length;
          if (remaining > 0 && others.length > 0) {
            const otherText = others[0].content;
            const otherWords = otherText.split(/\s+/);
            truncated += otherWords.slice(0, remaining).join(" ");
          }
        } else {
          truncated = exampleWords.slice(0, Math.floor(maxWords * 0.7)).join(" ") + "\n\n";
          truncated += ((_a = others[0]) == null ? void 0 : _a.content.split(/\s+/).slice(0, Math.floor(maxWords * 0.3)).join(" ")) || "";
        }
      } else {
        truncated = words.slice(0, maxWords).join(" ");
      }
      combined = truncated + "...";
    }
    return combined;
  };
  var getStyleVersions = async (styleId) => {
    await initStores();
    try {
      const allVersions = await database_default.getAll(STYLE_VERSIONS_STORE) || [];
      return allVersions.filter((v) => v.styleId === styleId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (e) {
      return [];
    }
  };
  var restoreStyleVersion = async (styleId, versionId) => {
    await initStores();
    try {
      const version = await database_default.get(STYLE_VERSIONS_STORE, versionId);
      if (!version || version.styleId !== styleId) {
        throw new Error("Version not found");
      }
      const style = await database_default.get(STYLE_STORE, styleId);
      if (!style) {
        throw new Error("Style reference not found");
      }
      const newVersion = {
        id: `version_${Date.now()}`,
        styleId,
        content: version.content,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        wordCount: version.wordCount,
        charCount: version.charCount,
        restoredFrom: versionId
      };
      await database_default.add(STYLE_VERSIONS_STORE, newVersion);
      style.currentVersionId = newVersion.id;
      style.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      await database_default.update(STYLE_STORE, style);
      await analyzeStylePatterns(styleId, version.content);
      return newVersion;
    } catch (error) {
      console.error("Error restoring version:", error);
      throw error;
    }
  };
  var deleteStyleReference = async (styleId) => {
    await initStores();
    await database_default.delete(STYLE_STORE, styleId);
    try {
      await database_default.delete(STYLE_PATTERNS_STORE, `pattern_${styleId}`);
    } catch (e) {
    }
  };
  var styleReferenceService_default = {
    saveStyleReference,
    getStyleReferences,
    getStylePatterns,
    getAllStylePatterns,
    getStyleContext,
    getStyleVersions,
    restoreStyleVersion,
    deleteStyleReference
  };

  // src/data/expertWriterBase.js
  var expertWriterBase = {
    narrativeStructure: {
      title: "Narrative Structure & Pacing",
      content: `
=== NARRATIVE STRUCTURE FUNDAMENTALS ===

**Scene Construction:**
- Every scene must have a purpose: advance plot, develop character, or establish mood
- Scenes should begin in media res (in the middle of action) when possible
- End scenes with either a hook, revelation, or emotional beat
- Vary scene length: short scenes for tension, longer for development

**Pacing Control:**
- Fast pacing: Short sentences, active voice, immediate action, minimal description
- Slow pacing: Longer sentences, sensory details, internal monologue, reflection
- Use pacing shifts to create rhythm: fast action \u2192 slow reflection \u2192 fast again
- Dialogue speeds up pacing; description slows it down

**Transitions:**
- Smooth transitions between scenes maintain flow
- Use time markers ("Three hours later"), location shifts, or emotional beats
- Avoid jarring jumps unless intentional for effect
- Chapter breaks are natural pause points
    `.trim()
    },
    characterDevelopment: {
      title: "Character Development & Voice",
      content: `
=== CHARACTER DEVELOPMENT ===

**Character Consistency:**
- Characters must act according to their established personality, background, and motivations
- Character voice should be distinct: speech patterns, vocabulary, sentence structure
- Physical descriptions should match established appearance
- Skills and abilities must align with character's background

**Character Growth:**
- Characters should evolve, but change must be earned and believable
- Track character arcs: where they start, key moments, where they end
- Internal conflicts drive character development
- External conflicts test and reveal character

**Dialogue:**
- Each character speaks differently: vocabulary, sentence length, formality, humor style
- Dialogue should reveal character, advance plot, or both
- Subtext is more powerful than explicit statements
- Avoid "talking heads" - include action, setting, and body language
    `.trim()
    },
    dialogueWriting: {
      title: "Dialogue Mastery",
      content: `
=== DIALOGUE WRITING ===

**Natural Speech:**
- People interrupt, trail off, use contractions, speak in fragments
- Avoid perfect grammar unless character demands it
- Use dialogue tags sparingly - action beats are often better
- Vary tag placement: beginning, middle, end, or no tag at all

**Dialogue Functions:**
- Reveal character through word choice and speech patterns
- Advance plot through information exchange
- Create conflict through disagreement or misunderstanding
- Build relationships through conversation dynamics

**Dialogue Tags & Beats:**
- "Said" is invisible - use it most often
- Action beats (character movements) can replace tags
- Avoid adverbs in tags ("he said angrily") - show through action
- Tags should clarify who's speaking, not describe how
    `.trim()
    },
    descriptionAndImagery: {
      title: "Description & Sensory Details",
      content: `
=== DESCRIPTION & IMAGERY ===

**Show, Don't Tell:**
- Instead of "he was angry," show: "His fists clenched, jaw tight"
- Instead of "it was cold," show: "Breath visible, fingers numb"
- Actions reveal emotions and states more powerfully than labels

**Sensory Details:**
- Engage all five senses: sight, sound, smell, taste, touch
- Specific details are more powerful than generic ones
- Use sensory details to establish mood and setting
- Balance: too little = flat, too much = overwhelming

**Description Economy:**
- Every description should serve a purpose: mood, character, plot, or setting
- Cut descriptions that don't add value
- Vary detail density: sparse for action, rich for important moments
- Let readers fill in some details with their imagination
    `.trim()
    },
    toneAndMood: {
      title: "Tone & Mood Control",
      content: `
=== TONE & MOOD ===

**Tone Consistency:**
- Tone is the author's attitude toward subject and audience
- Maintain consistent tone unless shifting is intentional
- Tone affects word choice, sentence structure, and content selection

**Mood Creation:**
- Mood is the emotional atmosphere experienced by the reader
- Created through: setting, description, pacing, dialogue, and word choice
- Mood can shift within scenes, but transitions should be smooth
- Contrasting moods (comedy/horror) require careful balance

**Emotional Resonance:**
- Connect with readers through universal emotions
- Earn emotional moments - don't force them
- Understatement often more powerful than overstatement
- Let readers feel emotions rather than telling them what to feel
    `.trim()
    },
    plotAndConflict: {
      title: "Plot & Conflict",
      content: `
=== PLOT & CONFLICT ===

**Plot Structure:**
- Every story needs: inciting incident, rising action, climax, resolution
- Scenes should build toward plot points
- Subplots enrich main plot but must connect meaningfully
- Foreshadowing creates anticipation; payoffs satisfy it

**Conflict Types:**
- Internal: Character vs. self (desires, fears, beliefs)
- External: Character vs. character, nature, society, technology
- Multiple conflict layers create depth
- Conflict drives all action - without it, nothing happens

**Tension & Suspense:**
- Tension: reader knows something bad might happen
- Suspense: reader knows something will happen but not when/how
- Create through: unanswered questions, time pressure, stakes
- Release tension periodically - constant tension is exhausting
    `.trim()
    },
    worldBuilding: {
      title: "World Building & Setting",
      content: `
=== WORLD BUILDING ===

**Setting Integration:**
- Setting should feel lived-in, not just described
- Show world through character interaction, not exposition dumps
- Details should feel natural, not forced
- Consistency matters: if magic exists, establish rules and stick to them

**Exposition:**
- Weave world-building into action and dialogue
- Avoid info-dumps - reveal information as needed
- Let readers discover the world alongside characters
- Trust readers to piece together information

**Rules & Consistency:**
- Establish world rules early and consistently
- Break rules only if it serves story and is explained
- Internal logic must be consistent
- Readers will notice inconsistencies
    `.trim()
    },
    proseStyle: {
      title: "Prose Style & Voice",
      content: `
=== PROSE STYLE ===

**Sentence Variety:**
- Mix sentence lengths: short for impact, long for flow
- Vary sentence structure: simple, compound, complex
- Rhythm matters: read aloud to hear the music
- Parallel structure creates emphasis

**Word Choice:**
- Specific words are stronger than generic ones
- Active voice is usually stronger than passive
- Strong verbs carry more weight than weak verbs + adverbs
- Cut unnecessary words: "very," "really," "quite," "somewhat"

**Voice & Style:**
- Voice is the unique way you tell stories
- Style emerges from consistent choices: sentence length, word choice, tone
- Develop distinctive voice through practice and consistency
- Voice should serve the story, not overshadow it
    `.trim()
    },
    humorAndComedy: {
      title: "Humor & Comedy Writing",
      content: `
=== HUMOR & COMEDY ===

**Comedy Timing:**
- Setup and payoff: establish expectation, then subvert or fulfill
- Pacing matters: too fast = missed, too slow = lost
- Rule of three: setup, setup, punchline
- Deadpan delivery can be funnier than obvious jokes

**Types of Humor:**
- Wordplay: puns, double meanings, clever phrasing
- Situational: absurd circumstances, misunderstandings
- Character-based: quirks, flaws, reactions
- Dark humor: finding comedy in serious/dark situations
- Satire: using humor to critique or comment

**Comedy Rules:**
- Know your audience's sense of humor
- Comedy requires precision - timing and word choice matter
- What's funny in context may not be funny out of context
- Balance: too much comedy can undermine serious moments
    `.trim()
    },
    horrorAndTension: {
      title: "Horror & Tension Writing",
      content: `
=== HORROR & TENSION ===

**Building Dread:**
- Fear of the unknown is stronger than showing the monster
- Atmosphere matters: setting, mood, pacing create unease
- Slow build: tension escalates gradually
- What's suggested is often scarier than what's shown

**Horror Techniques:**
- Unreliable narrator creates uncertainty
- Isolation: remove safety nets, cut off escape routes
- Body horror: violation of physical integrity
- Psychological horror: fear of the mind, sanity, identity
- Cosmic horror: fear of the incomprehensible

**Tension Management:**
- Vary intensity: peaks and valleys prevent exhaustion
- Release tension periodically before building again
- Silence and pauses can be more powerful than action
- Let readers' imaginations do the heavy lifting
    `.trim()
    }
  };
  var getExpertWriterContent = () => {
    const sections = Object.values(expertWriterBase);
    return sections.map(
      (section) => `
${section.title}
${section.content}`
    ).join("\n\n");
  };

  // src/services/expertWriterService.js
  init_aiService();
  init_contextEngine();
  var ExpertWriterService = class {
    constructor() {
      this.cache = {
        genreEnhancements: {},
        lastCacheTime: null
      };
      this.cacheTimeout = 36e5;
    }
    /**
     * Get genre-specific enhancements for expert writer content
     */
    async getGenreEnhancements(storyProfile) {
      const genres = (storyProfile == null ? void 0 : storyProfile.genres) || [storyProfile == null ? void 0 : storyProfile.genre];
      const genreKey = Array.isArray(genres) ? genres.join("_") : genres;
      if (this.cache.genreEnhancements[genreKey] && this.cache.lastCacheTime && Date.now() - this.cache.lastCacheTime < this.cacheTimeout) {
        return this.cache.genreEnhancements[genreKey];
      }
      try {
        const genreList = Array.isArray(genres) ? genres.join(", ") : genres;
        const premise = (storyProfile == null ? void 0 : storyProfile.premise) || "A story";
        const tone = (storyProfile == null ? void 0 : storyProfile.tone) || (storyProfile == null ? void 0 : storyProfile.comparisons) || "general";
        const prompt = `You are an expert writing coach. Based on the genre(s) "${genreList}" and story premise "${premise}" with tone "${tone}", provide genre-specific writing guidance that enhances the base expert writing principles.

Focus on:
- Genre-specific narrative techniques
- Genre conventions and how to use/subvert them
- Genre-appropriate pacing and structure
- Genre-specific character archetypes and development
- Genre-appropriate dialogue styles
- Genre-specific world-building considerations
- Genre tone and mood techniques

Return ONLY the genre-specific guidance as formatted text. Be concise but comprehensive. Do not repeat general writing advice - focus on what's unique to this genre.

Format as:
=== GENRE-SPECIFIC WRITING GUIDANCE ===
[Your guidance here]`;
        const enhancement = await aiService_default.callAI(prompt, "creative");
        this.cache.genreEnhancements[genreKey] = enhancement;
        this.cache.lastCacheTime = Date.now();
        return enhancement;
      } catch (error) {
        console.warn("Failed to generate genre enhancements, using base only:", error);
        return "";
      }
    }
    /**
     * Get complete expert writer context (base + genre enhancements)
     */
    async getExpertWriterContext(storyProfile = null) {
      const baseContent = getExpertWriterContent();
      let genreEnhancements = "";
      if (storyProfile) {
        genreEnhancements = await this.getGenreEnhancements(storyProfile);
      }
      const parts = [
        "=== EXPERT WRITER FOUNDATION ===",
        "You are an expert writer with deep knowledge of narrative craft, character development, dialogue, pacing, and storytelling techniques.",
        "",
        baseContent
      ];
      if (genreEnhancements) {
        parts.push("");
        parts.push(genreEnhancements);
      }
      parts.push("");
      parts.push("=== APPLYING EXPERT KNOWLEDGE ===");
      parts.push("Use these expert principles as your foundation. Then apply the user's specific style, voice, and preferences (provided below) to create writing that is both expertly crafted AND matches their unique voice.");
      return parts.join("\n");
    }
    /**
     * Clear cache (useful for testing or when story profile changes significantly)
     */
    clearCache() {
      this.cache = {
        genreEnhancements: {},
        lastCacheTime: null
      };
    }
  };
  var expertWriterService_default = new ExpertWriterService();

  // src/services/characterTimelineService.js
  init_database();
  var CharacterTimelineService = class {
    /**
     * Add timeline event for a character
     */
    async addTimelineEvent(actorId, eventType, data, chapterId = null) {
      try {
        const event = {
          id: `timeline_${actorId}_${Date.now()}`,
          actorId,
          chapterId,
          eventType,
          // 'skill_acquired', 'item_gained', 'item_lost', 'mood_change', 'relationship_change', 'stat_change', 'event'
          data,
          // Event-specific data
          timestamp: Date.now(),
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        await database_default.add("characterTimelines", event);
        return event;
      } catch (error) {
        console.error("Error adding timeline event:", error);
        throw error;
      }
    }
    /**
     * Get timeline for a character
     */
    async getCharacterTimeline(actorId) {
      try {
        const allEvents = await database_default.getAll("characterTimelines");
        return allEvents.filter((event) => event.actorId === actorId).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      } catch (error) {
        console.error("Error getting character timeline:", error);
        return [];
      }
    }
    /**
     * Track skill acquisition
     */
    async trackSkillAcquisition(actorId, skillId, skillName, chapterId = null) {
      return this.addTimelineEvent(actorId, "skill_acquired", {
        skillId,
        skillName,
        description: `Acquired skill: ${skillName}`
      }, chapterId);
    }
    /**
     * Track item change
     */
    async trackItemChange(actorId, itemId, itemName, changeType, chapterId = null) {
      return this.addTimelineEvent(actorId, changeType === "gained" ? "item_gained" : "item_lost", {
        itemId,
        itemName,
        changeType,
        description: `${changeType === "gained" ? "Gained" : "Lost"} item: ${itemName}`
      }, chapterId);
    }
    /**
     * Track stat change
     */
    async trackStatChange(actorId, statName, oldValue, newValue, chapterId = null) {
      return this.addTimelineEvent(actorId, "stat_change", {
        statName,
        oldValue,
        newValue,
        description: `${statName}: ${oldValue} \u2192 ${newValue}`
      }, chapterId);
    }
    /**
     * Track relationship change
     */
    async trackRelationshipChange(actorId, otherActorId, otherActorName, relationshipType, chapterId = null) {
      return this.addTimelineEvent(actorId, "relationship_change", {
        otherActorId,
        otherActorName,
        relationshipType,
        description: `Relationship with ${otherActorName}: ${relationshipType}`
      }, chapterId);
    }
    /**
     * Track custom event
     */
    async trackEvent(actorId, description, eventData = {}, chapterId = null) {
      return this.addTimelineEvent(actorId, "event", {
        description,
        ...eventData
      }, chapterId);
    }
    /**
     * Get timeline summary for character (last N events)
     */
    async getTimelineSummary(actorId, limit = 10) {
      const timeline = await this.getCharacterTimeline(actorId);
      return timeline.slice(-limit);
    }
  };
  var characterTimelineService_default = new CharacterTimelineService();

  // src/services/smartContextEngine.js
  var SmartContextEngine = class {
    constructor() {
      this.cache = {
        storyProfile: null,
        characterVoices: {},
        worldRules: null,
        recentContext: null,
        lastCacheTime: null
      };
      this.cacheTimeout = 6e4;
    }
    /**
     * Clear all cached data
     */
    clearCache() {
      this.cache = {
        storyProfile: null,
        characterVoices: {},
        worldRules: null,
        recentContext: null,
        lastCacheTime: null
      };
    }
    /**
     * Check if cache is valid
     */
    isCacheValid() {
      return this.cache.lastCacheTime && Date.now() - this.cache.lastCacheTime < this.cacheTimeout;
    }
    /**
     * Get full story profile with all wizard data
     */
    async getFullStoryProfile() {
      if (this.isCacheValid() && this.cache.storyProfile) {
        return this.cache.storyProfile;
      }
      const profile = await contextEngine_default.getStoryProfile();
      this.cache.storyProfile = profile;
      this.cache.lastCacheTime = Date.now();
      return profile;
    }
    /**
     * Get voice profile for a character (by name or ID)
     */
    async getCharacterVoice(characterNameOrId) {
      if (this.cache.characterVoices[characterNameOrId]) {
        return this.cache.characterVoices[characterNameOrId];
      }
      let voice = await contextEngine_default.getCharacterVoice(characterNameOrId);
      if (!voice) {
        const actors = await database_default.getAll("actors");
        const actor = actors.find(
          (a) => {
            var _a;
            return a.name.toLowerCase() === characterNameOrId.toLowerCase() || ((_a = a.nicknames) == null ? void 0 : _a.some((n) => n.toLowerCase() === characterNameOrId.toLowerCase()));
          }
        );
        if (actor) {
          voice = await contextEngine_default.getCharacterVoice(actor.id);
        }
      }
      if (voice) {
        this.cache.characterVoices[characterNameOrId] = voice;
      }
      return voice;
    }
    /**
     * Get all character voices for a list of characters
     */
    async getAllCharacterVoices(characterNames = []) {
      const voices = {};
      for (const name of characterNames) {
        const voice = await this.getCharacterVoice(name);
        if (voice) {
          voices[name] = voice;
        }
      }
      return voices;
    }
    /**
     * Get world rules and constraints
     */
    async getWorldRules() {
      if (this.isCacheValid() && this.cache.worldRules) {
        return this.cache.worldRules;
      }
      const rules = await contextEngine_default.getWorldRules();
      this.cache.worldRules = rules;
      return rules;
    }
    /**
     * Detect characters mentioned in text
     */
    async detectCharactersInText(text) {
      var _a;
      const actors = await database_default.getAll("actors");
      const mentioned = [];
      for (const actor of actors) {
        if (text.toLowerCase().includes(actor.name.toLowerCase())) {
          mentioned.push(actor);
          continue;
        }
        if ((_a = actor.nicknames) == null ? void 0 : _a.some(
          (nick) => text.toLowerCase().includes(nick.toLowerCase())
        )) {
          mentioned.push(actor);
        }
      }
      return mentioned;
    }
    /**
     * Check if dialogue matches a character's voice profile
     */
    async checkDialogueVoice(dialogue, characterName) {
      const voice = await this.getCharacterVoice(characterName);
      if (!voice) {
        return {
          hasProfile: false,
          matches: null,
          suggestions: null
        };
      }
      const voiceDescription = this.formatVoiceProfile(voice);
      try {
        const response = await aiService_default.callAI(`
        You are a dialogue voice checker. Analyze if this dialogue matches the character's voice profile.

        CHARACTER: ${characterName}
        VOICE PROFILE:
        ${voiceDescription}

        DIALOGUE TO CHECK:
        "${dialogue}"

        Respond in JSON format:
        {
          "matchScore": 0-100,
          "matches": true/false,
          "issues": ["issue1", "issue2"],
          "suggestions": ["suggestion1", "suggestion2"],
          "rewriteSuggestion": "optional rewrite that better matches the voice"
        }
      `, "analytical");
        return {
          hasProfile: true,
          ...JSON.parse(response)
        };
      } catch (error) {
        console.error("Voice check error:", error);
        return {
          hasProfile: true,
          matches: null,
          error: error.message
        };
      }
    }
    /**
     * Format voice profile for AI consumption
     */
    formatVoiceProfile(voice) {
      if (!voice) return "No voice profile available";
      const parts = [];
      if (voice.characterName) parts.push(`Character: ${voice.characterName}`);
      if (voice.role) parts.push(`Role: ${voice.role}`);
      if (voice.description) parts.push(`Description: ${voice.description}`);
      if (voice.speechPatterns) {
        if (voice.speechPatterns.vocabulary)
          parts.push(`Vocabulary: ${voice.speechPatterns.vocabulary}`);
        if (voice.speechPatterns.sentenceStructure)
          parts.push(`Sentence style: ${voice.speechPatterns.sentenceStructure}`);
        if (voice.speechPatterns.quirks)
          parts.push(`Speech quirks: ${voice.speechPatterns.quirks.join(", ")}`);
      }
      if (voice.tone) {
        if (voice.tone.default) parts.push(`Default tone: ${voice.tone.default}`);
        if (voice.tone.underStress) parts.push(`Under stress: ${voice.tone.underStress}`);
      }
      if (voice.exampleDialogue && voice.exampleDialogue.length > 0) {
        parts.push(`Example dialogue: ${voice.exampleDialogue.slice(0, 3).join(" | ")}`);
      }
      return parts.join("\n");
    }
    /**
     * Get smart context for the current writing position
     * Returns relevant characters, items, rules based on what's in the current paragraph
     */
    async getSmartContextForText(text, chapterNumber = null) {
      const [
        storyProfile,
        worldRules,
        plotBeats,
        mentionedCharacters
      ] = await Promise.all([
        this.getFullStoryProfile(),
        this.getWorldRules(),
        contextEngine_default.getPlotBeatsForChapter(chapterNumber),
        this.detectCharactersInText(text)
      ]);
      const characterVoices = {};
      for (const char of mentionedCharacters) {
        const voice = await this.getCharacterVoice(char.id);
        if (voice) characterVoices[char.name] = voice;
      }
      const relevantItems = [];
      const allItems = await database_default.getAll("itemBank");
      for (const char of mentionedCharacters) {
        if (char.inventory) {
          char.inventory.forEach((itemId) => {
            const item = allItems.find((i) => i.id === itemId);
            if (item) relevantItems.push({ ...item, heldBy: char.name });
          });
        }
      }
      const relevantSkills = [];
      const allSkills = await database_default.getAll("skillBank");
      for (const char of mentionedCharacters) {
        if (char.activeSkills) {
          char.activeSkills.forEach((skill) => {
            const skillDef = allSkills.find((s) => s.id === skill.id);
            if (skillDef) relevantSkills.push({ ...skillDef, usedBy: char.name, level: skill.val });
          });
        }
      }
      return {
        storyProfile,
        worldRules,
        plotBeats: plotBeats.filter((b) => !b.completed),
        mentionedCharacters,
        characterVoices,
        relevantItems,
        relevantSkills,
        contextGeneratedAt: Date.now()
      };
    }
    /**
     * Get negative examples (what NOT to do)
     */
    async getNegativeExamples(moodPreset = null) {
      try {
        let examples = await database_default.getAll("negativeExamples");
        if (moodPreset) {
          examples = examples.filter(
            (ex) => !ex.moodPreset || ex.moodPreset === moodPreset
          );
        }
        examples = examples.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 10);
        return examples;
      } catch (error) {
        console.warn("Error loading negative examples:", error);
        return [];
      }
    }
    /**
     * Get style instructions (specific style rules)
     */
    async getStyleInstructions() {
      try {
        const instructions = await database_default.getAll("styleInstructions");
        return instructions.filter((inst) => inst.enabled !== false);
      } catch (error) {
        console.warn("Error loading style instructions:", error);
        return [];
      }
    }
    /**
     * Analyze current scene context from text
     */
    async analyzeSceneContext(text, chapterId, position = null) {
      try {
        if (!text || text.trim().length < 50) return null;
        const recentText = text.slice(-1e3);
        const mentionedChars = await this.detectCharactersInText(recentText);
        const characterNames = mentionedChars.map((c) => c.name);
        const prompt = `Analyze this scene and provide context:

TEXT:
"""
${recentText}
"""

Provide a brief analysis in JSON format:
{
  "whatsHappening": "Brief description of what's happening (action/dialogue/description)",
  "presentCharacters": ["character1", "character2"],
  "emotionalTone": "tone of the scene",
  "pacing": "fast/medium/slow",
  "affectsFuture": "How this scene affects future plot/characters"
}`;
        const response = await aiService_default.callAI(prompt, "analytical");
        const analysis = JSON.parse(response);
        if (chapterId) {
          const sceneContext = {
            id: `scene_${chapterId}_${Date.now()}`,
            chapterId,
            position: position || text.length,
            whatsHappening: analysis.whatsHappening || "",
            presentCharacters: analysis.presentCharacters || characterNames,
            emotionalTone: analysis.emotionalTone || "",
            pacing: analysis.pacing || "medium",
            affectsFuture: analysis.affectsFuture || "",
            updatedAt: Date.now()
          };
          await database_default.add("sceneContexts", sceneContext);
          return sceneContext;
        }
        return analysis;
      } catch (error) {
        console.warn("Error analyzing scene context:", error);
        return null;
      }
    }
    /**
     * Get scene context for current writing position
     */
    async getSceneContext(chapterId, position = null) {
      try {
        if (!chapterId) return null;
        const contexts = await database_default.getAll("sceneContexts");
        const chapterContexts = contexts.filter((ctx) => ctx.chapterId === chapterId).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        if (position !== null && chapterContexts.length > 0) {
          const closest = chapterContexts.find(
            (ctx) => ctx.position && Math.abs(ctx.position - position) < 500
          );
          if (closest) return closest;
        }
        return chapterContexts[0] || null;
      } catch (error) {
        console.warn("Error loading scene context:", error);
        return null;
      }
    }
    /**
     * Build AI prompt context with all relevant information
     * Priority order: Expert Writer → Story → Style → Instructions → References → Negative → Mood → Scene → Characters → Plot → Previous → World
     */
    async buildAIContext(options = {}) {
      var _a, _b, _c, _d, _e, _f, _g;
      const {
        text = "",
        chapterNumber = null,
        bookId = null,
        chapterId = null,
        includeFullChapter = false,
        includeAllCharacters = false,
        moodSettings = null,
        moodPreset = null,
        contextOptions = {
          includePlotBeats: true,
          includeCharacterArcs: true,
          includeTimeline: true,
          includeDecisions: true,
          includeCallbacks: true,
          includeMemories: true,
          includeAISuggestions: true,
          includeStorylines: true
        }
      } = options;
      const context = await this.getSmartContextForText(text, chapterNumber);
      const parts = [];
      try {
        const expertContext = await expertWriterService_default.getExpertWriterContext(context.storyProfile);
        if (expertContext) {
          parts.push(expertContext);
        }
      } catch (error) {
        console.warn("Error loading expert writer context:", error);
      }
      if (context.storyProfile) {
        parts.push("\n=== YOUR STORY'S FOUNDATION ===");
        parts.push(`Title: ${context.storyProfile.title || "Untitled"}`);
        parts.push(`Genre: ${((_a = context.storyProfile.genres) == null ? void 0 : _a.join(", ")) || context.storyProfile.genre || "Unknown"}`);
        parts.push(`Premise: ${context.storyProfile.premise || "Not set"}`);
        if (context.storyProfile.tone) parts.push(`Tone: ${context.storyProfile.tone}`);
        if (context.storyProfile.comparisons) parts.push(`Style Comparisons: ${context.storyProfile.comparisons}`);
      }
      if ((_b = context.storyProfile) == null ? void 0 : _b.styleProfile) {
        parts.push("\n=== YOUR WRITING STYLE PROFILE ===");
        const sp = context.storyProfile.styleProfile;
        if (sp.voiceProfile) {
          if (sp.voiceProfile.narratorTone) parts.push(`Narrator Tone: ${sp.voiceProfile.narratorTone}`);
          if (sp.voiceProfile.sentenceStructure) parts.push(`Sentence Structure: ${sp.voiceProfile.sentenceStructure}`);
          if (sp.voiceProfile.vocabularyLevel) parts.push(`Vocabulary Level: ${sp.voiceProfile.vocabularyLevel}`);
          if (((_c = sp.voiceProfile.humorStyle) == null ? void 0 : _c.length) > 0) {
            parts.push(`Humor Style: ${sp.voiceProfile.humorStyle.join(", ")}`);
          }
          if (((_d = sp.voiceProfile.uniquePatterns) == null ? void 0 : _d.length) > 0) {
            parts.push(`Unique Patterns: ${sp.voiceProfile.uniquePatterns.join(", ")}`);
          }
        }
        if (sp.toneBalance) {
          parts.push(`Tone Balance: ${sp.toneBalance.comedyPercent}% comedy / ${sp.toneBalance.horrorPercent}% horror`);
          if (sp.toneBalance.emotionalDepthDescription) {
            parts.push(`Emotional Depth: ${sp.toneBalance.emotionalDepthDescription}`);
          }
        }
        if (sp.comedyRules) {
          if (((_e = sp.comedyRules.whatMakesItFunny) == null ? void 0 : _e.length) > 0) {
            parts.push(`What Makes It Funny: ${sp.comedyRules.whatMakesItFunny.join(", ")}`);
          }
          if (sp.comedyRules.comedyTiming) {
            parts.push(`Comedy Timing: ${sp.comedyRules.comedyTiming}`);
          }
          if (((_f = sp.comedyRules.neverDo) == null ? void 0 : _f.length) > 0) {
            parts.push(`Never Do: ${sp.comedyRules.neverDo.join(", ")}`);
          }
        }
        if (sp.pacing) {
          if (sp.pacing.sceneLength) parts.push(`Scene Length: ${sp.pacing.sceneLength}`);
          if (sp.pacing.actionToDialogueRatio) parts.push(`Action/Dialogue Ratio: ${sp.pacing.actionToDialogueRatio}`);
        }
      }
      try {
        const instructions = await this.getStyleInstructions();
        if (instructions.length > 0) {
          parts.push("\n=== SPECIFIC STYLE RULES (ALWAYS APPLY) ===");
          instructions.forEach((inst) => {
            parts.push(`- ${inst.instruction || inst.rule}`);
            if (inst.explanation) parts.push(`  (${inst.explanation})`);
          });
        }
      } catch (error) {
        console.warn("Error loading style instructions:", error);
      }
      try {
        const styleContext = await styleReferenceService_default.getStyleContext(bookId, 2e3);
        if (styleContext && styleContext.trim().length > 0) {
          parts.push("\n=== YOUR WRITING EXAMPLES ===");
          parts.push("Study these examples to match the writing voice exactly:");
          parts.push(styleContext);
        }
      } catch (error) {
        console.warn("Error loading style references:", error);
      }
      try {
        const negativeExamples = await this.getNegativeExamples(moodPreset);
        if (negativeExamples.length > 0) {
          parts.push("\n=== WHAT NOT TO DO ===");
          parts.push("Avoid these mistakes based on previous feedback:");
          negativeExamples.forEach((ex) => {
            var _a2, _b2;
            parts.push(`
\u274C When writing ${ex.moodPreset || "content"}:`);
            parts.push(`   Requested: ${ex.requested || "N/A"}`);
            parts.push(`   Problem: ${ex.problem || ((_a2 = ex.content) == null ? void 0 : _a2.substring(0, 100))}`);
            if (((_b2 = ex.tags) == null ? void 0 : _b2.length) > 0) {
              parts.push(`   Tags: ${ex.tags.join(", ")}`);
            }
            if (ex.whyWrong) {
              parts.push(`   Why wrong: ${ex.whyWrong}`);
            }
          });
        }
      } catch (error) {
        console.warn("Error loading negative examples:", error);
      }
      if (moodSettings) {
        parts.push("\n=== CURRENT MOOD SETTINGS ===");
        parts.push(`Comedy/Horror: ${moodSettings.comedy_horror || 50}%`);
        parts.push(`Tension: ${moodSettings.tension || 50}%`);
        parts.push(`Pacing: ${moodSettings.pacing || 50}%`);
        parts.push(`Detail: ${moodSettings.detail || 50}%`);
        parts.push(`Emotional: ${moodSettings.emotional || 50}%`);
        if (moodSettings.darkness) parts.push(`Darkness: ${moodSettings.darkness}%`);
        if (moodSettings.absurdity) parts.push(`Absurdity: ${moodSettings.absurdity}%`);
        if (moodSettings.formality) parts.push(`Formality: ${moodSettings.formality}%`);
        parts.push("\nApply these mood characteristics EXACTLY to the writing.");
      }
      try {
        const sceneContext = await this.getSceneContext(chapterId);
        if (sceneContext) {
          parts.push("\n=== CURRENT SCENE CONTEXT ===");
          parts.push(`What's happening: ${sceneContext.whatsHappening || "Not specified"}`);
          if (((_g = sceneContext.presentCharacters) == null ? void 0 : _g.length) > 0) {
            parts.push(`Present: ${sceneContext.presentCharacters.join(", ")}`);
          }
          if (sceneContext.emotionalTone) {
            parts.push(`Emotional tone: ${sceneContext.emotionalTone}`);
          }
          if (sceneContext.pacing) {
            parts.push(`Pacing: ${sceneContext.pacing}`);
          }
          if (sceneContext.affectsFuture) {
            parts.push(`Affects future: ${sceneContext.affectsFuture}`);
          }
        }
      } catch (error) {
        console.warn("Error loading scene context:", error);
      }
      if (context.mentionedCharacters.length > 0 || includeAllCharacters) {
        parts.push("\n=== CHARACTER VOICES ===");
        const characters = includeAllCharacters ? await database_default.getAll("actors") : context.mentionedCharacters;
        for (const char of characters) {
          parts.push(`
${char.name} (${char.class || char.role || "Character"}):`);
          if (char.desc || char.description) parts.push(`  ${char.desc || char.description}`);
          const voice = context.characterVoices[char.name];
          if (voice) {
            parts.push(`  Voice Profile:`);
            const voiceFormatted = this.formatVoiceProfile(voice);
            voiceFormatted.split("\n").forEach((line) => {
              if (line.trim()) parts.push(`    ${line}`);
            });
          }
          try {
            const timeline = await characterTimelineService_default.getTimelineSummary(char.id, 5);
            if (timeline.length > 0) {
              parts.push(`  Recent Changes:`);
              timeline.forEach((event) => {
                var _a2;
                parts.push(`    - ${((_a2 = event.data) == null ? void 0 : _a2.description) || event.eventType}`);
              });
            }
          } catch (error) {
          }
        }
      }
      if (bookId && chapterId) {
        try {
          const manuscriptContextEngine2 = (await Promise.resolve().then(() => (init_manuscriptContextEngine(), manuscriptContextEngine_exports))).default;
          const callbackMemoryService2 = (await Promise.resolve().then(() => (init_callbackMemoryService(), callbackMemoryService_exports))).default;
          const manuscriptContext = await manuscriptContextEngine2.buildManuscriptContext(bookId, chapterId);
          const callbacks = await callbackMemoryService2.getCallbacksForChapter(chapterId);
          const memories = await callbackMemoryService2.getRelevantMemories(chapterId);
          const decisions = await callbackMemoryService2.getDecisionContext(chapterId);
          if (manuscriptContext.chapterFlow && manuscriptContext.chapterFlow.chapters.length > 0) {
            parts.push("\n=== CHAPTER FLOW CONTEXT ===");
            parts.push(`Book: ${manuscriptContext.chapterFlow.bookTitle || "Unknown"}`);
            parts.push(`Total chapters: ${manuscriptContext.chapterFlow.chapters.length}`);
            const currentChapter = manuscriptContext.chapterFlow.chapters.find((ch) => ch.id === chapterId);
            if (currentChapter) {
              parts.push(`Current chapter: ${currentChapter.number} - ${currentChapter.title || "Untitled"}`);
            }
          }
          if (manuscriptContext.plotBeats && manuscriptContext.plotBeats.length > 0) {
            parts.push("\n=== PLOT TIMELINE CONTEXT ===");
            parts.push(`Relevant plot beats: ${manuscriptContext.plotBeats.length}`);
            manuscriptContext.plotBeats.slice(0, 5).forEach((beat, idx) => {
              parts.push(`
Beat ${idx + 1}: ${beat.beat || beat.title || "Untitled"}`);
              if (beat.purpose) parts.push(`  Purpose: ${beat.purpose}`);
              if (beat.characters && beat.characters.length > 0) {
                parts.push(`  Characters: ${beat.characters.join(", ")}`);
              }
              if (beat.emotionalTone) parts.push(`  Tone: ${beat.emotionalTone}`);
            });
          }
          if (manuscriptContext.characterArcs && manuscriptContext.characterArcs.length > 0) {
            parts.push("\n=== CHARACTER ARCS CONTEXT ===");
            manuscriptContext.characterArcs.forEach((arc) => {
              parts.push(`
${arc.characterName}:`);
              if (arc.moments && arc.moments.length > 0) {
                parts.push(`  Recent moments: ${arc.moments.length}`);
                arc.moments.slice(0, 3).forEach((moment) => {
                  parts.push(`    - ${moment.moment || moment.description || "Arc moment"}`);
                });
              }
              if (arc.goals && arc.goals.length > 0) {
                parts.push(`  Goals: ${arc.goals.map((g) => g.goal || g).join(", ")}`);
              }
            });
          }
          if (manuscriptContext.timeline && manuscriptContext.timeline.length > 0) {
            parts.push("\n=== MASTER TIMELINE CONTEXT ===");
            parts.push(`Recent events: ${manuscriptContext.timeline.length}`);
            manuscriptContext.timeline.slice(0, 5).forEach((event) => {
              parts.push(`- ${event.title || event.description || "Event"}`);
              if (event.actors && event.actors.length > 0) {
                parts.push(`  Characters: ${event.actors.join(", ")}`);
              }
            });
          }
          if (decisions && decisions.length > 0) {
            parts.push("\n=== DECISION TRACKING ===");
            parts.push(`Past decisions that matter: ${decisions.length}`);
            decisions.slice(0, 3).forEach((decision) => {
              parts.push(`
Decision: ${decision.decision || decision.title}`);
              if (decision.character) parts.push(`  Made by: ${decision.character}`);
              if (decision.consequences && decision.consequences.length > 0) {
                parts.push(`  Consequences: ${decision.consequences.join(", ")}`);
              }
            });
          }
          if (contextOptions.includeCallbacks && callbacks && callbacks.length > 0) {
            parts.push("\n=== CALLBACK OPPORTUNITIES ===");
            parts.push(`Events to reference: ${callbacks.length}`);
            callbacks.slice(0, 3).forEach((callback) => {
              parts.push(`- ${callback.event || callback.description}`);
              if (callback.characters && callback.characters.length > 0) {
                parts.push(`  Characters: ${callback.characters.join(", ")}`);
              }
            });
          }
          if (contextOptions.includeMemories && memories && memories.length > 0) {
            parts.push("\n=== RELEVANT MEMORIES ===");
            parts.push(`Important memories: ${memories.length}`);
            memories.slice(0, 3).forEach((memory) => {
              parts.push(`- ${memory.event || memory.description}`);
              if (memory.emotionalTone) parts.push(`  Tone: ${memory.emotionalTone}`);
            });
          }
          if (contextOptions.includeAISuggestions && manuscriptContext.aiSuggestions && manuscriptContext.aiSuggestions.length > 0) {
            parts.push("\n=== AI SUGGESTIONS FOR THIS CHAPTER ===");
            parts.push(`Available suggestions: ${manuscriptContext.aiSuggestions.length}`);
            manuscriptContext.aiSuggestions.filter((s) => s.priority === "high" || s.confidence >= 0.7).slice(0, 5).forEach((suggestion) => {
              const suggestionText = suggestion.suggestion || suggestion.comedyMoment || suggestion.conflict || suggestion.event || suggestion.decision || "Suggestion";
              parts.push(`[${suggestion.type || "suggestion"}] ${suggestionText}`);
              if (suggestion.reasoning) parts.push(`  \u2192 ${suggestion.reasoning}`);
              if (suggestion.characters && suggestion.characters.length > 0) {
                parts.push(`  Characters: ${suggestion.characters.join(", ")}`);
              }
            });
          }
          if (contextOptions.includeStorylines && manuscriptContext.storylines && manuscriptContext.storylines.length > 0) {
            parts.push("\n=== ACTIVE STORYLINES ===");
            manuscriptContext.storylines.forEach((storyline) => {
              parts.push(`
${storyline.title || "Storyline"}:`);
              if (storyline.description) parts.push(`  ${storyline.description}`);
              if (storyline.status) parts.push(`  Status: ${storyline.status}`);
              if (storyline.characters && storyline.characters.length > 0) {
                parts.push(`  Characters: ${storyline.characters.join(", ")}`);
              }
            });
          }
        } catch (error) {
          console.warn("Error loading manuscript intelligence context:", error);
        }
      }
      if (contextOptions.includePlotBeats && context.plotBeats.length > 0) {
        parts.push("\n=== PLOT BEATS TO COVER ===");
        context.plotBeats.forEach((beat, i) => {
          parts.push(`${i + 1}. ${beat.beat}`);
          if (beat.purpose) parts.push(`   Purpose: ${beat.purpose}`);
        });
      }
      if (chapterNumber && chapterNumber > 1) {
        const prevChapter = await contextEngine_default.getFullChapter(bookId, chapterNumber - 1);
        if (prevChapter) {
          parts.push("\n=== PREVIOUS CHAPTER (excerpt) ===");
          const words = prevChapter.split(/\s+/);
          const excerpt = words.slice(-500).join(" ");
          parts.push(excerpt);
        }
      }
      if (context.worldRules) {
        parts.push("\n=== WORLD RULES & CONSTRAINTS ===");
        if (typeof context.worldRules === "string") {
          parts.push(context.worldRules);
        } else if (context.worldRules.coreRules) {
          context.worldRules.coreRules.forEach((rule) => {
            parts.push(`- ${rule.rule || rule}`);
          });
        }
      }
      if (context.relevantItems.length > 0) {
        parts.push("\n=== ITEMS IN PLAY ===");
        context.relevantItems.forEach((item) => {
          parts.push(`- ${item.name} (held by ${item.heldBy}): ${item.desc || ""}`);
        });
      }
      return {
        contextText: parts.join("\n"),
        rawContext: context
      };
    }
    /**
     * Get inline ghost text suggestion based on current text
     */
    async getGhostTextSuggestion(currentText, cursorPosition) {
      const textBeforeCursor = currentText.slice(0, cursorPosition);
      const lastParagraph = textBeforeCursor.split("\n\n").pop();
      const inDialogue = this.detectDialogueContext(lastParagraph);
      const context = await this.getSmartContextForText(lastParagraph);
      if (inDialogue.inDialogue && inDialogue.speaker) {
        const voice = await this.getCharacterVoice(inDialogue.speaker);
        if (voice) {
          try {
            const suggestion = await aiService_default.callAI(`
            Continue this dialogue as ${inDialogue.speaker}. Match their voice profile exactly.
            
            Voice Profile:
            ${this.formatVoiceProfile(voice)}
            
            Current text (continue from here):
            ${lastParagraph}
            
            Generate ONLY the next 10-20 words of dialogue, staying in character.
            Do not include quotation marks or dialogue tags.
          `, "creative");
            return {
              suggestion: suggestion.trim(),
              type: "dialogue",
              speaker: inDialogue.speaker
            };
          } catch (error) {
            console.error("Ghost text error:", error);
            return null;
          }
        }
      }
      return null;
    }
    /**
     * Detect if current text is in dialogue and who's speaking
     */
    detectDialogueContext(text) {
      const lastQuote = text.lastIndexOf('"');
      const secondLastQuote = text.lastIndexOf('"', lastQuote - 1);
      const quoteCount = (text.match(/"/g) || []).length;
      const inDialogue = quoteCount % 2 === 1;
      let speaker = null;
      if (inDialogue) {
        const beforeQuote = text.slice(0, secondLastQuote > 0 ? secondLastQuote : lastQuote);
        const saidPattern = /(\w+)\s+said|said\s+(\w+)/i;
        const match = beforeQuote.match(saidPattern);
        if (match) {
          speaker = match[1] || match[2];
        }
      }
      return { inDialogue, speaker };
    }
    /**
     * Validate content against world rules
     */
    async validateAgainstWorldRules(text) {
      const worldRules = await this.getWorldRules();
      if (!worldRules) {
        return { valid: true, issues: [] };
      }
      try {
        const response = await aiService_default.callAI(`
        Check if this text violates any of the established world rules.

        WORLD RULES:
        ${JSON.stringify(worldRules, null, 2)}

        TEXT TO CHECK:
        ${text}

        Respond in JSON format:
        {
          "valid": true/false,
          "issues": [
            {
              "rule": "which rule was violated",
              "violation": "what specifically violated it",
              "severity": "high/medium/low",
              "suggestion": "how to fix it"
            }
          ]
        }
      `, "analytical");
        return JSON.parse(response);
      } catch (error) {
        console.error("World rules validation error:", error);
        return { valid: true, issues: [], error: error.message };
      }
    }
  };
  var smartContextEngine = new SmartContextEngine();
  var smartContextEngine_default = smartContextEngine;

  // src/services/entityInterjectionService.js
  init_database();
  var EntityInterjectionService = class {
    constructor() {
      this.cache = /* @__PURE__ */ new Map();
    }
    /**
     * Interject multiple entities into selected text (NEW - supports multi-entity)
     * @param {Array} entities - Array of entity objects with {type, name, description, ...}
     * @param {string} selectedText - Selected paragraph text
     * @param {string} chapterContext - Full chapter context
     * @param {Object} moodSettings - Mood settings (from mood sliders)
     * @param {string} moodPreset - Quick mood preset (optional)
     * @param {string} customPrompt - Custom user prompt to guide AI (optional)
     * @param {number} chapterId - Chapter ID
     * @param {number} bookId - Book ID
     * @returns {Promise<Object>} Generated interjection options
     */
    async interjectEntities(entities, selectedText, chapterContext, moodSettings, moodPreset, customPrompt, chapterId, bookId) {
      try {
        const styleContext = await smartContextEngine_default.buildAIContext({
          text: chapterContext,
          chapterId,
          bookId,
          includeFullChapter: true,
          moodSettings,
          moodPreset
        });
        const prompt = this._buildMultiEntityInterjectionPrompt(
          entities,
          selectedText,
          chapterContext,
          moodSettings,
          moodPreset,
          customPrompt,
          styleContext
        );
        const response = await aiService_default.callAI(prompt, "creative");
        const options = await this.generateInterjectionOptions(
          selectedText,
          entities,
          chapterContext,
          moodSettings,
          styleContext,
          response
        );
        return {
          generatedText: response,
          options,
          originalText: selectedText
        };
      } catch (error) {
        console.error("Error interjecting entities:", error);
        throw error;
      }
    }
    /**
     * Interject an entity into selected text (LEGACY - single entity)
     * @param {string} entityType - 'actor', 'item', 'skill', 'location', 'event'
     * @param {Object} entityData - Entity data (actor, item, skill, etc.)
     * @param {string} selectedText - Selected paragraph text
     * @param {string} chapterContext - Full chapter context
     * @param {Object} moodSettings - Mood settings (from mood sliders)
     * @param {string} moodPreset - Quick mood preset (optional)
     * @param {number} chapterId - Chapter ID
     * @param {number} bookId - Book ID
     * @returns {Promise<Object>} Generated interjection options
     */
    async interjectEntity(entityType, entityData, selectedText, chapterContext, moodSettings, moodPreset, chapterId, bookId) {
      return this.interjectEntities(
        [{ ...entityData, type: entityType }],
        selectedText,
        chapterContext,
        moodSettings,
        moodPreset,
        "",
        // No custom prompt for legacy method
        chapterId,
        bookId
      );
    }
    /**
     * Build AI prompt for multi-entity interjection
     */
    _buildMultiEntityInterjectionPrompt(entities, selectedText, chapterContext, moodSettings, moodPreset, customPrompt, styleContext) {
      const entitiesByType = {};
      entities.forEach((entity) => {
        const type = entity.type || "actor";
        if (!entitiesByType[type]) entitiesByType[type] = [];
        entitiesByType[type].push(entity);
      });
      const entityDescriptions = [];
      Object.entries(entitiesByType).forEach(([type, entityList2]) => {
        entityList2.forEach((entity) => {
          const name = entity.name || "the entity";
          let desc = `- ${type.charAt(0).toUpperCase() + type.slice(1)}: ${name}`;
          if (entity.description) desc += ` (${entity.description})`;
          if (entity.role) desc += ` - Role: ${entity.role}`;
          if (entity.class) desc += ` - Class: ${entity.class}`;
          entityDescriptions.push(desc);
        });
      });
      const entityNames = entities.map((e) => e.name || "entity").join(", ");
      const entityList = entityDescriptions.join("\n");
      const moodDesc = this._buildMoodDescription(moodSettings, moodPreset);
      const contextWindow = this._extractContextWindow(selectedText, chapterContext);
      let prompt = `${styleContext}

=== YOUR TASK ===
Interject the following entities into the selected paragraph: ${entityNames}
The text should feel natural and seamless, as if these entities were always meant to be there.

SELECTED PARAGRAPH (where to interject):
"""
${selectedText}
"""

SURROUNDING CONTEXT:
"""
${contextWindow}
"""

ENTITIES TO INTERJECT:
${entityList}

MOOD REQUIREMENTS:
${moodDesc}`;
      if (customPrompt && customPrompt.trim().length > 0) {
        prompt += `

=== CUSTOM INSTRUCTIONS ===
${customPrompt}

IMPORTANT: Follow these custom instructions while interjecting the entities.`;
      }
      prompt += `

=== CRITICAL STYLE REQUIREMENTS (PRIORITY #1) ===
- Match the writing style from the style profile and references above EXACTLY
- Use the tone, humor style, and voice patterns shown in the examples
- Be witty, sarcastic, and emotionally hard-hitting as specified in the style profile
- Do NOT write generic or bland prose - match the unique voice described above
- If style examples are provided, study them carefully and match that exact voice
- The style profile is your primary reference - follow it precisely

=== CRITICAL REQUIREMENTS ===
1. **STYLE MATCHING IS PRIORITY #1** - Match the style profile EXACTLY before anything else
2. Blend the selected mood with the surrounding writing style (from style profile)
3. Integrate ${entityNames} naturally - don't force ${entities.length > 1 ? "them" : "it"}
4. Match the exact writing voice from the style context and examples
5. Maintain the flow and rhythm of the existing text
6. DO NOT repeat the original selected text - create NEW text that incorporates the entities
7. DO NOT include the original paragraph in your response - only write the new interjected content
8. If replacing: write a complete replacement paragraph that includes the entities
9. If inserting: write ONLY the new paragraph to insert (do not repeat the original)
${customPrompt ? "10. Follow the custom instructions provided above" : ""}

CRITICAL: Return ONLY the new interjected text. Do NOT repeat or include the original selected paragraph. Do NOT include any explanations or JSON formatting.`;
      return prompt;
    }
    /**
     * Build AI prompt for entity interjection (LEGACY - single entity)
     */
    _buildInterjectionPrompt(entityType, entityData, selectedText, chapterContext, moodSettings, moodPreset, styleContext) {
      const entity = entityData.entity || entityData;
      const entityName = entity.name || entityData.name || "the entity";
      const moodDesc = this._buildMoodDescription(moodSettings, moodPreset);
      const contextWindow = this._extractContextWindow(selectedText, chapterContext);
      return `${styleContext}

=== YOUR TASK ===
Interject ${entityName} (a ${entityType}) into the selected paragraph. The text should feel natural and seamless, as if ${entityName} was always meant to be there.

SELECTED PARAGRAPH (where to interject):
"""
${selectedText}
"""

SURROUNDING CONTEXT:
"""
${contextWindow}
"""

ENTITY TO INTERJECT:
- Type: ${entityType}
- Name: ${entityName}
${entity.description ? `- Description: ${entity.description}` : ""}
${entity.role ? `- Role: ${entity.role}` : ""}
${entity.class ? `- Class: ${entity.class}` : ""}

MOOD REQUIREMENTS:
${moodDesc}

=== CRITICAL STYLE REQUIREMENTS (PRIORITY #1) ===
- Match the writing style from the style profile and references above EXACTLY
- Use the tone, humor style, and voice patterns shown in the examples
- Be witty, sarcastic, and emotionally hard-hitting as specified in the style profile
- Do NOT write generic or bland prose - match the unique voice described above
- If style examples are provided, study them carefully and match that exact voice
- The style profile is your primary reference - follow it precisely

=== CRITICAL REQUIREMENTS ===
1. **STYLE MATCHING IS PRIORITY #1** - Match the style profile EXACTLY before anything else
2. Blend the selected mood with the surrounding writing style (from style profile)
3. Integrate ${entityName} naturally - don't force it
4. Match the exact writing voice from the style context and examples
5. Maintain the flow and rhythm of the existing text
6. DO NOT repeat the original selected text - create NEW text that incorporates the entity
7. DO NOT include the original paragraph in your response - only write the new interjected content
8. If replacing: write a complete replacement paragraph that includes the entity
9. If inserting: write ONLY the new paragraph to insert (do not repeat the original)

CRITICAL: Return ONLY the new interjected text. Do NOT repeat or include the original selected paragraph. Do NOT include any explanations or JSON formatting.`;
    }
    /**
     * Build mood description from settings
     */
    _buildMoodDescription(moodSettings, moodPreset) {
      if (moodPreset) {
        const presetDescriptions = {
          comedy: "FUNNY and ABSURD - use wit, sarcasm, and comedic timing",
          horror: "HORROR and DREAD - unsettling, ominous, dark",
          tense: "HIGH TENSION - urgent, anxious, on-edge",
          relaxed: "RELAXED - calm, measured, peaceful",
          fast: "FAST-PACED - snappy, quick, rapid-fire",
          slow: "SLOW - contemplative, measured, detailed",
          rich: "RICH DETAIL - sensory, immersive, vivid",
          sparse: "SPARSE - minimal, essential only",
          intense: "EMOTIONALLY INTENSE - charged, impactful",
          detached: "DETACHED - clinical, unemotional, formal",
          dark: "DARK - bleak, heavy, ominous",
          light: "LIGHT - bright, optimistic",
          absurd: "ABSURDIST - surreal, ridiculous, over-the-top",
          grounded: "GROUNDED - realistic, believable",
          formal: "FORMAL - proper, structured, dignified",
          casual: "CASUAL - conversational, relaxed"
        };
        return presetDescriptions[moodPreset] || "Balanced tone";
      }
      if (!moodSettings) return "Match surrounding style";
      const descriptions = [];
      if (moodSettings.comedy_horror < 40) descriptions.push("FUNNY and ABSURD");
      else if (moodSettings.comedy_horror > 60) descriptions.push("HORROR and DREAD");
      if (moodSettings.tension > 70) descriptions.push("HIGH TENSION");
      else if (moodSettings.tension < 30) descriptions.push("RELAXED");
      if (moodSettings.pacing > 70) descriptions.push("FAST-PACED");
      else if (moodSettings.pacing < 30) descriptions.push("SLOW");
      if (moodSettings.detail > 70) descriptions.push("RICH DETAIL");
      else if (moodSettings.detail < 30) descriptions.push("SPARSE");
      return descriptions.length > 0 ? descriptions.join(", ") : "Match surrounding style";
    }
    /**
     * Extract context window around selected text
     */
    _extractContextWindow(selectedText, chapterContext) {
      if (!chapterContext) return "";
      const selectedIndex = chapterContext.indexOf(selectedText);
      if (selectedIndex === -1) {
        return chapterContext.slice(-2e3);
      }
      const start = Math.max(0, selectedIndex - 1e3);
      const end = Math.min(chapterContext.length, selectedIndex + selectedText.length + 1e3);
      return chapterContext.slice(start, end);
    }
    /**
     * Generate multiple interjection options with different placements
     * @param {string} selectedText - Selected paragraph
     * @param {Object} entityData - Entity to interject
     * @param {string} chapterContext - Full chapter context
     * @param {Object} moodSettings - Mood settings
     * @param {string} styleContext - Style context
     * @param {string} generatedText - AI-generated text
     * @returns {Promise<Array>} Array of placement options
     */
    async generateInterjectionOptions(selectedText, entityData, chapterContext, moodSettings, styleContext, generatedText) {
      const entities = Array.isArray(entityData) ? entityData : [entityData];
      const entityNames = entities.map((e) => (e.entity || e).name || e.name || "entity").join(", ");
      const entityName = entities.length === 1 ? entityNames : "the entities";
      let cleanGeneratedText = generatedText.trim();
      if (cleanGeneratedText.includes(selectedText.trim())) {
        cleanGeneratedText = cleanGeneratedText.replace(selectedText.trim(), "").trim();
        cleanGeneratedText = cleanGeneratedText.replace(/\n{3,}/g, "\n\n").trim();
      }
      const replaceOption = {
        type: "replace",
        label: "Replace Selected Text",
        description: "Replace the selected paragraph with new text including the entities",
        text: cleanGeneratedText,
        preview: cleanGeneratedText
      };
      const beforeOption = {
        type: "insert_before",
        label: "Insert Before",
        description: "Insert new paragraph before the selection",
        text: cleanGeneratedText,
        preview: `${cleanGeneratedText}

${selectedText}`
      };
      const afterOption = {
        type: "insert_after",
        label: "Insert After",
        description: "Insert new paragraph after the selection",
        text: cleanGeneratedText,
        preview: `${selectedText}

${cleanGeneratedText}`
      };
      try {
        const blendPrompt = `${styleContext}

Modify this paragraph to naturally include ${entityNames}. Weave ${entityNames} into the existing text naturally, maintaining the original structure and flow.

Original paragraph:
"""
${selectedText}
"""

CRITICAL REQUIREMENTS:
1. Keep the original paragraph structure and most of the original wording
2. Naturally integrate ${entityNames} into the existing sentences
3. Do NOT repeat the paragraph - return ONLY the modified version
4. Maintain the exact writing style and tone
5. Make it feel like ${entityNames} ${entities.length > 1 ? "were" : "was"} always part of this paragraph

Return ONLY the modified paragraph with ${entityNames} naturally integrated (no explanations, no JSON):`;
        const blendedText = await aiService_default.callAI(blendPrompt, "creative");
        let cleanBlendedText = blendedText.trim();
        if (cleanBlendedText.includes(selectedText.trim())) {
          const parts = cleanBlendedText.split(selectedText.trim());
          if (parts.length > 1) {
            cleanBlendedText = parts.find(
              (p) => entityNames.split(", ").some((name) => p.includes(name))
            ) || cleanBlendedText;
          }
        }
        const blendOption = {
          type: "blend",
          label: "Blend Into Existing",
          description: "Weave the entities into the existing paragraph",
          text: cleanBlendedText,
          preview: cleanBlendedText
        };
        return [replaceOption, beforeOption, afterOption, blendOption];
      } catch (error) {
        console.warn("Error generating blend option:", error);
        return [replaceOption, beforeOption, afterOption];
      }
    }
    /**
     * Blend mood with surrounding style
     * @param {Object} userMood - User-selected mood settings
     * @param {string} surroundingStyle - Style of surrounding text
     * @param {Object} styleProfile - Story style profile
     * @returns {string} Blended mood description
     */
    blendMoodWithStyle(userMood, surroundingStyle, styleProfile) {
      const styleAnalysis = this._analyzeStyle(surroundingStyle);
      const blended = {
        comedy_horror: userMood.comedy_horror || styleAnalysis.comedy_horror || 50,
        tension: userMood.tension || styleAnalysis.tension || 50,
        pacing: userMood.pacing || styleAnalysis.pacing || 50,
        detail: userMood.detail || styleAnalysis.detail || 50,
        emotional: userMood.emotional || styleAnalysis.emotional || 50
      };
      return this._buildMoodDescription(blended, null);
    }
    /**
     * Analyze style characteristics from text
     */
    _analyzeStyle(text) {
      const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
      const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length;
      return {
        comedy_horror: 50,
        // Default
        tension: avgSentenceLength < 10 ? 60 : 40,
        // Short sentences = more tension
        pacing: avgSentenceLength < 8 ? 70 : 40,
        // Very short = fast pacing
        detail: text.split(",").length > sentences.length ? 70 : 40,
        // Many commas = more detail
        emotional: (text.match(/feel|emotion|heart|soul|pain|joy/g) || []).length > 2 ? 70 : 40
      };
    }
  };
  var entityInterjectionService_default = new EntityInterjectionService();

  // src/entry.js
  init_plotThreadingService();

  // src/services/narrativeArcService.js
  init_database();
  var ARC_STAGES = {
    SETUP: {
      name: "Setup",
      position: 0,
      // 0-15% of story
      maxPosition: 0.15,
      guidance: `NARRATIVE STAGE: SETUP (opening chapters)
Your job right now:
- Establish the world, the characters, and their ordinary lives
- Plant seeds (setups) that will pay off later \u2014 but subtly
- Build the reader's investment in characters before threatening them
- Introduce the story's central question or problem
- End scenes with HOOKS that make the reader curious

DO NOT: Rush to conflict. Exposition should be woven into action and dialogue, never delivered as lectures. Let the reader discover the world naturally.`,
      tensionRange: [10, 35],
      pacingBias: "measured"
    },
    INCITING: {
      name: "Inciting Incident",
      position: 0.1,
      maxPosition: 0.2,
      guidance: `NARRATIVE STAGE: INCITING INCIDENT
Your job right now:
- Something disrupts the status quo. The character's ordinary world is broken.
- This event should be IRREVERSIBLE \u2014 the character can't go back to how things were.
- The reader should feel "now the real story begins"
- Raise the central dramatic question of the story
- The character may resist the change initially

DO NOT: Make the inciting incident too small or reversible. It should change everything.`,
      tensionRange: [30, 60],
      pacingBias: "accelerating"
    },
    RISING_ACTION: {
      name: "Rising Action",
      position: 0.2,
      maxPosition: 0.45,
      guidance: `NARRATIVE STAGE: RISING ACTION (building complications)
Your job right now:
- Each chapter should raise the stakes. Things get harder, more complex, more urgent.
- Introduce COMPLICATIONS \u2014 not just obstacles, but ones that force difficult choices
- Develop relationships under pressure (alliances form, friendships are tested)
- Alternate between action and reflection \u2014 give the reader peaks and valleys
- Build toward the midpoint by making the current approach seem like it might work... then pull the rug

DO NOT: Let tension plateau. Each scene should feel like it matters more than the last. Avoid "wheel-spinning" where characters are busy but nothing changes.`,
      tensionRange: [35, 70],
      pacingBias: "building"
    },
    MIDPOINT: {
      name: "Midpoint",
      position: 0.45,
      maxPosition: 0.55,
      guidance: `NARRATIVE STAGE: MIDPOINT (the story shifts)
Your job right now:
- Something fundamentally changes. The character goes from reactive to proactive, or vice versa.
- A major revelation reframes everything the reader thought they knew
- The stakes become PERSONAL \u2014 it's no longer just about the mission, it's about the character's identity
- False victory or false defeat: either things seem to go right (then collapse) or everything falls apart (then a glimmer of hope)
- The theme of the story should crystallize here

DO NOT: Make this feel like "just another chapter." The midpoint should feel like a different story beginning within the first story.`,
      tensionRange: [55, 80],
      pacingBias: "pivoting"
    },
    COMPLICATIONS: {
      name: "Deepening Complications",
      position: 0.55,
      maxPosition: 0.75,
      guidance: `NARRATIVE STAGE: DEEPENING COMPLICATIONS (things get worse)
Your job right now:
- The antagonist (or opposing force) is winning. The character's plans are failing.
- Allies are lost, resources dwindle, time runs out
- Internal conflicts surface \u2014 the character must confront their flaws
- Subplots should be CONVERGING toward the main plot
- Every scene should close a door. Options narrow.
- Betrayals, reversals, and hard truths belong here

DO NOT: Introduce major new elements. Everything should come from what was already established. Pay off setups planted earlier.`,
      tensionRange: [60, 85],
      pacingBias: "tightening"
    },
    DARK_MOMENT: {
      name: "Dark Night of the Soul",
      position: 0.75,
      maxPosition: 0.85,
      guidance: `NARRATIVE STAGE: DARK MOMENT (all is lost)
Your job right now:
- This is the lowest point. Everything seems hopeless.
- The character faces the CORE TRUTH they've been avoiding all story
- Relationships are at their most strained
- The reader should genuinely believe failure is possible
- The character must choose: give up or find a new way forward
- What they learn here IS the theme of the story

DO NOT: Make this feel artificial. The despair must be earned by everything that came before. And leave room for the character to discover something that changes everything \u2014 but DON'T solve it yet.`,
      tensionRange: [70, 95],
      pacingBias: "compressing"
    },
    CLIMAX: {
      name: "Climax",
      position: 0.85,
      maxPosition: 0.95,
      guidance: `NARRATIVE STAGE: CLIMAX (the final confrontation)
Your job right now:
- Everything converges. All plot threads meet.
- The character applies what they learned in the dark moment
- The action should feel INEVITABLE \u2014 every choice in the story led here
- Stakes are at their highest. The reader can't look away.
- Callbacks to earlier moments should land with maximum impact
- The central dramatic question gets its answer

DO NOT: Introduce new information. Everything the character needs was already established. No deus ex machina. The resolution must come from within the story.`,
      tensionRange: [85, 100],
      pacingBias: "maximum"
    },
    RESOLUTION: {
      name: "Resolution",
      position: 0.95,
      maxPosition: 1,
      guidance: `NARRATIVE STAGE: RESOLUTION (new equilibrium)
Your job right now:
- Show the new status quo. The world has changed.
- Characters reflect on what happened. Relationships settle into new dynamics.
- Tie up loose ends \u2014 but NOT all of them. Some mystery is good.
- Echo the opening in some way (mirror scenes show how far the character has come)
- Leave the reader satisfied but thinking

DO NOT: Rush this. The reader needs time to process the climax. Don't over-explain what the story meant. Let the reader feel it.`,
      tensionRange: [20, 40],
      pacingBias: "releasing"
    }
  };
  var NarrativeArcService = class {
    /**
     * Detect where the story currently is in its narrative arc.
     * Uses chapter position, tension analysis, and plot thread status.
     *
     * @param {string} bookId
     * @param {number} currentChapter - the chapter number being written
     * @param {number} totalChapters - total planned chapters (0 = unknown)
     * @returns {object} arc stage info with guidance
     */
    async detectArcPosition(bookId, currentChapter, totalChapters = 0) {
      if (totalChapters > 0) {
        const position = currentChapter / totalChapters;
        return this._getStageForPosition(position, currentChapter, totalChapters);
      }
      return this._estimateFromContent(bookId, currentChapter);
    }
    /**
     * Get narrative guidance for the current arc position.
     * This is what gets injected into the AI context.
     */
    async getArcGuidance(bookId, currentChapter, totalChapters = 0) {
      const arcInfo = await this.detectArcPosition(bookId, currentChapter, totalChapters);
      const parts = [arcInfo.stage.guidance];
      parts.push(`
PACING: ${this._getPacingDirective(arcInfo.stage.pacingBias)}`);
      const [minTension, maxTension] = arcInfo.stage.tensionRange;
      parts.push(`TENSION TARGET: Aim for ${minTension}-${maxTension}% tension in this chapter.`);
      if (arcInfo.notes) {
        parts.push(`
ARC NOTES:
${arcInfo.notes}`);
      }
      return {
        stageName: arcInfo.stage.name,
        guidance: parts.join("\n"),
        position: arcInfo.position,
        stage: arcInfo.stage,
        tensionTarget: { min: minTension, max: maxTension }
      };
    }
    /**
     * Analyze the story's structural health.
     * Identifies pacing problems, missing beats, and opportunities.
     */
    async analyzeStructuralHealth(bookId) {
      var _a, _b;
      const memories = await chapterMemoryService_default.getAllMemories(bookId);
      if (memories.length < 2) {
        return { status: "too_early", message: "Need at least 2 chapters for structural analysis" };
      }
      const issues = [];
      const strengths = [];
      const tensions = memories.map((m) => {
        var _a2, _b2;
        return {
          chapter: m.chapterNumber,
          hasConflict: (((_a2 = m.tensions) == null ? void 0 : _a2.length) || 0) > 0,
          hasSetup: (((_b2 = m.setups) == null ? void 0 : _b2.length) || 0) > 0,
          endingState: m.endingState
        };
      });
      let flatStreak = 0;
      for (const t of tensions) {
        if (!t.hasConflict) {
          flatStreak++;
          if (flatStreak >= 3) {
            issues.push({
              type: "pacing",
              severity: "warning",
              message: `Chapters ${t.chapter - 2}-${t.chapter} have no active tensions. The story may feel stagnant.`,
              suggestion: "Introduce a complication, deadline, or interpersonal conflict."
            });
          }
        } else {
          flatStreak = 0;
        }
      }
      const allSetups = memories.flatMap((m) => (m.setups || []).map((s) => ({
        setup: s,
        chapter: m.chapterNumber
      })));
      if (allSetups.length > 0 && memories.length > 5) {
        const oldSetups = allSetups.filter((s) => s.chapter < memories.length - 3);
        if (oldSetups.length > 3) {
          issues.push({
            type: "payoff",
            severity: "info",
            message: `${oldSetups.length} setups from early chapters haven't paid off yet.`,
            suggestion: "Consider resolving some of these: " + oldSetups.slice(0, 3).map((s) => s.setup).join("; ")
          });
        }
      }
      const endingTypes = memories.map((m) => m.endingState).filter(Boolean);
      const uniqueEndings = new Set(endingTypes);
      if (endingTypes.length > 4 && uniqueEndings.size < 3) {
        issues.push({
          type: "variety",
          severity: "info",
          message: "Chapter endings feel repetitive. Vary between cliffhangers, emotional beats, revelations, and quiet moments.",
          suggestion: "Try ending the next chapter with a different type of beat."
        });
      }
      if (allSetups.length > 2) {
        strengths.push("Good use of setups and foreshadowing");
      }
      const decisionChapters = memories.filter((m) => {
        var _a2;
        return (((_a2 = m.decisions) == null ? void 0 : _a2.length) || 0) > 0;
      });
      if (decisionChapters.length / memories.length > 0.3) {
        strengths.push("Characters are making meaningful decisions regularly");
      }
      return {
        status: "analyzed",
        chapterCount: memories.length,
        issues,
        strengths,
        unresolvedSetups: allSetups.length,
        activeTensions: ((_b = (_a = memories[memories.length - 1]) == null ? void 0 : _a.tensions) == null ? void 0 : _b.length) || 0
      };
    }
    // --- Internal ---
    _getStageForPosition(position, currentChapter, totalChapters) {
      for (const [key, stage] of Object.entries(ARC_STAGES)) {
        if (position >= stage.position && position < stage.maxPosition) {
          return {
            stage,
            position,
            chapterInStage: currentChapter,
            totalChapters,
            notes: `You are writing chapter ${currentChapter} of ${totalChapters} (${Math.round(position * 100)}% through the story).`
          };
        }
      }
      return {
        stage: ARC_STAGES.RESOLUTION,
        position,
        chapterInStage: currentChapter,
        totalChapters,
        notes: `You are in the final stretch \u2014 chapter ${currentChapter} of ${totalChapters}.`
      };
    }
    async _estimateFromContent(bookId, currentChapter) {
      var _a, _b;
      const memories = await chapterMemoryService_default.getAllMemories(bookId);
      if (memories.length === 0) {
        return {
          stage: currentChapter <= 2 ? ARC_STAGES.SETUP : ARC_STAGES.RISING_ACTION,
          position: 0,
          notes: "No chapter memories available. Estimating arc position from chapter number."
        };
      }
      const totalSetups = memories.reduce((sum, m) => {
        var _a2;
        return sum + (((_a2 = m.setups) == null ? void 0 : _a2.length) || 0);
      }, 0);
      const totalTensions = memories.reduce((sum, m) => {
        var _a2;
        return sum + (((_a2 = m.tensions) == null ? void 0 : _a2.length) || 0);
      }, 0);
      const hasForwardHooks = memories.some((m) => {
        var _a2;
        return (((_a2 = m.forwardHooks) == null ? void 0 : _a2.length) || 0) > 0;
      });
      const lastMemory = memories[memories.length - 1];
      if (currentChapter <= 2) {
        return { stage: ARC_STAGES.SETUP, position: 0.05, notes: "Early chapters \u2014 establishing the world." };
      }
      if (currentChapter <= 4 && totalTensions < 3) {
        return { stage: ARC_STAGES.INCITING, position: 0.15, notes: "Disruption phase \u2014 something should change the status quo." };
      }
      const recentTensionCount = memories.slice(-3).reduce((sum, m) => {
        var _a2;
        return sum + (((_a2 = m.tensions) == null ? void 0 : _a2.length) || 0);
      }, 0);
      const earlyTensionCount = memories.slice(0, 3).reduce((sum, m) => {
        var _a2;
        return sum + (((_a2 = m.tensions) == null ? void 0 : _a2.length) || 0);
      }, 0);
      if (recentTensionCount > earlyTensionCount * 2) {
        if (((_a = lastMemory == null ? void 0 : lastMemory.endingState) == null ? void 0 : _a.includes("cliff")) || ((_b = lastMemory == null ? void 0 : lastMemory.endingState) == null ? void 0 : _b.includes("tense"))) {
          return { stage: ARC_STAGES.COMPLICATIONS, position: 0.65, notes: "Tensions escalating. Complications deepening." };
        }
        return { stage: ARC_STAGES.RISING_ACTION, position: 0.35, notes: "Stakes rising. Maintain escalation." };
      }
      return {
        stage: ARC_STAGES.RISING_ACTION,
        position: 0.3,
        notes: `Chapter ${currentChapter} with ${totalSetups} active setups and ${totalTensions} tensions.`
      };
    }
    _getPacingDirective(bias) {
      const directives = {
        measured: "Take your time. Let scenes breathe. Establish before you escalate.",
        accelerating: "Speed is increasing. Scenes should feel more urgent than before.",
        building: "Steady escalation. Each scene slightly faster, slightly higher stakes.",
        pivoting: "This is a turning point. Slow down for the revelation, then snap to new energy.",
        tightening: "Things are closing in. Shorter scenes, fewer escape routes, mounting pressure.",
        compressing: "Maximum compression. Every word should carry weight. No filler.",
        maximum: "Full speed. Short sentences. High stakes. No breaks.",
        releasing: "Slow down. Let the reader breathe. Reflection, not action."
      };
      return directives[bias] || directives.building;
    }
  };
  var narrativeArcService = new NarrativeArcService();
  var narrativeArcService_default = narrativeArcService;

  // src/entry.js
  init_worldConsistencyService();

  // src/services/characterEnhancementService.js
  init_aiService();
  init_database();
  var CharacterEnhancementService = class {
    constructor() {
      this.cache = /* @__PURE__ */ new Map();
    }
    /**
     * Enhance a character from extracted entity data
     * @param {Object} entityData - Basic character data from extraction
     * @param {string} chapterText - Full chapter text for context
     * @param {Object} worldState - Current world state (actors, items, skills, statRegistry)
     * @param {number} chapterId - Chapter ID
     * @param {number} bookId - Book ID
     * @returns {Promise<Object>} Enhanced character data with all fields filled
     */
    async enhanceCharacterFromText(entityData, chapterText, worldState, chapterId, bookId) {
      try {
        const styleContext = await smartContextEngine_default.buildAIContext({
          text: chapterText,
          chapterId,
          bookId,
          includeFullChapter: false
        });
        const storyProfile = await smartContextEngine_default.getFullStoryProfile();
        const prompt = this._buildEnhancementPrompt(
          entityData,
          chapterText,
          worldState,
          styleContext,
          storyProfile
        );
        const response = await aiService_default.callAI(prompt, "structured");
        const enhanced = this._parseEnhancementResponse(response, entityData, worldState);
        return enhanced;
      } catch (error) {
        console.error("Error enhancing character:", error);
        return this._createDefaultEnhancement(entityData, worldState);
      }
    }
    /**
     * Build the AI prompt for character enhancement
     */
    _buildEnhancementPrompt(entityData, chapterText, worldState, styleContext, storyProfile) {
      var _a;
      const entity = entityData.entity || entityData;
      const existingActors = worldState.actors || [];
      const availableSkills = worldState.skillBank || [];
      const availableItems = worldState.itemBank || [];
      const statRegistry = worldState.statRegistry || [];
      const characterMentions = this._extractCharacterContext(chapterText, entity.name);
      const statInfo = statRegistry.map((s) => `${s.key} (${s.name}): ${s.desc}`).join(", ");
      return `${styleContext}

=== YOUR TASK ===
You are creating a complete character profile for a new character in this story. Use ALL available context to create a rich, detailed character that fits perfectly into this world.

CHARACTER BASIC INFO:
- Name: ${entity.name}
- Role: ${entity.role || "NPC"}
- Class: ${entity.class || "Unknown"}
- Description from text: ${entity.description || entity.desc || "Minimal description"}

CHAPTER CONTEXT (where character appears):
"""
${characterMentions}
"""

EXISTING CHARACTERS (for consistency):
${existingActors.slice(0, 10).map((a) => `- ${a.name} (${a.role || "NPC"}, ${a.class || "Unknown"})`).join("\n")}

AVAILABLE STATS:
${statInfo || "STR (Strength), VIT (Vitality), INT (Intelligence), DEX (Dexterity)"}

AVAILABLE SKILLS (examples):
${availableSkills.slice(0, 15).map((s) => `- ${s.name} (${s.type})`).join("\n")}

AVAILABLE ITEMS (examples):
${availableItems.slice(0, 15).map((i) => `- ${i.name} (${i.rarity || "Common"})`).join("\n")}

STORY GENRE/TONE:
${((_a = storyProfile == null ? void 0 : storyProfile.genres) == null ? void 0 : _a.join(", ")) || "Fantasy"}
${(storyProfile == null ? void 0 : storyProfile.tone) ? `Tone: ${storyProfile.tone}` : ""}
${(storyProfile == null ? void 0 : storyProfile.comparisons) ? `Comparisons: ${storyProfile.comparisons}` : ""}

=== REQUIREMENTS ===

1. STATS: Generate appropriate base stats based on:
   - Character class/role (warrior = high STR/VIT, mage = high INT, rogue = high DEX)
   - What they do in the text (if mentioned)
   - Story context and genre
   - Stat values should be 8-18 range for starting characters
   - Total stat points should be reasonable (40-60 total)

2. SKILLS: Assign 3-5 starting skills based on:
   - Character class/role
   - What they do in the chapter text
   - Skills should match available skills from the skill bank when possible
   - If no matching skills, suggest appropriate skill names that fit the world

3. EQUIPMENT: Assign story-relevant equipment (not random):
   - Based on character class/role
   - Based on what makes sense for the story context
   - Start with 2-4 items (realistic for a new character)
   - Prefer items from available item bank when appropriate
   - Equipment should tell a story (e.g., "worn leather armor" suggests a traveler)

4. BIOGRAPHY: Create a full character profile (1-2 paragraphs):
   - Personality traits
   - Background/motivations
   - Relationships to other characters (if any)
   - Role in the story
   - Physical appearance (if not detailed in text)
   - Use the writing style from the style context above

5. NICKNAMES: Generate 3-5 appropriate nicknames:
   - Based on character traits, appearance, or role
   - Should fit the story tone (witty, dark, etc. as per style)
   - Can be formal, informal, or descriptive

Return JSON in this EXACT format:
{
  "stats": {
    "STR": 12,
    "VIT": 10,
    "INT": 8,
    "DEX": 14
  },
  "skills": [
    {"id": "skill_id_or_name", "name": "Skill Name", "level": 1},
    {"id": "skill_id_or_name", "name": "Skill Name", "level": 1}
  ],
  "equipment": {
    "armour": "item_id_or_name",
    "leftHand": "item_id_or_name"
  },
  "biography": "Full 1-2 paragraph biography...",
  "nicknames": ["Nickname 1", "Nickname 2", "Nickname 3"],
  "appearance": "Physical description if not in text..."
}

IMPORTANT: Match the writing style and tone from the style context. Be consistent with the world and existing characters.`;
    }
    /**
     * Extract context from chapter text mentioning the character
     */
    _extractCharacterContext(chapterText, characterName) {
      if (!chapterText || !characterName) return "";
      const nameLower = characterName.toLowerCase();
      const sentences = chapterText.split(/[.!?]+/);
      const relevantSentences = sentences.filter(
        (s) => s.toLowerCase().includes(nameLower)
      );
      const context = relevantSentences.join(". ").slice(-2e3);
      return context || chapterText.slice(-1e3);
    }
    /**
     * Parse AI response and validate/enhance with world state
     */
    _parseEnhancementResponse(response, entityData, worldState) {
      var _a;
      try {
        let parsed;
        if (typeof response === "string") {
          const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
          if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[1]);
          } else {
            parsed = JSON.parse(response);
          }
        } else {
          parsed = response;
        }
        const enhanced = {
          stats: this._validateStats(parsed.stats || {}, worldState.statRegistry),
          skills: this._validateSkills(parsed.skills || [], worldState.skillBank),
          equipment: this._validateEquipment(parsed.equipment || {}, worldState.itemBank),
          biography: parsed.biography || ((_a = entityData.entity) == null ? void 0 : _a.description) || "",
          nicknames: Array.isArray(parsed.nicknames) ? parsed.nicknames : [],
          appearance: parsed.appearance || ""
        };
        return enhanced;
      } catch (error) {
        console.error("Error parsing enhancement response:", error);
        return this._createDefaultEnhancement(entityData, worldState);
      }
    }
    /**
     * Validate and normalize stats
     */
    _validateStats(stats, statRegistry) {
      const validated = {};
      const defaultStats = ["STR", "VIT", "INT", "DEX"];
      const statKeys = statRegistry.length > 0 ? statRegistry.map((s) => s.key) : defaultStats;
      for (const key of statKeys) {
        const value = stats[key];
        if (typeof value === "number" && value >= 1 && value <= 25) {
          validated[key] = value;
        } else {
          validated[key] = 10;
        }
      }
      return validated;
    }
    /**
     * Validate and match skills to existing skill bank
     */
    _validateSkills(skills, skillBank) {
      if (!Array.isArray(skills)) return [];
      return skills.map((skill) => {
        const matched = skillBank.find(
          (s) => s.name.toLowerCase() === (skill.name || skill).toLowerCase() || s.id === skill.id
        );
        if (matched) {
          return {
            id: matched.id,
            name: matched.name,
            level: typeof skill.level === "number" ? skill.level : 1
          };
        }
        return {
          id: skill.id || `skill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: skill.name || skill,
          level: typeof skill.level === "number" ? skill.level : 1
        };
      }).slice(0, 5);
    }
    /**
     * Validate and match equipment to existing item bank
     */
    _validateEquipment(equipment, itemBank) {
      if (!equipment || typeof equipment !== "object") return {};
      const validated = {};
      const equipmentSlots = ["helm", "cape", "amulet", "armour", "gloves", "belt", "boots", "leftHand", "rightHand"];
      for (const slot of equipmentSlots) {
        const itemRef = equipment[slot];
        if (!itemRef) continue;
        const matched = itemBank.find(
          (i) => i.name.toLowerCase() === String(itemRef).toLowerCase() || i.id === itemRef
        );
        if (matched) {
          validated[slot] = matched.id;
        } else {
          validated[slot] = itemRef;
        }
      }
      return validated;
    }
    /**
     * Create default enhancement if AI fails
     */
    _createDefaultEnhancement(entityData, worldState) {
      const entity = entityData.entity || entityData;
      const statRegistry = worldState.statRegistry || [];
      const defaultStats = statRegistry.length > 0 ? statRegistry.reduce((acc, stat) => {
        acc[stat.key] = 10;
        return acc;
      }, {}) : { STR: 10, VIT: 10, INT: 10, DEX: 10 };
      return {
        stats: defaultStats,
        skills: [],
        equipment: {},
        biography: entity.description || entity.desc || `A ${entity.role || "character"} in the story.`,
        nicknames: [],
        appearance: ""
      };
    }
    /**
     * Generate character stats based on class/role
     * @param {string} characterClass - Character class
     * @param {string} role - Character role
     * @param {string} textContext - Context from chapter text
     * @param {Array} statRegistry - Available stats
     * @returns {Promise<Object>} Generated stats
     */
    async generateCharacterStats(characterClass, role, textContext, statRegistry) {
      const classLower = (characterClass || "").toLowerCase();
      const roleLower = (role || "").toLowerCase();
      const stats = {};
      const statKeys = statRegistry.length > 0 ? statRegistry.map((s) => s.key) : ["STR", "VIT", "INT", "DEX"];
      if (classLower.includes("warrior") || classLower.includes("fighter") || classLower.includes("knight")) {
        statKeys.forEach((key) => {
          if (key === "STR" || key === "VIT") stats[key] = 14;
          else if (key === "DEX") stats[key] = 12;
          else stats[key] = 8;
        });
      } else if (classLower.includes("mage") || classLower.includes("wizard") || classLower.includes("sorcerer")) {
        statKeys.forEach((key) => {
          if (key === "INT") stats[key] = 16;
          else if (key === "VIT") stats[key] = 9;
          else stats[key] = 10;
        });
      } else if (classLower.includes("rogue") || classLower.includes("thief") || classLower.includes("assassin")) {
        statKeys.forEach((key) => {
          if (key === "DEX") stats[key] = 15;
          else if (key === "STR") stats[key] = 11;
          else stats[key] = 9;
        });
      } else {
        statKeys.forEach((key) => {
          stats[key] = 10;
        });
      }
      return stats;
    }
    /**
     * Generate character skills based on class/role
     * @param {string} characterClass - Character class
     * @param {string} role - Character role
     * @param {Array} skillBank - Available skills
     * @param {Object} worldState - World state
     * @returns {Promise<Array>} Generated skills
     */
    async generateCharacterSkills(characterClass, role, skillBank, worldState) {
      const classLower = (characterClass || "").toLowerCase();
      const roleLower = (role || "").toLowerCase();
      let relevantSkills = skillBank || [];
      if (classLower.includes("warrior") || classLower.includes("fighter")) {
        relevantSkills = skillBank.filter(
          (s) => s.type === "Combat" || s.name.toLowerCase().includes("combat") || s.name.toLowerCase().includes("weapon")
        );
      } else if (classLower.includes("mage") || classLower.includes("wizard")) {
        relevantSkills = skillBank.filter(
          (s) => s.type === "Magic" || s.name.toLowerCase().includes("magic") || s.name.toLowerCase().includes("spell")
        );
      } else if (classLower.includes("rogue") || classLower.includes("thief")) {
        relevantSkills = skillBank.filter(
          (s) => s.type === "Utility" || s.name.toLowerCase().includes("stealth") || s.name.toLowerCase().includes("lock")
        );
      }
      const selected = relevantSkills.sort(() => Math.random() - 0.5).slice(0, Math.min(5, Math.max(3, relevantSkills.length))).map((skill) => ({
        id: skill.id,
        name: skill.name,
        level: 1
      }));
      return selected;
    }
    /**
     * Generate character equipment based on class/role and story context
     * @param {string} characterClass - Character class
     * @param {string} role - Character role
     * @param {Array} itemBank - Available items
     * @param {string} storyContext - Story context
     * @returns {Promise<Object>} Generated equipment
     */
    async generateCharacterEquipment(characterClass, role, itemBank, storyContext) {
      const classLower = (characterClass || "").toLowerCase();
      const equipment = {};
      const commonItems = (itemBank || []).filter(
        (i) => i.rarity === "Common" || !i.rarity
      );
      if (classLower.includes("warrior") || classLower.includes("fighter")) {
        const armor = commonItems.find(
          (i) => {
            var _a;
            return ((_a = i.type) == null ? void 0 : _a.toLowerCase().includes("armor")) || i.name.toLowerCase().includes("armor");
          }
        );
        const weapon = commonItems.find(
          (i) => {
            var _a;
            return ((_a = i.type) == null ? void 0 : _a.toLowerCase().includes("weapon")) || i.name.toLowerCase().includes("sword") || i.name.toLowerCase().includes("axe");
          }
        );
        if (armor) equipment.armour = armor.id;
        if (weapon) equipment.rightHand = weapon.id;
      } else if (classLower.includes("mage") || classLower.includes("wizard")) {
        const staff = commonItems.find(
          (i) => i.name.toLowerCase().includes("staff") || i.name.toLowerCase().includes("wand")
        );
        const robe = commonItems.find(
          (i) => i.name.toLowerCase().includes("robe") || i.name.toLowerCase().includes("cloak")
        );
        if (staff) equipment.rightHand = staff.id;
        if (robe) equipment.armour = robe.id;
      } else if (classLower.includes("rogue") || classLower.includes("thief")) {
        const dagger = commonItems.find(
          (i) => i.name.toLowerCase().includes("dagger") || i.name.toLowerCase().includes("knife")
        );
        const leather = commonItems.find(
          (i) => i.name.toLowerCase().includes("leather")
        );
        if (dagger) equipment.leftHand = dagger.id;
        if (leather) equipment.armour = leather.id;
      }
      return equipment;
    }
    /**
     * Generate character biography
     * @param {string} name - Character name
     * @param {string} role - Character role
     * @param {string} description - Basic description
     * @param {Object} fullContext - Full context object
     * @returns {Promise<string>} Generated biography
     */
    async generateCharacterBiography(name, role, description, fullContext) {
      const { styleContext, storyProfile, chapterText } = fullContext;
      const prompt = `${styleContext}

Create a full character biography (1-2 paragraphs) for:
- Name: ${name}
- Role: ${role || "NPC"}
- Basic description: ${description || "Not specified"}

Chapter context:
"""
${(chapterText == null ? void 0 : chapterText.slice(-1e3)) || ""}
"""

Generate a rich biography that includes:
- Personality traits
- Background/motivations
- Physical appearance (if not detailed)
- Role in the story
- Relationships to other characters (if any)

Match the writing style and tone from the style context. Return only the biography text (no JSON, no explanations).`;
      try {
        const response = await aiService_default.callAI(prompt, "creative");
        return response.trim();
      } catch (error) {
        console.error("Error generating biography:", error);
        return description || `A ${role || "character"} in the story.`;
      }
    }
    /**
     * Generate nicknames for a character
     * @param {string} name - Character name
     * @param {Object} personality - Personality traits (from biography)
     * @param {string} storyTone - Story tone
     * @returns {Promise<Array>} Generated nicknames
     */
    async generateNicknames(name, personality, storyTone) {
      const prompt = `Generate 3-5 appropriate nicknames for a character named "${name}".

Personality/context: ${personality || "Not specified"}
Story tone: ${storyTone || "General"}

Nicknames should:
- Fit the character's personality or appearance
- Match the story tone (witty, dark, formal, etc.)
- Be varied (some formal, some informal, some descriptive)

Return JSON array: ["Nickname 1", "Nickname 2", "Nickname 3"]`;
      try {
        const response = await aiService_default.callAI(prompt, "structured");
        let parsed;
        if (typeof response === "string") {
          const jsonMatch = response.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0]);
          } else {
            parsed = JSON.parse(response);
          }
        } else {
          parsed = response;
        }
        return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
      } catch (error) {
        console.error("Error generating nicknames:", error);
        return [];
      }
    }
  };
  var characterEnhancementService_default = new CharacterEnhancementService();

  // src/entry.js
  init_relationshipAnalysisService();

  // src/services/personnelAnalysisService.js
  init_chapterDataExtractionService();
  init_database();
  init_aiService();
  var PersonnelAnalysisService = class {
    constructor() {
      this.analysisCache = /* @__PURE__ */ new Map();
    }
    /**
     * Analyze a chapter and update all mentioned actors' snapshots
     * @param {number} bookId - Book ID
     * @param {number} chapterId - Chapter ID
     * @param {Array} actors - All available actors
     * @param {string} chapterText - Chapter content
     * @param {Object} chapter - Chapter object (for metadata)
     * @returns {Promise<Object>} Analysis results
     */
    async analyzeChapter(bookId, chapterId, actors, chapterText, chapter = {}) {
      var _a, _b, _c, _d, _e;
      fetch("http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "personnelAnalysisService.js:24", message: "analyzeChapter called", data: { bookId, chapterId, chapterTextLength: chapterText == null ? void 0 : chapterText.length, actorsCount: actors == null ? void 0 : actors.length }, timestamp: Date.now(), sessionId: "debug-session", runId: "run1", hypothesisId: "I" }) }).catch(() => {
      });
      if (!chapterText || chapterText.trim().length < 50) {
        fetch("http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "personnelAnalysisService.js:27", message: "Chapter text too short", data: { chapterTextLength: chapterText == null ? void 0 : chapterText.length }, timestamp: Date.now(), sessionId: "debug-session", runId: "run1", hypothesisId: "I" }) }).catch(() => {
        });
        return {
          success: false,
          error: "Chapter text too short for analysis",
          updatedActors: []
        };
      }
      try {
        const timelineEvents = await chapterDataExtractionService_default.extractEventsFromChapter(
          chapterText,
          chapterId,
          bookId,
          actors
        );
        fetch("http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "personnelAnalysisService.js:40", message: "Timeline events extracted", data: { eventsCount: timelineEvents.length, events: timelineEvents.map((e) => ({ type: e.type, title: e.title, actors: e.actors })) }, timestamp: Date.now(), sessionId: "debug-session", runId: "run1", hypothesisId: "A,E" }) }).catch(() => {
        });
        const extractedData = this.convertEventsToCharacterData(timelineEvents, actors);
        fetch("http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "personnelAnalysisService.js:48", message: "Events converted to character data", data: { appearances: (_a = extractedData == null ? void 0 : extractedData.appearances) == null ? void 0 : _a.length, statChanges: (_b = extractedData == null ? void 0 : extractedData.statChanges) == null ? void 0 : _b.length, skillChanges: (_c = extractedData == null ? void 0 : extractedData.skillChanges) == null ? void 0 : _c.length, relationshipChanges: (_d = extractedData == null ? void 0 : extractedData.relationshipChanges) == null ? void 0 : _d.length }, timestamp: Date.now(), sessionId: "debug-session", runId: "run1", hypothesisId: "A,E" }) }).catch(() => {
        });
        const updatedActors = [];
        const snapKey = `${bookId}_${chapterId}`;
        const actorsInChapter = /* @__PURE__ */ new Set();
        timelineEvents.forEach((event) => {
          if (event.actors && Array.isArray(event.actors)) {
            event.actors.forEach((actorName) => {
              if (actorName && typeof actorName === "string") {
                actorsInChapter.add(actorName);
              }
            });
          }
          if (event.actorIds && Array.isArray(event.actorIds)) {
            event.actorIds.forEach((actorId) => {
              const actor = actors.find((a) => a.id === actorId);
              if (actor) actorsInChapter.add(actor.name);
            });
          }
        });
        fetch("http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "personnelAnalysisService.js:62", message: "Actors found in events", data: { actorsInChapter: Array.from(actorsInChapter), eventsCount: timelineEvents.length }, timestamp: Date.now(), sessionId: "debug-session", runId: "run1", hypothesisId: "A" }) }).catch(() => {
        });
        for (const actorName of actorsInChapter) {
          const actor = actors.find(
            (a) => a.name.toLowerCase() === actorName.toLowerCase() || (a.nicknames || []).some((n) => n.toLowerCase() === actorName.toLowerCase())
          );
          if (!actor) continue;
          const currentActor = await database_default.get("actors", actor.id);
          if (!currentActor) continue;
          const snapshotData = await this.buildSnapshotData(
            currentActor,
            bookId,
            chapterId,
            extractedData,
            chapterText
          );
          await this.updateActorSnapshot(currentActor.id, bookId, chapterId, snapshotData);
          fetch("http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "personnelAnalysisService.js:68", message: "Snapshot updated", data: { actorId: currentActor.id, actorName: currentActor.name, snapshotSkills: (_e = snapshotData == null ? void 0 : snapshotData.activeSkills) == null ? void 0 : _e.length, snapshotRelationships: Object.keys((snapshotData == null ? void 0 : snapshotData.relationships) || {}).length, skills: snapshotData == null ? void 0 : snapshotData.activeSkills, relationships: Object.keys((snapshotData == null ? void 0 : snapshotData.relationships) || {}) }, timestamp: Date.now(), sessionId: "debug-session", runId: "run1", hypothesisId: "B,F,J" }) }).catch(() => {
          });
          updatedActors.push({
            actorId: currentActor.id,
            actorName: currentActor.name,
            snapshot: snapshotData
          });
        }
        await this.processStatChanges(extractedData.statChanges || [], actors, bookId, chapterId);
        await this.processSkillChanges(extractedData.skillChanges || [], actors, bookId, chapterId);
        await this.processRelationshipChanges(extractedData.relationshipChanges || [], actors, bookId, chapterId);
        return {
          success: true,
          updatedActors,
          extractedData,
          snapKey,
          timelineEvents
          // Include original events for reference
        };
      } catch (error) {
        console.error("Error analyzing chapter:", error);
        return {
          success: false,
          error: error.message,
          updatedActors: []
        };
      }
    }
    /**
     * Build snapshot data for an actor at a specific chapter
     * @param {Object} actor - Actor object
     * @param {number} bookId - Book ID
     * @param {number} chapterId - Chapter ID
     * @param {Object} extractedData - Extracted data from chapter
     * @param {string} chapterText - Chapter text
     * @returns {Promise<Object>} Snapshot data
     */
    async buildSnapshotData(actor, bookId, chapterId, extractedData, chapterText) {
      var _a, _b;
      const snapKey = `${bookId}_${chapterId}`;
      const previousSnapshot = ((_a = actor.snapshots) == null ? void 0 : _a[snapKey]) || null;
      const baseSnapshot = previousSnapshot ? { ...previousSnapshot } : {
        baseStats: { ...actor.baseStats || {} },
        additionalStats: { ...actor.additionalStats || {} },
        activeSkills: [...actor.activeSkills || []],
        inventory: [...actor.inventory || []],
        equipment: actor.equipment ? JSON.parse(JSON.stringify(actor.equipment)) : {
          helm: null,
          cape: null,
          amulet: null,
          armour: null,
          gloves: null,
          belt: null,
          boots: null,
          leftHand: null,
          rightHand: null,
          rings: [null, null, null, null, null, null, null],
          charms: [null, null, null, null]
        },
        relationships: {}
      };
      const actorStatChanges = (extractedData.statChanges || []).find(
        (sc) => {
          var _a2;
          return ((_a2 = sc.character) == null ? void 0 : _a2.toLowerCase()) === actor.name.toLowerCase();
        }
      );
      if (actorStatChanges && actorStatChanges.changes) {
        Object.entries(actorStatChanges.changes).forEach(([stat, change]) => {
          const value = typeof change === "number" ? change : parseInt(change) || 0;
          baseSnapshot.baseStats[stat] = (baseSnapshot.baseStats[stat] || 0) + value;
        });
      }
      const actorSkillChanges = (extractedData.skillChanges || []).filter(
        (sc) => {
          var _a2;
          return ((_a2 = sc.character) == null ? void 0 : _a2.toLowerCase()) === actor.name.toLowerCase();
        }
      );
      for (const skillChange of actorSkillChanges) {
        fetch("http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "personnelAnalysisService.js:144", message: "Processing skill change", data: { action: skillChange.action, skillName: skillChange.skill, level: skillChange.level, character: skillChange.character }, timestamp: Date.now(), sessionId: "debug-session", runId: "run1", hypothesisId: "B" }) }).catch(() => {
        });
        if (skillChange.action === "gained" || skillChange.action === "learned") {
          const skillId = await this.findSkillId(skillChange.skill);
          fetch("http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "personnelAnalysisService.js:148", message: "Skill ID resolved", data: { skillName: skillChange.skill, skillId, found: !!skillId }, timestamp: Date.now(), sessionId: "debug-session", runId: "run1", hypothesisId: "B" }) }).catch(() => {
          });
          if (skillId && !baseSnapshot.activeSkills.find(
            (s) => (typeof s === "string" ? s : s.id) === skillId
          )) {
            baseSnapshot.activeSkills.push({
              id: skillId,
              val: skillChange.level || 1
            });
            fetch("http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "personnelAnalysisService.js:155", message: "Skill added to snapshot", data: { skillId, level: skillChange.level || 1, totalSkills: baseSnapshot.activeSkills.length }, timestamp: Date.now(), sessionId: "debug-session", runId: "run1", hypothesisId: "B" }) }).catch(() => {
            });
          }
        } else if (skillChange.action === "improved" || skillChange.action === "mastered") {
          const skillId = await this.findSkillId(skillChange.skill);
          if (skillId) {
            const skillIndex = baseSnapshot.activeSkills.findIndex(
              (s) => (typeof s === "string" ? s : s.id) === skillId
            );
            if (skillIndex >= 0) {
              const currentLevel = typeof baseSnapshot.activeSkills[skillIndex] === "object" ? baseSnapshot.activeSkills[skillIndex].val || 1 : 1;
              baseSnapshot.activeSkills[skillIndex] = {
                id: skillId,
                val: Math.max(currentLevel, skillChange.level || currentLevel + 1)
              };
            }
          }
        }
      }
      if (!baseSnapshot.relationships) {
        baseSnapshot.relationships = {};
      }
      const actorRelationshipChanges = (extractedData.relationshipChanges || []).filter(
        (rc) => {
          var _a2, _b2;
          return ((_a2 = rc.character1) == null ? void 0 : _a2.toLowerCase()) === actor.name.toLowerCase() || ((_b2 = rc.character2) == null ? void 0 : _b2.toLowerCase()) === actor.name.toLowerCase();
        }
      );
      for (const relChange of actorRelationshipChanges) {
        const isActor1 = ((_b = relChange.character1) == null ? void 0 : _b.toLowerCase()) === actor.name.toLowerCase();
        const otherActorName = isActor1 ? relChange.character2 : relChange.character1;
        if (otherActorName) {
          const otherActor = await this.findActorByName(otherActorName);
          if (otherActor) {
            const strength = await this.calculateRelationshipStrength(relChange.change);
            const type = this.inferRelationshipType(relChange.change, strength);
            baseSnapshot.relationships[otherActor.id] = {
              strength,
              type,
              notes: relChange.change,
              direction: isActor1 ? "outgoing" : "incoming",
              updatedAt: Date.now()
            };
            fetch("http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "personnelAnalysisService.js:198", message: "Relationship added to snapshot", data: { actorId: actor.id, otherActorId: otherActor.id, strength, type, change: relChange.change, totalRelationships: Object.keys(baseSnapshot.relationships).length }, timestamp: Date.now(), sessionId: "debug-session", runId: "run1", hypothesisId: "F" }) }).catch(() => {
            });
          }
        }
      }
      baseSnapshot.snapshotTimestamp = Date.now();
      baseSnapshot.bookId = bookId;
      baseSnapshot.chapterId = chapterId;
      baseSnapshot.chapterAnalyzed = true;
      baseSnapshot.chapterLastModified = chapterText ? Date.now() : null;
      return baseSnapshot;
    }
    /**
     * Update actor snapshot
     * @param {string} actorId - Actor ID
     * @param {number} bookId - Book ID
     * @param {number} chapterId - Chapter ID
     * @param {Object} snapshotData - Snapshot data
     */
    async updateActorSnapshot(actorId, bookId, chapterId, snapshotData) {
      const actor = await database_default.get("actors", actorId);
      if (!actor) {
        throw new Error(`Actor ${actorId} not found`);
      }
      const snapKey = `${bookId}_${chapterId}`;
      if (!actor.snapshots) {
        actor.snapshots = {};
      }
      actor.snapshots[snapKey] = snapshotData;
      actor.baseStats = { ...snapshotData.baseStats };
      actor.additionalStats = { ...snapshotData.additionalStats };
      actor.activeSkills = [...snapshotData.activeSkills];
      actor.inventory = [...snapshotData.inventory];
      actor.equipment = JSON.parse(JSON.stringify(snapshotData.equipment));
      await database_default.update("actors", actor);
      fetch("http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "personnelAnalysisService.js:250", message: "Actor updated in database", data: { actorId, snapKey, snapshotSkills: snapshotData.activeSkills.length, snapshotRelationships: Object.keys(snapshotData.relationships || {}).length }, timestamp: Date.now(), sessionId: "debug-session", runId: "run1", hypothesisId: "J" }) }).catch(() => {
      });
      await database_default.saveSnapshot(actorId, bookId, chapterId, snapshotData);
    }
    /**
     * Get actor snapshot for specific chapter
     * @param {string} actorId - Actor ID
     * @param {number} bookId - Book ID
     * @param {number} chapterId - Chapter ID
     * @returns {Promise<Object|null>} Snapshot data
     */
    async getActorSnapshot(actorId, bookId, chapterId) {
      var _a;
      const actor = await database_default.get("actors", actorId);
      if (!actor) return null;
      const snapKey = `${bookId}_${chapterId}`;
      return ((_a = actor.snapshots) == null ? void 0 : _a[snapKey]) || null;
    }
    /**
     * Check if chapter needs re-analysis
     * @param {number} bookId - Book ID
     * @param {number} chapterId - Chapter ID
     * @param {Object} chapter - Chapter object
     * @param {Array} actors - All actors
     * @returns {Promise<Object>} Status object
     */
    async checkChapterNeedsReanalysis(bookId, chapterId, chapter, actors) {
      var _a;
      if (!chapter) {
        return { needsReanalysis: false, reason: "Chapter not found" };
      }
      const chapterText = chapter.script || chapter.content || "";
      const chapterLastModified = chapter.lastUpdated || chapter.updatedAt || 0;
      let latestAnalysisTime = 0;
      let analyzedActors = 0;
      for (const actor of actors) {
        const snapshot = (_a = actor.snapshots) == null ? void 0 : _a[`${bookId}_${chapterId}`];
        if (snapshot && snapshot.chapterAnalyzed) {
          analyzedActors++;
          if (snapshot.snapshotTimestamp > latestAnalysisTime) {
            latestAnalysisTime = snapshot.snapshotTimestamp;
          }
        }
      }
      if (chapterLastModified > latestAnalysisTime) {
        return {
          needsReanalysis: true,
          reason: "Chapter was edited after last analysis",
          lastAnalysis: latestAnalysisTime,
          chapterModified: chapterLastModified
        };
      }
      if (chapterText.length > 50 && analyzedActors === 0) {
        return {
          needsReanalysis: true,
          reason: "Chapter has not been analyzed",
          lastAnalysis: null
        };
      }
      return {
        needsReanalysis: false,
        lastAnalysis: latestAnalysisTime,
        analyzedActors
      };
    }
    /**
     * Process stat changes for actors
     */
    async processStatChanges(statChanges, actors, bookId, chapterId) {
      for (const statChange of statChanges) {
        const actor = actors.find(
          (a) => {
            var _a;
            return a.name.toLowerCase() === ((_a = statChange.character) == null ? void 0 : _a.toLowerCase());
          }
        );
        if (actor) {
          const snapshot = await this.getActorSnapshot(actor.id, bookId, chapterId);
          if (snapshot && statChange.changes) {
            Object.entries(statChange.changes).forEach(([stat, change]) => {
              const value = typeof change === "number" ? change : parseInt(change) || 0;
              snapshot.baseStats[stat] = (snapshot.baseStats[stat] || 0) + value;
            });
            await this.updateActorSnapshot(actor.id, bookId, chapterId, snapshot);
          }
        }
      }
    }
    /**
     * Process skill changes for actors
     */
    async processSkillChanges(skillChanges, actors, bookId, chapterId) {
      for (const skillChange of skillChanges) {
        const actor = actors.find(
          (a) => {
            var _a;
            return a.name.toLowerCase() === ((_a = skillChange.character) == null ? void 0 : _a.toLowerCase());
          }
        );
        if (actor) {
          const snapshot = await this.getActorSnapshot(actor.id, bookId, chapterId);
          if (snapshot) {
          }
        }
      }
    }
    /**
     * Process relationship changes for actors
     */
    async processRelationshipChanges(relationshipChanges, actors, bookId, chapterId) {
      for (const relChange of relationshipChanges) {
        const actor1 = actors.find(
          (a) => {
            var _a;
            return a.name.toLowerCase() === ((_a = relChange.character1) == null ? void 0 : _a.toLowerCase());
          }
        );
        const actor2 = actors.find(
          (a) => {
            var _a;
            return a.name.toLowerCase() === ((_a = relChange.character2) == null ? void 0 : _a.toLowerCase());
          }
        );
        if (actor1 && actor2) {
          const strength = await this.calculateRelationshipStrength(relChange.change);
          const type = this.inferRelationshipType(relChange.change, strength);
          const snapshot1 = await this.getActorSnapshot(actor1.id, bookId, chapterId);
          if (snapshot1) {
            if (!snapshot1.relationships) snapshot1.relationships = {};
            snapshot1.relationships[actor2.id] = {
              strength,
              type,
              notes: relChange.change,
              direction: "outgoing",
              updatedAt: Date.now()
            };
            await this.updateActorSnapshot(actor1.id, bookId, chapterId, snapshot1);
          }
          const snapshot2 = await this.getActorSnapshot(actor2.id, bookId, chapterId);
          if (snapshot2) {
            if (!snapshot2.relationships) snapshot2.relationships = {};
            snapshot2.relationships[actor1.id] = {
              strength,
              // Could be different from actor1's perspective
              type,
              notes: relChange.change,
              direction: "incoming",
              updatedAt: Date.now()
            };
            await this.updateActorSnapshot(actor2.id, bookId, chapterId, snapshot2);
          }
        }
      }
    }
    /**
     * Helper: Find skill ID by name
     */
    async findSkillId(skillName) {
      const skills = await database_default.getAll("skillBank");
      const skill = skills.find(
        (s) => {
          var _a;
          return ((_a = s.name) == null ? void 0 : _a.toLowerCase()) === (skillName == null ? void 0 : skillName.toLowerCase());
        }
      );
      return (skill == null ? void 0 : skill.id) || null;
    }
    /**
     * Helper: Find actor by name
     */
    async findActorByName(actorName) {
      const actors = await database_default.getAll("actors");
      return actors.find(
        (a) => {
          var _a;
          return ((_a = a.name) == null ? void 0 : _a.toLowerCase()) === (actorName == null ? void 0 : actorName.toLowerCase()) || (a.nicknames || []).some((n) => n.toLowerCase() === (actorName == null ? void 0 : actorName.toLowerCase()));
        }
      ) || null;
    }
    /**
     * Convert timeline events (from Master Timeline extraction) to character data format
     * This allows us to use the proven Master Timeline extraction system universally
     */
    convertEventsToCharacterData(timelineEvents, actors) {
      const appearances = [];
      const statChanges = [];
      const skillChanges = [];
      const relationshipChanges = [];
      for (const event of timelineEvents) {
        const eventType = event.type || "";
        const actorsInEvent = event.actors || [];
        const description = (event.description || "").toLowerCase();
        if (eventType === "character_appearance" || eventType === "character_introduction") {
          actorsInEvent.forEach((actorName) => {
            var _a;
            if (actorName && typeof actorName === "string") {
              appearances.push({
                character: actorName,
                firstMention: description.includes("introduced") || description.includes("first") || ((_a = event.title) == null ? void 0 : _a.toLowerCase().includes("introduction"))
              });
            }
          });
        }
        if (eventType === "stat_change") {
          actorsInEvent.forEach((actorName) => {
            const statMatches = description.match(/(\w+)\s*(?:increased|gained|lost|decreased|changed)\s*(?:by|to)?\s*([+-]?\d+)/gi);
            const changes = {};
            if (statMatches) {
              statMatches.forEach((match) => {
                const parts = match.match(/(\w+)\s*(?:increased|gained|lost|decreased|changed)\s*(?:by|to)?\s*([+-]?\d+)/i);
                if (parts && parts.length >= 3) {
                  const stat = parts[1].toUpperCase();
                  const value = parseInt(parts[2]) || 0;
                  changes[stat] = value;
                }
              });
            } else {
              const fallbackMatches = description.match(/([+-]?\d+)\s*(\w+)|(\w+)\s*([+-]?\d+)/gi);
              if (fallbackMatches) {
                fallbackMatches.forEach((match) => {
                  const parts = match.match(/([+-]?\d+)\s*(\w+)|(\w+)\s*([+-]?\d+)/i);
                  if (parts) {
                    const stat = (parts[2] || parts[3] || "").toUpperCase();
                    const value = parseInt(parts[1] || parts[4] || "0") || 0;
                    if (stat && value !== 0) {
                      changes[stat] = value;
                    }
                  }
                });
              }
            }
            if (Object.keys(changes).length > 0) {
              statChanges.push({
                character: actorName,
                changes
              });
            }
          });
        }
        if (eventType === "skill_event") {
          actorsInEvent.forEach((actorName) => {
            if (!actorName || typeof actorName !== "string") return;
            const title = event.title || "";
            const desc = event.description || "";
            const fullText = `${title} ${desc}`.toLowerCase();
            let skillName = null;
            let action = "gained";
            let level = 1;
            const pattern1 = new RegExp(`${actorName.toLowerCase()}\\s+(?:learns?|gains?|mastered|improved|perfected)\\s+(.+?)(?:\\s+skill)?(?:\\s|$|,|\\.)`, "i");
            const match1 = fullText.match(pattern1);
            if (match1 && match1[1]) {
              skillName = match1[1].trim();
            }
            if (!skillName) {
              const pattern2 = /(?:learns?|gains?|mastered|improved|perfected)\s+(.+?)(?:\s+skill)?(?:\s|$|,|\.)/i;
              const match2 = fullText.match(pattern2);
              if (match2 && match2[1]) {
                skillName = match2[1].trim();
              }
            }
            if (!skillName && title) {
              const cleaned = title.replace(new RegExp(actorName, "gi"), "").replace(/(?:learns?|gains?|mastered|improved|perfected|skill)/gi, "").trim();
              if (cleaned && cleaned.length > 2) {
                skillName = cleaned;
              }
            }
            if (skillName) {
              if (fullText.includes("mastered") || fullText.includes("perfected") || fullText.includes("expert")) {
                action = "mastered";
                level = 5;
              } else if (fullText.includes("improved") || fullText.includes("better") || fullText.includes("advanced")) {
                action = "improved";
                level = 2;
              } else if (fullText.includes("learned") || fullText.includes("gained") || fullText.includes("acquired")) {
                action = "gained";
                level = 1;
              }
              skillChanges.push({
                character: actorName,
                action,
                skill: skillName,
                level,
                context: event.description || event.title
              });
              fetch("http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "personnelAnalysisService.js:594", message: "Skill extracted from event", data: { actorName, skillName, action, level, eventTitle: event.title }, timestamp: Date.now(), sessionId: "debug-session", runId: "run1", hypothesisId: "A" }) }).catch(() => {
              });
            }
          });
        }
        if (eventType === "relationship_change") {
          if (actorsInEvent.length >= 2) {
            const char1 = actorsInEvent[0];
            const char2 = actorsInEvent[1];
            if (char1 && char2 && typeof char1 === "string" && typeof char2 === "string") {
              relationshipChanges.push({
                character1: char1,
                character2: char2,
                change: event.description || event.title
              });
              fetch("http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "personnelAnalysisService.js:640", message: "Relationship extracted from event", data: { character1: char1, character2: char2, change: event.description || event.title }, timestamp: Date.now(), sessionId: "debug-session", runId: "run1", hypothesisId: "E" }) }).catch(() => {
              });
            }
          }
        }
      }
      fetch("http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "personnelAnalysisService.js:648", message: "Conversion complete", data: { appearances: appearances.length, statChanges: statChanges.length, skillChanges: skillChanges.length, relationshipChanges: relationshipChanges.length }, timestamp: Date.now(), sessionId: "debug-session", runId: "run1", hypothesisId: "A,E" }) }).catch(() => {
      });
      return {
        appearances,
        statChanges,
        skillChanges,
        relationshipChanges
      };
    }
    /**
     * Calculate relationship strength from change description
     */
    async calculateRelationshipStrength(changeDescription) {
      if (!changeDescription) return 0;
      const description = changeDescription.toLowerCase();
      try {
        const prompt = `Analyze this relationship change description and return a strength value from -100 to 100:
      -100 = extremely hostile/enemy
      0 = neutral/stranger
      +100 = extremely close/allied
      
      Description: "${changeDescription}"
      
      Return only a number between -100 and 100.`;
        const response = await aiService_default.callAI(prompt, "text");
        const strength = parseInt(response.trim());
        if (!isNaN(strength) && strength >= -100 && strength <= 100) {
          return strength;
        }
      } catch (error) {
        console.warn("AI strength calculation failed, using keyword matching:", error);
      }
      const positiveKeywords = ["friend", "ally", "love", "trust", "respect", "close", "partner", "companion", "help", "save"];
      const negativeKeywords = ["enemy", "hate", "hostile", "rival", "betray", "conflict", "anger", "fear", "attack", "hurt"];
      const positiveCount = positiveKeywords.filter((k) => description.includes(k)).length;
      const negativeCount = negativeKeywords.filter((k) => description.includes(k)).length;
      if (positiveCount > negativeCount) {
        return 30 + positiveCount * 15;
      } else if (negativeCount > positiveCount) {
        return -90 + negativeCount * 15;
      }
      return 0;
    }
    /**
     * Infer relationship type from change and strength
     */
    inferRelationshipType(changeDescription, strength) {
      if (strength >= 60) return "allied";
      if (strength >= 20) return "friendly";
      if (strength >= -20) return "neutral";
      if (strength >= -60) return "tense";
      return "hostile";
    }
  };
  var personnelAnalysisService = new PersonnelAnalysisService();
  var personnelAnalysisService_default = personnelAnalysisService;

  // src/entry.js
  init_dialogueAnalysisService();
  init_emotionalBeatService();
  init_styleGuideService();

  // src/services/styleConnectionService.js
  init_database();
  var checkStyleConnections = async (options = {}) => {
    const { chapterId = null, bookId = null } = options;
    const connections = [];
    try {
      const baseContent = getExpertWriterContent();
      const isConnected = baseContent && baseContent.trim().length > 0;
      connections.push({
        id: "expert-writer",
        name: "Built-in Writing Guides",
        type: "built-in",
        connected: isConnected,
        details: isConnected ? `Expert writing foundation available (${baseContent.length} chars)` : "Built-in guides not available",
        error: isConnected ? null : "Failed to load expert writer base content"
      });
    } catch (error) {
      connections.push({
        id: "expert-writer",
        name: "Built-in Writing Guides",
        type: "built-in",
        connected: false,
        details: "Error loading built-in guides",
        error: error.message
      });
    }
    try {
      const storyProfile = await smartContextEngine_default.getFullStoryProfile().catch(() => null);
      const hasStyleProfile = (storyProfile == null ? void 0 : storyProfile.styleProfile) && Object.keys(storyProfile.styleProfile).length > 0;
      if (hasStyleProfile) {
        const sp = storyProfile.styleProfile;
        const hasVoiceProfile = sp.voiceProfile && Object.keys(sp.voiceProfile).length > 0;
        const hasToneBalance = sp.toneBalance;
        const hasComedyRules = sp.comedyRules && Object.keys(sp.comedyRules).length > 0;
        connections.push({
          id: "style-profile",
          name: "Style Profile",
          type: "custom",
          connected: true,
          details: `Style profile loaded${hasVoiceProfile ? " (voice profile)" : ""}${hasToneBalance ? " (tone balance)" : ""}${hasComedyRules ? " (comedy rules)" : ""}`,
          error: null
        });
      } else {
        connections.push({
          id: "style-profile",
          name: "Style Profile",
          type: "custom",
          connected: false,
          details: "No style profile configured",
          error: "Style profile not found in story profile"
        });
      }
    } catch (error) {
      connections.push({
        id: "style-profile",
        name: "Style Profile",
        type: "custom",
        connected: false,
        details: "Error loading style profile",
        error: error.message
      });
    }
    try {
      const instructions = await smartContextEngine_default.getStyleInstructions();
      const isConnected = instructions && instructions.length > 0;
      connections.push({
        id: "style-instructions",
        name: "Style Instructions",
        type: "custom",
        connected: isConnected,
        details: isConnected ? `${instructions.length} style instruction${instructions.length !== 1 ? "s" : ""} loaded` : "No style instructions configured",
        error: isConnected ? null : "No style instructions found",
        instructionCount: (instructions == null ? void 0 : instructions.length) || 0
      });
    } catch (error) {
      connections.push({
        id: "style-instructions",
        name: "Style Instructions",
        type: "custom",
        connected: false,
        details: "Error loading style instructions",
        error: error.message
      });
    }
    try {
      if (bookId) {
        const styleContext = await styleReferenceService_default.getStyleContext(bookId, 2e3);
        const isConnected = styleContext && styleContext.trim().length > 0;
        let styleDocs = [];
        try {
          const allDocs = await database_default.getAll("styleReferences");
          styleDocs = allDocs.filter(
            (doc) => doc.scope === "global" || doc.scope === "project" && doc.projectId === bookId
          );
        } catch (e) {
        }
        connections.push({
          id: "style-references",
          name: "Style Documents",
          type: "custom",
          connected: isConnected,
          details: isConnected ? `${styleDocs.length} style document${styleDocs.length !== 1 ? "s" : ""} loaded (${styleContext.length} chars)` : "No style documents found",
          error: isConnected ? null : "No style documents available",
          documentCount: styleDocs.length,
          documents: styleDocs.map((doc) => ({ id: doc.id, name: doc.name, type: doc.type }))
        });
      } else {
        connections.push({
          id: "style-references",
          name: "Style Documents",
          type: "custom",
          connected: false,
          details: "Book ID required to load style documents",
          error: "No book ID provided"
        });
      }
    } catch (error) {
      connections.push({
        id: "style-references",
        name: "Style Documents",
        type: "custom",
        connected: false,
        details: "Error loading style documents",
        error: error.message
      });
    }
    try {
      const negativeExamples = await smartContextEngine_default.getNegativeExamples().catch(() => []);
      const isConnected = negativeExamples && negativeExamples.length > 0;
      connections.push({
        id: "negative-examples",
        name: "Negative Examples",
        type: "custom",
        connected: isConnected,
        details: isConnected ? `${negativeExamples.length} negative example${negativeExamples.length !== 1 ? "s" : ""} loaded` : "No negative examples configured",
        error: isConnected ? null : "No negative examples found",
        exampleCount: (negativeExamples == null ? void 0 : negativeExamples.length) || 0
      });
    } catch (error) {
      connections.push({
        id: "negative-examples",
        name: "Negative Examples",
        type: "custom",
        connected: false,
        details: "Error loading negative examples",
        error: error.message
      });
    }
    return connections;
  };
  var styleConnectionService_default = {
    checkStyleConnections
  };

  // src/services/writingEnhancementServices.js
  var writingEnhancementServices_exports = {};
  __export(writingEnhancementServices_exports, {
    analyzePacing: () => analyzePacing,
    checkContinuity: () => checkContinuity,
    checkVoiceConsistency: () => checkVoiceConsistency,
    default: () => writingEnhancementServices_default,
    enhanceDialogue: () => enhanceDialogue,
    escalateConflict: () => escalateConflict,
    generateChapterSummary: () => generateChapterSummary,
    generateSceneTransition: () => generateSceneTransition,
    injectSensoryDetails: () => injectSensoryDetails,
    suggestForeshadowing: () => suggestForeshadowing,
    trackEmotionalBeats: () => trackEmotionalBeats
  });
  init_aiService();
  init_database();
  init_contextEngine();
  init_chapterDataExtractionService();

  // src/services/storyBrain.js
  init_aiService();
  init_contextEngine();
  init_database();

  // src/data/writingCraftGuide.js
  var writingCraftGuide = {
    // ─── CONTINUATION ───────────────────────────────────────────
    continue: {
      directive: `CONTINUATION RULES:
- Read the last 2-3 paragraphs as a musician reads a melody: match the RHYTHM, not just the words.
- If the previous passage was dialogue-heavy, the next beat should pull outward (action, setting, internal thought) before returning to dialogue. Conversations need breathing room.
- If the previous passage was description, break it with action or dialogue. Never stack description on description.
- End your continuation mid-momentum. Stop at a moment of rising tension, an unanswered question, or a character about to act \u2014 never at a natural resting point. The user will continue from where you stop.
- Mirror sentence length patterns. If the author writes in short, punchy sentences during tension, do the same. If they use flowing compound sentences for reflection, follow suit.
- NEVER summarize what just happened. NEVER use transition phrases like "Meanwhile" or "As the hours passed". Just continue the scene as if you're the same author mid-sentence.
- If characters were mid-conversation, continue the conversation. Don't skip ahead.
- Maintain the EXACT point of view (first/third limited/omniscient) established in the text.`,
      pacing: `PACING FOR CONTINUATION:
- Count the ratio of dialogue:action:description in the last 500 words. Maintain that ratio.
- If a scene has been running for more than ~800 words without a shift, introduce a micro-shift: an interruption, a sensory detail that changes the mood, or an internal thought that reframes the scene.
- Short paragraphs (1-2 sentences) signal urgency. Long paragraphs signal contemplation. Match what came before.`
    },
    // ─── SCENE GENERATION ──────────────────────────────────────
    scene: {
      directive: `SCENE CONSTRUCTION RULES:
- A scene is a UNIT OF CHANGE. Something must be different by the end: a relationship shifts, information is revealed, a decision is made, or a situation escalates.
- Open with grounding: Where are we? Who is present? What's the immediate sensory environment? Do this in ONE sentence, woven into action \u2014 never as a standalone paragraph of description.
- Build to a TURNING POINT. Every scene pivots: the character learns something, is forced to choose, or the situation changes. Put this at the 60-70% mark of the scene.
- Close with FORWARD MOMENTUM. The last line should make the reader want to keep going. A question raised, a threat implied, a decision with consequences, or an emotional beat that resonates.
- Avoid the "and then" trap. Scenes aren't lists of things that happen. Each beat should CAUSE the next.
- Include at least TWO senses per scene. Sight is free \u2014 earn the others: the smell of a room, the texture of a surface, the taste of fear.`,
      structure: `SCENE STRUCTURE:
1. HOOK (1-2 sentences): Arrive late. Drop us into action, dialogue, or a striking image.
2. ESCALATION (2-3 paragraphs): Develop the situation. Introduce complications. Layer tension.
3. TURNING POINT (1-2 paragraphs): The moment things change. This is why the scene exists.
4. AFTERMATH/HOOK (1-2 sentences): Quick emotional beat or new question that propels forward.

SCENE TYPES AND THEIR PURPOSE:
- Action scenes: Short sentences, concrete verbs, sensory overload, minimal internal thought
- Dialogue scenes: Character-revealing exchanges, subtext > text, broken by action beats
- Reflection scenes: Internal processing of events, character growth moments, slower pacing
- Discovery scenes: Information revealed through action/dialogue, never through exposition dumps
- Transition scenes: Brief bridges between major scenes \u2014 keep under 200 words`
    },
    // ─── DIALOGUE ──────────────────────────────────────────────
    dialogue: {
      directive: `DIALOGUE MASTERY RULES:
- Every line of dialogue must do at LEAST one of: reveal character, advance plot, create conflict, or build relationship dynamics. Lines that only convey information are exposition wearing a mask.
- People don't answer questions directly. They deflect, answer a different question, change the subject, or reveal through what they DON'T say.
- Each character's dialogue should be identifiable WITHOUT tags. Achieve this through: vocabulary level, sentence length, verbal tics, topics they gravitate toward, and their relationship to formality.
- ACTION BEATS > DIALOGUE TAGS. Instead of "he said angrily," write "He slammed his palm on the table." Action beats do double duty: they identify the speaker AND show emotion/physicality.
- Interrupt conversations. Real people cut each other off, talk over each other, and change subjects abruptly. Use em dashes (\u2014) for interruptions.
- SUBTEXT IS KING. The most powerful dialogue is when characters say one thing and mean another. A character asking "Are you hungry?" might really be asking "Are you okay?"`,
      patterns: `DIALOGUE PATTERNS:
- Interrogation pattern: Short questions, deflecting answers, building pressure
- Banter pattern: Quick volleys, shared references, comfortable rhythm
- Conflict pattern: Talking past each other, different assumptions, escalating stakes
- Revelation pattern: Casual setup \u2192 bombshell line \u2192 stunned silence \u2192 aftermath
- Comic pattern: Straight man/funny man dynamic, misunderstandings played for laughs, understatement

DIALOGUE FORMATTING:
- New speaker = new paragraph, always
- Keep individual speech turns under 3 sentences unless the character is monologuing (and monologues should be rare and earned)
- Break long speeches with action beats or reactions from listeners
- Use silence as dialogue: "She said nothing" is sometimes the most powerful line`
    },
    // ─── REWRITE / IMPROVE ────────────────────────────────────
    rewrite: {
      directive: `REWRITING RULES:
- Preserve the SOUL of the passage. Rewriting means making it better, not making it different.
- Identify the weakest element: Is it telling instead of showing? Passive voice? Vague description? Flat dialogue? Fix THAT, leave the rest.
- Upgrade verbs first. "He walked across the room" \u2192 "He crossed the room" or "He stalked across the room" \u2014 the verb carries the character.
- Cut filter words: "he felt," "she noticed," "they could see." Instead of "She felt the cold wind," write "The cold wind bit her skin."
- Cut hedging words: "somewhat," "rather," "quite," "a bit," "slightly." These are confidence killers.
- Tighten: if you can say it in 8 words instead of 15, do it. Density > length.
- Don't change the author's voice. If they write with dark humor, don't make it earnest. If they write spare prose, don't add flowery description.`,
      checklist: `REWRITE QUALITY CHECKLIST:
\u25A1 Every sentence earns its place (cut any that don't advance scene/character/mood)
\u25A1 Strong verbs carry the action (no "was walking" when "strode" works)
\u25A1 Sensory details are specific, not generic ("copper tang of blood" not "metallic smell")
\u25A1 Dialogue sounds like speech, not prose (contractions, fragments, interruptions)
\u25A1 Internal thoughts are italicized or clearly marked
\u25A1 Point of view is consistent throughout
\u25A1 Emotional beats are shown through physical action, not stated`
    },
    // ─── EXPANSION ─────────────────────────────────────────────
    expand: {
      directive: `EXPANSION RULES:
- Expansion is NOT padding. Every added sentence must deepen understanding, build mood, or develop character.
- Add LAYERS, not LENGTH. Expand by adding: sensory details, character reactions, environmental details, subtext in dialogue, or internal thought.
- Identify what's MISSING from the original: Is it all dialogue with no setting? Add grounding details. Is it all action with no emotion? Add internal beats. Is it all description with no movement? Add action.
- Maintain the original's pacing signature. If it was fast-paced, add details that maintain speed (short sensory hits between action). If it was contemplative, add depth through extended observation.
- NEVER pad with: weather descriptions that don't serve mood, characters' physical descriptions mid-scene, backstory that interrupts momentum, or restatements of what just happened.
- A good expansion feels like the passage was always meant to be this length.`
    },
    // ─── MOOD ADJUSTMENT ──────────────────────────────────────
    mood: {
      comedy: `COMEDY WRITING DIRECTIVES:
- Comedy lives in SPECIFICITY. "He tripped" isn't funny. "He tripped over a cairn of empty Red Bull cans he'd arranged as a tribute to productivity" is.
- The RULE OF THREE: Setup, reinforcement, subversion. Establish a pattern with two examples, then break it with the third.
- UNDERSTATEMENT > OVERSTATEMENT. "Well, that's not ideal" while the building burns is funnier than describing the comedy of the fire.
- COMIC TIMING requires rhythm: build tension, pause (a new paragraph acts as a beat), then deliver the punchline. The pause is essential.
- DRAMATIC IRONY: Let the reader know something the character doesn't. The gap between what we know and what they know IS the comedy.
- Never EXPLAIN the joke. If you have to tell the reader why something is funny, it isn't.
- BATHOS: Follow something grand/serious with something mundane. "He had survived the apocalypse, the collapse of civilization, and three separate attempts on his life. The parking meter, however, had defeated him."`,
      horror: `HORROR/TENSION WRITING DIRECTIVES:
- What you DON'T show is scarier than what you do. Let the reader's imagination fill the gaps.
- Build dread through NORMALCY VIOLATIONS: something that should be normal but isn't quite right. The smile that's too wide. The room that's too quiet. The door that's already open.
- Use the BODY as horror's canvas: involuntary reactions (goosebumps, cold sweat, racing heart) ground abstract fear in physical reality.
- ISOLATION amplifies horror. Cut off escape routes, allies, information, and hope \u2014 in that order.
- PACING: Slow, creeping sentences for building dread. Short, sharp sentences for the moment of horror. Then silence (a paragraph break) for the aftermath.
- SENSORY HORROR: Don't just describe what looks wrong. What does it SMELL like? What does the air TASTE like? What is that TEXTURE?
- The UNCANNY VALLEY: Things that are almost-but-not-quite human are deeply unsettling. Use this for characters, locations, and situations.`,
      tension: `TENSION BUILDING DIRECTIVES:
- Tension requires STAKES. The reader must know what can be lost. Remind them.
- TICKING CLOCK: Give a deadline, then keep cutting the time. "You have one hour" \u2192 "Thirty minutes" \u2192 "The timer showed 4:17."
- PARALLEL CUTTING: If possible, alternate between the danger approaching and the character unaware. Dramatic irony creates agonizing tension.
- PHYSICAL TELLS: Show tension through the body: held breath, tight grip, dry mouth, tunnel vision.
- SENTENCE LENGTH: As tension rises, sentences get shorter. Paragraphs get shorter. Everything compresses. Like a fist closing.
- END CHAPTERS/SCENES at the PEAK of tension, never after the resolution. Make them turn the page.`
    },
    // ─── STORY PLANNING ───────────────────────────────────────
    planning: {
      narrative_structures: `NARRATIVE STRUCTURE TEMPLATES:

THREE-ACT STRUCTURE:
Act 1 (25%): Setup \u2192 Inciting Incident \u2192 First Plot Point (character commits to the journey)
Act 2a (25%): Rising action \u2192 New world/rules \u2192 Midpoint reversal
Act 2b (25%): Complications \u2192 All is lost moment \u2192 Dark night of the soul
Act 3 (25%): Climax \u2192 Resolution \u2192 New equilibrium

FIVE-ACT STRUCTURE (Shakespeare/TV):
1. Exposition: World and characters established
2. Rising Action: Complications and escalation
3. Climax: The peak moment, point of no return
4. Falling Action: Consequences unfold
5. Resolution: New status quo

KISHOTENKETSU (4-act, no conflict required):
Ki: Introduction of elements
Sho: Development of elements
Ten: Twist \u2014 unexpected connection between elements
Ketsu: Resolution and new understanding

STORY CIRCLE (Dan Harmon):
1. Character is in a zone of comfort
2. They want something
3. They enter an unfamiliar situation
4. They adapt to it
5. They get what they wanted
6. They pay a heavy price for it
7. They return to their familiar situation
8. Having changed`,
      chapter_planning: `CHAPTER PLANNING INTELLIGENCE:

CHAPTER PURPOSE TYPES:
- Setup chapters: Introduce elements that will pay off later. Plant seeds subtly.
- Escalation chapters: Raise stakes. Things get worse, more complex, more urgent.
- Revelation chapters: Hidden information comes to light. Reframes previous events.
- Character chapters: Deep dives into motivation, backstory, internal conflict.
- Action chapters: Events reach a peak. Decisions are made. Things change irreversibly.
- Aftermath chapters: Characters process what happened. Relationships shift. New normal established.

CHAPTER RHYTHM:
- Alternate between high-energy and low-energy chapters
- Every 3-4 chapters, deliver a significant revelation or status quo change
- End every chapter with either a question, a revelation, or a decision
- Start chapters with a different energy than how the previous one ended

CHAPTER ENDINGS (ranked by reader compulsion to continue):
1. Cliffhanger: Immediate danger or shocking revelation
2. Question: New mystery or unanswered question
3. Decision: Character faces a fork in the road
4. Revelation: Reader learns something the characters don't
5. Emotional: Quiet moment that deepens connection to character`
    },
    // ─── FORWARD THINKING ─────────────────────────────────────
    forwardThinking: {
      directive: `STORY PROGRESSION ANALYSIS:
When analyzing the story so far to suggest what comes next, consider:

CAUSE AND EFFECT CHAINS:
- What decisions have characters made that haven't had consequences yet? \u2192 These are ticking bombs.
- What information has been revealed that characters haven't acted on? \u2192 These are missed opportunities.
- What relationships have been established but not tested? \u2192 These are dramatic opportunities.

PROMISE AND PAYOFF:
- What has been set up (Chekhov's guns)? \u2192 These MUST fire eventually.
- What questions has the reader been asked? \u2192 These MUST be answered (even if the answer raises more questions).
- What character traits have been established? \u2192 These MUST be tested.

ESCALATION PATTERNS:
- The SAME type of challenge should not repeat. Each obstacle should be DIFFERENT in kind, not just degree.
- If the last challenge was physical, the next should be social, emotional, or intellectual.
- If the last challenge tested one character, the next should test a different one or the group dynamic.

DRAMATIC IRONY OPPORTUNITIES:
- Does the reader know something a character doesn't? \u2192 Exploit this for tension.
- Can a character's strength become their weakness? \u2192 This is rich territory.
- Are two characters on a collision course they don't see? \u2192 Build toward the intersection.`
    },
    // ─── CHARACTER INTRODUCTION ────────────────────────────────
    characterIntro: {
      directive: `CHARACTER INTRODUCTION RULES:
- Introduce through ACTION, not description. What the character DOES tells us who they ARE.
- Give ONE vivid physical detail, not a police report. "A woman whose smile arrived seconds before the rest of her face" > "She was tall with brown hair and green eyes."
- Establish their RELATIONSHIP to the scene. Why are they here? What do they want in this moment?
- Voice should be IMMEDIATELY distinct. Their first line of dialogue should be unmistakably theirs.
- If introducing to an existing cast, define them through CONTRAST with existing characters.
- The reader should understand this character's FUNCTION in the story within their first 100 words: are they an ally, obstacle, mirror, or catalyst?`
    },
    // ─── STYLE MATCHING ──────────────────────────────────────
    styleMatch: {
      directive: `STYLE MATCHING RULES:
- Style is a FINGERPRINT made up of: sentence length distribution, vocabulary register, metaphor density, humor frequency, darkness threshold, and narrative distance.
- Match ALL of these simultaneously, not just "tone." A passage can have the right tone but wrong rhythm.
- Pay attention to what the author DOESN'T do as much as what they do. If they never use semicolons, neither should you. If they never write paragraphs longer than 3 sentences, follow suit.
- Vocabulary register: If the author uses casual/colloquial language, don't suddenly deploy SAT words. If they write with literary precision, don't dumb it down.
- Metaphor density: Some authors use metaphors constantly. Others use them sparingly for maximum impact. Match the frequency, not just the quality.`
    }
  };
  var writingCraftGuide_default = writingCraftGuide;

  // src/data/genreGuides.js
  var genreGuides = {
    fantasy: {
      label: "Fantasy",
      conventions: `FANTASY GENRE INTELLIGENCE:

MAGIC SYSTEMS:
- Hard magic: Clear rules, costs, limitations. Reader can predict how it works. (Sanderson)
- Soft magic: Mysterious, evocative, unpredictable. Creates wonder. (Tolkien)
- Your system should be CONSISTENT whichever approach you choose.
- Magic must have COST. Free magic removes tension.

WORLD-BUILDING TRAPS TO AVOID:
- The history lecture: Don't stop the story to explain the world. Weave it in.
- The map tour: Characters exploring just to show the reader geography.
- Made-up word overload: More than 3-4 new terms per chapter overwhelms readers.
- Chosen One syndrome: If your hero is destined, ensure they still CHOOSE.

WHAT FANTASY READERS EXPECT:
- A world that feels larger than the story being told
- Internal consistency (your own rules matter more than "realism")
- Character agency \u2014 even in worlds of prophecy and fate
- A sense of wonder balanced with grounded emotional truth
- Satisfying magic use that follows established rules`,
      pacing: `FANTASY PACING:
- Early chapters: immerse through character experience, not exposition
- Quest structure: each leg of the journey should change the character, not just the location
- Battle scenes: focus on individual character experience within chaos, not army movements
- Political intrigue: tension through what's unsaid, alliances that shift
- Climactic magic: should feel earned by everything established earlier`
    },
    scifi: {
      label: "Science Fiction",
      conventions: `SCIENCE FICTION GENRE INTELLIGENCE:

WORLD-BUILDING:
- The technology should reflect a THEME. What does this tech say about humanity?
- "One big lie" rule: you get ONE impossible thing. Everything else follows logically.
- Don't explain the technology \u2014 show people USING it, living with its consequences.
- The best sci-fi is about TODAY told through the lens of tomorrow.

COMMON PITFALLS:
- Technobabble: More technical detail \u2260 more believable. Focus on human impact.
- Utopia/dystopia extremes: The most interesting futures have both good and bad.
- Forgetting characters have personal lives amid world-scale events.
- Info-dumping about how the technology works instead of showing its effects.

WHAT SCI-FI READERS EXPECT:
- Internally consistent extrapolation from real science/technology
- Characters who feel human even in alien circumstances
- Ideas that make them think differently about the real world
- Tension between technological capability and human limitation
- The technology changes society, society changes people, people change the story`,
      pacing: `SCI-FI PACING:
- Reveal technology through USE, not explanation
- Each discovery should raise more questions than it answers
- Alternate between intimate character moments and big-scale implications
- Technical problem-solving scenes need emotional stakes to stay engaging
- The climax should show the human truth the technology was metaphoring all along`
    },
    thriller: {
      label: "Thriller / Suspense",
      conventions: `THRILLER GENRE INTELLIGENCE:

TENSION ARCHITECTURE:
- Every chapter should end with a question, threat, or revelation
- The reader should ALWAYS be worried about what happens next
- Information is currency: give it strategically, withhold it purposefully
- The protagonist should be in ESCALATING danger \u2014 each solution creates a bigger problem

THE TICKING CLOCK:
- Establish deadlines early and reference them regularly
- As the clock runs down, cut between scenes faster
- The reader should feel time pressure physically

VILLAIN CRAFT:
- The antagonist should be winning for most of the story
- Their plan should make sense from THEIR perspective
- They should be competent \u2014 easy villains = no tension
- The best thrillers have villains who are right about something

WHAT THRILLER READERS EXPECT:
- Breathless pacing with brief moments of relief
- Twists that are surprising but feel inevitable in hindsight
- A protagonist who's in genuine danger they might not survive
- An ending that resolves the main threat but costs the hero something`,
      pacing: `THRILLER PACING:
- Short chapters. Short scenes. The reader should never find a stopping point.
- Alternate between action and planning (but planning should feel urgent too)
- Cliffhanger chapters: end mid-action, mid-revelation, mid-decision
- Every scene should have a micro-tension even if it's not the main plot
- The last 20% should be relentless \u2014 once the climax begins, don't stop`
    },
    romance: {
      label: "Romance",
      conventions: `ROMANCE GENRE INTELLIGENCE:

THE CENTRAL RELATIONSHIP:
- The relationship IS the plot. Everything serves it.
- Both characters must be equals \u2014 each should challenge and change the other
- Chemistry is built through: banter, tension, vulnerability, and shared moments
- The obstacles to the relationship should be MEANINGFUL, not manufactured misunderstandings

EMOTIONAL BEATS:
- Meet cute / first encounter: Must be memorable and establish dynamic
- Friction: They should NOT get along easily. Conflict reveals character.
- Vulnerability: Each character reveals something real. The armor comes off.
- Dark moment: Something threatens to end things permanently
- Grand gesture: One character proves their growth through action

WHAT ROMANCE READERS EXPECT:
- Emotionally satisfying arc (HEA or HFN \u2014 happy ever after or happy for now)
- Internal conflict > external obstacles
- Both characters change and grow because of each other
- Tension that's emotional and psychological, not just physical
- The "will they/won't they" question sustained until the right moment`,
      pacing: `ROMANCE PACING:
- Slow burn: delay gratification. Each step closer should feel earned.
- Alternate between: getting closer \u2192 pulling apart \u2192 getting closer again
- Emotional scenes need space to breathe \u2014 don't rush vulnerability
- The declaration of love should come at the RIGHT moment, never too early
- After the dark moment, the resolution should feel inevitable and satisfying`
    },
    horror: {
      label: "Horror",
      conventions: `HORROR GENRE INTELLIGENCE:

FEAR ARCHITECTURE:
- Dread > shock. The anticipation of horror is more powerful than the horror itself.
- Establish NORMALCY first. Horror only works when there's something comfortable to violate.
- The unknown is scarier than the known. Delay revelation.
- Horror works on THREE levels: physical (body), psychological (mind), existential (meaning)

ATMOSPHERE:
- Setting IS character. The haunted house, the empty hospital, the too-quiet town.
- Use all senses: what does dread SMELL like? What does fear TASTE like?
- Silence is your most powerful tool. What you DON'T describe fills with reader's imagination.
- Normal things made slightly wrong are more unsettling than obviously monstrous things.

ESCALATION:
- Start with unease (something feels off)
- Move to dread (something IS wrong)
- Build to terror (the threat is real and close)
- Punctuate with horror (the worst happens \u2014 briefly)
- Return to dread (it's not over)

WHAT HORROR READERS EXPECT:
- Atmospheric dread that gets under their skin
- Characters they care about (horror without attachment is just gross)
- Rules that are consistent even if unknowable
- At least one moment that genuinely unsettles them
- The horror should MEAN something \u2014 it's a metaphor for real fear`,
      pacing: `HORROR PACING:
- Slow, creeping builds punctuated by sharp moments of horror
- Long, flowing sentences for dread \u2192 short, staccato sentences for horror
- Give the reader FALSE safety before pulling the rug
- The "quiet chapter" before the storm is essential \u2014 earned relief
- The final act should feel inescapable \u2014 every exit closes`
    },
    literary: {
      label: "Literary Fiction",
      conventions: `LITERARY FICTION INTELLIGENCE:

CHARACTER DEPTH:
- Character IS plot. Internal change is the story.
- Ambiguity is a feature: characters should be complex enough to interpret differently
- Voice is everything: the WAY the story is told IS the story
- Subtext carries more weight than text \u2014 what's unsaid matters more than what's said

PROSE CRAFT:
- Every sentence should be intentional. Literary fiction earns its length.
- Imagery should be original \u2014 avoid clich\xE9s like the plague (see what I did there)
- Rhythm matters: read your prose aloud. It should have music.
- Let sentences do double duty: advance plot AND develop character AND build mood

STRUCTURE:
- Can be non-linear, fragmented, or unconventional \u2014 but must serve the STORY
- Experimental structure for its own sake is self-indulgent
- Quiet moments are just as important as dramatic ones
- The ending can be ambiguous \u2014 but it must feel COMPLETE

WHAT LITERARY READERS EXPECT:
- Beautiful, precise prose that rewards re-reading
- Characters who feel like real people with real contradictions
- Thematic depth that makes them think about life differently
- Emotional resonance that stays with them
- A unique voice they haven't heard before`,
      pacing: `LITERARY PACING:
- Prioritize depth over speed
- A single conversation can carry an entire chapter if it reveals enough
- Time can be compressed or expanded based on emotional significance
- The climax may be quiet \u2014 a realization, not an explosion
- Don't rush the ending. Let the reader sit with the final image.`
    },
    "dark-comedy": {
      label: "Dark Comedy",
      conventions: `DARK COMEDY GENRE INTELLIGENCE:

THE BALANCE:
- Comedy and darkness must CO-EXIST, not alternate. The funniest moments should also be the darkest.
- The humor should come FROM the darkness, not despite it. "Laughing because the alternative is screaming."
- Tone whiplash is your weapon: a hilarious scene that suddenly becomes genuinely painful, or vice versa.
- The reader should feel guilty for laughing \u2014 that's the sweet spot.

COMEDY TECHNIQUES FOR DARK MATERIAL:
- Absurdist escalation: Start with something mildly wrong, then make it impossibly, hilariously wrong
- Bureaucratic horror: Systems and rules applied to situations where they're grotesquely inappropriate
- Understatement: Characters treating horrifying situations as mundane inconveniences
- Dramatic irony: The reader sees the horror; the characters are oblivious
- Comic specificity: "He died" isn't funny. "He died mid-sentence while explaining his dental plan" is.

SATIRE ELEMENTS:
- The best dark comedy CRITICIZES something real through exaggeration
- Institutions, social norms, power structures \u2014 these are your targets
- The humor should make a point, not just shock
- Characters who represent systems (bureaucrats, middle managers, committee members) are goldmines

WHAT DARK COMEDY READERS EXPECT:
- To laugh at things they probably shouldn't
- Social commentary delivered through humor
- Characters who cope with horror through wit
- Moments of genuine emotional weight amid the absurdity
- A world that's recognizably ours, but twisted`,
      pacing: `DARK COMEDY PACING:
- Quick scenes for comedy, slower scenes for the darkness to land
- Setup \u2192 Setup \u2192 Punchline (rule of three, always subvert the third)
- Let the joke land, then hit them with the emotional truth underneath it
- Fast banter should be broken by moments of uncomfortable silence
- Comic set pieces need room to escalate \u2014 don't rush the buildup`
    },
    mystery: {
      label: "Mystery / Crime",
      conventions: `MYSTERY GENRE INTELLIGENCE:

CLUE ARCHITECTURE:
- Fair play: the reader should have access to the same clues as the detective
- Plant clues in PLAIN SIGHT by surrounding them with distracting details
- Red herrings should be plausible enough to genuinely mislead
- The solution should be SURPRISING but INEVITABLE in hindsight

INVESTIGATION STRUCTURE:
- Each chapter should eliminate a theory AND raise a new question
- Suspects should be introduced organically, not lined up for inspection
- The detective should be WRONG at least once \u2014 confidence followed by reversal
- Motive > Method. Readers care about WHY more than HOW.

TENSION IN MYSTERY:
- The real tension is intellectual: "Can I solve it before the detective?"
- Layer in physical danger to keep stakes concrete
- Time pressure prevents the detective from simply thinking forever
- Personal stakes (the detective has something to lose) elevate beyond puzzle

WHAT MYSTERY READERS EXPECT:
- A puzzle they can participate in solving
- A satisfying "aha!" moment when the truth is revealed
- Clues they can look back and recognize
- A detective with a distinctive method and personality
- Justice \u2014 or at least truth \u2014 prevailing`,
      pacing: `MYSTERY PACING:
- Each interview/investigation scene should change the theory of the crime
- Alternate between active investigation and processing what was learned
- Red herring chapters should feel as satisfying as real-clue chapters
- The pacing should tighten as the suspect list narrows
- The reveal scene should play out at a deliberate pace \u2014 don't rush the explanation`
    }
  };
  function getGenreGuide(genres = []) {
    if (typeof genres === "string") genres = [genres];
    genres = genres.map((g) => g.toLowerCase().trim().replace(/\s+/g, "-"));
    const guides = [];
    for (const genre of genres) {
      if (genreGuides[genre]) {
        guides.push(genreGuides[genre]);
        continue;
      }
      const key = Object.keys(genreGuides).find(
        (k) => genre.includes(k) || k.includes(genre) || genreGuides[k].label.toLowerCase().includes(genre)
      );
      if (key) {
        guides.push(genreGuides[key]);
      }
    }
    if (guides.length === 0) return null;
    return {
      conventions: guides.map((g) => g.conventions).join("\n\n"),
      pacing: guides.map((g) => g.pacing).join("\n\n")
    };
  }

  // src/services/storyBrain.js
  var TOKEN_BUDGETS = {
    continue: { context: 2e3, craft: 400 },
    scene: { context: 3e3, craft: 600 },
    dialogue: { context: 2500, craft: 500 },
    rewrite: { context: 1500, craft: 400 },
    expand: { context: 1500, craft: 300 },
    improve: { context: 2e3, craft: 300 },
    mood: { context: 2e3, craft: 500 },
    characterIntro: { context: 2e3, craft: 300 },
    styleMatch: { context: 2e3, craft: 300 },
    integrate: { context: 1500, craft: 200 },
    planning: { context: 3e3, craft: 500 }
  };
  var CHARS_PER_TOKEN = 4;
  var StoryBrain = class {
    constructor() {
      this.contextCache = null;
      this.contextCacheKey = null;
      this.contextCacheTTL = 3e4;
      this.contextCacheTime = 0;
      this.storyArcCache = null;
    }
    // ─── Context Assembly ──────────────────────────────────────
    /**
     * Get compressed, relevant context for a writing action.
     * This is the heart of token efficiency: we only send what matters.
     */
    async getContext(options = {}) {
      var _a;
      const {
        text = "",
        chapterNumber = null,
        bookId = null,
        chapterId = null,
        action = "continue",
        includeAllCharacters = false
      } = options;
      const cacheKey = `${bookId}_${chapterId}_${action}_${text.length}`;
      if (this.contextCache && this.contextCacheKey === cacheKey && Date.now() - this.contextCacheTime < this.contextCacheTTL) {
        return this.contextCache;
      }
      const { contextText, rawContext } = await smartContextEngine_default.buildAIContext({
        text,
        chapterNumber,
        bookId,
        chapterId,
        includeAllCharacters,
        contextOptions: {
          includePlotBeats: true,
          includeCharacterArcs: ["scene", "continue", "planning"].includes(action),
          includeTimeline: ["scene", "planning", "continue"].includes(action),
          includeDecisions: ["scene", "planning", "continue"].includes(action),
          includeCallbacks: ["scene", "continue", "dialogue"].includes(action),
          includeMemories: ["scene", "continue"].includes(action),
          includeAISuggestions: ["scene", "planning"].includes(action),
          includeStorylines: ["scene", "planning", "continue"].includes(action)
        }
      });
      const budget = TOKEN_BUDGETS[action] || TOKEN_BUDGETS.continue;
      const maxContextChars = budget.context * CHARS_PER_TOKEN;
      const compressed = this._compressContext(contextText, maxContextChars, action);
      let storySoFar = "";
      if (bookId && ["continue", "scene", "dialogue", "planning", "characterIntro"].includes(action)) {
        try {
          storySoFar = await chapterMemoryService_default.buildStorySoFar(bookId, chapterNumber || Infinity, 1500);
        } catch (_) {
        }
      }
      let arcGuidance = "";
      if (["continue", "scene", "planning"].includes(action)) {
        try {
          const books = await database_default.getAll("books");
          const book = books.find((b) => b.id === bookId);
          const totalChapters = ((_a = book == null ? void 0 : book.chapters) == null ? void 0 : _a.length) || 0;
          const arcInfo = await narrativeArcService_default.getArcGuidance(bookId, chapterNumber || 1, totalChapters);
          arcGuidance = arcInfo.guidance;
        } catch (_) {
        }
      }
      let genreGuidance = "";
      if (["continue", "scene", "dialogue", "mood", "characterIntro"].includes(action)) {
        try {
          const storyProfile = rawContext == null ? void 0 : rawContext.storyProfile;
          const genres = (storyProfile == null ? void 0 : storyProfile.genres) || ((storyProfile == null ? void 0 : storyProfile.genre) ? [storyProfile.genre] : []);
          if (genres.length > 0) {
            const guide = getGenreGuide(genres);
            if (guide) {
              genreGuidance = guide.conventions;
              if (["scene", "continue"].includes(action)) {
                genreGuidance += "\n\n" + guide.pacing;
              }
            }
          }
        } catch (_) {
        }
      }
      let preferencesGuidance = "";
      try {
        const prefs = await database_default.get("meta", "writing_preferences");
        if (prefs) {
          const parts = [];
          if (prefs.pov) parts.push(`POV: ${prefs.pov}`);
          if (prefs.tense) parts.push(`Tense: ${prefs.tense}`);
          if (prefs.dialogueStyle) parts.push(`Dialogue style: ${prefs.dialogueStyle}`);
          if (prefs.descriptionDensity) parts.push(`Description density: ${prefs.descriptionDensity}`);
          if (prefs.profanityLevel) parts.push(`Profanity level: ${prefs.profanityLevel}`);
          if (prefs.violenceLevel) parts.push(`Violence level: ${prefs.violenceLevel}`);
          if (prefs.chapterLength) parts.push(`Target chapter length: ${prefs.chapterLength}`);
          const peeves = [...prefs.petPeeves || []];
          if (prefs.customPetPeeves) peeves.push(prefs.customPetPeeves);
          if (peeves.length > 0) parts.push(`NEVER DO: ${peeves.join(", ")}`);
          const favs = [...prefs.favorites || []];
          if (prefs.customFavorites) favs.push(prefs.customFavorites);
          if (favs.length > 0) parts.push(`PRIORITIZE: ${favs.join(", ")}`);
          if (parts.length > 0) {
            preferencesGuidance = "\n=== WRITER PREFERENCES ===\n" + parts.join("\n");
          }
        }
      } catch (_) {
      }
      const contextParts = [compressed];
      if (storySoFar) contextParts.push(storySoFar);
      if (arcGuidance) contextParts.push(arcGuidance);
      if (genreGuidance) contextParts.push("\n=== GENRE-SPECIFIC GUIDANCE ===\n" + genreGuidance);
      if (preferencesGuidance) contextParts.push(preferencesGuidance);
      const result = {
        systemContext: contextParts.join("\n\n"),
        rawContext,
        budget
      };
      this.contextCache = result;
      this.contextCacheKey = cacheKey;
      this.contextCacheTime = Date.now();
      return result;
    }
    /**
     * Compress context to fit within a character budget.
     * Prioritizes sections based on the writing action.
     */
    _compressContext(contextText, maxChars, action) {
      if (contextText.length <= maxChars) return contextText;
      const sections = contextText.split(/\n===\s+/);
      const header = sections[0];
      const priorities = {
        continue: ["WRITING STYLE", "CHARACTER VOICES", "CURRENT SCENE", "PLOT BEATS", "STORY", "WORLD"],
        scene: ["PLOT BEATS", "CHARACTER VOICES", "STORY", "WRITING STYLE", "MASTER TIMELINE", "ACTIVE STORYLINES", "CALLBACK", "WORLD"],
        dialogue: ["CHARACTER VOICES", "WRITING STYLE", "CURRENT SCENE", "STORY"],
        rewrite: ["WRITING STYLE", "STYLE RULES", "WRITING EXAMPLES", "WHAT NOT"],
        expand: ["WRITING STYLE", "CURRENT SCENE", "CHARACTER VOICES"],
        improve: ["WRITING STYLE", "STYLE RULES", "WHAT NOT"],
        mood: ["MOOD SETTINGS", "WRITING STYLE", "STORY", "CHARACTER VOICES"],
        characterIntro: ["CHARACTER VOICES", "STORY", "WORLD", "WRITING STYLE"],
        styleMatch: ["WRITING STYLE", "STYLE RULES", "WRITING EXAMPLES"],
        integrate: ["WRITING STYLE", "CURRENT SCENE"],
        planning: ["PLOT BEATS", "CHARACTER ARCS", "ACTIVE STORYLINES", "MASTER TIMELINE", "DECISION TRACKING", "STORY", "WORLD"]
      };
      const actionPriorities = priorities[action] || priorities.continue;
      const scored = sections.slice(1).map((section) => {
        const sectionTitle = section.split("===")[0].trim().toUpperCase();
        const priorityIdx = actionPriorities.findIndex(
          (p) => sectionTitle.includes(p)
        );
        return {
          text: `=== ${section}`,
          priority: priorityIdx >= 0 ? priorityIdx : 99,
          title: sectionTitle
        };
      });
      scored.sort((a, b) => a.priority - b.priority);
      let result = "";
      let remaining = maxChars;
      const trimmedHeader = header.length > 600 ? header.substring(0, 600) + "\n[...expert writing principles applied...]" : header;
      result += trimmedHeader;
      remaining -= trimmedHeader.length;
      for (const section of scored) {
        if (remaining <= 0) break;
        if (section.text.length <= remaining) {
          result += "\n" + section.text;
          remaining -= section.text.length;
        } else if (remaining > 200) {
          result += "\n" + section.text.substring(0, remaining - 50) + "\n[...truncated...]";
          remaining = 0;
        }
      }
      return result;
    }
    // ─── Craft Directives ──────────────────────────────────────
    /**
     * Get the writing craft directive for a specific action.
     * These are expert-level writing instructions that tell the AI
     * HOW to write well for this specific task.
     */
    getCraftDirective(action, moodPreset = null) {
      const parts = [];
      switch (action) {
        case "continue":
          parts.push(writingCraftGuide_default.continue.directive);
          parts.push(writingCraftGuide_default.continue.pacing);
          break;
        case "scene":
          parts.push(writingCraftGuide_default.scene.directive);
          parts.push(writingCraftGuide_default.scene.structure);
          break;
        case "dialogue":
          parts.push(writingCraftGuide_default.dialogue.directive);
          parts.push(writingCraftGuide_default.dialogue.patterns);
          break;
        case "rewrite":
          parts.push(writingCraftGuide_default.rewrite.directive);
          parts.push(writingCraftGuide_default.rewrite.checklist);
          break;
        case "expand":
          parts.push(writingCraftGuide_default.expand.directive);
          break;
        case "improve":
          parts.push(writingCraftGuide_default.rewrite.directive);
          break;
        case "mood":
          if (moodPreset === "comedy" || moodPreset === "funny") {
            parts.push(writingCraftGuide_default.mood.comedy);
          } else if (moodPreset === "horror" || moodPreset === "dark") {
            parts.push(writingCraftGuide_default.mood.horror);
          } else if (moodPreset === "tense" || moodPreset === "suspense") {
            parts.push(writingCraftGuide_default.mood.tension);
          } else {
            parts.push(writingCraftGuide_default.mood.comedy);
            parts.push(writingCraftGuide_default.mood.tension);
          }
          break;
        case "characterIntro":
          parts.push(writingCraftGuide_default.characterIntro.directive);
          break;
        case "styleMatch":
          parts.push(writingCraftGuide_default.styleMatch.directive);
          break;
        case "planning":
          parts.push(writingCraftGuide_default.planning.chapter_planning);
          parts.push(writingCraftGuide_default.forwardThinking.directive);
          break;
        default:
          parts.push(writingCraftGuide_default.continue.directive);
      }
      const budget = TOKEN_BUDGETS[action] || TOKEN_BUDGETS.continue;
      const maxChars = budget.craft * CHARS_PER_TOKEN;
      let directive = parts.join("\n\n");
      if (directive.length > maxChars) {
        directive = directive.substring(0, maxChars);
      }
      return directive;
    }
    // ─── Writing Actions ───────────────────────────────────────
    // Each method assembles the optimal prompt for a specific writing task.
    // The pattern: system = (story context + craft directive), user = (focused instruction + text)
    /**
     * Continue writing from where the text ends.
     */
    async continueWriting({ text, chapterNumber, bookId, chapterId, actors = [] }) {
      const { systemContext } = await this.getContext({
        text,
        chapterNumber,
        bookId,
        chapterId,
        action: "continue"
      });
      const craft = this.getCraftDirective("continue");
      const contextText = text.slice(-800);
      const characterNames = actors.map((a) => a.name).join(", ");
      const system = `You are the author of this story. Write in the EXACT same voice, style, and rhythm as the existing text.

${craft}

${systemContext}

Characters in this story: ${characterNames || "Use characters from context above."}`;
      const prompt = `Continue writing from where this text ends. Write the next 2-3 paragraphs. Do NOT explain, summarize, or use meta-commentary. Just write.

"""
${contextText}
"""`;
      return aiService_default.callAI(prompt, "creative", system);
    }
    /**
     * Generate a complete scene.
     */
    async generateScene({ text, chapterNumber, bookId, chapterId, actors = [], plotBeats = [] }) {
      const { systemContext } = await this.getContext({
        text,
        chapterNumber,
        bookId,
        chapterId,
        action: "scene"
      });
      const craft = this.getCraftDirective("scene");
      const contextText = text.slice(-1e3);
      const characterNames = actors.map((a) => a.name).join(", ");
      const uncompletedBeats = plotBeats.filter((b) => !b.completed);
      const nextBeat = uncompletedBeats[0];
      const beatInfo = nextBeat ? `SCENE OBJECTIVE: Address this plot beat: "${nextBeat.beat || nextBeat.purpose}"
Purpose: ${nextBeat.purpose || "Advance the story"}` : "SCENE OBJECTIVE: Continue the story naturally with a scene that develops character or advances plot.";
      const system = `You are the author of this story. Write a complete scene that fits naturally into the chapter.

${craft}

${systemContext}

Characters available: ${characterNames || "Use characters from context above."}`;
      const prompt = `Write the next scene for this chapter (3-5 paragraphs).

${beatInfo}

Current chapter content so far:
"""
${contextText}
"""

Write the scene. No explanation, no meta-commentary. Just vivid, engaging prose:`;
      return aiService_default.callAI(prompt, "creative", system);
    }
    /**
     * Generate dialogue between characters.
     */
    async generateDialogue({ text, chapterNumber, bookId, chapterId, actors = [], speakingCharacters = [] }) {
      const { systemContext } = await this.getContext({
        text,
        chapterNumber,
        bookId,
        chapterId,
        action: "dialogue"
      });
      const craft = this.getCraftDirective("dialogue");
      const contextText = text.slice(-600);
      const voiceNotes = [];
      for (const charName of speakingCharacters) {
        const voice = await smartContextEngine_default.getCharacterVoice(charName);
        if (voice) {
          voiceNotes.push(`${charName}: ${smartContextEngine_default.formatVoiceProfile(voice)}`);
        }
      }
      const characterNames = speakingCharacters.length > 0 ? speakingCharacters.join(" and ") : actors.map((a) => a.name).slice(0, 3).join(", ");
      const system = `You are the author of this story. Write dialogue that reveals character and advances the scene.

${craft}

${systemContext}

${voiceNotes.length > 0 ? "VOICE PROFILES FOR THIS CONVERSATION:\n" + voiceNotes.join("\n\n") : ""}`;
      const prompt = `Write a dialogue exchange between ${characterNames} that fits naturally after this text. Include action beats between lines. Each character should sound distinct.

Current text:
"""
${contextText}
"""

Write the dialogue. No explanation:`;
      return aiService_default.callAI(prompt, "creative", system);
    }
    /**
     * Rewrite selected text to be better.
     */
    async rewriteText({ selectedText, surroundingText, bookId, chapterId, chapterNumber }) {
      const { systemContext } = await this.getContext({
        text: surroundingText || selectedText,
        chapterNumber,
        bookId,
        chapterId,
        action: "rewrite"
      });
      const craft = this.getCraftDirective("rewrite");
      const system = `You are editing this story. Improve the passage while preserving the author's voice exactly.

${craft}

${systemContext}`;
      const prompt = `Rewrite this passage. Make it stronger, more vivid, and more engaging. Keep the same meaning, voice, and tone. Return ONLY the rewritten text.

"${selectedText}"`;
      return aiService_default.callAI(prompt, "creative", system);
    }
    /**
     * Expand selected text with more detail.
     */
    async expandText({ selectedText, surroundingText, bookId, chapterId, chapterNumber }) {
      const { systemContext } = await this.getContext({
        text: surroundingText || selectedText,
        chapterNumber,
        bookId,
        chapterId,
        action: "expand"
      });
      const craft = this.getCraftDirective("expand");
      const system = `You are expanding a passage in this story. Add depth without padding.

${craft}

${systemContext}`;
      const prompt = `Expand this passage with more detail, sensory information, and depth. Maintain the same voice and style. Return ONLY the expanded text.

"${selectedText}"`;
      return aiService_default.callAI(prompt, "creative", system);
    }
    /**
     * Apply a mood transformation to text.
     */
    async applyMood({ selectedText, moodPreset, moodSettings, bookId, chapterId, chapterNumber, surroundingText }) {
      const { systemContext } = await this.getContext({
        text: surroundingText || selectedText,
        chapterNumber,
        bookId,
        chapterId,
        action: "mood"
      });
      const craft = this.getCraftDirective("mood", moodPreset);
      const system = `You are adjusting the mood of a passage in this story.

${craft}

${systemContext}`;
      const prompt = `Rewrite this passage to be more ${moodPreset || "intense"}. Keep the core meaning and story events but transform the tone and atmosphere. Return ONLY the rewritten text.

"${selectedText}"`;
      return aiService_default.callAI(prompt, "creative", system);
    }
    /**
     * Suggest improvements for the text.
     */
    async suggestImprovements({ text, bookId, chapterId, chapterNumber }) {
      const { systemContext } = await this.getContext({
        text,
        chapterNumber,
        bookId,
        chapterId,
        action: "improve"
      });
      const craft = this.getCraftDirective("improve");
      const system = `You are an expert editor reviewing this story. Provide specific, actionable feedback.

${craft}

${systemContext}`;
      const textToAnalyze = text.slice(-2e3);
      const prompt = `Analyze this text and provide 3-5 specific improvement suggestions. For each:
1. Quote the exact passage that needs work
2. Explain WHY it's weak (be specific)
3. Show a rewritten version

Focus on: pacing, dialogue quality, show-don't-tell, voice consistency, and emotional impact.

Text:
"""
${textToAnalyze}
"""`;
      return aiService_default.callAI(prompt, "analytical", system);
    }
    /**
     * Match selected text to the story's established style.
     */
    async matchStyle({ selectedText, surroundingText, bookId, chapterId, chapterNumber }) {
      const { systemContext } = await this.getContext({
        text: surroundingText || selectedText,
        chapterNumber,
        bookId,
        chapterId,
        action: "styleMatch"
      });
      const craft = this.getCraftDirective("styleMatch");
      const system = `You are adjusting text to match this story's established writing style exactly.

${craft}

${systemContext}`;
      const prompt = `Rewrite this text to perfectly match the story's established style, voice, and rhythm. Keep the meaning but adjust everything else to sound like it was written by the same author. Return ONLY the rewritten text.

"${selectedText}"`;
      return aiService_default.callAI(prompt, "creative", system);
    }
    /**
     * Introduce a new character into the scene.
     */
    async introduceCharacter({ text, bookId, chapterId, chapterNumber, actors = [] }) {
      const { systemContext } = await this.getContext({
        text,
        chapterNumber,
        bookId,
        chapterId,
        action: "characterIntro",
        includeAllCharacters: true
      });
      const craft = this.getCraftDirective("characterIntro");
      const existingNames = actors.map((a) => a.name).join(", ");
      const system = `You are the author of this story, introducing a new character.

${craft}

${systemContext}`;
      const prompt = `Write 1-2 paragraphs introducing a NEW character into this scene. They should be memorable, distinctive, and serve a clear narrative purpose.

Existing characters (do NOT reintroduce these): ${existingNames || "None established yet."}

Current scene:
"""
${text.slice(-800)}
"""

Write the introduction. No explanation:`;
      return aiService_default.callAI(prompt, "creative", system);
    }
    /**
     * Integrate selected text smoothly with surroundings.
     */
    async integrateText({ selectedText, beforeText, afterText, bookId, chapterId, chapterNumber }) {
      const { systemContext } = await this.getContext({
        text: beforeText + selectedText + afterText,
        chapterNumber,
        bookId,
        chapterId,
        action: "integrate"
      });
      const craft = this.getCraftDirective("integrate");
      const system = `You are smoothing transitions in this story.

${craft}

${systemContext}`;
      const prompt = `This text needs to flow better with its surroundings. Add transitional phrases, sensory details, and smooth connections.

Text BEFORE:
"""
${beforeText.slice(-500)}
"""

TEXT TO INTEGRATE (rewrite this):
"""
${selectedText}
"""

Text AFTER:
"""
${afterText.slice(0, 500)}
"""

Rewrite ONLY the middle section to flow naturally. Return just the rewritten text:`;
      return aiService_default.callAI(prompt, "creative", system);
    }
    /**
     * Make selected text funnier.
     */
    async makeFunnier({ selectedText, surroundingText, bookId, chapterId, chapterNumber }) {
      const { systemContext } = await this.getContext({
        text: surroundingText || selectedText,
        chapterNumber,
        bookId,
        chapterId,
        action: "mood"
      });
      const craft = this.getCraftDirective("mood", "comedy");
      const system = `You are adding comedy to this story while keeping the plot intact.

${craft}

${systemContext}`;
      const prompt = `Make this passage funnier. Add witty observations, absurd details, or sharpen the comedic timing. Keep the plot events and character actions the same. Return ONLY the rewritten text.

"${selectedText}"`;
      return aiService_default.callAI(prompt, "creative", system);
    }
    /**
     * Make selected text darker/more tense.
     */
    async makeDarker({ selectedText, surroundingText, bookId, chapterId, chapterNumber }) {
      const { systemContext } = await this.getContext({
        text: surroundingText || selectedText,
        chapterNumber,
        bookId,
        chapterId,
        action: "mood"
      });
      const craft = this.getCraftDirective("mood", "horror");
      const system = `You are adding tension and darkness to this story while keeping the plot intact.

${craft}

${systemContext}`;
      const prompt = `Make this passage darker and more unsettling. Add dread, tension, or horror elements. Keep the plot events but transform the atmosphere. Return ONLY the rewritten text.

"${selectedText}"`;
      return aiService_default.callAI(prompt, "creative", system);
    }
    // ─── Forward Thinking / Story Planning ─────────────────────
    /**
     * Analyze the story so far and suggest what should happen next.
     * This is the "forward thinking" feature - the AI acts as a story consultant.
     */
    async analyzeStoryProgression({ bookId, chapterId, chapterNumber, text }) {
      const { systemContext } = await this.getContext({
        text,
        chapterNumber,
        bookId,
        chapterId,
        action: "planning"
      });
      const craft = this.getCraftDirective("planning");
      let plotThreads = [];
      let characterArcs = [];
      try {
        plotThreads = await database_default.getAll("plotThreads");
        characterArcs = await database_default.getAll("characterArcs");
      } catch (_) {
      }
      const plotSummary = plotThreads.length > 0 ? `
ACTIVE PLOT THREADS:
${plotThreads.filter((t) => t.status !== "resolved").map((t) => `- ${t.title || t.description}: ${t.status || "active"}`).join("\n")}` : "";
      const arcSummary = characterArcs.length > 0 ? `
CHARACTER ARCS:
${characterArcs.map((a) => `- ${a.characterName}: ${a.currentPhase || "developing"}`).join("\n")}` : "";
      const system = `You are a story consultant analyzing this manuscript and planning its future direction.

${craft}

${systemContext}
${plotSummary}
${arcSummary}`;
      const prompt = `Based on everything you know about this story, analyze its current state and provide forward-thinking suggestions.

Return a JSON object:
{
  "storyHealth": {
    "pacing": "assessment of current pacing",
    "tension": "is tension building appropriately?",
    "characterDevelopment": "are characters growing?",
    "plotProgression": "where are we in the story arc?"
  },
  "unresolved": [
    "List of setups/promises that haven't paid off yet"
  ],
  "nextChapterSuggestions": [
    {
      "idea": "What should happen next",
      "reasoning": "Why this would work well here",
      "characters": ["who's involved"],
      "type": "escalation|revelation|character|action|aftermath"
    }
  ],
  "warningsAndOpportunities": [
    {
      "type": "warning|opportunity",
      "description": "What you noticed",
      "suggestion": "What to do about it"
    }
  ],
  "thematicNotes": "What themes are emerging and how to develop them"
}`;
      const response = await aiService_default.callAI(prompt, "analytical", system);
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (_) {
      }
      return { raw: response };
    }
    /**
     * Get quick "what should happen next" suggestions without full analysis.
     * Cheaper/faster than full story progression analysis.
     */
    async getNextBeatSuggestions({ text, chapterNumber, bookId, chapterId, actors = [] }) {
      const { systemContext } = await this.getContext({
        text,
        chapterNumber,
        bookId,
        chapterId,
        action: "continue"
      });
      const characterNames = actors.map((a) => a.name).join(", ");
      const system = `You are a story consultant suggesting what should happen next.

${systemContext}`;
      const prompt = `Based on where the story currently stands, suggest 3 different directions the next scene could go. Make each suggestion different in tone and approach.

Current chapter text (ending):
"""
${text.slice(-500)}
"""

Characters available: ${characterNames}

Return a JSON array of 3 suggestions:
[
  {
    "direction": "Brief description of what happens",
    "tone": "comedic|tense|emotional|action|revelatory",
    "characters": ["who's involved"],
    "hookLine": "A compelling first line that would start this direction"
  }
]`;
      const response = await aiService_default.callAI(prompt, "analytical", system);
      try {
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (_) {
      }
      return [];
    }
    // ─── Utility ───────────────────────────────────────────────
    /**
     * Clear all caches (call when story data changes).
     */
    clearCache() {
      this.contextCache = null;
      this.contextCacheKey = null;
      this.storyArcCache = null;
      smartContextEngine_default.clearCache();
    }
  };
  var storyBrain = new StoryBrain();
  var storyBrain_default = storyBrain;

  // src/services/writingEnhancementServices.js
  var _getEnhancementContext = async (text, bookId, chapterId, action = "rewrite") => {
    try {
      const { systemContext } = await storyBrain_default.getContext({
        text: text || "",
        bookId,
        chapterId,
        action
      });
      return systemContext;
    } catch (_) {
      return "";
    }
  };
  var checkContinuity = async (selectedText, currentChapterId, currentBookId, worldState) => {
    try {
      const allChapters = await contextEngine_default.getAllChapters();
      const currentChapter = allChapters.find((c) => c.id === currentChapterId && c.bookId === currentBookId);
      if (!currentChapter) return { issues: [], suggestions: [] };
      const previousChapters = allChapters.filter((c) => c.bookId === currentBookId && c.number < currentChapter.number).sort((a, b) => b.number - a.number).slice(0, 5);
      const previousText = previousChapters.map((c) => `Chapter ${c.number}: ${c.content || c.script || ""}`).join("\n\n").slice(-5e3);
      const systemContext = await _getEnhancementContext(selectedText, currentBookId, currentChapterId, "rewrite");
      const prompt = `=== CONTINUITY CHECK ===
Analyze this selected text for inconsistencies with previous chapters.

SELECTED TEXT:
"""
${selectedText}
"""

PREVIOUS CHAPTERS CONTEXT:
"""
${previousText}
"""

CHARACTERS IN STORY:
${(worldState.actors || []).map((a) => `- ${a.name} (${a.role || "NPC"})`).join("\n")}

ITEMS IN STORY:
${(worldState.itemBank || []).slice(0, 20).map((i) => `- ${i.name}`).join("\n")}

Check for:
1. Character appearance inconsistencies (hair color, height, scars mentioned differently)
2. Item ownership conflicts (character has item they shouldn't, or lost item they still have)
3. Stat changes that don't match previous chapters
4. Location inconsistencies
5. Timeline issues (events happening out of order)

Return JSON:
{
  "issues": [
    {
      "type": "appearance|ownership|stat|location|timeline",
      "severity": "high|medium|low",
      "description": "Issue description",
      "originalText": "Problematic text",
      "suggestedFix": "Corrected version",
      "confidence": 0.85
    }
  ]
}`;
      const response = await aiService_default.callAI(prompt, "structured", systemContext);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed;
      }
      return { issues: [], suggestions: [] };
    } catch (error) {
      console.error("Error checking continuity:", error);
      return { issues: [], suggestions: [] };
    }
  };
  var enhanceDialogue = async (dialogueText, characterName, chapterId, bookId) => {
    var _a, _b, _c;
    try {
      const voiceProfile = await smartContextEngine_default.getCharacterVoice(characterName);
      const systemContext = await _getEnhancementContext(dialogueText, bookId, chapterId, "dialogue");
      const system = `You are enhancing dialogue to match a character's voice profile.

${systemContext}`;
      const prompt = `Enhance this dialogue to match ${characterName}'s voice profile exactly.

DIALOGUE:
"""
${dialogueText}
"""

${voiceProfile ? `
VOICE PROFILE:
- Speech Patterns: ${voiceProfile.speechPatterns || "Not specified"}
- Vocabulary: ${((_a = voiceProfile.vocabularyChoices) == null ? void 0 : _a.join(", ")) || "Not specified"}
- Avoid: ${((_b = voiceProfile.vocabularyAvoid) == null ? void 0 : _b.join(", ")) || "None"}
- Quirks: ${((_c = voiceProfile.quirks) == null ? void 0 : _c.join(", ")) || "None"}
` : "No voice profile available - use general character voice"}

Return ONLY the enhanced dialogue (no explanations):`;
      const response = await aiService_default.callAI(prompt, "creative", system);
      return response.trim();
    } catch (error) {
      console.error("Error enhancing dialogue:", error);
      return dialogueText;
    }
  };
  var analyzePacing = async (chapterText) => {
    try {
      const sentences = chapterText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
      const paragraphs = chapterText.split(/\n\n+/).filter((p) => p.trim().length > 0);
      const sentenceLengths = sentences.map((s) => s.split(/\s+/).length);
      const avgSentenceLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
      const paragraphLengths = paragraphs.map((p) => p.split(/\s+/).length);
      const avgParagraphLength = paragraphLengths.reduce((a, b) => a + b, 0) / paragraphLengths.length;
      const dialogueCount = (chapterText.match(/["'"]/g) || []).length / 2;
      const actionWords = (chapterText.match(/\b(moved|ran|jumped|struck|attacked|fought|dodged|blocked)\b/gi) || []).length;
      const descriptiveWords = (chapterText.match(/\b(saw|felt|heard|smelled|tasted|looked|appeared|seemed)\b/gi) || []).length;
      const totalWords = chapterText.split(/\s+/).length;
      const dialoguePercent = dialogueCount * 20 / totalWords * 100;
      const actionPercent = actionWords * 10 / totalWords * 100;
      const descriptionPercent = descriptiveWords * 8 / totalWords * 100;
      const issues = [];
      const suggestions = [];
      if (avgSentenceLength < 8) {
        issues.push({
          type: "pacing",
          severity: "medium",
          description: "Very short sentences - may feel choppy",
          location: "throughout",
          suggestion: "Consider combining some short sentences for better flow"
        });
      } else if (avgSentenceLength > 25) {
        issues.push({
          type: "pacing",
          severity: "medium",
          description: "Very long sentences - may slow pacing",
          location: "throughout",
          suggestion: "Break up some long sentences for better readability"
        });
      }
      if (dialoguePercent < 20) {
        suggestions.push("Consider adding more dialogue to break up narrative");
      } else if (dialoguePercent > 60) {
        suggestions.push("High dialogue ratio - consider adding more action or description");
      }
      if (actionPercent < 10 && descriptionPercent > 40) {
        issues.push({
          type: "pacing",
          severity: "low",
          description: "Heavy on description, light on action",
          location: "throughout",
          suggestion: "Add action beats to maintain momentum"
        });
      }
      return {
        metrics: {
          avgSentenceLength: Math.round(avgSentenceLength),
          avgParagraphLength: Math.round(avgParagraphLength),
          dialoguePercent: Math.round(dialoguePercent),
          actionPercent: Math.round(actionPercent),
          descriptionPercent: Math.round(descriptionPercent)
        },
        issues,
        suggestions,
        timeline: (void 0)._createPacingTimeline(chapterText, paragraphs)
      };
    } catch (error) {
      console.error("Error analyzing pacing:", error);
      return { metrics: {}, issues: [], suggestions: [], timeline: [] };
    }
  };
  var trackEmotionalBeats = async (chapterText, chapterId, bookId) => {
    try {
      const systemContext = await _getEnhancementContext(chapterText, bookId, chapterId, "rewrite");
      const prompt = `Analyze this chapter text and identify emotional beats (moments of high emotion, tension, relief, etc.).

CHAPTER TEXT:
"""
${chapterText.slice(0, 8e3)}
"""

Return JSON array:
[
  {
    "position": 0.25,
    "emotion": "tension|joy|sadness|anger|fear|relief|anticipation",
    "intensity": 1-10,
    "description": "What's happening emotionally",
    "text": "Excerpt from chapter"
  }
]`;
      const response = await aiService_default.callAI(prompt, "structured", systemContext);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const beats = JSON.parse(jsonMatch[0]);
        return {
          beats: beats.map((b) => ({
            ...b,
            position: b.position || 0,
            intensity: b.intensity || 5
          })),
          arc: _calculateEmotionalArc(beats)
        };
      }
      return { beats: [], arc: [] };
    } catch (error) {
      console.error("Error tracking emotional beats:", error);
      return { beats: [], arc: [] };
    }
  };
  var _calculateEmotionalArc = (beats) => {
    if (!beats || beats.length === 0) return [];
    return beats.map((b) => ({
      x: b.position,
      y: b.intensity,
      emotion: b.emotion
    }));
  };
  var checkVoiceConsistency = async (dialogueText, characterName, chapterId, bookId) => {
    var _a, _b, _c;
    try {
      const voiceProfile = await smartContextEngine_default.getCharacterVoice(characterName);
      if (!voiceProfile) {
        return { issues: [], suggestions: [] };
      }
      const systemContext = await _getEnhancementContext(dialogueText, bookId, chapterId, "dialogue");
      const prompt = `Check if this dialogue matches the character's voice profile.

DIALOGUE:
"""
${dialogueText}
"""

CHARACTER: ${characterName}
VOICE PROFILE:
- Speech Patterns: ${voiceProfile.speechPatterns || "Not specified"}
- Vocabulary: ${((_a = voiceProfile.vocabularyChoices) == null ? void 0 : _a.join(", ")) || "Not specified"}
- Avoid: ${((_b = voiceProfile.vocabularyAvoid) == null ? void 0 : _b.join(", ")) || "None"}
- Quirks: ${((_c = voiceProfile.quirks) == null ? void 0 : _c.join(", ")) || "None"}

Return JSON:
{
  "matches": true/false,
  "issues": ["Issue 1", "Issue 2"],
  "suggestedDialogue": "Corrected dialogue"
}`;
      const response = await aiService_default.callAI(prompt, "structured", systemContext);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { matches: true, issues: [], suggestedDialogue: dialogueText };
    } catch (error) {
      console.error("Error checking voice consistency:", error);
      return { matches: true, issues: [], suggestedDialogue: dialogueText };
    }
  };
  var generateSceneTransition = async (endOfScene, startOfNextScene, transitionStyle, chapterId, bookId) => {
    try {
      const systemContext = await _getEnhancementContext(endOfScene + "\n\n" + startOfNextScene, bookId, chapterId, "integrate");
      const styleOptions = {
        abrupt: "Abrupt cut - immediate shift",
        smooth: "Smooth transition - natural flow",
        time_skip: "Time skip - indicate passage of time",
        location_change: "Location transition - moving between places",
        pov_shift: "POV shift - change perspective"
      };
      const prompt = `Generate a transition paragraph between these two scenes.

END OF SCENE:
"""
${endOfScene.slice(-500)}
"""

START OF NEXT SCENE:
"""
${startOfNextScene.slice(0, 500)}
"""

TRANSITION STYLE: ${styleOptions[transitionStyle] || "smooth"}

Return ONLY the transition paragraph (no explanations):`;
      const response = await aiService_default.callAI(prompt, "creative", systemContext);
      return response.trim();
    } catch (error) {
      console.error("Error generating transition:", error);
      return "";
    }
  };
  var escalateConflict = async (conflictText, chapterId, bookId) => {
    try {
      const systemContext = await _getEnhancementContext(conflictText, bookId, chapterId, "scene");
      const prompt = `This text contains a conflict. Generate 3 options to escalate the tension and stakes.

CONFLICT TEXT:
"""
${conflictText}
"""

Return JSON:
{
  "options": [
    {
      "description": "Escalation approach",
      "text": "Escalated version of the conflict",
      "intensity": 1-10
    }
  ]
}`;
      const response = await aiService_default.callAI(prompt, "structured", systemContext);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { options: [] };
    } catch (error) {
      console.error("Error escalating conflict:", error);
      return { options: [] };
    }
  };
  var injectSensoryDetails = async (paragraphText, senses, chapterId, bookId) => {
    try {
      const systemContext = await _getEnhancementContext(paragraphText, bookId, chapterId, "expand");
      const senseList = Array.isArray(senses) ? senses.join(", ") : senses || "sight, sound, smell, touch, taste";
      const prompt = `Enhance this paragraph by adding sensory details for: ${senseList}

PARAGRAPH:
"""
${paragraphText}
"""

Return the enhanced paragraph with natural sensory details woven in (no explanations):`;
      const response = await aiService_default.callAI(prompt, "creative", systemContext);
      return response.trim();
    } catch (error) {
      console.error("Error injecting sensory details:", error);
      return paragraphText;
    }
  };
  var suggestForeshadowing = async (chapterText, futureChapters, chapterId, bookId) => {
    try {
      const systemContext = await _getEnhancementContext(chapterText, bookId, chapterId, "planning");
      const futureContext = futureChapters.slice(0, 3).map((c) => `Chapter ${c.number}: ${c.title || "Untitled"}`).join("\n");
      const prompt = `Analyze this chapter for opportunities to add foreshadowing for future events.

CURRENT CHAPTER:
"""
${chapterText.slice(0, 5e3)}
"""

FUTURE CHAPTERS:
${futureContext}

Return JSON:
{
  "opportunities": [
    {
      "position": "beginning|middle|end",
      "description": "What to foreshadow",
      "suggestedText": "Foreshadowing text to add",
      "linksTo": "Future chapter/event"
    }
  ]
}`;
      const response = await aiService_default.callAI(prompt, "structured", systemContext);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { opportunities: [] };
    } catch (error) {
      console.error("Error suggesting foreshadowing:", error);
      return { opportunities: [] };
    }
  };
  var generateChapterSummary = async (chapterText, chapterId, bookId, chapterTitle) => {
    try {
      const systemContext = await _getEnhancementContext(chapterText, bookId, chapterId, "planning");
      const prompt = `Generate a concise chapter summary (2-3 sentences) covering:
- Key events
- Character appearances
- Important item/skill acquisitions
- Significant plot developments

CHAPTER: ${chapterTitle || "Untitled"}
CONTENT:
"""
${chapterText.slice(0, 1e4)}
"""

Return ONLY the summary text (no JSON, no explanations):`;
      const response = await aiService_default.callAI(prompt, "creative", systemContext);
      const events = await chapterDataExtractionService_default.extractEventsFromChapter(
        chapterText,
        chapterId,
        bookId,
        []
      );
      return {
        summary: response.trim(),
        events: events.length,
        characters: [...new Set(events.flatMap((e) => e.actors || []))].length,
        items: events.filter((e) => e.type === "item_event").length,
        skills: events.filter((e) => e.type === "skill_event").length
      };
    } catch (error) {
      console.error("Error generating summary:", error);
      return { summary: "", events: 0, characters: 0, items: 0, skills: 0 };
    }
  };
  var writingEnhancementServices_default = {
    checkContinuity,
    enhanceDialogue,
    analyzePacing,
    trackEmotionalBeats,
    checkVoiceConsistency,
    generateSceneTransition,
    escalateConflict,
    injectSensoryDetails,
    suggestForeshadowing,
    generateChapterSummary
  };

  // src/services/integrationService.js
  init_database();
  var IntegrationService = class {
    constructor() {
      this.pendingIntegrations = [];
    }
    /**
     * Route a single extraction to appropriate systems
     */
    async routeExtraction(entity, chapterId, bookId) {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
      const integrations = [];
      const timestamp = Date.now();
      integrations.push({
        system: "timeline",
        action: "add_event",
        data: this.createTimelineEvent(entity, chapterId, bookId, timestamp)
      });
      integrations.push({
        system: "mindMap",
        action: "add_node",
        data: this.createMindMapNode(entity, chapterId)
      });
      switch (entity.type) {
        case "actor":
          integrations.push({
            system: "characterArcs",
            action: "update",
            data: this.createCharacterArcUpdate(entity, chapterId, bookId)
          });
          integrations.push({
            system: "wiki",
            action: "create_or_update",
            data: this.createWikiEntry(entity, "actor", chapterId, bookId)
          });
          break;
        case "stat_change":
        case "actor-update":
          integrations.push({
            system: "characterArcs",
            action: "update_stats",
            data: this.createStatChangeUpdate(entity, chapterId, bookId)
          });
          integrations.push({
            system: "timeline",
            action: "add_stat_event",
            data: this.createStatTimelineEvent(entity, chapterId, bookId, timestamp)
          });
          break;
        case "item":
          integrations.push({
            system: "wiki",
            action: "create_or_update",
            data: this.createWikiEntry(entity, "item", chapterId, bookId)
          });
          break;
        case "skill":
          integrations.push({
            system: "wiki",
            action: "create_or_update",
            data: this.createWikiEntry(entity, "skill", chapterId, bookId)
          });
          break;
        case "location":
          integrations.push({
            system: "ukMap",
            action: "add_marker",
            data: this.createLocationMarker(entity, chapterId, bookId)
          });
          integrations.push({
            system: "wiki",
            action: "create_location",
            data: this.createWikiEntry(entity, "location", chapterId, bookId)
          });
          break;
        case "inventory":
          integrations.push({
            system: "characterArcs",
            action: "update_inventory",
            data: this.createInventoryUpdate(entity, chapterId, bookId)
          });
          break;
        case "relationship":
          integrations.push({
            system: "relationships",
            action: "create_or_update",
            data: this.createRelationshipUpdate(entity, chapterId, bookId)
          });
          integrations.push({
            system: "mindMap",
            action: "add_edge",
            data: this.createRelationshipEdge(entity, chapterId)
          });
          break;
        case "event":
          integrations.push({
            system: "plotThreads",
            action: "add_event",
            data: this.createPlotEvent(entity, chapterId, bookId)
          });
          integrations.push({
            system: "wiki",
            action: "create_event",
            data: this.createWikiEntry(entity, "event", chapterId, bookId)
          });
          break;
        case "quest":
          integrations.push({
            system: "plotQuests",
            action: "create_or_update",
            data: {
              id: entity.id || `pq_${Date.now()}`,
              title: ((_a = entity.data) == null ? void 0 : _a.title) || entity.name,
              description: ((_b = entity.data) == null ? void 0 : _b.description) || "",
              type: ((_c = entity.data) == null ? void 0 : _c.type) || "sub",
              status: ((_d = entity.data) == null ? void 0 : _d.status) || "active",
              objectives: ((_e = entity.data) == null ? void 0 : _e.objectives) || [],
              chapterId,
              bookId,
              createdAt: Date.now()
            }
          });
          break;
        case "faction":
          integrations.push({
            system: "factions",
            action: "create_or_update",
            data: {
              id: entity.id || `fac_${Date.now()}`,
              name: ((_f = entity.data) == null ? void 0 : _f.name) || entity.name,
              type: ((_g = entity.data) == null ? void 0 : _g.type) || "organization",
              description: ((_h = entity.data) == null ? void 0 : _h.description) || "",
              members: ((_i = entity.data) == null ? void 0 : _i.members) || [],
              goals: ((_j = entity.data) == null ? void 0 : _j.goals) || "",
              status: "active",
              chapterId,
              bookId,
              createdAt: Date.now()
            }
          });
          break;
        default:
          integrations.push({
            system: "wiki",
            action: "create_or_update",
            data: this.createWikiEntry(entity, entity.type, chapterId, bookId)
          });
      }
      if (((_k = entity.data) == null ? void 0 : _k.location) || ((_l = entity.data) == null ? void 0 : _l.toLocation)) {
        integrations.push({
          system: "ukMap",
          action: "add_travel",
          data: this.createTravelRecord(entity, chapterId, bookId, timestamp)
        });
      }
      return integrations;
    }
    /**
     * Generate preview of all integrations for multiple extractions
     */
    async generatePreview(extractions, chapterId, bookId) {
      const preview = {
        timeline: [],
        characterArcs: [],
        plotThreads: [],
        relationships: [],
        wiki: [],
        mindMap: { nodes: [], edges: [] },
        ukMap: { locations: [], travel: [] },
        summary: {
          totalEntities: extractions.length,
          timelineEvents: 0,
          wikiEntries: 0,
          characterUpdates: 0,
          locationMarkers: 0,
          mindMapNodes: 0,
          mindMapEdges: 0
        }
      };
      for (const extraction of extractions) {
        const integrations = await this.routeExtraction(extraction, chapterId, bookId);
        for (const integration of integrations) {
          switch (integration.system) {
            case "timeline":
              preview.timeline.push(integration.data);
              preview.summary.timelineEvents++;
              break;
            case "characterArcs":
              preview.characterArcs.push(integration.data);
              preview.summary.characterUpdates++;
              break;
            case "plotThreads":
              preview.plotThreads.push(integration.data);
              break;
            case "relationships":
              preview.relationships.push(integration.data);
              break;
            case "wiki":
              preview.wiki.push(integration.data);
              preview.summary.wikiEntries++;
              break;
            case "mindMap":
              if (integration.action === "add_node") {
                preview.mindMap.nodes.push(integration.data);
                preview.summary.mindMapNodes++;
              } else if (integration.action === "add_edge") {
                preview.mindMap.edges.push(integration.data);
                preview.summary.mindMapEdges++;
              }
              break;
            case "ukMap":
              if (integration.action === "add_marker") {
                preview.ukMap.locations.push(integration.data);
                preview.summary.locationMarkers++;
              } else if (integration.action === "add_travel") {
                preview.ukMap.travel.push(integration.data);
              }
              break;
            case "plotQuests":
              if (!preview.quests) preview.quests = [];
              preview.quests.push(integration.data);
              break;
            case "factions":
              if (!preview.factions) preview.factions = [];
              preview.factions.push(integration.data);
              break;
          }
        }
      }
      preview.suggestedPlotThreads = await this.detectPlotThreads(preview.timeline, extractions);
      return preview;
    }
    /**
     * Apply all integrations from a preview
     */
    async applyAllIntegrations(preview, options = {}) {
      const results = {
        success: [],
        failed: [],
        skipped: []
      };
      const {
        skipTimeline = false,
        skipWiki = false,
        skipCharacterArcs = false,
        skipMindMap = false,
        skipUKMap = false,
        skipPlotThreads = false,
        skipRelationships = false
      } = options;
      try {
        if (!skipTimeline) {
          for (const event of preview.timeline) {
            try {
              await database_default.add("timelineEvents", event);
              results.success.push({ system: "timeline", id: event.id });
            } catch (error) {
              try {
                await database_default.update("timelineEvents", event);
                results.success.push({ system: "timeline", id: event.id, action: "updated" });
              } catch (e) {
                results.failed.push({ system: "timeline", id: event.id, error: e.message });
              }
            }
          }
        }
        if (!skipWiki) {
          for (const entry of preview.wiki) {
            try {
              const existing = await this.findExistingWikiEntry(entry);
              if (existing) {
                const merged = this.mergeWikiEntries(existing, entry);
                await database_default.update("wikiEntries", merged);
                results.success.push({ system: "wiki", id: entry.id, action: "merged" });
              } else {
                await database_default.add("wikiEntries", entry);
                results.success.push({ system: "wiki", id: entry.id });
              }
            } catch (error) {
              results.failed.push({ system: "wiki", id: entry.id, error: error.message });
            }
          }
        }
        if (!skipCharacterArcs) {
          for (const update of preview.characterArcs) {
            try {
              await this.applyCharacterArcUpdate(update);
              results.success.push({ system: "characterArcs", id: update.actorId });
            } catch (error) {
              results.failed.push({ system: "characterArcs", id: update.actorId, error: error.message });
            }
          }
        }
        if (!skipMindMap) {
          for (const node of preview.mindMap.nodes) {
            try {
              const existingNodes = await database_default.getAll("mindMapNodes");
              const exists = existingNodes.find((n) => n.entityId === node.entityId);
              if (!exists) {
                await database_default.add("mindMapNodes", node);
                results.success.push({ system: "mindMap", id: node.id, type: "node" });
              } else {
                results.skipped.push({ system: "mindMap", id: node.id, reason: "already exists" });
              }
            } catch (error) {
              results.failed.push({ system: "mindMap", id: node.id, error: error.message });
            }
          }
          for (const edge of preview.mindMap.edges) {
            try {
              await database_default.add("mindMapEdges", edge);
              results.success.push({ system: "mindMap", id: edge.id, type: "edge" });
            } catch (error) {
              results.failed.push({ system: "mindMap", id: edge.id, error: error.message });
            }
          }
        }
        if (!skipUKMap) {
          for (const location of preview.ukMap.locations) {
            try {
              const existingLocations = await database_default.getAll("locations");
              const exists = existingLocations.find(
                (l) => l.name.toLowerCase() === location.name.toLowerCase()
              );
              if (!exists) {
                await database_default.add("locations", location);
                results.success.push({ system: "ukMap", id: location.id, type: "location" });
              } else {
                exists.events = [.../* @__PURE__ */ new Set([...exists.events || [], ...location.events || []])];
                exists.charactersVisited = [.../* @__PURE__ */ new Set([...exists.charactersVisited || [], ...location.charactersVisited || []])];
                await database_default.update("locations", exists);
                results.success.push({ system: "ukMap", id: exists.id, type: "location", action: "updated" });
              }
            } catch (error) {
              results.failed.push({ system: "ukMap", id: location.id, error: error.message });
            }
          }
          for (const travel of preview.ukMap.travel) {
            try {
              await database_default.add("characterTravel", travel);
              results.success.push({ system: "ukMap", id: travel.id, type: "travel" });
            } catch (error) {
              results.failed.push({ system: "ukMap", id: travel.id, error: error.message });
            }
          }
        }
        if (!skipPlotThreads && preview.suggestedPlotThreads) {
          for (const thread of preview.suggestedPlotThreads) {
            if (thread.approved) {
              try {
                await this.applyPlotThread(thread);
                results.success.push({ system: "plotThreads", id: thread.id });
              } catch (error) {
                results.failed.push({ system: "plotThreads", id: thread.id, error: error.message });
              }
            }
          }
        }
        if (preview.quests) {
          for (const quest of preview.quests) {
            try {
              await database_default.add("plotQuests", quest);
              results.success.push({ system: "plotQuests", id: quest.id });
            } catch (error) {
              try {
                await database_default.update("plotQuests", quest);
                results.success.push({ system: "plotQuests", id: quest.id, action: "updated" });
              } catch (e) {
                results.failed.push({ system: "plotQuests", id: quest.id, error: e.message });
              }
            }
          }
        }
        if (preview.factions) {
          for (const faction of preview.factions) {
            try {
              await database_default.add("factions", faction);
              results.success.push({ system: "factions", id: faction.id });
            } catch (error) {
              try {
                await database_default.update("factions", faction);
                results.success.push({ system: "factions", id: faction.id, action: "updated" });
              } catch (e) {
                results.failed.push({ system: "factions", id: faction.id, error: e.message });
              }
            }
          }
        }
        if (!skipRelationships) {
          for (const rel of preview.relationships) {
            try {
              await database_default.add("relationships", rel);
              results.success.push({ system: "relationships", id: rel.id });
            } catch (error) {
              try {
                await database_default.update("relationships", rel);
                results.success.push({ system: "relationships", id: rel.id, action: "updated" });
              } catch (e) {
                results.failed.push({ system: "relationships", id: rel.id, error: e.message });
              }
            }
          }
        }
      } catch (error) {
        console.error("Error applying integrations:", error);
        results.error = error.message;
      }
      return results;
    }
    // ==================== Data Creation Methods ====================
    createTimelineEvent(entity, chapterId, bookId, timestamp) {
      var _a;
      return {
        id: `evt_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
        type: this.mapEntityTypeToEventType(entity.type),
        title: this.generateEventTitle(entity),
        description: ((_a = entity.data) == null ? void 0 : _a.description) || entity.sourceContext || "",
        bookId,
        chapterId,
        actors: this.extractActorIds(entity),
        items: this.extractItemIds(entity),
        locations: this.extractLocationIds(entity),
        skills: this.extractSkillIds(entity),
        timestamp,
        entityType: entity.type,
        entityId: entity.id,
        plotThreads: [],
        importance: entity.confidence || 0.5
      };
    }
    createStatTimelineEvent(entity, chapterId, bookId, timestamp) {
      var _a, _b, _c, _d, _e;
      const statChanges = ((_a = entity.data) == null ? void 0 : _a.stats) || ((_c = (_b = entity.data) == null ? void 0 : _b.changes) == null ? void 0 : _c.stats) || {};
      const actorName = ((_d = entity.data) == null ? void 0 : _d.actorName) || ((_e = entity.data) == null ? void 0 : _e.characterName) || "Unknown";
      return {
        id: `evt_stat_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
        type: "stat_change",
        title: `${actorName} - Stat Change`,
        description: Object.entries(statChanges).map(
          ([stat, val]) => `${stat}: ${val >= 0 ? "+" : ""}${val}`
        ).join(", "),
        bookId,
        chapterId,
        actors: [actorName],
        statChanges,
        timestamp,
        importance: 0.6
      };
    }
    createMindMapNode(entity, chapterId) {
      var _a, _b, _c;
      const name = ((_a = entity.data) == null ? void 0 : _a.name) || ((_b = entity.data) == null ? void 0 : _b.title) || ((_c = entity.data) == null ? void 0 : _c.actorName) || "Unknown";
      return {
        id: `node_${entity.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        entityId: entity.id || `entity_${Date.now()}`,
        entityType: entity.type,
        type: this.mapToMindMapNodeType(entity.type),
        label: name,
        group: this.determineNodeGroup(entity),
        size: this.calculateNodeSize(entity),
        x: Math.random() * 800,
        // Initial random position
        y: Math.random() * 600,
        metadata: {
          ...entity.data,
          sourceContext: entity.sourceContext,
          confidence: entity.confidence,
          chapterId
        }
      };
    }
    createRelationshipEdge(entity, chapterId) {
      var _a, _b, _c, _d, _e, _f, _g, _h;
      return {
        id: `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        source: `node_actor_${(_b = (_a = entity.data) == null ? void 0 : _a.actor1Name) == null ? void 0 : _b.toLowerCase().replace(/\s/g, "_")}`,
        target: `node_actor_${(_d = (_c = entity.data) == null ? void 0 : _c.actor2Name) == null ? void 0 : _d.toLowerCase().replace(/\s/g, "_")}`,
        type: ((_e = entity.data) == null ? void 0 : _e.type) || "related",
        label: ((_f = entity.data) == null ? void 0 : _f.description) || ((_g = entity.data) == null ? void 0 : _g.type) || "Related",
        chapterId,
        strength: ((_h = entity.data) == null ? void 0 : _h.strength) || 0.5,
        timestamp: Date.now()
      };
    }
    createCharacterArcUpdate(entity, chapterId, bookId) {
      var _a, _b, _c, _d, _e;
      return {
        actorId: ((_a = entity.data) == null ? void 0 : _a.id) || entity.id,
        actorName: (_b = entity.data) == null ? void 0 : _b.name,
        chapterId,
        bookId,
        timestamp: Date.now(),
        type: "appearance",
        description: ((_c = entity.data) == null ? void 0 : _c.description) || "",
        stats: (_d = entity.data) == null ? void 0 : _d.stats,
        emotionalState: this.inferEmotionalState(entity),
        goals: ((_e = entity.data) == null ? void 0 : _e.goals) || [],
        relationships: []
      };
    }
    createStatChangeUpdate(entity, chapterId, bookId) {
      var _a, _b, _c, _d, _e;
      return {
        actorId: null,
        // Will be resolved by name
        actorName: ((_a = entity.data) == null ? void 0 : _a.actorName) || ((_b = entity.data) == null ? void 0 : _b.characterName),
        chapterId,
        bookId,
        timestamp: Date.now(),
        type: "stat_change",
        statChanges: ((_c = entity.data) == null ? void 0 : _c.stats) || ((_e = (_d = entity.data) == null ? void 0 : _d.changes) == null ? void 0 : _e.stats) || {},
        description: entity.sourceContext || ""
      };
    }
    createInventoryUpdate(entity, chapterId, bookId) {
      var _a, _b, _c;
      return {
        actorName: (_a = entity.data) == null ? void 0 : _a.actorName,
        itemName: (_b = entity.data) == null ? void 0 : _b.itemName,
        action: (_c = entity.data) == null ? void 0 : _c.action,
        // 'pickup', 'drop', 'equip'
        chapterId,
        bookId,
        timestamp: Date.now()
      };
    }
    createRelationshipUpdate(entity, chapterId, bookId) {
      var _a, _b, _c, _d, _e, _f, _g, _h;
      return {
        id: `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        actors: [(_a = entity.data) == null ? void 0 : _a.actor1Name, (_b = entity.data) == null ? void 0 : _b.actor2Name].filter(Boolean),
        actor1Name: (_c = entity.data) == null ? void 0 : _c.actor1Name,
        actor2Name: (_d = entity.data) == null ? void 0 : _d.actor2Name,
        type: ((_e = entity.data) == null ? void 0 : _e.type) || "neutral",
        strength: ((_f = entity.data) == null ? void 0 : _f.strength) || 0.5,
        description: ((_g = entity.data) == null ? void 0 : _g.description) || "",
        chapterId,
        bookId,
        timestamp: Date.now(),
        events: [{
          chapterId,
          description: entity.sourceContext || ((_h = entity.data) == null ? void 0 : _h.description) || ""
        }]
      };
    }
    createLocationMarker(entity, chapterId, bookId) {
      var _a, _b, _c;
      const name = ((_a = entity.data) == null ? void 0 : _a.name) || "Unknown Location";
      const coords = this.getUKCoordinates(name);
      return {
        id: `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        coordinates: coords.svg,
        realCoords: coords.real,
        type: ((_b = entity.data) == null ? void 0 : _b.type) || "location",
        description: ((_c = entity.data) == null ? void 0 : _c.description) || "",
        events: [],
        charactersVisited: this.extractActorNames(entity),
        firstAppearance: { bookId, chapterId },
        lastAppearance: { bookId, chapterId },
        createdAt: Date.now()
      };
    }
    createTravelRecord(entity, chapterId, bookId, timestamp) {
      var _a, _b, _c, _d, _e, _f;
      return {
        id: `travel_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
        actorId: (_a = entity.data) == null ? void 0 : _a.actorId,
        actorName: ((_b = entity.data) == null ? void 0 : _b.actorName) || ((_c = entity.data) == null ? void 0 : _c.characterName),
        fromLocation: (_d = entity.data) == null ? void 0 : _d.fromLocation,
        toLocation: ((_e = entity.data) == null ? void 0 : _e.toLocation) || ((_f = entity.data) == null ? void 0 : _f.location),
        chapterId,
        bookId,
        timestamp,
        description: entity.sourceContext || ""
      };
    }
    createPlotEvent(entity, chapterId, bookId) {
      var _a, _b, _c, _d, _e;
      return {
        id: `plot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: ((_a = entity.data) == null ? void 0 : _a.name) || ((_b = entity.data) == null ? void 0 : _b.title) || "Event",
        description: ((_c = entity.data) == null ? void 0 : _c.description) || "",
        participants: ((_d = entity.data) == null ? void 0 : _d.participants) || this.extractActorNames(entity),
        chapterId,
        bookId,
        timestamp: Date.now(),
        type: "milestone",
        consequences: ((_e = entity.data) == null ? void 0 : _e.consequences) || []
      };
    }
    createWikiEntry(entity, entityType, chapterId, bookId) {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t;
      const name = ((_a = entity.data) == null ? void 0 : _a.name) || ((_b = entity.data) == null ? void 0 : _b.title) || ((_c = entity.data) == null ? void 0 : _c.actorName) || "Unknown";
      const baseEntry = {
        id: `wiki_${entityType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        entityType,
        entityId: entity.id,
        title: name,
        content: this.generateWikiContent(entity, entityType),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        firstAppearance: { bookId, chapterId },
        appearances: [{ bookId, chapterId, context: entity.sourceContext }],
        relatedEntities: this.extractRelatedEntities(entity),
        tags: this.generateWikiTags(entity, entityType)
      };
      switch (entityType) {
        case "actor":
          baseEntry.sections = {
            overview: ((_d = entity.data) == null ? void 0 : _d.description) || "",
            statsHistory: [{ chapterId, stats: ((_e = entity.data) == null ? void 0 : _e.stats) || {} }],
            inventory: [],
            relationships: [],
            locationsVisited: [],
            chapterAppearances: [chapterId],
            characterArc: {
              emotionalStates: [this.inferEmotionalState(entity)],
              goals: ((_f = entity.data) == null ? void 0 : _f.goals) || [],
              conflicts: []
            }
          };
          baseEntry.class = (_g = entity.data) == null ? void 0 : _g.class;
          baseEntry.role = (_h = entity.data) == null ? void 0 : _h.role;
          break;
        case "location":
          baseEntry.sections = {
            overview: ((_i = entity.data) == null ? void 0 : _i.description) || "",
            events: [],
            visitors: this.extractActorNames(entity),
            timeline: []
          };
          baseEntry.coordinates = this.getUKCoordinates(name);
          break;
        case "item":
          baseEntry.sections = {
            overview: ((_j = entity.data) == null ? void 0 : _j.description) || "",
            stats: ((_k = entity.data) == null ? void 0 : _k.stats) || {},
            owners: [],
            acquisitionEvents: [{ chapterId, context: entity.sourceContext }]
          };
          baseEntry.itemType = (_l = entity.data) == null ? void 0 : _l.type;
          baseEntry.rarity = (_m = entity.data) == null ? void 0 : _m.rarity;
          break;
        case "skill":
          baseEntry.sections = {
            overview: ((_n = entity.data) == null ? void 0 : _n.description) || "",
            statModifiers: ((_o = entity.data) == null ? void 0 : _o.statMod) || {},
            users: [],
            tier: ((_p = entity.data) == null ? void 0 : _p.tier) || 1
          };
          break;
        case "event":
          baseEntry.sections = {
            overview: ((_q = entity.data) == null ? void 0 : _q.description) || "",
            participants: ((_r = entity.data) == null ? void 0 : _r.participants) || [],
            location: (_s = entity.data) == null ? void 0 : _s.location,
            consequences: ((_t = entity.data) == null ? void 0 : _t.consequences) || []
          };
          break;
      }
      return baseEntry;
    }
    // ==================== Helper Methods ====================
    mapEntityTypeToEventType(entityType) {
      const mapping = {
        "actor": "character_appearance",
        "stat_change": "stat_change",
        "actor-update": "character_update",
        "item": "item_event",
        "skill": "skill_event",
        "location": "travel",
        "inventory": "inventory_change",
        "relationship": "relationship_change",
        "event": "milestone"
      };
      return mapping[entityType] || "generic";
    }
    mapToMindMapNodeType(entityType) {
      const mapping = {
        "actor": "actor",
        "item": "item",
        "skill": "skill",
        "location": "location",
        "event": "event",
        "relationship": "relationship"
      };
      return mapping[entityType] || "generic";
    }
    determineNodeGroup(entity) {
      var _a, _b;
      if (entity.type === "actor") {
        const role = ((_b = (_a = entity.data) == null ? void 0 : _a.role) == null ? void 0 : _b.toLowerCase()) || "";
        if (role.includes("protagonist") || role.includes("main")) return "protagonists";
        if (role.includes("antagonist") || role.includes("villain")) return "antagonists";
        if (role.includes("npc") || role.includes("support")) return "npcs";
        return "characters";
      }
      if (entity.type === "location") return "locations";
      if (entity.type === "item") return "items";
      if (entity.type === "skill") return "skills";
      if (entity.type === "event") return "events";
      return "other";
    }
    calculateNodeSize(entity) {
      var _a, _b;
      const baseSize = 15;
      const confidenceBonus = (entity.confidence || 0.5) * 10;
      if (entity.type === "actor") {
        const role = ((_b = (_a = entity.data) == null ? void 0 : _a.role) == null ? void 0 : _b.toLowerCase()) || "";
        if (role.includes("protagonist")) return baseSize + confidenceBonus + 10;
        if (role.includes("antagonist")) return baseSize + confidenceBonus + 8;
      }
      return baseSize + confidenceBonus;
    }
    generateEventTitle(entity) {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i;
      const name = ((_a = entity.data) == null ? void 0 : _a.name) || ((_b = entity.data) == null ? void 0 : _b.title) || ((_c = entity.data) == null ? void 0 : _c.actorName) || "";
      switch (entity.type) {
        case "actor":
          return `${name} appears`;
        case "item":
          return `Item: ${name}`;
        case "skill":
          return `Skill: ${name}`;
        case "location":
          return `Location: ${name}`;
        case "stat_change":
          return `${((_d = entity.data) == null ? void 0 : _d.actorName) || "Character"} - Stat Change`;
        case "inventory":
          return `${(_e = entity.data) == null ? void 0 : _e.actorName} ${(_f = entity.data) == null ? void 0 : _f.action} ${(_g = entity.data) == null ? void 0 : _g.itemName}`;
        case "relationship":
          return `${(_h = entity.data) == null ? void 0 : _h.actor1Name} & ${(_i = entity.data) == null ? void 0 : _i.actor2Name}`;
        case "event":
          return name || "Event";
        default:
          return name || "Event";
      }
    }
    extractActorIds(entity) {
      var _a, _b, _c;
      const ids = [];
      if ((_a = entity.data) == null ? void 0 : _a.actorId) ids.push(entity.data.actorId);
      if ((_b = entity.data) == null ? void 0 : _b.actor1Id) ids.push(entity.data.actor1Id);
      if ((_c = entity.data) == null ? void 0 : _c.actor2Id) ids.push(entity.data.actor2Id);
      return ids;
    }
    extractActorNames(entity) {
      var _a, _b, _c, _d, _e;
      const names = [];
      if ((_a = entity.data) == null ? void 0 : _a.actorName) names.push(entity.data.actorName);
      if ((_b = entity.data) == null ? void 0 : _b.characterName) names.push(entity.data.characterName);
      if ((_c = entity.data) == null ? void 0 : _c.actor1Name) names.push(entity.data.actor1Name);
      if ((_d = entity.data) == null ? void 0 : _d.actor2Name) names.push(entity.data.actor2Name);
      if ((_e = entity.data) == null ? void 0 : _e.participants) names.push(...entity.data.participants);
      return [...new Set(names)];
    }
    extractItemIds(entity) {
      var _a;
      const ids = [];
      if ((_a = entity.data) == null ? void 0 : _a.itemId) ids.push(entity.data.itemId);
      if (entity.type === "item" && entity.id) ids.push(entity.id);
      return ids;
    }
    extractLocationIds(entity) {
      var _a;
      const ids = [];
      if ((_a = entity.data) == null ? void 0 : _a.locationId) ids.push(entity.data.locationId);
      if (entity.type === "location" && entity.id) ids.push(entity.id);
      return ids;
    }
    extractSkillIds(entity) {
      var _a;
      const ids = [];
      if ((_a = entity.data) == null ? void 0 : _a.skillId) ids.push(entity.data.skillId);
      if (entity.type === "skill" && entity.id) ids.push(entity.id);
      return ids;
    }
    extractRelatedEntities(entity) {
      var _a;
      const related = [];
      if ((_a = entity.data) == null ? void 0 : _a.relatedTo) related.push(...entity.data.relatedTo);
      return related;
    }
    inferEmotionalState(entity) {
      var _a;
      const context = (entity.sourceContext || "").toLowerCase();
      const desc = (((_a = entity.data) == null ? void 0 : _a.description) || "").toLowerCase();
      const combined = context + " " + desc;
      if (combined.match(/happy|joy|triumph|success|victory|celebration/)) {
        return { state: "positive", intensity: 0.7 };
      }
      if (combined.match(/angry|rage|fury|frustrated|annoyed/)) {
        return { state: "angry", intensity: 0.7 };
      }
      if (combined.match(/sad|grief|loss|mourn|despair/)) {
        return { state: "sad", intensity: 0.7 };
      }
      if (combined.match(/fear|afraid|terror|scared|worried/)) {
        return { state: "fearful", intensity: 0.7 };
      }
      if (combined.match(/confused|uncertain|puzzled|bewildered/)) {
        return { state: "confused", intensity: 0.5 };
      }
      return { state: "neutral", intensity: 0.5 };
    }
    generateWikiContent(entity, entityType) {
      var _a, _b, _c, _d;
      const name = ((_a = entity.data) == null ? void 0 : _a.name) || ((_b = entity.data) == null ? void 0 : _b.title) || "Unknown";
      const desc = ((_c = entity.data) == null ? void 0 : _c.description) || ((_d = entity.data) == null ? void 0 : _d.desc) || "";
      let content = `# ${name}

`;
      if (desc) {
        content += `${desc}

`;
      }
      if (entity.sourceContext) {
        content += `## First Mention
> "${entity.sourceContext}"

`;
      }
      return content;
    }
    generateWikiTags(entity, entityType) {
      var _a, _b, _c, _d;
      const tags = [entityType];
      if ((_a = entity.data) == null ? void 0 : _a.type) tags.push(entity.data.type.toLowerCase());
      if ((_b = entity.data) == null ? void 0 : _b.class) tags.push(entity.data.class.toLowerCase());
      if ((_c = entity.data) == null ? void 0 : _c.role) tags.push(entity.data.role.toLowerCase());
      if ((_d = entity.data) == null ? void 0 : _d.rarity) tags.push(entity.data.rarity.toLowerCase());
      return [...new Set(tags)];
    }
    // UK location coordinates (SVG-based for stylized map)
    getUKCoordinates(locationName) {
      const ukLocations = {
        "london": { svg: { x: 520, y: 380 }, real: { lat: 51.5074, lng: -0.1278 } },
        "birmingham": { svg: { x: 460, y: 320 }, real: { lat: 52.4862, lng: -1.8904 } },
        "manchester": { svg: { x: 440, y: 260 }, real: { lat: 53.4808, lng: -2.2426 } },
        "liverpool": { svg: { x: 410, y: 270 }, real: { lat: 53.4084, lng: -2.9916 } },
        "leeds": { svg: { x: 480, y: 250 }, real: { lat: 53.8008, lng: -1.5491 } },
        "sheffield": { svg: { x: 475, y: 280 }, real: { lat: 53.3811, lng: -1.4701 } },
        "bristol": { svg: { x: 400, y: 380 }, real: { lat: 51.4545, lng: -2.5879 } },
        "newcastle": { svg: { x: 480, y: 180 }, real: { lat: 54.9783, lng: -1.6178 } },
        "edinburgh": { svg: { x: 450, y: 120 }, real: { lat: 55.9533, lng: -3.1883 } },
        "glasgow": { svg: { x: 400, y: 130 }, real: { lat: 55.8642, lng: -4.2518 } },
        "cardiff": { svg: { x: 380, y: 380 }, real: { lat: 51.4816, lng: -3.1791 } },
        "belfast": { svg: { x: 320, y: 180 }, real: { lat: 54.5973, lng: -5.9301 } },
        "oxford": { svg: { x: 480, y: 360 }, real: { lat: 51.752, lng: -1.2577 } },
        "cambridge": { svg: { x: 540, y: 340 }, real: { lat: 52.2053, lng: 0.1218 } },
        "brighton": { svg: { x: 510, y: 420 }, real: { lat: 50.8225, lng: -0.1372 } },
        "plymouth": { svg: { x: 340, y: 430 }, real: { lat: 50.3755, lng: -4.1427 } },
        "cornwall": { svg: { x: 300, y: 440 }, real: { lat: 50.266, lng: -5.0527 } },
        "york": { svg: { x: 490, y: 240 }, real: { lat: 53.9591, lng: -1.0815 } },
        "nottingham": { svg: { x: 485, y: 300 }, real: { lat: 52.9548, lng: -1.1581 } },
        "southampton": { svg: { x: 470, y: 410 }, real: { lat: 50.9097, lng: -1.4044 } },
        "portsmouth": { svg: { x: 490, y: 415 }, real: { lat: 50.8198, lng: -1.088 } },
        "dover": { svg: { x: 570, y: 400 }, real: { lat: 51.1279, lng: 1.3134 } },
        "canterbury": { svg: { x: 560, y: 385 }, real: { lat: 51.2802, lng: 1.0789 } },
        "bath": { svg: { x: 410, y: 375 }, real: { lat: 51.3811, lng: -2.359 } },
        "stratford": { svg: { x: 455, y: 340 }, real: { lat: 52.1917, lng: -1.7083 } },
        "stonehenge": { svg: { x: 440, y: 390 }, real: { lat: 51.1789, lng: -1.8262 } },
        "windsor": { svg: { x: 500, y: 375 }, real: { lat: 51.4839, lng: -0.6044 } }
      };
      const normalized = locationName.toLowerCase().trim();
      if (ukLocations[normalized]) {
        return ukLocations[normalized];
      }
      for (const [key, coords] of Object.entries(ukLocations)) {
        if (normalized.includes(key) || key.includes(normalized)) {
          return coords;
        }
      }
      return {
        svg: { x: 450 + Math.random() * 100 - 50, y: 300 + Math.random() * 100 - 50 },
        real: { lat: 52.5 + Math.random() - 0.5, lng: -1.5 + Math.random() - 0.5 }
      };
    }
    async findExistingWikiEntry(entry) {
      try {
        const entries = await database_default.getAll("wikiEntries");
        return entries.find(
          (e) => e.title.toLowerCase() === entry.title.toLowerCase() && e.entityType === entry.entityType
        );
      } catch (error) {
        return null;
      }
    }
    mergeWikiEntries(existing, newEntry) {
      return {
        ...existing,
        updatedAt: Date.now(),
        appearances: [...existing.appearances || [], ...newEntry.appearances || []],
        content: existing.content + "\n\n" + (newEntry.content || ""),
        relatedEntities: [.../* @__PURE__ */ new Set([
          ...existing.relatedEntities || [],
          ...newEntry.relatedEntities || []
        ])],
        tags: [.../* @__PURE__ */ new Set([...existing.tags || [], ...newEntry.tags || []])]
      };
    }
    async applyCharacterArcUpdate(update) {
      const actors = await database_default.getAll("actors");
      const actor = actors.find(
        (a) => {
          var _a;
          return a.name.toLowerCase() === ((_a = update.actorName) == null ? void 0 : _a.toLowerCase());
        }
      );
      if (!actor) return;
      let arc;
      try {
        const arcs = await database_default.getAll("characterArcs");
        arc = arcs.find((a) => a.characterId === actor.id);
      } catch (e) {
        arc = null;
      }
      if (!arc) {
        arc = {
          characterId: actor.id,
          characterName: actor.name,
          timeline: [],
          statsHistory: [],
          emotionalStates: [],
          goals: [],
          relationships: [],
          locationsVisited: []
        };
      }
      arc.timeline.push({
        chapterId: update.chapterId,
        bookId: update.bookId,
        timestamp: update.timestamp,
        type: update.type,
        description: update.description
      });
      if (update.statChanges && Object.keys(update.statChanges).length > 0) {
        arc.statsHistory.push({
          chapterId: update.chapterId,
          timestamp: update.timestamp,
          changes: update.statChanges
        });
      }
      if (update.emotionalState) {
        arc.emotionalStates.push({
          chapterId: update.chapterId,
          timestamp: update.timestamp,
          ...update.emotionalState
        });
      }
      try {
        await database_default.update("characterArcs", arc);
      } catch (e) {
        await database_default.add("characterArcs", arc);
      }
    }
    async applyPlotThread(thread) {
      const existingThreads = await database_default.getAll("plotThreads");
      const existing = existingThreads.find((t) => t.name.toLowerCase() === thread.name.toLowerCase());
      if (existing) {
        existing.events = [...existing.events || [], ...thread.events || []];
        existing.completion = Math.min(100, (existing.completion || 0) + 5);
        await database_default.update("plotThreads", existing);
      } else {
        const newThread = {
          id: thread.id || `thread_${Date.now()}`,
          name: thread.name,
          description: thread.description || "",
          status: "active",
          completion: 10,
          events: thread.events || [],
          characters: thread.characters || [],
          createdAt: Date.now()
        };
        await database_default.add("plotThreads", newThread);
      }
    }
    async detectPlotThreads(timelineEvents, extractions) {
      const threads = [];
      const characterEvents = {};
      for (const event of timelineEvents) {
        for (const actor of event.actors || []) {
          if (!characterEvents[actor]) {
            characterEvents[actor] = [];
          }
          characterEvents[actor].push(event);
        }
      }
      for (const [character, events] of Object.entries(characterEvents)) {
        if (events.length >= 2) {
          threads.push({
            id: `thread_${character.toLowerCase().replace(/\s/g, "_")}_${Date.now()}`,
            name: `${character}'s Journey`,
            description: `Following ${character} through the story`,
            events: events.map((e) => e.id),
            characters: [character],
            approved: false,
            confidence: 0.7
          });
        }
      }
      const locationEvents = {};
      for (const event of timelineEvents) {
        for (const location of event.locations || []) {
          if (!locationEvents[location]) {
            locationEvents[location] = [];
          }
          locationEvents[location].push(event);
        }
      }
      for (const [location, events] of Object.entries(locationEvents)) {
        if (events.length >= 2) {
          threads.push({
            id: `thread_location_${location.toLowerCase().replace(/\s/g, "_")}_${Date.now()}`,
            name: `Events at ${location}`,
            description: `Key events occurring at ${location}`,
            events: events.map((e) => e.id),
            characters: [...new Set(events.flatMap((e) => e.actors || []))],
            approved: false,
            confidence: 0.5
          });
        }
      }
      return threads;
    }
  };
  var integrationService = new IntegrationService();
  var integrationService_default = integrationService;

  // src/services/dataConsistencyService.js
  init_database();
  init_contextEngine();
  var DataConsistencyService = class {
    constructor() {
      this.cache = /* @__PURE__ */ new Map();
      this.thresholds = this._loadThresholdConfig();
    }
    _loadThresholdConfig() {
      const defaults = {
        plotBeatSimilarity: 0.93,
        timelineTitleSimilarity: 0.9,
        timelineCombinedTitleSimilarity: 0.82,
        timelineDescriptionSimilarity: 0.88,
        locationSimilarity: 0.94,
        nodeSimilarity: 0.94
      };
      try {
        const raw = localStorage.getItem("consistency_thresholds");
        if (!raw) return defaults;
        const parsed = JSON.parse(raw);
        return { ...defaults, ...parsed };
      } catch (error) {
        console.warn("Invalid threshold config, falling back to defaults:", error);
        return defaults;
      }
    }
    setThresholdConfig(config = {}) {
      this.thresholds = { ...this.thresholds, ...config };
      localStorage.setItem("consistency_thresholds", JSON.stringify(this.thresholds));
    }
    /**
     * Check if a plot beat already exists (by content similarity and chapter)
     */
    async findExistingPlotBeat(beatData) {
      try {
        const allBeats = await contextEngine_default.getPlotBeats();
        const beatText = (beatData.beat || "").toLowerCase().trim();
        const targetChapter = beatData.targetChapter || beatData.chapter;
        const existing = allBeats.find((b) => {
          const existingText = (b.beat || "").toLowerCase().trim();
          const existingChapter = b.targetChapter || b.chapter;
          if (existingText === beatText && existingChapter === targetChapter) {
            return true;
          }
          if (targetChapter && existingChapter === targetChapter) {
            const similarity = this._calculateSimilarity(existingText, beatText);
            if (similarity > this.thresholds.plotBeatSimilarity) {
              return true;
            }
          }
        });
        return existing || null;
      } catch (error) {
        console.error("Error finding existing plot beat:", error);
        return null;
      }
    }
    /**
     * Add plot beat with duplicate checking
     */
    async addPlotBeatSafe(beatData) {
      const existing = await this.findExistingPlotBeat(beatData);
      if (existing) {
        const updated = {
          ...existing,
          ...beatData,
          id: existing.id,
          // Keep original ID
          updatedAt: Date.now()
        };
        await contextEngine_default.addPlotBeat(updated);
        return updated;
      }
      return await contextEngine_default.addPlotBeat(beatData);
    }
    /**
     * Check if a timeline event already exists
     */
    async findExistingTimelineEvent(eventData) {
      try {
        const allEvents = await database_default.getAll("timelineEvents");
        const eventTitle = (eventData.title || "").toLowerCase().trim();
        const eventDesc = (eventData.description || "").toLowerCase().trim();
        const chapterId = eventData.chapterId;
        const bookId = eventData.bookId;
        const existing = allEvents.find((e) => {
          const existingTitle = (e.title || "").toLowerCase().trim();
          const existingDesc = (e.description || "").toLowerCase().trim();
          const existingChapter = e.chapterId;
          const existingBook = e.bookId;
          if (existingTitle === eventTitle && existingChapter === chapterId && existingBook === bookId) {
            return true;
          }
          if (chapterId && existingChapter === chapterId && bookId && existingBook === bookId) {
            const titleSimilarity = this._calculateSimilarity(existingTitle, eventTitle);
            const descSimilarity = this._calculateSimilarity(existingDesc, eventDesc);
            if (titleSimilarity > this.thresholds.timelineTitleSimilarity || titleSimilarity > this.thresholds.timelineCombinedTitleSimilarity && descSimilarity > this.thresholds.timelineDescriptionSimilarity) {
              return true;
            }
          }
        });
        return existing || null;
      } catch (error) {
        console.error("Error finding existing timeline event:", error);
        return null;
      }
    }
    /**
     * Add timeline event with duplicate checking
     */
    async addTimelineEventSafe(eventData) {
      const existing = await this.findExistingTimelineEvent(eventData);
      if (existing) {
        const updated = {
          ...existing,
          ...eventData,
          id: existing.id,
          updatedAt: Date.now()
        };
        await database_default.update("timelineEvents", updated);
        return updated;
      }
      if (!eventData.id) {
        eventData.id = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      try {
        await database_default.add("timelineEvents", eventData);
        return eventData;
      } catch (error) {
        await database_default.update("timelineEvents", eventData);
        return eventData;
      }
    }
    /**
     * Find existing location by name
     */
    async findExistingLocation(locationName) {
      try {
        const allLocations = await database_default.getAll("locations");
        const searchName = (locationName || "").toLowerCase().trim();
        return allLocations.find((loc) => {
          const locName = (loc.name || "").toLowerCase().trim();
          return locName === searchName || this._calculateSimilarity(locName, searchName) > this.thresholds.locationSimilarity;
        }) || null;
      } catch (error) {
        console.error("Error finding existing location:", error);
        return null;
      }
    }
    /**
     * Add location with duplicate checking
     */
    async addLocationSafe(locationData) {
      const existing = await this.findExistingLocation(locationData.name);
      if (existing) {
        const updated = {
          ...existing,
          ...locationData,
          id: existing.id,
          // Keep original ID
          updatedAt: Date.now()
        };
        if (locationData.firstAppearance && existing.firstAppearance) {
          if (!existing.firstAppearance.chapterId || locationData.firstAppearance.chapterId && locationData.firstAppearance.chapterId < existing.firstAppearance.chapterId) {
            updated.firstAppearance = locationData.firstAppearance;
          }
        }
        await database_default.update("locations", updated);
        return updated;
      }
      if (!locationData.id) {
        locationData.id = `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      try {
        await database_default.add("locations", locationData);
        return locationData;
      } catch (error) {
        await database_default.update("locations", locationData);
        return locationData;
      }
    }
    /**
     * Find existing character travel record
     */
    async findExistingTravel(travelData) {
      try {
        const allTravel = await database_default.getAll("characterTravel");
        const fromId = travelData.fromLocationId;
        const toId = travelData.toLocationId;
        const actorId = travelData.actorId;
        const chapterId = travelData.chapterId;
        return allTravel.find(
          (t) => t.fromLocationId === fromId && t.toLocationId === toId && t.actorId === actorId && t.chapterId === chapterId
        ) || null;
      } catch (error) {
        console.error("Error finding existing travel:", error);
        return null;
      }
    }
    /**
     * Add character travel with duplicate checking
     */
    async addTravelSafe(travelData) {
      const existing = await this.findExistingTravel(travelData);
      if (existing) {
        return existing;
      }
      if (!travelData.id) {
        travelData.id = `travel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      try {
        await database_default.add("characterTravel", travelData);
        return travelData;
      } catch (error) {
        await database_default.update("characterTravel", travelData);
        return travelData;
      }
    }
    /**
     * Find existing mind map node
     */
    async findExistingMindMapNode(nodeData) {
      try {
        const allNodes = await database_default.getAll("mindMapNodes");
        const nodeId = nodeData.entityId || nodeData.id;
        const nodeLabel = (nodeData.label || nodeData.name || "").toLowerCase().trim();
        if (nodeId) {
          const byEntityId = allNodes.find((n) => n.entityId === nodeId || n.id === nodeId);
          if (byEntityId) return byEntityId;
        }
        if (nodeLabel) {
          const byLabel = allNodes.find((n) => {
            const existingLabel = (n.label || n.name || "").toLowerCase().trim();
            return existingLabel === nodeLabel || this._calculateSimilarity(existingLabel, nodeLabel) > this.thresholds.nodeSimilarity;
          });
          if (byLabel) return byLabel;
        }
        return null;
      } catch (error) {
        console.error("Error finding existing mind map node:", error);
        return null;
      }
    }
    /**
     * Add mind map node with duplicate checking
     */
    async addMindMapNodeSafe(nodeData) {
      const existing = await this.findExistingMindMapNode(nodeData);
      if (existing) {
        const updated = {
          ...existing,
          ...nodeData,
          id: existing.id
        };
        if (nodeData.chapterAppearances && Array.isArray(nodeData.chapterAppearances)) {
          const existingAppearances = existing.chapterAppearances || [];
          const merged = [...existingAppearances];
          nodeData.chapterAppearances.forEach((ca) => {
            if (!merged.find((ea) => ea.chapterId === ca.chapterId)) {
              merged.push(ca);
            }
          });
          updated.chapterAppearances = merged;
        }
        await database_default.update("mindMapNodes", updated);
        return updated;
      }
      if (!nodeData.id) {
        nodeData.id = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      try {
        await database_default.add("mindMapNodes", nodeData);
        return nodeData;
      } catch (error) {
        await database_default.update("mindMapNodes", nodeData);
        return nodeData;
      }
    }
    /**
     * Find existing mind map edge
     */
    async findExistingMindMapEdge(edgeData) {
      try {
        const allEdges = await database_default.getAll("mindMapEdges");
        const source = edgeData.source;
        const target = edgeData.target;
        const type = edgeData.type;
        return allEdges.find(
          (e) => e.source === source && e.target === target && e.type === type
        ) || null;
      } catch (error) {
        console.error("Error finding existing mind map edge:", error);
        return null;
      }
    }
    /**
     * Add mind map edge with duplicate checking
     */
    async addMindMapEdgeSafe(edgeData) {
      const existing = await this.findExistingMindMapEdge(edgeData);
      if (existing) {
        const updated = {
          ...existing,
          ...edgeData,
          id: existing.id
        };
        if (edgeData.chapterContext && Array.isArray(edgeData.chapterContext)) {
          const existingContext = existing.chapterContext || [];
          const merged = [...existingContext];
          edgeData.chapterContext.forEach((cc) => {
            if (!merged.find((ec) => ec.chapterId === cc.chapterId)) {
              merged.push(cc);
            }
          });
          updated.chapterContext = merged;
        }
        if (edgeData.strength && (!existing.strength || edgeData.strength > existing.strength)) {
          updated.strength = edgeData.strength;
        }
        await database_default.update("mindMapEdges", updated);
        return updated;
      }
      if (!edgeData.id) {
        edgeData.id = `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      try {
        await database_default.add("mindMapEdges", edgeData);
        return edgeData;
      } catch (error) {
        await database_default.update("mindMapEdges", edgeData);
        return edgeData;
      }
    }
    /**
     * Calculate string similarity (simple Levenshtein-based)
     */
    _calculateSimilarity(str1, str2) {
      if (!str1 || !str2) return 0;
      if (str1 === str2) return 1;
      const longer = str1.length > str2.length ? str1 : str2;
      const shorter = str1.length > str2.length ? str2 : str1;
      if (longer.length === 0) return 1;
      if (longer.includes(shorter)) return 0.8;
      const distance = this._levenshteinDistance(str1, str2);
      const maxLength = Math.max(str1.length, str2.length);
      return 1 - distance / maxLength;
    }
    /**
     * Calculate Levenshtein distance between two strings
     */
    _levenshteinDistance(str1, str2) {
      const matrix = [];
      for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
      }
      for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
      }
      for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
          if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
            matrix[i][j] = matrix[i - 1][j - 1];
          } else {
            matrix[i][j] = Math.min(
              matrix[i - 1][j - 1] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j] + 1
            );
          }
        }
      }
      return matrix[str2.length][str1.length];
    }
    /**
     * Get all data sources (for verification)
     */
    async getAllDataSources() {
      return {
        plotBeats: await contextEngine_default.getPlotBeats(),
        timelineEvents: await database_default.getAll("timelineEvents"),
        locations: await database_default.getAll("locations"),
        characterTravel: await database_default.getAll("characterTravel"),
        mindMapNodes: await database_default.getAll("mindMapNodes"),
        mindMapEdges: await database_default.getAll("mindMapEdges"),
        actors: await database_default.getAll("actors"),
        books: await database_default.getAll("books"),
        items: await database_default.getAll("itemBank"),
        skills: await database_default.getAll("skillBank")
      };
    }
    /**
     * Clear cache
     */
    clearCache() {
      this.cache.clear();
    }
  };
  var dataConsistencyService = new DataConsistencyService();
  var dataConsistencyService_default = dataConsistencyService;

  // src/services/dataInterconnectionService.js
  init_database();
  init_aiService();
  var DataInterconnectionService = class {
    constructor() {
      this.cache = /* @__PURE__ */ new Map();
    }
    /**
     * Automatically link characters to plot beats
     * @param {Array} beats - Plot beats
     * @param {Array} characters - Characters
     * @returns {Promise<Array>} Linked beats
     */
    async linkCharactersToBeats(beats, characters) {
      const linkedBeats = [];
      for (const beat of beats) {
        const beatText = (beat.beat || "").toLowerCase();
        const linkedCharacters = [];
        for (const character of characters) {
          const charName = character.name.toLowerCase();
          if (beatText.includes(charName)) {
            linkedCharacters.push(character.id);
          }
          if (character.nicknames) {
            for (const nickname of character.nicknames) {
              if (beatText.includes(nickname.toLowerCase())) {
                linkedCharacters.push(character.id);
                break;
              }
            }
          }
        }
        if (linkedCharacters.length > 0) {
          linkedBeats.push({
            ...beat,
            linkedCharacterIds: linkedCharacters,
            autoLinked: true
          });
        } else {
          linkedBeats.push(beat);
        }
      }
      return linkedBeats;
    }
    /**
     * Automatically link beats to chapters
     * @param {Array} beats - Plot beats
     * @param {Array} chapters - Chapters
     * @returns {Promise<Array>} Linked beats
     */
    async linkBeatsToChapters(beats, chapters) {
      const linkedBeats = [];
      for (const beat of beats) {
        if (beat.targetChapter || beat.chapterId) {
          linkedBeats.push(beat);
          continue;
        }
        const beatText = (beat.beat || "").toLowerCase();
        let bestMatch = null;
        let bestScore = 0;
        for (const chapter of chapters) {
          const chapterText = ((chapter.script || chapter.content || "") + " " + (chapter.title || "") + " " + (chapter.desc || "")).toLowerCase();
          const beatWords = beatText.split(/\s+/).filter((w) => w.length > 3);
          let matchScore = 0;
          for (const word of beatWords) {
            if (chapterText.includes(word)) {
              matchScore++;
            }
          }
          if (matchScore > bestScore && matchScore >= 2) {
            bestScore = matchScore;
            bestMatch = chapter;
          }
        }
        if (bestMatch) {
          linkedBeats.push({
            ...beat,
            targetChapter: bestMatch.id,
            chapterId: bestMatch.id,
            autoLinked: true,
            linkConfidence: bestScore / Math.max(beatText.split(/\s+/).length, 1)
          });
        } else {
          linkedBeats.push(beat);
        }
      }
      return linkedBeats;
    }
    /**
     * Automatically link relationships to characters
     * @param {Array} relationships - Relationships
     * @param {Array} characters - Characters
     * @returns {Promise<Array>} Linked relationships
     */
    async linkRelationshipsToCharacters(relationships, characters) {
      var _a, _b;
      const linkedRelationships = [];
      for (const rel of relationships) {
        const char1Name = (rel.character1 || rel.actor1Name || "").toLowerCase();
        const char2Name = (rel.character2 || rel.actor2Name || "").toLowerCase();
        let char1Id = null;
        let char2Id = null;
        for (const char of characters) {
          const charName = char.name.toLowerCase();
          if (charName === char1Name || ((_a = char.nicknames) == null ? void 0 : _a.some((n) => n.toLowerCase() === char1Name))) {
            char1Id = char.id;
          }
          if (charName === char2Name || ((_b = char.nicknames) == null ? void 0 : _b.some((n) => n.toLowerCase() === char2Name))) {
            char2Id = char.id;
          }
        }
        linkedRelationships.push({
          ...rel,
          actor1Id: char1Id || rel.actor1Id,
          actor2Id: char2Id || rel.actor2Id,
          autoLinked: !!(char1Id && char2Id)
        });
      }
      return linkedRelationships;
    }
    /**
     * Automatically link events to timeline
     * @param {Array} events - Events
     * @param {Array} chapters - Chapters
     * @returns {Promise<Array>} Linked events
     */
    async linkEventsToTimeline(events, chapters) {
      const linkedEvents = [];
      for (const event of events) {
        if (event.chapterId || event.bookId) {
          linkedEvents.push(event);
          continue;
        }
        const eventText = ((event.title || "") + " " + (event.description || "")).toLowerCase();
        let bestMatch = null;
        let bestScore = 0;
        for (const chapter of chapters) {
          const chapterText = ((chapter.script || chapter.content || "") + " " + (chapter.title || "")).toLowerCase();
          const eventWords = eventText.split(/\s+/).filter((w) => w.length > 3);
          let matchScore = 0;
          for (const word of eventWords) {
            if (chapterText.includes(word)) {
              matchScore++;
            }
          }
          if (matchScore > bestScore && matchScore >= 2) {
            bestScore = matchScore;
            bestMatch = chapter;
          }
        }
        if (bestMatch) {
          linkedEvents.push({
            ...event,
            chapterId: bestMatch.id,
            bookId: bestMatch.bookId,
            autoLinked: true
          });
        } else {
          linkedEvents.push(event);
        }
      }
      return linkedEvents;
    }
    /**
     * Suggest ambiguous character matches
     * @param {string} name - Character name to match
     * @param {Array} characters - Available characters
     * @returns {Promise<Object>} Suggested match with confidence
     */
    async suggestCharacterMatch(name, characters) {
      if (!name || !characters || characters.length === 0) {
        return { match: null, confidence: 0, suggestions: [] };
      }
      const nameLower = name.toLowerCase().trim();
      const suggestions = [];
      for (const char of characters) {
        const charNameLower = char.name.toLowerCase();
        let confidence = 0;
        if (charNameLower === nameLower) {
          confidence = 1;
        } else if (charNameLower.includes(nameLower) || nameLower.includes(charNameLower)) {
          confidence = 0.8;
        } else {
          const nameWords = nameLower.split(/\s+/);
          const charWords = charNameLower.split(/\s+/);
          const matchingWords = nameWords.filter(
            (w) => charWords.some((cw) => cw.includes(w) || w.includes(cw))
          );
          if (matchingWords.length >= Math.min(2, nameWords.length)) {
            confidence = 0.6;
          }
        }
        if (char.nicknames) {
          for (const nickname of char.nicknames) {
            if (nickname.toLowerCase() === nameLower) {
              confidence = Math.max(confidence, 0.9);
            } else if (nickname.toLowerCase().includes(nameLower) || nameLower.includes(nickname.toLowerCase())) {
              confidence = Math.max(confidence, 0.7);
            }
          }
        }
        if (confidence > 0.5) {
          suggestions.push({
            character: char,
            confidence,
            reason: confidence === 1 ? "Exact match" : confidence >= 0.8 ? "Contains match" : "Partial match"
          });
        }
      }
      suggestions.sort((a, b) => b.confidence - a.confidence);
      return {
        match: suggestions.length > 0 && suggestions[0].confidence >= 0.8 ? suggestions[0].character : null,
        confidence: suggestions.length > 0 ? suggestions[0].confidence : 0,
        suggestions: suggestions.slice(0, 3)
      };
    }
    /**
     * Suggest potential relationships
     * @param {string} chapterText - Chapter content
     * @param {Array} characters - Character list
     * @returns {Promise<Array>} Suggested relationships
     */
    async suggestPotentialRelationships(chapterText, characters) {
      try {
        const characterNames = characters.map((c) => c.name).join(", ");
        const systemContext = `You are a relationship suggestion expert.
Suggest relationships that might exist based on context.
Be conservative - only suggest if there's strong evidence.`;
        const prompt = `Suggest potential relationships:

Chapter text:
${chapterText.substring(0, 5e3)}

Characters: ${characterNames || "None"}

Suggest relationships that:
1. Are implied but not stated
2. Have strong contextual evidence
3. Make narrative sense

Return JSON array:
[
  {
    "character1": "Character name",
    "character2": "Character name",
    "suggestedType": "Relationship type",
    "evidence": "Evidence for this relationship",
    "confidence": 0.0-1.0,
    "suggestion": "Why this relationship makes sense"
  }
]`;
        const response = await aiService_default.callAI(prompt, "analytical", systemContext);
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const suggestions = JSON.parse(jsonMatch[0]);
          return suggestions.filter((s) => s.confidence >= 0.6).map((s, idx) => ({
            ...s,
            id: `suggested_rel_${Date.now()}_${idx}`,
            type: "suggested_relationship",
            createdAt: Date.now(),
            source: "ai_suggestion"
          }));
        }
        return [];
      } catch (error) {
        console.error("Error suggesting potential relationships:", error);
        return [];
      }
    }
    /**
     * Suggest thread connections
     * @param {Array} plotThreads - Plot threads
     * @returns {Promise<Array>} Thread connection suggestions
     */
    async suggestThreadConnections(plotThreads) {
      try {
        const systemContext = `You are a plot thread connection expert.
Suggest how plot threads might connect.
Identify: shared elements, potential connections, narrative opportunities.`;
        const prompt = `Suggest thread connections:

Plot threads:
${JSON.stringify(plotThreads, null, 2)}

Suggest:
1. How threads might connect
2. Shared elements
3. Potential connections
4. Narrative opportunities

Return JSON array:
[
  {
    "thread1": "Thread ID or name",
    "thread2": "Thread ID or name",
    "connectionType": "How they connect",
    "sharedElements": ["Element 1", "Element 2"],
    "suggestion": "Why this connection makes sense",
    "confidence": 0.0-1.0
  }
]`;
        const response = await aiService_default.callAI(prompt, "analytical", systemContext);
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const suggestions = JSON.parse(jsonMatch[0]);
          return suggestions.filter((s) => s.confidence >= 0.6).map((s, idx) => ({
            ...s,
            id: `thread_conn_${Date.now()}_${idx}`,
            type: "thread_connection",
            createdAt: Date.now(),
            source: "ai_suggestion"
          }));
        }
        return [];
      } catch (error) {
        console.error("Error suggesting thread connections:", error);
        return [];
      }
    }
    /**
     * Suggest callback pairing
     * @param {Array} callbacks - Callback opportunities
     * @param {Array} chapters - Chapter array
     * @returns {Promise<Array>} Callback pairing suggestions
     */
    async suggestCallbackPairing(callbacks, chapters) {
      try {
        const systemContext = `You are a callback pairing expert.
Suggest callback setup/payoff pairs.
Match: setups with potential payoffs, payoff opportunities.`;
        const prompt = `Suggest callback pairings:

Callbacks:
${JSON.stringify(callbacks, null, 2)}

Chapters:
${chapters.map((ch, idx) => `${idx + 1}. ${ch.title || "Untitled"}`).join("\n")}

Suggest:
1. Setup/payoff pairs
2. Which callbacks should reference which
3. Pairing opportunities

Return JSON array:
[
  {
    "setup": "Setup callback",
    "payoff": "Payoff callback",
    "setupChapter": "Chapter number",
    "payoffChapter": "Suggested chapter number",
    "suggestion": "Why this pairing works",
    "confidence": 0.0-1.0
  }
]`;
        const response = await aiService_default.callAI(prompt, "analytical", systemContext);
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const pairings = JSON.parse(jsonMatch[0]);
          return pairings.filter((p) => p.confidence >= 0.6).map((p, idx) => ({
            ...p,
            id: `callback_pair_${Date.now()}_${idx}`,
            type: "callback_pairing",
            createdAt: Date.now(),
            source: "ai_suggestion"
          }));
        }
        return [];
      } catch (error) {
        console.error("Error suggesting callback pairing:", error);
        return [];
      }
    }
    /**
     * Interconnect all data
     * @param {Object} extractionData - Extracted data
     * @returns {Promise<Object>} Interconnected data
     */
    async interconnectAllData(extractionData) {
      try {
        const {
          beats = [],
          storylines = [],
          timelineEvents = [],
          relationships = [],
          callbacks = [],
          chapters = [],
          characters = []
        } = extractionData;
        const [
          linkedBeats,
          beatsLinkedToChapters,
          linkedRelationships,
          linkedEvents
        ] = await Promise.all([
          this.linkCharactersToBeats(beats, characters),
          this.linkBeatsToChapters(beats, chapters),
          this.linkRelationshipsToCharacters(relationships, characters),
          this.linkEventsToTimeline(timelineEvents, chapters)
        ]);
        const [
          suggestedRelationships,
          threadConnections,
          callbackPairings
        ] = await Promise.all([
          chapters.length > 0 ? this.suggestPotentialRelationships(
            chapters[0].script || chapters[0].content || "",
            characters
          ) : Promise.resolve([]),
          this.suggestThreadConnections(storylines),
          this.suggestCallbackPairing(callbacks, chapters)
        ]);
        return {
          automatic: {
            beats: beatsLinkedToChapters,
            relationships: linkedRelationships,
            events: linkedEvents
          },
          suggested: {
            relationships: suggestedRelationships,
            threadConnections,
            callbackPairings
          },
          all: [
            ...beatsLinkedToChapters.filter((b) => b.autoLinked),
            ...linkedRelationships.filter((r) => r.autoLinked),
            ...linkedEvents.filter((e) => e.autoLinked),
            ...suggestedRelationships,
            ...threadConnections,
            ...callbackPairings
          ]
        };
      } catch (error) {
        console.error("Error interconnecting data:", error);
        return {
          automatic: { beats: [], relationships: [], events: [] },
          suggested: { relationships: [], threadConnections: [], callbackPairings: [] },
          all: []
        };
      }
    }
  };
  var dataInterconnectionService = new DataInterconnectionService();
  var dataInterconnectionService_default = dataInterconnectionService;

  // src/services/dataMigrationService.js
  init_database();
  var DataMigrationService = class {
    /**
     * Migrate existing actor data to snapshot structure
     * @param {Object} options - Migration options
     * @returns {Promise<Object>} Migration results
     */
    async migrateExistingDataToSnapshots(options = {}) {
      var _a, _b;
      const {
        dryRun = false,
        createSnapshotsForAllChapters = false,
        onProgress = null
      } = options;
      const results = {
        actorsProcessed: 0,
        snapshotsCreated: 0,
        relationshipsMigrated: 0,
        errors: [],
        warnings: []
      };
      try {
        const actors = await database_default.getAll("actors");
        if (actors.length === 0) {
          results.warnings.push("No actors found to migrate");
          return results;
        }
        const books = await database_default.getAll("books");
        const allChapters = [];
        books.forEach((book) => {
          if (book.chapters && Array.isArray(book.chapters)) {
            book.chapters.forEach((chapter) => {
              allChapters.push({
                bookId: book.id,
                chapterId: chapter.id,
                chapter
              });
            });
          }
        });
        if (allChapters.length === 0 && !createSnapshotsForAllChapters) {
          results.warnings.push("No chapters found. Set createSnapshotsForAllChapters=true to create snapshots from current actor state.");
          return results;
        }
        for (let i = 0; i < actors.length; i++) {
          const actor = actors[i];
          results.actorsProcessed++;
          if (onProgress) {
            onProgress({
              current: i + 1,
              total: actors.length,
              actorName: actor.name,
              message: `Processing ${actor.name}...`
            });
          }
          try {
            if (actor.snapshots && Object.keys(actor.snapshots).length > 0) {
              const hasNewStructure = Object.values(actor.snapshots).some(
                (snapshot) => snapshot.relationships !== void 0 || snapshot.chapterAnalyzed !== void 0
              );
              if (hasNewStructure) {
                results.warnings.push(`${actor.name}: Already has new snapshot structure, skipping`);
                continue;
              }
            }
            const relationships = await database_default.getAll("relationships");
            const actorRelationships = relationships.filter(
              (rel) => rel.actor1Id === actor.id || rel.actor2Id === actor.id
            );
            if (actorRelationships.length > 0) {
              const relationshipsByChapter = {};
              actorRelationships.forEach((rel) => {
                const key = `${rel.bookId}_${rel.chapterId}`;
                if (!relationshipsByChapter[key]) {
                  relationshipsByChapter[key] = [];
                }
                relationshipsByChapter[key].push(rel);
              });
              for (const [snapKey, rels] of Object.entries(relationshipsByChapter)) {
                const [bookId, chapterId] = snapKey.split("_").map(Number);
                if (!dryRun) {
                  let snapshot = (_a = actor.snapshots) == null ? void 0 : _a[snapKey];
                  if (!snapshot) {
                    snapshot = {
                      baseStats: { ...actor.baseStats || {} },
                      additionalStats: { ...actor.additionalStats || {} },
                      activeSkills: [...actor.activeSkills || []],
                      inventory: [...actor.inventory || []],
                      equipment: actor.equipment ? JSON.parse(JSON.stringify(actor.equipment)) : {},
                      relationships: {},
                      snapshotTimestamp: Date.now(),
                      bookId,
                      chapterId,
                      chapterAnalyzed: false
                      // Mark as not analyzed (needs re-analysis)
                    };
                  }
                  if (!snapshot.relationships) {
                    snapshot.relationships = {};
                  }
                  rels.forEach((rel) => {
                    const otherActorId = rel.actor1Id === actor.id ? rel.actor2Id : rel.actor1Id;
                    snapshot.relationships[otherActorId] = {
                      strength: rel.strength || 0,
                      type: rel.relationshipType || "neutral",
                      notes: rel.summary || rel.description || "",
                      direction: rel.actor1Id === actor.id ? "outgoing" : "incoming",
                      updatedAt: rel.updatedAt || rel.createdAt || Date.now()
                    };
                  });
                  if (!actor.snapshots) {
                    actor.snapshots = {};
                  }
                  actor.snapshots[snapKey] = snapshot;
                  results.snapshotsCreated++;
                  results.relationshipsMigrated += rels.length;
                } else {
                  results.snapshotsCreated++;
                  results.relationshipsMigrated += rels.length;
                }
              }
            }
            if (createSnapshotsForAllChapters) {
              for (const { bookId, chapterId } of allChapters) {
                const snapKey = `${bookId}_${chapterId}`;
                if ((_b = actor.snapshots) == null ? void 0 : _b[snapKey]) continue;
                if (!dryRun) {
                  const snapshot = {
                    baseStats: { ...actor.baseStats || {} },
                    additionalStats: { ...actor.additionalStats || {} },
                    activeSkills: [...actor.activeSkills || []],
                    inventory: [...actor.inventory || []],
                    equipment: actor.equipment ? JSON.parse(JSON.stringify(actor.equipment)) : {},
                    relationships: {},
                    snapshotTimestamp: Date.now(),
                    bookId,
                    chapterId,
                    chapterAnalyzed: false
                    // Mark as not analyzed
                  };
                  if (!actor.snapshots) {
                    actor.snapshots = {};
                  }
                  actor.snapshots[snapKey] = snapshot;
                  results.snapshotsCreated++;
                } else {
                  results.snapshotsCreated++;
                }
              }
            }
            if (!dryRun) {
              await database_default.update("actors", actor);
            }
          } catch (error) {
            results.errors.push({
              actorId: actor.id,
              actorName: actor.name,
              error: error.message
            });
            console.error(`Error migrating actor ${actor.name}:`, error);
          }
        }
        return results;
      } catch (error) {
        console.error("Migration error:", error);
        results.errors.push({
          type: "general",
          error: error.message
        });
        return results;
      }
    }
    /**
     * Rollback migration (remove snapshots created by migration)
     * WARNING: This will remove all snapshots, not just migrated ones
     */
    async rollbackMigration() {
      const results = {
        actorsProcessed: 0,
        snapshotsRemoved: 0,
        errors: []
      };
      try {
        const actors = await database_default.getAll("actors");
        for (const actor of actors) {
          if (actor.snapshots && Object.keys(actor.snapshots).length > 0) {
            actor.snapshots = {};
            await database_default.update("actors", actor);
            results.actorsProcessed++;
          }
        }
        return results;
      } catch (error) {
        console.error("Rollback error:", error);
        results.errors.push({
          error: error.message
        });
        return results;
      }
    }
    /**
     * Get migration status report
     */
    async getMigrationStatus() {
      const actors = await database_default.getAll("actors");
      const books = await database_default.getAll("books");
      const status = {
        totalActors: actors.length,
        actorsWithSnapshots: 0,
        actorsWithNewStructure: 0,
        totalSnapshots: 0,
        chaptersWithSnapshots: 0,
        totalChapters: 0
      };
      books.forEach((book) => {
        if (book.chapters && Array.isArray(book.chapters)) {
          status.totalChapters += book.chapters.length;
        }
      });
      actors.forEach((actor) => {
        if (actor.snapshots && Object.keys(actor.snapshots).length > 0) {
          status.actorsWithSnapshots++;
          status.totalSnapshots += Object.keys(actor.snapshots).length;
          const hasNewStructure = Object.values(actor.snapshots).some(
            (snapshot) => snapshot.relationships !== void 0 || snapshot.chapterAnalyzed !== void 0
          );
          if (hasNewStructure) {
            status.actorsWithNewStructure++;
          }
        }
      });
      const chaptersWithSnapshots = /* @__PURE__ */ new Set();
      actors.forEach((actor) => {
        if (actor.snapshots) {
          Object.keys(actor.snapshots).forEach((snapKey) => {
            chaptersWithSnapshots.add(snapKey);
          });
        }
      });
      status.chaptersWithSnapshots = chaptersWithSnapshots.size;
      return status;
    }
  };
  var dataMigrationService = new DataMigrationService();
  var dataMigrationService_default = dataMigrationService;

  // src/entry.js
  init_contextEngine();
  init_storyContextService();
  init_manuscriptContextEngine();
  init_aiSuggestionService();

  // src/services/suggestionFeedbackService.js
  init_database();
  var SuggestionFeedbackService = class {
    constructor() {
      this.feedbackCache = /* @__PURE__ */ new Map();
    }
    /**
     * Record suggestion acceptance
     * @param {string} suggestionId - Suggestion ID
     * @param {string} action - Action taken (accept, dismiss, modify, save)
     * @param {Object} details - Additional details
     * @returns {Promise<Object>} Feedback record
     */
    async recordAcceptance(suggestionId, action, details = {}) {
      try {
        const feedback = {
          id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          suggestionId,
          action,
          // 'accept' | 'dismiss' | 'modify' | 'save'
          rating: details.rating || null,
          comment: details.comment || "",
          timestamp: Date.now(),
          suggestionType: details.suggestionType || null,
          priority: details.priority || null
        };
        try {
          await database_default.add("suggestionFeedback", feedback);
        } catch (e) {
          await database_default.add("suggestionFeedback", feedback);
        }
        return feedback;
      } catch (error) {
        console.error("Error recording suggestion acceptance:", error);
        throw error;
      }
    }
    /**
     * Rate a suggestion
     * @param {string} suggestionId - Suggestion ID
     * @param {number} rating - Rating 1-5
     * @param {string} comment - Optional comment
     * @returns {Promise<Object>} Feedback record
     */
    async rateSuggestion(suggestionId, rating, comment = "") {
      try {
        const feedback = {
          id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          suggestionId,
          action: "rated",
          rating: Math.max(1, Math.min(5, rating)),
          comment,
          timestamp: Date.now()
        };
        try {
          await database_default.add("suggestionFeedback", feedback);
        } catch (e) {
          await database_default.add("suggestionFeedback", feedback);
        }
        return feedback;
      } catch (error) {
        console.error("Error rating suggestion:", error);
        throw error;
      }
    }
    /**
     * Get feedback for a suggestion
     * @param {string} suggestionId - Suggestion ID
     * @returns {Promise<Array>} Feedback records
     */
    async getFeedbackForSuggestion(suggestionId) {
      try {
        let feedback = [];
        try {
          feedback = await database_default.getAll("suggestionFeedback") || [];
        } catch (e) {
          return [];
        }
        return feedback.filter((f) => f.suggestionId === suggestionId);
      } catch (error) {
        console.error("Error getting feedback for suggestion:", error);
        return [];
      }
    }
    /**
     * Analyze feedback patterns
     * @param {Object} filters - Filter options
     * @returns {Promise<Object>} Feedback analysis
     */
    async analyzeFeedbackPatterns(filters = {}) {
      try {
        let feedback = [];
        try {
          feedback = await database_default.getAll("suggestionFeedback") || [];
        } catch (e) {
          return {
            acceptanceRate: 0,
            averageRating: 0,
            byType: {},
            byPriority: {},
            patterns: []
          };
        }
        if (filters.suggestionType) {
          feedback = feedback.filter((f) => f.suggestionType === filters.suggestionType);
        }
        if (filters.dateRange) {
          const start = filters.dateRange.start || 0;
          const end = filters.dateRange.end || Date.now();
          feedback = feedback.filter((f) => f.timestamp >= start && f.timestamp <= end);
        }
        const accepted = feedback.filter((f) => f.action === "accept").length;
        const dismissed = feedback.filter((f) => f.action === "dismiss").length;
        const rated = feedback.filter((f) => f.rating !== null);
        const acceptanceRate = feedback.length > 0 ? accepted / feedback.length : 0;
        const averageRating = rated.length > 0 ? rated.reduce((sum, f) => sum + (f.rating || 0), 0) / rated.length : 0;
        const byType = {};
        feedback.forEach((f) => {
          const type = f.suggestionType || "unknown";
          if (!byType[type]) {
            byType[type] = { accepted: 0, dismissed: 0, total: 0, averageRating: 0 };
          }
          byType[type].total++;
          if (f.action === "accept") byType[type].accepted++;
          if (f.action === "dismiss") byType[type].dismissed++;
          if (f.rating) {
            byType[type].averageRating = (byType[type].averageRating * (byType[type].total - 1) + f.rating) / byType[type].total;
          }
        });
        const byPriority = {};
        feedback.forEach((f) => {
          const priority = f.priority || "unknown";
          if (!byPriority[priority]) {
            byPriority[priority] = { accepted: 0, dismissed: 0, total: 0 };
          }
          byPriority[priority].total++;
          if (f.action === "accept") byPriority[priority].accepted++;
          if (f.action === "dismiss") byPriority[priority].dismissed++;
        });
        const patterns = [];
        Object.entries(byType).forEach(([type, data]) => {
          if (data.total >= 5 && data.accepted / data.total > 0.7) {
            patterns.push({
              type: "high_acceptance",
              category: type,
              message: `${type} suggestions have ${Math.round(data.accepted / data.total * 100)}% acceptance rate`
            });
          }
        });
        Object.entries(byType).forEach(([type, data]) => {
          if (data.total >= 5 && data.accepted / data.total < 0.3) {
            patterns.push({
              type: "low_acceptance",
              category: type,
              message: `${type} suggestions have ${Math.round(data.accepted / data.total * 100)}% acceptance rate - may need improvement`
            });
          }
        });
        return {
          acceptanceRate,
          averageRating,
          byType,
          byPriority,
          patterns,
          totalFeedback: feedback.length
        };
      } catch (error) {
        console.error("Error analyzing feedback patterns:", error);
        return {
          acceptanceRate: 0,
          averageRating: 0,
          byType: {},
          byPriority: {},
          patterns: []
        };
      }
    }
    /**
     * Get feedback statistics
     * @returns {Promise<Object>} Feedback statistics
     */
    async getFeedbackStats() {
      try {
        let feedback = [];
        try {
          feedback = await database_default.getAll("suggestionFeedback") || [];
        } catch (e) {
          return {
            total: 0,
            accepted: 0,
            dismissed: 0,
            rated: 0,
            averageRating: 0
          };
        }
        return {
          total: feedback.length,
          accepted: feedback.filter((f) => f.action === "accept").length,
          dismissed: feedback.filter((f) => f.action === "dismiss").length,
          rated: feedback.filter((f) => f.rating !== null).length,
          averageRating: feedback.filter((f) => f.rating).length > 0 ? feedback.filter((f) => f.rating).reduce((sum, f) => sum + f.rating, 0) / feedback.filter((f) => f.rating).length : 0
        };
      } catch (error) {
        console.error("Error getting feedback stats:", error);
        return {
          total: 0,
          accepted: 0,
          dismissed: 0,
          rated: 0,
          averageRating: 0
        };
      }
    }
  };
  var suggestionFeedbackService = new SuggestionFeedbackService();
  var suggestionFeedbackService_default = suggestionFeedbackService;

  // src/services/suggestionLearningService.js
  init_database();
  var SuggestionLearningService = class {
    constructor() {
      this.preferences = /* @__PURE__ */ new Map();
      this.learnedPatterns = /* @__PURE__ */ new Map();
    }
    /**
     * Learn from feedback patterns
     * @returns {Promise<Object>} Learned preferences
     */
    async learnFromFeedback() {
      try {
        const analysis = await suggestionFeedbackService_default.analyzeFeedbackPatterns();
        const preferences = {
          preferredTypes: [],
          avoidedTypes: [],
          preferredPriorities: [],
          ratingThreshold: 3.5
        };
        Object.entries(analysis.byType).forEach(([type, data]) => {
          if (data.total >= 3) {
            const acceptanceRate = data.accepted / data.total;
            if (acceptanceRate > 0.7 && data.averageRating > 3.5) {
              preferences.preferredTypes.push({
                type,
                acceptanceRate,
                averageRating: data.averageRating
              });
            } else if (acceptanceRate < 0.3) {
              preferences.avoidedTypes.push({
                type,
                acceptanceRate,
                averageRating: data.averageRating
              });
            }
          }
        });
        Object.entries(analysis.byPriority).forEach(([priority, data]) => {
          if (data.total >= 3) {
            const acceptanceRate = data.accepted / data.total;
            if (acceptanceRate > 0.7) {
              preferences.preferredPriorities.push({
                priority,
                acceptanceRate
              });
            }
          }
        });
        this.preferences.set("user", preferences);
        this.learnedPatterns.set("feedback", analysis.patterns);
        return preferences;
      } catch (error) {
        console.error("Error learning from feedback:", error);
        return {
          preferredTypes: [],
          avoidedTypes: [],
          preferredPriorities: [],
          ratingThreshold: 3.5
        };
      }
    }
    /**
     * Recognize patterns in accepted suggestions
     * @returns {Promise<Array>} Recognized patterns
     */
    async recognizePatterns() {
      try {
        let feedback = [];
        try {
          feedback = await database_default.getAll("suggestionFeedback") || [];
        } catch (e) {
          return [];
        }
        const accepted = feedback.filter((f) => f.action === "accept");
        const patterns = [];
        const typeRatings = {};
        accepted.forEach((f) => {
          if (f.suggestionType && f.rating) {
            if (!typeRatings[f.suggestionType]) {
              typeRatings[f.suggestionType] = [];
            }
            typeRatings[f.suggestionType].push(f.rating);
          }
        });
        Object.entries(typeRatings).forEach(([type, ratings]) => {
          if (ratings.length >= 3) {
            const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
            if (avgRating >= 4) {
              patterns.push({
                type: "high_rated_type",
                category: type,
                averageRating: avgRating,
                message: `${type} suggestions average ${avgRating.toFixed(1)}/5 rating`
              });
            }
          }
        });
        const priorityAcceptance = {};
        accepted.forEach((f) => {
          if (f.priority) {
            if (!priorityAcceptance[f.priority]) {
              priorityAcceptance[f.priority] = { accepted: 0, total: 0 };
            }
            priorityAcceptance[f.priority].accepted++;
          }
        });
        const allFeedback = await database_default.getAll("suggestionFeedback") || [];
        allFeedback.forEach((f) => {
          if (f.priority) {
            if (!priorityAcceptance[f.priority]) {
              priorityAcceptance[f.priority] = { accepted: 0, total: 0 };
            }
            priorityAcceptance[f.priority].total++;
          }
        });
        Object.entries(priorityAcceptance).forEach(([priority, data]) => {
          if (data.total >= 5) {
            const rate = data.accepted / data.total;
            if (rate > 0.8) {
              patterns.push({
                type: "preferred_priority",
                category: priority,
                acceptanceRate: rate,
                message: `${priority} priority suggestions have ${Math.round(rate * 100)}% acceptance`
              });
            }
          }
        });
        return patterns;
      } catch (error) {
        console.error("Error recognizing patterns:", error);
        return [];
      }
    }
    /**
     * Adjust AI confidence based on feedback
     * @param {string} suggestionType - Suggestion type
     * @param {string} priority - Suggestion priority
     * @param {number} baseConfidence - Base confidence score
     * @returns {Promise<number>} Adjusted confidence
     */
    async adjustConfidence(suggestionType, priority, baseConfidence) {
      try {
        const preferences = await this.learnFromFeedback();
        let adjustedConfidence = baseConfidence;
        const preferredType = preferences.preferredTypes.find((pt) => pt.type === suggestionType);
        if (preferredType) {
          adjustedConfidence += 0.1;
        }
        const avoidedType = preferences.avoidedTypes.find((at) => at.type === suggestionType);
        if (avoidedType) {
          adjustedConfidence -= 0.1;
        }
        const preferredPriority = preferences.preferredPriorities.find((pp) => pp.priority === priority);
        if (preferredPriority) {
          adjustedConfidence += 0.05;
        }
        return Math.max(0, Math.min(1, adjustedConfidence));
      } catch (error) {
        console.error("Error adjusting confidence:", error);
        return baseConfidence;
      }
    }
    /**
     * Personalize suggestions to user style
     * @param {Array} suggestions - Suggestions to personalize
     * @returns {Promise<Array>} Personalized suggestions
     */
    async personalizeSuggestions(suggestions) {
      try {
        const preferences = await this.learnFromFeedback();
        const patterns = await this.recognizePatterns();
        return suggestions.map((suggestion) => {
          const personalized = { ...suggestion };
          const preferredType = preferences.preferredTypes.find((pt) => pt.type === suggestion.type);
          if (preferredType) {
            if (personalized.priority === "medium") {
              personalized.priority = "high";
            } else if (personalized.priority === "low") {
              personalized.priority = "medium";
            }
          }
          if (personalized.confidence !== void 0) {
            personalized.confidence = this.adjustConfidence(
              suggestion.type,
              suggestion.priority || "medium",
              personalized.confidence
            );
          }
          if (preferredType) {
            personalized.personalized = true;
            personalized.personalizationNote = `Based on your preferences, this ${suggestion.type} suggestion is likely to be useful`;
          }
          return personalized;
        });
      } catch (error) {
        console.error("Error personalizing suggestions:", error);
        return suggestions;
      }
    }
    /**
     * Get user preferences
     * @returns {Promise<Object>} User preferences
     */
    async getUserPreferences() {
      try {
        await this.learnFromFeedback();
        return this.preferences.get("user") || {
          preferredTypes: [],
          avoidedTypes: [],
          preferredPriorities: [],
          ratingThreshold: 3.5
        };
      } catch (error) {
        console.error("Error getting user preferences:", error);
        return {
          preferredTypes: [],
          avoidedTypes: [],
          preferredPriorities: [],
          ratingThreshold: 3.5
        };
      }
    }
    /**
     * Get learned patterns
     * @returns {Promise<Array>} Learned patterns
     */
    async getLearnedPatterns() {
      try {
        const patterns = await this.recognizePatterns();
        const feedbackPatterns = this.learnedPatterns.get("feedback") || [];
        return [...patterns, ...feedbackPatterns];
      } catch (error) {
        console.error("Error getting learned patterns:", error);
        return [];
      }
    }
  };
  var suggestionLearningService = new SuggestionLearningService();
  var suggestionLearningService_default = suggestionLearningService;

  // src/entry.js
  init_promptTemplates();

  // services/toastService.js
  var ToastService = class {
    constructor() {
      this.listeners = [];
      this.toasts = [];
      this.nextId = 0;
    }
    /**
     * Subscribe to toast updates
     */
    subscribe(listener) {
      this.listeners.push(listener);
      return () => {
        this.listeners = this.listeners.filter((l) => l !== listener);
      };
    }
    /**
     * Notify all listeners
     */
    notify() {
      this.listeners.forEach((listener) => listener([...this.toasts]));
    }
    /**
     * Show a toast
     */
    show(message, type = "info", duration = 3e3) {
      const id = this.nextId++;
      const toast = { id, message, type, duration };
      this.toasts.push(toast);
      this.notify();
      return id;
    }
    /**
     * Remove a toast
     */
    remove(id) {
      this.toasts = this.toasts.filter((t) => t.id !== id);
      this.notify();
    }
    /**
     * Clear all toasts
     */
    clear() {
      this.toasts = [];
      this.notify();
    }
    // Convenience methods
    success(message, duration) {
      return this.show(message, "success", duration);
    }
    error(message, duration) {
      return this.show(message, "error", duration || 5e3);
    }
    warning(message, duration) {
      return this.show(message, "warning", duration);
    }
    info(message, duration) {
      return this.show(message, "info", duration);
    }
  };
  var toastService = new ToastService();
  var toastService_default = toastService;

  // src/entry.js
  var CW = {
    // core
    db: database_default,
    aiService: aiService_default,
    toastService: toastService_default,
    promptTemplates: promptTemplates_default,
    formatForClipboard,
    parseExternalAIResponse,
    // extraction / intelligence
    manuscriptIntelligenceService: manuscriptIntelligenceService_default,
    manuscriptProcessingService: manuscriptProcessingService_default,
    chapterDataExtractionService: chapterDataExtractionService_default,
    chapterContextService: chapterContextService_default,
    chapterOverviewService: chapterOverviewService_default,
    chapterNavigationService: chapterNavigationService_default,
    chapterMemoryService: chapterMemoryService_default,
    canonExtractionPipeline: canonExtractionPipeline_default,
    canonLifecycleService: canonLifecycleService_default,
    intelligenceRouter: intelligenceRouter_default,
    // entity
    entityMatchingService: entityMatchingService_default,
    entityInterjectionService: entityInterjectionService_default,
    // plot / arc / world
    plotThreadingService: plotThreadingService_default,
    narrativeArcService: narrativeArcService_default,
    narrativeReviewQueueService: narrativeReviewQueueService_default,
    worldConsistencyService: worldConsistencyService_default,
    characterEnhancementService: characterEnhancementService_default,
    characterTimelineService: characterTimelineService_default,
    relationshipAnalysisService: relationshipAnalysisService_default,
    personnelAnalysisService: personnelAnalysisService_default,
    dialogueAnalysisService: dialogueAnalysisService_default,
    emotionalBeatService: emotionalBeatService_default,
    // style / voice
    styleReferenceService: styleReferenceService_default,
    styleGuideService: styleGuideService_default,
    styleConnectionService: styleConnectionService_default,
    // writing enhancements (named exports)
    writingEnhancementServices: writingEnhancementServices_exports,
    // integration
    integrationService: integrationService_default,
    // data
    dataConsistencyService: dataConsistencyService_default,
    dataInterconnectionService: dataInterconnectionService_default,
    dataMigrationService: dataMigrationService_default,
    contextEngine: contextEngine_default,
    smartContextEngine: smartContextEngine_default,
    storyBrain: storyBrain_default,
    storyContextService: storyContextService_default,
    manuscriptContextEngine: manuscriptContextEngine_default,
    // suggestions + learning
    aiSuggestionService: aiSuggestionService_default,
    suggestionFeedbackService: suggestionFeedbackService_default,
    suggestionLearningService: suggestionLearningService_default,
    confidencePolicyService: confidencePolicyService_default,
    // static data
    writingCraftGuide: writingCraftGuide_default,
    getExpertWriterContent,
    getGenreGuide
  };
  if (typeof window !== "undefined") {
    window.CW = CW;
    try {
      database_default.init().catch((e) => console.warn("[CW] DB init deferred:", (e == null ? void 0 : e.message) || e));
    } catch (e) {
      console.warn("[CW] DB init threw synchronously:", e);
    }
  }
  var entry_default = CW;
  return __toCommonJS(entry_exports);
})();
