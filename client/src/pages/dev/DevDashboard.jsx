import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../utils/api';

export default function DevDashboard() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [stats, setStats] = useState(null);

    useEffect(() => {
        Promise.all([
            api.get('/districts'),
            api.get('/data-tables'),
            api.get('/grievances'),
        ]).then(([d, t_res, g]) => {
            setStats({
                districts: d.districts?.length || 0,
                tables: t_res.tables?.length || 0,
                grievances: g.grievances?.filter(gr => !['resolved', 'cancelled'].includes(gr.status)).length || 0,
            });
        }).catch(console.error);
    }, []);

    return (
        <div>
            <div className="page-header">
                <h2>{t('devDashboardTitle')}</h2>
            </div>

            <div className="stat-cards">
                <Link to="/dev/districts" className="stat-card">
                    <div className="stat-icon">🏛️</div>
                    <div className="stat-value">{stats?.districts ?? '—'}</div>
                    <div className="stat-label">{t('districts')}</div>
                </Link>
                <Link to="/dev/data-tables" className="stat-card">
                    <div className="stat-icon">📋</div>
                    <div className="stat-value">{stats?.tables ?? '—'}</div>
                    <div className="stat-label">{t('dataTables')}</div>
                </Link>
                <Link to="/dev/grievances" className="stat-card">
                    <div className="stat-icon">🎫</div>
                    <div className="stat-value">{stats?.grievances ?? '—'}</div>
                    <div className="stat-label">{t('openGrievances')}</div>
                </Link>
            </div>

            <div className="card">
                <div className="card-header">
                    <div className="card-title">{t('quickActions')}</div>
                </div>
                <div className="flex gap-md" style={{ flexWrap: 'wrap' }}>
                    <Link className="btn btn-secondary" to="/dev/courts">{t('manageCourts')}</Link>
                    <Link className="btn btn-secondary" to="/dev/magistrates">{t('manageJudicialOfficers')}</Link>
                    <Link className="btn btn-secondary" to="/dev/naib-courts">{t('manageNaibCourts')}</Link>
                    <Link className="btn btn-secondary" to="/dev/reports">{t('viewReports')}</Link>
                    <Link className="btn btn-primary" to="/dev/system">⚙️ {t('systemManagement')}</Link>
                    <Link className="btn btn-danger" to="/dev/reset-passwords">{t('resetPasswords')}</Link>
                    <Link className="btn btn-secondary" to="/dev/change-password">{t('changePassword')}</Link>
                </div>
            </div>
        </div>
    );
}
