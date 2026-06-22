export class BffRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export class BookingRequestError extends BffRequestError {}
