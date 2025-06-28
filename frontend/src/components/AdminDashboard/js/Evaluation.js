import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faSave, faTimes } from '@fortawesome/free-solid-svg-icons';
import '../css/Evaluation.css';
import { getLogoUrl } from '../../../utils/url';

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

function Evaluation() {
  const [associates, setAssociates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAssociate, setSelectedAssociate] = useState(null);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [evaluationData, setEvaluationData] = useState({});
  const API_BASE = 'http://localhost:8000';

  useEffect(() => {
    fetchAssociates();
  }, []);

  const fetchAssociates = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_BASE}/api/associate-groups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssociates(response.data);
    } catch (err) {
      setError('Failed to fetch associates');
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async (associate) => {
    // Fetch the latest data for this associate before showing the modal
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_BASE}/api/associate-groups/${associate.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedAssociate(response.data);
    } catch (err) {
      console.error('Error fetching latest associate data:', err);
      setSelectedAssociate(associate);
    }
    
    setShowEvaluationModal(true);
    // Initialize evaluation data structure
    const initialData = {};
    Object.keys(KPI_CRITERIA).forEach(category => {
      initialData[category] = {
        scores: {},
        comments: ''
      };
      Object.keys(KPI_CRITERIA[category]).forEach(section => {
        KPI_CRITERIA[category][section].forEach((_, index) => {
          initialData[category].scores[`${section}_${index}`] = 0;
        });
      });
    });
    setEvaluationData(initialData);
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

  const handleCommentChange = (category, value) => {
    setEvaluationData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        comments: value
      }
    }));
  };

  const calculateCategoryScore = (category) => {
    const scores = Object.values(evaluationData[category]?.scores || {});
    if (scores.length === 0) return 0;
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  };

  const calculateTotalScore = () => {
    let totalWeightedScore = 0;
    Object.entries(KPI_WEIGHTS).forEach(([category, weight]) => {
      const categoryScore = calculateCategoryScore(category);
      totalWeightedScore += categoryScore * weight;
    });
    return totalWeightedScore.toFixed(2);
  };

  const handleSubmitEvaluation = async () => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.post(`http://localhost:8000/api/evaluations`, {
        user_id: selectedAssociate.user_id,
        evaluation_data: evaluationData,
        total_score: calculateTotalScore()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      window.refreshNow = true; // Trigger dashboard refresh
      setShowEvaluationModal(false);
      fetchAssociates(); // Refresh the list
    } catch (err) {
      setError('Failed to submit evaluation');
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
      <div className="evaluation-container">
        <div className="header-section">
          <h2>ASSOCIATE EVALUATION</h2>
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
          <div className="loading">Loading...</div>
        ) : (
          <div className="associates-grid">
            {sortedAssociates.map(associate => (
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
            ))}
          </div>
        )}

        {/* Evaluation Modal */}
        {showEvaluationModal && selectedAssociate && (
          <div className="modal-overlay">
            <div className="modal-content evaluation-modal">
              <div className="modal-header">
                <h3>Evaluate {selectedAssociate.name}</h3>
                <button
                  className="modal-close"
                  onClick={() => setShowEvaluationModal(false)}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              <div className="modal-body">
                {Object.entries(KPI_CRITERIA).map(([category, sections]) => (
                  <div key={category} className="evaluation-section">
                    <h4>{category} ({(KPI_WEIGHTS[category] * 100)}%)</h4>
                    {Object.entries(sections).map(([section, criteria]) => (
                      <div key={section} className="criteria-section">
                        <h5>{section}</h5>
                        {criteria.map((criterion, index) => (
                          <div key={index} className="criterion">
                            <p>{criterion}</p>
                            <select
                              value={evaluationData[category]?.scores[`${section}_${index}`] || 0}
                              onChange={(e) => handleScoreChange(category, section, index, e.target.value)}
                            >
                              <option value={0}>Select score</option>
                              {Object.entries(SCORING_SCALE).map(([score, label]) => (
                                <option key={score} value={score}>
                                  {score} - {label}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    ))}
                    <div className="comments-section">
                      <label>Comments:</label>
                      <textarea
                        value={evaluationData[category]?.comments || ''}
                        onChange={(e) => handleCommentChange(category, e.target.value)}
                        placeholder="Add comments..."
                      />
                    </div>
                    <div className="category-score">
                      Category Score: {calculateCategoryScore(category).toFixed(2)}
                    </div>
                  </div>
                ))}
                <div className="total-score">
                  Total Weighted Score: {calculateTotalScore()}
                </div>
                <div className="modal-actions">
                  <button
                    className="submit-btn"
                    onClick={handleSubmitEvaluation}
                  >
                    <FontAwesomeIcon icon={faSave} /> Submit Evaluation
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