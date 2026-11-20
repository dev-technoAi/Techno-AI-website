/** The drone that flies in from Section 2 remains the only drone throughout Aerial station 01. */
export function flightOwnsDrone(journey: HTMLElement, stationCount: number) {
  const rect = journey.getBoundingClientRect();
  const scrollable = Math.max(rect.height - window.innerHeight, 1);
  return -rect.top / scrollable < 1 / stationCount;
}
