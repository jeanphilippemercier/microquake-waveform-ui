export const environment = {
  production: true,

  url: 'https://api.microquake.org/',
  // URL of the API
  apiUrl: 'https://api.microquake.org/api/v1/',
  // Auth API endpoint
  apiAuth: 'api-token-auth',
  // Sites API endpoint
  apiSites: 'sites',
  // Catalog API endpoint
  apiCatalog: 'catalog',
  // Catalog Boundaries API endpoint
  apiCatalogBoundaries: 'catalog_boundaries',
  // Events API endpoint
  apiEvents: 'events',
  // Origins API endpoint
  apiOrigins: 'origins',
  // Traveltimes API endpoint
  apiTravelTimes: 'traveltimes',
  // Arrivals API endpoint
  apiArrivals: 'arrivals',
  // Picks interactive API endpoint relative to events API path
  apiPicksInteractive: 'interactive/accept',
  // Microquake event types API endpoint
  apiMicroquakeEventTypes: 'inventory/microquake_event_types',
  // Reprocess events API endpoint
  apiReprocess: 'reprocess',
  // number of charts per page
  chartsPerPage: 7,
  // fixed duration to display, in seconds
  fixedDuration: 2,
  // steps for wheel mouse zoom sensitivity
  zoomSteps: 25,
  // sensitivity for capturing picks to drag
  snapDistance: 10,
  // colors for components line plots
  linecolor : {
    'X': 'red',
    'Y': 'green',
    'Z': 'blue',
    'C': 'black'
  },
  // context trace colors
  context: {
    'linecolor': 'indigo',
    'highlightColor': 'rgba(83, 223, 128, .2)'
  },
  // thickness of the line in charts
  lineThickness: 0.8,
  // thickness of the pick lines
  picksLineThickness: 2,
  // thickness of the predicted pick lines
  predictedPicksLineThickness: 1,
  // component to determine sign for composite trace
  signComponent: 'X',
  // composite trace component code
  compositeChannelCode: 'C',
  // filter defaults
  numPoles: 4,
  lowFreqCorner: 60,
  // maximum allowed high corner frequency, do not exceed Nyquist frequency for seismic signals
  highFreqCorner: 1000,
  // resolution in milliseconds for moving the pick to left or right using the arrow keys
  pickTimeStep: 0.5,
  // enable loading waveforms with paging from API, if disabled load all waveforms at once
  enablePagingLoad: true,
  // maximum number of pages to expect
  max_num_pages: 20

};
