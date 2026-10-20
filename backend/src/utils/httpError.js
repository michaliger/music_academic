/** Error carrying an HTTP status, rendered by the error middleware. */
export const httpError = (status, message) => Object.assign(new Error(message), { status });
