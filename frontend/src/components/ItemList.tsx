import React, { useState, useEffect } from 'react';
import { itemService } from '../services/itemService';
import type { Item } from '../types';

export const ItemList: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newItem, setNewItem] = useState({ name: '', description: '' });
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await itemService.getAll();
      setItems(data);
      setError('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError('Failed to fetch items: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await itemService.create(newItem);
      setNewItem({ name: '', description: '' });
      fetchItems();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError('Failed to create item: ' + errorMessage);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem?.id) return;
    try {
      await itemService.update(editingItem.id, {
        name: editingItem.name,
        description: editingItem.description,
      });
      setEditingItem(null);
      fetchItems();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError('Failed to update item: ' + errorMessage);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await itemService.delete(id);
      fetchItems();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError('Failed to delete item: ' + errorMessage);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Items</h2>
      
      {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}

      <form onSubmit={handleCreate} style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h3>Create New Item</h3>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="Name"
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <textarea
            placeholder="Description"
            value={newItem.description}
            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box', minHeight: '60px' }}
          />
        </div>
        <button type="submit" style={{ padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Add Item
        </button>
      </form>

      {editingItem && (
        <form onSubmit={handleUpdate} style={{ marginBottom: '30px', padding: '15px', border: '1px solid #007bff', borderRadius: '8px', backgroundColor: '#f0f8ff' }}>
          <h3>Edit Item</h3>
          <div style={{ marginBottom: '10px' }}>
            <input
              type="text"
              value={editingItem.name}
              onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
              required
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <textarea
              value={editingItem.description}
              onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box', minHeight: '60px' }}
            />
          </div>
          <button type="submit" style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' }}>
            Update
          </button>
          <button type="button" onClick={() => setEditingItem(null)} style={{ padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Cancel
          </button>
        </form>
      )}

      <div>
        {items.length === 0 ? (
          <p>No items found. Create one above!</p>
        ) : (
          items.map((item) => (
            <div key={item.id} style={{ marginBottom: '15px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <div style={{ marginTop: '10px' }}>
                <button
                  onClick={() => setEditingItem(item)}
                  style={{ padding: '5px 10px', backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' }}
                >
                  Edit
                </button>
                <button
                  onClick={() => item.id && handleDelete(item.id)}
                  style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
