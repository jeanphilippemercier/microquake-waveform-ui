// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,

  // URL of the API
  apiUrl: 'https://api.microquake.org/api/v1/',
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
  // number of charts per page
  chartsPerPage: 7,
  // fixed duration to display, in seconds
  fixedDuration: 2,
  // steps for wheel mouse zoom sensitivity
  zoomSteps: 50,
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
  highFreqCorner: 1000,
  // resolution in milliseconds for moving the pick to left or right using the arrow keys
  pickTimeStep: 0.5,
  // enable loading waveforms with paging from API, if disabled load all waveforms at once
  enablePagingLoad: true,
  // maximum number of pages to expect
  max_num_pages: 20
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
