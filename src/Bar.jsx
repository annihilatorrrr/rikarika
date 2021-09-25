import React from "react";
export default (props) => {
  return (
    <div className="bar">
      <div className="icon">
        <img src="data:image/webp;base64,UklGRtYDAABXRUJQVlA4IMoDAACwGACdASpgAGAAP1WIuVWxqCUjMdgN+jAqiWYAxYSZfpij8dXw0hrRrTLd0pHlenlGmivwnYROjh6Kq7vniWnRpDkCahWP9q1y0dMtVRanARfzVlERW2kTaALC4AnuPZU5Ar8N0yQ79UNaDZ914Ljya2MjifyRWUl3yfVgMduCRhK9MLkaqw6WblIa2R1+jQYuixHO+KJnXb8M9qKmuIjCKg4AigzwS6vAE57lMFGGYqVMtGoG0lEFgVDi2GRnrc4ivYl7VRbxPJwFBbZuwAD+4iQOJrzRr7kg8a7T4bHcKvnh23r9+U3yv4U418lNJcDb6ZJYzOIPx9V/ks9T8Jwl2eYUmdP9Hws0s8zQvab47wNM5Cm2pv171oZDKExDjg25FnFavKZKTT+MDKhvPyW1XCAP/FlG/77y9XShIBQyU22sSCRakFsV2aHvL6xF6NMAdy4qZor6BD+y2Q9FeSKpmq59Gv8BVO+iLN9vFhmATmGl7NC82VcyzhmZXZ8WI8JSBSKVvPWJhQE9lT7HnQvR9r2HbdxRZ+NxN3L8/9kv8Ae03hSZUgyqurUicI5UaJBVzxviAVYroO5klv6xoxe85brSVIUI2ZEwrhdIFOEB9TqYIN75QmNZ3txHrs5TjoJTrx4K+IM5XGs8E0Hq6A5XnPVlFAoTYicuuQFZVCd/63/4dfXb5MFUTFaD9SDUKBuhDOry6tEzOr37mzTqp6KWy85uirufhykFWw+sWqNiXYgxbb6Gvg4nu4oQyHbWnp1pxgDugfB37ji50FF9GcGVYjlTbld9GsPtzvNzgENzb4Lz5M7gv39ecYr1go9G28ZOjsvuL6E8d3aOT3JSLNYylPUWpr1lxgSj6QGPVsCw3uAUSOCAYgjvy5kMQ2SnnzzrqwNHCqNMz9bz8RrE+TXYWbgKsv0jtAQ5X5dFrZS1Dx/C9DuY2xEFacRP4Lf1uiYYoAQieaRX8x/s5TeY2gIrWW/Qm4/2hMzQzqiCEgWK8trl5NUoMOOjEwe9xns5dBgM9JFQaQgUxSh43qWFlt+pa+ahONlrtD1pb4ISwIhvkEmyD2PWMcAgAytclPQvbtE3lc5Zp4Q1wX7SOqlHJSQGGDwj1MV5yfoNGfN/D2TSgTfharTEa8tD+m24o9S3X+8k4VMmx2g1Q8n8fpiPSFQ5qdeftKi2aBpSXJNQk2bQ1KJB1S0PqruEayyjzIhH1CBfI7GOst2R4kqDn51AeC5hxYsXN8IXuhZvfpV5G4EVy8LpfH81k/uo9HgrqF5JxB0mUUwK99f2mbgA" />
      </div>
      <div className="title">カリ(仮)</div>
      <input className="search hidden" type="text" placeholder="搜尋" autoComplete="off" />
      <button>清除</button>
    </div>
  );
};
