import { Suspense, lazy, useEffect } from 'react'
import type { CSSProperties } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Sidebar } from './components/Shell'
import { TooltipLayer } from './components/Tooltip'
import { useDemo } from './lib/demo'
import { useFitToWidth } from './lib/useFitToWidth'
import AssignmentSetup from './screens/professor/AssignmentSetup'
import SubmissionsReview from './screens/professor/SubmissionsReview'
import CaseBrief from './screens/student/CaseBrief'
import ConjointResults from './screens/student/ConjointResults'
import ConjointSetup from './screens/student/ConjointSetup'
import CourseHome from './screens/student/CourseHome'
import Interpretation from './screens/student/Interpretation'
import Positioning from './screens/student/Positioning'
import RunHistory from './screens/student/RunHistory'
import SegmentationResults from './screens/student/SegmentationResults'
import SegmentationSetup from './screens/student/SegmentationSetup'

// The screens of the further modules are loaded when they are first opened, so that the demo starts quickly.
const Allocation = lazy(() => import('./screens/modules/Allocation'))
const ForecastingExisting = lazy(() => import('./screens/modules/ForecastingExisting'))
const ForecastingNew = lazy(() => import('./screens/modules/ForecastingNew'))
const GeMatrix = lazy(() => import('./screens/modules/GeMatrix'))
const LifetimeValue = lazy(() => import('./screens/modules/LifetimeValue'))
const ModuleSetup = lazy(() => import('./screens/modules/ModuleSetup'))
const Network = lazy(() => import('./screens/modules/Network'))
const PanelRegression = lazy(() => import('./screens/modules/PanelRegression'))
const PricingConjoint = lazy(() => import('./screens/modules/PricingConjoint'))
const PricingTests = lazy(() => import('./screens/modules/PricingTests'))
const Sentiment = lazy(() => import('./screens/modules/Sentiment'))
const Targeting = lazy(() => import('./screens/modules/Targeting'))

/** Every screen starts at the top, as a new page would. */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

/** "Conjoint analysis" in the sidebar: the setup until the scenarios have been run, the results after. */
function ConjointEntry() {
  const { conjointRun } = useDemo()
  return <Navigate to={conjointRun ? '/conjoint/results' : '/conjoint/setup'} replace />
}

export default function App() {
  const scale = useFitToWidth()
  const { pathname } = useLocation()
  return (
    <>
      {/* --app-h is the full window height, measured inside the scaled layout. */}
      <div
        className="grid min-h-[var(--app-h)] grid-cols-[248px_minmax(0,1fr)]"
        style={{ zoom: scale, '--app-h': `calc(100vh / ${scale})` } as CSSProperties}
      >
        <ScrollToTop />
        <Sidebar />
        {/* A new screen fades in: the key makes the fade start again whenever the path changes. */}
        <main key={pathname} className="screen-in flex min-w-0 flex-col">
          <Suspense fallback={null}>
            <Routes>
              {/* Student */}
              <Route path="/" element={<CourseHome />} />
              <Route path="/case" element={<CaseBrief />} />
              <Route path="/conjoint" element={<ConjointEntry />} />
              <Route path="/conjoint/setup" element={<ConjointSetup />} />
              <Route path="/conjoint/results" element={<ConjointResults />} />
              <Route path="/runs" element={<RunHistory />} />
              <Route path="/interpretation" element={<Interpretation />} />
              {/* Priority 2, view-only */}
              <Route path="/segmentation" element={<Navigate to="/segmentation/results" replace />} />
              <Route path="/segmentation/setup" element={<SegmentationSetup />} />
              <Route path="/segmentation/results" element={<SegmentationResults />} />
              <Route path="/positioning" element={<Positioning />} />
              {/* The further modules: results screens, and one setup screen for all of them */}
              <Route path="/forecasting" element={<Navigate to="/forecasting/new-product" replace />} />
              <Route path="/forecasting/new-product" element={<ForecastingNew />} />
              <Route path="/forecasting/existing-product" element={<ForecastingExisting />} />
              <Route path="/pricing" element={<Navigate to="/pricing/price-tests" replace />} />
              <Route path="/pricing/price-tests" element={<PricingTests />} />
              <Route path="/pricing/from-conjoint" element={<PricingConjoint />} />
              <Route path="/targeting" element={<Targeting />} />
              <Route path="/lifetime-value" element={<LifetimeValue />} />
              <Route path="/allocation" element={<Allocation />} />
              <Route path="/ge-matrix" element={<GeMatrix />} />
              <Route path="/panel" element={<PanelRegression />} />
              <Route path="/sentiment" element={<Sentiment />} />
              <Route path="/network" element={<Network />} />
              <Route path="/:module/setup/:runId" element={<ModuleSetup />} />
              {/* Professor */}
              <Route path="/professor" element={<Navigate to="/professor/assignment" replace />} />
              <Route path="/professor/assignment" element={<AssignmentSetup />} />
              <Route path="/professor/submissions" element={<SubmissionsReview />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
      {/* The tooltip sits outside the scaled area: it is placed in window coordinates. */}
      <TooltipLayer />
    </>
  )
}
