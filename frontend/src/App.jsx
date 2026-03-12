import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import StudentsPage from "./pages/StudentsPage";
import AttendancePage from "./pages/AttendancePage";
import LiveSessionPage from "./pages/LiveSessionPage";
import SubjectsPage from "./pages/SubjectsPage";

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/signup" element={user ? <Navigate to="/" replace /> : <SignupPage />} />

      {/* Teacher-only routes */}
      <Route element={<ProtectedRoute allowedRole="teacher" />}>
        <Route path="/" element={<TeacherDashboard />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/subjects" element={<SubjectsPage />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/live" element={<LiveSessionPage />} />
      </Route>

      {/* Student-only routes */}
      <Route element={<ProtectedRoute allowedRole="student" />}>
        <Route path="/my-attendance" element={<StudentDashboard />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
    </Routes>
  );
}
