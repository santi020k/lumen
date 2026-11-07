// An exploded frame diagram. The handles distinguish the selected layer from its siblings.
export const SelectionArt = () => (
  <svg aria-hidden="true" className="selection-art" fill="none" focusable="false" viewBox="0 0 140 138">
    <g stroke="currentColor" strokeLinejoin="round">
      <path d="m8 91 68-35 55 29-68 36z" fill="currentColor" fillOpacity=".08" strokeOpacity=".45" />
      <path d="m8 77 68-35 55 29-68 36z" fill="currentColor" fillOpacity=".14" strokeOpacity=".65" />
      <g transform="matrix(1 -.51 .84 .44 8 59)">
        <rect fill="var(--plate-fill)" height="66" strokeWidth="1.8" width="68" />
        <path d="M8 9h52v12H8z" fill="currentColor" fillOpacity=".42" stroke="none" />
        <path d="M8 29h18v27H8z" fill="currentColor" fillOpacity=".24" stroke="none" />
        <path d="M32 31h27m-27 8h21m-21 8h16" strokeOpacity=".8" strokeWidth="2" />
      </g>
      <g className="selection-handles">
        <rect height="5" width="5" x="5.5" y="56.5" />
        <rect height="5" width="5" x="73.5" y="21.8" />
        <rect height="5" width="5" x="128.9" y="50.9" />
        <rect height="5" width="5" x="60.9" y="85.5" />
      </g>
    </g>
  </svg>
)
