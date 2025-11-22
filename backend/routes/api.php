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
use App\Http\Controllers\DirectorHistoryController;
use App\Http\Controllers\PendingApplicationController;
use App\Http\Controllers\PushNotificationController;
use App\Http\Controllers\SuperAdminController;

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
Route::post('/check-organization-name', [AuthController::class, 'checkOrganizationName']);
Route::post('/check-director-name', [AuthController::class, 'checkDirectorName']);
Route::post('/check-email', [AuthController::class, 'checkEmail']);
Route::post('/check-username', [AuthController::class, 'checkUsername']);
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle.login:5,10');
Route::post('/superadmin/login', [AuthController::class, 'superadminLogin'])->middleware('throttle.login:5,10');
Route::post('/login/recovery', [AuthController::class, 'loginWithRecoveryPasscode'])->middleware('throttle:5,1');
Route::post('/recovery/send-code', [AuthController::class, 'sendRecoveryCode'])->middleware('throttle:5,1');
Route::post('/recovery/verify-code', [AuthController::class, 'verifyRecoveryCode'])->middleware('throttle:5,1');
Route::post('/verify-otp', [AuthController::class, 'verifyOtp'])->middleware('throttle:5,1');

// Admin recovery account management routes
Route::middleware(['auth:sanctum', 'role:head_admin'])->group(function () {
    Route::get('/recovery-lockout-status', [AuthController::class, 'checkRecoveryLockoutStatus']);
    Route::post('/recovery-unlock-account', [AuthController::class, 'unlockRecoveryAccount']);
});

// Public GET route for announcements
Route::get('/announcements', [AnnouncementController::class, 'index']);

// Public GET route for associate groups
Route::get('/associate-groups/public', [AssociateGroupController::class, 'publicIndex']);

// Push Notification Routes
Route::post('/push/subscribe', [PushNotificationController::class, 'subscribe']);
Route::post('/push/unsubscribe', [PushNotificationController::class, 'unsubscribe']);
Route::post('/push/toggle', [PushNotificationController::class, 'toggleSubscription']);
Route::post('/push/test', [PushNotificationController::class, 'sendTest']); // Public test endpoint
Route::post('/push/clear-old', [PushNotificationController::class, 'clearOldSubscriptions']); // Clear old subscriptions
Route::post('/push/clear-all', [PushNotificationController::class, 'clearAllSubscriptions']); // Clear ALL subscriptions

