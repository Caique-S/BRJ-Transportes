"use client";

import { useState } from "react";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <div className="fixed top-0 left-0 right-0 h-18 bg-blue-800 z-40">
        <div className="flex h-full px-4 items-center justify-between">

          <div className="flex items-center">
            <button onClick={() => setMenuOpen(true)}
              className="text-white p-2 hover:bg-blue-700 rounded"
            >
              ☰
            </button>
          </div>

          <div className="flex items-center">
            <span className="text-white font-medium">João Silva</span>
          </div>
        </div>
      </div>
    </>
  );
}
