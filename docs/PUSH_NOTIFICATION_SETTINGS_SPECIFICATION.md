# Push Notification Settings — Task Specification

**Feature:** User-Configurable Push Notification Settings for Team Notifications  
**Type:** Feature Implementation Task  
**Priority:** High  
**Target:** React Native (Expo) Mobile App  
**Status:** Ready for Implementation

---

## 1. Overview

This document specifies the implementation of user-configurable push notification settings for the FC Zličín mobile app. The feature allows users to personalize their notification preferences by selecting favorite teams and controlling which types of notifications they receive. This implementation follows best practices for sports applications, emphasizing personalization and segmentation to improve user engagement and reduce opt-outs.

### Context

- The app uses React Native with Expo (~51.0.0)
- Firebase Cloud Messaging (FCM) is integrated via `@react-native-firebase/messaging`
- Expo Notifications API is available via `expo-notifications`
- Settings screen exists at `src/screens/SettingsScreen.tsx`
- Notification preferences store exists at `src/stores/notificationPreferencesStore.ts`
- Teams API endpoint: `GET https://www.fczlicin.cz/api/teams`
- Teams are defined with `id`, `name`, and `category` fields

---

## 2. Requirements

### 2.1 Global Push Switch

**Requirement:** Provide a single master toggle that controls all push notifications.

- **Location:** Settings screen → Notifications section
- **Behavior:**
  - When **OFF**: User receives no push notifications (regardless of other settings)
  - When **ON**: User can receive notifications based on their preferences
  - This toggle takes precedence over all other notification settings
- **Storage:** Persisted in `notificationPreferencesStore`
- **Default:** `true` (enabled)

**Implementation Notes:**
- If user turns this OFF, backend should not send notifications to this device
- When OFF, all other notification toggles should be visually disabled (but retain their values)
- When user enables this toggle, check OS-level permission status
- If OS permission is denied, show appropriate message (see Edge Cases)

---

### 2.2 Favorite Teams Selection

**Requirement:** Allow users to select one or more teams for notification filtering.

- **Data Source:** `GET https://www.fczlicin.cz/api/teams`
- **Selection:** Multiple teams can be selected
- **Storage:** Array of team IDs persisted in `notificationPreferencesStore`
- **UI:** Multi-select list (can be modal, expandable list, or dedicated screen)
- **Display:** Show team names clearly; indicate selected teams (checkmark, highlight, etc.)

**Behavior:**
- Users can select/deselect teams
- Selected teams are used to filter notifications from backend
- If no teams are selected: User receives only general app notifications (if implemented in future)
- Selection persists across app restarts

**Implementation Notes:**
- Use existing `footballApi.getTeams()` from `src/api/footballEndpoints.ts`
- Team data structure: `{ id: number, name: string, category: 'seniors' | 'youth' }`
- Consider grouping by category (seniors/youth) for better UX
- Backend should only send notifications for selected teams

---

### 2.3 Notification Types

Two notification types must be controlled separately:

#### 2.3.1 Match Start Reminder

- **Type:** Toggle (ON/OFF)
- **Description:** Notifies user before a match involving selected teams begins
- **Timing:** ~15 minutes before kickoff (backend-controlled or fixed)
- **Default:** `true` (enabled)
- **Storage:** Boolean in `notificationPreferencesStore`

#### 2.3.2 Match Result Notification

- **Type:** Toggle (ON/OFF)
- **Description:** Notifies user when a match involving selected teams has finished
- **Timing:** When match result is final
- **Default:** `true` (enabled)
- **Storage:** Boolean in `notificationPreferencesStore`

**Behavior:**
- Both toggles are independent
- Both respect the global push switch (disabled when global is OFF)
- Both only apply to selected favorite teams
- Backend should not send disabled notification types

---

### 2.4 UI/UX Structure

**Navigation Path:** Settings → Notifications Section → Team Notifications

**Layout Structure:**
```
Notifications Section
├── Notification Status (OS permission status indicator)
├── Push Notifications [Global Toggle]
├── Team Notifications (sub-section)
│   ├── Favorite Teams [Multi-select list/modal]
│   ├── Match Start Reminder [Toggle]
│   └── Match Result Notification [Toggle]
└── (Existing festival notifications, if any)
```

**Design Guidelines:**
- Use existing Settings screen styling (`#0A3652` background, `#EA5178` accents)
- Match existing toggle styling (see `SettingsScreen.tsx`)
- No sound/vibration toggles needed (use system defaults)
- No per-match toggles
- Keep UI simple and uncluttered
- Show clear visual indication of selected teams

