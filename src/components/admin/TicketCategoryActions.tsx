"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./member-list.module.css";

export default function TicketCategoryActions({ name, edit, remove }: { name: string; edit: () => void; remove: () => void }) {
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLUListElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number; above: boolean }>();

  useEffect(() => {
    if (!position) return;
    const close = () => setPosition(undefined);
    const pointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !trigger.current?.contains(event.target) && !menu.current?.contains(event.target)) close();
    };
    const keyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        trigger.current?.focus();
      }
    };
    menu.current?.querySelector("button")?.focus();
    document.addEventListener("pointerdown", pointerDown);
    document.addEventListener("keydown", keyDown);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", pointerDown);
      document.removeEventListener("keydown", keyDown);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [position]);

  function choose(action: () => void) {
    setPosition(undefined);
    trigger.current?.focus();
    action();
  }

  return <>
    <button ref={trigger} className="btn btn-sm btn-light" type="button" aria-expanded={Boolean(position)} aria-label={`Actions for ${name}`}
      onClick={(event) => {
        if (position) { setPosition(undefined); return; }
        const rect = event.currentTarget.getBoundingClientRect();
        const above = window.innerHeight - rect.bottom < 100 && rect.top > 100;
        setPosition({ top: above ? rect.top : rect.bottom, left: Math.max(4, Math.min(rect.left, window.innerWidth - 166)), above });
      }}><i className="bx bx-dots-vertical-rounded" aria-hidden="true" /></button>
    {position && createPortal(<ul ref={menu} className={`dropdown-menu ${styles.menu}`}
      style={{ top: position.top, left: position.left, transform: position.above ? "translateY(-100%)" : undefined }}>
      <li><button type="button" className="dropdown-item" onClick={() => choose(edit)}><i className="bx bx-edit me-2" />Edit</button></li>
      <li><button type="button" className="dropdown-item text-danger" onClick={() => choose(remove)}><i className="bx bx-trash me-2" />Delete</button></li>
    </ul>, document.body)}
  </>;
}
