import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

export default function DevDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);

    useEffect(() => {
        Promise.all([
            api.get('/districts'),
            api.get('/data-tables'),
            api.get('/grievances'),
        ]).then(([d, t, g]) => {
            setStats({
                districts: d.districts?.length || 0,
                tables: t.tables?.length || 0,
                grievances: g.grievances?.filter(gr => !['resolved', 'cancelled'].includes(gr.status)).length || 0,
            });
        }).catch(console.error);
    }, []);

    const handleResetPasswords = async () => {
        if (!window.confirm("⚠️ WARNING ⚠️\n\nAre you sure you want to completely FACTORY RESET all passwords in the entire system to their default values?\n\nThis will instantly override any passwords users have manually changed.")) {
            return;
        }
        
        try {
            const res = await api.post('/auth/reset-all-passwords');
            alert(res.message || 'Passwords successfully reset.');
        } catch (err) {
            alert(err.message || 'Failed to reset passwords.');
        }
    };

    return (
        <div>
            <div className="page-header">
                <h2>Developer Dashboard</h2>
            </div>

            <div className="stat-cards">
                <Link to="/dev/districts" className="stat-card">
                    <div className="stat-icon">🏛️</div>
                    <div className="stat-value">{stats?.districts ?? '—'}</div>
                    <div className="stat-label">Districts</div>
                </Link>
                <Link to="/dev/data-tables" className="stat-card">
                    <div className="stat-icon">📋</div>
                    <div className="stat-value">{stats?.tables ?? '—'}</div>
                    <div className="stat-label">Data Tables</div>
                </Link>
                <Link to="/dev/grievances" className="stat-card">
                    <div className="stat-icon">🎫</div>
                    <div className="stat-value">{stats?.grievances ?? '—'}</div>
                    <div className="stat-label">Open Grievances</div>
                </Link>
            </div>

            <div className="card">
                <div className="card-header">
                    <div className="card-title">Quick Actions</div>
                </div>
                <div className="flex gap-md" style={{ flexWrap: 'wrap' }}>
                    <a className="btn btn-secondary" href="/dev/courts">Manage Courts</a>
                    <a className="btn btn-secondary" href="/dev/magistrates">Manage Judicial Officers</a>
                    <a className="btn btn-secondary" href="/dev/naib-courts">Manage Naib Courts</a>
                    <a className="btn btn-secondary" href="/dev/reports">View Reports</a>
                    <a className="btn btn-secondary" href="/dev/change-password">Change Password</a>
                </div>
            </div>

            <div className="card mt-lg" style={{ border: '1px solid var(--color-danger)' }}>
                <div className="card-header">
                    <div className="card-title" style={{ color: 'var(--color-danger)' }}>Danger Zone</div>
                </div>
                <div className="flex gap-md" style={{ flexWrap: 'wrap' }}>
                    <button className="btn btn-danger" onClick={handleResetPasswords}>
                        🚨 Factory Reset All Passwords
                    </button>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', alignSelf: 'center', marginLeft: 'var(--space-md)' }}>
                        Instantly resets all accounts across the entire application to their predefined default passwords.
                    </p>
                </div>
            </div>
        </div>
    );
}
