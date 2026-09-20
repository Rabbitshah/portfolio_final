import type { ReactNode } from "react";

// The floating glass bar. Also used inside the mobile menu so the bar looks the same when the menu is open.
export function BarPill({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 pl-[max(clamp(12px,3vw,28px),env(safe-area-inset-left,0px))] pr-[max(clamp(12px,3vw,28px),env(safe-area-inset-right,0px))] pt-[calc(env(safe-area-inset-top,0px)+12px)] max-[759px]:pl-[max(10px,env(safe-area-inset-left,0px))] max-[759px]:pr-[max(10px,env(safe-area-inset-right,0px))]">
      <div className="pointer-events-auto mx-auto flex max-w-[70rem] items-center justify-between gap-4 rounded-full border border-line bg-glass py-2 pl-4 pr-2.5 backdrop-blur-[14px] backdrop-saturate-[1.2] max-[759px]:gap-2 max-[759px]:py-1.5 max-[759px]:pl-3.5 max-[759px]:pr-2 min-[1320px]:max-w-[77.5rem]">
        {children}
      </div>
    </div>
  );
}
