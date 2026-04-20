import React, { useState, useMemo } from 'react';
import { Package, ArrowRight, Plus, Minus, TrendingUp } from 'lucide-react';

/**
 * InventoryHistoryTimeline - Timeline of equipment changes
 */
const InventoryHistoryTimeline = ({ actor, books, items }) => {
  const [selectedBook, setSelectedBook] = useState('all');
  const [selectedSlot, setSelectedSlot] = useState('all');

  // Extract inventory history from snapshots
  const inventoryHistory = useMemo(() => {
    if (!actor || !books || !items) return [];

    const history = [];
    const equipmentSlots = ['helm', 'cape', 'amulet', 'armour', 'gloves', 'belt', 'boots', 'leftHand', 'rightHand', 'rings', 'charms'];

    // Process all books and chapters
    const booksArray = Array.isArray(books) ? books : Object.values(books || {});
    if (!booksArray || booksArray.length === 0) {
      return [];
    }
    
    booksArray.forEach(book => {
      if (!book || !book.chapters) return;
      
      book.chapters.forEach(chapter => {
        const snapshotKey = `${book.id}_${chapter.id}`;
        const snapshot = actor.snapshots?.[snapshotKey];

        if (snapshot && snapshot.equipment) {
          const currentEquipment = snapshot.equipment;
          const previousEquipment = history.length > 0
            ? history[history.length - 1]?.equipment
            : actor.equipment || {};

          // Check each slot for changes
          equipmentSlots.forEach(slot => {
            const currentItemId = Array.isArray(currentEquipment[slot])
              ? currentEquipment[slot].filter(Boolean)[0]
              : currentEquipment[slot];
            const previousItemId = Array.isArray(previousEquipment[slot])
              ? previousEquipment[slot].filter(Boolean)[0]
              : previousEquipment[slot];

            if (currentItemId !== previousItemId) {
              const currentItem = items.find(i => i.id === currentItemId);
              const previousItem = items.find(i => i.id === previousItemId);

              if (currentItemId || previousItemId) {
                history.push({
                  bookId: book.id,
                  chapterId: chapter.id,
                  chapterTitle: chapter.title,
                  timestamp: `${book.id}_${chapter.id}`,
                  slot,
                  action: currentItemId ? (previousItemId ? 'replaced' : 'equipped') : 'unequipped',
                  previousItemId,
                  previousItemName: previousItem?.name || null,
                  currentItemId,
                  currentItemName: currentItem?.name || null,
                  bookTitle: `Book ${book.id}`
                });
              }
            }
          });

          // Check inventory changes
          const currentInventory = snapshot.inventory || [];
          const previousInventory = history.length > 0
            ? history[history.length - 1]?.inventory
            : actor.inventory || [];

          const addedItems = currentInventory.filter(id => !previousInventory.includes(id));
          const removedItems = previousInventory.filter(id => !currentInventory.includes(id));

          if (addedItems.length > 0 || removedItems.length > 0) {
            history.push({
              bookId: book.id,
              chapterId: chapter.id,
              chapterTitle: chapter.title,
              timestamp: `${book.id}_${chapter.id}`,
              slot: 'inventory',
              action: addedItems.length > 0 ? 'acquired' : 'removed',
              addedItems: addedItems.map(id => {
                const item = items.find(i => i.id === id);
                return { id, name: item?.name || 'Unknown Item' };
              }),
              removedItems: removedItems.map(id => {
                const item = items.find(i => i.id === id);
                return { id, name: item?.name || 'Unknown Item' };
              }),
              bookTitle: `Book ${book.id}`
            });
          }

          // Store current state for next iteration
          if (history.length > 0) {
            history[history.length - 1].equipment = { ...currentEquipment };
            history[history.length - 1].inventory = [...currentInventory];
          }
        }
      });
    });

    // Sort by timestamp
    return history.sort((a, b) => {
      const [bookA, chA] = a.timestamp.split('_').map(Number);
      const [bookB, chB] = b.timestamp.split('_').map(Number);
      if (bookA !== bookB) return bookA - bookB;
      return chA - chB;
    });
  }, [actor, books, items]);

  // Filter history
  const filteredHistory = useMemo(() => {
    let filtered = inventoryHistory;

    if (selectedSlot !== 'all') {
      filtered = filtered.filter(h => h.slot === selectedSlot);
    }

    if (selectedBook !== 'all') {
      filtered = filtered.filter(h => h.bookId.toString() === selectedBook);
    }

    return filtered;
  }, [inventoryHistory, selectedSlot, selectedBook]);

  // Get unique slots and books
  const availableSlots = useMemo(() => {
    const slots = [...new Set(inventoryHistory.map(h => h.slot))];
    return slots.map(slot => ({
      key: slot,
      label: slot === 'inventory' ? 'Inventory' : slot.charAt(0).toUpperCase() + slot.slice(1)
    }));
  }, [inventoryHistory]);

  const availableBooks = useMemo(() => {
    const bookIds = [...new Set(inventoryHistory.map(h => h.bookId))];
    return bookIds.map(id => ({ id: id.toString(), label: `Book ${id}` }));
  }, [inventoryHistory]);

  const getActionColor = (action) => {
    switch (action) {
      case 'equipped':
      case 'acquired':
        return 'text-green-400 bg-green-900/30 border-green-700';
      case 'unequipped':
      case 'removed':
        return 'text-red-400 bg-red-900/30 border-red-700';
      case 'replaced':
        return 'text-yellow-400 bg-yellow-900/30 border-yellow-700';
      default:
        return 'text-slate-400 bg-slate-900/30 border-slate-700';
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'equipped':
      case 'acquired':
        return Plus;
      case 'unequipped':
      case 'removed':
        return Minus;
      case 'replaced':
        return ArrowRight;
      default:
        return Package;
    }
  };

  if (!actor) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        <div className="text-center">
          <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Select a character to view inventory history</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with Filters */}
      <div className="bg-slate-900 border-b border-slate-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-yellow-400" />
            Inventory History
          </h3>
          <div className="text-sm text-slate-400">
            {filteredHistory.length} change{filteredHistory.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Slot:</label>
            <select
              value={selectedSlot}
              onChange={(e) => setSelectedSlot(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white text-xs px-3 py-1.5 rounded"
            >
              <option value="all">All Slots</option>
              {availableSlots.map(slot => (
                <option key={slot.key} value={slot.key}>{slot.label}</option>
              ))}
            </select>
          </div>

          {availableBooks.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400">Book:</label>
              <select
                value={selectedBook}
                onChange={(e) => setSelectedBook(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white text-xs px-3 py-1.5 rounded"
              >
                <option value="all">All Books</option>
                {availableBooks.map(book => (
                  <option key={book.id} value={book.id}>{book.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Inventory Timeline */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredHistory.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500">
            <div className="text-center">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No inventory changes found</p>
              <p className="text-xs mt-2">Equipment changes will appear here as chapters are analyzed</p>
            </div>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-700" />

            {/* Events */}
            <div className="space-y-4">
              {filteredHistory.map((event, index) => {
                const ActionIcon = getActionIcon(event.action);
                const colorClass = getActionColor(event.action);

                return (
                  <div key={index} className="relative flex items-start gap-4">
                    {/* Timeline Dot */}
                    <div className={`relative z-10 w-4 h-4 rounded-full border-2 ${colorClass.split(' ')[1]} ${colorClass.split(' ')[2]} flex items-center justify-center bg-slate-900`}>
                      <ActionIcon className="w-2.5 h-2.5 text-white" />
                    </div>

                    {/* Event Content */}
                    <div className={`flex-1 bg-slate-900 border ${colorClass.split(' ')[2]} rounded-lg p-4`}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Package className={`w-4 h-4 ${colorClass.split(' ')[0]}`} />
                            <span className={`text-sm font-semibold ${colorClass.split(' ')[0]}`}>
                              {event.action.charAt(0).toUpperCase() + event.action.slice(1)}
                            </span>
                            <span className="text-xs text-slate-500 capitalize">
                              ({event.slot})
                            </span>
                          </div>
                          <div className="text-xs text-slate-400">
                            {event.bookTitle} - {event.chapterTitle}
                          </div>
                        </div>
                        <div className="text-xs text-slate-500">
                          Ch {event.chapterId}
                        </div>
                      </div>

                      {/* Equipment Change */}
                      {event.slot !== 'inventory' && (
                        <div className="flex items-center gap-3">
                          {event.previousItemName && (
                            <>
                              <div className="text-sm text-slate-300">{event.previousItemName}</div>
                              <ArrowRight className="w-4 h-4 text-slate-500" />
                            </>
                          )}
                          {event.currentItemName && (
                            <div className={`text-sm font-semibold ${
                              event.action === 'equipped' ? 'text-green-400' :
                              event.action === 'unequipped' ? 'text-red-400' :
                              'text-yellow-400'
                            }`}>
                              {event.currentItemName}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Inventory Change */}
                      {event.slot === 'inventory' && (
                        <div className="space-y-2">
                          {event.addedItems && event.addedItems.length > 0 && (
                            <div>
                              <div className="text-xs text-green-400 mb-1">Acquired:</div>
                              <div className="flex flex-wrap gap-2">
                                {event.addedItems.map((item, i) => (
                                  <div key={i} className="bg-green-900/30 border border-green-700 rounded px-2 py-1 text-xs text-green-300">
                                    {item.name}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {event.removedItems && event.removedItems.length > 0 && (
                            <div>
                              <div className="text-xs text-red-400 mb-1">Removed:</div>
                              <div className="flex flex-wrap gap-2">
                                {event.removedItems.map((item, i) => (
                                  <div key={i} className="bg-red-900/30 border border-red-700 rounded px-2 py-1 text-xs text-red-300">
                                    {item.name}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryHistoryTimeline;
