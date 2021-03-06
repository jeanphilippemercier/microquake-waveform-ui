export const globals = {
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
  // Ray API endpoint
  apiRays: 'rays',
  // Traveltimes API endpoint
  apiTravelTimes: 'traveltimes',
  // Arrivals API endpoint
  apiArrivals: 'arrivals',
  // Picks interactive API endpoint relative to events API path
  apiPicksInteractive: 'batch',
  // Microquake event types API endpoint
  apiMicroquakeEventTypes: 'inventory/microquake_event_types',
  // Trace labels API endpoint
  apiTraceLabels:  'inventory/labels',
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
  linecolor: {
    'P': 'blue',
    'SV': 'green',
    'SH': 'red',
    'E': 'red',
    'N': 'green',
    'V': 'blue',
    'X': 'crimson',
    'Y': 'teal',
    'Z': 'navy',
    'C': 'black'
  },
  // context trace colors
  context: {
    'linecolor': 'black',
    'highlightColor': 'rgba(83, 223, 128, .2)',
    'highlightSingleLineColor': 'rgb(100, 199, 132)'
  },
  axis: {
    'lineColor': 'rgb(222, 226, 230)',
    'lineThickness': 1,
  },
  // thickness of the line in charts
  lineThickness: 0.6,
  // thickness of the pick lines
  picksLineThickness: 2,
  // thickness of the predicted pick lines
  predictedPicksLineThickness: 1,
  // component to determine sign for composite trace
  signComponents: ['X', 'Y', 'E', 'N', 'SH', 'SV'],
  // composite trace component code
  compositeChannelCode: 'C',
  // filter defaults
  numPoles: 4,
  lowFreqCorner: 60,
  // maximum allowed high corner frequency, do not exceed Nyquist frequency for seismic signals
  highFreqCorner: 999,
  // maximum allowed high corner frequency, do not exceed Nyquist frequency for seismic signals
  sampleRateForDistanceMode: 500,
  // resolution in milliseconds for moving the pick to left or right using the arrow keys
  pickTimeStep: 0.5,
  // enable loading waveforms with paging from API, if disabled load all waveforms at once
  enablePagingLoad: true,
  // maximum number of pages to expect
  max_num_pages: 20
};
