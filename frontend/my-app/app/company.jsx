import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Alert,
  Linking,
  Dimensions, 
  Platform, // 👈 ADD THIS
  StatusBar,
} from 'react-native';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  X,
  Link as LinkIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  PackageX,
  Building,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { BarChart, PieChart } from "react-native-chart-kit"; 

// Define screen width once for responsive charts
const screenWidth = Dimensions.get("window").width * 0.90; 
const chartInnerWidth = screenWidth - 48;

// Helper Function to Generate Years (Unchanged)
const generateYears = (startYear = 2020) => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = currentYear; year >= startYear; year--) {
    years.push(`${year}-${year + 1}`);
  }
  return years;
};

// --- Main Component ---
export default function CompanyAnalysis() {
  const router = useRouter();
  const availableYears = generateYears();

  const [selectedYear, setSelectedYear] = useState(availableYears[0]);
  const [placementStats, setPlacementStats] = useState([]);
  const [companiesList, setCompaniesList] = useState([]);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [chartType, setChartType] = useState('bar'); 

  const [showYearModal, setShowYearModal] = useState(false);
  const [tempSelectedYear, setTempSelectedYear] = useState(selectedYear);

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
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          setUserRole(JSON.parse(storedUser).role);
        }
      } catch (e) { console.error("Failed to parse user data", e); }
    };
    loadUser();
  }, []);

  // Fetch data function (Unchanged)
  const fetchDataForYear = async (year) => {
    if (!year) return;
    setIsLoadingStats(true);
    setIsLoadingCompanies(true);
    setError(null);
    let statsError = null, companiesError = null;
    const token = await AsyncStorage.getItem("token");

    // Fetch Stats
    try {
      const statsRes = await fetch(`https://placemate-ru7v.onrender.com/api/placements/stats/${year}`);
      if (!statsRes.ok) throw new Error(`Stats Error (${statsRes.status})`);
      setPlacementStats(await statsRes.json());
    } catch (err) { console.error("Stats fetch error:", err); statsError = "Could not load statistics."; setPlacementStats([]); }
    finally { setIsLoadingStats(false); }

    // Fetch Companies
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

  // --- Admin Action Handlers (Unchanged) ---
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

  const handleDeleteCompany = (companyId, companyName) => {
    Alert.alert(
      "Confirm Deletion",
      `Are you sure you want to delete "${companyName}" and all its placement records? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const token = await AsyncStorage.getItem('token');
            try {
              const res = await fetch(`https://placemate-ru7v.onrender.com/api/companies/${companyId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (!res.ok) { const data = await res.json(); throw new Error(data.message || 'Delete failed'); }
              Alert.alert('Success', `Company "${companyName}" deleted successfully.`);
              fetchDataForYear(selectedYear);
            } catch (err) { Alert.alert('Error', `Error: ${err.message}`); console.error(err); }
          }
        }
      ]
    );
  };

  const handleAddPlacementClick = () => {
    setNewPlacementEmail(''); setNewPlacementCompany(''); setNewPlacementYear(selectedYear); setNewPlacementPackage('');
    setModalError(''); setShowAddPlacementModal(true);
  };

  // --- Modal Submit Handlers (Unchanged) ---
  const handleSaveCompany = async (isEditing = false) => {
    setModalLoading(true); setModalError('');
    const token = await AsyncStorage.getItem('token');
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
      Alert.alert('Success', `Company ${isEditing ? 'updated' : 'added'} successfully!`);
      setShowAddCompanyModal(false); setShowEditCompanyModal(false); setEditingCompany(null);
      fetchDataForYear(selectedYear);
    } catch (err) { setModalError(err.message); console.error(err); }
    finally { setModalLoading(false); }
  };

  const handleSavePlacement = async () => {
    setModalLoading(true); setModalError('');
    const token = await AsyncStorage.getItem('token');
    try {
      const res = await fetch(`https://placemate-ru7v.onrender.com/api/placements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ studentEmail: newPlacementEmail, companyName: newPlacementCompany, year: newPlacementYear, packageLPA: newPlacementPackage || undefined })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add placement record.');
      Alert.alert('Success', `Placement record added successfully!`);
      setShowAddPlacementModal(false);
      fetchDataForYear(selectedYear);
    } catch (err) { setModalError(err.message); console.error(err); }
    finally { setModalLoading(false); }
  };

  // --- Chart Renderer with react-native-chart-kit (Functional Native Charts) ---
  const renderChart = () => {
    if (isLoadingStats) return <View style={styles.infoContainer}><ActivityIndicator size="large" color="#4f46e5" /><Text style={styles.infoText}>Loading Chart...</Text></View>;
    if (!isLoadingStats && placementStats.length === 0) return (
      <View style={styles.chartPlaceholderContainer}>
        <Text style={styles.infoText}>No placement data available for {selectedYear}.</Text>
      </View>
    );

    // Prepare data for the native chart-kit library
  const barData = {
        // --- MODIFIED LINE HERE ---
        labels: placementStats.map(stat => {
            const name = stat.companyName;
            // Truncate name if longer than 10 characters and append '...'
            return name.length > 10 ? name.substring(0, 9) + '...' : name; 
        }),
        // --------------------------
        datasets: [{ data: placementStats.map(stat => stat.count) }],
    };
    
  const pieData = placementStats.map((stat, index) => ({
        // --- MODIFIED LINE HERE ---
        name: stat.companyName.length > 10 
              ? stat.companyName.substring(0, 9) + '...' 
              : stat.companyName, 
        // --------------------------
        count: stat.count,
        legendFontColor: '#7F7F7F',
        legendFontSize: 14,
        color: `hsl(${index * 50}, 70%, 50%)`, // Dynamic colors
    }));

    // Configuration for the chart appearance
    const chartConfig = {
        backgroundColor: '#ffffff',
        backgroundGradientFrom: '#ffffff',
        backgroundGradientTo: '#ffffff',
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        propsForLabels: { fontSize: 10, fill: '#6b7280' },
    };

    return (
      <View style={styles.chartVisualizerContainer}>
        <Text style={styles.chartVisualizerTitle}>
          Placements by Company ({selectedYear})
        </Text>
        <View style={styles.chartToggle}>
          <Pressable onPress={() => setChartType('bar')} style={[styles.chartToggleButton, chartType === 'bar' && styles.chartToggleButtonActive]}> <BarChartIcon size={16} color={chartType === 'bar' ? '#4f46e5' : '#4b5563'} /> <Text style={[styles.chartToggleButtonText, chartType === 'bar' && styles.chartToggleButtonActiveText]}>Bar Chart</Text> </Pressable>
          <Pressable onPress={() => setChartType('pie')} style={[styles.chartToggleButton, chartType === 'pie' && styles.chartToggleButtonActive]}> <PieChartIcon size={16} color={chartType === 'pie' ? '#4f46e5' : '#4b5563'} /> <Text style={[styles.chartToggleButtonText, chartType === 'pie' && styles.chartToggleButtonActiveText]}>Pie Chart</Text> </Pressable>
        </View>

        <View style={styles.chartContainer}>
          {chartType === 'bar' ? (
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={true} 
                // Set ScrollView width to the calculated inner width
                style={{ width: chartInnerWidth, alignSelf: 'center' }} 
            >
                <BarChart
                    data={barData}
                    // Calculate a dynamic width. Use screenWidth for total size.
                    width={chartInnerWidth + Math.max(0, placementStats.length - 5) * 60}
                    height={300}
                    fromZero={true}
                    chartConfig={chartConfig}
                    style={{ borderRadius: 12 }}
                    verticalLabelRotation={30}
                />
            </ScrollView>
          ) : (
            <PieChart
                data={pieData}
                width={screenWidth}
                height={280}
                chartConfig={chartConfig}
                accessor={"count"} 
                backgroundColor={"transparent"}
                // Updated paddingLeft to visually center the chart after removing the legend
                paddingLeft={(screenWidth / 2 - 140).toString()} 
                center={[0, 0]} // Resetting center coordinates for better alignment
                absolute 
                style={{ marginVertical: 8, borderRadius: 12 }}
            />
          )}
        </View>
        
        {/*
          NOTE: The legend for the Pie Chart/Bar Chart Labeling has been removed
          as requested, to maximize space for the chart itself.
        */}
        {chartType === 'bar' && (
            <View style={styles.chartLegend}>
              {placementStats.map((stat, index) => (
                <View key={stat._id || index} style={styles.legendItem}>
                  <View style={[styles.legendColorBox, { backgroundColor: `hsl(${index * 50}, 70%, 50%)` }]} />
                  <Text style={styles.legendText}>{stat.companyName} ({stat.count})</Text>
                </View>
              ))}
            </View>
        )}
      </View>
    );
  };

  // --- Company List Renderer (Now local function) ---
  const renderCompanyList = () => {
    if (isLoadingCompanies) {
        return (
            <View style={styles.infoContainer}>
                <ActivityIndicator size="large" color="#4f46e5" />
                <Text style={styles.infoText}>Loading Companies...</Text>
            </View>
        );
    }
    if (companiesList.length === 0) {
        return (
            <View style={styles.emptyState}>
                <PackageX size={40} color="#6b7280" />
                <Text style={styles.emptyTitle}>No Companies Recorded</Text>
                <Text style={styles.emptySubtitle}>No companies visited in the {selectedYear} cycle.</Text>
            </View>
        );
    }

    // ListRenderer definition relies on local state access
    const ListRenderer = ({ companies, userRole, handleEdit, handleDelete }) => (
        <View style={styles.companyList}>
            {companies.map(company => (
                <View key={company._id} style={styles.companyCard}>
                    <View style={styles.companyHeader}>
                        <Text style={styles.companyName}>{company.name}</Text>
                        {userRole === 'admin' && (
                            <View style={styles.adminActions}>
                                <Pressable style={[styles.adminBtn, styles.editBtn]} title="Edit Company" onPress={() => handleEdit(company)}> <Edit size={14} color="#4338ca"/> </Pressable>
                                <Pressable style={[styles.adminBtn, styles.deleteBtn]} title="Delete Company" onPress={() => handleDelete(company._id, company.name)}> <Trash2 size={14} color="#991b1b"/> </Pressable>
                            </View>
                        )}
                    </View>
                    <View style={styles.companyDetails}>
                        {company.location && <Text style={styles.companyDetailText}>
                            <Text style={styles.companyDetailStrong}>Location:</Text> {company.location}
                        </Text>}
                        {company.rolesOffered && company.rolesOffered.length > 0 && <Text style={styles.companyDetailText}>
                            <Text style={styles.companyDetailStrong}>Roles Offered:</Text> {company.rolesOffered.join(', ')}
                        </Text>}
                        {company.website && (
                            <Pressable onPress={() => Linking.openURL(company.website)}>
                                <Text style={styles.companyWebsite}>
                                    <LinkIcon size={14} color="#4f46e5" /> Visit Website
                                </Text>
                            </Pressable>
                        )}
                    </View>
                </View>
            ))}
        </View>
    );

    return (
        <ListRenderer
            companies={companiesList}
            userRole={userRole}
            handleEdit={handleEditCompanyClick}
            handleDelete={handleDeleteCompany}
        />
    );
  };

  // --- MODAL FORM RENDERERS ---

  const renderAddCompanyModal = () => (
    <Modal visible={showAddCompanyModal} transparent animationType="slide" onRequestClose={() => setShowAddCompanyModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <View style={styles.modalHeader}> 
            <Text style={styles.modalTitle}>Add New Company</Text> 
            <Pressable style={styles.modalCloseBtn} onPress={() => setShowAddCompanyModal(false)}><X size={20} /></Pressable> 
          </View>
          <ScrollView style={styles.modalScrollView}>
            <View style={styles.formGrid}>
              <View style={styles.formGroup}> <Text style={styles.formLabel}>Company Name *</Text> <TextInput style={styles.formInput} value={newCompanyName} onChangeText={setNewCompanyName} required /> </View>
              <View style={styles.formGroup}> <Text style={styles.formLabel}>Website</Text> <TextInput style={styles.formInput} value={newCompanyWebsite} onChangeText={setNewCompanyWebsite} placeholder="https://..." keyboardType="url" /> </View>
              <View style={styles.formGroupFull}> <Text style={styles.formLabel}>Description</Text> <TextInput style={styles.formTextarea} value={newCompanyDesc} onChangeText={setNewCompanyDesc} multiline numberOfLines={3} /> </View>
              <View style={styles.formGroup}> <Text style={styles.formLabel}>Location</Text> <TextInput style={styles.formInput} value={newCompanyLocation} onChangeText={setNewCompanyLocation} /> </View>
              <View style={styles.formGroupFull}> <Text style={styles.formLabel}>Roles Offered (comma-separated)</Text> <TextInput style={styles.formInput} value={newCompanyRoles} onChangeText={setNewCompanyRoles} placeholder="e.g., SDE, Analyst, Manager" /> </View>
            </View>
            {modalError && <Text style={styles.modalError}>{modalError}</Text>}
          </ScrollView>
          <View style={styles.modalActions}> 
            <Pressable style={styles.buttonCancel} onPress={() => setShowAddCompanyModal(false)}><Text style={styles.buttonCancelText}>Cancel</Text></Pressable> 
            <Pressable style={styles.buttonConfirm} onPress={() => handleSaveCompany(false)} disabled={modalLoading}>
              {modalLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.buttonConfirmText}>Add Company</Text>}
            </Pressable> 
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderEditCompanyModal = () => (
    <Modal visible={showEditCompanyModal} transparent animationType="slide" onRequestClose={() => {setShowEditCompanyModal(false); setEditingCompany(null);}}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <View style={styles.modalHeader}> 
            <Text style={styles.modalTitle}>Edit Company: {editingCompany?.name}</Text> 
            <Pressable style={styles.modalCloseBtn} onPress={() => {setShowEditCompanyModal(false); setEditingCompany(null);}}><X size={20} /></Pressable> 
          </View>
          <ScrollView style={styles.modalScrollView}>
            <View style={styles.formGrid}>
              <View style={styles.formGroup}> <Text style={styles.formLabel}>Company Name *</Text> <TextInput style={styles.formInput} value={newCompanyName} onChangeText={setNewCompanyName} required /> </View>
              <View style={styles.formGroup}> <Text style={styles.formLabel}>Website</Text> <TextInput style={styles.formInput} value={newCompanyWebsite} onChangeText={setNewCompanyWebsite} placeholder="https://..." keyboardType="url" /> </View>
              <View style={styles.formGroupFull}> <Text style={styles.formLabel}>Description</Text> <TextInput style={styles.formTextarea} value={newCompanyDesc} onChangeText={setNewCompanyDesc} multiline numberOfLines={3} /> </View>
              <View style={styles.formGroup}> <Text style={styles.formLabel}>Location</Text> <TextInput style={styles.formInput} value={newCompanyLocation} onChangeText={setNewCompanyLocation} /> </View>
              <View style={styles.formGroupFull}> <Text style={styles.formLabel}>Roles Offered (comma-separated)</Text> <TextInput style={styles.formInput} value={newCompanyRoles} onChangeText={setNewCompanyRoles} placeholder="e.g., SDE, Analyst, Manager" /> </View>
            </View>
            {modalError && <Text style={styles.modalError}>{modalError}</Text>}
          </ScrollView>
          <View style={styles.modalActions}> 
            <Pressable style={styles.buttonCancel} onPress={() => {setShowEditCompanyModal(false); setEditingCompany(null);}}><Text style={styles.buttonCancelText}>Cancel</Text></Pressable> 
            <Pressable style={styles.buttonConfirm} onPress={() => handleSaveCompany(true)} disabled={modalLoading}>
              {modalLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.buttonConfirmText}>Save Changes</Text>}
            </Pressable> 
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderAddPlacementModal = () => (
    <Modal visible={showAddPlacementModal} transparent animationType="slide" onRequestClose={() => setShowAddPlacementModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <View style={styles.modalHeader}> 
            <Text style={styles.modalTitle}>Add Placement Record</Text> 
            <Pressable style={styles.modalCloseBtn} onPress={() => setShowAddPlacementModal(false)}><X size={20} /></Pressable> 
          </View>
          <ScrollView style={styles.modalScrollView}>
            <View style={styles.formGrid}>
              <View style={styles.formGroup}> <Text style={styles.formLabel}>Student Email *</Text> <TextInput style={styles.formInput} value={newPlacementEmail} onChangeText={setNewPlacementEmail} required placeholder="student@example.com" keyboardType="email-address" /> </View>
              <View style={styles.formGroup}> <Text style={styles.formLabel}>Company Name *</Text> <TextInput style={styles.formInput} value={newPlacementCompany} onChangeText={setNewPlacementCompany} required placeholder="Enter exact company name" /> </View>
              <View style={styles.formGroup}> <Text style={styles.formLabel}>Placement Year *</Text> 
                {/* <View style={styles.pickerWrapper}> */}
                 <Picker 
                selectedValue={newPlacementYear} 
                onValueChange={setNewPlacementYear}
                style={[styles.formPicker, styles.pickerWithoutWrapper]}
                itemStyle={{ color: '#1f2937', fontSize: 16 }} // 👈 ADD THIS
              >
                    {availableYears.map(year => ( <Picker.Item key={year} label={year} value={year} /> ))}
                  </Picker>
                {/* </View> */}
              </View>
              <View style={styles.formGroup}> <Text style={styles.formLabel}>Package (LPA)</Text> <TextInput style={styles.formInput} value={newPlacementPackage} onChangeText={setNewPlacementPackage} keyboardType="numeric" placeholder="e.g., 12.5" /> </View>
            </View>
            {modalError && <Text style={styles.modalError}>{modalError}</Text>}
          </ScrollView>
          <View style={styles.modalActions}> 
            <Pressable style={styles.buttonCancel} onPress={() => setShowAddPlacementModal(false)}><Text style={styles.buttonCancelText}>Cancel</Text></Pressable> 
            <Pressable style={styles.buttonConfirm} onPress={handleSavePlacement} disabled={modalLoading}>
              {modalLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.buttonConfirmText}>Add Record</Text>}
            </Pressable> 
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderYearSelectorModal = () => (
    <Modal visible={showYearModal} transparent animationType="fade" onRequestClose={() => setShowYearModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalBox, styles.yearModalBox]}> {/* Use a slightly different style */}
          <View style={styles.modalHeader}> 
            <Text style={styles.modalTitle}>Select Academic Year</Text> 
            <Pressable style={styles.modalCloseBtn} onPress={() => setShowYearModal(false)}><X size={20} /></Pressable> 
          </View>
          
          <ScrollView style={styles.yearListScrollView}>
            {availableYears.map(year => (
              <Pressable 
                key={year} 
                style={[
                  styles.yearListItem, 
                  tempSelectedYear === year && styles.yearListItemSelected // Highlight selected
                ]} 
                onPress={() => setTempSelectedYear(year)}
              >
                <Text 
                  style={[
                    styles.yearListItemText,
                    tempSelectedYear === year && styles.yearListItemTextSelected
                  ]}
                >
                  {year}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.modalActions}> 
            <Pressable style={styles.buttonCancel} onPress={() => setShowYearModal(false)}>
              <Text style={styles.buttonCancelText}>Cancel</Text>
            </Pressable> 
            <Pressable style={styles.buttonConfirm} onPress={() => {
              setSelectedYear(tempSelectedYear); // Apply the selection
              setShowYearModal(false);         // Close modal
            }}>
              <Text style={styles.buttonConfirmText}>Done</Text>
            </Pressable> 
          </View>
        </View>
      </View>
    </Modal>
  );

  // --- MAIN RENDER ---
  return (
    <SafeAreaView style={styles.pageContainer}>
        <View style={styles.headerContainer}>
            <View style={styles.headerLeft}> 
                <Pressable onPress={() => { if (router.canGoBack()) { router.back(); } else { router.push('/home'); } }} style={styles.backButton} title="Back"> <ArrowLeft size={24} color="#4f46e5" /> </Pressable> 
                <Text style={styles.headerTitle}>Company Analysis</Text> 
            </View>
        </View>

        <ScrollView contentContainerStyle={styles.mainContent}>
            {userRole === 'admin' && (
                <View style={styles.adminControlsContainer}>
                    <Pressable style={styles.adminAddButton} onPress={handleAddCompanyClick}> <Building size={16} color="white"/> <Text style={styles.adminAddButtonText}>Add Company</Text> </Pressable>
                    <Pressable style={styles.adminAddButton} onPress={handleAddPlacementClick}> <Plus size={16} color="white"/> <Text style={styles.adminAddButtonText}>Add Record</Text> </Pressable>
                </View>
            )}

            <View style={styles.controlsContainer}> 
               <View style={styles.controlsContainer}> 
            <Text style={styles.controlsLabel}>Select Year:</Text> 
            <Pressable 
              style={styles.yearSelectorButton} 
              onPress={() => {
                setTempSelectedYear(selectedYear); // Reset temp year on open
                setShowYearModal(true); 
              }}
            >
              <Text style={styles.yearSelectorButtonText}>{selectedYear || "Select"}</Text>
              {/* Optional: Add a dropdown icon here if you like */}
            </Pressable>
          </View>
            </View>
            
            {error && <Text style={styles.errorText}>{error}</Text>}
            
            <View style={styles.chartSection}> 
                {renderChart()} 
            </View>
            
            <Text style={styles.listHeader}>Companies Visited in {selectedYear}</Text>
            <View style={styles.companyListContainer}> 
                {renderCompanyList()} 
            </View>
        </ScrollView>

        {renderAddCompanyModal()}
        {renderEditCompanyModal()}
        {renderAddPlacementModal()}
        {renderYearSelectorModal()}
    </SafeAreaView>
  );
}

// --- StyleSheet ---
const styles = StyleSheet.create({

  yearModalBox: {
      maxWidth: 300, // Make it narrower than other modals
      maxHeight: '70%', 
    },
    yearListScrollView: {
      marginVertical: 10,
    },
    yearListItem: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    },
    yearListItemSelected: {
      backgroundColor: '#eef2ff',
    },
    yearListItemText: {
      fontSize: 16,
      color: '#374151',
      textAlign: 'center',
    },
    yearListItemTextSelected: {
      color: '#4f46e5',
      fontWeight: '600',
    },
    // Style for the button that opens the modal
    yearSelectorButton: {
      borderWidth: 1,
      borderColor: '#d1d5db',
      borderRadius: 6,
      backgroundColor: '#fff',
      paddingVertical: 12, // Match input height
      paddingHorizontal: 16,
      minWidth: 150,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    yearSelectorButtonText: {
      fontSize: 16,
      color: '#1f2937', 
    },
    yearSelectorButtonPlaceholder: { // If you want placeholder text
       fontSize: 16,
       color: '#9ca3af', 
    },
    // Make sure modalScrollView has maxHeight too
    modalScrollView: {
        maxHeight: 400, // Or adjust as needed
    },

    horizontalScroll: {
        width: screenWidth, // Constrain the scroll view to screen width
    },
    pageContainer: {
        flex: 1,
        backgroundColor: '#f9fafe',
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 12, // 👈 ADD THIS
        paddingBottom: 12,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    backButton: {
        padding: 8,
        backgroundColor: '#eef2ff',
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
    },
    mainContent: {
        padding: 24,
        maxWidth: 1000,
        alignSelf: 'center',
        width: '100%',
    },
    adminControlsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
        marginBottom: 24,
        flexWrap: 'wrap',
    },
    adminAddButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#4f46e5',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    adminAddButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 15,
    },
    controlsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
        marginBottom: 32,
      
    },
    controlsLabel: {
        fontWeight: '500',
        fontSize: 16,
        color: '#374151',
    },
    pickerWrapper: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 6,
        backgroundColor: '#fff',
        //height: 44,
        //justifyContent: 'center',
        //overflow: 'hidden',
        minWidth: 150,
    },
    yearSelect: {
        width: '100%',
        itemStyle: { color: '#1f2937', fontSize: 16 }
       // height: 44,
    },
    chartSection: {
        marginBottom: 48,
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    chartToggle: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 24,
    },
    chartToggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#d1d5db',
        backgroundColor: '#fff',
        borderRadius: 6,
    },
    chartToggleButtonText: {
        color: '#4b5563',
        fontWeight: '500',
        fontSize: 14,
    },
    chartToggleButtonActive: {
        backgroundColor: '#eef2ff',
        borderColor: '#a5b4fc',
    },
    chartToggleButtonActiveText: {
        color: '#4f46e5',
    },
    chartContainer: {
        height: 300,
        width: screenWidth, 
        alignItems: 'center',
        justifyContent: 'center',
    },
    listHeader: {
        fontSize: 24,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 24,
        textAlign: 'center',
    },
    companyList: {
        gap: 24,
    },
    companyCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    companyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 16,
        flexWrap: 'wrap',
    },
    companyLogoPlaceholder: {
        width: 40,
        height: 40,
        padding: 4,
    },
    companyName: {
        fontSize: 20,
        fontWeight: '600',
        color: '#111827',
        flex: 1,
    },
    adminActions: {
        flexDirection: 'row',
        gap: 8,
        marginLeft: 'auto',
    },
    adminBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    editBtn: {
        backgroundColor: '#eef2ff',
    },
    deleteBtn: {
        backgroundColor: '#fee2e2',
    },
    companyDetails: {
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        paddingTop: 8,
    },
    companyDetailText: {
        fontSize: 14,
        color: '#374151',
        marginVertical: 4,
    },
    companyDetailStrong: {
        fontWeight: '600',
        color: '#111827',
    },
    companyWebsite: {
        color: '#4f46e5',
        fontWeight: '500',
        fontSize: 14,
        marginTop: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    infoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    infoText: {
        color: '#6b7280',
        fontSize: 16,
        marginTop: 8,
        textAlign: 'center',
    },
    errorText: {
        color: '#ef4444',
        fontWeight: '500',
        fontSize: 16,
        padding: 32,
        textAlign: 'center',
    },
    // --- Modals ---
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    modalBox: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 24,
        width: '100%',
        maxWidth: 576,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        paddingBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1f2937',
    },
    modalCloseBtn: {
        padding: 8,
        backgroundColor: '#f3f4f6',
        borderRadius: 20,
    },
    modalScrollView: {
        maxHeight: 400,
    },
    formGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 16,
    },
    formGroup: {
        width: '48%', 
        marginBottom: 8,
    },
    formGroupFull: {
        width: '100%',
        marginBottom: 8,
    },
    formLabel: {
        fontWeight: '500',
        fontSize: 14,
        color: '#374151',
        marginBottom: 4,
    },
    formInput: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    formTextarea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 24,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        paddingTop: 16,
    },
    buttonCancel: {
        backgroundColor: '#f3f4f6',
        borderWidth: 1,
        borderColor: '#d1d5db',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    buttonCancelText: {
        color: '#1f2937',
        fontWeight: '600',
    },
    buttonConfirm: {
        backgroundColor: '#4f46e5',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    buttonConfirmText: {
        color: '#fff',
        fontWeight: '600',
    },
    modalError: {
        color: '#ef4444',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 16,
    },
    formPicker: {
        width: '100%',
        //height: 40,
        color: '#1f2937',
    },
    pickerWithoutWrapper: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        backgroundColor: '#fff', 
        // Add some explicit height based on platform if needed, e.g.:
        // height: Platform.OS === 'ios' ? 200 : 50, 
    },
    // Chart Specific Styles
    chartVisualizerContainer: {
        padding: 16,
        alignItems: 'center',
    },
    chartVisualizerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 16,
        textAlign: 'center',
    },
    chartToggle: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 24,
    },
    chartContainer: {
        height: 300,
        width: screenWidth, 
        alignItems: 'center',
        justifyContent: 'center',
    },
    chartLegend: {
        marginTop: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        width: '100%',
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 12,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendColorBox: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    legendText: {
        fontSize: 12,
        color: '#374151',
    },
});