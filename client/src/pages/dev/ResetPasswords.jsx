import { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function ResetPasswords() {
    const [districts, setDistricts] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [selectedUser, setSelectedUser] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.get('/districts').then(res => setDistricts(res.districts || [])).catch(console.error);
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/auth/users');
            setUsers(res.users || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleResetAll = async () => {
        if (!window.confirm("⚠️ WARNING: This will factory reset ALL passwords globally. Continue?")) return;
        executeReset({ scope: 'all' });
    };

    const handleResetDistrict = async () => {
        if (!selectedDistrict) return alert('Select a district first.');
        if (!window.confirm("Reset all passwords for Naib Courts and Admins in this district?")) return;
        executeReset({ scope: 'district', districtId: selectedDistrict });
    };

    const handleResetUser = async () => {
        if (!selectedUser) return alert('Select a user first.');
        if (!window.confirm("Reset this specific user's password?")) return;
        executeReset({ scope: 'user', userId: selectedUser });
    };

    const executeReset = async (payload) => {
        setLoading(true);
        try {
            const res = await api.post('/auth/reset-passwords', payload);
            alert(res.message || 'Passwords successfully reset.');
        } catch (err) {
            alert(err.message || 'Failed to reset passwords.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="page-header">
                <h2>Factory Reset Passwords</h2>
            </div>

            <div className="card mt-lg" style={{ border: '1px solid var(--color-danger)' }}>
                <div className="card-header">
                    <div className="card-title" style={{ color: 'var(--color-danger)' }}>Global Reset</div>
                </div>
                <div className="flex gap-md" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
                    <button className="btn btn-danger" onClick={handleResetAll} disabled={loading}>
                        🚨 Reset All Passwords
                    </button>
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>Instantly resets all accounts across the entire application.</span>
                </div>
            </div>

            <div className="card mt-lg">
                <div className="card-header">
                    <div className="card-title">District-wide Reset</div>
                </div>
                <div className="flex gap-md" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
                    <select className="form-input" style={{ width: 250 }} value={selectedDistrict} onChange={e => setSelectedDistrict(e.target.value)}>
                        <option value="">Select District...</option>
                        {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    <button className="btn btn-primary" onClick={handleResetDistrict} disabled={loading}>
                        Reset District Passwords
                    </button>
                </div>
            </div>

            <div className="card mt-lg">
                <div className="card-header">
                    <div className="card-title">Single User Reset</div>
                </div>
                <div className="flex gap-md" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
                    <select className="form-input" style={{ width: 350 }} value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
                        <option value="">Select User...</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.username} ({u.role}) - {u.name}</option>)}
                    </select>
                    <button className="btn btn-primary" onClick={handleResetUser} disabled={loading}>
                        Reset Specific User
                    </button>
                </div>
            </div>
        </div>
    );
}
