import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import axiosInstance from '../../../utils/axiosConfig';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faSave, faTimes, faChartLine, faUsers, faFileAlt, faBell, faCheckCircle, faExclamationTriangle, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import '../css/Evaluation.css';
import { getLogoUrl, API_BASE } from '../../../utils/url';

// Notification component
function Notification({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="evaluation-success-notification">
      {message}
    </div>
  );
}

const KPI_WEIGHTS = {
  'Volunteer Participation': 0.25,
  'Task Accommodation and Completion': 0.30,
  'Communication Effectiveness': 0.15,
  'Team Objective Above Self': 0.30
};

const SCORING_SCALE = {
  1: 'Poor',
  2: 'Average',
  3: 'Good',
  4: 'Excellent'
};

const KPI_CRITERIA = {
  'Volunteer Participation': {
    'Inside the coalition': [
      'Actively participates in meetings, trainings, and other activities without constant reminders',
      'Suggests and leads new activities'
    ],
    'Outside the coalition': [
      'Helps in operations or field activities without reminders from their supervisor or others',
      'Pursues objectives despite challenges and obstacles'
    ]
  },
  'Task Accommodation and Completion': {
    'Inside the coalition': [
      'The team consistently meets collective deadlines and maintains quality standards',
      'Effectively aligns group workflows with coalition plans'
    ],
    'Outside the coalition': [
      'Successfully completes most tasks independently but asks for additional support, as appropriate, when faced with unfamiliar situations',
      'The group demonstrates resilience and adaptability when handling unfamiliar external requirements'
    ]
  },
  'Communication Effectiveness': {
    'Inside the coalition': [
      'Shares new knowledge and ideas with others freely or during discussions',
      'Actively listens and provides constructive feedback during meetings',
      'Responds constructively in meetings and coordination efforts'
    ],
    'Outside the coalition': [
      'Seeks and effectively uses feedback from others to assess and improve own performance',
      'Communicates clearly and respectfully with the public'
    ]
  },
  'Team Objective Above Self': {
    'Inside the coalition': [
      'Treats others fairly and with respect',
      'Encourages listening to other\'s ideas to address conflicts within the coalition',
      'Works toward coalition goals and helps involve others'
    ],
    'Outside the coalition': [
      'Uses team member\'s skills, experience, knowledge, and creativity to resolve problems and handle tasks in the community',
      'Works well with other groups in the coalition to achieve common goals'
    ]
  }
};

// Get the specific metric description used for scoring each criterion
const getMetricDescription = (category, section, criterionIndex) => {
  // Volunteer Participation
  if (category === 'Volunteer Participation') {
    if (section === 'Inside the coalition' && criterionIndex === 0) {
      return 'Based on: Notification response rate and login frequency';
    }
    if (section === 'Inside the coalition' && criterionIndex === 1) {
      return null; // No metric - manual scoring
    }
    if (section === 'Outside the coalition' && criterionIndex === 0) {
      return 'Based on: Total reports submitted';
    }
    if (section === 'Outside the coalition' && criterionIndex === 1) {
      return 'Based on: Report approval rate';
    }
  }
  
  // Task Accommodation and Completion
  if (category === 'Task Accommodation and Completion') {
    if (section === 'Inside the coalition' && criterionIndex === 0) {
      return 'Based on: Report approval rate';
    }
    if (section === 'Inside the coalition' && criterionIndex === 1) {
      return 'Based on: Notification response rate and acceptance rate';
    }
    if (section === 'Outside the coalition' && criterionIndex === 0) {
      return 'Based on: Total reports submitted and approval rate';
    }
    if (section === 'Outside the coalition' && criterionIndex === 1) {
      return 'Based on: Total reports submitted and rejection rate';
    }
  }
  
  // Communication Effectiveness
  if (category === 'Communication Effectiveness') {
    if (section === 'Inside the coalition') {
      return null; // No metric - manual scoring (all 3 criteria)
    }
    if (section === 'Outside the coalition' && criterionIndex === 0) {
      return 'Based on: Report approval rate';
    }
    if (section === 'Outside the coalition' && criterionIndex === 1) {
      return 'Based on: Report approval rate and total reports submitted';
    }
  }
  
  // Team Objective Above Self
  if (category === 'Team Objective Above Self') {
    if (section === 'Inside the coalition') {
      return null; // No metric - manual scoring (all 3 criteria)
    }
    if (section === 'Outside the coalition' && criterionIndex === 0) {
      return 'Based on: Volunteers recruited in period';
    }
    if (section === 'Outside the coalition' && criterionIndex === 1) {
      return 'Based on: Notification acceptance rate and response rate';
    }
  }
  
  return null; // No metric - manual scoring required
};

