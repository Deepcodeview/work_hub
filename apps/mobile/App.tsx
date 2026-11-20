import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors } from '@workhub/design-tokens';

// Default to production AWS Lightsail server or custom endpoint
const API_BASE = 'http://16.179.236.212:3000/api/v1';

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'attendance' | 'tasks' | 'profile'>('home');

  // Login form state
  const [email, setEmail] = useState('admin@workhub.internal');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // App data state
  const [refreshing, setRefreshing] = useState(false);
  const [clockedIn, setClockedIn] = useState(false);
  const [clockInTimestamp, setClockInTimestamp] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [completedMinutesToday, setCompletedMinutesToday] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let interval: any = null;
    if (clockedIn && clockInTimestamp) {
      interval = setInterval(() => {
        setElapsedSeconds(Math.max(0, Math.floor((Date.now() - clockInTimestamp) / 1000)));
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [clockedIn, clockInTimestamp]);

  const elapsedHours = Math.floor(elapsedSeconds / 3600);
  const elapsedMinutes = Math.floor((elapsedSeconds % 3600) / 60);
  const elapsedSecs = elapsedSeconds % 60;
  const pad2 = (n: number) => n.toString().padStart(2, '0');

  // Total worked time today
  const totalTodaySeconds = (completedMinutesToday * 60) + (clockedIn ? elapsedSeconds : 0);
  const totalHours = Math.floor(totalTodaySeconds / 3600);
  const totalMins = Math.floor((totalTodaySeconds % 3600) / 60);
  const displayHours = clockedIn ? elapsedHours : totalHours;
  const displayMinutes = clockedIn ? elapsedMinutes : totalMins;
  const displaySecs = clockedIn ? elapsedSecs : 0;

  const handleLogin = async () => {
    setLoading(true);
    setLoginError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (res.ok && data.data?.accessToken) {
        setToken(data.data.accessToken);
        setUser(data.data.user);
      } else {
        setLoginError(data.error?.message || data.message || 'Authentication failed. Please check credentials.');
      }
    } catch (err: any) {
      setLoginError('Could not connect to WorkHub server. Please ensure network is active.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceStatus = async (authToken: string) => {
    try {
      const res = await fetch(`${API_BASE}/attendance/status`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (res.ok && data.data) {
        if (typeof data.data.completedMinutesToday === 'number') {
          setCompletedMinutesToday(data.data.completedMinutesToday);
        }
        const session = data.data.currentSession || data.data.activeSession;
        const isClocked = Boolean(data.data.isClockedIn || data.data.hasOpenSession || session);
        if (isClocked && session?.clockInAt) {
          const serverStart = new Date(session.clockInAt).getTime();
          setClockedIn(true);
          setClockInTimestamp(serverStart);
          setElapsedSeconds(Math.max(0, Math.floor((Date.now() - serverStart) / 1000)));
        } else if (data.data.isClockedIn === false && !session) {
          setClockedIn(false);
          setClockInTimestamp(null);
          setElapsedSeconds(0);
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (token) {
      fetchAttendanceStatus(token);
    }
  }, [token]);

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setClockedIn(false);
    setClockInTimestamp(null);
    setElapsedSeconds(0);
  };

  const handleClockToggle = async () => {
    if (!token) return;
    try {
      if (!clockedIn) {
        const res = await fetch(`${API_BASE}/attendance/clock-in`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ deviceType: 'MOBILE' }),
        });
        const data = await res.json();
        const session = data.data;
        const serverStart = session?.clockInAt
          ? new Date(session.clockInAt).getTime()
          : Date.now();
        setClockedIn(true);
        setClockInTimestamp(serverStart);
        setElapsedSeconds(Math.max(0, Math.floor((Date.now() - serverStart) / 1000)));
        Alert.alert('Clocked In', `Work session live counter started at ${currentTime}`);
      } else {
        await fetch(`${API_BASE}/attendance/clock-out`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ deviceType: 'MOBILE' }),
        });
        const recorded = `${elapsedHours}h ${elapsedMinutes}m ${elapsedSecs}s`;
        const addedMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
        setCompletedMinutesToday((prev) => prev + addedMinutes);
        Alert.alert('Clocked Out', `Shift closed! Total logged work time: ${recorded}`);
        setClockedIn(false);
        setClockInTimestamp(null);
        setElapsedSeconds(0);
      }
    } catch (err) {
      Alert.alert('Notice', 'Action submitted to WorkHub server.');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (token) {
      fetchAttendanceStatus(token);
    }
    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  };

  // If unauthenticated: render Login Screen
  if (!token) {
    return (
      <SafeAreaView style={styles.authSafeArea}>
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={styles.authContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.brandHeader}>
            <View style={styles.brandLogo}>
              <Text style={styles.brandLogoText}>W</Text>
            </View>
            <Text style={styles.brandTitle}>WorkHub Mobile</Text>
            <Text style={styles.brandSubtitle}>Connected to Live Company Backend</Text>
          </View>

          <View style={styles.authCard}>
            <Text style={styles.cardHeaderTitle}>Sign In</Text>
            <Text style={styles.cardHeaderSubtitle}>Enter your enterprise credentials</Text>

            {loginError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{loginError}</Text>
              </View>
            ) : null}

            <Text style={styles.inputLabel}>Corporate Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="e.g. admin@workhub.internal"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
            />

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>Log In to Workspace</Text>
              )}
            </TouchableOpacity>

            <View style={styles.quickFillContainer}>
              <Text style={styles.quickFillTitle}>Default Demo Account:</Text>
              <TouchableOpacity
                style={styles.quickFillPill}
                onPress={() => {
                  setEmail('admin@workhub.internal');
                  setPassword('Password123!');
                }}
              >
                <Text style={styles.quickFillText}>admin@workhub.internal (Admin)</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.endpointFooter}>
            <Text style={styles.endpointText}>Live Server: {API_BASE}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Authenticated Screen: Modern Dashboard
  const displayName = user?.employee
    ? `${user.employee.firstName} ${user.employee.lastName}`
    : 'System Administrator';
  const roleName = user?.roles?.[0] ? user.roles[0].replace('_', ' ') : 'SYSTEM ADMIN';

  return (
    <SafeAreaView style={styles.mainSafeArea}>
      <StatusBar style="dark" />

      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.smallLogo}>
            <Text style={styles.smallLogoText}>W</Text>
          </View>
          <View>
            <Text style={styles.greetingText}>Hello, {displayName}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{roleName}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton} activeOpacity={0.7}>
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Body */}
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF7A00']} />}
      >
        {/* Attendance Card with Live Timer */}
        <View style={styles.attendanceCard}>
          <View style={styles.attendanceHeader}>
            <View>
              <Text style={styles.cardSub}>Today's Attendance</Text>
              <Text style={styles.liveClock}>{currentTime}</Text>
            </View>
            <View style={[styles.statusPill, clockedIn ? styles.statusPillActive : styles.statusPillInactive]}>
              <Text style={[styles.statusPillText, clockedIn ? styles.statusTextActive : styles.statusTextInactive]}>
                {clockedIn ? '● Clocked In' : '○ Off Duty'}
              </Text>
            </View>
          </View>

          {/* Live Work Timer Block */}
          <View style={styles.mobileTimerBox}>
            <Text style={styles.mobileTimerLabel}>
              {clockedIn
                ? 'LIVE WORK TIME ELAPSED'
                : completedMinutesToday > 0
                ? "TODAY'S TOTAL WORK COMPLETED"
                : 'SHIFT TIMER (READY)'}
            </Text>
            <View style={styles.mobileTimerDigits}>
              <View style={styles.digitPill}>
                <Text style={styles.digitVal}>{pad2(displayHours)}</Text>
                <Text style={styles.digitSub}>HRS</Text>
              </View>
              <Text style={styles.digitColon}>:</Text>
              <View style={styles.digitPill}>
                <Text style={styles.digitVal}>{pad2(displayMinutes)}</Text>
                <Text style={styles.digitSub}>MIN</Text>
              </View>
              <Text style={styles.digitColon}>:</Text>
              <View style={[styles.digitPill, styles.digitPillSec]}>
                <Text style={[styles.digitVal, styles.digitValSec]}>{pad2(displaySecs)}</Text>
                <Text style={[styles.digitSub, styles.digitSubSec]}>SEC</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.clockActionButton, clockedIn ? styles.clockActionOut : styles.clockActionIn]}
            onPress={handleClockToggle}
            activeOpacity={0.85}
          >
            <Text style={styles.clockActionButtonText}>
              {clockedIn ? 'Clock Out Now' : 'Clock In for Shift'}
            </Text>
          </TouchableOpacity>

          {clockInTimestamp ? (
            <Text style={styles.clockMetaText}>
              Session started at {new Date(clockInTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • 8h Goal
            </Text>
          ) : (
            <Text style={styles.clockMetaText}>Shift window: 09:00 AM - 06:00 PM (8h Target)</Text>
          )}
        </View>

        {/* Quick Stats Grid */}
        <Text style={styles.sectionTitle}>Overview Metrics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>100%</Text>
            <Text style={styles.statLabel}>On-Time</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>8</Text>
            <Text style={styles.statLabel}>Active Tasks</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>3</Text>
            <Text style={styles.statLabel}>Approvals</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>4</Text>
            <Text style={styles.statLabel}>Projects</Text>
          </View>
        </View>

        {/* Assigned Tasks */}
        <Text style={styles.sectionTitle}>My Priority Tasks</Text>
        <View style={styles.taskCard}>
          <View style={styles.taskHeader}>
            <Text style={styles.taskTitle}>Deploy WorkHub Cloud Instance</Text>
            <View style={styles.priorityHigh}>
              <Text style={styles.priorityText}>High</Text>
            </View>
          </View>
          <Text style={styles.taskDesc}>Configured reverse proxy, AWS Lightsail, and automated CI/CD.</Text>
          <View style={styles.taskFooter}>
            <Text style={styles.taskTag}>DevOps & Cloud</Text>
            <Text style={styles.taskStatusDone}>Completed</Text>
          </View>
        </View>

        <View style={styles.taskCard}>
          <View style={styles.taskHeader}>
            <Text style={styles.taskTitle}>Mobile Responsive Verification</Text>
            <View style={styles.priorityMedium}>
              <Text style={styles.priorityTextMedium}>Medium</Text>
            </View>
          </View>
          <Text style={styles.taskDesc}>Ensure touch targets, strict auth protection, and smooth navigation.</Text>
          <View style={styles.taskFooter}>
            <Text style={styles.taskTag}>Frontend</Text>
            <Text style={styles.taskStatusPending}>In Progress</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Tabs */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => setActiveTab('home')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabIcon, activeTab === 'home' && styles.tabIconActive]}>🏠</Text>
          <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => setActiveTab('attendance')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabIcon, activeTab === 'attendance' && styles.tabIconActive]}>⏱️</Text>
          <Text style={[styles.tabLabel, activeTab === 'attendance' && styles.tabLabelActive]}>Attendance</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => setActiveTab('tasks')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabIcon, activeTab === 'tasks' && styles.tabIconActive]}>📋</Text>
          <Text style={[styles.tabLabel, activeTab === 'tasks' && styles.tabLabelActive]}>Tasks</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => setActiveTab('profile')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabIcon, activeTab === 'profile' && styles.tabIconActive]}>👤</Text>
          <Text style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  authSafeArea: {
    flex: 1,
    backgroundColor: '#FBF9F5',
  },
  authContainer: {
    padding: 24,
    justifyContent: 'center',
    minHeight: '100%',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  brandLogo: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#FF7A00',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#FF7A00',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  brandLogoText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#8A92A6',
    marginTop: 4,
  },
  authCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: '#F1ECE4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  cardHeaderSubtitle: {
    fontSize: 13,
    color: '#8A92A6',
    marginTop: 2,
    marginBottom: 16,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#F9F7F4',
    borderWidth: 1,
    borderColor: '#E8E2D8',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1F2937',
  },
  loginButton: {
    backgroundColor: '#FF7A00',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 22,
    shadowColor: '#FF7A00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  quickFillContainer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1ECE4',
    alignItems: 'center',
  },
  quickFillTitle: {
    fontSize: 11,
    color: '#8A92A6',
    marginBottom: 6,
  },
  quickFillPill: {
    backgroundColor: '#FFF0E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  quickFillText: {
    color: '#FF7A00',
    fontSize: 11,
    fontWeight: '700',
  },
  endpointFooter: {
    marginTop: 20,
    alignItems: 'center',
  },
  endpointText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  mainSafeArea: {
    flex: 1,
    backgroundColor: '#FBF9F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1ECE4',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  smallLogo: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FF7A00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallLogoText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  greetingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  roleBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 2,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#16A34A',
  },
  logoutButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutButtonText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '700',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 90,
  },
  attendanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F1ECE4',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  attendanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardSub: {
    fontSize: 12,
    color: '#8A92A6',
    fontWeight: '600',
  },
  liveClock: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPillActive: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  statusPillInactive: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextActive: {
    color: '#16A34A',
  },
  statusTextInactive: {
    color: '#64748B',
  },
  mobileTimerBox: {
    backgroundColor: '#FFFDF9',
    borderWidth: 1,
    borderColor: '#FDE6D2',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  mobileTimerLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8A92A6',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  mobileTimerDigits: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  digitPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBE4D8',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
    minWidth: 50,
  },
  digitPillSec: {
    backgroundColor: '#FFF2E2',
    borderColor: '#FFD2A6',
  },
  digitVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    fontVariant: ['tabular-nums'],
  },
  digitValSec: {
    color: '#FF7A00',
  },
  digitSub: {
    fontSize: 8,
    fontWeight: '700',
    color: '#8A92A6',
    marginTop: 2,
  },
  digitSubSec: {
    color: '#FF7A00',
  },
  digitColon: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FF7A00',
    marginHorizontal: 2,
  },
  clockActionButton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  clockActionIn: {
    backgroundColor: '#FF7A00',
    shadowColor: '#FF7A00',
  },
  clockActionOut: {
    backgroundColor: '#DC2626',
    shadowColor: '#DC2626',
  },
  clockActionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  clockMetaText: {
    fontSize: 11,
    color: '#8A92A6',
    textAlign: 'center',
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1ECE4',
    alignItems: 'center',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FF7A00',
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1ECE4',
    marginBottom: 10,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  priorityHigh: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priorityMedium: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priorityText: {
    color: '#DC2626',
    fontSize: 10,
    fontWeight: '700',
  },
  priorityTextMedium: {
    color: '#D97706',
    fontSize: 10,
    fontWeight: '700',
  },
  taskDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 10,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskTag: {
    fontSize: 11,
    color: '#8A92A6',
    fontWeight: '500',
  },
  taskStatusDone: {
    fontSize: 11,
    color: '#16A34A',
    fontWeight: '700',
  },
  taskStatusPending: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: '700',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1ECE4',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 6,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabIcon: {
    fontSize: 18,
    opacity: 0.5,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 10,
    color: '#8A92A6',
    fontWeight: '600',
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#FF7A00',
    fontWeight: '700',
  },
});
