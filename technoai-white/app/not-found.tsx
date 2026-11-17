// Only the home page exists in the white version so far; other links land here.
export default function NotFound() {
  return (
    <main className="wrap nf">
      <p className="eyebrow"><span aria-hidden="true">//:</span>White theme preview</p>
      <h1>This page is not in the white version yet.</h1>
      <p>Only the home page has been redesigned in white so far.</p>
      <a className="btn btn-fill" href="/">Back to home</a>
    </main>
  );
}
