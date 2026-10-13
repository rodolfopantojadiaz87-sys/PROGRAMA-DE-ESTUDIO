import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { DashboardPage } from "../pages/DashboardPage";
import { PresentationPage } from "../pages/PresentationPage";
import { RoutePlaceholder } from "../pages/RoutePlaceholder";
import { SermonFormPage } from "../pages/SermonFormPage";
import { SermonsPage } from "../pages/SermonsPage";
import { StudiesPage } from "../pages/StudiesPage";
import { StudyFormPage } from "../pages/StudyFormPage";
import { SeriesPage } from "../pages/SeriesPage";
import { SeriesFormPage } from "../pages/SeriesFormPage";
import { LibraryPage } from "../pages/LibraryPage";
import { WelcomePage } from "../pages/WelcomePage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <WelcomePage />,
  },
  {
    element: <AppLayout />,
    children: [
      { path: "/dashboard", element: <DashboardPage /> },
      { path: "/sermons", element: <SermonsPage /> },
      { path: "/sermons/new", element: <SermonFormPage /> },
      { path: "/sermons/:id/edit", element: <SermonFormPage /> },
      { path: "/studies", element: <StudiesPage /> },
      { path: "/studies/new", element: <StudyFormPage /> },
      { path: "/studies/:id/edit", element: <StudyFormPage /> },
      { path: "/series", element: <SeriesPage /> },
      { path: "/series/new", element: <SeriesFormPage /> },
      { path: "/series/:id/edit", element: <SeriesFormPage /> },
      { path: "/discipleship", element: <RoutePlaceholder title="Discipulado" /> },
      { path: "/library", element: <LibraryPage /> },
      { path: "/settings", element: <RoutePlaceholder title="Configuración" /> },
    ],
  },
  { path: "/presentation/:id", element: <PresentationPage /> },
  { path: "*", element: <Navigate to="/" replace /> },
]);
