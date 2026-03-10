export const STARTGG_API_KEY = process.env.STARTGG_API_KEY;
const ENDPOINT = "https://api.start.gg/gql/alpha";

const VEGAS_COORDS = "36.1716,-115.1391";
const RADIUS = "50mi";

const TOURNAMENT_QUERY = `
  query VegasTournaments($perPage: Int, $coordinates: String!, $radius: String!, $after: Timestamp, $before: Timestamp) {
    tournaments(query: {
      perPage: $perPage,
      filter: {
        location: {
          distanceFrom: $coordinates,
          distance: $radius
        },
        afterDate: $after,
        beforeDate: $before
      }
    }) {
      nodes {
        id
        name
        slug
        startAt
        venueAddress
        isOnline
        events {
          id
          name
          videogame { name }
          standings(query: { perPage: 3, page: 1 }) {
            nodes {
              placement
              entrant { name }
            }
          }
        }
      }
    }
  }
`;

export async function getVegasTournaments() {
  const now = Math.floor(Date.now() / 1000);
  const twoWeeksInSeconds = 14 * 24 * 60 * 60;

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${STARTGG_API_KEY}`,
      },
      next: { revalidate: 3600 },
      body: JSON.stringify({
        query: TOURNAMENT_QUERY,
        variables: {
          perPage: 15,
          coordinates: VEGAS_COORDS,
          radius: RADIUS,
          after: now - twoWeeksInSeconds,
          before: now + twoWeeksInSeconds
        },
      }),
    });

    const json = await response.json();
    if (json.errors) return [];
    return json.data?.tournaments?.nodes || [];
  } catch {
    return [];
  }
}