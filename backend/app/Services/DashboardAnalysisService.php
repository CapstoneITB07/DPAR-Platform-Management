<?php

namespace App\Services;

use Dompdf\Dompdf;
use Dompdf\Options;
use App\Models\Evaluation;
use App\Models\AssociateGroup;
use App\Models\User;
use App\Models\Report;
use App\Models\Volunteer;
use App\Models\Notification;
use App\Models\NotificationRecipient;
use App\Models\ActivityLog;
use App\Models\Announcement;
use App\Models\TrainingProgram;
use App\Models\CalendarEvent;
use App\Models\PendingApplication;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class DashboardAnalysisService
{
    public function generatePerformanceAnalysisPDF()
    {
        $options = new Options();
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isPhpEnabled', true);
        $options->set('defaultFont', 'Arial');
        $options->set('isFontSubsettingEnabled', true);
        $options->set('defaultMediaType', 'print');
        $options->set('defaultPaperSize', 'A4');
        $options->set('defaultPaperOrientation', 'portrait');
        $options->set('isRemoteEnabled', true);
        $options->set('chroot', base_path());

        $dompdf = new Dompdf($options);

        // Gather comprehensive dashboard data
        $dashboardData = $this->gatherDashboardData();

        // Generate HTML content
        $html = $this->generateAnalysisHTML($dashboardData);

        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        return $dompdf->output();
    }

    public function generateIndividualPerformanceAnalysisPDF($userId)
    {
        $options = new Options();
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isPhpEnabled', true);
        $options->set('defaultFont', 'Arial');
        $options->set('isFontSubsettingEnabled', true);
        $options->set('defaultMediaType', 'print');
        $options->set('defaultPaperSize', 'A4');
        $options->set('defaultPaperOrientation', 'portrait');
        $options->set('isRemoteEnabled', true);
        $options->set('chroot', base_path());

        $dompdf = new Dompdf($options);

        // Gather individual performance data
        $individualData = $this->gatherIndividualDashboardData($userId);

        // Generate HTML content
        $html = $this->generateIndividualAnalysisHTML($individualData);

        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        return $dompdf->output();
    }

    private function gatherDashboardData()
    {
        // Get evaluations ONLY for associate group leaders (associates)
        $evaluations = Evaluation::with(['user:id,name,organization,role'])
            ->whereHas('user', function ($query) {
                $query->where('role', 'associate_group_leader');
            })
            ->orderBy('created_at', 'desc')
            ->get();

        // Get all associate groups (excluding soft-deleted)
        $associateGroups = AssociateGroup::with(['user:id,name,organization'])
            ->whereNull('deleted_at')
            ->get();

        // Get only associate group leaders (associates) with active associate groups
        $associateUsers = User::where('role', 'associate_group_leader')
            ->whereHas('associateGroup', function ($query) {
                $query->whereNull('deleted_at');
            })
            ->get();

        // Gather post activity report and history (always gather, even if no evaluations)
        $postActivityData = $this->gatherPostActivityData();

        // Handle case where there's no data
        if ($evaluations->isEmpty() && $associateGroups->isEmpty()) {
            return [
                'overall_stats' => [
                    'total_evaluations' => 0,
                    'total_associates' => 0,
                    'total_members' => $associateUsers->count(),
                    'average_score' => 0,
                    'report_date' => Carbon::now()->format('Y-m-d H:i:s')
                ],
                'performance_insights' => [
                    'overall_performance' => 'No evaluation data available. The system is ready to begin tracking performance once evaluations are conducted.',
                    'distribution_analysis' => 'No performance data to analyze. Begin conducting evaluations to generate meaningful insights.',
                    'excellent_performance' => 'No data available for excellence analysis.',
                    'improvement_needed' => 'No data available for improvement analysis.',
                    'network_health' => 'No performance data available. Begin systematic evaluation to assess network health.'
                ],
                'quarterly_trends' => [],
                'performance_distribution' => ['excellent' => 0, 'good' => 0, 'fair' => 0, 'poor' => 0],
                'top_performers' => [],
                'bottom_performers' => [],
                'category_analysis' => [],
                'recommendations' => [
                    'No evaluation data available. Begin conducting evaluations to generate meaningful performance insights.',
                    'Establish evaluation protocols and begin systematic assessment of associate group performance.'
                ],
                'individual_performance' => [],
                'post_activity' => $postActivityData
            ];
        }

        // Calculate overall statistics
        $totalEvaluations = $evaluations->count();
        $totalAssociates = $associateGroups->count();
        $totalMembers = $associateUsers->count();

        // Calculate average performance
        $averageScore = $evaluations->avg('total_score') ?? 0;

        // Group evaluations by user for individual analysis
        $userEvaluations = $evaluations->groupBy('user_id');

        // Calculate performance trends (last 4 quarters)
        $quarterlyData = $this->calculateQuarterlyTrends($evaluations);

        // Calculate performance distribution
        $performanceDistribution = $this->calculatePerformanceDistribution($evaluations);

        // Get top and bottom performers
        $topPerformers = $this->getTopPerformers($userEvaluations);
        $bottomPerformers = $this->getBottomPerformers($userEvaluations);

        // Calculate category performance
        $categoryAnalysis = $this->analyzeCategoryPerformance($evaluations);

        // Generate recommendations
        $recommendations = $this->generateRecommendations($performanceDistribution, $topPerformers, $bottomPerformers);

        // Calculate performance insights
        $performanceInsights = $this->calculatePerformanceInsights($evaluations, $averageScore, $performanceDistribution);

        // Calculate aggregate performance metrics across all associates
        $aggregateMetrics = $this->calculateAggregateMetrics($associateUsers, $evaluations);

        // Gather post activity report and history
        $postActivityData = $this->gatherPostActivityData();

        return [
            'overall_stats' => [
                'total_evaluations' => $totalEvaluations,
                'total_associates' => $totalAssociates,
                'total_members' => $totalMembers,
                'average_score' => round($averageScore, 2),
                'report_date' => Carbon::now()->format('Y-m-d H:i:s')
            ],
            'performance_insights' => $performanceInsights,
            'quarterly_trends' => $quarterlyData,
            'performance_distribution' => $performanceDistribution,
            'top_performers' => $topPerformers,
            'bottom_performers' => $bottomPerformers,
            'category_analysis' => $categoryAnalysis,
            'recommendations' => $recommendations,
            'individual_performance' => $this->getIndividualPerformanceData($userEvaluations),
            'aggregate_metrics' => $aggregateMetrics,
            'post_activity' => $postActivityData
        ];
    }

    private function calculateQuarterlyTrends($evaluations)
    {
        $quarters = [];
        $currentYear = Carbon::now()->year;

        for ($i = 3; $i >= 0; $i--) {
            $quarterStart = Carbon::create($currentYear, ($i * 3) + 1, 1);
            $quarterEnd = $quarterStart->copy()->addMonths(2)->endOfMonth();

            $quarterEvaluations = $evaluations->filter(function ($evaluation) use ($quarterStart, $quarterEnd) {
                $evalDate = Carbon::parse($evaluation->created_at);
                return $evalDate->between($quarterStart, $quarterEnd);
            });

            $quarters[] = [
                'quarter' => 'Q' . ($i + 1),
                'average_score' => $quarterEvaluations->avg('total_score') ?? 0,
                'total_evaluations' => $quarterEvaluations->count(),
                'period' => $quarterStart->format('M Y') . ' - ' . $quarterEnd->format('M Y')
            ];
        }

        return array_reverse($quarters);
    }

    private function calculatePerformanceDistribution($evaluations)
    {
        $distribution = [
            'excellent' => 0, // 3.5-4.0
            'good' => 0,       // 2.5-3.4
            'fair' => 0,       // 1.5-2.4
            'poor' => 0        // 0-1.4
        ];

        foreach ($evaluations as $evaluation) {
            $score = $evaluation->total_score;
            if ($score >= 3.5) {
                $distribution['excellent']++;
            } elseif ($score >= 2.5) {
                $distribution['good']++;
            } elseif ($score >= 1.5) {
                $distribution['fair']++;
            } else {
                $distribution['poor']++;
            }
        }

        return $distribution;
    }

    private function getTopPerformers($userEvaluations, $limit = 5)
    {
        $performers = [];

        foreach ($userEvaluations as $userId => $userEvals) {
            $latestEval = $userEvals->first();
            $averageScore = $userEvals->avg('total_score');
            $totalEvals = $userEvals->count();

            $performers[] = [
                'user_id' => $userId,
                'user_name' => $latestEval->user->name ?? 'Unknown',
                'organization' => $latestEval->user->organization ?? 'No Organization',
                'latest_score' => $latestEval->total_score,
                'average_score' => round($averageScore, 2),
                'total_evaluations' => $totalEvals,
                'performance_level' => $this->getPerformanceLevel($latestEval->total_score)
            ];
        }

        // Sort by latest score descending
        usort($performers, function ($a, $b) {
            return $b['latest_score'] <=> $a['latest_score'];
        });

        return array_slice($performers, 0, $limit);
    }

    private function getBottomPerformers($userEvaluations, $limit = 5)
    {
        $performers = [];

        foreach ($userEvaluations as $userId => $userEvals) {
            $latestEval = $userEvals->first();
            $averageScore = $userEvals->avg('total_score');
            $totalEvals = $userEvals->count();

            $performers[] = [
                'user_id' => $userId,
                'user_name' => $latestEval->user->name ?? 'Unknown',
                'organization' => $latestEval->user->organization ?? 'No Organization',
                'latest_score' => $latestEval->total_score,
                'average_score' => round($averageScore, 2),
                'total_evaluations' => $totalEvals,
                'performance_level' => $this->getPerformanceLevel($latestEval->total_score)
            ];
        }

        // Sort by latest score ascending
        usort($performers, function ($a, $b) {
            return $a['latest_score'] <=> $b['latest_score'];
        });

        return array_slice($performers, 0, $limit);
    }

    private function analyzeCategoryPerformance($evaluations)
    {
        $categories = [
            'Volunteer Participation' => [],
            'Community Engagement' => [],
            'Leadership & Initiative' => [],
            'Communication & Collaboration' => [],
            'Professional Development' => []
        ];

        foreach ($evaluations as $evaluation) {
            $evalData = is_string($evaluation->evaluation_data)
                ? json_decode($evaluation->evaluation_data, true)
                : $evaluation->evaluation_data;

            if (is_array($evalData)) {
                foreach ($evalData as $category => $data) {
                    if (isset($data['scores']) && isset($categories[$category])) {
                        $scores = array_values($data['scores']);
                        $categoryScore = count($scores) > 0 ? array_sum($scores) / count($scores) : 0;
                        $categories[$category][] = $categoryScore;
                    }
                }
            }
        }

        $analysis = [];
        foreach ($categories as $category => $scores) {
            if (count($scores) > 0) {
                $analysis[$category] = [
                    'average_score' => round(array_sum($scores) / count($scores), 2),
                    'total_evaluations' => count($scores),
                    'performance_level' => $this->getPerformanceLevel(array_sum($scores) / count($scores))
                ];
            }
        }

        return $analysis;
    }

    private function getIndividualPerformanceData($userEvaluations)
    {
        $individualData = [];

        foreach ($userEvaluations as $userId => $userEvals) {
            $latestEval = $userEvals->first();
            $averageScore = $userEvals->avg('total_score');
            $totalEvals = $userEvals->count();

            // Calculate trend
            $trend = 'stable';
            if ($totalEvals >= 2) {
                $recentScores = $userEvals->take(2)->pluck('total_score');
                if ($recentScores[0] > $recentScores[1]) {
                    $trend = 'improving';
                } elseif ($recentScores[0] < $recentScores[1]) {
                    $trend = 'declining';
                }
            }

            // Get performance metrics for all quarters of current year
            $currentYear = Carbon::now()->year;
            $quarterlyMetrics = [];

            // Calculate metrics for each quarter (Q1, Q2, Q3, Q4)
            for ($quarter = 1; $quarter <= 4; $quarter++) {
                $quarterStartMonth = ($quarter - 1) * 3 + 1; // Q1: 1, Q2: 4, Q3: 7, Q4: 10
                $quarterEndMonth = $quarterStartMonth + 2; // Q1: 3, Q2: 6, Q3: 9, Q4: 12

                $quarterStart = Carbon::create($currentYear, $quarterStartMonth, 1)->startOfDay();
                $quarterEnd = Carbon::create($currentYear, $quarterEndMonth, 1)->endOfMonth()->endOfDay();

                $quarterMetrics = $this->calculatePerformanceMetrics(
                    $userId,
                    $quarterStart->toDateString(),
                    $quarterEnd->toDateString()
                );

                if ($quarterMetrics) {
                    $quarterlyMetrics["Q{$quarter}"] = $quarterMetrics;
                }
            }

            $individualData[] = [
                'user_id' => $userId,
                'user_name' => $latestEval->user->name ?? 'Unknown',
                'organization' => $latestEval->user->organization ?? 'No Organization',
                'latest_score' => $latestEval->total_score,
                'average_score' => round($averageScore, 2),
                'total_evaluations' => $totalEvals,
                'performance_level' => $this->getPerformanceLevel($latestEval->total_score),
                'trend' => $trend,
                'first_evaluation' => $userEvals->last()->created_at->format('Y-m-d'),
                'last_evaluation' => $latestEval->created_at->format('Y-m-d'),
                'quarterly_metrics' => $quarterlyMetrics,
                'metrics_year' => $currentYear
            ];
        }

        // Sort by latest score descending
        usort($individualData, function ($a, $b) {
            return $b['latest_score'] <=> $a['latest_score'];
        });

        return $individualData;
    }

    private function generateRecommendations($performanceDistribution, $topPerformers, $bottomPerformers)
    {
        $recommendations = [];

        // Analyze performance distribution
        $totalEvaluations = array_sum($performanceDistribution);

        // Check for division by zero
        if ($totalEvaluations == 0) {
            $recommendations[] = "No evaluation data available. Begin conducting evaluations to generate meaningful performance insights.";
            $recommendations[] = "Establish evaluation protocols and begin systematic assessment of associate group performance.";
            return $recommendations;
        }

        $excellentPercentage = ($performanceDistribution['excellent'] / $totalEvaluations) * 100;
        $poorPercentage = ($performanceDistribution['poor'] / $totalEvaluations) * 100;

        if ($excellentPercentage > 30) {
            $recommendations[] = "Recognize and reward top-performing groups to maintain high standards and motivate others.";
        }

        if ($poorPercentage > 20) {
            $recommendations[] = "Provide targeted training and mentoring for underperforming groups to improve overall coalition performance.";
        }

        $recommendations[] = "Continue monitoring trends to ensure sustainable growth and performance improvement.";
        $recommendations[] = "Encourage knowledge sharing across groups to replicate successful practices and best practices.";

        if (count($topPerformers) > 0) {
            $topPerformerNames = array_column($topPerformers, 'user_name');
            $recommendations[] = "Consider creating mentorship programs where top performers (e.g., " . implode(', ', array_slice($topPerformerNames, 0, 3)) . ") can guide other groups.";
        }

        return $recommendations;
    }

    private function getPerformanceLevel($score)
    {
        if ($score >= 3.5) return 'Excellent';
        if ($score >= 2.5) return 'Good';
        if ($score >= 1.5) return 'Fair';
        return 'Poor';
    }

    /**
     * Bold numeric values in text strings for PDF display
     * This function finds numeric values (decimals, percentages, scores) and wraps them in <strong> tags
     */
    private function boldNumericValues($text)
    {
        // Skip if text already contains HTML tags (to avoid double processing)
        if (strpos($text, '<strong>') !== false || strpos($text, '<') !== false) {
            return $text;
        }

        // Match percentages first (e.g., 30%, 15.5%) - must be before other patterns
        $text = preg_replace('/(\d+\.?\d*)%/i', '<strong>$1%</strong>', $text);

        // Match scores with / (e.g., 3.5/4.0) - must be before decimal matching
        $text = preg_replace('/(\d+\.?\d*)\/(\d+\.?\d*)/', '<strong>$1/$2</strong>', $text);

        // Match numbers followed by "points" (e.g., "3.5 points", "0.2 points", "increase of 0.5 points")
        $text = preg_replace('/(\d+\.?\d*)\s+points?/i', '<strong>$1</strong> points', $text);

        // Match numbers followed by metric words (e.g., "30 of evaluations", "15 groups")
        $text = preg_replace('/(\d+\.?\d*)\s+(of|evaluations?|groups?|associates?|members?|range|count|portion)/i', '<strong>$1</strong> $2', $text);

        // Match decimal numbers in context (e.g., "score of 3.5", "with 2.75", "average of 3.0")
        $text = preg_replace('/(score of|average of|average score of|with|an average|increase of|decrease of|gain of|change of|improvement of|with a|with an|only|about|approximately|over|under|above|below|at|around)\s+(\d+\.\d+)/i', '$1 <strong>$2</strong>', $text);

        // Match standalone decimal numbers (e.g., "3.5", "2.75") not already in strong tags
        $text = preg_replace('/(?<!<strong>)(?<!>)(\d+\.\d+)(?!<\/strong>)(?=\s|$|,|\.|%)/', '<strong>$1</strong>', $text);

        // Match whole numbers in metric contexts (2+ digits to avoid single digits in text)
        // Match numbers followed by specific words or at end of phrases
        $text = preg_replace('/(\d{2,})(?=\s+(evaluations?|groups?|associates?|members?|range|count|portion|percent|percentage)|$|,|\.)/', '<strong>$1</strong>', $text);

        // Clean up any double bolding
        $text = preg_replace('/<strong><strong>(.*?)<\/strong><\/strong>/', '<strong>$1</strong>', $text);

        return $text;
    }

    private function calculatePerformanceInsights($evaluations, $averageScore, $performanceDistribution)
    {
        $totalEvals = $evaluations->count();
        $excellentCount = $performanceDistribution['excellent'];
        $goodCount = $performanceDistribution['good'];
        $fairCount = $performanceDistribution['fair'];
        $poorCount = $performanceDistribution['poor'];

        // Calculate percentages with zero division protection
        $excellentPercentage = $totalEvals > 0 ? round(($excellentCount / $totalEvals) * 100, 1) : 0;
        $goodPercentage = $totalEvals > 0 ? round(($goodCount / $totalEvals) * 100, 1) : 0;
        $fairPercentage = $totalEvals > 0 ? round(($fairCount / $totalEvals) * 100, 1) : 0;
        $poorPercentage = $totalEvals > 0 ? round(($poorCount / $totalEvals) * 100, 1) : 0;

        // Calculate performance insights
        $insights = [];

        // Overall performance analysis
        if ($averageScore >= 3.5) {
            $insights['overall_performance'] = 'The DPAR network demonstrates exceptional performance with an average score of ' . $averageScore . '/4.0. This indicates that associate groups are consistently exceeding expectations in disaster preparedness activities, showing strong commitment to community resilience.';
        } elseif ($averageScore >= 3.0) {
            $insights['overall_performance'] = 'The network shows strong performance with an average score of ' . $averageScore . '/4.0. This suggests that most associate groups are meeting or exceeding performance expectations, indicating effective engagement in disaster preparedness initiatives.';
        } elseif ($averageScore >= 2.5) {
            $insights['overall_performance'] = 'The network demonstrates moderate performance with an average score of ' . $averageScore . '/4.0. While there is room for improvement, the results show that associate groups are actively participating in disaster preparedness activities with potential for growth.';
        } else {
            $insights['overall_performance'] = 'The network shows performance below expectations with an average score of ' . $averageScore . '/4.0. This indicates significant opportunities for improvement and suggests the need for targeted support and capacity building initiatives.';
        }

        // Performance distribution analysis
        $highPerformers = $excellentPercentage + $goodPercentage;
        if ($highPerformers >= 70) {
            $insights['distribution_analysis'] = 'The performance distribution is highly positive, with ' . $highPerformers . '% of evaluations in the excellent and good categories. This indicates a strong, well-performing network with most groups demonstrating effective disaster preparedness capabilities.';
        } elseif ($highPerformers >= 50) {
            $insights['distribution_analysis'] = 'The performance distribution shows a balanced network with ' . $highPerformers . '% of evaluations in the excellent and good categories. While there are areas for improvement, the majority of groups are performing well in disaster preparedness activities.';
        } elseif ($highPerformers >= 30) {
            $insights['distribution_analysis'] = 'The performance distribution indicates mixed results with ' . $highPerformers . '% of evaluations in the excellent and good categories. This suggests that while some groups excel, there are significant opportunities for improvement across the network.';
        } else {
            $insights['distribution_analysis'] = 'The performance distribution reveals challenges with only ' . $highPerformers . '% of evaluations in the excellent and good categories. This indicates a need for comprehensive support and development initiatives to enhance network performance.';
        }

        // Specific performance level insights
        if ($excellentPercentage >= 30) {
            $insights['excellent_performance'] = 'Outstanding achievement: ' . $excellentPercentage . '% of evaluations are in the excellent range, demonstrating exceptional commitment to disaster preparedness. These groups serve as models for best practices and should be recognized for their leadership.';
        } elseif ($excellentPercentage >= 15) {
            $insights['excellent_performance'] = 'Strong excellence indicators: ' . $excellentPercentage . '% of evaluations are in the excellent range, showing that a significant portion of the network is performing at the highest level. These groups can mentor others and share best practices.';
        } else {
            $insights['excellent_performance'] = 'Limited excellence representation: Only ' . $excellentPercentage . '% of evaluations are in the excellent range. This suggests opportunities to identify and develop more high-performing groups through targeted support and recognition programs.';
        }

        if ($poorPercentage >= 25) {
            $insights['improvement_needed'] = 'Significant improvement required: ' . $poorPercentage . '% of evaluations are in the poor range, indicating that a substantial portion of the network requires immediate support and development. This represents a critical opportunity for capacity building.';
        } elseif ($poorPercentage >= 15) {
            $insights['improvement_needed'] = 'Moderate improvement needed: ' . $poorPercentage . '% of evaluations are in the poor range, suggesting that some groups would benefit from additional support and training to enhance their disaster preparedness capabilities.';
        } else {
            $insights['improvement_needed'] = 'Limited improvement needs: Only ' . $poorPercentage . '% of evaluations are in the poor range, indicating that the network is generally performing well with minimal groups requiring significant support.';
        }

        // Network health assessment
        if ($averageScore >= 3.0 && $poorPercentage <= 15) {
            $insights['network_health'] = 'The DPAR network is in excellent health with strong overall performance and minimal groups requiring support. This indicates effective program implementation and high engagement levels across associate groups.';
        } elseif ($averageScore >= 2.5 && $poorPercentage <= 25) {
            $insights['network_health'] = 'The DPAR network shows good health with moderate overall performance and manageable support needs. The network is functioning well with opportunities for continued growth and development.';
        } elseif ($averageScore >= 2.0) {
            $insights['network_health'] = 'The DPAR network requires attention with below-average performance and significant support needs. This indicates opportunities for program enhancement and targeted capacity building initiatives.';
        } else {
            $insights['network_health'] = 'The DPAR network faces challenges with low overall performance and high support requirements. This suggests the need for comprehensive program review and strategic intervention to improve network effectiveness.';
        }

        return $insights;
    }

    private function gatherIndividualDashboardData($userId)
    {
        // Get user information
        $user = User::where('id', $userId)
            ->where('role', 'associate_group_leader')
            ->first();

        if (!$user) {
            throw new \Exception('User not found or not an associate group leader');
        }

        // Get all evaluations for this specific user
        $evaluations = Evaluation::with(['user:id,name,organization,role'])
            ->where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();

        // Get associate group information
        $associateGroup = AssociateGroup::where('user_id', $userId)->first();

        // Get SEC number from pending applications (if available)
        $userEmail = $associateGroup ? $associateGroup->email : $user->email;
        $userUsername = $user->username;
        $pendingApplication = PendingApplication::where(function ($query) use ($userEmail, $userUsername) {
            $query->where('email', $userEmail)
                ->orWhere('username', $userUsername);
        })->first();

        $secNumber = $pendingApplication && !empty($pendingApplication->sec_number)
            ? $pendingApplication->sec_number
            : null;

        // Handle case where there's no evaluation data
        if ($evaluations->isEmpty()) {
            return [
                'user_info' => [
                    'id' => $user->id,
                    'name' => $associateGroup ? $associateGroup->director : $user->name,
                    'organization' => $associateGroup ? $associateGroup->name : $user->organization,
                    'email' => $associateGroup ? $associateGroup->email : $user->email,
                    'phone' => $associateGroup ? ($associateGroup->phone ?? 'Not provided') : ($user->phone ?? 'Not provided'),
                    'date_joined' => $associateGroup ? $associateGroup->created_at->format('Y-m-d') : 'Unknown',
                    'group_type' => $associateGroup ? $associateGroup->type : 'Not specified',
                    'group_description' => $associateGroup ? (html_entity_decode($associateGroup->description ?: 'No description provided', ENT_QUOTES, 'UTF-8')) : 'No description available',
                    'sec_number' => $secNumber
                ],
                'overall_stats' => [
                    'total_evaluations' => 0,
                    'average_score' => 0,
                    'latest_score' => 0,
                    'performance_level' => 'No Data',
                    'report_date' => Carbon::now()->format('Y-m-d H:i:s')
                ],
                'performance_insights' => [
                    'overall_performance' => 'No evaluation data available for this associate. The system is ready to begin tracking performance once evaluations are conducted.',
                    'trend_analysis' => 'No performance data to analyze. Begin conducting evaluations to generate meaningful insights.',
                    'strengths' => 'No data available for strengths analysis.',
                    'improvement_areas' => 'No data available for improvement analysis.',
                    'recommendations' => 'No evaluation data available. Begin conducting evaluations to generate meaningful performance insights.'
                ],
                'quarterly_trends' => [],
                'performance_distribution' => ['excellent' => 0, 'good' => 0, 'fair' => 0, 'poor' => 0],
                'category_analysis' => [],
                'evaluation_history' => [],
                'performance_timeline' => [],
                'post_activity' => $this->gatherIndividualPostActivityData($userId)
            ];
        }

        // Calculate overall statistics
        $totalEvaluations = $evaluations->count();
        $averageScore = $evaluations->avg('total_score') ?? 0;
        $latestScore = $evaluations->first()->total_score;
        $performanceLevel = $this->getPerformanceLevel($latestScore);

        // Calculate performance trends (last 4 quarters)
        $quarterlyData = $this->calculateIndividualQuarterlyTrends($evaluations);

        // Calculate performance distribution
        $performanceDistribution = $this->calculatePerformanceDistribution($evaluations);

        // Calculate category performance
        $categoryAnalysis = $this->analyzeCategoryPerformance($evaluations);

        // Generate individual performance insights
        $performanceInsights = $this->calculateIndividualPerformanceInsights($evaluations, $averageScore, $performanceDistribution);

        // Get evaluation history
        $evaluationHistory = $this->getEvaluationHistory($evaluations);

        // Get performance timeline
        $performanceTimeline = $this->getPerformanceTimeline($evaluations);

        // Get performance metrics for all quarters of current year
        $currentYear = Carbon::now()->year;
        $quarterlyMetrics = [];

        // Calculate metrics for each quarter (Q1, Q2, Q3, Q4)
        for ($quarter = 1; $quarter <= 4; $quarter++) {
            $quarterStartMonth = ($quarter - 1) * 3 + 1; // Q1: 1, Q2: 4, Q3: 7, Q4: 10
            $quarterEndMonth = $quarterStartMonth + 2; // Q1: 3, Q2: 6, Q3: 9, Q4: 12

            $quarterStart = Carbon::create($currentYear, $quarterStartMonth, 1)->startOfDay();
            $quarterEnd = Carbon::create($currentYear, $quarterEndMonth, 1)->endOfMonth()->endOfDay();

            $quarterMetrics = $this->calculatePerformanceMetrics(
                $userId,
                $quarterStart->toDateString(),
                $quarterEnd->toDateString()
            );

            if ($quarterMetrics) {
                $quarterlyMetrics["Q{$quarter}"] = $quarterMetrics;
            }
        }

        // Gather individual post activity report and history
        $postActivityData = $this->gatherIndividualPostActivityData($userId);

        return [
            'user_info' => [
                'id' => $user->id,
                'name' => $associateGroup ? $associateGroup->director : $user->name,
                'organization' => $associateGroup ? $associateGroup->name : $user->organization,
                'email' => $associateGroup ? $associateGroup->email : $user->email,
                'phone' => $associateGroup ? ($associateGroup->phone ?? 'Not provided') : ($user->phone ?? 'Not provided'),
                'date_joined' => $associateGroup ? $associateGroup->created_at->format('Y-m-d') : 'Unknown',
                'group_type' => $associateGroup ? $associateGroup->type : 'Not specified',
                'group_description' => $associateGroup ? (html_entity_decode($associateGroup->description ?: 'No description provided', ENT_QUOTES, 'UTF-8')) : 'No description available',
                'sec_number' => $secNumber
            ],
            'overall_stats' => [
                'total_evaluations' => $totalEvaluations,
                'average_score' => round($averageScore, 2),
                'latest_score' => $latestScore,
                'performance_level' => $performanceLevel,
                'report_date' => Carbon::now()->format('Y-m-d H:i:s')
            ],
            'performance_insights' => $performanceInsights,
            'quarterly_trends' => $quarterlyData,
            'performance_distribution' => $performanceDistribution,
            'category_analysis' => $categoryAnalysis,
            'evaluation_history' => $evaluationHistory,
            'performance_timeline' => $performanceTimeline,
            'quarterly_metrics' => $quarterlyMetrics,
            'metrics_year' => $currentYear,
            'post_activity' => $postActivityData
        ];
    }

    private function calculateIndividualQuarterlyTrends($evaluations)
    {
        $quarters = [];
        $currentYear = Carbon::now()->year;

        for ($i = 3; $i >= 0; $i--) {
            $quarterStart = Carbon::create($currentYear, ($i * 3) + 1, 1);
            $quarterEnd = $quarterStart->copy()->addMonths(2)->endOfMonth();

            $quarterEvaluations = $evaluations->filter(function ($evaluation) use ($quarterStart, $quarterEnd) {
                $evalDate = Carbon::parse($evaluation->created_at);
                return $evalDate->between($quarterStart, $quarterEnd);
            });

            $quarters[] = [
                'quarter' => 'Q' . ($i + 1),
                'average_score' => $quarterEvaluations->avg('total_score') ?? 0,
                'total_evaluations' => $quarterEvaluations->count(),
                'period' => $quarterStart->format('M Y') . ' - ' . $quarterEnd->format('M Y')
            ];
        }

        return array_reverse($quarters);
    }

    private function calculateIndividualPerformanceInsights($evaluations, $averageScore, $performanceDistribution)
    {
        $totalEvals = $evaluations->count();
        $excellentCount = $performanceDistribution['excellent'];
        $goodCount = $performanceDistribution['good'];
        $fairCount = $performanceDistribution['fair'];
        $poorCount = $performanceDistribution['poor'];

        // Calculate percentages with zero division protection
        $excellentPercentage = $totalEvals > 0 ? round(($excellentCount / $totalEvals) * 100, 1) : 0;
        $goodPercentage = $totalEvals > 0 ? round(($goodCount / $totalEvals) * 100, 1) : 0;
        $fairPercentage = $totalEvals > 0 ? round(($fairCount / $totalEvals) * 100, 1) : 0;
        $poorPercentage = $totalEvals > 0 ? round(($poorCount / $totalEvals) * 100, 1) : 0;

        $insights = [];

        // Overall performance analysis
        if ($averageScore >= 3.5) {
            $insights['overall_performance'] = 'This associate demonstrates exceptional performance with an average score of ' . $averageScore . '/4.0. The consistent high performance indicates outstanding commitment to disaster preparedness activities and serves as an exemplary model for other groups in the network.';
        } elseif ($averageScore >= 3.0) {
            $insights['overall_performance'] = 'This associate shows strong performance with an average score of ' . $averageScore . '/4.0. The results indicate effective engagement in disaster preparedness initiatives with consistent delivery of quality outcomes.';
        } elseif ($averageScore >= 2.5) {
            $insights['overall_performance'] = 'This associate demonstrates moderate performance with an average score of ' . $averageScore . '/4.0. While there is room for improvement, the results show active participation in disaster preparedness activities with potential for growth and development.';
        } else {
            $insights['overall_performance'] = 'This associate shows performance below expectations with an average score of ' . $averageScore . '/4.0. This indicates significant opportunities for improvement and suggests the need for targeted support and capacity building initiatives.';
        }

        // Trend analysis
        if ($totalEvals >= 2) {
            $recentScores = $evaluations->take(2)->pluck('total_score');
            $trend = $recentScores[0] - $recentScores[1];

            if ($trend > 0.2) {
                $insights['trend_analysis'] = 'The performance trend shows strong improvement with a recent increase of ' . round($trend, 2) . ' points. This indicates effective implementation of improvement strategies and growing engagement in disaster preparedness activities.';
            } elseif ($trend > 0) {
                $insights['trend_analysis'] = 'The performance trend shows modest improvement with a recent increase of ' . round($trend, 2) . ' points. This suggests steady progress in disaster preparedness capabilities.';
            } elseif ($trend > -0.2) {
                $insights['trend_analysis'] = 'The performance trend shows relatively stable performance with minimal change (' . round($trend, 2) . ' points). This indicates consistent engagement levels in disaster preparedness activities.';
            } else {
                $insights['trend_analysis'] = 'The performance trend shows declining performance with a recent decrease of ' . round(abs($trend), 2) . ' points. This suggests the need for immediate attention and support to reverse the negative trajectory.';
            }
        } else {
            $insights['trend_analysis'] = 'Insufficient data for trend analysis. More evaluations are needed to identify performance patterns and trends.';
        }

        // Strengths analysis
        $strengths = [];
        if ($excellentPercentage >= 30) {
            $strengths[] = 'Exceptional performance consistency with ' . $excellentPercentage . '% of evaluations in the excellent range';
        }
        if ($goodPercentage >= 40) {
            $strengths[] = 'Strong performance reliability with ' . $goodPercentage . '% of evaluations in the good range';
        }
        if ($averageScore >= 3.0) {
            $strengths[] = 'Above-average overall performance indicating effective disaster preparedness capabilities';
        }

        $insights['strengths'] = !empty($strengths) ? implode('. ', $strengths) . '.' : 'No significant strengths identified. Focus on improvement areas to enhance performance.';

        // Improvement areas
        $improvements = [];
        if ($poorPercentage >= 25) {
            $improvements[] = 'Significant improvement needed with ' . $poorPercentage . '% of evaluations in the poor range';
        }
        if ($fairPercentage >= 40) {
            $improvements[] = 'Moderate improvement opportunities with ' . $fairPercentage . '% of evaluations in the fair range';
        }
        if ($averageScore < 2.5) {
            $improvements[] = 'Overall performance below expectations requiring comprehensive support and development';
        }

        $insights['improvement_areas'] = !empty($improvements) ? implode('. ', $improvements) . '.' : 'Performance is generally satisfactory. Continue current practices while seeking opportunities for excellence.';

        // Recommendations
        $recommendations = [];
        if ($averageScore >= 3.5) {
            $recommendations[] = 'Consider this associate as a mentor for other groups to share best practices';
            $recommendations[] = 'Recognize exceptional performance and consider for leadership opportunities';
        } elseif ($averageScore >= 3.0) {
            $recommendations[] = 'Continue current practices while identifying opportunities for excellence';
            $recommendations[] = 'Consider peer-to-peer learning with top-performing associates';
        } elseif ($averageScore >= 2.5) {
            $recommendations[] = 'Provide targeted training in areas of weakness';
            $recommendations[] = 'Increase engagement with network activities and best practices';
        } else {
            $recommendations[] = 'Develop comprehensive improvement plan with specific goals and timelines';
            $recommendations[] = 'Provide intensive support and mentoring from experienced associates';
        }

        $insights['recommendations'] = implode('. ', $recommendations) . '.';

        return $insights;
    }

    private function getEvaluationHistory($evaluations)
    {
        $history = [];
        $hasNotes = false;

        // First pass: check if any evaluation has notes
        foreach ($evaluations as $evaluation) {
            $notes = $evaluation->notes ?? null;
            if ($notes && trim($notes) !== '') {
                $hasNotes = true;
                break;
            }
        }

        // Second pass: build history array
        foreach ($evaluations as $evaluation) {
            $evalData = is_string($evaluation->evaluation_data)
                ? json_decode($evaluation->evaluation_data, true)
                : $evaluation->evaluation_data;

            $notes = $evaluation->notes ?? null;

            $history[] = [
                'id' => $evaluation->id,
                'date' => $evaluation->created_at->format('Y-m-d'),
                'total_score' => $evaluation->total_score,
                'performance_level' => $this->getPerformanceLevel($evaluation->total_score),
                'evaluation_data' => $evalData,
                'notes' => $notes
            ];
        }

        return ['history' => $history, 'has_notes' => $hasNotes];
    }

    private function getPerformanceTimeline($evaluations)
    {
        $timeline = [];

        foreach ($evaluations as $evaluation) {
            $timeline[] = [
                'date' => $evaluation->created_at->format('Y-m-d'),
                'score' => $evaluation->total_score,
                'performance_level' => $this->getPerformanceLevel($evaluation->total_score)
            ];
        }

        return $timeline;
    }

    private function analyzeQuarterlyTrends($quarterlyData)
    {
        if (count($quarterlyData) < 2) {
            return 'Insufficient data for trend analysis. More quarterly data is needed to identify performance patterns.';
        }

        $scores = array_column($quarterlyData, 'average_score');
        $firstScore = $scores[0];
        $lastScore = end($scores);
        $highestScore = max($scores);
        $lowestScore = min($scores);

        $improvement = $lastScore - $firstScore;
        $variation = $highestScore - $lowestScore;

        $analysis = '';

        // Overall trend analysis
        if ($improvement > 0.2) {
            $analysis .= 'The quarterly data shows strong positive growth with an improvement of ' . round($improvement, 2) . ' points from Q1 to Q4. This indicates effective program implementation and growing engagement across the network. ';
        } elseif ($improvement > 0) {
            $analysis .= 'The quarterly data shows modest improvement with a gain of ' . round($improvement, 2) . ' points from Q1 to Q4. This suggests steady progress in network development. ';
        } elseif ($improvement > -0.2) {
            $analysis .= 'The quarterly data shows relatively stable performance with minimal change (' . round($improvement, 2) . ' points) from Q1 to Q4. This indicates consistent engagement levels. ';
        } else {
            $analysis .= 'The quarterly data shows declining performance with a decrease of ' . round(abs($improvement), 2) . ' points from Q1 to Q4. This suggests the need for program review and intervention. ';
        }

        // Consistency analysis
        if ($variation < 0.3) {
            $analysis .= 'Performance has been highly consistent across quarters with minimal variation (' . round($variation, 2) . ' points), indicating stable program delivery and predictable outcomes. ';
        } elseif ($variation < 0.6) {
            $analysis .= 'Performance shows moderate variation across quarters (' . round($variation, 2) . ' points), suggesting some seasonal or programmatic fluctuations. ';
        } else {
            $analysis .= 'Performance shows significant variation across quarters (' . round($variation, 2) . ' points), indicating potential seasonal effects or program delivery inconsistencies that may require attention. ';
        }

        // Peak performance analysis
        $peakQuarter = array_search($highestScore, $scores);
        $peakQuarterName = $quarterlyData[$peakQuarter]['quarter'];
        $analysis .= 'Peak performance was achieved in ' . $peakQuarterName . ' with a score of ' . round($highestScore, 2) . ', while the lowest performance was ' . round($lowestScore, 2) . '. ';

        // Future outlook
        if ($improvement > 0.1 && $lastScore > $firstScore) {
            $analysis .= 'The positive trend suggests continued growth potential and effective program management.';
        } elseif ($improvement < -0.1) {
            $analysis .= 'The declining trend indicates the need for immediate intervention and program review to reverse the negative trajectory.';
        } else {
            $analysis .= 'The stable trend suggests maintaining current program levels while identifying opportunities for targeted improvement.';
        }

        return $analysis;
    }

    private function generateAnalysisHTML($data)
    {
        $html = '
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>DPAR Performance Analysis Report</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    color: #333;
                    line-height: 1.6;
                }
                .header {
                    text-align: center;
                    border-bottom: 3px solid #A11C22;
                    padding-bottom: 15px;
                    margin-bottom: 15px;
                }
                .header h1 {
                    color: #A11C22;
                    margin: 0;
                    font-size: 28px;
                }
                .header p {
                    color: #666;
                    margin: 5px 0 0 0;
                    font-size: 14px;
                }
                .section {
                    margin-bottom: 15px;
                    page-break-inside: avoid;
                }
                .section h2 {
                    color: #A11C22;
                    border-bottom: 2px solid #A11C22;
                    padding-bottom: 5px;
                    margin-bottom: 10px;
                    margin-top: 15px;
                    font-size: 20px;
                }
                .section h3 {
                    color: #333;
                    margin-bottom: 8px;
                    margin-top: 10px;
                    font-size: 16px;
                }
                .section p {
                    margin-bottom: 8px;
                    margin-top: 5px;
                }
                .section ul {
                    margin-bottom: 10px;
                    margin-top: 5px;
                    padding-left: 20px;
                }
                .section li {
                    margin-bottom: 5px;
                }
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin-bottom: 20px;
                    grid-auto-flow: row;
                }
                .stat-card {
                    background: #f8f9fa;
                    border: 1px solid #dee2e6;
                    border-radius: 8px;
                    padding: 15px;
                    text-align: center;
                    min-width: 0;
                    overflow: hidden;
                }
                .stat-value {
                    font-size: 24px;
                    font-weight: bold;
                    color: #A11C22;
                    margin-bottom: 3px;
                }
                .stat-label {
                    font-size: 12px;
                    color: #666;
                    text-transform: uppercase;
                }
                .performance-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                }
                .performance-table th,
                .performance-table td {
                    border: 1px solid #dee2e6;
                    padding: 12px;
                    text-align: left;
                }
                .performance-table th {
                    background: #A11C22;
                    color: white;
                    font-weight: bold;
                }
                .performance-table tr:nth-child(even) {
                    background: #f8f9fa;
                }
                .excellent { color: #28a745; font-weight: bold; }
                .good { color: #17a2b8; font-weight: bold; }
                .fair { color: #ffc107; font-weight: bold; }
                .poor { color: #dc3545; font-weight: bold; }
                .recommendations {
                    background: #f8f9fa;
                    border-left: 4px solid #A11C22;
                    padding: 15px;
                    margin: 20px 0;
                }
                .recommendations ul {
                    margin: 0;
                    padding-left: 20px;
                }
                .recommendations li {
                    margin-bottom: 8px;
                }
                .trend-chart {
                    background: #f8f9fa;
                    border: 1px solid #dee2e6;
                    border-radius: 8px;
                    padding: 15px;
                    margin: 10px 0;
                }
                .quarter-data {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                    padding: 8px;
                    background: white;
                    border-radius: 4px;
                }
                .category-analysis {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 10px;
                    margin-top: 0;
                }
                .category-card {
                    background: #f8f9fa;
                    border: 1px solid #dee2e6;
                    border-radius: 8px;
                    padding: 15px;
                }
                .category-title {
                    font-weight: bold;
                    color: #A11C22;
                    margin-bottom: 10px;
                }
                .category-score {
                    font-size: 18px;
                    font-weight: bold;
                    color: #333;
                }
                .insights-container {
                    background: #f8f9fa;
                    border-radius: 8px;
                    padding: 15px;
                    margin: 10px 0;
                    border-left: 4px solid #A11C22;
                }
                
                .insight-section {
                    margin-bottom: 12px;
                    padding: 10px;
                    background: white;
                    border-radius: 6px;
                    border: 1px solid #e5e7eb;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }
                
                .insight-section h3 {
                    color: #A11C22;
                    font-size: 16px;
                    font-weight: 700;
                    margin: 0 0 5px 0;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .insight-section p {
                    color: #374151;
                    font-size: 14px;
                    line-height: 1.6;
                    margin: 0;
                }
                
                .trend-analysis {
                    background: #f0f9ff;
                    border: 1px solid #0ea5e9;
                    border-radius: 6px;
                    padding: 15px;
                    margin-top: 15px;
                }
                
                .trend-analysis h4 {
                    color: #0369a1;
                    font-size: 14px;
                    font-weight: 700;
                    margin: 0 0 8px 0;
                    text-transform: uppercase;
                }
                
                .trend-analysis p {
                    color: #0c4a6e;
                    font-size: 13px;
                    line-height: 1.5;
                    margin: 0;
                }
                
                .footer {
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #dee2e6;
                    text-align: center;
                    color: #666;
                    font-size: 12px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>DPAR Performance Analysis Report</h1>
                <p>Generated on: ' . $data['overall_stats']['report_date'] . '</p>
            </div>

            <div class="section">
                <h2>Executive Summary</h2>
                <p>This comprehensive performance analysis report provides an in-depth evaluation of the DPAR (Disaster Preparedness and Response) platform\'s associate groups and their collective impact on disaster preparedness initiatives. The analysis encompasses <strong>' . $data['overall_stats']['total_associates'] . '</strong> active associate groups with <strong>' . $data['overall_stats']['total_evaluations'] . '</strong> comprehensive evaluations conducted across multiple performance dimensions.</p>
                
                <p>The coalition has achieved an average performance score of <strong>' . $data['overall_stats']['average_score'] . '/4.0</strong>, which indicates ' . ($data['overall_stats']['average_score'] >= 3.0 ? 'exceptional commitment and effectiveness' : ($data['overall_stats']['average_score'] >= 2.5 ? 'strong performance with consistent engagement' : ($data['overall_stats']['average_score'] >= 2.0 ? 'moderate performance with opportunities for growth' : 'significant potential for improvement and development'))) . ' in disaster preparedness activities. This performance level reflects the collective efforts of all participating groups in building resilient communities and enhancing disaster response capabilities.</p>
                
                <p>The evaluation framework assesses four critical performance categories: <strong>Volunteer Participation (25%)</strong>, <strong>Task Accommodation and Completion (30%)</strong>, <strong>Communication Effectiveness (15%)</strong>, and <strong>Team Objective Above Self (30%)</strong>. Each category is designed to measure different aspects of disaster preparedness effectiveness, ensuring a holistic view of each group\'s contribution to the broader disaster resilience ecosystem.</p>
            </div>

            <div class="section">
                <h2>Evaluation Methodology</h2>
                <p>The DPAR evaluation system employs a <strong>system-based evaluation approach</strong> that combines automated metric calculation with expert assessment to ensure objective, data-driven performance analysis.</p>
                
                <h3>System-Based Auto-Scoring</h3>
                <p>The evaluation system automatically calculates scores for criteria that can be measured using system data. This ensures consistency, objectivity, and reduces manual evaluation time while maintaining accuracy. The auto-scoring system analyzes:</p>
                <ul>
                    <li><strong>Report Metrics:</strong> Total reports submitted, approval rates, rejection rates, and report quality indicators</li>
                    <li><strong>Volunteer Metrics:</strong> Volunteers recruited, volunteer growth rates, and volunteer engagement levels</li>
                    <li><strong>Notification Metrics:</strong> Response rates, acceptance rates, average response times, and engagement with coalition communications</li>
                    <li><strong>System Engagement Metrics:</strong> Login frequency, total system activities, and overall platform engagement scores</li>
                </ul>
                
                <h3>Metric Types</h3>
                <p>Evaluation criteria are categorized into three types based on how they are scored:</p>
                <ul>
                    <li><strong>Direct Metric Match:</strong> Criteria that are directly measured by system data (e.g., "Total reports submitted" directly measures field activity)</li>
                    <li><strong>Proxy Metric:</strong> Criteria measured using related system data as an approximation (e.g., "Notification response rate" as a proxy for active participation)</li>
                    <li><strong>Manual Scoring Required:</strong> Qualitative criteria that cannot be measured by system metrics and require expert evaluation (e.g., "Treats others fairly and with respect", "Shares new knowledge and ideas freely")</li>
                </ul>
                
                <h3>Scoring Scale</h3>
                <p>All evaluations use a standardized 4-point scale:</p>
                <ul>
                    <li><strong>4 - Excellent:</strong> Exceptional performance exceeding expectations</li>
                    <li><strong>3 - Good:</strong> Strong performance meeting expectations</li>
                    <li><strong>2 - Average:</strong> Adequate performance with room for improvement</li>
                    <li><strong>1 - Poor:</strong> Performance below expectations requiring support</li>
                </ul>
                
                <h3>Weighted Scoring</h3>
                <p>Final scores are calculated using weighted averages based on category importance: Volunteer Participation (25%), Task Accommodation and Completion (30%), Communication Effectiveness (15%), and Team Objective Above Self (30%). This ensures that critical performance areas receive appropriate emphasis in the overall assessment.</p>
            </div>

            <div class="section">
                <h2>Overall Performance Metrics</h2>
                <table style="width: 100%; border-collapse: separate; border-spacing: 12px; margin-bottom: 25px;">
                    <tr>
                        <td class="stat-card" style="width: 25%; text-align: center; vertical-align: top; padding: 20px 15px;">
                            <div class="stat-value">' . $data['overall_stats']['total_evaluations'] . '</div>
                            <div class="stat-label">Total Evaluations</div>
                        </td>
                        <td class="stat-card" style="width: 25%; text-align: center; vertical-align: top; padding: 20px 15px;">
                            <div class="stat-value">' . $data['overall_stats']['total_associates'] . '</div>
                            <div class="stat-label">Total Associates</div>
                        </td>
                        <td class="stat-card" style="width: 25%; text-align: center; vertical-align: top; padding: 20px 15px;">
                            <div class="stat-value">' . $data['overall_stats']['average_score'] . '</div>
                            <div class="stat-label">Average Score</div>
                        </td>
                        <td class="stat-card" style="width: 25%; text-align: center; vertical-align: top; padding: 20px 15px;">
                            <div class="stat-value">' . $data['overall_stats']['total_members'] . '</div>
                            <div class="stat-label">Total Members</div>
                        </td>
                    </tr>
                </table>
            </div>';

        // Add aggregate performance metrics if available (moved below Overall Performance Metrics)
        if (isset($data['aggregate_metrics']) && $data['aggregate_metrics']) {
            $metrics = $data['aggregate_metrics'];
            $html .= '
            <div class="section">
                <h2>System Performance Metrics</h2>
                <p><strong>Evaluation Period:</strong> ' . Carbon::parse($metrics['period']['start_date'])->format('F d, Y') . ' to ' . Carbon::parse($metrics['period']['end_date'])->format('F d, Y') . ' (' . $metrics['period']['period_description'] . ')</p>
                <table style="width: 100%; border-collapse: separate; border-spacing: 12px; margin-bottom: 25px;">
                    <tr>
                        <td class="stat-card" style="width: 20%; text-align: center; vertical-align: top; padding: 18px 12px;">
                            <div class="stat-value">' . $metrics['reports']['total_submitted'] . '</div>
                            <div class="stat-label">Total Reports Submitted</div>
                            <div style="font-size: 11px; color: #666; margin-top: 5px;">Avg: ' . $metrics['reports']['average_per_associate'] . ' per associate</div>
                        </td>
                        <td class="stat-card" style="width: 20%; text-align: center; vertical-align: top; padding: 18px 12px;">
                            <div class="stat-value">' . $metrics['volunteers']['total_recruited'] . '</div>
                            <div class="stat-label">Volunteers Recruited</div>
                            <div style="font-size: 11px; color: #666; margin-top: 5px;">Avg: ' . $metrics['volunteers']['average_per_associate'] . ' per associate</div>
                        </td>
                        <td class="stat-card" style="width: 20%; text-align: center; vertical-align: top; padding: 18px 12px;">
                            <div class="stat-value">' . $metrics['notifications']['total_received'] . '</div>
                            <div class="stat-label">Notifications Received</div>
                            <div style="font-size: 11px; color: #666; margin-top: 5px;">Avg: ' . $metrics['notifications']['average_per_associate'] . ' per associate</div>
                        </td>
                        <td class="stat-card" style="width: 20%; text-align: center; vertical-align: top; padding: 18px 12px;">
                            <div class="stat-value">' . $metrics['system_engagement']['total_activities'] . '</div>
                            <div class="stat-label">System Activities</div>
                            <div style="font-size: 11px; color: #666; margin-top: 5px;">' . $metrics['system_engagement']['total_logins'] . ' logins</div>
                        </td>
                        <td class="stat-card" style="width: 20%; text-align: center; vertical-align: top; padding: 18px 12px;">
                            <div class="stat-value">' . $metrics['system_engagement']['average_login_frequency_per_week'] . '</div>
                            <div class="stat-label">Avg Login Frequency</div>
                            <div style="font-size: 11px; color: #666; margin-top: 5px;">Logins/week per associate</div>
                        </td>
                    </tr>
                </table>';

            // Add calendar events metrics for current year
            if (isset($metrics['calendar_events']) && $metrics['calendar_events']) {
                $calendarMetrics = $metrics['calendar_events'];
                $html .= '
                <div style="margin-top: 25px; padding-top: 20px; border-top: 2px solid #dee2e6;">
                    <h3 style="margin-top: 0; margin-bottom: 15px; color: #333; font-size: 16px;">Calendar Events Metrics (' . $calendarMetrics['year'] . ')</h3>
                    <p style="font-size: 12px; color: #666; margin-bottom: 15px;"><strong>Period:</strong> ' . Carbon::parse($calendarMetrics['year_start'])->format('F d, Y') . ' to ' . Carbon::parse($calendarMetrics['year_end'])->format('F d, Y') . '</p>
                    <table style="width: 100%; border-collapse: separate; border-spacing: 12px; margin-bottom: 15px;">
                        <tr>
                            <td class="stat-card" style="width: 25%; text-align: center; vertical-align: top; padding: 18px 12px;">
                                <div class="stat-value">' . $calendarMetrics['total_events'] . '</div>
                                <div class="stat-label">Total Events</div>
                                <div style="font-size: 11px; color: #666; margin-top: 5px;">Year ' . $calendarMetrics['year'] . '</div>
                            </td>
                            <td class="stat-card" style="width: 25%; text-align: center; vertical-align: top; padding: 18px 12px;">
                                <div class="stat-value">' . $calendarMetrics['average_per_month'] . '</div>
                                <div class="stat-label">Avg Events/Month</div>
                                <div style="font-size: 11px; color: #666; margin-top: 5px;">Across all months</div>
                            </td>
                            <td class="stat-card" style="width: 25%; text-align: center; vertical-align: top; padding: 18px 12px;">
                                <div class="stat-value">' . $calendarMetrics['months_with_events'] . '</div>
                                <div class="stat-label">Active Months</div>
                                <div style="font-size: 11px; color: #666; margin-top: 5px;">Months with events</div>
                            </td>
                            <td class="stat-card" style="width: 25%; text-align: center; vertical-align: top; padding: 18px 12px;">
                                <div class="stat-value">' . ($calendarMetrics['months_with_events'] > 0 ? round(($calendarMetrics['total_events'] / $calendarMetrics['months_with_events']), 2) : 0) . '</div>
                                <div class="stat-label">Avg/Active Month</div>
                                <div style="font-size: 11px; color: #666; margin-top: 5px;">Per active month</div>
                            </td>
                        </tr>
                    </table>
                    <div style="margin-top: 15px; padding: 12px; background: #f8f9fa; border-radius: 6px;">
                        <h4 style="margin-top: 0; margin-bottom: 10px; font-size: 13px; color: #333;">Events Distribution by Month:</h4>
                        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                            <tr>';

                $monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                foreach ($calendarMetrics['events_by_month'] as $month => $count) {
                    $html .= '<td style="text-align: center; padding: 10px; background: white; border: 1px solid #dee2e6; border-right: ' . ($month < 12 ? '1px' : '1px') . ' solid #dee2e6;">
                        <div style="font-size: 11px; color: #666; margin-bottom: 4px;">' . $monthNames[$month - 1] . '</div>
                        <div style="font-size: 16px; font-weight: bold; color: #A11C22;">' . $count . '</div>
                    </td>';
                }

                $html .= '
                            </tr>
                        </table>
                    </div>';

                // Add list of all events with names and descriptions
                if (isset($calendarMetrics['events_list']) && !empty($calendarMetrics['events_list'])) {
                    $html .= '
                    <div style="margin-top: 20px; padding: 12px; background: #f8f9fa; border-radius: 6px;">
                        <h4 style="margin-top: 0; margin-bottom: 15px; font-size: 13px; color: #333;">All Calendar Events (' . $calendarMetrics['year'] . '):</h4>
                        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                            <thead>
                                <tr style="background: #A11C22; color: white;">
                                    <th style="padding: 10px; text-align: left; border: 1px solid #dee2e6; font-size: 12px;">Event Name</th>
                                    <th style="padding: 10px; text-align: left; border: 1px solid #dee2e6; font-size: 12px;">Description</th>
                                    <th style="padding: 10px; text-align: left; border: 1px solid #dee2e6; font-size: 12px;">Location</th>
                                    <th style="padding: 10px; text-align: center; border: 1px solid #dee2e6; font-size: 12px;">Start Date</th>
                                    <th style="padding: 10px; text-align: center; border: 1px solid #dee2e6; font-size: 12px;">End Date</th>
                                </tr>
                            </thead>
                            <tbody>';

                    foreach ($calendarMetrics['events_list'] as $index => $event) {
                        $bgColor = $index % 2 === 0 ? '#ffffff' : '#f8f9fa';
                        $html .= '<tr style="background: ' . $bgColor . ';">
                            <td style="padding: 10px; border: 1px solid #dee2e6; font-size: 11px; font-weight: bold;">' . htmlspecialchars($event['title'] ?? 'N/A') . '</td>
                            <td style="padding: 10px; border: 1px solid #dee2e6; font-size: 11px;">' . htmlspecialchars($event['description'] ?? 'No description') . '</td>
                            <td style="padding: 10px; border: 1px solid #dee2e6; font-size: 11px;">' . htmlspecialchars($event['location'] ?? 'Not specified') . '</td>
                            <td style="padding: 10px; border: 1px solid #dee2e6; font-size: 11px; text-align: center;">' . Carbon::parse($event['start_date'])->format('M d, Y') . '</td>
                            <td style="padding: 10px; border: 1px solid #dee2e6; font-size: 11px; text-align: center;">' . Carbon::parse($event['end_date'])->format('M d, Y') . '</td>
                        </tr>';
                    }

                    $html .= '
                            </tbody>
                        </table>
                    </div>';
                }

                $html .= '
                </div>';
            }

            $html .= '
            </div>';
        }

        $html .= '

            <div class="section">
                <h2>Performance Analysis and Insights</h2>
                <div class="insights-container">
                    <div class="insight-section">
                        <h3>Overall Performance Assessment</h3>
                        <p>' . $this->boldNumericValues($data['performance_insights']['overall_performance']) . '</p>
                    </div>
                    
                    <div class="insight-section">
                        <h3>Performance Distribution Analysis</h3>
                        <p>' . $this->boldNumericValues($data['performance_insights']['distribution_analysis']) . '</p>
                    </div>
                    
                    <div class="insight-section">
                        <h3>Excellence Indicators</h3>
                        <p>' . $this->boldNumericValues($data['performance_insights']['excellent_performance']) . '</p>
                    </div>
                    
                    <div class="insight-section">
                        <h3>Improvement Opportunities</h3>
                        <p>' . $this->boldNumericValues($data['performance_insights']['improvement_needed']) . '</p>
                    </div>
                    
                    <div class="insight-section">
                        <h3>Network Health Assessment</h3>
                        <p>' . $this->boldNumericValues($data['performance_insights']['network_health']) . '</p>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>Performance Distribution Analysis</h2>
                <p>The performance distribution provides crucial insights into the overall health and effectiveness of the DPAR associate network. This analysis reveals how associate groups are distributed across different performance levels, helping identify patterns of excellence, areas of strength, and opportunities for targeted support and development.</p>
                
                <table class="performance-table">
                    <thead>
                        <tr>
                            <th>Performance Level</th>
                            <th>Score Range</th>
                            <th>Count</th>
                            <th>Percentage</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>';

        $totalEvals = array_sum($data['performance_distribution']);
        $performanceLevels = [
            'Excellent' => ['range' => '3.5 - 4.0', 'count' => $data['performance_distribution']['excellent'], 'description' => 'Outstanding performance with exceptional commitment to disaster preparedness initiatives'],
            'Good' => ['range' => '2.5 - 3.4', 'count' => $data['performance_distribution']['good'], 'description' => 'Strong performance demonstrating consistent engagement and effective contribution'],
            'Fair' => ['range' => '1.5 - 2.4', 'count' => $data['performance_distribution']['fair'], 'description' => 'Adequate performance with room for improvement and growth opportunities'],
            'Poor' => ['range' => '0.0 - 1.4', 'count' => $data['performance_distribution']['poor'], 'description' => 'Performance below expectations, requiring immediate attention and support']
        ];

        foreach ($performanceLevels as $level => $info) {
            $percentage = $totalEvals > 0 ? round(($info['count'] / $totalEvals) * 100, 1) : 0;
            $html .= '<tr>
                <td class="' . strtolower($level) . '">' . $level . '</td>
                <td>' . $info['range'] . '</td>
                <td><strong>' . $info['count'] . '</strong></td>
                <td><strong>' . $percentage . '%</strong></td>
                <td>' . $info['description'] . '</td>
            </tr>';
        }

        $html .= '</tbody>
                </table>
            </div>

            <div class="section">
                <h2>Performance Trends Analysis</h2>
                <p>Understanding performance trends over time is crucial for identifying patterns of improvement, seasonal variations, and the overall trajectory of the DPAR associate network. This quarterly analysis provides insights into how performance has evolved, highlighting areas of consistent growth and identifying periods that may require additional attention or support.</p>
                
                <div class="trend-chart">
                    <h3>Quarterly Performance Analysis</h3>
                    <p>The following data shows the progression of average performance scores across four quarters, revealing the collective growth and development of associate groups in disaster preparedness activities.</p>';

        $trendAnalysis = $this->analyzeQuarterlyTrends($data['quarterly_trends']);

        foreach ($data['quarterly_trends'] as $quarter) {
            $html .= '<div class="quarter-data">
                <span><strong>' . $quarter['quarter'] . ' (' . $quarter['period'] . ')</strong></span>
                <span>Average Score: <strong>' . round($quarter['average_score'], 2) . '</strong> | Evaluations: <strong>' . $quarter['total_evaluations'] . '</strong></span>
            </div>';
        }

        $html .= '</div>
                <div class="trend-analysis">
                    <h4>Trend Analysis:</h4>
                    <p>' . $this->boldNumericValues($trendAnalysis) . '</p>
                </div>';

        $html .= '</div>
            </div>

            <div class="section">
                <h2>Top Performers Analysis</h2>
                <p>Recognizing and understanding the characteristics of top-performing associate groups is essential for identifying best practices, successful strategies, and models for replication across the network. These groups demonstrate exceptional commitment to disaster preparedness and serve as benchmarks for excellence within the DPAR platform.</p>
                
                <p>The following associate groups have consistently demonstrated outstanding performance across all evaluation criteria, showing exceptional leadership in volunteer participation, community engagement, and disaster preparedness initiatives. Their achievements provide valuable insights into effective practices that can be shared with other groups to enhance overall network performance.</p>
                
                <table class="performance-table">
                    <thead>
                        <tr>
                            <th>Associate</th>
                            <th>Organization</th>
                            <th>Latest Score</th>
                            <th>Average Score</th>
                            <th>Total Evaluations</th>
                            <th>Performance Level</th>
                        </tr>
                    </thead>
                    <tbody>';

        foreach ($data['top_performers'] as $performer) {
            $html .= '<tr>
                <td>' . $performer['user_name'] . '</td>
                <td>' . $performer['organization'] . '</td>
                <td><strong>' . $performer['latest_score'] . '</strong></td>
                <td><strong>' . $performer['average_score'] . '</strong></td>
                <td><strong>' . $performer['total_evaluations'] . '</strong></td>
                <td class="' . strtolower($performer['performance_level']) . '">' . $performer['performance_level'] . '</td>
            </tr>';
        }

        $html .= '</tbody>
                </table>
            </div>

            <div class="section">
                <h2>Areas Requiring Support and Development</h2>
                <p>Identifying associate groups that require additional support is crucial for ensuring equitable development across the entire DPAR network. These groups represent opportunities for targeted intervention, capacity building, and collaborative support to help them reach their full potential in disaster preparedness activities.</p>
                
                <p>The following associate groups have been identified as requiring additional support and development. This identification is not a judgment of their commitment or potential, but rather an opportunity to provide targeted resources, training, and mentorship to help them excel in their disaster preparedness mission. With appropriate support, these groups can become valuable contributors to the network\'s overall resilience goals.</p>
                
                <table class="performance-table">
                    <thead>
                        <tr>
                            <th>Associate</th>
                            <th>Organization</th>
                            <th>Latest Score</th>
                            <th>Average Score</th>
                            <th>Total Evaluations</th>
                            <th>Performance Level</th>
                        </tr>
                    </thead>
                    <tbody>';

        foreach ($data['bottom_performers'] as $performer) {
            $html .= '<tr>
                <td>' . $performer['user_name'] . '</td>
                <td>' . $performer['organization'] . '</td>
                <td><strong>' . $performer['latest_score'] . '</strong></td>
                <td><strong>' . $performer['average_score'] . '</strong></td>
                <td><strong>' . $performer['total_evaluations'] . '</strong></td>
                <td class="' . strtolower($performer['performance_level']) . '">' . $performer['performance_level'] . '</td>
            </tr>';
        }

        $html .= '</tbody>
                </table>
            </div>

            <div class="section">
                <h2>Category Performance Analysis</h2>
                <p>Understanding performance across different evaluation categories provides insights into the specific strengths and areas for improvement within the DPAR associate network. Each category represents a critical dimension of disaster preparedness effectiveness, and analyzing performance across these categories helps identify which areas are thriving and which require focused attention.</p>
                
                <p>The five evaluation categories are designed to capture the multifaceted nature of effective disaster preparedness work:</p>
                <ul>
                    <li><strong>Volunteer Participation:</strong> Measures the level of active volunteer engagement and commitment to disaster preparedness activities</li>
                    <li><strong>Community Engagement:</strong> Evaluates the depth and effectiveness of community outreach and involvement</li>
                    <li><strong>Leadership & Initiative:</strong> Assesses the group\'s ability to take initiative and provide leadership in disaster preparedness</li>
                    <li><strong>Communication & Collaboration:</strong> Evaluates effectiveness in communication and collaborative efforts with other groups</li>
                    <li><strong>Professional Development:</strong> Measures commitment to continuous learning and skill development in disaster preparedness</li>
                </ul>
                
                <div class="category-analysis">';

        foreach ($data['category_analysis'] as $category => $analysis) {
            $html .= '<div class="category-card">
                <div class="category-title">' . $category . '</div>
                <div class="category-score"><strong>' . $analysis['average_score'] . '/4.0</strong></div>
                <div>Performance Level: <span class="' . strtolower($analysis['performance_level']) . '">' . $analysis['performance_level'] . '</span></div>
                <div>Evaluations: <strong>' . $analysis['total_evaluations'] . '</strong></div>
            </div>';
        }

        $html .= '</div>
            </div>

            <div class="section">
                <h2>Individual Associate Performance Overview</h2>
                <p>This comprehensive overview provides detailed performance metrics for each associate group within the DPAR network. Understanding individual performance patterns helps identify trends, track progress over time, and recognize both achievements and areas requiring attention.</p>
                
                <p>The performance data includes not only current scores but also historical trends and system metrics, allowing for a complete picture of each group\'s development trajectory. This information is essential for making informed decisions about resource allocation, training needs, and recognition opportunities.</p>';

        foreach ($data['individual_performance'] as $individual) {
            $trendIcon = $individual['trend'] === 'improving' ? '📈' : ($individual['trend'] === 'declining' ? '📉' : '➡️');
            $html .= '
            <div style="margin-bottom: 25px; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #A11C22; page-break-inside: avoid;">
                <h3 style="margin-top: 0; color: #A11C22; font-size: 16px; border-bottom: 1px solid #dee2e6; padding-bottom: 8px; margin-bottom: 12px;">' . $individual['user_name'] . ' - ' . $individual['organization'] . '</h3>
                <table style="width: 100%; border-collapse: separate; border-spacing: 12px; margin-bottom: 15px;">
                    <tr>
                        <td style="width: 20%; padding: 8px 10px;"><strong>Latest Score:</strong> ' . $individual['latest_score'] . '</td>
                        <td style="width: 20%; padding: 8px 10px;"><strong>Average Score:</strong> ' . $individual['average_score'] . '</td>
                        <td style="width: 20%; padding: 8px 10px;"><strong>Performance Level:</strong> <span class="' . strtolower($individual['performance_level']) . '">' . $individual['performance_level'] . '</span></td>
                        <td style="width: 20%; padding: 8px 10px;"><strong>Trend:</strong> ' . $trendIcon . ' ' . ucfirst($individual['trend']) . '</td>
                        <td style="width: 20%; padding: 8px 10px;"><strong>Total Evaluations:</strong> ' . $individual['total_evaluations'] . '</td>
                    </tr>
                </table>';

            if (isset($individual['quarterly_metrics']) && !empty($individual['quarterly_metrics'])) {
                $quarterlyMetrics = $individual['quarterly_metrics'];
                $metricsYear = $individual['metrics_year'] ?? Carbon::now()->year;
                $html .= '
                <div style="margin-top: 15px; padding: 15px; background: white; border-radius: 6px;">
                    <h4 style="margin-top: 0; font-size: 14px; color: #333; margin-bottom: 15px;">Performance Metrics Summary by Quarter (' . $metricsYear . '):</h4>';

                // Display metrics for each quarter
                $quarterLabels = [
                    'Q1' => 'Q1 (Jan - Mar)',
                    'Q2' => 'Q2 (Apr - Jun)',
                    'Q3' => 'Q3 (Jul - Sep)',
                    'Q4' => 'Q4 (Oct - Dec)'
                ];

                foreach (['Q1', 'Q2', 'Q3', 'Q4'] as $quarter) {
                    if (isset($quarterlyMetrics[$quarter])) {
                        $metrics = $quarterlyMetrics[$quarter];
                        $html .= '
                    <div style="margin-bottom: 20px; padding: 12px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #A11C22;">
                        <h5 style="margin-top: 0; margin-bottom: 10px; font-size: 13px; color: #A11C22; font-weight: 600;">' . $quarterLabels[$quarter] . '</h5>
                        <table style="width: 100%; border-collapse: separate; border-spacing: 8px; margin-top: 8px;">
                            <tr>
                                <td class="stat-card" style="width: 16.66%; padding: 12px 8px; text-align: center; vertical-align: top; background: white; border-radius: 4px;">
                                    <div class="stat-value" style="font-size: 18px;">' . $metrics['reports']['total_submitted'] . '</div>
                                    <div class="stat-label" style="font-size: 10px;">Reports</div>
                                    <div style="font-size: 9px; color: #666; margin-top: 2px;">' . $metrics['reports']['approval_rate'] . '% approved</div>
                                </td>
                                <td class="stat-card" style="width: 16.66%; padding: 12px 8px; text-align: center; vertical-align: top; background: white; border-radius: 4px;">
                                    <div class="stat-value" style="font-size: 18px;">+' . $metrics['volunteers']['recruited_in_period'] . '</div>
                                    <div class="stat-label" style="font-size: 10px;">Volunteers</div>
                                    <div style="font-size: 9px; color: #666; margin-top: 2px;">Total: ' . ($metrics['volunteers']['total_count'] ?? $metrics['volunteers']['recruited_in_period']) . '</div>
                                </td>
                                <td class="stat-card" style="width: 16.66%; padding: 12px 8px; text-align: center; vertical-align: top; background: white; border-radius: 4px;">
                                    <div class="stat-value" style="font-size: 18px;">' . $metrics['notifications']['total_received'] . '</div>
                                    <div class="stat-label" style="font-size: 10px;">Notifications</div>
                                    <div style="font-size: 9px; color: #666; margin-top: 2px;">' . $metrics['notifications']['response_rate'] . '% responded</div>
                                </td>
                                <td class="stat-card" style="width: 16.66%; padding: 12px 8px; text-align: center; vertical-align: top; background: white; border-radius: 4px;">
                                    <div class="stat-value" style="font-size: 18px;">' . $metrics['notifications']['acceptance_rate'] . '%</div>
                                    <div class="stat-label" style="font-size: 10px;">Acceptance Rate</div>
                                    <div style="font-size: 9px; color: #666; margin-top: 2px;">' . $metrics['notifications']['accepted'] . ' accepted, ' . ($metrics['notifications']['declined'] ?? 0) . ' declined</div>
                                </td>
                                <td class="stat-card" style="width: 16.66%; padding: 12px 8px; text-align: center; vertical-align: top; background: white; border-radius: 4px;">
                                    <div class="stat-value" style="font-size: 18px;">' . number_format($metrics['notifications']['avg_response_time_hours'], 1) . 'h</div>
                                    <div class="stat-label" style="font-size: 10px;">Response Time</div>
                                    <div style="font-size: 9px; color: #666; margin-top: 2px;">Average</div>
                                </td>
                                <td class="stat-card" style="width: 16.66%; padding: 12px 8px; text-align: center; vertical-align: top; background: white; border-radius: 4px;">
                                    <div class="stat-value" style="font-size: 18px;">' . $metrics['system_engagement']['engagement_score'] . '%</div>
                                    <div class="stat-label" style="font-size: 10px;">System Engagement</div>
                                    <div style="font-size: 9px; color: #666; margin-top: 2px;">' . $metrics['system_engagement']['engagement_level'] . ' (' . $metrics['system_engagement']['login_frequency_per_week'] . ' logins/week)</div>
                                </td>
                            </tr>
                        </table>
                    </div>';
                    }
                }

                $html .= '
                </div>';
            }

            $html .= '</div>';
        }

        $html .= '
            </div>

            <div class="section">
                <h2>Posting Activity Report and History</h2>
                <p>This section tracks all posting activities across the DPAR platform, including <strong>Notifications</strong> (task assignments/alerts sent by administrators to associates), <strong>Announcements</strong> (public posts visible to all users), <strong>Training Programs</strong> (training sessions and educational programs posted by administrators or associates), and <strong>Reports</strong> (submitted by associates to administrators). The section analyzes posting frequency, recipient engagement, response patterns, and historical trends to assess communication effectiveness and platform activity levels.</p>';

        if (isset($data['post_activity']) && $data['post_activity']) {
            $postActivity = $data['post_activity'];

            // Overall Statistics - All Post Types
            $totalPosts = $postActivity['overall_stats']['total_notifications'] + $postActivity['overall_stats']['total_announcements'] + ($postActivity['overall_stats']['total_training_programs'] ?? 0) + $postActivity['overall_stats']['total_reports'];
            $html .= '
                <h3>Overall Posting Statistics</h3>
                <p style="font-size: 13px; color: #666; margin-bottom: 15px;"><strong>Note on Counting:</strong> "Total Recipients" counts each recipient per notification (if someone receives 3 notifications, they are counted 3 times). "Unique Recipients" counts each person only once across all notifications.</p>
                
                <h4 style="margin-top: 20px; margin-bottom: 10px; color: #333; font-size: 15px;">Post Types Summary</h4>
                <table style="width: 100%; border-collapse: separate; border-spacing: 10px; margin-bottom: 25px;">
                    <tr>
                        <td class="stat-card" style="width: 20%; text-align: center; vertical-align: top; padding: 20px 12px;">
                            <div class="stat-value">' . $postActivity['overall_stats']['total_notifications'] . '</div>
                            <div class="stat-label">Notifications</div>
                            <div style="font-size: 11px; color: #666; margin-top: 5px;">Task assignments/alerts sent by administrators</div>
                        </td>
                        <td class="stat-card" style="width: 20%; text-align: center; vertical-align: top; padding: 20px 12px;">
                            <div class="stat-value">' . $postActivity['overall_stats']['total_announcements'] . '</div>
                            <div class="stat-label">Announcements</div>
                            <div style="font-size: 11px; color: #666; margin-top: 5px;">Public posts visible to all users</div>
                        </td>
                        <td class="stat-card" style="width: 20%; text-align: center; vertical-align: top; padding: 20px 12px;">
                            <div class="stat-value">' . ($postActivity['overall_stats']['total_training_programs'] ?? 0) . '</div>
                            <div class="stat-label">Training Programs</div>
                            <div style="font-size: 11px; color: #666; margin-top: 5px;">Training sessions posted by administrators or associates</div>
                        </td>
                        <td class="stat-card" style="width: 20%; text-align: center; vertical-align: top; padding: 20px 12px;">
                            <div class="stat-value">' . $postActivity['overall_stats']['total_reports'] . '</div>
                            <div class="stat-label">Reports</div>
                            <div style="font-size: 11px; color: #666; margin-top: 5px;">Submitted by associates to administrators</div>
                        </td>
                        <td class="stat-card" style="width: 20%; text-align: center; vertical-align: top; padding: 20px 12px;">
                            <div class="stat-value">' . $totalPosts . '</div>
                            <div class="stat-label">Total Posts</div>
                            <div style="font-size: 11px; color: #666; margin-top: 5px;">All types combined</div>
                        </td>
                    </tr>
                </table>
                
                <h4 style="margin-top: 20px; margin-bottom: 10px; color: #333; font-size: 15px;">Notification Engagement Metrics</h4>
                <table style="width: 100%; border-collapse: separate; border-spacing: 10px; margin-bottom: 25px;">
                    <tr>
                        <td class="stat-card" style="width: 20%; text-align: center; vertical-align: top; padding: 20px 12px;">
                            <div class="stat-value">' . $postActivity['overall_stats']['total_notification_recipients'] . '</div>
                            <div class="stat-label">Total Recipients</div>
                            <div style="font-size: 11px; color: #666; margin-top: 5px;">All notifications combined</div>
                        </td>
                        <td class="stat-card" style="width: 20%; text-align: center; vertical-align: top; padding: 20px 12px;">
                            <div class="stat-value">' . (isset($postActivity['overall_stats']['unique_notification_recipients']) ? $postActivity['overall_stats']['unique_notification_recipients'] : $postActivity['overall_stats']['total_notification_recipients']) . '</div>
                            <div class="stat-label">Unique Recipients</div>
                            <div style="font-size: 11px; color: #666; margin-top: 5px;">Distinct people</div>
                        </td>
                        <td class="stat-card" style="width: 20%; text-align: center; vertical-align: top; padding: 20px 12px;">
                            <div class="stat-value">' . $postActivity['overall_stats']['total_responses'] . '</div>
                            <div class="stat-label">Total Responses</div>
                            <div style="font-size: 11px; color: #666; margin-top: 5px;">To notifications</div>
                        </td>
                        <td class="stat-card" style="width: 20%; text-align: center; vertical-align: top; padding: 20px 12px;">
                            <div class="stat-value">' . $postActivity['overall_stats']['overall_response_rate'] . '%</div>
                            <div class="stat-label">Response Rate</div>
                            <div style="font-size: 11px; color: #666; margin-top: 5px;">Of total recipients</div>
                        </td>
                        <td class="stat-card" style="width: 20%; text-align: center; vertical-align: top; padding: 20px 12px;">
                            <div class="stat-value">' . $postActivity['overall_stats']['acceptance_rate'] . '%</div>
                            <div class="stat-label">Acceptance Rate</div>
                            <div style="font-size: 11px; color: #666; margin-top: 5px;">Of responses</div>
                        </td>
                    </tr>
                </table>';

            // Posting Analysis
            $html .= '
                <h3>Posting Analysis</h3>
                <div class="insights-container">
                    <div class="insight-section">
                        <h3>Overall Platform Activity</h3>
                        <p>The platform has a total of <strong>' . $totalPosts . ' posts</strong> across all types: <strong>' . $postActivity['overall_stats']['total_notifications'] . ' notifications</strong> (task assignments/alerts), <strong>' . $postActivity['overall_stats']['total_announcements'] . ' announcements</strong> (public posts), <strong>' . ($postActivity['overall_stats']['total_training_programs'] ?? 0) . ' training programs</strong> (training sessions), and <strong>' . $postActivity['overall_stats']['total_reports'] . ' reports</strong> (submitted by associates). This indicates ' .
                ($totalPosts > 20 ? 'high' : ($totalPosts > 10 ? 'moderate' : 'low')) . ' overall posting activity across the platform.</p>
                    </div>
                    <div class="insight-section">
                        <h3>Notification Engagement Level</h3>
                        <p>The overall engagement level for notifications is <strong>' . $postActivity['posting_analysis']['engagement_level'] . '</strong> with a response rate of ' . $postActivity['overall_stats']['overall_response_rate'] . '%. ' .
                ($postActivity['posting_analysis']['engagement_level'] === 'Excellent'
                    ? 'This indicates strong communication effectiveness and high associate engagement with posted notifications.'
                    : ($postActivity['posting_analysis']['engagement_level'] === 'Good'
                        ? 'This shows good communication effectiveness with room for further improvement in engagement.'
                        : ($postActivity['posting_analysis']['engagement_level'] === 'Moderate'
                            ? 'This suggests moderate engagement levels. Consider strategies to improve response rates and associate participation.'
                            : 'This indicates low engagement levels. Immediate action is needed to improve communication effectiveness and associate participation.'))) . '</p>
                    </div>
                    <div class="insight-section">
                        <h3>Response Patterns</h3>
                        <p>On average, each notification receives <strong>' . $postActivity['posting_analysis']['average_responses_per_notification'] . '</strong> responses. Out of ' . $postActivity['overall_stats']['total_responses'] . ' total responses, <strong>' . $postActivity['overall_stats']['total_accepted'] . '</strong> were accepted (' . $postActivity['overall_stats']['acceptance_rate'] . '%) and <strong>' . $postActivity['overall_stats']['total_declined'] . '</strong> were declined.</p>
                    </div>
                </div>';


            // Quarterly Trends
            if (!empty($postActivity['quarterly_trends'])) {
                $html .= '
                <h3>Quarterly Posting Trends</h3>
                <p style="font-size: 13px; color: #666; margin-bottom: 15px;">This section shows the posting activity trends across all post types (Notifications, Announcements, Training Programs, and Reports) for each quarter. For notification-specific engagement metrics (response rates, acceptance rates), refer to the "Notification Engagement Metrics" section above.</p>
                <div class="trend-chart">';

                foreach ($postActivity['quarterly_trends'] as $quarter) {
                    $html .= '
                    <div class="quarter-data">
                        <div>
                            <strong>' . $quarter['quarter'] . ' (' . $quarter['period'] . ')</strong><br>
                            <span style="font-size: 12px; color: #666;">' . $quarter['total_notifications'] . ' notifications | ' . $quarter['total_announcements'] . ' announcements | ' . ($quarter['total_training_programs'] ?? 0) . ' training programs | ' . $quarter['total_reports'] . ' reports</span>
                        </div>
                    </div>';
                }

                $html .= '
                </div>';
            }
        } else {
            $html .= '
                <p>No posting activity data available at this time.</p>';
        }

        $html .= '
            </div>

            <div class="section">
                <h2>Strategic Recommendations and Action Items</h2>
                <p>Based on the comprehensive analysis of the DPAR associate network performance, the following strategic recommendations have been developed to enhance overall effectiveness, support continued growth, and strengthen the disaster preparedness ecosystem. These recommendations are designed to be actionable and measurable, providing clear direction for network improvement.</p>
                
                <div class="recommendations">
                    <h3>Priority Action Items:</h3>
                    <ul>';

        foreach ($data['recommendations'] as $recommendation) {
            $html .= '<li>' . $recommendation . '</li>';
        }

        $html .= '</ul>
                </div>
            </div>

            <div class="footer">
                <p>This report was automatically generated by the DPAR Platform Management System</p>
                <p>For questions or additional analysis, please contact the system administrator</p>
            </div>
        </body>
        </html>';

        return $html;
    }

    private function generateIndividualAnalysisHTML($data)
    {
        $html = '
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Individual Performance Analysis Report - ' . $data['user_info']['name'] . '</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    color: #333;
                    line-height: 1.6;
                }
                .header {
                    text-align: center;
                    border-bottom: 3px solid #A11C22;
                    padding-bottom: 15px;
                    margin-bottom: 15px;
                }
                .header h1 {
                    color: #A11C22;
                    margin: 0;
                    font-size: 24px;
                }
                .header h2 {
                    color: #666;
                    margin: 5px 0 0 0;
                    font-size: 18px;
                    font-weight: normal;
                }
                .header p {
                    color: #666;
                    margin: 5px 0 0 0;
                    font-size: 14px;
                }
                .section {
                    margin-bottom: 15px;
                    page-break-inside: avoid;
                }
                .section h2 {
                    color: #A11C22;
                    border-bottom: 2px solid #A11C22;
                    padding-bottom: 5px;
                    margin-bottom: 10px;
                    margin-top: 15px;
                    font-size: 20px;
                }
                .section h3 {
                    color: #333;
                    margin-bottom: 8px;
                    margin-top: 10px;
                    font-size: 16px;
                }
                .section p {
                    margin-bottom: 8px;
                    margin-top: 5px;
                }
                .section ul {
                    margin-bottom: 10px;
                    margin-top: 5px;
                    padding-left: 20px;
                }
                .section li {
                    margin-bottom: 5px;
                }
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin-bottom: 20px;
                    grid-auto-flow: row;
                }
                .stat-card {
                    background: #f8f9fa;
                    border: 1px solid #dee2e6;
                    border-radius: 8px;
                    padding: 15px;
                    text-align: center;
                    min-width: 0;
                    overflow: hidden;
                }
                .stat-value {
                    font-size: 24px;
                    font-weight: bold;
                    color: #A11C22;
                    margin-bottom: 3px;
                }
                .stat-label {
                    font-size: 12px;
                    color: #666;
                    text-transform: uppercase;
                }
                .performance-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                }
                .performance-table th,
                .performance-table td {
                    border: 1px solid #dee2e6;
                    padding: 12px;
                    text-align: left;
                }
                .performance-table th {
                    background: #A11C22;
                    color: white;
                    font-weight: bold;
                }
                .performance-table tr:nth-child(even) {
                    background: #f8f9fa;
                }
                .excellent { color: #28a745; font-weight: bold; }
                .good { color: #17a2b8; font-weight: bold; }
                .fair { color: #ffc107; font-weight: bold; }
                .poor { color: #dc3545; font-weight: bold; }
                .insights-container {
                    background: #f8f9fa;
                    border-radius: 8px;
                    padding: 15px;
                    margin: 10px 0;
                    border-left: 4px solid #A11C22;
                }
                .insight-section {
                    margin-bottom: 10px;
                    padding: 10px;
                    background: white;
                    border-radius: 6px;
                    border: 1px solid #e5e7eb;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }
                .insight-section h3 {
                    color: #A11C22;
                    font-size: 16px;
                    font-weight: 700;
                    margin: 0 0 5px 0;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .insight-section p {
                    color: #374151;
                    font-size: 14px;
                    line-height: 1.5;
                    margin: 0;
                }
                .trend-chart {
                    background: #f8f9fa;
                    border: 1px solid #dee2e6;
                    border-radius: 8px;
                    padding: 15px;
                    margin: 10px 0;
                }
                .quarter-data {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                    padding: 8px;
                    background: white;
                    border-radius: 4px;
                }
                .category-analysis {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 10px;
                    margin-top: 0;
                }
                .category-card {
                    background: #f8f9fa;
                    border: 1px solid #dee2e6;
                    border-radius: 8px;
                    padding: 15px;
                }
                .category-title {
                    font-weight: bold;
                    color: #A11C22;
                    margin-bottom: 10px;
                }
                .category-score {
                    font-size: 18px;
                    font-weight: bold;
                    color: #333;
                }
                .user-info {
                    background: #f8f9fa;
                    border: 1px solid #dee2e6;
                    border-radius: 8px;
                    padding: 15px;
                    margin-bottom: 10px;
                }
                .user-info h3 {
                    color: #A11C22;
                    margin-top: 0;
                    margin-bottom: 10px;
                }
                .user-info-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                }
                .user-info-item {
                    display: flex;
                    flex-direction: column;
                }
                .user-info-label {
                    font-size: 12px;
                    color: #666;
                    text-transform: uppercase;
                    margin-bottom: 5px;
                }
                .user-info-value {
                    font-weight: bold;
                    color: #333;
                }
                .footer {
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #dee2e6;
                    text-align: center;
                    color: #666;
                    font-size: 12px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Individual Performance Analysis Report</h1>
                <h2>' . $data['user_info']['name'] . '</h2>
                <p>Generated on: ' . $data['overall_stats']['report_date'] . '</p>
            </div>

            <div class="section">
                <h2>Associate Information</h2>
                <div class="user-info">
                    <h3>Profile Details</h3>
                    <div class="user-info-grid">
                        <div class="user-info-item">
                            <div class="user-info-label">Name</div>
                            <div class="user-info-value">' . $data['user_info']['name'] . '</div>
                        </div>
                        <div class="user-info-item">
                            <div class="user-info-label">Organization</div>
                            <div class="user-info-value">' . $data['user_info']['organization'] . '</div>
                        </div>
                        <div class="user-info-item">
                            <div class="user-info-label">Email</div>
                            <div class="user-info-value">' . $data['user_info']['email'] . '</div>
                        </div>
                        <div class="user-info-item">
                            <div class="user-info-label">Phone</div>
                            <div class="user-info-value">' . $data['user_info']['phone'] . '</div>
                        </div>
                        <div class="user-info-item">
                            <div class="user-info-label">Date Joined</div>
                            <div class="user-info-value">' . $data['user_info']['date_joined'] . '</div>
                        </div>
                        <div class="user-info-item">
                            <div class="user-info-label">Group Type</div>
                            <div class="user-info-value">' . $data['user_info']['group_type'] . '</div>
                        </div>' .
            (!empty($data['user_info']['sec_number']) ? '
                        <div class="user-info-item">
                            <div class="user-info-label">SEC Number</div>
                            <div class="user-info-value">' . htmlspecialchars($data['user_info']['sec_number'], ENT_QUOTES, 'UTF-8') . '</div>
                        </div>' : '') . '
                    </div>
                    <div style="margin-top: 15px;">
                        <div class="user-info-label">Group Description</div>
                        <div class="user-info-value" style="margin-top: 5px;">' . htmlspecialchars($data['user_info']['group_description'] ?: 'No description provided', ENT_QUOTES, 'UTF-8') . '</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>Evaluation Methodology</h2>
                <p>This performance evaluation employs a <strong>system-based evaluation approach</strong> that combines automated metric calculation with expert assessment to ensure objective, data-driven performance analysis.</p>
                <h3>System-Based Auto-Scoring</h3>
                <p>The evaluation system automatically calculates scores for criteria that can be measured using system data. This ensures consistency, objectivity, and reduces manual evaluation time while maintaining accuracy. The auto-scoring system analyzes:</p>
                <ul>
                    <li><strong>Report Metrics:</strong> Total reports submitted, approval rates, rejection rates, and report quality indicators</li>
                    <li><strong>Volunteer Metrics:</strong> Volunteers recruited, volunteer growth rates, and volunteer engagement levels</li>
                    <li><strong>Notification Metrics:</strong> Response rates, acceptance rates, average response times, and engagement with coalition communications</li>
                    <li><strong>System Engagement Metrics:</strong> Login frequency, total system activities, and overall platform engagement scores</li>
                </ul>
                <h3>Metric Types</h3>
                <p>Evaluation criteria are categorized into three types based on how they are scored:</p>
                <ul>
                    <li><strong>Direct Metric Match:</strong> Criteria that are directly measured by system data (e.g., "Total reports submitted" directly measures field activity)</li>
                    <li><strong>Proxy Metric:</strong> Criteria measured using related system data as an approximation (e.g., "Notification response rate" as a proxy for active participation)</li>
                    <li><strong>Manual Scoring Required:</strong> Qualitative criteria that cannot be measured by system metrics and require expert evaluation (e.g., "Treats others fairly and with respect", "Shares new knowledge and ideas freely")</li>
                </ul>
                <h3>Scoring Scale</h3>
                <p>All evaluations use a standardized 4-point scale:</p>
                <ul>
                    <li><strong>4 - Excellent:</strong> Exceptional performance exceeding expectations</li>
                    <li><strong>3 - Good:</strong> Strong performance meeting expectations</li>
                    <li><strong>2 - Average:</strong> Adequate performance with room for improvement</li>
                    <li><strong>1 - Poor:</strong> Performance below expectations requiring support</li>
                </ul>
                <h3>Weighted Scoring</h3>
                <p>Final scores are calculated using weighted averages based on category importance: Volunteer Participation (25%), Task Accommodation and Completion (30%), Communication Effectiveness (15%), and Team Objective Above Self (30%). This ensures that critical performance areas receive appropriate emphasis in the overall assessment.</p>
            </div>

            <div class="section">
                <h2>Performance Overview</h2>
                <table style="width: 100%; border-collapse: collapse; margin: 0; margin-bottom: 10px;">
                    <tr>
                        <td class="stat-card" style="width: 25%; text-align: center; vertical-align: middle; padding: 12px 5px; border: 1px solid #dee2e6;">
                            <div class="stat-value" style="margin-bottom: 3px;">' . $data['overall_stats']['total_evaluations'] . '</div>
                            <div class="stat-label">Total Evaluations</div>
                        </td>
                        <td class="stat-card" style="width: 25%; text-align: center; vertical-align: middle; padding: 12px 5px; border: 1px solid #dee2e6; border-left: none;">
                            <div class="stat-value" style="margin-bottom: 3px;">' . $data['overall_stats']['average_score'] . '</div>
                            <div class="stat-label">Average Score</div>
                        </td>
                        <td class="stat-card" style="width: 25%; text-align: center; vertical-align: middle; padding: 12px 5px; border: 1px solid #dee2e6; border-left: none;">
                            <div class="stat-value" style="margin-bottom: 3px;">' . $data['overall_stats']['latest_score'] . '</div>
                            <div class="stat-label">Latest Score</div>
                        </td>
                        <td class="stat-card" style="width: 25%; text-align: center; vertical-align: middle; padding: 12px 5px; border: 1px solid #dee2e6; border-left: none;">
                            <div class="stat-value" style="margin-bottom: 3px;">' . $data['overall_stats']['performance_level'] . '</div>
                            <div class="stat-label">Performance Level</div>
                        </td>
                    </tr>
                </table>
        ';

        // Add performance metrics if available (quarterly format)
        if (isset($data['quarterly_metrics']) && !empty($data['quarterly_metrics'])) {
            $quarterlyMetrics = $data['quarterly_metrics'];
            $metricsYear = $data['metrics_year'] ?? Carbon::now()->year;
            $html .= '
            <div class="section">
                <h2 style="margin-top: 15px; margin-bottom: 8px;">Performance Metrics Summary</h2>
                <p style="margin-bottom: 15px;"><strong>Metrics by Quarter (' . $metricsYear . '):</strong> The following metrics are calculated for each quarter of the current year, providing a comprehensive view of performance across different time periods.</p>
                <div style="margin-top: 15px;">';

            // Display metrics for each quarter
            $quarterLabels = [
                'Q1' => 'Q1 (Jan - Mar)',
                'Q2' => 'Q2 (Apr - Jun)',
                'Q3' => 'Q3 (Jul - Sep)',
                'Q4' => 'Q4 (Oct - Dec)'
            ];

            foreach (['Q1', 'Q2', 'Q3', 'Q4'] as $quarter) {
                if (isset($quarterlyMetrics[$quarter])) {
                    $metrics = $quarterlyMetrics[$quarter];
                    $html .= '
                    <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #A11C22;">
                        <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 15px; color: #A11C22; font-weight: 600;">' . $quarterLabels[$quarter] . '</h3>
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
                            <tr>
                                <td class="stat-card" style="width: 16.66%; text-align: center; vertical-align: middle; padding: 12px 5px; border: 1px solid #dee2e6;">
                                    <div class="stat-value" style="margin-bottom: 3px;">' . $metrics['reports']['total_submitted'] . '</div>
                                    <div class="stat-label">Reports</div>
                                    <div style="font-size: 11px; color: #666; margin-top: 3px;">' . $metrics['reports']['approval_rate'] . '% approved</div>
                                </td>
                                <td class="stat-card" style="width: 16.66%; text-align: center; vertical-align: middle; padding: 12px 5px; border: 1px solid #dee2e6; border-left: none;">
                                    <div class="stat-value" style="margin-bottom: 3px;">+' . $metrics['volunteers']['recruited_in_period'] . '</div>
                                    <div class="stat-label">Volunteers</div>
                                    <div style="font-size: 11px; color: #666; margin-top: 3px;">Total: ' . ($metrics['volunteers']['total_count'] ?? $metrics['volunteers']['recruited_in_period']) . '</div>
                                </td>
                                <td class="stat-card" style="width: 16.66%; text-align: center; vertical-align: middle; padding: 12px 5px; border: 1px solid #dee2e6; border-left: none;">
                                    <div class="stat-value" style="margin-bottom: 3px;">' . $metrics['notifications']['total_received'] . '</div>
                                    <div class="stat-label">Notifications</div>
                                    <div style="font-size: 11px; color: #666; margin-top: 3px;">' . $metrics['notifications']['response_rate'] . '% responded</div>
                                </td>
                                <td class="stat-card" style="width: 16.66%; text-align: center; vertical-align: middle; padding: 12px 5px; border: 1px solid #dee2e6; border-left: none;">
                                    <div class="stat-value" style="margin-bottom: 3px;">' . $metrics['notifications']['acceptance_rate'] . '%</div>
                                    <div class="stat-label">Acceptance Rate</div>
                                    <div style="font-size: 11px; color: #666; margin-top: 3px;">' . $metrics['notifications']['accepted'] . ' accepted, ' . ($metrics['notifications']['declined'] ?? 0) . ' declined</div>
                                </td>
                                <td class="stat-card" style="width: 16.66%; text-align: center; vertical-align: middle; padding: 12px 5px; border: 1px solid #dee2e6; border-left: none;">
                                    <div class="stat-value" style="margin-bottom: 3px;">' . number_format($metrics['notifications']['avg_response_time_hours'], 1) . 'h</div>
                                    <div class="stat-label">Response Time</div>
                                    <div style="font-size: 11px; color: #666; margin-top: 3px;">Average</div>
                                </td>
                                <td class="stat-card" style="width: 16.66%; text-align: center; vertical-align: middle; padding: 12px 5px; border: 1px solid #dee2e6; border-left: none;">
                                    <div class="stat-value" style="margin-bottom: 3px;">' . $metrics['system_engagement']['engagement_score'] . '%</div>
                                    <div class="stat-label">System Engagement</div>
                                    <div style="font-size: 11px; color: #666; margin-top: 3px;">' . $metrics['system_engagement']['engagement_level'] . ' (' . $metrics['system_engagement']['login_frequency_per_week'] . ' logins/week)</div>
                                </td>
                            </tr>
                        </table>
                    </div>';
                }
            }

            $html .= '
                </div>
            </div>';
        }

        $html .= '
            <div class="section">
                <h2 style="margin-top: 8px;">Performance Analysis and Insights</h2>
                <div class="insights-container" style="margin-top: 0;">
                    <div class="insight-section">
                        <h3>Overall Performance Assessment</h3>
                        <p>' . $this->boldNumericValues($data['performance_insights']['overall_performance']) . '</p>
                    </div>
                    
                    <div class="insight-section">
                        <h3>Performance Trend Analysis</h3>
                        <p>' . $this->boldNumericValues($data['performance_insights']['trend_analysis']) . '</p>
                    </div>
                    
                    <div class="insight-section">
                        <h3>Key Strengths</h3>
                        <p>' . $this->boldNumericValues($data['performance_insights']['strengths']) . '</p>
                    </div>
                    
                    <div class="insight-section">
                        <h3>Areas for Improvement</h3>
                        <p>' . $this->boldNumericValues($data['performance_insights']['improvement_areas']) . '</p>
                    </div>
                    
                    <div class="insight-section">
                        <h3>Recommendations</h3>
                        <p>' . $this->boldNumericValues($data['performance_insights']['recommendations']) . '</p>
                    </div>
                </div>
            </div>';

        // Add performance distribution if there are evaluations
        if ($data['overall_stats']['total_evaluations'] > 0) {
            $html .= '
            <div class="section">
                <h2 style="margin-top: 8px;">Performance Distribution Analysis</h2>
                <p style="margin-bottom: 10px;">The performance distribution provides insights into the consistency and quality of this associate\'s performance across all evaluations.</p>
                <table class="performance-table" style="margin-bottom: 10px;">
                    <thead>
                        <tr>
                            <th>Performance Level</th>
                            <th>Score Range</th>
                            <th>Count</th>
                            <th>Percentage</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>';

            $totalEvals = array_sum($data['performance_distribution']);
            $performanceLevels = [
                'Excellent' => ['range' => '3.5 - 4.0', 'count' => $data['performance_distribution']['excellent'], 'description' => 'Outstanding performance with exceptional commitment to disaster preparedness initiatives'],
                'Good' => ['range' => '2.5 - 3.4', 'count' => $data['performance_distribution']['good'], 'description' => 'Strong performance demonstrating consistent engagement and effective contribution'],
                'Fair' => ['range' => '1.5 - 2.4', 'count' => $data['performance_distribution']['fair'], 'description' => 'Adequate performance with room for improvement and growth opportunities'],
                'Poor' => ['range' => '0.0 - 1.4', 'count' => $data['performance_distribution']['poor'], 'description' => 'Performance below expectations, requiring immediate attention and support']
            ];

            foreach ($performanceLevels as $level => $info) {
                $percentage = $totalEvals > 0 ? round(($info['count'] / $totalEvals) * 100, 1) : 0;
                $html .= '<tr>
                    <td class="' . strtolower($level) . '">' . $level . '</td>
                    <td>' . $info['range'] . '</td>
                    <td><strong>' . $info['count'] . '</strong></td>
                    <td><strong>' . $percentage . '%</strong></td>
                    <td>' . $info['description'] . '</td>
                </tr>';
            }

            $html .= '</tbody>
                </table>
            </div>';

            // Add quarterly trends if available
            if (!empty($data['quarterly_trends'])) {
                $html .= '
                <div class="section">
                    <h2 style="margin-top: 8px;">Performance Trends Analysis</h2>
                    <p style="margin-bottom: 10px;">Understanding performance trends over time helps identify patterns of improvement, consistency, and areas that may require additional attention.</p>
                    <div class="trend-chart" style="margin-top: 0;">
                        <h3>Quarterly Performance Analysis</h3>
                        <p>The following data shows the progression of performance scores across four quarters, revealing the development trajectory of this associate in disaster preparedness activities.</p>';

                foreach ($data['quarterly_trends'] as $quarter) {
                    $html .= '<div class="quarter-data">
                        <span><strong>' . $quarter['quarter'] . ' (' . $quarter['period'] . ')</strong></span>
                        <span>Average Score: <strong>' . round($quarter['average_score'], 2) . '</strong> | Evaluations: <strong>' . $quarter['total_evaluations'] . '</strong></span>
                    </div>';
                }

                $html .= '</div>
                </div>';
            }

            // Add category analysis if available
            if (!empty($data['category_analysis'])) {
                $html .= '
                <div class="section">
                    <h2 style="margin-top: 8px;">Category Performance Analysis</h2>
                    <p style="margin-bottom: 10px;">Understanding performance across different evaluation categories provides insights into specific strengths and areas for improvement within the disaster preparedness framework.</p>
                    <div class="category-analysis" style="margin-top: 0;">';

                foreach ($data['category_analysis'] as $category => $analysis) {
                    $html .= '<div class="category-card">
                        <div class="category-title">' . $category . '</div>
                        <div class="category-score"><strong>' . $analysis['average_score'] . '/4.0</strong></div>
                        <div>Performance Level: <span class="' . strtolower($analysis['performance_level']) . '">' . $analysis['performance_level'] . '</span></div>
                        <div>Evaluations: <strong>' . $analysis['total_evaluations'] . '</strong></div>
                    </div>';
                }

                $html .= '</div>
                </div>';
            }

            // Add evaluation history if available
            if (!empty($data['evaluation_history']['history'])) {
                $hasNotes = $data['evaluation_history']['has_notes'] ?? false;
                $html .= '
                <div class="section">
                    <h2 style="margin-top: 8px;">Evaluation History</h2>
                    <p style="margin-bottom: 10px;">This comprehensive history provides detailed information about each evaluation conducted for this associate, including scores and performance levels.</p>
                    <table class="performance-table" style="margin-top: 0; margin-bottom: 10px;">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Total Score</th>
                                <th>Performance Level</th>' . ($hasNotes ? '<th>Notes</th>' : '') . '
                            </tr>
                        </thead>
                        <tbody>';

                foreach ($data['evaluation_history']['history'] as $evaluation) {
                    $html .= '<tr>
                        <td>' . $evaluation['date'] . '</td>
                        <td><strong>' . $evaluation['total_score'] . '</strong></td>
                        <td class="' . strtolower($evaluation['performance_level']) . '">' . $evaluation['performance_level'] . '</td>';
                    if ($hasNotes) {
                        $html .= '<td>' . ($evaluation['notes'] ?? '') . '</td>';
                    }
                    $html .= '</tr>';
                }

                $html .= '</tbody>
                    </table>
                </div>';
            }
        }

        // Add Post Activity Report and History section
        $html .= '
            <div class="section">
                <h2>Posting Activity Report and History</h2>
                <p>This section tracks posting activities relevant to this associate, including <strong>Notifications</strong> (task assignments/alerts received from administrators), <strong>Announcements</strong> (public posts visible to all users), and <strong>Reports</strong> (submitted by this associate to administrators). The section analyzes individual posting frequency, engagement with notifications, response patterns, and historical trends to assess this associate\'s communication effectiveness and platform activity levels.</p>';

        if (isset($data['post_activity']) && $data['post_activity']) {
            $postActivity = $data['post_activity'];

            // Individual Statistics - All Post Types
            $totalPosts = $postActivity['overall_stats']['total_notifications'] + $postActivity['overall_stats']['total_announcements'] + $postActivity['overall_stats']['total_reports'];
            $html .= '
                <h3>Individual Posting Statistics</h3>
                <p style="font-size: 13px; color: #666; margin-bottom: 15px;">This section shows activity specific to this associate: notifications received, reports submitted, and available announcements on the platform.</p>
                
                <h4 style="margin-top: 20px; margin-bottom: 10px; color: #333; font-size: 15px;">Post Types Summary</h4>
                <table style="width: 100%; border-collapse: separate; border-spacing: 10px; margin-bottom: 25px;">
                    <tr>
                        <td class="stat-card" style="width: 33.33%; text-align: center; vertical-align: top; padding: 20px 12px;">
                            <div class="stat-value">' . $postActivity['overall_stats']['total_notifications'] . '</div>
                            <div class="stat-label">Notifications Received</div>
                            <div style="font-size: 11px; color: #666; margin-top: 5px;">Task assignments/alerts sent to this associate</div>
                        </td>
                        <td class="stat-card" style="width: 33.33%; text-align: center; vertical-align: top; padding: 20px 12px;">
                            <div class="stat-value">' . $postActivity['overall_stats']['total_announcements'] . '</div>
                            <div class="stat-label">Announcements Available</div>
                            <div style="font-size: 11px; color: #666; margin-top: 5px;">Public posts visible on the platform</div>
                        </td>
                        <td class="stat-card" style="width: 33.33%; text-align: center; vertical-align: top; padding: 20px 12px;">
                            <div class="stat-value">' . $postActivity['overall_stats']['total_reports'] . '</div>
                            <div class="stat-label">Reports Submitted</div>
                            <div style="font-size: 11px; color: #666; margin-top: 5px;">Submitted by this associate</div>
                        </td>
                    </tr>
                </table>
                
                <h4 style="margin-top: 20px; margin-bottom: 10px; color: #333; font-size: 15px;">Notification Engagement Metrics</h4>
                <table style="width: 100%; border-collapse: separate; border-spacing: 10px; margin-bottom: 25px;">
                    <tr>
                        <td class="stat-card" style="width: 25%; text-align: center; vertical-align: top; padding: 20px 12px;">
                            <div class="stat-value">' . $postActivity['overall_stats']['total_responses'] . '</div>
                            <div class="stat-label">Total Responses</div>
                            <div style="font-size: 11px; color: #666; margin-top: 5px;">Notifications responded to</div>
                        </td>
                        <td class="stat-card" style="width: 25%; text-align: center; vertical-align: top; padding: 20px 12px;">
                            <div class="stat-value">' . $postActivity['overall_stats']['overall_response_rate'] . '%</div>
                            <div class="stat-label">Response Rate</div>
                            <div style="font-size: 11px; color: #666; margin-top: 5px;">Of notifications received</div>
                        </td>
                        <td class="stat-card" style="width: 25%; text-align: center; vertical-align: top; padding: 20px 12px;">
                            <div class="stat-value">' . $postActivity['overall_stats']['total_accepted'] . '</div>
                            <div class="stat-label">Accepted</div>
                            <div style="font-size: 11px; color: #666; margin-top: 5px;">Notifications accepted</div>
                        </td>
                        <td class="stat-card" style="width: 25%; text-align: center; vertical-align: top; padding: 20px 12px;">
                            <div class="stat-value">' . $postActivity['overall_stats']['acceptance_rate'] . '%</div>
                            <div class="stat-label">Acceptance Rate</div>
                            <div style="font-size: 11px; color: #666; margin-top: 5px;">Of responses</div>
                        </td>
                    </tr>
                </table>';

            // Posting Analysis
            $html .= '
                <h3>Posting Analysis</h3>
                <div class="insights-container">
                    <div class="insight-section">
                        <h3>Individual Activity Summary</h3>
                        <p>This associate has received <strong>' . $postActivity['overall_stats']['total_notifications'] . ' notifications</strong> (task assignments/alerts), has access to <strong>' . $postActivity['overall_stats']['total_announcements'] . ' announcements</strong> (public posts) on the platform, and has submitted <strong>' . $postActivity['overall_stats']['total_reports'] . ' reports</strong> to administrators. This indicates ' .
            ($totalPosts > 20 ? 'high' : ($totalPosts > 10 ? 'moderate' : 'low')) . ' overall activity engagement for this associate.</p>
                    </div>
                    <div class="insight-section">
                        <h3>Notification Engagement Level</h3>
                        <p>This associate\'s engagement level for notifications is <strong>' . $postActivity['posting_analysis']['engagement_level'] . '</strong> with a response rate of ' . $postActivity['overall_stats']['overall_response_rate'] . '%. ' .
            ($postActivity['posting_analysis']['engagement_level'] === 'Excellent'
                ? 'This indicates strong communication effectiveness and high engagement with posted notifications.'
                : ($postActivity['posting_analysis']['engagement_level'] === 'Good'
                    ? 'This shows good communication effectiveness with room for further improvement in engagement.'
                    : ($postActivity['posting_analysis']['engagement_level'] === 'Moderate'
                        ? 'This suggests moderate engagement levels. Consider strategies to improve response rates and participation.'
                        : 'This indicates low engagement levels. Immediate action is needed to improve communication effectiveness and participation.'))) . '</p>
                    </div>
                    <div class="insight-section">
                        <h3>Response Patterns</h3>
                        <p>This associate has responded to <strong>' . $postActivity['overall_stats']['total_responses'] . ' notifications</strong> out of ' . $postActivity['overall_stats']['total_notifications'] . ' received. Out of ' . $postActivity['overall_stats']['total_responses'] . ' total responses, <strong>' . $postActivity['overall_stats']['total_accepted'] . '</strong> were accepted (' . $postActivity['overall_stats']['acceptance_rate'] . '%) and <strong>' . $postActivity['overall_stats']['total_declined'] . '</strong> were declined.</p>
                    </div>
                </div>';


            // Quarterly Trends
            if (!empty($postActivity['quarterly_trends'])) {
                $html .= '
                <h3>Quarterly Posting Trends</h3>
                <p style="font-size: 13px; color: #666; margin-bottom: 15px;">This section shows the posting activity trends for this associate across all post types (Notifications Received, Announcements Available, and Reports Submitted) for each quarter. For notification-specific engagement metrics (response rates, acceptance rates), refer to the "Notification Engagement Metrics" section above.</p>
                <div class="trend-chart">';

                foreach ($postActivity['quarterly_trends'] as $quarter) {
                    $html .= '
                    <div class="quarter-data">
                        <div>
                            <strong>' . $quarter['quarter'] . ' (' . $quarter['period'] . ')</strong><br>
                            <span style="font-size: 12px; color: #666;">' . $quarter['total_notifications'] . ' notifications received | ' . $quarter['total_announcements'] . ' announcements available | ' . $quarter['total_reports'] . ' reports submitted</span>
                        </div>
                    </div>';
                }

                $html .= '
                </div>';
            }
        } else {
            $html .= '
                <p>No posting activity data available at this time.</p>';
        }

        $html .= '
            </div>

            <div class="footer">
                <p>This individual performance report was automatically generated by the DPAR Platform Management System</p>
                <p>For questions or additional analysis, please contact the system administrator</p>
            </div>
        </body>
        </html>';

        return $html;
    }

    /**
     * Calculate performance metrics for a specific user and date range
     */
    private function calculatePerformanceMetrics($userId, $startDate, $endDate)
    {
        try {
            $associateGroup = AssociateGroup::where('user_id', $userId)->first();
            if (!$associateGroup) {
                return null;
            }

            // Convert to Carbon instances and set proper time boundaries
            // Start date: beginning of day (00:00:00)
            // End date: end of day (23:59:59) to include all records from that day
            $startDateCarbon = Carbon::parse($startDate)->startOfDay();
            $endDateCarbon = Carbon::parse($endDate)->endOfDay();

            // Reports metrics - exclude soft deleted records
            $reports = Report::where('user_id', $userId)
                ->whereBetween('created_at', [$startDateCarbon, $endDateCarbon])
                ->get();

            $totalReports = $reports->count();
            $approvedReports = $reports->where('status', 'approved')->count();
            $approvalRate = $totalReports > 0 ? round(($approvedReports / $totalReports) * 100, 2) : 0;

            // Volunteer metrics
            $volunteersRecruited = Volunteer::where('associate_group_id', $associateGroup->id)
                ->whereBetween('created_at', [$startDateCarbon, $endDateCarbon])
                ->count();

            // Notification metrics
            $notifications = Notification::whereHas('recipients', function ($query) use ($userId) {
                $query->where('user_id', $userId);
            })
                ->whereBetween('created_at', [$startDateCarbon, $endDateCarbon])
                ->get();

            $totalNotifications = $notifications->count();
            $respondedNotifications = 0;
            $acceptedNotifications = 0;
            $totalResponseTime = 0;
            $responseCount = 0;

            foreach ($notifications as $notification) {
                $recipient = NotificationRecipient::where('notification_id', $notification->id)
                    ->where('user_id', $userId)
                    ->first();

                if ($recipient && $recipient->response) {
                    $respondedNotifications++;
                    if ($recipient->response === 'accept') {
                        $acceptedNotifications++;
                    }
                    if ($recipient->responded_at && $notification->created_at) {
                        $responseTime = Carbon::parse($recipient->responded_at)
                            ->diffInHours(Carbon::parse($notification->created_at));
                        $totalResponseTime += $responseTime;
                        $responseCount++;
                    }
                }
            }

            $responseRate = $totalNotifications > 0
                ? round(($respondedNotifications / $totalNotifications) * 100, 2)
                : 0;
            $acceptanceRate = $respondedNotifications > 0
                ? round(($acceptedNotifications / $respondedNotifications) * 100, 2)
                : 0;
            $avgResponseTime = $responseCount > 0
                ? round($totalResponseTime / $responseCount, 2)
                : 0;

            // System engagement metrics
            $activityLogs = ActivityLog::where('user_id', $userId)
                ->whereBetween('activity_at', [$startDateCarbon, $endDateCarbon])
                ->get();

            $totalActivities = $activityLogs->count();
            $loginActivities = $activityLogs->where('activity_type', 'login')->count();

            $daysDiff = $endDateCarbon->diffInDays($startDateCarbon);
            $weeks = max(1, $daysDiff / 7);
            $loginFrequency = $weeks > 0 ? round($loginActivities / $weeks, 2) : 0;

            $engagementScore = min(
                100,
                ($totalReports * 5) +
                    ($volunteersRecruited * 10) +
                    ($responseRate * 0.3) +
                    ($loginFrequency * 2)
            );

            $engagementLevel = 'Low';
            if ($engagementScore >= 80) $engagementLevel = 'High';
            elseif ($engagementScore >= 50) $engagementLevel = 'Medium';

            // Get rejected and pending reports
            $rejectedReports = $reports->where('status', 'rejected')->count();
            $pendingReports = $reports->where('status', 'sent')->count();
            $draftReports = $reports->where('status', 'draft')->count();

            // Get total volunteers count
            $totalVolunteers = Volunteer::where('associate_group_id', $associateGroup->id)->count();

            // Get declined notifications
            $declinedNotifications = 0;
            foreach ($notifications as $notification) {
                $recipient = NotificationRecipient::where('notification_id', $notification->id)
                    ->where('user_id', $userId)
                    ->first();
                if ($recipient && $recipient->response === 'decline') {
                    $declinedNotifications++;
                }
            }

            return [
                'reports' => [
                    'total_submitted' => $totalReports,
                    'approved' => $approvedReports,
                    'rejected' => $rejectedReports,
                    'pending' => $pendingReports,
                    'draft' => $draftReports,
                    'approval_rate' => $approvalRate
                ],
                'volunteers' => [
                    'total_count' => $totalVolunteers,
                    'recruited_in_period' => $volunteersRecruited,
                    'growth_rate' => $totalVolunteers > 0
                        ? round(($volunteersRecruited / $totalVolunteers) * 100, 2)
                        : 0
                ],
                'notifications' => [
                    'total_received' => $totalNotifications,
                    'responded' => $respondedNotifications,
                    'not_responded' => $totalNotifications - $respondedNotifications,
                    'accepted' => $acceptedNotifications,
                    'declined' => $declinedNotifications,
                    'response_rate' => $responseRate,
                    'acceptance_rate' => $acceptanceRate,
                    'avg_response_time_hours' => $avgResponseTime
                ],
                'system_engagement' => [
                    'total_activities' => $totalActivities,
                    'login_count' => $loginActivities,
                    'login_frequency_per_week' => $loginFrequency,
                    'engagement_score' => round($engagementScore, 2),
                    'engagement_level' => $engagementLevel
                ]
            ];
        } catch (\Exception $e) {
            Log::error('Error calculating performance metrics: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Get metrics period based on latest evaluation (default to last 3 months)
     */
    private function getMetricsPeriod($latestEvaluation)
    {
        if ($latestEvaluation) {
            $endDate = Carbon::parse($latestEvaluation->created_at)->endOfDay();
            $startDate = $endDate->copy()->subMonths(3)->startOfDay();
        } else {
            $endDate = Carbon::now()->endOfDay();
            $startDate = $endDate->copy()->subMonths(3)->startOfDay();
        }

        $daysDiff = $endDate->diffInDays($startDate);

        return [
            'start_date' => $startDate->toDateString(),
            'end_date' => $endDate->toDateString(),
            'days' => $daysDiff,
            'period_description' => $this->formatPeriodDescription($startDate, $endDate)
        ];
    }

    /**
     * Format period description
     */
    private function formatPeriodDescription($startDate, $endDate)
    {
        $start = Carbon::parse($startDate);
        $end = Carbon::parse($endDate);
        $days = $end->diffInDays($start);

        if ($days <= 31) {
            return $days . ' days';
        } elseif ($days <= 93) {
            $months = round($days / 30);
            return $months . ' month' . ($months > 1 ? 's' : '');
        } else {
            $months = round($days / 30);
            return $months . ' months';
        }
    }

    /**
     * Calculate aggregate metrics across all associates
     */
    private function calculateAggregateMetrics($associateUsers, $evaluations)
    {
        if ($associateUsers->isEmpty()) {
            return null;
        }

        // Set proper time boundaries for full current year
        $currentYear = Carbon::now()->year;
        $startDate = Carbon::create($currentYear, 1, 1)->startOfDay();
        $endDate = Carbon::create($currentYear, 12, 31)->endOfDay();

        $totalReports = 0;
        $totalVolunteers = 0;
        $totalNotifications = 0;
        $totalActivities = 0;
        $totalLogins = 0;

        foreach ($associateUsers as $user) {
            $associateGroup = AssociateGroup::where('user_id', $user->id)->first();
            if (!$associateGroup) continue;

            $reports = Report::where('user_id', $user->id)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->count();
            $totalReports += $reports;

            $volunteers = Volunteer::where('associate_group_id', $associateGroup->id)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->count();
            $totalVolunteers += $volunteers;

            $notifications = Notification::whereHas('recipients', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
                ->whereBetween('created_at', [$startDate, $endDate])
                ->count();
            $totalNotifications += $notifications;

            $activities = ActivityLog::where('user_id', $user->id)
                ->whereBetween('activity_at', [$startDate, $endDate])
                ->count();
            $totalActivities += $activities;

            $logins = ActivityLog::where('user_id', $user->id)
                ->where('activity_type', 'login')
                ->whereBetween('activity_at', [$startDate, $endDate])
                ->count();
            $totalLogins += $logins;
        }

        // Calculate calendar events for current year
        $currentYear = Carbon::now()->year;
        $yearStart = Carbon::create($currentYear, 1, 1)->startOfDay();
        $yearEnd = Carbon::create($currentYear, 12, 31)->endOfDay();

        $calendarEvents = CalendarEvent::whereBetween('start_date', [$yearStart, $yearEnd])
            ->orderBy('start_date', 'asc')
            ->get();

        $totalCalendarEvents = $calendarEvents->count();

        // Get events list with details
        $eventsList = $calendarEvents->map(function ($event) {
            return [
                'title' => $event->title,
                'description' => $event->description ?? 'No description',
                'location' => $event->location ?? 'Not specified',
                'start_date' => $event->start_date,
                'end_date' => $event->end_date
            ];
        })->toArray();

        // Calculate events by month for current year
        $eventsByMonth = [];
        for ($month = 1; $month <= 12; $month++) {
            $monthStart = Carbon::create($currentYear, $month, 1)->startOfDay();
            $monthEnd = Carbon::create($currentYear, $month, 1)->endOfMonth()->endOfDay();
            $eventsByMonth[$month] = CalendarEvent::whereBetween('start_date', [$monthStart, $monthEnd])
                ->count();
        }

        $avgEventsPerMonth = round(array_sum($eventsByMonth) / 12, 2);
        $monthsWithEvents = count(array_filter($eventsByMonth, function ($count) {
            return $count > 0;
        }));

        // Calculate days for the full year period
        $daysDiff = $endDate->diffInDays($startDate) + 1; // +1 to include both start and end dates
        $weeks = max(1, $daysDiff / 7);
        $avgLoginFrequency = $associateUsers->count() > 0 ? round($totalLogins / ($associateUsers->count() * $weeks), 2) : 0;

        return [
            'period' => [
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'days' => $daysDiff,
                'period_description' => $this->formatPeriodDescription($startDate, $endDate)
            ],
            'reports' => [
                'total_submitted' => $totalReports,
                'average_per_associate' => $associateUsers->count() > 0 ? round($totalReports / $associateUsers->count(), 2) : 0
            ],
            'volunteers' => [
                'total_recruited' => $totalVolunteers,
                'average_per_associate' => $associateUsers->count() > 0 ? round($totalVolunteers / $associateUsers->count(), 2) : 0
            ],
            'notifications' => [
                'total_received' => $totalNotifications,
                'average_per_associate' => $associateUsers->count() > 0 ? round($totalNotifications / $associateUsers->count(), 2) : 0
            ],
            'system_engagement' => [
                'total_activities' => $totalActivities,
                'total_logins' => $totalLogins,
                'average_login_frequency_per_week' => $avgLoginFrequency
            ],
            'calendar_events' => [
                'total_events' => $totalCalendarEvents,
                'year' => $currentYear,
                'year_start' => $yearStart->toDateString(),
                'year_end' => $yearEnd->toDateString(),
                'average_per_month' => $avgEventsPerMonth,
                'months_with_events' => $monthsWithEvents,
                'events_by_month' => $eventsByMonth,
                'events_list' => $eventsList
            ]
        ];
    }

    private function gatherPostActivityData()
    {
        // Get all notifications (task assignments/alerts) created by admins
        $allNotifications = Notification::with(['creator:id,name', 'recipients'])
            ->orderBy('created_at', 'desc')
            ->get();

        // Get all announcements (public posts) created by anyone
        $allAnnouncements = Announcement::withTrashed()
            ->orderBy('created_at', 'desc')
            ->get();

        // Get all training programs (training sessions) created by anyone
        $allTrainingPrograms = TrainingProgram::withTrashed()
            ->orderBy('created_at', 'desc')
            ->get();

        // Get all reports (posts from associates to admins)
        $allReports = Report::whereNull('deleted_at')
            ->with(['user:id,name,organization'])
            ->orderBy('created_at', 'desc')
            ->get();


        // Calculate notification statistics
        $totalNotifications = $allNotifications->count();
        $totalNotificationRecipients = 0;
        $uniqueNotificationRecipients = collect(); // Track unique recipients across all notifications
        $totalResponses = 0;
        $totalAccepted = 0;
        $totalDeclined = 0;

        // Get admin users who created notifications
        $adminUsers = User::whereIn('role', ['admin', 'head_admin', 'superadmin'])->get();
        $notificationsByAdmin = [];

        foreach ($allNotifications as $notification) {
            $recipientCount = $notification->recipients->count();
            $totalNotificationRecipients += $recipientCount;

            // Track unique recipients (each user_id only counted once across all notifications)
            foreach ($notification->recipients as $recipient) {
                $uniqueNotificationRecipients->push($recipient->user_id);
            }

            // Count responses
            $responded = $notification->recipients->whereNotNull('response')->count();
            $accepted = $notification->recipients->where('response', 'accept')->count();
            $declined = $notification->recipients->where('response', 'decline')->count();

            $totalResponses += $responded;
            $totalAccepted += $accepted;
            $totalDeclined += $declined;

            // Group by admin creator
            if ($notification->created_by) {
                $creator = $adminUsers->find($notification->created_by);
                if ($creator) {
                    $adminName = $creator->name;
                    if (!isset($notificationsByAdmin[$adminName])) {
                        $notificationsByAdmin[$adminName] = [
                            'name' => $adminName,
                            'count' => 0,
                            'total_recipients' => 0,
                            'total_responses' => 0,
                            'total_accepted' => 0,
                            'total_declined' => 0
                        ];
                    }
                    $notificationsByAdmin[$adminName]['count']++;
                    $notificationsByAdmin[$adminName]['total_recipients'] += $recipientCount;
                    $notificationsByAdmin[$adminName]['total_responses'] += $responded;
                    $notificationsByAdmin[$adminName]['total_accepted'] += $accepted;
                    $notificationsByAdmin[$adminName]['total_declined'] += $declined;
                }
            }
        }

        $uniqueRecipientsCount = $uniqueNotificationRecipients->unique()->count();

        // Calculate quarterly trends for all post types
        $quarterlyPostingTrends = $this->calculateQuarterlyPostingTrends($allNotifications, $allAnnouncements, $allTrainingPrograms, $allReports);

        // Calculate response rates
        $overallResponseRate = $totalNotificationRecipients > 0
            ? round(($totalResponses / $totalNotificationRecipients) * 100, 2)
            : 0;
        $acceptanceRate = $totalResponses > 0
            ? round(($totalAccepted / $totalResponses) * 100, 2)
            : 0;

        return [
            'overall_stats' => [
                'total_notifications' => $totalNotifications,
                'total_announcements' => $allAnnouncements->count(),
                'total_training_programs' => $allTrainingPrograms->count(),
                'total_reports' => $allReports->count(),
                'total_notification_recipients' => $totalNotificationRecipients, // Total count (can include same person multiple times)
                'unique_notification_recipients' => $uniqueRecipientsCount, // Unique count (each person counted once)
                'total_responses' => $totalResponses,
                'total_accepted' => $totalAccepted,
                'total_declined' => $totalDeclined,
                'overall_response_rate' => $overallResponseRate,
                'acceptance_rate' => $acceptanceRate,
                'average_recipients_per_notification' => $totalNotifications > 0
                    ? round($totalNotificationRecipients / $totalNotifications, 2)
                    : 0
            ],
            'quarterly_trends' => $quarterlyPostingTrends,
            'posting_analysis' => [
                'average_responses_per_notification' => $totalNotifications > 0
                    ? round($totalResponses / $totalNotifications, 2)
                    : 0,
                'engagement_level' => $overallResponseRate >= 80 ? 'Excellent'
                    : ($overallResponseRate >= 60 ? 'Good'
                        : ($overallResponseRate >= 40 ? 'Moderate'
                            : 'Needs Improvement'))
            ]
        ];
    }

    private function calculateQuarterlyPostingTrends($notifications, $announcements, $trainingPrograms, $reports)
    {
        $quarters = [];
        $currentYear = Carbon::now()->year;

        for ($i = 3; $i >= 0; $i--) {
            $quarterStart = Carbon::create($currentYear, ($i * 3) + 1, 1);
            $quarterEnd = $quarterStart->copy()->addMonths(2)->endOfMonth();

            // Filter notifications
            $quarterNotifications = $notifications->filter(function ($notification) use ($quarterStart, $quarterEnd) {
                $notifDate = Carbon::parse($notification->created_at);
                return $notifDate->between($quarterStart, $quarterEnd);
            });

            // Filter announcements
            $quarterAnnouncements = $announcements->filter(function ($announcement) use ($quarterStart, $quarterEnd) {
                $annDate = Carbon::parse($announcement->created_at);
                return $annDate->between($quarterStart, $quarterEnd);
            });

            // Filter training programs
            $quarterTrainingPrograms = $trainingPrograms->filter(function ($trainingProgram) use ($quarterStart, $quarterEnd) {
                $tpDate = Carbon::parse($trainingProgram->created_at);
                return $tpDate->between($quarterStart, $quarterEnd);
            });

            // Filter reports
            $quarterReports = $reports->filter(function ($report) use ($quarterStart, $quarterEnd) {
                $reportDate = Carbon::parse($report->created_at);
                return $reportDate->between($quarterStart, $quarterEnd);
            });

            // Calculate notification metrics
            $totalRecipients = 0;
            $totalResponses = 0;
            $totalAccepted = 0;

            foreach ($quarterNotifications as $notification) {
                $totalRecipients += $notification->recipients->count();
                $totalResponses += $notification->recipients->whereNotNull('response')->count();
                $totalAccepted += $notification->recipients->where('response', 'accept')->count();
            }

            $responseRate = $totalRecipients > 0
                ? round(($totalResponses / $totalRecipients) * 100, 2)
                : 0;
            $acceptanceRate = $totalResponses > 0
                ? round(($totalAccepted / $totalResponses) * 100, 2)
                : 0;

            $quarters[] = [
                'quarter' => 'Q' . ($i + 1),
                'total_notifications' => $quarterNotifications->count(),
                'total_announcements' => $quarterAnnouncements->count(),
                'total_training_programs' => $quarterTrainingPrograms->count(),
                'total_reports' => $quarterReports->count(),
                'total_recipients' => $totalRecipients,
                'total_responses' => $totalResponses,
                'response_rate' => $responseRate,
                'acceptance_rate' => $acceptanceRate,
                'period' => $quarterStart->format('M Y') . ' - ' . $quarterEnd->format('M Y')
            ];
        }

        return array_reverse($quarters);
    }

    private function gatherIndividualPostActivityData($userId)
    {
        // Get notifications where this user is a recipient
        $userNotifications = Notification::with(['creator:id,name', 'recipients'])
            ->whereHas('recipients', function ($query) use ($userId) {
                $query->where('user_id', $userId);
            })
            ->orderBy('created_at', 'desc')
            ->get();

        // Get all announcements (public posts visible to all users)
        $allAnnouncements = Announcement::withTrashed()
            ->orderBy('created_at', 'desc')
            ->get();

        // Get reports submitted by this user
        $userReports = Report::where('user_id', $userId)
            ->whereNull('deleted_at')
            ->with(['user:id,name,organization'])
            ->orderBy('created_at', 'desc')
            ->get();

        // Calculate notification statistics for this user
        $totalNotifications = $userNotifications->count();
        $totalResponses = 0;
        $totalAccepted = 0;
        $totalDeclined = 0;

        foreach ($userNotifications as $notification) {
            // Get this user's recipient record for this notification
            $recipient = $notification->recipients->where('user_id', $userId)->first();
            
            if ($recipient && $recipient->response) {
                $totalResponses++;
                if ($recipient->response === 'accept') {
                    $totalAccepted++;
                } elseif ($recipient->response === 'decline') {
                    $totalDeclined++;
                }
            }
        }

        // Calculate response rates for this user
        $overallResponseRate = $totalNotifications > 0
            ? round(($totalResponses / $totalNotifications) * 100, 2)
            : 0;
        $acceptanceRate = $totalResponses > 0
            ? round(($totalAccepted / $totalResponses) * 100, 2)
            : 0;

        // Calculate quarterly trends for individual post activity
        $quarterlyPostingTrends = $this->calculateIndividualQuarterlyPostingTrends($userNotifications, $allAnnouncements, $userReports, $userId);

        return [
            'overall_stats' => [
                'total_notifications' => $totalNotifications,
                'total_announcements' => $allAnnouncements->count(),
                'total_reports' => $userReports->count(),
                'total_responses' => $totalResponses,
                'total_accepted' => $totalAccepted,
                'total_declined' => $totalDeclined,
                'overall_response_rate' => $overallResponseRate,
                'acceptance_rate' => $acceptanceRate
            ],
            'quarterly_trends' => $quarterlyPostingTrends,
            'posting_analysis' => [
                'average_responses_per_notification' => $totalNotifications > 0
                    ? round($totalResponses / $totalNotifications, 2)
                    : 0,
                'engagement_level' => $overallResponseRate >= 80 ? 'Excellent'
                    : ($overallResponseRate >= 60 ? 'Good'
                        : ($overallResponseRate >= 40 ? 'Moderate'
                            : 'Needs Improvement'))
            ]
        ];
    }

    private function calculateIndividualQuarterlyPostingTrends($notifications, $announcements, $reports, $userId)
    {
        $quarters = [];
        $currentYear = Carbon::now()->year;

        for ($i = 3; $i >= 0; $i--) {
            $quarterStart = Carbon::create($currentYear, ($i * 3) + 1, 1);
            $quarterEnd = $quarterStart->copy()->addMonths(2)->endOfMonth();

            // Filter notifications received by this user
            $quarterNotifications = $notifications->filter(function ($notification) use ($quarterStart, $quarterEnd) {
                $notifDate = Carbon::parse($notification->created_at);
                return $notifDate->between($quarterStart, $quarterEnd);
            });

            // Filter announcements (all public announcements)
            $quarterAnnouncements = $announcements->filter(function ($announcement) use ($quarterStart, $quarterEnd) {
                $annDate = Carbon::parse($announcement->created_at);
                return $annDate->between($quarterStart, $quarterEnd);
            });

            // Filter reports submitted by this user
            $quarterReports = $reports->filter(function ($report) use ($quarterStart, $quarterEnd) {
                $reportDate = Carbon::parse($report->created_at);
                return $reportDate->between($quarterStart, $quarterEnd);
            });

            // Calculate notification metrics for this user
            $totalResponses = 0;
            $totalAccepted = 0;

            foreach ($quarterNotifications as $notification) {
                $recipient = $notification->recipients->where('user_id', $userId)->first();
                if ($recipient && $recipient->response) {
                    $totalResponses++;
                    if ($recipient->response === 'accept') {
                        $totalAccepted++;
                    }
                }
            }

            $responseRate = $quarterNotifications->count() > 0
                ? round(($totalResponses / $quarterNotifications->count()) * 100, 2)
                : 0;
            $acceptanceRate = $totalResponses > 0
                ? round(($totalAccepted / $totalResponses) * 100, 2)
                : 0;

            $quarters[] = [
                'quarter' => 'Q' . ($i + 1),
                'total_notifications' => $quarterNotifications->count(),
                'total_announcements' => $quarterAnnouncements->count(),
                'total_reports' => $quarterReports->count(),
                'total_responses' => $totalResponses,
                'response_rate' => $responseRate,
                'acceptance_rate' => $acceptanceRate,
                'period' => $quarterStart->format('M Y') . ' - ' . $quarterEnd->format('M Y')
            ];
        }

        return array_reverse($quarters);
    }
}
