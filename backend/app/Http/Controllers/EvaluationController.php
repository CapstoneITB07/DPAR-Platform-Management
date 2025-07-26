<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Evaluation;
use Illuminate\Support\Facades\Log;

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

            // Calculate total score from evaluation data
            $totalScore = 0;
            $count = 0;
            foreach ($request->evaluation_data as $category) {
                if (isset($category['scores'])) {
                    $scores = array_values($category['scores']);
                    $validScores = array_filter($scores, function ($score) {
                        return is_numeric($score) && $score > 0;
                    });
                    if (count($validScores) > 0) {
                        $totalScore += array_sum($validScores);
                        $count += count($validScores);
                    }
                }
            }
            $averageScore = $count > 0 ? $totalScore / $count : 0;

            $evaluation = Evaluation::create([
                'user_id' => $request->user_id,
                'evaluation_data' => json_encode($request->evaluation_data),
                'total_score' => round($averageScore, 2)
            ]);

            // Load the user relationship and return formatted data
            $evaluation->load('user:id,name,organization');

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
}
