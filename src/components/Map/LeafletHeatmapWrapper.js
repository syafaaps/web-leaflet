// components/Map/LeafletHeatmapWrapper.js
// Wrapper dynamic import khusus untuk choropleth map
import dynamic from 'next/dynamic';

const DynamicHeatmapMap = dynamic(() => import('./LeafletHeatmapMap'), {
  ssr: false,
  loading: () => (
    <div style={{
      height: '100%', width: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f0f4f0', color: '#4a6358', fontSize: '13px',
      fontFamily: 'DM Sans, sans-serif',
    }}>
      Memuat peta…
    </div>
  ),
});

// Teruskan semua props ke komponen choropleth
const LeafletHeatmapWrapper = (props) => (
  <div style={{ height: '100%', width: '100%' }}>
    <DynamicHeatmapMap {...props} />
  </div>
);

export default LeafletHeatmapWrapper;