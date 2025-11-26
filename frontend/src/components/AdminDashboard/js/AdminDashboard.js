import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import AdminLayout from './AdminLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faCalendarAlt, faChartLine, faUserCheck, faCertificate, faPlus, faChevronLeft, faChevronRight, faFilePdf } from '@fortawesome/free-solid-svg-icons';
import axiosInstance from '../../../utils/axiosConfig';
import { startMaintenanceCheck, stopMaintenanceCheck } from '../../../utils/maintenanceChecker';
import '../css/AdminDashboard.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { format } from 'date-fns';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { parseISO } from 'date-fns';
import moment from 'moment';
import { getLogoUrl, API_BASE } from '../../../utils/url';
import Modal from 'react-modal';
import CertificateModal from './CertificateModal';
import EventModal from './EventModal';
import EventDetailsModal from './EventDetailsModal';
import EventsListModal from './EventsListModal';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const localizer = momentLocalizer(moment);

// Helper functions
const getPerformanceColor = (score) => {
  score = Number(score);
  if (score >= 3.5) return '#28a745';
  if (score >= 2.5) return '#17a2b8';
  if (score >= 1.5) return '#ffc107';
  return '#dc3545';
};

// Custom Event Component with Hover Tooltip
const CustomEvent = ({ event }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const eventRef = useRef(null);
  const tooltipRef = useRef(null);
  const hoverTimeoutRef = useRef(null);

  const eventCount = event.resource?.count || event.resource?.events?.length || 1;
  const events = event.resource?.events || [];

  // Determine background color based on event status
  const getEventBackgroundColor = () => {
    const now = new Date();
    let backgroundColor = '#5a6268'; // Default grey color (hover color)
    let hasInProgress = false;
    let allFinished = true; // Start with true, will be false if any event is not finished
    let allNotStarted = true; // Start with true, will be false if any event has started

    if (events.length > 0) {
      events.forEach(eventItem => {
        const startDate = new Date(eventItem.start_date);
        const endDate = new Date(eventItem.end_date);
        
        // Check if event is in progress (started but not finished)
        if (startDate <= now && endDate >= now) {
          hasInProgress = true;
          allNotStarted = false;
          allFinished = false;
        }
        // Check if event has finished (endDate < now)
        else if (endDate < now) {
          allNotStarted = false;
          // Keep allFinished as true only if all events are finished
        }
        // Check if event hasn't started yet (startDate > now)
        else if (startDate > now) {
          allFinished = false;
          // Keep allNotStarted as true only if all events haven't started
        }
        // Edge case: event started but logic above should catch it
        else if (startDate <= now) {
          allNotStarted = false;
          allFinished = false;
        }
      });
      
      // Apply colors based on status (using hover colors as normal colors)
      // Priority: If ANY event is in progress → GREEN
      if (hasInProgress) {
        backgroundColor = '#218838'; // Green hover color if any event is in progress (started)
      }
      // If ALL events are finished → GREY
      else if (allFinished && events.length > 0) {
        backgroundColor = '#5a6268'; // Grey hover color if all events are already done
      }
      // If ALL events are not started → GREY
      else if (allNotStarted) {
        backgroundColor = '#5a6268'; // Grey hover color if all events are not started
      }
      // Default to grey
      else {
        backgroundColor = '#5a6268'; // Default grey hover color
      }
    }

    return backgroundColor;
  };

  const backgroundColor = getEventBackgroundColor();

  // Determine event status class for CSS targeting
  const getEventStatusClass = () => {
    const now = new Date();
    let hasInProgress = false;
    let allFinished = true; // Start with true, will be false if any event is not finished
    let allNotStarted = true; // Start with true, will be false if any event has started

    if (events.length > 0) {
      events.forEach(eventItem => {
        const startDate = new Date(eventItem.start_date);
        const endDate = new Date(eventItem.end_date);
        
        // Check if event is in progress (started but not finished)
        if (startDate <= now && endDate >= now) {
          hasInProgress = true;
          allNotStarted = false;
          allFinished = false;
        }
        // Check if event has finished (endDate < now)
        else if (endDate < now) {
          allNotStarted = false;
          // Keep allFinished as true only if all events are finished
        }
        // Check if event hasn't started yet (startDate > now)
        else if (startDate > now) {
          allFinished = false;
          // Keep allNotStarted as true only if all events haven't started
        }
        // Edge case: event started but logic above should catch it
        else if (startDate <= now) {
          allNotStarted = false;
          allFinished = false;
        }
      });
    }

    // Priority: If ANY event is in progress → event-in-progress
    if (hasInProgress) return 'event-in-progress';
    // If ALL events are finished → event-finished
    if (allFinished && events.length > 0) return 'event-finished';
    // If ALL events are not started → event-not-started
    if (allNotStarted) return 'event-not-started';
    return '';
  };

  const eventStatusClass = getEventStatusClass();

  // Handle hover to show tooltip
  const handleMouseEnter = () => {
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    // Show tooltip immediately for responsive feel
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    // Small delay before hiding to allow moving to tooltip
    hoverTimeoutRef.current = setTimeout(() => {
      setShowTooltip(false);
    }, 150);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  // Update tooltip position when badge is hovered
  const updateTooltipPosition = (e) => {
    if (eventRef.current) {
      const rect = eventRef.current.getBoundingClientRect();
      const tooltipOffset = 12; // Distance from badge to tooltip
      setTooltipPosition({
        top: window.scrollY + rect.top - tooltipOffset,
        left: window.scrollX + rect.left + rect.width / 2
      });
    }
  };

  const handleBadgeMouseEnter = (e) => {
    e.stopPropagation();
    updateTooltipPosition(e);
    handleMouseEnter();
  };

  return (
    <>
      <div
        ref={eventRef}
        className={`custom-calendar-event ${eventStatusClass}`}
        style={{
          position: 'relative',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <div 
          className="event-count-badge"
          style={{ 
            backgroundColor: backgroundColor || '#6c757d',
            background: backgroundColor || '#6c757d'
          }}
          onMouseEnter={handleBadgeMouseEnter}
          onMouseLeave={(e) => {
            e.stopPropagation();
            handleMouseLeave();
          }}
          onMouseMove={updateTooltipPosition}
        >
          {eventCount}
        </div>
      </div>
      {showTooltip && events.length > 0 && createPortal(
        <div 
          ref={tooltipRef}
          className="event-tooltip event-tooltip-portal"
          style={{
            position: 'fixed',
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            transform: 'translate(-50%, calc(-100% - 4px))',
            pointerEvents: 'auto'
          }}
          onMouseEnter={(e) => {
            e.stopPropagation();
            handleMouseEnter();
          }}
          onMouseLeave={(e) => {
            e.stopPropagation();
            handleMouseLeave();
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <div className="event-tooltip-header">
            {eventCount} {eventCount === 1 ? 'Event' : 'Events'}
          </div>
          <div className="event-tooltip-list">
            {events.map((ev, index) => (
              <div key={ev.id || index} className="event-tooltip-item">
                <span className="event-tooltip-name">{ev.title || ev.name || 'Untitled Event'}</span>
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

// Custom Calendar Toolbar
function CustomCalendarToolbar({ date, onNavigate, onAddEvent, onToday }) {
  const monthYear = moment(date).format('MMMM YYYY');
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 240, justifyContent: 'center' }}>
        {/* Today Button */}
        <button
          className="add-event-btn calendar-today-btn"
          onClick={onToday}
          aria-label="Today"
          style={{
            minWidth: 0,
            fontWeight: 700,
            marginRight: 8,
            letterSpacing: '0.3px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#495057',
            color: 'white',
            borderRadius: 8,
            border: 'none',
            boxShadow: '0 2px 8px rgba(73, 80, 87, 0.2)',
            cursor: 'pointer',
            lineHeight: 1,
          }}
        >
          Today
        </button>
        {/* Existing left arrow */}
        <button
          className="calendar-nav-btn calendar-nav-btn-icon"
          onClick={() => onNavigate('PREV')}
          aria-label="Previous Month"
        >
          <FontAwesomeIcon icon={faChevronLeft} style={{ fontSize: '1rem' }} />
        </button>
        <span className="calendar-month-year" style={{ fontWeight: 600, minWidth: 120, textAlign: 'center' }}>{monthYear}</span>
        <button
          className="calendar-nav-btn calendar-nav-btn-icon"
          onClick={() => onNavigate('NEXT')}
          aria-label="Next Month"
        >
          <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: '1rem' }} />
        </button>
        <button
          className="add-event-btn calendar-add-event-btn"
          onClick={onAddEvent}
          style={{ 
            marginLeft: 8,
            fontWeight: 700
          }}
          aria-label="Add Event"
        >
          <FontAwesomeIcon icon={faPlus} className="add-event-icon" />
          <span>Event</span>
        </button>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [recentEvaluations, setRecentEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAssociate, setSelectedAssociate] = useState(null);
  const [associatesPerformance, setAssociatesPerformance] = useState([]);
  const [activeMembers, setActiveMembers] = useState([]);
  const [activeMembersStats, setActiveMembersStats] = useState({ total_associates: 0, active_associates: 0 });
  const [activityPeriod, setActivityPeriod] = useState('day');
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [groupPerformance, setGroupPerformance] = useState({});
  const [evaluations, setEvaluations] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [selectedAssociateData, setSelectedAssociateData] = useState(null);
  const [refreshNow, setRefreshNow] = useState(false);
  const [statisticsData, setStatisticsData] = useState(null);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [showAllEvaluations, setShowAllEvaluations] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [certificateData, setCertificateData] = useState({
    associate: '',
    date: '',
    signature: '',
    message: '',
    format: 'pdf',
  });
  const [showEventModal, setShowEventModal] = useState(false);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showEventsListModal, setShowEventsListModal] = useState(false);
  const [preserveCalendarEvents, setPreserveCalendarEvents] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState([]);
  const [selectedDayDate, setSelectedDayDate] = useState(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isGeneratingIndividualPDF, setIsGeneratingIndividualPDF] = useState(false);
  const [showIndividualSuccessMessage, setShowIndividualSuccessMessage] = useState(false);
  const [showEventSuccessMessage, setShowEventSuccessMessage] = useState(false);
  const [userName, setUserName] = useState('Admin');

  // Fetch user profile to get the admin's name
  const fetchUserProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (!token) return;
      
      const response = await axiosInstance.get(`${API_BASE}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && response.data.name) {
        setUserName(response.data.name);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  }, []);

  const fetchActiveMembers = useCallback(async (period = 'day') => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (!token) {
        console.error('No authentication token found');
        return;
      }
      
      const response = await axiosInstance.get(`${API_BASE}/api/members/active?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.members && response.data.statistics) {
        setActiveMembers(response.data.members);
        setActiveMembersStats(response.data.statistics);
      } else {
        console.error('Invalid response format:', response.data);
      }
    } catch (err) {
      console.error('Error fetching active members:', err);
      if (err.response) {
        console.error('Error response:', err.response.data);
        console.error('Error status:', err.response.status);
      }
    }
  }, []);

  const formatTimeSince = (dateString) => {
    if (!dateString) return 'Never';
    
    const now = new Date();
    const activityDate = new Date(dateString);
    const diffInMinutes = Math.floor((now - activityDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths}mo ago`;
  };

  const processAssociatePerformance = (evaluations, members) => {
    const performanceByGroup = {};

    const userIdToGroupId = members.reduce((acc, member) => {
      if (member.user_id) {
        acc[member.user_id] = member.id;
      }
      return acc;
    }, {});
    
    // Initialize performance data for all members, keyed by group id
    members.forEach(member => {
      performanceByGroup[member.id] = {
        id: member.id,
        user_id: member.user_id,
        name: member.name,
        organization: member.organization,
        director: member.director || (member.user && member.user.name) || '',
        logo: member.logo,
        evaluations: [],
        averageScores: {
          'Volunteer Participation': 0,
          'Task Accommodation and Completion': 0,
          'Communication Effectiveness': 0,
          'Team Objective Above Self': 0
        },
        totalScore: 0,
        lastEvaluationDate: null
      };
    });

    // Find the latest evaluation for each user
    const latestEvaluations = {};
    evaluations.forEach(evaluation => {
      if (!evaluation.user_id || !evaluation.evaluation_data) return;
      if (
        !latestEvaluations[evaluation.user_id] ||
        new Date(evaluation.created_at) > new Date(latestEvaluations[evaluation.user_id].created_at)
      ) {
        latestEvaluations[evaluation.user_id] = evaluation;
      }
    });

    // Process only the latest evaluation for each user
    Object.entries(latestEvaluations).forEach(([userId, evaluation]) => {
      const groupId = userIdToGroupId[userId];
      if (!groupId) return;

      const associatePerformance = performanceByGroup[groupId];
      if (!associatePerformance) return;

      try {
        const evalData = typeof evaluation.evaluation_data === 'string'
          ? JSON.parse(evaluation.evaluation_data)
          : evaluation.evaluation_data;

        Object.entries(evalData).forEach(([category, data]) => {
          if (!data || !data.scores) return;
          const scores = Object.values(data.scores)
            .map(score => Number(score))
            .filter(score => !isNaN(score) && score > 0);
          if (scores.length > 0) {
            const average = scores.reduce((a, b) => a + b, 0) / scores.length;
            associatePerformance.averageScores[category] = Number(average.toFixed(2));
          }
        });

        const validScores = Object.values(associatePerformance.averageScores)
          .filter(score => !isNaN(score) && score > 0);
        if (validScores.length > 0) {
          associatePerformance.totalScore = Number(
            (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(2)
          );
        }

        associatePerformance.evaluations = [evaluation];
        associatePerformance.lastEvaluationDate = new Date(evaluation.created_at);
      } catch (error) {
        console.error('Error processing evaluation data:', error);
      }
    });

    return Object.values(performanceByGroup);
  };

  const calculateGroupPerformance = (evaluations) => {
    if (!evaluations.length) return {};
    
    const categories = {
      'Volunteer Participation': [],
      'Task Accommodation and Completion': [],
      'Communication Effectiveness': [],
      'Team Objective Above Self': []
    };

    evaluations.forEach(evaluation => {
      if (evaluation.evaluation_data) {
        let data = evaluation.evaluation_data;
        if (typeof data === 'string') {
          data = JSON.parse(data);
        }

        Object.entries(data).forEach(([category, categoryData]) => {
          if (categoryData && categoryData.scores) {
            const scores = Object.values(categoryData.scores)
              .filter(score => !isNaN(Number(score)))
              .map(Number);
            
            if (scores.length > 0) {
              const average = scores.reduce((a, b) => a + b, 0) / scores.length;
              categories[category].push(average);
            }
          }
        });
      }
    });

    // Calculate final averages
    const result = {};
    Object.entries(categories).forEach(([category, scores]) => {
      if (scores.length > 0) {
        result[category] = Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2));
      } else {
        result[category] = 0;
      }
    });

    return result;
  };

  // Individual performance chart data - now using selectedAssociateData
  const associateBarData = useMemo(() => {
    console.log('Generating chart data for:', selectedAssociateData);
    
    if (!selectedAssociateData) {
      return {
        labels: [],
        datasets: [{
          label: 'No Data Available',
          data: [],
          backgroundColor: [],
          borderRadius: 5
        }]
      };
    }

    const categories = [
      'VP', // Volunteer Participation
      'TAC', // Task Accommodation and Completion
      'CE', // Communication Effectiveness
      'TOAS' // Team Objective Above Self
    ];

    const chartData = {
      labels: categories,
      datasets: [{
        label: `${selectedAssociateData.name}'s Performance Scores`,
        data: [
          selectedAssociateData.averageScores['Volunteer Participation'] || 0,
          selectedAssociateData.averageScores['Task Accommodation and Completion'] || 0,
          selectedAssociateData.averageScores['Communication Effectiveness'] || 0,
          selectedAssociateData.averageScores['Team Objective Above Self'] || 0
        ],
        backgroundColor: categories.map((cat, idx) => 
          getPerformanceColor([
            selectedAssociateData.averageScores['Volunteer Participation'],
            selectedAssociateData.averageScores['Task Accommodation and Completion'],
            selectedAssociateData.averageScores['Communication Effectiveness'],
            selectedAssociateData.averageScores['Team Objective Above Self']
          ][idx] || 0)
        ),
        borderRadius: 5
      }]
    };

    console.log('Generated chart data:', chartData);
    return chartData;
  }, [selectedAssociateData]);

  // Performance comparison chart data
  const comparisonData = useMemo(() => ({
    labels: associatesPerformance.map(a => a.name),
    datasets: [{
      label: 'Overall Performance Score',
      data: associatesPerformance.map(a => a.totalScore),
      backgroundColor: associatesPerformance.map(a => getPerformanceColor(a.totalScore)),
      borderRadius: 5
    }]
  }), [associatesPerformance]);

  // Line chart data for individual associate performance over time
  const individualTrendData = useMemo(() => {
    if (!selectedAssociateData || !evaluations) {
      return {
        labels: [],
        datasets: [{
          label: 'No Data Available',
          data: [],
          borderColor: '#6c757d',
          backgroundColor: 'rgba(108, 117, 125, 0.1)',
          tension: 0.4
        }]
      };
    }

    // Get all evaluations for the selected associate, sorted by date
    const associateEvaluations = evaluations
      .filter(ev => String(ev.user_id) === String(selectedAssociateData.user_id))
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    if (associateEvaluations.length === 0) {
      return {
        labels: [],
        datasets: [{
          label: 'No Evaluations Available',
          data: [],
          borderColor: '#6c757d',
          backgroundColor: 'rgba(108, 117, 125, 0.1)',
          tension: 0.4
        }]
      };
    }

    const labels = associateEvaluations.map(ev => format(parseISO(ev.created_at), 'MMM dd'));
    const scores = associateEvaluations.map(ev => ev.total_score);

    return {
      labels,
      datasets: [{
        label: `${selectedAssociateData.name}'s Performance Trend`,
        data: scores,
        borderColor: '#007bff',
        backgroundColor: 'rgba(0, 123, 255, 0.1)',
        borderWidth: 3,
        pointBackgroundColor: '#007bff',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        tension: 0.4,
        fill: true
      }]
    };
  }, [selectedAssociateData, evaluations]);

  // Line chart data for KPI trends over time
  const kpiCategories = useMemo(() => [
    'Volunteer Participation',
    'Task Accommodation and Completion',
    'Communication Effectiveness',
    'Team Objective Above Self'
  ], []);

  const kpiColors = useMemo(() => ['#007bff', '#28a745', '#ffc107', '#dc3545'], []);

  const kpiTrendData = useMemo(() => {
    if (statisticsData && statisticsData.kpi_trends) {
      // Get all unique months from all KPI data
      const allMonths = new Set();
      kpiCategories.forEach(category => {
        if (statisticsData.kpi_trends[category]) {
          statisticsData.kpi_trends[category].forEach(item => {
            allMonths.add(item.month);
          });
        }
      });
      const sortedMonths = Array.from(allMonths).sort((a, b) => new Date(a) - new Date(b));
      // Always include all four datasets
      const datasets = kpiCategories.map((category, index) => {
        let data = sortedMonths.map(month => {
          const monthData = statisticsData.kpi_trends[category]?.find(item => item.month === month);
          return monthData ? monthData.average_score : null;
        });
        // If data is all null or empty, add a single null to force legend display
        if (!data.length || data.every(v => v === null)) {
          data = [null];
        }
        return {
          label: category,
          data,
          borderColor: kpiColors[index],
          backgroundColor: kpiColors[index].replace(')', ', 0.1)').replace('rgb', 'rgba'),
          borderWidth: 2,
          pointBackgroundColor: kpiColors[index],
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.4,
          spanGaps: true
        };
      });
      return { labels: sortedMonths.map(m => m ? m : ''), datasets };
    }
    // If no data, still show all legends
    return {
      labels: [''],
      datasets: kpiCategories.map((category, index) => ({
        label: category,
        data: [null],
        borderColor: kpiColors[index],
        backgroundColor: kpiColors[index].replace(')', ', 0.1)').replace('rgb', 'rgba'),
        borderWidth: 2,
        pointBackgroundColor: kpiColors[index],
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
        spanGaps: true
      }))
    };
  }, [statisticsData, kpiCategories, kpiColors]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 4,
        ticks: {
          stepSize: 1
        }
      }
    },
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };

  // Line chart options with enhanced styling
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 4,
        ticks: {
          stepSize: 1
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    },
    elements: {
      point: {
        hoverRadius: 8
      }
    }
  };

  // Handle associate selection change
  const handleAssociateChange = (event) => {
    const newSelectedId = event.target.value;
    setSelectedAssociate(newSelectedId);
  };

  // Fetch dashboard data with optional associate ID
  const fetchDashboardData = useCallback(async (specificAssociateId = null, isPolling = false) => {
    if (!isPolling) setLoading(true);
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const [evaluationsRes, associatesRes, statisticsRes] = await Promise.all([
        axiosInstance.get(`${API_BASE}/api/evaluations`, { headers: { Authorization: `Bearer ${token}` } }),
        axiosInstance.get(`${API_BASE}/api/associate-groups`, { headers: { Authorization: `Bearer ${token}` } }),
        axiosInstance.get(`${API_BASE}/api/evaluations/statistics`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const allEvaluations = evaluationsRes.data;
      const allAssociates = associatesRes.data;
      const statsData = statisticsRes.data;

      setEvaluations(allEvaluations);
      setStatisticsData(statsData);

      const performanceData = processAssociatePerformance(allEvaluations, allAssociates);
      setAssociatesPerformance(performanceData);
      
      const groupPerf = calculateGroupPerformance(allEvaluations);
      setGroupPerformance(groupPerf);

      const sortedAllEvaluations = [...allEvaluations].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setRecentEvaluations(sortedAllEvaluations.slice(0, 5));

      // Automatically select the first associate if none is selected
      if (!selectedAssociate && allAssociates.length > 0) {
        const firstAssociateId = allAssociates[0].id;
        setSelectedAssociate(firstAssociateId);
        const firstAssociateData = performanceData.find(p => p.id === firstAssociateId);
        setSelectedAssociateData(firstAssociateData);
      }

      // Only update calendar events if not polling and if a specific associate was requested
      // This prevents the live polling from overwriting manually added events
      if (!isPolling && specificAssociateId) {
        const targetAssociate = performanceData.find(a => String(a.id) === String(specificAssociateId));
        if (targetAssociate) {
          setSelectedAssociateData(targetAssociate);
          const associateEvals = allEvaluations.filter(ev => String(ev.user_id) === String(specificAssociateId));
          setCalendarEvents(
            associateEvals.map(ev => ({
              title: `Evaluation: ${targetAssociate.name}`,
              start: parseISO(ev.created_at),
              end: parseISO(ev.created_at),
              allDay: true
            }))
          );
        } else {
          setCalendarEvents([]);
        }
      }

      setLastUpdate(Date.now());
    } catch (err) {
      console.error('Error in fetchDashboardData:', err);
      setError('Failed to fetch dashboard data: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [selectedAssociate]);

  // Update selected associate data whenever selectedAssociate or associatesPerformance changes
  // Start maintenance mode checking for logged-in users
  useEffect(() => {
    // Start periodic maintenance check
    startMaintenanceCheck();
    
    // Cleanup on unmount
    return () => {
      stopMaintenanceCheck();
    };
  }, []);

  // Update selected associate data whenever selectedAssociate or associatesPerformance changes
  useEffect(() => {
    if (selectedAssociate && associatesPerformance.length > 0) {
      const currentAssociateData = associatesPerformance.find(a => String(a.id) === String(selectedAssociate));
      if (currentAssociateData) {
        setSelectedAssociateData(currentAssociateData);
        // Only update calendar events if we don't have any events yet (initial load)
        // or if we haven't set the preserve flag (meaning no manual events were created)
        if (calendarEvents.length === 0 && !preserveCalendarEvents) {
        const associateEvals = evaluations.filter(ev => String(ev.user_id) === String(selectedAssociate));
        setCalendarEvents(
          associateEvals.map(ev => ({
            title: `Evaluation: ${currentAssociateData.name}`,
            start: parseISO(ev.created_at),
            end: parseISO(ev.created_at),
            allDay: true
          }))
        );
      }
    }
    }
  }, [selectedAssociate, associatesPerformance, preserveCalendarEvents, calendarEvents.length, evaluations]);

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
    fetchCalendarEventsOnly();
    fetchUserProfile();
  }, [fetchDashboardData, fetchUserProfile]);

  // Fetch active members after initial data is loaded
  // Start maintenance mode checking for logged-in users
  useEffect(() => {
    // Start periodic maintenance check
    startMaintenanceCheck();
    
    // Cleanup on unmount
    return () => {
      stopMaintenanceCheck();
    };
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchActiveMembers(activityPeriod);
    }
  }, [loading, fetchActiveMembers, activityPeriod]);

  // Separate function to fetch calendar events without interfering with live polling
  const fetchCalendarEventsOnly = async () => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await axiosInstance.get(`${API_BASE}/api/calendar-events`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Raw calendar events response logged for debugging (remove in production)
      
      if (response.data.success) {
        // Group events by date and count them
        const eventsByDate = {};
        response.data.data.forEach(event => {
          const startDate = new Date(event.start_date);
          // Use local date components to avoid timezone issues
          const year = startDate.getFullYear();
          const month = String(startDate.getMonth() + 1).padStart(2, '0');
          const day = String(startDate.getDate()).padStart(2, '0');
          const dateKey = `${year}-${month}-${day}`; // YYYY-MM-DD format in local timezone
          
          if (!eventsByDate[dateKey]) {
            eventsByDate[dateKey] = [];
          }
          eventsByDate[dateKey].push(event);
        });
        
        // Create calendar events with count as title
        const events = Object.entries(eventsByDate).map(([dateKey, dayEvents]) => {
          // Create date from dateKey in local timezone (midnight)
          const [year, month, day] = dateKey.split('-').map(Number);
          const startDate = new Date(year, month - 1, day, 0, 0, 0, 0);
          
          return {
            id: `date-${dateKey}`,
            title: dayEvents.length.toString(), // Show count instead of title
            start: startDate,
            end: startDate,
            allDay: true,
            resource: {
              date: dateKey,
              events: dayEvents,
              count: dayEvents.length
            },
            // Ensure these properties are set for React Big Calendar
            start_date: startDate,
            end_date: startDate,
            display: 'block'
          };
        });
        
        console.log('Processed calendar events with counts:', events);
        setCalendarEvents(events);
      } else {
        // No events found or API error logged for debugging (remove in production)
        setCalendarEvents([]);
      }
    } catch (err) {
      console.error('Error fetching calendar events:', err);
      setCalendarEvents([]);
    }
  };

  // Debug calendar events
  // Start maintenance mode checking for logged-in users
  useEffect(() => {
    // Start periodic maintenance check
    startMaintenanceCheck();
    
    // Cleanup on unmount
    return () => {
      stopMaintenanceCheck();
    };
  }, []);

  useEffect(() => {
    console.log('Calendar events state updated:', calendarEvents);
  }, [calendarEvents]);

  // Polling for live updates (debounced to 10 seconds)
  // Start maintenance mode checking for logged-in users
  useEffect(() => {
    // Start periodic maintenance check
    startMaintenanceCheck();
    
    // Cleanup on unmount
    return () => {
      stopMaintenanceCheck();
    };
  }, []);

  useEffect(() => {
    const pollInterval = setInterval(() => {
      if (!loading && !refreshNow) {
        fetchDashboardData(selectedAssociate, true);
      }
    }, 10000); // Poll every 10 seconds (more efficient than 3 seconds)
    return () => clearInterval(pollInterval);
  }, [selectedAssociate, loading, refreshNow, fetchDashboardData]);

  // Listen for refreshNow flag (set by Evaluation.js after evaluation)
  // Start maintenance mode checking for logged-in users
  useEffect(() => {
    // Start periodic maintenance check
    startMaintenanceCheck();
    
    // Cleanup on unmount
    return () => {
      stopMaintenanceCheck();
    };
  }, []);

  useEffect(() => {
    if (window.refreshNow) {
      setRefreshNow(true);
      window.refreshNow = false;
    }
  }, []);

  // Start maintenance mode checking for logged-in users
  useEffect(() => {
    // Start periodic maintenance check
    startMaintenanceCheck();
    
    // Cleanup on unmount
    return () => {
      stopMaintenanceCheck();
    };
  }, []);

  useEffect(() => {
    if (refreshNow) {
      fetchDashboardData(selectedAssociate, false).then(() => setRefreshNow(false));
    }
  }, [refreshNow, selectedAssociate, fetchDashboardData]);

  // Add event listener for dashboard refresh trigger
  // Start maintenance mode checking for logged-in users
  useEffect(() => {
    // Start periodic maintenance check
    startMaintenanceCheck();
    
    // Cleanup on unmount
    return () => {
      stopMaintenanceCheck();
    };
  }, []);

  useEffect(() => {
    const refreshListener = () => {
      fetchDashboardData(selectedAssociate, true);
    };
    window.addEventListener('refreshDashboardData', refreshListener);
    return () => window.removeEventListener('refreshDashboardData', refreshListener);
  }, [selectedAssociate, fetchDashboardData]);

  // Add useEffect to force refresh when switching associates
  // Start maintenance mode checking for logged-in users
  useEffect(() => {
    // Start periodic maintenance check
    startMaintenanceCheck();
    
    // Cleanup on unmount
    return () => {
      stopMaintenanceCheck();
    };
  }, []);

  useEffect(() => {
    if (selectedAssociate) {
      const selectedData = associatesPerformance.find(a => String(a.id) === String(selectedAssociate));
      console.log('Current selected associate data:', selectedData);
    }
  }, [selectedAssociate, associatesPerformance]);

  // Add last update time display in the JSX
  const renderLastUpdate = () => (
    <div className="last-update">
      Last updated: {format(lastUpdate, 'PPpp')}
    </div>
  );

  // Modify the Recent Evaluations section in the JSX
  const renderRecentEvaluations = () => (
    <div className="evaluations-list">
      {recentEvaluations.map(evaluation => {
        const associate = associatesPerformance.find(a => a.user_id === evaluation.user_id);
        const logo = associate ? getLogoUrl(associate.logo) : getLogoUrl(null);
        
        return (
          <div key={evaluation.id} className="evaluation-item">
            <img src={logo} alt="logo" className="associate-logo-small" />
            <div className="evaluation-details">
              <span className="associate-name">
                {evaluation.user ? evaluation.user.name : 'Unknown User'}
              </span>
              <span className="organization-name">
                {evaluation.user ? evaluation.user.organization : 'No Organization'}
              </span>
            </div>
            <div className="evaluation-score" style={{ color: getPerformanceColor(evaluation.total_score) }}>
              {evaluation.total_score}
            </div>
            <div className="evaluation-date">
              {format(parseISO(evaluation.created_at), 'MMM dd')}
            </div>
          </div>
        );
      })}
      <button className="see-more-btn" onClick={() => setShowAllEvaluations(true)}>See More</button>
    </div>
  );

  // Add debugging useEffect
  // Start maintenance mode checking for logged-in users
  useEffect(() => {
    // Start periodic maintenance check
    startMaintenanceCheck();
    
    // Cleanup on unmount
    return () => {
      stopMaintenanceCheck();
    };
  }, []);

  useEffect(() => {
    console.log('Selected Associate:', selectedAssociate);
    console.log('Associates Performance:', associatesPerformance);
    console.log('Bar Data:', associateBarData);
  }, [selectedAssociate, associatesPerformance, associateBarData]);

  const handleCalendarNavigate = (action) => {
    if (action === 'PREV') {
      setCalendarDate(prev => moment(prev).subtract(1, 'month').toDate());
    } else if (action === 'NEXT') {
      setCalendarDate(prev => moment(prev).add(1, 'month').toDate());
    } else if (action instanceof Date) {
      setCalendarDate(action);
    }
  };

  // Handler to go to today
  const handleToday = () => {
    setCalendarDate(new Date());
  };

  // In the chartOptions for the comparisonData (Group Performance Comparison), add responsive horizontal scrolling and dynamic width.
  const comparisonChartRef = useRef();

  const dynamicComparisonOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      legend: {
        ...chartOptions.plugins.legend,
        labels: {
          ...chartOptions.plugins.legend.labels,
          font: { size: 13 }
        }
      },
    },
    scales: {
      ...chartOptions.scales,
      x: {
        ...chartOptions.scales?.x,
        ticks: {
          ...chartOptions.scales?.x?.ticks,
          maxRotation: 45,
          minRotation: 30,
          autoSkip: false,
          font: { size: 12 },
          callback: function(value, index, values) {
            // Show full label
            return this.getLabelForValue(value);
          }
        }
      }
    }
  };

  const renderAllEvaluationsModal = () => (
    <Modal
      isOpen={showAllEvaluations}
      onRequestClose={() => setShowAllEvaluations(false)}
      className="all-evaluations-modal"
      overlayClassName="all-evaluations-modal-overlay"
      ariaHideApp={false}
    >
      <div className="all-evaluations-modal-header">
        <h3>All Evaluations with Summaries</h3>
        <button className="all-evaluations-modal-close" onClick={() => setShowAllEvaluations(false)}>&times;</button>
      </div>
      <div className="all-evaluations-list">
        <div className="color-indicator-legend">
          <span className="legend-label excellent">Excellent (&ge;3.5):</span>
          <span className="legend-label good">Good (2.5-3.49):</span>
          <span className="legend-label fair">Fair (1.5-2.49):</span>
          <span className="legend-label poor">Poor (&lt;1.5):</span>
        </div>
        {evaluations.map(evaluation => {
          const associate = associatesPerformance.find(a => a.user_id === evaluation.user_id);
          const logo = associate ? getLogoUrl(associate.logo) : getLogoUrl(null);
          
          // Generate a short summary for this evaluation
          const getPerformanceLevel = (score) => {
            if (score >= 3.5) return 'Excellent';
            if (score >= 2.5) return 'Good';
            if (score >= 1.5) return 'Fair';
            return 'Poor';
          };
          
          const performanceLevel = getPerformanceLevel(evaluation.total_score);
          const shortSummary = `${performanceLevel} performance with a score of ${evaluation.total_score}. Click to view detailed analysis.`;
          
          return (
            <div key={evaluation.id} className="evaluation-item-with-summary">
              <img src={logo} alt="logo" className="associate-logo-small" />
              <div className="evaluation-details">
                <span className="associate-name">
                  {evaluation.user ? evaluation.user.name : 'Unknown User'}
                </span>
                <span className="organization-name">
                  {evaluation.user ? evaluation.user.organization : 'No Organization'}
                </span>
                <div className="evaluation-summary-preview">
                  {shortSummary}
                </div>
              </div>
              <div className="evaluation-score" style={{ color: getPerformanceColor(evaluation.total_score) }}>
                {evaluation.total_score}
              </div>
              <div className="evaluation-date">
                {format(parseISO(evaluation.created_at), 'MMM dd')}
              </div>
              <div className="click-hint">
                <FontAwesomeIcon icon={faChevronRight} />
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );

  const handleOpenCertificateModal = () => setShowCertificateModal(true);
  const handleCloseCertificateModal = () => setShowCertificateModal(false);
  const handleCertificateDataChange = (data) => setCertificateData(data);

  // Calendar Event Handlers
  const handleOpenEventModal = () => {
    setEditingEvent(null);
    setShowEventModal(true);
  };

  const handleCloseEventModal = () => {
    setShowEventModal(false);
    setEditingEvent(null);
  };

  const handleEventCreated = async (newEvent) => {
    // Refetch calendar events from backend to ensure consistency and avoid duplicates
    await fetchCalendarEventsOnly();
    // Show success notification
    setShowEventSuccessMessage(true);
    // Auto-hide success message after 3 seconds
    setTimeout(() => {
      setShowEventSuccessMessage(false);
    }, 3000);
  };

  const handleEventUpdated = async (updatedEvent) => {
    // Refetch calendar events from backend to ensure consistency
    await fetchCalendarEventsOnly();
  };

  const handleEventClick = (event) => {
    // If it's a grouped event (has multiple events), show all events for that day
    if (event.resource && event.resource.events && event.resource.events.length > 0) {
      setSelectedEvent({
        ...event,
        resource: event.resource.events[0] // Keep first event for backward compatibility
      });
      setShowEventDetailsModal(true);
      // Pass events and date to EventDetailsModal
      setSelectedDayEvents(event.resource.events);
      setSelectedDayDate(new Date(event.start));
    } else {
      // Single event - show details modal
      setSelectedEvent(event);
      setShowEventDetailsModal(true);
    }
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setShowEventDetailsModal(false);
    setShowEventModal(true);
  };

  const handleOpenEventsListModal = () => {
    setShowEventsListModal(true);
  };

  const handleCloseEventsListModal = () => {
    setShowEventsListModal(false);
  };

  // Check if there's meaningful data in the dashboard
  const hasDashboardData = () => {
    // Check if there are evaluations
    const hasEvaluations = evaluations && evaluations.length > 0;
    
    // Check if there are associates with performance data
    const hasAssociatesData = associatesPerformance && associatesPerformance.length > 0;
    
    // Check if there's statistics data
    const hasStatisticsData = statisticsData && statisticsData.overall_stats && 
      statisticsData.overall_stats.total_evaluations > 0;
    
    // Check if there are recent evaluations
    const hasRecentEvaluations = recentEvaluations && recentEvaluations.length > 0;
    
    // Return true if any of these conditions are met
    return hasEvaluations || hasAssociatesData || hasStatisticsData || hasRecentEvaluations;
  };

  const handleGeneratePerformancePDF = async () => {
    try {
      setIsGeneratingPDF(true);
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      
      const response = await axiosInstance.get(`${API_BASE}/api/dashboard/performance-analysis-pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `DPAR_Performance_Analysis_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Show success message
      setShowSuccessMessage(true);
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
      
    } catch (err) {
      console.error('Error generating PDF:', err);
      
      // Provide more specific error messages
      if (err.response?.status === 500) {
        alert('Server error while generating PDF. Please check if there is any data available and try again.');
      } else if (err.response?.status === 401) {
        alert('Authentication error. Please log in again.');
      } else if (err.response?.status === 403) {
        alert('You do not have permission to generate this report.');
      } else {
        alert('Failed to generate performance analysis PDF. Please try again.');
      }
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleGenerateIndividualPerformancePDF = async () => {
    if (!selectedAssociate) {
      alert('Please select an associate first to generate their individual performance report.');
      return;
    }

    // Ensure associatesPerformance is loaded
    if (!associatesPerformance || associatesPerformance.length === 0) {
      alert('Associate data is still loading. Please wait a moment and try again.');
      return;
    }

    try {
      setIsGeneratingIndividualPDF(true);
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      
      // Get the user_id from the selected associate data
      // First, try to use the selectedAssociateData state if it matches the selected associate
      let associateData = null;
      if (selectedAssociateData && String(selectedAssociateData.id) === String(selectedAssociate)) {
        associateData = selectedAssociateData;
      } else {
        // Fall back to finding from associatesPerformance array with proper type conversion
        associateData = associatesPerformance.find(a => String(a.id) === String(selectedAssociate));
      }
      
      if (!associateData || !associateData.user_id) {
        console.error('Associate data not found:', { 
          selectedAssociate, 
          selectedAssociateData, 
          associatesPerformance,
          associateData 
        });
        alert('Unable to find user information for the selected associate. Please try selecting the associate again.');
        setIsGeneratingIndividualPDF(false);
        return;
      }
      
      const response = await axiosInstance.get(`${API_BASE}/api/dashboard/individual-performance-analysis-pdf/${associateData.user_id}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Use the already retrieved associate data for filename
      const associateName = associateData.name.replace(/\s+/g, '_');
      
      link.download = `DPAR_Individual_Performance_${associateName}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Show success message
      setShowIndividualSuccessMessage(true);
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setShowIndividualSuccessMessage(false);
      }, 3000);
      
    } catch (err) {
      console.error('Error generating individual PDF:', err);
      
      // Provide more specific error messages
      if (err.response?.status === 500) {
        alert('Server error while generating individual performance PDF. Please check if there is any data available for this associate and try again.');
      } else if (err.response?.status === 401) {
        alert('Authentication error. Please log in again.');
      } else if (err.response?.status === 403) {
        alert('You do not have permission to generate this report.');
      } else if (err.response?.status === 404) {
        alert('Associate not found or no evaluation data available for this associate.');
      } else {
        alert('Failed to generate individual performance analysis PDF. Please try again.');
      }
    } finally {
      setIsGeneratingIndividualPDF(false);
    }
  };


  if (loading) return (
    <AdminLayout>
      <div className="dashboard-loading-container">
        <div className="loading-content">
          <div className="simple-loader">
            <div className="loader-dot"></div>
            <div className="loader-dot"></div>
            <div className="loader-dot"></div>
          </div>
          <h3>Loading Dashboard</h3>
          <p>Analyzing performance data and generating insights...</p>
        </div>
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="admin-dashboard">
        <div className="dashboard-header">
          <div className="header-left">
        <h2 className="main-header">Dashboard Overview</h2>
        {renderLastUpdate()}
          </div>
          <div className="header-right">
            <button 
              className="generate-pdf-btn"
              onClick={handleGeneratePerformancePDF}
              disabled={isGeneratingPDF || !hasDashboardData()}
              style={{
                opacity: !hasDashboardData() ? 0.5 : 1,
                cursor: !hasDashboardData() ? 'not-allowed' : 'pointer'
              }}
              title={!hasDashboardData() ? 'No data available to generate report' : 'Generate performance analysis report'}
            >
              <FontAwesomeIcon icon={faFilePdf} />
              {isGeneratingPDF ? 'Generating...' : 'Generate Performance Report'}
            </button>
          </div>
        </div>
        {showSuccessMessage && (
          <div className="success-message-banner">
            <div className="success-message-content">
              <span className="success-icon">✓</span>
              <span className="success-text">Analysis downloaded successfully!</span>
            </div>
          </div>
        )}
        {showIndividualSuccessMessage && (
          <div className="success-message-banner">
            <div className="success-message-content">
              <span className="success-icon">✓</span>
              <span className="success-text">Individual performance report downloaded successfully!</span>
            </div>
          </div>
        )}
        {showEventSuccessMessage && (
          <div className="success-message-banner">
            <div className="success-message-content">
              <span className="success-icon">✓</span>
              <span className="success-text">Event created successfully!</span>
            </div>
          </div>
        )}
        {error && <div className="error-message">{error}</div>}

        {/* Welcome Banner */}
        <div className="welcome-banner">
          <div className="welcome-banner-content">
            <div className="welcome-banner-left">
              <div className="welcome-banner-icon">
                <FontAwesomeIcon icon={faUsers} />
              </div>
              <div className="welcome-banner-text">
                <h3>Welcome, {userName}</h3>
              </div>
            </div>
          </div>
        </div>

        <div className="performance-column">
          {/* Performance Metrics */}
          <div className="dashboard-section performance-metrics">
            <h3><FontAwesomeIcon icon={faChartLine} /> Associate Performance</h3>
            {/* Summary Statistics */}
            {statisticsData && statisticsData.overall_stats && (
              <div className="summary-statistics">
                <h4>Overall Performance Summary</h4>
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-label">Total Evaluations:</span>
                    <span className="stat-value">{statisticsData.overall_stats.total_evaluations}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Average Score:</span>
                    <span className="stat-value">{statisticsData.overall_stats.average_score}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Excellent (&ge;3.5):</span>
                    <span className="stat-value" style={{ color: '#28a745' }}>
                      {statisticsData.overall_stats.score_distribution.excellent}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Good (2.5-3.49):</span>
                    <span className="stat-value" style={{ color: '#17a2b8' }}>
                      {statisticsData.overall_stats.score_distribution.good}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Fair (1.5-2.49):</span>
                    <span className="stat-value" style={{ color: '#ffc107' }}>
                      {statisticsData.overall_stats.score_distribution.fair}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Poor (&lt;1.5):</span>
                    <span className="stat-value" style={{ color: '#dc3545' }}>
                      {statisticsData.overall_stats.score_distribution.poor}
                    </span>
                  </div>
                </div>
              </div>
            )}
            {/* Group Performance Section */}
            <div className="group-performance">
              <h4>Volunteer Group Performance (Average per KPI)</h4>
              <div className="group-performance-list">
                {Object.entries(groupPerformance).map(([kpi, value]) => (
                  <div key={kpi} className="group-performance-item" style={{ color: getPerformanceColor(value) }}>
                    <span className="kpi-label">{kpi}:</span> <span className="kpi-value">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Associate Selection */}
            <div className="associate-selector">
              <select 
                value={selectedAssociate || ''} 
                onChange={handleAssociateChange}
                className="associate-select"
              >
                {associatesPerformance.map(associate => (
                  <option key={associate.id} value={associate.id}>
                    {associate.director || associate.name} - {associate.name}
                  </option>
                ))}
              </select>
              <button
                className="generate-individual-pdf-btn"
                onClick={handleGenerateIndividualPerformancePDF}
                disabled={isGeneratingIndividualPDF || !selectedAssociate}
                style={{
                  opacity: !selectedAssociate ? 0.5 : 1,
                  cursor: !selectedAssociate ? 'not-allowed' : 'pointer'
                }}
                title={!selectedAssociate ? 'Please select an associate first' : 'Generate individual performance report for selected associate'}
              >
                <FontAwesomeIcon icon={faFilePdf} />
                {isGeneratingIndividualPDF ? 'Generating...' : 'Generate Individual Performance'}
              </button>
            </div>
            {/* Charts Grid */}
            <div className="charts-grid">
              {/* Individual Performance Chart */}
              <div className="chart-container">
                <h4>Individual Performance Breakdown</h4>
                <div className="bar-chart" style={{ marginLeft: '-10px' }}>
                  <Bar data={associateBarData} options={chartOptions} />
                </div>
              </div>

              {/* Individual Performance Trend Chart */}
              <div className="chart-container">
                <h4>Individual Performance Trend</h4>
                <div className="line-chart">
                  <Line data={individualTrendData} options={lineChartOptions} />
                </div>
              </div>

              {/* Performance Comparison Chart */}
              <div className="chart-container chart-container-full-width">
                <h4>Group Performance Comparison</h4>
                <div style={{ overflowX: 'auto', width: '100%' }}>
                  <div style={{ minWidth: Math.max(associatesPerformance.length * 70, 350), width: '100%' }}>
                    <Bar ref={comparisonChartRef} data={comparisonData} options={dynamicComparisonOptions} />
                  </div>
                </div>
              </div>

              {/* KPI Trends Chart (Full Width) */}
              <div className="chart-container chart-container-full-width">
                <h4>KPI Performance Trends</h4>
                <div style={{ overflowX: 'auto', width: '100%' }}>
                  <div style={{ minWidth: Math.max(kpiCategories.length * 180, 350), width: '100%' }}>
                    <Line data={kpiTrendData} options={lineChartOptions} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="sidebar-column">
            {/* Calendar Section */}
            <div className="dashboard-section calendar-section">
              <div className="calendar-header">
                <h3><FontAwesomeIcon icon={faCalendarAlt} /> Calendar</h3>
              </div>
              <div style={{ height: 400, background: 'white', borderRadius: 12, padding: 10, overflow: 'visible', position: 'relative' }}>
                <CustomCalendarToolbar 
                  date={calendarDate} 
                  onNavigate={handleCalendarNavigate} 
                  onAddEvent={handleOpenEventModal}
                  onToday={handleToday}
                />
                <Calendar
                  key={`calendar-${calendarEvents.length}-${calendarDate.toISOString()}`}
                  localizer={localizer}
                  events={calendarEvents}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: 380, borderRadius: 12 }}
                  popup
                  views={['month']}
                  toolbar={false}
                  date={calendarDate}
                  onNavigate={date => setCalendarDate(date)}
                  onSelectEvent={handleEventClick}
                  onView={() => console.log('Calendar view changed, events:', calendarEvents)}
                  components={{
                    event: CustomEvent
                  }}
                  eventPropGetter={(event) => {
                    const now = new Date();
                    let backgroundColor = '#6c757d'; // Default grey color
                    let className = '';
                    
                    // Check if event has resource with events array
                    if (event.resource && event.resource.events && event.resource.events.length > 0) {
                      const events = event.resource.events;
                      let hasInProgress = false;
                      let allFinished = true; // Start with true, will be false if any event is not finished
                      let allNotStarted = true; // Start with true, will be false if any event has started
                      
                      // Check each event in the group
                      events.forEach(eventItem => {
                        const startDate = new Date(eventItem.start_date);
                        const endDate = new Date(eventItem.end_date);
                        
                        // Check if event is in progress (started but not finished)
                        if (startDate <= now && endDate >= now) {
                          hasInProgress = true;
                          allNotStarted = false;
                          allFinished = false;
                        }
                        // Check if event has finished (endDate < now)
                        else if (endDate < now) {
                          allNotStarted = false;
                          // Keep allFinished as true only if all events are finished
                        }
                        // Check if event hasn't started yet (startDate > now)
                        else if (startDate > now) {
                          allFinished = false;
                          // Keep allNotStarted as true only if all events haven't started
                        }
                        // Edge case: event started but logic above should catch it
                        else if (startDate <= now) {
                          allNotStarted = false;
                          allFinished = false;
                        }
                      });
                      
                      // Apply colors based on status
                      // Priority: If ANY event is in progress → GREEN
                      if (hasInProgress) {
                        backgroundColor = '#28a745';
                        className = 'event-in-progress';
                      }
                      // If ALL events are finished → GREY
                      else if (allFinished && events.length > 0) {
                        backgroundColor = '#6c757d';
                        className = 'event-finished';
                      }
                      // If ALL events are not started → GREY
                      else if (allNotStarted) {
                        backgroundColor = '#6c757d';
                        className = 'event-not-started';
                      }
                      // Default to grey
                      else {
                        backgroundColor = '#6c757d';
                        className = 'event-finished';
                      }
                    }
                    
                    return {
                      style: {
                        backgroundColor: 'transparent',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: 0,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        opacity: 1,
                        visibility: 'visible',
                        boxShadow: 'none'
                      },
                      className: `custom-event-wrapper ${className}`
                    };
                  }}
                />
              </div>
              <div style={{ marginTop: 12, textAlign: 'center' }}>
                <button 
                  className="see-events-btn" 
                  onClick={handleOpenEventsListModal}
                >
                  <FontAwesomeIcon icon={faCalendarAlt} />
                  <span>SEE EVENTS</span>
                </button>
              </div>
            </div>
            {/* Recent Evaluations */}
            <div className="dashboard-section recent-evaluations">
              <div className="recent-evaluations-header-row">
                <h3 className="recent-evaluations-title"><FontAwesomeIcon icon={faUserCheck} /> Recent Evaluations</h3>
                <button className="generate-certificate-btn" onClick={handleOpenCertificateModal}>
                  <span className="generate-certificate-text">Generate Certificate</span>
                  <FontAwesomeIcon icon={faCertificate} className="generate-certificate-icon" />
                </button>
              </div>
              {renderRecentEvaluations()}
              {renderAllEvaluationsModal()}
              {showCertificateModal && (
                <CertificateModal
                  show={showCertificateModal}
                  onClose={handleCloseCertificateModal}
                  associates={associatesPerformance}
                  certificateData={certificateData}
                  onCertificateDataChange={handleCertificateDataChange}
                  style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.08)', padding: 32 }} // Add solid background
                />
              )}
            </div>


            {/* Members Overview */}
            <div className="dashboard-section members-overview">
              <div className="members-overview-header">
                <h3><FontAwesomeIcon icon={faUsers} /> Active Members</h3>
                <div className="period-selector">
                  <select 
                    value={activityPeriod} 
                    onChange={(e) => {
                      setActivityPeriod(e.target.value);
                      fetchActiveMembers(e.target.value);
                    }}
                    className="period-select"
                  >
                    <option value="day">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                </div>
              </div>
              <div className="members-stats">
                <div className="stat-card">
                  <h4>Total Associates</h4>
                  <div className="stat-value">{activeMembersStats.total_associates || 0}</div>
                </div>
                <div className="stat-card">
                  <h4>Active Associates</h4>
                  <div className="stat-value">{activeMembersStats.active_associates || 0}</div>
                </div>
              </div>
                <div className="members-list">
                  {activeMembers && activeMembers.length > 0 ? activeMembers
                    .filter(member => member.is_active)
                    .map(member => (
                  <div key={member.id} className="member-item">
                    <div className="member-info">
                      <img 
                        src={getLogoUrl(member.logo)}
                        alt={member.name} 
                        className="member-avatar"
                        onError={(e) => {
                          e.target.src = `${window.location.origin}/Assets/disaster_logo.png`;
                        }}
                      />
                      <div className="member-details">
                        <span className="member-name">{member.organization_name || member.name}</span>
                        <span className="member-org">{member.director || member.organization}</span>
                      </div>
                    </div>
                    <div className="member-stats">
                      <div className="activity-status active">
                        Active
                      </div>
                      {member.last_activity && (
                        <div className="last-activity">
                          {formatTimeSince(member.last_activity)}
                        </div>
                      )}
                    </div>
                  </div>
                )) : (
                  <div className="no-members">
                    <p>No active members found for the selected period.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Event Modals */}
        {showEventModal && (
          <EventModal
            show={showEventModal}
            onClose={handleCloseEventModal}
            event={editingEvent}
            onEventCreated={handleEventCreated}
            onEventUpdated={handleEventUpdated}
          />
        )}

        {showEventDetailsModal && selectedEvent && (
          <EventDetailsModal
            show={showEventDetailsModal}
            onClose={() => setShowEventDetailsModal(false)}
            event={selectedEvent.resource}
            onEdit={handleEditEvent}
            events={selectedDayEvents.length > 1 ? selectedDayEvents : null}
            date={selectedDayDate}
          />
        )}

        {showEventsListModal && (
          <EventsListModal
            show={showEventsListModal}
            onClose={handleCloseEventsListModal}
            onEdit={handleEditEvent}
          />
        )}

      </div>
    </AdminLayout>
  );
}

export default AdminDashboard; 