**Visual States:**
- Global toggle OFF → All team notification toggles disabled (grayed out)
- OS permission denied → Show message with link to system settings
- No teams selected → Show hint/message that no notifications will be sent

---

## 3. Implementation Details

### 3.1 Store Updates

**File:** `src/stores/notificationPreferencesStore.ts`

**Add to interface:**
```typescript
interface NotificationPreferencesStore {
  // Existing fields (keep for backward compatibility)
  favoriteArtistsNotifications: boolean;
  importantFestivalNotifications: boolean;
  
  // New fields for team notifications
  pushNotificationsEnabled: boolean; // Global master switch
  favoriteTeamIds: number[]; // Array of selected team IDs
  matchStartReminderEnabled: boolean;
  matchResultNotificationEnabled: boolean;
  
  // Setters
  setPushNotificationsEnabled: (enabled: boolean) => void;
  setFavoriteTeamIds: (teamIds: number[]) => void;
  setMatchStartReminderEnabled: (enabled: boolean) => void;
  setMatchResultNotificationEnabled: (enabled: boolean) => void;
}
```

**Default Values:**
- `pushNotificationsEnabled: true`
- `favoriteTeamIds: []` (empty array - user must select teams)
- `matchStartReminderEnabled: true`
- `matchResultNotificationEnabled: true`

**Migration:** Existing store uses persistence, so defaults will apply to new users. Existing users will get defaults on first app update (acceptable behavior).

---

### 3.2 Settings Screen Updates

**File:** `src/screens/SettingsScreen.tsx`

**Changes Required:**

1. **Add Team Notifications Section:**
   - Create new section after existing notification toggles
   - Add global "Push Notifications" toggle (if not already present as master control)
   - Add "Favorite Teams" multi-select component
   - Add "Match Start Reminder" toggle
   - Add "Match Result Notification" toggle

2. **Team Selection UI:**
   - Option A: Modal with team list (recommended for cleaner UX)
   - Option B: Expandable list in settings
   - Option C: Navigate to dedicated screen
   - Show team names with checkboxes/selection indicators
   - Consider grouping by category (seniors/youth)

3. **Permission Handling:**
   - Check OS-level notification permission status
   - Show status indicator (already exists, reuse)
   - When global toggle is enabled, ensure permission is granted
   - If permission denied, show message and link to system settings

4. **State Management:**
   - Use `useNotificationPreferencesStore()` hook
   - Connect toggles to store values
   - Handle team selection updates

---

### 3.3 Notification Service Integration

**File:** `src/services/notifications.ts`

**New/Updated Methods:**

1. **Register Device Token with Backend:**
   - When user enables notifications and selects teams, register FCM token with backend
   - Include user preferences: `favoriteTeamIds`, `matchStartReminderEnabled`, `matchResultNotificationEnabled`
   - Backend endpoint: TBD (to be specified by backend team)

2. **Update Preferences on Backend:**
   - When user changes preferences, sync with backend
   - Method: `updateNotificationPreferences(preferences: NotificationPreferences)`
   - Call after user changes any notification setting

3. **Token Registration Trigger:**
   - Register token on app start/login if notifications are enabled
   - Re-register when preferences change
   - Unregister token when global toggle is disabled

**Implementation Pattern:**
```typescript
async registerDeviceToken(
  token: string,
  preferences: {
    favoriteTeamIds: number[];
    matchStartReminderEnabled: boolean;
    matchResultNotificationEnabled: boolean;
  }
): Promise<void> {
  // API call to backend to register token with preferences
  // Endpoint TBD
}
```

---

### 3.4 API Integration

**Backend Endpoints (to be confirmed):**

1. **Register Device Token:**
   - `POST /api/notifications/register`
   - Payload: `{ token: string, favoriteTeamIds: number[], matchStartReminderEnabled: boolean, matchResultNotificationEnabled: boolean }`

2. **Update Preferences:**
   - `PUT /api/notifications/preferences`
   - Payload: Same as above

3. **Unregister Token:**
   - `DELETE /api/notifications/token/{token}` or include in update with empty teamIds

**Note:** These endpoints need to be implemented by backend team. Frontend should be prepared to call these endpoints when ready.

---

### 3.5 Component Structure

**Recommended Component Structure:**

```
src/
├── screens/
│   └── SettingsScreen.tsx (updated)
├── components/
│   └── TeamSelectionModal.tsx (new, optional)
│   └── TeamSelectionList.tsx (new, optional)
├── stores/
│   └── notificationPreferencesStore.ts (updated)
├── services/
│   └── notifications.ts (updated)
└── hooks/
    └── useNotificationPreferences.ts (new, optional helper hook)
```

