import type { BookingDetail } from '@handoff/contracts';

export function confirmationMessage(booking: BookingDetail, origin: string) {
  const url = `${origin}/bookings/${encodeURIComponent(booking.id)}`;
  const lines = [
    `Hi ${booking.customerName},`,
    '',
    'Your HandOff reservation is confirmed.',
    `Booking reference: ${booking.id}`,
    `Car: ${booking.vehicleTitle}`,
    `Pick-up (UTC): ${booking.extras.pickupAt.replace('T', ' ')}`,
    `Return (UTC): ${booking.extras.dropoffAt.replace('T', ' ')}`,
    `Pick-up and return: ${booking.pickupLocationName}, ${booking.pickupAddress}`,
    '',
    ...booking.quote.lines.map(
      (line) =>
        `${line.label}: ${line.amountLabel}${line.detail ? ` (${line.detail})` : ''}`,
    ),
    `Rental total: ${booking.totalLabel}`,
    '',
    'This is a demo reservation. No payment was collected.',
    'The scheduled return completes the rental. The car is available again after another 24 hours.',
    `View your booking (sign-in required): ${url}`,
  ];
  const escape = (value: string) =>
    value.replace(
      /[&<>"']/g,
      (char) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        })[char]!,
    );
  return {
    bookingId: booking.id,
    recipient: booking.customerEmail,
    subject: `Your HandOff reservation ${booking.id}`,
    text: lines.join('\n'),
    html: `<html><body><h1>Reservation confirmed</h1>${lines
      .slice(0, -1)
      .map((line) => `<p>${escape(line)}</p>`)
      .join(
        '',
      )}<p><a href="${escape(url)}">View your booking</a> (sign-in required)</p></body></html>`,
    messageId: `<${booking.id}.confirmation@handoff.local>`,
  };
}
