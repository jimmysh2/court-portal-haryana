import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

export default function ManagePoliceStations() {
    const { t } = useLanguage();
    const { user } = useAuth();
    const { districtId: paramDistrictId } = useParams();
    const navigate = useNavigate();
    
    // Determine which district we are managing
    const districtId = paramDistrictId || user?.districtId;
    const isReadOnly = user?.role === 'district_admin';

    const [district, setDistrict] = useState(null);
    const [policeStations, setPoliceStations] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({ name: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    const loadDistrict = async () => {
        if (!districtId) return;
        try {
            const d = await api.get(`/districts/${districtId}`);
            setDistrict(d.district);
        } catch (err) {
            console.error('Failed to load district:', err);
            setError(t('districtNotFound'));
        }
    };

    const loadStations = async () => {
        if (!districtId) return;
        try {
            const res = await api.get(`/districts/${districtId}/police-stations`);
            setPoliceStations(res.policeStations);
        } catch (err) {
            console.error('Failed to load police stations:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDistrict();
        loadStations();
    }, [districtId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (editItem) {
                await api.put(`/districts/${districtId}/police-stations/${editItem.id}`, form);
                alert(t('tableUpdated'));
            } else {
                await api.post(`/districts/${districtId}/police-stations`, form);
                alert(t('tableCreated'));
            }
            setShowForm(false);
            setEditItem(null);
            setForm({ name: '' });
            loadStations();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleEdit = (ps) => {
        setEditItem(ps);
        setForm({ name: ps.name });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!confirm(t('confirmDeletePoliceStation'))) return;
        try {
            await api.delete(`/districts/${districtId}/police-stations/${id}`);
            loadStations();
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading && !district) return <div className="text-center p-xl">{t('loading')}</div>;

    return (
        <div>
            <div className="page-header">
                <div>
                    {!isReadOnly && (
                        <button className="btn btn-secondary btn-sm mb-sm" onClick={() => navigate(`/${user?.role === 'developer' ? 'dev' : 'state'}/districts`)}>
                            ← {t('backToDistricts')}
                        </button>
                    )}
                    <h2>🚔 {isReadOnly ? t('policeStations') : t('managePoliceStations')}: {district?.name}</h2>
                </div>
                {!isReadOnly && (
                    <button 
                        className="btn btn-primary" 
                        onClick={() => { setShowForm(true); setEditItem(null); setForm({ name: '' }); }}
                    >
                        + {t('addPoliceStation')}
                    </button>
                )}
            </div>

            {showForm && !isReadOnly && (
                <div className="card mb-xl">
                    <h3 className="card-title mb-lg">{editItem ? t('editPoliceStation') : t('addPoliceStation')}</h3>
                    {error && <div className="form-error mb-lg">{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">{t('policeStationName')}</label>
                            <input 
                                className="form-input" 
                                value={form.name} 
                                onChange={e => setForm({ ...form, name: e.target.value })} 
                                placeholder={t('policeStationPlaceholder')} 
                                required 
                            />
                        </div>
                        <div className="flex gap-md">
                            <button className="btn btn-primary" type="submit">{t('save')}</button>
                            <button className="btn btn-secondary" type="button" onClick={() => { setShowForm(false); setEditItem(null); }}>
                                {t('cancel')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="card">
                <div className="data-table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ width: '80px' }}>{t('serialNo')}</th>
                                <th>{t('policeStationName')}</th>
                                {!isReadOnly && <th style={{ width: '200px' }}>{t('actions')}</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {policeStations.map((ps, idx) => (
                                <tr key={ps.id}>
                                    <td data-label={t('serialNo')}>{idx + 1}</td>
                                    <td data-label={t('nameLabel')}>{ps.name}</td>
                                    {!isReadOnly && (
                                        <td data-label={t('actions')}>
                                            <div className="flex gap-sm">
                                                <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(ps)}>{t('edit')}</button>
                                                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(ps.id)}>{t('delete')}</button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {policeStations.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={isReadOnly ? 2 : 3} className="text-center text-muted p-lg">{t('noEntries')}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
