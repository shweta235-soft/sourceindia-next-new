"use client";

import AdminRowActions from "./AdminRowActions";

export default function TicketCategoryActions({ name, edit, remove }: { name: string; edit: () => void; remove: () => void }) {
  return <AdminRowActions name={name} actions={[
    { label: "Edit", icon: "bx-edit", onClick: edit },
    { label: "Delete", icon: "bx-trash", danger: true, onClick: remove },
  ]} />;
}
