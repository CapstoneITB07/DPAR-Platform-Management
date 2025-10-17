<?php

namespace App\Services;

use Dompdf\Dompdf;
use Dompdf\Options;
use App\Models\Evaluation;
use App\Models\AssociateGroup;
use App\Models\User;
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

        // Get all associate groups
        $associateGroups = AssociateGroup::with(['user:id,name,organization'])
            ->get();

        // Get only associate group leaders (associates)
        $associateUsers = User::where('role', 'associate_group_leader')->get();

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
                'individual_performance' => []
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
            'individual_performance' => $this->getIndividualPerformanceData($userEvaluations)
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
                'last_evaluation' => $latestEval->created_at->format('Y-m-d')
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
                    'group_description' => $associateGroup ? (html_entity_decode($associateGroup->description ?: 'No description provided', ENT_QUOTES, 'UTF-8')) : 'No description available'
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
                'performance_timeline' => []
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

        return [
            'user_info' => [
                'id' => $user->id,
                'name' => $associateGroup ? $associateGroup->director : $user->name,
                'organization' => $associateGroup ? $associateGroup->name : $user->organization,
                'email' => $associateGroup ? $associateGroup->email : $user->email,
                'phone' => $associateGroup ? ($associateGroup->phone ?? 'Not provided') : ($user->phone ?? 'Not provided'),
                'date_joined' => $associateGroup ? $associateGroup->created_at->format('Y-m-d') : 'Unknown',
                'group_type' => $associateGroup ? $associateGroup->type : 'Not specified',
                'group_description' => $associateGroup ? (html_entity_decode($associateGroup->description ?: 'No description provided', ENT_QUOTES, 'UTF-8')) : 'No description available'
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
            'performance_timeline' => $performanceTimeline
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

        foreach ($evaluations as $evaluation) {
            $evalData = is_string($evaluation->evaluation_data)
                ? json_decode($evaluation->evaluation_data, true)
                : $evaluation->evaluation_data;

            $history[] = [
                'id' => $evaluation->id,
                'date' => $evaluation->created_at->format('Y-m-d'),
                'total_score' => $evaluation->total_score,
                'performance_level' => $this->getPerformanceLevel($evaluation->total_score),
                'evaluation_data' => $evalData,
                'notes' => $evaluation->notes ?? 'No additional notes'
            ];
        }

        return $history;
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
                    padding-bottom: 20px;
                    margin-bottom: 30px;
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
                    margin-bottom: 30px;
                    page-break-inside: avoid;
                }
                .section h2 {
                    color: #A11C22;
                    border-bottom: 2px solid #A11C22;
                    padding-bottom: 10px;
                    margin-bottom: 20px;
                    font-size: 20px;
                }
                .section h3 {
                    color: #333;
                    margin-bottom: 15px;
                    font-size: 16px;
                }
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin-bottom: 20px;
                }
                .stat-card {
                    background: #f8f9fa;
                    border: 1px solid #dee2e6;
                    border-radius: 8px;
                    padding: 15px;
                    text-align: center;
                }
                .stat-value {
                    font-size: 24px;
                    font-weight: bold;
                    color: #A11C22;
                    margin-bottom: 5px;
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
                    padding: 20px;
                    margin: 20px 0;
                }
                .quarter-data {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10px;
                    padding: 10px;
                    background: white;
                    border-radius: 4px;
                }
                .category-analysis {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 15px;
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
                    padding: 20px;
                    margin: 20px 0;
                    border-left: 4px solid #A11C22;
                }
                
                .insight-section {
                    margin-bottom: 25px;
                    padding: 15px;
                    background: white;
                    border-radius: 6px;
                    border: 1px solid #e5e7eb;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }
                
                .insight-section h3 {
                    color: #A11C22;
                    font-size: 16px;
                    font-weight: 700;
                    margin: 0 0 10px 0;
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
                <p>This comprehensive performance analysis report provides an in-depth evaluation of the DPAR (Disaster Preparedness and Response) platform\'s associate groups and their collective impact on disaster preparedness initiatives. The analysis encompasses ' . $data['overall_stats']['total_associates'] . ' active associate groups with ' . $data['overall_stats']['total_evaluations'] . ' comprehensive evaluations conducted across multiple performance dimensions.</p>
                
                <p>The coalition has achieved an average performance score of ' . $data['overall_stats']['average_score'] . '/4.0, which indicates ' . ($data['overall_stats']['average_score'] >= 3.0 ? 'exceptional commitment and effectiveness' : ($data['overall_stats']['average_score'] >= 2.5 ? 'strong performance with consistent engagement' : ($data['overall_stats']['average_score'] >= 2.0 ? 'moderate performance with opportunities for growth' : 'significant potential for improvement and development'))) . ' in disaster preparedness activities. This performance level reflects the collective efforts of all participating groups in building resilient communities and enhancing disaster response capabilities.</p>
                
                <p>The evaluation framework assesses five critical performance categories: Volunteer Participation, Community Engagement, Leadership & Initiative, Communication & Collaboration, and Professional Development. Each category is designed to measure different aspects of disaster preparedness effectiveness, ensuring a holistic view of each group\'s contribution to the broader disaster resilience ecosystem.</p>
            </div>

            <div class="section">
                <h2>Overall Performance Metrics</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">' . $data['overall_stats']['total_evaluations'] . '</div>
                        <div class="stat-label">Total Evaluations</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">' . $data['overall_stats']['total_associates'] . '</div>
                        <div class="stat-label">Total Associates</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">' . $data['overall_stats']['average_score'] . '</div>
                        <div class="stat-label">Average Score</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">' . $data['overall_stats']['total_members'] . '</div>
                        <div class="stat-label">Total Members</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>Performance Analysis and Insights</h2>
                <div class="insights-container">
                    <div class="insight-section">
                        <h3>Overall Performance Assessment</h3>
                        <p>' . $data['performance_insights']['overall_performance'] . '</p>
                    </div>
                    
                    <div class="insight-section">
                        <h3>Performance Distribution Analysis</h3>
                        <p>' . $data['performance_insights']['distribution_analysis'] . '</p>
                    </div>
                    
                    <div class="insight-section">
                        <h3>Excellence Indicators</h3>
                        <p>' . $data['performance_insights']['excellent_performance'] . '</p>
                    </div>
                    
                    <div class="insight-section">
                        <h3>Improvement Opportunities</h3>
                        <p>' . $data['performance_insights']['improvement_needed'] . '</p>
                    </div>
                    
                    <div class="insight-section">
                        <h3>Network Health Assessment</h3>
                        <p>' . $data['performance_insights']['network_health'] . '</p>
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
                <td>' . $info['count'] . '</td>
                <td>' . $percentage . '%</td>
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
                <span>Average Score: <strong>' . round($quarter['average_score'], 2) . '</strong> | Evaluations: ' . $quarter['total_evaluations'] . '</span>
            </div>';
        }

        $html .= '</div>
                <div class="trend-analysis">
                    <h4>Trend Analysis:</h4>
                    <p>' . $trendAnalysis . '</p>
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
                <td>' . $performer['latest_score'] . '</td>
                <td>' . $performer['average_score'] . '</td>
                <td>' . $performer['total_evaluations'] . '</td>
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
                <td>' . $performer['latest_score'] . '</td>
                <td>' . $performer['average_score'] . '</td>
                <td>' . $performer['total_evaluations'] . '</td>
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
                <div class="category-score">' . $analysis['average_score'] . '/4.0</div>
                <div>Performance Level: <span class="' . strtolower($analysis['performance_level']) . '">' . $analysis['performance_level'] . '</span></div>
                <div>Evaluations: ' . $analysis['total_evaluations'] . '</div>
            </div>';
        }

        $html .= '</div>
            </div>

            <div class="section">
                <h2>Individual Associate Performance Overview</h2>
                <p>This comprehensive overview provides detailed performance metrics for each associate group within the DPAR network. Understanding individual performance patterns helps identify trends, track progress over time, and recognize both achievements and areas requiring attention.</p>
                
                <p>The performance data includes not only current scores but also historical trends, allowing for a complete picture of each group\'s development trajectory. This information is essential for making informed decisions about resource allocation, training needs, and recognition opportunities.</p>
                
                <table class="performance-table">
                    <thead>
                        <tr>
                            <th>Associate</th>
                            <th>Organization</th>
                            <th>Latest Score</th>
                            <th>Average Score</th>
                            <th>Trend</th>
                            <th>Evaluations</th>
                        </tr>
                    </thead>
                    <tbody>';

        foreach ($data['individual_performance'] as $individual) {
            $trendIcon = $individual['trend'] === 'improving' ? '📈' : ($individual['trend'] === 'declining' ? '📉' : '➡️');
            $html .= '<tr>
                <td>' . $individual['user_name'] . '</td>
                <td>' . $individual['organization'] . '</td>
                <td>' . $individual['latest_score'] . '</td>
                <td>' . $individual['average_score'] . '</td>
                <td>' . $trendIcon . ' ' . ucfirst($individual['trend']) . '</td>
                <td>' . $individual['total_evaluations'] . '</td>
            </tr>';
        }

        $html .= '</tbody>
                </table>
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
                    padding-bottom: 20px;
                    margin-bottom: 30px;
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
                    margin-bottom: 30px;
                    page-break-inside: avoid;
                }
                .section h2 {
                    color: #A11C22;
                    border-bottom: 2px solid #A11C22;
                    padding-bottom: 10px;
                    margin-bottom: 20px;
                    font-size: 20px;
                }
                .section h3 {
                    color: #333;
                    margin-bottom: 15px;
                    font-size: 16px;
                }
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin-bottom: 20px;
                }
                .stat-card {
                    background: #f8f9fa;
                    border: 1px solid #dee2e6;
                    border-radius: 8px;
                    padding: 15px;
                    text-align: center;
                }
                .stat-value {
                    font-size: 24px;
                    font-weight: bold;
                    color: #A11C22;
                    margin-bottom: 5px;
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
                    padding: 20px;
                    margin: 20px 0;
                    border-left: 4px solid #A11C22;
                }
                .insight-section {
                    margin-bottom: 25px;
                    padding: 15px;
                    background: white;
                    border-radius: 6px;
                    border: 1px solid #e5e7eb;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }
                .insight-section h3 {
                    color: #A11C22;
                    font-size: 16px;
                    font-weight: 700;
                    margin: 0 0 10px 0;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .insight-section p {
                    color: #374151;
                    font-size: 14px;
                    line-height: 1.6;
                    margin: 0;
                }
                .trend-chart {
                    background: #f8f9fa;
                    border: 1px solid #dee2e6;
                    border-radius: 8px;
                    padding: 20px;
                    margin: 20px 0;
                }
                .quarter-data {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10px;
                    padding: 10px;
                    background: white;
                    border-radius: 4px;
                }
                .category-analysis {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 15px;
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
                    padding: 20px;
                    margin-bottom: 20px;
                }
                .user-info h3 {
                    color: #A11C22;
                    margin-top: 0;
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
                        </div>
                    </div>
                    <div style="margin-top: 15px;">
                        <div class="user-info-label">Group Description</div>
                        <div class="user-info-value" style="margin-top: 5px;">' . htmlspecialchars($data['user_info']['group_description'] ?: 'No description provided', ENT_QUOTES, 'UTF-8') . '</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>Performance Overview</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">' . $data['overall_stats']['total_evaluations'] . '</div>
                        <div class="stat-label">Total Evaluations</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">' . $data['overall_stats']['average_score'] . '</div>
                        <div class="stat-label">Average Score</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">' . $data['overall_stats']['latest_score'] . '</div>
                        <div class="stat-label">Latest Score</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">' . $data['overall_stats']['performance_level'] . '</div>
                        <div class="stat-label">Performance Level</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>Performance Analysis and Insights</h2>
                <div class="insights-container">
                    <div class="insight-section">
                        <h3>Overall Performance Assessment</h3>
                        <p>' . $data['performance_insights']['overall_performance'] . '</p>
                    </div>
                    
                    <div class="insight-section">
                        <h3>Performance Trend Analysis</h3>
                        <p>' . $data['performance_insights']['trend_analysis'] . '</p>
                    </div>
                    
                    <div class="insight-section">
                        <h3>Key Strengths</h3>
                        <p>' . $data['performance_insights']['strengths'] . '</p>
                    </div>
                    
                    <div class="insight-section">
                        <h3>Areas for Improvement</h3>
                        <p>' . $data['performance_insights']['improvement_areas'] . '</p>
                    </div>
                    
                    <div class="insight-section">
                        <h3>Recommendations</h3>
                        <p>' . $data['performance_insights']['recommendations'] . '</p>
                    </div>
                </div>
            </div>';

        // Add performance distribution if there are evaluations
        if ($data['overall_stats']['total_evaluations'] > 0) {
            $html .= '
            <div class="section">
                <h2>Performance Distribution Analysis</h2>
                <p>The performance distribution provides insights into the consistency and quality of this associate\'s performance across all evaluations.</p>
                
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
                    <td>' . $info['count'] . '</td>
                    <td>' . $percentage . '%</td>
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
                    <h2>Performance Trends Analysis</h2>
                    <p>Understanding performance trends over time helps identify patterns of improvement, consistency, and areas that may require additional attention.</p>
                    
                    <div class="trend-chart">
                        <h3>Quarterly Performance Analysis</h3>
                        <p>The following data shows the progression of performance scores across four quarters, revealing the development trajectory of this associate in disaster preparedness activities.</p>';

                foreach ($data['quarterly_trends'] as $quarter) {
                    $html .= '<div class="quarter-data">
                        <span><strong>' . $quarter['quarter'] . ' (' . $quarter['period'] . ')</strong></span>
                        <span>Average Score: <strong>' . round($quarter['average_score'], 2) . '</strong> | Evaluations: ' . $quarter['total_evaluations'] . '</span>
                    </div>';
                }

                $html .= '</div>
                </div>';
            }

            // Add category analysis if available
            if (!empty($data['category_analysis'])) {
                $html .= '
                <div class="section">
                    <h2>Category Performance Analysis</h2>
                    <p>Understanding performance across different evaluation categories provides insights into specific strengths and areas for improvement within the disaster preparedness framework.</p>
                    
                    <div class="category-analysis">';

                foreach ($data['category_analysis'] as $category => $analysis) {
                    $html .= '<div class="category-card">
                        <div class="category-title">' . $category . '</div>
                        <div class="category-score">' . $analysis['average_score'] . '/4.0</div>
                        <div>Performance Level: <span class="' . strtolower($analysis['performance_level']) . '">' . $analysis['performance_level'] . '</span></div>
                        <div>Evaluations: ' . $analysis['total_evaluations'] . '</div>
                    </div>';
                }

                $html .= '</div>
                </div>';
            }

            // Add evaluation history if available
            if (!empty($data['evaluation_history'])) {
                $html .= '
                <div class="section">
                    <h2>Evaluation History</h2>
                    <p>This comprehensive history provides detailed information about each evaluation conducted for this associate, including scores, performance levels, and additional notes.</p>
                    
                    <table class="performance-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Total Score</th>
                                <th>Performance Level</th>
                                <th>Notes</th>
                            </tr>
                        </thead>
                        <tbody>';

                foreach ($data['evaluation_history'] as $evaluation) {
                    $html .= '<tr>
                        <td>' . $evaluation['date'] . '</td>
                        <td>' . $evaluation['total_score'] . '</td>
                        <td class="' . strtolower($evaluation['performance_level']) . '">' . $evaluation['performance_level'] . '</td>
                        <td>' . $evaluation['notes'] . '</td>
                    </tr>';
                }

                $html .= '</tbody>
                    </table>
                </div>';
            }
        }

        $html .= '
            <div class="footer">
                <p>This individual performance report was automatically generated by the DPAR Platform Management System</p>
                <p>For questions or additional analysis, please contact the system administrator</p>
            </div>
        </body>
        </html>';

        return $html;
    }
}
