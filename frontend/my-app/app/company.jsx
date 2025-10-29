import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Pressable,
  // TextInput, // No longer needed directly here
  StyleSheet,
  ActivityIndicator,
  // Modal, // No longer needed directly here
  Alert,
  Linking,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  // X, // Moved to modals
  Link as LinkIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  PackageX,
  Building,
  ChevronDown,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Keep Picker only if still used in AddPlacementModal (it is)
// import { Picker } from '@react-native-picker/picker'; 
import { BarChart, PieChart } from "react-native-chart-kit";

// Import the new modal components
import AddCompanyModal from './components/AddCompanyModal';
import EditCompanyModal from './components/EditCompanyModal';
import AddPlacementModal from './components/AddPlacementModal';
import YearSelectorModal from './components/YearSelectorModal';

// --- Constants --- (Keep these)
const screenWidth = Dimensions.get("window").width * 0.90;
const chartInnerWidth = screenWidth - 48;

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
  console.log("--- CompanyAnalysis Rendering ---");
  const router = useRouter();
  const availableYears = useMemo(() => generateYears(), []); // Memoize year generation

  // --- Core State ---
  const [selectedYear, setSelectedYear] = useState(availableYears[0]);
  const [placementStats, setPlacementStats] = useState([]);
  const [companiesList, setCompaniesList] = useState([]);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [chartType, setChartType] = useState('bar');

  // --- State for Modals ---
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const [showEditCompanyModal, setShowEditCompanyModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null); // Keep track of company being edited
  const [showAddPlacementModal, setShowAddPlacementModal] = useState(false);
  const [showYearModal, setShowYearModal] = useState(false);
  // Note: modalLoading and modalError state are now managed within each modal component

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

  // Fetch data function (memoized with useCallback if needed, but likely fine as is)
  const fetchDataForYear = useCallback(async (year) => {
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
  }, []); // Empty dependency array, relies on 'year' argument

  // Fetch data when selectedYear changes
  useEffect(() => {
    fetchDataForYear(selectedYear);
  }, [selectedYear, fetchDataForYear]); // Include fetchDataForYear in deps

  // --- Admin Action Handlers (Wrapped in useCallback) ---

  const handleAddCompanyClick = useCallback(() => {
    setShowAddCompanyModal(true);
  }, []);

  const handleEditCompanyClick = useCallback((company) => {
    setEditingCompany(company); // Set the company to edit
    setShowEditCompanyModal(true);
  }, []);

  const handleDeleteCompany = useCallback((companyId, companyName) => {
    Alert.alert(
      "Confirm Deletion",
      `Are you sure you want to delete "${companyName}" and all associated placement records? This action cannot be undone.`,
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
              if (!res.ok) { 
                 try {
                     const data = await res.json(); 
                     throw new Error(data.message || 'Delete failed'); 
                 } catch (parseError) {
                      throw new Error(`Delete failed with status ${res.status}`);
                 }
              }
              Alert.alert('Success', `Company "${companyName}" deleted successfully.`);
              fetchDataForYear(selectedYear); // Refresh data
            } catch (err) { 
              Alert.alert('Error', `Failed to delete company: ${err.message}`); 
              console.error(err); 
            }
          }
        }
      ]
    );
  }, [selectedYear, fetchDataForYear]); // Depend on selectedYear and fetchData

  const handleAddPlacementClick = useCallback(() => {
    setShowAddPlacementModal(true);
  }, []);

   // --- Modal Submit Handlers (Wrapped in useCallback) ---

   // Handles both Add and Edit
   const handleSaveCompany = useCallback(async (companyData, isEditing = false, companyId = null) => {
    const token = await AsyncStorage.getItem('token');
    const url = isEditing ? `/api/companies/${companyId}` : '/api/companies';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(`https://placemate-ru7v.onrender.com${url}`, {
        method: method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        // companyData already includes roles as an array from modal
        body: JSON.stringify(companyData) 
      });
      if (!res.ok) {
         try {
             const data = await res.json(); 
             throw new Error(data.message || (isEditing ? 'Update failed' : 'Add failed')); 
         } catch (parseError) {
              throw new Error(`Request failed with status ${res.status}`);
         }
      }
      
      Alert.alert('Success', `Company ${isEditing ? 'updated' : 'added'} successfully!`);
      setShowAddCompanyModal(false); // Close relevant modals
      setShowEditCompanyModal(false); 
      setEditingCompany(null);        // Clear editing state
      await fetchDataForYear(selectedYear); // Refresh data (make sure it finishes)
      // No return needed on success, handled by modal's try/catch
      
    } catch (err) { 
        console.error("Save Company Error:", err);
        // Re-throw the error so the modal's catch block can display it
        throw err; 
    }
    // Loading state is handled inside modal
  }, [selectedYear, fetchDataForYear]); // Depend on selectedYear and fetchData

  const handleSavePlacement = useCallback(async (placementData) => {
    const token = await AsyncStorage.getItem('token');
    try {
      const res = await fetch(`https://placemate-ru7v.onrender.com/api/placements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        // placementData already includes packageLPA potentially as undefined
        body: JSON.stringify(placementData) 
      });
       if (!res.ok) {
         try {
             const data = await res.json(); 
             throw new Error(data.message || 'Failed to add placement record.'); 
         } catch (parseError) {
              throw new Error(`Request failed with status ${res.status}`);
         }
      }
      
      Alert.alert('Success', `Placement record added successfully!`);
      setShowAddPlacementModal(false); // Close modal on success
      await fetchDataForYear(selectedYear); // Refresh data
      // No return needed on success
      
    } catch (err) { 
      console.error("Save Placement Error:", err);
      // Re-throw the error so the modal's catch block can display it
      throw err; 
    }
    // Loading state is handled inside modal
  }, [selectedYear, fetchDataForYear]); // Depend on selectedYear and fetchData


  // --- Memoized Chart Data ---
  const barData = useMemo(() => ({
    labels: placementStats.map(stat => (stat.companyName.length > 10 ? stat.companyName.substring(0, 9) + '...' : stat.companyName)),
    datasets: [{ data: placementStats.map(stat => stat.count) }],
  }), [placementStats]);

  const pieData = useMemo(() => placementStats.map((stat, index) => ({
    name: stat.companyName.length > 10 ? stat.companyName.substring(0, 9) + '...' : stat.companyName,
    count: stat.count,
    legendFontColor: '#7F7F7F',
    legendFontSize: 14,
    color: `hsl(${index * 50}, 70%, 50%)`,
  })), [placementStats]);

  // --- Chart Renderer (Uses memoized data) ---
  const renderChart = () => {
    console.log("--- renderChart function called ---");
    if (isLoadingStats) return <View style={styles.infoContainer}><ActivityIndicator size="large" color="#4f46e5" /><Text style={styles.infoText}>Loading Chart...</Text></View>;
    if (!isLoadingStats && placementStats.length === 0) return (
      // Use styles.infoContainer for consistency
      <View style={[styles.infoContainer, {paddingVertical: 40}]}> 
        <Text style={styles.infoText}>No placement data available for {selectedYear}.</Text>
      </View>
    );

    // Configuration for the chart appearance
    const chartConfig = {
        backgroundColor: '#ffffff',
        backgroundGradientFrom: '#ffffff',
        backgroundGradientTo: '#ffffff',
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`, // Main color
        labelColor: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`, // Darker labels #374151
        propsForLabels: { fontSize: 10 }, // Simplified label props
        style: {
            borderRadius: 12, // Apply border radius to the chart itself if possible
        },
        // Bar chart specific adjustments
        barPercentage: 0.7, 
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
              contentContainerStyle={{ paddingHorizontal: 5 }} // Add padding for labels
            >
              <BarChart
                data={barData}
                // Dynamic width calculation, ensuring minimum width
                width={Math.max(chartInnerWidth, placementStats.length * 60)} 
                height={300}
                chartConfig={chartConfig}
                verticalLabelRotation={30}
                fromZero={true}
                showValuesOnTopOfBars={true} // Show count on bars
                style={chartConfig.style} // Apply style from config
              />
            </ScrollView>
          ) : (
             // Centering Pie Chart is tricky, adjust paddingLeft as needed
             // paddingLeft aims to push the start of the chart towards the center
            <PieChart
              data={pieData}
              width={screenWidth} // Use the defined screenWidth
              height={280}
              chartConfig={chartConfig}
              accessor={"count"}
              backgroundColor={"transparent"}
              // Adjust padding dynamically if possible, or use a fixed value that works well
              paddingLeft={"15"} // May need adjustment based on chart size/labels
              center={[screenWidth / 4, 0]} // Try adjusting center based on width
              absolute // To show actual counts
              style={chartConfig.style} // Apply style from config
            />
          )}
        </View>
        
        {/* Render legend only for Pie chart for clarity, bar chart has labels */}
        {chartType === 'pie' && placementStats.length > 0 && (
          <View style={styles.chartLegend}>
            {pieData.map((entry) => ( // Use pieData which has colors
              <View key={entry.name} style={styles.legendItem}>
                <View style={[styles.legendColorBox, { backgroundColor: entry.color }]} />
                {/* Display full name in legend */}
                <Text style={styles.legendText}>{placementStats.find(s=>s.companyName.startsWith(entry.name.substring(0,9)))?.companyName} ({entry.count})</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  // --- Company List Renderer (Uses props, potentially memoizable) ---
   // This could be further optimized with React.memo if the list is very long
  const CompanyListRenderer = ({ companies, userRole, onEdit, onDelete }) => (
    <View style={styles.companyList}>
      {companies.map(company => (
        <View key={company._id} style={styles.companyCard}>
          <View style={styles.companyHeader}>
            <Text style={styles.companyName}>{company.name}</Text>
            {userRole === 'admin' && (
              <View style={styles.adminActions}>
                <Pressable style={[styles.adminBtn, styles.editBtn]} title="Edit Company" onPress={() => onEdit(company)}> <Edit size={14} color="#4338ca"/> </Pressable>
                <Pressable style={[styles.adminBtn, styles.deleteBtn]} title="Delete Company" onPress={() => onDelete(company._id, company.name)}> <Trash2 size={14} color="#991b1b"/> </Pressable>
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
              <Pressable 
                onPress={() => Linking.canOpenURL(company.website).then(supported => {
                    if (supported) { Linking.openURL(company.website); } 
                    else { Alert.alert("Cannot open URL", `Invalid or unsupported URL: ${company.website}`); }
                })}
                style={styles.companyWebsiteContainer} // Use container for better touch area
              >
                <LinkIcon size={14} color="#4f46e5" /> 
                <Text style={styles.companyWebsite}>Visit Website</Text>
              </Pressable>
            )}
          </View>
        </View>
      ))}
    </View>
  );

  const renderCompanyList = () => {
    console.log("--- renderCompanyList function called ---");
    if (isLoadingCompanies) {
      return (
          <View style={styles.infoContainer}>
              <ActivityIndicator size="large" color="#4f46e5" />
              <Text style={styles.infoText}>Loading Companies...</Text>
          </View>
      );
    }
    if (!isLoadingCompanies && companiesList.length === 0) {
      return (
          <View style={styles.emptyState}>
              <PackageX size={40} color="#6b7280" />
              <Text style={styles.emptyTitle}>No Companies Recorded</Text>
              <Text style={styles.emptySubtitle}>No companies visited in the {selectedYear} cycle.</Text>
          </View>
      );
    }

    return (
      <CompanyListRenderer
        companies={companiesList}
        userRole={userRole}
        onEdit={handleEditCompanyClick}   // Pass memoized handler
        onDelete={handleDeleteCompany} // Pass memoized handler
      />
    );
  };
  
  // --- Year Selection Handler ---
  const handleSelectYear = useCallback((year) => {
    setSelectedYear(year);
  }, []);

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

            {/* --- Custom Year Selector Button --- */}
            <View style={styles.controlsContainer}>
                <Text style={styles.controlsLabel}>Select Year:</Text>
                <Pressable
                  style={styles.yearSelectorButton}
                  onPress={() => setShowYearModal(true)} // Open the year modal
                >
                  <Text style={styles.yearSelectorButtonText}>{selectedYear || "Select Year"}</Text>
                  <ChevronDown size={18} color="#6b7280" />
                </Pressable>
            </View>
            
            {error && <Text style={styles.errorText}>{error}</Text>}
            
            <View style={styles.chartSection}>
                {renderChart()}
            </View>
            
            <Text style={styles.listHeader}>Companies Visited in {selectedYear}</Text>
            {/* Removed extra View wrapper */}
            {renderCompanyList()} 
            
        </ScrollView>

        {/* --- Render Modal Components --- */}
        <AddCompanyModal
            isVisible={showAddCompanyModal}
            onClose={() => setShowAddCompanyModal(false)}
            onSubmit={(companyData) => handleSaveCompany(companyData, false)}
            styles={styles} // Pass styles
        />
       
        <EditCompanyModal
            isVisible={showEditCompanyModal}
            onClose={() => {setShowEditCompanyModal(false); setEditingCompany(null);}}
            onSubmit={(companyId, companyData) => handleSaveCompany(companyData, true, companyId)}
            companyToEdit={editingCompany}
            styles={styles} // Pass styles
        />
        
        <AddPlacementModal
            isVisible={showAddPlacementModal}
            onClose={() => setShowAddPlacementModal(false)}
            onSubmit={handleSavePlacement}
            availableYears={availableYears}
            defaultYear={selectedYear} // Pass current selected year as default
            styles={styles} // Pass styles
        />
        
        <YearSelectorModal
             isVisible={showYearModal}
             onClose={() => setShowYearModal(false)}
             onSelectYear={handleSelectYear} // Use handler to update state
             availableYears={availableYears}
             currentSelectedYear={selectedYear}
             styles={styles} // Pass styles
        />
        
    </SafeAreaView>
  );
}

// --- StyleSheet --- (Keep your existing styles, ensure all used styles are present)
const styles = StyleSheet.create({
  // ... Paste your COMPLETE StyleSheet here ... 
  // Make sure styles like pickerWithoutWrapper, yearModalBox, etc. are included
  // Also, add styles for emptyState if missing
   emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.7,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#4b5563',
  },
  emptySubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  companyWebsiteContainer: { // Added for better touch target
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4, // Add gap directly here
  },
  companyWebsite: { // Text style only, no flex props
    color: '#4f46e5',
    fontWeight: '500',
    fontSize: 14,
  },
   // --- Ensure these styles from previous steps are included ---
    yearModalBox: {
      maxWidth: 300, 
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
    yearSelectorButton: {
      borderWidth: 1,
      borderColor: '#d1d5db',
      borderRadius: 6,
      backgroundColor: '#fff',
      paddingVertical: 12, 
      paddingHorizontal: 16,
      minWidth: 150, // Keep or adjust
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    yearSelectorButtonText: {
      fontSize: 16,
      color: '#1f2937', 
    },
    modalScrollView: { // Ensure this has maxHeight
        maxHeight: 400, 
    },
    // pickerWithoutWrapper: { // For the picker in AddPlacementModal
    //     borderWidth: 1,
    //     borderColor: '#d1d5db',
    //     borderRadius: 8,
    //     backgroundColor: '#fff', 
    // },
    chartPlaceholderContainer:{ // Placeholder for empty chart
      alignItems: 'center',
      justifyContent: 'center',
      height: 300, // Match chart container height
    },
    // --- Paste ALL your other styles below ---
    horizontalScroll: { width: screenWidth },
    pageContainer: { flex: 1, backgroundColor: '#f9fafe' },
    headerContainer: { flexDirection: 'row', alignItems: 'center', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 12, paddingBottom: 12, paddingHorizontal: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    backButton: { padding: 8, backgroundColor: '#eef2ff', borderRadius: 20 },
    headerTitle: { fontSize: 24, fontWeight: '700', color: '#111827' },
    mainContent: { padding: 24, maxWidth: 1000, alignSelf: 'center', width: '100%' },
    adminControlsContainer: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' },
    adminAddButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#4f46e5', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
    adminAddButtonText: { color: 'white', fontWeight: '600', fontSize: 15 },
    controlsContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, marginBottom: 32 },
    controlsLabel: { fontWeight: '500', fontSize: 16, color: '#374151' },
    pickerWrapper: { 
      borderWidth: 1, 
      borderColor: '#d1d5db', 
      borderRadius: 6, 
      backgroundColor: '#fff',
       minWidth: 150 
      }, // Keep border here for main picker if used
    yearSelect: { width: '100%', itemStyle: { color: '#1f2937', fontSize: 16 } }, // Keep itemStyle if using native picker elsewhere
    chartSection: { marginBottom: 48, backgroundColor: '#fff', padding: 24, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 5, elevation: 3, borderWidth: 1, borderColor: '#e5e7eb' },
    chartToggle: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
    chartToggleButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 16, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#fff', borderRadius: 6 },
    chartToggleButtonText: { color: '#4b5563', fontWeight: '500', fontSize: 14 },
    chartToggleButtonActive: { backgroundColor: '#eef2ff', borderColor: '#a5b4fc' },
    chartToggleButtonActiveText: { color: '#4f46e5' },
    chartContainer: { height: 300, width: chartInnerWidth, alignItems: 'center', justifyContent: 'center', alignSelf: 'center'}, // Use chartInnerWidth
    listHeader: { fontSize: 24, fontWeight: '600', color: '#1f2937', marginBottom: 24, textAlign: 'center' },
    companyListContainer: {}, // Removed style, list renders directly
    companyList: { gap: 16 }, // Reduced gap slightly
    companyCard: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
    companyHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', flexWrap: 'wrap' },
    companyName: { fontSize: 18, fontWeight: '600', color: '#111827', flexShrink: 1, marginRight: 'auto' }, // Allow shrink, push actions right
    adminActions: { flexDirection: 'row', gap: 8, marginLeft: 12 }, // Add margin
    adminBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    editBtn: { backgroundColor: '#eef2ff' },
    deleteBtn: { backgroundColor: '#fee2e2' },
    companyDetails: { paddingTop: 8, gap: 6 }, // Add gap
    companyDetailText: { fontSize: 14, color: '#374151', lineHeight: 20 },
    companyDetailStrong: { fontWeight: '600', color: '#111827' },
    infoContainer: { alignItems: 'center', justifyContent: 'center', padding: 32 },
    infoText: { color: '#6b7280', fontSize: 16, marginTop: 8, textAlign: 'center' },
    errorText: { color: '#ef4444', fontWeight: '500', fontSize: 16, padding: 32, textAlign: 'center' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 16 },
    modalBox: { backgroundColor: '#fff', 
      borderRadius: 12, 
      padding: 24, 
      width: '100%',
       maxWidth: 400, 
       maxHeight: '85%'
       },
    modalHeader: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: 16,
       borderBottomWidth: 1, 
       borderBottomColor: '#e5e7eb', 
       paddingBottom: 16 },
    modalTitle: { fontSize: 20, fontWeight: '600', color: '#1f2937' },
    modalCloseBtn: { padding: 8, backgroundColor: '#f3f4f6', borderRadius: 20 },
    formGrid: {
      //  flexDirection: 'row', 
      //  flexWrap: 'wrap', 
      //  justifyContent: 'space-between', 
      //  columnGap: 16,
      //  rowGap: 10
      gap:16,
       }, // Use columnGap
    formGroup: { width: '100%', 
    //  marginBottom: 8
     },
    //formGroupFull: { width: '100%', marginBottom: 8 },
    formLabel: { fontWeight: '500', fontSize: 14, color: '#374151', marginBottom: 6 },
    formInput: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#fff',color: '#1f2937', },
    formTextarea: { minHeight: 100, textAlignVertical: 'top' },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 24, borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 16 },
    buttonCancel: { backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#d1d5db', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
    buttonCancelText: { color: '#1f2937', fontWeight: '600' },
    buttonConfirm: { backgroundColor: '#4f46e5', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 40 }, // Added minHeight
    buttonConfirmText: { color: '#fff', fontWeight: '600' },
    modalError: { color: '#ef4444', fontSize: 14, textAlign: 'center', marginTop: 16 },
    formPicker: { width: '100%', color: '#1f2937' }, // Height removed
    chartVisualizerContainer: { paddingVertical: 16, alignItems: 'center' }, // Removed paddingHorizontal
    chartVisualizerTitle: { fontSize: 20, fontWeight: '600', color: '#1f2937', marginBottom: 16, textAlign: 'center' },
    chartLegend: { marginTop: 24, padding: 12, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendColorBox: { width: 12, height: 12, borderRadius: 6 },
    legendText: { fontSize: 12, color: '#374151' },
}); // Make sure this is the absolute end of the file