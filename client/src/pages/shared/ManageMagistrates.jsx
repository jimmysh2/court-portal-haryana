import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../utils/api';

export default function ManageMagistrates() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [magistrates, setMagistrates] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [courts, setCourts] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [showTransfer, setShowTransfer] = useState(null);
    const [showAssign, setShowAssign] = useState(null);
    const [form, setForm] = useState({ name: '', designation: '', gender: '', districtId: '', phone: '' });
    const [transferTo, setTransferTo] = useState('');
    const [assignCourt, setAssignCourt] = useState('');
    const [editItem, setEditItem] = useState(null);
    const [filterDistrict, setFilterDistrict] = useState('');
    const [error, setError] = useState('');

    const canTransfer = ['developer', 'state_admin'].includes(user.role);
    const canCreate = ['developer', 'state_admin'].includes(user.role);
    const canAssign = ['developer', 'state_admin', 'district_admin'].includes(user.role);

    const load = () => {
        const params = filterDistrict ? `?districtId=${filterDistrict}` : '';
        api.get(`/magistrates${params}`).then(d => setMagistrates(d.magistrates)).catch(console.error);
    };
    useEffect(() => {
        api.get('/districts').then(d => setDistricts(d.districts)).catch(console.error);
        api.get('/courts').then(d => setCourts(d.courts)).catch(console.error);
    }, []);
    useEffect(() => { load(); }, [filterDistrict]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (editItem) {
                await api.put(`/magistrates/${editItem.id}`, form);
            } else {
                await api.post('/magistrates', form);
            }
            setShowForm(false); setEditItem(null);
            load();
        } catch (err) { setError(err.message); }
    };

    const handleTransfer = async (id) => {
        try {
            await api.post(`/magistrates/${id}/transfer`, { toDistrictId: parseInt(transferTo) });
            setShowTransfer(null);
            setTransferTo('');
            load();
        } catch (err) { alert(err.message); }
    };

    const handleAssign = async (id) => {
        try {
            await api.post(`/magistrates/${id}/assign-court`, { courtId: parseInt(assignCourt) });
            setShowAssign(null);
            setAssignCourt('');
            load();
        } catch (err) { alert(err.message); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this judicial officer?')) return;
        try {
            await api.delete(`/magistrates/${id}`);
            load();
        } catch (err) { alert(err.message); }
    };

    return (
        <div>
            <div className="page-header">
                <h2>{t('manageJudicialOfficers')}</h2>
                {canCreate && (
                    <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditItem(null); setForm({ name: '', designation: '', gender: '', districtId: filterDistrict || '', phone: '' }); }}>
                        + {t('addJudicialOfficer')}
                    </button>
                )}
            </div>

            {canCreate && (
                <div className="mb-xl">
                    <select className="form-select" style={{ maxWidth: 300 }} value={filterDistrict} onChange={e => setFilterDistrict(e.target.value)}>
                        <option value="">{t('allDistricts')}</option>
                        {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                </div>
            )}

            {showForm && (
                <div className="card mb-xl">
                    <h3 className="card-title mb-lg">{editItem ? t('editJudicialOfficer') : t('addJudicialOfficer')}</h3>
                    {error && <div className="form-error mb-lg">{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">{t('nameLabel')}</label>
                                <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('designationLabel')}</label>
                                <input className="form-input" value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} placeholder="e.g. ADJ, CJM" required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('district')}</label>
                                <select className="form-select" value={form.districtId} onChange={e => setForm({ ...form, districtId: e.target.value })} required>
                                    <option value="">{t('selectDistrict')}</option>
                                    {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('gender')}</label>
                                <select className="form-select" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                                    <option value="">{t('selectGender')}</option>
                                    <option value="Male">{t('male')}</option>
                                    <option value="Female">{t('female')}</option>
                                    <option value="Other">{t('other')}</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('phoneLabel')}</label>
                                <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
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
                            <th>{t('nameLabel')}</th>
                            <th>{t('genderLabel')}</th>
                            <th>{t('designationLabel')}</th>
                            <th>{t('district')}</th>
                            <th>{t('courtLabel')}</th>
                            <th>{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {magistrates.map((m, idx) => (
                            <tr key={m.id}>
                                <td data-label={t('serialNo')}>{idx + 1}</td>
                                <td data-label={t('nameLabel')}>{m.name}</td>
                                <td data-label={t('genderLabel')}>{m.gender || <span className="text-muted">—</span>}</td>
                                <td data-label={t('designationLabel')}><span className="badge badge-primary">{m.designation}</span></td>
                                <td data-label={t('district')}>{m.district?.name || <span className="text-muted">{t('unassigned')}</span>}</td>
                                <td data-label={t('courtLabel')}>{m.courts?.length ? m.courts.map(c => c.name).join(', ') : <span className="text-muted">{t('none')}</span>}</td>
                                <td data-label={t('actions')}>
                                    <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
                                        {canCreate && <button className="btn btn-secondary btn-sm" onClick={() => { setEditItem(m); setForm({ name: m.name, designation: m.designation, gender: m.gender || '', districtId: m.district?.id || '', phone: m.phone || '' }); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>{t('edit')}</button>}
                                         {canCreate && <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m.id)}>{t('delete')}</button>}
                                         {canTransfer && (
                                             showTransfer === m.id ? (
                                                 <div className="flex gap-sm">
                                                     <select className="form-select" style={{ minWidth: 120 }} value={transferTo} onChange={e => setTransferTo(e.target.value)}>
                                                         <option value="">{t('toDistrict')}</option>
                                                         {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                                     </select>
                                                     <button className="btn btn-primary btn-sm" onClick={() => handleTransfer(m.id)} disabled={!transferTo}>{t('go') || 'Go'}</button>
                                                     <button className="btn btn-secondary btn-sm" onClick={() => setShowTransfer(null)}>✕</button>
                                                 </div>
                                             ) : (
                                                 <button className="btn btn-secondary btn-sm" onClick={() => setShowTransfer(m.id)}>{t('transfer') || 'Transfer'}</button>
                                             )
                                         )}
                                         {canAssign && (
                                             showAssign === m.id ? (
                                                 <div className="flex gap-sm">
                                                     <select className="form-select" style={{ minWidth: 140 }} value={assignCourt} onChange={e => setAssignCourt(e.target.value)}>
                                                         <option value="">{t('assignCourt')}</option>
                                                         {courts.filter(c => !m.districtId || c.districtId === m.districtId).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                     </select>
                                                     <button className="btn btn-primary btn-sm" onClick={() => handleAssign(m.id)} disabled={!assignCourt}>{t('go') || 'Go'}</button>
                                                     <button className="btn btn-secondary btn-sm" onClick={() => setShowAssign(null)}>✕</button>
                                                 </div>
                                             ) : (
                                                 <button className="btn btn-secondary btn-sm" onClick={() => setShowAssign(m.id)}>{t('assignCourtShort') || 'Assign Court'}</button>
                                             )
                                         )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