**Team Selection Component Options:**

1. **Modal Approach (Recommended):**
   - `TeamSelectionModal.tsx` - Full-screen or bottom sheet modal
   - Triggered from Settings screen
   - Shows list of teams with checkboxes
   - Save/Cancel buttons
   - Closes and updates store on Save

2. **Inline Approach:**
   - Expandable section in Settings
   - Shows selected teams as chips/tags
   - Expand to show full list for selection

Choose based on team count and UX preferences.

---

## 4. Functional Behavior

### 4.1 Notification Flow

1. **App Start/Login:**
   - Check if `pushNotificationsEnabled === true`
   - Check OS-level permission
   - If both true: Get FCM token and register with backend (include preferences)
   - If false or permission denied: Skip registration

2. **User Enables Notifications:**
   - User toggles "Push Notifications" ON
   - Check OS permission → Request if needed
   - If permission granted: Get FCM token, register with backend
   - If permission denied: Show message, disable toggle

3. **User Selects Teams:**
   - User opens team selection
   - Selects/deselects teams
   - Saves selection → Updates store
   - Syncs preferences with backend (if token registered)

4. **User Changes Notification Types:**
   - User toggles "Match Start Reminder" or "Match Result Notification"
   - Updates store
   - Syncs preferences with backend

5. **Backend Sends Notification:**
   - Backend checks user preferences
   - Only sends if:
     - `pushNotificationsEnabled === true`
     - Team ID is in `favoriteTeamIds`
     - Corresponding notification type is enabled
   - Notification payload includes match data for navigation

---

### 4.2 Edge Cases & Error Handling

#### 4.2.1 OS Permission Denied

**Scenario:** User denies notification permission at OS level.

**Behavior:**
- Show status indicator: "Push permission is disabled in system settings"
- Disable global toggle (or keep enabled but show warning)
- Show button/link to open system settings
- Don't register token with backend

**Implementation:**
- Check permission status on Settings screen load
- Check on focus (user may return from settings)
- Use existing `checkNotificationPermission()` pattern from SettingsScreen

#### 4.2.2 No Teams Selected

**Scenario:** User enables notifications but selects no teams.

**Behavior:**
- Allow this state (valid - user may want only general notifications later)
- Show hint: "Select teams to receive match notifications"
- Backend should not send team-specific notifications
- Backend may send general notifications if implemented

#### 4.2.3 All Teams Deselected

**Scenario:** User deselects all teams.

**Behavior:**
- Same as "No Teams Selected"
- Clear selection → Update store → Sync with backend
- Backend stops sending team notifications

#### 4.2.4 Global Toggle Disabled

**Scenario:** User disables global push toggle.

**Behavior:**
- All team notification toggles visually disabled
- Store values preserved (but not used)
- Unregister token from backend (or mark as disabled)
- No notifications sent

#### 4.2.5 Network Errors

**Scenario:** Backend sync fails when updating preferences.

**Behavior:**
- Store preference locally (already persisted)
- Queue sync for retry
- Show error message to user (optional, non-blocking)
- Retry on next app start or network reconnect

#### 4.2.6 Token Registration Failure

**Scenario:** Backend registration fails.

**Behavior:**
- Log error (use Crashlytics if available)
- Show non-blocking error message
- Retry on next app start
- Local preferences still saved

---

## 5. Data Flow

### 5.1 User Preference Changes

```
User Action (Toggle/Select)
  ↓
Update notificationPreferencesStore (Zustand)
  ↓
Store persisted to AsyncStorage (via persist middleware)
  ↓
Check: pushNotificationsEnabled && OS permission
  ↓
If true: Get FCM token → Register/Update with backend
  ↓
Backend stores preferences → Filters notifications accordingly
```

### 5.2 Notification Reception

```
Backend checks user preferences
  ↓
Validates: enabled && teamId in favoriteTeamIds && type enabled
  ↓
Sends FCM notification to device token
  ↓
Firebase delivers to device
  ↓
App receives notification (foreground/background/quit)
  ↓
Notification displayed to user
  ↓
User taps notification → Navigate to match detail (existing flow)
```

---

## 6. Testing Requirements

### 6.1 Unit Tests

- `notificationPreferencesStore` - Test all setters, persistence
- Team selection logic - Add/remove teams, validation
- Preference sync logic - API calls, error handling

### 6.2 Integration Tests

- Settings screen - Toggle interactions, permission handling
- Notification service - Token registration, preference sync
- End-to-end: Enable notifications → Select teams → Verify backend receives preferences

### 6.3 Manual Testing Checklist

