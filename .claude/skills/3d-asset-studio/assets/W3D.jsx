// React component for a rendered layer stage. Needs w3d.css (import it once) and w3d.js next to this file.
//
//   import meta from '../public/assets/plates/meta.json';
//   <W3D meta={meta} base="/assets/plates/" style={{width: 'min(320px, 100%)'}} />
//
// Props: meta (meta.json from render.mjs), base (URL folder of the files), play ('view' | 'repeat' | 'load' | 'manual'),
// motion / idle (override every layer), stagger (ms between layers, overrides meta delays), className, style.
import {useEffect, useLayoutEffect, useRef} from 'react';
import './w3d.js'; // classic script: defines window.w3d

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect; // arm before first paint

const place = s => ({'--l': s.left + '%', '--t': s.top + '%', '--w': s.w + '%', '--ox': s.origin[0] + '%', '--oy': s.origin[1] + '%'});

export default function W3D({meta, base = '', play = 'view', motion, idle, stagger, className = '', style}) {
  const ref = useRef(null);
  useIsoLayoutEffect(() => window.w3d.bind(ref.current), []);
  return (
    <div ref={ref} className={('w3d ' + className).trim()} data-play={play} aria-hidden="true"
      style={{'--w3d-ar': `${meta.frame.width}/${meta.frame.height}`, ...style}}>
      {meta.layers.map(L => (
        <div key={L.name} className="w3d-item" data-layer={L.name} data-motion={motion ?? L.motion} data-idle={idle ?? L.idle}
          style={{...L.style, '--delay': `${stagger != null ? L.index * stagger : L.delay}ms`}}>
          {L.shadow && <img className="w3d-shadow" src={base + L.shadow.src} width={L.shadow.width} height={L.shadow.height} style={place(L.shadow)} alt="" loading="lazy" decoding="async" />}
          <img className="w3d-obj" src={base + L.object.src} width={L.object.width} height={L.object.height} style={place(L.object)} alt="" loading="lazy" decoding="async" />
        </div>
      ))}
    </div>
  );
}
