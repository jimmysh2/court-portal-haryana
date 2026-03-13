export default function ViewerDashboard() {
    return (
        <div>
            <div className="page-header"><h2>Reports Dashboard</h2></div>
            <div className="card">
                <div className="card-header"><div className="card-title">Quick Actions</div></div>
                <div className="flex gap-md" style={{ flexWrap: 'wrap' }}>
                    <a className="btn btn-secondary" href="/viewer/reports">View Reports</a>
                    <a className="btn btn-secondary" href="/viewer/change-password">Change Password</a>
                </div>
            </div>
        </div>
    );
}
