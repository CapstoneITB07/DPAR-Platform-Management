<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Evaluation;
use App\Models\ActivityLog;
use App\Models\AssociateGroup;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class EvaluationController extends Controller
{
    public function index()
    {
        try {
            $evaluations = Evaluation::with(['user:id,name,organization'])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($evaluation) {
                    // Ensure evaluation_data is properly decoded
                    $evaluationData = is_string($evaluation->evaluation_data)
                        ? json_decode($evaluation->evaluation_data, true)
                        : $evaluation->evaluation_data;

                    return [
                        'id' => $evaluation->id,
                        'user_id' => $evaluation->user_id,
                        'evaluation_data' => $evaluationData,
                        'total_score' => (float) $evaluation->total_score,
                        'created_at' => $evaluation->created_at,
                        'updated_at' => $evaluation->updated_at,
                        'user' => [
                            'id' => $evaluation->user->id,
                            'name' => $evaluation->user->name,
                            'organization' => $evaluation->user->organization
                        ]
                    ];
                });

            return response()->json($evaluations);
        } catch (\Exception $e) {
            Log::error('Error in EvaluationController@index: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            return response()->json(['error' => 'Failed to fetch evaluations: ' . $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $request->validate([
                'user_id' => 'required|exists:users,id',
                'evaluation_data' => 'required|array',
            ]);

            // Validate that all evaluation criteria are scored
            $expectedCategories = [
                'Volunteer Participation',
                'Task Accommodation and Completion',
                'Communication Effectiveness',
                'Team Objective Above Self'
            ];

            $missingScores = [];
            $totalScore = 0;
            $count = 0;

            foreach ($expectedCategories as $category) {
                if (!isset($request->evaluation_data[$category]) || !isset($request->evaluation_data[$category]['scores'])) {
                    $missingScores[] = $category . ' - No scores provided';
                    continue;
                }

                $scores = $request->evaluation_data[$category]['scores'];
                $categoryMissingScores = [];

                // Check for missing or invalid scores
                foreach ($scores as $key => $score) {
                    if (!is_numeric($score) || $score <= 0 || $score > 4) {
                        $categoryMissingScores[] = $key;
                    }
                }

                if (!empty($categoryMissingScores)) {
                    $missingScores[] = $category . ' - Missing or invalid scores: ' . implode(', ', array_slice($categoryMissingScores, 0, 3));
                }

                // Calculate valid scores for this category
                $validScores = array_filter($scores, function ($score) {
                    return is_numeric($score) && $score > 0 && $score <= 4;
                });

                if (count($validScores) > 0) {
                    $totalScore += array_sum($validScores);
                    $count += count($validScores);
                }
            }

            // If there are missing scores, return validation error
            if (!empty($missingScores)) {
                return response()->json([
                    'message' => 'Evaluation incomplete. Please score all criteria before submitting.',
                    'errors' => $missingScores
                ], 422);
            }

            $averageScore = $count > 0 ? $totalScore / $count : 0;

            $evaluation = Evaluation::create([
                'user_id' => $request->user_id,
                'evaluation_data' => json_encode($request->evaluation_data),
                'total_score' => round($averageScore, 2)
            ]);

            // Load the user relationship and return formatted data
            $evaluation->load('user:id,name,organization');
            
            // Get associate group information for logging
            $associateGroup = AssociateGroup::where('user_id', $request->user_id)->first();
            
            // Log activity for evaluation creation
            try {
                ActivityLog::logActivity(
                    Auth::id(),
                    'evaluation_created',
                    'Evaluated associate group: ' . ($associateGroup ? $associateGroup->name : $evaluation->user->name),
                    [
                        'evaluation_id' => $evaluation->id,
                        'evaluated_user_id' => $request->user_id,
                        'evaluated_user_name' => $evaluation->user->name,
                        'associate_group_id' => $associateGroup ? $associateGroup->id : null,
                        'associate_group_name' => $associateGroup ? $associateGroup->name : null,
                        'total_score' => round($averageScore, 2),
                        'action_by' => Auth::user()->role
                    ],
                    null
                );
            } catch (\Exception $e) {
                Log::error('Failed to log evaluation creation activity: ' . $e->getMessage());
            }

            return response()->json([
                'message' => 'Evaluation created successfully',
                'evaluation' => [
                    'id' => $evaluation->id,
                    'user_id' => $evaluation->user_id,
                    'evaluation_data' => json_decode($evaluation->evaluation_data),
                    'total_score' => $evaluation->total_score,
                    'created_at' => $evaluation->created_at,
                    'updated_at' => $evaluation->updated_at,
                    'user' => [
                        'id' => $evaluation->user->id,
                        'name' => $evaluation->user->name,
                        'organization' => $evaluation->user->organization
                    ]
                ]
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error creating evaluation: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show(string $id)
    {
        try {
            $evaluation = Evaluation::with('user')->findOrFail($id);
            $evaluation->evaluation_data = json_decode($evaluation->evaluation_data);
            return response()->json($evaluation);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching evaluation: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, string $id)
    {
        try {
            $request->validate([
                'evaluation_data' => 'required|array',
            ]);

            $evaluation = Evaluation::findOrFail($id);

            // Calculate new total score
            $totalScore = 0;
            $count = 0;
            foreach ($request->evaluation_data as $category) {
                if (isset($category['scores'])) {
                    $scores = array_values($category['scores']);
                    $totalScore += array_sum($scores);
                    $count += count($scores);
                }
            }
            $averageScore = $count > 0 ? $totalScore / $count : 0;

            $evaluation->update([
                'evaluation_data' => json_encode($request->evaluation_data),
                'total_score' => round($averageScore, 2)
            ]);
            
            // Load user and associate group for logging
            $evaluation->load('user:id,name,organization');
            $associateGroup = AssociateGroup::where('user_id', $evaluation->user_id)->first();
            
            // Log activity for evaluation update
            try {
                ActivityLog::logActivity(
                    Auth::id(),
                    'evaluation_updated',
                    'Updated evaluation for associate group: ' . ($associateGroup ? $associateGroup->name : $evaluation->user->name),
                    [
                        'evaluation_id' => $evaluation->id,
                        'evaluated_user_id' => $evaluation->user_id,
                        'evaluated_user_name' => $evaluation->user->name,
                        'associate_group_id' => $associateGroup ? $associateGroup->id : null,
                        'associate_group_name' => $associateGroup ? $associateGroup->name : null,
                        'total_score' => round($averageScore, 2),
                        'action_by' => Auth::user()->role
                    ],
                    null
                );
            } catch (\Exception $e) {
                Log::error('Failed to log evaluation update activity: ' . $e->getMessage());
            }

            return response()->json([
                'message' => 'Evaluation updated successfully',
                'evaluation' => $evaluation
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error updating evaluation: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy(string $id)
    {
        try {
            $evaluation = Evaluation::findOrFail($id);
            $evaluation->delete();
            return response()->json([
                'message' => 'Evaluation deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error deleting evaluation: ' . $e->getMessage()
            ], 500);
        }
    }

    public function statistics()
    {
        try {
            $evaluations = Evaluation::with(['user:id,name,organization'])
                ->orderBy('created_at', 'asc')
                ->get();

            // Monthly performance trends
            $monthlyTrends = [];
            $kpiTrends = [
                'Volunteer Participation' => [],
                'Task Accommodation and Completion' => [],
                'Communication Effectiveness' => [],
                'Team Objective Above Self' => []
            ];

            foreach ($evaluations as $evaluation) {
                $monthKey = date('Y-m', strtotime($evaluation->created_at));
                $monthLabel = date('M Y', strtotime($evaluation->created_at));

                if (!isset($monthlyTrends[$monthKey])) {
                    $monthlyTrends[$monthKey] = [
                        'label' => $monthLabel,
                        'scores' => [],
                        'count' => 0
                    ];
                }

                $monthlyTrends[$monthKey]['scores'][] = $evaluation->total_score;
                $monthlyTrends[$monthKey]['count']++;

                // Process KPI data
                $evalData = is_string($evaluation->evaluation_data)
                    ? json_decode($evaluation->evaluation_data, true)
                    : $evaluation->evaluation_data;

                if ($evalData) {
                    foreach ($kpiTrends as $kpi => &$trend) {
                        if (isset($evalData[$kpi]['scores'])) {
                            $scores = array_values($evalData[$kpi]['scores']);
                            $validScores = array_filter($scores, function ($score) {
                                return is_numeric($score) && $score > 0;
                            });
                            if (!empty($validScores)) {
                                $average = array_sum($validScores) / count($validScores);
                                $trend[$monthKey] = $trend[$monthKey] ?? [];
                                $trend[$monthKey][] = round($average, 2);
                            }
                        }
                    }
                }
            }

            // Calculate monthly averages
            $monthlyAverages = [];
            foreach ($monthlyTrends as $monthKey => $data) {
                $monthlyAverages[] = [
                    'month' => $data['label'],
                    'average_score' => round(array_sum($data['scores']) / count($data['scores']), 2),
                    'evaluation_count' => $data['count']
                ];
            }

            // Calculate KPI averages
            $kpiAverages = [];
            foreach ($kpiTrends as $kpi => $trend) {
                $kpiAverages[$kpi] = [];
                foreach ($trend as $monthKey => $scores) {
                    $monthLabel = date('M Y', strtotime($monthKey . '-01'));
                    $kpiAverages[$kpi][] = [
                        'month' => $monthLabel,
                        'average_score' => round(array_sum($scores) / count($scores), 2)
                    ];
                }
            }

            // Overall statistics
            $totalEvaluations = $evaluations->count();
            $averageScore = $totalEvaluations > 0
                ? round($evaluations->avg('total_score'), 2)
                : 0;

            $scoreDistribution = [
                'excellent' => $evaluations->where('total_score', '>=', 3.5)->count(),
                'good' => $evaluations->whereBetween('total_score', [2.5, 3.49])->count(),
                'fair' => $evaluations->whereBetween('total_score', [1.5, 2.49])->count(),
                'poor' => $evaluations->where('total_score', '<', 1.5)->count()
            ];

            return response()->json([
                'monthly_trends' => $monthlyAverages,
                'kpi_trends' => $kpiAverages,
                'overall_stats' => [
                    'total_evaluations' => $totalEvaluations,
                    'average_score' => $averageScore,
                    'score_distribution' => $scoreDistribution
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error in EvaluationController@statistics: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch statistics: ' . $e->getMessage()], 500);
        }
    }

    public function summaries()
    {
        try {
            $evaluations = Evaluation::with(['user:id,name,organization'])
                ->orderBy('created_at', 'desc')
                ->get();

            $summaries = [];
            $userEvaluations = [];

            // Group evaluations by user
            foreach ($evaluations as $evaluation) {
                $userId = $evaluation->user_id;
                if (!isset($userEvaluations[$userId])) {
                    $userEvaluations[$userId] = [
                        'user' => $evaluation->user,
                        'evaluations' => []
                    ];
                }
                $userEvaluations[$userId]['evaluations'][] = $evaluation;
            }

            // Process each user's evaluations
            foreach ($userEvaluations as $userId => $userData) {
                $evaluations = $userData['evaluations'];
                $user = $userData['user'];

                // Get latest evaluation
                $latestEvaluation = $evaluations[0];
                $evalData = is_string($latestEvaluation->evaluation_data)
                    ? json_decode($latestEvaluation->evaluation_data, true)
                    : $latestEvaluation->evaluation_data;

                // Calculate category averages for latest evaluation
                $categoryAverages = [];
                $kpiWeights = [
                    'Volunteer Participation' => 0.25,
                    'Task Accommodation and Completion' => 0.30,
                    'Communication Effectiveness' => 0.15,
                    'Team Objective Above Self' => 0.30
                ];

                foreach ($kpiWeights as $category => $weight) {
                    if (isset($evalData[$category]['scores'])) {
                        $scores = array_values($evalData[$category]['scores']);
                        $validScores = array_filter($scores, function ($score) {
                            return is_numeric($score) && $score > 0;
                        });
                        if (!empty($validScores)) {
                            $categoryAverages[$category] = round(array_sum($validScores) / count($validScores), 2);
                        } else {
                            $categoryAverages[$category] = 0;
                        }
                    } else {
                        $categoryAverages[$category] = 0;
                    }
                }

                // Calculate trend (compare with previous evaluation if exists)
                $trend = 'stable';
                if (count($evaluations) > 1) {
                    $previousScore = $evaluations[1]->total_score;
                    $currentScore = $latestEvaluation->total_score;
                    if ($currentScore > $previousScore + 0.1) {
                        $trend = 'improving';
                    } elseif ($currentScore < $previousScore - 0.1) {
                        $trend = 'declining';
                    }
                }

                // Count total evaluations first
                $totalEvaluations = count($evaluations);

                // Calculate performance level
                $performanceLevel = 'Poor';
                if ($latestEvaluation->total_score >= 3.5) {
                    $performanceLevel = 'Excellent';
                } elseif ($latestEvaluation->total_score >= 2.5) {
                    $performanceLevel = 'Good';
                } elseif ($latestEvaluation->total_score >= 1.5) {
                    $performanceLevel = 'Fair';
                }

                // Generate performance summary
                $performanceSummary = $this->generatePerformanceSummary($categoryAverages, $performanceLevel, $trend, $totalEvaluations);

                // Generate category descriptions
                $categoryDescriptions = $this->generateCategoryDescriptions($categoryAverages);

                $summaries[] = [
                    'user_id' => $userId,
                    'user_name' => $user->name,
                    'organization' => $user->organization,
                    'latest_evaluation' => [
                        'id' => $latestEvaluation->id,
                        'total_score' => $latestEvaluation->total_score,
                        'performance_level' => $performanceLevel,
                        'category_scores' => $categoryAverages,
                        'evaluation_date' => $latestEvaluation->created_at->format('Y-m-d H:i:s'),
                        'trend' => $trend,
                        'performance_summary' => $performanceSummary,
                        'category_descriptions' => $categoryDescriptions
                    ],
                    'evaluation_history' => [
                        'total_evaluations' => $totalEvaluations,
                        'average_score' => round(array_sum(array_column($evaluations, 'total_score')) / $totalEvaluations, 2),
                        'first_evaluation' => end($evaluations)->created_at->format('Y-m-d'),
                        'last_evaluation' => $latestEvaluation->created_at->format('Y-m-d')
                    ]
                ];
            }

            // Sort by total score descending
            usort($summaries, function ($a, $b) {
                return $b['latest_evaluation']['total_score'] <=> $a['latest_evaluation']['total_score'];
            });

            return response()->json([
                'summaries' => $summaries,
                'total_associates' => count($summaries)
            ]);
        } catch (\Exception $e) {
            Log::error('Error in EvaluationController@summaries: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch evaluation summaries: ' . $e->getMessage()], 500);
        }
    }

    private function generatePerformanceSummary($categoryAverages, $performanceLevel, $trend, $totalEvaluations)
    {
        $summary = "This associate demonstrates {$performanceLevel} performance overall. ";

        // Find strongest and weakest categories
        $maxCategory = array_keys($categoryAverages, max($categoryAverages))[0];
        $minCategory = array_keys($categoryAverages, min($categoryAverages))[0];

        $maxScore = $categoryAverages[$maxCategory];
        $minScore = $categoryAverages[$minCategory];

        // Add category insights
        if ($maxScore >= 3.5) {
            $summary .= "They excel particularly in {$maxCategory} with a score of {$maxScore}. ";
        } elseif ($maxScore >= 2.5) {
            $summary .= "Their strongest area is {$maxCategory} with a score of {$maxScore}. ";
        }

        if ($minScore < 2.5) {
            $summary .= "There is room for improvement in {$minCategory} (score: {$minScore}). ";
        }

        // Add trend information
        if ($trend === 'improving') {
            $summary .= "Their performance has been improving over time, showing positive development. ";
        } elseif ($trend === 'declining') {
            $summary .= "Recent evaluations show a declining trend that may require attention. ";
        } else {
            $summary .= "Their performance has remained stable across evaluations. ";
        }

        // Add evaluation frequency insight
        if ($totalEvaluations >= 3) {
            $summary .= "With {$totalEvaluations} evaluations, this provides a comprehensive view of their performance. ";
        } elseif ($totalEvaluations == 2) {
            $summary .= "Based on {$totalEvaluations} evaluations, early patterns are emerging. ";
        } else {
            $summary .= "This is their first evaluation, providing an initial performance baseline. ";
        }

        return trim($summary);
    }

    private function generateCategoryDescriptions($categoryAverages)
    {
        $descriptions = [];

        foreach ($categoryAverages as $category => $score) {
            $descriptions[$category] = $this->getCategoryDescription($category, $score);
        }

        return $descriptions;
    }

    private function getCategoryDescription($category, $score)
    {
        $descriptions = [
            'Volunteer Participation' => [
                'excellent' => "Demonstrates exceptional volunteer participation both within and outside the coalition. Actively engages in meetings, trainings, and field activities without constant reminders. Shows initiative by suggesting and leading new activities.",
                'good' => "Shows consistent volunteer participation in coalition activities. Generally participates in meetings and trainings, with occasional need for reminders. Contributes to field activities and shows willingness to help.",
                'fair' => "Participates in volunteer activities but may require more frequent reminders or encouragement. Shows basic engagement in meetings and trainings, with room for improvement in initiative and consistency.",
                'poor' => "Limited volunteer participation with frequent absences or lack of engagement. Requires constant reminders to participate in activities. Shows minimal initiative in volunteer work."
            ],
            'Task Accommodation and Completion' => [
                'excellent' => "Consistently meets deadlines and maintains high quality standards. Effectively aligns group workflows with coalition plans. Successfully completes tasks independently and seeks appropriate support when needed.",
                'good' => "Generally meets deadlines and maintains acceptable quality standards. Works well within group dynamics and completes most tasks with minimal supervision.",
                'fair' => "Meets basic requirements but may struggle with deadlines or quality consistency. Requires more supervision and guidance to complete tasks effectively.",
                'poor' => "Frequently misses deadlines or produces substandard work. Requires constant supervision and struggles to complete tasks independently."
            ],
            'Communication Effectiveness' => [
                'excellent' => "Excellent communication skills with clear, respectful interactions. Actively shares knowledge and ideas, provides constructive feedback, and effectively communicates with the public. Seeks and uses feedback to improve performance.",
                'good' => "Good communication skills with clear and respectful interactions. Participates in discussions and provides feedback when appropriate. Communicates effectively in most situations.",
                'fair' => "Basic communication skills with room for improvement in clarity and consistency. May struggle with complex discussions or providing constructive feedback.",
                'poor' => "Poor communication skills with unclear or inappropriate interactions. Difficulty in sharing ideas or providing feedback. May struggle with public communication."
            ],
            'Team Objective Above Self' => [
                'excellent' => "Consistently prioritizes team and coalition objectives over personal interests. Demonstrates strong leadership and supports team members. Shows commitment to collective goals and organizational mission.",
                'good' => "Generally supports team objectives and works well with others. Shows commitment to group goals with occasional focus on personal interests.",
                'fair' => "Basic understanding of team objectives but may prioritize personal interests at times. Shows some commitment to group goals but needs improvement in team focus.",
                'poor' => "Frequently prioritizes personal interests over team objectives. Shows limited commitment to group goals and may hinder team progress."
            ]
        ];

        $level = 'poor';
        if ($score >= 3.5) $level = 'excellent';
        elseif ($score >= 2.5) $level = 'good';
        elseif ($score >= 1.5) $level = 'fair';

        return $descriptions[$category][$level] ?? "No specific description available for this category.";
    }
}
