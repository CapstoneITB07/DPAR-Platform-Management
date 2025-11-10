# Unused Features Report

## Summary

This report identifies features, code, and routes that are defined but not actively used in the DPAR Platform Management System.

---

## 🔴 Backend - Unused Controllers

### 1. **UserController.php** ❌ NOT USED

- **Location**: `backend/app/Http/Controllers/UserController.php`
- **Status**: Controller exists but is NOT registered in any routes
- **Methods**:
  - `updateProfile()` - Not used (ProfileController is used instead)
  - `getProfile()` - Not used (ProfileController is used instead)
  - `changePassword()` - Not used (PasswordController is used instead)
- **Recommendation**: **DELETE** - All functionality is handled by ProfileController and PasswordController

---

## 🟡 Backend - Unused API Routes

### 1. **Recovery Account Management Routes** ⚠️ NOT USED IN FRONTEND

- **Routes**:
  - `GET /api/recovery-lockout-status`
  - `POST /api/recovery-unlock-account`
- **Location**: `backend/routes/api.php` (lines 46-49)
- **Status**: Routes exist but no frontend code calls them
- **Recommendation**: Keep if needed for admin tools, or remove if not needed

### 2. **Director History Cleanup Routes** ⚠️ NOT USED IN FRONTEND

- **Routes**:
  - `POST /api/associate-groups/{id}/cleanup-director-history`
  - `POST /api/associate-groups/cleanup-all-director-history`
  - `POST /api/associate-groups/fix-director-fields`
- **Location**: `backend/routes/api.php` (lines 114-116)
- **Status**: Routes exist but no frontend code calls them
- **Recommendation**: Keep if needed for maintenance/admin tools, or remove if not needed

### 3. **Push Notification Debug/Test Routes** ⚠️ PARTIALLY USED

- **Routes**:
  - `POST /api/push/test` - Function exists in frontend but may not be called
  - `POST /api/push/clear-old` - Function exists but not called
  - `POST /api/push/clear-all` - Function exists but not called
  - `GET /api/push/debug` - Route exists but not called
- **Location**: `backend/routes/api.php` (lines 61-63, 152)
- **Status**: Routes exist, functions exist in `pushNotifications.js` but may not be actively used
- **Recommendation**: Keep for debugging/testing purposes, or remove if not needed

---

## 🟡 Frontend - Unused Code/Features

### 1. **Recovery Passcode Display Code** ⚠️ DEAD CODE

- **Location**: `frontend/src/components/AdminDashboard/js/AssociateGroups.js` (lines 837-913)
- **Status**: Code exists to display recovery passcodes, but:
  - Backend no longer generates recovery passcodes (removed)
  - Backend doesn't return recovery passcodes in response
  - This code will NEVER execute
- **Code Sections**:
  - Lines 837-841: Check for "Associate Recovery Passcodes:" in popupError
  - Lines 857-905: Recovery passcodes display section
  - Lines 907-913: Warning message about recovery passcodes
- **Recommendation**: **REMOVE** - This is dead code that will never execute

### 2. **Push Notification Test/Clear Functions** ⚠️ MAY NOT BE USED

- **Location**: `frontend/src/utils/pushNotifications.js`
- **Functions**:
  - `sendTestNotification()` - Exists but may not be called anywhere
  - Functions for `clear-old` and `clear-all` - May not be called
- **Status**: Functions are exported but may not be imported/used
- **Recommendation**: Check if these are called anywhere, remove if not used

---

## ✅ Used Features (For Reference)

### All Frontend Components Are Used:

- ✅ All AdminDashboard components are routed and used
- ✅ All AssociateDashboard components are routed and used
- ✅ All CitizenPage components are routed and used
- ✅ Login and Registration components are used

### All Backend Controllers (Except UserController) Are Used:

- ✅ AnnouncementController - Used
- ✅ AssociateGroupController - Used
- ✅ AuthController - Used
- ✅ CalendarEventController - Used
- ✅ CertificateController - Used
- ✅ DashboardAnalysisController - Used (in AdminDashboard)
- ✅ DirectorHistoryController - Used
- ✅ EvaluationController - Used
- ✅ MemberController - Used
- ✅ NotificationController - Used
- ✅ PasswordController - Used
- ✅ PendingApplicationController - Used
- ✅ ProfileController - Used
- ✅ PushNotificationController - Used
- ✅ ReportController - Used
- ✅ TrainingProgramController - Used
- ✅ VolunteerController - Used

---

## 📋 Recommendations

### High Priority - Remove Dead Code:

1. **DELETE** `UserController.php` - Completely unused, functionality handled elsewhere
2. **REMOVE** Recovery passcode display code from `AssociateGroups.js` - Dead code

### Medium Priority - Review:

1. **REVIEW** Recovery account management routes - Keep if needed for admin, remove if not
2. **REVIEW** Director history cleanup routes - Keep if needed for maintenance, remove if not
3. **REVIEW** Push notification test/debug routes - Keep for debugging or remove

### Low Priority - Optional:

1. Check if `sendTestNotification()` is called anywhere
2. Verify all push notification utility functions are actually used

---

## 🔍 How to Verify

To verify if a feature is truly unused:

1. **Backend Routes**: Search frontend codebase for the API endpoint
2. **Frontend Functions**: Search for imports and function calls
3. **Components**: Check if component is imported and used in routes

---

**Generated**: January 2025
**Last Checked**: After removal of recovery passcode generation
