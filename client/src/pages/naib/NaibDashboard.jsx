import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

export default function NaibDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);

    useEffect(() => {
        Promise.all([
            api.get('/grievances'),
        ]).then(([g]) => {
            setStats({
                grievances: g.grievances?.filter(gr => !['resolved', 'cancelled'].includes(gr.status)).length || 0,
                selectedCourt: user?.lastSelectedCourt?.name || null,
            });
        }).catch(console.error);
    }, []);

    return (
        <div>
            <div className="page-header"><h2>Naib Court Dashboard</h2></div>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xl)' }}>
                Welcome, <strong>{user?.name || '—'}</strong> — District: <strong>{user?.district?.name || '—'}</strong>
            </p>

            <div className="stat-cards">
                <Link to="/naib/select-court" className="stat-card">
                    <div className="stat-icon">⚖️</div>
                    <div className="stat-value">{stats?.selectedCourt || '—'}</div>
                    <div className="stat-label">Selected Court</div>
                </Link>
                <Link to="/naib/grievances" className="stat-card">
                    <div className="stat-icon">🎫</div>
                    <div className="stat-value">{stats?.grievances ?? '—'}</div>
                    <div className="stat-label">Open Grievances</div>
                </Link>
            </div>

            <div className="card">
                <div className="card-header"><div className="card-title">Quick Actions</div></div>
                <div className="flex gap-md" style={{ flexWrap: 'wrap' }}>
                    <a className="btn btn-primary" href="/naib/entry">Data Entry</a>
                    <a className="btn btn-secondary" href="/naib/reports">Reports</a>
                    <a className="btn btn-secondary" href="/naib/change-password">Change Password</a>
                </div>
            </div>
        </div>
    );
}