// Determine metric type for each criterion (used for auto-scoring logic)
const getMetricType = (category, section, criterionIndex) => {
  const metricDesc = getMetricDescription(category, section, criterionIndex);
  return metricDesc ? (metricDesc.includes('Based on') ? 'has_metric' : 'none') : 'none';
};

// Auto-scoring function based on metrics
const calculateAutoScore = (category, section, criterionIndex, metrics, criterionText) => {
  const metricType = getMetricType(category, section, criterionIndex);
  
  // If no metric available, return 0 (unscored)
  if (metricType === 'none') {
    return 0;
  }
  
  let score = 0;
  
  // Volunteer Participation
  if (category === 'Volunteer Participation') {
    if (section === 'Inside the coalition') {
      if (criterionIndex === 0) {
        // Actively participates without reminders
        const responseRate = metrics.notifications?.response_rate || 0;
        const loginFreq = metrics.system_engagement?.login_frequency_per_week || 0;
        if (responseRate >= 90 && loginFreq >= 4) score = 4;
        else if (responseRate >= 75 && loginFreq >= 3) score = 3;
        else if (responseRate >= 60 && loginFreq >= 2) score = 2;
        else score = 1;
      } else if (criterionIndex === 1) {
        // Suggests and leads new activities - NO METRIC (manual scoring)
        return 0;
      }
    } else if (section === 'Outside the coalition') {
      if (criterionIndex === 0) {
        // Helps in operations without reminders
        const reports = metrics.reports?.total_submitted || 0;
        if (reports >= 12) score = 4;
        else if (reports >= 8) score = 3;
        else if (reports >= 4) score = 2;
        else score = 1;
      } else if (criterionIndex === 1) {
        // Pursues objectives despite challenges
        const approvalRate = metrics.reports?.approval_rate || 0;
        if (approvalRate >= 90) score = 4;
        else if (approvalRate >= 75) score = 3;
        else if (approvalRate >= 60) score = 2;
        else score = 1;
      }
    }
  }
  
  // Task Accommodation and Completion
  else if (category === 'Task Accommodation and Completion') {
    if (section === 'Inside the coalition') {
      if (criterionIndex === 0) {
        // Meets deadlines and maintains quality
        const approvalRate = metrics.reports?.approval_rate || 0;
        if (approvalRate >= 90) score = 4;
        else if (approvalRate >= 75) score = 3;
        else if (approvalRate >= 60) score = 2;
        else score = 1;
      } else if (criterionIndex === 1) {
        // Aligns workflows with coalition plans
        const responseRate = metrics.notifications?.response_rate || 0;
        const acceptanceRate = metrics.notifications?.acceptance_rate || 0;
        const combined = (responseRate + acceptanceRate) / 2;
        if (combined >= 85) score = 4;
        else if (combined >= 70) score = 3;
        else if (combined >= 50) score = 2;
        else score = 1;
      }
    } else if (section === 'Outside the coalition') {
      if (criterionIndex === 0) {
        // Completes tasks independently
        const reports = metrics.reports?.total_submitted || 0;
        const approvalRate = metrics.reports?.approval_rate || 0;
        if (reports >= 10 && approvalRate >= 80) score = 4;
        else if (reports >= 6 && approvalRate >= 70) score = 3;
        else if (reports >= 3 && approvalRate >= 60) score = 2;
        else score = 1;
      } else if (criterionIndex === 1) {
        // Demonstrates resilience and adaptability
        const reports = metrics.reports?.total_submitted || 0;
        const rejectionRate = metrics.reports?.rejected || 0;
        const totalReports = metrics.reports?.total_submitted || 1;
        const rejectionPercent = (rejectionRate / totalReports) * 100;
        if (reports >= 8 && rejectionPercent <= 10) score = 4;
        else if (reports >= 5 && rejectionPercent <= 20) score = 3;
        else if (reports >= 3 && rejectionPercent <= 30) score = 2;
        else score = 1;
      }
    }
  }
  
  // Communication Effectiveness
  else if (category === 'Communication Effectiveness') {
    if (section === 'Inside the coalition') {
      // All Inside criteria are qualitative - NO METRIC (manual scoring required)
      // These return 0 (unscored) - handled by early return for metricType === 'none'
      return 0;
    } else if (section === 'Outside the coalition') {
      if (criterionIndex === 0) {
        // Seeks and uses feedback
        const approvalRate = metrics.reports?.approval_rate || 0;
        if (approvalRate >= 90) score = 4;
        else if (approvalRate >= 75) score = 3;
        else if (approvalRate >= 60) score = 2;
        else score = 1;
      } else if (criterionIndex === 1) {
        // Communicates clearly with public
        const approvalRate = metrics.reports?.approval_rate || 0;
        const reports = metrics.reports?.total_submitted || 0;
        if (approvalRate >= 85 && reports >= 8) score = 4;
        else if (approvalRate >= 70 && reports >= 5) score = 3;
        else if (approvalRate >= 60 && reports >= 3) score = 2;
        else score = 1;
      }
    }
  }
  
  // Team Objective Above Self
  else if (category === 'Team Objective Above Self') {
    if (section === 'Inside the coalition') {
      // All Inside criteria are qualitative - NO METRIC (manual scoring required)
      // These return 0 (unscored) - handled by early return for metricType === 'none'
      return 0;
    } else if (section === 'Outside the coalition') {
      if (criterionIndex === 0) {
        // Uses team member's skills effectively
        const volunteersRecruited = metrics.volunteers?.recruited_in_period || 0;
        if (volunteersRecruited >= 10) score = 4;
        else if (volunteersRecruited >= 6) score = 3;
        else if (volunteersRecruited >= 3) score = 2;
        else score = 1;
      } else if (criterionIndex === 1) {
        // Works well with other groups
        const acceptanceRate = metrics.notifications?.acceptance_rate || 0;
        const responseRate = metrics.notifications?.response_rate || 0;
        const combined = (acceptanceRate + responseRate) / 2;
        if (combined >= 85) score = 4;
        else if (combined >= 70) score = 3;
        else if (combined >= 50) score = 2;
        else score = 1;
      }
    }
  }
  
  return score;
};

