import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../utils/api';

export default function DistrictDashboard() {
    const { user } = useAuth();
    const { t } = useLanguage();
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
                naibCourts: n.naibCourts?.length || 0,
                grievances: g.grievances?.filter(gr => !['resolved', 'cancelled'].includes(gr.status)).length || 0,
                alerts: a.alerts?.filter(al => !al.resolved).length || 0,
            });
        }).catch(console.error);
    }, []);

    return (
        <div>
            <div className="page-header"><h2>{t('districtAdminDashboard')}</h2></div>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xl)' }}>
                {t('district')}: <strong>{user?.district?.name || '—'}</strong>
            </p>
            <div className="stat-cards">
                <Link to="/district/courts" className="stat-card">
                    <div className="stat-icon">⚖️</div>
                    <div className="stat-value">{stats?.courts ?? '—'}</div>
                    <div className="stat-label">{t('courts')}</div>
                </Link>
                <Link to="/district/naib-courts" className="stat-card">
                    <div className="stat-icon">👤</div>
                    <div className="stat-value">{stats?.naibCourts ?? '—'}</div>
                    <div className="stat-label">{t('naibCourts')}</div>
                </Link>
                <Link to="/district/grievances" className="stat-card">
                    <div className="stat-icon">🎫</div>
                    <div className="stat-value">{stats?.grievances ?? '—'}</div>
                    <div className="stat-label">{t('openGrievances')}</div>
                </Link>
                <Link to="/district/alerts" className="stat-card">
                    <div className="stat-icon">🔔</div>
                    <div className="stat-value">{stats?.alerts ?? '—'}</div>
                    <div className="stat-label">{t('pendingAlerts')}</div>
                </Link>
            </div>
            <div className="card">
                <div className="card-header"><div className="card-title">{t('quickActions')}</div></div>
                <div className="flex gap-md" style={{ flexWrap: 'wrap' }}>
                    <a className="btn btn-primary" href="/district/data-vetting">{t('dataVetting')}</a>
                    <a className="btn btn-secondary" href="/district/police-stations">🚔 {t('policeStations')}</a>
                    <a className="btn btn-secondary" href="/district/magistrates">{t('manageJudicialOfficers')}</a>
                    <a className="btn btn-secondary" href="/district/reports">{t('reports')}</a>
                    <a className="btn btn-secondary" href="/district/change-password">{t('changePassword')}</a>
                </div>
            </div>
        </div>
    );
}
