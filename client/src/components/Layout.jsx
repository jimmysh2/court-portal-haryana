import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const navConfig = {
    developer: {
        label: 'Developer',
        sections: [
            { label: 'Overview', items: [{ to: '/dev', icon: '📊', text: 'Dashboard' }] },
            {
                label: 'Management', items: [
                    { to: '/dev/districts', icon: '🏛️', text: 'Districts' },
                    { to: '/dev/courts', icon: '⚖️', text: 'Courts' },
                    { to: '/dev/magistrates', icon: '👨‍⚖️', text: 'Judicial Officers' },
                    { to: '/dev/naib-courts', icon: '👤', text: 'Naib Courts' },
                    { to: '/dev/data-tables', icon: '📋', text: 'Data Tables' },
                ],
            },
            {
                label: 'Review', items: [
                    { to: '/dev/grievances', icon: '🎫', text: 'Grievances' },
                    { to: '/dev/reports', icon: '📈', text: 'Reports' },
                ],
            },
        ],
    },
    state_admin: {
        label: 'State Admin',
        sections: [
            { label: 'Overview', items: [{ to: '/state', icon: '📊', text: 'Dashboard' }] },
            {
                label: 'Management', items: [
                    { to: '/state/districts', icon: '🏛️', text: 'Districts' },
                    { to: '/state/courts', icon: '⚖️', text: 'Courts' },
                    { to: '/state/magistrates', icon: '👨‍⚖️', text: 'Judicial Officers' },
                    { to: '/state/naib-courts', icon: '👤', text: 'Naib Courts' },
                ],
            },
            {
                label: 'Review', items: [
                    { to: '/state/alerts', icon: '🔔', text: 'Alerts' },
                    { to: '/state/grievances', icon: '🎫', text: 'Grievances' },
                    { to: '/state/reports', icon: '📈', text: 'Reports' },
                ],
            },
        ],
    },
    district_admin: {
        label: 'District Admin',
        sections: [
            { label: 'Overview', items: [{ to: '/district', icon: '📊', text: 'Dashboard' }] },
            {
                label: 'Management', items: [
                    { to: '/district/courts', icon: '⚖️', text: 'Courts' },
                    { to: '/district/magistrates', icon: '👨‍⚖️', text: 'Judicial Officers' },
                    { to: '/district/naib-courts', icon: '👤', text: 'Naib Courts' },
                ],
            },
            {
                label: 'Data', items: [
                    { to: '/district/data-vetting', icon: '✅', text: 'Data Vetting' },
                    { to: '/district/alerts', icon: '🔔', text: 'Alerts' },
                ],
            },
            {
                label: 'Review', items: [
                    { to: '/district/grievances', icon: '🎫', text: 'Grievances' },
                    { to: '/district/reports', icon: '📈', text: 'Reports' },
                ],
            },
        ],
    },
    naib_court: {
        label: 'Naib Court',
        sections: [
            { label: 'Overview', items: [{ to: '/naib/dashboard', icon: '📊', text: 'Dashboard' }] },
            {
                label: 'Data Entry', items: [
                    { to: '/naib/select-court', icon: '⚖️', text: 'Select Court' },
                    { to: '/naib/entry', icon: '📝', text: 'Data Entry' },
                ],
            },
            {
                label: 'Other', items: [
                    { to: '/naib/grievances', icon: '🎫', text: 'Grievances' },
                    { to: '/naib/reports', icon: '📈', text: 'Reports' },
                ],
            },
        ],
    },
    viewer_district: {
        label: 'District Viewer',
        sections: [
            {
                label: 'Reports', items: [
                    { to: '/viewer', icon: '📊', text: 'Dashboard' },
                    { to: '/viewer/reports', icon: '📈', text: 'Reports' },
                ]
            },
        ],
    },
    viewer_state: {
        label: 'State Viewer',
        sections: [
            {
                label: 'Reports', items: [
                    { to: '/viewer', icon: '📊', text: 'Dashboard' },
                    { to: '/viewer/reports', icon: '📈', text: 'Reports' },
                ]
            },
        ],
    },
};

export default function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    const config = navConfig[user?.role] || navConfig.viewer_district;

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleChangePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            return setPasswordError('New passwords do not match');
        }

        try {
            await api.put('/auth/change-password', {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword
            });
            setPasswordSuccess('Password changed successfully');
            setTimeout(() => {
                setShowChangePassword(false);
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setPasswordSuccess('');
            }, 2000);
        } catch (err) {
            setPasswordError(err.message || 'Failed to change password');
        }
    };

    // Mobile bottom nav: first 4 items across all sections (leaving room for logout)
    const allItems = config.sections.flatMap(s => s.items);
    const bottomItems = allItems.slice(0, 3);

    return (
        <div className="app-layout">
            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-logo">
                    <h2>Court Portal</h2>
                    <span className="role-badge">{config.label}</span>
                </div>

                <nav className="sidebar-nav">
                    {config.sections.map((section) => (
                        <div className="nav-section" key={section.label}>
                            <div className="nav-section-label">{section.label}</div>
                            {section.items.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.to === `/${user?.role === 'developer' ? 'dev' : user?.role?.replace('_', '-')}`}
                                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <span className="icon">{item.icon}</span>
                                    {item.text}
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div style={{ marginBottom: '8px' }}>
                        <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{user?.name}</div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                            {user?.district?.name || 'State Level'}
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button className="btn btn-secondary btn-sm w-full" onClick={() => setShowChangePassword(true)}>
                            🔑 Change Password
                        </button>
                        <button className="btn btn-secondary btn-sm w-full" onClick={handleLogout}>
                            🚪 Logout
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main */}
            <div className="main-content">
                <header className="top-header">
                    <button className="hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        ☰
                    </button>
                    <h1>Haryana Court Data Portal</h1>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                        {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                </header>

                <main className="page-content">
                    <Outlet />
                </main>
            </div>

            {/* Bottom Nav (Mobile) */}
            <nav className="bottom-nav">
                <div className="bottom-nav-items">
                    {bottomItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
                        >
                            <span className="icon">{item.icon}</span>
                            <span>{item.text}</span>
                        </NavLink>
                    ))}
                    <button className="bottom-nav-item" onClick={() => setShowChangePassword(true)}>
                        <span className="icon">🔑</span>
                        <span>Password</span>
                    </button>
                    <button className="bottom-nav-item" onClick={handleLogout}>
                        <span className="icon">🚪</span>
                        <span>Logout</span>
                    </button>
                </div>
            </nav>

            {/* Overlay for mobile sidebar */}
            {sidebarOpen && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }}
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Change Password Modal */}
            {showChangePassword && (
                <div className="modal-backdrop">
                    <div className="modal-content" style={{ maxWidth: 400 }}>
                        <h3 className="mb-lg">Change Password</h3>

                        {passwordError && <div className="form-error mb-md">{passwordError}</div>}
                        {passwordSuccess && <div style={{ color: 'var(--color-success)', padding: '12px', background: 'rgba(34,197,94,0.1)', borderRadius: '4px', marginBottom: '16px' }}>{passwordSuccess}</div>}

                        <form onSubmit={handleChangePasswordSubmit}>
                            <div className="form-group">
                                <label className="form-label">Current Password</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={passwordForm.currentPassword}
                                    onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">New Password</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={passwordForm.newPassword}
                                    onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div className="form-group mb-xl">
                                <label className="form-label">Confirm New Password</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={passwordForm.confirmPassword}
                                    onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div className="flex gap-md justify-end">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowChangePassword(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={!!passwordSuccess}>Update Password</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