// Protected Routes (require authentication)
Route::middleware(['auth:sanctum', \App\Http\Middleware\CheckSoftDeletedAssociate::class])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    // Profile routes
    Route::get('/profile', [ProfileController::class, 'getProfile']);
    Route::post('/profile/update-picture', [ProfileController::class, 'updatePicture']);
    Route::post('/profile/update', [ProfileController::class, 'updateProfile']);

    // Password routes
    Route::post('/change-password', [PasswordController::class, 'changePassword']);
    Route::post('/admin/change-password', [PasswordController::class, 'adminChangePassword'])->middleware('role:head_admin');

    // User recovery passcode routes
    Route::get('/user/recovery-passcodes', [PasswordController::class, 'getRecoveryPasscodes']);
    Route::post('/user/send-otp-passcode-regen', [PasswordController::class, 'sendOtpForPasscodeRegen']);
    Route::post('/user/regenerate-passcodes', [PasswordController::class, 'regeneratePasscodes']);

    // Resource Controllers
    Route::apiResource('/announcements', AnnouncementController::class)->except(['index']);
    Route::apiResource('/notifications', NotificationController::class);
    Route::post('/notifications/{id}/respond', [NotificationController::class, 'respond'])->middleware('throttle:10,1');
    Route::get('/notifications/{id}/volunteer-progress', [NotificationController::class, 'getVolunteerProgress']);
    Route::get('/notifications/{id}/available-capacity', [NotificationController::class, 'getAvailableCapacity']);
    Route::post('/notifications/{id}/toggle-hold', [NotificationController::class, 'toggleHold']);

    // Reports routes - specific routes first
    Route::get('/reports/submitted', [ReportController::class, 'getSubmittedReports']);
    Route::get('/reports/{id}/download', [ReportController::class, 'download']);
    Route::put('/reports/{id}/approve', [ReportController::class, 'approve']);
    Route::put('/reports/{id}/reject', [ReportController::class, 'reject']);

    // Add POST route for FormData updates (to handle _method=PUT)
    Route::post('/reports/{id}', [ReportController::class, 'update']);

    Route::apiResource('/reports', ReportController::class);

    Route::apiResource('/certificates', CertificateController::class);
    Route::post('/certificates/bulk', [CertificateController::class, 'storeBulk']);
    Route::get('/members/active', [MemberController::class, 'getActiveMembers']);
    Route::apiResource('/members', MemberController::class);
    Route::get('/evaluations/statistics', [EvaluationController::class, 'statistics']);
    Route::get('/evaluations/summaries', [EvaluationController::class, 'summaries']);
    Route::apiResource('/evaluations', EvaluationController::class);
    Route::get('/dashboard/performance-analysis-pdf', [App\Http\Controllers\DashboardAnalysisController::class, 'generatePerformanceAnalysisPDF']);
    Route::get('/dashboard/individual-performance-analysis-pdf/{userId}', [App\Http\Controllers\DashboardAnalysisController::class, 'generateIndividualPerformanceAnalysisPDF']);
    Route::apiResource('/associate-groups', AssociateGroupController::class);
    Route::get('/associate-groups/{id}/password', [AssociateGroupController::class, 'getPassword'])->middleware('role:head_admin');
    Route::delete('/associate-groups/{id}/password', [AssociateGroupController::class, 'clearTempPassword'])->middleware('role:head_admin');
    Route::post('/associate-groups/{id}/cleanup-director-history', [AssociateGroupController::class, 'cleanupDirectorHistory'])->middleware('role:head_admin');
    Route::post('/associate-groups/cleanup-all-director-history', [AssociateGroupController::class, 'cleanupAllDirectorHistory'])->middleware('role:head_admin');
    Route::post('/associate-groups/fix-director-fields', [AssociateGroupController::class, 'fixDirectorFields'])->middleware('role:head_admin');

    // Pending Applications routes (Admin only)
    Route::middleware('role:head_admin')->group(function () {
        Route::get('/pending-applications', [PendingApplicationController::class, 'index']);
        Route::get('/pending-applications/{id}', [PendingApplicationController::class, 'show']);
        Route::post('/pending-applications/{id}/approve', [PendingApplicationController::class, 'approve']);
        Route::post('/pending-applications/{id}/reject', [PendingApplicationController::class, 'reject']);
        Route::delete('/pending-applications/{id}', [PendingApplicationController::class, 'destroy']);
    });

    // Director History routes
    Route::get('/associate-groups/{id}/director-history', [DirectorHistoryController::class, 'index']);
    Route::post('/associate-groups/{id}/director-history', [DirectorHistoryController::class, 'store'])->middleware('role:head_admin');
    Route::put('/director-history/{id}', [DirectorHistoryController::class, 'update'])->middleware('role:head_admin');
    Route::delete('/director-history/{id}', [DirectorHistoryController::class, 'destroy'])->middleware('role:head_admin');

    // Director Achievement routes
    Route::get('/director-history/{id}/achievements', [DirectorHistoryController::class, 'getAchievements']);
    Route::post('/director-history/{id}/generate-achievements', [DirectorHistoryController::class, 'generateAchievements'])->middleware('role:head_admin');
    Route::post('/director-history/{id}/end-directorship', [DirectorHistoryController::class, 'endDirectorship'])->middleware('role:head_admin');

    // Volunteer routes
    Route::get('/volunteers', [VolunteerController::class, 'index']);
    Route::post('/volunteers', [VolunteerController::class, 'store']);
    Route::put('/volunteers/{volunteer}', [VolunteerController::class, 'update']);
    Route::delete('/volunteers/{volunteer}', [VolunteerController::class, 'destroy']);
    Route::get('/volunteers/count', [VolunteerController::class, 'count']);
    Route::post('/volunteers/import-excel', [VolunteerController::class, 'importExcel']);
    Route::get('/volunteers/download-template', [VolunteerController::class, 'downloadTemplate']);

    // Calendar Events routes
    Route::apiResource('/calendar-events', CalendarEventController::class);

    // Push Notification Status
    Route::get('/push/status', [PushNotificationController::class, 'getStatus']);
    Route::get('/push/debug', [PushNotificationController::class, 'debugSubscriptions']);
});

// Public Training Programs API
Route::apiResource('/training-programs', TrainingProgramController::class);

// Public Citizen Analytics Tracking
Route::post('/citizen/track-view', [SuperAdminController::class, 'trackCitizenView']);

