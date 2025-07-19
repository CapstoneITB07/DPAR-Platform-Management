<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\CertificateController;
use App\Http\Controllers\MemberController;
use App\Http\Controllers\EvaluationController;
use App\Http\Controllers\TrainingProgramController;
use App\Http\Controllers\AssociateGroupController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PasswordController;
use App\Http\Controllers\VolunteerController;
use App\Http\Controllers\CalendarEventController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Enjoy building your API!
|
*/

// Authentication Routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

// Public GET route for announcements
Route::get('/announcements', [AnnouncementController::class, 'index']);

// Public GET route for associate groups
Route::get('/associate-groups/public', [AssociateGroupController::class, 'publicIndex']);

// Protected Routes (require authentication)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    // Profile routes
    Route::get('/profile', [ProfileController::class, 'getProfile']);
    Route::post('/profile/update-picture', [ProfileController::class, 'updatePicture']);
    Route::post('/profile/update', [ProfileController::class, 'updateProfile']);

    // Password routes
    Route::post('/change-password', [PasswordController::class, 'changePassword']);
    Route::post('/admin/change-password', [PasswordController::class, 'adminChangePassword'])->middleware('role:admin');

    // Resource Controllers
    Route::apiResource('/announcements', AnnouncementController::class)->except(['index']);
    Route::apiResource('/notifications', NotificationController::class);
    Route::post('/notifications/{id}/respond', [NotificationController::class, 'respond']);
    Route::get('/notifications/{id}/volunteer-progress', [NotificationController::class, 'getVolunteerProgress']);
    Route::get('/notifications/{id}/available-capacity', [NotificationController::class, 'getAvailableCapacity']);

    // Reports routes - specific routes first
    Route::get('/reports/submitted', [ReportController::class, 'getSubmittedReports']);
    Route::get('/reports/{id}/download', [ReportController::class, 'download']);
    Route::apiResource('/reports', ReportController::class);

    Route::apiResource('/certificates', CertificateController::class);
    Route::apiResource('/members', MemberController::class);
    Route::get('/evaluations/statistics', [EvaluationController::class, 'statistics']);
    Route::apiResource('/evaluations', EvaluationController::class);
    Route::apiResource('/associate-groups', AssociateGroupController::class);

    // Volunteer routes
    Route::get('/volunteers', [VolunteerController::class, 'index']);
    Route::post('/volunteers', [VolunteerController::class, 'store']);
    Route::put('/volunteers/{volunteer}', [VolunteerController::class, 'update']);
    Route::delete('/volunteers/{volunteer}', [VolunteerController::class, 'destroy']);
    Route::get('/volunteers/count', [VolunteerController::class, 'count']);

    // Calendar Events routes
    Route::apiResource('/calendar-events', CalendarEventController::class);
});

// Public Training Programs API
Route::apiResource('/training-programs', TrainingProgramController::class);

// Note: Laravel automatically prefixes routes in api.php with '/api'.
// So, Route::post('/register', ...) will be accessible at /api/register.
