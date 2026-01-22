export const AnalyticsEvent = {
  APP_OPEN: 'app_open',
  SCREEN_VIEW: 'screen_view',
  MATCHES_TAB_SWITCH: 'matches_tab_switch',
  MATCHES_FILTER_APPLY: 'matches_filter_apply',
  MATCH_OPEN: 'match_open',
  STANDINGS_VIEW: 'standings_view',
  STANDINGS_FILTER_APPLY: 'standings_filter_apply',
  NEWS_OPEN: 'news_open',
  NEWS_LOAD_MORE: 'news_load_more',
  NEWS_REFRESH: 'news_refresh',
  NOTIFICATIONS_LIST_VIEW: 'notifications_list_view',
  OFFLINE_BLOCKED_SHOWN: 'offline_blocked_shown',
  OFFLINE_RETRY_CLICKED: 'offline_retry_clicked',
  OFFLINE_OPEN_SETTINGS: 'offline_open_settings',
  UPDATE_PROMPT_SHOWN: 'update_prompt_shown',
  UPDATE_ACCEPTED: 'update_accepted',
  UPDATE_LATER: 'update_later',
  PUSH_PERMISSION_PROMPT_SHOWN: 'push_permission_prompt_shown',
  PUSH_PERMISSION_RESULT: 'push_permission_result',
} as const;

export type AnalyticsEventName = typeof AnalyticsEvent[keyof typeof AnalyticsEvent];
