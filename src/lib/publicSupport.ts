export type TicketDetails = {
  id: string;
  number: string;
  title: string;
  email: string;
  name: string;
  phone: string;
  category: string;
  created: string;
  previous: { number: string; title: string }[];
  replies: { id: string; sender: string; name: string; date: string; message: string; attachment: string }[];
};

export function validTicketNumber(value: string) {
  return /^[a-zA-Z0-9][a-zA-Z0-9-]{0,79}$/.test(value);
}

let tracked: { details: TicketDetails; until: number } | undefined;

export function keepTrackedTicket(details: TicketDetails) {
  tracked = { details, until: Date.now() + 5 * 60 * 1000 };
}

export function getTrackedTicket(number: string) {
  if (tracked && tracked.until < Date.now()) tracked = undefined;
  return tracked?.details.number === number ? tracked.details : undefined;
}
