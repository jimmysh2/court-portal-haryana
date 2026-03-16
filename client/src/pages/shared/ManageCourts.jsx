import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';

export default function ManageCourts() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [courts, setCourts] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [magistrates, setMagistrates] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({ districtId: '', name: '', courtNo: '' });
    const [filterDistrict, setFilterDistrict] = useState('');
    const [error, setError] = useState('');

    const load = () => {
        const params = filterDistrict ? `?districtId=${filterDistrict}` : '';
        api.get(`/courts${params}`).then(d => setCourts(d.courts)).catch(console.error);
    };

    useEffect(() => {
        api.get('/districts').then(d => setDistricts(d.districts)).catch(console.error);
        api.get('/magistrates').then(d => setMagistrates(d.magistrates)).catch(console.error);
    }, []);
    useEffect(() => { load(); }, [filterDistrict]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (editItem) {
                await api.put(`/courts/${editItem.id}`, form);
            } else {
                await api.post('/courts', form);
            }
            setShowForm(false); setEditItem(null);
            setForm({ districtId: '', name: '', courtNo: '' });
            load();
        } catch (err) { setError(err.message); }
    };

    const handleEdit = (c) => {
        setEditItem(c);
        setForm({ districtId: c.districtId, name: c.name, courtNo: c.courtNo });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!confirm(t('confirmDeleteCourt'))) return;
        await api.delete(`/courts/${id}`);
        load();
    };

    return (
        <div>
            <div className="page-header">
                <h2>{t('manageCourts')}</h2>
                <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditItem(null); setForm({ districtId: user.districtId || filterDistrict || '', name: '', courtNo: '' }); }}>
                    + {t('addCourt')}
                </button>
            </div>

            {['developer', 'state_admin'].includes(user.role) && (
                <div className="mb-xl">
                    <select className="form-select" style={{ maxWidth: 300 }} value={filterDistrict} onChange={e => setFilterDistrict(e.target.value)}>
                        <option value="">{t('allDistricts')}</option>
                        {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                </div>
            )}

            {showForm && (
                <div className="card mb-xl">
                    <h3 className="card-title mb-lg">{editItem ? t('editCourt') : t('addCourt')}</h3>
                    {error && <div className="form-error mb-lg">{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">{t('district')}</label>
                                <select className="form-select" value={form.districtId} onChange={e => setForm({ ...form, districtId: e.target.value })} required>
                                    <option value="">{t('selectDistrict')}</option>
                                    {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('courtNameLabel')}</label>
                                <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('courtIdLabel')}</label>
                                <input className="form-input" value={form.courtNo} onChange={e => setForm({ ...form, courtNo: e.target.value })} required />
                            </div>
                        </div>
                        <div className="flex gap-md">
                            <button className="btn btn-primary" type="submit">{t('save')}</button>
                            <button className="btn btn-secondary" type="button" onClick={() => setShowForm(false)}>{t('cancel')}</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="data-table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>{t('serialNo')}</th>
                            <th>{t('courtIdLabel')}</th>
                            <th>{t('nameLabel')}</th>
                            <th>{t('district')}</th>
                            <th>{t('judicialOfficerLabel')}</th>
                            <th>{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {courts.map((c, idx) => (
                            <tr key={c.id}>
                                <td data-label={t('serialNo')}>{idx + 1}</td>
                                <td data-label={t('courtIdLabel')}><span className="badge badge-secondary">{c.courtNo}</span></td>
                                <td data-label={t('nameLabel')}>{c.name}</td>
                                <td data-label={t('district')}>{c.district?.name}</td>
                                <td data-label={t('judicialOfficerLabel')}>{c.magistrate ? c.magistrate.name : <span className="text-muted">{t('notAssigned')}</span>}</td>
                                <td data-label={t('actions')}>
                                    <div className="flex gap-sm">
                                        <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(c)}>{t('edit')}</button>
                                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>{t('delete')}</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {courts.length === 0 && (
                            <tr><td colSpan="6" className="text-center text-muted">{t('noCourtsFound')}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
