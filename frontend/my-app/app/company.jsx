import React, { useState, useEffect } from 'react';
// Import all necessary icons
import { ArrowLeft, Loader2, Building, BarChart as BarChartIcon, PieChart, Plus, Edit, Trash2, X, Link as LinkIcon, DollarSign } from 'lucide-react';
import { useRouter } from 'expo-router';
// Import Chart.js components
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
// Import both Bar and Pie components
import { Bar, Pie } from 'react-chartjs-2';

// Register Chart.js components needed for both charts
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// Helper Function to Generate Years
const generateYears = (startYear = 2020) => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= startYear; year--) {
        // Format as "YYYY-YYYY+1" e.g., "2024-2025"
        years.push(`${year}-${year + 1}`);
    }
    return years;
};

export default function CompanyAnalysis() {
    const router = useRouter();
    const availableYears = generateYears();

    // --- State Variables ---
    const [selectedYear, setSelectedYear] = useState(availableYears[0]);
    const [placementStats, setPlacementStats] = useState([]);
    const [companiesList, setCompaniesList] = useState([]);
    const [isLoadingStats, setIsLoadingStats] = useState(false);
    const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
    const [error, setError] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [chartType, setChartType] = useState('bar'); // 'bar' or 'pie' - Default to bar

    // Modal States
    const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
    const [showEditCompanyModal, setShowEditCompanyModal] = useState(false);
    const [showAddPlacementModal, setShowAddPlacementModal] = useState(false);
    const [editingCompany, setEditingCompany] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState('');

    // Form States
    const [newCompanyName, setNewCompanyName] = useState('');
    const [newCompanyDesc, setNewCompanyDesc] = useState('');
    const [newCompanyWebsite, setNewCompanyWebsite] = useState('');
    const [newCompanyRoles, setNewCompanyRoles] = useState('');
    const [newCompanyLocation, setNewCompanyLocation] = useState('');
    const [newPlacementEmail, setNewPlacementEmail] = useState('');
    const [newPlacementCompany, setNewPlacementCompany] = useState('');
    const [newPlacementYear, setNewPlacementYear] = useState(selectedYear);
    const [newPlacementPackage, setNewPlacementPackage] = useState('');


    // Check user role on mount
    useEffect(() => {
        try {
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
                setUserRole(JSON.parse(storedUser).role);
            }
        } catch (e) { console.error("Failed to parse user data", e); }
    }, []);

    // Fetch data function
    const fetchDataForYear = async (year) => {
        if (!year) return;
        setIsLoadingStats(true);
        setIsLoadingCompanies(true);
        setError(null);
        let statsError = null, companiesError = null;
        try {
            const statsRes = await fetch(`https://placemate-ru7v.onrender.com/api/placements/stats/${year}`);
            if (!statsRes.ok) throw new Error(`Stats Error (${statsRes.status})`);
            setPlacementStats(await statsRes.json());
        } catch (err) { console.error("Stats fetch error:", err); statsError = "Could not load statistics."; setPlacementStats([]); }
        finally { setIsLoadingStats(false); }
        try {
            const companiesRes = await fetch(`https://placemate-ru7v.onrender.com/api/companies/visited/${year}`);
            if (!companiesRes.ok) throw new Error(`Companies Error (${companiesRes.status})`);
            setCompaniesList(await companiesRes.json());
        } catch (err) { console.error("Companies fetch error:", err); companiesError = "Could not load company list."; setCompaniesList([]); }
        finally { setIsLoadingCompanies(false); }
        setError(statsError || companiesError);
    };

    // Fetch data when selectedYear changes
    useEffect(() => {
        fetchDataForYear(selectedYear);
    }, [selectedYear]);

    // Update default placement year when selectedYear changes
    useEffect(() => {
        setNewPlacementYear(selectedYear);
    }, [selectedYear]);

    // --- Admin Action Handlers ---
    const handleAddCompanyClick = () => {
        setNewCompanyName(''); setNewCompanyDesc(''); setNewCompanyWebsite('');
        setNewCompanyRoles(''); setNewCompanyLocation('');
        setModalError(''); setShowAddCompanyModal(true);
    };

    const handleEditCompanyClick = (company) => {
        setEditingCompany(company);
        setNewCompanyName(company.name);
        setNewCompanyDesc(company.description || '');
        setNewCompanyWebsite(company.website || '');
        setNewCompanyRoles(company.rolesOffered ? company.rolesOffered.join(', ') : '');
        setNewCompanyLocation(company.location || '');
        setModalError(''); setShowEditCompanyModal(true);
    };

    const handleDeleteCompany = async (companyId, companyName) => {
        if (!window.confirm(`Are you sure you want to delete "${companyName}" and all its placement records? This cannot be undone.`)) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`https://placemate-ru7v.onrender.com/api/companies/${companyId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) { const data = await res.json(); throw new Error(data.message || 'Delete failed'); }
            alert(`Company "${companyName}" deleted successfully.`);
            fetchDataForYear(selectedYear);
        } catch (err) { alert(`Error: ${err.message}`); console.error(err); }
    };

    const handleAddPlacementClick = () => {
        setNewPlacementEmail(''); setNewPlacementCompany(''); setNewPlacementYear(selectedYear); setNewPlacementPackage('');
        setModalError(''); setShowAddPlacementModal(true);
    };

    // --- Modal Submit Handlers ---
    const handleSaveCompany = async (isEditing = false) => {
        setModalLoading(true); setModalError('');
        const token = localStorage.getItem('token');
        const url = isEditing ? `/api/companies/${editingCompany._id}` : '/api/companies';
        const method = isEditing ? 'PUT' : 'POST';
        const rolesArray = newCompanyRoles.split(',').map(role => role.trim()).filter(role => role);

        try {
            const res = await fetch(`https://placemate-ru7v.onrender.com${url}`, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ name: newCompanyName, description: newCompanyDesc, website: newCompanyWebsite, rolesOffered: rolesArray, location: newCompanyLocation })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || (isEditing ? 'Update failed' : 'Add failed'));
            alert(`Company ${isEditing ? 'updated' : 'added'} successfully!`);
            setShowAddCompanyModal(false); setShowEditCompanyModal(false); setEditingCompany(null);
            fetchDataForYear(selectedYear);
        } catch (err) { setModalError(err.message); console.error(err); }
        finally { setModalLoading(false); }
    };

    const handleSavePlacement = async () => {
         setModalLoading(true); setModalError('');
        const token = localStorage.getItem('token');
        try {
             const res = await fetch(`https://placemate-ru7v.onrender.com/api/placements`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ studentEmail: newPlacementEmail, companyName: newPlacementCompany, year: newPlacementYear, packageLPA: newPlacementPackage || undefined })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to add placement record.');
            alert(`Placement record added successfully!`);
            setShowAddPlacementModal(false);
            fetchDataForYear(selectedYear);
        } catch (err) { setModalError(err.message); console.error(err); }
        finally { setModalLoading(false); }
    };


    // --- Chart Data & Options ---
    const chartData = {
        labels: placementStats.map(stat => stat.companyName),
        datasets: [{
            label: '# of Students Placed', data: placementStats.map(stat => stat.count),
            backgroundColor: ['rgba(75, 192, 192, 0.6)','rgba(255, 99, 132, 0.6)','rgba(54, 162, 235, 0.6)','rgba(255, 206, 86, 0.6)','rgba(153, 102, 255, 0.6)','rgba(255, 159, 64, 0.6)', /* ... more colors ... */ ],
            borderColor: ['rgba(75, 192, 192, 1)','rgba(255, 99, 132, 1)','rgba(54, 162, 235, 1)','rgba(255, 206, 86, 1)','rgba(153, 102, 255, 1)','rgba(255, 159, 64, 1)', /* ... more colors ... */ ],
            borderWidth: 1,
        }],
    };
    const barChartOptions = {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false, }, title: { display: true, text: `Placements by Company (${selectedYear})`, font: { size: 16 } },
            tooltip: { callbacks: { label: function(context) { let label = context.dataset.label || ''; if (label) { label += ': '; } if (context.parsed.y !== null) { label += context.parsed.y; } return label; } } }
        },
        scales: { x: { title: { display: false } }, y: { beginAtZero: true, title: { display: true, text: 'Number of Students Placed' } } }
    };
    const pieChartOptions = {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'top', }, title: { display: true, text: `Placement Distribution (${selectedYear})`, font: { size: 16 } },
            tooltip: { callbacks: { label: function(context) { let label = context.label || ''; if (label) { label += ': '; } let value = context.parsed || 0; label += value; return label; } } }
        },
    };

    // --- Render Functions ---
    const renderChart = () => {
    if (isLoadingStats) return <div className="info-text"><Loader2 size={20} className="spinner"/> Loading Chart...</div>;
    if (!isLoadingStats && placementStats.length === 0) return <div className="info-text">No placement data available for {selectedYear}.</div>;
    return (
      <>
        <div className="chart-toggle">
          <button onClick={() => setChartType('bar')} className={chartType === 'bar' ? 'active' : ''}> <BarChartIcon size={16} /> Bar Chart </button>
          <button onClick={() => setChartType('pie')} className={chartType === 'pie' ? 'active' : ''}> <PieChart size={16} /> Pie Chart </button>
        </div>
        <div className="chart-container">
          {chartType === 'bar' ? ( <Bar data={chartData} options={barChartOptions} /> ) : ( <Pie data={chartData} options={pieChartOptions} /> )}
        </div>
        <div className="chart-summary-table">
          <h4>Placement Summary ({selectedYear})</h4>
          <table>
           <thead>
  <tr>{/* NO space/newline after opening tag */}
    <th>Company</th>
    <th>Students Placed</th>
  </tr>{/* NO space/newline before closing tag */}
</thead>
            <tbody>{/* No whitespace here */}{placementStats.map((stat) => (
              <tr key={stat.companyId || stat.companyName}>
                <td>{stat.companyName}</td>
                <td>{stat.count}</td>
              </tr>
            ))}</tbody>{/* No whitespace here */}
          </table>
        </div>
      </>
    );
  };

    const renderCompanyList = () => {
        if (isLoadingCompanies) return <div className="info-text"><Loader2 size={20} className="spinner"/> Loading Companies...</div>;
        if (!isLoadingCompanies && companiesList.length === 0) return <div className="info-text">No companies recorded for {selectedYear}.</div>;
        return (
            <div className="company-list">
                {companiesList.map(company => (
                    <div key={company._id} className="company-card">
                        <div className="company-header">
                            {company.logoUrl && <img src={company.logoUrl} alt={`${company.name} logo`} className="company-logo"/>}
                            <h3 className="company-name">{company.name}</h3>
                             {userRole === 'admin' && (
                                <div className="admin-actions">
                                    <button className="admin-btn edit-btn" title="Edit Company" onClick={() => handleEditCompanyClick(company)}> <Edit size={14}/> </button>
                                    <button className="admin-btn delete-btn" title="Delete Company" onClick={() => handleDeleteCompany(company._id, company.name)}> <Trash2 size={14}/> </button>
                                </div>
                             )}
                        </div>
                        {/* <p className="company-desc">{company.description || 'No description available.'}</p> */}
                        <div className="company-details">
                            {company.location && <p><strong>Location:</strong> {company.location}</p>}
                            {company.rolesOffered && company.rolesOffered.length > 0 && <p><strong>Roles Offered:</strong> {company.rolesOffered.join(', ')}</p>}
                            {company.website && <a href={company.website} target="_blank" rel="noopener noreferrer" className="company-website"><LinkIcon size={14} style={{verticalAlign:'middle', marginRight:'4px'}}/>Visit Website</a>}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <>
            <style>{`
                /* --- Styles --- */
                body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafe; }
                .page-container { display: flex; flex-direction: column; min-height: 100vh; overflow-y: auto; }
                .header-container { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; background-color: #fff; border-bottom: 1px solid #e5e7eb; }
                .header-left { display: flex; align-items: center; gap: 1rem; }
                .back-button { padding: 0.5rem; background-color: #eef2ff; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; }
                .header-title { font-size: 1.75rem; font-weight: 700; color: #111827; margin: 0; }
                .main-content { padding: 2rem 1.5rem; max-width: 1000px; margin: 0 auto; width: 100%; box-sizing: border-box; }
                .admin-controls-container { display: flex; justify-content: center; gap: 1rem; margin-bottom: 1.5rem; }
                .admin-add-button { display: inline-flex; align-items: center; gap: 0.5rem; background-color: #4f46e5; color: white; border: none; padding: 0.6rem 1.25rem; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.95rem; }
                .admin-add-button:hover { background-color: #4338ca; }
                .controls-container { display: flex; justify-content: center; align-items: center; gap: 1rem; margin-bottom: 2rem; }
                .controls-container label { font-weight: 500; }
                .year-select { padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 1rem; }
                .chart-section { margin-bottom: 3rem; background-color: #fff; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e5e7eb;}
                .chart-toggle { display: flex; justify-content: center; gap: 0.5rem; margin-bottom: 1.5rem; }
                .chart-toggle button { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border: 1px solid #d1d5db; background-color: #fff; color: #4b5563; border-radius: 6px; cursor: pointer; font-size: 0.9rem; font-weight: 500; transition: background-color 0.2s, color 0.2s, border-color 0.2s; }
                .chart-toggle button:hover { background-color: #f3f4f6; }
                .chart-toggle button.active { background-color: #eef2ff; color: #4f46e5; border-color: #a5b4fc; }
                .chart-container { position: relative; height: 400px; width: 100%; max-width: 700px; margin: 0 auto; }
                .chart-summary-table { margin-top: 2rem; border-top: 1px solid #e5e7eb; padding-top: 1.5rem; }
                .chart-summary-table h4 { text-align: center; margin: 0 0 1rem 0; font-weight: 600; color: #374151; }
                .chart-summary-table table { width: 100%; max-width: 500px; margin: 0 auto; border-collapse: collapse; font-size: 0.9rem; }
                .chart-summary-table th, .chart-summary-table td { padding: 0.6rem 0.8rem; text-align: left; border-bottom: 1px solid #f3f4f6; }
                .chart-summary-table th { font-weight: 600; color: #6b7280; background-color: #f9fafb; }
                .chart-summary-table tr:last-child td { border-bottom: none; }
                .chart-summary-table td:last-child { text-align: right; font-weight: 500; }
                .list-header { font-size: 1.5rem; font-weight: 600; color: #1f2937; margin-bottom: 1.5rem; text-align: center; }
                .company-list { display: flex; flex-direction: column; gap: 1.5rem; }
                .company-card { background-color: #fff; border-radius: 8px; border: 1px solid #e5e7eb; padding: 1.5rem; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
                .company-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap;}
                .company-logo { width: 40px; height: 40px; object-fit: contain; border-radius: 4px; }
                .company-name { font-size: 1.25rem; font-weight: 600; color: #111827; margin: 0; flex-grow: 1; }
                .company-desc { color: #4b5563; margin: 0 0 1rem 0; line-height: 1.6; font-size: 0.95rem;}
                .company-details p { margin: 0.5rem 0; font-size: 0.9rem; color: #374151; }
                .company-details strong { color: #111827; }
                .company-website { color: #4f46e5; text-decoration: none; font-weight: 500; font-size: 0.9rem;}
                .company-website:hover { text-decoration: underline; }
                .admin-actions { display: flex; gap: 0.5rem; margin-left: auto; }
                .admin-btn { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; border: none; cursor: pointer; }
                .edit-btn { background-color: #eef2ff; color: #4338ca; }
                .delete-btn { background-color: #fee2e2; color: #991b1b; }
                .info-text, .error-text { text-align: center; color: #6b7280; padding: 2rem; font-style: italic; display: flex; align-items: center; justify-content: center; gap: 0.5rem;}
                .error-text { text-align: center; color: #ef4444; font-weight: 500; padding: 2rem; }
                .spinner { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .modal-overlay { position: fixed; inset: 0; background-color: rgba(0, 0, 0, 0.6); display: flex; justify-content: center; align-items: center; z-index: 200; padding: 1rem; }
                .modal-box { background-color: #fff; border-radius: 0.75rem; padding: 1.5rem 2rem 2rem 2rem; width: 100%; max-width: 36rem; max-height: 90vh; overflow-y: auto; }
                .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid #e5e7eb; padding-bottom: 1rem;}
                .modal-title { font-size: 1.25rem; font-weight: 600; margin: 0;}
                .modal-close-btn { background: #f3f4f6; border: none; border-radius: 50%; padding: 0.5rem; display: flex; cursor: pointer; }
                .form-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
                @media (min-width: 640px) { .form-grid { grid-template-columns: repeat(2, 1fr); } }
                .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
                .form-label { font-weight: 500; font-size: 0.9rem; color: #374151; }
                .form-input, .form-textarea, .form-select { width: 100%; box-sizing: border-box; border: 1px solid #d1d5db; border-radius: 8px; padding: 0.75rem; font-size: 1rem; }
                .form-textarea { min-height: 80px; resize: vertical; }
                .modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 2rem; border-top: 1px solid #e5e7eb; padding-top: 1.5rem; }
                .button-cancel { background-color: #f3f4f6; border: 1px solid #d1d5db; color: #1f2937; padding: 0.6rem 1rem; border-radius: 8px; font-weight: 600; cursor: pointer;}
                .button-confirm { background-color: #4f46e5; color: #fff; padding: 0.6rem 1rem; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; display: inline-flex; align-items: center; gap: 0.5rem;}
                .button-confirm:disabled { background-color: #a5b4fc; cursor: not-allowed; }
                .modal-error { color: #ef4444; font-size: 0.9rem; text-align: center; margin-top: 1rem; }

                
            `}</style>

            <div className="page-container">
                <header className="header-container">
                     <div className="header-left"> 
                        <button onClick={() => {
                                // Check if router can go back
                                if (router.canGoBack()) {
                                    router.back(); // Go back if possible
                                } else {
                                    router.push('/home'); // Go to home if not
                                }
                            }} className="back-button" title="Back"> <ArrowLeft size={24} color="#4f46e5" /> </button> <h1 className="header-title">Company Analysis</h1> </div>
                </header>

                <main className="main-content">
                    {userRole === 'admin' && (
                        <div className="admin-controls-container">
                            <button className="admin-add-button" onClick={handleAddCompanyClick}> <Building size={16}/> Add Company </button>
                             <button className="admin-add-button" onClick={handleAddPlacementClick}> <Plus size={16}/> Add Placement Record </button>
                        </div>
                    )}

                    <div className="controls-container"> <label htmlFor="year-select">Select Year:</label> <select id="year-select" className="year-select" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}> {availableYears.map(year => ( <option key={year} value={year}>{year}</option> ))} </select> </div>
                    {error && <p className="error-text">{error}</p>}
                    <section className="chart-section"> {renderChart()} </section>
                    <h2 className="list-header">Companies Visited in {selectedYear}</h2>
                    <section className="company-list-container"> {renderCompanyList()} </section>
                </main>
            </div>

            {/* --- Modals --- */}
            {/* Add Company Modal */}
            {showAddCompanyModal && (
                <div className="modal-overlay" onClick={() => setShowAddCompanyModal(false)}>
                    <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                         <div className="modal-header"> <h2 className="modal-title">Add New Company</h2> <button className="modal-close-btn" onClick={() => setShowAddCompanyModal(false)}><X size={20} /></button> </div>
                         <form onSubmit={(e) => { e.preventDefault(); handleSaveCompany(false); }}>
                            <div className="form-grid">
                               <div className="form-group" style={{ gridColumn: 'span 2'}}> <label htmlFor="add-comp-name" className="form-label">Company Name *</label> <input type="text" id="add-comp-name" className="form-input" value={newCompanyName} onChange={(e) => setNewCompanyName(e.target.value)} required /> </div>
                               <div className="form-group" style={{ gridColumn: 'span 2'}}> <label htmlFor="add-comp-desc" className="form-label">Description</label> <textarea id="add-comp-desc" className="form-textarea" value={newCompanyDesc} onChange={(e) => setNewCompanyDesc(e.target.value)} /> </div>
                               <div className="form-group"> <label htmlFor="add-comp-web" className="form-label">Website</label> <input type="url" id="add-comp-web" className="form-input" value={newCompanyWebsite} onChange={(e) => setNewCompanyWebsite(e.target.value)} placeholder="https://..."/> </div>
                               <div className="form-group"> <label htmlFor="add-comp-loc" className="form-label">Location</label> <input type="text" id="add-comp-loc" className="form-input" value={newCompanyLocation} onChange={(e) => setNewCompanyLocation(e.target.value)} /> </div>
                               <div className="form-group" style={{ gridColumn: 'span 2'}}> <label htmlFor="add-comp-roles" className="form-label">Roles Offered (comma-separated)</label> <input type="text" id="add-comp-roles" className="form-input" value={newCompanyRoles} onChange={(e) => setNewCompanyRoles(e.target.value)} placeholder="e.g., SDE, Analyst, Manager"/> </div>
                            </div>
                            {modalError && <p className="modal-error">{modalError}</p>}
                            <div className="modal-actions"> <button type="button" className="button-cancel" onClick={() => setShowAddCompanyModal(false)}>Cancel</button> <button type="submit" className="button-confirm" disabled={modalLoading}>{modalLoading ? <Loader2 size={18} className="spinner"/> : 'Add Company'}</button> </div>
                         </form>
                    </div>
                </div>
            )}

             {/* Edit Company Modal */}
            {showEditCompanyModal && editingCompany && (
                <div className="modal-overlay" onClick={() => {setShowEditCompanyModal(false); setEditingCompany(null);}}>
                    <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                         <div className="modal-header"> <h2 className="modal-title">Edit Company: {editingCompany.name}</h2> <button className="modal-close-btn" onClick={() => {setShowEditCompanyModal(false); setEditingCompany(null);}}><X size={20} /></button> </div>
                         <form onSubmit={(e) => { e.preventDefault(); handleSaveCompany(true); }}>
                             <div className="form-grid">
                               <div className="form-group" style={{ gridColumn: 'span 2'}}> <label htmlFor="edit-comp-name" className="form-label">Company Name *</label> <input type="text" id="edit-comp-name" className="form-input" value={newCompanyName} onChange={(e) => setNewCompanyName(e.target.value)} required /> </div>
                               <div className="form-group" style={{ gridColumn: 'span 2'}}> <label htmlFor="edit-comp-desc" className="form-label">Description</label> <textarea id="edit-comp-desc" className="form-textarea" value={newCompanyDesc} onChange={(e) => setNewCompanyDesc(e.target.value)} /> </div>
                               <div className="form-group"> <label htmlFor="edit-comp-web" className="form-label">Website</label> <input type="url" id="edit-comp-web" className="form-input" value={newCompanyWebsite} onChange={(e) => setNewCompanyWebsite(e.target.value)} placeholder="https://..."/> </div>
                               <div className="form-group"> <label htmlFor="edit-comp-loc" className="form-label">Location</label> <input type="text" id="edit-comp-loc" className="form-input" value={newCompanyLocation} onChange={(e) => setNewCompanyLocation(e.target.value)} /> </div>
                               <div className="form-group" style={{ gridColumn: 'span 2'}}> <label htmlFor="edit-comp-roles" className="form-label">Roles Offered (comma-separated)</label> <input type="text" id="edit-comp-roles" className="form-input" value={newCompanyRoles} onChange={(e) => setNewCompanyRoles(e.target.value)} placeholder="e.g., SDE, Analyst, Manager"/> </div>
                             </div>
                            {modalError && <p className="modal-error">{modalError}</p>}
                            <div className="modal-actions"> <button type="button" className="button-cancel" onClick={() => {setShowEditCompanyModal(false); setEditingCompany(null);}}>Cancel</button> <button type="submit" className="button-confirm" disabled={modalLoading}>{modalLoading ? <Loader2 size={18} className="spinner"/> : 'Save Changes'}</button> </div>
                         </form>
                    </div>
                </div>
            )}

            {/* Add Placement Modal */}
            {showAddPlacementModal && (
                 <div className="modal-overlay" onClick={() => setShowAddPlacementModal(false)}>
                    <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                         <div className="modal-header"> <h2 className="modal-title">Add Placement Record</h2> <button className="modal-close-btn" onClick={() => setShowAddPlacementModal(false)}><X size={20} /></button> </div>
                         <form onSubmit={(e) => { e.preventDefault(); handleSavePlacement(); }}>
                            <div className="form-grid">
                               <div className="form-group"> <label htmlFor="add-place-email" className="form-label">Student Email *</label> <input type="email" id="add-place-email" className="form-input" value={newPlacementEmail} onChange={(e) => setNewPlacementEmail(e.target.value)} required placeholder="student@example.com"/> </div>
                               <div className="form-group"> <label htmlFor="add-place-comp" className="form-label">Company Name *</label> <input type="text" id="add-place-comp" className="form-input" value={newPlacementCompany} onChange={(e) => setNewPlacementCompany(e.target.value)} required placeholder="Enter exact company name"/> </div>
                               <div className="form-group"> <label htmlFor="add-place-year" className="form-label">Placement Year *</label> <select id="add-place-year" className="form-select" value={newPlacementYear} onChange={(e) => setNewPlacementYear(e.target.value)} required> {availableYears.map(year => ( <option key={year} value={year}>{year}</option> ))} </select> </div>
                               <div className="form-group"> <label htmlFor="add-place-pkg" className="form-label">Package (LPA)</label> <input type="number" id="add-place-pkg" className="form-input" value={newPlacementPackage} onChange={(e) => setNewPlacementPackage(e.target.value)} min="0" step="0.01" placeholder="e.g., 12.5"/> </div>
                            </div>
                            {modalError && <p className="modal-error">{modalError}</p>}
                            <div className="modal-actions"> <button type="button" className="button-cancel" onClick={() => setShowAddPlacementModal(false)}>Cancel</button> <button type="submit" className="button-confirm" disabled={modalLoading}>{modalLoading ? <Loader2 size={18} className="spinner"/> : 'Add Record'}</button> </div>
                         </form>
                    </div>
                </div>
            )}
        </>
    );
}