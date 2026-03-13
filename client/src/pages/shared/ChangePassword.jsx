import { useState } from 'react';
import api from '../../utils/api';

export default function ChangePassword() {
    const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (form.newPassword !== form.confirmPassword) {
            return setError('New passwords do not match');
        }

        try {
            await api.put('/auth/change-password', {
                currentPassword: form.currentPassword,
                newPassword: form.newPassword,
            });
            setSuccess('Password changed successfully!');
            setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setError(err.message || 'Failed to change password');
        }
    };

    return (
        <div>
            <div className="page-header">
                <h2>Change Password</h2>
            </div>

            <div className="card" style={{ maxWidth: 480 }}>
                {error && <div className="form-error mb-lg">{error}</div>}
                {success && (
                    <div style={{ color: 'var(--color-success)', padding: '12px', background: 'rgba(34,197,94,0.1)', borderRadius: '8px', marginBottom: '16px' }}>
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Current Password</label>
                        <input
                            type="password"
                            className="form-input"
                            value={form.currentPassword}
                            onChange={e => setForm({ ...form, currentPassword: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">New Password</label>
                        <input
                            type="password"
                            className="form-input"
                            value={form.newPassword}
                            onChange={e => setForm({ ...form, newPassword: e.target.value })}
                            required
                            minLength={6}
                        />
                    </div>
                    <div className="form-group mb-xl">
                        <label className="form-label">Confirm New Password</label>
                        <input
                            type="password"
                            className="form-input"
                            value={form.confirmPassword}
                            onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                            required
                            minLength={6}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={!!success}>Update Password</button>
                </form>
            </div>
        </div>
    );
}
