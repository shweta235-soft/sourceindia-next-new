import { validTicketNumber, type TicketDetails } from "@/lib/publicSupport";
import { accountRecord as record, displayText as text } from "@/lib/userDashboard";

function reply(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  if (request.headers.get("content-type")?.split(";")[0] !== "application/json") {
    return reply({ message: "Expected a JSON request." }, 415);
  }

  const input = record(await request.json().catch(() => null));
  const number = text(input.number).trim();
  const email = text(input.email).trim().toLowerCase();
  if (!validTicketNumber(number) || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return reply({ message: "Enter a valid email and ticket number." }, 400);
  }

  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, "");
  if (!base) return reply({ message: "Ticket tracking is unavailable." }, 503);

  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(20000)]);
  const init = { cache: "no-store", redirect: "manual", signal } as const;
  const denied = () => reply({ message: "Check the email and ticket number and try again." }, 404);

  try {
    const credentials = new FormData();
    credentials.set("email", email);
    credentials.set("ticketId", number);
    const lookup = await fetch(`${base}/tickets/track-ticket`, { ...init, method: "POST", body: credentials });
    if ([400, 401, 403, 404].includes(lookup.status)) return denied();
    if (!lookup.ok) throw new Error("Ticket lookup failed.");
    const access = record(await lookup.json());
    const token = text(access.token);
    const verifiedNumber = text(access.ticket_id);
    if (access.success !== true || !token || verifiedNumber.toUpperCase() !== number.toUpperCase()) return denied();

    const query = new URLSearchParams({ token });
    const response = await fetch(`${base}/tickets/support-ticket/track/${encodeURIComponent(verifiedNumber)}?${query}`, init);
    if ([301, 302, 303, 307, 308, 400, 401, 403, 404].includes(response.status)) return denied();
    if (!response.ok) throw new Error("Could not read ticket.");
    const payload = record(await response.json());
    const ticket = record(payload.ticket);
    if (text(ticket.ticket_id).toUpperCase() !== number.toUpperCase() || text(ticket.email).trim().toLowerCase() !== email) return denied();
    const name = [text(ticket.fname), text(ticket.lname)].filter(Boolean).join(" ");
    const previous = Array.isArray(payload.relatedTickets) ? payload.relatedTickets.map(record) : [];
    const replies = Array.isArray(payload.replies) ? payload.replies.map(record) : [];
    const details: TicketDetails = {
      id: text(ticket.id), number: text(ticket.ticket_id), title: text(ticket.title), email: text(ticket.email),
      name, phone: text(ticket.phone), category: text(record(ticket.TicketCategory).name), created: text(ticket.created_at),
      previous: previous.filter((row) => text(row.email).toLowerCase() === email && validTicketNumber(text(row.ticket_id))
        && text(row.ticket_id) !== text(ticket.ticket_id))
        .map((row) => ({ number: text(row.ticket_id), title: text(row.title) })),
      replies: replies.map((row) => ({
        id: text(row.id), sender: text(row.sender_type ?? row.added_by), name,
        date: text(row.createdAt ?? row.created_at), message: text(row.description ?? row.reply),
        attachment: /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,254}$/.test(text(row.attachment)) ? text(row.attachment) : "",
      })),
    };
    return reply(details);
  } catch {
    return reply({ message: "Ticket tracking could not be completed. Please try again." }, 502);
  }
}
