import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faCalendarAlt, faChartLine, faUserCheck, faCertificate, faPlus, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
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
import { getLogoUrl } from '../../../utils/url';
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

// Custom Calendar Toolbar
function CustomCalendarToolbar({ date, onNavigate, onAddEvent, onToday }) {
  const monthYear = moment(date).format('MMMM YYYY');
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 240, justifyContent: 'center' }}>
        {/* TD Button */}
        <button
          className="add-event-btn calendar-today-btn"
          onClick={onToday}
          aria-label="Today"
          style={{
            minWidth: 0,
            padding: '8px 16px',
            fontSize: '1rem',
            fontWeight: 700,
            marginRight: 8,
            letterSpacing: '0.5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#A11C22',
            color: 'white',
            borderRadius: 8,
            border: 'none',
            boxShadow: '0 2px 8px rgba(161, 28, 34, 0.2)',
            cursor: 'pointer',
            lineHeight: 1,
          }}
        >
          TD
        </button>
        {/* Existing left arrow */}
        <button
          className="calendar-nav-btn calendar-nav-btn-icon"
          onClick={() => onNavigate('PREV')}
          aria-label="Previous Month"
        >
          <FontAwesomeIcon icon={faChevronLeft} style={{ fontSize: '1rem' }} />
        </button>
        <span style={{ fontWeight: 600, fontSize: 18, minWidth: 120, textAlign: 'center' }}>{monthYear}</span>
        <button
          className="calendar-nav-btn calendar-nav-btn-icon"
          onClick={() => onNavigate('NEXT')}
          aria-label="Next Month"
        >
          <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: '1rem' }} />
        </button>
        <button
          className="add-event-btn"
          onClick={onAddEvent}
          style={{ marginLeft: 8 }}
          aria-label="Add Event"
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>EV</span>
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
        axios.get('http://localhost:8000/api/evaluations', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:8000/api/associate-groups', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:8000/api/evaluations/statistics', { headers: { Authorization: `Bearer ${token}` } })
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
  }, [fetchDashboardData]);

  // Separate function to fetch calendar events without interfering with live polling
  const fetchCalendarEventsOnly = async () => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await axios.get('http://localhost:8000/api/calendar-events', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Raw calendar events response:', response.data);
      
      if (response.data.success) {
        // Group events by date and count them
        const eventsByDate = {};
        response.data.data.forEach(event => {
          const startDate = new Date(event.start_date);
          const dateKey = startDate.toISOString().split('T')[0]; // YYYY-MM-DD format
          
          if (!eventsByDate[dateKey]) {
            eventsByDate[dateKey] = [];
          }
          eventsByDate[dateKey].push(event);
        });
        
        // Create calendar events with count as title
        const events = Object.entries(eventsByDate).map(([dateKey, dayEvents]) => {
          const startDate = new Date(dateKey);
          
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
        console.log('No events found or API error:', response.data);
        setCalendarEvents([]);
      }
    } catch (err) {
      console.error('Error fetching calendar events:', err);
      setCalendarEvents([]);
    }
  };

  // Debug calendar events
  useEffect(() => {
    console.log('Calendar events state updated:', calendarEvents);
  }, [calendarEvents]);

  // Polling for live updates (debounced to 10 seconds)
  useEffect(() => {
    const pollInterval = setInterval(() => {
      if (!loading && !refreshNow) {
        fetchDashboardData(selectedAssociate, true);
      }
    }, 10000); // Poll every 10 seconds (more efficient than 3 seconds)
    return () => clearInterval(pollInterval);
  }, [selectedAssociate, loading, refreshNow, fetchDashboardData]);

  // Listen for refreshNow flag (set by Evaluation.js after evaluation)
  useEffect(() => {
    if (window.refreshNow) {
      setRefreshNow(true);
      window.refreshNow = false;
    }
  }, []);

  useEffect(() => {
    if (refreshNow) {
      fetchDashboardData(selectedAssociate, false).then(() => setRefreshNow(false));
    }
  }, [refreshNow, selectedAssociate, fetchDashboardData]);

  // Add event listener for dashboard refresh trigger
  useEffect(() => {
    const refreshListener = () => {
      fetchDashboardData(selectedAssociate, true);
    };
    window.addEventListener('refreshDashboardData', refreshListener);
    return () => window.removeEventListener('refreshDashboardData', refreshListener);
  }, [selectedAssociate, fetchDashboardData]);

  // Add useEffect to force refresh when switching associates
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
        <h3>All Evaluations</h3>
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

  const handleEventCreated = (newEvent) => {
    // Set flag to preserve calendar events from being overwritten
    setPreserveCalendarEvents(true);
    
    // Process the new event to match the calendar display format
    const startDate = new Date(newEvent.start_date);
    const dateKey = startDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    setCalendarEvents(prev => {
      // Check if there's already an event for this date
      const existingDateEvent = prev.find(event => {
        const eventDate = new Date(event.start);
        const eventDateKey = eventDate.toISOString().split('T')[0];
        return eventDateKey === dateKey;
      });
      
      if (existingDateEvent) {
        // Update existing date event to include the new event
        return prev.map(event => {
          const eventDate = new Date(event.start);
          const eventDateKey = eventDate.toISOString().split('T')[0];
          
          if (eventDateKey === dateKey) {
            // Add the new event to the existing group
            const updatedEvents = [...event.resource.events, newEvent];
            return {
              ...event,
              title: updatedEvents.length.toString(),
              resource: {
                ...event.resource,
                events: updatedEvents,
                count: updatedEvents.length
              }
            };
          }
          return event;
        });
      } else {
        // Create a new date event for this date
        const newDateEvent = {
          id: `date-${dateKey}`,
          title: '1',
          start: startDate,
          end: startDate,
          allDay: true,
          resource: {
            date: dateKey,
            events: [newEvent],
            count: 1
          },
          // Ensure these properties are set for React Big Calendar
          start_date: startDate,
          end_date: startDate,
          display: 'block'
        };
        
        return [...prev, newDateEvent];
      }
    });
  };

  const handleEventUpdated = (updatedEvent) => {
    setCalendarEvents(prev => prev.map(event => {
      // Check if this calendar event contains the updated event
      if (event.resource && event.resource.events) {
        const eventIndex = event.resource.events.findIndex(e => e.id === updatedEvent.id);
        if (eventIndex !== -1) {
          // Update the specific event in the group
          const updatedEvents = [...event.resource.events];
          updatedEvents[eventIndex] = updatedEvent;
          
          return {
            ...event,
            title: updatedEvents.length.toString(),
            resource: {
              ...event.resource,
              events: updatedEvents,
              count: updatedEvents.length
            }
          };
        }
      }
      return event;
    }));
  };

  // Update handleEventDeleted to call backend API
  const handleEventDeleted = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      // Call backend to delete the event
      const response = await axios.delete(`http://localhost:8000/api/calendar-events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setCalendarEvents(prev => {
          return prev.map(event => {
            // Check if this calendar event contains the deleted event
            if (event.resource && event.resource.events) {
              const eventIndex = event.resource.events.findIndex(e => e.id === eventId);
              if (eventIndex !== -1) {
                // Remove the specific event from the group
                const updatedEvents = event.resource.events.filter(e => e.id !== eventId);
                // If no events left for this date, remove the entire date event
                if (updatedEvents.length === 0) {
                  return null; // This will be filtered out
                }
                return {
                  ...event,
                  title: updatedEvents.length.toString(),
                  resource: {
                    ...event.resource,
                    events: updatedEvents,
                    count: updatedEvents.length
                  }
                };
              }
            }
            return event;
          }).filter(event => event !== null); // Remove null events (empty dates)
        });
        setShowEventDetailsModal(false); // Close the event details modal after deletion
      } else {
        // Optionally show an error message to the user
        alert('Failed to delete event: ' + (response.data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error deleting event:', err);
      alert('Failed to delete event: ' + (err.response?.data?.message || err.message));
    }
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

  if (loading) return (
    <AdminLayout>
      <div className="loading">Loading dashboard data...</div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="admin-dashboard">
        <h2 className="main-header">Dashboard Overview</h2>
        {renderLastUpdate()}
        {error && <div className="error-message">{error}</div>}

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
                    {associate.name} - {associate.organization}
                  </option>
                ))}
              </select>
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
              <div style={{ height: 400, background: 'white', borderRadius: 12, padding: 10 }}>
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
              <h3><FontAwesomeIcon icon={faUsers} /> Members Overview</h3>
              <div className="members-stats">
                <div className="stat-card">
                  <h4>Total Associates</h4>
                  <div className="stat-value">{associatesPerformance.length}</div>
                </div>
                <div className="stat-card">
                  <h4>Evaluated Associates</h4>
                  <div className="stat-value">
                    {associatesPerformance.filter(a => a.evaluations.length > 0).length}
                  </div>
                </div>
              </div>
              <div className="members-list">
                {associatesPerformance.slice(0, 5).map(associate => (
                  <div key={associate.id} className="member-item">
                    <div className="member-info">
                      <img 
                        src={getLogoUrl(associate.logo)}
                        alt={associate.name} 
                        className="member-avatar"
                        onError={(e) => {
                          e.target.src = `${window.location.origin}/Assets/disaster_logo.png`;
                        }}
                      />
                      <div className="member-details">
                        <span className="member-name">{associate.name}</span>
                        <span className="member-org">{associate.organization}</span>
                      </div>
                    </div>
                    <div className="member-stats">
                      <div className="member-score" style={{ color: getPerformanceColor(associate.totalScore) }}>
                        {associate.totalScore}
                      </div>
                      {associate.lastEvaluationDate && (
                        <div className="last-evaluation">
                          Last: {format(associate.lastEvaluationDate, 'MMM dd')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
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
            onEventDeleted={handleEventDeleted}
          />
        )}

        {showEventDetailsModal && selectedEvent && (
          <EventDetailsModal
            show={showEventDetailsModal}
            onClose={() => setShowEventDetailsModal(false)}
            event={selectedEvent.resource}
            onEdit={handleEditEvent}
            onDelete={handleEventDeleted}
            events={selectedDayEvents.length > 1 ? selectedDayEvents : null}
            date={selectedDayDate}
          />
        )}

        {showEventsListModal && (
          <EventsListModal
            show={showEventsListModal}
            onClose={handleCloseEventsListModal}
            onEdit={handleEditEvent}
            onDelete={handleEventDeleted}
          />
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminDashboard; 