// Super Admin Routes (Separate API endpoints for superadmin)
Route::middleware(['auth:sanctum', 'role:superadmin'])->prefix('superadmin')->group(function () {
    // System Overview
    Route::get('/overview', [SuperAdminController::class, 'getSystemOverview']);
    Route::get('/database-stats', [SuperAdminController::class, 'getDatabaseStats']);
    Route::get('/recent-activities', [SuperAdminController::class, 'getRecentActivities']);
    
    // Head Admin Management
    Route::get('/head-admins', [SuperAdminController::class, 'getHeadAdmins']);
    Route::post('/head-admins', [SuperAdminController::class, 'createHeadAdmin']);
    Route::put('/head-admins/{id}', [SuperAdminController::class, 'updateHeadAdmin']);
    Route::delete('/head-admins/{id}', [SuperAdminController::class, 'deleteHeadAdmin']);
    Route::delete('/head-admins/{id}/permanent', [SuperAdminController::class, 'permanentDeleteHeadAdmin']);
    Route::post('/head-admins/{id}/restore', [SuperAdminController::class, 'restoreHeadAdmin']);
    Route::get('/head-admins/{id}/activity', [SuperAdminController::class, 'getHeadAdminActivity']);
    
    // User Management
    Route::get('/users', [SuperAdminController::class, 'getAllUsers']);
    
    // Associate Groups Management
    Route::get('/associate-groups', [SuperAdminController::class, 'getAllAssociateGroups']);
    Route::put('/associate-groups/{id}', [SuperAdminController::class, 'updateAssociateGroup']);
    Route::delete('/associate-groups/{id}', [SuperAdminController::class, 'deleteAssociateGroup']);
    Route::delete('/associate-groups/{id}/permanent', [SuperAdminController::class, 'permanentDeleteAssociateGroup']);
    Route::post('/associate-groups/{id}/restore', [SuperAdminController::class, 'restoreAssociateGroup']);
    
    // Pending Applications Management
    Route::get('/pending-applications', [SuperAdminController::class, 'getAllPendingApplications']);
    Route::post('/pending-applications/{id}/override', [SuperAdminController::class, 'overrideApplicationDecision']);
    Route::put('/pending-applications/{id}/sec', [SuperAdminController::class, 'updateApplicationSEC']);
    Route::delete('/pending-applications/{id}/permanent', [SuperAdminController::class, 'permanentDeleteApplication']);
    
    // System Logs
    Route::get('/system-logs', [SuperAdminController::class, 'getSystemLogs']);
    Route::post('/system-logs/cleanup', [SuperAdminController::class, 'cleanupSystemLogs']);
    
    // Content Management (Notifications, Announcements, Training Programs)
    Route::get('/notifications', [SuperAdminController::class, 'getAllNotifications']);
    Route::delete('/notifications/{id}', [SuperAdminController::class, 'deleteNotification']);
    Route::delete('/notifications/{id}/permanent', [SuperAdminController::class, 'permanentDeleteNotification']);
    Route::post('/notifications/{id}/restore', [SuperAdminController::class, 'restoreNotification']);
    Route::get('/announcements', [SuperAdminController::class, 'getAllAnnouncements']);
    Route::delete('/announcements/{id}', [SuperAdminController::class, 'deleteAnnouncement']);
    Route::delete('/announcements/{id}/permanent', [SuperAdminController::class, 'permanentDeleteAnnouncement']);
    Route::post('/announcements/{id}/restore', [SuperAdminController::class, 'restoreAnnouncement']);
    Route::put('/announcements/{id}/visibility', [SuperAdminController::class, 'toggleAnnouncementVisibility']);
    Route::put('/announcements/{id}/featured', [SuperAdminController::class, 'toggleAnnouncementFeatured']);
    Route::get('/training-programs', [SuperAdminController::class, 'getAllTrainingPrograms']);
    Route::delete('/training-programs/{id}', [SuperAdminController::class, 'deleteTrainingProgram']);
    Route::delete('/training-programs/{id}/permanent', [SuperAdminController::class, 'permanentDeleteTrainingProgram']);
    Route::post('/training-programs/{id}/restore', [SuperAdminController::class, 'restoreTrainingProgram']);
    Route::put('/training-programs/{id}/visibility', [SuperAdminController::class, 'toggleTrainingProgramVisibility']);
    Route::put('/training-programs/{id}/featured', [SuperAdminController::class, 'toggleTrainingProgramFeatured']);
    
    // Citizen Analytics
    Route::get('/citizen-analytics', [SuperAdminController::class, 'getCitizenAnalytics']);
    Route::post('/citizen-analytics/cleanup', [SuperAdminController::class, 'cleanupOldAnalytics']);
    
    // System Settings
    Route::get('/settings', [SuperAdminController::class, 'getSystemSettings']);
    Route::put('/settings', [SuperAdminController::class, 'updateSystemSettings']);

    // System Alerts Management
    Route::get('/system-alerts', [SuperAdminController::class, 'getAllSystemAlerts']);
    Route::post('/system-alerts', [SuperAdminController::class, 'createSystemAlert']);
    Route::put('/system-alerts/{id}', [SuperAdminController::class, 'updateSystemAlert']);
    Route::delete('/system-alerts/{id}', [SuperAdminController::class, 'deleteSystemAlert']);
    Route::post('/system-alerts/{id}/restore', [SuperAdminController::class, 'restoreSystemAlert']);
    Route::delete('/system-alerts/{id}/permanent', [SuperAdminController::class, 'permanentDeleteSystemAlert']);
    
    // Reports Management
    Route::get('/reports/deleted', [SuperAdminController::class, 'getDeletedReports']);
    Route::delete('/reports/{id}', [SuperAdminController::class, 'deleteReport']);
    Route::delete('/reports/{id}/permanent', [SuperAdminController::class, 'permanentDeleteReport']);
    Route::post('/reports/{id}/restore', [SuperAdminController::class, 'restoreReport']);
});

// Public route for active system alerts (no auth required, but respects user role if authenticated)
Route::get('/system-alerts/active', [SuperAdminController::class, 'getActiveSystemAlerts']);

// Note: Laravel automatically prefixes routes in api.php with '/api'.
// So, Route::post('/register', ...) will be accessible at /api/register.
