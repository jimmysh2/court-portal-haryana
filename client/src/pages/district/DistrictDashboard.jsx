import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

export default function DistrictDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);

    useEffect(() => {
        Promise.all([
            api.get('/courts'),
            api.get('/naib-courts'),
            api.get('/grievances'),
            api.get('/alerts'),
        ]).then(([c, n, g, a]) => {
            setStats({
                courts: c.courts?.length || 0,
                naibCourts: n.users?.length || 0,
                grievances: g.grievances?.filter(gr => gr.status !== 'resolved').length || 0,
                alerts: a.alerts?.filter(al => !al.resolved).length || 0,
            });
        }).catch(console.error);
    }, []);

    return (
        <div>
            <div className="page-header"><h2>District Admin Dashboard</h2></div>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xl)' }}>
                District: <strong>{user?.district?.name || '—'}</strong>
            </p>
            <div className="stat-cards">
                <div className="stat-card">
                    <div className="stat-icon">⚖️</div>
                    <div className="stat-value">{stats?.courts ?? '—'}</div>
                    <div className="stat-label">Courts</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">👤</div>
                    <div className="stat-value">{stats?.naibCourts ?? '—'}</div>
                    <div className="stat-label">Naib Courts</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🎫</div>
                    <div className="stat-value">{stats?.grievances ?? '—'}</div>
                    <div className="stat-label">Open Grievances</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🔔</div>
                    <div className="stat-value">{stats?.alerts ?? '—'}</div>
                    <div className="stat-label">Pending Alerts</div>
                </div>
            </div>
            <div className="card">
                <div className="card-header"><div className="card-title">Quick Actions</div></div>
                <div className="flex gap-md" style={{ flexWrap: 'wrap' }}>
                    <a className="btn btn-primary" href="/district/data-vetting">Data Vetting</a>
                    <a className="btn btn-secondary" href="/district/courts">Manage Courts</a>
                    <a className="btn btn-secondary" href="/district/magistrates">Manage Judicial Officers</a>
                    <a className="btn btn-secondary" href="/district/naib-courts">Manage Naib Courts</a>
                    <a className="btn btn-secondary" href="/district/alerts">View Alerts</a>
                    <a className="btn btn-secondary" href="/district/grievances">Grievances</a>
                    <a className="btn btn-secondary" href="/district/reports">Reports</a>
                </div>
            </div>
        </div>
    );
}
