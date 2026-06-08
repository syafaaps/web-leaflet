// components/Map/LeafletMap.js
import dynamic from 'next/dynamic';

const DynamicMap = dynamic(() => import('./LeafletDynamicMap'), {
  ssr: false,
  loading: () => (
    <div style={{
      height: '100%', width: '100%', minHeight: '420px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f4f7f4', color: '#4a6358', fontSize: '13px',
      fontFamily: 'DM Sans, sans-serif', borderRadius: '12px'
    }}>
      Memuat peta…
    </div>
  ),
});

// ⚠️ Spread {...props} wajib ada — tanpa ini pasarData tidak sampai ke LeafletDynamicMap
const Map = (props) => (
  <div style={{ height: '460px', width: '100%' }}>
    <DynamicMap {...props} />
  </div>
);

export default Map;
// import dynamic from 'next/dynamic';

// const DynamicMap = dynamic(() => import('./LeafletDynamicMap'), {
//   ssr: false,
//   loading: () => (
//     <div style={{
//       height: '100%',
//       width: '100%',
//       display: 'flex',
//       alignItems: 'center',
//       justifyContent: 'center',
//       background: '#f4f7f4',
//       color: '#4a6358',
//       fontSize: '13px',
//       fontFamily: 'DM Sans, sans-serif'
//     }}>
//       Memuat peta...
//     </div>
//   )
// });

// // ⚠️ PENTING: spread {...props} agar pasarData dan props lain ikut diteruskan
// const Map = (props) => {
//   return (
//     <div style={{ height: '420px', width: '100%' }}>
//       <DynamicMap {...props} />
//     </div>
//   );
// };

// export default Map;
// import dynamic from 'next/dynamic';

// const DynamicMap = dynamic(() => import('./LeafletDynamicMap'), {
//   ssr: false
// });

// const Map = (props) => {
//   return (
//     <div style={{ height: '100vh', width: '100%' }}>
//       <DynamicMap {...props} />
//     </div>
//   );
// };

// export default Map;
// import dynamic from 'next/dynamic';
// import L from 'leaflet';
// import 'leaflet.heat';

// const DynamicMap = dynamic(() => import('./DynamicMap'), {
//   ssr: false
// });

// // Set default sizing to control aspect ratio which will scale responsively
// // but also help avoid layout shift

// const DEFAULT_WIDTH = 600;
// const DEFAULT_HEIGHT = 600;

// const Map = (props) => {
//   const { width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT } = props;
//   return (
//     <div style={{ aspectRatio: width / height }}>
//       <DynamicMap {...props} />
//     </div>
//   )
// }

// export default Map;