function Evaluation() {
  const [associates, setAssociates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAssociate, setSelectedAssociate] = useState(null);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [evaluationData, setEvaluationData] = useState({});
  const [notification, setNotification] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [evaluationPeriod, setEvaluationPeriod] = useState('quarter'); // quarter, 6months, year, custom
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [autoScores, setAutoScores] = useState({});
  const [showAutoScores, setShowAutoScores] = useState(true);

  useEffect(() => {
    fetchAssociates();
  }, []);

  const fetchAssociates = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await axiosInstance.get(`${API_BASE}/api/associate-groups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssociates(response.data);
    } catch (err) {
      setError('Failed to fetch associates');
    } finally {
      setLoading(false);
    }
  };

  const getPeriodDates = () => {
    const endDate = new Date();
    let startDate;
    
    switch (evaluationPeriod) {
      case 'quarter':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case '6months':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case 'year':
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          endDate = new Date(customEndDate);
        } else {
          startDate = new Date();
          startDate.setMonth(startDate.getMonth() - 3);
        }
        break;
      default:
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 3);
    }
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  };

  const fetchPerformanceMetrics = async (userId) => {
    try {
      setLoadingMetrics(true);
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const { start, end } = getPeriodDates();
      
      const response = await axiosInstance.get(
        `${API_BASE}/api/evaluations/performance-metrics/${userId}?start_date=${start}&end_date=${end}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setPerformanceMetrics(response.data);
      
      // Calculate auto-scores based on metrics
      const calculatedAutoScores = {};
      Object.entries(KPI_CRITERIA).forEach(([category, sections]) => {
        calculatedAutoScores[category] = { scores: {} };
        Object.entries(sections).forEach(([section, criteria]) => {
          criteria.forEach((_, index) => {
            const autoScore = calculateAutoScore(category, section, index, response.data, criteria[index]);
            calculatedAutoScores[category].scores[`${section}_${index}`] = autoScore;
          });
        });
      });
      
      setAutoScores(calculatedAutoScores);
      
      // Auto-populate evaluation data with auto-scores if enabled
      // Only apply non-zero scores (0 means unscored/manual)
      if (showAutoScores) {
        const filteredAutoScores = {};
        Object.entries(calculatedAutoScores).forEach(([category, data]) => {
          filteredAutoScores[category] = { scores: {} };
          Object.entries(data.scores).forEach(([key, score]) => {
            // Only apply auto-scores that are > 0 (scorable criteria)
            // Keep 0 for unscorable criteria (manual scoring required)
            filteredAutoScores[category].scores[key] = score;
          });
        });
        setEvaluationData(prev => {
          // Merge with existing data, only updating non-zero auto-scores
          const merged = { ...prev };
          Object.entries(filteredAutoScores).forEach(([category, data]) => {
            if (!merged[category]) merged[category] = { scores: {} };
            Object.entries(data.scores).forEach(([key, score]) => {
              if (score > 0) {
                merged[category].scores[key] = score;
              } else {
                // Keep existing score if it was manually set, otherwise keep 0
                if (!merged[category].scores[key] || merged[category].scores[key] === 0) {
                  merged[category].scores[key] = 0;
                }
              }
            });
          });
          return merged;
        });
      }
      
    } catch (err) {
      console.error('Error fetching performance metrics:', err);
      setPerformanceMetrics(null);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const handleEvaluate = async (associate) => {
    // Fetch the latest data for this associate before showing the modal
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await axiosInstance.get(`${API_BASE}/api/associate-groups/${associate.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedAssociate(response.data);
      
      // Initialize evaluation data structure first
      const initialData = {};
      Object.keys(KPI_CRITERIA).forEach(category => {
        initialData[category] = {
          scores: {}
        };
        Object.keys(KPI_CRITERIA[category]).forEach(section => {
          KPI_CRITERIA[category][section].forEach((_, index) => {
            initialData[category].scores[`${section}_${index}`] = 0;
          });
        });
      });
      setEvaluationData(initialData);
      
      // Open modal first
      setShowEvaluationModal(true);
      
      // Fetch performance metrics after modal is open (async)
      if (response.data.user_id) {
        await fetchPerformanceMetrics(response.data.user_id);
        // After metrics are fetched, auto-scores will be set and evaluationData will be updated
        // if showAutoScores is true (handled in fetchPerformanceMetrics)
      }
    } catch (err) {
      console.error('Error fetching latest associate data:', err);
      setSelectedAssociate(associate);
      setShowEvaluationModal(true);
    }
  };

  const handleScoreChange = (category, section, index, value) => {
    setEvaluationData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        scores: {
          ...prev[category].scores,
          [`${section}_${index}`]: parseInt(value)
        }
      }
    }));
  };

  const handlePeriodChange = async (period) => {
    setEvaluationPeriod(period);
    if (selectedAssociate && selectedAssociate.user_id) {
      await fetchPerformanceMetrics(selectedAssociate.user_id);
    }
  };

  const toggleAutoScores = (enabled) => {
    setShowAutoScores(enabled);
    if (enabled && Object.keys(autoScores).length > 0) {
      setEvaluationData(autoScores);
    } else {
      // Reset to empty scores
      const initialData = {};
      Object.keys(KPI_CRITERIA).forEach(category => {
        initialData[category] = { scores: {} };
        Object.keys(KPI_CRITERIA[category]).forEach(section => {
          KPI_CRITERIA[category][section].forEach((_, index) => {
            initialData[category].scores[`${section}_${index}`] = 0;
          });
        });
      });
      setEvaluationData(initialData);
    }
  };

  const calculateCategoryScore = (category) => {
    const scores = Object.values(evaluationData[category]?.scores || {}).filter(score => score > 0);
    if (scores.length === 0) return 0;
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  };

  const isCategoryComplete = (category) => {
    const sections = KPI_CRITERIA[category];
    let totalCriteria = 0;
    let scoredCriteria = 0;
    
    Object.entries(sections).forEach(([section, criteria]) => {
      criteria.forEach((_, index) => {
        totalCriteria++;
        const scoreKey = `${section}_${index}`;
        const score = evaluationData[category]?.scores?.[scoreKey];
        if (score && score > 0) {
          scoredCriteria++;
        }
      });
    });
    
    return totalCriteria === scoredCriteria;
  };

  const calculateTotalScore = () => {
    let totalWeightedScore = 0;
    Object.entries(KPI_WEIGHTS).forEach(([category, weight]) => {
      const categoryScore = calculateCategoryScore(category);
      totalWeightedScore += categoryScore * weight;
    });
    return totalWeightedScore.toFixed(2);
  };

  const validateEvaluation = () => {
    const missingScores = [];
    
    Object.entries(KPI_CRITERIA).forEach(([category, sections]) => {
      Object.entries(sections).forEach(([section, criteria]) => {
        criteria.forEach((_, index) => {
          const scoreKey = `${section}_${index}`;
          const score = evaluationData[category]?.scores?.[scoreKey];
          if (!score || score === 0) {
            missingScores.push(`${category} - ${section} - Criterion ${index + 1}`);
          }
        });
      });
    });
    
    return missingScores;
  };

  const handleSubmitEvaluation = async () => {
    // Validate that all criteria are scored
    const missingScores = validateEvaluation();
    
    if (missingScores.length > 0) {
      setError(`Please complete all evaluation criteria before submitting. Missing scores for: ${missingScores.slice(0, 3).join(', ')}${missingScores.length > 3 ? '...' : ''}`);
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      await axiosInstance.post(`${API_BASE}/api/evaluations`, {
        user_id: selectedAssociate.user_id,
        evaluation_data: evaluationData,
        total_score: calculateTotalScore()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      window.refreshNow = true; // Trigger dashboard refresh
      setShowEvaluationModal(false);
      fetchAssociates(); // Refresh the list
      setNotification('Evaluation submitted successfully!');
      setTimeout(() => setNotification(''), 2000);
    } catch (err) {
      if (err.response?.status === 422) {
        // Handle validation errors from backend
        const errorMessage = err.response.data.message || 'Evaluation incomplete';
        const errors = err.response.data.errors || [];
        setError(`${errorMessage}. ${errors.slice(0, 2).join(', ')}${errors.length > 2 ? '...' : ''}`);
      } else {
        setError('Failed to submit evaluation');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAssociates = associates.filter(associate =>
    associate.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    associate.organization?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedAssociates = [...filteredAssociates].sort((a, b) => {
    const numA = parseInt((a.name || '').match(/\d+/)?.[0] || 0, 10);
    const numB = parseInt((b.name || '').match(/\d+/)?.[0] || 0, 10);
    return numA - numB;
  });

  return (
    <AdminLayout>
      <Notification message={notification} onClose={() => setNotification('')} />
      <div className="evaluation-container">
        <div className="header-section">
          <h2 className="main-header">ASSOCIATE EVALUATION</h2>
          <div className="evaluation-search-bar">
            <FontAwesomeIcon icon={faSearch} className="evaluation-search-icon" />
            <input
              type="text"
              placeholder="Search associates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="evaluation-search-input"
            />
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="dashboard-loading-container">
            <div className="loading-content">
              <div className="simple-loader">
                <div className="loader-dot"></div>
                <div className="loader-dot"></div>
                <div className="loader-dot"></div>
              </div>
              <h3>Loading Evaluations</h3>
              <p>Fetching associate groups and evaluation data...</p>
            </div>
          </div>
        ) : (
          <div className="associates-grid">
            {sortedAssociates.length > 0 ? (
              sortedAssociates.map(associate => (
              <div key={associate.id} className="associate-card">
                <div className="associate-info">
                  <img
                    src={getLogoUrl(associate.logo)}
                    alt={associate.name || 'Associate Logo'}
                    className="organization-logo-lg"
                    onError={e => { e.target.src = `${window.location.origin}/Assets/disaster_logo.png`; }}
                  />
                  <div className="associate-name-lg">{associate.name}</div>
                  {associate.organization && (
                    <div className="associate-organization-lg">{associate.organization}</div>
                  )}
                </div>
                <button
                  className="evaluate-btn-lg"
                  onClick={() => handleEvaluate(associate)}
                >
                  Evaluate
                </button>
              </div>
            ))
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px 20px', 
                color: '#dc3545', 
                fontSize: '18px', 
                fontWeight: '500',
                width: '100%',
                gridColumn: '1 / -1'
              }}>
                No associate groups found. Associates will appear here when they are added to the system.
              </div>
            )}
          </div>
        )}

        {/* Evaluation Modal */}
        {showEvaluationModal && selectedAssociate && (
          <div className="modal-overlay">
            <div className="modal-content evaluation-modal">
              <div className="modal-header">
                <div className="header-content">
                  <div className="associate-info-header">
                    <img
                      src={getLogoUrl(selectedAssociate.logo)}
                      alt={selectedAssociate.name || 'Associate Logo'}
                      className="associate-logo-modal"
                      onError={e => { e.target.src = `${window.location.origin}/Assets/disaster_logo.png`; }}
                    />
                    <div className="associate-details">
                      <h3>Performance Evaluation</h3>
                      <p className="associate-name">{selectedAssociate.name}</p>
                      {selectedAssociate.organization && (
                        <p className="associate-org">{selectedAssociate.organization}</p>
                      )}
                    </div>
                  </div>
                  <button
                    className="modal-close"
                    onClick={() => {
                      setShowEvaluationModal(false);
                      setPerformanceMetrics(null);
                      setAutoScores({});
                    }}
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
              </div>
              <div className="modal-body">
                {/* Evaluation Period Selector */}
                <div className="evaluation-period-selector">
                  <label>Evaluation Period:</label>
                  <div className="period-options">
                    <button
                      className={evaluationPeriod === 'quarter' ? 'active' : ''}
                      onClick={() => handlePeriodChange('quarter')}
                    >
                      Last Quarter
                    </button>
                    <button
                      className={evaluationPeriod === '6months' ? 'active' : ''}
                      onClick={() => handlePeriodChange('6months')}
                    >
                      Last 6 Months
                    </button>
                    <button
                      className={evaluationPeriod === 'year' ? 'active' : ''}
                      onClick={() => handlePeriodChange('year')}
                    >
                      Last Year
                    </button>
                    <button
                      className={evaluationPeriod === 'custom' ? 'active' : ''}
                      onClick={() => handlePeriodChange('custom')}
                    >
                      Custom Range
                    </button>
                  </div>
                  {evaluationPeriod === 'custom' && (
                    <div className="custom-date-inputs">
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => {
                          setCustomStartDate(e.target.value);
                          if (customEndDate && e.target.value) {
                            handlePeriodChange('custom');
                          }
                        }}
                        placeholder="Start Date"
                      />
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => {
                          setCustomEndDate(e.target.value);
                          if (customStartDate && e.target.value) {
                            handlePeriodChange('custom');
                          }
                        }}
                        placeholder="End Date"
                      />
                    </div>
                  )}
                </div>

                {/* Performance Metrics Dashboard */}
                {loadingMetrics ? (
                  <div className="metrics-loading">
                    <p>Loading performance metrics...</p>
                  </div>
                ) : performanceMetrics ? (
                  <div className="performance-metrics-dashboard">
                    <h4 className="metrics-title">
                      <FontAwesomeIcon icon={faChartLine} /> Performance Metrics Summary
                    </h4>
                    <div className="metrics-grid">
                      <div className="metric-card">
                        <FontAwesomeIcon icon={faFileAlt} className="metric-icon" />
                        <div className="metric-content">
                          <div className="metric-label">Reports</div>
                          <div className="metric-value">
                            {performanceMetrics.reports.total_submitted} submitted
                          </div>
                          <div className="metric-detail">
                            {performanceMetrics.reports.approval_rate}% approved
                          </div>
                        </div>
                      </div>
                      <div className="metric-card">
                        <FontAwesomeIcon icon={faUsers} className="metric-icon" />
                        <div className="metric-content">
                          <div className="metric-label">Volunteers</div>
                          <div className="metric-value">
                            +{performanceMetrics.volunteers.recruited_in_period} recruited
                          </div>
                          <div className="metric-detail">
                            Total: {performanceMetrics.volunteers.total_count}
                          </div>
                        </div>
                      </div>
                      <div className="metric-card">
                        <FontAwesomeIcon icon={faBell} className="metric-icon" />
                        <div className="metric-content">
                          <div className="metric-label">Notifications</div>
                          <div className="metric-value">
                            {performanceMetrics.notifications.total_received} received
                          </div>
                          <div className="metric-detail">
                            {performanceMetrics.notifications.response_rate}% responded
                          </div>
                        </div>
                      </div>
                      <div className="metric-card">
                        <FontAwesomeIcon icon={faCheckCircle} className="metric-icon" />
                        <div className="metric-content">
                          <div className="metric-label">Acceptance Rate</div>
                          <div className="metric-value">
                            {performanceMetrics.notifications.acceptance_rate}%
                          </div>
                          <div className="metric-detail">
                            {performanceMetrics.notifications.accepted} accepted, {performanceMetrics.notifications.declined} declined
                          </div>
                        </div>
                      </div>
                      <div className="metric-card">
                        <FontAwesomeIcon icon={faInfoCircle} className="metric-icon" />
                        <div className="metric-content">
                          <div className="metric-label">Response Time</div>
                          <div className="metric-value">
                            {performanceMetrics.notifications.avg_response_time_hours.toFixed(1)}h
                          </div>
                          <div className="metric-detail">Average</div>
                        </div>
                      </div>
                      <div className="metric-card">
                        <FontAwesomeIcon icon={faChartLine} className="metric-icon" />
                        <div className="metric-content">
                          <div className="metric-label">System Engagement</div>
                          <div className="metric-value">
                            {performanceMetrics.system_engagement.engagement_score.toFixed(0)}%
                          </div>
                          <div className="metric-detail">
                            {performanceMetrics.system_engagement.engagement_level} ({performanceMetrics.system_engagement.login_frequency_per_week.toFixed(1)} logins/week)
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Auto-Score Toggle */}
                    <div className="auto-score-toggle">
                      <label>
                        <input
                          type="checkbox"
                          checked={showAutoScores}
                          onChange={(e) => toggleAutoScores(e.target.checked)}
                        />
                        <span>Use automatic scoring based on system metrics</span>
                      </label>
                      {showAutoScores && (
                        <div className="auto-score-info">
                          <FontAwesomeIcon icon={faInfoCircle} />
                          <span>Scores are automatically calculated based on performance metrics. You can override any score manually.</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="metrics-error">
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    <span>Unable to load performance metrics. You can still proceed with manual evaluation.</span>
                  </div>
                )}

                <div className="evaluation-intro">
                  <p>Please evaluate the associate's performance based on the following criteria. Each category has specific weight in the overall assessment.</p>
                </div>
                
                {Object.entries(KPI_CRITERIA).map(([category, sections]) => (
                  <div key={category} className={`evaluation-section ${!isCategoryComplete(category) ? 'incomplete' : ''}`}>
                    <div className="section-header">
                      <h4>{category}</h4>
                      <div className="header-right">
                        <div className="weight-badge">{(KPI_WEIGHTS[category] * 100)}%</div>
                        {!isCategoryComplete(category) && (
                          <div className="incomplete-badge">Incomplete</div>
                        )}
                      </div>
                    </div>
                    
                    {/* Evidence Card for this category */}
                    {performanceMetrics && (
                      <div className="evidence-card">
                        <div className="evidence-title">System Evidence:</div>
                        <div className="evidence-content">
                          {category === 'Volunteer Participation' && (
                            <>
                              <div>• Notification response rate: {performanceMetrics.notifications.response_rate}%</div>
                              <div>• Login frequency: {performanceMetrics.system_engagement.login_frequency_per_week.toFixed(1)} times/week</div>
                              <div>• Reports submitted: {performanceMetrics.reports.total_submitted}</div>
                              <div>• Volunteers recruited: {performanceMetrics.volunteers.recruited_in_period}</div>
                            </>
                          )}
                          {category === 'Task Accommodation and Completion' && (
                            <>
                              <div>• Report approval rate: {performanceMetrics.reports.approval_rate}%</div>
                              <div>• Total reports: {performanceMetrics.reports.total_submitted} ({performanceMetrics.reports.approved} approved, {performanceMetrics.reports.rejected} rejected)</div>
                              <div>• Notification response rate: {performanceMetrics.notifications.response_rate}%</div>
                            </>
                          )}
                          {category === 'Communication Effectiveness' && (
                            <>
                              <div>• Notification response rate: {performanceMetrics.notifications.response_rate}%</div>
                              <div>• Average response time: {performanceMetrics.notifications.avg_response_time_hours.toFixed(1)} hours</div>
                              <div>• Report approval rate: {performanceMetrics.reports.approval_rate}% (indicates communication quality)</div>
                            </>
                          )}
                          {category === 'Team Objective Above Self' && (
                            <>
                              <div>• System engagement score: {performanceMetrics.system_engagement.engagement_score.toFixed(0)}% ({performanceMetrics.system_engagement.engagement_level})</div>
                              <div>• Notification acceptance rate: {performanceMetrics.notifications.acceptance_rate}%</div>
                              <div>• Volunteers recruited: {performanceMetrics.volunteers.recruited_in_period}</div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {Object.entries(sections).map(([section, criteria]) => (
                      <div key={section} className="criteria-section">
                        <h5 className="section-title">{section}</h5>
                        {criteria.map((criterion, index) => {
                          const scoreKey = `${section}_${index}`;
                          const currentScore = evaluationData[category]?.scores[scoreKey] || 0;
                          const autoScore = autoScores[category]?.scores[scoreKey];
                          // Only consider autoScore if it's greater than 0 (0 means unscored/manual)
                          const validAutoScore = autoScore && autoScore > 0 ? autoScore : null;
                          const isAutoScore = showAutoScores && validAutoScore && currentScore === validAutoScore;
                          const metricDescription = getMetricDescription(category, section, index);
                          
                          return (
                            <div key={index} className="criterion-item">
                              <div className="criterion-text">
                                <p>{criterion}</p>
                                <div className="metric-type-indicator">
                                  {metricDescription ? (
                                    <span className="metric-badge has-metric">
                                      <FontAwesomeIcon icon={faInfoCircle} />
                                      {metricDescription}
                                    </span>
                                  ) : (
                                    <span className="metric-badge no-metric">
                                      <FontAwesomeIcon icon={faExclamationTriangle} />
                                      No Metric - Manual Scoring Required
                                    </span>
                                  )}
                                </div>
                                {isAutoScore && validAutoScore && (
                                  <div className="auto-score-badge">
                                    <FontAwesomeIcon icon={faCheckCircle} />
                                    Auto-scored: {validAutoScore} ({SCORING_SCALE[validAutoScore]})
                                  </div>
                                )}
                              </div>
                              <div className="scoring-options">
                                {Object.entries(SCORING_SCALE).map(([score, label]) => {
                                  const scoreNum = parseInt(score);
                                  const isSelected = currentScore > 0 && currentScore == scoreNum;
                                  return (
                                    <label key={score} className={`radio-option ${isAutoScore && validAutoScore && scoreNum === validAutoScore ? 'auto-scored' : ''}`}>
                                      <input
                                        type="radio"
                                        name={`${category}_${section}_${index}`}
                                        value={score}
                                        checked={isSelected}
                                        onChange={(e) => handleScoreChange(category, section, index, e.target.value)}
                                      />
                                      <span className="radio-custom"></span>
                                      <span className="score-label">{score}</span>
                                      <span className="score-hyphen">-</span>
                                      <span className="score-text">{label}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                    
                    <div className="category-score-display">
                      <div className="score-label">Category Score</div>
                      <div className="score-value">{calculateCategoryScore(category).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
                
                <div className="evaluation-summary">
                  <div className="summary-header">
                    <h4>Evaluation Summary</h4>
                  </div>
                  <div className="total-score-display">
                    <div className="total-score-label">Total Weighted Score</div>
                    <div className="total-score-value">{calculateTotalScore()}</div>
                  </div>
                </div>
                
                <div className="modal-actions">
                  <button
                    className="cancel-btn"
                    onClick={() => {
                      setShowEvaluationModal(false);
                      setPerformanceMetrics(null);
                      setAutoScores({});
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className={`submit-btn ${validateEvaluation().length > 0 || submitting ? 'disabled' : ''}`}
                    onClick={handleSubmitEvaluation}
                    disabled={validateEvaluation().length > 0 || submitting}
                    style={{
                      opacity: submitting ? 0.7 : 1,
                      cursor: (validateEvaluation().length > 0 || submitting) ? 'not-allowed' : 'pointer',
                      pointerEvents: submitting ? 'none' : 'auto'
                    }}
                  >
                    <FontAwesomeIcon icon={faSave} /> 
                    {submitting ? 'Submitting...' : (validateEvaluation().length > 0 ? 'Complete All Criteria' : 'Submit Evaluation')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default Evaluation;