- [ ] Global toggle enables/disables all notifications
- [ ] Team selection modal/list works correctly
- [ ] Selected teams persist after app restart
- [ ] Notification type toggles work independently
- [ ] OS permission denied state handled correctly
- [ ] System settings link opens correctly (iOS/Android)
- [ ] Token registered with backend when enabled
- [ ] Preferences synced to backend on change
- [ ] No notifications received when global toggle OFF
- [ ] No notifications received for unselected teams
- [ ] No notifications received for disabled types
- [ ] Notifications received correctly for selected teams and enabled types

---

## 7. Success Criteria

The feature is complete when:

✅ Users see push notification settings in the app, including a master switch  
✅ Users can select multiple favorite teams from the teams list  
✅ Users can toggle "Match Start Reminder" and "Match Result Notification" separately  
✅ All preferences are persisted locally and synced with backend  
✅ Notifications are dispatched only for selected teams and enabled types  
✅ System doesn't show redundant toggles (sound/vibration)  
✅ OS permission status is properly handled and displayed  
✅ UI matches existing Settings screen design patterns  
✅ Edge cases are handled gracefully (no crashes, clear error states)

---

## 8. Backend Requirements (Coordination Needed)

The backend team needs to implement:

1. **Device Token Registration Endpoint:**
   - `POST /api/notifications/register`
   - Store: `token`, `favoriteTeamIds`, `matchStartReminderEnabled`, `matchResultNotificationEnabled`
   - User identification method TBD (user ID, device ID, etc.)

2. **Preference Update Endpoint:**
   - `PUT /api/notifications/preferences`
   - Update preferences for existing token

3. **Notification Filtering Logic:**
   - When sending match start notifications:
     - Check if user has `matchStartReminderEnabled === true`
     - Check if match team ID is in user's `favoriteTeamIds`
     - Only send if both conditions met
   - When sending match result notifications:
     - Check if user has `matchResultNotificationEnabled === true`
     - Check if match team ID is in user's `favoriteTeamIds`
     - Only send if both conditions met

4. **Notification Payload Format:**
   - Include match data for navigation (matchId, teamId, etc.)
   - Follow existing notification data structure (if any)

**Note:** Frontend implementation can proceed with mock/stub endpoints. Backend implementation can follow after frontend is ready for testing.

---

## 9. Implementation Notes

### 9.1 Existing Code References

- **Settings Screen:** `src/screens/SettingsScreen.tsx` (lines 152-223 show notification section pattern)
- **Store Pattern:** `src/stores/notificationPreferencesStore.ts` (Zustand with persistence)
- **Teams API:** `src/api/footballEndpoints.ts` (line 122: `footballApi.getTeams()`)
- **Notification Service:** `src/services/notifications.ts` (existing FCM integration)
- **Permission Check:** `SettingsScreen.tsx` (lines 61-69: `checkNotificationPermission()`)

### 9.2 Dependencies

All required dependencies are already installed:
- `@react-native-firebase/messaging` - FCM integration
- `expo-notifications` - Notification API
- `zustand` - State management
- `@react-native-async-storage/async-storage` - Persistence

### 9.3 Code Style

- Follow existing TypeScript patterns
- Use existing styling constants/colors
- Match component structure and naming conventions
- Add JSDoc comments for public methods
- Use existing error handling patterns (Crashlytics integration)

---

## 10. Open Questions / Decisions Needed

1. **User Identification:** How does backend identify users? (User ID, device ID, anonymous?)
2. **Backend Endpoints:** Exact endpoint URLs and request/response formats
3. **Team Selection UI:** Modal vs. inline vs. dedicated screen? (Recommendation: Modal)
4. **Category Grouping:** Group teams by category (seniors/youth) in selection UI?
5. **Notification Timing:** Is 15 minutes before match fixed or configurable?
6. **Error Handling:** How to handle backend sync failures? (Queue for retry? Show error?)
7. **Migration:** How to handle existing users who don't have new preferences set? (Defaults are acceptable)

---

## 11. Future Enhancements (Out of Scope)

- Per-match notification toggles
- Custom notification timing (user-configurable minutes before match)
- Sound/vibration preferences
- Notification grouping/channels
- Quiet hours / Do Not Disturb
- Notification history/log

---

## 12. Documentation Updates Needed

- Update user-facing documentation (if any) with new notification settings
- Update API documentation (backend team)
- Update onboarding/tutorial (if app has one) to mention notification setup

---

**Document Version:** 1.0  
**Last Updated:** [Current Date]  
**Author:** [Your Name]  
**Review Status:** Ready for Engineering Review
