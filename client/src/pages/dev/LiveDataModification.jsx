import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';

export default function LiveDataModification() {
    const { user } = useAuth();
    const { t } = useLanguage();

    const [districts, setDistricts] = useState([]);
    const [courts, setCourts] = useState([]);
    const [tables, setTables] = useState([]);
    const [entries, setEntries] = useState([]);

    const [filters, setFilters] = useState({
        districtId: '',
        courtId: '',
        tableId: '',
        dateFrom: '',
        dateTo: ''
    });

    const [editItem, setEditItem] = useState(null);
    const [editValues, setEditValues] = useState({});
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.get('/districts').then(d => setDistricts(d.districts)).catch(console.error);
        api.get('/data-tables').then(d => setTables(d.tables)).catch(console.error);
    }, []);

    useEffect(() => {
        if (filters.districtId) {
            api.get(`/courts?districtId=${filters.districtId}`).then(d => setCourts(d.courts)).catch(console.error);
        } else {
            setCourts([]);
        }
    }, [filters.districtId]);

    const loadEntries = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filters.districtId) params.append('districtId', filters.districtId);
            if (filters.courtId) params.append('courtId', filters.courtId);
            if (filters.tableId) params.append('tableId', filters.tableId);
            if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
            if (filters.dateTo) params.append('dateTo', filters.dateTo);

            const res = await api.get(`/data-entries?${params.toString()}`);
            setEntries(res.entries || []);
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to permanently delete this data entry? This action cannot be undone.')) return;
        try {
            await api.delete(`/data-entries/${id}`);
            loadEntries();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleEdit = (entry) => {
        setEditItem(entry);
        setEditValues(entry.values || {});
        setError('');
    };

    const submitEdit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.put(`/data-entries/${editItem.id}`, { values: editValues });
            setEditItem(null);
            setEditValues({});
            loadEntries();
        } catch (err) {
            setError(err.message || 'Failed to update data entry');
        }
    };

    const handleValueChange = (slug, value, dataType) => {
        let finalValue = value;
        if (dataType === 'number') finalValue = value === '' ? '' : Number(value);
        if (dataType === 'boolean') finalValue = value === 'true';

        setEditValues(prev => ({ ...prev, [slug]: finalValue }));
    };

    // Find table config for rendering edit modal
    const currentTableDef = editItem ? tables.find(t => t.id === editItem.tableId) : null;

    return (
        <div>
            <div className="page-header">
                <h2>Live Data Modification</h2>
                <p className="text-muted" style={{ marginTop: '0.5rem' }}>
                    Developer tool to safely modify or delete mistakenly submitted data by Naib Courts (bypasses time-locks).
                </p>
            </div>

            <div className="card mb-xl">
                <h3 className="card-title mb-lg">Search Filters</h3>
                <div className="flex gap-md" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
                        <label className="form-label">District</label>
                        <select
                            className="form-select"
                            value={filters.districtId}
                            onChange={e => setFilters({ ...filters, districtId: e.target.value, courtId: '' })}
                        >
                            <option value="">All Districts</option>
                            {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>

                    <div className="form-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
                        <label className="form-label">Court</label>
                        <select
                            className="form-select"
                            value={filters.courtId}
                            onChange={e => setFilters({ ...filters, courtId: e.target.value })}
                            disabled={!filters.districtId}
                        >
                            <option value="">All Courts</option>
                            {courts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div className="form-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
                        <label className="form-label">Table / Form</label>
                        <select
                            className="form-select"
                            value={filters.tableId}
                            onChange={e => setFilters({ ...filters, tableId: e.target.value })}
                        >
                            <option value="">All Tables</option>
                            {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>

                    <div className="form-group" style={{ flex: '1 1 150px', marginBottom: 0 }}>
                        <label className="form-label">Date From</label>
                        <input
                            type="date"
                            className="form-input"
                            value={filters.dateFrom}
                            onChange={e => setFilters({ ...filters, dateFrom: e.target.value })}
                        />
                    </div>

                    <div className="form-group" style={{ flex: '1 1 150px', marginBottom: 0 }}>
                        <label className="form-label">Date To</label>
                        <input
                            type="date"
                            className="form-input"
                            value={filters.dateTo}
                            onChange={e => setFilters({ ...filters, dateTo: e.target.value })}
                        />
                    </div>

                    <button className="btn btn-primary" onClick={loadEntries} disabled={loading}>
                        {loading ? 'Searching...' : 'Search Data'}
                    </button>
                    <button className="btn btn-secondary" onClick={() => {
                        setFilters({ districtId: '', courtId: '', tableId: '', dateFrom: '', dateTo: '' });
                        setEntries([]);
                    }}>Clear</button>
                </div>
            </div>

            {entries.length > 0 && (
                <div className="data-table-wrapper card">
                    <h3 className="card-title mb-md">Found {entries.length} Entries</h3>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>District / Court</th>
                                <th>Table</th>
                                <th>Data Values (JSON)</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map(e => (
                                <tr key={e.id}>
                                    <td data-label="Date" style={{ whiteSpace: 'nowrap' }}>
                                        {new Date(e.entryDate).toLocaleDateString('en-IN')}
                                    </td>
                                    <td data-label="District / Court">
                                        <div style={{ fontWeight: 500 }}>{e.district?.name}</div>
                                        <div className="text-muted" style={{ fontSize: '0.85em' }}>{e.court?.name}</div>
                                    </td>
                                    <td data-label="Table">
                                        <span className="badge badge-secondary">{e.table?.name}</span>
                                    </td>
                                    <td data-label="Data Values">
                                        <div style={{
                                            fontSize: '11px',
                                            fontFamily: 'monospace',
                                            background: 'var(--color-bg-hover)',
                                            padding: '4px',
                                            borderRadius: '4px',
                                            maxHeight: '60px',
                                            overflowY: 'auto'
                                        }}>
                                            {JSON.stringify(e.values).substring(0, 100)}
                                            {JSON.stringify(e.values).length > 100 ? '...' : ''}
                                        </div>
                                    </td>
                                    <td data-label="Actions">
                                        <div className="flex gap-sm">
                                            <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(e)}>Edit</button>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(e.id)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {entries.length === 0 && !loading && filters.districtId && (
                <div className="empty-state card text-center">
                    <div className="icon" style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                    <h3>No Data Found</h3>
                    <p className="text-muted">Adjust your filters and hit search to find data entries.</p>
                </div>
            )}

            {/* Edit Modal Overlay */}
            {editItem && currentTableDef && (
                <>
                    <div className="sidebar-overlay" style={{ zIndex: 998, display: 'block' }} onClick={() => setEditItem(null)}></div>
                    <div className="card" style={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 999,
                        width: '90%',
                        maxHeight: '90vh',
                        maxWidth: '600px',
                        overflowY: 'auto',
                        boxShadow: 'var(--shadow-xl)'
                    }}>
                        <h3 className="card-title mb-md">Edit Live Data Entry</h3>
                        <div className="text-muted mb-lg" style={{ fontSize: '0.85rem' }}>
                            Table: {currentTableDef.name}<br />
                            Date: {new Date(editItem.entryDate).toLocaleDateString('en-IN')}<br />
                            Court: {editItem.court?.name}
                        </div>

                        {error && <div className="form-error mb-lg">{error}</div>}

                        <form onSubmit={submitEdit}>
                            {currentTableDef.columns.map(col => (
                                <div className="form-group" key={col.slug}>
                                    <label className="form-label">
                                        {col.name} {col.isRequired && <span className="text-danger">*</span>}
                                    </label>

                                    {col.dataType === 'enum' ? (
                                        <select
                                            className="form-select"
                                            value={editValues[col.slug] || ''}
                                            onChange={e => handleValueChange(col.slug, e.target.value, col.dataType)}
                                            required={col.isRequired}
                                        >
                                            <option value="">Select option</option>
                                            {col.enumOptions?.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    ) : col.dataType === 'number' ? (
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={editValues[col.slug] !== undefined ? editValues[col.slug] : ''}
                                            onChange={e => handleValueChange(col.slug, e.target.value, col.dataType)}
                                            required={col.isRequired}
                                        />
                                    ) : col.dataType === 'boolean' ? (
                                        <select
                                            className="form-select"
                                            value={editValues[col.slug] !== undefined ? String(editValues[col.slug]) : ''}
                                            onChange={e => handleValueChange(col.slug, e.target.value, col.dataType)}
                                            required={col.isRequired}
                                        >
                                            <option value="">Yes/No</option>
                                            <option value="true">Yes</option>
                                            <option value="false">No</option>
                                        </select>
                                    ) : (
                                        <input
                                            type={col.dataType === 'date' ? 'date' : 'text'}
                                            className="form-input"
                                            value={editValues[col.slug] || ''}
                                            onChange={e => handleValueChange(col.slug, e.target.value, col.dataType)}
                                            required={col.isRequired}
                                        />
                                    )}
                                </div>
                            ))}

                            <div className="flex gap-md mt-xl">
                                <button type="submit" className="btn btn-primary w-full">Save Changes</button>
                                <button type="button" className="btn btn-secondary w-full" onClick={() => setEditItem(null)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </>
            )}
        </div>
    );
}
